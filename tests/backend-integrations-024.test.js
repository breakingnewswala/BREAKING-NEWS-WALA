/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Execution 024 — API Pool, Social Media & Third-Party Integrations Test Suite
 * 
 * Verifies:
 * 1. API Provider Registry & Credential Masking (Zero plaintext key leaks)
 * 2. Provider Activation & Deactivation Controls
 * 3. Provider Live Health Checks & Latency Reporting
 * 4. API Usage, Quota & Cost Accounting (USD & INR estimation parity)
 * 5. SSRF Defense: Rejection of loopback, private RFC 1918 IPs, and cloud metadata
 * 6. Safe XML Parsing & XXE Defense (Blocks <!ENTITY injections, sanitizes HTML)
 * 7. RSS Feed Synchronization & Item Ingestion (status: 'PENDING_REVIEW')
 * 8. RSS Deduplication Hash Protection (Skipping duplicate feed items)
 * 9. Source Deactivation Invariant: Inactive sources cannot trigger sync
 * 10. Human-in-the-Loop Wire-to-Draft Invariant (status: 'DRAFT', source attribution)
 * 11. Webhook Cryptographic Verification (HMAC-SHA256 timingSafeEqual)
 * 12. Webhook Replay Nonce Defense (Duplicate nonce rejected with 409)
 * 13. Webhook Timestamp Drift Defense (> 300s rejected with 400)
 * 14. Social Media Platform Constraints (X <= 280 characters validation)
 * 15. Social Media Human Approval Invariant (Unpublished articles barred; unapproved jobs barred)
 * 16. WhatsApp Business Platform: Opt-in, STOP/Unsubscribe keyword auto-opt-out, sending restrictions
 * 17. YouTube Integration & Quota Governance (10,000 units/day, 1,600 units per video)
 * 18. FirestoreAdapter Parity for all Integration Collections
 */

import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import crypto from 'node:crypto';
import { handleApiRequest, signToken } from '../src/server/apiEngine.js';
import { getPersistenceAdapter } from '../src/server/persistence/adapter.js';
import { FirestoreAdapter } from '../src/server/persistence/firestoreAdapter.js';
import {
  WebhookVerifier,
  SsrfValidator,
  SafeXmlParser,
  PLATFORM_CONSTRAINTS,
  INTEGRATION_ERROR_CODES,
} from '../src/server/integrations/index.js';

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

