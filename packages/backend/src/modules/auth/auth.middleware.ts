/**
 * BREAKING NEWS WALA — Authentication Middleware
 * Grounded in docs/14-Auth.md and docs/DECISIONS.md (DEC-033)
 * Protects endpoints by cryptographically validating the 15-minute Bearer JWT in application memory.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../errors/app-error';
import { tokenService } from './token.service';
import { AuthUser } from './types';

export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length === 2 && parts[0]?.toLowerCase() === 'bearer' && parts[1]) {
    return parts[1];
  }

  return null;
}

export function extractClientContext(req: Request): { ipAddress?: string; clientType?: string } {
  // IP resolution honoring trusted Cloudflare / reverse proxy headers
  const cfConnectingIp = req.headers['cf-connecting-ip'] as string | undefined;
  const xForwardedFor = req.headers['x-forwarded-for'] as string | undefined;
  const firstForwarded = xForwardedFor ? xForwardedFor.split(',')[0]?.trim() : undefined;
  const ipAddress = cfConnectingIp || firstForwarded || req.ip;

  // Client type resolution (Web vs Android vs iOS)
  const clientPlatformHeader = req.headers['x-client-platform'] as string;
  let clientType = 'web';

  if (clientPlatformHeader) {
    clientType = clientPlatformHeader.toLowerCase().trim();
  } else {
    const userAgent = req.headers['user-agent']?.toLowerCase() || '';
    if (userAgent.includes('android')) {
      clientType = 'android';
    } else if (userAgent.includes('ios') || userAgent.includes('iphone')) {
      clientType = 'ios';
    }
  }

  return { ipAddress, clientType };
}

/**
 * Mandatory Authentication Guard.
 * Validates JWT Bearer token and attaches user identity to request object.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);

  if (!token) {
    return next(AppError.unauthorized('Authentication required. Missing Bearer token in Authorization header.'));
  }

  try {
    const payload = tokenService.verifyAccessToken(token);

    if (payload.status !== 'active') {
      return next(AppError.forbidden(`Account status is ${payload.status}. Access denied.`));
    }

    req.tokenPayload = payload;
    req.user = {
      id: payload.userId,
      phoneNumber: null,
      email: null,
      fullName: '',
      roles: payload.roles,
      status: payload.status,
      phoneVerified: false,
      emailVerified: false,
      mfaEnabled: false,
      createdAt: new Date(),
    } as AuthUser;

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional Authentication Middleware.
 * Populates req.user if a valid token is provided, but does not block unauthenticated requests.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) {
    return next();
  }

  try {
    const payload = tokenService.verifyAccessToken(token);
    if (payload.status === 'active') {
      req.tokenPayload = payload;
      req.user = {
        id: payload.userId,
        phoneNumber: null,
        email: null,
        fullName: '',
        roles: payload.roles,
        status: payload.status,
        phoneVerified: false,
        emailVerified: false,
        mfaEnabled: false,
        createdAt: new Date(),
      } as AuthUser;
    }
  } catch {
    // Ignore error for optional authentication
  }

  next();
}
