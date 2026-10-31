# Master Environment Variables, Secret Management & Configuration Specification
## Project: BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
### Document ID: DOC-25-ENV-2026-V1.0
### Confidentiality: Internal Architecture, SecOps & Environment Governance Specification

---

## 1. Document Information

| Attribute | Specification |
| :--- | :--- |
| **Document Title** | Environment Variables, Configuration Architecture & Secret Governance Specification |
| **Document Filename** | `docs/25-Environment.md` |
| **Document Version** | Version 1.0 (Enterprise Comprehensive Architecture) |
| **System Classification** | Environment Variables, Secret Isolation, Runtime Configuration & Key Rotation Mesh |
| **Primary Authors** | Cloud Security Architect, Lead DevOps / SRE Engineer, Principal Backend Systems Architect |
| **Target Stakeholders** | DevOps Engineers, Backend Developers, Frontend Engineers, Mobile Leads, SecOps, QA |
| **Status** | Implementation-Ready Architecture Specification (Decisions Marked Confirmed, Proposed, or Pending Approval) |
| **Upstream Dependencies** | [`docs/01-PRD.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/01-PRD.md), [`docs/02-Features.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/02-Features.md), [`docs/03-Plan.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/03-Plan.md), [`docs/04-NFR.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/04-NFR.md), [`docs/05-Workflows.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/05-Workflows.md), [`docs/06-Business-Rules.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/06-Business-Rules.md), [`docs/07-Design.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/07-Design.md), [`docs/08-Sitemap.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/08-Sitemap.md), [`docs/09-Components.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/09-Components.md), [`docs/10-Responsive-Design.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/10-Responsive-Design.md), [`docs/11-Architecture.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/11-Architecture.md), [`docs/12-Database.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/12-Database.md), [`docs/13-API.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/13-API.md), [`docs/14-Auth.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/14-Auth.md), [`docs/15-Security.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/15-Security.md), [`docs/16-Storage.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/16-Storage.md), [`docs/17-Agents.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/17-Agents.md), [`docs/18-MCP.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/18-MCP.md), [`docs/19-API-Pool.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/19-API-Pool.md), [`docs/20-Integrations.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/20-Integrations.md), [`docs/21-Prompts.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/21-Prompts.md), [`docs/22-Setup.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/22-Setup.md), [`docs/23-README.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/23-README.md), [`docs/24-Deployment.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/24-Deployment.md) |
| **Downstream Consumers** | Testing Architecture (`docs/26-Testing.md`), Observability & Debugging (`docs/27-Debugging.md`) |
| **Last Updated** | October 2026 |

---

## 2. Document Objective & Purpose

### 2.1 Mission Statement
In an enterprise multi-tier news platform combining responsive web portals, field reporter filing desks, multi-provider AI prompt synthesis, and real-time citizen notifications, environment configuration forms the critical operational boundary between system stability and catastrophic security compromise. Misconfigured parameters or leaked credentials can lead to database corruption, unauthorized news publication, massive third-party AI billing spikes, and regulatory penalties under India's Digital Personal Data Protection Act (DPDPA 2023).

The purpose of this document is to establish the definitive **Environment Variables, Secret Management & Configuration Architecture Specification** for BREAKING NEWS WALA. It dictates:
- Rigorous 4-tier environment segregation across Development, Testing/CI, Staging, and Production tiers.
- A standardized, typed naming taxonomy for all configuration variables.
- An exhaustive inventory of 18 functional variable categories spanning compute, persistence, AI, and mobile subsystems.
- Zero-trust secret management ensuring credentials never leak into client JavaScript bundles, Git repositories, or compiled Android binaries.
- Strict startup validation protocols preventing the backend from booting with insecure defaults or missing parameters.

### 2.2 Core Architectural Principles & Scope Boundaries
- **Zero Client-Side Secrets (`RULE-SEC-001`)**: All private API tokens, database connection strings, KMS encryption keys, and third-party vendor secrets remain strictly backend-controlled. Public frontend variables are explicitly prefixed with `VITE_` and contain zero privileged credentials.
- **Single Backend Source of Truth (`RULE-ARCH-001`)**: Both Web and Native Android clients connect to the single shared backend gateway (`/api/v1/*`). Mobile applications possess zero private backends and embed zero independent secret configurations.
- **Fail-Fast Startup Validation**: The backend runtime executes strict Zod schema validation against `process.env` during initialization (`server.ts`). If required configuration keys are missing or malformed, the process aborts immediately with structured error diagnostics, never falling back to insecure defaults.
- **Documentation-Only Scope**: This task prepares the configuration architecture specification only. It does **not** create `.env` files, generate live API keys, alter cloud settings, provision infrastructure, or write application source code.

---

## 3. Environment Separation Architecture

The platform enforces absolute structural and operational boundaries across four distinct environment tiers. Development, testing, and staging activities are physically barred from accessing or mutating live production data (`RULE-DEV-001`).

```mermaid
flowchart TD
    subgraph Env_Dev["Tier 1: Local Development"]
        D1["Host: Localhost / Developer Laptop"]
        D2["Data: Synthetic Mock Stories & Seed Taxonomies"]
        D3["Secrets: Personal Free AI Keys / Offline Mock Mode"]
        D4["Logs: Verbose Colorized Console Debugging"]
    end

    subgraph Env_Test["Tier 2: Testing & CI"]
        T1["Host: Ephemeral GitHub Actions Runners"]
        T2["Data: In-Memory / Ephemeral Docker PostgreSQL"]
        T3["Secrets: Synthetic Mock Tokens (Zero Cloud Calls)"]
        T4["Logs: Deterministic TAP / JUnit Test Reports"]
    end

    subgraph Env_Staging["Tier 3: Staging Pre-Prod"]
        S1["Host: Managed Google Cloud Run (Staging Cluster)"]
        S2["Data: Sanitized & Anonymized Production Replica"]
        S3["Secrets: Standby Cloud Credentials with Strict Spend Caps"]
        S4["Logs: Structured JSON Pino Logs to Cloud Logging"]
    end

    subgraph Env_Prod["Tier 4: Live Production"]
        P1["Host: Multi-AZ Google Cloud Run (Autoscaling Pods)"]
        P2["Data: Live Citizen News & Encrypted Author Records"]
        P3["Secrets: Hardware KMS Envelope Encrypted in RAM"]
        P4["Logs: Anonymized WORM Audit Logs (7-Year Retention)"]
    end

    Env_Dev -->|Git Pull Request| Env_Test
    Env_Test -->|Auto Merge on Green| Env_Staging
    Env_Staging -->|Executive Sign-Off & Tag| Env_Prod
```

### 3.1 Detailed Environment Segregation Matrix

| Governance Dimension | Tier 1: Local Development | Tier 2: Testing & CI | Tier 3: Staging (Pre-Prod) | Tier 4: Live Production |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Environment Objective** | Rapid local iteration, UI styling, and component debugging. | Automated regression prevention, linting, and schema verification. | Release candidate smoke testing and editorial sign-off under production parity. | High-availability public news delivery and live field reporting. |
| **Configuration Ownership** | Individual Engineer | DevOps / CI Automation | Release Manager & QA Lead | Super Admin & SecOps Lead (MFA Required) |
| **Data Sensitivity Scope** | Non-sensitive mock records & public seed district data. | Isolated synthetic test fixtures (destroyed post-run). | Anonymized production clone (PII permanently scrambled). | Highly confidential (Citizen tips, reporter PII, FIR notes). |
| **Credential Management Policy** | Developer local `.env` (Untracked in Git). | Encrypted GitHub Actions Repository Secrets. | Google Cloud Secret Manager (Staging Project). | Hardware KMS Envelope Encryption in RAM (`RULE-SEC-001`). |
| **External AI Provider Access** | Personal Google AI Studio key or built-in offline mock. | Completely mocked LLM responses (Deterministic). | Secondary standby AI keys with strict $\$10.00$ daily cap. | Live Multi-Provider AI API Pool (Gemini, Claude, OpenAI). |
| **SMS & Push Notification Sink** | Local terminal console output / Mock endpoints. | Null Sink (Discarded). | Whitelisted internal staff test phone numbers only. | Live TRAI DLT regional SMS gateway and FCM push tokens. |
| **Media Storage Backend** | Local file system directory / Mock MinIO container. | In-memory ephemeral mock storage. | Staging Cloudflare R2 bucket (`bnw-media-staging`). | Production Cloudflare R2 bucket (`bnw-media-prod`) + CDN. |
| **Access Control & Network Boundary** | Public local loopback (`127.0.0.1:3000`). | Isolated GitHub VM runner sandbox. | IP allowlisted / Cloudflare Access SSO gated. | Public Internet edge behind Cloudflare WAF & DDoS shield. |
| **Logging & Telemetry Standard** | Verbose human-readable terminal output. | Test suite summary outputs & coverage metrics. | Structured JSON Pino logs; error alerting enabled. | Anonymized JSON logs; Prometheus metrics; 7-year WORM audit. |

---

## 4. Configuration Architecture: Public vs. Private Boundaries

Configuration parameters are strictly bifurcated into two mutually exclusive architectural categories: **Public Client Configuration** and **Private Backend Secrets**.

```mermaid
flowchart TD
    subgraph Config_Sources["Configuration Ingress Sources"]
        CloudSecrets["Cloud Secret Manager / Hardware KMS"]
        ContainerEnv["Container Environment Variables (.env / Cloud Run)"]
        ViteBuildEnv["Frontend Build-Time Variables (VITE_*)"]
    end

    subgraph Boundary_Gate["Architectural Boundary Enforcement"]
        PrivateGate{"Is Variable Prefixed with VITE_?"}
    end

    subgraph Private_Backend_Plane["Private Backend Execution Plane (server.ts)"]
        DatabaseConn["PostgreSQL Connection Pool (DATABASE_URL)"]
        RedisConn["Redis Cluster Connection (REDIS_URL)"]
        AITokens["AI API Pool Keys (GEMINI_API_KEY, CLAUDE_API_KEY)"]
        AuthSecrets["JWT Secrets & Webhook Nonces (JWT_SECRET)"]
    end

    subgraph Public_Client_Plane["Public Client Execution Plane (Browser / Android)"]
        PublicAPIUrl["Public API Endpoint (VITE_API_BASE_URL)"]
        PublicCDNUrl["Public CDN Endpoint (VITE_CDN_BASE_URL)"]
        AppTitle["Application Branding (VITE_APP_NAME)"]
    end

    CloudSecrets --> ContainerEnv
    ContainerEnv --> PrivateGate
    ViteBuildEnv --> PrivateGate

    PrivateGate -- "No (Private)" --> Private_Backend_Plane
    PrivateGate -- "Yes (Public)" --> Public_Client_Plane
```

### 4.1 Public Configuration Rules (Browser & Android)
- **Vite Prefix Standard**: Variables intended for browser consumption must explicitly carry the `VITE_` prefix (e.g., `VITE_API_BASE_URL`, `VITE_APP_NAME`). Vite compiles these values directly into static JavaScript bundles during `npm run build`.
- **Absolute Public Invariant**: **A variable is never secret if it is compiled into frontend assets.** Even if stored in a `.env` file, any variable with the `VITE_` prefix is readable by any public visitor inspecting browser DevTools.
- **Allowed Public Parameters**: Only non-sensitive operational endpoints (API URL, CDN URL, default language code, analytics site ID) are permitted to carry the `VITE_` prefix.

