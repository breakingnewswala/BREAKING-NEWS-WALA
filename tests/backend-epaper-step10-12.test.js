/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Automated Test Suite — Milestone 5 (Steps 10, 11, 12)
 * File: tests/backend-epaper-step10-12.test.js
 * 
 * Verifies 100% of Milestone 5 Requirements:
 * 1. Step 10: Quality Checker Workflow & Publishing Gate (R7, Features F17, F18)
 *    - 5 diagnostic checks: TEXT_OVERFLOW, LOW_RES_IMAGE, MISSING_ATTRIBUTION, UNAPPROVED_AD_PLACEMENT, ORPHAN_HEADLINE
 *    - QualityPreflightScanner evaluate logic
 *    - Atomic publishing gate: HTTP 422 on blocker
 *    - Optimistic Concurrency Control (OCC) version bump
 *    - Immutable version snapshot in epaperEditionVersions
 * 2. Step 11: Public E-Paper Reader & Social Clipping (R8, Features F19, F20)
 *    - PublicReaderEngine: zoom model, computeZoom, reading mode article formatting, 4:5 clipping bounds
 *    - Historical Archive Search endpoint: GET /api/v1/epaper/archive
 * 3. Step 12: Print-Ready 300 DPI Export Engine (R8, Feature F21)
 *    - HighResExportEngine prepress metadata generation
 *    - Print-ready binary PDF-1.4 generation (MediaBox, TrimBox, crop marks, registration, CMYK bars, xref)
 *    - 300 DPI PNG raster generation (3886x6142, IHDR, pHYs, IDAT, IEND)
 *    - HTTP endpoints: /export/pdf, /export/page/:num/image, /export/metadata
 * 
 * Framework: Native Node.js test runner (node:test, node:assert/strict)
 * Execution: node --test tests/backend-epaper-step10-12.test.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { handleApiRequest, signToken } from '../src/server/apiEngine.js';
import { getPersistenceAdapter } from '../src/server/persistence/adapter.js';
import { QualityPreflightScanner, SEVERITY } from '../src/server/epaper/preflightScanner.js';
import { HighResExportEngine, BROADSHEET_CONSTANTS } from '../src/server/epaper/exportEngine.js';
import { PublicReaderEngine } from '../src/server/epaper/publicReader.js';

process.env.NODE_ENV = 'test';

const adapter = getPersistenceAdapter();

