/**
 * BREAKING NEWS WALA — Integrations & Social Publishing Repository
 * Grounded in docs/12-Database.md (DOM-Q), docs/20-Integrations.md, docs/19-API-Pool.md
 */

import {
  IntegrationCategory,
  IntegrationProviderItem,
  SocialAccountItem,
  SocialDeliveryItem,
  SocialPlatform,
  SocialPublishingJobItem,
  SocialPublishingStatus,
  WebhookLogItem,
} from '@bnw/types';
import { CANONICAL_SEED_PROVIDERS } from './constants';
import { IIntegrationsRepository } from './types';

export class InMemoryIntegrationsRepository implements IIntegrationsRepository {
  private providers: Map<string, IntegrationProviderItem> = new Map();
  private accounts: Map<string, SocialAccountItem> = new Map();
  private jobs: Map<string, SocialPublishingJobItem> = new Map();
  private deliveries: Map<string, SocialDeliveryItem> = new Map();
  private webhookLogs: WebhookLogItem[] = [];

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults(): void {
    // 1. Seed canonical integration providers
    for (const prov of CANONICAL_SEED_PROVIDERS) {
      this.providers.set(prov.id, { ...prov });
    }

    // 2. Seed default verified social accounts for testing & newsroom operations
    const defaultAccounts: SocialAccountItem[] = [
      {
        id: 'acc-x-bnw-official',
        providerId: 'x_api',
        platform: 'x',
        accountName: 'BREAKING NEWS WALA Official (ब्रेकिंग न्यूज़ वाला)',
        accountIdentifier: '@breakingnewswala',
        accountType: 'business',
        connectionStatus: 'connected',
        grantedScopes: ['tweet.read', 'tweet.write', 'users.read'],
        tokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        lastSyncAt: new Date().toISOString(),
        lastPublishedAt: new Date(Date.now() - 3600000).toISOString(),
        connectedByUserId: 'usr-admin-system-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'acc-fb-bnw-page',
        providerId: 'meta_graph',
        platform: 'facebook',
        accountName: 'BREAKING NEWS WALA — MP Regional News',
        accountIdentifier: '109283746501928',
        accountType: 'page',
        connectionStatus: 'connected',
        grantedScopes: ['pages_manage_posts', 'pages_read_engagement'],
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        lastSyncAt: new Date().toISOString(),
        lastPublishedAt: new Date(Date.now() - 7200000).toISOString(),
        connectedByUserId: 'usr-admin-system-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'acc-tg-bnw-channel',
        providerId: 'telegram_bot',
        platform: 'telegram',
        accountName: 'BREAKING NEWS WALA — मध्य प्रदेश समाचार',
        accountIdentifier: '@BreakingNewsWalaMP',
        accountType: 'channel',
        connectionStatus: 'connected',
        grantedScopes: ['channel_post_permission'],
        isActive: true,
        lastSyncAt: new Date().toISOString(),
        lastPublishedAt: new Date(Date.now() - 1800000).toISOString(),
        connectedByUserId: 'usr-admin-system-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'acc-ig-bnw-reel',
        providerId: 'meta_graph',
        platform: 'instagram',
        accountName: 'breakingnewswala.mp',
        accountIdentifier: '178414002938475',
        accountType: 'business',
        connectionStatus: 'connected',
        grantedScopes: ['instagram_basic', 'instagram_content_publish'],
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        lastSyncAt: new Date().toISOString(),
        lastPublishedAt: new Date(Date.now() - 86400000).toISOString(),
        connectedByUserId: 'usr-admin-system-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'acc-yt-bnw-shorts',
        providerId: 'youtube_v3',
        platform: 'youtube',
        accountName: 'BREAKING NEWS WALA (YouTube Live & Shorts)',
        accountIdentifier: 'UC_bnw_regional_mp_live',
        accountType: 'channel',
        connectionStatus: 'connected',
        grantedScopes: ['https://www.googleapis.com/auth/youtube.upload'],
        tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        lastSyncAt: new Date().toISOString(),
        connectedByUserId: 'usr-admin-system-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'acc-li-bnw-org',
        providerId: 'linkedin_v2',
        platform: 'linkedin',
        accountName: 'BREAKING NEWS WALA Digital Network',
        accountIdentifier: 'urn:li:organization:9847291',
        accountType: 'business',
        connectionStatus: 'pending_authorization',
        grantedScopes: [],
        isActive: false,
        connectedByUserId: 'usr-admin-system-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const acc of defaultAccounts) {
      this.accounts.set(acc.id, acc);
    }
  }

  // --- Provider Operations ---
  public async findProviders(category?: IntegrationCategory): Promise<IntegrationProviderItem[]> {
    const all = Array.from(this.providers.values());
    if (category) {
      return all.filter((p) => p.category === category);
    }
    return all;
  }

  public async findProviderById(idOrProviderId: string): Promise<IntegrationProviderItem | null> {
    for (const prov of this.providers.values()) {
      if (prov.id === idOrProviderId || prov.providerId === idOrProviderId) {
        return { ...prov };
      }
    }
    return null;
  }

  public async saveProvider(provider: IntegrationProviderItem): Promise<IntegrationProviderItem> {
    this.providers.set(provider.id, { ...provider, updatedAt: new Date().toISOString() });
    return { ...this.providers.get(provider.id)! };
  }

  public async updateProvider(
    idOrProviderId: string,
    updates: Partial<IntegrationProviderItem>
  ): Promise<IntegrationProviderItem | null> {
    const existing = await this.findProviderById(idOrProviderId);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.providers.set(existing.id, updated);
    return { ...updated };
  }

  // --- Social Accounts Operations ---
  public async findSocialAccounts(platform?: SocialPlatform): Promise<SocialAccountItem[]> {
    const all = Array.from(this.accounts.values());
    if (platform) {
      return all.filter((a) => a.platform === platform);
    }
    return all;
  }

  public async findSocialAccountById(id: string): Promise<SocialAccountItem | null> {
    const acc = this.accounts.get(id);
    return acc ? { ...acc } : null;
  }

  public async findSocialAccountByIdentifier(
    platform: SocialPlatform,
    identifier: string
  ): Promise<SocialAccountItem | null> {
    for (const acc of this.accounts.values()) {
      if (acc.platform === platform && acc.accountIdentifier === identifier) {
        return { ...acc };
      }
    }
    return null;
  }

  public async saveSocialAccount(account: SocialAccountItem): Promise<SocialAccountItem> {
    this.accounts.set(account.id, { ...account, updatedAt: new Date().toISOString() });
    return { ...this.accounts.get(account.id)! };
  }

  public async updateSocialAccount(
    id: string,
    updates: Partial<SocialAccountItem>
  ): Promise<SocialAccountItem | null> {
    const existing = this.accounts.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.accounts.set(id, updated);
    return { ...updated };
  }

  public async deleteSocialAccount(id: string): Promise<boolean> {
    return this.accounts.delete(id);
  }

  // --- Publishing Jobs & Deliveries Operations ---
  public async findPublishingJobs(status?: SocialPublishingStatus): Promise<SocialPublishingJobItem[]> {
    const all = Array.from(this.jobs.values());
    // Attach deliveries
    const populated = all.map((j) => ({
      ...j,
      deliveries: Array.from(this.deliveries.values()).filter((d) => d.jobId === j.id),
    }));

    if (status) {
      return populated.filter((j) => j.status === status);
    }
    return populated;
  }

  public async findPublishingJobById(id: string): Promise<SocialPublishingJobItem | null> {
    const job = this.jobs.get(id);
    if (!job) return null;
    const dels = Array.from(this.deliveries.values()).filter((d) => d.jobId === id);
    return { ...job, deliveries: dels };
  }

  public async findPublishingJobByIdempotencyKey(key: string): Promise<SocialPublishingJobItem | null> {
    for (const job of this.jobs.values()) {
      if (job.idempotencyKey === key) {
        const dels = Array.from(this.deliveries.values()).filter((d) => d.jobId === job.id);
        return { ...job, deliveries: dels };
      }
    }
    return null;
  }

  public async savePublishingJob(job: SocialPublishingJobItem): Promise<SocialPublishingJobItem> {
    const { deliveries, ...jobData } = job;
    this.jobs.set(job.id, { ...jobData, deliveries: [], updatedAt: new Date().toISOString() });
    if (deliveries) {
      for (const d of deliveries) {
        this.deliveries.set(d.id, { ...d });
      }
    }
    return (await this.findPublishingJobById(job.id))!;
  }

  public async updatePublishingJob(
    id: string,
    updates: Partial<SocialPublishingJobItem>
  ): Promise<SocialPublishingJobItem | null> {
    const existing = this.jobs.get(id);
    if (!existing) return null;

    const { deliveries, ...jobUpdates } = updates;
    const updated = {
      ...existing,
      ...jobUpdates,
      updatedAt: new Date().toISOString(),
    };
    this.jobs.set(id, updated);
    return await this.findPublishingJobById(id);
  }

  public async saveDelivery(delivery: SocialDeliveryItem): Promise<SocialDeliveryItem> {
    this.deliveries.set(delivery.id, { ...delivery, updatedAt: new Date().toISOString() });
    return { ...this.deliveries.get(delivery.id)! };
  }

  public async updateDelivery(
    id: string,
    updates: Partial<SocialDeliveryItem>
  ): Promise<SocialDeliveryItem | null> {
    const existing = this.deliveries.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.deliveries.set(id, updated);
    return { ...updated };
  }

  // --- Webhook Logs Operations ---
  public async saveWebhookLog(log: WebhookLogItem): Promise<WebhookLogItem> {
    this.webhookLogs.unshift({ ...log });
    if (this.webhookLogs.length > 500) {
      this.webhookLogs.pop(); // keep circular buffer
    }
    return { ...log };
  }

  public async findWebhookLogs(limit = 100): Promise<WebhookLogItem[]> {
    return this.webhookLogs.slice(0, limit);
  }

  public clearForTesting(): void {
    this.jobs.clear();
    this.deliveries.clear();
    this.webhookLogs = [];
    this.seedDefaults();
  }
}

/**
 * PrismaIntegrationsRepository — PostgreSQL DOM-Q persistent mapping
 */
export class PrismaIntegrationsRepository implements IIntegrationsRepository {
  constructor(private prisma: any) { }

