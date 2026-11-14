/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Multi-Platform Social Media Publishing & Delivery Service
 * Grounded in docs/13-API.md, docs/20-Integrations.md, docs/DECISIONS.md
 */

import { PLATFORM_CONSTRAINTS, INTEGRATION_ERROR_CODES } from './constants.js';

export class SocialPublisher {
  constructor(adapter) {
    this.adapter = adapter;
  }

  getPlatformConstraints() {
    return PLATFORM_CONSTRAINTS;
  }

  validateContentForPlatform(platform, { title = '', caption = '', articleUrl = '' }) {
    const constraint = PLATFORM_CONSTRAINTS[platform];
    if (!constraint) {
      return { isValid: false, errors: [`Unsupported platform "${platform}"`] };
    }

    const fullText = caption || title;
    const errors = [];

    if (!fullText.trim()) {
      errors.push('Content or caption cannot be empty');
    }

    if (fullText.length > constraint.maxCharacters) {
      errors.push(
        `Content length (${fullText.length}) exceeds ${constraint.displayName} maximum limit of ${constraint.maxCharacters} characters`
      );
    }

    return {
      isValid: errors.length === 0,
      platform,
      characterCount: fullText.length,
      maxCharacters: constraint.maxCharacters,
      errors,
    };
  }

  async createPublishingJob(dto, user) {
    if (!dto.title || !dto.masterContent) {
      throw new Error('title and masterContent are required');
    }

    if (!dto.targetAccountIds || dto.targetAccountIds.length === 0) {
      throw new Error('At least one connected social account must be selected');
    }

    // 1. Mandatory Editorial Invariant: Unpublished articles CANNOT be distributed!
    if (dto.articleId) {
      const article = await this.adapter.getArticleById(dto.articleId);
      if (article && article.status !== 'PUBLISHED') {
        const err = new Error('Unpublished articles cannot be published to social media (RULE-SOC-001). Article must be PUBLISHED first.');
        err.statusCode = 400;
        err.code = INTEGRATION_ERROR_CODES.ERR_UNPUBLISHED_ARTICLE_CANNOT_BE_SHARED;
        throw err;
      }
    }

    // 2. Target Accounts & Constraints Verification
    const deliveries = [];
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    for (const accId of dto.targetAccountIds) {
      const acc = await this.adapter.getSocialAccountById(accId);
      if (!acc) {
        throw new Error(`Target account ID "${accId}" not found`);
      }
      if (!acc.isActive || acc.connectionStatus !== 'connected') {
        const err = new Error(`Target social account "${acc.accountName}" (${acc.platform}) is not active or connected.`);
        err.statusCode = 400;
        err.code = INTEGRATION_ERROR_CODES.ERR_ACCOUNT_NOT_ACTIVE;
        throw err;
      }

      const platformContent = dto.platformSpecificOverrides?.[acc.platform] || dto.masterContent;
      const validation = this.validateContentForPlatform(acc.platform, {
        title: dto.title,
        caption: platformContent,
        articleUrl: dto.articleUrl,
      });

      if (!validation.isValid) {
        const err = new Error(`Content violates constraints for ${acc.platform}: ${validation.errors.join('; ')}`);
        err.statusCode = 400;
        err.code = INTEGRATION_ERROR_CODES.ERR_PLATFORM_CONSTRAINT_VIOLATION;
        throw err;
      }

      deliveries.push({
        id: `del-${jobId}-${acc.platform}-${Date.now()}`,
        jobId,
        socialAccountId: acc.id,
        platform: acc.platform,
        accountName: acc.accountName,
        platformSpecificContent: platformContent,
        status: 'PENDING',
        attemptCount: 0,
        maxAttempts: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Mandatory Human Editorial Approval Gate! Status is always PENDING_APPROVAL
    const job = {
      id: jobId,
      articleId: dto.articleId || null,
      mediaAssetId: dto.mediaAssetId || null,
      contentSource: dto.contentSource || 'article',
      title: dto.title,
      masterContent: dto.masterContent,
      articleUrl: dto.articleUrl || '',
      status: 'PENDING_APPROVAL', // Mandatory Human Editorial Approval Gate!
      scheduledAt: dto.scheduledAt || null,
      idempotencyKey: dto.idempotencyKey || `idemp-${Date.now()}`,
      createdByUserId: user?.id || 'usr-desk',
      totalDeliveries: deliveries.length,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      deliveries,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.adapter.saveSocialPublishingJob(job, user);
  }

  async updatePublishingJob(id, dto, user) {
    const existing = await this.adapter.getSocialPublishingJobById(id);
    if (!existing) throw new Error(`Publishing job "${id}" not found`);

    // Invariant: If approved content is changed, approval MUST be invalidated!
    let newStatus = existing.status;
    const isContentModified =
      (dto.masterContent && dto.masterContent !== existing.masterContent) ||
      (dto.title && dto.title !== existing.title);

    if (existing.status === 'APPROVED' && isContentModified) {
      newStatus = 'PENDING_APPROVAL'; // Invalidate approval
    }

    const updated = await this.adapter.saveSocialPublishingJob(
      {
        ...existing,
        ...dto,
        id,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      },
      user
    );

    return updated;
  }

  async approvePublishingJob(id, user) {
    const job = await this.adapter.getSocialPublishingJobById(id);
    if (!job) throw new Error(`Publishing job "${id}" not found`);

    if (job.status === 'PUBLISHED') {
      throw new Error('Job is already published');
    }

    const updated = await this.adapter.saveSocialPublishingJob(
      {
        ...job,
        status: 'APPROVED',
        approvedByUserId: user?.id || 'usr-editor',
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      user
    );

    return updated;
  }

  async schedulePublishingJob(id, scheduledAt, user) {
    const job = await this.adapter.getSocialPublishingJobById(id);
    if (!job) throw new Error(`Publishing job "${id}" not found`);

    // Mandatory Invariant: Post must be approved before scheduling!
    if (job.status !== 'APPROVED') {
      const err = new Error('Post must be explicitly APPROVED by an editor before scheduling for publication.');
      err.statusCode = 400;
      err.code = INTEGRATION_ERROR_CODES.ERR_INVALID_PUBLISHING_STATE;
      throw err;
    }

    const updated = await this.adapter.saveSocialPublishingJob(
      {
        ...job,
        status: 'SCHEDULED',
        scheduledAt,
        updatedAt: new Date().toISOString(),
      },
      user
    );

    return updated;
  }

  async cancelPublishingJob(id, user) {
    const job = await this.adapter.getSocialPublishingJobById(id);
    if (!job) throw new Error(`Publishing job "${id}" not found`);

    if (job.status === 'PUBLISHED') {
      throw new Error('Cannot cancel an already published job');
    }

    const deliveries = job.deliveries.map((del) =>
      del.status === 'PENDING' ? { ...del, status: 'CANCELLED' } : del
    );

    const updated = await this.adapter.saveSocialPublishingJob(
      {
        ...job,
        status: 'CANCELLED',
        deliveries,
        updatedAt: new Date().toISOString(),
      },
      user
    );

    return updated;
  }

  async publishImmediately(id, user) {
    const job = await this.adapter.getSocialPublishingJobById(id);
    if (!job) throw new Error(`Publishing job "${id}" not found`);

    // Invariant: Autonomous publishing is strictly forbidden. Must be APPROVED or SCHEDULED!
    if (job.status !== 'APPROVED' && job.status !== 'SCHEDULED') {
      const err = new Error('Autonomous publishing is strictly forbidden. Post must be in APPROVED status.');
      err.statusCode = 400;
      err.code = INTEGRATION_ERROR_CODES.ERR_AUTONOMOUS_PUBLISH_FORBIDDEN;
      throw err;
    }

    let successCount = 0;
    let failedCount = 0;
    const updatedDeliveries = [];

    for (const delivery of job.deliveries) {
      const account = await this.adapter.getSocialAccountById(delivery.socialAccountId);
      if (!account || !account.isActive) {
        updatedDeliveries.push({
          ...delivery,
          status: 'FAILED',
          errorCode: 'ERR_ACCOUNT_DISABLED',
          errorMessage: 'Social account is disabled or disconnected',
          attemptCount: delivery.attemptCount + 1,
          lastAttemptAt: new Date().toISOString(),
        });
        failedCount++;
        continue;
      }

      // Execute simulated/authorized social post delivery
      const externalPostId = `post-${delivery.platform}-${Date.now()}`;
      const externalPostUrl =
        delivery.platform === 'x'
          ? `https://x.com/BreakingNewsWala/status/${externalPostId}`
          : delivery.platform === 'facebook'
            ? `https://facebook.com/breakingnewswalaindia/posts/${externalPostId}`
            : delivery.platform === 'youtube'
              ? `https://youtube.com/watch?v=mock_${externalPostId}`
              : `https://${delivery.platform}.com/bnw/p/${externalPostId}`;

      updatedDeliveries.push({
        ...delivery,
        status: 'PUBLISHED',
        externalPostId,
        externalPostUrl,
        attemptCount: delivery.attemptCount + 1,
        lastAttemptAt: new Date().toISOString(),
      });
      successCount++;
    }

    const finalStatus =
      failedCount === 0 && successCount > 0
        ? 'PUBLISHED'
        : successCount > 0 && failedCount > 0
          ? 'PARTIALLY_PUBLISHED'
          : 'FAILED';

    const updated = await this.adapter.saveSocialPublishingJob(
      {
        ...job,
        status: finalStatus,
        publishedAt: new Date().toISOString(),
        successfulDeliveries: successCount,
        failedDeliveries: failedCount,
        deliveries: updatedDeliveries,
        updatedAt: new Date().toISOString(),
      },
      user
    );

    return updated;
  }
}

