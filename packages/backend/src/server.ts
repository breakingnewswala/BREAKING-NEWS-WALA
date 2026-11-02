/**
 * BREAKING NEWS WALA — Server Startup & Lifecycle Management
 * Handles network listener initialization, termination signals, and graceful shutdown.
 * Grounded in docs/11-Architecture.md and docs/24-Deployment.md
 */

import { app } from './app';
import { config } from './config';
import { disconnectDatabase } from './db/client';
import { logStructured } from './middleware/structured-logger';
import { notificationQueue } from './modules/notifications/notification.queue';
import { Server } from 'http';

let server: Server | null = null;
let isShuttingDown = false;

export function startServer(): Server {
  const { port, host } = config.server;

  server = app.listen(port, () => {
    logStructured('info', `[BNW Shared Backend API Engine] Listening on ${host}:${port}`, {
      environment: config.env,
      port,
      apiPrefix: config.server.apiPrefix,
    });
  });

  return server;
}

export async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    logStructured('warn', `Shutdown already in progress. Ignoring duplicate signal: ${signal}`);
    return;
  }
  isShuttingDown = true;

  logStructured('info', `Received termination signal (${signal}). Initiating graceful shutdown...`);

  // Force shutdown fallback timeout
  const forceTimer = setTimeout(() => {
    logStructured('error', `Graceful shutdown timed out (${config.server.shutdownTimeoutMs}ms). Forcing process exit.`);
    process.exit(1);
  }, config.server.shutdownTimeoutMs);
  forceTimer.unref();

  // 1. Stop accepting new HTTP requests
  if (server) {
    await new Promise<void>((resolve) => {
      server!.close((err) => {
        if (err) {
          logStructured('error', 'Error while closing HTTP server listener', { error: err.message });
        } else {
          logStructured('info', 'HTTP server stopped accepting new incoming connections.');
        }
        resolve();
      });
    });
  }

  // 2. Shut down notification queue worker
  notificationQueue.shutdown();
  logStructured('info', 'Notification queue worker stopped.');

  // 3. Disconnect database connections
  await disconnectDatabase();

  logStructured('info', 'Graceful shutdown completed successfully. Exiting process.');
  process.exit(0);
}

// Attach termination listeners only when running directly
if (require.main === module) {
  startServer();

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason: any) => {
    logStructured('error', 'Unhandled Promise Rejection', {
      error: reason?.message || String(reason),
      stack: reason?.stack,
    });
  });

  process.on('uncaughtException', (err: Error) => {
    logStructured('error', 'Uncaught Exception detected. Initiating emergency shutdown.', {
      error: err.message,
      stack: err.stack,
    });
    gracefulShutdown('uncaughtException');
  });
}

