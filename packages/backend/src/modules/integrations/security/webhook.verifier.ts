/**
 * BREAKING NEWS WALA — Cryptographic Webhook Verifier & Replay Shield
 * Grounded in docs/20-Integrations.md (Section 5) and docs/15-Security.md
 */

import crypto from 'crypto';
import { WebhookVerificationResult } from '@bnw/types';

export class WebhookVerifier {
  // Circular LRU cache storing recently seen webhook nonces with timestamps
  private static seenNonces: Map<string, number> = new Map();
  private static readonly NONCE_RETENTION_MS = 10 * 60 * 1000; // 10 minutes
  private static readonly MAX_TIMESTAMP_DRIFT_SEC = 300; // 5 minutes

  /**
   * Verifies an incoming webhook payload using HMAC-SHA256
   */
  public static verifyHmacSignature(
    rawBody: string | Buffer,
    signatureHeader: string,
    secret: string
  ): boolean {
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
   */
  public static verifyTimestampFreshness(
    timestampHeader?: string | number,
    maxDriftSec = WebhookVerifier.MAX_TIMESTAMP_DRIFT_SEC
  ): boolean {
    if (!timestampHeader) return false;

    let timestampMs: number;
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
   */
  public static verifyNonceUnique(nonce?: string): boolean {
    if (!nonce) return true; // If provider doesn't use nonces, rely on timestamp

    this.pruneExpiredNonces();

    if (this.seenNonces.has(nonce)) {
      return false; // Replay attack detected!
    }

    this.seenNonces.set(nonce, Date.now());
    return true;
  }

  /**
   * Comprehensive validation pipeline
   */
  public static verifyWebhookRequest(params: {
    providerId: string;
    rawBody: string | Buffer;
    signatureHeader?: string;
    timestampHeader?: string | number;
    nonce?: string;
    secret?: string;
  }): WebhookVerificationResult {
    const { providerId, rawBody, signatureHeader, timestampHeader, nonce, secret } = params;

    if (!secret || !signatureHeader) {
      return {
        isValid: false,
        provider: providerId,
        error: 'Missing webhook secret or signature header',
        timestampFresh: false,
        nonceUnique: true,
      };
    }

    const timestampFresh = timestampHeader
      ? this.verifyTimestampFreshness(timestampHeader)
      : true;

    if (!timestampFresh) {
      return {
        isValid: false,
        provider: providerId,
        error: 'Webhook request timestamp is stale (exceeds 300s drift window)',
        timestampFresh: false,
        nonceUnique: true,
      };
    }

    const nonceUnique = this.verifyNonceUnique(nonce);
    if (!nonceUnique) {
      return {
        isValid: false,
        provider: providerId,
        error: 'Replay attack detected: Webhook nonce has already been processed',
        timestampFresh: true,
        nonceUnique: false,
      };
    }

    const isSignatureValid = this.verifyHmacSignature(rawBody, signatureHeader, secret);
    if (!isSignatureValid) {
      return {
        isValid: false,
        provider: providerId,
        error: 'HMAC-SHA256 signature verification failed',
        timestampFresh: true,
        nonceUnique: true,
      };
    }

    return {
      isValid: true,
      provider: providerId,
      timestampFresh: true,
      nonceUnique: true,
    };
  }

  private static pruneExpiredNonces(): void {
    const cutoff = Date.now() - this.NONCE_RETENTION_MS;
    for (const [nonce, ts] of this.seenNonces.entries()) {
      if (ts < cutoff) {
        this.seenNonces.delete(nonce);
      }
    }
  }

  public static clearNonceCacheForTesting(): void {
    this.seenNonces.clear();
  }
}

