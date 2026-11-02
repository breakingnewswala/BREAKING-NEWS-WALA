/**
 * Automated Tests: Health and Readiness Probes
 * Grounded in docs/13-API.md (Section 6) and docs/DECISIONS.md (DEC-074)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app';
import { createTestClient, TestClient } from './test-helper';

describe('Health and Readiness Endpoints', () => {
  let client: TestClient;

  before(async () => {
    const app = createApp();
    client = await createTestClient(app);
  });

  after(async () => {
    await client.close();
  });

  it('GET /api/v1/health returns 200 with standard healthy payload', async () => {
    const res = await client.get('/api/v1/health');
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.error, null);
    assert.equal(json.data.status, 'HEALTHY');
    assert.equal(json.data.service, '@bnw/backend');
    assert.equal(json.data.version, '1.0.0');
    assert.ok(json.meta.timestamp);
    assert.ok(json.meta.requestId);
  });

  it('GET /api/v1/ready accurately reports database status without false positives', async () => {
    const res = await client.get('/api/v1/ready');
    const json = await res.json();

    // In local dev without running Docker container, DB probe must report UNREADY (503)
    if (res.status === 503) {
      assert.equal(json.success, false);
      assert.equal(json.data.status, 'UNREADY');
      assert.equal(json.data.dependencies.database.connected, false);
      assert.equal(json.error.code, 'ERR_SERVICE_UNAVAILABLE');
    } else {
      assert.equal(res.status, 200);
      assert.equal(json.success, true);
      assert.equal(json.data.status, 'READY');
      assert.equal(json.data.dependencies.database.connected, true);
    }
  });

  it('GET /api/v1 returns active service manifest', async () => {
    const res = await client.get('/api/v1');
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.status, 'ACTIVE');
    assert.equal(json.data.version, 'v1');
  });
});

