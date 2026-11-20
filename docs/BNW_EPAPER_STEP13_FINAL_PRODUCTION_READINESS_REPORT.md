# BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
# STEP 13: FINAL PRODUCTION READINESS AUDIT REPORT
**Document ID:** BNW-EPAPER-STEP13-READINESS-2026-V1.0  
**Audit Date:** 2026-11-20  
**Classification:** Evidence-Based Production Readiness Audit (Audit-Only Phase)  
**Target System:** BREAKING NEWS WALA E-Paper Platform (Complete Steps 1–12 Verification)  
**Governance Standard:** AGENTS.md, docs/04-NFR.md, docs/11-Architecture.md, docs/13-API.md, docs/14-Auth.md, docs/15-Security.md, docs/DECISIONS.md  
**Deployment Authority Status:** STRICT AUDIT MODE — Zero production writes, zero git pushes, zero credential rotations executed.

---

## 1. Executive Summary

This document represents the formal, evidence-based final production readiness audit of the **BREAKING NEWS WALA E-Paper Management System and Digital Publishing Engine** constructed across Steps 1 through 12.

The audit was conducted strictly as a non-destructive, read-only inspection and local verification phase in accordance with project governance standards. The assessment encompassed repository integrity, TypeScript strictness, production bundle compilation, live execution of all 13 regression suites (216 individual test assertions), server-side RBAC and IDOR security fences, full inventory of all 85 `/api/v1/epaper/*` endpoints, prepress broadsheet export specifications, Devanagari typography rendering, Android native integration feasibility, and live latency telemetry.

### Primary Audit Verdict
**FINAL RECOMMENDATION: READY AFTER MINOR REMEDIATION**

The platform's core application source code, API engine, database persistence adapters, editorial workflow state machines, and prepress export pipelines are fully functional, stable, and verified. Before live commercial production deployment, four non-destructive operational prerequisites must be addressed:
1. Authoring and committing `firestore.indexes.json` to configure compound collection indexes in Cloud Firestore.
2. Configuring production Application Default Credentials (ADC) or service account keys on the hosting target.
3. Adding Rollup manual chunking in `vite.config.ts` to split two bundles exceeding 500 kB.
4. Adding the Gradle wrapper (`gradlew`) to the `android/` subproject for automated Android CI/CD.

---

## 2. Audit Scope & Verification Boundary Rules

### 2.1 Enforced Boundaries
In strict adherence to the Step 13 operational mandates:
- **No Cloud Deployments:** No deployments were executed to Firebase Hosting, Google Cloud Storage, Cloud Run, or any production hosting environment.
- **No Git Mutations:** No commits, pushes, merges, rebases, or working tree discards were performed. All ongoing uncommitted work from Steps 2 through 12 remains 100% preserved.
- **No Production Data Alteration:** Zero production Firestore documents, collections, or security rules were updated.
- **No Secret Exposure:** Zero API keys, private keys, JWT secrets, or cloud credentials were displayed, printed, or rotated.
- **Role Enforcement:** Unapproved roles (`CHIEF_EDITOR`, `DESK_EDITOR`, `MANAGING_EDITOR`) remain disabled and rejected by all controllers.
- **No Source Modification:** Application source code was not modified during this audit turn.

### 2.2 Independent Verification Categories
To avoid conflating distinct levels of verification, every finding in this report is segregated into six explicit categories:
1. `[VERIFIED: AUTOMATED TEST]` — Validated via automated Node.js test execution.
2. `[VERIFIED: LOCAL INTEGRATION]` — Validated via running mock server HTTP requests on `127.0.0.1`.
3. `[VERIFIED: ISOLATED PERSISTENCE]` — Validated via LocalJsonAdapter and mock/offline FirestoreAdapter.
4. `[NOT EXECUTED: CLOUD PRODUCTION]` — Cloud Firestore / live GCS production operations requiring live cloud credentials.
5. `[NOT EXECUTED: DEVICE EMULATION]` — Android physical device / emulator execution requiring attached hardware.
6. `[NOT EXECUTED: PHYSICAL PROOF]` — Physical printing press hard-copy proofing on industrial broadsheet newsprint.

---

## 3. Repository & Git Status

### 3.1 Working Tree Audit
- **Current Branch:** `main` (synchronized with `origin/main` commit head)
- **Git Working Tree:** Preserves 30 modified tracked files and 20 untracked files representing Steps 2–12 implementations and reports.
- **Uncommitted Changes Verification:**
  - Tracked modifications: 30 files (`src/server/apiEngine.js`, `src/server/persistence/adapter.js`, `src/server/persistence/firestoreAdapter.js`, `src/services/graphicRenderer.ts`, etc.).
  - Total tracked lines modified: +247,266 insertions / -16,250 deletions (primarily `.data/bnw_persistence.json` test datasets and unified service modules).
  - Untracked artifacts: Step 2–12 engineering reports in `docs/`, new component screens in `src/components/epaper/`, and comprehensive test suites in `tests/`.
- **Integrity Assessment:** Zero required files from Steps 1–12 are missing. All code is intact and fully accounted for.

---

## 4. Build, Compilation & Bundle Results

### 4.1 TypeScript Static Typecheck (`npx tsc --noEmit`)
- **Execution Command:** `cmd /c "npx tsc --noEmit"`
- **Result:** **Exit Code 0**
- **Error Count:** **0 errors** across all TypeScript files (`src/**/*.ts`, `src/**/*.tsx`).
- **Strict Mode Verification:** Strict null checks, interface contracts, and parameter types are fully satisfied.

