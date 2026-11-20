/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * STEP 6 — E-PAPER ADVERTISEMENT MANAGER & AI AD STUDIO AUTOMATED TEST SUITE
 * 
 * Verifies:
 * 1. Ad Creation, Schema Validation & Creative Format Checking (JPG, PNG, WEBP)
 * 2. Complete 7-Stage Ad Lifecycle State Machine (DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED -> SCHEDULED -> PUBLISHED -> COMPLETED)
 * 3. Rejection and Cancellation Path Handling
 * 4. Invalid State Transitions Rejection (Enforcing state machine invariants)
 * 5. Broadsheet 13 Slots Specifications & 2D AABB Collision Detection
 * 6. Editorial Slot Placement on Edition Pages
 * 7. Unapproved Ads Barred from Page Placement (ERR_AD_NOT_APPROVED)
 * 8. Published Edition Immutability Protection (ERR_PUBLISHED_EDITION_IMMUTABLE)
 * 9. AI Ad Studio Grounded Generation (3 Headlines, 3 Copies, 3 CTAs)
 * 10. Reporter Isolation & Strict RBAC Enforcement
 * 11. Mandatory Sponsored / ASCI Badging ('विज्ञापन' / 'प्रायोजित सामग्री')
 * 12. Ad Reporting Summary & Honest Occupancy Metrics
 */

import assert from 'node:assert';
import { setupIsolatedTestPersistence } from './testIsolationHelper.js';
import { LocalJsonAdapter } from '../src/server/persistence/adapter.js';
import {
  BroadsheetAdManager,
  ALL_SUPPORTED_SLOTS,
  AD_LIFECYCLE_STATES,
  BROADSHEET_RATE_CARDS,
  PAGE_PLACEMENT_MULTIPLIERS,
} from '../src/server/monetization/epaperAds.js';

let passedTests = 0;
let failedTests = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failedTests++;
  }
}

