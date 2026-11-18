# BREAKING NEWS WALA — STEP 28 AUDIT REPORT
## PRODUCTION AUTHENTICATION & STORAGE AUTHORIZATION COMPATIBILITY AUDIT

**Document ID:** BNW-STEP28-AUDIT-2026-V1.0  
**Project:** BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)  
**Repository:** `breakingnewswala/BREAKING-NEWS-WALA`  
**Current Branch:** `step-21-remediation`  
**Commit Baseline:** `439ce2237ac1ce9d8cccabc0f4a070670d827e58`  
**Audit Date:** November 18, 2026  
**Status:** COMPLETE (Audit-Only Phase — Zero Source Code Modifications)  

---

## 1. BRANCH AND COMMIT BASELINE

- **Current Git Branch:** `step-21-remediation`
- **Head Commit Hash:** `439ce2237ac1ce9d8cccabc0f4a070670d827e58`
- **Preservation Check:** All 13 previously identified user-modified files remain 100% intact and untouched:
  - `.data/bnw_persistence.json`
  - `.data/bnw_persistence.json.bak`
  - `package-lock.json`
  - `package.json`
  - `src/screens/AdminControlScreen.tsx`
  - `src/screens/EpaperScreen.tsx`
  - `src/screens/ReporterDeskScreen.tsx`
  - `src/server/apiEngine.js`
  - `src/server/persistence/adapter.js`
  - `src/services/apiClient.ts`
  - `src/services/graphicRenderer.ts`
  - `src/types/index.ts`
  - `tests/backend-master-admin-auth.test.js`
  - `tsconfig.json`
- **Safety Constraints Honored:** Audit-only execution. No source code modified. No Git commits, pushes, merges, or production cloud deployments. No live Firebase rules or GCP IAM altered.

---

## 2. ACTUAL FIREBASE TOKEN CLAIM FINDINGS

An exhaustive audit of `src/firebase.ts`, `src/server/auth/firebaseAuthService.js`, `storage.rules`, and `firestore.rules` established the following facts regarding Firebase token claims in production:

### 2.1 Standard Firebase Authentication Identity Claims
When users authenticate in the client web application via Google Sign-In (`signInWithPopup(auth, googleProvider)` in `src/firebase.ts`), Google Identity / Firebase Authentication issues an ID token containing standard OpenID Connect / Firebase claims:
```json
{
  "iss": "https://securetoken.google.com/breaking-news-wala",
  "aud": "breaking-news-wala",
  "auth_time": 1795004299,
  "user_id": "81a8a8f4-57a5-4181-aa74-2ef4d34fbab7",
  "sub": "81a8a8f4-57a5-4181-aa74-2ef4d34fbab7",
  "iat": 1795004299,
  "exp": 1795007899,
  "email": "user@example.com",
  "email_verified": true,
  "name": "User Full Name",
  "picture": "https://lh3.googleusercontent.com/...",
  "firebase": {
    "identities": { "google.com": ["..."] },
    "sign_in_provider": "google.com"
  }
}
```

### 2.2 Absence of Custom Claims in Production
1. **Zero `setCustomUserClaims` Invocations**:
   - The entire codebase contains **zero** calls to `admin.auth().setCustomUserClaims()`.
   - No Cloud Function, webhook, or background worker sets custom claims on user creation or role elevation.
2. **Missing Claims in Real Production Tokens**:
   - Actual production ID tokens do **NOT** contain `role`, `roles`, or `admin` claims.
3. **Storage Rules Claim Dependency Mismatch**:
   - `storage.rules` defines:
     ```javascript
     function isPrivilegedRole() {
       return isAuthenticated() && (
         ('admin' in request.auth.token && request.auth.token.admin == true) ||
         ('role' in request.auth.token && request.auth.token.role in ['ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN', 'EDITOR']) ||
         ('roles' in request.auth.token && request.auth.token.roles is list && request.auth.token.roles.hasAny(['ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN', 'EDITOR']))
       );
     }
     ```
   - **Crucial Incompatibility:** Because production ID tokens lack these claims, `isPrivilegedRole()` evaluates to **`false`** for all direct browser-to-storage requests. Legitimate Editors and Administrators attempting to interact directly with `/editorial/**`, `/epaper/**`, or `/ads/**` via the client Storage SDK will be blocked with `storage/unauthorized`.

---

## 3. BACKEND RBAC MAPPING ARCHITECTURE

BREAKING NEWS WALA operates strictly on a **Server-Side Authoritative RBAC Architecture**:

```
[ Client Browser ] 
        │  (Bearer <Firebase_ID_Token>)
        ▼
[ Node.js API Gateway (apiEngine.js) ]
        │
        ├── 1. Cryptographic Header & Claim Validation (FirebaseAuthService.verifyIdToken)
        │
        └── 2. Authoritative Database Lookup (FirebaseAuthService.resolveAuthoritativeUser)
                    │
                    ▼
        [ Firestore / PostgreSQL: userDoc ]
                    │
                    ├── userDoc.roles: ['REPORTER'] or ['EDITOR'] or ['READER']
                    └── Master Admin Email Allowlist Check (MASTER_ADMIN_EMAILS)
```

- **Single Source of Truth for Roles:** User roles exist strictly in the database (`users/{uid}` in Firestore or `user_roles` in PostgreSQL).
- **Client Role Spoofing Prevented:** The server discards any client-supplied role header or request body attribute during authorization.
- **Architectural Divergence:** The backend resolves roles dynamically from the database, but Firebase Storage Rules have no access to the database.

---

## 4. STORAGE RULES COMPATIBILITY ASSESSMENT

| Storage Path | Defined Rule Condition | Production Compatibility Status | Operational Impact |
| :--- | :--- | :---: | :--- |
| `/media/articles/**` | Read: `true`<br>Write/Delete: `isPrivilegedRole()` | **COMPATIBLE VIA BACKEND** | Direct client writes are blocked (secure). Legitimate reporters upload via `POST /api/v1/media/upload`, where server checks role and writes via backend. |
| `/reporters/{userId}/credentials/**` | Read: `isOwner` or `isPrivileged`<br>Write: `isOwner && (image\|pdf)` | **PARTIAL MISMATCH** | UID owner can write. However, ordinary `READER` accounts own their UID and can write here directly (see Section 5). |
| `/reporters/{userId}/**` | Read: `isOwner` or `isPrivileged`<br>Write: `isOwner && validMedia` | **PARTIAL MISMATCH** | UID owner can write. Ordinary `READER` accounts can store files under `/reporters/{readerUid}/**`. |
| `/whatsapp/{reporterId}/**` | Read: `isOwner` or `isPrivileged`<br>Write: `isOwner && isValidImage` | **PARTIAL MISMATCH** | UID owner can write. Ordinary `READER` accounts can create cards under `/whatsapp/{readerUid}/**`. |
| `/epaper/**` | Read/Write/Delete: `isPrivilegedRole()` | **COMPATIBLE VIA BACKEND** | Direct client reads/writes are blocked (secure). Readers access published broadsheets strictly through the backend API. |
| `/editorial/**` | Read/Write/Delete: `isPrivilegedRole()` | **BLOCKED ON DIRECT CLIENT** | Editors calling client Storage SDK directly will fail because token lacks claims. Must be accessed via backend API. |
| `/ads/**` | Read: `true`<br>Write/Delete: `isPrivilegedRole()` | **BLOCKED ON DIRECT CLIENT** | Advertisers/Admins must upload ads via backend API (`/api/v1/epaper/ads/submissions`). |
| Default Deny | `allow read, write: if false;` | **100% COMPATIBLE** | Unmapped paths rejected across all callers. |

---

## 5. REPORTER DIRECTORY OWNERSHIP FINDINGS

### 5.1 The UID Ownership Illusion
In `storage.rules`:
```javascript
function isAuthenticated() { return request.auth != null; }
function isOwner(userId) { return isAuthenticated() && request.auth.uid == userId; }

match /reporters/{userId}/credentials/{fileName} {
  allow read: if isOwner(userId) || isPrivilegedRole();
  allow write: if isOwner(userId) && (isValidImage() || isValidPdf());
}
```

### 5.2 Empirical Evidence (`AUDIT-28-02`)
- An ordinary user Alice registers as a public reader (`role: 'READER'`).
- Alice signs in and receives UID `user-alice-reader`.
- Alice calls the Firebase Storage Emulator directly:
  `uploadBytes(ref(storage, 'reporters/user-alice-reader/credentials/fake-badge.jpg'))`
- **Result:** **ALLOWED**.
- **Explanation:** In Storage Rules, `request.auth.uid == 'user-alice-reader'` evaluates to **`true`**. Storage Rules do not know Alice is a `READER` because:
  1. The ID token has no `role` claim.
  2. Cloud Storage Rules Version 2 cannot query Cloud Firestore (`firestore.get()` does not exist in Storage rules).

