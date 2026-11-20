# BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
## E-Paper Module Remediation: STEP 3 Completion Report
### Document ID: DOC-EPAPER-STEP3-SELECTION-WORKFLOW-2026-V1.0
### Scope: News Selection Desk, 8-Stage Editorial Workflow, Page Assignment & Editorial Credit Integrity
### Classification: Authoritative Engineering Report (Step 3 Complete)

---

## 1. Executive Summary

In accordance with **STEP 3** of the E-Paper Management System remediation roadmap, this report documents the complete implementation, hardening, and verification of the **News Selection Desk & Editorial Workflow**.

The objective of STEP 3 was to deliver an intuitive, high-speed editorial intake and assignment desk integrated into the existing BREAKING NEWS WALA application architecture, featuring:
1. **Multi-Filter & Search Matrix**: Comprehensive search (headline, ID, keywords, body, author) and multi-filters (all 55 MP districts, categories, priority, featured image presence, word-count length).
2. **Newsroom Operational Dashboard Tabs & Page-wise Overview**: Real-time operational queues with dynamic badges (All, Pending Editorial Review, Approved for E-Paper, Assigned to Pages, Pending Proofreading, Final Approved, Recently Updated) plus a 12-page bird's-eye modal (`समस्त पृष्ठ दृश्य`) displaying article distribution across all broadsheet pages.
3. **8-Stage Editorial Workflow State Machine**: Server-authoritative sequence enforcing stage order and preventing unauthorized stage skipping:
   $$\text{NEWS RECEIVED} \longrightarrow \text{EDITORIAL REVIEW} \longrightarrow \text{APPROVED FOR E-PAPER} \longrightarrow \text{ASSIGNED TO PAGE} \longrightarrow \text{PAGE DESIGNED} \longrightarrow \text{QUALITY CHECK} \longrightarrow \text{FINAL APPROVED} \longrightarrow \text{PUBLISHED}$$
4. **Strict Approval Gate**: Section 2 invariant enforced—news articles cannot be assigned to any E-Paper page before formal approval (`400 ERR_ARTICLE_NOT_APPROVED`).
5. **Concurrent Duplicate Assignment Prevention**: Pre-assignment duplicate detection returning `409 ERR_DUPLICATE_ASSIGNMENT` with page coordinates, interactive amber warnings in UI, and a safe confirmation modal for intentional duplicate placements (`forceDuplicate: true`).
6. **Editorial Credit Integrity**: Strict server-side extraction of authenticated reporter credits from original news articles, editor credits selected from verified authorized staff (`GET /api/v1/epaper/staff-credits`), with missing-credit alert flags (`missingReporterCredit`, `missingEditorCredit`).
7. **Source Article & Published Snapshot Immutability**: Guaranteeing that news articles in `newsArticles` are never mutated or deleted upon assignment, layout override, or removal from an edition page, and published editions strictly reject assignment/removal modifications.

---

## 2. Architecture of the News Selection Desk

