export type ArticleStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ASSIGNED'
  | 'UNDER_REVIEW'
  | 'IN_REVIEW'
  | 'REVISION_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'ARCHIVED'
  | 'RETRACTED';

export type ArticlePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL' | 'BREAKING';

export type AppRole = 'READER' | 'REPORTER' | 'ADMIN' | 'EDITOR' | 'MASTER_ADMIN';

export interface CategoryItem {
  id: string;
  slug: string;
  nameEn: string;
  nameHi: string;
  sortOrder: number;
}

export interface DistrictItem {
  id: string;
  slug: string;
  nameEn: string;
  nameHi: string;
  divisionId: string;
  stateId: string;
}

export interface DivisionItem {
  id: string;
  nameHi: string;
  nameEn: string;
  headquarters: string;
}

export interface ArticleItem {
  id: string;
  slug: string;
  title: string;
  subheadline?: string;
  summary?: string;
  content?: string;
  status: ArticleStatus;
  priority?: ArticlePriority;
  featuredImage?: string;
  imageUrl?: string;
  imageCaption?: string;
  imageCredit?: string;
  version?: number;
  revisionHistory?: Array<{
    timestamp: string;
    action: string;
    editorName?: string;
    editorId?: string;
    comments?: string;
    version?: number;
  }>;
  categoryId?: string;
  categoryName?: string;
  districtId?: string;
  districtName?: string;
  divisionId?: string;
  authorId?: string;
  authorName?: string;
  authorRole?: string;
  assignedEditorId?: string;
  assignedEditorName?: string;
  claimedBy?: string;
  claimedAt?: string;
  scheduledAt?: string;
  isBreaking: boolean;
  viewCount: number;
  publishedAt?: string;
  createdAt: string;
  tags?: string[];
  readingTimeMinutes?: number;
  videoUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface ArticleDetail extends ArticleItem {
  imageCaption?: string;
  imageAttribution?: string;
  shareCount: number;
  content: string;
  factChecked?: boolean;
  factCheckScore?: number;
  editorialNotes?: string;
  rejectionReason?: string;
  revisionHistory?: {
    timestamp: string;
    action: string;
    reviewerId?: string;
    reviewerName?: string;
    comments?: string;
  }[];
}

export interface CreateDraftRequest {
  title: string;
  subheadline?: string;
  content: string;
  summary?: string;
  categoryId: string;
  districtId: string;
  divisionId?: string;
  featuredImage?: string;
  imageCaption?: string;
  imageAttribution?: string;
  imageCredit?: string;
  priority?: ArticlePriority;
  isBreaking: boolean;
  videoUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  scheduledAt?: string;
  editorialNotes?: string;
}

export interface EditorialFeedbackItem {
  id: string;
  articleId: string;
  reviewerName: string;
  reviewerRole: string;
  decision: string;
  comments: string;
  createdAt: string;
}

export interface EpaperEdition {
  id: string;
  title: string;
  editionDate: string;
  districtId: string;
  districtName: string;
  pdfUrl: string;
  totalPages: number;
  thumbnailUrl: string;
  pages: {
    pageNumber: number;
    title: string;
    imageUrl: string;
  }[];
}

export interface FactCheckEvaluationItem {
  pointName: string;
  status: 'PASSED' | 'WARNING' | 'FAILED';
  commentHindi: string;
}

export interface EditorialFactCheckResult {
  score: number;
  credibilityRating: string;
  editorialRemarksHindi: string;
  refinedHeadline: string;
  checklist: FactCheckEvaluationItem[];
}

export interface ReporterAiDraft {
  suggestedHeadline: string;
  leadParagraph: string;
  suggestedCategory: string;
  keyFacts: string[];
  factCheckGuidance: string[];
}

export interface ReporterProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'reporter' | 'trusted_reporter';
  assignedDistricts: string[];
  assignedDivision?: string;
  beats?: string[];
  totalStoriesFiled: number;
  totalStoriesPublished: number;
  totalStoriesRejected?: number;
  approvalRate?: number;
  badgeNumber: string;
  joinedDate: string;
  avatar: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'TRAINEE';
  verificationStatus?: 'VERIFIED' | 'PENDING' | 'TRAINEE' | 'SUSPENDED';
}

export type GraphicAspectRatio = '4:5' | '1:1' | '9:16' | '16:9' | '3:4';

export type GraphicTemplateCategory =
  | 'BREAKING'
  | 'POLITICS'
  | 'CRIME'
  | 'GOVERNMENT'
  | 'EDUCATION'
  | 'SPORTS'
  | 'BUSINESS'
  | 'DISTRICT'
  | 'WEATHER'
  | 'FESTIVAL'
  | 'SPECIAL';

export type GraphicLayerType = 'text' | 'image' | 'badge' | 'logo' | 'shape';

export interface GraphicLayerStyle {
  fontSize?: number;
  fontWeight?: string | number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  opacity?: number;
  borderRadius?: number;
  padding?: number;
  textTransform?: string;
  boxShadow?: string;
  border?: string;
}

