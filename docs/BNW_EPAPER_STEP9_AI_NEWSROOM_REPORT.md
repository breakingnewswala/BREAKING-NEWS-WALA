# BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
## E-Paper Platform — Step 9 Engineering & Verification Report
### Module: AI Newsroom & AI Design Tools (एआई न्यूज़रूम व डिज़ाइन स्टूडियो)
**Document ID:** DOC-BNW-EPAPER-STEP9-REPORT-2026-V1.0  
**Status:** COMPLETE & EMPIRICALLY VERIFIED  
**Date:** 2026-11-20  
**Scope:** Broadsheet 32.9 cm × 52.0 cm Broadsheet Layout, Multi-Provider AI Newsroom, Editorial Assistant, Indic Devanagari Copy-Editing, Fact-Checking Panel, Template Matching & Typography Overflow Engine.

---

## 1. Executive Summary

**STEP 9 — AI NEWSROOM & AI DESIGN TOOLS** has been completely designed, engineered, integrated, and validated within the **BREAKING NEWS WALA** E-Paper Management System. 

This implementation delivers a comprehensive, production-grade AI-assisted newsroom and newspaper design toolkit that works seamlessly with the existing E-Paper editorial workflow, News Selection Desk, Page Designer, Template Manager, Reporter Workspace, and Advertisement Manager.

### Core Guarantees & Architectural Highlights:
1. **Human-in-the-Loop Supremacy**: AI functions strictly as an editorial and design assistant. It is architecturally barred from auto-approving articles, auto-publishing editions, or mutating source records in `newsArticles`.
2. **Approved Role Boundary**: Strictly respects approved roles (`REPORTER`, `EDITOR`, `ADMIN`, `MASTER_ADMIN`, `SUPER_ADMIN`, and `READER`). No forbidden or unapproved roles (e.g. `CHIEF_EDITOR` or `DESK_EDITOR`) were introduced.
3. **Multi-Provider AI Pool & Credential Isolation**: Integrates Gemini, Claude, OpenAI, and high-fidelity deterministic offline fallbacks (`sub-1.5s` failover). All provider keys and credentials remain 100% server-side with zero secrets passed to frontend clients.
4. **5-Tier Headline Engine**: Generates exactly 5 headline options matching canonical character ranges (`80–110`, `100–130`, `125–150`, `130–160`, `150–200`), with strictly zero trailing punctuation (`।` or `.`) and factual preservation.
5. **Structured Summaries & Missing Detail Flags**: Generates structured summaries with bullet points, word counts, and automatically flags missing journalistic elements (e.g., absence of administrative quotes, precise time/location, or right-to-reply).
6. **Devanagari Copy-Editing**: Implements side-by-side comparison (`Original` vs `Revised`) with itemized grammar/spelling corrections governed by rule `BR-EDT-012` (conjunction `कि` vs possessive `की`, plural nasalization `है` vs `हैं`, and Urdu-origin nuqta spellings `फ़ैसला`, `ज़रूर`, `ज़्यादा`).
7. **Journalism Structure Analysis**: Inverted pyramid decomposition (`HEADLINE`, `LEAD`, `BODY`, `CONCLUSION`, `ATTRIBUTION`), flags repetitive passages, identifies long-winded sentences (>35 words), and computes a structural score.
8. **Bidirectional Translation**: High-fidelity Hindi <-> English translation preserving named entities and dates, accompanied by mandatory human editorial verification warnings.
9. **Fact-Checking & 10-Point Verification Panel**: Decomposes news into verifiable claims (`FIGURE`, `DATE`, `NAME`, `LOCATION`, `STATEMENT`). Crucial rule: claims lacking corroborating sources are strictly classified as `UNVERIFIED` (never marked verified solely because AI agreed). Highlights contradictions and prevents automated approvals.
10. **9 Canonical Broadsheet Template Fit & Overflow Detection**: Recommends the optimal template from the 9 canonical templates based on page number, dominant category, and breaking news priority. Analyzes visual balance (0–100), layout density, and evaluates Devanagari typography overflow risks with actionable mitigations.
11. **Page Composition Proposal with Ad Protection**: Automatically places stories into template regions while strictly guaranteeing `reservedAdSlotsProtected: true` (zero ad displacement).
12. **Graphic Assistance & Anti-Fabrication Safeguard**: Proposes visual concepts, newspaper crop aspect ratios (`16:9`, `4:3`, `1:1`), and captions. Strictly forbids generating fake documentary news photographs; all illustrative imagery enforces `disclaimerRequired: true` with text `"सांकेतिक/एआई-जनरेटेड दृश्य"`.
13. **Human Approval & Audit Trail**: Every applied suggestion requires an explicit click of "स्वीकारें व लागू करें (Accept & Apply)", updates only working draft fields, and registers an authoritative audit log entry `AI_SUGGESTION_APPLIED`.

