/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Personalized News Feed & Recommendation Engine
 * Adheres to Anti-Filter-Bubble Mandates & Explicit Personalization Explanations.
 */

export class RecommendationEngine {
  constructor(adapter, preferenceManager) {
    if (!adapter) throw new Error('Persistence adapter required for RecommendationEngine');
    this.adapter = adapter;
    this.preferenceManager = preferenceManager;
  }

  /**
   * Generates a personalized or chronological feed with explanation metadata
   */
  async getFeed({
    userId = null,
    mode = 'personalized', // 'personalized' | 'chronological'
    limit = 20,
    page = 1,
    district = null,
    category = null,
  } = {}, user = null) {
    // 1. Fetch published articles from persistence
    const rawArticles = await this.adapter.getArticles({ status: 'all', limit: 1000 });
    const articleList = Array.isArray(rawArticles) ? rawArticles : (rawArticles?.items || []);
    const published = articleList.filter(
      (a) => (String(a.status || '').toLowerCase() === 'published')
    );

    // 2. Fetch user preferences if available
    let preferences = null;
    let readingHistory = [];
    if (userId && this.preferenceManager) {
      preferences = await this.preferenceManager.getUserPreferences(userId, user);
      if (this.adapter.getReadingHistory) {
        readingHistory = await this.adapter.getReadingHistory(userId, 30);
      }
    }

    const recentlyReadIds = new Set(readingHistory.map((h) => h.articleId));

    // 3. Chronological Mode: Pure time-ordered feed
    if (mode === 'chronological' || !preferences) {
      let filtered = [...published];
      if (district && district !== 'ALL') {
        filtered = filtered.filter((a) => (a.districtName === district || a.district === district));
      }
      if (category && category !== 'ALL') {
        filtered = filtered.filter((a) => (a.category === category || a.categoryId === category));
      }

      // Sort strictly by publishedAt or createdAt desc
      filtered.sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());

      const paginated = filtered.slice((page - 1) * limit, page * limit).map((a) => ({
        ...a,
        isPersonalized: false,
        feedMode: 'chronological',
        recommendationReason: 'नवीनतम प्रकाशित क्रम (समय अनुसार)',
      }));

      return {
        feed: paginated,
        total: filtered.length,
        page,
        limit,
        mode: 'chronological',
      };
    }

    // 4. Personalized Mode: Scored Feed with Anti-Bubble Guarantees
    const userDistricts = new Set((preferences.preferredDistricts || []).map((d) => d.toLowerCase()));
    const userCategories = new Set((preferences.preferredCategories || []).map((c) => c.toLowerCase()));
    const userTopics = (preferences.followedTopics || []).map((t) => t.toLowerCase());

    const now = Date.now();

    const scoredArticles = published.map((art) => {
      let score = 0;
      let reasons = [];
      const artDistrict = (art.districtName || art.district || '').toLowerCase();
      const artCategory = (art.category || art.categoryId || '').toLowerCase();
      const artTitle = (art.title || art.headline || '').toLowerCase();
      const isBreaking = Boolean(art.isBreaking || art.priority === 'CRITICAL' || art.priority === 'BREAKING');
      const isPromoted = Boolean(art.isEditorPromoted || art.isLeadStory);

      // Invariant: Breaking news always gets top priority (Anti-Filter-Bubble)
      if (isBreaking) {
        score += 1000;
        reasons.push('अति-महत्वपूर्ण ब्रेकिंग न्यूज़ (सार्वजनिक हित)');
      }

      // Editorially promoted stories
      if (isPromoted) {
        score += 300;
        reasons.push('संपादक द्वारा अनुशंसित प्रमुख समाचार');
      }

      // Preferred District Match
      if (userDistricts.has(artDistrict)) {
        score += 80;
        reasons.push(`आपके गृह ज़िले (${art.districtName || art.district}) का समाचार`);
      }

      // Preferred Category Match
      if (userCategories.has(artCategory)) {
        score += 50;
        reasons.push(`आपकी रुचि श्रेणी (${art.category || 'सामान्य'})`);
      }

      // Followed Topics Match
      for (const top of userTopics) {
        if (artTitle.includes(top)) {
          score += 40;
          reasons.push(`आपके अनुसरित विषय "${top}" से संबंधित`);
          break;
        }
      }

      // Time Decay (Freshness factor)
      const pubTime = new Date(art.publishedAt || art.createdAt).getTime();
      const ageHours = Math.max(0, (now - pubTime) / (3600 * 1000));
      const freshnessMultiplier = Math.exp(-ageHours / 24); // 24-hour half-decay
      score += 30 * freshnessMultiplier;

      // Penalize recently read to avoid repetitive recommendations
      if (recentlyReadIds.has(art.id)) {
        score -= 200;
      }

      return {
        article: art,
        score,
        isBreaking,
        isPromoted,
        explanation: reasons.length > 0 ? reasons.join(' • ') : 'सामान्य समाचार प्रवाह',
      };
    });

    // Sort by computed relevance score descending
    scoredArticles.sort((a, b) => b.score - a.score);

    // Deduplicate and format output
    const seenIds = new Set();
    const dedupedFeed = [];

    for (const item of scoredArticles) {
      if (!seenIds.has(item.article.id)) {
        seenIds.add(item.article.id);
        dedupedFeed.push({
          ...item.article,
          isPersonalized: true,
          feedMode: 'personalized',
          relevanceScore: Math.round(item.score),
          recommendationReason: item.explanation,
        });
      }
    }

    const paginated = dedupedFeed.slice((page - 1) * limit, page * limit);

    return {
      feed: paginated,
      total: dedupedFeed.length,
      page,
      limit,
      mode: 'personalized',
      activePreferences: {
        preferredDistricts: preferences.preferredDistricts,
        preferredCategories: preferences.preferredCategories,
        followedTopics: preferences.followedTopics,
      },
    };
  }
}
