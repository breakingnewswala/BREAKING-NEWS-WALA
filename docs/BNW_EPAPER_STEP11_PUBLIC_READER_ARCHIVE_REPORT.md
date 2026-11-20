# BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
## E-Paper Module Step 11: Public E-Paper Reader & Digital Archive Implementation Report
### Document ID: DOC-EPAPER-STEP11-PUBLIC-READER-ARCHIVE-2026-V1.0
### Date: 2026-11-20
### Classification: Authoritative Engineering Deliverable
### Status: Complete, Verified & Integrated

---

## 1. Executive Summary

This deliverable concludes the implementation of **STEP 11 — PUBLIC E-PAPER READER & DIGITAL ARCHIVE** for the **BREAKING NEWS WALA** digital publishing platform.

Step 11 delivers the public-facing reader ecosystem and digital historical archive, completing the lifecycle from news discovery and layout design (Steps 1–5), advertising and reporter integrations (Steps 6–8), AI editorial assistance (Step 9), and quality-checked publication (Step 10) into an audience-ready, high-performance, responsive digital newspaper.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PUBLIC E-PAPER PLATFORM (STEP 11)                                │
├───────────────────────────┬────────────────────────────┬───────────────────────────────┤
│    PUBLIC HOMEPAGE        │   DIGITAL NEWSPAPER READER │      DIGITAL ARCHIVE          │
│ (EpaperPublicHomepage)    │    (EpaperPublicReader)    │   (EpaperDigitalArchive)      │
├───────────────────────────┼────────────────────────────┼───────────────────────────────┤
│ • Latest Daily Edition    │ • 32.9 cm x 52.0 cm Canvas │ • Year-wise (2026, 2025...)   │
│ • "अख़बार पढ़ें" Hero CTA   │ • Snapshot Immutability    │ • Month-wise (12 Hindi Months)│
│ • Cover Preview           │ • Keyboard & Touch-Swipe   │ • Date-Picker (YYYY-MM-DD)    │
│ • Recent Daily Editions   │ • Zoom (10%-200%) & Pan    │ • Daily vs Special Filter     │
│ • Special Editions Shelf  │ • 12-Page Thumbnail Drawer │ • 55 MP Districts Selector    │
│ • 55 MP Districts Filter  │ • Devanagari Reading Mode  │ • Keyword Search Query        │
│ • Link to Digital Archive │ • 4:5 Social Clipper       │ • Paginated Broadsheet Grid   │
│ • Zero Draft Leakage      │ • 300 DPI PDF/PNG Export   │ • Instant Reader Navigation   │
└───────────────────────────┴────────────────────────────┴───────────────────────────────┘
```

All 20 required validation scenarios have been implemented and verified via automated test suites.

---

## 2. Mandatory Pre-Implementation Audit Findings

Before introducing new code, an audit of existing Steps 1–10 was conducted:

1. **Working Drafts vs Published Snapshots (`epaperEditions` vs `epaperEditionVersions`)**:
   - The persistence layer stores working drafts in `epaperEditions` and `epaperPages`.
   - When an edition is published in Step 10, an immutable snapshot is frozen in `epaperEditionVersions` containing `{ editionSnapshot, pagesSnapshot, qualityReportSnapshot, publishedAt, publishedBy }`.
   - Prior to Step 11, `GET /api/v1/epaper/editions/:id/pages` returned working draft pages directly from `epaperPages`, which caused draft modifications and unapproved articles to leak if an edition was undergoing post-publication corrections.
   - **Remediation in Step 11**: `GET /api/v1/epaper/editions/:id/pages` and `GET /api/v1/epaper/editions/:id` now resolve from `getPublishedEpaperSnapshot()`. For public readers, draft editions return `403 ERR_FORBIDDEN`, and post-publication draft revisions continue serving the frozen $v1$ snapshot until $v2$ is formally published.

2. **Daily Edition 12-Page Boundary Invariant**:
   - Confirmed: Daily editions strictly contain exactly 12 broadsheet pages (`P1` through `P12`).
   - Special Editions contain custom, independently configured page counts ($1$ to $48$ pages).
   - This invariant is enforced across `QualityCheckerEngine`, `apiEngine.js`, and reader renderers.

3. **Multi-Surface Parity (Web & Android)**:
   - Evaluated `android/app/src/main/kotlin/com/breakingnewswala/ui/screens/EpaperScreen.kt`.
   - The Android client requests pages via `/api/v1/epaper/editions/${edition.id}/pages/$selectedPage/export/png` and PDF via `/export/pdf`.
   - **Remediation in Step 11**: The backend route regex in `src/server/apiEngine.js` was enhanced to support both `/export/page/:pageNum/image` and `/pages/:pageNum/export/png`, guaranteeing 100% multi-surface parity without breaking Android or Web clients.

4. **Public Privacy Protection**:
   - Editorial draft objects contain private reporter telephone numbers, email addresses, and internal desk comments.
   - **Remediation in Step 11**: Implemented `sanitizePublicEdition()` and `sanitizePublicPages()` in `src/server/apiEngine.js` to strip all private reporter contact details and internal editorial notes from public API responses.

---

## 3. Architecture & Component Implementation

### 3.1 Public E-Paper Homepage (`src/components/epaper/public/EpaperPublicHomepage.tsx`)
A responsive public entry point for the newspaper:
- **Hero Section**: Showcases the latest published Daily Edition with publication date, district badge, cover preview, and primary "अख़बार पढ़ें" action button.
- **Recently Published Editions Grid**: Displays recent daily editions across Madhya Pradesh districts with page counts, publication dates, and one-click reading access.
- **Special Editions Shelf (विशेष परिशिष्ट)**: Dedicated section for thematic special editions (e.g. Simhastha Mahakumbh 2028, Budget special, Agriculture special) with independent page counts and special edition tags.
- **District Filter**: Interactive dropdown of all 55 MP districts enabling readers to discover hyper-local editions.
- **Digital Archive CTA**: Prominent banner guiding users to the historical digital archive.

### 3.2 Digital Newspaper Reader (`src/components/epaper/public/EpaperPublicReader.tsx`)
High-fidelity broadsheet newspaper reading surface:
- **Broadsheet Canvas Rendering**: HTML5 canvas rendering ($32.9\text{ cm} \times 52.0\text{ cm}$, $932.6\text{ pt} \times 1474.0\text{ pt}$, $\sim 1:1.58$ aspect ratio) via `GraphicRenderer.renderBroadsheetPage()`.
- **Desktop Keyboard Navigation**:
  - `ArrowLeft` / `ArrowRight`: Previous / Next page.
  - `+` / `=`: Zoom In ($+25\%$).
  - `-` / `_`: Zoom Out ($-25\%$).
  - `0`: Reset Zoom ($100\%$).
  - `f` / `F`: Toggle Fullscreen reading mode.
  - `Escape`: Exit Fullscreen or dismiss active modal.
- **Mobile Touch-Swipe Gestures**: Smooth horizontal swipe detection for budget touchscreens.
- **12-Page Thumbnail Drawer**: Bottom thumbnail bar displaying page previews with active indicators. Daily editions enforce exactly 12 pages; Special editions display their published count.
- **Zoom & Pan Engine**: Smooth zooming from $10\%$ to $200\%$, fit-to-screen computation, and mouse drag panning with active cursor styling.
- **Reading Mode Modal**: Clickable news stories trigger a distraction-free Devanagari typography modal with:
  - Font scaling controls ($12\text{px}$ to $32\text{px}$).
  - Word count and estimated reading time.
  - Full reporter and editor attribution.
  - Web Speech API Hindi text-to-speech ("खबर सुनें") with speech rate calibration.
- **4:5 Social Clipping Generator**: Interactive tool producing optimized social media clippings with BNW masthead, Devanagari headline, byline, and direct PNG download or Web Share.
- **Prepress Export Integration**: One-click download of complete 300 DPI print-ready PDF and single-page 300 DPI PNG.
- **Version Selector**: Historical version switcher for editions with published post-publication revisions ($v1.0$, $v2.0$).

### 3.3 Digital Archive (`src/components/epaper/public/EpaperDigitalArchive.tsx`)
A historical digital newspaper repository:
- **Multi-Dimensional Filters**:
  - Year selector: All years, 2026, 2025, 2024.
  - Month selector: All months, or individual Hindi calendar months (जनवरी to दिसंबर).
  - Date picker: Exact date search ($YYYY-MM-DD$).
  - Edition Type: All, Daily Broadsheet (12 pages), or Special Editions.
  - District filter: Filter across MP's 55 districts.
  - Free-text search: Search headlines, edition titles, and edition codes.
- **Paginated Broadsheet Grid**: 12 items per page with cover previews, edition metadata, total pages, and direct "अख़बार पढ़ें" and "PDF डाउनलोड" actions.
- **Empty & Error States**: Contextual messages and search reset when no editions match filters.

### 3.4 Master Screen Orchestration (`src/screens/EpaperScreen.tsx`)
Coordinates the public surfaces:
- Clean view switching between `'homepage'`, `'reader'`, and `'archive'`.
- URL search parameter deep-linking (`?editionId=...&page=...&view=reader` or `?view=archive`).
- Top navigation bar with BNW branding and active view pills.
- Backward compatibility with existing screen props and export of `PublicReaderEngine`.

---

## 4. Backend Persistence & REST API Endpoints

### 4.1 Persistence Layer Enhancements (`src/server/persistence/adapter.js` & `firestoreAdapter.js`)
- `getPublishedEpaperSnapshot(editionId, versionNumber = null)`: Retrieves the immutable published version snapshot from `epaperEditionVersions`. If no version is specified, it returns the latest published snapshot.
- `saveEpaperVersionSnapshot(snapshot)`: Persists an immutable version document into `epaperEditionVersions`.
- `getEpaperEditions(filters)`: Enhanced with support for `year`, `month`, `editionType`, `districtId`, and `status: 'PUBLISHED'` snapshot-backed resolution.

### 4.2 REST API Specification
| Method | Route | Description | Auth / Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/epaper/editions` | Lists published editions for public readers | Public / Read-Only |
| `GET` | `/api/v1/epaper/editions/:id` | Returns sanitized published edition details from snapshot | Public / Read-Only |
| `GET` | `/api/v1/epaper/editions/:id/pages` | Returns 12 sanitized broadsheet pages from published snapshot | Public / Read-Only |
| `GET` | `/api/v1/epaper/archive` | Historical archive search with year, month, date, district, type filters | Public / Read-Only |
| `GET` | `/api/v1/epaper/latest` | Returns latest published edition (supports district and editionType) | Public / Read-Only |
| `GET` | `/api/v1/epaper/editions/:id/export/pdf` | Downloads 300 DPI print-ready PDF from snapshot | Public / Read-Only |
| `GET` | `/api/v1/epaper/editions/:id/pages/:pageNum/export/png` | Exports 300 DPI single-page PNG from snapshot | Public / Read-Only |
| `GET` | `/api/v1/epaper/editions/:id/versions` | Lists published versions history | Public / Read-Only |