  public async findProviders(category?: IntegrationCategory): Promise<IntegrationProviderItem[]> {
    const where = category ? { category } : {};
    const rows = await this.prisma.integrationProvider.findMany({ where, orderBy: { createdAt: 'desc' } });
    return rows.map((r: any) => this.mapProvider(r));
  }

  public async findProviderById(idOrProviderId: string): Promise<IntegrationProviderItem | null> {
    const row = await this.prisma.integrationProvider.findFirst({
      where: {
        OR: [{ id: idOrProviderId }, { providerId: idOrProviderId }],
      },
    });
    return row ? this.mapProvider(row) : null;
  }

  public async saveProvider(provider: IntegrationProviderItem): Promise<IntegrationProviderItem> {
    const row = await this.prisma.integrationProvider.upsert({
      where: { providerId: provider.providerId },
      create: {
        id: provider.id,
        providerId: provider.providerId,
        name: provider.name,
        category: provider.category,
        documentationUrl: provider.documentationUrl,
        baseUrl: provider.baseUrl,
        authMethod: provider.authMethod,
        supportedCapabilities: provider.supportedCapabilities,
        requiredScopes: provider.requiredScopes,
        configStatus: provider.configStatus,
        connectionStatus: provider.connectionStatus,
        healthStatus: provider.healthStatus,
        isEnabled: provider.isEnabled,
        rateLimitInfo: provider.rateLimitInfo,
        maskedCredential: provider.maskedCredential,
      },
      update: {
        name: provider.name,
        baseUrl: provider.baseUrl,
        configStatus: provider.configStatus,
        connectionStatus: provider.connectionStatus,
        healthStatus: provider.healthStatus,
        isEnabled: provider.isEnabled,
        rateLimitInfo: provider.rateLimitInfo,
        maskedCredential: provider.maskedCredential,
      },
    });
    return this.mapProvider(row);
  }

