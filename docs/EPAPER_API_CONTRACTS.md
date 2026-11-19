# EPAPER_API_CONTRACTS.md — BREAKING NEWS WALA E-Paper REST API Reference
## Document ID: DOC-EPAPER-API-2026-V1.0
### Scope: Canonical REST API Endpoints, Request/Response Schemas & Status Codes for Steps 2 to 12

---

## 1. Overview & Authentication
All E-Paper endpoints are served under `/api/v1/epaper/`.
- **Authentication**: Bearer JWT dual-token scheme (`Authorization: Bearer <accessToken>`).
- **Authorization**: Enforced server-side via `isEpaperEditor` (Master Admin, Admin, Desk Editor roles). Reporter routes verify `isReporter` with district-level boundary checks.
- **Error Conventions**: Standard JSON envelope `{ success: false, error: "<MESSAGE>", code: "<ERR_CODE>" }`.

---

## 2. Edition Management (`/api/v1/epaper/editions`)

### 2.1 List Editions
- **Endpoint**: `GET /api/v1/epaper/editions`
- **Query Parameters**:
  - `date`: `YYYY-MM-DD` (optional)
  - `status`: `draft | in_review | approved | published | archived` (optional)
  - `division`: Madhya Pradesh division (optional)
  - `district`: Madhya Pradesh district (optional)
  - `limit`: Integer (default 50)
  - `page`: Integer (default 1)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "epaper_ed_20261118_bhopal",
        "editionCode": "EP-20261118-BHO-01",
        "title": "दैनिक संस्करण — भोपाल",
        "editionType": "DAILY",
        "date": "2026-11-18",
        "division": "भोपाल",
        "district": "भोपाल",
        "pageCount": 12,
        "status": "published",
        "version": 1,
        "createdAt": "2026-11-18T04:00:00.000Z",
        "updatedAt": "2026-11-18T05:00:00.000Z"
      }
    ],
    "total": 1
  }
  ```

### 2.2 Create Edition
- **Endpoint**: `POST /api/v1/epaper/editions`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "title": "दैनिक संस्करण — भोपाल",
    "editionType": "DAILY",
    "date": "2026-11-18",
    "division": "भोपाल",
    "district": "भोपाल",
    "pageCount": 12
  }
  ```
- **Response `201 Created`**: Returns edition object with generated `id`, `editionCode`, and default 12 pages pre-populated.

### 2.3 Get Edition Detail with Pages
- **Endpoint**: `GET /api/v1/epaper/editions/:id`
- **Response `200 OK`**: Full edition metadata with embedded `pages` array and status tracking.

### 2.4 Update Edition
- **Endpoint**: `PUT /api/v1/epaper/editions/:id`
- **Request Body**: Partial edition metadata, `version` for Optimistic Concurrency Control (OCC).
- **Response `200 OK`** or **`409 Conflict`** if version mismatch.

### 2.5 Delete Edition
- **Endpoint**: `DELETE /api/v1/epaper/editions/:id`
- **Response `200 OK`**: Allowed only for un-published draft editions.

---

## 3. Page Designer & Elements (`/api/v1/epaper/pages`)

### 3.1 Get Page Details
- **Endpoint**: `GET /api/v1/epaper/pages/:pageId`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "id": "page_01",
      "editionId": "epaper_ed_20261118_bhopal",
      "pageNumber": 1,
      "pageName": "मुख्य पृष्ठ (Front Page)",
      "gridColumns": 8,
      "elements": [
        {
          "id": "elem_masthead_1",
          "type": "MASTHEAD",
          "x": 42.52,
          "y": 42.52,
          "width": 847.56,
          "height": 99.21,
          "zIndex": 10
        }
      ],
      "version": 2
    }
  }
  ```

### 3.2 Update Page Elements (Layout Save)
- **Endpoint**: `PUT /api/v1/epaper/pages/:pageId`
- **Request Body**:
  ```json
  {
    "elements": [ /* Array of page elements */ ],
    "gridColumns": 8,
    "version": 2
  }
  ```
- **Response `200 OK`**: Increments `version`.
- **Response `409 Conflict`**: Returns current server version when an OCC collision occurs.

### 3.3 Check Article Duplicate Placement
- **Endpoint**: `GET /api/v1/epaper/pages/check-article/:articleId`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "isPlaced": true,
    "placements": [
      {
        "editionId": "epaper_ed_20261118_bhopal",
        "pageNumber": 1,
        "elementId": "elem_lead_1"
      }
    ]
  }
  ```

---

## 4. Templates & AI Analyzer (`/api/v1/epaper/templates`)

### 4.1 List Templates
- **Endpoint**: `GET /api/v1/epaper/templates`
- **Query**: `category=system | custom`

