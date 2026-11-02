/**
 * BREAKING NEWS WALA — Field Reporter TypeScript Contracts
 * Grounded in docs/13-API.md, docs/05-Workflows.md (WF-CRE-01, WF-CRE-03), and docs/14-Auth.md
 */

import { ArticleStatus, UserRole } from '@bnw/types';

export interface ReporterUser {
  id: string;
  fullName: string;
  phoneNumber?: string;
  email?: string;
  roles: (UserRole | string)[];
  status: string;
  homeStateId?: string;
  homeDistrictId?: string;
  isTrustedPublisher?: boolean;
}

export interface TerritoryAssignment {
  districtId: string;
  districtNameHi: string;
  districtSlug: string;
  divisionId?: string;
  divisionNameHi?: string;
  divisionSlug?: string;
  isPrimary?: boolean;
}

export interface ReporterArticle {
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
  isBreaking?: boolean;
  editorialNotes?: string | null;
  rejectionReason?: string | null;
  revisionCount?: number;
  viewCount?: number;
  submittedAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleReviewRecord {
  id: string;
  articleId: string;
  reviewerId: string;
  reviewerName?: string;
  decision: 'approved' | 'rejected' | 'revision_requested';
  feedbackNotes?: string;
  createdAt: string;
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

export interface MediaUploadResult {
  mediaId: string;
  url: string;
  mimeType: string;
  fileSizeBytes: number;
}

export interface ReporterPerformanceData {
  reporterId: string;
  reporterName: string;
  totalArticlesPublished: number;
  totalArticleViews: number;
  viewsLast15m?: number;
  topPerformingArticles: Array<{
    id: string;
    title: string;
    views: number;
  }>;
}

export interface LocalDraft {
  localId: string;
  serverId?: string;
  title: string;
  subheadline?: string;
  bodyContent: string;
  primaryCategoryId: string;
  subcategoryId?: string;
  primaryLocationId: string;
  featuredMediaId?: string;
  featuredImageUrl?: string;
  imageCaption?: string;
  imageAttribution?: string;
  lastSavedAt: string;
  isSyncedWithServer: boolean;
}

