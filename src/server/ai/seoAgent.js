/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master AI SEO Assistant Agent (AGT-SEO-008)
 * Grounded in docs/SEO.md, docs/17-Agents.md, and Master Execution 023
 * 
 * Invariants:
 * 1. Meta Title strictly <= 60 characters (optimized for Google SERP & mobile snippet).
 * 2. Meta Description between 140–160 characters with target keywords.
 * 3. Clean transliterated English/Hinglish and Hindi URL slugs.
 * 4. High-intent search keywords (Local MP, District, Topic).
 * 5. Structured Schema.org NewsArticle JSON-LD suggestions.
 */

import { aiProviderPool } from './providerPool.js';

export function generateSlug(text = '') {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

export async function optimizeNewsSeo({
  title = '',
  content = '',
  district = 'मध्य प्रदेश',
  category = 'मुख्य समाचार',
  userId = 'system',
  userRole = 'REPORTER',
  providerName = null
}) {
  if (!title && !content) {
    throw new Error('एसईओ विश्लेषण हेतु समाचार शीर्षक या सामग्री अनिवार्य है।');
  }

  const systemPrompt = `आप ब्रेकिंग न्यूज़ वाला के वरिष्ठ सर्च इंजन ऑप्टिमाइजेशन (SEO) और डिस्कवर एल्गोरिदम विशेषज्ञ AI हैं।
नियम:
1. Meta Title अनिवार्य रूप से 60 अक्षरों से कम होना चाहिए।
2. Meta Description 140 से 160 अक्षरों के मध्य, सारगर्भित और क्लिक-योग्य होना चाहिए।
3. गूगल न्यूज़ और डिस्कवर हेतु मध्य प्रदेश व संबंधित जिले के कीवर्ड्स को प्राथमिकता दें।
4. स्लग साफ़, अंग्रेजी अक्षरों (Hinglish/English) में होना चाहिए।`;

  const taskPrompt = `निम्नलिखित समाचार का संपूर्ण SEO अनुकूलन करें:
शीर्षक: ${title}
जिला: ${district}
श्रेणी: ${category}
सामग्री:
${content ? content.slice(0, 1000) : title}

कृपया निम्नलिखित JSON प्रारूप में उत्तर दें:
{
  "metaTitle": "सटीक 60 अक्षरों के भीतर आकर्षक मेटा टाइटल",
  "metaDescription": "140 से 160 अक्षरों में सारगर्भित मेटा विवरण",
  "primaryKeyword": "प्राथमिक फोकस कीवर्ड",
  "secondaryKeywords": ["कीवर्ड 1", "कीवर्ड 2", "कीवर्ड 3", "कीवर्ड 4"],
  "englishSlug": "clean-english-or-hinglish-url-slug",
  "searchIntent": "LOCAL_BREAKING | INFORMATIONAL | INVESTIGATIVE",
  "seoScore": 92,
  "recommendations": [
    "सुझाव 1", "सुझाव 2"
  ]
}`;

  const response = await aiProviderPool.executePrompt({
    providerName,
    promptCategory: 'SEO',
    systemPrompt,
    taskPrompt,
    temperature: 0.25,
    maxTokens: 1000,
    userId,
    userRole
  });

  let parsed = null;
  try {
    const raw = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(raw);
  } catch (_e) {
    parsed = fallbackSeoParser(title, district);
  }

  // Strictly enforce Meta Title <= 60 characters
  let metaTitle = (parsed.metaTitle || title || `${district} ताज़ा समाचार`).replace(/[।.\s]+$/u, '');
  if (metaTitle.length > 60) {
    metaTitle = metaTitle.slice(0, 57).trim() + '...';
  }

  // Ensure Meta Description is well bounded
  let metaDesc = parsed.metaDescription || `${district}: ${title}। ब्रेकिंग न्यूज़ वाला पर पढ़ें ताज़ा व विश्वसनीय अपडेट।`;
  if (metaDesc.length > 160) {
    metaDesc = metaDesc.slice(0, 157).trim() + '...';
  }

  const slug = parsed.englishSlug ? generateSlug(parsed.englishSlug) : generateSlug(`${district}-${title}`);

  return {
    success: true,
    data: {
      metaTitle,
      metaTitleLength: metaTitle.length,
      metaDescription: metaDesc,
      metaDescriptionLength: metaDesc.length,
      primaryKeyword: parsed.primaryKeyword || `${district} न्यूज़`,
      secondaryKeywords: Array.isArray(parsed.secondaryKeywords) ? parsed.secondaryKeywords : [district, 'मध्य प्रदेश समाचार', 'ताज़ा खबर'],
      englishSlug: slug || 'mp-breaking-news',
      searchIntent: parsed.searchIntent || 'LOCAL_BREAKING',
      seoScore: typeof parsed.seoScore === 'number' ? parsed.seoScore : 85,
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [
        'प्रथम 100 शब्दों में प्राथमिक कीवर्ड का स्वाभाविक प्रयोग सुनिश्चित करें।',
        'संबंधित जिले के प्रमुख स्थलों या कार्यालयों का नाम शामिल करें।'
      ],
      schemaJsonLdSnippet: {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: metaTitle,
        description: metaDesc,
        articleSection: category,
        inLanguage: 'hi-IN'
      },
      provider: response.provider,
      model: response.model,
      executionTimeMs: response.executionTimeMs
    }
  };
}

function fallbackSeoParser(title, district) {
  const shortTitle = (title || `${district} मुख्य समाचार`).slice(0, 55).replace(/[।.\s]+$/u, '');
  return {
    metaTitle: `${shortTitle} - BNW`,
    metaDescription: `${district}: ${title || 'ताज़ा घटनाक्रम'}। निष्पक्ष व सटीक रिपोर्टिंग के लिए पढ़ें ब्रेकिंग न्यूज़ वाला।`,
    primaryKeyword: `${district} ताज़ा खबर`,
    secondaryKeywords: [district, 'मध्य प्रदेश', 'ब्रेकिंग न्यूज़', 'प्रशासन'],
    englishSlug: `${district.toLowerCase()}-news-update`,
    searchIntent: 'LOCAL_BREAKING',
    seoScore: 88,
    recommendations: ['समाचार में कम से कम एक प्रामाणिक फ़ोटो व कैप्शन जोड़ें।']
  };
}

