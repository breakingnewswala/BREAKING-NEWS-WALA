/**
 * BREAKING NEWS WALA — Coin Ledger & Wallet Repository Boundary
 * Grounded in docs/12-Database.md (DOM-M: Coins, Rewards & Referrals)
 * Encapsulates database access for CoinWallet, CoinTransaction, and CoinRedemption.
 */

import { getPrismaClient } from '../../db/client';
import {
  CoinTransactionEntity,
  CoinWalletEntity,
  IdempotencyRecord,
  PaginatedTransactionsResult,
  TransactionFilterParams,
} from './types';

export interface ICoinRepository {
  findWalletByUserId(userId: string): Promise<CoinWalletEntity | null>;
  findWalletByReferralCode(code: string): Promise<CoinWalletEntity | null>;
  createWallet(data: {
    userId: string;
    referralCode: string;
    referredByUserId?: string | null;
  }): Promise<CoinWalletEntity>;
  updateWalletBalance(
    userId: string,
    balanceDelta: number,
    lifetimeDelta: number
  ): Promise<CoinWalletEntity>;
  createTransaction(
    tx: Omit<CoinTransactionEntity, 'id' | 'createdAt'>
  ): Promise<CoinTransactionEntity>;
  findTransactionById(id: string): Promise<CoinTransactionEntity | null>;
  findTransactionsByUserId(
    userId: string,
    filter: TransactionFilterParams
  ): Promise<PaginatedTransactionsResult>;
  getIdempotencyRecord(key: string): Promise<IdempotencyRecord | null>;
  saveIdempotencyRecord(record: IdempotencyRecord): Promise<void>;
  getDailyEarnedCoins(userId: string, dateKey: string): Promise<number>;
  recordDailyEarnedCoins(userId: string, dateKey: string, amount: number): Promise<number>;
  getRecentActionCount(userId: string, windowMs: number): Promise<number>;
  recordActionTimestamp(userId: string): Promise<void>;
  countReferredUsers(userId: string): Promise<number>;
  setReferredBy(userId: string, referrerUserId: string): Promise<CoinWalletEntity>;
}

export class PrismaCoinRepository implements ICoinRepository {
  private get prisma() {
    return getPrismaClient();
  }

  // Fallback in-memory ledgers for runtime metadata not stored in basic relational tables
  private idempotencyStore = new Map<string, IdempotencyRecord>();
  private dailyEarningsStore = new Map<string, number>();
  private actionTimestampsStore = new Map<string, number[]>();

  public async findWalletByUserId(userId: string): Promise<CoinWalletEntity | null> {
    const wallet = await this.prisma.coinWallet.findUnique({
      where: { userId },
    });
    if (!wallet) return null;
    return this.mapPrismaWalletToEntity(wallet);
  }

  public async findWalletByReferralCode(code: string): Promise<CoinWalletEntity | null> {
    const wallet = await this.prisma.coinWallet.findUnique({
      where: { referralCode: code.toUpperCase() },
    });
    if (!wallet) return null;
    return this.mapPrismaWalletToEntity(wallet);
  }

  public async createWallet(data: {
    userId: string;
    referralCode: string;
    referredByUserId?: string | null;
  }): Promise<CoinWalletEntity> {
    const created = await this.prisma.coinWallet.create({
      data: {
        userId: data.userId,
        referralCode: data.referralCode.toUpperCase(),
        referredByUserId: data.referredByUserId || null,
        balanceCoins: BigInt(0),
        lifetimeEarnedCoins: BigInt(0),
      },
    });
    return this.mapPrismaWalletToEntity(created);
  }

  public async updateWalletBalance(
    userId: string,
    balanceDelta: number,
    lifetimeDelta: number
  ): Promise<CoinWalletEntity> {
    const updated = await this.prisma.coinWallet.update({
      where: { userId },
      data: {
        balanceCoins: {
          increment: BigInt(balanceDelta),
        },
        lifetimeEarnedCoins: {
          increment: BigInt(lifetimeDelta),
        },
      },
    });
    return this.mapPrismaWalletToEntity(updated);
  }

  public async createTransaction(
    tx: Omit<CoinTransactionEntity, 'id' | 'createdAt'>
  ): Promise<CoinTransactionEntity> {
    const created = await this.prisma.coinTransaction.create({
      data: {
        walletUserId: tx.walletUserId,
        amount: tx.direction === 'debit' ? -Math.abs(tx.amount) : Math.abs(tx.amount),
        transactionType: tx.transactionType,
        referenceEntityId: tx.referenceEntityId || null,
      },
    });

    return {
      id: created.id,
      walletUserId: created.walletUserId,
      amount: Math.abs(created.amount),
      direction: created.amount >= 0 ? 'credit' : 'debit',
      transactionType: created.transactionType,
      status: 'completed',
      description: tx.description || null,
      referenceEntityId: created.referenceEntityId,
      referenceType: tx.referenceType || null,
      idempotencyKey: tx.idempotencyKey || null,
      adminActorId: tx.adminActorId || null,
      createdAt: created.createdAt,
    };
  }

