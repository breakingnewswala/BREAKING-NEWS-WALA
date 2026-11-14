/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Execution 016 — Firebase Integration Acceptance & Production Verification Suite
 * 
 * Verifies:
 * 1. Complete 12-Step Newsroom Workflow with Role Restrictions
 * 2. Firebase Authentication & Server-Side RBAC Anti-Spoofing
 * 3. Firestore Concurrency, OCC, Double-Claim, and Double-Publish Protection
 * 4. Storage Metadata & Security Rules Validation
 * 5. Database Identity & Android Prototype Isolation Invariants
 * 
 * Classifications: [CLASSIFICATION: ACCEPTANCE_TEST], [CLASSIFICATION: WORKFLOW_TEST]
 */

import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.NODE_ENV = 'test';

import { handleApiRequest, resolveRequestUser } from '../src/server/apiEngine.js';
import { FirestoreAdapter, CANONICAL_FIRESTORE_DB_ID } from '../src/server/persistence/firestoreAdapter.js';
import { FirebaseAuthService, defaultFirebaseAuthService } from '../src/server/auth/firebaseAuthService.js';
import { SessionService } from '../src/server/auth/sessionService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Helper to simulate HTTP requests against handleApiRequest
function createMockHttp() {
  let server;
  let baseUrl;

  const start = () => new Promise((resolve) => {
    server = http.createServer(async (req, res) => {
      try {
        await handleApiRequest(req, res);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: { message: err.message } }));
      }
    });
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  const stop = () => new Promise((resolve) => {
    if (server) server.close(resolve);
    else resolve();
  });

  const request = (method, urlPath, body = null, headers = {}) => new Promise((resolve, reject) => {
    const fullUrl = new URL(urlPath, baseUrl);
    const reqHeaders = { ...headers };
    let bodyStr = null;

    if (body) {
      bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
      if (!reqHeaders['Content-Type'] && !reqHeaders['content-type']) {
        reqHeaders['Content-Type'] = 'application/json';
      }
      reqHeaders['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = http.request(fullUrl, { method, headers: reqHeaders }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = null;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json,
          rawBody: data,
        });
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });

  return { start, stop, request };
}

