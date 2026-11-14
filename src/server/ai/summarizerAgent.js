/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master AI Summarizer & Rewriter Agent (AGT-SUM-003 & AGT-EDT-004)
 * Grounded in docs/17-Agents.md, docs/21-Prompts.md, and Master Execution 023
 * 
 * Invariants:
 * 1. Generates concise, structured summaries (Short, Detailed, Bullet Points).
 * 2. Rewrites news articles into specified editorial tones without altering facts.
 * 3. Bidirectional Hindi <-> English translation with journalistic fidelity.
 * 4. Rigorous Devanagari grammar & spelling correction (ki/kee, hai/hain, nukta rules).
 */

import { aiProviderPool } from './providerPool.js';

export const SUMMARY_FORMATS = ['SHORT', 'DETAILED', 'BULLETS'];
export const REWRITE_TONES = ['NEUTRAL', 'BREAKING', 'DISTRICT_VOICE', 'ANALYTICAL', 'EXECUTIVE'];

/**
 * Common Devanagari Hindi Grammar & Spelling Rules (Rule BR-EDT-012)
 */
export function applyDeterministicHindiCorrections(text = '') {
  let corrected = text;
  const changes = [];

  // 1. Conjunction "कि" vs Possessive "की" heuristics
  const verbKiRegex = /(^|[\s।,;!?])(कहा|बताया|बोला|सोचा|माना|देखा|सुना|पाया|लिखा|कहा\s+गया|सूचित\s+किया|फैसला\s+लिया|दावा\s+किया)\s+(की)(?=[\s।,;!?]|$)/gu;
  if (verbKiRegex.test(corrected)) {
    corrected = corrected.replace(verbKiRegex, (match, p1, verb) => {
      changes.push({ rule: 'की/कि नियम', before: `${verb} की`, after: `${verb} कि`, explanation: 'क्रिया के बाद योजक शब्द के रूप में "कि" (ह्रस्व) का प्रयोग शुद्ध है।' });
      return `${p1}${verb} कि`;
    });
  }

  // 2. Plural nasalization "है" vs "हैं" for common honorifics/plurals (लोग, वे, उन्होंने, अधिकारियों, मंत्रियों, पुलिसकर्मियों)
  const pluralHainRegex = /(^|[\s।,;!?])(लोग|वे|उन्होंने|अधिकारियों|नेताओं|नागरिकों|ग्रामीणों|पत्रकारों|सदस्यों|छात्रों)\s+([^।!?\n]{1,60})\s+(है)(?=[\s।,;!?]|$)/gu;
  if (pluralHainRegex.test(corrected)) {
    corrected = corrected.replace(pluralHainRegex, (match, p1, subject, mid) => {
      changes.push({ rule: 'है/हैं बहुवचन नियम', before: `${subject} ${mid} है`, after: `${subject} ${mid} हैं`, explanation: 'बहुवचन कर्ता के साथ अनुनासिक "हैं" का प्रयोग अनिवार्य है।' });
      return `${p1}${subject} ${mid} हैं`;
    });
  }

  // 3. Nuqta corrections for Urdu-origin words standard in Hindi news
  const nuqtaWords = [
    { word: 'ज़्यादा', base: 'ज्यादा' },
    { word: 'ज़रूर', base: 'जरूर' },
    { word: 'ज़रूरी', base: 'जरूरी' },
    { word: 'साफ़', base: 'साफ' },
    { word: 'फ़ैसला', base: 'फैसला' },
    { word: 'काग़ज़ात', base: 'कागजात' },
  ];

  for (const n of nuqtaWords) {
    const reg = new RegExp(`(^|[\\s।,;!?])(${n.base})(?=[\\s।,;!?]|$)`, 'gu');
    if (reg.test(corrected)) {
      corrected = corrected.replace(reg, (match, p1) => `${p1}${n.word}`);
      changes.push({ rule: 'नुक्ता वर्तनी नियम', before: n.base, after: n.word, explanation: `मानक पत्रकारिता वर्तनी में '${n.word}' शुद्ध रूप है।` });
    }
  }

  return { correctedText: corrected, changes };
}

/**
 * Summarizes news content into specified mode.
 */
