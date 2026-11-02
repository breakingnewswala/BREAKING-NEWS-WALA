/**
 * BREAKING NEWS WALA — Coin Ledger & Rewards Domain Types
 * Grounded in docs/Monetization.md (Section 11), docs/DECISIONS.md (DEC-007),
 * docs/06-Business-Rules.md (RULE-REWARD-001, RULE-REWARD-002, RULE-REWARD-003),
 * docs/12-Database.md (DOM-M: Coins, Rewards & Referrals), and docs/13-API.md (COIN-01, COIN-02).
 */

export type CoinTransactionType =
  | 'article_read_reward'
  | 'article_share_reward'
  | 'referral_bonus_referrer'
  | 'referral_bonus_referred'
  | 'comment_reward'
  | 'daily_streak_reward'
  | 'digital_perk_redemption'
  | 'admin_adjustment'
  | 'compensating_adjustment';

export type CoinTransactionDirection = 'credit' | 'debit';

export type CoinTransactionStatus = 'completed' | 'pending' | 'reversed';

export interface CoinWalletEntity {
  userId: string;
  balanceCoins: number;
  lifetimeEarnedCoins: number;
  referralCode: string;
  referredByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoinTransactionEntity {
  id: string;
  walletUserId: string;
  amount: number; // Positive integer
  direction: CoinTransactionDirection;
  transactionType: CoinTransactionType | string;
  status: CoinTransactionStatus;
  description: string | null;
  referenceEntityId: string | null;
  referenceType: string | null;
  idempotencyKey: string | null;
  adminActorId: string | null;
  createdAt: Date;
}

export interface CoinRedemptionEntity {
  id: string;
  walletUserId: string;
  coinsRedeemed: number;
  payoutMethod: string;
  status: string;
  requestedAt: Date;
}

export interface IdempotencyRecord {
  idempotencyKey: string;
  userId: string;
  actionType: string;
  transactionId: string;
  response: any;
  createdAt: Date;
}

export interface DailyEarningSummary {
  userId: string;
  dateKey: string; // YYYY-MM-DD (Asia/Kolkata)
  earnedToday: number;
  dailyCap: number;
  remainingQuota: number;
}

export interface CreditCoinsDto {
  amount: number;
  transactionType: CoinTransactionType;
  description?: string;
  referenceEntityId?: string;
  referenceType?: string;
  idempotencyKey: string;
}

export interface DebitCoinsDto {
  amount: number;
  transactionType: CoinTransactionType;
  description?: string;
  referenceEntityId?: string;
  referenceType?: string;
  idempotencyKey: string;
}

export interface AdminAdjustCoinsDto {
  userId: string;
  amount: number;
  direction: CoinTransactionDirection;
  reason: string;
  idempotencyKey: string;
}

export interface ApplyReferralDto {
  referralCode: string;
}

export interface TransactionFilterParams {
  page?: number;
  limit?: number;
  transactionType?: string;
  direction?: CoinTransactionDirection;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedTransactionsResult {
  items: CoinTransactionEntity[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RewardCatalogItem {
  id: string;
  code: string;
  nameHi: string;
  nameEn: string;
  coinCost: number;
  category: 'digital_badge' | 'ad_free_pass' | 'exclusive_epaper';
  status: 'active' | 'coming_soon';
  descriptionHi: string;
}