export interface GraphicLayer {
  id: string;
  type: GraphicLayerType;
  name: string;
  x: number; // percentage (0 - 100) or px
  y: number; // percentage (0 - 100) or px
  width: number; // percentage (0 - 100) or px
  height: number; // percentage (0 - 100) or px
  zIndex: number;
  visible: boolean;
  locked: boolean;
  style: GraphicLayerStyle;
  content: string; // text string or asset URL
}

export interface GraphicTemplate {
  id: string;
  title: string;
  slug?: string;
  category?: GraphicTemplateCategory;
  aspectRatio: GraphicAspectRatio;
  width?: number;
  height?: number;
  themeColor: string;
  backgroundStyle:
    | 'gradient-red'
    | 'dark-charcoal'
    | 'breaking-yellow'
    | 'navy-blue'
    | 'pure-white'
    | 'custom';
  backgroundColor?: string;
  backgroundImageUrl?: string;
  overlayOpacity?: number;
  isDefault?: boolean;
  isActive?: boolean;
  allowedRoles?: AppRole[];
  layers?: GraphicLayer[];
  createdAt?: string;
  updatedAt?: string;
}

export type GraphicStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';

export interface GraphicItem {
  id: string;
  title: string;
  headline: string;
  subtext?: string;
  templateId: string;
  templateTitle?: string;
  aspectRatio: GraphicAspectRatio;
  articleId?: string;
  articleTitle?: string;
  districtName?: string;
  categoryName?: string;
  authorName?: string;
  authorId?: string;
  isBreaking?: boolean;
  imageUrl?: string;
  storagePath?: string;
  previewUrl?: string;
  status: GraphicStatus;
  version: number;
  layers?: GraphicLayer[];
  themeColor?: string;
  backgroundStyle?: string;
  createdBy: string;
  createdByName: string;
  createdByRole: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  exportHistory?: Array<{
    timestamp: string;
    format: 'png' | 'webp';
    resolution: string;
    url?: string;
  }>;
}

export interface NewsToGraphicRequest {
  articleId: string;
  templateId?: string;
  aspectRatio?: GraphicAspectRatio;
  customHeadline?: string;
  customSubtext?: string;
  customDistrict?: string;
  customCategory?: string;
  includeImage?: boolean;
  includeReporter?: boolean;
  includeLogo?: boolean;
}

export interface BreakingTickerItem {
  id: string;
  textHindi: string;
  districtName?: string;
  priority: 'normal' | 'critical';
  isActive: boolean;
  createdAt: string;
}

export interface ApiPoolKeyItem {
  id: string;
  provider: 'gemini' | 'claude' | 'groq' | 'deepseek';
  name: string;
  model: string;
  keyMasked: string;
  status: 'active' | 'degraded' | 'rate_limited' | 'disabled';
  dailyQuotaLimit: number;
  dailyQuotaUsed: number;
  avgLatencyMs: number;
}

export interface SystemAuditLogItem {
  id: string;
  actorName: string;
  actorRole: string;
  actionType:
    | 'ARTICLE_PUBLISHED'
    | 'ARTICLE_REJECTED'
    | 'REVISION_REQUESTED'
    | 'ARTICLE_REASSIGNED'
    | 'PRIORITY_CHANGED'
    | 'BREAKING_NEWS_TAGGED'
    | 'PUBLICATION_SCHEDULED'
    | 'EDITORIAL_NOTE_ADDED'
    | 'ROLE_CHANGED'
    | 'TICKER_UPDATED'
    | 'ALERT_BROADCAST'
    | 'USER_VERIFIED'
    | 'REPORTER_BEATS_ASSIGNED'
    | 'REPORTER_STATUS_CHANGED'
    | 'GRAPHIC_CREATED'
    | 'GRAPHIC_UPDATED'
    | 'GRAPHIC_APPROVED'
    | 'GRAPHIC_PUBLISHED'
    | 'TEMPLATE_CREATED'
    | 'TEMPLATE_UPDATED'
    | 'VIDEO_CREATED'
    | 'VIDEO_UPDATED'
    | 'VIDEO_RENDER_SUBMITTED'
    | 'VIDEO_RENDER_COMPLETED'
    | 'VIDEO_RENDER_FAILED'
    | 'VIDEO_TEMPLATE_CREATED'
    | 'AI_NEWS_DRAFT_GENERATED'
    | 'AI_HEADLINES_GENERATED'
    | 'AI_FACT_CHECK_PERFORMED'
    | 'AI_RESEARCH_COMPLETED'
    | 'AI_PROMPT_CREATED'
    | 'AI_PROMPT_UPDATED'
    | 'AI_PROMPT_DELETED';
  description: string;
  ipAddress: string;
  timestamp: string;
}

export interface AdBannerItem {
  id: string;
  placement: 'top_leaderboard' | 'in_feed' | 'sidebar' | 'sticky_bottom';
  title: string;
  imageUrl: string;
  targetUrl: string;
  advertiserName: string;
  isActive: boolean;
}

