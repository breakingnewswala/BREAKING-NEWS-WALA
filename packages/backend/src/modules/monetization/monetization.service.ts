/**
 * BREAKING NEWS WALA — Monetization Domain Service
 * Grounded in docs/Monetization.md, docs/06-Business-Rules.md (RULE-AD-001 to RULE-AD-005, RULE-REWARD-002),
 * and docs/DECISIONS.md (DEC-007, DEC-048, DEC-060, DEC-068, DEC-069, DEC-070).
 */

import {
  AdvertiserItem,
  CreateAdvertiserDto,
  UpdateAdvertiserDto,
  AdCampaignItem,
  CreateAdCampaignDto,
  UpdateAdCampaignDto,
  AdCreativeItem,
  CreateAdCreativeDto,
  AdPlacementSlotConfig,
  SubscriptionPlanItem,
  UserEntitlementItem,
  ReferralAttributionItem,
  PaymentOrderItem,
  InvoiceItem,
  MonetizationDashboardStats,
  AdPlacementCode,
} from '@bnw/types';
import {
  IMonetizationRepository,
  TaxCalculationResult,
  AdDeliveryServingResult,
  ImpressionVerificationDto,
  ClickVerificationDto,
  CreateInvoiceDto,
} from './types';
import { AdDeliveryEngine } from './ad.delivery.engine';
import { IPaymentGatewayAdapter } from './gateways/payment.gateway.interface';
import { RazorpayAdapter } from './gateways/razorpay.adapter';
import {
  BILLING_CONSTANTS,
  GOVERNANCE_INVARIANTS,
} from './monetization.constants';

export class MonetizationService {
  private adDeliveryEngine: AdDeliveryEngine;

  constructor(
    private repository: IMonetizationRepository,
    private gatewayAdapter: IPaymentGatewayAdapter = new RazorpayAdapter()
  ) {
    this.adDeliveryEngine = new AdDeliveryEngine();
  }

  // ============================================================================
  // 1. Advertiser & Agency Management
  // ============================================================================

  public async getAdvertisers(): Promise<AdvertiserItem[]> {
    return this.repository.getAdvertisers();
  }

  public async getAdvertiser(id: string): Promise<AdvertiserItem> {
    const advertiser = await this.repository.getAdvertiserById(id);
    if (!advertiser) throw new Error(`Advertiser not found: ${id}`);
    return advertiser;
  }

  public async createAdvertiser(dto: CreateAdvertiserDto): Promise<AdvertiserItem> {
    // Basic validation
    if (!dto.organizationName || !dto.email || !dto.phone) {
      throw new Error('Organization name, email and phone are mandatory');
    }
    return this.repository.createAdvertiser(dto);
  }

  public async updateAdvertiser(id: string, dto: UpdateAdvertiserDto): Promise<AdvertiserItem> {
    return this.repository.updateAdvertiser(id, dto);
  }

  public async verifyAdvertiser(id: string): Promise<AdvertiserItem> {
    return this.repository.updateAdvertiser(id, {
      verificationStatus: 'verified',
      accountStatus: 'active',
    });
  }

  public async suspendAdvertiser(id: string, _reason: string): Promise<AdvertiserItem> {
    // When advertiser is suspended, pause all active campaigns
    const campaigns = await this.repository.getCampaigns({ advertiserId: id, status: 'ACTIVE' });
    for (const campaign of campaigns) {
      await this.repository.updateCampaign(campaign.id, { status: 'PAUSED' });
    }

    return this.repository.updateAdvertiser(id, {
      accountStatus: 'suspended',
    });
  }

  // ============================================================================
  // 2. Campaign Management & State Machine
  // ============================================================================

  public async getCampaigns(filters?: { advertiserId?: string; status?: string }): Promise<AdCampaignItem[]> {
    return this.repository.getCampaigns(filters);
  }

  public async getCampaign(id: string): Promise<AdCampaignItem> {
    const campaign = await this.repository.getCampaignById(id);
    if (!campaign) throw new Error(`Campaign not found: ${id}`);
    return campaign;
  }

  public async createCampaign(dto: CreateAdCampaignDto): Promise<AdCampaignItem> {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end <= start) {
      throw new Error('Campaign end date must be strictly after start date');
    }
    if (dto.totalBudgetMinorUnits <= 0) {
      throw new Error('Total budget must be a positive integer in paise');
    }

