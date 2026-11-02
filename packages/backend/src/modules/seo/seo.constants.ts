/**
 * BREAKING NEWS WALA — SEO & Search Engine Management Constants
 * Grounded in docs/SEO.md and docs/06-Business-Rules.md (RULE-SEO-001 to RULE-SEO-005).
 */

export const SEO_LIMITS = {
  TITLE_MIN_LENGTH: 30,
  TITLE_OPTIMAL_MIN: 50,
  TITLE_OPTIMAL_MAX: 70,
  TITLE_MAX_LENGTH: 100,

  DESC_MIN_LENGTH: 80,
  DESC_OPTIMAL_MIN: 120,
  DESC_OPTIMAL_MAX: 160,
  DESC_MAX_LENGTH: 320,

  MAX_KEYWORDS: 10,
  CANONICAL_HOST: 'https://breakingnewswala.com',
  DEFAULT_ROBOTS: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  DEFAULT_PUBLISHER_NAME: 'BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)',
  DEFAULT_LOGO_URL: 'https://breakingnewswala.com/assets/brand-logo.png',
} as const;

export const SUPPORTED_STRUCTURED_DATA_TYPES = [
  'NewsArticle',
  'BreadcrumbList',
  'Organization',
  'WebSite',
  'VideoObject',
] as const;

export const SEARCH_CONSOLE_STATUSES = [
  'pending_configuration',
  'connected',
  'error',
  'disconnected',
] as const;
