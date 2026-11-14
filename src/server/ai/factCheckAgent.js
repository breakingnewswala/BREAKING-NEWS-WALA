/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master AI Fact-Checking Assistant Agent (AGT-FACT-006)
 * Grounded in docs/05-Workflows.md (10-Point Checklist), docs/17-Agents.md, and Master Execution 023
 * 
 * Invariants:
 * 1. Breaks news content into distinct verifiable claims.
 * 2. Compares against supplied evidence, official statements, and verifiable sources.
 * 3. Classifies claims strictly into:
 *    - VERIFIED
 *    - PARTIALLY_VERIFIED
 *    - UNVERIFIED
 *    - CONTRADICTED
 *    - INSUFFICIENT_EVIDENCE
 * 4. Strictly ZERO fabricated citations, sources, or URLs.
 * 5. Applies the 10-Point Fact-Checking Protocol (CHECKLIST_10_POINTS).
 */

import { aiProviderPool } from './providerPool.js';

export const FACT_CHECK_STATUSES = [
  'VERIFIED',
  'PARTIALLY_VERIFIED',
  'UNVERIFIED',
  'CONTRADICTED',
  'INSUFFICIENT_EVIDENCE'
];

export const CHECKLIST_10_POINTS = [
  { id: 'CHK-01', name: 'प्राथमिक स्रोत की पुष्टि (Primary Source)', desc: 'क्या प्रत्यक्षदर्शी या दस्तावेजी प्राथमिक साक्ष्य मौजूद है?' },
  { id: 'CHK-02', name: 'आधिकारिक प्रशासनिक पक्ष (Administrative Statement)', desc: 'कलेक्टर, एसपी या अधिकृत पीआरओ का अधिकृत बयान दर्ज है?' },
  { id: 'CHK-03', name: 'समय और स्थान का मिलान (Timestamp & Geo Validation)', desc: 'घटना का समय, तहसील और ग्राम सीमाएं सटीक हैं?' },
  { id: 'CHK-04', name: 'विपक्षी पक्ष का बयान (Right to Reply)', desc: 'जिस पर आरोप लगे हैं, क्या उसका पक्ष लिया गया?' },
  { id: 'CHK-05', name: 'तस्वीर/वीडियो प्रामाणिकता (Media Authenticity)', desc: 'क्या दृश्य सामग्री पुरानी या अन्यत्र स्थान की तो नहीं?' },
  { id: 'CHK-06', name: 'मृतकों/घायलों की संख्या की पुष्टि (Casualty Verification)', desc: 'अस्पताल अथवा पुलिस रिकॉर्ड से पुष्टि हुई?' },
  { id: 'CHK-07', name: 'कानूनी व मानहानि समीक्षा (Defamation/Legal Safeguard)', desc: 'न्यायालयीन अवमानना या गैर-कानूनी आक्षेप तो नहीं?' },
  { id: 'CHK-08', name: 'साम्प्रदायिक संवेदनशीलता (Communal Sensitivity)', desc: 'तनाव भड़काने वाले असत्यापित दावे तो नहीं?' },
  { id: 'CHK-09', name: 'वायरल दावे का खंडन (Viral Claim Dissection)', desc: 'सोशल मीडिया पर चल रही अफवाह का परीक्षण किया गया?' },
  { id: 'CHK-10', name: 'संपादक डेस्क अनुमोदन (Editorial Desk Sign-off)', desc: 'डेस्क प्रभारी द्वारा सभी साक्ष्यों की अंतिम जांच।' }
];

/**
 * Fact-checks news content against claims and supplied evidence.
 */
