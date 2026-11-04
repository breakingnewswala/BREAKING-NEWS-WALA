export type ArticleStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'REVISION_REQUESTED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'ARCHIVED'
  | 'RETRACTED';

export type AppRole = 'READER' | 'REPORTER' | 'ADMIN' | 'EDITOR';

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
  readingTimeMinutes?: number;
  videoUrl?: string;
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
  videoUrl?: string;
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
  totalStoriesFiled: number;
  totalStoriesPublished: number;
  badgeNumber: string;
  joinedDate: string;
  avatar: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
}

export interface GraphicTemplate {
  id: string;
  title: string;
  aspectRatio: '1:1' | '9:16' | '16:9';
  themeColor: string;
  backgroundStyle: 'gradient-red' | 'dark-charcoal' | 'breaking-yellow';
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
    | 'ROLE_CHANGED'
    | 'TICKER_UPDATED'
    | 'ALERT_BROADCAST'
    | 'USER_VERIFIED';
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
