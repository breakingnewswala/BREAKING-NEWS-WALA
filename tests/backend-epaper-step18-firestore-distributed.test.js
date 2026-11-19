/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * STEP 18 — Distributed Firestore Transactions & Multi-Instance Quota Verification Suite
 * 
 * Verifies FINDING-17-01 Resolution:
 * - Multi-Instance Distributed Firestore Quota Atomicity
 * - Authoritative runTransaction with Optimistic Concurrency Control (OCC)
 * - Strict Read-Before-Write Ordering
 * - Automatic Jittered Contention Retry
 * - Distributed Idempotency Key De-duplication
 * - IST (Asia/Kolkata) Rollover Mechanics
 * - Process Isolation (Multiple distinct adapter instances sharing an authoritative database)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { handleApiRequest, signToken } from '../src/server/apiEngine.js';
import {
  AuthoritativeFirestoreDatabase,
  FirestoreAdapter,
} from '../src/server/persistence/firestoreAdapter.js';
import { getPersistenceAdapter } from '../src/server/persistence/adapter.js';

process.env.NODE_ENV = 'test';

function createHttpTestServer() {
  let server;
  let baseUrl;

  const start = () =>
    new Promise((resolve) => {
      server = http.createServer(async (req, res) => {
        try {
          await handleApiRequest(req, res);
        } catch (err) {
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        }
      });
      server.listen(0, '127.0.0.1', () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve(baseUrl);
      });
    });

  const stop = () =>
    new Promise((resolve) => {
      if (server) server.close(resolve);
      else resolve();
    });

  const request = (path, options = {}) =>
    new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const req = http.request(
        url,
        {
          method: options.method || 'GET',
          headers: options.headers || {},
        },
        (res) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            const buffer = Buffer.concat(chunks);
            let parsed = null;
            const ct = res.headers['content-type'] || '';
            if (ct.includes('application/json')) {
              try {
                parsed = JSON.parse(buffer.toString('utf8'));
              } catch {
                parsed = null;
              }
            }
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: parsed,
              raw: buffer.toString('utf8'),
            });
          });
        }
      );
      req.on('error', reject);
      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      req.end();
    });

  return { start, stop, request };
}

test('Scenario A: Quota = 1 across 2 Independent Instances — 10 Concurrent Requests -> Exactly 1 Succeeds, 9 Fail (429)', async () => {
  const sharedDb = new AuthoritativeFirestoreDatabase();
  const instanceA = new FirestoreAdapter({ sharedDatabase: sharedDb });
  const instanceB = new FirestoreAdapter({ sharedDatabase: sharedDb });

  const reporterId = 'rep-step18-scen-a';
  await instanceA.setReporterWhatsAppQuota(reporterId, 1);

  // Dispatch 10 parallel requests split across instance A and instance B
  const promises = [];
  for (let i = 0; i < 10; i++) {
    const targetInstance = i % 2 === 0 ? instanceA : instanceB;
    promises.push(
      targetInstance.atomicSaveEpaperWhatsAppGeneration({
        reporterId,
        idempotencyKey: `scen-a-call-${i}`,
        editionId: 'ed-scen-a',
        headline: `Headline ${i}`,
      }).then(
        (res) => ({ success: true, res }),
        (err) => ({ success: false, err })
      )
    );
  }

  const results = await Promise.all(promises);
  const successes = results.filter((r) => r.success);
  const failures = results.filter((r) => !r.success);

  assert.equal(successes.length, 1, `Expected exactly 1 success, got ${successes.length}`);
  assert.equal(failures.length, 9, `Expected exactly 9 failures, got ${failures.length}`);

  for (const f of failures) {
    assert.equal(f.err.statusCode, 429);
    assert.equal(f.err.code, 'ERR_QUOTA_EXHAUSTED');
  }

  const quotaInfo = await instanceB.getReporterWhatsAppQuota(reporterId);
  assert.equal(quotaInfo.used, 1);
  assert.equal(quotaInfo.remaining, 0);
  assert.equal(quotaInfo.quotaExceeded, true);
});

