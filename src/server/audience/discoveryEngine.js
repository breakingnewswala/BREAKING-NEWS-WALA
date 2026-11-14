/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Search, Discovery & Content Relationship Engine
 * Enforces Publication Boundaries (Zero Draft Leaks) and Hyperlocal Discoverability.
 */

import { SEED_SEARCH_TRENDING_TERMS, AUDIENCE_ERROR_CODES } from './constants.js';

export class DiscoveryEngine {
  constructor(adapter) {
    if (!adapter) throw new Error('Persistence adapter required for DiscoveryEngine');
    this.adapter = adapter;
  }

  /**
   * Searches published articles with filters and role-boundary protection
   */
  async searchArticles({
    query = '',
    category = null,
    district = null,
    dateFrom = null,
    dateTo = null,
    limit = 20,
    page = 1,
  } = {}, user = null) {
    const rawArticles = await this.adapter.getArticles({ status: 'all', limit: 1000 });
    const articleList = Array.isArray(rawArticles) ? rawArticles : (rawArticles?.items || []);

    // CRITICAL SECURITY INVARIANT: Only published articles are searchable by readers/public
    const published = articleList.filter(
      (a) => (String(a.status || '').toLowerCase() === 'published')
    );

    const q = String(query || '').trim().toLowerCase();
    const fromTime = dateFrom ? new Date(dateFrom).getTime() : 0;
    const toTime = dateTo ? new Date(dateTo).getTime() : Infinity;

    const matched = published.filter((art) => {
      // Category filter
      if (category && category !== 'ALL') {
        const artCat = (art.category || art.categoryId || '').toLowerCase();
        if (artCat !== category.toLowerCase()) return false;
      }

      // District filter
      if (district && district !== 'ALL') {
        const artDist = (art.districtName || art.district || '').toLowerCase();
        if (artDist !== district.toLowerCase()) return false;
      }

      // Date range filter
      const pubTime = new Date(art.publishedAt || art.createdAt).getTime();
      if (pubTime < fromTime || pubTime > toTime) return false;

      // Free-text query match
      if (q) {
        const title = (art.title || art.headline || '').toLowerCase();
        const excerpt = (art.excerpt || art.subheadline || '').toLowerCase();
        const body = (art.bodyContent || art.content || '').toLowerCase();
        const distName = (art.districtName || art.district || '').toLowerCase();
        const catName = (art.category || '').toLowerCase();

        return (
          title.includes(q) ||
          excerpt.includes(q) ||
          body.includes(q) ||
          distName.includes(q) ||
          catName.includes(q)
        );
      }

      return true;
    });

    // Score / Sort by relevance and recency
    matched.sort((a, b) => {
      if (q) {
        const aTitle = (a.title || a.headline || '').toLowerCase();
        const bTitle = (b.title || b.headline || '').toLowerCase();
        const aInTitle = aTitle.includes(q) ? 1 : 0;
        const bInTitle = bTitle.includes(q) ? 1 : 0;
        if (aInTitle !== bInTitle) return bInTitle - aInTitle;
      }
      return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
    });

    const paginated = matched.slice((page - 1) * limit, page * limit);

    return {
      results: paginated,
      total: matched.length,
      page,
      limit,
      query: q,
      filters: { category, district, dateFrom, dateTo },
    };
  }

  /**
   * Retrieves trending search queries in Madhya Pradesh
   */
  getTrendingSearchTerms() {
    return {
      terms: SEED_SEARCH_TRENDING_TERMS,
      region: 'Madhya Pradesh (मध्य प्रदेश)',
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Returns related stories for an article based on category and district
   */
  async getRelatedStories(articleId, limit = 5, user = null) {
    if (!articleId) return [];

    const rawArticles = await this.adapter.getArticles({ status: 'all', limit: 1000 });
    const articleList = Array.isArray(rawArticles) ? rawArticles : (rawArticles?.items || []);
    const published = articleList.filter(
      (a) => (String(a.status || '').toLowerCase() === 'published')
    );

    const targetArticle = published.find((a) => a.id === articleId);
    if (!targetArticle) {
      return published.slice(0, limit);
    }

    const targetCat = (targetArticle.category || targetArticle.categoryId || '').toLowerCase();
    const targetDist = (targetArticle.districtName || targetArticle.district || '').toLowerCase();

    const related = published.filter((a) => {
      if (a.id === articleId) return false; // Exclude self
      const c = (a.category || a.categoryId || '').toLowerCase();
      const d = (a.districtName || a.district || '').toLowerCase();
      return c === targetCat || d === targetDist;
    });

    // Sort by freshness
    related.sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
    return related.slice(0, limit);
  }
}
