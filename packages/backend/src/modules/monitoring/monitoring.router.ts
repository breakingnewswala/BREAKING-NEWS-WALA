/**
 * BREAKING NEWS WALA — System Monitoring & Alert Management Router
 * Grounded in docs/13-API.md, docs/Monitoring.md, and docs/DECISIONS.md (DEC-071, DEC-072)
 * Mounts system dependency health, application metrics, and alert management endpoints.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { monitoringService } from './monitoring.service';
import { requireAuth } from '../auth/auth.middleware';
import { requireRoles } from '../../middleware/rbac';
import { createRateLimiter } from '../../middleware/rate-limiter';

const router = Router();

// Administrative rate limiter: 120 req/min
router.use(createRateLimiter('admin'));

/**
 * GET /api/v1/admin/monitoring/health
 * Comprehensive multi-dependency health probe.
 */
router.get('/health', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await monitoringService.getSystemHealth();
    res.apiSuccess(health);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/monitoring/metrics
 * Returns real-time application metrics (requests, latency, error rate, memory).
 */
router.get('/metrics', requireAuth, requireRoles('ADMIN', 'SUPER_ADMIN'), (_req: Request, res: Response) => {
  const metrics = monitoringService.getApplicationMetrics();
  res.apiSuccess(metrics);
});

/**
 * GET /api/v1/admin/monitoring/alerts
 * Lists active and historical infrastructure/security alerts.
 */
router.get('/alerts', requireAuth, requireRoles('ADMIN', 'SUPER_ADMIN'), (req: Request, res: Response) => {
  const status = req.query.status as any;
  const severity = req.query.severity as any;
  const alerts = monitoringService.listAlerts({ status, severity });
  res.apiSuccess(alerts);
});

/**
 * POST /api/v1/admin/monitoring/alerts/:id/ack
 * Acknowledges an active alert.
 */
router.post('/alerts/:id/ack', requireAuth, requireRoles('ADMIN', 'SUPER_ADMIN'), (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as any).user?.id || 'admin-user';
    const alert = monitoringService.acknowledgeAlert(req.params.id as string, actorId);
    res.apiSuccess(alert, { message: 'Alert acknowledged.' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/admin/monitoring/alerts/:id/resolve
 * Resolves an alert.
 */
router.post('/alerts/:id/resolve', requireAuth, requireRoles('ADMIN', 'SUPER_ADMIN'), (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as any).user?.id || 'admin-user';
    const alert = monitoringService.resolveAlert(req.params.id as string, actorId);
    res.apiSuccess(alert, { message: 'Alert marked as resolved.' });
  } catch (err) {
    next(err);
  }
});

export { router as adminMonitoringRouter };
