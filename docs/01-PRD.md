# Product Requirements Document (PRD)
## Project: BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
**Tagline:** भारत के जिलों से, आपके दिलों तक  
**Document Identifier:** `docs/01-PRD.md`  
**Version:** 1.0.0 (Baseline Implementation-Ready)  
**Status:** Approved for Technical Architecture & Planning  
**Classification:** Internal Confidential / Product Architecture Blueprint  
**Primary Language:** English (Product specifications, schemas, workflows) with Hindi UI terminology and vernacular taxonomies  

---

## 1. Document Information

| Attribute | Specification |
| :--- | :--- |
| **Product Name** | BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला) |
| **Product Code** | BNW-CORE |
| **Document Version** | 1.0.0 |
| **Author / Role** | Senior Product Manager, Principal Business Analyst & Product Documentation Architect |
| **Repository Path** | `docs/01-PRD.md` |
| **Creation Date** | October 30, 2026 |
| **Target Launch** | Phase 1 (Web Ecosystem & Digital Newsroom): Q1 2027<br>Phase 2 (Native Android App - Kotlin): Q2 2027 |
| **Approved UX Reference** | Leading Indian vernacular news portals (e.g., Dainik Bhaskar) for news-feed organization, grid layout, clean typography, and district navigation, while strictly upholding BREAKING NEWS WALA's proprietary brand identity, visual style, and color palette. |
| **Branding Identity** | Yellow, Red, Dark Charcoal, White; Globe motif with Hindi typography: "ब्रेकिंग न्यूज़ वाला" (Asset: `/public/assets/aistudio/LOGO_88407b32.png`) |

---

## 2. Executive Summary

**BREAKING NEWS WALA** is a next-generation vernacular digital news publishing and newsroom management ecosystem engineered to bridge hyper-local grassroots journalism with centralized editorial governance. Operating under the brand motto *"भारत के जिलों से, आपके दिलों तक"*, the platform unifies district-level, state, national, and international reporting across a high-performance Public News Portal, a dedicated Reporter Web Newsroom, an Admin Central Control Panel, an AI Newsroom Engine, a Graphics Studio, and a Video Production Studio.

The platform is designed with an **API-First, Single-Backend, Single-Database** cross-platform strategy. Phase 1 delivers a responsive web portal, reporter command station, and admin newsroom. Phase 2 introduces a fully native Android Application built with Kotlin and native Android SDKs, without code duplication or secondary backends.

The platform eliminates the bottlenecks of conventional digital desks through a hybrid intelligence model: AI agents empower local stringers and editorial staff to convert raw field dispatches, RSS feeds, and authorized public URLs into publication-grade multimedia journalism while enforcing rigorous editorial reviews, role-based access control, trusted-reporter direct-publishing tiers, and complete audit accountability.

---

## 3. Product Vision

To become India's most trusted, hyper-responsive, and technologically advanced vernacular digital news ecosystem, democratizing district-level news reporting by providing ground reporters with institutional-grade AI editorial tools while guaranteeing editorial integrity, speed, and immersive multi-format journalism for millions of readers across India.

---

## 4. Product Objectives

1. **Hyper-Local Journalism at Scale:** Provide an agile digital workspace for hundreds of field reporters across Indian districts and cities (beginning with Madhya Pradesh and expanding nationally) with granular geo-tagging.
2. **Accelerated Editorial Turnaround:** Reduce news turnaround time from incident to publication by 65% through raw-script-to-news AI structuring and automated headline, summary, and metadata synthesis.
3. **Ironclad Editorial Governance:** Maintain 100% centralized editorial oversight through two-tier verification, with direct publishing privileges granted strictly to trusted reporters and logged immutably.
4. **Unified Cross-Platform Core:** Implement a single backend and unified database schema that powers both the responsive web experience (Phase 1) and native Kotlin Android app (Phase 2) via identical API contracts.
5. **Integrated Creative Studios:** Eliminate third-party design friction by offering an embedded Graphics Studio (custom templated news cards) and Video Studio (scripts to video clips with voiceovers and subtitles).
6. **Resilient AI Operations:** Deliver non-stop AI workflows through an automated multi-provider AI API Pool with intelligent load balancing, quota tracking, latency monitoring, and zero frontend key exposure.
7. **Monetization & Engagement Viability:** Provide flexible programmatic and direct banner placements, sponsored content labels, and an extensible coin/reward gamification framework.

---

## 5. Target Audience

1. **Vernacular Public Readers (Consumers):**
   - Hindi-speaking digital audience seeking breaking news, district updates, viral stories, governance updates, and multimedia news (videos, reels, explainers) on smartphones and desktop browsers.
   - Users in tier-2, tier-3, and rural districts needing fast-loading, low-bandwidth-friendly news without cognitive clutter.
2. **Grassroots Field Reporters & Stringers:**
   - District, tehsil, and city-based correspondents gathering on-the-ground news, local crime, political rallies, weather advisories, and civic developments who need an intuitive mobile-friendly input interface.
3. **Central Newsroom Editors & Sub-Editors:**
   - Desk journalists curating national/international wires, refining field reports, validating facts, synthesizing RSS streams, and pushing breaking news tickers.
4. **Platform Administrators & Media Executives:**
   - System administrators, managing editors, and ad operations managers controlling user access, reporter credentials, monetization campaigns, SEO configurations, and system stability.

---

## 6. User Personas

### Persona 1: Rajesh Sharma (Public Reader - Citizen)
- **Age:** 38 | **Location:** Niwari / Bhopal, Madhya Pradesh | **Device:** Mid-range Android smartphone (4G/5G)
- **Behavior:** Checks local news first thing in the morning and during commutes. Values district-specific updates (mandi prices, local administration notices, road accidents).
- **Pain Point:** National media ignores local district news; regional websites are slow, bloated with popups, and hard to navigate.
- **Goals:** Fast newsfeed, clean Hindi typography, one-click WhatsApp sharing, instant breaking notifications.

### Persona 2: Sunita Verma (Field Reporter - District Correspondent)
- **Age:** 29 | **Location:** Gwalior, Madhya Pradesh | **Device:** Android mobile & budget laptop
- **Behavior:** Covers district courts, collectorate briefings, and field incidents. Often files raw audio transcripts or rough bullet-point notes under time pressure.
- **Pain Point:** Lack of graphic design skills to create social media cards; complex CMS portals that crash on mobile browsers; delayed editorial response from headquarters.
- **Goals:** Quick voice/text script submission, AI-assisted headline formatting, instant template-based graphic card creation, clear status tracking of submitted articles.

### Persona 3: Vikramaditya Rathore (Chief Editor / Platform Admin)
- **Age:** 45 | **Location:** Central Newsroom, Bhopal | **Device:** High-performance dual-monitor workstation
- **Behavior:** Monitors national wires, authorized RSS feeds, reporter queues, breaking developments, and real-time portal traffic.
- **Pain Point:** Risk of fake news, defamatory content, or copyright infringement from unvetted field dispatches or unverified external sources.
- **Goals:** Single-dashboard oversight, one-click approve/reject/request-revision, granular reporter district assignments, dynamic category reordering, and automated AI API fallback.

---

## 7. Product Scope

### In-Scope (Phase 1 & Phase 2 Roadmap)
- Public News Website (Responsive Web SPA/SSR-ready architecture).
- Native Android Mobile App (Phase 2 - Kotlin, Jetpack Compose / native UI components).
- Unified Backend & Shared Relational/Document Database with unified REST/JSON APIs.
- Reporter Web Application & Mobile-Responsive Dashboard.
- Admin Central Newsroom Control Panel.
- Two Segregated News Publishing Workflows (Admin RSS/URL Desk & Reporter Script/Manual Desk).
- Reporter Graphics Studio (Raw script to news card graphic; assigned templates only).
- Admin Graphics Studio (URL/RSS/News to graphic; template builder & reporter template provisioning).
- Video Studio (Script-to-video, clip/image sequencing, voiceover/subtitles, news branding).
- Dynamic Category & Location Hierarchies (21 initial approved categories; state/district/city taxonomy).
- Multi-tier Notification System (Header ticker, breaking popups, web push, native FCM push).
- AI API Pool Management (Multi-key, multi-provider quota tracking, health probes, failover).
- SEO Engine (SSR/Metadata, NewsArticle JSON-LD, XML Sitemaps, Open Graph, Google News readiness).
- Monetization Framework (Configurable banner slots, sponsored news labeling, preliminary coin/reward ledger).
- Security & Editorial Governance (RBAC, audit logging, direct-publishing control for trusted reporters).

---

## 8. Out of Scope

- **Desktop Operating System Native Applications:** No macOS or Windows native software; desktop usage is served via modern web browsers.
- **iOS Native Application:** iOS native app development is deferred to post-Phase 2 roadmap evaluations.
- **Reporters URL-to-Graphic / URL-to-News:** Reporters are strictly prohibited from using URL scraping or external URL generation to protect intellectual property and brand accountability.
- **Automated Unsupervised AI Publishing:** AI will never publish directly to the public website without human authorization (Admin or authorized Trusted Reporter).
- **In-App Payment Gateways for Real Money Payouts:** Phase 1 and Phase 2 will not process cash withdrawals for reward coins. Coins serve solely as engagement units until legal, taxation, and financial compliance frameworks are approved.
- **Full TV Broadcast Automation:** The platform does not interface with SDI/NDI television broadcast switchers.

---

## 9. Platforms and Product Modules

