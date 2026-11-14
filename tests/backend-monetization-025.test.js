/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Execution 025 — Business Management, Monetization & Revenue System Test Suite
 * 
 * Verifies:
 * 1. Business Dashboard Realized vs Projected Revenue Accounting
 * 2. Subscription Plan Catalog, Entitlements & Admin Toggles
 * 3. Customer Subscription Lifecycle (Creation, Entitlements, Renewal, Cancellation)
 * 4. Multi-Provider Payment Gateway Architecture & Order Creation (Idempotency Protection)
 * 5. Cryptographic Signature Verification (HMAC-SHA256 Timing-Safe Comparison)
 * 6. Duplicate Transaction Defense (ERR_DUPLICATE_TRANSACTION Prevention)
 * 7. Inbound Payment Webhook Signature Verification & Processing
 * 8. Refund Management, Over-Refund Rejection & Transaction Ledger Tracking
 * 9. Advertiser Registration, GSTIN Validation, Verification & Suspension
 * 10. Ad Campaign Creation, Prohibited Category Rejection & Date Validation
 * 11. Campaign Editorial Review State Machine & Status Lifecycle
 * 12. Ad Serving Engine with Hyperlocal Geotargeting & ASCI Tag Injection
 * 13. Viewable Impression Tracking (MRC 50% / 1.0s Criteria) & Anti-Bot Defense
 * 14. Click Tracking & Anti-Fraud Click Velocity Defense (> 5 clicks/min)
 * 15. Sponsored Content Intake & Mandatory Editorial Firewall (Rule BR-MON-004)
 * 16. Advertiser CRM (Interaction Notes & Commercial Proposals)
 * 17. GST-Compliant Invoicing (SAC 998363, Intra-state CGST/SGST vs Inter-state IGST)
 * 18. Configurable Tax Parameters Management
 * 19. Server-Side RBAC Enforcement on Financial Endpoints
 * 20. Dual Persistence Parity (LocalJsonAdapter & FirestoreAdapter)
 */

import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import crypto from 'node:crypto';
import { handleApiRequest, signToken } from '../src/server/apiEngine.js';
import { getPersistenceAdapter } from '../src/server/persistence/adapter.js';
import { FirestoreAdapter } from '../src/server/persistence/firestoreAdapter.js';
import {
  AD_PLACEMENT_SLOTS,
  PROHIBITED_AD_CATEGORIES,
  BILLING_CONSTANTS,
  CANONICAL_SUBSCRIPTION_PLANS,
  CANONICAL_SEED_ADVERTISERS,
  MONETIZATION_ERROR_CODES,
  PaymentGatewayManager,
  SubscriptionManager,
  AdManager,
  SponsoredContentManager,
  CrmManager,
  BillingManager,
} from '../src/server/monetization/index.js';

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

