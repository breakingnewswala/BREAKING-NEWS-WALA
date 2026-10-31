import { 
  Article, 
  Category, 
  ReporterProfile, 
  GraphicTemplate, 
  BreakingTicker, 
  ApiPoolKey, 
  SystemAuditLog, 
  AdBanner 
} from '../types/index.ts';

export async function fetchNews(params?: {
  category?: string;
  district?: string;
  status?: string;
  search?: string;
  trending?: boolean;
  limit?: number;
}): Promise<Article[]> {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.district) query.set('district', params.district);
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.trending) query.set('trending', 'true');
  if (params?.limit) query.set('limit', params.limit.toString());

  const res = await fetch(`/api/news?${query.toString()}`);
  const data = await res.json();
  return data.data || [];
}

export async function fetchArticleById(id: string): Promise<Article | null> {
  const res = await fetch(`/api/news/${id}`);
  const data = await res.json();
  return data.data || null;
}

export async function postNewsArticle(article: Partial<Article>): Promise<Article> {
  const res = await fetch('/api/news', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(article)
  });
  const data = await res.json();
  return data.data;
}

export async function updateNewsArticle(id: string, updates: Partial<Article> & { reviewerName?: string }): Promise<Article> {
  const res = await fetch(`/api/news/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  const data = await res.json();
  return data.data;
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch('/api/categories');
  const data = await res.json();
  return data.data || [];
}

export async function fetchLocations(): Promise<{ defaultState: string; districts: string[] }> {
  const res = await fetch('/api/locations');
  const data = await res.json();
  return data.data || { defaultState: 'मध्य प्रदेश', districts: [] };
}

export async function fetchReporters(): Promise<ReporterProfile[]> {
  const res = await fetch('/api/reporters');
  const data = await res.json();
  return data.data || [];
}

export async function updateReporter(id: string, updates: Partial<ReporterProfile>): Promise<ReporterProfile> {
  const res = await fetch(`/api/reporters/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  const data = await res.json();
  return data.data;
}

export async function fetchTickers(): Promise<BreakingTicker[]> {
  const res = await fetch('/api/ticker');
  const data = await res.json();
  return data.data || [];
}

export async function createTicker(ticker: Partial<BreakingTicker>): Promise<BreakingTicker> {
  const res = await fetch('/api/ticker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticker)
  });
  const data = await res.json();
  return data.data;
}

export async function fetchTemplates(): Promise<GraphicTemplate[]> {
  const res = await fetch('/api/templates');
  const data = await res.json();
  return data.data || [];
}

export async function createTemplate(template: Partial<GraphicTemplate>): Promise<GraphicTemplate> {
  const res = await fetch('/api/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(template)
  });
  const data = await res.json();
  return data.data;
}

export async function fetchApiPoolStatus(): Promise<{
  activeModel: string;
  uptimePercentage: number;
  failoverStatus: string;
  data: ApiPoolKey[];
}> {
  const res = await fetch('/api/ai/pool-status');
  return res.json();
}

export async function fetchAuditLogs(): Promise<SystemAuditLog[]> {
  const res = await fetch('/api/audit-logs');
  const data = await res.json();
  return data.data || [];
}

export async function fetchAds(): Promise<AdBanner[]> {
  const res = await fetch('/api/ads');
  const data = await res.json();
  return data.data || [];
}

// AI endpoints
export async function aiStructureNews(payload: {
  rawScript: string;
  category?: string;
  district?: string;
}): Promise<{
  title: string;
  subtitle: string;
  content: string;
  tags: string[];
  suggestedCategory: string;
  seoTitle?: string;
  metaDescription?: string;
}> {
  const res = await fetch('/api/ai/structure-news', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.data;
}

export async function aiUrlRewrite(payload: {
  url?: string;
  sourceText?: string;
  originalPublisher?: string;
}): Promise<{
  title: string;
  subtitle: string;
  content: string;
  tags: string[];
  category: string;
  seoTitle?: string;
  metaDescription?: string;
  sourceUrl?: string;
  sourcePublisher?: string;
}> {
  const res = await fetch('/api/ai/url-rewrite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.data;
}

export async function aiHeadlineOptions(storyText: string): Promise<string[]> {
  const res = await fetch('/api/ai/headline-options', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storyText })
  });
  const data = await res.json();
  return data.headlines || [];
}
