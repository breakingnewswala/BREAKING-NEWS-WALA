/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Monetization, Commercial Governance & Billing Constants
 * Grounded in docs/Monetization.md, docs/06-Business-Rules.md (RULE-AD-001 to RULE-AD-005),
 * and docs/DECISIONS.md (DEC-007, DEC-048, DEC-060, DEC-068, DEC-069, DEC-070).
 */

// ============================================================================
// 1. ASCI Disclosures & Placement Inventory Catalog
// ============================================================================

export const ASCI_DISCLOSURE_LABEL_HI = 'विज्ञापन / Advertisement';
export const ASCI_SPONSORED_LABEL_HI = 'प्रायोजित सामग्री / Sponsored Content';

export const AD_PLACEMENT_SLOTS = [
  {
    code: 'header_leaderboard',
    nameHi: 'शीर्ष हेडर लीडरबोर्ड (डेस्कटॉप व मोबाइल)',
    descriptionHi: 'मुख्य पोर्टल हेडर के नीचे प्रमुख 728x90 डेस्कटॉप व 320x50 मोबाइल विज्ञापन स्लॉट।',
    dimensions: { width: 728, height: 90 },
    supportedCreativeTypes: ['IMAGE', 'BANNER'],
    pricingModel: 'CPM',
    baseRatePaise: 4500, // ₹45 CPM
    minDurationDays: 1,
    maxConcurrentCampaigns: 5,
    requiresDistrictTargeting: false,
    isActive: true,
  },
  {
    code: 'homepage_infeed',
    nameHi: 'होमपेज इन-फ़ीड कार्ड',
    descriptionHi: 'होमपेज न्यूज़ ग्रिड के 4थे कार्ड के बाद इन-फ़ीड स्पॉन्डर्ड डिस्प्ले कार्ड।',
    dimensions: { width: 300, height: 250 },
    supportedCreativeTypes: ['IMAGE', 'BANNER', 'SPONSORED_ARTICLE'],
    pricingModel: 'CPM',
    baseRatePaise: 3500, // ₹35 CPM
    minDurationDays: 3,
    maxConcurrentCampaigns: 10,
    requiresDistrictTargeting: false,
    isActive: true,
  },
  {
    code: 'article_body_mpu',
    nameHi: 'समाचार आलेख इन-बॉडी MPU',
    descriptionHi: 'समाचार आलेख के तीसरे पैराग्राफ़ के बाद इनलाइन 300x250 डिस्प्ले यूनिट।',
    dimensions: { width: 300, height: 250 },
    supportedCreativeTypes: ['IMAGE', 'BANNER'],
    pricingModel: 'CPM',
    baseRatePaise: 4000, // ₹40 CPM
    minDurationDays: 1,
    maxConcurrentCampaigns: 15,
    requiresDistrictTargeting: false,
    isActive: true,
  },
  {
    code: 'sidebar_sticky',
    nameHi: 'डेस्कटॉप साइडबार स्टिकी हाफ-पेज',
    descriptionHi: 'डेस्कटॉप व्यू में साइडबार स्क्रॉलिंग के साथ स्थिर रहने वाला 300x600 स्लॉट।',
    dimensions: { width: 300, height: 600 },
    supportedCreativeTypes: ['IMAGE', 'BANNER'],
    pricingModel: 'CPM',
    baseRatePaise: 5500, // ₹55 CPM
    minDurationDays: 7,
    maxConcurrentCampaigns: 5,
    requiresDistrictTargeting: false,
    isActive: true,
  },
  {
    code: 'district_top',
    nameHi: 'ज़िला पोर्टल शीर्ष बैनर (जियो-टारगेटेड)',
    descriptionHi: 'मध्य प्रदेश के 55 ज़िलों के विशिष्ट पोर्टल हेडर पर प्रदर्शित होने वाला लक्षित स्लॉट।',
    dimensions: { width: 728, height: 90 },
    supportedCreativeTypes: ['IMAGE', 'BANNER'],
    pricingModel: 'FLAT_MONTHLY',
    baseRatePaise: 500000, // ₹5,000 / month flat per district
    minDurationDays: 30,
    maxConcurrentCampaigns: 2,
    requiresDistrictTargeting: true,
    isActive: true,
  },
  {
    code: 'sticky_bottom_banner',
    nameHi: 'मोबाइल बॉटम स्टिकी बैनर',
    descriptionHi: 'मोबाइल स्क्रीन पर नीचे की ओर स्थिर रहने वाला 320x50 बैनर, क्लोज़ बटन युक्त।',
    dimensions: { width: 320, height: 50 },
    supportedCreativeTypes: ['IMAGE', 'BANNER'],
    pricingModel: 'CPM',
    baseRatePaise: 3000, // ₹30 CPM
    minDurationDays: 1,
    maxConcurrentCampaigns: 8,
    requiresDistrictTargeting: false,
    isActive: true,
  },
  {
    code: 'video_postroll',
    nameHi: 'वीडियो न्यूज़ पोस्ट-रोल क्लिप',
    descriptionHi: 'वीडियो न्यूज़ बुलेटिन के अंत में 16:9 आस्पेक्ट रेशियो 5-10 सेकंड स्पॉन्डर्ड क्लिप।',
    dimensions: { width: 640, height: 360 },
    supportedCreativeTypes: ['VIDEO_CLIP'],
    pricingModel: 'CPM',
    baseRatePaise: 8000, // ₹80 CPM
    minDurationDays: 7,
    maxConcurrentCampaigns: 4,
    requiresDistrictTargeting: false,
    isActive: true,
  },
];

