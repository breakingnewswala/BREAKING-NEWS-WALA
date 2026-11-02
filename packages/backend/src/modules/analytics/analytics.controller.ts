/**
 * BREAKING NEWS WALA — Analytics Controller
 * Grounded in docs/13-API.md (ANL-01 to ANL-03, REP-12) and docs/DECISIONS.md (DEC-026).
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { analyticsService, AnalyticsService } from './analytics.service';
import { AnalyticsEventPayload, TrendingNewsFilter } from './types';

export class AnalyticsController {
  constructor(private readonly service: AnalyticsService = analyticsService) {}

  /**
   * Primary Telemetry Ingestion (POST /api/v1/analytics/events and /event)
   */
  public ingestEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
      const userAgent = (req.headers['user-agent'] as string) || '';
      const authenticatedUser = (req as any).user
        ? { id: (req as any).user.id, roles: (req as any).user.roles || [] }
        : undefined;

      const result = await this.service.ingestEvent(req.body, clientIp, userAgent, authenticatedUser);
      res.status(202);
      res.apiSuccess(result, { statusCode: 202 });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Legacy Pageview Ingestion (POST /api/v1/analytics/pageview - ANL-01)
   */
  public ingestLegacyPageview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
      const userAgent = (req.headers['user-agent'] as string) || '';
      const authenticatedUser = (req as any).user
        ? { id: (req as any).user.id, roles: (req as any).user.roles || [] }
        : undefined;

      const { articleId, article_id, readingTimeSeconds, scrollDepth, trafficSource, category, district } = req.body || {};
      const targetArticleId = articleId || article_id;

      const payload: AnalyticsEventPayload = {
        event_id: crypto.randomUUID(),
        event_name: 'article_viewed',
        event_version: '1.0',
        timestamp: new Date().toISOString(),
        platform: (req.headers['x-client-platform'] as any) || 'web_mobile',
        session_hash: (req.headers['x-session-id'] as string) || `legacy-${clientIp}`,
        properties: {
          article_id: targetArticleId,
          reading_time_seconds: readingTimeSeconds || 0,
          scroll_depth_percent: scrollDepth || 0,
          traffic_source: trafficSource || 'direct',
          category,
          district,
        },
      };

      const result = await this.service.ingestEvent(payload, clientIp, userAgent, authenticatedUser);
      res.status(200);
      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Legacy Video Heartbeat Ingestion (POST /api/v1/analytics/video-heartbeat - ANL-02)
   */
  public ingestLegacyVideoHeartbeat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
      const userAgent = (req.headers['user-agent'] as string) || '';
      const authenticatedUser = (req as any).user
        ? { id: (req as any).user.id, roles: (req as any).user.roles || [] }
        : undefined;

      const { videoId, articleId, secondsWatched } = req.body || {};

      const payload: AnalyticsEventPayload = {
        event_id: crypto.randomUUID(),
        event_name: 'video_heartbeat',
        event_version: '1.0',
        timestamp: new Date().toISOString(),
        platform: (req.headers['x-client-platform'] as any) || 'web_mobile',
        session_hash: (req.headers['x-session-id'] as string) || `legacy-${clientIp}`,
        properties: {
          video_id: videoId,
          article_id: articleId,
          seconds_watched: secondsWatched || 0,
        },
      };

      const result = await this.service.ingestEvent(payload, clientIp, userAgent, authenticatedUser);
      res.status(200);
      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Platform Analytics Overview (GET /api/v1/analytics/overview - ANL-03)
   */
  public getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRoles = (req as any).user?.roles || [];
      const { startDate, endDate, timeRange } = req.query as { startDate?: string; endDate?: string; timeRange?: string };
      const overview = await this.service.getOverview(userRoles, startDate, endDate, timeRange);
      res.apiSuccess(overview);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Article Historical Telemetry (GET /api/v1/analytics/articles/:articleId)
   */
  public getArticleAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const userRoles = (req as any).user.roles || [];
      const articleId = req.params.articleId as string;
      const data = await this.service.getArticleAnalytics(userId, userRoles, articleId);
      res.apiSuccess(data);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Content Performance Intelligence (GET /api/v1/analytics/content)
   */
  public getContentPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRoles = (req as any).user?.roles || [];
      const { timeRange } = req.query as { timeRange?: string };
      const data = await this.service.getContentPerformance(userRoles, timeRange);
      res.apiSuccess(data);
    } catch (err) {
      next(err);
    }
  };

  /**
   * District-wise Audience Insights (GET /api/v1/analytics/districts)
   */
  public getDistrictInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRoles = (req as any).user?.roles || [];
      const { timeRange } = req.query as { timeRange?: string };
      const data = await this.service.getDistrictInsights(userRoles, timeRange);
      res.apiSuccess(data);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Editorial Performance Report (GET /api/v1/analytics/editorial-performance)
   */
  public getEditorialPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const { timeRange, authorId } = req.query as { timeRange?: string; authorId?: string };
      const data = await this.service.getEditorialPerformance(user?.roles || [], user?.id, authorId, timeRange);
      res.apiSuccess(data);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Content Comparison (GET /api/v1/analytics/compare)
   */
  public compareContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRoles = (req as any).user?.roles || [];
      const { entityType, id1, id2 } = req.query as {
        entityType?: 'article' | 'category' | 'district';
        id1?: string;
        id2?: string;
      };
      if (!entityType || !id1 || !id2) {
        res.apiSuccess({ error: 'entityType, id1, and id2 query parameters are required.' }, { statusCode: 400 });
        return;
      }
      const data = await this.service.compareContent(userRoles, entityType, id1, id2);
      res.apiSuccess(data);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Public Trending Stories (GET /api/v1/analytics/trending)
   */
  public getTrending = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
      const filter: TrendingNewsFilter = {
        category: req.query.category as string,
        district: req.query.district as string,
        division: req.query.division as string,
        videoOnly: req.query.videoOnly === 'true',
        limit,
      };
      const trending = await this.service.getTrending(limit, filter);
      res.apiSuccess(trending);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Trending Exclusion - Editorial Control (POST /api/v1/admin/analytics/trending/exclude)
   */
  public excludeStoryFromTrending = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const { articleId, reason } = req.body;
      const data = await this.service.excludeStoryFromTrending(user.roles || [], user.id, { articleId, reason });
      res.apiSuccess(data);
    } catch (err) {
      next(err);
    }
  };

  /**
   * List Trending Exclusions (GET /api/v1/admin/analytics/trending/exclusions)
   */
  public getTrendingExclusions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const data = await this.service.getTrendingExclusions(user.roles || []);
      res.apiSuccess(data);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Reporter Personal Performance Scorecard (GET /api/v1/reporter/performance - REP-12)
   */
  public getReporterPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const targetAuthorId = (req.query.authorId as string) || user.id;
      const data = await this.service.getReporterPerformance(targetAuthorId, {
        id: user.id,
        roles: user.roles || [],
      });
      res.apiSuccess(data);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Audience Preferences Self-Service (GET /api/v1/audience/preferences)
   */
  public getUserPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const data = await this.service.getUserPreferences(user?.id || 'anon');
      res.apiSuccess(data);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Update Audience Preferences (PUT /api/v1/audience/preferences)
   */
  public updateUserPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const data = await this.service.updateUserPreferences(user?.id || 'anon', req.body);
      res.apiSuccess(data);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Audience Segments (GET /api/v1/admin/audience/segments)
   */
  public getAudienceSegments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const data = await this.service.getAudienceSegments(user.roles || []);
      res.apiSuccess(data);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Audience Insights Summary (GET /api/v1/admin/audience/insights)
   */
  public getAudienceInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const data = await this.service.getAudienceInsightsSummary(user.roles || []);
      res.apiSuccess(data);
    } catch (err) {
      next(err);
    }
  };
}

export const analyticsController = new AnalyticsController();
