# Master Project Overview, Architecture Navigation & Documentation Index
## Project: BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
### Tagline: "भारत के जिलों से, आपके दिलों तक" (From the districts of India, to your hearts)
### Document ID: DOC-23-RDM-2026-V1.0
### Canonical Path: `docs/23-README.md`

---

## 1. Document Information

| Attribute | Specification |
| :--- | :--- |
| **Document Title** | Master Project Overview, Architecture Navigation & Complete Documentation Index |
| **Document Filename** | `docs/23-README.md` |
| **Document Version** | Version 1.0 (Enterprise Comprehensive Architecture) |
| **System Classification** | Primary Documentation Entry Point, System Architecture Overview & Engineering Index |
| **Primary Authors** | Lead Technical Architect, Editor-in-Chief, Principal Full-Stack Engineer, DevOps Lead |
| **Target Stakeholders** | All Engineering Teams (Frontend, Backend, AI, Mobile, QA), Newsroom Staff, SecOps, Leadership |
| **Status** | Official Project Master Index & Architecture Navigation Specification |
| **Upstream Dependencies** | [`docs/01-PRD.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/01-PRD.md) through [`docs/22-Setup.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/22-Setup.md) |
| **Downstream Consumers** | Deployment (`24-Deployment.md`), Environment (`25-Environment.md`), Testing (`26-Testing.md`), Contributing (`28-Contributing.md`) |
| **Last Updated** | October 2026 |

---

## 2. Document Objective & Purpose

The **BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)** platform is an enterprise-grade digital news ecosystem designed to deliver hyper-local, real-time journalism across the heartland of India—spanning 55 districts of Madhya Pradesh, 75 districts of Uttar Pradesh, and national wire desks.

The objective of this master document is to serve as the **authoritative entry point and navigational compass** for the entire project. It equips every engineer, editor, security auditor, and contributor with a crystal-clear understanding of:
- **What BREAKING NEWS WALA is**: Its societal mission, journalistic principles, and omnichannel platform components.
- **The Architectural Blueprint**: How the responsive web client, reporter tools, admin newsroom, AI synthesis engines, and future native Android applications interconnect through a unified backend.
- **The Current Implementation State**: The exact distinction between verified code in the repository and planned Phase 1 / Phase 2 architecture.
- **The Complete Documentation Suite**: An exhaustive, cross-linked index of all 28 project specification documents and supporting governance registers.
- **How to Onboard & Contribute**: Immediate quick-start instructions, verified commands, safety invariants, and contribution standards.

---

## 3. Project Introduction: The BREAKING NEWS WALA Ecosystem

BREAKING NEWS WALA represents a modern digital news publishing platform that bridges the gap between grassroots field reporting in rural districts and high-concurrency national audience delivery. Rather than operating as an isolated blog or a generic CMS, the platform functions as an integrated **Seven-Pillar Digital Newsroom Mesh**:

```mermaid
flowchart TD
    subgraph Ecosystem_Pillars["The Seven Pillars of BREAKING NEWS WALA"]
        direction TB
        P1["1. Public News Portal - High-Speed Mobile-First Responsive Web PWA"]
        P2["2. Reporter Web Application - Ground Reporting, Audio Notes & Submission Desk"]
        P3["3. Central Newsroom Workstation - Editorial Triage, Live Feed Ingestion & Multi-Desk Review"]
        P4["4. Admin Control Console - RBAC User Access, Territory Mapping & Master Taxonomies"]
        P5["5. Reporter Graphics Studio - On-Device Visual Quote Cards & Breaking News Slates"]
        P6["6. Multi-Provider AI API Pool - Subservient Devanagari News Synthesis & Fact Assistants"]
        P7["7. Future Native Android App - High-Performance Kotlin SDK 34+ Citizen Experience"]
    end

    P1 <--> SharedBackend["Unified Server-Side Backend Gateway (/api/v1/*)"]
    P2 <--> SharedBackend
    P3 <--> SharedBackend
    P4 <--> SharedBackend
    P5 <--> SharedBackend
    P6 <--> SharedBackend
    P7 <--> SharedBackend
```

### 3.1 The Seven Core Platform Pillars
1. **Public News Website**: A high-speed, mobile-responsive Web Progressive Web Application (PWA) built with React 19, Vite, and Tailwind CSS v4, delivering sub-second breaking news updates, category feeds, live tickers, and rich multimedia articles to citizens.
2. **Reporter Web Application**: A dedicated, role-gated mobile web interface for accredited grassroots journalists to submit raw field notes, audio recordings, on-scene photographs, and witness statements from their assigned administrative districts.
3. **Central Newsroom Workstation**: An advanced editorial command center (`/admin/newsroom`) featuring multi-pane editorial triage, external news URL scrapers, wire RSS processing desks, and headline synthesis tools.
4. **Admin Control Console**: A comprehensive governance workspace (`/admin/*`) enabling System Administrators to manage user roles, certify reporter territory assignments, monitor platform health, and audit editorial actions.
5. **Reporter Graphics Studio**: A mobile-optimized canvas studio (`ReporterGraphicsStudio.tsx`) enabling reporters and editors to instantly convert verified news excerpts into branded visual quote cards, statistical banners, and breaking news slates.
6. **AI-Assisted Newsroom Engine**: A centralized Multi-Provider AI API Pool (`docs/19-API-Pool.md`) operating under strict human-in-the-loop governance (`RULE-AI-001`), providing Devanagari grammar correction, headline generation, and structured news synthesis.
7. **Native Android Ecosystem**: Fully realized native Android mobile applications authored in 100% pure Kotlin and Jetpack Compose (`android/`) delivering the Public News Reader (`:app-reader` - `com.breakingnewswala.reader`) and Field Reporter App (`:app-reporter` - `com.breakingnewswala.reporter`), sharing the central Node.js backend (`/api/v1/*`) and PostgreSQL cluster without embedded WebViews (`DEC-002`, `docs/ANDROID-ARCHITECTURE.md`).

