/**
 * BREAKING NEWS WALA — Coin Ledger & Rewards Domain Service
 * Grounded in docs/Monetization.md (Section 11), docs/DECISIONS.md (DEC-007),
 * docs/06-Business-Rules.md (RULE-REWARD-001, RULE-REWARD-002, RULE-REWARD-003),
 * and docs/13-API.md (COIN-01, COIN-02).
 */

import crypto from 'crypto';
import { AppError } from '../../errors/app-error';
import { logger } from '../../middleware/structured-logger';
import { ArticleWorkflowEngine } from '../articles/article.workflow';
import {
  APPROVED_DIGITAL_PERKS,
  COIN_LIMITS,
  TRANSACTION_TYPES,
} from './coin.constants';
import { getCoinRepository, ICoinRepository } from './coin.repository';
import {
  AdminAdjustCoinsDto,
  CoinTransactionEntity,
  CoinWalletEntity,
  CreditCoinsDto,
  DailyEarningSummary,
  DebitCoinsDto,
  PaginatedTransactionsResult,
  RewardCatalogItem,
  TransactionFilterParams,
} from './types';

export class CoinService {
  private customRepo?: ICoinRepository;

  constructor(repo?: ICoinRepository) {
    this.customRepo = repo;
  }

  private get repo(): ICoinRepository {
    return this.customRepo || getCoinRepository();
  }

  /**
   * Helper to format current date in Indian Standard Time (YYYY-MM-DD)
   */
  public getIstDateKey(): string {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const istDate = new Date(utc + 3600000 * 5.5);
    return istDate.toISOString().slice(0, 10);
  }

