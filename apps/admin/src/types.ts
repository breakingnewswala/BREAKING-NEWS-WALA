/**
 * BREAKING NEWS WALA — Admin Control Panel TypeScript Contracts
 * Grounded in docs/01-PRD.md, docs/02-Features.md, docs/11-Architecture.md,
 * docs/13-API.md, docs/14-Auth.md, and docs/DECISIONS.md (DEC-048)
 */

export interface AdminUser {
  id: string;
  fullName: string;
  email?: string | null;
  phoneNumber?: string | null;
  roles: string[];
  status: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  deactivatedUsers: number;
  totalReporters: number;
  activeReporters: number;
  pendingReporters: number;
  totalArticles: number;
  publishedArticles: number;
  underReviewArticles: number;
  pendingArticles: number;
  rejectedArticles: number;
  districtCoverageCount: number;
  systemHealth: {
    database: boolean;
    redis: boolean;
    uptimeSeconds: number;
  };
  recentAuditActions: AdminAuditLogItem[];
}

export interface UserManagementItem {
  id: string;
  phoneNumber?: string | null;
  email?: string | null;
  fullName: string;
  roles: string[];
  status: 'active' | 'suspended' | 'deactivated' | string;
  createdAt: string;
  reporterProfile?: {
    reporterCode: string;
    verificationStatus: string;
    isTrustedReporter: boolean;
    trustScore: number;
  } | null;
}

export interface ReporterManagementItem {
  userId: string;
  reporterCode: string;
  fullName: string;
  phoneNumber?: string | null;
  email?: string | null;
  pressIdCardNumber?: string | null;
  verificationStatus: 'pending' | 'verified' | 'rejected' | string;
  isTrustedReporter: boolean;
  canDirectPublish: boolean;
  trustScore: number;
  totalSubmissions: number;
  approvedSubmissions: number;
  verifiedAt?: string | null;
  assignedBeats: Array<{
    id: string;
    locationId: string;
    locationName: string;
    locationType: string;
    assignmentType: string;
  }>;
}

export interface RoleManagementItem {
  id: string;
  name: string;
  displayName: string;
  isSystem: boolean;
  permissions: string[];
}

export interface AdminAuditLogItem {
  id: string;
  actorUserId?: string | null;
  actorName?: string | null;
  action: string;
  targetEntityType: string;
  targetEntityId: string;
  payloadBefore?: any;
  payloadAfter?: any;
  ipAddress: string;
  userAgent?: string | null;
  createdAt: string;
}

export interface SystemSettingItem {
  id: string;
  key: string;
  value: string;
  valueType: string;
  category: string;
  updatedBy?: string | null;
  updatedAt: string;
}

export interface DistrictOption {
  id: string;
  nameHi: string;
  nameEn: string;
  slug: string;
}

export interface AiDashboardStats {
  registeredAgentsCount: number;
  activeAgentsCount: number;
  disabledAgentsCount: number;
  configuredProvidersCount: number;
  healthyProvidersCount: number;
  totalExecutionsCount: number;
  successfulExecutionsCount: number;
  failedExecutionsCount: number;
  fallbackExecutionsCount: number;
  averageLatencyMs: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
}

export interface AdminAgentItem {
  id: string;
  name: string;
  hindiName: string;
  description: string;
  category: string;
  purpose: string;
  status: 'active' | 'disabled' | 'pending_approval';
  version: string;
  assignedTier: string;
  defaultModelId: string;
  promptTemplateId: string;
  promptVersion: string;
  allowedRoles: string[];
  allowedTools: string[];
  timeoutMs: number;
}

export interface AdminProviderItem {
  id: string;
  name: string;
  type: string;
  status: string;
  healthStatus: string;
  priority: number;
  baseUrl: string;
  approvedModels: string[];
  supportedCapabilities: string[];
  hasKmsSecret: boolean;
  keyAliases: string[];
}

export interface AdminKeyItem {
  id: string;
  providerId: string;
  keyAlias: string;
  maskedKey: string;
  quotaLimitQpm: number;
  currentStatus: string;
}

export interface AdminMcpToolItem {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'disabled';
  allowedAgents: string[];
  allowedRoles: string[];
  permissionScope: string;
  timeoutMs: number;
  rateLimitPerMinute: number;
  auditEnabled: boolean;
}

export interface AdminPromptItem {
  id: string;
  name: string;
  purpose: string;
  targetAgentId: string;
  currentVersion: string;
  status: string;
  versions: Array<{
    version: string;
    systemDirective: string;
    templateText: string;
    changelog: string;
    isActive: boolean;
    createdAt: string;
  }>;
}

// 7. Graphics & Design Studio Management Contracts (BNW-MASTER-003, DOM-H)
export interface AdminDesignTemplateItem {
  id: string;
  name: string;
  description: string;
  category: string;
  studioType: 'graphic' | 'thumbnail' | 'social';
  dimensions: {
    width: number;
    height: number;
    aspectRatio: string;
    label: string;
  };
  previewUrl?: string;
  isActive: boolean;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  elementCount: number;
}

export interface AdminBrandProfile {
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
  watermarkEnabled: boolean;
  safeMarginPercent: number;
}