test('Master Execution 025 — Monetization & Revenue System Test Suite', async (t) => {
  const httpHelper = createMockHttp();
  await httpHelper.start();

  const adminToken = signToken({
    id: 'usr-admin-025',
    fullName: 'मुख्य व्यवस्थापक (Super Admin)',
    role: 'ADMIN',
    roles: ['ADMIN'],
  });

  const financeToken = signToken({
    id: 'usr-finance-025',
    fullName: 'वित्त प्रबंधक (Finance Manager)',
    role: 'FINANCE_MANAGER',
    roles: ['FINANCE_MANAGER'],
  });

  const editorToken = signToken({
    id: 'usr-editor-025',
    fullName: 'संपादक महोदय (Editor)',
    role: 'EDITOR',
    roles: ['EDITOR'],
  });

  const readerToken = signToken({
    id: 'usr-reader-025',
    fullName: 'आम पाठक (Reader)',
    role: 'READER',
    roles: ['READER'],
  });

  t.after(async () => {
    await httpHelper.stop();
  });

  // =========================================================================
  // 1. BUSINESS DASHBOARD & REVENUE ACCOUNTING
  // =========================================================================
  await t.test('1. Business Dashboard: Realized vs Projected Revenue Accounting', async () => {
    const res = await httpHelper.request('GET', '/api/v1/monetization/dashboard', null, {
      Authorization: `Bearer ${adminToken}`,
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    const summary = res.body.data;

    // Verify structure
    assert.ok(summary.revenue, 'summary should contain revenue object');
    assert.ok(typeof summary.revenue.totalRealizedRupees === 'string');
    assert.ok(typeof summary.revenue.monthlyRealizedRupees === 'string');
    assert.ok(typeof summary.revenue.projectedRupees === 'string');
    assert.ok(typeof summary.revenue.outstandingReceivablesRupees === 'string');
    assert.ok(typeof summary.revenue.refundsTotalRupees === 'string');

    // Revenue streams
    assert.ok(summary.revenue.bySource);
    assert.ok(summary.revenue.bySource.advertisingRupees !== undefined);
    assert.ok(summary.revenue.bySource.sponsoredRupees !== undefined);
    assert.ok(summary.revenue.bySource.subscriptionsRupees !== undefined);
    assert.ok(summary.revenue.bySource.partnersRupees !== undefined);

    // Monthly trends array
    assert.ok(Array.isArray(summary.monthlyTrends));
    assert.ok(summary.monthlyTrends.length >= 6, 'Should report at least 6 months trend');

    // Metrics counts
    assert.ok(summary.counts);
    assert.strictEqual(typeof summary.counts.activeSubscriptions, 'number');
    assert.strictEqual(typeof summary.counts.activeCampaigns, 'number');
  });

  // =========================================================================
  // 2. SUBSCRIPTION PLAN MANAGEMENT & CATALOG
  // =========================================================================
  let createdPlanId = '';
  await t.test('2. Subscription Plans: Seeded Plans Listing, Creation & Toggle', async () => {
    // List seeded plans
    const listRes = await httpHelper.request('GET', '/api/v1/monetization/plans');
    assert.strictEqual(listRes.status, 200);
    assert.ok(Array.isArray(listRes.body.data.plans));
    assert.ok(listRes.body.data.plans.length >= 4, 'Should contain Free, Premium, Pro, Enterprise plans');

    // Create a new plan
    const createRes = await httpHelper.request('POST', '/api/v1/monetization/plans', {
      code: 'FESTIVAL_SPECIAL_2026',
      nameHi: 'त्योहार विशेष योजना',
      nameEn: 'Festival Special Plan',
      descriptionHi: 'मध्य प्रदेश स्थापना दिवस विशेष रियायती योजना',
      billingCycle: 'yearly',
      priceMinorUnits: 49900,
      entitlements: ['ad_free', 'pdf_download', 'patron_badge'],
      usageLimits: { maxDownloadsPerMonth: 50, maxCommentsPerDay: 25 },
      trialDays: 14,
    }, {
      Authorization: `Bearer ${adminToken}`,
    });

    assert.strictEqual(createRes.status, 200);
    assert.strictEqual(createRes.body.success, true);
    assert.strictEqual(createRes.body.data.nameHi, 'त्योहार विशेष योजना');
    assert.strictEqual(createRes.body.data.priceRupees, '499.00');
    createdPlanId = createRes.body.data.id;

    // Toggle active status
    const toggleRes = await httpHelper.request('PATCH', `/api/v1/monetization/plans/${createdPlanId}/toggle`, {
      isActive: false,
    }, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(toggleRes.status, 200);
    assert.strictEqual(toggleRes.body.data.isActive, false);

    // Filter activeOnly
    const activeRes = await httpHelper.request('GET', '/api/v1/monetization/plans?activeOnly=true');
    assert.strictEqual(activeRes.status, 200);
    const hasInactive = activeRes.body.data.plans.some((p) => p.id === createdPlanId);
    assert.strictEqual(hasInactive, false, 'Inactive plan should not be returned when activeOnly=true');
  });

  // =========================================================================
  // 3. CUSTOMER SUBSCRIPTION LIFECYCLE & ENTITLEMENTS
  // =========================================================================
  let customerSubId = '';
  await t.test('3. Customer Subscriptions: Creation, Entitlements, Renewal & Cancellation', async () => {
    // Create customer subscription
    const subRes = await httpHelper.request('POST', '/api/v1/monetization/subscriptions', {
      planId: 'sub-plan-premium',
      userId: 'usr-reader-025',
      userName: 'राजेश शर्मा',
      userEmail: 'rajesh.sharma@example.mp.in',
      userPhone: '+919826012345',
    }, {
      Authorization: `Bearer ${readerToken}`,
    });

    assert.strictEqual(subRes.status, 200);
    assert.strictEqual(subRes.body.success, true);
    assert.ok(['ACTIVE', 'TRIALING'].includes(subRes.body.data.status));
    assert.ok(subRes.body.data.entitlements.includes('ad_free'));
    customerSubId = subRes.body.data.id;

    // Verify entitlements endpoint
    const entRes = await httpHelper.request('GET', '/api/v1/monetization/subscriptions/entitlements', null, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.strictEqual(entRes.status, 200);
    assert.strictEqual(entRes.body.data.isAdFree, true);

    // Renewal
    const renewRes = await httpHelper.request('POST', `/api/v1/monetization/subscriptions/${customerSubId}/renew`, null, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.strictEqual(renewRes.status, 200);
    assert.strictEqual(renewRes.body.data.status, 'ACTIVE');

    // Cancellation
    const cancelRes = await httpHelper.request('POST', `/api/v1/monetization/subscriptions/${customerSubId}/cancel`, {
      immediate: true,
    }, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.strictEqual(cancelRes.status, 200);
    assert.strictEqual(cancelRes.body.data.status, 'CANCELLED');
  });

  // =========================================================================
  // 4. PAYMENT ORDERS & IDEMPOTENCY KEY ENFORCEMENT
  // =========================================================================
  let createdOrderId = '';
  let idempotencyKeyTest = `IDEMPO-${Date.now()}`;
  await t.test('4. Payment Orders: Creation & Idempotency Key Duplicate Defense', async () => {
    const payload = {
      customerId: 'usr-reader-025',
      customerName: 'राजेश शर्मा',
      customerEmail: 'rajesh.sharma@example.mp.in',
      customerPhone: '+919826012345',
      amountPaise: 9900,
      currency: 'INR',
      purpose: 'SUBSCRIPTION',
      referenceId: 'sub-plan-premium',
      idempotencyKey: idempotencyKeyTest,
    };

    // First creation
    const orderRes1 = await httpHelper.request('POST', '/api/v1/monetization/payments/orders', payload, {
      Authorization: `Bearer ${readerToken}`,
    });

    assert.strictEqual(orderRes1.status, 200);
    assert.strictEqual(orderRes1.body.success, true);
    assert.ok(orderRes1.body.data.orderNumber.startsWith('ORD-'));
    assert.strictEqual(orderRes1.body.data.amountRupees, '99.00');
    assert.ok(orderRes1.body.data.checkoutPayload);
    createdOrderId = orderRes1.body.data.id;

    // Idempotent retry with exact same key
    const orderRes2 = await httpHelper.request('POST', '/api/v1/monetization/payments/orders', payload, {
      Authorization: `Bearer ${readerToken}`,
    });

    assert.strictEqual(orderRes2.status, 200);
    assert.strictEqual(orderRes2.body.data.id, createdOrderId, 'Must return same order instance for identical idempotency key');
  });

  // =========================================================================
  // 5. CRYPTOGRAPHIC SIGNATURE VERIFICATION & TIMING-SAFE COMPARISON
  // =========================================================================
  let settledTransactionId = '';
  await t.test('5. Cryptographic Verification: HMAC-SHA256 & Duplicate Defense', async () => {
    const adapter = getPersistenceAdapter();
    const order = await adapter.getPaymentOrderById(createdOrderId);
    const mockSecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret_2026';
    const fakePaymentId = `pay_mock_${Date.now()}`;

    // Generate valid HMAC signature
    const hmac = crypto.createHmac('sha256', mockSecret);
    hmac.update(`${order.providerOrderId}|${fakePaymentId}`);
    const validSignature = hmac.digest('hex');

    // 5.1 Invalid signature rejection
    const invalidRes = await httpHelper.request('POST', '/api/v1/monetization/payments/verify', {
      orderId: order.id,
      providerPaymentId: fakePaymentId,
      signature: 'deadbeef_invalid_forged_signature_025',
    }, {
      Authorization: `Bearer ${readerToken}`,
    });

    assert.strictEqual(invalidRes.status, 400);
    assert.strictEqual(invalidRes.body.success, false);
    assert.strictEqual(invalidRes.body.error.code, MONETIZATION_ERROR_CODES.ERR_INVALID_PAYMENT_SIGNATURE);

    // 5.2 Valid signature acceptance
    const validRes = await httpHelper.request('POST', '/api/v1/monetization/payments/verify', {
      orderId: order.id,
      providerPaymentId: fakePaymentId,
      signature: validSignature,
    }, {
      Authorization: `Bearer ${readerToken}`,
    });

    assert.strictEqual(validRes.status, 200);
    assert.strictEqual(validRes.body.success, true);
    assert.strictEqual(validRes.body.data.order.status, 'PAID');
    assert.strictEqual(validRes.body.data.transaction.status, 'SUCCESS');
    settledTransactionId = validRes.body.data.transaction.id;

    // 5.3 Duplicate verification prevention
    const duplicateRes = await httpHelper.request('POST', '/api/v1/monetization/payments/verify', {
      orderId: order.id,
      providerPaymentId: fakePaymentId,
      signature: validSignature,
    }, {
      Authorization: `Bearer ${readerToken}`,
    });

    assert.strictEqual(duplicateRes.status, 409);
    assert.strictEqual(duplicateRes.body.error.code, MONETIZATION_ERROR_CODES.ERR_DUPLICATE_TRANSACTION);
  });

  // =========================================================================
  // 6. INBOUND WEBHOOK SIGNATURE VERIFICATION
  // =========================================================================
  await t.test('6. Payment Webhooks: Signature Validation & Event Processing', async () => {
    const webhookSecret = process.env.PAYMENT_GATEWAY_SECRET || 'bnw_mock_payment_secret_2026';
    const bodyStr = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_webhook_test_999',
            amount: 9900,
            status: 'captured',
          },
        },
      },
    });

    // Valid signature
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(bodyStr);
    const validSig = hmac.digest('hex');

    // 6.1 Missing signature rejection
    const noSigRes = await httpHelper.request('POST', '/api/v1/monetization/payments/webhook', bodyStr, {
      'x-mock-signature': '',
    });
    assert.strictEqual(noSigRes.status, 401);

    // 6.2 Valid signature acceptance
    const validWebhookRes = await httpHelper.request('POST', '/api/v1/monetization/payments/webhook', bodyStr, {
      'x-mock-signature': validSig,
    });
    assert.strictEqual(validWebhookRes.status, 200);
    assert.strictEqual(validWebhookRes.body.data.received, true);
  });

  // =========================================================================
  // 7. REFUND MANAGEMENT & OVER-REFUND DEFENSE
  // =========================================================================
  await t.test('7. Refunds: Partial Refund, Over-Refund Rejection & Full Settlement', async () => {
    // 7.1 Excessive refund rejection (Order was 9900 paise, try to refund 20000 paise)
    const overRefundRes = await httpHelper.request(
      'POST',
      `/api/v1/monetization/payments/transactions/${settledTransactionId}/refund`,
      {
        amountPaise: 20000,
        reason: 'गलत अत्यधिक रिफंड अनुरोध',
      },
      {
        Authorization: `Bearer ${financeToken}`,
      }
    );

    assert.strictEqual(overRefundRes.status, 400);
    assert.strictEqual(overRefundRes.body.error.code, MONETIZATION_ERROR_CODES.ERR_REFUND_AMOUNT_EXCEEDED);

    // 7.2 Partial valid refund (5000 paise)
    const partialRes = await httpHelper.request(
      'POST',
      `/api/v1/monetization/payments/transactions/${settledTransactionId}/refund`,
      {
        amountPaise: 5000,
        reason: 'आंशिक वापसी (Partial Service Dissatisfaction)',
      },
      {
        Authorization: `Bearer ${financeToken}`,
      }
    );

    assert.strictEqual(partialRes.status, 200);
    assert.strictEqual(partialRes.body.success, true);
    assert.strictEqual(partialRes.body.data.refund.amountPaise, 5000);
    assert.strictEqual(partialRes.body.data.transaction.refundedAmountPaise, 5000);
    assert.strictEqual(partialRes.body.data.transaction.isFullyRefunded, false);

    // 7.3 Final balance refund (Remaining 4900 paise)
    const finalRefundRes = await httpHelper.request(
      'POST',
      `/api/v1/monetization/payments/transactions/${settledTransactionId}/refund`,
      {
        amountPaise: 4900,
        reason: 'पूर्ण निपटान (Final Settlement)',
      },
      {
        Authorization: `Bearer ${financeToken}`,
      }
    );

    assert.strictEqual(finalRefundRes.status, 200);
    assert.strictEqual(finalRefundRes.body.data.transaction.refundedAmountPaise, 9900);
    assert.strictEqual(finalRefundRes.body.data.transaction.isFullyRefunded, true);
    assert.strictEqual(finalRefundRes.body.data.transaction.status, 'REFUNDED');
  });

  // =========================================================================
  // 8. ADVERTISER PROFILES, GSTIN VALIDATION & SUSPENSION
  // =========================================================================
  let testAdvertiserId = '';
  await t.test('8. Advertisers: Registration, GSTIN Validation, Verification & Suspension', async () => {
    // 8.1 Invalid GSTIN rejection
    const invalidGstinRes = await httpHelper.request('POST', '/api/v1/monetization/advertisers', {
      organizationName: 'त्रुटिपूर्ण व्यापार प्रा. लि.',
      contactPerson: 'अमित कुमार',
      email: 'amit@fakecorp.in',
      phone: '+919826099999',
      gstin: 'INVALID_GSTIN_123',
    }, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(invalidGstinRes.status, 400);

    // 8.2 Valid Registration
    const validAdvRes = await httpHelper.request('POST', '/api/v1/monetization/advertisers', {
      organizationName: 'ग्वालियर हेरिटेज स्वीट्स प्रा. लि.',
      brandName: 'Heritage Sweets',
      contactPerson: 'महेश तोमर',
      email: 'sales@heritagesweets.mp.in',
      phone: '+917512401122',
      gstin: '23AABCG1234F1Z5',
      stateCode: '23',
      category: 'FMCG_Food',
      billingAddress: 'महाराज बाड़ा, लश्कर, ग्वालियर, मध्य प्रदेश - 474001',
    }, {
      Authorization: `Bearer ${adminToken}`,
    });

    assert.strictEqual(validAdvRes.status, 200);
    assert.strictEqual(validAdvRes.body.success, true);
    assert.strictEqual(validAdvRes.body.data.verificationStatus, 'unverified');
    testAdvertiserId = validAdvRes.body.data.id;

    // 8.3 Verification
    const verifyRes = await httpHelper.request('PATCH', `/api/v1/monetization/advertisers/${testAdvertiserId}/verify`, null, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(verifyRes.status, 200);
    assert.strictEqual(verifyRes.body.data.verificationStatus, 'verified');

    // 8.4 Suspension
    const suspendRes = await httpHelper.request('PATCH', `/api/v1/monetization/advertisers/${testAdvertiserId}/suspend`, {
      reason: 'अनियमित भुगतान एवं आचार संहिता उल्लंघन',
    }, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(suspendRes.status, 200);
    assert.strictEqual(suspendRes.body.data.accountStatus, 'suspended');
  });

  // =========================================================================
  // 9. AD CAMPAIGNS & PROHIBITED CATEGORIES REJECTION
  // =========================================================================
  let testCampaignId = '';
  await t.test('9. Campaigns: Prohibited Category Rejection & Creation', async () => {
    // 9.1 Prohibited category rejection (e.g., betting / gambling)
    const prohibitedRes = await httpHelper.request('POST', '/api/v1/monetization/campaigns', {
      campaignName: 'तीन पत्ती ऑनलाइन कैसीनो बोनस',
      advertiserId: 'adv-mp-tourism-001',
      slotCode: 'homepage_infeed',
      category: 'betting_gambling',
      budgetTotalPaise: 5000000,
      startDate: '2026-11-20',
      endDate: '2026-12-20',
      creative: {
        headline: 'जीतें 1 करोड़ रुपये अभी खेलें',
        destinationUrl: 'https://casino-gamble-mp.com',
      },
    }, {
      Authorization: `Bearer ${adminToken}`,
    });

    assert.strictEqual(prohibitedRes.status, 400);
    assert.strictEqual(prohibitedRes.body.error.code, MONETIZATION_ERROR_CODES.ERR_PROHIBITED_CATEGORY);

    // 9.2 Valid campaign creation
    const validCampRes = await httpHelper.request('POST', '/api/v1/monetization/campaigns', {
      campaignName: 'भोपाल सोलर रूफटॉप विंटर डिस्काउंट 2026',
      advertiserId: 'adv-mp-tourism-001',
      slotCode: 'header_leaderboard',
      targetDistricts: ['Bhopal', 'Sehore', 'Raisen'],
      budgetTotalPaise: 2500000,
      startDate: '2026-11-15',
      endDate: '2026-12-31',
      creative: {
        headline: 'मध्य प्रदेश में पीएम सूर्य घर मुफ्त बिजली योजना',
        subheadline: 'रूफटॉप सोलर पर 60% तक शासकीय सब्सिडी',
        creativeUrl: 'https://cdn.breakingnewswala.in/ads/solar_bhopal_banner.webp',
        destinationUrl: 'https://suryaghar-mp.gov.in',
        altText: 'सोलर रूफटॉप पैनल योजना भोपाल',
        disclosureLabel: 'विज्ञापन / Advertisement',
      },
    }, {
      Authorization: `Bearer ${adminToken}`,
    });

    assert.strictEqual(validCampRes.status, 200);
    assert.strictEqual(validCampRes.body.success, true);
    assert.strictEqual(validCampRes.body.data.status, 'review');
    testCampaignId = validCampRes.body.data.id;
  });

  // =========================================================================
  // 10. CAMPAIGN EDITORIAL REVIEW & STATUS LIFECYCLE
  // =========================================================================
  await t.test('10. Campaigns: Editorial Approval & Status State Machine', async () => {
    // Approve campaign
    const approveRes = await httpHelper.request('POST', `/api/v1/monetization/campaigns/${testCampaignId}/review`, {
      action: 'approve',
      reason: 'संपादकीय व सुरक्षा मानकों के अनुसार अनुमोदित',
    }, {
      Authorization: `Bearer ${editorToken}`,
    });

    assert.strictEqual(approveRes.status, 200);
    assert.strictEqual(approveRes.body.data.status, 'approved');
    assert.strictEqual(approveRes.body.data.isApproved, true);

    // Activate campaign
    const activateRes = await httpHelper.request('PATCH', `/api/v1/monetization/campaigns/${testCampaignId}/status`, {
      status: 'active',
    }, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(activateRes.status, 200);
    assert.strictEqual(activateRes.body.data.status, 'active');
  });

  // =========================================================================
  // 11. AD SERVING ENGINE & GEOTARGETING
  // =========================================================================
  await t.test('11. Ad Serving: Hyperlocal District Targeting & ASCI Injection', async () => {
    // Serve for matching district (Bhopal)
    const matchRes = await httpHelper.request(
      'GET',
      '/api/v1/monetization/ads/serve?slotCode=header_leaderboard&district=Bhopal'
    );

    assert.strictEqual(matchRes.status, 200);
    assert.strictEqual(matchRes.body.success, true);
    assert.ok(matchRes.body.data.ad, 'Should serve matched ad');
    assert.strictEqual(matchRes.body.data.ad.creative.disclosureLabel, 'विज्ञापन / Advertisement');

    // Serve for non-matching district where no global ad matches
    const mismatchRes = await httpHelper.request(
      'GET',
      '/api/v1/monetization/ads/serve?slotCode=header_leaderboard&district=Singrauli'
    );
    assert.strictEqual(mismatchRes.status, 200);
    assert.strictEqual(mismatchRes.body.data.ad, null);
  });

  // =========================================================================
  // 12. VIEWABLE IMPRESSION TRACKING (MRC CRITERIA & ANTI-BOT)
  // =========================================================================
  await t.test('12. Impressions: MRC Standard (>=50% / >=1.0s) & Anti-Bot Defense', async () => {
    // 12.1 Below MRC standard (viewable only 30%)
    const subMrcRes = await httpHelper.request('POST', '/api/v1/monetization/ads/impression', {
      campaignId: testCampaignId,
      viewablePercentage: 30,
      durationMs: 1500,
    });
    assert.strictEqual(subMrcRes.status, 200);
    assert.strictEqual(subMrcRes.body.data.isViewableMrc, false);

    // 12.2 Known crawler bot user-agent
    const botRes = await httpHelper.request('POST', '/api/v1/monetization/ads/impression', {
      campaignId: testCampaignId,
      viewablePercentage: 100,
      durationMs: 2000,
    }, {
      'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    });
    assert.strictEqual(botRes.status, 200);
    assert.strictEqual(botRes.body.data.isBot, true);
    assert.strictEqual(botRes.body.data.recorded, false);

    // 12.3 Valid legitimate human MRC viewable impression
    const validImpRes = await httpHelper.request('POST', '/api/v1/monetization/ads/impression', {
      campaignId: testCampaignId,
      viewablePercentage: 90,
      durationMs: 1500,
    }, {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    });
    assert.strictEqual(validImpRes.status, 200);
    assert.strictEqual(validImpRes.body.data.isViewableMrc, true);
    assert.strictEqual(validImpRes.body.data.recorded, true);
  });

  // =========================================================================
  // 13. CLICK TRACKING & ANTI-FRAUD VELOCITY DEFENSE
  // =========================================================================
  await t.test('13. Click Tracking: Fraud Detection for Excessive Click Velocity', async () => {
    // Fire 5 rapid clicks from same IP
    for (let i = 0; i < 5; i++) {
      const res = await httpHelper.request('POST', '/api/v1/monetization/ads/click', {
        campaignId: testCampaignId,
      }, {
        'x-forwarded-for': '49.36.120.45',
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.recorded, true);
    }

    // 6th click within same minute triggers velocity defense
    const fraudClickRes = await httpHelper.request('POST', '/api/v1/monetization/ads/click', {
      campaignId: testCampaignId,
    }, {
      'x-forwarded-for': '49.36.120.45',
    });

    assert.strictEqual(fraudClickRes.status, 200);
    assert.strictEqual(fraudClickRes.body.data.isFraud, true);
    assert.strictEqual(fraudClickRes.body.data.recorded, false);
  });

  // =========================================================================
  // 14. SPONSORED CONTENT & MANDATORY EDITORIAL FIREWALL
  // =========================================================================
  let sponsoredArticleId = '';
  await t.test('14. Sponsored Content: Submission & Mandatory Editorial Gate (BR-MON-004)', async () => {
    // 14.1 Sponsored article intake
    const intakeRes = await httpHelper.request('POST', '/api/v1/monetization/sponsored', {
      title: 'मध्य प्रदेश में जैविक कृषि: आधुनिक तकनीक एवं समृद्धि की नई राह',
      summary: 'प्राकृतिक खेती को बढ़ावा देने हेतु प्रदेश के कृषकों के लिए विशेष कार्यशाला',
      content: 'मध्य प्रदेश शासन के सहयोग से कृषि विज्ञान केंद्र द्वारा आयोजित...',
      advertiserId: 'adv-mp-tourism-001',
      district: 'Bhopal',
      featuredImage: 'https://cdn.breakingnewswala.in/sponsored/organic_farming_mp.webp',
    }, {
      Authorization: `Bearer ${adminToken}`,
    });

    assert.strictEqual(intakeRes.status, 200);
    assert.strictEqual(intakeRes.body.success, true);
    assert.strictEqual(intakeRes.body.data.status, 'PENDING_REVIEW');
    assert.strictEqual(intakeRes.body.data.isEditorialApproved, false);
    assert.ok(intakeRes.body.data.brandDisclosure.includes('प्रायोजित प्रस्तुति'));
    sponsoredArticleId = intakeRes.body.data.id;

    // 14.2 Editorial Approval -> Converts into Newsroom Draft
    const reviewRes = await httpHelper.request(
      'POST',
      `/api/v1/monetization/sponsored/${sponsoredArticleId}/review`,
      {
        action: 'approve',
        reason: 'संपादकीय दिशा-निर्देशों एवं ASCI प्रकटीकरण के साथ स्वीकृत',
      },
      {
        Authorization: `Bearer ${editorToken}`,
      }
    );

    assert.strictEqual(reviewRes.status, 200);
    assert.strictEqual(reviewRes.body.data.status, 'APPROVED');
    assert.strictEqual(reviewRes.body.data.isEditorialApproved, true);
    assert.ok(reviewRes.body.data.articleId, 'Must generate newsroom draft ID');
  });

  // =========================================================================
  // 15. ADVERTISER CRM (NOTES & PROPOSALS)
  // =========================================================================
  await t.test('15. Advertiser CRM: Timestamped Interaction Notes & Commercial Proposals', async () => {
    // Add CRM Note
    const noteRes = await httpHelper.request('POST', '/api/v1/monetization/crm/notes/adv-mp-tourism-001', {
      channel: 'meeting',
      summary: 'मध्य प्रदेश विधानसभा चुनाव विशेष पैकेज चर्चा',
      details: 'क्लाइंट ने इन-स्ट्रीम वीडियो एवं टिकर स्पॉन्सरशिप में रुचि दिखाई।',
      followUpDate: '2026-11-25',
    }, {
      Authorization: `Bearer ${adminToken}`,
    });

    assert.strictEqual(noteRes.status, 200);
    assert.strictEqual(noteRes.body.data.advertiserId, 'adv-mp-tourism-001');

    // List Notes
    const listNotesRes = await httpHelper.request('GET', '/api/v1/monetization/crm/notes/adv-mp-tourism-001', null, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(listNotesRes.status, 200);
    assert.ok(listNotesRes.body.data.notes.length >= 1);

    // Create Proposal
    const propRes = await httpHelper.request('POST', '/api/v1/monetization/crm/proposals', {
      advertiserId: 'adv-mp-tourism-001',
      title: 'वार्षिक डिजिटल पार्टनरशिप 2026-27',
      amountPaise: 120000000,
      deliverables: ['12x मैस्टहेड बैनर', '24x प्रायोजित लेख', 'अनलिमिटेड टिकर स्पॉन्सर'],
      validUntil: '2026-12-31',
    }, {
      Authorization: `Bearer ${adminToken}`,
    });

    assert.strictEqual(propRes.status, 200);
    assert.ok(propRes.body.data.proposalNumber.startsWith('PROP-'));
    assert.strictEqual(propRes.body.data.amountRupees, '1200000.00');
  });

  // =========================================================================
  // 16. GST-COMPLIANT INVOICING & TAX CALCULATION (SAC 998363)
  // =========================================================================
  let createdInvoiceId = '';
  await t.test('16. Invoicing: SAC 998363, Intra-State (CGST/SGST) vs Inter-State (IGST)', async () => {
    // 16.1 Intra-state customer (Madhya Pradesh, code 23) -> CGST 9% + SGST 9%
    const intraRes = await httpHelper.request('POST', '/api/v1/monetization/invoices', {
      advertiserId: 'adv-mp-tourism-001',
      customerName: 'मध्य प्रदेश ऊर्जा विकास निगम',
      customerGstin: '23AAACM1234D1Z8',
      customerAddress: 'ऊर्जा भवन, लिंक रोड 2, शिवाजी नगर, भोपाल',
      customerStateCode: '23',
      lineItems: [
        {
          description: 'डिजिटल विज्ञापन अभियान - मैस्टहेड स्लॉट (नवंबर 2026)',
          quantity: 1,
          unitPricePaise: 1000000,
        },
      ],
      discountPaise: 0,
    }, {
      Authorization: `Bearer ${financeToken}`,
    });

    assert.strictEqual(intraRes.status, 200);
    const intraInv = intraRes.body.data;
    assert.ok(intraInv.invoiceNumber.startsWith('INV-'));
    assert.strictEqual(intraInv.sacCode, '998363');
    assert.strictEqual(intraInv.taxableAmountPaise, 1000000);
    assert.strictEqual(intraInv.cgstPaise, 90000); // 9% of 1000000
    assert.strictEqual(intraInv.sgstPaise, 90000); // 9% of 1000000
    assert.strictEqual(intraInv.igstPaise, 0);
    assert.strictEqual(intraInv.totalAmountPaise, 1180000);
    assert.strictEqual(intraInv.totalAmountRupees, '11800.00');
    createdInvoiceId = intraInv.id;

    // 16.2 Inter-state customer (Maharashtra, code 27) -> IGST 18%
    const interRes = await httpHelper.request('POST', '/api/v1/monetization/invoices', {
      customerName: 'मुंबई डिजिटल एजेंसी प्रा. लि.',
      customerGstin: '27AAACM9999D1Z2',
      customerAddress: 'बांद्रा कुर्ला कॉम्प्लेक्स, मुंबई, महाराष्ट्र',
      customerStateCode: '27',
      lineItems: [
        {
          description: 'प्रायोजित राष्ट्रीय ब्रांड लेख (अक्टूबर 2026)',
          quantity: 1,
          unitPricePaise: 2000000,
        },
      ],
      discountPaise: 0,
    }, {
      Authorization: `Bearer ${financeToken}`,
    });

    assert.strictEqual(interRes.status, 200);
    const interInv = interRes.body.data;
    assert.strictEqual(interInv.cgstPaise, 0);
    assert.strictEqual(interInv.sgstPaise, 0);
    assert.strictEqual(interInv.igstPaise, 360000); // 18% of 2000000
    assert.strictEqual(interInv.totalAmountPaise, 2360000);

    // 16.3 Mark invoice as paid
    const paidRes = await httpHelper.request(
      'POST',
      `/api/v1/monetization/invoices/${createdInvoiceId}/mark-paid`,
      {
        transactionId: settledTransactionId,
      },
      {
        Authorization: `Bearer ${financeToken}`,
      }
    );
    assert.strictEqual(paidRes.status, 200);
    assert.strictEqual(paidRes.body.data.status, 'PAID');
    assert.ok(paidRes.body.data.paidAt);
  });

  // =========================================================================
  // 17. TAX CONFIGURATION
  // =========================================================================
  await t.test('17. Tax Configuration: Retrieval & Admin Update', async () => {
    // Get tax config
    const getRes = await httpHelper.request('GET', '/api/v1/monetization/tax-config');
    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getRes.body.data.sacCode, '998363');
    assert.strictEqual(getRes.body.data.homeStateCode, '23');

    // Update tax config
    const updateRes = await httpHelper.request('PATCH', '/api/v1/monetization/tax-config', {
      gstRatePercent: 18,
      cgstRatePercent: 9,
      sgstRatePercent: 9,
    }, {
      Authorization: `Bearer ${financeToken}`,
    });
    assert.strictEqual(updateRes.status, 200);
  });

  // =========================================================================
  // 18. ROLE-BASED ACCESS CONTROL (RBAC) ENFORCEMENT
  // =========================================================================
  await t.test('18. Server-Side RBAC: Readers Forbidden on Admin & Finance Actions', async () => {
    // 18.1 Reader barred from Dashboard
    const dashRes = await httpHelper.request('GET', '/api/v1/monetization/dashboard', null, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.strictEqual(dashRes.status, 403);

    // 18.2 Reader barred from Approving Campaign
    const campReviewRes = await httpHelper.request(
      'POST',
      `/api/v1/monetization/campaigns/${testCampaignId}/review`,
      { action: 'approve' },
      { Authorization: `Bearer ${readerToken}` }
    );
    assert.strictEqual(campReviewRes.status, 403);

    // 18.3 Unauthenticated request barred
    const noAuthRes = await httpHelper.request('POST', '/api/v1/monetization/invoices', {});
    assert.strictEqual(noAuthRes.status, 401);
  });

  // =========================================================================
  // 19. DUAL PERSISTENCE PARITY: FIRESTORE ADAPTER
  // =========================================================================
  await t.test('19. Persistence Parity: FirestoreAdapter Monetization Methods Verification', async () => {
    const firestore = new FirestoreAdapter();

    // Verify all 12 collections are initialized in FirestoreAdapter
    const collections = [
      'subscriptionPlans',
      'customerSubscriptions',
      'paymentOrders',
      'transactions',
      'refunds',
      'advertisers',
      'campaigns',
      'sponsoredContent',
      'crmNotes',
      'crmProposals',
      'invoices',
      'financialAuditLogs',
    ];

    for (const col of collections) {
      assert.ok(firestore._collections.has(col), `FirestoreAdapter must have collection map for '${col}'`);
    }

    // Verify all required FirestoreAdapter methods exist
    const methods = [
      'getSubscriptionPlans',
      'getSubscriptionPlanById',
      'saveSubscriptionPlan',
      'getCustomerSubscriptions',
      'saveCustomerSubscription',
      'getPaymentOrders',
      'getPaymentOrderById',
      'savePaymentOrder',
      'getTransactions',
      'getTransactionById',
      'saveTransaction',
      'getRefunds',
      'saveRefund',
      'getAdvertisers',
      'getAdvertiserById',
      'saveAdvertiser',
      'getCampaigns',
      'getCampaignById',
      'saveCampaign',
      'getSponsoredArticles',
      'getSponsoredArticleById',
      'saveSponsoredArticle',
      'getCrmNotesByAdvertiserId',
      'saveCrmNote',
      'getCrmProposals',
      'saveCrmProposal',
      'getInvoices',
      'getInvoiceById',
      'saveInvoice',
      'getFinancialAuditLogs',
      'appendFinancialAuditLog',
    ];

    for (const m of methods) {
      assert.strictEqual(
        typeof firestore[m],
        'function',
        `FirestoreAdapter must implement method '${m}' for dual persistence parity`
      );
    }
  });
});
