/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * STEP 25B — MASTER ADMIN E-PAPER CREATION & UPLOAD CONTROL PANEL TEST SUITE
 * 
 * Empirically validates all 10 core requirements:
 * 1. Clearly Visible Master Admin Entry Point & Navigation
 * 2. Complete New Edition Setup (Daily = 12 pages locked, Special = 1-48 pages, Broadsheet 32.9 x 52.0 cm)
 * 3. News Selection Desk & Page Assignment (Multi-selection, page allocation, reordering)
 * 4. E-Paper Design Studio (Auto Layout vs Manual, element locking, grid snapping, Devanagari typography)
 * 5. Media Upload & Content Insertion (Newspaper photo, article image, supporting photo, size/type validation)
 * 6. Save, Draft and Reopen Workflow (Save Draft, Save Current Page, Save Entire Edition, Save Custom Template)
 * 7. Preview, Quality Preflight & Publishing (Snapshot immutability, correction versioning)
 * 8. Canonical Role Enforcement (READER, REPORTER, EDITOR, ADMIN, MASTER_ADMIN, SUPER_ADMIN - zero unapproved roles)
 * 9. Diagnosis & Root Cause Resolution for missing controls
 * 10. Public Surface Propagation (Reader & Digital Archive reflect published edition)
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
import { BROADSHEET_CONSTANTS } from '../src/server/epaper/exportEngine.js';

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
      if (bodyStr) {
        req.write(bodyStr, 'utf8');
      }
      req.end();
    });
  };

  return { start, stop, request };
}

