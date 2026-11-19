/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Broadsheet Print Advertisement Engine & ASCI Compliance Module
 */

export const ASCI_BADGE_TEXT = 'विज्ञापन';
export const ASCI_DISCLOSURE_LABEL_HI = 'विज्ञापन';

export const VALID_SLOTS = [
  'L_SHAPE',
  'FOOTER',
  'VERTICAL_EAR',
  'QUARTER_PAGE',
  'HALF_PAGE',
  'FULL_PAGE',
];

export const ALL_SUPPORTED_SLOTS = [
  'L_SHAPE',
  'BOTTOM_STRIP',
  'FOOTER',
  'VERTICAL_EAR',
  'QUARTER_PAGE',
  'HALF_PAGE',
  'HALF_PAGE_HORIZONTAL',
  'HALF_PAGE_VERTICAL',
  'FULL_PAGE',
  'CLASSIFIED',
];

export const SUPPORTED_ASPECT_RATIOS = ['1:1', '3:4', '2:3', '4:3', '16:9', 'custom'];

export const BROADSHEET_RATE_CARDS = {
  FULL_PAGE: {
    slotType: 'FULL_PAGE',
    nameHi: 'पूर्ण पृष्ठ विज्ञापन (Full Page)',
    descriptionHi: 'पूरा 8-कॉलम पृष्ठ, अधिकतम ब्रांड रीच',
    dimensionsMm: '329 x 520 mm',
    aspectRatio: '2:3',
    baseRateInr: 15000,
    basePaise: { district: 1500000, division: 3750000, statewide: 12000000 },
    pricingUnit: 'PER_ISSUE',
    isFrontPageEligible: false,
  },
  HALF_PAGE_HORIZONTAL: {
    slotType: 'HALF_PAGE_HORIZONTAL',
    nameHi: 'क्षैतिज अर्ध-पृष्ठ (Half Page Horizontal)',
    descriptionHi: 'निचला या ऊपरी आधा पृष्ठ (8 कॉलम x आधा पृष्ठ)',
    dimensionsMm: '329 x 260 mm',
    aspectRatio: '16:9',
    baseRateInr: 8500,
    basePaise: { district: 850000, division: 2100000, statewide: 6800000 },
    pricingUnit: 'PER_ISSUE',
    isFrontPageEligible: false,
  },
  HALF_PAGE: {
    slotType: 'HALF_PAGE',
    nameHi: 'क्षैतिज अर्ध-पृष्ठ (Half Page)',
    descriptionHi: 'निचला या ऊपरी आधा पृष्ठ',
    dimensionsMm: '329 x 260 mm',
    aspectRatio: '16:9',
    baseRateInr: 8500,
    basePaise: { district: 850000, division: 2100000, statewide: 6800000 },
    pricingUnit: 'PER_ISSUE',
    isFrontPageEligible: false,
  },
  HALF_PAGE_VERTICAL: {
    slotType: 'HALF_PAGE_VERTICAL',
    nameHi: 'ऊर्ध्वाधर अर्ध-पृष्ठ (Half Page Vertical)',
    descriptionHi: 'लंबवत 4 कॉलम पूर्ण ऊंचाई',
    dimensionsMm: '160 x 520 mm',
    aspectRatio: '1:3',
    baseRateInr: 8500,
    basePaise: { district: 850000, division: 2100000, statewide: 6800000 },
    pricingUnit: 'PER_ISSUE',
    isFrontPageEligible: false,
  },
  QUARTER_PAGE: {
    slotType: 'QUARTER_PAGE',
    nameHi: 'चतुर्थांश पृष्ठ (Quarter Page)',
    descriptionHi: '4 कॉलम x 260mm मानक कॉर्नर बॉक्स',
    dimensionsMm: '160 x 260 mm',
    aspectRatio: '4:3',
    baseRateInr: 4500,
    basePaise: { district: 450000, division: 1100000, statewide: 3600000 },
    pricingUnit: 'PER_ISSUE',
    isFrontPageEligible: true,
  },
  L_SHAPE: {
    slotType: 'L_SHAPE',
    nameHi: 'एल-आकार विज्ञापन (L-Shape Wrap)',
    descriptionHi: 'समाचार को घेरता हुआ निचला और साइड स्ट्रिप संयोजन',
    dimensionsMm: 'Compound L-Wrap',
    aspectRatio: 'custom',
    baseRateInr: 12000,
    basePaise: { district: 1200000, division: 3000000, statewide: 9600000 },
    pricingUnit: 'PER_ISSUE',
    isFrontPageEligible: true,
  },
  BOTTOM_STRIP: {
    slotType: 'BOTTOM_STRIP',
    nameHi: 'तल स्ट्रिप विज्ञापन (Bottom Strip / Footer)',
    descriptionHi: 'पृष्ठ के सबसे नीचे 8 कॉलम क्षैतिज स्ट्रिप',
    dimensionsMm: '329 x 50 mm',
    aspectRatio: '7:1',
    baseRateInr: 2500,
    basePaise: { district: 250000, division: 600000, statewide: 2000000 },
    pricingUnit: 'PER_ISSUE',
    isFrontPageEligible: true,
  },
  FOOTER: {
    slotType: 'FOOTER',
    nameHi: 'बॉटम फूटर स्ट्रिप (Footer)',
    descriptionHi: 'पृष्ठ के तल पर 8 कॉलम पट्टी',
    dimensionsMm: '329 x 50 mm',
    aspectRatio: '7:1',
    baseRateInr: 2500,
    basePaise: { district: 250000, division: 600000, statewide: 2000000 },
    pricingUnit: 'PER_ISSUE',
    isFrontPageEligible: true,
  },
  VERTICAL_EAR: {
    slotType: 'VERTICAL_EAR',
    nameHi: 'मास्टहेड ईयर पैनल (Ear Panel)',
    descriptionHi: 'प्रथम पृष्ठ मास्टहेड के बाएँ/दाएँ कोने का प्रीमियम ईयर विज्ञापन',
    dimensionsMm: '45 x 35 mm',
    aspectRatio: '4:3',
    baseRateInr: 1500,
    basePaise: { district: 150000, division: 350000, statewide: 1200000 },
    pricingUnit: 'PER_ISSUE',
    isFrontPageEligible: true,
  },
  CLASSIFIED: {
    slotType: 'CLASSIFIED',
    nameHi: 'वर्गीकृत विज्ञापन (Classified Text & Box)',
    descriptionHi: 'रोजगार, वैवाहिक, संपत्ति, शोक संदेश, निविदा (अधिकतम 30 शब्द)',
    dimensionsMm: '40 x 30 mm',
    aspectRatio: '1:1',
    baseRateInr: 250,
    basePaise: { district: 25000, division: 60000, statewide: 200000 },
    pricingUnit: 'PER_WORD',
    extraWordPaise: 500,
    isFrontPageEligible: false,
  },
};

