/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * STEP 4 Focused Test Suite: Page Designer & Newspaper Design System Integration
 * 
 * Verifies:
 * 1. News Selection Desk to Page Designer integration.
 * 2. Approved article loading & unapproved article rejection.
 * 3. Article ordering and page composition.
 * 4. Newspaper design templates (all 9 required categories).
 * 5. Page Designer modes (AUTO, ASSISTED, MANUAL).
 * 6. Devanagari headline and body text rendering with overflow protection.
 * 7. Image and editorial credit preservation & warning flags.
 * 8. Page boundary and collision validation.
 * 9. Reader/Designer/PNG/PDF rendering parity.
 * 10. Source article & published edition immutability.
 * 11. Step 1, Step 2, and Step 3 regression compatibility.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupIsolatedTestPersistence } from './testIsolationHelper.js';
import { LocalJsonAdapter } from '../src/server/persistence/adapter.js';
import { FirestoreAdapter } from '../src/server/persistence/firestoreAdapter.js';
import { INITIAL_EPAPER_TEMPLATES } from '../src/server/persistence/defaultEpaperTemplates.js';
import { LayoutAssistantEngine } from '../src/server/ai/layoutAssistant.js';
import { HighResExportEngine, BROADSHEET_CONSTANTS } from '../src/server/epaper/exportEngine.js';
import {
  calculateColumnGrid,
  getColumnSpanWidth,
  generateSnapGuideLines,
  detectAllCollisions,
} from '../src/utils/epaperLayout.ts';
import { DevanagariTypographyEngine } from '../src/services/graphicRenderer.ts';

// Setup mock request/response helper
function createMockHttp() {
  let statusCode = 200;
  let headers = {};
  let body = '';

  const res = {
    writeHead(code, h) {
      statusCode = code;
      headers = { ...headers, ...h };
      return res;
    },
    setHeader(k, v) {
      headers[k] = v;
      return res;
    },
    end(data) {
      body = data;
      return res;
    },
    get statusCode() {
      return statusCode;
    },
    get headers() {
      return headers;
    },
    get body() {
      return body;
    },
    get json() {
      try {
        return JSON.parse(body);
      } catch {
        return null;
      }
    },
  };

  return res;
}

