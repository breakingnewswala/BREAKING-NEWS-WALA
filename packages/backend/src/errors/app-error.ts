/**
 * BREAKING NEWS WALA — Custom Application Error
 * Encapsulates HTTP status code, domain error code, and validation/error details.
 */

import { ErrorCode, ErrorCodes } from './error-codes';
import { ApiErrorDetail } from '@bnw/types';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;
  public readonly details?: ApiErrorDetail[];
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: ErrorCode = ErrorCodes.INTERNAL_SERVER_ERROR,
    details?: ApiErrorDetail[]
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: ApiErrorDetail[]): AppError {
    return new AppError(message, 400, ErrorCodes.BAD_REQUEST, details);
  }

  static unauthorized(message: string = 'Authentication required'): AppError {
    return new AppError(message, 401, ErrorCodes.UNAUTHORIZED);
  }

  static forbidden(message: string = 'Access denied'): AppError {
    return new AppError(message, 403, ErrorCodes.FORBIDDEN);
  }

  static notFound(message: string = 'Resource not found'): AppError {
    return new AppError(message, 404, ErrorCodes.NOT_FOUND);
  }

  static conflict(message: string = 'Resource conflict'): AppError {
    return new AppError(message, 409, ErrorCodes.CONFLICT);
  }

  static validationFailed(message: string = 'Validation failed', details?: ApiErrorDetail[]): AppError {
    return new AppError(message, 422, ErrorCodes.VALIDATION_FAILED, details);
  }

  static rateLimitExceeded(message: string = 'Rate limit exceeded'): AppError {
    return new AppError(message, 429, ErrorCodes.RATE_LIMIT_EXCEEDED);
  }

  static tooManyRequests(message: string = 'Too many requests'): AppError {
    return new AppError(message, 429, ErrorCodes.RATE_LIMIT_EXCEEDED);
  }

  static serviceUnavailable(message: string = 'Service temporarily unavailable'): AppError {
    return new AppError(message, 503, ErrorCodes.SERVICE_UNAVAILABLE);
  }

  static internal(message: string = 'Internal server error'): AppError {
    return new AppError(message, 500, ErrorCodes.INTERNAL_SERVER_ERROR);
  }
}

