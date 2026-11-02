/**
 * BREAKING NEWS WALA — Multi-Channel Notification Dispatcher Test Suite
 * Grounded in docs/05-Workflows.md (WF-NOT-01, WF-NOT-02), docs/06-Business-Rules.md
 * (RULE-NOT-001 through RULE-NOT-006), docs/13-API.md (Section 15, NOTIF-01 through NOTIF-06),
 * and docs/DECISIONS.md (DEC-031).
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../src/app';
import { createTestClient, TestClient } from './test-helper';
import { tokenService } from '../src/modules/auth/token.service';
import { articleRepository, InMemoryArticleRepository } from '../src/modules/articles/article.repository';
import { territoryRepository, InMemoryTerritoryRepository } from '../src/modules/territory/territory.repository';
import {
  notificationRepository,
  InMemoryNotificationRepository,
} from '../src/modules/notifications/notification.repository';
import {
  getPushProvider,
  LocalPushProvider,
} from '../src/modules/notifications/notification.providers';
import {
  notificationQueue,
  NotificationQueue,
} from '../src/modules/notifications/notification.queue';
import { notificationService } from '../src/modules/notifications/notification.service';
import {
  FREQUENCY_CAP,
  QUIET_HOURS,
  TOPIC_PATTERNS,
} from '../src/modules/notifications/notification.constants';

describe('Notification Dispatcher — Policy & Security Invariants', () => {
  it('should verify frequency capping constants (RULE-NOT-003)', () => {
    assert.strictEqual(FREQUENCY_CAP.MAX_HOURLY_PER_DEVICE, 3);
    assert.strictEqual(FREQUENCY_CAP.MAX_DAILY_PER_DEVICE, 10);
    assert.strictEqual(FREQUENCY_CAP.WINDOW_HOURLY_MS, 3600000);
    assert.strictEqual(FREQUENCY_CAP.WINDOW_DAILY_MS, 86400000);
  });

  it('should verify quiet hours policy boundaries (RULE-NOT-005)', () => {
    assert.strictEqual(QUIET_HOURS.START_HOUR_IST, 22); // 10:00 PM IST
    assert.strictEqual(QUIET_HOURS.END_HOUR_IST, 6);     // 06:00 AM IST
    assert.strictEqual(QUIET_HOURS.TIMEZONE, 'Asia/Kolkata');
  });

  it('should verify topic pattern conventions (DEC-031, RULE-NOT-004)', () => {
    assert.strictEqual(TOPIC_PATTERNS.STATE_BREAKING, 'topic_breaking_mp');
    assert.strictEqual(TOPIC_PATTERNS.DISTRICT_PREFIX, 'topic_district_');
    assert.strictEqual(TOPIC_PATTERNS.CATEGORY_PREFIX, 'topic_cat_');
  });
});

describe('Multi-Channel Notification Dispatcher (Integration)', () => {
  let client: TestClient;
  const mockProvider = getPushProvider() as LocalPushProvider;

  // Reusable auth tokens
  const reporter1 = {
    id: 'usr-reporter-101',
    token: tokenService.generateAccessToken({
      userId: 'usr-reporter-101',
      roles: ['ROLE_REPORTER_STANDARD'],
      status: 'active',
    }).token,
  };

  const citizenUser1 = {
    id: 'usr-citizen-201',
    token: tokenService.generateAccessToken({
      userId: 'usr-citizen-201',
      roles: ['ROLE_PUBLIC_USER'],
      status: 'active',
    }).token,
  };

  const citizenUser2 = {
    id: 'usr-citizen-202',
    token: tokenService.generateAccessToken({
      userId: 'usr-citizen-202',
      roles: ['ROLE_PUBLIC_USER'],
      status: 'active',
    }).token,
  };

  const adminUser = {
    id: 'usr-admin-301',
    token: tokenService.generateAccessToken({
      userId: 'usr-admin-301',
      roles: ['ROLE_ADMIN'],
      status: 'active',
    }).token,
  };

  before(async () => {
    const app = createApp();
    client = await createTestClient(app);
  });

  after(async () => {
    notificationQueue.shutdown();
    await client.close();
  });

  beforeEach(() => {
    if (notificationRepository instanceof InMemoryNotificationRepository) {
      notificationRepository.clear();
    }
    if (articleRepository instanceof InMemoryArticleRepository) {
      articleRepository.clear();
    }
    mockProvider.clear();
    notificationQueue.clear();
  });

  describe('1. Device Registration & Push Token Management (Area E, DEC-031)', () => {
    it('should register a hardware device push token for an authenticated citizen', async () => {
      const res = await client.post(
        '/api/v1/notifications/register-device',
        {
          platform: 'android',
          pushToken: 'fcm-device-token-xyz-1234567890-android-client',
        },
        { Authorization: `Bearer ${citizenUser1.token}` }
      );

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.registered, true);
      assert.strictEqual(body.data.platform, 'android');
      assert.ok(body.data.deviceId);
    });

    it('should support anonymous reader device token registration', async () => {
      const res = await client.post('/api/v1/notifications/register-device', {
        platform: 'web',
        pushToken: 'webpush-subscription-token-anonymous-reader-987654',
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.platform, 'web');
    });

    it('should update lastActiveAt when registering an existing token (upsert)', async () => {
      const tokenStr = 'fcm-token-reuse-test-1122334455';
      await client.post('/api/v1/notifications/register-device', {
        platform: 'android',
        pushToken: tokenStr,
      });

      const res = await client.post('/api/v1/notifications/register-device', {
        platform: 'android',
        pushToken: tokenStr,
      });

      assert.strictEqual(res.status, 201);
      const totalDevices = await notificationRepository.countRegisteredDevices();
      assert.strictEqual(totalDevices, 1); // No duplicate records
    });

    it('should list all devices registered to an authenticated user', async () => {
      await client.post(
        '/api/v1/notifications/register-device',
        { platform: 'android', pushToken: 'token-phone-1' },
        { Authorization: `Bearer ${citizenUser1.token}` }
      );
      await client.post(
        '/api/v1/notifications/register-device',
        { platform: 'web', pushToken: 'token-browser-1' },
        { Authorization: `Bearer ${citizenUser1.token}` }
      );

      const res = await client.get('/api/v1/notifications/devices', {
        Authorization: `Bearer ${citizenUser1.token}`,
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.devices.length, 2);
    });

    it('should allow user to unregister own device token', async () => {
      const token = 'token-to-delete-12345';
      await client.post(
        '/api/v1/notifications/register-device',
        { platform: 'android', pushToken: token },
        { Authorization: `Bearer ${citizenUser1.token}` }
      );

      const res = await client.delete(`/api/v1/notifications/devices/${token}`, {
        Authorization: `Bearer ${citizenUser1.token}`,
      });

      assert.strictEqual(res.status, 200);
      const exists = await notificationRepository.findDeviceByToken(token);
      assert.strictEqual(exists, null);
    });

    it('should reject non-owner attempting to unregister another user device with 403 Forbidden', async () => {
      const token = 'user1-private-device-token-abc';
      await client.post(
        '/api/v1/notifications/register-device',
        { platform: 'android', pushToken: token },
        { Authorization: `Bearer ${citizenUser1.token}` }
      );

      // Citizen User 2 attempts to delete User 1's device
      const res = await client.delete(`/api/v1/notifications/devices/${token}`, {
        Authorization: `Bearer ${citizenUser2.token}`,
      });

      assert.strictEqual(res.status, 403);
    });

    it('should reject invalid platform with 422 Unprocessable Entity', async () => {
      const res = await client.post('/api/v1/notifications/register-device', {
        platform: 'windows_phone',
        pushToken: 'sample-token-12345678',
      });
      assert.strictEqual(res.status, 422);
    });
  });

  describe('2. User Notification Preferences (NOTIF-04, NOTIF-05)', () => {
    it('should retrieve default preferences for user via GET /api/v1/notifications/preferences', async () => {
      const res = await client.get('/api/v1/notifications/preferences', {
        Authorization: `Bearer ${citizenUser1.token}`,
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.preferences.breakingNews, true);
      assert.strictEqual(body.data.preferences.districtNews, true);
      assert.strictEqual(body.data.preferences.quietHoursEnabled, true);
      assert.strictEqual(body.data.preferences.quietHoursStart, '22:00');
      assert.strictEqual(body.data.preferences.quietHoursEnd, '06:00');
    });

    it('should update notification preferences via PUT /api/v1/notifications/preferences', async () => {
      const res = await client.put(
        '/api/v1/notifications/preferences',
        {
          breakingNews: true,
          districtNews: false,
          preferredDistrictId: 'dis-bhopal',
          quietHoursStart: '23:00',
          quietHoursEnd: '07:00',
        },
        { Authorization: `Bearer ${citizenUser1.token}` }
      );

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.preferences.districtNews, false);
      assert.strictEqual(body.data.preferences.preferredDistrictId, 'dis-bhopal');
      assert.strictEqual(body.data.preferences.quietHoursStart, '23:00');
    });

    it('should reject invalid quiet hours time format with 422', async () => {
      const res = await client.put(
        '/api/v1/notifications/preferences',
        { quietHoursStart: '25:99' },
        { Authorization: `Bearer ${citizenUser1.token}` }
      );
      assert.strictEqual(res.status, 422);
      const body = await res.json();
      assert.ok(body.error.details.some((d: any) => d.code === 'ERR_INVALID_TIME_FORMAT'));
    });
  });

  describe('3. In-App Notification Inbox (NOTIF-01 through NOTIF-03)', () => {
    let notif1Id: string;
    let notif2Id: string;

    beforeEach(async () => {
      const n1 = await notificationRepository.createNotification({
        recipientUserId: citizenUser1.id,
        title: 'भोपाल में मेट्रो का नया ट्रायल सफल',
        body: 'सुभाष नगर से एम्स तक दौड़ी ट्रेन।',
        channel: 'district_news',
        targetScreenUri: '/news/bhopal-metro-trial',
      });
      notif1Id = n1.id;

      const n2 = await notificationRepository.createNotification({
        recipientUserId: citizenUser1.id,
        title: 'संपादकीय सूचना: आपकी रिपोर्ट स्वीकृत',
        body: 'आपकी भेजी गई रिपोर्ट को मुख्य डेस्क द्वारा प्रकाशित किया गया है।',
        channel: 'editorial_feedback',
      });
      notif2Id = n2.id;
    });

    it('should list paginated user notifications via GET /api/v1/notifications (NOTIF-01)', async () => {
      const res = await client.get('/api/v1/notifications?page=1&limit=10', {
        Authorization: `Bearer ${citizenUser1.token}`,
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.notifications.length, 2);
      assert.strictEqual(body.meta.pagination.total, 2);
    });

    it('should retrieve unread notification count via GET /api/v1/notifications/unread-count', async () => {
      const res = await client.get('/api/v1/notifications/unread-count', {
        Authorization: `Bearer ${citizenUser1.token}`,
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.data.unreadCount, 2);
    });

    it('should mark single notification as read via PATCH /api/v1/notifications/:id/read (NOTIF-02)', async () => {
      const res = await client.patch(`/api/v1/notifications/${notif1Id}/read`, {}, {
        Authorization: `Bearer ${citizenUser1.token}`,
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.data.isRead, true);

      // Verify unread count decremented to 1
      const count = await notificationRepository.countUnreadByUserId(citizenUser1.id);
      assert.strictEqual(count, 1);
    });

    it('should mark all notifications as read via POST /api/v1/notifications/mark-all-read (NOTIF-03)', async () => {
      const res = await client.post('/api/v1/notifications/mark-all-read', {}, {
        Authorization: `Bearer ${citizenUser1.token}`,
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.data.markedCount, 2);

      const count = await notificationRepository.countUnreadByUserId(citizenUser1.id);
      assert.strictEqual(count, 0);
    });
  });

  describe('4. Administrative Push Broadcast (NOTIF-06, RULE-NOT-001)', () => {
    it('should allow Platform Administrator to dispatch push broadcast', async () => {
      const res = await client.post(
        '/api/v1/admin/notifications/broadcast',
        {
          title: 'मुख्यमंत्री का राज्यव्यापी संबोधन',
          body: 'मध्य प्रदेश के विकास पर आज शाम 7 बजे महत्वपूर्ण घोषणा।',
          channel: 'breaking_news',
          targetScreenUri: '/live/cm-address',
        },
        { Authorization: `Bearer ${adminUser.token}` }
      );

      assert.strictEqual(res.status, 202);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.status, 'queued');

      // Wait for queue drain
      await notificationQueue.drain();
      assert.strictEqual(mockProvider.sentTopicMessages.length, 1);
      assert.strictEqual(mockProvider.sentTopicMessages[0]?.topic, 'topic_breaking_mp');
    });

    it('should reject non-admin reporter attempting broadcast with 403 Forbidden (RULE-NOT-001)', async () => {
      const res = await client.post(
        '/api/v1/admin/notifications/broadcast',
        {
          title: 'अवैध प्रसारण का प्रयास',
          body: 'यह संदेश रिपोर्टर द्वारा नहीं भेजा जा सकता।',
        },
        { Authorization: `Bearer ${reporter1.token}` }
      );

      assert.strictEqual(res.status, 403);
    });

    it('should reject unauthenticated broadcast with 401 Unauthorized', async () => {
      const res = await client.post('/api/v1/admin/notifications/broadcast', {
        title: 'अनाधिकृत प्रयास',
        body: 'बिना लॉगिन प्रसारण।',
      });
      assert.strictEqual(res.status, 401);
    });
  });

  describe('5. Article Publication Hook & Critical Publishing Rule (Section 5, RULE-NOT-002, RULE-NOT-004)', () => {
    it('should reject notification trigger for unpublished article draft with 409 Conflict', async () => {
      // 1. Create a draft article (not published)
      const draft = await articleRepository.createArticle({
        title: 'इंदौर में नए उद्योग का शिलान्यास',
        slug: 'indore-new-industry-foundation',
        bodyContent: '<p>विवरण...</p>',
        primaryCategoryId: 'cat-business',
        primaryLocationId: 'dist-indore',
        authorId: reporter1.id,
        status: 'draft', // DRAFT STATUS
        isBreaking: true,
      });

      // 2. Trigger notification hook for unpublished draft
      await assert.rejects(
        async () => {
          await notificationService.handleArticlePublished({
            eventId: 'evt-draft-test-1',
            articleId: draft.id,
            title: draft.title,
            slug: draft.slug,
            districtId: 'dist-indore',
            isBreaking: true,
            publishedAt: new Date().toISOString(),
          });
        },
        (err: any) => {
          assert.strictEqual(err.statusCode, 409);
          assert.ok(err.message.includes('A notification must never be dispatched for an unpublished article'));
          return true;
        }
      );
    });

    it('should dispatch localized breaking alert to district topic when article is published (RULE-NOT-002, RULE-NOT-004)', async () => {
      // 1. Create published breaking article
      const article = await articleRepository.createArticle({
        title: 'उज्जैन महाकाल मंदिर में विशेष भस्म आरती',
        slug: 'ujjain-mahakal-special-bhasma-aarti',
        bodyContent: '<p>विवरण...</p>',
        primaryCategoryId: 'cat-culture',
        primaryLocationId: 'dist-ujjain',
        authorId: reporter1.id,
        status: 'published',
        isBreaking: true,
      });

      // 2. Trigger notification
      const result = await notificationService.handleArticlePublished({
        eventId: 'evt-ujjain-published-101',
        articleId: article.id,
        title: article.title,
        slug: article.slug,
        districtId: 'dist-ujjain',
        isBreaking: true,
        publishedAt: new Date().toISOString(),
      });

      assert.strictEqual(result.status, 'queued');
      await notificationQueue.drain();

      // Verify district topic was targeted (RULE-NOT-004)
      assert.strictEqual(mockProvider.sentTopicMessages.length, 1);
      assert.strictEqual(mockProvider.sentTopicMessages[0]?.topic, 'topic_district_ujjain');
    });

    it('should suppress automated alert for non-breaking published article (RULE-NOT-002)', async () => {
      const article = await articleRepository.createArticle({
        title: 'नर्मदापुरम में मौसम सुहावना रहा',
        slug: 'narmadapuram-weather-pleasant',
        bodyContent: '<p>विवरण...</p>',
        primaryCategoryId: 'cat-weather',
        primaryLocationId: 'dist-narmadapuram',
        authorId: reporter1.id,
        status: 'published',
        isBreaking: false, // NOT BREAKING
      });

      const result = await notificationService.handleArticlePublished({
        eventId: 'evt-weather-normal',
        articleId: article.id,
        title: article.title,
        slug: article.slug,
        districtId: 'dist-narmadapuram',
        isBreaking: false,
        publishedAt: new Date().toISOString(),
      });

      assert.strictEqual(result.status, 'suppressed');
      assert.strictEqual(result.suppressedReason, 'NON_BREAKING_ARTICLE');
      assert.strictEqual(mockProvider.sentTopicMessages.length, 0);
    });

    it('should enforce frequency cap of 3 push notifications per hour (RULE-NOT-003)', async () => {
      const districtId = 'dist-gwalior';
      const makeArticle = async (idx: number) =>
        articleRepository.createArticle({
          title: `ग्वालियर में बड़ी खबर क्रमांक ${idx}`,
          slug: `gwalior-breaking-story-${idx}`,
          bodyContent: '<p>...</p>',
          primaryCategoryId: 'cat-politics',
          primaryLocationId: districtId,
          authorId: reporter1.id,
          status: 'published',
          isBreaking: true,
        });

      // Dispatches 1, 2, and 3
      for (let i = 1; i <= 3; i++) {
        const art = await makeArticle(i);
        const res = await notificationService.handleArticlePublished({
          eventId: `evt-freq-${i}`,
          articleId: art.id,
          title: art.title,
          slug: art.slug,
          districtId,
          isBreaking: true,
          publishedAt: new Date().toISOString(),
        });
        assert.strictEqual(res.status, 'queued');
      }

      // 4th dispatch within same hour is suppressed (RULE-NOT-003)
      const art4 = await makeArticle(4);
      const res4 = await notificationService.handleArticlePublished({
        eventId: 'evt-freq-4',
        articleId: art4.id,
        title: art4.title,
        slug: art4.slug,
        districtId,
        isBreaking: true,
        publishedAt: new Date().toISOString(),
      });

      assert.strictEqual(res4.status, 'suppressed');
      assert.strictEqual(res4.suppressedReason, 'HOURLY_FREQUENCY_CAP_EXCEEDED');
    });
  });

  describe('6. Resilient Queue, Retries & Token Expiration Handling (Section 11, Area E)', () => {
    it('should retry temporarily failing provider dispatch with exponential backoff', async () => {
      mockProvider.setSimulateTemporaryFailure(true);

      const queue = new NotificationQueue(3, 20); // 3 attempts, 20ms base
      let attemptsCount = 0;

      queue.registerHandler(async (_job) => {
        attemptsCount++;
        if (attemptsCount < 3) {
          throw new Error('Temporary 503 gateway timeout');
        }
        // Succeeds on 3rd attempt
      });

      await queue.enqueue({
        id: 'job-retry-test-1',
        notificationId: 'notif-retry-1',
        targetType: 'topic',
        target: 'topic_breaking_mp',
        payload: { title: 'परीक्षण', body: 'पुनः प्रयास' },
        channel: 'breaking_news',
      });

      await queue.drain();
      assert.strictEqual(attemptsCount, 3);
      assert.strictEqual(queue.isJobCompleted('job-retry-test-1'), true);
      assert.strictEqual(queue.isJobFailed('job-retry-test-1'), false);
    });

    it('should mark job as permanently failed after exhausting maximum attempts', async () => {
      const queue = new NotificationQueue(2, 20); // 2 max attempts

      queue.registerHandler(async (_job) => {
        throw new Error('Persistent failure');
      });

      await queue.enqueue({
        id: 'job-exhaust-test-1',
        notificationId: 'notif-exhaust-1',
        targetType: 'topic',
        target: 'topic_breaking_mp',
        payload: { title: 'असफल', body: 'संदेश' },
        channel: 'breaking_news',
      });

      await queue.drain();
      assert.strictEqual(queue.isJobFailed('job-exhaust-test-1'), true);
      assert.strictEqual(queue.getFailedJobs().length, 1);
    });

    it('should automatically purge expired device token when provider reports UNREGISTERED_DEVICE', async () => {
      const expiredToken = 'expired-fcm-token-purged-device';

      // 1. Register device
      await notificationRepository.createOrUpdateDevice({
        userId: citizenUser1.id,
        platform: 'android',
        pushToken: expiredToken,
      });
      assert.ok(await notificationRepository.findDeviceByToken(expiredToken));

      // 2. Mark token as expired in mock provider
      mockProvider.markTokenAsExpired(expiredToken);

      // 3. Process direct unicast job targeting expired token
      await notificationService.processQueueJob({
        id: 'job-unicast-expired',
        notificationId: 'notif-unicast-1',
        targetType: 'token',
        target: expiredToken,
        payload: { title: 'व्यक्तिगत सूचना', body: 'विवरण...' },
        channel: 'editorial_feedback',
        attempts: 0,
        maxAttempts: 1,
        status: 'pending',
        createdAt: new Date(),
      }).catch(() => {}); // Will throw due to failure

      // 4. Token must be purged from database/repository
      const exists = await notificationRepository.findDeviceByToken(expiredToken);
      assert.strictEqual(exists, null);
    });

    it('should drop duplicate job with identical ID (Idempotency Invariant)', async () => {
      const queue = new NotificationQueue(3, 20);
      let executedCount = 0;

      queue.registerHandler(async () => {
        executedCount++;
      });

      const enqueuedFirst = await queue.enqueue({
        id: 'idempotent-job-key-999',
        notificationId: 'notif-idem-1',
        targetType: 'topic',
        target: 'topic_breaking_mp',
        payload: { title: 'एकल', body: 'संदेश' },
        channel: 'breaking_news',
      });
      assert.strictEqual(enqueuedFirst, true);

      // Attempt second enqueue with identical ID
      const enqueuedSecond = await queue.enqueue({
        id: 'idempotent-job-key-999',
        notificationId: 'notif-idem-1',
        targetType: 'topic',
        target: 'topic_breaking_mp',
        payload: { title: 'एकल', body: 'संदेश' },
        channel: 'breaking_news',
      });
      assert.strictEqual(enqueuedSecond, false); // Rejected as duplicate

      await queue.drain();
      assert.strictEqual(executedCount, 1);
    });
  });
});
