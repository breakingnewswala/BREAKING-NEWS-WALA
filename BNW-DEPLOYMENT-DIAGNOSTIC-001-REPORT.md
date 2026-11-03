# BNW-DEPLOYMENT-DIAGNOSTIC-001-REPORT
## GitHub Actions to Firebase Rollout Failure — Root Cause Investigation
### Project: BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
### Document ID: DOC-43-DEPLOYMENT-DIAGNOSTIC-2026-V1.0
### Phase: Pre-Release Deployment Diagnostics & Root Cause Analysis
### Target Commit: `09de3a0e651fc34b989abac93d4d95363b59b5f0` (Branch: `main`)

---

## 1. Executive Summary

This diagnostic investigation identifies the exact reasons why the **BREAKING NEWS WALA** platform did not roll out to Firebase after code was pushed to the GitHub repository (`breakingnewswala/BREAKING-NEWS-WALA` on branch `main`).

### Key Diagnostic Findings:
1. **GitHub Actions Workflows are Completely Absent**: The repository contains **zero** GitHub Actions workflow files (`.github/workflows/` does not exist). No automated CI/CD pipeline exists on GitHub to build, test, package, or distribute any application surface.
2. **The Observed "Build failed" was Triggered by Firebase App Hosting, NOT GitHub Actions**:
   - The failure visible in the Firebase Console (`build-2026-11-02-000`, Build ID `d4c5292e-384d-417e-84fe-833142f75de2`) was triggered by a **direct GitHub App webhook** linked to Google Cloud Build for Firebase **App Hosting** (Backend `breakingnewswala`).
   - Cloud Build failed in Step #3 (`protoPayload.status.code: 9`) because the backend was originally created for a single-app prototype at root `/`. Following the monorepo architecture migration, the root directory `/` is an npm workspace root without direct `next` dependencies, and neither root `apphosting.yaml` nor `firebase.json` exists to instruct Cloud Buildpacks to build from `apps/web/`.
3. **Product Misconception between App Hosting & App Distribution**:
   - **Firebase App Hosting** is strictly for **Web Applications** (Next.js SSR). It cannot build, release, or roll out Android APKs.
   - **Firebase App Distribution** is the dedicated service for Android APK/AAB distribution, but it has no native automatic GitHub push integration. It requires either an authenticated GitHub Actions workflow or explicit CLI distribution commands.
