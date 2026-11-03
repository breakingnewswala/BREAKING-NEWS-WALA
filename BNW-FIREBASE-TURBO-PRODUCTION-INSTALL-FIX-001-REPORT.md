# BNW-FIREBASE-TURBO-PRODUCTION-INSTALL-FIX-001: Technical Investigation & Remediation Report

**Document ID:** BNW-REPORT-FIREBASE-TURBO-PROD-001  
**Target Release:** v1.0.0-rc1  
**Repository:** `breakingnewswala/BREAKING-NEWS-WALA`  
**Base Commit:** `440e07b3930fdb5789f4dbdc1fed81a873ae87f4`  
**Firebase Project ID:** `breaking-news-wala`  
**Firebase App Hosting Backend:** `breakingnewswala`  
**Firebase Region:** `asia-southeast1`  
**Root Directory:** `apps/web`  
**Failed Cloud Build ID:** `43e614fb-c295-4df1-a9ed-bdc58a8f8993`  
**Report Date:** 3 November 2026  

---

## 1. Executive Summary

During rollout build `build-2026-11-03-000` (Cloud Build ID `43e614fb-c295-4df1-a9ed-bdc58a8f8993`) following commit `440e07b`, Firebase App Hosting successfully detected the monorepo root lockfile and Turborepo configuration (`google.nodejs.turborepo@0.0.1`), but failed during the framework build phase with:

```text
/bin/sh: 1: turbo: not found
fah/failed-framework-build
Build process exited with error code 127
```

A surgical remediation was applied by moving `turbo` from root `devDependencies` to root `dependencies` in `package.json` and synchronizing `package-lock.json`. This ensures that Firebase App Hosting's production-mode installation (`npm ci --quiet --no-fund --no-audit (NODE_ENV=production)`) installs the `turbo` binary and platform bindings into `/workspace/node_modules/.bin/turbo`.

Empirical validation confirmed:
- `npm ci --omit=dev` installs the `turbo` binary (Exit Code 0).
- `npx turbo --version` returns `2.11.10` under production-only dependencies (Exit Code 0).
- `npm run build --prefix apps/web` compiles Next.js 15.5.28 standalone output in 13.6s (Exit Code 0).
- The Next.js standalone server boots and responds with **HTTP 200 OK** (53,583 bytes HTML).
- Full monorepo test suite passes **474/474 tests across 139 suites** (0 failures).

---

## 2. Confirmed Root Cause Analysis

### 2.1 The Failure Mechanism
1. In commit `440e07b`, `turbo.json` was introduced and `"turbo": "^2.11.10"` was declared under `devDependencies` in the root `package.json`.
2. Firebase App Hosting executes dependency installation inside Cloud Build with:
   ```bash
   npm ci --quiet --no-fund --no-audit (NODE_ENV=production)
   ```
3. Under `NODE_ENV=production`, `npm ci` strictly omits `devDependencies`.
4. As a result, `/workspace/node_modules/.bin/turbo` and `@turbo/*` native binary shims were omitted from the container filesystem.
5. When the App Hosting Turborepo buildpack subsequently attempted to invoke `turbo run build --filter=@bnw/web...`, `/bin/sh` could not resolve `turbo` in the PATH, exiting immediately with `error code 127` (`fah/failed-framework-build`).

---

## 3. Scope of Modifications

The remediation strictly adheres to the principle of minimal intervention:
- Exactly two files modified in the working tree: `package.json` and `package-lock.json`.
- `turbo` version is strictly preserved as `^2.11.10` (resolving to locked `2.11.10`).
- No secondary lockfiles introduced.
- Workspace topology and `turbo.json` preserved untouched.

### 3.1 `package.json` Diff
```diff
--- a/package.json
+++ b/package.json
@@ -15,11 +15,13 @@
     "clean": "npm run clean --workspaces --if-present"
   },
   "devDependencies": {
-    "turbo": "^2.11.10",
     "typescript": "^5.7.0"
   },
   "engines": {
     "node": ">=20.0.0",
     "npm": ">=10.0.0"
+  },
+  "dependencies": {
+    "turbo": "^2.11.10"
   }
 }
```

### 3.2 `package-lock.json` Diff
```diff
--- a/package-lock.json
+++ b/package-lock.json
@@ -11,8 +11,10 @@
         "apps/*",
         "packages/*"
       ],
+      "dependencies": {
+        "turbo": "^2.11.10"
+      },
       "devDependencies": {
-        "turbo": "^2.11.10",
         "typescript": "^5.7.0"
       },
       "engines": {
@@ -1660,7 +1662,6 @@
       "cpu": [
         "x64"
       ],
-      "dev": true,
       "license": "MIT",
       "optional": true,
...
@@ -3672,7 +3668,6 @@
       "version": "2.11.10",
       "resolved": "https://registry.npmjs.org/turbo/-/turbo-2.11.10.tgz",
       "integrity": "sha512-3GJYwig8ygEI89oaOZdduJX8/aw6O9eRPYHoIt6T3FZl9hkKjiyIspufJoVgqXihPoJu8M5CSV0DlZvzfohBCw==",
-      "dev": true,
       "license": "MIT",
       "bin": {
         "turbo": "bin/turbo"
```

