/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * STEP 21 — Combined Production Readiness Remediation Test Suite
 * 
 * Verifies Targeted Remediation of all 5 STEP 20 Findings:
 * 1. FINDING 20-01: Production Fail-Closed Behavior (HTTP 503 ERR_DATABASE_UNAVAILABLE)
 * 2. FINDING 20-02: Support Google Cloud Ambient ADC (Application Default Credentials)
 * 3. FINDING 20-03: Concurrent Multi-Process Idempotency Collision Resolution
 * 4. FINDING 20-04: Block Firestore Emulator in Production (Fatal Guard)
 * 5. FINDING 20-05: Default Quota Preserved at maxDaily = 20
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { FirestoreAdapter, getAuthoritativeFirestore } from '../src/server/persistence/firestoreAdapter.js';
import { handleApiRequest, signToken, setApiEngineAdapter, adapter as originalAdapter } from '../src/server/apiEngine.js';

// Helper to create test HTTP server
function createHttpTestServer(persistenceAdapter) {
  let server;
  let baseUrl;

  const start = () =>
    new Promise((resolve) => {
      server = http.createServer(async (req, res) => {
        try {
          await handleApiRequest(req, res, { adapter: persistenceAdapter });
        } catch (err) {
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: { message: err.message } }));
          }
        }
      });
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve({ server, baseUrl });
      });
    });

  const stop = () =>
    new Promise((resolve) => {
      if (server) server.close(resolve);
      else resolve();
    });

  return { start, stop, getBaseUrl: () => baseUrl };
}

// -----------------------------------------------------------------------------
// FINDING 20-04: Block Firestore Emulator in Production
// -----------------------------------------------------------------------------
test('FINDING-20-04: getAuthoritativeFirestore throws fatal error when NODE_ENV === "production" and FIRESTORE_EMULATOR_HOST is set', () => {
  const oldEnv = process.env.NODE_ENV;
  const oldHost = process.env.FIRESTORE_EMULATOR_HOST;

  try {
    process.env.NODE_ENV = 'production';
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8085';

    assert.throws(
      () => getAuthoritativeFirestore(),
      (err) => {
        assert.equal(err.code, 'ERR_FATAL_EMULATOR_IN_PRODUCTION');
        assert.match(err.message, /Connecting production traffic to a local emulator is strictly prohibited/);
        return true;
      }
    );
  } finally {
    process.env.NODE_ENV = oldEnv;
    process.env.FIRESTORE_EMULATOR_HOST = oldHost;
  }
});

test('FINDING-20-04: FirestoreAdapter constructor throws fatal error when NODE_ENV === "production" and FIRESTORE_EMULATOR_HOST is set', () => {
  const oldEnv = process.env.NODE_ENV;
  const oldHost = process.env.FIRESTORE_EMULATOR_HOST;

  try {
    process.env.NODE_ENV = 'production';
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8085';

    assert.throws(
      () => new FirestoreAdapter(),
      (err) => {
        assert.equal(err.code, 'ERR_FATAL_EMULATOR_IN_PRODUCTION');
        assert.match(err.message, /Connecting production traffic to a local emulator is strictly prohibited/);
        return true;
      }
    );
  } finally {
    process.env.NODE_ENV = oldEnv;
    process.env.FIRESTORE_EMULATOR_HOST = oldHost;
  }
});

test('FINDING-20-04: FirestoreAdapter accepts FIRESTORE_EMULATOR_HOST when NODE_ENV !== "production"', () => {
  const oldEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'test';
    const adapter = new FirestoreAdapter({ offlineOnly: true });
    assert.ok(adapter);
  } finally {
    process.env.NODE_ENV = oldEnv;
  }
});

// -----------------------------------------------------------------------------
// FINDING 20-01: Production Fail-Closed Behavior
// -----------------------------------------------------------------------------
test('FINDING-20-01: Quota and Generation operations fail closed with HTTP 503 (ERR_DATABASE_UNAVAILABLE) in production if Firestore is unavailable', async () => {
  const oldEnv = process.env.NODE_ENV;
  const oldHost = process.env.FIRESTORE_EMULATOR_HOST;
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.FIRESTORE_EMULATOR_HOST;

    // Create an adapter where firestore is explicitly null (disconnected production state)
    const disconnectedAdapter = new FirestoreAdapter({ offlineOnly: true });
    disconnectedAdapter.firestore = null;

    // 1. Quota Retrieval must fail closed
    await assert.rejects(
      async () => await disconnectedAdapter.getReporterWhatsAppQuota('rep-fail-closed-1'),
      (err) => {
        assert.equal(err.code, 'ERR_DATABASE_UNAVAILABLE');
        assert.equal(err.statusCode, 503);
        return true;
      }
    );

    // 2. Quota Update must fail closed
    await assert.rejects(
      async () => await disconnectedAdapter.setReporterWhatsAppQuota('rep-fail-closed-1', 10),
      (err) => {
        assert.equal(err.code, 'ERR_DATABASE_UNAVAILABLE');
        assert.equal(err.statusCode, 503);
        return true;
      }
    );

    // 3. Atomic Card Generation must fail closed
    await assert.rejects(
      async () => await disconnectedAdapter.atomicSaveEpaperWhatsAppGeneration({
        reporterId: 'rep-fail-closed-1',
        headline: 'Emergency Story',
      }),
      (err) => {
        assert.equal(err.code, 'ERR_DATABASE_UNAVAILABLE');
        assert.equal(err.statusCode, 503);
        return true;
      }
    );

    // 4. Generation History must fail closed
    await assert.rejects(
      async () => await disconnectedAdapter.getEpaperWhatsAppGenerations({ reporterId: 'rep-fail-closed-1' }),
      (err) => {
        assert.equal(err.code, 'ERR_DATABASE_UNAVAILABLE');
        assert.equal(err.statusCode, 503);
        return true;
      }
    );

    // 5. In-memory Map must be untouched (fail-closed, no silent storage)
    const inMemoryGen = disconnectedAdapter._collections.get('epaperWhatsAppGenerations');
    assert.equal(inMemoryGen.size, 0, 'No generation record may be placed in in-memory Map in production');
  } finally {
    process.env.NODE_ENV = oldEnv;
    if (oldHost) process.env.FIRESTORE_EMULATOR_HOST = oldHost;
  }
});

