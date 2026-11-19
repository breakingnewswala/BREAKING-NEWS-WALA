/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * STEP 16 — Critical Security Remediation & Concurrency Verification Suite
 * 
 * Verifies:
 * - FINDING-15-01 (P1): Creation-Time Publishing Security Bypass Prevention
 *   (POST /api/v1/epaper/editions rejects PUBLISHED with HTTP 400, direct adapter unconditionally sets DRAFT)
 * - FINDING-15-02 (P1): Atomic WhatsApp Quota Enforcement & Mutex Concurrency
 *   (Elimination of TOCTOU race condition: 10 parallel requests with 1 remaining quota slot -> exactly 1 succeeds, 9 return HTTP 429)
 * - FINDING-15-03 (P2): Master Admin Reporter WhatsApp Quota API & Permission Boundaries
 *   (Admin PUT /epaper/whatsapp/quota/:reporterId succeeds; non-admin receives 403; validation of negative values)
 * - FINDING-15-04 (P3): Status Normalization Hardening
 *   (Whitespace trimming and case normalization on PATCH /status and PUT/PATCH /editions/:id; rejection of invalid statuses)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { handleApiRequest, signToken } from '../src/server/apiEngine.js';
import { getPersistenceAdapter } from '../src/server/persistence/adapter.js';
import { FirestoreAdapter } from '../src/server/persistence/firestoreAdapter.js';

process.env.NODE_ENV = 'test';

const adapter = getPersistenceAdapter();

function createTestServer() {
  let server;
  let baseUrl;

  const start = () =>
    new Promise((resolve) => {
      server = http.createServer(async (req, res) => {
        try {
          await handleApiRequest(req, res);
        } catch (err) {
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        }
      });
      server.listen(0, '127.0.0.1', () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve(baseUrl);
      });
    });

  const stop = () =>
    new Promise((resolve) => {
      if (server) server.close(resolve);
      else resolve();
    });

  const request = (path, options = {}) =>
    new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const req = http.request(
        url,
        {
          method: options.method || 'GET',
          headers: options.headers || {},
        },
        (res) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            const buffer = Buffer.concat(chunks);
            let parsed = null;
            const ct = res.headers['content-type'] || '';
            if (ct.includes('application/json')) {
              try {
                parsed = JSON.parse(buffer.toString('utf8'));
              } catch {
                parsed = null;
              }
            }
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: parsed,
              rawBody: buffer,
            });
          });
        }
      );
      req.on('error', reject);
      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      req.end();
    });

  return { start, stop, request };
}

function getMasterAdminToken() {
  return signToken({
    id: 'usr-master-admin-01',
    email: 'breakingnewswala.com@gmail.com',
    fullName: 'मुख्य व्यवस्थापक',
    roles: ['MASTER_ADMIN', 'CHIEF_EDITOR', 'ADMIN'],
  });
}

function getEditorToken() {
  return signToken({
    id: 'usr-editor-01',
    email: 'editor@breakingnewswala.com',
    fullName: 'संपादक',
    roles: ['EDITOR', 'CHIEF_EDITOR'],
  });
}

function getReporterToken(id = 'usr-reporter-race-01') {
  return signToken({
    id,
    email: 'reporter-race@breakingnewswala.com',
    fullName: 'संवाददाता रेस टेस्ट',
    roles: ['REPORTER'],
  });
}

