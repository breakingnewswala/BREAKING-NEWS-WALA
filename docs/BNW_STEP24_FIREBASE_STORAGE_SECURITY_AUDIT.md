# BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
# STEP 24 — FIREBASE STORAGE SECURITY AUDIT & PERMISSION VALIDATION REPORT

**Project:** BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)  
**Document ID:** `BNW-DOC-EPAPER-STEP24-STORAGE-AUDIT-2026-V1.0`  
**Classification:** Authoritative Cloud Storage Security, Access Control & Ingress Vulnerability Audit  
**Phase:** STEP 24 Storage Security & Permission Validation  
**Date:** 2026-11-18  
**Audit Mode:** Audit-Only (Zero Code Modifications, Zero Deployments)  
**Final Verdict:** **NOT SECURE — CRITICAL FINDINGS**  

---

## 1. Executive Summary

An exhaustive, evidence-based security audit was conducted on the Firebase Storage architecture, upload ingress pipelines, client and server-side authorization gates, and storage rules configuration for the BREAKING NEWS WALA platform.

The audit revealed critical structural vulnerabilities and architectural mismatches:
1. **Critical Missing Configuration (P0)**: `firebase.json` declares `"storage": { "rules": "storage.rules" }`, but `storage.rules` does **NOT exist on disk**. Attempting to start the Firebase Storage Emulator (`firebase emulators:exec --only storage`) or deploy rules via the Firebase CLI crashes with `Error: File not found: storage.rules`.
2. **Unauthenticated Media Ingress (P1)**: The server API endpoint `POST /api/v1/media/upload` accepts file uploads up to 50MB from **anonymous, unauthenticated clients**, writing decoded binary files directly to local server disk (`dist/media/uploads/`) with `uploaderId: 'anonymous'`. This represents an unauthenticated disk exhaustion and denial-of-service vector.
3. **Ephemeral Disk Persistence in Containerized Hosting (P1)**: The web application writes uploaded media to local filesystem paths (`dist/media/uploads/*`). On Firebase App Hosting (Google Cloud Run containers), local disk writes are ephemeral and will vanish whenever instances scale down, restart, or fail over, breaking image URLs.
4. **Permissive SVG Mime Type (P2)**: `image/svg+xml` is accepted without server-side XML/DOM sanitization, opening stored XSS risks if SVGs containing `<script>` tags are viewed in the browser.

---

## 2. Repository Safety and Git Status

- **Active Branch:** `step-21-remediation`
- **Current HEAD Commit:** `439ce2237ac1ce9d8cccabc0f4a070670d827e58` (`fix(epaper): complete step 21 production readiness remediation`)
- **Base Branch:** `main` (synchronized with `origin/main` at `e40e835bedaf2f523002ad1f9ed92c5b69886974`)
- **Preserved Working Tree:** All 13 user-modified files and all untracked test harnesses, component files, and documentation reports were 100% preserved. Zero files were reset, stashed, cleaned, or staged.
- **Git Operations Performed:** 0 commits, 0 pushes, 0 branch switches, 0 resets.

---

## 3. Storage Configuration Findings

### 3.1 Firebase Project & Configuration Analysis

| Configuration File | Inspected Key / Entry | Documented Value | Audit Finding |
| :--- | :--- | :--- | :--- |
| `firebase.json` (Line 13) | `storage.rules` | `"storage.rules"` | **CRITICAL DEFECT**: File does not exist anywhere in the repository. |
| `firebase.json` (Line 24) | `emulators.storage.port` | `9199` | Configured, but emulator startup crashes due to missing `storage.rules`. |
| `firebase-applet-config.json` | `storageBucket` | `breaking-news-wala.firebasestorage.app` | Canonical Google Cloud Storage bucket provisioned for the project. |
| `apphosting.yaml` | `FIREBASE_STORAGE_BUCKET` | `breaking-news-wala.firebasestorage.app` | Environment variable injected at runtime into Cloud Run container. |
| `src/firebase.ts` | Frontend Firebase SDK | Imports `app`, `auth`, `firestore` | **Zero storage imports**. Frontend does not initialize or use `@firebase/storage`. |
| `src/services/apiClient.ts` | `media.uploadMedia()` | Invokes `POST /media/upload` | Sends base64 payload to Node.js backend; does not call Firebase Storage directly. |

---

## 4. Storage Bucket and Upload-Path Inventory

The platform documents and references several logical storage paths across `docs/16-Storage.md`, `src/server/apiEngine.js`, and database persistence layers:

| Logical Storage Domain | Relative Storage Path Pattern | Storage Target | Target MIME Types | Max Size Cap | Intended Access |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Article Media (Ingress)** | `media/articles/YYYY/MM/{mediaId}/{fileName}` | Firebase Storage / Local Disk | `image/jpeg`, `image/png`, `image/webp` | 10 MB | Public (once article published) |
| **Reporter Raw Uploads** | `reporters/{reporterId}/uploads/{mediaId}_{fileName}` | Firebase Storage Vault | Images, Audio (`audio/mpeg`), Video | 50 MB | Private to reporter & assigned editors |
| **Reporter Credentials** | `reporters/{reporterId}/credentials/{fileName}` | Private Cloud Vault | `image/jpeg`, `image/png`, `application/pdf` | 10 MB | **Strictly Confidential** (Reporter + Admin) |
| **E-Paper 300 DPI PDF** | In-Memory Buffer $\rightarrow$ Download Response | Ephemeral API Stream | `application/pdf` | ~25 MB | Public (if Published); Editor/Admin (Draft) |
| **E-Paper Page Images** | In-Memory Buffer $\rightarrow$ Inline Stream | Ephemeral API Stream | `image/png` (3886x6142 px) | ~24 MB | Public (if Published); Editor/Admin (Draft) |
| **WhatsApp Cards** | `whatsapp/{reporterId}/{timestamp}.png` | Firebase Storage / Adapter Map | `image/png` (1:1 / 4:5) | 5 MB | Shared via WhatsApp; Scoped to Reporter |
| **Ad Creatives** | `ads/submissions/{adId}/{fileName}` | Media Ingress / CDN | `image/jpeg`, `image/png`, `image/webp` | 15 MB | Public (when ad is active) |
| **Local Disk Fallback** | `dist/media/uploads/{mediaId}-{fileName}` | Local Container Filesystem | Unchecked base64 writes | 50 MB | **Public URL Exposure** (`/media/uploads/*`) |

---

## 5. Role-Based Permission Matrix

Evidence-based evaluation across platform user roles (`READER`, `REPORTER`, `EDITOR`, `ADMIN`, `MASTER_ADMIN`):

| Asset Category | Who Can Upload? | Who Can Read? | Who Can Update? | Who Can Delete? | Public Access? | Enforcing Boundary |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **1. Public News Images** | REPORTER, EDITOR, ADMIN | Anyone (Public) once article is published | Authoring REPORTER (draft only), EDITOR, ADMIN | ADMIN, MASTER_ADMIN | **YES** | Server API (`/api/v1/articles/*`) |
| **2. Reporter Profile Photos** | Owner REPORTER, ADMIN | Anyone (Byline card) | Owner REPORTER, ADMIN | Owner REPORTER, ADMIN | **YES** | Server API (`/api/v1/users/profile`) |
| **3. Reporter-Uploaded Media** | REPORTER, EDITOR | Owner REPORTER, Assigned EDITOR, ADMIN | Owner REPORTER (prior to review) | ADMIN, MASTER_ADMIN | **NO** (Until Published) | Server API & Storage Path |
| **4. E-Paper Page Exports** | HighResExportEngine (System) | Public (if PUBLISHED); Editorial only (if Draft) | EDITOR, ADMIN | ADMIN, MASTER_ADMIN | **CONDITIONAL** | Server API (`/export/pdf`, `/export/page/...`) |
| **5. WhatsApp Edition Images** | REPORTER (Quota: 20/day), ADMIN | Generating REPORTER, Recipients | Immutable | ADMIN, MASTER_ADMIN | **SHARED** | Server API (`/api/v1/epaper/whatsapp/*`) |
| **6. Advertisement Creatives** | REPORTER (Submission), ADMIN | Public (when active); Editorial (in review) | ADMIN, EDITOR | ADMIN, MASTER_ADMIN | **YES** (When Active) | Server API (`/api/v1/epaper/ads/*`) |
| **7. Private Editorial Docs** | Owner REPORTER, HR/ADMIN | Owner REPORTER, ADMIN, MASTER_ADMIN | Owner REPORTER, ADMIN | MASTER_ADMIN | **STRICTLY NO** | API & Storage Rules (`/credentials/`) |
| **8. User-Generated Media** | READER, PUBLIC_CITIZEN | Moderation Desk (EDITOR, ADMIN) | Owner (prior to submit) | ADMIN, MASTER_ADMIN | **NO** (Moderated) | Server API |

---

## 6. Security Vulnerability Register (P0–P3)