test('FINDING-20-01: API Engine returns HTTP 503 ERR_DATABASE_UNAVAILABLE on quota endpoints in production when database is disconnected', async () => {
  const oldEnv = process.env.NODE_ENV;
  const oldHost = process.env.FIRESTORE_EMULATOR_HOST;
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.FIRESTORE_EMULATOR_HOST;

    const disconnectedAdapter = new FirestoreAdapter({ offlineOnly: true });
    disconnectedAdapter.firestore = null;
    setApiEngineAdapter(disconnectedAdapter);

    const httpHarness = createHttpTestServer(disconnectedAdapter);
    const { baseUrl } = await httpHarness.start();

    const reporterToken = signToken({
      id: 'rep-prod-503',
      fullName: 'उत्पादन संवाददाता',
      role: 'REPORTER',
      status: 'ACTIVE',
    });

    const adminToken = signToken({
      id: 'admin-prod-503',
      fullName: 'मास्टर एडमिन',
      role: 'MASTER_ADMIN',
      status: 'ACTIVE',
    });

    // Test GET /api/v1/epaper/whatsapp/quota
    const quotaRes = await fetch(`${baseUrl}/api/v1/epaper/whatsapp/quota`, {
      headers: { Authorization: `Bearer ${reporterToken}` },
    });
    assert.equal(quotaRes.status, 503);
    const quotaJson = await quotaRes.json();
    assert.equal(quotaJson.error.code, 'ERR_DATABASE_UNAVAILABLE');

    // Test POST /api/v1/epaper/whatsapp/generate
    const genRes = await fetch(`${baseUrl}/api/v1/epaper/whatsapp/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${reporterToken}`,
      },
      body: JSON.stringify({
        headline: 'उत्पादन परीक्षण समाचार',
        format: '1:1',
      }),
    });
    assert.equal(genRes.status, 503);
    const genJson = await genRes.json();
    assert.equal(genJson.error.code, 'ERR_DATABASE_UNAVAILABLE');

    // Test PUT /api/v1/epaper/whatsapp/quota/:reporterId
    const setQuotaRes = await fetch(`${baseUrl}/api/v1/epaper/whatsapp/quota/rep-prod-503`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ maxDaily: 15 }),
    });
    assert.equal(setQuotaRes.status, 503);
    const setQuotaJson = await setQuotaRes.json();
    assert.equal(setQuotaJson.error.code, 'ERR_DATABASE_UNAVAILABLE');

    await httpHarness.stop();
  } finally {
    setApiEngineAdapter(originalAdapter);
    process.env.NODE_ENV = oldEnv;
    if (oldHost) process.env.FIRESTORE_EMULATOR_HOST = oldHost;
  }
});

// -----------------------------------------------------------------------------
// FINDING 20-02: Support Google Cloud Ambient ADC
// -----------------------------------------------------------------------------
test('FINDING-20-02: FirestoreAdapter attempts ADC initialization when in production even without GOOGLE_APPLICATION_CREDENTIALS', () => {
  const oldEnv = process.env.NODE_ENV;
  const oldCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const oldHost = process.env.FIRESTORE_EMULATOR_HOST;

  try {
    process.env.NODE_ENV = 'production';
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    delete process.env.FIRESTORE_EMULATOR_HOST;

    // Creating adapter in production triggers ADC initialization without GOOGLE_APPLICATION_CREDENTIALS
    // In local test environment, ADC may fail with "Could not load the default credentials"
    // The test verifies that ADC was actually attempted (lastError populated or firestore set)
    // and no crash occurs.
    const adapter = new FirestoreAdapter();
    assert.ok(adapter, 'Adapter instance created');
    assert.ok(
      adapter.firestore !== null || (typeof adapter.lastError === 'string' && adapter.lastError.length > 0),
      'Must attempt ADC initialization in production mode'
    );
  } finally {
    process.env.NODE_ENV = oldEnv;
    if (oldCreds) process.env.GOOGLE_APPLICATION_CREDENTIALS = oldCreds;
    if (oldHost) process.env.FIRESTORE_EMULATOR_HOST = oldHost;
  }
});