async function runTestSuite() {
  console.log('\n============================================================');
  console.log('🚀 RUNNING STEP 6: E-PAPER AD MANAGER & AI AD STUDIO TESTS');
  console.log('============================================================\n');

  const { adapter, cleanup } = setupIsolatedTestPersistence({ prefix: 'step6_' });

  // Test users
  const adminUser = {
    id: 'user-admin-001',
    name: 'Chief Editor',
    email: 'admin@breakingnewswala.in',
    role: 'ADMIN',
    roles: ['ADMIN', 'CHIEF_EDITOR'],
  };

  const editorUser = {
    id: 'user-editor-001',
    name: 'Desk Editor',
    email: 'editor@breakingnewswala.in',
    role: 'EDITOR',
    roles: ['EDITOR'],
  };

  const reporterA = {
    id: 'rep-bhopal-001',
    name: 'Bhopal Stringer A',
    email: 'reporterA@breakingnewswala.in',
    role: 'REPORTER',
    roles: ['REPORTER'],
    district: 'भोपाल',
  };

  const reporterB = {
    id: 'rep-indore-002',
    name: 'Indore Stringer B',
    email: 'reporterB@breakingnewswala.in',
    role: 'REPORTER',
    roles: ['REPORTER'],
    district: 'इन्दौर',
  };

  // Test Edition setup
  const testEdition = await adapter.saveEpaperEdition({
    editionName: 'दैनिक भोपाल प्रातः - Step 6 Test',
    editionType: 'REGULAR',
    publicationDate: '2026-11-20',
    divisionId: 'bhopal-div',
    districtId: 'bhopal',
    status: 'DRAFT',
    pageCount: 12,
  }, adminUser);

  // 1. All Supported Slots & Rate Cards
  await test('1. Broadsheet 13 Slots Catalog & Rate Cards are defined', async () => {
    assert(ALL_SUPPORTED_SLOTS.length >= 13, 'Must define at least 13 standard broadsheet ad slots');
    assert(ALL_SUPPORTED_SLOTS.includes('FULL_PAGE'));
    assert(ALL_SUPPORTED_SLOTS.includes('HALF_PAGE_HORIZONTAL'));
    assert(ALL_SUPPORTED_SLOTS.includes('HALF_PAGE_VERTICAL'));
    assert(ALL_SUPPORTED_SLOTS.includes('QUARTER_PAGE'));
    assert(ALL_SUPPORTED_SLOTS.includes('ONE_EIGHTH_PAGE'));
    assert(ALL_SUPPORTED_SLOTS.includes('HORIZONTAL_BANNER'));
    assert(ALL_SUPPORTED_SLOTS.includes('VERTICAL_STRIP'));
    assert(ALL_SUPPORTED_SLOTS.includes('L_SHAPE'));
    assert(ALL_SUPPORTED_SLOTS.includes('BOTTOM_STRIP'));
    assert(ALL_SUPPORTED_SLOTS.includes('FOOTER'));
    assert(ALL_SUPPORTED_SLOTS.includes('VERTICAL_EAR'));
    assert(ALL_SUPPORTED_SLOTS.includes('SPONSORED_FEATURE'));
    assert(ALL_SUPPORTED_SLOTS.includes('CLASSIFIED'));

    assert.strictEqual(BROADSHEET_RATE_CARDS.FULL_PAGE.basePaise.district, 1500000);
    assert.strictEqual(BROADSHEET_RATE_CARDS.BOTTOM_STRIP.basePaise.district, 250000);
    assert.strictEqual(BROADSHEET_RATE_CARDS.CLASSIFIED.basePaise.district, 25000);
  });

  // 2. Creative Format Validation
  await test('2. Ad Creative Image Format Validation', async () => {
    assert.strictEqual(BroadsheetAdManager.validateImageCreative('https://cdn.example.com/ad.jpg'), true);
    assert.strictEqual(BroadsheetAdManager.validateImageCreative('https://cdn.example.com/ad.jpeg'), true);
    assert.strictEqual(BroadsheetAdManager.validateImageCreative('https://cdn.example.com/ad.png'), true);
    assert.strictEqual(BroadsheetAdManager.validateImageCreative('https://cdn.example.com/ad.webp'), true);

    assert.throws(() => {
      BroadsheetAdManager.validateImageCreative('https://cdn.example.com/ad.exe');
    }, /अमान्य छवि प्रारूप|असमर्थित इमेज प्रारूप/);

    assert.throws(() => {
      BroadsheetAdManager.validateImageCreative('https://cdn.example.com/ad.svg');
    }, /अमान्य छवि प्रारूप|असमर्थित इमेज प्रारूप/);
  });

  // 3. Ad Creation & Ingestion
  let adSubmission1;
  await test('3. Create & Ingest Ad Submission with Contact & Creative Details', async () => {
    const rawPayload = {
      advertiserName: 'श्री राम मिष्ठान भंडार',
      businessName: 'श्री राम मिष्ठान भंडार',
      contactPhone: '9826012345',
      contactEmail: 'contact@shreeram.in',
      contactAddress: 'न्यू मार्केट, भोपाल',
      category: 'COMMERCIAL',
      slotType: 'BOTTOM_STRIP',
      headline: 'शुद्ध देशी घी की मिठाइयाँ - 10% विशेष छूट',
      text: 'त्योहारी सीजन में हमारे यहाँ शुद्ध देशी घी के लड्डू व काजू कतली पर विशेष छूट उपलब्ध है।',
      ctaText: 'आज ही पधारें',
      targetDistrict: 'भोपाल',
      targetDistrictName: 'भोपाल',
      imageUrl: 'https://cdn.example.com/creatives/sweets_ad.png',
      isSponsored: false,
    };

    BroadsheetAdManager.validateAdSubmission(rawPayload);
    adSubmission1 = await adapter.saveEpaperAdSubmission(rawPayload, reporterA);

    assert(adSubmission1.id, 'Ad must receive unique id');
    assert(adSubmission1.submissionNumber, 'Ad must receive submission number');
    assert.strictEqual(adSubmission1.status, 'SUBMITTED', 'Default created status is SUBMITTED');
    assert.strictEqual(adSubmission1.reporterId, reporterA.id, 'Must record creating reporter');
    assert.strictEqual(adSubmission1.asciBadge, true, 'Must have ASCI badge flag');
    assert.strictEqual(adSubmission1.badgeText, 'विज्ञापन', 'Must have Hindi advertisement badge text');
  });

  // 4. Complete Lifecycle State Machine
  await test('4. Execute Complete 7-Stage Lifecycle State Machine', async () => {
    // 1. SUBMITTED -> UNDER_REVIEW (Editor picks up)
    const reviewStep = await adapter.updateAdLifecycleStatus(
      adSubmission1.id,
      'UNDER_REVIEW',
      editorUser,
      'संपादक द्वारा समीक्षा प्रारंभ की गई'
    );
    assert.strictEqual(reviewStep.status, 'UNDER_REVIEW');

    // 2. UNDER_REVIEW -> APPROVED (Editor approves)
    const approveStep = await adapter.updateAdLifecycleStatus(
      adSubmission1.id,
      'APPROVED',
      editorUser,
      'सभी मानक सही पाए गए, विज्ञापन स्वीकृत'
    );
    assert.strictEqual(approveStep.status, 'APPROVED');
    assert(approveStep.reviewedAt, 'Must record review timestamp');
    assert(approveStep.reviewedBy === editorUser.id || approveStep.reviewedBy === editorUser.name);

    // 3. APPROVED -> SCHEDULED (Assigned to run on edition)
    const scheduleStep = await adapter.updateAdLifecycleStatus(
      adSubmission1.id,
      'SCHEDULED',
      editorUser,
      'दैनिक भोपाल संस्करण में प्रकाशन हेतु निर्धारित'
    );
    assert.strictEqual(scheduleStep.status, 'SCHEDULED');

    // 4. SCHEDULED -> PUBLISHED (Edition published)
    const pubStep = await adapter.updateAdLifecycleStatus(
      adSubmission1.id,
      'PUBLISHED',
      editorUser,
      'ई-पेपर पृष्ठ पर लाइव प्रकाशित'
    );
    assert.strictEqual(pubStep.status, 'PUBLISHED');

    // 5. PUBLISHED -> COMPLETED (Campaign run finished)
    const compStep = await adapter.updateAdLifecycleStatus(
      adSubmission1.id,
      'COMPLETED',
      adminUser,
      'अभियान सफलता पूर्वक संपन्न'
    );
    assert.strictEqual(compStep.status, 'COMPLETED');

    // Verify history audit trail
    assert(compStep.statusHistory.length >= 5, 'Must maintain full audit log of transitions');
  });

  // 5. Rejection & Cancellation State Transitions
  await test('5. Rejection and Cancellation Flow Handling', async () => {
    const rawRejectionAd = await adapter.saveEpaperAdSubmission({
      advertiserName: 'अस्पष्ट रियल एस्टेट प्रोजेक्ट',
      contactPhone: '9826099999',
      category: 'PROPERTY',
      slotType: 'QUARTER_PAGE',
      text: 'रेरा पंजीयन संख्या उपलब्ध नहीं है।',
    }, reporterA);

    // Move to UNDER_REVIEW
    await adapter.updateAdLifecycleStatus(rawRejectionAd.id, 'UNDER_REVIEW', editorUser, 'जांच जारी');

    // Reject from UNDER_REVIEW
    const rejected = await adapter.updateAdLifecycleStatus(
      rawRejectionAd.id,
      'REJECTED',
      editorUser,
      'रेरा संख्या का अभाव, विज्ञापन अस्वीकृत'
    );
    assert.strictEqual(rejected.status, 'REJECTED');

    // Test Cancellation from APPROVED
    const cancelCandidate = await adapter.saveEpaperAdSubmission({
      advertiserName: 'कैंसिल टेस्ट क्लाइंट',
      contactPhone: '9826088888',
      category: 'COMMERCIAL',
      slotType: 'BOTTOM_STRIP',
      text: 'कैंसिल टेस्ट विज्ञापन',
    }, reporterB);

    await adapter.updateAdLifecycleStatus(cancelCandidate.id, 'UNDER_REVIEW', editorUser);
    await adapter.updateAdLifecycleStatus(cancelCandidate.id, 'APPROVED', editorUser);

    const cancelled = await adapter.updateAdLifecycleStatus(
      cancelCandidate.id,
      'CANCELLED',
      editorUser,
      'ग्राहक के अनुरोध पर रद्द'
    );
    assert.strictEqual(cancelled.status, 'CANCELLED');
  });

  // 6. Invalid State Transitions Rejection (Enforcing state machine invariants)
  await test('6. Enforce State Machine Invariants & Reject Illegal Jumps', async () => {
    const draftAd = await adapter.saveEpaperAdSubmission({
      advertiserName: 'ड्राफ्ट विज्ञापन',
      contactPhone: '9826077777',
      category: 'COMMERCIAL',
      slotType: 'CLASSIFIED',
      text: 'ड्राफ्ट कंटेंट',
      status: 'DRAFT',
    }, reporterA);

    // Cannot jump DRAFT -> PUBLISHED directly
    await assert.rejects(
      async () => {
        await adapter.updateAdLifecycleStatus(draftAd.id, 'PUBLISHED', editorUser);
      },
      (err) => {
        assert(err.message.includes('ERR_ILLEGAL_STATUS_TRANSITION') || err.message.includes('परिवर्तन वर्जित') || err.message.includes('अमान्य'));
        return true;
      }
    );

    // Reporter cannot self-approve their own ad
    await assert.rejects(
      async () => {
        await adapter.updateAdLifecycleStatus(draftAd.id, 'APPROVED', reporterA);
      },
      (err) => {
        assert.strictEqual(err.statusCode, 403);
        return true;
      }
    );
  });

  // 7. 2D AABB Collision Detection & Slot Dimension Checks
  await test('7. 2D AABB Collision Detection & Broadsheet Slot Dimensions', async () => {
    const dimsFull = BroadsheetAdManager.getSlotDimensionsPt('FULL_PAGE');
    assert(dimsFull.width > 800, 'Full page width must exceed 800 pt');
    assert(dimsFull.height > 1200, 'Full page height must exceed 1200 pt');

    const dimsQuarter = BroadsheetAdManager.getSlotDimensionsPt('QUARTER_PAGE');
    assert(dimsQuarter.width > 400);
    assert(dimsQuarter.height > 600);

    const existingElements = [
      {
        id: 'elem-001',
        type: 'ARTICLE',
        x: 40,
        y: 100,
        width: 400,
        height: 300,
      },
      {
        id: 'elem-002',
        type: 'AD',
        x: 40,
        y: 1200,
        width: 852.6,
        height: 200,
      },
    ];

    // Colliding placement
    const collidingBounds = { x: 50, y: 150, width: 300, height: 200 };
    assert.throws(() => {
      BroadsheetAdManager.validateAdPlacement(
        { id: 'ad-col', status: 'APPROVED' },
        collidingBounds,
        932.6,
        1474.0,
        existingElements
      );
    }, /स्लॉट टकराव|ERR_SLOT_COLLISION/);

    // Page overflow placement
    const overflowBounds = { x: 800, y: 1400, width: 300, height: 200 };
    assert.throws(() => {
      BroadsheetAdManager.validateAdPlacement(
        { id: 'ad-ovf', status: 'APPROVED' },
        overflowBounds,
        932.6,
        1474.0,
        existingElements
      );
    }, /पृष्ठ सीमाओं से बाहर|ERR_PAGE_OVERFLOW/);

    // Clean non-colliding placement
    const validBounds = { x: 500, y: 100, width: 400, height: 300 };
    const validCheck = BroadsheetAdManager.validateAdPlacement(
      { id: 'ad-ok', status: 'APPROVED' },
      validBounds,
      932.6,
      1474.0,
      existingElements
    );
    assert.strictEqual(validCheck, true);
  });

  // 8. Editorial Page Slot Placement
  await test('8. Assign Approved Ad to Edition Page Slot & Prevent Unapproved Placement', async () => {
    // Attempting to place an unapproved ad must fail
    const unapprovedAd = await adapter.saveEpaperAdSubmission({
      advertiserName: 'अस्वीकृत विज्ञापन',
      contactPhone: '9826066666',
      category: 'COMMERCIAL',
      slotType: 'BOTTOM_STRIP',
      text: 'अभी स्वीकृत नहीं हुआ है',
      status: 'SUBMITTED',
    }, reporterA);

    await assert.rejects(
      async () => {
        await adapter.assignAdToEditionSlot(
          unapprovedAd.id,
          testEdition.id,
          1,
          { slotType: 'BOTTOM_STRIP' },
          editorUser
        );
      },
      (err) => {
        assert(err.message.includes('ERR_AD_NOT_APPROVED') || err.message.includes('अनुमोदित') || err.message.includes('APPROVED'));
        return true;
      }
    );

    // Create and approve ad for placement
    const placementAd = await adapter.saveEpaperAdSubmission({
      advertiserName: 'भोपाल ऑटोमोबाइल्स',
      contactPhone: '9826055555',
      category: 'COMMERCIAL',
      slotType: 'BOTTOM_STRIP',
      headline: 'नई एसयूवी कार लॉन्च',
      text: 'आकर्षक ईएमआई व एक्सचेंज बोनस उपलब्ध।',
    }, reporterA);

    await adapter.updateAdLifecycleStatus(placementAd.id, 'UNDER_REVIEW', editorUser);
    await adapter.updateAdLifecycleStatus(placementAd.id, 'APPROVED', editorUser);

    // Place on Page 1 of testEdition
    const assigned = await adapter.assignAdToEditionSlot(
      placementAd.id,
      testEdition.id,
      1,
      { slotType: 'BOTTOM_STRIP', customBadgeText: 'विज्ञापन' },
      editorUser
    );

    assert.strictEqual(assigned.assignedEditionId, testEdition.id);
    assert.strictEqual(assigned.assignedPageNumber, 1);
    assert.strictEqual(assigned.status, 'SCHEDULED');

    // Verify ad element injected into edition page
    const page1 = await adapter.getEpaperPage(testEdition.id, 1);
    const adElem = page1.elements.find((el) => el.adId === placementAd.id);
    assert(adElem, 'Ad element must exist in page elements array');
    assert.strictEqual(adElem.elementType, 'AD');
    assert.strictEqual(adElem.asciBadge, true);
    assert.strictEqual(adElem.badgeText, 'विज्ञापन');

    // Test removing ad from slot
    const removed = await adapter.removeAdFromEditionSlot(placementAd.id, testEdition.id, 1, editorUser);
    assert.strictEqual(removed.assignedEditionId, null);
    assert.strictEqual(removed.status, 'APPROVED');

    const page1AfterRemove = await adapter.getEpaperPage(testEdition.id, 1);
    const adElemAfter = page1AfterRemove.elements.find((el) => el.adId === placementAd.id);
    assert(!adElemAfter, 'Ad element must be removed from page elements');
  });

  // 9. Published Edition Immutability Invariant
  await test('9. Published Edition Immutability Invariant for Ads', async () => {
    // Create a published edition
    const publishedEdition = await adapter.saveEpaperEdition({
      editionName: 'दैनिक भोपाल प्रातः - Published Immutable Edition',
      editionType: 'REGULAR',
      publicationDate: '2026-11-20',
      divisionId: 'bhopal-div',
      districtId: 'bhopal',
      status: 'PUBLISHED',
      pageCount: 12,
    }, adminUser);

    const readyAd = await adapter.saveEpaperAdSubmission({
      advertiserName: 'अपरिवर्तनीयता टेस्ट विज्ञापन',
      contactPhone: '9826044444',
      category: 'COMMERCIAL',
      slotType: 'BOTTOM_STRIP',
      text: 'परीक्षण विवरण',
    }, reporterA);

    await adapter.updateAdLifecycleStatus(readyAd.id, 'UNDER_REVIEW', editorUser);
    await adapter.updateAdLifecycleStatus(readyAd.id, 'APPROVED', editorUser);

    // Attempting to mutate published edition must throw ERR_PUBLISHED_EDITION_IMMUTABLE
    await assert.rejects(
      async () => {
        await adapter.assignAdToEditionSlot(
          readyAd.id,
          publishedEdition.id,
          1,
          { slotType: 'BOTTOM_STRIP' },
          editorUser
        );
      },
      (err) => {
        assert(err.message.includes('प्रकाशित संस्करण अपरिवर्तनीय') || err.message.includes('Immutable'));
        return true;
      }
    );
  });

  // 10. AI Ad Studio Grounded Generation
  await test('10. AI Ad Studio Grounded Generation (3 Headlines, 3 Copies, 3 CTAs)', async () => {
    const aiInput = {
      businessName: 'कौशल्या साड़ी सदन',
      category: 'COMMERCIAL',
      offerDetails: 'विवाह मुहूर्त पर सिल्क साड़ियों पर 20% की विशेष छूट',
      targetAudience: 'महिलाएं व परिवार',
      contactInfo: '9826033333',
      tone: 'आकर्षक व विश्वसनीय',
    };

    const creative = BroadsheetAdManager.generateAiAdStudioCreatives(aiInput);

    assert.strictEqual(creative.suggestedHeadlines.length, 3, 'Must produce exactly 3 headlines');
    assert.strictEqual(creative.suggestedCopy.length, 3, 'Must produce exactly 3 copy variants');
    assert.strictEqual(creative.suggestedCtas.length, 3, 'Must produce exactly 3 CTAs');

    // Verify grounding
    assert(creative.suggestedHeadlines.some((h) => h.includes('कौशल्या साड़ी सदन')));
    assert(creative.suggestedCopy.some((c) => c.includes('20% की विशेष छूट')));
    assert(creative.suggestedCtas.some((cta) => cta.includes('9826033333')));
  });

  // 11. Reporter Isolation & Security Permissions
  await test('11. Reporter Isolation: Reporters can only access their own submissions', async () => {
    const adA = await adapter.saveEpaperAdSubmission({
      advertiserName: 'रिपोर्टर A का क्लाइंट',
      contactPhone: '9826011111',
      category: 'COMMERCIAL',
      slotType: 'CLASSIFIED',
      text: 'रिपोर्टर A विज्ञापन',
    }, reporterA);

    const adB = await adapter.saveEpaperAdSubmission({
      advertiserName: 'रिपोर्टर B का क्लाइंट',
      contactPhone: '9826022222',
      category: 'COMMERCIAL',
      slotType: 'CLASSIFIED',
      text: 'रिपोर्टर B विज्ञापन',
    }, reporterB);

    // Reporter A querying with their ID sees only their ads
    const listA = await adapter.getEpaperAdSubmissions({ reporterId: reporterA.id });
    assert(listA.some((a) => a.id === adA.id));
    assert(!listA.some((a) => a.id === adB.id), 'Reporter A must NOT see Reporter B ads');

    // Reporter B cannot modify Reporter A ad
    await assert.rejects(
      async () => {
        await adapter.saveEpaperAdSubmission({
          id: adA.id,
          advertiserName: 'टैम्परिंग प्रयास',
        }, reporterB);
      },
      (err) => {
        assert.strictEqual(err.statusCode, 403);
        return true;
      }
    );
  });

  // 12. Sponsored Content Identification Label
  await test('12. Sponsored Content Labeling ("विज्ञापन" / "प्रायोजित सामग्री")', async () => {
    const commercialAd = await adapter.saveEpaperAdSubmission({
      advertiserName: 'सामान्य कमर्शियल विज्ञापन',
      contactPhone: '9826012345',
      category: 'COMMERCIAL',
      slotType: 'BOTTOM_STRIP',
      text: 'कमर्शियल ऐड',
      isSponsored: false,
    }, reporterA);
    assert.strictEqual(commercialAd.badgeText, 'विज्ञापन');

    const sponsoredAd = await adapter.saveEpaperAdSubmission({
      advertiserName: 'प्रायोजित फीचर लेख',
      contactPhone: '9826012345',
      category: 'SPONSORED_FEATURE',
      slotType: 'SPONSORED_FEATURE',
      text: 'राज्य में नवाचार की नई उड़ान',
      isSponsored: true,
      sponsoredDisclaimer: 'यह एक प्रायोजित फीचर है।',
    }, reporterA);
    assert.strictEqual(sponsoredAd.badgeText, 'प्रायोजित सामग्री');
    assert.strictEqual(sponsoredAd.isSponsored, true);
  });

  // 13. Ad Reporting Summary & Honest Occupancy Metrics
  await test('13. Ad Reporting Summary & Honest Occupancy Metrics', async () => {
    const summary = await adapter.getAdReportingSummary();

    assert(typeof summary.totalAds === 'number');
    assert(summary.totalAds > 0);
    assert(summary.statusBreakdown);
    assert(summary.categoryBreakdown);
    assert(summary.slotOccupancy);
    assert(typeof summary.slotOccupancy.occupancyRatePct === 'number');
    assert(summary.slotOccupancy.totalSlots >= 13);
  });

  console.log('\n------------------------------------------------------------');
  console.log(`Step 6 Test Summary: ${passedTests} passed, ${failedTests} failed.`);
  console.log('------------------------------------------------------------\n');

  cleanup();

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