export const PAGE_PLACEMENT_MULTIPLIERS = {
  1: 2.0,   // Front Page (+100% premium)
  2: 1.25,  // Page 2 (+25% premium)
  3: 1.25,  // Page 3 (+25% premium)
  12: 1.5,  // Back Page (+50% premium)
  default: 1.0,
};

export class BroadsheetAdManager {
  static VALID_SLOTS = VALID_SLOTS;

  /**
   * Validates ad slot classification against known broadsheet slots
   */
  static validateSlotClassification(slotType) {
    if (!slotType || (!VALID_SLOTS.includes(slotType) && !ALL_SUPPORTED_SLOTS.includes(slotType))) {
      throw new Error(`ERR_INVALID_AD_SLOT: Unsupported ad slot classification "${slotType}".`);
    }
    return true;
  }

  /**
   * Validates reporter classified ad submission payload
   */
  static validateAdSubmission(payload) {
    if (!payload || !payload.advertiserName || !payload.advertiserName.trim()) {
      throw new Error('ERR_MISSING_AD_CONTACT_INFO: Required advertiser name is missing.');
    }
    if (!payload.contactPhone || !payload.contactPhone.trim()) {
      throw new Error('ERR_MISSING_AD_CONTACT_INFO: Required contact/billing information is missing.');
    }
    if (payload.slotType) {
      this.validateSlotClassification(payload.slotType);
    }
    return true;
  }

