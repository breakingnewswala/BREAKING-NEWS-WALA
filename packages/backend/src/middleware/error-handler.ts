/**
 * BREAKING NEWS WALA — Central Error Handler Middleware
 * Grounded in docs/13-API.md (Section 1.4) and docs/DECISIONS.md (DEC-026)
 * Safely traps all application errors, logs structured diagnostics, and returns uniform JSON error envelopes.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';
import { ErrorCode, ErrorCodes } from '../errors/error-codes';
import { logStructured } from './structured-logger';
import { config } from '../config';

export function errorHandlerMiddleware(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.requestId || 'unknown';
  let statusCode = 500;
  let errorCode: ErrorCode = ErrorCodes.INTERNAL_SERVER_ERROR;
  let message = 'An unexpected internal error occurred.';
  let details = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
    details = err.details;
  } else if (err.type === 'entity.parse.failed') {
    // Malformed JSON body
    statusCode = 400;
    errorCode = ErrorCodes.BAD_REQUEST;
    message = 'Malformed JSON payload received.';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorCode = ErrorCodes.UNAUTHORIZED;
    message = 'Invalid or expired authentication credentials.';
  }

  // Structured error logging
  logStructured('error', `API Error [${errorCode}]: ${message}`, {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode,
    errorCode,
    details,
    stack: config.isProduction ? undefined : err.stack,
  });

  // Safe client response (no internal stack traces exposed to clients)
  res.apiError(errorCode, message, statusCode, details);
}
