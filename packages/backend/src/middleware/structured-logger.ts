/**
 * BREAKING NEWS WALA — Structured JSON Logger Middleware
 * Grounded in docs/DECISIONS.md (DEC-073) and CERT-In Compliance (DEC-038)
 * Emits uniform JSON telemetry logs with trace IDs and automated PII/credential redaction.
 */

import { Request, Response, NextFunction } from 'express';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'refreshtoken',
  'token',
  'secret',
  'mfasecret',
  'authorization',
  'cookie',
  'apikey',
  'otp',
]);

export function sanitizeMetadata(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeMetadata);
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeMetadata(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function logStructured(level: 'info' | 'warn' | 'error' | 'debug', message: string, meta: Record<string, any> = {}): void {
  const logPayload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...sanitizeMetadata(meta),
  };

  const jsonString = JSON.stringify(logPayload);
  if (level === 'error') {
    console.error(jsonString);
  } else if (level === 'warn') {
    console.warn(jsonString);
  } else {
    console.log(jsonString);
  }
}

export const logger = {
  info: (msg: string, meta?: any) => logStructured('info', msg, meta),
  warn: (msg: string, meta?: any) => logStructured('warn', msg, meta),
  error: (msg: string, meta?: any) => logStructured('error', msg, meta),
  debug: (msg: string, meta?: any) => logStructured('debug', msg, meta),
};

type MetricsListener = (statusCode: number, durationMs: number) => void;
let globalMetricsListener: MetricsListener | null = null;

export function registerMetricsListener(listener: MetricsListener): void {
  globalMetricsListener = listener;
}

export function structuredLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Capture request finish event to log complete HTTP exchange metrics
  res.on('finish', () => {
    const durationMs = req.startTime ? Date.now() - req.startTime : 0;
    const statusCode = res.statusCode;

    if (globalMetricsListener) {
      try {
        globalMetricsListener(statusCode, durationMs);
      } catch {
        // Safe fail-silent for metrics telemetry
      }
    }

    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    logStructured(level, 'HTTP Request Completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode,
      durationMs,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent') || 'unknown',
    });
  });

  next();
}

