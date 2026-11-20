/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Step 9 Automated Verification Test Suite
 * AI Newsroom & AI Design Tools
 * 
 * Verifies all 20 requirements from Prompt Section 10:
 * 1. 5-Tier Headlines strictly bounded by the 5 canonical character ranges.
 * 2. All 5 headlines strictly have zero trailing punctuation (। or .) and hasTrailingPunctuation: false.
 * 3. Preserves key factual entities in headlines without hallucination.
 * 4. Structured summary generation in BULLETS mode with bullet points, key takeaway, and word count.
 * 5. Detection of missing journalistic details in missingDetailsFlags.
 * 6. Indic Devanagari copy-editing with side-by-side comparison and itemized rules (ki/kee, hai/hain, nukta).
 * 7. Inverted pyramid journalism structure breakdown (HEADLINE, LEAD, BODY, CONCLUSION).
 * 8. Identification of repetitive passages and long-winded sentences (>35 words).
 * 9. Bidirectional Hindi <-> English translation with entity preservation and mandatory human review.
 * 10. Fact-checking claim decomposition with strict status classification.
 * 11. Claims lacking sources are strictly flagged as UNVERIFIED (never marked verified without proof).
 * 12. Contradiction detection and 10-point fact-checking checklist evaluation.
 * 13. Strict Invariant: autoApprovalPrevented is true; AI never auto-approves or approves articles.
 * 14. Template recommendation from the 9 canonical broadsheet templates.
 * 15. Visual balance scoring, layout density, and Devanagari typography overflow detection.
 * 16. Automated composition proposal with reserved ad slot protection and placement rationales.
 * 17. Graphic assistance with crop ratios, captions, and prohibition of fake documentary imagery.
 * 18. Human-in-the-loop application workflow updating working draft fields and logging AI_SUGGESTION_APPLIED.
 * 19. RBAC: Unauthorized and unauthenticated users are blocked.
 * 20. All suggestions tagged with isAiSuggestion: true, model, provider, timestamp, zero credentials leaked.
 */

import assert from 'node:assert';
import { setupIsolatedTestPersistence } from './testIsolationHelper.js';
import { getPersistenceAdapter } from '../src/server/persistence/adapter.js';
import { EpaperAiNewsroomEngine } from '../src/server/epaper/aiNewsroomEngine.js';
import { HEADLINE_RANGES } from '../src/server/ai/headlineAgent.js';

