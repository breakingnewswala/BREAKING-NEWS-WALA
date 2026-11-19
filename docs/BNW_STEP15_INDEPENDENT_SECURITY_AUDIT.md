# BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
# STEP 15 — INDEPENDENT POST-REMEDIATION SECURITY AUDIT REPORT

**Project:** BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)  
**Document ID:** `BNW-DOC-EPAPER-STEP15-SECURITY-AUDIT-2026-V1.0`  
**Classification:** Independent Cybersecurity & Architectural Audit  
**Target:** Post-STEP 14 Remediation Verification & Threat Modeling  
**Branch / HEAD:** `main` / `e40e835bedaf2f523002ad1f9ed92c5b69886974`  
**Audit Date:** 2026-11-18  
**Audit Team:** Autonomous Senior Engineering & Security Audit Taskforce  
**Overall Audit Verdict:** ⚠️ **NOT READY FOR STAGING (2 OPEN P1 FINDINGS IDENTIFIED)**

---

## 1. Executive Summary

Acting as an independent cybersecurity and architecture audit authority, this taskforce conducted a rigorous, evidence-driven verification of the BREAKING NEWS WALA E-Paper Management System following the **STEP 14 Targeted Remediations**.

While STEP 14 successfully resolved the specific status-update route bypasses, harmonized the public API pagination assertion (allowing 271 automated tests to pass), and purged misleading PDF/X-1a claims, this independent deep-dive audit uncovered **two open P1 security findings** and **one P2 usability defect** that must be remediated before production staging:

1. **FINDING-15-01 (Severity: P1 — Security / Auth Bypass)**: `POST /api/v1/epaper/editions` allows client-supplied `{ status: 'PUBLISHED' }`, enabling an editor to introduce published editions directly onto the public reader portal without preflight validation or immutable snapshotting.
2. **FINDING-15-02 (Severity: P1 — Concurrency / Rate Limiting Bypass)**: Time-of-Check to Time-of-Use (TOCTOU) race condition in `POST /api/v1/epaper/whatsapp/generate` allows parallel burst requests to bypass the daily quota.
3. **FINDING-15-03 (Severity: P2 — Functional Defect / Missing UI)**: No graphical user interface exists in `AdminControlScreen.tsx` for Master Admins to view or configure reporter WhatsApp quotas.

Because critical P1 security findings remain open, the platform **cannot be certified as ready for staging** at this stage.

---

## 2. Threat Model: 14 Attack Scenarios Evaluated

| # | Attack Scenario | Relevant Code Path | Test Performed | Empirical Evidence | Audit Assessment |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 1 | **Reporter attempts to publish edition** | `apiEngine.js:1126-1132` | HTTP POST `/publish` with reporter token | HTTP 403 `ERR_FORBIDDEN` returned | **DEFENDED (PASS)** |
| 2 | **Editor attempts to bypass preflight checks** | `apiEngine.js:1145-1154` | HTTP POST `/publish` on edition with unplaced lead story | HTTP 422 `ERR_PREFLIGHT_BLOCKER` returned | **DEFENDED (PASS)** |
| 3 | **Direct API request changes status to PUBLISHED** | `apiEngine.js:1093` & `apiEngine.js:1342` | PATCH `/status` and PUT `/editions/:id` with `{ status: 'PUBLISHED' }` | Both return HTTP 400 `ERR_INVALID_OPERATION` | **DEFENDED (PASS)** |
| 4 | **Direct API creates brand new edition as PUBLISHED** | `apiEngine.js:1305` & `adapter.js:4670` | POST `/editions` with `{ status: 'PUBLISHED' }` | **New edition created directly as PUBLISHED!** | ❌ **VULNERABLE (P1)** |
| 5 | **Reporter changes their own daily quota** | `apiEngine.js:1673-1678` | PUT `/whatsapp/quota/:reporterId` with reporter token | HTTP 403 `ERR_FORBIDDEN` returned | **DEFENDED (PASS)** |
| 6 | **Reporter changes another reporter's quota** | `apiEngine.js:1673-1678` | PUT `/whatsapp/quota/:targetId` with reporter token | HTTP 403 `ERR_FORBIDDEN` returned | **DEFENDED (PASS)** |
| 7 | **Reporter reads another reporter's quota usage** | `apiEngine.js:1694-1704` | GET `/whatsapp/quota/:targetId` with reporter token | HTTP 403 `ERR_FORBIDDEN` returned | **DEFENDED (PASS)** |
| 8 | **Burst concurrent requests exceed WhatsApp quota** | `apiEngine.js:1633-1647` | Concurrency AST review of read vs write | TOCTOU gap allows parallel requests to slip through | ❌ **VULNERABLE (P1)** |
| 9 | **UTC/IST boundary causes quota reset error** | `adapter.js:5060` | Deterministic timestamps tested across 00:00:00 IST | Date changes accurately at midnight `Asia/Kolkata` | **DEFENDED (PASS)** |
| 10 | **Concurrent publish requests create conflicting snapshots**| `apiEngine.js:1139` & `adapter.js:5290` | Parallel publish requests with stale OCC version | Second request rejected with HTTP 409 Conflict | **DEFENDED (PASS)** |
| 11 | **Public reader accesses unpublished draft edition** | `apiEngine.js:1314` & `adapter.js:4540` | Unauthenticated GET `/editions` and `/editions/:id` | Filter forced to `PUBLISHED`; single returns 403 | **DEFENDED (PASS)** |
| 12 | **Public API leaks internal draft or review metadata** | `apiEngine.js:1275` | Query params attempting to override status (`?status=DRAFT`) | `isEditor` check forces `status = 'PUBLISHED'` | **DEFENDED (PASS)** |
| 13 | **Direct internal adapter bypasses API authorization** | `adapter.js:4745` | AST inspection of persistence methods | Internal adapter methods accept `targetStatus: 'PUBLISHED'` | ⚠️ **INTERNAL RISK (P3)** |
| 14 | **Malicious pagination parameters cause DoS / memory spike** | `apiEngine.js:1280-1281`| GET `/editions?page=-5&limit=999999` | Clamped to `page=1, limit=100` safely | **DEFENDED (PASS)** |

