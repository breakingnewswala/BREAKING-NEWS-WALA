/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Execution 022 — Video Production Studio Test Suite
 * 
 * Verifies:
 * 1. Video Template Library APIs (all 11 categories, 5 aspect ratios, filtering)
 * 2. Template Duplication and RBAC Protection
 * 3. News-to-Video Extraction Engine (Factual integrity without hallucination, 4 scenes)
 * 4. Video Project Creation, OCC Versioning, and Draft Management
 * 5. Real Video Rendering Pipeline (Host FFmpeg MP4 generation & file verification)
 * 6. Render Queue Tracking, Status Transitions, Retry, and Cancel
 * 7. Audit Trail Logging for Video Studio Events
 * 8. FirestoreAdapter Video Parity
 */

import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { handleApiRequest, signToken } from '../src/server/apiEngine.js';
import { getPersistenceAdapter } from '../src/server/persistence/adapter.js';
import { FirestoreAdapter } from '../src/server/persistence/firestoreAdapter.js';

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

test('Video Production Studio API Suite', async (t) => {
  const httpHelper = createMockHttp();
  await httpHelper.start();

  const editorToken = signToken({
    id: 'usr-desk-chief',
    fullName: 'मुख्य संपादक (Desk Editor)',
    roles: ['EDITOR', 'CHIEF_EDITOR'],
  });

  const readerToken = signToken({
    id: 'usr-reader-01',
    fullName: 'आम पाठक (Reader)',
    roles: ['READER'],
  });

  t.after(async () => {
    await httpHelper.stop();
  });

  // -------------------------------------------------------------
  // TEST 1: Video Template Library & 11 Categories Verification
  // -------------------------------------------------------------
  await t.test('1. Video Templates Listing returns all 11 categories & 5 aspect ratios', async () => {
    const res = await httpHelper.request('GET', '/api/v1/videos/templates');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 11);

    const categories = new Set(res.body.data.map((t) => t.category));
    const requiredCategories = [
      'BREAKING',
      'POLITICS',
      'CRIME',
      'GOVERNMENT',
      'DISTRICT',
      'SPORTS',
      'BUSINESS',
      'EDUCATION',
      'WEATHER',
      'SPECIAL',
      'FESTIVAL',
    ];
    for (const cat of requiredCategories) {
      assert.ok(categories.has(cat), `Must contain category ${cat}`);
    }

    const ratios = new Set(res.body.data.map((t) => t.aspectRatio));
    const requiredRatios = ['9:16', '16:9', '1:1', '4:5', '3:4'];
    for (const r of requiredRatios) {
      assert.ok(ratios.has(r), `Must contain aspect ratio ${r}`);
    }
  });

  // -------------------------------------------------------------
  // TEST 2: Template Filtering & Search
  // -------------------------------------------------------------
  await t.test('2. Video Templates Filtering by category and aspect ratio', async () => {
    const catRes = await httpHelper.request('GET', '/api/v1/videos/templates?category=BREAKING');
    assert.strictEqual(catRes.statusCode, 200);
    assert.ok(catRes.body.data.every((t) => t.category === 'BREAKING'));

    const ratioRes = await httpHelper.request('GET', '/api/v1/videos/templates?aspectRatio=9:16');
    assert.strictEqual(ratioRes.statusCode, 200);
    assert.ok(ratioRes.body.data.every((t) => t.aspectRatio === '9:16'));

    const searchRes = await httpHelper.request('GET', '/api/v1/videos/templates?search=ब्रेकिंग');
    assert.strictEqual(searchRes.statusCode, 200);
    assert.ok(searchRes.body.data.length > 0);
  });

  // -------------------------------------------------------------
  // TEST 3: Template Duplication & RBAC Protection
  // -------------------------------------------------------------
  await t.test('3. Duplicate Video Template and RBAC creation restriction', async () => {
    // 3a. Duplication
    const dupRes = await httpHelper.request(
      'POST',
      '/api/v1/videos/templates/tpl-vid-breaking-01/duplicate',
      null,
      { Authorization: `Bearer ${editorToken}` }
    );
    assert.strictEqual(dupRes.statusCode, 200);
    assert.strictEqual(dupRes.body.success, true);
    assert.ok(dupRes.body.data.title.includes('प्रतिलिपि'));
    assert.strictEqual(dupRes.body.data.isDefault, false);

    // 3b. Unauthorized user cannot create template
    const unauthCreate = await httpHelper.request(
      'POST',
      '/api/v1/videos/templates',
      { title: 'अवैध टेम्पलेट' },
      { Authorization: `Bearer ${readerToken}` }
    );
    assert.strictEqual(unauthCreate.statusCode, 403);
    assert.strictEqual(unauthCreate.body.error.code, 'ERR_FORBIDDEN');
  });

  // -------------------------------------------------------------
  // TEST 4: News to Video Extraction Engine (Factual Integrity)
  // -------------------------------------------------------------
  await t.test('4. News to Video Extraction preserves facts and generates 4 scenes', async () => {
    const newsPayload = {
      article: {
        id: 'art-bhopal-001',
        title: 'भोपाल: वीआईपी रोड पर नई मेट्रो लाइन का परीक्षण सफल',
        subheadline: 'सीएम ने अधिकारियों की पीठ थपथपाई, जल्द शुरू होगी सेवा।',
        content: 'मध्य प्रदेश की राजधानी भोपाल में आज बड़ा मील का पत्थर हासिल हुआ।',
        districtName: 'भोपाल',
        categoryName: 'विकास व परिवहन',
        imageUrl: 'https://images.unsplash.com/photo-metro.jpg',
        authorName: 'राजेश शर्मा',
        isBreaking: true,
      },
      aspectRatio: '9:16',
    };

    const res = await httpHelper.request('POST', '/api/v1/videos/news-to-video', newsPayload);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);

    const data = res.body.data;
    assert.strictEqual(data.headline, newsPayload.article.title);
    assert.strictEqual(data.district, 'भोपाल');
    assert.strictEqual(data.imageUrl, newsPayload.article.imageUrl);
    assert.strictEqual(data.isBreaking, true);
    assert.ok(Array.isArray(data.scenes));
    assert.strictEqual(data.scenes.length, 4);

    // Verify scene sequence structure
    assert.strictEqual(data.scenes[0].title, 'ब्रेकिंग अलर्ट');
    assert.strictEqual(data.scenes[1].title, 'घटनाक्रम व तथ्य');
    assert.strictEqual(data.scenes[2].title, 'प्रशासनिक कार्रवाई व प्रभाव');
    assert.strictEqual(data.scenes[3].title, 'समापन व अपील');
  });

  // -------------------------------------------------------------
  // TEST 5: Video Project Lifecycle & OCC Concurrency Control
  // -------------------------------------------------------------
  let createdProjectId = '';
  await t.test('5. Video Project Creation, Retrieval, and OCC Conflict Handling', async () => {
    // 5a. Create project
    const createRes = await httpHelper.request(
      'POST',
      '/api/v1/videos/projects',
      {
        title: 'इंदौर स्वच्छता अभियान विशेष रिपोर्ट',
        aspectRatio: '9:16',
        scenes: [
          {
            id: 'scn-1',
            order: 1,
            title: 'अलर्ट',
            durationSeconds: 4,
            transition: 'cut',
            backgroundColor: '#ED1727',
            headline: 'इंदौर: नंबर 1 स्वच्छता मॉडल',
          },
        ],
      },
      { Authorization: `Bearer ${editorToken}` }
    );

    assert.strictEqual(createRes.statusCode, 200);
    assert.strictEqual(createRes.body.success, true);
    createdProjectId = createRes.body.data.id;
    assert.strictEqual(createRes.body.data.version, 1);
    assert.strictEqual(createRes.body.data.status, 'DRAFT');

    // 5b. Update project
    const updateRes = await httpHelper.request(
      'PUT',
      `/api/v1/videos/projects/${createdProjectId}`,
      {
        title: 'इंदौर स्वच्छता अभियान विशेष रिपोर्ट (अपडेटेड)',
        expectedVersion: 1,
      },
      { Authorization: `Bearer ${editorToken}` }
    );
    assert.strictEqual(updateRes.statusCode, 200);
    assert.strictEqual(updateRes.body.data.version, 2);

    // 5c. OCC conflict test (stale expectedVersion: 1 when version is 2)
    const conflictRes = await httpHelper.request(
      'PUT',
      `/api/v1/videos/projects/${createdProjectId}`,
      {
        title: 'अमान्य समवर्ती अपडेट',
        expectedVersion: 1,
      },
      { Authorization: `Bearer ${editorToken}` }
    );
    assert.strictEqual(conflictRes.statusCode, 409);
    assert.strictEqual(conflictRes.body.error.code, 'ERR_VERSION_CONFLICT');
  });

  // -------------------------------------------------------------
  // TEST 6: Real Video Rendering Pipeline (FFmpeg Output Verification)
  // -------------------------------------------------------------
  let renderedJobId = '';
  await t.test('6. Real FFmpeg Video Rendering generates authentic playable MP4', async () => {
    const renderPayload = {
      projectId: createdProjectId,
      resolution: '720p',
      fps: 30,
      format: 'mp4',
    };

    const submitRes = await httpHelper.request(
      'POST',
      '/api/v1/videos/render',
      renderPayload,
      { Authorization: `Bearer ${editorToken}` }
    );

    assert.strictEqual(submitRes.statusCode, 200);
    assert.strictEqual(submitRes.body.success, true);
    renderedJobId = submitRes.body.data.id;
    assert.ok(renderedJobId);

    // Wait up to 5 seconds for background FFmpeg encoding to finish
    let jobDetails = null;
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const pollRes = await httpHelper.request('GET', `/api/v1/videos/render/${renderedJobId}`);
      if (pollRes.body?.data?.status === 'COMPLETED' || pollRes.body?.data?.status === 'FAILED') {
        jobDetails = pollRes.body.data;
        break;
      }
    }

    assert.ok(jobDetails, 'Render job details must be available');
    assert.strictEqual(jobDetails.status, 'COMPLETED');
    assert.strictEqual(jobDetails.progressPercent, 100);
    assert.ok(jobDetails.outputUrl, 'Must have public outputUrl');

    // Verify actual file exists on disk and is non-empty
    const rendersDir = path.resolve(process.cwd(), 'dist', 'media', 'renders');
    const expectedFile = path.join(rendersDir, `render-${renderedJobId}.mp4`);
    assert.ok(fs.existsSync(expectedFile), `Output file must exist on disk: ${expectedFile}`);

    const stat = fs.statSync(expectedFile);
    assert.ok(stat.size > 0, 'Rendered video file must be non-empty (> 0 bytes)');

    // Verify valid MP4 ftyp box header
    const fd = fs.openSync(expectedFile, 'r');
    const buf = Buffer.alloc(8);
    fs.readSync(fd, buf, 0, 8, 4);
    fs.closeSync(fd);
    assert.strictEqual(buf.toString('ascii', 0, 4), 'ftyp', 'Must have valid MP4 ftyp box header');
  });

  // -------------------------------------------------------------
  // TEST 7: Render Queue Listing, Retry, and Cancel
  // -------------------------------------------------------------
  await t.test('7. Render Queue listing and job control', async () => {
    const queueRes = await httpHelper.request('GET', '/api/v1/videos/render/queue');
    assert.strictEqual(queueRes.statusCode, 200);
    assert.ok(Array.isArray(queueRes.body.data));
    assert.ok(queueRes.body.data.some((j) => j.id === renderedJobId));

    // Cancel test on a newly created job
    const newJobRes = await httpHelper.request(
      'POST',
      '/api/v1/videos/render',
      { projectId: createdProjectId },
      { Authorization: `Bearer ${editorToken}` }
    );
    const cancelJobId = newJobRes.body.data.id;
    const cancelRes = await httpHelper.request(
      'POST',
      `/api/v1/videos/render/${cancelJobId}/cancel`
    );
    assert.strictEqual(cancelRes.statusCode, 200);
    assert.strictEqual(cancelRes.body.data.status, 'CANCELLED');
  });

  // -------------------------------------------------------------
  // TEST 8: Audit Logging Verification
  // -------------------------------------------------------------
  await t.test('8. System Audit Logs record video creation and rendering events', async () => {
    const auditRes = await httpHelper.request('GET', '/api/v1/admin/audit-logs', null, {
      Authorization: `Bearer ${editorToken}`,
    });
    assert.strictEqual(auditRes.statusCode, 200);
    const logs = auditRes.body.data?.logs || auditRes.body.data || [];
    const actions = new Set(logs.map((l) => l.action || l.actionType));

    assert.ok(
      actions.has('VIDEO_CREATED') || actions.has('VIDEO_TEMPLATE_CREATED'),
      'Must record video or template creation audit log'
    );
    assert.ok(
      actions.has('VIDEO_RENDER_SUBMITTED') || actions.has('VIDEO_RENDER_COMPLETED'),
      'Must record video render audit log'
    );
  });

  // -------------------------------------------------------------
  // TEST 9: FirestoreAdapter Video Parity
  // -------------------------------------------------------------
  await t.test('9. FirestoreAdapter implements complete video contract parity', async () => {
    const firestore = new FirestoreAdapter();
    assert.ok(typeof firestore.getVideoTemplates === 'function');
    assert.ok(typeof firestore.getVideoTemplateById === 'function');
    assert.ok(typeof firestore.saveVideoTemplate === 'function');
    assert.ok(typeof firestore.duplicateVideoTemplate === 'function');
    assert.ok(typeof firestore.deleteVideoTemplate === 'function');
    assert.ok(typeof firestore.getVideoProjects === 'function');
    assert.ok(typeof firestore.getVideoProjectById === 'function');
    assert.ok(typeof firestore.saveVideoProject === 'function');
    assert.ok(typeof firestore.deleteVideoProject === 'function');
    assert.ok(typeof firestore.getVideoRenderJobs === 'function');
    assert.ok(typeof firestore.createVideoRenderJob === 'function');
    assert.ok(typeof firestore.updateVideoRenderJob === 'function');

    // Test FirestoreAdapter template retrieval
    const fTemplates = await firestore.getVideoTemplates();
    assert.ok(fTemplates.length >= 11);

    // Test FirestoreAdapter project save & retrieve
    const fProj = await firestore.saveVideoProject({
      title: 'फायरस्टोर वीडियो टेस्ट',
      aspectRatio: '16:9',
      scenes: [],
    });
    assert.strictEqual(fProj.title, 'फायरस्टोर वीडियो टेस्ट');
    const fRetrieved = await firestore.getVideoProjectById(fProj.id);
    assert.strictEqual(fRetrieved.id, fProj.id);

    // Test FirestoreAdapter render job
    const fJob = await firestore.createVideoRenderJob({
      projectId: fProj.id,
      status: 'PENDING',
    });
    assert.strictEqual(fJob.status, 'PENDING');
    const fUpdated = await firestore.updateVideoRenderJob(fJob.id, {
      status: 'COMPLETED',
      progressPercent: 100,
    });
    assert.strictEqual(fUpdated.status, 'COMPLETED');
  });
});
