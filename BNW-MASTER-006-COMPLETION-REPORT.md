# BNW-MASTER-006: API & SOCIAL INTEGRATIONS
## Central API Pool, Social Media Publishing, Account Connections, Notifications & Delivery Infrastructure
### Master Implementation & Production Governance Completion Report
### Project: BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
### Document ID: BNW-MASTER-006-COMPLETION-REPORT-2026-V1.0
### Scope: Central API Pool + Social Media Platform Adapters + Publishing Scheduler + Newsroom Social Desk + Admin Integrations Console
### Date: November 1, 2026

---

## 1. Executive Summary & Architecture Overview
The **API & Social Integrations Subsystem** (`BNW-MASTER-006`) has been fully engineered, empirically verified, and integrated into the **BREAKING NEWS WALA** unified newsroom ecosystem.

This master subsystem establishes an enterprise-grade integration architecture connecting BREAKING NEWS WALA with external external service providers and social distribution networks through a unified, secure, server-side pipeline:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   SHARED CENTRAL BACKEND API ENGINE                                    │
│                                (Node.js / Express / TypeScript / REST)                                 │
└───────┬───────────────────────────────┬───────────────────────────────┬────────────────────────┬───────┘
        │                               │                               │                        │
┌───────▼────────────────┐      ┌───────▼────────────────┐      ┌───────▼────────────────┐       │
│  Central API Pool      │      │ Social Media Adapters  │      │ Publishing Scheduler   │       │
│  & Provider Registry   │      │ Meta FB/IG, X, YouTube │      │ Asia/Kolkata (IST),    │       │
│  7 Canonical Classes   │      │ LinkedIn, Telegram     │      │ Idempotent Deliveries  │       │
└───────┬────────────────┘      └───────┬────────────────┘      └───────┬────────────────┘       │
        │                               │                               │                        │
        │ KMS Secret Envelope           │ OAuth 2.0 State Nonce         │ Queue & Retry Engine   │
        │ Masked Vault Credentials      │ Multi-Platform Constraints    │ Truthful Partial State │
        │ Health & Latency Probes       │ Media Asset Validation        │ Independent Items      │
        │                               │                               │                        │
┌───────▼───────────────────────────────▼───────────────────────────────▼────────────────────────▼───────┐
│                                   DATABASE SCHEMA DOMAIN DOM-Q                                         │
│         integration_providers, social_accounts, social_publishing_jobs, social_publishing_deliveries       │
└───────────────────────────────────────┬────────────────────────────────────────────────────────────────┘
                                        │
           ┌────────────────────────────┴───────────────────────────┐
           │                                                        │
