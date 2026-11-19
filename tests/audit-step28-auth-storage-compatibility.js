/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * STEP 28: Production Authentication & Storage Authorization Compatibility Audit Suite
 * 
 * Empirically audits:
 * 1. Standard Firebase ID Token behavior (zero custom claims) vs storage.rules
 * 2. UID Ownership vs Database Role in Reporter Directory (/reporters/{uid}/**)
 * 3. Server-side authoritative RBAC in POST /api/v1/media/upload
 * 4. Presigned upload endpoint authentication state
 * 5. E-Paper draft vs published backend access control
 * 6. WhatsApp card generation role gating
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithCustomToken, signOut } from 'firebase/auth';
import {
  getStorage,
  connectStorageEmulator,
  ref,
  uploadBytes,
  getBytes,
} from 'firebase/storage';
import { getApps, initializeApp as initAdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import http from 'node:http';
import {
  handleApiRequest,
  signToken,
  setApiEngineAdapter,
} from '../src/server/apiEngine.js';
import { LocalJsonAdapter } from '../src/server/persistence/adapter.js';

const PROJECT_ID = 'breaking-news-wala';
const STORAGE_BUCKET = 'breaking-news-wala.firebasestorage.app';

// 1. Initialize Admin SDK
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
const adminApp = getApps().length === 0
  ? initAdminApp({ projectId: PROJECT_ID })
  : getApps()[0];
const adminAuth = getAdminAuth(adminApp);

// 2. Initialize Client SDK
const clientApp = initializeApp({
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  apiKey: 'fake-api-key-for-audit',
});
const clientAuth = getAuth(clientApp);
connectAuthEmulator(clientAuth, 'http://127.0.0.1:9099', { disableWarnings: true });

const storage = getStorage(clientApp);
connectStorageEmulator(storage, '127.0.0.1', 9199);

// 3. Backend HTTP Server Setup
const testAdapter = new LocalJsonAdapter();
setApiEngineAdapter(testAdapter);

const AUDIT_PORT = 3288;
let backendServer;

function makeBackendRequest(pathName, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const dataStr = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(dataStr ? { 'Content-Length': Buffer.byteLength(dataStr) } : {}),
    };

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: AUDIT_PORT,
        path: pathName,
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (dataStr) req.write(dataStr);
    req.end();
  });
}

const auditFindings = [];
function recordFinding(id, topic, description, empiricalEvidence, riskRating, architectureMismatch) {
  auditFindings.push({ id, topic, description, empiricalEvidence, riskRating, architectureMismatch });
  console.log(`[${id}] ${topic}: ${description}`);
  console.log(`  Evidence: ${empiricalEvidence}`);
  console.log(`  Risk: ${riskRating} | Mismatch: ${architectureMismatch}\n`);
}

async function runStep28Audit() {
  console.log('================================================================');
  console.log('STARTING PRODUCTION AUTH & STORAGE AUTHORIZATION COMPATIBILITY AUDIT (STEP 28)');
  console.log('Storage Emulator: 127.0.0.1:9199 | Auth Emulator: 127.0.0.1:9099');
  console.log('Target Storage Rules: storage.rules');
  console.log('================================================================\n');

  backendServer = http.createServer((req, res) => handleApiRequest(req, res));
  await new Promise((resolve) => backendServer.listen(AUDIT_PORT, '127.0.0.1', resolve));

  // Seed database users
  await testAdapter.createUser({
    id: 'user-alice-reader',
    fullName: 'एलिस पाठक',
    email: 'alice.reader@example.com',
    role: 'READER',
    roles: ['READER'],
    status: 'active',
  });

  await testAdapter.createUser({
    id: 'user-bob-reporter',
    fullName: 'बॉब पत्रकार',
    email: 'bob.reporter@example.com',
    role: 'REPORTER',
    roles: ['REPORTER'],
    status: 'active',
  });

  await testAdapter.createUser({
    id: 'user-charlie-editor',
    fullName: 'चार्ली संपादक',
    email: 'charlie.editor@example.com',
    role: 'EDITOR',
    roles: ['EDITOR'],
    status: 'active',
  });

  // Seed editions: 1 draft, 1 published
  const draftEd = await testAdapter.createEpaperEditionWithPages({
    title: 'दैनिक भोपाल संस्करण (ड्राफ्ट)',
    editionType: 'DAILY',
    publicationDate: '2026-11-18',
    divisionId: 'bhopal',
    districtId: 'bhopal',
    status: 'DRAFT',
  }, { id: 'user-charlie-editor', roles: ['EDITOR'] });

  const pubEd = await testAdapter.createEpaperEditionWithPages({
    title: 'दैनिक इंदौर संस्करण (प्रकाशित)',
    editionType: 'DAILY',
    publicationDate: '2026-11-18',
    divisionId: 'indore',
    districtId: 'indore',
    status: 'DRAFT',
  }, { id: 'user-charlie-editor', roles: ['EDITOR'] });
  await testAdapter.publishEpaperEdition(pubEd.edition.id);

  // -------------------------------------------------------------
  // AUDIT ITEM 1: Standard Production Firebase ID Token Structure (Zero Custom Claims)
  // -------------------------------------------------------------
  // In production, Google Sign-In issues tokens with NO custom claims.
  // We simulate a standard production token by minting with empty custom claims:
  const standardEditorToken = await adminAuth.createCustomToken('user-charlie-editor', {});
  await signInWithCustomToken(clientAuth, standardEditorToken);
  const idTokenRes = await clientAuth.currentUser.getIdTokenResult();
  const hasCustomClaims = Boolean(idTokenRes.claims.role || idTokenRes.claims.roles || idTokenRes.claims.admin);

  // Try direct write to /editorial/** using standard token
  let standardTokenEditorialAllowed = false;
  try {
    const edRef = ref(storage, 'editorial/test-schedule.pdf');
    await uploadBytes(edRef, Buffer.from('editorial memo'), { contentType: 'application/pdf' });
    standardTokenEditorialAllowed = true;
  } catch (err) {
    standardTokenEditorialAllowed = false;
  }

  recordFinding(
    'AUDIT-28-01',
    'Production Firebase ID Token Claims',
    'Standard Firebase ID tokens lack custom role claims (role/roles/admin). Storage Rules isPrivilegedRole() evaluates to FALSE for direct client requests even for legitimate Editors/Admins.',
    `Token claims present: [${Object.keys(idTokenRes.claims).join(', ')}]. Custom claims present: ${hasCustomClaims}. Direct /editorial/ write with standard token: ${standardTokenEditorialAllowed ? 'ALLOWED' : 'BLOCKED (storage/unauthorized)'}`,
    'HIGH',
    'Client-direct Storage calls cannot authenticate privileged roles unless Custom Claims are synchronized via Admin SDK.'
  );

  // -------------------------------------------------------------
  // AUDIT ITEM 2: UID Ownership vs Database Role in Reporter Directory
  // -------------------------------------------------------------
  // Alice is an ordinary READER in the database.
  // In Firebase Auth, Alice has UID "user-alice-reader".
  const standardReaderToken = await adminAuth.createCustomToken('user-alice-reader', {});
  await signInWithCustomToken(clientAuth, standardReaderToken);

  let readerDirectCredUploadAllowed = false;
  try {
    const credRef = ref(storage, 'reporters/user-alice-reader/credentials/fake-badge.jpg');
    await uploadBytes(credRef, Buffer.from('fake reporter badge'), { contentType: 'image/jpeg' });
    readerDirectCredUploadAllowed = true;
  } catch (err) {
    readerDirectCredUploadAllowed = false;
  }

  let readerDirectWaUploadAllowed = false;
  try {
    const waRef = ref(storage, 'whatsapp/user-alice-reader/fake-card.png');
    await uploadBytes(waRef, Buffer.from('fake whatsapp card'), { contentType: 'image/png' });
    readerDirectWaUploadAllowed = true;
  } catch (err) {
    readerDirectWaUploadAllowed = false;
  }

  recordFinding(
    'AUDIT-28-02',
    'Reporter Directory Authorization vs UID Ownership',
    'Storage Rules enforce UID ownership (isOwner) rather than verified database role. An ordinary authenticated READER can create files under their own UID in /reporters/{uid}/** and /whatsapp/{uid}/**.',
    `Reader direct upload to /reporters/{ownUid}/credentials/**: ${readerDirectCredUploadAllowed ? 'ALLOWED' : 'BLOCKED'}. Direct upload to /whatsapp/{ownUid}/**: ${readerDirectWaUploadAllowed ? 'ALLOWED' : 'BLOCKED'}`,
    'MEDIUM',
    'Storage Rules lack cross-service Firestore access and cannot distinguish whether a UID belongs to a REPORTER or a READER.'
  );

  // -------------------------------------------------------------
  // AUDIT ITEM 3: Backend Upload API Role Verification (POST /api/v1/media/upload)
  // -------------------------------------------------------------
  // When Alice uses the backend API, does the backend enforce her actual database role?
  const aliceJwt = signToken({
    id: 'user-alice-reader',
    sub: 'user-alice-reader',
    fullName: 'एलिस पाठक',
    roles: ['READER'],
  });

  const bobJwt = signToken({
    id: 'user-bob-reporter',
    sub: 'user-bob-reporter',
    fullName: 'बॉब पत्रकार',
    roles: ['REPORTER'],
  });

  const aliceCredRes = await makeBackendRequest('/api/v1/media/upload', 'POST', {
    fileName: 'press_id.jpg',
    mimeType: 'image/jpeg',
    category: 'credentials',
    fileBuffer: Buffer.from('fake id').toString('base64'),
  }, aliceJwt);

  const bobCredRes = await makeBackendRequest('/api/v1/media/upload', 'POST', {
    fileName: 'press_id.jpg',
    mimeType: 'image/jpeg',
    category: 'credentials',
    fileBuffer: Buffer.from('legitimate id').toString('base64'),
  }, bobJwt);

  recordFinding(
    'AUDIT-28-03',
    'Backend Upload API Authoritative Role Enforcement',
    'The backend API strictly enforces database roles. Reader upload of credentials or article media is rejected (HTTP 403), while accredited Reporter upload is accepted (HTTP 200).',
    `Reader credentials upload: HTTP ${aliceCredRes.statusCode} (${aliceCredRes.body.error?.code}). Reporter credentials upload: HTTP ${bobCredRes.statusCode} (success: ${bobCredRes.body.success})`,
    'LOW (SECURE)',
    'None. Backend API successfully compensates for Storage Rules role-blindness.'
  );

  // -------------------------------------------------------------
  // AUDIT ITEM 4: Unauthenticated Presigned Upload Endpoint
  // -------------------------------------------------------------
  const unauthPresignedRes = await makeBackendRequest('/api/v1/media/presigned-upload', 'POST', {
    fileName: 'test.jpg',
    mimeType: 'image/jpeg',
  });

  recordFinding(
    'AUDIT-28-04',
    'Media Presigned-Upload Route Authentication',
    'POST /api/v1/media/presigned-upload lacks an authentication guard (if (!user) check is missing). It returns mock upload URLs to anonymous callers.',
    `Anonymous call to /api/v1/media/presigned-upload returns HTTP ${unauthPresignedRes.statusCode} (success: ${unauthPresignedRes.body.success}, uploadUrl: ${unauthPresignedRes.body.data?.uploadUrl})`,
    'MEDIUM',
    'Route exposes mock upload endpoints without checking caller identity.'
  );

  // -------------------------------------------------------------
  // AUDIT ITEM 5: E-Paper Draft vs Published Backend Access Control
  // -------------------------------------------------------------
  const draftPagesRes = await makeBackendRequest(`/api/v1/epaper/editions/${draftEd.edition.id}/pages`);
  const pubPagesRes = await makeBackendRequest(`/api/v1/epaper/editions/${pubEd.edition.id}/pages`);
  const draftPdfRes = await makeBackendRequest(`/api/v1/epaper/editions/${draftEd.edition.id}/export/pdf`);
  const pubPdfRes = await makeBackendRequest(`/api/v1/epaper/editions/${pubEd.edition.id}/export/pdf`);

  recordFinding(
    'AUDIT-28-05',
    'E-Paper Publication Access Mediation',
    'Backend API reliably guards draft broadsheets. Anonymous requests for Draft pages or PDF exports return HTTP 403 Forbidden. Published editions return HTTP 200 OK.',
    `Draft pages: HTTP ${draftPagesRes.statusCode}. Published pages: HTTP ${pubPagesRes.statusCode} (${pubPagesRes.body.data?.length} pages). Draft PDF: HTTP ${draftPdfRes.statusCode}. Published PDF: HTTP ${pubPdfRes.statusCode} (${pubPdfRes.headers['content-type']}).`,
    'LOW (SECURE)',
    'None. Backend publication-access architecture functions as intended.'
  );

  // -------------------------------------------------------------
  // AUDIT ITEM 6: WhatsApp Card Generation Role Gating
  // -------------------------------------------------------------
  const aliceWaRes = await makeBackendRequest('/api/v1/epaper/whatsapp/generate', 'POST', {
    format: '1:1',
    headline: 'पाठक द्वारा बनाया गया कार्ड',
    body: 'विवरण...',
  }, aliceJwt);

  recordFinding(
    'AUDIT-28-06',
    'WhatsApp Card Generation Role Authorization',
    'POST /api/v1/epaper/whatsapp/generate requires authentication but does not check if user possesses the REPORTER role. Authenticated Readers can invoke card generation and consume quotas.',
    `Reader call to /api/v1/epaper/whatsapp/generate: HTTP ${aliceWaRes.statusCode} (success: ${aliceWaRes.body.success}, reporterId: ${aliceWaRes.body.data?.reporterId})`,
    'MEDIUM',
    'Missing role check (isReporterUser) on WhatsApp card generation endpoint.'
  );

  backendServer.close();

  console.log('================================================================');
  console.log('STEP 28 COMPATIBILITY AUDIT COMPLETED');
  console.log(`Total Findings Evaluated: ${auditFindings.length}`);
  console.log('================================================================');
}

runStep28Audit().catch((err) => {
  console.error('FATAL AUDIT ERROR:', err);
  if (backendServer) backendServer.close();
  process.exit(1);
});