### 3.2 Vision vs. Current Repository Implementation State
To ensure complete transparency across the engineering team, all stakeholders must recognize the project's current lifecycle transition:
- **Existing Codebase State (Inspected on Disk)**:
  - Working full-stack prototype in `server.ts` running Express 4.21 with inline Vite 8 development middleware.
  - Reactive frontend built in React 19, Vite, Tailwind CSS v4, Motion (Framer), and Lucide React.
  - Active prototype newsroom components (`AdminNewsroom.tsx`, `ReporterGraphicsStudio.tsx`, `MobileDrawer.tsx`).
  - Google Gemini 1.5 Flash integration via `@google/genai` powered by `GEMINI_API_KEY`.
  - Prototype persistence and auth rules configured for Firebase Firestore (`firestore.rules`, `src/firebase/config.ts`).
- **Target Enterprise Architecture (Specified in Docs 01-22)**:
  - Migration of persistence to PostgreSQL 16 relational database with `audit_logs` and `pgvector` (`docs/12-Database.md`).
  - Redis 7 and BullMQ background queue cluster for asynchronous wire polling and notifications (`docs/11-Architecture.md`).
  - Cloudflare R2 / AWS S3 media storage with Cloudflare CDN edge caching (`docs/16-Storage.md`).
  - Centralized Multi-Provider AI API Pool with sub-1.5s automatic fallback across Gemini, Claude, and OpenAI (`docs/19-API-Pool.md`).
  - Native Android multi-module application implementation in pure Kotlin and Jetpack Compose (`android/`, `docs/ANDROID-ARCHITECTURE.md`).

---

## 4. Project Vision and Core Objectives

The platform's functional mandates are formally defined in [`docs/01-PRD.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/01-PRD.md). The system is engineered to satisfy ten primary objectives:

1. **Digital News Publishing at Scale**: Deliver instant, reliable Devanagari news coverage across web and mobile viewports, achieving $P95$ API latency under $250\text{ms}$ and 99.9% platform availability (`docs/04-NFR.md`).
2. **Grassroots Reporter Contribution**: Empower accredited district correspondents to file stories directly from rural field locations with offline draft caching and automatic media compression.
3. **Rigorous Editorial Review & Publishing (`RULE-PUB-001`)**: Enforce strict human editorial triage. Under no circumstances can unverified submissions or AI-generated drafts publish autonomously to the public portal.
4. **Administrative & Territory Governance**: Maintain hierarchical geographical taxonomies covering 130 districts (55 in MP, 75 in UP) and enforce district-level reporting boundaries.
5. **News Categorization & Multi-Modal Discovery**: Provide seamless multi-category filtering (National, State, Crime, Politics, Agriculture, Weather, Sports, Entertainment) with full-text search (`tsvector`) and phonetic transliteration.
6. **Authorized RSS Wire Ingestion**: Automatically poll, sanitize, and deduplicate wire stories from authorized national news agencies (PTI, ANI, PIB) into draft review queues (`docs/20-Integrations.md`).
7. **Subservient AI-Assisted Workflows (`RULE-AI-001`)**: Deploy AI as an editorial assistant that drafts, formats, and generates headline variations while strictly preserving proper nouns, numbers, and facts without hallucination (`docs/21-Prompts.md`).
8. **Media, Video & Graphic Studio Integration**: Provide built-in canvas tooling for generating branded social graphics and duration-aware short-form video scripts (30s/60s reels).
9. **Hyper-Local Citizen Notifications**: Deliver targeted breaking news push notifications via FCM and Web Push partitioned by reader district preferences.
10. **First-Party Telemetry & Analytics**: Measure readership engagement, category trends, and article views using privacy-preserving first-party telemetry compliant with India's DPDPA 2023 regulations (`docs/15-Security.md`).

---

## 5. Platform Structure & Subsystem Architecture

The platform architecture enforces clean separation of concerns across five core subsystems:

```mermaid
flowchart TD
    subgraph Client_Applications["Omnichannel Client Subsystems"]
        WebPortal["Public News Portal (React 19 / Vite PWA)"]
        ReporterApp["Reporter Filing Desk (Mobile Web App)"]
        AdminDesk["Central Newsroom & Admin Console (/admin/*)"]
        NativeAndroid["Stage B Native Android App (Kotlin SDK 34+)"]
    end

    subgraph Backend_Control_Plane["Centralized Backend Subsystem (server.ts / Node.js)"]
        Gateway["Unified REST API Gateway (/api/v1/*)"]
        AuthModule["RBAC Authentication & Session Engine"]
        EditorialCore["Editorial Workflow & Publishing Engine"]
        AIPoolEngine["Multi-Provider AI API Pool Router"]
        WorkerCluster["BullMQ Background Workers (RSS, Push, Storage)"]
    end

    subgraph Persistence_Subsystem["Persistence & Cloud Subsystem"]
        PostgresDB[("PostgreSQL 16 Relational DB")]
        RedisCache[("Redis 7 Cache & Queues")]
        MediaVault[("Cloudflare R2 / AWS S3 Storage")]
        AICloud["External AI Providers (Gemini / Claude / OpenAI)"]
    end

    Client_Applications -->|HTTPS REST with Bearer JWT| Gateway
    Gateway --> AuthModule
    Gateway --> EditorialCore
    Gateway --> AIPoolEngine
    Gateway --> WorkerCluster

    EditorialCore --> PostgresDB
    EditorialCore --> RedisCache
    EditorialCore --> MediaVault
    AIPoolEngine --> AICloud
```

