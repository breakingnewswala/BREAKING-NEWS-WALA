/**
 * BREAKING NEWS WALA — RSS Module Controller
 * Grounded in docs/13-API.md and docs/DECISIONS.md (DEC-026, DEC-048)
 */

import { Request, Response, NextFunction } from 'express';
import { RssService } from './rss.service';

export class RssController {
  constructor(private service: RssService) {}

  public listSources = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req.user as any)?.roles || [];
      const { status, isAuthorized, search, category, page, limit } = req.query;

      const result = await this.service.listSources(
        {
          status: status as any,
          isAuthorized: isAuthorized !== undefined ? isAuthorized === 'true' : undefined,
          search: search as string,
          category: category as string,
          page: page ? parseInt(page as string, 10) : undefined,
          limit: limit ? parseInt(limit as string, 10) : undefined,
        },
        roles
      );
      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  public getSourceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req.user as any)?.roles || [];
      const source = await this.service.getSourceById(req.params.id as string, roles);
      res.apiSuccess(source);
    } catch (err) {
      next(err);
    }
  };

  public createSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req.user as any)?.roles || [];
      const creatorId = (req.user as any)?.id || 'usr-admin';
      const source = await this.service.createSource(req.body, creatorId, roles);
      res.status(201).apiSuccess(source, { message: 'RSS फ़ीड स्रोत सफलतापूर्वक जोड़ा गया (अनुमोदन लंबित)' });
    } catch (err) {
      next(err);
    }
  };

  public updateSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req.user as any)?.roles || [];
      const source = await this.service.updateSource(req.params.id as string, req.body, roles);
      res.apiSuccess(source, { message: 'RSS स्रोत विन्यास अद्यतन किया गया' });
    } catch (err) {
      next(err);
    }
  };

  public approveSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req.user as any)?.roles || [];
      const approverId = (req.user as any)?.id || 'usr-admin-super';
      const source = await this.service.approveSource(req.params.id as string, approverId, roles);
      res.apiSuccess(source, { message: 'RSS स्रोत अधिकृत एवं सक्रिय किया गया' });
    } catch (err) {
      next(err);
    }
  };

  public pauseSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req.user as any)?.roles || [];
      const source = await this.service.pauseSource(req.params.id as string, roles);
      res.apiSuccess(source, { message: 'RSS स्रोत आयात रोका गया (Paused)' });
    } catch (err) {
      next(err);
    }
  };

  public disableSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req.user as any)?.roles || [];
      const source = await this.service.disableSource(req.params.id as string, roles);
      res.apiSuccess(source, { message: 'RSS स्रोत निष्क्रिय व अनधिकृत किया गया (Disabled)' });
    } catch (err) {
      next(err);
    }
  };

  public archiveSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req.user as any)?.roles || [];
      const source = await this.service.archiveSource(req.params.id as string, roles);
      res.apiSuccess(source, { message: 'RSS स्रोत संग्रहीत किया गया (Archived)' });
    } catch (err) {
      next(err);
    }
  };

  public reEnableSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req.user as any)?.roles || [];
      const source = await this.service.reEnableSource(req.params.id as string, roles);
      res.apiSuccess(source, { message: 'RSS स्रोत पुनः सक्रिय किया गया' });
    } catch (err) {
      next(err);
    }
  };

  public deleteSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req.user as any)?.roles || [];
      await this.service.deleteSource(req.params.id as string, roles);
      res.apiSuccess({ deleted: true }, { message: 'RSS स्रोत पूर्णतया हटाया गया' });
    } catch (err) {
      next(err);
    }
  };

  public validateFeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { url } = req.body;
      const result = await this.service.validateFeed(url);
      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  public syncSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req.user as any)?.roles || [];
      const result = await this.service.fetchAndIngest(req.params.id as string, roles);
      res.apiSuccess(result, { message: 'RSS फ़ीड सफलतापूर्वक सिंक एवं आयात की गई' });
    } catch (err) {
      next(err);
    }
  };

  public listImportedItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req.user as any)?.roles || [];
      const { rssSourceId, aiProcessingStatus, hasDraft, search, page, limit } = req.query;

      const result = await this.service.listImportedItems(
        {
          rssSourceId: rssSourceId as string,
          aiProcessingStatus: aiProcessingStatus as string,
          hasDraft: hasDraft !== undefined ? hasDraft === 'true' : undefined,
          search: search as string,
          page: page ? parseInt(page as string, 10) : undefined,
          limit: limit ? parseInt(limit as string, 10) : undefined,
        },
        roles
      );
      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  public getImportedItemById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req.user as any)?.roles || [];
      const item = await this.service.getImportedItemById(req.params.id as string, roles);
      res.apiSuccess(item);
    } catch (err) {
      next(err);
    }
  };

  public listStoryClusters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req.user as any)?.roles || [];
      const clusters = await this.service.listStoryClusters(roles);
      res.apiSuccess(clusters);
    } catch (err) {
      next(err);
    }
  };

  public getHealthSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req.user as any)?.roles || [];
      const health = await this.service.getHealthSummary(roles);
      res.apiSuccess(health);
    } catch (err) {
      next(err);
    }
  };
}

