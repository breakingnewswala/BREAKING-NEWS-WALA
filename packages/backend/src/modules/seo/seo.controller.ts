/**
 * BREAKING NEWS WALA — SEO Controller
 * Grounded in docs/13-API.md and docs/SEO.md.
 */

import { Request, Response, NextFunction } from 'express';
import { seoService, SeoService } from './seo.service';

export class SeoController {
  constructor(private readonly service: SeoService = seoService) {}

  public getArticleSeo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const articleId = req.params.articleId as string;
      const data = await this.service.getArticleSeoMetadata(articleId);
      res.apiSuccess(data);
    } catch (err) {
      next(err);
    }
  };

  public updateArticleSeo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const articleId = req.params.articleId as string;
      const data = await this.service.updateArticleSeo(user.roles || [], articleId, req.body);
      res.apiSuccess(data);
    } catch (err) {
      next(err);
    }
  };

  public validateArticleSeo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const articleId = req.params.articleId as string;
      const data = await this.service.validateArticleSeo(articleId);
      res.apiSuccess(data);
    } catch (err) {
      next(err);
    }
  };

  public getStructuredData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const articleId = req.params.articleId as string;
      const data = await this.service.generateStructuredData(articleId);
      res.apiSuccess(data);
    } catch (err) {
      next(err);
    }
  };

  public getPreviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const articleId = req.params.articleId as string;
      const data = await this.service.generatePreviews(articleId);
      res.apiSuccess(data);
    } catch (err) {
      next(err);
    }
  };

  public getSitemapStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.getSitemapStatus();
      res.apiSuccess(data);
    } catch (err) {
      next(err);
    }
  };

  public getSearchConsoleStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.getSearchConsoleStatus();
      res.apiSuccess(data);
    } catch (err) {
      next(err);
    }
  };

  public updateSearchConsoleStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const { status, email } = req.body;
      const data = await this.service.updateSearchConsoleStatus(user.roles || [], status, email);
      res.apiSuccess(data);
    } catch (err) {
      next(err);
    }
  };
}

export const seoController = new SeoController();