---

## 5. Security Invariants & Snapshot Immutability

1. **Zero Draft Leakage**:
   - `GET /api/v1/epaper/editions/:id/pages` and `GET /api/v1/epaper/editions/:id` verify that the edition is published and backed by a snapshot in `epaperEditionVersions`.
   - Access to draft, review, or unpublished editions by public or reader users is rejected with `403 ERR_FORBIDDEN`.
   - Non-existent editions return `404 ERR_NOT_FOUND`.

2. **Snapshot Immutability During Post-Publication Corrections**:
   - When an editor initiates a post-publication correction (`POST /api/v1/epaper/editions/:id/correction`), the working copy in `epaperEditions` transitions to `status: 'LAYOUT_IN_PROGRESS'` with incremented version $v2$.
   - Public readers requesting the edition continue to be served the immutable $v1$ snapshot from `epaperEditionVersions`. Public reading is uninterrupted, and in-progress draft corrections remain invisible until $v2$ is approved and published.

3. **Privacy Sanitization**:
   - Private fields (`reporterPhone`, `reporterEmail`, `reporterContact`, `editorialNotes`, `internalNotes`, `clientBilling`, `adRate`, `reviewComments`) are stripped before public delivery.

4. **Strictly Read-Only Public Surface**:
   - All mutation endpoints (`/publish`, `/schedule`, `/status`, `/pages`, `/correction`) require elevated editorial roles (`EDITOR`, `ADMIN`, `MASTER_ADMIN`). Unauthenticated or reader requests return `401 ERR_UNAUTHORIZED` or `403 ERR_FORBIDDEN`.

