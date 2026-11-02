# Android Google Play Release Readiness Runbook
## Project: BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
### Document ID: DOC-RUN-AND-REL-2026-V1.0
### Scope: Dual Application Play Store Readiness, Signing Architecture, Data Safety & Pre-Flight Gates
### Authority: Master Prompt 10 (`BNW-MASTER-010`) — Section 17 Google Play Release Readiness

---

## 1. Executive Summary & Production Gate Mandate

> [!IMPORTANT]
> **STRICT STOP CONDITION**: In accordance with Section 2 of Master Prompt 10, **neither application may be submitted to Google Play or deployed to production** during this phase. This runbook establishes complete pre-flight release readiness, artifact specifications, signing standards, and Data Safety disclosures without executing an unauthorized production release.

---

## 2. Application Identity & Versioning Matrix

| Parameter | Public News Reader | Reporter & Field Journalist App |
| :--- | :--- | :--- |
| **Application Name** | `BREAKING NEWS WALA` | `BREAKING NEWS WALA — REPORTER` |
| **Vernacular Name** | `ब्रेकिंग न्यूज़ वाला` | `ब्रेकिंग न्यूज़ वाला — रिपोर्टर` |
| **Application ID** | `com.breakingnewswala.reader` | `com.breakingnewswala.reporter` |
| **Baseline Version Name**| `1.0.0` | `1.0.0` |
| **Baseline Version Code**| `100` | `100` |
| **Compile SDK** | `36` | `36` |
| **Target SDK** | `35` (Android 15 Play Store compliant)| `35` (Android 15 Play Store compliant) |
| **Minimum SDK** | `24` (Android 7.0 Nougat) | `24` (Android 7.0 Nougat) |
| **Target Audience** | General citizens, vernacular news readers | Accredited district stringers, bureau chiefs |
| **Distribution Category** | News & Magazines | Productivity / Newsroom Internal |

---

## 3. Cryptographic Signing & Secret Management

### 3.1 Google Play App Signing Readiness
Both applications are architectured for **Google Play App Signing**:
- An upload key signs the release Android App Bundle (AAB).
- Google Play validates the upload key and re-signs the delivered APKs with the master app signing key stored in Google's secure infrastructure.

### 3.2 Keystore Secret Isolation Invariant
- Under **no circumstances** may `.keystore`, `.jks`, passwords, or key aliases be checked into Git.
- Release signing is configured strictly via CI/CD environment variables:
  ```properties
  BNW_RELEASE_STORE_FILE=/var/secrets/bnw-upload-keystore.jks
  BNW_RELEASE_STORE_PASSWORD=${KMS_KEYSTORE_PASSWORD}
  BNW_RELEASE_KEY_ALIAS=${KMS_KEY_ALIAS}
  BNW_RELEASE_KEY_PASSWORD=${KMS_KEY_PASSWORD}
  ```

---

## 4. Android Permission Declarations & Justifications

### 4.1 Public News Reader (`app-reader`)
| Permission | API Level | Purpose & Justification |
| :--- | :---: | :--- |
| `android.permission.INTERNET` | All | Fetching news feeds, article details, and images from `/api/v1/`. |
| `android.permission.ACCESS_NETWORK_STATE` | All | Detecting offline status to show cached news and offline indicators. |
| `android.permission.POST_NOTIFICATIONS` | $\ge 33$ | Delivering breaking news and district alert push notifications. |

### 4.2 Reporter Application (`app-reporter`)
| Permission | API Level | Purpose & Justification |
| :--- | :---: | :--- |
| `android.permission.INTERNET` | All | Authenticating and submitting news drafts and uploads to `/api/v1/`. |
| `android.permission.ACCESS_NETWORK_STATE` | All | Managing offline draft synchronization and network status. |
| `android.permission.POST_NOTIFICATIONS` | $\ge 33$ | Delivering editorial assignment and revision feedback alerts. |
| `android.permission.CAMERA` | All | Capturing breaking news photos/videos directly from rural field beats. |
| `android.permission.READ_MEDIA_IMAGES` | $\ge 33$ | Selecting photos from device gallery for article attachments. |
| `android.permission.READ_MEDIA_VIDEO` | $\ge 33$ | Selecting video clips from device gallery for article attachments. |
| `android.permission.READ_EXTERNAL_STORAGE`| $\le 32$ | Legacy gallery selection on Android 12 and below. |

---

## 5. Google Play Data Safety Disclosures (DPDPA 2023)

### 5.1 Data Collection & Usage Summary
| Data Type | Collected? | Shared? | Encrypted in Transit? | Ephemeral? | Purpose |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Personal Info (Name, Phone, Email)** | Only Reporter App | No | Yes (TLS 1.3) | No | Account management & reporter accreditation. |
| **Precise Location (GPS)** | **NO** | No | N/A | N/A | Strictly barred; district is selected manually. |
| **Approximate IP Location** | **NO** | No | N/A | N/A | `RULE-GEO-001`: zero IP geo-guessing. |
| **Photos & Videos** | Only Reporter App | No | Yes (TLS 1.3) | No | News article reporting attachments. |
| **App Performance & Diagnostics**| Yes | No | Yes (TLS 1.3) | Yes | Sentry crash reporting & P95 latency telemetry. |
| **Device or other IDs** | Push token only | No | Yes (TLS 1.3) | No | FCM push notification dispatch. |

---

## 6. Pre-Flight Google Play Release Checklist

Before any future submission to Google Play Console:
- [ ] Target SDK is set to $\ge 35$.
- [ ] ProGuard / R8 minify and resource shrinking enabled for release builds.
- [ ] Zero API keys, passwords, or backend secrets present in source code.
- [ ] Official Brand Logo SHA-256 verified (`88407B32CCF924B10CCD6C9E17DF367D36C174AE7DEF441A26D8E5FDC035209F`).
- [ ] State Emblem of India omitted from all assets, icons, and banners.
- [ ] ASCI permanent disclosure ("विज्ञापन") verified on all ad banners.
- [ ] Paid reader subscriptions (`DEC-070`) verified disabled.
- [ ] Stringer click revenue sharing (`DEC-069`) verified rejected.
- [ ] Chief Editor role (`DEC-048`) verified blocked with `403 Forbidden`.
- [ ] Privacy Policy URL active and accessible at `https://breakingnewswala.com/privacy`.
- [ ] Release AAB built and SHA-256 checksum recorded in release notes.

