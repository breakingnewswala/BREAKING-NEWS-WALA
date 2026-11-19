# BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
# STEP 15 — WHATSAPP QUOTA SECURITY & CORRECTNESS AUDIT

**Project:** BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)  
**Document ID:** `BNW-DOC-EPAPER-STEP15-WHATSAPP-QUOTA-AUDIT-2026-V1.0`  
**Classification:** Post-Remediation Security & Architecture Audit  
**Target:** WhatsApp Card Generation Quota System, IST Rollover & Admin Endpoints  
**Audit Date:** 2026-11-18  
**Audit Status:** **PARTIALLY VERIFIED (NEW P1 RACE CONDITION & P2 MISSING UI DISCOVERED)**

---

## 1. Executive Summary

STEP 14 implemented per-reporter configurable WhatsApp clipping card generation quotas and aligned date rollover with India Standard Time (`Asia/Kolkata`). This independent audit inspected the end-to-end quota lifecycle across data models, persistence adapters, API endpoints, authorization rules, and frontend administrative interfaces.

### Core Audit Findings:
1. **Configurability & Persistence**: **VERIFIED**. Quotas are persistent across restarts in `PersistenceAdapter` (`.data/bnw_persistence.json`) and `FirestoreAdapter` (`epaperReporterQuotas` collection and `users.customWhatsAppQuota`).
2. **Server-Side Authorization & IDOR**: **VERIFIED**. Only Master Admin / Chief Editor roles can configure quotas. Normal reporters cannot modify quotas or view other reporters' quotas.
3. **IST Timezone Rollover**: **VERIFIED**. Evaluated using deterministic timestamps; accurately rolls over at 00:00:00 IST across day, month, and leap-year boundaries.
4. **Concurrency & Race Conditions**: ⚠️ **P1 VULNERABILITY (OPEN)**. Read-then-write (TOCTOU) pattern in `POST /api/v1/epaper/whatsapp/generate` allows burst concurrent requests to exceed the configured daily limit.
5. **Administrative UI**: ⚠️ **P2 DEFECT (MISSING UI)**. No user interface exists in `AdminControlScreen.tsx` or `ReporterDeskScreen.tsx` to view or edit reporter WhatsApp quotas.

---

## 2. Quota Verification Matrix

| Requirement | LocalJson | Firestore | API (`apiEngine.js`) | UI (`AdminControlScreen.tsx`) | Result |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Configurable Quota per Reporter** | **VERIFIED** | **VERIFIED** | **VERIFIED** | ❌ **MISSING (P2)** | **PARTIALLY VERIFIED** |
| **Persistent Storage across Restarts** | **VERIFIED** | **VERIFIED** | **VERIFIED** | N/A | **VERIFIED** |
| **Role-Based Authorization (Admin Only)** | **VERIFIED** | **VERIFIED** | **VERIFIED** | N/A | **VERIFIED** |
| **IDOR Protection (Cross-Reporter Isolation)** | **VERIFIED** | **VERIFIED** | **VERIFIED** | N/A | **VERIFIED** |
| **IST Midnight Reset (`Asia/Kolkata`)** | **VERIFIED** | **VERIFIED** | **VERIFIED** | N/A | **VERIFIED** |
| **Concurrency Safety / Atomic Quota Consumption** | ❌ **FAILED (P1)** | ❌ **FAILED (P1)** | ❌ **FAILED (P1)** | N/A | ❌ **UNSAFE (P1)** |
| **Zero-Quota Blocking Support** | **VERIFIED** | **VERIFIED** | **VERIFIED** | N/A | **VERIFIED** |
| **Reporter Visibility into Own Quota** | **VERIFIED** | **VERIFIED** | **VERIFIED** | **VERIFIED** | **VERIFIED** |

---

## 3. Detailed Architectural & Security Inspection

### 3.1 Quota Storage & Adapter Parity
- **LocalJson / Memory Storage**:
  - Code reference: `src/server/persistence/adapter.js:5080-5130`
  - Quotas are indexed by `reporterId` in `this.data.reporterWhatsAppQuotas[reporterId]`.
  - When updated, it also synchronizes to `user.customWhatsAppQuota` in `this.data.users` and calls `this.save()`.
  - Default fallback is `20` when no custom quota is set.
- **Cloud Firestore Storage**:
  - Code reference: `src/server/persistence/firestoreAdapter.js:3320-3375`
  - Stored in `epaperReporterQuotas` collection as documents `{ reporterId, maxDaily, timezone: 'Asia/Kolkata', updatedAt }`.
  - Synchronizes to the corresponding document in `users` collection.
  - Parity check: Both adapters execute identical lookup hierarchies:
    $$\text{Custom Quota Map} \longrightarrow \text{User Record Attribute} \longrightarrow \text{Default } (20)$$

### 3.2 Authorization & IDOR Assessment
- **Quota Modification (`PUT /api/v1/epaper/whatsapp/quota/:reporterId`)**:
  - In `apiEngine.js:1673-1692`:
    ```javascript
    if (!user) return sendError(res, 401, 'ERR_UNAUTHORIZED', 'प्रमाणीकरण आवश्यक है।');
    if (!isChiefEditorOrMasterAdmin(user)) {
      return sendError(res, 403, 'ERR_FORBIDDEN', 'संवाददाता व्हाट्सएप कोटा संशोधित करने हेतु मास्टर एडमिन अधिकार अनिवार्य हैं।');
    }
    ```
  - Test evidence: `tests/backend-epaper-step14-remediation.test.js` Test `P2.2` confirmed that authenticated reporters are blocked with HTTP 403 `ERR_FORBIDDEN`.
