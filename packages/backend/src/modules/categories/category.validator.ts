/**
 * BREAKING NEWS WALA — Category Request Validators
 * Grounded in docs/13-API.md (Section 1.4: Validation & Input Sanitization)
 * and docs/06-Business-Rules.md (RULE-CAT-001, RULE-CAT-004)
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../errors/app-error';
import { ApiErrorDetail } from '@bnw/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateCategoryIdOrSlug(req: Request, _res: Response, next: NextFunction): void {
  const { idOrSlug } = req.params;

  if (!idOrSlug || typeof idOrSlug !== 'string' || idOrSlug.trim() === '') {
    return next(
      AppError.validationFailed('Category identifier (UUID or slug) is required.', [
        {
          field: 'params.idOrSlug',
          code: 'ERR_REQUIRED_FIELD',
          message: 'Category identifier is required.',
        },
      ])
    );
  }

  const trimmed = idOrSlug.trim();
  const isValid = UUID_REGEX.test(trimmed) || SLUG_REGEX.test(trimmed);

  if (!isValid) {
    return next(
      AppError.validationFailed(
        `Category identifier "${idOrSlug}" must be a valid UUID or lowercase alphanumeric slug.`,
        [
          {
            field: 'params.idOrSlug',
            code: 'ERR_INVALID_CATEGORY_IDENTIFIER',
            message: 'Identifier must match UUID format or slug format (e.g. "top-news").',
          },
        ]
      )
    );
  }

  next();
}

export function validateCategoryQuery(req: Request, _res: Response, next: NextFunction): void {
  const { page, limit, status, sortBy, sortOrder, includeSubcategories } = req.query as Record<string, string>;
  const errors: ApiErrorDetail[] = [];

  if (page !== undefined) {
    const p = Number(page);
    if (isNaN(p) || p < 1 || !Number.isInteger(p)) {
      errors.push({
        field: 'query.page',
        code: 'ERR_INVALID_PAGE',
        message: 'Query parameter "page" must be a positive integer.',
      });
    }
  }

  if (limit !== undefined) {
    const l = Number(limit);
    if (isNaN(l) || l < 1 || l > 100 || !Number.isInteger(l)) {
      errors.push({
        field: 'query.limit',
        code: 'ERR_INVALID_LIMIT',
        message: 'Query parameter "limit" must be an integer between 1 and 100.',
      });
    }
  }

  if (status !== undefined) {
    const allowed = ['active', 'inactive', 'all'];
    if (!allowed.includes(status)) {
      errors.push({
        field: 'query.status',
        code: 'ERR_INVALID_STATUS_FILTER',
        message: `Query parameter "status" must be one of: ${allowed.join(', ')}.`,
      });
    }
  }

  if (sortBy !== undefined) {
    const allowed = ['displayOrder', 'nameEn', 'nameHi'];
    if (!allowed.includes(sortBy)) {
      errors.push({
        field: 'query.sortBy',
        code: 'ERR_INVALID_SORT_BY',
        message: `Query parameter "sortBy" must be one of: ${allowed.join(', ')}.`,
      });
    }
  }

  if (sortOrder !== undefined) {
    const allowed = ['asc', 'desc'];
    if (!allowed.includes(sortOrder.toLowerCase())) {
      errors.push({
        field: 'query.sortOrder',
        code: 'ERR_INVALID_SORT_ORDER',
        message: 'Query parameter "sortOrder" must be either "asc" or "desc".',
      });
    }
  }

  if (includeSubcategories !== undefined) {
    const allowed = ['true', 'false'];
    if (!allowed.includes(includeSubcategories.toLowerCase())) {
      errors.push({
        field: 'query.includeSubcategories',
        code: 'ERR_INVALID_BOOLEAN',
        message: 'Query parameter "includeSubcategories" must be "true" or "false".',
      });
    }
  }

  if (errors.length > 0) {
    return next(AppError.validationFailed('Invalid category query parameters.', errors));
  }

  next();
}

export function validateTaxonomyBody(req: Request, _res: Response, next: NextFunction): void {
  const { primaryCategoryId, subcategoryId } = req.body || {};
  const errors: ApiErrorDetail[] = [];

  if (!primaryCategoryId || typeof primaryCategoryId !== 'string' || primaryCategoryId.trim() === '') {
    errors.push({
      field: 'body.primaryCategoryId',
      code: 'ERR_REQUIRED_FIELD',
      message: 'Field "primaryCategoryId" is required.',
    });
  } else {
    const trimmed = primaryCategoryId.trim();
    if (!UUID_REGEX.test(trimmed) && !SLUG_REGEX.test(trimmed)) {
      errors.push({
        field: 'body.primaryCategoryId',
        code: 'ERR_INVALID_IDENTIFIER',
        message: 'Field "primaryCategoryId" must be a valid UUID or slug.',
      });
    }
  }

  if (subcategoryId !== undefined && subcategoryId !== null && subcategoryId !== '') {
    if (typeof subcategoryId !== 'string') {
      errors.push({
        field: 'body.subcategoryId',
        code: 'ERR_INVALID_IDENTIFIER',
        message: 'Field "subcategoryId" must be a string.',
      });
    } else {
      const trimmed = subcategoryId.trim();
      if (!UUID_REGEX.test(trimmed) && !SLUG_REGEX.test(trimmed)) {
        errors.push({
          field: 'body.subcategoryId',
          code: 'ERR_INVALID_IDENTIFIER',
          message: 'Field "subcategoryId" must be a valid UUID or slug.',
        });
      }
    }
  }

  if (errors.length > 0) {
    return next(AppError.validationFailed('Invalid taxonomy validation request body.', errors));
  }

  next();
}