### 2.1 Workspace Layout & Component Hierarchy
The News Selection Desk is implemented in [`src/components/epaper/EpaperNewsSelectionDesk.tsx`](file:///d:/BREAKING-NEWS-WALA-main/src/components/epaper/EpaperNewsSelectionDesk.tsx) and features a responsive split-screen editorial console:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   TOP CONTROL & AUDIT HEADER                                     │
│  [← Back]  Edition Code • Title • Publication Date • Total Pages (12) • [Layout Designer ↗]     │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                 AUTHORITATIVE BROADSHEET PAGE TABS                               │
│  [P1: मुख्य समाचार (8)]  [P2: प्रादेशिक 1 (4)]  [P3: प्रादेशिक 2 (3)] ... [P12: खेल एवं विविध (6)]│
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                  MULTI-ROW FILTER & SEARCH BAR                                   │
│  🔍 Search Input (Headline, ID, Author)  |  Sort: [Latest ▼ / Priority / Relevance]              │
│  District: [55 MP Districts] | Priority: [Urgent/High/Normal] | Status: [Approved/Published]     │
│  Length: [<100 / 100-300 / >300] | [✓] Only Stories with Photo  | Category Pills (8 Categories)  │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                     BULK ACTION TOOLBAR (Conditional on Selection ≥ 1)                           │
│  [✓] 3 Stories Selected  | Target: [Page 2 ▼] | Editor: [Dinesh Agnihotri ▼] | [+ Add 3 Stories] │
├───────────────────────────────────────────────────────┬──────────────────────────────────────────┤
│     LEFT PANEL (7 Cols): APPROVED STORIES QUEUE       │    RIGHT PANEL (5 Cols): ACTIVE PAGE     │
│  • Select All Checkbox                                │  • Active Page Headline & Col Count (8C) │
│  • Approved Article Cards:                            │  • Assigned Page Element Cards:          │
│    - Selection checkbox & Priority badge              │    - Reorder (Up / Down) & #Position     │
│    - Duplicate placement warning banner               │    - Role Selector (Lead, Anchor, Brief) │
│    - Workflow stage pill                              │    - Print Headline Override input       │
│    - Thumbnail with missing-image fallback            │    - Reporter credit & Byline input      │
│    - Word count & Reading length pill                 │    - Editor credit & Photo credit pills  │
│    - Reporter attribution & Missing credit alerts     │    - Missing credit warning banners      │
│    - [Preview (Eye)] & [+ Add to Page P1] buttons     │    - [Trash] Remove (Safe from DB)       │
└───────────────────────────────────────────────────────┴──────────────────────────────────────────┘
```

### 2.2 Modals & User Feedback Controls
1. **Article Preview Modal (`previewArticle`)**:
   - Displays full headline, complete article text, high-res photo with caption and photographer credit.
   - Interactive 8-step workflow progression tracker.
   - Missing photo warning (`⚠️ फ़ोटो अनुपलब्ध - केवल टेक्स्ट स्टोरी`) and missing reporter credit warning (`⚠️ रिपोर्टर क्रेडिट अनुपलब्ध`).
   - Quick "इस पृष्ठ पर जोड़ें" and "ई-पेपर स्वीकृत करें" CTAs.
2. **Duplicate Assignment Confirmation Modal (`duplicateConfirm`)**:
   - Triggers when an editor attempts single or bulk assignment of a story already placed on another page.
   - Informs the editor of the existing placement: *"समाचार [शीर्षक] पहले से पृष्ठ X पर असाइन है। क्या आप इसे पृष्ठ Y पर भी सम्मिलित करना चाहते हैं?"*
   - Offers "रद्द करें (Cancel)" or "पुष्टि करें एवं जोड़ें (Confirm & Add)" passing `forceDuplicate: true`.
3. **Page-wise Bird's-Eye Overview Modal (`showPageOverview`)**:
   - Accessible via the "समस्त पृष्ठ दृश्य (12 पृष्ठ)" button in the header.
   - Provides a comprehensive grid of all 12 broadsheet pages showing section type, assigned article count, lead headlines, and direct "पृष्ठ पर जाएं (Go to Page)" jump navigation.

---

## 3. Server-Authoritative Editorial Workflow

### 3.1 The 8 Workflow Stages
The workflow state machine is defined in [`src/server/persistence/adapter.js`](file:///d:/BREAKING-NEWS-WALA-main/src/server/persistence/adapter.js) and [`src/server/persistence/firestoreAdapter.js`](file:///d:/BREAKING-NEWS-WALA-main/src/server/persistence/firestoreAdapter.js):

| Step | State Identifier | Hindi Label | Description & Gate Requirements |
|:---:|:---|:---|:---|
| **1** | `NEWS_RECEIVED` | समाचार प्राप्त | News item submitted by reporter, wire feed, or RSS intake. |
| **2** | `EDITORIAL_REVIEW` | संपादकीय समीक्षा | Newsroom desk review and fact-checking queue. |
| **3** | `APPROVED_FOR_EPAPER` | ई-पेपर स्वीकृत | Editor or Admin approves article as eligible for print/e-paper edition. |
| **4** | `ASSIGNED_TO_PAGE` | पृष्ठ पर असाइन | Article placed onto a broadsheet page (P1–P12). |
| **5** | `PAGE_DESIGNED` | पृष्ठ डिज़ाइन पूर्ण | Layout designer positions, scales, and wraps columns on the page. |
| **6** | `QUALITY_CHECK` | गुणवत्ता जांच | Proofreading and Quality Preflight Scanner verification. |
| **7** | `FINAL_APPROVED` | अंतिम अनुमोदन | Executive sign-off (**Chief Editor or Master Admin only**). |
| **8** | `PUBLISHED` | प्रकाशित | Edition locked into immutable snapshot (`publishEpaperEdition`). |

### 3.2 State Transition & Role Authorization Rules
- **Stage Skip Prevention**: Forward transitions cannot skip intermediate stages (e.g., jumping from `NEWS_RECEIVED` directly to `FINAL_APPROVED` or `ASSIGNED_TO_PAGE` is rejected with `400 ERR_STAGE_SKIP_FORBIDDEN`).
- **Backward Transitions Permitted**: Reverting for editorial rework or corrections (e.g., from `QUALITY_CHECK` back to `PAGE_DESIGNED` or `EDITORIAL_REVIEW`) is fully supported.
- **RBAC Enforcement**:
  - `READER` or `REPORTER` tokens are rejected with `403 ERR_FORBIDDEN`.
  - Advancing to `FINAL_APPROVED` requires `CHIEF_EDITOR`, `ADMIN`, `SUPER_ADMIN`, or `MASTER_ADMIN`.
- **Audit Logging**: Every workflow transition records `{ from, to, changedAt, changedBy, remarks }` in the article's `epaperWorkflow.history` and appends a system audit log.

---

## 4. RESTful API Contracts Implemented

The following endpoints were added to [`src/server/apiEngine.js`](file:///d:/BREAKING-NEWS-WALA-main/src/server/apiEngine.js) and [`src/services/apiClient.ts`](file:///d:/BREAKING-NEWS-WALA-main/src/services/apiClient.ts):

### 4.1 `GET /api/v1/epaper/eligible-articles`
- **Purpose**: Retrieves approved, eligible news articles for the Selection Desk.
- **Query Parameters**:
  - `search`: Full-text query on headline, article ID, body, keywords, author, and district.
  - `districtId` / `district`: Filter by MP district.
  - `categoryId` / `category`: Filter by news category.
  - `priority`: Filter by priority (`URGENT`, `HIGH`, `MEDIUM`, `LOW`).
  - `approvalStatus`: Filter by status (`APPROVED`, `PUBLISHED`, `APPROVED_FOR_EPAPER`).
  - `hasImage`: Boolean (`true` = featured image only; `false` = text only).
  - `length`: Article size filter (`SHORT` < 100, `MEDIUM` 100-300, `LONG` > 300 words).
  - `sort`: Ordering (`latest`, `priority`, `relevance`).
  - `page`, `limit`: Standard pagination.
- **Security**: Requires authenticated Editor or Admin (`isEpaperEditor(user)`).

### 4.2 `POST /api/v1/epaper/articles/:id/workflow-status`
- **Purpose**: Moves an article through the 8-stage editorial workflow.
- **Payload**: `{ targetStatus: string, remarks?: string, editionId?: string, pageNumber?: number }`.
- **Security**: Enforces stage sequence, rejects skips (`400 ERR_STAGE_SKIP_FORBIDDEN`), restricts `FINAL_APPROVED` to Chief Editor / Admin (`403 ERR_FORBIDDEN`).

### 4.3 `POST /api/v1/epaper/editions/:id/assign-articles`
- **Purpose**: Assigns one or multiple articles to a specific page number.
- **Payload**: `{ pageNumber: number, articleIds: string[], editorCredit?: string, colSpan?: number, role?: string, forceDuplicate?: boolean }`.
- **Validation**:
  - Rejects assignment to published editions (`400 ERR_EDITION_ALREADY_PUBLISHED`).
  - Rejects page numbers outside edition boundaries (`400 ERR_INVALID_PAGE_NUMBER`).
  - Detects duplicate placements within edition, returning `409 ERR_DUPLICATE_ASSIGNMENT` unless `forceDuplicate: true`.
  - Preserves authenticated reporter credit, sets editor credit, and sets missing-credit warning flags.
  - Advances article workflow status to `ASSIGNED_TO_PAGE`.

### 4.4 `DELETE /api/v1/epaper/editions/:id/pages/:pageNum/articles/:articleId`
- **Purpose**: Removes an article element from an unpublished edition page.
- **Security & Immutability**:
  - Rejects removal from published editions (`400 ERR_EDITION_ALREADY_PUBLISHED`).
  - Original news article in `newsArticles` is **never deleted or modified** (`sourceArticlePreserved: true`).
  - Reverts article workflow status to `APPROVED_FOR_EPAPER` if no longer on any page of the edition.

### 4.5 `GET /api/v1/epaper/staff-credits`
- **Purpose**: Returns authorized editorial staff members (`EDITOR`, `DESK_EDITOR`, `CHIEF_EDITOR`, `ADMIN`, `MASTER_ADMIN`) for safe dropdown selection, preventing credit fabrication or impersonation.

---

## 5. Summary of Files Changed

| File Path | Nature of Changes |
|:---|:---|
| [`src/types/index.ts`](file:///d:/BREAKING-NEWS-WALA-main/src/types/index.ts) | Added `editorCredit`, `missingReporterCredit`, `missingEditorCredit` to `EpaperPageElement`; added `epaperWorkflow` tracking metadata to `ArticleDetail`. |
| [`src/server/persistence/adapter.js`](file:///d:/BREAKING-NEWS-WALA-main/src/server/persistence/adapter.js) | Implemented `getEligibleEpaperArticles`, `updateArticleWorkflowStatus`, `assignArticlesToEditionPage`, `removeArticleFromEditionPage`, and `getEditorialStaffCredits` in `LocalJsonPersistenceAdapter`; added fail-closed stubs to `ProductionPersistenceGuard`. |
| [`src/server/persistence/firestoreAdapter.js`](file:///d:/BREAKING-NEWS-WALA-main/src/server/persistence/firestoreAdapter.js) | Implemented matching Firestore methods for production parity across Cloud Run / Firebase containers. |
| [`src/server/apiEngine.js`](file:///d:/BREAKING-NEWS-WALA-main/src/server/apiEngine.js) | Added route matchers and RBAC handlers for `/api/v1/epaper/eligible-articles`, `/api/v1/epaper/articles/:id/workflow-status`, `/api/v1/epaper/editions/:id/assign-articles`, `/api/v1/epaper/editions/:id/pages/:pageNum/articles/:articleId`, and `/api/v1/epaper/staff-credits`; hardened `sendError` with top-level `code` and `message`. |
| [`src/services/apiClient.ts`](file:///d:/BREAKING-NEWS-WALA-main/src/services/apiClient.ts) | Added client SDK methods under `apiClient.epaper`: `getEligibleArticles`, `updateArticleWorkflowStatus`, `assignArticlesToPage`, `removeArticleFromPage`, and `getStaffCredits`. |
| [`src/components/epaper/EpaperNewsSelectionDesk.tsx`](file:///d:/BREAKING-NEWS-WALA-main/src/components/epaper/EpaperNewsSelectionDesk.tsx) | Complete revamp: multi-filter bar (55 districts, categories, priority, image, length), sort dropdown, bulk selection toolbar, Article Preview Modal with 8-step workflow tracker, Duplicate Assignment Confirmation Modal, print copy overrides, and source article immutability notice. |
| [`tests/test-epaper-step3-selection-workflow.test.js`](file:///d:/BREAKING-NEWS-WALA-main/tests/test-epaper-step3-selection-workflow.test.js) | New comprehensive 11-test suite validating all Step 3 functional and security requirements. |

---

## 6. Empirical Test Results & Verification

### 6.1 Step 3 Test Suite (`tests/test-epaper-step3-selection-workflow.test.js`)
Executed with Node.js built-in test runner:
```
▶ STEP 3: E-PAPER NEWS SELECTION DESK & EDITORIAL WORKFLOW
  ✔ 1. Eligible Articles Query: Only approved/eligible articles enter selection desk (unapproved drafts excluded) (245.2252ms)
  ✔ 2. Multi-Filter Matrix: Filters by district, category, image presence, length, and keyword search (118.229ms)
  ✔ 3. Sorting Engine: Correctly orders articles by latest, priority, and editorial relevance (28.3669ms)
  ✔ 4. Duplicate Assignment Prevention: Rejects duplicate assignment with 409 ERR_DUPLICATE_ASSIGNMENT; permits forceDuplicate (398.936ms)
  ✔ 5. Page Assignment: Daily 12-page boundary enforcement & Special Edition independent page counts (392.6527ms)
  ✔ 6. Source Article Immutability: Original news article in newsArticles is NEVER modified or deleted on assignment, override, or removal (317.0016ms)
  ✔ 7. Published Edition Immutability: Published editions strictly reject article assignment and removal modifications (389.7347ms)
  ✔ 8. Editorial Workflow State Machine: Enforces 8-stage sequence and prevents stage skipping (219.6957ms)
  ✔ 9. RBAC & Security: Unauthorized roles (READER, REPORTER) blocked; FINAL_APPROVED restricted to Chief Editor (51.393ms)
  ✔ 10. Editorial Credit Integrity: Reporter credit from source article; editor credit from staff; missing warnings (343.2434ms)
  ✔ 11. Unapproved Article Assignment Rejection: A news article cannot be assigned to an E-Paper page before approval (110.2458ms)
✔ STEP 3: E-PAPER NEWS SELECTION DESK & EDITORIAL WORKFLOW (2675.7917ms)
ℹ tests 11
ℹ suites 1
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2731.0144
```
**Result**: **11 out of 11 tests passed (100% pass rate).**

### 6.2 Regression Test Suites (Step 1 & Step 2)
Executed `node --test tests/test-epaper-daily-12pages-validation.test.js tests/test-epaper-step2-layout-rendering.test.js`:
```
▶ STEP 1: E-Paper Daily Edition Page Count & Edition Validation (7 tests) - ALL PASSED
▶ 1. Image Rendering & Asset Pipeline (3 tests) - ALL PASSED
▶ 2. Headline and Text Overflow Protection (3 tests) - ALL PASSED
▶ 3. Newspaper Page Balance & Broadsheet Geometry (3 tests) - ALL PASSED
▶ 4. Page Designer & Reader Geometric Parity (1 test) - ALL PASSED
▶ 5. 300 DPI Prepress Export Specifications (2 tests) - ALL PASSED
ℹ tests 25
ℹ pass 25
ℹ fail 0
```
**Result**: **25 out of 25 regression tests passed cleanly.**

### 6.3 Full Production Build Verification
Executed `npm.cmd run build` (`tsc && vite build`):
```
vite v6.4.5 building for production...
transforming...
✓ 2127 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                 2.21 kB │ gzip:   0.93 kB
dist/assets/index-DkkxskNd.css                116.03 kB │ gzip:  17.07 kB
dist/assets/vendor-react-QjL_sdB1.js            4.22 kB │ gzip:   1.58 kB
dist/assets/SearchScreen-BFq8kYph.js            4.89 kB │ gzip:   1.99 kB
dist/assets/ProfileScreen-BNbC0n6X.js          30.97 kB │ gzip:   7.33 kB
dist/assets/graphicRenderer-CEJjgRxQ.js        36.54 kB │ gzip:  11.47 kB
dist/assets/EpaperScreen-Q0aRm3oB.js           42.29 kB │ gzip:  11.93 kB
dist/assets/NewsroomDeskScreen-BanOSNhH.js     47.86 kB │ gzip:  10.09 kB
dist/assets/ReporterDeskScreen-CrIsOvXr.js     58.48 kB │ gzip:  14.40 kB
dist/assets/GraphicsStudioScreen-Cemr9eji.js   60.74 kB │ gzip:  13.26 kB
dist/assets/AiNewsroomScreen-Bf9FxjDH.js       64.01 kB │ gzip:  12.62 kB
dist/assets/vendor-lucide-C7LHVenW.js          67.24 kB │ gzip:  15.15 kB
dist/assets/VideoStudioScreen-BAT-Cb9o.js      88.91 kB │ gzip:  19.89 kB
dist/assets/AdminControlScreen-DqCTDuXe.js    365.92 kB │ gzip:  73.95 kB
dist/assets/vendor-firebase-BzDcocd6.js       457.54 kB │ gzip: 108.85 kB
dist/assets/index-B0qzcJ4W.js                 509.10 kB │ gzip: 130.83 kB
✓ built in 38.07s
```
**Result**: **Production build succeeded with zero compile or type errors.**

---

## 7. Confirmation of Immutability Guarantees

1. **Source Article Immutability**:
   - Original news articles stored in `newsArticles` (`adapter.data.articles` or Firestore collection) are completely independent of e-paper page assignments.
   - Print headline edits, custom bylines, role changes, and story removals modify only the layout snapshot elements in `EpaperPageDoc.elements`.
   - Removing an article from a page leaves the original article 100% intact with its full body, images, and original web publication metadata.
2. **Published Edition Snapshot Immutability**:
   - Editions in `PUBLISHED` status strictly reject all assignment requests (`assign-articles`) and removal requests (`DELETE /articles/:id`) with `400 ERR_EDITION_ALREADY_PUBLISHED`.
   - Historical snapshots in `epaperEditionVersions` remain permanently frozen and tamper-proof.

---

## 8. Remaining Blockers & Next Phase Readiness

- **Current Blockers**: **NONE**. All functional, security, state machine, and UI requirements for STEP 3 are 100% complete and validated.
- **Scope Compliance**: STEP 3 only has been executed. No Step 4 tasks have been initiated. No deployments, commits, or branch merges were performed.
- **Ready for Step 4**: Standing by for the user's explicit directive for the next remediation step.
