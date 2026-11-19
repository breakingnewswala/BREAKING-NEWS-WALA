# BNW_STEP13_EVIDENCE_INDEX.md — Audit Evidence & Artifact Index
## Document ID: DOC-EPAPER-EVIDENCE-STEP13-2026-V1.0
### Scope: Traceable File Paths, Line References, Commands & Test Logs

---

## 1. Source Code References

| Artifact / Logic Area | File Path | Line Range | Key Functionality / Finding |
| :--- | :--- | :--- | :--- |
| **Broadsheet Geometry & Constants** | `src/utils/epaperLayout.ts` | Lines 10–35 | Exact $32.9\text{ cm} \times 52.0\text{ cm}$ broadsheet geometry (932.6 pt $\times$ 1474.0 pt). |
| **Modular Column Grids** | `src/utils/epaperLayout.ts` | Lines 45–90 | 3, 4, 5, 6, and 8-column layout math with $5.0\text{ mm}$ gutters. |
| **Magnetic Snapping (8px)** | `src/utils/epaperLayout.ts` | Lines 100–145 | Threshold snapping at $\pm 8\text{px}$, ignores offsets $>8.5\text{px}$. |
| **AABB Collision Detection** | `src/utils/epaperLayout.ts` | Lines 150–190 | 2D collision detection with 0.5pt tolerance for adjacent borders. |
| **Devanagari Justification** | `src/services/graphicRenderer.ts` | Lines 415–480 | Justification distributes whitespace across `\s+` word-gaps preserving glyphs. |
| **Fixed 12-Page Daily Broadsheet** | `src/server/persistence/adapter.js` | Line 4614 | `const totalPages = editionType === 'DAILY' ? 12 : ...` strictly enforces 12 pages. |
| **Duplicate Story Check** | `src/server/apiEngine.js` | Lines 1030–1060 | Route `/api/v1/epaper/editions/:id/check-article/:articleId`. |
| **Status Bypass Vulnerability** | `src/server/apiEngine.js` | Lines 1070–1110 | `PUT /status` allows status update to `PUBLISHED` without preflight scanner. |
| **Preflight Diagnostic Scanner** | `src/server/epaper/preflightScanner.js` | Lines 25–120 | 5 diagnostics (`TEXT_OVERFLOW`, `LOW_RES_IMAGE`, `MISSING_ATTRIBUTION`, `UNAPPROVED_AD_PLACEMENT`, `ORPHAN_HEADLINE`). |
| **Atomic Publishing Gate** | `src/server/apiEngine.js` | Lines 1120–1165 | Route `/publish` runs preflight scanner, blocks on errors (422), freezes version snapshot. |
| **Hardcoded Quota** | `src/server/persistence/adapter.js` | Line 5066 | `const maxDaily = 20;` with UTC date split `new Date().toISOString().split('T')[0]`. |
| **Native PDF-1.4 Generator** | `src/server/epaper/exportEngine.js` | Lines 130–330 | MediaBox `[0 0 932.6 1474]`, crop/trim marks, xref tables. Type 1 Helvetica font declared. |
| **300 DPI PNG Generator** | `src/server/epaper/exportEngine.js` | Lines 340–430 | Generates $3886 \times 6142\text{ px}$ PNG with physical chunk `pHYs` ($11,811\text{ px/m} = 300\text{ DPI}$). |
| **Public Broadsheet Reader** | `src/screens/EpaperScreen.tsx` | Lines 50–320 | Newspaper pan/zoom mode, Reading Mode modal with Hindi Web Speech TTS. |
| **Reporter Desk Workspace** | `src/screens/ReporterDeskScreen.tsx` | Lines 180–310 | Beat filtering, 4:5 social clipping generator ($1080 \times 1350\text{ px}$), classified ad submission. |

---

## 2. Test Execution Commands & Outputs