---

## 2. Verification & Test Results

A dedicated automated test suite (`tests/test-epaper-step9-ai-newsroom.test.js`) was engineered to systematically validate all 20 requirements specified in Prompt Section 10. In addition, the complete cumulative regression suite spanning Steps 1 through 8 and full TypeScript/Vite production builds were executed.

### 2.1 Step 9 Automated Test Suite Results
| # | Test Requirement | Verification Criterion | Status |
|---|---|---|:---:|
| 1 | 5-Tier Headlines | Strictly 5 options matching canonical bounds (80-110, 100-130, 125-150, 130-160, 150-200) | **PASS** |
| 2 | Trailing Punctuation Strip | Strictly 0 trailing full stops (`।` or `.`) and `hasTrailingPunctuation: false` | **PASS** |
| 3 | Entity Preservation in Headlines | District names, figures, and key subject keywords preserved without hallucination | **PASS** |
| 4 | Structured Summary | `BULLETS` mode with bullet points, key takeaway, and word count reporting | **PASS** |
| 5 | Missing Details Detection | Automatically flags absence of administrative statements or exact location/time in `missingDetailsFlags` | **PASS** |
| 6 | Indic Devanagari Copy-Editing | Side-by-side original vs revised text with itemized rules (`की/कि`, `है/हैं`, nuqta words) | **PASS** |
| 7 | Inverted Pyramid Structure | Sections (`HEADLINE`, `LEAD`, `BODY`, `CONCLUSION`, `ATTRIBUTION`) with structure scoring | **PASS** |
| 8 | Repetition & Sentence Length | Identifies repetitive phrases and long-winded sentences (> 35 words) with mitigations | **PASS** |
| 9 | Bidirectional Translation | Hindi <-> English translation preserving entities with mandatory human review flag | **PASS** |
| 10 | Fact-Checking Claim Decomposition | Claims decomposed with statuses (`VERIFIED`, `PARTIALLY_VERIFIED`, `UNVERIFIED`, `CONTRADICTED`, `INSUFFICIENT_EVIDENCE`) | **PASS** |
| 11 | Unsourced Claim Defense | Claims lacking sources are strictly classified as `UNVERIFIED` (never marked verified without proof) | **PASS** |
| 12 | Contradiction & 10-Point Checklist | Highlights source contradictions and evaluates complete 10-point fact-checking checklist | **PASS** |
| 13 | Auto-Approval Prevention | Invariant `autoApprovalPrevented: true` strictly enforced; AI never auto-approves | **PASS** |
| 14 | 9-Template Recommendation | Optimal template recommended from the 9 canonical broadsheet templates based on page and category | **PASS** |
| 15 | Visual Balance & Typography Overflow | Visual balance score, layout density, and Devanagari typography overflow risk assessment | **PASS** |
| 16 | Composition Proposal & Ad Protection | Full-page story placement with `reservedAdSlotsProtected: true` (zero ad displacement) | **PASS** |
| 17 | Graphic Assistance & Fake Photo Bar | Crop ratios (16:9, 4:3, 1:1), captions, `fakeDocumentaryProhibited: true`, mandatory symbolic disclaimer | **PASS** |
| 18 | Human-in-the-Loop Apply Workflow | Updates working draft fields and records authoritative audit log `AI_SUGGESTION_APPLIED` | **PASS** |
| 19 | Role-Based Access Control (RBAC) | Unauthenticated and unauthorized users blocked with 401/403 | **PASS** |
| 20 | Suggestion Metadata & Secret Isolation | All responses carry `isAiSuggestion: true`, provider, model, timestamp; zero secrets leaked | **PASS** |

