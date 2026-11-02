/**
 * BREAKING NEWS WALA — Coin Ledger & Wallet Request Validators
 * Grounded in docs/13-API.md, docs/06-Business-Rules.md, and prompt Section 3, 5, 8, 11.
 */

import { Request, Response, NextFunction } from 'express';
import { ApiErrorDetail } from '@bnw/types';
import { AppError } from '../../errors/app-error';
import { COIN_LIMITS, TRANSACTION_TYPES } from './coin.constants';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REFERRAL_CODE_REGEX = /^[A-Z0-9-]{6,20}$/i;

/**
 * Validates credit or debit operation inputs
 */
export function validateCreditDebit(req: Request, _res: Response, next: NextFunction): void {
  const { amount, transactionType, description, idempotencyKey } = req.body || {};
  const headerIdempotency = req.headers['x-idempotency-key'] as string | undefined;
  const effectiveIdempotencyKey = (idempotencyKey || headerIdempotency)?.trim();

  const errors: ApiErrorDetail[] = [];

  // Integer-based coin quantity validation (Financial Integrity Invariant)
  if (amount === undefined || amount === null) {
    errors.push({
      field: 'body.amount',
      code: 'ERR_REQUIRED_FIELD',
      message: 'amount is required.',
    });
  } else if (
    typeof amount !== 'number' ||
    !Number.isInteger(amount) ||
    amount <= 0 ||
    amount > COIN_LIMITS.MAX_SINGLE_TRANSACTION_AMOUNT
  ) {
    errors.push({
      field: 'body.amount',
      code: 'ERR_INVALID_COIN_AMOUNT',
      message: `amount must be an integer between ${COIN_LIMITS.MIN_TRANSACTION_AMOUNT} and ${COIN_LIMITS.MAX_SINGLE_TRANSACTION_AMOUNT}. Floating-point numbers and negative values are strictly prohibited.`,
    });
  }

  // Transaction type validation
  const validTypes = Object.values(TRANSACTION_TYPES);
  if (!transactionType || typeof transactionType !== 'string') {
    errors.push({
      field: 'body.transactionType',
      code: 'ERR_REQUIRED_FIELD',
      message: 'transactionType is required.',
    });
  } else if (!validTypes.includes(transactionType as any)) {
    errors.push({
      field: 'body.transactionType',
      code: 'ERR_INVALID_TRANSACTION_TYPE',
      message: `transactionType must be one of: ${validTypes.join(', ')}.`,
    });
  }

  // Idempotency key validation (Replay Protection Invariant)
  if (!effectiveIdempotencyKey) {
    errors.push({
      field: 'header.x-idempotency-key',
      code: 'ERR_IDEMPOTENCY_REQUIRED',
      message: 'An idempotency key is required via X-Idempotency-Key header or body.idempotencyKey.',
    });
  } else if (effectiveIdempotencyKey.length < 8 || effectiveIdempotencyKey.length > 100) {
    errors.push({
      field: 'header.x-idempotency-key',
      code: 'ERR_INVALID_IDEMPOTENCY_KEY',
      message: 'idempotencyKey must be between 8 and 100 characters in length.',
    });
  }

  // Description length validation
  if (description && typeof description === 'string' && description.length > COIN_LIMITS.MAX_DESCRIPTION_LENGTH) {
    errors.push({
      field: 'body.description',
      code: 'ERR_STRING_TOO_LONG',
      message: `description must not exceed ${COIN_LIMITS.MAX_DESCRIPTION_LENGTH} characters.`,
    });
  }

  if (errors.length > 0) {
    return next(AppError.validationFailed('Coin transaction validation failed.', errors));
  }

  // Attach resolved idempotencyKey for controller convenience
  req.body.idempotencyKey = effectiveIdempotencyKey;
  next();
}

/**
 * Validates administrative manual coin adjustment (Section 8)
 */
