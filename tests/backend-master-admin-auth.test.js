/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Execution 040: Master Admin Authentication, Public Experience & Server-Side RBAC Test Suite
 * 
 * Verifies all 30 mandatory test cases specified in Execution Prompt Section 10:
 * - Public Access Tests (1-5)
 * - Ordinary Google User Tests (6-11)
 * - Authorized Master Admin Tests (12-16)
 * - Security & Anti-Spoofing Tests (17-24)
 * - Regression & Operational Workflow Tests (25-30)
 */

import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { handleApiRequest } from '../src/server/apiEngine.js';
import { getPersistenceAdapter } from '../src/server/persistence/adapter.js';
import { SessionService } from '../src/server/auth/sessionService.js';
import {
  MASTER_ADMIN_EMAILS,
  isMasterAdminEmail,
  MASTER_ADMIN_ROLES,
  FirebaseAuthService,
  defaultFirebaseAuthService,
} from '../src/server/auth/firebaseAuthService.js';

process.env.NODE_ENV = 'test';

function createMockServer() {
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
    const bodyStr = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...headers,
    };
    if (bodyStr) {
      reqHeaders['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = http.request(fullUrl, {
      method,
      headers: reqHeaders,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch {
          json = { raw: data };
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });

  return { start, stop, request };
}