```
+----------------------------------------------------------------------------------------------------+
|                                    BREAKING NEWS WALA ECOSYSTEM                                    |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|   +----------------------------+   +-----------------------------+   +-------------------------+   |
|   |    PUBLIC NEWS WEBSITE     |   |    NATIVE ANDROID APP       |   |   REPORTER WEB PORTAL   |   |
|   |  - Responsive Web (React)  |   |  - Phase 2 (Kotlin/SDK)     |   |  - Mobile & Desktop Web |   |
|   |  - Hindi UI & Feed UX      |   |  - Native Push (FCM)        |   |  - Raw Script & AI Desk |   |
|   |  - Live Ticker & Videos    |   |  - Deep Links & Offline     |   |  - Graphics Studio      |   |
|   +-------------+--------------+   +--------------+--------------+   +------------+------------+   |
|                 |                                 |                               |                |
|                 +---------------------------------+-------------------------------+                |
|                                                   |                                                |
|                                                   v                                                |
|                            +----------------------------------------------+                        |
|                            |         UNIFIED API GATEWAY / BACKEND        |                        |
|                            |  - Auth, RBAC & Session Management           |                        |
|                            |  - News Engine, Workflows & Audit Logs       |                        |
|                            |  - AI API Pool & Provider Failover           |                        |
|                            |  - Media Processing (Graphics & Video)       |                        |
|                            |  - Notification & Ticker Dispatcher          |                        |
|                            +----------------------+-----------------------+                        |
|                                                   |                                                |
|                 +---------------------------------+-------------------------------+                |
|                 |                                 |                               |                |
|   +-------------v--------------+   +--------------v--------------+   +------------v------------+   |
|   |     ADMIN CONTROL PANEL    |   |     CENTRAL DIGITAL DESK    |   |     SHARED DATABASE     |   |
|   |  - User & Reporter Mgmt    |   |  - Review & Approval Queue  |   |  - Single Source of     |   |
|   |  - District Allocation     |   |  - RSS / URL News Ingestion |   |    Truth for All Data   |   |
|   |  - API Pool & Ad Ops       |   |  - Breaking News Ticker     |   |  - Structured Relational|   |
|   |  - Studio Template Config  |   |  - Multi-District Publishing|   |    & Media Assets Store |   |
|   +----------------------------+   +-----------------------------+   +-------------------------+   |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

### Module Breakdown
1. **Public Web Portal:** High-speed client experience displaying live tickers, breaking alerts, categorized feeds, video reels, and article readers.
2. **Native Android Application (Phase 2):** Kotlin-based client with hardware acceleration, background push notifications, native media caching, and district bookmarking.
3. **Reporter Station:** Authenticated web portal featuring a simplified dispatch dashboard, voice/text raw script input, AI rewrite assist, image uploader, and template-based Graphics Studio.
4. **Admin Central Control Panel:** Comprehensive command center for user access, role administration, news approval queues, dynamic category management, template designers, and monetization.
5. **AI Newsroom Engine:** Micro-service orchestrator managing prompt templates, article synthesis, metadata generation, and multi-key API load balancing.
6. **Graphics Studio Engine:** Dynamic canvas rendering engine supporting custom template frames, reporter personalization, text auto-scaling, and export pipelines.
7. **Video Studio Engine:** Timeline sequencer combining script narration, voice synthesis (TTS/audio upload), background music, subtitles, and branded overlays.

---

## 10. User Roles and Permissions

The platform enforces a strict, hierarchical **Role-Based Access Control (RBAC)** model.

| Feature / Action | Public User | Standard Reporter | Trusted Reporter | Central Sub-Editor | Platform Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Browse Published News** | Yes | Yes | Yes | Yes | Yes |
| **Search, Bookmark & Share** | Yes | Yes | Yes | Yes | Yes |
| **Comment / Feedback Submission** | Yes | Yes | Yes | Yes | Yes |
| **Coin Ledger & Referral Dashboard** | Yes | Yes | Yes | Yes | Yes |
| **Access Reporter Dashboard** | No | Yes | Yes | Yes | Yes |
| **Submit Raw Script for AI Structuring** | No | Yes | Yes | Yes | Yes |
| **Draft & Submit News for Review** | No | Yes | Yes | Yes | Yes |
| **Publish News Directly (No Admin Queue)** | No | **No** | **Yes** *(Audited)* | **Yes** | **Yes** |
| **Edit News After Publication** | No | No | Only Own (Audited) | Yes | Yes |
| **Access Reporter Graphics Studio** | No | Yes (Assigned Only) | Yes (Assigned Only)| Yes | Yes |
| **URL-to-Graphic Generation** | **No** | **No** | **No** | Yes | Yes |
| **URL-to-News Extraction** | **No** | **No** | **No** | Yes | Yes |
| **Manage RSS Sources & Feeds** | No | No | No | Yes | Yes |
| **Assign Reporter Districts & Cities** | No | No | No | No | Yes |
| **Grant / Revoke Trusted Status** | No | No | No | No | Yes |
| **Create / Modify Graphic Templates** | No | No | No | No | Yes |
| **Manage AI API Pool & Keys** | No | No | No | No | Yes |
| **Configure Advertisements & Banners** | No | No | No | No | Yes |
| **Access System Audit Logs & Health** | No | No | No | No | Yes |

### Trusted Reporter Publishing Governance Rules
1. **Default State:** All newly registered or appointed reporters are assigned the `Standard Reporter` role requiring mandatory Admin review before publication.
2. **Elevation to Trusted Status:** Only a Super Admin can elevate a reporter to `Trusted Reporter` (`is_trusted_publisher: true`).
3. **Scope of Privilege:** A Trusted Reporter can bypass the review queue and immediately publish articles *only* within their officially allocated district(s) and assigned categories.
4. **Instant Revocation:** Admins can suspend or permanently revoke direct-publishing privileges with a single toggle.
5. **Immutable Audit Logging:** Every article published directly by a Trusted Reporter triggers an immediate audit log entry and an alert to the Admin Central Desk for retroactive editorial validation.

---

## 11. Functional Requirements (Categorized Requirement Register)

### 11.1 Public Platform Requirements (PUB)

| ID | Requirement Name | Description | Role | Priority | Acceptance Criteria | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PUB-001** | News Feed Consumption | Public users can view chronologically organized and prioritized news articles across categories. | Public | Must Have | Articles display headline, thumbnail, category badge, timestamp, reading time, and district tag. | NEWS-001 |
| **PUB-002** | Category Navigation | Users can browse all 21 approved categories and their active subcategories via sticky top/bottom navigation. | Public | Must Have | Navigation responds immediately; active category highlights; displays relevant subcategory pills. | CAT-001 |
| **PUB-003** | District & City Switcher | Users can set their default state, district, and city to receive localized news feeds (e.g., MP -> Niwari). | Public | Must Have | Selection persists in local storage/user profile; feed filters automatically to chosen district. | LOC-001 |
| **PUB-004** | Full Article Reader | Dedicated reading experience with responsive Hindi typography, image galleries, audio/video embeds, and breadcrumbs. | Public | Must Have | Displays verified reporter attribution, publication/update timestamp, full story, tags, and related news. | NEWS-005 |
| **PUB-005** | Video & Reels Stream | Dedicated vertical and horizontal feed for video news, news shorts, and explainer clips. | Public | Must Have | Smooth video playback, mute/unmute toggle, auto-pause on scroll, full-screen orientation. | VID-004 |
| **PUB-006** | Real-Time News Search | Full-text search with instant auto-suggestions supporting Hindi keywords, categories, and district names. | Public | Must Have | Search returns matches in < 500ms; highlights search terms; filters by date, category, and location. | NEWS-001 |
| **PUB-007** | Social Share & Deep Linking | One-click sharing to WhatsApp, Facebook, Telegram, X (Twitter), and clipboard copy with rich previews. | Public | Must Have | Shared URL includes canonical slug, dynamic OG tags, thumbnail image, and proper tracking parameters. | SEO-002 |
| **PUB-008** | Bookmarks & Read Later | Registered and guest users can save articles to a personal "Saved News" (सेव की गई खबरें) library. | Public | Should Have | Synced across devices for logged-in users; saved locally for anonymous visitors. | AUTH-001 |
| **PUB-009** | Breaking News Modal | Urgent breaking alerts appear as an unobtrusive, dismissible modal or slide-up sheet on active sessions. | Public | Must Have | Fires only when Admin designates priority level `CRITICAL_BREAKING`; does not loop or harass. | NOT-002 |
| **PUB-010** | Error Report & Feedback | Users can report factual errors, typos, or inappropriate media on any article page. | Public | Should Have | Form captures article ID, user comments, timestamp, and routes to Admin editorial inbox. | ADM-005 |
| **PUB-011** | Low-Bandwidth Mode | Lightweight rendering mode that disables auto-play videos and compresses images for 2G/3G connections. | Public | Should Have | Page loads under 2 seconds on slow networks; manual toggle available in footer/settings. | NFR-001 |
| **PUB-012** | Reward Coins Dashboard | Public users can view accumulated coins earned through reading streaks and referrals. | Public | Could Have | Displays balance, ledger of earned coins, referral code, and placeholder rewards catalog. | MON-003 |

---

### 11.2 Reporter Dashboard Requirements (REP)

| ID | Requirement Name | Description | Role | Priority | Acceptance Criteria | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **REP-001** | Reporter Secure Authentication | Mobile/email login with password or OTP; profile displays assigned district, city, and publishing status. | Reporter | Must Have | Prevents unauthorized login; enforces session expiry; shows active badge (Standard / Trusted). | AUTH-001 |
| **REP-002** | Raw Script to News AI Engine | Reporters can paste raw notes, bullet points, or rough text and trigger AI news formatting. | Reporter | Must Have | AI generates standardized Hindi headline, subheadline, 3-4 paragraph body, and suggested tags. | AI-001 |
| **REP-003** | Manual News Editor | Rich-text editor allowing manual authoring and refinement of AI-generated drafts. | Reporter | Must Have | Supports formatting (bold, quotes, lists), word count, reading time calculator, and spell-check cues. | REP-002 |
| **REP-004** | Media Attachment & Crop | Reporters can upload up to 10 high-resolution photos and 1 video clip per article with aspect cropping. | Reporter | Must Have | Supports 16:9, 1:1, 4:3 ratios; image compression on client before upload; caption and credit fields. | MEDIA-001 |
| **REP-005** | Category & Location Lock | Reporters must select category and can only tag articles to Admin-allocated districts and cities. | Reporter | Must Have | Dropdown restricts selection strictly to authorized jurisdictions; prevents cross-district filing. | ADM-003 |
| **REP-006** | Editorial Workflow Submission | Submit button transitions draft to `PENDING_REVIEW` (Standard) or `PUBLISHED` (Trusted). | Reporter | Must Have | Displays clear confirmation modal; validates all required fields before submission. | NEWS-002 |
| **REP-007** | Article Status Tracker | Visual dashboard tracking article stages: `Draft`, `Pending`, `Under Review`, `Approved`, `Published`, `Revision Requested`, `Rejected`. | Reporter | Must Have | Real-time status badges; filters by status and date range; search by headline. | NEWS-003 |
| **REP-008** | Revision & Feedback Loop | View editorial comments left by Admin/Editors and resubmit corrected articles. | Reporter | Must Have | Displays editorial note prominently; highlights requested changes; allows re-submission. | ADM-005 |
| **REP-009** | Reporter Graphics Studio | Generate branded news cards using raw scripts and Admin-assigned frames. | Reporter | Must Have | No URL-to-graphic tool; allows text placement, photo upload, and instant image download. | GFX-001 |
| **REP-010** | Reporter Performance Metrics | Analytics screen showing total filed stories, approval rate, total article views, and top stories. | Reporter | Should Have | Data refreshed daily; shows views, shares, and editorial turnaround stats. | ANA-002 |
| **REP-011** | Editorial Assignments Desk | Reporters receive investigative assignments and coverage requests dispatched by Admin. | Reporter | Should Have | List of active assignments with deadlines, priority level, notes, and one-click "Accept & File". | ADM-006 |

---

### 11.3 Admin Control Panel & Central Newsroom (ADM)

| ID | Requirement Name | Description | Role | Priority | Acceptance Criteria | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ADM-001** | Newsroom Master Dashboard | Bird's-eye metrics on active readers, breaking stories, pending reviews, reporter count, and API health. | Admin | Must Have | Real-time widgets updating without page reload; alerts on critical pending approvals. | ANA-001 |
| **ADM-002** | User & Reporter Management | Admin can approve new reporter applications, edit profiles, suspend accounts, and view activity logs. | Admin | Must Have | Comprehensive table with search, role filters, district assignment modal, and status toggles. | AUTH-001 |
| **ADM-003** | District & Jurisdiction Allocation | Admin allocates specific states, districts, and cities to reporters. | Admin | Must Have | Changes take effect immediately; prevents reporter from tagging unassigned locations. | LOC-001 |
| **ADM-004** | Trusted Publisher Governance | Admin can grant, modify, suspend, or revoke direct-publishing rights for any reporter. | Admin | Must Have | Action requires confirmation dialog; writes immutable record to system audit logs. | SEC-003 |
| **ADM-005** | Editorial Review Queue | Interface to review incoming stories, edit headlines/body, replace images, approve, reject, or request revisions. | Admin | Must Have | Side-by-side diff view of raw script vs edited article; one-click publish; rejection reason selector. | NEWS-002 |
| **ADM-006** | RSS Feed Ingestion Manager | Add, activate, pause, or remove authorized news wire RSS feeds with auto-polling schedules. | Admin | Must Have | Feed parser fetches stories; deactivates failed feeds; prevents ingestion from removed sources. | NEWS-004 |
| **ADM-007** | URL-to-News Ingestion Desk | Admin can paste an authorized external news URL to automatically extract content and rewrite via AI. | Admin | Must Have | Extracts text, extracts publisher attribution, triggers AI rewrite, retains canonical source record. | AI-002 |
| **ADM-008** | Dynamic Category Controller | Create, edit, reorder, activate, deactivate, or archive categories and subcategories. | Admin | Must Have | Drag-and-drop hierarchy ordering; archiving preserves historical articles without broken links. | CAT-001 |
| **ADM-009** | Live Ticker Controller | Real-time management of breaking news ticker text, speed, priority color, and expiry duration. | Admin | Must Have | Instant broadcast to active web and app clients; automated expiry timer. | NOT-001 |
| **ADM-010** | Admin Graphics Studio | Full graphic card generator supporting URL/RSS inputs, template authoring, and reporter template assignments. | Admin | Must Have | WYSIWYG frame designer; controls layer locks; assigns templates to specific reporters. | GFX-003 |
| **ADM-011** | Video Studio Management | Review, create, and render video shorts, explainers, and headline reels with voiceover and branding. | Admin | Should Have | Template selector, audio waveform preview, subtitle auto-generator, and MP4 export queue. | VID-001 |
| **ADM-012** | AI API Pool Controller | Manage multi-provider API keys (Gemini, etc.), view real-time token quotas, error rates, and failovers. | Admin | Must Have | Add/mask keys; set daily quota ceilings; toggle active/inactive keys; view error log stream. | API-001 |
| **ADM-013** | Ad Ops & Sponsor Manager | Schedule and place banner ads, in-feed ads, and sponsored posts across portal slots. | Admin | Should Have | Start/end date scheduling; image/script ad support; impression and click telemetry. | MON-001 |
| **ADM-014** | SEO & Metadata Center | Edit global SEO defaults, XML sitemap generation triggers, schema configurations, and Google News pings. | Admin | Must Have | Generates valid XML sitemap; validates JSON-LD schemas; manages robots.txt directives. | SEO-001 |
| **ADM-015** | System Audit & Health Monitor | Comprehensive immutable audit log of all logins, publishing events, role changes, and API calls. | Admin | Must Have | Filter logs by actor, action type, IP address, and date range; export logs to CSV. | SEC-003 |

---

## 12. Public Website Requirements

### 12.1 Homepage Architecture & UX Hierarchy
The homepage design is optimized for high-density information discovery and effortless Hindi readability, referencing top digital publications (e.g., Dainik Bhaskar) while incorporating BREAKING NEWS WALA's bold yellow, red, and charcoal brand identity:

1. **Top Super-Bar:**
   - Date and time in Hindi (e.g., *शुक्रवार, 30 अक्टूबर 2026*).
   - District & City Selector dropdown with auto-detection prompt.
   - Quick Links: ई-पेपर (E-Paper placeholder), वीडियो (Videos), ट्रेंडिंग (Trending).
   - User Profile / Login quick toggle.
2. **Main Header & Brand Masthead:**
   - Official Logo: `LOGO_88407b32.png` with tagline *"भारत के जिलों से, आपके दिलों तक"*.
   - Live Search Input with instant search flyout.
   - Social connect icons and notification bell with badge counter.
3. **Live Breaking News Ticker (ब्रेकिंग न्यूज़ टिकर):**
   - High-contrast red/yellow ticker bar positioned directly below the header.
   - Displays flashing "ब्रेकिंग" badge with smooth horizontal ticker animations.
   - Admin-controlled messages with click-to-open article behavior.
4. **Primary Navigation Bar (Sticky):**
   - 21 dynamic categories beginning with: होम, टॉप न्यूज़, ताज़ा खबरें, मध्य प्रदेश, राज्य, देश, विदेश, राजनीति, खेल, मनोरंजन, etc.
   - Overflow dropdown ("अन्य") for responsive screens.
5. **Hero Editorial Section (बड़ी खबरें Grid):**
   - **Lead Story (Main Anchor):** 16:9 high-resolution image, prominent bold headline, summary lead, district tag, time badge.
   - **Secondary Anchors:** 3-column or 4-row cards for major state and national stories.
6. **Hyper-Local District News Block (मेरा शहर / मेरा जिला):**
   - Automatically adapts to user's selected district (e.g., *निवाड़ी समाचार*, *भोपाल हलचल*).
   - Dedicated "जिला बदलें" (Change District) button.
7. **Multimedia Stream (वीडियो और रील्स):**
   - Horizontal swipeable carousel of short vertical video reels (9:16) and standard video reports (16:9).
8. **Categorized Content Grids:**
   - Dedicated modular sections for राजनीति, खेल, मनोरंजन, बिजनेस, धर्म-कर्म, टेक्नोलॉजी.
9. **Footer Architecture:**
   - Full sitemap, editorial code of ethics, grievance redressal officer details (IT Rules 2021 compliance), copyright notices, mobile app download call-to-action, RSS link, and contact details.

### 12.2 Hindi Vernacular Typography & Readability
- Primary typography font stack: System Hindi fonts with fallback to clean, legible Devanagari web fonts (Noto Sans Devanagari / Mukta).
- Strict typographic contrast: Dark charcoal (`#1F2937`) text on pure white (`#FFFFFF`) background; midnight dark mode (`#111827`) with soft off-white text (`#F3F4F6`).
- Zero-clutter reading mode: Generous line height (`1.75`), comfortable paragraph spacing, and scalable font-size toggles (`अ-`, `अ`, `अ+`) inside every article reader.