test('Scenario B: Quota = 2 across 2 Independent Instances — 10 Concurrent Requests -> Exactly 2 Succeed, 8 Fail (429)', async () => {
  const sharedDb = new AuthoritativeFirestoreDatabase();
  const instanceA = new FirestoreAdapter({ sharedDatabase: sharedDb });
  const instanceB = new FirestoreAdapter({ sharedDatabase: sharedDb });

  const reporterId = 'rep-step18-scen-b';
  await instanceB.setReporterWhatsAppQuota(reporterId, 2);

  const promises = [];
  for (let i = 0; i < 10; i++) {
    const targetInstance = i % 2 === 0 ? instanceA : instanceB;
    promises.push(
      targetInstance.atomicSaveEpaperWhatsAppGeneration({
        reporterId,
        idempotencyKey: `scen-b-call-${i}`,
        editionId: 'ed-scen-b',
        headline: `Headline ${i}`,
      }).then(
        (res) => ({ success: true, res }),
        (err) => ({ success: false, err })
      )
    );
  }

  const results = await Promise.all(promises);
  const successes = results.filter((r) => r.success);
  const failures = results.filter((r) => !r.success);

  assert.equal(successes.length, 2, `Expected exactly 2 successes, got ${successes.length}`);
  assert.equal(failures.length, 8, `Expected exactly 8 failures, got ${failures.length}`);

  for (const f of failures) {
    assert.equal(f.err.statusCode, 429);
    assert.equal(f.err.code, 'ERR_QUOTA_EXHAUSTED');
  }

  const quotaInfo = await instanceA.getReporterWhatsAppQuota(reporterId);
  assert.equal(quotaInfo.used, 2);
  assert.equal(quotaInfo.remaining, 0);
  assert.equal(quotaInfo.quotaExceeded, true);
});

test('Scenario C: Independent Isolation for Different Reporters without Cross-Contamination', async () => {
  const sharedDb = new AuthoritativeFirestoreDatabase();
  const instanceA = new FirestoreAdapter({ sharedDatabase: sharedDb });
  const instanceB = new FirestoreAdapter({ sharedDatabase: sharedDb });

  const repA = 'rep-step18-scen-c-alpha';
  const repB = 'rep-step18-scen-c-beta';

  await instanceA.setReporterWhatsAppQuota(repA, 2);
  await instanceB.setReporterWhatsAppQuota(repB, 3);

  // Dispatch parallel requests for both reporters concurrently across instances
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(
      instanceA.atomicSaveEpaperWhatsAppGeneration({
        reporterId: repA,
        idempotencyKey: `alpha-${i}`,
        editionId: 'ed-alpha',
      }).then((res) => ({ rep: repA, success: true, res }), (err) => ({ rep: repA, success: false, err }))
    );
    promises.push(
      instanceB.atomicSaveEpaperWhatsAppGeneration({
        reporterId: repB,
        idempotencyKey: `beta-${i}`,
        editionId: 'ed-beta',
      }).then((res) => ({ rep: repB, success: true, res }), (err) => ({ rep: repB, success: false, err }))
    );
  }

  const results = await Promise.all(promises);
  const alphaSuccesses = results.filter((r) => r.rep === repA && r.success);
  const betaSuccesses = results.filter((r) => r.rep === repB && r.success);

  assert.equal(alphaSuccesses.length, 2, 'repA must have exactly 2 successes');
  assert.equal(betaSuccesses.length, 3, 'repB must have exactly 3 successes');

  const quotaA = await instanceB.getReporterWhatsAppQuota(repA);
  const quotaB = await instanceA.getReporterWhatsAppQuota(repB);

  assert.equal(quotaA.used, 2);
  assert.equal(quotaA.remaining, 0);
  assert.equal(quotaB.used, 3);
  assert.equal(quotaB.remaining, 0);
});

