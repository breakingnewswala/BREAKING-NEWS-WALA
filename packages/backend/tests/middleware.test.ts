/**
 * Automated Tests: Core Middlewares (Request ID, Response Envelope, Security Headers)
 * Grounded in docs/DECISIONS.md (DEC-026, DEC-040, DEC-073)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app';
import { createTestClient, TestClient } from './test-helper';

describe('Core Middleware Suite', () => {
  let client: TestClient;

  before(async () => {
    const app = createApp();
    client = await createTestClient(app);
  });

  after(async () => {
    await client.close();
  });

  it('generates X-Request-ID header if not supplied by client', async () => {
    const res = await client.get('/api/v1/health');
    const headerRequestId = res.headers.get('x-request-id');

    assert.ok(headerRequestId, 'X-Request-ID header must exist');
    assert.ok(headerRequestId.startsWith('req_'), 'Generated ID must start with req_');

    const json = await res.json();
    assert.equal(json.meta.requestId, headerRequestId, 'Meta requestId must match header');
  });

  it('preserves and propagates incoming X-Request-ID header', async () => {
    const customTraceId = 'trace_custom_gateway_12345';
    const res = await client.get('/api/v1/health', {
      'x-request-id': customTraceId,
    });

    const headerRequestId = res.headers.get('x-request-id');
    assert.equal(headerRequestId, customTraceId);

    const json = await res.json();
    assert.equal(json.meta.requestId, customTraceId);
  });

  it('sets defensive HTTP security headers on all responses', async () => {
    const res = await client.get('/api/v1/health');

    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'DENY');
    assert.equal(res.headers.get('x-xss-protection'), '0');
    assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    assert.equal(res.headers.get('x-dns-prefetch-control'), 'off');
  });

  it('enforces standardized JSON envelope format on successful responses', async () => {
    const res = await client.get('/api/v1/health');
    const json = await res.json();

    assert.equal(typeof json.success, 'boolean');
    assert.equal(json.success, true);
    assert.ok(json.data !== null && typeof json.data === 'object');
    assert.equal(json.error, null);
    assert.ok(json.meta !== null && typeof json.meta === 'object');
    assert.ok(json.meta.timestamp);
    assert.ok(json.meta.requestId);
  });
});

