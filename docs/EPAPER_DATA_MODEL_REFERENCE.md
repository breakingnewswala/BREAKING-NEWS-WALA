# EPAPER_DATA_MODEL_REFERENCE.md — BREAKING NEWS WALA E-Paper Data Schemas
## Document ID: DOC-EPAPER-DATA-2026-V1.0
### Scope: Collection Specifications, Entity Relationships, OCC Rules & Immutability Models

---

## 1. Architectural Philosophy
The E-Paper Management System operates on a strict **Zero-PostgreSQL** model:
- Primary persistence: **Cloud Firestore** (`FirestoreAdapter`) in production.
- Local persistence: **Atomic JSON Engine** (`AtomicJsonStorage`) in local development and testing.
- Source Article Immutability: News articles in `newsArticles` are read-only sources of truth. E-Paper placement creates decoupled element records referencing `articleId` with immutable snapshot hashes.

---

## 2. Collections & Schemas

### 2.1 `epaperEditions`
Represents an edition instance (Daily 12-page broadsheet or Special edition).
```typescript
interface EpaperEdition {
  id: string;                         // e.g. "epaper_ed_20261118_bhopal"
  editionCode: string;                // e.g. "EP-20261118-BHO-01"
  title: string;                      // Devanagari edition title
  editionType: 'DAILY' | 'SPECIAL';
  date: string;                       // "YYYY-MM-DD"
  division: string;                   // MP Division (e.g. "भोपाल")
  district: string;                   // MP District (e.g. "भोपाल")
  pageCount: number;                  // 12 for DAILY, configurable for SPECIAL
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'archived';
  version: number;                    // OCC counter (1, 2, 3...)
  publishedAt?: string;               // ISO 8601 timestamp
  publishedBy?: string;               // User ID of publishing editor
  preflightResult?: PreflightSummary; // Last executed preflight report
  createdAt: string;
  updatedAt: string;
}
```

### 2.2 `epaperPages`
Represents an individual broadsheet page within an edition.
```typescript
interface EpaperPage {
  id: string;                         // e.g. "epaper_page_20261118_bhopal_p1"
  editionId: string;                  // Foreign key to epaperEditions
  pageNumber: number;                 // 1 to 12
  pageName: string;                   // e.g. "मुख्य पृष्ठ (Front Page)"
  category: string;                   // e.g. "FRONT_PAGE", "STATE", "METRO"
  gridColumns: 3 | 4 | 5 | 6 | 8;    // Broadsheet column grid count
  elements: EpaperElement[];          // Visual blocks placed on canvas
  version: number;                    // OCC page version counter
  createdAt: string;
  updatedAt: string;
}
```

### 2.3 `EpaperElement` (Broadsheet Canvas Item)
Positioned on the $32.9\text{ cm} \times 52.0\text{ cm}$ canvas ($932.6\text{ pt} \times 1474.0\text{ pt}$ at 72 DPI).
```typescript
interface EpaperElement {
  id: string;
  type: 'MASTHEAD' | 'LEAD_STORY' | 'STORY' | 'BRIEF' | 'PHOTO' | 'AD' | 'PERMANENT_COLUMN';
  x: number;                          // Position in typographic points
  y: number;
  width: number;
  height: number;
  zIndex: number;
  articleId?: string;                 // Source article provenance
  headline?: string;
  bodyText?: string;                  // Devanagari justified body text
  imageUrl?: string;
  caption?: string;
  reporterCredit?: {
    reporterId: string;
    reporterName: string;
    badgeCode: string;                // e.g. "BNW-REP-4011"
  };
  editorCredit?: {
    editorId: string;
    editorName: string;
  };
  adMetadata?: {
    adId: string;
    advertiserName: string;
    unitType: string;
    hasAsciBadge: boolean;            // Mandatory ASCI 'विज्ञापन' badge
  };
}
```

### 2.4 `epaperTemplates`
System presets (12 canonical broadsheet pages) and user-saved custom layouts.
```typescript
interface EpaperTemplate {
  id: string;
  name: string;
  category: 'SYSTEM' | 'CUSTOM' | 'SPECIAL';
  pageNumber?: number;
  gridColumns: 3 | 4 | 5 | 6 | 8;
  headerHeight: number;               // 99.21 pt (3.5 cm standard)
  footerHeight: number;               // 42.52 pt (1.5 cm standard)
  slots: TemplateSlot[];
  version: number;
}
```

### 2.5 `epaperAds`
Broadsheet commercial bookings and rate cards.
```typescript
interface EpaperAd {
  id: string;
  advertiserName: string;
  contactPhone: string;
  unitType: 'FULL_PAGE' | 'HALF_PAGE_HORIZONTAL' | 'HALF_PAGE_VERTICAL' | 'QUARTER_PAGE' | 'BOTTOM_STRIP' | 'EAR_PANEL' | 'L_SHAPE';
  aspectRatio: '1:1' | '3:4' | '2:3' | '4:3' | '16:9' | 'CUSTOM';
  rate: number;                       // In INR
  district: string;
  isApproved: boolean;
  asciBadgeStamped: boolean;          // Guaranteed true before placement
  submittedByReporterId?: string;     // If filed by field stringer
}
```

### 2.6 `epaperEditionVersions` (Immutable Snapshots)
Frozen at publishing time.
```typescript
interface EpaperEditionVersion {
  id: string;                         // e.g. "epaper_ver_ed1_v1"
  editionId: string;
  versionNumber: number;
  snapshotData: {
    edition: EpaperEdition;
    pages: EpaperPage[];
  };
  snapshotHash: string;               // SHA-256 integrity hash
  publishedAt: string;
  publishedBy: string;
}
```

### 2.7 `whatsappClippings`
Internal social distribution cards.
```typescript
interface WhatsappClipping {
  id: string;
  reporterId: string;
  articleId: string;
  format: '1:1' | '4:5';
  storagePath: string;                // "whatsapp/{reporterId}/{id}.png"
  isPrivate: true;                    // Strictly private bucket access
  createdAt: string;
}
```

---

## 3. Optimistic Concurrency Control (OCC) Specification
- All write operations (`PUT /pages/:pageId`, `PUT /editions/:id`, `POST /publish`) require client-supplied `version`.
- Database write transaction compares client version with current stored version:
  - If equal: update succeeds, database atomic counter increments `version = version + 1`.
  - If unequal: update is rejected with `HTTP 409 Conflict` returning current server document.
