/**
 * BREAKING NEWS WALA — Notification Request Validators
 * Grounded in docs/13-API.md (Section 15), docs/06-Business-Rules.md (RULE-NOT-001, RULE-NOT-003),
 * and docs/DECISIONS.md (DEC-026).
 */

import { Request, Response, NextFunction } from 'express';
import { ApiErrorDetail } from '@bnw/types';
import { AppError } from '../../errors/app-error';
import { DEVICE_PLATFORMS, NOTIFICATION_LIMITS } from './notification.constants';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Validates device registration request
 */
export function validateRegisterDevice(req: Request, _res: Response, next: NextFunction): void {
  const { platform, pushToken } = req.body || {};
  const errors: ApiErrorDetail[] = [];

  if (!platform || typeof platform !== 'string') {
    errors.push({
      field: 'body.platform',
      code: 'ERR_REQUIRED_FIELD',
      message: 'platform is required and must be one of: android, web, ios.',
    });
  } else if (!DEVICE_PLATFORMS.includes(platform.toLowerCase().trim() as any)) {
    errors.push({
      field: 'body.platform',
      code: 'ERR_INVALID_PLATFORM',
      message: `platform must be one of: ${DEVICE_PLATFORMS.join(', ')}.`,
    });
  }

  if (!pushToken || typeof pushToken !== 'string' || pushToken.trim() === '') {
    errors.push({
      field: 'body.pushToken',
      code: 'ERR_REQUIRED_FIELD',
      message: 'pushToken is required.',
    });
  } else if (
    pushToken.trim().length < NOTIFICATION_LIMITS.MIN_TOKEN_LENGTH ||
    pushToken.trim().length > NOTIFICATION_LIMITS.MAX_TOKEN_LENGTH
  ) {
    errors.push({
      field: 'body.pushToken',
      code: 'ERR_INVALID_TOKEN_LENGTH',
      message: `pushToken length must be between ${NOTIFICATION_LIMITS.MIN_TOKEN_LENGTH} and ${NOTIFICATION_LIMITS.MAX_TOKEN_LENGTH} characters.`,
    });
  }

  if (errors.length > 0) {
    return next(AppError.validationFailed('Device registration request validation failed.', errors));
  }

  next();
}

/**
 * Validates user notification preferences update (NOTIF-05)
 */
export function validateUpdatePreferences(req: Request, _res: Response, next: NextFunction): void {
  const {
    breakingNews,
    districtNews,
    preferredDistrictId,
    categoryIds,
    quietHoursEnabled,
    quietHoursStart,
    quietHoursEnd,
  } = req.body || {};
  const errors: ApiErrorDetail[] = [];

  if (breakingNews !== undefined && typeof breakingNews !== 'boolean') {
    errors.push({
      field: 'body.breakingNews',
      code: 'ERR_INVALID_TYPE',
      message: 'breakingNews must be a boolean.',
    });
  }

  if (districtNews !== undefined && typeof districtNews !== 'boolean') {
    errors.push({
      field: 'body.districtNews',
      code: 'ERR_INVALID_TYPE',
      message: 'districtNews must be a boolean.',
    });
  }

  if (preferredDistrictId !== undefined && preferredDistrictId !== null) {
    if (typeof preferredDistrictId !== 'string' || preferredDistrictId.trim() === '') {
      errors.push({
        field: 'body.preferredDistrictId',
        code: 'ERR_INVALID_DISTRICT_ID',
        message: 'preferredDistrictId must be a valid non-empty string identifier.',
      });
    }
  }

  if (categoryIds !== undefined) {
    if (!Array.isArray(categoryIds) || categoryIds.some((id) => typeof id !== 'string')) {
      errors.push({
        field: 'body.categoryIds',
        code: 'ERR_INVALID_TYPE',
        message: 'categoryIds must be an array of string category identifiers.',
      });
    }
  }

  if (quietHoursEnabled !== undefined && typeof quietHoursEnabled !== 'boolean') {
    errors.push({
      field: 'body.quietHoursEnabled',
      code: 'ERR_INVALID_TYPE',
      message: 'quietHoursEnabled must be a boolean.',
    });
  }

  if (quietHoursStart !== undefined && (typeof quietHoursStart !== 'string' || !TIME_REGEX.test(quietHoursStart))) {
    errors.push({
      field: 'body.quietHoursStart',
      code: 'ERR_INVALID_TIME_FORMAT',
      message: 'quietHoursStart must match 24-hour format HH:MM (e.g. 22:00).',
    });
  }

  if (quietHoursEnd !== undefined && (typeof quietHoursEnd !== 'string' || !TIME_REGEX.test(quietHoursEnd))) {
    errors.push({
      field: 'body.quietHoursEnd',
      code: 'ERR_INVALID_TIME_FORMAT',
      message: 'quietHoursEnd must match 24-hour format HH:MM (e.g. 06:00).',
    });
  }

  if (errors.length > 0) {
    return next(AppError.validationFailed('Notification preferences validation failed.', errors));
  }

  next();
}

