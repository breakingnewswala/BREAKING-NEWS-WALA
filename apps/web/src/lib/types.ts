/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Public Web Application TypeScript Contracts & View Models
 * Grounded in docs/13-API.md, docs/07-Design.md, and docs/08-Sitemap.md
 */

import { ArticleStatus } from '@bnw/types';

export interface PublicArticle {
  id: string;
  publicId?: string;
  slug: string;
  title: string;
  headline?: string;
  subheadline?: string | null;
  summaryLead?: string | null;
  bodyContent?: string;
  content?: string;
  excerpt?: string | null;
  status: ArticleStatus | string;
  authorId?: string;
  authorName?: string;
  primaryCategoryId: string;
  primaryCategoryNameHi?: string;
  primaryCategorySlug?: string;
  primaryLocationId: string;
  primaryLocationNameHi?: string;
  primaryLocationSlug?: string;
  featuredMediaId?: string | null;
  featuredImageUrl?: string | null;
  featuredImageCaption?: string | null;
  imageCaption?: string | null;
  imageAttribution?: string | null;
  isBreaking?: boolean;
  breakingPriority?: number;
  contentSource?: string;
  viewCount?: number;
  shareCount?: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt: string;
}

export interface PublicCategory {
  id: string;
  nameHi: string;
  nameEn: string;
  slug: string;
  descriptionHi?: string;
  descriptionEn?: string;
  displayOrder: number;
  isPrimary: boolean;
  icon?: string;
  subcategories?: PublicSubcategory[];
}

export interface PublicSubcategory {
  id: string;
  categoryId?: string;
  nameHi: string;
  nameEn?: string;
  slug: string;
  displayOrder?: number;
}

export interface PublicDistrict {
  id: string;
  nameHi: string;
  nameEn: string;
  slug: string;
  divisionId: string;
  divisionNameHi?: string;
  divisionSlug?: string;
  isPriorityHub?: boolean;
  isNewlyFormed?: boolean;
  headquartersHi?: string;
}

export interface PublicDivision {
  id: string;
  nameHi: string;
  nameEn: string;
  slug: string;
  districts: PublicDistrict[];
}

export interface TrendingArticle {
  id?: string;
  articleId?: string;
  title?: string;
  headline?: string;
  slug: string;
  category?: string;
  district?: string;
  districtName?: string;
  viewsLast15m?: number;
  trendingScore?: number;
  publishedAt?: string;
}

export interface BreakingBulletin {
  id: string;
  headline: string;
  slug: string;
  districtName?: string;
  publishedAt: string;
}

export interface PaginatedArticles {
  items: PublicArticle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ArticleQueryParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  locationId?: string;
  isBreaking?: boolean;
  search?: string;
  sortBy?: 'publishedAt' | 'viewCount' | 'trendingScore';
  sortOrder?: 'asc' | 'desc';
}

export interface PublicEpaperPage {
  pageNumber: number;
  imageUrl: string;
  thumbnailUrl?: string;
  titleHi?: string;
}

export interface PublicEpaperEdition {
  id: string;
  editionCode: string;
  title: string;
  editionDate: string;
  editionType: 'DAILY' | 'DISTRICT' | 'SPECIAL' | 'SUPPLEMENT' | 'ARCHIVE';
  language: string;
  districtId?: string;
  pageCount: number;
  coverImageUrl?: string;
  pdfAssetUrl?: string;
  pdfFileSize: number;
  publishedAt?: string;
  isPublic: boolean;
  pages?: PublicEpaperPage[];
}

