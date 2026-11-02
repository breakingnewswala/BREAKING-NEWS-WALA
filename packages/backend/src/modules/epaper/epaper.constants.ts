/**
 * BREAKING NEWS WALA — E-Paper Management Constants
 * Grounded in docs/02-Features.md (FEAT-FUT-004) and prompt Section 8.
 */

import { EpaperEditionStatus, EpaperEditionType } from './types';

export const EPAPER_LIMITS = {
  MAX_PDF_SIZE_BYTES: 50 * 1024 * 1024, // 50 MB
  MIN_PAGE_COUNT: 1,
  MAX_PAGE_COUNT: 64,
  DEFAULT_LANGUAGE: 'hi',
  PDF_MAGIC_BYTES: [0x25, 0x50, 0x44, 0x46, 0x2d], // "%PDF-"
} as const;

export const EPAPER_EDITION_STATUSES: readonly EpaperEditionStatus[] = [
  'DRAFT',
  'PROCESSING',
  'PENDING_REVIEW',
  'APPROVED',
  'SCHEDULED',
  'PUBLISHED',
  'REJECTED',
  'FAILED',
  'ARCHIVED',
  'RETRACTED',
] as const;

export const EPAPER_EDITION_TYPES: readonly EpaperEditionType[] = [
  'DAILY',
  'DISTRICT',
  'SPECIAL',
  'SUPPLEMENT',
  'ARCHIVE',
] as const;

export const ALLOWED_STATUS_TRANSITIONS: Record<EpaperEditionStatus, EpaperEditionStatus[]> = {
  DRAFT: ['PROCESSING', 'PENDING_REVIEW'],
  PROCESSING: ['PENDING_REVIEW', 'FAILED'],
  PENDING_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['SCHEDULED', 'PUBLISHED'],
  SCHEDULED: ['PUBLISHED', 'APPROVED'],
  PUBLISHED: ['ARCHIVED', 'RETRACTED'],
  REJECTED: ['DRAFT'],
  FAILED: ['DRAFT'],
  ARCHIVED: ['PUBLISHED'],
  RETRACTED: ['ARCHIVED'],
};
