# BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
## IMPLEMENTATION REPORT — STEP 7: REPORTER WORKSPACE & 4:5 CLIPPINGS
### Document ID: DOC-50-STEP7-REPORT-2026-V1.0
**Date of Execution:** November 18, 2026  
**Execution Lead:** Lead Architect, Reporter & Public Experience Engineer, Frontend & Dashboard Engineer  
**Governing Manual:** `AGENTS.md` (DOC-36-AGENTS-ROOT-2026-V1.0) & Golden Development Protocol  
**Implementation Status:** **100% COMPLETE & VERIFIED**  
**Associated Automated Tests:** Passing in Master Test Suite  

---

## 1. Task Objective & Functional Scope

Step 7 empowers the platform's grassroots journalistic network across Madhya Pradesh's 55 districts through the **Reporter Workspace & 4:5 Clippings** module. Integrated into the mobile-first Reporter Desk (`src/screens/ReporterDeskScreen.tsx`), it provides accredited field stringers with tools to track editorial progress and generate professional, authenticated 4:5 social media clippings.

### Functional Requirements Addressed (ORIGINAL_REQUEST R6):
1. **Beat-Bound Reporter Desk:** Mobile-optimized view filtering stories strictly to the reporter's assigned district (e.g. Niwari, Orchha, Jabalpur) and editorial beats (Crime, Administration, Agriculture, Sports).
2. **Editorial Status Tracking:** Real-time visibility into filed reports progressing through the 10-Point Fact-Checking Protocol (`SUBMITTED` -> `UNDER_REVIEW` -> `FACT_CHECKED` -> `APPROVED` -> `PUBLISHED`).
3. **Personalized 4:5 Article Clipping Generator:** On-demand rendering of high-impact social media cards ($800 \times 1000\text{ px}$, 4:5 Instagram/WhatsApp portrait ratio).
4. **Accredited Attribution Badge:** Every generated clipping embeds the reporter's verified portrait photo, official Devanagari byline, district bureau name, and unique accredited reporter badge number (`REP-MP-XXXX`).
5. **Brand Integrity & Anti-Tamper:** Automated watermarking with the official BREAKING NEWS WALA masthead and date stamp, preventing unauthorized text manipulation by third parties.

---

## 2. Technical Architecture & Implementation Details

### 2.1 4:5 Clipping Canvas Architecture (`src/services/graphicRenderer.ts`)
The clipping rendering pipeline operates independently of the DOM:
```typescript
export interface ReporterClippingOptions {
  articleTitle: string;
  articleSummary: string;
  category: string;
  publicationDate: string;
  districtName: string;
  reporterName: string;
  reporterBadgeId: string;
  reporterPhotoUrl?: string;
  articleImageUrl?: string;
}

export class GraphicRenderer {
  public static async renderReporterClipping(
    canvas: HTMLCanvasElement | OffscreenCanvas,
    options: ReporterClippingOptions
  ): Promise<void> {
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    canvas.width = 800;
    canvas.height = 1000; // 4:5 Aspect Ratio
    
    // 1. Render Branded Header with Masthead & Date
    this.drawClippingHeader(ctx, options);
    
    // 2. Render Hero Image or Category Placeholder
    await this.drawClippingMedia(ctx, options);
    
    // 3. Render Devanagari Headline with Auto-Wrapping
    this.drawDevanagariHeadline(ctx, options.articleTitle, 40, 480, 720);
    
    // 4. Render Justified Devanagari Body Text
    this.renderJustifiedDevanagariText(ctx, options.articleSummary, 40, 580, 720, 28, 18, 'Noto Sans Devanagari');
    
    // 5. Render Verified Reporter Attribution Footer
    await this.drawReporterAttributionFooter(ctx, options);
  }
}
```

### 2.2 Reporter Workspace Integration (`src/screens/ReporterDeskScreen.tsx`)
Stringers accessing the Reporter Desk view their filed stories. For any story with status `'APPROVED'` or `'PUBLISHED'`, a "शेयर कार्ड बनाएं (4:5)" button opens the clipping preview modal. The modal renders the card locally on an offscreen canvas, allowing one-tap instant download or direct sharing to social channels.

### 2.3 Fallback Handling for Missing Assets
If a field stringer has not yet uploaded a high-resolution profile portrait, the clipping engine automatically falls back to a branded vector press avatar (`default-reporter-avatar.svg`) with the reporter's initials in Devanagari, ensuring that clipping generation never crashes or outputs broken image placeholders.

---

## 3. Files Created & Modified

| File Path | Action | Description |
|:---|:---:|:---|
| `src/screens/ReporterDeskScreen.tsx` | Modified | Added beat news filter, clipping generator modal, and status tracker |
| `src/services/graphicRenderer.ts` | Modified | Added `renderReporterClipping`, 4:5 canvas layout math, and Devanagari headline wrapping |
| `tests/backend-epaper-management.test.js` | Modified | Added Tier 1 (`T1.6.1`, `T1.6.2`) and Tier 2 (`T2.6.4`) reporter clipping tests |

---

## 4. Testing & Verification Evidence

Step 7 functionality is verified in `tests/backend-epaper-management.test.js`:

```
▶ Tier 1: Feature Coverage (Step 7: Reporter Workspace & Clippings)
  ✔ T1.6.1: Filter reporter desk view to assigned district and beat (0.38ms)
  ✔ T1.6.2: Generate personalized 4:5 article clipping with reporter photo and byline (1.03ms)
▶ Tier 2: Boundary & Corner Cases (Step 7: Reporter Workspace Boundaries)
  ✔ T2.6.4: Missing reporter profile photo falls back to default branded avatar icon (0.31ms)
```

**Verification Result:** All tests passed. Execution duration: ~1.7 ms. Clean exit code 0.

---

## 5. Security & Invariant Compliance
- **Beat & District Boundaries**: Stringers can only query and generate clippings for articles filed under their assigned beat or district territory.
- **Accreditation Badge Lock**: The badge ID (`reporterBadgeId`) is injected server-side from the authenticated user profile; reporters cannot spoof other journalists' bylines or credentials.
