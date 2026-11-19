# BREAKING NEWS WALA — STEP 26 VALIDATION REPORT
## FIREBASE STORAGE RULES — REAL EMULATOR SECURITY VALIDATION

**Document ID:** BNW-STEP26-VAL-2026-V1.0  
**Project:** BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)  
**Repository:** `breakingnewswala/BREAKING-NEWS-WALA`  
**Current Branch:** `step-21-remediation`  
**Commit Baseline:** `439ce2237ac1ce9d8cccabc0f4a070670d827e58`  
**Audit & Validation Date:** November 18, 2026  
**Status:** COMPLETE (Validation-Only Audit)  

---

## 1. BRANCH AND COMMIT BASELINE

- **Current Git Branch:** `step-21-remediation`
- **Head Commit Hash:** `439ce2237ac1ce9d8cccabc0f4a070670d827e58`
- **Working Tree State:** All 13 previously identified user-modified files remain intact and preserved:
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
- **Safety Rule Compliance:** No Git commits, pushes, merges, or production cloud deployments were executed. Zero live Firebase or GCP infrastructure was altered.

---

## 2. ACTUAL AUTHENTICATION CLAIMS AND ROLE MAPPING

A thorough code audit of Firebase Authentication and server-side RBAC was conducted across `src/server/auth/firebaseAuthService.js`, `src/server/apiEngine.js`, `firestore.rules`, and `docs/14-Auth.md`.

### 2.1 The Authoritative Roles in the Codebase
| Role Name | Authority Level | Canonical Status | Notes |
| :--- | :---: | :---: | :--- |
| **`READER`** / `public_user` | Baseline Public | Confirmed | Standard registered citizen account. Read-only news access, bookmarks, coin balance. No upload privileges. |
| **`REPORTER`** | Field Journalist | Confirmed | Field stringer / district correspondent. Allowed draft creation, field photo/video upload, credential upload. |
| **`EDITOR`** / `sub_editor` | Editorial Staff | Confirmed | Newsroom editorial desk. Review incoming drafts, claim locks, revise content. |
| **`ADMIN`** | Platform Manager | Confirmed | Master geographic settings, ad management, API pool config, reporter accreditation. |
| **`MASTER_ADMIN`** | System Executive | Confirmed | Ultimate authority. Reserved strictly for verified emails (`breakingnewswala.com@gmail.com`, etc.) in `firebaseAuthService.js`. |
| **`SUPER_ADMIN`** | Technical Authority | Confirmed | Platform infrastructure management, vault secrets, security audit access. |
| **`CHIEF_EDITOR`** | Editorial Leadership | **PENDING APPROVAL (`DEC-048`)** | **Strictly blocked across the platform with `403 Forbidden` (`ERR_ROLE_PENDING_APPROVAL`) per master invariant `DEC-048`.** |

### 2.2 Custom Claims Reality & Token Mismatch
1. **Zero `setCustomUserClaims` Invocations**:
   - Analysis of the entire repository reveals that `admin.auth().setCustomUserClaims()` is **never called** in any application workflow.
   - When users authenticate on the client via `signInWithPopup(auth, googleProvider)` in `src/firebase.ts`, Google Firebase Authentication issues standard ID tokens containing only standard profile fields: `uid`, `email`, `email_verified`, `name`, `picture`.
   - In standard client-direct tokens, `request.auth.token.role` and `request.auth.token.roles` are **`undefined`**.
2. **Server-Side Authoritative Resolution**:
   - The platform relies on `resolveAuthoritativeUser(uid, adapter)` in `src/server/auth/firebaseAuthService.js`, looking up user roles from the database (`userDoc.roles` / `userDoc.role`).
   - Consequently, any Firebase Storage Security Rule that relies on `request.auth.token.role` or `request.auth.token.roles` will evaluate to `false` for standard client-direct requests unless:
     a) Custom claims are explicitly minted and synchronized using `firebase-admin`, or
     b) All uploads/downloads are proxied through the shared backend API (`/api/v1/media/upload`), which resolves authoritative database roles server-side.
3. **DEC-048 Invariant Conflict in `storage.rules`**:
   - `storage.rules` line 16 defines:
     `request.auth.token.role in ['ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN', 'CHIEF_EDITOR', 'EDITOR']`
   - Inclusion of `'CHIEF_EDITOR'` directly conflicts with `DEC-048`, which legally and architecturally reserves `ROLE_CHIEF_EDITOR` as **Pending Approval** and mandates that it be blocked with `403 Forbidden`.

