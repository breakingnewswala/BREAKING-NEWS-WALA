/**
 * BREAKING NEWS WALA — Authentication Router
 * Grounded in docs/13-API.md (Section 6: AUTH-01 through AUTH-12)
 * Mounts public authentication and protected session endpoints.
 */

import { Router } from 'express';
import { authController } from './auth.controller';
import { validateLogin, validateRegister } from './auth.validator';
import { optionalAuth, requireAuth } from './auth.middleware';

const router = Router();

// Public Authentication Endpoints
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/refresh', authController.refresh);

// Protected Session & Identity Endpoints
router.post('/logout', optionalAuth, authController.logout);
router.post('/logout-all', requireAuth, authController.logoutAll);
router.get('/me', requireAuth, authController.getMe);
router.get('/sessions', requireAuth, authController.getSessions);
router.delete('/sessions/:id', requireAuth, authController.revokeSession);

export { router as authRouter };

