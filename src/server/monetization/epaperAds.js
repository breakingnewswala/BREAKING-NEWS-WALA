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
  'FULL_PAGE',
  'HALF_PAGE',
  'HALF_PAGE_HORIZONTAL',
  'HALF_PAGE_VERTICAL',
  'QUARTER_PAGE',
  'ONE_EIGHTH_PAGE',
  'HORIZONTAL_BANNER',
  'VERTICAL_STRIP',
  'CLASSIFIED',
  'SPONSORED_FEATURE',
  'L_SHAPE',
  'BOTTOM_STRIP',
  'FOOTER',
  'VERTICAL_EAR',
];

export const AD_LIFECYCLE_STATES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'SCHEDULED',
  'PUBLISHED',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
  'EXPIRED',
];

export const ALLOWED_STATUS_TRANSITIONS = {
  DRAFT: ['SUBMITTED', 'UNDER_REVIEW', 'CANCELLED'],
  SUBMITTED: ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED', 'CANCELLED', 'SUBMITTED'],
  APPROVED: ['SCHEDULED', 'UNDER_REVIEW', 'CANCELLED', 'EXPIRED'],
  SCHEDULED: ['PUBLISHED', 'APPROVED', 'CANCELLED'],
  PUBLISHED: ['COMPLETED'],
  COMPLETED: [],
  REJECTED: ['DRAFT', 'SUBMITTED', 'CANCELLED'],
  CANCELLED: ['DRAFT', 'SUBMITTED'],
  EXPIRED: ['DRAFT', 'SUBMITTED'],
  PENDING: ['UNDER_REVIEW', 'APPROVED', 'REJECTED'],
};

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
  ONE_EIGHTH_PAGE: {
    slotType: 'ONE_EIGHTH_PAGE',
    nameHi: 'अष्टमांश पृष्ठ (One-Eighth Page)',
    descriptionHi: '2 कॉलम x 130mm मानक कॉर्नर बॉक्स',
    dimensionsMm: '160 x 130 mm',
    aspectRatio: '4:3',
    baseRateInr: 2200,
    basePaise: { district: 220000, division: 550000, statewide: 1800000 },
    pricingUnit: 'PER_ISSUE',
    isFrontPageEligible: true,
  },
  HORIZONTAL_BANNER: {
    slotType: 'HORIZONTAL_BANNER',
    nameHi: 'क्षैतिज बैनर (Horizontal Banner)',
    descriptionHi: '8 कॉलम चौड़ाई, क्षैतिज स्ट्रिप',
    dimensionsMm: '329 x 50 mm',
    aspectRatio: '7:1',
    baseRateInr: 2500,
    basePaise: { district: 250000, division: 600000, statewide: 2000000 },
    pricingUnit: 'PER_ISSUE',
    isFrontPageEligible: true,
  },
  VERTICAL_STRIP: {
    slotType: 'VERTICAL_STRIP',
    nameHi: 'ऊर्ध्वाधर स्ट्रिप / टॉवर (Vertical Strip)',
    descriptionHi: '2 कॉलम लंबवत टावर विज्ञापन',
    dimensionsMm: '80 x 520 mm',
    aspectRatio: '1:6',
    baseRateInr: 5000,
    basePaise: { district: 500000, division: 1200000, statewide: 4000000 },
    pricingUnit: 'PER_ISSUE',
    isFrontPageEligible: false,
  },
  SPONSORED_FEATURE: {
    slotType: 'SPONSORED_FEATURE',
    nameHi: 'प्रायोजित संपादकीय / फीचर (Sponsored Editorial)',
    descriptionHi: 'संपादकीय प्रारूप में प्रायोजित लेख व ब्रांड स्टोरी',
    dimensionsMm: '160 x 260 mm',
    aspectRatio: '4:3',
    baseRateInr: 6000,
    basePaise: { district: 600000, division: 1500000, statewide: 4800000 },
    pricingUnit: 'PER_ISSUE',
    isFrontPageEligible: false,
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

  /**
   * Validates state transition between ad lifecycle stages.
   * Enforces RBAC permissions:
   * - REPORTER can only transition DRAFT -> SUBMITTED or CANCELLED.
   * - Elevated roles (EDITOR, ADMIN, MASTER_ADMIN) can approve, review, schedule, publish, complete.
   */
  static validateStatusTransition(currentStatus, targetStatus, user = null) {
    const cur = String(currentStatus || 'DRAFT').toUpperCase();
    const tgt = String(targetStatus || '').toUpperCase();

    if (!AD_LIFECYCLE_STATES.includes(tgt)) {
      const err = new Error(`ERR_INVALID_STATUS: अमान्य विज्ञापन स्थिति "${targetStatus}"।`);
      err.statusCode = 400;
      err.code = 'ERR_INVALID_STATUS';
      throw err;
    }

    if (cur === tgt) return true; // No-op transition

    // Role-Based Authorization
    const role = String(user?.role || '').toUpperCase();
    const isPrivileged = ['EDITOR', 'ADMIN', 'MASTER_ADMIN', 'CHIEF_EDITOR'].includes(role);

    // Reporter restrictions
    if (role === 'REPORTER') {
      const allowedReporterTargets = ['SUBMITTED', 'CANCELLED'];
      if (!allowedReporterTargets.includes(tgt)) {
        const err = new Error(`ERR_FORBIDDEN_STATUS_TRANSITION: संवाददाता केवल विज्ञापन प्रस्तुत (SUBMITTED) अथवा निरस्त (CANCELLED) कर सकते हैं। स्थिति "${tgt}" हेतु संपादकीय अधिकार आवश्यक हैं।`);
        err.statusCode = 403;
        err.code = 'ERR_FORBIDDEN_STATUS_TRANSITION';
        throw err;
      }
    } else if (!isPrivileged) {
      const err = new Error('ERR_UNAUTHORIZED: विज्ञापन स्थिति बदलने हेतु संपादकीय अथवा व्यवस्थापक अधिकार आवश्यक हैं।');
      err.statusCode = 403;
      err.code = 'ERR_UNAUTHORIZED';
      throw err;
    }

    const allowed = ALLOWED_STATUS_TRANSITIONS[cur] || [];
    if (!allowed.includes(tgt)) {
      const err = new Error(`ERR_ILLEGAL_STATUS_TRANSITION: स्थिति "${cur}" से "${tgt}" में परिवर्तन वर्जित है।`);
      err.statusCode = 400;
      err.code = 'ERR_ILLEGAL_STATUS_TRANSITION';
      throw err;
    }

    return true;
  }

  /**
   * Validates creative image formats (.jpg, .jpeg, .png, .webp) and size boundaries.
   */
  static validateImageCreative(imageUrl) {
    if (!imageUrl || typeof imageUrl !== 'string') return true; // Optional

    const sanitized = imageUrl.trim().toLowerCase();
    // Allow data URIs
    if (sanitized.startsWith('data:image/')) {
      const isAllowedDataUri = sanitized.startsWith('data:image/png') ||
        sanitized.startsWith('data:image/jpeg') ||
        sanitized.startsWith('data:image/jpg') ||
        sanitized.startsWith('data:image/webp');
      if (!isAllowedDataUri) {
        const err = new Error('ERR_INVALID_IMAGE_FORMAT: केवल JPEG, PNG व WebP डेटा प्रारूप समर्थित हैं।');
        err.statusCode = 400;
        err.code = 'ERR_INVALID_IMAGE_FORMAT';
        throw err;
      }
      return true;
    }

    // Allow standard URL extensions
    const ext = sanitized.split('?')[0].split('.').pop();
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
    if (!allowedExts.includes(ext) && !sanitized.includes('/placeholder') && !sanitized.startsWith('blob:')) {
      const err = new Error(`ERR_INVALID_IMAGE_FORMAT: अमान्य छवि प्रारूप ".${ext}"। केवल JPG, JPEG, PNG अथवा WebP ही मान्य हैं।`);
      err.statusCode = 400;
      err.code = 'ERR_INVALID_IMAGE_FORMAT';
      throw err;
    }

    return true;
  }

  /**
   * Translates slot type to broadsheet points (72 DPI).
   */
  static getSlotDimensionsPt(slotType) {
    const s = String(slotType || 'BOTTOM_STRIP').toUpperCase();
    switch (s) {
      case 'FULL_PAGE':
        return { width: 847.56, height: 1332.27, colSpan: 8 };
      case 'HALF_PAGE_HORIZONTAL':
      case 'HALF_PAGE':
        return { width: 847.56, height: 650.0, colSpan: 8 };
      case 'HALF_PAGE_VERTICAL':
        return { width: 410.0, height: 1332.27, colSpan: 4 };
      case 'QUARTER_PAGE':
      case 'SPONSORED_FEATURE':
        return { width: 410.0, height: 650.0, colSpan: 4 };
      case 'ONE_EIGHTH_PAGE':
        return { width: 410.0, height: 320.0, colSpan: 4 };
      case 'HORIZONTAL_BANNER':
      case 'BOTTOM_STRIP':
      case 'FOOTER':
        return { width: 847.56, height: 125.0, colSpan: 8 };
      case 'VERTICAL_STRIP':
        return { width: 200.0, height: 1332.27, colSpan: 2 };
      case 'VERTICAL_EAR':
        return { width: 140.0, height: 90.0, colSpan: 1 };
      case 'CLASSIFIED':
        return { width: 113.0, height: 85.0, colSpan: 1 };
      case 'L_SHAPE':
        return { width: 847.56, height: 140.0, colSpan: 8 };
      default:
        return { width: 410.0, height: 140.0, colSpan: 4 };
    }
  }

  /**
   * Validates ad placement on a broadsheet page:
   * 1. Ad approval status must be APPROVED, SCHEDULED, or PUBLISHED.
   * 2. Coordinates must not overflow page dimensions.
   * 3. Must not collide with existing editorial or ad content.
   */
  static validateAdPlacement(ad, bounds, pageWidth = 932.6, pageHeight = 1474.0, existingElements = []) {
    if (!ad) {
      const err = new Error('ERR_MISSING_AD: विज्ञापन डेटा अनुपलब्ध है।');
      err.statusCode = 400;
      err.code = 'ERR_MISSING_AD';
      throw err;
    }

    // 1. Approval Gate
    const status = String(ad.status || '').toUpperCase();
    const approvedStatuses = ['APPROVED', 'SCHEDULED', 'PUBLISHED'];
    if (!approvedStatuses.includes(status)) {
      const err = new Error(`ERR_AD_NOT_APPROVED: केवल अनुमोदित (APPROVED) विज्ञापन ही ई-पेपर पृष्ठ पर रखे जा सकते हैं। वर्तमान स्थिति: "${ad.status}"।`);
      err.statusCode = 400;
      err.code = 'ERR_AD_NOT_APPROVED';
      throw err;
    }

    // 2. Boundary overflow
    if (!bounds || typeof bounds !== 'object') {
      const err = new Error('ERR_INVALID_BOUNDS: विज्ञापन के ज्यामितीय आयाम अनुपलब्ध हैं।');
      err.statusCode = 400;
      err.code = 'ERR_INVALID_BOUNDS';
      throw err;
    }

    if (bounds.width <= 0 || bounds.height <= 0) {
      const err = new Error('ERR_INVALID_DIMENSIONS: विज्ञापन की चौड़ाई और ऊंचाई धनात्मक होनी चाहिए।');
      err.statusCode = 400;
      err.code = 'ERR_INVALID_DIMENSIONS';
      throw err;
    }

    if (bounds.x < 0 || bounds.y < 0) {
      const err = new Error('ERR_OUT_OF_BOUNDS: विज्ञापन का आरंभिक बिंदु ऋणात्मक नहीं हो सकता।');
      err.statusCode = 400;
      err.code = 'ERR_OUT_OF_BOUNDS';
      throw err;
    }

    if (bounds.x + bounds.width > pageWidth + 5) {
      const err = new Error(`ERR_PAGE_OVERFLOW: विज्ञापन पृष्ठ की चौड़ाई से बाहर निकल रहा है (${(bounds.x + bounds.width).toFixed(1)}pt > ${pageWidth}pt)।`);
      err.statusCode = 400;
      err.code = 'ERR_PAGE_OVERFLOW';
      throw err;
    }

    if (bounds.y + bounds.height > pageHeight + 5) {
      const err = new Error(`ERR_PAGE_OVERFLOW: विज्ञापन पृष्ठ की ऊंचाई से बाहर निकल रहा है (${(bounds.y + bounds.height).toFixed(1)}pt > ${pageHeight}pt)।`);
      err.statusCode = 400;
      err.code = 'ERR_PAGE_OVERFLOW';
      throw err;
    }

    // 3. Collision Detection with Existing Elements (2pt threshold)
    const elements = Array.isArray(existingElements) ? existingElements : [];
    for (const el of elements) {
      if (!el || el.id === ad.id || el.adId === ad.id) continue;
      const b = el.bounds || (el.x !== undefined ? { x: el.x, y: el.y, width: el.width, height: el.height } : null);
      if (!b || b.x === undefined || b.y === undefined) continue;
      const overlapX = Math.max(0, Math.min(bounds.x + bounds.width, b.x + b.width) - Math.max(bounds.x, b.x));
      const overlapY = Math.max(0, Math.min(bounds.y + bounds.height, b.y + b.height) - Math.max(bounds.y, b.y));

      if (overlapX > 2 && overlapY > 2) {
        const conflictLabel = el.customHeadline || el.name || el.elementType || el.id;
        const err = new Error(`ERR_SLOT_COLLISION: विज्ञापन स्लॉट "${conflictLabel}" के साथ संघातित (Collision) हो रहा है (${overlapX.toFixed(0)}x${overlapY.toFixed(0)} pt ओवरलैप)।`);
        err.statusCode = 409;
        err.code = 'ERR_SLOT_COLLISION';
        err.details = { overlapX, overlapY, conflictingElementId: el.id };
        throw err;
      }
    }

    return true;
  }

  /**
   * AI-assisted creative workspace generator.
   * Generates grounded headlines, copy, CTAs, layout suggestions, and variations.
   * Important Safeguard: Never invents unprovided prices, discounts, or phone numbers.
   */
  static generateAiAdStudioCreatives(input = {}) {
    const biz = String(input.businessName || input.advertiserName || 'प्रतिष्ठान').trim();
    const product = String(input.productDetails || input.details || biz).trim();
    const offer = String(input.offerDetails || input.offer || '').trim();
    const phone = String(input.contactPhone || input.phone || input.contactInfo || '').trim();
    const email = String(input.contactEmail || input.email || '').trim();
    const address = String(input.contactAddress || input.address || '').trim();
    const lang = String(input.language || 'hi').toLowerCase();
    const preferredSlot = input.preferredSlot || input.adSize || 'QUARTER_PAGE';

    const contactStr = [
      phone ? `संपर्क: ${phone}` : '',
      email ? `ईमेल: ${email}` : '',
      address ? `पता: ${address}` : '',
    ].filter(Boolean).join(' | ');

    let headlines = [];
    let copyVariants = [];
    let ctaVariants = [];
    let creativeConcepts = [];

    if (lang === 'en') {
      headlines = [
        `${biz} — Excellence in ${product}`,
        offer ? `${offer} — Exclusive from ${biz}` : `Discover Premium Quality at ${biz}`,
        `Your Trusted Partner: ${biz}`,
      ];

      copyVariants = [
        `Looking for outstanding ${product}? ${biz} delivers guaranteed quality and dedicated service. ${offer ? `Special Announcement: ${offer}. ` : ''}${contactStr ? `Get in touch today: ${contactStr}.` : ''}`,
        `Experience the difference with ${biz}. Specializing in ${product} tailored to your needs. ${offer ? `Offer details: ${offer}. ` : ''}${contactStr ? `Contact us: ${contactStr}.` : ''}`,
        `Trusted by hundreds across the region, ${biz} brings you the finest ${product}. ${offer ? `Highlight: ${offer}. ` : ''}${contactStr ? `Inquire now: ${contactStr}.` : ''}`,
      ];

      ctaVariants = [
        'Contact Us Today for Complete Details!',
        'Visit Our Store or Call for Inquiries!',
        'Book Your Consultation Now — Limited Time!',
      ];

      creativeConcepts = [
        'Modern Corporate Grid: Prominent brand logo top-left, bold 2-line headline, crisp value-proposition bullets, bottom contact bar.',
        'Festive Showcase Banner: Warm gold-trimmed border, high-impact product photo with drop-shadow, bold Hindi/English hybrid appeal.',
      ];
    } else {
      // Devanagari (Hindi)
      headlines = [
        `${biz} — ${product} का सबसे विश्वसनीय नाम`,
        offer ? `${offer} — ${biz} की विशेष पेशकश` : `${biz} पर पाएं शुद्धता, गुणवत्ता और विश्वास`,
        `क्षेत्र का नंबर 1 संस्थान: ${biz}`,
      ];

      copyVariants = [
        `क्या आप सर्वश्रेष्ठ ${product} की तलाश में हैं? ${biz} आपके लिए लाया है प्रामाणिक गुणवत्ता व उत्कृष्ट सेवाएं। ${offer ? `विशेष सूचना: ${offer}। ` : ''}${contactStr ? `${contactStr}। ` : ''}संतुष्टि की 100% गारंटी।`,
        `${biz} में आपका स्वागत है। हमारे यहां ${product} की संपूर्ण रेंज वाजिब दामों पर उपलब्ध है। ${offer ? `ऑफर: ${offer}। ` : ''}${contactStr ? `आज ही संपर्क करें: ${contactStr}।` : ''}`,
        `विश्वास और परंपरा का प्रतीक — ${biz}। ${product} से जुड़ी हर आवश्यकता के लिए एक ही नाम। ${offer ? `धमाका: ${offer}। ` : ''}${contactStr ? `हेल्पलाइन: ${contactStr}।` : ''}`,
      ];

      ctaVariants = [
        phone ? `आज ही पधारें अथवा संपर्क कर विस्तृत जानकारी प्राप्त करें (संपर्क: ${phone})!` : 'आज ही पधारें अथवा संपर्क कर विस्तृत जानकारी प्राप्त करें!',
        phone ? `सीमित समय का लाभ उठाएं — तुरंत कॉल करें (${phone})!` : 'सीमित समय का लाभ उठाएं — तुरंत कॉल करें!',
        phone ? `अपनी बुकिंग अथवा परामर्श के लिए आज ही संपर्क करें (हेल्पलाइन: ${phone})!` : 'अपनी बुकिंग अथवा परामर्श के लिए आज ही संपर्क करें!',
      ];

      creativeConcepts = [
        'पारंपरिक अखबार ब्रॉडशीट लेआउट: शीर्ष पर प्रतिष्ठान का नाम, मध्य में मुख्य फोटोग्राफ/लोगो, दाहिने मूल्यवान विशेषताएं, पाद में फोन व पता।',
        'हाई-कंट्रास्ट विज्ञापन बॉक्स: आकर्षक लाल/अंबर बॉर्डर, बोल्ड देवनागरी हेडलाइन, बुलेट पॉइंट्स में ऑफर विवरण, क्यूआर कोड अथवा कॉल बटन।',
      ];
    }

    const slotDims = this.getSlotDimensionsPt(preferredSlot);

    return {
      isAiAssisted: true,
      businessName: biz,
      language: lang,
      headlineVariants: headlines,
      suggestedHeadlines: headlines,
      copyVariants: copyVariants,
      suggestedCopy: copyVariants,
      ctaVariants: ctaVariants,
      suggestedCtas: ctaVariants,
      creativeConcepts,
      selectedVariantIndex: 0,
      layoutConcept: {
        slotType: preferredSlot,
        dimensionsMm: BROADSHEET_RATE_CARDS[preferredSlot]?.dimensionsMm || '160 x 260 mm',
        suggestedPage: preferredSlot === 'BOTTOM_STRIP' || preferredSlot === 'VERTICAL_EAR' ? 1 : (preferredSlot === 'CLASSIFIED' ? 11 : 3),
        colSpan: slotDims.colSpan,
        widthPt: slotDims.width,
        heightPt: slotDims.height,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}
