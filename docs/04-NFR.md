# Non-Functional Requirements (NFR)
## Project: BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
**Tagline:** भारत के जिलों से, आपके दिलों तक  
**Document Identifier:** `docs/04-NFR.md`  
**Version:** 1.0.0 (Implementation-Ready Quality Standards & Operational Specifications)  
**Status:** Approved Baseline / Quality Engineering Blueprint  
**Classification:** Internal Confidential / Quality Assurance & Architecture Baseline  
**Primary Authors:** Principal Software Architect, Non-Functional Requirements Specialist, Performance Engineer, Security Architect & Quality Assurance Architect  
**Prerequisites:**  
- `docs/01-PRD.md` (Product Requirements Document, v1.0.0)  
- `docs/02-Features.md` (Feature Specification Document, v1.0.0)  
- `docs/Plan.md` (Master Engineering Roadmap, v1.0.0)  

---

## 1. Document Information

| Attribute | Specification |
| :--- | :--- |
| **Product Name** | BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला) |
| **Product Code** | BNW-CORE |
| **Document Identifier** | `docs/04-NFR.md` |
| **Version** | 1.0.0 |
| **Baseline Date** | October 30, 2026 |
| **Quality Framework Reference** | ISO/IEC 25010 (System and Software Quality Models) & W3C Web Content Accessibility Guidelines (WCAG 2.1 AA) |
| **Performance Framework** | Google Core Web Vitals (LCP, INP, CLS) & Android Vitals |
| **Security Standards** | OWASP Top 10 (2021), OWASP API Security Top 10 (2023), Indian IT Rules (2021), DPDP Act (2023) Guidance |
| **Target Platforms** | **Stage A:** Responsive Web Platform (Desktop, Tablet, Mobile Browsers)<br>**Stage B:** Fully Native Kotlin Android App (Jetpack Compose, Android SDK) |

---

## 2. Purpose and Scope

### 2.1 Purpose of this Document
This Non-Functional Requirements (NFR) document defines the explicit, measurable, and implementation-oriented quality benchmarks, performance limits, security boundaries, and operational constraints that BREAKING NEWS WALA must satisfy throughout its lifecycle. It establishes the non-negotiable criteria for architecture approval, code reviews, automated CI/CD gating, load testing, security audits, and production release acceptance.

### 2.2 Scope Boundaries
- **In-Scope:**
  - Quality benchmarks across all 15 operational domains (Performance, Scalability, Availability, Security, Privacy, Data Integrity, Disaster Recovery, Media, AI Reliability, API Quality, Native Android, Usability/Accessibility, Compatibility, Maintainability, Observability).
  - Explicit distinction between **Shared Backend**, **Web-Specific**, and **Native Android-Specific** requirements.
  - Core Web Vitals performance targets for responsive web readers.
  - Hardware acceleration, memory limits, and battery efficiency for future native Android devices.
  - Rigorous security controls ("Dirty Dozen" threat mitigation, zero secret exposure, immutable audit logs).
  - Indian regulatory compliance guidelines (IT Rules 2021, Digital Personal Data Protection Act 2023).
- **Out of Scope (Explicitly Restricted):**
  - Inventing unapproved infrastructure budgets, commercial contracts, or cloud provider lock-ins.
  - Making legally binding compliance guarantees prior to formal legal review.
  - Implementation scripts, application code, or database DDL (governed by subsequent engineering phases).
  - iOS native quality benchmarks (deferred to Phase 3 roadmap).

---

## 3. Quality Attribute Overview

To ensure holistic operational excellence, BREAKING NEWS WALA adopts the **ISO/IEC 25010 Software Product Quality Model**, categorizing all non-functional requirements into eight foundational quality characteristics:

```
+----------------------------------------------------------------------------------------------------+
|                                    ISO/IEC 25010 QUALITY ATTRIBUTES                                |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|    1. FUNCTIONAL SUITABILITY ──────► Exact compliance with 01-PRD.md and 02-Features.md            |
|    2. PERFORMANCE EFFICIENCY ──────► Core Web Vitals, API Latency < 200ms, 60fps Native Android UI |
|    3. COMPATIBILITY ───────────────► Cross-Platform API-First, Web Browsers, Android SDK 34+       |
|    4. USABILITY & ACCESSIBILITY ───► Devanagari Typography, WCAG 2.1 AA, Scalable Font Controls     |
|    5. RELIABILITY ─────────────────► 99.9% Uptime, Multi-Key AI Failover, Graceful Degradation   |
|    6. SECURITY ────────────────────► Zero Client Secrets, Server-Side RBAC, Immutable Audit Logs   |
|    7. MAINTAINABILITY ─────────────► Modular Microservices, Strict TypeScript, Database Migrations  |
|    8. PORTABILITY ─────────────────► Shared Single Backend, Cloud-Agnostic Containers, Room DB     |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 4. Cross-Platform NFR Strategy

BREAKING NEWS WALA follows a strict **Shared-Core, Platform-Specific Presentation** architecture. All non-functional requirements in this document are explicitly categorized by their applicable platform tier:

```
+----------------------------------------------------------------------------------------------------+
|                                  CROSS-PLATFORM ARCHITECTURAL TIERS                                |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|   +------------------------------------+          +------------------------------------+           |
|   |         TIER 1: WEB PLATFORM       |          |      TIER 2: NATIVE ANDROID APP    |           |
|   |  - Core Web Vitals (LCP, INP, CLS) |          |  - Jetpack Compose & Android SDK   |           |
|   |  - Responsive Cross-Browser Layout |          |  - 60fps Scrolling & Low Battery  |           |
|   |  - HTTP-Only SameSite Cookie Auth  |          |  - Android Keystore Token Vault    |           |
|   |  - VAPID Web Push Notifications    |          |  - WorkManager Offline Prefetching |           |
|   |  - SSR / Static CDN Edge Caching   |          |  - Firebase Cloud Messaging (FCM)  |           |
|   +-----------------+------------------+          +-----------------+------------------+           |
|                     |                                               |                              |
|                     +-----------------------+-----------------------+                              |
|                                             |                                                      |
|                                             v                                                      |
|                       +-------------------------------------------+                                |
|                       |        TIER 3: SHARED CORE BACKEND        |                                |
|                       |  - Single Relational/Document Database    |                                |
|                       |  - Standardized JSON REST API Gateway     |                                |
|                       |  - Authoritative Server-Side RBAC         |                                |
|                       |  - Multi-Key AI Pool & Automated Failover |                                |
|                       |  - Media Processing & WebP Conversion     |                                |
|                       |  - Master 21 Categories & MP Districts    |                                |
|                       +-------------------------------------------+                                |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

### 4.1 Tier Distinction Principles
1. **Tier 1 (Web Platform):** Governed by browser sandboxes, DOM rendering performance, network-conscious asset compression, responsive screen layouts, and SEO crawler accessibility.
2. **Tier 2 (Native Android Application):** Governed by native Kotlin lifecycle management, Android Vitals (ANR < 0.05%, crash rate < 0.1%), memory footprints, battery drain optimization, and Android hardware acceleration. **Zero WebView shortcuts.**
3. **Tier 3 (Shared Core Backend):** Governed by horizontal autoscaling, high-concurrency database connection pooling, sub-200ms read latencies, AES-256 encryption at rest, and server-side RBAC validation.
4. **Common Standards (All Tiers):** Shared brand design tokens, identical Devanagari typography scales, unified error dictionaries, and universal deep links (`https://breakingnewswala.com/news/{category}/{district}/{slug}`).

---

## 5. Performance Requirements

Performance is foundational to user retention across Indian regional communities where mobile readers often operate on mid-range Android smartphones and congested 4G/3G networks.

---

### 5.1 Web Performance & Core Web Vitals

The web presentation tier is measured against Google Core Web Vitals standards under realistic mobile network conditions (simulated 4G, 150ms RTT, 1.6 Mbps download).

#### NFR-PERF-001: Web Core Web Vitals — Largest Contentful Paint (LCP)
- **NFR ID:** `NFR-PERF-001`
- **Category:** Performance (Web)
- **Requirement Name:** Largest Contentful Paint (LCP) Benchmarking
- **Requirement Description:** The main lead hero image or dominant headline text block on the public homepage and article reader page must become visible within the target threshold on standard mobile networks.
- **Applicable Platform:** Web Platform (Desktop & Mobile Browsers).
- **Priority:** Must Have
- **Proposed Target / Measurement:** **Proposed Target:** LCP $\le$ 2.2 seconds (75th percentile of mobile sessions under simulated 4G). Desktop target: LCP $\le$ 1.2 seconds.
- **Verification Method:** Automated Google Lighthouse CI audits, Chrome UX Report (CrUX) telemetry, and synthetic WebPageTest runs.
- **Dependencies:** CDN edge caching, WebP/AVIF image compression, pre-warmed database queries.
- **Acceptance Criteria:** 75% of measured production page visits achieve LCP under 2.5s; lead hero image carries `fetchpriority="high"`.
- **Status:** Proposed Target (Requires production infrastructure load-testing confirmation).

#### NFR-PERF-002: Web Core Web Vitals — Interaction to Next Paint (INP)
- **NFR ID:** `NFR-PERF-002`
- **Category:** Performance (Web)
- **Requirement Name:** Interaction to Next Paint (INP) Responsiveness
- **Requirement Description:** The user interface must respond immediately to all user interactions (district selector clicks, category tab switches, search flyout toggles, bookmark taps) without UI thread freezing.
- **Applicable Platform:** Web Platform.
- **Priority:** Must Have
- **Proposed Target / Measurement:** **Proposed Target:** INP $\le$ 150 milliseconds (Good rating: $\le 200\text{ ms}$).
- **Verification Method:** Chrome DevTools Performance panel, real-user monitoring (RUM) event listeners.
- **Dependencies:** Minimal main-thread JavaScript execution; code-splitting; lightweight DOM structure.
- **Acceptance Criteria:** Switching between news categories or opening the district switcher renders visual feedback within 150ms on mobile devices.
- **Status:** Proposed Target (Requires staging device testing confirmation).

#### NFR-PERF-003: Web Core Web Vitals — Cumulative Layout Shift (CLS)
- **NFR ID:** `NFR-PERF-003`
- **Category:** Performance (Web)
- **Requirement Name:** Cumulative Layout Shift (CLS) Stability
- **Requirement Description:** Web pages must maintain complete visual stability as asynchronous content (banner ads, breaking tickers, images, web fonts) loads, preventing frustrating layout jumps while reading.
- **Applicable Platform:** Web Platform.
- **Priority:** Must Have
- **Proposed Target / Measurement:** **Proposed Target:** CLS $\le$ 0.05 (Good rating: $\le 0.1$).
- **Verification Method:** Automated Lighthouse CI testing; synthetic layout shift trackers during dynamic ad injection.
- **Dependencies:** Pre-allocated CSS aspect-ratio wrappers on images and ad slots; `font-display: swap` with matched fallback metrics.
- **Acceptance Criteria:** Display banners and responsive hero images load inside pre-allocated layout dimensions without shifting adjacent text blocks by more than 5 pixels.
- **Status:** Confirmed Quality Standard.

