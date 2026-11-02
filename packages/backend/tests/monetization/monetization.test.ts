/**
 * BREAKING NEWS WALA — Business & Monetization Subsystem Test Suite
 * Task ID: BNW-MASTER-007
 * Grounded in docs/Monetization.md, docs/06-Business-Rules.md (RULE-AD-001 to RULE-AD-005, RULE-REWARD-002),
 * and docs/DECISIONS.md (DEC-007, DEC-048, DEC-060, DEC-068, DEC-069, DEC-070).
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import {
  InMemoryMonetizationRepository,
  MonetizationService,
  AdDeliveryEngine,
  MockPaymentAdapter,
  RazorpayAdapter,
  BILLING_CONSTANTS,
  AD_PLACEMENT_SLOTS,
  GOVERNANCE_INVARIANTS,
} from '../../src/modules/monetization';

describe('BNW-MASTER-007: Business & Monetization Subsystem', () => {
  let repository: InMemoryMonetizationRepository;
  let mockGateway: MockPaymentAdapter;
  let service: MonetizationService;
  let deliveryEngine: AdDeliveryEngine;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    repository = new InMemoryMonetizationRepository();
    mockGateway = new MockPaymentAdapter();
    service = new MonetizationService(repository, mockGateway);
    deliveryEngine = new AdDeliveryEngine();
  });

  // ============================================================================
  // 1. Advertiser Management & Agency Registry
  // ============================================================================
  describe('1. Advertiser Management & Agency Registry', () => {
    it('should list pre-seeded regional advertisers', async () => {
      const advertisers = await service.getAdvertisers();
      assert.ok(advertisers.length >= 2);
      const mpTourism = advertisers.find((a) => a.id === 'adv-mp-tourism-001');
      assert.ok(mpTourism);
      assert.equal(mpTourism.verificationStatus, 'verified');
      assert.equal(mpTourism.accountStatus, 'active');
    });

    it('should register a new advertiser and default to pending verification', async () => {
      const created = await service.createAdvertiser({
        organizationName: 'ग्वालियर दुग्ध संघ मर्यादित',
        contactPerson: 'महेश तोमर',
        email: 'info@gwalior-dairy.coop',
        phone: '+91 751 2456789',
        billingAddress: 'औद्योगिक क्षेत्र, बानमोर, ग्वालियर, म.प्र. - 474001',
        gstin: '23AABCG1234D1Z8',
        category: 'cooperative_dairy',
      });

      assert.ok(created.id);
      assert.equal(created.accountStatus, 'pending_verification');
      assert.equal(created.verificationStatus, 'unverified');
      assert.equal(created.agreementStatus, 'pending');

      const retrieved = await service.getAdvertiser(created.id);
      assert.equal(retrieved.organizationName, 'ग्वालियर दुग्ध संघ मर्यादित');
    });

    it('should reject advertiser registration if required fields are missing', async () => {
      await assert.rejects(
        async () => {
          await service.createAdvertiser({
            organizationName: '',
            contactPerson: 'राजेश',
            email: '',
            phone: '',
            billingAddress: 'भोपाल',
            category: 'retail',
          });
        },
        /Organization name, email and phone are mandatory/
      );
    });

    it('should verify an advertiser and transition status to active', async () => {
      const adv = await service.createAdvertiser({
        organizationName: 'उज्जैन हस्तशिल्प निगम',
        contactPerson: 'राकेश जैन',
        email: 'sales@ujjain-crafts.org',
        phone: '+91 734 2511223',
        billingAddress: 'महाकाल मार्ग, उज्जैन, मध्य प्रदेश',
        category: 'handicrafts',
      });

      const verified = await service.verifyAdvertiser(adv.id);
      assert.equal(verified.verificationStatus, 'verified');
      assert.equal(verified.accountStatus, 'active');
    });

    it('should suspend an advertiser and pause active campaigns', async () => {
      const suspended = await service.suspendAdvertiser('adv-mp-tourism-001', 'Tax compliance review');
      assert.equal(suspended.accountStatus, 'suspended');

      // Verify associated campaigns were paused
      const campaigns = await service.getCampaigns({ advertiserId: 'adv-mp-tourism-001' });
      for (const camp of campaigns) {
        assert.equal(camp.status, 'PAUSED');
      }
    });
  });

  // ============================================================================
  // 2. Campaign Lifecycle & Editorial Approval State Machine
  // ============================================================================
  describe('2. Campaign Management & Editorial Approval State Machine', () => {
    it('should create a campaign in DRAFT state', async () => {
      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

      const campaign = await service.createCampaign({
        advertiserId: 'adv-indore-swachh-002',
        campaignName: 'स्वच्छ इंदौर सर्वेक्षण 2026 जन-जागरूकता',
        description: 'डिजिटल बैनर एवं सिटीजन एंगेजमेंट अभियान',
        objective: 'AWARENESS',
        startDate: now.toISOString(),
        endDate: nextMonth.toISOString(),
        targetDistricts: ['Indore', 'Dewas', 'Ujjain'],
        targetCategories: ['स्वच्छता', 'मध्य प्रदेश'],
        selectedPlacements: ['header_leaderboard', 'homepage_infeed'],
        totalBudgetMinorUnits: 10000000, // ₹1,00,000
        pricingModel: 'CPM',
      });

      assert.ok(campaign.id);
      assert.equal(campaign.status, 'DRAFT');
      assert.equal(campaign.spentBudgetMinorUnits, 0);
    });

    it('should reject campaign creation if endDate is before startDate or budget <= 0', async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 100000);

      await assert.rejects(
        async () => {
          await service.createCampaign({
            advertiserId: 'adv-indore-swachh-002',
            campaignName: 'गलत तिथि अभियान',
            objective: 'AWARENESS',
            startDate: now.toISOString(),
            endDate: past.toISOString(),
            targetDistricts: [],
            targetCategories: [],
            selectedPlacements: ['homepage_infeed'],
            totalBudgetMinorUnits: 500000,
            pricingModel: 'CPM',
          });
        },
        /Campaign end date must be strictly after start date/
      );

      await assert.rejects(
        async () => {
          await service.createCampaign({
            advertiserId: 'adv-indore-swachh-002',
            campaignName: 'शून्य बजट अभियान',
            objective: 'AWARENESS',
            startDate: now.toISOString(),
            endDate: new Date(now.getTime() + 100000).toISOString(),
            targetDistricts: [],
            targetCategories: [],
            selectedPlacements: ['homepage_infeed'],
            totalBudgetMinorUnits: 0,
            pricingModel: 'CPM',
          });
        },
        /Total budget must be a positive integer in paise/
      );
    });

    it('should require at least one creative before submitting campaign for approval', async () => {
      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

      const campaign = await service.createCampaign({
        advertiserId: 'adv-indore-swachh-002',
        campaignName: 'बिना क्रिएटिव अभियान',
        objective: 'AWARENESS',
        startDate: now.toISOString(),
        endDate: nextMonth.toISOString(),
        targetDistricts: ['Indore'],
        targetCategories: ['स्वच्छता'],
        selectedPlacements: ['header_leaderboard'],
        totalBudgetMinorUnits: 5000000,
        pricingModel: 'CPM',
      });

      await assert.rejects(
        async () => {
          await service.submitCampaignForApproval(campaign.id);
        },
        /Campaign must have at least one creative before submission for approval/
      );
    });

    it('should approve campaign and transition to ACTIVE if startDate <= now', async () => {
      // camp-heart-of-india-001 has creatives
      const approved = await service.approveCampaign(
        'camp-heart-of-india-001',
        'usr-admin-bhopal-01',
        'संपादकीय एवं नीतिगत मानकों के अनुरूप स्वीकृत'
      );

      assert.equal(approved.status, 'ACTIVE');
      assert.ok(approved.approvedAt);
      assert.equal(approved.approvedByUserId, 'usr-admin-bhopal-01');
    });

    it('should reject a campaign with documented reasons', async () => {
      const rejected = await service.rejectCampaign(
        'camp-heart-of-india-001',
        'usr-admin-bhopal-01',
        'अपूर्ण दस्तावेज़ एवं अपर्याप्त बजट विवरण'
      );

      assert.equal(rejected.status, 'REJECTED');
      assert.ok(rejected.approvalNotes?.includes('अपूर्ण दस्तावेज़'));
    });

    it('should pause and resume an active campaign', async () => {
      const paused = await service.pauseCampaign('camp-heart-of-india-001');
      assert.equal(paused.status, 'PAUSED');

      const resumed = await service.resumeCampaign('camp-heart-of-india-001');
      assert.equal(resumed.status, 'ACTIVE');
    });
  });

  // ============================================================================
  // 3. Creative Review Desk, ASCI Labeling & Prohibited Category Filters (RULE-AD-003)
  // ============================================================================
  describe('3. Creative Review Desk & Prohibited Categories (RULE-AD-003)', () => {
    it('should create valid image creative with ASCI disclosure compliant content', async () => {
      const creative = await service.createCreative({
        campaignId: 'camp-heart-of-india-001',
        adSlotCode: 'header_leaderboard',
        creativeType: 'IMAGE',
        creativeMediaUrl: '/media/ads/bhopal_lake_728x90.webp',
        destinationUrl: 'https://mptourism.gov.in/bhopal',
        headlineHi: 'बड़ा तालाब भोपाल में क्रूज राइड का आनंद लें',
        bodyTextHi: 'मध्य प्रदेश पर्यटन विकास निगम द्वारा संचालित सुरम्य बोटिंग अनुभव।',
        width: 728,
        height: 90,
      });

      assert.ok(creative.id);
      assert.equal(creative.isApproved, false); // requires desk approval
      assert.equal(creative.version, 1);
    });

    it('should reject creative containing gambling/betting content under RULE-AD-003', async () => {
      await assert.rejects(
        async () => {
          await service.createCreative({
            campaignId: 'camp-heart-of-india-001',
            adSlotCode: 'homepage_infeed',
            creativeType: 'IMAGE',
            destinationUrl: 'https://betting-online.test/play',
            headlineHi: 'ऑनलाइन सट्टा खेलकर रोज़ाना 50,000 रुपये जीतें',
            bodyTextHi: 'बेस्ट कसीनो एवं पोकर ऐप डाउनलोड करें।',
          });
        },
        /POLICY_VIOLATION_RULE_AD_003.*betting_gambling/
      );
    });

    it('should reject creative containing predatory loan triggers under RULE-AD-003', async () => {
      await assert.rejects(
        async () => {
          await service.createCreative({
            campaignId: 'camp-heart-of-india-001',
            adSlotCode: 'article_body_mpu',
            creativeType: 'IMAGE',
            destinationUrl: 'https://instant-loans.test/app',
            headlineHi: 'बिना दस्तावेज लोन 5 मिनट में सीधे बैंक खाते में',
            bodyTextHi: 'तुरंत 1 लाख का instant loan पाएं बिना सिबिल स्कोर के।',
          });
        },
        /POLICY_VIOLATION_RULE_AD_003.*payday_loans/
      );
    });

    it('should reject creative containing miracle cure claims under RULE-AD-003', async () => {
      await assert.rejects(
        async () => {
          await service.createCreative({
            campaignId: 'camp-heart-of-india-001',
            adSlotCode: 'article_body_mpu',
            creativeType: 'IMAGE',
            destinationUrl: 'https://magic-ayurveda.test/cure',
            headlineHi: 'जादुई इलाज — सभी असाध्य रोगों का 100% गारंटी इलाज',
            bodyTextHi: 'चमत्कारी जड़ी-बूटी से 3 दिन में संपूर्ण स्वास्थ्य लाभ।',
          });
        },
        /POLICY_VIOLATION_RULE_AD_003.*miracle_cures/
      );
    });

    it('should reject creative containing firearms or weapons under RULE-AD-003', async () => {
      await assert.rejects(
        async () => {
          await service.createCreative({
            campaignId: 'camp-heart-of-india-001',
            adSlotCode: 'homepage_infeed',
            creativeType: 'IMAGE',
            destinationUrl: 'https://arms-dealer.test/guns',
            headlineHi: 'Buy gun online without license in MP',
            bodyTextHi: 'पिस्तौल और कारतूस की होम डिलीवरी।',
          });
        },
        /POLICY_VIOLATION_RULE_AD_003.*firearms_weapons/
      );
    });

    it('should approve a creative on editorial desk review', async () => {
      const cr = await service.createCreative({
        campaignId: 'camp-heart-of-india-001',
        adSlotCode: 'sidebar_sticky',
        creativeType: 'IMAGE',
        destinationUrl: 'https://mptourism.gov.in/mandun',
        headlineHi: 'मांडू — महलों और प्रेम की अमर गाथा',
        bodyTextHi: 'जहाज महल और रानी रूपमती मंडप का ऐतिहासिक सौंदर्य देखें।',
        width: 300,
        height: 600,
      });

      const approved = await service.approveCreative(cr.id, 'usr-desk-editor-01');
      assert.equal(approved.isApproved, true);
    });

    it('should reject a creative with documented policy notes', async () => {
      const cr = await service.createCreative({
        campaignId: 'camp-heart-of-india-001',
        adSlotCode: 'homepage_infeed',
        creativeType: 'IMAGE',
        destinationUrl: 'https://mptourism.gov.in',
        headlineHi: 'अस्पष्ट शीर्षक विवरण',
        bodyTextHi: 'विवरण',
      });

      const rejected = await service.rejectCreative(cr.id, 'छवि का रिज़ॉल्यूशन अत्यंत कम है और टेक्स्ट पठनीय नहीं है');
      assert.equal(rejected.isApproved, false);
      assert.ok(rejected.rejectionReason?.includes('रिज़ॉल्यूशन'));
    });
  });

  // ============================================================================
  // 4. Ad Delivery Engine, Viewable Impressions & Anti-Fraud
  // ============================================================================
  describe('4. Ad Delivery Engine & Anti-Fraud Viewability (MRC Standards)', () => {
    it('should serve an active ad for header_leaderboard slot with permanent ASCI disclosure label', async () => {
      const result = await service.serveAdForSlot('header_leaderboard', {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      });

      assert.equal(result.served, true);
      assert.equal(result.adSlotCode, 'header_leaderboard');
      assert.ok(result.creative);
      assert.equal(result.creative.asciLabel, 'विज्ञापन'); // Mandatory Hindi ASCI label
      assert.equal(result.creative.advertiserName, 'मध्य प्रदेश पर्यटन विकास निगम (MP Tourism)');
      assert.ok(result.creative.destinationUrl);
    });

    it('should detect and filter automated search crawlers and bot user-agents', () => {
      assert.equal(deliveryEngine.isBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'), true);
      assert.equal(deliveryEngine.isBot('curl/7.68.0'), true);
      assert.equal(deliveryEngine.isBot('python-requests/2.25.1'), true);
      assert.equal(deliveryEngine.isBot('PostmanRuntime/7.26.8'), true);
      assert.equal(deliveryEngine.isBot('Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 Chrome/80.0.3987.162 Mobile Safari/537.36'), false);
    });

    it('should validate MRC viewable impression criteria (>= 50% in viewport for >= 1000ms)', async () => {
      // Valid viewable impression
      const valid = await service.recordImpression({
        creativeId: 'cr-pachmarhi-header-001',
        adSlotCode: 'header_leaderboard',
        viewDurationMs: 1200, // > 1000ms
        viewPercentage: 65,   // > 50%
        ipAddress: '103.21.124.5',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      });
      assert.equal(valid.verified, true);

      // Invalid: insufficient view percentage
      const lowView = await service.recordImpression({
        creativeId: 'cr-pachmarhi-header-001',
        adSlotCode: 'header_leaderboard',
        viewDurationMs: 2000,
        viewPercentage: 30, // < 50%
        ipAddress: '103.21.124.5',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      });
      assert.equal(lowView.verified, false);
      assert.ok(lowView.reason?.includes('Insufficient viewport visibility'));

      // Invalid: insufficient duration
      const shortView = await service.recordImpression({
        creativeId: 'cr-pachmarhi-header-001',
        adSlotCode: 'header_leaderboard',
        viewDurationMs: 400, // < 1000ms
        viewPercentage: 80,
        ipAddress: '103.21.124.5',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      });
      assert.equal(shortView.verified, false);
      assert.ok(shortView.reason?.includes('Insufficient view duration'));

      // Invalid: bot user-agent
      const botView = await service.recordImpression({
        creativeId: 'cr-pachmarhi-header-001',
        adSlotCode: 'header_leaderboard',
        viewDurationMs: 3000,
        viewPercentage: 100,
        ipAddress: '66.249.66.1',
        userAgent: 'Googlebot/2.1',
      });
      assert.equal(botView.verified, false);
      assert.ok(botView.reason?.includes('Bot/Crawler detected'));
    });

    it('should cap click velocity at 5 clicks per 60s per IP to prevent click fraud', async () => {
      const ip = '182.73.120.45';
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

      // First 5 clicks should be permitted
      for (let i = 1; i <= 5; i++) {
        const clickResult = await service.recordClick({
          creativeId: 'cr-pachmarhi-header-001',
          adSlotCode: 'header_leaderboard',
          ipAddress: ip,
          userAgent,
        });
        assert.equal(clickResult.verified, true, `Click ${i} should be permitted`);
      }

      // 6th click within same minute should be rejected
      const fraudClick = await service.recordClick({
        creativeId: 'cr-pachmarhi-header-001',
        adSlotCode: 'header_leaderboard',
        ipAddress: ip,
        userAgent,
      });
      assert.equal(fraudClick.verified, false);
      assert.ok(fraudClick.reason?.includes('Click velocity cap exceeded'));
    });
  });

  // ============================================================================
  // 5. Subscription Architecture & Entitlements Engine (DEC-070 DEFERRED)
  // ============================================================================
  describe('5. Subscription Architecture & Entitlements Engine (DEC-070 DEFERRED)', () => {
    it('should list subscription plans with clear DEFERRED notices for paid tiers', async () => {
      const plans = await service.getSubscriptionPlans();
      assert.equal(plans.length, 4);

      const freePlan = plans.find((p) => p.code === 'FREE');
      assert.ok(freePlan);
      assert.equal(freePlan.isCommercialActive, true);
      assert.equal(freePlan.priceMinorUnits, 0);

      const adFreePlan = plans.find((p) => p.code === 'AD_FREE_SUPPORTER');
      assert.ok(adFreePlan);
      assert.equal(adFreePlan.isCommercialActive, false);
      assert.ok(adFreePlan.deferralReason?.includes('DEC-070'));

      const patronPlan = plans.find((p) => p.code === 'PATRON_SUPPORTER');
      assert.ok(patronPlan);
      assert.equal(patronPlan.isCommercialActive, false);
      assert.ok(patronPlan.deferralReason?.includes('DEC-070'));
    });

    it('should block paid subscription checkout with ERR_SUBSCRIPTION_DEFERRED under DEC-070', async () => {
      await assert.rejects(
        async () => {
          await service.initiateSubscriptionCheckout('usr-reader-001', 'AD_FREE_SUPPORTER');
        },
        /ERR_SUBSCRIPTION_DEFERRED.*DEC-070.*Paid reader subscriptions are deferred/
      );
    });

    it('should suppress ad serving when user has active ad_free entitlement', async () => {
      const userId = 'usr-supporter-101';

      // 1. Before entitlement: ad is served
      const adBefore = await service.serveAdForSlot('header_leaderboard', {
        userId,
        userAgent: 'Mozilla/5.0 Chrome/120.0',
      });
      assert.equal(adBefore.served, true);

      // 2. Grant ad-free entitlement (via coin perk redemption)
      await service.grantPerkEntitlement(userId, 'AD_FREE_PASS_1D', 24);

      // 3. After entitlement: ad serving is cleanly suppressed
      const adAfter = await service.serveAdForSlot('header_leaderboard', {
        userId,
        userAgent: 'Mozilla/5.0 Chrome/120.0',
      });
      assert.equal(adAfter.served, false);
      assert.equal(adAfter.reason, 'Ad-free entitlement active for user');
    });
  });

  // ============================================================================
  // 6. Non-Monetary Coin Ledger & Perk Redemption (DEC-007)
  // ============================================================================
  describe('6. Non-Monetary Coin Ledger Invariants (DEC-007)', () => {
    it('should grant temporary digital reading perks through non-monetary redemptions', async () => {
      const userId = 'usr-coin-holder-202';
      const entitlement = await service.grantPerkEntitlement(userId, 'EPAPER_ARCHIVE_PASS', 720); // 30 days

      assert.equal(entitlement.userId, userId);
      assert.equal(entitlement.entitlementCode, 'epaper_archive');
      assert.equal(entitlement.source, 'coin_perk');
      assert.equal(entitlement.isActive, true);

      const hasArchive = await service.hasEntitlement(userId, 'epaper_archive');
      assert.equal(hasArchive, true);
    });

    it('should strictly affirm DEC-007 non-monetary invariant (zero cash value, no withdrawal)', () => {
      assert.ok(GOVERNANCE_INVARIANTS.DEC_007.notice.includes('ZERO monetary cash equivalence'));
      assert.ok(GOVERNANCE_INVARIANTS.DEC_007.notice.includes('cannot be withdrawn'));
    });
  });

  // ============================================================================
  // 7. Referral Attribution & Mandatory Governance Gate (RULE-REWARD-002)
  // ============================================================================
  describe('7. Referral Attribution & Mandatory Governance Gate (RULE-REWARD-002)', () => {
    it('should track referral attribution but keep rewards pending governance approval under RULE-REWARD-002', async () => {
      const result = await service.trackReferral({
        referrerCode: 'BNW-887766',
        referredUserId: 'usr-new-citizen-99',
      });

      assert.ok(result.attribution.id);
      assert.equal(result.attribution.referrerCode, 'BNW-887766');
      assert.equal(result.attribution.referredUserId, 'usr-new-citizen-99');
      // Crucial: status must be pending_governance_approval, NOT issued!
      assert.equal(result.attribution.rewardStatus, 'pending_governance_approval');
      assert.ok(result.governanceNotice.includes('RULE-REWARD-002'));
      assert.ok(result.governanceNotice.includes('Automatic issuance of coin rewards is disabled'));
    });

    it('should reject referral tracking if referral code lacks BNW- prefix', async () => {
      await assert.rejects(
        async () => {
          await service.trackReferral({
            referrerCode: 'INVALID-CODE',
            referredUserId: 'usr-new-citizen-100',
          });
        },
        /Invalid referral code format. Must start with "BNW-"/
      );
    });
  });

  // ============================================================================
  // 8. Billing, Invoicing & 18% GST (SAC 998363)
  // ============================================================================
  describe('8. Billing, Invoicing & 18% GST (SAC 998363)', () => {
    it('should calculate 9% CGST + 9% SGST (18% Total) for intrastate MP transactions in integer paise', () => {
      const subtotalPaise = 10000000; // ₹1,00,000.00
      const tax = service.calculateGst(subtotalPaise, true);

      assert.equal(tax.subtotalMinorUnits, 10000000);
      assert.equal(tax.cgstMinorUnits, 900000); // ₹9,000.00
      assert.equal(tax.sgstMinorUnits, 900000); // ₹9,000.00
      assert.equal(tax.igstMinorUnits, 0);
      assert.equal(tax.totalMinorUnits, 11800000); // ₹1,18,000.00
      assert.equal(tax.isIntrastateMP, true);
    });

    it('should calculate 18% IGST for interstate transactions in integer paise', () => {
      const subtotalPaise = 5000000; // ₹50,000.00
      const tax = service.calculateGst(subtotalPaise, false);

      assert.equal(tax.subtotalMinorUnits, 5000000);
      assert.equal(tax.cgstMinorUnits, 0);
      assert.equal(tax.sgstMinorUnits, 0);
      assert.equal(tax.igstMinorUnits, 900000); // ₹9,000.00 (18%)
      assert.equal(tax.totalMinorUnits, 5900000); // ₹59,000.00
      assert.equal(tax.isIntrastateMP, false);
    });

    it('should generate an itemized tax invoice with SAC code 998363 and due date', async () => {
      const invoice = await service.createInvoice({
        advertiserId: 'adv-mp-tourism-001',
        lineItems: [
          {
            description: 'शीर्ष हेडर लीडरबोर्ड विज्ञापन स्लॉट (फरवरी 2026)',
            quantity: 1,
            unitPriceMinorUnits: 4500000, // ₹45,000
            sacCode: BILLING_CONSTANTS.SAC_CODE,
          },
          {
            description: 'होमपेज इन-फ़ीड स्पॉन्डर्ड कार्ड (फरवरी 2026)',
            quantity: 2,
            unitPriceMinorUnits: 1500000, // ₹15,000 x 2 = ₹30,000
            sacCode: BILLING_CONSTANTS.SAC_CODE,
          },
        ],
        dueDays: 30,
      });

      assert.ok(invoice.id);
      assert.ok(invoice.invoiceNumber.startsWith('BNW-INV-'));
      assert.equal(invoice.subtotalMinorUnits, 7500000); // ₹75,000.00
      assert.equal(invoice.cgstMinorUnits, 675000);      // ₹6,750.00 (9%)
      assert.equal(invoice.sgstMinorUnits, 675000);      // ₹6,750.00 (9%)
      assert.equal(invoice.totalAmountMinorUnits, 8850000); // ₹88,500.00
      assert.equal(invoice.status, 'ISSUED');
      assert.equal(invoice.lineItems[0].sacCode, '998363');
    });
  });

  // ============================================================================
  // 9. Payment Gateway & Webhook Signature Verification (DEC-068)
  // ============================================================================
  describe('9. Payment Gateway Integration & Webhook Security (DEC-068)', () => {
    it('should create a payment order with provider order ID and integer paise', async () => {
      const { order, checkoutPayload } = await service.createPaymentOrder({
        advertiserId: 'adv-mp-tourism-001',
        amountMinorUnits: 8850000, // ₹88,500
        idempotencyKey: 'idemp-test-order-001',
      });

      assert.ok(order.id);
      assert.ok(order.providerOrderId);
      assert.equal(order.amountMinorUnits, 8850000);
      assert.equal(order.status, 'created');
      assert.ok(checkoutPayload);
    });

    it('should verify and parse webhook event with valid HMAC-SHA256 signature', async () => {
      const { order } = await service.createPaymentOrder({
        advertiserId: 'adv-mp-tourism-001',
        amountMinorUnits: 5000000,
        idempotencyKey: 'idemp-test-order-002',
      });

      const webhookPayload = JSON.stringify({
        event: 'payment.captured',
        orderId: order.providerOrderId,
        paymentId: 'pay_rzp_mock_998877',
        amount: 5000000,
      });

      const validSignature = mockGateway.generateMockSignature(webhookPayload);
      const result = await service.processPaymentWebhook(webhookPayload, validSignature);

      assert.equal(result.success, true);
      assert.equal(result.event, 'payment.captured');

      // Check order status updated to paid
      const updatedOrder = await repository.getPaymentOrderById(order.id);
      assert.equal(updatedOrder?.status, 'paid');
      assert.equal(updatedOrder?.providerPaymentId, 'pay_rzp_mock_998877');
    });

    it('should reject webhook with invalid signature', async () => {
      const webhookPayload = JSON.stringify({
        event: 'payment.captured',
        orderId: 'order_fake_123',
      });

      const invalidSignature = 'bad_forged_signature_hex';
      const result = await service.processPaymentWebhook(webhookPayload, invalidSignature);

      assert.equal(result.success, false);
      assert.ok(result.error?.includes('signature'));
    });
  });

  // ============================================================================
  // 10. Architectural Governance & Invariants
  // ============================================================================
  describe('10. Architectural Governance & Invariant Preservation', () => {
    it('DEC-048: confirms ROLE_CHIEF_EDITOR status is Pending Approval and blocked', () => {
      assert.equal(GOVERNANCE_INVARIANTS.DEC_048.status, 'Pending Approval');
      assert.equal(GOVERNANCE_INVARIANTS.DEC_048.errorCode, 'ERR_ROLE_PENDING_APPROVAL');
    });

    it('DEC-060: confirms Brand Logo SHA-256 hash match and statutory compliance', () => {
      assert.equal(
        GOVERNANCE_INVARIANTS.DEC_060.brandLogoSha256,
        '88407B32CCF924B10CCD6C9E17DF367D36C174AE7DEF441A26D8E5FDC035209F'
      );
      assert.ok(
        GOVERNANCE_INVARIANTS.DEC_060.statuteCompliance.includes('State Emblem of India')
      );
    });

    it('DEC-069: confirms direct stringer click revenue sharing is rejected', () => {
      assert.equal(GOVERNANCE_INVARIANTS.DEC_069.status, 'Rejected');
      assert.ok(GOVERNANCE_INVARIANTS.DEC_069.notice.includes('strictly rejected'));
    });

    it('should report verified revenue analytics excluding non-cash coins or mock figures', async () => {
      const stats = await service.getDashboardStats();
      assert.ok(stats.activeCampaignsCount >= 1);
      assert.ok(stats.totalAdvertisersCount >= 2);
      assert.ok(stats.totalImpressionsServed > 0);
      assert.ok(stats.totalValidClicks > 0);
      assert.ok(stats.verifiedAdRevenuePaise > 0);
      assert.equal(stats.activeSubscribersCount, 0); // DEC-070 DEFERRED
    });
  });
});

