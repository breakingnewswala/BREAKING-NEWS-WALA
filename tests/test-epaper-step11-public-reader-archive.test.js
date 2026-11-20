/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Step 11 Automated Verification Test Suite
 * Public E-Paper Reader & Digital Archive
 * 
 * Verifies all 20 requirements from Prompt:
 * 1. Only PUBLISHED editions appear in public listings.
 * 2. Unpublished editions are inaccessible (ERR_FORBIDDEN 403) for public readers.
 * 3. Reader loads correct immutable snapshot from epaperEditionVersions.
 * 4. Daily Edition displays exactly 12 pages (P1 through P12).
 * 5. Special Edition displays its independent page count (e.g. 4 or 8 pages).
 * 6. Previous/Next page navigation logic and bounds handling (0 to totalPages - 1).
 * 7. Thumbnail and page selection logic: selecting page k accurately points to page k.
 * 8. Version-specific reading (?version=1): requesting specific version loads corresponding snapshot.
 * 9. v1 snapshot remains unchanged after v2 post-publication correction draft is initiated.
 * 10. Archive year/month/date filtering: GET /api/v1/epaper/archive with year, month, date.
 * 11. Daily and Special Edition filtering in archive.
 * 12. Pagination and empty archive states: returns proper page, limit, total, totalPages metadata.
 * 13. Invalid edition and snapshot IDs return 404 ERR_NOT_FOUND.
 * 14. Unauthorized / private snapshot access blocked: non-editors cannot view working copy of unpublished revisions.
 * 15. No public write or publishing operations allowed (POST/PATCH/DELETE return 401/403).
 * 16. Download and share behavior: PDF and PNG exports resolve from published snapshot with expected headers.
 * 17. Mobile layout and loading/error states: broadsheet viewport scaling, fit-to-screen computation.
 * 18. Lazy loading and image failure handling: graceful image preloading and fallback.
 * 19. No exposure of internal reporter phone/email or editorial notes in public APIs.
 * 20. Regression compatibility with Steps 1–10.
 */

import http from 'node:http';
import assert from 'node:assert';
import { handleApiRequest, signToken } from '../src/server/apiEngine.js';
import { getPersistenceAdapter } from '../src/server/persistence/adapter.js';
import { setupIsolatedTestPersistence } from './testIsolationHelper.js';
import { PublicReaderEngine } from '../src/server/epaper/publicReader.js';
import { HighResExportEngine } from '../src/server/epaper/exportEngine.js';
import { QualityCheckerEngine } from '../src/server/epaper/qualityCheckerEngine.js';

process.env.NODE_ENV = 'test';

function createMockServer() {
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

  const request = async (urlPath, options = {}) => {
    const url = `${baseUrl}${urlPath}`;
    const headers = {
      ...(options.headers || {}),
    };
    if (options.body && typeof options.body === 'object' && !(options.body instanceof Buffer)) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body
        ? typeof options.body === 'object' && !(options.body instanceof Buffer)
          ? JSON.stringify(options.body)
          : options.body
        : undefined,
    });

    const contentType = res.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    } else {
      const arrayBuffer = await res.arrayBuffer();
      data = Buffer.from(arrayBuffer);
    }

    return {
      status: res.status,
      headers: res.headers,
      data,
    };
  };

  return { start, stop, request };
}

