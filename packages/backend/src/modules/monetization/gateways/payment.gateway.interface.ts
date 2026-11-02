/**
 * BREAKING NEWS WALA — Payment Gateway Adapter Interface
 * Grounded in docs/DECISIONS.md (DEC-068: Primary Razorpay UPI/Card with secondary adapters)
 * Strict Zero Raw Card Storage (PCI-DSS compliance)
 */

export interface CreateGatewayOrderParams {
  orderNumber: string;
  amountMinorUnits: number; // in paise
  currency: string;         // 'INR'
  receipt: string;
  notes?: Record<string, string>;
}

export interface GatewayOrderResult {
  providerOrderId: string;
  amountMinorUnits: number;
  currency: string;
  status: 'created' | 'attempted' | 'paid';
  checkoutPayload: Record<string, any>;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  event?: string;
  providerPaymentId?: string;
  providerOrderId?: string;
  amountMinorUnits?: number;
  error?: string;
}

export interface IPaymentGatewayAdapter {
  readonly providerName: string;

  /**
   * Creates an order with the payment provider
   */
  createOrder(params: CreateGatewayOrderParams): Promise<GatewayOrderResult>;

  /**
   * Verifies incoming webhook signature (HMAC-SHA256)
   */
  verifyWebhookSignature(rawBody: string, signature: string, secret?: string): boolean;

  /**
   * Parses and validates a webhook event payload
   */
  parseWebhookEvent(rawBody: string, signature: string): Promise<WebhookVerificationResult>;
}

