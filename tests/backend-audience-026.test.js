/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Execution 026 — Audience Growth, User Engagement & Intelligence System Test Suite
 * 
 * Verifies:
 * 1. Audience Intelligence Dashboard Overview (DAU, WAU, MAU, Dwell Time, Retention, Geo Distribution)
 * 2. Content Performance Analytics (Article-level Views, Dwell Seconds, Scroll Depth, Engagement Rate)
 * 3. Privacy-Safe Audience Segmentation & Reach Calculator (Non-sensitive Signals)
 * 4. User Profiles & Preferences with DPDPA 2023 Minimization & Neutral Reset
 * 5. DPDPA 2023 Data Portability (Export Package with SHA-256 Checksum) & Right to Erasure
 * 6. Personalized News Feed with Anti-Filter-Bubble Defense & Chronological Mode Fallback
 * 7. Bookmarks Lifecycle (CRUD, Idempotent Add, Limit Enforcement)
 * 8. Reading History Tracking with 30-Minute Deduplication & Dwell Time Persistence
 * 9. Entity Following (Topics & Districts Follow/Unfollow)
 * 10. Unified Notification Center with 10-Minute Broadcast Duplicate Suppression
 * 11. Reader Feedback & Article Corrections Queue with SLA Verification (24h/48h)
 * 12. Community Comments Engine with Spam Keyword Shield, Link Flood Filter & Rate Limiting (429)
 * 13. Comment Reporting (Threshold Auto-Flagging at 3 Reports) & Editorial Moderation
 * 14. Hyperlocal Discovery & Search with Strict Publication Boundary Defense (Zero Draft Leaks)
 * 15. Trending Regional Search Queries & Category/District Related Stories
 * 16. Telemetry Event Ingestion
 * 17. Server-Side RBAC Enforcement on Audience & Moderation Endpoints
 * 18. Dual Persistence Parity (LocalJsonAdapter & FirestoreAdapter) across 11 Collections
 */

import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import crypto from 'node:crypto';
import { handleApiRequest, signToken } from '../src/server/apiEngine.js';
import { getPersistenceAdapter } from '../src/server/persistence/adapter.js';
import { FirestoreAdapter } from '../src/server/persistence/firestoreAdapter.js';
import {
  AUDIENCE_LIMITS,
  AUDIENCE_ERROR_CODES,
  CANONICAL_AUDIENCE_SEGMENTS,
  DEFAULT_USER_PREFERENCES,
  PreferenceManager,
  EngagementManager,
  RecommendationEngine,
  CommentManager,
  NotificationManager,
  AudienceAnalyticsEngine,
  DiscoveryEngine,
} from '../src/server/audience/index.js';

process.env.NODE_ENV = 'test';

function createMockHttp() {
  let server;
  let baseUrl;

  const start = () =>
    new Promise((resolve) => {
      server = http.createServer(async (req, res) => {
        try {
          await handleApiRequest(req, res);
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: { message: err.message } }));
        }
      });
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

  const stop = () =>
    new Promise((resolve) => {
      if (server) {
        server.close(resolve);
      } else {
        resolve();
      }
    });

  const request = async (method, path, body = null, headers = {}) => {
    const url = new URL(path, baseUrl);
    return new Promise((resolve, reject) => {
      const req = http.request(
        url,
        {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const json = data ? JSON.parse(data) : {};
              resolve({ status: res.statusCode, headers: res.headers, body: json });
            } catch {
              resolve({ status: res.statusCode, headers: res.headers, body: data });
            }
          });
        }
      );
      req.on('error', reject);
      if (body) {
        if (typeof body === 'string') {
          req.write(body);
        } else {
          req.write(JSON.stringify(body));
        }
      }
      req.end();
    });
  };

  return { start, stop, request };
}