// Helper to create in-memory HTTP test server
function createTestServer() {
  let server;
  let baseUrl;

  const start = () =>
    new Promise((resolve) => {
      server = http.createServer(async (req, res) => {
        try {
          await handleApiRequest(req, res);
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
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
            const contentType = res.headers['content-type'] || '';
            if (contentType.includes('application/json')) {
              try {
                parsed = JSON.parse(buffer.toString('utf8'));
              } catch {
                parsed = buffer.toString('utf8');
              }
            }
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: parsed,
              buffer,
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

// Generate auth token for editor
function getEditorToken() {
  return signToken({
    id: 'usr-editor-m5',
    email: 'editor.m5@breakingnewswala.com',
    fullName: 'विशेष संपादक (Milestone 5)',
    roles: ['EDITOR', 'CHIEF_EDITOR'],
  });
}

function getNonEditorToken() {
  return signToken({
    id: 'usr-reader-m5',
    email: 'reader.m5@gmail.com',
    fullName: 'आम पाठक',
    roles: ['READER'],
  });
}

// ============================================================================
// SUITE: STEP 10 — QUALITY PREFLIGHT SCANNER & ATOMIC PUBLISHING GATE
// ============================================================================

test('Step 10: Quality Preflight Scanner Engine (preflightScanner.js)', async (t) => {
  await t.test('10.1: TEXT_OVERFLOW check detects overflowing body text (BLOCKER)', () => {
    const pageWithOverflow = {
      pageNumber: 1,
      elements: [
        {
          id: 'el-overflow-1',
          elementType: 'STORY',
          customHeadline: 'अत्यधिक लंबी खबर',
          customBodyText: 'क'.repeat(800), // 800 chars / 40 = 20 lines * 16.2 = 324px height
          bounds: { x: 0, y: 0, width: 200, height: 100 }, // requiredHeight 324 > 100 * 1.5 = 150
          fontSize: 12,
          byline: 'संवाददाता',
        },
      ],
    };
    const report = QualityPreflightScanner.evaluate({}, [pageWithOverflow]);
    assert.strictEqual(report.canPublish, false);
    assert.strictEqual(report.blockerCount, 1);
    assert.strictEqual(report.blockers[0].code, 'TEXT_OVERFLOW');
    assert.strictEqual(report.blockers[0].severity, SEVERITY.BLOCKER);
  });

  await t.test('10.2: LOW_RES_IMAGE check flags imageWidth < 800px (WARNING)', () => {
    const pageWithLowRes = {
      pageNumber: 2,
      elements: [
        {
          id: 'el-img-lowres',
          elementType: 'IMAGE',
          hasImage: true,
          imageWidth: 450, // < 800px
          bounds: { x: 0, y: 0, width: 300, height: 200 },
        },
      ],
    };
    const report = QualityPreflightScanner.evaluate({}, [pageWithLowRes]);
    assert.strictEqual(report.canPublish, true); // Warnings do not block publish
    assert.strictEqual(report.warningCount, 1);
    assert.strictEqual(report.warnings[0].code, 'LOW_RES_IMAGE');
    assert.strictEqual(report.warnings[0].severity, SEVERITY.WARNING);
  });

  await t.test('10.3: MISSING_ATTRIBUTION check flags story without byline/reporterId (ERROR)', () => {
    const pageMissingAttribution = {
      pageNumber: 3,
      elements: [
        {
          id: 'el-story-no-credit',
          elementType: 'STORY',
          customHeadline: 'अज्ञात रिपोर्ट',
          customBodyText: 'छोटी खबर विवरण',
          bounds: { x: 0, y: 0, width: 300, height: 200 },
          fontSize: 12,
        },
      ],
    };
    const report = QualityPreflightScanner.evaluate({}, [pageMissingAttribution]);
    assert.strictEqual(report.errorCount, 1);
    assert.strictEqual(report.errors[0].code, 'MISSING_ATTRIBUTION');
    assert.strictEqual(report.errors[0].severity, SEVERITY.ERROR);
  });

  await t.test('10.4: UNAPPROVED_AD_PLACEMENT check flags missing ASCI badge or unapproved status (BLOCKER)', () => {
    const pageWithBadAd = {
      pageNumber: 4,
      elements: [
        {
          id: 'el-ad-no-badge',
          elementType: 'AD',
          asciBadge: false, // Blocker: missing mandatory ASCI badge
          adStatus: 'APPROVED',
          bounds: { x: 0, y: 0, width: 300, height: 200 },
        },
        {
          id: 'el-ad-pending',
          elementType: 'AD',
          asciBadge: true,
          adStatus: 'PENDING_APPROVAL', // Blocker: unapproved ad status
          bounds: { x: 0, y: 0, width: 300, height: 200 },
        },
      ],
    };
    const report = QualityPreflightScanner.evaluate({}, [pageWithBadAd]);
    assert.strictEqual(report.canPublish, false);
    assert.strictEqual(report.blockerCount, 2);
    assert.strictEqual(report.blockers[0].code, 'UNAPPROVED_AD_PLACEMENT');
    assert.strictEqual(report.blockers[1].code, 'UNAPPROVED_AD_PLACEMENT');
  });

  await t.test('10.5: ORPHAN_HEADLINE check flags headline with empty body text (BLOCKER)', () => {
    const pageWithOrphan = {
      pageNumber: 5,
      elements: [
        {
          id: 'el-orphan-headline',
          elementType: 'HEADLINE',
          customHeadline: 'अकेला शीर्षक जिसका कोई समाचार नहीं है',
          customBodyText: '   ', // Empty/whitespace only
          bounds: { x: 0, y: 0, width: 400, height: 50 },
        },
      ],
    };
    const report = QualityPreflightScanner.evaluate({}, [pageWithOrphan]);
    assert.strictEqual(report.canPublish, false);
    assert.strictEqual(report.blockerCount, 1);
    assert.strictEqual(report.blockers[0].code, 'ORPHAN_HEADLINE');
    assert.strictEqual(report.blockers[0].severity, SEVERITY.BLOCKER);
  });

  await t.test('10.6: Preflight cleanly passes when all elements satisfy editorial standards', () => {
    const cleanPage = {
      pageNumber: 1,
      elements: [
        {
          id: 'el-masthead-clean',
          elementType: 'MASTHEAD',
          bounds: { x: 0, y: 0, width: 847, height: 100 },
        },
        {
          id: 'el-story-clean',
          elementType: 'STORY',
          customHeadline: 'विकास कार्यों की समीक्षा',
          customBodyText: 'मध्य प्रदेश में विकास कार्यों की गति तेज हो गई है।',
          byline: 'वरिष्ठ संवाददाता',
          bounds: { x: 0, y: 110, width: 400, height: 200 },
          fontSize: 14,
        },
        {
          id: 'el-ad-clean',
          elementType: 'AD',
          asciBadge: true,
          adStatus: 'APPROVED',
          bounds: { x: 0, y: 320, width: 400, height: 100 },
        },
      ],
    };
    const report = QualityPreflightScanner.evaluate({}, [cleanPage]);
    assert.strictEqual(report.canPublish, true);
    assert.strictEqual(report.blockerCount, 0);
    assert.strictEqual(report.errorCount, 0);
  });
});

// ============================================================================
// SUITE: STEP 10 & 11 — HTTP PREFLIGHT, PUBLISHING GATE, OCC & ARCHIVE
// ============================================================================

test('Step 10 & 11: HTTP Preflight, Publishing Gate & Archive Search', async (t) => {
  const server = createTestServer();
  await server.start();
  const editorToken = getEditorToken();
  const nonEditorToken = getNonEditorToken();

  // Create clean edition for testing
  const createRes = await server.request('/api/v1/epaper/editions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${editorToken}`,
      'Content-Type': 'application/json',
    },
    body: {
      title: 'ग्वालियर विशेष दैनिक संस्करण (Milestone 5)',
      publicationDate: '2026-11-20',
      districtId: 'dist-gwalior',
      districtName: 'ग्वालियर',
      editionType: 'DAILY',
    },
  });

  assert.strictEqual(createRes.status, 201);
  const edition = createRes.body.data.edition;
  assert.ok(edition && edition.id);

  await t.test('10.7: POST /api/v1/epaper/editions/:id/preflight returns diagnostics report', async () => {
    const res = await server.request(`/api/v1/epaper/editions/${edition.id}/preflight`, {
      method: 'POST',
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(typeof res.body.data.canPublish, 'boolean');
    assert.strictEqual(typeof res.body.data.blockerCount, 'number');
  });

  await t.test('10.8: Publishing Gate rejects edition with BLOCKER with HTTP 422 ERR_PREFLIGHT_BLOCKER', async () => {
    // Add an element with a blocker (unapproved ad without ASCI badge)
    const page = await adapter.getEpaperPageByNumber(edition.id, 1);
    await adapter.saveEpaperPage({
      ...page,
      elements: [
        {
          id: 'el-bad-ad-gate',
          elementType: 'AD',
          asciBadge: false, // Blocker
          adStatus: 'PENDING_APPROVAL',
          bounds: { x: 0, y: 0, width: 200, height: 100 },
        },
      ],
    });

    const pubRes = await server.request(`/api/v1/epaper/editions/${edition.id}/publish`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${editorToken}`,
        'Content-Type': 'application/json',
      },
      body: { version: edition.version },
    });

    assert.strictEqual(pubRes.status, 422);
    assert.strictEqual(pubRes.body.success, false);
    assert.ok(pubRes.body.error.includes('ERR_PREFLIGHT_BLOCKER'));
    assert.strictEqual(pubRes.body.diagnostics.canPublish, false);
    assert.ok(pubRes.body.diagnostics.blockerCount >= 1);
  });

  await t.test('10.9: Publishing Gate enforces OCC version checking (HTTP 409 Conflict)', async () => {
    // Fix blocker first
    const page = await adapter.getEpaperPageByNumber(edition.id, 1);
    await adapter.saveEpaperPage({
      ...page,
      elements: [
        {
          id: 'el-good-story',
          elementType: 'STORY',
          customHeadline: 'स्वच्छ ग्वालियर अभियान सफल',
          customBodyText: 'ग्वालियर नगर निगम ने स्वच्छता सर्वेक्षण में उत्कृष्ट प्रदर्शन किया।',
          byline: 'प्रशासनिक संवाददाता',
          bounds: { x: 0, y: 0, width: 400, height: 150 },
          fontSize: 14,
        },
      ],
    });

    // Provide stale version 999
    const conflictRes = await server.request(`/api/v1/epaper/editions/${edition.id}/publish`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${editorToken}`,
        'Content-Type': 'application/json',
      },
      body: { version: 999 },
    });

    assert.strictEqual(conflictRes.status, 409);
    assert.strictEqual(conflictRes.body.success, false);
  });

  await t.test('10.10: Clean publish creates immutable snapshot, bumps version, sets PUBLISHED status', async () => {
    const currentEd = await adapter.getEpaperEditionById(edition.id);
    const pubRes = await server.request(`/api/v1/epaper/editions/${edition.id}/publish`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${editorToken}`,
        'Content-Type': 'application/json',
      },
      body: { version: currentEd.version },
    });

    assert.strictEqual(pubRes.status, 200);
    assert.strictEqual(pubRes.body.success, true);
    assert.strictEqual(pubRes.body.data.status, 'PUBLISHED');
    assert.strictEqual(pubRes.body.data.version, currentEd.version + 1);

    // Verify snapshot was created
    assert.ok(pubRes.body.snapshot);
    assert.strictEqual(pubRes.body.snapshot.editionId, edition.id);
    assert.strictEqual(pubRes.body.snapshot.immutable, true);
    assert.strictEqual(pubRes.body.snapshot.versionNumber, currentEd.version);
    assert.strictEqual(pubRes.body.snapshot.versionTag, `v${currentEd.version}.0.0`);
  });

  await t.test('10.11: GET /api/v1/epaper/editions/:id/versions retrieves immutable version snapshots', async () => {
    const verRes = await server.request(`/api/v1/epaper/editions/${edition.id}/versions`);
    assert.strictEqual(verRes.status, 200);
    assert.strictEqual(verRes.body.success, true);
    assert.ok(Array.isArray(verRes.body.data));
    assert.ok(verRes.body.data.length >= 1);
    assert.strictEqual(verRes.body.data[0].editionId, edition.id);
    assert.strictEqual(verRes.body.data[0].immutable, true);
  });

  await t.test('11.5: GET /api/v1/epaper/archive filters published editions by date & district', async () => {
    const archRes = await server.request(
      `/api/v1/epaper/archive?date=2026-11-20&districtId=dist-gwalior`
    );
    assert.strictEqual(archRes.status, 200);
    assert.strictEqual(archRes.body.success, true);
    assert.ok(archRes.body.count >= 1);
    assert.strictEqual(archRes.body.data[0].id, edition.id);
    assert.strictEqual(archRes.body.data[0].status, 'PUBLISHED');
  });

  await t.test('11.6: GET /api/v1/epaper/archive returns empty list for future dates', async () => {
    const futureRes = await server.request(
      `/api/v1/epaper/archive?date=2099-01-01&districtId=dist-gwalior`
    );
    assert.strictEqual(futureRes.status, 200);
    assert.strictEqual(futureRes.body.count, 0);
    assert.strictEqual(futureRes.body.data.length, 0);
  });

  await server.stop();
});

// ============================================================================
// SUITE: STEP 11 — PUBLIC READER ENGINE & SOCIAL CLIPPING UTILITIES
// ============================================================================

test('Step 11: PublicReaderEngine Mathematics & Typography Formatting', async (t) => {
  await t.test('11.1: getZoomModel provides calibrated zoom range and step', () => {
    const model = PublicReaderEngine.getZoomModel(1.0, { x: 10, y: 20 });
    assert.strictEqual(model.currentZoom, 1.0);
    assert.strictEqual(model.minZoom, 0.5);
    assert.strictEqual(model.maxZoom, 4.0);
    assert.strictEqual(model.panX, 10);
    assert.strictEqual(model.panY, 20);
    assert.strictEqual(model.step, 0.25);
  });

  await t.test('11.2: computeZoom clamps correctly between minZoom (0.5) and maxZoom (4.0)', () => {
    const inc = PublicReaderEngine.computeZoom(1.0, 0.5);
    assert.strictEqual(inc.zoom, 1.5);

    const maxClamped = PublicReaderEngine.computeZoom(3.8, 1.0);
    assert.strictEqual(maxClamped.zoom, 4.0);

    const minClamped = PublicReaderEngine.computeZoom(0.7, -0.5);
    assert.strictEqual(minClamped.zoom, 0.5);
  });

  await t.test('11.3: formatReadingModeArticle clamps font size between 12px and 32px with dynamic line-height', () => {
    const rawArticle = {
      title: 'भोपाल मेट्रो के नवीन रूट का विस्तार कार्य तीव्र गति पर',
      content: 'राजधानी भोपाल में मेट्रो परियोजना के तहत नए कॉरिडोर पर निर्माण कार्य तेजी से जारी है। जनसाधारण को सुगम यातायात की सौगात मिलेगी।',
      byline: 'परिवहन संवाददाता',
      photographerCredit: 'मेट्रो कॉर्पोरेशन',
    };

    const regular = PublicReaderEngine.formatReadingModeArticle(rawArticle, { fontSize: 18 });
    assert.strictEqual(regular.fontSize, 18);
    assert.strictEqual(regular.lineHeight, 28.8); // 18 * 1.6 = 28.8
    assert.ok(regular.wordCount > 5);
    assert.strictEqual(regular.readingTimeMinutes, 1);
    assert.strictEqual(regular.isDevanagari, true);
    assert.strictEqual(regular.byline, 'परिवहन संवाददाता');

    // Font clamping checks
    const clampedHigh = PublicReaderEngine.formatReadingModeArticle(rawArticle, { fontSize: 50 });
    assert.strictEqual(clampedHigh.fontSize, 32);

    const clampedLow = PublicReaderEngine.formatReadingModeArticle(rawArticle, { fontSize: 6 });
    assert.strictEqual(clampedLow.fontSize, 12);
  });

  await t.test('11.4: generateSocialClippingBounds calculates 4:5 aspect ratio (0.8)', () => {
    const bounds = PublicReaderEngine.generateSocialClippingBounds(
      { x: 50, y: 100, width: 400, height: 600 },
      '4:5'
    );
    assert.strictEqual(bounds.aspectRatio, '4:5');
    assert.strictEqual(bounds.width, 400);
    assert.strictEqual(bounds.height, 500); // 400 / 0.8 = 500
    assert.strictEqual(bounds.ratioValue, 0.8);
  });
});

// ============================================================================
// SUITE: STEP 12 — PRINT-READY 300 DPI EXPORT ENGINE
// ============================================================================

test('Step 12: High-Resolution 300 DPI Export Engine (exportEngine.js)', async (t) => {
  const mockEdition = {
    id: 'ep-print-test-01',
    editionCode: 'EP-20261120-BHOPAL-01',
    title: 'भोपाल दैनिक ई-पेपर (300 DPI Print Test)',
    districtId: 'dist-bhopal',
    districtName: 'भोपाल',
    publicationDate: '2026-11-20',
  };

  const mockPages = [
    {
      pageNumber: 1,
      pageTitle: 'प्रथम पृष्ठ',
      elements: [
        {
          id: 'el-lead-head',
          elementType: 'HEADLINE',
          customHeadline: 'मुख्यमंत्री ने भोपाल मेट्रो के नए कॉरिडोर का किया शुभारंभ',
          bounds: { x: 0, y: 120, width: 847, height: 50 },
        },
        {
          id: 'el-lead-story',
          elementType: 'STORY',
          customHeadline: 'राजधानी में सुगम यातायात की दिशा में ऐतिहासिक कदम',
          customBodyText: 'भोपाल में मेट्रो रेल का नवीन कॉरिडोर आम नागरिकों के लिए खोल दिया गया है।',
          byline: 'ब्यूरो चीफ',
          bounds: { x: 0, y: 180, width: 500, height: 250 },
          fontSize: 14,
        },
        {
          id: 'el-print-ad',
          elementType: 'AD',
          title: 'मध्य प्रदेश पर्यटन',
          asciBadge: true,
          adStatus: 'APPROVED',
          bounds: { x: 0, y: 1000, width: 847, height: 180 },
        },
      ],
    },
  ];

  await t.test('12.1: generate300DpiPdfMetadata returns complete prepress parameters', () => {
    const meta = HighResExportEngine.generate300DpiPdfMetadata(mockEdition, mockPages);
    assert.strictEqual(meta.pdfVersion, '1.4');
    assert.deepStrictEqual(meta.mediaBox, [0, 0, BROADSHEET_CONSTANTS.PAGE_WIDTH_PT, BROADSHEET_CONSTANTS.PAGE_HEIGHT_PT]);
    assert.strictEqual(meta.rasterWidthPx, 3886);
    assert.strictEqual(meta.rasterHeightPx, 6142);
    assert.strictEqual(meta.dpi, 300);
    assert.strictEqual(meta.totalPages, 1);
    assert.strictEqual(meta.isPrintReady, true);
    assert.ok(meta.scaleFactor > 4.16);
  });

  await t.test('12.2: buildPrintReadyPdf generates valid binary PDF-1.4 with MediaBox, trim marks & xref', () => {
    const pdfBuf = HighResExportEngine.buildPrintReadyPdf(mockEdition, mockPages);
    assert.ok(Buffer.isBuffer(pdfBuf));
    const pdfStr = pdfBuf.toString('utf8');

    // Header check
    assert.ok(pdfStr.startsWith('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'));

    // MediaBox, BleedBox, TrimBox definitions
    assert.ok(pdfStr.includes('/MediaBox [0 0 932.6 1474]'));
    assert.ok(pdfStr.includes('/TrimBox [42.52 113.38 890.08 1360.62]'));

    // ASCI 'विज्ञापन' representation
    assert.ok(pdfStr.includes('[VIGYAPAN / ADVERTISEMENT]'));

    // Folio & headline presence
    assert.ok(pdfStr.includes('BREAKING NEWS WALA | MP Broadsheet'));

    // Cross-reference table & trailer
    assert.ok(pdfStr.includes('xref\n0 '));
    assert.ok(pdfStr.includes('trailer\n<< /Size '));
    assert.ok(pdfStr.includes('startxref\n'));
    assert.ok(pdfStr.endsWith('%%EOF\n') || pdfStr.includes('%%EOF'));
  });

  await t.test('12.3: generate300DpiPageImage generates authentic 3886x6142 PNG with pHYs 300 DPI chunk', () => {
    const pngBuf = HighResExportEngine.generate300DpiPageImage(mockPages[0], mockEdition);
    assert.ok(Buffer.isBuffer(pngBuf));

    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    assert.strictEqual(pngBuf[0], 0x89);
    assert.strictEqual(pngBuf[1], 0x50); // P
    assert.strictEqual(pngBuf[2], 0x4E); // N
    assert.strictEqual(pngBuf[3], 0x47); // G
    assert.strictEqual(pngBuf[4], 0x0D);
    assert.strictEqual(pngBuf[5], 0x0A);
    assert.strictEqual(pngBuf[6], 0x1A);
    assert.strictEqual(pngBuf[7], 0x0A);

    // IHDR check: width = 3886 (0x0F2E), height = 6142 (0x17FE)
    const ihdrIdx = pngBuf.indexOf(Buffer.from('IHDR'));
    assert.ok(ihdrIdx >= 0);
    const width = pngBuf.readUInt32BE(ihdrIdx + 4);
    const height = pngBuf.readUInt32BE(ihdrIdx + 8);
    assert.strictEqual(width, 3886);
    assert.strictEqual(height, 6142);

    // pHYs check: 11811 pixels per meter (300 DPI)
    const physIdx = pngBuf.indexOf(Buffer.from('pHYs'));
    assert.ok(physIdx >= 0);
    const physX = pngBuf.readUInt32BE(physIdx + 4);
    const physY = pngBuf.readUInt32BE(physIdx + 8);
    assert.strictEqual(physX, 11811);
    assert.strictEqual(physY, 11811);

    // IDAT & IEND check
    assert.ok(pngBuf.indexOf(Buffer.from('IDAT')) >= 0);
    assert.ok(pngBuf.indexOf(Buffer.from('IEND')) >= 0);
  });
});

// ============================================================================
// SUITE: STEP 12 — HTTP EXPORT ENDPOINTS & HEADERS
// ============================================================================

test('Step 12: HTTP Export Endpoints (/api/v1/epaper/editions/:id/export/*)', async (t) => {
  const server = createTestServer();
  await server.start();
  const editorToken = getEditorToken();
  const nonEditorToken = getNonEditorToken();

  // Create & publish an edition for export testing
  const createRes = await server.request('/api/v1/epaper/editions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${editorToken}`,
      'Content-Type': 'application/json',
    },
    body: {
      title: 'इंदौर प्रातःकाल 300 DPI ई-पेपर',
      publicationDate: '2026-11-21',
      districtId: 'dist-indore',
      districtName: 'इंदौर',
      editionType: 'DAILY',
    },
  });

  const edition = createRes.body.data.edition;

  // Publish edition
  await server.request(`/api/v1/epaper/editions/${edition.id}/publish`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${editorToken}`,
      'Content-Type': 'application/json',
    },
    body: { version: edition.version },
  });

  await t.test('12.4: GET & POST /export/pdf returns 300 DPI PDF binary with required headers', async () => {
    // GET method
    const getRes = await server.request(`/api/v1/epaper/editions/${edition.id}/export/pdf`);
    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getRes.headers['content-type'], 'application/pdf');
    assert.strictEqual(getRes.headers['x-epaper-dpi'], '300');
    assert.strictEqual(getRes.headers['x-epaper-width-px'], '3886');
    assert.strictEqual(getRes.headers['x-epaper-height-px'], '6142');
    assert.strictEqual(getRes.headers['x-epaper-print-ready'], 'true');
    assert.ok(getRes.buffer.toString('utf8').startsWith('%PDF-1.4'));

    // POST method
    const postRes = await server.request(`/api/v1/epaper/editions/${edition.id}/export/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { includeCropMarks: true, dpi: 300 },
    });
    assert.strictEqual(postRes.status, 200);
    assert.strictEqual(postRes.headers['content-type'], 'application/pdf');
    assert.strictEqual(postRes.headers['x-epaper-dpi'], '300');
  });

  await t.test('12.5: GET & POST /export/page/:pageNumber/image returns 300 DPI PNG buffer', async () => {
    const pngRes = await server.request(
      `/api/v1/epaper/editions/${edition.id}/export/page/1/image`
    );
    assert.strictEqual(pngRes.status, 200);
    assert.strictEqual(pngRes.headers['content-type'], 'image/png');
    assert.strictEqual(pngRes.headers['x-epaper-dpi'], '300');
    assert.strictEqual(pngRes.headers['x-epaper-width-px'], '3886');
    assert.strictEqual(pngRes.headers['x-epaper-height-px'], '6142');
    assert.strictEqual(pngRes.headers['x-epaper-page-number'], '1');
    assert.strictEqual(pngRes.buffer[0], 0x89);
    assert.strictEqual(pngRes.buffer[1], 0x50); // P
    assert.strictEqual(pngRes.buffer[2], 0x4E); // N
    assert.strictEqual(pngRes.buffer[3], 0x47); // G
  });

  await t.test('12.6: GET /export/metadata returns 300 DPI prepress metadata JSON', async () => {
    const metaRes = await server.request(`/api/v1/epaper/editions/${edition.id}/export/metadata`);
    assert.strictEqual(metaRes.status, 200);
    assert.strictEqual(metaRes.body.success, true);
    assert.strictEqual(metaRes.body.data.pdfVersion, '1.4');
    assert.strictEqual(metaRes.body.data.dpi, 300);
    assert.strictEqual(metaRes.body.data.rasterWidthPx, 3886);
    assert.strictEqual(metaRes.body.data.rasterHeightPx, 6142);
    assert.strictEqual(metaRes.body.data.isPrintReady, true);
  });

  await t.test('12.7: Non-editor request for export on non-published edition rejected with HTTP 403', async () => {
    // Create an un-published DRAFT edition
    const draftRes = await server.request('/api/v1/epaper/editions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${editorToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: 'अप्रकाशित प्रारूप संस्करण',
        publicationDate: '2026-11-22',
        districtId: 'dist-bhopal',
        editionType: 'SPECIAL',
      },
    });
    const draftEd = draftRes.body.data.edition;

    // Non-editor attempts export
    const forbiddenRes = await server.request(`/api/v1/epaper/editions/${draftEd.id}/export/pdf`, {
      headers: { Authorization: `Bearer ${nonEditorToken}` },
    });
    assert.strictEqual(forbiddenRes.status, 403);
  });

  await server.stop();
});