### 5.3 Security Conclusion:
- Storage Rules provide **Tenant Isolation** (Alice cannot touch Bob's directory), but **Zero Role Authorization** (Storage Rules cannot restrict the `/reporters/` tree to accredited journalists).
- True role gating must be enforced at the backend API layer.

---

## 6. BACKEND UPLOAD AUTHORIZATION AUDIT (`POST /api/v1/media/upload`)

Inspection of `POST /api/v1/media/upload` in `src/server/apiEngine.js` confirmed robust server-side security controls:

1. **Authentication Enforcement:**
   - Unauthenticated callers immediately receive **HTTP 401 Unauthorized** (`ERR_UNAUTHORIZED`).
2. **Authoritative Role Verification:**
   - Evaluates `isReporterOrStaff(user)` using database-resolved roles.
   - If a plain `READER` uploads with `category: 'credentials'` or `category: 'article'`, the backend immediately returns **HTTP 403 Forbidden** (`ERR_FORBIDDEN`).
   - Plain `READER` is restricted exclusively to `category: 'avatar'`.
3. **Path Traversal Protection:**
   - Rejects `..`, `/`, `\`, and null bytes with **HTTP 400 Bad Request** (`ERR_INVALID_FILENAME`).
   - Sanitizes file names using regex `[^a-zA-Z0-9._-]`.
4. **Server-Generated Scoped Paths:**
   - Storage path is constructed strictly on the server:
     - Avatar: `avatars/${user.id}/${mediaId}-${fileName}`
     - Credentials: `reporters/${user.id}/credentials/${mediaId}-${fileName}`
     - Article: `media/articles/${year}/${month}/${mediaId}/${fileName}`
   - Clients cannot supply arbitrary storage paths or overwrite other users' files.
5. **MIME & Payload Validation:**
   - Strictly rejects SVGs (`image/svg+xml` or `.svg`) with **HTTP 400** (`ERR_UNSUPPORTED_MIME_TYPE`).
   - Inspects buffer magic bytes (MZ header for PE/DOS executables, ELF header for Linux binaries, and `<script`/`<html` tags), rejecting malicious payloads with **HTTP 400** (`ERR_MALICIOUS_FILE_DETECTED`).
   - Enforces per-category file size limits: 2MB (avatar), 10MB (photos), 25MB (audio/PDF), 100MB (video).
6. **Atomicity & Cleanup:**
   - Cleans up partial disk writes if file system writing or metadata persistence fails.

---

## 7. PRIVATE FILE & SIGNED URL AUDIT

### 7.1 E-Paper Broadsheet Confidentiality
- In `storage.rules`, `/epaper/**` is completely private (`isPrivilegedRole()`). Anonymous direct reads are rejected.
- In `src/server/apiEngine.js`, all public broadsheet endpoints (`/editions/:id/pages`, `/export/pdf`, `/export/page/:num/image`, `/export/metadata`) verify `if (edition.status !== 'PUBLISHED' && !isEpaperEditor(user)) return sendError(res, 403, 'ERR_FORBIDDEN')`.
- **Verdict:** Draft, pending review, and archived-private E-Paper broadsheets are 100% protected against public exposure.

### 7.2 Signed URL Implementation Reality
- **Current Code Status:** Google Cloud Storage V4 Signed URLs (`getSignedUrl`) are **not yet implemented** in `src/`.
- In `POST /api/v1/media/presigned-upload` (lines 2379-2393), the endpoint returns a mock string (`https://storage.breakingnewswala.com/${storageKey}`) without authentication.
- In local development, uploaded files are buffered to `dist/media/uploads/` and served statically via `server.js` under `/media/*`.
- **Finding:** In local development mode, files placed in `dist/media/uploads/` (including reporter credentials) can be retrieved by anyone who knows the URL (`/media/uploads/${mediaId}-${fileName}`). In production, credentials must be written directly to private Cloud Storage buckets rather than static public web directories.

### 7.3 WhatsApp Card Generation Endpoint Gap
- In `src/server/apiEngine.js` line 1637:
  `if (!user) return sendError(res, 401, 'ERR_UNAUTHORIZED');`
- While authentication is required, **role verification is missing**.
- An ordinary `READER` can call `POST /api/v1/epaper/whatsapp/generate` and successfully generate reporter-branded social cards, consuming the daily quota ledger.

---

## 8. TEST EVIDENCE SUMMARY

All audit findings were empirically verified using `tests/audit-step28-auth-storage-compatibility.js` running against live Firebase Emulators and the backend API:

```
[AUDIT-28-01] Production Firebase ID Token Claims
  Evidence: Token claims present: [auth_time, user_id, firebase, iat, exp, aud, iss, sub]. Custom claims present: false. Direct /editorial/ write with standard token: BLOCKED (storage/unauthorized).
  Risk: HIGH | Mismatch: Client-direct Storage calls cannot authenticate privileged roles without Custom Claims.

[AUDIT-28-02] Reporter Directory Authorization vs UID Ownership
  Evidence: Reader direct upload to /reporters/{ownUid}/credentials/**: ALLOWED. Direct upload to /whatsapp/{ownUid}/**: ALLOWED.
  Risk: MEDIUM | Mismatch: Storage Rules lack cross-service Firestore access and cannot distinguish whether a UID belongs to a REPORTER or a READER.

[AUDIT-28-03] Backend Upload API Authoritative Role Enforcement
  Evidence: Reader credentials upload: HTTP 403 (ERR_FORBIDDEN). Reporter credentials upload: HTTP 200 (success: true).
  Risk: LOW (SECURE) | Mismatch: None. Backend API successfully compensates for Storage Rules role-blindness.

[AUDIT-28-04] Media Presigned-Upload Route Authentication
  Evidence: Anonymous call to /api/v1/media/presigned-upload returns HTTP 200 (success: true, uploadUrl: https://storage.breakingnewswala.com/media/2026-11-18/asset-1795004299545-test.jpg).
  Risk: MEDIUM | Mismatch: Route exposes mock upload endpoints without checking caller identity.

[AUDIT-28-05] E-Paper Publication Access Mediation
  Evidence: Draft pages: HTTP 403. Published pages: HTTP 200 (12 pages). Draft PDF: HTTP 403. Published PDF: HTTP 200 (application/pdf).
  Risk: LOW (SECURE) | Mismatch: None. Backend publication-access architecture functions as intended.

[AUDIT-28-06] WhatsApp Card Generation Role Authorization
  Evidence: Reader call to /api/v1/epaper/whatsapp/generate: HTTP 201 (success: true, reporterId: user-alice-reader).
  Risk: MEDIUM | Mismatch: Missing role check (isReporterUser) on WhatsApp card generation endpoint.
```

---

## 9. CONFIRMED VULNERABILITIES & ARCHITECTURAL GAPS

1. **VULN-28-01 (High): Storage Rules Incompatible with Client-Direct Privileged Calls**
   - Direct browser calls to `/editorial/**`, `/epaper/**`, or `/ads/**` will fail for legitimate editors/admins because production tokens do not contain `request.auth.token.role`.
2. **VULN-28-02 (Medium): Storage Rules Cannot Gate Reporter Role (UID Ownership Only)**
   - Plain `READER` accounts can upload files directly to `/reporters/{readerUid}/**` in Cloud Storage by virtue of owning their UID.
3. **VULN-28-03 (Medium): Missing Authentication on Presigned-Upload Route**
   - `POST /api/v1/media/presigned-upload` accepts unauthenticated calls and returns upload metadata.
4. **VULN-28-04 (Medium): Missing Reporter Role Gating on WhatsApp Card Generation**
   - `POST /api/v1/epaper/whatsapp/generate` allows non-reporters (`READER`) to generate reporter cards.
5. **VULN-28-05 (Low / Local Dev): Local Media Upload Directory Statically Public**
   - `server.js` serves `dist/media/*` publicly, meaning locally uploaded credential files in development can be fetched without authentication if the file name is known.

---

## 10. REQUIRED REMEDIATIONS (ROADMAP FOR STEP 29)

1. **Enforce Backend-Only Ingress for Privileged & Reporter Paths**:
   - In `storage.rules`, deny all direct client writes to `/reporters/**` and `/whatsapp/**` unless the user possesses an explicit custom claim or, preferably, route all uploads through the authenticated backend API (`POST /api/v1/media/upload`), which already validates database roles.
2. **Secure `POST /api/v1/media/presigned-upload`**:
   - Add `if (!user) return sendError(res, 401, 'ERR_UNAUTHORIZED')` and verify `isReporterOrStaff(user)`.
3. **Gating on `POST /api/v1/epaper/whatsapp/generate`**:
   - Add `if (!isReporterUser(user)) return sendError(res, 403, 'ERR_FORBIDDEN', 'केवल अधिकृत संवाददाता ही व्हाट्सएप कार्ड बना सकते हैं।')`.
4. **Implement Production Cloud Storage Streaming**:
   - Transition `src/server/persistence/adapter.js` from local disk writing to direct Google Cloud Storage bucket streaming (`bucket.file(storagePath).save(buffer)`) using `firebase-admin/storage`.

---

## 11. FINAL VERDICT

### **CONDITIONALLY ACCEPTED**

- **Why Accepted:** The STEP 27 `storage.rules` successfully protects against public leaks (Draft E-Paper is 100% private, default-deny is active, MIME/size limits are strictly enforced, and cross-reporter tampering is impossible). Furthermore, the primary production media ingress pathway (`POST /api/v1/media/upload`) completely and securely enforces database-backed RBAC.
- **Why Conditional:** Direct browser-to-storage operations cannot authenticate privileged roles due to the absence of Firebase Auth Custom Claims, and Storage Rules cannot distinguish a `READER` from a `REPORTER` on UID-scoped paths. Gating must continue to be mediated by the backend API until Custom Claims or dedicated backend streaming is finalized.
