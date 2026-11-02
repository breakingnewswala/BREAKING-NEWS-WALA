/**
 * BREAKING NEWS WALA — Security Headers Baseline Middleware
 * Grounded in docs/DECISIONS.md (DEC-040) and docs/15-Security.md
 * Applies standard defensive HTTP response headers.
 */

import { Request, Response, NextFunction } from 'express';

export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction): void {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking via iframes
  res.setHeader('X-Frame-Options', 'DENY');

  // Disable legacy buggy XSS filters (modern browser standard)
  res.setHeader('X-XSS-Protection', '0');

  // Strict Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // DNS Prefetch Control
  res.setHeader('X-DNS-Prefetch-Control', 'off');

  // Strict Transport Security (HSTS) in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
}