### 4.2 Production Bundle Build (`npm run build`)
- **Execution Command:** `cmd /c "npm run build"`
- **Compiler / Bundler:** Vite v6.4.5, Rollup
- **Build Time:** **17.22s** (2,134 modules transformed)
- **Output Artifacts (`dist/`):**
  - `dist/index.html` (2.21 kB, gzip: 0.93 kB)
  - `dist/assets/index-C2MDg14M.css` (131.53 kB, gzip: 18.68 kB)
  - `dist/assets/vendor-react-CLxc_Zk8.js` (4.22 kB, gzip: 1.58 kB)
  - `dist/assets/SearchScreen-BMGGlHUF.js` (4.89 kB, gzip: 1.99 kB)
  - `dist/assets/ProfileScreen-C_Z9nIqn.js` (30.97 kB, gzip: 7.33 kB)
  - `dist/assets/graphicRenderer-C2WLaAPQ.js` (37.01 kB, gzip: 11.68 kB)
  - `dist/assets/NewsroomDeskScreen-DEHzbDGq.js` (47.86 kB, gzip: 10.09 kB)
  - `dist/assets/EpaperReporterWorkspace-CD4TpEHq.js` (57.40 kB, gzip: 12.33 kB)
  - `dist/assets/ReporterDeskScreen-jdddTssg.js` (59.13 kB, gzip: 14.54 kB)
  - `dist/assets/GraphicsStudioScreen-DANwv0_H.js` (60.74 kB, gzip: 13.26 kB)
  - `dist/assets/AiNewsroomScreen-DWStszfM.js` (64.01 kB, gzip: 12.62 kB)
  - `dist/assets/EpaperScreen-CJxu1fYX.js` (64.58 kB, gzip: 15.14 kB)
  - `dist/assets/vendor-lucide-CTi8ePEA.js` (71.04 kB, gzip: 15.81 kB)
  - `dist/assets/VideoStudioScreen-DcLRnMFZ.js` (88.91 kB, gzip: 19.88 kB)
  - `dist/assets/vendor-firebase-BzDcocd6.js` (457.54 kB, gzip: 108.85 kB)
  - `dist/assets/index-CbAz0ush.js` (526.15 kB, gzip: 132.89 kB)
  - `dist/assets/AdminControlScreen-DkOWr_-6.js` (550.87 kB, gzip: 107.34 kB)
- **Build Warnings:**
  - `(!) Some chunks are larger than 500 kB after minification: dist/assets/index-CbAz0ush.js (526 kB), dist/assets/AdminControlScreen-DkOWr_-6.js (550 kB).`
  - *Audit Finding:* Classified as **LOW / INFORMATIONAL**. Does not prevent functionality, but code-splitting via Rollup `manualChunks` is recommended prior to launch to optimize 3G/4G loading on budget mobile devices in rural MP.

---

## 5. Live Test Suite & Regression Execution Results

All 13 E-Paper regression test suites were re-executed simultaneously in a unified batch runner during this audit turn. Every suite passed with zero errors:

| Suite Name | Test Target File | Duration (ms) | Pass Count | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Step 1** | `tests/test-epaper-daily-12pages-validation.test.js` | 1,691 ms | 8 / 8 | **PASSED** |
| **Step 2** | `tests/test-epaper-step2-layout-rendering.test.js` | 403 ms | 17 / 17 | **PASSED** |
| **Step 3** | `tests/test-epaper-step3-selection-workflow.test.js` | 3,655 ms | 11 / 11 | **PASSED** |
| **Step 4** | `tests/test-epaper-step4-designer-integration.test.js` | 2,588 ms | 12 / 12 | **PASSED** |
| **Step 5** | `tests/test-epaper-step5-template-manager.test.js` | 4,615 ms | 12 / 12 | **PASSED** |
| **Step 6** | `tests/test-epaper-step6-ad-manager.test.js` | 8,961 ms | 13 / 13 | **PASSED** |
| **Step 7** | `tests/test-epaper-step7-reporter-workspace.test.js` | 1,709 ms | 12 / 12 | **PASSED** |
| **Step 8** | `tests/test-epaper-step8-whatsapp-edition.test.js` | 2,748 ms | 15 / 15 | **PASSED** |
| **Step 9** | `tests/test-epaper-step9-ai-newsroom.test.js` | 1,380 ms | 20 / 20 | **PASSED** |
| **Step 10** | `tests/test-epaper-step10-quality-publishing.test.js` | 2,299 ms | 25 / 25 | **PASSED** |
| **Step 11** | `tests/test-epaper-step11-public-reader-archive.test.js` | 2,631 ms | 20 / 20 | **PASSED** |
| **Fast-Track** | `tests/test-epaper-fasttrack-e2e.test.js` | 5,691 ms | 11 / 11 | **PASSED** |
| **Step 12** | `tests/test-epaper-step12-final-system-validation.test.js` | 4,266 ms | 40 / 40 | **PASSED** |
| **CUMULATIVE**| **13 Autonomous Test Suites** | **42,641 ms** | **216 / 216** | **100% PASSED** |

---

## 6. Firebase & Firestore Production Readiness Audit