- **Cross-Reporter Quota Inspection (`GET /api/v1/epaper/whatsapp/quota/:reporterId`)**:
  - In `apiEngine.js:1694-1704`:
    ```javascript
    if (reporterId !== user.id && !isChiefEditorOrMasterAdmin(user)) {
      return sendError(res, 403, 'ERR_FORBIDDEN', 'अन्य संवाददाता का कोटा देखने हेतु एडमिन अधिकार अनिवार्य हैं।');
    }
    ```
  - Prevents IDOR by validating that ordinary reporters can only query their own `reporterId`.

### 3.3 India Standard Time (IST) Date Boundary Verification
- Implementation: `_getIndiaDateString` utilizes `Intl.DateTimeFormat` with `timeZone: 'Asia/Kolkata'`.
- Deterministic boundary test results:
  - `2026-11-18T18:29:59.000Z` (23:59:59 IST) $\longrightarrow$ `2026-11-18` (**VERIFIED**)
  - `2026-11-18T18:30:00.000Z` (00:00:00 IST on Nov 19) $\longrightarrow$ `2026-11-19` (**VERIFIED**)
  - `2026-11-18T18:30:01.000Z` (00:00:01 IST on Nov 19) $\longrightarrow$ `2026-11-19` (**VERIFIED**)
  - Month boundary `2026-11-30T18:30:00.000Z` $\longrightarrow$ `2026-12-01` (**VERIFIED**)
  - Year boundary `2026-12-31T18:30:00.000Z` $\longrightarrow$ `2027-01-01` (**VERIFIED**)
  - Leap-year boundary `2028-02-28T18:30:00.000Z` $\longrightarrow$ `2028-02-29` (**VERIFIED**)

---

## 4. Critical Vulnerabilities & Deficiencies Discovered

### 4.1 P1 Finding: Time-of-Check to Time-of-Use (TOCTOU) Race Condition
- **Location**: `src/server/apiEngine.js:1633-1647`
- **Vulnerability Flow**:
  1. Line 1633: `const quotaInfo = await adapter.getReporterWhatsAppQuota(user.id);`
  2. Line 1634: `if (quotaInfo.quotaExceeded) return sendError(res, 429, ...);`
  3. Lines 1638-1647: `const generated = await adapter.saveEpaperWhatsAppGeneration({...}, user);`
- **Impact**:
  Between step 1 and step 3, execution is asynchronous. If an automated script or malicious reporter triggers multiple concurrent requests (e.g. 10 parallel HTTP POST calls) when their remaining quota is 1:
  - All 10 requests evaluate `quotaInfo.quotaExceeded == false` simultaneously.
  - All 10 requests proceed to invoke `saveEpaperWhatsAppGeneration`.
  - The reporter generates 10 cards, exceeding their daily limit by 900%.
- **Recommendation**:
  Implement atomic quota reservation:
  In Firestore: Execute inside `runTransaction` with an atomic decrement or generation counter document.
  In LocalJson/Memory: Use an in-process mutex or synchronous atomic check-and-push.

---

### 4.2 P2 Finding: Complete Absence of Quota Configuration UI
- **Location**: `src/screens/AdminControlScreen.tsx` and `src/services/apiClient.ts`
- **Inspection Findings**:
  - `apiClient.ts:2548` defines `getWhatsAppQuota(date?: string)` for the reporter's own quota, but **lacks any method** to call `PUT /api/v1/epaper/whatsapp/quota/:reporterId`.
  - `AdminControlScreen.tsx` contains tabs for users, reporters, monetization, and system telemetry, but **contains zero UI elements, form inputs, or modal dialogs** allowing a Master Admin to view or adjust a reporter's daily WhatsApp card quota.
- **Impact**:
  While the backend API and database persistence function as intended, Master Admins cannot configure quotas through the web application without using raw cURL or external HTTP client tools.
- **Recommendation**:
  1. Add `updateReporterWhatsAppQuota(reporterId: string, maxDaily: number)` to `src/services/apiClient.ts`.
  2. Add a "व्हाट्सएप कार्ड कोटा (दैनिक)" input column in `AdminControlScreen.tsx` under the Reporter Management tab.

---

## 5. Audit Conclusion & Verdict

- **Quota Storage & Persistence**: **VERIFIED**
- **Authorization & IDOR Protection**: **VERIFIED**
- **IST Timezone Rollover**: **VERIFIED**
- **Concurrency & Atomic Consumption**: ❌ **OPEN P1 VULNERABILITY (TOCTOU Race Condition)**
- **Master Admin UI Availability**: ❌ **OPEN P2 DEFECT (Missing UI in Admin Control Screen)**

**Overall WhatsApp Quota Audit Verdict**: **PARTIALLY VERIFIED — REQUIRES TRANSACTIONAL LOCKING & ADMIN UI IMPLEMENTATION**.
