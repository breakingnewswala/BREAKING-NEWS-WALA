/**
 * BREAKING NEWS WALA — Express Application Factory
 * Configures the complete middleware pipeline, routing ingress, and error handling.
 * Grounded in docs/11-Architecture.md and docs/13-API.md
 */

import express, { Application, Router } from 'express';
import { requestIdMiddleware } from './middleware/request-id';
import { securityHeadersMiddleware } from './middleware/security-headers';
import { createCorsMiddleware } from './middleware/cors';
import { cookieParserMiddleware } from './middleware/cookie-parser';
import { responseEnvelopeMiddleware } from './middleware/response-envelope';
import { structuredLoggerMiddleware } from './middleware/structured-logger';
import { notFoundMiddleware } from './middleware/not-found';
import { errorHandlerMiddleware } from './middleware/error-handler';
import { rootRouter } from './routes';

export function createApp(testRouter?: Router): Application {
  const app = express();

  // 1. Trust proxy for Cloudflare / reverse proxy IP headers
  app.set('trust proxy', 1);

  // 2. Request Correlation ID
  app.use(requestIdMiddleware);

  // 3. Security Baseline Headers
  app.use(securityHeadersMiddleware);

  // 4. CORS Whitelist Policy
  app.use(createCorsMiddleware());

  // 5. Body Parsers & Cookie Parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParserMiddleware);

  // 6. Response Helper Envelope Decorator
  app.use(responseEnvelopeMiddleware);

  // 7. Structured Access Logger
  app.use(structuredLoggerMiddleware);

  // 8. Main API Routing Ingress
  app.use(rootRouter);

  // 8b. Optional test router for in-memory integration testing
  if (testRouter) {
    app.use(testRouter);
  }

  // 9. Standard 404 Handler for Unknown Routes
  app.use(notFoundMiddleware);

  // 10. Central Error Handler
  app.use(errorHandlerMiddleware);

  return app;
}

export const app = createApp();
