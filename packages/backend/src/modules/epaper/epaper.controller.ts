/**
 * BREAKING NEWS WALA — E-Paper Controller
 * Exposes public archive/reader endpoints and protected editorial/admin endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { EpaperService, getEpaperService } from './epaper.service';
import { EpaperArchiveFilter, EpaperEditionStatus } from './types';

export class EpaperController {
  constructor(private readonly service: EpaperService = getEpaperService()) {}

  // ==========================================
  // PUBLIC CONTROLLER METHODS
  // ==========================================

  public getPublicEditions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter: EpaperArchiveFilter = {
        date: req.query.date as string | undefined,
        districtId: req.query.districtId as string | undefined,
        editionType: req.query.editionType as any,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
      };

      const result = await this.service.getPublicEditions(filter);
      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  public getLatestEdition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const districtId = req.query.districtId as string | undefined;
      const data = await this.service.getLatestPublicEdition(districtId);
      res.apiSuccess(data);
    } catch (err) {
      next(err);
    }
  };

  public getPublicEditionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const data = await this.service.getPublicEditionById(id);
      res.apiSuccess(data);
    } catch (err) {
      next(err);
    }
  };

  public recordView = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      await this.service.recordView(id);
      res.apiSuccess({ success: true, message: 'View recorded.' });
    } catch (err) {
      next(err);
    }
  };

  public recordDownload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      await this.service.recordDownload(id);
      res.apiSuccess({ success: true, message: 'Download recorded.' });
    } catch (err) {
      next(err);
    }
  };

  // ==========================================
  // PROTECTED ADMIN / EDITORIAL METHODS
  // ==========================================

  public getAllEditionsAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const filter: EpaperArchiveFilter & { status?: EpaperEditionStatus } = {
        status: req.query.status as EpaperEditionStatus | undefined,
        date: req.query.date as string | undefined,
        districtId: req.query.districtId as string | undefined,
        editionType: req.query.editionType as any,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      };

      const result = await this.service.getAllEditionsAdmin(filter, user?.roles || []);
      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  public getEditionByIdAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const id = req.params.id as string;
      const data = await this.service.getEditionByIdAdmin(id, user?.roles || []);
      res.apiSuccess(data);
    } catch (err) {
      next(err);
    }
  };

  public createEdition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const data = await this.service.createEdition(req.body, user?.id || 'usr-admin-001', user?.roles || []);
      res.apiSuccess(data, { message: 'E-Paper edition created successfully.' }, 201);
    } catch (err) {
      next(err);
    }
  };

  public updateEdition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const id = req.params.id as string;
      const data = await this.service.updateEdition(id, req.body, user?.roles || []);
      res.apiSuccess(data, { message: 'E-Paper edition updated successfully.' });
    } catch (err) {
      next(err);
    }
  };

  public transitionStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const id = req.params.id as string;
      const { targetStatus } = req.body;
      const data = await this.service.transitionStatus(id, targetStatus, user?.id || 'usr-admin-001', user?.roles || []);
      res.apiSuccess(data, { message: `Edition status transitioned to ${targetStatus}.` });
    } catch (err) {
      next(err);
    }
  };

  public addPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const id = req.params.id as string;
      const data = await this.service.addPage(id, req.body, user?.roles || []);
      res.apiSuccess(data, { message: 'Page added to edition successfully.' }, 201);
    } catch (err) {
      next(err);
    }
  };

  public deleteEdition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const id = req.params.id as string;
      const result = await this.service.deleteEdition(id, user?.roles || []);
      res.apiSuccess(result, { message: 'Edition deleted successfully.' });
    } catch (err) {
      next(err);
    }
  };
}

export const epaperController = new EpaperController();
