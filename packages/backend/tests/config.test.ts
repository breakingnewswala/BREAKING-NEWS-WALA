/**
 * Automated Tests: Configuration Management & Validation
 * Grounded in docs/25-Environment.md
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config';

describe('Configuration Management Suite', () => {
  it('loads valid default development configuration', () => {
    const config = loadConfig();

    assert.ok(['development', 'test', 'production'].includes(config.env));
    assert.equal(typeof config.server.port, 'number');
    assert.ok(config.server.port > 0 && config.server.port <= 65535);
    assert.equal(config.server.apiPrefix, '/api/v1');
    assert.ok(Array.isArray(config.security.corsAllowedOrigins));
    assert.ok(config.security.corsAllowedOrigins.length > 0);
  });

  it('rejects invalid NODE_ENV with clear diagnostic error', () => {
    const prevEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'invalid_environment_name';
      assert.throws(() => loadConfig(), /Invalid NODE_ENV/);
    } finally {
      if (prevEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = prevEnv;
      }
    }
  });

  it('rejects invalid PORT numbers with clear diagnostic error', () => {
    const prevPort = process.env.PORT;
    try {
      process.env.PORT = 'not_a_valid_port';
      assert.throws(() => loadConfig(), /Invalid PORT/);
    } finally {
      if (prevPort === undefined) {
        delete process.env.PORT;
      } else {
        process.env.PORT = prevPort;
      }
    }
  });

  it('enforces DATABASE_URL requirement in production environment', () => {
    const prevEnv = process.env.NODE_ENV;
    const prevUrl = process.env.DATABASE_URL;
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.DATABASE_URL;
      assert.throws(() => loadConfig(), /DATABASE_URL is strictly required in production/);
    } finally {
      if (prevEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = prevEnv;
      }
      if (prevUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = prevUrl;
      }
    }
  });
});
