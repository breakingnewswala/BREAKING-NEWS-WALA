/**
 * BREAKING NEWS WALA — RSS Module Types & Internal DTOs
 * Grounded in docs/11-Architecture.md and docs/13-API.md
 */

import type {
  RssSourceItem,
  RssSourceStatus,
  CreateRssSourceDto,
  UpdateRssSourceDto,
  ImportedRssItemDto,
  StoryClusterItem,
  FeedValidationResult,
} from '@bnw/types';

export type {
  RssSourceItem,
  RssSourceStatus,
  CreateRssSourceDto,
  UpdateRssSourceDto,
  ImportedRssItemDto,
  StoryClusterItem,
  FeedValidationResult,
};

export interface RssSourceFilterParams {
  status?: RssSourceStatus | 'all';
  isAuthorized?: boolean;
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface ImportedItemFilterParams {
  rssSourceId?: string;
  aiProcessingStatus?: string;
  hasDraft?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FetchExecutionResult {
  sourceId: string;
  sourceName: string;
  fetchedAt: string;
  durationMs: number;
  itemsDiscovered: number;
  newDraftsCreated: number;
  duplicatesSkipped: number;
  httpStatus: number;
  errors?: string[];
}

export interface RssHealthSummary {
  totalSources: number;
  activeSources: number;
  pendingSources: number;
  pausedSources: number;
  disabledSources: number;
  archivedSources: number;
  totalImportedItems: number;
  totalDraftsGenerated: number;
  lastSyncTimestamp?: string;
}

