/**
 * BREAKING NEWS WALA — Video Studio Controller
 * Grounded in docs/11-Architecture.md, docs/12-Database.md (DOM-I),
 * docs/13-API.md, and docs/DECISIONS.md (DEC-048, DEC-060)
 */

import { Request, Response, NextFunction } from 'express';
import { VideoService } from './video.service';
import { AppError } from '../../errors/app-error';

export class VideoController {
  private service: VideoService;

  constructor(service?: VideoService) {
    this.service = service || new VideoService();
  }

  private getAuthUser(req: Request): { id: string; roles: string[] } {
    if (!req.user) {
      throw AppError.unauthorized('प्रमाणीकरण आवश्यक है।');
    }
    const roles: string[] =
      req.user.roles && req.user.roles.length > 0 ? req.user.roles : ['reporter'];
    return { id: req.user.id, roles };
  }

  private getParam(req: Request, paramName: string): string {
    const val = req.params[paramName];
    if (!val || typeof val !== 'string') {
      throw AppError.badRequest(`पैरामीटर "${paramName}" आवश्यक है।`);
    }
    return val;
  }

  public createProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const project = await this.service.createProject(req.body, user.id, user.roles);
      res.status(201).apiSuccess(project, { message: 'वीडियो प्रोजेक्ट सृजित हुआ' });
    } catch (err) {
      next(err);
    }
  };

  public getProjectById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const id = this.getParam(req, 'id');
      const project = await this.service.getProjectById(id, user.roles);
      res.apiSuccess(project);
    } catch (err) {
      next(err);
    }
  };

  public listProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const { creatorId, status, aspectRatio, search, page, limit } = req.query;
      const result = await this.service.listProjects(
        {
          creatorId: creatorId as string,
          status: status as string,
          aspectRatio: aspectRatio as any,
          search: search as string,
          page: page ? parseInt(page as string, 10) : undefined,
          limit: limit ? parseInt(limit as string, 10) : undefined,
        },
        user.roles
      );
      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  public updateProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const id = this.getParam(req, 'id');
      const updated = await this.service.updateProject(id, req.body, user.roles);
      res.apiSuccess(updated);
    } catch (err) {
      next(err);
    }
  };

  public deleteProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const id = this.getParam(req, 'id');
      await this.service.deleteProject(id, user.roles);
      res.apiSuccess({ deleted: true });
    } catch (err) {
      next(err);
    }
  };

  public prefillFromArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const project = await this.service.prefillFromArticle(req.body, user.id, user.roles);
      res.status(201).apiSuccess(project, { message: 'आलेख से वीडियो प्रीफ़िल सफल' });
    } catch (err) {
      next(err);
    }
  };

  public addClip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const projectId = this.getParam(req, 'id');
      const { trackId, clip } = req.body;
      const updated = await this.service.addClip(projectId, trackId, clip, user.roles);
      res.apiSuccess(updated);
    } catch (err) {
      next(err);
    }
  };

  public removeClip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const projectId = this.getParam(req, 'id');
      const clipId = this.getParam(req, 'clipId');
      const { trackId } = req.body;
      const updated = await this.service.removeClip(projectId, trackId, clipId, user.roles);
      res.apiSuccess(updated);
    } catch (err) {
      next(err);
    }
  };

  public trimClip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const projectId = this.getParam(req, 'id');
      const clipId = this.getParam(req, 'clipId');
      const { trackId, trimIn, trimOut } = req.body;
      const updated = await this.service.trimClip(
        projectId,
        trackId,
        clipId,
        trimIn,
        trimOut,
        user.roles
      );
      res.apiSuccess(updated);
    } catch (err) {
      next(err);
    }
  };

  public splitClip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const projectId = this.getParam(req, 'id');
      const clipId = this.getParam(req, 'clipId');
      const { trackId, splitTimeSec } = req.body;
      const updated = await this.service.splitClip(
        projectId,
        trackId,
        clipId,
        splitTimeSec,
        user.roles
      );
      res.apiSuccess(updated);
    } catch (err) {
      next(err);
    }
  };

  public listTemplates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category, aspectRatio, search, isActive } = req.query;
      const templates = await this.service.listTemplates({
        category: category as string,
        aspectRatio: aspectRatio as any,
        search: search as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      });
      res.apiSuccess(templates);
    } catch (err) {
      next(err);
    }
  };

  public getTemplateById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = this.getParam(req, 'id');
      const template = await this.service.getTemplateById(id);
      res.apiSuccess(template);
    } catch (err) {
      next(err);
    }
  };

  public createTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const template = await this.service.createTemplate(req.body, user.roles);
      res.status(201).apiSuccess(template, { message: 'टेम्पलेट सृजित हुआ' });
    } catch (err) {
      next(err);
    }
  };

  public updateTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const id = this.getParam(req, 'id');
      const template = await this.service.updateTemplate(id, req.body, user.roles);
      res.apiSuccess(template);
    } catch (err) {
      next(err);
    }
  };

  public submitRenderJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const job = await this.service.submitRenderJob(req.body, user.roles);
      res.status(202).apiSuccess(job, { message: 'रेंडरिंग कार्य कतारबद्ध हुआ' });
    } catch (err) {
      next(err);
    }
  };

  public getRenderJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const jobId = this.getParam(req, 'jobId');
      const job = await this.service.getRenderJob(jobId, user.roles);
      res.apiSuccess(job);
    } catch (err) {
      next(err);
    }
  };

  public listRenderJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const { projectId, status, limit, offset } = req.query;
      const jobs = await this.service.listRenderJobs(
        {
          projectId: projectId as string,
          status: status as any,
          limit: limit ? parseInt(limit as string, 10) : undefined,
          offset: offset ? parseInt(offset as string, 10) : undefined,
        },
        user.roles
      );
      res.apiSuccess(jobs);
    } catch (err) {
      next(err);
    }
  };

  public cancelRenderJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const jobId = this.getParam(req, 'jobId');
      const job = await this.service.cancelRenderJob(jobId, user.roles);
      res.apiSuccess(job);
    } catch (err) {
      next(err);
    }
  };

  public generateAiScript = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const script = await this.service.generateAiScript(req.body, user.roles);
      res.apiSuccess(script);
    } catch (err) {
      next(err);
    }
  };

  public suggestLowerThirds = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const result = await this.service.suggestLowerThirds(req.body, user.roles);
      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  public exportSubtitles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const projectId = this.getParam(req, 'id');
      const format = (req.query.format as 'srt' | 'vtt') || 'srt';
      const output = await this.service.exportSubtitles(projectId, format, user.roles);

      res.setHeader('Content-Type', format === 'vtt' ? 'text/vtt' : 'application/x-subrip');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="subtitles-${projectId}.${format}"`
      );
      res.send(output);
    } catch (err) {
      next(err);
    }
  };

  public importSubtitles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getAuthUser(req);
      const projectId = this.getParam(req, 'id');
      const { srtContent } = req.body;
      const updated = await this.service.importSubtitles(projectId, srtContent, user.roles);
      res.apiSuccess(updated);
    } catch (err) {
      next(err);
    }
  };

  public getHealth = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const health = await this.service.getInfrastructureHealth();
      res.apiSuccess(health);
    } catch (err) {
      next(err);
    }
  };
}
