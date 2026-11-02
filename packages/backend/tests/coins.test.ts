/**
 * BREAKING NEWS WALA — Coin Ledger & Rewards Subsystem Test Suite
 * Grounded in docs/Monetization.md (Section 11), docs/DECISIONS.md (DEC-007, DEC-026),
 * docs/06-Business-Rules.md (RULE-REWARD-001, RULE-REWARD-002, RULE-REWARD-003),
 * and docs/13-API.md (Section 16: COIN-01, COIN-02, COIN-03).
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../src/app';
import { createTestClient, TestClient } from './test-helper';
import { tokenService } from '../src/modules/auth/token.service';
import {
  COIN_LIMITS,
  TRANSACTION_TYPES,
  APPROVED_DIGITAL_PERKS,
} from '../src/modules/coins/coin.constants';
import {
  getCoinRepository,
  InMemoryCoinRepository,
  setCoinRepository,
} from '../src/modules/coins/coin.repository';

describe('Coin Ledger — Policy & Financial Integrity Invariants', () => {
  it('should verify regulatory and anti-fraud limit constants (DEC-007, RULE-REWARD-003)', () => {
    assert.strictEqual(COIN_LIMITS.MAX_DAILY_EARNED_COINS, 50, 'Daily earn cap must be 50 coins');
    assert.strictEqual(COIN_LIMITS.MAX_VELOCITY_ACTIONS_PER_MINUTE, 10, 'Max 10 actions/min velocity cap');
    assert.strictEqual(COIN_LIMITS.REFERRAL_BONUS_REFERRER, 25, 'Referrer gets 25 coins');
    assert.strictEqual(COIN_LIMITS.REFERRAL_BONUS_REFERRED, 25, 'Referred citizen gets 25 coins');
    assert.strictEqual(COIN_LIMITS.MIN_TRANSACTION_AMOUNT, 1, 'Minimum transaction is 1 coin');
    assert.strictEqual(COIN_LIMITS.MAX_SINGLE_TRANSACTION_AMOUNT, 500, 'Max single transaction is 500 coins');
    assert.strictEqual(COIN_LIMITS.REFERRAL_CODE_PREFIX, 'BNW-', 'Referral code prefix must be BNW-');
  });

  it('should verify approved digital perks are non-monetary with zero cash value (DEC-007)', () => {
    assert.ok(APPROVED_DIGITAL_PERKS.length >= 3, 'Must have at least 3 approved perks');
    for (const perk of APPROVED_DIGITAL_PERKS) {
      assert.ok(perk.id, 'Perk must have an ID');
      assert.ok(perk.nameHi, 'Perk must have a Hindi name');
      assert.ok(perk.coinCost > 0, 'Perk must cost positive integer coins');
      assert.strictEqual(perk.status, 'active');
    }
  });
});

describe('Coin Ledger & Rewards Subsystem (API Integration)', () => {
  let client: TestClient;
  let inMemoryRepo: InMemoryCoinRepository;

  // Test identities & tokens
  const citizen1 = {
    id: 'usr-citizen-coin-1',
    token: tokenService.generateAccessToken({
      userId: 'usr-citizen-coin-1',
      roles: ['ROLE_CITIZEN'],
      status: 'active',
    }).token,
  };

  const citizen2 = {
    id: 'usr-citizen-coin-2',
    token: tokenService.generateAccessToken({
      userId: 'usr-citizen-coin-2',
      roles: ['ROLE_CITIZEN'],
      status: 'active',
    }).token,
  };

  const citizen3 = {
    id: 'usr-citizen-coin-3',
    token: tokenService.generateAccessToken({
      userId: 'usr-citizen-coin-3',
      roles: ['ROLE_CITIZEN'],
      status: 'active',
    }).token,
  };

  const adminUser = {
    id: 'usr-admin-coin-99',
    token: tokenService.generateAccessToken({
      userId: 'usr-admin-coin-99',
      roles: ['ROLE_ADMIN'],
      status: 'active',
    }).token,
  };

  const reporterUser = {
    id: 'usr-reporter-coin-55',
    token: tokenService.generateAccessToken({
      userId: 'usr-reporter-coin-55',
      roles: ['ROLE_REPORTER_STANDARD'],
      status: 'active',
    }).token,
  };

  before(async () => {
    inMemoryRepo = new InMemoryCoinRepository();
    setCoinRepository(inMemoryRepo);
    const app = createApp();
    client = await createTestClient(app);
  });

  after(async () => {
    await client.close();
  });

  beforeEach(() => {
    inMemoryRepo.clear();
  });

  describe('1. Wallet Initialization & Balance Lookup (COIN-01)', () => {
    it('should lazy-create a wallet with zero balance and unique referral code on first GET /wallet', async () => {
      const res = await client.get('/api/v1/coins/wallet', {
        Authorization: `Bearer ${citizen1.token}`,
      });

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.userId, citizen1.id);
      assert.strictEqual(json.data.balanceCoins, 0);
      assert.strictEqual(json.data.lifetimeEarnedCoins, 0);
      assert.ok(json.data.referralCode.startsWith('BNW-'), 'Referral code must start with BNW-');
      assert.strictEqual(json.data.referredByUserId, null);
    });

    it('should return 401 when accessing wallet unauthenticated', async () => {
      const res = await client.get('/api/v1/coins/wallet');
      assert.strictEqual(res.status, 401);
    });
  });

  describe('2. Credit Operations & Financial Integrity (DEC-007, Section 3)', () => {
    it('should credit coins and update available balance and lifetime earned', async () => {
      const creditPayload = {
        amount: 20,
        transactionType: TRANSACTION_TYPES.DAILY_STREAK,
        description: 'Completed 5-day reading streak',
        idempotencyKey: 'test-credit-streak-1',
      };

      const res = await client.post('/api/v1/coins/credit', creditPayload, {
        Authorization: `Bearer ${citizen1.token}`,
      });

      assert.strictEqual(res.status, 201);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.grantedAmount, 20);
      assert.strictEqual(json.data.wallet.balanceCoins, 20);
      assert.strictEqual(json.data.wallet.lifetimeEarnedCoins, 20);
      assert.strictEqual(json.data.transaction.direction, 'credit');
      assert.strictEqual(json.data.transaction.amount, 20);
      assert.strictEqual(json.data.transaction.transactionType, TRANSACTION_TYPES.DAILY_STREAK);
    });

    it('should strictly reject floating-point amounts (Integer-only invariant)', async () => {
      const floatPayload = {
        amount: 10.5,
        transactionType: TRANSACTION_TYPES.ARTICLE_READ,
        idempotencyKey: 'test-credit-float-1',
      };

      const res = await client.post('/api/v1/coins/credit', floatPayload, {
        Authorization: `Bearer ${citizen1.token}`,
      });

      assert.strictEqual(res.status, 422);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.error.details.some((d: any) => d.message.includes('integer')));
    });

    it('should strictly reject negative amounts and zero amounts', async () => {
      const negativeRes = await client.post('/api/v1/coins/credit', {
        amount: -15,
        transactionType: TRANSACTION_TYPES.ARTICLE_READ,
        idempotencyKey: 'test-credit-neg-1',
      }, {
        Authorization: `Bearer ${citizen1.token}`,
      });
      assert.strictEqual(negativeRes.status, 422);

      const zeroRes = await client.post('/api/v1/coins/credit', {
        amount: 0,
        transactionType: TRANSACTION_TYPES.ARTICLE_READ,
        idempotencyKey: 'test-credit-zero-1',
      }, {
        Authorization: `Bearer ${citizen1.token}`,
      });
      assert.strictEqual(zeroRes.status, 422);
    });

    it('should enforce daily earning limit ceiling of 50 coins (DEC-007)', async () => {
      // First credit: 30 coins (allowed)
      const res1 = await client.post('/api/v1/coins/credit', {
        amount: 30,
        transactionType: TRANSACTION_TYPES.ARTICLE_READ,
        idempotencyKey: 'test-credit-cap-1',
      }, {
        Authorization: `Bearer ${citizen1.token}`,
      });
      assert.strictEqual(res1.status, 201);

      // Second credit: request 30 coins, but daily cap of 50 allows only 20 coins
      const res2 = await client.post('/api/v1/coins/credit', {
        amount: 30,
        transactionType: TRANSACTION_TYPES.ARTICLE_READ,
        idempotencyKey: 'test-credit-cap-2',
      }, {
        Authorization: `Bearer ${citizen1.token}`,
      });
      assert.strictEqual(res2.status, 201);
      const json2 = await res2.json();
      assert.strictEqual(json2.data.grantedAmount, 20, 'Should be capped to remaining 20 coins');
      assert.strictEqual(json2.data.wallet.balanceCoins, 50);

      // Third credit: daily cap is fully exhausted -> 409 Conflict
      const res3 = await client.post('/api/v1/coins/credit', {
        amount: 10,
        transactionType: TRANSACTION_TYPES.ARTICLE_READ,
        idempotencyKey: 'test-credit-cap-3',
      }, {
        Authorization: `Bearer ${citizen1.token}`,
      });
      assert.strictEqual(res3.status, 409);
      const json3 = await res3.json();
      assert.strictEqual(json3.success, false);
      assert.ok(json3.error.message.includes('Daily coin earning limit'));
    });
  });

  describe('3. Debit Operations & Negative Balance Prevention (Section 3)', () => {
    it('should debit coins for approved perk and keep lifetime earnings intact', async () => {
      // Fund citizen wallet with 30 coins
      await client.post('/api/v1/coins/credit', {
        amount: 30,
        transactionType: TRANSACTION_TYPES.DAILY_STREAK,
        idempotencyKey: 'fund-debit-1',
      }, {
        Authorization: `Bearer ${citizen1.token}`,
      });

      // Debit 10 coins
      const debitRes = await client.post('/api/v1/coins/debit', {
        amount: 10,
        transactionType: TRANSACTION_TYPES.DIGITAL_PERK,
        description: 'Redeemed 24-hr Ad-Free Reading Pass',
        idempotencyKey: 'test-debit-1',
      }, {
        Authorization: `Bearer ${citizen1.token}`,
      });

      assert.strictEqual(debitRes.status, 200);
      const json = await debitRes.json();
      assert.strictEqual(json.data.wallet.balanceCoins, 20);
      assert.strictEqual(json.data.wallet.lifetimeEarnedCoins, 30, 'Lifetime earned must not decrease');
      assert.strictEqual(json.data.transaction.direction, 'debit');
      assert.strictEqual(json.data.transaction.amount, 10);
    });

    it('should strictly reject debit exceeding balance with 409 Conflict (Zero Negative Balance)', async () => {
      // Wallet starts with 0 coins. Attempt to debit 5 coins.
      const res = await client.post('/api/v1/coins/debit', {
        amount: 5,
        transactionType: TRANSACTION_TYPES.DIGITAL_PERK,
        idempotencyKey: 'test-debit-overspend-1',
      }, {
        Authorization: `Bearer ${citizen1.token}`,
      });

      assert.strictEqual(res.status, 409);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.error.message.includes('Insufficient coin balance'));

      // Verify wallet remains at 0
      const walletRes = await client.get('/api/v1/coins/wallet', {
        Authorization: `Bearer ${citizen1.token}`,
      });
      const walletJson = await walletRes.json();
      assert.strictEqual(walletJson.data.balanceCoins, 0);
    });
  });

  describe('4. Idempotency & Replay Defense (Section 3)', () => {
    it('should return identical transaction and avoid double-crediting on replayed request', async () => {
      const payload = {
        amount: 15,
        transactionType: TRANSACTION_TYPES.ARTICLE_READ,
        idempotencyKey: 'idemp-credit-test-unique-key-1',
      };

      // First call
      const res1 = await client.post('/api/v1/coins/credit', payload, {
        Authorization: `Bearer ${citizen1.token}`,
      });
      assert.strictEqual(res1.status, 201);
      const json1 = await res1.json();
      const txId1 = json1.data.transaction.id;
      assert.strictEqual(json1.data.wallet.balanceCoins, 15);

      // Replay with identical idempotencyKey
      const res2 = await client.post('/api/v1/coins/credit', payload, {
        Authorization: `Bearer ${citizen1.token}`,
      });
      assert.strictEqual(res2.status, 201);
      const json2 = await res2.json();
      assert.strictEqual(json2.data.transaction.id, txId1, 'Must return same transaction ID');
      assert.strictEqual(json2.data.wallet.balanceCoins, 15, 'Balance must NOT increase twice');
    });

    it('should return identical transaction and avoid double-debiting on replayed debit', async () => {
      // Credit 30 coins
      await client.post('/api/v1/coins/credit', {
        amount: 30,
        transactionType: TRANSACTION_TYPES.DAILY_STREAK,
        idempotencyKey: 'fund-debit-idemp-1',
      }, {
        Authorization: `Bearer ${citizen1.token}`,
      });

      const debitPayload = {
        amount: 10,
        transactionType: TRANSACTION_TYPES.DIGITAL_PERK,
        idempotencyKey: 'idemp-debit-test-unique-key-1',
      };

      // First debit
      const res1 = await client.post('/api/v1/coins/debit', debitPayload, {
        Authorization: `Bearer ${citizen1.token}`,
      });
      assert.strictEqual(res1.status, 200);
      const json1 = await res1.json();
      assert.strictEqual(json1.data.wallet.balanceCoins, 20);

      // Replay debit
      const res2 = await client.post('/api/v1/coins/debit', debitPayload, {
        Authorization: `Bearer ${citizen1.token}`,
      });
      assert.strictEqual(res2.status, 200);
      const json2 = await res2.json();
      assert.strictEqual(json2.data.transaction.id, json1.data.transaction.id);
      assert.strictEqual(json2.data.wallet.balanceCoins, 20, 'Balance must NOT decrease twice');
    });
  });

  describe('5. Anti-Fraud Velocity Escrow (RULE-REWARD-003)', () => {
    it('should reject requests exceeding 10 actions/min with 429 Too Many Requests', async () => {
      // Execute 10 valid actions within the minute window
      for (let i = 1; i <= 10; i++) {
        const res = await client.post('/api/v1/coins/credit', {
          amount: 1,
          transactionType: TRANSACTION_TYPES.ARTICLE_READ,
          idempotencyKey: `velocity-action-${i}`,
        }, {
          Authorization: `Bearer ${citizen2.token}`,
        });
        assert.strictEqual(res.status, 201, `Action ${i} should succeed`);
      }

      // The 11th action must trigger velocity fraud protection (429)
      const res11 = await client.post('/api/v1/coins/credit', {
        amount: 1,
        transactionType: TRANSACTION_TYPES.ARTICLE_READ,
        idempotencyKey: 'velocity-action-11',
      }, {
        Authorization: `Bearer ${citizen2.token}`,
      });

      assert.strictEqual(res11.status, 429);
      const json = await res11.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.error.message.includes('fraud escrow'));
    });
  });

  describe('6. Transaction History & User Isolation (COIN-02)', () => {
    it('should list user transactions with pagination and filters', async () => {
      // Create 3 transactions for citizen1
      await client.post('/api/v1/coins/credit', {
        amount: 10,
        transactionType: TRANSACTION_TYPES.DAILY_STREAK,
        idempotencyKey: 'tx-history-1',
      }, { Authorization: `Bearer ${citizen1.token}` });

      await client.post('/api/v1/coins/credit', {
        amount: 5,
        transactionType: TRANSACTION_TYPES.ARTICLE_READ,
        idempotencyKey: 'tx-history-2',
      }, { Authorization: `Bearer ${citizen1.token}` });

      await client.post('/api/v1/coins/debit', {
        amount: 5,
        transactionType: TRANSACTION_TYPES.DIGITAL_PERK,
        idempotencyKey: 'tx-history-3',
      }, { Authorization: `Bearer ${citizen1.token}` });

      // List all
      const listRes = await client.get('/api/v1/coins/transactions?page=1&limit=10', {
        Authorization: `Bearer ${citizen1.token}`,
      });

      assert.strictEqual(listRes.status, 200);
      const listJson = await listRes.json();
      assert.strictEqual(listJson.success, true);
      assert.strictEqual(listJson.data.length, 3);
      assert.strictEqual(listJson.meta.pagination.total, 3);

      // Filter by direction=debit
      const debitListRes = await client.get('/api/v1/coins/transactions?direction=debit', {
        Authorization: `Bearer ${citizen1.token}`,
      });
      const debitJson = await debitListRes.json();
      assert.strictEqual(debitJson.data.length, 1);
      assert.strictEqual(debitJson.data[0].direction, 'debit');
    });

    it('should strictly isolate transaction details between citizens (403 for unauthorized viewer)', async () => {
      // Citizen 1 creates a transaction
      const createRes = await client.post('/api/v1/coins/credit', {
        amount: 10,
        transactionType: TRANSACTION_TYPES.DAILY_STREAK,
        idempotencyKey: 'iso-credit-1',
      }, { Authorization: `Bearer ${citizen1.token}` });
      const createJson = await createRes.json();
      const txId = createJson.data.transaction.id;

      // Citizen 1 can view detail
      const detailRes1 = await client.get(`/api/v1/coins/transactions/${txId}`, {
        Authorization: `Bearer ${citizen1.token}`,
      });
      assert.strictEqual(detailRes1.status, 200);

      // Citizen 2 attempts to view Citizen 1's transaction -> 403 Forbidden
      const detailRes2 = await client.get(`/api/v1/coins/transactions/${txId}`, {
        Authorization: `Bearer ${citizen2.token}`,
      });
      assert.strictEqual(detailRes2.status, 403);
    });
  });

  describe('7. Compensating Transactions (Section 3)', () => {
    it('should create an explicit compensating transaction to reverse an erroneous credit without altering original', async () => {
      // 1. Citizen 1 receives erroneous credit of 20 coins
      const creditRes = await client.post('/api/v1/coins/credit', {
        amount: 20,
        transactionType: TRANSACTION_TYPES.DAILY_STREAK,
        idempotencyKey: 'orig-erroneous-credit-1',
      }, { Authorization: `Bearer ${citizen1.token}` });
      const creditJson = await creditRes.json();
      const originalTxId = creditJson.data.transaction.id;
      assert.strictEqual(creditJson.data.wallet.balanceCoins, 20);

      // 2. Admin issues compensating reversal
      const compRes = await client.post(`/api/v1/admin/coins/compensate/${originalTxId}`, {
        reason: 'Duplicate streak bonus issued erroneously by scheduler',
      }, { Authorization: `Bearer ${adminUser.token}` });

      assert.strictEqual(compRes.status, 200);
      const compJson = await compRes.json();
      assert.strictEqual(compJson.success, true);
      assert.strictEqual(compJson.data.wallet.balanceCoins, 0, 'Balance must be reversed to 0');
      assert.strictEqual(compJson.data.compensatingTransaction.direction, 'debit');
      assert.strictEqual(compJson.data.compensatingTransaction.amount, 20);
      assert.strictEqual(compJson.data.compensatingTransaction.referenceEntityId, originalTxId);

      // 3. Verify original transaction remains completely immutable
      const origRes = await client.get(`/api/v1/coins/transactions/${originalTxId}`, {
        Authorization: `Bearer ${citizen1.token}`,
      });
      const origJson = await origRes.json();
      assert.strictEqual(origJson.data.direction, 'credit');
      assert.strictEqual(origJson.data.amount, 20);
      assert.strictEqual(origJson.data.status, 'completed');
    });

    it('should reject compensating debit if user has already spent coins below original amount', async () => {
      // Credit 20 coins
      const creditRes = await client.post('/api/v1/coins/credit', {
        amount: 20,
        transactionType: TRANSACTION_TYPES.DAILY_STREAK,
        idempotencyKey: 'err-credit-spent-1',
      }, { Authorization: `Bearer ${citizen1.token}` });
      const txId = (await creditRes.json()).data.transaction.id;

      // User spends 15 coins (balance is now 5)
      await client.post('/api/v1/coins/debit', {
        amount: 15,
        transactionType: TRANSACTION_TYPES.DIGITAL_PERK,
        idempotencyKey: 'spend-before-comp-1',
      }, { Authorization: `Bearer ${citizen1.token}` });

      // Admin attempts to reverse 20 coins -> 409 Conflict (prevents negative balance)
      const compRes = await client.post(`/api/v1/admin/coins/compensate/${txId}`, {
        reason: 'Administrative reversal attempt',
      }, { Authorization: `Bearer ${adminUser.token}` });

      assert.strictEqual(compRes.status, 409);
    });
  });

  describe('8. Referral System & Attribution (docs/Monetization.md Section 11.2, RULE-REWARD-002)', () => {
    it('should retrieve citizen referral code and shareable invite link', async () => {
      const res = await client.get('/api/v1/coins/referral', {
        Authorization: `Bearer ${citizen1.token}`,
      });

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.ok(json.data.referralCode.startsWith('BNW-'));
      assert.ok(json.data.referralLink.includes(json.data.referralCode));
      assert.strictEqual(json.data.totalReferredUsers, 0);
    });

    it('should award 25 coins to both parties upon valid referral application', async () => {
      // 1. Get citizen 1's referral code
      const ref1Res = await client.get('/api/v1/coins/referral', {
        Authorization: `Bearer ${citizen1.token}`,
      });
      const code1 = (await ref1Res.json()).data.referralCode;

      // 2. Citizen 2 applies Citizen 1's referral code
      const applyRes = await client.post('/api/v1/coins/referral/apply', {
        referralCode: code1,
      }, { Authorization: `Bearer ${citizen2.token}` });

      assert.strictEqual(applyRes.status, 200);
      const applyJson = await applyRes.json();
      assert.strictEqual(applyJson.success, true);
      assert.strictEqual(applyJson.data.bonusEarned, 25);
      assert.strictEqual(applyJson.data.userWallet.balanceCoins, 25);
      assert.strictEqual(applyJson.data.referrerId, citizen1.id);

      // 3. Verify citizen 1 (referrer) also received 25 coins
      const wallet1Res = await client.get('/api/v1/coins/wallet', {
        Authorization: `Bearer ${citizen1.token}`,
      });
      const wallet1Json = await wallet1Res.json();
      assert.strictEqual(wallet1Json.data.balanceCoins, 25);

      // 4. Verify referral count incremented for citizen 1
      const countRes = await client.get('/api/v1/coins/referral', {
        Authorization: `Bearer ${citizen1.token}`,
      });
      const countJson = await countRes.json();
      assert.strictEqual(countJson.data.totalReferredUsers, 1);
    });

    it('should reject self-referral with 409 Conflict', async () => {
      const refRes = await client.get('/api/v1/coins/referral', {
        Authorization: `Bearer ${citizen1.token}`,
      });
      const myCode = (await refRes.json()).data.referralCode;

      const applyRes = await client.post('/api/v1/coins/referral/apply', {
        referralCode: myCode,
      }, { Authorization: `Bearer ${citizen1.token}` });

      assert.strictEqual(applyRes.status, 409);
      const json = await applyRes.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.error.message.includes('Self-referrals are strictly prohibited'));
    });

    it('should reject duplicate referral claim on same account with 409 Conflict', async () => {
      // Citizen 1 refers Citizen 3
      const ref1Res = await client.get('/api/v1/coins/referral', {
        Authorization: `Bearer ${citizen1.token}`,
      });
      const code1 = (await ref1Res.json()).data.referralCode;

      await client.post('/api/v1/coins/referral/apply', {
        referralCode: code1,
      }, { Authorization: `Bearer ${citizen3.token}` });

      // Citizen 3 attempts to apply another referral code
      const dupRes = await client.post('/api/v1/coins/referral/apply', {
        referralCode: code1,
      }, { Authorization: `Bearer ${citizen3.token}` });

      assert.strictEqual(dupRes.status, 409);
      const dupJson = await dupRes.json();
      assert.ok(dupJson.error.message.includes('already been applied'));
    });

    it('should return 404 for invalid referral code', async () => {
      const res = await client.post('/api/v1/coins/referral/apply', {
        referralCode: 'BNW-INVALID99',
      }, { Authorization: `Bearer ${citizen1.token}` });

      assert.strictEqual(res.status, 404);
    });
  });

  describe('9. Administrative Controls & RBAC Enforcement (Section 8)', () => {
    it('should allow ROLE_ADMIN to perform manual coin adjustment with auditable reason', async () => {
      const res = await client.post('/api/v1/admin/coins/adjust', {
        userId: citizen1.id,
        amount: 50,
        direction: 'credit',
        reason: 'Community contest award winner for district reporting feedback',
        idempotencyKey: 'admin-adj-contest-winner-1',
      }, { Authorization: `Bearer ${adminUser.token}` });

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.wallet.balanceCoins, 50);
      assert.strictEqual(json.data.transaction.direction, 'credit');
      assert.strictEqual(json.data.transaction.adminActorId, adminUser.id);
    });

    it('should reject non-admin users (ROLE_CITIZEN, ROLE_REPORTER_STANDARD) with 403 Forbidden', async () => {
      const citizenAdj = await client.post('/api/v1/admin/coins/adjust', {
        userId: citizen2.id,
        amount: 50,
        direction: 'credit',
        reason: 'Unauthorized attempt to self-credit coins',
        idempotencyKey: 'unauth-adj-1',
      }, { Authorization: `Bearer ${citizen1.token}` });
      assert.strictEqual(citizenAdj.status, 403);

      const reporterAdj = await client.post('/api/v1/admin/coins/adjust', {
        userId: citizen2.id,
        amount: 50,
        direction: 'credit',
        reason: 'Reporter attempting administrative adjustment',
        idempotencyKey: 'unauth-adj-2',
      }, { Authorization: `Bearer ${reporterUser.token}` });
      assert.strictEqual(reporterAdj.status, 403);
    });

    it('should reject administrative adjustment when reason is less than 10 characters (422)', async () => {
      const res = await client.post('/api/v1/admin/coins/adjust', {
        userId: citizen1.id,
        amount: 20,
        direction: 'credit',
        reason: 'Short',
        idempotencyKey: 'admin-short-reason-1',
      }, { Authorization: `Bearer ${adminUser.token}` });

      assert.strictEqual(res.status, 422);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.error.details.some((d: any) => d.message.includes('10 characters')));
    });

    it('should allow admin to view any user wallet via GET /admin/coins/users/:userId/wallet', async () => {
      const res = await client.get(`/api/v1/admin/coins/users/${citizen1.id}/wallet`, {
        Authorization: `Bearer ${adminUser.token}`
      });

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.userId, citizen1.id);
    });
  });

  describe('10. Rewards Catalog & Daily Quota Status', () => {
    it('should return approved digital perks and remaining daily quota via GET /rewards', async () => {
      // Credit 20 coins today
      await client.post('/api/v1/coins/credit', {
        amount: 20,
        transactionType: TRANSACTION_TYPES.ARTICLE_READ,
        idempotencyKey: 'rewards-quota-fund-1',
      }, { Authorization: `Bearer ${citizen1.token}` });

      const res = await client.get('/api/v1/coins/rewards', {
        Authorization: `Bearer ${citizen1.token}`,
      });

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.ok(Array.isArray(json.data.perks), 'Must return perks array');
      assert.ok(json.data.perks.length >= 3, 'Must have at least 3 perks');
      assert.strictEqual(json.data.dailyStatus.dailyCap, 50);
      assert.strictEqual(json.data.dailyStatus.earnedToday, 20);
      assert.strictEqual(json.data.dailyStatus.remainingQuota, 30);
    });
  });
});
