/**
 * BREAKING NEWS WALA — Monetization Controller
 * Grounded in docs/13-API.md, docs/Monetization.md, and docs/DECISIONS.md
 */

import { Request, Response, NextFunction } from 'express';
import { MonetizationService } from './monetization.service';
import { AdPlacementCode } from '@bnw/types';
import { GOVERNANCE_INVARIANTS } from './monetization.constants';

export class MonetizationController {
  constructor(private service: MonetizationService) {}

  /**
   * Helper to enforce DEC-048: Block ROLE_CHIEF_EDITOR with 403 Forbidden
   */
  private checkPendingRole(req: Request, res: Response): boolean {
    const user = (req as any).user;
    if (user?.role === 'ROLE_CHIEF_EDITOR' || user?.roles?.includes('ROLE_CHIEF_EDITOR')) {
      res.status(403).json({
        success: false,
        error: {
          code: GOVERNANCE_INVARIANTS.DEC_048.errorCode,
          message: GOVERNANCE_INVARIANTS.DEC_048.notice,
        },
      });
      return false;
    }
    return true;
  }

  // ============================================================================
  // Public Ad Delivery & Tracking Endpoints
  // ============================================================================

  public serveAd = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slotCode = (req.query.slotCode || req.query.slot) as AdPlacementCode;
      if (!slotCode) {
        res.status(400).json({ success: false, error: { message: 'slotCode query parameter is required' } });
        return;
      }

      const targetDistrictId = (req.query.districtId || req.query.district) as string;
      const userAgent = req.headers['user-agent'] || '';
      const userId = (req as any).user?.id || (req.query.userId as string);

      const result = await this.service.serveAdForSlot(slotCode, {
        targetDistrictId,
        userAgent,
        userId,
      });

      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  public recordImpression = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { creativeId, adSlotCode, viewDurationMs, viewPercentage } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || '';

      const result = await this.service.recordImpression({
        creativeId,
        adSlotCode,
        viewDurationMs: Number(viewDurationMs || 0),
        viewPercentage: Number(viewPercentage || 0),
        ipAddress,
        userAgent,
      });

      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  public recordClick = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { creativeId, adSlotCode } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || '';

      const result = await this.service.recordClick({
        creativeId,
        adSlotCode,
        ipAddress,
        userAgent,
      });

      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================================
  // Subscription & Entitlement Endpoints (DEC-070 DEFERRED)
  // ============================================================================

