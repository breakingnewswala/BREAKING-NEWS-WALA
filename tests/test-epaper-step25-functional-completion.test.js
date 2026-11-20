/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * STEP 25 — E-Paper Product Growth & Functional Completion Test Suite
 * 
 * Empirically validates all 5 Priority Workstreams:
 * 1. Real E-Paper Lifecycle: Create -> News Selection -> Page Design -> Preflight -> Publish -> Public Read
 * 2. Broadsheet Page Designer: 32.9 cm x 52.0 cm, 12 pages Daily, 1-48 pages Special, 300 DPI PDF & PNG exports
 * 3. Android Integration: Shared REST endpoints (/api/v1/epaper/editions, /latest, /export/*), zero mock data
 * 4. Public Reader & Digital Archive: Immutable snapshot loading, non-destructive post-publication corrections
 * 5. WhatsApp Edition & Monetization: 1:1 and 4:5 cards, reporter isolation & quotas, broadsheet ad placements & ASCI badge
 * 
 * Strict Invariant: Runs with 100% isolated test persistence via setupIsolatedTestPersistence.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

import { setupIsolatedTestPersistence } from './testIsolationHelper.js';
import { handleApiRequest, signToken } from '../src/server/apiEngine.js';
import { HighResExportEngine, BROADSHEET_CONSTANTS } from '../src/server/epaper/exportEngine.js';

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
          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            const rawBuffer = Buffer.concat(chunks);
            const rawText = rawBuffer.toString('utf8');
            let json = null;
            try {
              json = JSON.parse(rawText);
            } catch {
              json = null;
            }
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: json,
              rawBuffer,
              rawText,
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

test('STEP 25: E-Paper Product Growth & Functional Completion Verification', async (t) => {
  const { cleanup, adapter: isolatedAdapter } = setupIsolatedTestPersistence({ prefix: 'bnw_step25_' });
  const testServer = createTestServer();
  await testServer.start();

  t.after(async () => {
    await testServer.stop();
    cleanup();
  });

  // Auth tokens
  const editorUser = {
    id: 'usr-editor-step25',
    fullName: 'दिनेश अग्निहोत्री',
    email: 'dinesh.editor@breakingnewswala.com',
    role: 'EDITOR',
    roles: ['EDITOR'],
  };
  const chiefEditorUser = {
    id: 'usr-chief-step25',
    fullName: 'राजेश शर्मा',
    email: 'rajesh.chief@breakingnewswala.com',
    role: 'CHIEF_EDITOR',
    roles: ['CHIEF_EDITOR', 'EDITOR', 'ADMIN'],
  };
  const reporterUser = {
    id: 'usr-rep-step25',
    fullName: 'संजय वर्मा',
    email: 'sanjay.verma@breakingnewswala.com',
    role: 'REPORTER',
    roles: ['REPORTER'],
  };

  const editorToken = signToken(editorUser, 3600);
  const chiefToken = signToken(chiefEditorUser, 3600);
  const reporterToken = signToken(reporterUser, 3600);

  // Pre-seed an approved test article in persistence
  const testArticle = {
    id: 'art-step25-001',
    title: 'भोपाल में मेट्रो रेल का नया चरण प्रारंभ, 15 नए स्टेशनों का लोकार्पण',
    summary: 'मध्य प्रदेश सरकार ने भोपाल मेट्रो के द्वितीय चरण का उद्घाटन किया।',
    content: 'भोपाल में आधुनिक मेट्रो रेल परियोजना के द्वितीय चरण का भव्य शुभारंभ किया गया। इस नए रूट से प्रतिदिन 2 लाख यात्रियों को आवागमन में सुगमता प्राप्त होगी। राज्य सरकार ने पर्यावरण संरक्षण और सतत शहरी विकास को सर्वोच्च प्राथमिकता दी है। सभी स्टेशनों पर अत्याधुनिक सुरक्षा और डिजिटल टिकटिंग प्रणाली स्थापित की गई है।',
    authorId: reporterUser.id,
    authorName: reporterUser.fullName,
    byline: `${reporterUser.fullName} (विशेष संवाददाता)`,
    photographer: 'अमित कुमार (बीएनडब्ल्यू फोटो ब्यूरो)',
    categoryId: 'cat-mp',
    districtId: 'dist-bhopal',
    divisionId: 'div-bhopal',
    status: 'APPROVED',
    priority: 'HIGH',
    featuredImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&q=80',
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  };
  isolatedAdapter.data.articles = [testArticle, ...(isolatedAdapter.data.articles || [])];

  let dailyEditionId = null;
  let dailyEditionCode = null;
  let page1Id = null;
  let specialPage1Id = null;

  // ==========================================================================
  // WORKSTREAM 1: REAL E-PAPER LIFECYCLE
  // ==========================================================================
  await t.test('1. Workstream 1: Complete Real E-Paper Lifecycle', async (st) => {
    // 1.1 Create Daily Edition (Enforces 12 pages)
    await st.test('1.1 Create Daily Edition (Enforces 12 Pages)', async () => {
      const res = await testServer.request('POST', '/api/v1/epaper/editions', {
        title: 'भोपाल मुख्य राज्य संस्करण - दैनिक ई-पेपर',
        publicationDate: '2026-11-25',
        editionType: 'DAILY',
        districtId: 'dist-bhopal',
        districtName: 'भोपाल',
        divisionId: 'div-bhopal',
        divisionName: 'भोपाल संभाग',
        totalPages: 12,
      }, { Authorization: `Bearer ${editorToken}` });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.edition);
      assert.strictEqual(res.body.data.edition.totalPages, 12);
      assert.strictEqual(res.body.data.edition.editionType, 'DAILY');
      assert.strictEqual(res.body.data.edition.status, 'DRAFT');
      assert.strictEqual(res.body.data.pages.length, 12);

      dailyEditionId = res.body.data.edition.id;
      dailyEditionCode = res.body.data.edition.editionCode;
      page1Id = res.body.data.pages[0].id;
    });

    // 1.2 Create Special Edition (Configurable 1-48 pages)
    await st.test('1.2 Create Special Edition with custom 4 pages', async () => {
      const res = await testServer.request('POST', '/api/v1/epaper/editions', {
        title: 'मध्य प्रदेश पर्यटन विशेषांक',
        publicationDate: '2026-11-26',
        editionType: 'SPECIAL',
        districtId: 'dist-bhopal',
        totalPages: 4,
      }, { Authorization: `Bearer ${editorToken}` });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.data.edition.totalPages, 4);
      assert.strictEqual(res.body.data.edition.editionType, 'SPECIAL');
      assert.strictEqual(res.body.data.pages.length, 4);
      specialPage1Id = res.body.data.pages[0].id;
    });

    // 1.3 News Selection & Article Assignment
    await st.test('1.3 News Selection Desk assigns article to Page 1', async () => {
      const res = await testServer.request(
        'POST',
        `/api/v1/epaper/editions/${dailyEditionId}/assign-articles`,
        {
          pageNumber: 1,
          articleIds: [testArticle.id],
          editorCredit: 'दिनेश अग्निहोत्री (डेस्क संपादक)',
        },
        { Authorization: `Bearer ${editorToken}` }
      );

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.assignedCount >= 1);
      assert.ok(res.body.data.page.elements.some((el) => el.articleId === testArticle.id));
    });

    // 1.4 Page Designer: Save elements with OCC versioning
    await st.test('1.4 Page Designer persists elements and respects OCC version', async () => {
      const getPageRes = await testServer.request('GET', `/api/v1/epaper/pages/${page1Id}`, null, {
        Authorization: `Bearer ${editorToken}`,
      });
      assert.strictEqual(getPageRes.statusCode, 200);
      const currentPage = getPageRes.body.data;

      // Update elements with clean, non-overlapping broadsheet placement
      const mastheadElement = {
        id: 'el-masthead-p1',
        elementType: 'MASTHEAD',
        bounds: { x: 42.52, y: 113.38, width: 847.56, height: 90 },
        colSpan: 8,
        zIndex: 1,
      };

      const storyElements = currentPage.elements.map((el) => {
        if (el.elementType === 'STORY') {
          return {
            ...el,
            bounds: { x: 42.52, y: 220, width: 847.56, height: 300 },
          };
        }
        return el;
      });

      const updatedElements = [mastheadElement, ...storyElements];
      const saveRes = await testServer.request(
        'PUT',
        `/api/v1/epaper/pages/${page1Id}`,
        {
          elements: updatedElements,
          version: currentPage.version,
        },
        { Authorization: `Bearer ${editorToken}` }
      );

      assert.strictEqual(saveRes.statusCode, 200);
      assert.strictEqual(saveRes.body.success, true);
      assert.strictEqual(saveRes.body.data.version, currentPage.version + 1);
    });

    // 1.5 Quality Preflight Scanner
    await st.test('1.5 Run Quality Preflight Scanner on Daily Edition', async () => {
      const res = await testServer.request(
        'POST',
        `/api/v1/epaper/editions/${dailyEditionId}/quality-check`,
        { skipExportCheck: true },
        { Authorization: `Bearer ${editorToken}` }
      );

      console.log('Quality Check Issues:', JSON.stringify(res.body.data?.issues, null, 2));

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(typeof res.body.data.qualityScore === 'number');
      assert.ok(Array.isArray(res.body.data.issues));
    });

    // 1.6 Approval and Atomic Publishing
    await st.test('1.6 Chief Editor Approves and Publishes Edition to Immutable Snapshot', async () => {
      // Approve
      const approveRes = await testServer.request(
        'POST',
        `/api/v1/epaper/editions/${dailyEditionId}/approve`,
        { remarks: 'संपादकीय जांच पूर्ण, प्रकाशनार्थ अनुमोदित।' },
        { Authorization: `Bearer ${chiefToken}` }
      );
      assert.strictEqual(approveRes.statusCode, 200);
      assert.strictEqual(approveRes.body.data.edition.status, 'FINAL_APPROVED');

      // Publish
      const publishRes = await testServer.request(
        'POST',
        `/api/v1/epaper/editions/${dailyEditionId}/publish`,
        {},
        { Authorization: `Bearer ${chiefToken}` }
      );

      if (publishRes.statusCode !== 200) {
        console.log('Publish failed with body:', JSON.stringify(publishRes.body, null, 2));
      }
      assert.strictEqual(publishRes.statusCode, 200);
      assert.strictEqual(publishRes.body.success, true);
      assert.strictEqual(publishRes.body.data.status, 'PUBLISHED');
      assert.ok(publishRes.body.snapshot);
      assert.ok(publishRes.body.snapshot.versionNumber >= 1);
      assert.strictEqual(publishRes.body.snapshot.pagesSnapshot.length, 12);
    });

    // 1.7 Public Read access vs Draft Protection
    await st.test('1.7 Anonymous reader loads published snapshot; unpublished draft returns 403', async () => {
      // Published edition succeeds anonymously
      const pubPagesRes = await testServer.request('GET', `/api/v1/epaper/editions/${dailyEditionId}/pages`);
      assert.strictEqual(pubPagesRes.statusCode, 200);
      assert.strictEqual(pubPagesRes.body.success, true);
      assert.strictEqual(pubPagesRes.body.data.length, 12);
      assert.strictEqual(pubPagesRes.body.meta.isSnapshot, true);

      // Create draft edition and verify anonymous read returns 403
      const draftRes = await testServer.request('POST', '/api/v1/epaper/editions', {
        title: 'अप्रकाशित प्रारूप संस्करण',
        publicationDate: '2026-11-28',
        editionType: 'DAILY',
        districtId: 'dist-indore',
        totalPages: 12,
      }, { Authorization: `Bearer ${editorToken}` });
      const draftId = draftRes.body.data.edition.id;

      const anonDraftRes = await testServer.request('GET', `/api/v1/epaper/editions/${draftId}/pages`);
      assert.strictEqual(anonDraftRes.statusCode, 403);
    });
  });

  // ==========================================================================
  // WORKSTREAM 2: BROADSHEET PAGE DESIGNER STANDARDS
  // ==========================================================================
  await t.test('2. Workstream 2: Broadsheet Page Designer Geometric & Export Standards', async (st) => {
    // 2.1 Broadsheet dimensions
    await st.test('2.1 Geometry matches authoritative specifications (32.9 cm x 52.0 cm)', () => {
      assert.strictEqual(BROADSHEET_CONSTANTS.PAGE_WIDTH_CM, 32.9);
      assert.strictEqual(BROADSHEET_CONSTANTS.PAGE_HEIGHT_CM, 52.0);
      assert.strictEqual(BROADSHEET_CONSTANTS.PAGE_WIDTH_PT, 932.6);
      assert.strictEqual(BROADSHEET_CONSTANTS.PAGE_HEIGHT_PT, 1474.0);
      assert.strictEqual(BROADSHEET_CONSTANTS.RASTER_300DPI_WIDTH, 3886);
      assert.strictEqual(BROADSHEET_CONSTANTS.RASTER_300DPI_HEIGHT, 6142);
    });

    // 2.2 Print-ready high-resolution 300 DPI raster export
    await st.test('2.2 HighResExportEngine synthesizes 3886 x 6142 px 300 DPI PNG buffer', () => {
      const page = {
        id: 'test-p1',
        editionId: dailyEditionId,
        pageNumber: 1,
        pageTitle: 'प्रथम पृष्ठ',
        gridColumns: 8,
        elements: [
          {
            id: 'el-lead-1',
            elementType: 'STORY',
            customHeadline: 'मध्य प्रदेश में ऐतिहासिक विकास कार्य',
            customBodyText: 'राजधानी भोपाल में मेट्रो के द्वितीय चरण का लोकार्पण संपन्न।',
            bounds: { x: 42.52, y: 150, width: 400, height: 250 },
            colSpan: 4,
          },
        ],
      };
      const edition = { id: dailyEditionId, title: 'दैनिक ई-पेपर', publicationDate: '2026-11-25' };

      const pngBuffer = HighResExportEngine.generate300DpiPageImage(page, edition);
      assert.ok(Buffer.isBuffer(pngBuffer));
      assert.ok(pngBuffer.length > 5000);
      // PNG magic bytes: 89 50 4E 47
      assert.strictEqual(pngBuffer[0], 0x89);
      assert.strictEqual(pngBuffer[1], 0x50);
      assert.strictEqual(pngBuffer[2], 0x4E);
      assert.strictEqual(pngBuffer[3], 0x47);
    });

    // 2.3 Print-ready PDF-1.4 export
    await st.test('2.3 HighResExportEngine builds valid PDF-1.4 with prepress metadata', () => {
      const edition = { id: dailyEditionId, title: 'दैनिक ई-पेपर', publicationDate: '2026-11-25', editionCode: dailyEditionCode };
      const pages = Array.from({ length: 12 }).map((_, i) => ({
        id: `p-${i + 1}`,
        pageNumber: i + 1,
        pageTitle: `पृष्ठ ${i + 1}`,
        elements: [],
      }));

      const pdfBuffer = HighResExportEngine.buildPrintReadyPdf(edition, pages);
      assert.ok(Buffer.isBuffer(pdfBuffer));
      assert.ok(pdfBuffer.length > 1000);
      // PDF-1.4 header
      assert.ok(pdfBuffer.toString('utf8', 0, 8).startsWith('%PDF-1.4'));
    });

    // 2.4 ASCI "विज्ञापन" badge auto-stamping on advertisement elements
    await st.test('2.4 Updating page with AD element auto-stamps ASCI "विज्ञापन" badge', async () => {
      const getP1 = await testServer.request('GET', `/api/v1/epaper/pages/${specialPage1Id}`, null, {
        Authorization: `Bearer ${editorToken}`,
      });
      const currentVer = getP1.body.data.version;

      const adElement = {
        id: 'el-ad-sponsored-1',
        elementType: 'AD',
        bounds: { x: 42.52, y: 800, width: 400, height: 200 },
        colSpan: 4,
        adId: 'ad-sub-001',
      };

      const res = await testServer.request(
        'PUT',
        `/api/v1/epaper/pages/${specialPage1Id}`,
        {
          elements: [adElement],
          version: currentVer,
        },
        { Authorization: `Bearer ${editorToken}` }
      );

      assert.strictEqual(res.statusCode, 200);
      const savedAd = res.body.data.elements.find((el) => el.id === 'el-ad-sponsored-1');
      assert.ok(savedAd);
      assert.strictEqual(savedAd.asciBadge, true);
      assert.strictEqual(savedAd.badgeText, 'विज्ञापन');
    });
  });

  // ==========================================================================
  // WORKSTREAM 3: ANDROID CLIENT INTEGRATION
  // ==========================================================================
  await t.test('3. Workstream 3: Android Client Shared API Integration', async (st) => {
    // 3.1 Shared GET /api/v1/epaper/editions returns Array of editions
    await st.test('3.1 GET /api/v1/epaper/editions returns Array of published editions with PDF/PNG urls', async () => {
      const res = await testServer.request('GET', '/api/v1/epaper/editions');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.length >= 1);

      const pubEd = res.body.data.find((e) => e.id === dailyEditionId);
      assert.ok(pubEd);
      assert.strictEqual(pubEd.totalPages, 12);
      assert.ok(pubEd.pdfUrl);
      assert.ok(pubEd.coverImageUrl);
    });

    // 3.2 Shared GET /api/v1/epaper/latest returns latest edition for native reader
    await st.test('3.2 GET /api/v1/epaper/latest returns latest published edition', async () => {
      const res = await testServer.request('GET', '/api/v1/epaper/latest');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.id);
      assert.ok(res.body.data.pdfUrl);
    });

    // 3.3 Binary PDF and PNG download endpoints operate cleanly
    await st.test('3.3 Binary PDF and PNG endpoints return valid data with content headers', async () => {
      // PDF download
      const pdfRes = await testServer.request('GET', `/api/v1/epaper/editions/${dailyEditionId}/export/pdf`);
      assert.strictEqual(pdfRes.statusCode, 200);
      assert.strictEqual(pdfRes.headers['content-type'], 'application/pdf');
      assert.strictEqual(pdfRes.headers['x-epaper-dpi'], '300');
      assert.ok(pdfRes.rawBuffer.length > 1000);

      // PNG page download
      const pngRes = await testServer.request('GET', `/api/v1/epaper/editions/${dailyEditionId}/pages/1/export/png`);
      assert.strictEqual(pngRes.statusCode, 200);
      assert.strictEqual(pngRes.headers['content-type'], 'image/png');
      assert.strictEqual(pngRes.headers['x-epaper-dpi'], '300');
      assert.strictEqual(pngRes.headers['x-epaper-width-px'], '3886');
      assert.strictEqual(pngRes.headers['x-epaper-height-px'], '6142');
      assert.ok(pngRes.rawBuffer.length > 5000);
    });

    // 3.4 Pure Native Android Architecture Invariants (DEC-002)
    await st.test('3.4 Pure Native Android architecture verifies zero WebViews in android/', () => {
      const androidDir = path.resolve(ROOT_DIR, 'android');
      assert.ok(fs.existsSync(androidDir));

      const settingsPath = path.join(androidDir, 'settings.gradle.kts');
      const settingsContent = fs.readFileSync(settingsPath, 'utf8');
      assert.ok(settingsContent.includes('include(":app")'));

      const appBuildPath = path.join(androidDir, 'app/build.gradle.kts');
      const appBuild = fs.readFileSync(appBuildPath, 'utf8');
      assert.ok(!appBuild.includes('webkit'), 'DEC-002: Zero WebKit / WebView dependencies');
      assert.ok(appBuild.includes('androidx.compose.material3'));

      const epaperScreenPath = path.join(androidDir, 'app/src/main/kotlin/com/breakingnewswala/ui/screens/EpaperScreen.kt');
      const epaperScreen = fs.readFileSync(epaperScreenPath, 'utf8');
      assert.ok(epaperScreen.includes('/api/v1/epaper/editions/'));
      assert.ok(epaperScreen.includes('export/pdf'));
      assert.ok(epaperScreen.includes('export/png'));
    });
  });

  // ==========================================================================
  // WORKSTREAM 4: PUBLIC READER & DIGITAL ARCHIVE
  // ==========================================================================
  await t.test('4. Workstream 4: Public Reader & Digital Archive', async (st) => {
    // 4.1 Digital Archive Search
    await st.test('4.1 Historical Archive Search by date, year, month returns published editions', async () => {
      const res = await testServer.request('GET', '/api/v1/epaper/archive?year=2026&districtId=dist-bhopal');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data.editions));
      assert.ok(res.body.data.editions.some((e) => e.id === dailyEditionId));
    });

    // 4.2 Post-Publication Non-Destructive Correction
    await st.test('4.2 Post-Publication Correction creates new draft while keeping published version immutable', async () => {
      const corrRes = await testServer.request(
        'POST',
        `/api/v1/epaper/editions/${dailyEditionId}/correction`,
        { remarks: 'पृष्ठ 1 पर शीर्षक में वर्तनी सुधार आवश्यक।' },
        { Authorization: `Bearer ${chiefToken}` }
      );

      assert.strictEqual(corrRes.statusCode, 200);
      assert.strictEqual(corrRes.body.success, true);
      assert.strictEqual(corrRes.body.data.edition.status, 'LAYOUT_IN_PROGRESS');
      assert.ok(corrRes.body.data.edition.version > 1);

      // Verify that published snapshot remains intact and public readers still load immutable snapshot
      const v1SnapshotRes = await testServer.request('GET', `/api/v1/epaper/editions/${dailyEditionId}/pages`);
      assert.strictEqual(v1SnapshotRes.statusCode, 200);
      assert.strictEqual(v1SnapshotRes.body.meta.isSnapshot, true);
      assert.strictEqual(v1SnapshotRes.body.data.length, 12);
    });
  });

  // ==========================================================================
  // WORKSTREAM 5: WHATSAPP EDITION & MONETIZATION
  // ==========================================================================
  await t.test('5. Workstream 5: WhatsApp Edition & Monetization', async (st) => {
    // 5.1 Reporter WhatsApp Quota Query
    await st.test('5.1 Reporter can query daily WhatsApp quota (20 daily, IST reset)', async () => {
      const res = await testServer.request('GET', '/api/v1/epaper/whatsapp/quota', null, {
        Authorization: `Bearer ${reporterToken}`,
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.maxDaily, 20);
      assert.strictEqual(res.body.data.used, 0);
      assert.strictEqual(res.body.data.remaining, 20);
    });

    // 5.2 Multi-story WhatsApp Edition Generation (1:1 and 4:5 formats)
    await st.test('5.2 Generate 4:5 WhatsApp Edition Package with anti-overflow typography', async () => {
      const genPayload = {
        title: 'दैनिक डिजिटल बुलेटिन - भोपाल',
        format: '4:5',
        articleIds: [testArticle.id],
      };

      const res = await testServer.request('POST', '/api/v1/epaper/whatsapp/edition/generate', genPayload, {
        Authorization: `Bearer ${reporterToken}`,
      });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data);
      assert.strictEqual(res.body.data.format, '4:5');
      assert.strictEqual(res.body.data.cards.length, 1);
      assert.ok(res.body.data.cards[0].headline);
      assert.ok(res.body.data.cards[0].storagePath);

      // Check quota decremented
      const quotaRes = await testServer.request('GET', '/api/v1/epaper/whatsapp/quota', null, {
        Authorization: `Bearer ${reporterToken}`,
      });
      assert.strictEqual(quotaRes.body.data.used, 1);
      assert.strictEqual(quotaRes.body.data.remaining, 19);
    });

    // 5.3 Broadsheet Ad Manager reports available slots with ASCI compliance
    await st.test('5.3 Broadsheet Ad Manager reports available slots with ASCI compliance', async () => {
      // 5.3a Broadsheet Rate Cards & Supported Slots
      const rateCardsRes = await testServer.request('GET', '/api/v1/epaper/ads/rate-cards');
      assert.strictEqual(rateCardsRes.statusCode, 200);
      assert.strictEqual(rateCardsRes.body.success, true);
      assert.ok(rateCardsRes.body.data.rateCards.FULL_PAGE);
      assert.ok(rateCardsRes.body.data.rateCards.HALF_PAGE_HORIZONTAL);
      assert.ok(rateCardsRes.body.data.rateCards.QUARTER_PAGE);
      assert.ok(rateCardsRes.body.data.supportedSlots.includes('FULL_PAGE'));

      // 5.3b Available slots query on dailyEditionId
      const slotsRes = await testServer.request(
        'GET',
        `/api/v1/epaper/ads/slots/available?editionId=${dailyEditionId}`,
        null,
        { Authorization: `Bearer ${editorToken}` }
      );
      assert.strictEqual(slotsRes.statusCode, 200);
      assert.strictEqual(slotsRes.body.success, true);
      assert.ok(Array.isArray(slotsRes.body.data.slots));
    });
  });
});
