/**
 * BREAKING NEWS WALA — Central Reporter API Client
 * Grounded in docs/13-API.md, docs/14-Auth.md, and docs/15-Security.md
 */

import {
  CategoryItem,
  MediaUploadResult,
  ReporterArticle,
  ReporterPerformanceData,
  ReporterUser,
  TerritoryAssignment,
  ArticleReviewRecord,
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:3000/api/v1';

// Token Storage Keys
const ACCESS_TOKEN_KEY = 'bnw_rep_access_token';
const REFRESH_TOKEN_KEY = 'bnw_rep_refresh_token';
const USER_CACHE_KEY = 'bnw_rep_user_cache';

// Concurrency mutex lock for single-flight token refresh
let refreshPromise: Promise<boolean> | null = null;

export function getStoredAccessToken(): string | null {
  if (typeof sessionStorage !== 'undefined') {
    const s = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    if (s) return s;
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return null;
}

export function setStoredTokens(accessToken: string, refreshToken?: string): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  } else if (typeof localStorage !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }
  if (refreshToken && typeof localStorage !== 'undefined') {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
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

export function getStoredUserCache(): ReporterUser | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(USER_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function setStoredUserCache(user: ReporterUser): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  }
}

/**
 * Universal Authenticated HTTP Request Dispatcher
 * Features single-flight concurrency lock for token refresh (DEC-033).
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string; details?: any[] } }> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getStoredAccessToken();

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle FormData vs JSON
  if (!(options.body instanceof FormData) && !headers['Content-Type'] && options.body) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized with single-flight mutex token refresh
    if (response.status === 401) {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
        const refreshed = await refreshAccessTokenSingleFlight(refreshToken);
        if (refreshed) {
          // Retry original request with newly rotated token
          const newToken = getStoredAccessToken();
          if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`;
          }
          const retryRes = await fetch(url, { ...options, headers });
          const retryJson = await retryRes.json();
          if (retryRes.ok) {
            return { success: true, data: retryJson.data as T };
          }
          return {
            success: false,
            error: retryJson.error || { code: 'ERR_API', message: 'अनुरोध विफल रहा।' },
          };
        }
      }
      clearStoredTokens();
      return {
        success: false,
        error: { code: 'ERR_UNAUTHORIZED', message: 'सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।' },
      };
    }

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        error: json?.error || {
          code: `ERR_HTTP_${response.status}`,
          message: 'सर्वर से संपर्क करने में त्रुटि हुई।',
        },
      };
    }

    return { success: true, data: json?.data as T };
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'ERR_NETWORK',
        message: 'इंटरनेट कनेक्शन उपलब्ध नहीं है या सर्वर अनुपलब्ध है।',
      },
    };
  }
}

/**
 * Token Refresh Logic with Single-Flight Concurrency Protection (DEC-033)
 * Guarantees only 1 network request for token refresh regardless of concurrent 401 failures.
 */
export async function refreshAccessTokenSingleFlight(refreshToken: string): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

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
          setStoredTokens(json.data.accessToken, json.data.refreshToken);
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
// AUTHENTICATION APIs
// -------------------------------------------------------------

export async function loginReporter(identifier: string, password: string): Promise<ReporterUser | null> {
  const res = await apiRequest<{ user: ReporterUser; tokens: { accessToken: string; refreshToken?: string } }>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }
  );

  if (res.success && res.data) {
    setStoredTokens(res.data.tokens.accessToken, res.data.tokens.refreshToken);
    setStoredUserCache(res.data.user);
    return res.data.user;
  }

  throw new Error(res.error?.message || 'लॉगिन विफल रहा। कृपया विवरण की जांच करें।');
}

export async function getCurrentReporter(): Promise<ReporterUser | null> {
  const token = getStoredAccessToken();
  if (!token) return null;

  const res = await apiRequest<ReporterUser>('/auth/me');
  if (res.success && res.data) {
    setStoredUserCache(res.data);
    return res.data;
  }
  return null;
}

export async function logoutReporter(): Promise<void> {
  await apiRequest('/auth/logout', { method: 'POST' });
  clearStoredTokens();
}

// -------------------------------------------------------------
// TERRITORY & BEAT APIs
// -------------------------------------------------------------