---

## 13. Android App Requirements (Phase 2 Native Strategy)

```
+--------------------------------------------------------------------------------------------------+
|                     PHASE 2 NATIVE KOTLIN ANDROID APPLICATION ARCHITECTURE                       |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|   +------------------------------------------------------------------------------------------+   |
|   |                              NATIVE PRESENTATION LAYER (KOTLIN)                          |   |
|   |  - Jetpack Compose UI (Material 3 Vernacular Design System)                              |   |
|   |  - Navigation Component (Bottom Navigation: Home, My District, Videos, Shorts, Profile) |   |
|   |  - Custom Devanagari Typography Rendering & Hardware Accelerated Image/Video Viewers     |   |
|   +--------------------------------------------+---------------------------------------------+   |
|                                                |                                                 |
|   +--------------------------------------------v---------------------------------------------+   |
|   |                               NATIVE ANDROID SYSTEM SERVICES                             |   |
|   |  - Firebase Cloud Messaging (FCM) Foreground & Background Push Notification Receiver    |   |
|   |  - WorkManager (Background News Prefetching & Low-Bandwidth Sync)                        |   |
|   |  - Room Local Database (Offline Cache for Bookmarks & Saved News)                        |   |
|   |  - Android Keystore (Biometric Login & Secure JWT Token Storage)                         |   |
|   |  - CameraX & MediaStore API (In-App Camera Capture for Field Reporters)                  |   |
|   +--------------------------------------------+---------------------------------------------+   |
|                                                |                                                 |
|   +--------------------------------------------v---------------------------------------------+   |
|   |                                 SHARED API CLIENT LAYER                                  |   |
|   |  - Retrofit / OkHttp / Ktor Client                                                       |   |
|   |  - Standardized JSON REST Contracts Identical to Web Portal                              |   |
|   |  - Token Refresh Interceptor & Gzip Compression                                          |   |
|   +--------------------------------------------+---------------------------------------------+   |
|                                                |                                                 |
|                                                v                                                 |
|                          HTTPS / WSS TO SHARED BREAKING NEWS WALA BACKEND                        |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### 13.1 Mandatory Cross-Platform Strategy & Native Directives
1. **No WebView Fallback:** The Android application must be developed in pure Kotlin utilizing the official Android SDK and Jetpack Compose. Web wrappers, Cordova/Capacitor, or disguised iframes are strictly disallowed.
2. **Shared Backend & Shared Database:** The Android application connects to the exact same REST/JSON endpoints, database records, and authentication services as the Web platform.
3. **Platform-Neutral API Contracts:** All payload schemas, pagination tokens, error codes, and RBAC rules defined in this document are identical for Web and Android.
4. **Android Lifecycle & Offline Readiness:**
   - Background news prefetching via Android `WorkManager` for seamless offline reading of cached stories.
   - Native image caching via Coil/Glide with automatic cache eviction.
   - Deep-linking via Android App Links (`https://breakingnewswala.com/news/{slug}`) routing directly into the native Article Detail activity.
