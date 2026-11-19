# BNW_STEP13_SECURITY_FINDINGS.md — Independent Security & Access Control Findings
## Document ID: DOC-EPAPER-SEC-STEP13-2026-V1.0
### Scope: Independent Security Audit, RBAC Verification, Private Storage & Vulnerability Analysis

---

## 1. Executive Summary

The independent security evaluation examined authentication integrity, role authorization, territorial access boundaries, private storage isolation, and rate-limiting across all 11 implemented E-Paper modules.

---

## 2. Security Assessment Matrix

| Security Domain | Target Invariant | Audit Methodology | Empirical Finding | Verdict |
| :--- | :--- | :--- | :--- | :---: |
| **Server-Side Authorization** | Mutations require valid JWT token and appropriate role | Direct API requests without token (`Authorization: Bearer`) | Unauthenticated write requests to `/editions`, `/pages`, `/publish`, `/whatsapp/generate` are strictly rejected with HTTP 401 `ERR_UNAUTHORIZED`. | **PASS** |
| **RBAC Role Gating** | Ordinary readers cannot mutate broadsheet layouts or publish | Simulated requests with valid Reader token | Reader accounts receive HTTP 403 `ERR_FORBIDDEN` when attempting to access `/editions` POST, `/pages/:id` PUT, or `/publish`. | **PASS** |
| **Unpublished Draft Isolation** | Draft editions hidden from public unauthenticated callers | Direct GET request to `/editions` and `/editions/:draftId` | Public requests filter `status: 'PUBLISHED'` by default; requesting a draft edition without editor token returns HTTP 403 or hides draft records. | **PASS** |
| **Source Article Immutability** | Broadsheet placement must never alter original article data | Sourced article SHA-256 hash before and after placement | Original news article record in `newsArticles` remains strictly read-only. Placed element stores isolated broadsheet overrides without mutating source record. | **PASS** |
| **Private WhatsApp Storage** | Generated WhatsApp cards isolated to private reporter buckets | Inspection of `saveEpaperWhatsAppGeneration` & storage paths | Output storage paths explicitly generated as `whatsapp/${reporterId}/${timestamp}.png` with `isPrivate: true`. No public URLs returned. | **PASS** |
| **ASCI Regulatory Stamping** | Commercial ads must carry 'विज्ञापन' badge before publication | Automated preflight check `UNAPPROVED_AD_PLACEMENT` | Preflight scanner blocks any commercial ad slot lacking the ASCI badge or approval status with a `BLOCKER` diagnostic. | **PASS** |
| **Publishing Preflight Bypass** | Status update cannot circumvent preflight diagnostic blockers | Direct `PUT /api/v1/epaper/editions/:id/status` with `targetStatus='PUBLISHED'` | **VULNERABILITY IDENTIFIED**: Setting status via `/status` endpoint bypasses preflight checks and does not create an immutable version snapshot in `epaperEditionVersions`. | **FAIL (P1-01)** |
| **Daily Quota Enforcement** | Daily card generation capped to prevent server resource exhaustion | 21 consecutive generation requests by single reporter | After 20 requests, HTTP 429 `ERR_QUOTA_EXHAUSTED` returned. **LIMITATION**: Quota resets on UTC date boundary (05:30 AM IST) rather than midnight IST. | **PARTIALLY PASS** |
| **Cross-Reporter Isolation** | Reporter A cannot view or manage Reporter B's private cards | API requests across separate reporter IDs | WhatsApp history queries filter strictly by `user.id`. Reporter A cannot access Reporter B's history. | **PASS** |
| **Zero PostgreSQL Invariant** | No PostgreSQL, pg driver, or DATABASE_URL dependencies | Full codebase string search and environment inspection | Zero references to `pg`, `pg-pool`, or `DATABASE_URL` in E-Paper operational paths. Persistence is mediated via `FirestoreAdapter` and `AtomicJsonStorage`. | **PASS** |

---

## 3. Detailed Security Findings

### Finding SEC-01 (Priority P1 — High): Preflight Gate Bypass via `/status` Endpoint
- **Affected Route**: `PUT /api/v1/epaper/editions/:id/status` (`src/server/apiEngine.js:1070`)
- **Vulnerability**: While `POST /api/v1/epaper/editions/:id/publish` strictly runs `QualityPreflightScanner.evaluate()` and creates an immutable snapshot in `epaperEditionVersions`, the legacy status update route `PUT /status` allows a Chief Editor or Master Admin to set `targetStatus = 'PUBLISHED'` directly.
- **Impact**: Bypasses the 5 preflight blocker checks (text overflow, missing attribution, orphan headlines, unapproved ads) and fails to freeze an immutable version snapshot in `epaperEditionVersions`.
- **Recommended Remediation**:
  In `src/server/apiEngine.js:1070`:
  ```javascript
  if (targetStatus === 'PUBLISHED') {
    return sendError(res, 400, 'ERR_INVALID_OPERATION', 'प्रकाशन हेतु समर्पित /publish एंडपॉइंट का उपयोग करें।');
  }
  ```

### Finding SEC-02 (Priority P2 — Medium): Hardcoded Quota & UTC Reset Boundary
- **Affected File**: `src/server/persistence/adapter.js:5066`
- **Vulnerability**: Daily WhatsApp card quota is hardcoded to `const maxDaily = 20`. In addition, date filtering uses `new Date().toISOString().split('T')[0]` which evaluates in UTC timezone (+00:00).
- **Impact**: Indian stringers operating in IST (+05:30) have their daily quotas reset at 05:30 AM instead of midnight IST, and Master Admins cannot grant higher quotas to senior journalists.
- **Recommended Remediation**:
  1. Read `maxDaily` from `user.customWhatsAppQuota || 20`.
  2. Calculate `today` using `new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })`.

### Finding SEC-03 (Priority P3 — Low): Export Route Public Fallback
- **Affected Route**: `GET /api/v1/epaper/editions/:id/export/pdf` (`src/server/apiEngine.js:1130`)
- **Finding**: Non-editors can only export editions if `edition.status === 'PUBLISHED'`. If an edition is in `DRAFT`, unauthenticated or reader requests correctly receive HTTP 403 `ERR_FORBIDDEN`.
- **Verdict**: Verified secure.