test('STEP 16: Security Remediation, WhatsApp Quota Atomic Mutex & Status Hardening', async (t) => {
  const server = createTestServer();
  await server.start();

  const masterAdminToken = getMasterAdminToken();
  const editorToken = getEditorToken();
  const raceReporterId = 'usr-reporter-race-' + Date.now();
  const reporterToken = getReporterToken(raceReporterId);

  // =========================================================================
  // 1. FINDING-15-01: Creation-Time Publishing Security Bypass Prevention
  // =========================================================================
  await t.test('FINDING-15-01.1: Reject POST /editions with status=PUBLISHED (exact)', async () => {
    const res = await server.request('/api/v1/epaper/editions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${editorToken}`,
      },
      body: {
        title: 'बाईपास टेस्ट संस्करण 1',
        editionType: 'MAIN',
        publicationDate: '2026-11-20',
        districtId: 'bhopal',
        districtName: 'भोपाल',
        status: 'PUBLISHED',
        totalPages: 4,
      },
    });

    assert.equal(res.status, 400, 'Must reject creation with PUBLISHED status');
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'ERR_INVALID_OPERATION');
  });

  await t.test('FINDING-15-01.2: Reject POST /editions with status="  published  " (case & whitespace bypass)', async () => {
    const res = await server.request('/api/v1/epaper/editions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${editorToken}`,
      },
      body: {
        title: 'बाईपास टेस्ट संस्करण 2',
        editionType: 'MAIN',
        publicationDate: '2026-11-20',
        districtId: 'bhopal',
        districtName: 'भोपाल',
        status: '  published  ',
        totalPages: 4,
      },
    });

    assert.equal(res.status, 400, 'Must reject creation with whitespace/lowercase published status');
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'ERR_INVALID_OPERATION');
  });

  await t.test('FINDING-15-01.3: Direct adapter.createEpaperEditionWithPages forces DRAFT even if PUBLISHED passed', async () => {
    const created = await adapter.createEpaperEditionWithPages(
      {
        title: 'डायरेक्ट एडाप्टर टेस्ट',
        editionType: 'MAIN',
        publicationDate: '2026-11-20',
        districtId: 'indore',
        districtName: 'इंदौर',
        status: 'PUBLISHED',
        totalPages: 2,
      },
      { id: 'usr-admin-direct', fullName: 'एडमिन' }
    );

    assert.ok(created.edition, 'Edition must be created');
    assert.equal(created.edition.status, 'DRAFT', 'Adapter must unconditionally enforce status=DRAFT');
  });

  // =========================================================================
  // 2. FINDING-15-02: WhatsApp Quota Atomic Enforcement & TOCTOU Race Condition
  // =========================================================================
  await t.test('FINDING-15-02.1: Initialize reporter quota to exactly 1 slot for today', async () => {
    // Set custom quota of 1 daily generation for the test reporter
    await adapter.setReporterWhatsAppQuota(raceReporterId, 1);

    const quota = await adapter.getReporterWhatsAppQuota(raceReporterId);
    assert.equal(quota.reporterId, raceReporterId);
    assert.equal(quota.maxDaily, 1);
    assert.equal(quota.used, 0);
    assert.equal(quota.remaining, 1);
    assert.equal(quota.quotaExceeded, false);
  });

  await t.test('FINDING-15-02.2: Concurrency test: 10 parallel requests with 1 slot -> exactly 1 succeeds, 9 fail with 429', async () => {
    // We fire 10 simultaneous requests to generate a WhatsApp card
    const makeRequest = (i) =>
      server.request('/api/v1/epaper/whatsapp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${reporterToken}`,
        },
        body: {
          format: '1:1',
          headline: `दौड़ प्रतियोगिता समाचार अपडेट #${i}`,
          body: 'मध्य प्रदेश राज्य स्तरीय खेल महोत्सव का शुभारम्भ हुआ।',
          districtName: 'भोपाल',
        },
      });

    const requests = Array.from({ length: 10 }, (_, idx) => makeRequest(idx + 1));
    const responses = await Promise.all(requests);

    const successResponses = responses.filter((r) => r.status === 201);
    const rateLimitedResponses = responses.filter((r) => r.status === 429);
    const otherResponses = responses.filter((r) => r.status !== 201 && r.status !== 429);

    assert.equal(otherResponses.length, 0, `No unexpected status codes: ${otherResponses.map((r) => `${r.status}: ${JSON.stringify(r.body)}`).join(', ')}`);
    assert.equal(successResponses.length, 1, `Exactly 1 request must succeed (got ${successResponses.length})`);
    assert.equal(rateLimitedResponses.length, 9, `Exactly 9 requests must be rejected with HTTP 429 (got ${rateLimitedResponses.length})`);

    // Verify rate limit payload
    for (const r of rateLimitedResponses) {
      assert.equal(r.body.success, false);
      assert.equal(r.body.error.code, 'ERR_QUOTA_EXHAUSTED');
    }

    // Verify final quota state in persistence
    const finalQuota = await adapter.getReporterWhatsAppQuota(raceReporterId);
    assert.equal(finalQuota.used, 1, 'Used count must be exactly 1');
    assert.equal(finalQuota.remaining, 0, 'Remaining count must be 0');
    assert.equal(finalQuota.quotaExceeded, true, 'Quota must be marked exceeded');
  });

  await t.test('FINDING-15-02.3: Subsequent sequential request also returns HTTP 429', async () => {
    const res = await server.request('/api/v1/epaper/whatsapp/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${reporterToken}`,
      },
      body: {
        format: '1:1',
        headline: 'अतिरिक्त प्रयास',
        body: 'विवरण...',
        districtName: 'भोपाल',
      },
    });

    assert.equal(res.status, 429);
    assert.equal(res.body.error.code, 'ERR_QUOTA_EXHAUSTED');
  });

  // =========================================================================
  // 3. FINDING-15-03: Master Admin Reporter Quota Management
  // =========================================================================
  await t.test('FINDING-15-03.1: Non-admin receives HTTP 403 when attempting to modify reporter quota', async () => {
    const res = await server.request(`/api/v1/epaper/whatsapp/quota/${encodeURIComponent(raceReporterId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${reporterToken}`,
      },
      body: { maxDaily: 50 },
    });

    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, 'ERR_FORBIDDEN');
  });

  await t.test('FINDING-15-03.2: Master Admin cannot set negative quota (HTTP 400)', async () => {
    const res = await server.request(`/api/v1/epaper/whatsapp/quota/${encodeURIComponent(raceReporterId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${masterAdminToken}`,
      },
      body: { maxDaily: -10 },
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'ERR_VALIDATION');
  });

  await t.test('FINDING-15-03.3: Master Admin updates quota to 35 -> succeeds and unlocks quota', async () => {
    const res = await server.request(`/api/v1/epaper/whatsapp/quota/${encodeURIComponent(raceReporterId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${masterAdminToken}`,
      },
      body: { maxDaily: 35 },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.maxDaily, 35);
    assert.equal(res.body.data.reporterId, raceReporterId);

    // Verify reporter's updated quota status
    const quotaCheck = await server.request('/api/v1/epaper/whatsapp/quota', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${reporterToken}`,
      },
    });

    assert.equal(quotaCheck.status, 200);
    assert.equal(quotaCheck.body.data.maxDaily, 35);
    assert.equal(quotaCheck.body.data.used, 1);
    assert.equal(quotaCheck.body.data.remaining, 34);
    assert.equal(quotaCheck.body.data.quotaExceeded, false);
  });

  // =========================================================================
  // 4. FINDING-15-04: Status Normalization Hardening
  // =========================================================================
  let normEditionId = '';
  let normVersion = 1;

  await t.test('FINDING-15-04.1: Create valid edition for normalization testing', async () => {
    const res = await server.request('/api/v1/epaper/editions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${editorToken}`,
      },
      body: {
        title: 'नॉर्मलाइजेशन टेस्ट संस्करण',
        editionType: 'MAIN',
        publicationDate: '2026-11-21',
        districtId: 'ujjain',
        districtName: 'उज्जैन',
        totalPages: 2,
      },
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.edition.status, 'DRAFT');
    normEditionId = res.body.data.edition.id;
    normVersion = res.body.data.edition.version || 1;
  });

  await t.test('FINDING-15-04.2: PATCH /status rejects untrimmed lowercase " published " with 400 ERR_INVALID_OPERATION', async () => {
    const res = await server.request(`/api/v1/epaper/editions/${encodeURIComponent(normEditionId)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${editorToken}`,
      },
      body: {
        status: '   published   ',
        version: normVersion,
      },
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'ERR_INVALID_OPERATION');
  });

  await t.test('FINDING-15-04.3: PATCH /status normalizes "  editorial_review  " to EDITORIAL_REVIEW and succeeds', async () => {
    const res = await server.request(`/api/v1/epaper/editions/${encodeURIComponent(normEditionId)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${editorToken}`,
      },
      body: {
        status: '  editorial_review  ',
        version: normVersion,
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'EDITORIAL_REVIEW');
    normVersion = res.body.data.version;
  });

  await t.test('FINDING-15-04.4: PATCH /status rejects invalid status " INVALID_STATE " with 400 ERR_VALIDATION', async () => {
    const res = await server.request(`/api/v1/epaper/editions/${encodeURIComponent(normEditionId)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${editorToken}`,
      },
      body: {
        status: '  INVALID_STATE  ',
        version: normVersion,
      },
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'ERR_VALIDATION');
  });

  await t.test('FINDING-15-04.5: PUT /editions/:id rejects untrimmed " published " with 400 ERR_INVALID_OPERATION', async () => {
    const res = await server.request(`/api/v1/epaper/editions/${encodeURIComponent(normEditionId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${editorToken}`,
      },
      body: {
        title: 'अपडेटेड नाम',
        status: '  published  ',
        version: normVersion,
      },
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'ERR_INVALID_OPERATION');
  });

  await t.test('FINDING-15-04.6: PUT /editions/:id accepts untrimmed " draft " and normalizes to DRAFT', async () => {
    const res = await server.request(`/api/v1/epaper/editions/${encodeURIComponent(normEditionId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${editorToken}`,
      },
      body: {
        title: 'अपडेटेड संस्करण नाम',
        status: '  draft  ',
        version: normVersion,
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'DRAFT');
  });

  // =========================================================================
  // 5. FirestoreAdapter Invariant & Concurrency Verification
  // =========================================================================
  await t.test('FINDING-15-01.4: FirestoreAdapter.createEpaperEditionWithPages forces DRAFT even if PUBLISHED passed', async () => {
    const fsAdapter = new FirestoreAdapter();
    const created = await fsAdapter.createEpaperEditionWithPages(
      {
        title: 'फायरस्टोर टेस्ट संस्करण',
        editionType: 'MAIN',
        publicationDate: '2026-11-20',
        districtId: 'gwalior',
        districtName: 'ग्वालियर',
        status: 'PUBLISHED',
        totalPages: 2,
      },
      { id: 'usr-admin-fs', fullName: 'फायरस्टोर एडमिन' }
    );

    assert.ok(created.edition, 'Edition must be created');
    assert.equal(created.edition.status, 'DRAFT', 'FirestoreAdapter must unconditionally enforce status=DRAFT');
  });

  await t.test('FINDING-15-02.4: FirestoreAdapter concurrency: 10 parallel requests with 1 slot -> 1 succeeds, 9 fail with 429', async () => {
    const fsAdapter = new FirestoreAdapter();
    const fsReporterId = 'usr-rep-fs-' + Date.now();
    await fsAdapter.setReporterWhatsAppQuota(fsReporterId, 1);

    const makeFsRequest = (i) =>
      fsAdapter
        .atomicSaveEpaperWhatsAppGeneration(
          {
            format: '1:1',
            headline: `फायरस्टोर कार्ड #${i}`,
            body: 'विवरण...',
            reporterId: fsReporterId,
          },
          { id: fsReporterId }
        )
        .then((rec) => ({ success: true, rec }))
        .catch((err) => ({ success: false, code: err.code, statusCode: err.statusCode }));

    const requests = Array.from({ length: 10 }, (_, idx) => makeFsRequest(idx + 1));
    const results = await Promise.all(requests);

    const success = results.filter((r) => r.success);
    const rateLimited = results.filter((r) => !r.success && r.statusCode === 429 && r.code === 'ERR_QUOTA_EXHAUSTED');

    assert.equal(success.length, 1, `FirestoreAdapter: Exactly 1 request must succeed (got ${success.length})`);
    assert.equal(rateLimited.length, 9, `FirestoreAdapter: Exactly 9 requests must be rejected with 429 (got ${rateLimited.length})`);

    const finalFsQuota = await fsAdapter.getReporterWhatsAppQuota(fsReporterId);
    assert.equal(finalFsQuota.used, 1);
    assert.equal(finalFsQuota.remaining, 0);
    assert.equal(finalFsQuota.quotaExceeded, true);
  });

  await server.stop();
});
