/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Advertisement Campaign Management, Delivery & Anti-Fraud Engine
 * Grounded in docs/Monetization.md (Sections 5 & 6) and docs/06-Business-Rules.md (RULE-AD-001 to RULE-AD-005)
 */

import crypto from 'node:crypto';
import {
  AD_PLACEMENT_SLOTS,
  PROHIBITED_AD_CATEGORIES,
  ASCI_DISCLOSURE_LABEL_HI,
  CANONICAL_SEED_ADVERTISERS,
  CANONICAL_SEED_CAMPAIGNS,
  MONETIZATION_ERROR_CODES,
} from './constants.js';

export class AdManager {
  constructor(adapter) {
    this.adapter = adapter;
    this.clickLog = new Map(); // ip:campaignId -> array of timestamps
    this.impressionLog = new Set(); // session:campaignId:minute
    this.init();
  }

  async init() {
    // Seed initial advertisers if empty
    const existingAdv = await this.adapter.getAdvertisers();
    if (!existingAdv || existingAdv.length === 0) {
      for (const adv of CANONICAL_SEED_ADVERTISERS) {
        await this.adapter.saveAdvertiser(adv);
      }
    }

    // Seed initial campaigns if empty
    const existingCmp = await this.adapter.getCampaigns();
    if (!existingCmp || existingCmp.length === 0) {
      for (const cmp of CANONICAL_SEED_CAMPAIGNS) {
        await this.adapter.saveCampaign(cmp);
      }
    }
  }

  // ==========================================================================
  // ADVERTISER PROFILES
  // ==========================================================================