#### NFR-PERF-004: Vernacular Search Response Latency
- **NFR ID:** `NFR-PERF-004`
- **Category:** Performance (Web & API)
- **Requirement Name:** Full-Text Search & Suggestion Latency
- **Requirement Description:** Full-text search and auto-complete suggestions for Devanagari Hindi keywords, category titles, and district names must return ranked results rapidly.
- **Applicable Platform:** Shared Core Backend & Web Presentation.
- **Priority:** Must Have
- **Proposed Target / Measurement:** **Proposed Target:** Autocomplete suggestions returned in $\le$ 300ms; full search results page rendered in $\le$ 500ms.
- **Verification Method:** API load test simulating 50 concurrent search queries using k6.
- **Dependencies:** Inverted database index or dedicated full-text search engine; debounced (300ms) client input.
- **Acceptance Criteria:** Search queries for "निवाड़ी", "भोपाल", or "चुनाव" return matching article previews in under 500ms at p95.
- **Status:** Proposed Target.

---

### 5.2 Backend Performance & Workload Benchmarks

#### NFR-PERF-005: Public Read API Latency
- **NFR ID:** `NFR-PERF-005`
- **Category:** Performance (Backend API)
- **Requirement Name:** Public Read API Endpoint Latency (p95)
- **Requirement Description:** Unauthenticated public read endpoints serving news feeds, categories, district articles, and breaking news tickers must return JSON payloads with sub-second latency.
- **Applicable Platform:** Shared Core Backend.
- **Priority:** Must Have
- **Proposed Target / Measurement:** **Proposed Target:** p95 latency $\le$ 200 milliseconds (cached responses $\le$ 50ms at CDN edge).
- **Verification Method:** Synthetic API monitoring probes; Prometheus/Grafana API telemetry; k6 load tests.
- **Dependencies:** Database indexing on `(status, publishedAt DESC)`, Redis caching, Cloudflare CDN edge caching.
- **Acceptance Criteria:** Under baseline load of 2,000 req/sec, 95% of public feed requests complete within 200ms.
- **Status:** Proposed Target.

#### NFR-PERF-006: Authenticated Mutation API Latency
- **NFR ID:** `NFR-PERF-006`
- **Category:** Performance (Backend API)
- **Requirement Name:** Authenticated Editorial & Reporter Mutation Latency
- **Requirement Description:** Server-side state mutations—including draft saving, story submissions, editorial status updates, and direct publishing—must complete reliably without blocking journalist workflows.
- **Applicable Platform:** Shared Core Backend.
- **Priority:** Must Have
- **Proposed Target / Measurement:** **Proposed Target:** p95 latency $\le$ 500 milliseconds for standard draft/status mutations (excluding AI structuring or external file uploads).
- **Verification Method:** Automated API integration tests; APM transaction tracing.
- **Dependencies:** Database transaction isolation, connection pooling, optimized schema indexes.
- **Acceptance Criteria:** Submitting a news story for review or executing an editorial approval completes in under 500ms at p95.
- **Status:** Proposed Target.

#### NFR-PERF-007: Real-Time Breaking Ticker Broadcast Propagation
- **NFR ID:** `NFR-PERF-007`
- **Category:** Performance (Real-Time Infrastructure)
- **Requirement Name:** Breaking News Ticker Broadcast Propagation Latency
- **Requirement Description:** When an editor pushes an urgent breaking news headline ticker, the text must propagate across all connected public web sessions and mobile app clients in near real-time.
- **Applicable Platform:** Cross-Platform (Shared Backend to Web & Android).
- **Priority:** Must Have
- **Proposed Target / Measurement:** **Proposed Target:** Propagation latency $\le$ 3.0 seconds to 95% of active connected clients.
- **Verification Method:** End-to-end WebSocket telemetry test connecting 5,000 simulated clients and measuring arrival timestamps.
- **Dependencies:** WebSocket / SSE broadcast server, Redis Pub/Sub cluster.
- **Acceptance Criteria:** Ticker update reaches 10,000 simulated connected sessions within 3 seconds of Admin broadcast click.
- **Status:** Proposed Target.

---

### 5.3 Breaking News Traffic Spikes & Burst Absorption

#### NFR-PERF-008: Traffic Burst Scaling & Overload Protection
- **NFR ID:** `NFR-PERF-008`
- **Category:** Performance (Infrastructure)
- **Requirement Name:** Breaking News Traffic Spike Absorption
- **Requirement Description:** The platform must absorb sudden, unpredictable 10x traffic surges caused by major breaking news events (e.g., election outcomes, natural emergencies, viral regional stories) without service degradation.
- **Applicable Platform:** Shared Core Backend & Public Web Portal.
- **Priority:** Must Have
- **Proposed Target / Measurement:** **Proposed Target:** Scale dynamically from 1,000 concurrent visitors to 10,000 concurrent visitors within 90 seconds while maintaining 99.9% availability.
- **Verification Method:** Step-up load test using k6 ramping traffic by 1,000% over 60 seconds.
- **Dependencies:** Stateless container architecture (Cloud Run / Kubernetes HPA), CDN static asset offload, read-replica database scaling.
- **Acceptance Criteria:** Zero 5xx gateway errors during 10x traffic surge; p95 latency remains below 600ms; CPU/memory autoscaling triggers cleanly.
- **Status:** Proposed Target (Workload assumptions require formal infrastructure sizing).

---

## 6. Scalability Requirements

Scalability ensures that BREAKING NEWS WALA seamlessly expands its audience, reporter network, and content archives across all Indian districts without architectural refactoring.

---

### 6.1 User & Content Dimension Scalability

#### NFR-SCAL-001: Horizontal Public Audience Scalability
- **NFR ID:** `NFR-SCAL-001`
- **Category:** Scalability
- **Requirement Name:** Public Reader Concurrent Load Scalability
- **Requirement Description:** The system architecture must support horizontal scaling capable of serving high-volume concurrent vernacular readers.
- **Applicable Platform:** Shared Backend & CDN Edge.
- **Priority:** Must Have
- **Proposed Target / Measurement:** **Proposed Baseline Capacity:** 10,000 concurrent active readers on Web; architected for horizontal expansion to 50,000 concurrent readers without database redesign.
- **Verification Method:** Distributed load generation across multiple cloud regions using Artillery.
- **Dependencies:** CDN caching of published article HTML/JSON (TTL 60s); stateless compute nodes; read-write database split.
- **Acceptance Criteria:** 10,000 concurrent virtual users simulate browsing feeds, reading articles, and switching districts with zero dropped connections.
- **Status:** Proposed Target (Subject to Phase 1 infrastructure selection).

#### NFR-SCAL-002: Concurrent Newsroom Operations & Reporter Dispatches
- **NFR ID:** `NFR-SCAL-002`
- **Category:** Scalability
- **Requirement Name:** Field Reporter & Editorial Newsroom Concurrency
- **Requirement Description:** The authenticated newsroom backend must support simultaneous news authoring, photo uploading, and editorial review across hundreds of district stringers.
- **Applicable Platform:** Shared Core Backend (Authenticated Tier).
- **Priority:** Must Have
- **Proposed Target / Measurement:** **Proposed Baseline Capacity:** 500 simultaneous active field reporters composing drafts and 50 concurrent central sub-editors reviewing queues.
- **Verification Method:** Simulated concurrent session test executing authenticated draft mutations and AI requests.
- **Dependencies:** Database connection pooling (e.g., PgBouncer), background job queues for media processing.
- **Acceptance Criteria:** 500 simultaneous reporters filing dispatches and uploading images without database connection pool exhaustion or transaction deadlocks.
- **Status:** Proposed Target.

#### NFR-SCAL-003: Long-Term News Archive & Media Growth Scalability
- **NFR ID:** `NFR-SCAL-003`
- **Category:** Scalability
- **Requirement Name:** High-Volume Content & Historical Media Scaling
- **Requirement Description:** The database and storage architecture must support exponential growth in published news articles, high-resolution photographs, and video clips over a 5-year operational horizon.
- **Applicable Platform:** Shared Database & Cloud Object Storage.
- **Priority:** Must Have
- **Proposed Target / Measurement:** **Capacity Goal:** Support 1,000,000 published articles and 5,000,000 media assets with zero query degradation over historical archives.
- **Verification Method:** Database synthetic benchmarking with 1M indexed article records; date-range cursor queries tested for sub-100ms response.
- **Dependencies:** B-tree compound indexing on `(publishedAt, status, districtId)`; partition pruning or sharding strategies.
- **Acceptance Criteria:** Querying news published 3 years ago takes < 150ms; media storage lifecycle policies archive cold assets without broken public URLs.
- **Status:** Confirmed Quality Standard.

#### NFR-SCAL-004: CDN Edge Caching & Origin Shielding
- **NFR ID:** `NFR-SCAL-004`
- **Category:** Scalability
- **Requirement Name:** CDN Edge Offload Efficiency
- **Requirement Description:** High-capacity CDN edge caching must absorb the vast majority of public read traffic, shielding the core database and application servers from direct public request load.
- **Applicable Platform:** Web Presentation & Media Delivery.
- **Priority:** Must Have
- **Proposed Target / Measurement:** **Proposed Target:** CDN Cache Hit Ratio $\ge$ 90% for public read assets (images, static JS/CSS, cached article JSON).
- **Verification Method:** CDN analytics log audit during simulated traffic stress tests.
- **Dependencies:** HTTP cache headers (`Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600`); automated cache purging upon article updates.
- **Acceptance Criteria:** Less than 10% of public homepage and article read requests reach the origin application server under steady-state traffic.
- **Status:** Proposed Target.

---

## 7. Availability and Reliability

Reliability is non-negotiable for a breaking news platform. Uptime failures during critical regional emergencies destroy journalistic credibility and reader trust.

---

### 7.1 Service Availability & Maintenance

