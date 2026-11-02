/**
 * BREAKING NEWS WALA — Multi-Channel Notification Service
 * Grounded in docs/05-Workflows.md (WF-NOT-01, WF-NOT-02), docs/06-Business-Rules.md
 * (RULE-NOT-001 through RULE-NOT-006), docs/13-API.md (Section 15), and docs/DECISIONS.md (DEC-031).
 */

import { AppError } from '../../errors/app-error';
import { logger } from '../../middleware/structured-logger';
import { ArticleWorkflowEngine } from '../articles/article.workflow';
import { articleRepository, IArticleRepository } from '../articles/article.repository';
import { territoryRepository, ITerritoryRepository } from '../territory/territory.repository';
import {
  FREQUENCY_CAP,
  QUIET_HOURS,
  TOPIC_PATTERNS,
} from './notification.constants';
import { getPushProvider, IPushProvider } from './notification.providers';
import { notificationQueue, NotificationQueue } from './notification.queue';
import {
  getNotificationRepository,
  INotificationRepository,
} from './notification.repository';
import {
  AdminBroadcastDto,
  ArticlePublishedNotificationEvent,
  DeviceRegistrationEntity,
  DispatchJob,
  DispatchResult,
  NotificationEntity,
  NotificationPreferencesEntity,
  PushPayload,
  RegisterDeviceDto,
  SocialPublishingNotificationEvent,
  UpdatePreferencesDto,
} from './types';
import { validatePublishedArticleEvent } from './notification.validator';

export class NotificationService {
  constructor(
    private readonly repo: INotificationRepository = getNotificationRepository(),
    private readonly provider: IPushProvider = getPushProvider(),
    private readonly queue: NotificationQueue = notificationQueue,
    private readonly articles: IArticleRepository = articleRepository,
    private readonly territory: ITerritoryRepository = territoryRepository
  ) {
    // Bind queue worker handler
    this.queue.registerHandler(this.processQueueJob.bind(this));
  }

  /**
   * Helper to determine current hour in Indian Standard Time (IST, UTC+5:30)
   */
  public getIstHour(): number {
    const now = new Date();
    // Convert to IST offset (330 minutes)
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const istDate = new Date(utc + 3600000 * 5.5);
    return istDate.getHours();
  }

  /**
   * Evaluates whether current time falls within Quiet Hours (RULE-NOT-005)
   */
  public isQuietHoursActive(): boolean {
    const hour = this.getIstHour();
    return hour >= QUIET_HOURS.START_HOUR_IST || hour < QUIET_HOURS.END_HOUR_IST;
  }

