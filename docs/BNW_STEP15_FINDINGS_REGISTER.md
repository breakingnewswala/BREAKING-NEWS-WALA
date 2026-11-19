# BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
# STEP 15 — AUDIT FINDINGS & BUG REGISTER

**Project:** BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)  
**Document ID:** `BNW-DOC-EPAPER-STEP15-FINDINGS-REGISTER-2026-V1.0`  
**Classification:** Security Vulnerability & Defect Register  
**Audit Phase:** Post-STEP 14 Remediation Audit  
**Audit Date:** 2026-11-18  

---

## 1. Summary of Findings

| Finding ID | Severity | Category | Title | Affected Component | Status |
| :--- | :---: | :---: | :--- | :--- | :---: |
| **FINDING-15-01** | **P1** | Security / Auth | Creation-Time Publishing Security Bypass | `src/server/apiEngine.js:1305` & `adapter.js:4670` | **OPEN** |
| **FINDING-15-02** | **P1** | Security / Race | TOCTOU Race Condition in WhatsApp Quota Enforcement | `src/server/apiEngine.js:1633-1647` | **OPEN** |
| **FINDING-15-03** | **P2** | Functionality | Missing Frontend UI for Reporter Quota Configuration | `src/screens/AdminControlScreen.tsx` | **OPEN** |
| **FINDING-15-04** | **P3** | Defensive | Untrimmed Whitespace in Status Equality Guard | `src/server/apiEngine.js:1093` | **OPEN** |
| **FINDING-15-05** | **INFO** | Prepress / Arch | PDF Output is DeviceRGB Vector Proof, Not CTP Offset File | `src/server/epaper/exportEngine.js` | **DOCUMENTED** |
| **FINDING-15-06** | **INFO** | Prepress / Arch | PNG Export is 8-Bit Grayscale for Container Memory Safety | `src/server/epaper/exportEngine.js:366` | **DOCUMENTED** |
| **FINDING-15-07** | **P1** (Prev) | Security | Direct Status Mutation via `PATCH /status` | `src/server/apiEngine.js:1093` | **VERIFIED FIXED** |
| **FINDING-15-08** | **P1** (Prev) | Security | Direct Status Mutation via `PUT /editions/:id` | `src/server/apiEngine.js:1342` | **VERIFIED FIXED** |
| **FINDING-15-09** | **P2** (Prev) | Architecture | Quota Rollover Aligned with India Standard Time | `src/server/persistence/adapter.js:5060` | **VERIFIED FIXED** |
| **FINDING-15-10** | **P3** (Prev) | Testing | Regression Assertion in Public Access Auth Test | `tests/backend-master-admin-auth.test.js:163` | **VERIFIED FIXED** |

---

## 2. Detailed Findings Register

### FINDING-15-01 (Severity: P1 — Security / Authorization Bypass)
- **Title**: Creation-Time Publishing Security Bypass via `POST /api/v1/epaper/editions`
- **Component**: `src/server/apiEngine.js:1294-1310` and `src/server/persistence/adapter.js:4670`
- **Description**:
  While STEP 14 added guards to `PATCH /status` and `PUT /editions/:id`, the edition creation endpoint (`POST /api/v1/epaper/editions`) passes the entire request body to `adapter.createEpaperEditionWithPages(body, user)`. In `adapter.js:4670` and `firestoreAdapter.js:2920`, the status is initialized as:
  ```javascript
  status: editionData.status || 'DRAFT',
  ```
  If a client sends `{ title: '...', publicationDate: '...', status: 'PUBLISHED' }`, the edition is created immediately with `status: 'PUBLISHED'`.
- **Reproduction**:
  ```javascript
  const res = await adapter.createEpaperEditionWithPages({
    title: 'Bypass Edition',
    publicationDate: '2026-11-20',
    status: 'PUBLISHED'
  });
  console.log(res.edition.status); // Outputs: "PUBLISHED"
  ```
- **Impact**:
  Permits editors to introduce a published edition directly onto the public reader portal without running the 5-point quality preflight scan, verifying page contents, or creating an immutable version snapshot in `epaperEditionVersions`.
- **Remediation**:
  In `adapter.createEpaperEditionWithPages`, unconditionally force `status: 'DRAFT'`. In `apiEngine.js`, reject or sanitize any incoming `body.status` field.
- **Status**: **OPEN**

---

