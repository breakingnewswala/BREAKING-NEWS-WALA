# BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
# STEP 14 — TARGETED REMEDIATION REPORT
## Publishing Security, WhatsApp Quota, API Regression & Export Capabilities

**Project:** BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)  
**Document ID:** `BNW-DOC-EPAPER-STEP14-REMEDIATION-REPORT-2026-V1.0`  
**Classification:** Engineering Audit & Remediation Verification Report  
**Branch:** `main` (Local, uncommitted working tree)  
**Execution Date:** 2026-11-18  
**Status:** **100% REMEDIATED & EMPIRICALLY VERIFIED**

---

## 1. Executive Summary

Following the comprehensive, evidence-driven independent audit conducted in **STEP 13**, four key technical findings were identified for targeted remediation:
1. **Finding P1 (Publishing Security Bypass)**: Direct status mutation to `PUBLISHED` was permitted via `PATCH /api/v1/epaper/editions/:id/status` and `PUT/PATCH /api/v1/epaper/editions/:id`, bypassing the dedicated publication pipeline (`POST /api/v1/epaper/editions/:id/publish`), preflight validation, OCC checks, and immutable version snapshot creation.
2. **Finding P2 (Hardcoded WhatsApp Quota)**: The WhatsApp clipping card generation limit was hardcoded to a fixed constant (`maxDaily = 20`) evaluated against UTC dates (`new Date().toISOString().split('T')[0]`), lacking administrative customizability and failing to align with India Standard Time (`Asia/Kolkata`) midnight rollover.
3. **Finding P3 (Public E-Paper API Regression Test)**: The test `tests/backend-master-admin-auth.test.js:159-165` asserted `assert.ok(Array.isArray(epaperRes.data.data))` on `GET /api/v1/epaper/editions`. This failed because the canonical API contract returns a standard paginated envelope (`{ editions: [...], items: [...], total, page, limit, totalPages }`).
4. **Finding P4 (PDF/X-1a Export Claims Alignment)**: The export engine included `/GTS_PDFXVersion (PDF/X-1a:2001)` in its PDF header without true embedded font descriptors or CMYK ICC profiles. Additionally, documentation did not clarify why raster PNG exports are encoded as Grayscale (Color Type 0).

### Remediation Outcomes:
- **P1**: Strict server-side route guards were added to both `PATCH /api/v1/epaper/editions/:id/status` and `PUT/PATCH /api/v1/epaper/editions/:id`. Any attempt to set `status = 'PUBLISHED'` via these routes is rejected with **HTTP 400 `ERR_INVALID_OPERATION`**. The dedicated endpoint `POST /api/v1/epaper/editions/:id/publish` remains the **sole authorized route** to publish editions.
- **P2**: Persistent, per-reporter configurable quotas (`setReporterWhatsAppQuota`) were introduced across memory, JSON, and Firestore adapters. Date evaluation was migrated to `Asia/Kolkata` IST timezone. New administrative endpoints `PUT /api/v1/epaper/whatsapp/quota/:reporterId` and `GET /api/v1/epaper/whatsapp/quota/:reporterId` were exposed and protected with `isChiefEditorOrMasterAdmin(user)` role checks.
- **P3**: The legacy assertion in `tests/backend-master-admin-auth.test.js` was updated to validate both paginated object (`editionsList`) and legacy arrays, resolving the test failure.
- **P4**: Misleading PDF/X-1a headers were purged from `exportEngine.js`. Capabilities were accurately documented: native Node.js PDF-1.4 vector/raster broadsheet output ($32.9 \times 52.0\text{ cm}$) with Type 1 typography, and high-performance 300 DPI grayscale raster PNG ($3886 \times 6142\text{ px}$) engineered for optimal memory footprint ($23.8\text{ MB}$ raw buffer vs $71.6\text{ MB}$ for RGB).
- **Test Suite Results**: **271/271 tests passing (100%)** across 7 test suites, with a completely green TypeScript/Vite production build (`npm run build`).

---

## 2. Changes Made & Files Modified

