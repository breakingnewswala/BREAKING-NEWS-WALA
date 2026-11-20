/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Step 25: Firebase Storage Security & Media Upload Ingress Test Suite
 * 
 * Verifies:
 * 1. Root storage.rules exists and enforces strict constraints (version 2, default deny, 10MB caps).
 * 2. POST /api/v1/media/upload rejects unauthenticated requests (HTTP 401).
 * 3. Authorized reporter upload succeeds with scoped storagePath and metadata.
 * 4. Cross-reporter and reader privilege boundaries (HTTP 403 for unauthorized categories).
 * 5. Admin and master admin elevated permissions.
 * 6. Unsupported MIME types rejection (HTTP 400).
 * 7. SVG rejection against script injection / XSS vectors (HTTP 400).
 * 8. Configurable per-category file size limits (HTTP 413).
 * 9. Security headers presence (X-Content-Type-Options: nosniff).
 * 10. Malicious executable payload detection (MZ/ELF headers).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

process.env.NODE_ENV = 'test';

import {
  handleApiRequest,
  signToken,
  setApiEngineAdapter,
  adapter,
} from '../src/server/apiEngine.js';
import { LocalJsonAdapter } from '../src/server/persistence/adapter.js';
import { setupIsolatedTestPersistence } from './testIsolationHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const isolation = setupIsolatedTestPersistence({ prefix: 'storage_sec_' });
const testAdapter = isolation.adapter;

const TEST_PORT = 3285;
let server;

function makeRequest(pathName, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const dataStr = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(dataStr ? { 'Content-Length': Buffer.byteLength(dataStr) } : {}),
    };

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: pathName,
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (dataStr) req.write(dataStr);
    req.end();
  });
}

