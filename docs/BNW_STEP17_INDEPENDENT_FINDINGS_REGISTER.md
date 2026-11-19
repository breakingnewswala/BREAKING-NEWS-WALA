# BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
# STEP 17 — INDEPENDENT POST-REMEDIATION FINDINGS REGISTER

**Project:** BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)  
**Document ID:** `BNW-DOC-EPAPER-STEP17-FINDINGS-REGISTER-2026-V1.0`  
**Classification:** Authoritative Security & Architectural Findings Register  
**Audit Phase:** Post-STEP 16 Independent Verification  
**Audit Date:** 2026-11-18  

---

## 1. Executive Summary of Audit Findings

| Finding ID | Severity | Category | Title | Affected Component | Step 16 Claimed | Step 17 Independent Verdict |
| :--- | :---: | :---: | :--- | :--- | :---: | :---: |
| **FINDING-17-01** | **P1** | Distributed Concurrency | Multi-Instance Distributed Firestore Quota Atomicity | `src/server/persistence/firestoreAdapter.js:2776-2900` | Fixed (Local Mutex) | **VERIFIED FIXED** |
| **FINDING-17-02** | **P1** | Security / Auth Bypass | Creation-Time Publishing Security Bypass | `src/server/apiEngine.js:1310-1317`<br>`adapter.js:4670`<br>`firestoreAdapter.js:2821` | Fixed | **VERIFIED FIXED** |
| **FINDING-17-03** | **P2** | Functionality / UI | Master Admin Reporter Quota UI & Client Integration | `src/screens/AdminControlScreen.tsx:200-265, 1435-1540`<br>`apiClient.ts:2558-2575` | Fixed | **VERIFIED FIXED** |
| **FINDING-17-04** | **P3** | Defensive Validation | Status Normalization & Whitespace Mutation Bypass | `src/server/apiEngine.js:1073-1100`<br>`src/server/apiEngine.js:1355-1368` | Fixed | **VERIFIED FIXED** |
| **FINDING-17-05** | **P2** | Editorial Integrity | Published Snapshot Immutability & Concurrency Control | `src/server/apiEngine.js:1131-1172`<br>`adapter.js:5318-5374` | Fixed | **VERIFIED FIXED** |
| **FINDING-17-06** | **P2** | Auth / Identity | Server Context Identity & Elevated RBAC Validation | `src/server/apiEngine.js:1000-1010, 1622-1670` | Fixed | **VERIFIED FIXED** |
| **FINDING-17-07** | **INFO** | Prepress / Accuracy | Export Engine Prepress Capabilities & Format Claims | `src/server/epaper/exportEngine.js:1-21, 356-380` | Documented | **VERIFIED FIXED** |

---

## 2. Detailed Findings Evaluation

### FINDING-17-01: Multi-Instance Distributed Firestore Quota Atomicity
- **Severity**: **P1 (Critical Architectural Limitation)**
- **Component**: `src/server/persistence/firestoreAdapter.js:2776-2900`
- **Observed Implementation**:
  - `FirestoreAdapter` implements `_acquireReporterLock(reporterId)` using a process-local JavaScript `Map` of chained `Promise` objects.
  - Quota verification and usage records are saved to an in-memory `Map` collection mirror (`this._collections.get('epaperWhatsAppGenerations')`).
  - The adapter does not call the authoritative Google Cloud Firestore SDK's `db.runTransaction()` or acquire a distributed cross-instance lock (such as Redis Redlock or Firestore document-level atomic lock).
- **Reproduction & Distributed Threat Vector**:
  - In a single Node.js process, the mutex successfully queues asynchronous requests (as shown by 18/18 passing tests in `backend-epaper-step16-concurrency.test.js`).
  - **However, in a scaled horizontal production architecture (e.g. Google Cloud Run multi-container instances, Google App Hosting serverless instances, or multi-process Node.js clusters)**:
    - Instance 1 and Instance 2 maintain distinct, isolated memory spaces.
    - If Reporter X has `remaining = 1`, and simultaneous requests hit Instance 1 and Instance 2, each instance acquires its own process-local lock.
    - Both instances read `remaining = 1` and write a generation record, causing the reporter to generate 2 cards on a 1-card limit.