// ============================================================================
// 2. Prohibited Categories (RULE-AD-003)
// ============================================================================

export const PROHIBITED_AD_CATEGORIES = [
  'betting_gambling',        // सट्टा, जुआ, ऑनलाइन कैसीनो, रियल-मनी गेमिंग
  'payday_loans',            // अवैध लोन ऐप्स, अनुचित ब्याज दरें
  'miracle_cures',           // जादुई उपचार, चमत्कारिक दावे, अप्रमाणित दवाएं
  'firearms_weapons',        // हथियार, गोला-बारूद, घातक उपकरण
  'hate_speech_obscenity',   // भड़काऊ, अश्लील, सामाजिक सौहार्द बिगाड़ने वाली सामग्री
  'alcohol_tobacco_direct',  // तंबाकू, गुटखा, शराब (प्रत्यक्ष एवं सरोगेट विज्ञापन)
];

// ============================================================================
// 3. Tax, Invoicing & GST Standards (SAC 998363 & 18% GST)
// ============================================================================

export const BILLING_CONSTANTS = {
  SAC_CODE: '998363', // Other information technology services / Internet advertising services
  GST_RATE_PERCENT: 18,
  CGST_RATE_PERCENT: 9,
  SGST_RATE_PERCENT: 9,
  IGST_RATE_PERCENT: 18,
  HOME_STATE_CODE_MP: '23', // Madhya Pradesh GST State Code
  HOME_STATE_NAME: 'Madhya Pradesh',
  CURRENCY_INR: 'INR',
  INVOICE_PREFIX: 'INV',
};

// ============================================================================
// 4. Configurable Subscription Plans
// ============================================================================

