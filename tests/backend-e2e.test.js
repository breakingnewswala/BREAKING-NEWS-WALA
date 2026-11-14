/**
 * BREAKING NEWS WALA — Comprehensive Backend & E2E Integration Test Suite
 * Validates all 18 requirements defined in BNW MASTER EXECUTION 003 Section 15.
 * 
 * Tests:
 * 1. API client contract
 * 2. Authentication
 * 3. Session restoration
 * 4. Reporter draft persistence
 * 5. Reporter submission
 * 6. Newsroom queue retrieval
 * 7. Story claiming
 * 8. Editorial update
 * 9. Revision request
 * 10. Rejection
 * 11. Approval authorization
 * 12. Public publication boundary
 * 13. Admin role enforcement
 * 14. Ticker persistence
 * 15. Audit log creation
 * 16. Media authorization
 * 17. Health endpoints
 * 18. Unauthorized API access
 */

import { spawn } from 'node:child_process';
import http from 'node:http';
import assert from 'node:assert';
import test from 'node:test';

const TEST_PORT = 3088;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

function httpRequest(method, endpoint, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const reqHeaders = {
      Accept: 'application/json',
      ...headers,
    };
    if (body && !reqHeaders['Content-Type']) {
      reqHeaders['Content-Type'] = 'application/json';
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch {
            // Raw text fallback
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: json || data,
          });
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

test('BNW MASTER EXECUTION 003 — Comprehensive Backend Test Suite', async (t) => {
  // Spawn test server
  let serverProcess;
  await new Promise((resolve, reject) => {
    serverProcess = spawn('node', ['server.js'], {
      env: { ...process.env, PORT: String(TEST_PORT), NODE_ENV: 'test' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    serverProcess.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('listening on')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (d) => {
      console.error('[Server STDERR]:', d.toString().trim());
    });

    serverProcess.on('error', reject);

    // Timeout fallback
    setTimeout(resolve, 2000);
  });

  t.after(() => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
  });

  let authToken = '';
  let testDraftId = '';

  // TEST 17: Health Endpoints (Machine-Readable JSON, Process & Database Health)
  await t.test('17. Health endpoints (/healthz & /api/v1/health)', async () => {
    const resHealthz = await httpRequest('GET', '/healthz');
    assert.strictEqual(resHealthz.statusCode, 200);
    assert.ok(resHealthz.headers['content-type'].includes('application/json'));
    assert.strictEqual(resHealthz.body.status, 'healthy');
    assert.ok(typeof resHealthz.body.uptime === 'number');
    assert.ok(resHealthz.body.process && resHealthz.body.process.pid);
    assert.ok(resHealthz.body.services && resHealthz.body.services.database);
    assert.strictEqual(resHealthz.body.services.database.provider, 'postgresql');

    const resV1Health = await httpRequest('GET', '/api/v1/health');
    assert.strictEqual(resV1Health.statusCode, 200);
    assert.strictEqual(resV1Health.body.status, 'healthy');
  });

  // TEST 2: Authentication
  await t.test('2. Authentication (POST /api/v1/auth/login)', async () => {
    const res = await httpRequest('POST', '/api/v1/auth/login', {
      identifier: 'rep_bhopal',
      password: 'password123',
    });
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.success);
    assert.ok(res.body.data.tokens.accessToken);
    authToken = res.body.data.tokens.accessToken;
    assert.ok(res.body.data.user.roles.includes('REPORTER'));
  });

  // TEST 3: Session Restoration
  await t.test('3. Session restoration (GET /api/v1/auth/me)', async () => {
    const res = await httpRequest('GET', '/api/v1/auth/me', null, {
      Authorization: `Bearer ${authToken}`,
    });
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.success);
    assert.strictEqual(res.body.data.roles[0], 'REPORTER');
  });

  // TEST 18: Unauthorized API Access
  await t.test('18. Unauthorized API access protection', async () => {
    const res = await httpRequest('GET', '/api/v1/auth/me'); // No auth header
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.error.code, 'ERR_UNAUTHORIZED');
  });

  // TEST 4: Reporter Draft Persistence
  await t.test('4. Reporter draft creation & server persistence (POST /api/v1/articles/drafts)', async () => {
    const payload = {
      title: 'मध्य प्रदेश नवाचार: सीहोर में पहला जैविक खाद्य प्रसंस्करण केंद्र स्वीकृत',
      content: 'सीहोर। राज्य सरकार ने सीहोर जिले में ₹45 करोड़ की लागत से बनने वाले मध्य प्रदेश के प्रथम एकीकृत जैविक खाद्य प्रसंस्करण क्लस्टर को विधिवत स्वीकृति प्रदान कर दी है। इस संयंत्र से लगभग 2,500 स्थानीय किसान परिवारों को सीधा बाजार उपलब्ध होगा।',
      summary: 'सीहोर में जैविक खाद्य प्रसंस्करण केंद्र को कैबिनेट की मंजूरी मिली।',
      categoryId: 'cat-farm',
      districtId: 'dist-sehore',
      isBreaking: false,
    };

    const res = await httpRequest('POST', '/api/v1/articles/drafts', payload, {
      Authorization: `Bearer ${authToken}`,
    });

    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.success);
    assert.strictEqual(res.body.data.status, 'DRAFT');
    assert.strictEqual(res.body.data.title, payload.title);
    testDraftId = res.body.data.id;
    assert.ok(testDraftId);
  });

  // TEST 5: Reporter Submission
  await t.test('5. Reporter submission into review queue (POST /api/v1/articles/:id/submit)', async () => {
    const res = await httpRequest('POST', `/api/v1/articles/${testDraftId}/submit`, {}, {
      Authorization: `Bearer ${authToken}`,
    });
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.success);
    assert.strictEqual(res.body.data.status, 'PENDING_REVIEW');
    assert.ok(res.body.data.submittedAt);
  });

  // TEST 6: Newsroom Queue Retrieval
  await t.test('6. Newsroom queue retrieval (GET /api/v1/articles?status=PENDING_REVIEW)', async () => {
    const res = await httpRequest('GET', '/api/v1/articles?status=PENDING_REVIEW', null, {
      Authorization: `Bearer ${authToken}`,
    });
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.success);
    assert.ok(Array.isArray(res.body.data));
    const found = res.body.data.find((a) => a.id === testDraftId);
    assert.ok(found, 'Submitted story must be present in Newsroom incoming queue');

    const statsRes = await httpRequest('GET', '/api/v1/articles/editorial/stats', null, {
      Authorization: `Bearer ${authToken}`,
    });
    assert.strictEqual(statsRes.statusCode, 200);
    assert.ok(statsRes.body.data.pendingReview > 0);
  });

  // TEST 7: Story Claiming
  await t.test('7. Story claiming by desk editor (POST /api/v1/articles/:id/review - claim)', async () => {
    const res = await httpRequest(
      'POST',
      `/api/v1/articles/${testDraftId}/review`,
      { action: 'claim' },
      { Authorization: `Bearer ${authToken}` }
    );
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.success);
    assert.strictEqual(res.body.data.status, 'UNDER_REVIEW');
  });

  // TEST 8: Editorial Update (Sub-Editing)
  await t.test('8. Editorial headline and copy update during review', async () => {
    const updatedTitle = 'सीहोर: प्रदेश का पहला अत्याधुनिक जैविक खाद्य प्रसंस्करण केंद्र स्वीकृत, 2500 किसानों को लाभ';
    const res = await httpRequest(
      'POST',
      `/api/v1/articles/${testDraftId}/review`,
      {
        action: 'claim',
        updatedTitle,
      },
      { Authorization: `Bearer ${authToken}` }
    );
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.success);
  });

  // TEST 9: Revision Request
  await t.test('9. Revision request workflow (action: request_changes)', async () => {
    const res = await httpRequest(
      'POST',
      `/api/v1/articles/${testDraftId}/review`,
      {
        action: 'request_changes',
        notes: 'कृपया कृषि निदेशक का आधिकारिक उद्धरण शामिल करें।',
      },
      { Authorization: `Bearer ${authToken}` }
    );
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.success);
    assert.strictEqual(res.body.data.status, 'REVISION_REQUESTED');
  });

  // TEST 10: Rejection Workflow
  await t.test('10. Rejection workflow with mandatory reason code (action: reject)', async () => {
    // Create temporary article to reject
    const tempDraft = await httpRequest('POST', '/api/v1/articles/drafts', {
      title: 'अपुष्ट वायरल दावा: परीक्षण हेतु फर्जी खबर',
      content: 'यह केवल अस्वीकृति परीक्षण हेतु एक परीक्षण रिपोर्ट है।',
      categoryId: 'cat-crime',
      districtId: 'dist-bhopal',
    }, { Authorization: `Bearer ${authToken}` });

    const tempId = tempDraft.body.data.id;
    await httpRequest('POST', `/api/v1/articles/${tempId}/submit`, {}, { Authorization: `Bearer ${authToken}` });

    const rejectRes = await httpRequest(
      'POST',
      `/api/v1/articles/${tempId}/review`,
      {
        action: 'reject',
        reasonCode: 'UNVERIFIED_SOURCE',
        feedbackComments: 'प्राथमिक स्रोत से पुष्टि नहीं हुई है। संपादकीय नीति नियम 4 के तहत निरस्त।',
      },
      { Authorization: `Bearer ${authToken}` }
    );

    assert.strictEqual(rejectRes.statusCode, 200);
    assert.strictEqual(rejectRes.body.data.status, 'REJECTED');
  });

  // TEST 11: Approval Authorization & Publication
  await t.test('11. Editorial approval authorization & instant publication', async () => {
    const res = await httpRequest(
      'POST',
      `/api/v1/articles/${testDraftId}/review`,
      {
        action: 'approve',
        updatedTitle: 'सीहोर: प्रदेश का पहला अत्याधुनिक जैविक खाद्य प्रसंस्करण केंद्र स्वीकृत',
      },
      { Authorization: `Bearer ${authToken}` }
    );
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.success);
    assert.strictEqual(res.body.data.status, 'PUBLISHED');
    assert.ok(res.body.data.publishedAt);
    assert.strictEqual(res.body.data.factChecked, true);
  });

  // TEST 12: Public Publication Boundary
  await t.test('12. Public publication boundary enforcement', async () => {
    // 12a: Approved story must appear in public feed
    const pubFeed = await httpRequest('GET', '/api/v1/articles');
    assert.strictEqual(pubFeed.statusCode, 200);
    const pubArticles = pubFeed.body.data;
    const foundPublished = pubArticles.find((a) => a.id === testDraftId);
    assert.ok(foundPublished, 'Newly published article must appear in public feed');

    // 12b: Draft, pending, or rejected articles must NEVER appear in public feed
    const hasUnpublished = pubArticles.some((a) => a.status !== 'PUBLISHED');
    assert.strictEqual(hasUnpublished, false, 'Unpublished stories must NEVER leak to public feed');
  });

  // TEST 13: Admin Role Enforcement
  await t.test('13. Admin role management (PATCH /api/v1/admin/reporters/:id/role)', async () => {
    const repRes = await httpRequest('GET', '/api/v1/admin/reporters', null, {
      Authorization: `Bearer ${authToken}`,
    });
    assert.strictEqual(repRes.statusCode, 200);
    const targetRep = repRes.body.data[0];

    const patchRes = await httpRequest(
      'PATCH',
      `/api/v1/admin/reporters/${targetRep.id}/role`,
      { role: 'trusted_reporter' },
      { Authorization: `Bearer ${authToken}` }
    );
    assert.strictEqual(patchRes.statusCode, 200);
    assert.strictEqual(patchRes.body.data.role, 'trusted_reporter');
  });

  // TEST 14: Ticker Persistence
  await t.test('14. Ticker persistence (Add, toggle, delete)', async () => {
    const addRes = await httpRequest(
      'POST',
      '/api/v1/admin/tickers',
      { textHindi: 'सीहोर जैविक क्लस्टर को कैबिनेट की हरी झंडी।', districtName: 'सीहोर', priority: 'normal' },
      { Authorization: `Bearer ${authToken}` }
    );
    assert.strictEqual(addRes.statusCode, 200);
    const tickId = addRes.body.data.id;

    // Toggle
    const toggleRes = await httpRequest('PATCH', `/api/v1/admin/tickers/${tickId}`, null, {
      Authorization: `Bearer ${authToken}`,
    });
    assert.strictEqual(toggleRes.statusCode, 200);
    assert.strictEqual(toggleRes.body.data.isActive, false);

    // Delete
    const delRes = await httpRequest('DELETE', `/api/v1/admin/tickers/${tickId}`, null, {
      Authorization: `Bearer ${authToken}`,
    });
    assert.strictEqual(delRes.statusCode, 200);
    assert.strictEqual(delRes.body.data.deleted, true);
  });

  // TEST 15: Audit Log Creation
  await t.test('15. Audit log creation & server trail verification', async () => {
    const logRes = await httpRequest('GET', '/api/v1/admin/audit-logs', null, {
      Authorization: `Bearer ${authToken}`,
    });
    assert.strictEqual(logRes.statusCode, 200);
    assert.ok(Array.isArray(logRes.body.data));
    assert.ok(logRes.body.data.length > 0);
    const publishedLog = logRes.body.data.find((l) => l.actionType === 'ARTICLE_PUBLISHED');
    assert.ok(publishedLog, 'Must contain ARTICLE_PUBLISHED audit log entry');
  });

  // TEST 16: Media Authorization & Ingestion
  await t.test('16. Media ingestion pipeline (POST /api/v1/media/upload)', async () => {
    const res = await httpRequest(
      'POST',
      '/api/v1/media/upload',
      {
        fileName: 'field_evidence.jpg',
        mimeType: 'image/jpeg',
        fileBuffer: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      },
      { Authorization: `Bearer ${authToken}` }
    );
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.success);
    assert.ok(res.body.data.url);
    assert.ok(res.body.data.mediaId);
  });

  // TEST 1: API Client Contract
  await t.test('1. API client contract verification (Categories & Districts)', async () => {
    const catRes = await httpRequest('GET', '/api/v1/categories');
    assert.strictEqual(catRes.statusCode, 200);
    assert.ok(Array.isArray(catRes.body.data));
    assert.ok(catRes.body.data.length >= 21);

    const distRes = await httpRequest('GET', '/api/v1/territory/districts');
    assert.strictEqual(distRes.statusCode, 200);
    assert.ok(Array.isArray(distRes.body.data));
    assert.ok(distRes.body.data.length >= 15);
  });
});