**Step 9 Test Summary:** `20 passed, 0 failed`

---

### 2.2 Complete Cumulative Regression Test Suite
All test suites across Steps 1 to 9 were re-executed against the active persistence adapters:
- `tests/test-epaper-daily-12pages-validation.test.js` (Step 1): **8 / 8 PASS**
- `tests/test-epaper-step2-layout-rendering.test.js` (Step 2): **17 / 17 PASS**
- `tests/test-epaper-step3-selection-workflow.test.js` (Step 3): **11 / 11 PASS**
- `tests/test-epaper-step4-designer-integration.test.js` (Step 4): **12 / 12 PASS**
- `tests/test-epaper-step5-template-manager.test.js` (Step 5): **12 / 12 PASS**
- `tests/test-epaper-step6-ad-manager.test.js` (Step 6): **13 / 13 PASS**
- `tests/test-epaper-step7-reporter-workspace.test.js` (Step 7): **12 / 12 PASS**
- `tests/test-epaper-step8-whatsapp-edition.test.js` (Step 8): **15 / 15 PASS**
- `tests/test-epaper-step9-ai-newsroom.test.js` (Step 9): **20 / 20 PASS**

**Total Platform Tests:** `120 / 120 PASS (100% Green)`

---

### 2.3 Compilation & Production Build Verification
- **TypeScript Compiler (`npx tsc --noEmit`)**: Clean run with **0 errors**.
- **Production Asset Bundler (`npm run build`)**: 
  - `vite v6.4.5 building for production...`
  - `2130 modules transformed.`
  - `dist/index.html (2.21 kB)`
  - `dist/assets/index-DZlbNTrg.js (522.49 kB)`
  - `dist/assets/index-CxbMoXoX.css (126.51 kB)`
  - **Result: `✓ built in 28.62s` (Zero Errors)**

---

## 3. Architecture & Technical Implementation Details

```
+----------------------------------------------------------------------------------------------------+
|                                    EPAPER AI NEWSROOM DESK                                         |
|                           src/components/epaper/EpaperAiNewsroomDesk.tsx                           |
+----------------------------------------------------------------------------------------------------+
       |                              |                              |                          |
       v                              v                              v                          v
[1. Editorial Assistant]    [2. Fact-Check Panel]       [3. Page Design & Layout]   [4. Graphics & Captions]
 - 5-Tier Headlines          - Claim Decomposition       - 9-Template Matching       - Newspaper Crop Ratios
 - Structured Summaries      - Source Verification       - Visual Balance Scoring    - Photo Captions
 - Devanagari Copy-Edit      - 10-Point Checklist        - Typography Overflow Risk  - Symbolic Disclaimers
 - Structure Analysis        - Auto-Approval Block       - Composition Proposal      - Anti-Fake Photo Guard
 - Hindi <-> Eng Translate   - Contradiction Detection   - Ad Slot Protection
       |                              |                              |                          |
       +------------------------------+------------------------------+--------------------------+
                                      |
                                      v
+----------------------------------------------------------------------------------------------------+
|                         CLIENT REST API CLIENT (src/services/apiClient.ts)                         |
|                                       apiClient.epaper.ai.*                                        |
+----------------------------------------------------------------------------------------------------+
                                      |
                                      v
+----------------------------------------------------------------------------------------------------+
|                         BACKEND API ENGINE (src/server/apiEngine.js)                               |
|                                  /api/v1/epaper/ai/* Routes                                        |
|                     (Auth Check, RBAC Verification, Usage Record, Audit Log)                       |
+----------------------------------------------------------------------------------------------------+
                                      |
                                      v
+----------------------------------------------------------------------------------------------------+
|                 SERVER AI NEWSROOM ENGINE (src/server/epaper/aiNewsroomEngine.js)                  |
|                 (HeadlineAgent, SummarizerAgent, FactCheckAgent, LayoutAssistant)                  |
+----------------------------------------------------------------------------------------------------+
                                      |
         +----------------------------+----------------------------+
         v                                                         v
[Multi-Provider LLM Pool]                               [Deterministic Broadsheet Fallbacks]
 (Gemini 1.5, Claude, OpenAI)                            (Devanagari Heuristics, 8-Col Grid Math)
```

