# BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
# STEP 17 — PUBLISHING SECURITY & ACCESS CONTROL MATRIX

**Project:** BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)  
**Document ID:** `BNW-DOC-EPAPER-STEP17-SECURITY-MATRIX-2026-V1.0`  
**Classification:** Operational Security & Access Control Matrix  
**Audit Phase:** Post-STEP 16 Independent Verification  
**Audit Date:** 2026-11-18  

---

## 1. Route-to-Adapter Security Matrix

The table below enumerates all operational entry points that can create, mutate, publish, modify, or archive E-Paper editions, documenting their HTTP route, persistence method, role requirements, guards, preflight requirements, and observed security status.

| Operation | HTTP Endpoint / Adapter Method | Minimum Required Role | Input Sanitization & Normalization | Preflight & Validation Requirements | Enforced Initial / Final Status | Security Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **Create Edition** | `POST /api/v1/epaper/editions`<br>`adapter.createEpaperEditionWithPages()` | `EDITOR`, `ADMIN`, `CHIEF_EDITOR`, `MASTER_ADMIN` | Reject `status: 'PUBLISHED'` (with whitespace trimming & uppercase conversion). | Valid `title` and `publicationDate` (YYYY-MM-DD) required. | Unconditionally forced to **`DRAFT`** | **VERIFIED SECURE** |
| **Change Status** | `PATCH /api/v1/epaper/editions/:id/status`<br>`adapter.updateEpaperEditionStatus()` | `EDITOR` (for intermediate states);<br>`CHIEF_EDITOR` / `MASTER_ADMIN` (for `APPROVED`) | `rawTarget.trim().toUpperCase()`. Validates against `VALID_EPAPER_STATUSES`. | OCC version check (`expectedVersion`). Unconditionally blocks `status === 'PUBLISHED'`. | Transitions between DRAFT, REVIEW, LAYOUT, QC, APPROVED, ARCHIVED | **VERIFIED SECURE** |
| **Publish Edition** | `POST /api/v1/epaper/editions/:id/publish`<br>`adapter.publishEpaperEdition()` | `EDITOR`, `CHIEF_EDITOR`, `MASTER_ADMIN` | Server-assigned parameters; authenticated `user.fullName` logged as publisher. | Mandatory 5-point `QualityPreflightScanner`. Returns HTTP 422 if unpublishable. OCC version check. | Transitions to **`PUBLISHED`** + creates immutable version snapshot | **VERIFIED SECURE** |
| **Direct Edition Update** | `PUT/PATCH /api/v1/epaper/editions/:id`<br>`adapter.saveEpaperEdition()` | `EDITOR`, `CHIEF_EDITOR`, `MASTER_ADMIN` | Trims and uppercase converts `status`. | If `normStatus === 'PUBLISHED'` and `existing.status !== 'PUBLISHED'`, blocks with HTTP 400. OCC version check. | Cannot transition an unpublished edition to `PUBLISHED` | **VERIFIED SECURE** |
| **View / Read Edition** | `GET /api/v1/epaper/editions/:id`<br>`adapter.getEpaperEditionById()` | Public (for `PUBLISHED`);<br>`EDITOR` (for `DRAFT`, `REVIEW`, etc.) | Edition ID URL path sanitized. | Non-published editions return HTTP 404 to unauthenticated or non-editorial public readers. | Unchanged | **VERIFIED SECURE** |
| **Create/Read Snapshots** | `GET /api/v1/epaper/editions/:id/versions`<br>`adapter.getEpaperEditionVersions()` | `EDITOR`, `CHIEF_EDITOR`, `MASTER_ADMIN` | Edition ID URL path sanitized. | Snapshots are generated exclusively by `publishEpaperEdition`. No direct client creation route exists. | Snapshots marked `immutable: true` | **VERIFIED SECURE** |
| **Archive Edition** | `POST /api/v1/epaper/editions/:id/archive` or `PATCH /status` (`ARCHIVED`) | `EDITOR`, `CHIEF_EDITOR`, `MASTER_ADMIN` | Status validated against `VALID_EPAPER_STATUSES`. | Valid edition exists; OCC check. | Transitions to **`ARCHIVED`** | **VERIFIED SECURE** |
| **WhatsApp Card Generation** | `POST /api/v1/epaper/whatsapp/generate`<br>`adapter.atomicSaveEpaperWhatsAppGeneration()` | Authenticated User (`REPORTER`, `EDITOR`, etc.) | Format strictly `'1:1'` or `'4:5'`. Headline/body validation. | Authenticated `user.id` overrides any client `reporterId`. Enforces per-reporter mutex & IST daily quota. | HTTP 429 when remaining quota = 0 | **VERIFIED SECURE (Local)**<br>**OPEN (Distributed)** |
| **Manage Reporter Quota** | `PUT/PATCH /api/v1/epaper/whatsapp/quota/:reporterId`<br>`adapter.setReporterWhatsAppQuota()` | `CHIEF_EDITOR`, `MASTER_ADMIN` | Number validation: non-negative integer (0–500). | `isChiefEditorOrMasterAdmin(user)` required. Rejects negative numbers with HTTP 400. Non-admins receive HTTP 403. | Persists custom quota in `epaperWhatsAppQuotas` | **VERIFIED SECURE** |