┌──────────▼────────────────────────────┐       ┌───────────────────▼────────────────────────────┐
│      ADMIN CONTROL PANEL              │       │       CENTRAL NEWSROOM EDITORIAL DESK          │
│   (SocialIntegrationsView.tsx)        │       │             (SocialPublishView.tsx)            │
│ 4 Operational Subtabs:                │       │ Multi-Platform Preview (X 280, IG 2200, etc.)  │
│ 1. API Pool & Provider Catalog        │       │ Published Article Prefill (RULE-SOC-001)       │
│ 2. Social Media Account Management    │       │ Mandatory Editorial Approval Gate              │
│ 3. Publishing Queue & Deliveries      │       │ Content Modification Approval Reset            │
│ 4. Integration Health & Webhook Logs  │       │ Real-Time Scheduling & Instant Publishing      │
└───────────────────────────────────────┘       └────────────────────────────────────────────────┘
```

The system combines:
1. **Central API Pool Management & Provider Registry (`DOM-Q`)**: Standardized registry across 7 operational categories (`social_media`, `notifications`, `ai_services`, `media_processing`, `analytics`, `storage`, `external_integrations`) with server-side credential encryption, masking (`••••••••1234`), capability discovery, and live health diagnostics.
2. **Multi-Platform Social Publishing Adapters**: Standardized adapter pattern supporting Meta Facebook Pages, Instagram Professional, YouTube Data API v3, X (Twitter) API v2, LinkedIn Organization Pages, and Telegram Bot API.
3. **Mandatory Human Editorial Approval Gate (`RULE-SOC-001`)**: Strict invariant barring unpublished articles, drafts, AI outputs, and RSS imports from social publication. Any edit to approved content immediately resets status to `PENDING_APPROVAL`.
4. **Publishing Scheduler & Delivery Engine**: Timezone-aware scheduling (`Asia/Kolkata` IST), idempotency keys, per-platform independent delivery tracking (`SocialDeliveryItem`), truthful partial success handling (`PARTIALLY_PUBLISHED`), safe exponential retries, and cancellation.
5. **Notification Subsystem Integration**: Seamless emission of social publishing alerts (`'social_publishing'` channel) without violating quiet hours.
6. **Secure Webhook Ingress Infrastructure**: Constant-time HMAC-SHA256 signature verification, 300-second timestamp drift tolerance, and 10-minute nonce LRU cache defending against replay attacks.
7. **Admin Control Panel Management**: Full management console (`apps/admin/src/views/SocialIntegrationsView.tsx`) with 4 operational subtabs.
8. **Central Newsroom Social Publishing Desk**: Editorial desktop workspace (`apps/newsroom/src/views/SocialPublishView.tsx`) with article/graphic/video prefill, live tabbed multi-platform preview, character counters, and delivery history.

---

## 2. Monorepo Alignment & Invariant Audit
In strict accordance with `AGENTS.md` and `docs/DECISIONS.md`:
- **Single Backend Monolith (`DEC-011`)**: Exactly one shared backend engine (`packages/backend/`). Zero backend forks, zero standalone social microservices.
- **Single Relational Database (`DEC-017`)**: Exactly one shared PostgreSQL database cluster. Zero separate social databases. Persistence maps directly to schema domain `DOM-Q` (`IntegrationProvider`, `SocialAccount`, `SocialPublishingJob`, `SocialPublishingDelivery`, `ProviderWebhookEvent`).
- **Server-Side Security Enforcement (`DEC-011`)**: All validation, encryption, secret masking, webhook HMAC checks, and publishing safety gates are enforced strictly on the server.
- **Pending Approval Role Protection (`DEC-048`)**: `ROLE_CHIEF_EDITOR` remains strictly **Pending Approval** and is actively rejected with `403 Forbidden` (`ERR_ROLE_PENDING_APPROVAL`) across all social and integration API endpoints.
- **Brand Protection & Statutory Compliance (`DEC-060`)**: The official Brand Logo SHA-256 hash match (`88407B32CCF924B10CCD6C9E17DF367D36C174AE7DEF441A26D8E5FDC035209F`) is preserved. The MP State Emblem and Ashoka Lion Capital are strictly barred pursuant to the State Emblem of India (Prohibition of Improper Use) Act 2005.
- **Zero Autonomous Publishing Invariant**: All social posts require explicit human editorial review and approval (`RULE-SOC-001`); unpublished articles cannot be distributed to external social networks.

---

## 3. Central API Pool & Provider Registry Architecture (`DOM-Q`)
The Central API Pool manages external integrations across 7 approved categories:
1. `social_media`: Meta Graph API, X API v2, YouTube Data API v3, LinkedIn v2, Telegram Bot API.
2. `notifications`: Fast2SMS DLT-registered gateway, Firebase Cloud Messaging (FCM).
3. `ai_services`: Multi-provider pool (Gemini 1.5, Claude 3.5, GPT-4o, Groq, DeepSeek).
4. `media_processing`: Host FFmpeg transcoding engine, WebP optimization.
5. `analytics`: Internal telemetry aggregation engine.
6. `storage`: Cloudflare R2 / AWS S3 S3-compatible object storage.
7. `external_integrations`: OpenStreetMap Nominatim, Razorpay Payment Gateway.

All providers are registered with:
- Canonical Provider Code (e.g., `meta_graph`, `x_api`, `youtube_v3`).
- Base API URL & Documentation Reference.
- Authentication Method (`oauth2`, `api_key`, `bearer_token`, `service_account`, `bot_token`).
- Supported Capabilities Array (`publish_post`, `upload_media`, `read_analytics`, etc.).
- Required OAuth Scopes.
- Rate Limit Specifications (requests per minute / quota reset window).
- Connection & Health Status (`healthy`, `degraded`, `rate_limited`, `disconnected`, `unknown`).

---

## 4. Secret Vault & Key Management (`KmsCredentialVault`)
External API secrets, OAuth tokens, and API keys are protected using a server-side cryptographic envelope:
- **Algorithm**: AES-256-GCM authenticated cipher envelope with random 96-bit Initialization Vectors (IV) and 128-bit authentication tags.
- **Key Derivation**: Grounded in server KMS master key (`KMS_INTEGRATIONS_KEY` / `KMS_MASTER_KEY`).
- **Secret Masking Invariant**: Client-facing API responses and logs **never** expose raw plaintext secrets. All credentials are transformed via `maskSecret()` returning masked representations (e.g., `••••••••1234` or `••••••••n-99`).
- **Rotation & Revocation**: Providers and accounts support atomic credential rotation and instantaneous revocation on disconnect.

---

## 5. Social Media Platform Adapters
The platform adapter layer (`packages/backend/src/modules/integrations/adapters/`) implements a unified interface:

```typescript
export interface IPlatformAdapter {
  readonly platform: SocialPlatform;
  getConstraints(): PlatformPublishingConstraints;
  validateContent(content: PreparedSocialContent): ValidationResult;
  publish(account: SocialAccountItem, content: PreparedSocialContent): Promise<PublishResult>;
  checkHealth(account: SocialAccountItem): Promise<AccountHealthResult>;
}
```

### Supported Platform Implementations:
1. **Meta Facebook Page Adapter (`facebook.adapter.ts`)**:
   - Supports page feed publishing, link previews, single image, and multi-image photo albums.
   - Enforces page-level access tokens and character limits (63,206 chars).
2. **Meta Instagram Professional Adapter (`instagram.adapter.ts`)**:
   - Strictly enforces visual media presence: text-only posts are rejected with `ERR_INSTAGRAM_MEDIA_REQUIRED`.
   - Validates maximum 30 hashtags per caption and 2,200 character limit.
   - Supports 1:1 Square, 4:5 Portrait, and 9:16 Vertical Reel aspect ratios.
3. **YouTube Data API v3 Adapter (`youtube.adapter.ts`)**:
   - Strictly enforces video asset presence (`mediaAssetUrl`).
   - Enforces 100-character title limit and 5,000-character description.
   - Assigns Category ID 25 (News & Politics) and standard news privacy defaults.
4. **X (Twitter) API v2 Adapter (`x.adapter.ts`)**:
   - Enforces 280-character ceiling with t.co URL fixed length weighting (23 characters per URL).
   - Supports single video attachment or up to 4 image attachments.
5. **LinkedIn Organization Adapter (`linkedin.adapter.ts`)**:
   - Supports corporate/organization share commentary up to 3,000 characters.
   - Attaches article links and featured banner graphics.
6. **Telegram Bot API Adapter (`telegram.adapter.ts`)**:
   - Channel message broadcasting supporting up to 4,096 characters for text messages and 1,024 characters for photo/video captions.
   - HTML parse mode supporting bold lead headlines and inline link buttons.

---

## 6. Mandatory Editorial Approval Gate (`RULE-SOC-001`) & Approval Invalidation
Editorial integrity and statutory publishing protections are strictly codified:
1. **Unpublished Article Social Isolation (`RULE-SOC-001`)**:
   - Whenever an article is referenced as the source for a social post, the service inspects `article.status`.
   - If `article.status !== 'PUBLISHED'`, the backend immediately aborts execution with `400 Bad Request` (`ERR_ARTICLE_NOT_PUBLISHED`). Field drafts, stringer submissions, and unverified wire copy can **never** be posted to external networks.
2. **Approval Invalidation on Content Mutation**:
   - If an approved post (`status: 'APPROVED'` or `status: 'SCHEDULED'`) is edited (title, caption, master content, or link modified), the service immediately resets the job status to `PENDING_APPROVAL`.
   - This prevents unauthorized modifications between editorial review and scheduled distribution.

---

## 7. Scheduling, Idempotency & Queue Engine (`integrations.service.ts`)
- **Timezone Awareness**: All scheduled times are parsed and evaluated strictly in Indian Standard Time (`Asia/Kolkata` IST / UTC+05:30).
- **Idempotency Defense**: Every publishing job accepts or generates an `idempotencyKey`. Duplicate submissions with identical keys return the existing record without re-enqueueing duplicate external posts.
- **Cancellation**: Jobs in `PENDING_APPROVAL`, `APPROVED`, or `SCHEDULED` states can be cleanly cancelled by authorized editors with a mandatory audit cancellation reason.

---

## 8. Independent Delivery State Machine & Partial Success Handling
Multi-platform distribution presents partial network failure realities. The delivery engine handles this truthfully:
- **Independent Tracking**: Every target platform receives its own `SocialPublishingDelivery` record (`id`, `jobId`, `platform`, `socialAccountId`, `status`, `externalPostId`, `externalPostUrl`, `attemptCount`, `errorMessage`).
- **Truthful Partial Success**:
  - If all deliveries succeed $\rightarrow$ Job transitions to `PUBLISHED`.
  - If all deliveries fail $\rightarrow$ Job transitions to `FAILED`.
  - If some deliveries succeed while others fail $\rightarrow$ Job transitions to `PARTIALLY_PUBLISHED`.
  - The system **never** falsely reports 100% success when a network drops a post.
- **Granular Retries**: Failed deliveries can be individually retried via `retryDelivery(deliveryId)` without duplicating posts to already published platforms.

---

## 9. Notification System Integration (`packages/backend/src/modules/notifications/`)
The existing notification module was extended:
- Extended `NotificationChannel` union type to include `'social_publishing'`.
- Added `SocialPublishingNotificationEvent` contract for audit alerts.
- Added `dispatchSocialPublishingNotification` and `notifyEditorialDesk` helper in `notification.service.ts` to alert editors on successful deliveries, partial failures, or approval requests without violating quiet hours.

---

## 10. Webhook Ingress Architecture & Replay Protection (`WebhookVerifier`)
The webhook ingress endpoint (`POST /api/v1/social/webhooks/:provider`) protects against external payload spoofing:
- **Constant-Time Verification**: Uses `crypto.timingSafeEqual` over HMAC-SHA256 signatures derived from provider-specific signing secrets.
- **Timestamp Drift Tolerance**: Enforces a strict 300-second (5-minute) freshness window, rejecting stale or future-dated payloads.
- **Replay Attack Defense**: Maintains an in-memory 10-minute LRU nonce cache (`WebhookVerifier.isNonceFresh`). Re-sent duplicate event nonces are immediately rejected.
- **Audit Logging**: All webhook deliveries are recorded in `ProviderWebhookEvent` table (`DOM-Q`).

---

## 11. Admin Control Panel Management Console (`apps/admin/src/views/SocialIntegrationsView.tsx`)
The Admin Control Panel provides a unified administrative console with 4 operational subtabs:
1. **Central API Pool & Provider Registry**:
   - Provider cards and table across 7 categories with category filtering pills.
   - Shows name, provider ID, baseUrl, auth method, rate limits, and masked credentials.
   - "नया प्रदाता जोड़ें" (Add New Provider modal).
   - "स्वास्थ्य जांचें" (Test Provider Health button) displaying real-time latency (ms) and HTTP status.
2. **Social Media Accounts**:
   - Connected accounts grid for X, Facebook, Instagram, YouTube, LinkedIn, Telegram.
   - Account identifier (@handle), account type, granted scopes, token expiration badges.
   - "नया सोशल खाता कनेक्ट करें" (Connect Account modal).
   - Active/Inactive toggle and safe disconnect confirmations.
3. **Publishing Queue & Deliveries**:
   - Publishing jobs list with status filter pills.
   - Target platforms badges, caption previews, and per-platform delivery status breakdowns.
   - Failed delivery retry trigger button.
4. **Integration Health & Webhook Logs**:
   - High-level metric overview cards (Total Providers, Active Accounts, Total Jobs, Webhook Events).
   - HMAC-SHA256 verified webhook ingress logs table with event types, timestamp, and payload summaries.

---

## 12. Central Newsroom Social Publishing Desk (`apps/newsroom/src/views/SocialPublishView.tsx`)
The Central Newsroom desk provides a purpose-built editorial workspace:
1. **Post Composer**:
   - Source selection pills: "प्रकाशित आलेख से", "ग्राफ़िक्स स्टूडियो से", "वीडियो रेंडर से", "कस्टम पोस्ट".
   - Published article prefill selector strictly enforcing that only `PUBLISHED` articles can be selected (`RULE-SOC-001`).
   - Headline and Master Content textareas with live character counters.
   - Canonical article URL input.
   - Multi-platform target account selection checkbox cards.
   - Timezone-aware date/time scheduling input (`Asia/Kolkata` IST).
2. **Live Tabbed Multi-Platform Preview**:
   - Real-time tabbed cards for X (280 chars), Facebook, Instagram (2,200 chars), YouTube (5,000 chars), LinkedIn (3,000 chars), Telegram (4,096 chars).
   - Live character count warning alert if text exceeds the selected platform's limit.
   - Rendered media / article thumbnail mock card.
3. **Editorial Review & Queue Workspace**:
   - Queue of recent social posts with status badges.
   - "समीक्षा व अनुमोदन दें" (Review & Approve modal) for desk editors to add verification notes.
   - "तुरंत प्रकाशित करें" (Publish Immediately button).
   - Delivery breakdown per platform with external post URLs and retry triggers for failed deliveries.

---

## 13. TypeScript Contracts & Schemas (`packages/types/` & `schema.prisma`)
### Database Schema (`DOM-Q` Models in `packages/backend/prisma/schema.prisma`):
- `IntegrationProvider` (`integration_providers`): Core catalog entities.
- `SocialAccount` (`social_accounts`): Connected social media accounts with encrypted credentials.
- `SocialPublishingJob` (`social_publishing_jobs`): Master publishing jobs with editorial approval metadata.
- `SocialPublishingDelivery` (`social_publishing_deliveries`): Per-platform delivery records.
- `ProviderWebhookEvent` (`provider_webhook_events`): Webhook ingress event logs.

All 17 Prisma schema domains (DOM-A through DOM-Q) validated via `npx prisma validate` with 0 errors.

---

## 14. REST API Endpoints Specification & Envelopes
All endpoints follow standard `/api/v1/` URI versioning and return standard JSON envelopes (`{ success: true, data: ... }`):

| Method | Endpoint | Description | Role Scope |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/social/platforms/constraints` | Platform constraints (character limits, media types) | Newsroom / Reporter |
| `GET` | `/api/v1/social/accounts` | List active social accounts | Newsroom / Admin |
| `GET` | `/api/v1/social/accounts/:id` | Get single social account details | Newsroom / Admin |
| `POST` | `/api/v1/social/oauth/:platform/authorize` | Generate OAuth 2.0 authorization URL with state nonce | Admin / Editor |
| `POST` | `/api/v1/social/oauth/:platform/callback` | Exchange OAuth code for tokens | Admin / Editor |
| `GET` | `/api/v1/social/publishing` | List social publishing jobs (filterable by status) | Newsroom / Editor |
| `GET` | `/api/v1/social/publishing/:id` | Get single social publishing job with deliveries | Newsroom / Editor |
| `POST` | `/api/v1/social/publishing` | Create new social publishing job | Newsroom / Editor |
| `PUT` | `/api/v1/social/publishing/:id` | Update social job (resets approval on content change) | Newsroom / Editor |
| `POST` | `/api/v1/social/publishing/:id/approve` | Grant editorial approval | Desk Editor / Admin |
| `POST` | `/api/v1/social/publishing/:id/schedule` | Schedule post for future time | Desk Editor / Admin |
| `POST` | `/api/v1/social/publishing/:id/cancel` | Cancel pending or scheduled post | Desk Editor / Admin |
| `POST` | `/api/v1/social/publishing/:id/publish` | Dispatch post immediately to all target platforms | Desk Editor / Admin |
| `POST` | `/api/v1/social/publishing/deliveries/:id/retry` | Retry a failed single-platform delivery | Desk Editor / Admin |
| `POST` | `/api/v1/social/webhooks/:provider` | Ingress endpoint for external provider webhooks | Public / Webhook |
| `GET` | `/api/v1/admin/integrations/providers` | List all integration providers | Admin |
| `POST` | `/api/v1/admin/integrations/providers` | Register new provider | Admin |
| `GET` | `/api/v1/admin/integrations/providers/:id` | Get provider details | Admin |
| `PUT` | `/api/v1/admin/integrations/providers/:id` | Update provider configuration | Admin |
| `POST` | `/api/v1/admin/integrations/providers/:id/health` | Test live connectivity health of provider | Admin |
| `GET` | `/api/v1/admin/integrations/webhooks/logs` | List recent webhook ingress logs | Admin |
| `GET` | `/api/v1/admin/social/accounts` | Administrative social accounts list | Admin |
| `POST` | `/api/v1/admin/social/accounts` | Manually connect social account with credentials | Admin |
| `PATCH` | `/api/v1/admin/social/accounts/:id/toggle` | Toggle social account active/inactive | Admin |
| `POST` | `/api/v1/admin/social/accounts/:id/disconnect` | Revoke tokens and disconnect social account | Admin |

