/**
 * BREAKING NEWS WALA — Monetization, Advertising & Billing Constants
 * Grounded in docs/Monetization.md, docs/06-Business-Rules.md (RULE-AD-001 to RULE-AD-005, RULE-REWARD-002),
 * and docs/DECISIONS.md (DEC-007, DEC-048, DEC-060, DEC-068, DEC-069, DEC-070).
 */

import { AdPlacementSlotConfig, SubscriptionPlanItem } from '@bnw/types';

// ============================================================================
// 1. Placement Inventory Registry & ASCI Labeling Standards
// ============================================================================

export const ASCI_DISCLOSURE_LABEL_HI = 'विज्ञापन';
export const ASCI_SPONSORED_LABEL_HI = 'प्रायोजित';

export const AD_PLACEMENT_SLOTS: AdPlacementSlotConfig[] = [
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
] as const;

export type ProhibitedAdCategory = (typeof PROHIBITED_AD_CATEGORIES)[number];

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
} as const;

// ============================================================================
// 4. Subscription Plan Registry (DEC-070 Deferred Architecture)
// ============================================================================

export const SUBSCRIPTION_PLANS: SubscriptionPlanItem[] = [
  {
    id: 'sub-plan-free',
    code: 'FREE',
    nameHi: 'निःशुल्क पाठक',
    nameEn: 'Free Reader',
    descriptionHi: 'मानक डिजिटल समाचार, ब्रेकिंग न्यूज़ अलर्ट और सीमित ई-पेपर पूर्वावलोकन।',
    billingInterval: 'monthly',
    priceMinorUnits: 0,
    currency: 'INR',
    includedFeatures: ['दैनिक समाचार पठन', 'ज़िला आधारित बुलेटिन', 'कमेंट्स व पोल सहभागिता'],
    entitlements: ['standard_read'],
    status: 'active',
    isCommercialActive: true, // Free tier is operational
  },
  {
    id: 'sub-plan-ad-free',
    code: 'AD_FREE_SUPPORTER',
    nameHi: 'विज्ञापन-मुक्त समर्थक (मासिक)',
    nameEn: 'Ad-Free Supporter (Monthly)',
    descriptionHi: 'पूर्णतः विज्ञापन-मुक्त पठन अनुभव, तीव्र पेज लोड स्पीड, बिना किसी व्यवधान के।',
    billingInterval: 'monthly',
    priceMinorUnits: 9900, // ₹99.00
    currency: 'INR',
    includedFeatures: ['100% विज्ञापन-मुक्त पठन', 'तीव्र पेज लोडिंग', 'स्वच्छ पाठक मोड'],
    entitlements: ['ad_free', 'fast_cdn'],
    status: 'active',
    isCommercialActive: false, // DEC-070 DEFERRED
    deferralReason: 'DEC-070: Paid reader subscriptions are deferred. Commercial checkout is not active.',
  },
  {
    id: 'sub-plan-premium-archive',
    code: 'PREMIUM_ARCHIVE',
    nameHi: 'प्रीमियम अभिलेखागार व ई-पेपर',
    nameEn: 'Premium Archive & E-Paper',
    descriptionHi: 'विज्ञापन-मुक्त अनुभव के साथ 365 दिनों के ई-पेपर संस्करणों और ऐतिहासिक अभिलेखागार तक पहुंच।',
    billingInterval: 'monthly',
    priceMinorUnits: 14900, // ₹149.00
    currency: 'INR',
    includedFeatures: ['विज्ञापन-मुक्त अनुभव', '365 दिवसीय ई-पेपर आर्काइव', 'पीडीएफ संस्करण डाउनलोड'],
    entitlements: ['ad_free', 'epaper_archive', 'pdf_download'],
    status: 'active',
    isCommercialActive: false, // DEC-070 DEFERRED
    deferralReason: 'DEC-070: Paid reader subscriptions are deferred. Commercial checkout is not active.',
  },
  {
    id: 'sub-plan-patron',
    code: 'PATRON_SUPPORTER',
    nameHi: 'पत्रकारिता संरक्षक (वार्षिक)',
    nameEn: 'Journalism Patron Supporter (Annual)',
    descriptionHi: 'स्वतंत्र जन-पत्रकारिता को संबल देने हेतु विशेष संरक्षक बैज, संपादकीय संवाद व सभी विशेषाधिकार।',
    billingInterval: 'yearly',
    priceMinorUnits: 119900, // ₹1,199.00 / year
    currency: 'INR',
    includedFeatures: ['संरक्षक बैज (Patron Badge)', 'संपादकीय बैठक निमंत्रण', 'समस्त डिजिटल विशेषाधिकार'],
    entitlements: ['ad_free', 'epaper_archive', 'patron_badge', 'editorial_access'],
    status: 'active',
    isCommercialActive: false, // DEC-070 DEFERRED
    deferralReason: 'DEC-070: Paid reader subscriptions are deferred. Commercial checkout is not active.',
  },
];

// ============================================================================
// 5. Ad Delivery Engine Thresholds & Bot Filtering
// ============================================================================

export const AD_DELIVERY_CONSTANTS = {
  // Viewable impression criteria (MRC standard)
  MIN_VIEWABLE_PERCENTAGE: 50, // >= 50% of ad in viewport
  MIN_VIEWABLE_DURATION_MS: 1000, // >= 1.0 second continuous view
  
  // Velocity limits & anti-fraud
  MAX_CLICKS_PER_MINUTE_PER_IP: 5,
  CLICK_WINDOW_MS: 60000,
  
  // Known bots / crawler patterns
  BOT_USER_AGENTS_REGEX: /Googlebot|bingbot|Baiduspider|YandexBot|DuckDuckBot|Slurp|Sogou|curl|wget|python-requests|PostmanRuntime|node-fetch/i,
} as const;

// ============================================================================
// 6. Master Architectural Invariants & Governance Notices
// ============================================================================

export const GOVERNANCE_INVARIANTS = {
  DEC_007: {
    rule: 'NON_MONETARY_COINS',
    notice: 'DEC-007: Coins possess ZERO monetary cash equivalence, cannot be withdrawn to bank accounts or UPI, and cannot be converted to legal currency.',
  },
  DEC_048: {
    pendingRole: 'ROLE_CHIEF_EDITOR',
    errorCode: 'ERR_ROLE_PENDING_APPROVAL',
    status: 'Pending Approval',
    notice: 'DEC-048: ROLE_CHIEF_EDITOR remains Pending Approval and must be actively rejected with 403 Forbidden.',
  },
  DEC_060: {
    brandLogoSha256: '88407B32CCF924B10CCD6C9E17DF367D36C174AE7DEF441A26D8E5FDC035209F',
    statuteCompliance: 'State Emblem of India (Prohibition of Improper Use) Act 2005',
  },
  DEC_069: {
    rule: 'NO_CLICK_REVENUE_SHARING',
    status: 'Rejected',
    notice: 'DEC-069: Direct per-click or per-impression stringer revenue sharing is strictly rejected.',
  },
  DEC_070: {
    rule: 'SUBSCRIPTION_DEFERRED',
    status: 'Deferred',
    notice: 'DEC-070: Paid reader subscriptions are deferred. Commercial checkout is not active.',
  },
  RULE_REWARD_002: {
    rule: 'REFERRAL_REWARD_ATTRIBUTION',
    status: 'Pending Approval',
    notice: 'RULE-REWARD-002: Referral reward attribution rule remains Pending Approval. Automatic issuance of coin rewards is disabled.',
  },
} as const;

