# BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
## E-Paper Reporter Workspace & Profile Integration Report
### Document ID: DOC-37-EPAPER-STEP7-REPORTER-WORKSPACE-2026-V1.0
### Phase: Current Implementation — Step 7 (Completed)
### Classification: Authoritative Engineering & Operational Documentation

---

## 1. Executive Summary & Objective

**STEP 7 — E-Paper Reporter Workspace & Profile Integration** has been successfully designed, implemented, verified, and integrated into the **BREAKING NEWS WALA** hyperlocal digital news platform.

### Core Objective
The objective of this step is to provide regional correspondents, district stringers, and accredited field journalists across Madhya Pradesh with a dedicated, secure, and modern **E-Paper Reporter Workspace**. This workspace is seamlessly integrated with:
1. **Existing Reporter Profiles**: Badge numbers (`BNW-REP-XXXX`), accreditation statuses (`VERIFIED`, `TRAINEE`, `SUSPENDED`), assigned districts, administrative divisions, beats, and bureau affiliations.
2. **Editorial Publishing Lifecycles**: Direct cross-referencing between submitted news (`newsArticles`), the News Selection Desk (Step 3), the 3-panel Page Designer (Step 4), and live published E-Paper broadsheet pages.
3. **Advertisement Workspace Integration**: Access to assigned or sourced classified and broadsheet advertisements (Step 6), including campaign statuses, creative review results, and assigned page slots, while strictly barring unauthorized tariff modifications or self-approvals.
4. **WhatsApp Edition Studio**: Real-time quota balance and 1:1 / 4:5 card generation for approved or published stories.
5. **Strict IDOR & Privilege Escalation Defense**: Robust server-side authorization ensuring reporters can only access their own workspaces and contact information, barring unauthorized changes to verification statuses, roles, or territorial jurisdictions.

---

## 2. Architectural Overview & Component Structure

