/**
 * BREAKING NEWS WALA — Authentication Service Core
 * Grounded in docs/14-Auth.md, docs/13-API.md, and docs/DECISIONS.md (DEC-033, DEC-034)
 * Orchestrates user registration, login, dual-token generation, token rotation, and theft detection.
 */

import { AppError } from '../../errors/app-error';
import { IAuthRepository, authRepository } from './auth.repository';
import { PasswordService, passwordService } from './password.service';
import { TokenService, tokenService } from './token.service';
import {
  AuthResponseData,
  AuthUser,
  LoginDto,
  RegisterDto,
  SessionSummary,
  UserEntity,
} from './types';

export class AuthService {
  constructor(
    private readonly repo: IAuthRepository = authRepository,
    private readonly tokens: TokenService = tokenService,
    private readonly passwords: PasswordService = passwordService
  ) {}

  /**
   * Registers a new public citizen or stringer user.
   * Enforces uniqueness, password complexity, and assigns default role.
   */
  public async register(
    dto: RegisterDto,
    context: { ipAddress?: string; clientType?: string } = {}
  ): Promise<AuthResponseData> {
    // 1. Password complexity check
    const validation = this.passwords.validateComplexity(dto.password);
    if (!validation.isValid) {
      throw AppError.validationFailed('Password does not meet security criteria', [
        { field: 'body.password', code: 'ERR_PASSWORD_COMPLEXITY', message: validation.errors.join(' ') },
      ]);
    }

    const cleanPhone = dto.phoneNumber ? dto.phoneNumber.replace(/[\s-]/g, '') : undefined;
    const cleanEmail = dto.email ? dto.email.trim().toLowerCase() : undefined;

    // 2. Uniqueness check
    if (cleanPhone) {
      const existing = await this.repo.findUserByPhone(cleanPhone);
      if (existing) {
        throw AppError.conflict('An account with this phone number already exists.');
      }
    }

    if (cleanEmail) {
      const existing = await this.repo.findUserByEmail(cleanEmail);
      if (existing) {
        throw AppError.conflict('An account with this email address already exists.');
      }
    }

    // 3. Cryptographic Argon2id password hash
    const passwordHash = await this.passwords.hash(dto.password);

    // 4. Persistence
    const user = await this.repo.createUser({
      phoneNumber: cleanPhone,
      email: cleanEmail,
      passwordHash,
      fullName: dto.fullName.trim(),
      homeStateId: dto.homeStateId,
      homeDistrictId: dto.homeDistrictId,
      initialRole: 'public_user',
    });

    const roles = this.extractRoles(user);

    // 5. Dual-Token Generation & Session Registration
    const tokenPair = this.tokens.createTokenPair({
      userId: user.id,
      roles,
      status: user.status,
    });

    await this.repo.createSession({
      userId: user.id,
      refreshTokenHash: tokenPair.refreshTokenHash,
      expiresAt: tokenPair.expiresAt,
      ipAddress: context.ipAddress,
      clientType: context.clientType || 'web',
    });

    return {
      user: this.formatUser(user),
      tokens: tokenPair.tokens,
    };
  }

  /**
   * Authenticates user via phone/email and password.
   * Returns short-lived JWT access token and rotating refresh token.
   */
  public async login(
    dto: LoginDto,
    context: { ipAddress?: string; clientType?: string } = {}
  ): Promise<AuthResponseData> {
    const rawIdentifier = dto.identifier || dto.phoneNumber || dto.email;
    if (!rawIdentifier) {
      throw AppError.badRequest('Identifier (phone number or email) is required.');
    }

    // 1. Fetch user (safe lookup)
    const user = await this.repo.findUserByIdentifier(rawIdentifier);
    if (!user) {
      // Generic error response to eliminate user enumeration attacks (docs/14-Auth.md Section 6.3)
      throw AppError.unauthorized('Invalid contact identifier or password.');
    }

    // 2. Verify account status
    if (user.status !== 'active') {
      throw AppError.forbidden(`Account is ${user.status}. Access denied.`);
    }

    // 3. Verify Argon2id password hash
    const isPasswordValid = await this.passwords.verify(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw AppError.unauthorized('Invalid contact identifier or password.');
    }

    const roles = this.extractRoles(user);

    // 4. Create Token Pair & Store Session
    const tokenPair = this.tokens.createTokenPair({
      userId: user.id,
      roles,
      status: user.status,
    });

    await this.repo.createSession({
      userId: user.id,
      refreshTokenHash: tokenPair.refreshTokenHash,
      expiresAt: tokenPair.expiresAt,
      ipAddress: context.ipAddress,
      clientType: context.clientType || (dto.clientType ?? 'web'),
    });

    return {
      user: this.formatUser(user),
      tokens: tokenPair.tokens,
    };
  }