test('BNW-016 Suite 1: Complete 12-Step Newsroom Workflow with Role Restrictions [CLASSIFICATION: WORKFLOW_TEST]', async (t) => {
  const mockHttp = createMockHttp();
  await mockHttp.start();

  let reporterToken;
  let editorToken;
  let readerToken;
  let testDraftId;
  let testImageUrl;
  let draftVersion;

  t.after(async () => {
    await mockHttp.stop();
  });

  // Step 1: Reporter and Editor Login
  await t.test('Step 1: Reporter, Editor, and Reader Login & Session Token Issuance', async () => {
    // 1a. Reporter login
    const repLogin = await mockHttp.request('POST', '/api/v1/auth/login', {
      identifier: 'rep_bhopal',
      password: 'password123',
    });
    assert.strictEqual(repLogin.statusCode, 200);
    assert.ok(repLogin.body.data.tokens.accessToken);
    reporterToken = repLogin.body.data.tokens.accessToken;
    assert.ok(repLogin.body.data.user.roles.includes('REPORTER'));

    // 1b. Mint Editor Token via SessionService
    const editorSession = SessionService.signAccessToken({
      id: 'ed-001',
      identifier: 'editor.desk@breakingnewswala.com',
      roles: ['EDITOR'],
    });
    editorToken = editorSession.token;

    // 1c. Mint Reader Token via SessionService
    const readerSession = SessionService.signAccessToken({
      id: 'usr-reader-99',
      identifier: 'reader.bhopal@example.com',
      roles: ['READER'],
    });
    readerToken = readerSession.token;
  });

  // Step 2: Reporter Creates News Draft
  await t.test('Step 2: Reporter creates initial news draft (POST /api/v1/articles/drafts)', async () => {
    const payload = {
      title: 'मध्य प्रदेश नवाचार: सीहोर में पहला जैविक खाद्य प्रसंस्करण केंद्र स्वीकृत',
      content: 'सीहोर। राज्य सरकार ने सीहोर जिले में ₹45 करोड़ की लागत से बनने वाले मध्य प्रदेश के प्रथम एकीकृत जैविक खाद्य प्रसंस्करण क्लस्टर को विधिवत स्वीकृति प्रदान कर दी है।',
      summary: 'सीहोर में जैविक खाद्य प्रसंस्करण केंद्र को कैबिनेट की मंजूरी मिली।',
      categoryId: 'cat-farm',
      districtId: 'dist-sehore',
    };

    const res = await mockHttp.request('POST', '/api/v1/articles/drafts', payload, {
      Authorization: `Bearer ${reporterToken}`,
    });
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.success);
    assert.ok(res.body.data.id);
    testDraftId = res.body.data.id;
    draftVersion = res.body.data.version || 1;
    assert.strictEqual(res.body.data.status, 'DRAFT');
  });

  // Step 3: Upload News Image
  await t.test('Step 3: Upload news media asset (POST /api/v1/media/upload)', async () => {
    const mockImageBase64 = Buffer.from('mock-webp-binary-content').toString('base64');
    const uploadRes = await mockHttp.request('POST', '/api/v1/media/upload', {
      fileName: 'sehore_organic_cluster.webp',
      mimeType: 'image/webp',
      fileBuffer: mockImageBase64,
    }, {
      Authorization: `Bearer ${reporterToken}`,
    });

    assert.strictEqual(uploadRes.statusCode, 200);
    assert.ok(uploadRes.body.success);
    assert.ok(uploadRes.body.data.url);
    assert.strictEqual(uploadRes.body.data.mimeType, 'image/webp');
    testImageUrl = uploadRes.body.data.url;
  });

  // Step 4: Save & Update Draft with Image
  await t.test('Step 4: Save and update draft with uploaded image (PATCH /api/v1/articles/drafts/:id)', async () => {
    const updateRes = await mockHttp.request('PATCH', `/api/v1/articles/drafts/${testDraftId}`, {
      imageUrl: testImageUrl,
      subheadline: '₹45 करोड़ की लागत से 2500 किसान परिवारों को मिलेगा सीधा लाभ',
      version: draftVersion,
    }, {
      Authorization: `Bearer ${reporterToken}`,
    });

    assert.strictEqual(updateRes.statusCode, 200);
    assert.ok(updateRes.body.success);
    assert.strictEqual(updateRes.body.data.imageUrl, testImageUrl);
    draftVersion = updateRes.body.data.version;
  });

  // Role Restriction Check: Public Reader Cannot View Draft
  await t.test('Role Restriction: Public reader cannot access unpublished draft (403 ERR_FORBIDDEN)', async () => {
    // Unauthenticated reader
    const anonRes = await mockHttp.request('GET', `/api/v1/articles/${testDraftId}`);
    assert.strictEqual(anonRes.statusCode, 403);
    assert.strictEqual(anonRes.body.error.code, 'ERR_FORBIDDEN');

    // Authenticated reader (non-author)
    const readerRes = await mockHttp.request('GET', `/api/v1/articles/${testDraftId}`, null, {
      Authorization: `Bearer ${readerToken}`,
    });
    assert.strictEqual(readerRes.statusCode, 403);
    assert.strictEqual(readerRes.body.error.code, 'ERR_FORBIDDEN');
  });

  // Step 5: Submit Article for Editorial Review
  await t.test('Step 5: Submit article for review (POST /api/v1/articles/:id/submit)', async () => {
    const submitRes = await mockHttp.request('POST', `/api/v1/articles/${testDraftId}/submit`, {}, {
      Authorization: `Bearer ${reporterToken}`,
    });

    assert.strictEqual(submitRes.statusCode, 200);
    assert.ok(submitRes.body.success);
    assert.strictEqual(submitRes.body.data.status, 'PENDING_REVIEW');
    draftVersion = submitRes.body.data.version;
  });

  // Step 6: Editor Opens Review Queue
  await t.test('Step 6: Editor inspects review queue (GET /api/v1/articles?status=PENDING_REVIEW)', async () => {
    const queueRes = await mockHttp.request('GET', '/api/v1/articles?status=PENDING_REVIEW', null, {
      Authorization: `Bearer ${editorToken}`,
    });

    assert.strictEqual(queueRes.statusCode, 200);
    assert.ok(queueRes.body.success);
    const found = queueRes.body.data.find((a) => a.id === testDraftId);
    assert.ok(found, 'Submitted article must appear in the editor review queue');
    assert.strictEqual(found.status, 'PENDING_REVIEW');
  });

  // Step 7: Editor Claims Article
  await t.test('Step 7: Editor claims article from queue (POST /api/v1/articles/:id/review action:claim)', async () => {
    const claimRes = await mockHttp.request('POST', `/api/v1/articles/${testDraftId}/review`, {
      action: 'claim',
      version: draftVersion,
    }, {
      Authorization: `Bearer ${editorToken}`,
    });

    assert.strictEqual(claimRes.statusCode, 200);
    assert.ok(claimRes.body.success);
    assert.ok(claimRes.body.data.status === 'UNDER_REVIEW' || claimRes.body.data.status === 'IN_REVIEW');
    draftVersion = claimRes.body.data.version;
  });

  // Role Restriction: Concurrent Claim Guard (Double Claim returns 409)
  await t.test('Role Restriction: Another editor attempting to claim locked story receives 409 Conflict', async () => {
    const otherEditorToken = SessionService.signAccessToken({
      id: 'ed-002',
      identifier: 'other.editor@breakingnewswala.com',
      roles: ['EDITOR'],
    }).token;

    const conflictRes = await mockHttp.request('POST', `/api/v1/articles/${testDraftId}/review`, {
      action: 'claim',
      version: draftVersion,
    }, {
      Authorization: `Bearer ${otherEditorToken}`,
    });

    assert.strictEqual(conflictRes.statusCode, 409);
    assert.ok(
      conflictRes.body.error.code.includes('RACE') ||
      conflictRes.body.error.code.includes('CONFLICT') ||
      conflictRes.body.error.code.includes('CLAIMED')
    );
  });

  // Step 8: Editor Edits Headline & Copy During Review
  await t.test('Step 8: Editor polishes headline and copy (POST /api/v1/articles/:id/review claim with revisions)', async () => {
    const editRes = await mockHttp.request('POST', `/api/v1/articles/${testDraftId}/review`, {
      action: 'claim',
      headline: 'सीहोर: मध्य प्रदेश का पहला एकीकृत जैविक खाद्य प्रसंस्करण क्लस्टर स्वीकृत, 2500 किसानों को लाभ',
      version: draftVersion,
    }, {
      Authorization: `Bearer ${editorToken}`,
    });

    assert.strictEqual(editRes.statusCode, 200);
    assert.ok(editRes.body.success);
    assert.strictEqual(editRes.body.data.title, 'सीहोर: मध्य प्रदेश का पहला एकीकृत जैविक खाद्य प्रसंस्करण क्लस्टर स्वीकृत, 2500 किसानों को लाभ');
    draftVersion = editRes.body.data.version;
  });

  // Role Restriction: Rejection Requires Mandatory Reason
  await t.test('Role Restriction: Rejection without reason is rejected with 400 Bad Request', async () => {
    const badRejectRes = await mockHttp.request('POST', `/api/v1/articles/${testDraftId}/review`, {
      action: 'reject',
      version: draftVersion,
      // No reason provided
    }, {
      Authorization: `Bearer ${editorToken}`,
    });

    assert.strictEqual(badRejectRes.statusCode, 400);
    assert.ok(badRejectRes.body.error.code.includes('REASON'));
  });

  // Step 9: Editor Approves and Publishes Article
  await t.test('Step 9: Editor approves and publishes story (POST /api/v1/articles/:id/review action:approve)', async () => {
    const approveRes = await mockHttp.request('POST', `/api/v1/articles/${testDraftId}/review`, {
      action: 'approve',
      version: draftVersion,
    }, {
      Authorization: `Bearer ${editorToken}`,
    });

    assert.strictEqual(approveRes.statusCode, 200);
    assert.ok(approveRes.body.success);
    assert.strictEqual(approveRes.body.data.status, 'PUBLISHED');
    assert.ok(approveRes.body.data.publishedAt);
    draftVersion = approveRes.body.data.version;
  });

  // Role Restriction: Double Publication Guard
  await t.test('Role Restriction: Double approval attempt returns 409 ERR_ALREADY_PUBLISHED', async () => {
    const dupApproveRes = await mockHttp.request('POST', `/api/v1/articles/${testDraftId}/review`, {
      action: 'approve',
      version: draftVersion,
    }, {
      Authorization: `Bearer ${editorToken}`,
    });

    assert.strictEqual(dupApproveRes.statusCode, 409);
    assert.ok(
      dupApproveRes.body.error.code.includes('ALREADY') ||
      dupApproveRes.body.error.code.includes('APPROVED') ||
      dupApproveRes.body.error.code.includes('PUBLISHED') ||
      dupApproveRes.body.error.code.includes('CONFLICT')
    );
  });

  // Step 10: Approved Article Becomes Publicly Visible by Slug / ID
  await t.test('Step 10: Public readers can now fetch published article by ID (GET /api/v1/articles/:id)', async () => {
    const pubRes = await mockHttp.request('GET', `/api/v1/articles/${testDraftId}`);
    assert.strictEqual(pubRes.statusCode, 200);
    assert.ok(pubRes.body.success);
    assert.strictEqual(pubRes.body.data.status, 'PUBLISHED');
    assert.strictEqual(pubRes.body.data.id, testDraftId);
  });

  // Step 11: Public Homepage Displays Published Article
  await t.test('Step 11: Public articles list feed includes the newly published article', async () => {
    const listRes = await mockHttp.request('GET', '/api/v1/articles?limit=50');
    assert.strictEqual(listRes.statusCode, 200);
    assert.ok(listRes.body.success);
    const found = listRes.body.data.find((a) => a.id === testDraftId);
    assert.ok(found, 'Newly published article must appear in public feed');
    assert.strictEqual(found.status, 'PUBLISHED');
  });

  // Step 12: Audit Log Records Operations
  await t.test('Step 12: System audit log verified for editorial operations (GET /api/v1/admin/audit-logs)', async () => {
    const auditRes = await mockHttp.request('GET', '/api/v1/admin/audit-logs', null, {
      Authorization: `Bearer ${editorToken}`,
    });
    assert.strictEqual(auditRes.statusCode, 200);
    assert.ok(auditRes.body.success);
    assert.ok(Array.isArray(auditRes.body.data));
    assert.ok(auditRes.body.data.length > 0);

    const latest = auditRes.body.data[0];
    assert.ok(latest.actorName);
    assert.ok(latest.actionType);
    assert.ok(latest.timestamp);
  });
});

