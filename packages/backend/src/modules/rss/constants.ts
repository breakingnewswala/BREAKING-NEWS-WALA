/**
 * BREAKING NEWS WALA — RSS Module Constants & Canonical Seed Data
 * Grounded in docs/11-Architecture.md (DOM-F) and docs/20-Integrations.md
 */

import { RssSourceItem } from '@bnw/types';

export const RSS_ERROR_CODES = {
  SOURCE_NOT_FOUND: 'ERR_RSS_SOURCE_NOT_FOUND',
  SOURCE_NOT_ACTIVE: 'ERR_RSS_SOURCE_NOT_ACTIVE',
  SOURCE_NOT_AUTHORIZED: 'ERR_RSS_SOURCE_NOT_AUTHORIZED',
  SSRF_BLOCKED: 'ERR_SSRF_BLOCKED',
  XML_MALFORMED: 'ERR_XML_MALFORMED',
  XML_SIZE_EXCEEDED: 'ERR_XML_SIZE_EXCEEDED',
  ROLE_PENDING_APPROVAL: 'ERR_ROLE_PENDING_APPROVAL',
  DUPLICATE_FEED_URL: 'ERR_DUPLICATE_FEED_URL',
} as const;

export const RSS_SOURCE_STATUSES = {
  ACTIVE: 'active',
  PENDING_APPROVAL: 'pending_approval',
  PAUSED: 'paused',
  DISABLED: 'disabled',
  ARCHIVED: 'archived',
  FAILED: 'failed',
} as const;

export const DEFAULT_RSS_LIMITS = {
  MAX_FEED_BYTES: 5 * 1024 * 1024, // 5 MB
  MAX_ITEMS_PER_FETCH: 50,
  DEFAULT_POLLING_INTERVAL_MINUTES: 30,
  FETCH_TIMEOUT_MS: 15000,
} as const;

/**
 * Pre-seeded canonical news wire and governmental RSS feeds for Madhya Pradesh
 */
export const CANONICAL_SEED_RSS_SOURCES: Omit<RssSourceItem, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'rss-src-mp-prd-001',
    name: 'MP जनसंपर्क विभाग (DPR MP)',
    feedUrl: 'https://news.mpinfo.org/feed/rss2.xml',
    publisherName: 'Government of Madhya Pradesh — Directorate of Public Relations',
    publisherWebsite: 'https://mpinfo.org',
    sourceCategory: 'governance',
    geographicCoverage: 'Madhya Pradesh',
    language: 'hi',
    status: 'active',
    isAuthorized: true,
    pollingIntervalMinutes: 15,
    createdById: 'usr-admin-system',
    approvedById: 'usr-admin-super',
  },
  {
    id: 'rss-src-air-bhopal-002',
    name: 'आकाशवाणी समाचार भोपाल (AIR Bhopal)',
    feedUrl: 'https://newsonair.gov.in/regional/bhopal_hindi.xml',
    publisherName: 'All India Radio News — Regional Hindi Desk Bhopal',
    publisherWebsite: 'https://newsonair.gov.in',
    sourceCategory: 'local',
    geographicCoverage: 'Bhopal Division',
    language: 'hi',
    status: 'active',
    isAuthorized: true,
    pollingIntervalMinutes: 30,
    createdById: 'usr-admin-system',
    approvedById: 'usr-admin-super',
  },
  {
    id: 'rss-src-pti-hindi-003',
    name: 'PTI भाषा हिंदी समाचार वायर',
    feedUrl: 'https://bhasha.ptinews.com/feed/mp-chhattisgarh.xml',
    publisherName: 'Press Trust of India (PTI Bhasha)',
    publisherWebsite: 'https://bhasha.ptinews.com',
    sourceCategory: 'politics',
    geographicCoverage: 'Madhya Pradesh',
    language: 'hi',
    status: 'active',
    isAuthorized: true,
    pollingIntervalMinutes: 20,
    createdById: 'usr-admin-system',
    approvedById: 'usr-admin-super',
  },
  {
    id: 'rss-src-mock-wire-004',
    name: 'दैनिक बुंदेलखंड वायर (Bundelkhand Wire)',
    feedUrl: 'https://bundelkhand-news.org/feed/rss',
    publisherName: 'Bundelkhand Regional Press Syndicate',
    publisherWebsite: 'https://bundelkhand-news.org',
    sourceCategory: 'local',
    geographicCoverage: 'Sagar Division',
    language: 'hi',
    status: 'pending_approval',
    isAuthorized: false,
    pollingIntervalMinutes: 60,
    createdById: 'usr-reporter-stringer',
  },
];

