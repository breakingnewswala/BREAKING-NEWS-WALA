/**
 * BREAKING NEWS WALA — Centralized Environment Configuration
 * Grounded in docs/25-Environment.md and docs/DECISIONS.md (DEC-011)
 * Validates environment parameters at startup with safe defaults for dev/test.
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env if present
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface AppConfig {
  env: 'development' | 'test' | 'production';
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  server: {
    port: number;
    host: string;
    apiPrefix: string;
    shutdownTimeoutMs: number;
  };
  security: {
    corsAllowedOrigins: string[];
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
  };
  database: {
    url: string | null;
  };
  auth: {
    jwtSecret: string;
    accessTokenExpiresIn: string;
    refreshTokenExpiresInDays: number;
    issuer: string;
    audience: string;
  };
  storage: {
    provider: 'local' | 's3' | 'r2' | 'minio';
    publicBucket: string;
    privateBucket: string;
    endpoint: string | null;
    region: string;
    accessKeyId: string | null;
    secretAccessKey: string | null;
    cdnBaseUrl: string;
    presignedUrlTtlSeconds: number;
  };
  notifications: {
    fcmEnabled: boolean;
    fcmServiceAccount: string | null;
    webPushEnabled: boolean;
    vapidPublicKey: string | null;
    vapidPrivateKey: string | null;
    vapidSubject: string;
    rateLimitMaxHourly: number;
    rateLimitMaxDaily: number;
    quietHoursStartHour: number;
    quietHoursEndHour: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
  };
}

function parseAllowedOrigins(raw?: string): string[] {
  if (!raw || raw.trim() === '') {
    return ['http://localhost:3000', 'http://localhost:5173'];
  }
  return raw.split(',').map((origin) => origin.trim()).filter(Boolean);
}

export function loadConfig(): AppConfig {
  const env = (process.env.NODE_ENV || 'development').toLowerCase() as AppConfig['env'];
  const validEnvs = ['development', 'test', 'production'];
  
  if (!validEnvs.includes(env)) {
    throw new Error(`[Config Error] Invalid NODE_ENV: "${env}". Allowed values: ${validEnvs.join(', ')}`);
  }

  const port = parseInt(process.env.PORT || '3000', 10);
  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error(`[Config Error] Invalid PORT: "${process.env.PORT}". Must be an integer between 1 and 65535.`);
  }

  const databaseUrl = process.env.DATABASE_URL || null;
  const jwtSecret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || null;
  if (env === 'production') {
    if (!databaseUrl) {
      throw new Error('[Config Error] DATABASE_URL is strictly required in production environment.');
    }
    if (!jwtSecret || jwtSecret.length < 32) {
      throw new Error('[Config Error] JWT_SECRET (minimum 32 characters) is strictly required in production environment.');
    }
  }

  return {
    env,
    isProduction: env === 'production',
    isDevelopment: env === 'development',
    isTest: env === 'test',
    server: {
      port,
      host: process.env.HOST || '0.0.0.0',
      apiPrefix: process.env.API_PREFIX || '/api/v1',
      shutdownTimeoutMs: parseInt(process.env.SERVER_GRACEFUL_SHUTDOWN_TIMEOUT_MS || '5000', 10),
    },
    security: {
      corsAllowedOrigins: parseAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS),
      rateLimitWindowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '60000', 10),
      rateLimitMaxRequests: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS || '1000', 10),
    },
    database: {
      url: databaseUrl,
    },
    auth: {
      jwtSecret: jwtSecret || 'bnw_dev_jwt_secret_key_2026_super_secure_32_chars',
      accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
      refreshTokenExpiresInDays: parseInt(process.env.JWT_REFRESH_EXPIRATION_DAYS || '7', 10),
      issuer: 'breaking-news-wala',
      audience: 'bnw-clients',
    },
    storage: {
      provider: (process.env.STORAGE_PROVIDER || 'local') as AppConfig['storage']['provider'],
      publicBucket: process.env.STORAGE_BUCKET_PUBLIC || 'bnw-public-media',
      privateBucket: process.env.STORAGE_BUCKET_PRIVATE || 'bnw-private-vault',
      endpoint: process.env.STORAGE_ENDPOINT || null,
      region: process.env.STORAGE_REGION || 'auto',
      accessKeyId: process.env.STORAGE_ACCESS_KEY || null,
      secretAccessKey: process.env.STORAGE_SECRET_KEY || null,
      cdnBaseUrl: process.env.CDN_BASE_URL || 'https://cdn.breakingnewswala.com',
      presignedUrlTtlSeconds: parseInt(process.env.STORAGE_PRESIGNED_TTL_SECONDS || '900', 10),
    },
    notifications: {
      fcmEnabled: process.env.FCM_ENABLED === 'true',
      fcmServiceAccount: process.env.FCM_SERVICE_ACCOUNT_KEY || null,
      webPushEnabled: process.env.WEB_PUSH_ENABLED === 'true',
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY || null,
      vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || null,
      vapidSubject: process.env.VAPID_SUBJECT || 'mailto:admin@breakingnewswala.com',
      rateLimitMaxHourly: parseInt(process.env.NOTIF_MAX_HOURLY || '3', 10),
      rateLimitMaxDaily: parseInt(process.env.NOTIF_MAX_DAILY || '10', 10),
      quietHoursStartHour: parseInt(process.env.NOTIF_QUIET_HOURS_START || '22', 10),
      quietHoursEndHour: parseInt(process.env.NOTIF_QUIET_HOURS_END || '6', 10),
    },
    logging: {
      level: (process.env.LOG_LEVEL || (env === 'production' ? 'info' : 'debug')) as AppConfig['logging']['level'],
    },
  };
}

export const config = loadConfig();