  /**
   * Handles article publication event and triggers localized breaking push alerts.
   * Grounded in Section 5 (Critical Publishing Rule), RULE-NOT-002, and RULE-NOT-004.
   */
  public async handleArticlePublished(
    event: ArticlePublishedNotificationEvent
  ): Promise<DispatchResult> {
    // 1. Validate event structure
    const validation = validatePublishedArticleEvent(event);
    if (!validation.isValid) {
      throw AppError.validationFailed(validation.error || 'Invalid article published event.');
    }

    // 2. CRITICAL PUBLISHING RULE (Section 5): Verify article exists and is truly PUBLISHED
    const article = await this.articles.findArticleById(event.articleId);
    if (!article || article.status !== 'published') {
      logger.warn(
        `[Notification] Blocked notification dispatch: Article "${event.articleId}" is not published (status: ${article?.status || 'NOT_FOUND'}).`
      );
      throw AppError.conflict(
        `A notification must never be dispatched for an unpublished article (Article status: "${article?.status || 'not_found'}").`
      );
    }

    // 3. RULE-NOT-002: System MUST NOT send automated breaking alerts for standard non-breaking articles
    if (!event.isBreaking) {
      logger.info(`[Notification] Skipped automated push: Article "${event.articleId}" is not marked as breaking.`);
      return {
        notificationId: '',
        totalTargets: 0,
        queuedPlatforms: [],
        suppressedReason: 'NON_BREAKING_ARTICLE',
        status: 'suppressed',
      };
    }

    // 4. RULE-NOT-004: Geographic Target Topic Resolution
    let targetTopic = TOPIC_PATTERNS.STATE_BREAKING;
    if (!event.isStateBreaking) {
      const district = await this.territory.findDistrictByIdOrSlug(event.districtId);
      if (!district) {
        throw AppError.validationFailed(`Invalid territory: District "${event.districtId}" not found in registry.`);
      }
      targetTopic = `${TOPIC_PATTERNS.DISTRICT_PREFIX}${district.slug}`;
    }

    // 5. RULE-NOT-003: Frequency Capping & Anti-Spam Check
    const hourlyCount = await this.repo.countRecentDispatches(targetTopic, FREQUENCY_CAP.WINDOW_HOURLY_MS);
    if (hourlyCount >= FREQUENCY_CAP.MAX_HOURLY_PER_DEVICE) {
      logger.warn(`[Notification] Dropped breaking alert: Hourly frequency cap exceeded for topic "${targetTopic}".`);
      return {
        notificationId: '',
        totalTargets: 0,
        queuedPlatforms: [],
        suppressedReason: 'HOURLY_FREQUENCY_CAP_EXCEEDED',
        status: 'suppressed',
      };
    }

    const dailyCount = await this.repo.countRecentDispatches(targetTopic, FREQUENCY_CAP.WINDOW_DAILY_MS);
    if (dailyCount >= FREQUENCY_CAP.MAX_DAILY_PER_DEVICE) {
      logger.warn(`[Notification] Dropped breaking alert: Daily frequency cap exceeded for topic "${targetTopic}".`);
      return {
        notificationId: '',
        totalTargets: 0,
        queuedPlatforms: [],
        suppressedReason: 'DAILY_FREQUENCY_CAP_EXCEEDED',
        status: 'suppressed',
      };
    }

    // 6. RULE-NOT-005: Quiet Hours Payload Adjustment
    const isQuiet = this.isQuietHoursActive();
    const payload: PushPayload = {
      title: `ब्रेकिंग न्यूज़: ${event.title}`,
      body: event.summary || event.title,
      deepLink: `/news/${event.slug}`,
      data: {
        articleId: event.articleId,
        slug: event.slug,
        districtId: event.districtId,
        isBreaking: 'true',
      },
      silent: isQuiet,
      priority: isQuiet ? 'low' : 'high',
    };

    // 7. Persist notification record
    const notification = await this.repo.createNotification({
      recipientUserId: null, // Broadcast
      title: payload.title,
      body: payload.body,
      channel: 'breaking_news',
      targetScreenUri: payload.deepLink,
    });

    // 8. Enqueue async dispatch job (Section 5 & 11)
    const jobId = `job-article-${event.eventId}`;
    await this.queue.enqueue({
      id: jobId,
      notificationId: notification.id,
      targetType: 'topic',
      target: targetTopic,
      payload,
      channel: 'breaking_news',
    });

    // Record dispatch for rate limiting
    await this.repo.recordDispatch(targetTopic);

    return {
      notificationId: notification.id,
      totalTargets: 1,
      queuedPlatforms: ['android_fcm', 'web_push'],
      status: 'queued',
    };
  }