#### NFR-AVAL-001: Platform Availability & Service Level Objective
- **NFR ID:** `NFR-AVAL-001`
- **Category:** Availability
- **Requirement Name:** Public Portal & Core API Availability
- **Requirement Description:** The public news portal, live breaking ticker, and core REST APIs must remain operational and accessible to vernacular readers without unscheduled outages.
- **Applicable Platform:** Shared Backend & Public Web Portal.
- **Priority:** Must Have
- **Proposed Target / Measurement:** **Proposed Target:** 99.9% monthly uptime (allowing $\le 43.8$ minutes of unscheduled downtime per month).
- **Verification Method:** External synthetic uptime monitoring probes pinging `/health` endpoints from 3 Indian geographic locations every 60 seconds.
- **Dependencies:** Multi-zone cloud deployment, automated container restarts, health probes.
- **Acceptance Criteria:** Monthly availability log demonstrates $\ge 99.9\%$ operational uptime excluding scheduled, pre-notified maintenance.
- **Status:** Proposed Target (Requires SLA sign-off with cloud hosting infrastructure).

#### NFR-AVAL-002: Zero-Downtime Rolling Deployments
- **NFR ID:** `NFR-AVAL-002`
- **Category:** Availability
- **Requirement Name:** Zero-Downtime Continuous Deployment
- **Requirement Description:** Software updates, bug fixes, and feature deployments must be released without terminating active user sessions, dropping websocket tickers, or interrupting newsroom publishing.
- **Applicable Platform:** Shared Core Backend & Web Presentation.
- **Priority:** Must Have
- **Proposed Target / Measurement:** Zero downtime (0 seconds service interruption) during application deployments.
- **Verification Method:** Continuous load test running during a simulated staging deployment; verify zero HTTP 502/503 responses.
- **Dependencies:** Blue-Green / Rolling container updates; backward-compatible database schema migrations.
- **Acceptance Criteria:** Continuous curl loop during deployment records 100% HTTP 200 responses with zero dropped connections.
- **Status:** Confirmed Quality Standard.

---

### 7.2 Fault Tolerance & Graceful Degradation

#### NFR-AVAL-003: Graceful Network Degradation & Offline Fallback
- **NFR ID:** `NFR-AVAL-003`
- **Category:** Reliability
- **Requirement Name:** Client-Side Offline & Low-Bandwidth Resiliency
- **Requirement Description:** When a reader or reporter experiences network dropouts in rural district zones, the application must gracefully degrade rather than crashing or displaying raw browser error pages.
- **Applicable Platform:** Web Platform & Native Android App.
- **Priority:** Must Have
- **Proposed Target / Measurement:** 100% prevention of unhandled network exceptions; immediate display of friendly vernacular fallback notices.
- **Verification Method:** Manual testing under disconnected network conditions and simulated 100% packet loss.
- **Dependencies:** Service Worker caching (Web), Room database local persistence (Android), LocalStorage draft backup.
- **Acceptance Criteria:** Operating in Airplane Mode allows readers to view previously loaded articles and saved bookmarks; reporters composing drafts retain all entered text locally without data loss.
- **Status:** Confirmed Quality Standard.

#### NFR-AVAL-004: Database Connection Pool Resiliency
- **NFR ID:** `NFR-AVAL-004`
- **Category:** Reliability
- **Requirement Name:** Database Connection Auto-Recovery
- **Requirement Description:** If the primary database experiences a temporary hiccup, failover, or network partition, backend microservices must automatically reconnect using exponential backoff without requiring manual process restarts.
- **Applicable Platform:** Shared Core Backend.
- **Priority:** Must Have
- **Proposed Target / Measurement:** Automatic reconnection within 5.0 seconds of database restoration.
- **Verification Method:** Chaos engineering test simulating temporary database network severance for 10 seconds.
- **Dependencies:** Resilient database connection pooling with health check validation (`SELECT 1`).
- **Acceptance Criteria:** System recovers automatically within 5 seconds of database availability; pending read requests retry cleanly.
- **Status:** Confirmed Quality Standard.

---

## 8. Security Requirements

Security is critical to safeguard editorial integrity, prevent unauthorized direct publishing of unverified dispatches, protect user privacy, and defend against the "Dirty Dozen" malicious threat vectors cataloged in `security_spec.md`.

---

### 8.1 Authentication, Authorization & Session Hardening

#### NFR-SEC-001: Zero Client-Side Secret Exposure Architecture
- **NFR ID:** `NFR-SEC-001`
- **Category:** Security
- **Requirement Name:** Complete Client-Side Secret Isolation
- **Requirement Description:** Under zero circumstances shall any production AI API keys (Google Gemini), cloud storage service account credentials, database administrative passwords, or encryption keys be included in client-side JavaScript bundles, HTML documents, browser local storage, public git repositories, or decompiled Android APK binaries.
- **Applicable Platform:** Cross-Platform (Web & Native Android).
- **Priority:** Must Have (Non-Negotiable)
- **Proposed Target / Measurement:** Zero occurrences (0 instances) of credentials in client bundles or APK strings.
- **Verification Method:** Automated CI/CD git-secrets / TruffleHog scanner; static analysis of Webpack/Vite production bundles; static analysis of compiled Android APK using `apktool` and `strings`.
- **Dependencies:** Google Cloud Secret Manager / HashiCorp Vault; server-side API proxying.
- **Acceptance Criteria:** CI/CD pipeline immediately fails build if any secret signature or API key pattern (`AIzaSy...`) is detected in client assets.
- **Status:** Confirmed Quality Standard.

#### NFR-SEC-002: Authoritative Server-Side RBAC Enforcement
- **NFR ID:** `NFR-SEC-002`
- **Category:** Security
- **Requirement Name:** Server-Side Role-Based Access Control Validation
- **Requirement Description:** Client-side UI toggles and visibility flags are strictly treated as cosmetic hints. All access controls, publishing permissions, district constraints, and administrative actions must be authoritatively verified by server-side middleware on every single API request.
- **Applicable Platform:** Shared Core Backend.
- **Priority:** Must Have (Non-Negotiable)
- **Proposed Target / Measurement:** 100% of mutation endpoints protected by server-side role and permission validation middleware.
- **Verification Method:** Automated penetration test executing unauthorized curl mutations against all API routes.
- **Dependencies:** Cryptographically signed JWT tokens with tamper-proof claims; database permission lookups.
- **Acceptance Criteria:**
  - Standard Reporter token attempting to write `status: 'published'` returns HTTP 403 `PERMISSION_DENIED`.
  - Non-admin token attempting to modify category trees, tickers, or user roles returns HTTP 403 `PERMISSION_DENIED`.
  - Reporter attempting to submit news tagged with an unauthorized district returns HTTP 403 `DISTRICT_UNAUTHORIZED`.
- **Status:** Confirmed Quality Standard.

#### NFR-SEC-003: Session Management & Cryptographic Token Rotation
- **NFR ID:** `NFR-SEC-003`
- **Category:** Security
- **Requirement Name:** Short-Lived JWT & Secure Refresh Token Rotation
- **Requirement Description:** User and reporter sessions must utilize short-lived access tokens paired with secure refresh token rotation, ensuring compromised tokens have minimal attack windows and can be revoked instantly.
- **Applicable Platform:** Shared Backend, Web & Native Android.
- **Priority:** Must Have
- **Proposed Target / Measurement:**
  - Access Token TTL: Exactly 15 minutes.
  - Refresh Token TTL: 14 days, with single-use rotation (issuing new refresh token upon each refresh and invalidating previous token).
  - Storage: HTTP-only, Secure, SameSite=Strict cookies for Web; Android Keystore encrypted storage for Android.
- **Verification Method:** Token replay and expiration tests using Postman / automated test suite.
- **Dependencies:** Redis / Database refresh token whitelist; cryptographic signing key (RS256 / Ed25519).
- **Acceptance Criteria:** Replaying an already-used refresh token triggers automated invalidation of the entire user session family and logs a security alert.
- **Status:** Confirmed Quality Standard.

---

### 8.2 Threat Defense & Attack Surface Hardening

#### NFR-SEC-004: OWASP Top 10 Attack Surface Mitigation
- **NFR ID:** `NFR-SEC-004`
- **Category:** Security
- **Requirement Name:** Comprehensive OWASP Web & API Defense
- **Requirement Description:** The platform must implement robust, defense-in-depth mitigations against the full spectrum of OWASP Top 10 vulnerabilities.
- **Applicable Platform:** Shared Core Backend & Web Presentation.
- **Priority:** Must Have
- **Proposed Target / Measurement:** Zero high- or critical-severity vulnerabilities in dynamic and static security assessments.
- **Verification Method:** Automated OWASP ZAP dynamic penetration scans and third-party code security audits.
- **Dependencies:** Parameterized SQL queries / ORM mapping, DOMPurify HTML sanitization, Helmet.js security headers.
- **Acceptance Criteria:**
  - **SQL/NoSQL Injection:** 100% of database queries use parameterized inputs or validated schemas; zero raw string concatenation.
  - **Cross-Site Scripting (XSS):** All user-submitted article body HTML sanitized via DOMPurify before storage; Content Security Policy (CSP) headers enforced.
  - **Cross-Origin Resource Sharing (CORS):** Strict CORS whitelist allowing only official web and mobile origins; wildcard (`*`) origins prohibited on authenticated routes.
  - **Cross-Site Request Forgery (CSRF):** SameSite=Strict cookie policy and custom authorization header requirement (`X-Requested-With` / `Authorization: Bearer`).
- **Status:** Confirmed Quality Standard.

#### NFR-SEC-005: Media Upload Sanitization, MIME Magic-Bytes & Antivirus Scanning
- **NFR ID:** `NFR-SEC-005`
- **Category:** Security
- **Requirement Name:** Media File Upload Inspection & De-Weaponization
- **Requirement Description:** All uploaded photographs, audio dispatches, and video files from field reporters must undergo strict server-side inspection to prevent web shell uploads, executable disguised files, or malware payloads.
- **Applicable Platform:** Shared Core Backend (Media Pipeline).
- **Priority:** Must Have
- **Proposed Target / Measurement:** 100% of uploaded files validated against file-signature magic bytes; executable payloads rejected immediately.
- **Verification Method:** Penetration testing attempting to upload disguised polyglot files (e.g., `payload.php.jpg`, SVG script bombs).
- **Dependencies:** File magic-byte validator (e.g., `file-type`), Sharp image re-encoding pipeline, ClamAV antivirus scanner.
- **Acceptance Criteria:**
  - File extension is never trusted; MIME type verified by inspecting file header bytes.
  - All uploaded images are stripped of sensitive EXIF metadata (specifically GPS coordinates) and re-encoded into clean WebP/JPG formats before storage.
  - File sizes strictly enforced: Max 10MB per image, Max 100MB per video clip.
- **Status:** Confirmed Quality Standard.

