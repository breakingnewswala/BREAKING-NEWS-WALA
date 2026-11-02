/**
 * BREAKING NEWS WALA — Article Request Validators & Content Sanitization
 * Grounded in docs/06-Business-Rules.md (RULE-NEWS-003, RULE-NEWS-004, RULE-NEWS-005, RULE-EDIT-005)
 * and docs/13-API.md (Section 1.4: Validation & Input Sanitization)
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../errors/app-error';
import { ApiErrorDetail } from '@bnw/types';

const DEVANAGARI_REGEX = /[\u0900-\u097F]/;
const DISALLOWED_HTML_TAGS = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>|<iframe\b|<embed\b|<object\b|on\w+\s*=/i;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PUBLIC_ID_REGEX = /^art_[a-z0-9_-]+$/i;

/**
 * Counts words by splitting across spaces, tabs, and newlines.
 */
export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function validateCreateArticle(req: Request, _res: Response, next: NextFunction): void {
  const { title, subheadline, bodyContent, primaryCategoryId, primaryLocationId, slug } = req.body || {};
  const errors: ApiErrorDetail[] = [];

  // 1. Headline Validation (RULE-NEWS-003: 15–150 chars, Hindi Devanagari presence)
  if (!title || typeof title !== 'string' || title.trim() === '') {
    errors.push({
      field: 'body.title',
      code: 'ERR_REQUIRED_FIELD',
      message: 'Article title/headline is required.',
    });
  } else {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 15 || trimmedTitle.length > 150) {
      errors.push({
        field: 'body.title',
        code: 'ERR_HEADLINE_LENGTH',
        message: 'News headline must contain between 15 and 150 characters (RULE-NEWS-003).',
      });
    }

    if (!DEVANAGARI_REGEX.test(trimmedTitle)) {
      errors.push({
        field: 'body.title',
        code: 'ERR_HEADLINE_SCRIPT',
        message: 'News headline must be in Hindi (must contain Devanagari characters) (RULE-NEWS-003).',
      });
    }
  }

  // 2. Subheadline (optional, up to 250 chars)
  if (subheadline !== undefined && subheadline !== null && typeof subheadline === 'string') {
    if (subheadline.trim().length > 250) {
      errors.push({
        field: 'body.subheadline',
        code: 'ERR_SUBHEADLINE_LENGTH',
        message: 'Subheadline must not exceed 250 characters.',
      });
    }
  }

  // 3. Body Content Validation (RULE-NEWS-004: min 50 words or 250 chars, max 5000 words, no malicious tags)
  if (!bodyContent || typeof bodyContent !== 'string' || bodyContent.trim() === '') {
    errors.push({
      field: 'body.bodyContent',
      code: 'ERR_REQUIRED_FIELD',
      message: 'Article body content is required.',
    });
  } else {
    const trimmedBody = bodyContent.trim();
    const words = countWords(trimmedBody);

    if (words < 50 && trimmedBody.length < 250) {
      errors.push({
        field: 'body.bodyContent',
        code: 'ERR_BODY_MIN_LENGTH',
        message: 'Article body must contain at least 50 words or 250 characters (RULE-NEWS-004).',
      });
    }

    if (words > 5000) {
      errors.push({
        field: 'body.bodyContent',
        code: 'ERR_BODY_MAX_LENGTH',
        message: 'Article body must not exceed 5,000 words (RULE-NEWS-004).',
      });
    }

    if (DISALLOWED_HTML_TAGS.test(trimmedBody)) {
      errors.push({
        field: 'body.bodyContent',
        code: 'ERR_DISALLOWED_TAGS',
        message: 'Article body contains prohibited script, style, iframe, or event tags (RULE-NEWS-004).',
      });
    }
  }

  // 4. Primary Category Validation (RULE-NEWS-005)
  if (!primaryCategoryId || typeof primaryCategoryId !== 'string' || primaryCategoryId.trim() === '') {
    errors.push({
      field: 'body.primaryCategoryId',
      code: 'ERR_REQUIRED_FIELD',
      message: 'Primary category identifier (UUID or slug) is required (RULE-NEWS-005).',
    });
  }

  // 5. Primary Location Validation (RULE-NEWS-005)
  if (!primaryLocationId || typeof primaryLocationId !== 'string' || primaryLocationId.trim() === '') {
    errors.push({
      field: 'body.primaryLocationId',
      code: 'ERR_REQUIRED_FIELD',
      message: 'Primary geographic location (District UUID or slug) is required (RULE-NEWS-005).',
    });
  }

  // 6. Optional Slug Validation
  if (slug !== undefined && slug !== null && slug !== '') {
    if (typeof slug !== 'string' || !SLUG_REGEX.test(slug.trim())) {
      errors.push({
        field: 'body.slug',
        code: 'ERR_INVALID_SLUG',
        message: 'Article slug must be lowercase alphanumeric with hyphens.',
      });
    }
  }

  if (errors.length > 0) {
    return next(AppError.validationFailed('Article draft validation failed.', errors));
  }

  next();
}

