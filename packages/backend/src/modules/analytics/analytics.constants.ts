/**
 * BREAKING NEWS WALA — Analytics & Telemetry Constants
 * Grounded in docs/Analytics.md (Section 16, 18, 19), docs/DECISIONS.md (DEC-021),
 * and docs/06-Business-Rules.md (RULE-ANA-001 through RULE-ANA-006).
 */

import { AnalyticsEventName, ClientPlatform, TrafficSource } from './types';

export const ANALYTICS_LIMITS = {
  // 30-minute rolling deduplication window for article reads (RULE-ANA-002, DEC-021)
  DEDUP_WINDOW_SECONDS: 1800,
  DEDUP_WINDOW_MS: 1800 * 1000,

  // 15-minute sliding window for trending score ranking (ADR-ANA-005)
  TRENDING_WINDOW_MS: 15 * 60 * 1000,

  // 5-minute active concurrency reader window
  ACTIVE_READERS_WINDOW_MS: 5 * 60 * 1000,

  // Strict payload size limits (rejects payloads over 64 KB)
  MAX_PAYLOAD_SIZE_BYTES: 64 * 1024,

  // Ingress rate limiting per client IP (120 events/min)
  MAX_INGESTION_RATE_PER_MINUTE: 120,
  RATE_LIMIT_WINDOW_MS: 60 * 1000,

  // Pending message recovery thresholds
  STREAM_RECOVERY_IDLE_TIME_MS: 5000, // 5 seconds for recovery in stream consumer
  MAX_DELIVERY_ATTEMPTS: 3,

  // Timezone standard for midnight aggregation boundaries
  TIMEZONE: 'Asia/Kolkata',
} as const;

export const STREAM_CONFIG = {
  STREAM_KEY: 'stream:analytics:events',
  CONSUMER_GROUP: 'cg:analytics:aggregator',
  CONSUMER_NAME: 'consumer-aggregator-node-1',
} as const;

/**
 * Canonical Master Event Taxonomy (Reconciled for BNW-MASTER-008)
 * Explicitly reconciles article_read_30s from public web and defines new events.
 */
export const APPROVED_EVENT_NAMES: readonly AnalyticsEventName[] = [
  'article_viewed',
  'article_read_30s',
  'video_heartbeat',
  'article_shared',
  'category_browsed',
  'district_browsed',
  'app_session_started',
  'app_session_ended',
  'article_scroll_depth',
  'search_performed',
  'search_result_clicked',
  'newsletter_subscribed',
  'epaper_opened',
  'epaper_page_viewed',
  'epaper_downloaded',
  'content_bookmarked',
] as const;

export const APPROVED_PLATFORMS: readonly ClientPlatform[] = [
  'web_desktop',
  'web_mobile',
  'android',
] as const;

export const APPROVED_TRAFFIC_SOURCES: readonly TrafficSource[] = [
  'direct',
  'organic_search',
  'social_whatsapp',
  'social_other',
  'external_referral',
  'internal_navigation',
  'unknown',
] as const;

/**
 * Master Event Taxonomy Specification Dictionary (docs/Analytics.md Section 16.3)
 */
export interface EventDefinition {
  eventName: AnalyticsEventName;
  triggerCondition: string;
  requiredProps: string[];
  optionalProps: string[];
  platformSource: ClientPlatform[];
  dedupRule: string;
  privacyClassification: 'ANONYMIZED_TELEMETRY' | 'PSEUDONYMIZED_SESSION' | 'EXPLICIT_CONSENT';
  aggregationBehavior: string;
}

