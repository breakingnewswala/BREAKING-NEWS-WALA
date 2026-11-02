/**
 * BREAKING NEWS WALA — Shared Central Modular Monolith API Engine
 * Authoritative Root Entrypoint for packages/backend
 * Grounded in docs/11-Architecture.md and docs/13-API.md
 */

export * from './app';
export * from './config';
export * from './errors/app-error';
export * from './errors/error-codes';
export * from './db/client';
export * from './middleware/request-id';
export * from './middleware/response-envelope';
export * from './middleware/validate';
export * from './middleware/structured-logger';
export * from './server';

import { startServer, gracefulShutdown } from './server';

if (require.main === module) {
  startServer();

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}