---

## 3. Detailed Security Findings Summary

### 3.1 FINDING-15-01: Creation-Time Publishing Security Bypass (P1)
- **Vulnerability**: `src/server/apiEngine.js:1305` calls `adapter.createEpaperEditionWithPages(body, user)`. In `adapter.js:4670` and `firestoreAdapter.js:2920`, the code uses `status: editionData.status || 'DRAFT'`.
- **Proof of Concept**:
  Sending an HTTP POST to `/api/v1/epaper/editions` with:
  ```json
  {
    "title": "Unvetted Edition",
    "publicationDate": "2026-11-20",
    "status": "PUBLISHED"
  }
  ```
  bypasses the entire editorial preflight scanner, OCC checks, and version snapshot pipeline.
- **Required Fix**: In `adapter.createEpaperEditionWithPages`, explicitly enforce `status: 'DRAFT'` regardless of input. In `apiEngine.js`, reject or strip any `status` property in `POST /editions`.

### 3.2 FINDING-15-02: TOCTOU Concurrency Race Condition in WhatsApp Quota (P1)
- **Vulnerability**: In `src/server/apiEngine.js:1633-1647`, the quota check (`await adapter.getReporterWhatsAppQuota`) is separated from the generation write (`await adapter.saveEpaperWhatsAppGeneration`).
- **Proof of Concept**: Parallel requests sent simultaneously when `remaining == 1` will both evaluate `quotaExceeded == false` before the generation count is incremented.
- **Required Fix**: Implement atomic quota reservation inside a Firestore transaction or memory mutex.

### 3.3 FINDING-15-03: Missing Admin UI for WhatsApp Quota Configuration (P2)
- **Defect**: Neither `src/screens/AdminControlScreen.tsx` nor `src/services/apiClient.ts` provides a method or UI component for Master Admins to view or edit reporter daily card quotas.
- **Required Fix**: Expose `updateReporterWhatsAppQuota` in `apiClient.ts` and render a quota configuration control in `AdminControlScreen.tsx`.

---

## 4. Test Execution & Build Verification

- **Automated Tests Executed**: 271
- **Passing**: 271 (100%)
- **Failing**: 0
- **Build Execution**: `npm run build` (`tsc && vite build`) succeeded in 20.02s with exit code 0.
- Detailed logs are recorded in [docs/BNW_STEP15_TEST_EXECUTION_REPORT.md](file:///d:/BREAKING-NEWS-WALA-main/docs/BNW_STEP15_TEST_EXECUTION_REPORT.md).

---

## 5. Non-Destructive Invariant Compliance

The audit taskforce strictly adhered to all non-destructive rules:
- **Zero code edits** were made to application source files or test scripts.
- **Zero commits or git pushes** were executed.
- **Zero production deployments** were triggered.
- **Zero live WhatsApp messages** were sent.
- **Zero real E-Paper editions** were published.
- The working tree remains in its exact post-STEP 14 state with new audit documentation added under `docs/`.

---

## 6. Final Audit Verdict

$$\mathbf{VERDICT: \text{NOT READY FOR STAGING}}$$

**Justification**:
While the codebase demonstrates high engineering rigor with 271 passing tests and solid route guards on existing update routes, the platform cannot be certified as ready for staging review while **FINDING-15-01** (Creation-Time Publishing Bypass) and **FINDING-15-02** (Quota Race Condition) remain open in the core backend engine.

**Recommended Next Step**:
Proceed to **STEP 16** for targeted remediation of `FINDING-15-01`, `FINDING-15-02`, and `FINDING-15-03`.