export const EVENT_TAXONOMY_REGISTRY: Record<AnalyticsEventName, EventDefinition> = {
  article_viewed: {
    eventName: 'article_viewed',
    triggerCondition: 'Article page component mounts and renders content',
    requiredProps: ['article_id'],
    optionalProps: ['category', 'district', 'traffic_source', 'reading_time_seconds'],
    platformSource: ['web_desktop', 'web_mobile', 'android'],
    dedupRule: '30-minute rolling window per session_hash and article_id (RULE-ANA-002)',
    privacyClassification: 'PSEUDONYMIZED_SESSION',
    aggregationBehavior: 'Increments totalPageViews and conditional uniqueReaders in DailyArticleAnalytics',
  },
  article_read_30s: {
    eventName: 'article_read_30s',
    triggerCondition: 'Reader actively dwells on article page for >= 30 seconds',
    requiredProps: ['article_id'],
    optionalProps: ['slug', 'category', 'district'],
    platformSource: ['web_desktop', 'web_mobile', 'android'],
    dedupRule: 'Once per session per article pageview',
    privacyClassification: 'PSEUDONYMIZED_SESSION',
    aggregationBehavior: 'Boosts content quality score and trending engagement weight',
  },
  video_heartbeat: {
    eventName: 'video_heartbeat',
    triggerCondition: 'Periodic 10s playback ping while video player is active',
    requiredProps: ['video_id'],
    optionalProps: ['seconds_watched', 'article_id'],
    platformSource: ['web_desktop', 'web_mobile', 'android'],
    dedupRule: 'Aggregated per video session; throttled to max 1 ping per 10s',
    privacyClassification: 'ANONYMIZED_TELEMETRY',
    aggregationBehavior: 'Accumulates total watch duration and completion milestones',
  },
  article_shared: {
    eventName: 'article_shared',
    triggerCondition: 'User triggers Web Share API or native share button',
    requiredProps: ['article_id'],
    optionalProps: ['share_target'],
    platformSource: ['web_desktop', 'web_mobile', 'android'],
    dedupRule: 'None (each distinct share intent recorded)',
    privacyClassification: 'ANONYMIZED_TELEMETRY',
    aggregationBehavior: 'Increments share_count on NewsArticle and trending score weight',
  },
  category_browsed: {
    eventName: 'category_browsed',
    triggerCondition: 'User navigates to a category feed page',
    requiredProps: ['category'],
    optionalProps: ['traffic_source'],
    platformSource: ['web_desktop', 'web_mobile', 'android'],
    dedupRule: 'Aggregated per session hour',
    privacyClassification: 'ANONYMIZED_TELEMETRY',
    aggregationBehavior: 'Rolls up into CategoryDistribution counters',
  },
  district_browsed: {
    eventName: 'district_browsed',
    triggerCondition: 'User navigates to or explicitly selects a district news hub',
    requiredProps: ['district'],
    optionalProps: ['traffic_source'],
    platformSource: ['web_desktop', 'web_mobile', 'android'],
    dedupRule: 'Aggregated per session hour',
    privacyClassification: 'ANONYMIZED_TELEMETRY',
    aggregationBehavior: 'Rolls up into DistrictDistribution counters without IP geo-guessing',
  },
  app_session_started: {
    eventName: 'app_session_started',
    triggerCondition: 'Initial page visit or app launch with new rolling session hash',
    requiredProps: [],
    optionalProps: ['traffic_source', 'consent_state'],
    platformSource: ['web_desktop', 'web_mobile', 'android'],
    dedupRule: '1 per rolling session day (session_hash)',
    privacyClassification: 'PSEUDONYMIZED_SESSION',
    aggregationBehavior: 'Updates daily and weekly active sessions estimate',
  },
  app_session_ended: {
    eventName: 'app_session_ended',
    triggerCondition: 'Page unload or app backgrounding with measured duration',
    requiredProps: ['session_duration_seconds'],
    optionalProps: [],
    platformSource: ['web_desktop', 'web_mobile', 'android'],
    dedupRule: '1 per session end',
    privacyClassification: 'ANONYMIZED_TELEMETRY',
    aggregationBehavior: 'Rolls up into average session engagement duration',
  },
  article_scroll_depth: {
    eventName: 'article_scroll_depth',
    triggerCondition: 'Reader reaches 25%, 50%, 75%, or 100% scroll depth on article body',
    requiredProps: ['article_id', 'scroll_depth_percent'],
    optionalProps: ['category', 'district'],
    platformSource: ['web_desktop', 'web_mobile', 'android'],
    dedupRule: 'Max milestone achieved per pageview',
    privacyClassification: 'ANONYMIZED_TELEMETRY',
    aggregationBehavior: 'Calculates read-depth drop-off curve for editorial intelligence',
  },
  search_performed: {
    eventName: 'search_performed',
    triggerCondition: 'User submits a keyword query on search page or navbar',
    requiredProps: ['search_query'],
    optionalProps: ['results_count', 'category', 'district'],
    platformSource: ['web_desktop', 'web_mobile', 'android'],
    dedupRule: 'Throttled per 5 seconds per query text',
    privacyClassification: 'ANONYMIZED_TELEMETRY',
    aggregationBehavior: 'Aggregates search demand and zero-result queries',
  },
  search_result_clicked: {
    eventName: 'search_result_clicked',
    triggerCondition: 'User clicks on an article result in search listings',
    requiredProps: ['search_query', 'article_id'],
    optionalProps: ['category', 'district'],
    platformSource: ['web_desktop', 'web_mobile', 'android'],
    dedupRule: 'None',
    privacyClassification: 'ANONYMIZED_TELEMETRY',
    aggregationBehavior: 'Calculates search result click-through rate (CTR)',
  },
  newsletter_subscribed: {
    eventName: 'newsletter_subscribed',
    triggerCondition: 'User submits explicit consent to receive regional news briefs',
    requiredProps: [],
    optionalProps: ['district', 'category'],
    platformSource: ['web_desktop', 'web_mobile', 'android'],
    dedupRule: '1 per user account or verified email submission',
    privacyClassification: 'EXPLICIT_CONSENT',
    aggregationBehavior: 'Updates newsletter subscriber count and audience segment',
  },
  epaper_opened: {
    eventName: 'epaper_opened',
    triggerCondition: 'Reader opens an approved digital E-Paper edition viewer',
    requiredProps: ['epaper_edition_id'],
    optionalProps: ['district'],
    platformSource: ['web_desktop', 'web_mobile', 'android'],
    dedupRule: '1 per session per edition (30m window)',
    privacyClassification: 'PSEUDONYMIZED_SESSION',
    aggregationBehavior: 'Increments EpaperEdition view_count and daily e-paper readers',
  },
  epaper_page_viewed: {
    eventName: 'epaper_page_viewed',
    triggerCondition: 'Reader flips or navigates to a specific page in E-Paper viewer',
    requiredProps: ['epaper_edition_id', 'epaper_page_number'],
    optionalProps: [],
    platformSource: ['web_desktop', 'web_mobile', 'android'],
    dedupRule: '1 per page flip',
    privacyClassification: 'ANONYMIZED_TELEMETRY',
    aggregationBehavior: 'Evaluates page-by-page readership drop-off for print editors',
  },
  epaper_downloaded: {
    eventName: 'epaper_downloaded',
    triggerCondition: 'Reader initiates download of full edition PDF',
    requiredProps: ['epaper_edition_id'],
    optionalProps: [],
    platformSource: ['web_desktop', 'web_mobile', 'android'],
    dedupRule: '1 per session per edition',
    privacyClassification: 'ANONYMIZED_TELEMETRY',
    aggregationBehavior: 'Increments EpaperEdition download_count',
  },
  content_bookmarked: {
    eventName: 'content_bookmarked',
    triggerCondition: 'Reader saves an article or e-paper edition for later reading',
    requiredProps: ['article_id'],
    optionalProps: ['category'],
    platformSource: ['web_desktop', 'web_mobile', 'android'],
    dedupRule: 'Toggle state per user',
    privacyClassification: 'EXPLICIT_CONSENT',
    aggregationBehavior: 'Measures high-intent content utility',
  },
};