#### NFR-SEC-006: Immutable System Audit Logging
- **NFR ID:** `NFR-SEC-006`
- **Category:** Security
- **Requirement Name:** Tamper-Proof Audit Logging
- **Requirement Description:** All high-privilege administrative actions, role modifications, editorial approvals, rejections, direct publishing by trusted reporters, and category deletions must be logged immutably.
- **Applicable Platform:** Shared Core Backend.
- **Priority:** Must Have
- **Proposed Target / Measurement:** Append-only audit table (`audit_logs`) where records cannot be updated or deleted by any user or administrator.
- **Verification Method:** Attempting SQL/NoSQL `UPDATE` or `DELETE` on `audit_logs` fails via database trigger or security rule.
- **Dependencies:** Dedicated append-only database table; automated server-side logging interceptors.
- **Acceptance Criteria:** Every direct publish by a Trusted Reporter logs `actorUid`, `districtId`, `articleId`, `ipAddress`, and `timestamp` within 500ms; logs retained for minimum 3 years.
- **Status:** Confirmed Quality Standard.

---

## 9. Privacy and Data Protection

Privacy standards ensure compliance with the **Digital Personal Data Protection (DPDP) Act, 2023** of India, maintaining ethical handling of reader and stringer personal information.

---

### 9.1 Data Minimization & Consent Management

#### NFR-PRIV-001: Data Minimization & Consent Governance
- **NFR ID:** `NFR-PRIV-001`
- **Category:** Privacy
- **Requirement Name:** Personal Data Minimization Principle
- **Requirement Description:** The platform shall collect only the minimum personal data strictly necessary to deliver news personalization and reporter credentialing.
- **Applicable Platform:** Cross-Platform.
- **Priority:** Must Have
- **Proposed Target / Measurement:** Zero storage of extraneous personal information (no tracking of browsing history across unrelated websites, no persistent unmasked IP storage).
- **Verification Method:** Data flow mapping audit and database schema inspection.
- **Dependencies:** Privacy policy agreement workflow during registration.
- **Acceptance Criteria:**
  - Public readers can browse published news completely anonymously without registering or granting personal identity permissions.
  - Reporter identity documents (Aadhaar, Voter ID, Press Cards) are stored in an encrypted private cloud bucket accessible strictly by Super Admin.
- **Status:** Confirmed Quality Standard.

#### NFR-PRIV-002: User Account Deletion & Right to Erasure
- **NFR ID:** `NFR-PRIV-002`
- **Category:** Privacy
- **Requirement Name:** Self-Service User Account Deletion
- **Requirement Description:** Registered public readers must have the ability to permanently delete their account, saved bookmarks, and personal profile data via a self-service settings interface.
- **Applicable Platform:** Web & Native Android.
- **Priority:** Must Have
- **Proposed Target / Measurement:** Account deletion completed within 24 hours of user confirmation; hard deletion of user profile and bookmarks.
- **Verification Method:** Executing account deletion test and verifying zero orphaned user profile records remain in database.
- **Dependencies:** User Profile Service, Auth Service.
- **Acceptance Criteria:** Initiating account deletion purges user profile, mobile number, and bookmarks; published articles authored by reporters remain intact with anonymized or historical byline as required by journalistic archival law.
- **Status:** Confirmed Quality Standard.

#### NFR-PRIV-003: Privacy-Safe Anonymized Telemetry
- **NFR ID:** `NFR-PRIV-003`
- **Category:** Privacy
- **Requirement Name:** Anonymized Analytics & Zero PII Logging
- **Requirement Description:** Internal readership telemetry, concurrent visitor meters, and trending story algorithms must operate strictly on aggregated or anonymized event data without recording identifiable personal data.
- **Applicable Platform:** Shared Core Backend & Analytics.
- **Priority:** Must Have
- **Proposed Target / Measurement:** Zero PII (no mobile numbers, email addresses, or unmasked IPs) written to analytics data stores.
- **Verification Method:** Automated inspection of analytics logs and event payloads.
- **Dependencies:** IP hashing / truncation utility; client session token anonymization.
- **Acceptance Criteria:** Analytics events capture `articleId`, `districtId`, `referrerSource`, and anonymized session hash; verified compliant with DPDP Act data minimization principles.
- **Status:** Confirmed Quality Standard.

---

## 10. Data Integrity and Consistency

Data integrity prevents the corruption of journalistic records, guarantees territorial jurisdiction enforcement, and protects historical archives.

---

### 10.1 Content & Relational Invariants

#### NFR-INTG-001: Editorial Workflow State Machine Invariants
- **NFR ID:** `NFR-INTG-001`
- **Category:** Data Integrity
- **Requirement Name:** Article Lifecycle State Machine Invariant
- **Requirement Description:** An article entity must strictly follow approved state machine transitions: `DRAFT` $\rightarrow$ `PENDING_REVIEW` $\rightarrow$ `APPROVED` $\rightarrow$ `PUBLISHED`, or `PENDING_REVIEW` $\rightarrow$ `REVISION_REQUESTED` $\rightarrow$ `PENDING_REVIEW`, or `PENDING_REVIEW` $\rightarrow$ `REJECTED`.
- **Applicable Platform:** Shared Core Backend.
- **Priority:** Must Have
- **Proposed Target / Measurement:** Zero unauthorized state transitions; atomic database transactions.
- **Verification Method:** Automated state transition test suite executing all valid and invalid state changes.
- **Dependencies:** Database transaction engine, schema validation rules.
- **Acceptance Criteria:**
  - Standard Reporter cannot transition an article directly from `DRAFT` to `PUBLISHED` (enforced via database constraints).
  - Only Trusted Reporters filing within assigned districts or Central Editors can execute transitions to `PUBLISHED`.
- **Status:** Confirmed Quality Standard.

#### NFR-INTG-002: Category Archival Link Preservation Safeguard
- **NFR ID:** `NFR-INTG-002`
- **Category:** Data Integrity
- **Requirement Name:** Permanent Historical URL & Article Preservation
- **Requirement Description:** Archiving, deactivating, or modifying a news category must never hard-delete or orphan associated historical articles or result in broken 404 links on search engines.
- **Applicable Platform:** Shared Core Backend & Database.
- **Priority:** Must Have
- **Proposed Target / Measurement:** Zero broken article links (0 HTTP 404s) generated when categories are archived or reordered.
- **Verification Method:** Automated regression test archiving a category containing 100 articles and verifying all 100 article URLs remain readable.
- **Dependencies:** Foreign key cascade protection; category `isArchived` flag logic.
- **Acceptance Criteria:** Hard deletion of categories with associated articles is blocked by database schema rules (`RESTRICT ON DELETE`); archived articles fall back to parent category breadcrumbs while retaining original URLs.
- **Status:** Confirmed Quality Standard.

#### NFR-INTG-003: Immutability of Author Identity & Raw Field Dispatches
- **NFR ID:** `NFR-INTG-003`
- **Category:** Data Integrity
- **Requirement Name:** Historical Authorship & Raw Script Immutability
- **Requirement Description:** Once an article is created and submitted, its `authorId`, initial `createdAt` timestamp, and original `rawScriptOriginal` notes cannot be altered or overwritten by any subsequent editor modifications.
- **Applicable Platform:** Shared Core Backend.
- **Priority:** Must Have
- **Proposed Target / Measurement:** 100% immutability of historical authorship attributes.
- **Verification Method:** Automated unit tests attempting to modify `authorId` or `rawScriptOriginal` during an editorial update.
- **Dependencies:** Database schema immutability triggers / field update guards.
- **Acceptance Criteria:** Editorial modifications update `editedBodyHtml` and `lastEditedByUid` while leaving `rawScriptOriginal` and `authorId` completely intact for legal accountability.
- **Status:** Confirmed Quality Standard.

---

## 11. Backup and Disaster Recovery

A comprehensive disaster recovery posture guarantees that catastrophic hardware failures, cloud data center outages, or accidental administrative errors do not result in permanent data loss.

---

### 11.1 Backup Frequency, Encryption & Replication

#### NFR-BCKP-001: Automated Daily Database Snapshots & Secondary Region Replication
- **NFR ID:** `NFR-BCKP-001`
- **Category:** Backup & Disaster Recovery
- **Requirement Name:** Automated Snapshot Schedule & Geo-Redundancy
- **Requirement Description:** Full database snapshots must be executed automatically during off-peak newsroom hours and replicated to a geographically distinct cloud region.
- **Applicable Platform:** Infrastructure & Database.
- **Priority:** Must Have
- **Proposed Target / Measurement:**
  - Automated full snapshot every 24 hours (scheduled at 03:00 IST).
  - Transaction logs (WAL / OpLog) backed up continuously for point-in-time recovery.
  - Multi-region replication to a secondary data center (e.g., Primary: Mumbai `asia-south1`, Secondary: Delhi `asia-south2`).
- **Verification Method:** Automated daily backup verification script checking snapshot completion and sha256 checksums.
- **Dependencies:** Managed Cloud Database Backup Service (Cloud SQL / Cloud Spanner / MongoDB Atlas).
- **Acceptance Criteria:** Daily backup snapshot creates verified, encrypted archive without degrading live query performance.
- **Status:** Proposed Target.

#### NFR-BCKP-002: Recovery Point Objective (RPO) & Recovery Time Objective (RTO)
- **NFR ID:** `NFR-BCKP-002`
- **Category:** Backup & Disaster Recovery
- **Requirement Name:** Target Recovery Metrics (RPO & RTO)
- **Requirement Description:** In the event of a catastrophic primary data center failure, the platform must recover operations within explicitly defined time and data loss boundaries.
- **Applicable Platform:** Cross-Platform Infrastructure.
- **Priority:** Must Have
- **Proposed Target / Measurement:**
  - **Proposed RPO (Maximum allowable data loss):** $\le$ 15 minutes of published content (utilizing point-in-time transaction log replays).
  - **Proposed RTO (Maximum allowable downtime to restore service):** $\le$ 2.0 hours for complete failover to secondary region.
- **Verification Method:** Semi-annual simulated disaster recovery drill executing database restoration and DNS cutover in staging.
- **Dependencies:** Multi-region infrastructure provisioning, automated restoration runbooks.
- **Acceptance Criteria:** Simulated disaster recovery restoration completes within 2 hours with verified data loss of less than 15 minutes.
- **Status:** Proposed Target (Requires executive business continuity sign-off).

---

## 12. Media and Storage Performance

Multimedia reporting is essential for engagement in digital news. Media processing pipelines must optimize asset delivery for slow networks while preserving editorial quality and original source records.

---

### 12.1 Image Processing & Compression Pipelines

