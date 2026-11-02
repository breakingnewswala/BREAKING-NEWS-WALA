/**
 * BREAKING NEWS WALA — Analytics & Telemetry Domain Service
 * Grounded in docs/Analytics.md, docs/DECISIONS.md (DEC-014, DEC-021, DEC-048),
 * docs/06-Business-Rules.md (RULE-ANA-001 through RULE-ANA-006),
 * and docs/13-API.md (ANL-01 to ANL-03, REP-12).
 */

import { AppError } from '../../errors/app-error';
import { logger } from '../../middleware/structured-logger';
import { ArticleWorkflowEngine } from '../articles/article.workflow';
import { getArticleRepository, IArticleRepository } from '../articles/article.repository';
import { ANALYTICS_LIMITS, APPROVED_EVENT_NAMES } from './analytics.constants';
import {
  getAnalyticsRepository,
  IAnalyticsRepository,
} from './analytics.repository';
import { privacyService, PrivacyService } from './privacy.service';
import {
  getStreamAggregator,
  IRedisStreamAggregator,
} from './stream.aggregator';
import {
  AnalyticsEventPayload,
  DailyArticleAnalyticsSummary,
  EnrichedAnalyticsEvent,
  IngestEventResult,
  OverviewAnalyticsResult,
  ReporterPerformanceResult,
  TrendingArticleItem,
  TrendingNewsFilter,
  TrendingExclusionItem,
  CreateTrendingExclusionDto,
  ContentPerformanceStats,
  DistrictAudienceInsight,
  EditorialPerformanceReport,
  ContentComparisonResult,
  AudiencePreferenceItem,
  UpdateAudiencePreferenceDto,
  AudienceSegmentItem,
  AudienceInsightsSummary,
} from './types';

export class AnalyticsService {
  private customRepo?: IAnalyticsRepository;
  private customStream?: IRedisStreamAggregator;
  private customArticleRepo?: IArticleRepository;

  constructor(
    repo?: IAnalyticsRepository,
    stream?: IRedisStreamAggregator,
    private readonly privacy: PrivacyService = privacyService,
    articleRepo?: IArticleRepository
  ) {
    this.customRepo = repo;
    this.customStream = stream;
    this.customArticleRepo = articleRepo;
  }

  private get repo(): IAnalyticsRepository {
    return this.customRepo || getAnalyticsRepository();
  }

  private get stream(): IRedisStreamAggregator {
    return this.customStream || getStreamAggregator();
  }

  private get articleRepo(): IArticleRepository {
    return this.customArticleRepo || getArticleRepository();
  }

  /**
   * Helper to format current date in Indian Standard Time (YYYY-MM-DD).
   */
  public getIstDateKey(): string {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const istDate = new Date(utc + 3600000 * 5.5);
    return istDate.toISOString().slice(0, 10);
  }

  private assertNotChiefEditor(userRoles: string[]): void {
    if (userRoles.some((r) => r.toUpperCase().includes('CHIEF_EDITOR'))) {
      throw AppError.forbidden('ROLE_CHIEF_EDITOR remains Pending Approval under DEC-048.');
    }
  }

  private isElevated(userRoles: string[]): boolean {
    this.assertNotChiefEditor(userRoles);
    return (
      ArticleWorkflowEngine.isElevatedEditor(userRoles) ||
      userRoles.some((r) => {
        const clean = r.toUpperCase().replace(/^ROLE_/, '');
        return clean === 'ADMIN' || clean === 'SUPER_ADMIN';
      })
    );
  }

