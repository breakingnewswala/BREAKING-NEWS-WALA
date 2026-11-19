# BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
# STEP 15 — PUBLISHING SECURITY & PIPELINE VERIFICATION AUDIT

**Project:** BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)  
**Document ID:** `BNW-DOC-EPAPER-STEP15-PUBLISHING-AUDIT-2026-V1.0`  
**Classification:** Post-Remediation Security Audit  
**Target:** E-Paper Edition Publishing Pipeline & Route Guards  
**Audit Date:** 2026-11-18  
**Audit Status:** **PARTIALLY VERIFIED (NEW P1 VULNERABILITY DISCOVERED)**

---

## 1. Audit Scope & Objectives

The primary objective of this audit is to independently assess whether the **P1 remediation from STEP 14** genuinely closes all avenues for unauthorized, unvalidated, or direct edition publishing. Specifically, the audit investigates:
1. Whether direct status mutation to `PUBLISHED` via `PATCH /status` and `PUT/PATCH /editions/:id` is strictly blocked.
2. Whether any other API routes, adapter methods, or creation endpoints permit introducing or promoting an edition to `PUBLISHED` status without passing through the quality preflight scanner and OCC-guarded publishing pipeline.
3. Whether the legitimate publishing pipeline (`POST /api/v1/epaper/editions/:id/publish`) correctly enforces authentication, role authorization, preflight checks, OCC concurrency control, immutable version snapshots, and atomic state transitions.

---

## 2. Complete Publishing Attack-Surface Analysis

Every endpoint, route handler, and persistence method interacting with `status` or publishing was enumerated and tested:

| Route / Method | HTTP Verb | Authentication | Required Role | Can Change Status? | Direct Publish Blocked? | Evidence / Code Reference |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `/api/v1/epaper/editions/:id/status` | `PATCH` | Yes (JWT) | `EDITOR` / `CHIEF_EDITOR` | Yes (Lifecycle stages) | **VERIFIED BLOCKED** | `apiEngine.js:1093-1095`: Returns HTTP 400 `ERR_INVALID_OPERATION` if `String(targetStatus).toUpperCase() === 'PUBLISHED'`. |
| `/api/v1/epaper/editions/:id` | `PUT` / `PATCH` | Yes (JWT) | `EDITOR` | Yes (Metadata & fields) | **VERIFIED BLOCKED** | `apiEngine.js:1342-1344`: Returns HTTP 400 `ERR_INVALID_OPERATION` if `body.status && String(body.status).toUpperCase() === 'PUBLISHED' && existing.status !== 'PUBLISHED'`. |
| `/api/v1/epaper/editions` | `POST` | Yes (JWT) | `EDITOR` | Yes (Initial status) | ❌ **OPEN BYPASS (P1)** | `apiEngine.js:1305` & `adapter.js:4670`: Passing `{ status: 'PUBLISHED' }` creates a new edition directly in `status: 'PUBLISHED'` without preflight scan or version snapshot! |
| `/api/v1/epaper/editions/:id/publish` | `POST` | Yes (JWT) | `EDITOR` / `CHIEF_EDITOR` | Yes (Legitimate Gate) | **N/A (Authorized Route)** | `apiEngine.js:1126-1166`: Atomic publishing gate. Evaluates `QualityPreflightScanner`, verifies OCC version, invokes `adapter.publishEpaperEdition`, logs audit trail. |
| `/api/v1/epaper/editions/:id` | `DELETE` | Yes (JWT) | `ADMIN` / `CHIEF_EDITOR` | Deletes edition | **VERIFIED BLOCKED** | `apiEngine.js:1374-1376`: Blocked with HTTP 400 `ERR_CANNOT_DELETE_PUBLISHED` if `existing.status === 'PUBLISHED'`. |
| `adapter.updateEpaperEditionStatus` | Method | N/A (Internal) | N/A | Yes | **UNGUARDED IN ADAPTER** | `adapter.js:4745`: Direct programmatic caller can pass `targetStatus = 'PUBLISHED'` and set `publishedAt`. |
| `adapter.saveEpaperEdition` | Method | N/A (Internal) | N/A | Yes | **UNGUARDED IN ADAPTER** | `adapter.js:4595`: Direct programmatic caller can pass `status: 'PUBLISHED'`. |

