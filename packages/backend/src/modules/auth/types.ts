/**
 * BREAKING NEWS WALA — Auth Module Types & Interfaces
 * Grounded in docs/13-API.md (Section 6), docs/14-Auth.md, and docs/DECISIONS.md (DEC-033, DEC-034)
 */

export interface AuthUser {
  id: string;
  phoneNumber: string | null;
  email: string | null;
  fullName: string;
  roles: string[];
  status: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  homeStateId?: string | null;
  homeDistrictId?: string | null;
  createdAt: Date | string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresInSeconds: number;
  tokenType: string;
}

export interface AuthResponseData {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface RegisterDto {
  phoneNumber?: string;
  email?: string;
  password: string;
  fullName: string;
  homeStateId?: string;
  homeDistrictId?: string;
  clientType?: string;
}

export interface LoginDto {
  identifier?: string;
  phoneNumber?: string;
  email?: string;
  password: string;
  clientType?: string;
}

export interface RefreshDto {
  refreshToken?: string;
  clientType?: string;
}

export interface AccessTokenPayload {
  sub: string;
  userId: string;
  roles: string[];
  status: string;
  sessionId?: string;
  iss?: string;
  aud?: string;
  iat?: number;
  exp?: number;
}

export interface SessionSummary {
  id: string;
  clientType: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface SessionRecord {
  id: string;
  userId: string;
  refreshTokenHash: string;
  ipAddress: string | null;
  clientType: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface UserEntity {
  id: string;
  phoneNumber: string | null;
  email: string | null;
  passwordHash: string;
  status: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  profile?: {
    fullName: string;
    avatarMediaId: string | null;
    bio: string | null;
    preferredLanguage: string;
    homeStateId: string | null;
    homeDistrictId: string | null;
  } | null;
  userRoles?: Array<{
    role: {
      name: string;
      displayName: string;
    };
  }>;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      tokenPayload?: AccessTokenPayload;
    }
  }
}