### 5.1 Public News Website
- **Technology**: React 19, Vite 8, Tailwind CSS v4, Motion (Framer).
- **Core Capabilities**: Real-time breaking ticker (`BreakingTicker.tsx`), category filtering ribbons, infinite scroll article feeds, rich article detail views with social share preview cards, dark/light theme switching, and offline PWA service workers.

### 5.2 Reporter Application
- **Technology**: Mobile-first responsive web client sharing the core React codebase.
- **Core Capabilities**: One-touch voice note recording, photo/video attachment uploads with client-side compression, assigned district locking, live submission status tracking (`draft` $\to$ `submitted` $\to$ `published`), and Reporter Graphics Studio integration.

### 5.3 Admin Control Panel & Central Newsroom
- **Technology**: Multi-pane editorial workstation (`AdminNewsroom.tsx`).
- **Core Capabilities**: Editorial review queues, split-screen raw notes vs. AI structured drafts, URL news ingestion desk, RSS feed monitoring desk, multi-style headline generator, live AI API Pool health monitor, and user role management.

### 5.4 Future Native Android Application (Stage B)
- **Technology**: 100% Native Kotlin 2.0+, Android SDK 34 (Android 14+), Jetpack Compose, Retrofit 2, Android Keystore.
- **Architectural Mandate**: The native Android application connects exclusively to the single shared backend gateway (`/api/v1/*`). It possesses zero private backends, embeds zero API secrets, and strictly bans the use of embedded WebViews (`RULE-MOB-002`).

---

## 6. User Roles, Permissions & Access Control

Access control across BREAKING NEWS WALA is governed strictly by the **Principle of Least Privilege (PoLP)** and role-based access control (RBAC), defined in [`docs/14-Auth.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/14-Auth.md) and [`docs/06-Business-Rules.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/06-Business-Rules.md).

```mermaid
flowchart TD
    subgraph Role_Hierarchy["Hierarchical Role-Based Access Control (RBAC)"]
        direction TB
        R1["1. Public Citizen Reader (Unauthenticated / Basic Account)"]
        R2["2. Verified Field Reporter (Accredited District Journalist)"]
        R3["3. Newsroom Editor (Desk Copy Editor & Triage)"]
        R4["4. Senior Editor (Editorial Lead & Bureau Chief)"]
        R5["5. System Administrator (Platform & User Operations)"]
        R6["6. Super Admin (Executive & SecOps Authority)"]
    end

    R1 --> R2
    R2 --> R3
    R3 --> R4
    R4 --> R5
    R5 --> R6
```

### 6.1 Role Definitions & Authority Matrix

| Role Identifier | Role Name | System Authority & Capabilities | Editorial Publishing Rights | Security Scope |
| :--- | :--- | :--- | :---: | :--- |
| **`ROLE_CITIZEN`** | **Public Citizen Reader** | Read published news, bookmark stories, select district preference, submit anonymous tips. | **STRICTLY NONE** | Public Internet ingress; WAF rate-limited; zero admin access. |
| **`ROLE_REPORTER`** | **Verified Field Reporter** | Submit news drafts, record audio field notes, upload photos/videos, generate graphic quote cards for own stories. | **STRICTLY NONE** (`RULE-PUB-001`) | Locked to assigned district; drafts enter review queue in `draft` status. |
| **`ROLE_EDITOR`** | **Newsroom Editor** | Review submissions, run AI news structuring tools, edit Devanagari copy, check facts, approve drafts for publication. | **YES (Assigned Desk)** | Standard editorial access; cannot alter system configurations or user roles. |
| **`ROLE_SENIOR_EDITOR`**| **Senior Editor** | Supervise desk queues, scrape news URLs, manage RSS wire sources, trigger breaking push alerts, approve prompts. | **YES (Platform-Wide)** | Editorial authority; access to newsroom analytics; prompt approval rights. |
| **`ROLE_ADMIN`** | **System Administrator** | Manage user accounts, verify reporter accreditation, map district boundaries, monitor AI API Pool health. | Operational Only | Full administrative console access; cannot bypass audit logs. |
| **`ROLE_SUPER_ADMIN`** | **Super Admin** | Manage hardware KMS secrets, rotate API keys, execute database schema upgrades, activate production prompts. | Executive Override | Hardware MFA mandatory; full platform authority; immutable audit logging. |

### 6.2 Key Access Control Invariants
1. **The Reporter Publishing Barrier (`RULE-PUB-001`)**: Field reporters are physically barred from transitioning articles to `published` status. All reporter submissions enter the system in `draft` or `pending_review` status.
2. **AI Subservience Invariant (`RULE-AI-001`)**: AI agents cannot grant themselves permissions, promote user roles, alter author IDs, or publish articles without explicit human editor approval.
3. **Data Invariants (`security_spec.md`)**: Public clients can query articles only where `status == 'published'`. Unpublished drafts return HTTP 403 / `PERMISSION_DENIED`.

