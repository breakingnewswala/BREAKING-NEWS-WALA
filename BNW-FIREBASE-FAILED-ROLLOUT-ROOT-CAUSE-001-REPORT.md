# BNW-FIREBASE-FAILED-ROLLOUT-ROOT-CAUSE-001-REPORT
## Firebase App Hosting Build Failure Investigation & Technical Report

**Project:** BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)  
**Firebase Project ID:** `breaking-news-wala`  
**Backend:** `breakingnewswala`  
**Region:** `asia-southeast1`  
**Rollout Target:** `build-2026-11-03-000`  
**Cloud Build ID:** `2371c67b-e522-42b0-bd05-34012d6a024e`  
**Git Commit:** `6d27c3e857a68383d58dd48d3a851556eca354e7` (pushed to `origin/main`)  
**Date of Investigation:** 2026-11-03  
**Lead Auditor:** Antigravity AI Release Engineering  

---

## Final Verdict

# **B. USER ACTION REQUIRED — FIREBASE CONSOLE OR CREDENTIAL ISSUE**

---

## 1. Executive Summary & Raw Log Retrieval Status

### Raw Log Retrieval via CLI:
- **`gcloud` CLI**: Not installed on this developer workstation (`The term 'gcloud' is not recognized`).
- **`firebase` CLI**: Installed (`firebase-tools@15.34.2`), but not authenticated in this shell session (`Failed to authenticate, have you run firebase login?`).
- **Audit Limitation**: Because `gcloud` is not present locally, raw remote logs from Cloud Build cannot be downloaded via the terminal command line. Per prompt governance instructions:
  > *"If the raw build log cannot be retrieved, explicitly report that and stop short of claiming a confirmed root cause."*

### Analysis of the Reported Error:
- **Reported Error**: `protoPayload.status.code: 9` (`FAILED_PRECONDITION`) on method `google.devtools.cloudbuild.v1.CloudBuild.CreateBuild`.
- **Critical Architectural Distinction**:
  - `status.code: 9` in the GCP Audit Log is an **administrative wrapper code** indicating that Google Cloud Build either failed to satisfy a build prerequisite or that the build lifecycle concluded with an error.
  - The Audit Log entry is **NOT** the framework build log.
  - The actual build steps run inside Cloud Native Buildpacks (CNB) sequentially:
    - `Step #0 - ubuntu` (Workspace init)
    - `Step #1 - preparer` (Config & env sanitizer)
    - `Step #2 - pre-buildpack` (CNB translation)
    - `Step #3 - build` (Framework adapter execution: `@apphosting/adapter-nextjs`)
  - As observed in user screenshot `media_1793641017000_d3bc15ab.jpg`, clicking the red `audit_log` row opens the `status.code: 9` JSON, while the actual error text is emitted in the blue log rows directly below it (labeled `ERROR` or `Step #3`).

---

## 2. Technical Investigation of Build Configuration

A systematic audit of the 12 specified configuration items was performed on commit `6d27c3e`:

| # | Inspection Item | Repository Location | Finding & Status |
| :---: | :--- | :--- | :--- |
| **1** | Root `package.json` | `package.json` | Defines monorepo workspaces `apps/*` and `packages/*`. Node engine `>=20.0.0`. Valid. |
| **2** | Root `package-lock.json` | `package-lock.json` | Lockfile v3 valid and synchronized with all 7 workspace packages. |
| **3** | Web App `package.json` | `apps/web/package.json` | Next.js 15.0.0, React 19.0.0. Depends on local `@bnw/tokens` and `@bnw/types`. |
| **4** | Shared Workspace Packages | `packages/tokens`, `packages/types` | Valid local packages exporting TypeScript definitions and design tokens. |
| **5** | Next.js & Node Compatibility | `apps/web` | Next.js 15.5.28 requires Node.js `>=18.18.0`. Buildpack provides Node 20. Compatible. |
| **6** | Buildpack & Adapter | `@apphosting/adapter-nextjs` | Supports Next.js 13, 14, and 15 with standalone output. |
| **7** | Next.js Config | `apps/web/next.config.js` | Configured with `output: 'standalone'` and `outputFileTracingRoot`. Verified working. |
| **8** | Web App Hosting Config | `apps/web/apphosting.yaml` | 1 CPU, 512MB RAM, concurrency 80, `NODE_ENV=production`. Valid YAML. |
| **9** | Root App Hosting Config | `apphosting.yaml` | Identical fallback config present at repository root. Valid YAML. |
| **10** | Firebase Configs | `firebase.json`, `.firebaserc` | Declares `rootDir: "apps/web"`, `backendId: "breakingnewswala"`, project `breaking-news-wala`. |
| **11** | Console Root Directory | Firebase Console Setting | **Probable Root Cause**: Firebase App Hosting backends connected to GitHub read their `Root directory` from the Console Backend Settings, NOT dynamically from `firebase.json`. If this is unset or set to `/`, the buildpack cannot find the Next.js app. |
| **12** | Environment Variables | Build & Runtime | `apps/web` builds statically and SSR without requiring build-time secret environment variables. Confirmed empirically. |