| Finding ID | Severity | Category | Title | Affected File & Lines | Impact Analysis |
| :--- | :---: | :---: | :--- | :--- | :--- |
| **FINDING-24-01** | **P0** | Build / Deploy Blocker | Missing `storage.rules` File Prevents Storage Deployment & Emulator Startup | `firebase.json:13`<br>`(storage.rules missing)` | **BLOCKING**: Firebase CLI commands (`firebase deploy --only storage` and `firebase emulators:exec --only storage`) crash immediately with `Error: File not found: storage.rules`. |
| **FINDING-24-02** | **P1** | Ingress Security | Unauthenticated Media Ingress Endpoint (`POST /api/v1/media/upload`) | `src/server/apiEngine.js:2210-2283` | **CRITICAL VULNERABILITY**: Endpoint does not check `if (!user)`. Anonymous clients can upload 50MB files that are written straight to local server disk with `uploaderId: 'anonymous'`. |
| **FINDING-24-03** | **P1** | Cloud Architecture | Ephemeral Local Disk Storage in Container Runtime | `src/server/apiEngine.js:2262-2266` | **DATA LOSS RISK**: Uploaded files written to `dist/media/uploads/` will be destroyed whenever Cloud Run / App Hosting containers restart, scale to 0, or redeploy. |
| **FINDING-24-04** | **P2** | Resource Governance | Inconsistent Image Size Boundary (50MB vs 10MB Architecture Cap) | `src/server/apiEngine.js:2232`<br>`docs/16-Storage.md:314` | High-memory overhead: Single 50MB image uploads can cause node buffer pressure and worker denial of service. |
| **FINDING-24-05** | **P2** | Injection Security | SVG Upload Allowed Without XML / DOM Script Sanitization | `src/server/apiEngine.js:2222-2224` | Potential Stored XSS: If an attacker uploads an SVG with embedded `<script>` or malicious `onload` handlers, viewing the raw SVG executes scripts in user browsers. |
| **FINDING-24-06** | **P3** | Security Hardening | Static Media Served Without `X-Content-Type-Options: nosniff` | `server.js:80-120` | Content-sniffing vulnerability if malicious files bypass MIME detection. |

---

## 7. Emulator and Test Execution Results

### 7.1 Storage Emulator Startup Test
Command Executed:
```powershell
npx.cmd -y --package=firebase-tools@13.35.1 firebase emulators:exec --only storage "node -e 'console.log(\"TEST\")'"
```
**Empirical Result:**
```text
i  emulators: Starting emulators: storage
i  emulators: Shutting down emulators.
i  hub: Stopping emulator hub

Error: File not found: D:\BREAKING-NEWS-WALA-main\storage.rules
```
- **Exit Code:** 1
- **Conclusion:** Firebase Storage Emulator cannot be used by automated test suites until `storage.rules` is authored on disk.

### 7.2 Backend Firebase Integration Test Suite (`tests/backend-firebase-integration-015.test.js`)
Command Executed:
```powershell
node --test tests/backend-firebase-integration-015.test.js
```
**Empirical Result on Suite 3 (Test 3.3):**
```text
✖ 3.3 storage.rules exists and defines authenticated write & 10MB limit (12.4865ms)
  AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:
    assert.ok(fs.existsSync(path.join(ROOT_DIR, 'storage.rules')))
```
- **Conclusion:** Existing test suite independently catches and proves the absence of `storage.rules`.

---

## 8. Missing Configuration and Rules

1. **`storage.rules` (Missing)**:
   - Must be created at repository root to satisfy `firebase.json` and enable Storage emulator execution.
2. **Authentication Middleware on `/api/v1/media/upload` (Missing)**:
   - Must enforce `const user = await resolveRequestUser(req, adapter); if (!user) return sendError(res, 401, 'ERR_UNAUTHORIZED', ...);`.
3. **Cloud Storage Binary Persistence Adapter (Missing)**:
   - When running in production (`NODE_ENV === 'production'`), binary uploads must stream to Google Cloud Storage bucket (`breaking-news-wala.firebasestorage.app`) or S3/R2 rather than writing to local `dist/media/uploads/`.

---

## 9. Recommended Secure Storage Rules Design

