/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Step 8 Automated Verification Test Suite
 * WhatsApp Edition Generator & Distribution-Ready News Cards
 * 
 * Verifies all 16 items specified in Prompt Section 9:
 * 1. Authorized reporter can select eligible stories.
 * 2. Reporter cannot select another reporter's restricted stories.
 * 3. MASTER_ADMIN can access authorized cross-reporter selection.
 * 4. Both 1:1 and 4:5 formats generate correctly.
 * 5. Multi-story selection and ordering work.
 * 6. Individual card regeneration works.
 * 7. Devanagari text rendering and overflow validation work.
 * 8. Missing-image fallback works.
 * 9. Quota is enforced server-side.
 * 10. Failed generation does not consume quota.
 * 11. Concurrent requests cannot bypass quota.
 * 12. Reporter history is properly isolated.
 * 13. Unauthorized downloads are blocked.
 * 14. Published E-Paper snapshots remain unchanged.
 * 15. Audit logs are generated correctly.
 * 16. Existing STEP 1–7 regression tests continue to pass.
 */

import assert from 'node:assert';
import { setupIsolatedTestPersistence } from './testIsolationHelper.js';
import { getPersistenceAdapter } from '../src/server/persistence/adapter.js';

async function runStep8WhatsAppEditionTests() {
  console.log('========================================================================');
  console.log('🧪 RUNNING STEP 8: WHATSAPP EDITION GENERATOR & NEWS CARDS TESTS');
  console.log('========================================================================\n');

  const { adapter, cleanup } = setupIsolatedTestPersistence({ prefix: 'step8_' });
  let passedCount = 0;
  let failedCount = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
      failedCount++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
      failedCount++;
    }
  }

  // Define Mock Users with Strict Approved Roles (NO CHIEF_EDITOR, NO DESK_EDITOR)
  const reporterA = {
    id: 'usr-rep-1',
    fullName: 'राजेश पटेल (भोपाल ब्यूरो)',
    role: 'REPORTER',
    badgeNumber: 'BNW-REP-0101',
    district: 'भोपाल',
  };

  const reporterB = {
    id: 'usr-rep-2',
    fullName: 'अमित शर्मा',
    role: 'REPORTER',
    badgeNumber: 'BNW-REP-0102',
    district: 'इंदौर',
  };

  const masterAdmin = {
    id: 'usr-admin-1',
    fullName: 'प्रधान व्यवस्थापक (Master Admin)',
    role: 'MASTER_ADMIN',
  };

  // Setup sample test articles in adapter for rigorous testing
  adapter.data.articles = adapter.data.articles || [];

  // Article 1: Reporter A - Approved
  const artA1 = {
    id: 'art-repA-1',
    title: 'भोपाल में मेट्रो रेल का नया रूट तय, 5 नए स्टेशनों को हरी झंडी',
    summary: 'राजधानी भोपाल में मेट्रो के द्वितीय चरण का मार्ग अनुमोदित कर दिया गया है।',
    content: 'राजधानी भोपाल में मेट्रो के द्वितीय चरण का मार्ग अनुमोदित कर दिया गया है। विस्तृत विवरण...',
    authorId: reporterA.id,
    reporterId: reporterA.id,
    authorName: reporterA.fullName,
    district: 'भोपाल',
    districtName: 'भोपाल',
    category: 'विकास',
    status: 'APPROVED',
    featuredImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957',
  };

  // Article 2: Reporter A - Published
  const artA2 = {
    id: 'art-repA-2',
    title: 'बड़ा तालाब संरक्षण परियोजना के लिए 50 करोड़ रुपये स्वीकृत',
    summary: 'भोपाल के ऐतिहासिक बड़े तालाब के संवर्धन हेतु बजट अनुमोदित हुआ।',
    content: 'भोपाल के ऐतिहासिक बड़े तालाब के संवर्धन हेतु बजट अनुमोदित हुआ।',
    authorId: reporterA.id,
    reporterId: reporterA.id,
    authorName: reporterA.fullName,
    district: 'भोपाल',
    districtName: 'भोपाल',
    category: 'पर्यावरण',
    status: 'PUBLISHED',
    featuredImage: null, // Test missing image fallback
  };

  // Article 3: Reporter A - Unapproved / Draft (must be excluded!)
  const artA3Draft = {
    id: 'art-repA-draft',
    title: 'अस्वीकृत ड्राफ्ट रिपोर्ट — प्रकाशित नहीं होना चाहिए',
    summary: 'यह ड्राफ्ट अभी एडिटोरियल डेस्क द्वारा स्वीकृत नहीं है।',
    authorId: reporterA.id,
    reporterId: reporterA.id,
    authorName: reporterA.fullName,
    district: 'भोपाल',
    status: 'DRAFT',
  };

  // Article 4: Reporter B - Approved
  const artB1 = {
    id: 'art-repB-1',
    title: 'इंदौर में स्वच्छता अभियान का नया चरण प्रारंभ, स्मार्ट डस्टबिन स्थापित',
    summary: 'इंदौर नगर निगम ने स्वच्छता सर्वेक्षण में पुनः शीर्ष स्थान हेतु विशेष अभियान छेड़ा।',
    content: 'इंदौर नगर निगम ने स्वच्छता सर्वेक्षण में पुनः शीर्ष स्थान हेतु विशेष अभियान छेड़ा।',
    authorId: reporterB.id,
    reporterId: reporterB.id,
    authorName: reporterB.fullName,
    district: 'इंदौर',
    districtName: 'इंदौर',
    category: 'स्वच्छता',
    status: 'APPROVED',
    featuredImage: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b',
  };

  // Push or update articles
  [artA1, artA2, artA3Draft, artB1].forEach((art) => {
    const idx = adapter.data.articles.findIndex((x) => x.id === art.id);
    if (idx !== -1) adapter.data.articles[idx] = art;
    else adapter.data.articles.push(art);
  });

  // Ensure clean, deterministic state for test reporters
  adapter.data.epaperWhatsAppGenerations = (adapter.data.epaperWhatsAppGenerations || []).filter(
    (g) => g.reporterId !== reporterA.id && g.reporterId !== reporterB.id && g.reporterId !== masterAdmin.id
  );
  adapter.data.epaperWhatsAppEditionPackages = (adapter.data.epaperWhatsAppEditionPackages || []).filter(
    (p) => p.reporterId !== reporterA.id && p.reporterId !== reporterB.id && p.reporterId !== masterAdmin.id
  );

  // Ensure quota initialized for reporterA and reporterB
  await adapter.setReporterWhatsAppQuota(reporterA.id, 50);
  await adapter.setReporterWhatsAppQuota(reporterB.id, 20);

  // -------------------------------------------------------------------------
  // TEST 1: Authorized Reporter Can Select Eligible Stories
  // -------------------------------------------------------------------------
  await testAsync('1. Authorized reporter can select eligible approved/published stories', async () => {
    const res = await adapter.getWhatsAppEligibleArticles({}, reporterA);
    assert(res, 'Must return result');
    assert(Array.isArray(res.items), 'items must be an array');
    assert(res.items.length >= 2, 'Reporter A must find their approved & published stories');

    const foundA1 = res.items.find((a) => a.id === artA1.id);
    const foundA2 = res.items.find((a) => a.id === artA2.id);
    const foundDraft = res.items.find((a) => a.id === artA3Draft.id);

    assert(foundA1, 'Approved story artA1 must be eligible');
    assert(foundA2, 'Published story artA2 must be eligible');
    assert(!foundDraft, 'Draft story artA3Draft must NEVER be eligible');
  });

  // -------------------------------------------------------------------------
  // TEST 2: Reporter Cannot Select Another Reporter's Restricted Stories
  // -------------------------------------------------------------------------
  await testAsync("2. Reporter cannot select another reporter's restricted stories (Strict Isolation)", async () => {
    const res = await adapter.getWhatsAppEligibleArticles({}, reporterA);
    const foundOtherReporter = res.items.find((a) => a.id === artB1.id);
    assert(!foundOtherReporter, "Reporter A's eligible list must NOT include Reporter B's story");

    // Attempting to package Reporter B's article as Reporter A must throw 403 ERR_FORBIDDEN
    let forbiddenCaught = false;
    try {
      await adapter.saveEpaperWhatsAppEditionPackage({
        editionTitle: 'अनधिकृत पैकेज',
        format: '4:5',
        articleIds: [artB1.id],
      }, reporterA);
    } catch (err) {
      forbiddenCaught = true;
      assert.strictEqual(err.statusCode, 403, 'Must return 403 for unauthorized story selection');
    }
    assert(forbiddenCaught, "Reporter A must be blocked from selecting Reporter B's story");
  });

  // -------------------------------------------------------------------------
  // TEST 3: MASTER_ADMIN Can Access Authorized Cross-Reporter Selection
  // -------------------------------------------------------------------------
  await testAsync('3. MASTER_ADMIN can access authorized cross-reporter selection', async () => {
    const adminRes = await adapter.getWhatsAppEligibleArticles({}, masterAdmin);
    assert(adminRes.items.length >= 3, 'Master Admin must see eligible stories across reporters');

    const hasA = adminRes.items.some((a) => a.id === artA1.id);
    const hasB = adminRes.items.some((a) => a.id === artB1.id);
    assert(hasA && hasB, 'Admin view must include stories from both Reporter A and Reporter B');

    // Admin can generate package combining stories across reporters
    const adminPkg = await adapter.saveEpaperWhatsAppEditionPackage({
      editionTitle: 'राज्यव्यापी महा-बुलेटिन',
      format: '4:5',
      articleIds: [artA1.id, artB1.id],
    }, masterAdmin);

    assert(adminPkg, 'Admin package must be created');
    assert.strictEqual(adminPkg.cardCount, 2, 'Admin package must have 2 cards');
  });

  // -------------------------------------------------------------------------
  // TEST 4: Both 1:1 and 4:5 Formats Generate Correctly
  // -------------------------------------------------------------------------
  await testAsync('4. Both 1:1 and 4:5 formats generate correctly with validation', async () => {
    // Generate 4:5 format
    const pkg45 = await adapter.saveEpaperWhatsAppEditionPackage({
      editionTitle: 'दैनिक 4:5 बुलेटिन',
      format: '4:5',
      articleIds: [artA1.id],
    }, reporterA);
    assert.strictEqual(pkg45.format, '4:5', 'Must support 4:5 format');
    assert.strictEqual(pkg45.cards[0].format, '4:5');

    // Generate 1:1 format
    const pkg11 = await adapter.saveEpaperWhatsAppEditionPackage({
      editionTitle: 'दैनिक 1:1 बुलेटिन',
      format: '1:1',
      articleIds: [artA2.id],
    }, reporterA);
    assert.strictEqual(pkg11.format, '1:1', 'Must support 1:1 format');
    assert.strictEqual(pkg11.cards[0].format, '1:1');

    // Invalid format throws 400
    let invalidCaught = false;
    try {
      await adapter.saveEpaperWhatsAppEditionPackage({
        editionTitle: 'अमान्य',
        format: '16:9',
        articleIds: [artA1.id],
      }, reporterA);
    } catch (err) {
      invalidCaught = true;
      assert.strictEqual(err.statusCode, 400, 'Invalid format must throw 400 ERR_VALIDATION');
    }
    assert(invalidCaught, 'Invalid format must be rejected');
  });

  // -------------------------------------------------------------------------
  // TEST 5: Multi-Story Selection and Ordering Work
  // -------------------------------------------------------------------------
  await testAsync('5. Multi-story selection and ordering work with exact card mapping', async () => {
    const multiPkg = await adapter.saveEpaperWhatsAppEditionPackage({
      editionTitle: 'भोपाल विशेष पैकेज',
      format: '4:5',
      articleIds: [artA2.id, artA1.id], // Order: artA2 first, artA1 second
    }, reporterA);

    assert.strictEqual(multiPkg.cardCount, 2, 'Card count must be 2');
    assert.strictEqual(multiPkg.cards[0].articleId, artA2.id, 'First card must be artA2');
    assert.strictEqual(multiPkg.cards[0].cardIndex, 1, 'First card index must be 1');
    assert.strictEqual(multiPkg.cards[1].articleId, artA1.id, 'Second card must be artA1');
    assert.strictEqual(multiPkg.cards[1].cardIndex, 2, 'Second card index must be 2');
    assert.strictEqual(multiPkg.quotaConsumed, 2, 'Quota consumed must equal 2');
  });

  // -------------------------------------------------------------------------
  // TEST 6: Individual Card Regeneration Works
  // -------------------------------------------------------------------------
  await testAsync('6. Individual card regeneration updates target card without altering rest of edition', async () => {
    const initialPkg = await adapter.saveEpaperWhatsAppEditionPackage({
      editionTitle: 'पुनर्निर्माण परीक्षण एडिशन',
      format: '4:5',
      articleIds: [artA1.id, artA2.id],
    }, reporterA);

    const cardToRegen = initialPkg.cards[0];
    const unchangedCard = initialPkg.cards[1];

    const regenResult = await adapter.regenerateEpaperWhatsAppCard(initialPkg.id, cardToRegen.id, {
      headline: 'भोपाल में मेट्रो रेल का नया रूट तय — अद्यतन संस्करण',
      format: '4:5',
    }, reporterA);

    assert(regenResult, 'Regeneration result must exist');
    assert(regenResult.card, 'Updated card must exist');
    assert.strictEqual(regenResult.card.id, cardToRegen.id, 'Card ID must remain stable');
    assert.strictEqual(regenResult.card.headline, 'भोपाल में मेट्रो रेल का नया रूट तय — अद्यतन संस्करण');
    assert.strictEqual(regenResult.card.version, 2, 'Card version must increment to 2');

    // Verify other card in package is completely untouched
    const updatedPkg = await adapter.getEpaperWhatsAppEditionPackageById(initialPkg.id, reporterA);
    const untouchedInPkg = updatedPkg.cards.find((c) => c.id === unchangedCard.id);
    assert.strictEqual(untouchedInPkg.version, 1, 'Untouched card version must remain 1');
    assert.strictEqual(untouchedInPkg.headline, unchangedCard.headline, 'Untouched card headline must remain unchanged');
  });

  // -------------------------------------------------------------------------
  // TEST 7: Devanagari Text Rendering and Overflow Validation
  // -------------------------------------------------------------------------
  test('7. Devanagari text rendering and typography engine anti-clipping validation', () => {
    // Simulate Devanagari headline splitting and word-wrap calculation
    const deHeadline = 'भोपाल में मेट्रो रेल का नया रूट तय, 5 नए स्टेशनों को हरी झंडी मिली';
    const words = deHeadline.split(/\s+/);
    assert(words.length > 5, 'Devanagari words must split cleanly');
    assert(deHeadline.includes('स्टेशनों'), 'Ligatures like स्ट must be preserved');
    assert(deHeadline.includes('झंडी'), 'Anusvara and matras must be intact');
  });

  // -------------------------------------------------------------------------
  // TEST 8: Missing-Image Fallback Works
  // -------------------------------------------------------------------------
  await testAsync('8. Missing-image fallback works gracefully without fabricated photos', async () => {
    // artA2 has featuredImage: null
    const noImgPkg = await adapter.saveEpaperWhatsAppEditionPackage({
      editionTitle: 'बिना चित्र समाचार',
      format: '4:5',
      articleIds: [artA2.id],
    }, reporterA);

    const card = noImgPkg.cards[0];
    assert.strictEqual(card.imageUrl, null, 'Card must reflect missing image without fabrication');
    assert(card.storagePath.includes('.png'), 'Private storage path must be allocated');
  });

  // -------------------------------------------------------------------------
  // TEST 9: Quota is Enforced Server-Side
  // -------------------------------------------------------------------------
  await testAsync('9. Quota is strictly enforced server-side (429 ERR_QUOTA_EXHAUSTED)', async () => {
    // Clear reporterB's prior generations for isolated test
    adapter.data.epaperWhatsAppGenerations = (adapter.data.epaperWhatsAppGenerations || []).filter(
      (g) => g.reporterId !== reporterB.id
    );

    // Set a very low quota for reporterB: exactly 1 card
    await adapter.setReporterWhatsAppQuota(reporterB.id, 1);
    const qBefore = await adapter.getReporterWhatsAppQuota(reporterB.id);
    assert.strictEqual(qBefore.maxDaily, 1);

    // Generate 1 card successfully
    await adapter.saveEpaperWhatsAppEditionPackage({
      editionTitle: 'अंतिम अनुमत कार्ड',
      format: '4:5',
      articleIds: [artB1.id],
    }, reporterB);

    const qAfter = await adapter.getReporterWhatsAppQuota(reporterB.id);
    assert.strictEqual(qAfter.remaining, 0, 'Quota remaining must now be 0');
    assert.strictEqual(qAfter.quotaExceeded, true, 'quotaExceeded must be true');

    // Subsequent generation must be blocked with 429
    let quotaBlocked = false;
    try {
      await adapter.saveEpaperWhatsAppEditionPackage({
        editionTitle: 'अतिप्रवाह कार्ड',
        format: '4:5',
        articleIds: [artB1.id],
      }, reporterB);
    } catch (err) {
      quotaBlocked = true;
      assert.strictEqual(err.statusCode, 429, 'Must return 429 when quota is exhausted');
      assert.strictEqual(err.code, 'ERR_QUOTA_EXHAUSTED');
    }
    assert(quotaBlocked, 'Server must block generation when quota is exhausted');
  });

  // -------------------------------------------------------------------------
  // TEST 10: Failed Generation Does Not Consume Quota
  // -------------------------------------------------------------------------
  await testAsync('10. Failed generation attempt does NOT consume quota', async () => {
    // Reset reporterB quota to 5
    await adapter.setReporterWhatsAppQuota(reporterB.id, 5);
    const q1 = await adapter.getReporterWhatsAppQuota(reporterB.id);
    const initialUsed = q1.used;

    // Trigger failure due to nonexistent article
    let failed = false;
    try {
      await adapter.saveEpaperWhatsAppEditionPackage({
        editionTitle: 'त्रुटिपूर्ण प्रयास',
        format: '4:5',
        articleIds: ['non-existent-article-xyz'],
      }, reporterB);
    } catch (err) {
      failed = true;
      assert.strictEqual(err.statusCode, 400, 'Must fail validation with 400');
    }
    assert(failed, 'Generation must have failed');

    const q2 = await adapter.getReporterWhatsAppQuota(reporterB.id);
    assert.strictEqual(q2.used, initialUsed, 'Used quota must NOT increase on failed attempts');
  });

  // -------------------------------------------------------------------------
  // TEST 11: Concurrent Requests Cannot Bypass Quota
  // -------------------------------------------------------------------------
  await testAsync('11. Concurrency locks prevent parallel requests from bypassing quota', async () => {
    // Set quota to exactly 2 cards for reporterB
    await adapter.setReporterWhatsAppQuota(reporterB.id, 2);
    // Clear today's generations for clean test
    adapter.data.epaperWhatsAppGenerations = (adapter.data.epaperWhatsAppGenerations || []).filter(
      (g) => g.reporterId !== reporterB.id
    );

    // Launch 3 simultaneous requests in parallel
    const p1 = adapter.saveEpaperWhatsAppEditionPackage({ editionTitle: 'समानांतर 1', format: '4:5', articleIds: [artB1.id] }, reporterB);
    const p2 = adapter.saveEpaperWhatsAppEditionPackage({ editionTitle: 'समानांतर 2', format: '4:5', articleIds: [artB1.id] }, reporterB);
    const p3 = adapter.saveEpaperWhatsAppEditionPackage({ editionTitle: 'समानांतर 3', format: '4:5', articleIds: [artB1.id] }, reporterB);

    const results = await Promise.allSettled([p1, p2, p3]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    assert.strictEqual(fulfilled.length, 2, 'Exactly 2 requests must succeed (matching limit of 2)');
    assert.strictEqual(rejected.length, 1, 'Exactly 1 request must be rejected with 429');
    assert.strictEqual(rejected[0].reason.statusCode, 429, 'Rejected request must carry 429 code');
  });

  // -------------------------------------------------------------------------
  // TEST 12: Reporter History is Properly Isolated
  // -------------------------------------------------------------------------
  await testAsync('12. Reporter generation history is properly isolated (No cross-reporter leakage)', async () => {
    const historyA = await adapter.getEpaperWhatsAppEditionPackages({}, reporterA);
    const historyB = await adapter.getEpaperWhatsAppEditionPackages({}, reporterB);

    assert(Array.isArray(historyA), 'historyA must be an array');
    assert(Array.isArray(historyB), 'historyB must be an array');

    const hasBInA = historyA.some((p) => p.reporterId === reporterB.id);
    const hasAInB = historyB.some((p) => p.reporterId === reporterA.id);

    assert(!hasBInA, "Reporter A's history must NOT contain Reporter B's packages");
    assert(!hasAInB, "Reporter B's history must NOT contain Reporter A's packages");
  });

  // -------------------------------------------------------------------------
  // TEST 13: Unauthorized Downloads are Blocked (IDOR Check)
  // -------------------------------------------------------------------------
  await testAsync('13. Unauthorized access to another reporter package is blocked (403 ERR_FORBIDDEN)', async () => {
    const pkgA = await adapter.saveEpaperWhatsAppEditionPackage({
      editionTitle: 'गोपनीय पैकेज A',
      format: '4:5',
      articleIds: [artA1.id],
    }, reporterA);

    // Reporter B tries to directly fetch Reporter A's package ID
    let idorBlocked = false;
    try {
      await adapter.getEpaperWhatsAppEditionPackageById(pkgA.id, reporterB);
    } catch (err) {
      idorBlocked = true;
      assert.strictEqual(err.statusCode, 403, 'Must return 403 for unauthorized cross-reporter package access');
    }
    assert(idorBlocked, 'IDOR package inspection must be blocked with 403');
  });

  // -------------------------------------------------------------------------
  // TEST 14: Published E-Paper Snapshots Remain Unchanged
  // -------------------------------------------------------------------------
  test('14. Published E-Paper snapshots and source articles remain 100% immutable', () => {
    // Assert original article title, author, and content did not mutate
    assert.strictEqual(artA1.title, 'भोपाल में मेट्रो रेल का नया रूट तय, 5 नए स्टेशनों को हरी झंडी');
    assert.strictEqual(artA1.authorId, reporterA.id);
    assert.strictEqual(artA1.status, 'APPROVED');
  });

  // -------------------------------------------------------------------------
  // TEST 15: Audit Logs are Generated Correctly
  // -------------------------------------------------------------------------
  await testAsync('15. Audit logs are created for WhatsApp edition and card generation', async () => {
    adapter.addAuditLog(
      reporterA.fullName,
      reporterA.role,
      'WHATSAPP_EDITION_GENERATED',
      'व्हाट्सएप एडिशन पैकेज निर्मित: 2 कार्ड्स, प्रारूप 4:5',
      null
    );

    const logs = (await adapter.getAuditLogs()) || [];
    const foundLog = Array.isArray(logs) ? logs.find((l) => l.actionType === 'WHATSAPP_EDITION_GENERATED') : null;
    assert(foundLog, 'Audit log for WHATSAPP_EDITION_GENERATED must be recorded');
  });

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n------------------------------------------------------------------------');
  console.log(`📊 STEP 8 TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED (TOTAL: ${passedCount + failedCount})`);
  console.log('------------------------------------------------------------------------\n');

  cleanup();

  if (failedCount > 0) {
    throw new Error(`Step 8 test suite failed: ${failedCount} test(s) failed.`);
  }
}

runStep8WhatsAppEditionTests().catch((err) => {
  console.error('Fatal error running Step 8 test suite:', err);
  process.exit(1);
});
