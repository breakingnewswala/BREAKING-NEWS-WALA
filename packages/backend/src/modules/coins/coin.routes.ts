/**
 * BREAKING NEWS WALA — Coin Ledger & Wallet Routes
 * Grounded in docs/13-API.md (COIN-01, COIN-02), docs/DECISIONS.md (DEC-007),
 * and prompt Section 8 & 9.
 */

import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { coinController } from './coin.controller';
import {
  validateAdminAdjustment,
  validateApplyReferral,
  validateCreditDebit,
  validatePagination,
  validateTransactionIdParam,
} from './coin.validator';

const router = Router();
const adminRouter = Router();

// 1. Citizen Coin Wallet & Balance (COIN-01)
router.get('/wallet', requireAuth, coinController.getWallet);

// 2. Transaction History & Detail (COIN-02)
router.get('/transactions', requireAuth, validatePagination, coinController.getTransactionHistory);
router.get('/transactions/:id', requireAuth, validateTransactionIdParam, coinController.getTransactionDetail);

// 3. Digital Perks & Non-Monetary Rewards Catalog
router.get('/rewards', requireAuth, coinController.getRewards);

// 4. Referral Management & Attribution
router.get('/referral', requireAuth, coinController.getReferral);
router.post('/referral/apply', requireAuth, validateApplyReferral, coinController.applyReferral);

// 5. Internal / Protected Event Operation Endpoints
router.post('/credit', requireAuth, validateCreditDebit, coinController.creditCoins);
router.post('/debit', requireAuth, validateCreditDebit, coinController.debitCoins);

// 6. Administrative Coin Ledger Management (Section 8)
adminRouter.post('/adjust', requireAuth, validateAdminAdjustment, coinController.adminAdjust);
adminRouter.post('/compensate/:id', requireAuth, validateTransactionIdParam, coinController.compensate);
adminRouter.get('/users/:userId/wallet', requireAuth, coinController.getAdminUserWallet);

export { router as coinRouter, adminRouter as adminCoinRouter };

