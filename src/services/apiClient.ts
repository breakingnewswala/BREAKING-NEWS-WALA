/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Centralized Typed API Client & Data Access Layer
 * 
 * Provides unified, typed HTTP REST communication between the React 19 SPA
 * and the shared backend API engine (/api/v1/*).
 * Grounded in docs/13-API.md, docs/14-Auth.md, and docs/11-Architecture.md
 */

import {
  ArticleDetail,
  ArticleItem,
  ArticleStatus,
  ArticlePriority,
  CategoryItem,
  DistrictItem,
  CreateDraftRequest,
  ReporterProfile,
  BreakingTickerItem,
  AdBannerItem,
  MandiRateItem,
  SystemAuditLogItem,
  GraphicTemplate,
  GraphicItem,
  GraphicStatus,
  NewsToGraphicRequest,
  VideoTemplate,
  VideoProject,
  VideoRenderJob,
  NewsToVideoRequest,
  AiNewsFormat,
  AiLanguage,
  AiNewsWriterRequest,
  AiNewsWriterResponse,
  HeadlineOptionItem,
  AiHeadlineRequest,
  AiHeadlineResponse,
  AiSummarizerRequest,
  AiSummarizerResponse,
  FactCheckClaimItem,
  AiFactCheckRequest,
  AiFactCheckResponse,
  AiResearchRequest,
  AiResearchResponse,
  AiSocialMediaRequest,
  AiSocialMediaResponse,
  AiSeoRequest,
  AiSeoResponse,
  AiPromptCategory,
  AiPromptItem,
  AiUsageRecord,
  AiContentHistoryItem,
  IntegrationProviderItem,
  CreateIntegrationProviderDto,
  RssSourceItem,
  CreateRssSourceDto,
  ImportedRssItemDto,
  FeedValidationResult,
  SocialAccountItem,
  SocialPublishingJobItem,
  CreateSocialPublishingJobDto,
  PlatformPublishingConstraints,
  WhatsAppTemplateItem,
  WhatsAppSubscriberItem,
  YouTubeQuotaStatus,
  YouTubeUploadPrepDto,
  WebhookLogItem,
  ApiPoolUsageSummary,
  SubscriptionPlanItem,
  CustomerSubscriptionItem,
  PaymentOrderItem,
  TransactionItem,
  RefundItem,
  AdvertiserProfile,
  AdPlacementSlotItem,
  AdCampaignItem,
  SponsoredArticleItem,
  CrmNoteItem,
  CrmProposalItem,
  InvoiceItem,
  BusinessDashboardSummary,
  TaxConfigItem,
  UserPreferences,
  BookmarkRecord,
  ReadingHistoryRecord,
  FollowedEntityRecord,
  NotificationRecord,
  ReaderFeedbackRecord,
  CommentRecord,
  AudienceSegmentRecord,
  AudienceOverviewSummary,
  ContentPerformanceSummary,
  EpaperEditionDoc,
  EpaperEditionVersionDoc,
  EpaperPageDoc,
  EpaperTemplateDoc,
  EpaperTemplateVersionHistory,
  EpaperTemplateValidationResult,
  EpaperWhatsAppGenerationDoc,
  EpaperWhatsAppEditionPackageDoc,
  EpaperWhatsAppEditionCardItem,
  WhatsAppEligibleArticleItem,
  GenerateWhatsAppEditionRequest,
  RegenerateWhatsAppCardRequest,
  EpaperEditionStatus,
  EpaperCheckArticlePlacementResponse,
  EpaperWhatsAppQuotaResponse,
  EpaperAdSubmissionDoc,
  EpaperAiAdCreative,
  EpaperAdReportSummary,
  EpaperAdStatus,
  EpaperRateCardItem,
  TemplateAnalysisResult,
  EpaperPageElement,
  EpaperAdSlotType,
  EpaperReporterWorkspaceSummary,
  EpaperReporterContributionItem,
  EpaperReporterPublishedItem,
  EpaperReporterActivityItem,
  ReporterProfileUpdateInput,
  EpaperAiHeadlineResult,
  EpaperAiSummaryResult,
  EpaperAiCopyEditResult,
  EpaperAiStructureSuggestion,
  EpaperAiTranslationResult,
  EpaperAiVerificationResult,
  EpaperAiDesignSuggestion,
  EpaperAiCompositionProposal,
  EpaperAiGraphicSuggestion,
  EpaperAiApplySuggestionInput,
  EpaperAiApplySuggestionResult,
  EpaperAiNewsroomHistoryItem,
  EpaperQualitySeverity,
  EpaperQualityCategory,
  EpaperQualityIssue,
  EpaperQualityCategorySummary,
  EpaperQualityScoreBreakdown,
  EpaperQualityCheckReport,
  EpaperGrantExceptionInput,
  EpaperFinalApprovalInput,
  EpaperSchedulePublishInput,
} from '../types';

export interface EpaperEditionsFilter {
  date?: string;
  publicationDate?: string;
  status?: string;
  divisionId?: string;
  districtId?: string;
  editionType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface EpaperEditionsResponse {
  editions: EpaperEditionDoc[];
  items?: EpaperEditionDoc[];
  total: number;
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PreflightDiagnosticItem {
  code: string;
  severity: 'BLOCKER' | 'ERROR' | 'WARNING';
  pageNumber: number;
  elementId?: string;
  message: string;
}

export interface PreflightScanResult {
  canPublish: boolean;
  blockerCount: number;
  errorCount: number;
  warningCount: number;
  blockers: PreflightDiagnosticItem[];
  errors: PreflightDiagnosticItem[];
  warnings: PreflightDiagnosticItem[];
  scannedAt: string;
}

export interface CreateEditionPayload {
  title: string;
  publicationDate: string;
  editionType?: 'DAILY' | 'SPECIAL';
  districtId?: string;
  districtName?: string;
  divisionId?: string;
  divisionName?: string;
  totalPages?: number;
  status?: EpaperEditionStatus;
  thumbnailUrl?: string;
  pdfUrl?: string;
}

// API Base URL resolution (relative /api/v1 or VITE_API_URL)
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api/v1';

// Token Storage Keys
const ACCESS_TOKEN_KEY = 'bnw_access_token';
const REFRESH_TOKEN_KEY = 'bnw_refresh_token';
const USER_CACHE_KEY = 'bnw_user_profile_cache';

// Concurrency mutex lock for single-flight token refresh (DEC-033)
let refreshPromise: Promise<boolean> | null = null;

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    timestamp: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    [key: string]: any;
  };
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
}

export interface AuthUser {
  id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  roles: string[];
  badgeNumber?: string;
}

export interface EditorialStatsResponse {
  totalIncoming: number;
  pendingReview: number;
  underReview: number;
  revisionRequested: number;
  publishedToday: number;
  publishedTotal: number;
  rejected: number;
  breakingNews: number;
}

// -------------------------------------------------------------
// TOKEN MANAGEMENT HELPERS
// -------------------------------------------------------------

export function getStoredAccessToken(): string | null {
  if (typeof sessionStorage !== 'undefined') {
    const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) return token;
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return null;
}

export function setStoredTokens(accessToken: string, refreshToken?: string): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  }
}

export function clearStoredTokens(): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_CACHE_KEY);
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(USER_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    }
  } catch {
    // Ignore parse error
  }
  return null;
}

export function setStoredUser(user: AuthUser): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  }
}