  /**
   * Controlled Telemetry Event Ingestion.
   * Reconciles article_read_30s from public web alongside article_viewed.
   */
  public async ingestEvent(
    payload: AnalyticsEventPayload,
    clientIp: string,
    userAgent: string = '',
    authenticatedUser?: { id: string; roles?: string[] }
  ): Promise<IngestEventResult> {
    if (!payload || !payload.event_name || !APPROVED_EVENT_NAMES.includes(payload.event_name)) {
      throw AppError.badRequest(
        `Unapproved telemetry event_name "${payload?.event_name}". Must belong to canonical 16-event taxonomy (RULE-ANA-001).`
      );
    }

    const effectiveEventId = payload.event_id?.trim() || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // 1. Rate Limiting Check (Anti-DDoS / spam throttle)
    const withinLimit = await this.repo.checkRateLimit(
      clientIp,
      ANALYTICS_LIMITS.RATE_LIMIT_WINDOW_MS,
      ANALYTICS_LIMITS.MAX_INGESTION_RATE_PER_MINUTE
    );

    if (!withinLimit) {
      logger.warn(`[Analytics] Rate limit exceeded for IP "${clientIp}". Event "${effectiveEventId}" rejected.`);
      throw AppError.rateLimitExceeded('Analytics ingestion rate limit exceeded (120 req/min). Please back off.');
    }

    // 2. Automated Bot and Crawler Filtering (Section 19.1)
    const isBot = this.privacy.isKnownBot(userAgent);
    if (isBot) {
      logger.info(`[Analytics] Known bot/crawler detected (${userAgent.substring(0, 40)}). Event marked as bot index only.`);
      return {
        accepted: true,
        eventId: effectiveEventId,
        isBot: true,
        isDuplicate: false,
        message: 'Bot hit flagged; excluded from public reach and readership counters (Section 19.1).',
      };
    }

    // 3. Event-level Deduplication (Prevent cellular retry duplication)
    const isNewEvent = await this.repo.checkAndSetEventIdempotency(effectiveEventId);
    if (!isNewEvent) {
      logger.info(`[Analytics] Duplicate event_id "${effectiveEventId}" received. Returning idempotent confirmation.`);
      return {
        accepted: true,
        eventId: effectiveEventId,
        isBot: false,
        isDuplicate: true,
        message: 'Event already ingested (idempotent replay).',
      };
    }

    // 4. Privacy & Anonymization (DPDP Act 2023, RULE-ANA-001)
    const truncatedIp = this.privacy.truncateIp(clientIp);
    const dateKey = this.getIstDateKey();
    const effectiveSessionHash =
      payload.session_hash?.trim() || this.privacy.generateSessionHash(truncatedIp, userAgent, dateKey);
    const sanitizedProps = this.privacy.sanitizeProperties(payload.properties);

    let isDuplicateRead = false;
    let isPublishedArticle = false;

    // 5. Article Reference Validation & Lifecycle Guard (Section 7)
    if (sanitizedProps.article_id) {
      const article = await this.articleRepo.findArticleById(sanitizedProps.article_id);

      if (article) {
        isPublishedArticle = article.status === 'published';

        if (!isPublishedArticle && (payload.event_name === 'article_viewed' || payload.event_name === 'article_read_30s')) {
          logger.warn(`[Analytics] Read event attempted on non-published article "${article.id}" (status: ${article.status}). Public read counter bypassed.`);
        }
      }
    }

    // 6. 30-Minute Rolling Deduplication Window for Article Reads (RULE-ANA-002, DEC-021)
    if (payload.event_name === 'article_viewed' && sanitizedProps.article_id && isPublishedArticle) {
      const isUniqueView = await this.repo.checkAndSetReadDedup(
        sanitizedProps.article_id,
        effectiveSessionHash
      );

      if (!isUniqueView) {
        isDuplicateRead = true;
        logger.debug(`[Analytics] Duplicate read within 30-min window for article "${sanitizedProps.article_id}".`);
      }
    }

    // 7. Construct Enriched Event & Append to Redis Stream
    const enrichedEvent: EnrichedAnalyticsEvent = {
      ...payload,
      properties: sanitizedProps,
      session_hash: effectiveSessionHash,
      client_ip_truncated: truncatedIp,
      is_bot: false,
      is_duplicate: isDuplicateRead,
      authenticated_user_id: authenticatedUser?.id,
      ingested_at: new Date().toISOString(),
    };

    const streamMessageId = await this.stream.publishEvent(enrichedEvent);

    // 8. Record Aggregation Rollups
    if (sanitizedProps.article_id && isPublishedArticle) {
      if (payload.event_name === 'article_viewed') {
        const readingTime = sanitizedProps.reading_time_seconds || 0;
        await this.repo.recordArticleRead(
          sanitizedProps.article_id,
          dateKey,
          readingTime,
          !isDuplicateRead,
          sanitizedProps.category,
          sanitizedProps.district,
          payload.platform
        );

        if (!isDuplicateRead) {
          await this.repo.recordTrendingHit(sanitizedProps.article_id);
        }
      } else if (payload.event_name === 'article_read_30s') {
        // Reconciled 30s dwell telemetry: records verified reading engagement & additional trending boost
        await this.repo.recordArticleRead(
          sanitizedProps.article_id,
          dateKey,
          30,
          false,
          sanitizedProps.category,
          sanitizedProps.district,
          payload.platform
        );
        await this.repo.recordTrendingHit(sanitizedProps.article_id);
      }
    }

    return {
      accepted: true,
      eventId: effectiveEventId,
      streamMessageId,
      isDuplicate: isDuplicateRead,
      isBot: false,
      message: isDuplicateRead
        ? 'Event recorded; duplicate read within 30-minute window suppressed from unique view counts (RULE-ANA-002).'
        : 'Telemetry event successfully queued for stream aggregation.',
    };
  }

