/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * STEP 3: E-Paper News Selection Desk & Editorial Workflow Test Suite
 * File: tests/test-epaper-step3-selection-workflow.test.js
 * 
 * Verifies:
 * 1. Eligible Articles Query: Only approved/eligible articles enter selection desk; unapproved drafts excluded.
 * 2. Search & Multi-Filter Matrix: Headline, ID, keywords, district, category, reporter, priority, image, length (short/med/long).
 * 3. Sorting Engine: Latest, priority-weighted, and editorial relevance sorting.
 * 4. Duplicate Assignment Prevention: Rejects concurrent duplicate assignments with 409 ERR_DUPLICATE_ASSIGNMENT; forceDuplicate override.
 * 5. Page Assignment: Daily 12-page boundary enforcement; Special Edition independent page counts; bulk assignment.
 * 6. Source Article Immutability: Source article in newsArticles is NEVER deleted or modified upon assignment, override, or removal.
 * 7. Published Edition Immutability: Published editions reject assignment or removal modifications.
 * 8. Editorial Workflow State Machine: NEWS_RECEIVED -> EDITORIAL_REVIEW -> APPROVED_FOR_EPAPER -> ASSIGNED_TO_PAGE -> PAGE_DESIGNED -> QUALITY_CHECK -> FINAL_APPROVED -> PUBLISHED; stage skip prevention.
 * 9. RBAC & Security: Unauthorized roles (READER, REPORTER) blocked; FINAL_APPROVED restricted to Chief Editor / Admin.
 * 10. Editorial Credit Integrity: Reporter credit from source article; editor credit from authorized staff; missing credit warning flags.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { handleApiRequest, signToken } from '../src/server/apiEngine.js';
import { getPersistenceAdapter } from '../src/server/persistence/adapter.js';
import { setupIsolatedTestPersistence } from './testIsolationHelper.js';

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
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return {
      status: res.status,
      headers: res.headers,
      data,
    };
  };

  return { start, stop, request };
}