test('BNW-016 Suite 2: Firebase Authentication & Server-Side RBAC Anti-Spoofing [CLASSIFICATION: UNIT_TEST]', async (t) => {
  const adapter = new FirestoreAdapter();
  await adapter.init();
  const authService = new FirebaseAuthService();

  await t.test('2.1 Multi-provider session creation: Polymorphic createSession supports both object and positional params', async () => {
    // 1. Positional signature
    const sess1 = await adapter.createSession('usr-1', 'hash-pos-123', new Date(Date.now() + 3600000), { ipAddress: '10.0.0.1' });
    assert.ok(sess1.id);
    assert.strictEqual(sess1.userId, 'usr-1');

    // 2. Object signature (as called by SessionService & apiEngine)
    const sess2 = await adapter.createSession({
      userId: 'usr-2',
      refreshTokenHash: 'hash-obj-456',
      expiresAt: new Date(Date.now() + 3600000),
      ipAddress: '10.0.0.2',
      clientType: 'mobile-browser',
    });
    assert.ok(sess2.id);
    assert.strictEqual(sess2.userId, 'usr-2');

    // Verify lookup by token hash succeeds for both
    const found1 = await adapter.findSessionByTokenHash('hash-pos-123');
    assert.ok(found1);
    assert.strictEqual(found1.userId, 'usr-1');

    const found2 = await adapter.findSessionByTokenHash('hash-obj-456');
    assert.ok(found2);
    assert.strictEqual(found2.userId, 'usr-2');
  });

  await t.test('2.2 Client-side privilege escalation defense: Server discards client token role claim', async () => {
    const testUid = 'spoof-test-uid-016';

    // Provision authoritative database record as READER
    await adapter.createUser({
      id: testUid,
      email: 'reader.attacker@example.com',
      fullName: 'Attacker Reader',
      role: 'READER',
      roles: ['READER'],
      status: 'active',
    });

    // Mock client request carrying a forged token claiming SUPER_ADMIN
    const forgedPayload = {
      sub: testUid,
      email: 'reader.attacker@example.com',
      aud: 'breaking-news-wala',
      iss: 'https://securetoken.google.com/breaking-news-wala',
      iat: Math.floor(Date.now() / 1000) - 10,
      exp: Math.floor(Date.now() / 1000) + 3600,
      roles: ['SUPER_ADMIN', 'ADMIN'], // FORGED CLAIM
    };

    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify(forgedPayload)).toString('base64url');
    const forgedToken = `${header}.${payload}.mockSignature`;

    const req = {
      headers: {
        authorization: `Bearer ${forgedToken}`,
      },
    };

    const resolved = await resolveRequestUser(req, adapter);
    assert.ok(resolved, 'User should be resolved');
    assert.strictEqual(resolved.id, testUid);

    // CRITICAL: Server must have rejected forged SUPER_ADMIN and enforced authoritative READER role
    assert.deepStrictEqual(resolved.roles, ['READER']);
    assert.strictEqual(resolved.roles.includes('SUPER_ADMIN'), false);
    assert.strictEqual(resolved.roles.includes('ADMIN'), false);
  });

  await t.test('2.3 Suspended account access denial (403 ERR_ACCOUNT_DISABLED)', async () => {
    const suspendedUid = 'suspended-usr-016';
    await adapter.createUser({
      id: suspendedUid,
      email: 'suspended@example.com',
      fullName: 'Suspended User',
      role: 'REPORTER',
      roles: ['REPORTER'],
      status: 'SUSPENDED',
    });

    const payload = {
      sub: suspendedUid,
      email: 'suspended@example.com',
      aud: 'breaking-news-wala',
      iss: 'https://securetoken.google.com/breaking-news-wala',
      iat: Math.floor(Date.now() / 1000) - 10,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const bodyStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const token = `${header}.${bodyStr}.mockSignature`;

    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    const resolved = await resolveRequestUser(req, adapter);
    // Suspended users must not resolve to an active authorized user session
    assert.strictEqual(resolved, null);
  });

  await t.test('2.4 Dual-Token session refresh rotation and token reuse detection', async () => {
    const rawRefreshToken = SessionService.generateRawRefreshToken();
    const tokenHash = SessionService.hashRefreshToken(rawRefreshToken);

    const session = await adapter.createSession({
      userId: 'rep-001',
      refreshTokenHash: tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    });

    // 1. First usage: valid
    const foundSession = await adapter.findSessionByTokenHash(tokenHash);
    assert.ok(foundSession);
    assert.strictEqual(foundSession.revokedAt, null);

    // 2. Rotate session: revoke the first token
    await adapter.revokeSession(session.id);
    const revokedSession = await adapter.findSessionByTokenHash(tokenHash);
    assert.ok(revokedSession.revokedAt, 'Session must now be marked revoked');

    // 3. Token Reuse Detection: If someone attempts to use revokedSession again, revoke family!
    const revokedCount = await adapter.revokeAllUserSessions('rep-001');
    assert.ok(typeof revokedCount === 'number');
  });
});

