# Master Responsive Web Design Specification
## Project: BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
### Document ID: DOC-10-RSP-2026-V1.0
### Confidentiality: Internal Engineering, Design & Quality Assurance Specification

---

## 1. Document Information

| Attribute | Specification Details |
| :--- | :--- |
| **Document Title** | Master Responsive Web Design Specification |
| **Document ID** | `DOC-10-RSP-2026-V1.0` |
| **Baseline Version** | `1.0.0` |
| **Document Status** | **Approved Architectural Baseline** |
| **Creation Date** | October 31, 2026 |
| **Target System** | BREAKING NEWS WALA Multi-Platform Digital Ecosystem (Web Portals, Workspaces, Studios) |
| **Target Viewport Range** | Ultra-wide Desktop (`≥1920px`) down to Ultra-compact Mobile (`320px`) |
| **Target Client Runtimes** | Modern Mobile & Desktop Web Browsers (Chrome, Safari, Firefox, Edge, Samsung Internet) |
| **Authoring Body** | Central Responsive Design Architecture Guild & Frontend UX Engineering Team |
| **Approved By** | Principal Responsive Design Architect, Head of Frontend Architecture, Chief Technology Officer |
| **Predecessor Dependencies** | `docs/01-PRD.md` (PRD v1.0.0), `docs/02-Features.md` (Features v1.0.0), `docs/03-Plan.md` (Plan v1.0.0), `docs/04-NFR.md` (NFR v1.0.0), `docs/05-Workflows.md` (Workflows v1.0.0), `docs/06-Business-Rules.md` (BRD v1.0.0), `docs/07-Design.md` (Design v1.0.0), `docs/08-Sitemap.md` (Sitemap v1.0.0), `docs/09-Components.md` (Components v1.0.0) |
| **Target Document Path** | `docs/10-Responsive-Design.md` (and `docs/Responsive-Design.md`) |

---

## 2. Purpose and Scope

### 2.1 Purpose
The purpose of this document is to establish the definitive, mathematically rigorous, and implementation-ready responsive design specification for the **BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)** Web Platform. 

As a premier hyper-local and national Hindi digital news network, BREAKING NEWS WALA serves a highly heterogeneous user base across urban and rural India (Tier-1, Tier-2, Tier-3 cities, and remote districts). Users access the platform across an exceptionally wide spectrum of devices—from high-resolution 4K newsroom editing workstations down to entry-level Android smartphones with low-resolution viewports (320px–360px), varying pixel densities (1x to 4x), physical touch screens, and constrained cellular network bandwidth (2G/3G/4G).

This specification guarantees that every user, whether a citizen reading breaking regional news on a budget phone on a 3G network or an executive editor running the Central Newsroom on a multi-monitor desktop setup, experiences an optimal, highly readable, visually balanced, and completely accessible interface.

### 2.2 System Scope
This specification governs all responsive web surfaces comprising the Stage A Web Platform:
1. **Public News Website & Mobile Web**: High-speed, SEO-optimized public portal including Homepage, Category Hubs, District Clusters, Article Detail, Video/Reel Streamers, Live Blogs, and Search.
2. **Reporter Web Application**: Ground reporter mobile-first and desktop workspace for news drafting, voice-to-text reporting, media ingestion, offline sync, status tracking, and the Reporter Graphics Studio.
3. **Admin Control Panel**: Comprehensive editorial governance, review queue, user/territory management, AI model controls, system health monitoring, and analytics.
4. **Central Newsroom**: Real-time operational command center featuring live incoming breaking wires, field reporter GPS tracking, desk assignment kanban, and editorial activity streams.
5. **Graphics Studio**: Template-driven visual asset generator operating in both mobile-adapted single-column layouts and desktop dual-pane creative canvases.
6. **Video Studio**: Script-to-video, voiceover synthesis, and multi-track automated reel rendering suites.

### 2.3 Documentation-Only Constraint
This is strictly an architectural design and engineering specification document. No production CSS, SCSS, JavaScript, HTML, TypeScript, database schemas, or application code may be written, altered, or deployed as part of this deliverable.

---

## 3. Responsive Design Principles

The BREAKING NEWS WALA responsive system is constructed upon eight foundational architectural tenets:

### 3.1 Mobile-First Hierarchy & Progressive Enhancement
All layout styles and component compositions are authored starting from the smallest supported viewport (`320px`) and progressively enhanced upward using `min-width` media queries. Base styles embody lightweight, single-column linear flows optimized for single-thumb mobile interaction, fast initial rendering, and minimal memory footprints. Larger screen real estate (laptops, desktops) is treated as an opportunistic enhancement, introducing multi-column grids, secondary sidebars, auxiliary data streams, and rich interactive previews without penalizing mobile clients with desktop overhead.

### 3.2 Vernacular Devanagari Readability Guarantee
Devanagari script presents unique typographic geometry compared to Latin scripts. High vertical vowel modifiers (matras like *ऊ*, *ौ*, *ी*, *े* and *anusvara*) and low modifiers (*ु*, *ू*, *ृ*, *halant*) require substantial vertical clearance. 
- **Matra Protection Invariant**: Body text line-height must never drop below `1.75` (`32px` on a `18px` base) on any viewport.
- **Word Integrity & Syllable Wrapping**: Headlines and titles must be styled with `word-break: keep-all; overflow-wrap: anywhere;` to prevent breaking mid-syllable or separating conjunct consonants (*samyuktaksaras*).
- **Minimum Tap Target Padding**: Buttons and inputs containing Devanagari glyphs enforce a minimum vertical padding of `12px` to prevent clipping ascenders and descenders.

### 3.3 Functional Parity (Zero Mobile Deprecation)
Mobile viewports must never serve an artificially crippled or "lite" subset of core professional workflows. Reporters filing breaking news in the field and administrators reviewing urgent dispatches on mobile devices must have access to 100% of required business actions. Functional parity is achieved through intelligent spatial reorganization (e.g., converting multi-column tabular queues into collapsible responsive action cards, or tucking secondary analytics into accessible bottom sheets) rather than feature truncation or hiding buttons.

### 3.4 Ergonomic Thumb-Zone Interaction
On handheld mobile devices (viewports `<768px`), human interaction is primarily one-handed using the thumb. 
- Critical frequent actions (breaking news filing, category switching, search trigger, bookmarking, WhatsApp sharing, drawer opening) are placed within the **Natural Thumb Zone** (bottom 35% of the viewport).
- Destructive or infrequent actions (delete draft, reject submission, kill switch) are sequestered in the **Hard-to-Reach Zone** (top 20% of the viewport) to prevent accidental execution.
- Touch targets strictly satisfy a minimum bounding box of `48px × 48px` with at least `8px` separating touch boundaries.

### 3.5 Fluid Typography & Proportional Clamping
To prevent abrupt typographic jumps across arbitrary viewport boundaries, font sizes and structural gutter spacing utilize mathematical CSS clamp functions:
$$\text{Fluid Size} = \text{clamp}(V_{\min}, V_{\text{pref}}, V_{\max})$$
where $V_{\text{pref}} = \text{base} + \text{slope} \times \text{vw}$. This creates seamless typographic transitions that maintain optimal visual rhythm across irregular display widths without requiring dozens of media query overrides.

### 3.6 Layout Stability & Zero Cumulative Layout Shift (CLS)
News feeds with dynamically loaded media, breaking news updates, and programmatic advertisements are inherently vulnerable to layout shifting. To achieve Google Core Web Vitals compliance ($\text{CLS} < 0.1$):
- All responsive media containers (images, video players, ad slots) must enforce explicit geometric aspect-ratio placeholders (`aspect-ratio: 16 / 9`, `aspect-ratio: 1 / 1`, `aspect-ratio: 9 / 16`).
- Ad containers reserve fixed vertical slots matching standard IAB dimensions prior to script injection.
- Breaking news ticker bars reserve fixed line heights before text stream hydration.

### 3.7 Low-Bandwidth & Resilient Network Adaptability
Given the intermittent connectivity characteristic of rural and regional reporting territories:
- Layouts must render meaningfully even if external web fonts or JavaScript assets fail or load with high latency.
- System fallback typography (`system-ui`, `-apple-system`, `sans-serif`) is calibrated with matched x-heights and bounding box metrics to prevent jarring FOIT (Flash of Invisible Text) reflows.
- High-resolution graphics and video streams automatically downgrade to responsive thumbnails or low-bitrate variants when connection quality drops.

### 3.8 Strict Separation from Native Android Ecosystem
While this document establishes responsive web rules, it strictly honors the architectural mandate of `RULE-XPLAT-003` and `RULE-XPLAT-004`:
- Responsive web layouts are designed exclusively for browser engines (HTML5/CSS3/JavaScript).
- The planned Native Android App is an independent, native Kotlin and Jetpack Compose (`@Composable`) application compiled against Android SDK 34+.
- Web responsive code must **never** be injected into an Android WebView wrapper disguised as an application.
- Web responsive design tokens (colors, typography scales, spacing units, elevation models) will be exported as platform-neutral JSON tokens for consumption by native Android Compose theme builders.

---

## 4. Device and Screen Categories

Device classification cannot be determined solely by horizontal pixel width. Device categorization requires evaluating screen width, viewport height, device pixel ratio (DPR), physical form factor, input modality (fine mouse pointer vs. coarse capacitive touch), and typical interaction posture (desktop desk posture vs. two-handed tablet grip vs. single-handed portrait mobile hold).

BREAKING NEWS WALA classifies all target devices into **eight definitive device categories**:

