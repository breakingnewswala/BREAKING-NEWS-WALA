/**
 * BREAKING NEWS WALA — Integrations & Social Media Express Controller
 * Grounded in docs/13-API.md, docs/20-Integrations.md, docs/19-API-Pool.md
 */

import { Request, Response, NextFunction } from 'express';
import { IntegrationsService } from './integrations.service';
import { SocialPlatform } from '@bnw/types';

export class IntegrationsController {
  constructor(private service: IntegrationsService) {}

  // --- Provider Handlers ---
  public getProviders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = req.query.category as any;
      const providers = await this.service.getProviders(category);
      res.apiSuccess({ items: providers, total: providers.length });
    } catch (err) {
      next(err);
    }
  };

  public getProvider = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const provider = await this.service.getProvider(req.params.id as string);
      res.apiSuccess(provider);
    } catch (err) {
      next(err);
    }
  };

  public registerProvider = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req as any).user?.roles || ['admin'];
      const provider = await this.service.registerProvider(req.body, roles);
      res.apiSuccess(provider);
    } catch (err) {
      next(err);
    }
  };

  public updateProvider = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req as any).user?.roles || ['admin'];
      const provider = await this.service.updateProvider(req.params.id as string, req.body, roles);
      res.apiSuccess(provider);
    } catch (err) {
      next(err);
    }
  };

  public testProviderHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const provider = await this.service.testProviderHealth(req.params.id as string);
      res.apiSuccess(provider);
    } catch (err) {
      next(err);
    }
  };

  // --- Social Account Handlers ---
  public getSocialAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const platform = req.query.platform as SocialPlatform | undefined;
      const accounts = await this.service.getSocialAccounts(platform);
      res.apiSuccess({ items: accounts, total: accounts.length });
    } catch (err) {
      next(err);
    }
  };

  public getSocialAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const account = await this.service.getSocialAccount(req.params.id as string);
      res.apiSuccess(account);
    } catch (err) {
      next(err);
    }
  };

  public generateOAuthUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req as any).user?.roles || ['admin'];
      const platform = (req.params.platform || req.body.platform) as SocialPlatform;
      const redirectUri = req.query.redirectUri as string || req.body.redirectUri || 'http://localhost:3000/oauth/callback';
      const result = this.service.generateOAuthAuthorizationUrl(platform, redirectUri, roles);
      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  public handleOAuthCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req as any).user?.roles || ['admin'];
      const userId = (req as any).user?.id || 'usr-admin-system';
      const platform = req.params.platform as SocialPlatform;
      const { code, state } = req.body;
      const account = await this.service.handleOAuthCallback(platform, code, state, userId, roles);
      res.apiSuccess(account);
    } catch (err) {
      next(err);
    }
  };

  public connectSocialAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req as any).user?.roles || ['admin'];
      const userId = (req as any).user?.id || 'usr-admin-system';
      const account = await this.service.connectSocialAccount(req.body, userId, roles);
      res.apiSuccess(account);
    } catch (err) {
      next(err);
    }
  };

  public toggleSocialAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req as any).user?.roles || ['admin'];
      const { isActive } = req.body;
      const account = await this.service.toggleSocialAccount(req.params.id as string, isActive, roles);
      res.apiSuccess(account);
    } catch (err) {
      next(err);
    }
  };

  public disconnectSocialAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req as any).user?.roles || ['admin'];
      const account = await this.service.disconnectSocialAccount(req.params.id as string, roles);
      res.apiSuccess(account);
    } catch (err) {
      next(err);
    }
  };

  // --- Publishing Handlers ---
  public getPublishingJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = req.query.status as any;
      const jobs = await this.service.getPublishingJobs(status);
      res.apiSuccess({ items: jobs, total: jobs.length });
    } catch (err) {
      next(err);
    }
  };

  public getPublishingJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const job = await this.service.getPublishingJob(req.params.id as string);
      res.apiSuccess(job);
    } catch (err) {
      next(err);
    }
  };

  public createPublishingJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req as any).user?.roles || ['editor'];
      const userId = (req as any).user?.id || 'usr-editor-desk';
      const job = await this.service.createPublishingJob(req.body, userId, roles);
      res.apiSuccess(job);
    } catch (err) {
      next(err);
    }
  };

  public updatePublishingJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req as any).user?.roles || ['editor'];
      const job = await this.service.updatePublishingJob(req.params.id as string, req.body, roles);
      res.apiSuccess(job);
    } catch (err) {
      next(err);
    }
  };

  public approvePublishingJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req as any).user?.roles || ['editor'];
      const userId = (req as any).user?.id || 'usr-approver-editor';
      const job = await this.service.approvePublishingJob(req.params.id as string, userId, roles);
      res.apiSuccess(job);
    } catch (err) {
      next(err);
    }
  };

  public schedulePublishingJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req as any).user?.roles || ['editor'];
      const { scheduledAt } = req.body;
      const job = await this.service.schedulePublishingJob(req.params.id as string, scheduledAt, roles);
      res.apiSuccess(job);
    } catch (err) {
      next(err);
    }
  };

  public cancelPublishingJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req as any).user?.roles || ['editor'];
      const job = await this.service.cancelPublishingJob(req.params.id as string, roles);
      res.apiSuccess(job);
    } catch (err) {
      next(err);
    }
  };

  public publishImmediately = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req as any).user?.roles || ['editor'];
      const job = await this.service.publishImmediately(req.params.id as string, roles);
      res.apiSuccess(job);
    } catch (err) {
      next(err);
    }
  };

  public retryDelivery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = (req as any).user?.roles || ['editor'];
      const delivery = await this.service.retryDelivery(req.params.deliveryId as string, roles);
      res.apiSuccess(delivery);
    } catch (err) {
      next(err);
    }
  };

  // --- Webhook & Constraints Handlers ---
  public handleWebhookIngress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const providerId = (req.params.provider as string) || 'unknown';
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const signatureHeader =
        (req.headers['x-hub-signature-256'] as string) ||
        (req.headers['x-signature-256'] as string) ||
        (req.headers['x-telegram-bot-api-secret-token'] as string);
      const timestampHeader =
        (req.headers['x-request-timestamp'] as string) || (req.headers['date'] as string) || Date.now();
      const nonce = req.headers['x-request-nonce'] as string | undefined;

      const prov = await this.service.getProvider(providerId);
      const secret = prov.maskedCredential ? 'bnw-webhook-secret-key-prod' : 'dev-secret';

      const log = await this.service.processWebhook({
        providerId,
        rawBody,
        signatureHeader,
        timestampHeader,
        nonce,
        secret,
      });

      res.apiSuccess(log);
    } catch (err) {
      next(err);
    }
  };

  public getWebhookLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const logs = await this.service.getWebhookLogs(limit);
      res.apiSuccess({ items: logs, total: logs.length });
    } catch (err) {
      next(err);
    }
  };

  public getPlatformConstraints = (_req: Request, res: Response): void => {
    const constraints = this.service.getPlatformConstraints();
    res.apiSuccess(constraints);
  };
}