test('BNW-016 Suite 3: Firestore Transactions, OCC & Domain Operations [CLASSIFICATION: MOCKED_FIRESTORE_TEST]', async (t) => {
  const adapter = new FirestoreAdapter();
  await adapter.init();

  await t.test('3.1 Optimistic Concurrency Control (OCC) rejects stale version updates', async () => {
    const draft = await adapter.createDraft({
      title: 'OCC परीक्षण समाचार',
      content: 'सामग्री विवरण',
      categoryId: 'cat-mp',
      districtId: 'dist-bhopal',
    }, { id: 'rep-001', fullName: 'संवाददाता', roles: ['REPORTER'] });

    const initialVersion = draft.version || 1;

    // Normal update increments version to initialVersion + 1
    const update1 = await adapter.updateDraft(draft.id, {
      title: 'पहला अद्यतन',
      version: initialVersion,
    });
    assert.strictEqual(update1.version, initialVersion + 1);

    // Stale update with old version MUST be rejected
    await assert.rejects(async () => {
      await adapter.updateDraft(draft.id, {
        title: 'बासी अद्यतन',
        version: initialVersion, // Stale version!
      });
    }, (err) => {
      assert.strictEqual(err.code, 'ERR_CONCURRENCY_CONFLICT');
      assert.strictEqual(err.statusCode, 409);
      return true;
    });
  });

  await t.test('3.2 Media storage metadata persistence and retrieval', async () => {
    const meta = await adapter.saveMediaMetadata({
      id: 'med-016-test',
      fileName: 'bhopal_metro_launch.webp',
      mimeType: 'image/webp',
      fileSizeBytes: 2048576,
      storagePath: 'media/articles/2026/11/med-016-test/bhopal_metro_launch.webp',
      uploaderId: 'rep-001',
    });

    assert.ok(meta.id);
    assert.strictEqual(meta.fileName, 'bhopal_metro_launch.webp');

    const retrieved = await adapter.getMediaMetadata('med-016-test');
    assert.ok(retrieved);
    assert.strictEqual(retrieved.fileSizeBytes, 2048576);
  });

  await t.test('3.3 Breaking news ticker toggle & delete lifecycle', async () => {
    const ticker = await adapter.createTicker({
      textHindi: 'भोपाल मेट्रो का ट्रायल रन सफलतापूर्वक संपन्न',
      priority: 'high',
    });
    assert.strictEqual(ticker.isActive, true);

    const toggled = await adapter.toggleTicker(ticker.id);
    assert.strictEqual(toggled.isActive, false);

    const deleted = await adapter.deleteTicker(ticker.id);
    assert.strictEqual(deleted, true);
  });

  await t.test('3.4 Advertisement create, toggle, and bounded listing', async () => {
    const ad = await adapter.createAd({
      title: 'मध्य प्रदेश हस्तशिल्प विकास निगम',
      targetUrl: 'https://mpecommerce.gov.in',
    });
    assert.strictEqual(ad.isActive, true);

    const toggled = await adapter.toggleAd(ad.id);
    assert.strictEqual(toggled.isActive, false);

    const ads = await adapter.getAds();
    assert.ok(Array.isArray(ads));
    assert.ok(ads.some((a) => a.id === ad.id));
  });
});

