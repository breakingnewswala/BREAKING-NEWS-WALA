/**
 * BREAKING NEWS WALA — Territory Request Validators
 * Grounded in docs/13-API.md (Section 1.4: Validation & Input Sanitization)
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../errors/app-error';
import { ApiErrorDetail } from '@bnw/types';

export function validateTerritoryQuery(req: Request, _res: Response, next: NextFunction): void {
  const { page, limit, status, sortBy, sortOrder, search } = req.query as Record<string, string>;
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
        message: `Query parameter "sortOrder" must be either "asc" or "desc".`,
      });
    }
  }

  if (search !== undefined && typeof search === 'string' && search.length > 100) {
    errors.push({
      field: 'query.search',
      code: 'ERR_SEARCH_TOO_LONG',
      message: 'Search query must be at most 100 characters long.',
    });
  }

  if (errors.length > 0) {
    return next(AppError.validationFailed('Invalid query parameters', errors));
  }

  next();
}

export function validateIdOrSlug(req: Request, _res: Response, next: NextFunction): void {
  const { idOrSlug } = req.params;

  if (!idOrSlug || typeof idOrSlug !== 'string' || idOrSlug.trim() === '') {
    return next(
      AppError.badRequest('Route parameter "idOrSlug" is required.', [
        {
          field: 'params.idOrSlug',
          code: 'ERR_REQUIRED_PARAM',
          message: 'Geographic identifier or slug must be provided in URL path.',
        },
      ])
    );
  }

  // Check valid slug or UUID pattern
  const isSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(idOrSlug);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  if (!isSlug && !isUuid) {
    return next(
      AppError.badRequest('Route parameter "idOrSlug" must be a valid UUID or hyphenated slug.', [
        {
          field: 'params.idOrSlug',
          code: 'ERR_INVALID_SLUG_FORMAT',
          message: `"${idOrSlug}" is neither a valid UUID nor an acceptable slug.`,
        },
      ])
    );
  }

  next();
}