5. **Native Push Notifications:**
   - Low-latency delivery of breaking news via Firebase Cloud Messaging (FCM).
   - Configurable notification channels: *ब्रेकिंग न्यूज़ (Critical)*, *मेरा जिला (District Updates)*, *मनोरंजन एवं खेल (Entertainment/Sports)*.
   - Rich notifications featuring thumbnail images, headline preview, and direct share action buttons.
6. **Hardware Integration for Field Reporters:**
   - In-app camera and microphone integration with hardware stabilization for real-time photo/video recording by reporters.
   - GPS-assisted location tagging to verify on-the-scene district reporting.

---

## 14. Reporter Dashboard Requirements (रिपोर्टर डैशबोर्ड)

The Reporter Dashboard is an authenticated, responsive command station accessible via desktop and mobile browsers (and integrated into the Phase 2 Android app for field staff).

### 14.1 Dashboard Navigation Sections (Hindi Primary Labels)
1. **डैशबोर्ड (Dashboard Overview):** Summary cards displaying submitted stories count, pending approvals, published count, total views, and latest Admin editorial announcements.
2. **नई खबर (File New Story):** Multi-tab creation station supporting:
   - *त्वरित रॉ स्क्रिप्ट (Quick Raw Script):* Bullet point notes or audio transcription paste with one-click "AI से खबर बनाएं".
   - *विस्तृत मैनुअल खबर (Detailed Manual Story):* Full rich-text composer with headline, subheadline, slug, category, district, and image attachments.
3. **मेरी खबरें (My Filed Stories):** Searchable, filterable list of all stories filed by the reporter, displaying real-time status pills:
   - `ड्राफ्ट (Draft)`
   - `समीक्षा में (Pending Review)`
   - `संशोधन अपेक्षित (Revision Requested)`
   - `स्वीकृत एवं प्रकाशित (Published)`
   - `अस्वीकृत (Rejected)`
4. **ग्राफिक्स स्टूडियो (Reporter Graphics Studio):** Simplified social card generator using assigned frames.
5. **वीडियो स्टूडियो (Reporter Video Studio):** Script sequencing and video draft submissions.
6. **मेरे असाइनमेंट (My Assignments):** Investigative topics, events, and press conferences assigned by central desk editors.
7. **रिपोर्टिंग एवं प्रदर्शन (Analytics & Performance):** Visual charts on monthly article output, reader impressions, and approval ratios.
8. **सूचनाएँ (Notification Center):** Real-time bell alerts for editorial reviews, comments, and breaking news alerts.
9. **प्रोफ़ाइल (Profile & Settings):** Reporter ID card preview, verified district allocation badge, contact details, and password/PIN security.

---

## 15. Admin Control Panel Requirements (एडमिन कंट्रोल पैनल)

The Admin Control Panel is the centralized administrative and operational hub of the BREAKING NEWS WALA enterprise.

### 15.1 Core Subsystems
1. **Newsroom Overview & Live Ops:** Real-time counters of concurrent visitors, stories published today, pending review queue length, and API pool health status.
2. **User & Reporter Roster:**
   - View, approve, reject, or suspend reporter registrations.
   - Manage district/city jurisdictions per reporter.
   - Grant or revoke `Trusted Reporter` direct-publishing permissions.
3. **Central Review & Moderation Desk:**
   - Interactive editorial queue with dual-column view: Reporter Raw Submission vs Final Formatted Article.
   - Editing tools to correct headlines, body copy, and metadata before approving.
   - Rejection dialog with pre-defined and custom editorial feedback reasons (e.g., *अपूर्ण जानकारी*, *तथ्यों की पुष्टि करें*, *फोटो स्पष्ट नहीं है*).
4. **RSS Feeds & Wire Desk:**
   - Add/manage RSS 2.0 and Atom feeds from approved news syndicates.
   - Automated duplicate story detection engine (compares headline similarity and publish timestamps).
5. **AI Newsroom Center:**
   - Configure prompt templates for different article tones (Formal, Breaking, Investigative, Explainer).
   - Test prompts against different models in the active API pool.
6. **Template & Studio Management:**
   - Upload and design SVG/HTML5 canvas frames for Graphics Studio.
   - Assign specific graphic templates to individual reporters or district teams.
7. **Monetization & Ad Network Center:**
   - Define ad slots: `TOP_LEADERBOARD`, `IN_FEED_NATIVE`, `ARTICLE_STICKY_BOTTOM`, `INTERSTITIAL`.
   - Toggle direct advertiser banners vs network scripts.
8. **Security, Audit & System Health:**
   - Immutable audit trail recording every user login, role modification, article approval/deletion, and API failure.
   - Database backup triggers and restore point logs.

---

## 16. Central Digital Newsroom Requirements

The Central Digital Newsroom is the real-time operational engine bridging raw external inputs (RSS feeds, reporter raw scripts, press releases, wire URLs) with final published outputs.

```
+----------------------------------------------------------------------------------------------------+
|                                CENTRAL DIGITAL NEWSROOM PIPELINE                                   |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|    +--------------------+    +--------------------+    +--------------------+    +-------------+   |
|    |  AUTHORIZED RSS    |    |  EXTERNAL NEWS URL |    |  REPORTER RAW      |    |  AGENCY     |   |
|    |  FEEDS (Auto-Sync) |    |  (Admin Input)     |    |  DISPATCH / SCRIPT |    |  PRESS KITS |   |
|    +---------+----------+    +---------+----------+    +---------+----------+    +------+------+   |
|              |                         |                         |                      |          |
|              +-------------------------+-------------------------+----------------------+          |
|                                        |                                                           |
|                                        v                                                           |
|                     +--------------------------------------+                                       |
|                     |     AI INGESTION & STRUCTURING DESK  |                                       |
|                     |  - Headline & Lead Generation        |                                       |
|                     |  - Vernacular Hindi Re-writing       |                                       |
|                     |  - Entity Extraction & Geo-Tagging   |                                       |
|                     |  - Duplicate Story Collision Check   |                                       |
|                     +------------------+-------------------+                                       |
|                                        |                                                           |
|                                        v                                                           |
|                     +--------------------------------------+                                       |
|                     |      CENTRAL EDITORIAL REVIEW DESK   |                                       |
|                     |  - Fact-Checking & Compliance Verification                                  |
|                     |  - Source Attribution & Media Rights Check                                  |
|                     |  - Category, Subcategory & District Assignment                               |
|                     |  - Graphics Studio Branded Card Embedding                                    |
|                     +------------------+-------------------+                                       |
|                                        |                                                           |
|                     +------------------+-------------------+                                       |
|                     |                                      |                                       |
|                     v                                      v                                       |
|     +-------------------------------+      +-------------------------------+                       |
|     |     APPROVED & PUBLISHED      |      |      REVISION REQUESTED       |                       |
|     |  - Instant Cache Purge        |      |  - Returns to Reporter with   |                       |
|     |  - Live Ticker Update         |      |    Editor Comments & Actions  |                       |
|     |  - Web & FCM Push Alert       |      +-------------------------------+                       |
|     +-------------------------------+                                                              |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 17. News Creation and Publishing Workflows

The platform strictly segregates news creation into two independent, audited workflows to protect journalistic integrity, copyright laws, and source attribution.

### 17.1 Workflow 1: Admin RSS / URL Newsroom Desk
*Exclusively accessible to Central Newsroom Admins and Senior Editors.*

```
Step 1: Ingestion
  Admin enters authorized external News URL or selects an imported story from the authorized RSS pool.
      |