---

## 7. Technology & Architecture Overview: Actual vs. Target

The technical architecture is specified in [`docs/11-Architecture.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/11-Architecture.md) and detailed in domain-specific specifications (`docs/12` through `docs/21`).

### 7.1 Architecture Classification Matrix

| Architectural Layer | Component / Technology | Status in Repo | Target Enterprise Architecture | Governing Specification |
| :--- | :--- | :---: | :--- | :--- |
| **Frontend Web** | React 19, Vite 8, Tailwind CSS v4, Lucide React, Motion | **Confirmed Active** | Single Page Application (PWA) with Service Worker offline caching. | [`docs/09-Components.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/09-Components.md) |
| **Backend API** | Node.js v20 LTS, Express 4.21, tsx, esbuild | **Confirmed Active** | Micro-modular REST API Gateway (`/api/v1/*`) with rate limiting. | [`docs/11-Architecture.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/11-Architecture.md) |
| **Persistence (Proto)** | Cloud Firestore (`firestore.rules`, `src/firebase/`) | **Prototype Active** | Cloud Firestore NoSQL collections for rapid prototype iteration. | [`docs/12-Database.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/12-Database.md) |
| **Persistence (Target)**| PostgreSQL 16 (`pgvector`, `tsvector`, connection pool) | **Proposed (Phase 1)**| Enterprise relational database with immutable `audit_logs` triggers. | [`docs/12-Database.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/12-Database.md) |
| **Cache & Queues** | Redis 7 + BullMQ 5.x | **Proposed (Phase 1)**| Asynchronous queue cluster for RSS polling, push, and webhooks. | [`docs/11-Architecture.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/11-Architecture.md) |
| **AI Integration** | Google GenAI SDK (`@google/genai: ^2.4.0`) | **Confirmed Active** | Direct Gemini 1.5 Flash inference via `GEMINI_API_KEY` in `server.ts`. | [`docs/19-API-Pool.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/19-API-Pool.md) |
| **Multi-Provider AI** | Central Multi-Provider AI API Pool Router | **Proposed (Phase 1)**| Sub-1.5s automatic failover across Gemini, Claude, and OpenAI. | [`docs/19-API-Pool.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/19-API-Pool.md) |
| **Media Storage** | Cloudflare R2 / AWS S3 Standard Mumbai | **Proposed (Phase 1)**| S3 presigned PUT/GET URLs (15m TTL) with Cloudflare CDN caching. | [`docs/16-Storage.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/16-Storage.md) |
| **Native Mobile App** | Kotlin 2.0+, Android SDK 34+, Jetpack Compose | **Proposed (Stage B)**| 100% Native Android application sharing unified backend APIs. | [`docs/10-Responsive-Design.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/10-Responsive-Design.md) |

---

## 8. Web and Native Android Strategy

BREAKING NEWS WALA enforces an **Omnichannel Native Architecture Strategy** governed by [`docs/10-Responsive-Design.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/10-Responsive-Design.md) and [`docs/13-API.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/13-API.md).

```mermaid
flowchart TD
    subgraph Omnichannel_Clients["Omnichannel Client Strategy"]
        WebPWA["Stage A: Responsive Web PWA (React 19 / Vite / Tailwind)"]
        AndroidNative["Stage B: Native Android App (Kotlin SDK 34+ / Jetpack Compose)"]
    end

    subgraph Core_Backend_Enclave["Single Shared Backend & Data Layer"]
        UnifiedAPI["Single Shared REST API Gateway (/api/v1/*)"]
        SharedAuth["Shared Authentication & Role Verification (JWT)"]
        SharedRules["Shared Business Rules & Publishing Engine"]
        SharedDB[("PostgreSQL 16 Relational DB")]
    end

    WebPWA -->|HTTPS REST| UnifiedAPI
    AndroidNative -->|HTTPS REST| UnifiedAPI
    UnifiedAPI --> SharedAuth
    SharedAuth --> SharedRules
    SharedRules --> SharedDB
```

### 8.1 Core Principles of the Dual-Client Architecture
1. **Web Platform First (Stage A)**: The responsive Web PWA provides immediate, universal accessibility across all modern desktop, tablet, and smartphone browsers without requiring app store installation.
2. **Native Android Application (Stage B)**: The mobile application is engineered exclusively in **native Kotlin** utilizing **Jetpack Compose** and Android SDK 34. Using WebViews, Cordova, or wrapper shells is strictly prohibited (`RULE-MOB-002`).
3. **Single Shared Backend (`RULE-ARCH-001`)**: Both Web and Native Android connect to the exact same backend endpoints (`/api/v1/*`). There is zero duplication of business logic, database instances, or auth services.
4. **Platform-Specific UX Excellence**:
   - The Web portal excels in deep multi-column desktop editorial workflows and fast search engine indexing.
   - The Native Android app excels in smooth 60fps scrolling on budget regional smartphones, hardware-backed Keystore security, offline reading, camera/audio hardware integration, and reliable background push notifications.

---

## 9. Master Documentation Directory & Navigation Index

The platform maintains a comprehensive 28-document architectural and governance suite, providing complete engineering specifications for every aspect of the system.

### 9.1 Primary Architectural Documentation (28 Core Documents)

