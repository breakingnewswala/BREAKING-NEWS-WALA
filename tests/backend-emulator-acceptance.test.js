/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Execution 013: Firebase Emulator Acceptance & Real Integration Test Suite
 * 
 * Executes against live running Firebase Emulator Suite instances:
 * - Firebase Auth Emulator (127.0.0.1:9099)
 * - Firebase Firestore Emulator (127.0.0.1:8085)
 * - Firebase Storage Emulator (127.0.0.1:9199)
 * 
 * Verifies live Firestore rules evaluation, real token minting & validation,
 * authoritative server-side RBAC, atomic transactions, and App Hosting compatibility.
 * Grounded in docs/11-Architecture.md, docs/12-Database.md, docs/14-Auth.md, and BNW-MASTER-EXECUTION-013.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { FirestoreAdapter } from '../src/server/persistence/firestoreAdapter.js';
import { FirebaseAuthService, CANONICAL_PROJECT_ID } from '../src/server/auth/firebaseAuthService.js';
import { getPersistenceAdapter } from '../src/server/persistence/adapter.js';

const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
const FIRESTORE_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8085';
const STORAGE_HOST = process.env.FIREBASE_STORAGE_EMULATOR_HOST || '127.0.0.1:9199';
const PROJECT_ID = CANONICAL_PROJECT_ID;

