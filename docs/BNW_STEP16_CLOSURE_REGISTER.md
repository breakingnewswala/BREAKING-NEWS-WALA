# BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
# STEP 16 — FINDINGS CLOSURE & VERIFICATION REGISTER

**Project:** BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)  
**Document ID:** `BNW-DOC-EPAPER-STEP16-CLOSURE-REGISTER-2026-V1.0`  
**Classification:** Security Vulnerability & Defect Closure Matrix  
**Audit Phase:** STEP 16 Critical Remediation & Hardening Verification  
**Date:** 2026-11-18  

---

## 1. Summary Closure Status Matrix

| Finding ID | Severity | Category | Title | Affected Component | Step 15 Status | Step 16 Final Status | Verification Test |
| :--- | :---: | :---: | :--- | :--- | :---: | :---: | :--- |
| **FINDING-15-01** | **P1** | Security / Auth | Creation-Time Publishing Security Bypass | `src/server/apiEngine.js:1310-1317`<br>`src/server/persistence/adapter.js:4670`<br>`src/server/persistence/firestoreAdapter.js:2807` | OPEN | **CLOSED / VERIFIED** | `tests/backend-epaper-step16-concurrency.test.js` (Subtests 1.1, 1.2, 1.3, 1.4) |
| **FINDING-15-02** | **P1** | Security / Race | TOCTOU Race Condition in WhatsApp Quota Enforcement | `src/server/apiEngine.js:1645-1655`<br>`src/server/persistence/adapter.js:5043-5077`<br>`src/server/persistence/firestoreAdapter.js:2776-2880` | OPEN | **CLOSED / VERIFIED** | `tests/backend-epaper-step16-concurrency.test.js` (Subtests 2.1, 2.2, 2.3, 2.4 — 10 concurrent requests) |
| **FINDING-15-03** | **P2** | Functionality | Missing Frontend UI for Reporter Quota Configuration | `src/screens/AdminControlScreen.tsx:1400-1490`<br>`src/services/apiClient.ts:2558-2575` | OPEN | **CLOSED / VERIFIED** | Production build `tsc && vite build` (Exit code 0); Subtests 3.1, 3.2, 3.3 |
| **FINDING-15-04** | **P3** | Defensive | Untrimmed Whitespace in Status Equality Guard | `src/server/apiEngine.js:1074-1081`<br>`src/server/apiEngine.js:1356-1365` | OPEN | **CLOSED / VERIFIED** | `tests/backend-epaper-step16-concurrency.test.js` (Subtests 4.1 through 4.6) |
| **FINDING-15-05** | **INFO** | Prepress / Arch | PDF Output is DeviceRGB Vector Proof, Not CTP Offset File | `src/server/epaper/exportEngine.js` | DOCUMENTED | **DOCUMENTED / OUT-OF-SCOPE** | Documented in architecture register; no invalid claims |
| **FINDING-15-06** | **INFO** | Prepress / Arch | PNG Export is 8-Bit Grayscale for Container Memory Safety | `src/server/epaper/exportEngine.js:366` | DOCUMENTED | **DOCUMENTED / OUT-OF-SCOPE** | Documented in architecture register; memory boundary safe |

---

## 2. Detailed Closure Verifications

### FINDING-15-01 (P1): Creation-Time Publishing Security Bypass
- **Remediation Details**:
  1. `src/server/apiEngine.js`: In `POST /api/v1/epaper/editions`, added defensive guard rejecting client payloads where `status === 'PUBLISHED'` (with whitespace trimming and case normalization) returning HTTP 400 `ERR_INVALID_OPERATION`.
  2. Forced creation payload status to `DRAFT` unconditionally (`const creationPayload = { ...body, status: 'DRAFT' };`).
  3. `src/server/persistence/adapter.js`: In `createEpaperEditionWithPages`, forced `status: 'DRAFT'` unconditionally.
  4. `src/server/persistence/firestoreAdapter.js`: In `createEpaperEditionWithPages`, forced `status: 'DRAFT'` unconditionally.
- **Verification Evidence**:
  - `POST /editions` with `{ status: 'PUBLISHED' }` returns HTTP 400 (`ERR_INVALID_OPERATION`).
  - `POST /editions` with `{ status: '  published  ' }` returns HTTP 400 (`ERR_INVALID_OPERATION`).
  - Direct call `adapter.createEpaperEditionWithPages` sets `edition.status = 'DRAFT'`.
  - Direct call `firestoreAdapter.createEpaperEditionWithPages` sets `edition.status = 'DRAFT'`.