---

## 3. Detailed Audit Findings

### 3.1 Verification of STEP 14 Remediation Targets (PATCH /status & PUT /editions/:id)
- **Status Endpoint (`PATCH /api/v1/epaper/editions/:id/status`)**:
  - Code reference: `src/server/apiEngine.js:1093-1095`
  ```javascript
  if (String(targetStatus).toUpperCase() === 'PUBLISHED') {
    return sendError(res, 400, 'ERR_INVALID_OPERATION', 'ई-पेपर संस्करण को सीधे "PUBLISHED" स्थिति में सेट नहीं किया जा सकता। कृपया समर्पित प्रकाशन पाइपलाइन (POST /api/v1/epaper/editions/:id/publish) का उपयोग करें।');
  }
  ```
  - **Empirical Test**: Verified via test `P1.2` in `tests/backend-epaper-step14-remediation.test.js`. Both uppercase `'PUBLISHED'` and lowercase `'published'` are strictly intercepted and rejected with HTTP 400.
  - **Minor Whitespace Note**: `String(targetStatus).toUpperCase()` does not call `.trim()`. Untrimmed inputs like `' PUBLISHED '` evade the exact equality check, but will fail to match `norm === 'PUBLISHED'` in public feed filters (`norm === 'PUBLISHED'`). However, adding `.trim()` is recommended as defensive coding.

- **Edition Update Endpoint (`PUT/PATCH /api/v1/epaper/editions/:id`)**:
  - Code reference: `src/server/apiEngine.js:1342-1344`
  ```javascript
  if (body.status && String(body.status).toUpperCase() === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
    return sendError(res, 400, 'ERR_INVALID_OPERATION', 'ई-पेपर संस्करण को सीधे "PUBLISHED" स्थिति में सेट नहीं किया जा सकता। कृपया समर्पित प्रकाशन पाइपलाइन (POST /api/v1/epaper/editions/:id/publish) का उपयोग करें।');
  }
  ```
  - **Empirical Test**: Verified via test `P1.3`. Any update that attempts to promote an unpublished edition to published is rejected with HTTP 400 `ERR_INVALID_OPERATION`.

---

### 3.2 Discovery of New P1 Vulnerability: Direct Creation as PUBLISHED via `POST /api/v1/epaper/editions`

During comprehensive enumeration of all edition write paths, the audit team inspected the edition creation handler:
- **Location**: `src/server/apiEngine.js:1294-1310` and `src/server/persistence/adapter.js:4670`
- **Mechanism**:
  In `apiEngine.js:1305`:
  ```javascript
  const body = await parseRequestBody(req);
  if (!body.title || !body.publicationDate) {
    return sendError(res, 400, 'ERR_VALIDATION', 'शीर्षक (title) और प्रकाशन तिथि (publicationDate) अनिवार्य हैं।');
  }
  const result = await adapter.createEpaperEditionWithPages(body, user);
  ```
  In `adapter.js:4670` and `firestoreAdapter.js:2920`:
  ```javascript
  const editionRecord = {
    id,
    editionCode,
    title: editionData.title || `${distSlug} दैनिक ई-पेपर`,
    publicationDate,
    editionType,
    status: editionData.status || 'DRAFT', // <--- VULNERABILITY: Directly takes status from payload!
    totalPages,
    pages: createdPages.map((p) => p.id),
    ...
  };
  ```
