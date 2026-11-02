/**
 * BREAKING NEWS WALA — Monetization Repository (In-Memory & Prisma Support)
 * Grounded in docs/Monetization.md and docs/12-Database.md (DOM-R / DOM-N)
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
import { IMonetizationRepository } from './types';
import { AD_PLACEMENT_SLOTS, SUBSCRIPTION_PLANS, BILLING_CONSTANTS } from './monetization.constants';

export class InMemoryMonetizationRepository implements IMonetizationRepository {
  private advertisers: Map<string, AdvertiserItem> = new Map();
  private campaigns: Map<string, AdCampaignItem> = new Map();
  private creatives: Map<string, AdCreativeItem> = new Map();
  private subscriptionPlans: Map<string, SubscriptionPlanItem> = new Map();
  private userEntitlements: Map<string, UserEntitlementItem[]> = new Map();
  private referralAttributions: ReferralAttributionItem[] = [];
  private paymentOrders: Map<string, PaymentOrderItem> = new Map();
  private invoices: Map<string, InvoiceItem> = new Map();

  // Metrics counters
  private totalImpressions = 142500;
  private totalValidClicks = 4280;
  private verifiedRevenuePaise = 5250000; // ₹52,500.00

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData(): void {
    // 1. Seed Placement Slots (read-only reference)
    // 2. Seed Subscription Plans
    for (const plan of SUBSCRIPTION_PLANS) {
      this.subscriptionPlans.set(plan.code, { ...plan });
    }

    // 3. Seed Regional Advertisers
    const adv1: AdvertiserItem = {
      id: 'adv-mp-tourism-001',
      organizationName: 'मध्य प्रदेश पर्यटन विकास निगम (MP Tourism)',
      contactPerson: 'राकेश शर्मा (प्रचार अधिकारी)',
      email: 'advertising@mptourism.gov.in',
      phone: '+91 755 2778383',
      billingAddress: 'पर्यटन भवन, भदभदा रोड, भोपाल, मध्य प्रदेश - 462003',
      gstin: '23AAACM0000A1Z5',
      category: 'government_tourism',
      accountStatus: 'active',
      verificationStatus: 'verified',
      agreementStatus: 'signed',
      activeCampaignsCount: 1,
      createdAt: new Date('2026-01-15T10:00:00Z').toISOString(),
      updatedAt: new Date('2026-01-15T10:00:00Z').toISOString(),
    };
    const adv2: AdvertiserItem = {
      id: 'adv-indore-swachh-002',
      organizationName: 'इंदौर स्वच्छ भारत अभियान प्रन्यास',
      contactPerson: 'सुनील पाटीदार',
      email: 'contact@swachhindore.org',
      phone: '+91 731 2549000',
      billingAddress: 'नगर निगम परिसर, एमजी रोड, इंदौर, मध्य प्रदेश - 452001',
      gstin: '23AABTI1234B1Z2',
      category: 'civic_education',
      accountStatus: 'active',
      verificationStatus: 'verified',
      agreementStatus: 'signed',
      activeCampaignsCount: 1,
      createdAt: new Date('2026-02-01T11:00:00Z').toISOString(),
      updatedAt: new Date('2026-02-01T11:00:00Z').toISOString(),
    };
    this.advertisers.set(adv1.id, adv1);
    this.advertisers.set(adv2.id, adv2);

    // 4. Seed Campaigns
    const camp1: AdCampaignItem = {
      id: 'camp-heart-of-india-001',
      advertiserId: adv1.id,
      advertiserName: adv1.organizationName,
      campaignName: 'हृदय प्रदेश दर्शन — पचमढ़ी व कान्हा राष्ट्रीय उद्यान',
      description: 'पर्यटन संवर्धन हेतु डिजिटल बैनर एवं इन-फ़ीड प्रचार अभियान।',
      objective: 'AWARENESS',
      startDate: new Date('2026-01-01T00:00:00Z').toISOString(),
      endDate: new Date('2026-12-31T23:59:59Z').toISOString(),
      status: 'ACTIVE',
      targetDistricts: ['Hoshangabad', 'Mandla', 'Bhopal', 'Indore'],
      targetCategories: ['पर्यटन', 'मध्य प्रदेश', 'संस्कृति'],
      selectedPlacements: ['header_leaderboard', 'homepage_infeed', 'article_body_mpu'],
      totalBudgetMinorUnits: 25000000, // ₹2,50,000
      spentBudgetMinorUnits: 4500000,  // ₹45,000
      pricingModel: 'CPM',
      approvalNotes: 'ASCI दिशा-निर्देशों एवं नीतिगत मानकों के अनुरूप स्वीकृत।',
      approvedByUserId: 'usr-admin-bhopal-01',
      approvedAt: new Date('2026-01-02T10:00:00Z').toISOString(),
      createdAt: new Date('2026-01-01T09:00:00Z').toISOString(),
      updatedAt: new Date('2026-01-02T10:00:00Z').toISOString(),
    };
    this.campaigns.set(camp1.id, camp1);

    // 5. Seed Creatives
    const cr1: AdCreativeItem = {
      id: 'cr-pachmarhi-header-001',
      campaignId: camp1.id,
      adSlotCode: 'header_leaderboard',
      creativeType: 'IMAGE',
      creativeMediaUrl: '/media/ads/mptourism_pachmarhi_728x90.webp',
      destinationUrl: 'https://www.mptourism.com/destination-pachmarhi.php',
      targetDistrictId: undefined,
      headlineHi: 'पचमढ़ी की हसीन वादियों में प्रकृति का आनंद लें — एमपी टूरिज्म',
      bodyTextHi: 'सतपुड़ा की रानी पचमढ़ी में सुकून भरे पल बिताएं। विशेष विंटर पैकेज उपलब्ध।',
      width: 728,
      height: 90,
      isApproved: true,
      version: 1,
      createdAt: new Date('2026-01-01T10:00:00Z').toISOString(),
      updatedAt: new Date('2026-01-02T10:00:00Z').toISOString(),
    };
    const cr2: AdCreativeItem = {
      id: 'cr-kanha-mpu-002',
      campaignId: camp1.id,
      adSlotCode: 'article_body_mpu',
      creativeType: 'IMAGE',
      creativeMediaUrl: '/media/ads/mptourism_kanha_300x250.webp',
      destinationUrl: 'https://www.mptourism.com/destination-kanha-national-park.php',
      targetDistrictId: undefined,
      headlineHi: 'कान्हा राष्ट्रीय उद्यान — बाघों की धरती पर आपका स्वागत है',
      bodyTextHi: 'प्राकृतिक सौंदर्य एवं दुर्लभ वन्यजीवों का अद्भुत अनुभव। आज ही सफारी बुक करें।',
      width: 300,
      height: 250,
      isApproved: true,
      version: 1,
      createdAt: new Date('2026-01-01T10:15:00Z').toISOString(),
      updatedAt: new Date('2026-01-02T10:00:00Z').toISOString(),
    };
    this.creatives.set(cr1.id, cr1);
    this.creatives.set(cr2.id, cr2);

    // 6. Seed Sample Invoice
    const inv1: InvoiceItem = {
      id: 'inv-bnw-2026-0001',
      invoiceNumber: 'BNW-INV-2026-0001',
      advertiserId: adv1.id,
      advertiserName: adv1.organizationName,
      gstin: adv1.gstin,
      billingAddress: adv1.billingAddress,
      issueDate: new Date('2026-01-05T00:00:00Z').toISOString(),
      dueDate: new Date('2026-02-05T00:00:00Z').toISOString(),
      currency: 'INR',
      subtotalMinorUnits: 5000000, // ₹50,000.00
      cgstMinorUnits: 450000,      // ₹4,500.00 (9%)
      sgstMinorUnits: 450000,      // ₹4,500.00 (9%)
      igstMinorUnits: 0,
      totalAmountMinorUnits: 5900000, // ₹59,000.00
      status: 'PAID',
      paymentOrderId: 'pord-init-001',
      paidAt: new Date('2026-01-10T14:30:00Z').toISOString(),
      lineItems: [
        {
          id: 'li-01',
          description: 'शीर्ष हेडर लीडरबोर्ड विज्ञापन स्लॉट (जनवरी 2026)',
          sacCode: BILLING_CONSTANTS.SAC_CODE,
          quantity: 1,
          unitPriceMinorUnits: 5000000,
          totalMinorUnits: 5000000,
        },
      ],
      createdAt: new Date('2026-01-05T10:00:00Z').toISOString(),
    };
    this.invoices.set(inv1.id, inv1);
  }

  // --- Advertisers ---
  public async getAdvertisers(): Promise<AdvertiserItem[]> {
    return Array.from(this.advertisers.values());
  }

  public async getAdvertiserById(id: string): Promise<AdvertiserItem | null> {
    return this.advertisers.get(id) || null;
  }

  public async createAdvertiser(dto: CreateAdvertiserDto): Promise<AdvertiserItem> {
    const id = `adv-${Date.now()}`;
    const now = new Date().toISOString();
    const item: AdvertiserItem = {
      id,
      organizationName: dto.organizationName,
      contactPerson: dto.contactPerson,
      email: dto.email,
      phone: dto.phone,
      billingAddress: dto.billingAddress,
      gstin: dto.gstin,
      category: dto.category,
      accountStatus: 'pending_verification',
      verificationStatus: 'unverified',
      agreementStatus: 'pending',
      activeCampaignsCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.advertisers.set(id, item);
    return item;
  }

  public async updateAdvertiser(id: string, dto: UpdateAdvertiserDto): Promise<AdvertiserItem> {
    const existing = this.advertisers.get(id);
    if (!existing) throw new Error(`Advertiser not found: ${id}`);
    const updated: AdvertiserItem = {
      ...existing,
      ...dto,
      updatedAt: new Date().toISOString(),
    };
    this.advertisers.set(id, updated);
    return updated;
  }

  // --- Campaigns ---
  public async getCampaigns(filters?: { advertiserId?: string; status?: string }): Promise<AdCampaignItem[]> {
    let list = Array.from(this.campaigns.values());
    if (filters?.advertiserId) {
      list = list.filter((c) => c.advertiserId === filters.advertiserId);
    }
    if (filters?.status) {
      list = list.filter((c) => c.status === filters.status);
    }
    return list;
  }

  public async getCampaignById(id: string): Promise<AdCampaignItem | null> {
    return this.campaigns.get(id) || null;
  }

  public async createCampaign(dto: CreateAdCampaignDto): Promise<AdCampaignItem> {
    const advertiser = await this.getAdvertiserById(dto.advertiserId);
    const id = `camp-${Date.now()}`;
    const now = new Date().toISOString();
    const item: AdCampaignItem = {
      id,
      advertiserId: dto.advertiserId,
      advertiserName: advertiser ? advertiser.organizationName : 'Unknown Advertiser',
      campaignName: dto.campaignName,
      description: dto.description,
      objective: dto.objective,
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: 'DRAFT',
      targetDistricts: dto.targetDistricts,
      targetCategories: dto.targetCategories || [],
      selectedPlacements: dto.selectedPlacements,
      totalBudgetMinorUnits: dto.totalBudgetMinorUnits,
      spentBudgetMinorUnits: 0,
      pricingModel: dto.pricingModel || 'CPM',
      createdAt: now,
      updatedAt: now,
    };
    this.campaigns.set(id, item);
    return item;
  }

  public async updateCampaign(id: string, dto: UpdateAdCampaignDto): Promise<AdCampaignItem> {
    const existing = this.campaigns.get(id);
    if (!existing) throw new Error(`Campaign not found: ${id}`);
    const updated: AdCampaignItem = {
      ...existing,
      ...dto,
      updatedAt: new Date().toISOString(),
    };
    this.campaigns.set(id, updated);
    return updated;
  }

  // --- Creatives ---
  public async getCreatives(campaignId?: string): Promise<AdCreativeItem[]> {
    let list = Array.from(this.creatives.values());
    if (campaignId) {
      list = list.filter((c) => c.campaignId === campaignId);
    }
    return list;
  }

  public async getCreativeById(id: string): Promise<AdCreativeItem | null> {
    return this.creatives.get(id) || null;
  }

  public async createCreative(dto: CreateAdCreativeDto): Promise<AdCreativeItem> {
    const id = `cr-${Date.now()}`;
    const now = new Date().toISOString();
    const item: AdCreativeItem = {
      id,
      campaignId: dto.campaignId,
      adSlotCode: dto.adSlotCode,
      creativeType: dto.creativeType,
      creativeMediaUrl: dto.creativeMediaUrl,
      destinationUrl: dto.destinationUrl,
      targetDistrictId: dto.targetDistrictId,
      headlineHi: dto.headlineHi,
      bodyTextHi: dto.bodyTextHi,
      width: dto.width,
      height: dto.height,
      isApproved: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.creatives.set(id, item);
    return item;
  }

  public async updateCreative(id: string, updates: Partial<AdCreativeItem>): Promise<AdCreativeItem> {
    const existing = this.creatives.get(id);
    if (!existing) throw new Error(`Creative not found: ${id}`);
    const updated: AdCreativeItem = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.creatives.set(id, updated);
    return updated;
  }

  // --- Ad Placement Slots ---
  public async getPlacementSlots(): Promise<AdPlacementSlotConfig[]> {
    return AD_PLACEMENT_SLOTS;
  }

  public async getPlacementSlotByCode(code: AdPlacementCode): Promise<AdPlacementSlotConfig | null> {
    const slot = AD_PLACEMENT_SLOTS.find((s) => s.code === code);
    return slot || null;
  }

  // --- Subscriptions & Entitlements ---
  public async getSubscriptionPlans(): Promise<SubscriptionPlanItem[]> {
    return Array.from(this.subscriptionPlans.values());
  }

  public async getSubscriptionPlanByCode(code: string): Promise<SubscriptionPlanItem | null> {
    return this.subscriptionPlans.get(code) || null;
  }

  public async getUserEntitlements(userId: string): Promise<UserEntitlementItem[]> {
    return this.userEntitlements.get(userId) || [];
  }

  public async grantUserEntitlement(
    data: Omit<UserEntitlementItem, 'id' | 'grantedAt' | 'createdAt'>
  ): Promise<UserEntitlementItem> {
    const id = `ent-${Date.now()}`;
    const now = new Date().toISOString();
    const item: UserEntitlementItem = {
      id,
      ...data,
      grantedAt: now,
      createdAt: now,
    };

    const current = this.userEntitlements.get(data.userId) || [];
    current.push(item);
    this.userEntitlements.set(data.userId, current);

    return item;
  }

  // --- Referral Attributions ---
  public async getReferralAttributions(referrerUserId?: string): Promise<ReferralAttributionItem[]> {
    if (referrerUserId) {
      return this.referralAttributions.filter((r) => r.referrerUserId === referrerUserId);
    }
    return this.referralAttributions;
  }

  public async createReferralAttribution(data: {
    referrerUserId: string;
    referrerCode: string;
    referredUserId: string;
  }): Promise<ReferralAttributionItem> {
    const id = `ref-${Date.now()}`;
    const item: ReferralAttributionItem = {
      id,
      referrerUserId: data.referrerUserId,
      referrerCode: data.referrerCode,
      referredUserId: data.referredUserId,
      attributionStatus: 'pending_verification',
      rewardStatus: 'pending_governance_approval', // RULE-REWARD-002
      governanceNote: 'RULE-REWARD-002: Referral reward attribution rule remains Pending Approval. Automatic issuance of coin rewards is disabled.',
      referredAt: new Date().toISOString(),
    };
    this.referralAttributions.push(item);
    return item;
  }

  // --- Payment Orders & Invoices ---
  public async getPaymentOrders(filters?: { advertiserId?: string; userId?: string }): Promise<PaymentOrderItem[]> {
    let list = Array.from(this.paymentOrders.values());
    if (filters?.advertiserId) {
      list = list.filter((p) => p.advertiserId === filters.advertiserId);
    }
    if (filters?.userId) {
      list = list.filter((p) => p.userId === filters.userId);
    }
    return list;
  }

  public async getPaymentOrderById(id: string): Promise<PaymentOrderItem | null> {
    return this.paymentOrders.get(id) || null;
  }

  public async createPaymentOrder(order: Omit<PaymentOrderItem, 'id' | 'createdAt'>): Promise<PaymentOrderItem> {
    const id = `pord-${Date.now()}`;
    const item: PaymentOrderItem = {
      id,
      ...order,
      createdAt: new Date().toISOString(),
    };
    this.paymentOrders.set(id, item);
    return item;
  }

  public async updatePaymentOrder(id: string, updates: Partial<PaymentOrderItem>): Promise<PaymentOrderItem> {
    const existing = this.paymentOrders.get(id);
    if (!existing) throw new Error(`Payment order not found: ${id}`);
    const updated: PaymentOrderItem = {
      ...existing,
      ...updates,
    };
    this.paymentOrders.set(id, updated);
    return updated;
  }

  public async getInvoices(advertiserId?: string): Promise<InvoiceItem[]> {
    let list = Array.from(this.invoices.values());
    if (advertiserId) {
      list = list.filter((i) => i.advertiserId === advertiserId);
    }
    return list;
  }

  public async getInvoiceById(id: string): Promise<InvoiceItem | null> {
    return this.invoices.get(id) || null;
  }

  public async createInvoice(invoice: Omit<InvoiceItem, 'id' | 'createdAt'>): Promise<InvoiceItem> {
    const id = `inv-${Date.now()}`;
    const item: InvoiceItem = {
      id,
      ...invoice,
      createdAt: new Date().toISOString(),
    };
    this.invoices.set(id, item);
    return item;
  }

  public async updateInvoice(id: string, updates: Partial<InvoiceItem>): Promise<InvoiceItem> {
    const existing = this.invoices.get(id);
    if (!existing) throw new Error(`Invoice not found: ${id}`);
    const updated: InvoiceItem = {
      ...existing,
      ...updates,
    };
    this.invoices.set(id, updated);
    return updated;
  }

  // --- Dashboard Stats & Event Recording ---
  public async getDashboardStats(): Promise<MonetizationDashboardStats> {
    const activeCampaigns = Array.from(this.campaigns.values()).filter((c) => c.status === 'ACTIVE').length;
    const totalAdvertisers = this.advertisers.size;
    const pendingCreatives = Array.from(this.creatives.values()).filter((c) => !c.isApproved).length;

    return {
      activeCampaignsCount: activeCampaigns,
      totalAdvertisersCount: totalAdvertisers,
      totalImpressionsServed: this.totalImpressions,
      totalValidClicks: this.totalValidClicks,
      verifiedAdRevenuePaise: this.verifiedRevenuePaise,
      pendingCreativesCount: pendingCreatives,
      activeSubscribersCount: 0, // DEC-070 DEFERRED
    };
  }

  public async recordImpressionEvent(_creativeId: string, isValid: boolean): Promise<void> {
    if (isValid) {
      this.totalImpressions += 1;
    }
  }

  public async recordClickEvent(_creativeId: string, isValid: boolean): Promise<void> {
    if (isValid) {
      this.totalValidClicks += 1;
    }
  }
}
