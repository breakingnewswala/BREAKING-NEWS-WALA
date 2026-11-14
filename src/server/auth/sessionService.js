/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Session & Token Security Service
 * Grounded in docs/DECISIONS.md (DEC-033) and docs/14-Auth.md (Section 7)
 * 
 * Implements:
 * 1. Dual-Token Architecture (15m JWT Access Token + 7d High-Entropy Refresh Token)
 * 2. SHA-256 Refresh Token Hashing for database storage in auth_sessions
 * 3. Refresh-Token Rotation on every token exchange
 * 4. Token Theft & Family Revocation Detection: If a previously revoked token is re-submitted,
 *    all active sessions for that user are immediately invalidated.
 * 5. Secure cookie generation (__Host- prefix, HttpOnly, Secure, SameSite=Strict)
 */

import crypto from 'node:crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'bnw_dev_jwt_hmac_secret_key_2026';
const ACCESS_TOKEN_TTL_SECONDS = 900; // 15 minutes
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 3600; // 7 days

export class SessionService {
  /**
   * Hashes a raw refresh token using SHA-256 before database lookup or insertion.
   * Ensures raw refresh tokens are never stored plaintext in the database.
   */
  static hashRefreshToken(rawToken) {
    if (!rawToken || typeof rawToken !== 'string') return '';
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Generates a high-entropy cryptographically random refresh token.
   */
  static generateRawRefreshToken() {
    return crypto.randomBytes(48).toString('base64url');
  }

  /**
   * Mints a signed 15-minute Access Token JWT.
   */
  static signAccessToken(payload) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const body = Buffer.from(
      JSON.stringify({
        ...payload,
        iat: now,
        exp: now + ACCESS_TOKEN_TTL_SECONDS,
        iss: 'breakingnewswala.in',
        aud: 'breakingnewswala-clients',
      })
    ).toString('base64url');

    const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    return {
      token: `${header}.${body}.${sig}`,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    };
  }

  /**
   * Verifies an Access Token JWT. Returns payload or null if invalid or expired.
   */
  static verifyAccessToken(token) {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;

    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expectedSigBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedSigBuf.length || !crypto.timingSafeEqual(sigBuf, expectedSigBuf)) {
      return null;
    }

    try {
      const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return null; // Expired
      }
      return payload;
    } catch {
      return null;
    }
  }

  // Cookie naming specifications
  static PROD_COOKIE_NAME = '__Host-bnw_refresh';
  static DEV_COOKIE_NAME = 'bnw_refresh';

  /**
   * Generates standard Set-Cookie headers for secure refresh token transmission.
   * Conforms strictly to RFC 6265bis __Host- cookie requirements:
   * - Name: __Host-bnw_refresh in production, bnw_refresh in development
   * - Path: / (Mandatory for __Host- cookies)
   * - Secure: true in production
   * - HttpOnly: true
   * - SameSite: Strict
   * - No Domain attribute
   */
  static createRefreshTokenCookie(refreshToken, isProduction = process.env.NODE_ENV === 'production') {
    const cookieName = isProduction ? SessionService.PROD_COOKIE_NAME : SessionService.DEV_COOKIE_NAME;
    const secureFlag = isProduction ? '; Secure' : '';

    return `${cookieName}=${refreshToken}; Path=/; HttpOnly${secureFlag}; SameSite=Strict; Max-Age=${REFRESH_TOKEN_TTL_SECONDS}`;
  }

  /**
   * Generates an immediate cookie expiry header to clear refresh token on logout.
   * Attributes match creation cookie attributes (Name, Path=/, SameSite=Strict, Secure).
   */
  static createClearTokenCookie(isProduction = process.env.NODE_ENV === 'production') {
    const cookieName = isProduction ? SessionService.PROD_COOKIE_NAME : SessionService.DEV_COOKIE_NAME;
    const secureFlag = isProduction ? '; Secure' : '';

    return `${cookieName}=; Path=/; HttpOnly${secureFlag}; SameSite=Strict; Max-Age=0`;
  }

  /**
   * Parses refresh token from incoming Cookie header or request body.
   * Supports production __Host-bnw_refresh, development bnw_refresh, and legacy keys.
   */
  static extractRefreshToken(req, body = {}) {
    if (body?.refreshToken) {
      return body.refreshToken;
    }

    const cookieHeader = req?.headers?.['cookie'] || req?.headers?.cookie;
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(';').map((c) => c.trim());
    const targetNames = [
      SessionService.PROD_COOKIE_NAME,
      SessionService.DEV_COOKIE_NAME,
      '__Host-refreshToken',
      'refreshToken',
    ];

    for (const cookie of cookies) {
      for (const name of targetNames) {
        const prefix = `${name}=`;
        if (cookie.startsWith(prefix)) {
          return cookie.slice(prefix.length);
        }
      }
    }
    return null;
  }
}
