/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Subscription Plans & Reader Entitlement Engine
 * Grounded in docs/Monetization.md (Section 12) and docs/DECISIONS.md (DEC-070)
 */

import crypto from 'node:crypto';
import { CANONICAL_SUBSCRIPTION_PLANS, MONETIZATION_ERROR_CODES } from './constants.js';

export class SubscriptionManager {
  constructor(adapter) {
    this.adapter = adapter;
    this.init();
  }

  async init() {
    // Seed initial plans if empty in adapter
    const existing = await this.adapter.getSubscriptionPlans();
    if (!existing || existing.length === 0) {
      for (const plan of CANONICAL_SUBSCRIPTION_PLANS) {
        await this.adapter.saveSubscriptionPlan(plan);
      }
    }
  }

  async getPlans({ activeOnly = false } = {}) {
    let plans = await this.adapter.getSubscriptionPlans();
    if (!plans || plans.length === 0) {
      plans = [...CANONICAL_SUBSCRIPTION_PLANS];
    }
    if (activeOnly) {
      plans = plans.filter((p) => p.isActive && p.isCommercialActive !== false);
    }
    return plans;
  }

  async getPlanById(planId) {
    const plans = await this.getPlans();
    return plans.find((p) => p.id === planId || p.code === planId) || null;
  }

