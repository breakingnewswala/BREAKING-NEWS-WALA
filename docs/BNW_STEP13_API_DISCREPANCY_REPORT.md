# BNW_STEP13_API_DISCREPANCY_REPORT.md — API Contract Discrepancy Report
## Document ID: DOC-EPAPER-APIDISC-STEP13-2026-V1.0
### Scope: Endpoint-by-Endpoint Discrepancy Analysis, Payload Contracts & Auth Enforcement

---

## 1. Executive Summary

This report compares documented API endpoints in `docs/EPAPER_API_CONTRACTS.md` and `docs/13-API.md` against actual route registrations in `src/server/apiEngine.js` and frontend callers in `src/services/apiClient.ts`.

---

## 2. Route-by-Route Verification Table

| Route Path | Method | Documented Status | Actual Route Status | Auth Enforced | Role Gate | Frontend Caller | Test File | Discrepancy Notes |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `/api/v1/epaper/editions` | GET | `200 OK` (Array) | `200 OK` (Object) | Optional | Public/Editor | `getEditions` | `backend-epaper-management.test.js` | **DISCREPANCY**: Returns `{ editions: [...], total, ... }` rather than plain array `[]`. Breaks legacy test `backend-master-admin-auth.test.js:163`. |
| `/api/v1/epaper/editions` | POST | `201 Created` | `201 Created` | Yes | `isEpaperEditor` | `createEdition` | `backend-epaper-management.test.js` | None. 12 pages enforced for `DAILY`. |
| `/api/v1/epaper/editions/:id` | GET | `200 OK` | `200 OK` | Optional | Public/Editor | `getEditionById` | `backend-epaper-management.test.js` | Draft editions correctly hidden from public unauthenticated callers. |
| `/api/v1/epaper/editions/:id` | PUT | `200 OK` / `409` | `200 OK` / `409` | Yes | `isEpaperEditor` | `updateEdition` | `backend-epaper-management.test.js` | OCC version enforcement active. |
| `/api/v1/epaper/editions/:id` | DELETE | `200 OK` | `200 OK` | Yes | `isEpaperEditor` | `deleteEdition` | `backend-epaper-management.test.js` | Deletion of published edition prevented. |
| `/api/v1/epaper/editions/:id/status` | PUT | `200 OK` / `409` | `200 OK` / `409` | Yes | `isChiefEditorOrMasterAdmin` | `updateEditionStatus` | `backend-epaper-management.test.js` | **SECURITY GAP**: Setting `targetStatus='PUBLISHED'` via this route bypasses `preflightScanner` and omits snapshot in `epaperEditionVersions`. |
| `/api/v1/epaper/editions/:id/preflight` | GET, POST | `200 OK` | `200 OK` | Optional | Public/Editor | `getPreflightReport` | `backend-epaper-step10-12.test.js` | Evaluates 5 diagnostic checks. |
| `/api/v1/epaper/editions/:id/publish` | POST | `200 OK` / `422` | `200 OK` / `422` | Yes | `isEpaperEditor` | `publishEdition` | `backend-epaper-step10-12.test.js` | Enforces blocker gates and creates immutable version snapshot. |
| `/api/v1/epaper/editions/:id/versions` | GET | `200 OK` | `200 OK` | Yes | `isEpaperEditor` | `getEditionVersions` | `backend-epaper-step10-12.test.js` | Returns array of immutable snapshot records. |
| `/api/v1/epaper/editions/:id/check-article/:articleId` | GET | `200 OK` | `200 OK` | Yes | `isEpaperEditor` | `checkArticlePlacement` | `backend-epaper-management.test.js` | Scans all pages in edition for duplicate placement. |
| `/api/v1/epaper/pages/:pageId` | GET | `200 OK` | `200 OK` | Optional | Public/Editor | `getPageById` | `backend-epaper-management.test.js` | Returns page layout and elements array. |
| `/api/v1/epaper/pages/:pageId` | PUT | `200 OK` / `409` | `200 OK` / `409` | Yes | `isEpaperEditor` | `updatePage` | `backend-epaper-management.test.js` | OCC version increment verified. |
| `/api/v1/epaper/templates` | GET | `200 OK` | `200 OK` | Optional | Public/Editor | `getTemplates` | `backend-epaper-management.test.js` | Returns 12 canonical presets + custom templates. |
| `/api/v1/epaper/templates` | POST | `201 Created` | `201 Created` | Yes | `isEpaperEditor` | `saveTemplate` | `backend-epaper-management.test.js` | Saves custom designer layout as template. |
| `/api/v1/epaper/templates/analyze` | POST | `200 OK` | `200 OK` | Yes | `isEpaperEditor` | `analyzeTemplate` | `backend-epaper-management.test.js` | AI structural analysis with heuristic fallback. |
| `/api/v1/epaper/ads/submissions` | GET | `200 OK` | `200 OK` | Yes | `isEpaperEditor` | `getAdSubmissions` | `backend-epaper-management.test.js` | Returns ad bookings queue. |
| `/api/v1/epaper/ads/calculate-rate` | POST | `200 OK` | `200 OK` | Yes | Authenticated | `calculateAdRate` | `backend-epaper-management.test.js` | Multi-tier rate card formula calculation. |
| `/api/v1/epaper/ads/submit-classified` | POST | `201 Created` | `201 Created` | Yes | `isReporter` | `submitClassifiedAd` | `backend-epaper-management.test.js` | Reporter local ad booking intake. |
| `/api/v1/epaper/whatsapp/generate` | POST | `200 OK` / `429` | `200 OK` / `429` | Yes | Authenticated | `generateWhatsAppCard` | `backend-ai-epaper-step9.test.js` | Rejects non-1:1/4:5 formats with HTTP 400. Rate limits at 20 cards/day with HTTP 429. |
| `/api/v1/epaper/whatsapp/quota` | GET | `200 OK` | `200 OK` | Yes | Authenticated | `getWhatsAppQuota` | `backend-ai-epaper-step9.test.js` | Returns `{ used, maxDaily: 20, remaining, quotaExceeded }`. |
| `/api/v1/epaper/whatsapp/quota/:reporterId` | PUT | Documented (R-08.3) | **MISSING (404)** | N/A | Master Admin | None | None | **REQUIREMENT GAP**: Missing endpoint to configure custom per-reporter quota. |
| `/api/v1/epaper/ai/auto-layout` | POST | `200 OK` | `200 OK` | Yes | `isEpaperEditor` | `autoLayout` | `backend-ai-epaper-step9.test.js` | 2D skyline bin-packing. |
| `/api/v1/epaper/ai/classify-category` | POST | `200 OK` | `200 OK` | Yes | `isEpaperEditor` | `classifyCategory` | `backend-ai-epaper-step9.test.js` | Maps stories to 12 broadsheet sections. |
| `/api/v1/epaper/ai/permanent-columns` | POST | `200 OK` | `200 OK` | Yes | `isEpaperEditor` | `generatePermanentColumn` | `backend-ai-epaper-step9.test.js` | Generates 5 daily permanent features with attribution. |
| `/api/v1/epaper/archive` | GET | `200 OK` | `200 OK` | None | Public | `searchArchive` | `backend-epaper-step10-12.test.js` | Date/district filter for published editions. |
| `/api/v1/epaper/editions/:id/export/pdf` | GET, POST | `200 OK` (binary) | `200 OK` (binary) | Conditional | Public/Editor | `exportPdf` | `backend-epaper-step10-12.test.js` | Returns PDF-1.4 binary stream with MediaBox. |
| `/api/v1/epaper/editions/:id/export/page/:pageNumber/image` | GET, POST | `200 OK` (binary) | `200 OK` (binary) | Conditional | Public/Editor | `exportPageImage` | `backend-epaper-step10-12.test.js` | Returns 300 DPI PNG buffer ($3886 \times 6142\text{ px}$). |
| `/api/v1/epaper/editions/:id/export/metadata` | GET | `200 OK` | `200 OK` | Conditional | Public/Editor | `getExportMetadata` | `backend-epaper-step10-12.test.js` | Prepress RIP metadata specification JSON. |

---

## 3. Discrepancy Summary & Remediation

1. **Quota Update Endpoint Missing**:
   - `PUT /api/v1/epaper/whatsapp/quota/:reporterId` does not exist in `apiEngine.js`.
   - **Remediation**: Add route requiring Master Admin role to set `customQuota` per reporter profile in `adapter.js`.

2. **Publishing Status Bypass in PUT `/api/v1/epaper/editions/:id/status`**:
   - Setting status to `PUBLISHED` via this route skips preflight evaluation and version snapshotting.
   - **Remediation**: In `apiEngine.js:1070`, if `targetStatus === 'PUBLISHED'`, either forward to `publishEpaperEdition` logic or reject direct `PUBLISHED` status updates in favor of the atomic `/publish` route.

3. **Legacy Test Envelope Expectation**:
   - `tests/backend-master-admin-auth.test.js:163` expected `epaperRes.data.data` to be an array, but `getEpaperEditions` returns paginated object `{ editions: [...], items: [...], total }`.
   - **Remediation**: Update test assertion to check `Array.isArray(epaperRes.data.data.editions || epaperRes.data.data)`.
