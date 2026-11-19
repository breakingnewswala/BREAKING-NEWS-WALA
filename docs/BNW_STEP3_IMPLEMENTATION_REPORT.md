# BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
## IMPLEMENTATION REPORT — STEP 3: NEWS SELECTION DESK & EDITORIAL WORKFLOW
### Document ID: DOC-46-STEP3-REPORT-2026-V1.0
**Date of Execution:** November 18, 2026  
**Execution Lead:** Lead Architect, Backend & Database Engineer, Frontend & Dashboard Engineer  
**Governing Manual:** `AGENTS.md` (DOC-36-AGENTS-ROOT-2026-V1.0) & Golden Development Protocol  
**Implementation Status:** **100% COMPLETE & VERIFIED**  
**Test Pass Rate:** **10 / 10 Tests Passing (0 Failures)**  

---

## 1. Task Objective & Functional Scope

Step 3 bridges the platform's core editorial newsfeed with the print-layout pipeline through the **News Selection Desk & Editorial Workflow**. It enables newsroom editors to discover, curate, and place approved digital articles directly onto broadsheet newspaper pages while strictly maintaining the immutability of original source articles.

### Functional Requirements Addressed (ORIGINAL_REQUEST R2):
1. **Approved Article Sourcing:** Real-time query interface filtering digital news articles by approval status (`'APPROVED'` or `'PUBLISHED'`), publication date, beat category, and district.
2. **Duplicate-Placement Detection:** Intelligent check warning editors if an article is already placed on the active page or on any other page within the current edition.
3. **Source Article Immutability:** Guaranteed non-destructive architecture: placing, resizing, or cropping a story element creates an independent layout element representation (`EpaperPageElement`) without mutating the source `newsArticles` document.
4. **Byline & Attribution Integrity:** Automatic extraction and preservation of original reporter bylines (`byline`), photo credits (`photoCredit`), and accredited stringer badge numbers.
5. **Element Stacking & Z-Index Ordering:** Deterministic rendering order preserving visual hierarchy on multi-story newspaper pages.

---

## 2. Technical Architecture & Implementation Details

### 2.1 Backend Sourcing & Verification Endpoints (`src/server/apiEngine.js`)
- `GET /api/v1/epaper/sourcing/articles`: Retrieves approved news articles for a target date range and district. Filters out unapproved, draft, or rejected articles.
- `GET /api/v1/epaper/editions/:editionId/check-article/:articleId`: Scans all page manifests of the edition to detect prior placements:
  ```json
  {
    "placed": true,
    "pageNumber": 1,
    "pageId": "page-bho-001",
    "elementId": "elem-lead-story",
    "warning": "यह समाचार पहले ही पृष्ठ 1 पर सम्मिलित किया जा चुका है।"
  }
  ```
- `POST /api/v1/epaper/pages/:pageId/elements`: Appends an article story block to a page. Automatically copies headline, body snippet, byline, and image URL into an isolated `EpaperPageElement`.

### 2.2 Immutable Data Binding Flow
```
┌─────────────────────────────────┐
│   Canonical Source Document     │
│   (newsArticles Collection)     │
│  - status: 'PUBLISHED'          │
│  - title: '...'                 │
│  - byline: '...'                │
└────────────────┬────────────────┘
                 │ Read-Only Sourcing
                 ▼
┌─────────────────────────────────┐
│   E-Paper Page Element Document │
│   (epaperPages.elements[])      │
│  - elementType: 'STORY'         │
│  - articleId: '...' (Reference) │
│  - customHeadline: '...'        │
│  - byline: '...' (Snapshot)     │
│  - bounds: {x, y, w, h}         │
└─────────────────────────────────┘
```

### 2.3 Editorial Workflow & Duplicate Handling UI
In the News Selection Desk modal (`src/screens/AdminControlScreen.tsx`), editors view a drawer of candidate articles. Selecting an article queries `/check-article/:articleId`. If the article has been placed elsewhere, an amber warning banner is rendered, allowing the editor to either cancel or execute an intentional cross-page editorial placement (e.g. Front Page teaser pointing to an inside continuation).

---

## 3. Files Created & Modified

| File Path | Action | Description |
|:---|:---:|:---|
| `src/server/apiEngine.js` | Modified | Added `/api/v1/epaper/sourcing/articles` and `/check-article/:articleId` endpoints |
| `src/server/persistence/adapter.js` | Modified | Added cross-page element query logic for duplicate detection |
| `src/screens/AdminControlScreen.tsx` | Modified | Added News Selection Desk drawer, article cards, and duplicate warning banners |
| `tests/backend-epaper-management.test.js` | Modified | Added Tier 1 (`T1.2.1`–`T1.2.5`) and Tier 2 (`T2.2.1`–`T2.2.5`) test coverage |

---

## 4. Testing & Verification Evidence

Step 3 functionality is verified by 10 automated tests in `tests/backend-epaper-management.test.js`:

```
▶ Tier 1: Feature Coverage (Step 3: News Selection Desk)
  ✔ T1.2.1: Sourcing approved articles list for target edition date (0.85ms)
  ✔ T1.2.2: Place article onto target page with element position and dimensions (4.91ms)
  ✔ T1.2.3: Verify original news article record remains strictly immutable upon placement (0.48ms)
  ✔ T1.2.4: Track and preserve byline and photographer credits on placed element (2.18ms)
  ✔ T1.2.5: Maintain edition page element order and z-index ordering (3.90ms)
▶ Tier 2: Boundary & Corner Cases (Step 3: News Selection Desk Boundaries)
  ✔ T2.2.1: Duplicate-placement detection when article is placed on same page twice (2.18ms)
  ✔ T2.2.2: Duplicate-placement warning when article is placed across multiple different pages (2.95ms)
  ✔ T2.2.3: Attempt to place an unapproved or draft news article (must be rejected/flagged) (0.35ms)
  ✔ T2.2.4: Attempt to place an archived or deleted article (0.30ms)
  ✔ T2.2.5: Zero-character headline or body text placement handled gracefully (0.45ms)
```

**Verification Result:** 10 passed, 0 failed. Execution duration: ~18.5 ms. Clean exit code 0.

---

## 5. Security & Invariant Compliance
- **Source Immutability Guaranteed**: Cryptographic SHA-256 hash comparison verifies that the source `newsArticles` document remains identical before and after layout placement.
- **Unapproved News Rejection**: Unverified reports or drafts pending fact-checking cannot be placed on broadsheet pages, preventing editorial leakage of unverified stories into print editions.
