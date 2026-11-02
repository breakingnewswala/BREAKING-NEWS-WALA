/**
 * BREAKING NEWS WALA — Differentiated API Rate Limiting Middleware
 * Grounded in docs/13-API.md (Section 1.4: Rate Limiting & Abuse Prevention)
 * and docs/DECISIONS.md (DEC-040, DEC-074)
 * Provides multi-tier rate limiting with sliding window tracking and HTTP 429 response envelopes.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';
import { RateLimitTier, RateLimitTierConfig } from '@bnw/types';

// Default Tier Configurations (requests per window)
export const DEFAULT_RATE_LIMIT_TIERS: Record<RateLimitTier, RateLimitTierConfig> = {
  auth: { windowMs: 60 * 1000, maxRequests: 10 },        // 10 req/min for login, register, password reset
  public: { windowMs: 60 * 1000, maxRequests: 1000 },    // 1000 req/min for public reading
  search: { windowMs: 60 * 1000, maxRequests: 60 },      // 60 req/min for search queries
  telemetry: { windowMs: 60 * 1000, maxRequests: 300 },  // 300 req/min for analytics beacon ingestion
  media: { windowMs: 60 * 1000, maxRequests: 20 },       // 20 req/min for file/photo/video uploads
  ai: { windowMs: 60 * 1000, maxRequests: 30 },          // 30 req/min for AI assistant execution
  admin: { windowMs: 60 * 1000, maxRequests: 120 },      // 120 req/min for administrative operations
};

interface RateLimitRecord {
  timestamps: number[];
}

class InMemoryRateLimiterStore {
  private stores = new Map<string, Map<string, RateLimitRecord>>();

  private getTierStore(tier: RateLimitTier): Map<string, RateLimitRecord> {
    if (!this.stores.has(tier)) {
      this.stores.set(tier, new Map<string, RateLimitRecord>());
    }
    return this.stores.get(tier)!;
  }

  public checkRateLimit(
    tier: RateLimitTier,
    clientKey: string,
    config: RateLimitTierConfig
  ): {
    allowed: boolean;
    remaining: number;
    limit: number;
    resetSeconds: number;
    retryAfterSeconds?: number;
  } {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const tierStore = this.getTierStore(tier);

    let record = tierStore.get(clientKey);
    if (!record) {
      record = { timestamps: [] };
      tierStore.set(clientKey, record);
    }

    // Filter out timestamps outside the sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    const limit = config.maxRequests;
    const count = record.timestamps.length;

    // Oldest timestamp in current window determines window reset time
    const oldestTimestamp = record.timestamps[0] || now;
    const resetTimeMs = oldestTimestamp + config.windowMs;
    const resetSeconds = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));

    if (count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        limit,
        resetSeconds,
        retryAfterSeconds: resetSeconds,
      };
    }

    // Record this valid request
    record.timestamps.push(now);

    return {
      allowed: true,
      remaining: Math.max(0, limit - record.timestamps.length),
      limit,
      resetSeconds,
    };
  }

  public resetAll(): void {
    this.stores.clear();
  }

  public resetTier(tier: RateLimitTier): void {
    this.stores.delete(tier);
  }
}

export const rateLimiterStore = new InMemoryRateLimiterStore();

/**
 * Resolves client key from trusted reverse proxy / Cloudflare IP headers
 */
export function resolveClientIp(req: Request): string {
  const cfConnectingIp = req.headers['cf-connecting-ip'] as string | undefined;
  const xForwardedFor = req.headers['x-forwarded-for'] as string | undefined;
  const firstForwarded = xForwardedFor ? xForwardedFor.split(',')[0]?.trim() : undefined;
  return cfConnectingIp || firstForwarded || req.ip || req.socket.remoteAddress || '127.0.0.1';
}

/**
 * Creates an Express middleware enforcing the given rate limiting tier.
 */
export function createRateLimiter(tier: RateLimitTier, customConfig?: Partial<RateLimitTierConfig>) {
  const tierConfig: RateLimitTierConfig = {
    ...DEFAULT_RATE_LIMIT_TIERS[tier],
    ...(customConfig || {}),
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    // Keying by IP address; for authenticated users, optionally incorporate user ID
    const clientIp = resolveClientIp(req);
    const userId = (req as any).user?.id;
    const clientKey = userId ? `${clientIp}:${userId}` : clientIp;

    const result = rateLimiterStore.checkRateLimit(tier, clientKey, tierConfig);

    // Set standard RateLimit headers (IETF draft compliant)
    res.setHeader('X-RateLimit-Limit', result.limit.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', result.resetSeconds.toString());

    if (!result.allowed) {
      res.setHeader('Retry-After', (result.retryAfterSeconds || 60).toString());
      return next(
        AppError.rateLimitExceeded(
          `Too many requests on ${tier} endpoint. Please retry after ${result.retryAfterSeconds} seconds.`
        )
      );
    }

    next();
  };
}