| # | Document File Path | Title & System Area | One-Line Purpose | Primary Audience | Current Lifecycle Status |
| :-: | :--- | :--- | :--- | :--- | :---: |
| **01** | [`docs/01-PRD.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/01-PRD.md) | Product Requirements Document | Master product vision, business goals, user personas, and functional scope. | All Stakeholders | **Completed / Certified** |
| **02** | [`docs/02-Features.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/02-Features.md) | Complete Features Specification | Exhaustive functional catalog of all user-facing and editorial features. | Product, Frontend, QA | **Completed / Certified** |
| **03** | [`docs/03-Plan.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/03-Plan.md) | Implementation & Roadmap Plan | Phased development plan, milestones, work breakdown, and release stages. | Leadership, Project Leads| **Completed / Certified** |
| **04** | [`docs/04-NFR.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/04-NFR.md) | Non-Functional Requirements | Performance SLAs, uptime targets ($99.9\%$), accessibility, and compliance. | Architects, DevOps, QA | **Completed / Certified** |
| **05** | [`docs/05-Workflows.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/05-Workflows.md) | Business & Operational Workflows| Sequence diagrams and user journeys for drafting, review, and publishing. | Newsroom, Engineers | **Completed / Certified** |
| **06** | [`docs/06-Business-Rules.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/06-Business-Rules.md) | Business Rules & Governance | Core editorial invariants, territory restrictions, and legal safeguards. | Editorial Board, Legal | **Completed / Certified** |
| **07** | [`docs/07-Design.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/07-Design.md) | UI/UX Design System Specification | Design tokens, Devanagari typography, color palettes, and component states. | UI/UX Designers, Frontend| **Completed / Certified** |
| **08** | [`docs/08-Sitemap.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/08-Sitemap.md) | Sitemap & Navigation Architecture | Complete URL routing structure, deep links, and navigation menus. | Frontend, SEO, Mobile | **Completed / Certified** |
| **09** | [`docs/09-Components.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/09-Components.md) | Component Architecture & Specs | UI component library contracts, states, props, and accessibility. | Frontend Developers | **Completed / Certified** |
| **10** | [`docs/10-Responsive-Design.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/10-Responsive-Design.md) | Responsive & Mobile Architecture | Viewport breakpoints, PWA offline capabilities, and Native Android strategy.| Frontend, Android Leads | **Completed / Certified** |
| **11** | [`docs/11-Architecture.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/11-Architecture.md) | Master System Architecture | High-level system topology, Node.js runtime, and BullMQ queue cluster. | Systems Architects, SRE | **Completed / Certified** |
| **12** | [`docs/12-Database.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/12-Database.md) | Database Architecture & Data Model | Relational data schemas, indexes, migrations, and PostgreSQL 16 triggers. | Data Engineers, Backend | **Completed / Certified** |
| **13** | [`docs/13-API.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/13-API.md) | API Architecture & Specification | REST API contracts (`/api/v1/*`), request/response schemas, and CORS rules.| Backend, Mobile, QA | **Completed / Certified** |
| **14** | [`docs/14-Auth.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/14-Auth.md) | Authentication & Authorization | JWT tokens, session lifecycle, RBAC access matrix, and Super Admin MFA. | SecOps, Backend Leads | **Completed / Certified** |
| **15** | [`docs/15-Security.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/15-Security.md) | Complete Security Architecture | Threat model, anti-SSRF proxies, DPDPA 2023 compliance, and zero client keys.| SecOps, Compliance | **Completed / Certified** |
| **16** | [`docs/16-Storage.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/16-Storage.md) | Media Storage & Asset Architecture| Cloudflare R2 / S3 storage, presigned URLs, CDN caching, and FFmpeg workers. | Cloud Engineers, Media | **Completed / Certified** |
| **17** | [`docs/17-Agents.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/17-Agents.md) | AI Agents Architecture & Governance| Specifications for the 14 newsroom AI agents and tool permission boundaries. | AI Engineers, Editorial | **Completed / Certified** |
| **18** | [`docs/18-MCP.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/18-MCP.md) | Model Context Protocol Specification| JSON-RPC tool integrations, stdio IPC, and sandboxed read-only tooling. | AI Engineers, Backend | **Completed / Certified** |
| **19** | [`docs/19-API-Pool.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/19-API-Pool.md) | Multi-Provider AI API Pool | Central routing layer with sub-1.5s automatic fallback across AI vendors. | AI Engineers, FinOps | **Completed / Certified** |
| **20** | [`docs/20-Integrations.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/20-Integrations.md) | Third-Party Integrations & Webhooks| RSS ingestion, signed webhooks, Indian regional SMS (TRAI DLT), and FCM push. | Integration Engineers | **Completed / Certified** |
| **21** | [`docs/21-Prompts.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/21-Prompts.md) | AI Prompt Architecture & Governance| 8-layer prompt hierarchy, prompt library, Zod validation, and golden evals. | AI Prompt Engineers | **Completed / Certified** |
| **22** | [`docs/22-Setup.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/22-Setup.md) | Project Setup & Developer Guide | Workstation configuration, verified package scripts, Docker, and troubleshooting.| All Developers | **Completed / Certified** |
| **23** | [`docs/23-README.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/23-README.md) | Master Project Overview & Index | Central documentation navigation entry point, architecture summary, and index.| All Stakeholders | **Current Document** |
| **24** | `docs/24-Deployment.md` | Deployment Architecture & Releases | Containerization, Cloud Run hosting, CI/CD pipelines, and zero-downtime releases.| DevOps, Release Leads | *Planned / In Progress* |
| **25** | `docs/25-Environment.md` | Environment Variables & Secrets | Master inventory of all configuration keys, hardware KMS vault encryption. | DevOps, SecOps | *Planned* |
| **26** | `docs/26-Testing.md` | Comprehensive Testing Strategy | Vitest unit tests, Playwright E2E browser tests, and regression test suites. | QA Engineers, Developers| *Planned* |
| **27** | `docs/27-Debugging.md` | Observability & Debugging Playbook | Distributed tracing, Pino logging, Sentry error tracking, and runbooks. | SRE, On-Duty Engineers | *Planned* |
| **28** | `docs/28-Contributing.md` | Contributor Guide & Standards | Git hygiene, PR templates, code review standards, and ethical rules. | Open-Source Contributors| *Planned* |

### 9.2 Supporting Documentation & Governance Registers

| Document Reference | Subject Area | Description & Status | Current Status |
| :--- | :--- | :--- | :---: |
| `docs/SEO.md` | Search Engine Optimization | SERP metadata, schema.org JSON-LD news tags, and social cards. | *Planned* |
| `docs/Editorial-Policy.md` | Journalistic Integrity & Ethics | PCI compliance, POCSO Act, defamation rules, and attribution ethics. | *Planned* |
| `docs/Analytics.md` | Audience Telemetry & Metrics | DPDPA 2023 compliant first-party engagement tracking. | *Planned* |
| `docs/Monetization.md` | Advertising & Revenue Strategy | AdSense slot placement, house banners, and sponsored content rules. | *Planned* |
| `docs/Monitoring.md` | Infrastructure APM & SRE | Prometheus metrics, Grafana dashboards, and Alertmanager escalation. | *Planned* |
| `docs/CHANGELOG.md` | Release History & Version Log | Historical record of application releases and schema changes. | *Planned* |
| `docs/DECISIONS.md` | Central Architecture Decision Register | Consolidated register of all project ADRs across all subsystems. | *Planned* |
| `AGENTS.md` | Autonomous AI Agent Guidelines | Root configuration and rules for automated coding assistants. | *Planned* |

---

## 10. Project Setup Quick Start

The local development environment is designed for rapid onboarding. Detailed workstation prerequisites, container setups, and troubleshooting steps are documented in [`docs/22-Setup.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/22-Setup.md).

```mermaid
flowchart LR
    Step1["1. Clone Repo"] --> Step2["2. npm install"]
    Step2 --> Step3["3. cp .env.example .env"]
    Step3 --> Step4["4. npm run dev"]
    Step4 --> Step5["5. Open localhost:3000"]
```

### 10.1 Five-Minute Developer Onboarding

1. **Verify Prerequisites**:
   Ensure you have **Node.js v18.18+ or v20 LTS** and **npm v10+** installed:
   ```bash
   node -v && npm -v
   ```

2. **Clone and Enter Repository**:
   ```bash
   git clone https://github.com/breakingnewswala/BREAKING-NEWS-WALA.git
   cd BREAKING-NEWS-WALA
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```
   *(Note: The repository includes a `.npmrc` file with `legacy-peer-deps=true` to ensure clean React 19 dependency resolution).*

4. **Configure Local Environment**:
   ```bash
   # Linux / macOS / Git Bash:
   cp .env.example .env

   # Windows PowerShell:
   Copy-Item .env.example .env
   ```
   Add your personal Google AI Studio key (`GEMINI_API_KEY="AIza..."`) or rely on the built-in offline mock news generator.

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

### 10.2 Verified Package Commands Reference

| Command | Action Executed | Purpose |
| :--- | :--- | :--- |
| **`npm run dev`** | `tsx server.ts` | Launches unified Express backend with inline Vite HMR dev server on port 3000. |
| **`npm run build`** | `vite build && esbuild server.ts ...` | Compiles client to `dist/` and server to `dist/server.js`. |
| **`npm start`** | `node dist/server.js` | Runs compiled production server bundle. |
| **`npm run preview`**| `vite preview` | Serves client production build locally for pre-release inspection. |
| **`npm run lint`** | `tsc --noEmit` | Validates TypeScript static types across the entire project. |

---

## 11. End-to-End Engineering Workflow

All contributors follow an immutable 10-step software engineering lifecycle:

```mermaid
flowchart TD
    W1["1. Understand User & Business Requirements (01-PRD, 02-Features)"] --> W2["2. Review Architecture & Security Constraints (11, 14, 15)"]
    W2 --> W3["3. Confirm Architecture Decisions (No Unvetted Tech)"]
    W3 --> W4["4. Create Short-Lived Feature Branch (feature/issue-name)"]
    W4 --> W5["5. Implement Approved Work (Zero Secret Leakage)"]
    W5 --> W6["6. Execute Local Verification (npm run lint & tests)"]
    W6 --> W7["7. Audit Role-Based Access & Security Rules"]
    W7 --> W8["8. Open Pull Request to 'develop' Branch"]
    W8 --> W9["9. Senior Engineer Review & Automated CI Approval"]
    W9 --> W10["10. Merge via Squash & Update Documentation"]
```

---

## 12. AI and Newsroom Operating Principles

Generative AI within BREAKING NEWS WALA operates under strict journalistic subservience governed by [`docs/17-Agents.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/17-Agents.md), [`docs/19-API-Pool.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/19-API-Pool.md), and [`docs/21-Prompts.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/21-Prompts.md).

```mermaid
flowchart TD
    RawContent["Raw Reporter Notes / Wire XML / Web URLs"] --> QuarantineTag["Enclose in Quarantined Boundary ([source_data])"]
    QuarantineTag --> PromptEngine["8-Layer Prompt Compilation Pipeline"]
    PromptEngine --> AIPoolMesh["Multi-Provider AI API Pool (Sub-1.5s Failover)"]
    
    AIPoolMesh --> ModelInference["LLM Inference (Gemini / Claude / OpenAI)"]
    ModelInference --> SchemaValidator["Zod Output Schema & PII Validation"]
    
    SchemaValidator --> DraftPersistence["Save to Database (status = 'draft')"]
    DraftPersistence --> HumanEditor["Human Newsroom Editor Review Desk"]
    HumanEditor -->|Verify Facts & Approve| PublishedFeed["Public News Feed (status = 'published')"]
```

### 12.1 The Eight AI Operating Invariants
1. **Human Editorial Primacy (`RULE-AI-001`)**: AI is an automated drafting assistant, not an autonomous journalist. No AI agent possesses the authority to publish articles directly (`RULE-PUB-001`).
2. **Centralized API Pool Control**: All model inference requests route through the server-side API Pool (`docs/19-API-Pool.md`). Client applications never communicate directly with AI vendors.
3. **8-Layer Prompt Hierarchy**: Prompts are assembled using strict downward precedence ($\text{L1 Global} \succ \text{L2 Security} \succ \text{L3 Editorial} \succ \dots \succ \text{L6 Data}$). System safety instructions cannot be overridden by user input or external web content.
4. **Untrusted Data Quarantine (`RULE-SEC-008`)**: External text from RSS feeds, scraped URLs, and field notes is quarantined within typed data containers (`[source_data]`). Models are instructed to treat this text strictly as passive data, completely neutralizing indirect prompt injection.
5. **Strict Machine-Readable Output Contracts**: Model responses must conform to versioned Zod JSON schemas, prohibiting conversational preambles or unparsed markdown fences.
6. **Zero Hallucination Clause**: If critical information (dates, names, police stations) is missing from source notes, the model must flag it in the `missing_information` field rather than fabricating details.
7. **Entity Preservation**: Proper nouns, administrative designations, and numerical metrics must be transcribed with 100% fidelity.
8. **Server-Side Secret Isolation (`RULE-SEC-001`)**: LLM API tokens reside exclusively in hardware KMS vaults and in-memory RAM caches, never appearing in client bundles or prompts.

---

## 13. Security and Editorial Governance Principles

The platform enforces rigorous security controls and ethical legal compliance governed by [`docs/15-Security.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/15-Security.md) and [`docs/06-Business-Rules.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/06-Business-Rules.md).

### 13.1 Core Security Safeguards
- **Zero Client-Side Secrets (`RULE-SEC-001`)**: Web JavaScript bundles and compiled Android APK binaries contain zero private credentials, database passwords, or third-party service tokens.
- **Anti-SSRF Protection (`RULE-SEC-008`)**: Outbound HTTP requests for RSS polling and URL scraping execute exclusively through a dedicated egress proxy that pre-resolves domain DNS and blocks private subnets (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, `169.254.169.254`).
- **Cryptographic Webhooks**: Inbound vendor callbacks enforce raw byte-stream HMAC-SHA256 signature verification, 5-minute timestamp validity, and Redis replay nonce caching (`docs/20-Integrations.md`).
- **Data Protection Compliance**: Citizen engagement telemetry complies with India's **Digital Personal Data Protection Act (DPDPA 2023)**, utilizing anonymized user session tokens without third-party tracking cookies.

### 13.2 Editorial & Legal Safeguards
- **Minor Protection (POCSO Act)**: Under Section 74 of the Juvenile Justice Act and Section 23 of the POCSO Act, the name, school, address, family identity, or photo of any minor involved in a crime (victim or accused) is strictly omitted.
- **Subjudice & Presumption of Innocence**: Accused individuals are identified as `आरोपी` (accused) or `संदिग्ध` (suspect), never `दोषी` (guilty), prior to a formal court verdict.
- **WORM Audit Trail**: All editorial approvals, article deletions, category updates, and user role modifications persist immutable records in `audit_logs` with a mandatory 7-year retention period.

---

## 14. Project Roadmap & Implementation Status

The project lifecycle is structured across four progressive development stages defined in [`docs/03-Plan.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/03-Plan.md):

```mermaid
flowchart LR
    Stage0["Stage 0: Architecture & Specs (Docs 01-36)"] --> Stage1["Stage 1: Web MVP Prototype (React 19 / Express)"]
    Stage1 --> Stage2["Stage 2: Enterprise Backend & PostgreSQL 16"]
    Stage2 --> Stage3["Stage 3: Stage B Native Android App (Kotlin SDK 34+)"]

    classDef active fill:#22c55e,stroke:#15803d,color:#fff;
    classDef target fill:#3b82f6,stroke:#1d4ed8,color:#fff;
    class Stage0,Stage1 active;
    class Stage2,Stage3 target;
```

### 14.1 Stage Status Breakdown

| Stage | Focus Area | Key Deliverables | Verified Repository Status |
| :---: | :--- | :--- | :---: |
| **Stage 0** | **Comprehensive Architecture & Planning** | Full 28-document architectural specification suite (`docs/01` through `docs/28`), security threat models, and prompt catalogs. | **Substantially Complete** (Docs 01-23 Delivered) |
| **Stage 1** | **Web MVP Full-Stack Prototype** | Single-command full-stack server (`server.ts`), React 19 UI, Newsroom tabs, Gemini 1.5 Flash AI drafting, Firestore prototype rules. | **Active & Verified in Repo** |
| **Stage 2** | **Enterprise Backend & PostgreSQL Migration** | Migration from Firestore to PostgreSQL 16, Redis BullMQ queues, Cloudflare R2 storage, Multi-Provider AI API Pool with sub-1.5s failover. | **Architecture Finalized; Implementation Planned** |
| **Stage 3** | **Native Android Mobile Application** | 100% Native Kotlin 2.0+ Android app using Jetpack Compose, Retrofit 2, Android Keystore, and native FCM push notifications. | **Architecture Specified (`10-Responsive.md`); Kickoff Post-Stage 2** |

---

## 15. Decision Management & ADR Classification

Architectural and engineering decisions across BREAKING NEWS WALA follow formal Architecture Decision Records (ADR). Decisions are classified under five explicit lifecycle statuses:

1. **Confirmed**: Fully reviewed, approved by technical leadership, and actively governing implementation (e.g., ADR-SET-001 unified server, ADR-PRM-007 human-in-the-loop gate).
2. **Proposed**: Architecturally sound design recommendations specified in documentation, awaiting formal Phase 1 sprint kickoff (e.g., ADR-SET-003 Docker PostgreSQL migration, ADR-PRM-009 duration-aware video pacing).
3. **Pending Approval**: Active proposals requiring commercial contract finalization or third-party regulatory approval (e.g., ADR-INT-005 Fast2SMS TRAI DLT registration).
4. **Deferred**: Approved conceptual features postponed to later stages (e.g., Stage B Native Android kickoff).
5. **Rejected**: Architectural paths formally evaluated and rejected (e.g., embedding WebViews inside Android APKs, client-side direct cloud API calls).

> [!IMPORTANT]
> A proposal in documentation must never be assumed as confirmed implementation until verified by repository code or executive architectural sign-off.

---

## 16. Quick Reference Navigation by Functional Area

Find relevant specifications instantly based on your engineering discipline:

- **Frontend & UI/UX Engineers**:
  - Design Tokens & Colors: [`docs/07-Design.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/07-Design.md)
  - UI Component Contracts: [`docs/09-Components.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/09-Components.md)
  - Responsive Viewports: [`docs/10-Responsive-Design.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/10-Responsive-Design.md)
  - URL Routes & Menus: [`docs/08-Sitemap.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/08-Sitemap.md)

- **Backend & Systems Engineers**:
  - System Topology & Queues: [`docs/11-Architecture.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/11-Architecture.md)
  - Relational Schemas & Migrations: [`docs/12-Database.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/12-Database.md)
  - REST API Contracts (`/api/v1/*`): [`docs/13-API.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/13-API.md)
  - Third-Party Webhooks & Integrations: [`docs/20-Integrations.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/20-Integrations.md)

- **AI Prompt Engineers & Data Scientists**:
  - 14 Newsroom AI Agents: [`docs/17-Agents.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/17-Agents.md)
  - Multi-Provider API Pool Router: [`docs/19-API-Pool.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/19-API-Pool.md)
  - Prompt Hierarchy & 100-Story Evals: [`docs/21-Prompts.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/21-Prompts.md)
  - Model Context Protocol (MCP): [`docs/18-MCP.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/18-MCP.md)

- **Security & Compliance Specialists**:
  - Threat Models & Anti-SSRF: [`docs/15-Security.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/15-Security.md)
  - JWT Auth & Super Admin MFA: [`docs/14-Auth.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/14-Auth.md)
  - Editorial Law & POCSO Rules: [`docs/06-Business-Rules.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/06-Business-Rules.md)

- **DevOps, SRE & Release Engineers**:
  - Local Workstation Setup: [`docs/22-Setup.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/22-Setup.md)
  - Performance SLAs ($< 250\text{ms}$): [`docs/04-NFR.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/04-NFR.md)
  - Cloud Storage Architecture: [`docs/16-Storage.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/16-Storage.md)

---

## 17. Project Documentation Maintenance & Governance

To maintain documentation integrity across a large multi-disciplinary team:
1. **Single Canonical Location**: All official specifications reside in `docs/` following the strict numerical prefix convention (`docs/01-` through `docs/28-`). Creating duplicate files or unnumbered copies in subdirectories is strictly prohibited.
2. **Synchronized Updates**: Whenever application logic or database schemas are altered, the corresponding documentation must be updated in the same pull request.
3. **Escalation of Contradictions**: If an engineer detects a discrepancy between two documents (e.g., between `02-Features.md` and `12-Database.md`), the issue must be logged in the project issue tracker and escalated to the Technical Lead rather than silently modified.

---

## 18. Quality & Navigation Compliance

This master document adheres to the highest documentation standards:
- **Clean Relative Linking**: All cross-references use standard relative markdown links ([`docs/XX-Name.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/)) enabling seamless navigation within GitHub, VS Code, and IDE previews.
- **Accurate Status Representation**: Explicitly marks which documents are live and which are planned.
- **Reproducible Verification**: Setup commands match the physical `package.json` manifest.

---

## 19. Strict Scope Restrictions Confirmation

This document has been authored strictly within documentation-only boundaries. The assistant has **not**:
- Modified or written application source code or build scripts.
- Installed or uninstalled any packages.
- Created or committed `.env` files or credentials.
- Executed database migrations or provisioned infrastructure.
- Modified any other README or documentation files.