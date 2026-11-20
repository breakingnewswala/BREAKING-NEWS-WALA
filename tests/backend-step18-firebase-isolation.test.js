/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Step 18: Development & Production Firebase Isolation Verification Test Suite
 * 
 * Empirically validates:
 * 1. Development mode default persistence is LocalJsonAdapter.
 * 2. Development mode does not silently select Production Firestore when FIRESTORE_DATABASE_ID is ambient.
 * 3. Development mode does not silently select Production Firestore when PERSISTENCE_MODE=firestore is ambient.
 * 4. Explicit ALLOW_CLOUD_FIRESTORE_IN_DEV allows Firestore selection in development.
 * 5. Active FIRESTORE_EMULATOR_HOST allows Firestore selection in development.
 * 6. Explicit programmatic options.adapterType === 'firestore' selects FirestoreAdapter.
 * 7. Test mode (NODE_ENV=test) defaults to LocalJsonAdapter.
 * 8. Production mode (NODE_ENV=production) with PERSISTENCE_MODE=firestore selects FirestoreAdapter.
 * 9. Production mode with missing database configuration fails closed (ProductionGuardAdapter).
 * 10. CloudStorageService getBucket() returns null in dev without emulator (local disk storage active).
 * 11. CloudStorageService getBucket() activates when FIREBASE_STORAGE_EMULATOR_HOST is set.
 * 12. Client-side isDevEnvironment() detects localhost and dev/test modes.
 * 13. Client-side testConnection() safely skips live production cloud queries in development.
 * 14. Client-side profile and bookmark sync safely no-ops in development without emulator.
 */

import test from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import persistence factory and services
const {
  getPersistenceAdapter,
  LocalJsonAdapter,
  FirestoreAdapter,
  ProductionGuardAdapter,
} = await import('../src/server/persistence/adapter.js');

const { CloudStorageService } = await import('../src/server/storage/cloudStorageService.js');
const {
  isDevEnvironment,
  isEmulatorConfigured,
  testConnection,
  syncUserProfileToFirestore,
  fetchUserBookmarksFromFirestore,
  saveBookmarkToFirestore,
  removeBookmarkFromFirestore,
} = await import('../src/firebase.ts');

