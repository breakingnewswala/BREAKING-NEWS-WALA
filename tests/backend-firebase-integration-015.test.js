/**
 * BNW MASTER EXECUTION 015 — Firebase Backend Integration & Production Readiness Test Suite
 * 
 * Verifies:
 * 1. FirestoreAdapter complete domain coverage & flexible signature contracts.
 * 2. Server-side authoritative RBAC, token verification, and zero role-spoofing.
 * 3. App Hosting unified single-deployment serving (API + static SPA).
 * 4. Configuration readiness: firebase.json database targets, apphosting.yaml runtime env, and storage rules.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.NODE_ENV = 'test';

import { FirestoreAdapter } from '../src/server/persistence/firestoreAdapter.js';
import { FirebaseAuthService } from '../src/server/auth/firebaseAuthService.js';
import { SessionService } from '../src/server/auth/sessionService.js';
import { resolveRequestUser, extractAuthUser } from '../src/server/apiEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

test('BNW-015 Suite 1: FirestoreAdapter Complete Domain Operations [CLASSIFICATION: MOCKED_FIRESTORE_TEST]', async (t) => {
  const adapter = new FirestoreAdapter({
    projectId: 'breaking-news-wala',
    databaseId: 'ai-studio-breakingnewswala-81a8a8f4-57a5-4181-aa74-2ef4d34fbab7',
  });
  await adapter.init();

  let articleId = '';

  await t.test('1.1 createDraft supports (payload, user) signature from apiEngine', async () => {
    const payload = {
      title: 'ग्वालियर में स्मार्ट सिटी परियोजना का विस्तार',
      content: 'ग्वालियर में नए डिजिटल कंट्रोल सेंटर की स्थापना की गई।',
      categoryId: 'cat-mp',
      districtId: 'dist-gwalior',
      isBreaking: true,
    };
    const user = { id: 'rep-gwalior-01', fullName: 'सुनील शर्मा', roles: ['REPORTER'] };

    const draft = await adapter.createDraft(payload, user);
    assert.ok(draft.id);
    assert.strictEqual(draft.title, payload.title);
    assert.strictEqual(draft.authorId, 'rep-gwalior-01');
    assert.strictEqual(draft.authorName, 'सुनील शर्मा');
    assert.strictEqual(draft.status, 'DRAFT');
    assert.strictEqual(draft.version, 1);
    articleId = draft.id;
  });

  await t.test('1.2 updateDraft supports payload.headline & version conflict guards', async () => {
    const updated = await adapter.updateDraft(articleId, {
      headline: 'ग्वालियर स्मार्ट सिटी: नए डिजिटल कंट्रोल सेंटर का लोकार्पण',
      version: 1,
    });
    assert.strictEqual(updated.title, 'ग्वालियर स्मार्ट सिटी: नए डिजिटल कंट्रोल सेंटर का लोकार्पण');
    assert.strictEqual(updated.version, 2);

    // Stale write rejection
    await assert.rejects(
      async () => adapter.updateDraft(articleId, { title: 'स्टेल अपडेट' }, 1),
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.code, 'ERR_CONCURRENCY_CONFLICT');
        return true;
      }
    );
  });

  await t.test('1.3 reviewArticle supports (id, action, params, user) signature from apiEngine', async () => {
    // 1. Submit (increments version from 2 to 3)
    await adapter.submitArticle(articleId, 'rep-gwalior-01');

    // 2. Claim via apiEngine signature (version becomes 4)
    const editor = { id: 'ed-007', fullName: 'विक्रम संपादक', roles: ['EDITOR'] };
    const claimed = await adapter.reviewArticle(articleId, 'claim', { version: 3 }, editor);
    assert.strictEqual(claimed.status, 'IN_REVIEW');
    assert.strictEqual(claimed.claimedBy, 'ed-007');
    assert.strictEqual(claimed.version, 4);

    // 3. Approve via apiEngine signature with headline edit (version becomes 5)
    const approved = await adapter.reviewArticle(
      articleId,
      'approve',
      { headline: 'ग्वालियर: नए डिजिटल कंट्रोल सेंटर का भव्य लोकार्पण', version: 4 },
      editor
    );
    assert.strictEqual(approved.status, 'PUBLISHED');
    assert.strictEqual(approved.title, 'ग्वालियर: नए डिजिटल कंट्रोल सेंटर का भव्य लोकार्पण');
    assert.ok(approved.publishedAt);
    assert.strictEqual(approved.version, 5);

    // 4. Double publish prevention
    await assert.rejects(
      async () => adapter.reviewArticle(articleId, 'approve', { version: 5 }, editor),
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.code, 'ERR_ALREADY_PUBLISHED');
        return true;
      }
    );
  });

  await t.test('1.4 Editorial reviews collection records review trail', async () => {
    const reviews = await adapter.getEditorialReviews(articleId);
    assert.ok(reviews.length >= 2);
    assert.ok(reviews.some((r) => r.action === 'claim'));
    assert.ok(reviews.some((r) => r.action === 'approve'));
  });

  await t.test('1.5 Reporter role updates sync reporter profiles and users', async () => {
    const updatedRep = await adapter.updateReporterRole('rep-001', 'trusted_reporter');
    assert.strictEqual(updatedRep.role, 'trusted_reporter');
  });

  await t.test('1.6 Ticker management (create, toggle, delete)', async () => {
    const created = await adapter.createTicker({
      textHindi: 'उज्जैन महाकाल मंदिर में विशेष भस्म आरती का आयोजन',
      districtName: 'उज्जैन',
      priority: 'urgent',
    });
    assert.ok(created.id);
    assert.strictEqual(created.isActive, true);

    const toggled = await adapter.toggleTicker(created.id);
    assert.strictEqual(toggled.isActive, false);

    const deleted = await adapter.deleteTicker(created.id);
    assert.strictEqual(deleted, true);
  });

  await t.test('1.7 Advertisement management (create, toggle, delete)', async () => {
    const created = await adapter.createAd({
      title: 'मध्य प्रदेश पर्यटन विकास निगम',
      targetUrl: 'https://mptourism.com',
    });
    assert.ok(created.id);
    assert.strictEqual(created.isActive, true);

    const toggled = await adapter.toggleAd(created.id);
    assert.strictEqual(toggled.isActive, false);

    const deleted = await adapter.deleteAd(created.id);
    assert.strictEqual(deleted, true);
  });

  await t.test('1.8 Assignments management (create, retrieve, update)', async () => {
    const asgn = await adapter.createAssignment({
      title: 'विधानसभा सत्र की ग्राउंड रिपोर्टिंग',
      districtId: 'dist-bhopal',
      assignedTo: 'rep-001',
      assignedBy: 'ed-007',
    });
    assert.ok(asgn.id);
    assert.strictEqual(asgn.status, 'ASSIGNED');

    const list = await adapter.getAssignments('rep-001');
    assert.ok(list.some((a) => a.id === asgn.id));

    const updated = await adapter.updateAssignment(asgn.id, { status: 'IN_PROGRESS' });
    assert.strictEqual(updated.status, 'IN_PROGRESS');
  });

  await t.test('1.9 Notifications management (create, retrieve, markRead)', async () => {
    const notif = await adapter.createNotification({
      recipientId: 'rep-001',
      title: 'नई असाइनमेंट प्राप्त हुई',
      body: 'कृपया भोपाल विधानसभा सत्र कवर करें।',
    });
    assert.ok(notif.id);
    assert.strictEqual(notif.isRead, false);

    const unread = await adapter.getNotifications('rep-001');
    assert.ok(unread.some((n) => n.id === notif.id));

    const marked = await adapter.markNotificationRead(notif.id);
    assert.strictEqual(marked.isRead, true);
  });
});

test('BNW-015 Suite 2: Server-Side RBAC, Token Verification & Spoofing Defense [CLASSIFICATION: UNIT_TEST]', async (t) => {
  const adapter = new FirestoreAdapter({
    projectId: 'breaking-news-wala',
    databaseId: 'ai-studio-breakingnewswala-81a8a8f4-57a5-4181-aa74-2ef4d34fbab7',
  });
  await adapter.init();

  await t.test('2.1 extractAuthUser never grants REPORTER role to unprivileged tokens', () => {
    // Untrusted token with no role
    const fakeTokenPayload = {
      sub: 'untrusted-reader-99',
      email: 'reader99@gmail.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(fakeTokenPayload)).toString('base64url');
    const token = `${header}.${body}.`;

    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    const user = extractAuthUser(req);
    assert.ok(user);
    assert.strictEqual(user.id, 'untrusted-reader-99');
    // Must default to READER, NEVER REPORTER
    assert.deepStrictEqual(user.roles, ['READER']);
  });

  await t.test('2.2 resolveRequestUser resolves authoritative database role over client claim', async () => {
    // Seed user in database with role: READER
    await adapter.createUser({
      id: 'usr-spoof-target',
      email: 'spoof@bnw.in',
      fullName: 'धोखेबाज़ यूज़र',
      role: 'READER',
      roles: ['READER'],
      status: 'active',
    });

    // Token forged with client claim: ADMIN
    const now = Math.floor(Date.now() / 1000);
    const fakeAdminTokenPayload = {
      sub: 'usr-spoof-target',
      email: 'spoof@bnw.in',
      roles: ['ADMIN'], // CLIENT SPOOFED
      role: 'ADMIN',    // CLIENT SPOOFED
      iat: now,
      exp: now + 3600,
      aud: 'breaking-news-wala',
      iss: 'https://securetoken.google.com/breaking-news-wala',
    };
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(fakeAdminTokenPayload)).toString('base64url');
    const token = `${header}.${body}.`;

    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    const resolved = await resolveRequestUser(req, adapter);
    assert.ok(resolved);
    assert.strictEqual(resolved.id, 'usr-spoof-target');
    // Authoritative database role must triumph!
    assert.deepStrictEqual(resolved.roles, ['READER']);
    assert.strictEqual(FirebaseAuthService.hasRole(resolved, ['ADMIN']), false);
  });

  await t.test('2.3 resolveRequestUser blocks suspended accounts', async () => {
    await adapter.createUser({
      id: 'usr-suspended-target',
      email: 'suspended@bnw.in',
      role: 'REPORTER',
      roles: ['REPORTER'],
      status: 'SUSPENDED',
    });

    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = {
      sub: 'usr-suspended-target',
      email: 'suspended@bnw.in',
      iat: now,
      exp: now + 3600,
      aud: 'breaking-news-wala',
      iss: 'https://securetoken.google.com/breaking-news-wala',
    };
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
    const token = `${header}.${body}.`;

    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    const resolved = await resolveRequestUser(req, adapter);
    // Suspended account throws in resolveAuthoritativeUser and returns null
    assert.strictEqual(resolved, null);
  });
});

test('BNW-015 Suite 3: App Hosting Configuration & File Invariant Audit [CLASSIFICATION: ARCHITECTURAL_VERIFICATION]', async (t) => {
  await t.test('3.1 firebase.json targets proposed canonical database as primary and keeps Android untouched', () => {
    const raw = fs.readFileSync(path.join(ROOT_DIR, 'firebase.json'), 'utf8');
    const parsed = JSON.parse(raw);
    const firestoreTargets = Array.isArray(parsed.firestore) ? parsed.firestore : [parsed.firestore];

    // Primary: Web canonical database
    assert.strictEqual(
      firestoreTargets[0].database,
      'ai-studio-breakingnewswala-81a8a8f4-57a5-4181-aa74-2ef4d34fbab7'
    );
    assert.strictEqual(firestoreTargets[0].rules, 'firestore.rules');

    // Android prototype database must NOT be targeted for Web rules deployment
    const hasAndroidTarget = firestoreTargets.some(
      (t) => t.database === 'ai-studio-android-breaking-b83ef913-4fbd-4bd1-8b00-92a4f70648d7'
    );
    assert.strictEqual(hasAndroidTarget, false, 'Android prototype database must not be targeted for Web rules deployment');

    // Storage rules configured
    assert.ok(parsed.storage);
    assert.strictEqual(parsed.storage.rules, 'storage.rules');

    // Emulators configured for Auth, Firestore, and Storage
    assert.strictEqual(parsed.emulators.firestore.port, 8085);
    assert.strictEqual(parsed.emulators.auth.port, 9099);
    assert.strictEqual(parsed.emulators.storage.port, 9199);
  });

  await t.test('3.2 apphosting.yaml declares production runtime environment', () => {
    const raw = fs.readFileSync(path.join(ROOT_DIR, 'apphosting.yaml'), 'utf8');
    assert.ok(raw.includes('PERSISTENCE_MODE'));
    assert.ok(raw.includes('firestore'));
    assert.ok(raw.includes('FIRESTORE_DATABASE_ID'));
    assert.ok(raw.includes('ai-studio-breakingnewswala-81a8a8f4-57a5-4181-aa74-2ef4d34fbab7'));
    assert.ok(raw.includes('FIREBASE_PROJECT_ID'));
    assert.ok(raw.includes('breaking-news-wala'));
    assert.ok(raw.includes('minInstances: 1'));
  });

  await t.test('3.3 storage.rules exists and defines authenticated write & 10MB limit', () => {
    assert.ok(fs.existsSync(path.join(ROOT_DIR, 'storage.rules')));
    const raw = fs.readFileSync(path.join(ROOT_DIR, 'storage.rules'), 'utf8');
    assert.ok(raw.includes('10 * 1024 * 1024'));
    assert.ok(raw.includes('image/(jpeg|png|webp)'));
    assert.ok(raw.includes('match /media/articles/'));
  });

  await t.test('3.4 server.js handles /healthz, /api/v1/* and static dist assets', () => {
    const raw = fs.readFileSync(path.join(ROOT_DIR, 'server.js'), 'utf8');
    assert.ok(raw.includes('handleHealthCheck'));
    assert.ok(raw.includes('handleApiRequest'));
    assert.ok(raw.includes('pathname === \'/healthz\''));
    assert.ok(raw.includes('pathname.startsWith(\'/api/v1/\')'));
    assert.ok(raw.includes('INDEX_HTML'));
  });
});
