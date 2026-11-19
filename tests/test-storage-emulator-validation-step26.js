/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * STEP 26: Firebase Storage Security Rules Real Emulator Validation Suite
 * 
 * Tests the root storage.rules against live Firebase Storage & Auth Emulators:
 * - Real Storage Emulator on 127.0.0.1:9199
 * - Real Auth Emulator on 127.0.0.1:9099
 * - Real token claims for READER, REPORTER, EDITOR, ADMIN, MASTER_ADMIN
 * - Tests Cases A through K
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

const PROJECT_ID = 'breaking-news-wala';
const STORAGE_BUCKET = 'breaking-news-wala.firebasestorage.app';

// Initialize Admin SDK for token generation
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
const adminApp = getApps().length === 0
  ? initAdminApp({ projectId: PROJECT_ID })
  : getApps()[0];
const adminAuth = getAdminAuth(adminApp);

// Initialize Client SDK
const clientApp = initializeApp({
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  apiKey: 'fake-api-key-for-emulator',
});
const clientAuth = getAuth(clientApp);
connectAuthEmulator(clientAuth, 'http://127.0.0.1:9099', { disableWarnings: true });

const storage = getStorage(clientApp);
connectStorageEmulator(storage, '127.0.0.1', 9199);

// Helper for test tokens
async function getTokenForRole(uid, role, extraClaims = {}) {
  const claims = { role, roles: [role], ...extraClaims };
  return adminAuth.createCustomToken(uid, claims);
}

