/**
 * BREAKING NEWS WALA — Admin Subsystem Controller Layer
 * Grounded in docs/13-API.md and docs/14-Auth.md
 */

import { Request, Response, NextFunction } from 'express';
import { adminService, AdminService } from './admin.service';

export class AdminController {
  constructor(private service: AdminService = adminService) {}

  public getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = req.user?.roles || [];
      const stats = await this.service.getDashboardStats(roles);
      res.apiSuccess(stats);
    } catch (err) {
      next(err);
    }
  };

  public listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = req.user?.roles || [];
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const role = req.query.role as string | undefined;

      const result = await this.service.listUsers(roles, { page, limit, search, status, role });
      res.apiSuccess(result.users, {
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  public getUserDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = req.user?.roles || [];
      const user = await this.service.getUserDetail(roles, req.params.id as string);
      res.apiSuccess(user);
    } catch (err) {
      next(err);
    }
  };

  public updateUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorId = req.user!.id;
      const roles = req.user?.roles || [];
      const { status, reason } = req.body;
      const updated = await this.service.updateUserStatus(actorId, roles, req.params.id as string, status, reason);
      res.apiSuccess(updated);
    } catch (err) {
      next(err);
    }
  };

  public listRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = req.user?.roles || [];
      const list = await this.service.listRoles(roles);
      res.apiSuccess(list);
    } catch (err) {
      next(err);
    }
  };

  public assignUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorId = req.user!.id;
      const roles = req.user?.roles || [];
      const { roleName } = req.body;
      const result = await this.service.assignUserRole(actorId, roles, req.params.id as string, roleName);
      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  public revokeUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorId = req.user!.id;
      const roles = req.user?.roles || [];
      const { roleName } = req.body;
      const result = await this.service.revokeUserRole(actorId, roles, req.params.id as string, roleName);
      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  public listReporters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = req.user?.roles || [];
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const districtId = req.query.districtId as string | undefined;

      const result = await this.service.listReporters(roles, { page, limit, search, status, districtId });
      res.apiSuccess(result.reporters, {
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  public getReporterDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = req.user?.roles || [];
      const rep = await this.service.getReporterDetail(roles, req.params.id as string);
      res.apiSuccess(rep);
    } catch (err) {
      next(err);
    }
  };

  public verifyReporter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorId = req.user!.id;
      const roles = req.user?.roles || [];
      const { status, reason } = req.body;
      const result = await this.service.verifyReporter(actorId, roles, req.params.id as string, status, reason);
      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  public assignReporterTerritory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorId = req.user!.id;
      const roles = req.user?.roles || [];
      const { locationId, assignmentType } = req.body;
      const result = await this.service.assignReporterTerritory(
        actorId,
        roles,
        req.params.id as string,
        locationId,
        assignmentType
      );
      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  public revokeReporterTerritory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorId = req.user!.id;
      const roles = req.user?.roles || [];
      const result = await this.service.revokeReporterTerritory(actorId, roles, req.params.assignmentId as string);
      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  public updateReporterTrust = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorId = req.user!.id;
      const roles = req.user?.roles || [];
      const { trustScore, canDirectPublish, isTrusted } = req.body;
      const result = await this.service.updateReporterTrust(
        actorId,
        roles,
        req.params.id as string,
        trustScore,
        canDirectPublish,
        isTrusted
      );
      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  public listAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = req.user?.roles || [];
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const actorId = req.query.actorId as string | undefined;
      const action = req.query.action as string | undefined;
      const targetType = req.query.targetType as string | undefined;

      const result = await this.service.listAuditLogs(roles, { page, limit, actorId, action, targetType });
      res.apiSuccess(result.logs, {
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  public listSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = req.user?.roles || [];
      const settings = await this.service.listSettings(roles);
      res.apiSuccess(settings);
    } catch (err) {
      next(err);
    }
  };

  public updateSetting = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorId = req.user!.id;
      const roles = req.user?.roles || [];
      const { value } = req.body;
      const updated = await this.service.updateSetting(actorId, roles, req.params.key as string, value);
      res.apiSuccess(updated);
    } catch (err) {
      next(err);
    }
  };
}

export const adminController = new AdminController();