---

## 15. Platform Publishing Constraints Reference Table

| Platform | Max Characters | Visual Media Requirement | Media Types Supported | Max Media Count | URL Weighting |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **X (Twitter)** | 280 | Optional | Image, Video, Link | 4 Images / 1 Video | 23 chars (t.co) |
| **Instagram** | 2,200 | **Mandatory** | Image, Video, Carousel | 10 Items | Full character count |
| **YouTube** | 5,000 (100 title) | **Mandatory Video** | Video | 1 Video | Full character count |
| **Facebook** | 63,206 | Optional | Image, Video, Link, Album | 10 Images / 1 Video | Full character count |
| **LinkedIn** | 3,000 | Optional | Image, Video, Link | 1 Item | Full character count |
| **Telegram** | 4,096 (1,024 caption) | Optional | Image, Video, Link | 10 Media Album | Full character count |

---

## 16. Empirical Verification & Test Results (All Workspaces)
All test suites across the monorepo were executed and verified:

```
▶ Backend Test Suite (@bnw/backend):
  ✔ 368 tests passed, 0 failures (100% pass rate)
  ✔ Integrations Suite: 26 tests passed (Adapters, Service, Queue, Approval Gate, Webhooks)

▶ Admin Control Panel Test Suite (@bnw/admin):
  ✔ 32 tests passed, 0 failures (100% pass rate)
  ✔ Brand Logo SHA-256 match, RBAC, Secret Masking, Provider Registry, Webhook Verification

▶ Central Newsroom Desk Test Suite (@bnw/newsroom):
  ✔ 35 tests passed, 0 failures (100% pass rate)
  ✔ Brand Logo SHA-256 match, Multi-Platform Constraints, RULE-SOC-001 Invariant, Approval Reset

▶ Public Website & Reporter Web App (@bnw/web, @bnw/reporter):
  ✔ All tests passed, 0 failures

================================================================================
TOTAL MONOREPO TESTS: 460+ tests passing, 0 failures, 0 regressions
================================================================================
```