export const CANONICAL_SUBSCRIPTION_PLANS = [
  {
    id: 'sub-plan-free',
    code: 'FREE',
    nameHi: 'निःशुल्क पाठक',
    nameEn: 'Free Reader',
    descriptionHi: 'मानक डिजिटल समाचार, ब्रेकिंग न्यूज़ अलर्ट और 5 दैनिक कमेंट्स।',
    billingCycle: 'monthly',
    priceMinorUnits: 0, // ₹0
    currency: 'INR',
    includedFeatures: ['दैनिक समाचार पठन', 'ज़िला आधारित बुलेटिन', 'कमेंट्स सहभागिता'],
    entitlements: ['standard_read'],
    usageLimits: {
      maxDownloadsPerMonth: 0,
      maxCommentsPerDay: 5,
    },
    trialDays: 0,
    isActive: true,
    isCommercialActive: true,
  },
  {
    id: 'sub-plan-premium',
    code: 'PREMIUM',
    nameHi: 'प्रीमियम समर्थक (मासिक)',
    nameEn: 'Premium Supporter (Monthly)',
    descriptionHi: 'पूर्णतः विज्ञापन-मुक्त पठन अनुभव, तीव्र पेज लोडिंग, स्वच्छ पाठक मोड और ई-पेपर पूर्वावलोकन।',
    billingCycle: 'monthly',
    priceMinorUnits: 9900, // ₹99.00
    currency: 'INR',
    includedFeatures: ['100% विज्ञापन-मुक्त पठन', 'तीव्र पेज लोडिंग', 'ई-पेपर डिजिटल पूर्वावलोकन'],
    entitlements: ['ad_free', 'fast_cdn', 'epaper_preview'],
    usageLimits: {
      maxDownloadsPerMonth: 10,
      maxCommentsPerDay: 50,
    },
    trialDays: 7,
    isActive: true,
    isCommercialActive: true,
  },
  {
    id: 'sub-plan-professional',
    code: 'PROFESSIONAL',
    nameHi: 'व्यावसायिक व ई-पेपर (मासिक)',
    nameEn: 'Professional & E-Paper',
    descriptionHi: 'विज्ञापन-मुक्त अनुभव के साथ 365 दिनों के ई-पेपर संस्करण, पीडीएफ डाउनलोड और प्राथमिक न्यूज़ रूम फ़ीड।',
    billingCycle: 'monthly',
    priceMinorUnits: 29900, // ₹299.00
    currency: 'INR',
    includedFeatures: ['विज्ञापन-मुक्त अनुभव', '365 दिवसीय ई-पेपर आर्काइव', 'पीडीएफ संस्करण डाउनलोड', 'प्राथमिक न्यूज़ फ़ीड'],
    entitlements: ['ad_free', 'epaper_archive', 'pdf_download', 'priority_wire'],
    usageLimits: {
      maxDownloadsPerMonth: 100,
      maxCommentsPerDay: 200,
    },
    trialDays: 14,
    isActive: true,
    isCommercialActive: true,
  },
  {
    id: 'sub-plan-enterprise',
    code: 'ENTERPRISE',
    nameHi: 'संस्थागत संरक्षक (वार्षिक)',
    nameEn: 'Enterprise & Institutional Patron',
    descriptionHi: 'संस्थानों एवं कॉर्पोरेट्स हेतु 5-यूज़र डिजिटल एक्सेस, कमर्शियल डायरेक्टरी लिस्टिंग और संरक्षक बैज।',
    billingCycle: 'yearly',
    priceMinorUnits: 149900, // ₹1,499.00 / year
    currency: 'INR',
    includedFeatures: ['5-यूज़र संस्थागत एक्सेस', 'संरक्षक बैज (Patron Badge)', 'कमर्शियल डायरेक्टरी लिस्टिंग', 'संपादकीय राउंडटेबल आमंत्रण'],
    entitlements: ['ad_free', 'epaper_archive', 'pdf_download', 'multi_user', 'patron_badge', 'editorial_access'],
    usageLimits: {
      maxDownloadsPerMonth: 500,
      maxCommentsPerDay: 1000,
      maxTeamMembers: 5,
    },
    trialDays: 30,
    isActive: true,
    isCommercialActive: true,
  },
];

// ============================================================================
// 5. Seed Regional Advertisers & Partners
// ============================================================================