export function validateAdminAdjustment(req: Request, _res: Response, next: NextFunction): void {
  const { userId, amount, direction, reason, idempotencyKey } = req.body || {};
  const headerIdempotency = req.headers['x-idempotency-key'] as string | undefined;
  const effectiveIdempotencyKey = (idempotencyKey || headerIdempotency)?.trim();

  const errors: ApiErrorDetail[] = [];

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    errors.push({
      field: 'body.userId',
      code: 'ERR_REQUIRED_FIELD',
      message: 'Target userId is required.',
    });
  }

  if (amount === undefined || amount === null) {
    errors.push({
      field: 'body.amount',
      code: 'ERR_REQUIRED_FIELD',
      message: 'amount is required.',
    });
  } else if (
    typeof amount !== 'number' ||
    !Number.isInteger(amount) ||
    amount <= 0 ||
    amount > COIN_LIMITS.MAX_SINGLE_TRANSACTION_AMOUNT
  ) {
    errors.push({
      field: 'body.amount',
      code: 'ERR_INVALID_COIN_AMOUNT',
      message: `amount must be an integer between 1 and ${COIN_LIMITS.MAX_SINGLE_TRANSACTION_AMOUNT}.`,
    });
  }

  if (!direction || !['credit', 'debit'].includes(direction)) {
    errors.push({
      field: 'body.direction',
      code: 'ERR_INVALID_DIRECTION',
      message: 'direction must be either "credit" or "debit".',
    });
  }

  if (!reason || typeof reason !== 'string' || reason.trim().length < COIN_LIMITS.MIN_ADMIN_REASON_LENGTH) {
    errors.push({
      field: 'body.reason',
      code: 'ERR_REASON_REQUIRED',
      message: `An auditable administrative reason of at least ${COIN_LIMITS.MIN_ADMIN_REASON_LENGTH} characters is mandatory.`,
    });
  }

  if (!effectiveIdempotencyKey) {
    errors.push({
      field: 'header.x-idempotency-key',
      code: 'ERR_IDEMPOTENCY_REQUIRED',
      message: 'An idempotency key is required.',
    });
  }

  if (errors.length > 0) {
    return next(AppError.validationFailed('Administrative coin adjustment validation failed.', errors));
  }

  req.body.idempotencyKey = effectiveIdempotencyKey;
  next();
}

/**
 * Validates referral code application
 */
export function validateApplyReferral(req: Request, _res: Response, next: NextFunction): void {
  const { referralCode } = req.body || {};
  const errors: ApiErrorDetail[] = [];

  if (!referralCode || typeof referralCode !== 'string') {
    errors.push({
      field: 'body.referralCode',
      code: 'ERR_REQUIRED_FIELD',
      message: 'referralCode is required.',
    });
  } else if (!REFERRAL_CODE_REGEX.test(referralCode.trim())) {
    errors.push({
      field: 'body.referralCode',
      code: 'ERR_INVALID_REFERRAL_CODE',
      message: 'referralCode must be between 6 and 20 alphanumeric characters.',
    });
  }

  if (errors.length > 0) {
    return next(AppError.validationFailed('Referral application validation failed.', errors));
  }

  next();
}

/**
 * Validates transaction ID parameter in URL
 */
export function validateTransactionIdParam(req: Request, _res: Response, next: NextFunction): void {
  const { id } = req.params;
  const isIdLike = typeof id === 'string' && (UUID_REGEX.test(id) || id.startsWith('ctx-'));

  if (!id || !isIdLike) {
    return next(AppError.validationFailed(`Invalid transaction ID "${id}".`));
  }
  next();
}

/**
 * Validates query pagination parameters
 */
export function validatePagination(req: Request, _res: Response, next: NextFunction): void {
  const { page, limit } = req.query;

  if (page !== undefined) {
    const p = parseInt(page as string, 10);
    if (isNaN(p) || p <= 0) {
      return next(AppError.validationFailed('Query parameter "page" must be a positive integer.'));
    }
  }

  if (limit !== undefined) {
    const l = parseInt(limit as string, 10);
    if (isNaN(l) || l <= 0 || l > 100) {
      return next(AppError.validationFailed('Query parameter "limit" must be between 1 and 100.'));
    }
  }

  next();
}