    return this.repository.createCampaign(dto);
  }

  public async updateCampaign(id: string, dto: UpdateAdCampaignDto): Promise<AdCampaignItem> {
    return this.repository.updateCampaign(id, dto);
  }

  public async submitCampaignForApproval(id: string): Promise<AdCampaignItem> {
    await this.getCampaign(id);
    const creatives = await this.repository.getCreatives(id);
    if (creatives.length === 0) {
      throw new Error('Campaign must have at least one creative before submission for approval');
    }

    return this.repository.updateCampaign(id, { status: 'PENDING_APPROVAL' });
  }

  public async approveCampaign(
    id: string,
    approverUserId: string,
    notes?: string
  ): Promise<AdCampaignItem> {
    const campaign = await this.getCampaign(id);
    const now = new Date();
    const start = new Date(campaign.startDate);
    const targetStatus = now >= start ? 'ACTIVE' : 'APPROVED';

    return this.repository.updateCampaign(id, {
      status: targetStatus,
      approvedByUserId: approverUserId,
      approvedAt: now.toISOString(),
      approvalNotes: notes || 'Approved under editorial advertising standards',
    });
  }

  public async rejectCampaign(id: string, _approverUserId: string, reason: string): Promise<AdCampaignItem> {
    return this.repository.updateCampaign(id, {
      status: 'REJECTED',
      approvalNotes: `Rejected: ${reason}`,
    });
  }

  public async pauseCampaign(id: string): Promise<AdCampaignItem> {
    return this.repository.updateCampaign(id, { status: 'PAUSED' });
  }

  public async resumeCampaign(id: string): Promise<AdCampaignItem> {
    return this.repository.updateCampaign(id, { status: 'ACTIVE' });
  }

  // ============================================================================
  // 3. Creative Management & Prohibited Category Filter (RULE-AD-003)
  // ============================================================================

  public async getCreatives(campaignId?: string): Promise<AdCreativeItem[]> {
    return this.repository.getCreatives(campaignId);
  }

  public async getCreative(id: string): Promise<AdCreativeItem> {
    const creative = await this.repository.getCreativeById(id);
    if (!creative) throw new Error(`Creative not found: ${id}`);
    return creative;
  }

  public async createCreative(dto: CreateAdCreativeDto): Promise<AdCreativeItem> {
    // 1. Prohibited category check (RULE-AD-003)
    this.validateAdContentPolicy(dto);

    // 2. Validate placement slot existence
    const slot = await this.repository.getPlacementSlotByCode(dto.adSlotCode);
    if (!slot) {
      throw new Error(`Invalid placement slot code: ${dto.adSlotCode}`);
    }

    return this.repository.createCreative(dto);
  }

  public async approveCreative(id: string, _approverUserId: string): Promise<AdCreativeItem> {
    const creative = await this.getCreative(id);
    // Ensure creative adheres to policy
    this.validateAdContentPolicy({
      headlineHi: creative.headlineHi,
      bodyTextHi: creative.bodyTextHi,
      destinationUrl: creative.destinationUrl,
    } as any);

    return this.repository.updateCreative(id, {
      isApproved: true,
      rejectionReason: undefined,
    });
  }

  public async rejectCreative(id: string, reason: string): Promise<AdCreativeItem> {
    return this.repository.updateCreative(id, {
      isApproved: false,
      rejectionReason: reason,
    });
  }

  /**
   * Evaluates text and URL against prohibited advertising categories (RULE-AD-003)
   */
  private validateAdContentPolicy(dto: Partial<CreateAdCreativeDto>): void {
    const textToCheck = `${dto.headlineHi || ''} ${dto.bodyTextHi || ''} ${dto.destinationUrl || ''}`.toLowerCase();

    const prohibitedTriggers: Record<string, string[]> = {
      betting_gambling: ['betting', 'casino', 'सट्टा', 'जुआ', 'poker', 'roulette', 'dream11 real cash', 'win money gambling'],
      payday_loans: ['instant loan 5 minute', 'बिना दस्तावेज लोन', 'payday loan', '7 days loan', 'loan app download'],
      miracle_cures: ['miracle cure', 'जादुई इलाज', '100% गारंटी इलाज', 'cancer cure miracle', 'गुप्त रोग गारंटी इलाज'],
      firearms_weapons: ['buy gun', 'हथियार', 'पिस्तौल', 'firearm', 'ammunition'],
      hate_speech_obscenity: ['hate', 'अश्लील', 'dharma virodhi', 'vulgar'],
      alcohol_tobacco_direct: ['whisky', 'vodka', 'तंबाकू', 'गुटखा', 'cigarette', 'शराब', 'beer online'],
    };

    for (const [category, keywords] of Object.entries(prohibitedTriggers)) {
      for (const kw of keywords) {
        if (textToCheck.includes(kw.toLowerCase())) {
          throw new Error(
            `POLICY_VIOLATION_RULE_AD_003: Creative violates advertising policy. Prohibited category: ${category} (Trigger: "${kw}")`
          );
        }
      }
    }
  }

  // ============================================================================
  // 4. Ad Placement Catalog & Delivery Engine
  // ============================================================================

  public async getPlacementSlots(): Promise<AdPlacementSlotConfig[]> {
    return this.repository.getPlacementSlots();
  }

  public async getPlacementSlot(code: AdPlacementCode): Promise<AdPlacementSlotConfig> {
    const slot = await this.repository.getPlacementSlotByCode(code);
    if (!slot) throw new Error(`Placement slot not found: ${code}`);
    return slot;
  }

  /**
   * Public ad serving request.
   * If user has active ad-free entitlement, returns served: false (clean ad suppression)
   */
  public async serveAdForSlot(
    slotCode: AdPlacementCode,
    options?: {
      targetDistrictId?: string;
      userAgent?: string;
      userId?: string;
    }
  ): Promise<AdDeliveryServingResult> {
    // 1. Check user entitlement for ad-free reading
    if (options?.userId) {
      const hasAdFree = await this.hasEntitlement(options.userId, 'ad_free');
      if (hasAdFree) {
        return {
          served: false,
          adSlotCode: slotCode,
          reason: 'Ad-free entitlement active for user',
        };
      }
    }

    // 2. Fetch active campaigns and creatives
    const campaigns = await this.repository.getCampaigns({ status: 'ACTIVE' });
    const creatives = await this.repository.getCreatives();

    // 3. Delegate to delivery engine
    return this.adDeliveryEngine.selectAdForSlot(slotCode, campaigns, creatives, {
      targetDistrictId: options?.targetDistrictId,
      userAgent: options?.userAgent,
    });
  }

  public async recordImpression(dto: ImpressionVerificationDto): Promise<{ verified: boolean; reason?: string }> {
    const result = this.adDeliveryEngine.isViewableImpression(dto);
    await this.repository.recordImpressionEvent(dto.creativeId, result.isValid);
    return { verified: result.isValid, reason: result.reason };
  }

  public async recordClick(dto: ClickVerificationDto): Promise<{ verified: boolean; reason?: string }> {
    const result = this.adDeliveryEngine.isLegitimateClick(dto);
    await this.repository.recordClickEvent(dto.creativeId, result.isValid);
    return { verified: result.isValid, reason: result.reason };
  }

  // ============================================================================
  // 5. Subscription Architecture & Entitlements Engine (DEC-070 DEFERRED)
  // ============================================================================

  public async getSubscriptionPlans(): Promise<SubscriptionPlanItem[]> {
    return this.repository.getSubscriptionPlans();
  }

  public async getUserEntitlements(userId: string): Promise<UserEntitlementItem[]> {
    return this.repository.getUserEntitlements(userId);
  }

  public async hasEntitlement(userId: string, entitlementCode: string): Promise<boolean> {
    const entitlements = await this.repository.getUserEntitlements(userId);
    const now = new Date();

    return entitlements.some((ent) => {
      if (!ent.isActive) return false;
      if (ent.entitlementCode !== entitlementCode) return false;
      if (ent.expiresAt && new Date(ent.expiresAt) < now) return false;
      return true;
    });
  }

  /**
   * Redeem Coin Perk for Non-Monetary Digital Pass (DEC-007)
   */
  public async grantPerkEntitlement(
    userId: string,
    perkCode: string,
    durationHours: number = 24
  ): Promise<UserEntitlementItem> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationHours * 3600 * 1000).toISOString();

    let entitlementCode = 'ad_free';
    if (perkCode === 'EPAPER_ARCHIVE_PASS') {
      entitlementCode = 'epaper_archive';
    } else if (perkCode === 'BADGE_VERIFIED_CITIZEN') {
      entitlementCode = 'patron_badge';
    }

    return this.repository.grantUserEntitlement({
      userId,
      entitlementCode,
      source: 'coin_perk',
      referenceId: perkCode,
      expiresAt,
      isActive: true,
    });
  }

  /**
   * Commercial Paid Subscription Checkout (DEC-070)
   * Strictly blocks checkout since paid reader subscriptions are deferred.
   */
  public async initiateSubscriptionCheckout(userId: string, planCode: string): Promise<never> {
    const plan = await this.repository.getSubscriptionPlanByCode(planCode);
    if (!plan || !plan.isCommercialActive) {
      throw new Error(
        `ERR_SUBSCRIPTION_DEFERRED: ${GOVERNANCE_INVARIANTS.DEC_070.notice} (Plan: ${planCode}, User: ${userId})`
      );
    }
    throw new Error('Unexpected active subscription flow in Phase 1/2.');
  }

  // ============================================================================
  // 6. Referral Management & Mandatory Governance Gate (RULE-REWARD-002)
  // ============================================================================

  public async getReferralAttributions(referrerUserId?: string): Promise<ReferralAttributionItem[]> {
    return this.repository.getReferralAttributions(referrerUserId);
  }

  public async trackReferral(data: {
    referrerCode: string;
    referredUserId: string;
  }): Promise<{ attribution: ReferralAttributionItem; governanceNotice: string }> {
    if (!data.referrerCode.startsWith('BNW-')) {
      throw new Error('Invalid referral code format. Must start with "BNW-"');
    }

    // Identify referrer (mock or extracted ID)
    const referrerUserId = `usr-ref-${data.referrerCode.replace('BNW-', '')}`;

    const attribution = await this.repository.createReferralAttribution({
      referrerUserId,
      referrerCode: data.referrerCode,
      referredUserId: data.referredUserId,
    });

    return {
      attribution,
      governanceNotice: GOVERNANCE_INVARIANTS.RULE_REWARD_002.notice,
    };
  }

  // ============================================================================
  // 7. Billing, Invoicing & 18% GST Calculation (SAC 998363)
  // ============================================================================

  /**
   * Strict integer calculation of GST for advertising services (SAC 998363)
   * Zero floating point arithmetic!
   */
  public calculateGst(subtotalPaise: number, isIntrastateMP: boolean): TaxCalculationResult {
    let cgstMinorUnits = 0;
    let sgstMinorUnits = 0;
    let igstMinorUnits = 0;

    if (isIntrastateMP) {
      // 9% CGST + 9% SGST = 18% Total for Madhya Pradesh transactions
      cgstMinorUnits = Math.round((subtotalPaise * BILLING_CONSTANTS.CGST_RATE_PERCENT) / 100);
      sgstMinorUnits = Math.round((subtotalPaise * BILLING_CONSTANTS.SGST_RATE_PERCENT) / 100);
    } else {
      // 18% IGST for interstate transactions
      igstMinorUnits = Math.round((subtotalPaise * BILLING_CONSTANTS.IGST_RATE_PERCENT) / 100);
    }

    const totalMinorUnits = subtotalPaise + cgstMinorUnits + sgstMinorUnits + igstMinorUnits;

    return {
      subtotalMinorUnits: subtotalPaise,
      cgstMinorUnits,
      sgstMinorUnits,
      igstMinorUnits,
      totalMinorUnits,
      isIntrastateMP,
    };
  }

  public async createInvoice(dto: CreateInvoiceDto): Promise<InvoiceItem> {
    const advertiser = await this.getAdvertiser(dto.advertiserId);
    let subtotalPaise = 0;

    const lineItems = dto.lineItems.map((li, index) => {
      const lineTotal = li.quantity * li.unitPriceMinorUnits;
      subtotalPaise += lineTotal;
      return {
        id: `li-${Date.now()}-${index}`,
        description: li.description,
        sacCode: li.sacCode || BILLING_CONSTANTS.SAC_CODE,
        quantity: li.quantity,
        unitPriceMinorUnits: li.unitPriceMinorUnits,
        totalMinorUnits: lineTotal,
      };
    });

    // Check if intrastate MP (stateCode 23 or billing address contains MP/Madhya Pradesh)
    const billingLower = advertiser.billingAddress?.toLowerCase() || '';
    const isIntrastate =
      dto.stateCode === BILLING_CONSTANTS.HOME_STATE_CODE_MP ||
      billingLower.includes('madhya pradesh') ||
      billingLower.includes('भोपाल') ||
      billingLower.includes('इंदौर');

    const tax = this.calculateGst(subtotalPaise, isIntrastate);

    const now = new Date();
    const dueDays = dto.dueDays || 30;
    const dueDate = new Date(now.getTime() + dueDays * 24 * 3600 * 1000).toISOString();

    const invoiceNumber = `BNW-INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return this.repository.createInvoice({
      invoiceNumber,
      advertiserId: advertiser.id,
      advertiserName: advertiser.organizationName,
      gstin: advertiser.gstin,
      billingAddress: advertiser.billingAddress,
      issueDate: now.toISOString(),
      dueDate,
      currency: BILLING_CONSTANTS.CURRENCY_INR,
      subtotalMinorUnits: tax.subtotalMinorUnits,
      cgstMinorUnits: tax.cgstMinorUnits,
      sgstMinorUnits: tax.sgstMinorUnits,
      igstMinorUnits: tax.igstMinorUnits,
      totalAmountMinorUnits: tax.totalMinorUnits,
      status: 'ISSUED',
      lineItems,
    });
  }

  public async getInvoices(advertiserId?: string): Promise<InvoiceItem[]> {
    return this.repository.getInvoices(advertiserId);
  }

  public async getInvoice(id: string): Promise<InvoiceItem> {
    const inv = await this.repository.getInvoiceById(id);
    if (!inv) throw new Error(`Invoice not found: ${id}`);
    return inv;
  }

  // ============================================================================
  // 8. Payment Orders & Webhook Processing (DEC-068)
  // ============================================================================

  public async createPaymentOrder(params: {
    advertiserId: string;
    campaignId?: string;
    amountMinorUnits: number;
    idempotencyKey: string;
  }): Promise<{ order: PaymentOrderItem; checkoutPayload: Record<string, any> }> {
    const orderNumber = `ORD-${Date.now()}`;
    const advertiser = await this.getAdvertiser(params.advertiserId);

    const gatewayResult = await this.gatewayAdapter.createOrder({
      orderNumber,
      amountMinorUnits: params.amountMinorUnits,
      currency: BILLING_CONSTANTS.CURRENCY_INR,
      receipt: orderNumber,
      notes: {
        advertiserId: params.advertiserId,
        contactPerson: advertiser.contactPerson,
        email: advertiser.email,
      },
    });

    const order = await this.repository.createPaymentOrder({
      orderNumber,
      advertiserId: params.advertiserId,
      campaignId: params.campaignId,
      amountMinorUnits: params.amountMinorUnits,
      currency: BILLING_CONSTANTS.CURRENCY_INR,
      status: 'created',
      provider: this.gatewayAdapter.providerName,
      providerOrderId: gatewayResult.providerOrderId,
      idempotencyKey: params.idempotencyKey,
    });

    return {
      order,
      checkoutPayload: gatewayResult.checkoutPayload,
    };
  }

  public async processPaymentWebhook(
    rawBody: string,
    signature: string
  ): Promise<{ success: boolean; event?: string; error?: string }> {
    const result = await this.gatewayAdapter.parseWebhookEvent(rawBody, signature);
    if (!result.isValid || !result.providerOrderId) {
      return { success: false, error: result.error || 'Invalid webhook event signature' };
    }

    // Match order by providerOrderId
    const orders = await this.repository.getPaymentOrders();
    const matchingOrder = orders.find((o) => o.providerOrderId === result.providerOrderId);

    if (matchingOrder) {
      await this.repository.updatePaymentOrder(matchingOrder.id, {
        status: 'paid',
        providerPaymentId: result.providerPaymentId,
        paidAt: new Date().toISOString(),
      });
    }

    return { success: true, event: result.event };
  }

  // ============================================================================
  // 9. Dashboard Stats & Analytics
  // ============================================================================

  public async getDashboardStats(): Promise<MonetizationDashboardStats> {
    return this.repository.getDashboardStats();
  }
}
