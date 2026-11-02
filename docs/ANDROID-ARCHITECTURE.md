# Master Android Native Ecosystem Architecture Specification
## Project: BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
### Document ID: DOC-AND-ARCH-2026-V1.0
### Scope: Dual Native Android Applications, Multi-Module Engineering & Shared-Backend Integration
### Authority: Master Prompt 10 (`BNW-MASTER-010`) — Final Roadmap Phase

---

## 1. Executive Summary & Architectural Mandate

This specification defines the comprehensive native Android architecture for **BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)**.

In strict adherence to the project's non-negotiable architectural invariants:
1. **100% Pure Native Kotlin & Jetpack Compose (`DEC-002`)**: No WebView wrappers, no Capacitor/Cordova shells, and no cross-platform runtimes (Flutter/React Native).
2. **Single Shared Monolithic Backend (`DEC-011`, `DEC-017`)**: Both Android applications interact exclusively with the single central Node.js/TypeScript REST API (`/api/v1/`) and the unified PostgreSQL database cluster. Zero separate backends, duplicate databases, or local business logic bifurcations.
3. **Server-Side Authorization Supremacy**: All business rules, publishing state machines, and geographic territory boundaries (`RULE-GEO-001`) are enforced on the server.
4. **Preserved Governance Invariants**:
   - `DEC-048`: `ROLE_CHIEF_EDITOR` remains **Pending Approval** and is strictly barred (`403 Forbidden`).
   - `DEC-060`: Canonical brand logo SHA-256 match (`88407B32CCF924B10CCD6C9E17DF367D36C174AE7DEF441A26D8E5FDC035209F`); zero usage of State Emblem of India.
   - `DEC-069`: Direct stringer click revenue sharing remains **REJECTED**.
   - `DEC-070`: Paid reader subscriptions remain **DEFERRED** (`ERR_SUBSCRIPTION_DEFERRED`).
   - `RULE-REWARD-002`: Automated referral rewards remain disabled pending governance approval.

---

## 2. Dual-Application Topology

The Android ecosystem comprises two independently installable, purpose-built native applications:

```
                               ┌────────────────────────────────────────────────────────┐
                               │               SHARED CENTRAL BACKEND API               │
                               │                (Node.js / Express / REST)              │
                               └───────────┬────────────────────────────────┬───────────┘
                                           │                                │
                       ┌───────────────────┴───────────────┐  ┌─────────────┴─────────────────────┐
                       │  BREAKING NEWS WALA               │  │  BREAKING NEWS WALA — REPORTER    │
                       │  Public News Reader               │  │  Reporter & Field Journalist      │
                       │  (com.breakingnewswala.reader)    │  │  (com.breakingnewswala.reporter)  │
                       └───────────────────┬───────────────┘  └─────────────┬─────────────────────┘
                                           │                                │
                                           └────────────────┬───────────────┘
                                                            │
                               ┌────────────────────────────▼───────────────────────────┐
                               │             SHARED CORE KOTLIN LIBRARIES               │
                               │  :core:model         :core:network      :core:auth     │
                               │  :core:designsystem  :core:analytics    :core:media    │
                               │  :core:notifications :core:pdf                         │
                               └────────────────────────────────────────────────────────┘
```

### 2.1 Public News Reader (`:app-reader`)
- **Package ID**: `com.breakingnewswala.reader`
- **Audience**: General public citizens and vernacular news readers across Madhya Pradesh.
- **Primary Capabilities**: Breaking news ticker, category exploration, 55 MP district news feeds, Devanagari article reading, video news player, digital E-Paper edition viewer, search, bookmarks, notification preferences, ASCI-labeled advertisements.
- **Published-Only Invariant**: Strictly renders articles with `status == PUBLISHED`. Drafts and editorial revisions are inaccessible.

### 2.2 Reporter & Field Journalist Application (`:app-reporter`)
- **Package ID**: `com.breakingnewswala.reporter`
- **Audience**: Accredited district stringers, rural field correspondents, and bureau chiefs.
- **Primary Capabilities**: Secure reporter authentication, portfolio metrics dashboard (Drafts, Pending Review, Revision Requested, Published, Rejected), Devanagari article editor, local encrypted draft storage, camera/gallery media upload via presigned S3/R2 URLs, territory beat validation (`RULE-GEO-001`), editorial review feedback tracking, revision resubmission.

---

## 3. Multi-Module Project Structure

