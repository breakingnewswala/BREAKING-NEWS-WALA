/**
 * BREAKING NEWS WALA — Automation Engine Controller
 * Grounded in docs/13-API.md and docs/DECISIONS.md (DEC-026, DEC-048)
 */

import { Request, Response, NextFunction } from 'express';
import { AutomationService } from './automation.service';

export class AutomationController {
  constructor(private service: AutomationService) { }

  public listRules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req.user as any)?.roles || [];
      const { status } = req.query;
      const rules = await this.service.listRules(status as string, roles);
      res.apiSuccess({ items: rules, total: rules.length });
    } catch (err) {
      next(err);
    }
  };

  public getRuleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req.user as any)?.roles || [];
      const rule = await this.service.getRuleById(req.params.id as string, roles);
      res.apiSuccess(rule);
    } catch (err) {
      next(err);
    }
  };

  public createRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req.user as any)?.roles || [];
      const creatorId = (req.user as any)?.id || 'usr-admin';
      const rule = await this.service.createRule(req.body, creatorId, roles);
      res.status(201).apiSuccess(rule, { message: 'ऑटोमेशन नियम सफलतापूर्वक बनाया गया' });
    } catch (err) {
      next(err);
    }
  };

  public updateRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req.user as any)?.roles || [];
      const rule = await this.service.updateRule(req.params.id as string, req.body, roles);
      res.apiSuccess(rule, { message: 'ऑटोमेशन नियम अद्यतन किया गया' });
    } catch (err) {
      next(err);
    }
  };

  public toggleRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req.user as any)?.roles || [];
      const rule = await this.service.toggleRule(req.params.id as string, roles);
      res.apiSuccess(rule, { message: `नियम स्थिति परिवर्तित: ${rule.status}` });
    } catch (err) {
      next(err);
    }
  };

  public deleteRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req.user as any)?.roles || [];
      await this.service.deleteRule(req.params.id as string, roles);
      res.apiSuccess({ deleted: true }, { message: 'ऑटोमेशन नियम हटाया गया' });
    } catch (err) {
      next(err);
    }
  };

  public listExecutionLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req.user as any)?.roles || [];
      const { limit } = req.query;
      const logs = await this.service.listExecutionLogs(limit ? parseInt(limit as string, 10) : 50, roles);
      res.apiSuccess({ items: logs, total: logs.length });
    } catch (err) {
      next(err);
    }
  };

  public triggerManual = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req.user as any)?.roles || [];
      const { triggerType, entityId, entityData } = req.body;
      const logs = await this.service.dispatchEvent(triggerType, entityId, entityData, 1, roles);
      res.apiSuccess({ logs }, { message: 'ऑटोमेशन ट्रिगर निष्पादित किया गया' });
    } catch (err) {
      next(err);
    }
  };
}