  /**
   * Generates a unique, non-colliding human-readable referral code (e.g. BNW-7F3A92).
   */
  public generateReferralCode(): string {
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${COIN_LIMITS.REFERRAL_CODE_PREFIX}${rand}`;
  }

  /**
   * Lazy initializes or retrieves a user's wallet.
   */
  public async getOrCreateWallet(userId: string): Promise<CoinWalletEntity> {
    const existing = await this.repo.findWalletByUserId(userId);
    if (existing) {
      return existing;
    }

    // Generate unique referral code with collision retry loop
    let referralCode = this.generateReferralCode();
    let collision = await this.repo.findWalletByReferralCode(referralCode);
    let attempts = 0;

    while (collision && attempts < 5) {
      referralCode = this.generateReferralCode();
      collision = await this.repo.findWalletByReferralCode(referralCode);
      attempts++;
    }

    const created = await this.repo.createWallet({
      userId,
      referralCode,
      referredByUserId: null,
    });

    logger.info(`[Coins] Created new coin wallet for citizen "${userId}" with referral code "${referralCode}".`);
    return created;
  }

  /**
   * Retrieves authoritative wallet balance and metadata (COIN-01).
   */
  public async getWallet(userId: string): Promise<CoinWalletEntity> {
    return this.getOrCreateWallet(userId);
  }

  /**
   * Retrieves paginated transaction history for the authenticated user (COIN-02).
   */
  public async getTransactionHistory(
    userId: string,
    params: TransactionFilterParams
  ): Promise<PaginatedTransactionsResult> {
    // Ensure wallet exists
    await this.getOrCreateWallet(userId);
    return this.repo.findTransactionsByUserId(userId, params);
  }

  /**
   * Retrieves specific transaction details with strict user isolation.
   */
  public async getTransactionDetail(
    userId: string,
    transactionId: string
  ): Promise<CoinTransactionEntity> {
    const tx = await this.repo.findTransactionById(transactionId);
    if (!tx) {
      throw AppError.notFound(`Transaction "${transactionId}" not found.`);
    }

    // Strict cross-user boundary: cannot view transactions belonging to other citizens
    if (tx.walletUserId !== userId) {
      throw AppError.forbidden('You are not authorized to view this transaction.');
    }

    return tx;
  }

  /**
   * Credits engagement coins to user's wallet.
   * Enforces Idempotency, Velocity Caps, Daily Limits (50/day), and Integer Arithmetic.
   */
  public async creditCoins(
    userId: string,
    dto: CreditCoinsDto
  ): Promise<{ wallet: CoinWalletEntity; transaction: CoinTransactionEntity; grantedAmount: number }> {
    // 1. Idempotency Check (Financial Integrity Invariant)
    const existingRecord = await this.repo.getIdempotencyRecord(dto.idempotencyKey);
    if (existingRecord) {
      logger.info(`[Coins] Idempotent replay detected for key "${dto.idempotencyKey}". Returning existing transaction.`);
      const wallet = await this.getOrCreateWallet(userId);
      return {
        wallet,
        transaction: existingRecord.response.transaction,
        grantedAmount: existingRecord.response.grantedAmount,
      };
    }

    // 2. Velocity Rate Limiting (RULE-REWARD-003)
    const recentActionCount = await this.repo.getRecentActionCount(userId, COIN_LIMITS.VELOCITY_WINDOW_MS);
    if (recentActionCount >= COIN_LIMITS.MAX_VELOCITY_ACTIONS_PER_MINUTE) {
      logger.warn(`[Coins] Velocity cap exceeded for citizen "${userId}". Suspicious activity held in escrow.`);
      throw AppError.tooManyRequests(
        'High frequency engagement activity detected. Action held in fraud escrow (RULE-REWARD-003).'
      );
    }

    // 3. Daily Earning Cap Enforcement (DEC-007, docs/Monetization.md Section 11.2)
    const dateKey = this.getIstDateKey();
    const currentDaily = await this.repo.getDailyEarnedCoins(userId, dateKey);
    if (currentDaily >= COIN_LIMITS.MAX_DAILY_EARNED_COINS) {
      throw AppError.conflict(
        `Daily coin earning limit of ${COIN_LIMITS.MAX_DAILY_EARNED_COINS} coins reached for today (DEC-007).`
      );
    }

    // Calculate actual granted amount under the daily cap ceiling
    const allowableGrant = Math.min(dto.amount, COIN_LIMITS.MAX_DAILY_EARNED_COINS - currentDaily);
    if (allowableGrant <= 0) {
      throw AppError.conflict('Daily coin quota exhausted for today.');
    }

    // 4. Ensure wallet exists
    await this.getOrCreateWallet(userId);

    // 5. Atomic Balance Update: Credit available balance and increment lifetime earned
    const updatedWallet = await this.repo.updateWalletBalance(userId, allowableGrant, allowableGrant);

    // 6. Append Immutable Transaction Ledger Entry
    const tx = await this.repo.createTransaction({
      walletUserId: userId,
      amount: allowableGrant,
      direction: 'credit',
      transactionType: dto.transactionType,
      status: 'completed',
      description: dto.description || 'Engagement reward credit',
      referenceEntityId: dto.referenceEntityId || null,
      referenceType: dto.referenceType || null,
      idempotencyKey: dto.idempotencyKey,
      adminActorId: null,
    });

    // 7. Track daily earnings & action timestamps
    await this.repo.recordDailyEarnedCoins(userId, dateKey, allowableGrant);
    await this.repo.recordActionTimestamp(userId);

    // 8. Save Idempotency Record
    const result = {
      wallet: updatedWallet,
      transaction: tx,
      grantedAmount: allowableGrant,
    };

    await this.repo.saveIdempotencyRecord({
      idempotencyKey: dto.idempotencyKey,
      userId,
      actionType: 'credit',
      transactionId: tx.id,
      response: result,
      createdAt: new Date(),
    });

    return result;
  }

  /**
   * Debits coins from user's wallet (e.g. for digital perks).
   * Enforces Balance Sufficiency, Zero Negative Balances, and Idempotency.
   */
  public async debitCoins(
    userId: string,
    dto: DebitCoinsDto
  ): Promise<{ wallet: CoinWalletEntity; transaction: CoinTransactionEntity }> {
    // 1. Idempotency Check
    const existingRecord = await this.repo.getIdempotencyRecord(dto.idempotencyKey);
    if (existingRecord) {
      logger.info(`[Coins] Idempotent replay detected for debit key "${dto.idempotencyKey}".`);
      const wallet = await this.getOrCreateWallet(userId);
      return {
        wallet,
        transaction: existingRecord.response.transaction,
      };
    }

    // 2. Wallet & Balance Verification
    const wallet = await this.getOrCreateWallet(userId);
    if (wallet.balanceCoins < dto.amount) {
      throw AppError.conflict(
        `Insufficient coin balance. Current balance is ${wallet.balanceCoins} coins, requested ${dto.amount}.`
      );
    }

    // 3. Atomic Balance Update: Debit available balance (lifetime earned remains untouched)
    const updatedWallet = await this.repo.updateWalletBalance(userId, -dto.amount, 0);

    // 4. Append Immutable Transaction Ledger Entry
    const tx = await this.repo.createTransaction({
      walletUserId: userId,
      amount: dto.amount,
      direction: 'debit',
      transactionType: dto.transactionType,
      status: 'completed',
      description: dto.description || 'Perk redemption debit',
      referenceEntityId: dto.referenceEntityId || null,
      referenceType: dto.referenceType || null,
      idempotencyKey: dto.idempotencyKey,
      adminActorId: null,
    });

    // 5. Save Idempotency Record
    const result = {
      wallet: updatedWallet,
      transaction: tx,
    };

    await this.repo.saveIdempotencyRecord({
      idempotencyKey: dto.idempotencyKey,
      userId,
      actionType: 'debit',
      transactionId: tx.id,
      response: result,
      createdAt: new Date(),
    });

    return result;
  }

  /**
   * Administrative manual coin adjustment (Section 8).
   * Requires strict server-side RBAC, auditable reason, and zero negative balances.
   */
  public async adminAdjustCoins(
    adminId: string,
    adminRoles: string[],
    dto: AdminAdjustCoinsDto
  ): Promise<{ wallet: CoinWalletEntity; transaction: CoinTransactionEntity }> {
    // 1. Server-Side RBAC Enforcement
    const isAuthorized =
      ArticleWorkflowEngine.isElevatedEditor(adminRoles) ||
      adminRoles.some((r) => {
        const clean = r.toUpperCase().replace(/^ROLE_/, '');
        return clean === 'ADMIN' || clean === 'SUPER_ADMIN';
      });

    if (!isAuthorized) {
      throw AppError.forbidden('Only Platform Administrators hold authority to perform coin adjustments.');
    }

    // 2. Idempotency Check
    const existingRecord = await this.repo.getIdempotencyRecord(dto.idempotencyKey);
    if (existingRecord) {
      const wallet = await this.getOrCreateWallet(dto.userId);
      return {
        wallet,
        transaction: existingRecord.response.transaction,
      };
    }

    // 3. Ensure target user wallet exists
    const targetWallet = await this.getOrCreateWallet(dto.userId);

    // 4. If debit, verify balance sufficiency (Negative Balance Prevention Invariant)
    if (dto.direction === 'debit' && targetWallet.balanceCoins < dto.amount) {
      throw AppError.conflict(
        `Cannot debit ${dto.amount} coins: Target user balance is only ${targetWallet.balanceCoins}.`
      );
    }

    // 5. Atomic Update
    const balanceDelta = dto.direction === 'credit' ? dto.amount : -dto.amount;
    const lifetimeDelta = dto.direction === 'credit' ? dto.amount : 0;
    const updatedWallet = await this.repo.updateWalletBalance(dto.userId, balanceDelta, lifetimeDelta);

    // 6. Record Auditable Ledger Entry
    const tx = await this.repo.createTransaction({
      walletUserId: dto.userId,
      amount: dto.amount,
      direction: dto.direction,
      transactionType: TRANSACTION_TYPES.ADMIN_ADJUSTMENT,
      status: 'completed',
      description: `[Admin Adjustment] ${dto.reason.trim()}`,
      referenceEntityId: null,
      referenceType: 'admin_action',
      idempotencyKey: dto.idempotencyKey,
      adminActorId: adminId,
    });

    const result = { wallet: updatedWallet, transaction: tx };
    await this.repo.saveIdempotencyRecord({
      idempotencyKey: dto.idempotencyKey,
      userId: dto.userId,
      actionType: 'admin_adjust',
      transactionId: tx.id,
      response: result,
      createdAt: new Date(),
    });

    logger.info(`[Coins] Admin "${adminId}" adjusted ${dto.direction} of ${dto.amount} coins for user "${dto.userId}". Reason: ${dto.reason}`);
    return result;
  }

  /**
   * Creates an explicit compensating transaction to reverse an erroneous transaction.
   * Financial Integrity Invariant: Never edits or deletes already committed ledger records.
   */
  public async compensateTransaction(
    adminId: string,
    adminRoles: string[],
    transactionId: string,
    reason: string
  ): Promise<{ wallet: CoinWalletEntity; compensatingTransaction: CoinTransactionEntity }> {
    // 1. RBAC check
    const isAuthorized =
      ArticleWorkflowEngine.isElevatedEditor(adminRoles) ||
      adminRoles.some((r) => {
        const clean = r.toUpperCase().replace(/^ROLE_/, '');
        return clean === 'ADMIN' || clean === 'SUPER_ADMIN';
      });

    if (!isAuthorized) {
      throw AppError.forbidden('Only Platform Administrators hold authority to execute compensating transactions.');
    }

    // 2. Fetch original transaction
    const original = await this.repo.findTransactionById(transactionId);
    if (!original) {
      throw AppError.notFound(`Original transaction "${transactionId}" not found.`);
    }

    const targetUserId = original.walletUserId;
    const wallet = await this.getOrCreateWallet(targetUserId);

    // 3. Determine reversal direction
    // If original was credit, reversal is debit. If original was debit, reversal is credit.
    const compensatingDirection = original.direction === 'credit' ? 'debit' : 'credit';

    if (compensatingDirection === 'debit' && wallet.balanceCoins < original.amount) {
      throw AppError.conflict(
        `Cannot execute compensating debit: User balance (${wallet.balanceCoins}) is less than original amount (${original.amount}).`
      );
    }

    const balanceDelta = compensatingDirection === 'credit' ? original.amount : -original.amount;
    const lifetimeDelta = 0; // Compensating does not artificially inflate lifetime earnings
    const updatedWallet = await this.repo.updateWalletBalance(targetUserId, balanceDelta, lifetimeDelta);

    const compTx = await this.repo.createTransaction({
      walletUserId: targetUserId,
      amount: original.amount,
      direction: compensatingDirection,
      transactionType: TRANSACTION_TYPES.COMPENSATING_ADJUSTMENT,
      status: 'completed',
      description: `[Compensating Reversal for ${original.id}] ${reason.trim()}`,
      referenceEntityId: original.id,
      referenceType: 'compensating_transaction',
      idempotencyKey: `comp-${original.id}`,
      adminActorId: adminId,
    });

    logger.info(`[Coins] Compensating transaction "${compTx.id}" created for original "${original.id}".`);
    return { wallet: updatedWallet, compensatingTransaction: compTx };
  }

  /**
   * Applies a referral code to attribute the referral and award points.
   * Grounded in docs/Monetization.md Section 11.2 & RULE-REWARD-002.
   */
  public async applyReferral(
    userId: string,
    referralCode: string
  ): Promise<{ userWallet: CoinWalletEntity; bonusEarned: number; referrerId: string }> {
    // 1. Check current user's wallet
    const userWallet = await this.getOrCreateWallet(userId);

    // Prevent duplicate referral claims
    if (userWallet.referredByUserId) {
      throw AppError.conflict('A referral code has already been applied to this account.');
    }

    // 2. Find referrer wallet
    const referrerWallet = await this.repo.findWalletByReferralCode(referralCode.trim());
    if (!referrerWallet) {
      throw AppError.notFound(`Invalid referral code "${referralCode}".`);
    }

    // 3. Self-referral prevention (Anti-Fraud Invariant)
    if (referrerWallet.userId === userId) {
      throw AppError.conflict('Self-referrals are strictly prohibited.');
    }

    // 4. Link referral attribution
    await this.repo.setReferredBy(userId, referrerWallet.userId);

    // 5. Award 25 coins to referred citizen
    const referredIdempotency = `ref-referred-${userId}-${referrerWallet.userId}`;
    await this.creditCoins(userId, {
      amount: COIN_LIMITS.REFERRAL_BONUS_REFERRED,
      transactionType: TRANSACTION_TYPES.REFERRAL_REFERRED,
      description: `Welcome bonus via referral code ${referralCode}`,
      referenceEntityId: referrerWallet.userId,
      referenceType: 'referral_attribution',
      idempotencyKey: referredIdempotency,
    });

    // 6. Award 25 coins to referrer
    const referrerIdempotency = `ref-referrer-${referrerWallet.userId}-${userId}`;
    await this.creditCoins(referrerWallet.userId, {
      amount: COIN_LIMITS.REFERRAL_BONUS_REFERRER,
      transactionType: TRANSACTION_TYPES.REFERRAL_REFERRER,
      description: `Referral bonus for inviting citizen`,
      referenceEntityId: userId,
      referenceType: 'referral_attribution',
      idempotencyKey: referrerIdempotency,
    });

    const refreshedWallet = await this.getWallet(userId);
    return {
      userWallet: refreshedWallet,
      bonusEarned: COIN_LIMITS.REFERRAL_BONUS_REFERRED,
      referrerId: referrerWallet.userId,
    };
  }

  /**
   * Retrieves referral metadata and shareable link for citizen.
   */
  public async getReferralSummary(
    userId: string
  ): Promise<{ referralCode: string; referralLink: string; totalReferredUsers: number; referredByUserId: string | null }> {
    const wallet = await this.getOrCreateWallet(userId);
    const totalReferredUsers = await this.repo.countReferredUsers(userId);

    return {
      referralCode: wallet.referralCode,
      referralLink: `https://breakingnewswala.in/invite/${wallet.referralCode}`,
      totalReferredUsers,
      referredByUserId: wallet.referredByUserId,
    };
  }

  /**
   * Retrieves active reward catalog and daily quota summary for citizen.
   */
  public async getRewardCatalog(
    userId: string
  ): Promise<{ perks: RewardCatalogItem[]; dailyStatus: DailyEarningSummary }> {
    const dateKey = this.getIstDateKey();
    const earnedToday = await this.repo.getDailyEarnedCoins(userId, dateKey);
    const dailyCap = COIN_LIMITS.MAX_DAILY_EARNED_COINS;
    const remainingQuota = Math.max(0, dailyCap - earnedToday);

    return {
      perks: APPROVED_DIGITAL_PERKS,
      dailyStatus: {
        userId,
        dateKey,
        earnedToday,
        dailyCap,
        remainingQuota,
      },
    };
  }
}

export const coinService = new CoinService();