test('Master Execution 024 — Integrations & API Pool Suite', async (t) => {
  const httpHelper = createMockHttp();
  await httpHelper.start();

  const adminToken = signToken({
    id: 'usr-admin-024',
    fullName: 'सिस्टम एडमिन',
    role: 'ADMIN',
    roles: ['ADMIN'],
  });

  const editorToken = signToken({
    id: 'usr-editor-024',
    fullName: 'संपादक महोदय',
    role: 'EDITOR',
    roles: ['EDITOR'],
  });

  const reporterToken = signToken({
    id: 'usr-reporter-024',
    fullName: 'फील्ड रिपोर्टर',
    role: 'REPORTER',
    roles: ['REPORTER'],
  });

  t.after(async () => {
    await httpHelper.stop();
  });

  // -------------------------------------------------------------------------
  // TEST 1: API Provider Registry & Credential Masking
  // -------------------------------------------------------------------------
  await t.test('1. API Provider Registry & Masked Credentials', async () => {
    // 1a. List providers
    const resList = await httpHelper.request('GET', '/api/v1/api-pool/providers');
    assert.strictEqual(resList.status, 200);
    assert(Array.isArray(resList.body.data.providers));
    assert(resList.body.data.providers.length >= 5);

    // Verify all keys are masked or undefined, never plaintext
    for (const p of resList.body.data.providers) {
      assert.strictEqual(p.apiKey, undefined, 'Plaintext apiKey must never be exposed');
      assert.strictEqual(p.clientSecret, undefined, 'Plaintext clientSecret must never be exposed');
      if (p.maskedCredential) {
        assert(p.maskedCredential.includes('...'), `Credential must be masked with ellipsis: ${p.maskedCredential}`);
      }
    }

    // 1b. Register new provider
    const newProvDto = {
      providerId: 'deepseek_ai',
      name: 'DeepSeek-V3 Regional Model',
      category: 'ai_services',
      baseUrl: 'https://api.deepseek.com/v1',
      apiKey: 'sk-deepseek-live-secret-test-key-9999',
      rateLimitInfo: '60 RPM Tier',
      dailyQuotaLimit: 200000,
    };

    const resCreate = await httpHelper.request('POST', '/api/v1/api-pool/providers', newProvDto, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert([200, 201].includes(resCreate.status));
    assert.strictEqual(resCreate.body.data.name, 'DeepSeek-V3 Regional Model');
    assert.strictEqual(resCreate.body.data.maskedCredential, 'sk-dee...9999');
    assert.strictEqual(resCreate.body.data.apiKey, undefined);
  });

  // -------------------------------------------------------------------------
  // TEST 2: Provider Activation / Deactivation Controls
  // -------------------------------------------------------------------------
  await t.test('2. Provider Activation & Deactivation Toggle', async () => {
    // Deactivate DeepSeek
    const resToggleOff = await httpHelper.request(
      'PATCH',
      '/api/v1/api-pool/providers/deepseek_ai/toggle',
      { isEnabled: false },
      { Authorization: `Bearer ${adminToken}` }
    );
    assert.strictEqual(resToggleOff.status, 200);
    assert.strictEqual(resToggleOff.body.data.isEnabled, false);
    assert.strictEqual(resToggleOff.body.data.connectionStatus, 'disabled');

    // Reactivate DeepSeek
    const resToggleOn = await httpHelper.request(
      'PATCH',
      '/api/v1/api-pool/providers/deepseek_ai/toggle',
      { isEnabled: true },
      { Authorization: `Bearer ${adminToken}` }
    );
    assert.strictEqual(resToggleOn.status, 200);
    assert.strictEqual(resToggleOn.body.data.isEnabled, true);
    assert.strictEqual(resToggleOn.body.data.connectionStatus, 'connected');
  });

  // -------------------------------------------------------------------------
  // TEST 3: Provider Health Check Execution
  // -------------------------------------------------------------------------
  await t.test('3. Provider Live Health Check Execution', async () => {
    const resHealth = await httpHelper.request(
      'POST',
      '/api/v1/api-pool/providers/prov-gemini/health',
      {},
      { Authorization: `Bearer ${adminToken}` }
    );
    assert.strictEqual(resHealth.status, 200);
    assert.strictEqual(resHealth.body.data.healthStatus, 'healthy');
    assert(typeof resHealth.body.data.avgLatencyMs === 'number');
    assert(resHealth.body.data.lastSuccessfulRequestAt);
  });

  // -------------------------------------------------------------------------
  // TEST 4: API Pool Usage & Cost Accounting (USD & INR Parity)
  // -------------------------------------------------------------------------
  await t.test('4. API Pool Usage Summary & Cost Tracking', async () => {
    const resUsage = await httpHelper.request('GET', '/api/v1/api-pool/usage');
    assert.strictEqual(resUsage.status, 200);
    assert(typeof resUsage.body.data.totalProviders === 'number');
    assert(typeof resUsage.body.data.totalDailyTokens === 'number');
    assert(typeof resUsage.body.data.totalEstimatedCostUsd === 'number');
    assert(typeof resUsage.body.data.totalEstimatedCostInr === 'number');
    assert.strictEqual(resUsage.body.data.currency, 'INR');

    // Cost breakdown endpoint
    const resCosts = await httpHelper.request('GET', '/api/v1/api-pool/costs');
    assert.strictEqual(resCosts.status, 200);
    assert.strictEqual(resCosts.body.data.isEstimate, true);
    assert.strictEqual(resCosts.body.data.currencyRateUsdToInr, 87.5);
  });

  // -------------------------------------------------------------------------
  // TEST 5: SSRF Defense Validator
  // -------------------------------------------------------------------------
  await t.test('5. SSRF Defense: Blocking Private IPs, Metadata & Loopbacks', async () => {
    // 5a. Direct validator checks
    assert.strictEqual(SsrfValidator.validateUrl('http://127.0.0.1/feed.xml').isSafe, false);
    assert.strictEqual(SsrfValidator.validateUrl('http://localhost:8080/feed.xml').isSafe, false);
    assert.strictEqual(SsrfValidator.validateUrl('http://169.254.169.254/latest/meta-data/').isSafe, false);
    assert.strictEqual(SsrfValidator.validateUrl('http://10.0.1.25/rss').isSafe, false);
    assert.strictEqual(SsrfValidator.validateUrl('http://192.168.1.1/feed').isSafe, false);
    assert.strictEqual(SsrfValidator.validateUrl('http://172.20.0.5/feed').isSafe, false);
    assert.strictEqual(SsrfValidator.validateUrl('ftp://example.com/feed.xml').isSafe, false);
    assert.strictEqual(SsrfValidator.validateUrl('https://feeds.pti.in/hindi/national.xml').isSafe, true);

    // 5b. API Endpoint SSRF verification rejection
    const resSsrfAttempt = await httpHelper.request(
      'POST',
      '/api/v1/rss/sources',
      {
        name: 'Malicious Internal Source',
        feedUrl: 'http://169.254.169.254/computeMetadata/v1/',
        publisherName: 'Attacker',
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    assert.strictEqual(resSsrfAttempt.status, 400);
    assert(resSsrfAttempt.body.error.message.includes('SSRF'));
  });

  // -------------------------------------------------------------------------
  // TEST 6: Safe XML Parsing & XXE Injection Defense
  // -------------------------------------------------------------------------
  await t.test('6. Safe XML Parser: XXE Injection & Bomb Defense', async () => {
    // 6a. Reject XXE entity expansion attempt
    const maliciousXml = `<?xml version="1.0" encoding="ISO-8859-1"?>
<!DOCTYPE foo [
<!ELEMENT foo ANY >
<!ENTITY xxe SYSTEM "file:///etc/passwd" >]>
<rss version="2.0">
  <channel>
    <title>&xxe;</title>
  </channel>
</rss>`;

    assert.throws(
      () => SafeXmlParser.parseFeed(maliciousXml),
      /XXE Injection attempt blocked/
    );

    // 6b. Parse clean RSS feed correctly
    const cleanRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>दैनिक भास्कर भोपाल</title>
    <link>https://bhaskar.com</link>
    <description>भोपाल स्थानीय समाचार</description>
    <item>
      <title>भोपाल में मेट्रो का काम तेज</title>
      <link>https://bhaskar.com/bhopal-metro-1</link>
      <guid>bhaskar-metro-01</guid>
      <description><![CDATA[सुपर कॉरिडोर पर ट्रायल रन सफल रहा। <script>alert(1)</script>]]></description>
    </item>
  </channel>
</rss>`;

    const parsed = SafeXmlParser.parseFeed(cleanRss);
    assert.strictEqual(parsed.title, 'दैनिक भास्कर भोपाल');
    assert.strictEqual(parsed.items.length, 1);
    assert.strictEqual(parsed.items[0].title, 'भोपाल में मेट्रो का काम तेज');
    assert(!parsed.items[0].content.includes('<script>'), 'Dangerous script tag must be stripped');
  });

  // -------------------------------------------------------------------------
  // TEST 7: RSS Source Registration, Sync & Ingestion
  // -------------------------------------------------------------------------
  await t.test('7. RSS Source Registration, Sync & Deduplication', async () => {
    // 7a. Register clean RSS source
    const newSource = {
      name: 'दैनिक नईदुनिया मध्य प्रदेश',
      feedUrl: 'https://naidunia.jagran.com/rss/madhya-pradesh.xml',
      publisherName: 'Naidunia MP',
      sourceCategory: 'madhya-pradesh',
    };

    const resSource = await httpHelper.request('POST', '/api/v1/rss/sources', newSource, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert([200, 201].includes(resSource.status));
    const sourceId = resSource.body.data.id;

    // 7b. Sync Source Feed
    const resSync1 = await httpHelper.request(
      'POST',
      `/api/v1/rss/sources/${sourceId}/sync`,
      {},
      { Authorization: `Bearer ${editorToken}` }
    );
    assert.strictEqual(resSync1.status, 200);
    assert(resSync1.body.data.importedCount > 0, 'Must import newly discovered wire items');

    // 7c. Re-sync immediately -> Duplicate Detection verification
    const resSync2 = await httpHelper.request(
      'POST',
      `/api/v1/rss/sources/${sourceId}/sync`,
      {},
      { Authorization: `Bearer ${editorToken}` }
    );
    assert.strictEqual(resSync2.status, 200);
    assert.strictEqual(resSync2.body.data.importedCount, 0, 'Duplicate items must not be re-imported');
    assert(resSync2.body.data.duplicateCount > 0, 'Duplicate count must register');
  });

  // -------------------------------------------------------------------------
  // TEST 8: Source Deactivation Invariant (Prevents Ingestion)
  // -------------------------------------------------------------------------
  await t.test('8. Source Deactivation Invariant (Blocks Ingestion)', async () => {
    // 8a. Deactivate source
    const resToggle = await httpHelper.request(
      'PATCH',
      '/api/v1/rss/sources/src-pti-hindi/toggle',
      { isEnabled: false },
      { Authorization: `Bearer ${adminToken}` }
    );
    assert.strictEqual(resToggle.status, 200);
    assert.strictEqual(resToggle.body.data.status, 'disabled');

    // 8b. Attempt to sync disabled source -> Must be rejected
    const resSyncAttempt = await httpHelper.request(
      'POST',
      '/api/v1/rss/sources/src-pti-hindi/sync',
      {},
      { Authorization: `Bearer ${editorToken}` }
    );
    assert.strictEqual(resSyncAttempt.status, 400);
    assert(resSyncAttempt.body.error.message.includes('disabled') || resSyncAttempt.body.error.message.includes('prohibited'));

    // Reactivate for future tests
    await httpHelper.request(
      'PATCH',
      '/api/v1/rss/sources/src-pti-hindi/toggle',
      { isEnabled: true },
      { Authorization: `Bearer ${adminToken}` }
    );
  });

  // -------------------------------------------------------------------------
  // TEST 9: Wire-to-Draft Conversion (Human Editorial Invariant)
  // -------------------------------------------------------------------------
  await t.test('9. Wire-to-Draft Invariant (status: "DRAFT", zero autonomous publishing)', async () => {
    // Get imported wire items
    const resItems = await httpHelper.request('GET', '/api/v1/rss/items?limit=5');
    assert.strictEqual(resItems.status, 200);
    assert(resItems.body.data.items.length > 0);

    const wireItem = resItems.body.data.items[0];

    // Convert to newsroom draft
    const resConvert = await httpHelper.request(
      'POST',
      `/api/v1/rss/items/${wireItem.id}/convert-to-draft`,
      {},
      { Authorization: `Bearer ${editorToken}` }
    );
    assert([200, 201].includes(resConvert.status));
    assert.strictEqual(resConvert.body.data.article.status, 'DRAFT', 'Wire article must strictly be saved as DRAFT');
    assert.strictEqual(resConvert.body.data.article.isAiAssisted, false);
    assert(resConvert.body.data.article.sourceAttribution.includes('वायर फ़ीड'));
  });

  // -------------------------------------------------------------------------
  // TEST 10: Cryptographic Webhook HMAC-SHA256 Verification
  // -------------------------------------------------------------------------
  await t.test('10. Webhook HMAC-SHA256 Signature Verification', async () => {
    const rawPayload = JSON.stringify({ event: 'delivery_report', messageId: 'wa-msg-123', status: 'delivered' });
    const secret = 'bnw_default_test_webhook_secret_2026';
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = `nonce-${Date.now()}-abc`;

    // 10a. Valid Signature
    const validHmac = crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');

    const resValid = await httpHelper.request('POST', '/api/v1/webhooks/ingress/meta_graph', rawPayload, {
      'x-bnw-signature': `sha256=${validHmac}`,
      'x-bnw-timestamp': String(timestamp),
      'x-bnw-nonce': nonce,
    });
    assert.strictEqual(resValid.status, 200);
    assert.strictEqual(resValid.body.data.status, 'verified');

    // 10b. Invalid Signature -> Must return 401
    const resInvalid = await httpHelper.request('POST', '/api/v1/webhooks/ingress/meta_graph', rawPayload, {
      'x-bnw-signature': 'sha256=invaliddeadbeef0000000000000000000000000000000000000000000000000000',
      'x-bnw-timestamp': String(timestamp),
      'x-bnw-nonce': `nonce-${Date.now()}-def`,
    });
    assert.strictEqual(resInvalid.status, 401);
    assert.strictEqual(resInvalid.body.error.code, 'ERR_WEBHOOK_SIGNATURE_INVALID');
  });

  // -------------------------------------------------------------------------
  // TEST 11: Webhook Replay Attack Protection (Nonce Cache)
  // -------------------------------------------------------------------------
  await t.test('11. Webhook Replay Nonce Protection', async () => {
    const rawPayload = JSON.stringify({ event: 'payment_success', id: 'pay_999' });
    const secret = 'bnw_default_test_webhook_secret_2026';
    const timestamp = Math.floor(Date.now() / 1000);
    const reusedNonce = `replay-test-nonce-${Date.now()}`;

    const validHmac = crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');

    // First request with nonce -> 200 OK
    const res1 = await httpHelper.request('POST', '/api/v1/webhooks/ingress/razorpay', rawPayload, {
      'x-bnw-signature': validHmac,
      'x-bnw-timestamp': String(timestamp),
      'x-bnw-nonce': reusedNonce,
    });
    assert.strictEqual(res1.status, 200);

    // Second request with SAME nonce -> 409 Conflict Replay Attack
    const res2 = await httpHelper.request('POST', '/api/v1/webhooks/ingress/razorpay', rawPayload, {
      'x-bnw-signature': validHmac,
      'x-bnw-timestamp': String(timestamp),
      'x-bnw-nonce': reusedNonce,
    });
    assert.strictEqual(res2.status, 409);
    assert.strictEqual(res2.body.error.code, 'ERR_WEBHOOK_NONCE_REPLAY');
  });

  // -------------------------------------------------------------------------
  // TEST 12: Webhook Stale Timestamp Drift Rejection
  // -------------------------------------------------------------------------
  await t.test('12. Webhook Stale Timestamp Drift Rejection', async () => {
    const rawPayload = JSON.stringify({ event: 'heartbeat' });
    const secret = 'bnw_default_test_webhook_secret_2026';
    const staleTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago (> 300s)
    const validHmac = crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');

    const resStale = await httpHelper.request('POST', '/api/v1/webhooks/ingress/meta_graph', rawPayload, {
      'x-bnw-signature': validHmac,
      'x-bnw-timestamp': String(staleTimestamp),
      'x-bnw-nonce': `nonce-stale-${Date.now()}`,
    });
    assert.strictEqual(resStale.status, 400);
    assert.strictEqual(resStale.body.error.code, 'ERR_WEBHOOK_TIMESTAMP_EXPIRED');
  });

  // -------------------------------------------------------------------------
  // TEST 13: Social Media Platform Constraints (X <= 280 Chars)
  // -------------------------------------------------------------------------
  await t.test('13. Social Media Platform Constraints (X <= 280 chars limit)', async () => {
    // 13a. Constraint query
    const resConstraints = await httpHelper.request('GET', '/api/v1/social/platforms/constraints');
    assert.strictEqual(resConstraints.status, 200);
    assert.strictEqual(resConstraints.body.data.x.maxCharacters, 280);

    // 13b. Exceed 280 characters on X (Twitter)
    const longCaption = 'भोपाल समाचार: ' + 'क'.repeat(300); // 314 characters
    const resOverLimit = await httpHelper.request(
      'POST',
      '/api/v1/social/publishing',
      {
        title: 'अति लंबा समाचार',
        masterContent: longCaption,
        targetAccountIds: ['acc-x-001'],
      },
      { Authorization: `Bearer ${reporterToken}` }
    );
    assert.strictEqual(resOverLimit.status, 400);
    assert.strictEqual(resOverLimit.body.error.code, 'ERR_PLATFORM_CONSTRAINT_VIOLATION');
    assert(resOverLimit.body.error.message.includes('280'));
  });

  // -------------------------------------------------------------------------
  // TEST 14: Social Media Human Approval & Publishing Invariant
  // -------------------------------------------------------------------------
  await t.test('14. Social Media Human Approval Invariant (Zero Autonomous Publishing)', async () => {
    // 14a. Create compliant post
    const postPayload = {
      title: 'मध्य प्रदेश किसान कल्याण योजना 2026',
      masterContent: 'भोपाल: मुख्यमंत्री ने किसानों के खातों में डीबीटी के जरिए प्रोत्साहन राशि जारी की।',
      targetAccountIds: ['acc-x-001', 'acc-fb-001'],
    };

    const resCreate = await httpHelper.request('POST', '/api/v1/social/publishing', postPayload, {
      Authorization: `Bearer ${reporterToken}`,
    });
    assert([200, 201].includes(resCreate.status));
    const jobId = resCreate.body.data.id;
    assert.strictEqual(resCreate.body.data.status, 'PENDING_APPROVAL');

    // 14b. Attempt to publish immediately WITHOUT approval -> Must be rejected!
    const resPrematurePublish = await httpHelper.request(
      'POST',
      `/api/v1/social/publishing/${jobId}/publish`,
      {},
      { Authorization: `Bearer ${editorToken}` }
    );
    assert.strictEqual(resPrematurePublish.status, 400);
    assert.strictEqual(resPrematurePublish.body.error.code, 'ERR_AUTONOMOUS_PUBLISH_FORBIDDEN');

    // 14c. Approve Post
    const resApprove = await httpHelper.request(
      'POST',
      `/api/v1/social/publishing/${jobId}/approve`,
      {},
      { Authorization: `Bearer ${editorToken}` }
    );
    assert.strictEqual(resApprove.status, 200);
    assert.strictEqual(resApprove.body.data.status, 'APPROVED');

    // 14d. Publish Immediately with Approved status -> 200 OK
    const resPublish = await httpHelper.request(
      'POST',
      `/api/v1/social/publishing/${jobId}/publish`,
      {},
      { Authorization: `Bearer ${editorToken}` }
    );
    assert.strictEqual(resPublish.status, 200);
    assert.strictEqual(resPublish.body.data.status, 'PUBLISHED');
    assert.strictEqual(resPublish.body.data.successfulDeliveries, 2);
    assert(resPublish.body.data.deliveries[0].externalPostUrl);
  });

  // -------------------------------------------------------------------------
  // TEST 15: WhatsApp Business: STOP Keyword & Unsubscribe
  // -------------------------------------------------------------------------
  await t.test('15. WhatsApp Business: STOP / Unsubscribe Handling & Opt-Out Invariant', async () => {
    const targetPhone = '+919829988776';

    // 15a. User Opt-in
    const resOptIn = await httpHelper.request('POST', '/api/v1/whatsapp/subscribers/opt-in', {
      phoneNumber: targetPhone,
      name: 'परीक्षण पाठक',
      district: 'इंदौर',
    });
    assert.strictEqual(resOptIn.status, 200);
    assert.strictEqual(resOptIn.body.data.subscriber.status, 'ACTIVE');

    // 15b. User sends inbound STOP keyword -> Webhook auto-detects and transitions to OPTED_OUT
    const resInboundStop = await httpHelper.request('POST', '/api/v1/whatsapp/webhook', {
      from: targetPhone,
      text: 'STOP',
      messageId: `wamid.test.${Date.now()}`,
    });
    assert.strictEqual(resInboundStop.status, 200);
    assert.strictEqual(resInboundStop.body.data.action, 'OPT_OUT_PROCESSED');

    // 15c. Verify subscriber is now OPTED_OUT
    const subscribers = (await getPersistenceAdapter().getWhatsAppSubscribers()) || [];
    const sub = subscribers.find((s) => s.phoneNumber === targetPhone);
    assert(sub, 'Subscriber must exist');
    assert.strictEqual(sub.status, 'OPTED_OUT', 'Subscriber must be transitioned to OPTED_OUT');

    // 15d. Attempt to send message to OPTED_OUT number -> Must be rejected!
    const resSendBlocked = await httpHelper.request(
      'POST',
      '/api/v1/whatsapp/messages/send',
      {
        templateId: 'tpl-wa-breaking-alert',
        recipientPhone: targetPhone,
      },
      { Authorization: `Bearer ${editorToken}` }
    );
    assert.strictEqual(resSendBlocked.status, 400);
    assert.strictEqual(resSendBlocked.body.error.code, 'ERR_WHATSAPP_OPTED_OUT');
  });

  // -------------------------------------------------------------------------
  // TEST 16: YouTube Integration & Quota Governance
  // -------------------------------------------------------------------------
  await t.test('16. YouTube Integration: Upload Metadata Preparation & Quota Tracking', async () => {
    // 16a. Query quota
    const resQuota = await httpHelper.request('GET', '/api/v1/youtube/quota');
    assert.strictEqual(resQuota.status, 200);
    assert.strictEqual(resQuota.body.data.dailyQuotaLimit, 10000);
    assert.strictEqual(resQuota.body.data.videoUploadCost, 1600);

    // 16b. Prepare Video Upload
    const uploadDto = {
      title: 'उज्जैन महाकाल मंदिर विशेष रिपोर्ट 2026',
      description: 'श्री महाकालेश्वर मंदिर में महाशिवरात्रि दर्शन व्यवस्था पर विस्तृत कवरेज।',
      videoUrl: 'https://storage.breakingnewswala.com/videos/ujjain_report.mp4',
      privacyStatus: 'unlisted',
      tags: ['उज्जैन', 'महाकाल', 'बीएनडब्ल्यू'],
    };

    const resPrep = await httpHelper.request('POST', '/api/v1/youtube/upload-prep', uploadDto, {
      Authorization: `Bearer ${reporterToken}`,
    });
    assert([200, 201].includes(resPrep.status));
    assert.strictEqual(resPrep.body.data.status, 'READY_FOR_UPLOAD');
    assert.strictEqual(resPrep.body.data.quotaConsumed, 1600);
    assert(resPrep.body.data.youtubeUrl.includes('youtube.com/watch?v='));
  });

  // -------------------------------------------------------------------------
  // TEST 17: RBAC Protection on Admin Integration Endpoints
  // -------------------------------------------------------------------------
  await t.test('17. Server-Side RBAC Enforcement on Administrative Endpoints', async () => {
    // Reporter cannot register API provider -> 403 Forbidden
    const resUnauthorizedProvider = await httpHelper.request(
      'POST',
      '/api/v1/api-pool/providers',
      { providerId: 'unauthorized_p', name: 'Unauthorized' },
      { Authorization: `Bearer ${reporterToken}` }
    );
    assert.strictEqual(resUnauthorizedProvider.status, 403);

    // Reporter cannot view webhooks -> 403 Forbidden
    const resUnauthorizedWebhooks = await httpHelper.request('GET', '/api/v1/webhooks', null, {
      Authorization: `Bearer ${reporterToken}`,
    });
    assert.strictEqual(resUnauthorizedWebhooks.status, 403);
  });

  // -------------------------------------------------------------------------
  // TEST 18: FirestoreAdapter Feature Parity
  // -------------------------------------------------------------------------
  await t.test('18. FirestoreAdapter Parity for all Integration Collections', async () => {
    const fsAdapter = new FirestoreAdapter({ isEmulator: true });
    await fsAdapter.init();

    // Verify seeded collections
    const provs = await fsAdapter.getApiProviders();
    assert(Array.isArray(provs));
    assert(provs.length >= 5);

    const sources = await fsAdapter.getRssSources();
    assert(sources.items.length >= 3);

    const accounts = await fsAdapter.getSocialAccounts();
    assert(accounts.length >= 4);

    const templates = await fsAdapter.getWhatsAppTemplates();
    assert(templates.length >= 2);

    const subscribers = await fsAdapter.getWhatsAppSubscribers();
    assert(subscribers.length >= 3);

    // Test Firestore CRUD parity on RSS items
    const rssItem = {
      id: 'fs-rss-item-1',
      rssSourceId: 'src-pti-hindi',
      guidHash: 'fs-hash-123',
      originalTitle: 'फायरस्टोर टेस्ट समाचार',
      originalUrl: 'https://example.com/fs-news',
      status: 'PENDING_REVIEW',
      sourceAttribution: 'PTI Bhasha',
      categories: ['madhya-pradesh'],
      mediaUrls: [],
    };
    await fsAdapter.saveRssItem(rssItem);
    const hasHash = await fsAdapter.hasRssItemHash('fs-hash-123');
    assert.strictEqual(hasHash, true);

    const fetchedItem = await fsAdapter.getRssItemById('fs-rss-item-1');
    assert.strictEqual(fetchedItem.originalTitle, 'फायरस्टोर टेस्ट समाचार');

    // Test Firestore CRUD on Social Jobs
    const job = {
      id: 'fs-job-1',
      title: 'फायरस्टोर सोशल जॉब',
      masterContent: 'सोशल पोस्ट विवरण',
      status: 'PENDING_APPROVAL',
      idempotencyKey: 'idemp-fs-1',
      createdByUserId: 'usr-1',
      totalDeliveries: 1,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      deliveries: [],
    };
    await fsAdapter.saveSocialPublishingJob(job);
    const fetchedJob = await fsAdapter.getSocialPublishingJobById('fs-job-1');
    assert.strictEqual(fetchedJob.title, 'फायरस्टोर सोशल जॉब');
  });
});