- **Empirical Proof of Concept**:
  The audit team executed an isolated reproduction script:
  ```javascript
  const adapter = getPersistenceAdapter();
  const res = await adapter.createEpaperEditionWithPages({
    title: 'Exploit Edition',
    publicationDate: '2026-11-20',
    status: 'PUBLISHED'
  });
  console.log(res.edition.status); // Outputs: "PUBLISHED"
  ```
  Execution output confirmed: `Created edition status: PUBLISHED`.
- **Impact**:
  An editor can construct a new edition payload containing `{ status: 'PUBLISHED' }` and send it to `POST /api/v1/epaper/editions`. The edition is persisted immediately with status `PUBLISHED` and becomes publicly visible on the reader portal without undergoing quality checks, preflight evaluation, or creating an immutable version snapshot.
- **Classification**: **Severity P1 — Creation-Time Publishing Security Bypass**.

---

## 4. Legitimate Publishing Pipeline Audit (`POST /publish`)

The dedicated publication endpoint (`/api/v1/epaper/editions/:id/publish`) was inspected against all 10 integrity criteria:

| # | Integrity Criterion | Implementation Check | Status | Evidence / Reference |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **Authentication** | Validates dual JWT access token | **VERIFIED** | `apiEngine.js:1127-1129`: Returns HTTP 401 if `!user`. |
| 2 | **Role Authorization** | Requires `EDITOR`, `CHIEF_EDITOR`, or `ADMIN` | **VERIFIED** | `apiEngine.js:1130-1132`: Returns HTTP 403 `ERR_FORBIDDEN` if `!isEpaperEditor(user)`. |
| 3 | **Edition Existence** | Verifies edition ID in database | **VERIFIED** | `apiEngine.js:1135-1137`: Returns HTTP 404 if edition not found. |
| 4 | **OCC Version Gate** | Matches `body.version` against current edition version | **VERIFIED** | `apiEngine.js:1139-1142`: Returns HTTP 409 `ERR_CONCURRENCY_CONFLICT` on stale version. |
| 5 | **Preflight Scanner** | Runs 5 automated quality checks | **VERIFIED** | `apiEngine.js:1145-1154`: Returns HTTP 422 `ERR_PREFLIGHT_BLOCKER` if blockers found. |
| 6 | **Deep Copy Snapshot** | Clones edition and page data | **VERIFIED** | `adapter.js:5308-5313`: `JSON.parse(JSON.stringify(...))` ensures immutable copy. |
| 7 | **Snapshot Persistence** | Saves to `epaperEditionVersions` | **VERIFIED** | `adapter.js:5319`: `await this.saveEpaperEditionVersion(snapshot)`. |
| 8 | **Atomic Status Transition** | Marks `PUBLISHED` only after snapshot | **VERIFIED** | `adapter.js:5323`: Sets `status: 'PUBLISHED'` only after snapshot save completes. |
| 9 | **Version Incrementation** | Increments `version = version + 1` | **VERIFIED** | `adapter.js:5326`: Atomically increments edition version number. |
| 10 | **Audit Trail Logging** | Structured audit log written | **VERIFIED** | `apiEngine.js:1158`: Emits `EPAPER_EDITION_PUBLISHED` audit log. |

---

## 5. Audit Conclusion & Verdict

- **Direct Status Route Bypass (`PATCH /status`)**: **VERIFIED FIXED**
- **Direct Edition Route Bypass (`PUT/PATCH /editions/:id`)**: **VERIFIED FIXED**
- **Dedicated Publication Gate (`POST /publish`)**: **VERIFIED SECURE & ROBUST**
- **Creation-Time Status Injection (`POST /editions`)**: **OPEN (NEW P1 FINDING)**

**Overall Publishing Audit Verdict**: **PARTIALLY VERIFIED — UNRESOLVED P1 CREATION BYPASS**.  
Remediation is required before promoting to staging: `POST /api/v1/epaper/editions` and `adapter.createEpaperEditionWithPages` must enforce `status = 'DRAFT'` unconditionally, ignoring any client-supplied `status` field.
