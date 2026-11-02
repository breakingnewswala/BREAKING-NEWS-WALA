/**
 * BREAKING NEWS WALA — 404 Not Found Middleware
 * Grounded in docs/13-API.md (Section 1.4: Error Architecture)
 * Catches unhandled routes and forwards standardized notFound errors to the error pipeline.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';

export function notFoundMiddleware(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`The requested endpoint "${req.method} ${req.originalUrl || req.url}" does not exist on this server.`));
}