Step 2: Source Verification & Duplicate Check
  System cross-checks existing database for matching title hashes or entity overlap.
  Attribution metadata (Source URL, Original Publisher Name, Ingestion Timestamp) is permanently recorded.
      |
Step 3: AI Structuring & Vernacular Synthesis
  Admin prompts AI Newsroom Engine.
  AI synthesizes content into BREAKING NEWS WALA editorial style:
    - Primary Hindi Headline (कैची और सटीक शीर्षक)
    - Subheadline (उप-शीर्षक)
    - Structured 3-part Article Body (मुख्य संदर्भ, मुख्य बिंदु, पृष्ठभूमि)
    - SEO Meta Title & Meta Description
    - Automated Tags, Category & Location recommendations.
      |
Step 4: Media & Thumbnail Curation
  Admin uploads verified high-resolution photograph or generates a branded graphic card in Admin Graphics Studio.
  Images from original sources must have verified licensing or be replaced with licensed editorial assets.
      |
Step 5: Editorial Review & Publishing
  Admin inspects, modifies, verifies factual accuracy, and sets publication status to `PUBLISHED` or `SCHEDULED`.
  Article is instantly broadcast across Web, App, RSS, and Notification channels.
```

### 17.2 Workflow 2: Reporter Manual / AI News Creation Desk
*Dedicated to Field Reporters, Stringers, and District Correspondents.*

```
Step 1: Dispatch Composition
  Reporter opens "नई खबर" and inputs raw notes, mobile speech-to-text notes, or bullet points.
      |
Step 2: AI Assistance (Client-Triggered)
  Reporter clicks "AI से खबर बनाएं".
  AI structures the raw text into standard newsroom Hindi syntax, checks grammar, and suggests headlines.
      |
Step 3: Media Attachment & Jurisdiction Tagging
  Reporter uploads field photographs/videos from mobile gallery or camera.
  Reporter selects Category and chooses District/City strictly from their allocated jurisdiction.
      |
Step 4: Graphics Studio Integration (Optional)
  Reporter selects an Admin-assigned graphic template to create a branded social news card from the story.
      |
Step 5: Status Routing Based on Permissions
  Case A: Standard Reporter
    - Story enters `PENDING_REVIEW` queue in Central Newsroom.
    - Admin reviews, edits, requests revisions, or publishes.
  Case B: Trusted Reporter (Explicitly Authorized)
    - Reporter clicks "सीधे प्रकाशित करें" (Publish Directly).
    - Story transitions to `PUBLISHED` immediately.
    - System dispatches an audit notification to Admin for retrospective oversight.
```

---

## 18. AI Newsroom Requirements (AI)

| ID | Requirement Name | Description | Role | Priority | Acceptance Criteria | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AI-001** | Raw Script Structuring | Converts unstructured Hindi/Hinglish bullet points into a professional, cohesive Hindi news article. | Reporter/Admin | Must Have | Generates clear headline, lead paragraph, body paragraphs, and tags in < 5 seconds. | API-001 |
| **AI-002** | URL Article Synthesis | Analyzes authorized external article text and synthesizes an original, attributed vernacular report. | Admin Only | Must Have | Preserves core facts; writes in platform's Hindi voice; flags missing context; retains source citation. | ADM-007 |
| **AI-003** | Headline & Catchphrase Generator | Generates 5 distinct headline options (e.g., Breaking, Informative, Local Impact, Social/Catchy). | Reporter/Admin | Must Have | Generates Devanagari headlines under 70 characters adhering to journalism ethics (no clickbait slop). | API-001 |
| **AI-004** | Auto-SEO & Meta Generator | Generates search-optimized meta title, meta description (< 160 chars), URL slug, and 5-8 relevant tags. | Reporter/Admin | Must Have | Slugs are Romanized Hindi or clean transliterations; meta description summarizes key news value. | SEO-001 |
| **AI-005** | Fact-Checking & Entity Cues | Flags controversial claims, unverified statistics, or missing attributions for editor inspection. | Admin | Should Have | Highlights names, dates, IPC/BNS legal sections, and unconfirmed casualty claims in an alert box. | AI-001 |
| **AI-006** | Audio-to-Script Transcription | Transcribes field voice notes recorded by reporters directly into editable Devanagari text. | Reporter | Should Have | High accuracy on Hindi regional accents (Bundelkhandi, Malwi, Bagheli, Standard Hindi). | API-001 |

---

## 19. Graphics Studio Requirements (GFX)

The Graphics Studio empowers users to generate professional, social-media-ready news cards without external graphic software.

```
+----------------------------------------------------------------------------------------------------+
|                               GRAPHICS STUDIO PERMISSION & FLOW BOUNDARY                           |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|    FEATURE / CAPABILITY                           REPORTER STUDIO           ADMIN STUDIO           |
|    ---------------------------------------------------------------------------------------------   |
|    Input: Raw Script / Text Notes                 YES                       YES                    |
|    Input: Configured RSS Stories                  NO (Strictly Blocked)     YES                    |
|    Input: External Web URL Ingestion              NO (Strictly Blocked)     YES                    |
|    AI Headline & Caption Generation               YES                       YES                    |
|    Photo Upload, Cropping & Positioning           YES                       YES                    |
|    Template Access                                ASSIGNED ONLY             ALL TEMPLATES          |
|    Template Creation & Canvas Authoring           NO                        YES                    |
|    Assign Templates to Specific Reporters         NO                        YES                    |
|    Template Versioning & Frame Updates            NO                        YES                    |
|    Live Canvas Preview                            YES                       YES                    |
|    Download High-Res Graphic (PNG/WEBP)           YES                       YES                    |
|    Watermark & Brand Protection Enforced          YES (Locked Elements)     CUSTOMIZABLE           |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

### 19.1 Functional Requirements (GFX Register)
| ID | Requirement Name | Description | Role | Priority | Acceptance Criteria | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GFX-001** | Raw Script to Graphic | Reporters and Admins can generate a branded news graphic card from entered text. | Reporter/Admin | Must Have | Auto-populates headline, category badge, and location tag onto selected template canvas. | AI-003 |
| **GFX-002** | Template Isolation for Reporters | Reporters can only select graphic frames assigned to them by Admin; cannot access global or unassigned frames. | Reporter | Must Have | Dropdown displays only authorized templates; blocks direct template ID manipulation via API. | ADM-010 |
| **GFX-003** | Canvas Text Auto-Scaling | Dynamic typography engine automatically scales Hindi text font size to fit designated frame boundaries without clipping. | Reporter/Admin | Must Have | Text scales seamlessly from 15 to 45 words; supports hyphenation and line wraps in Devanagari. | None |
| **GFX-004** | Photo Cropping & Masking | In-canvas image positioning, zoom, pan, and aspect ratio snapping (1:1 square, 4:5 portrait, 16:9 landscape). | Reporter/Admin | Must Have | High visual fidelity; maintains original pixel density; prevents blurred or distorted aspect ratios. | MEDIA-001 |
| **GFX-005** | Template Creator & Versioning | Admin can design new graphic frames, define text/image bounding boxes, lock branding, and version templates. | Admin Only | Must Have | Admin can update a template; existing published graphics retain historic version; new cards use updated version. | ADM-010 |
| **GFX-006** | URL/RSS to Graphic Generator | Admin can generate news cards directly from active RSS feeds or external news URLs. | Admin Only | Must Have | Reporters have zero access to this feature; extracts headline and image preview for quick rendering. | ADM-007 |
| **GFX-007** | My Graphics History | Users can access previously generated graphic cards to re-download or duplicate. | Reporter/Admin | Should Have | Stored in cloud storage; searchable by date and headline; download in PNG and WebP formats. | MEDIA-001 |

---

## 20. Video Studio Requirements (VID)

The Video Studio enables the production of high-impact video bulletins, explainers, and vertical reels (9:16) for modern mobile consumption.

| ID | Requirement Name | Description | Role | Priority | Acceptance Criteria | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **VID-001** | Script to Video Timeline | Combines news script, slide images, background audio, and branded lower-thirds into a timeline sequence. | Admin/Reporter | Should Have | Multi-track timeline view; allows re-ordering of image/video segments and setting transition times. | MEDIA-001 |
| **VID-002** | Automated Voiceover (TTS) | Synthesizes professional Hindi audio narration from article text using natural neural text-to-speech. | Admin/Reporter | Should Have | Realistic Hindi intonation, variable pacing, female/male voice selector; option to upload reporter voiceover. | API-001 |
| **VID-003** | Subtitle & Caption Burn-in | Automatically generates timed Devanagari subtitles synchronized with the audio track. | Admin/Reporter | Should Have | Subtitles render with readable background contrast; allows manual typo correction before export. | VID-002 |
| **VID-004** | News Branding & Intro/Outro | Automatically stitches the official BREAKING NEWS WALA intro stinger, animated logo watermark, and outro slate. | Admin/Reporter | Should Have | Brand watermark locked in top corner; outro displays website URL and app download call-to-action. | None |
| **VID-005** | Export & Cloud Rendering Queue | Renders completed video compositions into optimized MP4 format (1080p, 720p). | Admin/Reporter | Should Have | Video renders in background; provides download link and automatic attach-to-article option upon completion. | MEDIA-001 |

*Note on Architecture:* Detailed server-side video rendering infrastructure (e.g., FFmpeg microservice, cloud GPU rendering workers) is cataloged as a technical decision to be finalized in `Architecture.md`.

---

## 21. Category and Location Management (CAT & LOC)