The following rules specification is designed based on `docs/16-Storage.md` and the verified test expectations in `tests/backend-firebase-integration-015.test.js` and `tests/backend-emulator-acceptance.test.js`:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isPrivilegedRole() {
      return isAuthenticated() && (
        request.auth.token.role in ['ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN', 'CHIEF_EDITOR', 'EDITOR'] ||
        request.auth.token.email in ['breakingnewswala.com@gmail.com', 'riturajtomarorchha@gmail.com', 'live.bnwtv@gmail.com']
      );
    }

    function isValidImage() {
      return request.resource.contentType.matches('image/(jpeg|png|webp)')
        && request.resource.size <= 10 * 1024 * 1024; // 10 MB Image Cap
    }

    function isValidVideo() {
      return request.resource.contentType.matches('video/(mp4|webm)')
        && request.resource.size <= 100 * 1024 * 1024; // 100 MB Video Cap
    }

    function isValidAudio() {
      return request.resource.contentType.matches('audio/(mpeg|wav|mp4)')
        && request.resource.size <= 25 * 1024 * 1024; // 25 MB Audio Cap
    }

    function isValidPdf() {
      return request.resource.contentType == 'application/pdf'
        && request.resource.size <= 25 * 1024 * 1024; // 25 MB PDF Cap
    }

    // 1. Public Article Media (Photos, Video Clips, Audio Dispatches)
    match /media/articles/{year}/{month}/{articleId}/{fileName} {
      allow read: if true; // Public read once referenced
      allow write: if isAuthenticated() && (isValidImage() || isValidVideo() || isValidAudio());
      allow delete: if isPrivilegedRole();
    }

    // 2. Reporter Private Credentials & Press Identity Documents
    match /reporters/{userId}/credentials/{fileName} {
      allow read: if isOwner(userId) || isPrivilegedRole();
      allow write: if isOwner(userId) && (isValidImage() || isValidPdf());
      allow delete: if isPrivilegedRole();
    }

    // 3. E-Paper Published Broadsheets & Prepress PDF Exports
    match /epaper/{editionId}/{fileName} {
      allow read: if true;
      allow write: if isPrivilegedRole() && (isValidPdf() || isValidImage());
      allow delete: if isPrivilegedRole();
    }

    // 4. WhatsApp Edition Graphic Cards
    match /whatsapp/{reporterId}/{fileName} {
      allow read: if true; // Delivered to WhatsApp recipients
      allow write: if isOwner(reporterId) && isValidImage();
      allow delete: if isPrivilegedRole();
    }

    // 5. Broadsheet & Web Advertisement Creatives
    match /ads/{adId}/{fileName} {
      allow read: if true;
      allow write: if isAuthenticated() && isValidImage();
      allow delete: if isPrivilegedRole();
    }

    // Deny all other unmatched paths
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 10. Exact Files Requiring Changes (Future Remediation)

1. `storage.rules` *(To be created)* — Codify the secure Firebase Storage rules specification.
2. `src/server/apiEngine.js` *(Line 2210)* — Enforce authentication on `POST /api/v1/media/upload`, tighten file size bounds (10MB for images), sanitize SVG uploads, and eliminate unauthenticated anonymous disk writes.
3. `server.js` *(Lines 80-120)* — Add `X-Content-Type-Options: nosniff` and secure headers to static media routes.

---

## 11. Remediation Plan in Priority Order

1. **Step 1 (P0): Author `storage.rules`**: Create the missing root `storage.rules` file containing the strict 10MB image cap, role checks, and path isolation.
2. **Step 2 (P0): Verify Storage Emulator & Integration Tests**: Run `firebase emulators:exec --only storage` and verify that test 3.3 in `tests/backend-firebase-integration-015.test.js` passes.
3. **Step 3 (P1): Secure `/api/v1/media/upload`**: Inject `resolveRequestUser(req, adapter)` check at the top of the handler to reject unauthenticated callers with HTTP 401.
4. **Step 4 (P1): Implement Cloud Storage Ingress**: Integrate Google Cloud Storage client in production so media binaries are stored in `breaking-news-wala.firebasestorage.app` rather than ephemeral local disk.
5. **Step 5 (P2): Tighten Mime & Size Validations**: Reject SVGs containing `<script>` tags and enforce per-MIME size caps.

---

## 12. Actions NOT Performed

In accordance with strict safety invariants:
- **No files were created or modified** (including `storage.rules`).
- **No Firebase rules or cloud resources were deployed.**
- **No Git commits, pushes, branches, or stashes were performed.**
- **No secrets, tokens, or private credentials were exposed.**
- **All 13 user-modified files and untracked artifacts remain intact.**

---

## 13. Concluding Verdict

# **NOT SECURE — CRITICAL FINDINGS**

While the core E-Paper editorial engines, distributed Firestore OCC transactions, and server-side RBAC token verification are robustly implemented, the Firebase Storage subsystem is **NOT SECURE** due to:
1. Complete absence of `storage.rules` causing build/emulator crashes.
2. Unauthenticated media upload ingress on `/api/v1/media/upload` writing directly to server disk.
3. Reliance on ephemeral local disk in Cloud Run container hosting.

Remediation must be performed and verified before deploying media storage to staging or production.