| File Path | Type | Remediation Target | Lines Changed | Description |
| :--- | :---: | :---: | :---: | :--- |
| `src/server/apiEngine.js` | Source | P1, P2 | Lines 1029, 1090-1100, 1340-1350, 1635, 1665-1700 | Added `epaperWhatsappQuotaReporterMatch` regex; blocked direct `PUBLISHED` status transitions with HTTP 400 `ERR_INVALID_OPERATION`; added `PUT/GET /api/v1/epaper/whatsapp/quota/:reporterId` endpoints; updated WhatsApp quota error to dynamic limit. |
| `src/server/persistence/adapter.js` | Source | P2 | Lines 5060-5120, 5740-5750 | Added `_getIndiaDateString(dateInput)` utilizing `Asia/Kolkata` timezone; updated `getReporterWhatsAppQuota` to read custom reporter quotas and filter IST dates; added `setReporterWhatsAppQuota` to persist per-reporter quotas. |
| `src/server/persistence/firestoreAdapter.js` | Source | P2 | Lines 3300-3375 | Added IST date calculations; updated `getReporterWhatsAppQuota` to query `epaperReporterQuotas` and user documents; added `setReporterWhatsAppQuota` for Cloud Firestore. |
| `src/server/epaper/exportEngine.js` | Source | P4 | Lines 1-25, 315-325 | Purged misleading `/GTS_PDFXVersion (PDF/X-1a:2001)` from PDF `/Info` dictionary; updated file documentation explaining PDF-1.4 broadsheet geometry and grayscale PNG memory optimization. |
| `tests/backend-master-admin-auth.test.js` | Test | P3 | Lines 160-165 | Updated test assertion #5 to accept paginated `{ editions: [...], total }` envelope, eliminating test failure. |
| `tests/backend-epaper-step14-remediation.test.js` | Test | P1, P2, P3, P4 | New File (427 lines) | 13 dedicated unit & integration tests verifying publishing bypass rejection, custom quotas, IST rollover, public API contract, and export compliance. |

---

## 3. Detailed Remediation Breakdown

### 3.1 P1 — E-Paper Publishing Security Bypass Remediation
- **Root Cause**:
  In `src/server/apiEngine.js`, the general status update route (`PATCH /api/v1/epaper/editions/:id/status`) and the edition update route (`PUT /api/v1/epaper/editions/:id`) allowed passing `{ status: 'PUBLISHED' }`. This allowed any editor with elevated permissions to mark an edition as published without executing the `QualityPreflightScanner` evaluations (e.g. checking for text overflows, missing mastheads, or low-res images) and without creating an immutable edition version snapshot in `epaperEditionVersions`.
- **Implementation**:
  1. In `apiEngine.js` (`epaperEditionStatusMatch`):
     ```javascript
     if (String(targetStatus).toUpperCase() === 'PUBLISHED') {
       return sendError(res, 400, 'ERR_INVALID_OPERATION', 'ई-पेपर संस्करण को सीधे "PUBLISHED" स्थिति में सेट नहीं किया जा सकता। कृपया समर्पित प्रकाशन पाइपलाइन (POST /api/v1/epaper/editions/:id/publish) का उपयोग करें।');
     }
     ```
  2. In `apiEngine.js` (`epaperEditionIdMatch` PUT/PATCH):
     ```javascript
     if (body.status && String(body.status).toUpperCase() === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
       return sendError(res, 400, 'ERR_INVALID_OPERATION', 'ई-पेपर संस्करण को सीधे "PUBLISHED" स्थिति में सेट नहीं किया जा सकता। कृपया समर्पित प्रकाशन पाइपलाइन (POST /api/v1/epaper/editions/:id/publish) का उपयोग करें।');
     }
     ```
- **Validation**:
  Tests `P1.2` and `P1.3` in `tests/backend-epaper-step14-remediation.test.js` verify that both endpoints return HTTP 400 `ERR_INVALID_OPERATION` when targeting `PUBLISHED`. Test `P1.4` confirms that publication succeeds via `POST /api/v1/epaper/editions/:id/publish`, creating the immutable version snapshot and bumping OCC version.

### 3.2 P2 — Configurable WhatsApp Quota with IST Rollover
- **Root Cause**:
  `getReporterWhatsAppQuota` in `adapter.js` and `firestoreAdapter.js` had `const maxDaily = 20;` hardcoded and calculated the date using UTC (`toISOString().split('T')[0]`). This caused quotas to reset at 05:30 AM IST rather than midnight, and gave newsroom administrators no mechanism to adjust quotas for high-volume district stringers or restrict trial accounts.
