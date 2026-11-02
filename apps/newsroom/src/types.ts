/**
 * BREAKING NEWS WALA — Central Editorial Newsroom TypeScript Contracts
 * Grounded in docs/05-Workflows.md (Section 23.1), docs/06-Business-Rules.md (RULE-EDIT-001 through RULE-EDIT-007),
 * docs/13-API.md, docs/14-Auth.md, and docs/Editorial-Policy.md
 */

import {
  ArticleStatus,
  UserRole,
  DesignDocument,
  DesignTemplate,
  DesignStudioType,
  DesignAspectRatio,
  DesignElement,
  CanvasDimensions,
  CanvasBackground,
  ExportDesignPayload,
  ExportDesignResult,
  VideoProjectDocument,
  VideoTemplate,
  VideoRenderJob,
  VideoClip,
  VideoTrack,
  VideoSubtitleCue,
  VideoSubtitleTrack,
  VideoAspectRatio,
  VideoResolution,
  VideoRenderStatus,
} from '@bnw/types';

export type {
  DesignDocument,
  DesignTemplate,
  DesignStudioType,
  DesignAspectRatio,
  DesignElement,
  CanvasDimensions,
  CanvasBackground,
  ExportDesignPayload,
  ExportDesignResult,
  VideoProjectDocument,
  VideoTemplate,
  VideoRenderJob,
  VideoClip,
  VideoTrack,
  VideoSubtitleCue,
  VideoSubtitleTrack,
  VideoAspectRatio,
  VideoResolution,
  VideoRenderStatus,
};

export type StudioMode = 'graphic' | 'thumbnail' | 'social';

export interface StudioPresetConfig {
  id: string;
  nameHi: string;
  nameEn: string;
  width: number;
  height: number;
  aspectRatio: DesignAspectRatio;
  studioType: DesignStudioType;
  descriptionHi: string;
}

export interface NewsroomAiConceptPayload {
  prompt: string;
  studioType?: DesignStudioType;
  aspectRatio?: DesignAspectRatio;
  category?: string;
  location?: string;
}

export interface EditorialUser {
  id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  roles: (UserRole | string)[];
  status: string;
  homeDistrictId?: string;
  homeStateId?: string;
}

export interface EditorialArticle {
  id: string;
  publicId?: string;
  slug?: string;
  title: string;
  subheadline?: string | null;
  bodyContent?: string;
  excerpt?: string | null;
  status: ArticleStatus | string;
  authorId: string;
  authorName?: string;
  authorPhone?: string;
  lastEditorId?: string | null;
  lastEditorName?: string | null;
  primaryCategoryId: string;
  primaryCategoryNameHi?: string;
  primaryCategorySlug?: string;
  subcategoryId?: string | null;
  primaryLocationId: string;
  primaryLocationNameHi?: string;
  primaryLocationSlug?: string;
  featuredMediaId?: string | null;
  featuredImageUrl?: string | null;
  imageCaption?: string | null;
  imageAttribution?: string | null;
  sourceAttribution?: string | null;
  isBreaking: boolean;
  breakingPriority: number;
  viewCount?: number;
  shareCount?: number;
  submittedAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EditorialReviewRecord {
  id: string;
  newsId: string;
  reviewerId: string;
  reviewerName?: string;
  action: 'claim' | 'approve' | 'request_changes' | 'reject' | 'retract' | 'direct_published' | string;
  reasonCode?: string | null;
  feedbackComments?: string | null;
  createdAt: string;
  news?: {
    id: string;
    title: string;
    slug?: string;
    status: string;
  } | null;
  reviewer?: {
    id: string;
    fullName?: string;
  } | null;
}

export interface ArticleRevisionRecord {
  id: string;
  newsId: string;
  versionNumber: number;
  title: string;
  subheadline?: string | null;
  bodyContent: string;
  excerpt?: string | null;
  revisedBy: string;
  revisionSummary?: string | null;
  createdAt: string;
}

export interface EditorialStats {
  totalIncoming: number;
  pendingReview: number;
  underReview: number;
  revisionRequested: number;
  publishedToday: number;
  publishedTotal: number;
  rejected: number;
  breakingNews: number;
}

export interface CategoryItem {
  id: string;
  nameHi: string;
  nameEn: string;
  slug: string;
  subcategories?: Array<{
    id: string;
    nameHi: string;
    slug: string;
  }>;
}

export interface DistrictItem {
  id: string;
  nameHi: string;
  nameEn: string;
  slug: string;
  divisionId?: string;
  divisionNameHi?: string;
}

export interface FactCheckItem {
  id: number;
  titleHi: string;
  descriptionHi: string;
  isChecked: boolean;
}

// ============================================================================
// AI Newsroom, RSS & Story Clustering Types (BNW-MASTER-005)
// ============================================================================

export type {
  RssSourceItem,
  ImportedRssItemDto,
  StoryClusterItem,
  AiResearchRequest,
  AiResearchResponse,
  AiSourceComparisonRequest,
  AiSourceComparisonResponse,
  AiGrammarReviewRequest,
  AiGrammarReviewResponse,
  AiTranslateRequest,
  AiTranslateResponse,
} from '@bnw/types';

// ============================================================================
// Social Publishing Desk Types (BNW-MASTER-006)
// ============================================================================

export type {
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