---

## 6. Automated Verification Test Suite

A comprehensive test suite was authored in `tests/test-epaper-step11-public-reader-archive.test.js` validating all 20 requirements:

```
========================================================================
🧪 RUNNING STEP 11: PUBLIC E-PAPER READER & DIGITAL ARCHIVE TESTS
========================================================================

  ✅ [PASS] 1. Only PUBLISHED editions appear in public listings
  ✅ [PASS] 2. Unpublished editions are inaccessible (ERR_FORBIDDEN 403) for public readers
  ✅ [PASS] 3. Reader loads correct immutable snapshot from epaperEditionVersions
  ✅ [PASS] 4. Daily Edition displays exactly 12 pages (P1 through P12)
  ✅ [PASS] 5. Special Edition displays its independent page count (e.g. 4 pages)
  ✅ [PASS] 6. Previous/Next page navigation logic and bounds handling (0 to totalPages - 1)
  ✅ [PASS] 7. Thumbnail and page selection logic: selecting page k points to page k
  ✅ [PASS] 8. Version-specific reading (?version=1): requesting specific version loads corresponding snapshot
  ✅ [PASS] 9. v1 snapshot remains unchanged after v2 post-publication correction is initiated
  ✅ [PASS] 10. Archive year/month/date filtering: GET /api/v1/epaper/archive with year, month, date
  ✅ [PASS] 11. Daily and Special Edition filtering in archive
  ✅ [PASS] 12. Pagination and empty archive states: returns proper page, limit, total, totalPages metadata
  ✅ [PASS] 13. Invalid edition and snapshot IDs return 404 ERR_NOT_FOUND
  ✅ [PASS] 14. Unauthorized / private snapshot access blocked
  ✅ [PASS] 15. No public write or publishing operations allowed (POST/PATCH/DELETE return 401/403)
  ✅ [PASS] 16. Download and share behavior: PDF and PNG exports resolve from published snapshot
  ✅ [PASS] 17. Mobile layout and loading/error states: broadsheet viewport scaling, fit-to-screen computation
  ✅ [PASS] 18. Lazy loading and image failure handling: graceful social clipping generation
  ✅ [PASS] 19. No exposure of internal reporter phone/email or editorial notes in public APIs
  ✅ [PASS] 20. Regression compatibility with Steps 1–10: quality checks, models, and export engines functional

========================================================================
🏁 STEP 11 VERIFICATION COMPLETE: 20 PASSED, 0 FAILED (TOTAL 20)
========================================================================
```