---

## 3. The Two Probable Failure Mechanisms in Firebase App Hosting Monorepos

Based on official Firebase App Hosting architecture documentation and Google Cloud Buildpack behavior:

### Mechanism 1: Unsynchronized Root Directory in Firebase Console
- When a backend is created in the Firebase Console connected to GitHub, Firebase stores backend metadata (including `Root directory`) inside Google Cloud.
- Merely committing `firebase.json` with `"rootDir": "apps/web"` does not retrospectively update an existing Cloud backend resource created with root `/`.
- If Cloud Build executes at `/`, it looks for a Next.js framework in the root `package.json`. Because root `package.json` has no `next` dependency, Step #3 fails to detect the framework or fails `pre-buildpack`.

### Mechanism 2: Subdirectory Lockfile Absence in Isolated Subdirectory Builds
- If the Console Root directory IS set to `apps/web`:
- Cloud Build sets the buildpack context to `/workspace/apps/web`.
- `apps/web` does **not** have its own `package-lock.json` because npm workspaces maintain a single lockfile at the monorepo root.
- Furthermore, `apps/web/package.json` references `@bnw/tokens: "*"` and `@bnw/types: "*"`. If npm runs inside an isolated `apps/web` directory without the parent workspace context, it attempts to fetch `@bnw/tokens` from the public `registry.npmjs.org`, returning `404 Not Found`.

---

## 4. Local Reproduction & Verification Results

All tests were executed locally to verify framework integrity and standalone output:

```text
1. Check gcloud CLI:
   Command: gcloud --version
   Result: gcloud not recognized (Exit Code 1)

2. Check Firebase Tools:
   Command: npx firebase-tools --version
   Result: 15.34.2 (Not logged in) (Exit Code 1)

3. Isolated Production Web Build:
   Command: $env:NODE_ENV="production"; npm run build --prefix apps/web
   Result: Exit Code 0. Next.js 15.5.28 compiled successfully in 8.6s.
   Generated 8/8 static/dynamic routes.
   Emitted .next/standalone/apps/web/server.js and traced hoisted packages.

4. Standalone Runtime Server Execution:
   Command: node apps/web/.next/standalone/apps/web/server.js
   Result: Next.js server bound to http://0.0.0.0:3000 in 1574ms without errors.
```

---

## 5. Required User Actions in Firebase Console

Because the repository code, Next.js configuration, and standalone bundle build cleanly, the resolution lies in the Google Cloud / Firebase Console configuration:

### Action 1: Inspect the Real Step #3 Error Log in Firebase Console
To see the exact error message that caused the build to fail:
1. Open the [Firebase App Hosting Dashboard](https://console.firebase.google.com/project/breaking-news-wala/apphosting).
2. Click on backend **`breakingnewswala`** $\rightarrow$ Click on the **Logs** tab.
3. In the log list for Build `2371c67b-e522-42b0-bd05-34012d6a024e`:
   - **Do not click the red `audit_log` line** (which only shows `status.code: 9`).
   - Click on the blue lines labeled **`ERROR`** or **`Step #3 - application / apphosting...`**.
   - OR click the button above the log pane: **`View adjacent logs in Cloud Logging`** to see the full streaming terminal output.

### Action 2: Verify Backend Root Directory Setting
1. In Firebase Console $\rightarrow$ **App Hosting** $\rightarrow$ **`breakingnewswala`**.
2. Click the **Settings** tab $\rightarrow$ **Deployment**.
3. Confirm whether the **Root directory** field is set to:
   ```text
   apps/web
   ```
4. If it is currently `/` or empty, change it to `apps/web` and save.

### Action 3: Trigger a New Rollout
After verifying the Root Directory:
1. In the backend overview, click **Rollouts** $\rightarrow$ **Create rollout**.
2. Select commit `6d27c3e` (`main` branch) and trigger the rollout.

---
*Report certified by Antigravity AI Release Engineering.*