```
android/
  ├── build.gradle.kts                  # Root build script
  ├── settings.gradle.kts               # Multi-module include registry
  ├── gradle.properties                 # JVM memory and build flags
  ├── local.properties                  # Android SDK directory path
  ├── gradle/
  │   └── libs.versions.toml            # Central Gradle Version Catalog
  ├── app-reader/                       # Public News Reader application module
  │   ├── build.gradle.kts
  │   └── src/main/kotlin/com/breakingnewswala/reader/
  ├── app-reporter/                     # Reporter application module
  │   ├── build.gradle.kts
  │   └── src/main/kotlin/com/breakingnewswala/reporter/
  └── core/                             # Reusable technical modules
      ├── model/                        # Pure Kotlin domain data models
      ├── network/                      # Retrofit 2, OkHttp, AuthInterceptor, TokenAuthenticator
      ├── auth/                         # TokenManager (Keystore-backed), AuthRepository
      ├── designsystem/                 # Brand colors, typography, BnwMasthead, NewsCard, ASCI ad banner
      ├── analytics/                    # Canonical analytics event taxonomy tracker
      ├── notifications/                # FCM push notification dispatcher & deep-link router
      ├── media/                        # Presigned upload manager & gallery integration
      └── pdf/                          # Native Android PdfRenderer engine for E-Paper
```

---

## 4. Mobile Token Security & Native Authentication

### 4.1 Keystore-Backed Secure Storage
- `TokenManager` utilizes `EncryptedSharedPreferences` backed by the hardware **Android Keystore** (`MasterKey.KeyScheme.AES256_GCM`).
- AES-256 SIV is applied for preference key encryption; AES-256 GCM is applied for token value encryption.
- No plaintext tokens or session secrets are ever logged or stored in unencrypted SharedPreferences.

### 4.2 Single-Flight Refresh Mutex
- Network requests encountering `401 Unauthorized` trigger `TokenAuthenticator`.
- A coroutine `Mutex` ensures concurrent requests serialize and share a single refresh network call, preventing refresh token replay theft detection false alarms.
- If refresh fails or returns `401`, tokens are securely wiped and the user is routed to login.

---

## 5. Media Ingestion & Native E-Paper Rendering

### 5.1 Two-Phase Presigned Upload Pipeline
1. Client requests presigned URL: `POST /api/v1/media/presigned-upload`.
2. Binary payload is uploaded directly to cloud storage (S3/R2) via HTTP `PUT` with progress tracking.
3. Client confirms upload: `POST /api/v1/media/confirm-upload`.
4. Backend verifies object existence, computes dimensions, and returns authorized `MediaAsset`.

### 5.2 Native Zero-Dependency PDF Rendering
- To eliminate security and maintenance risks of third-party PDF libraries or WebView rendering, E-Paper pages are rendered natively using Android SDK's built-in `android.graphics.pdf.PdfRenderer`.
- Renders PDF pages to high-resolution `Bitmap` objects with pinch-to-zoom and pan support in Jetpack Compose.

---

## 6. Technology Version Baseline

| Component | Selected Version | Approval Status | Rationale |
| :--- | :---: | :---: | :--- |
| **Android SDK (Compile)** | `36` / `37` | **Confirmed** | Matches local installed Android SDK. |
| **Android SDK (Target)** | `35` | **Confirmed** | Google Play 2025/2026 compliance requirement. |
| **Android SDK (Min)** | `24` | **Confirmed** | Android 7.0+, covering $\ge 96\%$ of rural MP smartphones. |
| **Kotlin** | `2.3.20` | **Confirmed** | Latest stable compiler with Compose plugin. |
| **Android Gradle Plugin** | `9.0.1` | **Confirmed** | Official AGP baseline. |
| **Gradle** | `9.1.0` | **Confirmed** | Compatible wrapper distribution. |
| **Jetpack Compose BOM** | `2026.03.01` | **Confirmed** | Declarative 60fps UI rendering. |
| **Retrofit / OkHttp** | `2.11.0` / `4.12.0` | **Confirmed** | Industry standard HTTP client with interceptors. |
| **Serialization** | `Kotlinx 1.7.3` | **Confirmed** | Type-safe JSON serialization. |
| **Image Loading** | `Coil 2.7.0` | **Confirmed** | Lightweight Kotlin-first Compose image loader. |
| **Video Playback** | `Media3 1.5.0` | **Confirmed** | Android official ExoPlayer replacement. |
| **PDF Rendering** | `android.graphics.pdf` | **Confirmed** | 100% native Android SDK; zero external dependency. |
| **Token Storage** | `SecurityCrypto 1.1.0` | **Confirmed** | Hardware Keystore-backed AES-256 encryption. |