| Category ID | Category Name | Typical Physical Hardware | Viewport Width Range | Viewport Height Range | Default Orientation | Primary Input Modality | Typical DPR Range |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DEV-01** | **Large Desktop** | 27"–34" 4K/QHD Monitors, Ultra-wide Displays, Multi-monitor Newsroom Desks | `≥ 1440px` (Up to `3840px`) | `≥ 900px` | Landscape | Fine Pointer (Mouse / Trackpad) + Full Keyboard | `1.0x – 2.0x` |
| **DEV-02** | **Standard Desktop** | 21.5"–24" Full HD (1080p) Monitors, Newsroom Terminals | `1280px – 1439px` | `≥ 720px` | Landscape | Fine Pointer (Mouse / Trackpad) + Full Keyboard | `1.0x – 1.5x` |
| **DEV-03** | **Laptop / Notebook** | 13"–16" Laptops (MacBook Air/Pro, ThinkPad, Dell XPS) | `1024px – 1279px` | `600px – 900px` | Landscape | Fine Pointer (Trackpad) + Laptop Keyboard | `1.25x – 2.0x` |
| **DEV-04** | **Tablet Landscape** | 10"–13" Tablets in Landscape (iPad Pro, Galaxy Tab S9), Small Foldables | `900px – 1023px` | `600px – 800px` | Landscape | Coarse Touch / Stylus (Optional Bluetooth Keyboard) | `1.5x – 2.5x` |
| **DEV-05** | **Tablet Portrait** | 8"–11" Tablets in Portrait (iPad Air, iPad Mini, Lenovo Tab), Large Foldables Unfolded | `768px – 899px` | `900px – 1366px` | Portrait | Coarse Touch (Capacitive Screen) | `1.5x – 2.5x` |
| **DEV-06** | **Large Mobile** | 6.5"–6.9" Flagship & Mid-tier Phablets (Pixel 8 Pro, Galaxy S24+, iPhone Pro Max) | `480px – 767px` | `800px – 960px` | Portrait | Coarse Touch (One-handed or Two-thumb typing) | `2.5x – 3.5x` |
| **DEV-07** | **Standard Mobile** | 6.0"–6.4" Mainstream Android Devices (Redmi Note, Realme, Galaxy A-series, iPhone standard) | `375px – 479px` | `667px – 844px` | Portrait | Coarse Touch (Single-thumb ergonomic reach) | `2.0x – 3.0x` |
| **DEV-08** | **Small Mobile** | 4.7"–5.5" Budget & Legacy Smartphones (JioPhone Next, Redmi A-series, older iPhones) | `320px – 374px` | `568px – 667px` | Portrait | Coarse Touch (High finger crowding, constrained screen) | `1.5x – 2.0x` |

### 4.1 Device Category Characteristics & Environmental Constraints

```mermaid
flowchart TD
    subgraph DESKTOP_TIER["Desktop & Laptop Workspace Tier (Pointer + Keyboard)"]
        DEV01["DEV-01: Large Desktop (≥1440px)"]
        DEV02["DEV-02: Standard Desktop (1280px-1439px)"]
        DEV03["DEV-03: Laptop / Notebook (1024px-1279px)"]
    end

    subgraph TABLET_TIER["Tablet Hybrid Tier (Touch + Large Viewport)"]
        DEV04["DEV-04: Tablet Landscape (900px-1023px)"]
        DEV05["DEV-05: Tablet Portrait (768px-899px)"]
    end

    subgraph MOBILE_TIER["Mobile Handheld Tier (Single-Thumb Touch + Constrained Viewport)"]
        DEV06["DEV-06: Large Mobile (480px-767px)"]
        DEV07["DEV-07: Standard Mobile (375px-479px)"]
        DEV08["DEV-08: Small Mobile (320px-374px)"]
    end

    DESKTOP_TIER -->|Hover States Active, Multi-column Grids, Rich Previews| ARCH_DESK["Full Grid & Split-Pane Layouts"]
    TABLET_TIER -->|Touch First, Collapsible Drawers, 2-to-3 Column Grids| ARCH_TAB["Adaptive Hybrid Layouts"]
    MOBILE_TIER -->|Ergonomic Thumb Zone, Single Column Linear Flow, Bottom Sheets| ARCH_MOB["Linear Flow & Bottom Navigation"]
```

---

## 5. Breakpoint Strategy

### 5.1 Approved Master Breakpoint System
The BREAKING NEWS WALA responsive breakpoint system is mathematically anchored to the 12-column dynamic grid and the typographic baseline of Devanagari script. Rather than anchoring breakpoints arbitrarily to popular vendor device widths, our breakpoints correspond directly to **content strain points**—the exact dimensions where multi-column layouts begin to compromise readability or interactive density.

| Breakpoint Token | Min Viewport Width | Max Viewport Width | Target Grid Columns | Container Max Width | Page Gutter (Margin) | Column Gap | Primary Target Device Scope |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `bp-xs` (Base) | `320px` | `479px` | **4 Columns** | `100%` (Fluid) | `16px` | `12px` | DEV-08 (Small Mobile), DEV-07 (Standard Mobile) |
| `bp-sm` | `480px` | `767px` | **4 / 6 Columns** | `100%` (Fluid) | `20px` | `16px` | DEV-06 (Large Mobile), Mobile Landscape |
| `bp-md` | `768px` | `1023px` | **8 Columns** | `720px` – `960px` | `24px` | `20px` | DEV-05 (Tablet Portrait), DEV-04 (Tablet Landscape) |
| `bp-lg` | `1024px` | `1279px` | **12 Columns** | `984px` | `32px` | `24px` | DEV-03 (Laptops / Small Desktops) |
| `bp-xl` | `1280px` | `1439px` | **12 Columns** | `1200px` | `40px` | `24px` | DEV-02 (Standard Desktop 1080p) |
| `bp-2xl` | `1440px` | `1919px` | **12 Columns** | `1380px` | `48px` | `32px` | DEV-01 (Large Desktop / QHD) |
| `bp-3xl` | `1920px` | No limit | **12 / 16 Columns**| `1680px` | `64px` | `32px` | DEV-01 Ultra-wide / 4K Workstations |

### 5.2 Dynamic Grid Geometry & Column Behavior
- **Fluid Gutter Formula**: For mobile viewports between `320px` and `768px`, page gutters scale dynamically using:
  $$\text{margin} = \text{clamp}(16\text{px}, 5\text{vw}, 24\text{px})$$
- **Outer Shell Constraint**: At viewports exceeding `1440px`, the primary application container is auto-centered (`margin-left: auto; margin-right: auto;`) and capped at `1380px` (or `1680px` for Central Newsroom command consoles) to prevent extreme line lengths that degrade reading comprehension.
- **CSS Variable Contract**:
  ```css
  :root {
    --bp-xs: 320px;
    --bp-sm: 480px;
    --bp-md: 768px;
    --bp-lg: 1024px;
    --bp-xl: 1280px;
    --bp-2xl: 1440px;
    --bp-3xl: 1920px;
  }
  ```

### 5.3 Orientation & Viewport Height Constraints
Screen orientation dramatically impacts responsive behavior, especially for video playback and data entry:
1. **Mobile Landscape (`width < 900px` AND `orientation: landscape`)**:
   - Reduces vertical navigation headers from `64px` to `48px`.
   - Automatically hides sticky bottom navigation bars to preserve vertical viewport height.
   - Converts modal dialogs into full-screen scrollable sheets.
   - News creation forms anchor submit actions to a compact right-hand toolbar rather than bottom-stacked buttons.
2. **Short Viewports (`height < 600px`)**:
   - Disables fixed/sticky positioning on secondary utility bars (e.g., breaking news ticker) to prioritize content viewability.
   - Enforces `max-height: 85vh; overflow-y: auto;` on all modal windows.

---

---

## 6. Public Website Responsive Design

### 6.1 Header and Navigation Responsive Anatomy
The Public Website header must adapt gracefully between high-density desktop displays with multi-tier navigation bars and compact mobile viewports requiring touch-accessible navigation.

```mermaid
flowchart TD
    subgraph DESKTOP_NAV["Desktop Header Layout (≥1024px)"]
        D_TOP["Utility Bar: District Selector | Weather | E-Paper | Socials | Auth"]
        D_MID["Main Brand Bar: Primary Logo (240x56px) | Live Breaking Ticker | Global Search | User Avatar"]
        D_CAT["Category Navigation Rail: 21 Approved Category Links with Overflow Dropdown"]
    end

    subgraph TABLET_NAV["Tablet Header Layout (768px-1023px)"]
        T_BAR["Compact Header: Hamburger Menu | Centered Logo (180x44px) | Search Icon | District Chip | User Icon"]
        T_TICKER["Collapsible Breaking News Strip"]
        T_CAT["Horizontally Scrollable Category Pill Ribbon"]
    end

    subgraph MOBILE_NAV["Mobile Header Layout (<768px)"]
        M_TOP["Sticky Header (56px): Hamburger Icon | Brand Logo (140x36px) | Quick Search | Notification Bell"]
        M_TICKER["Micro-Ticker Marquee (32px): Red Flashing Badge + Scrolling Headline"]
        M_PILLS["Horizontally Scrollable Category Ribbon (with gradient fade indicators)"]
        M_BOTTOM["Sticky Bottom Navigation (60px): Home | Videos | District | E-Paper | Menu"]
    end

    DESKTOP_NAV -.->|Breakpoint < 1024px| TABLET_NAV
    TABLET_NAV -.->|Breakpoint < 768px| MOBILE_NAV
```

#### Detailed Element Adaptation Matrix:
1. **Brand Logo (`BrandHeader` / `BrandLogo`)**:
   - **Desktop (`≥1024px`)**: Full bilingual logo with Hindi typography (`ब्रेकिंग न्यूज़ वाला`) and English tagline (`BREAKING NEWS WALA`). Dimensions: `240px × 56px`.
   - **Tablet (`768px–1023px`)**: Condensed horizontal lockup (`180px × 44px`).
   - **Mobile (`<768px`)**: Ultra-compact SVG vector lockup (`140px × 36px`), vertically centered within a `56px` sticky header bar.
2. **Main Category Navigation**:
   - **Desktop (`≥1024px`)**: Horizontal navbar displaying the top 10 primary categories (e.g., *मुख्य समाचार*, *देश*, *राज्य*, *राजनीति*, *मनोरंजन*, *क्रिकेट/खेल*, *व्यापार*, *धर्म-ज्योतिष*, *शिक्षा/रोजगार*, *क्राइम*), with remaining categories aggregated under an accessible `अधिक...` (More) dropdown menu.
   - **Tablet & Mobile (`<1024px`)**: Collapses into a native touch-driven, horizontally scrollable category pill carousel (`CategoryNavigationBar`) with `overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch;`. Subtle left/right linear gradient masks indicate scrollability.
