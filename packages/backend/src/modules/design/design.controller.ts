/**
 * BREAKING NEWS WALA — Design & Graphics Studio Controller
 * Grounded in docs/13-API.md and docs/DECISIONS.md (DEC-025, DEC-026)
 */

import { Request, Response, NextFunction } from 'express';
import { DesignService } from './design.service';
import { AppError } from '../../errors/app-error';

export class DesignController {
  constructor(private service: DesignService) {}

  private getAuthUser(req: Request): { id: string; roles: string[] } {
    if (!req.user) {
      throw AppError.unauthorized('प्रमाणीकरण आवश्यक है।');
    }
    const roles: string[] = req.user.roles && req.user.roles.length > 0 ? req.user.roles : ['reporter'];
    return { id: req.user.id, roles };
  }

  private getParamId(req: Request, paramName = 'id'): string {
    const val = req.params[paramName];
    if (!val || typeof val !== 'string') {
      throw AppError.badRequest(`Parameter "${paramName}" is required.`);
    }
    return val;
  }

  // --- Design Document Endpoints ---

  public createDesign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const created = await this.service.createDesign(req.body, user);
      res.status(201).apiSuccess(created, { message: 'डिज़ाइन दस्तावेज़ सफलतापूर्वक सृजित हुआ।' });
    } catch (err) {
      next(err);
    }
  };

  public getDesign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const id = this.getParamId(req);
      const doc = await this.service.getDesign(id, user);
      res.apiSuccess(doc);
    } catch (err) {
      next(err);
    }
  };

  public updateDesign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const id = this.getParamId(req);
      const updated = await this.service.updateDesign(id, req.body, user);
      res.apiSuccess(updated, { message: 'डिज़ाइन दस्तावेज़ सफलतापूर्वक अद्यतित हुआ।' });
    } catch (err) {
      next(err);
    }
  };

  public duplicateDesign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const id = this.getParamId(req);
      const duplicated = await this.service.duplicateDesign(id, user, req.body?.title);
      res.status(201).apiSuccess(duplicated, { message: 'डिज़ाइन दस्तावेज़ सफलतापूर्वक प्रतिलिपिकृत हुआ।' });
    } catch (err) {
      next(err);
    }
  };

  public deleteDesign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const id = this.getParamId(req);
      const deleted = await this.service.deleteDesign(id, user);
      res.apiSuccess({ deleted }, { message: 'डिज़ाइन दस्तावेज़ सफलतापूर्वक हटा दिया गया।' });
    } catch (err) {
      next(err);
    }
  };

  public listDesigns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const studioType = req.query.studioType as any;
      const status = req.query.status as any;
      const search = req.query.search as string;

      const result = await this.service.listDesigns({ page, limit, studioType, status, search }, user);
      res.apiSuccess(result.designs, { page, limit, total: result.total });
    } catch (err) {
      next(err);
    }
  };

  public exportDesign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const id = this.getParamId(req);
      const exportResult = await this.service.exportDesign(
        {
          designId: id,
          format: req.body?.format || 'png',
          scaleFactor: req.body?.scaleFactor || 1,
          quality: req.body?.quality || 0.92,
        },
        user
      );
      res.status(201).apiSuccess(exportResult, { message: 'डिज़ाइन निर्यात तैयार है।' });
    } catch (err) {
      next(err);
    }
  };

  public generateAiConcept = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const concept = await this.service.generateAiConcept(req.body, user);
      res.apiSuccess(concept, { message: 'AI डिज़ाइन अवधारणा तैयार की गई।' });
    } catch (err) {
      next(err);
    }
  };

  public prefillFromArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const doc = await this.service.prefillFromArticle(
        req.body?.article,
        req.body?.studioType || 'graphic',
        user
      );
      res.status(201).apiSuccess(doc, { message: 'आलेख से डिज़ाइन प्री-फ़िल किया गया।' });
    } catch (err) {
      next(err);
    }
  };

  public getBrandProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const profile = await this.service.getBrandProfile(user);
      res.apiSuccess(profile);
    } catch (err) {
      next(err);
    }
  };

  // --- Template Endpoints ---

  public listTemplates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const category = req.query.category as string;
      const studioType = req.query.studioType as any;
      const search = req.query.search as string;

      const result = await this.service.listTemplates({ page, limit, category, studioType, search }, user);
      res.apiSuccess(result.templates, { page, limit, total: result.total });
    } catch (err) {
      next(err);
    }
  };

  public getTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const id = this.getParamId(req);
      const tpl = await this.service.getTemplate(id, user);
      res.apiSuccess(tpl);
    } catch (err) {
      next(err);
    }
  };

  // --- Admin Template Management Endpoints ---

  public createTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const created = await this.service.createTemplate(req.body, user);
      res.status(201).apiSuccess(created, { message: 'मास्टर टेम्पलेट सफलतापूर्वक सृजित हुआ।' });
    } catch (err) {
      next(err);
    }
  };

  public updateTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const id = this.getParamId(req);
      const updated = await this.service.updateTemplate(id, req.body, user);
      res.apiSuccess(updated, { message: 'मास्टर टेम्पलेट अद्यतित हुआ।' });
    } catch (err) {
      next(err);
    }
  };

  public archiveTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const id = this.getParamId(req);
      const archived = await this.service.archiveTemplate(id, user);
      res.apiSuccess(archived, { message: 'टेम्पलेट सफलतापूर्वक संग्रहीत (अक्रिय) कर दिया गया।' });
    } catch (err) {
      next(err);
    }
  };

  public publishTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const id = this.getParamId(req);
      const published = await this.service.publishTemplate(id, user);
      res.apiSuccess(published, { message: 'टेम्पलेट सफलतापूर्वक सक्रिय व प्रकाशित हुआ।' });
    } catch (err) {
      next(err);
    }
  };
}