export interface MandiRateItem {
  id: string;
  commodityName: string;
  mandiName: string;
  districtName: string;
  modalPrice: number;
  minPrice: number;
  maxPrice: number;
  unit: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// VIDEO PRODUCTION STUDIO DOMAIN TYPES (DOM-I / VID-001 - VID-015)
// -------------------------------------------------------------

export type VideoAspectRatio = '9:16' | '16:9' | '1:1' | '4:5' | '3:4';
export type VideoResolution = '480p' | '720p' | '1080p' | '4k';
export type VideoTransition = 'cut' | 'fade' | 'slide-left' | 'zoom-in' | 'crossfade';

export type VideoTemplateCategory =
  | 'BREAKING'
  | 'POLITICS'
  | 'CRIME'
  | 'GOVERNMENT'
  | 'DISTRICT'
  | 'SPORTS'
  | 'BUSINESS'
  | 'EDUCATION'
  | 'WEATHER'
  | 'SPECIAL'
  | 'FESTIVAL';

export interface VideoScene {
  id: string;
  title: string;
  order: number;
  durationSec: number;
  backgroundStyle: 'gradient-red' | 'dark-charcoal' | 'navy-blue' | 'breaking-yellow' | 'custom';
  backgroundColor?: string;
  imageUrl?: string;
  videoUrl?: string;
  headline: string;
  subtext?: string;
  lowerThird?: string;
  district?: string;
  category?: string;
  showLogo?: boolean;
  showTicker?: boolean;
  transition?: VideoTransition;
  kenBurnsEffect?: boolean;
  mediaUrl?: string;
}

export interface VideoAudioTrack {
  id: string;
  type: 'background_music' | 'voiceover' | 'sound_effect';
  name: string;
  url: string;
  volume: number; // 0.0 to 1.0
  isMuted?: boolean;
  fadeInSec?: number;
  fadeOutSec?: number;
  startSec?: number;
}

export type VideoProjectStatus = 'DRAFT' | 'READY' | 'RENDERING' | 'COMPLETED' | 'FAILED';

export interface VideoProject {
  id: string;
  title: string;
  description?: string;
  aspectRatio: VideoAspectRatio;
  resolution: VideoResolution;
  width: number;
  height: number;
  fps: number;
  totalDurationSec: number;
  scenes: VideoScene[];
  audioTracks: VideoAudioTrack[];
  templateId?: string;
  templateTitle?: string;
  articleId?: string;
  articleTitle?: string;
  districtName?: string;
  status: VideoProjectStatus;
  version: number;
  outputVideoUrl?: string;
  thumbnailUrl?: string;
  fileSizeBytes?: number;
  createdBy: string;
  createdByName: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
}

export type VideoRenderStatus = 'PENDING' | 'RENDERING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface VideoRenderJob {
  id: string;
  projectId: string;
  projectTitle: string;
  aspectRatio: VideoAspectRatio;
  resolution: VideoResolution;
  status: VideoRenderStatus;
  progressPercent: number;
  outputVideoUrl?: string;
  outputUrl?: string;
  format?: string;
  fileSizeBytes?: number;
  durationSeconds?: number;
  errorMessage?: string;
  retryCount: number;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

export interface VideoTemplate {
  id: string;
  title: string;
  description: string;
  category: VideoTemplateCategory;
  aspectRatio: VideoAspectRatio;
  defaultDurationSec: number;
  themeColor: string;
  scenes: VideoScene[];
  audioTracks?: VideoAudioTrack[];
  isDefault?: boolean;
  isActive?: boolean;
  allowedRoles?: AppRole[];
  createdAt?: string;
  updatedAt?: string;
}

export interface NewsToVideoRequest {
  articleId?: string;
  article?: Partial<ArticleItem>;
  templateId?: string;
  aspectRatio?: VideoAspectRatio;
  customHeadline?: string;
  customSubtext?: string;
  includeVoiceover?: boolean;
}

// -------------------------------------------------------------
// AI NEWSROOM & INTELLIGENT AUTOMATION TYPES (DOM-AI / EXEC-023)
// -------------------------------------------------------------

export type AiNewsFormat =
  | 'SHORT'
  | 'DETAILED'
  | 'BREAKING'
  | 'POLITICAL'
  | 'DISTRICT'
  | 'CRIME'
  | 'GOVERNMENT'
  | 'SPECIAL_REPORT'
  | 'short'
  | 'detailed'
  | 'breaking'
  | 'political'
  | 'district'
  | 'government'
  | 'crime'
  | 'special';

export type AiLanguage = 'hi' | 'en';

export interface AiNewsWriterRequest {
  rawNotes?: string;
  notes?: string;
  title?: string;
  keyFacts?: string[];
  allegationsOrClaims?: string[];
  format?: AiNewsFormat;
  language?: AiLanguage;
  district?: string;
  category?: string;
  sourceAttribution?: string;
  tone?: 'objective' | 'urgent' | 'analytical' | 'investigative' | string;
  targetWordCount?: number;
  provider?: string;
}

export interface AiNewsWriterResponse {
  headline: string;
  leadParagraph: string;
  body?: string;
  subHeadline?: string;
  bodyParagraphs?: string[];
  fullContent?: string;
  officialStatement?: string | null;
  allegationsClarification?: string | null;
  editorialDisclaimer?: string;
  suggestedTags?: string[];
  conclusion?: string;
  keyFacts?: string[];
  allegationsVsConfirmed?: {
    confirmed: string[];
    allegations: string[];
  };
  suggestedCategory?: string;
  suggestedDistrict?: string;
  sourceAttribution?: string;
  isAiAssisted: true;
  suggestedStatus?: string;
  requiresEditorReview?: boolean;
  wordCount?: number;
  characterCount?: number;
  estimatedReadTimeMinutes?: number;
  provider?: string;
  model?: string;
  generationTimeMs?: number;
}

export interface HeadlineOptionItem {
  optionNumber: 1 | 2 | 3 | 4 | 5;
  targetRange: '80-110' | '100-130' | '125-150' | '130-160' | '150-200' | string;
  minChars: number;
  maxChars: number;
  headline: string;
  characterCount: number;
  isValidLength?: boolean;
  lengthValid?: boolean;
  style: 'Breaking' | 'Analytical' | 'Ground Report' | 'Engaging' | 'Comprehensive' | string;
}

export interface AiHeadlineRequest {
  articleText?: string;
  title?: string;
  summary?: string;
  facts?: string[];
  district?: string;
  category?: string;
  isBreaking?: boolean;
  language?: AiLanguage;
  provider?: string;
}

export interface AiHeadlineResponse {
  headlines?: HeadlineOptionItem[];
  headlineOptions?: HeadlineOptionItem[];
  articleTitle?: string;
  allOptionsInRange?: boolean;
  provider?: string;
  model?: string;
  generationTimeMs?: number;
  isAiAssisted?: boolean;
}

export interface AiSummarizerRequest {
  content: string;
  mode: 'SHORT' | 'DETAILED' | 'BULLETS' | 'short' | 'detailed' | 'bullet' | 'rewrite' | 'grammar_spellcheck' | 'language_conversion';
  targetLanguage?: AiLanguage | string;
  tone?: string;
  maxWords?: number;
  provider?: string;
}

export interface AiSummarizerResponse {
  originalLength?: number;
  resultLength?: number;
  summaryText?: string;
  summary?: string;
  keyTakeaway?: string;
  mode?: string;
  wordCount?: number;
  bulletPoints?: string[];
  grammarCorrections?: Array<{ original: string; corrected: string; explanation: string }>;
  isAiAssisted?: boolean;
  provider?: string;
  model?: string;
  executionTimeMs?: number;
}

export type FactCheckVerificationStatus =
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'UNVERIFIED'
  | 'CONTRADICTED'
  | 'INSUFFICIENT_EVIDENCE';

export interface FactCheckClaimItem {
  claim: string;
  classification?: FactCheckVerificationStatus;
  status?: FactCheckVerificationStatus | string;
  confidenceScore?: number;
  confidencePercent?: number;
  evidenceSummary?: string;
  supportingEvidence?: string[];
  conflictingClaims?: string[];
  missingEvidence?: string[];
  sourceUrls?: string[];
  recommendation: string;
}

export interface AiFactCheckRequest {
  claimText?: string;
  headline?: string;
  content?: string;
  sourceMaterial?: string;
  sources?: string[];
  evidenceNotes?: string;
  referenceUrls?: string[];
  district?: string;
  provider?: string;
}

export interface AiFactCheckResponse {
  overallVerdict?: FactCheckVerificationStatus;
  overallStatus?: FactCheckVerificationStatus | string;
  overallVerificationScore?: number;
  credibilityScore?: number;
  claims: FactCheckClaimItem[];
  summaryExplanationHindi?: string;
  checklist?: Array<{ point: string; status: 'PASSED' | 'WARNING' | 'FAILED'; comment: string }>;
  checklistEvaluation?: Array<{ id: string; name: string; passed: boolean; notes: string }>;
  editorialActionRequired?: string;
  warnings?: string[];
  headline?: string;
  district?: string;
  provider?: string;
  model?: string;
  executionTimeMs?: number;
  isAiAssisted?: boolean;
}

export interface AiResearchRequest {
  query?: string;
  topic?: string;
  district?: string;
  authorizedSourcesOnly?: boolean;
  contextNotes?: string;
  knownEntities?: string[];
  referenceLinks?: string[];
  provider?: string;
}

export interface AiResearchResponse {
  query?: string;
  topic?: string;
  district?: string;
  topicSummary?: string;
  historicalContext?: string;
  keyEntities?: Array<{ name: string; role: string; jurisdiction: string }>;
  collectedSources?: Array<{
    title: string;
    url: string;
    sourceName: string;
    publicationDate?: string;
    relevanceScore: number;
  }>;
  synthesizedNotes?: string;
  separatedFacts?: string[];
  separatedClaims?: string[];
  separatedOpinions?: string[];
  factBreakdown?: {
    confirmedFacts: string[];
    activeClaims: string[];
    opinions: string[];
  };
  chronologicalTimeline?: Array<{ dateOrPhase: string; event: string }>;
  applicableLawsOrSchemes?: string[];
  fieldInvestigationQuestions?: string[];
  sourceAttributionTips?: string;
  provider?: string;
  model?: string;
  executionTimeMs?: number;
  isAiAssisted?: boolean;
}

export interface AiSocialMediaRequest {
  articleTitle?: string;
  articleContent?: string;
  headline?: string;
  summary?: string;
  district?: string;
  category?: string;
  isBreaking?: boolean;
  articleUrl?: string;
  platforms?: string[];
  provider?: string;
}

export interface AiSocialMediaResponse {
  headline?: string;
  district?: string;
  facebook: { caption?: string; text?: string; hashtags: string[]; callToAction: string };
  instagram: { visualHook?: string; caption: string; hashtags: string[]; carouselSlideSuggestions?: string[] };
  youtube: { videoTitle?: string; description?: string; tags?: string[]; chapterMarkers?: string[]; communityPost?: string; shortDescription?: string };
  twitter?: { tweetText: string; hashtags: string[]; characterCount: number };
  xTwitter?: { tweet: string; characterCount: number; threadStarter?: boolean };
  whatsapp: { formattedBroadcast?: string; urgencyLevel?: string; bulletin?: string; forwardableText?: string };
  provider?: string;
  model?: string;
  executionTimeMs?: number;
  isAiAssisted?: boolean;
}

export interface AiSeoRequest {
  title: string;
  content: string;
  district?: string;
  category?: string;
  provider?: string;
}

export interface AiSeoResponse {
  metaTitle: string;
  metaTitleLength?: number;
  metaDescription: string;
  metaDescriptionLength?: number;
  keywords?: string[];
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  focusKeyword?: string;
  slugSuggestion?: string;
  englishSlug?: string;
  searchIntent?: string;
  seoScore?: number;
  readabilityScore?: number;
  seoRecommendations?: string[];
  recommendations?: string[];
  schemaJsonLdSnippet?: any;
  provider?: string;
  model?: string;
  executionTimeMs?: number;
  isAiAssisted?: boolean;
}

export type AiPromptCategory =
  | 'WRITING'
  | 'HEADLINE'
  | 'FACT_CHECK'
  | 'RESEARCH'
  | 'SEO'
  | 'SOCIAL'
  | 'SUMMARIZER'
  | 'REWRITING'
  | 'NEWS_WRITER'
  | 'REWRITER'
  | string;

export interface AiPromptItem {
  id: string;
  title: string;
  category: AiPromptCategory;
  systemPrompt: string;
  taskPrompt: string;
  version: string | number;
  isDefault: boolean;
  description?: string;
  tags?: string[];
  variables?: string[];
  sortOrder?: number;
  approvedBy?: string;
  createdBy?: string;
  createdAt?: string;
  usageCount?: number;
  updatedAt?: string;
}

export interface AiUsageRecord {
  id: string;
  userId: string;
  userName?: string;
  userRole: string;
  module?: string;
  promptCategory?: string;
  provider: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens: number;
  estimatedCostUsd?: number;
  estimatedCostInr?: number;
  latencyMs?: number;
  executionTimeMs?: number;
  status?: 'SUCCESS' | 'FAILED' | 'FALLBACK';
  success?: boolean;
  timestamp: string;
}

export interface AiContentHistoryItem {
  id: string;
  toolType?: 'WRITER' | 'HEADLINE' | 'SUMMARIZER' | 'FACT_CHECK' | 'RESEARCH' | 'SEO' | 'SOCIAL' | string;
  category?: string;
  title?: string;
  headline?: string;
  district?: string;
  inputText?: string;
  inputSnippet?: string;
  outputText?: string;
  outputData?: any;
  metadata?: Record<string, any>;
  isReviewedByHuman?: boolean;
  isDraftSaved?: boolean;
  articleId?: string;
  userId?: string;
  userRole?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  savedAsDraftArticleId?: string;
  createdAt: string;
}

// =========================================================================
// MASTER EXECUTION 024: API POOL, SOCIAL MEDIA & INTEGRATION TYPES
// =========================================================================

export type IntegrationCategory =
  | 'social_media'
  | 'notifications'
  | 'ai_services'
  | 'media_processing'
  | 'analytics'
  | 'storage'
  | 'news_sources'
  | 'external_gateways';

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
  dailyQuotaLimit?: number;
  dailyQuotaUsed?: number;
  monthlyQuotaLimit?: number;
  monthlyQuotaUsed?: number;
  avgLatencyMs?: number;
  costPer1kInputTokensUsd?: number;
  costPer1kOutputTokensUsd?: number;
  currencyRateUsdToInr?: number;
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
  authMethod?: 'oauth2' | 'api_key' | 'service_account' | 'bot_token' | 'none';
  supportedCapabilities?: string[];
  requiredScopes?: string[];
  apiKey?: string;
  clientSecret?: string;
  rateLimitInfo?: string;
  dailyQuotaLimit?: number;
  monthlyQuotaLimit?: number;
  costPer1kInputTokensUsd?: number;
  costPer1kOutputTokensUsd?: number;
  isEnabled?: boolean;
}

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
  lastSuccessfulFetch?: string | null;
  lastFailedFetch?: string;
  lastHttpStatus?: number;
  errorCount?: number;
  duplicateCount?: number;
  createdById: string;
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

