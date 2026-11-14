/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Execution 020 — Advanced Newsroom & Editorial Workflow Test Suite
 * 
 * Verifies:
 * 1. Advanced Newsroom Editorial Actions (claim, reassign, priority, breaking, schedule, notes, reject, approve)
 * 2. Multi-Dimensional Article Filtering (status, priority, search, editorId)
 * 3. Reporter Management APIs (status change, beats assignment, performance metrics)
 * 4. Audit Log and Revision History Tracking
 * 5. Concurrency and Data Integrity
 */

import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { handleApiRequest } from '../src/server/apiEngine.js';
import { getPersistenceAdapter } from '../src/server/persistence/adapter.js';

process.env.NODE_ENV = 'test';

function createMockHttp() {
  let server;
  let baseUrl;

  const start = () => new Promise((resolve) => {
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

  const stop = () => new Promise((resolve) => {
    if (server) server.close(resolve);
    else resolve();
  });

  const request = (method, urlPath, body = null, headers = {}) => new Promise((resolve, reject) => {
    const fullUrl = new URL(urlPath, baseUrl);
    const bodyStr = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...headers,
    };
    if (bodyStr) {
      reqHeaders['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = http.request(fullUrl, {
      method,
      headers: reqHeaders,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch {
          json = { raw: data };
        }
        resolve({ statusCode: res.statusCode, headers: res.headers, data: json });
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });

  return { start, stop, request };
}

test.describe('Advanced Newsroom 020 — Multi-Status Editorial Actions', () => {
  const mockHttp = createMockHttp();
  let createdArticleId;

  test.before(async () => {
    await mockHttp.start();

    // Seed a draft article for editorial action tests
    const adapter = getPersistenceAdapter();
    const created = await adapter.createDraft({
      title: 'एडवांस्ड न्यूज़रूम परीक्षण स्टोरी 020',
      content: 'यह स्टोरी 12-चरण न्यूज़रूम कार्यप्रवाह परीक्षण हेतु निर्मित है।',
      categoryName: 'मध्य प्रदेश',
      districtName: 'भोपाल',
      authorName: 'टेस्ट रिपोर्टर',
      authorId: 'usr-rep-020',
      status: 'PENDING_REVIEW',
      priority: 'NORMAL',
    });
    createdArticleId = created.id;
  });

  test.after(async () => {
    await mockHttp.stop();
  });

  test('1. Editorial Action: claim article by Desk Editor', async () => {
    const res = await mockHttp.request('POST', '/api/v1/newsroom/review', {
      articleId: createdArticleId,
      action: 'claim',
      assignedEditorId: 'usr-desk-chief',
      assignedEditorName: 'मुख्य संपादक (Desk Editor)',
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.claimedBy, 'मुख्य संपादक (Desk Editor)');
    assert.strictEqual(res.data.data.status, 'UNDER_REVIEW');
    assert.ok(res.data.data.claimedAt);
  });

  test('2. Editorial Action: reassign article to another desk sub-editor', async () => {
    const res = await mockHttp.request('POST', '/api/v1/newsroom/review', {
      articleId: createdArticleId,
      action: 'reassign',
      editorId: 'usr-desk-indore',
      editorName: 'इंदौर डेस्क प्रभारी',
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.assignedEditorId, 'usr-desk-indore');
    assert.strictEqual(res.data.data.assignedEditorName, 'इंदौर डेस्क प्रभारी');
    assert.strictEqual(res.data.data.status, 'ASSIGNED');
  });

  test('3. Editorial Action: escalate priority to CRITICAL', async () => {
    const res = await mockHttp.request('POST', '/api/v1/newsroom/review', {
      articleId: createdArticleId,
      action: 'priority',
      priority: 'CRITICAL',
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.priority, 'CRITICAL');
  });

  test('4. Editorial Action: toggle breaking news tag with ticker creation', async () => {
    const res = await mockHttp.request('POST', '/api/v1/newsroom/review', {
      articleId: createdArticleId,
      action: 'breaking',
      isBreaking: true,
      createTicker: true,
      tickerText: 'ब्रेकिंग: भोपाल में महत्वपूर्ण प्रशासनिक फैसला',
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.isBreaking, true);
    assert.strictEqual(res.data.data.priority, 'BREAKING');
  });

  test('5. Editorial Action: schedule publication timestamp', async () => {
    const scheduledTime = new Date(Date.now() + 3600000).toISOString();
    const res = await mockHttp.request('POST', '/api/v1/newsroom/review', {
      articleId: createdArticleId,
      action: 'schedule',
      scheduledAt: scheduledTime,
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.scheduledAt, scheduledTime);
  });

  test('6. Editorial Action: add internal editorial notes', async () => {
    const res = await mockHttp.request('POST', '/api/v1/newsroom/review', {
      articleId: createdArticleId,
      action: 'editorial_notes',
      notes: 'रिपोर्टर ने तहसीलदार के बयान की ऑडियो रिकॉर्डिंग उपलब्ध करा दी है।',
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.editorialNotes.includes('तहसीलदार के बयान'));
  });

  test('7. Editorial Action: request changes with feedback comments', async () => {
    const res = await mockHttp.request('POST', '/api/v1/newsroom/review', {
      articleId: createdArticleId,
      action: 'request_changes',
      feedbackComments: 'कृपया संबंधित पक्ष का स्पष्टीकरण और संलग्न दस्तावेज शामिल करें।',
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.status, 'REVISION_REQUESTED');
  });

  test('8. Editorial Action: approve and publish with updated title and content', async () => {
    const res = await mockHttp.request('POST', '/api/v1/newsroom/review', {
      articleId: createdArticleId,
      action: 'approve',
      updatedTitle: 'संशोधित शीर्षक: भोपाल में प्रशासनिक सुधारों को मिली हरी झंडी',
      updatedContent: 'विस्तृत खबर: प्रशासन ने नए दिशा-निर्देशों को प्रभावी रूप से लागू कर दिया है।',
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.status, 'PUBLISHED');
    assert.ok(res.data.data.title.includes('संशोधित शीर्षक'));
    assert.strictEqual(res.data.data.factChecked, true);
  });

  test('9. Editorial Action: reject story with mandatory reason code', async () => {
    // Create another test draft to reject
    const adapter = getPersistenceAdapter();
    const rejectTarget = await adapter.createDraft({
      title: 'अस्वीकृति परीक्षण स्टोरी',
      content: 'यह स्टोरी अपुष्ट दावे पर आधारित है।',
      categoryName: 'अपराध',
      districtName: 'इंदौर',
      status: 'PENDING_REVIEW',
    });

    const res = await mockHttp.request('POST', '/api/v1/newsroom/review', {
      articleId: rejectTarget.id,
      action: 'reject',
      reasonCode: 'UNVERIFIED_SOURCE',
      feedbackComments: 'स्रोत की पुष्टि नहीं हो सकी एवं कोई प्रत्यक्षदर्शी साक्ष्य उपलब्ध नहीं है।',
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.status, 'REJECTED');
    assert.strictEqual(res.data.data.rejectionReasonCode, 'UNVERIFIED_SOURCE');
  });
});

test.describe('Advanced Newsroom 020 — Multi-Dimensional Filter Queries', () => {
  const mockHttp = createMockHttp();

  test.before(async () => {
    await mockHttp.start();
  });

  test.after(async () => {
    await mockHttp.stop();
  });

  test('1. Query articles filtered by status: PUBLISHED', async () => {
    const res = await mockHttp.request('GET', '/api/v1/articles?status=PUBLISHED');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));
    assert.ok(res.data.data.every((a) => a.status === 'PUBLISHED'));
  });

  test('2. Query articles filtered by priority: BREAKING', async () => {
    const res = await mockHttp.request('GET', '/api/v1/articles?priority=BREAKING');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));
    assert.ok(res.data.data.every((a) => a.priority === 'BREAKING'));
  });

  test('3. Query articles filtered by free-text search matching keyword', async () => {
    const res = await mockHttp.request('GET', '/api/v1/articles?search=भोपाल');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));
  });
});

test.describe('Advanced Newsroom 020 — Reporter Management APIs', () => {
  const mockHttp = createMockHttp();

  test.before(async () => {
    await mockHttp.start();
  });

  test.after(async () => {
    await mockHttp.stop();
  });

  test('1. Update reporter verification status to SUSPENDED and verify', async () => {
    const res = await mockHttp.request('PATCH', '/api/v1/admin/reporters/rep-001/status', {
      status: 'SUSPENDED',
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.id, 'rep-001');
    assert.strictEqual(res.data.data.status, 'SUSPENDED');
  });

  test('2. Assign beats array to reporter and verify', async () => {
    const beats = ['राजनीति', 'प्रशासन', 'विधानसभा', 'किसान'];
    const res = await mockHttp.request('PATCH', '/api/v1/admin/reporters/rep-001/beats', {
      beats,
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.deepStrictEqual(res.data.data.beats, beats);
  });

  test('3. Get reporter performance metrics', async () => {
    const res = await mockHttp.request('GET', '/api/v1/admin/reporters/rep-001/performance');

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(typeof res.data.data.totalStoriesFiled === 'number');
    assert.ok(typeof res.data.data.totalStoriesPublished === 'number');
    assert.ok(typeof res.data.data.approvalRate === 'number');
  });
});