| Command | Working Directory | Exit Code | Result | Key Evidence |
| :--- | :--- | :---: | :---: | :--- |
| `cmd /c "npm run build"` | `d:\BREAKING-NEWS-WALA-main` | `0` | Clean Build | Transformed 2,127 modules in 19.86s into `dist/`. 0 TypeScript errors. |
| `cmd /c "node --test tests/backend-epaper-management.test.js"` | `d:\BREAKING-NEWS-WALA-main` | `0` | 119 Passed | 119/119 passing in 498 ms (Tier 1: 48, Tier 2: 48, Tier 3: 12, Tier 4: 6). |
| `cmd /c "node --test tests/epaper-layout-engine.test.js"` | `d:\BREAKING-NEWS-WALA-main` | `0` | 31 Passed | 31/31 passing in 372 ms (Geometry, Snapping, Collisions, Indic Justification, OCC). |
| `cmd /c "node --test tests/backend-ai-epaper-step9.test.js"` | `d:\BREAKING-NEWS-WALA-main` | `0` | 35 Passed | 35/35 passing in 431 ms (Layout Bin-Packing, MP Districts, Daily Columns, WhatsApp). |
| `cmd /c "node --test tests/backend-epaper-step10-12.test.js"` | `d:\BREAKING-NEWS-WALA-main` | `0` | 29 Passed | 29/29 passing in 1332 ms (Preflight Scanner, Publishing Gate, Reader, 300 DPI Export). |
| `cmd /c "node --test tests/backend-runtime-server.test.js"` | `d:\BREAKING-NEWS-WALA-main` | `0` | 11 Passed | 11/11 passing in 505 ms (Runtime server, healthz, static assets, SPA routes). |
| `cmd /c "node --test tests/backend-master-admin-auth.test.js"` | `d:\BREAKING-NEWS-WALA-main` | `1` | 31 Passed, 1 Failed | Failed on Test #5 line 163 (`assert.ok(Array.isArray(epaperRes.data.data))`). |

---

## 3. Independent Audit Documentation Index

| Audit Document File | Path in Workspace | Purpose / Content |
| :--- | :--- | :--- |
| `BNW_STEP13_INDEPENDENT_AUDIT_REPORT.md` | `docs/BNW_STEP13_INDEPENDENT_AUDIT_REPORT.md` | Master executive audit report and final readiness verdict. |
| `BNW_STEP13_REQUIREMENTS_TRACEABILITY.md` | `docs/BNW_STEP13_REQUIREMENTS_TRACEABILITY.md` | Traceability matrix matching all requirements to code. |
| `BNW_STEP13_API_DISCREPANCY_REPORT.md` | `docs/BNW_STEP13_API_DISCREPANCY_REPORT.md` | Endpoint-by-endpoint schema, role, and caller analysis. |
| `BNW_STEP13_SECURITY_FINDINGS.md` | `docs/BNW_STEP13_SECURITY_FINDINGS.md` | Security vulnerability analysis and bypass findings. |
| `BNW_STEP13_EXPORT_VALIDATION_REPORT.md` | `docs/BNW_STEP13_EXPORT_VALIDATION_REPORT.md` | Prepress binary inspection of PDF-1.4 and 300 DPI PNGs. |
| `BNW_STEP13_BROWSER_TEST_REPORT.md` | `docs/BNW_STEP13_BROWSER_TEST_REPORT.md` | Frontend screens, responsive ergonomics, and typography audit. |
| `BNW_STEP13_TEST_EXECUTION_LOG.md` | `docs/BNW_STEP13_TEST_EXECUTION_LOG.md` | Exact test execution logs, timings, and exit codes. |
| `BNW_STEP13_BUG_REGISTER.md` | `docs/BNW_STEP13_BUG_REGISTER.md` | Prioritized defect registry with reproduction steps and fixes. |
| `BNW_STEP13_EVIDENCE_INDEX.md` | `docs/BNW_STEP13_EVIDENCE_INDEX.md` | Traceable index of code lines, test commands, and artifacts. |