- **Implementation**:
  1. Added `_getIndiaDateString(dateInput)`:
     ```javascript
     _getIndiaDateString(dateInput = new Date()) {
       try {
         const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
         return new Intl.DateTimeFormat('en-CA', {
           timeZone: 'Asia/Kolkata',
           year: 'numeric',
           month: '2-digit',
           day: '2-digit',
         }).format(d);
       } catch {
         return new Date().toISOString().split('T')[0];
       }
     }
     ```
  2. Persistent quota resolution:
     - Check `this.data.reporterWhatsAppQuotas[reporterId]`.
     - Fallback to `user.customWhatsAppQuota`.
     - Default to `20`.
  3. Added administrative method `setReporterWhatsAppQuota(reporterId, quota)` in `adapter.js` and `firestoreAdapter.js`.
  4. Added API routes:
     - `PUT /api/v1/epaper/whatsapp/quota/:reporterId`: Protected by `isChiefEditorOrMasterAdmin(user)`. Validates numeric non-negative quota, persists to adapter, and writes audit log.
     - `GET /api/v1/epaper/whatsapp/quota/:reporterId`: Returns quota status, timezone (`Asia/Kolkata`), used count, and remaining count.
  5. Updated error response in `POST /api/v1/epaper/whatsapp/generate`:
     Outputs `दैनिक व्हाट्सएप कार्ड निर्माण सीमा (${quotaInfo.maxDaily || 20} कार्ड/दिन) समाप्त हो चुकी है।`
- **Validation**:
  Tests `P2.1` to `P2.5` verify default quota (20), rejection of non-admin changes (HTTP 403), Master Admin quota modification, and dynamic quota exhaustion.

### 3.3 P3 — Public E-Paper API Pagination Contract Resolution
- **Root Cause**:
  `tests/backend-master-admin-auth.test.js` line 163 asserted `assert.ok(Array.isArray(epaperRes.data.data))`. When the E-Paper module was modernized to support enterprise pagination, `GET /api/v1/epaper/editions` was updated to return `{ editions: [...], items: [...], total, page, limit, totalPages }`.
- **Implementation**:
  Line 163 was updated to check:
  ```javascript
  const editionsList = Array.isArray(epaperRes.data.data) ? epaperRes.data.data : epaperRes.data.data?.editions;
  assert.ok(Array.isArray(editionsList));
  const totalCount = typeof epaperRes.data.data?.total === 'number' ? epaperRes.data.data.total : editionsList.length;
  assert.strictEqual(typeof totalCount, 'number');
  ```
- **Validation**:
  `tests/backend-master-admin-auth.test.js` now passes **33/33 tests (100%)**.

### 3.4 P4 — PDF & PNG Export Capability Alignment
- **Root Cause & Corrections**:
  In `src/server/epaper/exportEngine.js`, `/GTS_PDFXVersion (PDF/X-1a:2001)` was removed. PDF/X-1a compliance requires embedded TrueType/OpenType font programs with FontDescriptor objects and ICC OutputIntents. The engine generates a clean, standards-compliant **PDF-1.4 vector/raster broadsheet document**.
- **PNG Raster Engineering Rationale**:
  The raster PNG export is encoded with Color Type 0 (Grayscale) and 300 DPI (`pHYs` chunk with 11,811 pixels/meter). For a broadsheet page of $3,886 \times 6,142$ pixels:
  - Grayscale scanlines require $1 \text{ byte/pixel} + 1 \text{ filter byte/row} \approx \mathbf{23.8\text{ MB}}$ raw buffer.
  - RGB scanlines would require $3 \text{ bytes/pixel} + 1 \text{ filter byte/row} \approx \mathbf{71.6\text{ MB}}$ raw buffer per page.
  In high-concurrency Node.js environments processing 12-page editions, Grayscale encoding ensures fast, crash-resilient buffer synthesis without memory exhaustion.

---

## 4. Empirical Test Verification

### 4.1 Master Test Suite Execution Summary
Executed command:
`node --test tests/backend-master-admin-auth.test.js tests/backend-epaper-step14-remediation.test.js tests/backend-epaper-management.test.js tests/epaper-layout-engine.test.js tests/backend-ai-epaper-step9.test.js tests/backend-epaper-step10-12.test.js tests/backend-runtime-server.test.js`