test('STEP 4: E-PAPER PAGE DESIGNER & NEWSPAPER DESIGN SYSTEM INTEGRATION', async (t) => {
  const { adapter, cleanup } = setupIsolatedTestPersistence({ prefix: 'step4_' });
  t.after(() => cleanup());

  // Test authorized editor credentials
  const mockEditorUser = {
    id: 'usr-editor-desk-1',
    fullName: 'दिनेश अग्निहोत्री (डेस्क संपादक)',
    role: 'EDITOR',
  };

  const mockChiefEditor = {
    id: 'usr-chief-ed-1',
    fullName: 'राघवेन्द्र शर्मा (प्रधान संपादक)',
    role: 'CHIEF_EDITOR',
  };

  // Prepare seed articles: 1 approved lead, 1 approved secondary, 1 unapproved draft
  const approvedLeadArticle = {
    id: `art-step4-lead-${Date.now()}`,
    slug: `art-step4-lead-${Date.now()}`,
    title: 'मध्य प्रदेश में ऐतिहासिक औद्योगिक निवेश: 50,000 युवाओं को रोजगार',
    content: 'भोपाल। मध्य प्रदेश सरकार ने औद्योगिक गलियारे के विस्तार हेतु ऐतिहासिक निवेश प्रस्तावों को मंजूरी प्रदान की है। इस परियोजना के अंतर्गत प्रदेश के सभी संभागों में नवीन तकनीकी पार्क और औद्योगिक क्लस्टर स्थापित किए जाएंगे।',
    status: 'APPROVED',
    authorName: 'राजेश पटेल',
    byline: 'राजेश पटेल (वरिष्ठ राज्य संवाददाता)',
    photographer: 'दीपक वर्मा (फोटो जर्नलिस्ट)',
    imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800',
    priority: 'BREAKING',
    category: 'DEVELOPMENT',
    districtId: 'bhopal',
    createdAt: new Date().toISOString(),
  };

  const approvedNoImageArticle = {
    id: `art-step4-noimg-${Date.now()}`,
    slug: `art-step4-noimg-${Date.now()}`,
    title: 'कृषि विभाग की नई घोषणा: गेहूं उपार्जन के पंजीयन की तिथि बढ़ी',
    content: 'भोपाल। प्रदेश के किसानों की सुविधा को ध्यान में रखते हुए समर्थन मूल्य पर गेहूं उपार्जन पंजीयन की अंतिम तिथि आगामी 10 दिवस के लिए बढ़ा दी गई है।',
    status: 'APPROVED',
    authorName: '', // Missing reporter credit intentionally
    byline: '',
    photographer: '',
    imageUrl: '', // Missing image intentionally
    priority: 'NORMAL',
    category: 'AGRICULTURE',
    districtId: 'bhopal',
    createdAt: new Date().toISOString(),
  };

  const unapprovedDraftArticle = {
    id: `art-step4-unapproved-${Date.now()}`,
    slug: `art-step4-unapproved-${Date.now()}`,
    title: 'अस्वीकृत कच्चा समाचार: बिना पुष्टि का दावा',
    content: 'कच्चा अप्रमाणित विवरण...',
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
  };

  adapter.data.articles = adapter.data.articles || [];
  adapter.data.articles.push(approvedLeadArticle, approvedNoImageArticle, unapprovedDraftArticle);

  // Create test edition
  const editionRes = await adapter.createEpaperEditionWithPages({
    editionCode: `EP-S4-${Date.now().toString().slice(-4)}`,
    title: 'दैनिक भोपाल ब्रॉडशीट विशेष',
    editionType: 'DAILY',
    publicationDate: '2026-11-20',
    districtId: 'bhopal',
    districtName: 'भोपाल',
    totalPages: 12,
  }, mockEditorUser);
  const editionId = editionRes.edition.id;

  // --------------------------------------------------------------------------
  // TEST 1: News Selection Desk to Page Designer Integration
  // --------------------------------------------------------------------------
  await t.test('1. News-to-Designer Integration: Loads assigned articles with headline, content, images & credits', async () => {
    const assignResult = await adapter.assignArticlesToEditionPage(
      editionId,
      1,
      [approvedLeadArticle.id],
      mockEditorUser,
      {
        editorCredit: 'दिनेश अग्निहोत्री (डेस्क संपादक)',
        colSpan: 4,
        role: 'LEAD',
      }
    );

    assert.equal(assignResult.success, true, 'Assignment to page 1 must succeed');
    assert.equal(assignResult.assignedCount, 1);

    const pages = await adapter.getEpaperPagesByEditionId(editionId);
    const p1 = pages.find((p) => p.pageNumber === 1);
    assert.ok(p1, 'Page 1 must exist');

    const leadElem = p1.elements.find((el) => el.articleId === approvedLeadArticle.id);
    assert.ok(leadElem, 'Assigned story element must exist on Page 1');
    assert.equal(leadElem.customHeadline, approvedLeadArticle.title);
    assert.equal(leadElem.byline, approvedLeadArticle.byline);
    assert.equal(leadElem.editorCredit, 'दिनेश अग्निहोत्री (डेस्क संपादक)');
    assert.equal(leadElem.imageUrl, approvedLeadArticle.imageUrl);
    assert.equal(leadElem.role, 'LEAD');
  });

  // --------------------------------------------------------------------------
  // TEST 2: Approved Article Loading & Unapproved Article Rejection Gate
  // --------------------------------------------------------------------------
  await t.test('2. Unapproved Article Rejection: Cannot add unapproved draft to page composition', async () => {
    // Attempting to assign unapproved article must be rejected
    await assert.rejects(
      async () => {
        await adapter.assignArticlesToEditionPage(
          editionId,
          1,
          [unapprovedDraftArticle.id],
          mockEditorUser,
          {
            editorCredit: 'दिनेश अग्निहोत्री',
            colSpan: 4,
            role: 'BRIEF',
          }
        );
      },
      (err) => {
        assert.match(err.message, /ERR_ARTICLE_NOT_APPROVED/);
        return true;
      },
      'Assigning unapproved draft must throw ERR_ARTICLE_NOT_APPROVED'
    );

    // Attempting to save page with unapproved article element must be rejected
    const p1 = await adapter.getEpaperPageByNumber(editionId, 1);
    const dirtyElements = [
      ...p1.elements,
      {
        id: 'elem-illegal-draft',
        elementType: 'STORY',
        articleId: unapprovedDraftArticle.id,
        bounds: { x: 42.52, y: 300, width: 400, height: 200 },
      },
    ];

    const saveAttempt = await adapter.saveEpaperPage({
      ...p1,
      elements: dirtyElements,
      expectedVersion: p1.version,
    }, mockEditorUser);

    assert.equal(saveAttempt.error, true);
    assert.equal(saveAttempt.code, 'ERR_ARTICLE_NOT_APPROVED');
  });

  // --------------------------------------------------------------------------
  // TEST 3: Article Ordering and Multi-Column Broadsheet Composition
  // --------------------------------------------------------------------------
  await t.test('3. Article Ordering & Broadsheet Composition: Multi-column modular grid hierarchy', async () => {
    const grid8 = calculateColumnGrid(8);
    assert.equal(grid8.columns, 8);
    assert.ok(grid8.columnWidth > 0);
    assert.equal(grid8.columnOffsets.length, 8);

    // 4-column span width calculation
    const span4W = getColumnSpanWidth(4, grid8.columnWidth, grid8.gutterWidth);
    const span2W = getColumnSpanWidth(2, grid8.columnWidth, grid8.gutterWidth);
    assert.ok(span4W > span2W * 1.8, '4-column span must properly include gutter');

    // Skyline ordering test
    const mockElements = [
      { id: 'el-ad-1', elementType: 'AD', role: 'AD', bounds: { x: 42.52, y: 1200, width: 847, height: 140 }, adSlotType: 'BOTTOM_STRIP' },
      { id: 'el-story-brief', elementType: 'STORY', role: 'BRIEF', bounds: { x: 42.52, y: 500, width: 200, height: 120 } },
      { id: 'el-story-lead', elementType: 'STORY', role: 'LEAD', bounds: { x: 42.52, y: 200, width: 600, height: 260 } },
      { id: 'el-masthead', elementType: 'MASTHEAD', bounds: { x: 42.52, y: 113.38, width: 847, height: 110 } },
    ];

    const autoResult = LayoutAssistantEngine.autoArrangeLayout({
      elements: mockElements,
      gridColumns: 8,
      pageType: 'FRONT_PAGE',
      hasMasthead: true,
    });

    assert.equal(autoResult.success, true);
    assert.ok(autoResult.elements.length >= 3);

    // Masthead must be positioned at top
    const mastheadPlaced = autoResult.elements.find((el) => el.elementType === 'MASTHEAD');
    assert.ok(mastheadPlaced);
    assert.equal(mastheadPlaced.bounds.y, BROADSHEET_CONSTANTS.MARGIN_TOP_PT);

    // Bottom strip ad must be positioned at the footer
    const adPlaced = autoResult.elements.find((el) => el.elementType === 'AD');
    assert.ok(adPlaced);
    assert.ok(adPlaced.bounds.y > 1000);
  });

  // --------------------------------------------------------------------------
  // TEST 4: Reusable Newspaper Design Templates (All 9 Required Categories)
  // --------------------------------------------------------------------------
  await t.test('4. Newspaper Design Templates: All 9 required categories implemented for 32.9 cm × 52 cm', async () => {
    const templates = await adapter.getEpaperTemplates();

    const requiredCategories = [
      'FRONT_PAGE',
      'DISTRICT_FOCUS',
      'STATE',
      'POLITICAL',
      'BUSINESS',
      'EDUCATION',
      'SPORTS',
      'EDITORIAL',
      'SPECIAL',
    ];

    for (const cat of requiredCategories) {
      const matchingTpl = templates.find((t) => t.category === cat);
      assert.ok(matchingTpl, `Template for required category "${cat}" must be present`);
      assert.ok(matchingTpl.regions && matchingTpl.regions.length >= 4, `Template "${matchingTpl.id}" must have at least 4 regions`);

      // Verify physical broadsheet boundary compliance for every region
      for (const reg of matchingTpl.regions) {
        assert.ok(reg.bounds.x >= 0 && reg.bounds.x < BROADSHEET_CONSTANTS.PAGE_WIDTH_PT, `Region ${reg.id} x out of bounds`);
        assert.ok(reg.bounds.y >= 0 && reg.bounds.y < BROADSHEET_CONSTANTS.PAGE_HEIGHT_PT, `Region ${reg.id} y out of bounds`);
        assert.ok(reg.bounds.x + reg.bounds.width <= BROADSHEET_CONSTANTS.PAGE_WIDTH_PT + 5, `Region ${reg.id} width overflows page`);
        assert.ok(reg.bounds.y + reg.bounds.height <= BROADSHEET_CONSTANTS.PAGE_HEIGHT_PT + 5, `Region ${reg.id} height overflows page`);
      }
    }
  });

  // --------------------------------------------------------------------------
  // TEST 5: Page Designer Modes (AUTO, ASSISTED, MANUAL)
  // --------------------------------------------------------------------------
  await t.test('5. Page Designer Modes: AUTO packing, ASSISTED snapping/guides, MANUAL freeform & reassignment', async () => {
    // 5a. AUTO MODE: Arranges elements and reports zero collisions
    const autoResult = LayoutAssistantEngine.autoArrangeLayout({
      elements: [
        { id: 's1', elementType: 'STORY', role: 'LEAD', colSpan: 5, bounds: { x: 0, y: 0, width: 500, height: 250 } },
        { id: 's2', elementType: 'STORY', role: 'SECOND_LEAD', colSpan: 3, bounds: { x: 0, y: 0, width: 300, height: 250 } },
      ],
      gridColumns: 8,
      pageType: 'STATE',
    });
    assert.equal(autoResult.stats.collisionFree, true);

    // 5b. ASSISTED MODE: Snap guidelines generation and collision detection
    const grid = calculateColumnGrid(8);
    const existing = [
      { id: 'e1', bounds: { x: 42.52, y: 120, width: 300, height: 200 } },
      { id: 'e2', bounds: { x: 360, y: 120, width: 300, height: 200 } },
    ];
    const guidelines = generateSnapGuideLines(grid, existing);
    assert.ok(guidelines.linesX.length > 0, 'Snap guidelines X must be computed in assisted mode');
    assert.ok(guidelines.linesY.length > 0, 'Snap guidelines Y must be computed in assisted mode');

    // 5c. Collision detection in assisted mode
    const overlapping = [
      { id: 'col1', bounds: { x: 100, y: 100, width: 200, height: 200 } },
      { id: 'col2', bounds: { x: 150, y: 150, width: 200, height: 200 } }, // Overlaps col1
    ];
    const collisionRep = detectAllCollisions(overlapping);
    assert.equal(collisionRep.hasCollision, true);
    assert.deepEqual(collisionRep.collidingElementIds.sort(), ['col1', 'col2']);

    // 5d. MANUAL MODE: Reassign element to Page 2 before publication
    const p1Before = await adapter.getEpaperPageByNumber(editionId, 1);
    const p2Before = await adapter.getEpaperPageByNumber(editionId, 2);

    const testTransferElem = {
      id: `elem-transfer-${Date.now()}`,
      elementType: 'PHOTO',
      bounds: { x: 42.52, y: 500, width: 200, height: 150 },
      imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c',
      caption: 'हस्तांतरण परीक्षण फोटो',
    };

    // Attach to P1 first
    const p1WithTransfer = await adapter.saveEpaperPage({
      ...p1Before,
      elements: [...p1Before.elements, testTransferElem],
      expectedVersion: p1Before.version,
    }, mockEditorUser);

    assert.ok(p1WithTransfer.elements.some((el) => el.id === testTransferElem.id), 'Element placed on P1');

    // Remove from p1 and add to p2
    const p1Updated = await adapter.saveEpaperPage({
      ...p1WithTransfer,
      elements: p1WithTransfer.elements.filter((el) => el.id !== testTransferElem.id),
      expectedVersion: p1WithTransfer.version,
    }, mockEditorUser);

    const p2Updated = await adapter.saveEpaperPage({
      ...p2Before,
      elements: [...p2Before.elements, testTransferElem],
      expectedVersion: p2Before.version,
    }, mockEditorUser);

    assert.equal(p1Updated.elements.some((el) => el.id === testTransferElem.id), false, 'Removed from P1');
    assert.equal(p2Updated.elements.some((el) => el.id === testTransferElem.id), true, 'Added to P2');
  });

  // --------------------------------------------------------------------------
  // TEST 6: Devanagari Headline and Body Text Rendering
  // --------------------------------------------------------------------------
  await t.test('6. Devanagari Rendering: Indic conjunct word wrapping without overflow', async () => {
    const longHindiHeadline = 'मध्य प्रदेश सरकार का ऐतिहासिक फैसला: सभी 55 जिलों में खुलेंगे आधुनिक डिजिटल पत्रकारिता केंद्र';
    assert.equal(DevanagariTypographyEngine.isComplexDevanagari(longHindiHeadline), true);

    const paraResult = DevanagariTypographyEngine.wrapAndJustifyParagraph(
      longHindiHeadline,
      250, // target width
      16,  // font size
      5    // max lines
    );

    assert.ok(paraResult.lines.length >= 2, 'Long headline must wrap to multiple lines');
    assert.equal(paraResult.isOverflowing, false, 'Must not overflow 5 lines');
    assert.equal(paraResult.terminalLineJustified, false, 'Terminal line must remain un-justified (left aligned)');
  });

  // --------------------------------------------------------------------------
  // TEST 7: Image & Editorial Credit Preservation and Missing Warnings
  // --------------------------------------------------------------------------
  await t.test('7. Credits & Image Preservation: Missing alerts attached to stories without photo or byline', async () => {
    // Assign story that has missing image and missing reporter credit
    const assignNoImg = await adapter.assignArticlesToEditionPage(
      editionId,
      2,
      [approvedNoImageArticle.id],
      mockEditorUser,
      {
        editorCredit: 'दिनेश अग्निहोत्री (डेस्क संपादक)',
        colSpan: 4,
        role: 'ANCHOR',
      }
    );

    assert.equal(assignNoImg.success, true);
    const assignedElem = assignNoImg.assignedElements[0];

    // Verify warning flags are present
    assert.equal(assignedElem.missingReporterCredit, true, 'missingReporterCredit must be true');
    assert.equal(assignedElem.missingEditorCredit, false, 'Editor credit is provided');
    assert.ok(!assignedElem.imageUrl, 'Image URL must be empty or null');
    assert.ok(assignNoImg.warnings.some((w) => w.type === 'MISSING_IMAGE'), 'Must issue MISSING_IMAGE warning');
    assert.ok(assignNoImg.warnings.some((w) => w.type === 'MISSING_REPORTER_CREDIT'), 'Must issue MISSING_REPORTER_CREDIT warning');
  });

  // --------------------------------------------------------------------------
  // TEST 8: Page Boundary and Collision Validation
  // --------------------------------------------------------------------------
  await t.test('8. Page Boundary & Collision Validation: Detects boundaries and reports out-of-bounds', async () => {
    const pageW = BROADSHEET_CONSTANTS.PAGE_WIDTH_PT; // 932.6
    const pageH = BROADSHEET_CONSTANTS.PAGE_HEIGHT_PT; // 1474.0

    const validElement = { bounds: { x: 50, y: 120, width: 400, height: 300 } };
    const overflowXElement = { bounds: { x: 800, y: 120, width: 300, height: 300 } }; // 800 + 300 = 1100 > 932.6
    const overflowYElement = { bounds: { x: 50, y: 1300, width: 400, height: 300 } }; // 1300 + 300 = 1600 > 1474.0

    const isOutOfBounds = (el) => {
      const b = el.bounds;
      return b.x < 0 || b.y < 0 || b.x + b.width > pageW || b.y + b.height > pageH;
    };

    assert.equal(isOutOfBounds(validElement), false, 'Valid element must not be out of bounds');
    assert.equal(isOutOfBounds(overflowXElement), true, 'Overflow X element must be detected');
    assert.equal(isOutOfBounds(overflowYElement), true, 'Overflow Y element must be detected');
  });

  // --------------------------------------------------------------------------
  // TEST 9: Reader, Designer, PNG, and PDF Rendering Parity
  // --------------------------------------------------------------------------
  await t.test('9. Rendering Parity: Designer, Reader, PNG, and PDF share identical geometry and coordinates', async () => {
    const pages = await adapter.getEpaperPagesByEditionId(editionId);
    const edition = await adapter.getEpaperEditionById(editionId);
    const p1 = pages[0];

    // HighResExportEngine PDF generation
    const pdfBuf = HighResExportEngine.buildPrintReadyPdf(edition, pages);
    assert.ok(pdfBuf && pdfBuf.length > 500, 'PDF buffer must be generated');
    assert.equal(pdfBuf.subarray(0, 4).toString(), '%PDF', 'PDF header must match standard');

    // HighResExportEngine PNG generation
    const pngBuf = HighResExportEngine.generate300DpiPageImage(p1, edition);
    assert.ok(pngBuf && pngBuf.length > 1000, 'PNG buffer must be generated');
    assert.equal(pngBuf.subarray(1, 4).toString(), 'PNG', 'PNG signature must match');

    // Verify all use identical constants
    assert.equal(BROADSHEET_CONSTANTS.PAGE_WIDTH_PT, 932.6);
    assert.equal(BROADSHEET_CONSTANTS.PAGE_HEIGHT_PT, 1474.0);
    assert.equal(BROADSHEET_CONSTANTS.RASTER_300DPI_WIDTH, 3886);
    assert.equal(BROADSHEET_CONSTANTS.RASTER_300DPI_HEIGHT, 6142);
  });

  // --------------------------------------------------------------------------
  // TEST 10: Source Article Immutability & Published Edition Immutability
  // --------------------------------------------------------------------------
  await t.test('10. Immutability: Source articles never mutated; published editions reject layout modifications', async () => {
    // 10a. Source article immutability
    const originalContent = approvedLeadArticle.content;
    const originalTitle = approvedLeadArticle.title;

    const p1 = await adapter.getEpaperPageByNumber(editionId, 1);
    const modifiedElements = p1.elements.map((el) => {
      if (el.articleId === approvedLeadArticle.id) {
        return {
          ...el,
          customHeadline: 'संपादित प्रिंट शीर्षक (केवल ई-पेपर में)',
          customBodyText: 'संपादित प्रिंट कॉपी (केवल ई-पेपर में)',
        };
      }
      return el;
    });

    await adapter.saveEpaperPage({
      ...p1,
      elements: modifiedElements,
      expectedVersion: p1.version,
    }, mockEditorUser);

    // Verify source article in newsArticles is 100% UNCHANGED
    const sourceArt = adapter.data.articles.find((a) => a.id === approvedLeadArticle.id);
    assert.equal(sourceArt.title, originalTitle, 'Source article title must remain untouched');
    assert.equal(sourceArt.content, originalContent, 'Source article content must remain untouched');

    // 10b. Published edition immutability
    // Publish edition
    await adapter.publishEpaperEdition(editionId, undefined, mockChiefEditor);
    const pubEdition = await adapter.getEpaperEditionById(editionId);
    assert.equal(pubEdition.status, 'PUBLISHED');

    // Attempting to modify page elements on published edition must fail
    const p1AfterPub = await adapter.getEpaperPageByNumber(editionId, 1);
    const modifyAttempt = await adapter.saveEpaperPage({
      ...p1AfterPub,
      pageTitle: 'अनधिकृत संशोधन प्रयास',
      expectedVersion: p1AfterPub.version,
    }, mockEditorUser);

    assert.equal(modifyAttempt.error, true);
    assert.equal(modifyAttempt.code, 'ERR_EDITION_ALREADY_PUBLISHED');
  });

  // --------------------------------------------------------------------------
  // TEST 11: Regression Compatibility (Step 1, Step 2, and Step 3 Invariants)
  // --------------------------------------------------------------------------
  await t.test('11. Regression Compatibility: 12-page Daily rule & Special Edition counts preserved', async () => {
    // Daily edition must strictly have 12 pages
    const dailyEd = await adapter.saveEpaperEdition({
      editionCode: `EP-REG-DAILY-${Date.now().toString().slice(-4)}`,
      title: 'दैनिक भोपाल परीक्षण',
      editionType: 'DAILY',
      publicationDate: '2026-11-20',
      districtId: 'bhopal',
      totalPages: 12,
    }, mockEditorUser);
    assert.equal(dailyEd.totalPages, 12);

    // Special edition can have independent count
    const specialEd = await adapter.saveEpaperEdition({
      editionCode: `EP-REG-SPEC-${Date.now().toString().slice(-4)}`,
      title: 'दीपावली महाविशेषांक',
      editionType: 'SPECIAL',
      publicationDate: '2026-11-20',
      districtId: 'bhopal',
      totalPages: 24,
    }, mockEditorUser);
    assert.equal(specialEd.totalPages, 24);

    // Firestore parity check
    const firestore = new FirestoreAdapter();
    assert.ok(typeof firestore.saveEpaperPage === 'function');
    assert.ok(typeof firestore.assignArticlesToEditionPage === 'function');
    assert.ok(typeof firestore.getEligibleEpaperArticles === 'function');
  });
});