export interface AdminRecentDesignItem {
  id: string;
  title: string;
  studioType: 'graphic' | 'thumbnail' | 'social';
  aspectRatio: string;
  ownerId: string;
  status: 'draft' | 'published' | 'archived';
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDesignStats {
  totalTemplates: number;
  activeTemplates: number;
  archivedTemplates: number;
  totalDesignsCreated: number;
  publishedDesigns: number;
  exportsToday: number;
}

// ============================================================================
// Video Production Studio & FFmpeg Pipeline Admin Types (BNW-MASTER-004)
// ============================================================================

export interface AdminVideoTemplateItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  aspectRatio: string;
  duration: number;
  introBumperUrl?: string;
  outroBumperUrl?: string;
  isActive: boolean;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminVideoRenderJobItem {
  id: string;
  projectId: string;
  outputFormat: string;
  resolution: string;
  aspectRatio: string;
  status: string;
  progressPercent: number;
  statusMessage?: string;
  outputUrl?: string;
  fileSizeBytes?: number;
  durationSeconds?: number;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface AdminVideoHealth {
  ffmpegAvailable: boolean;
  ffmpegVersion: string;
  allowedCodecs: {
    VIDEO: string[];
    AUDIO: string[];
    CONTAINER: string[];
  };
  constraints: {
    MIN_DURATION_SEC: number;
    MAX_DURATION_SEC: number;
    MAX_TRACKS: number;
    MAX_CLIPS_PER_TRACK: number;
    DEFAULT_FPS: number;
    ALLOWED_FPS: number[];
  };
}

// ============================================================================
// DOM-F & DOM-K: RSS Source & Automation Governance (BNW-MASTER-005)
// ============================================================================

export type {
  RssSourceItem,
  RssSourceStatus,
  CreateRssSourceDto,
  UpdateRssSourceDto,
  ImportedRssItemDto,
  StoryClusterItem,
  AutomationRule,
  AutomationExecutionLog,
  FeedValidationResult,
} from '@bnw/types';

// ============================================================================
// DOM-Q: Central Integrations & Social Media Publishing (BNW-MASTER-006)
// ============================================================================

export type {
  IntegrationCategory,
  ProviderConfigStatus,
  ProviderConnectionStatus,
  ProviderHealthStatus,
  IntegrationProviderItem,
  CreateIntegrationProviderDto,
  UpdateIntegrationProviderDto,
  SocialPlatform,
  SocialAccountItem,
  CreateSocialAccountDto,
  UpdateSocialAccountDto,
  SocialPublishingStatus,
  SocialDeliveryItem,
  SocialPublishingJobItem,
  CreateSocialPublishingJobDto,
  UpdateSocialPublishingJobDto,
  PlatformPublishingConstraints,
  SocialPlatformPreview,
  WebhookVerificationResult,
  WebhookLogItem,
} from '@bnw/types';

// ============================================================================
// DOM-R: Business & Monetization Governance (BNW-MASTER-007)
// ============================================================================

export type {
  AdvertiserAccountStatus,
  AdCampaignStatus,
  AdPricingModel,
  AdPlacementCode,
  AdCreativeType,
  AdvertiserItem,
  CreateAdvertiserDto,
  UpdateAdvertiserDto,
  AdCreativeItem,
  CreateAdCreativeDto,
  AdCampaignItem,
  CreateAdCampaignDto,
  UpdateAdCampaignDto,
  AdPlacementSlotConfig,
  SubscriptionPlanItem,
  UserEntitlementItem,
  ReferralAttributionItem,
  PaymentOrderItem,
  InvoiceLineItem,
  InvoiceItem,
  MonetizationDashboardStats,
} from '@bnw/types';

// ============================================================================
// DOM-O, DOM-S, DOM-T: Audience, Intelligence, SEO & E-Paper (BNW-MASTER-008)
// ============================================================================

export type {
  AnalyticsEventName,
  ClientPlatform,
  TrafficSource,
  TimeRangeOption,
  AudienceOverviewStats,
  ContentPerformanceStats,
  DistrictAudienceInsight,
  EditorialPerformanceReport,
  ContentComparisonResult,
  AudiencePreferenceItem,
  UpdateAudiencePreferenceDto,
  AudienceSegmentItem,
  CreateAudienceSegmentDto,
  AudienceInsightsSummary,
  TrendingArticleItem,
  TrendingNewsFilter,
  TrendingExclusionItem,
  CreateTrendingExclusionDto,
  ArticleSeoMetadataItem,
  UpdateArticleSeoDto,
  SeoValidationResult,
  SearchConsoleIntegrationStatus,
  EpaperEditionStatus,
  EpaperEditionType,
  EpaperPageItem,
  EpaperEditionItem,
  CreateEpaperEditionDto,
  UpdateEpaperEditionDto,
  EpaperArchiveFilter,
} from '@bnw/types';

// ============================================================================
// Enterprise Security, Monitoring, Backup & Production (BNW-MASTER-009)
// ============================================================================

export type {
  SecurityFindingSeverity,
  SecurityFindingStatus,
  SecurityRiskFinding,
  RateLimitTier,
  RateLimitTierConfig,
  DependencyHealthState,
  DependencyHealthProbe,
  SystemHealthOverview,
  ApplicationMetricsSnapshot,
  AlertSeverity,
  AlertStatus,
  SecurityAlertItem,
  BackupStatus,
  BackupMetadataItem,
  BackupRestoreTestResult,
  ProductionReadinessCategory,
  ProductionReadinessStatus,
  ProductionReadinessScorecardItem,
} from '@bnw/types';







