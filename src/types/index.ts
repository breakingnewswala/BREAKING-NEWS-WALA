export type UserRole = 'public' | 'reporter' | 'trusted_reporter' | 'editor' | 'admin';

export interface Category {
  id: string;
  nameHindi: string;
  nameEnglish: string;
  slug: string;
  isActive: boolean;
  order: number;
  subcategories: string[];
}

export interface LocationHierarchy {
  state: string;
  district: string;
  city: string;
}

export type ArticleStatus = 
  | 'draft' 
  | 'pending_review' 
  | 'revision_requested' 
  | 'approved' 
  | 'published' 
  | 'rejected' 
  | 'archived';

export interface Article {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  rawScript?: string;
  slug: string;
  category: string;
  subcategory?: string;
  state: string;
  district: string;
  city?: string;
  thumbnail: string;
  images?: string[];
  videoUrl?: string;
  isReel?: boolean;
  status: ArticleStatus;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  isTrustedPublish?: boolean;
  editorialNotes?: string;
  rejectionReason?: string;
  views: number;
  shares: number;
  bookmarks: number;
  readingTimeMinutes: number;
  isBreaking?: boolean;
  isLeadStory?: boolean;
  isSponsored?: boolean;
  sourceUrl?: string;
  sourcePublisher?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  seoTitle?: string;
  metaDescription?: string;
  tags: string[];
}

export interface ReporterProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'reporter' | 'trusted_reporter';
  assignedDistricts: string[];
  assignedCities: string[];
  assignedTemplateIds: string[];
  totalStoriesFiled: number;
  totalStoriesPublished: number;
  badgeNumber: string;
  joinedDate: string;
  avatar: string;
}

export interface GraphicTemplate {
  id: string;
  title: string;
  description: string;
  aspectRatio: '1:1' | '9:16' | '16:9';
  themeColor: string;
  backgroundStyle: 'gradient-red' | 'dark-charcoal' | 'breaking-yellow' | 'breaking-badge';
  version: number;
  isAssignedToAll: boolean;
  assignedReporterIds: string[];
  overlayLogo: boolean;
  headlineFontScale: 'normal' | 'large' | 'impact';
  updatedAt: string;
}

export interface BreakingTicker {
  id: string;
  textHindi: string;
  priority: 'normal' | 'critical';
  isActive: boolean;
  articleId?: string;
  createdAt: string;
  expiresAt: string;
}

export interface ApiPoolKey {
  id: string;
  provider: 'gemini' | 'backup_model';
  name: string;
  keyMasked: string;
  status: 'active' | 'degraded' | 'rate_limited' | 'disabled';
  dailyQuotaLimit: number;
  dailyQuotaUsed: number;
  totalRequests: number;
  errorCount: number;
  avgLatencyMs: number;
  lastTestedAt: string;
  costEstimateUsd: number;
}

export interface SystemAuditLog {
  id: string;
  actorName: string;
  actorRole: UserRole;
  actionType: 
    | 'ARTICLE_PUBLISHED' 
    | 'ARTICLE_DIRECT_PUBLISHED' 
    | 'ARTICLE_REJECTED' 
    | 'REVISION_REQUESTED' 
    | 'ROLE_CHANGED' 
    | 'DISTRICT_ALLOCATED' 
    | 'TICKER_UPDATED' 
    | 'AI_FAILOVER';
  description: string;
  ipAddress: string;
  timestamp: string;
}

export interface AdBanner {
  id: string;
  placement: 'top_leaderboard' | 'in_feed' | 'sticky_bottom';
  title: string;
  imageUrl: string;
  targetUrl: string;
  isActive: boolean;
  impressions: number;
  clicks: number;
}