  async createPlan(dto, user) {
    if (!dto.nameHi || !dto.code || dto.priceMinorUnits === undefined) {
      throw new Error('nameHi, code, and priceMinorUnits are mandatory for subscription plan creation');
    }

    const planRecord = {
      id: `sub-plan-${dto.code.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}-${Date.now()}`,
      code: dto.code.toUpperCase(),
      nameHi: dto.nameHi,
      nameEn: dto.nameEn || dto.nameHi,
      descriptionHi: dto.descriptionHi || '',
      billingCycle: dto.billingCycle || 'monthly', // 'monthly', 'yearly', 'quarterly'
      priceMinorUnits: Number(dto.priceMinorUnits),
      priceRupees: (Number(dto.priceMinorUnits) / 100).toFixed(2),
      currency: dto.currency || 'INR',
      includedFeatures: dto.includedFeatures || [],
      entitlements: dto.entitlements || ['standard_read'],
      usageLimits: dto.usageLimits || { maxDownloadsPerMonth: 0, maxCommentsPerDay: 5 },
      trialDays: dto.trialDays !== undefined ? Number(dto.trialDays) : 0,
      isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : true,
      isCommercialActive: dto.isCommercialActive !== undefined ? Boolean(dto.isCommercialActive) : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.adapter.saveSubscriptionPlan(planRecord, user);

    this.adapter.addAuditLog(
      user?.fullName || 'एडमिन',
      'MONETIZATION',
      'SUBSCRIPTION_PLAN_CREATED',
      `नई सदस्यता योजना सृजित: ${saved.nameHi} (${saved.code}) [₹${saved.priceRupees}/${saved.billingCycle}]`,
      null
    );

    return saved;
  }

  async updatePlan(planId, dto, user) {
    const plan = await this.getPlanById(planId);
    if (!plan) {
      const err = new Error('Subscription plan not found');
      err.code = MONETIZATION_ERROR_CODES.ERR_SUBSCRIPTION_PLAN_NOT_FOUND;
      err.statusCode = 404;
      throw err;
    }

    if (dto.nameHi) plan.nameHi = dto.nameHi;
    if (dto.nameEn) plan.nameEn = dto.nameEn;
    if (dto.descriptionHi !== undefined) plan.descriptionHi = dto.descriptionHi;
    if (dto.billingCycle) plan.billingCycle = dto.billingCycle;
    if (dto.priceMinorUnits !== undefined) {
      plan.priceMinorUnits = Number(dto.priceMinorUnits);
      plan.priceRupees = (Number(dto.priceMinorUnits) / 100).toFixed(2);
    }
    if (dto.includedFeatures) plan.includedFeatures = dto.includedFeatures;
    if (dto.entitlements) plan.entitlements = dto.entitlements;
    if (dto.usageLimits) plan.usageLimits = { ...plan.usageLimits, ...dto.usageLimits };
    if (dto.trialDays !== undefined) plan.trialDays = Number(dto.trialDays);
    if (typeof dto.isActive === 'boolean') plan.isActive = dto.isActive;
    if (typeof dto.isCommercialActive === 'boolean') plan.isCommercialActive = dto.isCommercialActive;

    plan.updatedAt = new Date().toISOString();
    const saved = await this.adapter.saveSubscriptionPlan(plan, user);

    this.adapter.addAuditLog(
      user?.fullName || 'एडमिन',
      'MONETIZATION',
      'SUBSCRIPTION_PLAN_UPDATED',
      `सदस्यता योजना अद्यतित: ${plan.nameHi} (${plan.code})`,
      null
    );

    return saved;
  }

  async togglePlan(planId, isActive, user) {
    return this.updatePlan(planId, { isActive }, user);
  }

  /**
   * Subscribes a user to an approved plan
   */
  async createSubscription({
    userId,
    userName,
    userEmail,
    userPhone,
    planId,
    paymentOrderId,
    paymentTransactionId,
  }, user) {
    const plan = await this.getPlanById(planId);
    if (!plan) {
      const err = new Error('Subscription plan not found');
      err.code = MONETIZATION_ERROR_CODES.ERR_SUBSCRIPTION_PLAN_NOT_FOUND;
      err.statusCode = 404;
      throw err;
    }

    const now = new Date();
    const trialDays = plan.trialDays || 0;
    const isTrial = trialDays > 0;

    let periodEndDate = new Date(now);
    if (isTrial) {
      periodEndDate.setDate(periodEndDate.getDate() + trialDays);
    } else if (plan.billingCycle === 'yearly') {
      periodEndDate.setFullYear(periodEndDate.getFullYear() + 1);
    } else {
      periodEndDate.setDate(periodEndDate.getDate() + 30);
    }

    const subscription = {
      id: `sub-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      userId: userId || user?.id || 'usr-anonymous',
      userName: userName || user?.fullName || 'पाठक',
      userEmail: userEmail || user?.email || '',
      userPhone: userPhone || user?.phone || '',
      planId: plan.id,
      planCode: plan.code,
      planNameHi: plan.nameHi,
      billingCycle: plan.billingCycle,
      priceMinorUnits: plan.priceMinorUnits,
      priceRupees: (plan.priceMinorUnits / 100).toFixed(2),
      currency: plan.currency,
      status: isTrial ? 'TRIALING' : 'ACTIVE', // ACTIVE, TRIALING, CANCELLED, EXPIRED
      entitlements: plan.entitlements,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEndDate.toISOString(),
      cancelAtPeriodEnd: false,
      paymentOrderId: paymentOrderId || null,
      paymentTransactionId: paymentTransactionId || null,
      usageMetrics: {
        downloadsCount: 0,
        commentsCount: 0,
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const saved = await this.adapter.saveCustomerSubscription(subscription, user);

    this.adapter.addAuditLog(
      user?.fullName || 'सिस्टम',
      'MONETIZATION',
      'SUBSCRIPTION_ACTIVATED',
      `नई ग्राहक सदस्यता: ${saved.userName} -> ${saved.planNameHi} (${saved.status})`,
      null
    );

    return saved;
  }

  /**
   * Verifies reader entitlements (e.g. ad-free, pdf downloads)
   */
  async getReaderEntitlements(userId) {
    if (!userId) {
      return {
        isAdFree: false,
        canDownloadPdf: false,
        hasEpaperArchive: false,
        isPatron: false,
        planCode: 'GUEST',
      };
    }

    const activeSubs = await this.adapter.getCustomerSubscriptionsByUserId(userId);
    const validSub = activeSubs.find((s) => {
      const now = new Date();
      return (s.status === 'ACTIVE' || s.status === 'TRIALING') && new Date(s.currentPeriodEnd) > now;
    });

    if (!validSub) {
      return {
        isAdFree: false,
        canDownloadPdf: false,
        hasEpaperArchive: false,
        isPatron: false,
        planCode: 'FREE',
      };
    }

    const entitlements = validSub.entitlements || [];
    return {
      isAdFree: entitlements.includes('ad_free'),
      canDownloadPdf: entitlements.includes('pdf_download'),
      hasEpaperArchive: entitlements.includes('epaper_archive'),
      isPatron: entitlements.includes('patron_badge'),
      planCode: validSub.planCode,
      subscriptionId: validSub.id,
      expiresAt: validSub.currentPeriodEnd,
    };
  }

  async cancelSubscription(subscriptionId, { immediate = false } = {}, user) {
    const sub = await this.adapter.getCustomerSubscriptionById(subscriptionId, user);
    if (!sub) {
      const err = new Error('Subscription not found');
      err.code = MONETIZATION_ERROR_CODES.ERR_ORDER_NOT_FOUND;
      err.statusCode = 404;
      throw err;
    }

    if (immediate) {
      sub.status = 'CANCELLED';
      sub.cancelledAt = new Date().toISOString();
    } else {
      sub.cancelAtPeriodEnd = true;
    }
    sub.updatedAt = new Date().toISOString();

    const saved = await this.adapter.saveCustomerSubscription(sub, user);

    this.adapter.addAuditLog(
      user?.fullName || 'उपयोगकर्ता',
      'MONETIZATION',
      'SUBSCRIPTION_CANCELLED',
      `सदस्यता निरस्त: ${sub.userName} (${sub.planNameHi}) [तत्काल: ${immediate}]`,
      null
    );

    return saved;
  }

  async renewSubscription(subscriptionId, user) {
    const sub = await this.adapter.getCustomerSubscriptionById(subscriptionId, user);
    if (!sub) {
      const err = new Error('Subscription not found');
      err.code = MONETIZATION_ERROR_CODES.ERR_ORDER_NOT_FOUND;
      err.statusCode = 404;
      throw err;
    }

    const currentEnd = new Date(sub.currentPeriodEnd);
    const baseDate = currentEnd > new Date() ? currentEnd : new Date();

    if (sub.billingCycle === 'yearly') {
      baseDate.setFullYear(baseDate.getFullYear() + 1);
    } else {
      baseDate.setDate(baseDate.getDate() + 30);
    }

    sub.status = 'ACTIVE';
    sub.cancelAtPeriodEnd = false;
    sub.currentPeriodEnd = baseDate.toISOString();
    sub.updatedAt = new Date().toISOString();

    const saved = await this.adapter.saveCustomerSubscription(sub, user);

    this.adapter.addAuditLog(
      user?.fullName || 'सिस्टम',
      'MONETIZATION',
      'SUBSCRIPTION_RENEWED',
      `सदस्यता नवीनीकृत: ${sub.userName} -> समाप्ति: ${sub.currentPeriodEnd}`,
      null
    );

    return saved;
  }
}

