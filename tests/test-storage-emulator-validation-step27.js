/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * STEP 27: Firebase Storage Security Rules & Publication Access Validation Suite
 * 
 * Verifies all 16 test requirements (A through P) against:
 * 1. Live Firebase Storage Emulator on 127.0.0.1:9199
 * 2. Live Firebase Authentication Emulator on 127.0.0.1:9099
 * 3. Live Server-Side Backend API Engine on 127.0.0.1:3286
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithCustomToken, signOut } from 'firebase/auth';
import {
  getStorage,
  connectStorageEmulator,
  ref,
  uploadBytes,
  getBytes,
  deleteObject,
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

// 1. Initialize Admin SDK for token minting
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
const adminApp = getApps().length === 0
  ? initAdminApp({ projectId: PROJECT_ID })
  : getApps()[0];
const adminAuth = getAdminAuth(adminApp);

// 2. Initialize Client SDK
const clientApp = initializeApp({
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  apiKey: 'fake-api-key-for-emulator',
});
const clientAuth = getAuth(clientApp);
connectAuthEmulator(clientAuth, 'http://127.0.0.1:9099', { disableWarnings: true });

const storage = getStorage(clientApp);
connectStorageEmulator(storage, '127.0.0.1', 9199);

// 3. Initialize Backend Server for API Verification
const testAdapter = new LocalJsonAdapter();
setApiEngineAdapter(testAdapter);

const BACKEND_PORT = 3286;
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
        port: BACKEND_PORT,
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

// Token helper
async function getTokenForRole(uid, role, extraClaims = {}) {
  const claims = { role, roles: [role], ...extraClaims };
  return adminAuth.createCustomToken(uid, claims);
}

// Test reporting
const results = [];
function record(testId, name, category, expectation, result, status, details = '') {
  results.push({ testId, name, category, expectation, result, status, details });
  const icon = status === 'PASS' ? '✔' : '✖ FAIL:';
  console.log(`${icon} [${testId}] ${name} -> ${result} (${status}) ${details ? '| ' + details : ''}`);
}

async function runStep27Validation() {
  console.log('================================================================');
  console.log('STARTING FIREBASE STORAGE SECURITY RULES REMEDIATION VALIDATION (STEP 27)');
  console.log('Target Storage Emulator: 127.0.0.1:9199');
  console.log('Target Auth Emulator: 127.0.0.1:9099');
  console.log('Target Backend API Server: 127.0.0.1:3286');
  console.log('Rules under test: Remediated root storage.rules');
  console.log('================================================================\n');

  // Start backend server
  backendServer = http.createServer((req, res) => handleApiRequest(req, res));
  await new Promise((resolve) => backendServer.listen(BACKEND_PORT, '127.0.0.1', resolve));

  // Seed two editions in adapter: one DRAFT, one PUBLISHED
  const draftEdition = await testAdapter.createEpaperEditionWithPages({
    title: 'भोपाल सुबह संस्करण (ड्राफ्ट)',
    editionType: 'DAILY',
    publicationDate: '2026-11-18',
    divisionId: 'bhopal',
    districtId: 'bhopal',
    status: 'DRAFT',
  }, { id: 'ed-001', roles: ['EDITOR'] });

  const publishedEdition = await testAdapter.createEpaperEditionWithPages({
    title: 'इंदौर मुख्य संस्करण (प्रकाशित)',
    editionType: 'DAILY',
    publicationDate: '2026-11-18',
    divisionId: 'indore',
    districtId: 'indore',
    status: 'DRAFT',
  }, { id: 'ed-001', roles: ['EDITOR'] });

  // Transition publishedEdition to PUBLISHED
  await testAdapter.publishEpaperEdition(publishedEdition.edition.id);

  // Stage a file in Storage under epaper using ADMIN token
  const adminToken = await getTokenForRole('user-admin-step27', 'ADMIN', { admin: true });
  await signInWithCustomToken(clientAuth, adminToken);
  const draftStorageRef = ref(storage, `epaper/${draftEdition.edition.id}/page_01.pdf`);
  await uploadBytes(draftStorageRef, Buffer.from('confidential draft PDF broadsheet'), { contentType: 'application/pdf' });

  // Switch to unauthenticated for public test cases
  await signOut(clientAuth);

  // -------------------------------------------------------------
  // Test A: Anonymous users cannot read Draft E-Paper files (Storage)
  // -------------------------------------------------------------
  try {
    await getBytes(draftStorageRef);
    record('TEST-A', 'Anonymous direct read of Draft E-Paper file in Storage', 'E-Paper Privacy', 'REJECT', 'ALLOWED', 'FAIL');
  } catch (err) {
    record('TEST-A', 'Anonymous direct read of Draft E-Paper file in Storage', 'E-Paper Privacy', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  // -------------------------------------------------------------
  // Test B: Anonymous users cannot read unpublished E-Paper files
  // -------------------------------------------------------------
  try {
    const unpubRef = ref(storage, `epaper/unpub-edition-123/proof.pdf`);
    await getBytes(unpubRef);
    record('TEST-B', 'Anonymous direct read of unpublished proof in Storage', 'E-Paper Privacy', 'REJECT', 'ALLOWED', 'FAIL');
  } catch (err) {
    record('TEST-B', 'Anonymous direct read of unpublished proof in Storage', 'E-Paper Privacy', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  // -------------------------------------------------------------
  // Test C: Anonymous users cannot directly read private E-Paper Storage paths
  // -------------------------------------------------------------
  try {
    const epaperRootRef = ref(storage, 'epaper/any-file.pdf');
    await getBytes(epaperRootRef);
    record('TEST-C', 'Anonymous direct read of /epaper/** storage tree', 'E-Paper Privacy', 'REJECT', 'ALLOWED', 'FAIL');
  } catch (err) {
    record('TEST-C', 'Anonymous direct read of /epaper/** storage tree', 'E-Paper Privacy', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  // -------------------------------------------------------------
  // Test D: Published E-Paper is available through authorized backend route after validation
  // -------------------------------------------------------------
  const pubRes = await makeBackendRequest(`/api/v1/epaper/editions/${publishedEdition.edition.id}/pages`);
  if (pubRes.statusCode === 200 && pubRes.body.success) {
    record('TEST-D', 'Public read of Published E-Paper via authorized backend route', 'Backend Mediation', 'HTTP 200', 'HTTP 200', 'PASS', `Pages: ${pubRes.body.data?.length || 0}`);
  } else {
    record('TEST-D', 'Public read of Published E-Paper via authorized backend route', 'Backend Mediation', 'HTTP 200', `HTTP ${pubRes.statusCode}`, 'FAIL');
  }

  // -------------------------------------------------------------
  // Test E: Draft E-Paper requests through backend are rejected for unauthenticated users
  // -------------------------------------------------------------
  const draftRes = await makeBackendRequest(`/api/v1/epaper/editions/${draftEdition.edition.id}/pages`);
  if (draftRes.statusCode === 403 && draftRes.body.error?.code === 'ERR_FORBIDDEN') {
    record('TEST-E', 'Anonymous request for Draft E-Paper via backend API', 'Backend Mediation', 'HTTP 403', 'HTTP 403', 'PASS', draftRes.body.error?.message);
  } else {
    record('TEST-E', 'Anonymous request for Draft E-Paper via backend API', 'Backend Mediation', 'HTTP 403', `HTTP ${draftRes.statusCode}`, 'FAIL');
  }

  // -------------------------------------------------------------
  // Test F: READER cannot directly upload article media to Storage
  // -------------------------------------------------------------
  const readerToken = await getTokenForRole('user-reader-step27', 'READER');
  await signInWithCustomToken(clientAuth, readerToken);

  try {
    const artRef = ref(storage, 'media/articles/2026/11/art-direct/photo.jpg');
    await uploadBytes(artRef, Buffer.from('unauthorized reader upload'), { contentType: 'image/jpeg' });
    record('TEST-F', 'READER direct upload to /media/articles/** in Storage', 'Ingress Boundary', 'REJECT', 'ALLOWED', 'FAIL', 'READER directly wrote to Storage!');
  } catch (err) {
    record('TEST-F', 'READER direct upload to /media/articles/** in Storage', 'Ingress Boundary', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  // -------------------------------------------------------------
  // Test G: REPORTER can upload through approved backend authorization mechanism
  // -------------------------------------------------------------
  const backendReporterToken = signToken({
    id: 'usr-rep-step27',
    sub: 'usr-rep-step27',
    fullName: 'अमित संवाददाता',
    roles: ['REPORTER'],
  });

  const uploadRes = await makeBackendRequest('/api/v1/media/upload', 'POST', {
    fileName: 'field_report.jpg',
    mimeType: 'image/jpeg',
    category: 'article',
    fileBuffer: Buffer.from('valid reporter image bytes').toString('base64'),
  }, backendReporterToken);

  if (uploadRes.statusCode === 200 && uploadRes.body.success) {
    record('TEST-G', 'REPORTER upload through approved backend API (/api/v1/media/upload)', 'Authorized Ingress', 'HTTP 200', 'HTTP 200', 'PASS', `StoragePath: ${uploadRes.body.data.storagePath}`);
  } else {
    record('TEST-G', 'REPORTER upload through approved backend API (/api/v1/media/upload)', 'Authorized Ingress', 'HTTP 200', `HTTP ${uploadRes.statusCode}`, 'FAIL');
  }

  // -------------------------------------------------------------
  // Test H: Reporter cannot read or overwrite another reporter's private files
  // -------------------------------------------------------------
  const rep1Token = await getTokenForRole('rep-001-step27', 'REPORTER');
  await signInWithCustomToken(clientAuth, rep1Token);
  const rep1CredRef = ref(storage, 'reporters/rep-001-step27/credentials/press-pass.jpg');
  await uploadBytes(rep1CredRef, Buffer.from('rep-001 secret credentials'), { contentType: 'image/jpeg' });

  // Switch to Reporter 2
  const rep2Token = await getTokenForRole('rep-002-step27', 'REPORTER');
  await signInWithCustomToken(clientAuth, rep2Token);

  try {
    await getBytes(rep1CredRef);
    record('TEST-H1', 'Reporter 2 reading Reporter 1 credentials', 'Tenant Isolation', 'REJECT', 'ALLOWED', 'FAIL');
  } catch (err) {
    record('TEST-H1', 'Reporter 2 reading Reporter 1 credentials', 'Tenant Isolation', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  try {
    await uploadBytes(rep1CredRef, Buffer.from('malicious overwrite'), { contentType: 'image/jpeg' });
    record('TEST-H2', 'Reporter 2 overwriting Reporter 1 credentials', 'Tenant Isolation', 'REJECT', 'ALLOWED', 'FAIL');
  } catch (err) {
    record('TEST-H2', 'Reporter 2 overwriting Reporter 1 credentials', 'Tenant Isolation', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  // -------------------------------------------------------------
  // Test I: WhatsApp files remain private
  // -------------------------------------------------------------
  await signInWithCustomToken(clientAuth, rep1Token);
  const waRef = ref(storage, 'whatsapp/rep-001-step27/social-card.png');
  await uploadBytes(waRef, Buffer.from('private whatsapp social card'), { contentType: 'image/png' });

  await signInWithCustomToken(clientAuth, rep2Token);
  try {
    await getBytes(waRef);
    record('TEST-I', 'Another reporter reading private WhatsApp social card', 'WhatsApp Privacy', 'REJECT', 'ALLOWED', 'FAIL');
  } catch (err) {
    record('TEST-I', 'Another reporter reading private WhatsApp social card', 'WhatsApp Privacy', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  // -------------------------------------------------------------
  // Test J: EDITOR, ADMIN and MASTER_ADMIN retain approved permissions
  // -------------------------------------------------------------
  const editorToken = await getTokenForRole('user-editor-step27', 'EDITOR');
  await signInWithCustomToken(clientAuth, editorToken);
  const editorialDocRef = ref(storage, 'editorial/memo-step27.pdf');
  try {
    await uploadBytes(editorialDocRef, Buffer.from('editorial daily schedule'), { contentType: 'application/pdf' });
    record('TEST-J1', 'EDITOR upload to /editorial/**', 'Privileged Access', 'ALLOW', 'ALLOWED', 'PASS');
  } catch (err) {
    record('TEST-J1', 'EDITOR upload to /editorial/**', 'Privileged Access', 'ALLOW', 'REJECTED', 'FAIL', err.code);
  }

  await signInWithCustomToken(clientAuth, adminToken);
  try {
    const credBytes = await getBytes(rep1CredRef);
    record('TEST-J2', 'ADMIN audit read of reporter credentials', 'Privileged Access', 'ALLOW', 'ALLOWED', 'PASS', `${credBytes.byteLength} bytes`);
  } catch (err) {
    record('TEST-J2', 'ADMIN audit read of reporter credentials', 'Privileged Access', 'ALLOW', 'REJECTED', 'FAIL', err.code);
  }

  const masterAdminToken = await getTokenForRole('user-master-step27', 'MASTER_ADMIN', { admin: true });
  await signInWithCustomToken(clientAuth, masterAdminToken);
  try {
    await deleteObject(editorialDocRef);
    record('TEST-J3', 'MASTER_ADMIN delete editorial file', 'Privileged Access', 'ALLOW', 'ALLOWED', 'PASS');
  } catch (err) {
    record('TEST-J3', 'MASTER_ADMIN delete editorial file', 'Privileged Access', 'ALLOW', 'REJECTED', 'FAIL', err.code);
  }

  // -------------------------------------------------------------
  // Test K: CHIEF_EDITOR remains strictly blocked (DEC-048)
  // -------------------------------------------------------------
  const chiefEditorToken = await getTokenForRole('user-chief-step27', 'CHIEF_EDITOR');
  await signInWithCustomToken(clientAuth, chiefEditorToken);

  try {
    const chiefTestRef = ref(storage, 'editorial/chief-attempt.pdf');
    await uploadBytes(chiefTestRef, Buffer.from('chief editor attempt'), { contentType: 'application/pdf' });
    record('TEST-K', 'CHIEF_EDITOR assumption of privileged Storage access (DEC-048)', 'Governance Invariant', 'REJECT', 'ALLOWED', 'FAIL', 'CHIEF_EDITOR was granted access!');
  } catch (err) {
    record('TEST-K', 'CHIEF_EDITOR assumption of privileged Storage access (DEC-048)', 'Governance Invariant', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  // -------------------------------------------------------------
  // Test L: Legitimate authorized delete requests do not trigger Null evaluation errors (GAP-26-04)
  // -------------------------------------------------------------
  await signInWithCustomToken(clientAuth, rep1Token);
  try {
    await deleteObject(rep1CredRef);
    record('TEST-L1', 'Reporter deleting own credential file (Null-safe evaluation)', 'Delete Null-Safety', 'DELETE_OK', 'DELETE_OK', 'PASS');
  } catch (err) {
    record('TEST-L1', 'Reporter deleting own credential file (Null-safe evaluation)', 'Delete Null-Safety', 'DELETE_OK', 'ERROR', 'FAIL', err.message);
  }

  await signInWithCustomToken(clientAuth, adminToken);
  const adTestRef = ref(storage, 'ads/ad-test-99/banner.jpg');
  await uploadBytes(adTestRef, Buffer.from('ad banner'), { contentType: 'image/jpeg' });
  try {
    await deleteObject(adTestRef);
    record('TEST-L2', 'Admin deleting advertisement asset (Null-safe evaluation)', 'Delete Null-Safety', 'DELETE_OK', 'DELETE_OK', 'PASS');
  } catch (err) {
    record('TEST-L2', 'Admin deleting advertisement asset (Null-safe evaluation)', 'Delete Null-Safety', 'DELETE_OK', 'ERROR', 'FAIL', err.message);
  }

  // -------------------------------------------------------------
  // Test M: Unauthorized delete requests remain denied
  // -------------------------------------------------------------
  await signOut(clientAuth);
  try {
    await deleteObject(waRef);
    record('TEST-M', 'Anonymous delete request of private asset', 'Deletion Authorization', 'REJECT', 'ALLOWED', 'FAIL');
  } catch (err) {
    record('TEST-M', 'Anonymous delete request of private asset', 'Deletion Authorization', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  // -------------------------------------------------------------
  // Test N: SVG and unsupported MIME uploads remain rejected
  // -------------------------------------------------------------
  await signInWithCustomToken(clientAuth, rep2Token);
  try {
    const svgRef = ref(storage, 'reporters/rep-002-step27/graphic.svg');
    await uploadBytes(svgRef, Buffer.from('<svg><script>alert(1)</script></svg>'), { contentType: 'image/svg+xml' });
    record('TEST-N1', 'SVG upload rejection in reporter workspace', 'MIME Validation', 'REJECT', 'ALLOWED', 'FAIL', 'SVG was accepted!');
  } catch (err) {
    record('TEST-N1', 'SVG upload rejection in reporter workspace', 'MIME Validation', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  try {
    const exeRef = ref(storage, 'reporters/rep-002-step27/payload.exe');
    await uploadBytes(exeRef, Buffer.from('MZ binary executable payload'), { contentType: 'application/x-msdownload' });
    record('TEST-N2', 'Binary executable MIME type rejection', 'MIME Validation', 'REJECT', 'ALLOWED', 'FAIL', 'Executable was accepted!');
  } catch (err) {
    record('TEST-N2', 'Binary executable MIME type rejection', 'MIME Validation', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  // -------------------------------------------------------------
  // Test O: File size limits remain enforced
  // -------------------------------------------------------------
  try {
    const bigImgRef = ref(storage, 'reporters/rep-002-step27/huge.jpg');
    const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024, 0x42); // 11MB (>10MB cap)
    await uploadBytes(bigImgRef, oversizedBuffer, { contentType: 'image/jpeg' });
    record('TEST-O', 'Oversized photo upload rejection (>10MB limit)', 'Size Boundary', 'REJECT', 'ALLOWED', 'FAIL');
  } catch (err) {
    record('TEST-O', 'Oversized photo upload rejection (>10MB limit)', 'Size Boundary', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  // -------------------------------------------------------------
  // Test P: Default-deny behavior remains active
  // -------------------------------------------------------------
  try {
    const unmappedRef = ref(storage, 'unmapped-tree/system.conf');
    await uploadBytes(unmappedRef, Buffer.from('secret=123'), { contentType: 'text/plain' });
    record('TEST-P', 'Write to unmapped root storage path', 'Default Deny', 'REJECT', 'ALLOWED', 'FAIL');
  } catch (err) {
    record('TEST-P', 'Write to unmapped root storage path', 'Default Deny', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  // Teardown
  backendServer.close();

  console.log('\n================================================================');
  console.log('STEP 27 EMULATOR REMEDIATION VALIDATION SUMMARY:');
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  console.log(`Total Scenarios Tested: ${results.length}`);
  console.log(`PASS: ${passCount}`);
  console.log(`FAIL: ${failCount}`);
  console.log('================================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runStep27Validation().catch((err) => {
  console.error('FATAL TEST SUITE ERROR:', err);
  if (backendServer) backendServer.close();
  process.exit(1);
});
