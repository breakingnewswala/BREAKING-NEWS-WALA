# BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
## IMPLEMENTATION REPORT — STEP 6: ADVERTISEMENT MANAGER & AI AD STUDIO
### Document ID: DOC-49-STEP6-REPORT-2026-V1.0
**Date of Execution:** November 18, 2026  
**Execution Lead:** Lead Architect, Advertisement & Monetization Engineer, Backend & Database Engineer  
**Governing Manual:** `AGENTS.md` (DOC-36-AGENTS-ROOT-2026-V1.0) & Golden Development Protocol  
**Implementation Status:** **100% COMPLETE & VERIFIED**  
**Test Pass Rate:** **10 / 10 Tests Passing (0 Failures)**  

---

## 1. Task Objective & Functional Scope

Step 6 delivers the print monetization engine for the platform through the **Advertisement Manager & AI Ad Studio**. It establishes standardized newspaper advertising slot classifications, enforces mandatory Indian statutory advertising disclosures (ASCI guidelines), and integrates district reporter classified ad workflows.

### Functional Requirements Addressed (ORIGINAL_REQUEST R5):
1. **Commercial Print Ad Slot Classifications:** Standard Indian newspaper advertising formats:
   - **Vertical Ear Panel (शीर्ष कान):** Top masthead companion ($w=120\text{pt}, h=80\text{pt}$).
   - **Bottom Strip / Footer (निचली पट्टी):** Full-width or partial footer ($h=120\text{pt}$ to $180\text{pt}$).
   - **L-Shape (एल-आकार):** Premium composite bottom-and-side layout framing editorial news.
   - **Quarter Page (चौथाई पृष्ठ):** $4\text{ columns} \times \text{half height}$ or $2\text{ columns} \times \text{full height}$.
   - **Half Page (आधा पृष्ठ):** Horizontal ($8\text{ cols} \times \text{half height}$) or Vertical ($4\text{ cols} \times \text{full height}$).
   - **Full Page (पूरा पृष्ठ):** Complete broadsheet takeover.
2. **Standard Ad Aspect Ratios:** Multi-ratio creative ingestion supporting 1:1, 3:4, 2:3, 4:3, 16:9, and custom dimensions.
3. **Mandatory ASCI 'विज्ञापन' Identification Badge:** Strict statutory compliance under Advertising Standards Council of India (ASCI) code. All paid commercial placements automatically receive a persistent Hindi disclosure badge ('विज्ञापन') in the upper-left or upper-right corner.
4. **District Reporter Classified Ad Workflow:** Mobile-friendly intake form enabling accredited field stringers to submit local commercial notices, government tenders, or classifieds with district targeting, category selection, and editorial admin review.

---

## 2. Technical Architecture & Implementation Details

### 2.1 Ad Slot Geometry & Classification Engine (`src/server/monetization/adManager.js`)
```javascript
export const AD_SLOT_TYPES = {
  EAR_PANEL: { id: 'EAR_PANEL', title: 'शीर्ष कान (Ear Panel)', defaultColSpan: 2, defaultHeightPt: 80 },
  BOTTOM_FOOTER: { id: 'BOTTOM_FOOTER', title: 'निचली पट्टी (Bottom Footer)', defaultColSpan: 8, defaultHeightPt: 140 },
  L_SHAPE: { id: 'L_SHAPE', title: 'एल-आकार (L-Shape)', defaultColSpan: 8, defaultHeightPt: 400 },
  QUARTER_PAGE: { id: 'QUARTER_PAGE', title: 'चौथाई पृष्ठ (Quarter Page)', defaultColSpan: 4, defaultHeightPt: 300 },
  HALF_PAGE_HORIZONTAL: { id: 'HALF_PAGE_HORIZONTAL', title: 'आधा पृष्ठ क्षैतिज', defaultColSpan: 8, defaultHeightPt: 620 },
  HALF_PAGE_VERTICAL: { id: 'HALF_PAGE_VERTICAL', title: 'आधा पृष्ठ ऊर्ध्वाधर', defaultColSpan: 4, defaultHeightPt: 1240 },
  FULL_PAGE: { id: 'FULL_PAGE', title: 'पूरा पृष्ठ (Full Page)', defaultColSpan: 8, defaultHeightPt: 1247.2 }
};
```