### 21.1 Approved 21 Initial News Categories
The platform launches with the following 21 canonical categories in Hindi, supporting dynamic administration:

1. **टॉप न्यूज़ (Top News)** - Major national and breaking developments.
2. **ताज़ा खबरें (Latest News)** - Chronological real-time news feed.
3. **मध्य प्रदेश (Madhya Pradesh)** - Flagship state coverage with hyper-local district drill-down.
4. **राज्य समाचार (State News)** - Regional reporting across Uttar Pradesh, Rajasthan, Bihar, Delhi, etc.
5. **देश (National)** - Indian national affairs, parliamentary news, and federal governance.
6. **विदेश (International)** - Global affairs, geopolitics, Indian diaspora, and international events.
7. **राजनीति (Politics)** - Elections, political parties, rallies, governance, and policy analysis.
8. **बिजनेस (Business & Economy)** - Financial markets, commerce, SME, taxation, and budget.
9. **खेल (Sports)** - Cricket, football, athletics, Olympics, and rural sports.
10. **मनोरंजन (Entertainment)** - Cinema, OTT, television, celebrity news, and music.
11. **शिक्षा (Education)** - School education, universities, board exams, results, and student affairs.
12. **करियर एवं रोजगार (Career & Jobs)** - Government job recruitment (Sarkari Naukri), private careers, exams, skill development.
13. **टेक्नोलॉजी (Technology)** - Gadgets, smartphones, AI innovations, cybersecurity, and digital India.
14. **ऑटोमोबाइल (Automobile)** - New car/bike launches, electric vehicles, reviews, and mileage tests.
15. **धर्म एवं अध्यात्म (Religion & Spirituality)** - Temples, pilgrimage, festivals, rituals, and philosophy.
16. **लाइफस्टाइल (Lifestyle)** - Fashion, food, travel, home, and relationships.
17. **स्वास्थ्य (Health & Wellness)** - Medical science, fitness, Ayurveda, mental health, and wellness.
18. **राशिफल (Horoscope & Astrology)** - Daily/weekly horoscope, astrological analysis, and panchang.
19. **ओपिनियन (Opinion & Editorial)** - Expert columns, guest analyses, and editorial perspectives.
20. **क्राइम (Crime & Law Enforcement)** - Law enforcement, legal proceedings, investigations, and court rulings.
21. **वायरल न्यूज़ (Viral News)** - Trending social media stories, inspiring human interest, and unusual events.

### 21.2 Approved Subcategory Samples
- **खेल:** क्रिकेट, फुटबॉल, अन्य खेल
- **मनोरंजन:** बॉलीवुड, टीवी, सिनेमा
- **टेक्नोलॉजी:** गैजेट्स, मोबाइल, AI और टेक
- **ऑटोमोबाइल:** कार, बाइक, इलेक्ट्रिक वाहन
- **शिक्षा:** स्कूल, कॉलेज, परीक्षा, परिणाम
- **करियर एवं रोजगार:** सरकारी नौकरी, निजी नौकरी, भर्ती
- **धर्म एवं अध्यात्म:** मंदिर, धर्म, त्योहार, ज्योतिष
- **मध्य प्रदेश:** भोपाल, इंदौर, निवाड़ी, ग्वालियर, जबलपुर, उज्जैन, सागर, रीवा, सतना आदि
- **लाइफस्टाइल:** फैशन, खानपान, परिवार, यात्रा
- **बिजनेस:** शेयर बाजार, अर्थव्यवस्था, व्यापार

### 21.3 Dedicated Content Formats (Editorial Sections - Non-Categorical)
The following editorial formats exist as structural content presentation types rather than ordinary news categories:
- **बड़ी खबरें (Lead Headlines / Major Developing Stories)**
- **वीडियो (Video Reports & News Bulletins)**
- **रील्स और शॉर्ट्स (Vertical News Reels & Shorts - 9:16)**
- **एक्सप्लेनर्स (Deep-dive Visual Explainers)**
- **इन्वेस्टिगेशन (Investigative Reports)**
- **खास रिपोर्ट (Special Ground Dispatches)**
- **फोटो गैलरी (High-Resolution Picture Stories)**

### 21.4 Category & Location Governance Rules (CAT & LOC Register)
| ID | Requirement Name | Description | Role | Priority | Acceptance Criteria | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CAT-001** | Dynamic Category Management | Admin can add, edit, reorder, hide, activate, deactivate, or archive categories and subcategories. | Admin | Must Have | Changes reflect instantly on web and mobile navigation; category URLs remain canonical. | None |
| **CAT-002** | Archival Integrity Safeguard | Archiving or deleting a category must never delete or orphan associated historical articles. | Admin | Must Have | Associated articles fall back to parent or archive bucket; article URLs remain intact (no 404s). | NEWS-001 |
| **LOC-001** | Hierarchical Location Taxonomy | Master database of States -> Districts -> Cities/Tehsils with postal pin-code mapping. | Admin | Must Have | Full coverage of Madhya Pradesh districts (Niwari, Bhopal, Indore, etc.) expandable nationally. | None |
| **LOC-002** | District Jurisdiction Binding | Reporters are assigned specific districts by Admin, locking their news-filing dropdowns. | Admin | Must Have | Reporter cannot file under unauthorized districts without explicit multi-district clearance. | ADM-003 |

---

## 22. Notifications and Breaking News (NOT)

| ID | Requirement Name | Description | Role | Priority | Acceptance Criteria | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **NOT-001** | Live News Header Ticker | Admin-controlled ticker text broadcasting high-priority breaking headlines beneath the header. | All | Must Have | Updates on connected clients in near real-time (< 3s); supports start/expiry timestamps. | ADM-009 |
| **NOT-002** | Breaking News Popup Alert | Urgent push dialog appearing on active public screens for critical national or local disasters/emergencies. | Public | Must Have | Displayed with prominent audio chime (user-mutable); dismiss button; does not reappear once read. | None |
| **NOT-003** | Web Push Notifications | Browser push notifications for breaking stories to subscribed desktop and mobile web visitors. | Public | Must Have | One-click opt-in prompt; standard Web Push API payload with headline, icon, and link. | None |
| **NOT-004** | Android Push Notifications (Phase 2)| Native FCM push notifications targeting app users by category preference and district location. | Public | Must Have | Deep links directly to article; supports rich media preview; respects quiet hours setting. | NATIVE-001 |
| **NOT-005** | Reporter Editorial Alerts | Notifications to reporters when articles are approved, published, rejected, or sent for revisions. | Reporter | Must Have | Instant notification in dashboard notification center and optional SMS/WhatsApp/Email webhook. | NEWS-002 |
| **NOT-006** | Admin Inflow Notification | Alerts to central editors when a new story is submitted by a reporter or flagged by RSS ingestion. | Admin | Must Have | Badge counter increments on newsroom header; optional audio alert for critical district stringers. | NEWS-002 |
| **NOT-007** | User Notification Center | Dedicated in-app inbox storing past notifications for 30 days. | Public | Should Have | Categorized into "ब्रेकिंग", "मेरा जिला", and "अपडेट्स"; read/unread status. | AUTH-001 |

---

## 23. AI API Pool (API)

To guarantee 99.9% uptime and avoid vendor lock-in or quota exhaustion during breaking news spikes, the platform incorporates an intelligent, multi-provider AI API Pool managed exclusively by the server.

