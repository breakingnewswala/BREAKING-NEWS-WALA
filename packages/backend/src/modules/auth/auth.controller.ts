/**
 * BREAKING NEWS WALA — Authentication Controller
 * Grounded in docs/13-API.md (Section 6) and docs/14-Auth.md
 * Handles HTTP request validation, cookie management, and standardized API response envelopes.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService, authService } from './auth.service';
import { extractClientContext } from './auth.middleware';
import { AppError } from '../../errors/app-error';
import { config } from '../../config';

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  private setRefreshTokenCookie(res: Response, refreshToken?: string): void {
    if (!refreshToken) return;

    const maxAgeMs = config.auth.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000;

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'strict',
      path: '/api/v1/auth/refresh',
      maxAge: maxAgeMs,
    });
  }

  private clearRefreshTokenCookie(res: Response): void {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'strict',
      path: '/api/v1/auth/refresh',
    });
  }

  /**
   * POST /api/v1/auth/register
   */
  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = extractClientContext(req);
      const result = await this.service.register(req.body, context);

      this.setRefreshTokenCookie(res, result.tokens.refreshToken);

      res.apiSuccess(result, {}, 201);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/auth/login
   */
  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = extractClientContext(req);
      const result = await this.service.login(req.body, context);

      this.setRefreshTokenCookie(res, result.tokens.refreshToken);

      res.apiSuccess(result, {}, 200);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/auth/refresh
   */
  public refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = extractClientContext(req);
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

      if (!refreshToken) {
        throw AppError.unauthorized('Refresh token is required via cookie or request body.');
      }

      const result = await this.service.refresh(refreshToken, context);

      this.setRefreshTokenCookie(res, result.tokens.refreshToken);

      res.apiSuccess(result, {}, 200);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/auth/logout
   */
  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      const sessionId = req.tokenPayload?.sessionId;

      await this.service.logout(refreshToken, sessionId);
      this.clearRefreshTokenCookie(res);

      res.apiSuccess({ message: 'Logged out successfully.' }, {}, 200);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/auth/logout-all
   */
  public logoutAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw AppError.unauthorized('Authentication required.');
      }

      const count = await this.service.logoutAll(userId);
      this.clearRefreshTokenCookie(res);

      res.apiSuccess({ message: 'All active sessions terminated successfully.', revokedSessionsCount: count }, {}, 200);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/auth/me
   */
  public getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw AppError.unauthorized('Authentication required.');
      }

      const user = await this.service.getCurrentUser(userId);
      res.apiSuccess(user, {}, 200);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/auth/sessions
   */
  public getSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw AppError.unauthorized('Authentication required.');
      }

      const currentSessionId = req.tokenPayload?.sessionId;
      const sessions = await this.service.listActiveSessions(userId, currentSessionId);

      res.apiSuccess({ sessions }, {}, 200);
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /api/v1/auth/sessions/:id
   */
  public revokeSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw AppError.unauthorized('Authentication required.');
      }

      const sessionId = req.params.id;
      if (!sessionId) {
        throw AppError.badRequest('Session ID is required.');
      }

      await this.service.revokeSpecificSession(userId, sessionId);

      res.apiSuccess({ message: 'Session revoked successfully.' }, {}, 200);
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();

