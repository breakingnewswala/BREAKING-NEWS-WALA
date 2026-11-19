# BNW_STEP13_BUG_REGISTER.md — Independent Audit Bug Register
## Document ID: DOC-EPAPER-BUGS-STEP13-2026-V1.0
### Scope: Prioritized Audit Defects, Severity Ratings, Reproduction Steps & Recommended Remediation

---

## 1. Bug Severity Definitions

- **P0 — CRITICAL**: Security compromise, data loss, authentication bypass, cross-reporter leakage.
- **P1 — HIGH**: Core workflow broken, preflight bypass, incorrect edition page counts, publishing failure.
- **P2 — MEDIUM**: Missing required configurable options, API contract mismatch, export formatting gap.
- **P3 — LOW**: Visual inconsistencies, minor logging issues, legacy test assertion differences.

---

## 2. Independent Audit Bug Register

### [BUG-EPAPER-13-01] Preflight Blocker Bypass via Status Route
- **Severity**: **P1 — HIGH**
- **Affected Module**: `src/server/apiEngine.js` line 1070
- **Description**: While `POST /api/v1/epaper/editions/:id/publish` strictly runs the 5 preflight checks and rejects blockers with HTTP 422, a Chief Editor or Master Admin calling `PUT /api/v1/epaper/editions/:id/status` with `{ "status": "PUBLISHED" }` can update the edition status directly without running `QualityPreflightScanner.evaluate()` and without freezing an immutable version snapshot in `epaperEditionVersions`.
- **Reproduction Steps**:
  1. Create a draft edition containing an element with severe `TEXT_OVERFLOW` or unapproved ad.
  2. Call `PUT /api/v1/epaper/editions/:id/status` with `{ "status": "PUBLISHED" }` using a Master Admin token.
  3. Status transitions to `PUBLISHED` despite the presence of preflight blockers.
- **Impact**: Bypasses editorial quality gates and fails to create historical version snapshots.
- **Recommended Remediation**:
  In `src/server/apiEngine.js:1070`, if `targetStatus === 'PUBLISHED'`, reject direct status updates with HTTP 400:
  `"कृपया संस्करण प्रकाशित करने हेतु समर्पित /publish एंडपॉइंट का उपयोग करें।"`.

---

### [BUG-EPAPER-13-02] Hardcoded Daily WhatsApp Quota & UTC Reset Boundary
- **Severity**: **P2 — MEDIUM**
- **Affected Module**: `src/server/persistence/adapter.js` line 5066
- **Description**: The daily WhatsApp card generation quota is permanently hardcoded to `const maxDaily = 20`. The original requirement mandates that Master Admin must be able to configure quotas per reporter. Furthermore, date filtering uses `new Date().toISOString().split('T')[0]` which evaluates in UTC (+00:00), resetting quotas at 05:30 AM IST rather than midnight IST.
- **Reproduction Steps**:
  1. Inspect `src/server/persistence/adapter.js:5066`.
  2. Notice `const maxDaily = 20;` with no lookup from reporter profile or settings.
  3. Notice `const today = date || new Date().toISOString().split('T')[0];` resets on UTC date boundary.
- **Impact**: Master Admin cannot grant higher quotas (e.g. 50/day) to senior district correspondents; quotas reset mid-morning for Indian journalists.
- **Recommended Remediation**:
  1. Update `getReporterWhatsAppQuota` to check `user?.customWhatsAppQuota || 20`.
  2. Compute `today` using `new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })`.
  3. Add `PUT /api/v1/epaper/whatsapp/quota/:reporterId` endpoint.

---

### [BUG-EPAPER-13-03] PDF/X-1a & TrueType Font Embedding Discrepancy
- **Severity**: **P2 — MEDIUM**
- **Affected Module**: `src/server/epaper/exportEngine.js` lines 315–335
- **Description**: The export engine claims PDF/X-1a:2001 compliance and embedded Devanagari TrueType fonts. However, binary inspection reveals that the PDF declares PostScript Type 1 Helvetica without embedded TrueType font programs. It also uses DeviceRGB color operators (`rg`, `RG`) and lacks an `/OutputIntents` dictionary with standard ICC profiles.
- **Reproduction Steps**:
  1. Generate PDF via `HighResExportEngine.buildPrintReadyPdf()`.
  2. Search binary for `/BaseFont`: only `/Helvetica` and `/Helvetica-Bold` are declared.
  3. Search binary for `/OutputIntents`: returns false.
  4. Search binary for `k` (CMYK operator): 0 occurrences; DeviceRGB `rg` operators used.
- **Impact**: While the file is a valid PDF-1.4 vector/raster document, commercial prepress RIP workflows requiring strict PDF/X-1a compliance will fail preflight validation.
- **Recommended Remediation**:
  Clarify documentation that native Node.js PDF generation delivers **commercial PDF-1.4 proofs and 300 DPI PNGs**, and integrate font embedding / CMYK ICC profiles in Phase 2 prepress refinement.

---

### [BUG-EPAPER-13-04] Legacy Test Assertion Envelope Inconsistency
- **Severity**: **P3 — LOW**
- **Affected Module**: `tests/backend-master-admin-auth.test.js` line 163
- **Description**: Legacy test #5 expects `epaperRes.data.data` to be an Array. The new E-Paper endpoint `GET /api/v1/epaper/editions` returns a paginated object `{ editions: [...], items: [...], total, count }`.
- **Reproduction Steps**:
  1. Run `cmd /c "node --test tests/backend-master-admin-auth.test.js"`.
  2. Test #5 fails: `AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value: assert.ok(Array.isArray(epaperRes.data.data))`.
- **Impact**: Causes existing test file to exit with code 1 despite E-Paper service functioning correctly.
- **Recommended Remediation**:
  Update assertion in `tests/backend-master-admin-auth.test.js:163` to:
  `assert.ok(Array.isArray(epaperRes.data.data.editions || epaperRes.data.data));`.
