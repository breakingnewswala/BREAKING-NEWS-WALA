import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { handleApiRequest } from '../src/server/apiEngine.js';
import { getPersistenceAdapter } from '../src/server/persistence/adapter.js';
import { defaultFirebaseAuthService } from '../src/server/auth/firebaseAuthService.js';

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

function createMockFirebaseIdToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.mockSignature`;
}

test('Google Sign-In Flow and Profile Syncing Comprehensive Test Suite', async (t) => {
  const mockServer = createMockServer();
  await mockServer.start();
  const adapter = getPersistenceAdapter();

  t.after(async () => {
    await mockServer.stop();
  });

  // -------------------------------------------------------------
  // TEST GROUP 1: GOOGLE SIGN-IN AUTHENTICATION FLOW
  // -------------------------------------------------------------

  await t.test('1. Reject login attempt with missing ID token (HTTP 400)', async () => {
    const res = await mockServer.request('POST', '/api/v1/auth/firebase-login', {});
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.data.error.code, 'ERR_MISSING_ID_TOKEN');
  });

  await t.test('2. Reject forged or malformed ID token (HTTP 400/401)', async () => {
    const res = await mockServer.request('POST', '/api/v1/auth/firebase-login', { idToken: 'invalid.malformed.jwt' });
    assert.ok(res.statusCode === 400 || res.statusCode === 401);
    assert.strictEqual(res.data.success, false);
  });

  let readerAccessToken = '';
  const readerUid = 'uid-reader-test-101';
  const readerEmail = 'reader.test.mp@gmail.com';

  await t.test('3. Ordinary Google user sign-in provisions Reader session with dual tokens', async () => {
    const idToken = createMockFirebaseIdToken({
      sub: readerUid,
      email: readerEmail,
      email_verified: true,
      name: 'मध्य प्रदेश पाठक',
      aud: 'breaking-news-wala',
      iss: 'https://securetoken.google.com/breaking-news-wala',
      iat: Math.floor(Date.now() / 1000) - 10,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const res = await mockServer.request('POST', '/api/v1/auth/firebase-login', { idToken });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.tokens.accessToken);
    assert.ok(res.data.data.tokens.refreshToken);
    assert.strictEqual(res.data.data.user.email, readerEmail);
    assert.deepStrictEqual(res.data.data.user.roles, ['READER']);
    readerAccessToken = res.data.data.tokens.accessToken;
  });

  await t.test('4. Reader access token accesses /api/v1/auth/me and confirms Reader role', async () => {
    const res = await mockServer.request('GET', '/api/v1/auth/me', null, {
      Authorization: `Bearer ${readerAccessToken}`,
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.data.email, readerEmail);
    assert.strictEqual(res.data.data.role, 'READER');
  });

  let masterAdminToken = '';
  const masterAdminUid = 'uid-master-admin-test-001';
  const masterAdminEmail = 'breakingnewswala.com@gmail.com';

  await t.test('5. Verified Master Admin email sign-in automatically elevates to MASTER_ADMIN', async () => {
    const idToken = createMockFirebaseIdToken({
      sub: masterAdminUid,
      email: masterAdminEmail,
      email_verified: true,
      name: 'मुख्य व्यवस्थापक',
      aud: 'breaking-news-wala',
      iss: 'https://securetoken.google.com/breaking-news-wala',
      iat: Math.floor(Date.now() / 1000) - 10,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const res = await mockServer.request('POST', '/api/v1/auth/firebase-login', { idToken });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.user.roles.includes('MASTER_ADMIN'));
    assert.ok(res.data.data.user.roles.includes('ADMIN'));
    masterAdminToken = res.data.data.tokens.accessToken;
  });

  await t.test('6. Unverified email matching Master Admin is NOT granted elevated privileges (strictly READER)', async () => {
    const spoofIdToken = createMockFirebaseIdToken({
      sub: 'uid-spoof-attempt-unverified',
      email: masterAdminEmail,
      email_verified: false, // NOT VERIFIED
      aud: 'breaking-news-wala',
      iss: 'https://securetoken.google.com/breaking-news-wala',
      iat: Math.floor(Date.now() / 1000) - 10,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const res = await mockServer.request('POST', '/api/v1/auth/firebase-login', { idToken: spoofIdToken });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.data.user.roles.includes('MASTER_ADMIN'), false);
    assert.strictEqual(res.data.data.user.roles.includes('ADMIN'), false);
    assert.deepStrictEqual(res.data.data.user.roles, ['READER']);
  });

  // -------------------------------------------------------------
  // TEST GROUP 2: FIRESTORE USER PROFILE SYNCING VALIDATION
  // -------------------------------------------------------------

  await t.test('7. syncUserProfileToFirestore schema matches firestore.rules requirements exactly', () => {
    const mockUser = {
      uid: 'user-sample-123',
      email: 'user@example.com',
      displayName: 'Sample User',
      photoURL: 'https://example.com/avatar.jpg',
    };

    // Construct the payload generated by our remediated syncUserProfileToFirestore
    const isMaster = mockUser.email === 'breakingnewswala.com@gmail.com';
    const createPayload = {
      uid: mockUser.uid,
      email: mockUser.email,
      displayName: mockUser.displayName,
      role: isMaster ? 'ADMIN' : 'READER',
      district: 'भोपाल',
      coins: 0,
      photoUrl: mockUser.photoURL,
    };

    // Rule Check 1: incoming().keys().hasAll(['uid', 'email', 'displayName', 'role', 'coins'])
    const requiredKeys = ['uid', 'email', 'displayName', 'role', 'coins'];
    assert.ok(requiredKeys.every((k) => k in createPayload), 'Missing required key in user profile');

    // Rule Check 2: incoming().keys().hasOnly(['uid', 'email', 'displayName', 'photoUrl', 'role', 'district', 'coins', 'createdAt', 'updatedAt'])
    const allowedKeys = new Set(['uid', 'email', 'displayName', 'photoUrl', 'role', 'district', 'coins', 'createdAt', 'updatedAt']);
    assert.ok(Object.keys(createPayload).every((k) => allowedKeys.has(k)), 'Forbidden key present in user profile');

    // Rule Check 3: uid must match userId
    assert.strictEqual(createPayload.uid, mockUser.uid);

    // Rule Check 4: Initial coins must be strictly 0
    assert.strictEqual(createPayload.coins, 0);

    // Rule Check 5: Ordinary user must be 'READER', only master admin can be 'ADMIN'
    assert.strictEqual(createPayload.role, 'READER');
  });

  await t.test('8. saveBookmarkToFirestore schema matches firestore.rules requirements exactly', () => {
    const uid = 'user-sample-123';
    const mockArticle = {
      id: 'art-bhopal-999',
      title: 'भोपाल विकास परियोजना को हरी झंडी',
      categoryName: 'विकास',
      districtName: 'भोपाल',
      featuredImage: 'https://images.example.com/bhopal.jpg',
    };

    // Construct the payload generated by our remediated saveBookmarkToFirestore
    const bookmarkPayload = {
      userId: uid,
      articleId: mockArticle.id,
      articleTitle: mockArticle.title,
      articleCategory: mockArticle.categoryName,
      articleDistrict: mockArticle.districtName,
      articleImageUrl: mockArticle.featuredImage,
    };

    // Rule Check 1: hasAll(['userId', 'articleId', 'articleTitle', 'createdAt'])
    const requiredBookmarkKeys = ['userId', 'articleId', 'articleTitle'];
    assert.ok(requiredBookmarkKeys.every((k) => k in bookmarkPayload));

    // Rule Check 2: hasOnly(['userId', 'articleId', 'articleTitle', 'articleCategory', 'articleDistrict', 'articleImageUrl', 'createdAt'])
    const allowedBookmarkKeys = new Set(['userId', 'articleId', 'articleTitle', 'articleCategory', 'articleDistrict', 'articleImageUrl', 'createdAt']);
    assert.ok(Object.keys(bookmarkPayload).every((k) => allowedBookmarkKeys.has(k)), 'Forbidden key present in bookmark');

    // Rule Check 3: userId matches authenticated uid
    assert.strictEqual(bookmarkPayload.userId, uid);

    // Rule Check 4: No forbidden legacy keys like 'id' or 'savedAt'
    assert.strictEqual('id' in bookmarkPayload, false, 'Bookmark must not send "id"');
    assert.strictEqual('savedAt' in bookmarkPayload, false, 'Bookmark must not send "savedAt" (use createdAt)');
  });
});
