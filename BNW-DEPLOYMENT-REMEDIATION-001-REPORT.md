# BNW-DEPLOYMENT-REMEDIATION-001-REPORT
## Complete Deployment Fix, Firebase App Hosting Repair & GitHub CI/CD Implementation
### Project: BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
### Document ID: DOC-45-DEPLOYMENT-REMEDIATION-2026-V1.0
### Release Target: v1.0.0-rc1 | Reported Commit: `09de3a0e651fc34b989abac93d4d95363b59b5f0`
### Firebase Project: `breaking-news-wala` | Backend: `breakingnewswala` | Region: `asia-southeast1`

---

## 1. Executive Summary

This report documents the complete technical remediation, architectural repair, and implementation of automated deployment pipelines for the **BREAKING NEWS WALA** news platform under task **`BNW-DEPLOYMENT-REMEDIATION-001`**.

All root causes identified in the diagnostic investigation have been resolved:
1. **Next.js Standalone Configuration**: Authored [`apps/web/next.config.js`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/apps/web/next.config.js) configuring `output: 'standalone'` and monorepo `outputFileTracingRoot`. Verified locally: `apps/web/.next/standalone` is generated with `server.js` and all traced dependencies.
2. **App Hosting Runtime Configuration**: Authored [`apphosting.yaml`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/apphosting.yaml) (root) and [`apps/web/apphosting.yaml`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/apps/web/apphosting.yaml), plus root [`firebase.json`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/firebase.json) and [`.firebaserc`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/.firebaserc) declaring `rootDir: "apps/web"`.
3. **GitHub Actions CI/CD Pipeline**: Authored three enterprise-grade workflows under [`.github/workflows/`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/.github/workflows/):
   - [`ci.yml`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/.github/workflows/ci.yml): Automated CI quality gate for pull requests and pushes.
   - [`android-build.yml`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/.github/workflows/android-build.yml): Dedicated Android packaging with checksums and GitHub Actions artifact uploads.
   - [`firebase-distribution.yml`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/.github/workflows/firebase-distribution.yml): Controlled, manual distribution to Firebase App Distribution with verified App IDs.
4. **Android Artifacts Ready**: Both native Android applications (`app-reader-debug.apk` ~24.66 MB and `app-reporter-debug.apk` ~21.67 MB) are verified, signed with debug certificates, and ready for internal QA distribution.

---

## 2. Screenshot Evidence & Raw Cloud Build Analysis

### 2.1 Screenshot 1 (Firebase App Hosting Overview)
- **Location**: `App Hosting → Backend breakingnewswala → Overview`
- **Observed Error**: `Failed to run the framework build`
- **Failed Command**: `npm exec --prefix /layers/google.nodejs.firebaseext/apphosting-adapter-nextjs-build npm_modules/apphosting-adapter-nextjs-build`
- **Notice**: "Please check the raw log to address the error and confirm that your application builds locally before redeploying."

### 2.2 Screenshot 2 (Cloud Build Audit Log)
- **Project**: `breaking-news-wala` | **Build ID**: `d4c5292e-384d-417e-84fe-833142f75de2`
- **Status Code**: `9` (`FAILED_PRECONDITION` / `ABORTED`)
- **Service Account**: `service-852342978897@gcp-sa-firebaseapphosting.iam.gserviceaccount.com`
- **Failing Step**: `Step #3 - application ... apphosting... ERROR: ... full/build`

### 2.3 Confirmed Technical Root Cause
The buildpack `google.nodejs.firebaseext/apphosting-adapter-nextjs-build` was executed inside the repository root `/` by Google Cloud Build. The failure occurred due to three compound factors:
1. **Missing `next.config.js`**: `apps/web` had no `next.config.js`. Next.js defaulted to non-standalone server output without generating `.next/standalone/`. The App Hosting adapter requires `.next/standalone/` to package the Cloud Run container.
2. **Monorepo Root Directory Mismatch**: The App Hosting backend was configured to build from `/`. Root `/package.json` is a monorepo workspace manifest without direct `next` dependencies.
3. **Missing `outputFileTracingRoot`**: In an npm monorepo, Next.js dependencies are hoisted to the root `node_modules/`. Without `outputFileTracingRoot: path.join(__dirname, '../../')`, Next.js standalone tracing cannot locate workspace dependencies.