### FINDING-15-02 (Severity: P1 — Concurrency / Rate Limiting Bypass)
- **Title**: Time-of-Check to Time-of-Use (TOCTOU) Race Condition in WhatsApp Quota Enforcement
- **Component**: `src/server/apiEngine.js:1633-1647`
- **Description**:
  WhatsApp generation quota validation and consumption are split into separate non-atomic asynchronous operations:
  1. Line 1633: `const quotaInfo = await adapter.getReporterWhatsAppQuota(user.id);`
  2. Line 1634: `if (quotaInfo.quotaExceeded) return sendError(res, 429, ...);`
  3. Line 1638: `const generated = await adapter.saveEpaperWhatsAppGeneration({...}, user);`
- **Reproduction**:
  Trigger 10 parallel asynchronous HTTP POST requests to `/api/v1/epaper/whatsapp/generate` for a reporter with 1 remaining card quota. All 10 requests evaluate `quotaExceeded == false` before any of them finish writing the generation record.
- **Impact**:
  A reporter or automated script can exceed their daily quota limit during high-concurrency bursts. In multi-instance or clustered production environments, quota limits cannot be strictly enforced without atomic distributed locking.
- **Remediation**:
  Implement transactional reservation:
  - In Cloud Firestore: Wrap check and record creation in `db.runTransaction()`.
  - In LocalJson/Memory: Use an in-process lock or synchronize the check and push operation.
- **Status**: **OPEN**

---

### FINDING-15-03 (Severity: P2 — Functional Defect / Missing UI)
- **Title**: Missing Frontend Administrative UI for Reporter WhatsApp Quota Configuration
- **Component**: `src/screens/AdminControlScreen.tsx` and `src/services/apiClient.ts`
- **Description**:
  The backend API endpoint `PUT /api/v1/epaper/whatsapp/quota/:reporterId` exists and works correctly. However:
  1. `apiClient.ts` does not expose an SDK function to call this endpoint.
  2. `AdminControlScreen.tsx` contains no table column, modal, or form to allow a Master Admin to view or update a reporter's daily card quota.
- **Impact**:
  Master Admins cannot utilize the configurable quota feature through the graphical application dashboard.
- **Remediation**:
  1. Add `updateReporterWhatsAppQuota(reporterId, quota)` to `src/services/apiClient.ts`.
  2. Add a quota configuration input in `AdminControlScreen.tsx` under Reporter Management.
- **Status**: **OPEN**

---

### FINDING-15-04 (Severity: P3 — Defensive Programming)
- **Title**: Untrimmed Whitespace in Route Status Guard
- **Component**: `src/server/apiEngine.js:1093`
- **Description**:
  The route guard checks `if (String(targetStatus).toUpperCase() === 'PUBLISHED')`. If a request sends `targetStatus: ' PUBLISHED '` (with surrounding whitespace), the equality check evaluates to false.
- **Impact**:
  Low direct impact because `getEpaperEditions` filters on exact normalized status, but untrimmed values could pollute internal database records.
- **Remediation**:
  Use `String(targetStatus).trim().toUpperCase() === 'PUBLISHED'`.
- **Status**: **OPEN**

---

### FINDING-15-05 (Severity: INFO — Prepress / Architectural Reality)
- **Title**: PDF Prepress Output Uses DeviceRGB and Type 1 Typography (Not Offset CTP-Ready)
- **Component**: `src/server/epaper/exportEngine.js`
- **Description**:
  The PDF generator outputs valid PDF-1.4 with accurate physical broadsheet dimensions ($32.9 \times 52.0\text{ cm}$). However, it uses Standard 14 Type 1 Helvetica fonts and DeviceRGB color operators (`rg`/`RG`). It does not embed Devanagari TrueType/OpenType fonts or output CMYK separations.
- **Status**: **DOCUMENTED ACCURATELY POST-STEP 14**

---

### FINDING-15-06 (Severity: INFO — Performance / Memory Optimization)
- **Title**: 300 DPI Raster PNG Encoded as 8-Bit Grayscale for Memory Safety
- **Component**: `src/server/epaper/exportEngine.js:366`
- **Description**:
  Raster PNG outputs are encoded using Color Type 0 (Grayscale). This was an intentional optimization saving $\sim 48\text{ MB}$ RAM per page scanline ($23.8\text{ MB}$ Grayscale vs $71.6\text{ MB}$ Truecolor RGB). Color information in photos and ads is flattened.
- **Status**: **DOCUMENTED ACCURATELY POST-STEP 14**