### 4.2 Save Custom Template
- **Endpoint**: `POST /api/v1/epaper/templates`
- **Request Body**: Template configuration derived from active Page Designer layout.

### 4.3 AI Template Layout Analyzer
- **Endpoint**: `POST /api/v1/epaper/templates/analyze`
- **Request Body**: `{ "imageUrl": "<URL_OR_BASE64>" }`
- **Response `200 OK`**: Structural proposals (header, columns, story boxes, ad slots) with `bnw-mock-v1` deterministic fallback.

---

## 5. Monetization & Ads (`/api/v1/epaper/ads`)

### 5.1 List Ad Bookings
- **Endpoint**: `GET /api/v1/epaper/ads`

### 5.2 Calculate Ad Rate Card
- **Endpoint**: `POST /api/v1/epaper/ads/calculate-rate`
- **Request Body**: `{ "unitType": "HALF_PAGE_HORIZONTAL", "district": "भोपाल", "color": true }`

### 5.3 Submit Local Ad (Reporter Classifieds)
- **Endpoint**: `POST /api/v1/epaper/ads/submit-classified`
- **Request Body**: Advertiser name, contact, text, size, target edition.

---

## 6. WhatsApp Edition Generator (`/api/v1/epaper/whatsapp`)

### 6.1 Generate Visual Card
- **Endpoint**: `POST /api/v1/epaper/whatsapp/generate`
- **Request Body**:
  ```json
  {
    "articleId": "art_101",
    "format": "4:5",
    "headline": "भोपाल में स्मार्ट सिटी परियोजना का विस्तार",
    "bodyText": "मध्य प्रदेश शासन द्वारा राजधानी में नए मेट्रो फीडर रूट्स...",
    "reporterId": "BNW-REP-4011"
  }
  ```
- **Response `200 OK`**: Card rendering buffer and URL in private bucket (`whatsapp/${reporterId}/`).
- **Response `429 Too Many Requests`**: `{ "error": "Daily quota of 20 cards reached", "code": "ERR_QUOTA_EXHAUSTED" }`.

### 6.2 Check Reporter Daily Quota
- **Endpoint**: `GET /api/v1/epaper/whatsapp/quota`

---

## 7. AI Newsroom Tools (`/api/v1/epaper/ai`)

- `POST /api/v1/epaper/ai/auto-layout`: 2D column skyline bin-packing.
- `POST /api/v1/epaper/ai/classify-category`: Maps story text and MP 55 districts to 12 broadsheet sections.
- `POST /api/v1/epaper/ai/permanent-columns`: Generates daily features (*Panchang*, *Editorial*, *Mandi Rates*, *Weather*, *District Roundup*).
- `GET /api/v1/epaper/ai/permanent-columns/types`: Returns the 5 supported column schemas.

---

## 8. Quality Preflight & Publishing (`/api/v1/epaper/editions/:id`)

### 8.1 Execute Preflight Checks
- **Endpoint**: `GET /api/v1/epaper/editions/:id/preflight`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "canPublish": false,
    "diagnostics": [
      {
        "type": "TEXT_OVERFLOW",
        "severity": "BLOCKER",
        "pageNumber": 1,
        "elementId": "elem_lead_1",
        "message": "कहानी का टेक्स्ट बॉक्स सीमा से 42px बाहर जा रहा है"
      }
    ],
    "summary": { "blockers": 1, "errors": 0, "warnings": 0 }
  }
  ```

### 8.2 Publish Edition
- **Endpoint**: `POST /api/v1/epaper/editions/:id/publish`
- **Request Body**: `{ "version": 2 }`
- **Response `200 OK`**: Transitions edition to `published`, increments version, and freezes snapshot in `epaperEditionVersions`.
- **Response `422 Unprocessable Entity`**: If blockers remain in preflight checks.
- **Response `409 Conflict`**: If version mismatch occurs.

---

## 9. Public Reader & Archive (`/api/v1/epaper`)

- `GET /api/v1/epaper/today`: Returns today's active published edition for the user's detected/selected district.
- `GET /api/v1/epaper/archive`: Historical archive search filterable by date, division, and district.
- `GET /api/v1/epaper/editions/:id/versions`: Lists historical published snapshots.

---

## 10. Print-Ready 300 DPI Export (`/api/v1/epaper/editions/:id/export`)

- `GET /api/v1/epaper/editions/:id/export/pdf`: Native Node.js PDF-1.4 binary ($32.9\text{ cm} \times 52.0\text{ cm}$, MediaBox `[0 0 932.6 1474]`, crop marks).
- `GET /api/v1/epaper/editions/:id/export/page/:pageNumber/image`: 300 DPI high-resolution PNG buffer ($3886 \times 6142\text{ px}$ with PNG `pHYs` chunk).
- `GET /api/v1/epaper/editions/:id/export/metadata`: Prepress RIP calibration specifications.
