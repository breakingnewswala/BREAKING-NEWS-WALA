/**
 * BREAKING NEWS WALA — Token Service
 * Grounded in docs/DECISIONS.md (DEC-033) and docs/14-Auth.md (Section 7)
 * Implements Dual-Token Cryptographic Architecture:
 * 1. 15-minute Access JWT (stateless in-memory verification)
 * 2. High-entropy rotating Refresh Tokens (stored hashed via SHA-256 in PostgreSQL)
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { AccessTokenPayload, AuthTokens } from './types';
import { AppError } from '../../errors/app-error';

export class TokenService {
  private readonly secret: string;
  private readonly issuer: string;
  private readonly audience: string;
  private readonly accessExpiration: string;
  private readonly refreshExpirationDays: number;

  constructor() {
    this.secret = config.auth.jwtSecret;
    this.issuer = config.auth.issuer;
    this.audience = config.auth.audience;
    this.accessExpiration = config.auth.accessTokenExpiresIn; // '15m'
    this.refreshExpirationDays = config.auth.refreshTokenExpiresInDays; // 7 days
  }

  /**
   * Generates a short-lived 15-minute Access JWT with canonical claims.
   */
  public generateAccessToken(params: {
    userId: string;
    roles: string[];
    status: string;
    sessionId?: string;
  }): { token: string; expiresInSeconds: number } {
    const payload: AccessTokenPayload = {
      sub: params.userId,
      userId: params.userId,
      roles: params.roles,
      status: params.status,
      sessionId: params.sessionId,
    };

    // Calculate approximate seconds for standard 15m
    const expiresInSeconds = 900; // 15 minutes = 900 seconds

    const token = jwt.sign(payload, this.secret, {
      expiresIn: this.accessExpiration as any,
      issuer: this.issuer,
      audience: this.audience,
      algorithm: 'HS256',
    });

    return { token, expiresInSeconds };
  }

  /**
   * Verifies and decodes an Access JWT.
   * Throws AppError.unauthorized if the token is invalid, expired, or claims mismatch.
   */
  public verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256'],
      }) as AccessTokenPayload;

      return decoded;
    } catch (err: any) {
      if (err instanceof jwt.TokenExpiredError) {
        throw AppError.unauthorized('Access token has expired');
      }
      if (err instanceof jwt.JsonWebTokenError) {
        throw AppError.unauthorized(`Invalid access token: ${err.message}`);
      }
      throw AppError.unauthorized('Authentication token verification failed');
    }
  }

  /**
   * Generates a high-entropy cryptographically secure opaque refresh token string.
   */
  public generateRefreshToken(): string {
    return `rft_${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Hashes a refresh token using SHA-256 for secure storage in PostgreSQL.
   */
  public hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token.trim()).digest('hex');
  }

  /**
   * Calculates refresh token expiration timestamp.
   */
  public calculateRefreshTokenExpiry(days?: number): Date {
    const durationDays = days ?? this.refreshExpirationDays;
    return new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  }

  /**
   * Convenience helper to create full token pair (Access JWT + Refresh Token).
   */
  public createTokenPair(params: {
    userId: string;
    roles: string[];
    status: string;
    sessionId?: string;
  }): { tokens: AuthTokens; rawRefreshToken: string; refreshTokenHash: string; expiresAt: Date } {
    const access = this.generateAccessToken(params);
    const rawRefreshToken = this.generateRefreshToken();
    const refreshTokenHash = this.hashRefreshToken(rawRefreshToken);
    const expiresAt = this.calculateRefreshTokenExpiry();

    const tokens: AuthTokens = {
      accessToken: access.token,
      refreshToken: rawRefreshToken,
      expiresInSeconds: access.expiresInSeconds,
      tokenType: 'Bearer',
    };

    return {
      tokens,
      rawRefreshToken,
      refreshTokenHash,
      expiresAt,
    };
  }
}

export const tokenService = new TokenService();
