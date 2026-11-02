/**
 * BREAKING NEWS WALA — Enterprise Security, Hardening, Backup & Monitoring Test Suite
 * Grounded in docs/14-Auth.md, docs/15-Security.md, docs/Monitoring.md, docs/24-Deployment.md,
 * and docs/DECISIONS.md (DEC-033, DEC-034, DEC-040, DEC-048, DEC-060, DEC-074)
 * Master Roadmap: BNW-MASTER-009
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Auth & Security modules
import { tokenService } from '../../src/modules/auth/token.service';
import { passwordService } from '../../src/modules/auth/password.service';
import { AuthService } from '../../src/modules/auth/auth.service';
import { InMemoryAuthRepository } from '../../src/modules/auth/auth.repository';

// Middleware & Utilities
import {
  requireRoles,
  hasAnyRole,
  assertNoChiefEditor,
  verifyResourceOwnership,
  verifyTerritoryJurisdiction,
  normalizeRole,
} from '../../src/middleware/rbac';
import {
  createRateLimiter,
  rateLimiterStore,
  resolveClientIp,
} from '../../src/middleware/rate-limiter';
import {
  validateAntiSsrfUrl,
  assertSafeExternalUrl,
  sanitizeFilePath,
  validateMimeMagicBytes,
  scanFileForMalware,
} from '../../src/utils/security.util';
import { sanitizeMetadata } from '../../src/middleware/structured-logger';
import { securityAuditService } from '../../src/modules/admin/security-audit.service';

// Backup & Monitoring
import { backupService } from '../../src/modules/backup/backup.service';
import { monitoringService } from '../../src/modules/monitoring/monitoring.service';

describe('BNW-MASTER-009: Enterprise Security, Hardening & Production Suite', () => {
  beforeEach(() => {
    rateLimiterStore.resetAll();
    securityAuditService.clearBuffer();
  });

  // ==========================================================================
  // Suite 1: Authentication & Token Security (DEC-033, DEC-034)
  // ==========================================================================
  describe('1. Authentication & Token Security Hardening', () => {
    it('should hash and verify passwords using Argon2id with salt', async () => {
      const plaintext = 'P@ssword123!';
      const hash = await passwordService.hash(plaintext);

      assert.ok(hash.startsWith('$argon2id$'), 'Hash must use Argon2id algorithm');
      assert.notEqual(hash, plaintext, 'Plaintext must not be exposed');

      const isValid = await passwordService.verify(plaintext, hash);
      assert.strictEqual(isValid, true, 'Correct password must verify successfully');

      const isInvalid = await passwordService.verify('WrongPassword999', hash);
      assert.strictEqual(isInvalid, false, 'Incorrect password must be rejected');
    });

    it('should issue short-lived 15-minute Access JWT with correct issuer and audience', () => {
      const userId = crypto.randomUUID();
      const { token, expiresInSeconds } = tokenService.generateAccessToken({
        userId,
        roles: ['REPORTER'],
        status: 'active',
      });

      assert.strictEqual(expiresInSeconds, 900, 'Access token duration must be 900 seconds (15 minutes)');

      const payload = tokenService.verifyAccessToken(token);
      assert.strictEqual(payload.userId, userId);
      assert.deepStrictEqual(payload.roles, ['REPORTER']);
      assert.strictEqual(payload.status, 'active');
      assert.strictEqual(payload.iss, 'breaking-news-wala');
      assert.strictEqual(payload.aud, 'bnw-clients');
    });

    it('should reject tampered or weakly signed JWT tokens', () => {
      const userId = crypto.randomUUID();
      const { token } = tokenService.generateAccessToken({
        userId,
        roles: ['REPORTER'],
        status: 'active',
      });

      // Tamper with the token signature by modifying the last characters
      const tampered = token.slice(0, -6) + 'abcdef';
      assert.throws(
        () => tokenService.verifyAccessToken(tampered),
        (err: any) => err.statusCode === 401,
        'Tampered JWT must be rejected with 401 Unauthorized'
      );

      // Rejection of tokens signed with a different key
      const rogueToken = jwt.sign({ userId, roles: ['ADMIN'] }, 'unauthorized-rogue-secret', {
        issuer: 'breaking-news-wala',
        audience: 'bnw-clients',
      });
      assert.throws(
        () => tokenService.verifyAccessToken(rogueToken),
        (err: any) => err.statusCode === 401,
        'Token signed with invalid secret must be rejected'
      );
    });

    it('should eliminate account enumeration: return identical error for non-existent vs wrong password', async () => {
      const repo = new InMemoryAuthRepository();
      const auth = new AuthService(repo);

      // 1. Attempt login with non-existent user
      let nonExistentErrorMsg = '';
      try {
        await auth.login({ identifier: '+919999999999', password: 'AnyPassword123' });
      } catch (err: any) {
        nonExistentErrorMsg = err.message;
      }

      // 2. Register valid user
      const registered = await auth.register({
        phoneNumber: '+919876543210',
        password: 'ValidPassword123!',
        fullName: 'Test User',
      });
      assert.ok(registered.user.id);

      // 3. Attempt login with wrong password
      let wrongPasswordErrorMsg = '';
      try {
        await auth.login({ identifier: '+919876543210', password: 'IncorrectPassword999' });
      } catch (err: any) {
        wrongPasswordErrorMsg = err.message;
      }

      assert.strictEqual(
        nonExistentErrorMsg,
        wrongPasswordErrorMsg,
        'Error message must be identical to eliminate user enumeration attacks (docs/14-Auth.md Section 6.3)'
      );
    });
  });

  // ==========================================================================
  // Suite 2: Refresh Token Rotation & Replay Theft Detection
  // ==========================================================================
  describe('2. Refresh Token Rotation & Replay Theft Detection', () => {
    it('should rotate refresh token and invalidate old token upon use', async () => {
      const repo = new InMemoryAuthRepository();
      const auth = new AuthService(repo);

      const loginResult = await auth.register({
        phoneNumber: '+919876543212',
        password: 'ValidPassword123!',
        fullName: 'Rotation User',
      });
      const firstRefreshToken = loginResult.tokens.refreshToken;

      // First refresh: consumes firstRefreshToken and issues secondRefreshToken
      const refreshResult = await auth.refresh(firstRefreshToken);
      const secondRefreshToken = refreshResult.tokens.refreshToken;

      assert.notEqual(
        secondRefreshToken,
        firstRefreshToken,
        'Rotated refresh token must be distinct from original'
      );

      // Attempting to reuse firstRefreshToken (Replay Attack) must be detected as theft!
      await assert.rejects(
        async () => {
          await auth.refresh(firstRefreshToken);
        },
        (err: any) => {
          assert.strictEqual(err.statusCode, 401);
          assert.match(err.message, /reuse detected/i);
          return true;
        },
        'Replaying consumed refresh token must trigger theft detection'
      );

      // Because theft was detected, the secondRefreshToken must ALSO be revoked (token family invalidation)
      await assert.rejects(
        async () => {
          await auth.refresh(secondRefreshToken);
        },
        (err: any) => {
          assert.strictEqual(err.statusCode, 401);
          return true;
        },
        'All sessions for that user must be terminated after token theft detection'
      );
    });

    it('should terminate all active sessions when user invokes logoutAll', async () => {
      const repo = new InMemoryAuthRepository();
      const auth = new AuthService(repo);

      const userRes = await auth.register({
        phoneNumber: '+919876543213',
        password: 'ValidPassword123!',
        fullName: 'Multi-Device User',
      });

      // Simulate second device login
      const dev2 = await auth.login({ identifier: '+919876543213', password: 'ValidPassword123!' });

      const count = await auth.logoutAll(userRes.user.id);
      assert.strictEqual(count >= 2, true, 'At least 2 active sessions must be revoked');

      // Both refresh tokens must now be invalid
      await assert.rejects(async () => auth.refresh(userRes.tokens.refreshToken));
      await assert.rejects(async () => auth.refresh(dev2.tokens.refreshToken));
    });
  });

  // ==========================================================================
  // Suite 3: Server-Side RBAC & Authorization Invariants
  // ==========================================================================
  describe('3. Server-Side RBAC & IDOR Ownership Defense', () => {
    it('should permit authorized administrative roles and deny unauthorized roles', () => {
      assert.strictEqual(hasAnyRole(['ADMIN'], ['ADMIN', 'SUPER_ADMIN']), true);
      assert.strictEqual(hasAnyRole(['ROLE_SUPER_ADMIN'], ['ADMIN', 'SUPER_ADMIN']), true);
      assert.strictEqual(hasAnyRole(['REPORTER'], ['ADMIN', 'SUPER_ADMIN']), false);
      assert.strictEqual(hasAnyRole(['PUBLIC_USER'], ['REPORTER']), false);
    });

    it('verifyResourceOwnership: should prevent IDOR attacks across reporters', () => {
      const reporterA = 'reporter-uuid-aaaa';
      const reporterB = 'reporter-uuid-bbbb';
      const adminUser = 'admin-uuid-9999';

      // Reporter A accessing their own resource: ALLOWED
      assert.strictEqual(
        verifyResourceOwnership(reporterA, reporterA, ['REPORTER']),
        true
      );

      // Reporter A accessing Reporter B resource: DENIED (IDOR Blocked)
      assert.strictEqual(
        verifyResourceOwnership(reporterA, reporterB, ['REPORTER']),
        false
      );

      // Admin accessing Reporter B resource: ALLOWED (Override)
      assert.strictEqual(
        verifyResourceOwnership(adminUser, reporterB, ['ADMIN']),
        true
      );
    });

    it('verifyTerritoryJurisdiction: should enforce RULE-GEO-001 territory beats', () => {
      const assignedDistricts = ['bhopal', 'sehore'];

      // Reporter filing in assigned district: ALLOWED
      assert.strictEqual(
        verifyTerritoryJurisdiction('bhopal', assignedDistricts, ['REPORTER']),
        true
      );

      // Reporter filing outside assigned district (e.g. Indore): DENIED
      assert.strictEqual(
        verifyTerritoryJurisdiction('indore', assignedDistricts, ['REPORTER']),
        false
      );

      // Bureau Chief / Admin holds state-wide jurisdiction: ALLOWED
      assert.strictEqual(
        verifyTerritoryJurisdiction('indore', assignedDistricts, ['BUREAU_CHIEF']),
        true
      );
    });
  });

  // ==========================================================================
  // Suite 4: DEC-048 Invariant Rejection of ROLE_CHIEF_EDITOR
  // ==========================================================================
  describe('4. Governance Invariant: DEC-048 Chief Editor Rejection', () => {
    it('assertNoChiefEditor must strictly reject ROLE_CHIEF_EDITOR with 403 Forbidden', () => {
      assert.throws(
        () => assertNoChiefEditor(['ROLE_CHIEF_EDITOR']),
        (err: any) => {
          assert.strictEqual(err.statusCode, 403);
          assert.match(err.message, /DEC-048/);
          return true;
        },
        'ROLE_CHIEF_EDITOR must be blocked under DEC-048'
      );

      assert.throws(
        () => assertNoChiefEditor(['chief_editor', 'admin']),
        (err: any) => err.statusCode === 403
      );

      // Permitted roles must not throw
      assert.doesNotThrow(() => assertNoChiefEditor(['ADMIN', 'SUPER_ADMIN', 'REPORTER']));
    });
  });

  // ==========================================================================
  // Suite 5: Differentiated API Rate Limiting
  // ==========================================================================
  describe('5. Differentiated API Rate Limiting & Abuse Prevention', () => {
    it('should throttle auth requests exceeding 10 req/min with HTTP 429', () => {
      const clientIp = '198.51.100.1';
      const authLimiter = createRateLimiter('auth', { windowMs: 60000, maxRequests: 5 });

      const mockReq = {
        headers: { 'cf-connecting-ip': clientIp },
        ip: clientIp,
      } as any;

      let lastStatus = 200;
      let lastHeaders: Record<string, string> = {};
      let errorThrown: any = null;

      const mockRes = {
        setHeader: (k: string, v: string) => {
          lastHeaders[k] = v;
        },
      } as any;

      // Make 5 requests within limit
      for (let i = 0; i < 5; i++) {
        authLimiter(mockReq, mockRes, (err?: any) => {
          if (err) errorThrown = err;
        });
      }
      assert.strictEqual(errorThrown, null, 'First 5 requests must pass without error');
      assert.strictEqual(lastHeaders['X-RateLimit-Remaining'], '0');

      // 6th request: must exceed limit and trigger 429
      authLimiter(mockReq, mockRes, (err?: any) => {
        errorThrown = err;
      });

      assert.ok(errorThrown, '6th request must trigger rate limit error');
      assert.strictEqual(errorThrown.statusCode, 429);
      assert.ok(lastHeaders['Retry-After'], 'Retry-After header must be set');
    });

    it('should support resolveClientIp with trusted proxy and Cloudflare headers', () => {
      const reqWithCf = {
        headers: { 'cf-connecting-ip': '203.0.113.195' },
      } as any;
      assert.strictEqual(resolveClientIp(reqWithCf), '203.0.113.195');

      const reqWithXff = {
        headers: { 'x-forwarded-for': '198.51.100.22, 10.0.0.1' },
      } as any;
      assert.strictEqual(resolveClientIp(reqWithXff), '198.51.100.22');
    });
  });

  // ==========================================================================
  // Suite 6: Security Audit Logging & PII Redaction
  // ==========================================================================
  describe('6. Security Audit Logging & PII Redaction', () => {
    it('sanitizeMetadata should redact sensitive secrets and passwords', () => {
      const unredacted = {
        username: 'reporter_bhopal',
        password: 'SuperSecretPassword!',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'rft_987654321',
        nested: {
          apiKey: 'AIzaSyA_secret_key_123',
          normalField: 'Public Title',
        },
      };

      const sanitized = sanitizeMetadata(unredacted);
      assert.strictEqual(sanitized.password, '[REDACTED]');
      assert.strictEqual(sanitized.token, '[REDACTED]');
      assert.strictEqual(sanitized.refreshToken, '[REDACTED]');
      assert.strictEqual(sanitized.nested.apiKey, '[REDACTED]');
      assert.strictEqual(sanitized.nested.normalField, 'Public Title');
    });

    it('should record security audit log and retrieve via query filter', async () => {
      const actorId = crypto.randomUUID();
      const entityId = crypto.randomUUID();

      await securityAuditService.logEvent({
        action: 'ROLE_ASSIGNED',
        actorUserId: actorId,
        targetEntityType: 'user',
        targetEntityId: entityId,
        payloadAfter: { role: 'REPORTER', district: 'bhopal' },
        severity: 'INFO',
      });

      const { logs, total } = await securityAuditService.getAuditLogs({ action: 'ROLE_ASSIGNED' });
      assert.strictEqual(total >= 1, true);
      const found = logs.find((l) => l.targetEntityId === entityId);
      assert.ok(found);
      assert.strictEqual(found.action, 'ROLE_ASSIGNED');
    });
  });

  // ==========================================================================
  // Suite 7: Anti-SSRF & Network Boundary Protection
  // ==========================================================================
  describe('7. Anti-SSRF & Network Boundary Defense', () => {
    it('should reject loopback addresses (127.0.0.1, localhost, ::1)', () => {
      assert.strictEqual(validateAntiSsrfUrl('http://127.0.0.1:8080/admin').isValid, false);
      assert.strictEqual(validateAntiSsrfUrl('http://localhost:3000/api').isValid, false);
      assert.strictEqual(validateAntiSsrfUrl('http://[::1]:8080/').isValid, false);
    });

    it('should reject cloud metadata endpoints (169.254.169.254, metadata.google.internal)', () => {
      assert.strictEqual(
        validateAntiSsrfUrl('http://169.254.169.254/latest/meta-data/').isValid,
        false
      );
      assert.strictEqual(
        validateAntiSsrfUrl('http://metadata.google.internal/computeMetadata/v1/').isValid,
        false
      );
    });

    it('should reject non-HTTP protocols (file:, ftp:, gopher:)', () => {
      assert.strictEqual(validateAntiSsrfUrl('file:///etc/passwd').isValid, false);
      assert.strictEqual(validateAntiSsrfUrl('ftp://ftp.example.com/data').isValid, false);
      assert.strictEqual(validateAntiSsrfUrl('gopher://gopher.example.com').isValid, false);
    });

    it('should permit legitimate public HTTPS news domains', () => {
      const valid = validateAntiSsrfUrl('https://mpbreakingnews.org/feed.xml');
      assert.strictEqual(valid.isValid, true);
      assert.ok(valid.parsedUrl);
      assert.strictEqual(valid.parsedUrl.hostname, 'mpbreakingnews.org');
    });
  });

  // ==========================================================================
  // Suite 8: File Upload & Path Traversal Protection
  // ==========================================================================
  describe('8. File Upload & Media Traversal Protection', () => {
    it('sanitizeFilePath: should strip path traversal markers and shell operators', () => {
      assert.strictEqual(sanitizeFilePath('../../etc/passwd'), 'etc_passwd');
      assert.strictEqual(sanitizeFilePath('..\\..\\windows\\system32'), 'windows_system32');
      const sanitized = sanitizeFilePath('image;rm -rf /;.png');
      assert.strictEqual(sanitized.includes(';'), false, 'Must strip semicolon shell delimiter');
      assert.strictEqual(sanitized.includes('/'), false, 'Must strip slash separator');
      assert.ok(sanitized.endsWith('.png'), 'Must preserve safe extension');
      assert.strictEqual(sanitizeFilePath('normal_photo.jpg'), 'normal_photo.jpg');
    });

    it('validateMimeMagicBytes: should verify true file signatures and reject spoofed extensions', () => {
      // 1. Valid PDF buffer (%PDF-)
      const validPdfBuffer = Buffer.from('%PDF-1.7 standard header content');
      const pdfCheck = validateMimeMagicBytes(validPdfBuffer, 'application/pdf');
      assert.strictEqual(pdfCheck.isValid, true);

      // 2. Spoofed PDF (Text file renamed to .pdf)
      const fakePdfBuffer = Buffer.from('This is actually a plain text file, not a PDF');
      const fakePdfCheck = validateMimeMagicBytes(fakePdfBuffer, 'application/pdf');
      assert.strictEqual(fakePdfCheck.isValid, false);

      // 3. Valid JPEG (0xFF 0xD8 0xFF)
      const validJpgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      assert.strictEqual(validateMimeMagicBytes(validJpgBuffer, 'image/jpeg').isValid, true);

      // 4. Spoofed JPEG (executable bytes labeled as image/jpeg)
      const fakeJpgBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00]); // MZ executable signature
      assert.strictEqual(validateMimeMagicBytes(fakeJpgBuffer, 'image/jpeg').isValid, false);
    });

    it('scanFileForMalware: should report truthful pending-configuration state', () => {
      const res = scanFileForMalware(Buffer.from('test'));
      assert.strictEqual(res.status, 'PENDING_CONFIGURATION');
      assert.match(res.notes, /pending-configuration/);
    });
  });

  // ==========================================================================
  // Suite 9: Database Backup Architecture & Checksum Verification
  // ==========================================================================
  describe('9. Database Backup Creation & SHA-256 Checksum Verification', () => {
    it('should create database snapshot and calculate SHA-256 checksum', async () => {
      const adminId = crypto.randomUUID();
      const backup = await backupService.createBackup(adminId, { note: 'Pre-flight check' });

      assert.ok(backup.id);
      assert.ok(backup.filename.startsWith('bnw_pg16_backup_'));
      assert.strictEqual(backup.checksumSha256.length, 64, 'SHA-256 hash must be 64 hex characters');
      assert.strictEqual(backup.status, 'COMPLETED');
      assert.strictEqual(backup.tablesCount >= 5, true);
      assert.strictEqual(backup.recordsCount >= 5, true);
    });

    it('should cryptographically verify backup integrity', async () => {
      const backup = await backupService.createBackup('admin-user');
      const verifyResult = await backupService.verifyBackup(backup.id, 'admin-user');

      assert.strictEqual(verifyResult.isVerified, true);
      assert.strictEqual(verifyResult.checksumSha256, backup.checksumSha256);

      const refreshed = await backupService.getBackupById(backup.id);
      assert.strictEqual(refreshed.status, 'VERIFIED');
    });
  });

  // ==========================================================================
  // Suite 10: Isolated Sandbox Restore Testing Procedure
  // ==========================================================================
  describe('10. Safe Isolated Restore Testing Procedure', () => {
    it('should execute restore test strictly in isolated sandbox without touching production', async () => {
      const backup = await backupService.createBackup('admin-user');
      const restoreResult = await backupService.testRestore(
        backup.id,
        'admin-user',
        'isolated_sandbox_test_db'
      );

      assert.strictEqual(restoreResult.status, 'SUCCESS');
      assert.strictEqual(restoreResult.targetEnvironment, 'isolated_sandbox_test_db');
      assert.strictEqual(restoreResult.checksumVerified, true);
      assert.strictEqual(restoreResult.tablesValidated >= 5, true);
      assert.strictEqual(restoreResult.recordsValidated >= 5, true);
      assert.strictEqual(restoreResult.durationMs > 0, true);

      const refreshed = await backupService.getBackupById(backup.id);
      assert.strictEqual(refreshed.status, 'RESTORE_TESTED');
      assert.strictEqual(refreshed.restoreTested, true);
    });
  });

  // ==========================================================================
  // Suite 11: Truthful System Monitoring Probes & Telemetry
  // ==========================================================================
  describe('11. Truthful System Monitoring Probes & Application Metrics', () => {
    it('should report comprehensive dependency health with truthful state classification', async () => {
      const health = await monitoringService.getSystemHealth();

      assert.ok(health.timestamp);
      assert.strictEqual(health.service, '@bnw/backend');
      assert.ok(health.dependencies.database);
      assert.ok(health.dependencies.redis);
      assert.ok(health.dependencies.storage);
      assert.ok(health.dependencies.queue);
      assert.ok(health.dependencies.ai_provider);

      // Verify truthful classification of Redis in-memory mode
      assert.strictEqual(
        health.dependencies.redis.status,
        'CONFIGURATION_REQUIRED',
        'Redis must be truthfully classified as CONFIGURATION_REQUIRED when daemon is offline'
      );
    });

    it('should aggregate application request telemetry and latency percentiles', () => {
      monitoringService.recordRequest(200, 12);
      monitoringService.recordRequest(200, 15);
      monitoringService.recordRequest(500, 45);

      const metrics = monitoringService.getApplicationMetrics();
      assert.strictEqual(metrics.totalRequests >= 3, true);
      assert.strictEqual(metrics.statusCodes['2xx'] >= 2, true);
      assert.strictEqual(metrics.statusCodes['5xx'] >= 1, true);
      assert.strictEqual(typeof metrics.latencyP50Ms, 'number');
      assert.strictEqual(typeof metrics.latencyP95Ms, 'number');
    });
  });

  // ==========================================================================
  // Suite 12: Alert Management & Fingerprint Deduplication
  // ==========================================================================
  describe('12. Alert Management & Fingerprint Deduplication', () => {
    it('should deduplicate repeated alerts by fingerprint and increment occurrences', () => {
      const fingerprint = 'test:infra:db_timeout';

      // First alert
      const a1 = monitoringService.triggerAlert({
        fingerprint,
        title: 'Database Query Latency Surge',
        message: 'Query duration exceeded 2000ms threshold',
        severity: 'HIGH',
        category: 'database',
      });
      assert.strictEqual(a1.occurrences, 1);
      assert.strictEqual(a1.status, 'TRIGGERED');

      // Repeated alert with same fingerprint
      const a2 = monitoringService.triggerAlert({
        fingerprint,
        title: 'Database Query Latency Surge',
        message: 'Second latency surge observed',
        severity: 'HIGH',
        category: 'database',
      });
      assert.strictEqual(a2.id, a1.id, 'Alert ID must be preserved for identical fingerprint');
      assert.strictEqual(a2.occurrences, 2, 'Occurrences count must increment');
    });

    it('should transition alert lifecycle: TRIGGERED -> ACKNOWLEDGED -> RESOLVED', () => {
      const alert = monitoringService.triggerAlert({
        fingerprint: 'test:sec:suspicious_logins',
        title: 'Repeated Failed Logins',
        message: '5 failed logins from single IP within 1 minute',
        severity: 'WARN' as any,
        category: 'security',
      });

      const acked = monitoringService.acknowledgeAlert(alert.id, 'admin-sec-ops');
      assert.strictEqual(acked.status, 'ACKNOWLEDGED');
      assert.strictEqual(acked.acknowledgedBy, 'admin-sec-ops');

      const resolved = monitoringService.resolveAlert(alert.id, 'admin-sec-ops');
      assert.strictEqual(resolved.status, 'RESOLVED');
      assert.strictEqual(resolved.resolvedBy, 'admin-sec-ops');
    });
  });
});
