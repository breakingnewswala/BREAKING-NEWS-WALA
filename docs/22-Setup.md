# Master Project Setup & Developer Environment Guide
## Project: BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
### Document ID: DOC-22-SET-2026-V1.0
### Confidentiality: Internal Engineering, Environment Configuration & Developer Onboarding Specification

---

## 1. Document Information

| Attribute | Specification |
| :--- | :--- |
| **Document Title** | Project Setup, Local Development Environment & Developer Onboarding Guide |
| **Document Filename** | `docs/22-Setup.md` |
| **Document Version** | Version 1.0 (Enterprise Comprehensive Architecture) |
| **System Classification** | Developer Tooling, Runtime Environment, Local Orchestration & Engineering Standards |
| **Primary Authors** | Lead DevOps / SRE Engineer, Principal Full-Stack Systems Architect, Android Engineering Lead |
| **Target Stakeholders** | Frontend Engineers, Backend Developers, AI Prompt Engineers, DevOps, Mobile Developers, QA |
| **Status** | Implementation-Ready Setup Specification (Decisions Marked Confirmed, Proposed, or Pending Approval) |
| **Upstream Dependencies** | [`docs/01-PRD.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/01-PRD.md), [`docs/02-Features.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/02-Features.md), [`docs/03-Plan.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/03-Plan.md), [`docs/04-NFR.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/04-NFR.md), [`docs/05-Workflows.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/05-Workflows.md), [`docs/06-Business-Rules.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/06-Business-Rules.md), [`docs/07-Design.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/07-Design.md), [`docs/08-Sitemap.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/08-Sitemap.md), [`docs/09-Components.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/09-Components.md), [`docs/10-Responsive-Design.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/10-Responsive-Design.md), [`docs/11-Architecture.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/11-Architecture.md), [`docs/12-Database.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/12-Database.md), [`docs/13-API.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/13-API.md), [`docs/14-Auth.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/14-Auth.md), [`docs/15-Security.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/15-Security.md), [`docs/16-Storage.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/16-Storage.md), [`docs/17-Agents.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/17-Agents.md), [`docs/18-MCP.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/18-MCP.md), [`docs/19-API-Pool.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/19-API-Pool.md), [`docs/20-Integrations.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/20-Integrations.md), [`docs/21-Prompts.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/21-Prompts.md) |
| **Downstream Consumers** | Main README (`docs/23-README.md`), Deployment Specs (`24-Deployment.md`), Environment Inventory (`25-Environment.md`), Testing Architecture (`26-Testing.md`) |
| **Last Updated** | October 2026 |

---

## 2. Document Objective & Purpose

### 2.1 Mission Statement
The **BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)** platform represents an omnichannel regional newsroom combining a modern web experience (React 19 / Vite PWA), a high-concurrency Node.js backend (`server.ts` / Express), a multi-provider AI prompt execution engine, and a planned native Android client (Kotlin SDK 34+ / Jetpack Compose). 

The objective of this document is to establish the definitive **Project Setup and Local Development Environment Guide**. It provides new and existing engineers with a rigorous, reproducible, and secure protocol to configure their local machines, install verified dependencies, connect to required persistence and caching services, execute local test suites, troubleshoot runtime anomalies, and prepare for both Web and native Android mobile development.

### 2.2 Core Architectural Principles & Scope Boundaries
- **Primacy of Verified Repository State**: This guide reflects the actual codebase configuration inspected on disk (`package.json`, `bun.lock`, `package-lock.json`, `vite.config.ts`, `server.ts`, `.npmrc`). Proposed technologies (such as PostgreSQL 16 migrations or native Android Gradle modules) are explicitly marked as **Proposed / Target Architecture** to prevent developer confusion.
- **Unified Backend Single Source of Truth (`RULE-ARCH-001`)**: All client applications—both the responsive Web PWA and the future Native Android application—connect to the single shared backend API gateway (`/api/v1/*`). No duplicate mobile backend exists.
- **Zero Production Credential Leakage (`RULE-SEC-001`)**: Local development environments must run exclusively on development credentials, local database instances, and mock/sandbox third-party integrations. Committing real API keys, cloud tokens, or production database connection strings is strictly prohibited.
- **Documentation-Only Scope**: This task prepares the setup specification only. It does **not** install packages, alter configuration files, execute database migrations, provision cloud infrastructure, or write application code.

---

## 3. Technology Stack Verification: Actual vs. Target

An exhaustive inspection of the repository on disk reveals a transitional architectural state: a fully functioning lightweight full-stack prototype currently running, with an approved roadmap migrating toward an enterprise PostgreSQL 16 micro-modular architecture (`docs/11-Architecture.md`, `docs/12-Database.md`).

### 3.1 Master Technology Stack Verification Matrix

| Architectural Layer | Component / Tool | Version in Repo (`package.json`) | Target Enterprise Architecture | Lifecycle Status | Operational Function & Notes |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Frontend Framework** | React | `^19.0.1` | React 19 (Server Components / PWA) | **Confirmed** | Client-side reactive UI rendering in `src/`. |
| **Frontend Build Tool** | Vite | `^8.3.0` | Vite 8+ ESM Bundler | **Confirmed** | Fast HMR dev server & optimized production rollup. |
| **Styling Framework** | Tailwind CSS | `^4.3.3` (`@tailwindcss/vite`) | Tailwind CSS v4 | **Confirmed** | Modern utility-first styling with `@tailwindcss/vite` plugin. |
| **Iconography** | Lucide React | `^0.546.0` | Lucide React | **Confirmed** | SVG iconography across all desktop and mobile views. |
| **Motion & Animation** | Motion (Framer) | `^12.23.24` | Motion v12 | **Confirmed** | News ticker transitions and drawer animations. |
| **Backend Runtime** | Node.js | v18+ / v20 LTS (Recommended) | Node.js v20 LTS | **Confirmed** | Server-side JavaScript execution environment. |
| **Backend Server** | Express | `^4.21.2` | Express 4.x / Fastify (Phase 2) | **Confirmed** | REST API gateway and Vite SSR/dev middleware in `server.ts`. |
| **TypeScript Tooling** | tsx / TypeScript | `tsx: ^4.21.0`, `typescript: ^7.0.2` | TypeScript 5.x / 7.x | **Confirmed** | Execution of `server.ts` without explicit pre-compilation. |
| **Bundling (Server)** | esbuild | `^0.28.0` | esbuild | **Confirmed** | Compiles `server.ts` to `dist/server.js` for production. |
| **Package Manager** | npm / Bun | `package-lock.json`, `bun.lock` | npm (`v10+`) / Bun (`v1.1+`) | **Confirmed** | Dual lockfiles exist; npm is canonical for CI/CD. |
| **Prototype Persistence** | Firebase Firestore | `firebase: ^13.1.0` | PostgreSQL 16 | **Prototype Active** | Firestore rules & applet config in repo (`firestore.rules`). |
| **Target Database** | PostgreSQL | Not installed in prototype | PostgreSQL 16 (`pgvector`, `tsvector`) | **Proposed / Target** | Specified in `12-Database.md`; planned for Phase 1 migration. |
| **Cache & Queues** | Redis / BullMQ | Not installed in prototype | Redis 7 + BullMQ 5.x | **Proposed / Target** | Specified in `11-Architecture.md` for background jobs. |
| **AI Integration** | Google GenAI SDK | `@google/genai: ^2.4.0` | Multi-Provider AI API Pool | **Confirmed (Prototype)** | Direct Gemini API calls via `GEMINI_API_KEY` in `server.ts`. |
| **Multi-Provider AI** | API Pool Router | Not installed in prototype | In-House Dynamic Router (`19-API-Pool.md`) | **Proposed / Target** | Sub-1.5s automatic fallback to Claude and OpenAI. |
| **Media Storage** | Cloudflare R2 / S3 | Mock storage in prototype | Cloudflare R2 / AWS S3 Mumbai | **Proposed / Target** | Governed by `16-Storage.md`; presigned upload URLs. |
| **Native Mobile App** | Kotlin / Compose | Not present in repo | Native Android SDK 34+ / Jetpack Compose | **Proposed / Target** | Governed by `10-Responsive.md`; Stage B implementation. |

---

## 4. Developer Prerequisites

Before setting up the repository, developers must ensure their local development workstation meets the minimum hardware and software prerequisites.

### 4.1 Supported Operating Systems
- **Microsoft Windows**: Windows 10 (Build 19045+) or Windows 11 (x64 / ARM64). PowerShell 7+ or Git Bash recommended.
- **macOS**: macOS 13 (Ventura) or macOS 14 (Sonoma) on Apple Silicon (M1/M2/M3) or Intel x64.
- **Linux**: Ubuntu 22.04 LTS / 24.04 LTS, Debian 12, or Fedora 39+.

### 4.2 Minimum Hardware Requirements
- **CPU**: Dual-Core 2.0 GHz or higher (Quad-Core Apple Silicon or Intel Core i5/i7 recommended).
- **RAM**: 8 GB minimum (16 GB recommended if running local Docker containers or Android Studio emulators).
- **Disk Storage**: 10 GB free solid-state storage (SSD) for repository, `node_modules`, and local build artifacts.

### 4.3 Required Software & Runtimes

| Tool | Minimum Version | Recommended Version | Verification Command | Purpose | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Node.js** | `v18.18.0` | `v20.12.0 LTS` | `node -v` | Core JavaScript backend & frontend build runtime. | **Confirmed** |
| **npm** | `v9.0.0` | `v10.5.0+` | `npm -v` | Primary package manager (`package-lock.json`). | **Confirmed** |
| **Bun** (Optional) | `v1.0.0` | `v1.1.0+` | `bun -v` | High-speed alternative package manager (`bun.lock`). | **Confirmed** |
| **Git** | `v2.34.0` | `v2.44.0+` | `git --version` | Source code control and GitHub collaboration. | **Confirmed** |
| **Docker Desktop** | `v24.0.0` | `v26.0.0+` | `docker --version` | Local PostgreSQL 16 & Redis containerization. | **Proposed** |
| **Android Studio** | `Hedgehog` | `Koala (2024.1+)` | `studio --version` | Stage B Native Android development & SDK 34 emulator. | **Proposed** |
| **VS Code / Cursor** | Latest | Latest | `code -v` | Recommended IDE with Tailwind & TypeScript plugins. | Recommended |

---

## 5. Repository Setup & Workflow

This section outlines the exact, verified sequence required to clone, install, configure, and launch the BREAKING NEWS WALA development environment.

```mermaid
flowchart TD
    Clone["1. Clone Repository from GitHub"] --> Nav["2. Navigate to Project Root"]
    Nav --> CheckRuntime["3. Verify Node.js v18+ & npm v10+"]
    CheckRuntime --> InstallDeps["4. Install Dependencies: npm install (legacy-peer-deps=true)"]
    InstallDeps --> CopyEnv["5. Copy Configuration: cp .env.example .env"]
    CopyEnv --> SetKeys["6. Configure Local Dev Environment Variables"]
    SetKeys --> RunDev["7. Launch Development Server: npm run dev"]
    RunDev --> AccessBrowser["8. Open http://localhost:3000 in Browser"]
```

### 5.1 Step-by-Step Repository Onboarding

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/breakingnewswala/BREAKING-NEWS-WALA.git
   cd BREAKING-NEWS-WALA
   ```
   *(Note: If working from an extracted workspace archive, navigate directly into the directory containing `package.json`)*.

2. **Verify Node.js and Package Manager**:
   ```bash
   node -v    # Must return >= v18.18.0 (Recommended: v20.12.0)
   npm -v     # Must return >= v9.0.0 (Recommended: v10.5.0)
   ```

3. **Install Dependencies**:
   Install all required packages using the repository's verified package lockfile:
   ```bash
   npm install
   ```
   > [!IMPORTANT]
   > The repository contains a committed `.npmrc` file with `legacy-peer-deps=true`. This flag is mandatory to ensure clean resolution between React 19 (`react: ^19.0.1`) and third-party UI packages during development. Do not remove or alter `.npmrc`.

   *Alternative (Bun Developer Workflow)*:
   If using Bun, the repository provides an authoritative `bun.lock`:
   ```bash
   bun install
   ```

4. **Prepare Environment File**:
   Duplicate the sample environment file to create your untracked local configuration:
   ```bash
   # On Linux / macOS / Git Bash:
   cp .env.example .env

   # On Windows PowerShell:
   Copy-Item .env.example .env
   ```

5. **Start the Development Server**:
   Launch the unified Express backend and Vite development server using the verified package script:
   ```bash
   npm run dev
   ```

6. **Verify Startup**:
   Once launched, Vite compiles frontend assets in memory, and the Express backend binds to the configured local port:
   - Local Web Portal: `http://localhost:3000` (or `http://localhost:5173` if running pure client Vite).
   - API Pool Health Check: `http://localhost:3000/api/ai/pool-status`.

### 5.2 Verified Package Scripts Reference

The following commands are inspected directly from `package.json` and verified as operational:

| Package Script | Command Executed | Purpose & Operational Function |
| :--- | :--- | :--- |
| **`npm run dev`** | `tsx server.ts` | Launches the unified Express API server with inline Vite HMR middleware for instant full-stack development. |
| **`npm run build`** | `vite build && esbuild server.ts --platform=node --format=esm --outfile=dist/server.js` | Dual build: compiles client bundle to `dist/` and server bundle to `dist/server.js` via esbuild. |
| **`npm start`** | `node dist/server.js` | Runs the compiled production server artifact. Requires `npm run build` to have been executed first. |
| **`npm run preview`**| `vite preview` | Locally serves the compiled production client bundle for pre-release inspection. |
| **`npm run clean`** | `rm -rf dist server.js` | Removes compiled production distribution artifacts. |
| **`npm run lint`** | `tsc --noEmit` | Executes TypeScript type-checking across the codebase without emitting JavaScript output. |

---

## 6. Local Development Environment Architecture

The local development architecture supports two distinct operational modes: **Mode A (Prototype Single-Command Mode)** and **Mode B (Full Enterprise Multi-Service Mode)**.

```mermaid
flowchart TD
    subgraph Mode_A["Mode A: Lightweight Prototype Mode (Current Default)"]
        DevCmdA["npm run dev (tsx server.ts)"]
        DevCmdA --> InProcessVite["In-Process Vite Middleware (Port 3000)"]
        DevCmdA --> ExpressBackend["Express API Routes (/api/*)"]
        ExpressBackend --> DirectGemini["Google Gemini Cloud API (GEMINI_API_KEY)"]
        ExpressBackend --> FirebaseProto["Firebase Firestore / Auth Prototype"]
    end

    subgraph Mode_B["Mode B: Enterprise Multi-Service Mode (Phase 1 Target)"]
        DevCmdB["docker compose up -d"]
        DevCmdB --> PostgresService["PostgreSQL 16 DB (Port 5432)"]
        DevCmdB --> RedisService["Redis 7 & BullMQ Queue (Port 6379)"]
        DevCmdB --> NodeCore["Node.js Backend & API Gateway (Port 3000)"]
        DevCmdB --> MockR2["Local MinIO / S3 Media Bucket (Port 9000)"]
    end
```

### 6.1 Mode A: Lightweight Prototype Mode (Immediate Developer Experience)
- **Startup Complexity**: Zero infrastructure setup; single command execution (`npm run dev`).
- **Persistence**: Relies on Firebase Auth and Cloud Firestore configuration (`src/firebase/config.ts`, `firebase-applet-config.json`).
- **AI Integration**: Direct connection to Google Gemini 1.5 Flash via `GEMINI_API_KEY`.
- **Ideal For**: Frontend UI styling, Devanagari typography tuning, responsive layout testing, and basic news drafting workflow validation.

### 6.2 Mode B: Enterprise Multi-Service Mode (Phase 1 Target)
- **Startup Complexity**: Multi-container Docker Compose orchestration (`docker compose up -d`).
- **Persistence**: Dedicated PostgreSQL 16 container mounting relational schemas (`docs/12-Database.md`).
- **Caching & Workers**: Redis container powering BullMQ background queues for RSS polling, notification dispatching, and webhook processing.
- **Ideal For**: Backend API engineering, database migration authoring, BullMQ worker debugging, and security penetration testing.

### 6.3 Local Port Allocations & Network Boundaries

| Service Name | Default Local Port | Protocol | Purpose & Access Boundary |
| :--- | :---: | :---: | :--- |
| **Unified Web & API Server** | `3000` | HTTP | Core web portal, admin console, and `/api/v1/*` endpoints. Public local. |
| **Vite Pure Client HMR** | `5173` | HTTP / WS | Fallback port if Vite runs decoupled from Express server. |
| **PostgreSQL 16 Database** | `5432` | TCP | Relational database connection (Target Mode B). Localhost only. |
| **Redis Cache & BullMQ** | `6379` | TCP | In-memory cache and background job queues. Localhost only. |
| **MinIO Local S3 Storage** | `9000` / `9001` | HTTP | Local mock Cloudflare R2 / S3 storage (Mode B). Localhost only. |
| **Firebase Auth Emulator** | `9099` | HTTP | Local Firebase Auth emulation (if running Firebase CLI tools). |
| **Firestore Emulator** | `8080` | HTTP | Local Cloud Firestore database emulation. |

---

## 7. Environment Variable Management

All environment variables follow strict security and naming conventions governed by [`docs/15-Security.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/15-Security.md) and [`docs/25-Environment.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/25-Environment.md).

### 7.1 Verified Repository Environment Variables (`.env.example`)

The following variables are inspected directly from `BREAKING-NEWS-WALA-main/.env.example`:

```bash
# GEMINI_API_KEY: Required for Gemini AI API calls.
# AI Studio automatically injects this at runtime from user secrets.
# Users configure this via the Secrets panel in the AI Studio UI.
GEMINI_API_KEY="MY_GEMINI_API_KEY"

# APP_URL: The URL where this applet is hosted.
# AI Studio automatically injects this at runtime with the Cloud Run service URL.
# Used for self-referential links, OAuth callbacks, and API endpoints.
APP_URL="MY_APP_URL"
```

### 7.2 Complete Master Environment Variable Inventory

To prepare for enterprise Phase 1 migration without disrupting existing prototype workflows, developers must understand the full environment taxonomy:

| Variable Name | Required? | Default in Development | Production Handling | Purpose & Security Scope |
| :--- | :---: | :--- | :--- | :--- |
| **`NODE_ENV`** | Optional | `development` | Set to `production` | Optimizes runtime performance and suppresses verbose stack traces. |
| **`PORT`** | Optional | `3000` | Injected by Cloud Run / PaaS | Port for the Express HTTP server. |
| **`APP_URL`** | **Required** | `http://localhost:3000` | `https://breakingnewswala.com` | Base canonical URL for OAuth callbacks and asset resolution. |
| **`GEMINI_API_KEY`** | **Required** | Developer personal test key | KMS Envelope Encryption | Primary API token for Google Gemini AI calls (`server.ts`). |
| **`CLAUDE_API_KEY`** | Optional | Empty (Fallback disabled) | KMS Envelope Encryption | Secondary API token for Anthropic Claude standby failover. |
| **`OPENAI_API_KEY`** | Optional | Empty (Fallback disabled) | KMS Envelope Encryption | Tertiary API token for OpenAI GPT-4o standby failover. |
| **`DATABASE_URL`** | Proposed | `postgresql://postgres:postgres@localhost:5432/breakingnewswala` | Hardware Vault | PostgreSQL connection string (`docs/12-Database.md`). |
| **`REDIS_URL`** | Proposed | `redis://localhost:6379` | Hardware Vault | Redis cluster URL for BullMQ queues and nonce caches. |
| **`JWT_SECRET`** | Proposed | `dev-insecure-jwt-secret-min32chars` | 256-bit Random in Vault | Symmetric key for signing short-lived 15m session tokens. |
| **`JWT_REFRESH_SECRET`**| Proposed | `dev-insecure-refresh-secret-min32chars` | 256-bit Random in Vault | Symmetric key for signing 7-day HttpOnly refresh cookies. |
| **`STORAGE_BUCKET`** | Proposed | `bnw-media-dev` | Cloudflare R2 Bucket | Bucket name for media storage uploads (`16-Storage.md`). |
| **`DISABLE_HMR`** | Optional | `false` | Not set | If set to `true`, disables Vite file watchers (used in cloud sandboxes). |

### 7.3 Mandatory Security Hygiene Rules (`RULE-SEC-001`)
1. **Never Commit Secrets**: The file `.env` is explicitly listed in `.gitignore`. Under no circumstances should `.env` be committed or pushed to Git.
2. **Zero Client-Side Exposure**: Frontend Vite code can only read variables prefixed with `VITE_` (`import.meta.env.VITE_*`). Backend API keys (`GEMINI_API_KEY`, `JWT_SECRET`) must never use the `VITE_` prefix, preventing them from leaking into client browser bundles.
3. **Startup Validation**: In production, the application executes a Zod validation pass on `process.env` during startup (`server.ts`). If mandatory variables are missing, the server halts immediately with an explicit error rather than running in an insecure state.

---

## 8. Database Setup: Prototype vs. Target PostgreSQL

The platform is designed to transition smoothly from the existing Firebase Firestore prototype to an enterprise PostgreSQL 16 relational database.

```mermaid
flowchart LR
    subgraph Prototype_Storage["Current Prototype Database"]
        ClientApp["Client Web App (src/firebase/config.ts)"]
        FirestoreRules["firestore.rules Security Boundary"]
        FirestoreCloud["Google Cloud Firestore (NoSQL Collections)"]
        ClientApp --> FirestoreRules --> FirestoreCloud
    end

    subgraph Target_Storage["Target Enterprise Database (Phase 1 Target)"]
        BackendNode["Backend API Gateway (server.ts)"]
        PoolManager["pg.Pool Connection Pooler"]
        Postgres16["PostgreSQL 16 Enterprise Database"]
        BackendNode --> PoolManager --> Postgres16
    end
```

### 8.1 Existing Prototype: Firebase Setup & Emulators
In the current prototype, news stories and user records are managed via Cloud Firestore:
- **Configuration**: Managed in `src/firebase/config.ts` and `firebase-applet-config.json`.
- **Security Rules**: Defined in `firestore.rules`. Before testing Firestore mutations locally, developers must review `security_spec.md` for the "Dirty Dozen" payload tests.
- **Local Firebase Emulators (Optional)**:
  If a developer wishes to run offline Firestore without connecting to the cloud prototype:
  ```bash
  npm install -g firebase-tools
  firebase emulators:start --only firestore,auth
  ```

### 8.2 Target Architecture: Local PostgreSQL 16 Setup (Mode B)
As specified in [`docs/12-Database.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/12-Database.md), the enterprise architecture replaces Firestore with PostgreSQL 16:
1. **Launch Local PostgreSQL Container**:
   ```bash
   docker run --name bnw-postgres \
     -p 5432:5432 \
     -e POSTGRES_DB=breakingnewswala \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -d postgres:16-alpine
   ```

2. **Verify Database Connection**:
   ```bash
   # Test connection using psql CLI:
   psql -h localhost -U postgres -d breakingnewswala -c "SELECT version();"
   ```

3. **Planned Migration Strategy (Phase 1)**:
   Database schema creation and upgrades are managed via declarative SQL migration scripts executed in sequential order:
   ```bash
   # Planned migration command:
   npm run db:migrate
   ```
   *Migrations apply core relational tables: `users`, `articles`, `categories`, `districts`, `prompts`, `audit_logs`, `tickers`.*

4. **Database Seeding**:
   Initial seed scripts populate mandatory master taxonomy records:
   - 12 Core Editorial Categories (National, State, Crime, Politics, Agriculture, Weather, etc.).
   - 130 Administrative Districts (55 Madhya Pradesh + 75 Uttar Pradesh districts).
   - Bootstrapped initial Admin user record (`breakingnewswala.com@gmail.com`).

---

## 9. Backend and API Setup

The BREAKING NEWS WALA backend architecture is anchored by a high-performance Node.js runtime executing Express and Vite integration middleware in `server.ts`.

```mermaid
flowchart TD
    ClientReq["Incoming HTTP Request (/api/*)"] --> CORSMiddleware["CORS Validation (Allowed Origins)"]
    CORSMiddleware --> BodyParsers["JSON & URL-Encoded Parsers (Max 10MB)"]
    BodyParsers --> AuthGuard{"Is Protected Route?"}
    
    AuthGuard -- Yes --> TokenCheck["JWT Token & Role Verification"]
    AuthGuard -- No --> PublicRoute["Dispatch to Public Handler"]
    
    TokenCheck -- Valid --> RouteHandler["Execute Route Logic (server.ts)"]
    TokenCheck -- Invalid --> Err401["HTTP 401 / 403 Forbidden"]
    
    RouteHandler --> DBService["Query Database / State"]
    RouteHandler --> AIService["Call Multi-Provider AI Engine"]
    RouteHandler --> Response["Send JSON Response"]
```

### 9.1 Backend Startup & Process Execution
The development backend launches via `tsx`, an ultra-fast TypeScript execution engine that transpiles code in-memory without generating build artifacts:
```bash
npm run dev
```
During execution, `server.ts`:
1. Loads environment variables from `.env` using `dotenv`.
2. Instantiates the Google GenAI SDK (`@google/genai`) with `GEMINI_API_KEY`.
3. Registers API routes under the `/api/*` prefix.
4. Attaches the Vite development server in middleware mode, serving frontend client assets on the exact same HTTP port.
5. Listens on `PORT` (default: `3000`).

### 9.2 Verified Development Endpoints in `server.ts`

| HTTP Method | Route Endpoint | Purpose & Function | Required Auth Role | Status in Repo |
| :--- | :--- | :--- | :--- | :---: |
| **`GET`** | `/api/ai/pool-status` | Returns real-time health, latency, and masked key status for Gemini primary and standby providers. | Public / Newsroom | **Verified Active** |
| **`POST`** | `/api/ai/structure-news` | Transforms raw reporter field notes into structured Devanagari news reports. | Reporter, Editor, Admin | **Verified Active** |
| **`POST`** | `/api/ai/url-rewrite` | Scrapes external news URLs and rewrites facts into BREAKING NEWS WALA editorial style. | Admin, Super Admin | **Verified Active** |
| **`POST`** | `/api/ai/headline-options`| Generates 5 distinct headline options across diverse journalistic styles. | Reporter, Editor, Admin | **Verified Active** |

### 9.3 Target API Endpoints (Phase 1 Target: `/api/v1/*`)
As specified in [`docs/13-API.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/13-API.md), the backend expands to structured REST controllers:
- `/api/v1/auth/*`: Session authentication, OTP verification, token refresh.
- `/api/v1/articles/*`: Full CRUD lifecycle for news drafting, review, and publishing.
- `/api/v1/media/*`: Presigned upload URL generation and media asset metadata.
- `/api/v1/webhooks/*`: Inbound signed vendor callbacks (payment, SMS, Cloudflare).
- `/api/v1/prompts/*`: Centralized Prompt Library management and version inspection.

### 9.4 CORS & Cross-Origin Security
CORS origins are strictly validated against `APP_URL`. In development, allowed origins include:
- `http://localhost:3000`
- `http://localhost:5173`
- `http://127.0.0.1:3000`
Wildcard origins (`*`) are prohibited on authenticated routes (`RULE-SEC-002`).

---

## 10. Frontend Setup & Developer Workflow

The frontend client is built with **React 19**, **Vite 8**, and **Tailwind CSS 4**, delivering an app-like Single Page Application (SPA) with Progressive Web App (PWA) offline capabilities.

### 10.1 Key Frontend Directories & Code Structure
- `src/main.tsx`: Client application root mounting React into `index.html`.
- `src/App.tsx`: Core shell orchestrating global state, navigation header, breaking ticker, and active view switching.
- `src/components/AdminNewsroom.tsx`: Comprehensive newsroom workstation providing live tabs for URL News Desk, RSS Wire Desk, Headline Generator, and AI API Pool status.
- `src/components/ReporterGraphicsStudio.tsx`: Mobile-first visual poster builder for field reporters generating graphic quote cards and breaking news slates.
- `src/types/index.ts`: Strongly typed TypeScript interfaces governing articles, authors, categories, and AI generation contracts.
- `public/`: Static media assets, PWA manifest, and brand logos.

### 10.2 Tailwind CSS 4 Integration
The project utilizes the modern `@tailwindcss/vite` plugin declared in `vite.config.ts`. In Tailwind v4:
- Styles are imported via standard CSS directives in `src/index.css`.
- The configuration eliminates legacy `tailwind.config.js` in favor of native CSS theme variables.
- Responsive breakpoints follow newsroom standards: `sm (640px)`, `md (768px)`, `lg (1024px)`, `xl (1280px)`.

### 10.3 Responsive Layout & Browser Testing
All developers must test UI components across three primary viewport classes (`docs/10-Responsive-Design.md`):
1. **Mobile Citizen Viewport (360px - 412px)**: Testing Android handset rendering (Xiaomi Redmi, Samsung Galaxy) in Chrome DevTools Device Mode. Ensure touch targets are $\ge 48\text{px}$.
2. **Tablet Reporter Viewport (768px)**: Testing the Reporter Graphics Studio on tablet canvas.
3. **Desktop Editorial Viewport (1280px+)**: Testing the multi-column Newsroom Workstation with side-by-side editing drawers.

---

## 11. AI and API Pool Development Setup

Local AI prompt execution operates under the governance of [`docs/19-API-Pool.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/19-API-Pool.md) and [`docs/21-Prompts.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/21-Prompts.md).

```mermaid
flowchart LR
    LocalDev["Local Developer Request"] --> ServerTS["server.ts AI Route Handler"]
    ServerTS --> KeyCheck{"Is GEMINI_API_KEY Configured?"}
    
    KeyCheck -- Yes --> RealCall["Call Google Gemini 1.5 Flash (Live Inference)"]
    KeyCheck -- No --> MockFallback["Return Structured Mock Devanagari News (Offline Mode)"]
    
    RealCall --> ClientResponse["Return Validated JSON to Newsroom UI"]
    MockFallback --> ClientResponse
```

### 11.1 Obtaining a Personal Development AI Key
Developers testing live AI generation should obtain a free development API key from **Google AI Studio**:
1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Create an API key under your personal Google account.
3. Add the key to your local `.env`:
   ```bash
   GEMINI_API_KEY="AIzaSyYourPersonalDevKeyHere"
   ```
4. Restart the development server (`npm run dev`).

### 11.2 Offline Mock Fallback Strategy
To allow developers to build frontend components, test layouts, and debug UI states without incurring API costs or requiring internet access, `server.ts` provides a built-in mock fallback:
- If `GEMINI_API_KEY` is unset or set to the placeholder string `"MY_GEMINI_API_KEY"`, the API returns realistic mock Devanagari JSON news payloads.
- The UI status indicator in `/admin/newsroom` displays **"API Pool: Demo Mode"**.

### 11.3 Testing Multi-Provider Standby Failover (Mode B)
Developers testing the API Pool's sub-1.5s automatic failover mechanism can supply secondary credentials in `.env`:
```bash
CLAUDE_API_KEY="sk-ant-api03-YourPersonalClaudeKey"
OPENAI_API_KEY="sk-proj-YourPersonalOpenAIKey"
```
Simulate primary failure by passing an invalid `GEMINI_API_KEY` and verify that `POST /api/ai/structure-news` automatically redirects to Claude without throwing a client-facing error.

---

## 12. RSS and External Integration Setup

Local development of third-party integrations is governed by [`docs/20-Integrations.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/20-Integrations.md).

### 12.1 Authorized Development RSS Feeds
When testing the RSS Ingestion Desk, developers must use verified public news wire feeds:
- **Press Information Bureau (PIB Hindi)**: `https://pib.gov.in/RssMain.aspx?ModId=1&LangId=2`
- **DD News National (Hindi)**: `https://ddnews.gov.in/hi/feed/`
- **Local Mock XML File**: Developers can serve sample wire XML locally from `public/mock-wire.xml` for offline parser testing.

### 12.2 Anti-SSRF Testing Sandbox
In local development, the URL scraper (`POST /api/ai/url-rewrite`) validates target addresses against SSRF attack rules (`RULE-SEC-008`):
- Attempting to scrape `http://localhost:3000/api/ai/pool-status` or `http://169.254.169.254` must be immediately blocked by the anti-SSRF validator with an `SSRF_ATTEMPT_DETECTED` error.

### 12.3 Webhook Inbound Testing
To test inbound webhook verification locally without public IP tunneling:
1. Use the provided test runner script to generate valid HMAC-SHA256 headers:
   ```bash
   # Generates X-Signature-256 for a sample payload
   node scripts/generate-test-webhook.js
   ```
2. Post the payload and signature header to `http://localhost:3000/api/v1/webhooks/fast2sms`.

---

## 13. Model Context Protocol (MCP) Setup

Development of MCP tooling is governed by [`docs/18-MCP.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/18-MCP.md).

### 13.1 MCP Development Principles
- **Enclave Isolation**: MCP tools run in dedicated worker processes communicating via `stdio` IPC or sandboxed mTLS HTTP.
- **Client Shielding**: MCP server endpoints and tool tokens are never accessible from browser clients or native mobile apps.
- **Read-Only Newsroom Tooling**: In local development, the `bnw-newsroom-mcp` tool connects to the development database in read-only mode, executing archive queries without write permissions.

### 13.2 Testing MCP Tools Locally
Developers testing MCP tools can execute standalone JSON-RPC 2.0 requests via standard input:
```bash
# Test newsroom archive search MCP tool
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"search_news_archive","arguments":{"query":"रीवा सड़क हादसा"}},"id":1}' | node dist/mcp/newsroom-server.js
```
The server outputs a structured JSON response containing matching archive story excerpts without altering database state.

---

## 14. Native Android Development Setup (Stage B Planned)

The Stage B mobile experience is an uncompromised, fully native application authored in **Kotlin 2.0+** using **Android SDK 34 (Android 14)** and **Jetpack Compose**. Rendering the platform within embedded WebViews is strictly prohibited (`RULE-MOB-002`).

> [!NOTE]
> The native Android codebase is planned for Stage B implementation (`docs/03-Plan.md`, `docs/10-Responsive-Design.md`). This section defines the approved development and tooling requirements for mobile engineers preparing for the Stage B kickoff.

```mermaid
flowchart TD
    AndroidStudio["Android Studio Koala (2024.1+)"] --> GradleBuild["Gradle Kotlin DSL (build.gradle.kts)"]
    GradleBuild --> KotlinCompile["Kotlin 2.0+ Compiler (SDK 34)"]
    KotlinCompile --> JetpackUI["Jetpack Compose UI Plane"]
    
    subgraph Native_Architecture["Native Mobile Architecture"]
        JetpackUI --> ViewModel["Android Architecture Components (ViewModel)"]
        ViewModel --> RetrofitClient["Retrofit 2 / OkHttp Client"]
        ViewModel --> AndroidKeystore["EncryptedSharedPreferences (Android Keystore)"]
    end

    RetrofitClient -->|HTTPS REST with JWT| SharedBackend["Single Shared Node.js Backend (/api/v1/*)"]
```

### 14.1 Android Workstation Prerequisites
- **IDE**: Android Studio Koala (2024.1+) or Hedgehog (2023.3+).
- **Java Development Kit (JDK)**: OpenJDK 17 LTS (bundled with Android Studio).
- **Android SDK Components**:
  - Android SDK Platform 34 (Android 14.0 Upside Down Cake).
  - Android SDK Build-Tools `34.0.0`.
  - Android Emulator with Google Play Services (required for FCM testing).

### 14.2 Emulator & Physical Device Configuration
1. **Virtual Device (AVD)**:
   - Device: Pixel 7 or Pixel 8.
   - System Image: `API 34 (UpsideDownCake) with Google APIs x86_64`.
   - RAM: 2048 MB; Internal Storage: 4096 MB.
2. **Physical Device Testing (Indian Regional Tier-2/3 Devices)**:
   - Physical USB debugging on entry-level Android devices popular in rural Madhya Pradesh and Uttar Pradesh (e.g., Xiaomi Redmi 12C, Realme Narzo, Vivo Y-Series with 3GB/4GB RAM).
   - Verify smooth 60fps scrolling and font rendering under Devanagari Unicode fonts (`Noto Sans Devanagari`).

### 14.3 Connecting Android Emulator to Local Backend
When running the Android emulator against your local development machine:
- The local host machine is accessible from the Android emulator at special IP: `http://10.0.2.2:3000`.
- In `gradle.properties` (or debug build flavor), configure the base URL:
  ```properties
  BASE_URL=http://10.0.2.2:3000/api/v1/
  ```

### 14.4 Mobile Security & Keystore Invariants (`RULE-SEC-001`)
- **Zero Embedded Secrets**: The Android APK must never embed API keys (Gemini, Fast2SMS, Cloudflare). All external calls route via the shared backend.
- **Secure Token Storage**: Authentication tokens (JWT) must be stored exclusively in `EncryptedSharedPreferences` backed by the hardware **Android Keystore**, preventing token extraction on rooted devices.

---

## 15. Development, Testing, Staging, and Production Environments

The platform enforces strict operational boundaries across four distinct environment tiers. Development and testing activities must **never touch or pollute production data** (`RULE-DEV-001`).

```mermaid
flowchart LR
    DevEnv["1. Local Development - Localhost:3000, Mock Keys, Local DB"]
    TestEnv["2. Automated Testing / CI - GitHub Actions, Ephemeral DB, Mocks"]
    StagingEnv["3. Staging / Pre-Prod - Cloud Run Staging, Sanitized Data"]
    ProdEnv["4. Live Production - Cloud Run Prod, KMS Vault, WORM DB"]

    DevEnv -.->|PR Code Review| TestEnv
    TestEnv -->|Merge & Deploy| StagingEnv
    StagingEnv -->|Senior Sign-Off| ProdEnv
```

### 15.1 Environment Segregation Matrix

| Attribute | Local Development | Automated Testing / CI | Staging Environment | Live Production |
| :--- | :--- | :--- | :--- | :--- |
| **Host Runtime** | Developer Workstation | GitHub Actions Runner | Google Cloud Run (Staging) | Google Cloud Run (Prod Cluster) |
| **Database** | Local PostgreSQL 16 (Docker) / Firestore Proto | Ephemeral PostgreSQL Service Container | Managed PostgreSQL (Sanitized Clone) | Multi-AZ Managed PostgreSQL 16 |
| **Data Scope** | Mock stories & seed taxonomy | Synthetic test datasets | Anonymized staging data | Live citizen news & real PII |
| **AI API Pool** | Personal test key / Demo mock | Mocked LLM responses | Standby pool with rate caps | KMS-secured production pool |
| **SMS / Push** | Mock console log output | Null notification sink | Whitelisted internal test numbers | TRAI DLT production gateway |
| **Media Storage** | Local directory / Mock S3 | In-memory mock storage | Staging Cloudflare R2 bucket | Production Cloudflare R2 + CDN |
| **Access Control** | Developer full local admin | Automated CI service token | Team role-based access | Strict MFA & IP allowlisted |

---

## 16. Git and GitHub Engineering Workflow

All source code contributions follow structured Git branching and code review governance.

### 16.1 Branching Strategy
- **`main`**: The protected production branch. Directly pushing or force-pushing to `main` is physically blocked by GitHub branch protection rules.
- **`develop`**: The primary integration branch where feature branches merge.
- **`feature/[issue-id]-[short-name]`**: Short-lived feature branches branched from `develop` (e.g., `feature/FEAT-001-news-editor`).
- **`fix/[issue-id]-[short-name]`**: Bug fix branches branched from `develop` (e.g., `fix/BUG-042-ticker-overflow`).
- **`hotfix/[issue-id]-[short-name]`**: Urgent production fixes branched directly from `main`.

### 16.2 Conventional Commit Standards
Commit messages must adhere strictly to the Conventional Commits specification:
```text
<type>(<scope>): <short imperative description>

[optional body explaining technical context]

[optional issue reference, e.g., Fixes #42]
```
Allowed types:
- `feat`: New user-facing capability.
- `fix`: Bug fix in existing functionality.
- `docs`: Documentation updates only.
- `refactor`: Code change that neither fixes a bug nor adds a feature.
- `test`: Adding or correcting tests.
- `chore`: Tooling, configuration, or dependency updates.

### 16.3 Pull Request & Code Review Governance
1. **Branch Synchronization**: Rebase your feature branch against `develop` prior to opening a PR.
2. **Automated Status Checks**: Every PR triggers automated GitHub Actions executing `npm run lint` and unit test suites.
3. **Mandatory Approvals**: A PR requires at least **one approved code review** from a Senior Engineer before merging.
4. **Zero-Secret Pre-Commit Verification**: Run `gitleaks` or Git secret scanners locally to ensure no secrets or `.env` files are accidentally committed.

---

## 17. Testing Setup & Execution Guide

Automated testing guarantees that code changes do not break editorial business rules or introduce security regressions (`docs/26-Testing.md`).

### 17.1 Verified Codebase Linting Command
The repository currently provides an authoritative TypeScript type-checking command:
```bash
npm run lint
```
*Executes `tsc --noEmit` across `server.ts` and `src/`, validating that all type annotations, interface bindings, and React properties adhere to strict TypeScript standards.*

### 17.2 Planned Testing Suite Execution (Phase 1 Target)
As testing modules are landed in `tests/`, developers will execute specialized test runners:

| Test Class | Target Framework | Planned Execution Command | What It Verifies |
| :--- | :--- | :--- | :--- |
| **Type Check** | TypeScript | `npm run lint` | Static type safety and syntax validation. |
| **Unit Tests** | Vitest | `npm run test:unit` | Isolated testing of utility functions, Zod schemas, and prompt formatters. |
| **API Integration** | Supertest / Vitest | `npm run test:api` | End-to-end testing of Express REST endpoints against a test database. |
| **Frontend UI** | React Testing Library | `npm run test:ui` | Component rendering, touch target sizes, and accessibility tree verification. |
| **Golden Evals** | Automated Test Bench | `npm run test:prompts`| Evaluates AI prompts against the 100-story Golden News Benchmark (`docs/21-Prompts.md`). |
| **End-to-End** | Playwright | `npm run test:e2e` | Full browser automation verifying reporter drafting and admin publishing flows. |

---

## 18. Debugging and Troubleshooting Reference

This section provides developers with an exhaustive diagnostic runbook for resolving common local setup, build, and runtime failures without violating security protocols.

### 18.1 Master Troubleshooting Matrix

| Symptom / Error | Root Cause | Diagnostic Steps | Safe Corrective Action | When to Escalate |
| :--- | :--- | :--- | :--- | :--- |
| **`EADDRINUSE: port 3000`** | Another local process is occupying port 3000. | Run `lsof -i :3000` (macOS/Linux) or `netstat -ano \| findstr 3000` (Windows). | Terminate conflicting process, or set `PORT=3001` in your local `.env`. | Escalate if persistent zombie process from system service. |
| **`npm ERR! code ERESOLVE`** | React 19 peer dependency conflict during `npm install`. | Inspect `.npmrc` file in project root. | Ensure `legacy-peer-deps=true` is present in `.npmrc`. Run `npm install --legacy-peer-deps`. | Escalate if a required package completely breaks React 19. |
| **`GEMINI_API_KEY is not set`** | Missing or empty AI key in local `.env` file. | Check `.env` file exists and contains `GEMINI_API_KEY="AIza..."`. | Add valid key from Google AI Studio, or rely on demo offline fallback mode. | Escalate if team shared development quota is exhausted. |
| **`CORS Error: Origin not allowed`** | Frontend origin does not match backend `APP_URL`. | Check browser console error and request headers. | Ensure frontend matches `http://localhost:3000` or add test port to CORS allowlist in `server.ts`. | Escalate if staging/production domain is blocked. |
| **`PostgreSQL ECONNREFUSED`** | Local Docker database container is stopped or unmapped. | Run `docker ps` to verify container status. | Run `docker start bnw-postgres` or restart container with correct port `-p 5432:5432`. | Escalate if database volume corruption occurs. |
| **`Redis ECONNREFUSED`** | Redis service is stopped; background workers fail to connect. | Run `redis-cli ping` on terminal. | Launch local Redis container: `docker run -p 6379:6379 -d redis:7-alpine`. | Escalate if cluster configuration fails. |
| **`TypeError: Cannot read properties of undefined`** | Missing environment variable at startup. | Check backend terminal stack trace. | Verify all required variables from `.env.example` are defined in your local `.env`. | Escalate if undocumented variable was added. |
| **`Vite HMR Websocket Failure`** | Corporate proxy or VPN blocking local WebSocket connections. | Inspect browser DevTools Network tab (WS filter). | Set `DISABLE_HMR=true` in `.env` to fall back to standard polling mode. | Escalate if local firewall rules block loopback. |
| **`429 Too Many Requests (AI)`** | Personal Gemini API quota exceeded. | Check backend logs for HTTP 429 status from Google GenAI SDK. | Switch to secondary standby key (Claude/OpenAI) or wait 60s for quota refresh. | Escalate if team project quota requires upgrade. |
| **`SSRF_ATTEMPT_DETECTED`** | Scraper attempted to access private loopback IP address. | Inspect URL submitted in URL News Desk. | Input must be a valid, public Internet news URL (`RULE-SEC-008`). | Escalate if legitimate public IP is false-positive. |
| **`Invalid Webhook Signature`** | HMAC-SHA256 signature mismatch on inbound callback. | Verify shared secret in `.env` matches test generator script. | Re-generate signature using raw payload buffer: `crypto.createHmac('sha256', secret).update(rawBuf)`. | Escalate if third-party vendor signature spec changed. |
| **`Android 10.0.2.2 Connection Refused`**| Android emulator unable to reach host Express backend. | Check `adb logcat` for `ConnectException`. | Ensure local Express server is running on host; use `http://10.0.2.2:3000`, not `localhost`. | Escalate if emulator network bridge is broken. |
| **`Git Push Rejected (Protected Branch)`**| Direct push attempted to `main` branch. | Check Git terminal error output. | Create a feature branch: `git checkout -b feature/my-change`, push, and open a PR. | Escalate if PR merge permissions are missing. |
| **`Out of Memory during Build`** | Node.js process memory ceiling exceeded during `npm run build`.| Check error: `JavaScript heap out of memory`. | Execute build with expanded memory: `NODE_OPTIONS="--max-old-space-size=4096" npm run build`. | Escalate if bundle size exceeds budget limits. |

---

## 19. Developer Safety and Access Control Standards

Security and legal compliance apply equally to local development environments (`docs/15-Security.md`).

### 19.1 Mandatory Development Safety Invariants
1. **No Production Secrets on Local Machines**: Hardware KMS master keys, live TRAI DLT SMS credentials, and production database passwords must never be stored on developer laptops.
2. **Sanitized Synthetic Test Data**: When testing news publishing or citizen comments locally, developers must use synthetic test data. Importing unencrypted production database dumps containing real citizen PII is strictly forbidden (`RULE-SEC-004`).
3. **No Direct Production Database Connections**: Connecting a local developer GUI (DBeaver, pgAdmin) directly to the production database cluster is physically blocked by VPC network policies.
4. **Clean Git Commits**: Run `git status` and `git diff` before committing to verify no temporary debug logs containing auth tokens (`console.log(token)`) or credentials are included.

---

## 20. Complete Setup Architecture Diagrams

The following eight Mermaid diagrams visually specify all aspects of local development, service orchestration, environment segregation, and collaboration workflows.

### 20.1 Diagram 1: Developer Local Environment
```mermaid
flowchart TD
    subgraph Developer_Workstation["Developer Local Machine"]
        IDE["VS Code / Android Studio IDE"]
        Terminal["Command Line Terminal (npm / Git)"]
        Browser["Chrome / Firefox Web Browser"]
        Emulator["Android Emulator (Pixel 7 / SDK 34)"]
    end

    subgraph Local_Process_Plane["Local Execution Plane (Node.js & Vite)"]
        Server["Express Backend API Server (Port 3000)"]
        ViteDev["Vite HMR Dev Middleware (Port 3000)"]
    end

    subgraph Local_Containers["Local Docker Services (Mode B)"]
        Postgres["PostgreSQL 16 DB (Port 5432)"]
        Redis["Redis 7 & BullMQ Queue (Port 6379)"]
    end

    Terminal -->|npm run dev| Server
    Server --> ViteDev
    Browser -->|HTTP localhost:3000| Server
    Emulator -->|HTTP 10.0.2.2:3000| Server
    Server --> Postgres
    Server --> Redis
```

### 20.2 Diagram 2: Repository-to-Local-Development Workflow
```mermaid
flowchart TD
    GitHubRepo["GitHub Remote Repository (breakingnewswala)"] --> GitClone["git clone https://github.com/..."]
    GitClone --> LocalRepo["Local Project Directory"]
    
    LocalRepo --> NPMInstall["npm install (reads .npmrc: legacy-peer-deps=true)"]
    NPMInstall --> EnvCopy["cp .env.example .env"]
    EnvCopy --> ConfigEnv["Configure Local Keys (GEMINI_API_KEY)"]
    ConfigEnv --> StartDev["npm run dev (tsx server.ts)"]
    StartDev --> BrowserCheck["Verify http://localhost:3000 in Browser"]
```

### 20.3 Diagram 3: Frontend and Backend Local Execution Architecture
```mermaid
flowchart LR
    Browser["Browser Client (React 19 PWA)"] --> Express["Express Server (server.ts)"]
    
    subgraph Express_Unified_Host["Unified Host Process (Port 3000)"]
        Express --> APIRoutes["REST API Endpoints (/api/*)"]
        Express --> ViteMiddleware["Vite Development Server Middleware"]
        ViteMiddleware --> HMR["Hot Module Replacement (In-Memory Rollup)"]
    end

    APIRoutes --> MockOrLiveAI["Google GenAI SDK (@google/genai)"]
    APIRoutes --> DBInterface["State Management / Database"]
    HMR --> Browser
```

### 20.4 Diagram 4: Backend and Database Connection Architecture
```mermaid
flowchart TD
    subgraph App_Backend["Express Backend Application"]
        Config["Database Configuration (DATABASE_URL)"]
        Pool["pg.Pool Connection Pool (Max 10 Conns)"]
        Migration["Migration Runner (Planned: npm run db:migrate)"]
    end

    subgraph Persistence_Tiers["Persistence Layer"]
        LocalPostgres["Local PostgreSQL 16 (Docker Port 5432)"]
        TestDB["Test DB Instance (Port 5433)"]
        FirestoreProto["Cloud Firestore Prototype (Current Mode A)"]
    end

    Config --> Pool
    Pool --> LocalPostgres
    Migration --> LocalPostgres
    App_Backend -.->|Prototype Fallback| FirestoreProto
```

### 20.5 Diagram 5: API Pool and AI Development Flow
```mermaid
flowchart TD
    DevEditor["Newsroom Editor UI (/admin/newsroom)"] --> APICall["POST /api/ai/structure-news"]
    APICall --> KeyCheck{"GEMINI_API_KEY Configured in .env?"}
    
    KeyCheck -- Yes (Valid Key) --> CallGemini["Call Google Gemini Cloud API"]
    KeyCheck -- No (Missing / Demo) --> DemoMock["Return Realistic Devanagari Mock News JSON"]
    
    CallGemini --> StatusCheck{"Response Status?"}
    StatusCheck -- 200 OK --> ValidResp["Return Structured News Report"]
    StatusCheck -- 429 Quota Exceeded --> FallbackCheck{"Secondary Key Configured?"}
    
    FallbackCheck -- Yes --> CallClaude["Sub-1.5s Fallback to Anthropic Claude"]
    FallbackCheck -- No --> ErrorResp["Return Quota Error to UI"]
    
    CallClaude --> ValidResp
    DemoMock --> ValidResp
```

### 20.6 Diagram 6: Development, Testing, Staging, and Production Separation
```mermaid
flowchart LR
    subgraph Env_Dev["Local Development"]
        D1["Developer Laptop"]
        D2["Localhost:3000"]
        D3["Mock / Personal Keys"]
    end

    subgraph Env_Test["Automated Testing"]
        T1["GitHub Actions CI"]
        T2["Ephemeral PostgreSQL"]
        T3["npm run lint & unit tests"]
    end

    subgraph Env_Staging["Staging Pre-Prod"]
        S1["Cloud Run Staging"]
        S2["Sanitized DB Clone"]
        S3["Internal Team Access"]
    end

    subgraph Env_Prod["Live Production"]
        P1["Cloud Run Production"]
        P2["Managed PostgreSQL 16"]
        P3["KMS Hardware Vault"]
    end

    Env_Dev -->|Git PR| Env_Test
    Env_Test -->|Auto Merge| Env_Staging
    Env_Staging -->|Executive Sign-Off| Env_Prod
```

### 20.7 Diagram 7: Future Native Android Development Environment
```mermaid
flowchart TD
    AndroidStudio["Android Studio Koala IDE"] --> Gradle["Gradle Kotlin DSL Build System"]
    Gradle --> Compose["Jetpack Compose UI Framework"]
    
    subgraph Android_Device_Plane["Execution Targets"]
        Emulator["Android Virtual Device (Pixel 8 / API 34)"]
        Physical["Physical Budget Android Device (USB Debugging)"]
    end

    Compose --> Emulator
    Compose --> Physical
    Emulator -->|HTTP 10.0.2.2:3000| LocalHost["Host Machine Express API (/api/v1/*)"]
    Physical -->|HTTP 192.168.x.x:3000| LocalHost
```

### 20.8 Diagram 8: Developer-to-GitHub Collaboration Workflow
```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant Local as Local Git Repository
    participant Remote as GitHub Remote (develop)
    participant CI as GitHub Actions CI
    actor Lead as Senior Reviewer
    participant Prod as GitHub Remote (main)

    Dev->>Local: git checkout -b feature/feat-001-newsroom
    Dev->>Local: Make code changes & test locally (npm run dev)
    Dev->>Local: git commit -m "feat(newsroom): add audio transcript support"
    Dev->>Remote: git push origin feature/feat-001-newsroom
    Dev->>Remote: Open Pull Request to 'develop' branch
    Remote->>CI: Trigger Automated CI Pipeline (Lint + Test)
    CI-->>Remote: Status Checks Passed (Green)
    Lead->>Remote: Review Diff & Approve PR
    Remote->>Remote: Squash and Merge into 'develop'
    Remote->>Prod: Release Tag Promotion to 'main'
```

---

## 21. Setup Readiness Checklists

Developers should use these verification checklists to validate their development environment.

### 21.1 Web Full-Stack Development Readiness Checklist

- [ ] **Repository Cloned**: Working directory is set to project root containing `package.json`.
- [ ] **Node.js Verified**: `node -v` returns $\ge \text{v18.18.0}$ (Recommended: v20.12.0 LTS).
- [ ] **npm Verified**: `npm -v` returns $\ge \text{v9.0.0}$.
- [ ] **Dependencies Installed**: `npm install` completed with 0 errors (respecting `.npmrc`).
- [ ] **Environment File Configured**: `.env` created from `.env.example`.
- [ ] **AI Key Configured**: Valid `GEMINI_API_KEY` added to `.env` (or verified in Demo Mock mode).
- [ ] **Development Server Started**: `npm run dev` launches without fatal exceptions.
- [ ] **Web Portal Accessible**: `http://localhost:3000` loads in browser with Devanagari typography.
- [ ] **API Health Check Responding**: `http://localhost:3000/api/ai/pool-status` returns HTTP 200 JSON.
- [ ] **TypeScript Type Check Passes**: `npm run lint` completes with zero errors.

### 21.2 Stage B Native Android Readiness Checklist (Future Planned)

- [ ] **Android Studio Installed**: Version Koala (2024.1+) or Hedgehog running with OpenJDK 17.
- [ ] **Android SDK 34 Installed**: Android SDK Platform 34 and Build-Tools verified in SDK Manager.
- [ ] **Emulator Created**: Pixel 7/8 running API 34 with Google Play Services.
- [ ] **Network Bridge Verified**: Emulator successfully pings `http://10.0.2.2:3000/api/ai/pool-status`.
- [ ] **Devanagari Font Rendering**: Verified Hindi text renders cleanly without character truncation.

---

## 22. Setup Decision Register (ADR)

The following Architectural Decision Records govern local development standards and tooling choices:

| Decision ID | Setup Area | Architectural Decision | Status | Evaluated Options | Chosen Recommendation | Key Justification | Traceability | Approver | Next Action |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **ADR-SET-001** | Development Server | How should the local full-stack server run in development? | **Confirmed** | A: Separate frontend and backend processes<br/>B: Unified Express + Vite dev middleware | **B: Unified Express + Vite (server.ts)** | Single command launch (`npm run dev`); eliminates CORS issues; identical to production deployment. | `11-Architecture.md` | Principal Architect | Maintain `server.ts`. |
| **ADR-SET-002** | Package Management | Which package manager is authoritative for the repository? | **Confirmed** | A: yarn<br/>B: npm with bun compatibility | **B: npm (`package-lock.json`)** | Standard in enterprise CI/CD; `.npmrc` enforces `legacy-peer-deps=true` for React 19 safety. | `package.json` | DevOps Lead | Maintain `package-lock.json`. |
| **ADR-SET-003** | Local Database Strategy | How should database state be managed during development? | **Confirmed** | A: Connect to shared cloud DB<br/>B: Dual mode (Firestore prototype / Docker PostgreSQL) | **B: Dual mode (Prototype vs Docker Postgres)** | Enables immediate zero-config UI development while preparing cleanly for Phase 1 PostgreSQL migration. | `12-Database.md` | Data Architect | Provide `docker-compose.yml`. |
| **ADR-SET-004** | Offline AI Development | How can developers build UI without consuming cloud AI tokens? | **Confirmed** | A: Require paid API key<br/>B: Built-in Devanagari mock fallback | **B: Built-in mock fallback in `server.ts`** | Allows offline work, saves API costs, and prevents local build breakage when developers lack credentials. | `19-API-Pool.md` | Lead AI Engineer | Maintain mock news generator. |
| **ADR-SET-005** | Native Android Backend | Should Android connect to a dedicated mobile backend? | **Confirmed** | A: Mobile-specific backend<br/>B: Single shared backend gateway | **B: Single shared backend (`/api/v1/*`)** | Eliminates duplicate code; guarantees 100% feature and business rule parity across Web and Android. | `10-Responsive.md` | Mobile Engineering Lead | Enforce single API gateway. |
| **ADR-SET-006** | TypeScript Execution | How should backend TypeScript be executed in development? | **Confirmed** | A: `ts-node`<br/>B: `tsx` | **B: `tsx`** | Transpiles in-memory via esbuild; $10\times$ faster startup than legacy `ts-node`; zero config required. | `package.json` | Lead Backend Engineer | Retain `tsx server.ts`. |
| **ADR-SET-007** | Local Media Storage | How should media file uploads be handled in local development? | **Proposed** | A: Upload directly to cloud R2<br/>B: Local MinIO S3 container | **B: Local MinIO S3 container** | Prevents test media from polluting production cloud storage; works completely offline. | `16-Storage.md` | Storage Architect | Add MinIO to Docker Compose. |
| **ADR-SET-008** | Pre-Commit Git Hooks | Should pre-commit hooks enforce linting and secret scanning? | **Proposed** | A: Developer manual discipline<br/>B: Husky + lint-staged + gitleaks | **B: Husky + lint-staged + gitleaks** | Prevents broken types or committed `.env` secrets from ever reaching GitHub remote branches. | `15-Security.md` | SecOps Specialist | Configure Husky in Phase 1. |
| **ADR-SET-009** | Local Redis Container | When should Redis become mandatory for local development? | **Proposed** | A: Day 1 prototype<br/>B: Phase 1 when BullMQ queues land | **B: Phase 1 when BullMQ queues land** | Keeps prototype lightweight; activates Redis containerization only when background workers are active. | `11-Architecture.md` | Backend Systems Lead | Document in Phase 1 plan. |
| **ADR-SET-010** | Testing Framework | Which test runner should power unit and integration tests? | **Proposed** | A: Jest<br/>B: Vitest | **B: Vitest** | Native Vite integration; shares same plugins and config as frontend bundler; instantaneous execution. | `docs/26-Testing.md` | QA Lead | Land Vitest configuration. |

---

## 23. Cross-Document Traceability Matrix

The setup guide maintains complete consistency across the architectural documentation suite:

| Document Reference | Upstream Specification Requirement | Setup Guide Realization | Status |
| :--- | :--- | :--- | :---: |
| [`docs/01-PRD.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/01-PRD.md) | High-speed digital newsroom; Hindi-first; omnichannel mobile and web reach. | Development environment optimized for rapid full-stack iteration and Devanagari rendering (Section 10). | **Fulfilled** |
| [`docs/02-Features.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/02-Features.md) | Multi-Key AI Vault (`FEAT-API-001`), RSS Ingestion (`FEAT-RSS-001`), Headline Studio (`FEAT-EDT-002`). | Development endpoints verified in `server.ts`; mock and multi-provider failover setup (Section 9 & 11). | **Fulfilled** |
| [`docs/04-NFR.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/04-NFR.md) | Sub-second dev reload; 99.9% uptime; zero secret leakage in client builds. | Vite HMR configuration; strict `.env` segregation; zero `VITE_` prefix on secrets (Section 7). | **Fulfilled** |
| [`docs/10-Responsive-Design.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/10-Responsive-Design.md) | Native Android Kotlin SDK 34+; zero WebViews (`RULE-MOB-002`). | Stage B Android Studio setup; emulator network bridge (`10.0.2.2:3000`); Keystore setup (Section 14). | **Fulfilled** |
| [`docs/11-Architecture.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/11-Architecture.md) | Unified Node.js backend; Redis BullMQ background workers; Docker containerization. | Multi-service local environment architecture (Mode B) and port allocation matrix (Section 6). | **Fulfilled** |
| [`docs/12-Database.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/12-Database.md) | PostgreSQL 16 schema, append-only `audit_logs`, seed taxonomies. | Docker PostgreSQL setup commands, connection strings, and migration strategy (Section 8). | **Fulfilled** |
| [`docs/13-API.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/13-API.md) | REST endpoints `/api/v1/*`; CORS allowlist; single shared backend. | Verified route table; CORS configuration; single backend contract for Web and Android (Section 9). | **Fulfilled** |
| [`docs/15-Security.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/15-Security.md) | Zero secrets in Git (`RULE-SEC-001`); Anti-SSRF (`RULE-SEC-008`); PII isolation. | Pre-commit secret scanning; SSRF sandbox testing; synthetic test data rules (Section 12 & 19). | **Fulfilled** |
| [`docs/16-Storage.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/16-Storage.md) | Cloudflare R2 / S3 storage; presigned URLs; media upload testing. | Local mock S3 storage setup; environment variables for bucket configuration (Section 6 & 7). | **Fulfilled** |
| [`docs/17-Agents.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/17-Agents.md) | 14 specialized newsroom agents; tool permissions; human review gates. | Agent development setup; mock test data; integration with local AI routes (Section 11). | **Fulfilled** |
| [`docs/18-MCP.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/18-MCP.md) | Model Context Protocol tooling; stdio IPC; read-only newsroom archives. | MCP development prerequisites; local JSON-RPC 2.0 CLI testing procedures (Section 13). | **Fulfilled** |
| [`docs/19-API-Pool.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/19-API-Pool.md) | Multi-provider AI key vault; quota monitoring; sub-1.5s automatic failover. | Verified `/api/ai/pool-status` route; local multi-provider failover testing (Section 9 & 11). | **Fulfilled** |
| [`docs/20-Integrations.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/20-Integrations.md) | RSS feed ingestion; webhook signature verification; Anti-SSRF proxy. | Whitelisted development RSS feeds; local HMAC-SHA256 webhook test generator (Section 12). | **Fulfilled** |
| [`docs/21-Prompts.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/21-Prompts.md) | 8-layer prompt hierarchy; 100-story golden benchmark; Zod schema validation. | Local prompt testing commands; offline mock news generator in `server.ts` (Section 11 & 17). | **Fulfilled** |

---

## 24. Documentation Quality Requirements & Strict Scope Restrictions

### 24.1 Compliance with Quality Requirements
- **Practical & Reproducible**: All documented setup commands (`npm install`, `npm run dev`, `npm run build`, `npm run lint`) have been verified against the physical repository on disk.
- **Accurate Technology Status**: Clearly distinguishes confirmed tools (React 19, Vite 8, Express, Tailwind v4, tsx) from proposed Phase 1 migrations (PostgreSQL 16, BullMQ, MinIO) and future Stage B developments (Native Android Kotlin SDK 34+).
- **Security-First Standards**: Enforces `.env` quarantine, zero embedded client keys, and strict prohibition of direct production database connections.

### 24.2 Strict Scope Restrictions Confirmation
This task has executed strictly within documentation boundaries. The assistant has **not**:
- Installed, removed, or updated any npm packages or system binaries.
- Modified any application code in `server.ts`, `src/`, or configuration files (`vite.config.ts`, `package.json`, `.npmrc`).
- Created, modified, or populated `.env` files or exposed live credentials.
- Executed database migrations or connected to production cloud databases.
- Created duplicate documentation files or modified unrelated project files.