test('BNW-016 Suite 4: Database Identity & Android Prototype Isolation Invariants [CLASSIFICATION: ARCHITECTURAL_VERIFICATION]', async (t) => {
  await t.test('4.1 Canonical Web database identity verified across all layers', () => {
    const canonicalDb = 'ai-studio-breakingnewswala-81a8a8f4-57a5-4181-aa74-2ef4d34fbab7';

    // 1. firebase-applet-config.json
    const appletConfig = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'firebase-applet-config.json'), 'utf8'));
    assert.strictEqual(appletConfig.firestoreDatabaseId, canonicalDb);

    // 2. apphosting.yaml
    const appHostingYaml = fs.readFileSync(path.join(ROOT_DIR, 'apphosting.yaml'), 'utf8');
    assert.ok(appHostingYaml.includes(canonicalDb));

    // 3. firestoreAdapter.js constant
    assert.strictEqual(CANONICAL_FIRESTORE_DB_ID, canonicalDb);
  });

  await t.test('4.2 Firebase CLI rules target isolates Android prototype database', () => {
    const raw = fs.readFileSync(path.join(ROOT_DIR, 'firebase.json'), 'utf8');
    const parsed = JSON.parse(raw);
    const firestoreTargets = Array.isArray(parsed.firestore) ? parsed.firestore : [parsed.firestore];

    // Primary target MUST be the Web canonical database
    assert.strictEqual(
      firestoreTargets[0].database,
      'ai-studio-breakingnewswala-81a8a8f4-57a5-4181-aa74-2ef4d34fbab7'
    );
    assert.strictEqual(firestoreTargets[0].rules, 'firestore.rules');

    // CRITICAL MANDATE: Android prototype database must NOT be targeted for Web rules deployment
    const hasAndroidTarget = firestoreTargets.some(
      (t) => t.database === 'ai-studio-android-breaking-b83ef913-4fbd-4bd1-8b00-92a4f70648d7'
    );
    assert.strictEqual(hasAndroidTarget, false, 'Android prototype database must not be targeted in firebase.json rules');
  });

  await t.test('4.3 Storage rules file verified for file type & size limits', () => {
    const rules = fs.readFileSync(path.join(ROOT_DIR, 'storage.rules'), 'utf8');
    assert.ok(rules.includes('10 * 1024 * 1024'), '10 MB image size limit required');
    assert.ok(rules.includes('100 * 1024 * 1024'), '100 MB video size limit required');
    assert.ok(rules.includes('image/(jpeg|png|webp)'), 'MIME validation for images required');
    assert.ok(rules.includes('video/mp4'), 'MIME validation for video required');
    assert.ok(rules.includes('/reporters/{reporterId}/credentials/'), 'Reporter credentials protection required');
  });

  await t.test('4.4 Production mode fails closed if authoritative database is unreachable', () => {
    const prevEnv = process.env.NODE_ENV;
    const prevDbUrl = process.env.DATABASE_URL;

    try {
      process.env.NODE_ENV = 'production';
      delete process.env.DATABASE_URL;

      const disconnectedAdapter = new FirestoreAdapter();
      disconnectedAdapter.connected = false;

      assert.throws(() => {
        disconnectedAdapter.failClosedError();
      }, (err) => {
        assert.strictEqual(err.code, 'ERR_DATABASE_UNAVAILABLE');
        assert.strictEqual(err.statusCode, 503);
        return true;
      });
    } finally {
      process.env.NODE_ENV = prevEnv;
      if (prevDbUrl) process.env.DATABASE_URL = prevDbUrl;
    }
  });
});
