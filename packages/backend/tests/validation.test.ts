/**
 * Automated Tests: Request Validation Middleware
 * Grounded in docs/13-API.md (Section 1.4: Validation)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Router } from 'express';
import { createApp } from '../src/app';
import { createTestClient, TestClient } from './test-helper';
import { validateRequest } from '../src/middleware/validate';

describe('Request Validation Middleware Suite', () => {
  let client: TestClient;

  before(async () => {
    const testRouter = Router();

    // Attach sample validated route
    testRouter.post(
      '/test/validate-article',
      validateRequest({
        body: {
          title: {
            type: 'string',
            required: true,
            minLength: 5,
            maxLength: 100,
            errorMessage: 'Article title must be between 5 and 100 characters',
          },
          category: {
            type: 'string',
            required: true,
            allowedValues: ['politics', 'crime', 'education', 'sports'],
          },
          views: {
            type: 'number',
            min: 0,
          },
        },
        query: {
          lang: {
            type: 'string',
            allowedValues: ['hi', 'en'],
          },
        },
      }),
      (req, res) => {
        res.apiSuccess({ received: req.body });
      }
    );

    const app = createApp(testRouter);
    client = await createTestClient(app);
  });

  after(async () => {
    await client.close();
  });

  it('rejects payload with missing required fields (HTTP 422)', async () => {
    const res = await client.post('/test/validate-article', {});
    assert.equal(res.status, 422);

    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'ERR_VALIDATION_FAILED');
    assert.ok(Array.isArray(json.error.details));
    assert.equal(json.error.details.length >= 2, true);

    const fields = json.error.details.map((d: any) => d.field);
    assert.ok(fields.includes('body.title'));
    assert.ok(fields.includes('body.category'));
  });

  it('rejects payload with invalid string length or disallowed value (HTTP 422)', async () => {
    const res = await client.post('/test/validate-article', {
      title: 'Hi', // Too short (< 5)
      category: 'invalid_category', // Disallowed
    });
    assert.equal(res.status, 422);

    const json = await res.json();
    assert.equal(json.error.code, 'ERR_VALIDATION_FAILED');
    assert.ok(json.error.details.length >= 2);
  });

  it('accepts valid payload and passes to route handler (HTTP 200)', async () => {
    const payload = {
      title: 'Madhya Pradesh News Today',
      category: 'politics',
      views: 10,
    };

    const res = await client.post('/test/validate-article?lang=hi', payload);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.received.title, payload.title);
  });
});