4. **Neither Android APK was Ever Uploaded to Firebase**:
   - Both Android APKs (`app-reader-debug.apk` ~24.66 MB and `app-reporter-debug.apk` ~21.67 MB) exist locally and pass signature verification.
   - However, manual CLI upload attempts in Windows `cmd.exe` failed due to syntax errors (Linux `\` line continuations and `<>` input redirection), leaving Firebase App Distribution with zero releases.
5. **No Single Service Can Deploy the Entire Platform**:
   - The platform comprises six distinct applications and one shared backend. Attempting to deploy the entire monorepo through a single Firebase App Hosting backend is an architectural impossibility.

---

## 2. Current Deployment Architecture

```
                                  GIT PUSH TO GITHUB (main: 09de3a0)
                                                 │
                                 ┌───────────────┴───────────────┐
                                 │                               │
                       GITHUB APP WEBHOOK                GITHUB ACTIONS CI/CD
                                 │                               │
                                 ▼                               ▼
                     FIREBASE APP HOSTING               DOES NOT EXIST (.github/)
                   (Backend: breakingnewswala)           • No Android build job
                                 │                       • No Web build job
                                 ▼                       • No App Distribution upload
                     GOOGLE CLOUD BUILD                  • No Backend deployment
                     (Cloud Native Buildpacks)
                                 │
                   ┌─────────────┴─────────────┐
                   │  FAILED: Step #3 (Build)  │
                   │  Root '/' has no Next.js  │
                   │  Root package.json has    │
                   │  no direct dependencies   │
                   │  No apphosting.yaml       │
                   └───────────────────────────┘
```

The platform architecture (`docs/11-Architecture.md`, `docs/24-Deployment.md`) mandates:
- **Web Portal (`apps/web`)**: Next.js 15 App Router (SSR) $\rightarrow$ Firebase App Hosting or Node.js Container / Cloudflare.
- **Admin, Newsroom, Reporter Web (`apps/*`)**: Vite 6 SPAs $\rightarrow$ Static Web CDN / Cloudflare / Firebase Hosting.
- **Shared Backend (`packages/backend`)**: Modular Node.js / Express monolith $\rightarrow$ Dedicated container runtime with PostgreSQL, Redis, BullMQ.
- **Android Applications (`android/*`)**: Pure Kotlin Native $\rightarrow$ Firebase App Distribution (Internal QA) & Google Play Console.

---

## 3. GitHub Actions Workflow Inventory

| Inspection Check | Result | Evidence |
| :--- | :---: | :--- |
| **`.github` Directory Exists** | **FALSE** | `Test-Path .github` $\rightarrow$ `False` |
| **`.github/workflows/` Exists** | **FALSE** | `Test-Path .github/workflows` $\rightarrow$ `False` |
| **Total Workflow Files** | **0** | `git ls-files .github` $\rightarrow$ Empty |
| **GitHub Actions Runs on Remote** | **0** | `https://api.github.com/.../actions/runs` $\rightarrow$ `total_count: 0` |
| **GitHub Commit Statuses** | **0** | `https://api.github.com/.../check-runs` $\rightarrow$ `total_count: 0` |

**Conclusion**: There is no GitHub Actions CI/CD automation configured in the repository.

---

## 4. Workflow Trigger Analysis

Because `.github/workflows/` does not exist:
- No GitHub push trigger is configured for Android Gradle compilation.
- No GitHub push trigger is configured for Firebase App Distribution upload.
- No GitHub push trigger is configured for backend testing or deployment.
- The **only trigger active** on GitHub is the external webhook installed by the **Firebase App Hosting GitHub App**, which triggers Google Cloud Build directly in Google Cloud Platform under project `breaking-news-wala`.

---

## 5. Six Application Deployment Matrix

| # | Application Surface | Framework & Engine | Build Command | Output Location | Intended Deployment Target | Configured in Repo | Included in Active Pipeline? |
| :-: | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **1** | **Public News Website** | Next.js 15.5.28 (SSR) | `npm run build --prefix apps/web` | `apps/web/.next/` | Firebase App Hosting / Cloudflare | Partially (in `apps/web`) | **YES (Failing in Cloud Build)** |
| **2** | **Reporter Web PWA** | Vite 6 / React 19 (SPA) | `npm run build --prefix apps/reporter` | `apps/reporter/dist/` | Static Hosting / CDN | Yes | **NO (Not in pipeline)** |
| **3** | **Central Newsroom** | Vite 6 / React 19 (SPA) | `npm run build --prefix apps/newsroom` | `apps/newsroom/dist/` | Static Hosting / Internal Desk | Yes | **NO (Not in pipeline)** |
| **4** | **Admin Control Panel** | Vite 6 / React 19 (SPA) | `npm run build --prefix apps/admin` | `apps/admin/dist/` | Static Hosting / VPN | Yes | **NO (Not in pipeline)** |
| **5** | **Android Public Reader** | Pure Kotlin / Compose | `./gradlew :app-reader:assembleDebug` | `android/app-reader/build/.../*.apk` | Firebase App Distribution / Play Store | Yes | **NO (Not in pipeline)** |
| **6** | **Android Reporter App** | Pure Kotlin / Compose | `./gradlew :app-reporter:assembleDebug` | `android/app-reporter/build/.../*.apk` | Firebase App Distribution (Internal QA) | Yes | **NO (Not in pipeline)** |
| **7** | **Shared Backend Monolith**| Node.js / Express / TS | `npm run build --prefix packages/backend`| `packages/backend/dist/` | Node.js Container + PostgreSQL/Redis | Yes | **NO (Not in pipeline)** |

---

## 6. Android Firebase App Distribution Analysis

1. **Automation Status**: **0% Automated**. There is no workflow or cloud trigger that builds Android APKs on GitHub push.
2. **Artifact Availability**:
   - `android/app-reader/build/outputs/apk/debug/app-reader-debug.apk` exists locally (24.66 MB, SHA-256: `9EC0FEE3...`).
   - `android/app-reporter/build/outputs/apk/debug/app-reporter-debug.apk` exists locally (21.67 MB, SHA-256: `C209B5D7...`).
   - Both verify under APK Signature Scheme v2.
3. **App ID Verification**:
   - Reader: `1:852342978897:android:347a0f9c5028d71a59bb70` (registered in Firebase project `breaking-news-wala`).
   - Reporter: `1:852342978897:android:d556191e7909654259bb70` (registered in Firebase project `breaking-news-wala`).
4. **Why No Release ID Exists in Firebase Console**:
   - Android releases appear exclusively under **Firebase Console $\rightarrow$ App Distribution $\rightarrow$ Releases**.
   - Because the manual CLI upload failed in the terminal and no CI/CD exists, zero APKs reached Google servers.

---

## 7. Firebase Hosting & App Hosting Analysis

1. **`firebase.json` Status**: **MISSING**. There is no `firebase.json` anywhere in the repository.
2. **`.firebaserc` Status**: **MISSING**. There is no project alias binding file in the repository.
3. **Firebase App Hosting Failure Details**:
   - **Backend ID**: `breakingnewswala`
   - **Build ID**: `d4c5292e-384d-417e-84fe-833142f75de2`
   - **Failed Step**: `Step #3 - application ... apphosting` (`protoPayload.status.code: 9`)
   - **Root Cause**:
     - Firebase App Hosting uses Cloud Native Buildpacks targeting the root of the repository.
     - The repository root `/package.json` is a monorepo workspace definition. It has no `"dependencies"` block and does not list `next`.
     - The Next.js web application is located at `apps/web/`.
     - No `apphosting.yaml` exists at the root (the prototype configuration was archived at `legacy/prototype/apphosting.yaml`).
     - Cloud Buildpack cannot infer how to package an npm monorepo without a specified root directory or framework definition.

---

## 8. Shared Backend Deployment Analysis

1. **Deployment Destination**: Node.js Container / Cloud Run / VPS.
2. **Firebase Incompatibility**: The shared backend monolith (`packages/backend`) cannot run on Firebase Static Hosting or standard App Hosting without containerization because it requires:
   - A persistent PostgreSQL v16 relational database with 60 Prisma models.
   - Redis v7 connection for sliding-window rate limiters and queues.
   - Ingress port binding (e.g., port 3000) with Express HTTP routing.
3. **Current State**: Completely decoupled from GitHub push automation; must be deployed via Docker / Cloud Run / Kubernetes runbooks (`docs/24-Deployment.md`).

---

## 9. Secret and Configuration Safety Audit

1. **GitHub Secrets**: Because no `.github/` folder exists, no secret references (`${{ secrets.FIREBASE_TOKEN }}`, `${{ secrets.GOOGLE_SERVICES_JSON }}`) exist in source control.
2. **Local Repository Secrets**: Full scan confirmed zero committed private keys, live API tokens, or production passwords.
3. **Firebase CLI State on Host**:
   - `npx -y firebase-tools login:list` returned `! No authorized accounts`.
   - The host machine has not authenticated via Firebase CLI.

---

## 10. Confirmed Root Causes

### 10.1 Confirmed Root Cause 1 (App Hosting Build Failure)
- **Problem**: Firebase App Hosting `build-2026-11-02-000` failed immediately after push.
- **Evidence**: Cloud Build log shows `protoPayload.status.code: 9` in Step #3.
- **Mechanism**: The backend `breakingnewswala` in Firebase Console is set to root `/`. In root `/`, Next.js is not present as a direct dependency (it is in `apps/web/`). Cloud Buildpacks failed to detect a valid standalone web application.

### 10.2 Confirmed Root Cause 2 (Missing Android CI/CD Automation)
- **Problem**: Android APKs did not build or deploy after push.
- **Evidence**: `.github/workflows/` does not exist.
- **Mechanism**: Git push only uploads source code to GitHub. Without a GitHub Actions runner configured with Java, Android SDK, and Firebase CLI, no APK build or distribution can take place automatically.

### 10.3 Confirmed Root Cause 3 (Product Misidentification in Console)
- **Problem**: User reported: "I CANT SEE RELEASE ID OR CANT ROLLOUT IN FIREBASE".
- **Evidence**: User screenshots show `App Hosting > Backend breakingnewswala > Rollouts`.
- **Mechanism**: The user was inspecting **App Hosting** (web hosting) instead of **App Distribution** (mobile app distribution).

### 10.4 Confirmed Root Cause 4 (CLI Upload Command Syntax Errors)
- **Problem**: Manual CLI upload failed in Windows Command Prompt.
- **Evidence**: Screenshot shows `Error: Too many arguments` and `The system cannot find the path specified`.
- **Mechanism**: Copying multi-line bash commands with `\` and `<>` into Windows `cmd.exe` broke execution.

---

## 11. Potential Causes Requiring External Cloud Console Access

1. **Google Cloud Build Quota / IAM**:
   - The service account `service-852342978897@gcp-sa-firebaseapphosting.iam.gserviceaccount.com` must have the `Cloud Build Service Account` and `Artifact Registry Writer` roles. If IAM bindings were altered, builds will fail even with correct paths.
2. **Firebase Console App Hosting Root Directory Setting**:
   - If the backend in Firebase Console has `Root directory` hardcoded to `/`, changing repository files alone may not suffice unless updated in Console settings or overridden via `apphosting.yaml`.

---

## 12. P0 / P1 / P2 Issue Register

| ID | Priority | Category | Issue Description | Applications Affected | Resolution Requirement |
| :---: | :---: | :--- | :--- | :--- | :--- |
| **ISSUE-P0-01** | **P0** | CI/CD | Total absence of `.github/workflows/` automation. | All 6 Surfaces + Backend | Create GitHub Actions workflows for Android & Web. |
| **ISSUE-P0-02** | **P0** | App Hosting | App Hosting Cloud Build failure on monorepo root. | `apps/web` (Public Web) | Add `apphosting.yaml` / set root directory to `apps/web`. |
| **ISSUE-P0-03** | **P0** | Distribution | Firebase App Distribution has 0 releases. | `:app-reader`, `:app-reporter` | Upload debug APKs via Console Drag & Drop or single-line CLI. |
| **ISSUE-P1-01** | **P1** | Configuration | Missing `firebase.json` and `.firebaserc` at root. | `apps/web`, `apps/reporter` | Author canonical root Firebase config. |
| **ISSUE-P1-02** | **P1** | Host CLI | Local host has no authorized Firebase session. | Local Developer Machine | Run `npx firebase-tools login` interactively. |
| **ISSUE-P2-01** | **P2** | Scripting | Lack of unified npm scripts for single-surface deployments. | Monorepo root | Add dedicated npm deploy scripts. |

---

## 13. Recommended Minimal Fixes

To achieve a clean, successful rollout across both Firebase products:

### Fix A: Fix Android Internal QA (Immediate — 2 Minutes)
Do not wait for GitHub Actions. Upload the verified local APKs directly to **Firebase App Distribution**:
1. Open [Firebase Console $\rightarrow$ App Distribution](https://console.firebase.google.com/).
2. Select **`BREAKING NEWS WALA (com.breakingnewswala.reader)`**.
3. Drag & drop `android/app-reader/build/outputs/apk/debug/app-reader-debug.apk`.
4. Select **`BREAKING NEWS WALA — REPORTER (com.breakingnewswala.reporter)`**.
5. Drag & drop `android/app-reporter/build/outputs/apk/debug/app-reporter-debug.apk`.
*Result*: Release ID, version `1.0.0 (1)`, and tester invitation links will appear immediately.

### Fix B: Fix Firebase App Hosting for Web Portal (`apps/web`)
In the upcoming implementation task:
1. In Firebase Console $\rightarrow$ **App Hosting** $\rightarrow$ **Backend `breakingnewswala`** $\rightarrow$ **Settings**:
   - Change **Root directory** from `/` to **`apps/web`**.
2. Add a root [`apphosting.yaml`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/apphosting.yaml) or [`apps/web/apphosting.yaml`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/apps/web/apphosting.yaml) configuring run settings for Next.js.
*Result*: Future GitHub pushes will compile Next.js SSR cleanly in Cloud Build.

### Fix C: Establish GitHub Actions CI/CD (Future Automation)
Create `.github/workflows/android-qa.yml` and `.github/workflows/web-deploy.yml` with:
- JDK 17 setup
- Android SDK build cache
- Service Account authentication (`google-github-actions/auth`)
- Automated upload to Firebase App Distribution on tag/push.

---

## 14. Exact Next Action

1. Review this diagnostic report [`BNW-DEPLOYMENT-DIAGNOSTIC-001-REPORT.md`](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/BNW-DEPLOYMENT-DIAGNOSTIC-001-REPORT.md).
2. Authorize the remediation task (`BNW-DEPLOYMENT-REMEDIATION-001`) to:
   - Configure Firebase App Hosting for `apps/web`.
   - Complete the manual/drag-and-drop upload of the two Android debug APKs to Firebase App Distribution.
   - Scaffold the initial `.github/workflows/` CI/CD definitions for future automated pushes.