  /**
   * Retrieves high-level platform audience overview.
   * Restricted to Platform Administrators and Newsroom Editors.
   */
  public async getOverview(
    userRoles: string[],
    startDate?: string,
    endDate?: string,
    timeRange?: string
  ): Promise<OverviewAnalyticsResult> {
    if (!this.isElevated(userRoles)) {
      throw AppError.forbidden(
        'Only Newsroom Editors and Platform Administrators hold authority to view platform analytics overview (ANL-03).'
      );
    }
    return this.repo.getOverviewAnalytics(startDate, endDate, timeRange);
  }

  /**
   * Retrieves historical analytics for a specific article.
   * Author or Elevated Editor only.
   */
  public async getArticleAnalytics(
    userId: string,
    userRoles: string[],
    articleId: string
  ): Promise<{ articleId: string; daily: DailyArticleAnalyticsSummary[] }> {
    this.assertNotChiefEditor(userRoles);
    const elevated = this.isElevated(userRoles);

    if (!elevated) {
      const article = await this.articleRepo.findArticleById(articleId);
      if (!article) {
        throw AppError.notFound(`Article "${articleId}" not found.`);
      }

      if (article.authorId !== userId) {
        throw AppError.forbidden(
          'Reporters are strictly restricted to inspecting analytics for their own authored stories (RULE-ANA-003).'
        );
      }
    }

    const daily = await this.repo.getArticleDailyAnalytics(articleId);
    return { articleId, daily };
  }

  /**
   * Content Performance Intelligence.
   */
  public async getContentPerformance(userRoles: string[], timeRange?: string): Promise<ContentPerformanceStats> {
    if (!this.isElevated(userRoles)) {
      throw AppError.forbidden('Only Newsroom Editors and Platform Administrators hold authority to view Content Intelligence.');
    }
    return this.repo.getContentPerformance(timeRange);
  }

  /**
   * District-wise Audience Insights across MP's 55 districts.
   * Strictly uses aggregated view events and explicit user preference; zero IP geo-guessing.
   */
  public async getDistrictInsights(userRoles: string[], timeRange?: string): Promise<DistrictAudienceInsight[]> {
    if (!this.isElevated(userRoles)) {
      throw AppError.forbidden('Only Newsroom Editors and Platform Administrators hold authority to view District Insights.');
    }
    return this.repo.getDistrictAudienceInsights(timeRange);
  }

  /**
   * Editorial Performance Report.
   * Enforces strict reporter privacy: a reporter can only see their own scorecard;
   * no public or peer leaderboards exist.
   */
  public async getEditorialPerformance(
    userRoles: string[],
    requestingUserId: string,
    targetAuthorId?: string,
    timeRange?: string
  ): Promise<EditorialPerformanceReport> {
    this.assertNotChiefEditor(userRoles);
    const elevated = this.isElevated(userRoles);

    let effectiveAuthorId: string | undefined = undefined;
    if (elevated) {
      effectiveAuthorId = targetAuthorId;
    } else {
      // Standard reporter can only see their own
      effectiveAuthorId = requestingUserId;
    }

    return this.repo.getEditorialPerformance(timeRange, effectiveAuthorId);
  }