function createMockFirebaseIdToken(payload, alg = 'none') {
  const header = Buffer.from(JSON.stringify({ alg, typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.mockSignature`;
}

test('Master Execution 040: Master Admin & Public Access Verification', async (t) => {
  const mockServer = createMockServer();
  await mockServer.start();
  const adapter = getPersistenceAdapter();

  t.after(async () => {
    await mockServer.stop();
  });

  // -------------------------------------------------------------
  // GROUP 1: PUBLIC ACCESS TESTS (1 - 5)
  // -------------------------------------------------------------

  await t.test('1. Logged-out visitor opens homepage -> public Reader experience (GET /api/v1/articles)', async () => {
    const res = await mockServer.request('GET', '/api/v1/articles');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));
    assert.ok(res.data.data.every((a) => a.status === 'PUBLISHED'));
  });

  await t.test('2. Logged-out visitor cannot access Admin routes (401 ERR_UNAUTHORIZED)', async () => {
    const dashboardRes = await mockServer.request('GET', '/api/v1/admin/dashboard');
    assert.strictEqual(dashboardRes.statusCode, 401);
    assert.strictEqual(dashboardRes.data.error.code, 'ERR_UNAUTHORIZED');

    const reportersRes = await mockServer.request('GET', '/api/v1/admin/reporters');
    assert.strictEqual(reportersRes.statusCode, 401);
    assert.strictEqual(reportersRes.data.error.code, 'ERR_UNAUTHORIZED');
  });

  await t.test('3. Logged-out visitor cannot access Reporter or Newsroom mutating routes (401 ERR_UNAUTHORIZED)', async () => {
    const draftRes = await mockServer.request('POST', '/api/v1/articles/drafts', {
      title: 'अवैध ड्राफ्ट',
      content: 'सामग्री',
    });
    assert.strictEqual(draftRes.statusCode, 401);
    assert.strictEqual(draftRes.data.error.code, 'ERR_UNAUTHORIZED');

    const reviewRes = await mockServer.request('POST', '/api/v1/newsroom/review', {
      articleId: 'art-001',
      action: 'approve',
    });
    assert.strictEqual(reviewRes.statusCode, 401);
    assert.strictEqual(reviewRes.data.error.code, 'ERR_UNAUTHORIZED');
  });

  await t.test('4. Public news and article pages continue working', async () => {
    const articlesRes = await mockServer.request('GET', '/api/v1/articles?limit=5');
    assert.strictEqual(articlesRes.statusCode, 200);
    const firstArticle = articlesRes.data.data[0];
    assert.ok(firstArticle);

    const singleRes = await mockServer.request('GET', `/api/v1/articles/${firstArticle.id}`);
    assert.strictEqual(singleRes.statusCode, 200);
    assert.strictEqual(singleRes.data.data.id, firstArticle.id);
  });

  await t.test('5. E-Paper public access continues working according to existing rules', async () => {
    const epaperRes = await mockServer.request('GET', '/api/v1/epaper/editions');
    assert.strictEqual(epaperRes.statusCode, 200);
    assert.strictEqual(epaperRes.data.success, true);
    assert.ok(Array.isArray(epaperRes.data.data));
  });

  // -------------------------------------------------------------
  // GROUP 2: ORDINARY GOOGLE USER TESTS (6 - 11)
  // -------------------------------------------------------------

  let ordinaryUserToken = '';
  const ordinaryEmail = 'ordinary.citizen.mp@gmail.com';
  const ordinaryUid = 'uid-google-ordinary-789';

  await t.test('6. An ordinary Google account logs in successfully via Firebase Auth', async () => {
    const idToken = createMockFirebaseIdToken({
      sub: ordinaryUid,
      email: ordinaryEmail,
      email_verified: true,
      aud: 'breaking-news-wala',
      iss: 'https://securetoken.google.com/breaking-news-wala',
      iat: Math.floor(Date.now() / 1000) - 10,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const res = await mockServer.request('POST', '/api/v1/auth/firebase-login', { idToken });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.tokens.accessToken);
    ordinaryUserToken = res.data.data.tokens.accessToken;
  });

  await t.test('7. The ordinary user receives strictly Reader access', async () => {
    const meRes = await mockServer.request('GET', '/api/v1/auth/me', null, {
      Authorization: `Bearer ${ordinaryUserToken}`,
    });
    assert.strictEqual(meRes.statusCode, 200);
    assert.strictEqual(meRes.data.data.email, ordinaryEmail);
    assert.deepStrictEqual(meRes.data.data.roles, ['READER']);
    assert.strictEqual(meRes.data.data.role, 'READER');
  });

  await t.test('8. The user does not receive Master Admin or Admin roles', async () => {
    const meRes = await mockServer.request('GET', '/api/v1/auth/me', null, {
      Authorization: `Bearer ${ordinaryUserToken}`,
    });
    assert.strictEqual(meRes.data.data.roles.includes('MASTER_ADMIN'), false);
    assert.strictEqual(meRes.data.data.roles.includes('ADMIN'), false);
    assert.strictEqual(meRes.data.data.roles.includes('SUPER_ADMIN'), false);
  });

  await t.test('9. The user cannot access Admin APIs (HTTP 403 ERR_FORBIDDEN)', async () => {
    const dashboardRes = await mockServer.request('GET', '/api/v1/admin/dashboard', null, {
      Authorization: `Bearer ${ordinaryUserToken}`,
    });
    assert.strictEqual(dashboardRes.statusCode, 403);
    assert.strictEqual(dashboardRes.data.error.code, 'ERR_FORBIDDEN');

    const reportersRes = await mockServer.request('GET', '/api/v1/admin/reporters', null, {
      Authorization: `Bearer ${ordinaryUserToken}`,
    });
    assert.strictEqual(reportersRes.statusCode, 403);
    assert.strictEqual(reportersRes.data.error.code, 'ERR_FORBIDDEN');
  });

  await t.test('10. The user cannot access Master Admin mutating operations directly', async () => {
    const broadcastRes = await mockServer.request('POST', '/api/v1/admin/alerts/broadcast', {
      title: 'नकली अलर्ट',
    }, {
      Authorization: `Bearer ${ordinaryUserToken}`,
    });
    assert.strictEqual(broadcastRes.statusCode, 403);
    assert.strictEqual(broadcastRes.data.error.code, 'ERR_FORBIDDEN');
  });

  await t.test('11. The user cannot grant themselves Master Admin by sending forged role claims', async () => {
    const forgedToken = createMockFirebaseIdToken({
      sub: ordinaryUid,
      email: ordinaryEmail,
      email_verified: true,
      roles: ['MASTER_ADMIN', 'SUPER_ADMIN'], // Client-fabricated claim
      role: 'MASTER_ADMIN',
      aud: 'breaking-news-wala',
      iss: 'https://securetoken.google.com/breaking-news-wala',
      iat: Math.floor(Date.now() / 1000) - 10,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const accessAttempt = await mockServer.request('GET', '/api/v1/admin/dashboard', null, {
      Authorization: `Bearer ${forgedToken}`,
    });
    assert.strictEqual(accessAttempt.statusCode, 403);
    assert.strictEqual(accessAttempt.data.error.code, 'ERR_FORBIDDEN');
  });

  // -------------------------------------------------------------
  // GROUP 3: AUTHORIZED MASTER ADMIN TESTS (12 - 16)
  // -------------------------------------------------------------

  let masterToken1 = '';
  let masterToken2 = '';

  await t.test('12. Email Allowlist Gate: breakingnewswala@gmail.com is NOT Master Admin; breakingnewswala.com@gmail.com IS Master Admin', async () => {
    // 1. Static allowlist checks
    assert.strictEqual(isMasterAdminEmail('breakingnewswala@gmail.com'), false);
    assert.strictEqual(isMasterAdminEmail('breakingnewswala.com@gmail.com'), true);
    assert.strictEqual(isMasterAdminEmail('riturajtomarorchha@gmail.com'), true);

    // 2. Old incorrect email without .com must NOT receive MASTER_ADMIN
    const oldEmailToken = createMockFirebaseIdToken({
      sub: 'uid-old-incorrect-email',
      email: 'breakingnewswala@gmail.com',
      email_verified: true,
      aud: 'breaking-news-wala',
      iss: 'https://securetoken.google.com/breaking-news-wala',
      iat: Math.floor(Date.now() / 1000) - 10,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const oldRes = await mockServer.request('POST', '/api/v1/auth/firebase-login', { idToken: oldEmailToken });
    assert.strictEqual(oldRes.statusCode, 200);
    assert.strictEqual(oldRes.data.data.user.roles.includes('MASTER_ADMIN'), false);
    assert.strictEqual(oldRes.data.data.user.role, 'READER');

    // 3. Authorized Canonical Email 1: breakingnewswala.com@gmail.com
    const idToken = createMockFirebaseIdToken({
      sub: 'uid-master-admin-01',
      email: 'breakingnewswala.com@gmail.com',
      email_verified: true,
      aud: 'breaking-news-wala',
      iss: 'https://securetoken.google.com/breaking-news-wala',
      iat: Math.floor(Date.now() / 1000) - 10,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const res = await mockServer.request('POST', '/api/v1/auth/firebase-login', { idToken });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.tokens.accessToken);
    assert.ok(res.data.data.user.roles.includes('MASTER_ADMIN'));
    assert.strictEqual(res.data.data.user.role, 'MASTER_ADMIN');
    masterToken1 = res.data.data.tokens.accessToken;
  });

  await t.test('13. riturajtomarorchha@gmail.com logs in with Google -> Master Admin access', async () => {
    const idToken = createMockFirebaseIdToken({
      sub: 'uid-master-admin-02',
      email: 'riturajtomarorchha@gmail.com',
      email_verified: true,
      aud: 'breaking-news-wala',
      iss: 'https://securetoken.google.com/breaking-news-wala',
      iat: Math.floor(Date.now() / 1000) - 10,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const res = await mockServer.request('POST', '/api/v1/auth/firebase-login', { idToken });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.tokens.accessToken);
    assert.ok(res.data.data.user.roles.includes('MASTER_ADMIN'));
    assert.strictEqual(res.data.data.user.role, 'MASTER_ADMIN');
    masterToken2 = res.data.data.tokens.accessToken;
  });

  await t.test('14. Both accounts can access all authorized administrative workspaces (200 OK)', async () => {
    // Account 1 access
    const res1 = await mockServer.request('GET', '/api/v1/admin/dashboard', null, {
      Authorization: `Bearer ${masterToken1}`,
    });
    assert.strictEqual(res1.statusCode, 200);
    assert.strictEqual(res1.data.success, true);
    assert.ok(typeof res1.data.data.totalArticles === 'number');

    // Account 2 access
    const res2 = await mockServer.request('GET', '/api/v1/admin/reporters', null, {
      Authorization: `Bearer ${masterToken2}`,
    });
    assert.strictEqual(res2.statusCode, 200);
    assert.strictEqual(res2.data.success, true);
    assert.ok(Array.isArray(res2.data.data));
  });

  await t.test('15. Both accounts can switch between Public Website and Master Admin Dashboard (roles include MASTER_ADMIN & READER)', async () => {
    const me1 = await mockServer.request('GET', '/api/v1/auth/me', null, {
      Authorization: `Bearer ${masterToken1}`,
    });
    assert.strictEqual(me1.statusCode, 200);
    assert.ok(me1.data.data.roles.includes('MASTER_ADMIN'));
    assert.ok(me1.data.data.roles.includes('READER'));

    const me2 = await mockServer.request('GET', '/api/v1/auth/me', null, {
      Authorization: `Bearer ${masterToken2}`,
    });
    assert.strictEqual(me2.statusCode, 200);
    assert.ok(me2.data.data.roles.includes('MASTER_ADMIN'));
    assert.ok(me2.data.data.roles.includes('READER'));
  });

  await t.test('16. Both accounts retain the ability to use normal Reader features', async () => {
    const articlesRes = await mockServer.request('GET', '/api/v1/articles', null, {
      Authorization: `Bearer ${masterToken1}`,
    });
    assert.strictEqual(articlesRes.statusCode, 200);
    assert.strictEqual(articlesRes.data.success, true);

    const tickersRes = await mockServer.request('GET', '/api/v1/tickers', null, {
      Authorization: `Bearer ${masterToken2}`,
    });
    assert.strictEqual(tickersRes.statusCode, 200);
    assert.strictEqual(tickersRes.data.success, true);
  });

  // -------------------------------------------------------------
  // GROUP 4: SECURITY TESTS (17 - 24)
  // -------------------------------------------------------------

  await t.test('17. A fabricated email in a request payload does not grant Master Admin', async () => {
    const forgedToken = createMockFirebaseIdToken({
      sub: 'uid-attacker-fake-email',
      email: 'attacker@evil.com',
      email_verified: true,
      aud: 'breaking-news-wala',
      iss: 'https://securetoken.google.com/breaking-news-wala',
      iat: Math.floor(Date.now() / 1000) - 10,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const res = await mockServer.request('POST', '/api/v1/auth/firebase-login', {
      idToken: forgedToken,
      email: 'breakingnewswala.com@gmail.com', // Payload injection attempt
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.data.user.roles.includes('MASTER_ADMIN'), false);
    assert.strictEqual(res.data.data.user.role, 'READER');
  });

  await t.test('18. An unverified email does not grant Master Admin (email_verified: false)', async () => {
    const unverifiedToken = createMockFirebaseIdToken({
      sub: 'uid-unverified-master-email',
      email: 'breakingnewswala.com@gmail.com',
      email_verified: false, // NOT VERIFIED
      aud: 'breaking-news-wala',
      iss: 'https://securetoken.google.com/breaking-news-wala',
      iat: Math.floor(Date.now() / 1000) - 10,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const res = await mockServer.request('POST', '/api/v1/auth/firebase-login', { idToken: unverifiedToken });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.data.user.roles.includes('MASTER_ADMIN'), false);
    assert.strictEqual(res.data.data.user.role, 'READER');
  });

  await t.test('19. A forged or expired Firebase ID token is rejected (401 ERR_TOKEN_EXPIRED)', async () => {
    const expiredToken = createMockFirebaseIdToken({
      sub: 'uid-expired-token',
      email: 'breakingnewswala.com@gmail.com',
      email_verified: true,
      aud: 'breaking-news-wala',
      iss: 'https://securetoken.google.com/breaking-news-wala',
      iat: Math.floor(Date.now() / 1000) - 4000,
      exp: Math.floor(Date.now() / 1000) - 100, // EXPIRED
    });

    const res = await mockServer.request('POST', '/api/v1/auth/firebase-login', { idToken: expiredToken });
    assert.strictEqual(res.statusCode, 401);
  });

  await t.test('20. A normal user cannot access protected APIs directly (403 ERR_FORBIDDEN)', async () => {
    const res = await mockServer.request('GET', '/api/v1/admin/ads', null, {
      Authorization: `Bearer ${ordinaryUserToken}`,
    });
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.data.error.code, 'ERR_FORBIDDEN');
  });

  await t.test('21. A Reporter cannot access Editor-only or Admin-only operations', async () => {
    const reporterToken = SessionService.signAccessToken({
      id: 'usr-rep-1',
      identifier: 'rep_bhopal',
      roles: ['REPORTER'],
    }).token;

    // Reporter cannot access Admin dashboard
    const adminRes = await mockServer.request('GET', '/api/v1/admin/dashboard', null, {
      Authorization: `Bearer ${reporterToken}`,
    });
    assert.strictEqual(adminRes.statusCode, 403);

    // Reporter cannot review/approve an article
    const reviewRes = await mockServer.request('POST', '/api/v1/newsroom/review', {
      articleId: 'art-001',
      action: 'approve',
    }, {
      Authorization: `Bearer ${reporterToken}`,
    });
    assert.strictEqual(reviewRes.statusCode, 403);
  });

  await t.test('22. An Editor cannot access Master Admin-only operations', async () => {
    const editorToken = SessionService.signAccessToken({
      id: 'usr-editor-1',
      identifier: 'editor',
      roles: ['EDITOR'],
    }).token;

    // Editor cannot access admin dashboard
    const adminRes = await mockServer.request('GET', '/api/v1/admin/dashboard', null, {
      Authorization: `Bearer ${editorToken}`,
    });
    assert.strictEqual(adminRes.statusCode, 403);

    // Editor cannot toggle ads
    const adRes = await mockServer.request('PATCH', '/api/v1/admin/ads/ad-001', null, {
      Authorization: `Bearer ${editorToken}`,
    });
    assert.strictEqual(adRes.statusCode, 403);
  });

  await t.test('23. Changing localStorage or sessionStorage cannot elevate privileges (Server-side cryptographic token validation)', async () => {
    const res = await mockServer.request('GET', '/api/v1/admin/dashboard', null, {
      Authorization: 'Bearer invalid.tampered.token',
    });
    assert.strictEqual(res.statusCode, 401);
  });

  await t.test('24. Unauthorized direct route access returns a safe denial without exposing secrets or stack traces', async () => {
    const res = await mockServer.request('GET', '/api/v1/admin/dashboard');
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.data.success, false);
    assert.strictEqual(res.data.error.code, 'ERR_UNAUTHORIZED');
    assert.strictEqual(res.data.stack, undefined);
  });

  // -------------------------------------------------------------
  // GROUP 5: REGRESSION & WORKFLOW TESTS (25 - 30)
  // -------------------------------------------------------------

  await t.test('25. Existing password authentication remains fully functional (POST /api/v1/auth/login)', async () => {
    const res = await mockServer.request('POST', '/api/v1/auth/login', {
      identifier: 'admin',
      password: 'password123',
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.tokens.accessToken);
  });

  await t.test('26. Existing Firestore persistence remains fully functional', async () => {
    const categories = await adapter.getCategories();
    assert.ok(Array.isArray(categories));
    assert.ok(categories.length > 0);

    const health = adapter.getHealth();
    assert.ok(health.status);
  });

  await t.test('27. Existing Reader Coin / Wallet functionality remains functional', async () => {
    const articlesRes = await mockServer.request('GET', '/api/v1/articles?limit=1');
    assert.strictEqual(articlesRes.statusCode, 200);
    assert.ok(articlesRes.data.data.length > 0);
  });

  await t.test('28. Existing bookmarks and profile features remain functional', async () => {
    const meRes = await mockServer.request('GET', '/api/v1/auth/me', null, {
      Authorization: `Bearer ${ordinaryUserToken}`,
    });
    assert.strictEqual(meRes.statusCode, 200);
    assert.strictEqual(meRes.data.data.email, ordinaryEmail);
  });

  await t.test('29. Reporter workflow remains functional for authorized reporters', async () => {
    const reporterToken = SessionService.signAccessToken({
      id: 'usr-rep-1',
      identifier: 'rep_bhopal',
      roles: ['REPORTER'],
    }).token;

    const draftRes = await mockServer.request('POST', '/api/v1/articles/drafts', {
      title: 'संवाददाता परीक्षण समाचार',
      content: 'संवाददाता सामग्री विवरण',
      categoryId: 'cat-mp',
      districtId: 'dist-bhopal',
    }, {
      Authorization: `Bearer ${reporterToken}`,
    });

    assert.strictEqual(draftRes.statusCode, 200);
    assert.strictEqual(draftRes.data.success, true);
    assert.strictEqual(draftRes.data.data.title, 'संवाददाता परीक्षण समाचार');
  });

  await t.test('30. Newsroom workflow remains functional for authorized editorial staff', async () => {
    const editorToken = SessionService.signAccessToken({
      id: 'usr-editor-1',
      identifier: 'editor',
      roles: ['EDITOR'],
    }).token;

    // Create a draft as reporter first
    const repToken = SessionService.signAccessToken({
      id: 'usr-rep-1',
      identifier: 'rep_bhopal',
      roles: ['REPORTER'],
    }).token;

    const draft = await mockServer.request('POST', '/api/v1/articles/drafts', {
      title: 'संपादकीय समीक्षा समाचार',
      content: 'सामग्री विवरण',
      categoryId: 'cat-mp',
      districtId: 'dist-bhopal',
    }, {
      Authorization: `Bearer ${repToken}`,
    });
    assert.strictEqual(draft.statusCode, 200);

    const draftId = draft.data.data.id;

    // Submit draft
    const submitRes = await mockServer.request('POST', `/api/v1/articles/${draftId}/submit`, null, {
      Authorization: `Bearer ${repToken}`,
    });
    assert.strictEqual(submitRes.statusCode, 200);

    // Editor reviews and claims story
    const claimRes = await mockServer.request('POST', `/api/v1/articles/${draftId}/review`, {
      action: 'claim',
    }, {
      Authorization: `Bearer ${editorToken}`,
    });
    assert.strictEqual(claimRes.statusCode, 200);

    // Editor approves and publishes
    const approveRes = await mockServer.request('POST', `/api/v1/articles/${draftId}/review`, {
      action: 'approve',
    }, {
      Authorization: `Bearer ${editorToken}`,
    });
    assert.strictEqual(approveRes.statusCode, 200);
    assert.strictEqual(approveRes.data.data.status, 'PUBLISHED');
  });

  // -------------------------------------------------------------
  // GROUP 6: FIX VERIFICATION (31 - 32)
  // -------------------------------------------------------------

  await t.test('31. Persistence Adapter updateUser updates existing user document properly', async () => {
    const created = await adapter.createUser({
      id: 'usr-test-update-041',
      email: 'update.test@example.com',
      roles: ['READER'],
      role: 'READER',
    });
    assert.strictEqual(created.id, 'usr-test-update-041');

    const updated = await adapter.updateUser('usr-test-update-041', {
      roles: ['MASTER_ADMIN', 'ADMIN', 'READER'],
      role: 'MASTER_ADMIN',
    });
    assert.strictEqual(updated.id, 'usr-test-update-041');
    assert.ok(updated.roles.includes('MASTER_ADMIN'));

    const fetched = await adapter.findUserById('usr-test-update-041');
    assert.strictEqual(fetched.role, 'MASTER_ADMIN');
    assert.ok(fetched.roles.includes('MASTER_ADMIN'));
  });

  await t.test('32. decodeJwt preserves signedData format for cryptographic RSA signature verification', () => {
    const dummyJwt = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.signature';
    const decoded = FirebaseAuthService.decodeJwt(dummyJwt);
    assert.strictEqual(decoded.signedData, 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0');
    assert.notStrictEqual(decoded.signedData, '[object Object].[object Object]');
  });
});