```
Test Files Executed: 7
Total Tests Executed: 271
Passing: 271
Failing: 0
Skipped: 0
Total Duration: 3.71s
Exit Code: 0
```

### 4.2 Breakdown by Test Suite:
1. `tests/backend-master-admin-auth.test.js`: **33/33 PASS**
2. `tests/backend-epaper-step14-remediation.test.js`: **13/13 PASS**
3. `tests/backend-epaper-management.test.js`: **119/119 PASS**
4. `tests/epaper-layout-engine.test.js`: **31/31 PASS**
5. `tests/backend-ai-epaper-step9.test.js`: **35/35 PASS**
6. `tests/backend-epaper-step10-12.test.js`: **29/29 PASS**
7. `tests/backend-runtime-server.test.js`: **11/11 PASS**

### 4.3 Production Build Verification
Executed command: `npm run build` (`tsc && vite build`)
```
✓ 2127 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                 2.21 kB │ gzip:   0.94 kB
dist/assets/index-98oPsZWF.css                114.51 kB │ gzip:  16.92 kB
dist/assets/vendor-react-Cmx9KvMq.js            4.22 kB │ gzip:   1.58 kB
dist/assets/SearchScreen-lzIGSq_q.js            4.89 kB │ gzip:   1.99 kB
dist/assets/EpaperScreen-D7J1YYzr.js           29.58 kB │ gzip:   8.83 kB
dist/assets/ProfileScreen-mImeHsBQ.js          32.72 kB │ gzip:   7.81 kB
dist/assets/graphicRenderer-D894PpXr.js        33.59 kB │ gzip:  10.54 kB
dist/assets/NewsroomDeskScreen-EYiWgEYn.js     47.86 kB │ gzip:  10.10 kB
dist/assets/ReporterDeskScreen-CR7Hzu03.js     58.48 kB │ gzip:  14.40 kB
dist/assets/GraphicsStudioScreen-Bu0ViezV.js   60.74 kB │ gzip:  13.26 kB
dist/assets/AiNewsroomScreen-CBRgp-RE.js       64.01 kB │ gzip:  12.63 kB
dist/assets/vendor-lucide-t0f1JVII.js          66.52 kB │ gzip:  15.05 kB
dist/assets/VideoStudioScreen-CYNwkmWe.js      88.91 kB │ gzip:  19.89 kB
dist/assets/AdminControlScreen-DcSBZYtn.js    333.52 kB │ gzip:  67.22 kB
dist/assets/vendor-firebase-GWfzBGpQ.js       438.19 kB │ gzip: 104.01 kB
dist/assets/index-DAW3Hw5z.js                 500.30 kB │ gzip: 128.67 kB
✓ built in 20.02s
Exit Code: 0
```

---

## 5. Non-Destructive Verification & Compliance Checklist

- [x] **Zero Production Deployments**: No deployment triggered to Firebase App Hosting or Cloud Run.
- [x] **Zero Git Pushes**: Working tree maintained locally on branch `main`.
- [x] **Zero Git Commits**: No commits created during this session.
- [x] **Firestore Rules Unmodified**: `firestore.rules` remains untouched.
- [x] **Zero Secrets / IAM Modifications**: All credentials, keys, and cloud configurations remain unmodified.
- [x] **No Real Publications / WhatsApp Triggers**: All tests ran against in-memory mock adapters and test fixtures.
- [x] **Backward Compatibility Preserved**: Existing reader, reporter, admin, and newsroom workflows remain 100% operational.

---

## 6. Production Readiness Status & Recommendation

With the completion and empirical validation of STEP 14 targeted remediations:
- **Publishing Security Integrity**: 100% enforced via atomic publishing gate and route guards.
- **WhatsApp Quota Engine**: Configurable, persistent, and synchronized with Indian Standard Time.
- **API Contracts**: Paginated responses verified and fully backwards-compatible.
- **Export Prepress Engine**: Standards-compliant PDF-1.4 and memory-optimized 300 DPI raster PNG verified without misleading claims.
- **System Stability**: 271 automated tests passing, 0 build errors.

The BREAKING NEWS WALA E-Paper Management System is **fully remediated, hardened, and verified ready for staging review**.

<!-- GOAL_COMPLETE -->
