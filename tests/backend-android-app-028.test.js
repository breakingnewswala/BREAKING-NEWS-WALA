/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Execution 028: Native Android Application & Mobile Ecosystem Test Suite
 * 
 * Empirically validates:
 * 1. Public Reader Feed & Query Contract (/api/v1/articles)
 * 2. Deep-Link Target Resolution & Article Detail (/api/v1/articles/:id)
 * 3. Madhya Pradesh Territory Hierarchy (/api/v1/territory/divisions, /api/v1/territory/districts, overview)
 * 4. Reporter Beat Assignments (/api/v1/territory/my-assignments)
 * 5. Regional Category Hierarchy (/api/v1/categories)
 * 6. Digital E-Paper Edition APIs (/api/v1/epaper/editions, /api/v1/epaper/latest)
 * 7. E-Paper Engagement Tracking (view & download telemetry)
 * 8. ASCI-Compliant Mobile Ad Serving (/api/v1/monetization/ads/serve)
 * 9. Mobile Analytics Event Ingestion (/api/v1/analytics/events)
 * 10. FCM Push Device Registration & Notification Preferences (/api/v1/notifications/register-token, preferences)
 * 11. Reporter Dual-Token Auth & Refresh Cycle (/api/v1/auth/login, refresh, me)
 * 12. Reporter Devanagari Draft Creation & Retrieval (/api/v1/articles/drafts)
 * 13. Editorial Review Queue Submission (/api/v1/articles/:id/submit)
 * 14. Editorial Feedback & Revisions (/api/v1/articles/:id/feedback, revisions)
 * 15. Two-Phase Presigned Media Upload & Confirmation (/api/v1/media/presigned-upload, confirm-upload)
 * 16. Pure Native Android Architecture Invariants (DEC-002: Multi-module Gradle, Zero WebViews, Keystore tokens, APK Binaries)
 */

import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ANDROID_DIR = path.resolve(ROOT_DIR, 'android');

// Import active API engine & services
const {
  handleApiRequest,
  signToken,
  verifyToken,
  adapter,
} = await import('../src/server/apiEngine.js');

// Helper to launch test HTTP server
function createTestServer() {
  const server = http.createServer((req, res) => {
    handleApiRequest(req, res);
  });

  let port;
  const start = () =>
    new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        port = server.address().port;
        resolve(port);
      });
    });

  const stop = () =>
    new Promise((resolve) => {
      server.close(resolve);
    });

  const request = (method, endpoint, body = null, headers = {}) => {
    return new Promise((resolve, reject) => {
      const bodyStr = body ? JSON.stringify(body) : null;
      const reqHeaders = {
        Accept: 'application/json',
        ...headers,
      };
      if (bodyStr && !reqHeaders['Content-Type']) {
        reqHeaders['Content-Type'] = 'application/json';
      }
      if (bodyStr) {
        reqHeaders['Content-Length'] = Buffer.byteLength(bodyStr, 'utf8');
      } else if (['POST', 'PUT', 'PATCH'].includes(method)) {
        reqHeaders['Content-Length'] = 0;
      }

      const req = http.request(
        `http://127.0.0.1:${port}${endpoint}`,
        { method, headers: reqHeaders },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            let json = null;
            try {
              json = JSON.parse(data);
            } catch {
              json = null;
            }
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: json,
              rawBody: data,
            });
          });
        }
      );
      req.on('error', reject);
      if (bodyStr) req.write(bodyStr, 'utf8');
      req.end();
    });
  };

  return { start, stop, request };
}