#### NFR-MED-001: Automated Responsive Image Derivatives & Modern WebP/AVIF Encoding
- **NFR ID:** `NFR-MED-001`
- **Category:** Media Performance
- **Requirement Name:** Automated Multi-Resolution Image Encoding
- **Requirement Description:** Every uploaded news photograph must automatically generate responsive, modern format derivatives (WebP primary, AVIF where supported) tailored for varying viewport widths.
- **Applicable Platform:** Shared Core Backend (Media Pipeline).
- **Priority:** Must Have
- **Proposed Target / Measurement:**
  - Derivative Generation: Max 3 seconds per image upload.
  - Standard Sizes:
    - Thumbnail: 150x150px (square feed card)
    - Medium: 600x338px (16:9 mobile article lead)
    - Full: 1200x675px (16:9 desktop banner & Open Graph preview)
  - Compression Target: Image file sizes reduced by $\ge 70\%$ compared to original camera raw inputs while maintaining 80% visual perceptual quality (SSIM $\ge 0.95$).
- **Verification Method:** Automated image processing benchmark using Sharp library; visual SSIM quality verification.
- **Dependencies:** Serverless image processing container; Cloud Object Storage.
- **Acceptance Criteria:** Uploading a 6MB mobile photo produces 1200px WebP derivative under 250KB within 3 seconds.
- **Status:** Confirmed Quality Standard.

#### NFR-MED-002: Video Transcoding & Adaptive Bitrate Streaming
- **NFR ID:** `NFR-MED-002`
- **Category:** Media Performance
- **Requirement Name:** H.264 MP4 Transcoding & HLS Streaming
- **Requirement Description:** Uploaded video clips and Video Studio exports must be encoded using universally compatible H.264 video with AAC audio, packaged for adaptive streaming on mobile devices.
- **Applicable Platform:** Shared Core Backend & Media Delivery.
- **Priority:** Should Have
- **Proposed Target / Measurement:**
  - Transcoding Latency: Max 90 seconds for a 60-second vertical reel (Cloud Run FFmpeg worker).
  - Target Bitrate: 1080p vertical reel $\le 2.5\text{ Mbps}$; 720p stream $\le 1.2\text{ Mbps}$.
- **Verification Method:** Automated video encoding test measuring render duration and testing playback across iOS Safari, Android Chrome, and native ExoPlayer.
- **Dependencies:** Cloud Run FFmpeg container; CDN video streaming endpoints.
- **Acceptance Criteria:** Exported MP4 videos initiate playback in < 1.0s on 4G networks; hardware-accelerated decoding confirmed on mid-range Android devices.
- **Status:** Proposed Target.

---

## 13. AI Service Reliability & Newsroom Governance

The AI Newsroom Engine empowers journalists with rapid structuring while enforcing strict editorial oversight, key redundancy, and cost controls.

---

### 13.1 AI Service Availability & Multi-Key Failover

#### NFR-AI-001: Multi-Key Load Balancing & Server-Side Vault
- **NFR ID:** `NFR-AI-001`
- **Category:** AI Reliability
- **Requirement Name:** Server-Side Multi-Key AI Load Balancer
- **Requirement Description:** AI newsroom requests (Raw script structuring, headline generation, URL synthesis) must be distributed across an active pool of encrypted Google Gemini API keys to avoid hitting individual key rate limits.
- **Applicable Platform:** Shared Core Backend.
- **Priority:** Must Have
- **Proposed Target / Measurement:** Round-robin load distribution across active keys; 100% server-side isolation with zero client key exposure.
- **Verification Method:** Load testing simulating 100 concurrent AI structuring requests and logging key rotation metrics.
- **Dependencies:** Google Gemini SDK (`@google/genai`), Redis key state manager.
- **Acceptance Criteria:** Requests distribute evenly across available keys in pool; quota consumption tracked in real-time.
- **Status:** Confirmed Quality Standard.

#### NFR-AI-002: Sub-1.5s Automated Failover & Rate-Limit Interception
- **NFR ID:** `NFR-AI-002`
- **Category:** AI Reliability
- **Requirement Name:** Automated Sub-1.5s Rate-Limit Failover
- **Requirement Description:** When an active Gemini API key encounters HTTP 429 (Rate Limit Exceeded), an upstream 5xx error, or latency exceeding 8.0 seconds, the gateway must automatically retry on a standby key in under 1.5 seconds.
- **Applicable Platform:** Shared Core Backend.
- **Priority:** Must Have
- **Proposed Target / Measurement:** Failover completed in $\le 1.5$ seconds; 99.9% completion success rate for journalist AI requests.
- **Verification Method:** Automated chaos test mocking HTTP 429 response on Key #1 and verifying transparent completion via Key #2.
- **Dependencies:** Axios / Fetch interceptor with retry policy; standby key pool.
- **Acceptance Criteria:** Journalist experiences zero error modals during an upstream 429 rate limit; request completes transparently within 4.5s total round-trip time.
- **Status:** Confirmed Quality Standard.

#### NFR-AI-003: Mandatory Human Editorial Review Gate
- **NFR ID:** `NFR-AI-003`
- **Category:** AI Governance
- **Requirement Name:** Zero Unsupervised AI Publishing Invariant
- **Requirement Description:** Under zero circumstances shall the AI Newsroom Engine possess the authority or API capability to publish an article directly to the public live portal without explicit human authorization (Super Admin or authorized Trusted Reporter).
- **Applicable Platform:** Shared Core Backend.
- **Priority:** Must Have (Non-Negotiable)
- **Proposed Target / Measurement:** 100% compliance; AI outputs default strictly to `status: 'draft'` or `status: 'pending_review'`.
- **Verification Method:** Codebase inspection and schema test confirming AI worker service account lacks `publishArticle` permission claims.
- **Dependencies:** RBAC permission engine, database schema validation.
- **Acceptance Criteria:** AI structuring and URL extraction endpoints return draft payloads to the editor UI; direct public publishing from automated AI background routines is architecturally impossible.
- **Status:** Confirmed Quality Standard.

---

## 14. API Quality Requirements

The single shared API gateway must deliver consistent, versioned, and platform-neutral contracts to seamlessly power both the Web platform and the future Native Android application.

---

### 14.1 Contract Standards, Versioning & Idempotency

#### NFR-API-001: Standardized JSON Envelope & Platform-Neutral Contracts
- **NFR ID:** `NFR-API-001`
- **Category:** API Quality
- **Requirement Name:** Unified JSON Response Envelope
- **Requirement Description:** All REST API endpoints must return responses adhering to a single, platform-neutral JSON envelope structure for both success and error states.
- **Applicable Platform:** Shared Core Backend.
- **Priority:** Must Have
- **Proposed Target / Measurement:**
  - Success Envelope: `{ success: true, data: {...}, meta: { timestamp, version, pagination? }, error: null }`
  - Error Envelope: `{ success: false, data: null, error: { code: 'STRING_CODE', messageHindi: '...', details?: [...] } }`
- **Verification Method:** Automated schema validation using OpenAPI 3.1 / JSON Schema in CI/CD pipeline.
- **Dependencies:** Express / Fastify response formatting middleware.
- **Acceptance Criteria:** 100% of API endpoints conform to the unified envelope; error codes are machine-readable and paired with user-friendly Devanagari messages.
- **Status:** Confirmed Quality Standard.

#### NFR-API-002: Semantic API Versioning & Backward Compatibility
- **NFR ID:** `NFR-API-002`
- **Category:** API Quality
- **Requirement Name:** Semantic URI Versioning & Android Backward Compatibility
- **Requirement Description:** All public and newsroom API endpoints must incorporate URI path versioning (`/api/v1/...`). Breaking schema changes must never be introduced to an active version, ensuring older versions of the Native Android app continue functioning reliably.
- **Applicable Platform:** Shared Core Backend.
- **Priority:** Must Have
- **Proposed Target / Measurement:** Minimum 12 months backward compatibility for published Android API endpoints.
- **Verification Method:** Automated contract testing using Pact or Prism running regression suites against previous Android payload schemas.
- **Dependencies:** API Gateway routing; semantic versioning policy.
- **Acceptance Criteria:** Modifying database models for Web features does not alter the JSON contract structure expected by Android v1 clients.
- **Status:** Confirmed Quality Standard.

#### NFR-API-003: Cursor-Based Pagination for High-Velocity Feeds
- **NFR ID:** `NFR-API-003`
- **Category:** API Quality
- **Requirement Name:** Cursor Pagination Protocol
- **Requirement Description:** News feed and review queue endpoints must implement cursor-based pagination rather than offset-based pagination (`OFFSET / LIMIT`), preventing missed or duplicate articles during high-frequency breaking news publishing.
- **Applicable Platform:** Shared Core Backend.
- **Priority:** Must Have
- **Proposed Target / Measurement:** Query execution time $\le 50\text{ ms}$ regardless of pagination depth (Page 1 vs Page 100).
- **Verification Method:** Database benchmark comparing cursor query (`WHERE publishedAt < :cursor ORDER BY publishedAt DESC LIMIT 20`) against offset queries.
- **Dependencies:** Compound B-tree indexes on `(publishedAt, id)`.
- **Acceptance Criteria:** Paginating through 50,000 articles maintains constant sub-50ms query latency; zero duplicate articles returned when new breaking stories are inserted between pagination calls.
- **Status:** Confirmed Quality Standard.

---

## 15. Native Android Requirements (Stage B)

The Phase 2 Native Android Application must deliver an institutional-grade, hardware-accelerated vernacular experience built in pure Kotlin with the Android SDK. **Zero WebView wrappers are permitted as production deliverables.**

---

### 15.1 Android Performance, Lifecycles & Offline Readiness

#### NFR-ANDR-001: Native Application Startup & Launch Benchmarks
- **NFR ID:** `NFR-ANDR-001`
- **Category:** Native Android Performance
- **Requirement Name:** Android Cold and Warm App Launch Performance
- **Requirement Description:** The native Android application must initialize and display the cached home newsfeed within strict startup limits on mid-range Android devices (e.g., 4GB RAM, MediaTek Helio / Snapdragon 600-series).
- **Applicable Platform:** Native Android Application (Stage B).
- **Priority:** Must Have
- **Proposed Target / Measurement:**
  - **Proposed Cold Launch Target:** Time to Initial Display $\le$ 1.5 seconds.
  - **Proposed Warm Launch Target:** Time to Initial Display $\le$ 500 milliseconds.
- **Verification Method:** Android Vitals telemetry; Android Studio Macrobenchmark library testing on physical devices.
- **Dependencies:** Jetpack App Startup library; lazy initialization of non-critical SDKs.
- **Acceptance Criteria:** Android Vitals cold launch score rated "Good" in Google Play Console (top 25% of peer applications).
- **Status:** Proposed Target.

