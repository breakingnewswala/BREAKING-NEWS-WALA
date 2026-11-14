/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Audience Intelligence, Engagement & Growth Constants
 * Grounded in docs/01-PRD.md, docs/02-Features.md, docs/Analytics.md,
 * docs/06-Business-Rules.md, and DPDPA 2023 Compliance Guidelines.
 */

// ============================================================================
// 1. Telemetry & Analytics Configuration Limits
// ============================================================================

export const AUDIENCE_LIMITS = {
  // Deduplication window for reading hits (30 minutes)
  DEDUP_WINDOW_MS: 30 * 60 * 1000,
  // Dwell time threshold for a verified qualified read
  QUALIFIED_READ_THRESHOLD_SECONDS: 30,
  // Minimum scroll depth percent to be deemed engaged
  ENGAGED_SCROLL_PERCENT: 50,
  // Active reader concurrency window (5 minutes)
  ACTIVE_CONCURRENCY_WINDOW_MS: 5 * 60 * 1000,
  // Maximum reading history records persisted per user
  MAX_READING_HISTORY_PER_USER: 200,
  // Maximum bookmarks per user
  MAX_BOOKMARKS_PER_USER: 500,
  // Maximum followed topics / districts per user
  MAX_FOLLOWED_ENTITIES_PER_USER: 50,
  // Maximum unread notifications retained per user
  MAX_NOTIFICATIONS_PER_USER: 100,
  // Comments rate limit: max comments per user per 10 minutes
  MAX_COMMENTS_PER_10_MIN: 10,
  // Spam report threshold to auto-flag a comment
  COMMENT_REPORT_FLAG_THRESHOLD: 3,
  // Timezone standard for midnight aggregation
  TIMEZONE: 'Asia/Kolkata',
};

// ============================================================================
// 2. Canonical Telemetry Event Taxonomy
// ============================================================================

export const CANONICAL_TELEMETRY_EVENTS = [
  'article_viewed',
  'article_read_30s',
  'article_shared',
  'content_bookmarked',
  'video_heartbeat',
  'category_browsed',
  'district_browsed',
  'search_performed',
  'newsletter_subscribed',
  'feedback_submitted',
  'comment_posted',
  'notification_clicked',
];

// ============================================================================
// 3. Canonical Notification Types
// ============================================================================

export const NOTIFICATION_TYPES = {
  BREAKING_ALERT: 'BREAKING_ALERT',
  DISTRICT_UPDATE: 'DISTRICT_UPDATE',
  TOPIC_UPDATE: 'TOPIC_UPDATE',
  EDITORIAL_ANNOUNCEMENT: 'EDITORIAL_ANNOUNCEMENT',
  SUBSCRIPTION_ALERT: 'SUBSCRIPTION_ALERT',
  COMMENT_REPLY: 'COMMENT_REPLY',
  SYSTEM_NOTICE: 'SYSTEM_NOTICE',
};

// ============================================================================
// 4. Reader Feedback & Correction Categories
// ============================================================================

export const FEEDBACK_CATEGORIES = [
  {
    code: 'fact_correction',
    nameHi: 'तथ्य संशोधन अनुरोध (Fact Correction)',
    descriptionHi: 'समाचार में प्रस्तुत किसी आंकड़े, नाम अथवा तथ्य में त्रुटि सुधार हेतु।',
    requiresArticleId: true,
    slaHours: 4,
  },
  {
    code: 'typo_grammar',
    nameHi: 'वर्तनी या व्याकरण त्रुटि (Typo / Grammar)',
    descriptionHi: 'हिन्दी वर्तनी, नुक्ता या व्याकरणिक अशुद्धि की सूचना।',
    requiresArticleId: true,
    slaHours: 12,
  },
  {
    code: 'offensive_content',
    nameHi: 'आपत्तिजनक या भ्रामक सामग्री (Inappropriate / Misleading)',
    descriptionHi: 'डिजिटल मीडिया आचार संहिता 2021 के उल्लंघन की शिकायत।',
    requiresArticleId: true,
    slaHours: 2,
  },
  {
    code: 'general_feedback',
    nameHi: 'सामान्य पाठक प्रतिक्रिया (General Reader Feedback)',
    descriptionHi: 'समाचार कवरेज, शैली अथवा विषय पर पाठक के विचार।',
    requiresArticleId: false,
    slaHours: 24,
  },
  {
    code: 'app_suggestion',
    nameHi: 'वेबसाइट व तकनीकी सुझाव (Platform Suggestion)',
    descriptionHi: 'यूजर इंटरफेस, स्पीड अथवा नई सुविधाओं के सुझाव।',
    requiresArticleId: false,
    slaHours: 48,
  },
];

// ============================================================================
// 5. Canonical Audience Segments
// ============================================================================