  /**
   * Administrative manual push broadcast (NOTIF-06, RULE-NOT-001).
   */
  public async broadcastAdminNotification(
    adminId: string,
    adminRoles: string[],
    dto: AdminBroadcastDto
  ): Promise<DispatchResult> {
    // 1. Strict Server-Side RBAC Enforcement (RULE-NOT-001)
    const isAuthorized =
      ArticleWorkflowEngine.isElevatedEditor(adminRoles) ||
      adminRoles.some((r) => {
        const clean = r.toUpperCase().replace(/^ROLE_/, '');
        return clean === 'ADMIN' || clean === 'SUPER_ADMIN';
      });

    if (!isAuthorized) {
      throw AppError.forbidden(
        'Only Platform Administrators hold authority to dispatch manual push broadcasts (RULE-NOT-001).'
      );
    }

    // 2. Resolve target topic
    let targetTopic = TOPIC_PATTERNS.STATE_BREAKING;
    if (dto.targetDistrictId) {
      const district = await this.territory.findDistrictByIdOrSlug(dto.targetDistrictId);
      if (!district) {
        throw AppError.validationFailed(
          `Invalid target district identifier "${dto.targetDistrictId}".`
        );
      }
      targetTopic = `${TOPIC_PATTERNS.DISTRICT_PREFIX}${district.slug}`;
    }

    // 3. Frequency capping (unless explicitly bypassed for emergency alerts)
    if (!dto.bypassFrequencyCap) {
      const hourly = await this.repo.countRecentDispatches(targetTopic, FREQUENCY_CAP.WINDOW_HOURLY_MS);
      if (hourly >= FREQUENCY_CAP.MAX_HOURLY_PER_DEVICE) {
        throw AppError.conflict(
          `Frequency limit reached: Maximum 3 broadcasts per hour permitted for target "${targetTopic}".`
        );
      }
    }

    // 4. Quiet hours policy (unless bypassed)
    const isQuiet = !dto.bypassQuietHours && this.isQuietHoursActive();
    const payload: PushPayload = {
      title: dto.title.trim(),
      body: dto.body.trim(),
      deepLink: dto.targetScreenUri || '/',
      data: {
        broadcastBy: adminId,
        channel: dto.channel || 'system_announcement',
      },
      silent: isQuiet,
      priority: isQuiet ? 'low' : 'high',
    };

    // 5. Persist notification record
    const notification = await this.repo.createNotification({
      recipientUserId: null,
      title: payload.title,
      body: payload.body,
      channel: dto.channel || 'system_announcement',
      targetScreenUri: payload.deepLink,
    });

    // 6. Enqueue dispatch job
    const jobId = `job-admin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    await this.queue.enqueue({
      id: jobId,
      notificationId: notification.id,
      targetType: 'topic',
      target: targetTopic,
      payload,
      channel: dto.channel || 'system_announcement',
    });

    await this.repo.recordDispatch(targetTopic);

    return {
      notificationId: notification.id,
      totalTargets: 1,
      queuedPlatforms: ['android_fcm', 'web_push'],
      status: 'queued',
    };
  }

  /**
   * Retrieves paginated notifications for the authenticated user (NOTIF-01).
   */
  public async getUserNotifications(
    userId: string,
    params: { page?: number; limit?: number; unreadOnly?: boolean }
  ): Promise<{ items: NotificationEntity[]; total: number }> {
    return this.repo.findNotificationsByUserId(userId, params);
  }

  /**
   * Retrieves unread notification count for authenticated user.
   */
  public async getUnreadCount(userId: string): Promise<number> {
    return this.repo.countUnreadByUserId(userId);
  }

  /**
   * Marks a specific notification as read (NOTIF-02).
   */
  public async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const success = await this.repo.markAsRead(notificationId, userId);
    if (!success) {
      throw AppError.notFound(`Notification "${notificationId}" not found or unauthorized.`);
    }
    return true;
  }

  /**
   * Marks all notifications as read for current user (NOTIF-03).
   */
  public async markAllAsRead(userId: string): Promise<number> {
    return this.repo.markAllAsRead(userId);
  }

  /**
   * Retrieves notification preferences for authenticated user (NOTIF-04).
   */
  public async getPreferences(userId: string): Promise<NotificationPreferencesEntity> {
    return this.repo.getPreferences(userId);
  }

  /**
   * Updates notification preferences (NOTIF-05).
   */
  public async updatePreferences(
    userId: string,
    dto: UpdatePreferencesDto
  ): Promise<NotificationPreferencesEntity> {
    return this.repo.savePreferences(userId, dto);
  }

  /**
   * Registers a hardware device token for push delivery.
   */
  public async registerDevice(
    userId: string | null,
    dto: RegisterDeviceDto
  ): Promise<DeviceRegistrationEntity> {
    return this.repo.createOrUpdateDevice({
      userId,
      platform: dto.platform,
      pushToken: dto.pushToken.trim(),
    });
  }

  /**
   * Unregisters a device token (logout or permission revoke).
   */
  public async unregisterDevice(userId: string | null, token: string): Promise<boolean> {
    const device = await this.repo.findDeviceByToken(token);
    if (!device) return true; // Idempotent

    // User ownership check: cannot delete another user's device if userId present
    if (userId && device.userId && device.userId !== userId) {
      throw AppError.forbidden('You are not authorized to unregister this device.');
    }

    return this.repo.deleteDeviceByToken(token);
  }

  /**
   * Lists devices registered to authenticated user.
   */
  public async getUserDevices(userId: string): Promise<DeviceRegistrationEntity[]> {
    return this.repo.findDevicesByUserId(userId);
  }

  /**
   * Dispatches social publishing alerts to editorial desk and administrators.
   */
  public async dispatchSocialPublishingNotification(
    event: SocialPublishingNotificationEvent
  ): Promise<DispatchResult> {
    const isQuiet = this.isQuietHoursActive();
    const isCritical =
      event.eventType === 'social_account_disconnected' ||
      event.eventType === 'reauthorization_required' ||
      event.eventType === 'provider_api_failure';

    const payload: PushPayload = {
      title: event.title,
      body: event.message,
      deepLink: `/newsroom/social?jobId=${event.jobId}`,
      data: {
        channel: 'social_publishing',
        eventType: event.eventType,
        jobId: event.jobId,
      },
      silent: isQuiet && !isCritical,
      priority: isCritical ? 'high' : 'normal',
    };

    const notification = await this.repo.createNotification({
      recipientUserId: null,
      title: payload.title,
      body: payload.body,
      channel: 'social_publishing',
      targetScreenUri: payload.deepLink,
    });

    const jobId = `job-social-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    await this.queue.enqueue({
      id: jobId,
      notificationId: notification.id,
      targetType: 'topic',
      target: 'topic-editorial-desk',
      payload,
      channel: 'social_publishing',
    });

    return {
      notificationId: notification.id,
      totalTargets: 1,
      queuedPlatforms: ['in_app', 'web_push'],
      status: 'queued',
    };
  }

