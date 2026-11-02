/**
 * BREAKING NEWS WALA — Article Controller
 * Grounded in docs/13-API.md (REP-03 through REP-08) and docs/DECISIONS.md (DEC-026)
 * Handles HTTP parsing, parameter resolution, authorization context, and standard response envelopes.
 */

import { Request, Response, NextFunction } from 'express';
import { ArticleService, articleService } from './article.service';

export class ArticleController {
  constructor(private readonly service: ArticleService = articleService) {}

  /**
   * POST /api/v1/articles/drafts
   * (Canonical REP-03 support)
   */
  public createDraft = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authorId = req.user!.id;
      const authorRoles = req.user!.roles;
      const article = await this.service.createDraft(authorId, authorRoles, req.body);
      res.apiSuccess(article);
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /api/v1/articles/drafts/:id
   * (Canonical REP-04 support)
   */
  public updateDraft = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userRoles = req.user!.roles;
      const article = await this.service.updateDraft(req.params.id as string, userId, userRoles, req.body);
      res.apiSuccess(article);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/articles/drafts/:id
   */
  public getDraft = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userRoles = req.user?.roles || [];
      const article = await this.service.getArticle(req.params.id as string, userId, userRoles);
      res.apiSuccess(article);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/articles/:id
   */
  public getArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userRoles = req.user?.roles || [];
      const article = await this.service.getArticle(req.params.id as string, userId, userRoles);
      res.apiSuccess(article);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/articles/my-articles
   * (Canonical REP-07 support)
   */
  public listMyArticles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { page, limit, status, search, sortBy, sortOrder } = req.query as Record<string, string>;

      const result = await this.service.listMyArticles(userId, {
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        status: status as any,
        search,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });

      res.apiSuccess(result.items, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/articles
   */
  public listArticles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userRoles = req.user?.roles || [];
      const { page, limit, status, categoryId, locationId, isBreaking, search, sortBy, sortOrder } =
        req.query as Record<string, string>;

      const result = await this.service.listArticles(
        {
          page: page ? parseInt(page, 10) : undefined,
          limit: limit ? parseInt(limit, 10) : undefined,
          status: status as any,
          categoryId,
          locationId,
          isBreaking: isBreaking === 'true' ? true : isBreaking === 'false' ? false : undefined,
          search,
          sortBy: sortBy as any,
          sortOrder: sortOrder as any,
        },
        userId,
        userRoles
      );

      res.apiSuccess(result.items, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/articles/:id/submit
   * (Canonical REP-05 support)
   */
  public submitDraft = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authorId = req.user!.id;
      const authorRoles = req.user!.roles;
      const article = await this.service.submitDraft(req.params.id as string, authorId, authorRoles);
      res.apiSuccess(article);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/articles/:id/direct-publish
   * (Canonical REP-06 support)
   */
  public directPublish = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authorId = req.user!.id;
      const authorRoles = req.user!.roles;
      const result = await this.service.directPublish(req.params.id as string, authorId, authorRoles);
      res.apiSuccess(
        {
          ...result.article,
          rerouted: result.rerouted,
          note: result.note,
        },
        {
          rerouted: result.rerouted,
          note: result.note,
        }
      );
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/articles/:id/review
   * (Editorial review actions: claim, approve, request_changes, reject, retract)
   */
  public reviewArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reviewerId = req.user!.id;
      const reviewerRoles = req.user!.roles;
      const result = await this.service.reviewArticle(
        req.params.id as string,
        reviewerId,
        reviewerRoles,
        req.body
      );
      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/articles/:id/reviews
   * (Canonical REP-08 feedback support)
   */
  public getReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userRoles = req.user!.roles;
      const reviews = await this.service.getArticleReviews(req.params.id as string, userId, userRoles);
      res.apiSuccess(reviews);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/articles/:id/revisions
   */
  public getRevisions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userRoles = req.user!.roles;
      const revisions = await this.service.getArticleRevisions(req.params.id as string, userId, userRoles);
      res.apiSuccess(revisions);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/articles/editorial/stats
   * (Aggregated real-time metrics for Central Newsroom Desk)
   */
  public getEditorialStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRoles = req.user?.roles || [];
      const stats = await this.service.getEditorialStats(userRoles);
      res.apiSuccess(stats);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/articles/editorial/activity
   * (Recent editorial activity timeline)
   */
  public getRecentActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRoles = req.user?.roles || [];
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const activity = await this.service.getRecentEditorialActivity(userRoles, limit);
      res.apiSuccess(activity);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/articles/ingest
   */
  public ingestArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.ingestExternalArticle(req.body);
      res.apiSuccess(
        {
          ...result.article,
          isDuplicate: !result.isNew,
        },
        { isNew: result.isNew, isDuplicate: !result.isNew }
      );
    } catch (err) {
      next(err);
    }
  };
}

export const articleController = new ArticleController();