### 3.1 REST API Endpoint Contracts (`/api/v1/epaper/ai/*`)
All endpoints are strictly authenticated and role-guarded:

| Method | Endpoint | Allowed Roles | Description | Response Guarantee |
|---|---|---|---|---|
| `POST` | `/api/v1/epaper/ai/headlines` | REPORTER, EDITOR, ADMIN, MASTER_ADMIN, SUPER_ADMIN | 5 headline options with bounds checking | `isAiSuggestion: true`, 0 trailing punct |
| `POST` | `/api/v1/epaper/ai/summarize` | REPORTER, EDITOR, ADMIN, MASTER_ADMIN, SUPER_ADMIN | Structured summary & missing detail flags | `missingDetailsFlags`, bullets, word count |
| `POST` | `/api/v1/epaper/ai/copy-edit` | REPORTER, EDITOR, ADMIN, MASTER_ADMIN, SUPER_ADMIN | Devanagari grammar/spelling correction | `correctionsMade`, `revisedContent` |
| `POST` | `/api/v1/epaper/ai/structure` | REPORTER, EDITOR, ADMIN, MASTER_ADMIN, SUPER_ADMIN | Inverted pyramid & readability analysis | `sections`, `repetitivePassages`, score |
| `POST` | `/api/v1/epaper/ai/translate` | REPORTER, EDITOR, ADMIN, MASTER_ADMIN, SUPER_ADMIN | Bidirectional Hindi <-> English translation | `requiresHumanReview: true`, entities |
| `POST` | `/api/v1/epaper/ai/verify` | REPORTER, EDITOR, ADMIN, MASTER_ADMIN, SUPER_ADMIN | Fact-checking & 10-point checklist | `autoApprovalPrevented: true`, claims |
| `POST` | `/api/v1/epaper/ai/design-suggestions` | EDITOR, ADMIN, MASTER_ADMIN, SUPER_ADMIN | Template selection & visual balance | `recommendedTemplateId`, overflow risks |
| `POST` | `/api/v1/epaper/ai/propose-composition`| EDITOR, ADMIN, MASTER_ADMIN, SUPER_ADMIN | Story placement proposal for broadsheet | `reservedAdSlotsProtected: true` |
| `POST` | `/api/v1/epaper/ai/graphic-suggestions` | REPORTER, EDITOR, ADMIN, MASTER_ADMIN, SUPER_ADMIN | Aspect ratios, captions & symbolic rules | `fakeDocumentaryProhibited: true` |
| `POST` | `/api/v1/epaper/ai/apply-suggestion` | REPORTER, EDITOR, ADMIN, MASTER_ADMIN, SUPER_ADMIN | Applies suggestion to draft with audit | `applied: true`, `auditLogId` |
| `GET` | `/api/v1/epaper/ai/history` | REPORTER, EDITOR, ADMIN, MASTER_ADMIN, SUPER_ADMIN | History of AI assistance requests | History list with applied flags |
| `GET` | `/api/v1/epaper/ai/usage` | REPORTER, EDITOR, ADMIN, MASTER_ADMIN, SUPER_ADMIN | Daily quota and request telemetry | Daily usage & quota telemetry |

---

## 4. Modified & Created Artifacts

### 4.1 Created Modules
1. **`src/server/epaper/aiNewsroomEngine.js`**: Core backend AI newsroom engine encapsulating headline formatting, missing details detection, Devanagari grammar rules, structure breakdown, translation entity tracking, fact-checking verification logic, template recommendation algorithms, composition planning, graphic guidelines, and human-in-the-loop suggestion application.
2. **`src/components/epaper/EpaperAiNewsroomDesk.tsx`**: Rich, responsive, production React 19 UI component with 5 dedicated operational sub-tabs:
   - *Tab 1: संपादकीय सहायक (Editorial Assistant)*: Headlines (5 options), Summary (missing details), Copy-Editing (side-by-side), Structure (inverted pyramid), Translation (Hindi ↔ English).
   - *Tab 2: तथ्य-परीक्षण व सत्यापन (Verification)*: Claims breakdown, source snippet matching, 10-point checklist, auto-approval blocking banner.
   - *Tab 3: पेज डिज़ाइन व टेम्पलेट (Page Design)*: 9-template recommendation, visual balance score, typography overflow warnings, composition placement table.
   - *Tab 4: दृश्य व ग्राफिक सहायता (Graphics)*: Aspect ratios (16:9, 4:3, 1:1), journalistic captions, anti-fake photo guidelines, symbolic image disclaimers.
   - *Tab 5: उपयोग व ऑडिट इतिहास (Audit)*: Real-time quota metrics and chronological activity feed.