### 2.2 ASCI Regulatory Badge Stamping
To ensure total legal protection for the news organization, badge application is enforced server-side:
```javascript
// Stamped unconditionally whenever an ad element is persisted onto a page
if (element.elementType === 'AD') {
  element.asciBadge = true;
  element.asciText = 'विज्ञापन';
  element.asciPosition = 'TOP_RIGHT';
}
```
During visual rendering (`src/services/graphicRenderer.ts`), `drawAsciBadge` paints a high-contrast Devanagari label:
```typescript
private drawAsciBadge(ctx: CanvasRenderingContext2D, bounds: Bounds): void {
  const badgeWidth = 48;
  const badgeHeight = 16;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(bounds.x + bounds.width - badgeWidth - 4, bounds.y + 4, badgeWidth, badgeHeight);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 9px "Noto Sans Devanagari", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('विज्ञापन', bounds.x + bounds.width - (badgeWidth / 2) - 4, bounds.y + 12);
}
```

### 2.3 Reporter Classified Intake & Admin Approval
1. **Submission:** Stringer fills ad details (`clientName`, `clientPhone`, `districtId`, `category`, `creativeUrl`) via `/api/v1/epaper/ads/classified-submission`.
2. **Queue:** New ads enter status `'PENDING_APPROVAL'`.
3. **Review:** Advertising desk approves (`'APPROVED'`) or rejects (`'REJECTED'`) with comments.
4. **Publishing Check:** The Quality Preflight Scanner (Step 10) explicitly halts publishing if any ad placed on an edition page has status `'PENDING_APPROVAL'` or is missing the ASCI badge.

---

## 3. Files Created & Modified

| File Path | Action | Description |
|:---|:---:|:---|
| `src/server/monetization/adManager.js` | Created | Print ad slot classifications, aspect ratios, ASCI badge utilities |
| `src/services/graphicRenderer.ts` | Modified | Added canvas badge rendering (`drawAsciBadge`) for commercial ads |
| `src/server/apiEngine.js` | Modified | Added classified submission and ad approval queue routes |
| `src/screens/AdminControlScreen.tsx` | Modified | Added Ad Manager review drawer and slot placement controls |
| `tests/backend-epaper-management.test.js` | Modified | Tier 1 (`T1.5.1`–`T1.5.5`) and Tier 2 (`T2.5.1`–`T2.5.5`) ad tests |

---

## 4. Testing & Verification Evidence

Step 6 functionality is verified by 10 automated tests in `tests/backend-epaper-management.test.js`:

```
▶ Tier 1: Feature Coverage (Step 6: Broadsheet Ad Manager)
  ✔ T1.5.1: Create ad slot classifications (L-shape, bottom footer, vertical ear, quarter/half/full) (1.43ms)
  ✔ T1.5.2: Ingest ad creatives with standard newspaper aspect ratios (1:1, 3:4, 2:3, 4:3, 16:9) (0.29ms)
  ✔ T1.5.3: Mandatory stamping of ASCI-compliant "विज्ञापन" identification badge (0.24ms)
  ✔ T1.5.4: Submit reporter classified ad with district code and pricing category (0.33ms)
  ✔ T1.5.5: Admin approval queue transition for pending reporter ads (0.45ms)
▶ Tier 2: Boundary & Corner Cases (Step 6: Broadsheet Ad Manager Boundaries)
  ✔ T2.5.1: Zero-dimension or negative-dimension ad placement rejected (3.34ms)
  ✔ T2.5.2: Ad element placed without mandatory ASCI "विज्ञापन" badge triggers error (0.37ms)
  ✔ T2.5.3: Multiple ads occupying overlapping coordinates flagged as collision conflict (0.21ms)
  ✔ T2.5.4: Reporter ad with missing required contact/billing information rejected (2.99ms)
  ✔ T2.5.5: Oversized ad exceeding full page broadsheet dimensions clamped (0.34ms)
```

**Verification Result:** 10 passed, 0 failed. Execution duration: ~9.7 ms. Clean exit code 0.

---

## 5. Security & Invariant Compliance
- **ASCI Statutory Invariant**: Commercial ads cannot be stripped of their 'विज्ञापन' badge; tampering triggers `BLOCKER` in preflight diagnostics.
- **Strict Monetary Boundaries**: Complies with `DEC-069` (no unapproved click-revenue schemes; ad billing is managed through centralized Razorpay invoices and official rate cards).
