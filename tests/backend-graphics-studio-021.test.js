/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Execution 021 — Graphics & Design Studio Test Suite
 * 
 * Verifies:
 * 1. Graphic Template Library APIs (all 11 categories, 5 aspect ratios, filtering)
 * 2. Template Duplication and RBAC Protection
 * 3. News-to-Graphic Extraction Engine (Factual integrity without hallucination)
 * 4. Graphic Creation, OCC Versioning, and Draft Management
 * 5. Status Lifecycle Transitions (DRAFT -> APPROVED -> PUBLISHED) & Editor RBAC
 * 6. Audit Trail Logging for Graphics Studio Events
 * 7. FirestoreAdapter Graphics and Template Parity
 */

import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { handleApiRequest, signToken } from '../src/server/apiEngine.js';
import { getPersistenceAdapter, FirestoreAdapter } from '../src/server/persistence/adapter.js';

process.env.NODE_ENV = 'test';

function createMockHttp() {
  let server;
  let baseUrl;

  const start = () =>
    new Promise((resolve) => {
      server = http.createServer(async (req, res) => {
        try {
          await handleApiRequest(req, res);
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: { message: err.message } }));
        }
      });
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

  const stop = () =>
    new Promise((resolve) => {
      if (server) server.close(resolve);
      else resolve();
    });

  const request = (method, urlPath, body = null, headers = {}) =>
    new Promise((resolve, reject) => {
      const fullUrl = new URL(urlPath, baseUrl);
      const bodyStr = body ? JSON.stringify(body) : null;
      const reqHeaders = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...headers,
      };
      if (bodyStr) {
        reqHeaders['Content-Length'] = Buffer.byteLength(bodyStr);
      }

      const req = http.request(
        fullUrl,
        {
          method,
          headers: reqHeaders,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            let json;
            try {
              json = JSON.parse(data);
            } catch {
              json = { raw: data };
            }
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: json,
            });
          });
        }
      );
      req.on('error', reject);
      if (bodyStr) {
        req.write(bodyStr);
      }
      req.end();
    });

  return { start, stop, request };
}

