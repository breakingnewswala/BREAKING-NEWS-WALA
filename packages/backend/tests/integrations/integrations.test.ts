/**
 * BREAKING NEWS WALA — API & Social Integrations Subsystem Test Suite
 * Task ID: BNW-MASTER-006
 * Grounded in docs/19-API-Pool.md, docs/20-Integrations.md, docs/13-API.md, docs/15-Security.md, docs/DECISIONS.md
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import {
  InMemoryIntegrationsRepository,
  IntegrationsService,
  maskSecret,
  WebhookVerifier,
  KmsCredentialVault,
  PLATFORM_CONSTRAINTS,
} from '../../src/modules/integrations';
import { SocialPlatform } from '@bnw/types';

describe('BNW-MASTER-006: API & Social Integrations Subsystem', () => {
  let repository: InMemoryIntegrationsRepository;
  let service: IntegrationsService;
  let mockArticleRepository: any;
  let mockNotificationService: any;
  let recordedNotifications: any[] = [];

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    WebhookVerifier.clearNonceCacheForTesting();
    repository = new InMemoryIntegrationsRepository();
    recordedNotifications = [];

    mockArticleRepository = {
      findById: async (id: string) => {
        if (id === 'art-published-001') {
          return { id, title: 'भोपाल में नया मेट्रो विस्तार', status: 'PUBLISHED' };
        }
        if (id === 'art-draft-002') {
          return { id, title: 'अप्रकाशित रिपोर्ट', status: 'DRAFT' };
        }
        return null;
      },
    };

    mockNotificationService = {
      notifyEditorialDesk: (event: any) => {
        recordedNotifications.push(event);
      },
    };

    service = new IntegrationsService(repository, mockArticleRepository, mockNotificationService);
  });

  // ==========================================================================
  // 1. Central API Pool & Provider Registry Tests
  // ==========================================================================
  describe('1. Central API Pool & Provider Registry', () => {
    it('retrieves pre-seeded canonical integration providers', async () => {
      const providers = await service.getProviders();
      assert.ok(providers.length >= 7, 'Must have at least 7 canonical seed providers');

      const meta = providers.find((p) => p.providerId === 'meta_graph');
      const x = providers.find((p) => p.providerId === 'x_api');
      const yt = providers.find((p) => p.providerId === 'youtube_v3');
      const telegram = providers.find((p) => p.providerId === 'telegram_bot');

      assert.ok(meta, 'Meta Graph API provider must exist');
      assert.ok(x, 'X API provider must exist');
      assert.ok(yt, 'YouTube Data API provider must exist');
      assert.ok(telegram, 'Telegram Bot API provider must exist');
    });

    it('enforces secret masking and server-side KMS encryption', async () => {
      const secret = 'sk_live_super_secret_key_12345678';
      const masked = maskSecret(secret);
      assert.strictEqual(masked, 'sk_l...5678', 'Secret must be masked to prefix and suffix');

      const vault = KmsCredentialVault.getInstance();
      const descriptor = vault.storeSecret('test_secret', secret);
      assert.ok(descriptor.vaultSecretPath.startsWith('vault://kms/'));
      assert.strictEqual(descriptor.maskedValue, 'sk_l...5678');

      // In-memory resolution works
      const resolved = vault.resolveSecret(descriptor.vaultSecretPath);
      assert.strictEqual(resolved, secret, 'Vault must decrypt secret in memory');
    });

    it('registers a new integration provider and masks credentials', async () => {
      const provider = await service.registerProvider(
        {
          providerId: 'sendgrid_email',
          name: 'SendGrid Transactional Email',
          category: 'notifications',
          authMethod: 'api_key',
          supportedCapabilities: ['email_otp', 'editorial_alerts'],
          apiKey: 'SG.1234567890abcdef',
        },
        ['admin']
      );

      assert.strictEqual(provider.providerId, 'sendgrid_email');
      assert.strictEqual(provider.configStatus, 'configured');
      assert.strictEqual(provider.maskedCredential, 'SG.1...cdef');
    });

    it('rejects duplicate provider registration', async () => {
      await assert.rejects(
        async () => {
          await service.registerProvider(
            {
              providerId: 'meta_graph',
              name: 'Duplicate Meta',
              category: 'social_media',
              authMethod: 'oauth2',
              supportedCapabilities: [],
            },
            ['admin']
          );
        },
        { name: 'AppError', message: /already registered/i }
      );
    });

    it('updates provider configuration and tests health status', async () => {
      const updated = await service.updateProvider(
        'meta_graph',
        { isEnabled: false, healthStatus: 'degraded' },
        ['admin']
      );
      assert.strictEqual(updated.isEnabled, false);
      assert.strictEqual(updated.healthStatus, 'degraded');

      const health = await service.testProviderHealth('x_api');
      assert.strictEqual(health.healthStatus, 'healthy');
      assert.ok(health.lastSuccessfulRequestAt);
    });
  });

  // ==========================================================================
  // 2. Social Media Accounts & OAuth Management Tests
  // ==========================================================================
  describe('2. Social Media Accounts & OAuth Management', () => {
    it('retrieves pre-seeded connected social accounts', async () => {
      const accounts = await service.getSocialAccounts();
      assert.ok(accounts.length >= 5, 'Must have pre-seeded social accounts');

      const xAccount = accounts.find((a) => a.platform === 'x');
      const fbAccount = accounts.find((a) => a.platform === 'facebook');
      const tgAccount = accounts.find((a) => a.platform === 'telegram');

      assert.ok(xAccount);
      assert.strictEqual(xAccount.connectionStatus, 'connected');
      assert.ok(fbAccount);
      assert.ok(tgAccount);
    });

    it('generates secure OAuth authorization URL with CSRF state nonce', () => {
      const redirectUri = 'https://newsroom.breakingnewswala.in/oauth/callback';
      const result = service.generateOAuthAuthorizationUrl('x', redirectUri, ['admin']);

      assert.ok(result.authUrl.includes('state=' + result.stateNonce));
      assert.ok(result.authUrl.includes('client_id=bnw_client_x'));
      assert.ok(result.stateNonce.length >= 32, 'State nonce must be cryptographically strong');
    });

    it('rejects invalid or expired OAuth state nonce (CSRF Protection)', async () => {
      await assert.rejects(
        async () => {
          await service.handleOAuthCallback('x', 'valid-code-123', 'fake-nonce-xyz', 'usr-admin', [
            'admin',
          ]);
        },
        { name: 'AppError', message: /Invalid, expired, or mismatched OAuth state/i }
      );
    });

    it('processes valid OAuth code exchange and connects account', async () => {
      const redirectUri = 'https://newsroom.breakingnewswala.in/oauth/callback';
      const { stateNonce } = service.generateOAuthAuthorizationUrl('facebook', redirectUri, ['admin']);

      const account = await service.handleOAuthCallback(
        'facebook',
        'auth-code-valid-998',
        stateNonce,
        'usr-admin-1',
        ['admin']
      );

      assert.strictEqual(account.platform, 'facebook');
      assert.strictEqual(account.connectionStatus, 'connected');
      assert.strictEqual(account.isActive, true);
    });

    it('allows toggling active state and disconnecting social account', async () => {
      const toggled = await service.toggleSocialAccount('acc-x-bnw-official', false, ['admin']);
      assert.strictEqual(toggled.isActive, false);

      const disconnected = await service.disconnectSocialAccount('acc-fb-bnw-page', ['admin']);
      assert.strictEqual(disconnected.connectionStatus, 'disconnected');
      assert.strictEqual(disconnected.isActive, false);

      // Notification sent
      assert.strictEqual(recordedNotifications.length, 1);
      assert.strictEqual(recordedNotifications[0].type, 'social_account_disconnected');
    });
  });

  // ==========================================================================
  // 3. Multi-Platform Publishing Engine & Mandatory Editorial Approval
  // ==========================================================================
  describe('3. Multi-Platform Publishing Engine & Mandatory Editorial Approval', () => {
    it('NON-NEGOTIABLE: strictly rejects publishing an UNPUBLISHED article', async () => {
      await assert.rejects(
        async () => {
          await service.createPublishingJob(
            {
              articleId: 'art-draft-002', // DRAFT STATUS!
              title: 'ड्राफ्ट खबर',
              masterContent: 'यह अभी ड्राफ्ट है और प्रकाशित नहीं हुआ है।',
              targetAccountIds: ['acc-x-bnw-official'],
            },
            'usr-reporter-1',
            ['reporter']
          );
        },
        { name: 'AppError', message: /Unpublished articles cannot be published to social media/i }
      );
    });

    it('creates publishing job for published article in PENDING_APPROVAL status', async () => {
      const job = await service.createPublishingJob(
        {
          articleId: 'art-published-001',
          title: 'भोपाल मेट्रो विस्तार',
          masterContent: 'भोपाल में 5 नए मेट्रो स्टेशनों का लोकार्पण किया गया।',
          articleUrl: 'https://breakingnewswala.in/news/bhopal-metro',
          targetAccountIds: ['acc-x-bnw-official', 'acc-tg-bnw-channel'],
        },
        'usr-reporter-1',
        ['reporter']
      );

      assert.strictEqual(job.status, 'PENDING_APPROVAL');
      assert.strictEqual(job.totalDeliveries, 2);
      assert.strictEqual(job.deliveries[0].status, 'PENDING');
      assert.strictEqual(job.deliveries[1].status, 'PENDING');
    });

    it('prevents duplicate job submission via idempotency key', async () => {
      const idempotencyKey = 'idem-key-duplicate-test-123';
      const job1 = await service.createPublishingJob(
        {
          articleId: 'art-published-001',
          title: 'प्रथम सबमिशन',
          masterContent: 'कंटेंट विवरण...',
          targetAccountIds: ['acc-x-bnw-official'],
          idempotencyKey,
        },
        'usr-reporter-1',
        ['reporter']
      );

      const job2 = await service.createPublishingJob(
        {
          articleId: 'art-published-001',
          title: 'द्वितीय सबमिशन',
          masterContent: 'भिन्न विवरण...',
          targetAccountIds: ['acc-x-bnw-official'],
          idempotencyKey,
        },
        'usr-reporter-1',
        ['reporter']
      );

      assert.strictEqual(job1.id, job2.id, 'Duplicate idempotency key must return the same job');
    });

    it('enforces platform constraints (X 280-character limit)', async () => {
      const longText = 'मध्य प्रदेश '.repeat(35); // > 350 characters
      await assert.rejects(
        async () => {
          await service.createPublishingJob(
            {
              articleId: 'art-published-001',
              title: 'लंबा ट्वीट',
              masterContent: longText,
              targetAccountIds: ['acc-x-bnw-official'],
            },
            'usr-editor-1',
            ['editor']
          );
        },
        { name: 'AppError', message: /violates constraints for x/i }
      );
    });

    it('enforces editorial approval workflow and approval reset upon content modification', async () => {
      const job = await service.createPublishingJob(
        {
          articleId: 'art-published-001',
          title: 'मेट्रो शुभारंभ',
          masterContent: 'मूल पाठ...',
          targetAccountIds: ['acc-x-bnw-official'],
        },
        'usr-editor-1',
        ['editor']
      );
      assert.strictEqual(job.status, 'PENDING_APPROVAL');

      // Approve post
      const approved = await service.approvePublishingJob(job.id, 'usr-desk-head', ['editor']);
      assert.strictEqual(approved.status, 'APPROVED');
      assert.strictEqual(approved.approvedByUserId, 'usr-desk-head');

      // If content is modified after approval, approval is invalidated!
      const modified = await service.updatePublishingJob(
        job.id,
        { masterContent: 'संशोधित पाठ जिससे नया अनुमोदन आवश्यक है।' },
        ['editor']
      );
      assert.strictEqual(
        modified.status,
        'PENDING_APPROVAL',
        'Approval MUST be reset when content changes'
      );
    });

    it('strictly forbids autonomous publishing (unapproved drafts cannot publish)', async () => {
      const job = await service.createPublishingJob(
        {
          articleId: 'art-published-001',
          title: 'अनाधिकृत प्रकाशन प्रयास',
          masterContent: 'यह अभी अनुमोदित नहीं है।',
          targetAccountIds: ['acc-x-bnw-official'],
        },
        'usr-reporter-1',
        ['reporter']
      );

      await assert.rejects(
        async () => {
          await service.publishImmediately(job.id, ['reporter']);
        },
        { name: 'AppError', message: /Autonomous publishing is strictly forbidden/i }
      );
    });

    it('allows scheduling an approved post and prevents scheduling an unapproved post', async () => {
      const job = await service.createPublishingJob(
        {
          articleId: 'art-published-001',
          title: 'शेड्यूल टेस्ट',
          masterContent: 'शेड्यूल हेतु पोस्ट...',
          targetAccountIds: ['acc-x-bnw-official'],
        },
        'usr-editor-1',
        ['editor']
      );

      // Cannot schedule unapproved post
      await assert.rejects(
        async () => {
          await service.schedulePublishingJob(job.id, new Date().toISOString(), ['editor']);
        },
        { name: 'AppError', message: /must be explicitly APPROVED/i }
      );

      // Approve then schedule
      await service.approvePublishingJob(job.id, 'usr-desk-head', ['editor']);
      const scheduledTime = new Date(Date.now() + 3600000).toISOString();
      const scheduled = await service.schedulePublishingJob(job.id, scheduledTime, ['editor']);
      assert.strictEqual(scheduled.status, 'SCHEDULED');
      assert.strictEqual(scheduled.scheduledAt, scheduledTime);

      // Cancel scheduled job
      const cancelled = await service.cancelPublishingJob(job.id, ['editor']);
      assert.strictEqual(cancelled.status, 'CANCELLED');
    });
  });

  // ==========================================================================
  // 4. Publishing Execution & Delivery Tracking Tests
  // ==========================================================================
  describe('4. Publishing Execution & Delivery Tracking', () => {
    it('executes multi-platform publishing and tracks per-platform delivery outcomes', async () => {
      const job = await service.createPublishingJob(
        {
          articleId: 'art-published-001',
          title: 'सफल बहु-मंच प्रकाशन',
          masterContent: 'भोपाल मेट्रो का लोकार्पण सफलतापूर्वक संपन्न हुआ। #MPNews',
          articleUrl: 'https://breakingnewswala.in/news/bhopal-metro',
          targetAccountIds: ['acc-x-bnw-official', 'acc-tg-bnw-channel'],
        },
        'usr-editor-1',
        ['editor']
      );

      await service.approvePublishingJob(job.id, 'usr-approver', ['editor']);
      const published = await service.publishImmediately(job.id, ['editor']);

      assert.strictEqual(published.status, 'PUBLISHED');
      assert.strictEqual(published.successfulDeliveries, 2);
      assert.strictEqual(published.failedDeliveries, 0);

      // Verify delivery records
      const xDelivery = published.deliveries.find((d) => d.platform === 'x');
      const tgDelivery = published.deliveries.find((d) => d.platform === 'telegram');

      assert.ok(xDelivery);
      assert.strictEqual(xDelivery.status, 'PUBLISHED');
      assert.ok(xDelivery.externalPostId);
      assert.ok(xDelivery.externalPostUrl?.includes('x.com'));

      assert.ok(tgDelivery);
      assert.strictEqual(tgDelivery.status, 'PUBLISHED');
      assert.ok(tgDelivery.externalPostUrl?.includes('t.me'));
    });

    it('records partial success truthfully when one platform succeeds and another fails', async () => {
      // Connect an inactive account
      await repository.saveSocialAccount({
        id: 'acc-broken-ig',
        providerId: 'meta_graph',
        platform: 'instagram',
        accountName: 'Broken Account',
        accountIdentifier: '1928374',
        accountType: 'business',
        connectionStatus: 'error',
        grantedScopes: [],
        isActive: false, // Inactive!
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Target active Telegram and valid post, but broken delivery
      const job = await service.createPublishingJob(
        {
          articleId: 'art-published-001',
          title: 'आंशिक प्रकाशन परीक्षण',
          masterContent: 'समाचार विवरण...',
          targetAccountIds: ['acc-tg-bnw-channel'],
        },
        'usr-editor-1',
        ['editor']
      );

      // Manually inject a failing delivery for testing partial handling
      await repository.saveDelivery({
        id: `del-failing-99`,
        jobId: job.id,
        socialAccountId: 'acc-broken-ig',
        platform: 'instagram',
        platformSpecificContent: 'समाचार विवरण...',
        status: 'PENDING',
        attemptCount: 0,
        maxAttempts: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await service.approvePublishingJob(job.id, 'usr-approver', ['editor']);
      const result = await service.publishImmediately(job.id, ['editor']);

      assert.strictEqual(result.status, 'PARTIALLY_PUBLISHED');
      assert.strictEqual(result.successfulDeliveries, 1);
      assert.strictEqual(result.failedDeliveries, 1);
    });

    it('allows retrying a failed delivery', async () => {
      const delivery = await repository.saveDelivery({
        id: 'del-retry-test-001',
        jobId: 'job-sample-1',
        socialAccountId: 'acc-x-bnw-official',
        platform: 'x',
        platformSpecificContent: 'पुनः प्रयास पोस्ट...',
        status: 'FAILED',
        attemptCount: 1,
        maxAttempts: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Mock job in repo
      await repository.savePublishingJob({
        id: 'job-sample-1',
        title: 'रिट्राई टेस्ट',
        masterContent: 'पुनः प्रयास पोस्ट...',
        status: 'FAILED',
        idempotencyKey: 'retry-test-key',
        createdByUserId: 'usr-editor-1',
        contentSource: 'article',
        totalDeliveries: 1,
        successfulDeliveries: 0,
        failedDeliveries: 1,
        deliveries: [delivery],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const retried = await service.retryDelivery('del-retry-test-001', ['editor']);
      assert.strictEqual(retried.status, 'PUBLISHED');
      assert.strictEqual(retried.attemptCount, 2);
      assert.ok(retried.externalPostId);
    });
  });

  // ==========================================================================
  // 5. Secure Webhook Verification Tests
  // ==========================================================================
  describe('5. Secure Webhook Verification', () => {
    const webhookSecret = 'test-secret-key-12345';

    function signPayload(payload: string, secret: string): string {
      return crypto.createHmac('sha256', secret).update(payload).digest('hex');
    }

    it('verifies valid HMAC-SHA256 signature and fresh timestamp', async () => {
      const payload = JSON.stringify({ event: 'post_engagement_update', post_id: '12345' });
      const signature = signPayload(payload, webhookSecret);
      const timestamp = Date.now();

      const log = await service.processWebhook({
        providerId: 'meta_graph',
        rawBody: payload,
        signatureHeader: `sha256=${signature}`,
        timestampHeader: timestamp,
        nonce: 'nonce-fresh-001',
        secret: webhookSecret,
      });

      assert.strictEqual(log.status, 'verified');
    });

    it('rejects invalid signature header with 401 Unauthorized', async () => {
      const payload = JSON.stringify({ event: 'hacked_post' });
      const badSignature = '0000000000000000000000000000000000000000000000000000000000000000';

      await assert.rejects(
        async () => {
          await service.processWebhook({
            providerId: 'meta_graph',
            rawBody: payload,
            signatureHeader: badSignature,
            timestampHeader: Date.now(),
            nonce: 'nonce-bad-sig',
            secret: webhookSecret,
          });
        },
        { name: 'AppError', statusCode: 401 }
      );
    });

    it('rejects stale timestamp exceeding 300 seconds drift window', async () => {
      const payload = JSON.stringify({ event: 'stale_event' });
      const signature = signPayload(payload, webhookSecret);
      const staleTimestamp = Date.now() - 400 * 1000; // 400 seconds ago

      await assert.rejects(
        async () => {
          await service.processWebhook({
            providerId: 'meta_graph',
            rawBody: payload,
            signatureHeader: signature,
            timestampHeader: staleTimestamp,
            nonce: 'nonce-stale-001',
            secret: webhookSecret,
          });
        },
        { name: 'AppError', statusCode: 401, message: /stale/i }
      );
    });

    it('rejects replayed nonce (Replay Attack Prevention)', async () => {
      const payload = JSON.stringify({ event: 'replay_test' });
      const signature = signPayload(payload, webhookSecret);
      const timestamp = Date.now();
      const nonce = 'replay-nonce-token-8877';

      // First request succeeds
      await service.processWebhook({
        providerId: 'meta_graph',
        rawBody: payload,
        signatureHeader: signature,
        timestampHeader: timestamp,
        nonce,
        secret: webhookSecret,
      });

      // Second identical request with same nonce must be rejected!
      await assert.rejects(
        async () => {
          await service.processWebhook({
            providerId: 'meta_graph',
            rawBody: payload,
            signatureHeader: signature,
            timestampHeader: timestamp,
            nonce,
            secret: webhookSecret,
          });
        },
        { name: 'AppError', statusCode: 401, message: /Replay attack detected/i }
      );
    });
  });

  // ==========================================================================
  // 6. Governance Invariants (DEC-048, DEC-060)
  // ==========================================================================
  describe('6. Governance Invariants (DEC-048, DEC-060)', () => {
    it('DEC-048: rejects ROLE_CHIEF_EDITOR with 403 Forbidden', async () => {
      await assert.rejects(
        async () => {
          await service.registerProvider(
            {
              providerId: 'test_provider',
              name: 'Test',
              category: 'social_media',
              authMethod: 'api_key',
              supportedCapabilities: [],
            },
            ['ROLE_CHIEF_EDITOR']
          );
        },
        { name: 'AppError', statusCode: 403, message: /ROLE_CHIEF_EDITOR permissions are Pending Approval/i }
      );

      await assert.rejects(
        async () => {
          await service.createPublishingJob(
            {
              articleId: 'art-published-001',
              title: 'परीक्षण',
              masterContent: 'विवरण...',
              targetAccountIds: ['acc-x-bnw-official'],
            },
            'usr-chief-editor',
            ['CHIEF_EDITOR']
          );
        },
        { name: 'AppError', statusCode: 403, message: /Pending Approval/i }
      );
    });

    it('DEC-060: exposes verified platform constraints matching canonical documentation', () => {
      const constraints = service.getPlatformConstraints();
      assert.strictEqual(constraints.x.maxCharacters, 280);
      assert.strictEqual(constraints.facebook.maxCharacters, 63206);
      assert.strictEqual(constraints.instagram.maxCharacters, 2200);
      assert.strictEqual(constraints.youtube.maxCharacters, 5000);
      assert.strictEqual(constraints.telegram.maxCharacters, 4096);
    });
  });
});