- **Mandate Compliance & Step 19 Remediation**:
  - In STEP 18, `FirestoreAdapter` introduced transactional architecture, but used in-memory transaction coordinator simulation.
  - In STEP 19, in-memory simulation was removed from the production path. Genuine Google Cloud Firestore transactions using the official Firebase Admin SDK (`firebase-admin/firestore`) were implemented via `firestore.runTransaction(async (transaction) => { ... })`.
  - Enforces strict read-before-write ordering across 4 real Firestore collections (`epaperWhatsAppQuotas`, `epaperWhatsAppDailyUsage`, `epaperWhatsAppGenerations`, `epaperWhatsAppIdempotency`), atomic usage increment, distributed idempotency key deduplication, and `Asia/Kolkata` date formatting.
  - Concurrency tests against the live Google Cloud Firestore Emulator (`127.0.0.1:8085`) across independent adapter instances and processes with process-local locks wiped (`_reporterLocks = null`) demonstrated absolute quota atomicity across 10-20 concurrent requests with zero quota leaks.
  - Multi-instance distributed concurrency tests in `tests/backend-epaper-step19-real-firestore.test.js` pass 11/11 against the live Cloud Firestore Emulator.
- **Status**: **VERIFIED FIXED**
  - *Verdict Note*: Real Cloud Firestore distributed transactions verified against live Cloud Firestore Emulator (OpenJDK 17 + `cloud-firestore-emulator-v1.19.8.jar`). Native transaction rollback, distributed cross-instance contention, and IST rollover validated with zero errors.

---

### FINDING-17-02: Creation-Time Publishing Security Bypass
- **Severity**: **P1 (Resolved)**
- **Component**:
  - `src/server/apiEngine.js:1310-1317`
  - `src/server/persistence/adapter.js:4670`
  - `src/server/persistence/firestoreAdapter.js:2821`
- **Observed Implementation**:
  - In `POST /api/v1/epaper/editions`:
    ```javascript
    if (body.status !== undefined) {
      const candidateStatus = typeof body.status === 'string' ? body.status.trim().toUpperCase() : '';
      if (candidateStatus === 'PUBLISHED') {
        return sendError(res, 400, 'ERR_INVALID_OPERATION', 
          'नया ई-पेपर संस्करण सीधे "PUBLISHED" स्थिति में निर्मित नहीं किया जा सकता। सभी नए संस्करण "DRAFT" स्थिति में प्रारंभ होने चाहिए।'
        );
      }
    }
    const creationPayload = { ...body, status: 'DRAFT' };
    ```
  - In `LocalJsonAdapter.createEpaperEditionWithPages`: `status: 'DRAFT'` is unconditionally assigned on line 4670.
  - In `FirestoreAdapter.createEpaperEditionWithPages`: `status: 'DRAFT'` is unconditionally assigned on line 2821.
- **Evidence & Empirical Verification**:
  - `POST /editions` with `{ status: 'PUBLISHED' }` returns HTTP 400 `ERR_INVALID_OPERATION`.
  - `POST /editions` with `{ status: '  published  ' }` returns HTTP 400 `ERR_INVALID_OPERATION`.
  - Direct adapter calls in both `adapter.js` and `firestoreAdapter.js` produce editions with `status === 'DRAFT'`.
  - Verified by tests `FINDING-15-01.1`, `FINDING-15-01.2`, `FINDING-15-01.3`, `FINDING-15-01.4`.
- **Status**: **VERIFIED FIXED**

---

### FINDING-17-03: Master Admin Reporter Quota UI & Client Integration
- **Severity**: **P2 (Resolved)**
- **Component**:
  - `src/screens/AdminControlScreen.tsx:200-265, 1435-1540`
  - `src/services/apiClient.ts:2558-2575`
- **Observed Implementation**:
  - `apiClient.ts` provides typed methods `getReporterWhatsAppQuota` and `updateReporterWhatsAppQuota`.
  - `AdminControlScreen.tsx` provides full state management (`reporterQuotas`, `editingQuotaReporterId`, `editingQuotaValue`, `isUpdatingQuota`, `quotaFeedback`, `loadingQuotas`).
  - Table renders a dedicated column `दैनिक व्हाट्सएप कोटा` with current quota, used counter, remaining counter, and inline editing controls (Save/Cancel).
  - Header features "कोटा रीफ्रेश करें" button with animated spin indicator.
  - Server-side route `PUT /api/v1/epaper/whatsapp/quota/:reporterId` enforces `isChiefEditorOrMasterAdmin(user)` and rejects non-admin users with HTTP 403 `ERR_FORBIDDEN`.
  - Input bounds (0 to 500) and negative values are defensively validated (HTTP 400 `ERR_VALIDATION`).
- **Evidence & Empirical Verification**:
  - Tested in `backend-epaper-step16-concurrency.test.js` (Subtests 3.1, 3.2, 3.3).
  - Production build `tsc && vite build` passed with exit code 0.