test('STEP 18: Development & Production Firebase Isolation Suite', async (t) => {
  // Preserve initial environment
  const originalEnv = { ...process.env };

  const restoreEnv = () => {
    for (const key in process.env) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
  };

  // --------------------------------------------------------------------------
  // 1. Development Mode Persistence Isolation
  // --------------------------------------------------------------------------
  await t.test('1. Development mode selects LocalJsonAdapter by default', () => {
    try {
      process.env.NODE_ENV = 'development';
      delete process.env.PERSISTENCE_MODE;
      delete process.env.FIRESTORE_DATABASE_ID;
      delete process.env.FIRESTORE_EMULATOR_HOST;
      delete process.env.ALLOW_CLOUD_FIRESTORE_IN_DEV;

      const adapter = getPersistenceAdapter({ forceFresh: true });
      assert.ok(adapter instanceof LocalJsonAdapter, 'Default development persistence must be LocalJsonAdapter');
      const health = adapter.getHealth();
      assert.strictEqual(health.adapterType, 'local_json_atomic');
    } finally {
      restoreEnv();
    }
  });

  await t.test('2. Ambient FIRESTORE_DATABASE_ID does NOT force Firestore in development', () => {
    try {
      process.env.NODE_ENV = 'development';
      process.env.FIRESTORE_DATABASE_ID = 'ai-studio-breakingnewswala-81a8a8f4-57a5-4181-aa74-2ef4d34fbab7';
      delete process.env.PERSISTENCE_MODE;
      delete process.env.FIRESTORE_EMULATOR_HOST;
      delete process.env.ALLOW_CLOUD_FIRESTORE_IN_DEV;

      const adapter = getPersistenceAdapter({ forceFresh: true });
      assert.ok(adapter instanceof LocalJsonAdapter, 'Ambient FIRESTORE_DATABASE_ID in dev must not override LocalJsonAdapter');
    } finally {
      restoreEnv();
    }
  });

  await t.test('3. Ambient PERSISTENCE_MODE=firestore does NOT force Firestore in development without authorization', () => {
    try {
      process.env.NODE_ENV = 'development';
      process.env.PERSISTENCE_MODE = 'firestore';
      delete process.env.FIRESTORE_EMULATOR_HOST;
      delete process.env.ALLOW_CLOUD_FIRESTORE_IN_DEV;

      const adapter = getPersistenceAdapter({ forceFresh: true });
      assert.ok(adapter instanceof LocalJsonAdapter, 'Ambient PERSISTENCE_MODE=firestore must not silently connect to cloud in dev');
    } finally {
      restoreEnv();
    }
  });

  await t.test('4. Explicit ALLOW_CLOUD_FIRESTORE_IN_DEV=true allows Firestore in development', () => {
    try {
      process.env.NODE_ENV = 'development';
      process.env.PERSISTENCE_MODE = 'firestore';
      process.env.ALLOW_CLOUD_FIRESTORE_IN_DEV = 'true';

      const adapter = getPersistenceAdapter({ forceFresh: true, offlineOnly: true });
      assert.ok(adapter instanceof FirestoreAdapter, 'Explicit ALLOW_CLOUD_FIRESTORE_IN_DEV authorizes FirestoreAdapter');
    } finally {
      restoreEnv();
    }
  });

  await t.test('5. Active FIRESTORE_EMULATOR_HOST allows Firestore in development', () => {
    try {
      process.env.NODE_ENV = 'development';
      process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8085';

      const adapter = getPersistenceAdapter({ forceFresh: true, offlineOnly: true });
      assert.ok(adapter instanceof FirestoreAdapter, 'Active emulator host authorizes FirestoreAdapter');
    } finally {
      restoreEnv();
    }
  });

  await t.test('6. Programmatic options.adapterType === "firestore" selects FirestoreAdapter', () => {
    try {
      process.env.NODE_ENV = 'development';
      const adapter = getPersistenceAdapter({ forceFresh: true, adapterType: 'firestore', offlineOnly: true });
      assert.ok(adapter instanceof FirestoreAdapter, 'Explicit programmatic request selects FirestoreAdapter');
    } finally {
      restoreEnv();
    }
  });

  // --------------------------------------------------------------------------
  // 2. Test Mode Persistence Isolation
  // --------------------------------------------------------------------------
  await t.test('7. Test mode (NODE_ENV=test) defaults to LocalJsonAdapter', () => {
    try {
      process.env.NODE_ENV = 'test';
      delete process.env.PERSISTENCE_MODE;
      delete process.env.FIRESTORE_DATABASE_ID;
      delete process.env.FIRESTORE_EMULATOR_HOST;

      const adapter = getPersistenceAdapter({ forceFresh: true });
      assert.ok(adapter instanceof LocalJsonAdapter, 'Test mode must default to isolated LocalJsonAdapter');
    } finally {
      restoreEnv();
    }
  });

  // --------------------------------------------------------------------------
  // 3. Production Mode Behavior & Fail-Closed Integrity
  // --------------------------------------------------------------------------
  await t.test('8. Production mode selects FirestoreAdapter when PERSISTENCE_MODE=firestore', () => {
    try {
      process.env.NODE_ENV = 'production';
      process.env.PERSISTENCE_MODE = 'firestore';
      delete process.env.FIRESTORE_EMULATOR_HOST;

      const adapter = getPersistenceAdapter({ forceFresh: true, offlineOnly: true });
      assert.ok(adapter instanceof FirestoreAdapter, 'Production mode with PERSISTENCE_MODE=firestore must select FirestoreAdapter');
    } finally {
      restoreEnv();
    }
  });

  await t.test('9. Production mode fails closed when no database is configured', () => {
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.DATABASE_URL;
      delete process.env.PERSISTENCE_MODE;
      delete process.env.FIRESTORE_DATABASE_ID;

      const adapter = getPersistenceAdapter({ forceFresh: true });
      assert.ok(adapter instanceof ProductionGuardAdapter, 'Production without database must fail closed with ProductionGuardAdapter');
      const health = adapter.getHealth();
      assert.strictEqual(health.status, 'degraded');
      assert.strictEqual(health.databaseAvailable, false);
    } finally {
      restoreEnv();
    }
  });

  // --------------------------------------------------------------------------
  // 4. Cloud Storage Isolation
  // --------------------------------------------------------------------------
  await t.test('10. CloudStorageService getBucket() returns null in development without emulator', () => {
    try {
      process.env.NODE_ENV = 'development';
      delete process.env.FIREBASE_STORAGE_EMULATOR_HOST;
      delete process.env.ALLOW_CLOUD_STORAGE_IN_DEV;

      const storageService = new CloudStorageService();
      const bucket = storageService.getBucket();
      assert.strictEqual(bucket, null, 'Cloud storage must return null in dev without emulator (local disk storage active)');
    } finally {
      restoreEnv();
    }
  });

  await t.test('11. CloudStorageService getBucket() allows connection when FIREBASE_STORAGE_EMULATOR_HOST is set', () => {
    try {
      process.env.NODE_ENV = 'development';
      process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';

      const storageService = new CloudStorageService();
      const bucket = storageService.getBucket();
      // Bucket object is created targeting emulator
      assert.ok(bucket !== null, 'Storage emulator must be recognized in development');
    } finally {
      restoreEnv();
    }
  });

  // --------------------------------------------------------------------------
  // 5. Client-Side Browser Isolation Guards
  // --------------------------------------------------------------------------
  await t.test('12. isDevEnvironment() detects Node test/dev environment', () => {
    assert.strictEqual(isDevEnvironment(), true, 'Current Node test execution must be recognized as dev environment');
  });

  await t.test('13. Client testConnection() safely skips live production queries in development', async () => {
    const result = await testConnection();
    assert.strictEqual(result.connected, false);
    assert.strictEqual(result.offline, true);
  });

  await t.test('14. Client syncUserProfileToFirestore safely no-ops in dev without emulator', async () => {
    let errorOccurred = false;
    try {
      await syncUserProfileToFirestore({ uid: 'mock-test-dev-user', displayName: 'Test Reader' });
    } catch {
      errorOccurred = true;
    }
    assert.strictEqual(errorOccurred, false, 'syncUserProfileToFirestore must safely no-op in dev without throwing or accessing cloud');
  });

  await t.test('15. Client fetchUserBookmarksFromFirestore safely returns empty array in dev', async () => {
    const bookmarks = await fetchUserBookmarksFromFirestore('mock-test-dev-user');
    assert.deepStrictEqual(bookmarks, [], 'fetchUserBookmarksFromFirestore must safely return empty array in dev');
  });

  await t.test('16. Client saveBookmarkToFirestore and removeBookmarkFromFirestore safely no-op in dev', async () => {
    let errorOccurred = false;
    try {
      await saveBookmarkToFirestore('mock-test-dev-user', { id: 'art-100', title: 'परीक्षण समाचार' });
      await removeBookmarkFromFirestore('mock-test-dev-user', 'art-100');
    } catch {
      errorOccurred = true;
    }
    assert.strictEqual(errorOccurred, false, 'Bookmark save/remove must safely no-op in dev without cloud errors');
  });
});
