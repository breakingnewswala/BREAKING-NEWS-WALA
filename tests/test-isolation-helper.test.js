import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { setupIsolatedTestPersistence } from './testIsolationHelper.js';

test('Test Isolation Helper Verification', async (t) => {
  await t.test('creates isolated adapter in temporary directory', () => {
    const { adapter, tempDir, tempFilePath, cleanup } = setupIsolatedTestPersistence({ prefix: 'verify_iso_' });

    try {
      assert.ok(fs.existsSync(tempDir), 'Temporary directory must exist');
      assert.ok(fs.existsSync(tempFilePath), 'Temporary persistence file must exist');
      assert.strictEqual(adapter.storage.filePath, tempFilePath, 'Adapter must be bound to temp file');
      assert.notStrictEqual(path.resolve(tempFilePath), path.resolve('.data/bnw_persistence.json'));

      // Check baseline seeded data
      assert.ok(adapter.data.articles.length > 0, 'Isolated adapter must have seeded articles');
      assert.ok(adapter.data.categories.length > 0, 'Isolated adapter must have seeded categories');
    } finally {
      cleanup();
      assert.strictEqual(fs.existsSync(tempDir), false, 'Temporary directory must be deleted on cleanup');
    }
  });

  await t.test('mutations in isolated adapter do NOT touch real persistence file', async () => {
    const realDbPath = path.resolve('.data/bnw_persistence.json');
    const realStatBefore = fs.statSync(realDbPath);

    const { adapter, tempDir, tempFilePath, cleanup } = setupIsolatedTestPersistence({ prefix: 'verify_mut_' });

    try {
      // Create test draft
      const testArt = await adapter.createDraft(
        {
          title: 'Temporary Test Isolation Verification Article',
          content: 'This must only write to tempFilePath',
          districtId: 'dist-bhopal',
          categoryId: 'cat-top',
        },
        { id: 'usr-reporter-1', role: 'REPORTER' }
      );

      assert.ok(testArt.id, 'Created draft must have an ID');
      const tempContent = JSON.parse(fs.readFileSync(tempFilePath, 'utf8'));
      assert.ok(tempContent.articles.some((a) => a.id === testArt.id), 'Article must exist in temp file');

      // Verify real file is unchanged
      const realStatAfter = fs.statSync(realDbPath);
      assert.strictEqual(realStatAfter.mtimeMs, realStatBefore.mtimeMs, 'Real file mtime must be unchanged');
      assert.strictEqual(realStatAfter.size, realStatBefore.size, 'Real file size must be unchanged');
    } finally {
      cleanup();
      assert.strictEqual(fs.existsSync(tempDir), false, 'Temporary directory must be deleted on cleanup');
    }
  });
});
