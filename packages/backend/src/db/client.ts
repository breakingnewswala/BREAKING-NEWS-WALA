/**
 * BREAKING NEWS WALA — Database Integration Boundary
 * Grounded in docs/12-Database.md and docs/DECISIONS.md (DEC-017, DEC-018)
 * Decouples PrismaClient instantiation, connection probing, and lifecycle management.
 */

import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { logStructured } from '../middleware/structured-logger';

let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    const url = config.database.url || 'postgresql://bnw_user:bnw_dev_password_2026@127.0.0.1:5432/bnw_dev?schema=public';

    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url,
        },
      },
      log: config.isDevelopment ? ['error', 'warn'] : ['error'],
    });
  }
  return prismaInstance;
}

export interface DatabaseHealthStatus {
  connected: boolean;
  latencyMs?: number;
  error?: string;
}

/**
 * Actively probes database connectivity with a strict timeout.
 * Never reports a false positive healthy status.
 */
export async function checkDatabaseConnection(timeoutMs: number = 3000): Promise<DatabaseHealthStatus> {
  const startTime = Date.now();
  const prisma = getPrismaClient();

  try {
    const probePromise = prisma.$queryRaw`SELECT 1 as live_probe`;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Database probe timed out after ${timeoutMs}ms`)), timeoutMs)
    );

    await Promise.race([probePromise, timeoutPromise]);
    const latencyMs = Date.now() - startTime;

    return {
      connected: true,
      latencyMs,
    };
  } catch (err: any) {
    const errorMessage = err?.message || 'Database unreachable';
    return {
      connected: false,
      error: errorMessage,
    };
  }
}

/**
 * Safely disconnects the Prisma client during graceful server shutdown.
 */
export async function disconnectDatabase(): Promise<void> {
  if (prismaInstance) {
    try {
      await prismaInstance.$disconnect();
      logStructured('info', 'Database connection disconnected gracefully.');
    } catch (err: any) {
      logStructured('error', 'Error while disconnecting database client', { error: err?.message });
    } finally {
      prismaInstance = null;
    }
  }
}