#### NFR-ANDR-002: 60fps Native Feed Scrolling & Hardware Acceleration
- **NFR ID:** `NFR-ANDR-002`
- **Category:** Native Android Performance
- **Requirement Name:** 60fps UI Scrolling & Zero Frame Drops
- **Requirement Description:** News feeds, category lists, and vertical reel carousels rendered via Jetpack Compose `LazyColumn` must sustain smooth 60fps scrolling without UI thread stutter or memory leaks.
- **Applicable Platform:** Native Android Application.
- **Priority:** Must Have
- **Proposed Target / Measurement:** Frozen frame rate $< 0.1\%$; slow render frame rate ($> 16\text{ms}$) $< 2.0\%$.
- **Verification Method:** Android Studio Profiler GPU rendering inspection and automated UI automated scrolling tests.
- **Dependencies:** Compose compiler stability; Coil image memory caching with automatic bitmap recycling.
- **Acceptance Criteria:** Scrolling continuously through 100 news cards with thumbnails drops fewer than 2 frames out of 1,000.
- **Status:** Proposed Target.

#### NFR-ANDR-003: WorkManager Offline Prefetching & Room Database Caching
- **NFR ID:** `NFR-ANDR-003`
- **Category:** Native Android Reliability
- **Requirement Name:** Offline News Caching & Background Prefetching
- **Requirement Description:** The application must utilize Android `WorkManager` to prefetch breaking news headlines and the user's preferred district feed into a local SQLite Room database during Wi-Fi or charging states, enabling instantaneous offline reading.
- **Applicable Platform:** Native Android Application.
- **Priority:** Must Have
- **Proposed Target / Measurement:** Complete offline availability of the latest 50 articles and all saved bookmarks with zero network dependency.
- **Verification Method:** Launching app in Airplane Mode and verifying all 50 prefetched stories open with full Devanagari text and cached images.
- **Dependencies:** Android Jetpack Room DB, Android Jetpack WorkManager.
- **Acceptance Criteria:** When network connectivity is severed, app opens immediately from local Room cache with an unobtrusive offline badge; zero app crashes.
- **Status:** Confirmed Quality Standard.

#### NFR-ANDR-004: Battery Efficiency & Background Data Limits
- **NFR ID:** `NFR-ANDR-004`
- **Category:** Native Android Performance
- **Requirement Name:** Battery Consumption & Network Background Limits
- **Requirement Description:** Background synchronization, prefetching, and FCM push listener operations must respect Android battery optimization rules (Doze Mode, App Standby Buckets).
- **Applicable Platform:** Native Android Application.
- **Priority:** Must Have
- **Proposed Target / Measurement:** Background battery consumption $\le 2.0\%$ of daily device battery discharge over 24 hours of typical background standby.
- **Verification Method:** Android Studio Energy Profiler; Battery Historian analysis on Android 12+ devices.
- **Dependencies:** WorkManager constraints (`NetworkType.UNMETERED`, `RequiresCharging`); FCM high-priority flags restricted strictly to critical breaking flashes.
- **Acceptance Criteria:** Android system never flags BREAKING NEWS WALA for excessive background wakeups or excessive battery drain in Google Play Vitals.
- **Status:** Proposed Target.

---

## 16. Usability and Accessibility (WCAG 2.1 AA)

BREAKING NEWS WALA serves a diverse vernacular audience across tier-2, tier-3, and rural tehsils. The interface must be immediately intuitive for all ages and fully accessible to citizens with visual impairments.

---

### 16.1 Hindi Vernacular Usability & Typography Standards

#### NFR-A11Y-001: Devanagari Vernacular Typography & Readability
- **NFR ID:** `NFR-A11Y-001`
- **Category:** Usability & Typography
- **Requirement Name:** Devanagari Font Stacking & Comfortable Reading Metrics
- **Requirement Description:** Hindi typography must render with exceptional clarity using clean Devanagari typefaces (Noto Sans Devanagari / Mukta) with generous line heights to prevent overlapping matras or conjuncts.
- **Applicable Platform:** Cross-Platform (Web & Native Android).
- **Priority:** Must Have
- **Proposed Target / Measurement:** Article body line-height $\ge 1.75$; base font size 16px scalable to 22px via in-reader controls (`अ-`, `अ`, `अ+`).
- **Verification Method:** Visual typography inspection across Android Chrome, iOS Safari, desktop monitors, and low-resolution budget phone screens.
- **Dependencies:** Web font pre-loading with `display: swap`; Android system font fallbacks.
- **Acceptance Criteria:** Devanagari compound characters (संयुक्त अक्षर) and upper/lower matras (मात्राएं) render without clipping, truncation, or letter collisions across all font scale levels.
- **Status:** Confirmed Quality Standard.

#### NFR-A11Y-002: WCAG 2.1 AA Color Contrast Ratios
- **NFR ID:** `NFR-A11Y-002`
- **Category:** Accessibility
- **Requirement Name:** High-Contrast Typography & Theming
- **Requirement Description:** Text elements across both light mode and dark mode must achieve the strict contrast ratios mandated by WCAG 2.1 Level AA.
- **Applicable Platform:** Cross-Platform.
- **Priority:** Must Have
- **Proposed Target / Measurement:** Minimum contrast ratio of 4.5:1 for normal body text and 3:1 for large headlines (18px bold / 24px regular).
- **Verification Method:** Automated axe-core / Lighthouse accessibility audits; Chrome DevTools color contrast picker.
- **Dependencies:** Approved color tokens (Light: `#1F2937` text on `#FFFFFF`; Dark: `#F3F4F6` text on `#111827`; Brand Yellow `#EAB308`; Brand Red `#DC2626`).
- **Acceptance Criteria:** 100% of text and primary user interface controls pass WCAG 2.1 AA automated contrast checks with zero contrast violations.
- **Status:** Confirmed Quality Standard.

#### NFR-A11Y-003: Mobile Touch Target Sizing
- **NFR ID:** `NFR-A11Y-003`
- **Category:** Usability (Mobile)
- **Requirement Name:** Minimum Touch Target Dimensions
- **Requirement Description:** All interactive buttons, category pills, bookmark ribbons, district dropdown items, and media controls must conform to standard mobile ergonomics to prevent mis-taps.
- **Applicable Platform:** Web Mobile & Native Android App.
- **Priority:** Must Have
- **Proposed Target / Measurement:** Minimum touch target size of 48x48 CSS pixels / density-independent pixels (dp) with minimum 8dp spacing between adjacent touch targets.
- **Verification Method:** Chrome DevTools mobile emulation; Android Accessibility Scanner audit.
- **Dependencies:** Responsive CSS button padding; Material 3 touch target enforcement.
- **Acceptance Criteria:** Android Accessibility Scanner reports zero touch-target sizing warnings on primary navigation and article reader screens.
- **Status:** Confirmed Quality Standard.

---

## 17. Browser, Device and Network Compatibility

BREAKING NEWS WALA must operate reliably across the diverse fragmentation of devices, browsers, and network tiers prevalent throughout the Indian subcontinent.

---

### 17.1 Cross-Browser & Viewport Matrix

#### NFR-COMP-001: Cross-Browser & Viewport Responsiveness
- **NFR ID:** `NFR-COMP-001`
- **Category:** Compatibility (Web)
- **Requirement Name:** Browser Engine & Screen Resolution Compatibility
- **Requirement Description:** The responsive web application must render flawlessly and function identically across all major modern browser engines and viewport resolutions.
- **Applicable Platform:** Web Platform.
- **Priority:** Must Have
- **Proposed Target / Measurement:**
  - **Supported Mobile Browsers:** Google Chrome Mobile (latest 3 major versions), Samsung Internet (latest 2 versions), mobile Firefox, mobile Safari (iOS 15+).
  - **Supported Desktop Browsers:** Google Chrome, Mozilla Firefox, Microsoft Edge, Apple Safari.
  - **Supported Viewports:** 320px (budget smartphone) up to 2560px (ultra-wide desktop 2K/4K).
- **Verification Method:** Automated cross-browser testing using Playwright across browser engines (Chromium, WebKit, Firefox) and viewport dimensions.
- **Dependencies:** CSS Autoprefixer; modern CSS grid/flexbox layouts; polyfills for legacy APIs.
- **Acceptance Criteria:** Zero layout breakage or unclickable controls across tested browsers; horizontal scrollbar never appears on viewports $\ge 320\text{px}$.
- **Status:** Confirmed Quality Standard.

#### NFR-COMP-002: Multi-Tier Network Adaptability (2G/3G/4G/5G)
- **NFR ID:** `NFR-COMP-002`
- **Category:** Compatibility (Network)
- **Requirement Name:** Network Adaptive Loading & Low-Bandwidth Mode
- **Requirement Description:** The platform must detect slow network conditions and adapt asset delivery to ensure news readability on 2G and congested 3G cellular connections.
- **Applicable Platform:** Cross-Platform.
- **Priority:** Should Have
- **Proposed Target / Measurement:** Core article text loads and becomes readable in $\le 2.0$ seconds on simulated 3G networks (400 Kbps, 400ms RTT); manual "कम डेटा मोड" (Low Data Mode) reduces total transfer payload by $\ge 60\%$.
- **Verification Method:** Network throttling simulation in Chrome DevTools / WebPageTest; physical testing in rural cellular signal zones.
- **Dependencies:** Network Information API (`navigator.connection`); responsive image `srcset`; lazy loading.
- **Acceptance Criteria:** In low-bandwidth mode, video autoplay is suppressed, low-resolution thumbnails are substituted, and page transfer size drops below 400KB per visit.
- **Status:** Proposed Target.

---

## 18. Maintainability and Extensibility

Maintainability ensures that the platform can be cleanly refactored, extended with new vernacular languages, and maintained by a distributed engineering team with high velocity and minimal technical debt.

---

### 18.1 Code Quality, Modularity & Database Migration Safety

#### NFR-MAINT-001: Strict TypeScript & Clean Architecture Modularity
- **NFR ID:** `NFR-MAINT-001`
- **Category:** Maintainability
- **Requirement Name:** TypeScript Strict Mode & Clean Domain Separation
- **Requirement Description:** All shared backend microservices and web frontend codebases must be authored in TypeScript with strict typing enabled (`strict: true`), enforcing modular separation between controllers, domain business logic, and database access layers.
- **Applicable Platform:** Shared Core Backend & Web Presentation.
- **Priority:** Must Have
- **Proposed Target / Measurement:** Zero TypeScript compiler errors (`tsc --noEmit`); zero usage of explicit `any` types in core domain models.
- **Verification Method:** Automated CI/CD pipeline typecheck and ESLint checks.
- **Dependencies:** TypeScript 5.x compiler, shared type declaration package.
- **Acceptance Criteria:** CI/CD build fails if any type error or forbidden `any` assertion is detected in pull requests.
- **Status:** Confirmed Quality Standard.