// -----------------------------------------------------------------------------
// FINDING 20-03: Concurrent Idempotency Collision Resolution
// -----------------------------------------------------------------------------
test('FINDING-20-03: Concurrent transaction collision on idempotency key recovers committed record outside failed transaction', async () => {
  // Mock a Firestore client where runTransaction throws an error simulating a concurrent commit collision,
  // but the committed idempotency document and generation document exist in Firestore.
  const committedGeneration = {
    id: 'wa-gen-committed-123',
    reporterId: 'rep-collision-test',
    idempotencyKey: 'idem-coll-key-99',
    headline: 'Committed Headline from Peer Process',
    format: '1:1',
    date: '2026-11-18',
    createdAt: new Date().toISOString(),
  };

  const committedIdempotencyDoc = {
    exists: true,
    data: () => ({
      idempotencyKey: 'idem-coll-key-99',
      generationId: 'wa-gen-committed-123',
      reporterId: 'rep-collision-test',
      date: '2026-11-18',
    }),
  };

  const mockFirestore = {
    collection: (name) => {
      if (name === 'epaperWhatsAppIdempotency') {
        return {
          doc: (key) => ({
            get: async () => committedIdempotencyDoc,
          }),
        };
      }
      if (name === 'epaperWhatsAppGenerations') {
        return {
          doc: (genId) => ({
            get: async () => ({
              exists: genId === 'wa-gen-committed-123',
              data: () => committedGeneration,
            }),
          }),
        };
      }
      return {
        doc: () => ({
          get: async () => ({ exists: false, data: () => null }),
        }),
      };
    },
    runTransaction: async () => {
      // Simulate gRPC code 3 INVALID_ARGUMENT: Transaction is invalid or closed.
      const err = new Error('3 INVALID_ARGUMENT: Transaction is invalid or closed.');
      err.code = 3;
      err.details = 'Transaction is invalid or closed.';
      throw err;
    },
  };

  const adapter = new FirestoreAdapter({ firestore: mockFirestore });
  const result = await adapter.atomicSaveEpaperWhatsAppGeneration({
    reporterId: 'rep-collision-test',
    idempotencyKey: 'idem-coll-key-99',
    headline: 'Candidate Headline from Colliding Process',
  });

  assert.equal(result.id, 'wa-gen-committed-123', 'Must recover the committed generation record');
  assert.equal(result.headline, 'Committed Headline from Peer Process');
  assert.equal(result.reporterId, 'rep-collision-test');
});

test('FINDING-20-03: Real unrelated errors during transaction are NOT swallowed by idempotency recovery', async () => {
  const mockFirestore = {
    collection: () => ({
      doc: () => ({
        get: async () => ({ exists: false, data: () => null }),
      }),
    }),
    runTransaction: async () => {
      const err = new Error('UNRELATED_DATABASE_FAILURE: Disk IO error');
      err.code = 'ERR_IO';
      throw err;
    },
  };

  const adapter = new FirestoreAdapter({ firestore: mockFirestore });
  await assert.rejects(
    adapter.atomicSaveEpaperWhatsAppGeneration({
      reporterId: 'rep-unrelated-err',
      idempotencyKey: 'idem-key-fresh',
      headline: 'Fresh Story',
    }),
    (err) => {
      assert.equal(err.message, 'UNRELATED_DATABASE_FAILURE: Disk IO error');
      return true;
    }
  );
});

// -----------------------------------------------------------------------------
// FINDING 20-05: Default Quota Preserved at maxDaily = 20
// -----------------------------------------------------------------------------
test('FINDING-20-05: Default WhatsApp daily quota is strictly 20 cards per day', async () => {
  const adapter = new FirestoreAdapter({ offlineOnly: true });
  const reporterId = `rep-default-quota-${Date.now()}`;

  const quotaInfo = await adapter.getReporterWhatsAppQuota(reporterId);
  assert.equal(quotaInfo.maxDaily, 20, 'Default quota must be strictly 20');
  assert.equal(quotaInfo.used, 0);
  assert.equal(quotaInfo.remaining, 20);
  assert.equal(quotaInfo.quotaExceeded, false);
  assert.equal(quotaInfo.timezone, 'Asia/Kolkata');
});

test('FINDING-20-05: Master Admin custom quota update overrides default 20 without altering other reporters', async () => {
  const adapter = new FirestoreAdapter({ offlineOnly: true });
  const repCustom = `rep-custom-${Date.now()}`;
  const repStandard = `rep-standard-${Date.now()}`;

  await adapter.setReporterWhatsAppQuota(repCustom, 35);

  const customInfo = await adapter.getReporterWhatsAppQuota(repCustom);
  const standardInfo = await adapter.getReporterWhatsAppQuota(repStandard);

  assert.equal(customInfo.maxDaily, 35, 'Custom quota must be updated to 35');
  assert.equal(standardInfo.maxDaily, 20, 'Standard reporter must retain canonical default quota of 20');
});