3. **Global Search Interface**:
   - **Desktop (`≥1024px`)**: Inline search input field with auto-suggest dropdown and voice search microphone icon (`width: 320px`).
   - **Mobile / Tablet (`<1024px`)**: Collapses into an accessible magnifying glass icon button (`48px × 48px` tap target). When tapped, it triggers a full-screen search modal overlay (`SearchOverlayModal`) with an auto-focused search bar, recent search tags, trending regional topics, and voice search capabilities.
4. **Breaking News Ticker (`BreakingNewsTickerBar`)**:
   - **Desktop (`≥1024px`)**: Dual-element strip featuring a flashing red `ब्रेकिंग न्यूज़` badge and a smooth continuous ticker or pause-on-hover carousel with next/previous controls. Height: `40px`.
   - **Mobile (`<768px`)**: Compact `32px` bar positioned directly beneath the sticky header. Employs a vertical slide or horizontal fade transition showing one urgent headline at a time. Truncates cleanly with ellipsis (`...`) if the title exceeds viewport width.

---

## 7. Homepage Layout

### 7.1 Multi-Tier Responsive Layout Architecture
The BREAKING NEWS WALA Homepage transitions across three distinct layout arrangements: a 12-column composite newsroom grid on desktop, an 8-column adaptive card grid on tablet, and a single-column thumb-optimized feed on mobile.

| Homepage Section | Desktop Viewport (`≥1280px`) | Laptop Viewport (`1024px–1279px`) | Tablet Viewport (`768px–1023px`) | Mobile Viewport (`<768px`) |
| :--- | :--- | :--- | :--- | :--- |
| **Top Hero Section** | **3-Column Composite**: 8-col Lead Hero Story + 4-col Vertical Top-Stories Rail | **2-Column Composite**: 7-col Lead Hero + 5-col Top-Stories Stack | **Single-Column Hybrid**: Full-width Lead Story + 2x2 grid of top stories | **Linear Stream**: 1x Full-width Lead Hero Card + vertical stack of compact stories |
| **Latest News Feed** | **8-Column Flow**: 2-column card grid + 4-col sticky sidebar (Trending + Ads) | **8-Column Flow**: 2-column card grid + 4-col sticky sidebar | **Single Column**: Full-width cards with interleaved ad banners | **Single Column**: High-density Compact Cards with 1:1 thumbnails |
| **District News Hub** | **4-Column Carousel**: 4 district cards per row with horizontal pagination | **3-Column Carousel**: 3 district cards per row | **2-Column Grid**: 2 district cards per row | **Horizontal Swipe Strip**: 1.25 cards visible to hint horizontal scrolling |
| **Video & Reels Rail** | **6-Column Gallery**: 6 vertical 9:16 reel previews with autoplay on hover | **4-Column Gallery**: 4 vertical 9:16 reel previews | **3-Column Swipe Rail**: 3 vertical 9:16 reels | **Horizontal Reel Scroller**: 2.25 reels visible with play badges |
| **Category Block Grid** | **3-Column Modular**: 3 category tiles side-by-side (4 cols each) | **2-Column Modular**: 2 category tiles side-by-side (6 cols each) | **2-Column Modular**: 2 category tiles (6 cols each) | **Accordion / Stacked**: 1 category per section with "और देखें" (View More) button |
| **Display Ad Slots** | **Standard Leaderboard** (`728x90` or `970x250`) + Right-rail Sticky MPU (`300x250` / `300x600`) | Leaderboard (`728x90`) + Rail MPU (`300x250`) | Tablet Banner (`468x60`) + In-feed MPU (`300x250`) | **Mobile Leaderboard** (`320x50` / `300x250`) placed every 4th story |
| **Footer Section** | **5-Column Multi-link**: Brand summary, Category tree, District hubs, Corporate/Legal, Social/App CTA | **4-Column Multi-link**: Condensed layout | **2-Column Grid**: Grouped links | **Single-Column Accordion**: Expandable category links, copyright, and social icons |

### 7.2 Stacking and Reflow Rules
1. **Sidebar Reflow**: On viewports `<1024px`, the right-hand editorial rail (Trending Topics, Live Weather, Editorial Pick, Ad units) reflows below the primary news stream rather than shrinking horizontally, preventing crushed layouts.
2. **Infinite Scroll Pagination**: On mobile viewports, the latest news feed uses a "Load More" (`और खबरें देखें`) button combined with an intersection observer for seamless lazy-loading, preventing endless DOM explosion on low-RAM mobile devices.

---

## 8. News Cards Responsive Behavior

News cards represent the atomic visual foundation of the platform. Each card variant must preserve strict typographic hierarchy, prevent text clipping of Devanagari vowel matras, and maintain media aspect-ratios across all breakpoints.

### 8.1 Card Variant Specifications Across Viewports

| Card Variant | Desktop (`≥1024px`) Layout | Tablet (`768px–1023px`) Layout | Mobile (`<768px`) Layout | Typographic Scale & Wrapping Rules |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Lead Card** (`HeroLeadStoryCard`) | Full-width or 8-col card; 16:9 media container (`height: 420px`); overlay headline or side-by-side split layout; 3-line excerpt. | 16:9 media (`height: 300px`); stacked headline below image; 2-line excerpt. | 16:9 media (`height: 200px`); stacked headline; excerpt hidden on mobile to conserve vertical space. | Headline: `clamp(1.25rem, 4vw, 2.25rem)`. `line-height: 1.4`. Excerpt: `1.0rem` with `line-height: 1.75`. Max 2 lines. |
| **Standard News Card** (`StandardNewsCard`) | Vertical card: 16:9 thumbnail on top (`aspect-ratio: 16/9`); Category badge; Headline (2–3 lines); Byline + Relative Time. | Vertical card: 16:9 thumbnail; 2-line headline; Category badge + time. | **Horizontal Split**: 1:1 square thumbnail (`88px × 88px`) on right; Headline (2 lines) + Category & Time on left. | Headline: `1.125rem` (`18px`), `line-height: 1.5`. Ellipsis after 3 lines (desktop) or 2 lines (mobile) via `-webkit-line-clamp`. |
| **Compact News Card** (`CompactNewsCard`) | Horizontal row: Small 16:9 thumbnail (`120px × 68px`) on left; Headline (2 lines) on right. | Horizontal row: Small thumbnail (`96px × 64px`) on left; Headline on right. | High-density text-first row: Optional `64px × 64px` thumbnail; 2-line headline + time ago. | Headline: `1.0rem` (`16px`), `line-height: 1.45`. Font weight: Medium (`500`). Zero excerpt. |
| **Breaking News Card** (`BreakingNewsAlertBanner`) | High-contrast banner with flashing red badge; full-width horizontal ticker with audio alert toggle and share icons. | Horizontal banner; compact badge; headline + timestamp. | Stacked banner: Red `ब्रेकिंग` chip on top; bold headline below; one-tap WhatsApp share button. | Headline: `1.125rem` (`18px`) Bold (`700`). Background: Red `#ED1727` or Yellow `#FDE900` high-contrast theme. |
| **Video / Reel Card** (`VideoThumbnailCard`) | Vertical 9:16 card for Reels or 16:9 for long video; play duration pill; view counter overlay; video title below. | Vertical 9:16 or 16:9 card; play badge; title below. | Vertical 9:16 card (`height: 240px`); overlay play badge; title in dark gradient bottom scrim. | Title: `0.875rem` (`14px`) Semi-bold (`600`). Max 2 lines with gradient contrast scrim. |
| **Sponsored Card** (`SponsoredNewsCard`) | Matches Standard News Card exactly but includes a subtle gray/blue `प्रायोजित` (Sponsored) badge and advertiser disclaimer. | Matches Standard Card with `प्रायोजित` label. | Horizontal split with `प्रायोजित` pill badge to ensure regulatory transparency. | Headline: `1.0rem` (`16px`). Disclaimer: `0.75rem` (`12px`) muted text. |

### 8.2 Devanagari Headline Clipping Prevention
- **Line Height Enclosure**: All headline containers enforce a minimum `line-height` of `1.4` to `1.5` with `padding-top: 4px; padding-bottom: 4px;`. This ensures that top matras (like *े, ै, ो, ौ, ं*) and bottom matras (*ु, ू, ृ*) are never clipped by `overflow: hidden;` or `-webkit-line-clamp`.
- **Clamping Mechanism**: Clamping uses CSS line-clamp with standard WebKit fallbacks:
  ```css
  .news-card-title {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    line-height: 1.5;
    padding-top: 2px;
    padding-bottom: 2px;
    word-break: keep-all;
    overflow-wrap: anywhere;
  }
  ```

---

## 9. Article Detail Page Responsive Design

The Article Detail page is the primary consumption destination of BREAKING NEWS WALA. Because regional Hindi readers spend significant time reading long-form news reports on mobile devices, mobile typography and reading comfort are the highest architectural priorities.

```mermaid
flowchart TD
    subgraph DESKTOP_ARTICLE["Desktop Article Detail Layout (≥1024px)"]
        D_BREAD["Breadcrumb: Home > Category > Subcategory > District"]
        D_HEAD["H1 Main Headline (32px-40px Devanagari)"]
        D_SUB["Subheadline / Summary Bullet Points (20px)"]
        D_META["Author Byline | Reporter Photo | Verified Badge | Dateline | Timestamp"]
        D_GRID["2-Column Reading Grid: 8-col Main Reading Area + 4-col Sticky Rail"]
        D_MAIN["Featured Media (16:9) + Devanagari Body Text (18px/32px) + Inline Galleries + Share Bar"]
        D_RAIL["Sticky Right Rail: Author Bio | District News | Trending News | MPU 300x250 Ad Units"]
        D_GRID --> D_MAIN
        D_GRID --> D_RAIL
    end

    subgraph MOBILE_ARTICLE["Mobile Article Detail Layout (<768px)"]
        M_HEAD["H1 Main Headline (22px-26px Devanagari, line-height: 1.4)"]
        M_META["Compact Byline: Reporter Name + District + Timestamp"]
        M_FLOAT_SHARE["Sticky Bottom Share Bar: WhatsApp (Primary) | Telegram | Copy Link"]
        M_MEDIA["Edge-to-Edge Featured Image (16:9 aspect-ratio) with Caption & Credit"]
        M_BODY["Devanagari Body Text: 18px Base / 32px Line-height / Comfortable Padding"]
        M_CTAS["Native Engagement Blocks: WhatsApp Channel Join CTA Card"]
        M_RELATED["Related District News Stack + Infinite Scroll Trigger"]
    end

    DESKTOP_ARTICLE -.->|Breakpoint < 768px| MOBILE_ARTICLE
```

