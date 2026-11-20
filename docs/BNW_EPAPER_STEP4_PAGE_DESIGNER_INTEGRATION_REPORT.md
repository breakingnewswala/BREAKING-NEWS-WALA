# BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
## E-Paper Module Step 4 Completion Report: Page Designer & Newspaper Design System Integration
**Document ID:** `BNW-EPAPER-STEP4-REPORT-2026-V1.0`  
**Date:** 2026-11-20  
**Phase:** Phase 1 / Phase 2 E-Paper Module  
**Status:** COMPLETE / EMPIRICALLY VALIDATED  
**Governing Documents:** `AGENTS.md`, `docs/05-Workflows.md`, `docs/06-Business-Rules.md`, `docs/11-Architecture.md`, `docs/12-Database.md`, `docs/13-API.md`

---

### Executive Summary

In accordance with **STEP 4** of the BREAKING NEWS WALA E-Paper roadmap, full integration has been achieved between the **News Selection Desk (Step 3)**, the **E-Paper Page Designer (Step 2)**, the **Standard Broadsheet Newspaper Design Templates (32.9 cm × 52.0 cm)**, and **Multi-surface Production Prepress Composition**.

The system enables authorized desk editors and administrators to seamlessly load approved and assigned stories into the designer, auto-arrange or fine-tune page geometry across three operational designer modes (**AUTO**, **ASSISTED**, **MANUAL**), receive real-time warnings for missing images or credits, and commit changes with absolute source article immutability and published edition freeze protection.

All 12 tests in `tests/test-epaper-step4-designer-integration.test.js` along with all historical regression test suites (Step 1, Step 2, Step 3, and layout engine) passed with 100% success. Both `tsc --noEmit` and `npm run build` executed with zero errors.

---

### 1. Integrated Components & Workflows

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          STEP 3: NEWS SELECTION DESK                                   │
│  • Discover & Filter Approved News (District, Category, Priority, Image, Length)       │
│  • Review Editorial Credits (Reporter Byline, Photographer, Desk Editor)               │
│  • Assign to Edition Page (P1–P12 for Daily; P1–Pn for Special)                        │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │ API: POST /api/v1/epaper/editions/:id/assign
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                 STEP 4: PAGE DESIGNER & DESIGN SYSTEM INTEGRATION                      │
│                                                                                        │
│   ┌─────────────────────┐   ┌───────────────────────┐   ┌──────────────────────────┐   │
│   │   AUTO PACKING      │   │   ASSISTED SNAPPING   │   │   MANUAL POSITIONING     │   │
│   │ • Priority ordering │   │ • 8px magnetic snap   │   │ • Freeform pixel move    │   │
│   │ • Broadsheet skyline│   │ • Alignment guides    │   │ • Cross-page move        │   │
│   │ • 0 collision pack  │   │ • Collision detection │   │ • Custom print overrides │   │
│   └─────────────────────┘   └───────────────────────┘   └──────────────────────────┘   │
│                                          │                                             │
│   ┌──────────────────────────────────────▼─────────────────────────────────────────┐   │
│   │ 9 Broadsheet Templates (32.9 cm × 52 cm) | Multi-column Grids (3, 4, 5, 6, 8 cols)   │   │
│   └────────────────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        RENDER PARITY & PREPRESS OUTPUT                                 │
│  • Designer Canvas (2D Context, Devanagari typography, Indic conjunct protection)      │
│  • Public Reader (SVG Overlay, vector hotspots, zoom/pan navigation)                   │
│  • HighResExportEngine (300 DPI PNG 3886×6142 px, PDF-1.4 Prepress with metadata)    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Key Functional Integrations:
1. **Direct Desk-to-Designer Sync**: `EpaperDesignerModal.tsx` fetches approved stories directly via `apiClient.epaper.getEligibleArticles()` and syncs them into the side drawer. Stories already assigned to the active page are tagged, while newly assigned stories are immediately selectable.
2. **Approval Gate Validation**: Both frontend (`handleAddStory`) and backend persistence adapters (`saveEpaperPage`, `assignArticlesToEditionPage`) enforce that only stories in `APPROVED`, `PUBLISHED`, or `epaperWorkflow.status === 'APPROVED_FOR_EPAPER'` can enter the page layout. Unapproved draft stories trigger an immediate `400 ERR_ARTICLE_NOT_APPROVED` rejection.
3. **Cross-Page Element Reassignment**: Stories or graphical elements assigned to Page $N$ can be reassigned directly to Page $M$ via the designer properties dropdown without leaving the modal.

---

### 2. Newspaper Design Templates Specification (32.9 cm × 52 cm)

All 9 canonical broadsheet newspaper page templates have been authored and verified in both `src/data/defaultEpaperTemplates.ts` and `src/server/persistence/defaultEpaperTemplates.js`:

