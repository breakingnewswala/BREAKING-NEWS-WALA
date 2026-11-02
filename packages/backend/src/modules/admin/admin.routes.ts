/**
 * BREAKING NEWS WALA — Admin Subsystem Routing Layer
 * Grounded in docs/13-API.md, docs/14-Auth.md, and docs/DECISIONS.md (DEC-048)
 */

import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { adminController } from './admin.controller';

const router = Router();

// 1. Dashboard & Operational KPIs
router.get('/stats', requireAuth, adminController.getDashboardStats);

// 2. User Administration
router.get('/users', requireAuth, adminController.listUsers);
router.get('/users/:id', requireAuth, adminController.getUserDetail);
router.patch('/users/:id/status', requireAuth, adminController.updateUserStatus);

// 3. Role & Permission Governance (DEC-048)
router.get('/roles', requireAuth, adminController.listRoles);
router.post('/users/:id/roles', requireAuth, adminController.assignUserRole);
router.delete('/users/:id/roles', requireAuth, adminController.revokeUserRole);

// 4. Reporter Administration & Verification
router.get('/reporters', requireAuth, adminController.listReporters);
router.get('/reporters/:id', requireAuth, adminController.getReporterDetail);
router.post('/reporters/:id/verify', requireAuth, adminController.verifyReporter);
router.post('/reporters/:id/assignments', requireAuth, adminController.assignReporterTerritory);
router.delete('/reporters/:id/assignments/:assignmentId', requireAuth, adminController.revokeReporterTerritory);
router.patch('/reporters/:id/trust', requireAuth, adminController.updateReporterTrust);

// 5. Audit Logging Stream (Read-only)
router.get('/audit-logs', requireAuth, adminController.listAuditLogs);

// 6. Platform System Settings
router.get('/settings', requireAuth, adminController.listSettings);
router.patch('/settings/:key', requireAuth, adminController.updateSetting);

export { router as adminRouter };