  public async updateProvider(
    idOrProviderId: string,
    updates: Partial<IntegrationProviderItem>
  ): Promise<IntegrationProviderItem | null> {
    const existing = await this.findProviderById(idOrProviderId);
    if (!existing) return null;

    const row = await this.prisma.integrationProvider.update({
      where: { id: existing.id },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.baseUrl && { baseUrl: updates.baseUrl }),
        ...(updates.configStatus && { configStatus: updates.configStatus }),
        ...(updates.connectionStatus && { connectionStatus: updates.connectionStatus }),
        ...(updates.healthStatus && { healthStatus: updates.healthStatus }),
        ...(typeof updates.isEnabled === 'boolean' && { isEnabled: updates.isEnabled }),
        ...(updates.rateLimitInfo && { rateLimitInfo: updates.rateLimitInfo }),
        ...(updates.maskedCredential && { maskedCredential: updates.maskedCredential }),
      },
    });
    return this.mapProvider(row);
  }

  public async findSocialAccounts(platform?: SocialPlatform): Promise<SocialAccountItem[]> {
    const where = platform ? { platform } : {};
    const rows = await this.prisma.socialAccount.findMany({ where, orderBy: { createdAt: 'desc' } });
    return rows.map((r: any) => this.mapAccount(r));
  }

  public async findSocialAccountById(id: string): Promise<SocialAccountItem | null> {
    const row = await this.prisma.socialAccount.findUnique({ where: { id } });
    return row ? this.mapAccount(row) : null;
  }

  public async findSocialAccountByIdentifier(
    platform: SocialPlatform,
    identifier: string
  ): Promise<SocialAccountItem | null> {
    const row = await this.prisma.socialAccount.findUnique({
      where: {
        platform_accountIdentifier: {
          platform,
          accountIdentifier: identifier,
        },
      },
    });
    return row ? this.mapAccount(row) : null;
  }

  public async saveSocialAccount(account: SocialAccountItem): Promise<SocialAccountItem> {
    const row = await this.prisma.socialAccount.upsert({
      where: {
        platform_accountIdentifier: {
          platform: account.platform,
          accountIdentifier: account.accountIdentifier,
        },
      },
      create: {
        id: account.id,
        providerId: account.providerId,
        platform: account.platform,
        accountName: account.accountName,
        accountIdentifier: account.accountIdentifier,
        accountType: account.accountType,
        connectionStatus: account.connectionStatus,
        grantedScopes: account.grantedScopes,
        isActive: account.isActive,
        connectedByUserId: account.connectedByUserId,
      },
      update: {
        accountName: account.accountName,
        connectionStatus: account.connectionStatus,
        grantedScopes: account.grantedScopes,
        isActive: account.isActive,
      },
    });
    return this.mapAccount(row);
  }

  public async updateSocialAccount(
    id: string,
    updates: Partial<SocialAccountItem>
  ): Promise<SocialAccountItem | null> {
    const row = await this.prisma.socialAccount.update({
      where: { id },
      data: updates,
    });
    return this.mapAccount(row);
  }

  public async deleteSocialAccount(id: string): Promise<boolean> {
    await this.prisma.socialAccount.delete({ where: { id } });
    return true;
  }

  public async findPublishingJobs(status?: SocialPublishingStatus): Promise<SocialPublishingJobItem[]> {
    const where = status ? { status } : {};
    const rows = await this.prisma.socialPublishingJob.findMany({
      where,
      include: { deliveries: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r: any) => this.mapJob(r));
  }

  public async findPublishingJobById(id: string): Promise<SocialPublishingJobItem | null> {
    const row = await this.prisma.socialPublishingJob.findUnique({
      where: { id },
      include: { deliveries: true },
    });
    return row ? this.mapJob(row) : null;
  }

  public async findPublishingJobByIdempotencyKey(key: string): Promise<SocialPublishingJobItem | null> {
    const row = await this.prisma.socialPublishingJob.findUnique({
      where: { idempotencyKey: key },
      include: { deliveries: true },
    });
    return row ? this.mapJob(row) : null;
  }

  public async savePublishingJob(job: SocialPublishingJobItem): Promise<SocialPublishingJobItem> {
    const row = await this.prisma.socialPublishingJob.create({
      data: {
        id: job.id,
        articleId: job.articleId,
        mediaAssetId: job.mediaAssetId,
        contentSource: job.contentSource,
        title: job.title,
        masterContent: job.masterContent,
        articleUrl: job.articleUrl,
        status: job.status,
        scheduledAt: job.scheduledAt ? new Date(job.scheduledAt) : null,
        idempotencyKey: job.idempotencyKey,
        createdByUserId: job.createdByUserId,
      },
      include: { deliveries: true },
    });
    return this.mapJob(row);
  }

  public async updatePublishingJob(
    id: string,
    updates: Partial<SocialPublishingJobItem>
  ): Promise<SocialPublishingJobItem | null> {
    const row = await this.prisma.socialPublishingJob.update({
      where: { id },
      data: {
        ...(updates.title && { title: updates.title }),
        ...(updates.masterContent && { masterContent: updates.masterContent }),
        ...(updates.status && { status: updates.status }),
        ...(updates.approvedByUserId && { approvedByUserId: updates.approvedByUserId }),
        ...(updates.approvedAt && { approvedAt: new Date(updates.approvedAt) }),
        ...(updates.publishedAt && { publishedAt: new Date(updates.publishedAt) }),
        ...(updates.scheduledAt && { scheduledAt: new Date(updates.scheduledAt) }),
      },
      include: { deliveries: true },
    });
    return this.mapJob(row);
  }

  public async saveDelivery(delivery: SocialDeliveryItem): Promise<SocialDeliveryItem> {
    const row = await this.prisma.socialPublishingDelivery.create({
      data: {
        id: delivery.id,
        jobId: delivery.jobId,
        socialAccountId: delivery.socialAccountId,
        platform: delivery.platform,
        platformSpecificContent: delivery.platformSpecificContent,
        status: delivery.status,
      },
    });
    return this.mapDelivery(row);
  }

  public async updateDelivery(
    id: string,
    updates: Partial<SocialDeliveryItem>
  ): Promise<SocialDeliveryItem | null> {
    const row = await this.prisma.socialPublishingDelivery.update({
      where: { id },
      data: {
        ...(updates.status && { status: updates.status }),
        ...(updates.externalPostId && { externalPostId: updates.externalPostId }),
        ...(updates.externalPostUrl && { externalPostUrl: updates.externalPostUrl }),
        ...(typeof updates.attemptCount === 'number' && { attemptCount: updates.attemptCount }),
        ...(updates.errorCode && { errorCode: updates.errorCode }),
        ...(updates.errorMessage && { errorMessage: updates.errorMessage }),
      },
    });
    return this.mapDelivery(row);
  }

  public async saveWebhookLog(log: WebhookLogItem): Promise<WebhookLogItem> {
    const row = await this.prisma.providerWebhookEvent.create({
      data: {
        id: log.id,
        providerId: log.providerId,
        eventType: log.eventType,
        deliveryId: log.deliveryId,
        nonce: log.nonce,
        status: log.status,
        errorDetails: log.errorDetails,
      },
    });
    return {
      id: row.id,
      providerId: row.providerId,
      eventType: row.eventType,
      deliveryId: row.deliveryId || undefined,
      nonce: row.nonce || undefined,
      status: row.status as any,
      receivedAt: row.receivedAt.toISOString(),
      errorDetails: row.errorDetails || undefined,
    };
  }

  public async findWebhookLogs(limit = 100): Promise<WebhookLogItem[]> {
    const rows = await this.prisma.providerWebhookEvent.findMany({
      orderBy: { receivedAt: 'desc' },
      take: limit,
    });
    return rows.map((r: any) => ({
      id: r.id,
      providerId: r.providerId,
      eventType: r.eventType,
      deliveryId: r.deliveryId || undefined,
      nonce: r.nonce || undefined,
      status: r.status,
      receivedAt: r.receivedAt.toISOString(),
      errorDetails: r.errorDetails || undefined,
    }));
  }

  private mapProvider(row: any): IntegrationProviderItem {
    return {
      id: row.id,
      providerId: row.providerId,
      name: row.name,
      category: row.category,
      documentationUrl: row.documentationUrl || undefined,
      baseUrl: row.baseUrl || undefined,
      authMethod: row.authMethod,
      supportedCapabilities: Array.isArray(row.supportedCapabilities) ? row.supportedCapabilities : [],
      requiredScopes: Array.isArray(row.requiredScopes) ? row.requiredScopes : [],
      configStatus: row.configStatus,
      connectionStatus: row.connectionStatus,
      healthStatus: row.healthStatus,
      isEnabled: row.isEnabled,
      rateLimitInfo: row.rateLimitInfo || undefined,
      lastSuccessfulRequestAt: row.lastSuccessfulRequestAt?.toISOString(),
      lastFailedRequestAt: row.lastFailedRequestAt?.toISOString(),
      lastErrorMessage: row.lastErrorMessage || undefined,
      maskedCredential: row.maskedCredential || undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapAccount(row: any): SocialAccountItem {
    return {
      id: row.id,
      providerId: row.providerId,
      platform: row.platform,
      accountName: row.accountName,
      accountIdentifier: row.accountIdentifier,
      accountType: row.accountType,
      connectionStatus: row.connectionStatus,
      grantedScopes: Array.isArray(row.grantedScopes) ? row.grantedScopes : [],
      tokenExpiresAt: row.tokenExpiresAt?.toISOString(),
      refreshTokenExpiresAt: row.refreshTokenExpiresAt?.toISOString(),
      isActive: row.isActive,
      lastSyncAt: row.lastSyncAt?.toISOString(),
      lastPublishedAt: row.lastPublishedAt?.toISOString(),
      connectedByUserId: row.connectedByUserId || undefined,
      errorDetails: row.errorDetails || undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapJob(row: any): SocialPublishingJobItem {
    return {
      id: row.id,
      articleId: row.articleId || undefined,
      mediaAssetId: row.mediaAssetId || undefined,
      contentSource: row.contentSource,
      title: row.title,
      masterContent: row.masterContent,
      articleUrl: row.articleUrl || undefined,
      status: row.status,
      scheduledAt: row.scheduledAt?.toISOString(),
      publishedAt: row.publishedAt?.toISOString(),
      idempotencyKey: row.idempotencyKey,
      approvedByUserId: row.approvedByUserId || undefined,
      approvedAt: row.approvedAt?.toISOString(),
      createdByUserId: row.createdByUserId,
      totalDeliveries: row.totalDeliveries,
      successfulDeliveries: row.successfulDeliveries,
      failedDeliveries: row.failedDeliveries,
      deliveries: (row.deliveries || []).map((d: any) => this.mapDelivery(d)),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapDelivery(row: any): SocialDeliveryItem {
    return {
      id: row.id,
      jobId: row.jobId,
      socialAccountId: row.socialAccountId,
      platform: row.platform,
      platformSpecificContent: row.platformSpecificContent,
      status: row.status,
      externalPostId: row.externalPostId || undefined,
      externalPostUrl: row.externalPostUrl || undefined,
      attemptCount: row.attemptCount,
      maxAttempts: row.maxAttempts,
      nextRetryAt: row.nextRetryAt?.toISOString(),
      lastAttemptAt: row.lastAttemptAt?.toISOString(),
      errorCode: row.errorCode || undefined,
      errorMessage: row.errorMessage || undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
