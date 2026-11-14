/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Execution 031: Live Server.js Runtime & API Routing Verification Test Suite
 * 
 * Tests the real HTTP server instance spawned from server.js:
 * 1. GET /healthz returns machine-readable JSON (never HTML).
 * 2. GET /api/v1/health returns JSON API response.
 * 3. GET /api/v1/articles returns JSON articles list.
 * 4. GET /api/v1/unregistered-route returns JSON 404 (never HTML fallback).
 * 5. GET /api/v2/unsupported returns JSON 404 (never HTML fallback).
 * 6. GET /epaper & /article/123 serves client-side SPA index.html fallback.
 * 7. GET /assets/index-DM9UgY3w.css serves static CSS with correct MIME and immutable cache header.
 * 8. GET /assets/missing.js returns 404 (never SPA fallback for static asset extensions).
 * 9. GET /..%2F..%2Fetc%2Fpasswd rejects directory traversal with 403 Forbidden.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const TEST_PORT = 3199;

function httpRequest(method, reqPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: reqPath,
      method,
      headers: { ...headers },
    };

    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          // Non-JSON
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          json,
        });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

test('Master Execution 031: Live server.js Runtime Verification', async (t) => {
  // Spawn real child server process running server.js
  const serverProcess = spawn('node', ['server.js'], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PORT: String(TEST_PORT),
      NODE_ENV: 'test',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Wait for server to be ready
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Server failed to start within 5000ms'));
    }, 5000);

    serverProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('listening on')) {
        clearTimeout(timer);
        resolve();
      }
    });

    serverProcess.stderr.on('data', (err) => {
      console.error('[server error]', err.toString());
    });

    serverProcess.on('exit', (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(`Server exited prematurely with code ${code}`));
    });
  });

  // 1. Machine-readable health check
  await t.test('1. GET /healthz returns machine-readable JSON health status', async () => {
    const res = await httpRequest('GET', '/healthz');
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.headers['content-type'].includes('application/json'));
    assert.ok(res.json);
    assert.strictEqual(res.json.status, 'healthy');
    assert.ok(res.json.timestamp);
    assert.ok(res.json.services);
    assert.ok(res.json.services.persistence);
  });

  // 1b. Trailing slash and alternate health check aliases
  await t.test('1b. Health check aliases (/healthz/, /health, /api/health, /api/v1/healthz) return JSON', async () => {
    const paths = ['/healthz/', '/health', '/health/', '/api/health', '/api/healthz', '/api/v1/healthz', '/api/v1/healthz/'];
    for (const p of paths) {
      const res = await httpRequest('GET', p);
      assert.strictEqual(res.statusCode, 200, `Expected 200 for ${p}`);
      assert.ok(res.headers['content-type'].includes('application/json'), `Expected JSON for ${p}`);
      assert.ok(res.json, `Expected valid JSON for ${p}`);
      assert.strictEqual(res.json.status, 'healthy', `Expected healthy status for ${p}`);
    }
  });

  // 2. REST API v1 health
  await t.test('2. GET /api/v1/health returns JSON response and does NOT fall through to SPA HTML', async () => {
    const res = await httpRequest('GET', '/api/v1/health');
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.headers['content-type'].includes('application/json'));
    assert.ok(res.json);
    assert.strictEqual(res.json.status, 'healthy');
    assert.ok(!res.body.includes('<!DOCTYPE html>'));
  });

  // 3. Central REST API v1 endpoint
  await t.test('3. GET /api/v1/articles returns JSON articles list', async () => {
    const res = await httpRequest('GET', '/api/v1/articles');
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.headers['content-type'].includes('application/json'));
    assert.ok(res.json);
    assert.strictEqual(res.json.success, true);
    assert.ok(Array.isArray(res.json.data));
  });

  // 4. Unknown v1 API route returns JSON 404 (never HTML fallback)
  await t.test('4. GET /api/v1/unregistered-route returns JSON 404 with ERR_API_NOT_FOUND', async () => {
    const res = await httpRequest('GET', '/api/v1/unregistered-route');
    assert.strictEqual(res.statusCode, 404);
    assert.ok(res.headers['content-type'].includes('application/json'));
    assert.ok(res.json);
    assert.strictEqual(res.json.success, false);
    assert.strictEqual(res.json.error.code, 'ERR_API_NOT_FOUND');
    assert.ok(!res.body.includes('<!DOCTYPE html>'));
  });

  // 5. Unknown non-v1 API route returns JSON 404 (never HTML fallback)
  await t.test('5. GET /api/v2/unsupported returns JSON 404 with ERR_API_NOT_FOUND', async () => {
    const res = await httpRequest('GET', '/api/v2/unsupported');
    assert.strictEqual(res.statusCode, 404);
    assert.ok(res.headers['content-type'].includes('application/json'));
    assert.ok(res.json);
    assert.strictEqual(res.json.success, false);
    assert.strictEqual(res.json.error.code, 'ERR_API_NOT_FOUND');
    assert.ok(!res.body.includes('<!DOCTYPE html>'));
  });

  // 6. SPA Route serves client-side HTML fallback
  await t.test('6. GET /epaper serves React 19 SPA HTML with 200 OK', async () => {
    const res = await httpRequest('GET', '/epaper');
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.headers['content-type'].includes('text/html'));
    assert.ok(res.body.includes('<html lang="hi">'));
    assert.ok(res.body.includes('id="root"'));
  });

  // 7. Static Asset serving with caching headers
  await t.test('7. GET /assets/index-DM9UgY3w.css serves CSS with correct MIME and immutable cache', async () => {
    const res = await httpRequest('GET', '/assets/index-DM9UgY3w.css');
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.headers['content-type'].includes('text/css'));
    assert.ok(res.headers['cache-control'].includes('immutable'));
    assert.ok(res.headers['x-frame-options']);
  });

  // 8. Missing static file returns 404 (does NOT serve SPA HTML fallback)
  await t.test('8. GET /assets/missing-asset.js returns 404 text/plain (no SPA fallback)', async () => {
    const res = await httpRequest('GET', '/assets/missing-asset.js');
    assert.strictEqual(res.statusCode, 404);
    assert.ok(!res.body.includes('<html lang="hi">'));
  });

  // 9. Directory traversal attempt is blocked with 403 Forbidden
  await t.test('9. Directory traversal attempt is blocked with 403 Forbidden', async () => {
    const res = await httpRequest('GET', '/..%2F..%2Fpackage.json');
    assert.strictEqual(res.statusCode, 403);
  });

  // Clean shutdown
  serverProcess.kill('SIGTERM');
});

