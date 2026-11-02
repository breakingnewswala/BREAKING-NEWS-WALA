/**
 * BREAKING NEWS WALA — Monetization & Advertising Express Routes
 * Grounded in docs/13-API.md, docs/Monetization.md, and docs/DECISIONS.md
 */

import { Router } from 'express';
import { MonetizationController } from './monetization.controller';
import { MonetizationService } from './monetization.service';
import { InMemoryMonetizationRepository } from './monetization.repository';
import { RazorpayAdapter } from './gateways/razorpay.adapter';

// Singletons for standard route mounts
export const defaultMonetizationRepository = new InMemoryMonetizationRepository();
export const defaultPaymentAdapter = new RazorpayAdapter();
export const defaultMonetizationService = new MonetizationService(
  defaultMonetizationRepository,
  defaultPaymentAdapter
);
export const defaultMonetizationController = new MonetizationController(defaultMonetizationService);

// ============================================================================
// 1. Public & Client Monetization Router (/api/v1/monetization)
// ============================================================================

export const monetizationRouter = Router();

// Ad Delivery & Interaction
monetizationRouter.get('/ads/serve', defaultMonetizationController.serveAd);
monetizationRouter.post('/ads/impression', defaultMonetizationController.recordImpression);
monetizationRouter.post('/ads/click', defaultMonetizationController.recordClick);

// Subscription & Reader Entitlements (DEC-070)
monetizationRouter.get('/plans', defaultMonetizationController.getSubscriptionPlans);
monetizationRouter.get('/entitlements/me', defaultMonetizationController.getUserEntitlements);
monetizationRouter.post('/subscribe', defaultMonetizationController.initiateSubscriptionCheckout);

// Non-Monetary Perk Redemption (DEC-007)
monetizationRouter.post('/coins/redeem-perk', defaultMonetizationController.redeemCoinPerk);

// Referral Tracking (RULE-REWARD-002)
monetizationRouter.post('/referrals/track', defaultMonetizationController.trackReferral);

// Payment Gateway Webhooks (DEC-068)
monetizationRouter.post('/webhooks/razorpay', defaultMonetizationController.handlePaymentWebhook);

// ============================================================================
// 2. Admin Monetization Control Router (/api/v1/admin/monetization)
// ============================================================================

export const adminMonetizationRouter = Router();

// Dashboard Statistics
adminMonetizationRouter.get('/stats', defaultMonetizationController.getDashboardStats);

// Placement Inventory Slots
adminMonetizationRouter.get('/placements', defaultMonetizationController.getPlacementSlots);

// Advertisers & Agencies
adminMonetizationRouter.get('/advertisers', defaultMonetizationController.getAdvertisers);
adminMonetizationRouter.post('/advertisers', defaultMonetizationController.createAdvertiser);
adminMonetizationRouter.get('/advertisers/:id', defaultMonetizationController.getAdvertiser);
adminMonetizationRouter.put('/advertisers/:id', defaultMonetizationController.updateAdvertiser);
adminMonetizationRouter.post('/advertisers/:id/verify', defaultMonetizationController.verifyAdvertiser);
adminMonetizationRouter.post('/advertisers/:id/suspend', defaultMonetizationController.suspendAdvertiser);

// Ad Campaigns
adminMonetizationRouter.get('/campaigns', defaultMonetizationController.getCampaigns);
adminMonetizationRouter.post('/campaigns', defaultMonetizationController.createCampaign);
adminMonetizationRouter.get('/campaigns/:id', defaultMonetizationController.getCampaign);
adminMonetizationRouter.put('/campaigns/:id', defaultMonetizationController.updateCampaign);
adminMonetizationRouter.post('/campaigns/:id/submit', defaultMonetizationController.submitCampaign);
adminMonetizationRouter.post('/campaigns/:id/approve', defaultMonetizationController.approveCampaign);
adminMonetizationRouter.post('/campaigns/:id/reject', defaultMonetizationController.rejectCampaign);
adminMonetizationRouter.post('/campaigns/:id/pause', defaultMonetizationController.pauseCampaign);
adminMonetizationRouter.post('/campaigns/:id/resume', defaultMonetizationController.resumeCampaign);

// Creatives
adminMonetizationRouter.get('/creatives', defaultMonetizationController.getCreatives);
adminMonetizationRouter.post('/creatives', defaultMonetizationController.createCreative);
adminMonetizationRouter.post('/creatives/:id/approve', defaultMonetizationController.approveCreative);
adminMonetizationRouter.post('/creatives/:id/reject', defaultMonetizationController.rejectCreative);

// Invoices & Billing (SAC 998363 & 18% GST)
adminMonetizationRouter.get('/invoices', defaultMonetizationController.getInvoices);
adminMonetizationRouter.post('/invoices', defaultMonetizationController.createInvoice);
adminMonetizationRouter.get('/invoices/:id', defaultMonetizationController.getInvoice);

// Payment Orders
adminMonetizationRouter.post('/payment-orders', defaultMonetizationController.createPaymentOrder);

// Referral Attributions (RULE-REWARD-002)
adminMonetizationRouter.get('/referrals', defaultMonetizationController.getReferralAttributions);