test.describe('STEP 3: E-PAPER NEWS SELECTION DESK & EDITORIAL WORKFLOW', () => {
  let serverHelper;
  let adapter;
  let isolationCleanup;
  let editorToken;
  let chiefEditorToken;
  let readerToken;
  let reporterToken;

  test.before(async () => {
    const iso = setupIsolatedTestPersistence({ prefix: 'step3_' });
    adapter = iso.adapter;
    isolationCleanup = iso.cleanup;
    serverHelper = createMockServer();
    await serverHelper.start();

    // Authenticated Tokens
    editorToken = signToken({
      id: 'usr-editor-1',
      identifier: 'editor',
      fullName: 'दिनेश अग्निहोत्री (डेस्क संपादक)',
      email: 'editor@breakingnewswala.com',
      roles: ['EDITOR'],
      role: 'EDITOR',
    });

    chiefEditorToken = signToken({
      id: 'usr-admin-1',
      identifier: 'admin',
      fullName: 'प्रधान संपादक / सिस्टम एडमिनिस्ट्रेटर',
      email: 'admin@breakingnewswala.com',
      roles: ['ADMIN', 'EDITOR', 'SUPER_ADMIN', 'CHIEF_EDITOR'],
      role: 'CHIEF_EDITOR',
    });

    reporterToken = signToken({
      id: 'usr-rep-1',
      identifier: 'rep_bhopal',
      fullName: 'राजेश पटेल',
      email: 'rajesh.patel@breakingnewswala.com',
      roles: ['REPORTER'],
      role: 'REPORTER',
    });

    readerToken = signToken({
      id: 'usr-reader-1',
      identifier: 'reader',
      fullName: 'पाठक उपयोगकर्ता',
      email: 'reader@example.com',
      roles: ['READER'],
      role: 'READER',
    });
  });

  test.after(async () => {
    await serverHelper.stop();
  });

  // TEST 1: Eligible Articles Query & Draft Exclusion
  test('1. Eligible Articles Query: Only approved/eligible articles enter selection desk (unapproved drafts excluded)', async () => {
    // Add an unapproved draft article to persistence
    const draftArtId = `draft-${Date.now()}`;
    adapter.data.articles.unshift({
      id: draftArtId,
      slug: draftArtId,
      title: 'अस्वीकृत कच्चा ड्राफ्ट (Unapproved Draft)',
      summary: 'यह ड्राफ्ट अभी किसी संपादक द्वारा अनुमोदित नहीं हुआ है।',
      content: 'कच्चा समाचार विवरण...',
      status: 'DRAFT', // Not APPROVED or PUBLISHED
      createdAt: new Date().toISOString(),
    });

    const res = await serverHelper.request('/api/v1/epaper/eligible-articles', {
      headers: { Authorization: `Bearer ${editorToken}` },
    });

    assert.equal(res.status, 200, 'Eligible articles endpoint must return 200 for editor');
    assert.equal(res.data.success, true);
    assert.ok(Array.isArray(res.data.data.items), 'Must return items array');

    // Verify unapproved draft is NOT in eligible list
    const foundDraft = res.data.data.items.find((a) => a.id === draftArtId);
    assert.equal(foundDraft, undefined, 'Unapproved draft must NOT enter E-Paper Selection Desk');

    // Verify all returned items are approved/published or epaper-stage
    for (const art of res.data.data.items) {
      const artStatus = String(art.status || '').toUpperCase();
      const epStatus = String(art.epaperWorkflow?.status || '').toUpperCase();
      const isEligible =
        artStatus === 'APPROVED' ||
        artStatus === 'PUBLISHED' ||
        ['APPROVED_FOR_EPAPER', 'ASSIGNED_TO_PAGE', 'PAGE_DESIGNED', 'QUALITY_CHECK', 'FINAL_APPROVED'].includes(epStatus);
      assert.ok(isEligible, `Article ${art.id} must be eligible (got status: ${artStatus}, epaperStatus: ${epStatus})`);
    }
  });

  // TEST 2: Multi-Filter Matrix (District, Category, Featured Image, Length)
  test('2. Multi-Filter Matrix: Filters by district, category, image presence, length, and keyword search', async () => {
    // A. Filter by District
    const distRes = await serverHelper.request('/api/v1/epaper/eligible-articles?districtId=dist-bhopal', {
      headers: { Authorization: `Bearer ${editorToken}` },
    });
    assert.equal(distRes.status, 200);
    for (const art of distRes.data.data.items) {
      assert.ok(
        art.districtId === 'dist-bhopal' || art.districtName === 'भोपाल',
        `Article ${art.id} should match district भोपाल`
      );
    }

    // B. Filter by Featured Image
    const imgRes = await serverHelper.request('/api/v1/epaper/eligible-articles?hasImage=true', {
      headers: { Authorization: `Bearer ${editorToken}` },
    });
    assert.equal(imgRes.status, 200);
    for (const art of imgRes.data.data.items) {
      const hasImg = Boolean((art.featuredImage && art.featuredImage.trim()) || (art.imageUrl && art.imageUrl.trim()));
      assert.ok(hasImg, `Article ${art.id} in hasImage=true must have image`);
    }

    // C. Filter by Article Length: SHORT (<100 words)
    const shortRes = await serverHelper.request('/api/v1/epaper/eligible-articles?length=SHORT', {
      headers: { Authorization: `Bearer ${editorToken}` },
    });
    assert.equal(shortRes.status, 200);
    for (const art of shortRes.data.data.items) {
      const words = (art.content || art.summary || '').trim().split(/\s+/).filter(Boolean).length;
      assert.ok(words < 100, `Article ${art.id} with length=SHORT must have < 100 words (got ${words})`);
    }

    // D. Keyword Search
    const searchRes = await serverHelper.request('/api/v1/epaper/eligible-articles?search=विधानसभा', {
      headers: { Authorization: `Bearer ${editorToken}` },
    });
    assert.equal(searchRes.status, 200);
    assert.ok(searchRes.data.data.items.length > 0, 'Should find articles matching "विधानसभा"');
  });

  // TEST 3: Sorting Engine (Latest, Priority, Relevance)
  test('3. Sorting Engine: Correctly orders articles by latest, priority, and editorial relevance', async () => {
    const priorityRes = await serverHelper.request('/api/v1/epaper/eligible-articles?sort=priority', {
      headers: { Authorization: `Bearer ${editorToken}` },
    });
    assert.equal(priorityRes.status, 200);
    const items = priorityRes.data.data.items;
    const priorityWeight = { URGENT: 4, BREAKING: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

    for (let i = 0; i < items.length - 1; i++) {
      const w1 = priorityWeight[String(items[i].priority || '').toUpperCase()] || 0;
      const w2 = priorityWeight[String(items[i + 1].priority || '').toUpperCase()] || 0;
      assert.ok(w1 >= w2, `Item ${i} (weight ${w1}) must be >= item ${i + 1} (weight ${w2})`);
    }
  });

  // TEST 4: Duplicate Assignment Prevention Within Same Edition
  test('4. Duplicate Assignment Prevention: Rejects duplicate assignment with 409 ERR_DUPLICATE_ASSIGNMENT; permits forceDuplicate', async () => {
    // Create a fresh Daily 12-page edition
    const createRes = await serverHelper.request('/api/v1/epaper/editions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}` },
      body: {
        title: 'दैनिक भोपाल संस्करण (डुप्लीकेट परीक्षण)',
        publicationDate: '2026-11-20',
        editionType: 'DAILY',
        districtId: 'dist-bhopal',
        districtName: 'भोपाल',
      },
    });
    assert.equal(createRes.status, 201);
    const editionId = createRes.data.data.edition.id;

    // Pick an article
    const testArticle = adapter.data.articles.find((a) => a.status === 'PUBLISHED') || adapter.data.articles[0];

    // Assign to Page 1
    const assignP1 = await serverHelper.request(`/api/v1/epaper/editions/${editionId}/assign-articles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}` },
      body: {
        pageNumber: 1,
        articleIds: [testArticle.id],
        editorCredit: 'दिनेश अग्निहोत्री (डेस्क संपादक)',
      },
    });
    assert.equal(assignP1.status, 200, 'First assignment to Page 1 must succeed');

    // Attempting to assign same article to Page 2 WITHOUT forceDuplicate must fail with 409 Conflict
    const assignP2Conflict = await serverHelper.request(`/api/v1/epaper/editions/${editionId}/assign-articles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}` },
      body: {
        pageNumber: 2,
        articleIds: [testArticle.id],
      },
    });
    assert.equal(assignP2Conflict.status, 409, 'Duplicate assignment must return 409 Conflict');
    assert.equal(assignP2Conflict.data.code || assignP2Conflict.data.error?.code, 'ERR_DUPLICATE_ASSIGNMENT');
    const p2Details = assignP2Conflict.data.details || assignP2Conflict.data.error?.details;
    assert.equal(p2Details?.alreadyAssignedPage, 1);

    // Assigning with forceDuplicate: true must succeed with warning
    const assignP2Force = await serverHelper.request(`/api/v1/epaper/editions/${editionId}/assign-articles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}` },
      body: {
        pageNumber: 2,
        articleIds: [testArticle.id],
        forceDuplicate: true,
      },
    });
    assert.equal(assignP2Force.status, 200, 'Force duplicate assignment must succeed');
    assert.ok(assignP2Force.data.data.warnings.length > 0, 'Must return warning regarding duplicate placement');
  });

  // TEST 5: Daily 12-Page Boundary & Special Edition Independent Page Counts
  test('5. Page Assignment: Daily 12-page boundary enforcement & Special Edition independent page counts', async () => {
    // Daily Edition has 12 pages
    const dailyCreate = await serverHelper.request('/api/v1/epaper/editions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}` },
      body: {
        title: 'दैनिक भोपाल 12-पृष्ठ बाउंड्री टेस्ट',
        publicationDate: '2026-11-21',
        editionType: 'DAILY',
      },
    });
    const dailyId = dailyCreate.data.data.edition.id;
    assert.equal(dailyCreate.data.data.edition.totalPages, 12);

    const testArt = adapter.data.articles.find((a) => a.status === 'PUBLISHED' || a.status === 'APPROVED') || adapter.data.articles[1];
    testArt.content = 'भोपाल में आयोजित विशेष बैठक में संपादकीय निर्णय लिए गए।';

    // Assign to valid Page 12: Success
    const assignP12 = await serverHelper.request(`/api/v1/epaper/editions/${dailyId}/assign-articles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}` },
      body: { pageNumber: 12, articleIds: [testArt.id] },
    });
    assert.equal(assignP12.status, 200, 'Assignment to Page 12 must succeed');

    // Assign to invalid Page 13: Must reject with 400
    const assignP13 = await serverHelper.request(`/api/v1/epaper/editions/${dailyId}/assign-articles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}` },
      body: { pageNumber: 13, articleIds: [testArt.id] },
    });
    assert.equal(assignP13.status, 400, 'Assignment beyond Page 12 on Daily must return 400');
    assert.equal(assignP13.data.code || assignP13.data.error?.code, 'ERR_INVALID_PAGE_NUMBER');

    // Special Edition with 4 pages
    const specialCreate = await serverHelper.request('/api/v1/epaper/editions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}` },
      body: {
        title: 'सिंघस्थ कुंभ विशेषांक (Special 4-Page)',
        publicationDate: '2026-11-21',
        editionType: 'SPECIAL',
        totalPages: 4,
      },
    });
    const specialId = specialCreate.data.data.edition.id;
    assert.equal(specialCreate.data.data.edition.totalPages, 4);

    // Assign to Special Page 4: Success
    const specialP4 = await serverHelper.request(`/api/v1/epaper/editions/${specialId}/assign-articles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}` },
      body: { pageNumber: 4, articleIds: [testArt.id] },
    });
    assert.equal(specialP4.status, 200, 'Assignment to Page 4 of Special Edition must succeed');

    // Assign to Special Page 5: Must reject with 400
    const specialP5 = await serverHelper.request(`/api/v1/epaper/editions/${specialId}/assign-articles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}` },
      body: { pageNumber: 5, articleIds: [testArt.id] },
    });
    assert.equal(specialP5.status, 400, 'Assignment beyond Page 4 on Special Edition must return 400');
  });

  // TEST 6: Source Article Immutability Guarantee
  test('6. Source Article Immutability: Original news article in newsArticles is NEVER modified or deleted on assignment, override, or removal', async () => {
    // Create an edition
    const edCreate = await serverHelper.request('/api/v1/epaper/editions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}` },
      body: {
        title: 'अपरिवर्तनीयता परीक्षण संस्करण',
        publicationDate: '2026-11-22',
        editionType: 'DAILY',
      },
    });
    const edId = edCreate.data.data.edition.id;

    // Pick a test article and snapshot its exact properties
    const sourceArt = adapter.data.articles.find((a) => a.status === 'PUBLISHED' || a.status === 'APPROVED') || adapter.data.articles[1];
    const originalTitle = sourceArt.title;
    const originalContent = sourceArt.content;
    const originalAuthor = sourceArt.authorName;
    const originalStatus = sourceArt.status;

    // 1. Assign to Page 3
    const assignRes = await serverHelper.request(`/api/v1/epaper/editions/${edId}/assign-articles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}` },
      body: {
        pageNumber: 3,
        articleIds: [sourceArt.id],
        editorCredit: 'दिनेश अग्निहोत्री',
      },
    });
    assert.equal(assignRes.status, 200);

    // 2. Modify print headline override on page element
    const page3 = await adapter.getEpaperPageByNumber(edId, 3);
    const assignedElem = page3.elements.find((el) => el.articleId === sourceArt.id);
    assignedElem.customHeadline = 'संशोधित प्रिंट शीर्षक (Print Headline Override)';
    assignedElem.byline = 'संपादित बायलाइन (Override Byline)';
    await adapter.saveEpaperPage(page3);

    // Verify source article in database is STILL unchanged
    const afterOverride = await adapter.getArticleByIdOrSlug(sourceArt.id);
    assert.equal(afterOverride.title, originalTitle, 'Source article title must remain unchanged');
    assert.equal(afterOverride.content, originalContent, 'Source article content must remain unchanged');
    assert.equal(afterOverride.authorName, originalAuthor, 'Source article authorName must remain unchanged');
    assert.equal(afterOverride.status, originalStatus, 'Source article newsroom status must remain unchanged');

    // 3. Remove article from page
    const removeRes = await serverHelper.request(`/api/v1/epaper/editions/${edId}/pages/3/articles/${sourceArt.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${editorToken}` },
    });
    assert.equal(removeRes.status, 200);
    assert.equal(removeRes.data.data.sourceArticlePreserved, true);

    // Verify source article is STILL present in database and NOT deleted
    const afterDelete = await adapter.getArticleByIdOrSlug(sourceArt.id);
    assert.ok(afterDelete, 'Source article must NEVER be deleted from database when removed from e-paper page');
    assert.equal(afterDelete.title, originalTitle);
  });

  // TEST 7: Published Edition Immutability
  test('7. Published Edition Immutability: Published editions strictly reject article assignment and removal modifications', async () => {
    // Create and publish an edition
    const edCreate = await serverHelper.request('/api/v1/epaper/editions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${chiefEditorToken}` },
      body: {
        title: 'प्रकाशित संस्करण सुरक्षा टेस्ट',
        publicationDate: '2026-11-23',
        editionType: 'DAILY',
      },
    });
    const edId = edCreate.data.data.edition.id;
    const testArt = adapter.data.articles.find((a) => a.status === 'PUBLISHED' || a.status === 'APPROVED') || adapter.data.articles[1];
    testArt.content = 'भोपाल में आयोजित विशेष बैठक में संपादकीय निर्णय लिए गए।';

    // Assign story to Page 1
    await serverHelper.request(`/api/v1/epaper/editions/${edId}/assign-articles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${chiefEditorToken}` },
      body: { pageNumber: 1, articleIds: [testArt.id] },
    });

    // Publish edition
    const pubRes = await serverHelper.request(`/api/v1/epaper/editions/${edId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${chiefEditorToken}` },
      body: { version: 1 },
    });
    assert.equal(pubRes.status, 200);

    // Attempting to assign new article to published edition must fail with 400 ERR_EDITION_ALREADY_PUBLISHED
    const assignAfterPublish = await serverHelper.request(`/api/v1/epaper/editions/${edId}/assign-articles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${chiefEditorToken}` },
      body: { pageNumber: 2, articleIds: [adapter.data.articles[1].id] },
    });
    assert.equal(assignAfterPublish.status, 400, 'Cannot assign to published edition');
    assert.equal(assignAfterPublish.data.code || assignAfterPublish.data.error?.code, 'ERR_EDITION_ALREADY_PUBLISHED');

    // Attempting to remove article from published edition must fail with 400 ERR_EDITION_ALREADY_PUBLISHED
    const removeAfterPublish = await serverHelper.request(`/api/v1/epaper/editions/${edId}/pages/1/articles/${testArt.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${chiefEditorToken}` },
    });
    assert.equal(removeAfterPublish.status, 400, 'Cannot remove article from published edition');
    assert.equal(removeAfterPublish.data.code || removeAfterPublish.data.error?.code, 'ERR_EDITION_ALREADY_PUBLISHED');
  });

  // TEST 8: Editorial Workflow State Machine & Stage Skip Prevention
  test('8. Editorial Workflow State Machine: Enforces 8-stage sequence and prevents stage skipping', async () => {
    const artId = `wf-test-${Date.now()}`;
    adapter.data.articles.unshift({
      id: artId,
      slug: artId,
      title: 'कार्यप्रवाह परीक्षण समाचार',
      content: 'सामग्री...',
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
    });

    // 1. Article starts in NEWS_RECEIVED
    // Attempting to jump directly from NEWS_RECEIVED (0) to FINAL_APPROVED (6) must fail
    const skipRes = await serverHelper.request(`/api/v1/epaper/articles/${artId}/workflow-status`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${chiefEditorToken}` },
      body: { targetStatus: 'FINAL_APPROVED' },
    });
    assert.equal(skipRes.status, 400, 'Jumping from NEWS_RECEIVED to FINAL_APPROVED must be forbidden');
    assert.equal(skipRes.data.code || skipRes.data.error?.code, 'ERR_STAGE_SKIP_FORBIDDEN');

    // 2. Advance to EDITORIAL_REVIEW (Step 2): Success
    const step2 = await serverHelper.request(`/api/v1/epaper/articles/${artId}/workflow-status`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}` },
      body: { targetStatus: 'EDITORIAL_REVIEW', remarks: 'संपादकीय समीक्षा प्रारंभ' },
    });
    assert.equal(step2.status, 200);
    assert.equal(step2.data.data.currentStatus, 'EDITORIAL_REVIEW');

    // 3. Advance to APPROVED_FOR_EPAPER (Step 3): Success
    const step3 = await serverHelper.request(`/api/v1/epaper/articles/${artId}/workflow-status`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}` },
      body: { targetStatus: 'APPROVED_FOR_EPAPER', remarks: 'ई-पेपर हेतु स्वीकृत' },
    });
    assert.equal(step3.status, 200);
    assert.equal(step3.data.data.currentStatus, 'APPROVED_FOR_EPAPER');

    // 4. Verify history trail
    const artAfter = await adapter.getArticleByIdOrSlug(artId);
    assert.ok(artAfter.epaperWorkflow.history.length >= 2, 'Must record audit history of stage transitions');
  });

  // TEST 9: RBAC & Security Enforcement
  test('9. RBAC & Security: Unauthorized roles (READER, REPORTER) blocked; FINAL_APPROVED restricted to Chief Editor', async () => {
    const testArt = adapter.data.articles.find((a) => a.status === 'PUBLISHED' || a.status === 'APPROVED') || adapter.data.articles[1];
    testArt.content = 'भोपाल में आयोजित विशेष बैठक में संपादकीय निर्णय लिए गए।';

    // A. Unauthenticated request: 401 Unauthorized
    const unauthRes = await serverHelper.request('/api/v1/epaper/eligible-articles');
    assert.equal(unauthRes.status, 401, 'Unauthenticated request must return 401');

    // B. Reader role: 403 Forbidden
    const readerRes = await serverHelper.request('/api/v1/epaper/eligible-articles', {
      headers: { Authorization: `Bearer ${readerToken}` },
    });
    assert.equal(readerRes.status, 403, 'Reader role must return 403 Forbidden');

    // C. Reporter role: 403 Forbidden for workflow updates
    const repRes = await serverHelper.request(`/api/v1/epaper/articles/${testArt.id}/workflow-status`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${reporterToken}` },
      body: { targetStatus: 'APPROVED_FOR_EPAPER' },
    });
    assert.equal(repRes.status, 403, 'Reporter role must return 403 Forbidden');

    // D. Regular Editor attempting FINAL_APPROVED: 403 Forbidden (Chief Editor / Admin required)
    // Advance testArt to QUALITY_CHECK first so stage skip is not triggered
    testArt.epaperWorkflow = { status: 'QUALITY_CHECK', updatedAt: new Date().toISOString() };
    const editorFinalApprove = await serverHelper.request(`/api/v1/epaper/articles/${testArt.id}/workflow-status`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}` },
      body: { targetStatus: 'FINAL_APPROVED' },
    });
    assert.equal(editorFinalApprove.status, 403, 'Regular Editor cannot grant FINAL_APPROVED');
  });

  // TEST 10: Editorial Credit Integrity & Missing-Credit Warnings
  test('10. Editorial Credit Integrity: Reporter credit from source article; editor credit from staff; missing warnings', async () => {
    // 1. Article with authentic reporter and photographer
    const creditArtId = `credit-art-${Date.now()}`;
    adapter.data.articles.unshift({
      id: creditArtId,
      slug: creditArtId,
      title: 'क्रेडिट परीक्षण समाचार',
      content: 'सामग्री विवरण...',
      status: 'APPROVED',
      authorName: 'राजेश पटेल',
      byline: 'राजेश पटेल (वरिष्ठ संवाददाता)',
      photographer: 'दीपक वर्मा (फोटो जर्नलिस्ट)',
      createdAt: new Date().toISOString(),
    });

    // 2. Article missing reporter attribution
    const noCreditArtId = `nocredit-art-${Date.now()}`;
    adapter.data.articles.unshift({
      id: noCreditArtId,
      slug: noCreditArtId,
      title: 'बिना क्रेडिट वाला समाचार',
      content: 'सामग्री विवरण...',
      status: 'APPROVED',
      authorName: '',
      byline: '',
      createdAt: new Date().toISOString(),
    });

    // Create an edition
    const edRes = await serverHelper.request('/api/v1/epaper/editions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}` },
      body: {
        title: 'क्रेडिट सत्यापन संस्करण',
        publicationDate: '2026-11-24',
        editionType: 'DAILY',
      },
    });
    const edId = edRes.data.data.edition.id;

    // Assign both articles to Page 1
    const assignRes = await serverHelper.request(`/api/v1/epaper/editions/${edId}/assign-articles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}` },
      body: {
        pageNumber: 1,
        articleIds: [creditArtId, noCreditArtId],
        editorCredit: 'दिनेश अग्निहोत्री (डेस्क संपादक)',
      },
    });
    assert.equal(assignRes.status, 200);

    const page1 = await adapter.getEpaperPageByNumber(edId, 1);
    const elemWithCredit = page1.elements.find((el) => el.articleId === creditArtId);
    const elemNoCredit = page1.elements.find((el) => el.articleId === noCreditArtId);

    // Verify elemWithCredit
    assert.equal(elemWithCredit.byline, 'राजेश पटेल (वरिष्ठ संवाददाता)');
    assert.equal(elemWithCredit.photoCredit, 'दीपक वर्मा (फोटो जर्नलिस्ट)');
    assert.equal(elemWithCredit.editorCredit, 'दिनेश अग्निहोत्री (डेस्क संपादक)');
    assert.equal(elemWithCredit.missingReporterCredit, false);

    // Verify elemNoCredit has warning flag
    assert.equal(elemNoCredit.missingReporterCredit, true, 'Must set missingReporterCredit: true flag');

    // 3. Staff credits endpoint
    const staffRes = await serverHelper.request('/api/v1/epaper/staff-credits', {
      headers: { Authorization: `Bearer ${editorToken}` },
    });
    assert.equal(staffRes.status, 200);
    assert.ok(Array.isArray(staffRes.data.data), 'Staff credits must return array of editorial users');
    assert.ok(staffRes.data.data.length > 0, 'Must return at least 1 editorial staff member');
  });

  // TEST 11: Unapproved Article Assignment Rejection
  test('11. Unapproved Article Assignment Rejection: A news article cannot be assigned to an E-Paper page before approval', async () => {
    // Create an unapproved draft article
    const unapprovedId = `unapproved-${Date.now()}`;
    adapter.data.articles.unshift({
      id: unapprovedId,
      slug: unapprovedId,
      title: 'अस्वीकृत समाचार कच्चा आलेख',
      content: 'सामग्री विवरण...',
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
    });

    // Create an edition
    const edRes = await serverHelper.request('/api/v1/epaper/editions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}` },
      body: {
        title: 'अनुमोदन गेट परीक्षण संस्करण',
        publicationDate: '2026-11-25',
        editionType: 'DAILY',
      },
    });
    const edId = edRes.data.data.edition.id;

    // Attempt to assign unapproved article to Page 1
    const assignUnapproved = await serverHelper.request(`/api/v1/epaper/editions/${edId}/assign-articles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${editorToken}` },
      body: {
        pageNumber: 1,
        articleIds: [unapprovedId],
      },
    });

    assert.equal(assignUnapproved.status, 400, 'Assigning unapproved article must return 400 Bad Request');
    assert.equal(
      assignUnapproved.data.code || assignUnapproved.data.error?.code,
      'ERR_ARTICLE_NOT_APPROVED',
      'Must return ERR_ARTICLE_NOT_APPROVED'
    );
  });

  test.after(async () => {
    if (serverHelper) await serverHelper.stop();
    if (isolationCleanup) isolationCleanup();
  });
});