```
+----------------------------------------------------------------------------------------------------+
|                                      AI API POOL ARCHITECTURE                                      |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                               +-------------------------------+                                    |
|                               |     AI NEWSROOM REQUEST       |                                    |
|                               |  (Raw Script, URL, Graphics)  |                                    |
|                               +---------------+---------------+                                    |
|                                               |                                                    |
|                                               v                                                    |
|                               +-------------------------------+                                    |
|                               |      API POOL LOAD BALANCER   |                                    |
|                               |  - Quota & Rate Limit Monitor |                                    |
|                               |  - Provider Health Probes     |                                    |
|                               |  - Cost & Latency Routing     |                                    |
|                               +---------------+---------------+                                    |
|                                               |                                                    |
|                 +-----------------------------+-----------------------------+                      |
|                 |                                                           |                      |
|                 v                                                           v                      |
|   +---------------------------+                               +---------------------------+        |
|   |    PRIMARY PROVIDER       |                               |    FALLBACK PROVIDER      |        |
|   |  - Google Gemini 2.5/Flash|                               |  - Secondary Provider     |        |
|   |  - Active Key Pool [1..N] |                               |  - Backup Key Pool [1..N] |        |
|   |  - Quota: 85% Remaining   |                               |  - Quota: Standby 100%    |        |
|   +-------------+-------------+                               +-------------+-------------+        |
|                 |                                                           |                      |
|                 | (If HTTP 429 / Quota Exhausted / Latency > 8s)            |                      |
|                 +---------------------------> FAILOVER -------------------->+                      |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

### 23.1 Functional Requirements (API Register)
| ID | Requirement Name | Description | Role | Priority | Acceptance Criteria | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **API-001** | Multi-Key & Provider Vault | Secure server-side vault storing API keys for Gemini and secondary LLM providers. | Admin Only | Must Have | Keys are encrypted at rest; never exposed in client JS or Android APK; support multi-key round-robin. | SEC-002 |
| **API-002** | Real-Time Quota & Token Telemetry| Real-time dashboard tracking daily token consumption, request counts, and quota ceilings per key. | Admin | Must Have | Graphical meters showing daily usage; automated alerts when a key reaches 80% and 95% quota. | ADM-012 |
| **API-003** | Automated Failover & Retry | Seamlessly reroutes requests to standby keys or alternate providers upon HTTP 429 (Rate Limit) or 5xx errors. | System | Must Have | Zero downtime for journalists; automatic fallback within 1.5 seconds; logs failover incident. | API-001 |
| **API-004** | Latency & Health Probes | Automated ping probes testing provider response time and token latency every 15 minutes. | System | Should Have | Automatically deactivates unhealthy keys; marks keys active once upstream services normalize. | ADM-012 |
| **API-005** | Estimated Cost Tracking | Aggregates token usage and calculates estimated compute expenditure based on provider rate cards. | Admin | Should Have | Tabulated monthly and daily cost projections grouped by feature (News, Graphics, Video). | ADM-012 |

---

## 24. Analytics and Reporting (ANA)

| ID | Requirement Name | Description | Role | Priority | Acceptance Criteria | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ANA-001** | Executive Newsroom Analytics | Platform-wide metrics: Real-time concurrent readers, total daily page views, unique visitors, read time. | Admin | Must Have | Real-time graphs; breakdown by category, device type (Web vs Android), and geographic region. | None |
| **ANA-002** | Reporter Performance Scorecards | Detailed reporter metrics: Number of stories filed, approval speed, rejection count, total article views. | Admin/Reporter | Must Have | Admin views all reporters; reporters view only their personal metrics; exportable to PDF/CSV. | REP-001 |
| **ANA-003** | District Engagement Heatmap | Heatmap visualization indicating engagement density across Madhya Pradesh and Indian districts. | Admin | Should Have | Identifies underserved districts with low story coverage or high unfulfilled reader demand. | LOC-001 |
| **ANA-004** | Content Longevity & Trending Index | Algorithmic ranking of viral and high-engagement stories based on velocity of shares, reads, and bookmarks. | Admin/Public | Must Have | Powers the "ट्रेंडिंग" section on public portal; refreshes every 10 minutes. | NEWS-001 |
| **ANA-005** | Video & Multimedia Telemetry | Play duration, completion rates, drop-off timestamps, and re-shares for news videos and reels. | Admin | Should Have | Visual funnel indicating 25%, 50%, 75%, and 100% completion metrics. | VID-004 |

---

## 25. Advertisement and Monetization (MON)

| ID | Requirement Name | Description | Role | Priority | Acceptance Criteria | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MON-001** | Multi-Slot Ad Placement Engine | Support for standard display banners across Homepage, Category feeds, Article detail, and Video feeds. | Admin | Should Have | Supports responsive standard ad dimensions (728x90, 300x250, 320x50, 300x600); asynchronous rendering. | ADM-013 |
| **MON-002** | Sponsored Content Labeling | Clearly distinct visual tag (*प्रायोजित सामग्री / Sponsored*) for paid advertorials and partner stories. | All | Must Have | Sponsored articles display disclaimers; excluded from editorial RSS feeds; compliant with ASCI guidelines. | NEWS-001 |
| **MON-003** | Gamification Coin Ledger | Ledger framework tracking user engagement points earned through daily reading, sharing, and invites. | Public/Admin | Could Have | Immutable ledger recording transaction timestamp, point delta, and reason; no cash payout in Phase 1. | AUTH-001 |
| **MON-004** | Impression & Click Telemetry | Internal privacy-safe click and impression tracking for direct local advertiser campaigns. | Admin | Should Have | Prevents click fraud through IP deduplication; provides advertisers with performance reports. | MON-001 |

---

## 26. SEO Requirements (SEO)

Search Engine Optimization is vital for organic distribution and indexing in Google News and Discover.

| ID | Requirement Name | Description | Role | Priority | Acceptance Criteria | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEO-001** | Automated Structured Data (JSON-LD)| Automatic generation of schema.org `NewsArticle`, `BreadcrumbList`, and `Organization` schemas. | System | Must Have | Validates 100% against Google Rich Results Test; includes headline, dates, author, image array, publisher. | NEWS-001 |
| **SEO-002** | Social Meta Tags & Open Graph | Dynamic `og:title`, `og:description`, `og:image`, and `twitter:card` (summary_large_image) for every story. | System | Must Have | Previews render flawlessly on WhatsApp, Facebook, Telegram, and X; correct 1200x630px image ratio. | NEWS-001 |
| **SEO-003** | Semantic URL Slugs | Clean, human-readable slugs combining Romanized/Devanagari keywords with unique alphanumeric IDs. | System | Must Have | Format: `/news/{category}/{district}/{slug-id}`; permanent 301 redirects if slugs are modified. | NEWS-001 |
| **SEO-004** | Dynamic Google News XML Sitemap | Dedicated, real-time XML sitemaps including `sitemap-news.xml` filtering articles published in last 48 hours. | System | Must Have | Conforms to Google News Sitemap specifications; includes `<news:news>`, `<news:publication>`, `<news:publication_date>`. | NEWS-001 |
| **SEO-005** | Canonicalization & AMP-Readiness | Canonical URL links to eliminate duplicate content penalties from multi-category postings. | System | Must Have | Every article page declares an explicit self-referential `<link rel="canonical">`. | None |

---

## 27. Security and Editorial Governance (SEC)

| ID | Requirement Name | Description | Role | Priority | Acceptance Criteria | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-001** | Role-Based Access Enforcement | Strict server-side validation of JWT claims and user role permissions on every API endpoint. | System | Must Have | Client-side UI toggles are never trusted; unauthorized requests return HTTP 403 Forbidden. | AUTH-001 |
| **SEC-002** | Zero Client-Side Secret Exposure | AI API keys, cloud storage secrets, and administrative database tokens reside strictly on backend servers. | System | Must Have | Zero environment secrets exposed in Vite client builds or Android binary APK decompilations. | API-001 |
| **SEC-003** | Comprehensive System Audit Logs | Immutable audit logging of administrative actions, role assignments, article approvals, and deletions. | Admin | Must Have | Records Actor ID, Timestamp, Action Type, Target ID, Old Value, New Value, IP Address, and User-Agent. | None |
| **SEC-004** | Session Management & Concurrent Control| Secure HTTP-only cookies or encrypted Bearer tokens with session invalidation upon password reset or role change.| All | Must Have | Automatic session timeout after 14 days; immediate revocation of compromised reporter credentials. | AUTH-001 |
| **SEC-005** | Media Upload Sanitization | Server-side validation of MIME types, image dimensions, and malicious payload stripping from uploads. | System | Must Have | Rejects executable files, disguised scripts, or oversized media; re-encodes images before storage. | MEDIA-001 |
| **SEC-006** | Indian IT Rules (2021) Compliance | Publication of Grievance Officer details, 24-hour acknowledgment, and 15-day resolution mechanisms. | Admin | Must Have | Dedicated public Grievance Redressal page with contact email, official address, and complaint tracker. | None |

---

## 28. Non-Functional Requirements Summary

| Dimension | Target Metric / Standard | Verification Method |
| :--- | :--- | :--- |
| **Performance (Web)** | First Contentful Paint (FCP) < 1.2s; Largest Contentful Paint (LCP) < 2.5s on 4G networks; Lighthouse Score > 90. | Automated Lighthouse / PageSpeed audit. |
| **Performance (Android)**| App cold launch time < 1.5s; smooth 60fps scrolling across news feeds on mid-range Android devices. | Android Vitals & Profiler telemetry. |
| **Availability & Uptime** | 99.9% uptime for Public Portal and API Gateway; zero downtime during breaking news traffic spikes. | Synthetic monitoring and uptime probes. |
| **Scalability** | Capable of supporting 10,000 concurrent active readers and 500 simultaneous reporter dispatches. | Load testing simulations (k6 / Artillery). |
| **Data Integrity** | Zero data loss for published articles; automated daily database snapshots and multi-region backups. | Automated backup validation drills. |
| **Accessibility** | High-contrast typography; scalable font sizes; alt text for news images; screen-reader compatible Devanagari. | WCAG 2.1 AA accessibility audit. |

---

## 29. MVP and Future Roadmap

```
+----------------------------------------------------------------------------------------------------+
|                                    PRODUCT DEVELOPMENT ROADMAP                                     |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|    PHASE 1: WEB ECOSYSTEM & DIGITAL NEWSROOM (MVP)                                                 |
|    - Public Responsive News Website (Dainik Bhaskar-inspired layout, 21 Hindi categories)          |
|    - Unified Backend, Shared Relational/Document Database, API Gateway                             |
|    - Full Reporter Web Station (Raw script to news, media upload, district-locked filing)           |
|    - Admin Control Panel & Central Newsroom (Approval queue, trusted publisher permissions)        |
|    - RSS News Ingestion & Admin URL-to-News Extraction                                             |
|    - Reporter Graphics Studio (Raw script to card, assigned templates, text auto-fit)              |
|    - Admin Graphics Studio (Template designer, versioning, reporter template assignment)           |
|    - AI API Pool (Multi-key Gemini support, token tracking, automated error failover)              |
|    - Live Breaking News Header Ticker & Web Push Notifications                                     |
|    - Dynamic Category & District Management (Flagship focus on Madhya Pradesh)                     |
|    - NewsArticle Schema, SEO Sitemaps, and Social OpenGraph Previews                               |
|                                                                                                    |
|    ---------------------------------------------------------------------------------------------   |
|                                                                                                    |
|    PHASE 2: NATIVE ANDROID APPLICATION & ADVANCED MULTIMEDIA (POST-MVP)                            |
|    - Fully Native Kotlin Android App (Jetpack Compose, Android SDK, zero WebView shortcuts)        |
|    - Native Push Notifications via Firebase Cloud Messaging (FCM) with district targeting          |
|    - Video Studio (Script-to-video timeline, neural Hindi TTS voiceover, Devanagari subtitles)     |
|    - Offline News Caching & Background Prefetching (WorkManager & Room DB)                         |
|    - In-App Reporter Camera & Field Audio Capture with hardware acceleration                       |
|    - Programmatic Ad Network Integration (Google AdManager) & Direct Advertiser Portal             |
|    - Complete Referral & Reader Coin Gamification Ledger                                           |
|                                                                                                    |
|    ---------------------------------------------------------------------------------------------   |
|                                                                                                    |
|    PHASE 3: ENTERPRISE EXPANSION & MULTI-LINGUAL SYNDICATION (FUTURE)                              |
|    - Multi-language expansion (Gujarati, Marathi, Punjabi, Bengali, English)                      |
|    - Live Video Streaming Studio & Reporter Live Field Broadcast integration                       |
|    - Automated Podcast & Daily News Audio Bulletin generator                                       |
|    - Premium Reader Memberships & Ad-Free Subscription Tiers                                      |
|    - Syndication API for distribution to external aggregators (Dailyhunt, JioNews, Google News)    |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 30. Dependencies and Integrations

