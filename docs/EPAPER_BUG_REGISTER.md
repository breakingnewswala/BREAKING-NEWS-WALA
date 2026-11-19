# BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
## SYSTEMATIC BUG & EDGE-CASE REGISTER — E-PAPER MANAGEMENT SYSTEM
### Document ID: DOC-44-EPAPER-BUG-REGISTER-2026-V1.0
**Project:** BREAKING NEWS WALA Hyperlocal Digital News Platform  
**Subsystem:** E-Paper Management System (Steps 1 to 12)  
**Governing Manual:** `AGENTS.md` (DOC-36-AGENTS-ROOT-2026-V1.0) & Golden Development Protocol  
**Audit Status:** **ALL 16 IDENTIFIED DEFECTS & EDGE CASES FULLY RESOLVED & REGRESSION-LOCKED**  
**Associated Automated Tests:** 214 Tests across 4 Canonical Test Suites (0 Failures)  

---

## 1. Executive Summary & Defect Topology

During the iterative engineering, cross-module integration, and adversarial hardening of the BREAKING NEWS WALA E-Paper Management System, a total of **16 defects, typography boundary conditions, geometric collision anomalies, and concurrency race conditions** were detected, triaged, and permanently resolved.

Every single resolved defect is locked down by dedicated automated regression tests across `tests/backend-epaper-management.test.js`, `tests/epaper-layout-engine.test.js`, `tests/backend-ai-epaper-step9.test.js`, and `tests/backend-epaper-step10-12.test.js`.

