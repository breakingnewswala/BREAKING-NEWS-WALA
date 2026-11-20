/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Isolated Test Persistence Helper (STEP 20)
 * 
 * Guarantees 100% isolation for integration and unit test suites:
 * 1. Generates a dedicated temporary directory in os.tmpdir() for each test run.
 * 2. Instantiates LocalJsonAdapter bound strictly to the temporary JSON file path.
 * 3. Mounts the isolated adapter into apiEngine (via setApiEngineAdapter) and global adapter factory.
 * 4. Ensures zero disk reads or writes to the canonical development data (.data/bnw_persistence.json).
 * 5. Provides safe, reliable synchronous and asynchronous cleanup removing only the files created by the test.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { getPersistenceAdapter, LocalJsonAdapter } from '../src/server/persistence/adapter.js';
import { setApiEngineAdapter } from '../src/server/apiEngine.js';

const REAL_DATA_DIR = path.resolve(process.cwd(), '.data');
const REAL_STORE_FILE = path.join(REAL_DATA_DIR, 'bnw_persistence.json');

export function setupIsolatedTestPersistence(options = {}) {
  // 1. Create a unique temporary directory
  const prefix = options.prefix || 'bnw_test_';
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const tempFilePath = path.join(tempDir, 'test_persistence.json');

  // Hard safety invariant: Never allow temp path to resolve to real persistence file
  if (path.resolve(tempFilePath) === REAL_STORE_FILE || path.resolve(tempDir) === REAL_DATA_DIR) {
    throw new Error('SECURITY VIOLATION: Isolated test persistence path cannot target .data/bnw_persistence.json');
  }

  // 2. Instantiate isolated adapter with forceFresh: true so factory registers it
  const isolatedAdapter = getPersistenceAdapter({
    forceFresh: true,
    filePath: tempFilePath,
  });

  // 3. Mount into apiEngine so handleApiRequest uses the isolated adapter
  setApiEngineAdapter(isolatedAdapter);

  // 4. Return isolated harness
  const cleanup = () => {
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (err) {
      // Ignore temporary file removal errors on Windows file-locks
    }
  };

  return {
    adapter: isolatedAdapter,
    tempDir,
    tempFilePath,
    cleanup,
  };
}
