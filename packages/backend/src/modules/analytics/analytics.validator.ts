/**
 * BREAKING NEWS WALA — Analytics Request Validators
 * Grounded in docs/Analytics.md (Section 16: Event Taxonomy & Schema Standards),
 * docs/13-API.md (ANL-01, ANL-02), and prompt Section 3 & 5.
 */

import { Request, Response, NextFunction } from 'express';
import { ApiErrorDetail } from '@bnw/types';
import { AppError } from '../../errors/app-error';
import {
  ANALYTICS_LIMITS,
  APPROVED_EVENT_NAMES,
  APPROVED_PLATFORMS,
} from './analytics.constants';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates primary telemetry event ingestion (POST /api/v1/analytics/events)
 */
export function validateEventIngress(req: Request, _res: Response, next: NextFunction): void {
  const body = req.body;
  const errors: ApiErrorDetail[] = [];

  // 1. Payload size check (prevent Denial of Service via bloated JSON)
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > ANALYTICS_LIMITS.MAX_PAYLOAD_SIZE_BYTES) {
    return next(
      AppError.badRequest(
        `Payload size exceeds maximum allowed limit of ${ANALYTICS_LIMITS.MAX_PAYLOAD_SIZE_BYTES} bytes.`
      )
    );
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return next(
      AppError.badRequest('Invalid payload format. Expected a single JSON telemetry event object.')
    );
  }

  const { event_id, event_name, event_version, timestamp, platform, session_hash, properties } = body;

  // 2. Event ID (UUIDv4)
  if (!event_id || typeof event_id !== 'string') {
    errors.push({
      field: 'body.event_id',
      code: 'ERR_REQUIRED_FIELD',
      message: 'event_id is required.',
    });
  } else if (!UUID_REGEX.test(event_id.trim())) {
    errors.push({
      field: 'body.event_id',
      code: 'ERR_INVALID_UUID',
      message: 'event_id must be a valid UUIDv4.',
    });
  }

  // 3. Event Name (Allowlisted taxonomy only)
  if (!event_name || typeof event_name !== 'string') {
    errors.push({
      field: 'body.event_name',
      code: 'ERR_REQUIRED_FIELD',
      message: 'event_name is required.',
    });
  } else if (!APPROVED_EVENT_NAMES.includes(event_name as any)) {
    errors.push({
      field: 'body.event_name',
      code: 'ERR_INVALID_EVENT_NAME',
      message: `event_name "${event_name}" is not approved. Must be one of: ${APPROVED_EVENT_NAMES.join(', ')}.`,
    });
  }

  // 4. Event Version
  if (!event_version || typeof event_version !== 'string') {
    errors.push({
      field: 'body.event_version',
      code: 'ERR_REQUIRED_FIELD',
      message: 'event_version is required (e.g. "1.0").',
    });
  }

  // 5. Timestamp (ISO 8601)
  if (!timestamp || typeof timestamp !== 'string') {
    errors.push({
      field: 'body.timestamp',
      code: 'ERR_REQUIRED_FIELD',
      message: 'timestamp is required.',
    });
  } else if (isNaN(Date.parse(timestamp))) {
    errors.push({
      field: 'body.timestamp',
      code: 'ERR_INVALID_TIMESTAMP',
      message: 'timestamp must be a valid ISO 8601 string.',
    });
  }

  // 6. Platform
  if (!platform || typeof platform !== 'string') {
    errors.push({
      field: 'body.platform',
      code: 'ERR_REQUIRED_FIELD',
      message: 'platform is required.',
    });
  } else if (!APPROVED_PLATFORMS.includes(platform as any)) {
    errors.push({
      field: 'body.platform',
      code: 'ERR_INVALID_PLATFORM',
      message: `platform must be one of: ${APPROVED_PLATFORMS.join(', ')}.`,
    });
  }

  // 7. Session Hash
  if (!session_hash || typeof session_hash !== 'string' || session_hash.trim().length < 8) {
    errors.push({
      field: 'body.session_hash',
      code: 'ERR_INVALID_SESSION',
      message: 'session_hash is required and must contain at least 8 characters.',
    });
  }

  // 8. Properties Validation
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
    errors.push({
      field: 'body.properties',
      code: 'ERR_REQUIRED_FIELD',
      message: 'properties must be a valid JSON object.',
    });
  } else {
    // Event-specific property rules
    if (event_name === 'article_viewed') {
      if (!properties.article_id || !UUID_REGEX.test(properties.article_id)) {
        errors.push({
          field: 'body.properties.article_id',
          code: 'ERR_INVALID_UUID',
          message: 'properties.article_id must be a valid UUID for article_viewed events.',
        });
      }
      if (
        properties.reading_time_seconds !== undefined &&
        (typeof properties.reading_time_seconds !== 'number' || properties.reading_time_seconds < 0)
      ) {
        errors.push({
          field: 'body.properties.reading_time_seconds',
          code: 'ERR_INVALID_NUMBER',
          message: 'reading_time_seconds must be a non-negative number.',
        });
      }
      if (
        properties.scroll_depth_percent !== undefined &&
        (typeof properties.scroll_depth_percent !== 'number' ||
          properties.scroll_depth_percent < 0 ||
          properties.scroll_depth_percent > 100)
      ) {
        errors.push({
          field: 'body.properties.scroll_depth_percent',
          code: 'ERR_INVALID_RANGE',
          message: 'scroll_depth_percent must be an integer between 0 and 100.',
        });
      }
    } else if (event_name === 'video_heartbeat') {
      if (!properties.video_id && !properties.article_id) {
        errors.push({
          field: 'body.properties.video_id',
          code: 'ERR_REQUIRED_FIELD',
          message: 'properties.video_id or properties.article_id is required for video_heartbeat events.',
        });
      }
      if (
        properties.seconds_watched === undefined ||
        typeof properties.seconds_watched !== 'number' ||
        properties.seconds_watched < 0
      ) {
        errors.push({
          field: 'body.properties.seconds_watched',
          code: 'ERR_INVALID_NUMBER',
          message: 'properties.seconds_watched must be a non-negative number.',
        });
      }
    } else if (event_name === 'article_read_30s') {
      if (!properties.article_id) {
        errors.push({
          field: 'body.properties.article_id',
          code: 'ERR_REQUIRED_FIELD',
          message: 'properties.article_id is required for article_read_30s events.',
        });
      }
    }
  }

  if (errors.length > 0) {
    return next(AppError.validationFailed('Analytics event validation failed.', errors));
  }

  next();
}

