/**
 * BREAKING NEWS WALA — Notification Types & Domain Models
 * Grounded in docs/12-Database.md (DOM-A: DeviceRegistration, DOM-L: Notification & Push System),
 * docs/13-API.md (Section 15, NOTIF-01 through NOTIF-06), and docs/DECISIONS.md (DEC-031).
 */

export type NotificationChannel =
  | 'breaking_news'
  | 'editorial_feedback'
  | 'assignment_alert'
  | 'system_announcement'
  | 'district_news'
  | 'social_publishing';

export type DeliveryPlatform = 'android_fcm' | 'web_push' | 'in_app' | 'sms';

export type DeliveryStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'cancelled';

export type DevicePlatform = 'android' | 'web' | 'ios';

export interface DeviceRegistrationEntity {
  id: string;
  userId: string | null;
  platform: DevicePlatform;
  pushToken: string;
  lastActiveAt: Date;
}

export interface NotificationEntity {
  id: string;
  recipientUserId: string | null; // Null indicates broadcast or topic dispatch
  title: string;
  body: string;
  channel: NotificationChannel | string;
  targetScreenUri: string | null;
  isRead: boolean;
  sentAt: Date;
  deliveryLogs?: NotificationDeliveryLogEntity[];
}

export interface NotificationDeliveryLogEntity {
  id: string;
  notificationId: string;
  platform: DeliveryPlatform | string;
  deliveryStatus: DeliveryStatus | string;
  errorDetails: string | null;
  attemptedAt: Date;
}

export interface NotificationPreferencesEntity {
  userId: string;
  breakingNews: boolean;
  districtNews: boolean;
  preferredDistrictId: string | null;
  categoryIds: string[];
  quietHoursEnabled: boolean;
  quietHoursStart: string; // e.g. "22:00"
  quietHoursEnd: string;   // e.g. "06:00"
  updatedAt: Date;
}

export interface RegisterDeviceDto {
  platform: DevicePlatform;
  pushToken: string;
}

export interface UpdatePreferencesDto {
  breakingNews?: boolean;
  districtNews?: boolean;
  preferredDistrictId?: string | null;
  categoryIds?: string[];
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface AdminBroadcastDto {
  title: string;
  body: string;
  channel?: string;
  targetDistrictId?: string;
  isStateBreaking?: boolean;
  targetScreenUri?: string;
  bypassQuietHours?: boolean;
  bypassFrequencyCap?: boolean;
}

export interface ArticlePublishedNotificationEvent {
  eventId: string;
  articleId: string;
  title: string;
  slug: string;
  summary?: string;
  districtId: string;
  divisionId?: string;
  isBreaking: boolean;
  isStateBreaking?: boolean;
  publishedAt: string;
}

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  deepLink?: string;
  silent?: boolean;
  priority?: 'high' | 'normal' | 'low';
}

export interface PushSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  unregisteredTokens?: string[];
  platform?: string;
}

export interface DispatchJob {
  id: string;
  notificationId: string;
  targetType: 'topic' | 'token' | 'user';
  target: string;
  payload: PushPayload;
  channel: string;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  error?: string;
}

export interface DispatchResult {
  notificationId: string;
  totalTargets: number;
  queuedPlatforms: string[];
  suppressedReason?: string;
  status: 'queued' | 'dispatched' | 'suppressed';
}

export interface SocialPublishingNotificationEvent {
  eventId: string;
  jobId: string;
  eventType:
    | 'social_post_approved'
    | 'social_post_scheduled'
    | 'social_post_publishing_started'
    | 'social_post_published'
    | 'social_post_failed'
    | 'social_post_cancelled'
    | 'reauthorization_required'
    | 'social_account_disconnected'
    | 'provider_api_failure'
    | 'integration_health_warning';
  title: string;
  message: string;
  platforms?: string[];
  status?: string;
  errorDetails?: string;
  recipientRoles?: string[];
  timestamp: string;
}


