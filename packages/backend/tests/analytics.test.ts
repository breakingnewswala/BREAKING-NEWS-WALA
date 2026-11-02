/**
 * BREAKING NEWS WALA — Telemetry Ingress & Redis Stream Aggregator Test Suite
 * Grounded in docs/Analytics.md, docs/DECISIONS.md (DEC-014, DEC-021),
 * docs/06-Business-Rules.md (RULE-ANA-001 through RULE-ANA-006),
 * and docs/13-API.md (ANL-01 to ANL-03, REP-12).
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { createApp } from '../src/app';
import { createTestClient, TestClient } from './test-helper';
import { tokenService } from '../src/modules/auth/token.service';
import {
  ANALYTICS_LIMITS,
  APPROVED_EVENT_NAMES,
  APPROVED_PLATFORMS,
} from '../src/modules/analytics/analytics.constants';
import { privacyService } from '../src/modules/analytics/privacy.service';
import {
  getStreamAggregator,
  InMemoryRedisStreamAggregator,
  setStreamAggregator,
} from '../src/modules/analytics/stream.aggregator';
import {
  getAnalyticsRepository,
  InMemoryAnalyticsRepository,
  setAnalyticsRepository,
} from '../src/modules/analytics/analytics.repository';
import {
  getArticleRepository,
  InMemoryArticleRepository,
} from '../src/modules/articles/article.repository';
import { EnrichedAnalyticsEvent } from '../src/modules/analytics/types';

describe('Analytics Engine — Policy & Privacy Invariants (Unit)', () => {
  it('should verify deduplication and limits constants (RULE-ANA-002, DEC-021)', () => {
    assert.strictEqual(ANALYTICS_LIMITS.DEDUP_WINDOW_SECONDS, 1800, 'Dedup window must be 1800s (30 mins)');
    assert.strictEqual(ANALYTICS_LIMITS.DEDUP_WINDOW_MS, 1800000);
    assert.strictEqual(ANALYTICS_LIMITS.MAX_PAYLOAD_SIZE_BYTES, 65536, 'Max payload size must be 64KB');
    assert.strictEqual(ANALYTICS_LIMITS.MAX_INGESTION_RATE_PER_MINUTE, 120, 'Max 120 req/min per IP');
    assert.strictEqual(ANALYTICS_LIMITS.TRENDING_WINDOW_MS, 900000, '15-min trending window');
    assert.strictEqual(ANALYTICS_LIMITS.TIMEZONE, 'Asia/Kolkata');
  });

  it('should verify approved event taxonomy and client platforms (docs/Analytics.md Section 16)', () => {
    assert.ok(APPROVED_EVENT_NAMES.includes('article_viewed'));
    assert.ok(APPROVED_EVENT_NAMES.includes('video_heartbeat'));
    assert.ok(APPROVED_EVENT_NAMES.includes('article_shared'));
    assert.ok(APPROVED_EVENT_NAMES.includes('category_browsed'));
    assert.ok(APPROVED_EVENT_NAMES.includes('district_browsed'));
    assert.ok(APPROVED_PLATFORMS.includes('web_desktop'));
    assert.ok(APPROVED_PLATFORMS.includes('web_mobile'));
    assert.ok(APPROVED_PLATFORMS.includes('android'));
  });

  describe('Privacy & Data Minimization (DPDP Act, RULE-ANA-001, ADR-ANA-003)', () => {
    it('should truncate IPv4 address by zeroing the last octet', () => {
      assert.strictEqual(privacyService.truncateIp('203.0.113.195'), '203.0.113.0');
      assert.strictEqual(privacyService.truncateIp('192.168.1.42'), '192.168.1.0');
      assert.strictEqual(privacyService.truncateIp('::ffff:10.0.0.88'), '10.0.0.0');
    });

    it('should truncate IPv6 address by zeroing trailing bits', () => {
      assert.strictEqual(
        privacyService.truncateIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334'),
        '2001:0db8:85a3::0'
      );
    });

    it('should generate pseudonymized session hash with rolling daily salt', () => {
      const hash1 = privacyService.generateSessionHash('203.0.113.0', 'Mozilla/5.0', '2026-10-31');
      const hash2 = privacyService.generateSessionHash('203.0.113.0', 'Mozilla/5.0', '2026-10-31');
      const hashOtherDay = privacyService.generateSessionHash('203.0.113.0', 'Mozilla/5.0', '2026-11-01');

      assert.strictEqual(hash1, hash2, 'Identical inputs on same day must yield identical hash');
      assert.notStrictEqual(hash1, hashOtherDay, 'Different day salt must rotate session hash');
      assert.strictEqual(hash1.length, 32);
    });

    it('should scrub credentials, tokens, GPS coordinates, and personal data from properties', () => {
      const dirty = {
        article_id: '10492',
        reading_time_seconds: 45,
        user_password: 'super-secret-password',
        auth_token: 'jwt-bearer-token',
        latitude: 23.2599,
        longitude: 77.4126,
        user_phone: '9876543210',
        user_email: 'reader@example.com',
      };

      const cleaned = privacyService.sanitizeProperties(dirty);
      assert.strictEqual(cleaned.article_id, '10492');
      assert.strictEqual(cleaned.reading_time_seconds, 45);
      assert.strictEqual(cleaned.user_password, undefined);
      assert.strictEqual(cleaned.auth_token, undefined);
      assert.strictEqual(cleaned.latitude, undefined);
      assert.strictEqual(cleaned.longitude, undefined);
      assert.strictEqual(cleaned.user_phone, undefined);
      assert.strictEqual(cleaned.user_email, undefined);
    });

    it('should detect known bots and crawlers via user-agent heuristics (Section 19.1)', () => {
      assert.strictEqual(privacyService.isKnownBot('Googlebot/2.1 (+http://www.google.com/bot.html)'), true);
      assert.strictEqual(privacyService.isKnownBot('Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'), true);
      assert.strictEqual(privacyService.isKnownBot('curl/7.88.1'), true);
      assert.strictEqual(privacyService.isKnownBot('python-requests/2.31.0'), true);
      assert.strictEqual(privacyService.isKnownBot('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'), false);
    });
  });
});

describe('Redis Stream Aggregator Engine (Unit & Stream Mechanics)', () => {
  let stream: InMemoryRedisStreamAggregator;

  beforeEach(() => {
    stream = new InMemoryRedisStreamAggregator();
  });

  const sampleEvent: EnrichedAnalyticsEvent = {
    event_id: 'a0000000-0000-0000-0000-000000000001',
    event_name: 'article_viewed',
    event_version: '1.0',
    timestamp: new Date().toISOString(),
    platform: 'web_mobile',
    session_hash: 'sess-hash-test-1234',
    properties: { article_id: '10000000-0000-0000-0000-000000000001', reading_time_seconds: 30 },
    client_ip_truncated: '127.0.0.0',
    is_bot: false,
    is_duplicate: false,
    ingested_at: new Date().toISOString(),
  };

  it('should publish events to stream with unique monotonic message IDs (XADD)', async () => {
    const id1 = await stream.publishEvent(sampleEvent);
    const id2 = await stream.publishEvent({ ...sampleEvent, event_id: 'a0000000-0000-0000-0000-000000000002' });

    assert.ok(id1.includes('-'));
    assert.ok(id2.includes('-'));
    assert.notStrictEqual(id1, id2);

    const stats = await stream.getStats();
    assert.strictEqual(stats.streamLength, 2);
  });

  it('should read events into consumer group and place into Pending Entry List (XREADGROUP)', async () => {
    await stream.publishEvent(sampleEvent);

    const messages = await stream.readGroup('cg:analytics:aggregator', 'consumer-1', 10);
    assert.strictEqual(messages.length, 1);
    assert.strictEqual(messages[0].event.event_id, sampleEvent.event_id);

    const stats = await stream.getStats('cg:analytics:aggregator');
    assert.strictEqual(stats.pendingCount, 1, 'Message must be in PEL pending acknowledgment');
    assert.strictEqual(stats.acknowledgedCount, 0);
  });

  it('should acknowledge messages upon successful handler execution (XACK)', async () => {
    await stream.publishEvent(sampleEvent);

    let processedCount = 0;
    const res = await stream.processBatch(
      'cg:analytics:aggregator',
      'consumer-1',
      async (evt) => {
        assert.strictEqual(evt.event_id, sampleEvent.event_id);
        processedCount++;
      }
    );

    assert.strictEqual(res.processed, 1);
    assert.strictEqual(res.failed, 0);
    assert.strictEqual(processedCount, 1);

    const stats = await stream.getStats('cg:analytics:aggregator');
    assert.strictEqual(stats.pendingCount, 0, 'PEL must be cleared after XACK');
    assert.strictEqual(stats.acknowledgedCount, 1);
  });

  it('should NOT acknowledge messages if handler throws error (No premature ACK)', async () => {
    await stream.publishEvent(sampleEvent);

    const res = await stream.processBatch(
      'cg:analytics:aggregator',
      'consumer-1',
      async () => {
        throw new Error('Database connection interrupted during batch rollup');
      }
    );

    assert.strictEqual(res.processed, 0);
    assert.strictEqual(res.failed, 1);

    const stats = await stream.getStats('cg:analytics:aggregator');
    assert.strictEqual(stats.pendingCount, 1, 'Failed message must remain in PEL for retry recovery');
    assert.strictEqual(stats.acknowledgedCount, 0);
  });

  it('should recover pending unacknowledged messages and route to Dead Letter Queue if max attempts exceeded', async () => {
    await stream.publishEvent(sampleEvent);

    // Initial read fails
    await stream.processBatch('cg:analytics:aggregator', 'consumer-1', async () => {
      throw new Error('Transient failure');
    });

    // 1st recovery attempt (fails)
    await stream.recoverPending('cg:analytics:aggregator', 'consumer-1', async () => {
      throw new Error('Transient failure 2');
    }, 0);

    // 2nd recovery attempt (fails)
    await stream.recoverPending('cg:analytics:aggregator', 'consumer-1', async () => {
      throw new Error('Transient failure 3');
    }, 0);

    // 3rd recovery: max attempts exceeded -> moves to Dead Letter Queue
    await stream.recoverPending('cg:analytics:aggregator', 'consumer-1', async () => {}, 0);

    assert.strictEqual(stream.deadLetterQueue.length, 1, 'Must be routed to Dead Letter Queue');
    assert.strictEqual(stream.deadLetterQueue[0].event.event_id, sampleEvent.event_id);

    const stats = await stream.getStats('cg:analytics:aggregator');
    assert.strictEqual(stats.pendingCount, 0, 'Must be removed from PEL after DLQ routing');
  });

  it('should reject publish after graceful shutdown', async () => {
    await stream.shutdown();
    await assert.rejects(async () => {
      await stream.publishEvent(sampleEvent);
    }, /shut down/);
  });
});

describe('Telemetry Event Ingress & Aggregation API (Integration)', () => {
  let client: TestClient;
  let inMemoryRepo: InMemoryAnalyticsRepository;
  let inMemoryStream: InMemoryRedisStreamAggregator;
  let articleRepo: InMemoryArticleRepository;

  // Test identities & tokens
  const reporter1 = {
    id: 'usr-reporter-anl-1',
    token: tokenService.generateAccessToken({
      userId: 'usr-reporter-anl-1',
      roles: ['ROLE_REPORTER_STANDARD'],
      status: 'active',
    }).token,
  };

  const reporter2 = {
    id: 'usr-reporter-anl-2',
    token: tokenService.generateAccessToken({
      userId: 'usr-reporter-anl-2',
      roles: ['ROLE_REPORTER_STANDARD'],
      status: 'active',
    }).token,
  };

  const adminUser = {
    id: 'usr-admin-anl-99',
    token: tokenService.generateAccessToken({
      userId: 'usr-admin-anl-99',
      roles: ['ROLE_ADMIN'],
      status: 'active',
    }).token,
  };

  const citizenUser = {
    id: 'usr-citizen-anl-20',
    token: tokenService.generateAccessToken({
      userId: 'usr-citizen-anl-20',
      roles: ['ROLE_CITIZEN'],
      status: 'active',
    }).token,
  };

  // Published test article authored by reporter1
  const publishedArticleId = '11111111-1111-4111-8111-111111111111';
  // Draft article authored by reporter1
  const draftArticleId = '22222222-2222-4222-8222-222222222222';

  before(async () => {
    inMemoryRepo = new InMemoryAnalyticsRepository();
    setAnalyticsRepository(inMemoryRepo);

    inMemoryStream = new InMemoryRedisStreamAggregator();
    setStreamAggregator(inMemoryStream);

    articleRepo = getArticleRepository() as InMemoryArticleRepository;

    const app = createApp();
    client = await createTestClient(app);
  });

  after(async () => {
    await client.close();
  });

  beforeEach(async () => {
    inMemoryRepo.clear();
    inMemoryStream.clear();
    articleRepo.clear();

    // Seed published article
    await articleRepo.createArticle({
      id: publishedArticleId,
      publicId: 'BNW-PUB-101',
      slug: 'bhopal-metro-trial-success',
      title: 'भोपाल मेट्रो का ट्रायल रन सफल, मुख्यमंत्री ने दी बधाई',
      authorId: reporter1.id,
      primaryCategoryId: 'madhya-pradesh',
      primaryLocationId: 'bhopal',
      status: 'published',
      viewCount: 0,
    });

    inMemoryRepo.setArticleMetadata(publishedArticleId, {
      title: 'भोपाल मेट्रो का ट्रायल रन सफल, मुख्यमंत्री ने दी बधाई',
      slug: 'bhopal-metro-trial-success',
      category: 'मध्य प्रदेश',
      district: 'भोपाल',
      status: 'published',
      authorId: reporter1.id,
      views: 0,
    });

    // Seed draft article
    await articleRepo.createArticle({
      id: draftArticleId,
      publicId: 'BNW-DFT-102',
      slug: 'indore-smart-city-draft',
      title: 'इंदौर स्मार्ट सिटी विकास कार्यों की विशेष समीक्षा रिपोर्ट',
      authorId: reporter1.id,
      primaryCategoryId: 'madhya-pradesh',
      primaryLocationId: 'indore',
      status: 'draft',
      viewCount: 0,
    });

    inMemoryRepo.setArticleMetadata(draftArticleId, {
      title: 'इंदौर स्मार्ट सिटी विकास कार्यों की विशेष समीक्षा रिपोर्ट',
      slug: 'indore-smart-city-draft',
      category: 'मध्य प्रदेश',
      district: 'इंदौर',
      status: 'draft',
      authorId: reporter1.id,
      views: 0,
    });
  });

  describe('1. Controlled Telemetry Event Ingestion (POST /api/v1/analytics/events & /event)', () => {
    it('should ingest valid article_viewed event with HTTP 202 Accepted and publish to stream', async () => {
      const payload = {
        event_id: crypto.randomUUID(),
        event_name: 'article_viewed',
        event_version: '1.0',
        timestamp: new Date().toISOString(),
        platform: 'web_mobile',
        session_hash: 'sess-reader-client-01',
        properties: {
          article_id: publishedArticleId,
          category: 'madhya-pradesh',
          district: 'bhopal',
          reading_time_seconds: 35,
          scroll_depth_percent: 75,
          traffic_source: 'organic_search',
        },
      };

      const res = await client.post('/api/v1/analytics/events', payload, {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G991B) Mobile Safari/537.36',
      });

      assert.strictEqual(res.status, 202);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.accepted, true);
      assert.strictEqual(json.data.eventId, payload.event_id);
      assert.strictEqual(json.data.isBot, false);
      assert.strictEqual(json.data.isDuplicate, false);
      assert.ok(json.data.streamMessageId);

      // Verify stream contains message
      const stats = await inMemoryStream.getStats();
      assert.strictEqual(stats.streamLength, 1);
    });

    it('should accept event on canonical alias route POST /api/v1/analytics/event', async () => {
      const payload = {
        event_id: crypto.randomUUID(),
        event_name: 'category_browsed',
        event_version: '1.0',
        timestamp: new Date().toISOString(),
        platform: 'web_desktop',
        session_hash: 'sess-reader-client-02',
        properties: {
          category: 'rajneeti',
        },
      };

      const res = await client.post('/api/v1/analytics/event', payload);
      assert.strictEqual(res.status, 202);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.accepted, true);
    });

    it('should reject unapproved arbitrary event names with HTTP 422 (Taxonomy Guard)', async () => {
      const invalidPayload = {
        event_id: crypto.randomUUID(),
        event_name: 'user_arbitrary_click',
        event_version: '1.0',
        timestamp: new Date().toISOString(),
        platform: 'web_mobile',
        session_hash: 'sess-reader-client-03',
        properties: { arbitrary_key: 'arbitrary_val' },
      };

      const res = await client.post('/api/v1/analytics/events', invalidPayload);
      assert.strictEqual(res.status, 422);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.strictEqual(json.error.code, 'ERR_VALIDATION_FAILED');
      assert.ok(json.error.details.some((d: any) => d.code === 'ERR_INVALID_EVENT_NAME'));
    });

    it('should reject malformed event payloads (missing event_id, invalid platform) with HTTP 422', async () => {
      const malformedPayload = {
        event_name: 'article_viewed',
        event_version: '1.0',
        timestamp: 'invalid-date',
        platform: 'smart_refrigerator',
        session_hash: 'short',
        properties: {},
      };

      const res = await client.post('/api/v1/analytics/events', malformedPayload);
      assert.strictEqual(res.status, 422);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.error.details.some((d: any) => d.code === 'ERR_REQUIRED_FIELD'));
    });
  });

  describe('2. Deduplication & Anti-Gaming Invariants (RULE-ANA-002, DEC-021)', () => {
    it('should enforce 30-minute rolling deduplication window: second read does not increment view counters', async () => {
      const sessionHash = 'sess-unique-dedup-hash-01';

      // First View (Unique)
      const res1 = await client.post('/api/v1/analytics/events', {
        event_id: crypto.randomUUID(),
        event_name: 'article_viewed',
        event_version: '1.0',
        timestamp: new Date().toISOString(),
        platform: 'web_mobile',
        session_hash: sessionHash,
        properties: {
          article_id: publishedArticleId,
          reading_time_seconds: 40,
        },
      });
      assert.strictEqual(res1.status, 202);
      const json1 = await res1.json();
      assert.strictEqual(json1.data.isDuplicate, false, 'First view must be unique');

      // Second View within 30 minutes from identical sessionHash (Duplicate Refresh)
      const res2 = await client.post('/api/v1/analytics/events', {
        event_id: crypto.randomUUID(),
        event_name: 'article_viewed',
        event_version: '1.0',
        timestamp: new Date().toISOString(),
        platform: 'web_mobile',
        session_hash: sessionHash,
        properties: {
          article_id: publishedArticleId,
          reading_time_seconds: 15,
        },
      });
      assert.strictEqual(res2.status, 202);
      const json2 = await res2.json();
      assert.strictEqual(json2.data.isDuplicate, true, 'Second view within 30 mins must be marked duplicate');

      // Verify daily analytics: total views = 2, unique readers = 1
      const daily = await inMemoryRepo.getArticleDailyAnalytics(publishedArticleId);
      assert.strictEqual(daily.length, 1);
      assert.strictEqual(daily[0].totalPageViews, 2);
      assert.strictEqual(daily[0].uniqueReaders, 1, 'Unique reader count must NOT be incremented on duplicate');
    });

    it('should deduplicate replayed network requests sharing identical event_id', async () => {
      const fixedEventId = crypto.randomUUID();
      const payload = {
        event_id: fixedEventId,
        event_name: 'category_browsed',
        event_version: '1.0',
        timestamp: new Date().toISOString(),
        platform: 'web_desktop',
        session_hash: 'sess-replay-01',
        properties: { category: 'madhya-pradesh' },
      };

      // 1st request
      const res1 = await client.post('/api/v1/analytics/events', payload);
      assert.strictEqual(res1.status, 202);
      const json1 = await res1.json();
      assert.strictEqual(json1.data.isDuplicate, false);

      // Replayed 2nd request with same event_id
      const res2 = await client.post('/api/v1/analytics/events', payload);
      assert.strictEqual(res2.status, 202);
      const json2 = await res2.json();
      assert.strictEqual(json2.data.isDuplicate, true);
      assert.ok(json2.data.message.includes('idempotent replay'));
    });
  });

  describe('3. Bot Filtering & Crawler Defense (Section 19.1)', () => {
    it('should detect known bot User-Agents and exclude them from readership counters', async () => {
      const payload = {
        event_id: crypto.randomUUID(),
        event_name: 'article_viewed',
        event_version: '1.0',
        timestamp: new Date().toISOString(),
        platform: 'web_desktop',
        session_hash: 'sess-bot-crawler',
        properties: { article_id: publishedArticleId },
      };

      const res = await client.post('/api/v1/analytics/events', payload, {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      });

      assert.strictEqual(res.status, 202);
      const json = await res.json();
      assert.strictEqual(json.data.isBot, true);
      assert.ok(json.data.message.includes('Bot hit flagged'));

      // Verify article view counters were NOT incremented
      const daily = await inMemoryRepo.getArticleDailyAnalytics(publishedArticleId);
      assert.strictEqual(daily.length, 0, 'Bot views must not create daily analytics records');
    });
  });

  describe('4. Article Lifecycle Guard (Section 7)', () => {
    it('should not increment public readership or trending scores for draft/unpublished articles', async () => {
      const payload = {
        event_id: crypto.randomUUID(),
        event_name: 'article_viewed',
        event_version: '1.0',
        timestamp: new Date().toISOString(),
        platform: 'web_mobile',
        session_hash: 'sess-draft-reader',
        properties: { article_id: draftArticleId },
      };

      const res = await client.post('/api/v1/analytics/events', payload);
      assert.strictEqual(res.status, 202);

      // Verify draft article did not receive public analytics increment
      const daily = await inMemoryRepo.getArticleDailyAnalytics(draftArticleId);
      assert.strictEqual(daily.length, 0, 'Unpublished draft articles must not record public readership');

      // Verify draft does not appear in trending stories
      const trending = await inMemoryRepo.getTrendingArticles();
      assert.ok(!trending.some((t) => t.articleId === draftArticleId));
    });
  });

  describe('5. Real-Time Trending Stories (GET /api/v1/analytics/trending)', () => {
    it('should return top trending published stories with trending scores and zero PII', async () => {
      // Simulate 3 unique views on published article
      for (let i = 1; i <= 3; i++) {
        await client.post('/api/v1/analytics/events', {
          event_id: crypto.randomUUID(),
          event_name: 'article_viewed',
          event_version: '1.0',
          timestamp: new Date().toISOString(),
          platform: 'web_mobile',
          session_hash: `sess-trend-user-${i}`,
          properties: {
            article_id: publishedArticleId,
            reading_time_seconds: 30,
          },
        });
      }

      const res = await client.get('/api/v1/analytics/trending?limit=5');
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.ok(Array.isArray(json.data));
      assert.strictEqual(json.data.length, 1);
      assert.strictEqual(json.data[0].articleId, publishedArticleId);
      assert.strictEqual(json.data[0].viewsLast15m, 3);
      assert.strictEqual(json.data[0].trendingScore, 30);
    });
  });

  describe('6. Platform Overview & RBAC Controls (ANL-03)', () => {
    it('should allow Platform Administrator to inspect platform overview telemetry', async () => {
      // Record a view to populate overview
      await client.post('/api/v1/analytics/events', {
        event_id: crypto.randomUUID(),
        event_name: 'article_viewed',
        event_version: '1.0',
        timestamp: new Date().toISOString(),
        platform: 'web_mobile',
        session_hash: 'sess-overview-01',
        properties: {
          article_id: publishedArticleId,
          reading_time_seconds: 45,
          category: 'rajneeti',
          district: 'bhopal',
        },
      });

      const res = await client.get('/api/v1/analytics/overview', {
        Authorization: `Bearer ${adminUser.token}`,
      });

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.ok(json.data.totalPageViews >= 1);
      assert.ok(Array.isArray(json.data.topCategories));
      assert.ok(Array.isArray(json.data.districtDistribution));
      assert.ok(json.data.platformBreakdown);
    });

    it('should reject unauthenticated request to /overview with 401 Unauthorized', async () => {
      const res = await client.get('/api/v1/analytics/overview');
      assert.strictEqual(res.status, 401);
    });

    it('should reject standard citizen or reporter from /overview with 403 Forbidden', async () => {
      const citizenRes = await client.get('/api/v1/analytics/overview', {
        Authorization: `Bearer ${citizenUser.token}`,
      });
      assert.strictEqual(citizenRes.status, 403);

      const reporterRes = await client.get('/api/v1/analytics/overview', {
        Authorization: `Bearer ${reporter1.token}`,
      });
      assert.strictEqual(reporterRes.status, 403);
    });
  });

  describe('7. Reporter Analytics & Privacy Isolation (RULE-ANA-003, REP-12)', () => {
    it('should allow author reporter to inspect their own article analytics', async () => {
      const res = await client.get(`/api/v1/analytics/articles/${publishedArticleId}`, {
        Authorization: `Bearer ${reporter1.token}`, // Author of publishedArticleId
      });

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.articleId, publishedArticleId);
    });

    it('should reject peer reporter from snooping on another reporter\'s article analytics (403 Forbidden)', async () => {
      const res = await client.get(`/api/v1/analytics/articles/${publishedArticleId}`, {
        Authorization: `Bearer ${reporter2.token}`, // NOT the author
      });

      assert.strictEqual(res.status, 403);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.error.message.includes('RULE-ANA-003'));
    });

    it('should allow reporter to retrieve their own performance scorecard via GET /api/v1/reporter/performance (REP-12)', async () => {
      const res = await client.get('/api/v1/reporter/performance', {
        Authorization: `Bearer ${reporter1.token}`,
      });

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.authorId, reporter1.id);
      assert.ok(json.data.totalSubmissions >= 1);
    });
  });

  describe('8. Legacy Telemetry Ingestion (ANL-01, ANL-02)', () => {
    it('should accept legacy pageview format (POST /api/v1/analytics/pageview)', async () => {
      const res = await client.post('/api/v1/analytics/pageview', {
        articleId: publishedArticleId,
        readingTimeSeconds: 50,
        scrollDepth: 80,
      });

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.accepted, true);
    });

    it('should accept legacy video heartbeat format (POST /api/v1/analytics/video-heartbeat)', async () => {
      const res = await client.post('/api/v1/analytics/video-heartbeat', {
        videoId: 'vid-uuid-reel-01',
        secondsWatched: 18,
      });

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.accepted, true);
    });
  });
});

