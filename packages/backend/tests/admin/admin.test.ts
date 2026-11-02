/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Admin Subsystem & Platform Governance Tests
 * Task ID: BNW-MASTER-001
 * Grounded in docs/11-Architecture.md, docs/13-API.md, docs/14-Auth.md, and docs/DECISIONS.md (DEC-048)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { AdminService } from '../../src/modules/admin/admin.service';
import { InMemoryAdminRepository } from '../../src/modules/admin/admin.repository';

describe('BNW-MASTER-001: Backend Admin Subsystem & Platform Governance Suite', () => {
  let adminService: AdminService;
  let repo: InMemoryAdminRepository;

  beforeEach(() => {
    repo = new InMemoryAdminRepository();
    adminService = new AdminService(repo);
  });

  // 1. ADMINISTRATIVE RBAC ENFORCEMENT & DEC-048
  describe('Administrative Authorization & DEC-048 Invariant', () => {
    it('should permit operations for authorized administrators', async () => {
      const adminRoles = ['admin'];
      const stats = await adminService.getDashboardStats(adminRoles);
      assert.ok(stats.totalUsers >= 2, 'Stats should reflect seeded users');
      assert.ok(stats.systemHealth.database === true);
    });

    it('should permit operations for super_admin roles with ROLE_ prefix', async () => {
      const superAdminRoles = ['ROLE_SUPER_ADMIN'];
      const stats = await adminService.getDashboardStats(superAdminRoles);
      assert.ok(stats.totalReporters >= 2);
    });

    it('should strictly reject non-admin users (editors, reporters, citizens)', async () => {
      const unauthorizedRoles = [
        ['editor'],
        ['ROLE_EDITOR'],
        ['reporter'],
        ['ROLE_REPORTER'],
        ['citizen'],
        ['ROLE_USER'],
        [],
      ];

      for (const roles of unauthorizedRoles) {
        await assert.rejects(
          async () => adminService.getDashboardStats(roles),
          (err: any) => {
            assert.strictEqual(err.statusCode, 403);
            assert.ok(err.message.includes('Administrative privileges required'));
            return true;
          }
        );
      }
    });

    it('DEC-048: ROLE_CHIEF_EDITOR remains Pending Approval and cannot be assigned', async () => {
      await assert.rejects(
        async () => adminService.assignUserRole('admin_id', ['admin'], 'usr_rep_bhopal', 'ROLE_CHIEF_EDITOR'),
        (err: any) => {
          assert.strictEqual(err.statusCode, 403);
          assert.ok(err.message.includes('DEC-048'));
          return true;
        }
      );

      await assert.rejects(
        async () => adminService.assignUserRole('admin_id', ['admin'], 'usr_rep_bhopal', 'chief_editor'),
        (err: any) => {
          assert.strictEqual(err.statusCode, 403);
          assert.ok(err.message.includes('DEC-048'));
          return true;
        }
      );
    });
  });

  // 2. USER MANAGEMENT
  describe('User Administration & Status Lifecycle', () => {
    it('should list users with pagination and search filtering', async () => {
      const res = await adminService.listUsers(['admin'], { page: 1, limit: 10, search: 'राजेश' });
      assert.ok(res.users.length >= 1);
      assert.ok(res.users[0].fullName.includes('राजेश'));
    });

    it('should update user status and record audit log', async () => {
      const updated = await adminService.updateUserStatus(
        'admin_id',
        ['admin'],
        'usr_rep_bhopal',
        'suspended',
        'Violation of code of conduct'
      );
      assert.strictEqual(updated.status, 'suspended');

      // Verify audit trail
      const auditRes = await adminService.listAuditLogs(['admin'], { targetType: 'USER' });
      assert.ok(auditRes.logs.length >= 1);
      assert.ok(auditRes.logs[0].action.includes('USER_STATUS_SUSPENDED'));
    });

    it('should reject invalid user statuses', async () => {
      await assert.rejects(
        async () => adminService.updateUserStatus('admin_id', ['admin'], 'usr_rep_bhopal', 'banned_forever'),
        (err: any) => {
          assert.strictEqual(err.statusCode, 400);
          return true;
        }
      );
    });
  });

  // 3. REPORTER VERIFICATION & BEAT MANAGEMENT
  describe('Reporter Directory, Verification & Beat Management', () => {
    it('should list pending and verified reporters', async () => {
      const pendingRes = await adminService.listReporters(['admin'], { status: 'pending' });
      assert.ok(pendingRes.reporters.length >= 1);
      assert.strictEqual(pendingRes.reporters[0].verificationStatus, 'pending');

      const verifiedRes = await adminService.listReporters(['admin'], { status: 'verified' });
      assert.ok(verifiedRes.reporters.length >= 1);
      assert.strictEqual(verifiedRes.reporters[0].verificationStatus, 'verified');
    });

    it('should verify a pending reporter and record verification timestamp', async () => {
      const verified = await adminService.verifyReporter(
        'admin_id',
        ['admin'],
        'usr_rep_indore_pending',
        'verified'
      );
      assert.strictEqual(verified.verificationStatus, 'verified');
      assert.ok(verified.verifiedAt instanceof Date);

      // Verify reporter detail
      const rep = await adminService.getReporterDetail(['admin'], 'usr_rep_indore_pending');
      assert.strictEqual(rep.verificationStatus, 'verified');
    });

    it('should require a reason when rejecting reporter verification', async () => {
      await assert.rejects(
        async () => adminService.verifyReporter('admin_id', ['admin'], 'usr_rep_indore_pending', 'rejected', ''),
        (err: any) => {
          assert.strictEqual(err.statusCode, 400);
          assert.ok(err.message.includes('documented reason'));
          return true;
        }
      );
    });

    it('should assign and revoke territory beats for a reporter', async () => {
      const beat = await adminService.assignReporterTerritory(
        'admin_id',
        ['admin'],
        'usr_rep_bhopal',
        'dist_sehore',
        'SECONDARY'
      );
      assert.ok(beat.id);
      assert.strictEqual(beat.assignmentType, 'SECONDARY');

      const rep = await adminService.getReporterDetail(['admin'], 'usr_rep_bhopal');
      assert.ok(rep.assignedBeats.some((b) => b.id === beat.id));

      const revoked = await adminService.revokeReporterTerritory('admin_id', ['admin'], beat.id);
      assert.strictEqual(revoked.success, true);
    });

    it('should update reporter trust score and direct-publish eligibility', async () => {
      const updated = await adminService.updateReporterTrust(
        'admin_id',
        ['admin'],
        'usr_rep_bhopal',
        92,
        true,
        true
      );
      assert.strictEqual(updated.trustScore, 92);
      assert.strictEqual(updated.canDirectPublish, true);
      assert.strictEqual(updated.isTrustedReporter, true);
    });
  });

  // 4. SYSTEM SETTINGS & AUDIT LOGS
  describe('System Settings & Administrative Audit Logs', () => {
    it('should list safe system settings without leaking credentials', async () => {
      const settings = await adminService.listSettings(['admin']);
      assert.ok(settings.length >= 3);
      for (const s of settings) {
        assert.ok(!s.key.toLowerCase().includes('secret'));
        assert.ok(!s.key.toLowerCase().includes('password'));
      }
    });

    it('should update system settings and audit the modification', async () => {
      const updated = await adminService.updateSetting(
        'admin_id',
        ['admin'],
        'editorial.min_headline_chars',
        '20'
      );
      assert.strictEqual(updated.value, '20');

      const auditRes = await adminService.listAuditLogs(['admin'], { action: 'SYSTEM_SETTING_UPDATED' });
      assert.ok(auditRes.logs.length >= 1);
    });

    it('should block modifying secret keys through the settings API', async () => {
      await assert.rejects(
        async () => adminService.updateSetting('admin_id', ['admin'], 'jwt.secret_key', 'malicious_value'),
        (err: any) => {
          assert.strictEqual(err.statusCode, 403);
          return true;
        }
      );
    });
  });
});

