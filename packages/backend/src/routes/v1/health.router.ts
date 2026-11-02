/**
 * BREAKING NEWS WALA — Health & Readiness Ingress Router
 * Grounded in docs/13-API.md (Section 6) and docs/DECISIONS.md (DEC-074)
 * Provides genuine health probes and strict dependency readiness checks.
 */

import { Router, Request, Response } from 'express';
import { checkDatabaseConnection } from '../../db/client';
import { config } from '../../config';

const router = Router();

/**
 * Liveness Probe: Verifies process execution and Node.js event loop health.
 * GET /api/v1/health
 */
router.get('/health', (_req: Request, res: Response) => {
  const uptimeSeconds = Math.floor(process.uptime());
  const memoryUsage = process.memoryUsage();

  return res.apiSuccess({
    status: 'HEALTHY',
    service: '@bnw/backend',
    version: '1.0.0',
    environment: config.env,
    uptimeSeconds,
    memory: {
      rssMb: Math.round(memoryUsage.rss / (1024 * 1024)),
      heapUsedMb: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
      heapTotalMb: Math.round(memoryUsage.heapTotal / (1024 * 1024)),
    },
  });
});

/**
 * Readiness Probe: Actively evaluates dependency availability (PostgreSQL).
 * Never returns a false healthy status if database is unreachable.
 * GET /api/v1/ready
 */
router.get('/ready', async (_req: Request, res: Response) => {
  const dbHealth = await checkDatabaseConnection(2500);

  const readinessData = {
    status: dbHealth.connected ? 'READY' : 'UNREADY',
    service: '@bnw/backend',
    dependencies: {
      database: {
        type: 'PostgreSQL 16',
        connected: dbHealth.connected,
        ...(dbHealth.latencyMs !== undefined ? { latencyMs: dbHealth.latencyMs } : {}),
        ...(dbHealth.error ? { error: dbHealth.error } : {}),
      },
    },
  };

  if (!dbHealth.connected) {
    // 503 Service Unavailable when core database dependency is offline
    return res.status(503).json({
      success: false,
      data: readinessData,
      error: {
        code: 'ERR_SERVICE_UNAVAILABLE',
        message: 'Backend is unready: Database dependency is unreachable or offline.',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: _req.requestId || 'unknown',
      },
    });
  }

  return res.apiSuccess(readinessData);
});

export { router as healthRouter };

