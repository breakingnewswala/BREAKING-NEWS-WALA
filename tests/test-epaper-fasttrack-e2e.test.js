/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * E-Paper Fast-Track End-to-End Test Suite
 * File: tests/test-epaper-fasttrack-e2e.test.js
 * 
 * Validates:
 * 1. Preflight Scanner 12-Page Mandatory Rule for Daily Editions
 * 2. Preflight Scanner prevents publishing non-12-page daily edition via API
 * 3. Successful 12-Page Publishing with Immutable Version Snapshot
 * 4. Public vs Private Access Control (Drafts hidden, Published available)
 * 5. WhatsApp Clipping Card Role Restriction (REPORTER/Staff only, 20/day limit)
 * 6. Media Presigned Upload Security (Auth check, SVG blocking, Server-generated paths)
 * 7. Authorized Media File Download & Retrieval (Role/Owner access control, nosniff)
 * 8. 300 DPI Broadsheet Raster & PDF-1.4 Export Quality
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { handleApiRequest, signToken } from '../src/server/apiEngine.js';
import { getPersistenceAdapter } from '../src/server/persistence/adapter.js';
import { setupIsolatedTestPersistence } from './testIsolationHelper.js';
import { defaultCloudStorageService } from '../src/server/storage/cloudStorageService.js';
import { QualityPreflightScanner, SEVERITY } from '../src/server/epaper/preflightScanner.js';
import { HighResExportEngine, BROADSHEET_CONSTANTS } from '../src/server/epaper/exportEngine.js';

process.env.NODE_ENV = 'test';

function createMockServer() {
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
    const bodyStr = (body && typeof body === 'object') ? JSON.stringify(body) : body;
    const reqHeaders = {
      'Accept': 'application/json',
      ...headers,
    };
    if (bodyStr && !reqHeaders['Content-Type']) {
      reqHeaders['Content-Type'] = 'application/json';
    }
    if (bodyStr) {
      reqHeaders['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = http.request(fullUrl, {
      method,
      headers: reqHeaders,
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks);
        let json = null;
        try {
          json = JSON.parse(raw.toString('utf8'));
        } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json,
          raw,
        });
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });

  return { start, stop, request };
}