export const CANONICAL_SEED_ADVERTISERS = [
  {
    id: 'adv-mp-tourism-001',
    organizationName: 'मध्य प्रदेश राज्य पर्यटन विकास निगम (MP Tourism)',
    brandName: 'एमपी टूरिज्म (द हार्ट ऑफ इनक्रेडिबल इंडिया)',
    contactPerson: 'अमित कुमार शर्मा',
    email: 'campaigns@mptourism.gov.in',
    phone: '+91 755 2778383',
    billingAddress: 'पर्यटन भवन, भदभदा रोड, भोपाल, मध्य प्रदेश - 462003',
    gstin: '23AAACT1234F1Z5',
    pan: 'AAACT1234F',
    stateCode: '23',
    category: 'government_tourism',
    accountStatus: 'active',
    verificationStatus: 'verified',
    agreementStatus: 'signed',
    creditLimitMinorUnits: 50000000, // ₹5,00,000 credit line
    lifetimeSpendMinorUnits: 12500000, // ₹1,25,000
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-11-14T00:00:00.000Z',
  },
  {
    id: 'adv-mriganyani-002',
    organizationName: 'मप्र हस्तशिल्प एवं हथकरघा विकास निगम (मृगनयनी)',
    brandName: 'मृगनयनी एम्पोरियम',
    contactPerson: 'विनीता सिंह',
    email: 'info@mrignayani.mp.gov.in',
    phone: '+91 755 2554522',
    billingAddress: 'जीटीबी कॉम्प्लेक्स, न्यू मार्केट, भोपाल, मध्य प्रदेश - 462003',
    gstin: '23AABCM5678G1Z2',
    pan: 'AABCM5678G',
    stateCode: '23',
    category: 'handicrafts_textiles',
    accountStatus: 'active',
    verificationStatus: 'verified',
    agreementStatus: 'signed',
    creditLimitMinorUnits: 25000000,
    lifetimeSpendMinorUnits: 6500000,
    createdAt: '2026-10-15T00:00:00.000Z',
    updatedAt: '2026-11-14T00:00:00.000Z',
  },
  {
    id: 'adv-sanchi-dairy-003',
    organizationName: 'मप्र राज्य सहकारी डेयरी फेडरेशन मर्यादित (सांची)',
    brandName: 'सांची दूध एवं दुग्ध उत्पाद',
    contactPerson: 'डॉ. प्रभात जोशी',
    email: 'marketing@sanchidairy.com',
    phone: '+91 755 2601595',
    billingAddress: 'दुग्ध भवन, हबीबगंज, भोपाल, मध्य प्रदेश - 462024',
    gstin: '23AABCS9012H1Z1',
    pan: 'AABCS9012H',
    stateCode: '23',
    category: 'dairy_cooperative',
    accountStatus: 'active',
    verificationStatus: 'verified',
    agreementStatus: 'signed',
    creditLimitMinorUnits: 30000000,
    lifetimeSpendMinorUnits: 8200000,
    createdAt: '2026-10-20T00:00:00.000Z',
    updatedAt: '2026-11-14T00:00:00.000Z',
  },
];

// ============================================================================
// 6. Seed Campaigns & Creatives
// ============================================================================

export const CANONICAL_SEED_CAMPAIGNS = [
  {
    id: 'cmp-mp-tourism-winter-2026',
    campaignName: 'एमपी पर्यटन शीतकालीन उत्सव 2026 (मांडू व खजुराहो महोत्सव)',
    advertiserId: 'adv-mp-tourism-001',
    advertiserName: 'मध्य प्रदेश राज्य पर्यटन विकास निगम (MP Tourism)',
    slotCode: 'header_leaderboard',
    pricingModel: 'CPM',
    budgetTotalPaise: 4500000, // ₹45,000
    budgetSpentPaise: 1820000, // ₹18,200
    startDate: '2026-11-01T00:00:00.000Z',
    endDate: '2026-12-31T23:59:59.000Z',
    targetDistricts: ['Bhopal', 'Indore', 'Dhar', 'Chhatarpur', 'भोपाल', 'इंदौर', 'धार', 'छतरपुर'],
    status: 'active',
    isApproved: true,
    approvedBy: 'usr-admin-001',
    approvedAt: '2026-10-31T15:00:00.000Z',
    creative: {
      id: 'crt-mp-tourism-01',
      headline: 'मध्य प्रदेश की ऐतिहासिक धरोहरों का सजीव अनुभव: मांडू उत्सव 2026',
      subheadline: 'विशेष पैकेज बुकिंग पर 20% की छूट',
      creativeUrl: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=1200&auto=format&fit=crop&q=80',
      destinationUrl: 'https://www.mptourism.com/events/mandu-festival',
      altText: 'मांडू महोत्सव एमपी पर्यटन',
      disclosureLabel: ASCI_DISCLOSURE_LABEL_HI,
    },
    metrics: {
      impressions: 40500,
      viewableImpressions: 38200,
      clicks: 1420,
      ctr: 3.51,
      spendPaise: 1820000,
    },
    createdAt: '2026-10-30T10:00:00.000Z',
    updatedAt: '2026-11-14T00:00:00.000Z',
  },
  {
    id: 'cmp-mrignayani-sarees-2026',
    campaignName: 'मृगनयनी: चंदेरी व महेश्वरी हथकरघा वस्त्र प्रदर्शनी',
    advertiserId: 'adv-mriganyani-002',
    advertiserName: 'मप्र हस्तशिल्प एवं हथकरघा विकास निगम (मृगनयनी)',
    slotCode: 'homepage_infeed',
    pricingModel: 'CPM',
    budgetTotalPaise: 3500000, // ₹35,000
    budgetSpentPaise: 1225000, // ₹12,250
    startDate: '2026-11-05T00:00:00.000Z',
    endDate: '2026-11-30T23:59:59.000Z',
    targetDistricts: ['भोपाल', 'इंदौर', 'ग्वालियर', 'उज्जैन'],
    status: 'active',
    isApproved: true,
    approvedBy: 'usr-admin-001',
    approvedAt: '2026-11-04T12:00:00.000Z',
    creative: {
      id: 'crt-mrignayani-01',
      headline: 'मध्य प्रदेश का गौरव: प्रामाणिक चंदेरी व महेश्वरी साड़ियां अब ऑनलाइन',
      subheadline: 'सीधे बुनकरों से प्राप्त शुद्ध सिल्क व कॉटन साड़ियों पर विशेष छूट',
      creativeUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
      destinationUrl: 'https://mrignayani.mp.gov.in',
      altText: 'चंदेरी साड़ियां मृगनयनी',
      disclosureLabel: ASCI_DISCLOSURE_LABEL_HI,
    },
    metrics: {
      impressions: 35000,
      viewableImpressions: 32900,
      clicks: 980,
      ctr: 2.80,
      spendPaise: 1225000,
    },
    createdAt: '2026-11-04T09:00:00.000Z',
    updatedAt: '2026-11-14T00:00:00.000Z',
  },
];