  /**
   * Refreshes access token with full cryptographic token rotation and reuse theft detection.
   * Invariant: If a revoked token is presented, ALL active sessions for that user are immediately killed.
   */
  public async refresh(
    refreshToken: string,
    context: { ipAddress?: string; clientType?: string } = {}
  ): Promise<AuthResponseData> {
    if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim() === '') {
      throw AppError.unauthorized('Refresh token is required.');
    }

    const tokenHash = this.tokens.hashRefreshToken(refreshToken);
    const session = await this.repo.findSessionByTokenHash(tokenHash);

    // Replay / Theft Detection Check
    if (session) {
      if (session.revokedAt !== null) {
        // Suspected token theft! Invalidate the entire token family across all devices.
        await this.repo.revokeAllUserSessions(session.userId);
        throw AppError.unauthorized(
          'Revoked refresh token reuse detected. All active sessions have been terminated for security.'
        );
      }

      if (session.expiresAt.getTime() < Date.now()) {
        await this.repo.revokeSession(session.id);
        throw AppError.unauthorized('Refresh token has expired. Please log in again.');
      }
    } else {
      throw AppError.unauthorized('Invalid refresh token.');
    }

    // Verify user exists and is active
    const user = await this.repo.findUserById(session.userId);
    if (!user || user.status !== 'active') {
      await this.repo.revokeSession(session.id);
      throw AppError.unauthorized('User account is invalid or suspended.');
    }

    // Token Rotation: Invalidate the consumed session
    await this.repo.revokeSession(session.id);

    const roles = this.extractRoles(user);

    // Issue brand-new rotating token pair
    const tokenPair = this.tokens.createTokenPair({
      userId: user.id,
      roles,
      status: user.status,
    });

    await this.repo.createSession({
      userId: user.id,
      refreshTokenHash: tokenPair.refreshTokenHash,
      expiresAt: tokenPair.expiresAt,
      ipAddress: context.ipAddress || session.ipAddress || undefined,
      clientType: context.clientType || session.clientType || 'web',
    });

    return {
      user: this.formatUser(user),
      tokens: tokenPair.tokens,
    };
  }

  /**
   * Revokes the current session (Logout).
   */
  public async logout(refreshToken?: string, sessionId?: string): Promise<boolean> {
    if (refreshToken) {
      const hash = this.tokens.hashRefreshToken(refreshToken);
      const session = await this.repo.findSessionByTokenHash(hash);
      if (session) {
        return this.repo.revokeSession(session.id);
      }
    }

    if (sessionId) {
      return this.repo.revokeSession(sessionId);
    }

    return true;
  }

  /**
   * Revokes all active sessions for a user across all devices (Logout All).
   */
  public async logoutAll(userId: string): Promise<number> {
    return this.repo.revokeAllUserSessions(userId);
  }

  /**
   * Retrieves current authenticated user details.
   */
  public async getCurrentUser(userId: string): Promise<AuthUser> {
    const user = await this.repo.findUserById(userId);
    if (!user || user.status !== 'active') {
      throw AppError.notFound('User not found or account is inactive.');
    }
    return this.formatUser(user);
  }

  /**
   * Lists active sessions for a user.
   */
  public async listActiveSessions(userId: string, currentSessionId?: string): Promise<SessionSummary[]> {
    const sessions = await this.repo.listActiveSessions(userId);
    return sessions.map((s) => ({
      id: s.id,
      clientType: s.clientType,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      isCurrent: s.id === currentSessionId,
    }));
  }

  /**
   * Terminates a specific remote session belonging to the user.
   */
  public async revokeSpecificSession(userId: string, sessionId: string): Promise<boolean> {
    const session = await this.repo.findSessionById(sessionId);
    if (!session || session.userId !== userId) {
      throw AppError.notFound('Session not found or does not belong to you.');
    }
    return this.repo.revokeSession(sessionId);
  }

  private extractRoles(user: UserEntity): string[] {
    if (!user.userRoles || user.userRoles.length === 0) {
      return ['public_user'];
    }
    return user.userRoles.map((ur) => ur.role.name);
  }

  private formatUser(user: UserEntity): AuthUser {
    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      email: user.email,
      fullName: user.profile?.fullName || '',
      roles: this.extractRoles(user),
      status: user.status,
      phoneVerified: user.phoneVerified,
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
      homeStateId: user.profile?.homeStateId,
      homeDistrictId: user.profile?.homeDistrictId,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();