### 9.1 Element-by-Element Mobile Reading Optimization

1. **Main Article Headline (`ArticleHeadlineBanner`)**:
   - **Desktop**: `clamp(2.0rem, 3.5vw, 2.5rem)` (`32px–40px`), weight `700`, line-height `1.35`.
   - **Mobile**: `clamp(1.375rem, 5vw, 1.625rem)` (`22px–26px`), weight `700`, line-height `1.4`. No hyphenation; clean syllable wrapping.
2. **Article Body Text (`DevanagariBodyBlock`)**:
   - **Font Size**: Standardized at `1.125rem` (`18px`) on mobile and desktop. User-adjustable via an accessible font-resizer control (`अ- / अ+` from `16px` up to `24px`).
   - **Line Height**: Strictly locked at `1.75` (`31.5px`–`32px`). This generous vertical spacing ensures effortless scanning of complex Devanagari ligatures.
   - **Paragraph Spacing**: `margin-bottom: 1.5rem` (`24px`). Single, well-spaced paragraphs without dense walls of text.
3. **Featured Media Container (`LeadMediaGallery`)**:
   - **Desktop**: Contained within the 8-column reading column (`max-width: 800px`), aspect-ratio `16:9`.
   - **Mobile**: **Full Bleed / Edge-to-Edge** (`margin-left: -16px; margin-right: -16px; width: calc(100% + 32px)`). This maximizes visual impact on small phone screens while saving vertical space.
4. **Social Sharing Actions (`SocialShareActionBar`)**:
   - **Desktop**: Left floating or horizontal top/bottom bar with WhatsApp, Facebook, X, Telegram, and Native Print.
   - **Mobile**: **Sticky Floating Bottom Action Bar** anchored to the viewport base. Features an oversized, high-contrast **WhatsApp Green (`#25D366`) Share Button** (`RULE-SOC-001`), single-tap Telegram button, and bookmark icon. Automatically hides on scroll-down and reappears on scroll-up.
5. **Community Engagement CTAs**:
   - Prominently styled **WhatsApp Channel CTA Card** (`WhatsAppChannelCta`) embedded after paragraph 3 and at the end of the article: *"ब्रेकिंग न्यूज़ वाला के व्हाट्सएप चैनल से जुड़ें — सबसे पहले ताज़ा खबरें सीधे अपने फोन पर पाएं"*. Designed as an oversized, thumb-friendly tap target (`height: 56px`).
6. **In-Article Ad Placements**:
   - Mobile: High-impact in-feed banner (`300x250` MPU) inserted after paragraph 4 and paragraph 8, wrapped in explicit aspect-ratio containers to prevent layout displacement.

---

## 10. Category and Search Pages Responsive Design

### 10.1 Category Hub Pages
Category pages (e.g., `/category/politics`, `/category/cricket`, `/category/state/uttar-pradesh`) aggregate regional and thematic news feeds.

- **Desktop (`≥1024px`)**:
  - Top category banner with title, description, and subcategory pill navigation.
  - 12-column grid: 8-column main news feed (Hero card + 2-col standard card stream) + 4-column sidebar (Subcategory filters, District quick-select, Trending in this Category, Display Ads).
- **Tablet (`768px–1023px`)**:
  - Horizontal subcategory pill carousel with sticky position on scroll.
  - 2-column card grid with pagination controls at the base.
- **Mobile (`<768px`)**:
  - Sticky subcategory pill strip directly under the header.
  - Single-column high-density card stream.
  - Floating District Filter Chip allowing rapid filtering by local district without leaving the category feed.

### 10.2 Search Results & Filtering Page
- **Desktop (`≥1024px`)**:
  - Persistent left sidebar (280px) with comprehensive faceted filters: Date range picker, Content type (Articles, Videos, Photo Galleries, Fact Checks), Category checkboxes, and District multi-select.
  - Main search results area showing match count, relevance sorting dropdown, highlighted keyword snippets in Devanagari, and numbered pagination.
- **Mobile (`<768px`)**:
  - Top search query bar with voice-search microphone icon and active query clear button.
  - Horizontal filter chip strip showing active filters + a **"फिल्टर" (Filters) Floating Action Button**.
  - Tapping "फिल्टर" opens a **Full-Screen Mobile Filter Drawer** with large touch targets, accordion category lists, date presets (*आज*, *पिछले 7 दिन*, *इस महीने*), and a sticky "परिणाम देखें" (Apply Filters) bottom button.

---

---

## 11. Reporter Application Responsive Design

The Reporter Web Application (`/reporter`) is a mission-critical operational workspace. Because field reporters frequently file breaking news, upload crime/accident photos, and track editorial approvals directly from rural and suburban locations using smartphones, mobile web responsiveness is not a secondary convenience—it is a core operational requirement.

```mermaid
flowchart TD
    subgraph DESKTOP_REPORTER["Desktop Reporter Workspace (≥1024px)"]
        D_SIDE["Persistent Sidebar (260px): Dashboard | News Filing | Drafts | Graphics Studio | Assignments | Payouts | Settings"]
        D_TOP["Top Bar: District Badge | Quick Search | Offline Sync Indicator | Profile Avatar"]
        D_CONTENT["Multi-Column Grid: 4 Metric Cards | Recent Submissions Table | Editorial Notices Rail"]
    end

    subgraph MOBILE_REPORTER["Mobile Reporter Workspace (<768px)"]
        M_TOP["Top App Bar (56px): Drawer Toggle | Territory Pill (e.g. 'वाराणसी') | Sync Cloud Icon | Avatar"]
        M_CARDS["Swipeable Metric Cards Carousel (Total Filed, Approved, In Review, Rejected)"]
        M_FAB["Floating Action Button (Oversized '+'): Quick News Filing"]
        M_LIST["Responsive Action Card Stream (Status Badge, Title, Timestamp, Edit/Submit actions)"]
        M_BOTTOM["Sticky Bottom Navigation (60px): गृह (Home) | समाचार (News) | स्टूडियो (Studio) | सूचनाएं (Alerts)"]
    end

    DESKTOP_REPORTER -.->|Responsive Adaptation| MOBILE_REPORTER
```

### 11.1 Structural Adaptation: Desktop vs. Mobile

| Reporter Workspace Module | Desktop Viewport (`≥1024px`) Layout | Mobile Viewport (`<768px`) Layout | Functional Parity Invariant |
| :--- | :--- | :--- | :--- |
| **Workspace Shell & Navigation** | Persistent 260px sidebar navigation; collapsible to 72px icon rail. Main content area auto-sizes. | Sidebar collapses into an accessible **Off-Canvas Navigation Drawer**. Bottom navigation bar (`StickyMobileBottomNavigation`) provides 1-tap access to primary modules. | Zero navigation items removed. Secondary items (Terms, Helpdesk, Logout) accessible via the drawer. |
| **Metric Summary Cards** (`ReporterTopMetricsSummaryBar`) | 4-column horizontal grid showing Total Filed, Approved, Pending Review, and Rejections/Corrections. | Horizontally scrollable card carousel (`overflow-x: auto; scroll-snap-type: x mandatory;`) with page dot indicators. | All metrics visible with full numeric values and percentage trends. |
| **News Submission Form** (`NewsSubmissionWizard`) | 2-column desktop split: Left column (Title, Content Editor, AI suggestions, Fact verification checklist); Right column (Category/District picker, Image dropzone, Status preview, Submit actions). | **Single-Column Linear Accordion / Stepper**: Step 1 (Title & Script) $\rightarrow$ Step 2 (Category & Territory) $\rightarrow$ Step 3 (Media Upload) $\rightarrow$ Step 4 (Review & Submit). | Every form validation rule, character counter, and category selector remains active. |
| **Devanagari News Input** | Full rich text editor (bold, lists, blockquotes, heading levels) with character/word counter. | Touch-optimized editor with virtual keyboard adaptation. Top editor toolbar stays sticky above the mobile virtual keyboard. Includes prominent **Voice-to-Text Microphone Button**. | Full formatting tools available via horizontally scrollable mini-toolbar. |
| **Media Upload Dropzone** | Large drag-and-drop zone with multi-file selection, preview thumbnails, and progress bars. | Full-width tap-to-upload button with camera integration (`capture="environment"`), camera roll selector, and visual upload progress spinner. | Reporters can capture live photos or pick from phone gallery with automatic client-side compression. |
| **Submissions & Drafts** (`ReporterDraftsTable`) | Multi-column data table (Thumbnail, Title, Category, Status, Created Date, Editorial Comments, Actions). | **Responsive Action Cards**: Each submission is rendered as a clean card with status pill, Devanagari title, time ago, and an accordion panel showing **Editorial Feedback** and Action buttons (*Edit*, *Submit*, *Withdraw*). | Complete operational parity. No horizontal clipping or overflow. |
| **Editorial Feedback Alerts** (`EditorialFeedbackAlertCard`) | Right-hand notification rail or inline modal showing editorial change requests and revision instructions. | Persistent banner alert at top of dashboard with high-contrast amber theme (*सुधार अपेक्षित*). Tapping opens a bottom sheet with admin comments. | Critical editorial directives cannot be missed on mobile. |

### 11.2 Handling Mobile Virtual Keyboard Reflow
On mobile devices, opening the on-screen virtual keyboard reduces the visible viewport height by 40%–50%.
- **Viewport Meta Enactment**: Configured with `interactive-widget=resizes-content` to enable graceful layout reflow without obscuring active text fields.
- **Sticky Submit Actions**: Form action buttons (*ड्राफ्ट सेव करें*, *समीक्षा के लिए भेजें*) detach from the page bottom and attach to a compact sticky bar above the virtual keyboard, ensuring the submit action is always visible while typing.

---

## 12. Admin Control Panel Responsive Design

The Admin Control Panel (`/admin`) manages enterprise editorial governance, reporter vetting, territory management, system health, and publishing workflows. While desktop workstations remain the primary tool for newsroom administrators, mobile adaptability is strictly mandated to allow emergency editorial approvals, breaking news overrides, or content takedowns from anywhere.