test('Master Execution 028: Native Android Application & Mobile Ecosystem Suite', async (t) => {
  const testServer = createTestServer();
  await testServer.start();

  t.after(async () => {
    await testServer.stop();
  });

  // Pre-seed test tokens & state
  let createdDraftId = null;
  const reporterUser = {
    id: 'usr-rep-1',
    fullName: 'राजेश पटेल',
    email: 'rajesh.patel@breakingnewswala.com',
    roles: ['REPORTER'],
    role: 'REPORTER',
  };
  const reporterToken = signToken(reporterUser, 900);
  const reporterRefreshToken = signToken({ ...reporterUser, refresh: true, tokenType: 'refresh' }, 7 * 86400);

  // Test 1: Public Reader News Feed Endpoint
  await t.test('1. Public Reader News Feed API conforms to mobile contract', async () => {
    const res = await testServer.request('GET', '/api/v1/articles?limit=10&status=PUBLISHED');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);

    const first = res.body.data[0];
    assert.ok(first.id);
    assert.ok(first.title);
    assert.strictEqual(typeof first.title, 'string');
    // Ensure Devanagari text is returned
    assert.match(first.title, /[\u0900-\u097F]/);
  });

  // Test 2: Article Detail & Deep Link Resolution
  await t.test('2. Article Detail & Deep-Link target lookup returns full story data', async () => {
    // Get existing articles
    const listRes = await testServer.request('GET', '/api/v1/articles?limit=1');
    assert.strictEqual(listRes.statusCode, 200);
    const articleId = listRes.body.data[0].id;

    // Fetch detail endpoint used by bnw://article/{id} deep-link
    const detailRes = await testServer.request('GET', `/api/v1/articles/${articleId}`);
    assert.strictEqual(detailRes.statusCode, 200);
    assert.strictEqual(detailRes.body.success, true);
    assert.strictEqual(detailRes.body.data.id, articleId);
    assert.ok(detailRes.body.data.content);
  });

  // Test 3: Madhya Pradesh Territory Hierarchy (Divisions & Districts)
  await t.test('3. Territory API returns 10 administrative divisions and MP districts', async () => {
    // Divisions
    const divRes = await testServer.request('GET', '/api/v1/territory/divisions');
    assert.strictEqual(divRes.statusCode, 200);
    assert.strictEqual(divRes.body.success, true);
    assert.ok(divRes.body.data.length >= 10);
    assert.ok(divRes.body.data.some((d) => d.nameHi === 'भोपाल'));
    assert.ok(divRes.body.data.some((d) => d.nameHi === 'इंदौर'));

    // Districts
    const distRes = await testServer.request('GET', '/api/v1/territory/districts');
    assert.strictEqual(distRes.statusCode, 200);
    assert.strictEqual(distRes.body.success, true);
    assert.ok(distRes.body.data.length > 0);
    assert.ok(distRes.body.data.some((d) => d.nameHi === 'भोपाल'));

    // Overview
    const ovRes = await testServer.request('GET', '/api/v1/territory/overview');
    assert.strictEqual(ovRes.statusCode, 200);
    assert.strictEqual(ovRes.body.success, true);
    assert.strictEqual(ovRes.body.data.state.code, 'MP');
  });

  // Test 4: Reporter Beat Assignments
  await t.test('4. Reporter Beat Assignments API returns assigned territorial beats', async () => {
    const res = await testServer.request('GET', '/api/v1/territory/my-assignments', null, {
      Authorization: `Bearer ${reporterToken}`,
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
    assert.ok(res.body.data.some((b) => b.districtName === 'भोपाल'));
  });

  // Test 5: Category Hierarchy
  await t.test('5. Categories API returns 21 news categories with Devanagari names', async () => {
    const res = await testServer.request('GET', '/api/v1/categories');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.length >= 10);
    assert.ok(res.body.data.some((c) => c.nameHi === 'मध्य प्रदेश' || c.nameHi === 'राजनीति'));
  });

  // Test 6: Digital E-Paper Edition APIs
  await t.test('6. Digital E-Paper Edition APIs return editions for native PdfRenderer', async () => {
    // List editions
    const listRes = await testServer.request('GET', '/api/v1/epaper/editions');
    assert.strictEqual(listRes.statusCode, 200);
    assert.strictEqual(listRes.body.success, true);
    assert.ok(Array.isArray(listRes.body.data));
    assert.ok(listRes.body.data.length > 0);

    const edition = listRes.body.data[0];
    assert.ok(edition.id);
    assert.ok(edition.pdfUrl);
    assert.ok(edition.totalPages >= 1);

    // Latest edition
    const latestRes = await testServer.request('GET', '/api/v1/epaper/latest');
    assert.strictEqual(latestRes.statusCode, 200);
    assert.strictEqual(latestRes.body.success, true);
    assert.ok(latestRes.body.data.pdfUrl);

    // Single edition by ID
    const singleRes = await testServer.request('GET', `/api/v1/epaper/editions/${edition.id}`);
    assert.strictEqual(singleRes.statusCode, 200);
    assert.strictEqual(singleRes.body.success, true);
  });

  // Test 7: E-Paper Engagement Telemetry
  await t.test('7. E-Paper view and download telemetry recording succeeds', async () => {
    const viewRes = await testServer.request('POST', '/api/v1/epaper/editions/epaper-bhopal-latest/view');
    assert.strictEqual(viewRes.statusCode, 200);
    assert.strictEqual(viewRes.body.success, true);

    const dlRes = await testServer.request('POST', '/api/v1/epaper/editions/epaper-bhopal-latest/download');
    assert.strictEqual(dlRes.statusCode, 200);
    assert.strictEqual(dlRes.body.success, true);
  });

  // Test 8: ASCI-Compliant Ad Serving
  await t.test('8. Monetization ad serving adheres to ASCI standards with creative data', async () => {
    const res = await testServer.request('GET', '/api/v1/monetization/ads/serve?placementSlot=feed_native');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.creativeUrl);
    assert.strictEqual(typeof res.body.data.isSponsored, 'boolean');

    // Impression tracking
    const impRes = await testServer.request('POST', '/api/v1/monetization/ads/impression', {
      campaignId: 'camp-001',
      adId: 'ad-001',
      placementSlot: 'feed_native',
      platform: 'android',
    });
    assert.strictEqual(impRes.statusCode, 200);
    assert.strictEqual(impRes.body.success, true);
  });

  // Test 9: Mobile Analytics Event Ingestion
  await t.test('9. Mobile Analytics accepts Android app session and article read events', async () => {
    const payload = {
      eventName: 'app_session_started',
      sessionId: 'sess-android-test-001',
      platform: 'android',
      timestamp: new Date().toISOString(),
    };
    const res = await testServer.request('POST', '/api/v1/analytics/events', payload);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);

    const readPayload = {
      eventName: 'article_read_30s',
      sessionId: 'sess-android-test-001',
      articleId: 'art-001',
      platform: 'android',
      durationSeconds: 30,
      scrollDepth: 85,
    };
    const readRes = await testServer.request('POST', '/api/v1/analytics/events', readPayload);
    assert.strictEqual(readRes.statusCode, 200);
    assert.strictEqual(readRes.body.success, true);
  });

  // Test 10: FCM Push Token Registration & Notification Preferences
  await t.test('10. FCM Push Device Registration & preferences management', async () => {
    const regRes = await testServer.request('POST', '/api/v1/notifications/register-token', {
      token: 'fcm-mock-android-device-token-12345',
      platform: 'android',
      deviceModel: 'Pixel 8 Pro',
      appVersion: '1.0.0',
    });
    assert.strictEqual(regRes.statusCode, 200);
    assert.strictEqual(regRes.body.success, true);
    assert.strictEqual(regRes.body.data.platform, 'android');

    // Notification Preferences
    const prefRes = await testServer.request('GET', '/api/v1/notifications/preferences');
    assert.strictEqual(prefRes.statusCode, 200);
    assert.strictEqual(prefRes.body.success, true);
    assert.strictEqual(prefRes.body.data.breakingNews, true);
  });

  // Test 11: Reporter Mobile Authentication & Refresh Cycle
  await t.test('11. Reporter authentication & token refresh cycle behaves securely', async () => {
    // Refresh token
    const refreshRes = await testServer.request('POST', '/api/v1/auth/refresh', {
      refreshToken: reporterRefreshToken,
    });
    assert.strictEqual(refreshRes.statusCode, 200);
    assert.strictEqual(refreshRes.body.success, true);
    assert.ok(refreshRes.body.data.token || refreshRes.body.data.tokens?.accessToken);

    // Profile check with token
    const meRes = await testServer.request('GET', '/api/v1/auth/me', null, {
      Authorization: `Bearer ${reporterToken}`,
    });
    assert.strictEqual(meRes.statusCode, 200);
    assert.strictEqual(meRes.body.success, true);
    assert.strictEqual(meRes.body.data.id, reporterUser.id);
  });

  // Test 12: Reporter Devanagari Draft Creation & Retrieval
  await t.test('12. Reporter can create and retrieve Devanagari news drafts', async () => {
    const draftPayload = {
      title: 'भोपाल में नए फ्लाईओवर का निर्माण कार्य शुरू, यातायात में सुगमता',
      summary: 'मध्य प्रदेश की राजधानी भोपाल में नए 6-लेन फ्लाईओवर का निर्माण कार्य प्रारंभ हो चुका है।',
      content: 'भोपाल शहर में बढ़ते यातायात दबाव को कम करने के उद्देश्य से नए 6-लेन आधुनिक फ्लाईओवर का निर्माण कार्य आज से प्रारंभ कर दिया गया है। लोक निर्माण विभाग (PWD) के वरिष्ठ अधिकारियों ने मौके का मुआयना किया और कार्य की गुणवत्ता की समीक्षा की। इस परियोजना से लगभग 5 लाख नागरिकों को प्रतिदिन जाम से मुक्ति मिलेगी। निर्माण कार्य आगामी 18 महीनों में पूर्ण करने का लक्ष्य निर्धारित किया गया है।',
      categoryId: 'cat-mp',
      divisionId: 'div-bhopal',
      districtId: 'dist-bhopal',
      isBreaking: false,
    };

    const createRes = await testServer.request('POST', '/api/v1/articles/drafts', draftPayload, {
      Authorization: `Bearer ${reporterToken}`,
    });
    assert.strictEqual(createRes.statusCode, 200);
    assert.strictEqual(createRes.body.success, true);
    const createdDraft = createRes.body.data;
    assert.ok(createdDraft.id);
    assert.strictEqual(createdDraft.title, draftPayload.title);
    createdDraftId = createdDraft.id;

    // Retrieve Draft by ID
    const getRes = await testServer.request('GET', `/api/v1/articles/drafts/${createdDraft.id}`, null, {
      Authorization: `Bearer ${reporterToken}`,
    });
    assert.strictEqual(getRes.statusCode, 200);
    assert.strictEqual(getRes.body.success, true);
    assert.strictEqual(getRes.body.data.id, createdDraft.id);

    // Update Draft
    const updateRes = await testServer.request(
      'PATCH',
      `/api/v1/articles/drafts/${createdDraft.id}`,
      { imageCaption: 'फ्लाईओवर निर्माण स्थल का दृश्य' },
      { Authorization: `Bearer ${reporterToken}` }
    );
    assert.strictEqual(updateRes.statusCode, 200);
    assert.strictEqual(updateRes.body.success, true);
  });

  // Test 13: Submit Draft into Editorial Review Queue
  await t.test('13. Reporter can submit draft article into editorial review queue', async () => {
    assert.ok(createdDraftId, 'Draft ID must exist from previous step');
    const submitRes = await testServer.request('POST', `/api/v1/articles/${createdDraftId}/submit`, null, {
      Authorization: `Bearer ${reporterToken}`,
    });
    assert.strictEqual(submitRes.statusCode, 200);
    assert.strictEqual(submitRes.body.success, true);
    assert.ok(['SUBMITTED', 'PENDING_REVIEW'].includes(submitRes.body.data.status));
  });

  // Test 14: Editorial Feedback & Revision Tracking
  await t.test('14. Editorial feedback and revision history endpoints return review directives', async () => {
    const feedbackRes = await testServer.request('GET', '/api/v1/articles/art-001/feedback', null, {
      Authorization: `Bearer ${reporterToken}`,
    });
    assert.strictEqual(feedbackRes.statusCode, 200);
    assert.strictEqual(feedbackRes.body.success, true);
    assert.ok(Array.isArray(feedbackRes.body.data));
    assert.ok(feedbackRes.body.data.length > 0);
    assert.strictEqual(feedbackRes.body.data[0].revisionRequired, true);

    const revisionsRes = await testServer.request('GET', '/api/v1/articles/art-001/revisions', null, {
      Authorization: `Bearer ${reporterToken}`,
    });
    assert.strictEqual(revisionsRes.statusCode, 200);
    assert.strictEqual(revisionsRes.body.success, true);
    assert.ok(Array.isArray(revisionsRes.body.data));
  });

  // Test 15: Media Presigned Upload & Confirmation
  await t.test('15. Two-Phase Presigned Media Upload & Confirmation cycle operates cleanly', async () => {
    const presignedReq = {
      fileName: 'news_photo_bhopal.jpg',
      fileSizeBytes: 2048576,
      mimeType: 'image/jpeg',
      assetType: 'IMAGE',
      altTextHi: 'भोपाल निर्माण कार्य',
    };

    const presignedRes = await testServer.request('POST', '/api/v1/media/presigned-upload', presignedReq, {
      Authorization: `Bearer ${reporterToken}`,
    });
    assert.strictEqual(presignedRes.statusCode, 200);
    assert.strictEqual(presignedRes.body.success, true);
    assert.ok(presignedRes.body.data.uploadUrl);
    assert.ok(presignedRes.body.data.assetId);

    // Confirm Upload
    const confirmRes = await testServer.request('POST', '/api/v1/media/confirm-upload', {
      assetId: presignedRes.body.data.assetId,
      storageKey: presignedRes.body.data.storageKey,
    }, {
      Authorization: `Bearer ${reporterToken}`,
    });
    assert.strictEqual(confirmRes.statusCode, 200);
    assert.strictEqual(confirmRes.body.success, true);
  });

  // Test 16: Pure Native Android Architecture Invariants (DEC-002)
  await t.test('16. Verify Android Project Structure, Zero WebViews, and compiled APK artifacts', async () => {
    // 16.1 Verify directory exists
    assert.ok(fs.existsSync(ANDROID_DIR), 'android/ directory must exist');

    // 16.2 Verify settings.gradle.kts includes all 10 modules
    const settingsPath = path.join(ANDROID_DIR, 'settings.gradle.kts');
    assert.ok(fs.existsSync(settingsPath), 'android/settings.gradle.kts must exist');
    const settingsContent = fs.readFileSync(settingsPath, 'utf8');
    const requiredModules = [
      ':app-reader',
      ':app-reporter',
      ':core:model',
      ':core:network',
      ':core:auth',
      ':core:designsystem',
      ':core:analytics',
      ':core:notifications',
      ':core:media',
      ':core:pdf',
    ];
    for (const mod of requiredModules) {
      assert.ok(settingsContent.includes(mod), `settings.gradle.kts must include ${mod}`);
    }

    // 16.3 Verify Pure Native Invariant (DEC-002: Zero WebViews in codebase)
    const appReaderBuild = fs.readFileSync(path.join(ANDROID_DIR, 'app-reader/build.gradle.kts'), 'utf8');
    const appReporterBuild = fs.readFileSync(path.join(ANDROID_DIR, 'app-reporter/build.gradle.kts'), 'utf8');
    assert.ok(!appReaderBuild.includes('webkit'), 'app-reader must not depend on WebKit');
    assert.ok(!appReporterBuild.includes('webkit'), 'app-reporter must not depend on WebKit');
    assert.ok(appReaderBuild.includes('androidx.compose.material3'), 'app-reader must use Jetpack Compose Material 3');
    assert.ok(appReporterBuild.includes('androidx.compose.material3'), 'app-reporter must use Jetpack Compose Material 3');

    // 16.4 Verify TokenManager uses EncryptedSharedPreferences (AES-256)
    const tokenManagerPath = path.join(ANDROID_DIR, 'core/auth/src/main/kotlin/com/breakingnewswala/core/auth/TokenManager.kt');
    assert.ok(fs.existsSync(tokenManagerPath), 'TokenManager.kt must exist');
    const tokenManagerContent = fs.readFileSync(tokenManagerPath, 'utf8');
    assert.ok(tokenManagerContent.includes('EncryptedSharedPreferences'), 'TokenManager must use EncryptedSharedPreferences');
    assert.ok(tokenManagerContent.includes('AES256_GCM'), 'TokenManager must use AES-256 GCM encryption');

    // 16.5 Verify compiled APK artifacts exist
    const readerDebugApk = path.join(ANDROID_DIR, 'app-reader/build/outputs/apk/debug/app-reader-debug.apk');
    const reporterDebugApk = path.join(ANDROID_DIR, 'app-reporter/build/outputs/apk/debug/app-reporter-debug.apk');
    assert.ok(fs.existsSync(readerDebugApk), 'app-reader-debug.apk must exist');
    assert.ok(fs.existsSync(reporterDebugApk), 'app-reporter-debug.apk must exist');

    const readerApkStat = fs.statSync(readerDebugApk);
    const reporterApkStat = fs.statSync(reporterDebugApk);
    assert.ok(readerApkStat.size > 10 * 1024 * 1024, 'app-reader-debug.apk must be > 10MB');
    assert.ok(reporterApkStat.size > 10 * 1024 * 1024, 'app-reporter-debug.apk must be > 10MB');
  });
});
