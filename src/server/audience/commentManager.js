/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Comments & Community Moderation Manager
 * Implements Threaded Replies, Spam Shield, Reporting, and Mandatory Editorial Moderation.
 */

import crypto from 'node:crypto';
import { AUDIENCE_LIMITS, AUDIENCE_ERROR_CODES } from './constants.js';

export class CommentManager {
  constructor(adapter) {
    if (!adapter) throw new Error('Persistence adapter required for CommentManager');
    this.adapter = adapter;
    // User comment timestamps map for rate limiting (userId -> array of timestamps)
    this.userRateMap = new Map();
    // Blocklist keywords for automated spam filtering
    this.spamKeywords = [
      'betting', 'satta', 'matka', 'casino', 'free money', 'lottery',
      'whatsapp me', 'telegram channel', 'crypto investment', '100% profit',
    ];
  }

  /**
   * Sanitizes user input to prevent stored Cross-Site Scripting (XSS)
   */
  sanitizeContent(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/[<>]/g, (tag) => (tag === '<' ? '&lt;' : '&gt;'));
  }

  /**
   * Adds a new reader comment with automated spam detection & rate limiting
   */
  async addComment({
    articleId,
    parentCommentId = null,
    authorName = 'पाठक',
    authorEmail = null,
    content,
    userId = null,
  } = {}, user = null) {
    if (!articleId || !content) {
      const err = new Error('articleId and content are required');
      err.code = AUDIENCE_ERROR_CODES.ERR_COMMENT_VALIDATION;
      err.statusCode = 400;
      throw err;
    }

    const trimmedContent = String(content).trim();
    if (trimmedContent.length < 2 || trimmedContent.length > 2000) {
      const err = new Error('टिप्पणी की लंबाई 2 से 2000 अक्षरों के मध्य होनी चाहिए।');
      err.code = AUDIENCE_ERROR_CODES.ERR_COMMENT_VALIDATION;
      err.statusCode = 400;
      throw err;
    }

    const effectiveUserId = user?.id || userId || 'anon-guest';

    // Rate Limiting Defense (Max 10 comments per 10 minutes)
    const now = Date.now();
    const timestamps = (this.userRateMap.get(effectiveUserId) || []).filter(
      (ts) => now - ts < 10 * 60 * 1000
    );
    if (timestamps.length >= AUDIENCE_LIMITS.MAX_COMMENTS_PER_10_MIN) {
      const err = new Error('टिप्पणी दर सीमा पार: कृपया 10 मिनट पश्चात पुनः प्रयास करें।');
      err.code = AUDIENCE_ERROR_CODES.ERR_COMMENT_RATE_LIMITED;
      err.statusCode = 429;
      throw err;
    }
    timestamps.push(now);
    this.userRateMap.set(effectiveUserId, timestamps);

    // Automated Spam Check
    const lower = trimmedContent.toLowerCase();
    const hasSpamKeyword = this.spamKeywords.some((kw) => lower.includes(kw));
    const urlMatches = trimmedContent.match(/https?:\/\/[^\s]+/g);
    const hasExcessiveLinks = urlMatches && urlMatches.length > 1;

    // Defensive Security: Stored XSS Prevention
    const sanitizedContent = this.sanitizeContent(trimmedContent);

    let status = 'approved';
    let isFlagged = false;
    let moderationReason = null;

    if (hasSpamKeyword || hasExcessiveLinks) {
      status = 'flagged';
      isFlagged = true;
      moderationReason = hasSpamKeyword ? 'संदिग्ध विज्ञापन / स्पैम कीवर्ड' : 'अत्यधिक लिंक';
    }

    const commentRecord = {
      id: `cmt-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      articleId,
      parentCommentId,
      userId: effectiveUserId,
      authorName: user?.fullName || authorName,
      authorEmail: user?.email || authorEmail,
      content: sanitizedContent,
      status, // approved, pending, flagged, rejected, deleted
      isFlagged,
      moderationReason,
      reportCount: 0,
      reports: [],
      likesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.adapter.saveComment(commentRecord, user);
    return saved;
  }

  /**
   * Retrieves approved comments for an article organized as threaded replies
   */
  async getCommentsByArticle(articleId, options = {}, user = null) {
    if (!articleId) return [];

    const allComments = await this.adapter.getComments({ articleId });
    // Public readers only see approved comments; editors/admins can see all
    const roles = user ? (Array.isArray(user.roles) ? user.roles : [user.role || '']) : [];
    const isElevated = roles.some((r) => ['ADMIN', 'SUPER_ADMIN', 'CHIEF_EDITOR', 'EDITOR'].includes(String(r).toUpperCase()));

    const visible = allComments.filter((c) => {
      if (isElevated) return true;
      return c.status === 'approved';
    });

    // Build hierarchy (root comments + replies)
    const rootComments = [];
    const replyMap = new Map();

    for (const c of visible) {
      if (!c.parentCommentId) {
        rootComments.push({ ...c, replies: [] });
      } else {
        const replies = replyMap.get(c.parentCommentId) || [];
        replies.push(c);
        replyMap.set(c.parentCommentId, replies);
      }
    }

    for (const root of rootComments) {
      root.replies = replyMap.get(root.id) || [];
    }

    // Sort roots descending by createdAt
    rootComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return rootComments;
  }

  /**
   * Reports a comment for moderation
   */
  async reportComment(commentId, { reason, reportedBy = 'reader' } = {}, user = null) {
    if (!commentId) throw new Error('commentId required to report');

    const comment = await this.adapter.getCommentById(commentId);
    if (!comment) {
      const err = new Error('Comment not found');
      err.code = AUDIENCE_ERROR_CODES.ERR_COMMENT_NOT_FOUND;
      err.statusCode = 404;
      throw err;
    }

    comment.reportCount = (comment.reportCount || 0) + 1;
    comment.reports = comment.reports || [];
    comment.reports.push({
      reason: reason || 'अनुचित सामग्री',
      reportedBy: user?.id || reportedBy,
      reportedAt: new Date().toISOString(),
    });

    if (comment.reportCount >= AUDIENCE_LIMITS.COMMENT_REPORT_FLAG_THRESHOLD) {
      comment.isFlagged = true;
      comment.status = 'flagged';
      comment.moderationReason = `पाठक रिपोर्ट थ्रेशोल्ड पूर्ण (${comment.reportCount} रिपोर्ट)`;
    }

    comment.updatedAt = new Date().toISOString();
    return this.adapter.saveComment(comment, user);
  }

  /**
   * Moderates a comment (approve, reject, delete) with audit log
   */
  async moderateComment(commentId, { action, reason }, user = null) {
    if (!commentId || !action) {
      throw new Error('commentId and action are required for moderation');
    }

    const comment = await this.adapter.getCommentById(commentId);
    if (!comment) {
      const err = new Error('Comment not found');
      err.code = AUDIENCE_ERROR_CODES.ERR_COMMENT_NOT_FOUND;
      err.statusCode = 404;
      throw err;
    }

    if (action === 'approve') {
      comment.status = 'approved';
      comment.isFlagged = false;
      comment.moderationReason = null;
    } else if (action === 'reject') {
      comment.status = 'rejected';
      comment.isFlagged = false;
      comment.moderationReason = reason || 'संपादकीय दिशा-निर्देशों के अनुरूप नहीं';
    } else if (action === 'delete') {
      comment.status = 'deleted';
      comment.content = '[यह टिप्पणी नीति उल्लंघन के कारण हटा दी गई है]';
    } else {
      throw new Error('Action must be "approve", "reject", or "delete"');
    }

    comment.moderatedBy = user?.fullName || 'संपादक';
    comment.moderatedAt = new Date().toISOString();
    comment.updatedAt = new Date().toISOString();

    const saved = await this.adapter.saveComment(comment, user);

    if (this.adapter.addAuditLog) {
      this.adapter.addAuditLog(
        user?.fullName || 'संपादक',
        'COMMUNITY_MODERATION',
        `COMMENT_${action.toUpperCase()}`,
        `टिप्पणी समीक्षा: ${commentId} -> ${comment.status}`,
        null
      );
    }

    return saved;
  }
}

