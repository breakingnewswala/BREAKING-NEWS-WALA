/**
 * BREAKING NEWS WALA — Telemetry & Analytics Domain Types
 * Grounded in docs/Analytics.md, docs/DECISIONS.md (DEC-021),
 * docs/12-Database.md (DOM-O), and docs/13-API.md (ANL-01 to ANL-03, REP-12).
 */

export type {
  AnalyticsEventName,
  ClientPlatform,
  TrafficSource,
  TimeRangeOption,
  AnalyticsEventProperties,
  AnalyticsEventPayload,
  AudienceOverviewStats,
  ContentPerformanceStats,
  DistrictAudienceInsight,
  EditorialPerformanceReport,
  ContentComparisonResult,
  AudiencePreferenceItem,
  UpdateAudiencePreferenceDto,
  AudienceSegmentItem,
  CreateAudienceSegmentDto,
  AudienceInsightsSummary,
  TrendingArticleItem,
  TrendingNewsFilter,
  TrendingExclusionItem,
  CreateTrendingExclusionDto,
} from '@bnw/types';

import {
  AnalyticsEventPayload,
  AudienceOverviewStats,
} from '@bnw/types';

export type ConsentState = 'granted' | 'opted_out';

export interface EnrichedAnalyticsEvent extends AnalyticsEventPayload {
  client_ip_truncated: string;
  is_bot: boolean;
  is_duplicate: boolean;
  authenticated_user_id?: string;
  ingested_at: string;
}

export interface RawStreamMessage {
  id: string; // e.g. "1793456789000-0"
  event: EnrichedAnalyticsEvent;
  deliveredCount: number;
  lastDeliveredAt: Date;
}

export interface StreamStats {
  streamLength: number;
  consumerGroup: string;
  pendingCount: number;
  acknowledgedCount: number;
}

export interface DailyArticleAnalyticsSummary {
  newsId: string;
  date: string; // YYYY-MM-DD
  totalPageViews: number;
  uniqueReaders: number;
  avgReadTimeSeconds: number;
}

// Backward-compatible alias for OverviewAnalyticsResult
export interface OverviewAnalyticsResult extends AudienceOverviewStats {
  topCategories?: Array<{ category: string; count: number; percentage: number }>;
  districtDistribution?: Array<{ district: string; count: number; percentage: number }>;
  platformBreakdown?: Record<string, number>;
}

export interface TrendingStoryResult {
  articleId: string;
  title: string;
  slug: string;
  category: string;
  district: string;
  viewsLast15m: number;
  trendingScore: number;
}

export interface ReporterPerformanceResult {
  authorId: string;
  totalSubmissions: number;
  approvedPublishedStories: number;
  rejectionRatio: number;
  totalReads: number;
  avgReadDurationSeconds: number;
  territoryCoverage: Array<{ district: string; count: number }>;
}

export interface IngestEventResult {
  accepted: boolean;
  eventId: string;
  streamMessageId?: string;
  isDuplicate: boolean;
  isBot: boolean;
  message?: string;
}