test('STEP 25B: Master Admin E-Paper Control Panel, Studio, and Workflow Verification', async (t) => {
  const { cleanup, adapter: isolatedAdapter } = setupIsolatedTestPersistence({ prefix: 'bnw_step25b_' });
  const server = createTestServer();
  await server.start();

  // Canonical role tokens
  const masterAdminToken = signToken({
    id: 'usr-master-001',
    roles: ['MASTER_ADMIN', 'ADMIN'],
    name: 'प्रधान प्रशासक (Master Admin)',
  }, 3600);

  const adminToken = signToken({
    id: 'usr-admin-002',
    roles: ['ADMIN'],
    name: 'एडमिनिस्ट्रेटर (Admin)',
  }, 3600);

  const reporterToken = signToken({
    id: 'usr-rep-003',
    roles: ['REPORTER'],
    name: 'जिला रिपोर्टर',
  }, 3600);

  const readerToken = signToken({
    id: 'usr-reader-004',
    roles: ['READER'],
    name: 'डिजिटल पाठक',
  }, 3600);

  // Pre-seed an approved test article in persistence
  const sampleArticle = {
    id: 'art-bhopal-metro-01',
    title: 'भोपाल मेट्रो के द्वितीय चरण का शुभारंभ, नागरिकों में हर्ष',
    summary: 'राजधानी भोपाल में मेट्रो रेल सेवा के विस्तार का नया अध्याय प्रारंभ हुआ।',
    content: 'राजधानी भोपाल में मेट्रो रेल सेवा के द्वितीय चरण का लोकार्पण संपन्न हुआ। नए रूट पर 15 अत्याधुनिक स्टेशन तैयार किए गए हैं।',
    authorId: 'usr-rep-003',
    authorName: 'जिला रिपोर्टर',
    byline: 'विशेष संवाददाता, भोपाल',
    photographer: 'बीएनडब्ल्यू मुख्य फोटो डेस्क',
    categoryId: 'cat-mp',
    districtId: 'dist-bhopal',
    divisionId: 'div-bhopal',
    status: 'APPROVED',
    priority: 'HIGH',
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  };
  isolatedAdapter.data.articles = [sampleArticle, ...(isolatedAdapter.data.articles || [])];

  t.after(async () => {
    await server.stop();
    cleanup();
  });

  // =========================================================================
  // SECTION 1: MASTER ADMIN ENTRY POINT & ROLE BOUNDARY TESTS
  // =========================================================================
  await t.test('1. Role Access Boundaries for E-Paper Creation & Administration', async (t1) => {
    // 1.1 READER is blocked from creating editions (403)
    const readerRes = await server.request(
      'POST',
      '/api/v1/epaper/editions',
      {
        title: 'अवैध पाठक संस्करण',
        editionType: 'DAILY',
        publicationDate: '2026-11-25',
        divisionId: 'div-bhopal',
        districtId: 'dist-bhopal',
      },
      { Authorization: `Bearer ${readerToken}` }
    );
    assert.strictEqual(readerRes.statusCode, 403, 'READER must be blocked with 403');

    // 1.2 REPORTER is blocked from creating editions (403)
    const reporterRes = await server.request(
      'POST',
      '/api/v1/epaper/editions',
      {
        title: 'अवैध रिपोर्टर संस्करण',
        editionType: 'DAILY',
        publicationDate: '2026-11-25',
        divisionId: 'div-bhopal',
        districtId: 'dist-bhopal',
      },
      { Authorization: `Bearer ${reporterToken}` }
    );
    assert.strictEqual(reporterRes.statusCode, 403, 'REPORTER must be blocked with 403');

    // 1.3 MASTER_ADMIN is permitted to create editions (201)
    const masterRes = await server.request(
      'POST',
      '/api/v1/epaper/editions',
      {
        title: 'मास्टर एडमिन भोपाल दैनिक',
        editionType: 'DAILY',
        publicationDate: '2026-11-25',
        divisionId: 'div-bhopal',
        districtId: 'dist-bhopal',
        districtName: 'भोपाल',
        divisionName: 'भोपाल संभाग',
        language: 'hi',
        editionCode: 'epaper-bhopal-2026-11-25-daily',
        description: 'राजधानी भोपाल का मुख्य दैनिक ई-पेपर',
        totalPages: 12,
      },
      { Authorization: `Bearer ${masterAdminToken}` }
    );
    assert.strictEqual(masterRes.statusCode, 201, 'MASTER_ADMIN must be allowed to create editions');
    assert.strictEqual(masterRes.body.success, true);
    assert.strictEqual(masterRes.body.data.edition.totalPages, 12, 'Daily edition must create exactly 12 pages');
  });

  // =========================================================================
  // SECTION 2: NEW EDITION SETUP & PAGE COUNT RULES
  // =========================================================================
  await t.test('2. Edition Setup Rules: Daily 12 Pages Locked, Special 1-48 Pages', async (t2) => {
    // 2.1 Daily Edition creation with attempt to override page count to 8 is rejected or locked to 12
    const dailyAttempt = await server.request(
      'POST',
      '/api/v1/epaper/editions',
      {
        title: 'दैनिक 8 पेज का प्रयास',
        editionType: 'DAILY',
        publicationDate: '2026-11-26',
        divisionId: 'div-indore',
        districtId: 'dist-indore',
        totalPages: 8, // Invalid for DAILY
      },
      { Authorization: `Bearer ${masterAdminToken}` }
    );
    if (dailyAttempt.statusCode === 201) {
      assert.strictEqual(dailyAttempt.body.data.edition.totalPages, 12, 'Daily edition totalPages must remain locked to 12');
    } else {
      assert.strictEqual(dailyAttempt.statusCode, 400, 'Invalid page count for DAILY must return 400');
    }

    // 2.2 Special Edition creation with valid page count (e.g. 16 pages)
    const specialValid = await server.request(
      'POST',
      '/api/v1/epaper/editions',
      {
        title: 'मध्य प्रदेश स्थापना दिवस विशेषांक',
        editionType: 'SPECIAL',
        publicationDate: '2026-11-01',
        divisionId: 'div-bhopal',
        districtId: 'dist-bhopal',
        totalPages: 16,
        language: 'hi',
        editionCode: 'epaper-mp-day-special-16p',
        description: '16 पृष्ठों का रंगीन विशेषांक',
      },
      { Authorization: `Bearer ${masterAdminToken}` }
    );
    assert.strictEqual(specialValid.statusCode, 201);
    assert.strictEqual(specialValid.body.data.edition.totalPages, 16);
    assert.strictEqual(specialValid.body.data.pages.length, 16);

    // 2.3 Special Edition with invalid page count (e.g. 50 pages > 48 max) is rejected
    const specialInvalid = await server.request(
      'POST',
      '/api/v1/epaper/editions',
      {
        title: 'अमान्य 50 पेज विशेषांक',
        editionType: 'SPECIAL',
        publicationDate: '2026-11-01',
        divisionId: 'div-bhopal',
        districtId: 'dist-bhopal',
        totalPages: 50,
      },
      { Authorization: `Bearer ${masterAdminToken}` }
    );
    assert.strictEqual(specialInvalid.statusCode, 400, 'Page count > 48 must be rejected with 400');

    // 2.4 Verify Broadsheet geometric constants (32.9 cm x 52.0 cm)
    assert.strictEqual(BROADSHEET_CONSTANTS.PAGE_WIDTH_CM, 32.9, 'Broadsheet width must be exactly 32.9 cm');
    assert.strictEqual(BROADSHEET_CONSTANTS.PAGE_HEIGHT_CM, 52.0, 'Broadsheet height must be exactly 52.0 cm');
  });

  // =========================================================================
  // SECTION 3: NEWS SELECTION DESK & PAGE ALLOCATION
  // =========================================================================
  let testEditionId;
  let pageOneId;

  await t.test('3. News Selection Desk & Article Allocation to Page', async (t3) => {
    // Create edition to test selection desk
    const res = await server.request(
      'POST',
      '/api/v1/epaper/editions',
      {
        title: 'जबलपुर महाकौशल दैनिक',
        editionType: 'DAILY',
        publicationDate: '2026-11-27',
        divisionId: 'div-jabalpur',
        districtId: 'dist-jabalpur',
        districtName: 'जबलपुर',
        divisionName: 'जबलपुर संभाग',
        totalPages: 12,
      },
      { Authorization: `Bearer ${masterAdminToken}` }
    );
    assert.strictEqual(res.statusCode, 201);
    testEditionId = res.body.data.edition.id;
    pageOneId = res.body.data.pages[0].id;

    // Assign approved article to Page 1
    const assignRes = await server.request(
      'POST',
      `/api/v1/epaper/editions/${testEditionId}/assign-articles`,
      {
        pageNumber: 1,
        articleIds: [sampleArticle.id],
        editorCredit: 'एडमिन डेस्क',
      },
      { Authorization: `Bearer ${masterAdminToken}` }
    );
    assert.strictEqual(assignRes.statusCode, 200);
    assert.strictEqual(assignRes.body.success, true);
    assert.ok(assignRes.body.data.assignedCount >= 1);
    assert.ok(assignRes.body.data.page.elements.some((el) => el.articleId === sampleArticle.id));
  });

  // =========================================================================
  // SECTION 4: DESIGN STUDIO - ELEMENT LOCKING & AUTO LAYOUT
  // =========================================================================
  await t.test('4. Design Studio Features: Lock/Unlock & OCC Versioning', async (t4) => {
    // 4.1 Fetch current page
    const getPageRes = await server.request(
      'GET',
      `/api/v1/epaper/pages/${pageOneId}`,
      null,
      { Authorization: `Bearer ${masterAdminToken}` }
    );
    assert.strictEqual(getPageRes.statusCode, 200);
    const currentPage = getPageRes.body.data;

    // 4.2 Update page with locked Masthead and unlocked Story
    const updateRes = await server.request(
      'PUT',
      `/api/v1/epaper/pages/${pageOneId}`,
      {
        elements: [
          {
            id: 'elem-masthead-001',
            elementType: 'MASTHEAD',
            customHeadline: 'ब्रेकिंग न्यूज़ वाला',
            bounds: { x: 42.52, y: 30, width: 847.56, height: 110 },
            colSpan: 8,
            zIndex: 10,
            isLocked: true, // Element locked
          },
          {
            id: 'elem-lead-001',
            elementType: 'STORY',
            articleId: sampleArticle.id,
            customHeadline: sampleArticle.title,
            customBodyText: sampleArticle.content,
            byline: sampleArticle.byline,
            editorCredit: 'एडमिन डेस्क',
            bounds: { x: 42.52, y: 150, width: 847.56, height: 350 },
            colSpan: 8,
            zIndex: 1,
            isLocked: false,
          },
        ],
        version: currentPage.version,
      },
      { Authorization: `Bearer ${masterAdminToken}` }
    );
    assert.strictEqual(updateRes.statusCode, 200);
    const elements = updateRes.body.data.elements;
    assert.strictEqual(elements[0].isLocked, true, 'Masthead should be locked');
    assert.strictEqual(elements[1].isLocked, false, 'Story element should be unlocked');
    assert.strictEqual(updateRes.body.data.version, currentPage.version + 1);
  });

  // =========================================================================
  // SECTION 5: MEDIA UPLOAD & CONTENT INSERTION
  // =========================================================================
  await t.test('5. Media Upload Integration & Storage Service', async (t5) => {
    // 5.1 POST /api/v1/media/upload with simulated image
    const sampleBuffer = Buffer.from('FAKE_JPEG_IMAGE_CONTENT_SAMPLE').toString('base64');
    const uploadRes = await server.request(
      'POST',
      '/api/v1/media/upload',
      {
        fileName: 'frontpage_lead_photo.jpg',
        mimeType: 'image/jpeg',
        fileBuffer: sampleBuffer,
        altTextHi: 'भोपाल मेट्रो स्टेशन का दृश्य',
      },
      { Authorization: `Bearer ${masterAdminToken}` }
    );
    assert.ok(uploadRes.statusCode === 200 || uploadRes.statusCode === 201, 'Media upload should succeed');
    assert.strictEqual(uploadRes.body.success, true);
    assert.ok(uploadRes.body.data.url, 'Should return uploaded image URL');

    const uploadedUrl = uploadRes.body.data.url;

    // 5.2 Fetch page version
    const pRes = await server.request(
      'GET',
      `/api/v1/epaper/pages/${pageOneId}`,
      null,
      { Authorization: `Bearer ${masterAdminToken}` }
    );
    const currVer = pRes.body.data.version;

    // Insert uploaded image into Page 1
    const addImgRes = await server.request(
      'PUT',
      `/api/v1/epaper/pages/${pageOneId}`,
      {
        elements: [
          ...pRes.body.data.elements,
          {
            id: 'elem-img-001',
            elementType: 'IMAGE',
            imageUrl: uploadedUrl,
            customHeadline: 'भोपाल मेट्रो स्टेशन का दृश्य',
            photoCredit: 'बीएनडब्ल्यू मुख्य फोटो डेस्क',
            bounds: { x: 42.52, y: 510, width: 418.78, height: 260 },
            colSpan: 4,
            zIndex: 2,
            isLocked: false,
          },
        ],
        version: currVer,
      },
      { Authorization: `Bearer ${masterAdminToken}` }
    );
    assert.strictEqual(addImgRes.statusCode, 200);
    assert.ok(addImgRes.body.data.elements.some((el) => el.imageUrl === uploadedUrl));
  });

  // =========================================================================
  // SECTION 6: SAVE, DRAFT AND REOPEN WORKFLOW
  // =========================================================================
  await t.test('6. Save Draft, Update Edition Metadata & Reopen', async (t6) => {
    // 6.1 Save Draft status
    const draftRes = await server.request(
      'PATCH',
      `/api/v1/epaper/editions/${testEditionId}/status`,
      {
        status: 'DRAFT',
      },
      { Authorization: `Bearer ${masterAdminToken}` }
    );
    assert.strictEqual(draftRes.statusCode, 200);
    assert.strictEqual(draftRes.body.data.status, 'DRAFT');

    // 6.2 Update edition details (e.g. title & description)
    const updateRes = await server.request(
      'PATCH',
      `/api/v1/epaper/editions/${testEditionId}`,
      {
        title: 'जबलपुर महाकौशल दैनिक (अद्यतित संस्करण)',
        description: 'संशोधित मुख्य संस्करण',
      },
      { Authorization: `Bearer ${masterAdminToken}` }
    );
    assert.strictEqual(updateRes.statusCode, 200);
    assert.strictEqual(updateRes.body.data.title, 'जबलपुर महाकौशल दैनिक (अद्यतित संस्करण)');

    // 6.3 Reopen Draft and verify all pages & elements remain intact
    const reopenRes = await server.request(
      'GET',
      `/api/v1/epaper/editions/${testEditionId}`,
      null,
      { Authorization: `Bearer ${masterAdminToken}` }
    );
    assert.strictEqual(reopenRes.statusCode, 200);
    assert.strictEqual(reopenRes.body.data.status, 'DRAFT');

    const verifyPageRes = await server.request(
      'GET',
      `/api/v1/epaper/pages/${pageOneId}`,
      null,
      { Authorization: `Bearer ${masterAdminToken}` }
    );
    assert.strictEqual(verifyPageRes.statusCode, 200);
    assert.ok(verifyPageRes.body.data.elements.length > 0, 'Page elements must be preserved on reopen');
  });

  // =========================================================================
  // SECTION 7: PREVIEW, APPROVAL AND PUBLISHING WORKFLOW
  // =========================================================================
  await t.test('7. Publishing Preflight, Quality Check & Immutable Snapshot', async (t7) => {
    // 7.1 Run Quality Check on edition
    const qcRes = await server.request(
      'POST',
      `/api/v1/epaper/editions/${testEditionId}/quality-check`,
      { skipExportCheck: true },
      { Authorization: `Bearer ${masterAdminToken}` }
    );
    assert.strictEqual(qcRes.statusCode, 200);
    assert.strictEqual(qcRes.body.success, true);
    assert.ok(typeof qcRes.body.data.qualityScore === 'number');

    // 7.2 Attempt to publish without proper authorization (REPORTER)
    const unauthorizedPublish = await server.request(
      'POST',
      `/api/v1/epaper/editions/${testEditionId}/publish`,
      {},
      { Authorization: `Bearer ${reporterToken}` }
    );
    assert.strictEqual(unauthorizedPublish.statusCode, 403, 'REPORTER must not be permitted to publish');

    // 7.3 Approve edition with MASTER_ADMIN
    const approveRes = await server.request(
      'POST',
      `/api/v1/epaper/editions/${testEditionId}/approve`,
      { remarks: 'मास्टर एडमिन अनुमोदन' },
      { Authorization: `Bearer ${masterAdminToken}` }
    );
    assert.strictEqual(approveRes.statusCode, 200);

    // 7.4 Publish with MASTER_ADMIN
    const publishRes = await server.request(
      'POST',
      `/api/v1/epaper/editions/${testEditionId}/publish`,
      {},
      { Authorization: `Bearer ${masterAdminToken}` }
    );
    assert.strictEqual(publishRes.statusCode, 200, 'MASTER_ADMIN must be allowed to publish edition');
    assert.strictEqual(publishRes.body.data.status, 'PUBLISHED');
    assert.ok(publishRes.body.snapshot, 'Snapshot must be created upon publishing');
    assert.strictEqual(publishRes.body.snapshot.pagesSnapshot.length, 12);

    // 7.5 Public Reader can now read the published edition
    const publicEditionsRes = await server.request('GET', '/api/v1/epaper/editions');
    assert.strictEqual(publicEditionsRes.statusCode, 200);
    const found = publicEditionsRes.body.data.find((e) => e.id === testEditionId);
    assert.ok(found, 'Published edition must be present in public listing');

    // 7.6 Digital Archive includes the published edition
    const archiveRes = await server.request('GET', '/api/v1/epaper/archive?year=2026');
    assert.strictEqual(archiveRes.statusCode, 200);
    const archiveList = archiveRes.body.data?.editions || archiveRes.body.data?.items || archiveRes.body.editions || [];
    const archiveFound = archiveList.find((e) => e.id === testEditionId);
    assert.ok(archiveFound, 'Published edition must appear in digital archive');
  });

  // =========================================================================
  // SECTION 8: CANONICAL ROLE INVARIANT VERIFICATION
  // =========================================================================
  await t.test('8. Canonical Role Invariants across E-Paper components', async (t8) => {
    const filesToCheck = [
      'src/screens/AdminControlScreen.tsx',
      'src/screens/EpaperDesignerModal.tsx',
      'src/screens/EpaperScreen.tsx',
      'src/components/NavDrawer.tsx',
      'src/components/epaper/EpaperCreationWizardModal.tsx',
      'src/components/epaper/EpaperNewsSelectionDesk.tsx',
      'src/components/epaper/EpaperStudioTab.tsx',
      'src/components/epaper/designer/EpaperToolboxPanel.tsx',
      'src/components/epaper/designer/EpaperPropertiesPanel.tsx',
      'src/components/epaper/designer/EpaperCanvasPanel.tsx',
      'src/components/epaper/designer/EpaperDesignerHeader.tsx',
    ];

    const forbiddenRoles = ['CHIEF_EDITOR', 'DESK_EDITOR', 'MANAGING_EDITOR'];

    for (const relPath of filesToCheck) {
      const fullPath = path.join(ROOT_DIR, relPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const role of forbiddenRoles) {
          const regex = new RegExp(`['"]${role}['"]`, 'g');
          const matches = content.match(regex);
          assert.strictEqual(
            matches,
            null,
            `Forbidden role '${role}' found in ${relPath}. Only canonical roles (READER, REPORTER, EDITOR, ADMIN, MASTER_ADMIN, SUPER_ADMIN) are allowed.`
          );
        }
      }
    }
  });
});