  public getSubscriptionPlans = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const plans = await this.service.getSubscriptionPlans();
      res.apiSuccess({ items: plans, total: plans.length });
    } catch (err) {
      next(err);
    }
  };

  public getUserEntitlements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id || (req.query.userId as string);
      if (!userId) {
        res.apiSuccess({ items: [], total: 0 });
        return;
      }

      const entitlements = await this.service.getUserEntitlements(userId);
      res.apiSuccess({ items: entitlements, total: entitlements.length });
    } catch (err) {
      next(err);
    }
  };

  public initiateSubscriptionCheckout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id || 'usr-anon';
      const { planCode } = req.body;

      // This will throw ERR_SUBSCRIPTION_DEFERRED per DEC-070
      await this.service.initiateSubscriptionCheckout(userId, planCode);
    } catch (err: any) {
      if (err.message.startsWith('ERR_SUBSCRIPTION_DEFERRED')) {
        res.status(403).json({
          success: false,
          error: {
            code: 'ERR_SUBSCRIPTION_DEFERRED',
            message: err.message,
          },
        });
        return;
      }
      next(err);
    }
  };

  public redeemCoinPerk = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id || req.body.userId;
      const { perkCode, durationHours } = req.body;

      if (!userId || !perkCode) {
        res.status(400).json({ success: false, error: { message: 'userId and perkCode are required' } });
        return;
      }

      const entitlement = await this.service.grantPerkEntitlement(userId, perkCode, durationHours || 24);
      res.apiSuccess({
        success: true,
        entitlement,
        notice: GOVERNANCE_INVARIANTS.DEC_007.notice,
      });
    } catch (err) {
      next(err);
    }
  };

  // ============================================================================
  // Referral Tracking Endpoint (RULE-REWARD-002 PENDING APPROVAL)
  // ============================================================================

  public trackReferral = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { referrerCode, referredUserId } = req.body;
      if (!referrerCode || !referredUserId) {
        res.status(400).json({ success: false, error: { message: 'referrerCode and referredUserId are required' } });
        return;
      }

      const result = await this.service.trackReferral({ referrerCode, referredUserId });
      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================================
  // Payment Webhook Ingress (DEC-068)
  // ============================================================================

  public handlePaymentWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const signature = (req.headers['x-razorpay-signature'] as string) || '';
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

      const result = await this.service.processPaymentWebhook(rawBody, signature);
      if (!result.success) {
        res.status(400).json({ success: false, error: { message: result.error } });
        return;
      }

      res.apiSuccess({ received: true, event: result.event });
    } catch (err) {
      next(err);
    }
  };

  // ============================================================================
  // Admin Monetization Endpoints
  // ============================================================================

  public getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const stats = await this.service.getDashboardStats();
      res.apiSuccess(stats);
    } catch (err) {
      next(err);
    }
  };

  public getAdvertisers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const advertisers = await this.service.getAdvertisers();
      res.apiSuccess({ items: advertisers, total: advertisers.length });
    } catch (err) {
      next(err);
    }
  };

  public getAdvertiser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const advertiser = await this.service.getAdvertiser(req.params.id as string);
      res.apiSuccess(advertiser);
    } catch (err) {
      next(err);
    }
  };

  public createAdvertiser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const advertiser = await this.service.createAdvertiser(req.body);
      res.apiSuccess(advertiser);
    } catch (err) {
      next(err);
    }
  };

  public updateAdvertiser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const advertiser = await this.service.updateAdvertiser(req.params.id as string, req.body);
      res.apiSuccess(advertiser);
    } catch (err) {
      next(err);
    }
  };

  public verifyAdvertiser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const advertiser = await this.service.verifyAdvertiser(req.params.id as string);
      res.apiSuccess(advertiser);
    } catch (err) {
      next(err);
    }
  };

  public suspendAdvertiser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const reason = req.body.reason || 'Administrative suspension';
      const advertiser = await this.service.suspendAdvertiser(req.params.id as string, reason);
      res.apiSuccess(advertiser);
    } catch (err) {
      next(err);
    }
  };

  public getCampaigns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const advertiserId = req.query.advertiserId as string;
      const status = req.query.status as string;
      const campaigns = await this.service.getCampaigns({ advertiserId, status });
      res.apiSuccess({ items: campaigns, total: campaigns.length });
    } catch (err) {
      next(err);
    }
  };

  public getCampaign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const campaign = await this.service.getCampaign(req.params.id as string);
      res.apiSuccess(campaign);
    } catch (err) {
      next(err);
    }
  };

  public createCampaign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const campaign = await this.service.createCampaign(req.body);
      res.apiSuccess(campaign);
    } catch (err) {
      next(err);
    }
  };

  public updateCampaign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const campaign = await this.service.updateCampaign(req.params.id as string, req.body);
      res.apiSuccess(campaign);
    } catch (err) {
      next(err);
    }
  };

  public submitCampaign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const campaign = await this.service.submitCampaignForApproval(req.params.id as string);
      res.apiSuccess(campaign);
    } catch (err) {
      next(err);
    }
  };

  public approveCampaign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const approverUserId = (req as any).user?.id || 'usr-admin-bhopal';
      const notes = req.body.notes;
      const campaign = await this.service.approveCampaign(req.params.id as string, approverUserId, notes);
      res.apiSuccess(campaign);
    } catch (err) {
      next(err);
    }
  };

  public rejectCampaign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const approverUserId = (req as any).user?.id || 'usr-admin-bhopal';
      const reason = req.body.reason || 'Policy violation or incomplete documentation';
      const campaign = await this.service.rejectCampaign(req.params.id as string, approverUserId, reason);
      res.apiSuccess(campaign);
    } catch (err) {
      next(err);
    }
  };

  public pauseCampaign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const campaign = await this.service.pauseCampaign(req.params.id as string);
      res.apiSuccess(campaign);
    } catch (err) {
      next(err);
    }
  };

  public resumeCampaign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const campaign = await this.service.resumeCampaign(req.params.id as string);
      res.apiSuccess(campaign);
    } catch (err) {
      next(err);
    }
  };

  public getCreatives = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const campaignId = req.query.campaignId as string;
      const creatives = await this.service.getCreatives(campaignId);
      res.apiSuccess({ items: creatives, total: creatives.length });
    } catch (err) {
      next(err);
    }
  };

  public createCreative = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const creative = await this.service.createCreative(req.body);
      res.apiSuccess(creative);
    } catch (err) {
      next(err);
    }
  };

  public approveCreative = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const approverUserId = (req as any).user?.id || 'usr-admin-bhopal';
      const creative = await this.service.approveCreative(req.params.id as string, approverUserId);
      res.apiSuccess(creative);
    } catch (err) {
      next(err);
    }
  };

  public rejectCreative = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const reason = req.body.reason || 'Creative does not meet editorial quality guidelines';
      const creative = await this.service.rejectCreative(req.params.id as string, reason);
      res.apiSuccess(creative);
    } catch (err) {
      next(err);
    }
  };

  public getPlacementSlots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const slots = await this.service.getPlacementSlots();
      res.apiSuccess({ items: slots, total: slots.length });
    } catch (err) {
      next(err);
    }
  };

  public getInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const advertiserId = req.query.advertiserId as string;
      const invoices = await this.service.getInvoices(advertiserId);
      res.apiSuccess({ items: invoices, total: invoices.length });
    } catch (err) {
      next(err);
    }
  };

  public getInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const invoice = await this.service.getInvoice(req.params.id as string);
      res.apiSuccess(invoice);
    } catch (err) {
      next(err);
    }
  };

  public createInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const invoice = await this.service.createInvoice(req.body);
      res.apiSuccess(invoice);
    } catch (err) {
      next(err);
    }
  };

  public createPaymentOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const { advertiserId, campaignId, amountMinorUnits, idempotencyKey } = req.body;
      const result = await this.service.createPaymentOrder({
        advertiserId,
        campaignId,
        amountMinorUnits: Number(amountMinorUnits),
        idempotencyKey: idempotencyKey || `idemp-${Date.now()}`,
      });
      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  public getReferralAttributions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.checkPendingRole(req, res)) return;
      const referrerUserId = req.query.referrerUserId as string;
      const attributions = await this.service.getReferralAttributions(referrerUserId);
      res.apiSuccess({
        items: attributions,
        total: attributions.length,
        governanceNotice: GOVERNANCE_INVARIANTS.RULE_REWARD_002.notice,
      });
    } catch (err) {
      next(err);
    }
  };
}

