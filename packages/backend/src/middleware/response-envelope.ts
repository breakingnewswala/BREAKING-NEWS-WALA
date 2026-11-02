/**
 * BREAKING NEWS WALA — Response Envelope Helper Middleware
 * Enforces uniform JSON envelopes across all API responses.
 * Grounded in docs/DECISIONS.md (DEC-026) and docs/13-API.md (Section 1.3)
 */

import { Request, Response, NextFunction } from 'express';
import { ApiErrorDetail } from '@bnw/types';

declare global {
  namespace Express {
    interface Response {
      apiSuccess<T>(data: T, meta?: Record<string, any>, statusCode?: number): Response;
      apiError(
        code: string,
        message: string,
        statusCode?: number,
        details?: ApiErrorDetail[]
      ): Response;
    }
  }
}

// Ensure BigInt values can be serialized to JSON safely
if (typeof (BigInt.prototype as any).toJSON === 'undefined') {
  (BigInt.prototype as any).toJSON = function () {
    const num = Number(this);
    return Number.isSafeInteger(num) ? num : this.toString();
  };
}

export function responseEnvelopeMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.apiSuccess = function <T>(data: T, meta: Record<string, any> = {}, statusCode?: number): Response {
    const timestamp = new Date().toISOString();
    const requestId = req.requestId || 'unknown';
    const finalStatus = statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 200);

    return res.status(finalStatus).json({
      success: true,
      data,
      error: null,
      meta: {
        timestamp,
        requestId,
        ...meta,
      },
    });
  };

  res.apiError = function (
    code: string,
    message: string,
    statusCode = 500,
    details?: ApiErrorDetail[]
  ): Response {
    const timestamp = new Date().toISOString();
    const requestId = req.requestId || 'unknown';

    return res.status(statusCode).json({
      success: false,
      data: null,
      error: {
        code,
        message,
        ...(details && details.length > 0 ? { details } : {}),
      },
      meta: {
        timestamp,
        requestId,
      },
    });
  };

  next();
}

