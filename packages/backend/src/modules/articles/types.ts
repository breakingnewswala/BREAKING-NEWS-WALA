/**
 * BREAKING NEWS WALA — Article Module Types & Domain Contracts
 * Grounded in docs/05-Workflows.md (Section 23.1: Article Editorial Lifecycle State Machine),
 * docs/06-Business-Rules.md (RULE-NEWS-003, RULE-NEWS-004, RULE-NEWS-005, RULE-EDIT-001 through RULE-EDIT-007),
 * docs/12-Database.md (DOM-D: News & Editorial Lifecycle), and docs/13-API.md (REP-03 through REP-08)
 */

export type ArticleStatus =
  | 'draft'
  | 'pending_review'
  | 'under_review'
  | 'revision_requested'
  | 'rejected'
  | 'published'
  | 'archived'
  | 'retracted';

export type ContentSource =
  | 'original_reporter'
  | 'rss_feed'
  | 'external_wire'
  | 'ai_synthesized';

export type EditorialAction =
  | 'claim'
  | 'approve'
  | 'request_changes'
  | 'reject'
  | 'retract'
  | 'direct_published';

export interface NewsRevisionEntity {
  id: string;
  newsId: string;
  versionNumber: number;
  title: string;
  subheadline: string | null;
  bodyContent: string;
  excerpt: string | null;
  revisedBy: string;
  revisionSummary: string | null;
  createdAt: Date;
}

export interface EditorialReviewEntity {
  id: string;
  newsId: string;
  reviewerId: string;
  action: string;
  reasonCode: string | null;
  feedbackComments: string | null;
  createdAt: Date;
}

export interface ImportedRssItemEntity {
  id: string;
  rssSourceId: string;
  guidHash: string;
  originalTitle: string;
  originalUrl: string;
  generatedNewsId: string | null;
  aiProcessingStatus: string;
  importedAt: Date;
}

export interface ArticleEntity {
  id: string;
  publicId: string;
  slug: string;
  title: string;
  subheadline: string | null;
  bodyContent: string;
  excerpt: string | null;
  authorId: string;
  lastEditorId: string | null;
  primaryCategoryId: string;
  subcategoryId?: string | null;
  primaryLocationId: string;
  featuredMediaId: string | null;
  status: ArticleStatus;
  contentSource: ContentSource;
  sourceAttribution: string | null;
  isBreaking: boolean;
  breakingPriority: number;
  viewCount: bigint | number;
  shareCount: number;
  createdAt: Date;
  updatedAt: Date;
  submittedAt: Date | null;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  deletedAt: Date | null;
  author?: {
    id: string;
    fullName?: string;
    phoneNumber?: string | null;
    email?: string | null;
  };
  primaryCategory?: {
    id: string;
    nameHi: string;
    nameEn: string;
    slug: string;
  };
  primaryLocation?: {
    id: string;
    nameHi: string;
    nameEn: string;
    slug: string;
    level: string;
  };
  revisions?: NewsRevisionEntity[];
  editorialReviews?: EditorialReviewEntity[];
}

export interface ArticleSummary {
  id: string;
  publicId: string;
  slug: string;
  title: string;
  subheadline: string | null;
  excerpt: string | null;
  status: ArticleStatus;
  authorId: string;
  authorName?: string;
  primaryCategoryId: string;
  primaryCategoryNameHi?: string;
  primaryCategorySlug?: string;
  primaryLocationId: string;
  primaryLocationNameHi?: string;
  primaryLocationSlug?: string;
  featuredMediaId: string | null;
  isBreaking: boolean;
  breakingPriority: number;
  contentSource: ContentSource;
  viewCount: number;
  shareCount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  publishedAt: string | Date | null;
}

export interface CreateArticleDraftDto {
  title: string;
  subheadline?: string;
  bodyContent: string;
  excerpt?: string;
  slug?: string;
  primaryCategoryId: string;
  subcategoryId?: string;
  primaryLocationId: string;
  featuredMediaId?: string;
  sourceAttribution?: string;
  isBreaking?: boolean;
  breakingPriority?: number;
}

export interface UpdateArticleDraftDto {
  title?: string;
  subheadline?: string;
  bodyContent?: string;
  excerpt?: string;
  slug?: string;
  primaryCategoryId?: string;
  subcategoryId?: string;
  primaryLocationId?: string;
  featuredMediaId?: string;
  sourceAttribution?: string;
  isBreaking?: boolean;
  breakingPriority?: number;
  revisionSummary?: string;
}

export interface EditorialReviewDto {
  action: EditorialAction;
  reasonCode?: string;
  feedbackComments?: string;
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

export interface IngestExternalArticleDto {
  originalTitle: string;
  originalUrl: string;
  bodyContent: string;
  sourceName: string;
  feedUrl?: string;
  guidHash?: string;
  primaryCategoryId?: string;
  primaryLocationId?: string;
}

export interface ArticleFilterParams {
  page?: number;
  limit?: number;
  status?: ArticleStatus | 'all';
  authorId?: string;
  categoryId?: string;
  locationId?: string;
  isBreaking?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