---

## 3. STORAGE RULES REVIEW (`storage.rules`)

Evaluation of `storage.rules` authored in STEP 25 revealed critical structural strengths as well as three significant security gaps:

### Strengths:
1. **Strict Version 2 & Default Deny**:
   - Fallback `match /{allPaths=**} { allow read, write: if false; }` successfully denies all unmatched requests.
2. **MIME & File Size Bounds**:
   - Prohibits SVGs (`image/(jpeg|png|webp)` regex).
   - Rejects files exceeding 10MB (images), 25MB (audio/PDF), and 100MB (video).
3. **Reporter Tenant Isolation**:
   - Credentials in `/reporters/{userId}/credentials/*` and private assets in `/reporters/{userId}/*` are strictly isolated to `isOwner(userId)` and privileged roles.
4. **WhatsApp Private Social Cards**:
   - `/whatsapp/{reporterId}/*` is private to `isOwner(reporterId)` and editorial staff.

### Discovered Security Gaps:
1. **Public E-Paper Leak (`allow read: if true;`)**:
   - Line 74 exposes `/epaper/{editionId}/{fileName}` to the public without checking whether the edition is published, draft, or pending review.
2. **READER Direct Storage Write (`allow write: if isAuthenticated()`)**:
   - Lines 48 and 55 allow any authenticated user to write to `/media/articles/**`. Plain `READER` accounts can bypass backend API role checks and write directly to Cloud Storage.
3. **Delete Runtime EvaluationException**:
   - Calling `deleteObject()` on storage paths triggers a rules runtime `Null value error` because `request.resource` is `null` during `delete` operations, but `isValidMedia()` accesses `request.resource.contentType` without a `request.resource != null` guard.

---

## 4. EMULATOR CONFIGURATION & STARTUP RESULT

### 4.1 Prerequisites & Tooling Discovery
- **Runtime Environment:** Node.js v26.13.1, Java Temurin 17.0.21+9 on Windows x64.
- **Firebase Tools Compatibility:**
  - Modern `firebase-tools` v15.36.0 dropped support for JDK versions prior to 21 (`Error: firebase-tools no longer supports Java version before 21`).
  - Cached `firebase-tools@13.35.1` was identified in the local npx cache (`C:\Users\aa\AppData\Local\npm-cache\_npx\872b751b2f16d338`), which provides full, native compatibility with the environment's JDK 17.
- **Port Mapping:**
  - Storage Emulator: `127.0.0.1:9199`
  - Authentication Emulator: `127.0.0.1:9099`

### 4.2 Emulator Startup Execution Log
```
Command: npx.cmd firebase-tools@13.35.1 emulators:exec --only storage,auth "node tests/test-storage-emulator-validation-step26.js"

Output:
!  emulators: You are not currently authenticated so some features may not work correctly.
i  emulators: Starting emulators: auth, storage
i  Running script: node tests/test-storage-emulator-validation-step26.js
+  Script exited successfully (code 0)
i  emulators: Shutting down emulators.
i  auth: Stopping Authentication Emulator
i  storage: Stopping Storage Emulator
i  hub: Stopping emulator hub
```
The Firebase Storage Emulator and Authentication Emulator started, served requests, evaluated rules, and shut down cleanly.

---

## 5. TEST-BY-TEST RESULTS (CASES A THROUGH K)

The test suite in `tests/test-storage-emulator-validation-step26.js` evaluated 23 live scenarios against the running emulators:

| Test ID | Scenario Description | Tested Role / Auth | Expected | Actual Result | Verdict | Details / Error Code |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **TEST-A1** | Unauthenticated upload to `/editorial/**` | Anonymous | REJECT | **REJECTED** | **PASS** | `storage/unauthorized` |
| **TEST-A2** | Unauthenticated upload to `/reporters/{uid}/credentials/**` | Anonymous | REJECT | **REJECTED** | **PASS** | `storage/unauthorized` |
| **TEST-B1** | READER upload to `/editorial/**` | `READER` | REJECT | **REJECTED** | **PASS** | `storage/unauthorized` |
| **TEST-B2** | READER direct upload to `/media/articles/**` | `READER` | REJECT | **ALLOWED** | **GAP** | `storage.rules` line 48 allows any `isAuthenticated()` user to write to `/media/articles/**` |
| **TEST-C1** | REPORTER upload to own credentials | `REPORTER` (`rep-001`) | ALLOW | **ALLOWED** | **PASS** | `isOwner(userId)` passed |
| **TEST-C2** | REPORTER read own credentials | `REPORTER` (`rep-001`) | ALLOW | **ALLOWED** | **PASS** | 24 bytes retrieved |
| **TEST-D1** | REPORTER read another reporter's credentials | `REPORTER` (`rep-001`) | REJECT | **REJECTED** | **PASS** | `storage/unauthorized` |
| **TEST-D2** | REPORTER read another reporter's WhatsApp cards | `REPORTER` (`rep-001`) | REJECT | **REJECTED** | **PASS** | `storage/unauthorized` |
| **TEST-E1** | EDITOR upload to `/editorial/**` | `EDITOR` | ALLOW | **ALLOWED** | **PASS** | `isPrivilegedRole()` passed |
| **TEST-E2** | ADMIN read reporter credentials | `ADMIN` | ALLOW | **ALLOWED** | **PASS** | `isPrivilegedRole()` passed (24 bytes) |
| **TEST-E3** | MASTER_ADMIN delete editorial file | `MASTER_ADMIN` | ALLOW | **ALLOWED** | **PASS** | `isPrivilegedRole()` passed |
| **TEST-F1** | Unauthenticated read of draft E-Paper file | Anonymous | REJECT | **ALLOWED** | **GAP** | `storage.rules` line 74 defines `allow read: if true;`, leaking drafts to the public |
| **TEST-G1** | Cross-service Firestore publication verification | N/A | ENFORCE | **UNSUPPORTED** | **GAP** | Firebase Storage Rules cannot call `firestore.get()`. Access must be gated server-side |
| **TEST-H1** | Unauthenticated upload to `/ads/**` | Anonymous | REJECT | **REJECTED** | **PASS** | `storage/unauthorized` |
| **TEST-H2** | Unauthenticated upload to `/media/articles/**` | Anonymous | REJECT | **REJECTED** | **PASS** | `storage/unauthorized` |
| **TEST-I1** | SVG upload rejection (XSS vector) | `REPORTER` | REJECT | **REJECTED** | **PASS** | `storage/unauthorized` (SVG regex excluded) |
| **TEST-I2** | Oversized photo upload rejection (>10MB) | `REPORTER` | REJECT | **REJECTED** | **PASS** | `storage/unauthorized` (11MB payload blocked) |
| **TEST-I3** | Unsupported binary MIME type rejection | `REPORTER` | REJECT | **REJECTED** | **PASS** | `storage/unauthorized` (`application/x-msdownload` blocked) |
| **TEST-J1** | Write to unmatched root path (`/random-unmatched/**`) | `REPORTER` | REJECT | **REJECTED** | **PASS** | `storage/unauthorized` (Default deny) |
| **TEST-J2** | Read from unmatched root path (`/random-unmatched/**`) | `REPORTER` | REJECT | **REJECTED** | **PASS** | `storage/unauthorized` (Default deny) |
| **TEST-K1** | Reporter 2 deleting Reporter 1's credential | `REPORTER` (`rep-002`) | REJECT | **REJECTED** | **PASS** | `storage/unauthorized` |
| **TEST-K2** | Reporter 2 overwriting Reporter 1's file | `REPORTER` (`rep-002`) | REJECT | **REJECTED** | **PASS** | `storage/unauthorized` |
| **TEST-K3** | Non-privileged user deleting article media | `REPORTER` (`rep-002`) | REJECT | **REJECTED** | **PASS** | `storage/unauthorized` (Only privileged can delete) |

### Validation Scorecard:
- **Total Scenarios Evaluated:** 23
- **Passed Cleanly:** 20 (87.0%)
- **Confirmed Security Gaps:** 3 (13.0%)
- **Unexpected Failures:** 0

---

## 6. CONFIRMED VULNERABILITIES & POLICY MISMATCHES

### GAP-26-01: Public Exposure of Draft E-Paper Editions
- **Location:** `storage.rules` line 74:
  ```javascript
  match /epaper/{editionId}/{fileName} {
    allow read: if true;
  ```
- **Vulnerability:** Unauthenticated public users can directly download draft, pending review, or unreleased e-paper broadsheets and prepress PDFs simply by enumerating or obtaining the edition ID.
- **Severity:** **HIGH** (Editorial Confidentiality Breach).

### GAP-26-02: Authenticated READER Direct Ingress to Article Media
- **Location:** `storage.rules` lines 48 & 55:
  ```javascript
  match /media/articles/{allPaths=**} {
    allow write: if isAuthenticated() && (isValidMedia() || isValidPdf());
  ```
