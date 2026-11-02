/**
 * BREAKING NEWS WALA — SEO Request Validator
 * Validates metadata lengths as editorial guidance.
 */

import { Request, Response, NextFunction } from 'express';
import { ApiErrorDetail } from '@bnw/types';
import { AppError } from '../../errors/app-error';

export function validateSeoUpdate(req: Request, _res: Response, next: NextFunction): void {
  const body = req.body;
  const errors: ApiErrorDetail[] = [];

  if (!body || typeof body !== 'object') {
    return next(AppError.badRequest('Invalid payload. Expected a JSON object with SEO fields.'));
  }

  if (body.seoTitle !== undefined && typeof body.seoTitle === 'string' && body.seoTitle.length > 200) {
    errors.push({
      field: 'body.seoTitle',
      code: 'ERR_MAX_LENGTH',
      message: 'seoTitle must not exceed 200 characters.',
    });
  }

  if (body.metaDescription !== undefined && typeof body.metaDescription === 'string' && body.metaDescription.length > 320) {
    errors.push({
      field: 'body.metaDescription',
      code: 'ERR_MAX_LENGTH',
      message: 'metaDescription must not exceed 320 characters.',
    });
  }

  if (body.canonicalUrl !== undefined && typeof body.canonicalUrl === 'string') {
    if (body.canonicalUrl.length > 0 && !body.canonicalUrl.startsWith('http')) {
      errors.push({
        field: 'body.canonicalUrl',
        code: 'ERR_INVALID_URL',
        message: 'canonicalUrl must be a valid absolute HTTP/HTTPS URL.',
      });
    }
  }

  if (errors.length > 0) {
    return next(AppError.validationFailed('SEO metadata validation failed.', errors));
  }

  next();
}