export const CANONICAL_AUDIENCE_SEGMENTS = [
  {
    id: 'seg-general-readers',
    code: 'general_readers',
    nameHi: 'सामान्य पाठक वर्ग',
    nameEn: 'General Readers',
    descriptionHi: 'समस्त सक्रिय पाठक जो राज्यव्यापी एवं राष्ट्रीय समाचार पढ़ते हैं।',
    criteria: {
      minReadCount: 1,
      preferredDistricts: ['ALL'],
      subscriptionTier: 'ALL',
      activityPeriodDays: 30,
    },
    isSystem: true,
    estimatedReach: 84500,
    isActive: true,
    createdAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'seg-bhopal-metro',
    code: 'bhopal_metro_loyalists',
    nameHi: 'भोपाल संभाग जागरूक पाठक',
    nameEn: 'Bhopal Division Hyperlocal Loyalists',
    descriptionHi: 'भोपाल, सीहोर, राजगढ़, रायसेन एवं विदिशा से जुड़े स्थानीय समाचार पाठक।',
    criteria: {
      preferredDistricts: ['भोपाल', 'सीहोर', 'राजगढ़', 'रायसेन', 'विदिशा', 'Bhopal', 'Sehore', 'Rajgarh', 'Raisen', 'Vidisha'],
      minReadCount: 3,
      activityPeriodDays: 14,
    },
    isSystem: true,
    estimatedReach: 28400,
    isActive: true,
    createdAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'seg-malwa-business',
    code: 'malwa_business_watchers',
    nameHi: 'मालवा-निमाड़ व्यापार व कृषि पाठक',
    nameEn: 'Malwa-Nimar Business & Agri Watchers',
    descriptionHi: 'इंदौर, उज्जैन, देवास, धार एवं खरगोन के मंडी भाव व व्यापारिक पाठक।',
    criteria: {
      preferredDistricts: ['इंदौर', 'उज्जैन', 'देवास', 'धार', 'खरगोन', 'Indore', 'Ujjain', 'Dewas', 'Dhar', 'Khargone'],
      preferredCategories: ['business', 'agriculture', 'development'],
      minReadCount: 2,
      activityPeriodDays: 14,
    },
    isSystem: true,
    estimatedReach: 31200,
    isActive: true,
    createdAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'seg-premium-subscribers',
    code: 'premium_patrons',
    nameHi: 'प्रीमियम डिजिटल संरक्षक व शोधार्थी',
    nameEn: 'Premium Digital Patrons & Researchers',
    descriptionHi: 'विज्ञापन-मुक्त योजना, ई-पेपर संग्रह एवं पत्रकारिता समर्थकों का सक्रिय समूह।',
    criteria: {
      subscriptionTier: ['PREMIUM', 'PROFESSIONAL', 'ENTERPRISE'],
      minReadCount: 5,
      activityPeriodDays: 30,
    },
    isSystem: true,
    estimatedReach: 4850,
    isActive: true,
    createdAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'seg-youth-competitive',
    code: 'mp_youth_aspirants',
    nameHi: 'एमपी युवा व प्रतियोगी परीक्षा अभ्यर्थी',
    nameEn: 'MP Youth & Exam Aspirants',
    descriptionHi: 'रोजगार, शिक्षा, एमपीपीएससी एवं युवा विकास से जुड़े पाठक।',
    criteria: {
      preferredCategories: ['education', 'jobs', 'youth', 'governance'],
      minReadCount: 2,
      activityPeriodDays: 7,
    },
    isSystem: true,
    estimatedReach: 42100,
    isActive: true,
    createdAt: '2026-11-01T00:00:00.000Z',
  },
];

// ============================================================================
// 6. Default User Preferences Template (DPDPA 2023 Compliant)
// ============================================================================

export const DEFAULT_USER_PREFERENCES = {
  preferredLanguage: 'hi', // 'hi' | 'en'
  preferredDistricts: ['भोपाल'],
  preferredCategories: ['state', 'politics', 'development'],
  followedTopics: ['मध्य प्रदेश विकास', 'रोजगार', 'स्थानीय निकाय', 'भोपाल मेट्रो'],
  notificationSettings: {
    breakingAlerts: true,
    districtAlerts: true,
    topicAlerts: true,
    editorialAnnouncements: true,
    subscriptionAlerts: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '06:00',
    emailDigestEnabled: false,
  },
  privacySettings: {
    analyticsConsent: true,
    personalizationConsent: true,
    adPersonalizationConsent: false, // Default false (privacy-first)
    dataRetentionConsentMonths: 12,
  },
  contentViewPreferences: {
    fontScale: 'normal', // 'small' | 'normal' | 'large' | 'huge'
    autoPlayVideos: false,
    showThumbnails: true,
    readingMode: 'standard', // 'standard' | 'compact' | 'reading_focus'
  },
};

// ============================================================================
// 7. Seed Readers & Demographic Benchmarks (Authentic MP Distributions)
// ============================================================================