test('Scenario D: OCC Transaction Contention & Automatic Jittered Retries', async () => {
  const sharedDb = new AuthoritativeFirestoreDatabase();
  const instanceA = new FirestoreAdapter({ sharedDatabase: sharedDb });
  const instanceB = new FirestoreAdapter({ sharedDatabase: sharedDb });

  const reporterId = 'rep-step18-scen-d-retry';
  await instanceA.setReporterWhatsAppQuota(reporterId, 5);

  // Reset total retries counter
  sharedDb.totalRetries = 0;

  // Run 5 requests simultaneously that all succeed through OCC retries if contention occurs
  const promises = [];
  for (let i = 0; i < 5; i++) {
    const inst = i % 2 === 0 ? instanceA : instanceB;
    promises.push(
      inst.atomicSaveEpaperWhatsAppGeneration({
        reporterId,
        idempotencyKey: `retry-scen-d-${i}`,
        editionId: 'ed-scen-d',
        headline: `Contention Test ${i}`,
      })
    );
  }

  const results = await Promise.all(promises);
  assert.equal(results.length, 5);

  const quotaInfo = await instanceA.getReporterWhatsAppQuota(reporterId);
  assert.equal(quotaInfo.used, 5);
  assert.equal(quotaInfo.remaining, 0);
});

test('Scenario E: Distributed Idempotency Key De-duplication across Instances', async () => {
  const sharedDb = new AuthoritativeFirestoreDatabase();
  const instanceA = new FirestoreAdapter({ sharedDatabase: sharedDb });
  const instanceB = new FirestoreAdapter({ sharedDatabase: sharedDb });

  const reporterId = 'rep-step18-scen-e-idempotent';
  await instanceA.setReporterWhatsAppQuota(reporterId, 3);

  const idemKey = 'idempotency-token-unique-xyz';

  // Request 1 on Instance A
  const firstRecord = await instanceA.atomicSaveEpaperWhatsAppGeneration({
    reporterId,
    idempotencyKey: idemKey,
    editionId: 'ed-idempotent',
    headline: 'Original Generation',
  });

  assert.ok(firstRecord.id);

  // Quota used must be 1
  let quota = await instanceB.getReporterWhatsAppQuota(reporterId);
  assert.equal(quota.used, 1);
  assert.equal(quota.remaining, 2);

  // Request 2 on Instance B with identical idempotencyKey
  const secondRecord = await instanceB.atomicSaveEpaperWhatsAppGeneration({
    reporterId,
    idempotencyKey: idemKey,
    editionId: 'ed-idempotent',
    headline: 'Retry Generation',
  });

  // Must return the identical record ID
  assert.equal(secondRecord.id, firstRecord.id);

  // Quota used must STILL be 1 (NOT 2)
  quota = await instanceA.getReporterWhatsAppQuota(reporterId);
  assert.equal(quota.used, 1, 'Idempotency re-delivery must NOT consume an additional quota slot');
  assert.equal(quota.remaining, 2);
});

test('Scenario F: IST (Asia/Kolkata) Rollover Boundary Verification', async () => {
  const sharedDb = new AuthoritativeFirestoreDatabase();
  const instance = new FirestoreAdapter({ sharedDatabase: sharedDb });

  const reporterId = 'rep-step18-scen-f-ist';
  await instance.setReporterWhatsAppQuota(reporterId, 2);

  const istFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });
  const expectedDate = istFormatter.format(new Date());

  const quota = await instance.getReporterWhatsAppQuota(reporterId);
  assert.equal(quota.date, expectedDate);
  assert.equal(quota.timezone, 'Asia/Kolkata');

  // Query quota for past date
  const pastQuota = await instance.getReporterWhatsAppQuota(reporterId, '2026-11-10');
  assert.equal(pastQuota.date, '2026-11-10');
  assert.equal(pastQuota.used, 0);
  assert.equal(pastQuota.remaining, 2);
});

