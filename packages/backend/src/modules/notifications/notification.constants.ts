/**
 * BREAKING NEWS WALA — Notification Constants & Policy Thresholds
 * Grounded in docs/06-Business-Rules.md (RULE-NOT-001 through RULE-NOT-006)
 * and docs/DECISIONS.md (DEC-031).
 */

export const NOTIFICATION_CHANNELS = [
  'breaking_news',
  'district_news',
  'editorial_feedback',
  'assignment_alert',
  'system_announcement',
] as const;

export const DELIVERY_PLATFORMS = [
  'android_fcm',
  'web_push',
  'in_app',
  'sms',
] as const;

export const DEVICE_PLATFORMS = ['android', 'web', 'ios'] as const;

/**
 * Frequency Capping & Anti-Spam Thresholds (RULE-NOT-003)
 */
export const FREQUENCY_CAP = {
  MAX_HOURLY_PER_DEVICE: 3,  // Maximum 3 push alerts per hour
  MAX_DAILY_PER_DEVICE: 10,  // Maximum 10 push alerts per 24 hours
  WINDOW_HOURLY_MS: 60 * 60 * 1000,
  WINDOW_DAILY_MS: 24 * 60 * 60 * 1000,
};

/**
 * Night-Time Quiet Hours Policy (RULE-NOT-005)
 * 22:00 (10:00 PM) to 06:00 (6:00 AM) Indian Standard Time (IST)
 */
export const QUIET_HOURS = {
  START_HOUR_IST: 22, // 10:00 PM
  END_HOUR_IST: 6,    // 06:00 AM
  TIMEZONE: 'Asia/Kolkata',
};

/**
 * Standard Topic Naming Patterns (DEC-031, RULE-NOT-004)
 */
export const TOPIC_PATTERNS = {
  STATE_BREAKING: 'topic_breaking_mp',
  DISTRICT_PREFIX: 'topic_district_',
  CATEGORY_PREFIX: 'topic_cat_',
};

/**
 * Text Length & Payload Constraints
 */
export const NOTIFICATION_LIMITS = {
  MAX_TITLE_LENGTH: 150,
  MIN_TITLE_LENGTH: 5,
  MAX_BODY_LENGTH: 500,
  MIN_BODY_LENGTH: 5,
  MAX_TOKEN_LENGTH: 4096,
  MIN_TOKEN_LENGTH: 10,
  MAX_BATCH_SIZE: 500, // Maximum FCM batch size
};

/**
 * Default User Notification Preferences
 */
export const DEFAULT_PREFERENCES = {
  breakingNews: true,
  districtNews: true,
  preferredDistrictId: null,
  categoryIds: [],
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '06:00',
};