export function validateUpdateArticle(req: Request, _res: Response, next: NextFunction): void {
  const { title, subheadline, bodyContent, slug } = req.body || {};
  const errors: ApiErrorDetail[] = [];

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length < 15 || title.trim().length > 150) {
      errors.push({
        field: 'body.title',
        code: 'ERR_HEADLINE_LENGTH',
        message: 'News headline must contain between 15 and 150 characters (RULE-NEWS-003).',
      });
    } else if (!DEVANAGARI_REGEX.test(title.trim())) {
      errors.push({
        field: 'body.title',
        code: 'ERR_HEADLINE_SCRIPT',
        message: 'News headline must be in Hindi (must contain Devanagari characters) (RULE-NEWS-003).',
      });
    }
  }

  if (subheadline !== undefined && subheadline !== null && typeof subheadline === 'string') {
    if (subheadline.trim().length > 250) {
      errors.push({
        field: 'body.subheadline',
        code: 'ERR_SUBHEADLINE_LENGTH',
        message: 'Subheadline must not exceed 250 characters.',
      });
    }
  }

  if (bodyContent !== undefined) {
    if (typeof bodyContent !== 'string') {
      errors.push({
        field: 'body.bodyContent',
        code: 'ERR_INVALID_BODY',
        message: 'Article body content must be a string.',
      });
    } else {
      const trimmedBody = bodyContent.trim();
      const words = countWords(trimmedBody);

      if (words < 50 && trimmedBody.length < 250) {
        errors.push({
          field: 'body.bodyContent',
          code: 'ERR_BODY_MIN_LENGTH',
          message: 'Article body must contain at least 50 words or 250 characters (RULE-NEWS-004).',
        });
      }

      if (words > 5000) {
        errors.push({
          field: 'body.bodyContent',
          code: 'ERR_BODY_MAX_LENGTH',
          message: 'Article body must not exceed 5,000 words (RULE-NEWS-004).',
        });
      }

      if (DISALLOWED_HTML_TAGS.test(trimmedBody)) {
        errors.push({
          field: 'body.bodyContent',
          code: 'ERR_DISALLOWED_TAGS',
          message: 'Article body contains prohibited script, style, iframe, or event tags (RULE-NEWS-004).',
        });
      }
    }
  }

  if (slug !== undefined && slug !== null && slug !== '') {
    if (typeof slug !== 'string' || !SLUG_REGEX.test(slug.trim())) {
      errors.push({
        field: 'body.slug',
        code: 'ERR_INVALID_SLUG',
        message: 'Article slug must be lowercase alphanumeric with hyphens.',
      });
    }
  }

  if (errors.length > 0) {
    return next(AppError.validationFailed('Article update validation failed.', errors));
  }

  next();
}

export function validateArticleId(req: Request, _res: Response, next: NextFunction): void {
  const { id } = req.params;

  if (!id || typeof id !== 'string' || id.trim() === '') {
    return next(AppError.validationFailed('Article identifier parameter is required.'));
  }

  const trimmed = id.trim();
  const isValid = UUID_REGEX.test(trimmed) || SLUG_REGEX.test(trimmed) || PUBLIC_ID_REGEX.test(trimmed);

  if (!isValid) {
    return next(
      AppError.validationFailed(`Invalid article identifier "${id}". Must be a valid UUID, publicId, or slug.`)
    );
  }

  next();
}

export function validateReviewAction(req: Request, _res: Response, next: NextFunction): void {
  const { action, reasonCode, feedbackComments } = req.body || {};
  const errors: ApiErrorDetail[] = [];

  const allowedActions = ['claim', 'approve', 'request_changes', 'reject', 'retract'];
  if (!action || !allowedActions.includes(action)) {
    errors.push({
      field: 'body.action',
      code: 'ERR_INVALID_ACTION',
      message: `Editorial review action must be one of: ${allowedActions.join(', ')}.`,
    });
  }

  if (action === 'reject') {
    if (!reasonCode || typeof reasonCode !== 'string' || reasonCode.trim() === '') {
      errors.push({
        field: 'body.reasonCode',
        code: 'ERR_REJECTION_REASON_REQUIRED',
        message: 'Rejection requires a valid reason code (RULE-EDIT-005).',
      });
    }
    if (!feedbackComments || typeof feedbackComments !== 'string' || feedbackComments.trim().length < 10) {
      errors.push({
        field: 'body.feedbackComments',
        code: 'ERR_FEEDBACK_REQUIRED',
        message: 'Rejection requires actionable editorial feedback of at least 10 characters (RULE-EDIT-005).',
      });
    }
  }

  if (action === 'request_changes') {
    if (!feedbackComments || typeof feedbackComments !== 'string' || feedbackComments.trim().length < 10) {
      errors.push({
        field: 'body.feedbackComments',
        code: 'ERR_FEEDBACK_REQUIRED',
        message: 'Revision requests require editorial feedback of at least 10 characters.',
      });
    }
  }

  if (errors.length > 0) {
    return next(AppError.validationFailed('Review action validation failed.', errors));
  }

  next();
}

export function validateIngestArticle(req: Request, _res: Response, next: NextFunction): void {
  const { originalTitle, originalUrl, bodyContent, sourceName } = req.body || {};
  const errors: ApiErrorDetail[] = [];

  if (!originalTitle || typeof originalTitle !== 'string' || originalTitle.trim() === '') {
    errors.push({
      field: 'body.originalTitle',
      code: 'ERR_REQUIRED_FIELD',
      message: 'External article original title is required.',
    });
  }

  if (!originalUrl || typeof originalUrl !== 'string' || originalUrl.trim() === '') {
    errors.push({
      field: 'body.originalUrl',
      code: 'ERR_REQUIRED_FIELD',
      message: 'External article source URL is required.',
    });
  }

  if (!bodyContent || typeof bodyContent !== 'string' || bodyContent.trim() === '') {
    errors.push({
      field: 'body.bodyContent',
      code: 'ERR_REQUIRED_FIELD',
      message: 'External article body content is required.',
    });
  }

  if (!sourceName || typeof sourceName !== 'string' || sourceName.trim() === '') {
    errors.push({
      field: 'body.sourceName',
      code: 'ERR_REQUIRED_FIELD',
      message: 'Source syndication name is required.',
    });
  }

  if (errors.length > 0) {
    return next(AppError.validationFailed('Ingestion validation failed.', errors));
  }

  next();
}

