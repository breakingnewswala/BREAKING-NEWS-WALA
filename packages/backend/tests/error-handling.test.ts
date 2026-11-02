/**
 * Automated Tests: Error Handling and 404 Routing
 * Grounded in docs/13-API.md (Section 1.4: Error Architecture)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Router } from 'express';
import { createApp } from '../src/app';
import { createTestClient, TestClient } from './test-helper';
import { AppError } from '../src/errors/app-error';

describe('Error Handling and 404 Pipeline', () => {
  let client: TestClient;

  before(async () => {
    const testRouter = Router();

    // Attach test routes to verify error handling behavior
    testRouter.get('/test/operational-error', () => {
      throw AppError.forbidden('Forbidden test action');
    });

    testRouter.get('/test/unhandled-error', () => {
      throw new Error('Unexpected crash simulation');
    });

    const app = createApp(testRouter);
    client = await createTestClient(app);
  });

  after(async () => {
    await client.close();
  });

  it('returns standardized 404 for unknown endpoints', async () => {
    const res = await client.get('/api/v1/non-existent-route-999');
    assert.equal(res.status, 404);

    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.data, null);
    assert.equal(json.error.code, 'ERR_NOT_FOUND');
    assert.ok(json.error.message.includes('does not exist'));
    assert.ok(json.meta.requestId);
    assert.ok(json.meta.timestamp);
  });

  it('handles operational AppError with designated status code and error code', async () => {
    const res = await client.get('/test/operational-error');
    assert.equal(res.status, 403);

    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.data, null);
    assert.equal(json.error.code, 'ERR_FORBIDDEN');
    assert.equal(json.error.message, 'Forbidden test action');
    assert.ok(json.meta.requestId);
  });

  it('quarantines unexpected server errors and masks internal stack traces', async () => {
    const res = await client.get('/test/unhandled-error');
    assert.equal(res.status, 500);

    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.data, null);
    assert.equal(json.error.code, 'ERR_INTERNAL_SERVER');
    // Ensure no raw stack traces or internal implementation leaks in client response
    assert.equal(json.stack, undefined);
    assert.ok(json.meta.requestId);
  });
});