#### NFR-MAINT-002: Automated CI/CD Test Coverage & Code Quality Gates
- **NFR ID:** `NFR-MAINT-002`
- **Category:** Maintainability
- **Requirement Name:** Automated Test Suite & Code Quality Gates
- **Requirement Description:** Core business logic, RBAC security rules, territorial jurisdiction filters, and API response envelopes must be protected by automated unit and integration tests.
- **Applicable Platform:** Shared Core Backend & Web Presentation.
- **Priority:** Must Have
- **Proposed Target / Measurement:** **Proposed Target:** Minimum 80% line coverage across core domain services, auth middleware, and editorial state machine controllers.
- **Verification Method:** Jest / Vitest code coverage reports generated during automated GitHub Actions CI pipeline.
- **Dependencies:** Vitest / Jest test runner, Supertest API testing framework.
- **Acceptance Criteria:** Pull requests cannot be merged unless all automated tests pass and overall coverage remains $\ge 80\%$.
- **Status:** Proposed Target.

#### NFR-MAINT-003: Database Migration Safety & Reversibility
- **NFR ID:** `NFR-MAINT-003`
- **Category:** Maintainability
- **Requirement Name:** Zero-Downtime Reversible Database Migrations
- **Requirement Description:** All database schema modifications must be scripted as versioned, reversible migration files (e.g., Prisma / Knex / Flyway), adhering to expand-and-contract zero-downtime database deployment practices.
- **Applicable Platform:** Shared Database.
- **Priority:** Must Have
- **Proposed Target / Measurement:** 100% of schema changes have an automated, verified down-migration (rollback script).
- **Verification Method:** Automated migration testing in staging: `migrate:up` followed by `migrate:down` and `migrate:up` validation.
- **Dependencies:** Database migration tool, CI/CD pipeline.
- **Acceptance Criteria:** Schema migrations execute in under 30 seconds without taking exclusive table locks that block active read queries.
- **Status:** Confirmed Quality Standard.

---

## 19. Observability and Monitoring

Comprehensive observability provides newsroom executives and technical operators with deep, real-time insight into application performance, API health, security anomalies, and editorial bottlenecks.

---

### 19.1 Telemetry, APM & Real-Time Alerting

#### NFR-OBS-001: Centralized Application Performance Monitoring (APM) & Error Tracing
- **NFR ID:** `NFR-OBS-001`
- **Category:** Observability
- **Requirement Name:** Centralized APM & Real-Time Distributed Tracing
- **Requirement Description:** All backend microservices, database queries, and client-side web/Android exceptions must be tracked through centralized APM and error reporting services (e.g., OpenTelemetry, Sentry, Google Cloud Trace).
- **Applicable Platform:** Cross-Platform.
- **Priority:** Must Have
- **Proposed Target / Measurement:** 100% of unhandled server exceptions and client crashes captured within 15 seconds with full stack traces and context metadata.
- **Verification Method:** Triggering a simulated synthetic exception in staging and verifying receipt in Sentry / APM dashboard.
- **Dependencies:** Sentry / OpenTelemetry SDK integration.
- **Acceptance Criteria:** Every captured error includes correlation ID, user role, district context (if applicable), and request payload (sanitized of passwords/PII).
- **Status:** Confirmed Quality Standard.

#### NFR-OBS-002: Infrastructure Health Probes & Incident Alerting
- **NFR ID:** `NFR-OBS-002`
- **Category:** Observability
- **Requirement Name:** Health Probes & High-Severity Incident Notification
- **Requirement Description:** The system must expose dedicated `/health/live` and `/health/ready` probe endpoints testing database connectivity, Redis cache responsiveness, and AI API pool health.
- **Applicable Platform:** Shared Core Backend.
- **Priority:** Must Have
- **Proposed Target / Measurement:** PagerDuty / SMS / Email alert dispatches to on-call technical leads within 60 seconds if error rate exceeds 2.0% over 5 minutes or if database health probe fails.
- **Verification Method:** Automated health probe queries executed every 15 seconds; simulated health probe failure triggers on-call alert.
- **Dependencies:** Prometheus alert rules / Cloud Monitoring alert policies.
- **Acceptance Criteria:** Container orchestrator automatically restarts unhealthy containers failing liveness probes; on-call engineer alerted within 1 minute of critical outage.
- **Status:** Confirmed Quality Standard.

---

## 20. Load and Stress Testing Framework

To validate that BREAKING NEWS WALA satisfies its non-functional requirements prior to commercial launch, the platform must undergo rigorous, structured load testing simulating real-world Indian breaking news scenarios.

