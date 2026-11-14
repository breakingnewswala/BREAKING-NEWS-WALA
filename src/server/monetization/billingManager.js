/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Billing, GST Invoicing & Commercial Revenue Analytics Engine
 * Grounded in docs/Monetization.md (Sections 8 & 14) and SAC 998363 (18% GST)
 */

import crypto from 'node:crypto';
import { BILLING_CONSTANTS, MONETIZATION_ERROR_CODES } from './constants.js';

export class BillingManager {
  constructor(adapter) {
    this.adapter = adapter;
    this.taxConfig = {
      sacCode: BILLING_CONSTANTS.SAC_CODE,
      gstRatePercent: BILLING_CONSTANTS.GST_RATE_PERCENT,
      cgstRatePercent: BILLING_CONSTANTS.CGST_RATE_PERCENT,
      sgstRatePercent: BILLING_CONSTANTS.SGST_RATE_PERCENT,
      igstRatePercent: BILLING_CONSTANTS.IGST_RATE_PERCENT,
      homeStateCode: BILLING_CONSTANTS.HOME_STATE_CODE_MP,
      homeStateName: BILLING_CONSTANTS.HOME_STATE_NAME,
    };
    this.init();
  }

  async init() {
    // Seed initial demo invoices if empty
    const existing = await this.adapter.getInvoices();
    if (!existing || existing.length === 0) {
      const seedInvoice = {
        id: 'inv-2026-0001',
        invoiceNumber: 'INV-2026-00001',
        advertiserId: 'adv-mp-tourism-001',
        customerName: 'मध्य प्रदेश राज्य पर्यटन विकास निगम (MP Tourism)',
        customerGstin: '23AAACT1234F1Z5',
        customerAddress: 'पर्यटन भवन, भदभदा रोड, भोपाल, म.प्र. - 462003',
        customerStateCode: '23',
        sacCode: '998363',
        lineItems: [
          {
            description: 'शीर्ष हेडर लीडरबोर्ड विज्ञापन स्लॉट (नवंबर-दिसंबर 2026)',
            quantity: 1,
            unitPricePaise: 4500000,
            amountPaise: 4500000,
          },
        ],
        subtotalPaise: 4500000,
        discountPaise: 0,
        taxableAmountPaise: 4500000,
        cgstPaise: 405000, // 9%
        sgstPaise: 405000, // 9%
        igstPaise: 0,
        totalTaxPaise: 810000, // 18%
        totalAmountPaise: 5310000, // ₹53,100
        totalAmountRupees: '53100.00',
        currency: 'INR',
        status: 'PAID', // DRAFT, ISSUED, PAID, PARTIALLY_PAID, OVERDUE, VOID, REFUNDED
        dueDate: '2026-11-15T00:00:00.000Z',
        paidAt: '2026-11-01T11:00:00.000Z',
        transactionId: 'txn-seed-001',
        notes: 'मांडू महोत्सव 2026 प्रचार अभियान',
        createdAt: '2026-11-01T10:00:00.000Z',
        updatedAt: '2026-11-01T11:00:00.000Z',
      };
      await this.adapter.saveInvoice(seedInvoice);
    }
  }

  getTaxConfig() {
    return { ...this.taxConfig };
  }

  updateTaxConfig(newConfig, user) {
    if (newConfig.gstRatePercent !== undefined) {
      this.taxConfig.gstRatePercent = Number(newConfig.gstRatePercent);
      this.taxConfig.cgstRatePercent = Number(newConfig.gstRatePercent) / 2;
      this.taxConfig.sgstRatePercent = Number(newConfig.gstRatePercent) / 2;
      this.taxConfig.igstRatePercent = Number(newConfig.gstRatePercent);
    }
    if (newConfig.sacCode) this.taxConfig.sacCode = newConfig.sacCode;

    this.adapter.addAuditLog(
      user?.fullName || 'फाइनेंस एडमिन',
      'MONETIZATION',
      'TAX_CONFIG_UPDATED',
      `कर विन्यास अद्यतित: GST ${this.taxConfig.gstRatePercent}%, SAC ${this.taxConfig.sacCode}`,
      null
    );

    return this.getTaxConfig();
  }

  generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const rand = Math.floor(10000 + Math.random() * 90000);
    return `${BILLING_CONSTANTS.INVOICE_PREFIX}-${year}-${rand}`;
  }

  /**
   * Creates an itemized GST-compliant commercial invoice
   */
  async createInvoice({
    advertiserId,
    customerName,
    customerGstin = '',
    customerAddress = '',
    customerStateCode = '23',
    lineItems = [],
    discountPaise = 0,
    dueDate,
    notes = '',
    campaignId = null,
  }, user) {
    if (!customerName || !lineItems || lineItems.length === 0) {
      throw new Error('Customer name and at least one line item are required');
    }

    const calculatedItems = lineItems.map((item) => {
      const qty = Number(item.quantity || 1);
      const unitPrice = Number(item.unitPricePaise || item.amountPaise || 0);
      return {
        description: item.description || 'विज्ञापन व मीडिया सेवाएं',
        quantity: qty,
        unitPricePaise: unitPrice,
        amountPaise: qty * unitPrice,
      };
    });

    const subtotalPaise = calculatedItems.reduce((acc, it) => acc + it.amountPaise, 0);
    const discPaise = Number(discountPaise || 0);
    const taxableAmountPaise = Math.max(0, subtotalPaise - discPaise);

    // Calculate GST based on state of supply
    const isIntraState = String(customerStateCode) === String(this.taxConfig.homeStateCode);
    let cgstPaise = 0;
    let sgstPaise = 0;
    let igstPaise = 0;

    if (isIntraState) {
      cgstPaise = Math.round(taxableAmountPaise * (this.taxConfig.cgstRatePercent / 100));
      sgstPaise = Math.round(taxableAmountPaise * (this.taxConfig.sgstRatePercent / 100));
    } else {
      igstPaise = Math.round(taxableAmountPaise * (this.taxConfig.igstRatePercent / 100));
    }

    const totalTaxPaise = cgstPaise + sgstPaise + igstPaise;
    const totalAmountPaise = taxableAmountPaise + totalTaxPaise;

    const invoice = {
      id: `inv-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      invoiceNumber: this.generateInvoiceNumber(),
      advertiserId: advertiserId || null,
      campaignId: campaignId || null,
      customerName,
      customerGstin: customerGstin ? customerGstin.toUpperCase().trim() : '',
      customerAddress,
      customerStateCode,
      sacCode: this.taxConfig.sacCode,
      lineItems: calculatedItems,
      subtotalPaise,
      discountPaise: discPaise,
      taxableAmountPaise,
      cgstPaise,
      sgstPaise,
      igstPaise,
      totalTaxPaise,
      totalAmountPaise,
      totalAmountRupees: (totalAmountPaise / 100).toFixed(2),
      currency: BILLING_CONSTANTS.CURRENCY_INR,
      status: 'ISSUED', // DRAFT, ISSUED, PAID, PARTIALLY_PAID, OVERDUE, VOID, REFUNDED
      dueDate: dueDate || new Date(Date.now() + 15 * 86400000).toISOString(),
      paidAt: null,
      transactionId: null,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.adapter.saveInvoice(invoice, user);

    this.adapter.addAuditLog(
      user?.fullName || 'फाइनेंस',
      'MONETIZATION',
      'INVOICE_GENERATED',
      `चालान जारी: ${saved.invoiceNumber} -> ${saved.customerName} (₹${saved.totalAmountRupees})`,
      null
    );

    return saved;
  }

  async getInvoices({ status, advertiserId } = {}) {
    let list = await this.adapter.getInvoices();
    if (status) {
      list = list.filter((i) => i.status === status);
    }
    if (advertiserId) {
      list = list.filter((i) => i.advertiserId === advertiserId);
    }
    return list;
  }

  async getInvoiceById(invoiceId) {
    return this.adapter.getInvoiceById(invoiceId);
  }

  async markInvoicePaid(invoiceId, { transactionId, paidAt }, user) {
    const inv = await this.getInvoiceById(invoiceId);
    if (!inv) throw new Error('Invoice not found');

    inv.status = 'PAID';
    inv.paidAt = paidAt || new Date().toISOString();
    inv.transactionId = transactionId || inv.transactionId || `txn-manual-${Date.now()}`;
    inv.updatedAt = new Date().toISOString();

    const saved = await this.adapter.saveInvoice(inv, user);

    this.adapter.addAuditLog(
      user?.fullName || 'फाइनेंस',
      'MONETIZATION',
      'INVOICE_PAID',
      `चालान भुगतान दर्ज: ${inv.invoiceNumber} (₹${inv.totalAmountRupees}) [Txn: ${inv.transactionId}]`,
      null
    );

    return saved;
  }

  /**
   * Computes comprehensive business & revenue dashboard summary
   */
  async getBusinessDashboardSummary() {
    const [transactions, orders, invoices, subscriptions, campaigns, refunds] = await Promise.all([
      this.adapter.getTransactions(),
      this.adapter.getPaymentOrders(),
      this.adapter.getInvoices(),
      this.adapter.getCustomerSubscriptions(),
      this.adapter.getCampaigns(),
      this.adapter.getRefunds(),
    ]);

    // Realized Revenue: Sum of settled, non-refunded transactions
    let totalRealizedRevenuePaise = 0;
    let monthlyRealizedRevenuePaise = 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const successfulTransactions = transactions.filter((t) => t.status === 'SUCCESS');
    const failedTransactions = orders.filter((o) => o.status === 'FAILED');

    for (const t of successfulTransactions) {
      const netAmount = t.amountPaise - (t.refundedAmountPaise || 0);
      totalRealizedRevenuePaise += netAmount;

      const tDate = new Date(t.createdAt);
      if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
        monthlyRealizedRevenuePaise += netAmount;
      }
    }

    // Revenue by Source
    let adRevenuePaise = 0;
    let sponsoredRevenuePaise = 0;
    let subscriptionRevenuePaise = 0;
    let partnerRevenuePaise = 0;

    for (const t of successfulTransactions) {
      const net = t.amountPaise - (t.refundedAmountPaise || 0);
      if (t.purpose === 'AD_CAMPAIGN') adRevenuePaise += net;
      else if (t.purpose === 'SPONSORED_CONTENT') sponsoredRevenuePaise += net;
      else if (t.purpose === 'SUBSCRIPTION') subscriptionRevenuePaise += net;
      else partnerRevenuePaise += net;
    }

    // Projected Revenue: Sum of active campaign budgets + issued unpaid invoices
    let projectedRevenuePaise = 0;
    for (const c of campaigns) {
      if (c.status === 'active' || c.status === 'approved') {
        const remaining = Math.max(0, (c.budgetTotalPaise || 0) - (c.budgetSpentPaise || 0));
        projectedRevenuePaise += remaining;
      }
    }
    const pendingInvoices = invoices.filter((i) => i.status === 'ISSUED' || i.status === 'OVERDUE');
    let outstandingReceivablesPaise = 0;
    for (const i of pendingInvoices) {
      outstandingReceivablesPaise += i.totalAmountPaise;
      projectedRevenuePaise += i.totalAmountPaise;
    }

    // Subscriptions
    const activeSubscriptions = subscriptions.filter((s) => s.status === 'ACTIVE' || s.status === 'TRIALING');

    // Refunds
    let totalRefundsPaise = 0;
    for (const r of refunds) {
      totalRefundsPaise += r.amountPaise || 0;
    }

    // Revenue Trend: Monthly buckets for past 6 months
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yIdx = d.getFullYear();
      const monthName = d.toLocaleDateString('hi-IN', { month: 'short', year: '2-digit' });

      let monthTotal = 0;
      for (const t of successfulTransactions) {
        const dt = new Date(t.createdAt);
        if (dt.getMonth() === mIdx && dt.getFullYear() === yIdx) {
          monthTotal += t.amountPaise - (t.refundedAmountPaise || 0);
        }
      }

      monthlyTrends.push({
        month: monthName,
        revenueRupees: Number((monthTotal / 100).toFixed(2)),
      });
    }

    return {
      revenue: {
        totalRealizedRupees: (totalRealizedRevenuePaise / 100).toFixed(2),
        monthlyRealizedRupees: (monthlyRealizedRevenuePaise / 100).toFixed(2),
        projectedRupees: (projectedRevenuePaise / 100).toFixed(2),
        outstandingReceivablesRupees: (outstandingReceivablesPaise / 100).toFixed(2),
        refundsTotalRupees: (totalRefundsPaise / 100).toFixed(2),
        bySource: {
          advertisingRupees: (adRevenuePaise / 100).toFixed(2),
          sponsoredRupees: (sponsoredRevenuePaise / 100).toFixed(2),
          subscriptionsRupees: (subscriptionRevenuePaise / 100).toFixed(2),
          partnersRupees: (partnerRevenuePaise / 100).toFixed(2),
        },
      },
      counts: {
        successfulTransactions: successfulTransactions.length,
        failedTransactions: failedTransactions.length,
        pendingOrders: orders.filter((o) => o.status === 'PENDING').length,
        activeSubscriptions: activeSubscriptions.length,
        totalRefunds: refunds.length,
        activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
      },
      monthlyTrends,
      rates: {
        paymentFailureRate: orders.length > 0 ? Number(((failedTransactions.length / orders.length) * 100).toFixed(1)) : 0,
        refundRate: successfulTransactions.length > 0 ? Number(((refunds.length / successfulTransactions.length) * 100).toFixed(1)) : 0,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