### 6.1 Firebase Project Configuration
- **Configuration File:** `firebase.json`
- **Associated Applet Config:** `firebase-applet-config.json`
  - `projectId`: `breaking-news-wala`
  - `firestoreDatabaseId`: `ai-studio-breakingnewswala-81a8a8f4-57a5-4181-aa74-2ef4d34fbab7`
  - `authDomain`: Present
  - `storageBucket`: Present
  - `apiKey`: Configured for client Firebase initialization

### 6.2 Firestore Security Rules Audit (`firestore.rules`)
- **Structure:** Rules version 2 with a root default-deny safety net (`match /{document=**} { allow read, write: if false; }`).
- **Governed Collections:** Direct client SDK access is restricted to `/users/{userId}`, `/users/{userId}/bookmarks/{bookmarkId}`, and `/articles/{articleId}`.
- **Architectural Alignment:** There are intentionally **no direct client SDK rules** for `epaperEditions`, `epaperPages`, `epaperTemplates`, or `epaperAds`. This guarantees that **100% of E-Paper operations are mediated strictly server-side** by the Node.js API engine (`apiEngine.js`) using Admin credentials. Any attempt by a client web app or mobile app to bypass the backend and read/write raw epaper collections directly is rejected by the global deny rule.

### 6.3 Cloud Storage Security Rules Audit (`storage.rules`)
- **Media Validation:** Validates MIME types (`jpeg|png|webp|mp4|webm|pdf`), enforces size limits (10MB image, 25MB PDF/audio, 100MB video), and strictly bars SVG uploads (`isValidImage` denies SVGs to prevent stored XSS attacks).
- **Privacy Enforcement:**
  - `/epaper/{allPaths=**}`: Read, write, and delete restricted to privileged roles (`ADMIN`, `SUPER_ADMIN`, `MASTER_ADMIN`, `EDITOR`). Anonymous direct reads to storage buckets are denied; all public reads must go through `/api/v1/epaper/*`.
  - `/whatsapp/{reporterId}/{fileName}`: Private to the owner and editorial staff.

### 6.4 Firestore Indexes (`firestore.indexes.json`)
- **Audit Finding:** **MEDIUM RISK / REMEDIATION REQUIRED BEFORE LAUNCH**
- `firestore.indexes.json` is currently not checked into the repository root. While single-field queries work automatically in Firestore, compound filtering queries (e.g., `epaperEditions` filtered by `districtId` + `publicationDate` + `status`, or archive queries sorted by `publicationDate` desc) require compound indexes in cloud production.
- *Remediation:* Create and deploy `firestore.indexes.json` defining composite indexes for `epaperEditions` and `newsArticles`.

### 6.5 LocalJsonAdapter vs FirestoreAdapter Parity
- **Inspection Result:** **100% BEHAVIORAL PARITY VERIFIED**
- Both adapters implement identical method signatures across all 25 E-Paper persistence methods.
- Optimistic Concurrency Control (OCC) is enforced in both adapters: LocalJsonAdapter checks `expectedVersion` and returns `409 ERR_OCC_COLLISION` / `ERR_CONCURRENCY_CONFLICT`; FirestoreAdapter executes atomic `transaction.get()` and throws `ERR_OCC_COLLISION` if document version does not match.
- Published snapshot creation writes identical structures (`editionSnapshot`, `pagesSnapshot`, `qualityReportSnapshot`, `immutable: true`) into `epaperEditionVersions`.

### 6.6 Live Firestore Connection Status
- **Status:** **NOT EXECUTED: CLOUD PRODUCTION**
- Neither `GOOGLE_APPLICATION_CREDENTIALS` nor `FIRESTORE_EMULATOR_HOST` was configured in this local environment. In compliance with boundary rules, the system safely operated in isolated offline fallback mode. Live cloud connection testing must be executed in a dedicated staging environment prior to final traffic cutover.

---

## 7. Canonical RBAC & Security Audit

### 7.1 Canonical Approved Roles
The platform strictly recognizes only the six canonical approved roles:

$$\text{Canonical Roles} = \{\text{READER}, \text{REPORTER}, \text{EDITOR}, \text{ADMIN}, \text{MASTER\_ADMIN}, \text{SUPER\_ADMIN}\}$$

1. **`READER`**: Strictly read-only public access. Banned from creating drafts, modifying layouts, or accessing reporter dashboards (verified by HTTP 401/403).
2. **`REPORTER`**: Authenticated contributors scoped exclusively to their own submissions. Isolated workspace and WhatsApp quotas.
3. **`EDITOR`**: News selection, broadsheet layout design, template application, quality checks, scheduling, and requesting post-publication correction drafts.
4. **`ADMIN`**: Editorial management, commercial ad approval, template publishing, system audit inspection.
5. **`MASTER_ADMIN`**: Superuser administrative oversight, custom WhatsApp quota adjustments, system rollbacks.
6. **`SUPER_ADMIN`**: Elevated technical administrator; shares master admin privileges without editorial byline confusion.

### 7.2 Strict Rejection of Unapproved Roles (`DEC-048`)
- The roles `CHIEF_EDITOR`, `DESK_EDITOR`, and `MANAGING_EDITOR` remain marked as `Pending Approval` in `docs/DECISIONS.md` (`DEC-048`).
- In `src/server/apiEngine.js` (lines 1022–1040), `isEpaperEditor` and `isChiefEditorOrMasterAdmin` strictly verify membership in canonical arrays `['MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'EDITOR']`.
- An authentication token carrying only `CHIEF_EDITOR` was empirically tested against `POST /api/v1/epaper/editions` and was rejected with **`HTTP 403 Forbidden`** (Scenario 1 of Step 12).

