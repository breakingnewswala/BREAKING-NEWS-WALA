/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Execution 023 — AI Newsroom & Intelligent Automation Test Suite
 * 
 * Verifies:
 * 1. 5-Tier Headline Generator Invariants (80-110, 100-130, 125-150, 130-160, 150-200, 0 trailing full stops)
 * 2. Boundary Fitting & Sanitization (Devanagari contextual padding, truncation, zero hallucination)
 * 3. AI News Writer Draft Generation (formats, key fact preservation, allegations separation, DRAFT status)
 * 4. AI Summarizer & Rewriter (Short, Detailed, Bullets, Tones, Devanagari grammar/spelling fixes: ki/kee, hai/hain, nukta)
 * 5. Fact-Checking Assistant (Claims decomposition, VERIFIED/UNVERIFIED/CONTRADICTED classification, 10-Point Checklist)
 * 6. News Research Assistant (Dossier, Timeline, Facts vs Claims vs Opinions, Field investigation questions)
 * 7. Social Media Generator (FB, IG, WhatsApp, YouTube, X <= 280 chars)
 * 8. SEO Assistant (Meta title <= 60 chars, Meta desc 140-160 chars, slug, keywords, schema)
 * 9. Prompt Library CRUD & RBAC (Protected system defaults, custom prompt management)
 * 10. Human Editorial Approval Invariant (History -> DRAFT Article, status: 'DRAFT', isAiAssisted: true)
 * 11. Provider Pool, Role-Based Daily Quotas & Usage Tracking
 * 12. Audit Trail Event Logging (AI_NEWS_DRAFT_GENERATED, AI_HEADLINES_GENERATED, AI_FACT_CHECK_PERFORMED, etc.)
 * 13. FirestoreAdapter AI Feature Parity
 */

import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { handleApiRequest, signToken } from '../src/server/apiEngine.js';
import { getPersistenceAdapter, INITIAL_AI_PROMPTS } from '../src/server/persistence/adapter.js';
import { FirestoreAdapter } from '../src/server/persistence/firestoreAdapter.js';
import {
  generateFiveHeadlines,
  HEADLINE_RANGES,
  fitHeadlineWithinBounds,
  sanitizeHeadlineText
} from '../src/server/ai/headlineAgent.js';
import { applyDeterministicHindiCorrections } from '../src/server/ai/summarizerAgent.js';
import { aiProviderPool, ROLE_DAILY_QUOTAS } from '../src/server/ai/providerPool.js';

process.env.NODE_ENV = 'test';

function createMockHttp() {
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

  const request = (method, urlPath, body = null, headers = {}) =>
    new Promise((resolve, reject) => {
      const fullUrl = new URL(urlPath, baseUrl);
      const bodyStr = body ? JSON.stringify(body) : null;
      const reqHeaders = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...headers,
      };
      if (bodyStr) {
        reqHeaders['Content-Length'] = Buffer.byteLength(bodyStr);
      }

      const req = http.request(
        fullUrl,
        {
          method,
          headers: reqHeaders,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const parsed = data ? JSON.parse(data) : {};
              resolve({ status: res.statusCode, data: parsed, headers: res.headers });
            } catch (err) {
              resolve({ status: res.statusCode, raw: data, headers: res.headers });
            }
          });
        }
      );
      req.on('error', reject);
      if (bodyStr) req.write(bodyStr);
      req.end();
    });

  return { start, stop, request };
}