  /**
   * Content comparison between articles, categories, or districts.
   */
  public async compareContent(
    userRoles: string[],
    entityType: 'article' | 'category' | 'district',
    id1: string,
    id2: string
  ): Promise<ContentComparisonResult> {
    if (!this.isElevated(userRoles)) {
      throw AppError.forbidden('Only Newsroom Editors and Platform Administrators can run content comparisons.');
    }
    return this.repo.compareContent(entityType, id1, id2);
  }

  /**
   * Retrieves real-time trending published articles.
   * Publicly accessible, zero PII, time-decay scoring, filters by category/district/division/video.
   */
  public async getTrending(limit: number = 5, filter?: TrendingNewsFilter): Promise<TrendingArticleItem[]> {
    return this.repo.getTrendingArticles(limit, filter);
  }

  /**
   * Editorial control: Exclude an article from trending (manual moderation).
   */
  public async excludeStoryFromTrending(
    userRoles: string[],
    excludedByUserId: string,
    dto: CreateTrendingExclusionDto
  ): Promise<TrendingExclusionItem> {
    if (!this.isElevated(userRoles)) {
      throw AppError.forbidden('Only Newsroom Editors and Platform Administrators can exclude articles from trending.');
    }
    return this.repo.excludeStoryFromTrending(dto, excludedByUserId);
  }

  /**
   * Retrieves list of trending exclusions.
   */
  public async getTrendingExclusions(userRoles: string[]): Promise<TrendingExclusionItem[]> {
    if (!this.isElevated(userRoles)) {
      throw AppError.forbidden('Only Newsroom Editors and Platform Administrators can inspect trending exclusions.');
    }
    return this.repo.getTrendingExclusions();
  }

  /**
   * Reporter scorecard self-service.
   */
  public async getReporterPerformance(
    targetAuthorId: string,
    queryingUser: { id: string; roles: string[] }
  ): Promise<ReporterPerformanceResult> {
    this.assertNotChiefEditor(queryingUser.roles);
    const elevated = this.isElevated(queryingUser.roles);

    if (!elevated && queryingUser.id !== targetAuthorId) {
      throw AppError.forbidden(
        'Reporters are strictly prohibited from inspecting peer performance metrics or leaderboards (RULE-ANA-003).'
      );
    }

    return this.repo.getReporterPerformance(targetAuthorId);
  }

  /**
   * Audience Preferences self-service.
   */
  public async getUserPreferences(userId: string): Promise<AudiencePreferenceItem> {
    const pref = await this.repo.getAudiencePreferences(userId);
    if (!pref) {
      return {
        id: `pref_${userId}`,
        userId,
        preferredDistricts: ['bhopal'],
        preferredCategories: ['rajneeti', 'vikas-aur-shasan'],
        preferredFormats: ['text', 'video'],
        notificationEmail: true,
        notificationPush: true,
        newsletterSubscribed: false,
        updatedAt: new Date().toISOString(),
      };
    }
    return pref;
  }

  public async updateUserPreferences(
    userId: string,
    dto: UpdateAudiencePreferenceDto
  ): Promise<AudiencePreferenceItem> {
    return this.repo.updateAudiencePreferences(userId, dto);
  }

  /**
   * Audience Segments & Insights (Admin Control Room).
   */
  public async getAudienceSegments(userRoles: string[]): Promise<AudienceSegmentItem[]> {
    if (!this.isElevated(userRoles)) {
      throw AppError.forbidden('Only Newsroom Editors and Platform Administrators can inspect audience segments.');
    }
    return this.repo.getAudienceSegments();
  }

  public async getAudienceInsightsSummary(userRoles: string[]): Promise<AudienceInsightsSummary> {
    if (!this.isElevated(userRoles)) {
      throw AppError.forbidden('Only Newsroom Editors and Platform Administrators can inspect audience insights.');
    }
    return this.repo.getAudienceInsightsSummary();
  }
}

export const analyticsService = new AnalyticsService();
