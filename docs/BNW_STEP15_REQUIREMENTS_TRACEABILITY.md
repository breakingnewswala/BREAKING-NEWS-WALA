# BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
# STEP 15 — REQUIREMENTS TRACEABILITY AUDIT

**Project:** BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)  
**Document ID:** `BNW-DOC-EPAPER-STEP15-TRACEABILITY-2026-V1.0`  
**Classification:** Specification & Remediation Traceability Matrix  
**Target:** Full Traceability of STEP 14 Claims & Core System Requirements  
**Audit Date:** 2026-11-18  

---

## 1. Traceability Matrix: STEP 14 Remediation Claims vs Audit Evidence

| Item / Claim ID | Description | Claimed in STEP 14 | Independent Verification Method | Empirical Evidence | Audit Verification Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **CLM-14-01** | Publishing Security Bypass Remediation on `PATCH /status` | Blocked direct status update to `PUBLISHED` with HTTP 400 | Automated tests & AST code inspection of `apiEngine.js` | Test `P1.2` in `backend-epaper-step14-remediation.test.js` passes. Line 1093 returns HTTP 400. | **VERIFIED COMPLIANT** |
| **CLM-14-02** | Publishing Security Bypass Remediation on `PUT /editions/:id` | Blocked direct edition update to `PUBLISHED` with HTTP 400 | Automated tests & AST code inspection of `apiEngine.js` | Test `P1.3` in `backend-epaper-step14-remediation.test.js` passes. Line 1342 returns HTTP 400. | **VERIFIED COMPLIANT** |
| **CLM-14-03** | Total Publishing Route Exclusivity | Dedicated `/publish` is the *sole* route to publish | Exhaustive repository search of all write paths | ⚠️ Discovery: `POST /epaper/editions` allows `{ status: 'PUBLISHED' }` on creation! | ❌ **PARTIALLY VERIFIED (OPEN P1)** |
| **CLM-14-04** | Atomic Publishing Gate Integrity | Preflight checks, OCC checking, immutable snapshot | Automated tests & adapter inspection | Test `P1.4` and Tests `10.9-10.11` pass. Preflight blocks invalid editions (422); OCC blocks collisions (409). | **VERIFIED COMPLIANT** |
| **CLM-14-05** | Per-Reporter WhatsApp Quota Configurability | Quotas configurable per reporter and persistent | Code inspection of `adapter.js` & `firestoreAdapter.js` | `setReporterWhatsAppQuota` implemented across memory, JSON, and Firestore adapters. | **VERIFIED COMPLIANT** |
| **CLM-14-06** | India Standard Time (IST) Quota Rollover | Quota resets daily at midnight `Asia/Kolkata` | Deterministic timestamp testing across day/month/leap year boundaries | Verified with `Intl.DateTimeFormat`: 23:59:59 UTC $\rightarrow$ IST boundary transition is exact. | **VERIFIED COMPLIANT** |
| **CLM-14-07** | Admin WhatsApp Quota API Endpoints | `PUT` and `GET /epaper/whatsapp/quota/:reporterId` exposed | Automated API integration tests & route inspection | Tests `P2.1-P2.4` pass. Role checks enforce `isChiefEditorOrMasterAdmin`. | **VERIFIED COMPLIANT** |
| **CLM-14-08** | Atomic Quota Consumption Concurrency | Requests cannot exceed configured limit | Concurrency threat modeling of `apiEngine.js:1633-1647` | ⚠️ TOCTOU race condition exists between `getReporterWhatsAppQuota` and `saveEpaperWhatsAppGeneration`. | ❌ **NON-COMPLIANT (OPEN P1)** |
| **CLM-14-09** | Public E-Paper API Contract Harmonization | `GET /epaper/editions` pagination contract resolved | Regression test run & `apiClient.ts` audit | Test `5` in `backend-master-admin-auth.test.js` passes. Client expects paginated `{ editions: [...], total }`. | **VERIFIED COMPLIANT** |
| **CLM-14-10** | Export Claims Accuracy & Removal of PDF/X-1a | Misleading PDF/X-1a header purged from `exportEngine.js` | Binary inspection of generated PDF buffer | Test `P4.1` confirms no `/GTS_PDFXVersion` string exists in generated PDF buffer. | **VERIFIED COMPLIANT** |
| **CLM-14-11** | Broadsheet Prepress Geometry | 32.9 cm x 52.0 cm broadsheet dimensions | Inspection of PDF MediaBox and TrimBox | MediaBox `[0 0 932.6 1474]` pt ($32.9 \times 52.0\text{ cm}$) confirmed. | **VERIFIED COMPLIANT** |
| **CLM-14-12** | 300 DPI Prepress Raster Export | 3886 x 6142 px PNG with 300 DPI metadata | Binary chunk inspection (`IHDR`, `pHYs`) | `pHYs` chunk contains 11,811 pixels/meter = 300 DPI. Color type is 0 (Grayscale). | **VERIFIED COMPLIANT** |

---

## 2. Core Business Rules Traceability

| Rule ID | Governing Rule | Specification Document | Implementation Location | Compliance Status |
| :--- | :--- | :--- | :--- | :---: |
| **BR-EDT-01** | Atomic Editorial Publishing Gate | `docs/06-Business-Rules.md` | `src/server/apiEngine.js:1126-1166` | **PARTIAL** (Blocked on status update, but open on initial creation) |
| **BR-EDT-02** | Immutable Edition Version Snapshots | `docs/05-Workflows.md` | `src/server/persistence/adapter.js:5303` | **COMPLIANT** |
| **BR-AUTH-01**| Role-Based Authorization for Publishing | `docs/14-Auth.md` | `src/server/apiEngine.js:1130` | **COMPLIANT** |
| **BR-AUTH-02**| Master Admin Authority for Quotas | `docs/14-Auth.md` | `src/server/apiEngine.js:1678` | **COMPLIANT** |
| **BR-PROD-01**| Core Web Vitals & Fast Rendering | `docs/04-NFR.md` | `src/server/epaper/exportEngine.js:382` | **COMPLIANT** (Grayscale optimization avoids OOM) |
| **BR-GEO-01** | 55 District Broadsheet Partitioning | `docs/06-Business-Rules.md` | `src/server/persistence/adapter.js:4615` | **COMPLIANT** |

---

## 3. Summary of Traceability Audit

Out of 12 critical verification claims evaluated:
- **10 Claims Verified Fully Compliant** (83.3%)
- **2 Claims Open / Partially Verified** (16.7%):
  - `CLM-14-03`: Creation-time bypass in `POST /api/v1/epaper/editions` allows bypassing publication gates.
  - `CLM-14-08`: Non-atomic quota increment introduces race conditions under burst concurrency.

Both items must be remediated in STEP 16 before approving a production staging promotion.