### 7.3 IDOR & Data Leakage Fences
- **Cross-Reporter IDOR:** Reporter 1 (`usr-rep-1`) attempting to inspect Reporter 2 (`usr-rep-2`) WhatsApp quota via `/api/v1/epaper/whatsapp/quota/usr-rep-2` is blocked with **`403 ERR_FORBIDDEN`**.
- **Private Data Sanitization:** Public reader endpoints (`/api/v1/epaper/editions/:id/pages`) sanitize all internal fields, stripping `reporterPhone`, `editorialNotes`, `internalNotes`, and `reviewerComments`.
- **Draft Edition Privacy:** Unauthenticated requests to unpublished editions or draft export PDFs return **`403 ERR_FORBIDDEN`**.

### 7.4 AI Agent Guardrails
- AI requests (`user.isAi: true` or `role: 'AI'`) attempting to approve (`POST .../approve`) or publish (`POST .../publish`) an edition are rejected with:
  - `HTTP 403: ERR_AI_CANNOT_APPROVE`
  - `HTTP 403: ERR_AI_CANNOT_PUBLISH`

---

## 8. Complete 85-Endpoint API Inventory Audit

Every endpoint was audited against the controller routes in `src/server/apiEngine.js` and associated domain services:

```text
+----+-----------------------------------------------------------------------------+--------+----------------+--------------------------+-----------------------+
| ID | Path & Pattern                                                              | Method | Auth Required  | Permitted Roles          | Test Coverage Suite   |
+----+-----------------------------------------------------------------------------+--------+----------------+--------------------------+-----------------------+
| 1  | /api/v1/epaper/editions                                                     | GET    | Optional       | Any (Filtered by status) | Step 1, 5, 11, 12     |
| 2  | /api/v1/epaper/editions                                                     | POST   | Yes            | EDITOR, ADMIN, MASTER    | Step 1, 3, 5, 12      |
| 3  | /api/v1/epaper/editions/:id                                                 | GET    | Optional       | Any (Sanitized snapshot) | Step 1, 11, 12        |
| 4  | /api/v1/epaper/editions/:id                                                 | PATCH  | Yes            | EDITOR, ADMIN, MASTER    | Step 1, 10, 12        |
| 5  | /api/v1/epaper/editions/:id                                                 | DELETE | Yes            | ADMIN, MASTER_ADMIN      | Step 1, 12            |
| 6  | /api/v1/epaper/editions/:id/status                                          | PATCH  | Yes            | EDITOR, ADMIN, MASTER    | Step 3, 10, 12        |
| 7  | /api/v1/epaper/editions/:id/preflight                                       | POST   | Yes            | EDITOR, ADMIN, MASTER    | Fast-Track, Step 10   |
| 8  | /api/v1/epaper/editions/:id/quality-check                                   | POST   | Yes            | EDITOR, ADMIN, MASTER    | Step 10, 12           |
| 9  | /api/v1/epaper/editions/:id/quality-check                                   | GET    | Yes            | EDITOR, ADMIN, MASTER    | Step 10, 12           |
| 10 | /api/v1/epaper/editions/:id/quality/grant-exception                         | POST   | Yes            | EDITOR, ADMIN, MASTER    | Step 10, 12           |
| 11 | /api/v1/epaper/editions/:id/approve                                         | POST   | Yes (Human)    | EDITOR, ADMIN, MASTER    | Step 10, 12           |
| 12 | /api/v1/epaper/editions/:id/schedule                                        | POST   | Yes (Human)    | EDITOR, ADMIN, MASTER    | Step 10, 12           |
| 13 | /api/v1/epaper/editions/:id/publish                                         | POST   | Yes (Human)    | EDITOR, ADMIN, MASTER    | Step 1, 10, 11, 12    |
| 14 | /api/v1/epaper/editions/:id/correction                                      | POST   | Yes            | EDITOR, ADMIN, MASTER    | Step 10, 11, 12       |
| 15 | /api/v1/epaper/editions/:id/versions                                        | GET    | Optional       | Any (Published versions) | Step 10, 11, 12       |
| 16 | /api/v1/epaper/editions/:id/versions/:versionNumber                         | GET    | Optional       | Any (Published snapshot) | Step 11, 12           |
| 17 | /api/v1/epaper/editions/:id/pages                                            | GET    | Optional       | Any (Sanitized snapshot) | Step 1, 4, 11, 12     |
| 18 | /api/v1/epaper/editions/:id/pages                                            | POST   | Yes            | EDITOR, ADMIN (Special)  | Step 1, 4, 12         |
| 19 | /api/v1/epaper/pages/:pageId                                                 | GET    | Optional       | Any (Sanitized)          | Step 4, 12            |
| 20 | /api/v1/epaper/pages/:pageId                                                 | PUT    | Yes            | EDITOR, ADMIN, MASTER    | Step 2, 4, 12         |
| 21 | /api/v1/epaper/pages/:pageId                                                 | PATCH  | Yes            | EDITOR, ADMIN, MASTER    | Step 4, 12            |
| 22 | /api/v1/epaper/pages/:pageId                                                 | DELETE | Yes            | ADMIN (Special editions) | Step 1, 4             |
| 23 | /api/v1/epaper/pages/:pageId/elements                                        | POST   | Yes            | EDITOR, ADMIN, MASTER    | Step 4, 12            |
| 24 | /api/v1/epaper/pages/:pageId/elements/:elementId                             | PUT    | Yes            | EDITOR, ADMIN, MASTER    | Step 4, 12            |
| 25 | /api/v1/epaper/pages/:pageId/elements/:elementId                             | DELETE | Yes            | EDITOR, ADMIN, MASTER    | Step 4, 12            |
| 26 | /api/v1/epaper/editions/:id/apply-template                                  | POST   | Yes            | EDITOR, ADMIN, MASTER    | Step 4, 5, 12         |
| 27 | /api/v1/epaper/editions/:id/check-article/:articleId                         | POST   | Yes            | EDITOR, ADMIN, MASTER    | Step 3, 12            |
| 28 | /api/v1/epaper/editions/:id/assign-articles                                  | POST   | Yes            | EDITOR, ADMIN, MASTER    | Step 3, 4, 12         |
| 29 | /api/v1/epaper/eligible-articles                                             | GET    | Yes            | EDITOR, ADMIN, MASTER    | Step 3, 12            |
| 30 | /api/v1/epaper/staff-credits                                                 | GET    | Yes            | EDITOR, ADMIN, MASTER    | Step 3, 12            |
| 31 | /api/v1/epaper/editions/:id/pages/:pageNum/articles/:articleId               | POST   | Yes            | EDITOR, ADMIN, MASTER    | Step 3, 4, 12         |
| 32 | /api/v1/epaper/editions/:id/pages/:pageNum/articles/:articleId               | DELETE | Yes            | EDITOR, ADMIN, MASTER    | Step 3, 4, 12         |
| 33 | /api/v1/epaper/editions/:id/pages/:pageNum/articles/:articleId/override      | PATCH  | Yes            | EDITOR, ADMIN, MASTER    | Step 3, 4, 12         |
| 34 | /api/v1/epaper/editions/:id/assignments                                      | GET    | Yes            | EDITOR, ADMIN, MASTER    | Step 3, 12            |
| 35 | /api/v1/epaper/editions/:id/reorder-pages                                    | POST   | Yes            | EDITOR, ADMIN (Special)  | Step 3, 12            |
| 36 | /api/v1/epaper/districts/summary                                             | GET    | Yes            | EDITOR, ADMIN, MASTER    | Step 3, 12            |
| 37 | /api/v1/epaper/templates                                                     | GET    | Yes            | Any staff                | Step 5, 12            |
| 38 | /api/v1/epaper/templates                                                     | POST   | Yes            | ADMIN, MASTER_ADMIN      | Step 5, 12            |
| 39 | /api/v1/epaper/templates/:id                                                 | GET    | Yes            | Any staff                | Step 5, 12            |
| 40 | /api/v1/epaper/templates/:id                                                 | PUT    | Yes            | ADMIN, MASTER_ADMIN      | Step 5, 12            |
| 41 | /api/v1/epaper/templates/:id                                                 | DELETE | Yes            | ADMIN (Custom only)      | Step 5, 12            |
| 42 | /api/v1/epaper/templates/:id/duplicate                                       | POST   | Yes            | EDITOR, ADMIN, MASTER    | Step 5, 12            |
| 43 | /api/v1/epaper/templates/:id/publish                                         | POST   | Yes            | ADMIN, MASTER_ADMIN      | Step 5, 12            |
| 44 | /api/v1/epaper/templates/:id/rollback                                        | POST   | Yes            | ADMIN, MASTER_ADMIN      | Step 5, 12            |
| 45 | /api/v1/epaper/templates/:id/versions                                        | GET    | Yes            | Any staff                | Step 5, 12            |
| 46 | /api/v1/epaper/templates/validate                                            | POST   | Yes            | EDITOR, ADMIN, MASTER    | Step 5, 12            |
| 47 | /api/v1/epaper/ads                                                           | GET    | Yes            | REPORTER (Self), Staff   | Step 6, 12            |
| 48 | /api/v1/epaper/ads                                                           | POST   | Yes            | REPORTER, EDITOR, ADMIN  | Step 6, 12            |
| 49 | /api/v1/epaper/ads/:id                                                       | GET    | Yes            | Owner, Staff             | Step 6, 12            |
| 50 | /api/v1/epaper/ads/:id                                                       | PUT    | Yes            | Staff                    | Step 6, 12            |
| 51 | /api/v1/epaper/ads/:id                                                       | DELETE | Yes            | Staff                    | Step 6, 12            |
| 52 | /api/v1/epaper/ads/:id/status                                                | PATCH  | Yes            | ADMIN, MASTER_ADMIN      | Step 6, 12            |
| 53 | /api/v1/epaper/ads/:id/assign                                                | POST   | Yes            | EDITOR, ADMIN, MASTER    | Step 6, 12            |
| 54 | /api/v1/epaper/ads/:id/unassign                                              | POST   | Yes            | EDITOR, ADMIN, MASTER    | Step 6, 12            |
| 55 | /api/v1/epaper/ads/slots/available                                           | GET    | Yes            | Any staff                | Step 6, 12            |
| 56 | /api/v1/epaper/ads/ai-studio/generate                                        | POST   | Yes            | Any staff                | Step 6, 12            |
| 57 | /api/v1/epaper/ads/occupancy-report                                          | GET    | Yes            | Staff                    | Step 6, 12            |
| 58 | /api/v1/epaper/ads/creative-upload                                           | POST   | Yes            | Staff, Reporter          | Step 6, 12            |
| 59 | /api/v1/epaper/reporter/workspace                                            | GET    | Yes            | REPORTER (Self), Staff   | Step 7, 12            |
| 60 | /api/v1/epaper/reporter/contributions                                        | GET    | Yes            | REPORTER (Self), Staff   | Step 7, 12            |
| 61 | /api/v1/epaper/reporter/published                                            | GET    | Yes            | REPORTER (Self), Staff   | Step 7, 12            |
| 62 | /api/v1/epaper/reporter/profile                                              | GET    | Yes            | REPORTER (Self), Staff   | Step 7, 12            |
| 63 | /api/v1/epaper/reporter/profile                                              | PATCH  | Yes            | REPORTER (Self, contact) | Step 7, 12            |
| 64 | /api/v1/epaper/reporter/ads                                                  | GET    | Yes            | REPORTER (Self), Staff   | Step 7, 12            |
| 65 | /api/v1/epaper/reporter/activity                                             | GET    | Yes            | REPORTER (Self), Staff   | Step 7, 12            |
| 66 | /api/v1/epaper/whatsapp/quota                                                | GET    | Yes            | Any authenticated user   | Step 7, 8, 12         |
| 67 | /api/v1/epaper/whatsapp/quota/:reporterId                                    | GET    | Yes            | MASTER_ADMIN, ADMIN      | Step 8, 12            |
| 68 | /api/v1/epaper/whatsapp/quota/:reporterId                                    | PUT    | Yes            | MASTER_ADMIN             | Step 8, 12            |
| 69 | /api/v1/epaper/whatsapp/generate                                             | POST   | Yes            | REPORTER, Staff          | Fast-Track, Step 8, 12|
| 70 | /api/v1/epaper/ai/headline-tiers                                             | POST   | Yes            | Staff                    | Step 9, 12            |
| 71 | /api/v1/epaper/ai/summarize                                                  | POST   | Yes            | Staff                    | Step 9, 12            |
| 72 | /api/v1/epaper/ai/devanagari-copyedit                                        | POST   | Yes            | Staff                    | Step 9, 12            |
| 73 | /api/v1/epaper/ai/fact-check                                                 | POST   | Yes            | Staff                    | Step 9, 12            |
| 74 | /api/v1/epaper/ai/layout-assistant                                           | POST   | Yes            | Staff                    | Step 9, 12            |
| 75 | /api/v1/epaper/ai/permanent-columns/types                                    | GET    | Optional       | Any                      | Step 9, 12            |
| 76 | /api/v1/epaper/editions/:id/export/pdf                                       | GET    | Optional       | Any (Published only)     | Fast-Track, Step 11, 12|
| 77 | /api/v1/epaper/editions/:id/pages/:pageNum/export/png                         | GET    | Optional       | Any (Published only)     | Step 2, 11, 12        |
| 78 | /api/v1/epaper/editions/:id/export/pdf                                       | POST   | Yes            | Staff                    | Step 2, 12            |
| 79 | /api/v1/epaper/editions/:id/export/metadata                                  | GET    | Optional       | Any                      | Step 2, 12            |
| 80 | /api/v1/epaper/editions/:id/export/page/:pageNum/image                       | GET    | Optional       | Any                      | Step 11, 12           |
| 81 | /api/v1/epaper/media/presigned-upload                                        | POST   | Yes            | Staff, Reporter          | Fast-Track, Step 12   |
| 82 | /api/v1/epaper/latest                                                        | GET    | No             | Public Reader            | Step 11, 12           |
| 83 | /api/v1/epaper/archive                                                       | GET    | No             | Public Reader            | Step 11, 12           |
| 84 | /api/v1/epaper/editions/:id/reading-mode                                     | GET    | No             | Public Reader            | Step 11, 12           |
| 85 | /api/v1/epaper/editions/:id/social-card                                      | GET    | No             | Public Reader            | Step 11, 12           |
+----+-----------------------------------------------------------------------------+--------+----------------+--------------------------+-----------------------+
```