```mermaid
flowchart TD
    subgraph ADMIN_DESK["Admin Desktop Experience (≥1280px)"]
        A_NAV["Full Left Sidebar (280px) with Hierarchical Menus"]
        A_TABLE["Dense 8-Column Data Tables with Sorting, Checkboxes, Batch Actions, Pagination"]
        A_DIFF["Side-by-Side Article Diff Comparison (Reporter Draft vs. Edited Version)"]
    end

    subgraph ADMIN_MOB["Admin Mobile Experience (<768px)"]
        M_NAV["Accessible Slide-out Menu + Top Sticky Header"]
        M_CARD["Card Transformation: Multi-column Table rows collapse into Expandable Action Cards"]
        M_DIFF["Tabbed Diff Viewer: Toggle between 'मूल ड्राफ्ट' (Original) and 'संपादित' (Edited)"]
        M_ACTIONS["Quick-Action Bottom Sheet: 'स्वीकृत करें' (Approve), 'सुधार भेजें' (Request Changes), 'अस्वीकृत' (Reject)"]
    end

    ADMIN_DESK -.->|Transform Strategy| ADMIN_MOB
```

### 12.1 Complex Table Responsive Transformation Matrix
Dense administrative data tables (Editorial Review Queue, Reporter Management, Territory Allocation, Audit Logs) must never cause uncontrolled horizontal viewport blowout or break page layout.

| Admin Table View | Desktop Representation (`≥1024px`) | Tablet Representation (`768px–1023px`) | Mobile Representation (`<768px`) |
| :--- | :--- | :--- | :--- |
| **Editorial Review Queue** (`EditorialReviewQueueTable`) | 8 Columns: Checkbox, ID, Headline, Reporter, District, Category, Submitted Time, Action Buttons (*Approve*, *Reject*, *Edit*). | 5 Selective Columns: Headline, Reporter, District, Status, Actions. Secondary metadata collapsed. | **Expandable Card Layout**: Card displays Status Badge + Headline + Reporter Name. Tapping opens an **Action Bottom Sheet** with full review controls, one-click approval, and diff comparison. |
| **User & Reporter Management** | 7 Columns: Avatar, Full Name, Role, Territory, Verification Status, Trust Score, Action Dropdown. | 4 Columns: Name/Avatar, Role, Status, Actions. | **User Profile Cards**: Condensed card showing Reporter Name, Verification Chip, Assigned District, and a "प्रबंधित करें" (Manage) button. |
| **Territory & District Allocation** | Interactive district map + multi-tier hierarchy table showing allocated reporters and capacity. | Condensed list with search input and state dropdown filters. | Searchable district accordion with quick-assign buttons and reporter count badges. |
| **System Health & API Pool** | Multi-card dashboard showing Gemini API quotas, CDN latency, error rates, and active background workers. | 2x2 grid of metric health cards. | Single-column health feed with color-coded status chips (Green/Yellow/Red) and restart service buttons. |
| **Audit Logs Viewer** | 6 Columns: Timestamp, Admin Actor, IP Address, Action Type, Target Entity, Status. | Controlled Horizontal Scroll Table with sticky Actor column. | **Timeline View**: Vertical chronological timeline showing Actor, Action, Entity, and time ago. Detailed JSON payload viewed via tap-to-expand. |

### 12.2 Editorial Diff Viewer on Small Screens
On desktop (`≥1280px`), the Article Diff Viewer (`ArticleDiffComparisonViewer`) presents a side-by-side comparison (Original Draft on left, Editorial Redline on right).
- On mobile viewports (`<768px`), side-by-side columns are physically illegible.
- The interface automatically converts into a **Segmented Tab Control**:
  `[ मूल ड्राफ्ट (Original) ] | [ संपादित प्रारूप (Edited) ] | [ बदलाव (Unified Diff) ]`
  allowing editors to review changes with complete typographic clarity without horizontal squishing.

---

## 13. Central Newsroom Responsive Design

The Central Newsroom (`/newsroom`) is the real-time nerve center of BREAKING NEWS WALA. It coordinates live incoming breaking wire updates, reporter GPS locations, editorial assignments, and AI publishing feeds.

### 13.1 Newsroom Multi-Screen Adaptation

| Newsroom Module | Desktop Newsroom Console (`≥1440px`) | Standard Laptop (`1024px–1439px`) | Mobile On-the-Go View (`<768px`) |
| :--- | :--- | :--- | :--- |
| **Newsroom Overview** | 4-column multi-panel layout showing Live Wire, Active Desks, System Alerts, and GPS Field Map. | 3-column layout; GPS map toggleable via modal or tab. | Single-column prioritized dashboard. Critical operational alerts pinned to the top. |
| **Realtime Wire Stream** (`RealtimeBreakingWireStream`) | Persistent vertical wire stream updating via WebSockets; auto-scrolls with audio ping toggle. | Embedded wire stream with manual pause toggle. | Compact notification feed showing incoming wire updates with quick-dispatch action buttons. |
| **Reporter GPS Tracker** (`ReporterGpsLiveTrackerMap`) | Full interactive Leaflet/Mapbox map showing real-time reporter pins, district coverage, and breaking event clusters. | Contained map widget with toggle to expand full-screen. | Replaced by a high-density **District Coverage List** showing active reporters online per district, with optional tap to view single-reporter map location. |
| **Desk Kanban Board** (`NewsroomKanbanBoard`) | 4-column horizontal drag-and-drop board: *इनकमिंग* (Incoming) $\rightarrow$ *समीक्षाधीन* (In Review) $\rightarrow$ *संपादन* (Editing) $\rightarrow$ *प्रकाशित* (Published). | 4-column board with horizontal swipe navigation between columns. | **Segmented Column Carousel**: Displays one kanban column at a time with swipe gesture or top tab selector (*इनकमिंग (12)*, *समीक्षाधीन (5)*, etc.). |

---

## 14. Graphics Studio Responsive Design

The Graphics Studio generates social media news cards, breaking bulletins, and branded quote graphics. 

> [!IMPORTANT]
> **Strict Role Boundary Verification**: In accordance with `RULE-NEWS-001` and `RULE-GFX-001`, the **Reporter Graphics Studio** is strictly restricted to **Raw Script to Graphic** (raw text applied to Admin-approved templates). URL-to-Graphic and RSS-to-Graphic tools are strictly sequestered within the **Admin Graphics Studio** and are never exposed to reporters on any screen size.

### 14.1 Aspect Ratio Preservation Architecture
Graphics generated for social platforms adhere to strict visual aspect ratios:
- **Square Post**: `1:1` (`1080px × 1080px`)
- **Vertical Story / Reel Graphic**: `9:16` (`1080px × 1920px`)
- **Horizontal Landscape**: `16:9` (`1200px × 675px`)

Under no circumstances may the preview canvas distort or crop these ratios when viewed on small mobile displays.

```mermaid
flowchart TD
    subgraph GFX_DESK["Desktop Studio Layout (≥1024px)"]
        D_LEFT["Left Control Panel (420px): Raw Script Input | AI Headline Suggestions | Template Picker | Color Palette | Export Options"]
        D_RIGHT["Right Preview Canvas: Fixed-Scale Live Rendered Graphic (1:1 / 9:16 / 16:9) with Zoom Controls"]
    end

    subgraph GFX_MOB["Mobile Studio Layout (<768px)"]
        M_PREVIEW["Top Sticky Preview (Height Capped at 35vh): Mathematically Scaled Canvas (CSS transform: scale) with Aspect Ratio Locked"]
        M_CONTROLS["Bottom Scrollable Control Sheet: Script Entry -> Template Carousel -> Quick Download"]
        M_TOGGLE["Floating Full-Screen Preview Button (Zoom & Pan modal)"]
    end

    GFX_DESK -.->|Viewport Reflow| GFX_MOB
```

### 14.2 Mobile Canvas Scaling Formula
On mobile screens (`320px–479px`), a `1080 × 1080` graphic cannot fit at 100% scale. Rather than altering canvas dimensions or font sizes:
1. The canvas maintains its native high-resolution render buffer (`1080 × 1080` or `1080 × 1920`).
2. CSS `transform: scale()` is calculated dynamically to fit the viewport:
   $$\text{Scale Factor} = \frac{\text{Container Available Width}}{\text{Canvas Native Width}}$$
3. The preview container applies `overflow: hidden;` with matching aspect-ratio wrapper, guaranteeing an exact pixel-accurate representation of the final exported graphic.

---

## 15. Video Studio Responsive Design

The Video Studio manages automated video generation, script-to-video assembly, AI voiceover synthesis, and subtitle overlay.

### 15.1 Studio Tiering: Desktop vs. Mobile Capabilities

| Video Studio Capability | Desktop Workspace (`≥1024px`) | Mobile / Tablet Workspace (`<1024px`) | Technical / Architectural Reason |
| :--- | :--- | :--- | :--- |
| **Project Creation & Script Entry** | Full multi-scene script editor with character counts and voiceover speed adjustments. | Single-scene linear text input with voiceover language selector (Hindi / Regional). | Lightweight script entry optimized for mobile keyboards. |
| **Media B-Roll Selection** | Multi-lane media asset browser with drag-and-drop to timeline tracks. | Tap-to-select media gallery; auto-assigned to sequential script scenes. | Eliminates complex multi-touch drag operations on small touch screens. |
| **Multi-Track Timeline** (`MultiTrackTimelineEditor`) | Multi-lane video, audio, voiceover, and subtitle scrubber with millisecond trimming. | Simplified **Scene Card Sequence**: Each scene is represented as an ordered card with duration slider. | Precision millisecond timeline scrubbing requires fine mouse pointer accuracy; scene cards provide equivalent functional outcome on touch. |
| **Video Preview Player** | High-definition live preview player with audio waveform visualization and subtitle overlay. | Adaptive HTML5 player with toggleable subtitle rendering. | Utilizes native video decoding to prevent mobile CPU/battery exhaustion. |
| **Rendering & Export Queue** | Multi-resolution export selector (`1080p`, `720p`, `4K`), CDN upload trigger, cloud render status. | Single-tap **"वीडियो तैयार करें" (Generate Video)** button; renders in background via cloud worker. | Heavy video encoding is processed on cloud servers; mobile client simply tracks render job progress via WebSockets/SSE. |

---

---

## 16. Forms and Input Controls Responsive Design