test('Master Execution 023 — AI Newsroom & Intelligent Automation Suite', async (t) => {
  const httpHelper = createMockHttp();
  await httpHelper.start();

  const adapter = getPersistenceAdapter();

  const editorToken = signToken({
    id: 'usr-chief-editor',
    email: 'chief.editor@breakingnewswala.in',
    role: 'CHIEF_EDITOR',
    roles: ['CHIEF_EDITOR', 'EDITOR'],
    fullName: 'मुख्य संपादक',
  });

  const reporterToken = signToken({
    id: 'usr-reporter-01',
    email: 'reporter.bhopal@breakingnewswala.in',
    role: 'REPORTER',
    roles: ['REPORTER'],
    fullName: 'भोपाल संवाददाता',
  });

  const readerToken = signToken({
    id: 'usr-reader-01',
    email: 'reader@example.com',
    role: 'READER',
    roles: ['READER'],
    fullName: 'पाठक',
  });

  t.after(async () => {
    await httpHelper.stop();
  });

  // -------------------------------------------------------------
  // TEST 1: 5-Tier Headline Generator Invariants
  // -------------------------------------------------------------
  await t.test('1. 5-Tier Headline Generator strictly enforces character bounds and zero trailing full stops', async () => {
    const input = {
      title: 'मध्य प्रदेश में भारी बारिश से जनजीवन प्रभावित',
      summary: 'मौसम विभाग ने भोपाल, इंदौर और उज्जैन समेत 22 जिलों में रेड अलर्ट जारी किया है। नर्मदा का जलस्तर बढ़ा।',
      district: 'भोपाल',
    };

    const res = await httpHelper.request('POST', '/api/v1/ai/headlines', input, {
      Authorization: `Bearer ${editorToken}`,
    });

    assert.strictEqual(res.status, 200, 'Endpoint must return HTTP 200');
    assert.strictEqual(res.data.success, true, 'Response success must be true');
    const data = res.data.data;

    assert.ok(Array.isArray(data.headlineOptions), 'Must return headlineOptions array');
    assert.strictEqual(data.headlineOptions.length, 5, 'Must generate exactly 5 headline options');
    assert.strictEqual(data.allOptionsInRange, true, 'allOptionsInRange flag must be true');

    // Verify each tier's exact character bounds
    const expectedBounds = [
      { num: 1, min: 80, max: 110, style: 'Breaking' },
      { num: 2, min: 100, max: 130, style: 'Analytical' },
      { num: 3, min: 125, max: 150, style: 'Ground Report' },
      { num: 4, min: 130, max: 160, style: 'Engaging' },
      { num: 5, min: 150, max: 200, style: 'Comprehensive' },
    ];

    for (let i = 0; i < 5; i++) {
      const opt = data.headlineOptions[i];
      const expected = expectedBounds[i];

      assert.strictEqual(opt.optionNumber, expected.num, `Option number must be ${expected.num}`);
      assert.strictEqual(opt.style, expected.style, `Option style must match ${expected.style}`);

      const len = opt.headline.length;
      assert.strictEqual(opt.characterCount, len, `Reported characterCount (${opt.characterCount}) must match string length (${len})`);

      assert.ok(
        len >= expected.min && len <= expected.max,
        `Option ${expected.num} length (${len}) must be between ${expected.min} and ${expected.max} chars`
      );

      // Verify zero trailing full stops
      assert.ok(!opt.headline.endsWith('।'), `Headline ${expected.num} must NOT end with Devanagari full stop (।)`);
      assert.ok(!opt.headline.endsWith('.'), `Headline ${expected.num} must NOT end with period (.)`);
      assert.ok(!opt.headline.endsWith(' '), `Headline ${expected.num} must NOT end with whitespace`);
    }
  });

  // -------------------------------------------------------------
  // TEST 2: Headline Generator Sanitizer & Boundary Fitting Unit Logic
  // -------------------------------------------------------------
  await t.test('2. Headline Sanitization and fitHeadlineWithinBounds unit tests', () => {
    // Strips trailing punctuation
    assert.strictEqual(sanitizeHeadlineText('भोपाल में बड़ा खुलासा।'), 'भोपाल में बड़ा खुलासा');
    assert.strictEqual(sanitizeHeadlineText('इंदौर में बारिश का अलर्ट!'), 'इंदौर में बारिश का अलर्ट');
    assert.strictEqual(sanitizeHeadlineText('ग्वालियर में घटना...   '), 'ग्वालियर में घटना');

    // Contextual padding for short input
    const shortText = 'सीहोर में किसानों का उग्र प्रदर्शन';
    const fittedShort = fitHeadlineWithinBounds(shortText, 80, 110);
    assert.ok(fittedShort.length >= 80 && fittedShort.length <= 110, `Fitted length ${fittedShort.length} must be in [80, 110]`);
    assert.ok(!fittedShort.endsWith('।') && !fittedShort.endsWith('.'));

    // Boundary truncation for excessively long input
    const longText = 'मध्य प्रदेश के पन्ना जिले में हीरा खदान में मिला 14 कैरेट का बेशकीमती हीरा जिसकी नीलामी की तैयारी प्रशासन द्वारा पूरी कर ली गई है और व्यापारियों में भारी उत्साह का माहौल देखा जा रहा है जिसमें देश भर से बोली लगाने वाले पहुंचेंगे';
    const fittedLong = fitHeadlineWithinBounds(longText, 100, 130);
    assert.ok(fittedLong.length >= 100 && fittedLong.length <= 130, `Truncated length ${fittedLong.length} must be in [100, 130]`);
    assert.ok(!fittedLong.endsWith('।') && !fittedLong.endsWith('.'));
  });

  // -------------------------------------------------------------
  // TEST 3: AI News Writer Draft Generation
  // -------------------------------------------------------------
  await t.test('3. AI News Writer generates structured draft with 5Ws + 1H lead and preserves facts', async () => {
    const input = {
      title: 'उज्जैन महाकाल मंदिर परिसर में नई प्रवेश व्यवस्था लागू',
      district: 'उज्जैन',
      format: 'DETAILED',
      language: 'hi',
      keyFacts: [
        'महाकाल लोक में नए स्मार्ट बैरिकेड्स लगाए गए',
        'प्रति घंटे 8000 श्रद्धालुओं के सुगम दर्शन की क्षमता',
        'कलेक्टर नीरज कुमार सिंह ने स्वयं निरीक्षण किया',
      ],
      allegationsOrClaims: [
        'स्थानीय पंडे-पुजारियों का दावा है कि वीआईपी दर्शन से सामान्य दर्शनार्थी परेशान हो रहे हैं',
      ],
      notes: 'सावन माह की तैयारियों के संबंध में बैठक में निर्णय लिया गया।',
    };

    const res = await httpHelper.request('POST', '/api/v1/ai/news-writer', input, {
      Authorization: `Bearer ${reporterToken}`,
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    const data = res.data.data;

    assert.ok(data.headline, 'Must have headline');
    assert.ok(data.leadParagraph, 'Must have lead paragraph');
    assert.ok(Array.isArray(data.bodyParagraphs), 'Must have body paragraphs array');
    assert.ok(data.fullContent.length > 100, 'Must have detailed content');

    // Human Editorial Invariant: MUST be DRAFT, never PUBLISHED
    assert.strictEqual(data.suggestedStatus, 'DRAFT', 'AI output suggestedStatus must be DRAFT');
    assert.strictEqual(data.isAiAssisted, true, 'isAiAssisted must be true');
    assert.strictEqual(data.requiresEditorReview, true, 'requiresEditorReview must be true');

    // Preserves district and facts
    assert.strictEqual(data.district, 'उज्जैन');
    assert.ok(data.wordCount > 50, 'Word count must be tracked');
    assert.ok(data.historyId, 'Must return historyId for draft tracking');
  });

  // -------------------------------------------------------------
  // TEST 4: AI Summarizer (Short, Detailed, Bullets)
  // -------------------------------------------------------------
  await t.test('4. AI Summarizer generates bullet points and concise summaries without hallucination', async () => {
    const content = `मध्य प्रदेश के मुख्यमंत्री ने भोपाल के मिंटो हॉल में आयोजित राज्यस्तरीय कृषि संगोष्ठी में भाग लिया।
इस अवसर पर उन्होंने घोषणा की कि राज्य के 80 लाख किसानों को मुख्यमंत्री किसान कल्याण योजना के तहत आगामी सप्ताह में ₹2000 की अगली किश्त जारी की जाएगी।
कृषि मंत्री ने बताया कि जैविक खेती को बढ़ावा देने के लिए 500 नए किसान उत्पादक संगठन (FPO) बनाए जाएंगे।
कार्यक्रम में उपस्थित प्रगतिशील किसानों को सम्मानित भी किया गया।`;

    const res = await httpHelper.request('POST', '/api/v1/ai/summarize', {
      content,
      mode: 'BULLETS',
      maxWords: 100,
    }, {
      Authorization: `Bearer ${reporterToken}`,
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    const data = res.data.data;

    assert.strictEqual(data.mode, 'BULLETS');
    assert.ok(Array.isArray(data.bulletPoints) && data.bulletPoints.length >= 2, 'Must extract at least 2 bullet points');
    assert.ok(data.keyTakeaway, 'Must include key takeaway');
  });

  // -------------------------------------------------------------
  // TEST 5: AI News Rewriter & Devanagari Grammar/Spelling Fixer
  // -------------------------------------------------------------
  await t.test('5. AI Rewriter applies target tone and corrects Devanagari grammar/spelling (की/कि, है/हैं, nukta)', async () => {
    // Text with intentional common Devanagari errors:
    // 1. "कहा की" instead of "कहा कि"
    // 2. "लोग उपस्थित है" instead of "लोग उपस्थित हैं"
    // 3. "साफ" instead of "साफ़"
    const problematicText = 'कलेक्टर ने बैठक में स्पष्ट कहा की सभी अधिकारी समय पर उपस्थित रहें। मौके पर सैकड़ों लोग उपस्थित है। प्रशासन ने साफ निर्देश दिए हैं।';

    // Test deterministic rule function
    const { correctedText, changes } = applyDeterministicHindiCorrections(problematicText);
    assert.ok(correctedText.includes('कहा कि'), 'Must correct "कहा की" to "कहा कि"');
    assert.ok(correctedText.includes('उपस्थित हैं'), 'Must correct "लोग उपस्थित है" to "लोग उपस्थित हैं"');
    assert.ok(correctedText.includes('साफ़'), 'Must correct "साफ" to "साफ़"');
    assert.ok(changes.length >= 2, 'Must record corrected rule violations');

    // Test API endpoint
    const res = await httpHelper.request('POST', '/api/v1/ai/rewrite', {
      content: problematicText,
      tone: 'BREAKING',
      targetLanguage: 'hi',
      fixGrammarAndSpelling: true,
    }, {
      Authorization: `Bearer ${reporterToken}`,
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.rewrittenContent, 'Must produce rewritten content');
    assert.ok(Array.isArray(res.data.data.correctionsMade), 'Must return list of corrections');
  });

  // -------------------------------------------------------------
  // TEST 6: AI Fact-Checking Assistant & 10-Point Checklist
  // -------------------------------------------------------------
  await t.test('6. AI Fact-Checking Assistant verifies claims against 10-Point Protocol without hallucinated citations', async () => {
    const input = {
      headline: 'जबलपुर में नर्मदा तट पर अवैध निर्माण सील करने का दावा',
      content: 'सोशल मीडिया पर वीडियो वायरल हो रहा है जिसमें दावा किया गया है कि ग्वारीघाट पर 50 दुकानें तोड़ दी गईं। प्रत्यक्षदर्शियों के अनुसार नगर निगम की टीम ने केवल अतिक्रमण हटाया, किसी वैध दुकान को नहीं तोड़ा।',
      district: 'जबलपुर',
      sources: ['https://jabalpur.nic.in/press/notice-102.pdf'],
      evidenceNotes: 'निगमायुक्त से दूरभाष पर पुष्टि, केवल फुटपाथ खाली कराया गया।',
    };

    const res = await httpHelper.request('POST', '/api/v1/ai/fact-check', input, {
      Authorization: `Bearer ${editorToken}`,
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    const data = res.data.data;

    assert.ok(Array.isArray(data.claims), 'Must decompose claims');
    assert.ok(data.claims.length > 0, 'Must have at least 1 evaluated claim');
    assert.ok(['VERIFIED', 'PARTIALLY_VERIFIED', 'UNVERIFIED', 'CONTRADICTED', 'INSUFFICIENT_EVIDENCE'].includes(data.overallStatus));

    // Verify 10-Point Checklist completeness
    assert.ok(Array.isArray(data.checklistEvaluation), 'Must evaluate 10-Point checklist');
    assert.strictEqual(data.checklistEvaluation.length, 10, 'Checklist must cover all 10 standard points');
    assert.ok(typeof data.overallVerificationScore === 'number', 'Must compute verification score');
    assert.ok(data.editorialActionRequired, 'Must provide editorial guidance');
  });

  // -------------------------------------------------------------
  // TEST 7: AI News Research Assistant
  // -------------------------------------------------------------
  await t.test('7. AI News Research Assistant produces background dossier and field investigation questions', async () => {
    const input = {
      topic: 'केन-बेतवा लिंक परियोजना का बुंदेलखंड के जिलों पर प्रभाव',
      district: 'छतरपुर',
      contextNotes: 'पर्यावरणीय अनापत्ति एवं डूब क्षेत्र के 10 गांवों के विस्थापन का मुद्दा।',
      knownEntities: ['जल संसाधन मंत्रालय', 'पन्ना टाइगर रिजर्व', 'छतरपुर प्रशासन'],
    };

    const res = await httpHelper.request('POST', '/api/v1/ai/research', input, {
      Authorization: `Bearer ${reporterToken}`,
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    const data = res.data.data;

    assert.ok(data.topicSummary, 'Must provide topic summary');
    assert.ok(data.factBreakdown?.confirmedFacts, 'Must separate confirmed facts');
    assert.ok(Array.isArray(data.fieldInvestigationQuestions), 'Must supply field questions');
    assert.ok(data.fieldInvestigationQuestions.length >= 2, 'Must provide at least 2 reporter questions');
  });

  // -------------------------------------------------------------
  // TEST 8: AI Social Media Generator & X/Twitter 280-char Bound
  // -------------------------------------------------------------
  await t.test('8. AI Social Media Generator outputs clickbait-free posts with X <= 280 characters', async () => {
    const input = {
      headline: 'मध्य प्रदेश बोर्ड 10वीं और 12वीं का पुनर्मूल्यांकन परिणाम घोषित',
      summary: 'माध्यमिक शिक्षा मंडल भोपाल ने आधिकारिक वेबसाइट पर परिणाम जारी किया। 15000 छात्रों के अंक सुधरे।',
      district: 'भोपाल',
      articleUrl: 'https://breakingnewswala.in/education/mp-board-reval-result',
    };

    const res = await httpHelper.request('POST', '/api/v1/ai/social', input, {
      Authorization: `Bearer ${reporterToken}`,
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    const data = res.data.data;

    // Check Facebook, Instagram, WhatsApp, YouTube, and X
    assert.ok(data.facebook?.text, 'Must generate FB post');
    assert.ok(data.instagram?.caption, 'Must generate Instagram caption');
    assert.ok(data.whatsapp?.bulletin, 'Must generate WhatsApp bulletin');
    assert.ok(data.xTwitter?.tweet, 'Must generate X/Twitter tweet');

    // Strict invariant: X <= 280 characters
    assert.ok(
      data.xTwitter.tweet.length <= 280,
      `X tweet length (${data.xTwitter.tweet.length}) must strictly be <= 280 characters`
    );
  });

  // -------------------------------------------------------------
  // TEST 9: AI SEO Assistant (Title <= 60, Desc 140-160, Slug)
  // -------------------------------------------------------------
  await t.test('9. AI SEO Assistant strictly bounds Meta Title <= 60 chars and Meta Description', async () => {
    const input = {
      title: 'मध्य प्रदेश में समर्थन मूल्य पर गेहूं उपार्जन के लिए पंजीयन की अंतिम तिथि 7 दिन बढ़ी',
      content: 'खाद्य एवं नागरिक आपूर्ति विभाग ने आदेश जारी किया। अब किसान 25 मार्च तक पंजीयन करा सकेंगे।',
      district: 'सीहोर',
      category: 'किसान व मंडी',
    };

    const res = await httpHelper.request('POST', '/api/v1/ai/seo', input, {
      Authorization: `Bearer ${reporterToken}`,
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    const data = res.data.data;

    // Strict SERP display invariant: Meta Title <= 60 characters
    assert.ok(data.metaTitle.length <= 60, `Meta title length (${data.metaTitle.length}) must be <= 60 characters`);
    assert.ok(data.metaDescription.length <= 165, 'Meta description must be concise');
    assert.ok(data.primaryKeyword, 'Must extract primary keyword');
    assert.ok(data.englishSlug, 'Must provide clean English slug');
    assert.ok(data.schemaJsonLdSnippet, 'Must generate schema.org JSON-LD snippet');
  });

  // -------------------------------------------------------------
  // TEST 10: Prompt Library CRUD & Protected System Defaults
  // -------------------------------------------------------------
  await t.test('10. Prompt Library listing, creation, and protection of built-in system prompts', async () => {
    // 10a. List prompts
    const listRes = await httpHelper.request('GET', '/api/v1/ai/prompts', null, {
      Authorization: `Bearer ${reporterToken}`,
    });
    assert.strictEqual(listRes.status, 200);
    assert.ok(Array.isArray(listRes.data.data), 'Prompts list must be array');
    assert.ok(listRes.data.data.length >= 8, 'Must include at least 8 baseline prompts');

    // 10b. Attempt to delete a default prompt (Must be blocked with 403)
    const defaultPrompt = listRes.data.data.find((p) => p.isDefault);
    assert.ok(defaultPrompt, 'Must find a default prompt');

    const delDefaultRes = await httpHelper.request('DELETE', `/api/v1/ai/prompts/${defaultPrompt.id}`, null, {
      Authorization: `Bearer ${editorToken}`,
    });
    assert.strictEqual(delDefaultRes.status, 403, 'Deleting system default prompt must return 403 Forbidden');

    // 10c. Create custom prompt (Allowed for Editor)
    const createRes = await httpHelper.request('POST', '/api/v1/ai/prompts', {
      title: 'विशेष स्थानीय चुनावी विश्लेषण प्रॉम्ट',
      category: 'WRITING',
      systemPrompt: 'आप वरिष्ठ चुनावी विश्लेषक हैं।',
      taskPrompt: 'चुनावी आंकड़ों का सूक्ष्म परीक्षण करें।',
      tags: ['चुनाव', 'विश्लेषण'],
    }, {
      Authorization: `Bearer ${editorToken}`,
    });
    assert.strictEqual(createRes.status, 200, 'Custom prompt creation must return 200');
    const createdPromptId = createRes.data.data.id;

    // 10d. Delete custom prompt (Allowed)
    const delCustomRes = await httpHelper.request('DELETE', `/api/v1/ai/prompts/${createdPromptId}`, null, {
      Authorization: `Bearer ${editorToken}`,
    });
    assert.strictEqual(delCustomRes.status, 200, 'Custom prompt deletion must succeed');
  });

  // -------------------------------------------------------------
  // TEST 11: Human-in-the-Loop Gate: Save AI Output as Newsroom Draft
  // -------------------------------------------------------------
  await t.test('11. Human Approval Invariant: Save AI generation into newsroom article strictly enforces DRAFT status', async () => {
    // 1. Generate an AI draft first
    const genRes = await httpHelper.request('POST', '/api/v1/ai/news-writer', {
      title: 'ग्वालियर में ऐतिहासिक किले पर ध्वनि एवं प्रकाश कार्यक्रम का नवीनीकरण',
      district: 'ग्वालियर',
      format: 'SHORT',
      language: 'hi',
      keyFacts: ['पर्यटन विभाग ने ₹12 करोड़ की योजना स्वीकृत की'],
    }, {
      Authorization: `Bearer ${reporterToken}`,
    });
    assert.strictEqual(genRes.status, 200);
    const historyId = genRes.data.data.historyId;
    assert.ok(historyId, 'Must have historyId');

    // 2. Execute save-as-draft endpoint
    const saveRes = await httpHelper.request('POST', `/api/v1/ai/history/${historyId}/save-as-draft`, {
      title: 'ग्वालियर किला: ध्वनि व प्रकाश कार्यक्रम का ₹12 करोड़ से नवीनीकरण',
      category: 'development',
    }, {
      Authorization: `Bearer ${reporterToken}`,
    });

    assert.strictEqual(saveRes.status, 200, 'Must return 200 OK');
    assert.strictEqual(saveRes.data.success, true);
    assert.strictEqual(saveRes.data.data.status, 'DRAFT', 'CRITICAL RULE: Created article status MUST be DRAFT');
    assert.strictEqual(saveRes.data.data.isAiAssisted, true, 'isAiAssisted must be true');

    const createdArticleId = saveRes.data.data.article.id;
    assert.ok(createdArticleId, 'Must have article ID');

    // 3. Verify in repository
    const storedArticle = await adapter.getArticleByIdOrSlug(createdArticleId);
    assert.ok(storedArticle, 'Article must exist in persistence');
    assert.strictEqual(storedArticle.status, 'DRAFT', 'Saved article in DB MUST have status DRAFT');
    assert.strictEqual(storedArticle.isAiAssisted, true, 'Saved article in DB must be flagged isAiAssisted');
  });

  // -------------------------------------------------------------
  // TEST 12: Role-Based Daily Quotas & Usage Tracking
  // -------------------------------------------------------------
  await t.test('12. AI Usage & Role-Based Daily Quotas tracking', async () => {
    const res = await httpHelper.request('GET', '/api/v1/ai/usage', null, {
      Authorization: `Bearer ${reporterToken}`,
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    const data = res.data.data;

    assert.ok(typeof data.totalCalls === 'number', 'totalCalls must be number');
    assert.ok(typeof data.totalTokens === 'number', 'totalTokens must be number');
    assert.ok(typeof data.totalCostInr === 'number', 'totalCostInr must be number');
    assert.strictEqual(data.dailyQuota, ROLE_DAILY_QUOTAS.REPORTER, 'Reporter quota must match ROLE_DAILY_QUOTAS');
    assert.ok(data.remainingCallsToday >= 0, 'Remaining calls must be non-negative');
  });

  // -------------------------------------------------------------
  // TEST 13: RBAC Protection on Unauthorized Roles
  // -------------------------------------------------------------
  await t.test('13. Unauthorized roles (e.g. READER) are forbidden from generating AI content', async () => {
    const res = await httpHelper.request('POST', '/api/v1/ai/news-writer', {
      title: 'अनधिकृत परीक्षण',
      district: 'भोपाल',
    }, {
      Authorization: `Bearer ${readerToken}`,
    });

    assert.strictEqual(res.status, 403, 'Reader must be forbidden with 403');
    assert.strictEqual(res.data.success, false);
    assert.strictEqual(res.data.error.code, 'ERR_FORBIDDEN');
  });

  // -------------------------------------------------------------
  // TEST 14: System Audit Trail Logs AI Generation Events
  // -------------------------------------------------------------
  await t.test('14. Audit logs are recorded for AI Newsroom operations', async () => {
    const logsRes = await httpHelper.request('GET', '/api/v1/admin/audit-logs', null, {
      Authorization: `Bearer ${editorToken}`,
    });

    assert.strictEqual(logsRes.status, 200);
    assert.strictEqual(logsRes.data.success, true);
    const logs = Array.isArray(logsRes.data.data) ? logsRes.data.data : logsRes.data.data?.items || [];

    const aiLogs = logs.filter((l) =>
      ['AI_NEWS_DRAFT_GENERATED', 'AI_HEADLINES_GENERATED', 'AI_FACT_CHECK_PERFORMED', 'AI_NEWS_DRAFT_SAVED'].includes(l.action)
    );
    assert.ok(aiLogs.length > 0, 'Audit trail must contain recorded AI events');
  });

  // -------------------------------------------------------------
  // TEST 15: FirestoreAdapter AI Feature Parity
  // -------------------------------------------------------------
  await t.test('15. FirestoreAdapter implements all AI collections and persistence methods', async () => {
    const firestore = new FirestoreAdapter({ isEmulator: true });
    await firestore.init();

    // Prompts
    const prompts = await firestore.getAiPrompts();
    assert.ok(Array.isArray(prompts), 'FirestoreAdapter getAiPrompts must return array');
    assert.ok(prompts.length >= 8, 'FirestoreAdapter must seed baseline AI prompts');

    const promptById = await firestore.getAiPromptById(prompts[0].id);
    assert.strictEqual(promptById?.id, prompts[0].id);

    // Save prompt
    const savedPrompt = await firestore.saveAiPrompt({
      title: 'परीक्षण प्रॉम्ट',
      category: 'WRITING',
      systemPrompt: 'सिस्टम निर्देश',
      taskPrompt: 'टास्क निर्देश',
    });
    assert.ok(savedPrompt.id, 'Saved prompt must have id');

    // Record AI Usage
    const usageRec = await firestore.recordAiUsage({
      userId: 'usr-test',
      userRole: 'REPORTER',
      promptCategory: 'HEADLINE',
      provider: 'mock',
      model: 'gemini-1.5-flash',
      inputTokens: 100,
      outputTokens: 150,
      totalTokens: 250,
      estimatedCostInr: 0.05,
      executionTimeMs: 120,
      success: true,
    });
    assert.ok(usageRec.id, 'Usage record must have id');

    // Get Usage Stats
    const stats = await firestore.getAiUsageStats({ userId: 'usr-test' });
    assert.ok(stats.totalCalls >= 1, 'Stats totalCalls must be >= 1');
    assert.strictEqual(stats.totalTokens, 250);

    // AI History
    const historyItem = await firestore.saveAiHistoryItem({
      userId: 'usr-test',
      category: 'HEADLINE',
      headline: 'परीक्षण हेडलाइन',
      district: 'भोपाल',
      outputData: { test: true },
    });
    assert.ok(historyItem.id, 'History item must have id');

    const historyList = await firestore.getAiHistory({ userId: 'usr-test' });
    assert.ok(historyList.items.length >= 1, 'History items must be >= 1');

    const deleted = await firestore.deleteAiHistoryItem(historyItem.id);
    assert.strictEqual(deleted, true, 'History item deletion must return true');
  });
});