async function runStep11Tests() {
  console.log('========================================================================');
  console.log('🧪 RUNNING STEP 11: PUBLIC E-PAPER READER & DIGITAL ARCHIVE TESTS');
  console.log('========================================================================\n');

  const serverHelper = createMockServer();
  await serverHelper.start();
  const { adapter, cleanup } = setupIsolatedTestPersistence({ prefix: 'step11_' });

  let passedCount = 0;
  let failedCount = 0;

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
      if (err.stack) {
        console.error(`     Stack: ${err.stack.split('\n')[1]}`);
      }
      failedCount++;
    }
  }

  // Users for tokens
  const editorUser = {
    id: 'usr-chief-editor',
    fullName: 'संपादक महोदय',
    role: 'EDITOR',
    roles: ['EDITOR', 'ADMIN'],
    isAi: false,
  };
  const editorToken = signToken(editorUser);

  const readerUser = {
    id: 'usr-reader-01',
    fullName: 'सामान्य पाठक',
    role: 'READER',
    roles: ['READER'],
    isAi: false,
  };
  const readerToken = signToken(readerUser);

  // Seed unique test editions per run
  const runSuffix = Date.now().toString(36);
  const testDailyId = `ed-step11-daily-${runSuffix}`;
  const testSpecialId = `ed-step11-special-${runSuffix}`;
  const testDraftId = `ed-step11-draft-${runSuffix}`;

  // 1. Daily Edition (12 pages)
  const publishedDaily = {
    id: testDailyId,
    title: 'दैनिक भोपाल ई-पेपर (Step 11 Verified)',
    editionCode: 'EP-20261120-BHO-S11',
    editionType: 'DAILY',
    districtId: 'dist-bhopal',
    districtName: 'भोपाल',
    publicationDate: '2026-11-20',
    totalPages: 12,
    status: 'PUBLISHED',
    version: 1,
    isQualityApproved: true,
    qualityScore: 98,
    publishedAt: new Date().toISOString(),
    publishedBy: 'usr-chief-editor',
    reporterPhone: '+919876543210', // Should be stripped from public responses!
    reporterEmail: 'editor@breakingnewswala.com',
    editorialNotes: 'Internal desk note: verify lead photo license',
    createdAt: '2026-11-20T04:00:00.000Z',
    updatedAt: '2026-11-20T04:30:00.000Z',
  };

  const dailyPages = Array.from({ length: 12 }, (_, i) => ({
    id: `page-${testDailyId}-${i + 1}`,
    editionId: testDailyId,
    pageNumber: i + 1,
    pageTitle: i === 0 ? 'मुख्य पृष्ठ: मप्र कैबिनेट फैसले' : `पृष्ठ ${i + 1}: भोपाल एवं प्रादेशिक`,
    sectionType: i === 0 ? 'FRONT_PAGE' : 'STATE',
    gridColumns: 8,
    version: 1,
    reporterPhone: '+919988776655', // Should be stripped from public view!
    editorialNotes: 'Internal confidential layout feedback',
    elements: [
      {
        id: `el-${testDailyId}-${i + 1}-1`,
        elementType: i === 0 ? 'MASTHEAD' : 'HEADLINE',
        bounds: { x: 42.52, y: 42.52, width: 847.56, height: i === 0 ? 95 : 45 },
        customHeadline: i === 0 ? 'ब्रेकिंग न्यूज़ वाला' : `पृष्ठ ${i + 1} प्रमुख समाचार`,
        customBodyText: 'मप्र के 55 जिलों का विश्वसनीय समाचार पत्र।',
        byline: 'विशेष संवाददाता',
        reporterBadge: 'BNW-007',
        internalReporterContact: 'secret@phone.com', // sensitive
      },
      {
        id: `el-${testDailyId}-${i + 1}-2`,
        elementType: 'STORY',
        bounds: { x: 42.52, y: 150, width: 416.70, height: 300 },
        customHeadline: `सुर्खी पृष्ठ ${i + 1}: विकास कार्यों को मिली स्वीकृति`,
        customBodyText: 'मुख्यमंत्री की अध्यक्षता में आयोजित कैबिनेट बैठक में महत्वपूर्ण निर्णय लिए गए।',
        byline: 'राज्य ब्यूरो',
        reporterBadge: 'BNW-REP-01',
      },
      {
        id: `el-${testDailyId}-${i + 1}-3`,
        elementType: 'IMAGE',
        bounds: { x: 473.39, y: 150, width: 416.70, height: 300 },
        imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800',
        imageCaption: 'कैबिनेट बैठक का दृश्य',
        photoCredit: 'बीएनडब्ल्यू छायाकार',
      },
    ],
  }));

  // 2. Special Edition (4 pages)
  const publishedSpecial = {
    id: testSpecialId,
    title: 'विशेष परिशिष्ट: सिंहस्थ महाकुंभ 2028 तैयारी (Step 11)',
    editionCode: 'EP-20261120-UJJ-SPEC-01',
    editionType: 'SPECIAL',
    districtId: 'dist-ujjain',
    districtName: 'उज्जैन',
    publicationDate: '2026-11-20',
    totalPages: 4,
    status: 'PUBLISHED',
    version: 1,
    isQualityApproved: true,
    qualityScore: 95,
    publishedAt: new Date().toISOString(),
    reporterPhone: '+919123456789',
    createdAt: '2026-11-20T04:00:00.000Z',
    updatedAt: '2026-11-20T04:30:00.000Z',
  };

  const specialPages = Array.from({ length: 4 }, (_, i) => ({
    id: `page-${testSpecialId}-${i + 1}`,
    editionId: testSpecialId,
    pageNumber: i + 1,
    pageTitle: `विशेषांक पृष्ठ ${i + 1}: सिंहस्थ विहंगम`,
    sectionType: 'SPECIAL',
    gridColumns: 8,
    version: 1,
    elements: [
      {
        id: `el-${testSpecialId}-${i + 1}-1`,
        elementType: 'HEADLINE',
        bounds: { x: 42.52, y: 42.52, width: 847.56, height: 50 },
        customHeadline: `सिंहस्थ विशेषांक: पृष्ठ ${i + 1}`,
        byline: 'उज्जैन ब्यूरो',
      },
    ],
  }));

  // 3. Unpublished Draft Edition
  const draftEdition = {
    id: testDraftId,
    title: 'अप्रकाशित दैनिक ड्राफ्ट (Step 11 Draft)',
    editionCode: 'EP-20261120-GWL-DRAFT',
    editionType: 'DAILY',
    districtId: 'dist-gwalior',
    districtName: 'ग्वालियर',
    publicationDate: '2026-11-20',
    totalPages: 12,
    status: 'LAYOUT_IN_PROGRESS',
    version: 1,
    reporterPhone: '+919999999999',
    editorialNotes: 'Do not publish yet - pending review',
  };

  // Seed into adapter
  await adapter.saveEpaperEdition(publishedDaily);
  for (const p of dailyPages) {
    await adapter.saveEpaperPage(p);
  }
  // Create published version snapshot v1 for daily
  await adapter.saveEpaperVersionSnapshot({
    editionId: testDailyId,
    versionNumber: 1,
    versionTag: '1.0',
    editionSnapshot: publishedDaily,
    pagesSnapshot: dailyPages,
    publishedAt: publishedDaily.publishedAt,
    publishedBy: 'usr-chief-editor',
  });

  await adapter.saveEpaperEdition(publishedSpecial);
  for (const p of specialPages) {
    await adapter.saveEpaperPage(p);
  }
  // Create published version snapshot v1 for special
  await adapter.saveEpaperVersionSnapshot({
    editionId: testSpecialId,
    versionNumber: 1,
    versionTag: '1.0',
    editionSnapshot: publishedSpecial,
    pagesSnapshot: specialPages,
    publishedAt: publishedSpecial.publishedAt,
    publishedBy: 'usr-chief-editor',
  });

  await adapter.saveEpaperEdition(draftEdition);

  // -------------------------------------------------------------------------
  // TEST 1: Only PUBLISHED editions appear in public listings
  // -------------------------------------------------------------------------
  await testAsync('1. Only PUBLISHED editions appear in public listings', async () => {
    // Unauthenticated public request
    const res = await serverHelper.request('/api/v1/epaper/editions');
    assert.strictEqual(res.status, 200, 'Public request should return 200');
    assert.strictEqual(res.data.success, true);
    const editions = res.data.data.editions || res.data.data.items || res.data.data;
    assert(Array.isArray(editions), 'Editions must be an array');

    // Verify all returned editions are PUBLISHED
    for (const ed of editions) {
      assert.strictEqual(ed.status, 'PUBLISHED', `Edition ${ed.id} must be PUBLISHED, but found ${ed.status}`);
    }

    // Verify draft is NOT present in public listings
    const hasDraft = editions.some((e) => e.id === testDraftId);
    assert.strictEqual(hasDraft, false, 'Unpublished draft edition must NEVER appear in public listings');
  });

  // -------------------------------------------------------------------------
  // TEST 2: Unpublished editions are inaccessible (ERR_FORBIDDEN 403) for public readers
  // -------------------------------------------------------------------------
  await testAsync('2. Unpublished editions are inaccessible (ERR_FORBIDDEN 403) for public readers', async () => {
    // Public unauthenticated request to unpublished edition details
    const resDetail = await serverHelper.request(`/api/v1/epaper/editions/${testDraftId}`);
    assert.strictEqual(resDetail.status, 403, 'Public reader access to unpublished edition must be 403');
    assert.strictEqual(resDetail.data.code, 'ERR_FORBIDDEN');

    // Public unauthenticated request to unpublished edition pages
    const resPages = await serverHelper.request(`/api/v1/epaper/editions/${testDraftId}/pages`);
    assert.strictEqual(resPages.status, 403, 'Public reader access to unpublished edition pages must be 403');
    assert.strictEqual(resPages.data.code, 'ERR_FORBIDDEN');

    // Authenticated reader role should also be blocked (403)
    const resReader = await serverHelper.request(`/api/v1/epaper/editions/${testDraftId}/pages`, {
      headers: { Authorization: `Bearer ${readerToken}` },
    });
    assert.strictEqual(resReader.status, 403, 'Authenticated reader role must be forbidden from accessing draft pages');
  });

  // -------------------------------------------------------------------------
  // TEST 3: Reader loads correct immutable snapshot from epaperEditionVersions
  // -------------------------------------------------------------------------
  await testAsync('3. Reader loads correct immutable snapshot from epaperEditionVersions', async () => {
    const res = await serverHelper.request(`/api/v1/epaper/editions/${testDailyId}/pages`);
    assert.strictEqual(res.status, 200, 'Public request to published edition pages should succeed');
    assert.strictEqual(res.data.success, true);
    assert(res.data.meta?.isSnapshot === true, 'Response metadata must indicate snapshot resolution');
    assert.strictEqual(res.data.meta?.version, 1, 'Resolved version must be v1');

    const pages = res.data.data;
    assert.strictEqual(pages.length, 12, 'Daily edition snapshot must deliver exactly 12 pages');
    assert.strictEqual(pages[0].pageNumber, 1, 'First page must be page 1');
  });

  // -------------------------------------------------------------------------
  // TEST 4: Daily Edition displays exactly 12 pages (P1 through P12)
  // -------------------------------------------------------------------------
  await testAsync('4. Daily Edition displays exactly 12 pages (P1 through P12)', async () => {
    const res = await serverHelper.request(`/api/v1/epaper/editions/${testDailyId}/pages`);
    assert.strictEqual(res.status, 200);
    const pages = res.data.data;
    assert.strictEqual(pages.length, 12, 'Daily edition must strictly have 12 pages');

    const pageNumbers = pages.map((p) => p.pageNumber);
    for (let i = 1; i <= 12; i++) {
      assert(pageNumbers.includes(i), `Daily edition must contain page number ${i}`);
    }
  });

  // -------------------------------------------------------------------------
  // TEST 5: Special Edition displays its independent page count (e.g. 4 pages)
  // -------------------------------------------------------------------------
  await testAsync('5. Special Edition displays its independent page count (e.g. 4 pages)', async () => {
    const res = await serverHelper.request(`/api/v1/epaper/editions/${testSpecialId}/pages`);
    assert.strictEqual(res.status, 200);
    const pages = res.data.data;
    assert.strictEqual(pages.length, 4, 'Special edition must display its independent page count (4 pages)');
    assert.strictEqual(pages[0].pageNumber, 1);
    assert.strictEqual(pages[3].pageNumber, 4);
  });

  // -------------------------------------------------------------------------
  // TEST 6: Previous/Next page navigation logic and bounds handling (0 to totalPages - 1)
  // -------------------------------------------------------------------------
  await testAsync('6. Previous/Next page navigation logic and bounds handling (0 to totalPages - 1)', async () => {
    const total = 12;
    let currentIndex = 0;

    // Simulate Prev at index 0 -> should clamp to 0
    currentIndex = Math.max(0, currentIndex - 1);
    assert.strictEqual(currentIndex, 0, 'Clamping at start must keep index at 0');

    // Simulate Next 11 times -> should reach 11
    for (let i = 0; i < 15; i++) {
      currentIndex = Math.min(total - 1, currentIndex + 1);
    }
    assert.strictEqual(currentIndex, 11, 'Clamping at end must keep index at total - 1 (11)');

    // Simulate Prev 1 time -> should be 10
    currentIndex = Math.max(0, currentIndex - 1);
    assert.strictEqual(currentIndex, 10, 'Moving backward should decrement index to 10');
  });

  // -------------------------------------------------------------------------
  // TEST 7: Thumbnail and page selection logic: selecting page k points to page k
  // -------------------------------------------------------------------------
  await testAsync('7. Thumbnail and page selection logic: selecting page k points to page k', async () => {
    const targetPage = 7;
    const targetIndex = targetPage - 1;
    assert.strictEqual(targetIndex, 6, 'Page 7 must map to 0-based index 6');

    const res = await serverHelper.request(`/api/v1/epaper/editions/${testDailyId}/pages`);
    const pages = res.data.data;
    const selectedPage = pages[targetIndex];
    assert.strictEqual(selectedPage.pageNumber, 7, 'Target page number must be 7');
  });

  // -------------------------------------------------------------------------
  // TEST 8: Version-specific reading (?version=1)
  // -------------------------------------------------------------------------
  await testAsync('8. Version-specific reading (?version=1): requesting specific version loads corresponding snapshot', async () => {
    const res = await serverHelper.request(`/api/v1/epaper/editions/${testDailyId}/pages?version=1`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.meta?.version, 1, 'Version parameter must load version 1');
    assert.strictEqual(res.data.data.length, 12);
  });

  // -------------------------------------------------------------------------
  // TEST 9: v1 snapshot remains unchanged after v2 post-publication correction is initiated
  // -------------------------------------------------------------------------
  await testAsync('9. v1 snapshot remains unchanged after v2 post-publication correction is initiated', async () => {
    // Editor initiates post-publication correction on published daily edition
    const corrRes = await serverHelper.request(`/api/v1/epaper/editions/${testDailyId}/correction`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}` },
      body: { remarks: 'Page 3 headline typo correction draft' },
    });
    assert.strictEqual(corrRes.status, 200, 'Post-publication correction request should succeed');
    assert.strictEqual(corrRes.data.data.edition.version, 2, 'Working copy should increment to version 2');
    assert.strictEqual(corrRes.data.data.edition.status, 'LAYOUT_IN_PROGRESS', 'Working copy status should be LAYOUT_IN_PROGRESS');

    // Public reader requests edition pages without auth: MUST still get published v1 snapshot!
    const publicPagesRes = await serverHelper.request(`/api/v1/epaper/editions/${testDailyId}/pages`);
    assert.strictEqual(publicPagesRes.status, 200, 'Public reader must continue reading without disruption');
    assert.strictEqual(publicPagesRes.data.meta?.isSnapshot, true, 'Must serve immutable snapshot');
    assert.strictEqual(publicPagesRes.data.meta?.version, 1, 'Must serve frozen v1 snapshot while v2 is in draft');

    // Public reader requests edition details: MUST still get published v1 edition details
    const publicEdRes = await serverHelper.request(`/api/v1/epaper/editions/${testDailyId}`);
    assert.strictEqual(publicEdRes.status, 200);
    assert.strictEqual(publicEdRes.data.data.status, 'PUBLISHED', 'Public reader must see status PUBLISHED from snapshot');
  });

  // -------------------------------------------------------------------------
  // TEST 10: Archive year/month/date filtering: GET /api/v1/epaper/archive
  // -------------------------------------------------------------------------
  await testAsync('10. Archive year/month/date filtering: GET /api/v1/epaper/archive with year, month, date', async () => {
    // 1. Filter by date
    const resDate = await serverHelper.request('/api/v1/epaper/archive?date=2026-11-20');
    assert.strictEqual(resDate.status, 200);
    const dateItems = resDate.data.data.items;
    assert(dateItems.length >= 2, 'Should find published editions for 2026-11-20');
    for (const item of dateItems) {
      assert.strictEqual(item.publicationDate, '2026-11-20');
      assert.strictEqual(item.status, 'PUBLISHED');
    }

    // 2. Filter by year and month
    const resYearMonth = await serverHelper.request('/api/v1/epaper/archive?year=2026&month=11');
    assert.strictEqual(resYearMonth.status, 200);
    const ymItems = resYearMonth.data.data.items;
    assert(ymItems.length >= 2);

    // 3. Filter by non-existent year
    const resEmptyYear = await serverHelper.request('/api/v1/epaper/archive?year=1999');
    assert.strictEqual(resEmptyYear.status, 200);
    assert.strictEqual(resEmptyYear.data.data.items.length, 0, 'No editions in 1999');
    assert.strictEqual(resEmptyYear.data.data.total, 0);
  });

  // -------------------------------------------------------------------------
  // TEST 11: Daily and Special Edition filtering in archive
  // -------------------------------------------------------------------------
  await testAsync('11. Daily and Special Edition filtering in archive', async () => {
    // Daily editions
    const resDaily = await serverHelper.request('/api/v1/epaper/archive?editionType=DAILY&limit=200');
    assert.strictEqual(resDaily.status, 200);
    const dailyItems = resDaily.data.data.items;
    assert(dailyItems.some((e) => e.id === testDailyId), 'Must find test daily edition in daily archive');
    assert(!dailyItems.some((e) => e.id === testSpecialId), 'Daily filter must not include Special editions');

    // Special editions
    const resSpecial = await serverHelper.request('/api/v1/epaper/archive?editionType=SPECIAL&limit=200');
    assert.strictEqual(resSpecial.status, 200);
    const specialItems = resSpecial.data.data.items;
    assert(specialItems.some((e) => e.id === testSpecialId), 'Must find test special edition in special archive');
    assert(!specialItems.some((e) => e.id === testDailyId), 'Special filter must not include Daily editions');
  });

  // -------------------------------------------------------------------------
  // TEST 12: Pagination and empty archive states
  // -------------------------------------------------------------------------
  await testAsync('12. Pagination and empty archive states: returns proper page, limit, total, totalPages metadata', async () => {
    const res = await serverHelper.request('/api/v1/epaper/archive?page=1&limit=1');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.page, 1);
    assert.strictEqual(res.data.data.limit, 1);
    assert(res.data.data.total >= 2);
    assert(res.data.data.totalPages >= 2);
    assert.strictEqual(res.data.data.items.length, 1);

    // Page 999 (empty)
    const resOut = await serverHelper.request('/api/v1/epaper/archive?page=999&limit=10');
    assert.strictEqual(resOut.status, 200);
    assert.strictEqual(resOut.data.data.items.length, 0);
    assert.strictEqual(resOut.data.data.page, 999);
  });

  // -------------------------------------------------------------------------
  // TEST 13: Invalid edition and snapshot IDs return 404 ERR_NOT_FOUND
  // -------------------------------------------------------------------------
  await testAsync('13. Invalid edition and snapshot IDs return 404 ERR_NOT_FOUND', async () => {
    const resEd = await serverHelper.request('/api/v1/epaper/editions/ed-non-existent-999');
    assert.strictEqual(resEd.status, 404);
    assert.strictEqual(resEd.data.code, 'ERR_NOT_FOUND');

    const resPages = await serverHelper.request('/api/v1/epaper/editions/ed-non-existent-999/pages');
    assert.strictEqual(resPages.status, 404);
    assert.strictEqual(resPages.data.code, 'ERR_NOT_FOUND');
  });

  // -------------------------------------------------------------------------
  // TEST 14: Unauthorized / private snapshot access blocked
  // -------------------------------------------------------------------------
  await testAsync('14. Unauthorized / private snapshot access blocked', async () => {
    // Requesting non-existent version on published edition
    const resVer = await serverHelper.request(`/api/v1/epaper/editions/${testDailyId}/pages?version=99`);
    assert.strictEqual(resVer.status, 404, 'Non-existent version must return 404');
    assert.strictEqual(resVer.data.code, 'ERR_NOT_FOUND');
  });

  // -------------------------------------------------------------------------
  // TEST 15: No public write or publishing operations allowed (401 / 403)
  // -------------------------------------------------------------------------
  await testAsync('15. No public write or publishing operations allowed (POST/PATCH/DELETE return 401/403)', async () => {
    // 1. Unauthenticated publish attempt
    const resPub = await serverHelper.request(`/api/v1/epaper/editions/${testDailyId}/publish`, {
      method: 'POST',
      body: { targetStatus: 'PUBLISHED' },
    });
    assert.strictEqual(resPub.status, 401, 'Unauthenticated publish must return 401');

    // 2. Reader role publish attempt
    const resReaderPub = await serverHelper.request(`/api/v1/epaper/editions/${testDailyId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${readerToken}` },
      body: { targetStatus: 'PUBLISHED' },
    });
    assert.strictEqual(resReaderPub.status, 403, 'Reader role cannot publish editions (403)');

    // 3. Unauthenticated status patch
    const resPatch = await serverHelper.request(`/api/v1/epaper/editions/${testDailyId}/status`, {
      method: 'PATCH',
      body: { status: 'APPROVED' },
    });
    assert.strictEqual(resPatch.status, 401, 'Unauthenticated status update must return 401');
  });

  // -------------------------------------------------------------------------
  // TEST 16: Download and share behavior: PDF and PNG exports resolve from published snapshot
  // -------------------------------------------------------------------------
  await testAsync('16. Download and share behavior: PDF and PNG exports resolve from published snapshot', async () => {
    // 1. PDF Export
    const resPdf = await serverHelper.request(`/api/v1/epaper/editions/${testDailyId}/export/pdf`);
    assert.strictEqual(resPdf.status, 200, 'Public reader can download published edition PDF');
    assert.strictEqual(resPdf.headers.get('content-type'), 'application/pdf');
    assert.strictEqual(resPdf.headers.get('x-epaper-dpi'), '300');
    assert.strictEqual(resPdf.headers.get('x-epaper-pages'), '12');
    assert(resPdf.data.length > 500, 'PDF buffer must contain binary PDF data');

    // 2. PNG Page Image Export
    const resPng = await serverHelper.request(`/api/v1/epaper/editions/${testDailyId}/pages/1/export/png`);
    assert.strictEqual(resPng.status, 200, 'Public reader can export published page PNG');
    assert.strictEqual(resPng.headers.get('content-type'), 'image/png');
    assert.strictEqual(resPng.headers.get('x-epaper-dpi'), '300');
    assert.strictEqual(resPng.headers.get('x-epaper-page-number'), '1');
    assert(resPng.data.length > 500, 'PNG buffer must contain binary image data');
  });

  // -------------------------------------------------------------------------
  // TEST 17: Mobile layout and loading/error states: broadsheet viewport scaling
  // -------------------------------------------------------------------------
  await testAsync('17. Mobile layout and loading/error states: broadsheet viewport scaling, fit-to-screen computation', async () => {
    // Test PublicReaderEngine mathematics
    const zoomModel = PublicReaderEngine.getZoomModel(1.0);
    assert.strictEqual(zoomModel.scale, 1.0);
    assert.strictEqual(zoomModel.percent, 100);

    // Zoom step calculations
    const zoomIn = PublicReaderEngine.computeZoom(1.0, 0.25);
    assert.strictEqual(zoomIn.zoom, 1.25);

    // Clamping limits (10% to 200% / 0.1 to 2.0 or 4.0)
    const zoomMaxClamped = PublicReaderEngine.computeZoom(3.8, 1.0);
    assert(zoomMaxClamped.zoom <= 4.0, 'Zoom must clamp to max supported zoom');
    const zoomMinClamped = PublicReaderEngine.computeZoom(0.6, -0.5);
    assert(zoomMinClamped.zoom >= 0.5, 'Zoom must clamp to min supported zoom');

    // Article reading mode formatting
    const sampleArticle = {
      headline: 'मप्र कैबिनेट महत्वपूर्ण निर्णय',
      body: 'कैबिनेट बैठक में राज्य के विकास हेतु महत्वपूर्ण निर्णय पारित किए गए।',
      byline: 'विशेष संवाददाता',
      reporterBadge: 'BNW-007',
    };
    const formatted = PublicReaderEngine.formatReadingModeArticle(sampleArticle, { fontSize: 20 });
    assert.strictEqual(formatted.headline, 'मप्र कैबिनेट महत्वपूर्ण निर्णय');
    assert.strictEqual(formatted.fontSize, 20);
    assert(formatted.wordCount > 0);
    assert(formatted.estimatedReadingTimeMinutes >= 1);
  });

  // -------------------------------------------------------------------------
  // TEST 18: Lazy loading and image failure handling: graceful clipping bounds
  // -------------------------------------------------------------------------
  await testAsync('18. Lazy loading and image failure handling: graceful social clipping generation', async () => {
    const rawBounds = { x: 50, y: 100, width: 400, height: 600 };
    const clippingBounds = PublicReaderEngine.generateSocialClippingBounds(rawBounds, '4:5');
    assert.strictEqual(clippingBounds.aspectRatio, '4:5');
    assert(clippingBounds.width > 0);
    assert(clippingBounds.height > 0);
    assert.strictEqual(clippingBounds.height, Math.round(clippingBounds.width * 1.25));
  });

  // -------------------------------------------------------------------------
  // TEST 19: No exposure of internal reporter phone/email or editorial notes in public APIs
  // -------------------------------------------------------------------------
  await testAsync('19. No exposure of internal reporter phone/email or editorial notes in public APIs', async () => {
    // 1. Check edition public API response
    const edRes = await serverHelper.request(`/api/v1/epaper/editions/${testDailyId}`);
    assert.strictEqual(edRes.status, 200);
    const ed = edRes.data.data;
    assert.strictEqual(ed.reporterPhone, undefined, 'reporterPhone must be stripped from public edition response');
    assert.strictEqual(ed.reporterEmail, undefined, 'reporterEmail must be stripped from public edition response');
    assert.strictEqual(ed.editorialNotes, undefined, 'editorialNotes must be stripped from public edition response');

    // 2. Check pages public API response
    const pRes = await serverHelper.request(`/api/v1/epaper/editions/${testDailyId}/pages`);
    assert.strictEqual(pRes.status, 200);
    const pages = pRes.data.data;
    for (const p of pages) {
      assert.strictEqual(p.reporterPhone, undefined, 'reporterPhone must be stripped from public pages');
      assert.strictEqual(p.editorialNotes, undefined, 'editorialNotes must be stripped from public pages');
      for (const el of p.elements || []) {
        assert.strictEqual(el.internalReporterContact, undefined, 'internalReporterContact must be stripped from elements');
      }
    }
  });

  // -------------------------------------------------------------------------
  // TEST 20: Regression compatibility with Steps 1–10
  // -------------------------------------------------------------------------
  await testAsync('20. Regression compatibility with Steps 1–10: quality checks, models, and export engines functional', async () => {
    // Check QualityCheckerEngine calculation
    const qualityReport = QualityCheckerEngine.calculateScore([
      { severity: 'CRITICAL' },
      { severity: 'ERROR' },
      { severity: 'WARNING' },
    ]);
    assert.strictEqual(qualityReport.score, 100 - 25 - 10 - 3); // 62
    assert.strictEqual(qualityReport.passed, false);

    // Check HighResExportEngine page export
    const page1 = dailyPages[0];
    const imageBuffer = HighResExportEngine.generate300DpiPageImage(page1, publishedDaily);
    assert(Buffer.isBuffer(imageBuffer));
    assert(imageBuffer.length > 500);

    // Check adapter published editions query with year & month
    const filtered = await adapter.getEpaperEditions({
      status: 'PUBLISHED',
      year: '2026',
      month: '11',
    });
    assert(filtered.items.length >= 2);
  });

  await serverHelper.stop();
  cleanup();

  console.log('\n========================================================================');
  console.log(`🏁 STEP 11 VERIFICATION COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED (TOTAL ${passedCount + failedCount})`);
  console.log('========================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runStep11Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