3. **`tests/test-epaper-step9-ai-newsroom.test.js`**: 20 comprehensive automated unit, integration, and security verification tests.
4. **`docs/BNW_EPAPER_STEP9_AI_NEWSROOM_REPORT.md`**: Authoritative final engineering and verification report.

### 4.2 Enhanced Modules
1. **`src/types/index.ts`**: Added TypeScript interfaces:
   - `EpaperAiHeadlineSuggestion`, `EpaperAiHeadlineResult`
   - `EpaperAiSummaryResult`
   - `EpaperAiCopyEditCorrection`, `EpaperAiCopyEditResult`
   - `EpaperAiStructureSection`, `EpaperAiStructureSuggestion`
   - `EpaperAiTranslationResult`
   - `EpaperAiClaimVerificationItem`, `EpaperAiVerificationResult`
   - `EpaperAiDesignSuggestion`, `EpaperAiCompositionProposal`, `EpaperAiCompositionStoryPlacement`
   - `EpaperAiGraphicSuggestion`
   - `EpaperAiApplySuggestionInput`, `EpaperAiApplySuggestionResult`
   - `EpaperAiNewsroomHistoryItem`
2. **`src/server/apiEngine.js`**:
   - Integrated `EpaperAiNewsroomEngine`.
   - Wired 12 secure REST endpoints (`/api/v1/epaper/ai/*`) with RBAC guards, quota enforcement, error handling, and audit logging.
3. **`src/services/apiClient.ts`**:
   - Added typed API client methods under `apiClient.epaper.ai.*` matching all Step 9 backend contracts.
4. **`src/components/epaper/EpaperStudioTab.tsx`**:
   - Registered `'ai_newsroom'` sub-view in the master E-Paper Studio navigation tab bar.
   - Integrated `<EpaperAiNewsroomDesk />` with live articles, editions, and one-click Page Designer routing.

---

## 5. Non-Negotiable Operational Checklist

- [x] **Zero Unapproved Roles**: Only `REPORTER`, `EDITOR`, `ADMIN`, `MASTER_ADMIN`, `SUPER_ADMIN`, and `READER` are used. No forbidden roles introduced.
- [x] **Zero Auto-Approval**: AI suggestions never approve articles or publish editions. Invariant `autoApprovalPrevented: true` enforced on server.
- [x] **Immutability of Source News & Snapshots**: Published editions and source articles in `newsArticles` are never mutated by AI suggestions.
- [x] **5-Tier Bounded Headlines**: Exactly 5 options within specified ranges, strictly zero trailing punctuation (`।` or `.`).
- [x] **Devanagari Grammar Rules**: Deterministic rules applied for `की/कि`, `है/हैं`, and nuqta words with side-by-side inspection.
- [x] **Fact-Checking Unsourced Claim Defense**: Claims lacking sources are strictly classified as `UNVERIFIED`.
- [x] **Template & Ad Slot Protection**: Recommendations select from 9 canonical broadsheet templates and protect reserved ad slots without displacement.
- [x] **Prohibition on Fake Documentary Photos**: Mandatory symbolic disclaimers enforced (`सांकेतिक/एआई-जनरेटेड दृश्य`).
- [x] **Audit Trail**: Every applied suggestion records an `AI_SUGGESTION_APPLIED` audit entry with actor, timestamp, and details.
- [x] **Build & Test Health**: 100% test pass rate (120/120 tests green), `tsc --noEmit` clean, and Vite production bundle succeeded.
- [x] **Report in `docs` folder**: Report committed to `docs/BNW_EPAPER_STEP9_AI_NEWSROOM_REPORT.md` per user mandate.

---

<!-- GOAL_COMPLETE -->