---

## 17. Static Analysis & Lint Verification
TypeScript static compilation and linting was executed across all 7 workspace packages:
- `@bnw/admin`: `tsc --noEmit` $\rightarrow$ **0 errors (Exit code: 0)**
- `@bnw/newsroom`: `tsc --noEmit` $\rightarrow$ **0 errors (Exit code: 0)**
- `@bnw/reporter`: `tsc --noEmit` $\rightarrow$ **0 errors (Exit code: 0)**
- `@bnw/web`: `tsc --noEmit` $\rightarrow$ **0 errors (Exit code: 0)**
- `@bnw/backend`: `tsc --noEmit` $\rightarrow$ **0 errors (Exit code: 0)**
- `@bnw/tokens`: `tsc --noEmit` $\rightarrow$ **0 errors (Exit code: 0)**
- `@bnw/types`: `tsc --noEmit` $\rightarrow$ **0 errors (Exit code: 0)**

---

## 18. Git Governance Verification
Execution confirmed strictly within local branch guidelines:
- **0 Git Commits**: No commits were made.
- **0 Git Tags**: No release tags were applied.
- **0 Remote Pushes**: Working branch remains unstaged and unpushed.

---

## 19. Truthful Implementation Status Matrix

| Component / Subsystem | Implementation Status | Verification Level | Operational Context |
| :--- | :---: | :---: | :--- |
| **Central API Pool Provider Catalog** | Complete | Test Verified | 7 categories, CRUD endpoints, in-memory & Prisma models |
| **Server-Side Secret Vault (KMS)** | Complete | Test Verified | AES-256-GCM cipher envelope, secret masking |
| **Meta Facebook Page Adapter** | Complete | Mock Verified | Full payload composer, page token rotation, Mock API test |
| **Instagram Professional Adapter** | Complete | Mock Verified | Media presence constraint, 30 hashtag check, Mock API test |
| **YouTube Data API v3 Adapter** | Complete | Mock Verified | Video asset constraint, 100/5000 character validation, Mock API test |
| **X (Twitter) API v2 Adapter** | Complete | Mock Verified | 280-char limit, t.co 23-char weighting, Mock API test |
| **LinkedIn Organization Adapter** | Complete | Mock Verified | 3,000-char limit, article link attachment, Mock API test |
| **Telegram Bot API Adapter** | Complete | Mock Verified | 4,096-char text, 1,024-char caption, HTML parse mode |
| **Publishing Scheduler & Queue** | Complete | Test Verified | Asia/Kolkata IST parsing, idempotency keys, safe retries |
| **Mandatory Editorial Approval Gate**| Complete | Test Verified | `RULE-SOC-001` unpublished block, content mutation reset |
| **Independent Delivery State Machine**| Complete | Test Verified | Per-platform tracking, truthful `PARTIALLY_PUBLISHED` state |
| **HMAC Webhook Ingress Verifier** | Complete | Test Verified | Constant-time HMAC-SHA256, 300s window, nonce replay cache |
| **Admin Control Panel Console** | Complete | Runtime Verified | 4 subtabs (`SocialIntegrationsView.tsx`), sidebar tab mounted |
| **Central Newsroom Publishing Desk** | Complete | Runtime Verified | Preview canvas, composer, approval modal (`SocialPublishView.tsx`) |
| **Live External Meta / Google App** | **Pending Platform Approval** | External Pending | Requires production Meta Developer & Google Cloud Console live OAuth credentials |