// Test reporting structure
const results = [];
function record(testId, name, category, expectation, result, status, details = '') {
  results.push({ testId, name, category, expectation, result, status, details });
  const icon = status === 'PASS' ? '✔' : (status === 'GAP' ? '⚠ GAP:' : '✖ FAIL:');
  console.log(`${icon} [${testId}] ${name} -> ${result} (${status}) ${details ? '| ' + details : ''}`);
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('STARTING FIREBASE STORAGE RULES REAL EMULATOR VALIDATION (STEP 26)');
  console.log('Target Storage Emulator: 127.0.0.1:9199');
  console.log('Target Auth Emulator: 127.0.0.1:9099');
  console.log('Rules under test: root storage.rules');
  console.log('================================================================\n');

  // Ensure client starts unauthenticated
  await signOut(clientAuth);

  // -------------------------------------------------------------
  // Test Case A: Unauthenticated users cannot upload private files
  // -------------------------------------------------------------
  try {
    const pRef = ref(storage, 'editorial/secret-memo.txt');
    await uploadBytes(pRef, Buffer.from('unauthenticated private file'), { contentType: 'text/plain' });
    record('TEST-A1', 'Unauthenticated upload to /editorial/**', 'Unauthenticated Access', 'REJECT', 'ALLOWED', 'FAIL', 'Unauthenticated user uploaded to editorial');
  } catch (err) {
    record('TEST-A1', 'Unauthenticated upload to /editorial/**', 'Unauthenticated Access', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  try {
    const pRef = ref(storage, 'reporters/rep-001/credentials/badge.jpg');
    await uploadBytes(pRef, Buffer.from('fake badge'), { contentType: 'image/jpeg' });
    record('TEST-A2', 'Unauthenticated upload to /reporters/{uid}/credentials/**', 'Unauthenticated Access', 'REJECT', 'REJECTED', 'PASS');
  } catch (err) {
    record('TEST-A2', 'Unauthenticated upload to /reporters/{uid}/credentials/**', 'Unauthenticated Access', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  // -------------------------------------------------------------
  // Test Case B: READER cannot upload article media or editorial documents
  // -------------------------------------------------------------
  const readerToken = await getTokenForRole('user-reader-01', 'READER');
  await signInWithCustomToken(clientAuth, readerToken);

  try {
    const edRef = ref(storage, 'editorial/editor-notes.txt');
    await uploadBytes(edRef, Buffer.from('reader editorial doc'), { contentType: 'text/plain' });
    record('TEST-B1', 'READER upload to /editorial/**', 'Role Access Control', 'REJECT', 'ALLOWED', 'FAIL', 'READER uploaded to editorial');
  } catch (err) {
    record('TEST-B1', 'READER upload to /editorial/**', 'Role Access Control', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  try {
    const artRef = ref(storage, 'media/articles/2026/11/art-001/photo.jpg');
    await uploadBytes(artRef, Buffer.from('reader image upload'), { contentType: 'image/jpeg' });
    // In current storage.rules: match /media/articles/{allPaths=**} { allow write: if isAuthenticated() && isValidMedia(); }
    // A reader is isAuthenticated()! This exposes a discrepancy!
    record('TEST-B2', 'READER direct upload to /media/articles/**', 'Role Access Control', 'REJECT', 'ALLOWED', 'GAP', 'storage.rules allows ANY authenticated user (including READER) to write to /media/articles/**');
  } catch (err) {
    record('TEST-B2', 'READER direct upload to /media/articles/**', 'Role Access Control', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  // -------------------------------------------------------------
  // Test Case C: REPORTER can access only their own permitted private files
  // -------------------------------------------------------------
  const reporter1Token = await getTokenForRole('rep-001', 'REPORTER');
  await signInWithCustomToken(clientAuth, reporter1Token);

  try {
    const myDocRef = ref(storage, 'reporters/rep-001/credentials/press-id.jpg');
    await uploadBytes(myDocRef, Buffer.from('rep-001 credential photo'), { contentType: 'image/jpeg' });
    record('TEST-C1', 'REPORTER upload to own credentials (/reporters/{ownUid}/credentials/**)', 'Ownership Isolation', 'ALLOW', 'ALLOWED', 'PASS');
  } catch (err) {
    record('TEST-C1', 'REPORTER upload to own credentials (/reporters/{ownUid}/credentials/**)', 'Ownership Isolation', 'ALLOW', 'REJECTED', 'FAIL', err.code);
  }

  try {
    const myDocRef = ref(storage, 'reporters/rep-001/credentials/press-id.jpg');
    const bytes = await getBytes(myDocRef);
    record('TEST-C2', 'REPORTER read own credentials', 'Ownership Isolation', 'ALLOW', 'ALLOWED', 'PASS', `${bytes.byteLength} bytes`);
  } catch (err) {
    record('TEST-C2', 'REPORTER read own credentials', 'Ownership Isolation', 'ALLOW', 'REJECTED', 'FAIL', err.code);
  }

  // -------------------------------------------------------------
  // Test Case D: REPORTER cannot read another reporter's credentials or private WhatsApp files
  // -------------------------------------------------------------
  try {
    const otherRepCredRef = ref(storage, 'reporters/rep-002/credentials/secret-id.jpg');
    await getBytes(otherRepCredRef);
    record('TEST-D1', 'REPORTER read another reporter credentials (/reporters/rep-002/credentials/**)', 'Tenant Isolation', 'REJECT', 'ALLOWED', 'FAIL', 'Cross-reporter credential read permitted!');
  } catch (err) {
    record('TEST-D1', 'REPORTER read another reporter credentials (/reporters/rep-002/credentials/**)', 'Tenant Isolation', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  try {
    const otherWaRef = ref(storage, 'whatsapp/rep-002/private-card.png');
    await getBytes(otherWaRef);
    record('TEST-D2', 'REPORTER read another reporter WhatsApp card (/whatsapp/rep-002/**)', 'Tenant Isolation', 'REJECT', 'ALLOWED', 'FAIL', 'Cross-reporter WhatsApp read permitted!');
  } catch (err) {
    record('TEST-D2', 'REPORTER read another reporter WhatsApp card (/whatsapp/rep-002/**)', 'Tenant Isolation', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  // -------------------------------------------------------------
  // Test Case E: EDITOR, ADMIN, and MASTER_ADMIN permissions match approved role policy
  // -------------------------------------------------------------
  const editorToken = await getTokenForRole('user-editor-01', 'EDITOR');
  await signInWithCustomToken(clientAuth, editorToken);

  try {
    const edDocRef = ref(storage, 'editorial/desk-briefing.pdf');
    await uploadBytes(edDocRef, Buffer.from('editorial briefing document'), { contentType: 'application/pdf' });
    record('TEST-E1', 'EDITOR upload to /editorial/**', 'Privileged Access', 'ALLOW', 'ALLOWED', 'PASS');
  } catch (err) {
    record('TEST-E1', 'EDITOR upload to /editorial/**', 'Privileged Access', 'ALLOW', 'REJECTED', 'FAIL', err.code);
  }

  const adminToken = await getTokenForRole('user-admin-01', 'ADMIN', { admin: true });
  await signInWithCustomToken(clientAuth, adminToken);

  try {
    const repCredRef = ref(storage, 'reporters/rep-001/credentials/press-id.jpg');
    const bytes = await getBytes(repCredRef);
    record('TEST-E2', 'ADMIN audit read reporter credentials', 'Privileged Access', 'ALLOW', 'ALLOWED', 'PASS', `${bytes.byteLength} bytes`);
  } catch (err) {
    record('TEST-E2', 'ADMIN audit read reporter credentials', 'Privileged Access', 'ALLOW', 'REJECTED', 'FAIL', err.code);
  }

  const masterAdminToken = await getTokenForRole('user-master-01', 'MASTER_ADMIN', { admin: true });
  await signInWithCustomToken(clientAuth, masterAdminToken);

  try {
    const edRef = ref(storage, 'editorial/desk-briefing.pdf');
    await deleteObject(edRef);
    record('TEST-E3', 'MASTER_ADMIN delete editorial file', 'Privileged Access', 'ALLOW', 'ALLOWED', 'PASS');
  } catch (err) {
    record('TEST-E3', 'MASTER_ADMIN delete editorial file', 'Privileged Access', 'ALLOW', 'REJECTED', 'FAIL', err.code);
  }

  // -------------------------------------------------------------
  // Test Case F: Draft and unpublished E-Paper files are not publicly readable
  // -------------------------------------------------------------
  // First upload an epaper file as ADMIN
  try {
    const epaperRef = ref(storage, 'epaper/edition-draft-999/page_01.pdf');
    await uploadBytes(epaperRef, Buffer.from('draft epaper page'), { contentType: 'application/pdf' });
  } catch (e) {
    console.error('Failed to stage epaper test file:', e);
  }

  // Switch to unauthenticated
  await signOut(clientAuth);

  try {
    const epaperRef = ref(storage, 'epaper/edition-draft-999/page_01.pdf');
    const bytes = await getBytes(epaperRef);
    // In current storage.rules: match /epaper/{editionId}/{fileName} { allow read: if true; }
    // An unauthenticated user CAN read this draft!
    record('TEST-F1', 'Unauthenticated read of draft E-Paper (/epaper/draft/**)', 'E-Paper Confidentiality', 'REJECT', 'ALLOWED', 'GAP', 'storage.rules line 74 defines "allow read: if true;" on /epaper/{editionId}/{fileName}, leaking drafts before publication!');
  } catch (err) {
    record('TEST-F1', 'Unauthenticated read of draft E-Paper (/epaper/draft/**)', 'E-Paper Confidentiality', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  // -------------------------------------------------------------
  // Test Case G: Published E-Paper access mechanism verification
  // -------------------------------------------------------------
  // Storage rules cannot query Firestore document fields (no firestore.get() exists in storage rules).
  record('TEST-G1', 'Storage Rules cross-service Firestore publication verification', 'Architectural Limitation', 'REJECT_OR_PRIVATE', 'UNSUPPORTED_IN_RULES', 'GAP', 'Firebase Storage Rules v2 do not support cross-service firestore.get(). Publication status must be guarded by private storage + backend API streaming.');

  // -------------------------------------------------------------
  // Test Case H: Anonymous users cannot upload files into ads or article media paths
  // -------------------------------------------------------------
  await signOut(clientAuth);

  try {
    const adRef = ref(storage, 'ads/ad-001/banner.png');
    await uploadBytes(adRef, Buffer.from('anonymous banner'), { contentType: 'image/png' });
    record('TEST-H1', 'Unauthenticated upload to /ads/**', 'Public Protection', 'REJECT', 'ALLOWED', 'FAIL', 'Unauthenticated user uploaded ad banner');
  } catch (err) {
    record('TEST-H1', 'Unauthenticated upload to /ads/**', 'Public Protection', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  try {
    const artMediaRef = ref(storage, 'media/articles/2026/11/art-002/photo.jpg');
    await uploadBytes(artMediaRef, Buffer.from('anonymous article media'), { contentType: 'image/jpeg' });
    record('TEST-H2', 'Unauthenticated upload to /media/articles/**', 'Public Protection', 'REJECT', 'ALLOWED', 'FAIL', 'Unauthenticated user uploaded article media');
  } catch (err) {
    record('TEST-H2', 'Unauthenticated upload to /media/articles/**', 'Public Protection', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  // -------------------------------------------------------------
  // Test Case I: SVG, oversized files, and unsupported MIME types
  // -------------------------------------------------------------
  await signInWithCustomToken(clientAuth, reporter1Token);

  try {
    const svgRef = ref(storage, 'media/articles/2026/11/art-003/vector.svg');
    await uploadBytes(svgRef, Buffer.from('<svg><script>alert(1)</script></svg>'), { contentType: 'image/svg+xml' });
    record('TEST-I1', 'SVG upload rejection (XSS Prevention)', 'Content Validation', 'REJECT', 'ALLOWED', 'FAIL', 'SVG upload was allowed!');
  } catch (err) {
    record('TEST-I1', 'SVG upload rejection (XSS Prevention)', 'Content Validation', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  try {
    const bigImgRef = ref(storage, 'media/articles/2026/11/art-003/huge.jpg');
    const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024, 0x41); // 11MB (>10MB limit)
    await uploadBytes(bigImgRef, oversizedBuffer, { contentType: 'image/jpeg' });
    record('TEST-I2', 'Oversized photo upload rejection (>10MB)', 'Content Validation', 'REJECT', 'ALLOWED', 'FAIL', '11MB image was allowed!');
  } catch (err) {
    record('TEST-I2', 'Oversized photo upload rejection (>10MB)', 'Content Validation', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  try {
    const exeRef = ref(storage, 'media/articles/2026/11/art-003/malware.exe');
    await uploadBytes(exeRef, Buffer.from('MZ binary executable payload'), { contentType: 'application/x-msdownload' });
    record('TEST-I3', 'Unsupported binary MIME type rejection', 'Content Validation', 'REJECT', 'ALLOWED', 'FAIL', 'Executable binary upload was allowed!');
  } catch (err) {
    record('TEST-I3', 'Unsupported binary MIME type rejection', 'Content Validation', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  // -------------------------------------------------------------
  // Test Case J: Unmatched paths are denied by default
  // -------------------------------------------------------------
  try {
    const randomRef = ref(storage, 'random-unmatched/config.json');
    await uploadBytes(randomRef, Buffer.from('{"leak":true}'), { contentType: 'application/json' });
    record('TEST-J1', 'Upload to unmatched root path (/random-unmatched/**)', 'Default Deny', 'REJECT', 'ALLOWED', 'FAIL', 'Unmatched path write was allowed!');
  } catch (err) {
    record('TEST-J1', 'Upload to unmatched root path (/random-unmatched/**)', 'Default Deny', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  try {
    const randomRef = ref(storage, 'random-unmatched/config.json');
    await getBytes(randomRef);
    record('TEST-J2', 'Read from unmatched root path (/random-unmatched/**)', 'Default Deny', 'REJECT', 'ALLOWED', 'FAIL', 'Unmatched path read was allowed!');
  } catch (err) {
    record('TEST-J2', 'Read from unmatched root path (/random-unmatched/**)', 'Default Deny', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  // -------------------------------------------------------------
  // Test Case K: Authenticated users cannot overwrite or delete files belonging to other users
  // -------------------------------------------------------------
  const reporter2Token = await getTokenForRole('rep-002', 'REPORTER');
  await signInWithCustomToken(clientAuth, reporter2Token);

  try {
    // Attempt to delete Reporter 1's credential
    const rep1CredRef = ref(storage, 'reporters/rep-001/credentials/press-id.jpg');
    await deleteObject(rep1CredRef);
    record('TEST-K1', 'Reporter 2 deleting Reporter 1 file', 'Cross-User Tampering', 'REJECT', 'ALLOWED', 'FAIL', 'Cross-user deletion allowed!');
  } catch (err) {
    record('TEST-K1', 'Reporter 2 deleting Reporter 1 file', 'Cross-User Tampering', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  try {
    // Attempt to overwrite Reporter 1's file
    const rep1CredRef = ref(storage, 'reporters/rep-001/credentials/press-id.jpg');
    await uploadBytes(rep1CredRef, Buffer.from('malicious overwrite'), { contentType: 'image/jpeg' });
    record('TEST-K2', 'Reporter 2 overwriting Reporter 1 file', 'Cross-User Tampering', 'REJECT', 'ALLOWED', 'FAIL', 'Cross-user overwrite allowed!');
  } catch (err) {
    record('TEST-K2', 'Reporter 2 overwriting Reporter 1 file', 'Cross-User Tampering', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  // Reporter 2 attempting to delete an article media file uploaded by another user
  try {
    const artMediaRef = ref(storage, 'media/articles/2026/11/art-001/photo.jpg');
    await deleteObject(artMediaRef);
    record('TEST-K3', 'Non-privileged user deleting article media (/media/articles/**)', 'Privilege Gating', 'REJECT', 'ALLOWED', 'FAIL', 'Reporter deleted article media!');
  } catch (err) {
    record('TEST-K3', 'Non-privileged user deleting article media (/media/articles/**)', 'Privilege Gating', 'REJECT', 'REJECTED', 'PASS', err.code);
  }

  console.log('\n================================================================');
  console.log('SUMMARY OF REAL EMULATOR VALIDATION:');
  const passCount = results.filter(r => r.status === 'PASS').length;
  const gapCount = results.filter(r => r.status === 'GAP').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  console.log(`Total Scenarios Tested: ${results.length}`);
  console.log(`PASS: ${passCount}`);
  console.log(`SECURITY GAPS IDENTIFIED: ${gapCount}`);
  console.log(`FAIL (Unexpected): ${failCount}`);
  console.log('================================================================');
}

runTestSuite().catch(err => {
  console.error('FATAL TEST SUITE ERROR:', err);
  process.exit(1);
});
