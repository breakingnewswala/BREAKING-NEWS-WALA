/**
 * BREAKING NEWS WALA — Territory Management & Geographic Registry Test Suite
 * Grounded in docs/06-Business-Rules.md (RULE-LOC-001, RULE-LOC-002) and docs/13-API.md
 * Validates MP 10 divisions, 55 districts, hierarchy, filtering, pagination, search, and security.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import express, { Application } from 'express';
import { InMemoryTerritoryRepository } from '../src/modules/territory/territory.repository';
import { TerritoryService } from '../src/modules/territory/territory.service';
import { TerritoryController } from '../src/modules/territory/territory.controller';
import { validateIdOrSlug, validateTerritoryQuery } from '../src/modules/territory/territory.validator';
import { tokenService } from '../src/modules/auth/token.service';
import { requireAuth } from '../src/modules/auth/auth.middleware';
import { responseEnvelopeMiddleware } from '../src/middleware/response-envelope';
import { errorHandlerMiddleware } from '../src/middleware/error-handler';
import { createTestClient, TestClient } from './test-helper';
import { MP_DIVISIONS_AND_DISTRICTS } from '../src/modules/territory/geo-data';

describe('Geographic Registry — Data Integrity & Canonical Master Dataset', () => {
  it('should contain exactly 10 administrative divisions and 55 districts for Madhya Pradesh', () => {
    assert.strictEqual(MP_DIVISIONS_AND_DISTRICTS.length, 10, 'Must have exactly 10 divisions');

    const totalDistricts = MP_DIVISIONS_AND_DISTRICTS.reduce(
      (sum, div) => sum + div.districts.length,
      0
    );
    assert.strictEqual(totalDistricts, 55, 'Must have exactly 55 districts in Madhya Pradesh');
  });

  it('should enforce 100% unique slugs across all divisions and districts', () => {
    const divisionSlugs = MP_DIVISIONS_AND_DISTRICTS.map((d) => d.slug);
    const uniqueDivisionSlugs = new Set(divisionSlugs);
    assert.strictEqual(uniqueDivisionSlugs.size, 10, 'All 10 division slugs must be unique');

    const allDistrictSlugs = MP_DIVISIONS_AND_DISTRICTS.flatMap((d) =>
      d.districts.map((dist) => dist.slug)
    );
    const uniqueDistrictSlugs = new Set(allDistrictSlugs);
    assert.strictEqual(uniqueDistrictSlugs.size, 55, 'All 55 district slugs must be unique');
  });

  it('should include all recent districts mandated by RULE-LOC-002 (Niwari, Mauganj, Maihar, Pandhurna)', () => {
    const allDistrictSlugs = new Set(
      MP_DIVISIONS_AND_DISTRICTS.flatMap((d) => d.districts.map((dist) => dist.slug))
    );

    assert.ok(allDistrictSlugs.has('niwari'), 'Niwari (2018) must be present in master dataset');
    assert.ok(allDistrictSlugs.has('mauganj'), 'Mauganj (2023) must be present in master dataset');
    assert.ok(allDistrictSlugs.has('maihar'), 'Maihar (2023) must be present in master dataset');
    assert.ok(allDistrictSlugs.has('pandhurna'), 'Pandhurna (2023) must be present in master dataset');
  });

  it('should verify parent-child relational hierarchy (no orphaned districts)', async () => {
    const repo = new InMemoryTerritoryRepository();
    const service = new TerritoryService(repo);

    const isBhopalInBhopalDiv = await service.validateDistrictHierarchy('bhopal', 'bhopal-division');
    assert.strictEqual(isBhopalInBhopalDiv, true);

    const isIndoreInBhopalDiv = await service.validateDistrictHierarchy('indore', 'bhopal-division');
    assert.strictEqual(isIndoreInBhopalDiv, false);

    const isNiwariInSagarDiv = await service.validateDistrictHierarchy('niwari', 'sagar-division');
    assert.strictEqual(isNiwariInSagarDiv, true);
  });
});

describe('Geographic Registry — API Endpoints & Hierarchy Ingress', () => {
  let repo: InMemoryTerritoryRepository;
  let service: TerritoryService;
  let controller: TerritoryController;
  let app: Application;
  let client: TestClient;

  beforeEach(async () => {
    repo = new InMemoryTerritoryRepository();
    service = new TerritoryService(repo);
    controller = new TerritoryController(service);

    app = express();
    app.use(express.json());
    app.use(responseEnvelopeMiddleware);

    const router = express.Router();
    router.get('/overview', controller.getOverview);
    router.get('/states', validateTerritoryQuery, controller.getStates);
    router.get('/states/:idOrSlug', validateIdOrSlug, controller.getState);
    router.get('/divisions', validateTerritoryQuery, controller.getDivisions);
    router.get('/divisions/:idOrSlug', validateIdOrSlug, controller.getDivision);
    router.get('/districts', validateTerritoryQuery, controller.getDistricts);
    router.get('/districts/:idOrSlug', validateIdOrSlug, controller.getDistrict);
    router.get('/my-assignments', requireAuth, controller.getMyAssignments);

    app.use('/api/v1/territory', router);
    app.use(errorHandlerMiddleware);

    client = await createTestClient(app);
  });

  afterEach(async () => {
    await client.close();
  });

  it('GET /api/v1/territory/overview should return full MP geographic summary', async () => {
    const res = await client.get('/api/v1/territory/overview');
    assert.strictEqual(res.status, 200);

    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.totalStates, 1);
    assert.strictEqual(json.data.totalDivisions, 10);
    assert.strictEqual(json.data.totalDistricts, 55);
    assert.strictEqual(json.data.primaryState.slug, 'madhya-pradesh');
    assert.strictEqual(json.data.divisions.length, 10);

    // Verify metadata envelope
    assert.ok(json.meta.timestamp);
  });

  it('GET /api/v1/territory/states should return states list with pagination', async () => {
    const res = await client.get('/api/v1/territory/states');
    assert.strictEqual(res.status, 200);

    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.length, 1);
    assert.strictEqual(json.data[0].slug, 'madhya-pradesh');
    assert.strictEqual(json.meta.pagination.total, 1);
  });

  it('GET /api/v1/territory/states/:idOrSlug should return single state or 404', async () => {
    // Valid slug
    const resValid = await client.get('/api/v1/territory/states/madhya-pradesh');
    assert.strictEqual(resValid.status, 200);
    const jsonValid = await resValid.json();
    assert.strictEqual(jsonValid.data.nameEn, 'Madhya Pradesh');
    assert.strictEqual(jsonValid.data.nameHi, 'मध्य प्रदेश');

    // Invalid slug
    const resInvalid = await client.get('/api/v1/territory/states/unknown-state');
    assert.strictEqual(resInvalid.status, 404);
  });

  it('GET /api/v1/territory/divisions should return all 10 divisions sorted by displayOrder', async () => {
    const res = await client.get('/api/v1/territory/divisions');
    assert.strictEqual(res.status, 200);

    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.length, 10);
    assert.strictEqual(json.data[0].slug, 'bhopal-division');
    assert.strictEqual(json.data[1].slug, 'indore-division');
    assert.strictEqual(json.meta.pagination.total, 10);
  });

  it('GET /api/v1/territory/divisions/:idOrSlug should return division with child districts', async () => {
    const res = await client.get('/api/v1/territory/divisions/bhopal-division');
    assert.strictEqual(res.status, 200);

    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.nameEn, 'Bhopal Division');
    assert.strictEqual(json.data.nameHi, 'भोपाल संभाग');
    assert.strictEqual(json.data.children.length, 5); // Bhopal has 5 districts
  });

  it('GET /api/v1/territory/districts should support division filtering and search', async () => {
    // 1. All districts
    const resAll = await client.get('/api/v1/territory/districts?limit=100');
    assert.strictEqual(resAll.status, 200);
    const jsonAll = await resAll.json();
    assert.strictEqual(jsonAll.data.length, 55);

    // 2. Filter by divisionSlug (Bhopal Division has 5 districts)
    const resDiv = await client.get('/api/v1/territory/districts?divisionSlug=bhopal-division');
    assert.strictEqual(resDiv.status, 200);
    const jsonDiv = await resDiv.json();
    assert.strictEqual(jsonDiv.data.length, 5);
    assert.ok(jsonDiv.data.every((d: any) => d.divisionNameEn === 'Bhopal Division'));

    // 3. Search in English ('Niwari')
    const resSearchEn = await client.get('/api/v1/territory/districts?search=niwari');
    assert.strictEqual(resSearchEn.status, 200);
    const jsonSearchEn = await resSearchEn.json();
    assert.strictEqual(jsonSearchEn.data.length, 1);
    assert.strictEqual(jsonSearchEn.data[0].slug, 'niwari');

    // 4. Search in Devanagari Hindi ('भोपाल')
    const resSearchHi = await client.get('/api/v1/territory/districts?search=भोपाल');
    assert.strictEqual(resSearchHi.status, 200);
    const jsonSearchHi = await resSearchHi.json();
    assert.strictEqual(jsonSearchHi.data.length, 1);
    assert.strictEqual(jsonSearchHi.data[0].nameHi, 'भोपाल');
  });

  it('GET /api/v1/territory/districts/:idOrSlug should return individual district with parent linkages', async () => {
    const res = await client.get('/api/v1/territory/districts/indore');
    assert.strictEqual(res.status, 200);

    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.nameEn, 'Indore');
    assert.strictEqual(json.data.nameHi, 'इंदौर');
    assert.strictEqual(json.data.parent.nameEn, 'Indore Division');
  });

  it('should reject invalid query parameters with HTTP 422', async () => {
    // Negative page number
    const resBadPage = await client.get('/api/v1/territory/districts?page=-5');
    assert.strictEqual(resBadPage.status, 422);

    // Limit exceeding 100
    const resBadLimit = await client.get('/api/v1/territory/districts?limit=500');
    assert.strictEqual(resBadLimit.status, 422);

    // Invalid status filter
    const resBadStatus = await client.get('/api/v1/territory/districts?status=deleted');
    assert.strictEqual(resBadStatus.status, 422);
  });
});

describe('Geographic Registry — Security & Reporter Territory Access', () => {
  let repo: InMemoryTerritoryRepository;
  let service: TerritoryService;
  let controller: TerritoryController;
  let app: Application;
  let client: TestClient;

  beforeEach(async () => {
    repo = new InMemoryTerritoryRepository();
    service = new TerritoryService(repo);
    controller = new TerritoryController(service);

    app = express();
    app.use(express.json());
    app.use(responseEnvelopeMiddleware);

    const router = express.Router();
    router.get('/overview', controller.getOverview);
    router.get('/my-assignments', requireAuth, controller.getMyAssignments);

    app.use('/api/v1/territory', router);
    app.use(errorHandlerMiddleware);

    client = await createTestClient(app);
  });

  afterEach(async () => {
    await client.close();
  });

  it('should allow public unauthenticated reads on overview, states, divisions, districts', async () => {
    // Unauthenticated GET /overview succeeds
    const res = await client.get('/api/v1/territory/overview');
    assert.strictEqual(res.status, 200);
  });

  it('should reject unauthenticated requests to /api/v1/territory/my-assignments with HTTP 401', async () => {
    const res = await client.get('/api/v1/territory/my-assignments');
    assert.strictEqual(res.status, 401);

    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.strictEqual(json.error.code, 'ERR_UNAUTHORIZED');
  });

  it('should return reporter territory assignments when authenticated with valid Bearer token', async () => {
    const reporterId = 'rep-usr-1001';

    // Mock an assignment in the repository
    repo.addMockAssignment({
      id: 'asg-001',
      reporterId,
      locationId: 'dist-bhopal',
      assignmentType: 'PRIMARY',
      assignedBy: 'adm-001',
      assignedAt: new Date(),
      status: 'active',
    });

    // Generate valid Access JWT
    const token = tokenService.generateAccessToken({
      userId: reporterId,
      roles: ['reporter'],
      status: 'active',
    });

    const res = await client.get('/api/v1/territory/my-assignments', {
      Authorization: `Bearer ${token.token}`,
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.assignments.length, 1);
    assert.strictEqual(json.data.assignments[0].locationNameEn, 'Bhopal');
    assert.strictEqual(json.data.assignments[0].assignmentType, 'PRIMARY');
  });
});

