/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Reader Engagement & Interaction Manager
 * Governs Bookmarks, Reading History, Followed Entities, and Reader Feedback.
 */

import crypto from 'node:crypto';
import {
  AUDIENCE_LIMITS,
  AUDIENCE_ERROR_CODES,
  FEEDBACK_CATEGORIES,
} from './constants.js';

export class EngagementManager {
  constructor(adapter) {
    if (!adapter) throw new Error('Persistence adapter required for EngagementManager');
    this.adapter = adapter;
    // In-memory reading deduplication cache (userId + articleId -> timestamp)
    this.readingDedupCache = new Map();
  }

  // ==========================================================================
  // 1. Article Bookmarks
  // ==========================================================================

  async addBookmark(userId, articleId, user = null) {
    if (!userId || !articleId) {
      const err = new Error('userId and articleId are required to bookmark');
      err.code = AUDIENCE_ERROR_CODES.ERR_BOOKMARK_EXISTS;
      err.statusCode = 400;
      throw err;
    }

    const currentBookmarks = await this.adapter.getBookmarks(userId);
    const existing = currentBookmarks.find((b) => b.articleId === articleId);
    if (existing) {
      return existing; // Idempotent success
    }

    if (currentBookmarks.length >= AUDIENCE_LIMITS.MAX_BOOKMARKS_PER_USER) {
      const err = new Error(`अधिकतम ${AUDIENCE_LIMITS.MAX_BOOKMARKS_PER_USER} बुकमार्क की सीमा पूर्ण हो चुकी है।`);
      err.code = AUDIENCE_ERROR_CODES.ERR_BOOKMARK_LIMIT_EXCEEDED;
      err.statusCode = 400;
      throw err;
    }

    // Resolve article details for fast client preview
    let articleTitle = 'समाचार';
    let districtName = 'मध्य प्रदेश';
    let category = 'समाचार';
    const getArtFn = this.adapter.getArticleByIdOrSlug || this.adapter.getArticleById;
    if (getArtFn) {
      const art = await getArtFn.call(this.adapter, articleId);
      if (art) {
        // Defensive Security: Prevent readers from bookmarking unpublished internal drafts
        if (art.status && art.status !== 'PUBLISHED') {
          const userRoles = Array.isArray(user?.roles) ? user.roles : [user?.role || ''];
          const isStaff = userRoles.some((r) => ['REPORTER', 'EDITOR', 'ADMIN', 'SUPER_ADMIN'].includes(String(r).toUpperCase()));
          if (!isStaff) {
            const err = new Error('केवल प्रकाशित समाचारों को ही बुकमार्क किया जा सकता है।');
            err.code = AUDIENCE_ERROR_CODES.ERR_NOT_FOUND;
            err.statusCode = 404;
            throw err;
          }
        }
        articleTitle = art.title || art.headline || articleTitle;
        districtName = art.districtName || art.district || districtName;
        category = art.category || category;
      }
    }

    const bookmarkRecord = {
      id: `bm-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      userId,
      articleId,
      articleTitle,
      districtName,
      category,
      createdAt: new Date().toISOString(),
    };

    const saved = await this.adapter.saveBookmark(bookmarkRecord, user);
    return saved;
  }

  async removeBookmark(userId, articleId, user = null) {
    if (!userId || !articleId) throw new Error('userId and articleId required');
    const success = await this.adapter.deleteBookmark(userId, articleId, user);
    return { success, articleId };
  }

  async getBookmarks(userId, options = {}, user = null) {
    if (!userId) return [];
    return this.adapter.getBookmarks(userId, options);
  }

  // ==========================================================================
  // 2. Reading History Tracking
  // ==========================================================================

  async recordReadingHistory(userId, {
    articleId,
    dwellTimeSeconds = 0,
    scrollDepthPercent = 0,
    articleTitle = '',
    districtName = '',
    category = '',
  } = {}, user = null) {
    if (!userId || !articleId) return null;

    // Deduplicate reads within 30 minutes
    const dedupKey = `${userId}|${articleId}`;
    const now = Date.now();
    const lastRead = this.readingDedupCache.get(dedupKey);
    if (lastRead && now - lastRead < AUDIENCE_LIMITS.DEDUP_WINDOW_MS) {
      // Return existing without write amplification
      return { duplicate: true, articleId };
    }
    this.readingDedupCache.set(dedupKey, now);

    // Clean up old dedup entries every 500 keys
    if (this.readingDedupCache.size > 5000) {
      for (const [k, ts] of this.readingDedupCache.entries()) {
        if (now - ts > AUDIENCE_LIMITS.DEDUP_WINDOW_MS) {
          this.readingDedupCache.delete(k);
        }
      }
    }

    const record = {
      id: `rh-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      userId,
      articleId,
      articleTitle: articleTitle || 'समाचार',
      districtName: districtName || 'मध्य प्रदेश',
      category: category || 'समाचार',
      dwellTimeSeconds: Number(dwellTimeSeconds) || 0,
      scrollDepthPercent: Number(scrollDepthPercent) || 0,
      readAt: new Date().toISOString(),
    };

    return this.adapter.saveReadingHistory(record, user);
  }