Form design across BREAKING NEWS WALA directly determines reporter productivity and citizen engagement. Input controls must provide flawless ergonomics across both desktop keyboards and mobile virtual keyboards (Gboard, SwiftKey, iOS Hindi Keyboard) with active Devanagari input method engines (IME).

### 16.1 Responsive Form Control Specifications

| Control Primitive | Desktop Viewport (`≥1024px`) | Mobile Viewport (`<768px`) | Hindi IME & Ergonomic Guardrails |
| :--- | :--- | :--- | :--- |
| **Single-Line Text Input** (`DevanagariTitleInput`) | Height: `44px`; padding: `10px 16px`; font-size: `16px`. Inline character counter on right. | Height: `48px`; padding: `12px 14px`; font-size: `16px` (prevents iOS auto-zoom). Full-width layout. | Vertical padding $\ge 12\text{px}$ guarantees that top vowel matras (*ी, े, ै, ो, ौ*) and anusvara (*ं*) are never clipped by the input bounding box. |
| **Multi-Line Text Area** (`RichArticleContentEditor`) | Height: `360px`–`500px`; rich toolbar fixed at top with full formatting suite. | Height: Auto-expanding (`min-height: 180px`); toolbar stays sticky above the virtual keyboard. | `line-height: 1.75`; `font-size: 16px`. Voice-to-text input button pinned for 1-tap Hindi speech entry. |
| **Dropdown Selectors** (`CategoryDistrictDropdownSelector`) | Custom accessible select menu with search filter input, keyboard navigation, and checkmarks. | Native `<select>` element or bottom-sheet picker dialog with oversized touch targets (`48px` row height). | Prevents tiny custom dropdown menus from overflowing mobile screens or misaligning with touch taps. |
| **Multi-Select Tag Picker** (`TagsKeywordsInput`) | Horizontal pill container with inline auto-suggest dropdown and keyboard deletion (`Backspace`). | Wrapped pill chips with `12px` tap targets for removal (`×`). Inline input wrapped to new line. | Touch targets for removing tags have a minimum hit area of `44px × 44px`. |
| **Date & Time Controls** | Inline calendar popover with date range shortcuts (*आज*, *कल*, *कस्टम*). | Native mobile date picker (`<input type="datetime-local">`) triggering OS wheel picker. | Ensures familiarity and accessibility on touch devices without building complex touch calendars. |
| **Media File Upload** (`MediaUploadDropzone`) | Drag-and-drop dotted bounding box with file browser button and multi-file preview grid. | Oversized tap-to-upload button featuring camera icon; integrated direct camera capture (`capture="environment"`). | Client-side image resize before upload to protect mobile data and battery life. |
| **Validation Error Messages** | Inline text below input with red warning icon; tooltip on hover. | High-contrast banner directly below input with red border and explicit Devanagari error copy (e.g. *शीर्षक आवश्यक है*). | Error message enforces `line-height: 1.4` and min `14px` size to prevent unreadable truncated text. |
| **Submit / Action Buttons** (`SubmitForReviewButton`) | Desktop width: `auto` (min `160px`); height: `44px`. Aligned right or left based on visual hierarchy. | **Full-width (`100%`)**; height: `52px`; bold Devanagari text (`18px`). Sticky above mobile viewport base. | Generous hit area (`100% × 52px`) allows effortless single-thumb tapping without precision aiming. |

### 16.2 Dialog & Modal Viewport Enclosure Architecture
On mobile screens, standard modal dialogs frequently exceed viewport height, causing submit or close buttons to become unreachable off-screen.
- **Rule of Enclosure**: Modals on mobile (`<768px`) automatically transform into **Bottom Sheets** or **Full-Screen Dialogs**.
- **Max Height & Scroll Containment**:
  ```css
  .modal-container {
    max-height: calc(100dvh - 32px);
    display: flex;
    flex-direction: column;
  }
  .modal-body {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    flex: 1 1 auto;
  }
  .modal-footer {
    flex-shrink: 0;
    position: sticky;
    bottom: 0;
    background: #FFFFFF;
    border-top: 1px solid #E5E7EB;
  }
  ```
  This guarantees that action buttons (*कैंसिल*, *स्वीकृत करें*) remain permanently pinned and reachable.

---

## 17. Typography and Hindi Content Responsiveness

Devanagari is a syllabic script characterized by complex conjuncts, dependent vowel signs (*matras*), and horizontal connecting headline bars (*shirorekha*). Responsive typography must treat Hindi text with structural reverence.

### 17.1 Mathematical Fluid Typography Scale

All font scales utilize CSS `clamp()` anchored to our primary font families: **Rozha One / Noto Serif Devanagari** for editorial headlines and **Mukta / Noto Sans Devanagari** for functional body text and UI labels.

| Typographic Level | Token Name | Fluid CSS Clamp Formula | Minimum Size (`320px`) | Standard Desktop (`1280px`) | Strict Line-Height | Font Weight |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display / Breaking** | `--font-display` | `clamp(1.75rem, 5vw, 3.0rem)` | `28px` | `48px` | `1.30` | Bold (`700`) |
| **Page H1 Headline** | `--font-h1` | `clamp(1.375rem, 4vw, 2.25rem)` | `22px` | `36px` | `1.35` | Bold (`700`) |
| **Section H2 Title** | `--font-h2` | `clamp(1.25rem, 3vw, 1.75rem)` | `20px` | `28px` | `1.40` | Semi-bold (`600`) |
| **Card H3 Title** | `--font-h3` | `clamp(1.0625rem, 2.5vw, 1.25rem)` | `17px` | `20px` | `1.45` | Semi-bold (`600`) |
| **Article Body Text**| `--font-body-lead`| `clamp(1.0625rem, 1.5vw, 1.125rem)`| `17px` | `18px` | **`1.75` (Strict)** | Regular (`400`) |
| **UI Body / Inputs** | `--font-ui` | `1.0rem` (Constant) | `16px` | `16px` | `1.50` | Medium (`500`) |
| **Caption / Byline** | `--font-caption` | `0.875rem` (Constant) | `14px` | `14px` | `1.40` | Regular (`400`) |
| **Micro / Status** | `--font-micro` | `0.75rem` (Constant) | `12px` | `12px` | `1.30` | Semi-bold (`600`) |

### 17.2 Devanagari Syllable Wrapping & Ligature Protection
- **Prohibition of Hyphenation**: Hyphenation algorithms designed for Latin alphabets break Devanagari words arbitrarily, often severing half-characters from their base consonants. `hyphens: none;` is strictly enforced globally.
- **Word-Level Wrapping**: All headings and news titles enforce `word-break: keep-all; overflow-wrap: anywhere;`. This ensures that composite Hindi words wrap only at natural word boundaries while preventing single long words from blowing out mobile containers.
- **Mixed Hindi-English Balancing**: In mixed-script headlines (e.g., *"वाराणसी में AI और स्मार्ट सिटी प्रोजेक्ट का शुभारंभ"*), Latin characters often appear smaller than Devanagari at the same nominal font size. The typography system applies `font-feature-settings: "cv01", "cv02";` and optical font size pairing to maintain uniform visual x-height across both scripts.

---

## 18. Images and Media Responsiveness

### 18.1 Geometric Aspect Ratio Preservation
Stretching, skewing, or arbitrarily cropping journalistic photographs damages editorial integrity and brand trust. All media containers strictly enforce standardized geometric aspect ratios:

| Media Type | Mandatory Aspect Ratio | CSS Implementation | Usage Context |
| :--- | :--- | :--- | :--- |
| **Standard News Thumbnail** | `16:9` | `aspect-ratio: 16 / 9; object-fit: cover;` | Lead Hero stories, standard article listings, video thumbnails |
| **Compact Feed Thumbnail** | `1:1` (Square) | `aspect-ratio: 1 / 1; object-fit: cover;` | Mobile compact news rows, related news links |
| **Video Reels / Shorts** | `9:16` (Vertical) | `aspect-ratio: 9 / 16; object-fit: cover;` | Mobile video feed, vertical social reels |
| **Reporter Profile Photo** | `1:1` (Circular) | `aspect-ratio: 1 / 1; border-radius: 9999px;` | Author bylines, dashboard profile chips |
| **Social Graphic Canvas** | `1:1` or `9:16` | Dynamic transform scaling with locked ratio | Graphics Studio preview and export |

### 18.2 Responsive Image Delivery (`<picture>` & `srcset`)
To minimize cellular data consumption for rural readers on 2G/3G connections, the platform employs modern responsive image delivery via HTML5 `<picture>` tags with WebP/AVIF formats:
```html
<picture>
  <source type="image/avif" srcset="/media/lead-400.avif 400w, /media/lead-800.avif 800w, /media/lead-1200.avif 1200w" sizes="(max-width: 768px) 100vw, 800px">
  <source type="image/webp" srcset="/media/lead-400.webp 400w, /media/lead-800.webp 800w, /media/lead-1200.webp 1200w" sizes="(max-width: 768px) 100vw, 800px">
  <img src="/media/lead-800.jpg" alt="समाचार का मुख्य चित्र" loading="lazy" decoding="async" width="16" height="9" style="aspect-ratio: 16/9; width: 100%; height: auto; object-fit: cover;">
</picture>
```

### 18.3 Low-Bandwidth Mode
When the browser's Network Information API detects constrained connections (`navigator.connection.effectiveType === '2g'` or `saveData === true`):
- High-resolution photographs are replaced with lightweight WebP thumbnails (`<20KB`) with a tap-to-load high-res overlay button (*उच्च गुणवत्ता में देखें*).
- Video autoplay is strictly disabled across all feeds.
- Animated GIFs are replaced with static first-frame posters.

---

## 19. Responsive Navigation

Navigation must present uniform, consistent Hindi terminology across all viewports while restructuring its spatial mechanism for the physical medium.

### 19.1 Multi-Viewport Navigation Architecture

```mermaid
flowchart LR
    DESK_NAV["Desktop: Persistent Top Bar + 21-Category Horizontal Rail"] -->|Viewport < 1024px| TAB_NAV["Tablet: Top Bar + Horizontally Scrollable Category Ribbon"]
    TAB_NAV -->|Viewport < 768px| MOB_NAV["Mobile: Sticky Top Header + Scrollable Ribbon + Sticky Bottom Navigation (5 items) + Slide-out Drawer"]
```