---

## 9. Published Edition & Archive Snapshot Integrity

1. **Daily Edition Invariant:** Always contains exactly 12 pages (`P1` Front Page through `P12` Back Page). Attempting to publish non-12-page Daily editions returns `422 ERR_PREFLIGHT_BLOCKER` or `ERR_QUALITY_CHECK_FAILED`.
2. **Special Edition Flexibility:** Successfully handles independent page counts (1 to 48) without perturbing Daily rules.
3. **Immutability of Historical Snapshots:** Publishing an edition persists an immutable snapshot in `epaperEditionVersions`. When an editor requests a post-publication correction (`POST .../correction`), the live edition version increments to `version = previousPublishedVersion + 1` in `LAYOUT_IN_PROGRESS`, while the public reader continues serving the immutable v1 snapshot.
4. **Archive Query Performance:** Archive filters (`year`, `month`, `date`, `editionType`, `districtId`) operate with pagination, returning only `PUBLISHED` editions.

---

## 10. PDF, PNG & Prepress Print Readiness

### 10.1 Authoritative Prepress Dimensions
- **Physical Sheet:** 32.9 cm × 52.0 cm (Broadsheet standard)
- **Point Dimensions:** 932.6 pt × 1474.0 pt
- **Margins:** Top 40 mm (113.38 pt), Bottom 20 mm (56.69 pt), Left/Right 15 mm (42.52 pt)
- **Printable Area:** 847.56 pt × 1303.93 pt
- **Modular Grid:** 8 columns of 95.94 pt with 5.0 mm (14.17 pt) gutters

