/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Centralized Public Web API Client & Data Access Layer
 * Grounded in docs/13-API.md, docs/11-Architecture.md, and docs/06-Business-Rules.md
 */

import {
  ArticleQueryParams,
  BreakingBulletin,
  PaginatedArticles,
  PublicArticle,
  PublicCategory,
  PublicDistrict,
  TrendingArticle,
  PublicEpaperEdition,
} from './types';
import { CANONICAL_CATEGORIES, MP_DIVISIONS_AND_DISTRICTS } from './constants';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000/api/v1';

/**
 * Generic Fetcher with Timeout, Error Handling, and SSR Revalidation
 */
async function fetchApi<T>(endpoint: string, options?: RequestInit & { revalidateSeconds?: number }): Promise<T | null> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const revalidate = options?.revalidateSeconds ?? 60;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4s timeout for SSR resilience

    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      next: { revalidate },
      headers: {
        'Accept': 'application/json',
        ...(options?.headers || {}),
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      if (res.status === 404 || res.status === 403) {
        return null;
      }
      console.warn(`[API Client Warning] HTTP ${res.status} from ${endpoint}`);
      return null;
    }

    const json = await res.json();
    return json.data as T;
  } catch {
    // Graceful offline fallback during build/local environments without backend
    return null;
  }
}

/**
 * Fetches published articles with flexible filters.
 * Strictly enforces that unpublished drafts never appear in public views.
 */
export async function fetchPublishedArticles(params: ArticleQueryParams = {}): Promise<PaginatedArticles> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.categoryId) query.set('categoryId', params.categoryId);
  if (params.locationId) query.set('locationId', params.locationId);
  if (params.isBreaking !== undefined) query.set('isBreaking', params.isBreaking.toString());
  if (params.search) query.set('search', params.search);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  query.set('status', 'published'); // Strict publication invariant

  const endpoint = `/articles?${query.toString()}`;
  const data = await fetchApi<PublicArticle[]>(endpoint, { revalidateSeconds: 30 });

  if (data && Array.isArray(data)) {
    return {
      items: data,
      pagination: {
        page: params.page || 1,
        limit: params.limit || data.length,
        total: data.length,
        totalPages: Math.max(1, Math.ceil(data.length / (params.limit || 10))),
      },
    };
  }

  // Fallback for static builds or offline backend
  return {
    items: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
  };
}

/**
 * Fetches single published article by ID or canonical slug.
 */
export async function fetchArticleBySlugOrId(idOrSlug: string): Promise<PublicArticle | null> {
  if (!idOrSlug) return null;
  const article = await fetchApi<PublicArticle>(`/articles/${encodeURIComponent(idOrSlug)}`, {
    revalidateSeconds: 60,
  });

  if (article && article.status === 'published') {
    return article;
  }

  return null;
}

/**
 * Fetches the 21 approved news categories.
 */
export async function fetchCategories(): Promise<PublicCategory[]> {
  const data = await fetchApi<PublicCategory[]>('/public/categories', { revalidateSeconds: 300 });
  if (data && Array.isArray(data) && data.length > 0) {
    return data;
  }

  // Canonical PRD pre-seeded categories fallback
  return CANONICAL_CATEGORIES.map((cat, idx) => ({
    id: cat.id,
    nameHi: cat.nameHi,
    nameEn: cat.nameEn,
    slug: cat.slug,
    displayOrder: idx + 1,
    isPrimary: cat.isPrimary,
  }));
}

/**
 * Fetches all Madhya Pradesh districts.
 */
export async function fetchDistricts(): Promise<PublicDistrict[]> {
  const data = await fetchApi<PublicDistrict[]>('/territory/districts?limit=100', { revalidateSeconds: 600 });
  if (data && Array.isArray(data) && data.length > 0) {
    return data;
  }

  // Pre-seeded 55 MP districts fallback
  const allDistricts: PublicDistrict[] = [];
  for (const div of MP_DIVISIONS_AND_DISTRICTS) {
    for (const dist of div.districts) {
      allDistricts.push({
        id: dist.slug,
        nameHi: dist.nameHi,
        nameEn: dist.slug.toUpperCase(),
        slug: dist.slug,
        divisionId: div.divisionSlug,
        divisionNameHi: div.divisionNameHi,
        divisionSlug: div.divisionSlug,
        isPriorityHub: (dist as any).isPriorityHub || false,
        isNewlyFormed: (dist as any).isNewlyFormed || false,
      });
    }
  }
  return allDistricts;
}