  /**
   * Calculates rate based on slot, scope tier, target page, and words
   */
  static calculateAdPrice(slotType, tier = 'district', pageNumber = 1, wordCount = 0) {
    const card = BROADSHEET_RATE_CARDS[slotType] || BROADSHEET_RATE_CARDS.CLASSIFIED;
    const basePaise = (card.basePaise && card.basePaise[tier]) || card.basePaise?.district || 25000;
    const pageMultiplier = PAGE_PLACEMENT_MULTIPLIERS[pageNumber] || PAGE_PLACEMENT_MULTIPLIERS.default;

    let totalPaise = Math.round(basePaise * pageMultiplier);

    if (slotType === 'CLASSIFIED' && wordCount > 30) {
      const extraWords = wordCount - 30;
      totalPaise += extraWords * (card.extraWordPaise || 500);
    }

    return {
      slotType,
      tier,
      pageNumber,
      totalPaise,
      totalInr: totalPaise / 100,
      currency: 'INR',
    };
  }

  /**
   * AI Hindi Classified Copywriter with deterministic fallback
   */
  static generateClassifiedCopy(businessName, category, offerDetails = '') {
    const sanitizedName = (businessName || 'प्रतिष्ठान').trim();
    const cat = (category || 'COMMERCIAL').toUpperCase();

    let headline = `${sanitizedName} — विशेष सूचना`;
    let body = `सभी क्षेत्रवासियों को सूचित किया जाता है कि ${sanitizedName} द्वारा उत्कृष्ट सेवाएं उपलब्ध कराई जा रही हैं। ${offerDetails}`;
    let cta = 'अधिक जानकारी व संपर्क हेतु संपर्क करें।';

    if (cat === 'OBITUARY') {
      headline = `अत्यंत दुःख के साथ सूचित किया जाता है कि...`;
      body = `${sanitizedName} का स्वर्गवास हो गया है। ईश्वर दिवंगत आत्मा को शांति प्रदान करें। ${offerDetails}`;
      cta = 'शोकाकुल: समस्त परिवार एवं परिजन।';
    } else if (cat === 'TENDER') {
      headline = `निविदा आमंत्रण सूचना — ${sanitizedName}`;
      body = `कार्यालय द्वारा विभिन्न विकास कार्यों हेतु मुहरबंद निविदाएं आमंत्रित की जाती हैं। ${offerDetails}`;
      cta = 'विस्तृत विवरण एवं शर्तें कार्यालयीन समय में उपलब्ध हैं।';
    } else if (cat === 'PROPERTY') {
      headline = `प्रॉपर्टी क्रय/विक्रय — ${sanitizedName}`;
      body = `प्राइम लोकेशन पर प्लॉट/मकान तुरंत बिक्री हेतु उपलब्ध। सभी वैध दस्तावेजों सहित। ${offerDetails}`;
      cta = 'इच्छुक खरीदार तुरंत संपर्क करें।';
    } else if (cat === 'MATRIMONIAL') {
      headline = `वर/वधू चाहिए — वैवाहिक विज्ञापन`;
      body = `${sanitizedName} परिवार हेतु योग्य वर/वधू की आवश्यकता है। संपूर्ण विवरण एवं बायोडाटा सादर आमंत्रित। ${offerDetails}`;
      cta = 'पारिवारिक संपर्क सूत्र पर विवरण साझा करें।';
    }

    const words = `${headline} ${body} ${cta}`.split(/\s+/).filter(Boolean);

    return {
      category: cat,
      headline,
      body,
      cta,
      wordCount: words.length,
      estimatedPricePaise: words.length > 30 ? 25000 + (words.length - 30) * 500 : 25000,
    };
  }
}
