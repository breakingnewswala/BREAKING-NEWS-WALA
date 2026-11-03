# BNW-DEPLOYMENT-ARCHITECTURE — Master Platform Deployment & Rollout Architecture
## Project: BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
### Document ID: DOC-44-DEPLOYMENT-ARCHITECTURE-2026-V1.0
### Scope: Canonical Production Multi-Surface Deployment Topology & CI/CD Pipeline
### Classification: Authoritative Infrastructure & Operations Specification

---

## 1. Architectural Philosophy & Deployment Topology

**BREAKING NEWS WALA** is an integrated hyperlocal digital news ecosystem serving Madhya Pradesh across 55 districts and 10 administrative divisions.

The platform spans six distinct client operational surfaces and one shared central backend engine. A fundamental architectural rule is that **no single cloud hosting service can deploy the entire monorepo simultaneously**. Each subsystem is mapped to its purpose-built deployment runtime:

```
                                  SHARED CENTRAL BACKEND API
                               (Node.js / Express / TypeScript / REST)
                              Target: Container / Cloud Run / VPS
                                        │
                 ┌──────────────────────┼──────────────────────┐
                 │                      │                      │
       ┌─────────▼────────┐   ┌─────────▼────────┐   ┌─────────▼────────┐
       │ PUBLIC NEWS WEB  │   │  INTERNAL WEBS   │   │  NATIVE ANDROID  │
       │ (Next.js 15 SSR) │   │ (Vite 6 / React) │   │  (Pure Kotlin)   │
       │ apps/web         │   │ apps/{admin,...} │   │ android/{app-*}  │
       └─────────┬────────┘   └─────────┬────────┘   └─────────┬────────┘
                 │                      │                      │
                 ▼                      ▼                      ▼
        FIREBASE APP HOSTING    STATIC CDN / HOSTING   FIREBASE APP DISTR.
       (Cloud Run Serverless)  (Cloudflare / Storage)  (Internal QA APKs)
                                                               │
                                                               ▼
                                                      GOOGLE PLAY CONSOLE
                                                      (Production Release)
```

---

## 2. Six Operational Surfaces — Deployment Matrix

| Surface ID | Application Surface | Technology Stack | Artifact Format | Production Deployment Target | Access Control Policy |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **SRF-01** | **Public News Website** | Next.js 15 (App Router, SSR) | Standalone Node.js Container (`.next/standalone`) | **Firebase App Hosting** (Cloud Run) / Cloudflare | Public (Internet-facing, SEO indexed) |
| **SRF-02** | **Reporter Web PWA** | Vite 6 / React 19 (SPA/PWA) | Static Asset Bundle (`apps/reporter/dist/`) | **Firebase Hosting** / Cloudflare Pages | Role-Gated (`ROLE_REPORTER`, `ROLE_BUREAU_CHIEF`) |
| **SRF-03** | **Central Newsroom Desk** | Vite 6 / React 19 (SPA) | Static Asset Bundle (`apps/newsroom/dist/`) | **Restricted Internal Hosting** / VPN | Role-Gated (`ROLE_DESK_EDITOR`, `ROLE_ADMIN`) |
| **SRF-04** | **Admin Control Panel** | Vite 6 / React 19 (SPA) | Static Asset Bundle (`apps/admin/dist/`) | **Restricted Admin Hosting** / Private Ingress | Elevated Role Only (`ROLE_SUPER_ADMIN`, `ROLE_ADMIN`) |
| **SRF-05** | **Android Public Reader** | 100% Kotlin / Jetpack Compose | Native APK / AAB (`app-reader-*.apk`) | **Firebase App Distribution** (QA) & **Google Play** | Public Consumer App (`com.breakingnewswala.reader`) |
| **SRF-06** | **Android Reporter App** | 100% Kotlin / Jetpack Compose | Native APK / AAB (`app-reporter-*.apk`)| **Firebase App Distribution** (Internal QA) | Role-Gated (`com.breakingnewswala.reporter`) |
| **SRF-07** | **Shared Central Backend**| Node.js LTS / Express / Prisma| Compiled JS / Docker Container | **Cloud Run / Docker / VPS** + PostgreSQL & Redis | API Gateway (`/api/v1/`) strictly server-enforced |

---

## 3. Disambiguation: Firebase App Hosting vs Firebase App Distribution

A critical root cause identified in `BNW-DEPLOYMENT-DIAGNOSTIC-001` was the confusion between Firebase App Hosting and Firebase App Distribution:

```
┌──────────────────────────────────────┬──────────────────────────────────────┐
│       FIREBASE APP HOSTING           │      FIREBASE APP DISTRIBUTION       │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • Purpose: Full-Stack Web Apps       │ • Purpose: Mobile Testing Pre-Release│
│ • Runtimes: Next.js, Angular, SSR    │ • Formats: Android APK/AAB, iOS IPA  │
│ • Build Engine: Google Cloud Build   │ • Build Engine: Local or CI (Gradle) │
│ • Target: apps/web (Public Portal)   │ • Target: android/app-* (Reader/Rep) │
│ • Deploy: Automated on Git Push      │ • Deploy: Manual CLI or CI Dispatch  │
│ • Console: App Hosting -> Rollouts   │ • Console: App Distribution -> Rel.  │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

---

## 4. Firebase App Hosting Architecture for Next.js (`apps/web`)

### 4.1 Monorepo Standalone Requirement
Firebase App Hosting packages full-stack Next.js applications into Cloud Run containers via `apphosting-adapter-nextjs-build`. For a monorepo workspace, Next.js requires:
1. `output: 'standalone'` in `apps/web/next.config.js`.
2. `outputFileTracingRoot: path.join(__dirname, '../../')` so that hoisted root `node_modules` dependencies (including `@bnw/tokens` and `@bnw/types`) are traced into `.next/standalone/`.
3. An `apphosting.yaml` configuration defining `runConfig` (CPU, memory, instances) and environment variables.
4. A root `firebase.json` declaring `apphosting.rootDir: "apps/web"`.

### 4.2 Runtime Specification (`apphosting.yaml`)
```yaml
runConfig:
  cpu: 1
  memoryMiB: 512
  minInstances: 0
  maxInstances: 10
  concurrency: 80

env:
  - variable: NODE_ENV
    value: production
    availability:
      - BUILD
      - RUNTIME
```

---

## 5. GitHub Actions CI/CD Pipeline Architecture

Automation is partitioned into three decoupled workflows under `.github/workflows/`:

```
.github/workflows/
├── ci.yml                    # Automated PR & Push Quality Gate
├── android-build.yml         # Dedicated Android Build & Artifact Storage
└── firebase-distribution.yml # Deliberate Manual Firebase App Distribution
```

### 5.1 `ci.yml` — Automated Quality Gate
- **Triggers**: Push to `main`, Pull Request to `main`.
- **Parallel Jobs**:
  1. `backend-ci`: Tests and compiles `packages/backend` on Node.js 20.
  2. `web-ci`: Tests and compiles all four web surfaces (`apps/web`, `apps/admin`, `apps/newsroom`, `apps/reporter`).
  3. `android-ci`: Sets up JDK 17, Android SDK, and executes `./gradlew testDebugUnitTest assembleDebug`.

### 5.2 `android-build.yml` — Artifact Generation
- **Triggers**: `workflow_dispatch` (manual), Push with `v*` tags.
- **Jobs**:
  - `build-reader`: Compiles `:app-reader:assembleDebug` (or release), verifies non-zero byte size, calculates SHA-256 checksum, uploads as GitHub Actions artifact.
  - `build-reporter`: Compiles `:app-reporter:assembleDebug` (or release), verifies non-zero byte size, calculates SHA-256 checksum, uploads as GitHub Actions artifact.

### 5.3 `firebase-distribution.yml` — Controlled Rollout
- **Triggers**: `workflow_dispatch` only (never automatic on standard commit pushes).
- **Security**: Consumes `FIREBASE_SERVICE_ACCOUNT_KEY` stored in GitHub repository secrets.
- **Targets**:
  - Reader: `1:852342978897:android:347a0f9c5028d71a59bb70`
  - Reporter: `1:852342978897:android:d556191e7909654259bb70`
  - Project ID: `breaking-news-wala`

---

## 6. Secret Management & Governance

1. **Zero Committed Secrets**:
   - Secrets are **never** committed to Git, embedded in APKs, or packaged in client JavaScript.
2. **Required GitHub Actions Secret**:
   - `FIREBASE_SERVICE_ACCOUNT_KEY`: Google Service Account JSON with `Firebase App Distribution Admin` role.
3. **App Hosting Secrets**:
   - Production API credentials (e.g. Gemini API, Razorpay) are managed via Google Cloud Secret Manager using `firebase apphosting:secrets:set`.

---

## 7. Phased Rollout Strategy

- **Stage 1 (Web SSR)**: Automated deploy to Firebase App Hosting via GitHub App integration.
- **Stage 2 (Android Alpha)**: Manual upload of verified debug APKs to Firebase App Distribution for internal editorial and field stringer testing.
- **Stage 3 (Android Production)**: Production release keystore signing via CI `android-build.yml` $\rightarrow$ Google Play Console submission.
- **Stage 4 (Backend Monolith)**: Managed container deployment to Google Cloud Run / Docker with live PostgreSQL v16 and Redis v7 clusters.