// ============================================================================
// 7. Monetization Error Codes
// ============================================================================

export const MONETIZATION_ERROR_CODES = {
  ERR_PAYMENT_FAILED: 'ERR_PAYMENT_FAILED',
  ERR_INVALID_PAYMENT_SIGNATURE: 'ERR_INVALID_PAYMENT_SIGNATURE',
  ERR_ORDER_NOT_FOUND: 'ERR_ORDER_NOT_FOUND',
  ERR_ORDER_ALREADY_PAID: 'ERR_ORDER_ALREADY_PAID',
  ERR_DUPLICATE_TRANSACTION: 'ERR_DUPLICATE_TRANSACTION',
  ERR_REFUND_NOT_PERMITTED: 'ERR_REFUND_NOT_PERMITTED',
  ERR_REFUND_AMOUNT_EXCEEDED: 'ERR_REFUND_AMOUNT_EXCEEDED',
  ERR_CAMPAIGN_NOT_APPROVED: 'ERR_CAMPAIGN_NOT_APPROVED',
  ERR_PROHIBITED_CATEGORY: 'ERR_PROHIBITED_CATEGORY',
  ERR_EDITORIAL_APPROVAL_REQUIRED: 'ERR_EDITORIAL_APPROVAL_REQUIRED',
  ERR_SPONSORED_CONTENT_UNAPPROVED: 'ERR_SPONSORED_CONTENT_UNAPPROVED',
  ERR_SUBSCRIPTION_PLAN_NOT_FOUND: 'ERR_SUBSCRIPTION_PLAN_NOT_FOUND',
  ERR_SUBSCRIPTION_EXPIRED: 'ERR_SUBSCRIPTION_EXPIRED',
  ERR_INVALID_INVOICE_STATE: 'ERR_INVALID_INVOICE_STATE',
  ERR_BOT_IMPRESSION_FILTERED: 'ERR_BOT_IMPRESSION_FILTERED',
  ERR_FREQUENCY_CAP_EXCEEDED: 'ERR_FREQUENCY_CAP_EXCEEDED',
  ERR_ADVERTISER_NOT_ACTIVE: 'ERR_ADVERTISER_NOT_ACTIVE',
  ERR_UNAUTHORIZED_FINANCIAL_ACTION: 'ERR_UNAUTHORIZED_FINANCIAL_ACTION',
};