export async function summarizeNews({
  content = '',
  mode = 'BULLETS',
  maxWords = 150,
  language = 'hi',
  userId = 'system',
  userRole = 'REPORTER',
  providerName = null
}) {
  if (!content || content.trim().length === 0) {
    throw new Error('सारांश बनाने के लिए सामग्री (Content) अनिवार्य है।');
  }

  const systemPrompt = `आप ब्रेकिंग न्यूज़ वाला के संपादकीय सारांश AI एजेंट हैं।
नियम:
1. केवल दिए गए मूल पाठ में से मुख्य तथ्यों का निष्पक्ष सार निकालें।
2. कोई नई जानकारी या अटकलबाजी न जोड़ें।
3. भाषा सटीक देवनागरी हिंदी रखें।`;

  const taskPrompt = `निम्नलिखित समाचार सामग्री का ${mode} प्रारूप में उच्च-गुणवत्ता सारांश प्रस्तुत करें (अधिकतम शब्द: ${maxWords}):

सामग्री:
${content}

प्रारूप निर्देश:
- SHORT: 50-70 शब्दों में सटीक सारगर्भित सारांश।
- DETAILED: 120-160 शब्दों में पृष्ठभूमि, मुख्य घटना और परिणाम सहित सार।
- BULLETS: 4 से 6 बिंदुवार मुख्य तथ्य (प्रत्येक बिंदु '•' से शुरू हो)।

JSON प्रारूप में उत्तर दें:
{
  "summary": "मुख्य सारांश पाठ",
  "bulletPoints": ["बिंदु 1", "बिंदु 2", "बिंदु 3", "बिंदु 4"],
  "keyTakeaway": "1 पंक्ति में मुख्य निष्कर्ष",
  "wordCount": 120
}`;

  const response = await aiProviderPool.executePrompt({
    providerName,
    promptCategory: 'SUMMARIZER',
    systemPrompt,
    taskPrompt,
    temperature: 0.2,
    maxTokens: 800,
    userId,
    userRole
  });

  let parsed = null;
  try {
    const raw = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(raw);
  } catch (_e) {
    // Fallback extraction
    const lines = response.content.split('\n').filter(l => l.trim().length > 0);
    const bullets = lines.filter(l => l.startsWith('•') || l.startsWith('-') || /^\d+\./.test(l))
      .map(l => l.replace(/^[•\-\d.\s]+/, '').trim());

    parsed = {
      summary: response.content,
      bulletPoints: bullets.length > 0 ? bullets : [response.content.slice(0, 120)],
      keyTakeaway: bullets[0] || 'महत्वपूर्ण समाचार सारांश',
      wordCount: response.content.split(/\s+/).length
    };
  }

  return {
    success: true,
    data: {
      mode,
      summary: parsed.summary || parsed.bulletPoints?.join('\n• ') || '',
      bulletPoints: Array.isArray(parsed.bulletPoints) ? parsed.bulletPoints : [],
      keyTakeaway: parsed.keyTakeaway || '',
      wordCount: parsed.wordCount || parsed.summary?.split(/\s+/).length || 0,
      provider: response.provider,
      model: response.model,
      executionTimeMs: response.executionTimeMs
    }
  };
}

/**
 * Rewrites news text into targeted editorial tone or fixes language/grammar.
 */
export async function rewriteNews({
  content = '',
  tone = 'NEUTRAL',
  targetLanguage = 'hi',
  fixGrammarAndSpelling = true,
  userId = 'system',
  userRole = 'REPORTER',
  providerName = null
}) {
  if (!content || content.trim().length === 0) {
    throw new Error('पुनर्लेखन के लिए सामग्री (Content) अनिवार्य है।');
  }

  const { correctedText: preprocessedText, changes: deterministicChanges } = fixGrammarAndSpelling
    ? applyDeterministicHindiCorrections(content)
    : { correctedText: content, changes: [] };

  const systemPrompt = `आप ब्रेकिंग न्यूज़ वाला के वरिष्ठ संपादक व भाषा विशेषज्ञ हैं।
नियम:
1. मूल पाठ के सभी नाम, तिथियां, आंकड़े और तथ्य सुरक्षित रखें।
2. लक्षित शैली (${tone}) और भाषा (${targetLanguage}) में समाचार को प्रभावशाली रूप से पुनर्लेखित करें।
3. व्याकरण (की/कि, है/हैं) और वर्तनी की अशुद्धियों को पूरी तरह दूर करें।`;

  const taskPrompt = `निम्नलिखित समाचार सामग्री का शैली '${tone}' में पुनर्लेखन करें:

मूल सामग्री:
${preprocessedText}

आवश्यकताएं:
- शैली: ${tone} (NEUTRAL = निष्पक्ष, BREAKING = तीव्र गति, DISTRICT_VOICE = स्थानीय ग्रामीण संवाद, ANALYTICAL = गहन विश्लेषण)
- भाषा: ${targetLanguage === 'hi' ? 'शुद्ध देवनागरी हिंदी' : 'Professional English'}
- व्याकरण व वर्तनी सुधार: ${fixGrammarAndSpelling ? 'अनिवार्य' : 'यथावत'}

JSON प्रारूप में उत्तर दें:
{
  "rewrittenContent": "पुनर्लेखित संपूर्ण समाचार पाठ",
  "headline": "नया उपयुक्त शीर्षक",
  "correctionsMade": [
    { "type": "SPELLING/GRAMMAR/TONE", "before": "अशुद्ध अंश", "after": "शुद्ध अंश", "reason": "कारण" }
  ],
  "toneApplied": "${tone}",
  "readabilityScore": "उच्च (Accessible)"
}`;

  const response = await aiProviderPool.executePrompt({
    providerName,
    promptCategory: 'REWRITER',
    systemPrompt,
    taskPrompt,
    temperature: 0.3,
    maxTokens: 1200,
    userId,
    userRole
  });

  let parsed = null;
  try {
    const raw = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(raw);
  } catch (_e) {
    parsed = {
      rewrittenContent: response.content,
      headline: 'संपादित समाचार',
      correctionsMade: deterministicChanges.map(c => ({
        type: 'SPELLING_GRAMMAR',
        before: c.before,
        after: c.after,
        reason: c.explanation
      })),
      toneApplied: tone,
      readabilityScore: 'मानक'
    };
  }

  // Merge deterministic changes with LLM identified corrections
  const allCorrections = [
    ...deterministicChanges.map(c => ({
      type: 'DEV_GRAMMAR_RULE',
      before: c.before,
      after: c.after,
      reason: c.explanation
    })),
    ...(Array.isArray(parsed.correctionsMade) ? parsed.correctionsMade : [])
  ];

  return {
    success: true,
    data: {
      originalContent: content,
      rewrittenContent: parsed.rewrittenContent || response.content,
      headline: (parsed.headline || '').replace(/[।.\s]+$/u, ''),
      toneApplied: parsed.toneApplied || tone,
      targetLanguage,
      correctionsMade: allCorrections,
      readabilityScore: parsed.readabilityScore || 'उत्कृष्ट',
      wordCount: (parsed.rewrittenContent || response.content).split(/\s+/).length,
      provider: response.provider,
      model: response.model,
      executionTimeMs: response.executionTimeMs
    }
  };
}