| # | Template ID | Category | Hindi Display Title | Grid Columns | Pre-configured Regions |
|---|---|---|---|:---:|:---:|
| 1 | `tpl-epaper-01-front` | `FRONT_PAGE` | प्रथम पृष्ठ — मुख्य समाचार (Lead & Anchor) | 8 Cols | 6 (Masthead, Lead, Anchor, Off-lead, Briefs, Bottom Ad) |
| 2 | `tpl-epaper-05-district`| `DISTRICT_FOCUS` | जिला हलचल — जनपदीय समाचार (District Focus) | 8 Cols | 5 (Section Header, District Lead, Grid Left, Grid Right, Bottom Strip) |
| 3 | `tpl-epaper-02-state` | `STATE` | मध्य प्रदेश प्रादेशिक — राज्य समाचार (State Focus) | 8 Cols | 5 (Section Header, Top Lead, Side Rail, Lower Grid, Footer Ad) |
| 4 | `tpl-epaper-political` | `POLITICAL` | राजनीति एवं संसद/विधानसभा (Political Dispatch) | 8 Cols | 5 (Political Header, Lead Analysis, Interview Column, Ground Report, Ad) |
| 5 | `tpl-epaper-business-agri` | `BUSINESS` | व्यापार, मंडी भाव एवं कृषि समाचार (Business & Agri) | 8 Cols | 5 (Header, Market Ticker, Agri Lead, Commodity Grid, Sponsor) |
| 6 | `tpl-epaper-education` | `EDUCATION` | शिक्षा, रोजगार एवं युवा करियर (Education & Career) | 8 Cols | 5 (Header, Career Focus, Exam Alert Box, Student Guidance, Ad) |
| 7 | `tpl-epaper-09-sports` | `SPORTS` | खेल जगत — मैदान से (Sports Action) | 8 Cols | 5 (Sports Masthead, Main Sports Visual, Match Report, Briefs, Ad) |
| 8 | `tpl-epaper-04-editorial` | `EDITORIAL` | संपादकीय एवं विचार (Editorial & Op-Ed) | 6 Cols | 5 (Masthead, Lead Editorial, Guest Column, Daily Cartoon, Letters) |
| 9 | `tpl-epaper-special-edition` | `SPECIAL` | विशेषांक / विशेष परिशिष्ट (Special Feature) | 8 Cols | 5 (Special Banner, Feature Splash, Photo Essay, Backgrounder, Ad) |

*All template bounding boxes strictly honor physical margins:*
- Width: $932.6\text{ pt}$ ($329\text{ mm}$)
- Height: $1474.0\text{ pt}$ ($520\text{ mm}$)
- Left Margin: $42.52\text{ pt}$ ($15\text{ mm}$)
- Right Margin: $42.52\text{ pt}$ ($15\text{ mm}$)
- Top Margin: $56.69\text{ pt}$ ($20\text{ mm}$)
- Bottom Margin: $85.04\text{ pt}$ ($30\text{ mm}$)

---

### 3. Page Designer Modes

The designer UI in `EpaperDesignerHeader.tsx` provides a 3-way segmented control allowing desk editors to toggle modes dynamically:

#### A. AUTO Mode (`ऑटो`)
- **Action**: Invokes `LayoutAssistantEngine.autoArrangeLayout`.
- **Skyline Ordering**: Organizes elements according to visual journalism hierarchy:
  $$\text{MASTHEAD / TOP BANNER} \longrightarrow \text{LEAD STORY} \longrightarrow \text{SECOND LEAD} \longrightarrow \text{ANCHOR} \longrightarrow \text{BRIEFS} \longrightarrow \text{FOOTER AD}$$
- **Zero Collision Guarantee**: Calculates multi-column spans ($2$, $3$, $4$, $5$, $6$, $8$ columns), accounts for $14.17\text{ pt}$ ($5\text{ mm}$) gutters, and prevents element overlap and margin boundary breach.

#### B. ASSISTED Mode (`असिस्टेड`)
- **Snapping**: Activates magnetic snap ($8\text{ px}$ threshold) to column gutters, page centerlines, and existing element edges.
- **Dynamic Guidelines**: Computes real-time snap guideline rays on $X$ and $Y$ axes (`generateSnapGuideLines`).
- **Live Collision Warning**: `detectAllCollisions` highlights intersecting blocks with warning halos and surfaces collision counters in the page inspector panel.

#### C. MANUAL Mode (`मैन्युअल`)
- **Freeform Pixel Positioning**: Disables magnetic snapping for fine-grained sub-pixel adjustments.
- **Interactive Tools**:
  - Element Locking (`isLocked`) to protect approved leads.
  - Layer Reordering (Bring to Front, Send to Back).
  - Story Reassignment (Move story element to Page $N$).
  - Duplication (`Ctrl+D`) and Deletion (`Del`).

---

### 4. Warning Indicators & Quality Gates

The system surfaces non-blocking and blocking quality warnings in both the toolbox story cards and the element properties inspector:

1. **Missing Featured Photo**:
   - Tagged on story card: `⚠️ नो फ़ोटो`
   - Banner on inspector: `⚠️ फ़ोटो अनुपलब्ध — यह समाचार बिना मुख्य फ़ोटो के प्रकाशित होगा।`
   - Preflight warning: `MISSING_IMAGE`