export interface ImportedRssItemDto {
  id: string;
  rssSourceId: string;
  sourceName?: string;
  guidHash: string;
  originalTitle: string;
  originalUrl: string;
  originalContent?: string;
  originalSummary?: string;
  author?: string;
  publishedAt?: string;
  importedAt: string;
  status: 'PENDING_REVIEW' | 'DRAFT_CONVERTED' | 'IGNORED';
  generatedNewsId?: string;
  sourceAttribution: string;
  categories: string[];
  geographicCoverage?: string;
  mediaUrls: string[];
}

export interface FeedValidationResult {
  isValid: boolean;
  isSafe: boolean;
  feedTitle?: string;
  feedDescription?: string;
  feedLink?: string;
  itemCount?: number;
  previewItems?: Array<{ title: string; link: string; description: string }>;
  error?: string;
}

export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'youtube'
  | 'x'
  | 'whatsapp'
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
  isActive: boolean;
  lastSyncAt?: string;
  lastPublishedAt?: string;
  connectedByUserId?: string;
  errorDetails?: string;
  createdAt: string;
  updatedAt: string;
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
  accountName?: string;
  platformSpecificContent: string;
  status: 'PENDING' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED' | 'CANCELLED' | 'RETRY_PENDING';
  externalPostId?: string;
  externalPostUrl?: string;
  attemptCount: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialPublishingJobItem {
  id: string;
  articleId?: string | null;
  mediaAssetId?: string | null;
  contentSource: 'article' | 'graphic' | 'video' | 'custom';
  title: string;
  masterContent: string;
  articleUrl?: string;
  status: SocialPublishingStatus;
  scheduledAt?: string | null;
  publishedAt?: string | null;
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

export interface WhatsAppTemplateItem {
  id: string;
  name: string;
  displayName: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  language: string;
  approvalStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  headerText?: string;
  bodyText: string;
  footerText?: string;
  buttons?: Array<{ type: string; text: string; url?: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppSubscriberItem {
  id: string;
  phoneNumber: string;
  name?: string;
  district?: string;
  districtId?: string;
  status: 'ACTIVE' | 'OPTED_OUT';
  optInAt: string;
  optOutAt?: string | null;
  consentSource: string;
  optOutReason?: string;
}

export interface YouTubeQuotaStatus {
  dailyQuotaLimit: number;
  dailyQuotaUsed: number;
  remainingQuota: number;
  videoUploadCost: number;
  estimatedUploadsRemaining: number;
}

export interface YouTubeUploadPrepDto {
  id: string;
  videoId: string;
  title: string;
  description: string;
  tags: string[];
  privacyStatus: 'public' | 'unlisted' | 'private';
  scheduledPublishTime?: string | null;
  thumbnailUrl?: string | null;
  videoUrl: string;
  status: string;
  youtubeUrl: string;
  quotaConsumed: number;
  createdAt: string;
  preparedByUserId: string;
}

export interface WebhookLogItem {
  id: string;
  providerId: string;
  eventType: string;
  nonce?: string;
  status: 'verified' | 'rejected' | 'processed' | 'duplicate';
  receivedAt: string;
  errorDetails?: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  provider: string;
  eventType?: string;
  error?: string;
  timestampFresh: boolean;
  nonceUnique: boolean;
}

export interface ApiPoolUsageSummary {
  totalProviders: number;
  activeProviders: number;
  healthyProviders: number;
  totalDailyTokens: number;
  totalMonthlyTokens: number;
  totalEstimatedCostUsd: number;
  totalEstimatedCostInr: number;
  currency: 'INR' | 'USD';
  providers: Array<{
    id: string;
    name: string;
    providerId: string;
    category: string;
    isEnabled: boolean;
    healthStatus: string;
    dailyQuotaUsed: number;
    dailyQuotaLimit: number;
    percentUsed: number;
    avgLatencyMs: number;
  }>;
}

// ============================================================================
// MASTER EXECUTION 025: BUSINESS MANAGEMENT, MONETIZATION & BILLING TYPES
// ============================================================================

export interface SubscriptionPlanItem {
  id: string;
  code: string;
  nameHi: string;
  nameEn: string;
  descriptionHi: string;
  billingCycle: 'monthly' | 'yearly' | 'quarterly';
  priceMinorUnits: number;
  priceRupees: string;
  currency: string;
  includedFeatures: string[];
  entitlements: string[];
  usageLimits: {
    maxDownloadsPerMonth: number;
    maxCommentsPerDay: number;
    maxTeamMembers?: number;
  };
  trialDays: number;
  isActive: boolean;
  isCommercialActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSubscriptionItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  planId: string;
  planCode: string;
  planNameHi: string;
  billingCycle: string;
  priceMinorUnits: number;
  priceRupees: string;
  currency: string;
  status: 'ACTIVE' | 'TRIALING' | 'CANCELLED' | 'EXPIRED';
  entitlements: string[];
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  paymentOrderId?: string | null;
  paymentTransactionId?: string | null;
  usageMetrics: {
    downloadsCount: number;
    commentsCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaymentOrderItem {
  id: string;
  orderNumber: string;
  provider: string;
  providerOrderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amountPaise: number;
  amountRupees: string;
  currency: string;
  purpose: 'SUBSCRIPTION' | 'AD_CAMPAIGN' | 'SPONSORED_CONTENT' | 'PARTNER_PACKAGE';
  referenceId?: string | null;
  idempotencyKey?: string | null;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  checkoutPayload: {
    key: string;
    order_id: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    theme: { color: string };
  };
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionItem {
  id: string;
  transactionNumber: string;
  orderId: string;
  orderNumber: string;
  provider: string;
  providerPaymentId: string;
  providerOrderId: string;
  amountPaise: number;
  amountRupees: string;
  currency: string;
  status: 'SUCCESS' | 'FAILED' | 'REFUNDED';
  customerId: string;
  customerName: string;
  purpose: string;
  referenceId?: string | null;
  refundedAmountPaise: number;
  isFullyRefunded: boolean;
  settledAt: string;
  createdAt: string;
}

export interface RefundItem {
  id: string;
  refundNumber: string;
  transactionId: string;
  transactionNumber: string;
  orderId: string;
  orderNumber: string;
  amountPaise: number;
  amountRupees: string;
  currency: string;
  reason: string;
  status: 'PROCESSED' | 'PENDING' | 'FAILED';
  processedBy: string;
  createdAt: string;
}

export interface AdvertiserProfile {
  id: string;
  organizationName: string;
  brandName?: string;
  contactPerson: string;
  email: string;
  phone: string;
  billingAddress: string;
  gstin: string;
  pan?: string;
  stateCode: string;
  category: string;
  accountStatus: 'active' | 'pending_verification' | 'suspended' | 'closed';
  verificationStatus: 'verified' | 'unverified' | 'rejected';
  agreementStatus: 'signed' | 'pending' | 'expired';
  creditLimitMinorUnits: number;
  lifetimeSpendMinorUnits: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdPlacementSlotItem {
  code: string;
  nameHi: string;
  descriptionHi: string;
  dimensions: { width: number; height: number };
  supportedCreativeTypes: string[];
  pricingModel: string;
  baseRatePaise: number;
  minDurationDays: number;
  maxConcurrentCampaigns: number;
  requiresDistrictTargeting: boolean;
  isActive: boolean;
}

export interface AdCreativeItem {
  id: string;
  headline: string;
  subheadline?: string;
  creativeUrl: string;
  destinationUrl: string;
  altText: string;
  disclosureLabel: string;
}

export interface AdCampaignItem {
  id: string;
  campaignName: string;
  advertiserId: string;
  advertiserName: string;
  slotCode: string;
  pricingModel: string;
  budgetTotalPaise: number;
  budgetSpentPaise: number;
  startDate: string;
  endDate: string;
  targetDistricts: string[];
  status: 'draft' | 'review' | 'approved' | 'scheduled' | 'active' | 'paused' | 'completed' | 'rejected';
  isApproved: boolean;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  creative: AdCreativeItem;
  metrics: {
    impressions: number;
    viewableImpressions: number;
    clicks: number;
    ctr: number;
    spendPaise: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SponsoredArticleItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  advertiserId: string;
  advertiserName: string;
  campaignId?: string | null;
  district: string;
  featuredImage: string;
  brandDisclosure: string;
  isSponsored: boolean;
  isEditorialApproved: boolean;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  articleId?: string | null;
  metrics: {
    views: number;
    avgReadTimeSec: number;
    shares: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CrmNoteItem {
  id: string;
  advertiserId: string;
  channel: 'call' | 'email' | 'meeting' | 'whatsapp';
  summary: string;
  details: string;
  followUpDate?: string | null;
  authorName: string;
  createdAt: string;
}

export interface CrmProposalItem {
  id: string;
  proposalNumber: string;
  advertiserId: string;
  title: string;
  amountPaise: number;
  amountRupees: string;
  deliverables: string[];
  validUntil: string;
  status: 'DRAFT' | 'SENT' | 'NEGOTIATING' | 'ACCEPTED' | 'DECLINED';
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPricePaise: number;
  amountPaise: number;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  advertiserId?: string | null;
  campaignId?: string | null;
  customerName: string;
  customerGstin: string;
  customerAddress: string;
  customerStateCode: string;
  sacCode: string;
  lineItems: InvoiceLineItem[];
  subtotalPaise: number;
  discountPaise: number;
  taxableAmountPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalTaxPaise: number;
  totalAmountPaise: number;
  totalAmountRupees: string;
  currency: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'VOID' | 'REFUNDED';
  dueDate: string;
  paidAt?: string | null;
  transactionId?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessDashboardSummary {
  revenue: {
    totalRealizedRupees: string;
    monthlyRealizedRupees: string;
    projectedRupees: string;
    outstandingReceivablesRupees: string;
    refundsTotalRupees: string;
    bySource: {
      advertisingRupees: string;
      sponsoredRupees: string;
      subscriptionsRupees: string;
      partnersRupees: string;
    };
  };
  counts: {
    successfulTransactions: number;
    failedTransactions: number;
    pendingOrders: number;
    activeSubscriptions: number;
    totalRefunds: number;
    activeCampaigns: number;
  };
  monthlyTrends: Array<{
    month: string;
    revenueRupees: number;
  }>;
  rates: {
    paymentFailureRate: number;
    refundRate: number;
  };
  timestamp: string;
}

export interface TaxConfigItem {
  sacCode: string;
  gstRatePercent: number;
  cgstRatePercent: number;
  sgstRatePercent: number;
  igstRatePercent: number;
  homeStateCode: string;
  homeStateName: string;
}

// ============================================================================
// AUDIENCE GROWTH, READER ENGAGEMENT & INTELLIGENCE TYPES (EXECUTION 026)
// ============================================================================

export interface UserPreferences {
  userId: string;
  preferredDistricts: string[];
  preferredCategories: string[];
  followedTopics: string[];
  preferredLanguage: 'hi' | 'en';
  pushNotificationTopics: string[];
  breakingAlertsEnabled: boolean;
  digestFrequency: 'instant' | 'daily' | 'weekly' | 'none';
  offlineDownloadEnabled: boolean;
  contentViewPreferences: {
    textScale: 'sm' | 'md' | 'lg' | 'xl';
    highContrastMode: boolean;
    readingMode: 'standard' | 'distraction_free';
    autoPlayVideo: boolean;
    dataSaverMode: boolean;
  };
  privacyConsent: {
    analyticsAgreed: boolean;
    personalizationAgreed: boolean;
    consentRecordedAt: string;
    dpdpaComplianceNoticeVersion: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface BookmarkRecord {
  id: string;
  userId: string;
  articleId: string;
  articleTitle: string;
  districtName?: string;
  category?: string;
  createdAt: string;
}

export interface ReadingHistoryRecord {
  id: string;
  userId: string;
  articleId: string;
  articleTitle: string;
  districtName?: string;
  category?: string;
  dwellTimeSeconds: number;
  scrollDepthPercent: number;
  readAt: string;
}

export interface FollowedEntityRecord {
  id: string;
  userId: string;
  topic?: string;
  district?: string;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  type: string;
  title: string;
  message: string;
  articleId?: string | null;
  district?: string;
  recipientId: string;
  priority: 'normal' | 'high' | 'critical';
  isRead: boolean;
  readAt?: string | null;
  data?: Record<string, any>;
  sentBy?: string;
  createdAt: string;
}

export interface ReaderFeedbackRecord {
  id: string;
  userId: string;
  authorName: string;
  contactEmail?: string | null;
  articleId?: string | null;
  category: 'fact_error' | 'typo_grammar' | 'offensive_content' | 'app_bug' | 'general_feedback';
  categoryNameHi: string;
  comments: string;
  suggestedCorrection?: string | null;
  slaHours: number;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  resolutionNotes?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommentRecord {
  id: string;
  articleId: string;
  parentCommentId?: string | null;
  userId: string;
  authorName: string;
  authorEmail?: string | null;
  content: string;
  status: 'approved' | 'pending' | 'flagged' | 'rejected' | 'deleted';
  isFlagged: boolean;
  moderationReason?: string | null;
  reportCount: number;
  reports?: Array<{ reason: string; reportedBy: string; reportedAt: string }>;
  likesCount: number;
  replies?: CommentRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface AudienceSegmentRecord {
  id: string;
  code: string;
  nameHi: string;
  nameEn: string;
  descriptionHi: string;
  criteria: Record<string, any>;
  isSystem: boolean;
  estimatedReach: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AudienceOverviewSummary {
  timeRange: string;
  overview: {
    totalRegisteredUsers: number;
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    newRegistrations: number;
    returningUsersPercent: number;
    activeSessionsCurrent: number;
    retention30DayPercent: number;
    avgReadingTimeSeconds: number;
    avgReadingTimeFormatted: string;
    totalArticleReads: number;
    videoPlays: number;
    newsletterSubscribers: number;
  };
  districtDistribution: Array<{
    district: string;
    readers: number;
    percentage: number;
  }>;
  platformDistribution: {
    mobileWeb: number;
    desktopWeb: number;
    androidPwa: number;
  };
  trafficSources: {
    direct: number;
    whatsappShares: number;
    organicSearch: number;
    socialOther: number;
  };
  generatedAt: string;
}

export interface ContentPerformanceSummary {
  timeRange: string;
  totalPublishedStories: number;
  topStories: Array<{
    articleId: string;
    title: string;
    category: string;
    district: string;
    authorName: string;
    publishedAt: string;
    metrics: {
      views: number;
      uniqueReaders: number;
      shares: number;
      bookmarks: number;
      avgDwellSeconds: number;
      avgScrollDepthPercent: number;
      engagementRatePercent: number;
    };
  }>;
  topCategories: Array<{
    category: string;
    totalViews: number;
    storyCount: number;
  }>;
  topDistricts: Array<{
    district: string;
    totalViews: number;
    storyCount: number;
  }>;
  generatedAt: string;
}