/**
 * Known Bot & Crawler User-Agents (docs/Analytics.md Section 19.1)
 * Incoming telemetry matching these patterns is flagged as bot traffic and
 * excluded from public reach and trending scores.
 */
export const BOT_USER_AGENT_REGEX =
  /googlebot|bingbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|whatsapp|telegrambot|curl|wget|python-requests|headlesschrome|postmanruntime/i;

/**
 * Trending News Scoring Parameters
 * Status: PROPOSED (ADR-ANA-013) - Subject to Editorial Board Confirmation
 * Formula:
 * Score = (Views * 1.0 + Reads30s * 1.5 + Shares * 3.0) * e^(-lambda * (AgeHours))
 * where lambda = ln(2) / HalfLifeHours (6 hours)
 */
export const TRENDING_CONFIG = {
  STATUS: 'PROPOSED' as const,
  ADR_REFERENCE: 'ADR-ANA-013',
  SLIDING_WINDOW_MINUTES: 15,
  MAX_ARTICLE_AGE_HOURS: 48,
  HALF_LIFE_HOURS: 6.0,
  WEIGHTS: {
    RAW_PAGEVIEW: 1.0,
    QUALIFIED_READ_30S: 1.5,
    SOCIAL_SHARE: 3.0,
  },
} as const;