/**
 * Validates administrative broadcast request (NOTIF-06, RULE-NOT-001)
 */
export function validateAdminBroadcast(req: Request, _res: Response, next: NextFunction): void {
  const { title, body, targetDistrictId, targetScreenUri } = req.body || {};
  const errors: ApiErrorDetail[] = [];

  if (!title || typeof title !== 'string' || title.trim() === '') {
    errors.push({
      field: 'body.title',
      code: 'ERR_REQUIRED_FIELD',
      message: 'Broadcast notification title is required.',
    });
  } else if (
    title.trim().length < NOTIFICATION_LIMITS.MIN_TITLE_LENGTH ||
    title.trim().length > NOTIFICATION_LIMITS.MAX_TITLE_LENGTH
  ) {
    errors.push({
      field: 'body.title',
      code: 'ERR_TITLE_LENGTH',
      message: `title must be between ${NOTIFICATION_LIMITS.MIN_TITLE_LENGTH} and ${NOTIFICATION_LIMITS.MAX_TITLE_LENGTH} characters.`,
    });
  }

  if (!body || typeof body !== 'string' || body.trim() === '') {
    errors.push({
      field: 'body.body',
      code: 'ERR_REQUIRED_FIELD',
      message: 'Broadcast notification body is required.',
    });
  } else if (
    body.trim().length < NOTIFICATION_LIMITS.MIN_BODY_LENGTH ||
    body.trim().length > NOTIFICATION_LIMITS.MAX_BODY_LENGTH
  ) {
    errors.push({
      field: 'body.body',
      code: 'ERR_BODY_LENGTH',
      message: `body must be between ${NOTIFICATION_LIMITS.MIN_BODY_LENGTH} and ${NOTIFICATION_LIMITS.MAX_BODY_LENGTH} characters.`,
    });
  }

  if (targetDistrictId !== undefined && targetDistrictId !== null) {
    if (typeof targetDistrictId !== 'string' || targetDistrictId.trim() === '') {
      errors.push({
        field: 'body.targetDistrictId',
        code: 'ERR_INVALID_DISTRICT_ID',
        message: 'targetDistrictId must be a valid string identifier.',
      });
    }
  }

  if (targetScreenUri !== undefined && targetScreenUri !== null) {
    if (typeof targetScreenUri !== 'string' || !targetScreenUri.startsWith('/')) {
      errors.push({
        field: 'body.targetScreenUri',
        code: 'ERR_INVALID_DEEP_LINK',
        message: 'targetScreenUri must be a valid relative path starting with "/".',
      });
    }
  }

  if (errors.length > 0) {
    return next(AppError.validationFailed('Admin broadcast validation failed.', errors));
  }

  next();
}

/**
 * Validates notification ID URL parameter (NOTIF-02)
 */
export function validateNotificationIdParam(req: Request, _res: Response, next: NextFunction): void {
  const { id } = req.params;
  const isIdLike = (typeof id === 'string') && (UUID_REGEX.test(id.trim()) || id.trim().startsWith('notif-'));

  if (!id || !isIdLike) {
    return next(
      AppError.validationFailed(`Invalid notification identifier "${id}". Must be a valid ID.`)
    );
  }
  next();
}

/**
 * Validates internal article published event before enqueuing (Section 5)
 */
export function validatePublishedArticleEvent(event: any): { isValid: boolean; error?: string } {
  if (!event || typeof event !== 'object') {
    return { isValid: false, error: 'Event payload must be a non-null object.' };
  }

  if (!event.eventId || typeof event.eventId !== 'string') {
    return { isValid: false, error: 'eventId is required.' };
  }

  if (!event.articleId || typeof event.articleId !== 'string') {
    return { isValid: false, error: 'articleId is required.' };
  }

  if (!event.title || typeof event.title !== 'string' || event.title.trim().length < 5) {
    return { isValid: false, error: 'Valid article title is required.' };
  }

  if (!event.slug || typeof event.slug !== 'string') {
    return { isValid: false, error: 'article slug is required.' };
  }

  if (!event.districtId || typeof event.districtId !== 'string') {
    return { isValid: false, error: 'districtId is required for geographic targeting.' };
  }

  if (typeof event.isBreaking !== 'boolean') {
    return { isValid: false, error: 'isBreaking must be a boolean flag.' };
  }

  if (!event.publishedAt || typeof event.publishedAt !== 'string') {
    return { isValid: false, error: 'publishedAt timestamp is required.' };
  }

  return { isValid: true };
}