- **Status**: **CLOSED**

---

### FINDING-15-02 (P1): TOCTOU Race Condition in WhatsApp Quota Enforcement
- **Remediation Details**:
  1. `src/server/persistence/adapter.js`: Added `_acquireReporterLock(reporterId)` returning an asynchronous mutex promise chain per reporter.
  2. Added `atomicSaveEpaperWhatsAppGeneration` which acquires the reporter mutex, executes quota validation against current date in `Asia/Kolkata` (IST), checks `remaining <= 0`, increments/persists the generation record, and releases the lock.
  3. Replicated identical atomic lock pattern in `src/server/persistence/firestoreAdapter.js`.
  4. Added fail-closed implementation in `ProductionGuardAdapter`.
  5. `src/server/apiEngine.js`: Updated `POST /api/v1/epaper/whatsapp/generate` to delegate generation to `adapter.atomicSaveEpaperWhatsAppGeneration` and map `ERR_QUOTA_EXHAUSTED` to HTTP 429.
- **Verification Evidence**:
  - Concurrency test with 10 simultaneous asynchronous requests for a reporter with quota = 1:
    - Exactly 1 request received HTTP 201 (`success: true`).
    - Exactly 9 requests received HTTP 429 (`code: 'ERR_QUOTA_EXHAUSTED'`).
    - Tested across both `LocalJsonAdapter` and `FirestoreAdapter`.
- **Status**: **CLOSED**

---

### FINDING-15-03 (P2): Master Admin Reporter Quota Management UI
- **Remediation Details**:
  1. `src/services/apiClient.ts`: Added `getReporterWhatsAppQuota(reporterId, date)` and `updateReporterWhatsAppQuota(reporterId, maxDaily)`.
  2. `src/screens/AdminControlScreen.tsx`: Added state for reporter quotas (`reporterQuotas`, `editingQuotaReporterId`, `editingQuotaValue`, `isUpdatingQuota`, `quotaFeedback`, `loadingQuotas`).
  3. Added "कोटा रीफ्रेश करें" button and auto-fetch on tab activation.
  4. Added `दैनिक व्हाट्सएप कोटा` column to reporters table with `used`, `maxDaily`, `remaining`, and inline edit controls.
  5. Tested RBAC authorization: non-admins receive HTTP 403 `ERR_FORBIDDEN`; negative quotas rejected with HTTP 400 `ERR_VALIDATION`.
- **Verification Evidence**:
  - Full TypeScript check and Vite production build (`tsc && vite build`) passed with exit code 0.
  - Subtests 3.1, 3.2, 3.3 in `tests/backend-epaper-step16-concurrency.test.js` pass.
- **Status**: **CLOSED**

---

### FINDING-15-04 (P3): Status Normalization Hardening
- **Remediation Details**:
  1. `src/server/apiEngine.js`: In `PATCH /api/v1/epaper/editions/:id/status`, sanitized input via `rawTarget.trim().toUpperCase()`.
  2. Validated against canonical list `VALID_EPAPER_STATUSES = ['DRAFT', 'EDITORIAL_REVIEW', 'LAYOUT_IN_PROGRESS', 'QUALITY_CHECK', 'APPROVED', 'PUBLISHED', 'ARCHIVED']`.
  3. Rejected direct transition to `PUBLISHED` with HTTP 400 `ERR_INVALID_OPERATION`.
  4. In `PUT/PATCH /api/v1/epaper/editions/:id`, sanitized `body.status.trim().toUpperCase()` and rejected `PUBLISHED` with HTTP 400 `ERR_INVALID_OPERATION`.
- **Verification Evidence**:
  - `PATCH /status` with `'   published   '` returns HTTP 400 `ERR_INVALID_OPERATION`.
  - `PATCH /status` with `'  editorial_review  '` normalizes to `'EDITORIAL_REVIEW'` and succeeds.
  - `PATCH /status` with `'  INVALID_STATE  '` returns HTTP 400 `ERR_VALIDATION`.
  - `PUT /editions/:id` with `' published '` returns HTTP 400 `ERR_INVALID_OPERATION`.
  - `PUT /editions/:id` with `' draft '` normalizes to `'DRAFT'` and succeeds.
- **Status**: **CLOSED**