/**
 * Fetches district metadata by slug.
 */
export async function fetchDistrictBySlug(slug: string): Promise<PublicDistrict | null> {
  const all = await fetchDistricts();
  return all.find((d) => d.slug.toLowerCase() === slug.toLowerCase()) || null;
}

/**
 * Fetches real-time trending stories.
 */
export async function fetchTrendingArticles(limit = 5): Promise<TrendingArticle[]> {
  const data = await fetchApi<TrendingArticle[]>(`/analytics/trending?limit=${limit}`, {
    revalidateSeconds: 30,
  });

  if (data && Array.isArray(data)) {
    return data;
  }

  return [];
}

/**
 * Fetches breaking news bulletins for the top red marquee ticker.
 */
export async function fetchBreakingBulletins(): Promise<BreakingBulletin[]> {
  const result = await fetchPublishedArticles({ isBreaking: true, limit: 5 });
  if (result.items.length > 0) {
    return result.items.map((art) => ({
      id: art.id,
      headline: art.title,
      slug: art.slug,
      districtName: art.primaryLocationNameHi || 'मध्य प्रदेश',
      publishedAt: art.publishedAt,
    }));
  }

  return [];
}

/**
 * Dispatches non-blocking client-side telemetry event.
 */
export async function dispatchTelemetryEvent(event: {
  event_name: string;
  properties?: Record<string, any>;
  platform?: string;
  session_hash?: string;
}): Promise<void> {
  if (typeof window === 'undefined') return;

  const payload = {
    event_id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    event_name: event.event_name,
    timestamp: new Date().toISOString(),
    platform: event.platform || 'web_desktop',
    session_hash: event.session_hash,
    properties: event.properties || {},
  };

  const url = `${API_BASE_URL}/analytics/events`;

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Non-blocking telemetry
  }
}

// ============================================================================
// Public Monetization & Ad Serving Client Methods (BNW-MASTER-007)
// ============================================================================

export interface PublicAdResult {
  served: boolean;
  adSlotCode: string;
  creative?: {
    id: string;
    campaignId: string;
    advertiserName: string;
    headlineHi?: string;
    bodyTextHi?: string;
    destinationUrl: string;
    mediaUrl?: string;
    creativeType: string;
    width?: number;
    height?: number;
    asciLabel: string;
  };
  reason?: string;
}

export async function fetchPublicAd(slotCode: string, districtId?: string): Promise<PublicAdResult | null> {
  const query = districtId ? `?slotCode=${encodeURIComponent(slotCode)}&districtId=${encodeURIComponent(districtId)}` : `?slotCode=${encodeURIComponent(slotCode)}`;
  return fetchApi<PublicAdResult>(`/monetization/ads/serve${query}`, { revalidateSeconds: 30 });
}

export async function recordPublicAdImpression(payload: {
  creativeId: string;
  adSlotCode: string;
  viewDurationMs: number;
  viewPercentage: number;
}): Promise<void> {
  if (typeof window === 'undefined') return;
  const url = `${API_BASE_URL}/monetization/ads/impression`;

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Non-blocking
  }
}

export async function recordPublicAdClick(payload: {
  creativeId: string;
  adSlotCode: string;
}): Promise<void> {
  if (typeof window === 'undefined') return;
  const url = `${API_BASE_URL}/monetization/ads/click`;

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Non-blocking
  }
}

/**
 * Fetches published E-Paper editions.
 */
export async function fetchPublicEpaperEditions(params?: {
  districtId?: string;
  date?: string;
  editionType?: string;
  page?: number;
  limit?: number;
}): Promise<{ editions: PublicEpaperEdition[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.districtId) query.set('districtId', params.districtId);
  if (params?.date) query.set('date', params.date);
  if (params?.editionType) query.set('editionType', params.editionType);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit || 12));

  const data = await fetchApi<{ editions: PublicEpaperEdition[]; total: number }>(`/epaper/editions?${query.toString()}`, {
    revalidateSeconds: 60,
  });

  return data || { editions: [], total: 0 };
}

/**
 * Fetches a single published E-Paper edition by ID.
 */
export async function fetchPublicEpaperEditionById(id: string): Promise<PublicEpaperEdition | null> {
  const data = await fetchApi<PublicEpaperEdition>(`/epaper/editions/${id}`, {
    revalidateSeconds: 60,
  });
  return data || null;
}