---

## 2. Invariant Verification Analysis

### 2.1 Invariant 1: Direct Status Mutation Cannot Bypass Preflight
- **Mechanism**:
  - `PATCH /api/v1/epaper/editions/:id/status` explicitly checks:
    ```javascript
    if (targetStatus === 'PUBLISHED') {
      return sendError(res, 400, 'ERR_INVALID_OPERATION', 'ई-पेपर संस्करण को सीधे "PUBLISHED" स्थिति में सेट नहीं किया जा सकता। कृपया समर्पित प्रकाशन पाइपलाइन (POST /api/v1/epaper/editions/:id/publish) का उपयोग करें।');
    }
    ```
  - `PUT/PATCH /api/v1/epaper/editions/:id` explicitly checks:
    ```javascript
    if (normStatus === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      return sendError(res, 400, 'ERR_INVALID_OPERATION', 'ई-पेपर संस्करण को सीधे "PUBLISHED" स्थिति में सेट नहीं किया जा सकता। कृपया समर्पित प्रकाशन पाइपलाइन (POST /api/v1/epaper/editions/:id/publish) का उपयोग करें।');
    }
    ```
- **Conclusion**: There is no non-publish API route capable of setting an edition to `PUBLISHED`. Every publication event must pass through `POST /publish`.

### 2.2 Invariant 2: Creation Cannot Instantiate PUBLISHED Editions
- **Mechanism**:
  - `POST /api/v1/epaper/editions` rejects incoming payloads containing `status: 'PUBLISHED'` (trimmed, case-insensitive) with HTTP 400 `ERR_INVALID_OPERATION`.
  - For any other payload, the route overwrites status: `creationPayload = { ...body, status: 'DRAFT' }`.
  - Both `LocalJsonAdapter.createEpaperEditionWithPages` and `FirestoreAdapter.createEpaperEditionWithPages` unconditionally set `status: 'DRAFT'`.
- **Conclusion**: Both the network API layer and the persistence layer enforce that all newly created editions start as `DRAFT`.

### 2.3 Invariant 3: Publishing Performs Required Preflight Validation
- **Mechanism**:
  - In `POST /api/v1/epaper/editions/:id/publish`:
    ```javascript
    const pages = await adapter.getEpaperPagesByEditionId(editionId);
    const preflight = QualityPreflightScanner.evaluate(edition, pages);
    if (!preflight.canPublish) {
      return sendJson(res, 422, {
        success: false,
        error: 'ERR_PREFLIGHT_BLOCKER: Publishing blocked due to critical preflight errors.',
        code: 'ERR_PREFLIGHT_BLOCKER',
        diagnostics: preflight,
      });
    }
    ```
  - The 5-point scan validates:
    1. Masthead presence on Page 1.
    2. Lead story presence on Page 1.
    3. Missing image / broken asset detection across all pages.
    4. Ad collision / overlapping element detection.
    5. Printable boundary overflow detection.
- **Conclusion**: An unready or empty edition cannot be published.

### 2.4 Invariant 4: Published Snapshots Remain Immutable
- **Mechanism**:
  - `adapter.publishEpaperEdition` serializes deep JSON clones of `existing` edition and all `pages`.
  - Snapshot is saved via `saveEpaperEditionVersion(snapshot)` with `immutable: true`.
  - No client-facing HTTP endpoint exists to modify or overwrite snapshot documents in `epaperEditionVersions`.
  - `GET /api/v1/epaper/editions/:id/versions` returns historical snapshots in read-only format.
- **Conclusion**: Historical published records cannot be modified after release.

### 2.5 Invariant 5: Optimistic Concurrency Control (OCC)
- **Mechanism**:
  - All mutating endpoints (`PATCH /status`, `PUT /editions/:id`, `PUT /pages/:id`, `POST /publish`) require an expected version integer.
  - If `expectedVersion !== existing.version`, HTTP 409 `ERR_CONCURRENCY_CONFLICT` (or `ERR_OCC_COLLISION`) is returned.
- **Conclusion**: Parallel editorial updates do not cause lost updates.

### 2.6 Invariant 6: Authenticated Server-Side Identity
- **Mechanism**:
  - Client cannot specify `authorId` or `reporterId` to claim another user's quota or create audit entries under another name.
  - JWT token is decoded and validated cryptographically on the server.
  - Identity is pinned to `user.id` and `user.roles`.
- **Conclusion**: Role and identity spoofing is prevented.
