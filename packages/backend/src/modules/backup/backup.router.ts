/**
 * BREAKING NEWS WALA — Backup & Disaster Recovery Router
 * Grounded in docs/13-API.md, docs/14-Auth.md, and docs/15-Security.md
 * Mounts administrative backup generation, checksum validation, and isolated restore test endpoints.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { backupService } from './backup.service';
import { requireAuth } from '../auth/auth.middleware';
import { requireRoles } from '../../middleware/rbac';
import { createRateLimiter } from '../../middleware/rate-limiter';

const router = Router();

// Administrative rate limiter: 120 req/min
router.use(createRateLimiter('admin'));

// Enforce authentication & administrator role for all backup operations
router.use(requireAuth);
router.use(requireRoles('ADMIN', 'SUPER_ADMIN'));

/**
 * POST /api/v1/admin/backup/create
 * Creates a new full database snapshot backup.
 */
router.post('/create', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as any).user?.id || 'admin-user';
    const { note } = req.body || {};
    const backup = await backupService.createBackup(actorId, { note });
    res.apiSuccess(backup, { message: 'Database backup snapshot created successfully.' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/backup/list
 * Lists all recorded database backups.
 */
router.get('/list', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const backups = await backupService.listBackups();
    res.apiSuccess(backups);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/backup/:id
 * Retrieves metadata for a specific backup by ID.
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const backup = await backupService.getBackupById(req.params.id as string);
    res.apiSuccess(backup);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/admin/backup/:id/verify
 * Cryptographically verifies backup archive checksum and schema structure.
 */
router.post('/:id/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as any).user?.id || 'admin-user';
    const result = await backupService.verifyBackup(req.params.id as string, actorId);
    res.apiSuccess(result, { message: 'Backup checksum and integrity verified.' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/admin/backup/:id/test-restore
 * Executes safe restore testing into an isolated sandbox test database.
 */
router.post('/:id/test-restore', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as any).user?.id || 'admin-user';
    const { targetEnv } = req.body || {};
    const result = await backupService.testRestore(
      req.params.id as string,
      actorId,
      targetEnv || 'isolated_sandbox_test_db'
    );
    res.apiSuccess(result, { message: 'Isolated sandbox restore test executed.' });
  } catch (err) {
    next(err);
  }
});

export { router as adminBackupRouter };

