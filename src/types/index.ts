export type ArticleStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'REVISION_REQUESTED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'ARCHIVED'
  | 'RETRACTED';

export type AppRole = 'READER' | 'REPORTER' | 'ADMIN';

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
  summary?: string;
  content?: string;
  status: ArticleStatus;
  featuredImage?: string;
  categoryId?: string;
  categoryName?: string;
  districtId?: string;
  districtName?: string;
  divisionId?: string;
  authorId?: string;
  authorName?: string;
  authorRole?: string;
  isBreaking: boolean;
  viewCount: number;
  publishedAt?: string;
  createdAt: string;
  tags?: string[];
}

export interface ArticleDetail extends ArticleItem {
  imageCaption?: string;
  imageAttribution?: string;
  shareCount: number;
  content: string;
  factChecked?: boolean;
  factCheckScore?: number;
}

export interface CreateDraftRequest {
  title: string;
  content: string;
  summary?: string;
  categoryId: string;
  districtId: string;
  divisionId?: string;
  featuredImage?: string;
  imageCaption?: string;
  imageAttribution?: string;
  isBreaking: boolean;
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