### Defect Distribution by Category
```
┌────────────────────────────────────────────────────────────────────────┐
│                      DEFECT CLASSIFICATION BREAKDOWN                   │
├──────────────────────────────────────────────────┬─────────────────────┤
│ Category A: Indic Typography & Justification     │ 3 Defects (18.75%)  │
│ Category B: Broadsheet Geometry & AABB Collision │ 3 Defects (18.75%)  │
│ Category C: Optimistic Concurrency Control (OCC) │ 2 Defects (12.50%)  │
│ Category D: Quality Preflight & Publishing Gate  │ 3 Defects (18.75%)  │
│ Category E: Advertisement & ASCI Badging         │ 2 Defects (12.50%)  │
│ Category F: WhatsApp Generation & Quotas         │ 2 Defects (12.50%)  │
│ Category G: 300 DPI Prepress Export Engine       │ 1 Defect   (6.25%)  │
├──────────────────────────────────────────────────┼─────────────────────┤
│ Total Systematic Defects Recorded & Resolved     │ 16 Defects (100.0%) │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Comprehensive Defect & Edge-Case Register

### Category A: Indic Typography & Devanagari Justification

#### BUG-EP-001: Devanagari Halant Ligature Splitting under Uniform Justification
- **Severity:** `Critical` (Typographic Integrity)
- **Affected Component:** `src/services/graphicRenderer.ts` (`renderJustifiedDevanagariText`)
- **Symptom:** When justifying Hindi paragraphs, standard word-spacing algorithms distributed inter-character tracking across words, artificially splitting Devanagari conjuncts (e.g. 'क' + '्' + 'ष' = 'क्ष' rendered as disconnected 'क ् ष').
- **Root Cause:** Naive canvas justification routines inserted space between Unicode code points rather than restricting spacing solely to ASCII word breaks (`\s+`). In Devanagari, halants (`\u094D`) and vowel signs (`matras`) must bind immutably to their consonant base.
- **Resolution:** Engineered a Devanagari-aware justification algorithm. It tokenizes lines strictly by whitespace boundaries into whole semantic word clusters, calculates total remaining whitespace ($\Delta W = W_{\text{col}} - \sum W_{\text{words}}$), and distributes $\Delta W / (N_{\text{words}} - 1)$ strictly into the word gaps. Complex conjuncts and halants remain untouched.
- **Automated Regression Test:** `tests/epaper-layout-engine.test.js` -> Test `5.1` & `5.2`, `tests/backend-epaper-management.test.js` -> Test `T1.3.5` & `T2.3.1`.

#### BUG-EP-002: Typographic "White Rivers" on Sparse or Single-Word Lines
- **Severity:** `High` (Visual Quality)
- **Affected Component:** `src/services/graphicRenderer.ts` (`renderJustifiedDevanagariText`)
- **Symptom:** Lines containing a single long compound Hindi word or two short words were stretched across wide broadsheet columns, resulting in massive, unsightly whitespace gaps ("white rivers").
- **Root Cause:** Lack of upper-bound clamping on inter-word gap distribution.
- **Resolution:** Added a strict gap threshold ceiling: if the calculated extra gap per word exceeds $3.0 \times \text{standard space width}$, justification is suspended for that line, falling back to natural left alignment. Furthermore, lines with only one word are explicitly bypassed from justification.
- **Automated Regression Test:** `tests/epaper-layout-engine.test.js` -> Test `5.3` & `5.5`.

#### BUG-EP-003: Paragraph Terminal Line Unintended Full Justification
- **Severity:** `Medium` (Typography Conventions)
- **Affected Component:** `src/services/graphicRenderer.ts`
- **Symptom:** The final line of a paragraph containing only 3 or 4 words was stretched across the full width of the column, violating standard newspaper typesetting conventions.
- **Root Cause:** The line formatting loop did not distinguish between intermediate wrapped lines and the terminal line of a paragraph.
- **Resolution:** Added paragraph boundary detection. The final line of any paragraph or single-line headline is explicitly tagged as `isLastLine = true` and rendered with standard natural left alignment without gap expansion.
- **Automated Regression Test:** `tests/epaper-layout-engine.test.js` -> Test `5.4`, `tests/backend-epaper-management.test.js` -> Test `T1.3.6`.

---

### Category B: Broadsheet Geometry, Magnetic Snapping & AABB Collision

#### BUG-EP-004: False Collision on Edge-Adjacent Touching Bounding Boxes
- **Severity:** `High` (Layout Editing Blocker)
- **Affected Component:** `src/services/graphicRenderer.ts` (`checkAABBCollision`)
- **Symptom:** In the Page Designer, placing two elements exactly adjacent to each other (e.g. Element A right edge at $x=300$, Element B left edge at $x=300$) triggered a collision alert and prevented snapping.
- **Root Cause:** Standard inequality comparison used $\le$ and $\ge$ (`box1.x + box1.w >= box2.x`), causing zero-distance contiguous borders to register as overlapping.
- **Resolution:** Implemented a numerical epsilon tolerance of $0.5\text{px}$:
  $$\text{Collision} \iff (x_1 < x_2 + w_2 - 0.5) \land (x_1 + w_1 > x_2 + 0.5) \land (y_1 < y_2 + h_2 - 0.5) \land (y_1 + h_1 > y_2 + 0.5)$$
  Edge-adjacent elements now touch cleanly with zero false-positive collision flags.
- **Automated Regression Test:** `tests/epaper-layout-engine.test.js` -> Test `4.2`, `tests/backend-epaper-management.test.js` -> Test `T2.3.6`.

#### BUG-EP-005: Magnetic Snapping Overshoot at Exact 8px Boundary
- **Severity:** `Medium` (UX Precision)
- **Affected Component:** `src/services/graphicRenderer.ts` (`calculateSnap`)
- **Symptom:** Elements dragged near grid columns snapped intermittently when approaching from the negative direction at exactly $-8.0\text{px}$.
- **Root Cause:** Floating point precision discrepancies (`Math.abs(delta) <= 8`) where delta was $-8.000000001$.
- **Resolution:** Introduced epsilon rounding before threshold evaluation (`Math.abs(Math.round(delta * 100) / 100) <= 8.0`). Added explicit tests verifying exact snapping at $+8.0\text{px}$ and $-8.0\text{px}$, and non-snapping at $8.5\text{px}$.
- **Automated Regression Test:** `tests/epaper-layout-engine.test.js` -> Tests `3.1`, `3.2`, `3.3`.

#### BUG-EP-006: Out-of-Bounds Page Elements Exceeding Printable Broadsheet Canvas
- **Severity:** `High` (Export & Layout Corruption)
- **Affected Component:** `src/services/graphicRenderer.ts` (`validateElementBounds`)
- **Symptom:** Elements resized or dragged beyond the bottom margin or right gutter caused text clipping in canvas rendering and export overflow.
- **Root Cause:** Absence of server-side boundary validation in page element update endpoints.
- **Resolution:** Enforced hard clamping and validation on element bounds:
  $$x \ge 0, \quad y \ge 0, \quad x + w \le W_{\text{broadsheet}}, \quad y + h \le H_{\text{broadsheet}}$$
  Elements exceeding printable bounds are either clamped or rejected with HTTP 400.
- **Automated Regression Test:** `tests/epaper-layout-engine.test.js` -> Test `1.4`, `tests/backend-epaper-management.test.js` -> Test `T2.3.4`.

---

### Category C: Optimistic Concurrency Control (OCC) & Persistence

#### BUG-EP-007: Stale Write Overwrite during Multi-Editor Page Layout
- **Severity:** `Critical` (Data Integrity)
- **Affected Component:** `src/server/persistence/adapter.js` & `src/server/apiEngine.js`
- **Symptom:** When two editors opened the same page simultaneously, the second editor's save silently wiped out the first editor's changes.
- **Root Cause:** Lack of optimistic concurrency version checking on `epaperPages` document updates.
- **Resolution:** Codified strict OCC versioning across all E-Paper collections. Every update request must provide the client's current `version`. The adapter verifies `doc.version === payload.version`. On match, the update proceeds and increments `version + 1`. On mismatch, it rejects immediately with HTTP 409 Conflict (`ERR_OCC_CONFLICT`).
- **Automated Regression Test:** `tests/epaper-layout-engine.test.js` -> Test `6.2`, `tests/backend-epaper-management.test.js` -> Test `T1.9.2` & `T2.9.1`.

#### BUG-EP-008: Race Condition on Simultaneous Version Snapshots
- **Severity:** `High` (Publishing Integrity)
- **Affected Component:** `src/server/apiEngine.js` (`/api/v1/epaper/editions/:id/publish`)
- **Symptom:** Rapid dual-click on the "Publish" button resulted in duplicate version snapshots in `epaperEditionVersions`.
- **Root Cause:** Non-atomic read-then-write sequence in the publishing gateway route.
- **Resolution:** Encapsulated snapshot generation within an atomic lock in the persistence adapter. If an edition's status is already `PUBLISHED` or its version has transitioned, subsequent publish invocations return the existing published snapshot without re-incrementing.
- **Automated Regression Test:** `tests/backend-epaper-management.test.js` -> Test `T2.9.2`.

---

### Category D: Quality Preflight Diagnostics & Publishing Gate

#### BUG-EP-009: Preflight Silent Pass on Orphan Headline Elements
- **Severity:** `High` (Editorial Quality)
- **Affected Component:** `src/server/quality/preflightScanner.js` (`checkOrphanHeadlines`)
- **Symptom:** Editors could place headline elements with zero accompanying story text, leading to blank broadsheet sections upon publication.
- **Root Cause:** The scanner only checked for empty strings (`headline === ''`), failing to detect headlines whose associated body text was completely empty or whose colSpan had no linked story.
- **Resolution:** Created `checkOrphanHeadlines` diagnostic check. Headline elements that have no attached story article or custom body text are flagged as `ORPHAN_HEADLINE` with severity `BLOCKER`.
- **Automated Regression Test:** `tests/backend-epaper-step10-12.test.js` -> Test `10.5`, `tests/backend-epaper-management.test.js` -> Test `T2.7.1`.

#### BUG-EP-010: Publishing Gate Permitting `BLOCKER` Diagnostics on Bypass Flags
- **Severity:** `Critical` (Gate Enforcement)
- **Affected Component:** `src/server/apiEngine.js` (`/publish`)
- **Symptom:** Submitting a publish request with query parameters or malformed payloads bypassed preflight evaluation.
- **Root Cause:** The publishing controller executed the preflight scanner but did not assert `hasBlocker === false` prior to writing the `PUBLISHED` status.
- **Resolution:** Strengthened the publishing gate. Prior to any state transition, `runPreflightScan()` is executed server-side. If `diagnostics.summary.blockers > 0`, the server immediately halts the transaction and returns HTTP 422 Unprocessable Entity with error code `ERR_PREFLIGHT_BLOCKER` and the full list of unresolved blockers.
- **Automated Regression Test:** `tests/backend-epaper-step10-12.test.js` -> Test `10.8`, `tests/backend-epaper-management.test.js` -> Test `T2.7.2`.

#### BUG-EP-011: Text Overflow False Negatives on Multi-Column Stories
- **Severity:** `High` (Layout Integrity)
- **Affected Component:** `src/server/quality/preflightScanner.js` (`checkTextOverflow`)
- **Symptom:** Stories spanning multiple columns with large font sizes overflowed vertically beyond element bounding boxes without triggering `TEXT_OVERFLOW`.
- **Root Cause:** Height calculation estimated text length based on single-column width rather than dividing text volume across active `colSpan`.
- **Resolution:** Calibrated column height math in `checkTextOverflow`:
  $$\text{Effective Width} = \text{colSpan} \times W_{\text{col}} + (\text{colSpan} - 1) \times W_{\text{gutter}}$$
  $$\text{Required Height} = \left\lceil \frac{\text{Text Length} \times \text{Char Width}}{\text{Effective Width}} \right\rceil \times \text{Line Height}$$
  If $\text{Required Height} > \text{Element Height} + 10\text{px}$, `TEXT_OVERFLOW` (`BLOCKER`) is reliably triggered.
- **Automated Regression Test:** `tests/backend-epaper-step10-12.test.js` -> Test `10.1`, `tests/backend-epaper-management.test.js` -> Test `T1.7.3`.

---

### Category E: Broadsheet Advertisement & ASCI Badging

#### BUG-EP-012: Commercial Advertisements Missing Mandatory ASCI 'विज्ञापन' Badge
- **Severity:** `Critical` (Legal & Regulatory Compliance)
- **Affected Component:** `src/server/monetization/adManager.js` & `src/services/graphicRenderer.ts`
- **Symptom:** When dragging custom ad banners onto canvas pages, the required ASCI Hindi label 'विज्ञापन' was occasionally omitted if the advertiser image had no metadata.
- **Root Cause:** ASCI badge was applied conditionally based on client-supplied flags rather than being enforced server-side.
- **Resolution:** Mandated ASCI badge stamping in the backend layout persistence pipeline. Every element with `elementType === 'AD'` automatically has `asciBadge: true` stamped by the server. Furthermore, `preflightScanner` verifies that every ad element includes the badge, flagging any omission as `UNAPPROVED_AD_PLACEMENT` (`BLOCKER`).
- **Automated Regression Test:** `tests/backend-epaper-management.test.js` -> Test `T1.5.3` & `T2.5.2`, `tests/backend-epaper-step10-12.test.js` -> Test `10.4`.

#### BUG-EP-013: Negative or Zero Dimension Ad Placement Crashing Layout Engine
- **Severity:** `Medium` (Stability)
- **Affected Component:** `src/server/apiEngine.js` (`/api/v1/epaper/ads/place`)
- **Symptom:** Ingesting ads with zero or negative widths/heights resulted in NaN values in canvas transformation matrices, crashing the renderer.
- **Root Cause:** Absence of input schema validation on custom ad geometry.
- **Resolution:** Added strict dimensional bounds validation:
  $$W_{\text{ad}} \ge 20\text{px}, \quad H_{\text{ad}} \ge 20\text{px}$$
  Non-conforming dimensions are rejected with HTTP 400 Bad Request.
- **Automated Regression Test:** `tests/backend-epaper-management.test.js` -> Test `T2.5.1`.

---

### Category F: WhatsApp Generation & Quotas

#### BUG-EP-014: Daily WhatsApp Generation Quota Bypass via Rapid Concurrent Requests
- **Severity:** `High` (Resource Protection & Rate Limiting)
- **Affected Component:** `src/server/apiEngine.js` (`/api/v1/epaper/whatsapp/generate`)
- **Symptom:** Reporters firing multiple asynchronous requests simultaneously were able to generate 25-30 WhatsApp cards, bypassing the 20 cards/day limit.
- **Root Cause:** Asynchronous check-then-increment race condition where the current count was read before concurrent generations committed their counter.
- **Resolution:** Implemented atomic transaction-based counter incrementation in `src/server/apiEngine.js`. If `currentCount >= 20`, subsequent requests are immediately rejected with HTTP 429 Too Many Requests (`ERR_QUOTA_EXHAUSTED`).
- **Automated Regression Test:** `tests/backend-ai-epaper-step9.test.js` -> Test `8.5`, `tests/backend-epaper-management.test.js` -> Test `T1.6.1`, `T2.6.2`, `T3.8`.

#### BUG-EP-015: WhatsApp News Card Headline Text Overflow on Small Cards
- **Severity:** `Medium` (Visual Quality)
- **Affected Component:** `src/services/graphicRenderer.ts` (`renderWhatsAppCard`)
- **Symptom:** Long Devanagari breaking headlines overflowed past the bottom boundary of 1:1 and 4:5 social cards.
- **Root Cause:** Fixed font size without line wrapping truncation or ellipsis.
- **Resolution:** Added automatic font size scaling and 3-line max ellipsis clamping (`...`) in `GraphicRenderer.renderWhatsAppCard`.
- **Automated Regression Test:** `tests/backend-epaper-management.test.js` -> Test `T2.6.3`.

---

### Category G: 300 DPI Prepress Export Engine

#### BUG-EP-016: Missing PDF MediaBox Coordinates in High-Resolution PDF Stream
- **Severity:** `High` (Prepress Standard)
- **Affected Component:** `src/server/export/exportEngine.js` (`buildPrintReadyPdf`)
- **Symptom:** Commercial print RIP software failed to parse exported PDF pages because the `/MediaBox` dictionary was missing explicit bounding points.
- **Root Cause:** Custom binary PDF generator emitted `/CropBox` without an explicit parent `/MediaBox [0 0 932.6 1474.0]`.
- **Resolution:** Updated `exportEngine.js` to emit compliant PDF-1.4 stream headers containing exact MediaBox points, TrimBox points ($299\text{ mm} \times 440\text{ mm}$ printable area), BleedBox, and vector registration marks.
- **Automated Regression Test:** `tests/backend-epaper-step10-12.test.js` -> Test `12.2`, `tests/backend-epaper-management.test.js` -> Test `T1.8.5`.

---

## 3. Bug Resolution Summary & Verification Matrix

| Bug ID | Category | Title | Severity | Status | Regression Test Reference |
|:---:|:---:|:---|:---:|:---:|:---|
| **BUG-EP-001** | Indic Typography | Devanagari Halant Ligature Splitting | Critical | **RESOLVED** | `tests/epaper-layout-engine.test.js` (5.1, 5.2) |
| **BUG-EP-002** | Indic Typography | Typographic "White Rivers" on Sparse Lines | High | **RESOLVED** | `tests/epaper-layout-engine.test.js` (5.3, 5.5) |
| **BUG-EP-003** | Indic Typography | Paragraph Terminal Line Unintended Full Justification | Medium | **RESOLVED** | `tests/epaper-layout-engine.test.js` (5.4) |
| **BUG-EP-004** | Geometry/Collision| False Collision on Edge-Adjacent Bounding Boxes | High | **RESOLVED** | `tests/epaper-layout-engine.test.js` (4.2) |
| **BUG-EP-005** | Snapping | Magnetic Snapping Overshoot at Exact 8px Boundary | Medium | **RESOLVED** | `tests/epaper-layout-engine.test.js` (3.1, 3.2, 3.3) |
| **BUG-EP-006** | Canvas Bounds | Out-of-Bounds Page Elements Exceeding Canvas | High | **RESOLVED** | `tests/epaper-layout-engine.test.js` (1.4) |
| **BUG-EP-007** | Persistence OCC | Stale Write Overwrite during Multi-Editor Layout | Critical | **RESOLVED** | `tests/epaper-layout-engine.test.js` (6.2) |
| **BUG-EP-008** | Concurrency | Race Condition on Simultaneous Version Snapshots | High | **RESOLVED** | `tests/backend-epaper-management.test.js` (T2.9.2) |
| **BUG-EP-009** | Quality Preflight | Preflight Silent Pass on Orphan Headline Elements | High | **RESOLVED** | `tests/backend-epaper-step10-12.test.js` (10.5) |
| **BUG-EP-010** | Publishing Gate | Publishing Gate Permitting BLOCKER Diagnostics | Critical | **RESOLVED** | `tests/backend-epaper-step10-12.test.js` (10.8) |
| **BUG-EP-011** | Quality Preflight | Text Overflow False Negatives on Multi-Column Stories | High | **RESOLVED** | `tests/backend-epaper-step10-12.test.js` (10.1) |
| **BUG-EP-012** | Ad Regulatory | Commercial Ads Missing Mandatory ASCI 'विज्ञापन' Badge | Critical | **RESOLVED** | `tests/backend-epaper-management.test.js` (T1.5.3) |
| **BUG-EP-013** | Ad Geometry | Negative or Zero Dimension Ad Placement | Medium | **RESOLVED** | `tests/backend-epaper-management.test.js` (T2.5.1) |
| **BUG-EP-014** | Rate Limiting | Daily WhatsApp Quota Bypass via Rapid Requests | High | **RESOLVED** | `tests/backend-ai-epaper-step9.test.js` (8.5) |
| **BUG-EP-015** | Typography | WhatsApp News Card Headline Overflow | Medium | **RESOLVED** | `tests/backend-epaper-management.test.js` (T2.6.3) |
| **BUG-EP-016** | 300 DPI Export | Missing PDF MediaBox Coordinates in Export Stream | High | **RESOLVED** | `tests/backend-epaper-step10-12.test.js` (12.2) |
