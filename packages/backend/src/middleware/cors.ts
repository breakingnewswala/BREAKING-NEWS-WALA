/**
 * BREAKING NEWS WALA — CORS Middleware Configuration
 * Grounded in docs/DECISIONS.md (DEC-040)
 */

import cors from 'cors';
import { config } from '../config';

export function createCorsMiddleware() {
  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      const allowed = config.security.corsAllowedOrigins;
      if (allowed.includes('*') || allowed.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 86400, // 24 hours preflight cache
  });
}