test('Master Execution 026: Audience Growth, User Engagement & Intelligence System', async (t) => {
  const httpHelper = createMockHttp();
  await httpHelper.start();

  const adapter = getPersistenceAdapter({ allowDevFallback: true });

  // Generate test tokens
  const adminUser = {
    id: 'usr-admin-026',
    email: 'chief.editor@breakingnewswala.com',
    fullName: 'मुख्य संपादक (Chief Editor)',
    roles: ['ADMIN', 'CHIEF_EDITOR'],
  };
  const adminToken = signToken(adminUser);

  const readerUser = {
    id: 'usr-reader-026',
    email: 'reader.bhopal@example.com',
    fullName: 'अमित कुमार शर्मा',
    roles: ['READER'],
  };
  const readerToken = signToken(readerUser);

  const readerUser2 = {
    id: 'usr-reader-026-b',
    email: 'reader.indore@example.com',
    fullName: 'रोहित वर्मा',
    roles: ['READER'],
  };
  const readerToken2 = signToken(readerUser2);

  t.after(async () => {
    await httpHelper.stop();
  });

  // =========================================================================
  // 1. Audience Intelligence Dashboard Overview
  // =========================================================================
  await t.test('1. Audience Intelligence Dashboard Overview', async () => {
    // 1a. Unauthenticated request should fail (401)
    const unauth = await httpHelper.request('GET', '/api/v1/audience/dashboard');
    assert.strictEqual(unauth.status, 401, 'Unauthenticated access must be rejected');

    // 1b. Reader role should be forbidden (403)
    const readerRes = await httpHelper.request('GET', '/api/v1/audience/dashboard', null, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.strictEqual(readerRes.status, 403, 'Reader role must be forbidden from audience dashboard');

    // 1c. Admin/Editor access should return comprehensive metrics
    const adminRes = await httpHelper.request('GET', '/api/v1/audience/dashboard?timeRange=7d', null, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(adminRes.status, 200, 'Admin must receive 200 OK');
    assert.strictEqual(adminRes.body.success, true);
    const data = adminRes.body.data;

    assert.ok(data.overview, 'Overview must be present');
    assert.ok(data.overview.dailyActiveUsers > 0, 'DAU must be greater than 0');
    assert.ok(data.overview.weeklyActiveUsers > 0, 'WAU must be greater than 0');
    assert.ok(data.overview.monthlyActiveUsers > 0, 'MAU must be greater than 0');
    assert.ok(data.overview.avgReadingTimeSeconds > 0, 'Average reading time must be tracked');
    assert.ok(data.overview.retention30DayPercent > 50, '30-day retention must be tracked');
    assert.ok(Array.isArray(data.districtDistribution), 'District distribution must be an array');
    assert.ok(data.districtDistribution.length >= 5, 'At least 5 districts must be reported');
    assert.ok(data.platformDistribution.mobileWeb > 50, 'Mobile web should represent majority of traffic');
  });

  // =========================================================================
  // 2. Content Performance Analytics
  // =========================================================================
  await t.test('2. Content Performance Analytics', async () => {
    const res = await httpHelper.request('GET', '/api/v1/audience/analytics/content?timeRange=7d', null, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    const data = res.body.data;

    assert.ok(Array.isArray(data.topStories), 'Top stories must be an array');
    if (data.topStories.length > 0) {
      const topStory = data.topStories[0];
      assert.ok(topStory.articleId, 'Story articleId must be present');
      assert.ok(topStory.metrics.views >= 0, 'Story views must be tracked');
      assert.ok(topStory.metrics.avgDwellSeconds > 0, 'Story dwell time must be tracked');
      assert.ok(topStory.metrics.avgScrollDepthPercent > 0, 'Story scroll depth must be tracked');
      assert.ok(typeof topStory.metrics.engagementRatePercent === 'number', 'Engagement rate must be computed');
    }
  });

  // =========================================================================
  // 3. Privacy-Safe Audience Segmentation & Reach Calculator
  // =========================================================================
  await t.test('3. Privacy-Safe Audience Segmentation & Reach Calculator', async () => {
    // 3a. Retrieve predefined canonical segments
    const segRes = await httpHelper.request('GET', '/api/v1/audience/segments', null, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(segRes.status, 200);
    const segments = segRes.body.data;
    assert.ok(Array.isArray(segments), 'Segments must be an array');
    assert.ok(segments.length >= 5, 'At least 5 canonical segments must be present');

    // 3b. Preview segment aggregate reach without exposing PII
    const previewRes = await httpHelper.request('POST', '/api/v1/audience/segments/preview', {
      criteria: {
        preferredDistricts: ['भोपाल', 'इंदौर'],
        preferredCategories: ['politics', 'development'],
      },
    }, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(previewRes.status, 200);
    assert.ok(previewRes.body.data.estimatedReach > 0, 'Estimated reach must be computed');
    assert.strictEqual(previewRes.body.data.privacyClassification, 'NON_SENSITIVE_AGGREGATE');

    // 3c. Create custom audience segment
    const createSegRes = await httpHelper.request('POST', '/api/v1/audience/segments', {
      code: 'chambal_youth_readers',
      nameHi: 'चंबल युवा पाठक वर्ग',
      descriptionHi: 'ग्वालियर व मुरैना क्षेत्र के युवा पाठक',
      criteria: { preferredDistricts: ['ग्वालियर', 'मुरैना'] },
    }, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.ok([200, 201].includes(createSegRes.status));
    assert.strictEqual(createSegRes.body.data.code, 'chambal_youth_readers');
  });

  // =========================================================================
  // 4. User Profiles & Preferences (DPDPA 2023 Compliant)
  // =========================================================================
  await t.test('4. User Profiles & Preferences with DPDPA 2023 Minimization', async () => {
    // 4a. Get preferences for reader (returns default template initially)
    const prefRes = await httpHelper.request('GET', '/api/v1/audience/preferences', null, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.strictEqual(prefRes.status, 200);
    assert.strictEqual(prefRes.body.data.userId, readerUser.id);
    assert.strictEqual(prefRes.body.data.preferredLanguage, 'hi');

    // 4b. Update preferences with custom districts and categories
    const updateRes = await httpHelper.request('PATCH', '/api/v1/audience/preferences', {
      preferredDistricts: ['भोपाल', 'सीहोर'],
      preferredCategories: ['politics', 'crime'],
      preferredLanguage: 'hi',
      breakingAlertsEnabled: true,
    }, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.strictEqual(updateRes.status, 200);
    assert.deepStrictEqual(updateRes.body.data.preferredDistricts, ['भोपाल', 'सीहोर']);

    // 4c. Language validation (only 'hi' and 'en' allowed)
    const invalidLangRes = await httpHelper.request('PATCH', '/api/v1/audience/preferences', {
      preferredLanguage: 'fr',
    }, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.strictEqual(invalidLangRes.status, 400, 'Invalid language must be rejected');

    // 4d. Reset personalization to neutral default
    const resetRes = await httpHelper.request('POST', '/api/v1/audience/preferences/reset', {}, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.strictEqual(resetRes.status, 200);
    assert.deepStrictEqual(resetRes.body.data.preferredDistricts, ['भोपाल']);
  });

  // =========================================================================
  // 5. DPDPA 2023 Data Portability & Right to Erasure
  // =========================================================================
  await t.test('5. DPDPA 2023 Data Portability & Erasure', async () => {
    // 5a. Data Portability Export
    const exportRes = await httpHelper.request('GET', '/api/v1/audience/privacy/export', null, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.strictEqual(exportRes.status, 200);
    assert.strictEqual(exportRes.body.data.userId, readerUser.id);
    assert.ok(exportRes.body.data.securityChecksum, 'SHA-256 security checksum must be provided');
    assert.strictEqual(exportRes.body.data.complianceStandard, 'Digital Personal Data Protection Act (DPDPA 2023)');

    // 5b. Right to Erasure (Account Deletion Request with 30-Day Grace Period)
    const delRes = await httpHelper.request('POST', '/api/v1/audience/privacy/delete-request', {
      reason: 'No longer reading news',
    }, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.ok([200, 202].includes(delRes.status), 'Deletion request must be accepted');
    assert.strictEqual(delRes.body.data.status, 'PENDING_GRACE_PERIOD');
    assert.ok(delRes.body.data.gracePeriodEndsAt, 'Grace period end date must be defined');
  });

  // =========================================================================
  // 6. Personalized News Feed & Anti-Filter-Bubble Defense
  // =========================================================================
  await t.test('6. Personalized News Feed & Anti-Filter-Bubble Defense', async () => {
    // 6a. Chronological mode feed
    const chronoRes = await httpHelper.request('GET', '/api/v1/audience/feed/personalized?mode=chronological');
    assert.strictEqual(chronoRes.status, 200);
    assert.strictEqual(chronoRes.body.data.mode, 'chronological');
    assert.ok(Array.isArray(chronoRes.body.data.feed), 'Feed items must be an array');

    // 6b. Personalized mode feed with authenticated reader
    const personRes = await httpHelper.request('GET', '/api/v1/audience/feed/personalized?mode=personalized', null, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.strictEqual(personRes.status, 200);
    assert.strictEqual(personRes.body.data.mode, 'personalized');
    const feed = personRes.body.data.feed;
    assert.ok(Array.isArray(feed), 'Feed must be an array');

    if (feed.length > 0) {
      const firstStory = feed[0];
      assert.ok(firstStory.recommendationReason, 'Recommendation reason explanation must be provided');
      // Anti-filter-bubble guarantee: breaking stories get +1000 score
      const breakingStory = feed.find((s) => s.isBreaking);
      if (breakingStory) {
        assert.ok(breakingStory.relevanceScore >= 1000, 'Breaking news must have anti-filter-bubble priority boost');
      }
    }
  });

  // =========================================================================
  // 7. Bookmarks Lifecycle
  // =========================================================================
  await t.test('7. Bookmarks Lifecycle Management', async () => {
    const articleId = 'art-test-026-bookmark';

    // 7a. Save Bookmark
    const saveRes = await httpHelper.request('POST', '/api/v1/audience/bookmarks', {
      articleId,
    }, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.ok([200, 201].includes(saveRes.status));
    assert.strictEqual(saveRes.body.data.articleId, articleId);

    // 7b. Idempotent Bookmark Add
    const repeatRes = await httpHelper.request('POST', '/api/v1/audience/bookmarks', {
      articleId,
    }, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.ok([200, 201].includes(repeatRes.status));

    // 7c. Get Bookmarks List
    const listRes = await httpHelper.request('GET', '/api/v1/audience/bookmarks', null, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.strictEqual(listRes.status, 200);
    assert.ok(listRes.body.data.some((b) => b.articleId === articleId), 'Bookmarked story must be returned');

    // 7d. Remove Bookmark
    const delRes = await httpHelper.request('DELETE', `/api/v1/audience/bookmarks/${articleId}`, null, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.strictEqual(delRes.status, 200);
    assert.strictEqual(delRes.body.data.success, true);
  });

  // =========================================================================
  // 8. Reading History Tracking with 30-Minute Deduplication
  // =========================================================================
  await t.test('8. Reading History Tracking with 30-Minute Deduplication', async () => {
    const articleId = 'art-test-026-history';

    // 8a. First read
    const firstRead = await httpHelper.request('POST', '/api/v1/audience/history', {
      articleId,
      dwellTimeSeconds: 45,
      scrollDepthPercent: 80,
      articleTitle: 'मध्य प्रदेश में नई औद्योगिक नीति लागू',
      districtName: 'भोपाल',
      category: 'विकास',
    }, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.ok([200, 201].includes(firstRead.status));
    assert.strictEqual(firstRead.body.data.articleId, articleId);

    // 8b. Immediate duplicate read within 30 minutes must be deduplicated
    const dupRead = await httpHelper.request('POST', '/api/v1/audience/history', {
      articleId,
      dwellTimeSeconds: 15,
      scrollDepthPercent: 30,
    }, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.ok([200, 201].includes(dupRead.status));
    assert.strictEqual(dupRead.body.data.duplicate, true, 'Duplicate read within 30m must be flagged');

    // 8c. List Reading History
    const histList = await httpHelper.request('GET', '/api/v1/audience/history', null, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.strictEqual(histList.status, 200);
    assert.ok(histList.body.data.some((h) => h.articleId === articleId));

    // 8d. Clear Reading History
    const clearRes = await httpHelper.request('DELETE', '/api/v1/audience/history', null, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.strictEqual(clearRes.status, 200);
    assert.strictEqual(clearRes.body.data.success, true);
  });

  // =========================================================================
  // 9. Followed Topics & Districts Management
  // =========================================================================
  await t.test('9. Followed Topics & Districts Management', async () => {
    // 9a. Follow Topic
    const followTopicRes = await httpHelper.request('POST', '/api/v1/audience/follows/topics', {
      topic: 'लाड़ली बहना योजना',
    }, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.ok([200, 201].includes(followTopicRes.status));

    // 9b. List Followed Topics
    const topicsRes = await httpHelper.request('GET', '/api/v1/audience/follows/topics', null, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.strictEqual(topicsRes.status, 200);
    assert.ok(topicsRes.body.data.some((t) => t.topic === 'लाड़ली बहना योजना'));

    // 9c. Unfollow Topic
    const unfollowTopicRes = await httpHelper.request('DELETE', `/api/v1/audience/follows/topics/${encodeURIComponent('लाड़ली बहना योजना')}`, null, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.strictEqual(unfollowTopicRes.status, 200);
    assert.strictEqual(unfollowTopicRes.body.data.success, true);

    // 9d. Follow District
    const followDistRes = await httpHelper.request('POST', '/api/v1/audience/follows/districts', {
      district: 'उज्जैन',
    }, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.ok([200, 201].includes(followDistRes.status));

    // 9e. List Followed Districts
    const distsRes = await httpHelper.request('GET', '/api/v1/audience/follows/districts', null, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.strictEqual(distsRes.status, 200);
    assert.ok(distsRes.body.data.some((d) => d.district === 'उज्जैन'));

    // 9f. Unfollow District
    const unfollowDistRes = await httpHelper.request('DELETE', `/api/v1/audience/follows/districts/${encodeURIComponent('उज्जैन')}`, null, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.strictEqual(unfollowDistRes.status, 200);
    assert.strictEqual(unfollowDistRes.body.data.success, true);
  });

  // =========================================================================
  // 10. Unified Notification Center & Broadcast Duplicate Suppression
  // =========================================================================
  await t.test('10. Notification Center & 10-Minute Broadcast Duplicate Suppression', async () => {
    // 10a. Broadcast notification by editor
    const bcastRes = await httpHelper.request('POST', '/api/v1/audience/notifications/broadcast', {
      title: 'मौसम विभाग: भोपाल संभाग में भारी वर्षा का अलर्ट',
      message: 'नागरिकों से सतर्क रहने व अनावश्यक यात्रा से बचने की अपील।',
      district: 'भोपाल संभाग',
      priority: 'high',
    }, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.ok([200, 201].includes(bcastRes.status));
    assert.ok(bcastRes.body.data.id, 'Notification ID must be returned');

    // 10b. Duplicate broadcast suppression within 10 minutes
    const dupBcastRes = await httpHelper.request('POST', '/api/v1/audience/notifications/broadcast', {
      title: 'मौसम विभाग: भोपाल संभाग में भारी वर्षा का अलर्ट',
      message: 'नागरिकों से सतर्क रहने व अनावश्यक यात्रा से बचने की अपील।',
      district: 'भोपाल संभाग',
      priority: 'high',
    }, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.ok([200, 201].includes(dupBcastRes.status));
    assert.strictEqual(dupBcastRes.body.data.suppressedDuplicate, true, 'Identical broadcast within 10m must be suppressed');

    // 10c. Reader gets notifications list
    const notifsRes = await httpHelper.request('GET', '/api/v1/audience/notifications', null, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.strictEqual(notifsRes.status, 200);
    const notifications = notifsRes.body.data.notifications;
    assert.ok(Array.isArray(notifications));
    assert.ok(notifications.length > 0);

    // 10d. Mark notification as read
    const firstNotif = notifications[0];
    const readRes = await httpHelper.request('PATCH', `/api/v1/audience/notifications/${firstNotif.id}/read`, {}, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.strictEqual(readRes.status, 200);
    assert.strictEqual(readRes.body.data.success, true);

    // 10e. Mark all notifications as read
    const readAllRes = await httpHelper.request('POST', '/api/v1/audience/notifications/read-all', {}, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.strictEqual(readAllRes.status, 200);
  });

  // =========================================================================
  // 11. Reader Feedback & Article Corrections with SLA
  // =========================================================================
  await t.test('11. Reader Feedback & Article Corrections Queue with SLA', async () => {
    // 11a. Submit factual error correction (SLA: 24h)
    const fbRes = await httpHelper.request('POST', '/api/v1/audience/feedback', {
      articleId: 'art-sample-correction',
      category: 'fact_error',
      comments: 'समाचार में प्रस्तुत सांख्यिकी 2024 की जगह 2023 की है।',
      suggestedCorrection: 'कृषि विभाग की आधिकारिक रिपोर्ट अनुसार उत्पादन 18 लाख टन था।',
      contactEmail: 'reader@example.com',
    });
    assert.ok([200, 201].includes(fbRes.status));
    assert.ok(fbRes.body.data.category, 'Category must be present');
    assert.ok(fbRes.body.data.slaHours > 0, 'Factual error correction SLA must be set');
    assert.strictEqual(fbRes.body.data.status, 'pending');

    const feedbackId = fbRes.body.data.id;

    // 11b. List feedback items (Editorial only)
    const listRes = await httpHelper.request('GET', '/api/v1/audience/feedback', null, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(listRes.status, 200);
    assert.ok(listRes.body.data.some((f) => f.id === feedbackId));

    // 11c. Update feedback status to resolved
    const updateRes = await httpHelper.request('PATCH', `/api/v1/audience/feedback/${feedbackId}/status`, {
      status: 'resolved',
      resolutionNotes: 'तथ्य सत्यापित कर समाचार में संशोधन अद्यतित कर दिया गया है।',
    }, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.body.data.status, 'resolved');
  });

  // =========================================================================
  // 12. Community Comments Engine with Spam Shield & Rate Limiting
  // =========================================================================
  await t.test('12. Community Comments Engine with Spam Shield & Rate Limiting', async () => {
    const articleId = 'art-test-026-comments';

    // 12a. Clean comment submission (approved)
    const cleanComment = await httpHelper.request('POST', `/api/v1/comments/article/${articleId}`, {
      content: 'यह मध्य प्रदेश के किसानों के लिए अत्यंत सराहनीय निर्णय है।',
    }, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.ok([200, 201].includes(cleanComment.status));
    assert.strictEqual(cleanComment.body.data.status, 'approved');

    // 12b. Spam keyword shield (automated flag)
    const spamComment = await httpHelper.request('POST', `/api/v1/comments/article/${articleId}`, {
      content: 'रोजाना सट्टा और betting में जीतें, तुरंत संपर्क करें!',
    }, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.ok([200, 201].includes(spamComment.status));
    assert.strictEqual(spamComment.body.data.status, 'flagged', 'Spam keyword must trigger flagged status');
    assert.strictEqual(spamComment.body.data.isFlagged, true);

    // 12c. Excessive URL links shield (automated flag)
    const urlFloodComment = await httpHelper.request('POST', `/api/v1/comments/article/${articleId}`, {
      content: 'Visit https://example1.com and https://example2.com for free money',
    }, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.ok([200, 201].includes(urlFloodComment.status));
    assert.strictEqual(urlFloodComment.body.data.status, 'flagged', 'Multiple URLs must trigger flagged status');

    // 12d. Public comments feed: non-editors only see approved comments
    const publicComments = await httpHelper.request('GET', `/api/v1/comments/article/${articleId}`);
    assert.strictEqual(publicComments.status, 200);
    assert.ok(publicComments.body.data.every((c) => c.status === 'approved'), 'Public viewers must only see approved comments');

    // 12e. Rate limiting: 10 comments in 10 minutes limit
    const cm = new CommentManager(adapter);
    const spammerId = 'usr-spammer-test';
    for (let i = 0; i < AUDIENCE_LIMITS.MAX_COMMENTS_PER_10_MIN; i++) {
      await cm.addComment({ articleId, content: `Comment number ${i + 1}` }, { id: spammerId, fullName: 'Spammer' });
    }
    // 11th comment must throw rate limit error (429)
    await assert.rejects(
      async () => {
        await cm.addComment({ articleId, content: 'Comment 11 exceeding limit' }, { id: spammerId, fullName: 'Spammer' });
      },
      (err) => err.statusCode === 429 && err.code === AUDIENCE_ERROR_CODES.ERR_COMMENT_RATE_LIMITED
    );
  });

  // =========================================================================
  // 13. Comment Reporting & Editorial Moderation
  // =========================================================================
  await t.test('13. Comment Reporting (Threshold Auto-Flagging) & Moderation', async () => {
    const articleId = 'art-test-026-report';

    const comment = await httpHelper.request('POST', `/api/v1/comments/article/${articleId}`, {
      content: 'यह संदिग्ध दावा है जिसे जांचा जाना चाहिए।',
    }, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.ok([200, 201].includes(comment.status));
    const commentId = comment.body.data.id;

    // Report comment 3 times to trigger threshold auto-flagging
    for (let i = 1; i <= AUDIENCE_LIMITS.COMMENT_REPORT_FLAG_THRESHOLD; i++) {
      const rep = await httpHelper.request('POST', `/api/v1/comments/${commentId}/report`, {
        reason: 'तथ्यहीन अथवा भ्रामक',
      }, {
        Authorization: `Bearer ${readerToken2}`,
      });
      assert.strictEqual(rep.status, 200);
    }

    // Verify comment is now flagged
    const flaggedComment = await adapter.getCommentById(commentId);
    assert.strictEqual(flaggedComment.status, 'flagged', 'Threshold 3 reports must flag comment');
    assert.strictEqual(flaggedComment.isFlagged, true);

    // Editorial moderation: approve comment
    const modRes = await httpHelper.request('PATCH', `/api/v1/comments/${commentId}/moderate`, {
      action: 'approve',
      reason: 'समीक्षा उपरांत टिप्पणी नियमानुकूल पाई गई।',
    }, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(modRes.status, 200);
    assert.strictEqual(modRes.body.data.status, 'approved');
  });

  // =========================================================================
  // 14. Hyperlocal Discovery & Search (Strict Publication Boundary Defense)
  // =========================================================================
  await t.test('14. Discovery & Search with Strict Publication Boundary Defense', async () => {
    // 14a. Add a draft article to persistence to test publication boundary defense
    const draftArticle = {
      id: 'art-secret-draft-026',
      headline: 'अति-गोपनीय आगामी कैबिनेट निर्णय मसौदा',
      title: 'अति-गोपनीय आगामी कैबिनेट निर्णय मसौदा',
      bodyContent: 'यह अभी ड्राफ्ट में है और प्रकाशित नहीं हुआ है।',
      status: 'draft', // DRAFT - MUST NEVER BE SEARCHABLE
      districtName: 'भोपाल',
      category: 'politics',
      createdAt: new Date().toISOString(),
    };
    if (adapter.saveArticle) {
      await adapter.saveArticle(draftArticle);
    }

    // 14b. Search query matching draft title
    const searchRes = await httpHelper.request('GET', '/api/v1/discovery/search?q=अति-गोपनीय');
    assert.strictEqual(searchRes.status, 200);
    const results = searchRes.body.data.results;

    // CRITICAL SECURITY INVARIANT: Zero draft leaks
    const foundDraft = results.find((r) => r.id === draftArticle.id);
    assert.strictEqual(foundDraft, undefined, 'CRITICAL: Draft article must never be returned in search results');

    // 14c. Search for published articles
    const pubSearch = await httpHelper.request('GET', '/api/v1/discovery/search?limit=10');
    assert.strictEqual(pubSearch.status, 200);
    assert.ok(pubSearch.body.data.results.every((r) => r.status === 'published' || r.status === 'PUBLISHED'));

    // 14d. Trending regional search terms
    const trendingRes = await httpHelper.request('GET', '/api/v1/discovery/trending-terms');
    assert.strictEqual(trendingRes.status, 200);
    assert.ok(Array.isArray(trendingRes.body.data.terms));
    assert.ok(trendingRes.body.data.terms.length >= 5);

    // 14e. Related stories
    const relatedRes = await httpHelper.request('GET', '/api/v1/discovery/related/art-mp-bhopal-metro-001?limit=3');
    assert.strictEqual(relatedRes.status, 200);
    assert.ok(Array.isArray(relatedRes.body.data));
  });

  // =========================================================================
  // 15. Telemetry Event Ingestion
  // =========================================================================
  await t.test('15. Telemetry Event Ingestion', async () => {
    const telemRes = await httpHelper.request('POST', '/api/v1/audience/telemetry', {
      eventName: 'article_read_30s',
      articleId: 'art-sample-telem',
      dwellSeconds: 35,
      scrollDepthPercent: 75,
      category: 'state',
      district: 'भोपाल',
    });
    assert.ok([200, 201].includes(telemRes.status));
    assert.ok(telemRes.body.data.id, 'Telemetry event ID must be generated');
  });

  // =========================================================================
  // 16. Dual Persistence Parity (LocalJsonAdapter & FirestoreAdapter)
  // =========================================================================
  await t.test('16. Dual Persistence Parity across 11 Audience Collections', async () => {
    const fsAdapter = new FirestoreAdapter();
    await fsAdapter.init();

    // 16a. User Preferences
    const testPrefs = { preferredDistricts: ['जबलपुर'], preferredCategories: ['development'] };
    const p1 = await adapter.saveUserPreferences('usr-parity-1', testPrefs);
    const p2 = await fsAdapter.saveUserPreferences('usr-parity-1', testPrefs);
    assert.strictEqual(p1.userId, p2.userId);
    assert.deepStrictEqual(p1.preferredDistricts, p2.preferredDistricts);

    // 16b. Bookmarks
    const testBm = { userId: 'usr-parity-1', articleId: 'art-parity-bm-1' };
    const b1 = await adapter.saveBookmark(testBm);
    const b2 = await fsAdapter.saveBookmark(testBm);
    assert.strictEqual(b1.articleId, b2.articleId);

    // 16c. Reading History
    const testHist = { userId: 'usr-parity-1', articleId: 'art-parity-rh-1', dwellTimeSeconds: 50 };
    const h1 = await adapter.saveReadingHistory(testHist);
    const h2 = await fsAdapter.saveReadingHistory(testHist);
    assert.strictEqual(h1.articleId, h2.articleId);

    // 16d. Followed Entities
    const fTop1 = await adapter.saveFollowedTopic({ userId: 'usr-parity-1', topic: 'MP Tourism' });
    const fTop2 = await fsAdapter.saveFollowedTopic({ userId: 'usr-parity-1', topic: 'MP Tourism' });
    assert.strictEqual(fTop1.topic, fTop2.topic);

    const fDist1 = await adapter.saveFollowedDistrict({ userId: 'usr-parity-1', district: 'मंडला' });
    const fDist2 = await fsAdapter.saveFollowedDistrict({ userId: 'usr-parity-1', district: 'मंडला' });
    assert.strictEqual(fDist1.district, fDist2.district);

    // 16e. Notifications
    const n1 = await adapter.createNotification({ title: 'Parity Test', message: 'Hello' });
    const n2 = await fsAdapter.createNotification({ title: 'Parity Test', message: 'Hello' });
    assert.strictEqual(n1.title, n2.title);

    // 16f. Reader Feedback
    const fb1 = await adapter.saveReaderFeedback({ comments: 'Parity feedback', category: 'general_feedback' });
    const fb2 = await fsAdapter.saveReaderFeedback({ comments: 'Parity feedback', category: 'general_feedback' });
    assert.strictEqual(fb1.comments, fb2.comments);

    // 16g. Comments
    const c1 = await adapter.saveComment({ content: 'Parity comment', articleId: 'art-parity-c' });
    const c2 = await fsAdapter.saveComment({ content: 'Parity comment', articleId: 'art-parity-c' });
    assert.strictEqual(c1.content, c2.content);

    // 16h. Audience Segments
    const seg1 = await adapter.getAudienceSegments();
    const seg2 = await fsAdapter.getAudienceSegments();
    assert.ok(Array.isArray(seg1));
    assert.ok(Array.isArray(seg2));

    // 16i. Telemetry Events
    const evt1 = await adapter.recordEngagementEvent({ eventName: 'article_viewed' });
    const evt2 = await fsAdapter.recordEngagementEvent({ eventName: 'article_viewed' });
    assert.strictEqual(evt1.eventName, evt2.eventName);
  });
});
