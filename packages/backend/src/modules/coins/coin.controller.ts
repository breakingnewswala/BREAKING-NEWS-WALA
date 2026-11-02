/**
 * BREAKING NEWS WALA — Coin Ledger & Rewards Controller
 * Grounded in docs/13-API.md (COIN-01, COIN-02), docs/DECISIONS.md (DEC-026),
 * and prompt Section 9.
 */

import { Request, Response, NextFunction } from 'express';
import { coinService, CoinService } from './coin.service';

export class CoinController {
  constructor(private readonly service: CoinService = coinService) {}

  /**
   * Retrieves the authenticated user's coin wallet balance & metadata (COIN-01).
   */
  public getWallet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const wallet = await this.service.getWallet(userId);
      res.apiSuccess(wallet);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Retrieves paginated transaction ledger history for citizen (COIN-02).
   */
  public getTransactionHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { page, limit, transactionType, direction, startDate, endDate } = req.query;

      const result = await this.service.getTransactionHistory(userId, {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        transactionType: transactionType as string,
        direction: direction as any,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      res.apiSuccess(result.items, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Retrieves detail for a specific transaction (COIN-02 Detail).
   */
  public getTransactionDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const id = req.params.id as string;
      const tx = await this.service.getTransactionDetail(userId, id);
      res.apiSuccess(tx);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Retrieves non-monetary rewards & perks catalog with daily quota status.
   */
  public getRewards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const catalog = await this.service.getRewardCatalog(userId);
      res.apiSuccess(catalog);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Retrieves citizen's referral code, shareable link, and referred count.
   */
  public getReferral = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const summary = await this.service.getReferralSummary(userId);
      res.apiSuccess(summary);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Applies an invite referral code.
   */
  public applyReferral = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { referralCode } = req.body;
      const result = await this.service.applyReferral(userId, referralCode);
      res.apiSuccess(result, { message: 'Referral bonus successfully applied.' });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Credits coins to user's wallet (internal engagement event hook).
   */
  public creditCoins = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const result = await this.service.creditCoins(userId, req.body);
      res.statusCode = 201;
      res.apiSuccess(result, { statusCode: 201 });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Debits coins from user's wallet (digital perk redemption).
   */
  public debitCoins = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const result = await this.service.debitCoins(userId, req.body);
      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Administrative coin adjustment (Section 8).
   */
  public adminAdjust = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = (req as any).user.id;
      const adminRoles = (req as any).user.roles || [];
      const result = await this.service.adminAdjustCoins(adminId, adminRoles, req.body);
      res.apiSuccess(result, { message: 'Administrative coin adjustment executed.' });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Administrative compensating transaction reversal (Section 3).
   */
  public compensate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = (req as any).user.id;
      const adminRoles = (req as any).user.roles || [];
      const id = req.params.id as string;
      const { reason } = req.body || {};
      const result = await this.service.compensateTransaction(adminId, adminRoles, id, reason || 'Administrative correction');
      res.apiSuccess(result, { message: 'Compensating transaction executed.' });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Administrative view of a target user's wallet.
   */
  public getAdminUserWallet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.userId as string;
      const wallet = await this.service.getWallet(userId);
      res.apiSuccess(wallet);
    } catch (err) {
      next(err);
    }
  };
}

export const coinController = new CoinController();