  public async findTransactionById(id: string): Promise<CoinTransactionEntity | null> {
    const tx = await this.prisma.coinTransaction.findUnique({
      where: { id },
    });
    if (!tx) return null;

    return {
      id: tx.id,
      walletUserId: tx.walletUserId,
      amount: Math.abs(tx.amount),
      direction: tx.amount >= 0 ? 'credit' : 'debit',
      transactionType: tx.transactionType,
      status: 'completed',
      description: null,
      referenceEntityId: tx.referenceEntityId,
      referenceType: null,
      idempotencyKey: null,
      adminActorId: null,
      createdAt: tx.createdAt,
    };
  }

  public async findTransactionsByUserId(
    userId: string,
    filter: TransactionFilterParams
  ): Promise<PaginatedTransactionsResult> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { walletUserId: userId };
    if (filter.transactionType) {
      where.transactionType = filter.transactionType;
    }
    if (filter.direction === 'credit') {
      where.amount = { gte: 0 };
    } else if (filter.direction === 'debit') {
      where.amount = { lt: 0 };
    }

    const [total, records] = await Promise.all([
      this.prisma.coinTransaction.count({ where }),
      this.prisma.coinTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const items: CoinTransactionEntity[] = records.map((tx: any) => ({
      id: tx.id,
      walletUserId: tx.walletUserId,
      amount: Math.abs(tx.amount),
      direction: tx.amount >= 0 ? 'credit' : 'debit',
      transactionType: tx.transactionType,
      status: 'completed',
      description: null,
      referenceEntityId: tx.referenceEntityId,
      referenceType: null,
      idempotencyKey: null,
      adminActorId: null,
      createdAt: tx.createdAt,
    }));

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public async getIdempotencyRecord(key: string): Promise<IdempotencyRecord | null> {
    return this.idempotencyStore.get(key) || null;
  }

  public async saveIdempotencyRecord(record: IdempotencyRecord): Promise<void> {
    this.idempotencyStore.set(record.idempotencyKey, record);
  }

  public async getDailyEarnedCoins(userId: string, dateKey: string): Promise<number> {
    const key = `${userId}:${dateKey}`;
    return this.dailyEarningsStore.get(key) || 0;
  }

  public async recordDailyEarnedCoins(userId: string, dateKey: string, amount: number): Promise<number> {
    const key = `${userId}:${dateKey}`;
    const current = this.dailyEarningsStore.get(key) || 0;
    const updated = current + amount;
    this.dailyEarningsStore.set(key, updated);
    return updated;
  }

  public async getRecentActionCount(userId: string, windowMs: number): Promise<number> {
    const now = Date.now();
    const timestamps = this.actionTimestampsStore.get(userId) || [];
    const valid = timestamps.filter((t) => now - t <= windowMs);
    this.actionTimestampsStore.set(userId, valid);
    return valid.length;
  }

  public async recordActionTimestamp(userId: string): Promise<void> {
    const timestamps = this.actionTimestampsStore.get(userId) || [];
    timestamps.push(Date.now());
    this.actionTimestampsStore.set(userId, timestamps);
  }

  public async countReferredUsers(userId: string): Promise<number> {
    return this.prisma.coinWallet.count({
      where: { referredByUserId: userId },
    });
  }

  public async setReferredBy(userId: string, referrerUserId: string): Promise<CoinWalletEntity> {
    const updated = await this.prisma.coinWallet.update({
      where: { userId },
      data: { referredByUserId: referrerUserId },
    });
    return this.mapPrismaWalletToEntity(updated);
  }

  private mapPrismaWalletToEntity(record: any): CoinWalletEntity {
    return {
      userId: record.userId,
      balanceCoins: Number(record.balanceCoins || 0),
      lifetimeEarnedCoins: Number(record.lifetimeEarnedCoins || 0),
      referralCode: record.referralCode,
      referredByUserId: record.referredByUserId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

/**
 * In-Memory Coin Repository for Tests & Offline Resilience
 */
export class InMemoryCoinRepository implements ICoinRepository {
  private wallets = new Map<string, CoinWalletEntity>();
  private referralCodeToUserId = new Map<string, string>();
  private transactions = new Map<string, CoinTransactionEntity>();
  private idempotencyStore = new Map<string, IdempotencyRecord>();
  private dailyEarnings = new Map<string, number>();
  private actionTimestamps = new Map<string, number[]>();

  public async findWalletByUserId(userId: string): Promise<CoinWalletEntity | null> {
    const wallet = this.wallets.get(userId);
    return wallet ? { ...wallet } : null;
  }

  public async findWalletByReferralCode(code: string): Promise<CoinWalletEntity | null> {
    const userId = this.referralCodeToUserId.get(code.toUpperCase());
    if (!userId) return null;
    return this.findWalletByUserId(userId);
  }

  public async createWallet(data: {
    userId: string;
    referralCode: string;
    referredByUserId?: string | null;
  }): Promise<CoinWalletEntity> {
    const now = new Date();
    const entity: CoinWalletEntity = {
      userId: data.userId,
      balanceCoins: 0,
      lifetimeEarnedCoins: 0,
      referralCode: data.referralCode.toUpperCase(),
      referredByUserId: data.referredByUserId || null,
      createdAt: now,
      updatedAt: now,
    };
    this.wallets.set(data.userId, entity);
    this.referralCodeToUserId.set(data.referralCode.toUpperCase(), data.userId);
    return { ...entity };
  }

  public async updateWalletBalance(
    userId: string,
    balanceDelta: number,
    lifetimeDelta: number
  ): Promise<CoinWalletEntity> {
    const wallet = this.wallets.get(userId);
    if (!wallet) {
      throw new Error(`Wallet not found for user: ${userId}`);
    }

    wallet.balanceCoins += balanceDelta;
    wallet.lifetimeEarnedCoins += lifetimeDelta;
    wallet.updatedAt = new Date();

    return { ...wallet };
  }

  public async createTransaction(
    tx: Omit<CoinTransactionEntity, 'id' | 'createdAt'>
  ): Promise<CoinTransactionEntity> {
    const id = `ctx-uuid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const entity: CoinTransactionEntity = {
      ...tx,
      id,
      amount: Math.abs(tx.amount),
      direction: tx.direction,
      createdAt: new Date(),
    };
    this.transactions.set(id, entity);
    return { ...entity };
  }

  public async findTransactionById(id: string): Promise<CoinTransactionEntity | null> {
    const tx = this.transactions.get(id);
    return tx ? { ...tx } : null;
  }

  public async findTransactionsByUserId(
    userId: string,
    filter: TransactionFilterParams
  ): Promise<PaginatedTransactionsResult> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));

    let list = Array.from(this.transactions.values()).filter(
      (tx) => tx.walletUserId === userId
    );

    if (filter.transactionType) {
      list = list.filter((tx) => tx.transactionType === filter.transactionType);
    }
    if (filter.direction) {
      list = list.filter((tx) => tx.direction === filter.direction);
    }

    list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = list.length;
    const skip = (page - 1) * limit;
    const items = list.slice(skip, skip + limit);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public async getIdempotencyRecord(key: string): Promise<IdempotencyRecord | null> {
    const record = this.idempotencyStore.get(key);
    return record ? { ...record } : null;
  }

  public async saveIdempotencyRecord(record: IdempotencyRecord): Promise<void> {
    this.idempotencyStore.set(record.idempotencyKey, { ...record });
  }

  public async getDailyEarnedCoins(userId: string, dateKey: string): Promise<number> {
    const key = `${userId}:${dateKey}`;
    return this.dailyEarnings.get(key) || 0;
  }

  public async recordDailyEarnedCoins(
    userId: string,
    dateKey: string,
    amount: number
  ): Promise<number> {
    const key = `${userId}:${dateKey}`;
    const current = this.dailyEarnings.get(key) || 0;
    const updated = current + amount;
    this.dailyEarnings.set(key, updated);
    return updated;
  }

  public async getRecentActionCount(userId: string, windowMs: number): Promise<number> {
    const now = Date.now();
    const timestamps = this.actionTimestamps.get(userId) || [];
    const valid = timestamps.filter((t) => now - t <= windowMs);
    this.actionTimestamps.set(userId, valid);
    return valid.length;
  }

  public async recordActionTimestamp(userId: string): Promise<void> {
    const timestamps = this.actionTimestamps.get(userId) || [];
    timestamps.push(Date.now());
    this.actionTimestamps.set(userId, timestamps);
  }

  public async countReferredUsers(userId: string): Promise<number> {
    return Array.from(this.wallets.values()).filter(
      (w) => w.referredByUserId === userId
    ).length;
  }

  public async setReferredBy(userId: string, referrerUserId: string): Promise<CoinWalletEntity> {
    const wallet = this.wallets.get(userId);
    if (!wallet) {
      throw new Error(`Wallet not found for user: ${userId}`);
    }
    wallet.referredByUserId = referrerUserId;
    wallet.updatedAt = new Date();
    return { ...wallet };
  }

  public clear(): void {
    this.wallets.clear();
    this.referralCodeToUserId.clear();
    this.transactions.clear();
    this.idempotencyStore.clear();
    this.dailyEarnings.clear();
    this.actionTimestamps.clear();
  }
}

let repositoryInstance: ICoinRepository | null = null;

export function getCoinRepository(): ICoinRepository {
  if (!repositoryInstance) {
    if (process.env.NODE_ENV === 'test' || !process.env.DATABASE_URL) {
      repositoryInstance = new InMemoryCoinRepository();
    } else {
      repositoryInstance = new PrismaCoinRepository();
    }
  }
  return repositoryInstance;
}

export function setCoinRepository(repo: ICoinRepository): void {
  repositoryInstance = repo;
}

export const coinRepository = getCoinRepository();