  async getReadingHistory(userId, limit = 50, user = null) {
    if (!userId) return [];
    return this.adapter.getReadingHistory(userId, limit);
  }

  async clearReadingHistory(userId, user = null) {
    if (!userId) return false;
    return this.adapter.clearReadingHistory(userId, user);
  }

  // ==========================================================================
  // 3. Followed Topics & Districts
  // ==========================================================================

  async followTopic(userId, topic, user = null) {
    if (!userId || !topic) throw new Error('userId and topic required');
    const record = {
      id: `fol-top-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      userId,
      topic: String(topic).trim(),
      createdAt: new Date().toISOString(),
    };
    return this.adapter.saveFollowedTopic(record, user);
  }

  async unfollowTopic(userId, topic, user = null) {
    if (!userId || !topic) throw new Error('userId and topic required');
    return this.adapter.deleteFollowedTopic(userId, String(topic).trim(), user);
  }

  async followDistrict(userId, district, user = null) {
    if (!userId || !district) throw new Error('userId and district required');
    const record = {
      id: `fol-dst-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      userId,
      district: String(district).trim(),
      createdAt: new Date().toISOString(),
    };
    return this.adapter.saveFollowedDistrict(record, user);
  }

  async unfollowDistrict(userId, district, user = null) {
    if (!userId || !district) throw new Error('userId and district required');
    return this.adapter.deleteFollowedDistrict(userId, String(district).trim(), user);
  }

  async getFollowedEntities(userId, user = null) {
    if (!userId) return { topics: [], districts: [] };
    const [topics, districts] = await Promise.all([
      this.adapter.getFollowedTopics ? this.adapter.getFollowedTopics(userId) : [],
      this.adapter.getFollowedDistricts ? this.adapter.getFollowedDistricts(userId) : [],
    ]);
    return { topics, districts };
  }

  // ==========================================================================
  // 4. Reader Feedback & Article Corrections
  // ==========================================================================

  async submitFeedback({
    userId = 'anonymous',
    authorName = 'पाठक',
    contactEmail = null,
    articleId = null,
    category,
    comments,
    suggestedCorrection = null,
  } = {}, user = null) {
    if (!category || !comments) {
      const err = new Error('category and comments are mandatory for feedback');
      err.code = AUDIENCE_ERROR_CODES.ERR_FEEDBACK_VALIDATION;
      err.statusCode = 400;
      throw err;
    }

    let normCat = category;
    if (normCat === 'fact_error') normCat = 'fact_correction';
    if (normCat === 'app_bug') normCat = 'app_suggestion';

    const catDef = FEEDBACK_CATEGORIES.find((c) => c.code === normCat);
    if (!catDef) {
      const err = new Error(`अमान्य फीडबैक श्रेणी: ${category}`);
      err.code = AUDIENCE_ERROR_CODES.ERR_FEEDBACK_VALIDATION;
      err.statusCode = 400;
      throw err;
    }

    if (catDef.requiresArticleId && !articleId) {
      const err = new Error(`इस श्रेणी (${catDef.nameHi}) हेतु संबंधित समाचार आईडी (articleId) अनिवार्य है।`);
      err.code = AUDIENCE_ERROR_CODES.ERR_FEEDBACK_VALIDATION;
      err.statusCode = 400;
      throw err;
    }

    const feedbackRecord = {
      id: `fb-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      userId: user?.id || userId,
      authorName: user?.fullName || authorName,
      contactEmail: user?.email || contactEmail,
      articleId,
      category,
      categoryNameHi: catDef.nameHi,
      comments: String(comments).trim(),
      suggestedCorrection: suggestedCorrection ? String(suggestedCorrection).trim() : null,
      slaHours: catDef.slaHours,
      status: 'pending', // pending, reviewed, resolved, dismissed
      resolutionNotes: null,
      resolvedBy: null,
      resolvedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.adapter.saveReaderFeedback(feedbackRecord, user);
    return saved;
  }

  async getFeedbackList(filters = {}, user = null) {
    return this.adapter.getReaderFeedback(filters);
  }

  async updateFeedbackStatus(feedbackId, { status, resolutionNotes }, user = null) {
    if (!feedbackId || !status) {
      throw new Error('feedbackId and status required');
    }
    const item = await this.adapter.getReaderFeedbackById(feedbackId);
    if (!item) {
      const err = new Error('Feedback record not found');
      err.code = AUDIENCE_ERROR_CODES.ERR_FEEDBACK_NOT_FOUND;
      err.statusCode = 404;
      throw err;
    }

    item.status = status;
    item.resolutionNotes = resolutionNotes || item.resolutionNotes;
    item.resolvedBy = user?.fullName || 'संपादक';
    item.resolvedAt = new Date().toISOString();
    item.updatedAt = new Date().toISOString();

    const saved = await this.adapter.saveReaderFeedback(item, user);
    return saved;
  }
}
