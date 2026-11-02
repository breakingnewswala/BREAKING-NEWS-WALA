/**
 * BREAKING NEWS WALA — Auth Request Validation Schemas
 * Grounded in docs/13-API.md (Section 1.4 & Section 6) and docs/14-Auth.md
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../errors/app-error';
import { ApiErrorDetail } from '@bnw/types';

export function validateRegister(req: Request, _res: Response, next: NextFunction): void {
  const { fullName, password, phoneNumber, email } = req.body || {};
  const errors: ApiErrorDetail[] = [];

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    errors.push({
      field: 'body.fullName',
      code: 'ERR_INVALID_FULL_NAME',
      message: 'Full name is required and must be at least 2 characters long.',
    });
  }

  if (!password || typeof password !== 'string' || password.length < 10) {
    errors.push({
      field: 'body.password',
      code: 'ERR_PASSWORD_TOO_SHORT',
      message: 'Password is required and must be at least 10 characters long.',
    });
  }

  const hasPhone = phoneNumber && typeof phoneNumber === 'string' && phoneNumber.trim().length > 0;
  const hasEmail = email && typeof email === 'string' && email.trim().length > 0;

  if (!hasPhone && !hasEmail) {
    errors.push({
      field: 'body.phoneNumber',
      code: 'ERR_CONTACT_INFO_REQUIRED',
      message: 'Either phoneNumber or email must be provided for registration.',
    });
  }

  if (hasPhone) {
    const cleanPhone = phoneNumber.replace(/[\s-]/g, '');
    const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      errors.push({
        field: 'body.phoneNumber',
        code: 'ERR_INVALID_PHONE_FORMAT',
        message: 'Phone number must be a valid 10-digit Indian mobile number (+91 optional).',
      });
    }
  }

  if (hasEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push({
        field: 'body.email',
        code: 'ERR_INVALID_EMAIL_FORMAT',
        message: 'Email address is invalid.',
      });
    }
  }

  if (errors.length > 0) {
    return next(AppError.validationFailed('Registration validation failed', errors));
  }

  next();
}

export function validateLogin(req: Request, _res: Response, next: NextFunction): void {
  const { identifier, phoneNumber, email, password } = req.body || {};
  const errors: ApiErrorDetail[] = [];

  const contact = identifier || phoneNumber || email;
  if (!contact || typeof contact !== 'string' || contact.trim().length === 0) {
    errors.push({
      field: 'body.identifier',
      code: 'ERR_IDENTIFIER_REQUIRED',
      message: 'Login requires an identifier (phone number or email).',
    });
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push({
      field: 'body.password',
      code: 'ERR_PASSWORD_REQUIRED',
      message: 'Password is required.',
    });
  }

  if (errors.length > 0) {
    return next(AppError.validationFailed('Login validation failed', errors));
  }

  next();
}