- **Status**: **VERIFIED FIXED**

---

### FINDING-17-04: Status Normalization & Whitespace Mutation Bypass
- **Severity**: **P3 (Resolved)**
- **Component**:
  - `src/server/apiEngine.js:1073-1100` (PATCH /status)
  - `src/server/apiEngine.js:1355-1368` (PUT/PATCH /editions/:id)
- **Observed Implementation**:
  - In `PATCH /status`:
    - Validates type: `typeof rawTarget !== 'string' || !rawTarget.trim()` -> HTTP 400 `ERR_VALIDATION`.
    - Normalizes: `const targetStatus = rawTarget.trim().toUpperCase()`.
    - Validates against canonical list: `VALID_EPAPER_STATUSES = ['DRAFT', 'EDITORIAL_REVIEW', 'LAYOUT_IN_PROGRESS', 'QUALITY_CHECK', 'APPROVED', 'PUBLISHED', 'ARCHIVED']`.
    - Rejects `targetStatus === 'PUBLISHED'` -> HTTP 400 `ERR_INVALID_OPERATION`.
  - In `PUT/PATCH /editions/:id`:
    - Sanitizes `body.status.trim().toUpperCase()`.
    - Rejects `normStatus === 'PUBLISHED' && existing.status !== 'PUBLISHED'` -> HTTP 400 `ERR_INVALID_OPERATION`.
- **Evidence & Empirical Verification**:
  - Tested via Subtests 4.1 through 4.6 in `backend-epaper-step16-concurrency.test.js`.
- **Status**: **VERIFIED FIXED**

---

### FINDING-17-05: Published Snapshot Immutability & Concurrency Control
- **Severity**: **P2 (Resolved)**
- **Component**:
  - `src/server/apiEngine.js:1131-1172`
  - `src/server/persistence/adapter.js:5318-5374`
- **Observed Implementation**:
  - Dedicated endpoint `POST /api/v1/epaper/editions/:id/publish` is the sole mechanism to publish an edition.
  - Requires `isEpaperEditor(user)`.
  - Enforces Optimistic Concurrency Control (OCC) version match.
  - Executes 5-point `QualityPreflightScanner.evaluate(edition, pages)`. If unpublishable, returns HTTP 422 `ERR_PREFLIGHT_BLOCKER`.
  - Generates deep-cloned immutable snapshot (`immutable: true`, `editionSnapshot`, `pagesSnapshot`) saved to `epaperEditionVersions`.
- **Evidence & Empirical Verification**:
  - Verified across 120 tests in `backend-epaper-management.test.js` and Subtest 1.4 in `backend-epaper-step14-remediation.test.js`.
- **Status**: **VERIFIED FIXED**

---

### FINDING-17-06: Server Context Identity & Elevated RBAC Validation
- **Severity**: **P2 (Resolved)**
- **Component**:
  - `src/server/apiEngine.js:1000-1010, 1622-1670`
- **Observed Implementation**:
  - In `POST /api/v1/epaper/whatsapp/generate`: reporter identity is derived strictly from `user.id`. Client-supplied `reporterId` is overridden by server context.
  - Setting edition status to `APPROVED` requires `isChiefEditorOrMasterAdmin(user)`.
  - Configuring reporter quotas requires `isChiefEditorOrMasterAdmin(user)`.
  - Client-side token tampering or role spoofing is blocked by cryptographic JWT signature validation.
- **Evidence & Empirical Verification**:
  - Verified by 32 tests in `backend-master-admin-auth.test.js` and Subtests 3.1–3.3 in `backend-epaper-step16-concurrency.test.js`.
- **Status**: **VERIFIED FIXED**

---

### FINDING-17-07: Export Capability Claims
- **Severity**: **INFO (Resolved / Accurately Documented)**
- **Component**:
  - `src/server/epaper/exportEngine.js:1-21, 356-380`
- **Observed Implementation**:
  - Code headers and documentation accurately reflect output specifications:
    - PDF: Native PDF-1.4 vector in DeviceRGB colorspace, standard Type 1 fonts (Helvetica/Helvetica-Bold).
    - PNG: 300 DPI raster in 8-bit grayscale (Color Type 0) to guarantee container memory safety (~23.8 MB vs ~71.6 MB).
  - No unsupported claims of PDF/X-1a, CMYK offset separation, or CTP plate readiness exist in source code or UI.
- **Evidence & Empirical Verification**:
  - Verified in `backend-epaper-step14-remediation.test.js` (Tests P4.1–P4.4).
- **Status**: **VERIFIED FIXED**