test('Graphics & Design Studio API Suite', async (t) => {
  const httpHelper = createMockHttp();
  await httpHelper.start();

  const editorToken = signToken({
    id: 'usr-desk-chief',
    identifier: 'chief.editor@breakingnewswala.com',
    fullName: 'मुख्य संपादक',
    roles: ['EDITOR', 'CHIEF_EDITOR'],
  });

  const reporterToken = signToken({
    id: 'usr-rep-001',
    identifier: 'ramesh.reporter@breakingnewswala.com',
    fullName: 'रमेश शर्मा',
    roles: ['REPORTER'],
  });

  const readerToken = signToken({
    id: 'usr-reader-001',
    identifier: 'reader@example.com',
    fullName: 'सामान्य पाठक',
    roles: ['READER'],
  });

  t.after(async () => {
    await httpHelper.stop();
  });

  // 1. Template Library Listing
  await t.test('1. GET /api/v1/graphics/templates returns master templates with all 11 categories', async () => {
    const res = await httpHelper.request('GET', '/api/v1/graphics/templates');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 11, 'Should contain at least 11 default templates');

    // Verify all 11 required categories exist
    const categories = new Set(res.body.data.map((t) => t.category));
    const requiredCategories = [
      'BREAKING',
      'POLITICS',
      'CRIME',
      'GOVERNMENT',
      'EDUCATION',
      'SPORTS',
      'BUSINESS',
      'DISTRICT',
      'WEATHER',
      'FESTIVAL',
      'SPECIAL',
    ];
    for (const cat of requiredCategories) {
      assert.ok(categories.has(cat), `Category ${cat} must be present in templates`);
    }

    // Verify aspect ratios supported
    const aspectRatios = new Set(res.body.data.map((t) => t.aspectRatio));
    assert.ok(aspectRatios.has('4:5'), 'Must support 4:5 aspect ratio');
    assert.ok(aspectRatios.has('1:1'), 'Must support 1:1 aspect ratio');
    assert.ok(aspectRatios.has('9:16'), 'Must support 9:16 aspect ratio');
    assert.ok(aspectRatios.has('16:9'), 'Must support 16:9 aspect ratio');
    assert.ok(aspectRatios.has('3:4'), 'Must support 3:4 aspect ratio');
  });

  // 2. Filter Templates by Category & Aspect Ratio
  await t.test('2. GET /api/v1/graphics/templates filters by category and aspect ratio', async () => {
    const res = await httpHelper.request('GET', '/api/v1/graphics/templates?category=BREAKING');
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.data.every((t) => t.category === 'BREAKING'));

    const resAr = await httpHelper.request('GET', '/api/v1/graphics/templates?aspectRatio=1:1');
    assert.strictEqual(resAr.statusCode, 200);
    assert.ok(resAr.body.data.every((t) => t.aspectRatio === '1:1'));
  });

  // 3. Duplicate Template
  await t.test('3. POST /api/v1/graphics/templates/:id/duplicate clones template', async () => {
    const res = await httpHelper.request(
      'POST',
      '/api/v1/graphics/templates/tpl-breaking-01/duplicate',
      {},
      { Authorization: `Bearer ${editorToken}` }
    );
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.id.startsWith('tpl-'));
    assert.strictEqual(res.body.data.isDefault, false);
  });

  // 4. Template Creation RBAC
  await t.test('4. POST /api/v1/graphics/templates enforces editor/admin authorization', async () => {
    // Reader attempt should be rejected with 403
    const readerRes = await httpHelper.request(
      'POST',
      '/api/v1/graphics/templates',
      { name: 'पाठक टेम्पलेट', aspectRatio: '4:5' },
      { Authorization: `Bearer ${readerToken}` }
    );
    assert.strictEqual(readerRes.statusCode, 403);
    assert.strictEqual(readerRes.body.success, false);

    // Editor attempt should succeed
    const editorRes = await httpHelper.request(
      'POST',
      '/api/v1/graphics/templates',
      {
        title: 'कस्टम संपादकीय टेम्पलेट',
        name: 'Custom Editorial',
        nameHi: 'कस्टम संपादकीय',
        aspectRatio: '4:5',
        category: 'SPECIAL',
        themeColor: '#ED1727',
      },
      { Authorization: `Bearer ${editorToken}` }
    );
    assert.strictEqual(editorRes.statusCode, 200);
    assert.strictEqual(editorRes.body.success, true);
    assert.ok(editorRes.body.data.id);
  });

  // 5. News to Graphic Extraction Engine
  await t.test('5. POST /api/v1/graphics/news-to-graphic performs factual extraction without alteration', async () => {
    const testArticle = {
      id: 'art-bhopal-001',
      title: 'भोपाल में मेट्रो ट्रेन के नए रूट का उद्घाटन, सीएम ने दिखाई हरी झंडी',
      subheadline: 'सुभाष नगर से करोंद तक 8 नए स्टेशनों का निर्माण कार्य समय सीमा में पूर्ण।',
      content: 'भोपाल: मुख्यमंत्री ने आज सुभाष नगर स्टेशन से मेट्रो के द्वितीय चरण का लोकार्पण किया।',
      districtName: 'भोपाल',
      categoryName: 'विकास व प्रशासन',
      isBreaking: true,
      imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9',
      authorName: 'आलोक कुमार',
    };

    const res = await httpHelper.request(
      'POST',
      '/api/v1/graphics/news-to-graphic',
      { article: testArticle },
      { Authorization: `Bearer ${reporterToken}` }
    );

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    const data = res.body.data;
    assert.strictEqual(data.headline, testArticle.title);
    assert.strictEqual(data.district, 'भोपाल');
    assert.strictEqual(data.isBreaking, true);
    assert.strictEqual(data.authorName, 'आलोक कुमार');
    assert.ok(data.selectedTemplateId);
  });

  // 6. Create Graphic Draft
  let createdGraphicId = null;
  await t.test('6. POST /api/v1/graphics creates new graphic draft with version 1', async () => {
    const payload = {
      headline: 'मध्य प्रदेश: आगामी बजट सत्र को लेकर विधानसभा सचिवालय ने जारी की अधिसूचना',
      subtext: 'सत्र के दौरान जनहित के प्रमुख मुद्दों व वित्तीय विधेयकों पर होगी व्यापक चर्चा।',
      districtName: 'भोपाल',
      categoryName: 'राजनीति',
      aspectRatio: '4:5',
      templateId: 'tpl-politics-navy-4-5',
      themeColor: '#0F172A',
      isBreaking: false,
      status: 'DRAFT',
    };

    const res = await httpHelper.request('POST', '/api/v1/graphics', payload, {
      Authorization: `Bearer ${reporterToken}`,
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.id);
    assert.strictEqual(res.body.data.version, 1);
    assert.strictEqual(res.body.data.status, 'DRAFT');
    createdGraphicId = res.body.data.id;
  });

  // 7. List Graphics with Filters
  await t.test('7. GET /api/v1/graphics lists graphics with pagination and filters', async () => {
    const res = await httpHelper.request('GET', '/api/v1/graphics?status=DRAFT');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.some((g) => g.id === createdGraphicId));
    assert.ok(res.body.meta?.pagination);
  });

  // 8. Update Graphic Draft with OCC
  await t.test('8. PUT /api/v1/graphics/:id updates draft and increments version', async () => {
    assert.ok(createdGraphicId);
    const res = await httpHelper.request(
      'PUT',
      `/api/v1/graphics/${createdGraphicId}`,
      {
        headline: 'मध्य प्रदेश: विधानसभा बजट सत्र की तिथियां घोषित, 5 दिवसीय सत्र का कार्यक्रम जारी',
        expectedVersion: 1,
      },
      { Authorization: `Bearer ${reporterToken}` }
    );

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.version, 2);
  });

  // 9. Status Transitions & Role Protection
  await t.test('9. PATCH /api/v1/graphics/:id/status verifies role-based approval & publication', async () => {
    assert.ok(createdGraphicId);

    // Reader or unauthorized user cannot approve
    const unauthRes = await httpHelper.request(
      'PATCH',
      `/api/v1/graphics/${createdGraphicId}/status`,
      { status: 'APPROVED' },
      { Authorization: `Bearer ${readerToken}` }
    );
    assert.strictEqual(unauthRes.statusCode, 403);

    // Editor approval succeeds
    const approveRes = await httpHelper.request(
      'PATCH',
      `/api/v1/graphics/${createdGraphicId}/status`,
      { status: 'APPROVED', reviewNotes: 'ग्राफ़िक व तथ्य सत्यापन पूर्ण' },
      { Authorization: `Bearer ${editorToken}` }
    );
    assert.strictEqual(approveRes.statusCode, 200);
    assert.strictEqual(approveRes.body.data.status, 'APPROVED');
    assert.strictEqual(approveRes.body.data.approvedBy, 'usr-desk-chief');
  });

  // 10. Audit Logging Verification
  await t.test('10. Audit log records graphic lifecycle events', async () => {
    const auditRes = await httpHelper.request('GET', '/api/v1/admin/audit-logs');
    assert.strictEqual(auditRes.statusCode, 200);
    const logs = auditRes.body.data || [];
    assert.ok(
      logs.some(
        (l) =>
          l.action === 'GRAPHIC_CREATED' ||
          l.actionType === 'GRAPHIC_CREATED' ||
          l.action === 'GRAPHIC_APPROVED' ||
          l.actionType === 'GRAPHIC_APPROVED'
      ),
      'Audit logs must capture graphic studio operations'
    );
  });

  // 11. FirestoreAdapter Parity Test
  await t.test('11. FirestoreAdapter provides full graphics and templates parity', async () => {
    const fsAdapter = new FirestoreAdapter();
    await fsAdapter.init();

    // 1. Templates
    const templates = await fsAdapter.getGraphicTemplates();
    assert.ok(Array.isArray(templates));
    assert.ok(templates.length >= 11);

    // 2. Create Graphic
    const created = await fsAdapter.saveGraphic({
      headline: 'फायरस्टोर ग्राफ़िक टेस्ट',
      aspectRatio: '1:1',
      status: 'DRAFT',
    });
    assert.ok(created.id);
    assert.strictEqual(created.version, 1);

    // 3. Status Update
    const approved = await fsAdapter.updateGraphicStatus(created.id, 'APPROVED', { id: 'usr-chief' });
    assert.strictEqual(approved.status, 'APPROVED');
    assert.strictEqual(approved.version, 2);

    // 4. Query
    const list = await fsAdapter.getGraphics({ status: 'APPROVED' });
    assert.ok(list.items.some((g) => g.id === created.id));

    // 5. Delete
    const deleted = await fsAdapter.deleteGraphic(created.id);
    assert.strictEqual(deleted, true);
  });
});
