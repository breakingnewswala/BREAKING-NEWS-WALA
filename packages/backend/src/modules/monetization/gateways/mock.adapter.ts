/**
 * BREAKING NEWS WALA — Mock Deterministic Payment Gateway Adapter
 * Used for automated test suites and isolated sandbox environments.
 */

import crypto from 'crypto';
import {
  IPaymentGatewayAdapter,
  CreateGatewayOrderParams,
  GatewayOrderResult,
  WebhookVerificationResult,
} from './payment.gateway.interface';

export class MockPaymentAdapter implements IPaymentGatewayAdapter {
  readonly providerName = 'mock_sandbox';
  private testSecret = 'mock_sandbox_secret_key';

  public async createOrder(params: CreateGatewayOrderParams): Promise<GatewayOrderResult> {
    const providerOrderId = `order_mock_${crypto.randomBytes(6).toString('hex')}`;
    return {
      providerOrderId,
      amountMinorUnits: params.amountMinorUnits,
      currency: params.currency || 'INR',
      status: 'created',
      checkoutPayload: {
        gateway: 'mock_sandbox',
        orderId: providerOrderId,
        amount: params.amountMinorUnits,
      },
    };
  }

  public verifyWebhookSignature(rawBody: string, signature: string, secret?: string): boolean {
    const key = secret || this.testSecret;
    const expected = crypto.createHmac('sha256', key).update(rawBody).digest('hex');
    return signature === expected;
  }

  public async parseWebhookEvent(rawBody: string, signature: string): Promise<WebhookVerificationResult> {
    const isValid = this.verifyWebhookSignature(rawBody, signature);
    if (!isValid) return { isValid: false, error: 'Invalid mock signature' };

    try {
      const data = JSON.parse(rawBody);
      return {
        isValid: true,
        event: data.event || 'payment.captured',
        providerPaymentId: data.paymentId || 'pay_mock_12345',
        providerOrderId: data.orderId,
        amountMinorUnits: data.amount,
      };
    } catch (err: any) {
      return { isValid: false, error: err.message };
    }
  }

  public generateMockSignature(rawBody: string, secret?: string): string {
    const key = secret || this.testSecret;
    return crypto.createHmac('sha256', key).update(rawBody).digest('hex');
  }
}