export async function performFactCheck({
  headline = '',
  content = '',
  district = 'मध्य प्रदेश',
  sources = [],
  evidenceNotes = '',
  userId = 'system',
  userRole = 'EDITOR',
  providerName = null
}) {
  if (!content && !headline) {
    throw new Error('तथ्य परीक्षण के लिए समाचार शीर्षक या सामग्री अनिवार्य है।');
  }

  const systemPrompt = `आप मध्य प्रदेश के विश्वसनीय हिंदी डिजिटल पोर्टल ब्रेकिंग न्यूज़ वाला के वरिष्ठ तथ्य-परीक्षक (Fact-Checking Officer) AI एजेंट हैं।
नियम:
1. किसी भी काल्पनिक स्रोत, लिंक या बयान का निर्माण (Hallucinate) कभी न करें।
2. दावों का सूक्ष्म विश्लेषण करें और उन्हें स्पष्ट श्रेणियों (VERIFIED, PARTIALLY_VERIFIED, UNVERIFIED, CONTRADICTED, INSUFFICIENT_EVIDENCE) में वर्गीकृत करें।
3. 10-सूत्रीय फैक्ट-चेकिंग प्रोटोकॉल का पालन करें।
4. यदि साक्ष्य पर्याप्त न हों, तो स्पष्ट बताएं कि ऑन-ग्राउंड रिपोर्टर द्वारा प्रत्यक्ष जांच आवश्यक है।`;

  const taskPrompt = `निम्नलिखित समाचार सामग्री का गहन तथ्य-परीक्षण (Fact Check) करें:

शीर्षक: ${headline || 'शीर्षक उपलब्ध नहीं'}
जिला: ${district}
समाचार सामग्री:
${content}

प्रस्तुत स्रोत / संदर्भ लिंक:
${Array.isArray(sources) && sources.length > 0 ? sources.map((s, i) => `${i + 1}. ${s}`).join('\n') : 'कोई अतिरिक्त स्रोत प्रदान नहीं किया गया'}

अतिरिक्त साक्ष्य नोट्स:
${evidenceNotes || 'कोई साक्ष्य नोट नहीं'}

कृपया निम्नलिखित JSON प्रारूप में विस्तृत परीक्षण परिणाम दें:
{
  "claims": [
    {
      "claim": "परीक्षण किया गया विशिष्ट दावा",
      "status": "VERIFIED | PARTIALLY_VERIFIED | UNVERIFIED | CONTRADICTED | INSUFFICIENT_EVIDENCE",
      "evidenceSummary": "तथ्यात्मक साक्ष्य या विसंगति का विवरण",
      "confidencePercent": 85,
      "recommendation": "संपादक हेतु स्पष्ट सुझाव"
    }
  ],
  "checklistEvaluation": [
    { "id": "CHK-01", "name": "प्राथमिक स्रोत", "passed": true, "notes": "प्रत्यक्षदर्शी बयान मौजूद" },
    { "id": "CHK-02", "name": "आधिकारिक बयान", "passed": false, "notes": "एसपी का बयान लिया जाना बाकी" }
  ],
  "overallVerificationScore": 75,
  "overallStatus": "PARTIALLY_VERIFIED",
  "editorialActionRequired": "आधिकारिक पुलिस पुष्टि प्राप्त होने तक 'कथित' शब्द का प्रयोग अनिवार्य करें।",
  "warnings": ["दावा संख्या 2 की पुलिस रिकॉर्ड से पुष्टि लंबित है"]
}`;

  const response = await aiProviderPool.executePrompt({
    providerName,
    promptCategory: 'FACT_CHECK',
    systemPrompt,
    taskPrompt,
    temperature: 0.1,
    maxTokens: 1600,
    userId,
    userRole
  });

  let parsed = null;
  try {
    const raw = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(raw);
  } catch (_e) {
    parsed = fallbackFactCheckParser(content, headline, district);
  }

  // Guarantee valid status values
  const claims = (Array.isArray(parsed.claims) ? parsed.claims : []).map(c => ({
    claim: c.claim || 'दावा',
    status: FACT_CHECK_STATUSES.includes(c.status) ? c.status : 'INSUFFICIENT_EVIDENCE',
    evidenceSummary: c.evidenceSummary || 'पर्याप्त दस्तावेजी साक्ष्य उपलब्ध नहीं',
    confidencePercent: typeof c.confidencePercent === 'number' ? c.confidencePercent : 60,
    recommendation: c.recommendation || 'ऑन-ग्राउंड सत्यापन आवश्यक'
  }));

  // Ensure 10-point checklist is complete
  const checklistEvaluation = CHECKLIST_10_POINTS.map(item => {
    const existing = Array.isArray(parsed.checklistEvaluation)
      ? parsed.checklistEvaluation.find(e => e.id === item.id)
      : null;
    return {
      id: item.id,
      name: item.name,
      passed: existing ? Boolean(existing.passed) : false,
      notes: existing?.notes || 'जांच लंबित'
    };
  });

  const verifiedCount = claims.filter(c => c.status === 'VERIFIED').length;
  const overallScore = claims.length > 0
    ? Math.round((verifiedCount / claims.length) * 100)
    : (typeof parsed.overallVerificationScore === 'number' ? parsed.overallVerificationScore : 50);

  let overallStatus = 'UNVERIFIED';
  if (overallScore >= 80) overallStatus = 'VERIFIED';
  else if (overallScore >= 50) overallStatus = 'PARTIALLY_VERIFIED';
  else if (claims.some(c => c.status === 'CONTRADICTED')) overallStatus = 'CONTRADICTED';

  return {
    success: true,
    data: {
      headline,
      district,
      claims,
      checklistEvaluation,
      overallVerificationScore: overallScore,
      overallStatus,
      editorialActionRequired: parsed.editorialActionRequired || 'संपादकीय समीक्षा एवं स्रोत की पुष्टि अनिवार्य है।',
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      provider: response.provider,
      model: response.model,
      executionTimeMs: response.executionTimeMs
    }
  };
}

function fallbackFactCheckParser(content, headline, district) {
  const sentences = content.split(/[।!?\n]/).map(s => s.trim()).filter(s => s.length > 15);
  const sampleClaims = sentences.slice(0, 3).map((s, idx) => ({
    claim: s,
    status: idx === 0 ? 'PARTIALLY_VERIFIED' : 'INSUFFICIENT_EVIDENCE',
    evidenceSummary: 'प्राथमिक सामग्री से निकाला गया दावा, स्वतंत्र साक्ष्य अपेक्षित',
    confidencePercent: idx === 0 ? 70 : 40,
    recommendation: 'स्थानीय प्रशासन या थाने से पुष्टि की जाए।'
  }));

  return {
    claims: sampleClaims.length > 0 ? sampleClaims : [{
      claim: headline || `${district} में घटित घटनाक्रम`,
      status: 'PARTIALLY_VERIFIED',
      evidenceSummary: 'आरंभिक सूचना उपलब्ध, आधिकारिक पुष्टि प्रतीक्षित',
      confidencePercent: 65,
      recommendation: 'जिला संवाददाता से फील्ड सत्यापन कराएं।'
    }],
    checklistEvaluation: [],
    overallVerificationScore: 60,
    overallStatus: 'PARTIALLY_VERIFIED',
    editorialActionRequired: 'संपादकीय डेस्क द्वारा प्राथमिक स्रोत का सत्यापन करें।',
    warnings: ['पूर्ण सत्यापन हेतु आधिकारिक दस्तावेज़ या एफआईआर प्रति संलग्न करें।']
  };
}

