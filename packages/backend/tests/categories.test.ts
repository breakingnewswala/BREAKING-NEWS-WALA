/**
 * BREAKING NEWS WALA — Master News Category Registry & Taxonomies Test Suite
 * Grounded in docs/01-PRD.md (Section 21.1 & 21.2), docs/08-Sitemap.md (Section 5.1),
 * docs/06-Business-Rules.md (RULE-CAT-001 through RULE-CAT-006), and docs/13-API.md (PUB-07)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../src/app';
import { createTestClient, TestClient } from './test-helper';
import {
  CANONICAL_CATEGORIES_DATA,
  ALLOWED_ICON_TOKENS,
  isValidIconToken,
} from '../src/modules/categories/category-data';
import { InMemoryCategoryRepository } from '../src/modules/categories/category.repository';
import { CategoryService } from '../src/modules/categories/category.service';

describe('Category Registry — Canonical Master Dataset & Data Integrity (PRD Section 21.1)', () => {
  it('should contain exactly 21 canonical categories', () => {
    assert.strictEqual(
      CANONICAL_CATEGORIES_DATA.length,
      21,
      'Must contain exactly 21 canonical categories'
    );
  });

  it('should verify all 21 categories have valid displayOrder 1 through 21 without gaps', () => {
    const orders = CANONICAL_CATEGORIES_DATA.map((c) => c.displayOrder);
    const expected = Array.from({ length: 21 }, (_, i) => i + 1);
    assert.deepStrictEqual(orders, expected, 'Display orders must be strictly 1 through 21 in sequence');
  });

  it('should enforce 100% unique slugs across all 21 categories', () => {
    const slugs = CANONICAL_CATEGORIES_DATA.map((c) => c.slug);
    const uniqueSlugs = new Set(slugs);
    assert.strictEqual(uniqueSlugs.size, 21, 'All 21 primary category slugs must be unique');
  });

  it('should enforce unique slugs across all child subcategories', () => {
    const subSlugs = CANONICAL_CATEGORIES_DATA.flatMap((c) => c.subcategories.map((s) => s.slug));
    const uniqueSubSlugs = new Set(subSlugs);
    assert.strictEqual(
      uniqueSubSlugs.size,
      subSlugs.length,
      'All child subcategory slugs must be globally unique'
    );
  });

  it('should verify mandatory multilingual attributes (Hindi Devanagari & English names) for all categories and subcategories (RULE-CAT-001)', () => {
    // Regex for Devanagari Unicode range: \u0900-\u097F
    const devanagariRegex = /[\u0900-\u097F]/;

    for (const cat of CANONICAL_CATEGORIES_DATA) {
      assert.ok(cat.nameHi && cat.nameHi.trim().length > 0, `Category ${cat.slug} must have nameHi`);
      assert.ok(devanagariRegex.test(cat.nameHi), `Category ${cat.slug} nameHi must contain Devanagari characters`);
      assert.ok(cat.nameEn && cat.nameEn.trim().length > 0, `Category ${cat.slug} must have nameEn`);
      assert.ok(/^[a-z0-9-]+$/.test(cat.slug), `Category ${cat.slug} must have valid lowercase ASCII slug`);

      for (const sub of cat.subcategories) {
        assert.ok(sub.nameHi && sub.nameHi.trim().length > 0, `Subcategory ${sub.slug} must have nameHi`);
        assert.ok(devanagariRegex.test(sub.nameHi), `Subcategory ${sub.slug} nameHi must contain Devanagari characters`);
        assert.ok(sub.nameEn && sub.nameEn.trim().length > 0, `Subcategory ${sub.slug} must have nameEn`);
        assert.ok(/^[a-z0-9-]+$/.test(sub.slug), `Subcategory ${sub.slug} must have valid lowercase ASCII slug`);
      }
    }
  });

  it('should verify that all icon tokens are members of the controlled semantic icon token whitelist', () => {
    for (const cat of CANONICAL_CATEGORIES_DATA) {
      assert.ok(
        isValidIconToken(cat.iconToken),
        `Icon token "${cat.iconToken}" for category "${cat.slug}" must be in allowed icon tokens whitelist`
      );

      for (const sub of cat.subcategories) {
        assert.ok(
          isValidIconToken(sub.iconToken),
          `Icon token "${sub.iconToken}" for subcategory "${sub.slug}" must be in allowed icon tokens whitelist`
        );
      }
    }
  });
});

describe('Category Registry — In-Memory Taxonomy Service Unit Tests', () => {
  let repo: InMemoryCategoryRepository;
  let service: CategoryService;

  before(() => {
    repo = new InMemoryCategoryRepository();
    service = new CategoryService(repo);
  });

  it('should return overview with exactly 21 active categories and their subcategories', async () => {
    const overview = await service.getOverview();
    assert.strictEqual(overview.totalCategories, 21);
    assert.strictEqual(overview.activeCategoriesCount, 21);
    assert.ok(overview.totalSubcategories > 50, 'Must have populated subcategories across the 21 categories');
    assert.strictEqual(overview.categories.length, 21);
    assert.strictEqual(overview.categories[0].slug, 'top-news');
    assert.strictEqual(overview.categories[20].slug, 'viral-news');
  });

  it('should find single category by slug and by UUID', async () => {
    const catBySlug = await service.getCategoryBySlugOrId('politics');
    assert.ok(catBySlug);
    assert.strictEqual(catBySlug.nameHi, 'राजनीति');
    assert.strictEqual(catBySlug.slug, 'politics');
    assert.ok(catBySlug.children && catBySlug.children.length > 0);

    const catById = await service.getCategoryBySlugOrId(catBySlug.id);
    assert.strictEqual(catById.slug, 'politics');
  });

  it('should retrieve subcategories for a category', async () => {
    const subcategories = await service.getSubcategories('sports');
    assert.ok(Array.isArray(subcategories));
    assert.ok(subcategories.length >= 3);
    const subSlugs = subcategories.map((s) => s.slug);
    assert.ok(subSlugs.includes('cricket'));
    assert.ok(subSlugs.includes('football'));
  });

  it('should validate valid primary category alone (Taxonomy Validation)', async () => {
    const politics = await service.getCategoryBySlugOrId('politics');
    const result = await service.validateArticleTaxonomy(politics.id);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.primaryCategory.slug, 'politics');
    assert.strictEqual(result.subcategory, undefined);
  });

  it('should validate valid primary category + its own child subcategory', async () => {
    const sports = await service.getCategoryBySlugOrId('sports');
    const cricket = await service.getCategoryBySlugOrId('cricket');

    const result = await service.validateArticleTaxonomy(sports.id, cricket.id);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.primaryCategory.slug, 'sports');
    assert.strictEqual(result.subcategory?.slug, 'cricket');
  });

  it('should reject taxonomy when subcategory belongs to a different parent category', async () => {
    const politics = await service.getCategoryBySlugOrId('politics');
    const cricket = await service.getCategoryBySlugOrId('cricket'); // cricket belongs to sports, not politics

    await assert.rejects(
      async () => {
        await service.validateArticleTaxonomy(politics.id, cricket.id);
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 422);
        assert.ok(err.message.includes('belongs to parent'));
        return true;
      }
    );
  });

  it('should reject taxonomy when a subcategory is passed as the primary category (RULE-CAT-004 Two-Tier constraint)', async () => {
    const cricket = await service.getCategoryBySlugOrId('cricket');

    await assert.rejects(
      async () => {
        await service.validateArticleTaxonomy(cricket.id);
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 422);
        assert.ok(err.message.includes('RULE-CAT-004 violation'));
        return true;
      }
    );
  });

  it('should reject non-existent primary category with 404', async () => {
    await assert.rejects(
      async () => {
        await service.validateArticleTaxonomy('non-existent-category-slug');
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 404);
        return true;
      }
    );
  });

  it('should reject non-existent subcategory with 404', async () => {
    const politics = await service.getCategoryBySlugOrId('politics');
    await assert.rejects(
      async () => {
        await service.validateArticleTaxonomy(politics.id, 'non-existent-sub');
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 404);
        return true;
      }
    );
  });
});

describe('Category Registry — HTTP REST API Integration Suite', () => {
  let client: TestClient;

  before(async () => {
    const app = createApp();
    client = await createTestClient(app);
  });

  after(async () => {
    await client.close();
  });

  it('GET /api/v1/categories/overview — should return overview of 21 canonical categories', async () => {
    const res = await client.get('/api/v1/categories/overview');
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.totalCategories, 21);
    assert.strictEqual(body.data.activeCategoriesCount, 21);
    assert.strictEqual(body.data.categories.length, 21);

    // Verify ordering
    for (let i = 0; i < 21; i++) {
      assert.strictEqual(body.data.categories[i].displayOrder, i + 1);
    }
  });

  it('GET /api/v1/public/categories — should serve canonical PUB-07 public category list', async () => {
    const res = await client.get('/api/v1/public/categories');
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.strictEqual(body.data.length, 21);
    assert.strictEqual(body.data[0].slug, 'top-news');
    assert.ok(body.data[0].subcategories.length > 0);
  });

  it('GET /api/v1/categories — should return paginated list of categories', async () => {
    const res = await client.get('/api/v1/categories?page=1&limit=10');
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 10);
    assert.strictEqual(body.meta.pagination.page, 1);
    assert.strictEqual(body.meta.pagination.limit, 10);
    assert.ok(body.meta.pagination.total > 21);
  });

  it('GET /api/v1/categories?parentId=null — should return only top-level categories', async () => {
    const res = await client.get('/api/v1/categories?parentId=null');
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 21);
    for (const cat of body.data) {
      assert.strictEqual(cat.parentId, null);
    }
  });

  it('GET /api/v1/categories?search=राजनीति — should search by Devanagari Hindi name', async () => {
    const res = await client.get('/api/v1/categories?search=' + encodeURIComponent('राजनीति'));
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.length >= 1);
    const found = body.data.some((c: any) => c.slug === 'politics');
    assert.ok(found, 'Search should locate the politics category');
  });

  it('GET /api/v1/categories?search=technology — should search by English name / slug', async () => {
    const res = await client.get('/api/v1/categories?search=technology');
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.length >= 1);
    assert.strictEqual(body.data[0].slug, 'technology');
  });

  it('GET /api/v1/categories/:idOrSlug — should return category by slug with child subcategories', async () => {
    const res = await client.get('/api/v1/categories/madhya-pradesh');
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.slug, 'madhya-pradesh');
    assert.strictEqual(body.data.nameHi, 'मध्य प्रदेश');
    assert.ok(Array.isArray(body.data.children));
    assert.strictEqual(body.data.children.length, 10, 'MP should have 10 division subcategories');
  });

  it('GET /api/v1/categories/:idOrSlug — should return 404 for unknown category slug', async () => {
    const res = await client.get('/api/v1/categories/unknown-category-xyz');
    assert.strictEqual(res.status, 404);

    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'ERR_NOT_FOUND');
  });

  it('GET /api/v1/categories/:idOrSlug — should return 422 for malformed identifier', async () => {
    const res = await client.get('/api/v1/categories/INVALID$$$NAME');
    assert.strictEqual(res.status, 422);

    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'ERR_VALIDATION_FAILED');
  });

  it('GET /api/v1/categories/:idOrSlug/subcategories — should return child subcategories', async () => {
    const res = await client.get('/api/v1/categories/entertainment/subcategories');
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 3);
    const subSlugs = body.data.map((s: any) => s.slug);
    assert.ok(subSlugs.includes('bollywood'));
  });

  it('POST /api/v1/categories/validate-taxonomy — should validate article taxonomy successfully', async () => {
    const res = await client.post('/api/v1/categories/validate-taxonomy', {
      primaryCategoryId: 'sports',
      subcategoryId: 'cricket',
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.valid, true);
    assert.strictEqual(body.data.primaryCategory.slug, 'sports');
    assert.strictEqual(body.data.subcategory.slug, 'cricket');
  });

  it('POST /api/v1/categories/validate-taxonomy — should reject mismatched subcategory with 422', async () => {
    const res = await client.post('/api/v1/categories/validate-taxonomy', {
      primaryCategoryId: 'politics',
      subcategoryId: 'cricket', // cricket belongs to sports, not politics
    });

    assert.strictEqual(res.status, 422);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'ERR_VALIDATION_FAILED');
  });

  it('GET /api/v1/categories?limit=999 — should reject query validation on invalid limit (HTTP 422)', async () => {
    const res = await client.get('/api/v1/categories?limit=999');
    assert.strictEqual(res.status, 422);

    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'ERR_VALIDATION_FAILED');
  });
});