/**
 * Pre-seeded Canonical Audience Segments
 * Grounded in docs/Analytics.md Section 4 and PRD Section 11.
 */
export const CANONICAL_AUDIENCE_SEGMENTS = [
  {
    code: 'general_readers',
    name: 'सामान्य पाठक (General Readers)',
    description: 'वे पाठक जो नियमित रूप से समाचार पढ़ते हैं (All active reading sessions)',
    criteria: { minViews: 1 },
    estimatedSize: 12450,
    isSystem: true,
  },
  {
    code: 'returning_readers',
    name: 'पुनरावृत्त पाठक (Returning Readers)',
    description: 'सप्ताह में 2 या अधिक बार प्लेटफ़ॉर्म पर आने वाले पाठक',
    criteria: { minSessionsPerWeek: 2 },
    estimatedSize: 4820,
    isSystem: true,
  },
  {
    code: 'district_interest_bhopal',
    name: 'भोपाल ज़िला रुचि समूह',
    description: 'भोपाल व आसपास के प्रशासनिक व स्थानीय समाचारों में रुचि रखने वाले',
    criteria: { primaryDistrict: 'bhopal' },
    estimatedSize: 3100,
    isSystem: true,
  },
  {
    code: 'district_interest_indore',
    name: 'इंदौर वाणिज्यिक रुचि समूह',
    description: 'इंदौर, मालवा व व्यापारिक समाचारों में रुचि रखने वाले पाठक',
    criteria: { primaryDistrict: 'indore' },
    estimatedSize: 3450,
    isSystem: true,
  },
  {
    code: 'video_news_consumers',
    name: 'वीडियो बुलेटिन दर्शक (Video Consumers)',
    description: 'वीडियो समाचार और रील्स प्रारूप को प्राथमिकता देने वाले',
    criteria: { preferredFormat: 'video', minVideoViews: 3 },
    estimatedSize: 2180,
    isSystem: true,
  },
  {
    code: 'epaper_subscribers',
    name: 'ई-पेपर पाठक (E-Paper Readers)',
    description: 'प्रिंट लेआउट और डिजिटल दैनिक संस्करण पढ़ने वाले पाठक',
    criteria: { preferredFormat: 'epaper', minEpaperViews: 1 },
    estimatedSize: 1890,
    isSystem: true,
  },
  {
    code: 'newsletter_subscribers',
    name: 'दैनिक बुलेटिन अभिदाता (Newsletter Subscribers)',
    description: 'सहमति प्राप्त दैनिक ई-मेल व व्हाट्सएप सारांश प्राप्तकर्ता',
    criteria: { hasNewsletterSubscription: true },
    estimatedSize: 950,
    isSystem: true,
  },
];
