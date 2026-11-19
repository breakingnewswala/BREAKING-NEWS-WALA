# BNW_STEP13_REQUIREMENTS_TRACEABILITY.md — Requirements Traceability Matrix
## Document ID: DOC-EPAPER-TRACE-STEP13-2026-V1.0
### Scope: Audit Mapping of Original Specifications to Implementation Reality & Evidence

---

## 1. Traceability Status Legend
- **VERIFIED**: Fully implemented in code, passing automated tests, verified with empirical evidence.
- **PARTIALLY VERIFIED**: Implemented with documented gaps, edge cases, or configuration limitations.
- **NOT IMPLEMENTED**: Requirement absent from codebase.
- **FAILED**: Implemented but failing test assertions or specifications.
- **BLOCKED**: Verification impossible due to missing external infrastructure or production boundary.

---

## 2. Requirements Traceability Matrix

| Req ID | Requirement Description | Implementation Location | Test Coverage | Independent Evidence | Audit Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **R-02.1** | E-Paper Studio in Admin Control Room | `src/screens/AdminControlScreen.tsx`, `EpaperStudioTab.tsx` | `tests/backend-epaper-management.test.js` (T1.1.1) | Component mounted at `AdminControlScreen.tsx:432`; tab renders calendar and metrics. | **VERIFIED** |
| **R-02.2** | 55 MP Districts & 10 Divisions Calendar Filter | `src/components/epaper/EpaperStudioTab.tsx`, `src/shared/mpHyperlocalSeed.js` | `tests/backend-epaper-management.test.js` (T1.1.3) | Seed data contains all 55 MP districts; calendar updates filtered state. | **VERIFIED** |
| **R-02.3** | Fixed 12-Page Daily Edition Enforcement | `src/server/persistence/adapter.js` line 4614 | `tests/backend-epaper-management.test.js` (T1.1.1) | `adapter.js:4614`: `editionType === 'DAILY' ? 12 : ...` strictly forces 12 pages. | **VERIFIED** |
| **R-02.4** | Configurable Special Editions (1 to 48 pages) | `src/server/persistence/adapter.js` line 4614 | `tests/backend-epaper-management.test.js` (T1.1.2) | `Math.min(48, Math.max(1, parseInt(editionData.totalPages)))` clamps pages. | **VERIFIED** |
| **R-03.1** | News Selection Desk with Territory Filtering | `src/components/epaper/EpaperNewsSelectionDesk.tsx` | `tests/backend-epaper-management.test.js` (T1.2.1) | Filter controls by district, division, category, date, and image presence. | **VERIFIED** |
| **R-03.2** | Duplicate Story Placement Detection | `src/server/apiEngine.js` line 1031 | `tests/backend-epaper-management.test.js` (T3.3) | `/api/v1/epaper/editions/:id/check-article/:articleId` checks all pages. | **VERIFIED** |
| **R-03.3** | Original News Article Immutability | `src/server/persistence/adapter.js` | `tests/backend-epaper-management.test.js` (T1.2.3) | News article hash verified unchanged before and after broadsheet placement. | **VERIFIED** |
| **R-04.1** | Broadsheet Canvas Geometry ($32.9 \times 52.0\text{ cm}$) | `src/utils/epaperLayout.ts` line 15, `exportEngine.js` | `tests/epaper-layout-engine.test.js` (1.1, 1.2) | 932.6 pt $\times$ 1474.0 pt at 72 DPI, printable boundary 847.56 pt $\times$ 1247.24 pt. | **VERIFIED** |
| **R-04.2** | Modular Column Grids (3, 4, 5, 6, 8 columns) | `src/utils/epaperLayout.ts` line 52 | `tests/epaper-layout-engine.test.js` (2.1) | Mathematical column widths with 5mm (14.17pt) gutters across all 5 tiers. | **VERIFIED** |
| **R-04.3** | 8px Magnetic Snapping Engine | `src/utils/epaperLayout.ts` line 105 | `tests/epaper-layout-engine.test.js` (3.1-3.5) | Threshold snapping at $\pm 8\text{px}$, ignores candidate offsets $>8.5\text{px}$. | **VERIFIED** |
| **R-04.4** | 2D AABB Collision Detection | `src/utils/epaperLayout.ts` line 160 | `tests/epaper-layout-engine.test.js` (4.1-4.4) | Bounding box intersection check with 0.5pt tolerance for adjacent borders. | **VERIFIED** |
| **R-04.5** | Ligature-Safe Devanagari Justification | `src/services/graphicRenderer.ts` line 420 | `tests/epaper-layout-engine.test.js` (5.1-5.5) | Word-gap distribution across `\s+` spaces; protects matras, halants, conjuncts. | **VERIFIED** |
| **R-04.6** | 3-Panel Page Designer Interface | `src/screens/EpaperDesignerModal.tsx` | Manual UI Audit | Left stories/assets drawer, center pan/zoom canvas, right property inspector. | **VERIFIED** |
| **R-05.1** | 12 Canonical Broadsheet Page Presets | `src/data/defaultEpaperTemplates.ts` | `tests/backend-epaper-management.test.js` (T1.4.1) | Pages 1 to 12 preset templates covering Front, State, Op-Ed, Sports, etc. | **VERIFIED** |
| **R-05.2** | AI Template Layout Analyzer | `src/server/ai/templateAnalyzer.js` | `tests/backend-epaper-management.test.js` (T1.4.4) | Structural geometric analysis with `bnw-mock-v1` offline heuristic fallback. | **VERIFIED** |
| **R-06.1** | Print Ad Formats & Aspect Ratios | `src/server/monetization/epaperAds.js` | `tests/backend-epaper-management.test.js` (T1.5.1, T1.5.2) | 1:1, 3:4, 2:3, 4:3, 16:9, L-shape, ear panel, bottom strip, half, full page. | **VERIFIED** |
| **R-06.2** | Mandatory ASCI 'विज्ञापन' Badge Stamping | `src/server/monetization/epaperAds.js` line 85 | `tests/backend-epaper-management.test.js` (T1.5.3, T2.5.2) | Automated badge stamping; unapproved ads blocked by preflight scanner. | **VERIFIED** |
| **R-06.3** | Reporter Classified Ad Intake | `src/screens/ReporterDeskScreen.tsx`, `apiEngine.js` line 1570 | `tests/backend-epaper-management.test.js` (T1.5.4) | Endpoint `/ads/submit-classified` with district rate card calculation. | **VERIFIED** |
| **R-07.1** | Reporter Desk Integration & Beat Access | `src/screens/ReporterDeskScreen.tsx` | `tests/backend-epaper-management.test.js` (T1.6.1) | Accredited stringer desk filterable by assigned primary and secondary districts. | **VERIFIED** |
| **R-07.2** | 4:5 Social Clipping Generator | `src/services/graphicRenderer.ts` line 680 | `tests/backend-epaper-management.test.js` (T1.6.2) | Generates $1080 \times 1350\text{ px}$ canvas with reporter portrait and `BNW-REP-XXXX` badge. | **VERIFIED** |
| **R-08.1** | WhatsApp Card Generator (1:1 & 4:5) | `src/server/apiEngine.js` line 1587 | `tests/backend-epaper-management.test.js` (T1.6.3, T1.6.4) | High-speed mobile news card generation with justified Devanagari typography. | **VERIFIED** |
| **R-08.2** | Private Storage Isolation | `src/server/persistence/adapter.js` line 5030 | `tests/backend-epaper-management.test.js` (T1.6.5) | Cards saved under `whatsapp/${reporterId}/` with `isPrivate: true`. | **VERIFIED** |
| **R-08.3** | Configurable Per-Reporter Daily Quota | `src/server/persistence/adapter.js` line 5066 | `tests/backend-epaper-management.test.js` (T2.6.1) | **GAP**: Quota is hardcoded to `const maxDaily = 20`. No custom quota schema exists. Date resets on UTC instead of IST. | **PARTIALLY VERIFIED** |
| **R-09.1** | Layout Assistant Engine | `src/server/ai/layoutAssistant.js` | `tests/backend-ai-epaper-step9.test.js` (9.1.1-9.1.5) | 2D column skyline bin-packing with zero-collision guarantees against ads. | **VERIFIED** |
| **R-09.2** | Category Classifier Engine | `src/server/ai/categoryAnalyzer.js` | `tests/backend-ai-epaper-step9.test.js` (9.2.1-9.2.9) | Maps 55 MP districts and beats to 12 broadsheet sections; null-safe. | **VERIFIED** |
| **R-09.3** | Permanent Daily Columns | `src/server/ai/permanentColumns.js` | `tests/backend-ai-epaper-step9.test.js` (9.3.1-9.3.6) | 5 columns (*Panchang*, *Editorial*, *Mandi Rates*, *Weather*, *District Roundup*) with attribution. | **VERIFIED** |
| **R-10.1** | 5 Preflight Diagnostics Scanner | `src/server/epaper/preflightScanner.js` | `tests/backend-epaper-step10-12.test.js` (10.1-10.6) | `TEXT_OVERFLOW`, `LOW_RES_IMAGE`, `MISSING_ATTRIBUTION`, `UNAPPROVED_AD_PLACEMENT`, `ORPHAN_HEADLINE`. | **VERIFIED** |
| **R-10.2** | Atomic Publishing Gate & Version Snapshots | `src/server/apiEngine.js` line 1120 | `tests/backend-epaper-step10-12.test.js` (10.8-10.11) | Rejects blockers with HTTP 422, freezes immutable snapshot in `epaperEditionVersions`. | **VERIFIED** |
| **R-10.3** | Preflight Bypass Prevention on Status Update | `src/server/apiEngine.js` line 1070 | Code Inspection | **GAP**: `PUT /api/v1/epaper/editions/:id/status` can set status to `PUBLISHED` without running preflight scanner or saving snapshot. | **PARTIALLY VERIFIED** |
| **R-11.1** | Public Broadsheet Reader (Newspaper Mode) | `src/screens/EpaperScreen.tsx`, `publicReader.js` | `tests/backend-epaper-step10-12.test.js` (11.1, 11.2) | Interactive broadsheet viewer with $0.5\times$–$4.0\times$ pan/zoom and page navigation. | **VERIFIED** |
| **R-11.2** | Public Reader (Reading Mode Modal) | `src/screens/EpaperScreen.tsx` line 210 | `tests/backend-epaper-step10-12.test.js` (11.3) | Mobile article reader with Devanagari font scaling (14–26px) and Web Speech Hindi TTS. | **VERIFIED** |
| **R-11.3** | Historical Archive Date/District Search | `src/server/epaper/publicReader.js`, `apiEngine.js` line 1195 | `tests/backend-epaper-step10-12.test.js` (11.5, 11.6) | Filters published editions by date, division, and district; excludes drafts. | **VERIFIED** |
| **R-12.1** | Commercial Print PDF-1.4 Generation | `src/server/epaper/exportEngine.js` line 140 | `tests/backend-epaper-step10-12.test.js` (12.2) | Valid binary PDF-1.4 with MediaBox `[0 0 932.6 1474]` ($32.9 \times 52\text{ cm}$) and crop marks. | **VERIFIED** |
| **R-12.2** | Authentic 300 DPI PNG Rasterization | `src/server/epaper/exportEngine.js` line 250 | `tests/backend-epaper-step10-12.test.js` (12.3) | Authentic $3886 \times 6142\text{ px}$ PNG with `pHYs` chunk (11,811 pixels/meter = 300 DPI). | **VERIFIED** |
| **R-12.3** | PDF/X-1a & TrueType Font Embedding Claims | `src/server/epaper/exportEngine.js` line 315 | Binary Inspection (`scratch_inspect_export`) | **GAP**: Claims PDF/X-1a:2001, but lacks TrueType Devanagari font embedding (uses Type 1 Helvetica), lacks `/OutputIntents`, and uses DeviceRGB operators. | **PARTIALLY VERIFIED** |
