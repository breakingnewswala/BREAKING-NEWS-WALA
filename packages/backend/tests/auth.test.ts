/**
 * BREAKING NEWS WALA — Authentication Engine Test Suite
 * Grounded in docs/13-API.md (Section 6), docs/14-Auth.md, and docs/DECISIONS.md (DEC-033, DEC-034)
 * Empirically tests Argon2id hashing, Dual-Token JWT, Token Rotation, Replay Theft Detection, and RBAC.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import express, { Application } from 'express';
import { passwordService } from '../src/modules/auth/password.service';
import { tokenService, TokenService } from '../src/modules/auth/token.service';
import { InMemoryAuthRepository } from '../src/modules/auth/auth.repository';
import { AuthService } from '../src/modules/auth/auth.service';
import { AuthController } from '../src/modules/auth/auth.controller';
import { validateLogin, validateRegister } from '../src/modules/auth/auth.validator';
import { requireAuth, optionalAuth } from '../src/modules/auth/auth.middleware';
import { cookieParserMiddleware } from '../src/middleware/cookie-parser';
import { responseEnvelopeMiddleware } from '../src/middleware/response-envelope';
import { errorHandlerMiddleware } from '../src/middleware/error-handler';
import { createTestClient, TestClient } from './test-helper';

describe('Auth Engine — Password & Cryptographic Hashing (DEC-034)', () => {
  it('should validate password complexity correctly', () => {
    // Valid password
    const valid = passwordService.validateComplexity('StrongP@ss2026');
    assert.strictEqual(valid.isValid, true);
    assert.strictEqual(valid.errors.length, 0);

    // Too short (< 10 chars)
    const short = passwordService.validateComplexity('P@ss1');
    assert.strictEqual(short.isValid, false);
    assert.ok(short.errors.some((e) => e.includes('at least 10 characters')));

    // Missing uppercase
    const noUpper = passwordService.validateComplexity('weakpass@1234');
    assert.strictEqual(noUpper.isValid, false);
    assert.ok(noUpper.errors.some((e) => e.includes('uppercase')));

    // Missing lowercase
    const noLower = passwordService.validateComplexity('WEAKPASS@1234');
    assert.strictEqual(noLower.isValid, false);
    assert.ok(noLower.errors.some((e) => e.includes('lowercase')));

    // Missing number
    const noNum = passwordService.validateComplexity('WeakPassSymbol!');
    assert.strictEqual(noNum.isValid, false);
    assert.ok(noNum.errors.some((e) => e.includes('numeric digit')));

    // Missing symbol
    const noSymbol = passwordService.validateComplexity('WeakPassword123');
    assert.strictEqual(noSymbol.isValid, false);
    assert.ok(noSymbol.errors.some((e) => e.includes('special character')));

    // Breached dictionary password
    const breached = passwordService.validateComplexity('Password123!');
    assert.strictEqual(breached.isValid, false);
    assert.ok(breached.errors.some((e) => e.includes('breached')));

    // Admin role requires 14 chars
    const adminCheck = passwordService.validateComplexity('StrongP@ss12', true);
    assert.strictEqual(adminCheck.isValid, false);
    assert.ok(adminCheck.errors.some((e) => e.includes('14 characters')));
  });

  it('should hash and verify passwords using Argon2id (m=65536, t=3, p=4)', async () => {
    const plain = 'M@dhyaPradesh2026!';
    const hash = await passwordService.hash(plain);

    // Verify hash structure
    assert.ok(hash.startsWith('$argon2id$v=19$m=65536,p=4,t=3$'));

    // Verify valid password returns true
    const isValid = await passwordService.verify(plain, hash);
    assert.strictEqual(isValid, true);

    // Verify wrong password returns false
    const isWrong = await passwordService.verify('WrongPassword123!', hash);
    assert.strictEqual(isWrong, false);

    // Verify malformed hash returns false safely without throwing
    const isMalformed = await passwordService.verify(plain, 'invalid_hash_string');
    assert.strictEqual(isMalformed, false);
  });
});

describe('Auth Engine — Dual-Token JWT & Claims (DEC-033)', () => {
  it('should generate and verify short-lived Access JWT', () => {
    const pair = tokenService.generateAccessToken({
      userId: 'usr-123',
      roles: ['public_user', 'reporter'],
      status: 'active',
      sessionId: 'ses-456',
    });

    assert.ok(pair.token);
    assert.strictEqual(pair.expiresInSeconds, 900);

    const payload = tokenService.verifyAccessToken(pair.token);
    assert.strictEqual(payload.sub, 'usr-123');
    assert.strictEqual(payload.userId, 'usr-123');
    assert.deepStrictEqual(payload.roles, ['public_user', 'reporter']);
    assert.strictEqual(payload.status, 'active');
    assert.strictEqual(payload.sessionId, 'ses-456');
    assert.strictEqual(payload.iss, 'breaking-news-wala');
    assert.strictEqual(payload.aud, 'bnw-clients');
  });

  it('should reject tampered or invalid JWT signatures', () => {
    const pair = tokenService.generateAccessToken({
      userId: 'usr-123',
      roles: ['public_user'],
      status: 'active',
    });

    const tampered = pair.token + 'corrupt';
    assert.throws(
      () => tokenService.verifyAccessToken(tampered),
      (err: any) => err.statusCode === 401 && err.errorCode === 'ERR_UNAUTHORIZED'
    );
  });

  it('should generate high-entropy refresh tokens and compute SHA-256 hash', () => {
    const token1 = tokenService.generateRefreshToken();
    const token2 = tokenService.generateRefreshToken();

    assert.ok(token1.startsWith('rft_'));
    assert.ok(token2.startsWith('rft_'));
    assert.notStrictEqual(token1, token2);

    const hash1 = tokenService.hashRefreshToken(token1);
    const hash2 = tokenService.hashRefreshToken(token1); // Same input
    const hash3 = tokenService.hashRefreshToken(token2); // Different input

    assert.strictEqual(hash1.length, 64); // SHA-256 hex is 64 chars
    assert.strictEqual(hash1, hash2);
    assert.notStrictEqual(hash1, hash3);
  });
});

describe('Auth Engine — Service & Endpoint Lifecycle Integration', () => {
  let inMemoryRepo: InMemoryAuthRepository;
  let customAuthService: AuthService;
  let customAuthController: AuthController;
  let app: Application;
  let client: TestClient;

  beforeEach(async () => {
    inMemoryRepo = new InMemoryAuthRepository();
    customAuthService = new AuthService(inMemoryRepo, tokenService, passwordService);
    customAuthController = new AuthController(customAuthService);

    app = express();
    app.use(express.json());
    app.use(cookieParserMiddleware);
    app.use(responseEnvelopeMiddleware);

    // Test routes wired to in-memory auth controller
    const router = express.Router();
    router.post('/register', validateRegister, customAuthController.register);
    router.post('/login', validateLogin, customAuthController.login);
    router.post('/refresh', customAuthController.refresh);
    router.post('/logout', optionalAuth, customAuthController.logout);
    router.post('/logout-all', requireAuth, customAuthController.logoutAll);
    router.get('/me', requireAuth, customAuthController.getMe);
    router.get('/sessions', requireAuth, customAuthController.getSessions);
    router.delete('/sessions/:id', requireAuth, customAuthController.revokeSession);

    app.use('/api/v1/auth', router);
    app.use(errorHandlerMiddleware);

    client = await createTestClient(app);
  });

  afterEach(async () => {
    await client.close();
  });

  it('should register a new citizen user, return tokens, and assign public_user role', async () => {
    const res = await client.post('/api/v1/auth/register', {
      phoneNumber: '+919876543210',
      password: 'StrongP@ss2026',
      fullName: 'Ramesh Sharma',
    });

    assert.strictEqual(res.status, 201);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.user.phoneNumber, '+919876543210');
    assert.strictEqual(json.data.user.fullName, 'Ramesh Sharma');
    assert.deepStrictEqual(json.data.user.roles, ['public_user']);
    assert.ok(json.data.tokens.accessToken);
    assert.ok(json.data.tokens.refreshToken);

    // Verify Set-Cookie header exists
    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie && setCookie.includes('refreshToken=rft_'));
    assert.ok(setCookie.includes('HttpOnly'));
  });

  it('should reject registration with duplicate phone number (409 Conflict)', async () => {
    // First registration
    await client.post('/api/v1/auth/register', {
      phoneNumber: '+919876543210',
      password: 'StrongP@ss2026',
      fullName: 'Ramesh Sharma',
    });

    // Duplicate registration
    const res = await client.post('/api/v1/auth/register', {
      phoneNumber: '+919876543210',
      password: 'AnotherP@ss2026',
      fullName: 'Duplicate User',
    });

    assert.strictEqual(res.status, 409);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.strictEqual(json.error.code, 'ERR_CONFLICT');
  });

  it('should authenticate registered user with phone and password', async () => {
    await client.post('/api/v1/auth/register', {
      phoneNumber: '+919876543211',
      password: 'StrongP@ss2026',
      fullName: 'Sunita Patel',
    });

    const res = await client.post('/api/v1/auth/login', {
      phoneNumber: '+919876543211',
      password: 'StrongP@ss2026',
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.user.fullName, 'Sunita Patel');
    assert.ok(json.data.tokens.accessToken);
  });

  it('should reject login with wrong password without leaking account existence (401)', async () => {
    await client.post('/api/v1/auth/register', {
      phoneNumber: '+919876543212',
      password: 'StrongP@ss2026',
      fullName: 'Vijay Singh',
    });

    // Wrong password
    const resWrong = await client.post('/api/v1/auth/login', {
      phoneNumber: '+919876543212',
      password: 'IncorrectPassword1!',
    });
    assert.strictEqual(resWrong.status, 401);

    // Non-existent user (identical 401 response prevents user enumeration)
    const resNotFound = await client.post('/api/v1/auth/login', {
      phoneNumber: '+919999999999',
      password: 'SomePassword1!',
    });
    assert.strictEqual(resNotFound.status, 401);

    const jsonWrong = await resWrong.json();
    const jsonNotFound = await resNotFound.json();
    assert.strictEqual(jsonWrong.error.message, jsonNotFound.error.message);
  });

  it('should rotate refresh token and issue new token pair', async () => {
    // 1. Register
    const regRes = await client.post('/api/v1/auth/register', {
      phoneNumber: '+919876543213',
      password: 'StrongP@ss2026',
      fullName: 'Anoop Verma',
    });
    const regData = (await regRes.json()).data;
    const initialRefreshToken = regData.tokens.refreshToken;

    // 2. Refresh using body refreshToken (Android mobile pattern)
    const refreshRes = await client.post('/api/v1/auth/refresh', {
      refreshToken: initialRefreshToken,
    });

    assert.strictEqual(refreshRes.status, 200);
    const refreshData = (await refreshRes.json()).data;

    assert.ok(refreshData.tokens.accessToken);
    assert.ok(refreshData.tokens.refreshToken);
    assert.notStrictEqual(refreshData.tokens.refreshToken, initialRefreshToken);
  });

  it('should detect refresh token replay theft and invalidate all sessions immediately', async () => {
    // 1. Register user
    const regRes = await client.post('/api/v1/auth/register', {
      phoneNumber: '+919876543214',
      password: 'StrongP@ss2026',
      fullName: 'Kavita Joshi',
    });
    const regData = (await regRes.json()).data;
    const stolenRefreshToken = regData.tokens.refreshToken;

    // 2. Legitimate client rotates token (stolenRefreshToken becomes revoked)
    const refresh1 = await client.post('/api/v1/auth/refresh', {
      refreshToken: stolenRefreshToken,
    });
    assert.strictEqual(refresh1.status, 200);

    // 3. Attacker attempts to replay stolenRefreshToken (already revoked!)
    const replayAttack = await client.post('/api/v1/auth/refresh', {
      refreshToken: stolenRefreshToken,
    });

    assert.strictEqual(replayAttack.status, 401);
    const replayJson = await replayAttack.json();
    assert.ok(replayJson.error.message.includes('reuse detected') || replayJson.error.message.includes('terminated'));

    // 4. Verify that ALL sessions for this user have been terminated
    const activeSessions = await inMemoryRepo.listActiveSessions(regData.user.id);
    assert.strictEqual(activeSessions.length, 0);
  });

  it('should support authenticated /me endpoint with Bearer token', async () => {
    const regRes = await client.post('/api/v1/auth/register', {
      phoneNumber: '+919876543215',
      password: 'StrongP@ss2026',
      fullName: 'Deepak Tiwari',
    });
    const { tokens, user } = (await regRes.json()).data;

    // Authenticated request
    const meRes = await client.get('/api/v1/auth/me', {
      Authorization: `Bearer ${tokens.accessToken}`,
    });

    assert.strictEqual(meRes.status, 200);
    const meData = (await meRes.json()).data;
    assert.strictEqual(meData.id, user.id);
    assert.strictEqual(meData.fullName, 'Deepak Tiwari');

    // Missing Bearer token should fail with 401
    const unauthRes = await client.get('/api/v1/auth/me');
    assert.strictEqual(unauthRes.status, 401);
  });

  it('should terminate all sessions on /api/v1/auth/logout-all', async () => {
    const regRes = await client.post('/api/v1/auth/register', {
      phoneNumber: '+919876543216',
      password: 'StrongP@ss2026',
      fullName: 'Anita Meena',
    });
    const { tokens, user } = (await regRes.json()).data;

    // Create a second session
    await client.post('/api/v1/auth/login', {
      phoneNumber: '+919876543216',
      password: 'StrongP@ss2026',
    });

    const activeBefore = await inMemoryRepo.listActiveSessions(user.id);
    assert.strictEqual(activeBefore.length, 2);

    // Call logout-all
    const logoutAllRes = await client.post(
      '/api/v1/auth/logout-all',
      {},
      {
        Authorization: `Bearer ${tokens.accessToken}`,
      }
    );

    assert.strictEqual(logoutAllRes.status, 200);

    const activeAfter = await inMemoryRepo.listActiveSessions(user.id);
    assert.strictEqual(activeAfter.length, 0);
  });
});