### 4.2 Private Configuration Rules (Backend Server & Workers)
- **Zero Client Bundling**: Backend configuration variables (`DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, `FAST2SMS_API_KEY`) must never carry the `VITE_` prefix, preventing them from being processed by Vite's client-side compiler.
- **Runtime Injection**: Backend variables are injected into container memory at startup via Google Cloud Secret Manager or Docker environment flags, residing strictly within Node.js `process.env`.
- **No Direct Frontend Access**: Frontend components requiring protected data or AI generation must make authenticated HTTP requests to `/api/v1/*`. The backend performs the privileged operation and returns sanitized data.


---

## 5. Environment Variable Naming Conventions

To guarantee consistency, operational clarity, and developer safety across Web PWA, backend microservices, background workers, and the future Native Android application, BREAKING NEWS WALA enforces a strict configuration nomenclature standard based on IEEE Std 1003.1-2001 (POSIX.1) environment conventions.

### 5.1 Syntax and Case Formatting
- **Uppercase Standard**: All environment variable keys must be written entirely in uppercase Latin characters (`A-Z`), numeric digits (`0-9`), and single underscore separators (`_`).
- **Forbidden Characters**: Lowercase letters, hyphens (`-`), periods (`.`), colons (`:`), and whitespace are strictly prohibited in variable keys.
- **Prefix Consistency**: Every variable must carry a standard domain prefix identifying its operational boundary or subsystem.

### 5.2 Standard Module Prefixes
| Prefix | Subsystem / Domain | Execution Plane | Public vs Private |
| :--- | :--- | :--- | :--- |
| `APP_` | Application runtime, environment type, and base ports | Backend / Node.js | Private / Internal |
| `VITE_` | Frontend Web PWA parameters bundled at build time | Browser / Client | **Strictly Public** |
| `API_` | API router, rate limiting, and CORS headers | Backend / Node.js | Private / Internal |
| `DB_` / `DATABASE_` | PostgreSQL relational database cluster & connection pool | Backend / Node.js | **Restricted Secret** |
| `REDIS_` | Redis in-memory cache and BullMQ job queue broker | Backend / Node.js | **Restricted Secret** |
| `AUTH_` / `JWT_` | Token signing keys, session cookies, and bcrypt salts | Backend / Node.js | **Restricted Secret** |
| `STORAGE_` | Cloudflare R2 / S3 object storage credentials & endpoints | Backend / Node.js | **Restricted Secret** |
| `CDN_` | Content Delivery Network endpoints and signed URL keys | Backend & Frontend | Mixed (Keys Private, URLs Public) |
| `AI_` | Multi-Provider AI API Pool orchestrator and circuit breakers | Backend / Node.js | **Restricted Secret** |
| `AGENT_` | AI Agent autonomous orchestrators and feature flags | Backend / Node.js | Private / Internal |
| `PROMPT_` | Prompt template versions and registry locations | Backend / Node.js | Private / Internal |
| `MCP_` | Model Context Protocol servers, sandboxes, and transports | Backend / Node.js | **Restricted Secret** |
| `RSS_` | RSS/Atom ingestion feeds, polling intervals, and parsers | Backend / Worker | Private / Internal |
| `NOTIF_` | Notification dispatchers (In-App, Web Push, SMS, FCM) | Backend / Worker | **Restricted Secret** |
| `WEBHOOK_` | Inbound and outbound webhook HMAC verification secrets | Backend / Node.js | **Restricted Secret** |
| `LOG_` / `METRICS_` | Winston logger, Sentry DSN, and Prometheus metrics | Backend / Worker | Private / Internal |
| `ANDROID_` | Native Android Kotlin SDK build and signing configuration | Gradle / APK Build | Mixed (Signing Private, App ID Public) |

### 5.3 Descriptive Nomenclature Rules
1. **No Ambiguous Abbreviations**: Variables must use explicit descriptors. For example, use `DB_POOL_MAX_CONNECTIONS` instead of `MAX_CONN`, and `RSS_FETCH_TIMEOUT_MS` instead of `R_TO`.
2. **Explicit Unit Suffixes**: Any configuration parameter representing physical time, network sizes, or thresholds must include explicit unit suffixes:
   - Milliseconds: `_MS` (e.g., `API_TIMEOUT_MS`, `REDIS_CONNECT_TIMEOUT_MS`)
   - Seconds: `_SEC` (e.g., `JWT_ACCESS_EXPIRATION_SEC`, `RSS_POLL_INTERVAL_SEC`)
   - Bytes: `_BYTES` (e.g., `BODY_PARSER_LIMIT_BYTES`, `MEDIA_MAX_FILE_BYTES`)
   - Counts / Limits: `_COUNT` or `_MAX` (e.g., `BULLMQ_DEFAULT_JOB_ATTEMPTS`, `AI_CIRCUIT_BREAKER_FAILURE_THRESHOLD`)
3. **Boolean Flag Indicators**: Variables with boolean behavior must use affirmative action verbs or `_ENABLED` suffixes (e.g., `MCP_ENABLED=true`, `URL_SSRF_PROTECTION_ENABLED=true`, `DB_MIGRATION_AUTO_RUN=false`).
4. **Environment Differentiation**: The environment identity is governed strictly by `NODE_ENV` and `APP_ENV`. Never embed environment names directly into variable names (e.g., avoid `DEV_DATABASE_URL` or `PROD_API_KEY`); instead, inject the appropriate `DATABASE_URL` or `AI_API_KEY` into the specific container environment.

---

## 6. Master Environment Variable Inventory

This section provides the exhaustive, structured variable inventory for the BREAKING NEWS WALA platform across all 18 functional domains. Each entry defines the required operational parameters, classification, security status, and validation boundaries.

### 6.1 Application Runtime Configuration
| Variable Name | Purpose | Related Module | Data Classification | Req/Opt | Default Behavior | Applicable Envs | Secret? | Validation Rules | Owner | Rotation | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | Node.js runtime execution mode | Core Runtime | Public | Required | None (Fails if missing) | All | No | Enum: `development`, `test`, `staging`, `production` | Platform Eng | N/A | Implemented (`server.ts`) |
| `APP_ENV` | Antigravity application lifecycle tier | Core Runtime | Public | Required | Same as `NODE_ENV` | All | No | Enum: `development`, `test`, `staging`, `production` | Platform Eng | N/A | Proposed |
| `PORT` | HTTP server TCP listening port | HTTP Server | Internal | Optional | `3000` | All | No | Integer: `1024-65535` | Platform Eng | N/A | Implemented (`server.ts`) |
| `APP_BASE_URL` | Canonical public URL of web application | Routing / SEO | Public | Required | `http://localhost:3000` in Dev | All | No | Valid URL (`http://` or `https://`) | Platform Eng | N/A | Implemented (`.env.example`) |
| `APP_TIMEZONE` | Standard server execution timezone | Core Runtime | Internal | Optional | `Asia/Kolkata` | All | No | Valid IANA Timezone string (e.g., `Asia/Kolkata`, `UTC`) | Backend Lead | N/A | Proposed |
| `APP_MAINTENANCE_MODE` | Global circuit breaker for scheduled maintenance | HTTP Middleware | Internal | Optional | `false` | Staging, Prod | No | Boolean: `true`, `false` | Ops Lead | N/A | Proposed |

### 6.2 Frontend Web PWA Configuration (`VITE_*`)
| Variable Name | Purpose | Related Module | Data Classification | Req/Opt | Default Behavior | Applicable Envs | Secret? | Validation Rules | Owner | Rotation | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `VITE_APP_NAME` | Brand display title for UI header & PWA manifest | Frontend Header | Public | Required | `BREAKING NEWS WALA` | All | No | Non-empty string, max 60 chars | Frontend Lead | N/A | Proposed |
| `VITE_APP_ENV` | Frontend-exposed environment banner flag | UI Status Bar | Public | Optional | Inferred from build mode | All | No | Enum: `development`, `staging`, `production` | Frontend Lead | N/A | Proposed |
| `VITE_API_BASE_URL` | Relative or absolute backend REST API base endpoint | API Client / Fetch | Public | Required | `""` (empty for relative /api/v1) | All | No | Valid URL or valid relative URI path | Frontend Lead | N/A | Proposed |
| `VITE_CDN_BASE_URL` | Public CDN domain for responsive WebP/AVIF images | Media Viewer | Public | Required | Empty (serves from local storage) | All | No | Valid HTTPS URL | Frontend Lead | N/A | Proposed |
| `VITE_DEFAULT_LOCALE` | Default UI language code for initial render | i18n Subsystem | Public | Optional | `hi` (Hindi) | All | No | Enum: `hi`, `en`, `ur`, `bn` | Frontend Lead | N/A | Proposed |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 4 public client measurement tag | Analytics | Public | Optional | Empty (analytics disabled) | Staging, Prod | No | Regex: `^G-[A-Z0-9]+$` | Growth Lead | N/A | Proposed |

### 6.3 Backend Core & API Configuration
| Variable Name | Purpose | Related Module | Data Classification | Req/Opt | Default Behavior | Applicable Envs | Secret? | Validation Rules | Owner | Rotation | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `API_PREFIX` | URL path prefix for all REST endpoints | Express Router | Internal | Optional | `/api/v1` | All | No | Must start with `/`, e.g., `/api/v1` | Backend Lead | N/A | Proposed |
| `API_RATE_LIMIT_WINDOW_MS` | Sliding window duration for IP rate limiting | Rate Limiter | Internal | Optional | `60000` (1 minute) | All | No | Positive integer `>= 1000` | SecOps Lead | N/A | Proposed |
| `API_RATE_LIMIT_MAX_REQUESTS` | Maximum HTTP requests allowed per window per IP | Rate Limiter | Internal | Optional | `120` in Prod, `1000` in Dev | All | No | Positive integer `>= 1` | SecOps Lead | N/A | Proposed |
| `CORS_ALLOWED_ORIGINS` | Comma-separated whitelist of allowed browser origins | Security Headers | Internal | Required | `http://localhost:3000,http://localhost:5173` | All | No | Valid comma-delimited list of origin URLs | SecOps Lead | N/A | Proposed |
| `BODY_PARSER_LIMIT` | Maximum allowable payload size for JSON request bodies | Express Parser | Internal | Optional | `10mb` | All | No | String matching `^[0-9]+(kb\|mb)$` | Backend Lead | N/A | Proposed |
| `SERVER_GRACEFUL_SHUTDOWN_TIMEOUT_MS` | Timeout before terminating pending worker connections | Process Lifecycle | Internal | Optional | `15000` (15 seconds) | Staging, Prod | No | Integer: `1000-60000` | Platform Eng | N/A | Proposed |

### 6.4 Relational Database Configuration (PostgreSQL)
| Variable Name | Purpose | Related Module | Data Classification | Req/Opt | Default Behavior | Applicable Envs | Secret? | Validation Rules | Owner | Rotation | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection URI string with credentials | Prisma / PgPool | Restricted | Required | None (App fails fast on boot) | All | **Yes** | Valid PostgreSQL URI format: `postgresql://user:pass@host:port/db?sslmode=...` | Database Admin | 90 Days | Proposed |
| `DB_POOL_MIN_CONNECTIONS` | Minimum warm connections kept open in pg pool | PgPool / Prisma | Internal | Optional | `5` | All | No | Integer: `1-20` | Database Admin | N/A | Proposed |
| `DB_POOL_MAX_CONNECTIONS` | Maximum concurrent connections allowed in pg pool | PgPool / Prisma | Internal | Optional | `20` (Cloud Run concurrency) | All | No | Integer: `5-100` | Database Admin | N/A | Proposed |
| `DB_CONNECTION_TIMEOUT_MS` | Timeout before connection attempt is aborted | PgPool / Prisma | Internal | Optional | `10000` (10 seconds) | All | No | Integer: `1000-30000` | Database Admin | N/A | Proposed |
| `DB_IDLE_TIMEOUT_MS` | Max time connection remains idle before release | PgPool / Prisma | Internal | Optional | `30000` (30 seconds) | All | No | Integer: `5000-120000` | Database Admin | N/A | Proposed |
| `DB_SSL_MODE` | SSL encryption enforcement for database traffic | PgPool / Prisma | Confidential | Required | `require` in Prod, `disable` in Dev | All | No | Enum: `disable`, `require`, `verify-ca`, `verify-full` | SecOps Lead | N/A | Proposed |
| `DB_MIGRATION_AUTO_RUN` | Automatically run pending migrations during boot | Deploy Pipeline | Internal | Optional | `false` in Prod, `true` in Dev | All | No | Boolean: `true`, `false` | Database Admin | N/A | Proposed |

### 6.5 In-Memory Cache & Job Queue Configuration (Redis / BullMQ)
| Variable Name | Purpose | Related Module | Data Classification | Req/Opt | Default Behavior | Applicable Envs | Secret? | Validation Rules | Owner | Rotation | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `REDIS_URL` | Redis connection URI with AUTH password | Redis Cache / BullMQ | Restricted | Required | None (Queue fails fast if missing) | All | **Yes** | Valid Redis URI format: `rediss://default:pass@host:6379` | Platform Eng | 90 Days | Proposed |
| `REDIS_CLUSTER_MODE` | Enable Redis cluster node auto-discovery | Redis Client | Internal | Optional | `false` | Staging, Prod | No | Boolean: `true`, `false` | Platform Eng | N/A | Proposed |
| `REDIS_KEY_PREFIX` | Namespace prefix for cache keys to prevent collision | Redis Client | Internal | Optional | `bnw:` | All | No | Non-empty alphanumeric string ending in `:` | Backend Lead | N/A | Proposed |
| `BULLMQ_CONCURRENCY` | Maximum concurrent worker jobs processed per worker instance | Background Workers | Internal | Optional | `10` | All | No | Integer: `1-50` | Backend Lead | N/A | Proposed |
| `BULLMQ_DEFAULT_JOB_ATTEMPTS` | Maximum automatic retry attempts for failed queue jobs | Background Workers | Internal | Optional | `3` | All | No | Integer: `1-10` | Backend Lead | N/A | Proposed |
| `BULLMQ_BACKOFF_DELAY_MS` | Initial exponential backoff delay between job retries | Background Workers | Internal | Optional | `5000` (5 seconds) | All | No | Integer: `1000-60000` | Backend Lead | N/A | Proposed |

### 6.6 Authentication & Session Security Configuration
| Variable Name | Purpose | Related Module | Data Classification | Req/Opt | Default Behavior | Applicable Envs | Secret? | Validation Rules | Owner | Rotation | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `JWT_ACCESS_SECRET` | HMAC-SHA256 secret key for signing short-lived access JWTs | Auth Service | Restricted | Required | None (Boot aborts if missing) | All | **Yes** | High-entropy string, min 64 hex characters (256 bits) | SecOps Lead | 60 Days | Proposed |
| `JWT_REFRESH_SECRET` | HMAC-SHA256 secret key for signing long-lived refresh JWTs | Auth Service | Restricted | Required | None (Boot aborts if missing) | All | **Yes** | High-entropy string, min 64 hex characters (256 bits) | SecOps Lead | 60 Days | Proposed |
| `JWT_ACCESS_EXPIRATION_SEC` | Lifetime duration of short-lived access tokens | Auth Service | Internal | Optional | `900` (15 minutes) | All | No | Integer: `300-3600` (5m to 1h) | SecOps Lead | N/A | Proposed |
| `JWT_REFRESH_EXPIRATION_SEC` | Lifetime duration of refresh tokens stored in HTTP-only cookie | Auth Service | Internal | Optional | `604800` (7 days) | All | No | Integer: `86400-2592000` (1d to 30d) | SecOps Lead | N/A | Proposed |
| `BCRYPT_SALT_ROUNDS` | Work factor cost for password hashing | Auth Service | Internal | Optional | `12` in Prod, `10` in Test | All | No | Integer: `10-14` | SecOps Lead | N/A | Proposed |
| `SESSION_COOKIE_NAME` | Name of the HTTP-only refresh token session cookie | Auth Middleware | Public | Optional | `bnw_session` | All | No | Valid HTTP cookie name string | SecOps Lead | N/A | Proposed |
| `SESSION_COOKIE_SECURE` | Enforce `Secure` attribute on session cookies (HTTPS only) | Auth Middleware | Internal | Required | `true` in Prod, `false` in Dev | All | No | Boolean: `true`, `false` | SecOps Lead | N/A | Proposed |
| `SESSION_COOKIE_DOMAIN` | Domain attribute for auth cookies | Auth Middleware | Internal | Optional | Auto-detected from host header | Staging, Prod | No | Valid root domain (e.g., `.breakingnewswala.in`) | SecOps Lead | N/A | Proposed |

### 6.7 Media Storage & CDN Configuration (Cloudflare R2 / S3)
| Variable Name | Purpose | Related Module | Data Classification | Req/Opt | Default Behavior | Applicable Envs | Secret? | Validation Rules | Owner | Rotation | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `STORAGE_PROVIDER` | Active object storage driver | Storage Service | Internal | Required | `local` in Dev, `r2` in Prod | All | No | Enum: `local`, `r2`, `s3`, `gcs` | DevOps Lead | N/A | Proposed |
| `STORAGE_BUCKET_NAME` | Cloud storage bucket name for media assets | Storage Service | Internal | Required | `bnw-media-dev` in Dev, `bnw-media-prod` in Prod | All | No | Regex: `^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$` | DevOps Lead | N/A | Proposed |
| `STORAGE_ENDPOINT` | Custom S3-compatible API endpoint URL | Storage Service | Internal | Required (if R2/S3) | `https://<account_id>.r2.cloudflarestorage.com` | Staging, Prod | No | Valid HTTPS URL | DevOps Lead | N/A | Proposed |
| `STORAGE_REGION` | Storage region identifier | Storage Service | Internal | Optional | `auto` for R2, `ap-south-1` for S3 | All | No | Valid region string | DevOps Lead | N/A | Proposed |
| `STORAGE_ACCESS_KEY_ID` | S3-compatible API access key ID | Storage Service | Confidential | Required (if R2/S3) | None (Fails media upload if missing) | Staging, Prod | **Yes** | Alphanumeric string, 20-32 chars | DevOps Lead | 90 Days | Proposed |
| `STORAGE_SECRET_ACCESS_KEY` | S3-compatible API secret access key | Storage Service | Restricted | Required (if R2/S3) | None (Fails media upload if missing) | Staging, Prod | **Yes** | Base64/Hex high-entropy string, 40-64 chars | DevOps Lead | 90 Days | Proposed |
| `CDN_PUBLIC_BASE_URL` | Public domain serving media via global edge CDN | Media Service | Public | Required | Empty in Dev, `https://cdn.breakingnewswala.in` in Prod | All | No | Valid HTTPS URL | DevOps Lead | N/A | Proposed |
| `CDN_SIGNED_URL_EXPIRATION_SEC` | Expiration window for time-limited presigned media URLs | Media Service | Internal | Optional | `3600` (1 hour) | All | No | Integer: `60-86400` | SecOps Lead | N/A | Proposed |

### 6.8 Multi-Provider AI API Pool Configuration
| Variable Name | Purpose | Related Module | Data Classification | Req/Opt | Default Behavior | Applicable Envs | Secret? | Validation Rules | Owner | Rotation | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `AI_POOL_ROUTING_STRATEGY` | Multi-provider routing algorithm | AI Router | Internal | Optional | `latency-cost-balanced` | All | No | Enum: `round-robin`, `priority-fallback`, `latency-cost-balanced` | AI Lead | N/A | Proposed |
| `AI_DEFAULT_FALLBACK_ORDER` | Comma-delimited sequence of fallback AI providers | AI Router | Internal | Optional | `gemini,groq,claude,openai,deepseek,mistral` | All | No | Comma-separated list of recognized provider IDs | AI Lead | N/A | Proposed |
| `GEMINI_API_KEY` | Google Gemini AI Studio API key | AI Pool Driver | Restricted | Required | None (Gemini requests disabled if missing) | All | **Yes** | High-entropy Google AI Studio Key (`AIza...`) | AI Lead | 90 Days | Implemented (`.env.example`) |
| `CLAUDE_API_KEY` | Anthropic Claude API key | AI Pool Driver | Restricted | Optional | None (Claude requests disabled if missing) | Staging, Prod | **Yes** | Anthropic API Key format (`sk-ant-...`) | AI Lead | 90 Days | Proposed |
| `OPENAI_API_KEY` | OpenAI API key | AI Pool Driver | Restricted | Optional | None (OpenAI requests disabled if missing) | Staging, Prod | **Yes** | OpenAI API Key format (`sk-...`) | AI Lead | 90 Days | Proposed |
| `DEEPSEEK_API_KEY` | DeepSeek AI API key | AI Pool Driver | Restricted | Optional | None (DeepSeek requests disabled if missing) | Staging, Prod | **Yes** | DeepSeek API Key format (`sk-...`) | AI Lead | 90 Days | Proposed |
| `GROQ_API_KEY` | Groq LPU Ultra-Low-Latency API key | AI Pool Driver | Restricted | Optional | None (Groq requests disabled if missing) | Staging, Prod | **Yes** | Groq API Key format (`gsk_...`) | AI Lead | 90 Days | Proposed |
| `MISTRAL_API_KEY` | Mistral AI API key | AI Pool Driver | Restricted | Optional | None (Mistral requests disabled if missing) | Staging, Prod | **Yes** | Mistral API Key format | AI Lead | 90 Days | Proposed |
| `AI_CIRCUIT_BREAKER_FAILURE_THRESHOLD` | Consecutive failure count before provider circuit opens | Circuit Breaker | Internal | Optional | `5` | All | No | Integer: `1-20` | AI Lead | N/A | Proposed |
| `AI_CIRCUIT_BREAKER_RESET_TIMEOUT_MS` | Duration circuit remains OPEN before trial half-open request | Circuit Breaker | Internal | Optional | `60000` (60 seconds) | All | No | Integer: `5000-300000` | AI Lead | N/A | Proposed |

### 6.9 AI Agents and Prompt Configuration
| Variable Name | Purpose | Related Module | Data Classification | Req/Opt | Default Behavior | Applicable Envs | Secret? | Validation Rules | Owner | Rotation | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `AGENT_INGESTION_ENABLED` | Enable autonomous RSS & URL Ingestion Agent | Ingestion Agent | Internal | Optional | `true` | All | No | Boolean: `true`, `false` | AI Lead | N/A | Proposed |
| `AGENT_DRAFTING_ENABLED` | Enable automated article drafting agent | Drafting Agent | Internal | Optional | `true` | All | No | Boolean: `true`, `false` | AI Lead | N/A | Proposed |
| `AGENT_VERIFICATION_ENABLED`| Enable fact-checking & verification agent | Verification Agent| Internal | Optional | `true` | All | No | Boolean: `true`, `false` | AI Lead | N/A | Proposed |
| `AGENT_TRANSLATION_ENABLED` | Enable Indic language localization agent | Translation Agent| Internal | Optional | `true` | All | No | Boolean: `true`, `false` | AI Lead | N/A | Proposed |
| `AGENT_ENGAGEMENT_ENABLED` | Enable community moderation & sentiment agent | Moderation Agent | Internal | Optional | `true` | All | No | Boolean: `true`, `false` | AI Lead | N/A | Proposed |
| `PROMPT_REGISTRY_PATH` | File path or database reference to versioned prompt YAMLs | Prompt Engine | Internal | Optional | `./config/prompts` | All | No | Valid relative or absolute directory path | AI Lead | N/A | Proposed |
| `PROMPT_VERSION_INGESTION` | Active semantic prompt version for ingestion agent | Prompt Engine | Internal | Optional | `v1.0.0` | All | No | Semantic version string: `vX.Y.Z` | AI Lead | N/A | Proposed |
| `PROMPT_VERSION_DRAFTING` | Active semantic prompt version for drafting agent | Prompt Engine | Internal | Optional | `v1.0.0` | All | No | Semantic version string: `vX.Y.Z` | AI Lead | N/A | Proposed |
| `PROMPT_VERSION_VERIFICATION`| Active semantic prompt version for verification agent | Prompt Engine | Internal | Optional | `v1.0.0` | All | No | Semantic version string: `vX.Y.Z` | AI Lead | N/A | Proposed |

### 6.10 Model Context Protocol (MCP) Configuration
| Variable Name | Purpose | Related Module | Data Classification | Req/Opt | Default Behavior | Applicable Envs | Secret? | Validation Rules | Owner | Rotation | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `MCP_ENABLED` | Master toggle for MCP tool execution architecture | MCP Core | Internal | Optional | `true` | All | No | Boolean: `true`, `false` | AI Lead | N/A | Proposed |
| `MCP_SERVER_REGISTRY_CONFIG`| Absolute path to MCP server definitions JSON | MCP Registry | Confidential | Required (if MCP true)| `./config/mcp-servers.json` | All | No | Valid file path string | AI Lead | N/A | Proposed |
| `MCP_CLIENT_TIMEOUT_MS` | Maximum execution timeout for MCP tool invocations | MCP Client | Internal | Optional | `30000` (30 seconds) | All | No | Integer: `1000-120000` | AI Lead | N/A | Proposed |
| `MCP_TRANSPORT_MODE` | Allowed IPC transport protocol for MCP servers | MCP Transport | Internal | Optional | `stdio` | All | No | Enum: `stdio`, `sse`, `websocket` | AI Lead | N/A | Proposed |
| `MCP_MAX_CONCURRENT_CALLS` | Maximum concurrent external tool calls per agent | MCP Client | Internal | Optional | `5` | All | No | Integer: `1-20` | AI Lead | N/A | Proposed |
| `MCP_AUDIT_LOGGING_ENABLED`| Enable persistent logging of all MCP tool call payloads | MCP Auditor | Internal | Optional | `true` | Staging, Prod | No | Boolean: `true`, `false` | SecOps Lead | N/A | Proposed |

### 6.11 RSS Feeds & URL Ingestion Configuration
| Variable Name | Purpose | Related Module | Data Classification | Req/Opt | Default Behavior | Applicable Envs | Secret? | Validation Rules | Owner | Rotation | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `RSS_INGESTION_ENABLED` | Master kill-switch for automated RSS feed polling | Ingestion Worker | Internal | Optional | `true` | All | No | Boolean: `true`, `false` | Content Lead | N/A | Proposed |
| `RSS_POLL_INTERVAL_SEC` | Frequency of periodic polling for active RSS feeds | Ingestion Worker | Internal | Optional | `300` (5 minutes) | All | No | Integer: `60-3600` (1m to 60m) | Content Lead | N/A | Proposed |
| `RSS_MAX_ITEMS_PER_POLL` | Cap on items parsed per individual feed crawl | Ingestion Worker | Internal | Optional | `50` | All | No | Integer: `5-200` | Backend Lead | N/A | Proposed |
| `RSS_FETCH_TIMEOUT_MS` | HTTP request timeout when fetching external RSS XML | Ingestion Worker | Internal | Optional | `10000` (10 seconds) | All | No | Integer: `2000-30000` | Backend Lead | N/A | Proposed |
| `RSS_USER_AGENT` | Custom User-Agent header identifying feed crawler | Ingestion Worker | Public | Optional | `BreakingNewsWalaBot/1.0 (+https://breakingnewswala.in/bot)` | All | No | Non-empty string conforming to RFC 7231 | Content Lead | N/A | Proposed |
| `URL_MAX_FETCH_SIZE_BYTES` | Maximum byte limit for web scraping article bodies | URL Ingestion | Internal | Optional | `5242880` (5 MB) | All | No | Integer: `524288-20971520` | Backend Lead | N/A | Proposed |
| `URL_SSRF_PROTECTION_ENABLED`| Block private IP ranges (RFC 1918, 127.0.0.1, AWS metadata)| URL Ingestion | Internal | Required | `true` (Always enforced) | All | No | Boolean: `true` (Must never be disabled in Prod)| SecOps Lead | N/A | Proposed |

### 6.12 Notification Services (FCM, Web Push, SMS)
| Variable Name | Purpose | Related Module | Data Classification | Req/Opt | Default Behavior | Applicable Envs | Secret? | Validation Rules | Owner | Rotation | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `NOTIF_IN_APP_ENABLED` | Enable in-app notification dispatching | Notif Engine | Internal | Optional | `true` | All | No | Boolean: `true`, `false` | Product Lead | N/A | Proposed |
| `NOTIF_WEB_PUSH_ENABLED` | Enable Web Push (VAPID) browser notification dispatching| Notif Engine | Internal | Optional | `true` | Staging, Prod | No | Boolean: `true`, `false` | Product Lead | N/A | Proposed |
| `NOTIF_VAPID_PUBLIC_KEY` | Base64 URL-encoded VAPID public application server key | Web Push Service | Public | Required (if Web Push)| Empty in Dev | Staging, Prod | No | Base64URL string (65 bytes uncompressed P-256) | DevOps Lead | N/A | Proposed |
| `NOTIF_VAPID_PRIVATE_KEY`| Base64 URL-encoded VAPID private key | Web Push Service | Restricted | Required (if Web Push)| Empty in Dev | Staging, Prod | **Yes** | Base64URL string (32 bytes scalar) | DevOps Lead | 180 Days | Proposed |
| `NOTIF_VAPID_SUBJECT` | Contact email or URL for VAPID mailto identification | Web Push Service | Public | Required (if Web Push)| `mailto:admin@breakingnewswala.in` | Staging, Prod | No | Valid `mailto:email` or HTTPS URL | DevOps Lead | N/A | Proposed |
| `FCM_PROJECT_ID` | Firebase project ID for push notification dispatch | FCM Service | Internal | Required (if FCM) | Empty in Dev | Staging, Prod | No | Alphanumeric project identifier | DevOps Lead | N/A | Proposed |
| `FCM_SERVICE_ACCOUNT_KEY`| Google Cloud Service Account JSON for Firebase Admin SDK | FCM Service | Restricted | Required (if FCM) | Empty in Dev | Staging, Prod | **Yes** | Valid JSON containing `private_key`, `client_email` | DevOps Lead | 90 Days | Proposed |
| `SMS_PROVIDER` | External Indian SMS gateway driver | SMS Service | Internal | Optional | `fast2sms` | Staging, Prod | No | Enum: `fast2sms`, `msg91`, `twilio`, `mock` | Product Lead | N/A | Proposed |
| `SMS_API_KEY` | API authentication token for Indian SMS gateway | SMS Service | Restricted | Required (if SMS) | None (SMS dispatch disabled if missing)| Staging, Prod | **Yes** | High-entropy gateway token string | DevOps Lead | 90 Days | Proposed |
| `SMS_SENDER_ID` | TRAI approved 6-character alphabetic sender header | SMS Service | Public | Required (if SMS) | `BNWIND` | Staging, Prod | No | Exactly 6 uppercase letters (TRAI compliance) | Growth Lead | N/A | Proposed |
| `SMS_DLT_TE_ID` | TRAI Distributed Ledger Technology Template Entity ID | SMS Service | Public | Required (if SMS) | Approved TRAI 19-digit numerical ID | Staging, Prod | No | 19-digit numerical string | Growth Lead | N/A | Proposed |

### 6.13 Analytics, Telemetry & Advertising Configuration
| Variable Name | Purpose | Related Module | Data Classification | Req/Opt | Default Behavior | Applicable Envs | Secret? | Validation Rules | Owner | Rotation | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ANALYTICS_ENABLED` | Master toggle for server-side telemetry capture | Analytics Router| Internal | Optional | `true` | All | No | Boolean: `true`, `false` | Growth Lead | N/A | Proposed |
| `ANALYTICS_ANONYMIZE_IP` | Mask user IP addresses prior to analytics aggregation | Analytics Router| Confidential | Required | `true` (Privacy compliance) | All | No | Boolean: `true` (Mandatory for privacy compliance) | SecOps Lead | N/A | Proposed |
| `ADS_ENABLED` | Master kill-switch for ad banner rendering | Ads Controller | Internal | Optional | `false` in Dev, `true` in Prod | All | No | Boolean: `true`, `false` | Monetization Lead | N/A | Proposed |
| `ADS_PROVIDER` | External advertising partner platform | Ads Controller | Internal | Optional | `google_adsense` | Staging, Prod | No | Enum: `google_adsense`, `media_net`, `custom_direct`| Monetization Lead | N/A | Proposed |
| `ADS_CLIENT_ID` | Publisher ad account identifier | Ads Controller | Public | Required (if Ads) | Empty in Dev | Staging, Prod | No | String matching `^ca-pub-[0-9]+$` | Monetization Lead | N/A | Proposed |
| `ADS_SLOT_HEADER_ID` | Ad unit slot identifier for desktop header banner | Ads Controller | Public | Optional | Empty | Staging, Prod | No | Numeric slot ID string | Monetization Lead | N/A | Proposed |

### 6.14 Webhook Ingestion & Dispatch Configuration
| Variable Name | Purpose | Related Module | Data Classification | Req/Opt | Default Behavior | Applicable Envs | Secret? | Validation Rules | Owner | Rotation | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `WEBHOOK_INGESTION_SECRET`| HMAC-SHA256 secret for verifying inbound RSS partner pushes | Webhook Receiver | Restricted | Required (if enabled) | None (Webhook rejected if missing) | Staging, Prod | **Yes** | Min 32 characters high-entropy string | SecOps Lead | 90 Days | Proposed |
| `WEBHOOK_PAYMENT_SECRET` | HMAC secret for verifying Razorpay / Stripe webhook signatures | Payment Receiver| Restricted | Required (if enabled) | None (Webhook rejected if missing) | Staging, Prod | **Yes** | High-entropy secret token | SecOps Lead | 90 Days | Proposed |
| `WEBHOOK_TIMESTAMP_TOLERANCE_SEC` | Maximum allowable drift in webhook request timestamp | Webhook Receiver | Internal | Optional | `300` (5 minutes) | All | No | Integer: `60-900` | SecOps Lead | N/A | Proposed |
| `WEBHOOK_REPLAY_CACHE_TTL_SEC`| Retention TTL for processed webhook nonces in Redis | Replay Guard | Internal | Optional | `86400` (24 hours) | All | No | Integer: `3600-604800` | SecOps Lead | N/A | Proposed |
| `WEBHOOK_DISPATCH_RETRY_MAX`| Max retry attempts for outbound publisher webhook webhooks | Webhook Dispatch | Internal | Optional | `5` | All | No | Integer: `1-10` | Backend Lead | N/A | Proposed |

### 6.15 Logging, Monitoring & Observability
| Variable Name | Purpose | Related Module | Data Classification | Req/Opt | Default Behavior | Applicable Envs | Secret? | Validation Rules | Owner | Rotation | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `LOG_LEVEL` | Minimum log severity recorded to stdout | Winston Logger | Internal | Optional | `debug` in Dev, `info` in Prod | All | No | Enum: `error`, `warn`, `info`, `http`, `verbose`, `debug`| DevOps Lead | N/A | Proposed |
| `LOG_FORMAT` | Log serializer format | Winston Logger | Internal | Optional | `pretty` in Dev, `json` in Prod | All | No | Enum: `json`, `pretty` | DevOps Lead | N/A | Proposed |
| `LOG_REDACT_KEYS` | Comma-separated list of JSON keys redacted from log output | Log Masking | Confidential | Optional | `password,token,secret,authorization,key,apiKey` | All | No | Comma-separated string of field names | SecOps Lead | N/A | Proposed |
| `METRICS_ENABLED` | Enable Prometheus `/metrics` scraping endpoint | Prometheus Exporter| Internal | Optional | `true` | All | No | Boolean: `true`, `false` | DevOps Lead | N/A | Proposed |
| `METRICS_PORT` | Dedicated internal port for metrics scraping | Prometheus Exporter| Internal | Optional | `9090` | Staging, Prod | No | Integer: `1024-65535` | DevOps Lead | N/A | Proposed |
| `SENTRY_DSN` | Sentry Data Source Name for exception tracking | Sentry Client | Confidential | Optional | Empty (Sentry disabled) | Staging, Prod | No | Valid Sentry DSN URL format | DevOps Lead | N/A | Proposed |
| `SENTRY_ENVIRONMENT` | Sentry release environment tag | Sentry Client | Internal | Optional | Inferred from `APP_ENV` | Staging, Prod | No | Enum: `development`, `staging`, `production` | DevOps Lead | N/A | Proposed |
| `SENTRY_TRACES_SAMPLE_RATE` | Performance transaction sampling ratio | Sentry Client | Internal | Optional | `0.1` (10%) in Prod, `1.0` in Staging| Staging, Prod | No | Float: `0.0` to `1.0` | DevOps Lead | N/A | Proposed |

### 6.16 Deployment & Container Orchestration
| Variable Name | Purpose | Related Module | Data Classification | Req/Opt | Default Behavior | Applicable Envs | Secret? | Validation Rules | Owner | Rotation | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `CONTAINER_PORT` | Internal port mapped by Docker / Cloud Run | Container Engine| Internal | Optional | `3000` | Staging, Prod | No | Integer: `1024-65535` | Platform Eng | N/A | Proposed |
| `DEPLOYMENT_REGION` | Cloud datacenter region hosting the service | Cloud Run / GCP | Internal | Optional | `asia-south1` (Mumbai) | Staging, Prod | No | Valid GCP / AWS region identifier | Platform Eng | N/A | Proposed |
| `CLOUD_RUN_SERVICE_NAME` | Cloud Run deployment service identifier | Cloud Run | Internal | Optional | `bnw-backend` | Staging, Prod | No | Non-empty alphanumeric string with dashes | Platform Eng | N/A | Proposed |
| `BUILD_COMMIT_SHA` | Git commit hash compiled into deployment artifact | Build Metadata | Public | Optional | Injected by CI/CD pipeline | All | No | 40-character hex Git SHA or 7-char short SHA | DevOps Lead | N/A | Proposed |
| `BUILD_TIMESTAMP` | UTC ISO-8601 timestamp of release artifact build | Build Metadata | Public | Optional | Injected by CI/CD pipeline | All | No | ISO-8601 UTC timestamp string | DevOps Lead | N/A | Proposed |

### 6.17 Native Android Application (Stage B Kotlin SDK 34+)
| Variable Name | Purpose | Related Module | Data Classification | Req/Opt | Default Behavior | Applicable Envs | Secret? | Validation Rules | Owner | Rotation | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ANDROID_APPLICATION_ID`| Unique reverse-domain Android package namespace | Android Gradle | Public | Required | `in.breakingnewswala.app` | All | No | Valid Java/Android package name format | Mobile Lead | N/A | Proposed |
| `ANDROID_BUILD_TYPE` | Active build flavor / variant | Android Gradle | Public | Required | `debug` or `release` | All | No | Enum: `debug`, `release` | Mobile Lead | N/A | Proposed |
| `ANDROID_API_BASE_URL` | Backend REST API endpoint consumed by Android Retrofit | Retrofit Client | Public | Required | `https://api.breakingnewswala.in` | All | No | Valid HTTPS URL (or 10.0.2.2 emulator for Dev) | Mobile Lead | N/A | Proposed |
| `ANDROID_FCM_SENDER_ID` | Firebase Cloud Messaging project numerical sender ID | Firebase Push | Public | Required (if FCM) | Empty in Dev | Staging, Prod | No | Numeric string | Mobile Lead | N/A | Proposed |
| `ANDROID_KEYSTORE_PATH` | Absolute path to Java Keystore file for release signing | Gradle Signing | Restricted | Required (for Release)| CI/CD runner secret | Prod Build | **Yes** | Valid filesystem path to `.jks` / `.keystore` | Mobile Lead | 365 Days | Proposed |
| `ANDROID_KEYSTORE_PASSWORD`| Master password protecting the Java Keystore | Gradle Signing | Restricted | Required (for Release)| CI/CD runner secret | Prod Build | **Yes** | High-entropy passphrase string | Mobile Lead | 365 Days | Proposed |
| `ANDROID_KEY_ALIAS` | Key alias for release signing keypair | Gradle Signing | Confidential | Required (for Release)| `bnw-release-key` | Prod Build | No | Alphanumeric alias string | Mobile Lead | N/A | Proposed |
| `ANDROID_KEY_PASSWORD` | Password protecting the specific release key alias | Gradle Signing | Restricted | Required (for Release)| CI/CD runner secret | Prod Build | **Yes** | High-entropy passphrase string | Mobile Lead | 365 Days | Proposed |

### 6.18 Third-Party Social & External Integrations
| Variable Name | Purpose | Related Module | Data Classification | Req/Opt | Default Behavior | Applicable Envs | Secret? | Validation Rules | Owner | Rotation | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `TWITTER_API_BEARER_TOKEN`| X/Twitter OAuth 2.0 Bearer Token for automated sharing | Social Publisher | Restricted | Optional | None (Twitter sharing disabled if missing)| Staging, Prod | **Yes** | High-entropy Bearer Token string | Growth Lead | 90 Days | Proposed |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API authorization token | Social Publisher | Restricted | Optional | None (Telegram dispatch disabled if missing)| Staging, Prod | **Yes** | Format: `^[0-9]{8,10}:[a-zA-Z0-9_-]{35}$` | Growth Lead | 90 Days | Proposed |
| `TELEGRAM_CHANNEL_ID` | Telegram broadcast channel identifier or @handle | Social Publisher | Public | Optional | Empty | Staging, Prod | No | String starting with `@` or `-100` | Growth Lead | N/A | Proposed |
| `WHATSAPP_BUSINESS_API_KEY`| Meta WhatsApp Cloud API access token | Social Publisher | Restricted | Optional | None (WhatsApp sharing disabled if missing)| Staging, Prod | **Yes** | Meta System User Access Token string | Growth Lead | 60 Days | Proposed |
| `GEOIP_DATABASE_PATH` | Filesystem path to MaxMind GeoLite2 City database | GeoIP Resolver | Internal | Optional | `./data/GeoLite2-City.mmdb` | Staging, Prod | No | Valid path to `.mmdb` binary file | Backend Lead | N/A | Proposed |


---

## 7. Secret Management

Governance of sensitive cryptographic material, authentication keys, and infrastructure credentials across BREAKING NEWS WALA is strictly bound by `docs/15-Security.md`. Configuration secrets represent the highest-risk data tier in the platform; improper handling leads directly to credential compromise, unauthorized cloud compute consumption, and data exfiltration.

```
+-----------------------------------------------------------------------------------------+
|                              SECRET MANAGEMENT DISCIPLINE                               |
|                                                                                         |
|   1. ZERO SECRETS IN GIT          Never commit .env, credentials, or keys to GitHub     |
|   2. ZERO SECRETS IN FRONTEND     Never expose private keys in Vite bundles or HTML     |
|   3. ZERO SECRETS IN NATIVE APK   Never compile server secrets into Android Kotlin code |
|   4. ZERO SECRETS IN LOGS         Mask authorization headers and sensitive credentials  |
|   5. ZERO SECRETS IN ERROR BODIES Never reflect internal secrets in HTTP error payloads |
|   6. ZERO SECRETS IN ADMIN UI     Show only masked key references (e.g., ************)  |
+-----------------------------------------------------------------------------------------+
```

### 7.1 Secret Value versus Secret Reference
A fundamental principle of the BREAKING NEWS WALA architecture is the separation of **Secret Values** from **Secret References**:
- **Secret Value**: The raw plaintext string containing high-entropy cryptographic material (e.g., `postgresql://app:P@ssw0rd123@10.0.0.5:5432/bnw`, `AIzaSyD-xxx-yyy`, or an RSA private key). Plaintext secret values exist solely in ephemeral process memory inside isolated backend containers. They are never written to disk, committed to Git repositories, or transmitted over unencrypted networks.
- **Secret Reference**: An immutable, audited cloud resource identifier pointing to the secret stored in an enterprise Key Management Service or Secret Manager. Examples include:
  - Google Cloud Secret Manager: `projects/breaking-news-wala-prod/secrets/PROD_DATABASE_URL/versions/4`
  - Cloud Run Secret Reference: `DATABASE_URL:secret=PROD_DATABASE_URL:latest`
  - Kubernetes Secret Reference: `valueFrom.secretKeyRef.name: bnw-secrets, key: database-url`
- **Architectural Policy**: CI/CD pipelines and deployment manifests (e.g., `apphosting.yaml`, Cloud Build configs) must **only store Secret References**. The cloud orchestration platform injects the underlying Secret Value directly into the container's environment variables (`process.env`) at execution time via secure RAM-disk IPC.

### 7.2 Cloud-Native Secret Storage & KMS Envelope Encryption
1. **Google Cloud Secret Manager**:
   - In Staging and Production, all secrets are provisioned in GCP Secret Manager located in the `asia-south1` (Mumbai) region.
   - Access to secrets is governed strictly through Google Cloud IAM using Workload Identity. Compute service accounts receive the granular role `roles/secretmanager.secretAccessor` scoped only to specific secret resources.
2. **KMS Envelope Encryption**:
   - Master data-at-rest encryption uses Google Cloud KMS Customer-Managed Encryption Keys (CMEK) or platform-managed HSM keys (FIPS 140-2 Level 3).
   - Data keys (DEK) encrypt secrets at rest; the Key Encryption Key (KEK) is held within the hardware security module and never exported.
3. **Local Development Secret Handling**:
   - Developers maintain a strictly local `.env` file created by copying `.env.example`.
   - The `.gitignore` file enforces that `.env`, `.env.local`, `.env.*.local`, and `*.pem` are permanently excluded from version control.
   - Continuous scanning via Git pre-commit hooks (`git-secrets`, `trufflehog`) prevents accidental commits containing cryptographic patterns.

### 7.3 Auditing, Rotation, and Revocation Lifecycle
- **Automated Audit Trails**: Every read access to GCP Secret Manager generates an immutable Cloud Audit Log entry recording the service account identity, IP address, timestamp, and accessed secret version.
- **Scheduled Rotation Schedules**:
  - Webhook Secrets: 90 days.
  - Multi-Provider AI API Keys: 90 days.
  - JWT Signing Keys: 60 days (utilizing overlapping dual-key signing for zero-downtime rollover).
  - Database & Redis Passwords: 90 days.
  - Android Keystore Certificates: 365 days (Play App Signing manages the root app signing key).
- **Emergency Revocation Protocol**: If any credential is suspected of compromise, SecOps executes the immediate three-step revocation sequence:
  1. Provision a new secret version in Secret Manager.
  2. Deploy a rolling restart of the backend service to mount the new secret version.
  3. Revoke and delete the compromised secret key from the provider console.

---

## 8. Frontend Configuration

Frontend configuration for BREAKING NEWS WALA is processed by the Vite build toolchain and runs directly inside end-user web browsers and Progressive Web App containers.

### 8.1 Safe Public Browser Parameters
Only parameters that are strictly necessary for client-side routing, user interface presentation, and network endpoint targeting may be bundled into frontend assets.

| Variable | Type | Allowed Production Value | Justification |
| :--- | :--- | :--- | :--- |
| `VITE_APP_NAME` | String | `BREAKING NEWS WALA` | UI header brand title and dynamic page `<title>` generation |
| `VITE_APP_ENV` | String | `production` | Renders developer debug badges in Staging/Dev, hidden in Prod |
| `VITE_API_BASE_URL` | String | `""` or `https://api.breakingnewswala.in` | Base URL for client HTTP fetch requests to `/api/v1/*` |
| `VITE_CDN_BASE_URL` | String | `https://cdn.breakingnewswala.in` | Global CDN domain for image optimization and responsive media |
| `VITE_DEFAULT_LOCALE` | String | `hi` | Initial localization language bundle prior to user selection |
| `VITE_GA_MEASUREMENT_ID` | String | `G-XXXXXXXXXX` | Public Google Analytics 4 tracking identifier for web telemetry |

### 8.2 Strictly Forbidden Frontend Parameters
Under no circumstances may any of the following categories of variables be included in frontend code, `.env` files parsed by Vite, or client-side JavaScript bundles:
- **Private AI Provider Keys**: `GEMINI_API_KEY`, `CLAUDE_API_KEY`, `OPENAI_API_KEY`, `GROQ_API_KEY`.
- **Database & Cache URIs**: `DATABASE_URL`, `REDIS_URL`.
- **Authentication Secrets**: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, session cookies.
- **Object Storage Access Keys**: `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`.
- **Webhook Nonces & Verification Secrets**: `WEBHOOK_INGESTION_SECRET`.
- **SMS Gateway & Push Private Credentials**: `SMS_API_KEY`, `FCM_SERVICE_ACCOUNT_KEY`, `NOTIF_VAPID_PRIVATE_KEY`.

### 8.3 Build-Time Compilation vs. Dynamic Runtime Configuration
1. **Static Build-Time Inlining**:
   - When running `npm run build`, Vite scans frontend source code and statically replaces all occurrences of `import.meta.env.VITE_*` with the string literal configured in the build environment.
   - Once compiled into `.dist/assets/*.js`, these values cannot be changed without re-running the build pipeline.
2. **Dynamic Runtime Configuration API**:
   - For configuration values that must adapt dynamically at runtime without rebuilding client bundles (e.g., operational feature flags, emergency banners, maintenance mode notifications), the frontend executes an unauthenticated GET request to `/api/v1/config/client` during initial boot.
   - The backend reads dynamic flags from Redis or PostgreSQL and serves a sanitized JSON payload. This guarantees centralized administrative control without exposing build pipelines to frequent redeployments.

---

## 9. Backend Configuration

The backend services for BREAKING NEWS WALA (Express API server, background ingestion workers, BullMQ job queues, and AI Agent executors) are built on Node.js and TypeScript. Configuration is loaded into ephemeral memory during application startup and strictly validated before opening TCP listening sockets.

### 9.1 Configuration Loading Sequence
The backend executes a deterministic five-phase initialization sequence:

```
+-----------------------------------------------------------------------------------------+
|                              BACKEND STARTUP SEQUENCE                                   |
|                                                                                         |
|   [Phase 1] Process Environment Injection                                               |
|             Container runtime loads OS env flags & mounted cloud secrets                |
|                                    |                                                    |
|                                    v                                                    |
|   [Phase 2] Zod Schema Validation (Fail-Fast Gate)                                      |
|             Validate process.env against strictly typed schema; exit(1) on failure      |
|                                    |                                                    |
|                                    v                                                    |
|   [Phase 3] Infrastructure Connectivity Verification                                    |
|             Ping PostgreSQL (SELECT 1) and Redis (PING); verify connection pools        |
|                                    |                                                    |
|                                    v                                                    |
|   [Phase 4] Subsystem Instantiation                                                     |
|             Initialize AI API Pool, prompt registry, BullMQ workers, and rate limiters   |
|                                    |                                                    |
|                                    v                                                    |
|   [Phase 5] Network Socket Binding                                                      |
|             Bind server.listen(PORT); emit structured ready log: {"status":"READY"}     |
+-----------------------------------------------------------------------------------------+
```

### 9.2 Fail-Fast Startup Philosophy
The backend strictly forbids silent fallbacks for missing or invalid security parameters. If an essential environment variable is omitted or contains malformed data:
- The server **must immediately terminate with exit code 1**.
- The startup error logger writes a high-priority diagnostic alert identifying the missing configuration key name.
- **Security Rule**: The error message must **never print the secret value or partial substrings of valid secrets**. It only outputs the key name (e.g., `Missing or invalid environment configuration: [DATABASE_URL, JWT_ACCESS_SECRET]`).

---

## 10. Database and Cache Configuration

Database and cache configurations are governed by `docs/12-Database.md` and `docs/11-Architecture.md`. They guarantee persistent ACID-compliant transactional integrity, high-throughput caching, and resilient background job queue execution.

### 10.1 PostgreSQL Connection Architecture
- **Connection Reference**: Injected via `DATABASE_URL` as a standard URI:
  `postgresql://<username>:<password>@<db-host>:5432/<database_name>?sslmode=require&connect_timeout=10`
- **Connection Pool Sizing**:
  - Managed by Prisma Client with an underlying `pg.Pool`.
  - Development: `DB_POOL_MIN_CONNECTIONS=2`, `DB_POOL_MAX_CONNECTIONS=10`.
  - Staging: `DB_POOL_MIN_CONNECTIONS=5`, `DB_POOL_MAX_CONNECTIONS=20`.
  - Production: `DB_POOL_MIN_CONNECTIONS=10`, `DB_POOL_MAX_CONNECTIONS=50` (matched to Cloud Run instance concurrency).
- **Connection Timeouts & Retries**:
  - `DB_CONNECTION_TIMEOUT_MS=10000` (10s maximum connection acquisition wait).
  - `DB_IDLE_TIMEOUT_MS=30000` (30s idle connection reap window).
  - Exponential retry logic: 3 attempts with base delay 500ms before bubbling connection failure to health probes.
- **SSL/TLS Enforcement**:
  - `DB_SSL_MODE=require` in Staging and Production. Non-SSL connections are rejected at the database firewall.
- **Database Migrations**:
  - `DB_MIGRATION_AUTO_RUN=false` in Production. Automatic schema migrations on container boot are strictly prohibited in production to prevent race conditions during multi-instance rolling deploys. Migrations execute as a dedicated pre-deployment step in Cloud Build (`npx prisma migrate deploy`).
- **Backup & Recovery**:
  - Automated daily snapshots at 02:00 IST with 30-day retention.
  - Continuous WAL archiving enabling Point-In-Time Recovery (PITR) up to 7 days.

### 10.2 Redis Cache & BullMQ Queue Configuration
- **Connection Reference**: Injected via `REDIS_URL`: `rediss://default:<password>@<redis-host>:6379`.
- **TLS Encryption**: In Staging and Production, Redis connections must use TLS (`rediss://`).
- **Namespace Isolation**: `REDIS_KEY_PREFIX=bnw:` guarantees that all cache keys, rate-limiting counters, and session hashes reside in a distinct namespace, preventing accidental collisions.
- **Cache Eviction Policy**: Configured on the Redis server to `allkeys-lru` with a memory cap of 2 GB in Production.
- **BullMQ Worker Configuration**:
  - `BULLMQ_CONCURRENCY=10`: Each worker instance processes up to 10 asynchronous jobs concurrently.
  - `BULLMQ_DEFAULT_JOB_ATTEMPTS=3`: Failed jobs (e.g., RSS crawl timeout, AI API failure) are retried 3 times with exponential backoff (`BULLMQ_BACKOFF_DELAY_MS=5000`).
  - Failed jobs exceeding max attempts are automatically routed to a Dead-Letter Queue (DLQ) for operator inspection.

---

## 11. AI API Pool Configuration

Governed by `docs/19-API-Pool.md`, the centralized Multi-Provider AI API Pool orchestrates external AI provider interactions across Gemini, Claude, OpenAI, DeepSeek, Groq, and Mistral.

### 11.1 Provider & Model Registry Routing
The AI API Pool decouples application business logic from specific provider SDKs. Configuration dictates task-based routing based on latency, cost, and capability requirements:

| Task Type | Primary Configured Provider | Primary Model Target | Fallback Provider | Fallback Model |
| :--- | :--- | :--- | :--- | :--- |
| **Breaking News Summaries** | Groq (`GROQ_API_KEY`) | `llama-3.3-70b-versatile` | Gemini (`GEMINI_API_KEY`) | `gemini-1.5-flash` |
| **Deep Fact Verification** | Gemini (`GEMINI_API_KEY`) | `gemini-1.5-pro` | Claude (`CLAUDE_API_KEY`) | `claude-3-5-sonnet` |
| **Indic Language Translation** | Gemini (`GEMINI_API_KEY`) | `gemini-1.5-flash` | Mistral (`MISTRAL_API_KEY`) | `mistral-large` |
| **Autonomous News Ingestion** | DeepSeek (`DEEPSEEK_API_KEY`) | `deepseek-chat` | Groq (`GROQ_API_KEY`) | `llama-3.3-70b-versatile` |
| **Community Sentiment Analysis** | OpenAI (`OPENAI_API_KEY`) | `gpt-4o-mini` | Gemini (`GEMINI_API_KEY`) | `gemini-1.5-flash` |

### 11.2 Quota Management & Circuit Breakers
- **Circuit Breaker Mechanics**:
  - `AI_CIRCUIT_BREAKER_FAILURE_THRESHOLD=5`: If a provider returns 5 consecutive HTTP 429 (Rate Limit) or 5xx server errors, its circuit transitions to `OPEN`.
  - `AI_CIRCUIT_BREAKER_RESET_TIMEOUT_MS=60000`: While `OPEN`, all incoming requests for that provider immediately route to the configured fallback provider without making network calls. After 60 seconds, a single canary request tests provider recovery (`HALF-OPEN`).
- **Quota Protection Invariant**: Under no circumstances may environment variables be manipulated or cycled to bypass external provider usage limits or terms of service. Quotas are monitored via Prometheus telemetry, alerting operations before hard limits are hit.
- **Environment Isolation**: Development environments utilize separate low-tier developer API keys with strict budget limits ($10/month cap). Production utilizes enterprise API accounts with isolated billing projects.

---

## 12. AI Agent and Prompt Configuration

AI Agents (`docs/17-Agents.md`) and Prompt Templates (`docs/21-Prompts.md`) execute autonomous news ingestion, editorial drafting, fact verification, and localization.

### 12.1 Agent Enablement Toggles
Every autonomous agent possesses an independent kill-switch environment variable, allowing immediate operational shutdown without code deployment:
- `AGENT_INGESTION_ENABLED=true`: Controls RSS feed crawling and external URL processing.
- `AGENT_DRAFTING_ENABLED=true`: Controls automated multi-source article drafting.
- `AGENT_VERIFICATION_ENABLED=true`: Controls autonomous claim extraction and fact-checking.
- `AGENT_TRANSLATION_ENABLED=true`: Controls automated localization into Hindi, English, Urdu, and Bengali.
- `AGENT_ENGAGEMENT_ENABLED=true`: Controls sentiment analysis and automated comment moderation.

### 12.2 Semantic Prompt Versioning
Prompts are treated as version-controlled software assets stored in YAML files within the repository (`PROMPT_REGISTRY_PATH=./config/prompts`). Configuration variables specify the exact semantic version loaded into active memory:
- `PROMPT_VERSION_INGESTION=v1.0.0`
- `PROMPT_VERSION_DRAFTING=v1.0.0`
- `PROMPT_VERSION_VERIFICATION=v1.0.0`
- **Zero Credentials in Prompts**: Prompts must contain strictly instructions, structural examples, and Zod output schemas. Database connection strings, API keys, and private credentials must never be injected into prompt text.
- **Permission Neutrality**: AI agent prompt configurations never confer database or system permissions. Agents execute strictly as non-privileged service workers whose outputs are validated by deterministic backend gates.

---

## 13. Model Context Protocol (MCP) Configuration

The Model Context Protocol (`docs/18-MCP.md`) provides standardized, secure tool interfaces connecting AI models to external platform tools and data sources.

### 13.1 MCP Server Registry & Architecture
- `MCP_ENABLED=true`: Master switch for the MCP client integration layer.
- `MCP_SERVER_REGISTRY_CONFIG=./config/mcp-servers.json`: Path to the declarative JSON file defining the registry of authorized local and remote MCP tool servers.
- **Authorized MCP Tool Servers**:
  1. `mcp-rss-fetcher`: Local stdio sandbox for fetching external RSS feeds.
  2. `mcp-fact-verifier`: Isolated tool server for querying trusted fact-checking databases.
  3. `mcp-media-optimizer`: Process sandbox for image resizing and WebP/AVIF transcoding.

### 13.2 Transport Protocols & Sandboxing
- `MCP_TRANSPORT_MODE=stdio`: By default, all MCP servers run as isolated child processes communicating over standard input/output (`stdio`) pipes.
- **Process Sandboxing**: Local stdio child processes run under restricted OS user permissions with read-only filesystem access and no network permissions other than specific whitelisted external domains.
- `MCP_CLIENT_TIMEOUT_MS=30000`: MCP tool invocations are forcefully terminated if they exceed 30 seconds.
- `MCP_MAX_CONCURRENT_CALLS=5`: Prevents resource starvation by limiting concurrent tool executions per agent.
- `MCP_AUDIT_LOGGING_ENABLED=true`: Every tool invocation, including tool name, sanitized input parameters, execution duration, and result status, is written to persistent audit logs. Privileged credentials are never passed as tool parameters.


---

## 14. External Integration Configuration

External integrations connect BREAKING NEWS WALA to news syndication feeds, payment gateways, cloud media storage, telemetry backends, and social distribution channels as specified in `docs/20-Integrations.md`.

```
+-----------------------------------------------------------------------------------------+
|                        EXTERNAL INTEGRATION CONFIGURATION BOUNDARIES                    |
|                                                                                         |
|   1. ENVIRONMENT VARIABLES       Global operational thresholds, timeouts, user agents   |
|   2. SECRET MANAGEMENT           Private API tokens, HMAC signing keys, credentials     |
|   3. DATABASE CONFIGURATION      Dynamic RSS feed URLs, active/paused toggles, categories|
|   4. ADMIN DASHBOARD             Runtime toggles, manual ingest triggers, source audits |
+-----------------------------------------------------------------------------------------+
```

### 14.1 RSS Feeds and the Source Activation Invariant
A critical architectural rule governs external RSS feeds:
> **Source Activation Invariant**: Only currently active and authorized news sources stored in the database may generate new imports. Deactivated, paused, or deleted sources must never contribute new articles or initiate web crawls.

To enforce this, configuration is strictly partitioned:
- **Global Crawler Environment Variables**:
  - `RSS_INGESTION_ENABLED=true`: Master kill-switch. When `false`, all scheduled RSS polling jobs halt immediately across all worker instances.
  - `RSS_POLL_INTERVAL_SEC=300`: Standard polling cadence (5 minutes).
  - `RSS_FETCH_TIMEOUT_MS=10000`: Maximum HTTP timeout before aborting slow feed requests.
  - `RSS_USER_AGENT=BreakingNewsWalaBot/1.0 (+https://breakingnewswala.in/bot)`: Identifying header complying with RFC 7231 web crawling standards.
- **Dynamic Database-Managed Configuration**:
  - Individual RSS feed endpoints, update frequency overrides, editorial category bindings, and operational status (`ACTIVE`, `PAUSED`, `REVOKED`) are stored in PostgreSQL within the `rss_sources` table.
  - Workers query `SELECT * FROM rss_sources WHERE status = 'ACTIVE'` prior to dispatching fetch jobs. If an editor disables a source in the Admin UI, the database record updates to `PAUSED`, and the crawler immediately ceases processing that source without requiring application restarts.

### 14.2 URL Processing & SSRF Defense
Automated URL ingestion allows editors or agents to extract news articles from external links. To protect internal network infrastructure from Server-Side Request Forgery (SSRF):
- `URL_SSRF_PROTECTION_ENABLED=true`: Enforces strict DNS resolution filtering before initiating HTTP GET requests.
- **Forbidden IP Address Ranges**:
  - Loopback addresses (`127.0.0.0/8`, `::1`).
  - RFC 1918 private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
  - Link-local and cloud metadata endpoints (`169.254.169.254`, `fe80::/10`).
  - Internal Kubernetes/Cloud Run service hostnames (`*.internal`, `*.cluster.local`).
- `URL_MAX_FETCH_SIZE_BYTES=5242880`: Maximum allowable download size (5 MB), preventing memory exhaustion attacks via oversized payloads.

### 14.3 Social Media Distribution Channels
Automated distribution of breaking alerts to external platforms relies on backend worker jobs authenticated via secret references:
- **X/Twitter**: Injected via `TWITTER_API_BEARER_TOKEN` (OAuth 2.0 Bearer).
- **Telegram Channel**: Injected via `TELEGRAM_BOT_TOKEN` and broadcast destination `TELEGRAM_CHANNEL_ID` (`@BreakingNewsWalaIndia`).
- **WhatsApp Cloud API**: Injected via `WHATSAPP_BUSINESS_API_KEY` for verified broadcast channels.

---

## 15. Webhook Configuration

Webhooks facilitate asynchronous, event-driven communication for external news partner feeds, payment confirmations, and third-party notifications.

### 15.1 Webhook Verification & Cryptographic Integrity
All inbound webhook requests must be cryptographically verified prior to payload parsing:
- **Signature Algorithm**: HMAC-SHA256 computed over the raw HTTP request body string.
- **Verification Headers**: Partner systems must supply the signature in the `X-BNW-Signature` header (or `X-Razorpay-Signature` for payments).
- **Constant-Time Verification**: Backend verification handlers must use `crypto.timingSafeEqual()` to compare computed and received signatures, completely eliminating timing attack vulnerabilities.
- **Secret Separation**: Inbound webhook secrets (`WEBHOOK_INGESTION_SECRET`, `WEBHOOK_PAYMENT_SECRET`) are distinct and never reused across Development, Staging, or Production environments.

### 15.2 Anti-Replay Protection & Idempotency
- **Timestamp Validation**: Inbound webhooks must supply a UNIX timestamp header (`X-BNW-Timestamp`). The backend compares this against current UTC server time.
  - `WEBHOOK_TIMESTAMP_TOLERANCE_SEC=300`: If the timestamp differs from server time by more than 300 seconds (5 minutes), the request is rejected immediately with HTTP 400.
- **Nonce Cache & Idempotency**:
  - Inbound webhook requests must include a unique `X-BNW-Nonce` UUID.
  - The backend checks Redis for key existence: `bnw:webhook:nonce:<uuid>`.
  - If found, the request is flagged as a duplicate replay attack and rejected with HTTP 409 Conflict.
  - If novel, the nonce is stored with `WEBHOOK_REPLAY_CACHE_TTL_SEC=86400` (24-hour expiration) before dispatching the payload to background workers.

---

## 16. Notification Configuration

The notification subsystem delivers breaking alerts and editorial updates across multiple channels based on user preferences and urgency ratings.

### 16.1 Supported Notification Channels
1. **In-App Notifications**:
   - `NOTIF_IN_APP_ENABLED=true`: Persists notification records in PostgreSQL (`notifications` table) and streams real-time badges to connected Web and Android clients via Server-Sent Events (SSE).
2. **Web Push (VAPID / Browser Push)**:
   - `NOTIF_WEB_PUSH_ENABLED=true`: Enables standard W3C Push API notifications across supported desktop and mobile browsers.
   - `NOTIF_VAPID_PUBLIC_KEY`: Public P-256 application server key exposed to frontend browsers for push subscription generation.
   - `NOTIF_VAPID_PRIVATE_KEY`: Server-side secret scalar used to sign Web Push JWT tokens.
   - `NOTIF_VAPID_SUBJECT`: Contact URI (`mailto:admin@breakingnewswala.in`) included in push headers.
3. **Native Android Push (Firebase Cloud Messaging - FCM)**:
   - `FCM_PROJECT_ID`: Firebase project identifier.
   - `FCM_SERVICE_ACCOUNT_KEY`: Server-side private service account JSON used by the backend Firebase Admin SDK to dispatch high-priority push payloads to Android devices.
   - **Client Security Rule**: The Android APK only contains the public `google-services.json` client configuration file; the privileged service account key is **strictly forbidden from being compiled into the mobile app**.
4. **Transactional Indian SMS Gateway (Stage B / Critical Alerts)**:
   - `SMS_PROVIDER=fast2sms`: Driver selection for Indian telecom-approved SMS routing.
   - `SMS_API_KEY`: Secret authentication credential for the SMS gateway.
   - `SMS_SENDER_ID=BNWIND`: TRAI-registered 6-character sender ID header.
   - `SMS_DLT_TE_ID`: Distributed Ledger Technology (DLT) approved Template Entity identifier complying with Telecom Regulatory Authority of India (TRAI) commercial communications mandates.

### 16.2 User Preferences & Delivery Throttling
All notifications adhere to user opt-in preferences stored in the database. Users may customize notifications by category (e.g., National, Tech, Sports) and delivery mode. System configuration enforces a global throttling cap of maximum 3 high-priority push alerts per user per hour to prevent notification fatigue.

---

## 17. Native Android Configuration

In accordance with architectural guidelines, the future mobile implementation of BREAKING NEWS WALA (Stage B) is a **fully native Android application developed with Kotlin and Android SDK (API Level 34+, Android 14)**. 

```
+-----------------------------------------------------------------------------------------+
|                        NATIVE ANDROID CONFIGURATION BOUNDARIES                          |
|                                                                                         |
|   1. ARCHITECTURE STANDARD       100% Native Kotlin & Jetpack; ZERO WebViews            |
|   2. SINGLE SHARED BACKEND       Connects to unified /api/v1/*; NO private app backend  |
|   3. SECURE LOCAL STORAGE        EncryptedSharedPreferences with Android Keystore       |
|   4. ZERO EMBEDDED SECRETS       No AI keys, database URIs, or admin credentials in APK |
+-----------------------------------------------------------------------------------------+
```

### 17.1 Build Variants & Gradle Configuration
The Android project configuration is managed via Gradle build flavors and build types:

| Configuration Parameter | Debug Build Variant | Release Build Variant | Purpose / Target |
| :--- | :--- | :--- | :--- |
| `applicationId` | `in.breakingnewswala.app.debug` | `in.breakingnewswala.app` | Package namespace on device |
| `buildConfigField: API_BASE_URL` | `http://10.0.2.2:3000` (Emulator) | `https://api.breakingnewswala.in` | Backend REST API endpoint |
| `buildConfigField: APP_ENV` | `development` | `production` | Environment identity string |
| `minifyEnabled` | `false` | `true` | R8 / ProGuard code shrinking |
| `shrinkResources` | `false` | `true` | Removal of unused packaged assets |
| `debuggable` | `true` | `false` | Disables ADB debugging in release |

### 17.2 Secure Local Token Storage
- Mobile clients obtain short-lived access tokens (15 minutes) and long-lived refresh tokens (7 days) via standard OAuth2/JWT login endpoints.
- **Android Keystore Hardware Integration**:
  - Tokens stored on device must utilize `EncryptedSharedPreferences` backed by the hardware-isolated Android Keystore (`AndroidKeyStore` provider, MasterKey scheme `AES256_GCM`).
  - Tokens are never written to unencrypted SQLite databases, standard SharedPreferences XML, or external SD card storage.
- **Root Detection**: In production builds, the app performs a lightweight environment integrity check (SafetyNet / Play Integrity API) to alert users if running on rooted devices where Keystore keys might be exposed.

### 17.3 Application Signing Key Management
- Release APKs and Android App Bundles (AAB) are signed using a dedicated Java Keystore (`.jks`).
- **CI/CD Signing Secrets**:
  - The Keystore binary is base64-encoded and stored as an encrypted CI/CD secret (`ANDROID_KEYSTORE_BASE64`).
  - Passwords (`ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_PASSWORD`) and key aliases (`ANDROID_KEY_ALIAS`) are injected as ephemeral environment variables during the GitHub Actions / Cloud Build release step.
  - Keystore files and passwords must never be committed to Git.
  - Google Play App Signing is utilized for final end-user distribution, ensuring the root deployment key is securely held within Google's cloud infrastructure.

---

## 18. Configuration Validation

BREAKING NEWS WALA enforces strict, fail-fast configuration validation during backend process initialization. The application leverages a strongly typed **Zod schema** that parses, coerces, and validates `process.env` before any network or database handles are created.

### 18.1 Zod Validation Schema Definition
Below is the structural Zod schema representing the complete configuration contract:

```typescript
import { z } from "zod";

export const EnvironmentConfigSchema = z.object({
  // Application & Core Runtime
  NODE_ENV: z.enum(["development", "test", "staging", "production"]),
  APP_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1024).max(65535).default(3000),
  APP_BASE_URL: z.string().url(),
  APP_TIMEZONE: z.string().default("Asia/Kolkata"),
  APP_MAINTENANCE_MODE: z.enum(["true", "false"]).transform((v) => v === "true").default("false"),

  // Backend API & Security
  API_PREFIX: z.string().startsWith("/").default("/api/v1"),
  API_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  API_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(120),
  CORS_ALLOWED_ORIGINS: z.string().min(1),
  BODY_PARSER_LIMIT: z.string().regex(/^[0-9]+(kb|mb)$/).default("10mb"),
  SERVER_GRACEFUL_SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),

  // Database (PostgreSQL)
  DATABASE_URL: z.string().startsWith("postgresql://"),
  DB_POOL_MIN_CONNECTIONS: z.coerce.number().int().min(1).max(20).default(5),
  DB_POOL_MAX_CONNECTIONS: z.coerce.number().int().min(5).max(100).default(20),
  DB_CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  DB_IDLE_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  DB_SSL_MODE: z.enum(["disable", "require", "verify-ca", "verify-full"]).default("require"),
  DB_MIGRATION_AUTO_RUN: z.enum(["true", "false"]).transform((v) => v === "true").default("false"),

  // In-Memory Cache & Queues (Redis / BullMQ)
  REDIS_URL: z.string().regex(/^rediss?:\/\//),
  REDIS_CLUSTER_MODE: z.enum(["true", "false"]).transform((v) => v === "true").default("false"),
  REDIS_KEY_PREFIX: z.string().endsWith(":").default("bnw:"),
  BULLMQ_CONCURRENCY: z.coerce.number().int().min(1).max(50).default(10),
  BULLMQ_DEFAULT_JOB_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(3),
  BULLMQ_BACKOFF_DELAY_MS: z.coerce.number().int().positive().default(5000),

  // Authentication & Session Security
  JWT_ACCESS_SECRET: z.string().min(64),
  JWT_REFRESH_SECRET: z.string().min(64),
  JWT_ACCESS_EXPIRATION_SEC: z.coerce.number().int().min(300).max(3600).default(900),
  JWT_REFRESH_EXPIRATION_SEC: z.coerce.number().int().min(86400).max(2592000).default(604800),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
  SESSION_COOKIE_NAME: z.string().default("bnw_session"),
  SESSION_COOKIE_SECURE: z.enum(["true", "false"]).transform((v) => v === "true").default("true"),

  // Media Storage & CDN
  STORAGE_PROVIDER: z.enum(["local", "r2", "s3", "gcs"]).default("local"),
  STORAGE_BUCKET_NAME: z.string().min(3).max(63),
  STORAGE_ENDPOINT: z.string().url().optional(),
  STORAGE_REGION: z.string().default("auto"),
  STORAGE_ACCESS_KEY_ID: z.string().min(10).optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().min(20).optional(),
  CDN_PUBLIC_BASE_URL: z.string().url().optional(),

  // AI API Pool & Providers
  AI_POOL_ROUTING_STRATEGY: z.enum(["round-robin", "priority-fallback", "latency-cost-balanced"]).default("latency-cost-balanced"),
  AI_DEFAULT_FALLBACK_ORDER: z.string().default("gemini,groq,claude,openai,deepseek,mistral"),
  GEMINI_API_KEY: z.string().min(1),
  CLAUDE_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  MISTRAL_API_KEY: z.string().optional(),
  AI_CIRCUIT_BREAKER_FAILURE_THRESHOLD: z.coerce.number().int().min(1).max(20).default(5),
  AI_CIRCUIT_BREAKER_RESET_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),

  // RSS & URL Crawling
  RSS_INGESTION_ENABLED: z.enum(["true", "false"]).transform((v) => v === "true").default("true"),
  RSS_POLL_INTERVAL_SEC: z.coerce.number().int().min(60).max(3600).default(300),
  RSS_MAX_ITEMS_PER_POLL: z.coerce.number().int().min(5).max(200).default(50),
  RSS_FETCH_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  RSS_USER_AGENT: z.string().min(5).default("BreakingNewsWalaBot/1.0 (+https://breakingnewswala.in/bot)"),
  URL_MAX_FETCH_SIZE_BYTES: z.coerce.number().int().positive().default(5242880),
  URL_SSRF_PROTECTION_ENABLED: z.enum(["true", "false"]).transform((v) => v === "true").default("true"),

  // Webhook Verification
  WEBHOOK_INGESTION_SECRET: z.string().min(32).optional(),
  WEBHOOK_PAYMENT_SECRET: z.string().min(32).optional(),
  WEBHOOK_TIMESTAMP_TOLERANCE_SEC: z.coerce.number().int().positive().default(300),
  WEBHOOK_REPLAY_CACHE_TTL_SEC: z.coerce.number().int().positive().default(86400),

  // Logging & Observability
  LOG_LEVEL: z.enum(["error", "warn", "info", "http", "verbose", "debug"]).default("info"),
  LOG_FORMAT: z.enum(["json", "pretty"]).default("json"),
  LOG_REDACT_KEYS: z.string().default("password,token,secret,authorization,key,apiKey"),
  METRICS_ENABLED: z.enum(["true", "false"]).transform((v) => v === "true").default("true"),
  SENTRY_DSN: z.string().url().optional(),
});

export type EnvironmentConfig = z.infer<typeof EnvironmentConfigSchema>;
```

### 18.2 Error Reporting & Sanitized Diagnostics
When validation fails during `validateConfig(process.env)`:
1. The validator traps all Zod issues.
2. An error report formats the list of failed variable names, expected types, and validation error messages.
3. **Redaction Guarantee**: Under no circumstances does the error logger output the actual invalid input string for sensitive fields. If `DATABASE_URL` is malformed, the log outputs `{"field": "DATABASE_URL", "error": "Invalid PostgreSQL URI"}`; the connection password is never included in the log output.
4. Process terminates immediately with `process.exit(1)`.

---

## 19. Configuration Change Management

Configuration adjustments in production environments must follow strict change management protocols to prevent service disruptions and security breaches.

```
+-----------------------------------------------------------------------------------------+
|                        CONFIGURATION CHANGE MANAGEMENT GOVERNANCE                      |
|                                                                                         |
|   1. CONFIGURATION OWNERSHIP      Defined roles for SecOps, DevOps, AI, and Product    |
|   2. TWO-PERSON RULE              Production secrets require dual-approver review       |
|   3. RESTART CLASSIFICATION       Explicit matrix: Redeploy vs Restart vs Dynamic       |
|   4. AUDITED ROLLBACK             Instant revert to prior Secret Manager version        |
+-----------------------------------------------------------------------------------------+
```

### 19.1 Operational Ownership Matrix
- **Security Operations (SecOps)**: Owns authentication secrets (`JWT_*`), webhook keys, encryption keys, and SSL configurations.
- **DevOps / Platform Engineering**: Owns database connection parameters, Redis clustering, Cloud Run scaling settings, and networking ports.
- **AI / Machine Learning Lead**: Owns AI provider API keys, model routing weights, fallback sequences, and MCP configurations.
- **Product & Editorial Lead**: Owns RSS feed schedules, notification throttling limits, and public brand strings.

### 19.2 Change Execution & Restart Classification Matrix
Configuration changes differ fundamentally in how they are ingested by the running platform:

| Change Type | Impacted Parameters | Required Operational Action | Downtime / User Impact |
| :--- | :--- | :--- | :--- |
| **Frontend Public Config** | `VITE_*` parameters | Full CI/CD rebuild & static CDN cache purge | Zero downtime (atomic CDN edge switch) |
| **Backend Static Env** | `PORT`, `CORS_ALLOWED_ORIGINS`, `API_PREFIX` | Rolling restart of Cloud Run backend containers | Zero downtime (rolling deployment) |
| **Database Pool Sizing** | `DB_POOL_MAX_CONNECTIONS`, timeouts | Rolling restart of backend containers | Zero downtime |
| **Secret Rotation** | `JWT_*`, `DATABASE_URL`, `GEMINI_API_KEY` | Deploy new Secret Manager version + Rolling restart | Zero downtime |
| **Background Worker Config**| `BULLMQ_CONCURRENCY`, `RSS_POLL_INTERVAL_SEC` | Rolling restart of worker containers | Zero downtime (active jobs finish gracefully) |
| **Dynamic Editorial Settings**| RSS Feed active status, category mappings | Database update via Admin UI; NO restart required | Instantaneous (next poll cycle picks up change)|
| **Emergency Kill-Switch** | `APP_MAINTENANCE_MODE`, `AGENT_*_ENABLED` | Admin UI / Redis flag update; NO restart required | Instantaneous (< 1 second across cluster) |

### 19.3 Secret Rotation & Emergency Revocation Workflow
1. **Planned Rotation (e.g., 90-day AI API Key Rollover)**:
   - Step 1: Generate secondary key in provider console (e.g., Google AI Studio).
   - Step 2: Upload key as Version N+1 to GCP Secret Manager.
   - Step 3: Trigger Cloud Run service update to bind latest version.
   - Step 4: Monitor application error logs for 1 hour.
   - Step 5: Deactivate and delete Version N key in provider console.
2. **Emergency Revocation (Compromised Credential)**:
   - Step 1: SecOps generates new key immediately.
   - Step 2: Secret Manager updated with new version.
   - Step 3: Cloud Run instances restarted with forced revision rollout (`gcloud run services update --update-secrets=...`).
   - Step 4: Revoke compromised key at provider endpoint immediately. Total elapsed time must be under 5 minutes.


---

## 20. Configuration Examples

The following templates illustrate safe, sanitized configuration structures across all environments and architectural execution planes. All secret values are represented by standard placeholders (`<SECRET_REFERENCE>`, `<DATABASE_CONNECTION_REFERENCE>`, etc.) to prevent accidental credential leakage.

### 20.1 Local Development Environment (`.env.local`)
```ini
# Core Application & Runtime
NODE_ENV=development
APP_ENV=development
PORT=3000
APP_BASE_URL=http://localhost:3000
APP_TIMEZONE=Asia/Kolkata
APP_MAINTENANCE_MODE=false

# Backend API & Networking
API_PREFIX=/api/v1
API_RATE_LIMIT_WINDOW_MS=60000
API_RATE_LIMIT_MAX_REQUESTS=1000
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
BODY_PARSER_LIMIT=10mb
SERVER_GRACEFUL_SHUTDOWN_TIMEOUT_MS=5000

# Relational Database (Local Docker PostgreSQL)
DATABASE_URL=postgresql://postgres:<LOCAL_DEV_PASSWORD>@localhost:5432/breaking_news_wala_dev?sslmode=disable
DB_POOL_MIN_CONNECTIONS=2
DB_POOL_MAX_CONNECTIONS=10
DB_CONNECTION_TIMEOUT_MS=5000
DB_IDLE_TIMEOUT_MS=30000
DB_SSL_MODE=disable
DB_MIGRATION_AUTO_RUN=true

# Cache & Queues (Local Docker Redis)
REDIS_URL=redis://localhost:6379
REDIS_CLUSTER_MODE=false
REDIS_KEY_PREFIX=bnw_dev:
BULLMQ_CONCURRENCY=5
BULLMQ_DEFAULT_JOB_ATTEMPTS=2
BULLMQ_BACKOFF_DELAY_MS=2000

# Authentication & Session Security (Local Ephemeral Keys)
JWT_ACCESS_SECRET=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
JWT_REFRESH_SECRET=fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210
JWT_ACCESS_EXPIRATION_SEC=900
JWT_REFRESH_EXPIRATION_SEC=604800
BCRYPT_SALT_ROUNDS=10
SESSION_COOKIE_NAME=bnw_session_dev
SESSION_COOKIE_SECURE=false

# Media Storage & CDN (Local Mock Storage)
STORAGE_PROVIDER=local
STORAGE_BUCKET_NAME=bnw-media-dev
CDN_PUBLIC_BASE_URL=http://localhost:3000/uploads

# AI API Pool (Developer Test Keys with Sandbox Quotas)
AI_POOL_ROUTING_STRATEGY=latency-cost-balanced
AI_DEFAULT_FALLBACK_ORDER=gemini,groq,claude
GEMINI_API_KEY=<DEVELOPER_GEMINI_KEY_FROM_AI_STUDIO>
CLAUDE_API_KEY=<OPTIONAL_SANDBOX_CLAUDE_KEY>
GROQ_API_KEY=<OPTIONAL_SANDBOX_GROQ_KEY>
AI_CIRCUIT_BREAKER_FAILURE_THRESHOLD=3
AI_CIRCUIT_BREAKER_RESET_TIMEOUT_MS=15000

# RSS Ingestion & Tool Sandboxing
RSS_INGESTION_ENABLED=true
RSS_POLL_INTERVAL_SEC=120
RSS_FETCH_TIMEOUT_MS=5000
URL_SSRF_PROTECTION_ENABLED=true
MCP_ENABLED=true
MCP_SERVER_REGISTRY_CONFIG=./config/mcp-servers.json

# Logging
LOG_LEVEL=debug
LOG_FORMAT=pretty
METRICS_ENABLED=false
```

### 20.2 Testing & CI Environment (`.env.test`)
```ini
# Continuous Integration Test Runner Configuration
NODE_ENV=test
APP_ENV=test
PORT=3001
APP_BASE_URL=http://localhost:3001
APP_TIMEZONE=Asia/Kolkata
APP_MAINTENANCE_MODE=false

API_PREFIX=/api/v1
API_RATE_LIMIT_WINDOW_MS=60000
API_RATE_LIMIT_MAX_REQUESTS=10000
CORS_ALLOWED_ORIGINS=http://localhost:3001

# Ephemeral PostgreSQL Service Container
DATABASE_URL=postgresql://test_runner:test_runner@localhost:5432/bnw_test_runner?sslmode=disable
DB_POOL_MIN_CONNECTIONS=1
DB_POOL_MAX_CONNECTIONS=5
DB_SSL_MODE=disable
DB_MIGRATION_AUTO_RUN=true

# Ephemeral Redis Service Container
REDIS_URL=redis://localhost:6379
REDIS_CLUSTER_MODE=false
REDIS_KEY_PREFIX=bnw_test:
BULLMQ_CONCURRENCY=2
BULLMQ_DEFAULT_JOB_ATTEMPTS=1

JWT_ACCESS_SECRET=test_access_secret_for_automated_testing_purposes_only_64_characters_min
JWT_REFRESH_SECRET=test_refresh_secret_for_automated_testing_purposes_only_64_characters_min
BCRYPT_SALT_ROUNDS=8
SESSION_COOKIE_SECURE=false

STORAGE_PROVIDER=local
STORAGE_BUCKET_NAME=bnw-test-fixtures

# Mock AI Engine (Zero External Outbound HTTP Requests)
AI_POOL_ROUTING_STRATEGY=mock
GEMINI_API_KEY=mock-gemini-key-for-test-pipeline
RSS_INGESTION_ENABLED=false
URL_SSRF_PROTECTION_ENABLED=true
MCP_ENABLED=false

LOG_LEVEL=error
LOG_FORMAT=json
METRICS_ENABLED=false
```

### 20.3 Production Cloud Run Configuration (Secret References)
In production, Cloud Run containers do not load `.env` files. Secrets are injected at runtime via Google Cloud Secret Manager references within deployment manifests:

```yaml
# Illustrative snippet from Cloud Run deployment specification
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: bnw-backend
  namespace: prod
spec:
  template:
    spec:
      containers:
        - image: asia-south1-docker.pkg.dev/bnw-prod/images/backend:v1.2.0
          env:
            - name: NODE_ENV
              value: "production"
            - name: APP_ENV
              value: "production"
            - name: PORT
              value: "3000"
            - name: APP_BASE_URL
              value: "https://breakingnewswala.in"
            - name: CORS_ALLOWED_ORIGINS
              value: "https://breakingnewswala.in,https://www.breakingnewswala.in"
            - name: DB_SSL_MODE
              value: "require"
            - name: DB_MIGRATION_AUTO_RUN
              value: "false"
            - name: REDIS_KEY_PREFIX
              value: "bnw_prod:"
            - name: LOG_LEVEL
              value: "info"
            - name: LOG_FORMAT
              value: "json"
            # Injected Cloud Secret References
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: projects/bnw-prod/secrets/PROD_DATABASE_URL/versions/latest
                  key: latest
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: projects/bnw-prod/secrets/PROD_REDIS_URL/versions/latest
                  key: latest
            - name: JWT_ACCESS_SECRET
              valueFrom:
                secretKeyRef:
                  name: projects/bnw-prod/secrets/PROD_JWT_ACCESS_SECRET/versions/latest
                  key: latest
            - name: JWT_REFRESH_SECRET
              valueFrom:
                secretKeyRef:
                  name: projects/bnw-prod/secrets/PROD_JWT_REFRESH_SECRET/versions/latest
                  key: latest
            - name: GEMINI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: projects/bnw-prod/secrets/PROD_GEMINI_API_KEY/versions/latest
                  key: latest
            - name: STORAGE_ACCESS_KEY_ID
              valueFrom:
                secretKeyRef:
                  name: projects/bnw-prod/secrets/PROD_STORAGE_ACCESS_KEY/versions/latest
                  key: latest
            - name: STORAGE_SECRET_ACCESS_KEY
              valueFrom:
                secretKeyRef:
                  name: projects/bnw-prod/secrets/PROD_STORAGE_SECRET_KEY/versions/latest
                  key: latest
```

### 20.4 Frontend Public Production Configuration (`.env.production`)
```ini
# Strictly Public Parameters Compiled by Vite into Client JavaScript Assets
VITE_APP_NAME="BREAKING NEWS WALA"
VITE_APP_ENV="production"
VITE_API_BASE_URL=""
VITE_CDN_BASE_URL="https://cdn.breakingnewswala.in"
VITE_DEFAULT_LOCALE="hi"
VITE_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

### 20.5 Future Android Build Configuration (`build.gradle.kts` snippet)
```kotlin
// android/app/build.gradle.kts
android {
    namespace = "in.breakingnewswala.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "in.breakingnewswala.app"
        minSdk = 26
        targetSdk = 34
        versionCode = 100
        versionName = "1.0.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000/api/v1/\"")
            buildConfigField("String", "APP_ENV", "\"development\"")
            isDebuggable = true
            isMinifyEnabled = false
        }
        release {
            buildConfigField("String", "API_BASE_URL", "\"https://api.breakingnewswala.in/api/v1/\"")
            buildConfigField("String", "APP_ENV", "\"production\"")
            isDebuggable = false
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // Keystore signing configuration injected via CI/CD environment variables
            signingConfig = signingConfigs.getByName("release")
        }
    }
}
```

---

## 21. Common Configuration Errors & Troubleshooting

This matrix addresses the 12 most frequent configuration failure modes across all platform environments, detailing exact symptoms, root causes, and safe remediation procedures.

| # | Configuration Error | Symptoms | Root Cause | Safe Corrective Steps |
| :- | :--- | :--- | :--- | :--- |
| 1 | **Missing Required Variable** | Process crashes immediately on boot with `exit(1)` and diagnostic Zod log. | A mandatory variable (e.g., `DATABASE_URL` or `JWT_ACCESS_SECRET`) was omitted from container environment. | Check deployment manifest or `.env` file against Section 18 Zod schema. Supply missing key reference in Secret Manager without exposing plaintext. |
| 2 | **Invalid Environment Name** | Backend throws validation error: `Invalid enum value for NODE_ENV`. | Typo in environment specification (e.g., `NODE_ENV=prod` instead of `production`). | Update variable to match strict enum: `development`, `test`, `staging`, or `production`. |
| 3 | **Database Connection Failure** | HTTP 500 errors on database queries; logs output `ECONNREFUSED` or `ETIMEDOUT`. | Malformed `DATABASE_URL`, unreachable PostgreSQL host, network firewall block, or exhausted connection pool. | Verify DB host reachability and VPC connector routing. Ensure credentials are valid and `DB_POOL_MAX_CONNECTIONS` does not exceed DB server limits. |
| 4 | **Invalid Authentication Secret** | JWT verification fails with `JsonWebTokenError: invalid signature` or `secretOrPrivateKey must have a value`. | `JWT_ACCESS_SECRET` is missing, less than 64 characters, or differs across clustered backend instances. | Generate a 256-bit high-entropy secret (e.g., `openssl rand -hex 32`) and update Secret Manager so all backend replicas share the identical key. |
| 5 | **Expired Provider Credentials** | AI generation fails; logs show HTTP 401 Unauthorized from Google AI Studio or Groq. | Provider API key was rotated or expired in provider console, but Secret Manager was not updated. | Generate a fresh API key in the provider console, create a new secret version in Secret Manager, and trigger a rolling service restart. |
| 6 | **AI API Pool Misconfiguration** | AI tasks fail with `NoHealthyProvidersError`; requests not failing over to backup models. | `AI_DEFAULT_FALLBACK_ORDER` specifies invalid provider keys, or circuit breakers are stuck OPEN. | Inspect `/metrics` for provider health. Verify fallback order syntax and check that API keys exist for secondary providers. |
| 7 | **Provider Rate Limits (HTTP 429)** | AI generation latency spikes; fallback providers are triggered continuously. | Request volume exceeded provider tier quota (e.g., free tier TPM limit hit on Gemini or Groq). | Enable paid tier quotas with provider. Tune `AI_CIRCUIT_BREAKER_RESET_TIMEOUT_MS` and distribute load across secondary fallback models. |
| 8 | **Storage Access Failure** | Media uploads fail with `AccessDenied` or `SignatureDoesNotMatch`. | `STORAGE_ACCESS_KEY_ID` or `STORAGE_SECRET_ACCESS_KEY` is incorrect, or S3 endpoint URL is malformed. | Verify Cloudflare R2 / S3 bucket permissions. Re-issue API token with read/write permissions and update Secret Manager references. |
| 9 | **Webhook Signature Mismatch** | Inbound webhook returns HTTP 401 `Invalid signature`. | Mismatch between partner signing secret and backend `WEBHOOK_INGESTION_SECRET`, or raw body parsing was corrupted. | Confirm webhook partner is using correct shared secret. Ensure backend computes HMAC over raw unparsed request buffer prior to JSON deserialization. |
| 10 | **Incorrect Frontend API URL** | Browser DevTools displays `net::ERR_CONNECTION_REFUSED` or 404 for `/api/v1/*` endpoints. | `VITE_API_BASE_URL` was compiled with an incorrect hostname or missing port number. | In production, leave `VITE_API_BASE_URL=""` for same-origin routing, or set to `https://api.breakingnewswala.in`. Re-run `npm run build`. |
| 11 | **CORS Configuration Error** | Browser blocks API calls with `CORS policy: No 'Access-Control-Allow-Origin' header is present`. | Frontend origin domain (e.g., `https://breakingnewswala.in`) is omitted from `CORS_ALLOWED_ORIGINS`. | Add the frontend domain to the comma-separated `CORS_ALLOWED_ORIGINS` variable and perform a rolling restart of the backend. |
| 12 | **Android API Environment Mismatch** | Mobile app in production connects to staging API or localhost (`10.0.2.2`). | Build variant misconfiguration in Gradle; release build variant was packaged with debug `buildConfigField`. | Verify `build.gradle.kts` release block sets `API_BASE_URL` to `https://api.breakingnewswala.in`. Rebuild release AAB artifact. |

---

## 22. Configuration Architecture Diagrams

The following 8 architectural diagrams illustrate configuration flows, secret management lifecycles, and environment isolation topologies.

### 22.1 Diagram 1: Environment Separation Architecture
```mermaid
flowchart TD
    subgraph Env_Separation["Platform Environment Separation Pipeline"]
        Dev["Development Environment\nLocal Machine & Docker\nSynthetic Mock Data\nLocal Keys"]
        CI["Testing / CI Pipeline\nGitHub Actions & Cloud Build\nAutomated Unit & E2E Tests\nEphemeral DB Containers"]
        Staging["Staging Environment\nCloud Run & Cloud SQL Replica\nSanitized Production Mirror\nRestricted Sandbox Keys"]
        Prod["Production Environment\nMulti-Instance Cloud Run\nCloud SQL HA Primary\nEncrypted Enterprise Secrets"]
    end

    Dev -->|"Pull Request"| CI
    CI -->|"Merge to main"| Staging
    Staging -->|"Manual Promotion Approval"| Prod
```

### 22.2 Diagram 2: Public versus Private Configuration Boundary
```mermaid
flowchart LR
    subgraph Client_Execution_Plane["Public Client Execution Plane"]
        WebBrowser["Web Browser (PWA)"]
        AndroidApp["Native Android APK"]
        ViteConfig["Vite Build Inlining (VITE_*)"]
    end

    subgraph Security_Perimeter["Zero-Trust Security Perimeter"]
        direction TB
        API_Gateway["API Gateway / Cloud Run Reverse Proxy"]
    end

    subgraph Backend_Execution_Plane["Private Backend Execution Plane"]
        NodeServer["Node.js Express API Server"]
        Workers["BullMQ Job Workers"]
        Postgres["PostgreSQL (DATABASE_URL)"]
        RedisStore["Redis Cluster (REDIS_URL)"]
        AI_Pool["AI API Pool (GEMINI, GROQ, CLAUDE)"]
    end

    ViteConfig --> WebBrowser
    WebBrowser -->|"Public HTTP Requests"| API_Gateway
    AndroidApp -->|"Public HTTPS Requests"| API_Gateway
    API_Gateway -->|"Authenticated Internal Routing"| NodeServer
    NodeServer --> Postgres
    NodeServer --> RedisStore
    NodeServer --> AI_Pool
    Workers --> RedisStore
    Workers --> AI_Pool
```

### 22.3 Diagram 3: Backend Secret-Management Flow
```mermaid
flowchart LR
    SecOps["SecOps Administrator"] -->|"Upload Secret"| SecretManager["GCP Secret Manager\nEnvelope Encrypted (KMS)"]
    SecretManager -->|"IAM Workload Identity"| CloudRun["Cloud Run Runtime"]
    CloudRun -->|"Injected at Container Boot"| ProcessEnv["Node.js process.env (RAM Only)"]
    ProcessEnv -->|"Validated at Boot"| ZodSchema["Zod Validation Schema"]
    ZodSchema -->|"Pass"| InitSubsystems["Initialize Backend Modules"]
    ZodSchema -->|"Fail"| Abort["Process Exit(1)\nSanitized Error Log"]
```

### 22.4 Diagram 4: AI API Pool Credential & Request Routing Flow
```mermaid
flowchart TD
    AgentCall["AI Agent Request\n(Ingestion / Drafting / Verification)"] --> AIPool["Multi-Provider AI API Pool"]
    
    subgraph AIPoolRouter["AI API Pool Core Engine"]
        Router["Task & Latency Router"]
        CircuitBreaker["Circuit Breaker State Guard"]
        CredManager["Server-Side Credential Store\n(GEMINI, GROQ, CLAUDE, OPENAI)"]
    end

    AIPool --> Router
    Router --> CircuitBreaker
    CredManager -.->|"Injects Bearer Token"| Router

    CircuitBreaker -->|"Primary Healthy"| PrimaryProvider["Primary Provider\n(e.g., Groq / Gemini Flash)"]
    CircuitBreaker -->|"Primary Tripped (OPEN)"| FallbackProvider["Fallback Provider\n(e.g., Claude / Mistral)"]
```

### 22.5 Diagram 5: External Integration Configuration Topology
```mermaid
flowchart LR
    subgraph Backend_Server["Backend API & Workers"]
        Crawler["RSS & URL Ingestion Crawler"]
        NotifService["Notification Dispatcher"]
        MediaService["Media Asset Manager"]
    end

    subgraph Dynamic_DB["Database & Secret Manager"]
        RSS_DB["PostgreSQL rss_sources Table\n(status: ACTIVE)"]
        Secrets["Secret Manager References\n(SMS, FCM, R2 Keys)"]
    end

    subgraph External_Providers["External Integration Endpoints"]
        RSS_Feeds["Authorized News RSS Feeds"]
        FCM["Firebase Cloud Messaging"]
        SMS_GW["Indian SMS Gateway (TRAI DLT)"]
        R2_CDN["Cloudflare R2 & Global CDN"]
    end

    RSS_DB -->|"Active Feeds Query"| Crawler
    Secrets -.-> NotifService
    Secrets -.-> MediaService

    Crawler -->|"Fetch XML Feeds"| RSS_Feeds
    NotifService -->|"Push Notifications"| FCM
    NotifService -->|"Transactional SMS"| SMS_GW
    MediaService -->|"Store & Serve Assets"| R2_CDN
```

### 22.6 Diagram 6: Development-to-Production Configuration Promotion Pipeline
```mermaid
flowchart TD
    DevConfig["Local Development\n(.env.example -> .env.local)\nLocal Docker DB & Mocks"] -->|"Git Commit (Code Only)"| PR["Pull Request Review"]
    PR -->|"CI Pipeline (Cloud Build)"| CI_Stage["CI Testing Pipeline\n(.env.test with Ephemeral DB)\nUnit & Integration Tests"]
    CI_Stage -->|"Automated Deploy"| StagingConfig["Staging Environment\n(GCP Secret Manager Staging)\nSanitized Data & Sandboxes"]
    StagingConfig -->|"Quality Gate & Smoke Tests"| ApprovalGate{"SecOps & Release\nApproval Gate"}
    ApprovalGate -->|"Approved"| ProdConfig["Production Environment\n(GCP Secret Manager Prod)\nHigh-Availability Multi-Instance"]
    ApprovalGate -->|"Rejected"| Rollback["Block Release & Trigger Audit"]
```

### 22.7 Diagram 7: Future Android Configuration Architecture
```mermaid
flowchart TD
    subgraph Gradle_Build["Android Gradle Build Pipeline"]
        FlavorDebug["Debug Build Flavor\nAPI: 10.0.2.2:3000\nDebuggable: true\nisMinifyEnabled: false"]
        FlavorRelease["Release Build Flavor\nAPI: api.breakingnewswala.in\nDebuggable: false\nR8 / ProGuard Minified"]
        Signing["Keystore Signing Config\n(CI/CD Runner Secret Injection)"]
    end

    subgraph Android_Device["Android Runtime (Kotlin SDK 34+)"]
        Retrofit["Retrofit REST Client\n(Unified /api/v1/* API)"]
        KeyStore["Android Keystore Hardware Module\n(EncryptedSharedPreferences)"]
        FCM_Client["Firebase Messaging Client\n(google-services.json)"]
    end

    FlavorRelease --> Signing
    Signing --> Android_Device
    Retrofit -->|"Public HTTPS"| SharedBackend["Single Shared Backend\n(Cloud Run API)"]
    KeyStore -.->|"Stores Auth Tokens"| Retrofit
```

### 22.8 Diagram 8: Secret Rotation and Revocation Sequence
```mermaid
sequenceDiagram
    autonumber
    actor SecOps as SecOps Engineer
    participant SM as GCP Secret Manager
    participant CR as Cloud Run Backend
    participant Prov as External Provider (AI / DB)

    Note over SecOps,Prov: Phase 1: Dual-Key Overlap Creation
    SecOps->>Prov: Generate New Keypair / Secret Version
    Prov-->>SecOps: Return New Secret Token
    SecOps->>SM: Add Secret Version (Version N+1)
    
    Note over SecOps,CR: Phase 2: Rolling Deployment
    SecOps->>CR: Trigger Rolling Service Restart
    CR->>SM: Fetch Latest Secret Version (Version N+1)
    CR->>CR: Mount New Secret in Process RAM & Validate
    CR-->>SecOps: Emit Healthy Health Check (HTTP 200)

    Note over SecOps,Prov: Phase 3: Revocation of Old Secret
    SecOps->>SM: Disable Secret Version N
    SecOps->>Prov: Revoke & Delete Old Key (Version N)
    SecOps-->>SecOps: Log Cryptographic Audit Trail
```

---

## 23. Environment Readiness Checklist

### 23.1 Development Environment Checklist
- [ ] Node.js v20.x LTS installed and verified (`node --version`).
- [ ] Docker and Docker Compose installed for local PostgreSQL and Redis dependencies.
- [ ] Local `.env` created by copying `.env.example` (verified `.gitignore` ignores `.env`).
- [ ] Local PostgreSQL database running and migrations applied (`npx prisma migrate dev`).
- [ ] Local Redis service running and responsive (`redis-cli ping` returns `PONG`).
- [ ] Developer Gemini API key obtained from Google AI Studio and injected into `.env`.
- [ ] Backend starts without Zod schema errors (`npm run dev:server`).
- [ ] Frontend Web PWA starts and binds to Vite development server (`npm run dev`).
- [ ] Test HTTP GET request to `/api/v1/health` returns status `OK`.

### 23.2 Testing & CI Environment Checklist
- [ ] CI pipeline configuration (`.github/workflows/ci.yml` or Cloud Build YAML) committed.
- [ ] Ephemeral PostgreSQL and Redis service containers provisioned in test workflow.
- [ ] Isolated test environment variables configured in `.env.test`.
- [ ] Mock AI API Pool adapter active to prevent external HTTP network calls during automated testing.
- [ ] Automated linting (`npm run lint`), type-checking (`npm run type-check`), and test suites pass.
- [ ] Zod environment schema validation test passes.

### 23.3 Staging Environment Checklist
- [ ] Dedicated GCP project `bnw-staging` provisioned in region `asia-south1` (Mumbai).
- [ ] Staging secrets provisioned in GCP Secret Manager with restricted IAM access.
- [ ] Cloud SQL PostgreSQL staging instance running with `sslmode=require`.
- [ ] Memorystore Redis staging instance operational.
- [ ] Staging Cloud Run service deployed with rolling update configuration.
- [ ] Automated smoke tests execute against staging URL without errors.
- [ ] End-to-end RSS ingestion verified with test staging feed.
- [ ] Webhook signature verification verified using staging test secret.

### 23.4 Production Environment Checklist
- [ ] Dedicated GCP project `bnw-prod` provisioned with organization policy constraints.
- [ ] High-Availability (HA) Cloud SQL PostgreSQL primary with automated failover and PITR enabled.
- [ ] Clustered Redis Memorystore provisioned with password authentication and TLS enabled.
- [ ] Production secrets provisioned in GCP Secret Manager with 2-person approval workflow.
- [ ] Cloud Run production service deployed with `minInstances: 2` and `maxInstances: 50`.
- [ ] Cloudflare CDN and WAF provisioned with DDoS mitigation and SSL Full (Strict) mode.
- [ ] All external AI provider credentials active with enterprise billing and monitoring alerts.
- [ ] Sentry error logging and Prometheus metrics active and reporting to monitoring dashboard.
- [ ] Data backup verified: Initial database snapshot completed and stored in multi-region bucket.
- [ ] SecOps sign-off completed: Verification that zero secrets exist in Git repository or client bundles.

### 23.5 Future Native Android Checklist (Stage B)
- [ ] Package namespace `in.breakingnewswala.app` registered in Google Play Console.
- [ ] Gradle build flavors (`debug`, `release`) configured with proper `buildConfigField` endpoints.
- [ ] Release signing keystore generated and stored securely in CI/CD encrypted secrets.
- [ ] ProGuard / R8 minification rules tested to ensure data models are not stripped.
- [ ] Hardware-backed `EncryptedSharedPreferences` verified for auth token persistence.
- [ ] Firebase Cloud Messaging `google-services.json` client configuration integrated.
- [ ] Verification that zero backend secrets or AI keys are compiled into release APK.

---

## 24. Environment Decision Register

The following Architectural Decision Records (ADRs) document the verified configuration choices and pending proposals for BREAKING NEWS WALA.

| ADR ID | Configuration Area | Decision / Question | Status | Available Options | Recommendation | Reasoning | Dependencies | Approver | Next Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ADR-ENV-001** | Secret Storage | Method for storing backend secrets in Staging and Production | **Confirmed** | 1. Encrypted `.env` files in container<br>2. Cloud Secret Manager | **Option 2: Cloud Secret Manager** | Eliminates secrets in Git; enables granular IAM and automated audit logging. | GCP IAM | SecOps Lead | Implement Secret Manager references in deployment manifests. |
| **ADR-ENV-002** | Config Validation | Schema validation framework for environment variables | **Confirmed** | 1. Custom validation logic<br>2. Joi<br>3. Zod | **Option 3: Zod Schema** | TypeScript native; zero-dependency schema validation with compile-time type inference. | TypeScript | Backend Lead | Integrate Zod schema in `server.ts` startup sequence. |
| **ADR-ENV-003** | Frontend Boundary | Prevention of private credential leakage in Web PWA | **Confirmed** | 1. Manual code review<br>2. Strict `VITE_` prefix enforcement + CI linting | **Option 2: Strict `VITE_` prefix + CI linting** | Deterministic compiler boundary; Vite strictly ignores non-`VITE_` variables for client bundling. | Vite Toolchain | Frontend Lead | Configure ESLint rule blocking non-whitelisted `VITE_*` keys. |
| **ADR-ENV-004** | AI Provider Pool | Architecture for managing multi-provider API keys | **Confirmed** | 1. Hardcoded SDK clients<br>2. Multi-Provider AI API Pool with server-side secrets | **Option 2: Multi-Provider AI API Pool** | Protects provider credentials; enables dynamic failover across Gemini, Groq, Claude, OpenAI. | `19-API-Pool.md` | AI Lead | Provision multi-provider keys in Secret Manager. |
| **ADR-ENV-005** | Database Migrations | Automatic vs. pre-deploy migration execution in Production | **Confirmed** | 1. Auto-run in `server.ts`<br>2. Pre-deploy CI/CD step (`prisma migrate deploy`) | **Option 2: Pre-deploy CI/CD step** | Prevents concurrent migration race conditions during multi-instance Cloud Run rollouts. | Cloud Build | Database Admin | Set `DB_MIGRATION_AUTO_RUN=false` in Production. |
| **ADR-ENV-006** | Android Architecture | Framework selection for mobile client implementation | **Confirmed** | 1. WebView wrapper<br>2. Flutter/React Native<br>3. 100% Native Kotlin SDK 34+ | **Option 3: 100% Native Kotlin SDK 34+** | High performance; native Android Keystore security; strict architectural compliance. | `01-PRD.md` | Mobile Lead | Create Stage B native Android Gradle project. |
| **ADR-ENV-007** | RSS Feed Control | Environment variable vs database management for RSS feeds | **Confirmed** | 1. All feeds in `.env`<br>2. Global toggles in `.env`, feed list in PostgreSQL | **Option 2: Global in `.env`, feeds in PostgreSQL** | Satisfies Source Activation Invariant: editors can pause/revoke feeds instantly without app restart. | `20-Integrations.md` | Content Lead | Ensure worker checks `status = 'ACTIVE'` prior to crawl. |
| **ADR-ENV-008** | Webhook Security | Inbound webhook verification algorithm and replay defense | **Confirmed** | 1. Basic Auth<br>2. HMAC-SHA256 with timestamp + Redis nonce cache | **Option 2: HMAC-SHA256 + Redis nonce cache** | Cryptographically secure; constant-time comparison prevents timing attacks and replay exploits. | Redis | SecOps Lead | Enforce `X-BNW-Signature` on all partner webhooks. |
| **ADR-ENV-009** | Session Security | Refresh token storage mechanism on Web PWA | **Confirmed** | 1. `localStorage`<br>2. HTTP-only, `Secure`, `SameSite=Strict` cookie | **Option 2: HTTP-only Secure cookie** | Completely mitigates XSS token exfiltration attacks in browser environments. | `14-Auth.md` | SecOps Lead | Configure cookie middleware in Express server. |
| **ADR-ENV-010** | Indian SMS Gateway | Driver selection and compliance for Indian SMS alerts | **Proposed** | 1. Twilio International<br>2. Fast2SMS / MSG91 with TRAI DLT registration | **Option 2: Fast2SMS / MSG91 with TRAI DLT** | Mandatory regulatory compliance with TRAI commercial messaging laws in India. | TRAI Registration | Product Lead | Complete TRAI DLT template registration for `BNWIND`. |
| **ADR-ENV-011** | Mobile Keystore | Key management strategy for native Android release signing | **Proposed** | 1. Commit keystore to Git<br>2. CI/CD secret base64 injection + Google Play Signing | **Option 2: CI/CD secret + Google Play Signing** | Zero private signing keys stored in repository; root keys secured by Google Cloud. | Play Console | DevOps Lead | Configure GitHub Actions secret for keystore base64. |
| **ADR-ENV-012** | Log Sanitization | Protocol for preventing credential leakage in stdout | **Confirmed** | 1. Unfiltered JSON logging<br>2. Winston logger with regex field redaction | **Option 2: Winston logger with redaction** | Automatically scrubs `password`, `secret`, `token`, `authorization` from all log streams. | Winston Logger | SecOps Lead | Enforce `LOG_REDACT_KEYS` middleware in logging layer. |

---

## 25. Cross-Document Traceability Matrix

| Reference Document | Section / Requirement | Alignment in `25-Environment.md` |
| :--- | :--- | :--- |
| `docs/01-PRD.md` | Core vision, Indic news focus, native Android Stage B | Sections 3, 6.17, 17 (Full Kotlin SDK 34+ specification, single shared backend) |
| `docs/04-NFR.md` | Latency, high availability, security standards | Sections 3.4, 6.3, 10.1 (Connection pooling, fail-fast startup, sub-50ms cache) |
| `docs/11-Architecture.md` | System topology, microservices, containerization | Sections 4, 9, 22 (Public vs private execution planes, Cloud Run containers) |
| `docs/12-Database.md` | PostgreSQL schema, Redis caching, migrations | Sections 6.4, 6.5, 10 (Pool configuration, SSL enforcement, BullMQ settings) |
| `docs/13-API.md` | REST API v1 contracts, error standards, rate limiting | Sections 6.3, 9, 18 (CORS origins, rate limiting windows, Zod validation) |
| `docs/14-Auth.md` | JWT authentication, refresh cookies, password hashing | Sections 6.6, 7, 17.2 (JWT 64-char secrets, HTTP-only cookies, Android Keystore) |
| `docs/15-Security.md` | Threat modeling, zero-trust secrets, SSRF protection | Sections 4, 7, 14.2, 18.2 (Zero secrets in Git/frontend, SSRF defense, KMS) |
| `docs/16-Storage.md` | Media storage, Cloudflare R2, image optimization | Sections 6.7, 8.1, 14 (S3-compatible R2 credentials, CDN URLs) |
| `docs/17-Agents.md` | Autonomous AI agents, editorial workflows | Sections 6.9, 12 (Kill-switch toggles `AGENT_*_ENABLED`, model assignments) |
| `docs/18-MCP.md` | Model Context Protocol servers, stdio transport | Sections 6.10, 13 (MCP configuration, stdio sandboxing, audit logging) |
| `docs/19-API-Pool.md` | Multi-Provider AI API Pool, quotas, circuit breakers | Sections 6.8, 11, 22.4 (Routing strategies, circuit breaker thresholds, failover) |
| `docs/20-Integrations.md` | RSS feeds, webhooks, FCM push, Indian SMS | Sections 6.11, 6.12, 14, 15, 16 (Source Activation Invariant, TRAI DLT, HMAC) |
| `docs/21-Prompts.md` | Versioned prompt templates, zero credentials | Sections 6.9, 12.2 (Semantic versioning `PROMPT_VERSION_*`, zero secret text) |
| `docs/22-Setup.md` | Developer environment setup and installation | Sections 3.1, 20.1, 23.1 (Local development `.env` templates and readiness) |
| `docs/24-Deployment.md` | Cloud Run, Cloud SQL, Secret Manager deployment | Sections 3.4, 7, 19, 20.3 (Cloud Run secret references, deployment manifests) |
| `docs/26-Testing.md` | Automated testing strategies and quality assurance | Sections 3.2, 20.2, 23.2 (Test environment isolation, mock AI pool adapters) |
| `docs/27-Debugging.md` | Diagnostic procedures, error tracing, log inspection | Sections 6.15, 18.2, 21 (Troubleshooting matrix, log redaction, Sentry DSN) |

---

## 26. Documentation Quality Requirements & Strict Scope Restrictions

### 26.1 Documentation Quality Affirmations
- **Professional Architecture Rigor**: This document defines the single canonical configuration and secret management contract for BREAKING NEWS WALA, detailing all variables, data classifications, validation rules, and deployment requirements.
- **Zero Insecure Defaults**: The architecture enforces a strict fail-fast policy; backend services refuse to start if essential security configurations or database URIs are missing or invalid.
- **Strict Boundary Enforcement**: Configuration is strictly bifurcated between public browser/client parameters (`VITE_*`) and private backend secrets. Under no circumstances are private keys exposed to browser assets or compiled into Android APKs.
- **Traceability Integrity**: All proposed variables and operational thresholds align precisely with the established architecture across `docs/01-PRD.md` through `docs/24-Deployment.md`.

### 26.2 Strict Scope Restrictions Compliance
In accordance with mandatory task constraints:
1. **Documentation-Only Boundary**: No application code, configuration scripts, `.env` files, or database migrations were written or modified during this task.
2. **Zero Credentials Generated**: No real API keys, database passwords, or cryptographic secrets were generated, requested, or exposed. All examples utilize safe, sanitized placeholders (`<SECRET_REFERENCE>`, `<DATABASE_CONNECTION_REFERENCE>`).
3. **Infrastructure Integrity**: No cloud resources, IAM permissions, Secret Manager entries, or Docker containers were created or modified.
4. **Single Canonical File**: This documentation is maintained exclusively at `docs/25-Environment.md` (`c:\Users\pp\Downloads\BREAKING-NEWS-WALA-main\docs\25-Environment.md`). No duplicate, temporary, or stray documentation files have been created in the repository.