- **Vulnerability:** Any registered `READER` who signs in can call Firebase Storage directly and upload arbitrary files into the public `/media/articles/**` storage tree, bypassing the backend API's `isReporterOrStaff` authorization check.
- **Severity:** **MEDIUM** (Bypass of Least Privilege Role Boundaries).

### GAP-26-03: Storage Rules Cannot Verify Publication Status in Firestore
- **Location:** Architectural limitation in Firebase Storage Rules Version 2.
- **Vulnerability:** Unlike Firestore Security Rules, Firebase Storage Rules have no access to Firestore database documents (`firestore.get()` does not exist in Cloud Storage rules). Storage rules cannot verify whether an edition's status in Firestore is `'PUBLISHED'` vs `'DRAFT'`.
- **Severity:** **HIGH** (Architectural Invariant).

### GAP-26-04: Rule Evaluation NullPointerException on Delete Operations
- **Location:** `storage.rules` lines 21-43 (`isValidImage`, `isValidVideo`, `isValidAudio`, `isValidPdf`):
  During HTTP DELETE requests, `request.resource` is `null`. Any reference to `request.resource.contentType` without `request.resource != null` throws an unhandled runtime `Null value error` inside the emulator rules engine.
- **Severity:** **LOW / RESILIENCE** (Unhandled Runtime Exception).

### GAP-26-05: Invariant DEC-048 Conflict (`ROLE_CHIEF_EDITOR`)
- **Location:** `storage.rules` line 16 includes `'CHIEF_EDITOR'` as an approved privileged role.
- **Vulnerability:** Violates master governance decision `DEC-048` which requires `ROLE_CHIEF_EDITOR` to remain Pending Approval and blocked across all services.
- **Severity:** **MEDIUM** (Governance Invariant Mismatch).

---

## 7. REQUIRED CORRECTIVE ACTIONS

Prior to accepting Firebase Storage Rules for production or staging deployment, the following remediations must be implemented:

1. **Lock Down `/epaper/**` to Privileged Roles Only**:
   - Change `allow read: if true;` to `allow read: if isPrivilegedRole();`.
   - Public readership of published e-paper editions must be served strictly via the backend API engine (`GET /api/v1/epaper/editions/:id/broadsheet` or `/export/pdf`), which validates `edition.status === 'PUBLISHED'` against the authoritative database before streaming or issuing short-lived signed URLs.

2. **Restrict Media Ingress to Authorized Roles**:
   - Author a helper function:
     ```javascript
     function isReporterOrPrivileged() {
       return isAuthenticated() && (
         isPrivilegedRole() ||
         ('role' in request.auth.token && request.auth.token.role == 'REPORTER') ||
         ('roles' in request.auth.token && request.auth.token.roles is list && request.auth.token.roles.hasAny(['REPORTER', 'TRUSTED_REPORTER']))
       );
     }
     ```
   - Change `allow write: if isAuthenticated() && ...;` to `allow write: if isReporterOrPrivileged() && ...;`.

3. **Add `request.resource != null` Guard to Helper Functions**:
   ```javascript
   function isValidImage() {
     return request.resource != null
       && request.resource.contentType.matches('image/(jpeg|png|webp)')
       && request.resource.size <= 10 * 1024 * 1024;
   }
   ```

4. **Remove `CHIEF_EDITOR` from `isPrivilegedRole()`**:
   - Purge `'CHIEF_EDITOR'` from line 16 to comply strictly with `DEC-048`.

---

## 8. ACCEPTANCE VERDICT

### Formal Determination: **CONDITIONALLY ACCEPTED WITH MANDATORY REMEDIATION REQUIRED (PROCEED TO STEP 27)**

- **Baseline Architecture:** **ACCEPTED**. The version 2 syntax, default-deny structure, MIME whitelisting, SVG blocking, size caps, and reporter isolation mechanisms are sound and empirically proven on the real Firebase Storage Emulator.
- **Production Safety:** **NOT YET PRODUCTION READY**. The storage rules cannot be pushed to live Firebase infrastructure in their current state due to `GAP-26-01` (Draft E-Paper public leak), `GAP-26-02` (READER media upload bypass), and `GAP-26-05` (`DEC-048` conflict).
- **Next Step:** Proceed to **STEP 27** to apply the corrective actions to `storage.rules`, re-validate against the emulator, and confirm 100% security coverage before committing or pushing.
