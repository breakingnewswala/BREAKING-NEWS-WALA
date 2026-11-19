/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * AI Category Classifier & Broadsheet Page Mapping Engine
 * Grounded in docs/06-Business-Rules.md, docs/17-Agents.md, and docs/12-Database.md
 */

export const CANONICAL_SECTIONS = {
  FRONT_PAGE: 'FRONT_PAGE',
  STATE: 'STATE',
  NATIONAL: 'NATIONAL',
  EDITORIAL: 'EDITORIAL',
  DISTRICT_FOCUS: 'DISTRICT_FOCUS',
  BUSINESS: 'BUSINESS',
  SPORTS: 'SPORTS',
  ENTERTAINMENT: 'ENTERTAINMENT',
  SPECIAL: 'SPECIAL',
};

export const SECTION_PAGE_MAPPING = {
  FRONT_PAGE: { primaryPage: 1, allowedPages: [1], nameHi: 'मुख्य पृष्ठ / ब्रेकिंग न्यूज़' },
  STATE: { primaryPage: 2, allowedPages: [2, 3], nameHi: 'राज्य / मध्य प्रदेश विशेष' },
  EDITORIAL: { primaryPage: 4, allowedPages: [4], nameHi: 'संपादकीय / वैचारिक विमर्श' },
  DISTRICT_FOCUS: { primaryPage: 5, allowedPages: [5, 6], nameHi: 'जिला फोकस / आंचलिक डायरी' },
  BUSINESS: { primaryPage: 7, allowedPages: [7], nameHi: 'व्यापार / मंडी भाव / अर्थजगत' },
  SPORTS: { primaryPage: 8, allowedPages: [8], nameHi: 'खेल जगत / मैदान से' },
  ENTERTAINMENT: { primaryPage: 9, allowedPages: [9], nameHi: 'मनोरंजन / सिनेमा / कला-संस्कृति' },
  NATIONAL: { primaryPage: 10, allowedPages: [10], nameHi: 'देश-विदेश / राष्ट्रीय परिदृश्य' },
  SPECIAL: { primaryPage: 11, allowedPages: [11, 12], nameHi: 'विशेष परिशिष्ट / रविवार स्पेशल' },
};

// 55 Districts of Madhya Pradesh (English + Hindi)
export const MP_55_DISTRICTS = [
  { en: 'Bhopal', hi: 'भोपाल' },
  { en: 'Indore', hi: 'इंदौर' },
  { en: 'Gwalior', hi: 'ग्वालियर' },
  { en: 'Jabalpur', hi: 'जबलपुर' },
  { en: 'Ujjain', hi: 'उज्जैन' },
  { en: 'Sagar', hi: 'सागर' },
  { en: 'Rewa', hi: 'रीवा' },
  { en: 'Satna', hi: 'सतना' },
  { en: 'Chhatarpur', hi: 'छतरपुर' },
  { en: 'Panna', hi: 'पन्ना' },
  { en: 'Damoh', hi: 'दमोह' },
  { en: 'Tikamgarh', hi: 'टीकमगढ़' },
  { en: 'Niwari', hi: 'निवाड़ी' },
  { en: 'Vidisha', hi: 'विदिशा' },
  { en: 'Sehore', hi: 'सीहोर' },
  { en: 'Raisen', hi: 'रायसेन' },
  { en: 'Rajgarh', hi: 'राजगढ़' },
  { en: 'Narmadapuram', hi: 'नर्मदापुरम' },
  { en: 'Hoshangabad', hi: 'होशंगाबाद' },
  { en: 'Harda', hi: 'हरदा' },
  { en: 'Betul', hi: 'बैतूल' },
  { en: 'Morena', hi: 'मुरैना' },
  { en: 'Bhind', hi: 'भिंड' },
  { en: 'Sheopur', hi: 'श्योपुर' },
  { en: 'Shivpuri', hi: 'शिवपुरी' },
  { en: 'Guna', hi: 'गुना' },
  { en: 'Ashoknagar', hi: 'अशोकनगर' },
  { en: 'Datia', hi: 'दतिया' },
  { en: 'Dewas', hi: 'देवास' },
  { en: 'Ratlam', hi: 'रतलाम' },
  { en: 'Shajapur', hi: 'शाजापुर' },
  { en: 'Agar Malwa', hi: 'आगर मालवा' },
  { en: 'Mandsaur', hi: 'मंदसौर' },
  { en: 'Neemuch', hi: 'नीमच' },
  { en: 'Khandwa', hi: 'खंडवा' },
  { en: 'Khargone', hi: 'खरगोन' },
  { en: 'Barwani', hi: 'बड़वानी' },
  { en: 'Burhanpur', hi: 'बुरहानपुर' },
  { en: 'Alirajpur', hi: 'अलीराजपुर' },
  { en: 'Jhabua', hi: 'झाबुआ' },
  { en: 'Dhar', hi: 'धार' },
  { en: 'Katni', hi: 'कटनी' },
  { en: 'Dindori', hi: 'डिंडोरी' },
  { en: 'Mandla', hi: 'मंडला' },
  { en: 'Balaghat', hi: 'बालाघाट' },
  { en: 'Seoni', hi: 'सिवनी' },
  { en: 'Chhindwara', hi: 'छिंदवाड़ा' },
  { en: 'Narsinghpur', hi: 'नरसिंहपुर' },
  { en: 'Singrauli', hi: 'सिंगरौली' },
  { en: 'Sidhi', hi: 'सीधी' },
  { en: 'Shahdol', hi: 'शहडोल' },
  { en: 'Umaria', hi: 'उमरिया' },
  { en: 'Anuppur', hi: 'अनूपपुर' },
  { en: 'Maihar', hi: 'मैहर' },
  { en: 'Pandhurna', hi: 'पांढुर्ना' },
  { en: 'Mauganj', hi: 'मऊगंज' },
];