export async function fetchMyTerritories(): Promise<TerritoryAssignment[]> {
  const res = await apiRequest<{ assignments: TerritoryAssignment[] }>('/territory/my-assignments');
  if (res.success && res.data?.assignments) {
    return res.data.assignments;
  }

  // Graceful fallback to user's home district if explicit beat records aren't set
  const cachedUser = getStoredUserCache();
  if (cachedUser?.homeDistrictId) {
    return [
      {
        districtId: cachedUser.homeDistrictId,
        districtNameHi: cachedUser.homeDistrictId,
        districtSlug: cachedUser.homeDistrictId.toLowerCase(),
        isPrimary: true,
      },
    ];
  }

  return [];
}

// -------------------------------------------------------------
// CATEGORIES & TAXONOMIES APIs
// -------------------------------------------------------------

export async function fetchReporterCategories(): Promise<CategoryItem[]> {
  const res = await apiRequest<CategoryItem[]>('/public/categories');
  if (res.success && res.data && Array.isArray(res.data)) {
    return res.data;
  }

  // Fallback approved categories
  return [
    { id: 'madhya-pradesh', nameHi: 'मध्य प्रदेश', nameEn: 'Madhya Pradesh', slug: 'madhya-pradesh' },
    { id: 'politics', nameHi: 'राजनीति', nameEn: 'Politics', slug: 'politics' },
    { id: 'crime', nameHi: 'क्राइम एवं सुरक्षा', nameEn: 'Crime', slug: 'crime' },
    { id: 'business', nameHi: 'कृषि एवं व्यापार', nameEn: 'Business & Mandi', slug: 'business' },
    { id: 'education', nameHi: 'शिक्षा व युवा', nameEn: 'Education', slug: 'education' },
    { id: 'top-news', nameHi: 'टॉप न्यूज़', nameEn: 'Top News', slug: 'top-news' },
  ];
}

// -------------------------------------------------------------
// ARTICLE LIFECYCLE & DRAFTING APIs (WF-CRE-01, WF-CRE-03)
// -------------------------------------------------------------

export async function createServerDraft(articleData: {
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
}): Promise<ReporterArticle> {
  const res = await apiRequest<ReporterArticle>('/articles/drafts', {
    method: 'POST',
    body: JSON.stringify(articleData),
  });

  if (res.success && res.data) {
    return res.data;
  }
  throw new Error(res.error?.message || 'ड्राफ्ट सहेजने में विफल।');
}