/**
 * Validates legacy pageview endpoint (POST /api/v1/analytics/pageview - ANL-01)
 */
export function validateLegacyPageview(req: Request, _res: Response, next: NextFunction): void {
  const { articleId, article_id, readingTimeSeconds, scrollDepth } = req.body || {};
  const id = articleId || article_id;
  const errors: ApiErrorDetail[] = [];

  if (!id || typeof id !== 'string' || !UUID_REGEX.test(id.trim())) {
    errors.push({
      field: 'body.articleId',
      code: 'ERR_INVALID_UUID',
      message: 'articleId must be a valid UUID.',
    });
  }

  if (readingTimeSeconds !== undefined && (typeof readingTimeSeconds !== 'number' || readingTimeSeconds < 0)) {
    errors.push({
      field: 'body.readingTimeSeconds',
      code: 'ERR_INVALID_NUMBER',
      message: 'readingTimeSeconds must be a non-negative number.',
    });
  }

  if (scrollDepth !== undefined && (typeof scrollDepth !== 'number' || scrollDepth < 0 || scrollDepth > 100)) {
    errors.push({
      field: 'body.scrollDepth',
      code: 'ERR_INVALID_RANGE',
      message: 'scrollDepth must be between 0 and 100.',
    });
  }

  if (errors.length > 0) {
    return next(AppError.validationFailed('Pageview telemetry validation failed.', errors));
  }

  next();
}

/**
 * Validates legacy video heartbeat endpoint (POST /api/v1/analytics/video-heartbeat - ANL-02)
 */
export function validateLegacyVideoHeartbeat(req: Request, _res: Response, next: NextFunction): void {
  const { videoId, articleId, secondsWatched } = req.body || {};
  const errors: ApiErrorDetail[] = [];

  if (!videoId && !articleId) {
    errors.push({
      field: 'body.videoId',
      code: 'ERR_REQUIRED_FIELD',
      message: 'videoId or articleId is required.',
    });
  }

  if (secondsWatched === undefined || typeof secondsWatched !== 'number' || secondsWatched < 0) {
    errors.push({
      field: 'body.secondsWatched',
      code: 'ERR_INVALID_NUMBER',
      message: 'secondsWatched must be a non-negative number.',
    });
  }

  if (errors.length > 0) {
    return next(AppError.validationFailed('Video heartbeat telemetry validation failed.', errors));
  }

  next();
}