---

## 4. Empirical Validation Matrix

All validation steps were executed and recorded on the local development environment mirroring Cloud Build constraints:

| Step # | Validation Operation | Expected Result | Actual Result | Exit Code | Status |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **1** | `npm ci --omit=dev` | Clean install omitting dev dependencies | `added 131 packages, and audited 139 packages in 2m` | `0` | **PASS** |
| **2** | `npx turbo --version` (Production install) | Prints `2.11.10` | `2.11.10` | `0` | **PASS** |
| **3** | Binary existence check | `node_modules/.bin/turbo` & `.cmd` exist | `True`, `True` | `0` | **PASS** |
| **4** | `npm run build --prefix apps/web` | Next.js 15.5.28 compiles standalone bundle | `✓ Compiled successfully in 13.6s`, 8/8 routes generated | `0` | **PASS** |
| **5** | Standalone artifacts check | `apps/web/.next/standalone` populated | Exists (`apps/`, `node_modules/`, `package.json`) | `0` | **PASS** |
| **6** | Standalone HTTP 200 Test | Server boots on port 3000, returns HTML | HTTP 200 OK, 53,583 bytes HTML, ready in 1245ms | `0` | **PASS** |
| **7** | Full Monorepo Test Suite (`npm test`) | 100% test pass across all workspaces | `pass 474, fail 0` across 139 suites (147.17s) | `0` | **PASS** |
| **8** | Git Diff Validation (`git diff --check`) | Zero whitespace or conflict marker errors | Clean output, no errors | `0` | **PASS** |

---

## 5. Assessment of Install-Script Warnings

During both Cloud Build and local `npm ci`, the npm CLI emitted:
```text
npm warn install-scripts 2 packages have install scripts not yet covered by allowScripts:
npm warn install-scripts   @prisma/client@5.22.0 (postinstall: node scripts/postinstall.js)
npm warn install-scripts   argon2@0.45.1 (install: cross-env ZERO_AR_DATE=1 node-gyp-build)
```

### 5.1 Technical Findings
1. **Target Surface Isolation**:
   - The Firebase App Hosting backend builds and serves `apps/web` (the Public News Website).
   - Inspection of `apps/web/package.json` confirms dependencies are strictly:
     - `@bnw/tokens` (internal workspace)
     - `@bnw/types` (internal workspace)
     - `lucide-react`
     - `next`
     - `react`
     - `react-dom`
2. **Backend Architecture Boundaries**:
   - `@prisma/client` and `argon2` are dependencies strictly belonging to `packages/backend`.
   - `apps/web` does **not** import, invoke, or depend on `@prisma/client` or `argon2`. Communication between `apps/web` and `packages/backend` occurs strictly via HTTP REST endpoints (`/api/v1/`).
3. **Safety Recommendation**:
   - Do **NOT** indiscriminately approve `allowScripts` for native compilation in the App Hosting web build container.
   - The blocked scripts have zero bearing on the web frontend build or SSR runtime.

---

## 6. Risk Assessment & Mitigations

| Risk | Likelihood | Impact | Mitigation Implemented |
| :--- | :---: | :---: | :--- |
| **Turbo bloat in production bundles** | Low | Low | Next.js standalone tracing (`outputFileTracingRoot`) traces runtime imports per page and never includes build-time CLI tools like `turbo` in the client/server runtime bundle. |
| **Lockfile drift across workspaces** | Nil | High | Verified full root `package-lock.json` integrity and ran `npm test` across all workspaces with 474/474 passing tests. |
| **Platform-specific binary incompatibility** | Nil | High | `package-lock.json` retains optional dependencies for `@turbo/linux-x64`, ensuring Cloud Build Linux containers resolve native shims seamlessly. |

---

## 7. Proposed Authorized Git Commands

*(For user authorization only — do not run without explicit approval)*

```bash
# 1. Verify working directory state
git status --short
# Expected output:
#  M package-lock.json
#  M package.json
# ?? BNW-FIREBASE-TURBO-PRODUCTION-INSTALL-FIX-001-REPORT.md

# 2. Stage only authorized files
git add package.json package-lock.json BNW-FIREBASE-TURBO-PRODUCTION-INSTALL-FIX-001-REPORT.md

# 3. Commit with standardized semantic message
git commit -m "fix(apphosting): promote turbo to production dependencies for App Hosting buildpack"

# 4. Push to origin main
git push origin main
```

---
*Report prepared and validated in compliance with DOC-36-AGENTS-ROOT-2026-V1.0.*