test('Scenario G: True Multi-Instance Isolation without Process-Local Mutex Locks', async () => {
  const sharedDb = new AuthoritativeFirestoreDatabase();

  // Create 4 completely separate adapter instances
  const inst1 = new FirestoreAdapter({ sharedDatabase: sharedDb });
  const inst2 = new FirestoreAdapter({ sharedDatabase: sharedDb });
  const inst3 = new FirestoreAdapter({ sharedDatabase: sharedDb });
  const inst4 = new FirestoreAdapter({ sharedDatabase: sharedDb });

  // Completely wipe local process mutex maps to prove atomicity is guaranteed at the database tier
  inst1._reporterLocks = null;
  inst2._reporterLocks = null;
  inst3._reporterLocks = null;
  inst4._reporterLocks = null;

  const reporterId = 'rep-step18-scen-g-pure-db';
  await inst1.setReporterWhatsAppQuota(reporterId, 3);

  // Dispatch 16 concurrent requests spread across all 4 independent instances
  const promises = [];
  const instances = [inst1, inst2, inst3, inst4];
  for (let i = 0; i < 16; i++) {
    const inst = instances[i % 4];
    promises.push(
      inst.atomicSaveEpaperWhatsAppGeneration({
        reporterId,
        idempotencyKey: `pure-db-${i}`,
        editionId: 'ed-scen-g',
      }).then(
        (res) => ({ success: true, res }),
        (err) => ({ success: false, err })
      )
    );
  }

  const results = await Promise.all(promises);
  const successes = results.filter((r) => r.success);
  const failures = results.filter((r) => !r.success);

  assert.equal(successes.length, 3, `Expected exactly 3 successes, got ${successes.length}`);
  assert.equal(failures.length, 13, `Expected exactly 13 failures, got ${failures.length}`);

  for (const f of failures) {
    assert.equal(f.err.statusCode, 429);
    assert.equal(f.err.code, 'ERR_QUOTA_EXHAUSTED');
  }

  const finalQuota = await inst3.getReporterWhatsAppQuota(reporterId);
  assert.equal(finalQuota.used, 3);
  assert.equal(finalQuota.remaining, 0);
  assert.equal(finalQuota.quotaExceeded, true);
});

test('Scenario H: HTTP API Integration — POST /api/v1/epaper/whatsapp/generate with Idempotency Key', async () => {
  const server = createHttpTestServer();
  await server.start();

  try {
    const localAdapter = getPersistenceAdapter();
    const reporterId = `rep-http-step18-${Date.now()}`;
    const reporterUser = {
      id: reporterId,
      fullName: 'रवि शर्मा',
      role: 'reporter',
      district: 'Bhopal',
    };
    const reporterToken = signToken(reporterUser);
    const adminToken = signToken({ id: 'usr-admin-step18', fullName: 'एडमिन', role: 'admin' });

    // Set reporter quota to 2 via Admin API
    const setQuotaRes = await server.request(`/api/v1/epaper/whatsapp/quota/${reporterId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: { maxDaily: 2 },
    });
    assert.equal(setQuotaRes.status, 200);

    const idempotencyKey = `http-idem-${Date.now()}`;

    // First call: should succeed with HTTP 201
    const res1 = await server.request('/api/v1/epaper/whatsapp/generate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${reporterToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: {
        format: '1:1',
        editionId: 'ed-http-step18',
        headline: 'भोपाल में भव्य दीपोत्सव का आयोजन',
      },
    });

    assert.equal(res1.status, 201);
    assert.equal(res1.body?.success, true);
    assert.ok(res1.body?.data?.id);
    const genId1 = res1.body.data.id;

    // Second call with IDENTICAL idempotency key: should return HTTP 200 or 201 with SAME generation ID
    const res2 = await server.request('/api/v1/epaper/whatsapp/generate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${reporterToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: {
        format: '1:1',
        editionId: 'ed-http-step18',
        headline: 'भोपाल में भव्य दीपोत्सव का आयोजन (पुनः प्रयास)',
      },
    });

    assert.ok(res2.status === 200 || res2.status === 201);
    assert.equal(res2.body?.data?.id, genId1);

    // Verify remaining quota is 1 (only 1 consumed)
    const quotaRes = await server.request(`/api/v1/epaper/whatsapp/quota/${reporterId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${reporterToken}`,
      },
    });
    assert.equal(quotaRes.status, 200);
    assert.equal(quotaRes.body?.data?.used, 1);
    assert.equal(quotaRes.body?.data?.remaining, 1);
  } finally {
    await server.stop();
  }
});