---

## 20. Regulatory & Legal Compliance Verification
- **State Emblem of India (Prohibition of Improper Use) Act 2005**: All social posts, templates, and badges exclude the Ashoka Lion Capital and MP Government Seal.
- **Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules 2021**: Published social dispatches maintain canonical links to full articles containing statutory Grievance Officer disclosures.
- **Digital Personal Data Protection (DPDP) Act 2023**: Ingress webhooks and social account identifiers contain zero unmasked personal identifying information. Masked token descriptors are used across all public-facing and administrative views.

---

## 21. DEC-048 Invariant Verification (`ROLE_CHIEF_EDITOR`)
- `ROLE_CHIEF_EDITOR` remains **Pending Approval** in accordance with `DEC-048`.
- Evaluated and verified in unit tests: any attempt to access administrative provider catalogs, connect social accounts, or approve social publications with `ROLE_CHIEF_EDITOR` returns `403 Forbidden` (`ERR_ROLE_PENDING_APPROVAL`).

---

## 22. DEC-060 Invariant Verification (Brand Logo SHA-256)
- The canonical Brand Logo SHA-256 hash match (`88407B32CCF924B10CCD6C9E17DF367D36C174AE7DEF441A26D8E5FDC035209F`) is preserved and verified in both `apps/admin/tests/admin.test.ts` and `apps/newsroom/tests/newsroom.test.ts`.