1. **AI Model Providers:** Google Gemini API (`@google/genai` TypeScript SDK) as primary provider with multi-key pool; extensible to secondary fallback models.
2. **Cloud Infrastructure & Compute:** Cloud Run / Node.js container runtime with auto-scaling to absorb breaking news traffic.
3. **Database & Storage Services:** Relational/Document database for structured records; object storage bucket for images, audio dispatches, and video clips.
4. **Push Notification Infrastructure:** Web Push Protocol for web clients; Firebase Cloud Messaging (FCM) for Phase 2 Android native devices.
5. **Mapping & Geocoding:** Indian state, district, and tehsil boundaries database for hyper-local jurisdictional routing.
6. **Social & Sharing Protocol:** Open Graph and Twitter Card protocol for WhatsApp, Facebook, Telegram, and X link resolution.

---

## 31. Risks and Constraints

| Risk Category | Risk Description | Severity | Mitigation Strategy |
| :--- | :--- | :---: | :--- |
| **Copyright & Legal** | Field reporters or AI synthesis copying verbatim wire content without proper licensing or attribution. | **HIGH** | Strict editorial review; source attribution fields mandatory; legal disclaimer that AI rewrite does not waive copyright laws. |
| **Misinformation / Defamation**| Untested local reporters publishing false, libelous, or communally sensitive news under breaking pressure. | **HIGH** | Two-tier editorial verification; only vetted Admin-approved journalists receive `Trusted Reporter` status; immediate revocation toggle. |
| **AI Rate Limits & Outages** | Sudden surges in breaking news hitting LLM rate limits (HTTP 429) or upstream outages. | **MEDIUM** | Multi-key AI API Pool with automatic failover, health probing, and graceful degradation to manual reporting. |
| **Connectivity in Field** | Rural district reporters operating in 2G/3G connectivity zones unable to upload high-res media. | **MEDIUM** | Client-side image compression before upload; offline draft saving in browser local storage and native SQLite. |
| **Brand Dilution** | Reporters using non-standard frames, unauthorized logos, or garish graphic styles. | **LOW** | Reporter Graphics Studio strictly locked to Admin-approved, immutable brand templates. |

---

## 32. Assumptions

1. **Language Focus:** Phase 1 launches primarily in Hindi (Devanagari script), with an English-friendly administrative backend for technical operators.
2. **Device Demographics:** Over 85% of public readers and field reporters will access the system via mobile devices (smartphones running Android 10+).
3. **Connectivity:** Public readers and reporters have at least intermittent 3G/4G or Wi-Fi mobile data connections.
4. **Editorial Staffing:** The central digital newsroom will maintain editorial staff to monitor the review queue during active news hours.
5. **No Real Cash Payouts in Phase 1:** Reward coins represent engagement points within the platform ecosystem and will not be redeemable for real monetary disbursements during MVP.

---

## 33. Open Questions / Pending Decisions

The following items represent architectural, commercial, or operational decisions that have not yet been approved and will be formally resolved in their respective dedicated technical documents:

| Decision Item | Nature of Question | Impact Area | Target Document for Resolution |
| :--- | :--- | :--- | :--- |
| **OPQ-001: Mobile Tech Stack** | Final approval of Kotlin Jetpack Compose architecture vs any hybrid components for Phase 2. *(Confirmed: Pure Native Kotlin required).* | Android App | `Architecture.md` |
| **OPQ-002: Primary Database Engine** | Selection of PostgreSQL (with JSONB) vs Firestore vs Hybrid Relational/Document model for single shared database. | Backend / DB | `Database.md` |
| **OPQ-003: Video Rendering Pipeline** | Cloud-based serverless FFmpeg container vs third-party video generation API for automated Video Studio exports. | Video Studio | `Architecture.md` & `Video-Studio.md` |
| **OPQ-004: Graphics Template Updates** | When Admin updates a graphic template frame, should existing saved graphics automatically adopt new styling or remain locked to historic versions? | Graphics Studio | `Graphics-Studio.md` |
| **OPQ-005: Coin Monetization Rules** | Specific mathematical formulas for coin accrual (points per article read, points per referral) and reward catalog partnerships. | Monetization | `Monetization.md` |
| **OPQ-006: Web Push Provider** | Direct VAPID Web Push implementation vs unified Firebase Cloud Messaging for Web and Android. | Notifications | `API.md` & `Architecture.md` |

---

## 34. Acceptance Criteria

The deliverables associated with this Product Requirements Document will be considered accepted when:

1. **Document Completeness:** All 36 required sections and appendices are comprehensively authored with zero placeholder omissions.
2. **Role & Permission Segregation:** Strict separation between Admin, Trusted Reporter, Standard Reporter, and Public User capabilities is clearly established.
3. **Workflow Integrity:** Two distinct news creation pathways (Admin RSS/URL Desk and Reporter Raw Script Desk) are fully mapped with clear boundary controls.
4. **Cross-Platform Strategy:** Shared backend, shared database, API-first architecture, and Phase 2 Native Kotlin Android path are definitively documented without code duplication.
5. **Studio Restrictions Enforced:** Reporter Graphics Studio is explicitly documented as lacking URL-to-Graphic and template creation features.
6. **21 Categories & Districts Included:** Full initial Hindi taxonomy and district management specifications are integrated.
7. **No Codebase Alteration:** Zero application files, package configurations, or database tables were created or altered during this documentation turn.

---

## 35. Completion Checklist

- [x] Section 1: Document Information & Versioning
- [x] Section 2: Executive Summary
- [x] Section 3: Product Vision
- [x] Section 4: Product Objectives
- [x] Section 5: Target Audience
- [x] Section 6: User Personas
- [x] Section 7: Product Scope
- [x] Section 8: Out of Scope
- [x] Section 9: Platforms and Product Modules
- [x] Section 10: User Roles and Permissions Matrix
- [x] Section 11: Functional Requirements (PUB, REP, ADM Register)
- [x] Section 12: Public Website Requirements
- [x] Section 13: Android App Requirements (Phase 2 Native Strategy)
- [x] Section 14: Reporter Dashboard Requirements (रिपोर्टर डैशबोर्ड)
- [x] Section 15: Admin Control Panel Requirements (एडमिन कंट्रोल पैनल)
- [x] Section 16: Central Newsroom Requirements
- [x] Section 17: News Creation and Publishing Workflows (Two Segregated Workflows)
- [x] Section 18: AI Newsroom Requirements (AI Register)
- [x] Section 19: Graphics Studio Requirements (GFX Register)
- [x] Section 20: Video Studio Requirements (VID Register)
- [x] Section 21: Category and Location Management (21 Hindi Categories & Districts)
- [x] Section 22: Notifications and Breaking News (NOT Register)
- [x] Section 23: AI API Pool (API Register)
- [x] Section 24: Analytics and Reporting (ANA Register)
- [x] Section 25: Advertisement and Monetization (MON Register)
- [x] Section 26: SEO Requirements (SEO Register)
- [x] Section 27: Security and Editorial Governance (SEC Register)
- [x] Section 28: Non-Functional Requirements Summary
- [x] Section 29: MVP and Future Roadmap
- [x] Section 30: Dependencies and Integrations
- [x] Section 31: Risks and Constraints
- [x] Section 32: Assumptions
- [x] Section 33: Open Questions / Pending Decisions
- [x] Section 34: Acceptance Criteria
- [x] Section 35: Completion Checklist
- [x] Section 36: Related Documents

---

## 36. Related Documents

The following documentation suite forms the complete engineering, architectural, and operational specification for BREAKING NEWS WALA. Each document will elaborate on the requirements established in this PRD:

| Document File | Purpose / Scope | Status |
| :--- | :--- | :--- |
| `docs/01-PRD.md` | Master Product Requirements Document | **Completed (This Document)** |
| `docs/02-Features.md` | Exhaustive feature-by-feature operational specification | *Recommended Next Document* |
| `docs/03-Architecture.md` | System architecture, cross-platform bridge, service boundaries | Planned |
| `docs/04-Database.md` | Schema definitions, relational entities, indexing, and migrations | Planned |
| `docs/05-API.md` | RESTful API specifications, JSON contracts, response payloads | Planned |
| `docs/06-Auth.md` | Authentication flows, session lifecycle, and RBAC token policies | Planned |
| `docs/07-Security.md` | Security hardening, encryption, and IT Rules compliance | Planned |
| `docs/08-API-Pool.md` | Multi-provider AI key pool, failover logic, and quota management | Planned |
| `docs/09-Graphics-Studio.md`| Canvas rendering engine, SVG template specs, and auto-fit rules | Planned |
| `docs/10-Video-Studio.md` | Video pipeline, neural TTS integration, and timeline sequencing | Planned |
| `docs/11-Monetization.md` | Ad slots, campaign scheduling, and reward gamification ledger | Planned |
| `docs/12-Roadmap.md` | Sprint breakdown, milestones, and release schedule | Planned |