  async getAdvertisers({ status, search } = {}) {
    let list = await this.adapter.getAdvertisers();
    if (status) {
      list = list.filter((a) => a.accountStatus === status);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) =>
        a.organizationName?.toLowerCase().includes(q) ||
        a.brandName?.toLowerCase().includes(q) ||
        a.contactPerson?.toLowerCase().includes(q) ||
        a.gstin?.toLowerCase().includes(q)
      );
    }
    return list;
  }

  async getAdvertiserById(advertiserId) {
    return this.adapter.getAdvertiserById(advertiserId);
  }

  async createAdvertiser(dto, user) {
    if (!dto.organizationName || !dto.email || !dto.phone) {
      throw new Error('Organization name, email and phone are mandatory');
    }

    if (dto.gstin) {
      const gstinClean = dto.gstin.toUpperCase().trim();
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(gstinClean)) {
        const err = new Error('अमान्य जीएसटी पहचान संख्या (Invalid 15-digit GSTIN format)');
        err.code = MONETIZATION_ERROR_CODES.INVALID_GSTIN || 'ERR_INVALID_GSTIN';
        err.statusCode = 400;
        throw err;
      }
    }

    const advertiser = {
      id: `adv-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      organizationName: dto.organizationName,
      brandName: dto.brandName || dto.organizationName,
      contactPerson: dto.contactPerson || '',
      email: dto.email,
      phone: dto.phone,
      billingAddress: dto.billingAddress || 'मध्य प्रदेश',
      gstin: dto.gstin ? dto.gstin.toUpperCase().trim() : '',
      pan: dto.pan ? dto.pan.toUpperCase().trim() : '',
      stateCode: dto.stateCode || '23',
      category: dto.category || 'general_business',
      accountStatus: 'pending_verification', // active, pending_verification, suspended, closed
      verificationStatus: 'unverified', // verified, unverified, rejected
      agreementStatus: 'pending', // signed, pending, expired
      creditLimitMinorUnits: dto.creditLimitMinorUnits ? Number(dto.creditLimitMinorUnits) : 0,
      lifetimeSpendMinorUnits: 0,
      notes: dto.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.adapter.saveAdvertiser(advertiser, user);

    this.adapter.addAuditLog(
      user?.fullName || 'स्टाफ',
      'AD_MANAGEMENT',
      'ADVERTISER_CREATED',
      `नया विज्ञापनदाता पंजीकृत: ${saved.organizationName} (${saved.email})`,
      null
    );

    return saved;
  }

  async verifyAdvertiser(advertiserId, user) {
    const adv = await this.getAdvertiserById(advertiserId);
    if (!adv) throw new Error('Advertiser not found');

    adv.verificationStatus = 'verified';
    adv.accountStatus = 'active';
    adv.updatedAt = new Date().toISOString();

    const saved = await this.adapter.saveAdvertiser(adv, user);

    this.adapter.addAuditLog(
      user?.fullName || 'एडमिन',
      'AD_MANAGEMENT',
      'ADVERTISER_VERIFIED',
      `विज्ञापनदाता सत्यापित एवं सक्रिय: ${adv.organizationName}`,
      null
    );

    return saved;
  }

  async suspendAdvertiser(advertiserId, reason, user) {
    const adv = await this.getAdvertiserById(advertiserId);
    if (!adv) throw new Error('Advertiser not found');

    adv.accountStatus = 'suspended';
    adv.suspensionReason = reason || 'प्रशासनिक आदेश द्वारा निलंबित';
    adv.updatedAt = new Date().toISOString();

    const saved = await this.adapter.saveAdvertiser(adv, user);

    // Pause all active campaigns of suspended advertiser
    const campaigns = await this.adapter.getCampaignsByAdvertiserId(advertiserId);
    for (const cmp of campaigns) {
      if (cmp.status === 'active' || cmp.status === 'scheduled') {
        cmp.status = 'paused';
        cmp.pausedReason = 'विज्ञापनदाता निलंबन';
        cmp.updatedAt = new Date().toISOString();
        await this.adapter.saveCampaign(cmp, user);
      }
    }

    this.adapter.addAuditLog(
      user?.fullName || 'एडमिन',
      'AD_MANAGEMENT',
      'ADVERTISER_SUSPENDED',
      `विज्ञापनदाता निलंबित: ${adv.organizationName} (${adv.suspensionReason})`,
      null
    );

    return saved;
  }

  // ==========================================================================
  // CAMPAIGN MANAGEMENT
  // ==========================================================================

  async getCampaigns({ status, advertiserId, slotCode } = {}) {
    let list = await this.adapter.getCampaigns();
    if (status) {
      list = list.filter((c) => c.status === status);
    }
    if (advertiserId) {
      list = list.filter((c) => c.advertiserId === advertiserId);
    }
    if (slotCode) {
      list = list.filter((c) => c.slotCode === slotCode);
    }
    return list;
  }

  async getCampaignById(campaignId) {
    return this.adapter.getCampaignById(campaignId);
  }

  async createCampaign(dto, user) {
    if (!dto.campaignName || !dto.advertiserId || !dto.slotCode || !dto.startDate || !dto.endDate) {
      throw new Error('campaignName, advertiserId, slotCode, startDate and endDate are mandatory');
    }

    const adv = await this.getAdvertiserById(dto.advertiserId);
    if (!adv) throw new Error('Advertiser not found');

    if (adv.accountStatus === 'suspended') {
      const err = new Error('Suspended advertiser cannot create campaigns');
      err.code = MONETIZATION_ERROR_CODES.ERR_ADVERTISER_NOT_ACTIVE;
      err.statusCode = 403;
      throw err;
    }

    // Verify slot
    const slot = AD_PLACEMENT_SLOTS.find((s) => s.code === dto.slotCode);
    if (!slot) {
      throw new Error(`Invalid slotCode "${dto.slotCode}". Must match catalog.`);
    }

    // Prohibited categories verification (RULE-AD-003)
    if (dto.category && PROHIBITED_AD_CATEGORIES.includes(dto.category)) {
      const err = new Error(`Campaign category "${dto.category}" is strictly prohibited under RULE-AD-003`);
      err.code = MONETIZATION_ERROR_CODES.ERR_PROHIBITED_CATEGORY;
      err.statusCode = 400;
      throw err;
    }

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      throw new Error('endDate must be strictly greater than startDate');
    }

    const budgetTotalPaise = Number(dto.budgetTotalPaise || dto.budgetTotal || 100000);

    const campaign = {
      id: `cmp-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      campaignName: dto.campaignName,
      advertiserId: adv.id,
      advertiserName: adv.organizationName,
      slotCode: dto.slotCode,
      pricingModel: dto.pricingModel || slot.pricingModel || 'CPM',
      budgetTotalPaise,
      budgetSpentPaise: 0,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      targetDistricts: dto.targetDistricts && dto.targetDistricts.length > 0 ? dto.targetDistricts : ['ALL'],
      status: 'review', // draft, review, approved, scheduled, active, paused, completed, rejected
      isApproved: false,
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      creative: {
        id: `crt-${Date.now()}`,
        headline: dto.creative?.headline || dto.campaignName,
        subheadline: dto.creative?.subheadline || '',
        creativeUrl: dto.creative?.creativeUrl || 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80',
        destinationUrl: dto.creative?.destinationUrl || 'https://breakingnewswala.com',
        altText: dto.creative?.altText || 'विज्ञापन',
        disclosureLabel: ASCI_DISCLOSURE_LABEL_HI,
      },
      metrics: {
        impressions: 0,
        viewableImpressions: 0,
        clicks: 0,
        ctr: 0.0,
        spendPaise: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.adapter.saveCampaign(campaign, user);

    this.adapter.addAuditLog(
      user?.fullName || 'स्टाफ',
      'AD_MANAGEMENT',
      'CAMPAIGN_CREATED',
      `नया विज्ञापन अभियान सृजित: "${saved.campaignName}" (${saved.slotCode}) [स्थिति: समीक्षा हेतु लंबित]`,
      null
    );

    return saved;
  }

  async reviewCampaign(campaignId, { action, reason }, user) {
    const cmp = await this.getCampaignById(campaignId);
    if (!cmp) throw new Error('Campaign not found');

    if (action === 'approve') {
      cmp.isApproved = true;
      cmp.approvedBy = user?.fullName || 'एडमिन';
      cmp.approvedAt = new Date().toISOString();
      cmp.status = 'approved';
      cmp.rejectionReason = null;
    } else if (action === 'reject') {
      cmp.isApproved = false;
      cmp.status = 'rejected';
      cmp.rejectionReason = reason || 'विज्ञापन नीति अथवा सामग्री विनिर्देशों के अनुरूप नहीं';
    } else {
      throw new Error('Action must be "approve" or "reject"');
    }

    cmp.updatedAt = new Date().toISOString();
    const saved = await this.adapter.saveCampaign(cmp, user);

    this.adapter.addAuditLog(
      user?.fullName || 'एडमिन',
      'AD_MANAGEMENT',
      action === 'approve' ? 'CAMPAIGN_APPROVED' : 'CAMPAIGN_REJECTED',
      `अभियान समीक्षा: "${cmp.campaignName}" -> ${cmp.status}`,
      null
    );

    return saved;
  }

  async updateCampaignStatus(campaignId, status, user) {
    const cmp = await this.getCampaignById(campaignId);
    if (!cmp) throw new Error('Campaign not found');

    const validStatuses = ['draft', 'review', 'approved', 'scheduled', 'active', 'paused', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status "${status}"`);
    }

    if (status === 'active' && !cmp.isApproved) {
      const err = new Error('Cannot activate unapproved campaign');
      err.code = MONETIZATION_ERROR_CODES.ERR_CAMPAIGN_NOT_APPROVED;
      err.statusCode = 400;
      throw err;
    }

    cmp.status = status;
    cmp.updatedAt = new Date().toISOString();
    const saved = await this.adapter.saveCampaign(cmp, user);

    this.adapter.addAuditLog(
      user?.fullName || 'एडमिन',
      'AD_MANAGEMENT',
      'CAMPAIGN_STATUS_CHANGED',
      `अभियान स्थिति परिवर्तित: "${cmp.campaignName}" -> ${status}`,
      null
    );

    return saved;
  }

  // ==========================================================================
  // AD SERVING & IMPRESSION/CLICK TELEMETRY
  // ==========================================================================

  /**
   * Serves an active, approved ad creative matching slot and district
   */
  async serveAd({ slotCode, district = 'ALL' } = {}) {
    if (!slotCode) throw new Error('slotCode is required for ad serving');

    const campaigns = await this.adapter.getCampaigns();
    const now = new Date();

    const candidates = campaigns.filter((c) => {
      if (!c.isApproved) return false;
      if (c.status !== 'active') return false;
      if (c.slotCode !== slotCode) return false;

      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      if (now < start || now > end) return false;

      // Budget check
      if (c.budgetSpentPaise >= c.budgetTotalPaise) return false;

      // Geotargeting
      const targets = c.targetDistricts || ['ALL'];
      if (targets.includes('ALL') || targets.includes(district)) return true;

      return false;
    });

    if (candidates.length === 0) {
      return null;
    }

    // Weighted or deterministic round-robin pick
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];

    return {
      campaignId: chosen.id,
      campaignName: chosen.campaignName,
      advertiserName: chosen.advertiserName,
      slotCode: chosen.slotCode,
      creative: {
        ...chosen.creative,
        disclosureLabel: ASCI_DISCLOSURE_LABEL_HI,
      },
      pricingModel: chosen.pricingModel,
      disclosureLabel: ASCI_DISCLOSURE_LABEL_HI,
    };
  }

  /**
   * Records a validated viewable impression
   */
  async recordImpression({
    campaignId,
    viewablePercentage = 100,
    durationMs = 1200,
    sessionId = 'sess-anon',
    userAgent = 'Mozilla/5.0',
  } = {}) {
    if (!campaignId) throw new Error('campaignId is required');

    // Bot detection regex
    const botPattern = /Googlebot|bingbot|Baiduspider|YandexBot|DuckDuckBot|curl|wget|python-requests|node-fetch/i;
    if (botPattern.test(userAgent)) {
      return { counted: false, recorded: false, isBot: true, reason: 'Bot crawler traffic filtered' };
    }

    // Viewability threshold (MRC standard: >= 50% in viewport for >= 1000ms)
    if (viewablePercentage < 50 || durationMs < 1000) {
      return { counted: false, recorded: false, isViewableMrc: false, reason: 'Below viewability threshold' };
    }

    const currentMinute = Math.floor(Date.now() / 60000);
    const dedupeKey = `${sessionId}:${campaignId}:${currentMinute}`;
    if (this.impressionLog.has(dedupeKey)) {
      return { counted: false, recorded: false, isViewableMrc: true, reason: 'Duplicate impression deduplicated' };
    }
    this.impressionLog.add(dedupeKey);

    const cmp = await this.getCampaignById(campaignId);
    if (!cmp) return { counted: false, recorded: false, reason: 'Campaign not found' };

    cmp.metrics.impressions = (cmp.metrics.impressions || 0) + 1;
    cmp.metrics.viewableImpressions = (cmp.metrics.viewableImpressions || 0) + 1;

    // Increment spend if CPM (cost per mille = ₹rate / 1000 per impression)
    if (cmp.pricingModel === 'CPM') {
      const slot = AD_PLACEMENT_SLOTS.find((s) => s.code === cmp.slotCode);
      const cpmRatePaise = slot?.baseRatePaise || 4000;
      const impressionCostPaise = cpmRatePaise / 1000;
      cmp.metrics.spendPaise = Math.round((cmp.metrics.spendPaise || 0) + impressionCostPaise);
      cmp.budgetSpentPaise = cmp.metrics.spendPaise;
    }

    if (cmp.metrics.impressions > 0) {
      cmp.metrics.ctr = Number(((cmp.metrics.clicks / cmp.metrics.impressions) * 100).toFixed(2));
    }

    if (cmp.budgetSpentPaise >= cmp.budgetTotalPaise) {
      cmp.status = 'completed';
    }

    cmp.updatedAt = new Date().toISOString();
    await this.adapter.saveCampaign(cmp);

    return { counted: true, recorded: true, isViewableMrc: true, metrics: cmp.metrics };
  }

  /**
   * Records a validated ad click with velocity-based anti-fraud protection
   */
  async recordClick({
    campaignId,
    clientIp = '127.0.0.1',
    sessionId = 'sess-anon',
  } = {}) {
    if (!campaignId) throw new Error('campaignId is required');

    const key = `${clientIp}:${campaignId}`;
    const now = Date.now();
    const timestamps = this.clickLog.get(key) || [];
    const recent = timestamps.filter((t) => now - t < 60000);

    // Reject > 5 clicks/min from same IP on same campaign
    if (recent.length >= 5) {
      return { counted: false, recorded: false, isFraud: true, reason: 'Velocity limit exceeded (Anti-fraud click protection)' };
    }

    recent.push(now);
    this.clickLog.set(key, recent);

    const cmp = await this.getCampaignById(campaignId);
    if (!cmp) return { counted: false, recorded: false, reason: 'Campaign not found' };

    cmp.metrics.clicks = (cmp.metrics.clicks || 0) + 1;
    if (cmp.metrics.impressions > 0) {
      cmp.metrics.ctr = Number(((cmp.metrics.clicks / cmp.metrics.impressions) * 100).toFixed(2));
    }

    // Increment spend if CPC
    if (cmp.pricingModel === 'CPC') {
      const clickCostPaise = 250; // ₹2.50 per click
      cmp.metrics.spendPaise = Math.round((cmp.metrics.spendPaise || 0) + clickCostPaise);
      cmp.budgetSpentPaise = cmp.metrics.spendPaise;
    }

    if (cmp.budgetSpentPaise >= cmp.budgetTotalPaise) {
      cmp.status = 'completed';
    }

    cmp.updatedAt = new Date().toISOString();
    await this.adapter.saveCampaign(cmp);

    return {
      counted: true,
      recorded: true,
      isFraud: false,
      clicks: cmp.metrics.clicks,
      ctr: cmp.metrics.ctr,
      destinationUrl: cmp.creative.destinationUrl,
    };
  }
}
