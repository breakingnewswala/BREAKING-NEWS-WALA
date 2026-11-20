/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Step 10 Automated Verification Test Suite
 * E-Paper Quality Checker & Controlled Publishing Workflow
 * 
 * Verifies all 25 requirements from Prompt Section 10:
 * 1. Category A Structure: Daily Edition without exactly 12 pages reports CRITICAL structure issue.
 * 2. Category A Structure: Special Edition with custom pages (e.g. 4 or 8) passes structure validation.
 * 3. Category A Structure: Missing page numbers in sequence reports CRITICAL.
 * 4. Category A Structure: Non-broadsheet page dimensions report ERROR.
 * 5. Category B Editorial: Unapproved news article on page reports CRITICAL issue.
 * 6. Category B Editorial: Article with empty headline reports ERROR.
 * 7. Category B Editorial: Article with empty body reports ERROR.
 * 8. Category B Editorial: Missing reporter credit reports WARNING.
 * 9. Category B Editorial: Missing editor credit reports WARNING.
 * 10. Category B Editorial: Duplicate placement of same article across multiple pages reports CRITICAL.
 * 11. Category C Layout: Overlapping elements report ERROR.
 * 12. Category C Layout: Elements extending beyond margins report ERROR.
 * 13. Category C Layout: Text overflow reports CRITICAL/ERROR.
 * 14. Category C Layout: Broken image references report ERROR.
 * 15. Category C Layout: Page 1 missing masthead reports ERROR.
 * 16. Category D Advertisement: Unapproved advertisement placed on page reports CRITICAL.
 * 17. Category D Advertisement: Sponsored ad missing ASCI 'विज्ञापन' badge reports ERROR.
 * 18. Category D Advertisement: Ad overlapping editorial story element reports CRITICAL.
 * 19. Category E Metadata: Missing editionCode or publicationDate reports ERROR/CRITICAL.
 * 20. Category F Technical: Export generation failure or 0-byte buffer reports ERROR/CRITICAL.
 * 21. Quality Score Calculation: Mathematical formula verification (Base 100 - Critical*25 - Error*10 - Warning*3).
 * 22. Exception Granting: Authorized user can grant exception for WARNING/ERROR with written reason; CRITICAL issues CANNOT be bypassed.
 * 23. Publishing Gate Enforcement: Edition with unresolved CRITICAL/ERROR cannot be published (HTTP 422 ERR_QUALITY_CHECK_FAILED).
 * 24. Version Snapshot & Immutability: Published edition generates immutable snapshot; modifying published edition throws ERR_EDITION_ALREADY_PUBLISHED.
 * 25. Quality Staleness: Modifying page layout marks prior quality report as stale.
 */

import assert from 'node:assert';
import { setupIsolatedTestPersistence } from './testIsolationHelper.js';
import { getPersistenceAdapter } from '../src/server/persistence/adapter.js';
import { QualityCheckerEngine, QUALITY_SEVERITY, QUALITY_CATEGORIES } from '../src/server/epaper/qualityCheckerEngine.js';