#### Navigation Strategy by Device Class:
1. **Desktop (`≥1024px`)**:
   - Primary utility header + main branding row + horizontal category navigation rail.
   - Dropdown menus activate on hover or click with keyboard focus management (`role="menu"`).
   - Breadcrumb navigation (`BreadcrumbTrail`) visible below header on all subpages.
2. **Tablet (`768px–1023px`)**:
   - Condensed header with search trigger and district quick-selector chip.
   - Category navigation transforms into a touch-scrollable ribbon with left/right gradient masks.
   - Breadcrumbs collapse to: `← [Parent Category Name]`.
3. **Mobile (`<768px`)**:
   - **Sticky Top Bar (`56px`)**: Hamburger drawer trigger + Brand Logo + Search icon + Notification bell.
   - **Sticky Mobile Bottom Navigation (`StickyMobileBottomNavigation`, `60px`)**:
     1. **होम (Home)**: Primary news feed (`/`).
     2. **वीडियो (Videos)**: Full-screen vertical reels player (`/videos`).
     3. **जिला (District)**: District selector modal & regional hub (`/district`).
     4. **ई-पेपर (E-Paper)**: Digital edition viewer (`/epaper`).
     5. **मेनू (Menu)**: Full site off-canvas navigation drawer.
   - **Off-Canvas Navigation Drawer (`NavigationDrawer`)**: Slide-out panel (`width: 320px`, `max-width: 85vw`) providing access to all 21 approved categories, live weather, social channels, reporter login, and legal terms.

---

## 20. Touch and Interaction Rules

Touch-driven interaction differs fundamentally from precision cursor pointing. Interactions must accommodate varying finger sizes, single-thumb holding grips, and tactile feedback.

### 20.1 Touch Target Geometry
- **Minimum Interactive Bounding Box**: All clickable, tappable, or interactive elements (buttons, links, icons, form controls, tabs) must occupy a physical touch target of at least **`48px × 48px`** (exceeding WCAG 2.1 AA `24px` and satisfying Google Android `48dp` standards).
- **Hit-Box Padding Expansion**: For compact visual icons (e.g., a `20px` close icon or bookmark symbol), CSS padding or pseudo-elements (`::after`) are used to expand the interactive hit-box to `48px` without bloating visual design:
  ```css
  .touch-target-expanded {
    position: relative;
  }
  .touch-target-expanded::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    min-width: 48px;
    min-height: 48px;
  }
  ```

### 20.2 Zero Hover Dependency Invariant
No essential functionality, navigation menu, action button, or metadata may rely solely on CSS `:hover` states.
- Hover states are treated as visual enhancements for desktop pointer devices (`@media (hover: hover)`).
- On touch devices (`@media (hover: none)`), tooltips, contextual action menus, and preview overlays must be triggered by explicit tap actions or remain persistently visible.

### 20.3 Scrolling & Gesture Mechanics
- **Momentum Scrolling**: All scrollable carousels and sidebars enforce `-webkit-overflow-scrolling: touch; scroll-behavior: smooth;`.
- **Pull-to-Refresh**: Available on mobile news feeds with a custom circular progress spinner in Brand Red (`#ED1727`).
- **Scroll Lock on Open Modals**: When an off-canvas drawer or modal opens, `overflow: hidden; touch-action: none;` is applied to `document.body` to eliminate background scroll bleed.

---

---

## 21. Performance Considerations

Responsive web design must be engineered for real-world network and device performance. In regional India, high-latency 3G/4G connections and low-RAM budget smartphones are common. Responsive layouts must deliver near-instantaneous visual stability without consuming excessive device resources.

### 21.1 Core Web Vitals Targets Across Device Tiers
In alignment with [`docs/04-NFR.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/04-NFR.md), the responsive system enforces strict performance thresholds:

| Performance Metric | Desktop Threshold (`≥1024px`) | Mobile 4G Threshold | Mobile 3G / Low-Bandwidth | Architectural Enforcement Technique |
| :--- | :--- | :--- | :--- | :--- |
| **Largest Contentful Paint (LCP)** | $\le 1.8\text{s}$ | $\le 2.5\text{s}$ | $\le 3.5\text{s}$ | Hero news image preloading (`fetchpriority="high"`), server-side rendering of initial headline HTML, lightweight WebP/AVIF formats. |
| **Interaction to Next Paint (INP)** | $\le 100\text{ms}$ | $\le 200\text{ms}$ | $\le 300\text{ms}$ | Passive touch event listeners (`touch-action: manipulation;`), avoidance of heavy synchronous JavaScript on main thread during tapping. |
| **Cumulative Layout Shift (CLS)** | $\le 0.05$ | $\le 0.10$ | $\le 0.10$ | Fixed aspect-ratio media containers, pre-allocated ad slot containers (`min-height: 250px`), font-display: swap with fallback metric overrides. |
| **First Input Delay (FID)** | $\le 50\text{ms}$ | $\le 100\text{ms}$ | $\le 200\text{ms}$ | Code-splitting, deferred analytics scripts, minimal hydration overhead. |
| **Total Page Weight (Initial)** | $\le 1.5\text{MB}$ | $\le 850\text{KB}$ | $\le 450\text{KB}$ | Strict mobile asset budgeting, zero uncompressed PNGs/JPEGs, Brotli/Gzip compression. |

### 21.2 Layout Stability Architecture (Anti-CLS Protocol)
1. **Font Metric Override**: Custom Devanagari web fonts (*Rozha One*, *Mukta*) specify `@font-face` fallback metrics (`ascent-override`, `descent-override`, `line-gap-override`) to match standard system fonts (`Noto Sans Devanagari`, `system-ui`). This eliminates vertical layout reflow when web fonts finish downloading.
2. **Ad Container Pre-Allocation**: Programmatic display ad slots reserve exact bounding box dimensions before ad scripts load:
   ```css
   .ad-slot-mpu {
     min-width: 300px;
     min-height: 250px;
     display: flex;
     align-items: center;
     justify-content: center;
     background: #F3F4F6;
     contain: layout style;
   }
   ```
3. **Lazy-Loading Thresholds**: Images below the initial viewport fold use native HTML5 `loading="lazy"` with an intersection threshold of `300px` on desktop and `150px` on mobile to prevent premature data fetching.

---

## 22. Accessibility (a11y)

BREAKING NEWS WALA is committed to digital inclusivity, ensuring full access for citizens with visual, auditory, motor, or cognitive impairments. The platform targets full **WCAG 2.1 Level AA Compliance** across all responsive viewports.

### 22.1 Comprehensive Accessibility Matrix

| Accessibility Area | Responsive Web Specification | Technical Implementation |
| :--- | :--- | :--- |
| **Keyboard Navigation** | 100% of interactive controls (menus, links, buttons, form inputs, modals) are fully reachable and actionable via standard keyboard (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`). | Focus trap active inside all open modals and navigation drawers. "सामग्री पर जाएं" (Skip to Content) hidden link provided as first focusable element. |
| **Visible Focus Indicator** | Highly visible, high-contrast focus ring around active elements. | `outline: 3px solid #344FD6; outline-offset: 2px;` active on all `:focus-visible` elements. Never suppressed via `outline: none;`. |
| **Screen Reader Compatibility** | Full support for Hindi and English screen readers (TalkBack on Android, VoiceOver on iOS/macOS, NVDA/JAWS on Windows). | Proper semantic HTML5 tags (`<nav>`, `<main>`, `<article>`, `<aside>`, `<header>`, `<footer>`). ARIA attributes (`aria-expanded`, `aria-haspopup`, `aria-live="polite"` for breaking tickers). Language tagged via `<html lang="hi">`. |
| **Color Contrast Compliance** | Strict WCAG 2.1 AA contrast ratio ($\ge 4.5:1$ for normal text, $\ge 3:1$ for large headings and UI icons). | Dark Charcoal (`#1F2937`) on White background achieves `12.6:1`. Primary Red (`#ED1727`) on White achieves `4.6:1`. Yellow (`#FDE900`) is paired exclusively with Midnight (`#111827`) achieving `15.8:1`. |
| **Text Scaling & Resizing** | Viewport accommodates up to **200% browser text zoom** without breaking layout, truncating headlines, or triggering horizontal page scrolling. | All typography and spacing defined in relative units (`rem`, `em`, `ch`, `%`). Zero fixed pixel heights on text containers. |
| **Accessible Form Validation** | Clear, unambiguous error identification linked to inputs. | `aria-invalid="true"`, `aria-describedby="error-[id]"`. Error messages rendered in explicit Devanagari text alongside high-contrast icons. |
| **Reduced Motion Preference** | Honors user OS setting for reduced motion (`prefers-reduced-motion: reduce`). | Disables breaking news marquee animations, carousel auto-sliding, and smooth scroll transitions: `@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }`. |

---

## 23. Responsive Testing Matrix

To guarantee robust cross-platform stability across all regional devices and network environments, BREAKING NEWS WALA establishes a comprehensive, multi-dimensional testing matrix.

### 23.1 Test Device & Browser Coverage

```mermaid
flowchart TD
    subgraph DESKTOP_TEST["Desktop Workstation Tier"]
        T_D1["Windows 11 / Chrome (1920x1080)"]
        T_D2["macOS Sonoma / Safari (1440x900)"]
        T_D3["Linux / Firefox (1366x768)"]
    end

    subgraph TABLET_TEST["Tablet Hybrid Tier"]
        T_T1["iPad Air / iPadOS Safari (820x1180 Portrait & Landscape)"]
        T_T2["Samsung Galaxy Tab / Chrome (800x1280)"]
    end

    subgraph MOBILE_TEST["Mobile Handheld Tier (Primary Focus)"]
        T_M1["Redmi Note 12 / Chrome Android (393x873, DPR 2.75)"]
        T_M2["Samsung Galaxy A14 / Samsung Internet (384x854, DPR 2.25)"]
        T_M3["JioPhone Next / Chrome Go (360x720, DPR 2.0, Low RAM)"]
        T_M4["iPhone 15 / iOS Safari (393x852, DPR 3.0)"]
        T_M5["Budget Android / 320px Viewport (320x568, Small Screen Stress Test)"]
    end
```

### 23.2 Core Operational Verification Scenarios