export async function updateServerDraft(
  id: string,
  articleData: Partial<ReporterArticle>
): Promise<ReporterArticle> {
  const res = await apiRequest<ReporterArticle>(`/articles/drafts/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(articleData),
  });

  if (res.success && res.data) {
    return res.data;
  }
  throw new Error(res.error?.message || 'ड्राफ्ट अद्यतन करने में विफल।');
}

export async function getServerDraft(id: string): Promise<ReporterArticle | null> {
  const res = await apiRequest<ReporterArticle>(`/articles/drafts/${encodeURIComponent(id)}`);
  if (res.success && res.data) {
    return res.data;
  }
  return null;
}

export async function fetchMyArticles(statusFilter?: string): Promise<ReporterArticle[]> {
  const query = statusFilter && statusFilter !== 'ALL' ? `?status=${encodeURIComponent(statusFilter.toLowerCase())}` : '';
  const res = await apiRequest<ReporterArticle[]>(`/articles/my-articles${query}`);
  if (res.success && res.data && Array.isArray(res.data)) {
    return res.data;
  }
  return [];
}

export async function submitArticleForReview(id: string): Promise<ReporterArticle> {
  const res = await apiRequest<ReporterArticle>(`/articles/${encodeURIComponent(id)}/submit`, {
    method: 'POST',
  });

  if (res.success && res.data) {
    return res.data;
  }
  throw new Error(res.error?.message || 'समीक्षा के लिए सबमिशन विफल रहा।');
}

export async function directPublishArticle(id: string): Promise<ReporterArticle> {
  const res = await apiRequest<ReporterArticle>(`/articles/${encodeURIComponent(id)}/direct-publish`, {
    method: 'POST',
  });

  if (res.success && res.data) {
    return res.data;
  }
  throw new Error(res.error?.message || 'सीधे प्रकाशित करने की अनुमति नहीं है।');
}

export async function fetchArticleReviews(id: string): Promise<ArticleReviewRecord[]> {
  const res = await apiRequest<ArticleReviewRecord[]>(`/articles/${encodeURIComponent(id)}/reviews`);
  if (res.success && res.data && Array.isArray(res.data)) {
    return res.data;
  }
  return [];
}

// -------------------------------------------------------------
// MEDIA ASSET INGESTION APIs (MED-01, MED-02, DEC-020)
// -------------------------------------------------------------

export async function fileToBase64(file: File | Blob | any): Promise<string> {
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64 || '');
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }
  // Node / test environment fallback
  if (file && typeof file.arrayBuffer === 'function') {
    const ab = await file.arrayBuffer();
    return Buffer.from(ab).toString('base64');
  }
  if (Buffer.isBuffer(file)) {
    return file.toString('base64');
  }
  return '';
}

export async function uploadFieldMedia(file: File, caption?: string, _attribution?: string): Promise<MediaUploadResult> {
  const isVideo = file.type.startsWith('video/');
  const assetType = isVideo ? 'video' : 'image';
  const base64Buffer = await fileToBase64(file);

  const payload = {
    fileName: file.name,
    mimeType: file.type,
    fileBuffer: base64Buffer,
    assetType,
    altTextHi: caption,
  };

  const res = await apiRequest<any>('/media/upload', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (res.success && res.data) {
    const data = res.data;
    return {
      mediaId: data.id || data.mediaId,
      url: data.cdnUrl || data.url,
      mimeType: data.mimeType || file.type,
      fileSizeBytes: typeof data.fileSizeBytes === 'number' ? data.fileSizeBytes : Number(data.fileSizeBytes) || file.size,
    };
  }
  throw new Error(res.error?.message || 'मीडिया अपलोड विफल रहा।');
}

export async function createPresignedUpload(dto: {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  assetType?: 'image' | 'video' | 'audio' | 'document';
}): Promise<{ mediaId: string; uploadUrl: string; cdnUrl: string; storageKey: string }> {
  const res = await apiRequest<{ mediaId: string; uploadUrl: string; cdnUrl: string; storageKey: string }>(
    '/media/presigned-upload',
    {
      method: 'POST',
      body: JSON.stringify(dto),
    }
  );
  if (res.success && res.data) {
    return res.data;
  }
  throw new Error(res.error?.message || 'प्रीसाइन्ड अपलोड टिकट प्राप्त करने में विफल।');
}

export async function confirmUpload(dto: {
  mediaId: string;
  checksumSha256?: string;
  width?: number;
  height?: number;
}): Promise<any> {
  const res = await apiRequest<any>('/media/confirm-upload', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  if (res.success && res.data) {
    return res.data;
  }
  throw new Error(res.error?.message || 'अपलोड पुष्टि विफल रही।');
}

// -------------------------------------------------------------
// REPORTER ANALYTICS (REP-12, DEC-069)
// -------------------------------------------------------------

export async function fetchReporterPerformance(): Promise<ReporterPerformanceData | null> {
  const res = await apiRequest<ReporterPerformanceData>('/reporter/performance');
  if (res.success && res.data) {
    return res.data;
  }
  return null;
}

// -------------------------------------------------------------
// CLIENT-SIDE LOCAL DRAFT RECOVERY MANAGER (WF-CRE-01)
// -------------------------------------------------------------

const LOCAL_DRAFT_KEY_PREFIX = 'bnw_draft_local_';

export function saveLocalDraftSnapshot(draft: {
  localId: string;
  serverId?: string;
  title: string;
  subheadline?: string;
  bodyContent: string;
  primaryCategoryId: string;
  primaryLocationId: string;
  featuredImageUrl?: string;
  imageCaption?: string;
  imageAttribution?: string;
}): void {
  try {
    const payload = {
      ...draft,
      lastSavedAt: new Date().toISOString(),
      isSyncedWithServer: false,
    };
    localStorage.setItem(`${LOCAL_DRAFT_KEY_PREFIX}${draft.localId}`, JSON.stringify(payload));
  } catch {
    // LocalStorage quota handling
  }
}

export function getLocalDraftSnapshot(localId: string): any | null {
  try {
    const raw = localStorage.getItem(`${LOCAL_DRAFT_KEY_PREFIX}${localId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function removeLocalDraftSnapshot(localId: string): void {
  localStorage.removeItem(`${LOCAL_DRAFT_KEY_PREFIX}${localId}`);
}

