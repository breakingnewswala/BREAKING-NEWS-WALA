/**
 * BREAKING NEWS WALA — Monetization Internal Domain Types
 * Grounded in docs/Monetization.md and packages/types
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

export interface TaxCalculationResult {
  subtotalMinorUnits: number;
  cgstMinorUnits: number;
  sgstMinorUnits: number;
  igstMinorUnits: number;
  totalMinorUnits: number;
  isIntrastateMP: boolean;
}

export interface AdDeliveryServingResult {
  served: boolean;
  adSlotCode: AdPlacementCode;
  creative?: {
    id: string;
    campaignId: string;
    advertiserName: string;
    headlineHi?: string;
    bodyTextHi?: string;
    destinationUrl: string;
    mediaUrl?: string;
    creativeType: string;
    width?: number;
    height?: number;
    asciLabel: string; // "विज्ञापन" / "प्रायोजित"
  };
  reason?: string;
}

export interface ImpressionVerificationDto {
  creativeId: string;
  adSlotCode: AdPlacementCode;
  viewDurationMs: number;
  viewPercentage: number;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
}

export interface ClickVerificationDto {
  creativeId: string;
  adSlotCode: AdPlacementCode;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
}

export interface CreateInvoiceDto {
  advertiserId: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPriceMinorUnits: number;
    sacCode?: string;
  }>;
  stateCode?: string; // 23 for MP (intrastate)
  dueDays?: number;
}

export interface IMonetizationRepository {
  // Advertisers
  getAdvertisers(): Promise<AdvertiserItem[]>;
  getAdvertiserById(id: string): Promise<AdvertiserItem | null>;
  createAdvertiser(dto: CreateAdvertiserDto): Promise<AdvertiserItem>;
  updateAdvertiser(id: string, dto: UpdateAdvertiserDto): Promise<AdvertiserItem>;

  // Campaigns
  getCampaigns(filters?: { advertiserId?: string; status?: string }): Promise<AdCampaignItem[]>;
  getCampaignById(id: string): Promise<AdCampaignItem | null>;
  createCampaign(dto: CreateAdCampaignDto): Promise<AdCampaignItem>;
  updateCampaign(id: string, dto: UpdateAdCampaignDto): Promise<AdCampaignItem>;

  // Creatives
  getCreatives(campaignId?: string): Promise<AdCreativeItem[]>;
  getCreativeById(id: string): Promise<AdCreativeItem | null>;
  createCreative(dto: CreateAdCreativeDto): Promise<AdCreativeItem>;
  updateCreative(id: string, updates: Partial<AdCreativeItem>): Promise<AdCreativeItem>;

  // Ad Placement Configuration
  getPlacementSlots(): Promise<AdPlacementSlotConfig[]>;
  getPlacementSlotByCode(code: AdPlacementCode): Promise<AdPlacementSlotConfig | null>;

  // Subscriptions & Entitlements
  getSubscriptionPlans(): Promise<SubscriptionPlanItem[]>;
  getSubscriptionPlanByCode(code: string): Promise<SubscriptionPlanItem | null>;
  getUserEntitlements(userId: string): Promise<UserEntitlementItem[]>;
  grantUserEntitlement(entitlement: Omit<UserEntitlementItem, 'id' | 'grantedAt' | 'createdAt'>): Promise<UserEntitlementItem>;

  // Referral Attributions
  getReferralAttributions(referrerUserId?: string): Promise<ReferralAttributionItem[]>;
  createReferralAttribution(data: { referrerUserId: string; referrerCode: string; referredUserId: string }): Promise<ReferralAttributionItem>;

  // Payment Orders & Invoices
  getPaymentOrders(filters?: { advertiserId?: string; userId?: string }): Promise<PaymentOrderItem[]>;
  getPaymentOrderById(id: string): Promise<PaymentOrderItem | null>;
  createPaymentOrder(order: Omit<PaymentOrderItem, 'id' | 'createdAt'>): Promise<PaymentOrderItem>;
  updatePaymentOrder(id: string, updates: Partial<PaymentOrderItem>): Promise<PaymentOrderItem>;

  getInvoices(advertiserId?: string): Promise<InvoiceItem[]>;
  getInvoiceById(id: string): Promise<InvoiceItem | null>;
  createInvoice(invoice: Omit<InvoiceItem, 'id' | 'createdAt'>): Promise<InvoiceItem>;
  updateInvoice(id: string, updates: Partial<InvoiceItem>): Promise<InvoiceItem>;

  // Stats
  getDashboardStats(): Promise<MonetizationDashboardStats>;
  recordImpressionEvent(creativeId: string, isValid: boolean): Promise<void>;
  recordClickEvent(creativeId: string, isValid: boolean): Promise<void>;
}