The following diagram illustrates the information flow and authorization gates governing the Reporter Workspace:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 AUTHENTICATED CLIENTS                                  │
│  ┌──────────────────────────────────────────┐  ┌────────────────────────────────────┐  │
│  │   Reporter Desk Screen (Mobile / PWA)    │  │    E-Paper Studio (Newsroom Desk)  │  │
│  │    activeTab === 'epaper_workspace'      │  │   activeSubView === 'reporter_ws'  │  │
│  └────────────────────┬─────────────────────┘  └──────────────────┬─────────────────┘  │
└───────────────────────┼───────────────────────────────────────────┼────────────────────┘
                        │                                           │
                        ▼                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        SHARED REST API ENGINE (/api/v1/epaper/reporter/*)              │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ RBAC & IDOR Enforcement Gate:                                                    │  │
│  │ • Non-staff reporter: targetReporterId === user.id (403 Forbidden on mismatch)   │  │
│  │ • Elevated fields guarded: verificationStatus, role, assignedDistricts (403)     │  │
│  │ • Editor/Admin: Full cross-bureau management & audit access                      │  │
│  └────────────────────────────────────────┬─────────────────────────────────────────┘  │
└───────────────────────────────────────────┼────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         AUTHORITATIVE PERSISTENCE ADAPTERS                             │
│                    (LocalJsonAdapter / Authoritative FirestoreAdapter)                 │
│                                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌────────────────────────────┐  │
│  │   reporterProfiles    │  │     newsArticles      │  │ epaperEditions/epaperPages │  │
│  │   (Badge, Bureau,     │  │   (Submitted, Status, │  │ (Page Elements, Byline,    │  │
│  │    Districts, Contact)│  │    Remarks, Images)   │  │  Placement, Immutability)  │  │
│  └───────────────────────┘  └───────────────────────┘  └────────────────────────────┘  │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌────────────────────────────┐  │
│  │  epaperAdSubmissions  │  │  epaperWhatsAppQuotas │  │       auditLogs            │  │
│  │ (Assigned Ads, Status,│  │ (Max Daily, Used,     │  │ (Traceable Activity Feed,  │  │
│  │  Slot Types, Tariffs) │  │  Remaining Balance)   │  │  Reverse Chronological)    │  │
│  └───────────────────────┘  └───────────────────────┘  └────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Feature Implementations & Technical Details

### 3.1 Real, Persisted Metrics Engine
In compliance with project standards, the workspace strictly rejects hardcoded or fabricated statistics. Every metric is computed dynamically from persisted data:
- `totalSubmittedNews`: Total stories filed by the reporter across all statuses.
- `approvedNews`: Stories that have passed editorial review (`APPROVED`, `APPROVED_FOR_EPAPER`, `PAGE_DESIGNED`, `FINAL_APPROVED`, `PUBLISHED`).
- `epaperSelectedNews`: Stories selected for E-Paper inclusion or placed on an edition page.
- `publishedEpaperStories`: Stories that have appeared in an immutable published edition (`status === 'PUBLISHED'`).
- `pendingReviewNews`: Stories actively awaiting editorial review (`PENDING_REVIEW`, `UNDER_REVIEW`, `IN_REVIEW`, `EDITORIAL_REVIEW`).
- `returnedNews`: Stories returned with editorial remarks or rejected (`REJECTED`, `CHANGES_REQUESTED`, `RETURNED`).
- `assignedAds`: Classified or broadsheet ads sourced by or assigned to this reporter.
- `publishedAds`: Assigned ads appearing in published editions.
- `whatsappQuota`: Real-time daily quota (`used` and `remaining` out of `maxDaily`).

### 3.2 Reporter Profile Integration & Security Boundaries
- **Identification**: Each reporter is linked via `id`, `badgeNumber` (`BNW-REP-XXXX`), and registered `email`.
- **Accreditation**: Displays `verificationStatus` (`VERIFIED`, `PENDING`, `TRAINEE`, `SUSPENDED`).
- **Jurisdiction**: Displays assigned administrative division and districts (e.g. भोपाल, सीहोर, रायसेन).
- **Restricted Profile Editing**:
  - **Permitted for Reporters**: Contact phone number (`phone`), profile picture (`avatar`), personal bio (`bio`), and bureau label (`bureau`).
  - **Forbidden for Reporters (Enforced Server-Side with 403 Forbidden)**: Modifying `verificationStatus`, `role`, `roles`, `assignedDistricts`, `assignedDivision`, `badgeNumber`, `status`, or story count ledgers.
  - **Privileged Access**: Master Admins and Chief Editors retain full authority to reassign districts, grant trusted reporter roles, and update verification credentials.

### 3.3 "मेरी खबरें और ई-पेपर योगदान" (My News & E-Paper Contributions)
Provides an interactive multi-filter desk for the reporter's stories:
- **Filters**: `सभी समाचार (All)`, `समीक्षाधीन (Under Review)`, `स्वीकृत (Approved)`, `ई-पेपर पृष्ठ आवंटित (Assigned to Page)`, `प्रकाशित (Published)`, `सुधार निर्देश / अस्वीकृत (Returned with Remarks)`.
- **Search**: Instant headline and district search.
- **Card Metadata**: Headline, summary, word count, character count, submission timestamp, category badge, and district tag.
- **Image Diagnostics**: Green icon for stories with valid images; Amber warning for missing images.
- **Editorial Remarks Callout**: If desk editors returned a story or requested revisions, their exact feedback is prominently rendered in a red alert container.
- **Page Placement Mapping**: If placed on an E-Paper page, displays edition title, publication date, exact page number (`P1`–`P12`), and assigned byline credit.

### 3.4 "मेरी प्रकाशित खबरें" (Published E-Paper History — Read-Only Archive)
- Lists stories that have appeared in live, published editions.
- **Read-Only Invariant**: Reporters cannot edit, modify, unpublish, or delete stories once an edition is published.
- **Reader Navigation**: Each item provides a direct "ई-पेपर में खोलें" action linking directly to `/epaper?edition={editionId}&page={pageNumber}`, immediately opening the reader on the exact page.

### 3.5 Advertisement Workspace Integration & Isolation
Integrates with the Step 6 Advertisement Manager:
- Lists all classified and broadsheet advertisements where `ad.reporterId === reporterId || ad.assignedReporterId === reporterId`.
- Displays advertiser details, category, slot type, campaign status (`SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `SCHEDULED`, `PUBLISHED`, `REJECTED`), and assigned edition page.
- **Strict Isolation Guarantees**:
  - Reporters cannot view advertisements belonging to other reporters.
  - Reporters cannot approve their own advertisements.
  - Reporters cannot alter base tariffs or commission rules.
  - Non-staff status transitions are strictly constrained by the state machine.

### 3.6 WhatsApp Edition Studio & Quota Integration
- Displays daily quota progress bar (e.g. 0 / 20 used, 20 remaining).
- Exposes a 1-click card generation interface:
  - Dropdown selecting from the reporter's approved or published stories.
  - Aspect ratio selector: `4:5` (recommended for WhatsApp Status / Stories) or `1:1` (WhatsApp Group posts).
  - Triggers `/api/v1/epaper/whatsapp/generate`, generating a Devanagari clipping card with BNW masthead.
  - Real-time download link for generated PNG cards.

### 3.7 Scoped Activity Feed & Audit Timeline
- Aggregates article submissions, approvals, editorial return remarks, E-Paper page assignments, edition publications, ad updates, and WhatsApp generation events.
- Strictly scoped to the authenticated reporter.
- Sorted in reverse chronological order with formatted Devanagari timestamps.

---

## 4. API Specification & Server Endpoints

All endpoints are hosted under `/api/v1/epaper/reporter/*`:

| Endpoint | Method | Role Required | Governance & IDOR Check | Description |
| :--- | :---: | :---: | :--- | :--- |
| `/api/v1/epaper/reporter/workspace` | `GET` | `REPORTER` or Staff | `targetId === user.id` unless Staff | Complete workspace dashboard summary & real metrics |
| `/api/v1/epaper/reporter/contributions` | `GET` | `REPORTER` or Staff | `targetId === user.id` unless Staff | Filtered list of reporter news and E-Paper assignments |
| `/api/v1/epaper/reporter/published` | `GET` | `REPORTER` or Staff | `targetId === user.id` unless Staff | Historical list of stories appearing in published editions |
| `/api/v1/epaper/reporter/profile` | `PUT/PATCH` | `REPORTER` or Staff | Blocks elevated fields if `REPORTER` | Restricted profile update (phone, avatar, bio, bureau) |
| `/api/v1/epaper/reporter/ads` | `GET` | `REPORTER` or Staff | Scoped to owner/assignee | Ads sourced by or assigned to this reporter |
| `/api/v1/epaper/reporter/activity` | `GET` | `REPORTER` or Staff | Scoped to reporter | Scoped activity feed and audit trail |

---

## 5. Automated Verification & Regression Results

A dedicated automated test suite (`tests/test-epaper-step7-reporter-workspace.test.js`) was developed and executed alongside full regression test suites across Steps 1 through 6.

### 5.1 Step 7 Test Suite Execution (`node tests/test-epaper-step7-reporter-workspace.test.js`)
```
========================================================================
🧪 RUNNING STEP 7: E-PAPER REPORTER WORKSPACE & PROFILE INTEGRATION TESTS
========================================================================

     Metrics for usr-rep-1: Total=38, Approved=14, Selected=14, Pending=24
  ✅ [PASS] 1. Reporter Workspace Summary returns authentic persisted metrics
  ✅ [PASS] 2. Full Reporter Profile Integration (Badge, bureau, districts, verification)
  ✅ [PASS] 3. Restricted Profile Update allows contact info but blocks unauthorized role/verification changes
  ✅ [PASS] 4. Strict IDOR Protection: Reporter A cannot access Reporter B workspace
  ✅ [PASS] 5. Editorial Staff (Admin/Editor) can access any reporter workspace for auditing
     Filtered counts: Total=38, UnderReview=24, Approved=0
  ✅ [PASS] 6. Contributions filtering, image status, word count and page mapping
     Assigned Story Found: "संपादकीय समीक्षा समाचार..." on प्रकाशित संस्करण सुरक्षा टेस्ट P1
  ✅ [PASS] 7. Correctly maps E-Paper edition, page number, slot, and reader URL for assigned stories
  ✅ [PASS] 8. Published E-Paper history returns read-only items with reader navigation links
  ✅ [PASS] 9. Advertisement Manager Integration with strict reporter isolation
     WhatsApp Quota: Used=0/20, Remaining=20
  ✅ [PASS] 10. WhatsApp Edition Quota & Status Integration
  ✅ [PASS] 11. Activity Feed aggregates chronological events scoped to reporter
  ✅ [PASS] 12. Regression Safety: Steps 1 through 6 invariants intact

========================================================================
📊 STEP 7 TEST EXECUTION SUMMARY: 12 PASSED, 0 FAILED
========================================================================
```

### 5.2 Comprehensive Regression Matrix (Steps 1 through 7)
All 7 sequential steps were executed in a single test run:

| Step | Verification Suite File | Tests Passed | Tests Failed | Status |
| :---: | :--- | :---: | :---: | :---: |
| **Step 1** | `tests/test-epaper-daily-12pages-validation.test.js` | 8 | 0 | **PASSED** |
| **Step 2** | `tests/test-epaper-step2-layout-rendering.test.js` | 17 | 0 | **PASSED** |
| **Step 3** | `tests/test-epaper-step3-selection-workflow.test.js` | 11 | 0 | **PASSED** |
| **Step 4** | `tests/test-epaper-step4-designer-integration.test.js` | 12 | 0 | **PASSED** |
| **Step 5** | `tests/test-epaper-step5-template-manager.test.js` | 12 | 0 | **PASSED** |
| **Step 6** | `tests/test-epaper-step6-ad-manager.test.js` | 13 | 0 | **PASSED** |
| **Step 7** | `tests/test-epaper-step7-reporter-workspace.test.js` | 12 | 0 | **PASSED** |
| **TOTAL** | **Entire E-Paper Regression Suite** | **85** | **0** | **100% GREEN** |

### 5.3 Frontend Typecheck & Build Status
- **TypeScript Check (`tsc --noEmit`)**: 0 errors.
- **Production Build (`vite build`)**: Succeeded in 36.49s. Produced `dist/assets/EpaperReporterWorkspace-lRvpQjBE.js` (37.60 kB).

---

## 6. Files Created and Modified

1. **`src/types/index.ts`**:
   - Added `EpaperReporterContributionItem`, `EpaperReporterPublishedItem`, `EpaperReporterActivityItem`, `EpaperReporterWhatsAppStatus`, `EpaperReporterWorkspaceMetrics`, `EpaperReporterWorkspaceSummary`, `ReporterProfileUpdateInput`.
   - Updated `ReporterProfile` with `bureau`, `bio`, `totalPoints`.
   - Updated `EpaperAdSubmissionDoc` with `rejectionReason`.
2. **`src/server/persistence/adapter.js`**:
   - Implemented `getReporterProfile()`, `getReporterWorkspaceSummary()`, `getReporterContributions()`, `getReporterPublishedStories()`, and `updateReporterProfileRestricted()` in `LocalJsonAdapter`.
   - Added corresponding stub handlers in `ProductionGuardAdapter`.
3. **`src/server/persistence/firestoreAdapter.js`**:
   - Implemented `getReporterProfile()`, `getReporterWorkspaceSummary()`, `getReporterContributions()`, `getReporterPublishedStories()`, and `updateReporterProfileRestricted()` using Firestore collections.
4. **`src/server/apiEngine.js`**:
   - Added routing and handlers for `/api/v1/epaper/reporter/workspace`, `/api/v1/epaper/reporter/contributions`, `/api/v1/epaper/reporter/published`, `/api/v1/epaper/reporter/profile`, `/api/v1/epaper/reporter/ads`, and `/api/v1/epaper/reporter/activity`.
5. **`src/services/apiClient.ts`**:
   - Added `apiClient.epaper.reporter` namespace methods.
6. **`src/components/epaper/EpaperReporterWorkspace.tsx`**:
   - Created standalone responsive Devanagari UI component with profile card, real metrics, 5 sub-tabs, edit profile modal, and WhatsApp clipping generator.
7. **`src/components/epaper/EpaperStudioTab.tsx`**:
   - Added `reporter_workspace` subview to studio navigation so editors can view reporter performance.
8. **`src/screens/ReporterDeskScreen.tsx`**:
   - Added 6th tab `ई-पेपर कार्यक्षेत्र (E-Paper Workspace)` for 1-click access from reporter desk.
9. **`tests/test-epaper-step7-reporter-workspace.test.js`**:
   - Created automated test suite with 12 validation tests.

---

## 7. Conclusion

**STEP 7 — E-Paper Reporter Workspace & Profile Integration** is complete, fully tested, and production-ready. Reporters have immediate, secure, and transparent visibility into their news contributions, E-Paper page placements, advertisement assignments, and WhatsApp clippings without violating security boundaries or editorial governance.