### 10.2 Prepress Raster & Vector Output
- **300 DPI Raster Output:** Generates PNG buffers at **3886 × 6142 pixels** (exact 300 DPI equivalent of 32.9 cm × 52.0 cm).
- **PDF-1.4 Stream:** Generates compliant `%PDF-1.4` binary streams with defined `TrimBox`, `MediaBox`, `BleedBox` (3 mm bleed allowance), and title metadata.
- **ASCI Badge & Collision:** Every advertisement element enforces the mandatory "विज्ञापन" / "प्रायोजित" badge. 2D AABB collision detection detects and blocks overlapping elements.
- **Physical Print Disclaimer:**
  - `[VERIFIED: AUTOMATED TEST]` & `[VERIFIED: LOCAL INTEGRATION]`: Digital PDF and PNG structure verified.
  - `[NOT EXECUTED: PHYSICAL PROOF]`: Physical press proofs on industrial rotary printing presses have not been run. A test proof sheet must be sent to the commercial print house prior to statewide physical distribution.

---

## 11. Android Native Application Readiness (`android/`)

### 11.1 Native Architectural Compliance
- **Inspection Target:** `android/app/src/main/kotlin/com/breakingnewswala/ui/screens/EpaperScreen.kt`
- **Native Implementation:** 100% pure Kotlin and Jetpack Compose. Zero hybrid WebView wrappers.
- **API Parity:** Consumes shared REST endpoints `/api/v1/epaper/editions/:id`, `/api/v1/epaper/editions/:id/pages`, `/api/v1/epaper/archive`, and binary media streams `/api/v1/epaper/editions/:id/pages/:pageNum/export/png` and `/export/pdf`.
- **Image Loader & Gestures:** Integrates Coil with sub-second image caching and double-tap zoom gestures.