export class CategoryClassifierEngine {
  static getProviderInfo() {
    return {
      model: 'bnw-mock-v1',
      provider: 'bnw-local-category-analyzer',
      isFallback: true,
      offlineReady: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Classifies an article into a canonical broadsheet section and target page.
   *
   * @param {object} article
   * @param {string} [article.id] - Article identifier
   * @param {string} [article.title] - Article headline
   * @param {string} [article.content] - Full article body
   * @param {string} [article.summary] - Short summary / excerpt
   * @param {string} [article.district] - Associated district name
   * @param {string} [article.category] - Existing category hint
   * @returns {object} Classification result
   */
  static classifyArticle({
    id,
    title = '',
    content = '',
    summary = '',
    district = '',
    category = '',
  } = {}) {
    const safeTitle = typeof title === 'string' ? title : '';
    const safeContent = typeof content === 'string' ? content : '';
    const safeSummary = typeof summary === 'string' ? summary : '';
    const safeDistrict = typeof district === 'string' ? district : '';
    const safeCategory = typeof category === 'string' ? category : '';

    const combinedText = `${safeTitle} ${safeSummary} ${safeContent} ${safeDistrict} ${safeCategory}`.toLowerCase();
    const titleLower = safeTitle.toLowerCase();

    const scores = {
      FRONT_PAGE: 0,
      STATE: 0,
      NATIONAL: 0,
      EDITORIAL: 0,
      DISTRICT_FOCUS: 0,
      BUSINESS: 0,
      SPORTS: 0,
      ENTERTAINMENT: 0,
      SPECIAL: 0,
    };

    const matchedKeywords = {
      FRONT_PAGE: [],
      STATE: [],
      NATIONAL: [],
      EDITORIAL: [],
      DISTRICT_FOCUS: [],
      BUSINESS: [],
      SPORTS: [],
      ENTERTAINMENT: [],
      SPECIAL: [],
    };

    // 1. SPORTS Dictionary
    const sportsKeywords = [
      'cricket', 'क्रिकेट', 'ranji', 'रणजी', 'ipl', 'आईipl', 'hockey', 'हॉकी',
      'football', 'फुटबॉल', 'athletics', 'मैच', 'टूर्नामेंट', 'खिलाड़ी', 'स्टेडियम',
      'पदक', 'मेडल', 'गोल्ड मेडल', 'सिल्वर', 'ओलिंपिक', 'sports academy', 'खेल अकादमी',
      'विश्व कप', 'कप्तान', 'रन', 'विकेट', 'जीत दर्ज'
    ];
    for (const kw of sportsKeywords) {
      if (titleLower.includes(kw)) {
        scores.SPORTS += 6;
        matchedKeywords.SPORTS.push(kw);
      } else if (combinedText.includes(kw)) {
        scores.SPORTS += 2;
        matchedKeywords.SPORTS.push(kw);
      }
    }

    // 2. BUSINESS / MANDI Dictionary
    const businessKeywords = [
      'mandi', 'मंडी', 'सोयाबीन', 'गेहूं', 'चना', 'सरसों', 'भाव', 'दाम', 'क्विंटल',
      'मंडी भाव', 'सर्राफा', 'सोना', 'चांदी', 'bullion', 'sensex', 'सेंसेक्स', 'nifty', 'निफ्टी',
      'शेयर बाजार', 'जीएसटी', 'gst', 'आयकर', 'बजट', 'व्यापार', 'उद्योग', 'कारोबार',
      'कृषि उपज मंडी', 'व्यापारी', 'कर्ज', 'बैंक', 'मुद्रास्फीति', 'दर'
    ];
    for (const kw of businessKeywords) {
      if (titleLower.includes(kw)) {
        scores.BUSINESS += 6;
        matchedKeywords.BUSINESS.push(kw);
      } else if (combinedText.includes(kw)) {
        scores.BUSINESS += 2;
        matchedKeywords.BUSINESS.push(kw);
      }
    }

    // 3. ENTERTAINMENT Dictionary
    const entertainmentKeywords = [
      'cinema', 'सिनेमा', 'फिल्म', 'बॉलीवुड', 'अभिनेता', 'अभिनेत्री', 'कलाकार', 'ott',
      'गायक', 'संगीत', 'तानसेन समारोह', 'खजुराहो नृत्य', 'नाटक', 'थिएटर', 'रंगमंच',
      'डायरेक्टर', 'शूटिंग', 'रिलीज', 'ट्रेलर', 'कला एवं संस्कृति'
    ];
    for (const kw of entertainmentKeywords) {
      if (titleLower.includes(kw)) {
        scores.ENTERTAINMENT += 6;
        matchedKeywords.ENTERTAINMENT.push(kw);
      } else if (combinedText.includes(kw)) {
        scores.ENTERTAINMENT += 2;
        matchedKeywords.ENTERTAINMENT.push(kw);
      }
    }

    // 4. EDITORIAL Dictionary
    const editorialKeywords = [
      'संपादकीय', 'विमर्श', 'दृष्टिकोण', 'ओप-एड', 'आलेख', 'विश्लेषण', 'चिंतन',
      'विचार मंथन', 'नजरिया', 'संपादक की कलम', 'संपादकीय टिप्पणी', 'राय'
    ];
    for (const kw of editorialKeywords) {
      if (titleLower.includes(kw)) {
        scores.EDITORIAL += 8;
        matchedKeywords.EDITORIAL.push(kw);
      } else if (combinedText.includes(kw)) {
        scores.EDITORIAL += 3;
        matchedKeywords.EDITORIAL.push(kw);
      }
    }

    // 5. STATE Dictionary (MP State Governance & Politics)
    const stateKeywords = [
      'मोहन यादव', 'mohan yadav', 'लाडली बहना', 'ladli behna', 'मंत्रालय', 'vallabh bhawan',
      'वल्लभ भवन', 'विधानसभा', 'कैबिनेट', 'mp board', 'mppsc', 'मुख्यमंत्री', 'शिवराज',
      'कमलनाथ', 'दिग्विजय', 'राज्यपाल', 'राज्य सरकार', 'भोपाल मुख्यालय', 'मप्र कैबिनेट'
    ];
    for (const kw of stateKeywords) {
      if (titleLower.includes(kw)) {
        scores.STATE += 6;
        matchedKeywords.STATE.push(kw);
      } else if (combinedText.includes(kw)) {
        scores.STATE += 2.5;
        matchedKeywords.STATE.push(kw);
      }
    }

    // 6. NATIONAL Dictionary
    const nationalKeywords = [
      'नरेंद्र मोदी', 'narendra modi', 'संसद', 'parliament', 'लोकसभा', 'राज्यसभा',
      'सुप्रीम कोर्ट', 'supreme court', 'केंद्र सरकार', 'गृह मंत्रालय', 'विदेश मंत्रालय',
      'भारत सरकार', 'प्रधानमंत्री', 'राष्ट्रपति'
    ];
    for (const kw of nationalKeywords) {
      if (titleLower.includes(kw)) {
        scores.NATIONAL += 6;
        matchedKeywords.NATIONAL.push(kw);
      } else if (combinedText.includes(kw)) {
        scores.NATIONAL += 2.5;
        matchedKeywords.NATIONAL.push(kw);
      }
    }

    // 7. DISTRICT_FOCUS Dictionary (55 MP Districts & Local Administration)
    let foundDistrictKw = false;
    for (const d of MP_55_DISTRICTS) {
      const matchHi = combinedText.includes(d.hi.toLowerCase());
      const matchEn = combinedText.includes(d.en.toLowerCase());
      if (matchHi || matchEn) {
        foundDistrictKw = true;
        scores.DISTRICT_FOCUS += 3;
        matchedKeywords.DISTRICT_FOCUS.push(d.hi);
      }
    }

    const localAdminKeywords = [
      'कलेक्टर', 'एसपी', 'पुलिस अधीक्षक', 'थाना', 'नगर निगम', 'नगर पालिका', 'तहसील',
      'एसडीएम', 'जिला अस्पताल', 'सीएमएचओ', 'जनपद पंचायत', 'सरपंच', 'आंचलिक'
    ];
    for (const kw of localAdminKeywords) {
      if (combinedText.includes(kw)) {
        scores.DISTRICT_FOCUS += 2;
        matchedKeywords.DISTRICT_FOCUS.push(kw);
      }
    }

    // District parameter provided explicitly
    if (safeDistrict) {
      scores.DISTRICT_FOCUS += 4;
      matchedKeywords.DISTRICT_FOCUS.push(safeDistrict);
    }

    // 8. FRONT_PAGE (High-impact Breaking News / Mega Events)
    const breakingKeywords = [
      'breaking', 'ब्रेकिंग', 'बड़ी खबर', 'हादसा', 'विस्फोट', 'आपातकाल', 'ऐतिहासिक फैसला',
      'बड़ा उलटफेर', 'धमाका', 'अलर्ट'
    ];
    for (const kw of breakingKeywords) {
      if (titleLower.includes(kw)) {
        scores.FRONT_PAGE += 7;
        matchedKeywords.FRONT_PAGE.push(kw);
      }
    }

    // Determine the highest scoring canonical section
    let bestSection = CANONICAL_SECTIONS.DISTRICT_FOCUS;
    let highestScore = 0;

    for (const [sec, score] of Object.entries(scores)) {
      if (score > highestScore) {
        highestScore = score;
        bestSection = sec;
      }
    }

    // Fallback if score is 0: check category hint or default
    if (highestScore === 0) {
      const catLower = safeCategory.toLowerCase();
      if (catLower.includes('state') || catLower.includes('राज्य')) bestSection = CANONICAL_SECTIONS.STATE;
      else if (catLower.includes('sport') || catLower.includes('खेल')) bestSection = CANONICAL_SECTIONS.SPORTS;
      else if (catLower.includes('biz') || catLower.includes('व्यापार')) bestSection = CANONICAL_SECTIONS.BUSINESS;
      else if (catLower.includes('ent') || catLower.includes('मनोरंजन')) bestSection = CANONICAL_SECTIONS.ENTERTAINMENT;
      else if (catLower.includes('edit') || catLower.includes('संपादकीय')) bestSection = CANONICAL_SECTIONS.EDITORIAL;
      else if (catLower.includes('nation') || catLower.includes('राष्ट्रीय')) bestSection = CANONICAL_SECTIONS.NATIONAL;
      else bestSection = safeDistrict ? CANONICAL_SECTIONS.DISTRICT_FOCUS : CANONICAL_SECTIONS.STATE;
    }

    // Calculate confidence score (between 0.82 and 0.98)
    const normalizedScore = Math.min(10, highestScore);
    const confidence = Math.round((0.82 + (normalizedScore / 10) * 0.16) * 100) / 100;

    const mapping = SECTION_PAGE_MAPPING[bestSection] || SECTION_PAGE_MAPPING.DISTRICT_FOCUS;
    const suggestedPage = mapping.primaryPage;

    // Generate Hindi reasoning
    const keywordsUsed = matchedKeywords[bestSection].slice(0, 3).join(', ');
    let reasoning = '';
    if (keywordsUsed) {
      reasoning = `लेख में "${keywordsUsed}" जैसे क्षेत्रीय संदर्भ पाए गए, अतः "${mapping.nameHi}" (पृष्ठ ${suggestedPage}) अनुशंसित है।`;
    } else {
      reasoning = `लेख की संरचना एवं विषय वस्तु के आधार पर "${mapping.nameHi}" (पृष्ठ ${suggestedPage}) निर्धारित किया गया।`;
    }

    return {
      articleId: id,
      canonicalSection: bestSection,
      suggestedPage,
      allowedPages: mapping.allowedPages,
      sectionNameHi: mapping.nameHi,
      confidence,
      reasoning,
      keywordsFound: matchedKeywords[bestSection],
      scores,
      metadata: this.getProviderInfo(),
    };
  }
}