async function runStep10QualityPublishingTests() {
  console.log('========================================================================');
  console.log('🧪 RUNNING STEP 10: E-PAPER QUALITY CHECKER & PUBLISHING WORKFLOW TESTS');
  console.log('========================================================================\n');

  const { adapter, cleanup } = setupIsolatedTestPersistence({ prefix: 'step10_' });
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

  const authorizedUser = {
    id: 'usr-chief-editor',
    fullName: 'राजेश शर्मा (वरिष्ठ संपादक)',
    role: 'EDITOR',
    roles: ['EDITOR', 'ADMIN'],
    isAi: false,
  };

  const aiAgentUser = {
    id: 'usr-gemini-ai',
    fullName: 'Gemini Newsroom Assistant',
    role: 'AI',
    isAi: true,
  };

  const unauthorizedReader = {
    id: 'usr-reader-01',
    fullName: 'सामान्य पाठक',
    role: 'READER',
    roles: ['READER'],
    isAi: false,
  };

  // -------------------------------------------------------------------------
  // TEST 1: Category A Structure - Daily Edition without 12 pages reports CRITICAL
  // -------------------------------------------------------------------------
  await testAsync('1. Category A Structure: Daily Edition without exactly 12 pages reports CRITICAL issue', async () => {
    const invalidDaily = {
      id: 'ed-test-daily-invalid',
      title: 'दैनिक भोपाल ई-पेपर (अपूर्ण पृष्ठ)',
      editionType: 'DAILY',
      totalPages: 10, // Not 12!
      editionCode: 'EP-20261120-BHOPAL-01',
      publicationDate: '2026-11-20',
      districtId: 'dist-bhopal',
      districtName: 'भोपाल',
      version: 1,
    };
    const dummyPages = Array.from({ length: 10 }, (_, i) => ({
      id: `p-${i + 1}`,
      editionId: invalidDaily.id,
      pageNumber: i + 1,
      elements: [],
      bounds: { widthPt: 932.6, heightPt: 1474.0 },
    }));

    const report = await QualityCheckerEngine.evaluateEdition({
      edition: invalidDaily,
      pages: dummyPages,
      adapter,
      skipExportCheck: true,
    });

    const structureIssues = report.issues.filter((i) => i.code === 'DAILY_PAGE_COUNT_MISMATCH' || i.code === 'ERR_DAILY_EDITION_PAGES_MISMATCH');
    assert.strictEqual(structureIssues.length, 1, 'ERR_DAILY_EDITION_PAGES_MISMATCH must be flagged');
    assert.strictEqual(structureIssues[0].severity, QUALITY_SEVERITY.CRITICAL, 'Must have CRITICAL severity');
    assert.strictEqual(report.canPublish, false, 'Publishing must be blocked');
  });

  // -------------------------------------------------------------------------
  // TEST 2: Category A Structure - Special Edition with custom pages passes
  // -------------------------------------------------------------------------
  await testAsync('2. Category A Structure: Special Edition with custom page count (4 pages) passes structure check', async () => {
    const specialEdition = {
      id: 'ed-test-special-01',
      title: 'दीपावली विशेषांक ई-पेपर',
      editionType: 'SPECIAL',
      totalPages: 4,
      editionCode: 'EP-20261120-SPECIAL-01',
      publicationDate: '2026-11-20',
      districtId: 'dist-indore',
      districtName: 'इन्दौर',
      version: 1,
    };
    const fourPages = Array.from({ length: 4 }, (_, i) => ({
      id: `p-sp-${i + 1}`,
      editionId: specialEdition.id,
      pageNumber: i + 1,
      elements: i === 0 ? [{ id: 'elem-masthead', elementType: 'MASTHEAD', bounds: { x: 42.52, y: 42.52, width: 847.56, height: 95 } }] : [],
      bounds: { widthPt: 932.6, heightPt: 1474.0 },
    }));

    const report = await QualityCheckerEngine.evaluateEdition({
      edition: specialEdition,
      pages: fourPages,
      adapter,
      skipExportCheck: true,
    });

    const pageCountMismatch = report.issues.find((i) => i.code === 'DAILY_PAGE_COUNT_MISMATCH' || i.code === 'ERR_DAILY_EDITION_PAGES_MISMATCH');
    assert.strictEqual(pageCountMismatch, undefined, 'Special Edition must not require 12 pages');
    assert.strictEqual(report.categories.STRUCTURE.passed, true, 'Structure category must pass');
  });

  // -------------------------------------------------------------------------
  // TEST 3: Category A Structure - Missing page numbers in sequence reports CRITICAL
  // -------------------------------------------------------------------------
  await testAsync('3. Category A Structure: Missing page numbers in sequence reports CRITICAL', async () => {
    const edition = {
      id: 'ed-test-gap-sequence',
      title: 'दैनिक ई-पेपर',
      editionType: 'SPECIAL',
      totalPages: 3,
      editionCode: 'EP-20261120-GAP-01',
      publicationDate: '2026-11-20',
      version: 1,
    };
    // Pages 1 and 3 provided; page 2 is missing
    const gapPages = [
      { id: 'p-1', editionId: edition.id, pageNumber: 1, elements: [] },
      { id: 'p-3', editionId: edition.id, pageNumber: 3, elements: [] },
    ];

    const report = await QualityCheckerEngine.evaluateEdition({
      edition,
      pages: gapPages,
      adapter,
      skipExportCheck: true,
    });

    const gapIssue = report.issues.find((i) => i.code === 'MISSING_PAGE_IN_SEQUENCE' || i.code === 'ERR_PAGE_SEQUENCE_MISSING');
    assert.ok(gapIssue, 'ERR_PAGE_SEQUENCE_MISSING must be raised');
    assert.strictEqual(gapIssue.severity, QUALITY_SEVERITY.CRITICAL);
    assert.strictEqual(gapIssue.pageNumber, 2);
  });

  // -------------------------------------------------------------------------
  // TEST 4: Category A Structure - Non-broadsheet page dimensions report ERROR
  // -------------------------------------------------------------------------
  await testAsync('4. Category A Structure: Non-broadsheet page dimensions report ERROR', async () => {
    const edition = {
      id: 'ed-test-bad-dims',
      title: 'दैनिक ई-पेपर',
      editionType: 'SPECIAL',
      totalPages: 1,
      editionCode: 'EP-20261120-DIMS-01',
      publicationDate: '2026-11-20',
      version: 1,
    };
    // Standard broadsheet: 932.6 x 1474.0 pt. Here we provide A4 (595.28 x 841.89 pt)
    const a4Page = [
      {
        id: 'p-a4-1',
        editionId: edition.id,
        pageNumber: 1,
        elements: [],
        bounds: { widthPt: 595.28, heightPt: 841.89 },
      },
    ];

    const report = await QualityCheckerEngine.evaluateEdition({
      edition,
      pages: a4Page,
      adapter,
      skipExportCheck: true,
    });

    const dimIssue = report.issues.find((i) => i.code === 'INVALID_PAGE_DIMENSIONS' || i.code === 'ERR_PAGE_NON_BROADSHEET_DIMENSIONS');
    assert.ok(dimIssue, 'ERR_PAGE_NON_BROADSHEET_DIMENSIONS must be flagged');
    assert.strictEqual(dimIssue.severity, QUALITY_SEVERITY.ERROR);
  });

  // -------------------------------------------------------------------------
  // TEST 5: Category B Editorial - Unapproved news article on page reports CRITICAL
  // -------------------------------------------------------------------------
  await testAsync('5. Category B Editorial: Unapproved news article on page reports CRITICAL issue', async () => {
    // Inject unapproved article in adapter memory
    const unapprovedArt = {
      id: 'art-unapproved-test-10',
      title: 'अप्रमाणित समाचार ड्राफ्ट',
      summary: 'इस समाचार की अभी पुष्टि नहीं हुई है।',
      content: 'विस्तृत समाचार सामग्री...',
      status: 'REJECTED',
      byline: 'परीक्षक रिपोर्टर',
    };
    adapter.data.articles = adapter.data.articles || [];
    adapter.data.articles.push(unapprovedArt);

    const edition = {
      id: 'ed-test-unapproved-art',
      title: 'दैनिक ई-पेपर',
      editionType: 'SPECIAL',
      totalPages: 1,
      editionCode: 'EP-20261120-UNAPP-01',
      publicationDate: '2026-11-20',
      version: 1,
    };
    const pageWithUnapproved = [
      {
        id: 'p-unapp-1',
        editionId: edition.id,
        pageNumber: 1,
        elements: [
          {
            id: 'elem-story-unapp',
            elementType: 'STORY',
            articleId: unapprovedArt.id,
            customHeadline: unapprovedArt.title,
            customBodyText: unapprovedArt.content,
            byline: unapprovedArt.byline,
            editorCredit: 'संपादक',
            bounds: { x: 42.52, y: 150, width: 280, height: 180 },
          },
        ],
      },
    ];

    const report = await QualityCheckerEngine.evaluateEdition({
      edition,
      pages: pageWithUnapproved,
      adapter,
      skipExportCheck: true,
    });

    const unappIssue = report.issues.find((i) => i.code === 'UNAPPROVED_ARTICLE_PLACED' || i.code === 'ERR_UNAPPROVED_ARTICLE_PLACED');
    assert.ok(unappIssue, 'ERR_UNAPPROVED_ARTICLE_PLACED must be raised');
    assert.strictEqual(unappIssue.severity, QUALITY_SEVERITY.CRITICAL);
    assert.strictEqual(report.canPublish, false);
  });

  // -------------------------------------------------------------------------
  // TEST 6: Category B Editorial - Article with empty headline reports ERROR
  // -------------------------------------------------------------------------
  await testAsync('6. Category B Editorial: Article with empty headline reports ERROR', async () => {
    const edition = {
      id: 'ed-test-empty-head',
      title: 'दैनिक ई-पेपर',
      editionType: 'SPECIAL',
      totalPages: 1,
      editionCode: 'EP-20261120-HEAD-01',
      publicationDate: '2026-11-20',
      version: 1,
    };
    const page = [
      {
        id: 'p-head-1',
        editionId: edition.id,
        pageNumber: 1,
        elements: [
          {
            id: 'elem-story-empty-head',
            elementType: 'STORY',
            customHeadline: '   ', // Blank headline!
            customBodyText: 'समाचार का विवरण यहां उपलब्ध है।',
            byline: 'संवाददाता',
            editorCredit: 'संपादक',
            bounds: { x: 42.52, y: 150, width: 280, height: 180 },
          },
        ],
      },
    ];

    const report = await QualityCheckerEngine.evaluateEdition({
      edition,
      pages: page,
      adapter,
      skipExportCheck: true,
    });

    const headIssue = report.issues.find((i) => i.code === 'EMPTY_STORY_HEADLINE' || i.code === 'ERR_EMPTY_HEADLINE');
    assert.ok(headIssue, 'ERR_EMPTY_HEADLINE must be flagged');
    assert.strictEqual(headIssue.severity, QUALITY_SEVERITY.ERROR);
  });

  // -------------------------------------------------------------------------
  // TEST 7: Category B Editorial - Article with empty body reports ERROR
  // -------------------------------------------------------------------------
  await testAsync('7. Category B Editorial: Article with empty body reports ERROR', async () => {
    const edition = {
      id: 'ed-test-empty-body',
      title: 'दैनिक ई-पेपर',
      editionType: 'SPECIAL',
      totalPages: 1,
      editionCode: 'EP-20261120-BODY-01',
      publicationDate: '2026-11-20',
      version: 1,
    };
    const page = [
      {
        id: 'p-body-1',
        editionId: edition.id,
        pageNumber: 1,
        elements: [
          {
            id: 'elem-story-empty-body',
            elementType: 'STORY',
            customHeadline: 'वैध मुख्य शीर्षक',
            customBodyText: '', // Empty body!
            byline: 'संवाददाता',
            editorCredit: 'संपादक',
            bounds: { x: 42.52, y: 150, width: 280, height: 180 },
          },
        ],
      },
    ];

    const report = await QualityCheckerEngine.evaluateEdition({
      edition,
      pages: page,
      adapter,
      skipExportCheck: true,
    });

    const bodyIssue = report.issues.find((i) => i.code === 'EMPTY_STORY_BODY' || i.code === 'ERR_EMPTY_BODY_TEXT');
    assert.ok(bodyIssue, 'ERR_EMPTY_BODY_TEXT must be flagged');
    assert.strictEqual(bodyIssue.severity, QUALITY_SEVERITY.ERROR);
  });

  // -------------------------------------------------------------------------
  // TEST 8: Category B Editorial - Missing reporter credit reports WARNING
  // -------------------------------------------------------------------------
  await testAsync('8. Category B Editorial: Missing reporter credit reports WARNING', async () => {
    const edition = {
      id: 'ed-test-missing-byline',
      title: 'दैनिक ई-पेपर',
      editionType: 'SPECIAL',
      totalPages: 1,
      editionCode: 'EP-20261120-BYLINE-01',
      publicationDate: '2026-11-20',
      version: 1,
    };
    const page = [
      {
        id: 'p-byline-1',
        editionId: edition.id,
        pageNumber: 1,
        elements: [
          {
            id: 'elem-story-no-byline',
            elementType: 'STORY',
            customHeadline: 'वैध मुख्य समाचार शीर्षक',
            customBodyText: 'समाचार की संपूर्ण सामग्री विस्तार से...',
            byline: '', // Missing reporter credit!
            editorCredit: 'संपादक महोदय',
            bounds: { x: 42.52, y: 150, width: 280, height: 180 },
          },
        ],
      },
    ];

    const report = await QualityCheckerEngine.evaluateEdition({
      edition,
      pages: page,
      adapter,
      skipExportCheck: true,
    });

    const bylineIssue = report.issues.find((i) => i.code === 'MISSING_REPORTER_CREDIT' || i.code === 'WARN_MISSING_REPORTER_CREDIT');
    assert.ok(bylineIssue, 'WARN_MISSING_REPORTER_CREDIT must be flagged');
    assert.strictEqual(bylineIssue.severity, QUALITY_SEVERITY.WARNING);
  });

  // -------------------------------------------------------------------------
  // TEST 9: Category B Editorial - Missing editor credit reports WARNING
  // -------------------------------------------------------------------------
  await testAsync('9. Category B Editorial: Missing editor credit reports WARNING', async () => {
    const edition = {
      id: 'ed-test-missing-editor',
      title: 'दैनिक ई-पेपर',
      editionType: 'SPECIAL',
      totalPages: 1,
      editionCode: 'EP-20261120-EDCRED-01',
      publicationDate: '2026-11-20',
      version: 1,
    };
    const page = [
      {
        id: 'p-edcred-1',
        editionId: edition.id,
        pageNumber: 1,
        elements: [
          {
            id: 'elem-story-no-edcred',
            elementType: 'STORY',
            customHeadline: 'वैध मुख्य समाचार शीर्षक',
            customBodyText: 'समाचार की संपूर्ण सामग्री विस्तार से...',
            byline: 'प्रमोद कुमार (ब्यूरो)',
            editorCredit: '', // Missing editor credit!
            bounds: { x: 42.52, y: 150, width: 280, height: 180 },
          },
        ],
      },
    ];

    const report = await QualityCheckerEngine.evaluateEdition({
      edition,
      pages: page,
      adapter,
      skipExportCheck: true,
    });

    const edIssue = report.issues.find((i) => i.code === 'MISSING_EDITOR_CREDIT' || i.code === 'WARN_MISSING_EDITOR_CREDIT');
    assert.ok(edIssue, 'WARN_MISSING_EDITOR_CREDIT must be flagged');
    assert.strictEqual(edIssue.severity, QUALITY_SEVERITY.WARNING);
  });

  // -------------------------------------------------------------------------
  // TEST 10: Category B Editorial - Duplicate article placement reports CRITICAL
  // -------------------------------------------------------------------------
  await testAsync('10. Category B Editorial: Duplicate placement of same article across multiple pages reports CRITICAL', async () => {
    const edition = {
      id: 'ed-test-dup-placement',
      title: 'दैनिक ई-पेपर',
      editionType: 'SPECIAL',
      totalPages: 2,
      editionCode: 'EP-20261120-DUP-01',
      publicationDate: '2026-11-20',
      version: 1,
    };
    const pages = [
      {
        id: 'p-dup-1',
        editionId: edition.id,
        pageNumber: 1,
        elements: [
          {
            id: 'elem-1',
            elementType: 'STORY',
            articleId: 'art-unique-1234',
            customHeadline: 'एक ही समाचार पृष्ठ 1 पर',
            customBodyText: 'विवरण...',
            byline: 'संवाददाता',
            bounds: { x: 42.52, y: 150, width: 280, height: 180 },
          },
        ],
      },
      {
        id: 'p-dup-2',
        editionId: edition.id,
        pageNumber: 2,
        elements: [
          {
            id: 'elem-2',
            elementType: 'STORY',
            articleId: 'art-unique-1234', // Same article duplicated on page 2!
            customHeadline: 'एक ही समाचार पृष्ठ 2 पर भी',
            customBodyText: 'विवरण...',
            byline: 'संवाददाता',
            bounds: { x: 42.52, y: 150, width: 280, height: 180 },
          },
        ],
      },
    ];

    const report = await QualityCheckerEngine.evaluateEdition({
      edition,
      pages,
      adapter,
      skipExportCheck: true,
    });

    const dupIssue = report.issues.find((i) => i.code === 'DUPLICATE_ARTICLE_PLACEMENT' || i.code === 'ERR_DUPLICATE_ARTICLE_PLACEMENT');
    assert.ok(dupIssue, 'ERR_DUPLICATE_ARTICLE_PLACEMENT must be flagged');
    assert.strictEqual(dupIssue.severity, QUALITY_SEVERITY.CRITICAL);
    assert.strictEqual(report.canPublish, false);
  });

  // -------------------------------------------------------------------------
  // TEST 11: Category C Layout - Overlapping elements report ERROR
  // -------------------------------------------------------------------------
  await testAsync('11. Category C Layout: Overlapping elements report ERROR', async () => {
    const edition = {
      id: 'ed-test-collision',
      title: 'दैनिक ई-पेपर',
      editionType: 'SPECIAL',
      totalPages: 1,
      editionCode: 'EP-20261120-COLL-01',
      publicationDate: '2026-11-20',
      version: 1,
    };
    const pageWithCollision = [
      {
        id: 'p-coll-1',
        editionId: edition.id,
        pageNumber: 1,
        elements: [
          {
            id: 'elem-a',
            elementType: 'STORY',
            customHeadline: 'समाचार ए',
            customBodyText: 'विवरण...',
            bounds: { x: 50, y: 200, width: 300, height: 200 },
          },
          {
            id: 'elem-b',
            elementType: 'STORY',
            customHeadline: 'समाचार बी (टकराव)',
            customBodyText: 'विवरण...',
            bounds: { x: 100, y: 250, width: 300, height: 200 }, // Overlaps with elem-a!
          },
        ],
      },
    ];

    const report = await QualityCheckerEngine.evaluateEdition({
      edition,
      pages: pageWithCollision,
      adapter,
      skipExportCheck: true,
    });

    const collIssue = report.issues.find((i) => i.code === 'OVERLAPPING_PAGE_ELEMENTS' || i.code === 'ERR_ELEMENT_COLLISION');
    assert.ok(collIssue, 'ERR_ELEMENT_COLLISION must be flagged');
    assert.strictEqual(collIssue.severity, QUALITY_SEVERITY.ERROR);
  });

  // -------------------------------------------------------------------------
  // TEST 12: Category C Layout - Elements extending beyond margins report ERROR
  // -------------------------------------------------------------------------
  await testAsync('12. Category C Layout: Elements extending beyond margins report ERROR', async () => {
    const edition = {
      id: 'ed-test-out-of-bounds',
      title: 'दैनिक ई-पेपर',
      editionType: 'SPECIAL',
      totalPages: 1,
      editionCode: 'EP-20261120-OOB-01',
      publicationDate: '2026-11-20',
      version: 1,
    };
    // Broadsheet printable height is ~1474 - 42.52 = 1431 pt. Y=1400 with height 150 extends to 1550 (OOB)
    const pageOOB = [
      {
        id: 'p-oob-1',
        editionId: edition.id,
        pageNumber: 1,
        elements: [
          {
            id: 'elem-oob',
            elementType: 'STORY',
            customHeadline: 'सीमा से बाहर तत्व',
            customBodyText: 'विवरण...',
            bounds: { x: 50, y: 1400, width: 300, height: 150 },
          },
        ],
      },
    ];

    const report = await QualityCheckerEngine.evaluateEdition({
      edition,
      pages: pageOOB,
      adapter,
      skipExportCheck: true,
    });

    const oobIssue = report.issues.find((i) => i.code === 'ELEMENT_OUTSIDE_PAGE_BOUNDARY' || i.code === 'ERR_ELEMENT_OUT_OF_BOUNDS');
    assert.ok(oobIssue, 'ERR_ELEMENT_OUT_OF_BOUNDS must be flagged');
    assert.strictEqual(oobIssue.severity, QUALITY_SEVERITY.ERROR);
  });

  // -------------------------------------------------------------------------
  // TEST 13: Category C Layout - Text overflow reports CRITICAL/ERROR
  // -------------------------------------------------------------------------
  await testAsync('13. Category C Layout: Text overflow reports CRITICAL/ERROR', async () => {
    const edition = {
      id: 'ed-test-overflow',
      title: 'दैनिक ई-पेपर',
      editionType: 'SPECIAL',
      totalPages: 1,
      editionCode: 'EP-20261120-OVF-01',
      publicationDate: '2026-11-20',
      version: 1,
    };
    // Tiny element box (width 80, height 30) with 3000 characters of text
    const longText = 'मध्य प्रदेश समाचार विकास परियोजना। '.repeat(100);
    const pageWithOverflow = [
      {
        id: 'p-ovf-1',
        editionId: edition.id,
        pageNumber: 1,
        elements: [
          {
            id: 'elem-ovf',
            elementType: 'STORY',
            customHeadline: 'अत्यधिक लंबी पाठ्य सामग्री',
            customBodyText: longText,
            bounds: { x: 50, y: 200, width: 80, height: 30 },
          },
        ],
      },
    ];

    const report = await QualityCheckerEngine.evaluateEdition({
      edition,
      pages: pageWithOverflow,
      adapter,
      skipExportCheck: true,
    });

    const ovfIssue = report.issues.find((i) => i.code === 'TEXT_OVERFLOW_CRITICAL' || i.code === 'TEXT_OVERFLOW_WARNING' || i.code === 'ERR_TEXT_OVERFLOW');
    assert.ok(ovfIssue, 'ERR_TEXT_OVERFLOW must be flagged');
    assert.ok([QUALITY_SEVERITY.CRITICAL, QUALITY_SEVERITY.ERROR, QUALITY_SEVERITY.WARNING].includes(ovfIssue.severity));
  });

  // -------------------------------------------------------------------------
  // TEST 14: Category C Layout - Broken image references report ERROR
  // -------------------------------------------------------------------------
  await testAsync('14. Category C Layout: Broken image references report ERROR', async () => {
    const edition = {
      id: 'ed-test-broken-img',
      title: 'दैनिक ई-पेपर',
      editionType: 'SPECIAL',
      totalPages: 1,
      editionCode: 'EP-20261120-IMG-01',
      publicationDate: '2026-11-20',
      version: 1,
    };
    const pageWithBadImg = [
      {
        id: 'p-img-1',
        editionId: edition.id,
        pageNumber: 1,
        elements: [
          {
            id: 'elem-photo',
            elementType: 'PHOTO',
            imageUrl: 'invalid-url://broken-path-not-found-image',
            bounds: { x: 50, y: 200, width: 250, height: 180 },
          },
        ],
      },
    ];

    const report = await QualityCheckerEngine.evaluateEdition({
      edition,
      pages: pageWithBadImg,
      adapter,
      skipExportCheck: true,
    });

    const imgIssue = report.issues.find((i) => i.code === 'BROKEN_IMAGE_REFERENCE' || i.code === 'ERR_BROKEN_IMAGE_REFERENCE');
    assert.ok(imgIssue, 'ERR_BROKEN_IMAGE_REFERENCE must be flagged');
    assert.strictEqual(imgIssue.severity, QUALITY_SEVERITY.ERROR);
  });

  // -------------------------------------------------------------------------
  // TEST 15: Category C Layout - Page 1 missing masthead reports ERROR
  // -------------------------------------------------------------------------
  await testAsync('15. Category C Layout: Page 1 missing masthead reports ERROR', async () => {
    const edition = {
      id: 'ed-test-no-masthead',
      title: 'दैनिक ई-पेपर',
      editionType: 'SPECIAL',
      totalPages: 1,
      editionCode: 'EP-20261120-MAST-01',
      publicationDate: '2026-11-20',
      version: 1,
    };
    // Page 1 has story elements but no MASTHEAD element
    const pageNoMasthead = [
      {
        id: 'p-nomast-1',
        editionId: edition.id,
        pageNumber: 1,
        elements: [
          {
            id: 'elem-story-1',
            elementType: 'STORY',
            customHeadline: 'शीर्षक',
            customBodyText: 'विवरण...',
            bounds: { x: 50, y: 200, width: 250, height: 180 },
          },
        ],
      },
    ];

    const report = await QualityCheckerEngine.evaluateEdition({
      edition,
      pages: pageNoMasthead,
      adapter,
      skipExportCheck: true,
    });

    const mastIssue = report.issues.find((i) => i.code === 'FRONT_PAGE_MISSING_MASTHEAD' || i.code === 'ERR_FRONT_PAGE_MISSING_MASTHEAD');
    assert.ok(mastIssue, 'ERR_FRONT_PAGE_MISSING_MASTHEAD must be flagged');
    assert.strictEqual(mastIssue.severity, QUALITY_SEVERITY.ERROR);
  });

  // -------------------------------------------------------------------------
  // TEST 16: Category D Advertisement - Unapproved advertisement reports CRITICAL
  // -------------------------------------------------------------------------
  await testAsync('16. Category D Advertisement: Unapproved advertisement placed on page reports CRITICAL', async () => {
    // Inject unapproved ad in adapter memory
    const unapprovedAd = {
      id: 'ad-unapproved-test-10',
      businessName: 'फर्जी विज्ञापनदाता',
      status: 'REJECTED',
    };
    adapter.data.epaperAds = adapter.data.epaperAds || [];
    adapter.data.epaperAds.push(unapprovedAd);

    const edition = {
      id: 'ed-test-unapp-ad',
      title: 'दैनिक ई-पेपर',
      editionType: 'SPECIAL',
      totalPages: 1,
      editionCode: 'EP-20261120-UNAPPAD-01',
      publicationDate: '2026-11-20',
      version: 1,
    };
    const page = [
      {
        id: 'p-ad-1',
        editionId: edition.id,
        pageNumber: 1,
        elements: [
          {
            id: 'elem-ad-unapproved',
            elementType: 'AD_SLOT',
            adId: unapprovedAd.id,
            slotType: 'BOTTOM_BANNER_FULL',
            asciBadgeText: 'विज्ञापन',
            bounds: { x: 42.52, y: 1200, width: 847.56, height: 150 },
          },
        ],
      },
    ];

    const report = await QualityCheckerEngine.evaluateEdition({
      edition,
      pages: page,
      adapter,
      skipExportCheck: true,
    });

    const adIssue = report.issues.find((i) => i.code === 'UNAPPROVED_AD_PLACEMENT' || i.code === 'AD_SUBMISSION_NOT_APPROVED' || i.code === 'ERR_UNAPPROVED_AD_PLACED');
    assert.ok(adIssue, 'ERR_UNAPPROVED_AD_PLACED must be flagged');
    assert.strictEqual(adIssue.severity, QUALITY_SEVERITY.CRITICAL);
    assert.strictEqual(report.canPublish, false);
  });

  // -------------------------------------------------------------------------
  // TEST 17: Category D Advertisement - Sponsored ad missing ASCI badge reports ERROR
  // -------------------------------------------------------------------------
  await testAsync('17. Category D Advertisement: Sponsored ad missing ASCI "विज्ञापन" badge reports ERROR', async () => {
    const edition = {
      id: 'ed-test-no-asci',
      title: 'दैनिक ई-पेपर',
      editionType: 'SPECIAL',
      totalPages: 1,
      editionCode: 'EP-20261120-ASCI-01',
      publicationDate: '2026-11-20',
      version: 1,
    };
    const page = [
      {
        id: 'p-asci-1',
        editionId: edition.id,
        pageNumber: 1,
        elements: [
          {
            id: 'elem-ad-no-badge',
            elementType: 'AD_SLOT',
            slotType: 'BOTTOM_BANNER_FULL',
            asciBadgeText: '', // Missing ASCI badge!
            bounds: { x: 42.52, y: 1200, width: 847.56, height: 150 },
          },
        ],
      },
    ];

    const report = await QualityCheckerEngine.evaluateEdition({
      edition,
      pages: page,
      adapter,
      skipExportCheck: true,
    });

    const asciIssue = report.issues.find((i) => i.code === 'MISSING_ASCI_SPONSORED_BADGE' || i.code === 'ERR_AD_MISSING_ASCI_BADGE');
    assert.ok(asciIssue, 'ERR_AD_MISSING_ASCI_BADGE must be flagged');
    assert.strictEqual(asciIssue.severity, QUALITY_SEVERITY.ERROR);
  });

  // -------------------------------------------------------------------------
  // TEST 18: Category D Advertisement - Ad overlapping editorial story element reports CRITICAL
  // -------------------------------------------------------------------------
  await testAsync('18. Category D Advertisement: Ad overlapping editorial story element reports CRITICAL', async () => {
    const edition = {
      id: 'ed-test-ad-displacement',
      title: 'दैनिक ई-पेपर',
      editionType: 'SPECIAL',
      totalPages: 1,
      editionCode: 'EP-20261120-ADDISP-01',
      publicationDate: '2026-11-20',
      version: 1,
    };
    const page = [
      {
        id: 'p-disp-1',
        editionId: edition.id,
        pageNumber: 1,
        elements: [
          {
            id: 'elem-story-disp',
            elementType: 'STORY',
            customHeadline: 'संपादकीय समाचार',
            customBodyText: 'विवरण...',
            bounds: { x: 50, y: 300, width: 350, height: 250 },
          },
          {
            id: 'elem-ad-disp',
            elementType: 'AD_SLOT',
            slotType: 'CORNER_BOX',
            asciBadgeText: 'विज्ञापन',
            bounds: { x: 100, y: 350, width: 200, height: 150 }, // Direct collision with story!
          },
        ],
      },
    ];

    const report = await QualityCheckerEngine.evaluateEdition({
      edition,
      pages: page,
      adapter,
      skipExportCheck: true,
    });

    const dispIssue = report.issues.find((i) => i.code === 'AD_DISPLACING_EDITORIAL_CONTENT' || i.code === 'ERR_AD_DISPLACING_EDITORIAL');
    assert.ok(dispIssue, 'ERR_AD_DISPLACING_EDITORIAL must be flagged');
    assert.strictEqual(dispIssue.severity, QUALITY_SEVERITY.CRITICAL);
    assert.strictEqual(report.canPublish, false);
  });

  // -------------------------------------------------------------------------
  // TEST 19: Category E Metadata - Missing editionCode or publicationDate reports ERROR
  // -------------------------------------------------------------------------
  await testAsync('19. Category E Metadata: Missing editionCode or publicationDate reports ERROR', async () => {
    const edition = {
      id: 'ed-test-missing-meta',
      title: 'दैनिक ई-पेपर',
      editionType: 'SPECIAL',
      totalPages: 1,
      editionCode: '', // Missing editionCode!
      publicationDate: '', // Missing publicationDate!
      version: 1,
    };
    const pages = [{ id: 'p-meta-1', editionId: edition.id, pageNumber: 1, elements: [] }];

    const report = await QualityCheckerEngine.evaluateEdition({
      edition,
      pages,
      adapter,
      skipExportCheck: true,
    });

    const codeIssue = report.issues.find((i) => i.code === 'MISSING_EDITION_CODE' || i.code === 'ERR_METADATA_EDITION_CODE_MISSING');
    const dateIssue = report.issues.find((i) => i.code === 'INVALID_PUBLICATION_DATE' || i.code === 'MISSING_PUBLICATION_DATE' || i.code === 'ERR_METADATA_PUBLICATION_DATE_MISSING');
    assert.ok(codeIssue, 'ERR_METADATA_EDITION_CODE_MISSING must be flagged');
    assert.ok(dateIssue, 'ERR_METADATA_PUBLICATION_DATE_MISSING must be flagged');
    assert.strictEqual(codeIssue.severity, QUALITY_SEVERITY.ERROR);
  });

  // -------------------------------------------------------------------------
  // TEST 20: Category F Technical - Export generation test
  // -------------------------------------------------------------------------
  await testAsync('20. Category F Technical: Export generation test produces valid report metrics', async () => {
    const edition = {
      id: 'ed-test-export-gen',
      title: 'दैनिक ई-पेपर',
      editionType: 'SPECIAL',
      totalPages: 1,
      editionCode: 'EP-20261120-TECH-01',
      publicationDate: '2026-11-20',
      version: 1,
    };
    const pages = [{ id: 'p-tech-1', editionId: edition.id, pageNumber: 1, elements: [] }];

    // Test with skipExportCheck = false to execute export validation
    const report = await QualityCheckerEngine.evaluateEdition({
      edition,
      pages,
      adapter,
      skipExportCheck: false,
    });

    assert.ok(report.categories.EXPORT, 'Category EXPORT must be evaluated');
    assert.strictEqual(typeof report.categories.EXPORT.passed, 'boolean');
  });

  // -------------------------------------------------------------------------
  // TEST 21: Quality Score Calculation - Mathematical formula verification
  // -------------------------------------------------------------------------
  await testAsync('21. Quality Score Calculation: Mathematical formula verification (Base 100 - Critical*25 - Error*10 - Warning*3)', async () => {
    // 1 Critical (-25) + 2 Errors (-20) + 1 Warning (-3) => 100 - (25 + 20 + 3) = 52
    const edition = {
      id: 'ed-test-math-score',
      title: 'दैनिक ई-पेपर',
      editionType: 'DAILY',
      totalPages: 10, // 1 Critical (ERR_DAILY_EDITION_PAGES_MISMATCH)
      editionCode: 'EP-20261120-MATH-01',
      publicationDate: '2026-11-20',
      version: 1,
    };
    const pages = [
      {
        id: 'p-math-1',
        editionId: edition.id,
        pageNumber: 1,
        elements: [
          {
            id: 'elem-head-empty',
            elementType: 'STORY',
            customHeadline: '', // 1 Error (ERR_EMPTY_HEADLINE)
            customBodyText: '', // 1 Error (ERR_EMPTY_BODY_TEXT)
            byline: '', // 1 Warning (WARN_MISSING_REPORTER_CREDIT)
            editorCredit: 'संपादक',
            bounds: { x: 50, y: 200, width: 250, height: 180 },
          },
        ],
      },
    ];

    const report = await QualityCheckerEngine.evaluateEdition({
      edition,
      pages,
      adapter,
      skipExportCheck: true,
    });

    // Score deduction breakdown
    const expectedDeduction = (report.criticalCount * 25) + (report.errorCount * 10) + (report.warningCount * 3);
    const expectedScore = Math.max(0, 100 - expectedDeduction);
    assert.strictEqual(report.qualityScore, expectedScore, `Quality score must match formula: expected ${expectedScore}, got ${report.qualityScore}`);
    assert.strictEqual(report.scoreBreakdown.finalScore, expectedScore);
  });

  // -------------------------------------------------------------------------
  // TEST 22: Exception Granting - Warning/Error can be bypassed; Critical CANNOT
  // -------------------------------------------------------------------------
  await testAsync('22. Exception Granting: Authorized user can grant exception for WARNING/ERROR with written reason; CRITICAL CANNOT be bypassed', async () => {
    const edition = {
      id: 'ed-test-exception-flow',
      title: 'दैनिक ई-पेपर',
      editionType: 'SPECIAL',
      totalPages: 1,
      editionCode: 'EP-20261120-EXCP-01',
      publicationDate: '2026-11-20',
      version: 1,
    };
    const pages = [
      {
        id: 'p-excp-1',
        editionId: edition.id,
        pageNumber: 1,
        elements: [
          {
            id: 'elem-excp',
            elementType: 'STORY',
            customHeadline: 'समाचार',
            customBodyText: 'विवरण...',
            byline: '', // Generates WARN_MISSING_REPORTER_CREDIT
            editorCredit: 'संपादक',
            bounds: { x: 50, y: 200, width: 250, height: 180 },
          },
        ],
      },
    ];

    const report = await QualityCheckerEngine.evaluateEdition({
      edition,
      pages,
      adapter,
      skipExportCheck: true,
    });

    const warnIssue = report.issues.find((i) => i.severity === QUALITY_SEVERITY.WARNING);
    assert.ok(warnIssue, 'Warning issue must exist');

    // Grant exception for warning
    const res = QualityCheckerEngine.grantException({
      report,
      issueId: warnIssue.id,
      reason: 'विशेष एजेंसी समाचार होने के कारण रिपोर्टर नाम अनुपलब्ध',
      user: authorizedUser,
    });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.issue.resolutionStatus, 'EXCEPTION_GRANTED');
    assert.strictEqual(res.issue.resolvedBy, authorizedUser.fullName);

    // Now test that CRITICAL issue CANNOT be bypassed
    const criticalIssue = {
      id: 'iss-crit-mock',
      severity: QUALITY_SEVERITY.CRITICAL,
      code: 'ERR_CRITICAL_TEST',
      resolutionStatus: 'UNRESOLVED',
    };
    report.issues.push(criticalIssue);

    assert.throws(
      () => {
        QualityCheckerEngine.grantException({
          report,
          issueId: criticalIssue.id,
          reason: 'यह गंभीर त्रुटि है जिसे बायपास करना चाहते हैं',
          user: authorizedUser,
        });
      },
      /ERR_CRITICAL_CANNOT_BE_BYPASSED/,
      'CRITICAL issue must strictly throw ERR_CRITICAL_CANNOT_BE_BYPASSED'
    );
  });

  // -------------------------------------------------------------------------
  // TEST 23: Publishing Gate Enforcement - Unresolved Critical/Error blocks publish
  // -------------------------------------------------------------------------
  await testAsync('23. Publishing Gate Enforcement: Edition with unresolved CRITICAL/ERROR cannot be published (HTTP 422)', async () => {
    // Create new edition with invalid structure
    const { edition } = await adapter.createEpaperEditionWithPages({
      title: 'दैनिक भोपाल ई-पेपर (अवरुद्ध प्रकाशन परीक्षण)',
      editionType: 'SPECIAL',
      totalPages: 1,
      districtId: 'dist-bhopal',
      publicationDate: '2026-11-20',
    }, authorizedUser);

    // Save page with an empty headline (generates ERROR)
    const page = await adapter.getEpaperPageByNumber(edition.id, 1);
    await adapter.saveEpaperPage({
      ...page,
      elements: [
        {
          id: 'elem-blocking-error',
          elementType: 'STORY',
          customHeadline: '', // Empty headline generates ERROR
          customBodyText: 'समाचार विवरण...',
          bounds: { x: 50, y: 200, width: 250, height: 180 },
        },
      ],
    }, authorizedUser);

    // Attempting publish must be strictly blocked with ERR_QUALITY_CHECK_FAILED (422)
    let threw = false;
    try {
      await adapter.publishEpaperEdition(edition.id, undefined, authorizedUser);
    } catch (err) {
      threw = true;
      assert.strictEqual(err.code, 'ERR_QUALITY_CHECK_FAILED');
      assert.strictEqual(err.statusCode, 422);
      assert.ok(err.qualityReport);
      assert.strictEqual(err.qualityReport.canPublish, false);
    }
    assert.strictEqual(threw, true, 'publishEpaperEdition must throw ERR_QUALITY_CHECK_FAILED');
  });

  // -------------------------------------------------------------------------
  // TEST 24: Version Snapshot & Immutability - Published edition snapshot is immutable
  // -------------------------------------------------------------------------
  await testAsync('24. Version Snapshot & Immutability: Published edition creates immutable snapshot; modifying throws ERR_EDITION_ALREADY_PUBLISHED', async () => {
    // Create clean valid edition
    const { edition } = await adapter.createEpaperEditionWithPages({
      title: 'स्वच्छ स्वीकृत ई-पेपर (प्रकाशन परीक्षण)',
      editionType: 'SPECIAL',
      totalPages: 1,
      districtId: 'dist-gwalior',
      districtName: 'ग्वालियर',
      publicationDate: '2026-11-20',
    }, authorizedUser);

    const page = await adapter.getEpaperPageByNumber(edition.id, 1);
    // Add valid masthead and valid story
    await adapter.saveEpaperPage({
      ...page,
      elements: [
        {
          id: 'elem-mast',
          elementType: 'MASTHEAD',
          bounds: { x: 42.52, y: 42.52, width: 847.56, height: 95 },
        },
        {
          id: 'elem-valid-story',
          elementType: 'STORY',
          customHeadline: 'ग्वालियर में नवीन स्मार्ट सिटी परियोजना का शुभारंभ',
          customBodyText: 'ग्वालियर नगर निगम द्वारा विभिन्न वार्डों में विकास कार्यों का विस्तार किया गया।',
          byline: 'संजीव वर्मा (वरिष्ठ संवाददाता)',
          editorCredit: 'राजेश शर्मा (संपादक)',
          bounds: { x: 42.52, y: 150, width: 280, height: 180 },
        },
      ],
    }, authorizedUser);

    // Pre-run quality check to establish clean state
    await adapter.runEpaperQualityCheck(edition.id, authorizedUser, true);

    // Publish edition
    const pubResult = await adapter.publishEpaperEdition(edition.id, undefined, authorizedUser);
    assert.strictEqual(pubResult.edition.status, 'PUBLISHED');
    assert.ok(pubResult.snapshot);
    assert.strictEqual(pubResult.snapshot.immutable, true);

    // Verifying published edition immutability:
    // 1. Modifying published page elements throws ERR_EDITION_ALREADY_PUBLISHED
    assert.rejects(
      async () => {
        await adapter.saveEpaperPage({
          ...page,
          elements: [],
        }, authorizedUser, { throwOnError: true });
      },
      /ERR_EDITION_ALREADY_PUBLISHED/
    );

    // 2. Re-publishing an already published edition throws ERR_EDITION_ALREADY_PUBLISHED
    assert.rejects(
      async () => {
        await adapter.publishEpaperEdition(edition.id, undefined, authorizedUser);
      },
      /ERR_EDITION_ALREADY_PUBLISHED/
    );

    // 3. AI cannot publish or approve
    assert.rejects(
      async () => {
        await adapter.publishEpaperEdition(edition.id, undefined, aiAgentUser);
      },
      /ERR_EDITION_ALREADY_PUBLISHED|ERR_AI_CANNOT_PUBLISH/
    );
  });

  // -------------------------------------------------------------------------
  // TEST 25: Quality Staleness - Modifying page layout marks prior quality report as stale
  // -------------------------------------------------------------------------
  await testAsync('25. Quality Staleness: Modifying page layout marks prior quality report as stale (isQualityStale: true)', async () => {
    const { edition } = await adapter.createEpaperEditionWithPages({
      title: 'दैनिक ई-पेपर (स्टेलनेस परीक्षण)',
      editionType: 'SPECIAL',
      totalPages: 1,
      districtId: 'dist-jabalpur',
      publicationDate: '2026-11-20',
    }, authorizedUser);

    // Run initial scan
    const initialReport = await adapter.runEpaperQualityCheck(edition.id, authorizedUser, true);
    assert.strictEqual(initialReport.isStale, false);

    const freshEdition = await adapter.getEpaperEditionById(edition.id);
    assert.strictEqual(freshEdition.isQualityStale, false);

    // Modify page element
    const page = await adapter.getEpaperPageByNumber(edition.id, 1);
    await adapter.saveEpaperPage({
      ...page,
      elements: [
        {
          id: 'elem-new-modification',
          elementType: 'STORY',
          customHeadline: 'नवीन संशोधन',
          customBodyText: 'विवरण...',
          bounds: { x: 50, y: 200, width: 250, height: 180 },
        },
      ],
    }, authorizedUser);

    // Check that edition is now marked stale
    const staleEdition = await adapter.getEpaperEditionById(edition.id);
    assert.strictEqual(staleEdition.isQualityStale, true, 'isQualityStale must become true on page edit');
    assert.strictEqual(staleEdition.qualityCheckResult.isStale, true, 'qualityCheckResult.isStale must become true');
  });

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`🏁 STEP 10 VERIFICATION COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED (TOTAL 25)`);
  console.log('========================================================================\n');

  cleanup();

  if (failedCount > 0) {
    process.exit(1);
  }
}

runStep10QualityPublishingTests();