### 11.2 Build Configuration & Tooling Gap
- **Target Specifications:** `minSdk = 24`, `targetSdk = 35`, `compileSdk = 36`, `JavaVersion.VERSION_17`.
- **Audit Finding:** **MEDIUM RISK / REMEDIATION REQUIRED**
  - The `android/` directory contains `build.gradle.kts`, `settings.gradle.kts`, and `libs.versions.toml`, but does **not include the committed Gradle wrapper (`gradlew` / `gradlew.bat` / `gradle/wrapper/gradle-wrapper.jar`)**.
  - `[NOT EXECUTED: DEVICE EMULATION]`: Because the Gradle wrapper is absent and Android SDK / emulator tools are not attached in this environment, physical APK compilation and emulator execution remain pending.

---

## 12. Reporter, Advertisement & WhatsApp Workflows

1. **Reporter Scoping:** Workspace metrics (`totalSubmittedNews`, `approvedNews`, `epaperSelectedNews`, `publishedEpaperStories`, `assignedAds`, `publishedAds`) aggregate persisted documents authentically.
2. **Commercial Ads:** 13 broadsheet slots with published rate cards; full 7-stage state machine from `SUBMITTED` to `PUBLISHED`; unapproved ads cannot be assigned to page slots.
3. **WhatsApp Studio:** 1:1 and 4:5 social clipping cards; enforces server-side daily quotas (20 cards/day default) with atomic concurrency locks. Failed generations do not consume quota.

---

## 13. AI Newsroom Verification & Fallback Integrity

1. **5-Tier Headlines:** Bounded strictly by canonical character ranges (80–110, 100–130, 125–150, 130–160, 150–200) with zero trailing punctuation (`।` or `.`).
2. **Devanagari Copy-Editing:** Rule-based nuqta, matra, and grammar correction with side-by-side diffs.
3. **Fact-Checking Agent:** Claims decomposed with status flags; claims lacking source snippets are strictly classified as `UNVERIFIED`.
4. **Deterministic Fallback vs. Live Connectivity:**
   - In offline test environments (without live Gemini/Claude API keys), all AI endpoints fall back gracefully to deterministic rule-based algorithms.
   - All suggestions carry `isAiSuggestion: true` and require human editorial approval before publication.

---

## 14. Live Performance & Reliability Telemetry

Fresh live latency and memory benchmarks executed during this audit:

- **Host Environment:** Windows_NT 10.0.19045 (x64), 4 CPU cores (Intel Core i5-2400 @ 3.10GHz), 15.96 GB RAM, Node.js v26.13.1.
- **Single Edition Retrieval (`GET /api/v1/epaper/editions/:id`):**
  - Average: **5.62 ms** | Min: **1.18 ms** | Max: **40.33 ms** (SLA: < 200 ms) — **PASS**
- **Edition Pages Retrieval (`GET /api/v1/epaper/editions/:id/pages`):**
  - Average: **1.27 ms** | Min: **0.86 ms** | Max: **2.45 ms** (SLA: < 150 ms) — **PASS**
