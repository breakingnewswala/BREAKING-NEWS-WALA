/**
 * @bnw/types — Shared TypeScript Contract Interfaces
 * Grounded in docs/13-API.md, docs/12-Database.md, and docs/DECISIONS.md (DEC-012)
 */

// 1. Standard API Response Envelopes
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: string;
  };
}

export interface ApiErrorDetail {
  field?: string;
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

// 2. Core Article Status Enum (docs/05-Workflows.md)
export type ArticleStatus =
  | 'DRAFT'            // ड्राफ्ट
  | 'PENDING_REVIEW'   // समीक्षाधीन
  | 'VERIFIED'         // सत्यापित
  | 'PUBLISHED'        // प्रकाशित
  | 'REJECTED'         // अस्वीकृत
  | 'RETRACTED';       // वापस लिया गया

// 3. User Roles (docs/14-Auth.md)
export type UserRole =
  | 'PUBLIC_READER'
  | 'CITIZEN_REPORTER'
  | 'ACCREDITED_REPORTER'
  | 'BUREAU_CHIEF'
  | 'DESK_EDITOR'
  | 'CHIEF_EDITOR'
  | 'ADMIN'
  | 'SUPER_ADMIN';

// 4. District Geographic Codes (Madhya Pradesh 55 Districts)
export type MPDivision =
  | 'BHOPAL'
  | 'INDORE'
  | 'GWALIOR'
  | 'JABALPUR'
  | 'UJJAIN'
  | 'SAGAR'
  | 'REWA'
  | 'CHAMBAL'
  | 'NARMADAPURAM'
  | 'SHAHDOL';

// 5. Design & Graphics Studio Types (BNW-MASTER-003, DOM-H)
export type DesignStudioType = 'graphic' | 'thumbnail' | 'social';

export type DesignAspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '1.91:1' | '3:1' | 'custom';

export type DesignElementType =
  | 'text'
  | 'image'
  | 'shape'
  | 'line'
  | 'badge'
  | 'logo'
  | 'group';

export type ShapeKind =
  | 'rectangle'
  | 'rounded_rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'divider';

export type BadgeKind =
  | 'breaking_ribbon'
  | 'location'
  | 'datetime'
  | 'social_handle'
  | 'exclusive'
  | 'fact_checked';

export interface BaseDesignElement {
  id: string;
  type: DesignElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  isLocked: boolean;
  isVisible: boolean;
  groupId?: string;
}

export interface TextDesignElement extends BaseDesignElement {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string | number;
  lineHeight: number;
  letterSpacing: number;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  color: string;
  backgroundColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  isDevanagari?: boolean;
}

export interface ImageDesignElement extends BaseDesignElement {
  type: 'image';
  mediaId?: string;
  imageUrl: string;
  altText?: string;
  objectFit: 'contain' | 'cover' | 'fill';
  crop?: { x: number; y: number; width: number; height: number };
  naturalWidth?: number;
  naturalHeight?: number;
  blurhash?: string;
}

export interface ShapeDesignElement extends BaseDesignElement {
  type: 'shape';
  shapeKind: ShapeKind;
  fillColor: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
}

export interface BadgeDesignElement extends BaseDesignElement {
  type: 'badge';
  badgeKind: BadgeKind;
  text: string;
  icon?: string;
  primaryColor: string;
  secondaryColor?: string;
  textColor: string;
}

export interface LogoDesignElement extends BaseDesignElement {
  type: 'logo';
  variant: 'official_primary' | 'white_monochrome' | 'dark_monochrome';
  imageUrl: string;
  keepAspectRatio: true;
  minWidth?: number;
}

export interface GroupDesignElement extends BaseDesignElement {
  type: 'group';
  childElementIds: string[];
}

export type DesignElement =
  | TextDesignElement
  | ImageDesignElement
  | ShapeDesignElement
  | BadgeDesignElement
  | LogoDesignElement
  | GroupDesignElement;

export interface CanvasDimensions {
  width: number;
  height: number;
  aspectRatio: DesignAspectRatio;
  label: string;
}

export interface CanvasBackground {
  type: 'color' | 'image' | 'gradient';
  value: string;
  opacity?: number;
}

export interface DesignDocument {
  id: string;
  title: string;
  description?: string;
  studioType: DesignStudioType;
  dimensions: CanvasDimensions;
  background: CanvasBackground;
  elements: DesignElement[];
  templateId?: string;
  associatedArticleId?: string;
  brandProfileId?: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DesignTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  studioType: DesignStudioType;
  dimensions: CanvasDimensions;
  previewUrl?: string;
  schema: DesignDocument;
  categoryRestrictionId?: string | null;
  isActive: boolean;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandAssetProfile {
  id: string;
  channelNameHi: string;
  channelNameEn: string;
  logoUrl: string;
  logoHash: string;
  primaryYellow: string;
  primaryRed: string;
  primaryBlue: string;
  charcoal: string;
  midnight: string;
  pureWhite: string;
  approvedFonts: Array<{ name: string; category: string; fallback: string }>;
  watermarkEnabled: boolean;
  safeMarginPercent: number;
}

export interface ExportDesignPayload {
  designId?: string;
  document?: DesignDocument;
  format: 'png' | 'jpeg' | 'webp' | 'svg';
  scaleFactor: 1 | 2 | 3;
  quality?: number; // 0.1 to 1.0
  transparentBackground?: boolean;
}

export interface ExportDesignResult {
  exportId: string;
  format: string;
  width: number;
  height: number;
  fileSizeBytes?: number;
  dataUrl?: string;
  downloadUrl: string;
  createdAt: string;
}

// ============================================================================
// 6. Video Production Studio Types (BNW-MASTER-004, DOM-I)
// ============================================================================

export type VideoAspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | 'custom';
export type VideoResolution = '480p' | '720p' | '1080p' | '4k';
export type VideoTrackType = 'video' | 'image' | 'graphics' | 'text' | 'subtitle' | 'audio' | 'voiceover';
export type VideoClipType =
  | 'video'
  | 'image'
  | 'text'
  | 'lower_third'
  | 'ticker'
  | 'intro'
  | 'outro'
  | 'audio'
  | 'voiceover';

export interface VideoClip {
  id: string;
  trackId: string;
  name?: string;
  mediaAssetId?: string;
  clipType: VideoClipType;
  timelineStart: number; // in seconds
  timelineDuration: number; // in seconds
  startTime?: number; // alias for timelineStart
  duration?: number; // alias for timelineDuration
  sourceStart: number; // in seconds
  sourceEnd: number; // in seconds
  sourceDuration?: number; // in seconds
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scale?: number;
  rotation?: number;
  opacity?: number;
  volume?: number; // 0 to 1
  fadeInSeconds?: number;
  fadeOutSeconds?: number;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  mediaUrl?: string;
  isLocked?: boolean;
  isVisible?: boolean;
  isMuted?: boolean;
  properties?: Record<string, any>;
}

export interface VideoTrack {
  id: string;
  name: string;
  type: VideoTrackType;
  order: number;
  isLocked: boolean;
  isVisible: boolean;
  isMuted: boolean;
  clips: VideoClip[];
}

export interface VideoSubtitleCue {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
  position?: 'bottom' | 'top' | 'middle';
  style?: {
    fontSize?: number;
    fontColor?: string;
    backgroundColor?: string;
    outlineColor?: string;
  };
}

export interface VideoSubtitleTrack {
  id: string;
  language: string;
  cues: VideoSubtitleCue[];
  isBurnedIn: boolean;
}

export interface VideoProjectDocument {
  id: string;
  title: string;
  description?: string;
  aspectRatio: VideoAspectRatio;
  width: number;
  height: number;
  fps: number;
  duration: number; // total duration in seconds
  tracks: VideoTrack[];
  subtitles?: VideoSubtitleTrack;
  introPresetId?: string;
  outroPresetId?: string;
  templateId?: string;
  associatedNewsId?: string;
  brandProfileId?: string;
  status: 'draft' | 'ready_to_render' | 'rendering' | 'completed' | 'failed';
  version: number;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  aspectRatio: VideoAspectRatio;
  duration: number;
  introBumperUrl?: string;
  outroBumperUrl?: string;
  schema: VideoProjectDocument;
  isActive: boolean;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type VideoRenderStatus =
  | 'queued'
  | 'validating'
  | 'preparing'
  | 'rendering'
  | 'uploading'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface VideoRenderJob {
  id: string;
  projectId: string;
  outputFormat: 'mp4';
  resolution: VideoResolution;
  aspectRatio: VideoAspectRatio;
  status: VideoRenderStatus;
  progressPercent: number;
  statusMessage?: string;
  outputMediaId?: string;
  outputUrl?: string;
  fileSizeBytes?: number;
  durationSeconds?: number;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface RenderVideoPayload {
  projectId?: string;
  project?: VideoProjectDocument;
  preset: {
    resolution: VideoResolution;
    fps?: number;
    quality?: 'standard' | 'high';
  };
}

// ============================================================================
// DOM-F: RSS, Content Ingestion & Automation Engine (BNW-MASTER-005)
// ============================================================================

export type RssSourceStatus =
  | 'pending_approval'
  | 'active'
  | 'paused'
  | 'disabled'
  | 'archived'
  | 'failed';

export interface RssSourceItem {
  id: string;
  name: string;
  feedUrl: string;
  publisherName: string;
  publisherWebsite?: string;
  sourceCategory: string;
  geographicCoverage: string;
  language: 'hi' | 'en' | 'mixed';
  status: RssSourceStatus;
  isAuthorized: boolean;
  pollingIntervalMinutes: number;
  lastSuccessfulFetch?: string;
  lastFailedFetch?: string;
  lastHttpStatus?: number;
  lastImportTime?: string;
  createdById: string;
  approvedById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRssSourceDto {
  name: string;
  feedUrl: string;
  publisherName: string;
  publisherWebsite?: string;
  sourceCategory?: string;
  geographicCoverage?: string;
  language?: 'hi' | 'en' | 'mixed';
  pollingIntervalMinutes?: number;
}

export interface UpdateRssSourceDto {
  name?: string;
  feedUrl?: string;
  publisherName?: string;
  publisherWebsite?: string;
  sourceCategory?: string;
  geographicCoverage?: string;
  language?: 'hi' | 'en' | 'mixed';
  pollingIntervalMinutes?: number;
  status?: RssSourceStatus;
  isAuthorized?: boolean;
}

export interface ImportedRssItemDto {
  id: string;
  rssSourceId: string;
  guidHash: string;
  originalTitle: string;
  originalUrl: string;
  originalContent?: string;
  originalSummary?: string;
  author?: string;
  publishedAt?: string;
  importedAt: string;
  generatedNewsId?: string;
  aiProcessingStatus: 'pending' | 'completed' | 'failed' | 'skipped';
  storyClusterId?: string;
  sourceAttribution: string;
  categories: string[];
  mediaUrls: string[];
}

export interface StoryClusterItem {
  id: string;
  title: string;
  primaryCategory: string;
  itemCount: number;
  sourceIds: string[];
  itemIds: string[];
  firstSeenAt: string;
  lastUpdatedAt: string;
}

export type AutomationTriggerType =
  | 'rss_item_discovered'
  | 'rss_source_fetch_completed'
  | 'rss_import_completed'
  | 'article_draft_created'
  | 'article_submitted'
  | 'article_published'
  | 'scheduled_time_reached'
  | 'manual_execution';

export type AutomationActionType =
  | 'normalize_rss_content'
  | 'request_ai_summary'
  | 'suggest_category'
  | 'suggest_tags'
  | 'create_editorial_task'
  | 'notify_editor'
  | 'add_to_review_queue'
  | 'generate_processing_report';

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'in';
  value: any;
}

export interface AutomationActionConfig {
  actionType: AutomationActionType;
  params: Record<string, any>;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTriggerType;
  conditions: AutomationCondition[];
  actions: AutomationActionConfig[];
  status: 'active' | 'inactive' | 'paused';
  executionPolicy: {
    maxHops: number;
    timeoutMs: number;
    preventLoops: boolean;
  };
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationExecutionLog {
  id: string;
  automationId: string;
  automationName: string;
  triggerType: AutomationTriggerType;
  triggerEntityId: string;
  status: 'success' | 'failed' | 'skipped' | 'partial';
  startedAt: string;
  completedAt: string;
  durationMs: number;
  actionsExecuted: Array<{
    actionType: string;
    status: string;
    result?: any;
    error?: string;
  }>;
  error?: string;
  retryCount: number;
}

export interface FeedValidationResult {
  isValid: boolean;
  feedUrl: string;
  title?: string;
  description?: string;
  language?: string;
  itemCount?: number;
  sampleItems?: Array<{
    title: string;
    link: string;
    pubDate?: string;
    summary?: string;
  }>;
  error?: string;
  securityCheck: {
    isSsrfSafe: boolean;
    ipResolved?: string;
    protocol: string;
  };
}

export interface AiResearchRequest {
  query: string;
  category?: string;
  district?: string;
  contextSources?: string[];
}

export interface AiResearchResponse {
  query: string;
  verifiedClaims: string[];
  sourceClaims: string[];
  contradictionsFound: string[];
  missingEvidence: string[];
  recommendedFollowUps: string[];
  suggestedAngle: string;
  sourceAttributions: string[];
}

export interface AiSourceComparisonRequest {
  items: Array<{
    sourceName: string;
    title: string;
    content: string;
    publishedAt?: string;
  }>;
}

export interface AiSourceComparisonResponse {
  commonPoints: string[];
  conflictingDetails: Array<{
    topic: string;
    differences: Record<string, string>;
  }>;
  uniqueInsights: Record<string, string[]>;
  recommendedSynthesis: string;
}

export interface AiGrammarReviewRequest {
  hindiText: string;
}

export interface AiGrammarReviewResponse {
  originalText: string;
  correctedText: string;
  corrections: Array<{
    original: string;
    replacement: string;
    reason: string;
    ruleType: 'matra' | 'spelling' | 'journalistic_tone' | 'syntax';
  }>;
  toneScore: number;
}

export interface AiTranslateRequest {
  text: string;
  sourceLang: 'en' | 'hi';
  targetLang: 'en' | 'hi';
  domain?: string;
}

export interface AiTranslateResponse {
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  preservedEntities: string[];
}

// ============================================================================
// 10. Central API Pool, Integrations & Social Media Publishing (BNW-MASTER-006)
// ============================================================================

export type IntegrationCategory =
  | 'social_media'
  | 'notifications'
  | 'ai_services'
  | 'media_processing'
  | 'analytics'
  | 'storage'
  | 'external_integrations';

export type ProviderConfigStatus = 'configured' | 'pending_configuration' | 'unsupported';

export type ProviderConnectionStatus =
  | 'connected'
  | 'active'
  | 'disabled'
  | 'pending_authorization'
  | 'authorization_expired'
  | 'error'
  | 'unsupported';

export type ProviderHealthStatus =
  | 'healthy'
  | 'degraded'
  | 'rate_limited'
  | 'disconnected'
  | 'authentication_required'
  | 'error'
  | 'unknown';

export interface IntegrationProviderItem {
  id: string;
  providerId: string;
  name: string;
  category: IntegrationCategory;
  documentationUrl?: string;
  baseUrl?: string;
  authMethod: 'oauth2' | 'api_key' | 'service_account' | 'bot_token' | 'none';
  supportedCapabilities: string[];
  requiredScopes: string[];
  configStatus: ProviderConfigStatus;
  connectionStatus: ProviderConnectionStatus;
  healthStatus: ProviderHealthStatus;
  isEnabled: boolean;
  rateLimitInfo?: string;
  lastSuccessfulRequestAt?: string;
  lastFailedRequestAt?: string;
  lastErrorMessage?: string;
  maskedCredential?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIntegrationProviderDto {
  providerId: string;
  name: string;
  category: IntegrationCategory;
  documentationUrl?: string;
  baseUrl?: string;
  authMethod: 'oauth2' | 'api_key' | 'service_account' | 'bot_token' | 'none';
  supportedCapabilities: string[];
  requiredScopes?: string[];
  apiKey?: string;
  clientSecret?: string;
  rateLimitInfo?: string;
  isEnabled?: boolean;
}

export interface UpdateIntegrationProviderDto {
  name?: string;
  baseUrl?: string;
  apiKey?: string;
  clientSecret?: string;
  rateLimitInfo?: string;
  isEnabled?: boolean;
  configStatus?: ProviderConfigStatus;
  connectionStatus?: ProviderConnectionStatus;
  healthStatus?: ProviderHealthStatus;
}

export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'youtube'
  | 'x'
  | 'linkedin'
  | 'telegram';

export interface SocialAccountItem {
  id: string;
  providerId: string;
  platform: SocialPlatform;
  accountName: string;
  accountIdentifier: string;
  accountType: 'page' | 'business' | 'channel' | 'profile';
  connectionStatus: 'connected' | 'pending_authorization' | 'authorization_expired' | 'disconnected' | 'error';
  grantedScopes: string[];
  tokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
  isActive: boolean;
  lastSyncAt?: string;
  lastPublishedAt?: string;
  connectedByUserId?: string;
  errorDetails?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSocialAccountDto {
  platform: SocialPlatform;
  accountName: string;
  accountIdentifier: string;
  accountType: 'page' | 'business' | 'channel' | 'profile';
  authCode?: string;
  botToken?: string;
  grantedScopes?: string[];
}

export interface UpdateSocialAccountDto {
  accountName?: string;
  isActive?: boolean;
  connectionStatus?: 'connected' | 'pending_authorization' | 'authorization_expired' | 'disconnected' | 'error';
}

export type SocialPublishingStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'QUEUED'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'PARTIALLY_PUBLISHED'
  | 'FAILED'
  | 'CANCELLED'
  | 'RETRY_PENDING';

export interface SocialDeliveryItem {
  id: string;
  jobId: string;
  socialAccountId: string;
  platform: SocialPlatform;
  platformSpecificContent: string;
  status: 'PENDING' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED' | 'CANCELLED' | 'RETRY_PENDING';
  externalPostId?: string;
  externalPostUrl?: string;
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt?: string;
  lastAttemptAt?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialPublishingJobItem {
  id: string;
  articleId?: string;
  mediaAssetId?: string;
  contentSource: 'article' | 'graphic' | 'video' | 'custom';
  title: string;
  masterContent: string;
  articleUrl?: string;
  status: SocialPublishingStatus;
  scheduledAt?: string;
  publishedAt?: string;
  idempotencyKey: string;
  approvedByUserId?: string;
  approvedAt?: string;
  createdByUserId: string;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  deliveries: SocialDeliveryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSocialPublishingJobDto {
  articleId?: string;
  mediaAssetId?: string;
  contentSource?: 'article' | 'graphic' | 'video' | 'custom';
  title: string;
  masterContent: string;
  articleUrl?: string;
  targetAccountIds: string[];
  platformSpecificOverrides?: Partial<Record<SocialPlatform, string>>;
  scheduledAt?: string;
  idempotencyKey?: string;
}

export interface UpdateSocialPublishingJobDto {
  title?: string;
  masterContent?: string;
  articleUrl?: string;
  targetAccountIds?: string[];
  platformSpecificOverrides?: Partial<Record<SocialPlatform, string>>;
  scheduledAt?: string;
}

export interface PlatformPublishingConstraints {
  platform: SocialPlatform;
  displayName: string;
  maxCharacters: number;
  mediaTypesSupported: ('image' | 'video' | 'link' | 'carousel')[];
  aspectRatiosSupported: string[];
  maxMediaCount: number;
  requiresApprovedArticle: boolean;
  docsUrl: string;
}

export interface SocialPlatformPreview {
  platform: SocialPlatform;
  title: string;
  caption: string;
  characterCount: number;
  maxCharacters: number;
  isOverLimit: boolean;
  previewUrl?: string;
  mediaAssetUrl?: string;
  accountHandle?: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  provider: string;
  eventType?: string;
  error?: string;
  timestampFresh: boolean;
  nonceUnique: boolean;
}

export interface WebhookLogItem {
  id: string;
  providerId: string;
  eventType: string;
  deliveryId?: string;
  nonce?: string;
  status: 'verified' | 'rejected' | 'processed' | 'duplicate';
  receivedAt: string;
  errorDetails?: string;
}

// ============================================================================
// DOM-R: Business, Advertising, Subscriptions & Monetization (BNW-MASTER-007)
// ============================================================================

export type AdvertiserAccountStatus =
  | 'DRAFT'
  | 'PENDING_VERIFICATION'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DISABLED'
  | 'draft'
  | 'pending_verification'
  | 'active'
  | 'suspended'
  | 'archived';

export type AdCampaignStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'draft'
  | 'active'
  | 'paused'
  | 'completed';

export type AdPricingModel = 'FIXED_DURATION' | 'CPM' | 'CPC' | 'FLAT_MONTHLY' | 'SPONSORED_POST';

export type AdPlacementCode =
  | 'HEADER_LEADERBOARD'
  | 'HOMEPAGE_IN_FEED'
  | 'ARTICLE_IN_BODY_MPU'
  | 'ARTICLE_SIDEBAR_STICKY'
  | 'CATEGORY_DISTRICT_TOP'
  | 'STICKY_BOTTOM_BANNER'
  | 'VIDEO_REEL_POST_ROLL'
  | 'header_leaderboard'
  | 'homepage_infeed'
  | 'article_body_mpu'
  | 'sidebar_sticky'
  | 'district_top'
  | 'sticky_bottom_banner'
  | 'video_postroll';

export type AdCreativeType = 'image' | 'banner' | 'sponsored_post' | 'video' | 'IMAGE' | 'BANNER' | 'SPONSORED_ARTICLE' | 'VIDEO_CLIP';

export interface AdvertiserItem {
  id: string;
  name?: string;
  organizationName: string;
  contactPerson: string;
  email: string;
  phone: string;
  billingAddress?: string;
  gstin?: string;
  category: string;
  accountStatus: AdvertiserAccountStatus;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  agreementStatus: 'unsigned' | 'pending' | 'signed' | 'expired';
  activeCampaignsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdvertiserDto {
  name?: string;
  organizationName: string;
  contactPerson: string;
  email: string;
  phone: string;
  billingAddress?: string;
  gstin?: string;
  category: string;
}

export interface UpdateAdvertiserDto {
  name?: string;
  organizationName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  billingAddress?: string;
  gstin?: string;
  category?: string;
  accountStatus?: AdvertiserAccountStatus;
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  agreementStatus?: 'unsigned' | 'pending' | 'signed' | 'expired';
}

export interface AdCreativeItem {
  id: string;
  campaignId: string;
  creativeType: AdCreativeType;
  adSlotCode: AdPlacementCode;
  creativeMediaId?: string;
  creativeMediaUrl?: string;
  mediaAssetUrl?: string;
  destinationUrl: string;
  altText?: string;
  headlineHi?: string;
  bodyTextHi?: string;
  targetDistrictId?: string;
  width?: number;
  height?: number;
  isApproved: boolean;
  rejectionReason?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdCreativeDto {
  campaignId: string;
  creativeType: AdCreativeType;
  adSlotCode: AdPlacementCode;
  creativeMediaId?: string;
  creativeMediaUrl?: string;
  mediaAssetUrl?: string;
  destinationUrl: string;
  altText?: string;
  headlineHi?: string;
  bodyTextHi?: string;
  targetDistrictId?: string;
  width?: number;
  height?: number;
}

export interface AdCampaignItem {
  id: string;
  advertiserId: string;
  advertiserName: string;
  campaignName: string;
  description?: string;
  objective?: string;
  startDate: string;
  endDate: string;
  status: AdCampaignStatus;
  targetDistricts: string[];
  targetCategories: string[];
  selectedPlacements: AdPlacementCode[];
  totalBudgetMinorUnits: number;
  spentBudgetMinorUnits: number;
  pricingModel: AdPricingModel;
  impressionsCount?: number;
  clicksCount?: number;
  creatives?: AdCreativeItem[];
  approvalNotes?: string;
  approvedByUserId?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdCampaignDto {
  advertiserId: string;
  campaignName: string;
  description?: string;
  objective?: string;
  startDate: string;
  endDate: string;
  targetDistricts: string[];
  targetCategories?: string[];
  selectedPlacements: AdPlacementCode[];
  totalBudgetMinorUnits: number;
  pricingModel?: AdPricingModel;
}

export interface UpdateAdCampaignDto {
  campaignName?: string;
  description?: string;
  objective?: string;
  startDate?: string;
  endDate?: string;
  targetDistricts?: string[];
  targetCategories?: string[];
  selectedPlacements?: AdPlacementCode[];
  totalBudgetMinorUnits?: number;
  pricingModel?: AdPricingModel;
  status?: AdCampaignStatus;
  approvalNotes?: string;
  approvedByUserId?: string;
  approvedAt?: string;
}

export interface AdPlacementSlotConfig {
  code: AdPlacementCode;
  nameHi: string;
  nameEn?: string;
  descriptionHi?: string;
  location?: string;
  dimensions?: { width: number; height: number };
  desktopWidth?: number;
  desktopHeight?: number;
  mobileWidth?: number;
  mobileHeight?: number;
  supportedCreativeTypes: AdCreativeType[];
  maxFileSizeBytes?: number;
  densityRule?: string;
  baseRatePaise?: number;
  pricingModel?: AdPricingModel;
  minDurationDays?: number;
  maxConcurrentCampaigns?: number;
  requiresDistrictTargeting?: boolean;
  isActive: boolean;
}

export interface SubscriptionPlanItem {
  id: string;
  code: string;
  nameHi: string;
  nameEn: string;
  descriptionHi: string;
  billingInterval: 'monthly' | 'quarterly' | 'annual' | 'yearly';
  priceMinorUnits: number;
  currency: 'INR';
  includedFeatures: string[];
  entitlements: string[];
  status: 'active' | 'draft' | 'deferred' | 'retired';
  isCommercialActive: boolean;
  deferralReason?: string;
}

export interface UserEntitlementItem {
  id: string;
  userId: string;
  entitlementCode: string;
  source: 'coin_perk' | 'subscription' | 'admin_grant' | 'referral';
  referenceId?: string;
  grantedAt: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface ReferralAttributionItem {
  id: string;
  referrerUserId: string;
  referrerCode: string;
  referredUserId: string;
  attributionStatus: 'pending' | 'qualified' | 'fraud_flagged' | 'rejected' | 'pending_verification';
  rewardStatus: 'pending_approval' | 'rewarded' | 'disabled' | 'pending_governance_approval';
  governanceNote?: string;
  referredAt: string;
}

export interface PaymentOrderItem {
  id: string;
  orderNumber: string;
  userId?: string;
  advertiserId?: string;
  campaignId?: string;
  amountMinorUnits: number;
  currency: 'INR';
  status: 'created' | 'pending' | 'paid' | 'failed' | 'refunded';
  provider: 'razorpay' | 'phonepe' | 'cashfree' | 'sandbox' | string;
  providerOrderId?: string;
  providerPaymentId?: string;
  idempotencyKey: string;
  createdAt: string;
  paidAt?: string;
}

export interface InvoiceLineItem {
  id?: string;
  description: string;
  sacCode: string;
  quantity: number;
  unitPriceMinorUnits: number;
  totalMinorUnits: number;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  advertiserId?: string;
  advertiserName: string;
  gstin?: string;
  billingAddress?: string;
  issueDate: string;
  dueDate: string;
  currency: 'INR';
  subtotalMinorUnits: number;
  cgstMinorUnits: number;
  sgstMinorUnits: number;
  igstMinorUnits: number;
  totalAmountMinorUnits: number;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED' | 'REFUNDED';
  lineItems: InvoiceLineItem[];
  paymentOrderId?: string;
  paidAt?: string;
  createdAt: string;
}

export interface MonetizationDashboardStats {
  activeCampaignsCount?: number;
  totalAdvertisersCount?: number;
  totalImpressionsServed?: number;
  totalValidClicks?: number;
  verifiedAdRevenuePaise?: number;
  pendingCreativesCount?: number;
  activeSubscribersCount?: number;
  advertising?: {
    totalAdvertisers: number;
    activeAdvertisers: number;
    activeCampaigns: number;
    pendingCampaignApprovals: number;
    totalImpressionsRecorded: number;
    totalClicksRecorded: number;
    averageCtrPercent: number;
  };
  subscriptions?: {
    totalPlans: number;
    activeEntitlementsCount: number;
    isPaidSubscriptionActive: boolean;
    subscriptionGovernanceStatus: 'DEFERRED' | 'ACTIVE';
  };
  coinsAndRewards?: {
    totalIssuedCoins: number;
    totalRedeemedCoins: number;
    outstandingCirculationCoins: number;
    totalRedemptionsCount: number;
    dailyCapPerUser: number;
  };
  referrals?: {
    totalReferrals: number;
    qualifiedReferrals: number;
    ruleReward002Status: 'Pending Approval' | 'Approved' | 'Disabled';
    rewardIssuanceActive: boolean;
  };
  billingAndRevenue?: {
    verifiedRevenueMinorUnits: number;
    pendingReceivablesMinorUnits: number;
    totalInvoicesCount: number;
    paidInvoicesCount: number;
    paymentGatewayStatus: 'SANDBOX_READY' | 'ACTIVE' | 'DEFERRED';
  };
}

// ============================================================================
// DOM-O, DOM-S, DOM-T: Audience, Analytics, SEO & E-Paper (BNW-MASTER-008)
// ============================================================================

export type AnalyticsEventName =
  | 'article_viewed'
  | 'article_read_30s'
  | 'video_heartbeat'
  | 'article_shared'
  | 'category_browsed'
  | 'district_browsed'
  | 'app_session_started'
  | 'app_session_ended'
  | 'article_scroll_depth'
  | 'search_performed'
  | 'search_result_clicked'
  | 'newsletter_subscribed'
  | 'epaper_opened'
  | 'epaper_page_viewed'
  | 'epaper_downloaded'
  | 'content_bookmarked';

export type ClientPlatform = 'web_desktop' | 'web_mobile' | 'android';

export type TrafficSource =
  | 'direct'
  | 'organic_search'
  | 'social_whatsapp'
  | 'social_other'
  | 'external_referral'
  | 'internal_navigation'
  | 'unknown';

export type TimeRangeOption = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'custom';

export interface AnalyticsEventProperties {
  article_id?: string;
  category?: string;
  district?: string;
  reading_time_seconds?: number;
  scroll_depth_percent?: number;
  traffic_source?: TrafficSource;
  seconds_watched?: number;
  video_id?: string;
  share_target?: string;
  session_duration_seconds?: number;
  consent_state?: 'granted' | 'opted_out';
  search_query?: string;
  results_count?: number;
  epaper_edition_id?: string;
  epaper_page_number?: number;
  slug?: string;
  referrer?: string;
  url?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface AnalyticsEventPayload {
  event_id: string;
  event_name: AnalyticsEventName;
  event_version?: string;
  timestamp: string;
  platform: ClientPlatform;
  session_hash?: string;
  user_id?: string;
  properties: AnalyticsEventProperties;
}

export interface AudienceOverviewStats {
  totalPageViews: number;
  uniqueSessionsEstimate: number;
  dailyActiveSessions: number;
  weeklyActiveSessions: number;
  monthlyActiveSessions: number;
  returningSessionsEstimate: number;
  avgEngagementTimeSeconds: number;
  platformDistribution: Record<ClientPlatform, number>;
  trafficSourceBreakdown: Record<TrafficSource, number>;
  peakHours: Array<{ hour: number; count: number }>;
}

export interface ContentPerformanceStats {
  topArticles: Array<{
    articleId: string;
    title: string;
    slug: string;
    category: string;
    district: string;
    totalViews: number;
    uniqueSessionsEstimate: number;
    avgReadTimeSeconds: number;
    sharesCount: number;
    publishedAt: string;
  }>;
  topCategories: Array<{ category: string; count: number; percentage: number }>;
  topDistricts: Array<{ district: string; count: number; percentage: number }>;
  videoPerformance: {
    totalVideosTracked: number;
    totalWatchTimeSeconds: number;
    avgCompletionRatePercent: number;
  };
  timeSeries: Array<{ date: string; views: number; uniqueSessions: number }>;
}

export interface DistrictAudienceInsight {
  districtId: string;
  districtNameHi: string;
  divisionNameHi: string;
  totalViews: number;
  activeSessionsEstimate: number;
  topCategory: string;
  topArticleTitle: string;
  coverageArticleCount: number;
}

export interface EditorialPerformanceReport {
  articlesPublished: number;
  articlesReviewed: number;
  articlesRejected: number;
  articlesRevisionRequested: number;
  avgReviewTurnaroundMinutes: number;
  publishingFrequencyPerDay: number;
  rejectionRatePercent: number;
  revisionRatePercent: number;
  reporterSelfScorecard?: {
    authorId: string;
    totalSubmissions: number;
    approvedStories: number;
    rejectionRatio: number;
    totalReads: number;
    avgReadDurationSeconds: number;
  };
}

export interface ContentComparisonResult {
  entity1: { id: string; name: string; views: number; avgReadTimeSeconds: number; shares: number };
  entity2: { id: string; name: string; views: number; avgReadTimeSeconds: number; shares: number };
  viewsDifferencePercent: number;
  hasSufficientData: boolean;
}

// Audience Segmentation & Preferences
export interface AudiencePreferenceItem {
  id: string;
  userId: string;
  preferredDistricts: string[];
  preferredCategories: string[];
  preferredFormats: string[];
  notificationEmail: boolean;
  notificationPush: boolean;
  newsletterSubscribed: boolean;
  updatedAt: string;
}

export interface UpdateAudiencePreferenceDto {
  preferredDistricts?: string[];
  preferredCategories?: string[];
  preferredFormats?: string[];
  notificationEmail?: boolean;
  notificationPush?: boolean;
  newsletterSubscribed?: boolean;
}

export interface AudienceSegmentItem {
  id: string;
  code: string;
  name: string;
  description: string;
  criteria: Record<string, any>;
  estimatedSize: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAudienceSegmentDto {
  code: string;
  name: string;
  description: string;
  criteria: Record<string, any>;
}

export interface AudienceInsightsSummary {
  totalAudienceProfiles: number;
  segments: AudienceSegmentItem[];
  topDistrictInterestGroups: Array<{ district: string; readerCount: number }>;
  topCategoryInterestGroups: Array<{ category: string; readerCount: number }>;
  formatPreferences: { textNewsPercent: number; videoNewsPercent: number; epaperPercent: number };
}

// Trending News Engine
export interface TrendingArticleItem {
  articleId: string;
  title: string;
  slug: string;
  category: string;
  district: string;
  viewsLast15m: number;
  trendingScore: number;
  isVideo: boolean;
  publishedAt: string;
}

export interface TrendingNewsFilter {
  category?: string;
  district?: string;
  division?: string;
  videoOnly?: boolean;
  limit?: number;
}

export interface TrendingExclusionItem {
  id: string;
  articleId: string;
  reason: string;
  excludedByUserId: string;
  excludedAt: string;
}

export interface CreateTrendingExclusionDto {
  articleId: string;
  reason: string;
}

// SEO Management
export interface ArticleSeoMetadataItem {
  id: string;
  articleId: string;
  seoTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  focusKeywords: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  twitterCardType: string;
  robotsDirectives: string;
  structuredDataType: string;
  isIndexed: boolean;
  searchConsoleStatus: string;
  updatedAt: string;
}

export interface UpdateArticleSeoDto {
  seoTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  focusKeywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  twitterCardType?: string;
  robotsDirectives?: string;
}

export interface SeoValidationResult {
  isValid: boolean;
  seoScore: number;
  titleLength: number;
  descriptionLength: number;
  titleStatus: 'good' | 'too_short' | 'too_long';
  descriptionStatus: 'good' | 'too_short' | 'too_long';
  hasCanonicalUrl: boolean;
  hasOgImage: boolean;
  issues: string[];
  recommendations: string[];
  structuredDataJsonLd: Record<string, any>;
}

export interface SearchConsoleIntegrationStatus {
  siteUrl: string;
  propertyType: string;
  connectionStatus: 'pending_configuration' | 'connected' | 'error' | 'disconnected';
  serviceAccountEmail?: string;
  lastSyncAt?: string;
  verifiedOwnership: boolean;
}

// E-Paper Management
export type EpaperEditionStatus =
  | 'DRAFT'
  | 'PROCESSING'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'FAILED'
  | 'ARCHIVED'
  | 'RETRACTED';

export type EpaperEditionType =
  | 'DAILY'
  | 'DISTRICT'
  | 'SPECIAL'
  | 'SUPPLEMENT'
  | 'ARCHIVE';

export interface EpaperPageItem {
  id: string;
  editionId: string;
  pageNumber: number;
  pageTitle?: string;
  imageUrl: string;
  thumbnailImageUrl?: string;
  width: number;
  height: number;
  createdAt: string;
}

export interface EpaperEditionItem {
  id: string;
  editionCode: string;
  title: string;
  editionDate: string;
  editionType: EpaperEditionType;
  language: string;
  districtId?: string;
  status: EpaperEditionStatus;
  pageCount: number;
  coverImageUrl?: string;
  pdfAssetUrl?: string;
  pdfFileSize: number;
  pdfSha256?: string;
  scheduledAt?: string;
  publishedAt?: string;
  createdBy: string;
  approvedBy?: string;
  isPublic: boolean;
  isArchived: boolean;
  viewCount: number;
  downloadCount: number;
  pages?: EpaperPageItem[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEpaperEditionDto {
  editionCode: string;
  title: string;
  editionDate: string;
  editionType?: EpaperEditionType;
  language?: string;
  districtId?: string;
  coverImageUrl?: string;
  pdfAssetUrl?: string;
  pdfFileSize?: number;
  pageCount?: number;
  scheduledAt?: string;
}

export interface UpdateEpaperEditionDto {
  title?: string;
  editionType?: EpaperEditionType;
  districtId?: string;
  coverImageUrl?: string;
  pdfAssetUrl?: string;
  scheduledAt?: string;
  status?: EpaperEditionStatus;
}

export interface EpaperArchiveFilter {
  date?: string;
  districtId?: string;
  editionType?: EpaperEditionType;
  page?: number;
  limit?: number;
}

// ============================================================================
// 10. Enterprise Security, Monitoring, Backup & Production (BNW-MASTER-009)
// ============================================================================

export type SecurityFindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export type SecurityFindingStatus = 'OPEN' | 'IN_PROGRESS' | 'MITIGATED' | 'ACCEPTED' | 'DEFERRED' | 'VERIFIED';

export interface SecurityRiskFinding {
  id: string;
  module: string;
  title: string;
  description: string;
  severity: SecurityFindingSeverity;
  likelihood: 'HIGH' | 'MEDIUM' | 'LOW';
  impact: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: string;
  remediation: string;
  owner: string;
  status: SecurityFindingStatus;
  verificationMethod: string;
  verifiedAt?: string;
}

export type RateLimitTier = 'public' | 'auth' | 'search' | 'media' | 'ai' | 'admin' | 'telemetry';

export interface RateLimitTierConfig {
  windowMs: number;
  maxRequests: number;
}

export type DependencyHealthState = 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'CONFIGURATION_REQUIRED' | 'UNKNOWN';

export interface DependencyHealthProbe {
  name: string;
  type: 'database' | 'cache' | 'storage' | 'queue' | 'ai_provider' | 'social_provider' | 'notification';
  status: DependencyHealthState;
  latencyMs?: number;
  message?: string;
  lastChecked: string;
}

export interface SystemHealthOverview {
  status: DependencyHealthState;
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  dependencies: Record<string, DependencyHealthProbe>;
  memory: {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
  };
}

export interface ApplicationMetricsSnapshot {
  timestamp: string;
  totalRequests: number;
  requestsPerMinute: number;
  statusCodes: {
    '2xx': number;
    '4xx': number;
    '5xx': number;
  };
  latencyP50Ms: number;
  latencyP95Ms: number;
  errorRatePercentage: number;
  activeDatabaseConnections: number;
  queueDepth: number;
}

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export type AlertStatus = 'TRIGGERED' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface SecurityAlertItem {
  id: string;
  fingerprint: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  category: 'security' | 'database' | 'queue' | 'storage' | 'auth' | 'infrastructure';
  occurrences: number;
  firstSeenAt: string;
  lastSeenAt: string;
  acknowledgedBy?: string;
  resolvedBy?: string;
  details?: Record<string, any>;
}

export type BackupStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'VERIFIED' | 'RESTORE_TESTED';

export interface BackupMetadataItem {
  id: string;
  filename: string;
  sizeBytes: number;
  checksumSha256: string;
  tablesCount: number;
  recordsCount: number;
  status: BackupStatus;
  isVerified: boolean;
  verifiedAt?: string;
  restoreTested: boolean;
  restoreTestedAt?: string;
  restoreDurationMs?: number;
  createdAt: string;
  createdByUserId: string;
}

export interface BackupRestoreTestResult {
  backupId: string;
  status: 'SUCCESS' | 'FAILED';
  targetEnvironment: string;
  tablesValidated: number;
  recordsValidated: number;
  durationMs: number;
  checksumVerified: boolean;
  testedAt: string;
  notes: string;
}

export type ProductionReadinessCategory =
  | 'Architecture'
  | 'Authentication'
  | 'Authorization'
  | 'API Security'
  | 'Data Protection'
  | 'Database Reliability'
  | 'Backup & Recovery'
  | 'Monitoring'
  | 'Queue Reliability'
  | 'Storage'
  | 'External Integrations'
  | 'Performance'
  | 'Deployment'
  | 'Documentation'
  | 'Incident Response';

export type ProductionReadinessStatus = 'READY' | 'CONDITIONALLY_READY' | 'NOT_READY' | 'NOT_VERIFIED';

export interface ProductionReadinessScorecardItem {
  id: string;
  category: ProductionReadinessCategory;
  status: ProductionReadinessStatus;
  evidence: string;
  knownGaps: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedAction: string;
}




