/**
 * BREAKING NEWS WALA — E-Paper Request Validator
 * Validates PDF buffer magic bytes, size limits, and edition attributes.
 */

import { Request, Response, NextFunction } from 'express';
import { ApiErrorDetail } from '@bnw/types';
import { AppError } from '../../errors/app-error';
import { EPAPER_LIMITS, EPAPER_EDITION_TYPES } from './epaper.constants';

export function validateCreateEdition(req: Request, _res: Response, next: NextFunction): void {
  const body = req.body;
  const errors: ApiErrorDetail[] = [];

  if (!body || typeof body !== 'object') {
    return next(AppError.badRequest('Invalid payload format. Expected a JSON object.'));
  }

  const { editionCode, title, editionDate, editionType, pageCount } = body;

  if (!editionCode || typeof editionCode !== 'string' || editionCode.trim().length < 3) {
    errors.push({
      field: 'body.editionCode',
      code: 'ERR_REQUIRED_FIELD',
      message: 'editionCode is required and must be at least 3 characters.',
    });
  }

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    errors.push({
      field: 'body.title',
      code: 'ERR_REQUIRED_FIELD',
      message: 'title is required and must be at least 3 characters.',
    });
  }

  if (!editionDate || isNaN(Date.parse(editionDate))) {
    errors.push({
      field: 'body.editionDate',
      code: 'ERR_INVALID_DATE',
      message: 'editionDate must be a valid date string (YYYY-MM-DD).',
    });
  }

  if (editionType && !EPAPER_EDITION_TYPES.includes(editionType)) {
    errors.push({
      field: 'body.editionType',
      code: 'ERR_INVALID_VALUE',
      message: `editionType must be one of: ${EPAPER_EDITION_TYPES.join(', ')}.`,
    });
  }

  if (pageCount !== undefined && (typeof pageCount !== 'number' || pageCount < EPAPER_LIMITS.MIN_PAGE_COUNT || pageCount > EPAPER_LIMITS.MAX_PAGE_COUNT)) {
    errors.push({
      field: 'body.pageCount',
      code: 'ERR_INVALID_RANGE',
      message: `pageCount must be between ${EPAPER_LIMITS.MIN_PAGE_COUNT} and ${EPAPER_LIMITS.MAX_PAGE_COUNT}.`,
    });
  }

  if (errors.length > 0) {
    return next(AppError.validationFailed('E-Paper edition creation validation failed.', errors));
  }

  next();
}

/**
 * Validates raw PDF buffer signature (Magic bytes: %PDF- / 0x25 0x50 0x44 0x46 0x2D).
 */
export function validatePdfSignature(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 5) return false;
  return (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  );
}