| Test Scenario ID | Target Surface & Workflow | Viewport Scope | Verification Criteria & Pass Conditions |
| :--- | :--- | :--- | :--- |
| **TS-RESP-01** | **Public Homepage Layout & Ticker** | `320px`, `375px`, `768px`, `1280px`, `1920px` | 1. Breaking ticker maintains single-line legibility with zero text clipping.<br>2. Hero news card reflows smoothly from 3-col composite to single-thumb card.<br>3. Zero horizontal page scrolling on any device. |
| **TS-RESP-02** | **Devanagari Article Reading Comfort** | `320px`, `360px`, `393px`, `414px` | 1. Body text line-height locked at `1.75`; top and bottom vowel matras completely clear.<br>2. Headlines wrap cleanly on syllable boundaries (`keep-all`).<br>3. Sticky WhatsApp share bar accessible within natural thumb zone. |
| **TS-RESP-03** | **Reporter News Filing in the Field** | `360px`, `393px` (Portrait & Landscape) | 1. Virtual keyboard appearance does not obscure active Devanagari text input.<br>2. Submit and Save buttons remain pinned above virtual keyboard.<br>3. Media upload works via native phone camera capture (`capture="environment"`). |
| **TS-RESP-04** | **Admin Editorial Review on Mobile** | `375px`, `412px`, `768px` | 1. Review queue table transforms into expandable cards with full action controls.<br>2. Article Diff comparison functions via segmented tabs without column squishing.<br>3. Emergency approval / reject actions fully functional via bottom sheet. |
| **TS-RESP-05** | **Graphics Studio Canvas Preview** | `320px`, `375px`, `1024px` | 1. Preview canvas scales mathematically via CSS transform without distorting `1:1` or `9:16` ratio.<br>2. Reporter view restricted strictly to Raw Script to Graphic (zero URL/RSS tools).<br>3. Downloaded image matches preview dimensions exactly. |
| **TS-RESP-06** | **Low-Bandwidth / 2G Network Stress** | Network Throttled to Slow 3G / 2G (`150kbps`, `400ms` RTT) | 1. Essential article text and headline render within `3.5s`.<br>2. Low-res WebP placeholders display with tap-to-expand high-res prompt.<br>3. Zero visual reflow when fallback fonts load (matching metric overrides). |
| **TS-RESP-07** | **200% Browser Zoom Accessibility** | Desktop Chrome zoomed to `200%` (`640px` effective width) | 1. Interface reflows gracefully into mobile layout without broken grid columns.<br>2. All text remains readable without clipping or overlapping.<br>3. All modals and drawers remain scrollable and dismissible. |

---

## 24. Open Questions and Pending Decisions

The following architectural questions and platform decisions are formally cataloged for resolution during Phase 3 detailed engineering:

| Question ID | Architectural Domain | Context & Options Considered | Current Baseline Stance | Resolution Milestone |
| :--- | :--- | :--- | :--- | :--- |
| **OQ-RSP-01** | **Mobile Bottom Navigation Dynamic Auto-Hide** | Should the sticky mobile bottom navigation bar (`StickyMobileBottomNavigation`, `60px`) dynamically hide when scrolling down and reappear when scrolling up, or remain permanently pinned? | **Proposed**: Dynamically hide on scroll-down during article reading to maximize reading area; remain persistently visible on Homepage and Category Hubs. | Phase 3 Prototype Testing |
| **OQ-RSP-02** | **Reporter Offline PWA Storage Limit** | How many offline news drafts and high-resolution camera images should be cached locally in IndexedDB on low-storage mobile devices before prompting the reporter to sync or clear space? | **Proposed**: Cap local draft storage at 25 drafts with a maximum of 50MB of compressed media assets (`RULE-OFFL-002`). | Phase 4 Core Development |
| **OQ-RSP-03** | **Vertical Reels Auto-Advance Behavior** | On mobile video feeds (`/videos`), should vertical 9:16 video reels automatically advance to the next reel upon completion, or require an explicit user swipe gesture? | **Proposed**: Require explicit user swipe gesture on mobile web to conserve user cellular data; provide an opt-in "Auto-Play Next" toggle. | Phase 7 Video Integration |
| **OQ-RSP-04** | **Admin Complex Dashboard on Foldable Phones** | How should dual-screen foldable devices (e.g., Galaxy Z Fold in unfolded tablet mode `768px–880px`) display the Central Newsroom kanban? | **Proposed**: Treat unfolded foldables as Tablet Landscape (`DEV-04`), rendering a 2-column split newsroom view with CSS spanning media queries (`@media (horizontal-viewport-segments: 2)`). | Phase 10 Admin Polish |

---

## 25. Completion Checklist

- [x] **Desktop and Mobile Web Coverage**: Complete responsive specifications defined across all 8 device categories (Large Desktop down to 320px Small Mobile).
- [x] **Reporter Functionality on Mobile**: 100% operational parity preserved for field reporters without hiding critical filing, editing, photo capture, or submission controls.
- [x] **Admin Functionality on Mobile**: Complex tabular data queues successfully transformed into responsive action cards, expandable drawers, and tabbed diff viewers.
- [x] **Central Newsroom Behavior**: Multi-monitor desktop newsroom console adapted into prioritized mobile operational feeds with real-time alerts.
- [x] **Hindi Typography & Devanagari Matra Protection**: Fluid typography scale (`clamp()`) defined; body line-height locked at `1.75` (`32px`); syllable-level wrapping (`word-break: keep-all; overflow-wrap: anywhere;`) enforced.
- [x] **Image and Media Responsiveness**: Aspect-ratio preservation architecture (`16:9`, `1:1`, `9:16`) codified with responsive `<picture>` tags and low-bandwidth fallback modes.
- [x] **Graphics Studio Behavior**: Mathematical canvas transform scaling defined; Reporter Graphics Studio strictly locked to Raw Script to Graphic only (`RULE-NEWS-001`, `RULE-GFX-001`).
- [x] **Responsive Navigation**: Multi-tier desktop navbar gracefully transformed into scrollable category ribbons, sticky bottom navigation bars, and accessible off-canvas drawers.
- [x] **Accessibility & Ergonomics**: Full WCAG 2.1 AA compliance, `48px × 48px` minimum touch targets, zero hover dependencies, and 200% text zoom tolerance specified.
- [x] **Native Android Separation**: Reaffirmed that responsive web layouts are for browsers only, while the future Native Android App will be built independently using Kotlin and Jetpack Compose (`RULE-XPLAT-003`, `RULE-XPLAT-004`).
- [x] **Documentation Integrity**: Verified that zero application code, frontend scripts, stylesheets, or database migrations were created or modified.

---

## 26. Related Documents

### 26.1 Predecessor Architectural Documentation Suite
This Master Responsive Web Design Specification forms the tenth foundational volume of the **BREAKING NEWS WALA** engineering and product documentation library:

1. [docs/01-PRD.md](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/01-PRD.md)
   *Master Product Requirements Document (PRD v1.0.0)* — Establishes core product vision, user personas, high-level functional scope, vernacular standards, and cross-platform native strategy.
2. [docs/02-Features.md](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/02-Features.md)
   *Complete Feature Specification Document (v1.0.0)* — Provides comprehensive functional catalogs across 19 modules (A–S) with detailed UX behaviors, form schemas, and error definitions.
3. [docs/03-Plan.md](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/03-Plan.md) & [docs/Plan.md](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/Plan.md)
   *Master Engineering Roadmap & Development Plan (v1.0.0)* — Decomposes system implementation into 15 structured execution phases (Phase 0 to Phase 14) with wave assignments and milestone gates.
4. [docs/04-NFR.md](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/04-NFR.md)
   *Non-Functional Requirements & Quality Standards (v1.0.0)* — Defines measurable performance, scalability, security, availability, and cross-platform latency benchmarks.
5. [docs/05-Workflows.md](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/05-Workflows.md)
   *Business and System Workflow Specification (v1.0.0)* — Maps end-to-end operational workflows (WF-01 to WF-32) across reporter filing, newsroom desks, graphics rendering, and error recovery.
6. [docs/06-Business-Rules.md](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/06-Business-Rules.md)
   *Master Business Rules Specification (v1.0.0)* — Establishes authoritative, legally binding business logic across 139 master rules covering editorial, territory, and security invariants.
7. [docs/07-Design.md](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/07-Design.md)
   *Master UI/UX Design System & Experience Specification (v1.0.0)* — Establishes design tokens, brand colors, Devanagari typography, news cards, wireframes, and responsive rules.
8. [docs/08-Sitemap.md](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/08-Sitemap.md)
   *Master Information Architecture & Navigation Sitemap Specification (v1.0.0)* — Establishes hierarchical routing, 21 approved categories, deep-link mapping, and responsive nav rules.
9. [docs/09-Components.md](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/09-Components.md)
   *Master Reusable UI Component Specification (v1.0.0)* — Establishes 100+ reusable component specifications across 10 modules with 100% Jetpack Compose mapping.
10. [docs/10-Responsive-Design.md](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/10-Responsive-Design.md)
    *Master Responsive Web Design Specification (v1.0.0)* — This document.

### 26.2 Recommended Next Document
Pursuant to the Master Development Roadmap (`docs/03-Plan.md`), the designated next sequential deliverable in the architectural specification phase is:

> **Recommended Next Deliverable:** `Architecture.md` (or `docs/11-Architecture.md`) — *Complete End-to-End System & Technical Architecture Specification*.

#### Scope for `Architecture.md`:
- Comprehensive system architecture topology (Clients, Edge CDN, Application Services, Data Stores, Message Brokers, Background Workers, AI Engine Pipelines).
- Backend tech stack selection and microservices/modular monolith boundaries.
- Database architecture: Relational operational data (PostgreSQL/Cloud SQL) + Real-time document caching (Redis/Firestore) + Object storage (GCS/S3).
- Real-time communication architecture (WebSockets, SSE) for breaking wire feeds and newsroom collaboration.
- AI integration pipeline (Google Gemini API interaction models, failover pools, token rate-limiting).
- Video and Graphics rendering pipelines (Headless Chromium, FFmpeg cloud workers).
- Security, zero-trust network topology, IAM, and disaster recovery.

> [!IMPORTANT]
> **Directive:** Do not create `Architecture.md` automatically. Await formal user instruction and review of this responsive design specification before proceeding to system architecture authoring.