---

## 3. Files Created and Configured

| File Path | Purpose | Status |
| :--- | :--- | :---: |
| [`apps/web/next.config.js`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/apps/web/next.config.js) | Standalone Next.js output and monorepo file tracing root | **Created & Verified** |
| [`apps/web/apphosting.yaml`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/apps/web/apphosting.yaml) | Cloud Run resources (1 vCPU, 512MB RAM) and production env vars | **Created & Verified** |
| [`apphosting.yaml`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/apphosting.yaml) | Root App Hosting configuration fallback for Cloud Build | **Created & Verified** |
| [`firebase.json`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/firebase.json) | Root Firebase declaration binding `rootDir: "apps/web"` | **Created & Verified** |
| [`.firebaserc`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/.firebaserc) | Project alias mapping default to `breaking-news-wala` | **Created & Verified** |
| [`.github/workflows/ci.yml`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/.github/workflows/ci.yml) | Continuous integration: tests & builds for backend, web & android | **Created & Verified** |
| [`.github/workflows/android-build.yml`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/.github/workflows/android-build.yml) | Dedicated Android artifact builds with SHA-256 and artifact storage | **Created & Verified** |
| [`.github/workflows/firebase-distribution.yml`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/.github/workflows/firebase-distribution.yml) | Manual Firebase App Distribution dispatch workflow | **Created & Verified** |
| [`BNW-DEPLOYMENT-ARCHITECTURE.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/BNW-DEPLOYMENT-ARCHITECTURE.md) | Canonical multi-surface deployment architecture specification | **Created & Verified** |

---

## 4. Local Build & Standalone Verification Evidence

### 4.1 Next.js Standalone Build Execution
Command: `npm run build --prefix apps/web`

```text
> @bnw/web@1.0.0 build
> next build

   ▲ Next.js 15.5.28

   Creating an optimized production build ...
 ✓ Compiled successfully in 24.6s
   Linting and checking validity of types ...
   Collecting page data ...
 ✓ Generating static pages (8/8)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                 Size  First Load JS  Revalidate  Expire
┌ ○ /                                      366 B         111 kB         30s      1y
├ ○ /_not-found                            130 B         103 kB         30s      1y
├ ƒ /article/[slug]                        127 B         114 kB
├ ƒ /category/[slug]                       366 B         111 kB
├ ƒ /district/[slug]                       366 B         111 kB
├ ƒ /epaper                                164 B         106 kB
├ ƒ /news/[slug]                           127 B         114 kB
├ ○ /robots.txt                            130 B         103 kB
├ ƒ /search                                366 B         111 kB
└ ○ /sitemap.xml                           130 B         103 kB         30s      1y
+ First Load JS shared by all             103 kB
```
- **Exit Status**: `0` (Success).
- **Standalone Folder Verified**: `apps/web/.next/standalone/` is present.
- **Server Entrypoint Verified**: `apps/web/.next/standalone/apps/web/server.js` exists.
- **Hoisted Node Modules Traced**: `apps/web/.next/standalone/node_modules/` contains all runtime dependencies.

### 4.2 Monorepo Workspaces Build Execution
Command: `npm run build` (from root)
- `@bnw/admin`: Built in 3.03s (`apps/admin/dist/` — 598.94 kB bundle).
- `@bnw/newsroom`: Built in 3.15s (`apps/newsroom/dist/` — 490.09 kB bundle).
- `@bnw/reporter`: Built in 1.75s (`apps/reporter/dist/` — 294.47 kB bundle).
- `@bnw/web`: Compiled in 7.9s (10 Next.js routes).
- `@bnw/backend`: Compiled cleanly with `tsc` (`packages/backend/dist/`).
- **Monorepo Exit Status**: `0` (100% Success).

---

## 5. Android Artifact Verification

| Parameter | Public News Reader (`:app-reader`) | Field Reporter App (`:app-reporter`) |
| :--- | :--- | :--- |
| **Artifact Path** | `android/app-reader/build/outputs/apk/debug/app-reader-debug.apk` | `android/app-reporter/build/outputs/apk/debug/app-reporter-debug.apk` |
| **Exact Size** | 24,657,299 Bytes (~24.66 MB) | 21,670,924 Bytes (~21.67 MB) |
| **Package Name** | `com.breakingnewswala.reader` | `com.breakingnewswala.reporter` |
| **Version Code / Name** | `1` / `1.0.0` | `1` / `1.0.0` |
| **Min / Target SDK** | `24` / `35` (Compile: `36`) | `24` / `35` (Compile: `36`) |
| **SHA-256 Checksum** | `9EC0FEE36E88E5D4C6E7B280B7A7F3EDE5C5B6FEB86E7F05FAA05B8EFC18F303` | `C209B5D7C18DE1F232DCA1A87BA8C0393951FEFDB5C34312C29F22F188D90CBF` |
| **Signature Scheme** | Scheme v2: `true` (RSA 2048) | Scheme v2: `true` (RSA 2048) |
| **Firebase App ID** | `1:852342978897:android:347a0f9c5028d71a59bb70` | `1:852342978897:android:d556191e7909654259bb70` |

---

## 6. GitHub Actions Workflows Inventory

### 6.1 `ci.yml` (Continuous Integration)
- **Path**: `.github/workflows/ci.yml`
- **Triggers**: Push to `main`, Pull Requests to `main`, `workflow_dispatch`.
- **Jobs**:
  - `backend-ci`: Node.js 20, tests backend, runs `tsc`.
  - `web-ci`: Node.js 20, tests web apps, builds `web`, `admin`, `newsroom`, `reporter`.
  - `android-ci`: JDK 17, Android SDK setup, runs Gradle unit tests and debug assembly.

### 6.2 `android-build.yml` (Artifact Storage)
- **Path**: `.github/workflows/android-build.yml`
- **Triggers**: `workflow_dispatch`, Tag push (`v*`).
- **Features**: Generates SHA-256 checksums, verifies non-zero byte size, uploads separate Reader and Reporter artifacts to GitHub Actions storage with a 14-day retention policy.

### 6.3 `firebase-distribution.yml` (Manual Rollout)
- **Path**: `.github/workflows/firebase-distribution.yml`
- **Triggers**: `workflow_dispatch` only (strictly manual, never on standard commit pushes).
- **Features**: Selectable targets (`reader`, `reporter`, `both`), selectable build types (`debug`, `release`), utilizes real Firebase App IDs and secret `FIREBASE_SERVICE_ACCOUNT_KEY`.

---

## 7. Web Applications Deployment Mapping

| Application Surface | Intended Target | Routing / Architecture | Access Control |
| :--- | :--- | :--- | :--- |
| **Public News Website** (`apps/web`) | **Firebase App Hosting** | SSR, dynamic routing (`/article/[slug]`, `/district/[slug]`) | Public, SEO Indexed |
| **Reporter Web PWA** (`apps/reporter`) | **Firebase Hosting / Static CDN** | Client-Side SPA, PWA Service Worker | Role-Gated (`ROLE_REPORTER`) |
| **Central Newsroom Desk** (`apps/newsroom`) | **Restricted Internal Hosting** | Client-Side SPA, WebSockets / SSE | Role-Gated (`ROLE_DESK_EDITOR`) |
| **Admin Control Panel** (`apps/admin`) | **Restricted Admin Hosting** | Client-Side SPA, Strict Admin Routing | Role-Gated (`ROLE_SUPER_ADMIN`) |

---

## 8. Shared Backend Deployment Status

- **Status**: **BUILD READY (Deployment Preparation Required)**
- **Architecture**: Modular Express monolith (`packages/backend/dist/`).
- **Deployment Destination**: Dedicated Docker container / Cloud Run with live PostgreSQL v16 cluster and Redis v7.
- **Independence Invariant**: The backend does NOT deploy through Firebase App Hosting or Static Hosting. It remains decoupled until staging infrastructure is provisioned (`docs/24-Deployment.md`).

---

## 9. Security & Secret Review

1. **Zero Committed Secrets**:
   - Checked repository status: zero unencrypted private keys, API secrets, or passwords exist.
   - [`.gitignore`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/.gitignore) verified to exclude `.env`, `.env.local`, `google-services.json`, `*.keystore`, `*.jks`, and build outputs.
2. **Least Privilege Workflows**:
   - All three GitHub Actions workflows declare `permissions: contents: read`.
3. **Required GitHub Repository Secret**:
   - Secret Name: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - Content: Google Cloud Service Account JSON key with the role **Firebase App Distribution Admin**.

---

## 10. Remaining User Actions in Firebase Console

To finalize the cloud rollout, the following one-time configuration actions are required in the [Firebase Console](https://console.firebase.google.com/):

### Action 1: Update App Hosting Root Directory
1. Open **Firebase Console** $\rightarrow$ **App Hosting** $\rightarrow$ Click on backend **`breakingnewswala`**.
2. Go to **Settings** tab $\rightarrow$ **Deployment**.
3. Change **Root directory** from `/` to **`apps/web`**.
4. Click **Save**.

### Action 2: Distribute Android APKs (Drag & Drop — 1 Minute)
1. Open **Firebase Console** $\rightarrow$ **App Distribution** (under `Release & Monitor` / `Product categories`).
2. Select **`BREAKING NEWS WALA (com.breakingnewswala.reader)`** from the top dropdown.
3. Drag & drop:
   `android/app-reader/build/outputs/apk/debug/app-reader-debug.apk`
4. Select **`BREAKING NEWS WALA — REPORTER (com.breakingnewswala.reporter)`**.
5. Drag & drop:
   `android/app-reporter/build/outputs/apk/debug/app-reporter-debug.apk`
*Result*: Release ID, version `1.0.0 (1)`, and tester invitation links will appear immediately.

### Action 3 (Optional for GitHub CI): Add GitHub Actions Secret
If you wish to distribute APKs via GitHub Actions in the future:
1. In Firebase Console $\rightarrow$ **Project Settings** $\rightarrow$ **Service accounts** $\rightarrow$ Generate new private key.
2. In GitHub Repository $\rightarrow$ **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions** $\rightarrow$ **New repository secret**:
   - Name: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - Value: Paste the JSON file contents.

---

## 11. Final Verdicts (Phase 15)

### A. Firebase App Hosting: **`FIXED AND LOCALLY VERIFIED`**
- `next.config.js` with `output: 'standalone'` and `outputFileTracingRoot` created.
- `.next/standalone/apps/web/server.js` verified.
- `apphosting.yaml` and `firebase.json` declaring `rootDir: "apps/web"` created.

### B. GitHub Actions CI: **`IMPLEMENTED AND LOCALLY VALIDATED`**
- `.github/workflows/ci.yml`, `android-build.yml`, and `firebase-distribution.yml` authored and syntax-checked.

### C. Android App Distribution: **`CONFIGURED AND READY FOR MANUAL INTERNAL DISTRIBUTION`**
- Both Debug APKs exist locally, pass signature checks, and match registered Firebase App IDs.

### D. Web Applications:
- `apps/web`: **`FIXED & READY FOR APP HOSTING`**
- `apps/admin`: **`BUILD READY (Restricted Hosting Required)`**
- `apps/newsroom`: **`BUILD READY (Restricted Hosting Required)`**
- `apps/reporter`: **`BUILD READY (Static CDN Required)`**

### E. Shared Backend: **`BUILD READY (Cloud Staging Required)`**
- Compiles cleanly (`tsc`); database and container provisioning required prior to live traffic.

### F. Overall Deployment Readiness: **`CONDITIONALLY READY — USER ACTION REQUIRED`**
- The repository and configuration are repaired and verified. Setting the App Hosting Root directory to `apps/web` in the Firebase Console and dragging the APKs into App Distribution will complete the rollout.

---

## 12. Exact Next Action

In accordance with Phase 14 boundaries:
1. Review this report [`BNW-DEPLOYMENT-REMEDIATION-001-REPORT.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/BNW-DEPLOYMENT-REMEDIATION-001-REPORT.md) and [`BNW-DEPLOYMENT-ARCHITECTURE.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/BNW-DEPLOYMENT-ARCHITECTURE.md).
2. Follow the 2-minute checklist in Section 10 (Set App Hosting Root directory to `apps/web` and drag & drop the two APKs into App Distribution).
3. When ready, authorize staging the newly created workflows and configurations to Git.