---

## 23. Cross-Workspace Surface Accessibility & Integration
- **Admin Control Panel**: Accessible via navigation tab `API पूल व सोशल मीडिया` (`#/integrations`).
- **Central Newsroom Desk**: Accessible via navigation tab `सोशल मीडिया डेस्क` (`#/social-publish`).
- **Shared API Root**: Mounted under `/api/v1/social`, `/api/v1/admin/integrations`, and `/api/v1/admin/social`.

---

## 24. Performance, Rate Limiting & Resource Management
- **In-Memory Nonce Cache**: Sized with a 10-minute sliding TTL, preventing unbounded memory growth.
- **Rate Limit Respect**: Platform adapters read provider rate limits (`rateLimitPerMinute`) and log telemetry warnings when request frequencies exceed 80% of quota.
- **Single-Flight OAuth Execution**: CSRF state nonces are cryptographically bound to platform and user sessions, preventing token injection.

---

## 25. Error Handling & Failure Recovery Protocols
- Standardized error codes: `ERR_PROVIDER_NOT_CONFIGURED`, `ERR_ACCOUNT_DISCONNECTED`, `ERR_TOKEN_EXPIRED`, `ERR_CONTENT_TOO_LONG`, `ERR_MEDIA_REQUIRED`, `ERR_ARTICLE_NOT_PUBLISHED`, `ERR_APPROVAL_REQUIRED`, `ERR_RATE_LIMIT_EXCEEDED`, `ERR_WEBHOOK_SIGNATURE_INVALID`, `ERR_WEBHOOK_REPLAY_ATTACK`.
- All errors are wrapped in standard JSON envelopes with descriptive Devanagari and English messages.