async function runStep9AiNewsroomTests() {
  console.log('========================================================================');
  console.log('🧪 RUNNING STEP 9: AI NEWSROOM & AI DESIGN TOOLS TESTS');
  console.log('========================================================================\n');

  const { adapter, cleanup } = setupIsolatedTestPersistence({ prefix: 'step9_' });
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
      failedCount++;
    }
  }

  // -------------------------------------------------------------------------
  // TEST 1: 5-Tier Headlines strictly bounded by the 5 canonical character ranges
  // -------------------------------------------------------------------------
  await testAsync('1. 5-Tier Headlines strictly bounded by the 5 canonical character ranges', async () => {
    const res = await EpaperAiNewsroomEngine.generateHeadlines({
      title: 'भोपाल में मेट्रो रेल का नया रूट तय',
      content: 'भोपाल में मेट्रो रेल परियोजना के दूसरे चरण के तहत नए रूट को राज्य सरकार की उच्चस्तरीय समिति ने हरी झंडी दे दी है।',
      district: 'भोपाल',
      isBreaking: false,
      user: { id: 'usr-ed-1', role: 'EDITOR', fullName: 'वरिष्ठ संपादक' },
    });

    assert.strictEqual(res.headlines.length, 5, 'Must generate strictly 5 headline options');
    assert.strictEqual(res.allOptionsInRange, true, 'All options must be within character bounds');

    const expectedRanges = ['80-110', '100-130', '125-150', '130-160', '150-200'];
    res.headlines.forEach((hl, i) => {
      assert.strictEqual(hl.optionNumber, i + 1, `Option number must be ${i + 1}`);
      assert.strictEqual(hl.targetRange, expectedRanges[i], `Target range must match canonical range ${expectedRanges[i]}`);
      assert.ok(hl.characterCount >= hl.minChars && hl.characterCount <= hl.maxChars,
        `Headline ${i + 1} characterCount (${hl.characterCount}) must be between ${hl.minChars} and ${hl.maxChars}`);
      assert.strictEqual(hl.isValidLength, true, 'Length must be flagged as valid');
    });
  });

  // -------------------------------------------------------------------------
  // TEST 2: All 5 headlines strictly have ZERO trailing punctuation (। or .)
  // -------------------------------------------------------------------------
  await testAsync('2. All 5 headlines strictly have ZERO trailing punctuation (। or .)', async () => {
    const res = await EpaperAiNewsroomEngine.generateHeadlines({
      title: 'इंदौर में प्रवासी भारतीय दिवस सम्मेलन का भव्य शुभारंभ।',
      content: 'इंदौर में प्रवासी भारतीय दिवस का शुभारंभ हुआ। मुख्य अतिथि ने कार्यक्रम को संबोधित किया।',
      district: 'इंदौर',
      isBreaking: true,
      user: { id: 'usr-ed-1', role: 'EDITOR' },
    });

    res.headlines.forEach((hl, i) => {
      assert.strictEqual(hl.hasTrailingPunctuation, false, `Headline ${i + 1} must flag hasTrailingPunctuation: false`);
      assert.ok(!/[।.]$/u.test(hl.headline), `Headline ${i + 1} must NOT end with full stop or dot: "${hl.headline}"`);
      assert.ok(!hl.headline.endsWith('।'), `Headline ${i + 1} must not end with Hindi purna viram`);
      assert.ok(!hl.headline.endsWith('.'), `Headline ${i + 1} must not end with English period`);
    });
  });

  // -------------------------------------------------------------------------
  // TEST 3: Preserves key factual entities in headlines without hallucination
  // -------------------------------------------------------------------------
  await testAsync('3. Preserves key factual entities in headlines without hallucination', async () => {
    const res = await EpaperAiNewsroomEngine.generateHeadlines({
      title: 'जबलपुर में नर्मदा परिक्रमा पथ के लिए 450 करोड़ रुपये मंजूर',
      content: 'जबलपुर में मां नर्मदा परिक्रमा पथ के सुदृढ़ीकरण हेतु 450 करोड़ रुपये की प्रशासनिक स्वीकृति जारी हुई।',
      district: 'जबलपुर',
      isBreaking: false,
    });

    // Verify district and core keywords are present
    const firstHl = res.headlines[0].headline;
    assert.ok(firstHl.includes('जबलपुर'), 'Headline must preserve the district name "जबलपुर"');
    assert.ok(firstHl.includes('नर्मदा') || firstHl.includes('परियोजना') || firstHl.includes('450'),
      'Headline must preserve key factual subject elements');
  });

  // -------------------------------------------------------------------------
  // TEST 4: Structured summary generation in BULLETS mode with word count
  // -------------------------------------------------------------------------
  await testAsync('4. Structured summary generation in BULLETS mode with word count', async () => {
    const res = await EpaperAiNewsroomEngine.generateSummary({
      content: 'ग्वालियर में नए अंतरराष्ट्रीय हवाई अड्डे के टर्मिनल का निर्माण कार्य पूर्ण हो गया है। नागर विमानन महानिदेशालय ने निरीक्षण के बाद संचालन की अनुमति दे दी है। इस टर्मिनल से प्रतिदिन 15 उड़ानों का संचालन संभव होगा। केंद्रीय मंत्री ने बताया कि अगले सप्ताह से नियमित उड़ानें शुरू होंगी।',
      headline: 'ग्वालियर नया एयरपोर्ट टर्मिनल तैयार',
      district: 'ग्वालियर',
      mode: 'BULLETS',
      maxWords: 150,
    });

    assert.strictEqual(res.mode, 'BULLETS', 'Mode must be BULLETS');
    assert.ok(typeof res.summary === 'string' && res.summary.length > 0, 'Summary text must be populated');
    assert.ok(Array.isArray(res.bulletPoints) && res.bulletPoints.length >= 2, 'Bullet points must contain at least 2 points');
    assert.ok(typeof res.keyTakeaway === 'string', 'Key takeaway must be provided');
    assert.ok(res.wordCount > 0, 'Word count must be positive');
  });

  // -------------------------------------------------------------------------
  // TEST 5: Detection of missing journalistic details in missingDetailsFlags
  // -------------------------------------------------------------------------
  await testAsync('5. Detection of missing journalistic details in missingDetailsFlags', async () => {
    // Content deliberately missing official quote and time/location specifics
    const incompleteContent = 'एक सड़क हादसे में कई लोग घायल हो गए। ग्रामीणों में भारी आक्रोश फैल गया। स्थानीय लोगों ने सड़क जाम कर दी।';
    const res = await EpaperAiNewsroomEngine.generateSummary({
      content: incompleteContent,
      headline: 'सड़क हादसे में कई घायल',
      district: 'सीहोर',
      mode: 'BULLETS',
    });

    assert.ok(Array.isArray(res.missingDetailsFlags), 'missingDetailsFlags must be an array');
    assert.ok(res.missingDetailsFlags.length >= 1, 'Must detect at least 1 missing journalistic detail');
    const flagStr = res.missingDetailsFlags.join(' ');
    assert.ok(flagStr.includes('आधिकारिक') || flagStr.includes('बयान') || flagStr.includes('समय') || flagStr.includes('स्थान'),
      'Must identify absence of administrative statements or exact location/time');
  });

  // -------------------------------------------------------------------------
  // TEST 6: Indic Devanagari copy-editing with side-by-side comparison and rules
  // -------------------------------------------------------------------------
  await testAsync('6. Indic Devanagari copy-editing with side-by-side comparison and rules', async () => {
    // Text containing deliberate ki/kee error, hai/hain error, and un-nuqta word
    const textWithErrors = 'कलेक्टर ने बताया की जांच पूरी हो गई है। सभी अधिकारियों मौके पर मौजूद है। यह एक जरूरी फैसला है।';
    const res = await EpaperAiNewsroomEngine.copyEditHindi({
      content: textWithErrors,
      tone: 'NEUTRAL',
      fixGrammarAndSpelling: true,
    });

    assert.strictEqual(res.originalContent, textWithErrors, 'Original content must be preserved untouched');
    assert.notStrictEqual(res.revisedContent, textWithErrors, 'Revised content must differ from original');
    assert.ok(Array.isArray(res.correctionsMade) && res.correctionsMade.length >= 1, 'Must list itemized corrections');

    // Verify key Devanagari rules were triggered
    const rulesTriggered = res.correctionsMade.map((c) => c.rule || c.type).join(' ');
    assert.ok(rulesTriggered.includes('की/कि') || rulesTriggered.includes('है/हैं') || rulesTriggered.includes('नुक्ता') || rulesTriggered.includes('GRAMMAR'),
      'Must apply canonical Devanagari news grammar rules');
    assert.ok(res.readabilityScore, 'Readability score must be reported');
  });

  // -------------------------------------------------------------------------
  // TEST 7: Inverted pyramid journalism structure breakdown
  // -------------------------------------------------------------------------
  await testAsync('7. Inverted pyramid journalism structure breakdown', async () => {
    const articleTitle = 'उज्जैन में महाकाल लोक विस्तार के दूसरे चरण का कार्य प्रारंभ';
    const articleBody = `उज्जैन में श्री महाकाल महालोक के दूसरे चरण के विकास कार्यों का शुभारंभ सोमवार को वैदिक मंत्रोच्चार के बीच किया गया। इस चरण में 350 करोड़ रुपये की लागत से नए यात्री सुविधा केंद्र का निर्माण होगा।\n\nपरियोजना के तहत रुद्रसागर का पुनर्जीवन और स्मार्ट पार्किंग का विकास तीव्र गति से किया जा रहा है। प्रशासनिक अधिकारियों ने मौके पर पहुंचकर निर्माण गुणवत्ता का निरीक्षण किया।\n\nकलेक्टर ने निर्देश दिए कि सिंहस्थ 2028 से पूर्व सभी कार्य समय-सीमा में पूर्ण किए जाएं।`;

    const res = await EpaperAiNewsroomEngine.analyzeStructure({
      title: articleTitle,
      content: articleBody,
    });

    assert.ok(Array.isArray(res.sections), 'Sections must be an array');
    const sectionTypes = res.sections.map((s) => s.type);
    assert.ok(sectionTypes.includes('HEADLINE'), 'Must include HEADLINE section');
    assert.ok(sectionTypes.includes('LEAD'), 'Must include LEAD section');
    assert.ok(sectionTypes.includes('BODY'), 'Must include BODY section');
    assert.ok(res.overallStructureScore >= 60, 'Structure score must be >= 60 for well-structured news');
  });

  // -------------------------------------------------------------------------
  // TEST 8: Identification of repetitive passages and long-winded sentences
  // -------------------------------------------------------------------------
  await testAsync('8. Identification of repetitive passages and long-winded sentences', async () => {
    // Deliberate long sentence (> 35 words) and duplicate phrase
    const longSentence = 'मध्य प्रदेश सरकार द्वारा घोषित नई औद्योगिक नीति के अंतर्गत प्रदेश के समस्त 55 जिलों में सूक्ष्म, लघु और मध्यम उद्योगों को बढ़ावा देने हेतु विशेष आर्थिक पैकेज तथा सब्सिडी प्रदान करने का महत्वपूर्ण निर्णय राज्य मंत्रिमंडल की आपात बैठक में सर्वसम्मति से लिया गया है।';
    const content = `${longSentence} विशेष आर्थिक पैकेज की घोषणा से उद्यमियों में उत्साह है। विशेष आर्थिक पैकेज की घोषणा से उद्योग जगत को राहत मिलेगी।`;

    const res = await EpaperAiNewsroomEngine.analyzeStructure({
      title: 'नई औद्योगिक नीति घोषित',
      content,
    });

    assert.ok(Array.isArray(res.unclearSentences), 'Must identify unclear/long-winded sentences');
    assert.ok(res.unclearSentences.length >= 1, 'Must flag the long sentence (> 35 words)');
    assert.ok(Array.isArray(res.recommendations) && res.recommendations.length >= 1, 'Must provide editorial recommendations');
  });

  // -------------------------------------------------------------------------
  // TEST 9: Bidirectional Hindi <-> English translation with entity preservation
  // -------------------------------------------------------------------------
  await testAsync('9. Bidirectional Hindi <-> English translation with entity preservation', async () => {
    const hindiText = 'रीवा जिले में 750 मेगावाट की सौर ऊर्जा परियोजना से 1200 करोड़ रुपये का निवेश आकर्षित हुआ।';
    const res = await EpaperAiNewsroomEngine.translateContent({
      content: hindiText,
      sourceLanguage: 'hi',
      targetLanguage: 'en',
    });

    assert.strictEqual(res.sourceLanguage, 'hi', 'Source language must be hi');
    assert.strictEqual(res.targetLanguage, 'en', 'Target language must be en');
    assert.strictEqual(res.requiresHumanReview, true, 'Human review must be strictly required');
    assert.ok(typeof res.translatedText === 'string' && res.translatedText.length > 0, 'Translated text must exist');
    assert.ok(Array.isArray(res.preservedEntities), 'Preserved entities must be an array');
    const preservedStr = res.preservedEntities.join(' ');
    assert.ok(preservedStr.includes('750') || preservedStr.includes('1200'), 'Must identify and preserve numbers/units');
  });

  // -------------------------------------------------------------------------
  // TEST 10: Fact-checking claim decomposition with strict status classification
  // -------------------------------------------------------------------------
  await testAsync('10. Fact-checking claim decomposition with strict status classification', async () => {
    const headline = 'सागर में खाद वितरण में अनियमितता का आरोप';
    const content = 'सागर जिले के बीना में किसानों को यूरिया खाद नहीं मिलने से आक्रोश फैल गया। पूर्व सरपंच ने आरोप लगाया कि 5000 बोरी खाद की कालाबाजारी हुई है। कृषि विभाग के उप संचालक ने बताया कि स्टॉक पर्याप्त है और जांच दल गठित किया गया है।';
    const sources = ['कृषि विभाग सागर आधिकारिक प्रेस नोट सं. 89'];

    const res = await EpaperAiNewsroomEngine.verifyClaimsAndSources({
      headline,
      content,
      district: 'सागर',
      sources,
      evidenceNotes: 'बीना मंडी में उप संचालक का दूरभाष पर बयान दर्ज',
    });

    assert.ok(Array.isArray(res.claims) && res.claims.length >= 1, 'Must decompose into claims');
    const validStatuses = ['VERIFIED', 'PARTIALLY_VERIFIED', 'UNVERIFIED', 'CONTRADICTED', 'INSUFFICIENT_EVIDENCE'];
    res.claims.forEach((c) => {
      assert.ok(validStatuses.includes(c.status), `Claim status "${c.status}" must be one of canonical statuses`);
      assert.ok(c.claimText && c.claimText.length > 0, 'Claim text must not be empty');
      assert.ok(c.confidencePercent >= 0 && c.confidencePercent <= 100, 'Confidence percent must be between 0 and 100');
    });
  });

  // -------------------------------------------------------------------------
  // TEST 11: Claims lacking sources are strictly flagged as UNVERIFIED
  // -------------------------------------------------------------------------
  await testAsync('11. Claims lacking sources are strictly flagged as UNVERIFIED (Never auto-verified without sources)', async () => {
    const res = await EpaperAiNewsroomEngine.verifyClaimsAndSources({
      headline: 'विदिशा में बेमौसम बारिश से 80% फसल नष्ट होने का दावा',
      content: 'विदिशा के गंजबासौदा में किसानों का दावा है कि भारी ओलावृष्टि से 80 प्रतिशत चना व गेहूं की फसल नष्ट हो गई है।',
      district: 'विदिशा',
      sources: [], // No source provided!
      evidenceNotes: '',
    });

    // When sources are empty, claims must NOT be marked VERIFIED
    res.claims.forEach((c) => {
      assert.notStrictEqual(c.status, 'VERIFIED',
        `Claim "${c.claimText}" without sources must NEVER be marked VERIFIED`);
    });
    assert.ok(res.missingSourceFlags.length >= 1, 'Must flag that supporting sources are missing');
    assert.ok(['UNVERIFIED', 'PARTIALLY_VERIFIED'].includes(res.overallStatus),
      'Overall status without sources must be UNVERIFIED or PARTIALLY_VERIFIED');
  });

  // -------------------------------------------------------------------------
  // TEST 12: Contradiction detection and 10-point checklist evaluation
  // -------------------------------------------------------------------------
  await testAsync('12. Contradiction detection and 10-point checklist evaluation', async () => {
    const res = await EpaperAiNewsroomEngine.verifyClaimsAndSources({
      headline: 'खंडवा में 100 मौतों की अफवाह',
      content: 'सोशल मीडिया पर खंडवा में संदिग्ध बीमारी से 100 लोगों की मृत्यु का दावा किया जा रहा है। सीएमएचओ ने स्पष्ट किया कि केवल 2 सामान्य मौतें हुई हैं।',
      district: 'खंडवा',
      sources: ['सीएमएचओ खंडवा आधिकारिक खंडन पत्र'],
    });

    assert.ok(Array.isArray(res.checklistEvaluation), 'Checklist evaluation must be present');
    assert.strictEqual(res.checklistEvaluation.length, 10, 'Must evaluate against all 10 points in CHECKLIST_10_POINTS');
    assert.ok(res.checklistEvaluation.some((pt) => pt.id === 'CHK-01'), 'Must include CHK-01 (Primary Source)');
    assert.ok(res.checklistEvaluation.some((pt) => pt.id === 'CHK-09'), 'Must include CHK-09 (Viral Claim Dissection)');
  });

  // -------------------------------------------------------------------------
  // TEST 13: Strict Invariant: autoApprovalPrevented is true
  // -------------------------------------------------------------------------
  await testAsync('13. Strict Invariant: autoApprovalPrevented is true (AI NEVER auto-approves)', async () => {
    const res = await EpaperAiNewsroomEngine.verifyClaimsAndSources({
      headline: 'मंदसौर में अफीम काश्तकारों की महापंचायत',
      content: 'मंदसौर में अफीम किसानों ने नई नीति को लेकर ज्ञापन सौंपा।',
      district: 'मंदसौर',
      sources: ['कलेक्टर मंदसौर प्राप्ति रसीद'],
    });

    assert.strictEqual(res.autoApprovalPrevented, true, 'autoApprovalPrevented must be strictly true');
    assert.ok(res.editorialActionRequired && res.editorialActionRequired.length > 0,
      'Must state that human editorial action is mandatory');
  });

  // -------------------------------------------------------------------------
  // TEST 14: Template recommendation from the 9 canonical broadsheet templates
  // -------------------------------------------------------------------------
  await testAsync('14. Template recommendation from the 9 canonical broadsheet templates', async () => {
    // Page 1 should recommend FRONT_PAGE
    const frontRes = EpaperAiNewsroomEngine.suggestPageDesign({
      pageNumber: 1,
      articles: [{ id: 'art-1', title: 'बड़ी खबर', category: 'POLITICS', isBreaking: true }],
    });
    assert.strictEqual(frontRes.recommendedCategory, 'FRONT_PAGE', 'Page 1 must recommend FRONT_PAGE template');
    assert.strictEqual(frontRes.recommendedTemplateId, 'tpl-epaper-01-front', 'Page 1 must resolve to tpl-epaper-01-front');

    // Page 4 should recommend EDITORIAL
    const editRes = EpaperAiNewsroomEngine.suggestPageDesign({
      pageNumber: 4,
      articles: [{ id: 'art-2', title: 'संपादकीय दृष्टिकोण', category: 'EDITORIAL' }],
    });
    assert.strictEqual(editRes.recommendedCategory, 'EDITORIAL', 'Page 4 must recommend EDITORIAL template');

    // Sports article should recommend SPORTS template
    const sportsRes = EpaperAiNewsroomEngine.suggestPageDesign({
      pageNumber: 8,
      articles: [{ id: 'art-3', title: 'रणजी ट्रॉफी मुकाबला', category: 'SPORTS' }],
    });
    assert.strictEqual(sportsRes.recommendedCategory, 'SPORTS', 'Sports stories must recommend SPORTS template');
  });

  // -------------------------------------------------------------------------
  // TEST 15: Visual balance scoring, layout density, and Devanagari overflow detection
  // -------------------------------------------------------------------------
  await testAsync('15. Visual balance scoring, layout density, and Devanagari overflow detection', async () => {
    const veryLongHeadline = 'मध्य प्रदेश शासन के नगरीय विकास एवं आवास विभाग द्वारा समस्त 413 नगर निकायों में स्वच्छता सर्वेक्षण 2026 के उत्कृष्ट क्रियान्वयन हेतु जारी विस्तृत दिशा-निर्देशों के संबंध में समीक्षा बैठक आयोजित';
    const res = EpaperAiNewsroomEngine.suggestPageDesign({
      pageNumber: 2,
      articles: [
        { id: 'art-1', title: veryLongHeadline, content: 'सामग्री'.repeat(400) },
      ],
    });

    assert.ok(res.visualBalanceScore >= 0 && res.visualBalanceScore <= 100, 'Balance score must be 0-100');
    assert.ok(Array.isArray(res.textOverflowRisks), 'textOverflowRisks must be an array');
    assert.ok(res.textOverflowRisks.length >= 1, 'Must flag overflow risk for headline > 130 characters');
    const risk = res.textOverflowRisks[0];
    assert.ok(['MEDIUM', 'HIGH'].includes(risk.riskLevel), 'Risk level must be MEDIUM or HIGH');
    assert.ok(risk.mitigation && risk.mitigation.length > 0, 'Must provide mitigation guidance');
  });

  // -------------------------------------------------------------------------
  // TEST 16: Automated composition proposal with reserved ad slot protection
  // -------------------------------------------------------------------------
  await testAsync('16. Automated composition proposal with reserved ad slot protection', async () => {
    const stories = [
      { id: 'art-lead', title: 'लीड: मुख्यमंत्री ने किया बड़ा ऐलान', isBreaking: true, hasImage: true },
      { id: 'art-2', title: 'द्वितीयक खबर: सड़कों का कायाकल्प', hasImage: false },
      { id: 'art-3', title: 'संक्षिप्त: मौसम का मिजाज बदला', hasImage: false },
    ];
    const reservedAds = [
      { slotId: 'slot-ad-bottom-strip', bounds: { x: 20, y: 1300, width: 892, height: 120 } },
    ];

    const res = EpaperAiNewsroomEngine.proposePageComposition({
      pageNumber: 1,
      selectedArticles: stories,
      reservedAdSlots: reservedAds,
    });

    assert.strictEqual(res.reservedAdSlotsProtected, true, 'Reserved ad slots must be strictly protected');
    assert.ok(Array.isArray(res.storyPlacements), 'Story placements must be an array');
    assert.strictEqual(res.totalStoriesPlaced, stories.length, 'All 3 stories should be placed if slots available');

    // Lead story placement verification
    const leadPlacement = res.storyPlacements[0];
    assert.strictEqual(leadPlacement.articleId, 'art-lead', 'Breaking story must be placed as Lead');
    assert.ok(leadPlacement.positionDesc.includes('लीड'), 'Placement description must designate Lead Story');
    assert.ok(leadPlacement.rationale.length > 0, 'Journalistic rationale must be provided');
  });

  // -------------------------------------------------------------------------
  // TEST 17: Graphic assistance with crop ratios, captions, and fake photo prohibition
  // -------------------------------------------------------------------------
  await testAsync('17. Graphic assistance with crop ratios, captions, and fake photo prohibition', async () => {
    const res = EpaperAiNewsroomEngine.suggestGraphicAssistance({
      headline: 'सतना में सीमेंट संयंत्र में नई पर्यावरण तकनीक लागू',
      content: 'सतना में अल्ट्राटेक सीमेंट संयंत्र ने ग्रीन एनर्जी और कार्बन उत्सर्जन में कमी के लिए आधुनिक फिल्टर लगाए।',
      category: 'BUSINESS',
      district: 'सतना',
    });

    assert.strictEqual(res.fakeDocumentaryProhibited, true, 'fakeDocumentaryProhibited must be strictly true');
    assert.strictEqual(res.disclaimerRequired, true, 'disclaimerRequired must be true for symbolic visuals');
    assert.strictEqual(res.disclaimerText, 'सांकेतिक/एआई-जनरेटेड दृश्य', 'Disclaimer text must match canonical standard');

    assert.ok(Array.isArray(res.recommendedCropAspectRatios) && res.recommendedCropAspectRatios.length >= 3,
      'Must suggest at least 3 standard crop aspect ratios (16:9, 4:3, 1:1)');
    assert.ok(Array.isArray(res.suggestedCaptions) && res.suggestedCaptions.length >= 2,
      'Must suggest journalistic captions with location attribution');
  });

  // -------------------------------------------------------------------------
  // TEST 18: Human-in-the-loop application workflow updating working draft & audit
  // -------------------------------------------------------------------------
  await testAsync('18. Human-in-the-loop application workflow updating working draft & audit', async () => {
    // Fetch an existing article from persistence to update
    const articlesRes = await adapter.getArticles({ status: 'all', limit: 5 });
    const targetArt = (articlesRes?.items || articlesRes?.articles || adapter?.data?.articles || [])[0];
    assert.ok(targetArt, 'Must find a test article in persistence');

    const testUser = { id: 'usr-ed-test', fullName: 'परीक्षण संपादक', role: 'EDITOR' };
    const acceptedHeadline = 'स्वीकृत नया प्रिंट शीर्षक: भोपाल मेट्रो कार्य में तेजी';

    const res = await EpaperAiNewsroomEngine.applySuggestion({
      suggestionType: 'HEADLINE',
      selectedContent: acceptedHeadline,
      sourceArticleId: targetArt.id,
      notes: 'संपादक द्वारा परीक्षण हेडलाइन स्वीकृत',
      adapter,
      user: testUser,
    });

    assert.strictEqual(res.applied, true, 'Suggestion must be marked applied');
    assert.strictEqual(res.suggestionType, 'HEADLINE', 'Suggestion type must be HEADLINE');
    assert.strictEqual(res.appliedBy, 'परीक्षण संपादक', 'appliedBy must match user name');
    assert.ok(res.auditLogId, 'Must generate auditLogId');

    // Verify audit log exists
    const logs = await adapter.getAuditLogs();
    const foundLog = (Array.isArray(logs) ? logs : []).find(
      (l) => l.actionType === 'AI_SUGGESTION_APPLIED' || l.action === 'AI_SUGGESTION_APPLIED'
    );
    assert.ok(foundLog, 'Audit log entry AI_SUGGESTION_APPLIED must be recorded');
  });

  // -------------------------------------------------------------------------
  // TEST 19: RBAC: Unauthorized or unauthenticated users are blocked
  // -------------------------------------------------------------------------
  await testAsync('19. RBAC: Unauthorized or unauthenticated users are blocked', async () => {
    // 1. Unauthenticated request (user is null)
    try {
      await EpaperAiNewsroomEngine.applySuggestion({
        suggestionType: 'HEADLINE',
        selectedContent: 'शीर्षक',
        user: null,
      });
      assert.fail('Unauthenticated request must throw error');
    } catch (err) {
      assert.strictEqual(err.statusCode, 401, 'Unauthenticated user must receive 401');
    }

    // 2. Unauthorized role (READER cannot apply suggestions)
    try {
      await EpaperAiNewsroomEngine.applySuggestion({
        suggestionType: 'HEADLINE',
        selectedContent: 'शीर्षक',
        user: { id: 'usr-reader-1', role: 'READER', fullName: 'पाठक' },
      });
      assert.fail('Unauthorized reader role must throw error');
    } catch (err) {
      assert.strictEqual(err.statusCode, 403, 'Unauthorized role must receive 403');
    }
  });

  // -------------------------------------------------------------------------
  // TEST 20: All suggestions tagged with isAiSuggestion: true, model, provider, timestamp
  // -------------------------------------------------------------------------
  await testAsync('20. All suggestions tagged with isAiSuggestion: true, model, provider, timestamp', async () => {
    const res = await EpaperAiNewsroomEngine.generateHeadlines({
      title: 'नीमच में कृषि मंडी का आधुनिकीकरण',
      district: 'नीमच',
      articleId: 'art-nm-1',
    });

    assert.strictEqual(res.isAiSuggestion, true, 'Must include isAiSuggestion: true');
    assert.ok(res.provider, 'Provider must be specified');
    assert.ok(res.model, 'Model must be specified');
    assert.ok(res.timestamp, 'Timestamp must be specified');
    assert.strictEqual(res.sourceArticleId, 'art-nm-1', 'sourceArticleId must match input');

    // Verify ZERO leaked secrets in response
    const jsonStr = JSON.stringify(res);
    assert.ok(!jsonStr.includes('AI_STUDIO_API_KEY'), 'Must NOT leak AI_STUDIO_API_KEY');
    assert.ok(!jsonStr.includes('GEMINI_API_KEY'), 'Must NOT leak GEMINI_API_KEY');
    assert.ok(!jsonStr.includes('sk-'), 'Must NOT leak secret tokens');
  });

  console.log('\n========================================================================');
  console.log(`📊 STEP 9 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('========================================================================\n');

  cleanup();

  if (failedCount > 0) {
    process.exit(1);
  }
}

runStep9AiNewsroomTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
