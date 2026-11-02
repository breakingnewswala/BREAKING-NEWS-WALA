/**
 * BREAKING NEWS WALA — Request ID Middleware
 * Generates or propagates unique request IDs across distributed execution chains.
 * Grounded in docs/DECISIONS.md (DEC-026, DEC-073)
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers['x-request-id'];
  const requestId = (typeof incomingId === 'string' && incomingId.trim() !== '')
    ? incomingId.trim()
    : `req_${randomUUID()}`;

  req.requestId = requestId;
  req.startTime = Date.now();

  res.setHeader('X-Request-ID', requestId);
  next();
}