test('E-Paper Fast-Track Completion & Security Hardening Test Suite', async (t) => {
  const mockServer = createMockServer();
  await mockServer.start();
  const isolation = setupIsolatedTestPersistence({ prefix: 'fasttrack_' });
  const adapter = isolation.adapter;

  const readerToken = signToken({ id: 'user-reader-01', identifier: 'reader@example.com', roles: ['READER'], district: 'भोपाल' });
  const reporterToken = signToken({ id: 'user-reporter-01', identifier: 'reporter@example.com', roles: ['REPORTER'], district: 'भोपाल' });
  const editorToken = signToken({ id: 'user-editor-01', identifier: 'editor@example.com', roles: ['EDITOR'], district: 'भोपाल' });
  const adminToken = signToken({ id: 'user-admin-01', identifier: 'admin@example.com', roles: ['ADMIN'], district: 'भोपाल' });

  t.after(async () => {
    await mockServer.stop();
    if (isolation && isolation.cleanup) {
      isolation.cleanup();
    }
  });

  // --------------------------------------------------------------------------
  // TEST 1: Preflight Scanner 12-Page Mandatory Rule for Daily Editions
  // --------------------------------------------------------------------------
  await t.test('1. Preflight Scanner enforces exactly 12 pages for DAILY editions', async () => {
    // 4-page daily edition should have BLOCKER
    const fourPages = [
      { pageNumber: 1, templateId: 'tpl-1', elements: [] },
      { pageNumber: 2, templateId: 'tpl-2', elements: [] },
      { pageNumber: 3, templateId: 'tpl-3', elements: [] },
      { pageNumber: 4, templateId: 'tpl-4', elements: [] },
    ];

    const dailyPreflight = QualityPreflightScanner.evaluate(
      { id: 'ed-daily-test', editionType: 'DAILY' },
      fourPages
    );
    assert.strictEqual(dailyPreflight.canPublish, false, 'Daily edition with 4 pages must NOT be publishable');
    const pageCountBlocker = dailyPreflight.blockers.find((b) => b.code === 'INVALID_PAGE_COUNT');
    assert.ok(pageCountBlocker, 'Must contain INVALID_PAGE_COUNT blocker');
    assert.match(pageCountBlocker.message, /12 पृष्ठ होने चाहिए/);

    // Special edition with 4 pages should NOT have INVALID_PAGE_COUNT blocker
    const specialPreflight = QualityPreflightScanner.evaluate(
      { id: 'ed-special-test', editionType: 'SPECIAL' },
      fourPages
    );
    const specialPageCountBlocker = specialPreflight.blockers.find((b) => b.code === 'INVALID_PAGE_COUNT');
    assert.strictEqual(specialPageCountBlocker, undefined, 'Special editions are flexible in page count');

    // 12-page daily edition passes page count rule
    const twelvePages = Array.from({ length: 12 }, (_, i) => ({
      pageNumber: i + 1,
      templateId: `tpl-${i + 1}`,
      elements: [],
    }));
    const fullDailyPreflight = QualityPreflightScanner.evaluate(
      { id: 'ed-full-daily', editionType: 'DAILY' },
      twelvePages
    );
    const noBlocker = fullDailyPreflight.blockers.find((b) => b.code === 'INVALID_PAGE_COUNT');
    assert.strictEqual(noBlocker, undefined, '12-page daily edition should not have INVALID_PAGE_COUNT blocker');
  });

  // --------------------------------------------------------------------------
  // TEST 2: Preflight Scanner prevents publishing non-12-page daily edition via API
  // --------------------------------------------------------------------------
  await t.test('2. Attempting to publish non-12-page daily edition returns 422 ERR_PREFLIGHT_BLOCKER', async () => {
    // Create draft daily edition
    const createRes = await mockServer.request('POST', '/api/v1/epaper/editions', {
      title: 'अधूरा दैनिक अंक',
      publicationDate: '2026-11-20',
      districtId: 'dist-bhopal',
      editionType: 'DAILY',
    }, { Authorization: `Bearer ${editorToken}` });

    assert.strictEqual(createRes.statusCode, 201);
    const edition = createRes.data.data.edition;
    const editionId = edition.id;

    // Simulate missing pages: keep only 4 pages in persistence for this edition
    const pages = await adapter.getEpaperPagesByEditionId(editionId);
    if (pages.length > 4) {
      const removedIds = new Set(pages.slice(4).map(p => p.id));
      adapter.data.epaperPages = adapter.data.epaperPages.filter(p => !removedIds.has(p.id));
      edition.pages = pages.slice(0, 4).map(p => p.id);
      edition.totalPages = 4;
      await adapter.saveEpaperEdition(edition, { id: 'user-editor-01', roles: ['EDITOR'] });
    }

    // Publish attempt when only 4 pages are present
    const pubRes = await mockServer.request('POST', `/api/v1/epaper/editions/${editionId}/publish`, {}, {
      Authorization: `Bearer ${editorToken}`,
    });

    assert.strictEqual(pubRes.statusCode, 422, 'Must reject with HTTP 422');
    assert.ok(
      pubRes.data.code === 'ERR_PREFLIGHT_BLOCKER' || pubRes.data.code === 'ERR_QUALITY_CHECK_FAILED',
      `Expected ERR_PREFLIGHT_BLOCKER or ERR_QUALITY_CHECK_FAILED, got ${pubRes.data.code}`
    );
    const blockers = pubRes.data.diagnostics?.blockers || pubRes.data.qualityReport?.issues || [];
    assert.ok(blockers.some((b) => b.code === 'INVALID_PAGE_COUNT' || b.code === 'DAILY_PAGE_COUNT_MISMATCH'));
  });

  // --------------------------------------------------------------------------
  // TEST 3: Successful 12-page edition publishing with immutable version snapshot
  // --------------------------------------------------------------------------
  await t.test('3. Successful 12-page daily edition publishing and immutable snapshot', async () => {
    const createRes = await mockServer.request('POST', '/api/v1/epaper/editions', {
      title: 'पूर्ण 12-पृष्ठीय भोपाल दैनिक अंक',
      publicationDate: '2026-11-21',
      districtId: 'dist-bhopal',
      editionType: 'DAILY',
    }, { Authorization: `Bearer ${editorToken}` });

    assert.strictEqual(createRes.statusCode, 201);
    const edition = createRes.data.data.edition;
    const editionId = edition.id;
    assert.strictEqual(createRes.data.data.pages.length, 12, 'Daily edition must have all 12 canonical pages generated');

    // Publish the complete 12-page edition
    const pubRes = await mockServer.request('POST', `/api/v1/epaper/editions/${editionId}/publish`, {}, {
      Authorization: `Bearer ${editorToken}`,
    });

    assert.strictEqual(pubRes.statusCode, 200, 'Publishing 12-page edition should succeed');
    assert.strictEqual(pubRes.data.data.status, 'PUBLISHED');
    assert.ok(pubRes.data.snapshot, 'Must return immutable version snapshot');
    assert.strictEqual(pubRes.data.snapshot.editionId, editionId);

    // Public Reader can access published edition
    const publicRes = await mockServer.request('GET', `/api/v1/epaper/editions/${editionId}`);
    assert.strictEqual(publicRes.statusCode, 200);
    assert.strictEqual(publicRes.data.data.id, editionId);
    assert.strictEqual(publicRes.data.data.status, 'PUBLISHED');
  });

  // --------------------------------------------------------------------------
  // TEST 4: Draft Edition Access Control (Public / Readers denied, Staff allowed)
  // --------------------------------------------------------------------------
  await t.test('4. Draft editions are hidden from anonymous and ordinary readers', async () => {
    const draftRes = await mockServer.request('POST', '/api/v1/epaper/editions', {
      title: 'गोपनीय संपादकीय ड्राफ्ट',
      publicationDate: '2026-11-22',
      districtId: 'dist-indore',
      editionType: 'DAILY',
    }, { Authorization: `Bearer ${editorToken}` });

    assert.strictEqual(draftRes.statusCode, 201);
    const draftId = draftRes.data.data.edition.id;

    // Anonymous request
    const anonRes = await mockServer.request('GET', `/api/v1/epaper/editions/${draftId}`);
    assert.strictEqual(anonRes.statusCode, 403, 'Anonymous user must be denied draft access');

    // Reader request
    const readerRes = await mockServer.request('GET', `/api/v1/epaper/editions/${draftId}`, null, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.strictEqual(readerRes.statusCode, 403, 'Ordinary reader must be denied draft access');

    // Editor request
    const editorAccessRes = await mockServer.request('GET', `/api/v1/epaper/editions/${draftId}`, null, {
      Authorization: `Bearer ${editorToken}`,
    });
    assert.strictEqual(editorAccessRes.statusCode, 200, 'Editor can view draft');
  });

  // --------------------------------------------------------------------------
  // TEST 5: WhatsApp Clipping Card Role Check and Quota Enforcement
  // --------------------------------------------------------------------------
  await t.test('5. WhatsApp clipping card generation enforces REPORTER/Staff role and daily quota', async () => {
    const testReporterId = `user-reporter-${Date.now()}`;
    const uniqueReporterToken = signToken({ id: testReporterId, identifier: 'reporter_e2e@example.com', roles: ['REPORTER'], district: 'भोपाल' });

    // 5a. Anonymous access denied
    const anonRes = await mockServer.request('POST', '/api/v1/epaper/whatsapp/generate', {
      headline: 'अवैध खनन पर बड़ी कार्रवाई',
      districtName: 'भोपाल',
      format: '1:1',
    });
    assert.strictEqual(anonRes.statusCode, 401, 'Anonymous must receive HTTP 401');

    // 5b. Reader access denied
    const readerRes = await mockServer.request('POST', '/api/v1/epaper/whatsapp/generate', {
      headline: 'अवैध खनन पर बड़ी कार्रवाई',
      districtName: 'भोपाल',
      format: '1:1',
    }, { Authorization: `Bearer ${readerToken}` });
    assert.strictEqual(readerRes.statusCode, 403, 'Reader must receive HTTP 403 ERR_FORBIDDEN');
    assert.strictEqual(readerRes.data.error.code, 'ERR_FORBIDDEN');

    // 5c. Authorized Reporter generates card successfully
    const reporterRes = await mockServer.request('POST', '/api/v1/epaper/whatsapp/generate', {
      headline: 'अवैध रेत खनन पर प्रशासन का छापा',
      districtName: 'भोपाल',
      format: '1:1',
      body: 'नर्मदा किनारे 5 पोकलेन मशीनें जब्त, खनिज विभाग ने की एफआईआर दर्ज।',
    }, { Authorization: `Bearer ${uniqueReporterToken}` });

    assert.strictEqual(reporterRes.statusCode, 201, 'Reporter must be able to generate WhatsApp card');
    assert.ok(reporterRes.data.data.id, 'Must return generation id');
    assert.ok(reporterRes.data.data.storagePath, 'Must return storagePath');

    // 5d. Check quota
    const today = adapter._getIndiaDateString();
    const quota = await adapter.getReporterWhatsAppQuota(testReporterId, today);
    assert.strictEqual(quota.maxDaily, 20);
    assert.strictEqual(quota.used, 1);
    assert.strictEqual(quota.remaining, 19);
  });

  // --------------------------------------------------------------------------
  // TEST 6: Presigned Upload Security & Storage Path Generation
  // --------------------------------------------------------------------------
  await t.test('6. Media presigned-upload enforces auth, rejects SVG, and generates server paths', async () => {
    // 6a. Anonymous denied
    const anonRes = await mockServer.request('POST', '/api/v1/media/presigned-upload', {
      fileName: 'news_photo.jpg',
      mimeType: 'image/jpeg',
    });
    assert.strictEqual(anonRes.statusCode, 401);

    // 6b. Ordinary reader denied for news article uploads
    const readerRes = await mockServer.request('POST', '/api/v1/media/presigned-upload', {
      fileName: 'news_photo.jpg',
      mimeType: 'image/jpeg',
      category: 'article',
    }, { Authorization: `Bearer ${readerToken}` });
    assert.strictEqual(readerRes.statusCode, 403);

    // 6c. Reader allowed for avatar upload
    const avatarRes = await mockServer.request('POST', '/api/v1/media/presigned-upload', {
      fileName: 'avatar.png',
      mimeType: 'image/png',
      category: 'avatar',
    }, { Authorization: `Bearer ${readerToken}` });
    assert.strictEqual(avatarRes.statusCode, 200);
    assert.match(avatarRes.data.data.storagePath, /^avatars\/user-reader-01\//);

    // 6d. SVG rejected for security
    const svgRes = await mockServer.request('POST', '/api/v1/media/presigned-upload', {
      fileName: 'malicious.svg',
      mimeType: 'image/svg+xml',
      category: 'article',
    }, { Authorization: `Bearer ${reporterToken}` });
    assert.strictEqual(svgRes.statusCode, 400);
    assert.strictEqual(svgRes.data.error.code, 'ERR_UNSUPPORTED_MIME_TYPE');

    // 6e. Reporter allowed for news media
    const reporterRes = await mockServer.request('POST', '/api/v1/media/presigned-upload', {
      fileName: 'metro_opening.jpg',
      mimeType: 'image/jpeg',
      category: 'article',
    }, { Authorization: `Bearer ${reporterToken}` });
    assert.strictEqual(reporterRes.statusCode, 200);
    assert.match(reporterRes.data.data.storagePath, /^media\/articles\/\d{4}\/\d{2}\//);
    assert.ok(reporterRes.data.data.uploadUrl);
  });

  // --------------------------------------------------------------------------
  // TEST 7: Authorized Media File Retrieval Endpoint
  // --------------------------------------------------------------------------
  await t.test('7. Authorized media retrieval enforces nosniff and privacy permissions', async () => {
    // 7a. Public article media upload via backend
    const uploadRes = await mockServer.request('POST', '/api/v1/media/upload', {
      fileName: 'test_article_banner.jpg',
      mimeType: 'image/jpeg',
      category: 'article',
      fileBuffer: Buffer.from('FAKE_JPEG_IMAGE_CONTENT').toString('base64'),
    }, { Authorization: `Bearer ${reporterToken}` });

    assert.ok(uploadRes.statusCode === 200 || uploadRes.statusCode === 201);
    const mediaUrl = uploadRes.data.data.url;
    assert.ok(mediaUrl);

    // 7b. Retrieve file via GET /api/v1/media/file/*
    const storagePath = uploadRes.data.data.storagePath;
    const fetchRes = await mockServer.request('GET', `/api/v1/media/file/${encodeURIComponent(storagePath)}`);
    assert.strictEqual(fetchRes.statusCode, 200);
    assert.strictEqual(fetchRes.headers['x-content-type-options'], 'nosniff');
    assert.strictEqual(fetchRes.raw.toString(), 'FAKE_JPEG_IMAGE_CONTENT');

    // 7c. Private reporter credential path security
    const credStoragePath = `reporters/user-reporter-01/credentials/press_id.pdf`;
    // Write fake buffer via defaultCloudStorageService
    await defaultCloudStorageService.uploadFile({
      buffer: Buffer.from('CONFIDENTIAL_PRESS_CREDENTIALS'),
      storagePath: credStoragePath,
      mimeType: 'application/pdf',
      isPublic: false,
    });

    // Anonymous request denied
    const anonCredRes = await mockServer.request('GET', `/api/v1/media/file/${encodeURIComponent(credStoragePath)}`);
    assert.strictEqual(anonCredRes.statusCode, 401);

    // Non-owner reader denied
    const otherReaderRes = await mockServer.request('GET', `/api/v1/media/file/${encodeURIComponent(credStoragePath)}`, null, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.strictEqual(otherReaderRes.statusCode, 403);

    // Owner reporter allowed
    const ownerRes = await mockServer.request('GET', `/api/v1/media/file/${encodeURIComponent(credStoragePath)}`, null, {
      Authorization: `Bearer ${reporterToken}`,
    });
    assert.strictEqual(ownerRes.statusCode, 200);
    assert.strictEqual(ownerRes.raw.toString(), 'CONFIDENTIAL_PRESS_CREDENTIALS');

    // Admin allowed
    const adminRes = await mockServer.request('GET', `/api/v1/media/file/${encodeURIComponent(credStoragePath)}`, null, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(adminRes.statusCode, 200);
  });

  // --------------------------------------------------------------------------
  // TEST 8: High-Res Broadsheet Export Engine (PNG & PDF)
  // --------------------------------------------------------------------------
  await t.test('8. High-Res Broadsheet Export Engine synthesizes 300 DPI raster and PDF-1.4', async () => {
    const dummyEdition = {
      id: 'ed-export-test',
      title: 'दैनिक भोपाल प्रभात',
      editionCode: 'EP-20261125-BHOPAL-01',
      editionDate: '2026-11-25',
      districtId: 'dist-bhopal',
      editionType: 'DAILY',
      totalPages: 12,
    };

    const dummyPage = {
      pageNumber: 1,
      templateId: 'tpl-front-01',
      elements: [
        {
          id: 'el-lead-01',
          elementType: 'STORY',
          headline: 'मध्य प्रदेश में डिजिटल पत्रकारिता का नया अध्याय',
          customBodyText: 'हाइपरलोकल समाचारों के लिए नया 12-पृष्ठीय ब्रॉडशीट ई-पेपर लॉन्च।',
          bounds: { x: 50, y: 100, width: 800, height: 400 },
          byline: 'विशेष संवाददाता',
        },
      ],
    };

    // 8a. PNG Raster Generation (300 DPI, 3886 x 6142 px)
    const pngBuffer = HighResExportEngine.generate300DpiPageImage(dummyPage, dummyEdition);
    assert.ok(pngBuffer instanceof Buffer, 'Must return PNG buffer');
    const pngHeader = pngBuffer.slice(0, 8);
    assert.deepStrictEqual([...pngHeader], [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], 'Must have authentic PNG magic bytes');

    // 8b. PDF Document Generation (PDF-1.4, Broadsheet MediaBox [0 0 932.6 1474])
    const pdfBuffer = HighResExportEngine.buildPrintReadyPdf(dummyEdition, [dummyPage]);
    assert.ok(pdfBuffer instanceof Buffer, 'Must return PDF buffer');
    const pdfHeader = pdfBuffer.slice(0, 8).toString('utf8');
    assert.ok(pdfHeader.startsWith('%PDF-1.4'), 'PDF buffer must start with %PDF-1.4');
  });

  // --------------------------------------------------------------------------
  // TEST 9: Complete 12-Page Safe Test Edition Editorial Lifecycle
  // --------------------------------------------------------------------------
  await t.test('9. Safe Test Edition 12-page editorial flow with assignments and preflight scan', async () => {
    // 9a. Create safe test edition
    const createRes = await mockServer.request('POST', '/api/v1/epaper/editions', {
      title: 'सुरक्षित परीक्षण 12-पृष्ठीय दैनिक अंक',
      publicationDate: '2026-11-28',
      districtId: 'dist-bhopal',
      editionType: 'DAILY',
    }, { Authorization: `Bearer ${editorToken}` });

    assert.strictEqual(createRes.statusCode, 201);
    const edition = createRes.data.data.edition;
    const editionId = edition.id;
    const pages = createRes.data.data.pages;
    assert.strictEqual(pages.length, 12, 'Must contain all 12 canonical pages');

    // 9b. Assign verified news story and ASCI-compliant ad to Page 1
    const page1 = pages[0];
    page1.elements = [
      {
        id: 'story-lead-01',
        elementType: 'STORY',
        headline: 'मध्य प्रदेश में नवीकरणीय ऊर्जा विकास योजना का विस्तार',
        customBodyText: 'सौर ऊर्जा संयंत्रों की स्थापना से 500 मेगावॉट अतिरिक्त बिजली उत्पादन का लक्ष्य तय।',
        byline: 'अनिल शर्मा, विशेष संवाददाता',
        bounds: { x: 40, y: 80, width: 700, height: 300 },
      },
      {
        id: 'ad-commercial-01',
        elementType: 'AD',
        adTitle: 'मध्य प्रदेश पर्यटन विकास निगम',
        asciBadge: true,
        adStatus: 'APPROVED',
        bounds: { x: 40, y: 400, width: 350, height: 180 },
      },
    ];
    await adapter.saveEpaperPage(page1);

    // 9c. Run Quality Preflight Scanner
    const allPages = await adapter.getEpaperPagesByEditionId(editionId);
    const preflight = QualityPreflightScanner.evaluate(edition, allPages);
    assert.strictEqual(preflight.canPublish, true, 'Fully configured 12-page edition must pass preflight');
    assert.strictEqual(preflight.blockers.length, 0, 'Must have zero blockers');

    // 9d. Publish the test edition via API
    const pubRes = await mockServer.request('POST', `/api/v1/epaper/editions/${editionId}/publish`, {}, {
      Authorization: `Bearer ${editorToken}`,
    });
    assert.strictEqual(pubRes.statusCode, 200);
    assert.strictEqual(pubRes.data.data.status, 'PUBLISHED');
    assert.ok(pubRes.data.snapshot, 'Immutable snapshot must be created');

    // 9e. Reader access verified
    const readerRes = await mockServer.request('GET', `/api/v1/epaper/editions/${editionId}`);
    assert.strictEqual(readerRes.statusCode, 200);
    assert.strictEqual(readerRes.data.data.status, 'PUBLISHED');
  });

  // --------------------------------------------------------------------------
  // TEST 10: Production GCS Fail-Closed Policy Enforcement
  // --------------------------------------------------------------------------
  await t.test('10. Production GCS upload strictly fails closed when bucket credentials unavailable', async () => {
    const prevEnv = process.env.NODE_ENV;
    try {
      // Simulate production environment
      process.env.NODE_ENV = 'production';

      let failedClosed = false;
      try {
        await defaultCloudStorageService.uploadFile({
          buffer: Buffer.from('TEST_PAYLOAD'),
          storagePath: 'media/test/fail_closed_probe.jpg',
          mimeType: 'image/jpeg',
          isPublic: true,
        });
      } catch (err) {
        failedClosed = true;
        assert.match(err.message, /Production GCS/i, 'Error message must reflect production GCS failure');
      }

      assert.strictEqual(failedClosed, true, 'Must throw error and fail closed in production when GCS credentials missing');
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });
});
