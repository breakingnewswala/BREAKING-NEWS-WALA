/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Cryptographic Webhook Verifier & Replay Shield
 * Grounded in docs/20-Integrations.md (Section 5) and docs/15-Security.md
 */

import crypto from 'node:crypto';

export class WebhookVerifier {
  // In-memory LRU cache storing recently seen webhook nonces with timestamps
  static seenNonces = new Map();
  static NONCE_RETENTION_MS = 10 * 60 * 1000; // 10 minutes
  static MAX_TIMESTAMP_DRIFT_SEC = 300; // 5 minutes (300 seconds)

  /**
   * Verifies an incoming webhook payload using HMAC-SHA256
   * @param {string|Buffer} rawBody
   * @param {string} signatureHeader
   * @param {string} secret
   * @returns {boolean}
   */
  static verifyHmacSignature(rawBody, signatureHeader, secret) {
    if (!signatureHeader || !secret) return false;

    try {
      // Signature header may come prefixed with "sha256=" (e.g. Meta / GitHub style)
      const cleanExpected = signatureHeader.replace(/^sha256=/, '').trim();
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(rawBody);
      const computed = hmac.digest('hex');

      if (cleanExpected.length !== computed.length) return false;
      return crypto.timingSafeEqual(
        Buffer.from(cleanExpected, 'hex'),
        Buffer.from(computed, 'hex')
      );
    } catch {
      return false;
    }
  }

  /**
   * Validates timestamp freshness to prevent stale replay requests
   * @param {string|number} timestampHeader
   * @param {number} [maxDriftSec]
   * @returns {boolean}
   */
  static verifyTimestampFreshness(timestampHeader, maxDriftSec = WebhookVerifier.MAX_TIMESTAMP_DRIFT_SEC) {
    if (!timestampHeader) return false;

    let timestampMs;
    if (typeof timestampHeader === 'number') {
      timestampMs = timestampHeader < 1e12 ? timestampHeader * 1000 : timestampHeader;
    } else {
      const parsed = parseInt(timestampHeader, 10);
      if (isNaN(parsed)) return false;
      timestampMs = parsed < 1e12 ? parsed * 1000 : parsed;
    }

    const now = Date.now();
    const driftSec = Math.abs(now - timestampMs) / 1000;
    return driftSec <= maxDriftSec;
  }

  /**
   * Validates that the request nonce has not been seen within the retention window
   * @param {string} [nonce]
   * @returns {boolean}
   */
  static verifyNonceUnique(nonce) {
    if (!nonce) return true;

    this.pruneExpiredNonces();

    if (this.seenNonces.has(nonce)) {
      return false; // Replay attack detected!
    }

    this.seenNonces.set(nonce, Date.now());
    return true;
  }

  static pruneExpiredNonces() {
    const cutoff = Date.now() - this.NONCE_RETENTION_MS;
    for (const [nonce, timestamp] of this.seenNonces.entries()) {
      if (timestamp < cutoff) {
        this.seenNonces.delete(nonce);
      }
    }
  }

  /**
   * Comprehensive validation pipeline
   * @param {{ providerId: string, rawBody: string|Buffer, signatureHeader?: string, timestampHeader?: string|number, nonce?: string, secret?: string }} params
   * @returns {{ isValid: boolean, provider: string, eventType?: string, error?: string, timestampFresh: boolean, nonceUnique: boolean }}
   */
  static verifyWebhookRequest(params) {
    const { providerId, rawBody, signatureHeader, timestampHeader, nonce, secret } = params;

    const timestampFresh = timestampHeader
      ? this.verifyTimestampFreshness(timestampHeader)
      : true;

    if (!secret || !signatureHeader) {
      return {
        isValid: false,
        provider: providerId,
        error: 'Missing webhook secret or signature header',
        signatureValid: false,
        timestampFresh,
        nonceUnique: true,
      };
    }

    // 1. Signature Check
    const isSigValid = this.verifyHmacSignature(rawBody, signatureHeader, secret);
    if (!isSigValid) {
      return {
        isValid: false,
        provider: providerId,
        error: 'Cryptographic signature mismatch (HMAC-SHA256 failed)',
        signatureValid: false,
        timestampFresh,
        nonceUnique: true,
      };
    }

    // 2. Timestamp Freshness Check
    if (!timestampFresh) {
      return {
        isValid: false,
        provider: providerId,
        error: 'Webhook request timestamp is expired or outside allowable drift window (max 300s)',
        signatureValid: true,
        timestampFresh: false,
        nonceUnique: true,
      };
    }

    // 3. Replay Nonce Check
    const nonceUnique = this.verifyNonceUnique(nonce);
    if (!nonceUnique) {
      return {
        isValid: false,
        provider: providerId,
        error: 'Duplicate webhook event nonce detected (Replay attack prevented)',
        signatureValid: true,
        timestampFresh,
        nonceUnique: false,
      };
    }

    return {
      isValid: true,
      provider: providerId,
      eventType: 'webhook_verified',
      signatureValid: true,
      timestampFresh,
      nonceUnique: true,
    };
  }
}
