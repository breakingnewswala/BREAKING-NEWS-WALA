# BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
# STEP 17 — REQUIREMENTS & AUDIT TRACEABILITY MATRIX

**Project:** BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)  
**Document ID:** `BNW-DOC-EPAPER-STEP17-TRACEABILITY-2026-V1.0`  
**Classification:** Requirements Traceability & Verification Record  
**Audit Phase:** Post-STEP 16 Independent Verification  
**Audit Date:** 2026-11-18  

---

## 1. Traceability: Core E-Paper Features (F1–F21)

| Feature ID | Feature Title | Canonical Implementation Source | Test Verification Suite | Audit Status |
| :---: | :--- | :--- | :--- | :---: |
| **F01** | Daily & Special Edition Calendar & CRUD | `src/server/apiEngine.js:1298-1335`<br>`adapter.js:4608-4740` | `tests/backend-epaper-management.test.js` (T1.1.1–T1.1.6) | **VERIFIED** |
| **F02** | Broadsheet Canvas (32.9 cm x 52.0 cm) | `src/server/epaper/exportEngine.js:29-45`<br>`tests/epaper-layout-engine.test.js` | `tests/epaper-layout-engine.test.js` (1.1–1.4) | **VERIFIED** |
| **F03** | Modular Column Grids (3, 4, 5, 6, 8 col) | `src/server/ai/layoutAssistant.js:30-80` | `tests/epaper-layout-engine.test.js` (2.1–2.4) | **VERIFIED** |
| **F04** | Magnetic Snapping Engine (8px Threshold) | `src/screens/EpaperDesignerModal.tsx:420-510` | `tests/epaper-layout-engine.test.js` (3.1–3.5) | **VERIFIED** |
| **F05** | 2D AABB Collision Detection | `src/server/ai/layoutAssistant.js:140-190` | `tests/epaper-layout-engine.test.js` (4.1–4.4) | **VERIFIED** |
| **F06** | Devanagari Typography Justification | `src/screens/EpaperDesignerModal.tsx:750-810` | `tests/epaper-layout-engine.test.js` (5.1–5.5) | **VERIFIED** |
| **F07** | Editorial Sourcing & Placement | `src/server/apiEngine.js:1031-1050`<br>`adapter.js:4630-4660` | `tests/backend-epaper-management.test.js` (T1.2.1–T1.2.5) | **VERIFIED** |
| **F08** | OCR Raw Text Ingestion | `src/server/apiEngine.js:1480-1510` | `tests/backend-epaper-management.test.js` (T1.4.1–T1.4.4) | **VERIFIED** |
| **F09** | AI Auto-Layout Bin-Packing | `src/server/ai/layoutAssistant.js:220-330` | `tests/backend-ai-epaper-step9.test.js` (9.1.1–9.1.5) | **VERIFIED** |
| **F10** | AI Category Classifier (8 Page Types) | `src/server/ai/categoryAnalyzer.js:40-110` | `tests/backend-ai-epaper-step9.test.js` (9.2.1–9.2.9) | **VERIFIED** |
| **F11** | Permanent Columns Engine (5 Types) | `src/server/ai/permanentColumns.js:30-180` | `tests/backend-ai-epaper-step9.test.js` (9.3.1–9.3.6) | **VERIFIED** |
| **F12** | WhatsApp Smart Card Generator | `src/server/apiEngine.js:1622-1670` | `tests/backend-ai-epaper-step9.test.js` (8.1–8.5) | **VERIFIED** |
| **F13** | Reporter WhatsApp Daily Quota | `src/server/persistence/adapter.js:5040-5165` | `tests/backend-epaper-step14-remediation.test.js` (P2.1–P2.4) | **VERIFIED** |
| **F14** | Multi-District Classified Ads Ingestion | `src/server/apiEngine.js:1540-1615`<br>`adapter.js:5170-5240` | `tests/backend-epaper-step10-12.test.js` (10.1.1–10.1.6) | **VERIFIED** |
| **F15** | Dynamic Classified Rate Card Calculator | `src/server/monetization/epaperAds.js:40-90` | `tests/backend-epaper-step10-12.test.js` (10.2.1–10.2.6) | **VERIFIED** |
| **F16** | AI Classified Ad Copy Generator | `src/server/apiEngine.js:1595-1615` | `tests/backend-epaper-step10-12.test.js` (10.3.1–10.3.4) | **VERIFIED** |
| **F17** | Geometric Template Analyzer | `src/server/ai/templateAnalyzer.js:30-120` | `tests/backend-epaper-step10-12.test.js` (11.1.1–11.1.5) | **VERIFIED** |
| **F18** | Template CRUD with OCC Versioning | `src/server/apiEngine.js:1460-1540`<br>`adapter.js:4950-5030` | `tests/backend-epaper-step10-12.test.js` (11.2.1–11.2.5) | **VERIFIED** |
| **F19** | 5-Point Quality Preflight Scanner | `src/server/apiEngine.js:1149-1159`<br>`tests/backend-epaper-management.test.js` | `tests/backend-epaper-management.test.js` (T2.2.1–T2.2.5) | **VERIFIED** |
| **F20** | Edition Versioning & Snapshots | `src/server/persistence/adapter.js:5280-5370` | `tests/backend-epaper-step10-12.test.js` (12.1.1–12.1.5) | **VERIFIED** |
| **F21** | 300 DPI Prepress Export (PDF/PNG) | `src/server/epaper/exportEngine.js:50-435` | `tests/backend-epaper-step10-12.test.js` (12.2.1–12.2.6) | **VERIFIED** |

---

## 2. Traceability: Post-Remediation Security Findings (STEP 15/16)

| Finding Reference | Defect Description | Exact Code File & Lines | Direct Remediation Verified | Final Step 17 Status |
| :--- | :--- | :--- | :--- | :---: |
| **FINDING-15-01** / **FINDING-17-02** | Creation-time bypass in `POST /editions` allowed client `status: PUBLISHED` | `src/server/apiEngine.js:1310-1317`<br>`src/server/persistence/adapter.js:4670`<br>`src/server/persistence/firestoreAdapter.js:2821` | Rejection of PUBLISHED on creation (HTTP 400); unconditional initialization to DRAFT in both adapters. | **VERIFIED FIXED** |
| **FINDING-15-02** / **FINDING-17-01** | TOCTOU race condition in WhatsApp card quota check & save | `src/server/persistence/adapter.js:5043-5077`<br>`src/server/persistence/firestoreAdapter.js:2776-2900`<br>`src/server/apiEngine.js:1645-1655` | Implemented `_acquireReporterLock` & `atomicSaveEpaperWhatsAppGeneration`. Single-process 10-request concurrency safe. Multi-instance distributed concurrency requires `db.runTransaction()`. | **VERIFIED FIXED (Local)**<br>**OPEN / BLOCKED (Distributed)** |
| **FINDING-15-03** / **FINDING-17-03** | Missing Master Admin UI for reporter WhatsApp daily quota management | `src/screens/AdminControlScreen.tsx:200-265, 1435-1540`<br>`src/services/apiClient.ts:2558-2575` | Added table column, inline editing, save/cancel actions, feedback toasts, refresh button, and typed API methods. | **VERIFIED FIXED** |
| **FINDING-15-04** / **FINDING-17-04** | Status equality check failed to trim whitespace or normalize case | `src/server/apiEngine.js:1073-1100`<br>`src/server/apiEngine.js:1355-1368` | Added `trim().toUpperCase()` and validation against canonical `VALID_EPAPER_STATUSES` on all status mutation endpoints. | **VERIFIED FIXED** |