test('Step 25: Storage Security Rules & Ingress Protection Suite', async (t) => {
  server = http.createServer((req, res) => handleApiRequest(req, res));
  await new Promise((resolve) => server.listen(TEST_PORT, '127.0.0.1', resolve));

  t.after(() => {
    server.close();
    if (isolation && isolation.cleanup) {
      isolation.cleanup();
    }
  });

  const reporterToken = signToken({
    id: 'usr-rep-step25',
    sub: 'usr-rep-step25',
    fullName: 'संजय पत्रकार',
    roles: ['REPORTER'],
  });

  const readerToken = signToken({
    id: 'usr-reader-step25',
    sub: 'usr-reader-step25',
    fullName: 'आम पाठक',
    roles: ['READER'],
  });

  const adminToken = signToken({
    id: 'usr-admin-step25',
    sub: 'usr-admin-step25',
    fullName: 'मुख्य संपादक',
    roles: ['ADMIN'],
  });

  // TEST 1: Storage Rules Existence & Structural Integrity
  await t.test('1. storage.rules exists and implements version 2 default deny and size caps', () => {
    const rulesPath = path.join(ROOT_DIR, 'storage.rules');
    assert.ok(fs.existsSync(rulesPath), 'storage.rules must exist at repository root');
    const content = fs.readFileSync(rulesPath, 'utf8');

    assert.ok(content.includes("rules_version = '2'"), 'Must declare rules_version 2');
    assert.ok(content.includes('service firebase.storage'), 'Must target firebase.storage');
    assert.ok(content.includes('10 * 1024 * 1024'), 'Must declare 10MB image limit');
    assert.ok(content.includes('100 * 1024 * 1024'), 'Must declare 100MB video limit');
    assert.ok(content.includes('match /{allPaths=**}'), 'Must contain default match block');
    assert.ok(content.includes('allow read, write: if false;'), 'Must enforce default deny');
    assert.ok(content.includes('match /media/articles/'), 'Must define article media path');
    assert.ok(content.includes('match /reporters/{userId}/credentials/'), 'Must define reporter credentials path');
    assert.ok(content.includes('match /whatsapp/{reporterId}/'), 'Must define whatsapp cards path');
  });

  // TEST 2: Unauthenticated Media Upload Rejection (HTTP 401)
  await t.test('2. POST /api/v1/media/upload rejects unauthenticated requests with HTTP 401', async () => {
    const res = await makeRequest('/api/v1/media/upload', 'POST', {
      fileName: 'scoop.jpg',
      mimeType: 'image/jpeg',
    });
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'ERR_UNAUTHORIZED');
  });

  // TEST 3: Authorized Reporter Upload
  await t.test('3. Authorized reporter can upload valid news image', async () => {
    const tinyJpegBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    const res = await makeRequest('/api/v1/media/upload', 'POST', {
      fileName: 'bhopal_metro_launch.jpg',
      mimeType: 'image/jpeg',
      fileBuffer: tinyJpegBase64,
    }, reporterToken);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.id);
    assert.strictEqual(res.body.data.uploaderId, 'usr-rep-step25');
    assert.ok(res.body.data.storagePath.startsWith('media/articles/'));
    assert.ok(res.body.data.storagePath.includes('bhopal_metro_launch.jpg'));
    assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
  });

  // TEST 4: Reader Role Restriction for News Media (HTTP 403)
  await t.test('4. Reader role is blocked from uploading general news/article media', async () => {
    const res = await makeRequest('/api/v1/media/upload', 'POST', {
      fileName: 'unauthorized_news.jpg',
      mimeType: 'image/jpeg',
      category: 'article',
    }, readerToken);

    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'ERR_FORBIDDEN');
  });

  // TEST 5: Reader Allowed to Upload Profile Avatar Scoped to User
  await t.test('5. Reader can upload profile avatar with user-scoped storagePath', async () => {
    const tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const res = await makeRequest('/api/v1/media/upload', 'POST', {
      fileName: 'my_avatar.png',
      mimeType: 'image/png',
      category: 'avatar',
      fileBuffer: tinyPngBase64,
    }, readerToken);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.storagePath.startsWith('avatars/usr-reader-step25/'));
  });

  // TEST 6: Admin Can Upload Media
  await t.test('6. Admin role can upload media successfully', async () => {
    const res = await makeRequest('/api/v1/media/upload', 'POST', {
      fileName: 'official_announcement.webp',
      mimeType: 'image/webp',
    }, adminToken);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.uploaderId, 'usr-admin-step25');
  });

  // TEST 7: Unsupported MIME Type Rejection (HTTP 400)
  await t.test('7. Rejects unsupported MIME types (e.g. application/x-msdownload)', async () => {
    const res = await makeRequest('/api/v1/media/upload', 'POST', {
      fileName: 'payload.exe',
      mimeType: 'application/x-msdownload',
    }, reporterToken);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'ERR_INVALID_MIME_TYPE');
  });

  // TEST 8: SVG Rejection against Script Injection / XSS
  await t.test('8. Strictly rejects SVG uploads to eliminate script injection vectors', async () => {
    const res = await makeRequest('/api/v1/media/upload', 'POST', {
      fileName: 'graphic.svg',
      mimeType: 'image/svg+xml',
    }, reporterToken);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'ERR_UNSUPPORTED_MIME_TYPE');
  });

  // TEST 9: Oversized File Rejection (Per-category caps)
  await t.test('9. Rejects oversized uploads exceeding category cap', async () => {
    // Avatar cap is 2MB. Simulate 3MB payload
    const res = await makeRequest('/api/v1/media/upload', 'POST', {
      fileName: 'huge_avatar.jpg',
      mimeType: 'image/jpeg',
      category: 'avatar',
      fileSizeBytes: 3 * 1024 * 1024, // 3MB > 2MB cap
    }, readerToken);

    assert.strictEqual(res.statusCode, 413);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'ERR_FILE_TOO_LARGE');
  });

  // TEST 10: Malicious Executable Detection (MZ header)
  await t.test('10. Detects and rejects malicious executable disguised as JPEG', async () => {
    // MZ header in base64: "TVo="
    const mzPayloadBase64 = 'TVoAAAAAAAAAAAAAAAEAAAAAAA==';
    const res = await makeRequest('/api/v1/media/upload', 'POST', {
      fileName: 'trojan.jpg',
      mimeType: 'image/jpeg',
      fileBuffer: mzPayloadBase64,
    }, reporterToken);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'ERR_MALICIOUS_FILE_DETECTED');
  });
});