### Cumulative Regression Suite Verification
All regression suites across Steps 1 through 10 were executed:
- `test-epaper-step11-public-reader-archive.test.js`: **20 / 20 PASSED**
- `test-epaper-step10-quality-publishing.test.js`: **25 / 25 PASSED**
- `test-epaper-step9-ai-newsroom.test.js`: **20 / 20 PASSED**
- `test-epaper-step8-whatsapp-edition.test.js`: **15 / 15 PASSED**
- `test-epaper-step7-reporter-workspace.test.js`: **12 / 12 PASSED**
- `test-epaper-step6-ad-manager.test.js`: **13 / 13 PASSED**
- `test-epaper-step5-template-manager.test.js`: **12 / 12 PASSED**
- `test-epaper-step4-designer-integration.test.js`: **12 / 12 PASSED**
- `test-epaper-step3-selection-workflow.test.js`: **11 / 11 PASSED**
- `test-epaper-step2-layout-rendering.test.js`: **17 / 17 PASSED**
- `test-epaper-daily-12pages-validation.test.js`: **8 / 8 PASSED**
- `test-epaper-fasttrack-e2e.test.js`: **11 / 11 PASSED**

**Total Automated Tests Passed**: **176 tests passing with 0 failures**.

---

## 7. Multi-Surface & Android Implementation Status

An audit of the Android E-Paper viewer implementation was conducted on `android/app/src/main/kotlin/com/breakingnewswala/ui/screens/EpaperScreen.kt`:
1. **Current Android Status**:
   - Built with Jetpack Compose using `SubcomposeAsyncImage` (Coil).
   - Features page pill selectors for pages 1 through 12.
   - Provides zoom controls ($80\%$ to $250\%$).
   - Leverages Android `DownloadManager` for PDF and PNG downloads.
   - Requests pages from `/api/v1/epaper/editions/${edition.id}/pages/$selectedPage/export/png` and complete edition from `/export/pdf`.
2. **Multi-Surface Compatibility**:
   - The backend route handler in `src/server/apiEngine.js` fully satisfies these endpoints from published snapshots.
   - Both Web and native Android clients consume identical snapshot-backed REST APIs.

---

## 8. Conclusion

The **Public E-Paper Reader & Digital Archive (Step 11)** is complete, verified, and integrated into the **BREAKING NEWS WALA** architecture. It provides an immersive, broadsheet-calibrated reading experience with complete snapshot integrity, strict privacy protection, and historical archive discovery across the 55 districts of Madhya Pradesh.

---
*Report Author: Antigravity AI Engineering Assistant*  
*Project: BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)*  
*Document Ref: DOC-EPAPER-STEP11-PUBLIC-READER-ARCHIVE-2026-V1.0*