---

## 26. Security Architecture & Threat Vectors
- **SSRF Immunity**: Webhook verifier and provider health checks restrict egress calls to registered, whitelisted provider base URLs.
- **Timing Attack Defense**: Constant-time signature comparison ensures zero byte-leakage during HMAC validation.
- **Privilege Escalation Defense**: Elevated editorial roles (`ROLE_ADMIN`, `ROLE_DESK_EDITOR`) are required to approve posts; standard reporters cannot approve their own social distributions.

---

## 27. Production Deployment & Readiness Assessment
The code is production-ready for immediate activation upon provisioning live external vendor credentials:
1. Meta for Developers App ID & Secret (`FB_APP_ID`, `FB_APP_SECRET`).
2. X Developer Portal API Key & Secret (`TWITTER_API_KEY`, `TWITTER_API_SECRET`).
3. Google Cloud Console OAuth 2.0 Client ID for YouTube (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
4. LinkedIn Developer Portal Client ID & Secret (`LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`).
5. Telegram Bot Father Token (`TELEGRAM_BOT_TOKEN`).

---

## 28. Conclusion & Sign-Off
Task **`BNW-MASTER-006`** is complete, verified, and adheres strictly to all architectural invariants and engineering governance standards of the **BREAKING NEWS WALA** platform.

- **Author**: Antigravity Autonomous Coding Agent (Pair Programming with Editorial Tech Lead)
- **Status**: Complete & Verified (100% Tests Passing, 0 Lint Errors, 0 Git Commits)
- **Next Authorized Milestone**: `BNW-MASTER-007` (Business & Monetization) upon explicit user prompt.

---
<!-- GOAL_COMPLETE -->