  /**
   * Helper hook used by IntegrationsService
   */
  public async notifyEditorialDesk(event: {
    type: string;
    title: string;
    message: string;
    jobId?: string;
  }): Promise<void> {
    await this.dispatchSocialPublishingNotification({
      eventId: `evt-soc-${Date.now()}`,
      jobId: event.jobId || 'job-none',
      eventType: event.type as any,
      title: event.title,
      message: event.message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Worker method executing asynchronous dispatch jobs from the queue.
   */
  public async processQueueJob(job: DispatchJob): Promise<void> {
    logger.info(`[Notification] Processing job "${job.id}" targeting ${job.targetType}:${job.target}`);

    let sendResult: { success: boolean; error?: string; unregisteredTokens?: string[] };

    if (job.targetType === 'topic') {
      sendResult = await this.provider.sendToTopic(job.target, job.payload);
    } else {
      sendResult = await this.provider.sendToDevice(job.target, job.payload);
    }

    // Record delivery audit log
    await this.repo.createDeliveryLog({
      notificationId: job.notificationId,
      platform: this.provider.name,
      deliveryStatus: sendResult.success ? 'sent' : 'failed',
      errorDetails: sendResult.error || null,
    });

    // Handle expired/unregistered tokens
    if (sendResult.unregisteredTokens && sendResult.unregisteredTokens.length > 0) {
      for (const expiredToken of sendResult.unregisteredTokens) {
        logger.info(`[Notification] Purging expired device token: [REDACTED]`);
        await this.repo.deleteDeviceByToken(expiredToken);
      }
    }

    // If dispatch failed, throw error to trigger queue retry with backoff
    if (!sendResult.success) {
      throw new Error(sendResult.error || 'Push provider dispatch failed.');
    }
  }
}

export const notificationService = new NotificationService();
