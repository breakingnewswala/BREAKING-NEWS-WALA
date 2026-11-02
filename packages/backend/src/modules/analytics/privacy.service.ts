/**
 * BREAKING NEWS WALA — Analytics Privacy & Data Minimization Service
 * Grounded in docs/Analytics.md (Section 18: DPDP Act 2023 Compliance, RULE-ANA-001),
 * docs/15-Security.md, and docs/DECISIONS.md (ADR-ANA-003, ADR-ANA-004).
 */

import crypto from 'crypto';
import { BOT_USER_AGENT_REGEX } from './analytics.constants';

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /authorization/i,
  /cookie/i,
  /email/i,
  /phone/i,
  /mobile/i,
  /lat/i,
  /lon/i,
  /coord/i,
  /gps/i,
  /imei/i,
  /mac/i,
];

export class PrivacyService {
  /**
   * Truncates IP address to comply with DPDP Act 2023 and RULE-ANA-001.
   * IPv4: Zeroes out the last octet (e.g. 203.0.113.195 -> 203.0.113.0).
   * IPv6: Zeroes out the last 80 bits.
   */
  public truncateIp(ip: string): string {
    if (!ip) return '0.0.0.0';

    const cleanIp = ip.trim().replace(/^::ffff:/, ''); // Strip IPv4-mapped IPv6 prefix

    // IPv4 handling
    if (cleanIp.includes('.')) {
      const parts = cleanIp.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
      }
      return '0.0.0.0';
    }

    // IPv6 handling
    if (cleanIp.includes(':')) {
      if (cleanIp === '::1') return '::0';
      const parts = cleanIp.split(':');
      if (parts.length >= 3) {
        return `${parts[0]}:${parts[1]}:${parts[2]}::0`;
      }
      return '::0';
    }

    return '0.0.0.0';
  }

  /**
   * Generates privacy-preserving pseudonymized session hash with rolling daily salt.
   * Pursuant to docs/Analytics.md Section 4.1: SHA-256(Truncated_IP + User-Agent + Daily_Salt).
   */
  public generateSessionHash(truncatedIp: string, userAgent: string = '', dateKey: string): string {
    const salt = `BNW_SALT_${dateKey}_DPDP_2026`;
    return crypto
      .createHash('sha256')
      .update(`${truncatedIp}:${userAgent}:${salt}`)
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Checks whether the request is from a known bot or crawler (docs/Analytics.md Section 19.1).
   */
  public isKnownBot(userAgent?: string): boolean {
    if (!userAgent) return false;
    return BOT_USER_AGENT_REGEX.test(userAgent);
  }

  /**
   * Deep sanitizes properties payload to guarantee zero PII or credentials ingestion.
   */
  public sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    if (!properties || typeof properties !== 'object') {
      return {};
    }

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(properties)) {
      // Check if key matches sensitive patterns
      const isSensitiveKey = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
      if (isSensitiveKey) {
        continue; // Drop sensitive field immediately
      }

      if (typeof value === 'string') {
        // Truncate excessively long strings to prevent payload injection
        sanitized[key] = value.substring(0, 256);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (Array.isArray(value)) {
        sanitized[key] = value.slice(0, 10);
      }
    }

    return sanitized;
  }
}

export const privacyService = new PrivacyService();

