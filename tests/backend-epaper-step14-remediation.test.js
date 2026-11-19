/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Step 14 Targeted Remediation Verification Suite
 * 
 * Verifies:
 * - P1: Publishing Security Bypass remediation (status and direct update endpoints reject PUBLISHED, requiring dedicated /publish)
 * - P2: Configurable WhatsApp Quota with IST (Asia/Kolkata) date rollover & Master Admin quota configuration
 * - P3: Public E-Paper API pagination response contract verification
 * - P4: Export Engine capabilities validation (PDF-1.4 broadsheet vector/raster, absence of invalid PDF/X-1a claims, 300 DPI PNG)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { handleApiRequest, signToken } from '../src/server/apiEngine.js';
import { getPersistenceAdapter } from '../src/server/persistence/adapter.js';
import { HighResExportEngine, BROADSHEET_CONSTANTS } from '../src/server/epaper/exportEngine.js';

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
                parsed = buffer.toString('utf8');
              }
            } else {
              parsed = buffer;
            }
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: parsed,
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

function getReporterToken(id = 'usr-reporter-01') {
  return signToken({
    id,
    email: 'reporter@breakingnewswala.com',
    fullName: 'संवाददाता',
    roles: ['REPORTER'],
  });
}

test('Step 14 Remediation: Publishing Security Bypass, WhatsApp Quotas & Export Engine', async (t) => {
  const server = createTestServer();
  await server.start();

  const masterAdminToken = getMasterAdminToken();
  const editorToken = getEditorToken();
  const reporterToken = getReporterToken();

  // =========================================================================
  // P1: Publishing Security Bypass Remediation Tests
  // =========================================================================
  let testEditionId = '';
  let initialVersion = 1;

  await t.test('P1.1: Create draft test edition', async () => {
    const createRes = await server.request('/api/v1/epaper/editions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${editorToken}`,
      },
      body: {
        editionType: 'SPECIAL',
        title: 'विशेष उपचारात्मक संस्करण',
        publicationDate: '2026-11-20',
        divisionId: 'div-bhopal',
        districtId: 'dist-bhopal',
        pageCount: 2,
      },
    });
    assert.strictEqual(createRes.statusCode, 201);
    testEditionId = createRes.body.data.edition.id;
    initialVersion = createRes.body.data.edition.version || 1;
    assert.ok(testEditionId);
  });

  await t.test('P1.2: PATCH /status rejects targetStatus="PUBLISHED" with HTTP 400 ERR_INVALID_OPERATION', async () => {
    const res = await server.request(`/api/v1/epaper/editions/${testEditionId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${masterAdminToken}`,
      },
      body: {
        targetStatus: 'PUBLISHED',
        version: initialVersion,
      },
    });

    assert.strictEqual(res.statusCode, 400);
    const errCode = res.body.error?.code || res.body.code;
    const errMsg = res.body.error?.message || res.body.error;
    assert.strictEqual(errCode, 'ERR_INVALID_OPERATION');
    assert.ok(typeof errMsg === 'string' && errMsg.includes('PUBLISHED'));
  });

  await t.test('P1.3: PUT/PATCH /editions/:id rejects status="PUBLISHED" with HTTP 400 ERR_INVALID_OPERATION', async () => {
    const res = await server.request(`/api/v1/epaper/editions/${testEditionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${masterAdminToken}`,
      },
      body: {
        status: 'PUBLISHED',
        version: initialVersion,
      },
    });

    assert.strictEqual(res.statusCode, 400);
    const errCode = res.body.error?.code || res.body.code;
    const errMsg = res.body.error?.message || res.body.error;
    assert.strictEqual(errCode, 'ERR_INVALID_OPERATION');
    assert.ok(typeof errMsg === 'string' && errMsg.includes('PUBLISHED'));
  });

  await t.test('P1.4: Dedicated POST /publish is the SOLE route to publish edition', async () => {
    // Populate page 1 with minimum content so quality preflight scanner passes
    const pagesRes = await server.request(`/api/v1/epaper/editions/${testEditionId}/pages`, {
      headers: { Authorization: `Bearer ${editorToken}` },
    });
    const pages = pagesRes.body.data;
    assert.ok(pages.length > 0);

    // Add masthead and lead story to page 1
    const p1 = pages[0];
    await server.request(`/api/v1/epaper/pages/${p1.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${editorToken}`,
      },
      body: {
        version: p1.version,
        elements: [
          {
            id: `el-masthead-${Date.now()}`,
            type: 'MASTHEAD',
            bounds: { x: 0, y: 0, width: 847, height: 100 },
            content: { title: 'ब्रेकिंग न्यूज़ वाला' },
          },
          {
            id: `el-lead-${Date.now()}`,
            type: 'ARTICLE',
            bounds: { x: 0, y: 110, width: 420, height: 250 },
            content: { headline: 'भोपाल मुख्य समाचार: विकास कार्यों की शुरुआत', body: 'विस्तृत विवरण...' },
          },
        ],
      },
    });

    // Execute publication via dedicated pipeline
    const pubRes = await server.request(`/api/v1/epaper/editions/${testEditionId}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${masterAdminToken}`,
      },
      body: {},
    });
    assert.strictEqual(pubRes.statusCode, 200);
    assert.strictEqual(pubRes.body.success, true);
    assert.strictEqual(pubRes.body.data.status, 'PUBLISHED');
    assert.ok(pubRes.body.snapshot);
    assert.ok(pubRes.body.snapshot.id);
  });

  // =========================================================================
  // P2: Configurable WhatsApp Quotas & IST Timezone Tests
  // =========================================================================
  const testReporterId = `usr-test-reporter-${Date.now()}`;
  const customReporterToken = getReporterToken(testReporterId);

  await t.test('P2.1: Reporter default WhatsApp quota is 20 with IST timezone', async () => {
    const quotaRes = await server.request('/api/v1/epaper/whatsapp/quota', {
      headers: { Authorization: `Bearer ${customReporterToken}` },
    });
    assert.strictEqual(quotaRes.statusCode, 200);
    assert.strictEqual(quotaRes.body.data.maxDaily, 20);
    assert.strictEqual(quotaRes.body.data.timezone, 'Asia/Kolkata');
    assert.strictEqual(typeof quotaRes.body.data.used, 'number');
    assert.strictEqual(typeof quotaRes.body.data.remaining, 'number');
  });

  await t.test('P2.2: Non-admin cannot set reporter quota (HTTP 403 ERR_FORBIDDEN)', async () => {
    const setRes = await server.request(`/api/v1/epaper/whatsapp/quota/${testReporterId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customReporterToken}`,
      },
      body: { maxDaily: 50 },
    });

    assert.strictEqual(setRes.statusCode, 403);
    const errCode = setRes.body.error?.code || setRes.body.code;
    assert.strictEqual(errCode, 'ERR_FORBIDDEN');
  });

  await t.test('P2.3: Master Admin sets custom reporter quota via PUT /api/v1/epaper/whatsapp/quota/:reporterId', async () => {
    const setRes = await server.request(`/api/v1/epaper/whatsapp/quota/${testReporterId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${masterAdminToken}`,
      },
      body: { maxDaily: 3 },
    });

    assert.strictEqual(setRes.statusCode, 200);
    assert.strictEqual(setRes.body.data.reporterId, testReporterId);
    assert.strictEqual(setRes.body.data.maxDaily, 3);
    assert.strictEqual(setRes.body.data.timezone, 'Asia/Kolkata');
  });

  await t.test('P2.4: Admin verifies custom quota reflects via GET /api/v1/epaper/whatsapp/quota/:reporterId', async () => {
    const getRes = await server.request(`/api/v1/epaper/whatsapp/quota/${testReporterId}`, {
      headers: { Authorization: `Bearer ${masterAdminToken}` },
    });
    assert.strictEqual(getRes.statusCode, 200);
    assert.strictEqual(getRes.body.data.maxDaily, 3);
    assert.strictEqual(getRes.body.data.remaining, 3);
    assert.strictEqual(getRes.body.data.quotaExceeded, false);
  });

  await t.test('P2.5: Custom quota is enforced and exhausts properly', async () => {
    const uniqueReporterId = `usr-exhaust-${Date.now()}`;
    const uniqueReporterToken = getReporterToken(uniqueReporterId);

    // Set quota to 1 for this unique reporter
    await server.request(`/api/v1/epaper/whatsapp/quota/${uniqueReporterId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${masterAdminToken}`,
      },
      body: { maxDaily: 1 },
    });

    // First card succeeds
    const card1 = await server.request('/api/v1/epaper/whatsapp/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${uniqueReporterToken}`,
      },
      body: {
        format: '1:1',
        headline: 'पहली सफलता कार्ड',
        body: 'विवरण...',
      },
    });
    assert.strictEqual(card1.statusCode, 201);

    // Second card fails with HTTP 429 ERR_QUOTA_EXHAUSTED mentioning custom limit
    const card2 = await server.request('/api/v1/epaper/whatsapp/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${uniqueReporterToken}`,
      },
      body: {
        format: '1:1',
        headline: 'दूसरी कार्ड (अस्वीकृत होनी चाहिए)',
        body: 'विवरण...',
      },
    });
    assert.strictEqual(card2.statusCode, 429);
    const errCode = card2.body.error?.code || card2.body.code;
    const errMsg = card2.body.error?.message || card2.body.error;
    assert.strictEqual(errCode, 'ERR_QUOTA_EXHAUSTED');
    assert.ok(typeof errMsg === 'string' && errMsg.includes('1 कार्ड/दिन'));
  });

  // =========================================================================
  // P3: Public E-Paper API Response Contract Verification
  // =========================================================================
  await t.test('P3.1: Public GET /api/v1/epaper/editions returns paginated object with editions array and total', async () => {
    const res = await server.request('/api/v1/epaper/editions');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data);
    assert.ok(Array.isArray(res.body.data.editions));
    assert.strictEqual(typeof res.body.data.total, 'number');
    assert.strictEqual(typeof res.body.data.page, 'number');
    assert.strictEqual(typeof res.body.data.limit, 'number');
  });

  // =========================================================================
  // P4: High-Resolution Export Engine Capability Verification
  // =========================================================================
  await t.test('P4.1: PDF-1.4 output contains standard physical geometry and no misleading PDF/X-1a claim', () => {
    const pdfBuf = HighResExportEngine.buildPrintReadyPdf(
      { id: 'ed-001', title: 'भोपाल दैनिक ई-पेपर', publicationDate: '2026-11-20' },
      [{ id: 'p-1', pageNumber: 1, elements: [] }]
    );
    assert.ok(Buffer.isBuffer(pdfBuf));
    const pdfStr = pdfBuf.toString('utf8');

    // Compliant PDF-1.4 header
    assert.ok(pdfStr.startsWith('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'));

    // Exact broadsheet dimensions: 932.6 pt x 1474.0 pt (32.9 cm x 52.0 cm)
    assert.ok(pdfStr.includes(`/MediaBox [0 0 ${BROADSHEET_CONSTANTS.PAGE_WIDTH_PT} ${BROADSHEET_CONSTANTS.PAGE_HEIGHT_PT}]`));
    assert.ok(pdfStr.includes('/TrimBox [42.52 113.38 890.08 1360.62]'));

    // Accurate /Info dictionary without invalid PDF/X-1a claim
    assert.ok(!pdfStr.includes('/GTS_PDFXVersion'));
    assert.ok(pdfStr.includes('/Creator (BNW Prepress Vector Engine)'));

    // Valid xref table and EOF trailer
    assert.ok(pdfStr.includes('xref\n0 '));
    assert.ok(pdfStr.includes('trailer\n<< /Size '));
    assert.ok(pdfStr.includes('%%EOF'));
  });

  await t.test('P4.2: 300 DPI PNG raster export produces 3886x6142 image with pHYs chunk and Color Type 0', () => {
    const pngBuf = HighResExportEngine.generate300DpiPageImage(
      { id: 'p-1', pageNumber: 1, elements: [] },
      { id: 'ed-001', title: 'परीक्षण संस्करण' }
    );
    assert.ok(Buffer.isBuffer(pngBuf));

    // PNG signature
    assert.deepStrictEqual(Array.from(pngBuf.subarray(0, 8)), [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

    // IHDR chunk: 3886 x 6142, 8-bit depth, Color Type 0 (Grayscale)
    const width = pngBuf.readUInt32BE(16);
    const height = pngBuf.readUInt32BE(20);
    const bitDepth = pngBuf.readUInt8(24);
    const colorType = pngBuf.readUInt8(25);
    assert.strictEqual(width, 3886);
    assert.strictEqual(height, 6142);
    assert.strictEqual(bitDepth, 8);
    assert.strictEqual(colorType, 0); // Grayscale for memory efficiency in Node.js

    // pHYs chunk: 11811 pixels/m = 300 DPI
    const physIndex = pngBuf.indexOf(Buffer.from('pHYs'));
    assert.ok(physIndex > 0);
    const ppuX = pngBuf.readUInt32BE(physIndex + 4);
    const ppuY = pngBuf.readUInt32BE(physIndex + 8);
    assert.strictEqual(ppuX, 11811);
    assert.strictEqual(ppuY, 11811);
  });

  await server.stop();
});