// -------------------------------------------------------------
// UNIVERSAL TYPED HTTP DISPATCHER
// -------------------------------------------------------------

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getStoredAccessToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type'] && options.body) {
    headers['Content-Type'] = 'application/json';
  }

  // 8-second request timeout safeguard with AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
    clearTimeout(timeoutId);

    // 401 Unauthorized handling with single-flight token refresh mutex (DEC-033)
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      const refreshToken = typeof localStorage !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
      if (refreshToken) {
        const refreshed = await refreshAccessTokenSingleFlight(refreshToken);
        if (refreshed) {
          const newToken = getStoredAccessToken();
          if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`;
          }
          const retryRes = await fetch(url, { ...options, headers });
          const retryJson = await retryRes.json().catch(() => null);
          if (retryRes.ok && retryJson) {
            return { success: true, data: retryJson.data as T, meta: retryJson.meta };
          }
        }
      }
      clearStoredTokens();
      return {
        success: false,
        data: null as unknown as T,
        error: { code: 'ERR_UNAUTHORIZED', message: 'सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।' },
      };
    }

    const json = await response.json().catch(() => null);

    if (!response.ok || !json?.success) {
      return {
        success: false,
        data: null as unknown as T,
        error: json?.error || {
          code: `ERR_HTTP_${response.status}`,
          message: 'सर्वर से संपर्क करने में त्रुटि हुई।',
        },
      };
    }

    return {
      success: true,
      data: json.data as T,
      meta: json.meta,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isTimeout = err?.name === 'AbortError';
    return {
      success: false,
      data: null as unknown as T,
      error: {
        code: isTimeout ? 'ERR_TIMEOUT' : 'ERR_NETWORK',
        message: isTimeout
          ? 'अनुरोध समय समाप्त (Timeout) हो गया।'
          : 'इंटरनेट कनेक्शन उपलब्ध नहीं है या सर्वर अनुपलब्ध है।',
      },
    };
  }
}

async function refreshAccessTokenSingleFlight(refreshToken: string): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.accessToken) {
          setStoredTokens(json.data.accessToken);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// -------------------------------------------------------------
// CENTRAL API CLIENT REPOSITORY INTERFACES
// -------------------------------------------------------------

export const apiClient = {
  // 1. Health & Observability (Section 13)
  health: {
    async checkHealth(): Promise<any> {
      try {
        const res = await fetch('/api/v1/health');
        if (res.ok) {
          return await res.json();
        }
      } catch {
        // Fallback to secondary endpoints
      }
      try {
        const fallbackRes = await fetch('/healthz/');
        if (fallbackRes.ok) {
          return await fallbackRes.json();
        }
      } catch {
        // Fallback to request wrapper
      }
      const apiRes = await request<any>('/health');
      return apiRes.success ? apiRes.data : null;
    },
  },

  // 2. Authentication & Identity (Section 6)
  auth: {
    async login(identifier: string, password = ''): Promise<AuthUser> {
      const res = await request<{ user: AuthUser; tokens: { accessToken: string; refreshToken?: string } }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ identifier, password }),
        }
      );
      if (res.success && res.data) {
        setStoredTokens(res.data.tokens.accessToken, res.data.tokens.refreshToken);
        setStoredUser(res.data.user);
        return res.data.user;
      }
      throw new Error(res.error?.message || 'लॉगिन विफल रहा।');
    },

    async loginWithFirebase(idToken: string): Promise<AuthUser> {
      const res = await request<{ user: AuthUser; tokens: { accessToken: string; refreshToken?: string } }>(
        '/auth/firebase-login',
        {
          method: 'POST',
          body: JSON.stringify({ idToken }),
        }
      );
      if (res.success && res.data) {
        setStoredTokens(res.data.tokens.accessToken, res.data.tokens.refreshToken);
        setStoredUser(res.data.user);
        return res.data.user;
      }
      throw new Error(res.error?.message || 'Firebase प्रमाणीकरण विफल रहा।');
    },

    async getCurrentUser(): Promise<AuthUser | null> {
      const token = getStoredAccessToken();
      if (!token) return getStoredUser();

      const res = await request<AuthUser>('/auth/me');
      if (res.success && res.data) {
        setStoredUser(res.data);
        return res.data;
      }
      return getStoredUser();
    },

    async logout(): Promise<void> {
      await request('/auth/logout', { method: 'POST' });
      clearStoredTokens();
    },

    clearStoredTokens(): void {
      clearStoredTokens();
    },
  },

  // 3. Public News Domain (Section 7, STEP D)
  publicNews: {
    async fetchArticles(params?: {
      status?: ArticleStatus | 'all';
      categoryId?: string;
      districtId?: string;
      isBreaking?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    }): Promise<{ items: ArticleDetail[]; total: number }> {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.categoryId) query.set('categoryId', params.categoryId);
      if (params?.districtId) query.set('districtId', params.districtId);
      if (params?.isBreaking !== undefined) query.set('isBreaking', String(params.isBreaking));
      if (params?.search) query.set('search', params.search);
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit || 50));

      const res = await request<ArticleDetail[]>(`/articles?${query.toString()}`);
      if (res.success && Array.isArray(res.data)) {
        return {
          items: res.data,
          total: res.meta?.pagination?.total || res.data.length,
        };
      }
      return { items: [], total: 0 };
    },

    async fetchArticleById(idOrSlug: string): Promise<ArticleDetail | null> {
      if (!idOrSlug) return null;
      const res = await request<ArticleDetail>(`/articles/${encodeURIComponent(idOrSlug)}`);
      return res.success ? res.data : null;
    },

    async fetchCategories(): Promise<CategoryItem[]> {
      const res = await request<CategoryItem[]>('/categories');
      return res.success && Array.isArray(res.data) ? res.data : [];
    },

    async fetchDistricts(): Promise<DistrictItem[]> {
      const res = await request<DistrictItem[]>('/territory/districts');
      return res.success && Array.isArray(res.data) ? res.data : [];
    },

    async fetchBreakingTickers(): Promise<BreakingTickerItem[]> {
      const res = await request<BreakingTickerItem[]>('/tickers');
      if (res.success && Array.isArray(res.data)) {
        return res.data.filter((t) => t.isActive);
      }
      return [];
    },

    async fetchAds(): Promise<AdBannerItem[]> {
      const res = await request<AdBannerItem[]>('/ads');
      return res.success && Array.isArray(res.data) ? res.data : [];
    },

    async fetchMandiRates(): Promise<MandiRateItem[]> {
      const res = await request<MandiRateItem[]>('/public/mandi-rates');
      return res.success && Array.isArray(res.data) ? res.data : [];
    },

    async verifyReporterBadge(badgeNumber: string): Promise<any | null> {
      if (!badgeNumber) return null;
      const res = await request<any>(`/public/reporters/verify/${encodeURIComponent(badgeNumber)}`);
      return res.success ? res.data : null;
    },
  },

  // 4. Reporter Domain (Section 7, STEP A & Section 8)
  reporter: {
    async createDraft(payload: CreateDraftRequest, author?: { id: string; name: string; role: string }): Promise<ArticleDetail> {
      const body = {
        ...payload,
        authorId: author?.id || 'rep-001',
        authorName: author?.name || 'राजेश पटेल',
        authorRole: author?.role || 'फील्ड संवाददाता',
      };
      const res = await request<ArticleDetail>('/articles/drafts', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'ड्राफ्ट बनाने में त्रुटि हुई।');
    },

    async updateDraft(articleId: string, payload: Partial<CreateDraftRequest>): Promise<ArticleDetail> {
      const res = await request<ArticleDetail>(`/articles/drafts/${encodeURIComponent(articleId)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'ड्राफ्ट अपडेट करने में त्रुटि हुई।');
    },

    async submitStory(articleId: string): Promise<ArticleDetail> {
      const res = await request<ArticleDetail>(`/articles/${encodeURIComponent(articleId)}/submit`, {
        method: 'POST',
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'समाचार समीक्षा हेतु जमा करने में त्रुटि हुई।');
    },

    async fetchMyArticles(authorId?: string): Promise<ArticleDetail[]> {
      const query = authorId ? `?authorId=${encodeURIComponent(authorId)}` : '';
      const res = await request<ArticleDetail[]>(`/articles/my-articles${query}`);
      return res.success && Array.isArray(res.data) ? res.data : [];
    },

    async uploadMedia(file: File, caption?: string): Promise<{ mediaId: string; url: string }> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const result = reader.result as string;
            const base64Buffer = result.includes(',') ? result.split(',')[1] : result;
            const payload = {
              fileName: file.name,
              mimeType: file.type,
              fileBuffer: base64Buffer,
              altTextHi: caption,
            };
            const res = await request<any>('/media/upload', {
              method: 'POST',
              body: JSON.stringify(payload),
            });
            if (res.success && res.data) {
              resolve({ mediaId: res.data.id || res.data.mediaId, url: res.data.url });
            } else {
              reject(new Error(res.error?.message || 'मीडिया अपलोड विफल रहा।'));
            }
          } catch (err: any) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('फ़ाइल पढ़ने में त्रुटि।'));
        reader.readAsDataURL(file);
      });
    },
  },

  // 5. Newsroom Editorial Domain (Section 7, STEP B & C, Section 9)
  newsroom: {
    async fetchIncomingQueue(): Promise<ArticleDetail[]> {
      const res = await request<ArticleDetail[]>('/articles?status=PENDING_REVIEW');
      return res.success && Array.isArray(res.data) ? res.data : [];
    },

    async fetchEditorialStats(): Promise<EditorialStatsResponse | null> {
      const res = await request<EditorialStatsResponse>('/articles/editorial/stats');
      return res.success ? res.data : null;
    },

    async claimStory(articleId: string): Promise<ArticleDetail> {
      const res = await request<ArticleDetail>(`/articles/${encodeURIComponent(articleId)}/review`, {
        method: 'POST',
        body: JSON.stringify({ action: 'claim' }),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'स्टोरी क्लेम करने में त्रुटि हुई।');
    },

    async reviewStory(
      articleId: string,
      payload: {
        action: 'approve' | 'request_changes' | 'reject' | 'claim' | 'reassign' | 'priority' | 'breaking' | 'schedule' | 'editorial_notes';
        updatedTitle?: string;
        updatedContent?: string;
        reasonCode?: string;
        feedbackComments?: string;
        notes?: string;
        editorId?: string;
        editorName?: string;
        assignedEditorId?: string;
        assignedEditorName?: string;
        priority?: ArticlePriority;
        isBreaking?: boolean;
        createTicker?: boolean;
        tickerText?: string;
        scheduledAt?: string;
      }
    ): Promise<ArticleDetail> {
      const res = await request<ArticleDetail>(`/articles/${encodeURIComponent(articleId)}/review`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'संपादकीय समीक्षा पूर्ण करने में त्रुटि हुई।');
    },

    async fetchQueueWithFilters(params?: {
      status?: string;
      categoryId?: string;
      districtId?: string;
      priority?: string;
      search?: string;
      page?: number;
      limit?: number;
    }): Promise<{ items: ArticleDetail[]; total: number }> {
      const query = new URLSearchParams();
      if (params?.status && params.status !== 'ALL') query.set('status', params.status);
      if (params?.categoryId && params.categoryId !== 'ALL') query.set('categoryId', params.categoryId);
      if (params?.districtId && params.districtId !== 'ALL') query.set('districtId', params.districtId);
      if (params?.priority && params.priority !== 'ALL') query.set('priority', params.priority);
      if (params?.search) query.set('search', params.search);
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit || 50));

      const res = await request<ArticleDetail[]>(`/articles?${query.toString()}`);
      if (res.success && Array.isArray(res.data)) {
        return {
          items: res.data,
          total: res.meta?.pagination?.total || res.data.length,
        };
      }
      return { items: [], total: 0 };
    },

    async reassignStory(articleId: string, editorId: string, editorName?: string): Promise<ArticleDetail> {
      return this.reviewStory(articleId, { action: 'reassign', editorId, editorName });
    },

    async updatePriority(articleId: string, priority: ArticlePriority): Promise<ArticleDetail> {
      return this.reviewStory(articleId, { action: 'priority', priority });
    },

    async toggleBreaking(
      articleId: string,
      isBreaking: boolean,
      priority?: ArticlePriority,
      createTicker?: boolean,
      tickerText?: string
    ): Promise<ArticleDetail> {
      return this.reviewStory(articleId, {
        action: 'breaking',
        isBreaking,
        priority: priority || (isBreaking ? 'BREAKING' : 'NORMAL'),
        createTicker,
        tickerText,
      });
    },

    async schedulePublication(articleId: string, scheduledAt: string): Promise<ArticleDetail> {
      return this.reviewStory(articleId, { action: 'schedule', scheduledAt });
    },

    async addEditorialNotes(articleId: string, notes: string): Promise<ArticleDetail> {
      return this.reviewStory(articleId, { action: 'editorial_notes', notes });
    },
  },

  // 6. Admin Control Domain (Section 10)
  admin: {
    async fetchDashboardMetrics(): Promise<any> {
      const res = await request<any>('/admin/dashboard');
      return res.success ? res.data : null;
    },

    async fetchReporters(): Promise<ReporterProfile[]> {
      const res = await request<ReporterProfile[]>('/admin/reporters');
      return res.success && Array.isArray(res.data) ? res.data : [];
    },

    async updateReporterRole(reporterId: string, role?: 'reporter' | 'trusted_reporter'): Promise<ReporterProfile> {
      const res = await request<ReporterProfile>(`/admin/reporters/${encodeURIComponent(reporterId)}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'रोल अपडेट करने में त्रुटि हुई।');
    },

    async updateReporterStatus(reporterId: string, status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'TRAINEE'): Promise<ReporterProfile> {
      const res = await request<ReporterProfile>(`/admin/reporters/${encodeURIComponent(reporterId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'संवाददाता स्थिति अपडेट करने में त्रुटि हुई।');
    },

    async assignReporterBeats(reporterId: string, beats: string[], districts?: string[]): Promise<ReporterProfile> {
      const res = await request<ReporterProfile>(`/admin/reporters/${encodeURIComponent(reporterId)}/beats`, {
        method: 'PATCH',
        body: JSON.stringify({ beats, districts }),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'संवाददाता बीट्स असाइन करने में त्रुटि हुई।');
    },

    async fetchReporterPerformance(reporterId: string): Promise<any> {
      const res = await request<any>(`/admin/reporters/${encodeURIComponent(reporterId)}/performance`);
      return res.success ? res.data : null;
    },

    async fetchTickers(): Promise<BreakingTickerItem[]> {
      const res = await request<BreakingTickerItem[]>('/admin/tickers');
      return res.success && Array.isArray(res.data) ? res.data : [];
    },

    async createTicker(data: { textHindi: string; districtName?: string; priority?: 'normal' | 'critical' }): Promise<BreakingTickerItem> {
      const res = await request<BreakingTickerItem>('/admin/tickers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'टिकर जोड़ने में त्रुटि हुई।');
    },

    async toggleTicker(tickerId: string): Promise<BreakingTickerItem> {
      const res = await request<BreakingTickerItem>(`/admin/tickers/${encodeURIComponent(tickerId)}`, {
        method: 'PATCH',
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'टिकर स्थिति बदलने में त्रुटि हुई।');
    },

    async deleteTicker(tickerId: string): Promise<void> {
      const res = await request<any>(`/admin/tickers/${encodeURIComponent(tickerId)}`, {
        method: 'DELETE',
      });
      if (!res.success) {
        throw new Error(res.error?.message || 'टिकर हटाने में त्रुटि हुई।');
      }
    },

    async fetchAds(): Promise<AdBannerItem[]> {
      const res = await request<AdBannerItem[]>('/admin/ads');
      return res.success && Array.isArray(res.data) ? res.data : [];
    },

    async createAd(dto: Partial<AdBannerItem>): Promise<AdBannerItem> {
      const res = await request<AdBannerItem>('/admin/ads', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'विज्ञापन जोड़ने में त्रुटि हुई।');
    },

    async toggleAd(adId: string): Promise<AdBannerItem> {
      const res = await request<AdBannerItem>(`/admin/ads/${encodeURIComponent(adId)}`, {
        method: 'PATCH',
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'विज्ञापन स्थिति बदलने में त्रुटि हुई।');
    },

    async deleteAd(adId: string): Promise<void> {
      const res = await request<any>(`/admin/ads/${encodeURIComponent(adId)}`, {
        method: 'DELETE',
      });
      if (!res.success) {
        throw new Error(res.error?.message || 'विज्ञापन हटाने में त्रुटि हुई।');
      }
    },

    async createMandiRate(dto: Partial<MandiRateItem>): Promise<MandiRateItem> {
      const res = await request<MandiRateItem>('/admin/mandi-rates', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'मंडी भाव जोड़ने में त्रुटि हुई।');
    },

    async updateMandiRate(id: string, dto: Partial<MandiRateItem>): Promise<MandiRateItem> {
      const res = await request<MandiRateItem>(`/admin/mandi-rates/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'मंडी भाव अपडेट करने में त्रुटि हुई।');
    },

    async deleteMandiRate(id: string): Promise<void> {
      const res = await request<any>(`/admin/mandi-rates/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.success) {
        throw new Error(res.error?.message || 'मंडी भाव हटाने में त्रुटि हुई।');
      }
    },

    async fetchAuditLogs(): Promise<SystemAuditLogItem[]> {
      const res = await request<SystemAuditLogItem[]>('/admin/audit-logs');
      return res.success && Array.isArray(res.data) ? res.data : [];
    },

    async broadcastAlert(title: string, district: string): Promise<any> {
      const res = await request<any>('/admin/alerts/broadcast', {
        method: 'POST',
        body: JSON.stringify({ title, district }),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'आपात अलर्ट प्रसारित करने में विफल।');
    },
  },

  // -------------------------------------------------------------
  // GRAPHICS & DESIGN STUDIO DOMAIN (/api/v1/graphics/*)
  // -------------------------------------------------------------
  graphics: {
    async fetchTemplates(filters?: { category?: string; aspectRatio?: string; search?: string }): Promise<GraphicTemplate[]> {
      const queryParams = new URLSearchParams();
      if (filters?.category) queryParams.set('category', filters.category);
      if (filters?.aspectRatio) queryParams.set('aspectRatio', filters.aspectRatio);
      if (filters?.search) queryParams.set('search', filters.search);
      const url = `/graphics/templates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const res = await request<GraphicTemplate[]>(url);
      return res.success && Array.isArray(res.data) ? res.data : [];
    },

    async fetchTemplateById(id: string): Promise<GraphicTemplate | null> {
      const res = await request<GraphicTemplate>(`/graphics/templates/${encodeURIComponent(id)}`);
      return res.success && res.data ? res.data : null;
    },

    async createTemplate(templateData: Partial<GraphicTemplate>): Promise<GraphicTemplate> {
      const res = await request<GraphicTemplate>('/graphics/templates', {
        method: 'POST',
        body: JSON.stringify(templateData),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'टेम्पलेट बनाने में त्रुटि हुई।');
    },

    async updateTemplate(id: string, templateData: Partial<GraphicTemplate>): Promise<GraphicTemplate> {
      const res = await request<GraphicTemplate>(`/graphics/templates/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(templateData),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'टेम्पलेट अपडेट करने में त्रुटि हुई।');
    },

    async duplicateTemplate(id: string): Promise<GraphicTemplate> {
      const res = await request<GraphicTemplate>(`/graphics/templates/${encodeURIComponent(id)}/duplicate`, {
        method: 'POST',
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'टेम्पलेट प्रतिलिपि बनाने में त्रुटि हुई।');
    },

    async deleteTemplate(id: string): Promise<void> {
      const res = await request<any>(`/graphics/templates/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.success) {
        throw new Error(res.error?.message || 'टेम्पलेट हटाने में त्रुटि हुई।');
      }
    },

    async fetchGraphics(params?: {
      status?: string;
      articleId?: string;
      createdBy?: string;
      category?: string;
      aspectRatio?: string;
      search?: string;
      page?: number;
      limit?: number;
    }): Promise<{ items: GraphicItem[]; pagination?: any }> {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.set('status', params.status);
      if (params?.articleId) queryParams.set('articleId', params.articleId);
      if (params?.createdBy) queryParams.set('createdBy', params.createdBy);
      if (params?.category) queryParams.set('category', params.category);
      if (params?.aspectRatio) queryParams.set('aspectRatio', params.aspectRatio);
      if (params?.search) queryParams.set('search', params.search);
      if (params?.page) queryParams.set('page', String(params.page));
      if (params?.limit) queryParams.set('limit', String(params.limit));

      const url = `/graphics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const res = await request<GraphicItem[]>(url);
      return {
        items: res.success && Array.isArray(res.data) ? res.data : [],
        pagination: res.meta?.pagination,
      };
    },

    async fetchGraphicById(id: string): Promise<GraphicItem | null> {
      const res = await request<GraphicItem>(`/graphics/${encodeURIComponent(id)}`);
      return res.success && res.data ? res.data : null;
    },

    async createGraphic(graphicData: Partial<GraphicItem>): Promise<GraphicItem> {
      const res = await request<GraphicItem>('/graphics', {
        method: 'POST',
        body: JSON.stringify(graphicData),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'ग्राफ़िक सुरक्षित करने में त्रुटि हुई।');
    },

    async updateGraphic(id: string, graphicData: Partial<GraphicItem>): Promise<GraphicItem> {
      const res = await request<GraphicItem>(`/graphics/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(graphicData),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'ग्राफ़िक अपडेट करने में त्रुटि हुई।');
    },

    async updateGraphicStatus(id: string, status: GraphicStatus, reviewNotes?: string): Promise<GraphicItem> {
      const res = await request<GraphicItem>(`/graphics/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reviewNotes }),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'ग्राफ़िक स्थिति बदलने में त्रुटि हुई।');
    },

    async deleteGraphic(id: string): Promise<void> {
      const res = await request<any>(`/graphics/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.success) {
        throw new Error(res.error?.message || 'ग्राफ़िक हटाने में त्रुटि हुई।');
      }
    },

    async newsToGraphic(reqPayload: NewsToGraphicRequest | { article?: any; articleId?: string; templateId?: string; aspectRatio?: string }): Promise<any> {
      const res = await request<any>('/graphics/news-to-graphic', {
        method: 'POST',
        body: JSON.stringify(reqPayload),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'समाचार से ग्राफ़िक रूपांतरण विफल रहा।');
    },
  },

  // -------------------------------------------------------------
  // VIDEO PRODUCTION STUDIO DOMAIN (/api/v1/videos/*)
  // -------------------------------------------------------------
  videos: {
    async fetchTemplates(filters?: { category?: string; aspectRatio?: string; search?: string }): Promise<VideoTemplate[]> {
      const queryParams = new URLSearchParams();
      if (filters?.category) queryParams.set('category', filters.category);
      if (filters?.aspectRatio) queryParams.set('aspectRatio', filters.aspectRatio);
      if (filters?.search) queryParams.set('search', filters.search);
      const url = `/videos/templates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const res = await request<VideoTemplate[]>(url);
      return res.success && Array.isArray(res.data) ? res.data : [];
    },

    async fetchTemplateById(id: string): Promise<VideoTemplate | null> {
      const res = await request<VideoTemplate>(`/videos/templates/${encodeURIComponent(id)}`);
      return res.success && res.data ? res.data : null;
    },

    async createTemplate(templateData: Partial<VideoTemplate>): Promise<VideoTemplate> {
      const res = await request<VideoTemplate>('/videos/templates', {
        method: 'POST',
        body: JSON.stringify(templateData),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'वीडियो टेम्पलेट बनाने में त्रुटि हुई।');
    },

    async updateTemplate(id: string, templateData: Partial<VideoTemplate>): Promise<VideoTemplate> {
      const res = await request<VideoTemplate>(`/videos/templates/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(templateData),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'वीडियो टेम्पलेट अपडेट करने में त्रुटि हुई।');
    },

    async duplicateTemplate(id: string): Promise<VideoTemplate> {
      const res = await request<VideoTemplate>(`/videos/templates/${encodeURIComponent(id)}/duplicate`, {
        method: 'POST',
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'वीडियो टेम्पलेट प्रतिलिपि बनाने में त्रुटि हुई।');
    },

    async deleteTemplate(id: string): Promise<void> {
      const res = await request<any>(`/videos/templates/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.success) {
        throw new Error(res.error?.message || 'वीडियो टेम्पलेट हटाने में त्रुटि हुई।');
      }
    },

    async fetchProjects(params?: {
      status?: string;
      aspectRatio?: string;
      createdBy?: string;
      search?: string;
      page?: number;
      limit?: number;
    }): Promise<{ items: VideoProject[]; pagination?: any }> {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.set('status', params.status);
      if (params?.aspectRatio) queryParams.set('aspectRatio', params.aspectRatio);
      if (params?.createdBy) queryParams.set('createdBy', params.createdBy);
      if (params?.search) queryParams.set('search', params.search);
      if (params?.page) queryParams.set('page', String(params.page));
      if (params?.limit) queryParams.set('limit', String(params.limit));

      const url = `/videos/projects${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const res = await request<VideoProject[]>(url);
      return {
        items: res.success && Array.isArray(res.data) ? res.data : [],
        pagination: res.meta?.pagination,
      };
    },

    async fetchProjectById(id: string): Promise<VideoProject | null> {
      const res = await request<VideoProject>(`/videos/projects/${encodeURIComponent(id)}`);
      return res.success && res.data ? res.data : null;
    },

    async createProject(projectData: Partial<VideoProject>): Promise<VideoProject> {
      const res = await request<VideoProject>('/videos/projects', {
        method: 'POST',
        body: JSON.stringify(projectData),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'वीडियो प्रोजेक्ट बनाने में त्रुटि हुई।');
    },

    async updateProject(id: string, projectData: Partial<VideoProject>): Promise<VideoProject> {
      const res = await request<VideoProject>(`/videos/projects/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(projectData),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'वीडियो प्रोजेक्ट अपडेट करने में त्रुटि हुई।');
    },

    async deleteProject(id: string): Promise<void> {
      const res = await request<any>(`/videos/projects/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.success) {
        throw new Error(res.error?.message || 'वीडियो प्रोजेक्ट हटाने में त्रुटि हुई।');
      }
    },

    async newsToVideo(reqPayload: NewsToVideoRequest | { article?: any; articleId?: string; templateId?: string; aspectRatio?: string }): Promise<any> {
      const res = await request<any>('/videos/news-to-video', {
        method: 'POST',
        body: JSON.stringify(reqPayload),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'समाचार से वीडियो रूपांतरण विफल रहा।');
    },

    async submitRender(payload: { projectId?: string; project?: any; resolution?: string; fps?: number; format?: string }): Promise<VideoRenderJob> {
      const res = await request<VideoRenderJob>('/videos/render', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'वीडियो रेंडर सबमिट करने में त्रुटि हुई।');
    },

    async fetchRenderQueue(filters?: { status?: string; projectId?: string }): Promise<VideoRenderJob[]> {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.set('status', filters.status);
      if (filters?.projectId) queryParams.set('projectId', filters.projectId);
      const url = `/videos/render/queue${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const res = await request<VideoRenderJob[]>(url);
      return res.success && Array.isArray(res.data) ? res.data : [];
    },

    async fetchRenderJobById(jobId: string): Promise<VideoRenderJob | null> {
      const res = await request<VideoRenderJob>(`/videos/render/${encodeURIComponent(jobId)}`);
      return res.success && res.data ? res.data : null;
    },

    async retryRenderJob(jobId: string): Promise<VideoRenderJob> {
      const res = await request<VideoRenderJob>(`/videos/render/${encodeURIComponent(jobId)}/retry`, {
        method: 'POST',
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'रेंडर पुनः प्रयास विफल रहा।');
    },

    async cancelRenderJob(jobId: string): Promise<VideoRenderJob> {
      const res = await request<VideoRenderJob>(`/videos/render/${encodeURIComponent(jobId)}/cancel`, {
        method: 'POST',
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'रेंडर निरस्त करने में त्रुटि हुई।');
    },
  },

  // -------------------------------------------------------------
  // AI NEWSROOM & INTELLIGENT AUTOMATION DOMAIN (/api/v1/ai/*)
  // -------------------------------------------------------------
  ai: {
    async fetchProviders(): Promise<{
      activeProvider: string;
      providers: Record<string, any>;
      models: any[];
      roleQuotas: Record<string, number>;
    }> {
      const res = await request<any>('/ai/providers');
      return res.success && res.data ? res.data : { activeProvider: 'mock', providers: {}, models: [], roleQuotas: {} };
    },

    async generateNewsDraft(payload: AiNewsWriterRequest): Promise<AiNewsWriterResponse> {
      const res = await request<AiNewsWriterResponse>('/ai/news-writer', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'AI समाचार आलेख तैयार करने में त्रुटि हुई।');
    },

    async generateHeadlines(payload: AiHeadlineRequest): Promise<AiHeadlineResponse> {
      const res = await request<AiHeadlineResponse>('/ai/headlines', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'AI हेडलाइन जनरेट करने में त्रुटि हुई।');
    },

    async summarizeNews(payload: AiSummarizerRequest): Promise<AiSummarizerResponse> {
      const res = await request<AiSummarizerResponse>('/ai/summarize', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'AI सारांश तैयार करने में त्रुटि हुई।');
    },

    async rewriteNews(payload: {
      content: string;
      tone?: string;
      targetLanguage?: string;
      fixGrammarAndSpelling?: boolean;
      provider?: string;
    }): Promise<any> {
      const res = await request<any>('/ai/rewrite', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'AI पुनर्लेखन में त्रुटि हुई।');
    },

    async performFactCheck(payload: AiFactCheckRequest): Promise<AiFactCheckResponse> {
      const res = await request<AiFactCheckResponse>('/ai/fact-check', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'तथ्य-परीक्षण में त्रुटि हुई।');
    },

    async conductResearch(payload: AiResearchRequest): Promise<AiResearchResponse> {
      const res = await request<AiResearchResponse>('/ai/research', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'अनुसंधान डॉसियर तैयार करने में त्रुटि हुई।');
    },

    async generateSocialCaptions(payload: AiSocialMediaRequest): Promise<AiSocialMediaResponse> {
      const res = await request<AiSocialMediaResponse>('/ai/social', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'सोशल मीडिया पोस्ट तैयार करने में त्रुटि हुई।');
    },

    async optimizeSeo(payload: AiSeoRequest): Promise<AiSeoResponse> {
      const res = await request<AiSeoResponse>('/ai/seo', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'एसईओ विश्लेषण में त्रुटि हुई।');
    },

    async fetchPrompts(filters?: { category?: string; search?: string }): Promise<AiPromptItem[]> {
      const queryParams = new URLSearchParams();
      if (filters?.category && filters.category !== 'ALL') queryParams.set('category', filters.category);
      if (filters?.search) queryParams.set('search', filters.search);
      const url = `/ai/prompts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const res = await request<AiPromptItem[]>(url);
      return res.success && Array.isArray(res.data) ? res.data : [];
    },

    async fetchPromptById(id: string): Promise<AiPromptItem | null> {
      const res = await request<AiPromptItem>(`/ai/prompts/${encodeURIComponent(id)}`);
      return res.success && res.data ? res.data : null;
    },

    async savePrompt(promptData: Partial<AiPromptItem>): Promise<AiPromptItem> {
      const isUpdate = Boolean(promptData.id);
      const url = isUpdate ? `/ai/prompts/${encodeURIComponent(promptData.id!)}` : '/ai/prompts';
      const method = isUpdate ? 'PUT' : 'POST';
      const res = await request<AiPromptItem>(url, {
        method,
        body: JSON.stringify(promptData),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'प्रॉम्ट सहेजने में त्रुटि हुई।');
    },

    async deletePrompt(id: string): Promise<boolean> {
      const res = await request<any>(`/ai/prompts/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return Boolean(res.success);
    },

    async fetchHistory(params?: {
      category?: string;
      search?: string;
      page?: number;
      limit?: number;
      userId?: string;
    }): Promise<{ items: AiContentHistoryItem[]; total: number; totalPages: number }> {
      const queryParams = new URLSearchParams();
      if (params?.category && params.category !== 'ALL') queryParams.set('category', params.category);
      if (params?.search) queryParams.set('search', params.search);
      if (params?.page) queryParams.set('page', String(params.page));
      if (params?.limit) queryParams.set('limit', String(params.limit));
      if (params?.userId) queryParams.set('userId', params.userId);

      const url = `/ai/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const res = await request<any>(url);
      return {
        items: res.success && res.data?.items ? res.data.items : [],
        total: res.success && res.data?.pagination?.total ? res.data.pagination.total : 0,
        totalPages: res.success && res.data?.pagination?.totalPages ? res.data.pagination.totalPages : 1,
      };
    },

    async saveAsDraft(historyId: string, articleOverrides?: Partial<CreateDraftRequest>): Promise<any> {
      const res = await request<any>(`/ai/history/${encodeURIComponent(historyId)}/save-as-draft`, {
        method: 'POST',
        body: JSON.stringify(articleOverrides || {}),
      });
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || 'AI ड्राफ्ट न्यूज़ रूम में सहेजने में त्रुटि हुई।');
    },

    async deleteHistoryItem(id: string): Promise<boolean> {
      const res = await request<any>(`/ai/history/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return Boolean(res.success);
    },

    async fetchUsageStats(params?: { userId?: string; promptCategory?: string }): Promise<{
      totalCalls: number;
      totalTokens: number;
      totalCostInr: number;
      callsByCategory: Record<string, number>;
      callsByProvider: Record<string, number>;
      userRole: string;
      dailyQuota: number;
      remainingCallsToday: number;
      currency: string;
      recentRecords: AiUsageRecord[];
    }> {
      const queryParams = new URLSearchParams();
      if (params?.userId) queryParams.set('userId', params.userId);
      if (params?.promptCategory) queryParams.set('promptCategory', params.promptCategory);
      const url = `/ai/usage${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const res = await request<any>(url);
      return res.success && res.data
        ? res.data
        : {
            totalCalls: 0,
            totalTokens: 0,
            totalCostInr: 0,
            callsByCategory: {},
            callsByProvider: {},
            userRole: 'REPORTER',
            dailyQuota: 50,
            remainingCallsToday: 50,
            currency: 'INR',
            recentRecords: [],
          };
    },
  },

  // =========================================================================
  // MASTER EXECUTION 024: API POOL & THIRD-PARTY INTEGRATIONS CLIENT
  // =========================================================================

  integrations: {
    async getProviders(category?: string): Promise<IntegrationProviderItem[]> {
      const url = category ? `/api-pool/providers?category=${encodeURIComponent(category)}` : '/api-pool/providers';
      const res = await request<{ providers: IntegrationProviderItem[]; total: number }>(url);
      return res.success && res.data?.providers ? res.data.providers : [];
    },

    async getProviderById(id: string): Promise<IntegrationProviderItem | null> {
      const res = await request<IntegrationProviderItem>(`/api-pool/providers/${encodeURIComponent(id)}`);
      return res.success && res.data ? res.data : null;
    },

    async registerProvider(dto: CreateIntegrationProviderDto): Promise<IntegrationProviderItem> {
      const res = await request<IntegrationProviderItem>('/api-pool/providers', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'प्रदाता पंजीकृत करने में त्रुटि हुई।');
    },

    async updateProvider(id: string, dto: Partial<CreateIntegrationProviderDto>): Promise<IntegrationProviderItem> {
      const res = await request<IntegrationProviderItem>(`/api-pool/providers/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(dto),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'प्रदाता अपडेट करने में त्रुटि हुई।');
    },

    async toggleProvider(id: string, isEnabled: boolean): Promise<IntegrationProviderItem> {
      const res = await request<IntegrationProviderItem>(`/api-pool/providers/${encodeURIComponent(id)}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ isEnabled }),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'प्रदाता स्थिति बदलने में त्रुटि हुई।');
    },

    async testHealth(id: string): Promise<IntegrationProviderItem> {
      const res = await request<IntegrationProviderItem>(`/api-pool/providers/${encodeURIComponent(id)}/health`, {
        method: 'POST',
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'हेल्थ टेस्ट विफल रहा।');
    },

    async getUsageSummary(): Promise<ApiPoolUsageSummary> {
      const res = await request<ApiPoolUsageSummary>('/api-pool/usage');
      return res.success && res.data
        ? res.data
        : {
            totalProviders: 0,
            activeProviders: 0,
            healthyProviders: 0,
            totalDailyTokens: 0,
            totalMonthlyTokens: 0,
            totalEstimatedCostUsd: 0,
            totalEstimatedCostInr: 0,
            currency: 'INR',
            providers: [],
          };
    },

    async getCostBreakdown(): Promise<any> {
      const res = await request<any>('/api-pool/costs');
      return res.success && res.data ? res.data : null;
    },
  },

  rss: {
    async listSources(params?: { status?: string; category?: string; search?: string }): Promise<{ items: RssSourceItem[]; total: number }> {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.category) q.set('category', params.category);
      if (params?.search) q.set('search', params.search);
      const url = `/rss/sources${q.toString() ? `?${q.toString()}` : ''}`;
      const res = await request<{ items: RssSourceItem[]; total: number }>(url);
      return res.success && res.data ? res.data : { items: [], total: 0 };
    },

    async getSourceById(id: string): Promise<RssSourceItem | null> {
      const res = await request<RssSourceItem>(`/rss/sources/${encodeURIComponent(id)}`);
      return res.success && res.data ? res.data : null;
    },

    async createSource(dto: CreateRssSourceDto): Promise<RssSourceItem> {
      const res = await request<RssSourceItem>('/rss/sources', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'RSS स्रोत जोड़ने में त्रुटि हुई।');
    },

    async updateSource(id: string, dto: any): Promise<RssSourceItem> {
      const res = await request<RssSourceItem>(`/rss/sources/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(dto),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'RSS स्रोत अपडेट करने में त्रुटि हुई।');
    },

    async toggleSource(id: string, isEnabled: boolean): Promise<RssSourceItem> {
      const res = await request<RssSourceItem>(`/rss/sources/${encodeURIComponent(id)}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ isEnabled }),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'स्रोत स्थिति बदलने में त्रुटि हुई।');
    },

    async deleteSource(id: string): Promise<boolean> {
      const res = await request<any>(`/rss/sources/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return Boolean(res.success);
    },

    async syncSource(id: string): Promise<any> {
      const res = await request<any>(`/rss/sources/${encodeURIComponent(id)}/sync`, {
        method: 'POST',
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'फ़ीड सिंक विफल रहा।');
    },

    async validateFeed(feedUrl: string): Promise<FeedValidationResult> {
      const res = await request<FeedValidationResult>('/rss/validate', {
        method: 'POST',
        body: JSON.stringify({ feedUrl }),
      });
      if (res.success && res.data) return res.data;
      return { isValid: false, isSafe: false, error: res.error?.message || 'सत्यापन विफल' };
    },

    async listItems(params?: { sourceId?: string; status?: string; search?: string; page?: number; limit?: number }): Promise<{
      items: ImportedRssItemDto[];
      total: number;
    }> {
      const q = new URLSearchParams();
      if (params?.sourceId) q.set('sourceId', params.sourceId);
      if (params?.status) q.set('status', params.status);
      if (params?.search) q.set('search', params.search);
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      const url = `/rss/items${q.toString() ? `?${q.toString()}` : ''}`;
      const res = await request<any>(url);
      return {
        items: res.success && res.data?.items ? res.data.items : [],
        total: res.success && res.data?.pagination?.total ? res.data.pagination.total : 0,
      };
    },

    async convertToDraft(id: string): Promise<any> {
      const res = await request<any>(`/rss/items/${encodeURIComponent(id)}/convert-to-draft`, {
        method: 'POST',
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'ड्राफ्ट में बदलने में त्रुटि हुई।');
    },

    async getHealth(): Promise<any> {
      const res = await request<any>('/rss/health');
      return res.success && res.data ? res.data : null;
    },
  },

  social: {
    async getConstraints(): Promise<Record<string, PlatformPublishingConstraints>> {
      const res = await request<Record<string, PlatformPublishingConstraints>>('/social/platforms/constraints');
      return res.success && res.data ? res.data : {};
    },

    async getAccounts(platform?: string): Promise<SocialAccountItem[]> {
      const url = platform ? `/social/accounts?platform=${encodeURIComponent(platform)}` : '/social/accounts';
      const res = await request<{ accounts: SocialAccountItem[]; total: number }>(url);
      return res.success && res.data?.accounts ? res.data.accounts : [];
    },

    async connectAccount(dto: any): Promise<SocialAccountItem> {
      const res = await request<SocialAccountItem>('/social/accounts', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'सोशल खाता जोड़ने में त्रुटि हुई।');
    },

    async toggleAccount(id: string, isActive: boolean): Promise<SocialAccountItem> {
      const res = await request<SocialAccountItem>(`/social/accounts/${encodeURIComponent(id)}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'सोशल खाता स्थिति बदलने में त्रुटि हुई।');
    },

    async disconnectAccount(id: string): Promise<SocialAccountItem> {
      const res = await request<SocialAccountItem>(`/social/accounts/${encodeURIComponent(id)}/disconnect`, {
        method: 'POST',
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'सोशल खाता डिस्कनेक्ट करने में त्रुटि हुई।');
    },

    async listJobs(status?: string): Promise<SocialPublishingJobItem[]> {
      const url = status ? `/social/publishing?status=${encodeURIComponent(status)}` : '/social/publishing';
      const res = await request<{ jobs: SocialPublishingJobItem[]; total: number }>(url);
      return res.success && res.data?.jobs ? res.data.jobs : [];
    },

    async getJobById(id: string): Promise<SocialPublishingJobItem | null> {
      const res = await request<SocialPublishingJobItem>(`/social/publishing/${encodeURIComponent(id)}`);
      return res.success && res.data ? res.data : null;
    },

    async createJob(dto: CreateSocialPublishingJobDto): Promise<SocialPublishingJobItem> {
      const res = await request<SocialPublishingJobItem>('/social/publishing', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'सोशल पोस्ट तैयार करने में त्रुटि हुई।');
    },

    async approveJob(id: string): Promise<SocialPublishingJobItem> {
      const res = await request<SocialPublishingJobItem>(`/social/publishing/${encodeURIComponent(id)}/approve`, {
        method: 'POST',
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'अनुमोदन विफल रहा।');
    },

    async scheduleJob(id: string, scheduledAt: string): Promise<SocialPublishingJobItem> {
      const res = await request<SocialPublishingJobItem>(`/social/publishing/${encodeURIComponent(id)}/schedule`, {
        method: 'POST',
        body: JSON.stringify({ scheduledAt }),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'शेड्यूलिंग विफल रही।');
    },

    async cancelJob(id: string): Promise<SocialPublishingJobItem> {
      const res = await request<SocialPublishingJobItem>(`/social/publishing/${encodeURIComponent(id)}/cancel`, {
        method: 'POST',
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'रद्द करने में त्रुटि हुई।');
    },

    async publishImmediately(id: string): Promise<SocialPublishingJobItem> {
      const res = await request<SocialPublishingJobItem>(`/social/publishing/${encodeURIComponent(id)}/publish`, {
        method: 'POST',
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'प्रकाशन विफल रहा।');
    },
  },

  whatsapp: {
    async getTemplates(): Promise<WhatsAppTemplateItem[]> {
      const res = await request<{ templates: WhatsAppTemplateItem[]; total: number }>('/whatsapp/templates');
      return res.success && res.data?.templates ? res.data.templates : [];
    },

    async createTemplate(dto: any): Promise<WhatsAppTemplateItem> {
      const res = await request<WhatsAppTemplateItem>('/whatsapp/templates', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'टेम्पलेट बनाने में त्रुटि हुई।');
    },

    async getSubscribers(params?: { status?: string; district?: string }): Promise<WhatsAppSubscriberItem[]> {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.district) q.set('district', params.district);
      const url = `/whatsapp/subscribers${q.toString() ? `?${q.toString()}` : ''}`;
      const res = await request<{ subscribers: WhatsAppSubscriberItem[]; total: number }>(url);
      return res.success && res.data?.subscribers ? res.data.subscribers : [];
    },

    async optIn(dto: { phoneNumber: string; name?: string; district?: string }): Promise<any> {
      const res = await request<any>('/whatsapp/subscribers/opt-in', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      return res.success && res.data ? res.data : null;
    },

    async optOut(dto: { phoneNumber: string; reason?: string }): Promise<any> {
      const res = await request<any>('/whatsapp/subscribers/opt-out', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      return res.success && res.data ? res.data : null;
    },

    async sendMessage(dto: { templateId: string; recipientPhone: string; parameters?: string[] }): Promise<any> {
      const res = await request<any>('/whatsapp/messages/send', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'संदेश भेजने में त्रुटि हुई।');
    },
  },

  youtube: {
    async getStatus(): Promise<any> {
      const res = await request<any>('/youtube/status');
      return res.success && res.data ? res.data : null;
    },

    async getQuota(): Promise<YouTubeQuotaStatus> {
      const res = await request<YouTubeQuotaStatus>('/youtube/quota');
      return res.success && res.data
        ? res.data
        : {
            dailyQuotaLimit: 10000,
            dailyQuotaUsed: 0,
            remainingQuota: 10000,
            videoUploadCost: 1600,
            estimatedUploadsRemaining: 6,
          };
    },

    async prepareUpload(dto: { title: string; videoUrl: string; description?: string; tags?: string[]; privacyStatus?: string }): Promise<YouTubeUploadPrepDto> {
      const res = await request<YouTubeUploadPrepDto>('/youtube/upload-prep', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'यूट्यूब अपलोड तैयार करने में त्रुटि हुई।');
    },
  },

  webhooks: {
    async listWebhooks(): Promise<any[]> {
      const res = await request<{ webhooks: any[]; total: number }>('/webhooks');
      return res.success && res.data?.webhooks ? res.data.webhooks : [];
    },

    async registerWebhook(dto: any): Promise<any> {
      const res = await request<any>('/webhooks', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'वेबहुक जोड़ने में त्रुटि हुई।');
    },

    async listLogs(limit = 100): Promise<WebhookLogItem[]> {
      const res = await request<{ logs: WebhookLogItem[]; total: number }>(`/webhooks/logs?limit=${limit}`);
      return res.success && res.data?.logs ? res.data.logs : [];
    },

    async testVerify(dto: { rawBody: string; signature: string; secret: string; timestamp?: string | number; nonce?: string }): Promise<any> {
      const res = await request<any>('/webhooks/test-verify', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      return res.success && res.data ? res.data : null;
    },
  },

  monetization: {
    async getDashboardSummary(): Promise<BusinessDashboardSummary> {
      const res = await request<BusinessDashboardSummary>('/monetization/dashboard');
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'डैशबोर्ड सारांश प्राप्त करने में त्रुटि।');
    },

    async getPlans(activeOnly = false): Promise<SubscriptionPlanItem[]> {
      const res = await request<{ plans: SubscriptionPlanItem[]; total: number }>(`/monetization/plans?activeOnly=${activeOnly}`);
      return res.success && res.data?.plans ? res.data.plans : [];
    },

    async createPlan(dto: Partial<SubscriptionPlanItem>): Promise<SubscriptionPlanItem> {
      const res = await request<SubscriptionPlanItem>('/monetization/plans', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'योजना सृजित करने में त्रुटि।');
    },

    async togglePlan(planId: string, isActive: boolean): Promise<SubscriptionPlanItem> {
      const res = await request<SubscriptionPlanItem>(`/monetization/plans/${planId}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'योजना स्थिति अद्यतन विफल।');
    },

    async getSubscriptions(): Promise<CustomerSubscriptionItem[]> {
      const res = await request<{ subscriptions: CustomerSubscriptionItem[]; total: number }>('/monetization/subscriptions');
      return res.success && res.data?.subscriptions ? res.data.subscriptions : [];
    },

    async getEntitlements(): Promise<any> {
      const res = await request<any>('/monetization/subscriptions/entitlements');
      return res.success && res.data ? res.data : { isAdFree: false };
    },

    async createSubscription(dto: any): Promise<CustomerSubscriptionItem> {
      const res = await request<CustomerSubscriptionItem>('/monetization/subscriptions', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'सदस्यता सक्रियण विफल।');
    },

    async cancelSubscription(id: string, immediate = false): Promise<CustomerSubscriptionItem> {
      const res = await request<CustomerSubscriptionItem>(`/monetization/subscriptions/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ immediate }),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'सदस्यता निरस्त करने में त्रुटि।');
    },

    async renewSubscription(id: string): Promise<CustomerSubscriptionItem> {
      const res = await request<CustomerSubscriptionItem>(`/monetization/subscriptions/${id}/renew`, {
        method: 'POST',
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'सदस्यता नवीनीकरण विफल।');
    },

    async createPaymentOrder(dto: any): Promise<PaymentOrderItem> {
      const res = await request<PaymentOrderItem>('/monetization/payments/orders', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'भुगतान आदेश सृजन विफल।');
    },

    async verifyPayment(dto: { orderId: string; providerPaymentId: string; signature: string; gateway?: string }): Promise<any> {
      const res = await request<any>('/monetization/payments/verify', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'भुगतान सत्यापन विफल।');
    },

    async listTransactions(): Promise<TransactionItem[]> {
      const res = await request<{ transactions: TransactionItem[]; total: number }>('/monetization/payments/transactions');
      return res.success && res.data?.transactions ? res.data.transactions : [];
    },

    async processRefund(transactionId: string, amountPaise?: number, reason?: string): Promise<any> {
      const res = await request<any>(`/monetization/payments/transactions/${transactionId}/refund`, {
        method: 'POST',
        body: JSON.stringify({ amountPaise, reason }),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'रिफंड प्रोसेस करने में त्रुटि।');
    },

    async listAdvertisers(status?: string, search?: string): Promise<AdvertiserProfile[]> {
      let query = '';
      if (status) query += `status=${status}&`;
      if (search) query += `search=${encodeURIComponent(search)}`;
      const res = await request<{ advertisers: AdvertiserProfile[]; total: number }>(`/monetization/advertisers?${query}`);
      return res.success && res.data?.advertisers ? res.data.advertisers : [];
    },

    async createAdvertiser(dto: Partial<AdvertiserProfile>): Promise<AdvertiserProfile> {
      const res = await request<AdvertiserProfile>('/monetization/advertisers', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'विज्ञापनदाता पंजीकरण विफल।');
    },

    async verifyAdvertiser(advertiserId: string): Promise<AdvertiserProfile> {
      const res = await request<AdvertiserProfile>(`/monetization/advertisers/${advertiserId}/verify`, {
        method: 'PATCH',
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'विज्ञापनदाता सत्यापन विफल।');
    },

    async suspendAdvertiser(advertiserId: string, reason?: string): Promise<AdvertiserProfile> {
      const res = await request<AdvertiserProfile>(`/monetization/advertisers/${advertiserId}/suspend`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'विज्ञापनदाता निलंबन विफल।');
    },

    async listCampaigns(status?: string, slotCode?: string): Promise<AdCampaignItem[]> {
      let q = '';
      if (status) q += `status=${status}&`;
      if (slotCode) q += `slotCode=${slotCode}`;
      const res = await request<{ campaigns: AdCampaignItem[]; total: number }>(`/monetization/campaigns?${q}`);
      return res.success && res.data?.campaigns ? res.data.campaigns : [];
    },

    async createCampaign(dto: Partial<AdCampaignItem>): Promise<AdCampaignItem> {
      const res = await request<AdCampaignItem>('/monetization/campaigns', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'अभियान सृजन विफल।');
    },

    async reviewCampaign(campaignId: string, action: 'approve' | 'reject', reason?: string): Promise<AdCampaignItem> {
      const res = await request<AdCampaignItem>(`/monetization/campaigns/${campaignId}/review`, {
        method: 'POST',
        body: JSON.stringify({ action, reason }),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'अभियान समीक्षा विफल।');
    },

    async updateCampaignStatus(campaignId: string, status: string): Promise<AdCampaignItem> {
      const res = await request<AdCampaignItem>(`/monetization/campaigns/${campaignId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'अभियान स्थिति अद्यतन विफल।');
    },

    async serveAd(slotCode: string, district?: string): Promise<any> {
      const res = await request<any>(`/monetization/ads/serve?slotCode=${slotCode}&district=${district || 'ALL'}`);
      return res.success && res.data?.ad ? res.data.ad : null;
    },

    async listSlots(): Promise<AdPlacementSlotItem[]> {
      const res = await request<{ slots: AdPlacementSlotItem[]; total: number }>('/monetization/ads/slots');
      return res.success && res.data?.slots ? res.data.slots : [];
    },

    async recordImpression(campaignId: string, viewablePercentage = 100, durationMs = 1200): Promise<any> {
      const res = await request<any>('/monetization/ads/impression', {
        method: 'POST',
        body: JSON.stringify({ campaignId, viewablePercentage, durationMs }),
      });
      return res.success ? res.data : null;
    },

    async recordClick(campaignId: string): Promise<any> {
      const res = await request<any>('/monetization/ads/click', {
        method: 'POST',
        body: JSON.stringify({ campaignId }),
      });
      return res.success ? res.data : null;
    },

    async listSponsoredArticles(status?: string): Promise<SponsoredArticleItem[]> {
      const q = status ? `?status=${status}` : '';
      const res = await request<{ articles: SponsoredArticleItem[]; total: number }>(`/monetization/sponsored${q}`);
      return res.success && res.data?.articles ? res.data.articles : [];
    },

    async submitSponsoredArticle(dto: Partial<SponsoredArticleItem>): Promise<SponsoredArticleItem> {
      const res = await request<SponsoredArticleItem>('/monetization/sponsored', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'प्रायोजित आलेख प्रस्तुति विफल।');
    },

    async reviewSponsoredArticle(id: string, action: 'approve' | 'reject', reason?: string): Promise<SponsoredArticleItem> {
      const res = await request<SponsoredArticleItem>(`/monetization/sponsored/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ action, reason }),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'प्रायोजित सामग्री संपादकीय समीक्षा विफल।');
    },

    async getCrmNotes(advertiserId: string): Promise<CrmNoteItem[]> {
      const res = await request<{ notes: CrmNoteItem[]; total: number }>(`/monetization/crm/notes/${advertiserId}`);
      return res.success && res.data?.notes ? res.data.notes : [];
    },

    async addCrmNote(advertiserId: string, dto: { channel: string; summary: string; details?: string; followUpDate?: string }): Promise<CrmNoteItem> {
      const res = await request<CrmNoteItem>(`/monetization/crm/notes/${advertiserId}`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'सीआरएम नोट जोड़ने में त्रुटि।');
    },

    async getCrmProposals(advertiserId?: string): Promise<CrmProposalItem[]> {
      const q = advertiserId ? `?advertiserId=${advertiserId}` : '';
      const res = await request<{ proposals: CrmProposalItem[]; total: number }>(`/monetization/crm/proposals${q}`);
      return res.success && res.data?.proposals ? res.data.proposals : [];
    },

    async createCrmProposal(dto: any): Promise<CrmProposalItem> {
      const res = await request<CrmProposalItem>('/monetization/crm/proposals', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'प्रस्ताव सृजन विफल।');
    },

    async listInvoices(status?: string): Promise<InvoiceItem[]> {
      const q = status ? `?status=${status}` : '';
      const res = await request<{ invoices: InvoiceItem[]; total: number }>(`/monetization/invoices${q}`);
      return res.success && res.data?.invoices ? res.data.invoices : [];
    },

    async createInvoice(dto: any): Promise<InvoiceItem> {
      const res = await request<InvoiceItem>('/monetization/invoices', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'चालान सृजन विफल।');
    },

    async markInvoicePaid(invoiceId: string, transactionId?: string): Promise<InvoiceItem> {
      const res = await request<InvoiceItem>(`/monetization/invoices/${invoiceId}/mark-paid`, {
        method: 'POST',
        body: JSON.stringify({ transactionId }),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'चालान भुगतान दर्ज करने में त्रुटि।');
    },

    async getTaxConfig(): Promise<TaxConfigItem> {
      const res = await request<TaxConfigItem>('/monetization/tax-config');
      return res.success && res.data ? res.data : { sacCode: '998363', gstRatePercent: 18, cgstRatePercent: 9, sgstRatePercent: 9, igstRatePercent: 18, homeStateCode: '23', homeStateName: 'Madhya Pradesh' };
    },

    async updateTaxConfig(dto: Partial<TaxConfigItem>): Promise<TaxConfigItem> {
      const res = await request<TaxConfigItem>('/monetization/tax-config', {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'कर विन्यास अद्यतन विफल।');
    },
  },

  audience: {
    async getDashboardOverview(timeRange = '7d'): Promise<AudienceOverviewSummary> {
      const res = await request<AudienceOverviewSummary>(`/audience/dashboard?timeRange=${timeRange}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'दर्शक विश्लेषण सारांश प्राप्त करने में त्रुटि।');
    },

    async getContentPerformance(timeRange = '7d', filters?: { category?: string; district?: string }): Promise<ContentPerformanceSummary> {
      const params = new URLSearchParams({ timeRange });
      if (filters?.category) params.set('category', filters.category);
      if (filters?.district) params.set('district', filters.district);
      const res = await request<ContentPerformanceSummary>(`/audience/analytics/content?${params.toString()}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'सामग्री प्रदर्शन विश्लेषण प्राप्त करने में त्रुटि।');
    },

    async getSegments(): Promise<AudienceSegmentRecord[]> {
      const res = await request<AudienceSegmentRecord[]>('/audience/segments');
      return res.success && res.data ? res.data : [];
    },

    async createSegment(dto: Partial<AudienceSegmentRecord>): Promise<AudienceSegmentRecord> {
      const res = await request<AudienceSegmentRecord>('/audience/segments', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'दर्शक वर्ग निर्माण विफल।');
    },

    async previewSegment(criteria: Record<string, any>): Promise<any> {
      const res = await request<any>('/audience/segments/preview', {
        method: 'POST',
        body: JSON.stringify({ criteria }),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'दर्शक वर्ग पूर्वावलोकन विफल।');
    },

    async getUserPreferences(): Promise<UserPreferences> {
      const res = await request<UserPreferences>('/audience/preferences');
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'प्राथमिकताएं प्राप्त करने में त्रुटि।');
    },

    async updateUserPreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
      const res = await request<UserPreferences>('/audience/preferences', {
        method: 'PATCH',
        body: JSON.stringify(prefs),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'प्राथमिकताएं अद्यतित करने में त्रुटि।');
    },

    async resetPersonalization(): Promise<UserPreferences> {
      const res = await request<UserPreferences>('/audience/preferences/reset', {
        method: 'POST',
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'वैयक्तिकरण रीसेट विफल।');
    },

    async exportPrivacyData(): Promise<any> {
      const res = await request<any>('/audience/privacy/export');
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'डेटा निर्यात विफल।');
    },

    async requestAccountDeletion(reason = 'Reader request'): Promise<any> {
      const res = await request<any>('/audience/privacy/delete-request', {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'खाता विलोपन अनुरोध विफल।');
    },

    async getPersonalizedFeed(options: { mode?: string; limit?: number; page?: number; district?: string; category?: string } = {}): Promise<any> {
      const params = new URLSearchParams();
      if (options.mode) params.set('mode', options.mode);
      if (options.limit) params.set('limit', String(options.limit));
      if (options.page) params.set('page', String(options.page));
      if (options.district) params.set('district', options.district);
      if (options.category) params.set('category', options.category);
      const res = await request<any>(`/audience/feed/personalized?${params.toString()}`);
      return res.success && res.data ? res.data : { feed: [], total: 0 };
    },

    async getBookmarks(): Promise<BookmarkRecord[]> {
      const res = await request<BookmarkRecord[]>('/audience/bookmarks');
      return res.success && res.data ? res.data : [];
    },

    async addBookmark(articleId: string): Promise<BookmarkRecord> {
      const res = await request<BookmarkRecord>('/audience/bookmarks', {
        method: 'POST',
        body: JSON.stringify({ articleId }),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'बुकमार्क सहेजने में त्रुटि।');
    },

    async removeBookmark(articleId: string): Promise<any> {
      const res = await request<any>(`/audience/bookmarks/${articleId}`, {
        method: 'DELETE',
      });
      return res.success;
    },

    async getReadingHistory(limit = 50): Promise<ReadingHistoryRecord[]> {
      const res = await request<ReadingHistoryRecord[]>(`/audience/history?limit=${limit}`);
      return res.success && res.data ? res.data : [];
    },

    async recordReadingHistory(payload: { articleId: string; dwellTimeSeconds?: number; scrollDepthPercent?: number; articleTitle?: string; districtName?: string; category?: string }): Promise<any> {
      const res = await request<any>('/audience/history', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.success ? res.data : null;
    },

    async clearReadingHistory(): Promise<boolean> {
      const res = await request<{ success: boolean }>('/audience/history', {
        method: 'DELETE',
      });
      return Boolean(res.success && res.data?.success);
    },

    async getFollowedTopics(): Promise<any[]> {
      const res = await request<any[]>('/audience/follows/topics');
      return res.success && res.data ? res.data : [];
    },

    async followTopic(topic: string): Promise<any> {
      const res = await request<any>('/audience/follows/topics', {
        method: 'POST',
        body: JSON.stringify({ topic }),
      });
      return res.success ? res.data : null;
    },

    async unfollowTopic(topic: string): Promise<boolean> {
      const res = await request<{ success: boolean }>(`/audience/follows/topics/${encodeURIComponent(topic)}`, {
        method: 'DELETE',
      });
      return Boolean(res.success && res.data?.success);
    },

    async getFollowedDistricts(): Promise<any[]> {
      const res = await request<any[]>('/audience/follows/districts');
      return res.success && res.data ? res.data : [];
    },

    async followDistrict(district: string): Promise<any> {
      const res = await request<any>('/audience/follows/districts', {
        method: 'POST',
        body: JSON.stringify({ district }),
      });
      return res.success ? res.data : null;
    },

    async unfollowDistrict(district: string): Promise<boolean> {
      const res = await request<{ success: boolean }>(`/audience/follows/districts/${encodeURIComponent(district)}`, {
        method: 'DELETE',
      });
      return Boolean(res.success && res.data?.success);
    },

    async getNotifications(unreadOnly = false): Promise<{ notifications: NotificationRecord[]; unreadCount: number; total: number }> {
      const res = await request<{ notifications: NotificationRecord[]; unreadCount: number; total: number }>(`/audience/notifications?unreadOnly=${unreadOnly}`);
      return res.success && res.data ? res.data : { notifications: [], unreadCount: 0, total: 0 };
    },

    async markNotificationRead(id: string): Promise<boolean> {
      const res = await request<any>(`/audience/notifications/${id}/read`, {
        method: 'PATCH',
      });
      return Boolean(res.success);
    },

    async markAllNotificationsRead(): Promise<any> {
      const res = await request<any>('/audience/notifications/read-all', {
        method: 'POST',
      });
      return res.success ? res.data : null;
    },

    async broadcastNotification(payload: { title: string; message: string; type?: string; priority?: string; district?: string }): Promise<any> {
      const res = await request<any>('/audience/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'अधिसूचना प्रसारण विफल।');
    },

    async submitFeedback(payload: { category: string; comments: string; articleId?: string; suggestedCorrection?: string; contactEmail?: string }): Promise<ReaderFeedbackRecord> {
      const res = await request<ReaderFeedbackRecord>('/audience/feedback', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'फीडबैक प्रेषण विफल।');
    },

    async getFeedbackList(filters?: { status?: string; category?: string }): Promise<ReaderFeedbackRecord[]> {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.category) params.set('category', filters.category);
      const res = await request<ReaderFeedbackRecord[]>(`/audience/feedback?${params.toString()}`);
      return res.success && res.data ? res.data : [];
    },

    async updateFeedbackStatus(id: string, status: string, resolutionNotes?: string): Promise<ReaderFeedbackRecord> {
      const res = await request<ReaderFeedbackRecord>(`/audience/feedback/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, resolutionNotes }),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'फीडबैक स्थिति अद्यतन विफल।');
    },

    async getComments(articleId: string): Promise<CommentRecord[]> {
      const res = await request<CommentRecord[]>(`/comments/article/${articleId}`);
      return res.success && res.data ? res.data : [];
    },

    async addComment(articleId: string, content: string, parentCommentId?: string): Promise<CommentRecord> {
      const res = await request<CommentRecord>(`/comments/article/${articleId}`, {
        method: 'POST',
        body: JSON.stringify({ content, parentCommentId }),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'टिप्पणी सबमिशन विफल।');
    },

    async reportComment(commentId: string, reason: string): Promise<any> {
      const res = await request<any>(`/comments/${commentId}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      return res.success ? res.data : null;
    },

    async moderateComment(commentId: string, action: 'approve' | 'reject' | 'delete', reason?: string): Promise<CommentRecord> {
      const res = await request<CommentRecord>(`/comments/${commentId}/moderate`, {
        method: 'PATCH',
        body: JSON.stringify({ action, reason }),
      });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message || 'टिप्पणी समीक्षा विफल।');
    },

    async search(query: string, filters?: { category?: string; district?: string; page?: number; limit?: number }): Promise<any> {
      const params = new URLSearchParams({ q: query });
      if (filters?.category) params.set('category', filters.category);
      if (filters?.district) params.set('district', filters.district);
      if (filters?.page) params.set('page', String(filters.page));
      if (filters?.limit) params.set('limit', String(filters.limit));
      const res = await request<any>(`/discovery/search?${params.toString()}`);
      return res.success && res.data ? res.data : { results: [], total: 0 };
    },

    async getTrendingTerms(): Promise<{ terms: string[]; region: string; updatedAt: string }> {
      const res = await request<any>('/discovery/trending-terms');
      return res.success && res.data ? res.data : { terms: [], region: 'Madhya Pradesh', updatedAt: new Date().toISOString() };
    },

    async getRelatedStories(articleId: string, limit = 5): Promise<any[]> {
      const res = await request<any[]>(`/discovery/related/${articleId}?limit=${limit}`);
      return res.success && res.data ? res.data : [];
    },

    async trackTelemetry(eventName: string, data: Record<string, any> = {}): Promise<any> {
      const res = await request<any>('/audience/telemetry', {
        method: 'POST',
        body: JSON.stringify({ eventName, ...data }),
      });
      return res.success ? res.data : null;
    },
  },

  // 17. E-Paper Management System Domain (/api/v1/epaper/*)
  epaper: {
    async getEditions(filters?: EpaperEditionsFilter): Promise<EpaperEditionsResponse> {
      const queryParams = new URLSearchParams();
      if (filters?.date) queryParams.set('date', filters.date);
      if (filters?.publicationDate) queryParams.set('publicationDate', filters.publicationDate);
      if (filters?.status && filters.status !== 'all') queryParams.set('status', filters.status);
      if (filters?.divisionId && filters.divisionId !== 'all') queryParams.set('divisionId', filters.divisionId);
      if (filters?.districtId && filters.districtId !== 'all') queryParams.set('districtId', filters.districtId);
      if (filters?.editionType && filters.editionType !== 'all') queryParams.set('editionType', filters.editionType);
      if (filters?.search) queryParams.set('search', filters.search);
      if (filters?.page) queryParams.set('page', String(filters.page));
      if (filters?.limit) queryParams.set('limit', String(filters.limit));

      const endpoint = `/epaper/editions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const res = await request<EpaperEditionsResponse>(endpoint);
      if (res.success && res.data) {
        return res.data;
      }
      return {
        editions: [],
        items: [],
        total: 0,
        count: 0,
        page: filters?.page || 1,
        limit: filters?.limit || 20,
        totalPages: 1,
      };
    },

    async getEditionById(id: string, version?: number | string): Promise<EpaperEditionDoc | null> {
      const q = version !== undefined ? `?version=${encodeURIComponent(String(version))}` : '';
      const res = await request<EpaperEditionDoc>(`/epaper/editions/${encodeURIComponent(id)}${q}`);
      return res.success && res.data ? res.data : null;
    },

    async getLatestEdition(districtId?: string, editionType?: string): Promise<EpaperEditionDoc | null> {
      const q = new URLSearchParams();
      if (districtId) q.set('districtId', districtId);
      if (editionType && editionType !== 'all') q.set('editionType', editionType);
      const endpoint = `/epaper/latest${q.toString() ? `?${q.toString()}` : ''}`;
      const res = await request<EpaperEditionDoc>(endpoint);
      return res.success && res.data ? res.data : null;
    },

    async createEdition(payload: CreateEditionPayload): Promise<{ edition: EpaperEditionDoc; pages: EpaperPageDoc[] }> {
      const res = await request<{ edition: EpaperEditionDoc; pages: EpaperPageDoc[] }>('/epaper/editions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.success) {
        const err = new Error(res.error?.message || 'ई-पेपर संस्करण निर्माण विफल रहा');
        (err as any).code = res.error?.code;
        throw err;
      }
      return res.data;
    },

    async updateEdition(id: string, updates: Partial<EpaperEditionDoc> & { version: number }): Promise<EpaperEditionDoc> {
      const res = await request<EpaperEditionDoc>(`/epaper/editions/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      if (!res.success) {
        const err = new Error(res.error?.message || 'ई-पेपर संस्करण संशोधन विफल रहा');
        (err as any).code = res.error?.code;
        (err as any).statusCode = res.error?.code === 'ERR_CONCURRENCY_CONFLICT' ? 409 : 500;
        (err as any).details = res.error?.details;
        throw err;
      }
      return res.data;
    },

    async updateEditionStatus(id: string, status: EpaperEditionStatus, version: number, remarks?: string): Promise<EpaperEditionDoc> {
      const res = await request<EpaperEditionDoc>(`/epaper/editions/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, version, remarks }),
      });
      if (!res.success) {
        const err = new Error(res.error?.message || 'स्थिति अद्यतन विफल रहा');
        (err as any).code = res.error?.code;
        (err as any).statusCode = res.error?.code === 'ERR_CONCURRENCY_CONFLICT' ? 409 : 500;
        (err as any).details = res.error?.details;
        throw err;
      }
      return res.data;
    },

    async deleteEdition(id: string): Promise<{ deleted: boolean; id: string }> {
      const res = await request<{ deleted: boolean; id: string }>(`/epaper/editions/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.success) {
        const err = new Error(res.error?.message || 'संस्करण हटाना विफल रहा');
        (err as any).code = res.error?.code;
        throw err;
      }
      return res.data;
    },

    async getEditionPages(editionId: string, version?: number | string): Promise<EpaperPageDoc[]> {
      const q = version !== undefined ? `?version=${encodeURIComponent(String(version))}` : '';
      const res = await request<EpaperPageDoc[]>(`/epaper/editions/${encodeURIComponent(editionId)}/pages${q}`);
      return res.success && Array.isArray(res.data) ? res.data : [];
    },

    async getPageById(id: string): Promise<EpaperPageDoc | null> {
      const res = await request<EpaperPageDoc>(`/epaper/pages/${encodeURIComponent(id)}`);
      return res.success && res.data ? res.data : null;
    },

    async updatePage(id: string, updates: Partial<EpaperPageDoc> & { version: number }): Promise<EpaperPageDoc> {
      const res = await request<EpaperPageDoc>(`/epaper/pages/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      if (!res.success) {
        const err = new Error(res.error?.message || 'पृष्ठ संशोधन विफल रहा');
        (err as any).code = res.error?.code;
        (err as any).statusCode = res.error?.code === 'ERR_CONCURRENCY_CONFLICT' ? 409 : 500;
        (err as any).details = res.error?.details;
        throw err;
      }
      return res.data;
    },

    async checkArticlePlacement(editionId: string, articleId: string): Promise<EpaperCheckArticlePlacementResponse> {
      const res = await request<EpaperCheckArticlePlacementResponse>(`/epaper/editions/${encodeURIComponent(editionId)}/check-article/${encodeURIComponent(articleId)}`);
      if (res.success && res.data) {
        return res.data;
      }
      return { placed: false, pageNumber: null, pageId: null, elementId: null, articleId };
    },

    async getEligibleArticles(params?: {
      search?: string;
      districtId?: string;
      district?: string;
      constituency?: string;
      categoryId?: string;
      category?: string;
      reporterId?: string;
      reporter?: string;
      date?: string;
      dateFrom?: string;
      dateTo?: string;
      priority?: string;
      approvalStatus?: string;
      hasImage?: boolean | string;
      length?: 'SHORT' | 'MEDIUM' | 'LONG' | string;
      sort?: 'latest' | 'priority' | 'relevance';
      page?: number;
      limit?: number;
    }): Promise<{ items: ArticleDetail[]; articles: ArticleDetail[]; total: number; page: number; limit: number; totalPages: number }> {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            queryParams.set(k, String(v));
          }
        });
      }
      const endpoint = `/epaper/eligible-articles${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const res = await request<{ items: ArticleDetail[]; articles: ArticleDetail[]; total: number; page: number; limit: number; totalPages: number }>(endpoint);
      if (res.success && res.data) {
        return res.data;
      }
      return { items: [], articles: [], total: 0, page: 1, limit: 20, totalPages: 1 };
    },

    async updateArticleWorkflowStatus(articleId: string, payload: {
      targetStatus: string;
      remarks?: string;
      editionId?: string;
      pageNumber?: number;
    }): Promise<any> {
      const res = await request<any>(`/epaper/articles/${encodeURIComponent(articleId)}/workflow-status`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.success) {
        const err = new Error(res.error?.message || 'कार्यप्रवाह स्थिति अद्यतन विफल रहा');
        (err as any).code = res.error?.code;
        (err as any).statusCode = res.error?.code === 'ERR_FORBIDDEN' ? 403 : 400;
        throw err;
      }
      return res.data;
    },

    async assignArticlesToPage(editionId: string, payload: {
      pageNumber: number;
      articleIds: string[];
      editorCredit?: string;
      colSpan?: number;
      role?: string;
      forceDuplicate?: boolean;
    }): Promise<any> {
      const res = await request<any>(`/epaper/editions/${encodeURIComponent(editionId)}/assign-articles`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.success) {
        const err = new Error(res.error?.message || 'समाचार पृष्ठ पर असाइन करना विफल रहा');
        (err as any).code = res.error?.code;
        (err as any).details = res.error?.details;
        throw err;
      }
      return res.data;
    },

    async removeArticleFromPage(editionId: string, pageNumber: number, articleId: string): Promise<any> {
      const res = await request<any>(`/epaper/editions/${encodeURIComponent(editionId)}/pages/${pageNumber}/articles/${encodeURIComponent(articleId)}`, {
        method: 'DELETE',
      });
      if (!res.success) {
        const err = new Error(res.error?.message || 'समाचार पृष्ठ से हटाना विफल रहा');
        (err as any).code = res.error?.code;
        throw err;
      }
      return res.data;
    },

    async getStaffCredits(): Promise<Array<{ id: string; fullName: string; email: string; role: string; badgeNumber?: string | null }>> {
      const res = await request<Array<{ id: string; fullName: string; email: string; role: string; badgeNumber?: string | null }>>('/epaper/staff-credits');
      return res.success && Array.isArray(res.data) ? res.data : [];
    },

    async getTemplates(params?: { category?: string; status?: string; search?: string; gridColumns?: number }): Promise<EpaperTemplateDoc[]> {
      const queryParams = new URLSearchParams();
      if (params?.category) queryParams.set('category', params.category);
      if (params?.status) queryParams.set('status', params.status);
      if (params?.search) queryParams.set('search', params.search);
      if (params?.gridColumns) queryParams.set('gridColumns', String(params.gridColumns));
      const res = await request<EpaperTemplateDoc[]>(`/epaper/templates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
      return res.success && Array.isArray(res.data) ? res.data : [];
    },

    async getTemplateById(id: string): Promise<EpaperTemplateDoc | null> {
      const res = await request<EpaperTemplateDoc>(`/epaper/templates/${encodeURIComponent(id)}`);
      return res.success && res.data ? res.data : null;
    },

    async validateTemplate(templateData: Partial<EpaperTemplateDoc>): Promise<EpaperTemplateValidationResult> {
      const res = await request<EpaperTemplateValidationResult>('/epaper/templates/validate', {
        method: 'POST',
        body: JSON.stringify(templateData),
      });
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'टेम्पलेट सत्यापन विफल रहा');
      }
      return res.data;
    },

    async duplicateTemplate(id: string, name?: string): Promise<EpaperTemplateDoc> {
      const res = await request<EpaperTemplateDoc>(`/epaper/templates/${encodeURIComponent(id)}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'टेम्पलेट क्लोन करना विफल रहा');
      }
      return res.data;
    },

    async publishTemplate(id: string): Promise<EpaperTemplateDoc> {
      const res = await request<EpaperTemplateDoc>(`/epaper/templates/${encodeURIComponent(id)}/publish`, {
        method: 'POST',
      });
      if (!res.success || !res.data) {
        const err = new Error(res.error?.message || 'टेम्पलेट प्रकाशित करना विफल रहा');
        (err as any).code = res.error?.code;
        throw err;
      }
      return res.data;
    },

    async archiveTemplate(id: string): Promise<EpaperTemplateDoc> {
      const res = await request<EpaperTemplateDoc>(`/epaper/templates/${encodeURIComponent(id)}/archive`, {
        method: 'POST',
      });
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'टेम्पलेट अभिलेखागार में भेजना विफल रहा');
      }
      return res.data;
    },

    async restoreTemplate(id: string): Promise<EpaperTemplateDoc> {
      const res = await request<EpaperTemplateDoc>(`/epaper/templates/${encodeURIComponent(id)}/restore`, {
        method: 'POST',
      });
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'टेम्पलेट पुनर्स्थापित करना विफल रहा');
      }
      return res.data;
    },

    async rollbackTemplate(id: string, targetVersion: number): Promise<EpaperTemplateDoc> {
      const res = await request<EpaperTemplateDoc>(`/epaper/templates/${encodeURIComponent(id)}/rollback`, {
        method: 'POST',
        body: JSON.stringify({ targetVersion }),
      });
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'टेम्पलेट संस्करण रोलबैक विफल रहा');
      }
      return res.data;
    },

    async getTemplateVersions(id: string): Promise<EpaperTemplateVersionHistory[]> {
      const res = await request<EpaperTemplateVersionHistory[]>(`/epaper/templates/${encodeURIComponent(id)}/versions`);
      return res.success && Array.isArray(res.data) ? res.data : [];
    },

    async getTemplateUsage(id: string): Promise<{ templateId: string; totalEditions: number; editions: Array<{ editionId: string; editionTitle: string; pageNumber: number }> }> {
      const res = await request<{ templateId: string; totalEditions: number; editions: Array<{ editionId: string; editionTitle: string; pageNumber: number }> }>(`/epaper/templates/${encodeURIComponent(id)}/usage`);
      if (res.success && res.data) {
        return res.data;
      }
      return { templateId: id, totalEditions: 0, editions: [] };
    },

    async generateWhatsAppCard(payload: { editionId?: string; format: '1:1' | '4:5'; headline: string; body: string; imageUrl?: string; articleId?: string }): Promise<EpaperWhatsAppGenerationDoc> {
      const res = await request<EpaperWhatsAppGenerationDoc>('/epaper/whatsapp/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.success) {
        const err = new Error(res.error?.message || 'व्हाट्सएप कार्ड निर्माण विफल रहा');
        (err as any).code = res.error?.code;
        throw err;
      }
      return res.data;
    },

    async getWhatsAppGenerations(params?: { editionId?: string; format?: string; date?: string }): Promise<EpaperWhatsAppGenerationDoc[]> {
      const queryParams = new URLSearchParams();
      if (params?.editionId) queryParams.set('editionId', params.editionId);
      if (params?.format) queryParams.set('format', params.format);
      if (params?.date) queryParams.set('date', params.date);
      const res = await request<EpaperWhatsAppGenerationDoc[]>(`/epaper/whatsapp/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
      return res.success && Array.isArray(res.data) ? res.data : [];
    },

    async getWhatsAppQuota(date?: string): Promise<EpaperWhatsAppQuotaResponse> {
      const queryParams = new URLSearchParams();
      if (date) queryParams.set('date', date);
      const res = await request<EpaperWhatsAppQuotaResponse>(`/epaper/whatsapp/quota${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
      if (res.success && res.data) {
        return res.data;
      }
      return { reporterId: '', date: date || new Date().toISOString().split('T')[0], used: 0, maxDaily: 20, remaining: 20, quotaExceeded: false };
    },

    async getReporterWhatsAppQuota(reporterId: string, date?: string): Promise<EpaperWhatsAppQuotaResponse> {
      const queryParams = new URLSearchParams();
      if (date) queryParams.set('date', date);
      const res = await request<EpaperWhatsAppQuotaResponse>(`/epaper/whatsapp/quota/${encodeURIComponent(reporterId)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
      if (res.success && res.data) {
        return res.data;
      }
      return { reporterId, date: date || new Date().toISOString().split('T')[0], used: 0, maxDaily: 20, remaining: 20, quotaExceeded: false };
    },

    async updateReporterWhatsAppQuota(reporterId: string, maxDaily: number): Promise<{ reporterId: string; maxDaily: number; timezone: string; updatedAt: string }> {
      const res = await request<{ reporterId: string; maxDaily: number; timezone: string; updatedAt: string }>(`/epaper/whatsapp/quota/${encodeURIComponent(reporterId)}`, {
        method: 'PUT',
        body: JSON.stringify({ maxDaily }),
      });
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'व्हाट्सएप कोटा अपडेट करने में विफल');
      }
      return res.data;
    },

    async getWhatsAppEligibleArticles(params?: { search?: string; district?: string; category?: string; reporterId?: string }): Promise<{ items: WhatsAppEligibleArticleItem[]; total: number }> {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.district) q.set('district', params.district);
      if (params?.category) q.set('category', params.category);
      if (params?.reporterId) q.set('reporterId', params.reporterId);
      const res = await request<WhatsAppEligibleArticleItem[]>(`/epaper/whatsapp/eligible-articles${q.toString() ? `?${q.toString()}` : ''}`);
      return {
        items: res.success && Array.isArray(res.data) ? res.data : [],
        total: (res as any).total || (res.success && Array.isArray(res.data) ? res.data.length : 0),
      };
    },

    async generateWhatsAppEdition(payload: GenerateWhatsAppEditionRequest): Promise<EpaperWhatsAppEditionPackageDoc> {
      const res = await request<EpaperWhatsAppEditionPackageDoc>('/epaper/whatsapp/edition/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.success || !res.data) {
        const err = new Error(res.error?.message || 'व्हाट्सएप एडिशन पैकेज निर्माण विफल रहा');
        (err as any).code = res.error?.code;
        throw err;
      }
      return res.data;
    },

    async getWhatsAppEditionPackages(params?: { reporterId?: string; format?: string }): Promise<EpaperWhatsAppEditionPackageDoc[]> {
      const q = new URLSearchParams();
      if (params?.reporterId) q.set('reporterId', params.reporterId);
      if (params?.format) q.set('format', params.format);
      const res = await request<EpaperWhatsAppEditionPackageDoc[]>(`/epaper/whatsapp/editions${q.toString() ? `?${q.toString()}` : ''}`);
      return res.success && Array.isArray(res.data) ? res.data : [];
    },

    async getWhatsAppEditionPackageById(packageId: string): Promise<EpaperWhatsAppEditionPackageDoc> {
      const res = await request<EpaperWhatsAppEditionPackageDoc>(`/epaper/whatsapp/edition/${encodeURIComponent(packageId)}`);
      if (!res.success || !res.data) {
        const err = new Error(res.error?.message || 'व्हाट्सएप एडिशन पैकेज नहीं मिला');
        (err as any).code = res.error?.code;
        throw err;
      }
      return res.data;
    },

    async regenerateWhatsAppCard(payload: RegenerateWhatsAppCardRequest): Promise<{ card: EpaperWhatsAppEditionCardItem; package: EpaperWhatsAppEditionPackageDoc }> {
      const res = await request<{ card: EpaperWhatsAppEditionCardItem; package: EpaperWhatsAppEditionPackageDoc }>('/epaper/whatsapp/card/regenerate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.success || !res.data) {
        const err = new Error(res.error?.message || 'व्हाट्सएप कार्ड पुनः निर्माण विफल रहा');
        (err as any).code = res.error?.code;
        throw err;
      }
      return res.data;
    },

    async analyzeTemplateLayout(payload: { elements?: EpaperPageElement[]; pageId?: string; gridColumns?: number }): Promise<TemplateAnalysisResult> {
      const res = await request<TemplateAnalysisResult>('/epaper/templates/analyze', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'टेम्पलेट विश्लेषण विफल रहा');
      }
      return res.data;
    },

    async saveTemplate(templateData: Partial<EpaperTemplateDoc>, expectedVersion?: number): Promise<EpaperTemplateDoc> {
      const isNew = !templateData.id;
      const endpoint = isNew ? '/epaper/templates' : `/epaper/templates/${encodeURIComponent(templateData.id!)}`;
      const res = await request<EpaperTemplateDoc>(endpoint, {
        method: isNew ? 'POST' : 'PUT',
        body: JSON.stringify({ ...templateData, expectedVersion }),
      });
      if (!res.success || !res.data) {
        const err = new Error(res.error?.message || 'टेम्पलेट सहेजना विफल रहा');
        (err as any).code = res.error?.code;
        (err as any).statusCode = (res.error as any)?.statusCode;
        throw err;
      }
      return res.data;
    },

    async deleteTemplate(id: string): Promise<boolean> {
      const res = await request<{ deleted: boolean }>(`/epaper/templates/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.success) {
        throw new Error(res.error?.message || 'टेम्पलेट हटाना विफल रहा');
      }
      return true;
    },

    async submitClassifiedAd(payload: Partial<EpaperAdSubmissionDoc>): Promise<EpaperAdSubmissionDoc> {
      const res = await request<EpaperAdSubmissionDoc>('/epaper/ads', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.success || !res.data) {
        const err = new Error(res.error?.message || 'विज्ञापन दर्ज करना विफल रहा');
        (err as any).code = res.error?.code;
        throw err;
      }
      return res.data;
    },

    async submitAd(payload: Partial<EpaperAdSubmissionDoc>): Promise<EpaperAdSubmissionDoc> {
      return this.submitClassifiedAd(payload);
    },

    async getClassifiedSubmissions(params?: {
      status?: string;
      districtId?: string;
      reporterId?: string;
      assignedReporterId?: string;
      slotType?: string;
      category?: string;
      editionId?: string;
      search?: string;
      sponsoredOnly?: boolean;
    }): Promise<EpaperAdSubmissionDoc[]> {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.set('status', params.status);
      if (params?.districtId) queryParams.set('districtId', params.districtId);
      if (params?.reporterId) queryParams.set('reporterId', params.reporterId);
      if (params?.assignedReporterId) queryParams.set('assignedReporterId', params.assignedReporterId);
      if (params?.slotType) queryParams.set('slotType', params.slotType);
      if (params?.category) queryParams.set('category', params.category);
      if (params?.editionId) queryParams.set('editionId', params.editionId);
      if (params?.search) queryParams.set('search', params.search);
      if (params?.sponsoredOnly) queryParams.set('sponsoredOnly', 'true');
      const res = await request<EpaperAdSubmissionDoc[]>(`/epaper/ads${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
      return res.success && Array.isArray(res.data) ? res.data : [];
    },

    async getAds(params?: {
      status?: string;
      districtId?: string;
      reporterId?: string;
      assignedReporterId?: string;
      slotType?: string;
      category?: string;
      editionId?: string;
      search?: string;
      sponsoredOnly?: boolean;
    }): Promise<EpaperAdSubmissionDoc[]> {
      return this.getClassifiedSubmissions(params);
    },

    async getAdById(id: string): Promise<EpaperAdSubmissionDoc> {
      const res = await request<EpaperAdSubmissionDoc>(`/epaper/ads/${encodeURIComponent(id)}`);
      if (!res.success || !res.data) {
        const err = new Error(res.error?.message || 'विज्ञापन नहीं मिला');
        (err as any).code = res.error?.code;
        throw err;
      }
      return res.data;
    },

    async updateAd(id: string, payload: Partial<EpaperAdSubmissionDoc>): Promise<EpaperAdSubmissionDoc> {
      const res = await request<EpaperAdSubmissionDoc>(`/epaper/ads/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (!res.success || !res.data) {
        const err = new Error(res.error?.message || 'विज्ञापन अद्यतन विफल रहा');
        (err as any).code = res.error?.code;
        throw err;
      }
      return res.data;
    },

    async updateAdStatus(id: string, payload: { status: EpaperAdStatus; notes?: string }): Promise<EpaperAdSubmissionDoc> {
      const res = await request<EpaperAdSubmissionDoc>(`/epaper/ads/${encodeURIComponent(id)}/status`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.success || !res.data) {
        const err = new Error(res.error?.message || 'विज्ञापन स्थिति परिवर्तन विफल रहा');
        (err as any).code = res.error?.code;
        throw err;
      }
      return res.data;
    },

    async assignAdToSlot(adId: string, payload: {
      editionId: string;
      pageNumber: number;
      slotDetails?: {
        slotType?: string;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        customBadgeText?: string;
      };
    }): Promise<EpaperAdSubmissionDoc> {
      const res = await request<EpaperAdSubmissionDoc>(`/epaper/ads/${encodeURIComponent(adId)}/assign-slot`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.success || !res.data) {
        const err = new Error(res.error?.message || 'विज्ञापन स्लॉट आवंटन विफल रहा');
        (err as any).code = res.error?.code;
        throw err;
      }
      return res.data;
    },

    async removeAdFromSlot(adId: string, payload: {
      editionId: string;
      pageNumber: number;
    }): Promise<EpaperAdSubmissionDoc> {
      const res = await request<EpaperAdSubmissionDoc>(`/epaper/ads/${encodeURIComponent(adId)}/remove-slot`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.success || !res.data) {
        const err = new Error(res.error?.message || 'विज्ञापन स्लॉट निष्कासन विफल रहा');
        (err as any).code = res.error?.code;
        throw err;
      }
      return res.data;
    },

    async reviewClassifiedSubmission(id: string, payload: { action: 'APPROVE' | 'REJECT'; notes?: string; reviewNotes?: string }): Promise<EpaperAdSubmissionDoc> {
      const res = await request<EpaperAdSubmissionDoc>(`/epaper/ads/${encodeURIComponent(id)}/review`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'विज्ञापन समीक्षा विफल रही');
      }
      return res.data;
    },

    async generateAdCopy(payload: { businessName: string; category?: string; offerDetails?: string }): Promise<{ headline: string; body: string; cta: string; wordCount: number; estimatedPricePaise: number }> {
      const res = await request<{ headline: string; body: string; cta: string; wordCount: number; estimatedPricePaise: number }>('/epaper/ads/generate-copy', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'विज्ञापन कॉपी निर्माण विफल रहा');
      }
      return res.data;
    },

    async generateAiAdStudio(payload: {
      businessName: string;
      category?: string;
      offerDetails?: string;
      targetAudience?: string;
      contactInfo?: string;
      tone?: string;
      language?: string;
    }): Promise<EpaperAiAdCreative> {
      const res = await request<EpaperAiAdCreative>('/epaper/ads/ai-studio/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'AI Ad Studio विज्ञापन निर्माण विफल रहा');
      }
      return res.data;
    },

    async getAdReports(params?: {
      districtId?: string;
      editionId?: string;
      startDate?: string;
      endDate?: string;
    }): Promise<EpaperAdReportSummary> {
      const queryParams = new URLSearchParams();
      if (params?.districtId) queryParams.set('districtId', params.districtId);
      if (params?.editionId) queryParams.set('editionId', params.editionId);
      if (params?.startDate) queryParams.set('startDate', params.startDate);
      if (params?.endDate) queryParams.set('endDate', params.endDate);
      const res = await request<EpaperAdReportSummary>(`/epaper/ads/reports/summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'विज्ञापन रिपोर्ट प्राप्त करना विफल रहा');
      }
      return res.data;
    },

    async getAvailableAdSlots(editionId: string, pageNumber: number): Promise<{
      editionId: string;
      pageNumber: number;
      availableSlots: Array<{
        slotType: string;
        titleHindi: string;
        dimensionsMm: string;
        ratePaise: number;
        rateRupees: number;
        boundsPt: { x: number; y: number; width: number; height: number };
      }>;
      occupiedSlots: Array<{
        adId: string;
        businessName: string;
        slotType: string;
        boundsPt: { x: number; y: number; width: number; height: number };
      }>;
    }> {
      const res = await request<{
        editionId: string;
        pageNumber: number;
        availableSlots: any[];
        occupiedSlots: any[];
      }>(`/epaper/ads/slots/available?editionId=${encodeURIComponent(editionId)}&pageNumber=${pageNumber}`);
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'उपलब्ध विज्ञापन स्लॉट प्राप्त करना विफल रहा');
      }
      return res.data;
    },

    async getRateCards(): Promise<{ rateCards: Record<string, any>; pageMultipliers: Record<string, number>; supportedAspectRatios: string[] }> {
      const res = await request<{ rateCards: Record<string, any>; pageMultipliers: Record<string, number>; supportedAspectRatios: string[] }>('/epaper/ads/rate-cards');
      if (res.success && res.data) {
        return res.data;
      }
      return { rateCards: {}, pageMultipliers: {}, supportedAspectRatios: [] };
    },

    // AI Newsroom Assistants & Permanent Columns (Step 9)
    ai: {
      async autoLayout(payload: {
        elements?: EpaperPageElement[];
        gridColumns?: 3 | 4 | 5 | 6 | 8;
        pageType?: string;
        hasMasthead?: boolean;
        reservedAdSlots?: any[];
      }): Promise<{ success: boolean; elements: EpaperPageElement[]; gridColumns: number; stats: any; metadata: any }> {
        const res = await request<any>('/epaper/ai/auto-layout', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.success || !res.data) {
          throw new Error(res.error?.message || 'ऑटो-लेआउट विफल रहा');
        }
        return res.data;
      },

      async classifyCategory(payload: {
        id?: string;
        articleId?: string;
        title?: string;
        content?: string;
        summary?: string;
        district?: string;
        category?: string;
      }): Promise<{ canonicalSection: string; suggestedPage: number; allowedPages: number[]; confidence: number; reasoning: string; keywordsFound: string[]; metadata: any }> {
        const res = await request<any>('/epaper/ai/classify-category', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.success || !res.data) {
          throw new Error(res.error?.message || 'श्रेणी वर्गीकरण विफल रहा');
        }
        return res.data;
      },

      async generatePermanentColumn(payload: {
        type: 'PANCHANG' | 'EDITORIAL_OPED' | 'MARKET_TICKER' | 'WEATHER' | 'DISTRICT_ROUNDUP' | string;
        date?: string;
        district?: string;
        division?: string;
        author?: string;
        bounds?: any;
      }): Promise<{ type: string; columnTitle: string; author: string; byline: string; bodyText: string; sourceAttribution: string; section: string; element?: any; metadata: any }> {
        const res = await request<any>('/epaper/ai/permanent-columns', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.success || !res.data) {
          throw new Error(res.error?.message || 'स्थायी कॉलम निर्माण विफल रहा');
        }
        return res.data;
      },

      async getPermanentColumnTypes(): Promise<Array<{ type: string; titleHi: string; titleEn: string; defaultSection: string; attribution: string; description: string }>> {
        const res = await request<Array<{ type: string; titleHi: string; titleEn: string; defaultSection: string; attribution: string; description: string }>>('/epaper/ai/permanent-columns/types');
        return res.success && Array.isArray(res.data) ? res.data : [];
      },

      // STEP 9: Full E-Paper AI Newsroom Suite
      async generateHeadlines(payload: {
        title?: string;
        content?: string;
        summary?: string;
        district?: string;
        isBreaking?: boolean;
        articleId?: string;
        provider?: string;
      }): Promise<EpaperAiHeadlineResult> {
        const res = await request<EpaperAiHeadlineResult>('/epaper/ai/headlines', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.success || !res.data) {
          throw new Error(res.error?.message || 'हेडलाइन सुझाव तैयार करने में त्रुटि हुई');
        }
        return res.data;
      },

      async generateSummary(payload: {
        content?: string;
        headline?: string;
        mode?: 'SHORT' | 'DETAILED' | 'BULLETS';
        maxWords?: number;
        district?: string;
        articleId?: string;
        provider?: string;
      }): Promise<EpaperAiSummaryResult> {
        const res = await request<EpaperAiSummaryResult>('/epaper/ai/summarize', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.success || !res.data) {
          throw new Error(res.error?.message || 'सारांश तैयार करने में त्रुटि हुई');
        }
        return res.data;
      },

      async copyEditHindi(payload: {
        content: string;
        tone?: string;
        fixGrammarAndSpelling?: boolean;
        articleId?: string;
        provider?: string;
      }): Promise<EpaperAiCopyEditResult> {
        const res = await request<EpaperAiCopyEditResult>('/epaper/ai/copy-edit', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.success || !res.data) {
          throw new Error(res.error?.message || 'भाषा सुधार में त्रुटि हुई');
        }
        return res.data;
      },

      async analyzeStructure(payload: {
        title?: string;
        content: string;
        articleId?: string;
        provider?: string;
      }): Promise<EpaperAiStructureSuggestion> {
        const res = await request<EpaperAiStructureSuggestion>('/epaper/ai/structure', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.success || !res.data) {
          throw new Error(res.error?.message || 'संरचना विश्लेषण में त्रुटि हुई');
        }
        return res.data;
      },

      async translateContent(payload: {
        content: string;
        sourceLanguage?: string;
        targetLanguage?: string;
        articleId?: string;
        provider?: string;
      }): Promise<EpaperAiTranslationResult> {
        const res = await request<EpaperAiTranslationResult>('/epaper/ai/translate', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.success || !res.data) {
          throw new Error(res.error?.message || 'अनुवाद में त्रुटि हुई');
        }
        return res.data;
      },

      async verifyClaims(payload: {
        headline?: string;
        content?: string;
        district?: string;
        sources?: string[];
        evidenceNotes?: string;
        articleId?: string;
        provider?: string;
      }): Promise<EpaperAiVerificationResult> {
        const res = await request<EpaperAiVerificationResult>('/epaper/ai/verify', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.success || !res.data) {
          throw new Error(res.error?.message || 'तथ्य परीक्षण में त्रुटि हुई');
        }
        return res.data;
      },

      async getDesignSuggestions(payload: {
        pageNumber?: number;
        articles?: any[];
        availableTemplates?: any[];
        currentElements?: any[];
        gridColumns?: number;
      }): Promise<EpaperAiDesignSuggestion> {
        const res = await request<EpaperAiDesignSuggestion>('/epaper/ai/design-suggestions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.success || !res.data) {
          throw new Error(res.error?.message || 'डिज़ाइन सुझाव प्राप्त करने में त्रुटि हुई');
        }
        return res.data;
      },

      async proposeComposition(payload: {
        pageNumber?: number;
        selectedArticles?: any[];
        availableTemplates?: any[];
        reservedAdSlots?: any[];
        templateId?: string;
      }): Promise<EpaperAiCompositionProposal> {
        const res = await request<EpaperAiCompositionProposal>('/epaper/ai/propose-composition', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.success || !res.data) {
          throw new Error(res.error?.message || 'पेज कम्पोज़िशन प्रस्ताव प्राप्त करने में त्रुटि हुई');
        }
        return res.data;
      },

      async getGraphicSuggestions(payload: {
        headline?: string;
        content?: string;
        category?: string;
        district?: string;
        articleId?: string;
        provider?: string;
      }): Promise<EpaperAiGraphicSuggestion> {
        const res = await request<EpaperAiGraphicSuggestion>('/epaper/ai/graphic-suggestions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.success || !res.data) {
          throw new Error(res.error?.message || 'ग्राफिक सुझाव प्राप्त करने में त्रुटि हुई');
        }
        return res.data;
      },

      async applySuggestion(payload: EpaperAiApplySuggestionInput): Promise<EpaperAiApplySuggestionResult> {
        const res = await request<EpaperAiApplySuggestionResult>('/epaper/ai/apply-suggestion', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.success || !res.data) {
          throw new Error(res.error?.message || 'सुझाव लागू करने में त्रुटि हुई');
        }
        return res.data;
      },

      async getHistory(): Promise<{ history: EpaperAiNewsroomHistoryItem[]; count: number }> {
        const res = await request<{ history: EpaperAiNewsroomHistoryItem[]; count: number }>('/epaper/ai/history');
        return res.success && res.data ? res.data : { history: [], count: 0 };
      },

      async getUsage(): Promise<any> {
        const res = await request<any>('/epaper/ai/usage');
        return res.success && res.data ? res.data : { todayRequests: 0, dailyLimit: 50, remainingRequests: 50 };
      },
    },

    autoLayout(payload: any) {
      return this.ai.autoLayout(payload);
    },
    classifyCategory(payload: any) {
      return this.ai.classifyCategory(payload);
    },
    generatePermanentColumn(payload: any) {
      return this.ai.generatePermanentColumn(payload);
    },
    getPermanentColumnTypes() {
      return this.ai.getPermanentColumnTypes();
    },

    async preflightEdition(editionId: string): Promise<PreflightScanResult> {
      const res = await request<PreflightScanResult>(`/epaper/editions/${encodeURIComponent(editionId)}/preflight`, {
        method: 'POST',
      });
      if (res.success && res.data) {
        return res.data;
      }
      const errMsg = typeof res.error === 'string' ? res.error : (res.error as any)?.message || 'स्कैन विफल रहा';
      return {
        canPublish: false,
        blockerCount: 1,
        errorCount: 0,
        warningCount: 0,
        blockers: [{ code: 'ERR_SCAN_FAILED', severity: 'BLOCKER', pageNumber: 1, message: errMsg }],
        errors: [],
        warnings: [],
        scannedAt: new Date().toISOString(),
      };
    },

    async publishEdition(editionId: string, version?: number): Promise<{ edition: EpaperEditionDoc; snapshot: EpaperEditionVersionDoc }> {
      const res = await request<{ edition?: EpaperEditionDoc; snapshot?: EpaperEditionVersionDoc } | EpaperEditionDoc>(
        `/epaper/editions/${encodeURIComponent(editionId)}/publish`,
        {
          method: 'POST',
          body: JSON.stringify({ version }),
        }
      );
      if (!res.success) {
        const pubErr = typeof res.error === 'string' ? res.error : (res.error as any)?.message || 'प्रकाशन विफल रहा';
        throw new Error(pubErr);
      }
      const data: any = res.data;
      return {
        edition: data?.edition || data,
        snapshot: data?.snapshot || null,
      };
    },

    async getEditionVersions(editionId: string): Promise<EpaperEditionVersionDoc[]> {
      const res = await request<EpaperEditionVersionDoc[]>(`/epaper/editions/${encodeURIComponent(editionId)}/versions`);
      return res.success && Array.isArray(res.data) ? res.data : [];
    },

    async exportPdf(editionId: string, options?: any): Promise<Blob> {
      const headers: Record<string, string> = {
        'Accept': 'application/pdf',
      };
      const token = localStorage.getItem('bnw_auth_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/v1/epaper/editions/${encodeURIComponent(editionId)}/export/pdf`, {
        method: options ? 'POST' : 'GET',
        headers: options ? { ...headers, 'Content-Type': 'application/json' } : headers,
        body: options ? JSON.stringify(options) : undefined,
      });
      if (!response.ok) {
        throw new Error(`PDF Export failed with HTTP ${response.status}`);
      }
      return response.blob();
    },

    async exportPageImage(editionId: string, pageNumber: number, options?: any): Promise<Blob> {
      const headers: Record<string, string> = {
        'Accept': 'image/png',
      };
      const token = localStorage.getItem('bnw_auth_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/v1/epaper/editions/${encodeURIComponent(editionId)}/export/page/${pageNumber}/image`, {
        method: options ? 'POST' : 'GET',
        headers: options ? { ...headers, 'Content-Type': 'application/json' } : headers,
        body: options ? JSON.stringify(options) : undefined,
      });
      if (!response.ok) {
        throw new Error(`Page Image Export failed with HTTP ${response.status}`);
      }
      return response.blob();
    },

    async getExportMetadata(editionId: string): Promise<any> {
      const res = await request<any>(`/epaper/editions/${encodeURIComponent(editionId)}/export/metadata`);
      return res.success ? res.data : null;
    },

    async getArchiveEditions(filters?: {
      year?: string | number;
      month?: string | number;
      date?: string;
      publicationDate?: string;
      districtId?: string;
      editionType?: string;
      search?: string;
      page?: number;
      limit?: number;
    }): Promise<any> {
      const queryParams = new URLSearchParams();
      if (filters?.year && filters.year !== 'all') queryParams.set('year', String(filters.year));
      if (filters?.month && filters.month !== 'all') queryParams.set('month', String(filters.month));
      if (filters?.date) queryParams.set('date', filters.date);
      if (filters?.publicationDate) queryParams.set('publicationDate', filters.publicationDate);
      if (filters?.districtId && filters.districtId !== 'all') queryParams.set('districtId', filters.districtId);
      if (filters?.editionType && filters.editionType !== 'all') queryParams.set('editionType', filters.editionType);
      if (filters?.search) queryParams.set('search', filters.search);
      if (filters?.page) queryParams.set('page', String(filters.page));
      if (filters?.limit) queryParams.set('limit', String(filters.limit));

      const endpoint = `/epaper/archive${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const res = await request<any>(endpoint);
      const list: EpaperEditionDoc[] = Array.isArray(res.data) ? res.data : (res.data?.editions || res.data?.items || []);
      const total = res.data?.total ?? list.length;
      const page = res.data?.page ?? (filters?.page || 1);
      const limit = res.data?.limit ?? (filters?.limit || 24);
      const totalPages = res.data?.totalPages ?? (Math.ceil(total / limit) || 1);

      const result: any = list;
      result.editions = list;
      result.items = list;
      result.total = total;
      result.page = page;
      result.limit = limit;
      result.totalPages = totalPages;
      return result;
    },

    // Step 7: E-Paper Reporter Workspace & Profile Integration
    reporter: {
      async getWorkspaceSummary(reporterId?: string): Promise<EpaperReporterWorkspaceSummary> {
        const endpoint = reporterId
          ? `/epaper/reporter/workspace?reporterId=${encodeURIComponent(reporterId)}`
          : '/epaper/reporter/workspace';
        const res = await request<EpaperReporterWorkspaceSummary>(endpoint);
        if (!res.success || !res.data) {
          const err = new Error(res.error?.message || 'संवाददाता कार्यक्षेत्र लोड करने में विफल।');
          (err as any).code = res.error?.code || 'ERR_WORKSPACE_FAILED';
          throw err;
        }
        return res.data;
      },

      async getContributions(params?: {
        reporterId?: string;
        status?: string;
        districtId?: string;
        categoryId?: string;
        search?: string;
        page?: number;
        limit?: number;
      }): Promise<{ items: EpaperReporterContributionItem[]; total: number; page: number; limit: number; totalPages: number }> {
        const queryParams = new URLSearchParams();
        if (params?.reporterId) queryParams.set('reporterId', params.reporterId);
        if (params?.status && params.status !== 'all') queryParams.set('status', params.status);
        if (params?.districtId && params.districtId !== 'all') queryParams.set('districtId', params.districtId);
        if (params?.categoryId && params.categoryId !== 'all') queryParams.set('categoryId', params.categoryId);
        if (params?.search) queryParams.set('search', params.search);
        if (params?.page) queryParams.set('page', String(params.page));
        if (params?.limit) queryParams.set('limit', String(params.limit));

        const endpoint = `/epaper/reporter/contributions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const res = await request<{ items: EpaperReporterContributionItem[]; total: number; page: number; limit: number; totalPages: number }>(endpoint);
        if (!res.success || !res.data) {
          return { items: [], total: 0, page: 1, limit: 20, totalPages: 1 };
        }
        return res.data;
      },

      async getPublishedStories(params?: {
        reporterId?: string;
        editionId?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
      }): Promise<{ items: EpaperReporterPublishedItem[]; total: number }> {
        const queryParams = new URLSearchParams();
        if (params?.reporterId) queryParams.set('reporterId', params.reporterId);
        if (params?.editionId && params.editionId !== 'all') queryParams.set('editionId', params.editionId);
        if (params?.startDate) queryParams.set('startDate', params.startDate);
        if (params?.endDate) queryParams.set('endDate', params.endDate);
        if (params?.search) queryParams.set('search', params.search);

        const endpoint = `/epaper/reporter/published${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const res = await request<{ items: EpaperReporterPublishedItem[]; total: number }>(endpoint);
        if (!res.success || !res.data) {
          return { items: [], total: 0 };
        }
        return res.data;
      },

      async updateProfile(updates: ReporterProfileUpdateInput, reporterId?: string): Promise<ReporterProfile> {
        const endpoint = reporterId
          ? `/epaper/reporter/profile?reporterId=${encodeURIComponent(reporterId)}`
          : '/epaper/reporter/profile';
        const res = await request<ReporterProfile>(endpoint, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
        if (!res.success || !res.data) {
          const err = new Error(res.error?.message || 'प्रोफाइल अद्यतन विफल रहा।');
          (err as any).code = res.error?.code || 'ERR_PROFILE_UPDATE_FAILED';
          throw err;
        }
        return res.data;
      },

      async getAssignedAds(params?: {
        reporterId?: string;
        status?: string;
        search?: string;
      }): Promise<EpaperAdSubmissionDoc[]> {
        const queryParams = new URLSearchParams();
        if (params?.reporterId) queryParams.set('reporterId', params.reporterId);
        if (params?.status && params.status !== 'all') queryParams.set('status', params.status);
        if (params?.search) queryParams.set('search', params.search);

        const endpoint = `/epaper/reporter/ads${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const res = await request<EpaperAdSubmissionDoc[]>(endpoint);
        return res.success && Array.isArray(res.data) ? res.data : [];
      },

      async getActivityFeed(reporterId?: string): Promise<{ activities: EpaperReporterActivityItem[]; total: number }> {
        const endpoint = reporterId
          ? `/epaper/reporter/activity?reporterId=${encodeURIComponent(reporterId)}`
          : '/epaper/reporter/activity';
        const res = await request<{ activities: EpaperReporterActivityItem[]; total: number }>(endpoint);
        if (!res.success || !res.data) {
          return { activities: [], total: 0 };
        }
        return res.data;
      },
    },

    // Step 10: Authoritative E-Paper Quality Assurance & Controlled Publishing
    quality: {
      async runQualityCheck(editionId: string, skipExportCheck = false): Promise<EpaperQualityCheckReport> {
        const res = await request<EpaperQualityCheckReport>(`/epaper/editions/${encodeURIComponent(editionId)}/quality-check`, {
          method: 'POST',
          body: JSON.stringify({ skipExportCheck }),
        });
        if (!res.success || !res.data) {
          const err = new Error(res.error?.message || 'गुणवत्ता परीक्षण विफल रहा');
          (err as any).code = res.error?.code;
          throw err;
        }
        return res.data;
      },

      async getQualityReport(editionId: string): Promise<EpaperQualityCheckReport> {
        const res = await request<EpaperQualityCheckReport>(`/epaper/editions/${encodeURIComponent(editionId)}/quality-check`);
        if (!res.success || !res.data) {
          const err = new Error(res.error?.message || 'गुणवत्ता रिपोर्ट प्राप्त करना विफल रहा');
          (err as any).code = res.error?.code;
          throw err;
        }
        return res.data;
      },

      async grantException(editionId: string, payload: EpaperGrantExceptionInput): Promise<{ success: boolean; issue: EpaperQualityIssue; updatedReport: EpaperQualityCheckReport }> {
        const res = await request<{ success: boolean; issue: EpaperQualityIssue; updatedReport: EpaperQualityCheckReport }>(`/epaper/editions/${encodeURIComponent(editionId)}/quality/grant-exception`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.success || !res.data) {
          const err = new Error(res.error?.message || 'अपवाद प्रदान करना विफल रहा');
          (err as any).code = res.error?.code;
          (err as any).statusCode = res.error?.code === 'ERR_CRITICAL_CANNOT_BE_BYPASSED' ? 403 : 400;
          throw err;
        }
        return res.data;
      },

      async approveEdition(editionId: string, payload: EpaperFinalApprovalInput): Promise<{ success: boolean; edition: EpaperEditionDoc; qualityReport: EpaperQualityCheckReport }> {
        const res = await request<{ success: boolean; edition: EpaperEditionDoc; qualityReport: EpaperQualityCheckReport }>(`/epaper/editions/${encodeURIComponent(editionId)}/approve`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.success || !res.data) {
          const err = new Error(res.error?.message || 'अंतिम अनुमोदन विफल रहा');
          (err as any).code = res.error?.code;
          (err as any).qualityReport = (res.error as any)?.qualityReport;
          throw err;
        }
        return res.data;
      },

      async scheduleEdition(editionId: string, payload: EpaperSchedulePublishInput): Promise<{ success: boolean; edition: EpaperEditionDoc }> {
        const res = await request<{ success: boolean; edition: EpaperEditionDoc }>(`/epaper/editions/${encodeURIComponent(editionId)}/schedule`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.success || !res.data) {
          const err = new Error(res.error?.message || 'ई-पेपर शेड्यूलिंग विफल रही');
          (err as any).code = res.error?.code;
          throw err;
        }
        return res.data;
      },

      async createCorrection(editionId: string, remarks?: string): Promise<{ success: boolean; edition: EpaperEditionDoc; previousPublishedVersion: number; message: string }> {
        const res = await request<{ success: boolean; edition: EpaperEditionDoc; previousPublishedVersion: number; message: string }>(`/epaper/editions/${encodeURIComponent(editionId)}/correction`, {
          method: 'POST',
          body: JSON.stringify({ remarks }),
        });
        if (!res.success || !res.data) {
          const err = new Error(res.error?.message || 'प्रकाशन उपरांत सुधार आरंभ करना विफल रहा');
          (err as any).code = res.error?.code;
          throw err;
        }
        return res.data;
      },
    },

    // Convenience delegates
    runQualityCheck(editionId: string, skipExportCheck = false) {
      return this.quality.runQualityCheck(editionId, skipExportCheck);
    },
    grantQualityException(editionId: string, payload: EpaperGrantExceptionInput) {
      return this.quality.grantException(editionId, payload);
    },
    approveEdition(editionId: string, payload: EpaperFinalApprovalInput) {
      return this.quality.approveEdition(editionId, payload);
    },
    scheduleEdition(editionId: string, payload: EpaperSchedulePublishInput) {
      return this.quality.scheduleEdition(editionId, payload);
    },
    createEditionCorrection(editionId: string, remarks?: string) {
      return this.quality.createCorrection(editionId, remarks);
    },
  },
};

