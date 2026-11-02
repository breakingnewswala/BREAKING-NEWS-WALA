/**
 * BREAKING NEWS WALA — Integrations Internal Types & Repository Contracts
 * Grounded in docs/19-API-Pool.md, docs/20-Integrations.md, docs/DECISIONS.md
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

export interface KmsSecretDescriptor {
  keyAlias: string;
  vaultSecretPath: string;
  encryptedBytes: string;
  maskedValue: string;
  createdAt: string;
  updatedAt: string;
}

export interface PreparedSocialContent {
  title: string;
  caption: string;
  articleUrl?: string;
  mediaAssetUrl?: string;
  mediaType?: 'image' | 'video' | 'link';
  aspectRatio?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PublishResult {
  success: boolean;
  externalPostId?: string;
  externalPostUrl?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface AccountHealthResult {
  isHealthy: boolean;
  status: 'connected' | 'pending_authorization' | 'authorization_expired' | 'disconnected' | 'error';
  grantedScopes: string[];
  expiresInSeconds?: number;
  errorMessage?: string;
}

export interface IIntegrationsRepository {
  // Provider Registry
  findProviders(category?: IntegrationCategory): Promise<IntegrationProviderItem[]>;
  findProviderById(idOrProviderId: string): Promise<IntegrationProviderItem | null>;
  saveProvider(provider: IntegrationProviderItem): Promise<IntegrationProviderItem>;
  updateProvider(idOrProviderId: string, updates: Partial<IntegrationProviderItem>): Promise<IntegrationProviderItem | null>;

  // Social Accounts
  findSocialAccounts(platform?: SocialPlatform): Promise<SocialAccountItem[]>;
  findSocialAccountById(id: string): Promise<SocialAccountItem | null>;
  findSocialAccountByIdentifier(platform: SocialPlatform, identifier: string): Promise<SocialAccountItem | null>;
  saveSocialAccount(account: SocialAccountItem): Promise<SocialAccountItem>;
  updateSocialAccount(id: string, updates: Partial<SocialAccountItem>): Promise<SocialAccountItem | null>;
  deleteSocialAccount(id: string): Promise<boolean>;

  // Publishing Jobs & Deliveries
  findPublishingJobs(status?: SocialPublishingStatus): Promise<SocialPublishingJobItem[]>;
  findPublishingJobById(id: string): Promise<SocialPublishingJobItem | null>;
  findPublishingJobByIdempotencyKey(key: string): Promise<SocialPublishingJobItem | null>;
  savePublishingJob(job: SocialPublishingJobItem): Promise<SocialPublishingJobItem>;
  updatePublishingJob(id: string, updates: Partial<SocialPublishingJobItem>): Promise<SocialPublishingJobItem | null>;
  saveDelivery(delivery: SocialDeliveryItem): Promise<SocialDeliveryItem>;
  updateDelivery(id: string, updates: Partial<SocialDeliveryItem>): Promise<SocialDeliveryItem | null>;

  // Webhook Logs
  saveWebhookLog(log: WebhookLogItem): Promise<WebhookLogItem>;
  findWebhookLogs(limit?: number): Promise<WebhookLogItem[]>;
}