2. **Missing Reporter Credit**:
   - Tagged on story card: `⚠️ नो साभार`
   - Banner on inspector: `⚠️ रिपोर्टर साभार रिक्त — डिफ़ॉल्ट ब्यूरो साभार प्रयुक्त होगा।`
   - Preflight warning: `MISSING_REPORTER_CREDIT`
3. **Missing Desk Editor Credit**:
   - Field on inspector: Editable input defaulting to the logged-in editor's name.
   - Preflight warning: `MISSING_EDITOR_CREDIT`
4. **Boundary Overflow Alert**:
   - Triggers when $x + \text{width} > 932.6$ or $y + \text{height} > 1474.0$.
   - Banner on inspector: `⚠️ पृष्ठ सीमा पार (Overflow)`

---

### 5. Immutability Architecture

#### A. Source Article Immutability
- Source articles in `newsArticles` (MongoDB/Firestore/LocalJson) are **never mutated** when assigned to an E-Paper edition.
- Any headline rewrites or copy truncations performed in the designer are stored exclusively in the `EpaperPageElement` as `customHeadline` and `customBodyText`.
- Removing an element from the page clears its assignment in the E-Paper page, leaving the core news article untouched.

#### B. Published Edition Freeze
- Once an edition transition to `PUBLISHED` occurs via `POST /api/v1/epaper/editions/:id/publish`:
  - `saveEpaperPage` immediately throws `400 ERR_EDITION_ALREADY_PUBLISHED`.
  - `assignArticlesToEditionPage` throws `400 ERR_EDITION_ALREADY_PUBLISHED`.
  - All page versions and element coordinates are permanently frozen in the immutable snapshot record (`editionSnapshot`, `pagesSnapshot`).

---

### 6. Empirical Test Results

#### A. Step 4 Dedicated Test Suite (`tests/test-epaper-step4-designer-integration.test.js`)
All 12 test assertions executed and passed:
```
▶ STEP 4: E-PAPER PAGE DESIGNER & NEWSPAPER DESIGN SYSTEM INTEGRATION
  ✔ 1. News-to-Designer Integration: Loads assigned articles with headline, content, images & credits (61.8ms)
  ✔ 2. Unapproved Article Rejection: Cannot add unapproved draft to page composition (3.3ms)
  ✔ 3. Article Ordering & Broadsheet Composition: Multi-column modular grid hierarchy (3.4ms)
  ✔ 4. Newspaper Design Templates: All 9 required categories implemented for 32.9 cm × 52 cm (1.4ms)
  ✔ 5. Page Designer Modes: AUTO packing, ASSISTED snapping/guides, MANUAL freeform & reassignment (77.4ms)
  ✔ 6. Devanagari Rendering: Indic conjunct word wrapping without overflow (1.6ms)
  ✔ 7. Credits & Image Preservation: Missing alerts attached to stories without photo or byline (60.4ms)
  ✔ 8. Page Boundary & Collision Validation: Detects boundaries and reports out-of-bounds (0.8ms)
  ✔ 9. Rendering Parity: Designer, Reader, PNG, and PDF share identical geometry and coordinates (362.3ms)
  ✔ 10. Immutability: Source articles never mutated; published editions reject layout modifications (94.1ms)
  ✔ 11. Regression Compatibility: 12-page Daily rule & Special Edition counts preserved (90.3ms)
✔ STEP 4: E-PAPER PAGE DESIGNER & NEWSPAPER DESIGN SYSTEM INTEGRATION (903.9ms)
ℹ tests 12 | pass 12 | fail 0 | duration_ms 940.3ms
```

#### B. Full Regression Suite Results
| Test Suite File | Focus Area | Status | Pass / Fail |
|---|---|:---:|:---:|
| `tests/test-epaper-step4-designer-integration.test.js` | Step 4 Designer & Templates Integration | **PASSED** | 12 / 0 |
| `tests/test-epaper-step3-selection-workflow.test.js` | Step 3 News Selection & Workflow State Machine | **PASSED** | 11 / 0 |
| `tests/test-epaper-step2-layout-rendering.test.js` | Step 2 Broadsheet Layout & Typography Rendering | **PASSED** | 17 / 0 |
| `tests/test-epaper-daily-12pages-validation.test.js` | Step 1 Daily 12-Page Enforcement & Specials | **PASSED** | 8 / 0 |
| `tests/epaper-layout-engine.test.js` | Broadsheet Grid, Magnetic Snap & AABB Collision | **PASSED** | 31 / 0 |
| **TOTAL** | **Comprehensive E-Paper Module Suites** | **100% PASSED** | **79 / 0** |

#### C. Build & TypeScript Verification
- `npx.cmd tsc --noEmit`: Exited with code 0 (zero errors).
- `npm.cmd run build`: Exited with code 0 in 35.08s (all production bundles emitted in `dist/`).

---

### Conclusion & Readiness

The E-Paper Page Designer, Template Engine, and News Selection Desk are completely integrated, robustly protected by immutable data boundaries, and verified against all multi-column broadsheet physical constraints. STEP 4 is fully complete and ready for the next phase.