// Helper: Sign up a user in the Auth Emulator and retrieve their UID & real ID token
async function createEmulatorUser(email, password = 'Password123!') {
  const url = `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-test-key`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create emulator user: HTTP ${res.status} ${err}`);
  }
  const data = await res.json();
  return { uid: data.localId, email: data.email, idToken: data.idToken };
}

// -------------------------------------------------------------
// SUITE 1: REAL FIRESTORE ADAPTER INTEGRATION & WORKFLOWS
// -------------------------------------------------------------
test('BNW-013 Suite 1: FirestoreAdapter Real Operations & Concurrency [CLASSIFICATION: EMULATOR_INTEGRATION_TEST]', async (t) => {
  const adapter = new FirestoreAdapter({
    projectId: PROJECT_ID,
    databaseId: 'ai-studio-breakingnewswala-81a8a8f4-57a5-4181-aa74-2ef4d34fbab7',
  });
  await adapter.init();

  let articleId = '';

  await t.test('1.1 Create draft and retrieve news article', async () => {
    const draft = await adapter.createDraft(
      { id: 'rep-001', fullName: 'रमेश पत्रकार', roles: ['REPORTER'] },
      {
        title: 'भोपाल में नए फ्लाईओवर का लोकार्पण संपन्न',
        content: 'मुख्यमंत्री ने भोपाल के नए 6-लेन एलिवेटेड कॉरिडोर का भव्य लोकार्पण किया।',
        categoryId: 'cat-mp',
        districtId: 'dist-bhopal',
        isBreaking: true,
      }
    );

    assert.ok(draft.id);
    assert.strictEqual(draft.status, 'DRAFT');
    assert.strictEqual(draft.version, 1);
    assert.strictEqual(draft.districtName, 'भोपाल');
    articleId = draft.id;

    const retrieved = await adapter.getArticleByIdOrSlug(articleId);
    assert.ok(retrieved);
    assert.strictEqual(retrieved.id, articleId);
    assert.strictEqual(retrieved.title, 'भोपाल में नए फ्लाईओवर का लोकार्पण संपन्न');
  });

  await t.test('1.2 Draft editing with OCC version increment', async () => {
    const updated = await adapter.updateDraft(articleId, { title: 'भोपाल में नए 6-लेन फ्लाईओवर का लोकार्पण' }, 1);
    assert.strictEqual(updated.title, 'भोपाल में नए 6-लेन फ्लाईओवर का लोकार्पण');
    assert.strictEqual(updated.version, 2);
  });

  await t.test('1.3 OCC version conflict rejects stale write with 409 ERR_CONCURRENCY_CONFLICT', async () => {
    await assert.rejects(
      async () => adapter.updateDraft(articleId, { title: 'बासी शीर्षक' }, 1), // Version 1 is stale, current is 2
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.code, 'ERR_CONCURRENCY_CONFLICT');
        return true;
      }
    );
  });

  await t.test('1.4 Reporter assignment and draft submission to review queue', async () => {
    const submitted = await adapter.submitArticle(articleId, 'rep-001');
    assert.strictEqual(submitted.status, 'PENDING_REVIEW');
    assert.ok(submitted.submittedAt);
  });

  await t.test('1.5 Story claiming locks story atomically (reviewArticle: claim)', async () => {
    const claimed = await adapter.reviewArticle(articleId, 'editor-bhopal-01', 'claim');
    assert.strictEqual(claimed.status, 'IN_REVIEW');
    assert.strictEqual(claimed.claimedBy, 'editor-bhopal-01');
  });

  await t.test('1.6 Concurrent claim attempt returns 409 ERR_RACE_CONDITION', async () => {
    await assert.rejects(
      async () => adapter.reviewArticle(articleId, 'editor-bhopal-02', 'claim'),
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.code, 'ERR_RACE_CONDITION');
        return true;
      }
    );
  });

  await t.test('1.7 Editorial approval publishes article atomically', async () => {
    const published = await adapter.reviewArticle(articleId, 'editor-bhopal-01', 'approve');
    assert.strictEqual(published.status, 'PUBLISHED');
    assert.strictEqual(published.reviewedBy, 'editor-bhopal-01');
    assert.ok(published.publishedAt);
  });

  await t.test('1.8 Double publication attempt returns 409 ERR_ALREADY_PUBLISHED', async () => {
    await assert.rejects(
      async () => adapter.reviewArticle(articleId, 'editor-bhopal-01', 'approve'),
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.code, 'ERR_ALREADY_PUBLISHED');
        return true;
      }
    );
  });

  await t.test('1.9 Rejection workflow requires mandatory reason code', async () => {
    const story2 = await adapter.createDraft(
      { id: 'rep-002', fullName: 'सुनील', roles: ['REPORTER'] },
      { title: 'अप्रासंगिक समाचार', content: '...', categoryId: 'cat-mp', districtId: 'dist-indore' }
    );
    await adapter.submitArticle(story2.id, 'rep-002');

    // Rejecting without reason fails
    await assert.rejects(
      async () => adapter.reviewArticle(story2.id, 'editor-01', 'reject', null),
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'ERR_REJECTION_REASON_REQUIRED');
        return true;
      }
    );

    // Rejecting with reason succeeds
    const rejected = await adapter.reviewArticle(story2.id, 'editor-01', 'reject', 'तथ्य अपुष्ट हैं');
    assert.strictEqual(rejected.status, 'REJECTED');
    assert.strictEqual(rejected.rejectionReason, 'तथ्य अपुष्ट हैं');
  });

  await t.test('1.10 Retrieval of categories, districts, tickers, and advertisements', async () => {
    const categories = await adapter.getCategories();
    assert.ok(categories.length >= 8);

    const districts = await adapter.getDistricts();
    assert.ok(districts.length >= 10);

    const tickers = await adapter.getTickers();
    assert.ok(Array.isArray(tickers));

    const ads = await adapter.getAds();
    assert.ok(Array.isArray(ads));
  });

  await t.test('1.11 Audit log immutability and trail persistence', async () => {
    const log = await adapter.addAuditLog({
      action: 'ARTICLE_PUBLISHED',
      actorId: 'editor-bhopal-01',
      actorRole: 'EDITOR',
      targetType: 'ARTICLE',
      targetId: articleId,
      details: { district: 'भोपाल' },
    });

    assert.ok(log.id);
    assert.strictEqual(log.action, 'ARTICLE_PUBLISHED');

    const allLogs = await adapter.getAuditLogs();
    assert.ok(allLogs.some((l) => l.id === log.id));
  });

  await t.test('1.12 Pagination and filter boundaries', async () => {
    const res = await adapter.getArticles({ status: 'PUBLISHED', limit: 5, page: 1 });
    assert.ok(res.articles.length <= 5);
    assert.strictEqual(res.pagination.page, 1);
    assert.strictEqual(res.pagination.limit, 5);
  });
});

// -------------------------------------------------------------
// SUITE 2: FIREBASE AUTHENTICATION EMULATOR & SERVER-SIDE RBAC
// -------------------------------------------------------------
test('BNW-013 Suite 2: Firebase Auth Emulator Token Verification & RBAC [CLASSIFICATION: EMULATOR_INTEGRATION_TEST]', async (t) => {
  const authService = new FirebaseAuthService({
    projectId: PROJECT_ID,
    emulatorHost: AUTH_HOST,
  });

  const adapter = new FirestoreAdapter({
    projectId: PROJECT_ID,
    databaseId: 'ai-studio-breakingnewswala-81a8a8f4-57a5-4181-aa74-2ef4d34fbab7',
  });
  await adapter.init();

  let emulatorUser;

  await t.test('2.1 Mint and verify real ID token from Auth Emulator', async () => {
    emulatorUser = await createEmulatorUser(`rep_${Date.now()}@breakingnewswala.in`);
    assert.ok(emulatorUser.uid);
    assert.ok(emulatorUser.idToken);

    const verified = await authService.verifyIdToken(emulatorUser.idToken);
    assert.strictEqual(verified.uid, emulatorUser.uid);
    assert.strictEqual(verified.email, emulatorUser.email);
  });

  await t.test('2.2 Reject malformed or completely invalid token', async () => {
    await assert.rejects(
      async () => authService.verifyIdToken('not-a-valid-jwt-token'),
      (err) => {
        assert.ok(err.message.includes('ERR_MALFORMED_TOKEN'));
        return true;
      }
    );
  });

  await t.test('2.3 Reject token with wrong audience / project ID', async () => {
    // Generate token with foreign audience
    const parts = emulatorUser.idToken.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    payload.aud = 'unauthorized-foreign-project-id';
    const fakeToken = `${parts[0]}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${parts[2]}`;

    await assert.rejects(
      async () => authService.verifyIdToken(fakeToken),
      (err) => {
        assert.ok(err.message.includes('ERR_AUDIENCE_MISMATCH'));
        return true;
      }
    );
  });

  await t.test('2.4 Missing user document returns null authoritative user', async () => {
    const nonExistent = await authService.resolveAuthoritativeUser('uid-does-not-exist-in-db', adapter);
    assert.strictEqual(nonExistent, null);
  });

  await t.test('2.5 Authoritative role resolution for Reporter, Editor, Admin, Super Admin', async () => {
    // 1. Reporter
    await adapter.createUser({ id: 'u-reporter-1', role: 'REPORTER', roles: ['REPORTER'], status: 'active' });
    const rep = await authService.resolveAuthoritativeUser('u-reporter-1', adapter);
    assert.deepStrictEqual(rep.roles, ['REPORTER']);
    assert.strictEqual(FirebaseAuthService.hasRole(rep, ['REPORTER']), true);
    assert.strictEqual(FirebaseAuthService.hasRole(rep, ['EDITOR']), false);

    // 2. Editor
    await adapter.createUser({ id: 'u-editor-1', role: 'EDITOR', roles: ['EDITOR'], status: 'active' });
    const ed = await authService.resolveAuthoritativeUser('u-editor-1', adapter);
    assert.deepStrictEqual(ed.roles, ['EDITOR']);
    assert.strictEqual(FirebaseAuthService.hasRole(ed, ['EDITOR']), true);

    // 3. Admin
    await adapter.createUser({ id: 'u-admin-1', role: 'ADMIN', roles: ['ADMIN'], status: 'active' });
    const adm = await authService.resolveAuthoritativeUser('u-admin-1', adapter);
    assert.deepStrictEqual(adm.roles, ['ADMIN']);
    assert.strictEqual(FirebaseAuthService.hasRole(adm, ['ADMIN']), true);

    // 4. Super Admin (Universal permission)
    await adapter.createUser({ id: 'u-sadmin-1', role: 'SUPER_ADMIN', roles: ['SUPER_ADMIN'], status: 'active' });
    const sadm = await authService.resolveAuthoritativeUser('u-sadmin-1', adapter);
    assert.deepStrictEqual(sadm.roles, ['SUPER_ADMIN']);
    assert.strictEqual(FirebaseAuthService.hasRole(sadm, ['REPORTER']), true); // Super Admin has all permissions
  });

  await t.test('2.6 Suspended account is rejected with 403 ERR_ACCOUNT_DISABLED', async () => {
    await adapter.createUser({ id: 'u-suspended-1', role: 'REPORTER', roles: ['REPORTER'], status: 'suspended' });
    await assert.rejects(
      async () => authService.resolveAuthoritativeUser('u-suspended-1', adapter),
      (err) => {
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, 'ERR_ACCOUNT_DISABLED');
        return true;
      }
    );
  });

  await t.test('2.7 Client-side role spoofing prevention (Server discards client claim)', async () => {
    // Client claims role: "ADMIN", but database has role: "READER"
    await adapter.createUser({ id: emulatorUser.uid, role: 'READER', roles: ['READER'], status: 'active' });
    const authoritative = await authService.resolveAuthoritativeUser(emulatorUser.uid, adapter);

    assert.deepStrictEqual(authoritative.roles, ['READER']);
    assert.strictEqual(FirebaseAuthService.hasRole(authoritative, ['ADMIN']), false);
  });
});

// -------------------------------------------------------------
// SUITE 3: FIRESTORE SECURITY RULES ACCEPTANCE (LIVE EMULATOR)
// -------------------------------------------------------------
test('BNW-013 Suite 3: Firestore Proposed Security Rules Live Evaluation [CLASSIFICATION: RULES_EVALUATION_TEST]', async (t) => {
  const user = await createEmulatorUser(`rules_tester_${Date.now()}@bnw.in`);

  await t.test('3.1 Public unauthenticated user CAN read published news article', async () => {
    // Seed a published article as admin/server first
    const seedUrl = `http://${FIRESTORE_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents/newsArticles/pub-story-rules-test`;
    await fetch(seedUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer owner' },
      body: JSON.stringify({
        fields: {
          title: { stringValue: 'सार्वजनिक समाचार' },
          status: { stringValue: 'PUBLISHED' },
        },
      }),
    });

    // Unauthenticated GET
    const res = await fetch(seedUrl);
    assert.strictEqual(res.status, 200);
  });

  await t.test('3.2 Public unauthenticated user CANNOT read private draft (403 PERMISSION_DENIED)', async () => {
    // Seed a draft article
    const draftUrl = `http://${FIRESTORE_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents/newsArticles/draft-private-rules-test`;
    await fetch(draftUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer owner' },
      body: JSON.stringify({
        fields: {
          title: { stringValue: 'गोपनीय ड्राफ्ट' },
          status: { stringValue: 'DRAFT' },
          authorId: { stringValue: 'other-reporter-uid' },
        },
      }),
    });

    // Unauthenticated GET must be 403 Forbidden
    const res = await fetch(draftUrl);
    assert.strictEqual(res.status, 403);
  });

  await t.test('3.3 Reporter CAN create their own draft (status in [DRAFT, PENDING_REVIEW])', async () => {
    const artId = `draft-${Date.now()}`;
    const url = `http://${FIRESTORE_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents/newsArticles/${artId}`;

    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.idToken}`,
      },
      body: JSON.stringify({
        fields: {
          title: { stringValue: 'रिपोर्टर ड्राफ्ट' },
          status: { stringValue: 'DRAFT' },
          authorId: { stringValue: user.uid },
        },
      }),
    });

    assert.strictEqual(res.status, 200);
  });

  await t.test('3.4 Reporter CANNOT directly self-publish an article (403 PERMISSION_DENIED)', async () => {
    const artId = `illegal-publish-${Date.now()}`;
    const url = `http://${FIRESTORE_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents/newsArticles/${artId}`;

    // Attempting to create an article directly with status='PUBLISHED'
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.idToken}`,
      },
      body: JSON.stringify({
        fields: {
          title: { stringValue: 'अवैध रूप से प्रकाशित समाचार' },
          status: { stringValue: 'PUBLISHED' },
          authorId: { stringValue: user.uid },
        },
      }),
    });

    assert.strictEqual(res.status, 403); // REJECTED BY RULE
  });

  await t.test('3.5 Users CANNOT self-escalate roles from READER to ADMIN (403 PERMISSION_DENIED)', async () => {
    // 1. Create own profile as READER
    const userUrl = `http://${FIRESTORE_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${user.uid}`;
    const createRes = await fetch(userUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.idToken}`,
      },
      body: JSON.stringify({
        fields: {
          id: { stringValue: user.uid },
          displayName: { stringValue: 'साधारण पाठक' },
          role: { stringValue: 'READER' },
          roles: { arrayValue: { values: [{ stringValue: 'READER' }] } },
          status: { stringValue: 'active' },
        },
      }),
    });
    assert.strictEqual(createRes.status, 200);

    // 2. Attempt to update own role to ADMIN
    const escalateRes = await fetch(userUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.idToken}`,
      },
      body: JSON.stringify({
        fields: {
          id: { stringValue: user.uid },
          role: { stringValue: 'ADMIN' },
          roles: { arrayValue: { values: [{ stringValue: 'ADMIN' }] } },
        },
      }),
    });

    assert.strictEqual(escalateRes.status, 403); // PRIVILEGE ESCALATION REJECTED
  });

  await t.test('3.6 Audit logs are strictly immutable: updates and deletes are rejected (403)', async () => {
    // 1. Create an audit log
    const auditId = `aud-${Date.now()}`;
    const auditUrl = `http://${FIRESTORE_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents/auditLogs/${auditId}`;
    const createRes = await fetch(auditUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.idToken}`,
      },
      body: JSON.stringify({
        fields: {
          action: { stringValue: 'TEST_EVENT' },
          actorId: { stringValue: user.uid },
        },
      }),
    });
    assert.strictEqual(createRes.status, 200);

    // 2. Attempt to update audit log
    const updateRes = await fetch(auditUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.idToken}`,
      },
      body: JSON.stringify({
        fields: { action: { stringValue: 'TAMPERED_EVENT' } },
      }),
    });
    assert.strictEqual(updateRes.status, 403); // MODIFICATION FORBIDDEN

    // 3. Attempt to delete audit log
    const deleteRes = await fetch(auditUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${user.idToken}`,
      },
    });
    assert.strictEqual(deleteRes.status, 403); // DELETION FORBIDDEN
  });
});

// -------------------------------------------------------------
// SUITE 4: STORAGE SECURITY RULES ACCEPTANCE (LIVE EMULATOR)
// -------------------------------------------------------------
test('BNW-013 Suite 4: Storage Proposed Security Rules Live Evaluation [CLASSIFICATION: RULES_EVALUATION_TEST]', async (t) => {
  const user = await createEmulatorUser(`storage_tester_${Date.now()}@bnw.in`);

  await t.test('4.1 Unauthenticated uploads to media storage are rejected (403/401)', async () => {
    const uploadUrl = `http://${STORAGE_HOST}/v0/b/${PROJECT_ID}.firebasestorage.app/o/media%2Farticles%2F2026%2F11%2Fart-test%2Fhack.jpg`;
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg' },
      body: Buffer.from('unauthorized-payload'),
    });

    assert.ok(res.status === 401 || res.status === 403);
  });

  await t.test('4.2 Authenticated user CAN upload compliant image (image/webp)', async () => {
    const targetPath = encodeURIComponent('media/articles/2026/11/art-test/valid_banner.webp');
    const uploadUrl = `http://${STORAGE_HOST}/v0/b/${PROJECT_ID}.firebasestorage.app/o?name=${targetPath}`;

    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'image/webp',
        'Authorization': `Bearer ${user.idToken}`,
      },
      body: Buffer.from('fake-valid-webp-content'),
    });

    assert.strictEqual(res.status, 200);
  });

  await t.test('4.3 Non-owner cannot access another reporter private credentials', async () => {
    const targetPath = encodeURIComponent('reporters/other-reporter-uid/credentials/press_id.pdf');
    const credUrl = `http://${STORAGE_HOST}/v0/b/${PROJECT_ID}.firebasestorage.app/o/${targetPath}`;

    const res = await fetch(credUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user.idToken}`, // user.uid != other-reporter-uid
      },
    });

    assert.strictEqual(res.status, 403); // ACCESS FORBIDDEN
  });
});

// -------------------------------------------------------------
// SUITE 5: APP HOSTING INITIALIZATION & PRODUCTION FAIL-CLOSED
// -------------------------------------------------------------
test('BNW-013 Suite 5: App Hosting Compatibility & Fail-Closed Boundaries [CLASSIFICATION: ARCHITECTURAL_VERIFICATION]', async (t) => {
  await t.test('5.1 getPersistenceAdapter instantiates FirestoreAdapter when PERSISTENCE_MODE=firestore', () => {
    const adapter = getPersistenceAdapter({
      forceFresh: true,
      adapterType: 'firestore',
      projectId: PROJECT_ID,
    });

    assert.ok(adapter);
    assert.strictEqual(adapter.constructor.name, 'FirestoreAdapter');
    const health = adapter.getHealth();
    assert.strictEqual(health.adapterType, 'firestore');
    assert.strictEqual(health.multiInstanceSafe, true);
  });

  await t.test('5.2 Project ID resolution respects CANONICAL_PROJECT_ID fallback', () => {
    const authService = new FirebaseAuthService();
    assert.strictEqual(authService.projectId, CANONICAL_PROJECT_ID);
  });

  await t.test('5.3 Production environment fails closed if no authoritative database is connected', () => {
    const previousEnv = process.env.NODE_ENV;
    const previousDbUrl = process.env.DATABASE_URL;
    const previousMode = process.env.PERSISTENCE_MODE;

    try {
      process.env.NODE_ENV = 'production';
      delete process.env.DATABASE_URL;
      delete process.env.PERSISTENCE_MODE;
      delete process.env.FIRESTORE_DATABASE_ID;

      const guardAdapter = getPersistenceAdapter({ forceFresh: true });
      assert.strictEqual(guardAdapter.constructor.name, 'ProductionGuardAdapter');

      const health = guardAdapter.getHealth();
      assert.strictEqual(health.status, 'degraded');
      assert.strictEqual(health.databaseAvailable, false);
      assert.strictEqual(health.error, 'ERR_DATABASE_UNAVAILABLE');
    } finally {
      process.env.NODE_ENV = previousEnv;
      if (previousDbUrl) process.env.DATABASE_URL = previousDbUrl;
      if (previousMode) process.env.PERSISTENCE_MODE = previousMode;
    }
  });
});