export const SEED_DISTRICT_DISTRIBUTION = [
  { districtId: 'bhopal', districtNameHi: 'भोपाल', districtNameEn: 'Bhopal', percent: 22.4, registeredUsers: 18928, activeDailyEstimate: 9840 },
  { districtId: 'indore', districtNameHi: 'इंदौर', districtNameEn: 'Indore', percent: 24.8, registeredUsers: 20956, activeDailyEstimate: 11200 },
  { districtId: 'gwalior', districtNameHi: 'ग्वालियर', districtNameEn: 'Gwalior', percent: 11.2, registeredUsers: 9464, activeDailyEstimate: 4720 },
  { districtId: 'jabalpur', districtNameHi: 'जबलपुर', districtNameEn: 'Jabalpur', percent: 12.6, registeredUsers: 10647, activeDailyEstimate: 5180 },
  { districtId: 'ujjain', districtNameHi: 'उज्जैन', districtNameEn: 'Ujjain', percent: 8.5, registeredUsers: 7182, activeDailyEstimate: 3620 },
  { districtId: 'sagar', districtNameHi: 'सागर', districtNameEn: 'Sagar', percent: 5.4, registeredUsers: 4563, activeDailyEstimate: 2140 },
  { districtId: 'rewa', districtNameHi: 'रीवा', districtNameEn: 'Rewa', percent: 4.8, registeredUsers: 4056, activeDailyEstimate: 1890 },
  { districtId: 'satna', districtNameHi: 'सतना', districtNameEn: 'Satna', percent: 4.1, registeredUsers: 3464, activeDailyEstimate: 1580 },
  { districtId: 'other_districts', districtNameHi: 'अन्य 47 ज़िले (ग्रामीण मप्र)', districtNameEn: 'Remaining 47 MP Districts', percent: 6.2, registeredUsers: 5240, activeDailyEstimate: 2430 },
];

export const SEED_POPULAR_TOPICS = [
  { tag: 'भोपाल मेट्रो', count: 18450, category: 'विकास' },
  { tag: 'स्वच्छ सर्वेक्षण 2026', count: 14200, category: 'शहरी विकास' },
  { tag: 'एमपीपीएससी परीक्षा', count: 12900, category: 'शिक्षा व रोजगार' },
  { tag: 'महाकाल लोक', count: 11800, category: 'संस्कृति व पर्यटन' },
  { tag: 'लाड़ली बहना योजना', count: 11450, category: 'शासकीय योजनाएं' },
  { tag: 'गेहूं उपार्जन पंजीयन', count: 9800, category: 'कृषि व किसान' },
  { tag: 'नर्मदा एक्सप्रेसवे', count: 8750, category: 'इन्फ्रास्ट्रक्चर' },
  { tag: 'कूनो चीता प्रोजेक्ट', count: 7600, category: 'वन व वन्यजीव' },
];

export const SEED_SEARCH_TRENDING_TERMS = [
  'भोपाल मौसम अपडेट',
  'एमपी बोर्ड परीक्षा समय सारणी',
  'इंदौर मेट्रो कार्य प्रगति',
  'उज्जैन महाकाल भस्म आरती',
  'मध्य प्रदेश शिक्षक भर्ती',
  'ग्वालियर व्यापार मेला 2026',
  'मंडी भाव आज का',
  'बिजली बिल माफी योजना',
];

// ============================================================================
// 8. Audience Error Codes
// ============================================================================

export const AUDIENCE_ERROR_CODES = {
  ERR_PREFERENCE_VALIDATION: 'ERR_PREFERENCE_VALIDATION',
  ERR_BOOKMARK_EXISTS: 'ERR_BOOKMARK_EXISTS',
  ERR_BOOKMARK_NOT_FOUND: 'ERR_BOOKMARK_NOT_FOUND',
  ERR_BOOKMARK_LIMIT_EXCEEDED: 'ERR_BOOKMARK_LIMIT_EXCEEDED',
  ERR_NOTIFICATION_NOT_FOUND: 'ERR_NOTIFICATION_NOT_FOUND',
  ERR_NOTIFICATION_DISPATCH_FAILED: 'ERR_NOTIFICATION_DISPATCH_FAILED',
  ERR_SEGMENT_NOT_FOUND: 'ERR_SEGMENT_NOT_FOUND',
  ERR_SEGMENT_VALIDATION: 'ERR_SEGMENT_VALIDATION',
  ERR_FEEDBACK_VALIDATION: 'ERR_FEEDBACK_VALIDATION',
  ERR_FEEDBACK_NOT_FOUND: 'ERR_FEEDBACK_NOT_FOUND',
  ERR_COMMENT_VALIDATION: 'ERR_COMMENT_VALIDATION',
  ERR_COMMENT_SPAM_DETECTED: 'ERR_COMMENT_SPAM_DETECTED',
  ERR_COMMENT_RATE_LIMITED: 'ERR_COMMENT_RATE_LIMITED',
  ERR_COMMENT_NOT_FOUND: 'ERR_COMMENT_NOT_FOUND',
  ERR_SEARCH_QUERY_INVALID: 'ERR_SEARCH_QUERY_INVALID',
  ERR_PRIVACY_EXPORT_FAILED: 'ERR_PRIVACY_EXPORT_FAILED',
  ERR_PRIVACY_DELETION_FAILED: 'ERR_PRIVACY_DELETION_FAILED',
  ERR_UNAUTHORIZED: 'ERR_UNAUTHORIZED',
  ERR_FORBIDDEN: 'ERR_FORBIDDEN',
};