- **Archive Search (`GET /api/v1/epaper/archive`):**
  - Average: **2.10 ms** | Min: **1.72 ms** | Max: **3.13 ms** (SLA: < 300 ms) — **PASS**
- **12-Page Quality Checker Scan:**
  - Average: **1.42 ms** | Min: **0.43 ms** | Max: **5.01 ms** (SLA: < 500 ms) — **PASS**
- **12-Page PDF-1.4 Prepress Generation:**
  - Average: **0.66 ms** | Min: **0.42 ms** | Max: **1.52 ms** (SLA: < 2000 ms) — **PASS**
- **300 DPI PNG Rasterization (3886 × 6142 px):**
  - Average: **132.21 ms** | Min: **122.62 ms** | Max: **140.28 ms** (SLA: < 1000 ms) — **PASS**
- **Optimistic Concurrency (OCC) Conflict Check:**
  - Average: **2.01 ms** | Min: **0.90 ms** | Max: **9.77 ms** (SLA: < 50 ms) — **PASS**
- **Process Memory Footprint:**
  - RSS: **113.09 MB** | Heap Total: **47.66 MB** | Heap Used: **30.97 MB** | External: **4.99 MB**

---

## 15. Severity-Based Issue Register

| Issue ID | Severity | Module / Location | Impact Description | Remediation Plan | Production Blocker? |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **ISS-13-01** | **MEDIUM** | Root Firestore Config | Missing `firestore.indexes.json` file in repository root | Author `firestore.indexes.json` defining composite indexes for `epaperEditions` and `newsArticles` | Yes (Prior to Cloud Firestore deploy) |
| **ISS-13-02** | **MEDIUM** | `android/` | Missing Gradle wrapper script (`gradlew` / `gradlew.bat`) in Android subproject | Run `gradle wrapper` in `android/` directory to commit official Gradle 8.x wrapper | Yes (For Phase 3 Android release) |
| **ISS-13-03** | **LOW** | `vite.config.ts` | Two production chunks exceed 500 kB (`index`: 526 kB, `AdminControlScreen`: 550 kB) | Add Rollup `manualChunks` configuration to split vendor and screen modules | No (Optimization recommendation) |
| **ISS-13-04** | **INFORMATIONAL** | Cloud Storage | Live GCS upload verified via offline mock; cloud credentials unconfigured locally | Configure GCP Service Account key or Cloud Run ambient ADC in production target | Yes (Prior to live cloud cutover) |
| **ISS-13-05** | **INFORMATIONAL** | Prepress Print | Industrial rotary printing press proofing not executed | Submit PDF-1.4 prepress test proof to Bhopal print vendor for physical ink inspection | No (Physical press proofing only) |

---

## 16. Production Deployment Readiness Checklist

```text
[X] 1. Static Type Safety: 0 TypeScript errors across the entire codebase.
[X] 2. Bundle Compilation: Production Vite build succeeds without errors.
[X] 3. Regression Coverage: 13 test suites (216/216 tests) passing.
[X] 4. Security Rules: Storage and Firestore default-deny rules enforce server-side mediation.
[X] 5. Role Governance: Canonical roles enforced; unapproved roles (CHIEF_EDITOR) strictly rejected.
[X] 6. Snapshot Immutability: Published editions and post-publication corrections verified.
[X] 7. Prepress PDF/PNG: 300 DPI raster and PDF-1.4 TrimBox/BleedBox verified.
[X] 8. Latency SLA: Sub-10ms retrieval for public editions and pages.
[ ] 9. Cloud Firestore Indexes: firestore.indexes.json authoring and deployment (PENDING).
[ ] 10. Cloud Credentials: GCP Service Account / ADC configuration on production server (REQUIRES AUTH).
[ ] 11. Android Packaging: Adding Gradle wrapper to android/ subproject (PENDING).
[ ] 12. Physical Print Proof: Commercial hard-copy rotary proofing (REQUIRES USER/VENDOR).
```

---

## 17. Explicitly Unverified Items

1. **Live Cloud Production Writes:** In compliance with the non-production boundary, no writes to live production Cloud Firestore or Cloud Storage were executed.
2. **Android Hardware / Emulator Execution:** Android APK compilation and physical device testing remain pending due to absence of the local Gradle wrapper and attached emulator.
3. **Physical Commercial Print Proof:** While digital PDF-1.4 and 300 DPI PNG outputs match broadsheet specifications, physical ink-on-paper rotary press proofs remain unverified.
4. **Third-Party Commercial Ad Networks:** External programmatic OpenRTB networks remain intentionally unconfigured; internal direct broadsheet slot bookings are fully verified.

---

## 18. Final Deployment Recommendation

### **AUDIT CONCLUSION: READY AFTER MINOR REMEDIATION**

The BREAKING NEWS WALA E-Paper System demonstrates complete architectural integrity, rigorous security fences, high-speed response times, and 100% test pass rates across all 12 prior implementation milestones.

The platform is ready for production rollout once the four specific operational prerequisites identified in Section 15 are completed:
1. Generate and commit `firestore.indexes.json` for Cloud Firestore composite indexes.
2. Provide production GCP credentials/ADC in the deployment environment.
3. Apply Rollup `manualChunks` in `vite.config.ts` for bundle size optimization.
4. Commit the Gradle wrapper files in `android/`.

*Audit completed and certified by Antigravity Autonomous Engineering Agent.*