```
+----------------------------------------------------------------------------------------------------+
|                                    LOAD & STRESS TESTING SUITES                                    |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|    TEST SUITE 1: STEADY-STATE BASELINE LOAD                                                        |
|    - 2,000 Concurrent Readers browsing feeds and articles                                          |
|    - 100 Concurrent Field Reporters filing dispatches                                              |
|    - Verified Target: p95 API Latency < 200ms; CPU utilization < 40%                               |
|                                                                                                    |
|    TEST SUITE 2: BREAKING NEWS TRAFFIC BURST (10x SPIKE)                                           |
|    - Ramp from 1,000 to 10,000 Concurrent Readers over 90 seconds                                  |
|    - 500 Concurrent Field Reporters uploading photos and triggering AI structuring dispatches       |
|    - Verified Target: Zero 5xx errors; p95 latency < 600ms; horizontal autoscaling activates cleanly|
|                                                                                                    |
|    TEST SUITE 3: ENDURANCE SOAK TEST (24 HOURS)                                                    |
|    - Continuous 3,000 Concurrent Readers over 24 uninterrupted hours                               |
|    - Verified Target: Zero memory leaks; zero database connection pool leaks; flat latency curves  |
|                                                                                                    |
|    TEST SUITE 4: CHAOS & FAILOVER DRILL                                                            |
|    - Simulate primary AI key rate limit (HTTP 429) -> Verify sub-1.5s failover to standby key       |
|    - Simulate primary database network blip -> Verify 5s connection auto-recovery                  |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 21. NFR Traceability Matrix

The following matrix maps the quality requirements defined in this document to their corresponding PRD Requirements, Feature Specifications, and Master Development Phases:

| NFR ID | Requirement Name | Category | Primary PRD Ref | Related Feature ID | Engineering Phase | Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **NFR-PERF-001**| Largest Contentful Paint (LCP) | Performance | Section 28 | `FEAT-PUB-001`, `FEAT-PUB-007` | Phase 6 | Proposed |
| **NFR-PERF-002**| Interaction to Next Paint (INP) | Performance | Section 28 | `FEAT-PUB-005`, `FEAT-PUB-006` | Phase 6 | Proposed |
| **NFR-PERF-003**| Cumulative Layout Shift (CLS) | Performance | Section 28 | `FEAT-MON-001`, `FEAT-PUB-001` | Phase 6 | Confirmed |
| **NFR-PERF-004**| Full-Text Search Latency | Performance | PUB-006 | `FEAT-PUB-008` | Phase 6 | Proposed |
| **NFR-PERF-005**| Public Read API Latency (p95) | Performance | Section 28 | `FEAT-PUB-002`, `FEAT-CAT-001` | Phase 2 | Proposed |
| **NFR-PERF-006**| Authenticated Mutation Latency | Performance | Section 28 | `FEAT-CRE-001`, `FEAT-ADM-004` | Phase 2 | Proposed |
| **NFR-PERF-007**| Breaking Ticker Broadcast Latency| Performance | NOT-001 | `FEAT-ADM-005`, `FEAT-NOT-001` | Phase 11 | Proposed |
| **NFR-PERF-008**| Breaking News Traffic Surge | Performance | Section 28 | Infrastructure | Phase 14 | Proposed |
| **NFR-SCAL-001**| 10,000 Concurrent Readers | Scalability | Section 28 | `FEAT-PUB-001` | Phase 14 | Proposed |
| **NFR-SCAL-002**| 500 Concurrent Reporters | Scalability | Section 28 | `FEAT-CRE-001`, `FEAT-REP-005` | Phase 4 | Proposed |
| **NFR-SCAL-003**| 1M Articles / 5M Media Assets | Scalability | Section 7 | `FEAT-ADM-006`, Database | Phase 2 | Confirmed |
| **NFR-SCAL-004**| CDN Edge Cache Hit Ratio $\ge$ 90%| Scalability | Section 28 | Infrastructure | Phase 1 | Proposed |
| **NFR-AVAL-001**| 99.9% Portal & API Uptime | Availability | Section 28 | Infrastructure | Phase 14 | Proposed |
| **NFR-AVAL-002**| Zero-Downtime Rolling Deployments| Availability | Section 28 | CI/CD Infrastructure | Phase 1 | Confirmed |
| **NFR-AVAL-003**| Offline Graceful Degradation | Reliability | PUB-011 | `FEAT-MED-005`, `FEAT-PUB-010` | Phase 6 / 13 | Confirmed |
| **NFR-AVAL-004**| Database Auto-Recovery (5s) | Reliability | Section 28 | Database Client | Phase 2 | Confirmed |
| **NFR-SEC-001** | Zero Client-Side Secret Exposure| Security | SEC-002 | `FEAT-API-001`, `FEAT-SEC-001` | Phase 1 / 7 | Confirmed |
| **NFR-SEC-002** | Server-Side RBAC Enforcement | Security | SEC-001 | `FEAT-SEC-001`, `FEAT-REP-004` | Phase 2 | Confirmed |
| **NFR-SEC-003** | Short-Lived JWT & Token Rotation| Security | SEC-004 | `FEAT-USR-001`, `FEAT-USR-004` | Phase 2 | Confirmed |
| **NFR-SEC-004** | OWASP Top 10 Attack Defense | Security | Section 27 | `FEAT-SEC-001`, `FEAT-CRE-001` | Phase 14 | Confirmed |
| **NFR-SEC-005** | Media Upload MIME & Malware Scan| Security | SEC-005 | `FEAT-CRE-004`, `FEAT-SEC-002` | Phase 4 | Confirmed |
| **NFR-SEC-006** | Immutable System Audit Logging | Security | SEC-003 | `FEAT-SYS-002`, `FEAT-REP-004` | Phase 2 | Confirmed |
| **NFR-PRIV-001**| Data Minimization & Consent | Privacy | Section 10 | `FEAT-USR-001`, `FEAT-REP-001` | Phase 2 | Confirmed |
| **NFR-PRIV-002**| User Account Deletion (24h) | Privacy | Section 10 | `FEAT-USR-004` | Phase 2 | Confirmed |
| **NFR-PRIV-003**| Anonymized Analytics (No PII) | Privacy | Section 24 | `FEAT-ANA-001`, `FEAT-ANA-003` | Phase 12 | Confirmed |
| **NFR-INTG-001**| Article State Machine Invariants| Data Integrity | Section 17 | `FEAT-CRE-005`, `FEAT-ADM-004` | Phase 2 / 5 | Confirmed |
| **NFR-INTG-002**| Category Archival 404 Prevention| Data Integrity | CAT-002 | `FEAT-CAT-002` | Phase 3 | Confirmed |
| **NFR-INTG-003**| Immutability of Authorship | Data Integrity | Section 10 | `FEAT-CRE-001`, `FEAT-ADM-003` | Phase 2 | Confirmed |
| **NFR-BCKP-001**| Daily Automated Snapshots | Disaster Recovery| Section 28 | `FEAT-SYS-003` | Phase 1 | Proposed |
| **NFR-BCKP-002**| Target RPO $\le$ 15m / RTO $\le$ 2h | Disaster Recovery| Section 28 | `FEAT-SYS-003` | Phase 14 | Proposed |
| **NFR-MED-001** | Multi-Resolution WebP/AVIF Encoding| Media Performance| Section 28 | `FEAT-CRE-004`, `FEAT-MED-001` | Phase 4 | Confirmed |
| **NFR-MED-002** | H.264 MP4 / HLS Adaptive Video | Media Performance| VID-004 | `FEAT-VID-003`, `FEAT-MED-001` | Phase 10 | Proposed |
| **NFR-AI-001**  | Multi-Key Load Balancer & Vault | AI Reliability | API-001 | `FEAT-API-001`, `FEAT-API-002` | Phase 7 | Confirmed |
| **NFR-AI-002**  | Sub-1.5s Automated Failover | AI Reliability | API-003 | `FEAT-API-003`, `FEAT-CRE-002` | Phase 7 | Confirmed |
| **NFR-AI-003**  | Zero Unsupervised AI Publishing | AI Governance | Section 8 | `FEAT-CRE-002`, `FEAT-RSS-002` | Phase 7 | Confirmed |
| **NFR-API-001** | Unified REST/JSON Envelope | API Quality | Section 9 | All API Endpoints | Phase 1 | Confirmed |
| **NFR-API-002** | Semantic Versioning & Android Comp| API Quality | Section 13 | All API Endpoints | Phase 1 | Confirmed |
| **NFR-API-003** | Cursor-Based Pagination Protocol| API Quality | PUB-001 | `FEAT-PUB-002`, `FEAT-ADM-002` | Phase 2 | Confirmed |
| **NFR-ANDR-001**| Kotlin & Jetpack Compose Native | Android Quality | Section 13 | `FEAT-NOT-003`, Native App | Phase 13 | Confirmed |
| **NFR-ANDR-002**| 60fps Native Scrolling | Android Quality | Section 28 | Native Newsfeed | Phase 13 | Proposed |
| **NFR-ANDR-003**| Room DB Offline WorkManager Prefetch| Android Quality | Section 13 | Native App Offline Storage | Phase 13 | Confirmed |
| **NFR-ANDR-004**| Battery Usage $\le$ 2.0% Daily | Android Quality | Section 13 | Native App Energy Profile | Phase 13 | Proposed |
| **NFR-A11Y-001**| Devanagari Typography Readability| Accessibility | Section 12 | `FEAT-PUB-007`, `FEAT-PUB-011` | Phase 6 | Confirmed |
| **NFR-A11Y-002**| WCAG 2.1 AA Contrast Ratios | Accessibility | Section 28 | `FEAT-PUB-001`, All UI | Phase 6 | Confirmed |
| **NFR-A11Y-003**| 48x48dp Mobile Touch Targets | Accessibility | Section 28 | All Mobile UI Controls | Phase 6 | Confirmed |
| **NFR-COMP-001**| Cross-Browser Engine Compatibility| Compatibility | Section 12 | Public Web Portal | Phase 6 | Confirmed |
| **NFR-COMP-002**| Network Adaptive Low-Bandwidth Mode| Compatibility | PUB-011 | `FEAT-MED-005` | Phase 6 | Proposed |
| **NFR-MAINT-001**| Strict TypeScript Typing | Maintainability | Section 9 | Entire Codebase | Phase 1 | Confirmed |
| **NFR-MAINT-002**| 80% Automated CI Test Coverage | Maintainability | Section 4 | CI/CD Pipeline | Phase 1 | Proposed |
| **NFR-MAINT-003**| Reversible Zero-Downtime Migrations| Maintainability | Section 28 | Database Migrations | Phase 2 | Confirmed |
| **NFR-OBS-001** | Centralized APM & Error Tracing | Observability | Section 27 | Core Backend & Clients | Phase 1 | Confirmed |
| **NFR-OBS-002** | Real-Time Health Probes & Alerts| Observability | ADM-012 | Infrastructure Monitoring | Phase 1 | Confirmed |

---

## 22. Proposed Targets Requiring Approval

In accordance with strict project governance rules, the following operational metrics represent recommended engineering proposals and are explicitly designated as **Pending Approval** until formally ratified through load testing, infrastructure sizing, and commercial service agreements:

| Metric ID | Metric Name | Category | Proposed Engineering Target | Confirmed Baseline Status | Required Action for Sign-off |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **TGT-001** | Core Web Vitals (LCP) | Performance | LCP $\le$ 2.2s on mobile 4G; $\le$ 1.2s on desktop. | Proposed Target | Benchmark on staging environment across physical devices. |
| **TGT-002** | Core Web Vitals (INP) | Performance | INP $\le$ 150ms on mobile viewports. | Proposed Target | Real-user telemetry validation during pilot launch. |
| **TGT-003** | Public API Read Latency | Performance | p95 latency $\le$ 200ms at origin (cached $\le$ 50ms). | Proposed Target | Load testing with 2,000 req/sec in Phase 14. |
| **TGT-004** | Ticker Propagation | Performance | Broadcast propagates in $\le$ 3.0s to 10k clients. | Proposed Target | WebSocket cluster stress testing in Phase 11. |
| **TGT-005** | Service Availability | Availability | 99.9% monthly availability ($\le 43.8$ mins downtime). | Proposed Target | Review cloud hosting SLA terms and multi-zone pricing. |
| **TGT-006** | Recovery Point Objective | Disaster Recovery | Target RPO $\le$ 15 minutes of published content. | Proposed Target | Sign-off on continuous transaction log backup costs. |
| **TGT-007** | Recovery Time Objective | Disaster Recovery | Target RTO $\le$ 2.0 hours for complete failover. | Proposed Target | Execute simulated staging disaster recovery drill in Phase 14. |
| **TGT-008** | Android Cold Launch | Android Performance | Cold launch $\le$ 1.5s; Warm launch $\le$ 500ms. | Proposed Target | Macrobenchmark testing on physical budget Android test bench. |
| **TGT-009** | Android Battery Impact | Android Efficiency | $\le$ 2.0% daily battery consumption in standby. | Proposed Target | Battery Historian profile validation on Android 12+. |
| **TGT-010** | Automated Test Coverage | Maintainability | Minimum 80% line coverage on core services. | Proposed Target | Code review policy approval by engineering management. |

---

## 23. Open Questions and Pending Decisions

The following architectural and operational decisions remain open for final resolution during Phase 1 technical design:

| Decision ID | Issue Summary | Impacted NFR | Architectural Trade-Offs | Target Document |
| :--- | :--- | :---: | :--- | :--- |
| **OPQ-002** | Primary Database Selection | `NFR-SCAL-003`, `NFR-INTG-001` | PostgreSQL with JSONB vs Cloud Firestore vs Hybrid model. | `04-Database.md` |
| **OPQ-003** | Video Studio Render Engine | `NFR-MED-002` | Serverless Cloud Run FFmpeg container vs third-party rendering API. | `10-Video-Studio.md` |
| **OPQ-006** | Web Push Provider Strategy | `NFR-PERF-007` | Direct VAPID Web Push vs unified Firebase Cloud Messaging bridge. | `03-Architecture.md` |
| **OPQ-007** | Minimum Supported Android Version | `NFR-ANDR-001` | Android 8.0 (API 26, 95% market reach) vs Android 10.0 (API 29, 85% reach). | `03-Architecture.md` |
| **OPQ-008** | Real-Time Ticker Protocol | `NFR-PERF-007` | WebSockets vs Server-Sent Events (SSE) for lower mobile battery drain. | `03-Architecture.md` |

---

## 24. Completion Checklist

- [x] 1. All major Non-Functional Requirement categories covered (Performance, Scalability, Availability, Reliability, Security, Privacy, Data Integrity, Backup/Recovery, Media, AI Reliability, API Quality, Native Android, Usability/Accessibility, Compatibility, Maintainability, Observability).
- [x] 2. Explicit architectural segregation between Shared Backend, Web Presentation, and Native Android Platform specifications.
- [x] 3. Native Android Kotlin & Android SDK quality standards established with zero WebView shortcuts.
- [x] 4. Core Web Vitals (LCP, INP, CLS) and Android Vitals codified.
- [x] 5. Zero Client-Side Secret Exposure mandated as a non-negotiable architectural invariant.
- [x] 6. Authoritative server-side RBAC and "Dirty Dozen" threat mitigations specified.
- [x] 7. Automated multi-key AI API pool failover (sub-1.5s) and zero unsupervised AI publishing invariant enforced.
- [x] 8. Proposed performance and availability targets explicitly distinguished from confirmed baselines.
- [x] 9. Comprehensive NFR Traceability Matrix mapping NFRs to PRD requirements, Feature IDs, and Engineering Phases.
- [x] 10. Structured Load and Stress Testing framework documented.
- [x] 11. Zero application code, database DDL, or configuration files were created or modified during this documentation turn.

---

## 25. Related Documents

| Document File | Purpose / Scope | Status |
| :--- | :--- | :--- |
| `docs/01-PRD.md` | Master Product Requirements Document | Completed (v1.0.0) |
| `docs/02-Features.md` | Exhaustive feature-by-feature operational specification | Completed (v1.0.0) |
| `docs/Plan.md` | Complete Engineering Roadmap & Master Development Plan | Completed (v1.0.0) |
| `docs/04-NFR.md` | Non-Functional Requirements & Quality Standards | **Completed (This Document, v1.0.0)** |
| `docs/03-Architecture.md` | System Architecture, Cross-Platform Gateway & Cloud Infrastructure | *Recommended Next Document* |
| `docs/04-Database.md` | Database Schema Definitions, Relational Entities & Indexing | Planned (Phase 1) |
| `docs/05-API.md` | RESTful API Contracts, JSON Schemas & Error Specifications | Planned (Phase 1) |
| `docs/06-Auth.md` | Authentication Lifecycles, Token Rotation & RBAC Middleware | Planned (Phase 1) |
| `docs/07-Security.md` | Security Hardening, Threat Mitigations & IT Rules Compliance | Planned (Phase 1) |
| `docs/Workflows.md` | Newsroom & Editorial Step-by-Step Operational Workflows | Planned |
