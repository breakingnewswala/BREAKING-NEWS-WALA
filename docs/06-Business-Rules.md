# Master Business Rules Specification (BRD)
## Project: BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
### Document ID: DOC-06-BRD-2026-V1.0
### Confidentiality: Internal Engineering & Product Governance Document

---

## 1. Document Information

| Attribute | Specification Details |
| :--- | :--- |
| **Document Title** | Master Business Rules Specification (BRD) |
| **Document ID** | `DOC-06-BRD-2026-V1.0` |
| **Baseline Version** | `1.0.0` |
| **Document Status** | **Approved Architectural Baseline** |
| **Creation Date** | October 30, 2026 |
| **Target System** | BREAKING NEWS WALA Platform Core (Shared Backend & API Engine) |
| **Target Client Ecosystem** | Web Application (Desktop/Mobile Responsive) & Native Android App (Pure Kotlin + Jetpack Compose) |
| **Authoring Body** | Central Product Governance & Editorial Systems Architecture Board |
| **Approved By** | Head of Product, Chief Editorial Officer, Enterprise Software Architect |
| **Predecessor Dependencies** | `docs/01-PRD.md` (PRD v1.0.0), `docs/02-Features.md` (Features v1.0.0), `docs/03-Plan.md` (Plan v1.0.0), `docs/04-NFR.md` (NFR v1.0.0), `docs/05-Workflows.md` (Workflows v1.0.0) |
| **Document Repository** | `docs/06-Business-Rules.md` |

---

## 2. Purpose and Scope

### 2.1 Executive Purpose
The **Master Business Rules Specification** establishes the authoritative, legally binding, and operationally rigorous logic governing every state transition, data validation, authorization check, territorial boundary, algorithmic workflow, and content lifecycle event across the **BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)** ecosystem. 

This document serves as the single source of truth for engineering teams, quality assurance engineers, product managers, and newsroom editorial supervisors. It bridges high-level requirements (`01-PRD.md`, `02-Features.md`) and technical execution (`03-Plan.md`, `04-NFR.md`, `05-Workflows.md`), guaranteeing that neither human editorial error nor algorithmic failure can compromise the integrity, compliance, and vernacular trust of the news network.

### 2.2 System Scope & Operational Boundaries
This specification governs both client applications and all backend infrastructure:
1. **Shared Central Backend (Single Source of Truth):** All core business rules, permission matrices, validation schemas, and rate limiters MUST be executed and strictly enforced on the central server/cloud backend. Frontend validation is strictly treated as an ergonomic convenience; zero security or business logic checks may trust client assertions.
2. **Web Application Client (Desktop, Tablet, Mobile Browser):** Enforces client-side form ergonomics, real-time Devanagari text-scaling hints, and dashboard UX flows matching backend contracts.
3. **Native Android Application Client (Stage B):** Built exclusively with pure **Kotlin**, **Android SDK**, **Jetpack Compose**, and **Room Local Database**. Enforces identical business logic, offline draft sandboxing, hardware-backed biometric authentication, and strict parity with web rules without employing WebView wrappers.
4. **Third-Party & Auxiliary Integrations:** External AI providers (Gemini, Claude, OpenAI), Cloud Storage (GCS/Firebase), Push Notification Services (FCM/WebPush), and RSS scrapers are strictly bound by the governance rules articulated herein.

---

## 3. Rule Classification Framework

Every business rule within this specification is classified into one of four mandatory compliance categories. Engineers and auditors MUST NOT elevate or treat proposed or pending rules as confirmed.

| Classification | Meaning & Regulatory Weight | Engineering Implementation Directive |
| :--- | :--- | :--- |
| **`Confirmed`** | Explicitly approved, ratified by project documentation (`01-PRD.md`, `02-Features.md`, `05-Workflows.md`), and non-negotiable. | **Mandatory:** Must be implemented in MVP without deviation. Covered by strict automated test suites. |
| **`Proposed`** | Architecturally recommended best practice or security hardening rule pending formal stakeholder sign-off. | **Design-Ready:** Engineered behind feature flags or configuration parameters. |
| **`Pending Approval`** | Business, monetization, or editorial policy requiring executive sign-off before operational activation. | **Gated:** Schema and API scaffolding prepared, but operational activation disabled until formal sign-off. |
| **`Conditional`** | Dynamic rule that activates only upon specific runtime parameters, user privileges, geographical boundaries, or quota states. | **Branching Logic:** Implemented with strict prerequisite guards, role flags, and fallback handling. |

---

## 4. Rule Identification Conventions

### 4.1 Canonical ID Syntax
Every rule is identified by a standardized alphanumeric identifier following the syntax:
```
RULE-[PREFIX]-[SEQUENCE_NUMBER]
```
Where `SEQUENCE_NUMBER` is a three-digit integer formatted with leading zeros (e.g., `001`, `002`).

### 4.2 Module Prefix Registry
- `AUTH`: Authentication, Session Management, Account Security
- `ROLE`: Role-Based Access Control (RBAC) & Privilege Hierarchies
- `USER`: Public Reader Interaction, Preferences & Bookmarks
- `REP`: Field Reporter Onboarding, Territory Binding & Permissions
- `TRUST`: Trusted Reporter Direct-Publishing Governance & Auditing
- `NEWS`: News Content Ingestion, Formatting & Draft Constraints
- `PUB`: Publishing State Machine, Content Gating & Permalinks
- `EDIT`: Newsroom Editorial Review, Moderation & Retractions
- `CAT`: News Taxonomy, Multilingual Slugs & Archival Rules
- `LOC`: Geographic Territory Hierarchy (State/District/Tehsil)
- `RSS`: Administrative RSS Feed & URL Web Scraper Governance
- `AI`: AI Newsroom, Model Processing & Hallucination Prevention
- `GFX`: Graphics Studio, Devanagari Auto-Scaling & Watermarking
- `VID`: Video Studio, Aspect Ratio Rendering & Transcoding
- `NOT`: Push Notifications, Breaking News Ribbons & Frequency Capping
- `API`: AI API Key Pool, Failover & Rotation Mechanics
- `AD`: Advertising Slot Placement, Disclosure & Density Rules
- `REWARD`: Points, Monetization & Referral Incentives
- `ANA`: Privacy-Compliant Telemetry, Readership Metrics & Fraud Detection
- `SEC`: Infrastructure Security, Audit Logs & Cyber Compliance
- `XPLAT`: Cross-Platform Shared Backend & Native Android Invariants
- `CONF`: Rule Conflict Precedence & Emergency Administrative Override

### 4.3 Standard 16-Field Specification Format
Every rule is documented using the following rigid 16-field specification card:
1. **Rule ID:** Alphanumeric identifier.
2. **Rule Name:** Descriptive title.
3. **Rule Statement:** Normative statement utilizing RFC 2119 keywords (MUST, MUST NOT, SHALL).
4. **Description & Rationale:** In-depth explanation of purpose, operational impact, and newsroom context.
5. **Classification:** Confirmed / Proposed / Pending Approval / Conditional.
6. **Applicable Roles:** Target user personas and system actors.
7. **Applicable Modules:** Affected platform subsystems.
8. **Conditions / Prerequisites:** Triggers and system preconditions.
9. **Expected System Behavior:** Detailed operational flow when preconditions are satisfied.
10. **Prohibited Behavior:** Negative assertions and explicitly disallowed states.
11. **Exception Handling & Error Codes:** Exact error responses, HTTP status, and user-facing notifications.
12. **Enforcement Location:** Backend, Client, or Both.
13. **Related Workflow IDs:** Cross-reference to `05-Workflows.md`.
14. **Related Feature IDs:** Cross-reference to `02-Features.md`.
15. **Related PRD Requirement IDs:** Cross-reference to `01-PRD.md`.
16. **Acceptance Criteria:** Verifiable pass/fail boolean test criteria.


## 5. Authentication and Account Rules (AUTH)

### RULE-AUTH-001: Reporter Registration Mandatory Verification & Identity Capture
- **Rule ID:** `RULE-AUTH-001`
- **Rule Name:** Reporter Registration Mandatory Verification & Identity Capture
- **Rule Statement:** All reporter self-registration applications MUST capture a valid mobile number, full legal name, government identification document (Aadhaar or Press ID), requested primary State, District, Tehsil, and undergo an OTP phone verification handshake before being admitted into the onboarding queue.
- **Description & Rationale:** Field reporting requires journalistic accountability. The system cannot permit anonymous or pseudo-anonymous reporter accounts. Storing verified phone numbers and KYC details ensures legal compliance and credibility across Madhya Pradesh districts.
- **Classification:** `Confirmed`
- **Applicable Roles:** Applicant Reporter, System Guest
- **Applicable Modules:** Authentication & Onboarding, Reporter Management
- **Conditions / Prerequisites:** User submits the Reporter Registration form via Web or Native Android.
- **Expected System Behavior:** The backend sends a 6-digit OTP via SMS with a 300-second TTL. Upon successful OTP verification, the account is created in `PENDING_VERIFICATION` status and an alert is dispatched to the Admin Control Panel.
- **Prohibited Behavior:** The system MUST NOT grant reporter privileges, dashboard access, or drafting capabilities to any account whose phone number is unverified or whose status is `PENDING_VERIFICATION`.
- **Exception Handling & Error Codes:** If OTP delivery fails, return HTTP 503 `ERR_AUTH_SMS_GATEWAY_DOWN`. If OTP is invalid after 3 attempts, lock verification for 15 minutes and return HTTP 429 `ERR_AUTH_OTP_MAX_ATTEMPTS`.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-REP-01`
- **Related Feature IDs:** `FEAT-ADM-005`, `FEAT-USR-001`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-14`
- **Acceptance Criteria:** An applicant cannot access the Reporter Dashboard or invoke news creation APIs until their account has transitioned out of `PENDING_VERIFICATION`.

---
### RULE-AUTH-002: Administrative Approval Mandate for Reporter Activation
- **Rule ID:** `RULE-AUTH-002`
- **Rule Name:** Administrative Approval Mandate for Reporter Activation
- **Rule Statement:** A reporter account in `PENDING_VERIFICATION` status SHALL NOT be activated until an Administrator explicitly reviews the application, verifies assigned jurisdiction, and issues a signed approval transition to `ACTIVE`.
- **Description & Rationale:** Self-activation of reporter accounts presents severe editorial and legal risks. Administrators must review credentials, verify reporter jurisdiction, and prevent overlapping or unauthorized assignments.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Reporter Management, Admin Control Panel
- **Conditions / Prerequisites:** Admin inspects a pending reporter dossier in the Admin Panel and executes the Approve action.
- **Expected System Behavior:** The backend updates the reporter status to `ACTIVE`, records the approving Admin UID and timestamp in the audit log, assigns territorial claims (State, District, Tehsil), and dispatches an activation notification via SMS and email.
- **Prohibited Behavior:** No automated script, cron job, or non-admin user role may transition an account from `PENDING_VERIFICATION` to `ACTIVE`.
- **Exception Handling & Error Codes:** If the Admin rejects the application, a mandatory rejection reason must be supplied. The account transitions to `REJECTED` and an explanation SMS is dispatched.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-REP-01`
- **Related Feature IDs:** `FEAT-ADM-005`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-15`
- **Acceptance Criteria:** API call to `/api/v1/admin/reporters/{id}/approve` fails with HTTP 403 if invoked by any user lacking `ROLE_ADMIN` or `ROLE_SUPER_ADMIN`.

---
### RULE-AUTH-003: Session Token Validity, Expiration & Refresh Rotation
- **Rule ID:** `RULE-AUTH-003`
- **Rule Name:** Session Token Validity, Expiration & Refresh Rotation
- **Rule Statement:** All authenticated user sessions MUST utilize JSON Web Tokens (JWT) where Access Tokens have a maximum lifetime of 15 minutes (900 seconds) and Refresh Tokens have a maximum lifetime of 7 days, enforced with strict Refresh Token Rotation (RTR).
- **Description & Rationale:** Short-lived access tokens mitigate replay and exfiltration risks. Refresh token rotation ensures that compromised refresh tokens trigger immediate session termination upon reuse.
- **Classification:** `Confirmed`
- **Applicable Roles:** Public User, Standard Reporter, Trusted Reporter, Administrator
- **Applicable Modules:** Authentication Engine, Security & Sessions
- **Conditions / Prerequisites:** Client issues an API request with an Authorization header or requests token renewal at `/api/v1/auth/refresh`.
- **Expected System Behavior:** Upon token refresh, the existing refresh token is invalidated immediately and a cryptographically distinct new refresh token pair is issued. If an invalidated refresh token is presented, all child sessions for that user family are instantly revoked.
- **Prohibited Behavior:** The system MUST NOT accept access tokens older than 15 minutes or refresh tokens older than 7 days under any circumstance.
- **Exception Handling & Error Codes:** If token signature is corrupt or expired, return HTTP 401 `ERR_AUTH_TOKEN_EXPIRED`. If token reuse anomaly is detected, return HTTP 401 `ERR_AUTH_SECURITY_BREACH_TERMINATED`.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-USR-01`, `WF-REP-01`, `WF-ADM-01`
- **Related Feature IDs:** `FEAT-USR-001`, `FEAT-ADM-001`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-27`
- **Acceptance Criteria:** Automated test presenting an expired JWT or already-rotated refresh token receives HTTP 401 and cannot access protected endpoints.

---
### RULE-AUTH-004: Public Reader Frictionless Anonymous Access
- **Rule ID:** `RULE-AUTH-004`
- **Rule Name:** Public Reader Frictionless Anonymous Access
- **Rule Statement:** Public users MUST be permitted to read, browse, search, and consume all published news articles, district feeds, categories, and video bullets without being forced to register, login, or provide personal credentials.
- **Description & Rationale:** Vernacular news portals depend on zero-friction discovery for viral reach and high readership in Tier 2/3/4 towns. Mandating sign-up for basic reading causes severe user drop-off.
- **Classification:** `Confirmed`
- **Applicable Roles:** Public User, Anonymous Guest
- **Applicable Modules:** Public Web Portal, Public Android App, Content Delivery
- **Conditions / Prerequisites:** Anonymous client issues GET requests to public news endpoints (`/api/v1/public/news/*`, `/api/v1/public/categories/*`, etc.).
- **Expected System Behavior:** The backend serves the requested public content with HTTP 200 without requiring an Authorization header. Optional local device storage manages client bookmarks and location preferences.
- **Prohibited Behavior:** The system MUST NOT display mandatory sign-up paywalls, modal blockers, or redirect unauthenticated readers away from published articles.
- **Exception Handling & Error Codes:** Interactive actions such as bookmark synchronization across devices, reporting a comment, or earning referral points require authentication and prompt a friendly sign-in modal.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-USR-01`, `WF-PUB-01`
- **Related Feature IDs:** `FEAT-PUB-001`, `FEAT-PUB-002`, `FEAT-PUB-003`
- **Related PRD Requirement IDs:** `PRD-SEC-11.1`, `PRD-SEC-12`
- **Acceptance Criteria:** An anonymous HTTP GET to `/api/v1/public/news/{slug}` succeeds with HTTP 200 and renders full article payload.

---
### RULE-AUTH-005: Administrative Multi-Factor Authentication (MFA) Enforcement
- **Rule ID:** `RULE-AUTH-005`
- **Rule Name:** Administrative Multi-Factor Authentication (MFA) Enforcement
- **Rule Statement:** All users possessing `ROLE_ADMIN` or `ROLE_SUPER_ADMIN` MUST successfully complete Multi-Factor Authentication (Time-based One-Time Password via TOTP Authenticator or SMS/Email OTP) before gaining access to the Admin Control Panel.
- **Description & Rationale:** The Admin Control Panel controls central newsroom publishing, user permissions, and API keys. Single-factor credential compromise could lead to widespread publication of malicious or defamatory news.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Admin Control Panel, Authentication Engine
- **Conditions / Prerequisites:** User with administrative privileges submits valid username/email and password.
- **Expected System Behavior:** The backend responds with HTTP 206 `STATUS_MFA_REQUIRED` and a temporary 3-minute MFA challenge token. Full administrative JWT claims are withheld until the valid TOTP code is provided.
- **Prohibited Behavior:** The system MUST NOT issue an active administrative session token based solely on primary password authentication.
- **Exception Handling & Error Codes:** If MFA challenge fails 3 times, lock the admin account for 30 minutes, alert other Super Admins, and log an `AUDIT_ADMIN_MFA_FAILED` event.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-ADM-01`
- **Related Feature IDs:** `FEAT-ADM-001`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-27`
- **Acceptance Criteria:** Admin panel routes reject access tokens lacking the verified MFA claim `amr: ["mfa"]` with HTTP 403.

---
### RULE-AUTH-006: Account Suspension & Immediate Token Invalidation
- **Rule ID:** `RULE-AUTH-006`
- **Rule Name:** Account Suspension & Immediate Token Invalidation
- **Rule Statement:** When an account is flagged as `SUSPENDED` or `TERMINATED` by an Administrator, the backend MUST immediately revoke all active access and refresh tokens across all web and mobile devices within a maximum latency of 5 seconds.
- **Description & Rationale:** If a rogue reporter or compromised account is detected, editorial operations must have the capability to instantly kill all active sessions and block any in-flight requests.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** User Governance, Session Management
- **Conditions / Prerequisites:** Administrator executes account suspension in Admin Control Panel.
- **Expected System Behavior:** The backend sets `status = SUSPENDED`, updates `token_valid_after = NOW()`, broadcasts session termination via Redis pub/sub to API gateway instances, and rejects subsequent requests with HTTP 403 `ERR_ACCOUNT_SUSPENDED`.
- **Prohibited Behavior:** A suspended user MUST NOT be permitted to complete draft saves, news submissions, graphic exports, or API queries.
- **Exception Handling & Error Codes:** None. Account suspension is an immediate operational safeguard.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-ADM-01`, `WF-ERR-02`
- **Related Feature IDs:** `FEAT-ADM-005`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-27`
- **Acceptance Criteria:** A suspended reporter invoking `/api/v1/reporter/news/draft` with a previously valid JWT is immediately blocked with HTTP 403.

---
### RULE-AUTH-007: Brute-Force Rate Limiting & Account Lockout Guard
- **Rule ID:** `RULE-AUTH-007`
- **Rule Name:** Brute-Force Rate Limiting & Account Lockout Guard
- **Rule Statement:** The authentication gateway MUST enforce a rate limit of at most 5 failed login attempts per IP and username combination within a sliding 15-minute window, triggering a temporary 30-minute account lockout upon threshold violation.
- **Description & Rationale:** Protects the portal against automated credential stuffing, dictionary attacks, and dictionary-based brute force on reporter and admin portals.
- **Classification:** `Confirmed`
- **Applicable Roles:** All Roles
- **Applicable Modules:** Authentication Engine, Security Middleware
- **Conditions / Prerequisites:** Consecutive failed login attempts occur from a specific IP address or targeting a specific user identifier.
- **Expected System Behavior:** On the 5th consecutive failure, the system records the violation, sends a security alert to the registered email/SMS, and returns HTTP 429 `ERR_AUTH_ACCOUNT_TEMPORARILY_LOCKED` with a `Retry-After` header of 1800 seconds.
- **Prohibited Behavior:** The system MUST NOT disclose in error messages whether the username or password specifically was incorrect.
- **Exception Handling & Error Codes:** Administrators may manually unlock an account via the Admin Control Panel after identity verification.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-USR-01`, `WF-ADM-01`
- **Related Feature IDs:** `FEAT-ADM-001`, `FEAT-USR-001`
- **Related PRD Requirement IDs:** `PRD-SEC-27`
- **Acceptance Criteria:** The 6th failed login request within 15 minutes is rejected with HTTP 429 without querying password hashes.

---
### RULE-AUTH-008: Password Complexity & Cryptographic Hashing Standard
- **Rule ID:** `RULE-AUTH-008`
- **Rule Name:** Password Complexity & Cryptographic Hashing Standard
- **Rule Statement:** All account passwords MUST contain at least 8 characters including one uppercase letter, one lowercase letter, one digit, and one special character, and MUST be stored using Argon2id or bcrypt (work factor >= 12) with unique salt.
- **Description & Rationale:** Ensures that user and editorial passwords withstand offline dictionary and rainbow table cracking attacks in the event of an unauthorized database dump.
- **Classification:** `Confirmed`
- **Applicable Roles:** Standard Reporter, Trusted Reporter, Administrator, Super Admin
- **Applicable Modules:** Authentication Engine
- **Conditions / Prerequisites:** User sets or resets their password during registration or account settings update.
- **Expected System Behavior:** The backend validates password entropy against complexity regex. Passwords failing the check are rejected with HTTP 422. Valid passwords are cryptographically salted and hashed before persistence.
- **Prohibited Behavior:** The system MUST NOT store plaintext passwords, reversible encrypted passwords, or legacy MD5/SHA1 hashes under any circumstance.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-REP-01`, `WF-ADM-01`
- **Related Feature IDs:** `FEAT-USR-001`, `FEAT-ADM-001`
- **Related PRD Requirement IDs:** `PRD-SEC-27`
- **Acceptance Criteria:** Submitting a password lacking required entropy fails validation; verified DB records contain only Argon2id or bcrypt hashes.

---
### RULE-AUTH-009: Password Reset & Account Recovery Protocol
- **Rule ID:** `RULE-AUTH-009`
- **Rule Name:** Password Reset & Account Recovery Protocol
- **Rule Statement:** Password reset links or recovery OTPs MUST have a maximum lifespan of 15 minutes, be single-use only, invalidate all other pending recovery tokens for that user, and require multi-step verification.
- **Description & Rationale:** Account takeover via intercepted or dangling reset links is a major vector for compromised editorial access.
- **Classification:** `Proposed`
- **Applicable Roles:** Standard Reporter, Trusted Reporter, Administrator
- **Applicable Modules:** Authentication Engine, User Governance
- **Conditions / Prerequisites:** User requests a password reset from the login screen.
- **Expected System Behavior:** The backend generates a cryptographically secure 256-bit random token stored with SHA-256 hash in Redis with a 900-second TTL. The reset email/SMS is dispatched. Once utilized, the token is deleted immediately.
- **Prohibited Behavior:** The system MUST NOT send cleartext passwords via email or SMS or allow multiple active reset tokens simultaneously.
- **Exception Handling & Error Codes:** If user account is suspended, reset requests are silently acknowledged to prevent account enumeration but no message is sent.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-REP-01`, `WF-ADM-01`
- **Related Feature IDs:** `FEAT-USR-001`, `FEAT-ADM-001`
- **Related PRD Requirement IDs:** `PRD-SEC-27`
- **Acceptance Criteria:** Reusing a password reset link a second time results in HTTP 400 `ERR_AUTH_RESET_TOKEN_INVALID`.

---
### RULE-AUTH-010: Account Deletion & Statutory Data Retention Boundary
- **Rule ID:** `RULE-AUTH-010`
- **Rule Name:** Account Deletion & Statutory Data Retention Boundary
- **Rule Statement:** When a public reader or reporter requests account deletion, personal identifiable information (PII) MUST be anonymized or purged within 30 days pursuant to the Digital Personal Data Protection (DPDP) Act, while journalistic published articles, editorial audit logs, and authorship attribution SHALL be retained indefinitely for legal compliance.
- **Description & Rationale:** Under Indian press and cyber law, journalistic publications must retain immutable editorial attribution and audit trails even if a former reporter leaves or requests account deletion.
- **Classification:** `Proposed`
- **Applicable Roles:** Public User, Standard Reporter, Administrator
- **Applicable Modules:** User Governance, Audit & Compliance
- **Conditions / Prerequisites:** User initiates "Delete My Account" from profile settings.
- **Expected System Behavior:** The system flags the account as `PENDING_DELETION`. After a 14-day grace period, PII (phone number, hashed password, personal email, IP history) is scrubbed. Published news records retain the reporter’s canonical byline identifier linked to an archived institutional record.
- **Prohibited Behavior:** Account deletion MUST NOT cascade-delete or unpublish historical news stories authored by the reporter.
- **Exception Handling & Error Codes:** Accounts under active legal hold or cyber investigations cannot be deleted until cleared by Legal Counsel.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-USR-01`, `WF-REP-01`
- **Related Feature IDs:** `FEAT-ADM-005`, `FEAT-USR-001`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-27`
- **Acceptance Criteria:** Executing account deletion removes personal contact data while historical news permalinks and bylines remain intact and publicly resolvable.

---


## 6. Roles and Permission Rules (ROLE & USER)

### RULE-ROLE-001: Strict Role-Based Access Control (RBAC) Hierarchy
- **Rule ID:** `RULE-ROLE-001`
- **Rule Name:** Strict Role-Based Access Control (RBAC) Hierarchy
- **Rule Statement:** Every user identity MUST be bound to at least one explicit system role (`ROLE_PUBLIC_USER`, `ROLE_REPORTER_STANDARD`, `ROLE_REPORTER_TRUSTED`, `ROLE_ADMIN`, `ROLE_SUPER_ADMIN`), and all protected API endpoints MUST enforce strict authorization filters corresponding to the minimum privilege required.
- **Description & Rationale:** A solid RBAC structure ensures complete separation between anonymous readers, district reporters, fast-track reporters, newsroom editors, and platform administrators.
- **Classification:** `Confirmed`
- **Applicable Roles:** All Roles
- **Applicable Modules:** Authorization Engine, API Gateway
- **Conditions / Prerequisites:** Any HTTP/REST or WebSocket request received on non-public endpoints.
- **Expected System Behavior:** The security gateway extracts the user role claims from the cryptographically verified JWT, checks the route permission definition, and either allows execution or returns HTTP 403 `ERR_FORBIDDEN_INSUFFICIENT_PERMISSIONS`.
- **Prohibited Behavior:** Clients MUST NOT be granted access based on client-side routing, query string flags, or unverified JWT claims.
- **Exception Handling & Error Codes:** Endpoints with public scope bypass RBAC checks according to RULE-PUB-001.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-USR-01`, `WF-REP-01`, `WF-ADM-01`
- **Related Feature IDs:** `FEAT-ADM-005`
- **Related PRD Requirement IDs:** `PRD-SEC-10`
- **Acceptance Criteria:** A user with `ROLE_REPORTER_STANDARD` attempting to invoke `/api/v1/admin/*` receives HTTP 403 Forbidden.

---
### RULE-ROLE-002: Least Privilege Principle for Editorial Personas
- **Rule ID:** `RULE-ROLE-002`
- **Rule Name:** Least Privilege Principle for Editorial Personas
- **Rule Statement:** Standard Reporters (`ROLE_REPORTER_STANDARD`) SHALL have permissions strictly confined to drafting news, editing own drafts, uploading field media, submitting to the editorial queue, and rendering raw-script graphics; they SHALL NOT have permissions to approve news, direct-publish, modify system settings, or view stories outside their jurisdiction.
- **Description & Rationale:** Prevents unauthorized newsroom alterations and enforces the fundamental editorial separation between field reporting and editorial publishing.
- **Classification:** `Confirmed`
- **Applicable Roles:** Standard Reporter
- **Applicable Modules:** Reporter Dashboard, Newsroom Editorial Desk
- **Conditions / Prerequisites:** Standard reporter interacts with the platform.
- **Expected System Behavior:** API endpoints filter all query results by `author_id == current_user.id` and restrict status mutations strictly to `DRAFT -> PENDING_REVIEW`.
- **Prohibited Behavior:** Standard reporters MUST NOT access RSS feeds, URL scrapers, user management, category administration, or direct-publish endpoints.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-CRE-01`, `WF-RGFX-01`
- **Related Feature IDs:** `FEAT-CRE-001`, `FEAT-RGFX-001`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-11.2`, `PRD-SEC-14`
- **Acceptance Criteria:** A standard reporter attempting to transition a news status to `PUBLISHED` via API receives HTTP 403.

---
### RULE-ROLE-003: Prohibition of Self-Permission Elevation
- **Rule ID:** `RULE-ROLE-003`
- **Rule Name:** Prohibition of Self-Permission Elevation
- **Rule Statement:** No user role, including Administrators, SHALL have the capability to elevate their own permissions, grant themselves `ROLE_SUPER_ADMIN`, or assign themselves Trusted Reporter status without authorization by an existing Super Admin.
- **Description & Rationale:** Mitigates insider threats and privilege escalation attacks within the newsroom management tier.
- **Classification:** `Confirmed`
- **Applicable Roles:** Standard Reporter, Trusted Reporter, Administrator
- **Applicable Modules:** User Governance, Security Middleware
- **Conditions / Prerequisites:** User invokes role modification or permission update endpoints.
- **Expected System Behavior:** The backend verifies that the acting user holds `ROLE_SUPER_ADMIN` and that `target_user_id != acting_user_id` for critical privilege grants. Changes are logged with immutable audit records.
- **Prohibited Behavior:** An Administrator MUST NOT modify their own role or bypass authorization matrices.
- **Exception Handling & Error Codes:** Emergency break-glass procedures require two independent administrative credentials.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-ADM-01`
- **Related Feature IDs:** `FEAT-ADM-005`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-27`
- **Acceptance Criteria:** An Admin attempting to grant themselves Super Admin privileges receives HTTP 403 `ERR_AUTH_SELF_ELEVATION_DENIED`.

---
### RULE-ROLE-004: Immutable Role Assignment Auditing
- **Rule ID:** `RULE-ROLE-004`
- **Rule Name:** Immutable Role Assignment Auditing
- **Rule Statement:** Every grant, revocation, or alteration of user roles and permissions MUST create an immutable, append-only audit log entry capturing actor UID, target UID, previous role, assigned role, reason, timestamp, and client IP.
- **Description & Rationale:** Regulatory governance and editorial accountability demand an indelible paper trail for all access modifications.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Audit & Compliance, Reporter Governance
- **Conditions / Prerequisites:** Any role mutation API is invoked.
- **Expected System Behavior:** The backend writes the audit record to a dedicated, write-only audit collection before returning the success response to the client.
- **Prohibited Behavior:** The system MUST NOT provide any API, dashboard control, or backend script to delete or alter historical audit logs.
- **Exception Handling & Error Codes:** If writing to the audit datastore fails, the entire transaction MUST abort and rollback with HTTP 500.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-ADM-01`
- **Related Feature IDs:** `FEAT-ADM-005`
- **Related PRD Requirement IDs:** `PRD-SEC-27`
- **Acceptance Criteria:** Auditing table shows an immutable row for every executed permission change; row deletion is prevented by DB constraints.

---
### RULE-ROLE-005: Public Reader Authorization Boundaries
- **Rule ID:** `RULE-ROLE-005`
- **Rule Name:** Public Reader Authorization Boundaries
- **Rule Statement:** Users holding `ROLE_PUBLIC_USER` SHALL have permissions strictly confined to reading published content, managing their personal profile/bookmarks, and submitting feedback; they SHALL NOT access any newsroom drafting or administrative capabilities.
- **Description & Rationale:** Public readers are consumers of content and must have zero interface with internal editorial workflows.
- **Classification:** `Confirmed`
- **Applicable Roles:** Public User
- **Applicable Modules:** Public Web Portal, Public Android App
- **Conditions / Prerequisites:** Logged-in public reader invokes platform endpoints.
- **Expected System Behavior:** All reader interactions are routed through public or personal user API scopes (`/api/v1/user/*`). Calls to `/api/v1/reporter/*` or `/api/v1/admin/*` are immediately blocked with HTTP 403.
- **Prohibited Behavior:** Public readers MUST NOT be able to view unapproved drafts, reporter identities beyond public bylines, or system metrics.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-USR-01`, `WF-USR-02`
- **Related Feature IDs:** `FEAT-USR-001`, `FEAT-PUB-001`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-11.1`
- **Acceptance Criteria:** A public user account JWT cannot authenticate against reporter or admin endpoints.

---
### RULE-ROLE-006: Public Reader Data & Bookmark Isolation
- **Rule ID:** `RULE-ROLE-006`
- **Rule Name:** Public Reader Data & Bookmark Isolation
- **Rule Statement:** A public user MUST NOT be permitted to read, modify, or delete saved bookmarks, reading history, or notification preferences belonging to any other user.
- **Description & Rationale:** Protects reader privacy and adheres to data isolation standards in shared multi-tenant databases.
- **Classification:** `Confirmed`
- **Applicable Roles:** Public User
- **Applicable Modules:** User Profile, Personalization
- **Conditions / Prerequisites:** User interacts with bookmark or profile APIs.
- **Expected System Behavior:** The backend injects `user_id = current_user.id` into all database queries, preventing horizontal privilege escalation.
- **Prohibited Behavior:** Passing another user's ID in query parameters or URL path MUST NOT reveal or modify that user's saved items.
- **Exception Handling & Error Codes:** If ID mismatch is detected, return HTTP 403 `ERR_ACCESS_DENIED_TENANT_ISOLATION`.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-USR-02`
- **Related Feature IDs:** `FEAT-USR-001`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-27`
- **Acceptance Criteria:** Accessing `/api/v1/user/bookmarks?user_id=OTHER_ID` returns only the calling user's data or rejects with HTTP 403.

---
### RULE-ROLE-007: Super Admin Exclusive Privileges
- **Rule ID:** `RULE-ROLE-007`
- **Rule Name:** Super Admin Exclusive Privileges
- **Rule Statement:** Only users holding `ROLE_SUPER_ADMIN` SHALL have the authority to manage system-wide API keys, configure third-party AI provider credentials, execute destructive database purges, and delete user accounts.
- **Description & Rationale:** Critical system-level operations carry catastrophic risk if exposed to general editorial staff or subordinate admins.
- **Classification:** `Conditional`
- **Applicable Roles:** Super Admin
- **Applicable Modules:** Admin Control Panel, API Pool Management
- **Conditions / Prerequisites:** Invocation of high-privilege configuration or security endpoints.
- **Expected System Behavior:** The backend verifies `current_user.hasRole("ROLE_SUPER_ADMIN")` and requires re-entry of password/MFA challenge before executing sensitive operations.
- **Prohibited Behavior:** Standard Administrators (`ROLE_ADMIN`) MUST NOT view raw API keys or delete other administrative accounts.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-ADM-01`, `WF-API-01`
- **Related Feature IDs:** `FEAT-ADM-001`, `FEAT-API-001`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-23`
- **Acceptance Criteria:** An Admin with `ROLE_ADMIN` attempting to access `/api/v1/admin/api-pool/keys` receives HTTP 403.

---
### RULE-ROLE-008: Role Invalidation upon User Deactivation
- **Rule ID:** `RULE-ROLE-008`
- **Rule Name:** Role Invalidation upon User Deactivation
- **Rule Statement:** When an account is deactivated or marked inactive, all associated roles and authorization tokens SHALL be revoked immediately in real time across all active sessions.
- **Description & Rationale:** Ensures that departing staff, terminated reporters, or flagged accounts lose access immediately upon status change.
- **Classification:** `Confirmed`
- **Applicable Roles:** All Roles
- **Applicable Modules:** User Governance, Session Management
- **Conditions / Prerequisites:** User status changes to `INACTIVE`, `SUSPENDED`, or `DELETED`.
- **Expected System Behavior:** Session cache in Redis is deleted, JWT blacklist is updated with the user ID, and active WebSocket connections are terminated.
- **Prohibited Behavior:** Deactivated users MUST NOT be able to utilize unexpired access tokens for the remainder of their TTL.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-ADM-01`
- **Related Feature IDs:** `FEAT-ADM-005`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-27`
- **Acceptance Criteria:** API gateway immediately returns HTTP 401/403 for any request from a deactivated user account.

---


## 7. Reporter Territory Rules (REP)

### RULE-REP-001: Mandatory Territory Binding to State, District & Tehsil
- **Rule ID:** `RULE-REP-001`
- **Rule Name:** Mandatory Territory Binding to State, District & Tehsil
- **Rule Statement:** Every reporter account MUST be explicitly bound to at least one State, one District, and optionally one or more Tehsils within that District, configured by an Administrator in the master territory registry.
- **Description & Rationale:** Hyperlocal journalism requires clear geographical boundaries to ensure regional authenticity and avoid duplicate or conflicting reporting across jurisdictions.
- **Classification:** `Confirmed`
- **Applicable Roles:** Standard Reporter, Trusted Reporter
- **Applicable Modules:** Reporter Onboarding, Territory Governance
- **Conditions / Prerequisites:** Reporter account activation or territory update by Admin.
- **Expected System Behavior:** The backend stores assigned location identifiers (`state_id`, `district_id`, `tehsil_ids`) in the reporter's database record and embeds them in the authorization claims token.
- **Prohibited Behavior:** A reporter account MUST NOT exist in `ACTIVE` status without at least one assigned District.
- **Exception Handling & Error Codes:** State Bureau Chief correspondents may be assigned multiple districts or entire state scope if granted explicitly by Super Admin.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-REP-01`
- **Related Feature IDs:** `FEAT-ADM-005`, `FEAT-CAT-002`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-14`, `PRD-SEC-21`
- **Acceptance Criteria:** Saving a reporter profile without a valid district selection fails validation with HTTP 422 `ERR_REP_TERRITORY_MANDATORY`.

---
### RULE-REP-002: Cross-District News Submission Prohibition
- **Rule ID:** `RULE-REP-002`
- **Rule Name:** Cross-District News Submission Prohibition
- **Rule Statement:** A reporter MUST NOT create, draft, or submit news stories tagged with any District outside their explicitly assigned territorial jurisdiction; any such submission attempt SHALL be rejected by the backend with HTTP 403.
- **Description & Rationale:** Enforces territorial discipline and prevents reporters assigned to one district (e.g. Niwari) from encroaching upon or submitting news for other districts (e.g. Bhopal or Indore) without editorial authorization.
- **Classification:** `Confirmed`
- **Applicable Roles:** Standard Reporter, Trusted Reporter
- **Applicable Modules:** News Creation Desk, Territory Governance
- **Conditions / Prerequisites:** Reporter initiates draft creation or submission specifying a `district_id`.
- **Expected System Behavior:** The backend verifies that `payload.district_id` exists in `current_user.assigned_districts`. If missing, the request is rejected with HTTP 403 `ERR_REP_OUTSIDE_TERRITORY_JURISDICTION`.
- **Prohibited Behavior:** Reporters MUST NOT override, spoof, or circumvent district binding via API manipulation or UI modifications.
- **Exception Handling & Error Codes:** If a major breaking event spans multiple adjacent districts, the Admin must temporarily grant multi-district assignment to the reporter.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-CRE-01`, `WF-TRU-01`
- **Related Feature IDs:** `FEAT-CRE-001`, `FEAT-CAT-002`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-14`
- **Acceptance Criteria:** An automated test submitting a story for District B from a reporter assigned only to District A returns HTTP 403.

---
### RULE-REP-003: Multi-District Assignment Exclusivity to Admin
- **Rule ID:** `RULE-REP-003`
- **Rule Name:** Multi-District Assignment Exclusivity to Admin
- **Rule Statement:** The assignment of multiple districts to a single reporter account SHALL be an exclusive privilege of Platform Administrators and MUST require a recorded editorial justification.
- **Description & Rationale:** Prevents dilution of local reporting quality by ensuring multi-district privileges are reserved only for senior roaming correspondents or regional bureau leads.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Reporter Management, Territory Governance
- **Conditions / Prerequisites:** Admin assigns a second or subsequent district to a reporter.
- **Expected System Behavior:** The system validates that the acting user has `ROLE_ADMIN`, captures the mandatory justification text, and records an `AUDIT_MULTI_DISTRICT_ASSIGNED` event.
- **Prohibited Behavior:** No reporter self-service interface or automated rule may grant multi-district assignments.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-REP-01`, `WF-ADM-01`
- **Related Feature IDs:** `FEAT-ADM-005`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-21`
- **Acceptance Criteria:** Assigning more than 1 district without Admin authorization fails with HTTP 403.

---
### RULE-REP-004: Territory Jurisdictional Fallback for Breaking State Events
- **Rule ID:** `RULE-REP-004`
- **Rule Name:** Territory Jurisdictional Fallback for Breaking State Events
- **Rule Statement:** When a news event is classified as `STATE_BREAKING_OVERRIDE` by Central Newsroom, an assigned reporter in any district MAY submit field updates under that master story with automatic attribution to their home district.
- **Description & Rationale:** Allows rapid crowd-sourced newsroom collaboration during state-wide emergencies (e.g., elections, natural disasters) without violating core territory rules.
- **Classification:** `Conditional`
- **Applicable Roles:** Standard Reporter, Trusted Reporter
- **Applicable Modules:** News Creation Desk, Central Newsroom
- **Conditions / Prerequisites:** Active story has flag `is_state_breaking == true` and allows regional field inputs.
- **Expected System Behavior:** Reporter submits a localized field dispatch linked to the master story parent ID. The dispatch is tagged with the reporter's home district and routed to the central editorial review queue.
- **Prohibited Behavior:** Field reporters MUST NOT modify the master state story title, featured banner, or core body text directly.
- **Exception Handling & Error Codes:** Requires prior activation of State Breaking mode on the story by Central Newsroom.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-CRE-01`, `WF-EDT-01`
- **Related Feature IDs:** `FEAT-CRE-001`, `FEAT-ADM-009`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-16`
- **Acceptance Criteria:** A reporter can submit updates to an approved state-breaking story, but cannot alter the parent headline or publish independently.

---
### RULE-REP-005: Dynamic Territory Revocation & Reassignment Impact
- **Rule ID:** `RULE-REP-005`
- **Rule Name:** Dynamic Territory Revocation & Reassignment Impact
- **Rule Statement:** When an Administrator revokes or alters a reporter's assigned territory, all previously published news SHALL remain permanently attributed to that reporter and territory, while in-progress drafts for revoked districts SHALL be locked from further editing.
- **Description & Rationale:** Maintains historical journalistic records while preventing reporters from continuing to write for jurisdictions they no longer cover.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Standard Reporter
- **Applicable Modules:** Reporter Management, Newsroom Drafts
- **Conditions / Prerequisites:** Admin removes a district from a reporter's active assignments.
- **Expected System Behavior:** The backend updates the reporter profile. Any drafts belonging to the revoked district are marked `LOCKED_TERRITORY_CHANGED` and transferred to the Central Newsroom pool.
- **Prohibited Behavior:** Historical published news MUST NOT be altered, deleted, or reassigned to a different district due to reporter transfer.
- **Exception Handling & Error Codes:** Admin may explicitly reassign ownership of locked drafts to a new district reporter.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-REP-01`, `WF-ADM-01`
- **Related Feature IDs:** `FEAT-ADM-005`, `FEAT-CAT-002`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-21`
- **Acceptance Criteria:** A reporter whose assignment was changed from Niwari to Tikamgarh can no longer update unsubmitted Niwari drafts.

---
### RULE-REP-006: Mandatory Location Geotagging & Metadata Validation
- **Rule ID:** `RULE-REP-006`
- **Rule Name:** Mandatory Location Geotagging & Metadata Validation
- **Rule Statement:** Every news submission filed by a reporter MUST include valid geographical metadata containing State, District, and specific Tehsil or Village name matching the master location database.
- **Description & Rationale:** Ensures that all published vernacular stories can be accurately mapped to district edition pages and local notification feeds.
- **Classification:** `Confirmed`
- **Applicable Roles:** Standard Reporter, Trusted Reporter
- **Applicable Modules:** News Creation Desk, Location Governance
- **Conditions / Prerequisites:** Reporter submits a story for editorial review or publication.
- **Expected System Behavior:** The backend validates that the supplied `location_id` corresponds to an active, valid entry in the master location table and falls within the reporter's assigned territory.
- **Prohibited Behavior:** The system MUST NOT accept stories with null, undefined, or arbitrary unverified free-text location strings.
- **Exception Handling & Error Codes:** If a village is not yet registered in the Tehsil database, the reporter may select "Other Village" under the valid Tehsil and provide the name in a designated field.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-CRE-01`
- **Related Feature IDs:** `FEAT-CRE-001`, `FEAT-CAT-002`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-21`
- **Acceptance Criteria:** Submitting a story with an invalid `location_id` or an unassigned district fails with HTTP 422.

---


## 8. News Creation Rules (NEWS)

### RULE-NEWS-001: Reporter News Creation Restricted to Raw Script & Field Notes
- **Rule ID:** `RULE-NEWS-001`
- **Rule Name:** Reporter News Creation Restricted to Raw Script & Field Notes
- **Rule Statement:** Reporters MUST create news articles strictly via manual raw text input, field notes, structured forms, and local media uploads; reporters SHALL NOT be provided with or permitted to use automated URL scraping or RSS feed ingestion capabilities.
- **Description & Rationale:** This is a foundational non-negotiable architectural invariant of BREAKING NEWS WALA. Field reporters must report original grassroots news from their districts rather than aggregating internet links.
- **Classification:** `Confirmed`
- **Applicable Roles:** Standard Reporter, Trusted Reporter
- **Applicable Modules:** News Creation Desk, Reporter Dashboard
- **Conditions / Prerequisites:** Reporter accesses the News Creation interface or invokes creation APIs.
- **Expected System Behavior:** The Reporter Dashboard exposes only the raw script creation desk (Title, Body, Category, Location, Media Attachments). URL-to-News and RSS tools are completely hidden from UI and blocked at the API gateway.
- **Prohibited Behavior:** The system MUST NOT provide reporters with URL scrapers, RSS importers, or external web ingest endpoints.
- **Exception Handling & Error Codes:** None. URL and RSS ingestion are strictly Admin-only capabilities.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-CRE-01`
- **Related Feature IDs:** `FEAT-CRE-001`, `FEAT-RSS-001`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-11.2`, `PRD-SEC-14`, `PRD-SEC-17.2`
- **Acceptance Criteria:** Calling `/api/v1/reporter/news/import-url` or `/api/v1/reporter/news/rss-ingest` returns HTTP 403 Forbidden.

---
### RULE-NEWS-002: Total Prohibition of URL & RSS Import for Reporters
- **Rule ID:** `RULE-NEWS-002`
- **Rule Name:** Total Prohibition of URL & RSS Import for Reporters
- **Rule Statement:** Any API request attempting to invoke URL parsing, web article scraping, or RSS feed ingestion under a Reporter role identity SHALL be rejected immediately with HTTP 403 `ERR_ACTION_ADMIN_ONLY`.
- **Description & Rationale:** Reinforces RULE-NEWS-001 at the API layer, guaranteeing that no customized client or script can bypass UI restrictions.
- **Classification:** `Confirmed`
- **Applicable Roles:** Standard Reporter, Trusted Reporter
- **Applicable Modules:** API Gateway, Ingestion Engine
- **Conditions / Prerequisites:** Incoming API request to any URL/RSS scraping endpoint.
- **Expected System Behavior:** API Gateway inspects role claims and aborts processing if the caller lacks `ROLE_ADMIN` or `ROLE_SUPER_ADMIN`.
- **Prohibited Behavior:** Reporters MUST NOT be permitted to bypass manual reporting via automated web scrapers.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-CRE-01`, `WF-RSS-01`, `WF-URL-01`
- **Related Feature IDs:** `FEAT-CRE-001`, `FEAT-ADM-009`, `FEAT-ADM-010`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-17.1`, `PRD-SEC-17.2`
- **Acceptance Criteria:** Automated penetration tests using reporter tokens against admin scraping endpoints result in HTTP 403.

---
### RULE-NEWS-003: Headline Length, Structure & Devanagari Character Constraints
- **Rule ID:** `RULE-NEWS-003`
- **Rule Name:** Headline Length, Structure & Devanagari Character Constraints
- **Rule Statement:** All news headlines MUST be composed in Hindi (Devanagari script), contain between 15 and 150 characters, and MUST NOT consist solely of punctuation, emojis, or English Latin characters.
- **Description & Rationale:** Ensures optimal readability, visual balance across web and mobile viewports, and maintains Hindi vernacular brand standards.
- **Classification:** `Confirmed`
- **Applicable Roles:** Standard Reporter, Trusted Reporter, Administrator
- **Applicable Modules:** News Creation Desk, Editorial Desk
- **Conditions / Prerequisites:** Article title is submitted or updated.
- **Expected System Behavior:** The system validates headline length (15-150 chars) and runs a Devanagari script presence check (at least 50% Devanagari Unicode range `U+0900` to `U+097F`). Form displays real-time character counter.
- **Prohibited Behavior:** Headlines shorter than 15 characters, longer than 150 characters, or lacking Devanagari characters MUST NOT be accepted.
- **Exception Handling & Error Codes:** Special technical terms or proper acronyms in English (e.g., "AIIMS", "ISRO") are permitted provided the overall headline remains predominantly Hindi.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-CRE-01`, `WF-EDT-01`
- **Related Feature IDs:** `FEAT-CRE-001`, `FEAT-SEO-001`
- **Related PRD Requirement IDs:** `PRD-SEC-11.2`, `PRD-SEC-12.2`, `PRD-SEC-14`
- **Acceptance Criteria:** Submitting a headline of 10 characters or with zero Devanagari characters fails validation with HTTP 422.

---
### RULE-NEWS-004: Body Content Formatting & Word Count Thresholds
- **Rule ID:** `RULE-NEWS-004`
- **Rule Name:** Body Content Formatting & Word Count Thresholds
- **Rule Statement:** News article body text MUST contain a minimum of 50 words (or 250 characters) and a maximum of 5,000 words, formatted in clean Markdown or sanitized HTML without unapproved script tags or embedded iframes.
- **Description & Rationale:** Prevents shallow clickbait, empty stubs, or excessively massive payloads that degrade reader experience and mobile performance.
- **Classification:** `Confirmed`
- **Applicable Roles:** Standard Reporter, Trusted Reporter, Administrator
- **Applicable Modules:** News Creation Desk, Editorial Desk
- **Conditions / Prerequisites:** Article body is saved or submitted.
- **Expected System Behavior:** The backend sanitizes the HTML/Markdown payload using an allowlist (p, b, i, strong, em, h2, h3, ul, ol, li, blockquote, a) and verifies word count constraints.
- **Prohibited Behavior:** The system MUST NOT persist `<script>`, `<style>`, `<iframe>`, `<embed>`, `<object>`, or `onclick` handlers in news body fields.
- **Exception Handling & Error Codes:** Admin newsroom editors may embed authorized YouTube or Twitter/X embeds via approved embed widgets.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-CRE-01`
- **Related Feature IDs:** `FEAT-CRE-001`
- **Related PRD Requirement IDs:** `PRD-SEC-11.2`, `PRD-SEC-14`
- **Acceptance Criteria:** Submitting an article with fewer than 50 words or containing `<script>` tags fails validation with HTTP 422.

---
### RULE-NEWS-005: Mandatory Categorization & Primary District Assignment
- **Rule ID:** `RULE-NEWS-005`
- **Rule Name:** Mandatory Categorization & Primary District Assignment
- **Rule Statement:** Every news article MUST be linked to exactly one primary Category and at least one primary Location (State + District), with an optional secondary sub-category and Tehsil tag.
- **Description & Rationale:** Guarantees that every article correctly renders in its corresponding category archive and district edition page.
- **Classification:** `Confirmed`
- **Applicable Roles:** Standard Reporter, Trusted Reporter, Administrator
- **Applicable Modules:** News Creation Desk, Category Governance
- **Conditions / Prerequisites:** Article creation or update.
- **Expected System Behavior:** The backend verifies that `category_id` and `district_id` represent active entities in the database before saving.
- **Prohibited Behavior:** Uncategorized or orphaned stories without a valid district assignment MUST NOT be saved or published.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-CRE-01`, `WF-CAT-01`
- **Related Feature IDs:** `FEAT-CRE-001`, `FEAT-CAT-001`, `FEAT-CAT-002`
- **Related PRD Requirement IDs:** `PRD-SEC-11.2`, `PRD-SEC-21`
- **Acceptance Criteria:** Saving an article with a null `category_id` fails with HTTP 422 `ERR_NEWS_CATEGORY_REQUIRED`.

---
### RULE-NEWS-006: Media Attachment Integrity & Permitted MIME Types
- **Rule ID:** `RULE-NEWS-006`
- **Rule Name:** Media Attachment Integrity & Permitted MIME Types
- **Rule Statement:** Featured images and attachments MUST be in JPEG, PNG, or WebP format, have a maximum file size of 5 MB, and undergo server-side magic byte inspection and automatic WebP compression.
- **Description & Rationale:** Protects the portal against malware upload, keeps bandwidth costs minimal, and ensures fast mobile page load speeds across regional networks.
- **Classification:** `Confirmed`
- **Applicable Roles:** Standard Reporter, Trusted Reporter, Administrator
- **Applicable Modules:** Media Management, News Creation Desk
- **Conditions / Prerequisites:** User uploads an image or video attachment.
- **Expected System Behavior:** The backend verifies magic bytes, strips EXIF location metadata for privacy, generates WebP variants (thumbnail, card, hero), and uploads to cloud storage.
- **Prohibited Behavior:** Files with executable extensions (.exe, .sh, .php, .js) or disguised MIME types MUST NOT be accepted.
- **Exception Handling & Error Codes:** Video uploads are routed through the dedicated Video Studio pipeline (RULE-VID-001).
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-CRE-01`
- **Related Feature IDs:** `FEAT-MED-001`, `FEAT-MED-002`
- **Related PRD Requirement IDs:** `PRD-SEC-11.2`, `PRD-SEC-27`
- **Acceptance Criteria:** Uploading a 6 MB image or a renamed .exe file returns HTTP 413 or HTTP 415.

---
### RULE-NEWS-007: Duplicate Submission & Plagiarism Hash Detection
- **Rule ID:** `RULE-NEWS-007`
- **Rule Name:** Duplicate Submission & Plagiarism Hash Detection
- **Rule Statement:** The system MUST calculate a normalized text similarity hash (SimHash / MinHash) for every news submission and flag stories exhibiting greater than 85% similarity to an existing article published within the preceding 48 hours.
- **Description & Rationale:** Prevents duplicate reporting, accidental double submissions, and internal plagiarism across district correspondents.
- **Classification:** `Proposed`
- **Applicable Roles:** Standard Reporter, Trusted Reporter, Administrator
- **Applicable Modules:** Editorial Desk, News Processing
- **Conditions / Prerequisites:** Story is submitted to the editorial review queue.
- **Expected System Behavior:** The backend checks the story hash against the 48-hour index. If similarity exceeds 85%, the submission is flagged with a `DUPLICATE_WARNING` badge in the editorial review queue.
- **Prohibited Behavior:** The system MUST NOT silently discard suspected duplicates; human editors must review the comparison diff.
- **Exception Handling & Error Codes:** Official government press releases or identical emergency advisories may be approved with an explicit Admin override flag.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-CRE-01`, `WF-EDT-01`
- **Related Feature IDs:** `FEAT-CRE-001`, `FEAT-ADM-009`
- **Related PRD Requirement IDs:** `PRD-SEC-11.2`, `PRD-SEC-16`
- **Acceptance Criteria:** Submitting identical text twice produces an editorial warning indicating duplicate similarity.

---
### RULE-NEWS-008: Auto-Save Draft Interval & Draft Quota Limits
- **Rule ID:** `RULE-NEWS-008`
- **Rule Name:** Auto-Save Draft Interval & Draft Quota Limits
- **Rule Statement:** Client applications MUST automatically persist article drafts to local storage every 30 seconds during active editing, sync to backend drafts every 60 seconds when online, and enforce a maximum limit of 50 active drafts per reporter.
- **Description & Rationale:** Guarantees that reporters in rural areas do not lose field notes due to battery death or intermittent cellular connectivity, while preventing unbounded draft accumulation.
- **Classification:** `Confirmed`
- **Applicable Roles:** Standard Reporter, Trusted Reporter
- **Applicable Modules:** Reporter Dashboard, Draft Governance
- **Conditions / Prerequisites:** Reporter edits an article in the Web or Android creation desk.
- **Expected System Behavior:** Draft is saved locally and synced to `/api/v1/reporter/news/draft`. The system updates `updated_at` timestamp. If draft count reaches 50, user must submit or delete older drafts.
- **Prohibited Behavior:** Clients MUST NOT trigger backend auto-save requests when no text changes have occurred since the last sync.
- **Exception Handling & Error Codes:** Offline editing buffers drafts in local Room DB on Android or IndexedDB on Web until network reconnection.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-CRE-01`
- **Related Feature IDs:** `FEAT-CRE-001`
- **Related PRD Requirement IDs:** `PRD-SEC-11.2`, `PRD-SEC-14`
- **Acceptance Criteria:** Verifying that edits are saved automatically within 30 seconds and recovered after browser refresh.

---
### RULE-NEWS-009: Reporter Submission Finality to Review Queue
- **Rule ID:** `RULE-NEWS-009`
- **Rule Name:** Reporter Submission Finality to Review Queue
- **Rule Statement:** Once a Standard Reporter submits a draft to the Editorial Review Queue (`status = PENDING_REVIEW`), the article MUST be locked against further reporter modifications until an Editor either approves, requests changes, or rejects it.
- **Description & Rationale:** Prevents race conditions, content tampering, or retroactive changes while editors are reviewing and fact-checking a submission.
- **Classification:** `Confirmed`
- **Applicable Roles:** Standard Reporter
- **Applicable Modules:** News Creation Desk, Editorial Desk
- **Conditions / Prerequisites:** Standard reporter clicks "Submit for Review".
- **Expected System Behavior:** The backend transitions article status from `DRAFT` to `PENDING_REVIEW`, sets `locked_for_review = true`, and notifies the Central Newsroom desk in real time.
- **Prohibited Behavior:** Standard reporters MUST NOT edit the article while in `PENDING_REVIEW` status.
- **Exception Handling & Error Codes:** Reporters may retract a submission back to `DRAFT` before review has begun, provided no editor has opened it.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-CRE-01`, `WF-EDT-01`
- **Related Feature IDs:** `FEAT-CRE-001`, `FEAT-ADM-009`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-11.2`, `PRD-SEC-16`
- **Acceptance Criteria:** Attempting to update a `PENDING_REVIEW` article as a standard reporter returns HTTP 403 `ERR_NEWS_LOCKED_IN_REVIEW`.

---
### RULE-NEWS-010: Profanity & Hate Speech Real-Time Sanitization
- **Rule ID:** `RULE-NEWS-010`
- **Rule Name:** Profanity & Hate Speech Real-Time Sanitization
- **Rule Statement:** All news submissions MUST be scanned against a centralized Hindi and English profanity, hate speech, and communal incitement keyword dictionary, automatically flagging high-risk submissions for mandatory senior editorial clearance.
- **Description & Rationale:** Ensures strict adherence to Press Council of India standards, Indian IT Act compliance, and communal harmony in regional reporting.
- **Classification:** `Confirmed`
- **Applicable Roles:** Standard Reporter, Trusted Reporter, Administrator
- **Applicable Modules:** Content Moderation, Editorial Desk
- **Conditions / Prerequisites:** Article submission or update.
- **Expected System Behavior:** The text moderation service scans title and body. If sensitive or prohibited terms are detected, the story is tagged with `CONTENT_RISK_FLAG` and cannot be published without secondary editorial clearance.
- **Prohibited Behavior:** Stories with critical communal or violent keywords MUST NOT bypass editorial review even if submitted by a Trusted Reporter.
- **Exception Handling & Error Codes:** Legitimate journalistic crime reporting may be cleared by an Administrator with an explicit content rating flag.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-CRE-01`, `WF-EDT-01`
- **Related Feature IDs:** `FEAT-CRE-001`, `FEAT-ADM-009`
- **Related PRD Requirement IDs:** `PRD-SEC-11.2`, `PRD-SEC-27`
- **Acceptance Criteria:** Submitting a test story containing prohibited incitement keywords halts auto-publishing and flags the review desk.

---


## 9. Editorial and Publishing Rules (EDIT & TRUST)

### RULE-EDIT-001: Standard Reporter Mandatory Editorial Review Gate
- **Rule ID:** `RULE-EDIT-001`
- **Rule Name:** Standard Reporter Mandatory Editorial Review Gate
- **Rule Statement:** All news submissions authored by Standard Reporters (`ROLE_REPORTER_STANDARD`) MUST pass through the Editorial Review Queue (`status = PENDING_REVIEW`) and cannot be published without explicit approval by an authorized Newsroom Editor or Administrator.
- **Description & Rationale:** Guarantees that unvetted field reporting undergoes rigorous fact-checking, legal scrutiny, grammar correction, and headline optimization before reaching the public domain.
- **Classification:** `Confirmed`
- **Applicable Roles:** Standard Reporter, Administrator, Super Admin
- **Applicable Modules:** Newsroom Review Desk, Editorial Governance
- **Conditions / Prerequisites:** Standard reporter clicks "Submit for Review" on a completed draft.
- **Expected System Behavior:** The backend transitions story status from `DRAFT` to `PENDING_REVIEW`, assigns a sequential queue ticket, and broadcasts a real-time event to the Admin Central Newsroom dashboard.
- **Prohibited Behavior:** The system MUST NOT permit a Standard Reporter to bypass the review queue or publish directly to the live website or mobile app.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-CRE-01`, `WF-EDT-01`
- **Related Feature IDs:** `FEAT-CRE-001`, `FEAT-ADM-009`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-11.2`, `PRD-SEC-16`
- **Acceptance Criteria:** API call to `/api/v1/reporter/news/publish` by a Standard Reporter fails with HTTP 403 Forbidden.

---
### RULE-EDIT-002: Trusted Reporter Fast-Track Publishing Authorization
- **Rule ID:** `RULE-EDIT-002`
- **Rule Name:** Trusted Reporter Fast-Track Publishing Authorization
- **Rule Statement:** A Trusted Reporter (`ROLE_REPORTER_TRUSTED`) SHALL have the privileged capability to publish news stories directly (`status = PUBLISHED`) strictly within their assigned district territory without pre-publication editorial review.
- **Description & Rationale:** Empowers verified, high-credibility senior correspondents to break rapid breaking news from district headquarters without waiting for central newsroom queue clearance.
- **Classification:** `Conditional`
- **Applicable Roles:** Trusted Reporter
- **Applicable Modules:** News Creation Desk, Fast-Track Publishing
- **Conditions / Prerequisites:** Reporter possesses the explicit `CAN_DIRECT_PUBLISH` permission claim and the article location matches their assigned district.
- **Expected System Behavior:** The backend validates territorial authority, transitions status directly from `DRAFT` to `PUBLISHED`, purges edge cache, and broadcasts an immediate alert to the Central Newsroom.
- **Prohibited Behavior:** Trusted Reporters MUST NOT direct-publish stories tagged with any district outside their assigned territory or bypass profanity/content risk filters.
- **Exception Handling & Error Codes:** If the story triggers automated content risk flags (RULE-NEWS-010), direct publishing is suspended and routed to `PENDING_REVIEW`.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-TRU-01`, `WF-PUB-01`
- **Related Feature IDs:** `FEAT-CRE-017`, `FEAT-ADM-005`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-14`
- **Acceptance Criteria:** A Trusted Reporter submitting a clean story within their assigned district achieves `PUBLISHED` status immediately with HTTP 200.

---
### RULE-EDIT-003: Territorial Boundary Restriction on Trusted Publishing
- **Rule ID:** `RULE-EDIT-003`
- **Rule Name:** Territorial Boundary Restriction on Trusted Publishing
- **Rule Statement:** A Trusted Reporter attempting to direct-publish an article tagged with a District outside their assigned jurisdiction MUST have direct-publishing blocked and the submission automatically redirected to the Central Newsroom review queue.
- **Description & Rationale:** Prevents even senior reporters from unilaterally publishing news outside their geographic beat.
- **Classification:** `Confirmed`
- **Applicable Roles:** Trusted Reporter
- **Applicable Modules:** News Creation Desk, Territory Governance
- **Conditions / Prerequisites:** Trusted Reporter attempts direct-publish for an unassigned district.
- **Expected System Behavior:** The backend detects the territorial mismatch, falls back to `PENDING_REVIEW` status, and responds with HTTP 202 `STATUS_REROUTED_TO_EDITORIAL_REVIEW`.
- **Prohibited Behavior:** The system MUST NOT allow Trusted Reporters to direct-publish stories outside their allocated district.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-TRU-01`, `WF-EDT-01`
- **Related Feature IDs:** `FEAT-CRE-017`, `FEAT-CAT-002`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-21`
- **Acceptance Criteria:** Direct publish for an unassigned district results in `PENDING_REVIEW` status rather than `PUBLISHED`.

---
### RULE-EDIT-004: Real-Time Newsroom Alert on Trusted Reporter Publication
- **Rule ID:** `RULE-EDIT-004`
- **Rule Name:** Real-Time Newsroom Alert on Trusted Reporter Publication
- **Rule Statement:** Whenever a Trusted Reporter executes a direct-publish action, the system MUST dispatch an instant, high-priority notification toast and sound alert to the Central Newsroom desk, displaying headline, author byline, and district.
- **Description & Rationale:** Maintains editorial oversight by alerting central editors the second a story goes live, enabling instant review or retraction if discrepancies emerge.
- **Classification:** `Confirmed`
- **Applicable Roles:** Trusted Reporter, Administrator, Super Admin
- **Applicable Modules:** Central Digital Newsroom, Notification Engine
- **Conditions / Prerequisites:** Article successfully transitions to `PUBLISHED` via Trusted Reporter direct-publishing.
- **Expected System Behavior:** The backend publishes a WebSocket event to the `/newsroom/trusted-feed` channel, triggering a prominent UI toast on active editor screens and adding the item to the "Recently Published" audit dock.
- **Prohibited Behavior:** Trusted reporter publications MUST NOT occur silently without notifying newsroom monitors.
- **Exception Handling & Error Codes:** If WebSocket connection drops, client reconnects and polls the recent audit log.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-TRU-01`, `WF-NOT-03`
- **Related Feature IDs:** `FEAT-CRE-017`, `FEAT-ADM-009`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-16`
- **Acceptance Criteria:** Admin dashboard receives a WebSocket push message within 1 second of trusted publication.

---
### RULE-EDIT-005: Editorial Rejection Mandatory Reason & Reporter Feedback
- **Rule ID:** `RULE-EDIT-005`
- **Rule Name:** Editorial Rejection Mandatory Reason & Reporter Feedback
- **Rule Statement:** When an Editor or Administrator rejects a submitted article (`status = REJECTED`), they MUST provide a structured rejection reason and actionable editorial notes, which SHALL be transmitted to the reporter in real time.
- **Description & Rationale:** Constructive feedback fosters field reporting quality and prevents arbitrary or unexplained story dismissals.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin, Standard Reporter
- **Applicable Modules:** Newsroom Review Desk, Reporter Dashboard
- **Conditions / Prerequisites:** Editor clicks "Reject Story" in the Editorial Review Desk.
- **Expected System Behavior:** The system prompts for rejection category (Fact Accuracy, Grammar, Duplicate, Defamatory, Poor Media) and free-text guidance. Story status transitions to `REJECTED`, draft unlocks for reporter revision, and an alert is delivered to the reporter dashboard.
- **Prohibited Behavior:** The system MUST NOT permit an Editor to submit a rejection without selecting a reason category and providing at least 10 characters of guidance.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-EDT-02`
- **Related Feature IDs:** `FEAT-ADM-009`, `FEAT-CRE-001`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-16`
- **Acceptance Criteria:** Submitting a rejection with empty notes fails validation with HTTP 422 `ERR_REJECTION_REASON_REQUIRED`.

---
### RULE-EDIT-006: Editorial In-Place Modification vs. Version History Preservation
- **Rule ID:** `RULE-EDIT-006`
- **Rule Name:** Editorial In-Place Modification vs. Version History Preservation
- **Rule Statement:** Editors and Administrators SHALL have the authority to edit headlines, body copy, and media of submitted or published articles directly; however, every modification MUST create a new immutable version snapshot in the story history table.
- **Description & Rationale:** Ensures newsrooms can polish copy rapidly while maintaining complete forensic audit trails for legal defense and journalistic provenance.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Central Newsroom Desk, Audit & Compliance
- **Conditions / Prerequisites:** Editor updates content of a `PENDING_REVIEW` or `PUBLISHED` article.
- **Expected System Behavior:** The backend writes the updated payload to the master story table and creates a snapshot in `story_revisions` storing editor UID, previous text, new text diff, and timestamp.
- **Prohibited Behavior:** Edits MUST NOT overwrite the original database row without archiving the prior revision.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-EDT-01`
- **Related Feature IDs:** `FEAT-ADM-009`
- **Related PRD Requirement IDs:** `PRD-SEC-16`, `PRD-SEC-27`
- **Acceptance Criteria:** Inspecting `story_revisions` confirms a new revision row created for every editorial edit.

---
### RULE-EDIT-007: Instant Retraction & Unpublishing by Editorial Admin
- **Rule ID:** `RULE-EDIT-007`
- **Rule Name:** Instant Retraction & Unpublishing by Editorial Admin
- **Rule Statement:** An Administrator MUST have the capability to instantly unpublish or retract any live article (`status = RETRACTED`), purging it from public feeds and CDN caches within a maximum SLA of 5 seconds.
- **Description & Rationale:** Immediate emergency kill-switch for erroneous reporting, defamatory claims, or legal take-down notices.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Central Newsroom Desk, Cache Management
- **Conditions / Prerequisites:** Admin clicks "Retract Story" and confirms modal prompt.
- **Expected System Behavior:** Story status transitions to `RETRACTED`. Backend issues instant CDN cache purge headers and WebSocket invalidation events. Public requests to the story URL render the canonical retraction notice.
- **Prohibited Behavior:** Non-admin reporters MUST NOT have the capability to retract or unpublish a published article.
- **Exception Handling & Error Codes:** In extreme defamation cases, the story may be substituted with an official editorial clarification note.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-EDT-03`
- **Related Feature IDs:** `FEAT-ADM-009`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-16`, `PRD-SEC-27`
- **Acceptance Criteria:** A retracted story is unresolvable from public API within 5 seconds of button execution.

---
### RULE-EDIT-008: Immediate Revocation of Trusted Reporter Privilege on Violation
- **Rule ID:** `RULE-EDIT-008`
- **Rule Name:** Immediate Revocation of Trusted Reporter Privilege on Violation
- **Rule Statement:** If a Trusted Reporter publishes inaccurate, unverified, defamatory, or policy-violating content, an Administrator MUST have the operational capability to revoke their `ROLE_REPORTER_TRUSTED` privilege immediately, demoting the account to `ROLE_REPORTER_STANDARD`.
- **Description & Rationale:** Maintains strict editorial control and accountability. Fast-track publishing is an earned privilege that can be terminated in one click.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Reporter Management, Editorial Governance
- **Conditions / Prerequisites:** Admin invokes privilege revocation in the Reporter Management panel.
- **Expected System Behavior:** The system updates user role to `ROLE_REPORTER_STANDARD`, sets `trusted_status = false`, invalidates active JWT claims, and logs an `AUDIT_TRUSTED_PRIVILEGE_REVOKED` record.
- **Prohibited Behavior:** A demoted reporter MUST NOT be able to direct-publish subsequent stories.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-ADM-01`
- **Related Feature IDs:** `FEAT-ADM-005`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-14`
- **Acceptance Criteria:** Subsequent publish API calls by the demoted reporter return HTTP 403 requiring editorial review.

---
### RULE-EDIT-009: Scheduled Publishing Chronometer & State Machine
- **Rule ID:** `RULE-EDIT-009`
- **Rule Name:** Scheduled Publishing Chronometer & State Machine
- **Rule Statement:** Articles scheduled for future release (`status = SCHEDULED`) MUST NOT be accessible via public APIs, and SHALL transition automatically to `status = PUBLISHED` at the exact UTC timestamp configured via backend background workers.
- **Description & Rationale:** Enables newsrooms to embargo press releases, special features, and planned investigative stories until specific release hours.
- **Classification:** `Proposed`
- **Applicable Roles:** Administrator, Super Admin, Trusted Reporter
- **Applicable Modules:** Scheduler Engine, Central Newsroom
- **Conditions / Prerequisites:** User selects "Schedule Release" and specifies a valid future ISO 8601 timestamp.
- **Expected System Behavior:** The backend stores `scheduled_publish_time`. A recurring chronometer worker polls every 60 seconds and publishes due stories, triggering CDN cache warming and notification triggers.
- **Prohibited Behavior:** Scheduled articles MUST NOT appear in public homepage listings, search indexes, or RSS feeds before release timestamp.
- **Exception Handling & Error Codes:** If scheduled time is in the past, request is rejected with HTTP 422 `ERR_INVALID_SCHEDULE_PAST_TIME`.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-EDT-04`
- **Related Feature IDs:** `FEAT-ADM-009`
- **Related PRD Requirement IDs:** `PRD-SEC-16`
- **Acceptance Criteria:** A scheduled story remains hidden from public view until background worker updates status to `PUBLISHED`.

---
### RULE-EDIT-010: Co-Authoring & Multi-Editor Conflict Locking
- **Rule ID:** `RULE-EDIT-010`
- **Rule Name:** Co-Authoring & Multi-Editor Conflict Locking
- **Rule Statement:** When an Editor opens an article in the Editorial Review Desk, the system MUST acquire an exclusive editing lock with a 10-minute heartbeat TTL, preventing concurrent overwrite conflicts by other newsroom editors.
- **Description & Rationale:** Prevents race conditions where two desk editors simultaneously modify the same reporter submission, causing lost edits.
- **Classification:** `Proposed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Central Newsroom Desk
- **Conditions / Prerequisites:** Editor opens an article in the edit mode.
- **Expected System Behavior:** Backend records `locked_by = current_user.id` and `lock_expires_at = NOW() + 600s` in Redis. Other editors opening the story receive a read-only view with a warning banner indicating who holds the lock.
- **Prohibited Behavior:** The system MUST NOT allow simultaneous concurrent edits to overwrite master text without mutual locking.
- **Exception Handling & Error Codes:** Super Admins can force-release a lock if the assigned editor is unresponsive.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-EDT-01`
- **Related Feature IDs:** `FEAT-ADM-009`
- **Related PRD Requirement IDs:** `PRD-SEC-16`
- **Acceptance Criteria:** Second editor attempting to save an active locked article receives HTTP 409 Conflict.

---


## 10. Public Visibility Rules (PUB)

### RULE-PUB-001: Strict Public Gating to Published Content Only
- **Rule ID:** `RULE-PUB-001`
- **Rule Name:** Strict Public Gating to Published Content Only
- **Rule Statement:** Public website readers, mobile app consumers, and anonymous web crawlers MUST ONLY be served content whose database status is explicitly set to `PUBLISHED` (`status == "published"`).
- **Description & Rationale:** Fundamental security and confidentiality barrier preventing confidential drafts, rejected submissions, internal reporter notes, and pending investigations from leaking.
- **Classification:** `Confirmed`
- **Applicable Roles:** Public User, Anonymous Guest
- **Applicable Modules:** Content Delivery, Public Web Portal, Public Android App
- **Conditions / Prerequisites:** Any public API endpoint or webpage request for news stories.
- **Expected System Behavior:** Database queries on all public routes inject the mandatory filter `WHERE status = "published" AND is_deleted = false AND published_at <= NOW()`. Non-matching items return HTTP 404.
- **Prohibited Behavior:** The system MUST NOT return articles in `DRAFT`, `PENDING_REVIEW`, `REJECTED`, or `SCHEDULED` status to unauthenticated or public reader requests.
- **Exception Handling & Error Codes:** Authenticated authors may preview their own drafts via secure private preview tokens.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-PUB-01`
- **Related Feature IDs:** `FEAT-PUB-001`, `FEAT-PUB-002`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-11.1`
- **Acceptance Criteria:** Public GET request for a `PENDING_REVIEW` story ID returns HTTP 404 Not Found.

---
### RULE-PUB-002: Permanent URL Preservation & 301 Redirection (Zero 404s)
- **Rule ID:** `RULE-PUB-002`
- **Rule Name:** Permanent URL Preservation & 301 Redirection (Zero 404s)
- **Rule Statement:** Once a news article is published, its canonical URL slug MUST be preserved indefinitely; if an Editor alters the headline or slug, the historical slug MUST be registered in a permanent redirect registry that returns HTTP 301 to the new slug.
- **Description & Rationale:** Ensures shared WhatsApp links, social shares, and search engine indexes never break or encounter 404 errors when headlines are refined.
- **Classification:** `Confirmed`
- **Applicable Roles:** Public User, Administrator
- **Applicable Modules:** Routing Engine, SEO & Permalinks
- **Conditions / Prerequisites:** Story slug is modified during editorial update.
- **Expected System Behavior:** Backend records the previous slug in `url_redirects` pointing to `story_id`. Incoming requests to old slug return HTTP 301 Permanent Redirect to the new URL.
- **Prohibited Behavior:** The system MUST NOT allow slug alterations to cause orphaned 404 errors for previously active URLs.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-PUB-02`
- **Related Feature IDs:** `FEAT-SEO-001`
- **Related PRD Requirement IDs:** `PRD-SEC-12.1`, `PRD-SEC-26`
- **Acceptance Criteria:** Requesting an article via its previous URL slug returns HTTP 301 pointing to the active canonical URL.

---
### RULE-PUB-003: Soft Deletion & Tombstone Presentation for Retracted News
- **Rule ID:** `RULE-PUB-003`
- **Rule Name:** Soft Deletion & Tombstone Presentation for Retracted News
- **Rule Statement:** Articles retracted or unpublished SHALL undergo soft deletion (`is_deleted = true`, `status = RETRACTED`); the database row MUST NOT be hard-deleted, and requests to the permalink SHALL render a standardized editorial notice explaining retraction.
- **Description & Rationale:** Preserves journalistic integrity, legal transparency, and audit provenance pursuant to Indian Press Council ethical norms.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Central Newsroom, Public Web Portal
- **Conditions / Prerequisites:** Story is unpublished or retracted.
- **Expected System Behavior:** The system sets `status = RETRACTED`. The public route returns HTTP 410 Gone or a custom 200 page displaying "यह समाचार सम्पादकीय कारणों से वापस ले लिया गया है" (This news has been retracted).
- **Prohibited Behavior:** Hard `DELETE FROM news` SQL statements MUST NOT be executed on published stories.
- **Exception Handling & Error Codes:** Strict court-ordered statutory expungements require Super Admin dual authorization to purge.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-EDT-03`
- **Related Feature IDs:** `FEAT-ADM-009`
- **Related PRD Requirement IDs:** `PRD-SEC-16`, `PRD-SEC-27`
- **Acceptance Criteria:** Navigating to a retracted article URL presents the formal retraction notice rather than a generic server error.

---
### RULE-PUB-004: Anonymous vs. Authenticated Reader Feature Gating
- **Rule ID:** `RULE-PUB-004`
- **Rule Name:** Anonymous vs. Authenticated Reader Feature Gating
- **Rule Statement:** Public readers MAY consume unlimited published news anonymously; however, interactive features including article bookmarking across devices, user comments, WhatsApp breaking news subscriptions, and reward point accrual MUST require authenticated login.
- **Description & Rationale:** Balances zero-friction vernacular discovery with secure identity management for interactive engagement.
- **Classification:** `Confirmed`
- **Applicable Roles:** Public User, Anonymous Guest
- **Applicable Modules:** Public Web Portal, Public Android App
- **Conditions / Prerequisites:** Anonymous user clicks "Bookmark Story" or "Subscribe to Alerts".
- **Expected System Behavior:** The application opens an authentication modal offering 1-click Google sign-in or mobile OTP. Upon completion, the requested action executes automatically.
- **Prohibited Behavior:** The system MUST NOT allow anonymous clients to inject unverified comments or accrue monetization points.
- **Exception Handling & Error Codes:** Local browser storage allows temporary bookmarking on that specific device without login.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-USR-01`, `WF-USR-02`
- **Related Feature IDs:** `FEAT-USR-001`, `FEAT-PUB-001`
- **Related PRD Requirement IDs:** `PRD-SEC-11.1`
- **Acceptance Criteria:** Attempting to save a cloud bookmark without an auth token triggers the sign-in modal.

---
### RULE-PUB-005: Cache Invalidation on Story Publication or Modification
- **Rule ID:** `RULE-PUB-005`
- **Rule Name:** Cache Invalidation on Story Publication or Modification
- **Rule Statement:** When an article transitions to `PUBLISHED` or undergoes an editorial update, the backend MUST trigger an automated edge CDN cache purge and Redis cache invalidation for the article page, category page, district page, and homepage ticker within 3 seconds.
- **Description & Rationale:** Guarantees that readers see breaking updates immediately without waiting for CDN TTL expirations.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Trusted Reporter
- **Applicable Modules:** Cache Management, Content Delivery
- **Conditions / Prerequisites:** Article publication, update, or retraction.
- **Expected System Behavior:** The backend dispatches cache purge webhooks to Cloudflare / CDN endpoints and deletes corresponding Redis keys (`news:{id}`, `district:{dist_id}:feed`, `home:ticker`).
- **Prohibited Behavior:** The system MUST NOT rely solely on long TTLs (e.g., > 60 seconds) without active cache purge triggers.
- **Exception Handling & Error Codes:** If CDN API is unreachable, local Redis cache drops immediately and a background retry queue processes the CDN purge.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-PUB-01`
- **Related Feature IDs:** `FEAT-PUB-001`
- **Related PRD Requirement IDs:** `PRD-SEC-12.1`, `PRD-SEC-28`
- **Acceptance Criteria:** Article updates are reflected on public cached endpoints within 3 seconds of publication.

---
### RULE-PUB-006: Territorial News Filtering & District Edition Landing
- **Rule ID:** `RULE-PUB-006`
- **Rule Name:** Territorial News Filtering & District Edition Landing
- **Rule Statement:** When a reader navigates to a district portal (e.g., `/district/niwari`), the system MUST filter the primary newsfeed strictly to stories tagged with that District, sorted in reverse chronological order with pinned breaking news at the top.
- **Description & Rationale:** Core hyperlocal user experience requirement: readers want to see news from their home district without distraction from other regions.
- **Classification:** `Confirmed`
- **Applicable Roles:** Public User
- **Applicable Modules:** Public Web Portal, Public Android App, Location Governance
- **Conditions / Prerequisites:** User visits district URL or selects a district in the app.
- **Expected System Behavior:** The backend executes `WHERE district_id = :target_id AND status = "published" ORDER BY is_pinned DESC, published_at DESC LIMIT 20`.
- **Prohibited Behavior:** Stories from unrelated districts MUST NOT be displayed in the district newsfeed unless marked with `STATE_BREAKING_OVERRIDE`.
- **Exception Handling & Error Codes:** Adjacent regional news blocks may be displayed in a secondary "आस-पास के जिले" (Nearby Districts) sidebar.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-PUB-01`
- **Related Feature IDs:** `FEAT-PUB-004`, `FEAT-CAT-002`
- **Related PRD Requirement IDs:** `PRD-SEC-11.1`, `PRD-SEC-21`
- **Acceptance Criteria:** The Niwari district page renders only stories tagged with Niwari district ID in its primary feed.

---
### RULE-PUB-007: Editorial Ticker & Breaking News Ribbon Precedence
- **Rule ID:** `RULE-PUB-007`
- **Rule Name:** Editorial Ticker & Breaking News Ribbon Precedence
- **Rule Statement:** The Breaking News Ticker displayed at the top of the homepage and mobile app header MUST give display precedence to articles flagged as `is_breaking == true` published within the last 4 hours, capped at a maximum of 5 active items.
- **Description & Rationale:** Ensures urgent breaking developments remain prominent while preventing stale alerts from cluttering the top banner.
- **Classification:** `Confirmed`
- **Applicable Roles:** Public User, Administrator
- **Applicable Modules:** Public Web Portal, Public Android App
- **Conditions / Prerequisites:** Public user loads the homepage or app header.
- **Expected System Behavior:** The backend queries active breaking news (`is_breaking = true AND published_at >= NOW() - 4 HOURS`). If fewer than 5 items exist, it backfills with the most recent top headlines.
- **Prohibited Behavior:** The ticker MUST NOT display breaking items older than 24 hours under any circumstances.
- **Exception Handling & Error Codes:** Administrators may manually unpin or silence a breaking alert before 4 hours elapse.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-PUB-01`
- **Related Feature IDs:** `FEAT-PUB-002`, `FEAT-ADM-009`
- **Related PRD Requirement IDs:** `PRD-SEC-11.1`, `PRD-SEC-12.1`
- **Acceptance Criteria:** Articles marked breaking appear in the top marquee ticker immediately upon publication.

---
### RULE-PUB-008: Search Engine Indexing & Robots Directives for Non-Public States
- **Rule ID:** `RULE-PUB-008`
- **Rule Name:** Search Engine Indexing & Robots Directives for Non-Public States
- **Rule Statement:** All non-published content, preview pages, reporter dashboards, admin consoles, and user profile screens MUST include `X-Robots-Tag: noindex, nofollow` HTTP headers and HTML meta tags.
- **Description & Rationale:** Prevents search engines from crawling unapproved drafts, private dashboards, or administrative panels, avoiding duplicate content and confidential data leakage.
- **Classification:** `Confirmed`
- **Applicable Roles:** Public User, Search Crawlers
- **Applicable Modules:** SEO Engine, Security Middleware
- **Conditions / Prerequisites:** Crawler or browser accesses non-published routes.
- **Expected System Behavior:** Web server injects `X-Robots-Tag: noindex, nofollow` and `robots.txt` explicitly disallows `/admin/`, `/reporter/`, `/api/`, and `/preview/`.
- **Prohibited Behavior:** Draft or pending news URLs MUST NOT be exposed in XML sitemaps or rendered with `index` directives.
- **Exception Handling & Error Codes:** Published stories MUST include proper canonical URLs and JSON-LD NewsArticle structured data.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-PUB-01`
- **Related Feature IDs:** `FEAT-SEO-001`
- **Related PRD Requirement IDs:** `PRD-SEC-26`
- **Acceptance Criteria:** HTTP response header check on `/reporter/*` confirms presence of `X-Robots-Tag: noindex, nofollow`.

---


## 11. Category Rules (CAT)

### RULE-CAT-001: Category Schema Mandatory Multilingual Attributes
- **Rule ID:** `RULE-CAT-001`
- **Rule Name:** Category Schema Mandatory Multilingual Attributes
- **Rule Statement:** Every news category record MUST contain a Hindi display name (in Devanagari script), an English URL slug, a display order index, a category icon identifier, and a visibility status flag.
- **Description & Rationale:** Guarantees seamless vernacular presentation in Hindi while maintaining clean, SEO-optimized ASCII URL slugs for browser compatibility.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Category Management, Public Portal
- **Conditions / Prerequisites:** Admin creates or edits a category in the Admin Control Panel.
- **Expected System Behavior:** The backend validates that `name_hi` contains valid Devanagari characters and `slug_en` matches `^[a-z0-9-]+$`. Both are stored as unique indexes.
- **Prohibited Behavior:** Categories lacking either the Hindi title or English slug MUST NOT be persisted.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-CAT-01`
- **Related Feature IDs:** `FEAT-CAT-001`
- **Related PRD Requirement IDs:** `PRD-SEC-21`
- **Acceptance Criteria:** Attempting to save a category with an empty Hindi title fails with HTTP 422 `ERR_CAT_HINDI_NAME_REQUIRED`.

---
### RULE-CAT-002: Strict Prohibition of Hard Deletion for Active Categories
- **Rule ID:** `RULE-CAT-002`
- **Rule Name:** Strict Prohibition of Hard Deletion for Active Categories
- **Rule Statement:** A Category entity with one or more associated news stories MUST NOT be hard-deleted from the database under any circumstance.
- **Description & Rationale:** Prevents database foreign key violation errors and prevents historical news articles from becoming orphaned or unrenderable.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Category Management, Database Governance
- **Conditions / Prerequisites:** Admin attempts to delete a category via the Admin Control Panel.
- **Expected System Behavior:** The backend queries `COUNT(news.id) WHERE category_id = :cat_id`. If count > 0, the delete operation is rejected with HTTP 409 `ERR_CAT_HAS_LINKED_STORIES` and an option to Archive or Reassign stories is presented.
- **Prohibited Behavior:** Direct SQL execution of `DELETE FROM categories WHERE id = :id` MUST NOT cascade delete associated news.
- **Exception Handling & Error Codes:** Only categories with zero associated historical stories may be deleted permanently.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-CAT-01`
- **Related Feature IDs:** `FEAT-CAT-001`
- **Related PRD Requirement IDs:** `PRD-SEC-21`
- **Acceptance Criteria:** Invoking `DELETE /api/v1/admin/categories/{id}` on a populated category returns HTTP 409 Conflict.

---
### RULE-CAT-003: Category Archival & Navigation Menu Deprecation
- **Rule ID:** `RULE-CAT-003`
- **Rule Name:** Category Archival & Navigation Menu Deprecation
- **Rule Statement:** When an Administrator archives a Category (`status = ARCHIVED`), it MUST be removed from public navigation menus and dropdown selectors for new stories, while all historical articles linked to it MUST remain publicly viewable and resolvable at their existing URLs.
- **Description & Rationale:** Allows editorial restructuring (e.g. retiring an election special category after polls end) without breaking existing links or search traffic.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Category Management, Public Navigation
- **Conditions / Prerequisites:** Admin sets category status to `ARCHIVED`.
- **Expected System Behavior:** The category is excluded from public navbar APIs and news creation form category pickers. Category archive page remains accessible for historical browsing.
- **Prohibited Behavior:** Archiving a category MUST NOT unpublish or hide historical stories linked to that category.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-CAT-01`
- **Related Feature IDs:** `FEAT-CAT-001`
- **Related PRD Requirement IDs:** `PRD-SEC-21`
- **Acceptance Criteria:** An archived category does not appear in the navbar, but historical articles linked to it resolve with HTTP 200.

---
### RULE-CAT-004: Two-Tier Category & Sub-Category Hierarchy Limits
- **Rule ID:** `RULE-CAT-004`
- **Rule Name:** Two-Tier Category & Sub-Category Hierarchy Limits
- **Rule Statement:** The news taxonomy MUST be constrained to a maximum depth of two tiers: Parent Category (Tier 1) and Sub-Category (Tier 2); creation of Tier 3 or deeper nested categories SHALL NOT be permitted.
- **Description & Rationale:** Keeps navigation intuitive for mobile users and avoids excessive database traversal depth.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Category Management
- **Conditions / Prerequisites:** Admin creates a sub-category.
- **Expected System Behavior:** The backend validates that the selected `parent_id` belongs to a Tier 1 category (`parent_category.parent_id IS NULL`). If the parent itself is a sub-category, the request is rejected with HTTP 422.
- **Prohibited Behavior:** Nesting sub-categories beneath sub-categories is strictly prohibited.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-CAT-01`
- **Related Feature IDs:** `FEAT-CAT-001`
- **Related PRD Requirement IDs:** `PRD-SEC-21`
- **Acceptance Criteria:** Attempting to create a sub-category under an existing sub-category fails with HTTP 422.

---
### RULE-CAT-005: Default Fallback Category on Story Reclassification
- **Rule ID:** `RULE-CAT-005`
- **Rule Name:** Default Fallback Category on Story Reclassification
- **Rule Statement:** If an Administrator merges or deprecates a category, all associated stories MUST be batch-reassigned to a designated target Category or the default fallback category ("सामान्य समाचार" / General News).
- **Description & Rationale:** Ensures data integrity and guarantees no published article is left in an uncategorized state.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Category Management, Batch Operations
- **Conditions / Prerequisites:** Admin executes category merge action.
- **Expected System Behavior:** The backend updates `category_id` in a single transactional batch for all affected news records and logs an audit entry.
- **Prohibited Behavior:** The system MUST NOT leave `category_id` as NULL on any story record.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-CAT-01`
- **Related Feature IDs:** `FEAT-CAT-001`
- **Related PRD Requirement IDs:** `PRD-SEC-21`
- **Acceptance Criteria:** Merging Category A into Category B leaves zero records referencing Category A.

---
### RULE-CAT-006: Category Display Ordering & Navigation Priority Rules
- **Rule ID:** `RULE-CAT-006`
- **Rule Name:** Category Display Ordering & Navigation Priority Rules
- **Rule Statement:** Categories MUST be displayed in the public navigation bar, mobile drawer, and creation dropdowns strictly ordered by their `display_order` integer index (ascending), followed by alphabetical order for equal values.
- **Description & Rationale:** Allows newsroom directors to promote high-traffic categories (e.g. Breaking News, Politics, Crime) to the front of the navbar.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Public User
- **Applicable Modules:** Category Management, Public Web Portal
- **Conditions / Prerequisites:** Public or client app queries category list.
- **Expected System Behavior:** API executes `SELECT * FROM categories WHERE status = "ACTIVE" ORDER BY display_order ASC, name_hi ASC`.
- **Prohibited Behavior:** Clients MUST NOT scramble or randomize category presentation order.
- **Exception Handling & Error Codes:** Admin panel provides drag-and-drop reordering that updates `display_order` values in real time.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-CAT-01`
- **Related Feature IDs:** `FEAT-CAT-001`
- **Related PRD Requirement IDs:** `PRD-SEC-21`
- **Acceptance Criteria:** Modifying `display_order` of a category in the Admin panel immediately updates its position on the homepage navbar.

---


## 12. Location Rules (LOC)

### RULE-LOC-001: Mandatory Geographic Hierarchy (Country -> State -> District -> Tehsil)
- **Rule ID:** `RULE-LOC-001`
- **Rule Name:** Mandatory Geographic Hierarchy (Country -> State -> District -> Tehsil)
- **Rule Statement:** All location entities MUST adhere to a strict relational hierarchy: Country (India) -> State (e.g. Madhya Pradesh) -> District (e.g. Niwari) -> Tehsil/City (e.g. Orchha, Prithvipur).
- **Description & Rationale:** Provides standardized relational integrity for hyperlocal news routing, reporter territorial jurisdiction, and geo-targeted alerts.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Location Governance
- **Conditions / Prerequisites:** Location entity creation or lookup.
- **Expected System Behavior:** Database enforces foreign key constraints (`tehsil.district_id -> district.id`, `district.state_id -> state.id`).
- **Prohibited Behavior:** Orphaned tehsils or districts without valid parent linkages MUST NOT be inserted into the database.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-ADM-02`
- **Related Feature IDs:** `FEAT-CAT-002`
- **Related PRD Requirement IDs:** `PRD-SEC-21`
- **Acceptance Criteria:** Attempting to create a Tehsil without a valid `district_id` fails foreign key validation.

---
### RULE-LOC-002: Madhya Pradesh 55-District Baseline Master Registry
- **Rule ID:** `RULE-LOC-002`
- **Rule Name:** Madhya Pradesh 55-District Baseline Master Registry
- **Rule Statement:** The platform database MUST be pre-seeded and initialized with all 55 official administrative districts of Madhya Pradesh as the primary baseline, with Niwari, Bhopal, Indore, Jabalpur, Gwalior, and Ujjain marked as core priority hubs.
- **Description & Rationale:** Guarantees comprehensive operational coverage across Madhya Pradesh from Day One of deployment.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Database Seeder, Administrator
- **Applicable Modules:** Location Governance, Database Seeder
- **Conditions / Prerequisites:** Database migration or initialization.
- **Expected System Behavior:** Migration script seeds all 55 MP districts with official Devanagari Hindi spellings, English slugs, and regional administrative zone tags.
- **Prohibited Behavior:** The system MUST NOT omit recently created administrative districts such as Niwari, Mauganj, Maihar, or Pandhurna.
- **Exception Handling & Error Codes:** Subsequent new districts established by state gazette can be added via the Admin Control Panel.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-ADM-02`
- **Related Feature IDs:** `FEAT-CAT-002`
- **Related PRD Requirement IDs:** `PRD-SEC-21`
- **Acceptance Criteria:** Querying `/api/v1/public/locations/districts?state=madhya-pradesh` returns all 55 districts.

---
### RULE-LOC-003: Location Integrity & Prohibition of Orphaned Tehsils
- **Rule ID:** `RULE-LOC-003`
- **Rule Name:** Location Integrity & Prohibition of Orphaned Tehsils
- **Rule Statement:** Deleting a District SHALL NOT be permitted if it contains child Tehsils or associated news stories; child Tehsils must first be reassigned or deleted.
- **Description & Rationale:** Prevents cascading data corruption across geographic mappings.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Location Governance
- **Conditions / Prerequisites:** Admin attempts to delete a district.
- **Expected System Behavior:** The backend verifies child entity count. If tehsils exist, it returns HTTP 409 `ERR_LOC_DISTRICT_HAS_TEHSILS`.
- **Prohibited Behavior:** Cascading deletes on districts with active child records are strictly blocked.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-ADM-02`
- **Related Feature IDs:** `FEAT-CAT-002`
- **Related PRD Requirement IDs:** `PRD-SEC-21`
- **Acceptance Criteria:** Attempting to delete a district with associated tehsils returns HTTP 409.

---
### RULE-LOC-004: Location-Based Public Routing & District Hub Dynamic Views
- **Rule ID:** `RULE-LOC-004`
- **Rule Name:** Location-Based Public Routing & District Hub Dynamic Views
- **Rule Statement:** Every registered District MUST have a dedicated, SEO-optimized public landing route matching `/district/{district-slug}` rendering the district newsroom banner, active correspondents, and local news feed.
- **Description & Rationale:** Enables regional readers to bookmark and share their specific district news hub.
- **Classification:** `Confirmed`
- **Applicable Roles:** Public User
- **Applicable Modules:** Public Web Portal, Public Android App, Routing Engine
- **Conditions / Prerequisites:** Reader visits `/district/{slug}`.
- **Expected System Behavior:** The system resolves the slug to the district ID, renders localized headers in Hindi, and populates stories tagged with that district.
- **Prohibited Behavior:** The system MUST NOT render a blank page or 500 error if an active district currently has zero news; it must render a helpful "नो न्यूज़ उपलब्ध" empty-state banner.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-PUB-01`
- **Related Feature IDs:** `FEAT-PUB-004`, `FEAT-CAT-002`
- **Related PRD Requirement IDs:** `PRD-SEC-11.1`, `PRD-SEC-21`
- **Acceptance Criteria:** Navigating to `/district/niwari` loads the dedicated Niwari district portal successfully.

---
### RULE-LOC-005: Location Entity Deletion Protection with Associated Stories
- **Rule ID:** `RULE-LOC-005`
- **Rule Name:** Location Entity Deletion Protection with Associated Stories
- **Rule Statement:** A District or Tehsil entity linked to historical published news stories MUST NOT be deleted; it may only be deactivated (`is_active = false`), which hides it from future reporter submission pickers while preserving historical story tags.
- **Description & Rationale:** Ensures that historical news articles retain their geographic metadata even if administrative boundaries are reorganized.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Location Governance
- **Conditions / Prerequisites:** Admin attempts to delete a location with linked stories.
- **Expected System Behavior:** System rejects deletion and advises deactivation. When deactivated, location remains in DB for historical lookups but is excluded from active dropdowns.
- **Prohibited Behavior:** Hard deletion of locations with associated news is strictly prohibited.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-ADM-02`
- **Related Feature IDs:** `FEAT-CAT-002`
- **Related PRD Requirement IDs:** `PRD-SEC-21`
- **Acceptance Criteria:** Deleting a populated location fails with HTTP 409 Conflict.

---
### RULE-LOC-006: Multi-District Tagging Policy for Regional Stories
- **Rule ID:** `RULE-LOC-006`
- **Rule Name:** Multi-District Tagging Policy for Regional Stories
- **Rule Statement:** A news story MAY be tagged with up to a maximum of 3 secondary districts in addition to its primary district if approved by an Editor, allowing regional interest stories to appear on multiple district edition pages.
- **Description & Rationale:** Accommodates major regional stories (e.g. Bundelkhand regional development, state highway projects) affecting multiple neighboring districts.
- **Classification:** `Conditional`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Editorial Desk, Location Governance
- **Conditions / Prerequisites:** Editor selects secondary districts during story review.
- **Expected System Behavior:** Backend records secondary district mappings in `news_districts` junction table. The story is indexed and displayed across the feeds of all tagged districts.
- **Prohibited Behavior:** Standard reporters MUST NOT tag secondary districts without editor approval.
- **Exception Handling & Error Codes:** State-wide breaking news overrides district limits entirely.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-EDT-01`
- **Related Feature IDs:** `FEAT-ADM-009`, `FEAT-CAT-002`
- **Related PRD Requirement IDs:** `PRD-SEC-21`
- **Acceptance Criteria:** A story tagged with Primary: Niwari, Secondary: Tikamgarh appears in both district feeds.

---


## 13. RSS and URL Source Rules (RSS)

### RULE-RSS-001: Exclusive Administrative Privilege for RSS & URL Ingestion
- **Rule ID:** `RULE-RSS-001`
- **Rule Name:** Exclusive Administrative Privilege for RSS & URL Ingestion
- **Rule Statement:** Access to RSS feed configuration, feed pollers, and URL web scrapers SHALL be an exclusive privilege of Platform Administrators (`ROLE_ADMIN` and `ROLE_SUPER_ADMIN`); all reporter accounts SHALL be strictly blocked from viewing or executing these tools.
- **Description & Rationale:** Core architectural rule: prevents reporters from aggregating internet links and forces original district reporting, reserving automated aggregation strictly for central newsroom editors.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** RSS & URL Newsroom, Central Digital Newsroom
- **Conditions / Prerequisites:** Accessing RSS/URL ingestion modules or API endpoints.
- **Expected System Behavior:** API gateway verifies admin role claims. Non-admin users are blocked with HTTP 403 Forbidden. UI routes for RSS/URL are completely excluded from Reporter Dashboard bundles.
- **Prohibited Behavior:** Reporters MUST NOT have access to RSS feeds or URL-to-News tools under any circumstance.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-RSS-01`, `WF-URL-01`
- **Related Feature IDs:** `FEAT-ADM-009`, `FEAT-ADM-010`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-17.1`
- **Acceptance Criteria:** Reporter user calling `/api/v1/admin/rss/sources` receives HTTP 403.

---
### RULE-RSS-002: Mandatory Whitelist Domain Verification for URL Scrapers
- **Rule ID:** `RULE-RSS-002`
- **Rule Name:** Mandatory Whitelist Domain Verification for URL Scrapers
- **Rule Statement:** The URL Web Scraper engine MUST ONLY scrape web articles from domains explicitly registered in the Administrative Source Whitelist; any attempt to scrape an unapproved domain SHALL be rejected with HTTP 400.
- **Description & Rationale:** Protects the platform against server-side request forgery (SSRF), scraping of malicious or adult websites, and copyright exposure from unauthorized sites.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** URL Scraper Desk, Security Middleware
- **Conditions / Prerequisites:** Admin enters a URL to extract article text.
- **Expected System Behavior:** The backend parses the domain hostname, matches it against the active whitelist table, and checks DNS to prevent private IP resolution (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`). Scrape proceeds only if valid.
- **Prohibited Behavior:** The system MUST NOT execute scraping requests against arbitrary unvetted URLs or internal network IP addresses.
- **Exception Handling & Error Codes:** Super Admins can add new trusted news domains to the whitelist after review.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-URL-01`
- **Related Feature IDs:** `FEAT-ADM-010`
- **Related PRD Requirement IDs:** `PRD-SEC-17.1`, `PRD-SEC-27`
- **Acceptance Criteria:** Attempting to scrape `http://169.254.169.254` or an unapproved personal blog fails with HTTP 400 `ERR_SCRAPER_DOMAIN_NOT_WHITELISTED`.

---
### RULE-RSS-003: Source Attribution & Fair-Use Copyright Preservation
- **Rule ID:** `RULE-RSS-003`
- **Rule Name:** Source Attribution & Fair-Use Copyright Preservation
- **Rule Statement:** All news synthesized from external RSS feeds or URL imports MUST retain the canonical source name, original publication URL, and import timestamp in the database, with proper journalistic attribution rendered in the editorial workspace.
- **Description & Rationale:** Ensures legal compliance with Indian copyright laws and Press Council fair-use attribution guidelines.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** RSS & URL Newsroom
- **Conditions / Prerequisites:** Story ingested via RSS or URL scraper.
- **Expected System Behavior:** Backend records `source_name`, `original_url`, and `imported_at` in the story metadata. The editorial desk displays a prominent "स्रोत: [Source Name]" badge.
- **Prohibited Behavior:** The system MUST NOT erase source attribution metadata from imported stories.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-RSS-01`, `WF-URL-01`
- **Related Feature IDs:** `FEAT-ADM-009`, `FEAT-ADM-010`
- **Related PRD Requirement IDs:** `PRD-SEC-17.1`
- **Acceptance Criteria:** Ingested story record contains non-null `original_url` and `source_name` fields.

---
### RULE-RSS-004: Automated Duplicate Story Deduplication Hashing
- **Rule ID:** `RULE-RSS-004`
- **Rule Name:** Automated Duplicate Story Deduplication Hashing
- **Rule Statement:** The RSS poller engine MUST calculate a cryptographic SHA-256 hash of the canonical URL and title for every incoming feed item; items whose hash matches an existing entry in the deduplication cache SHALL be skipped silently.
- **Description & Rationale:** Prevents the newsroom queue from being flooded with hundreds of duplicate stories from multiple RSS syndication channels.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / RSS Poller, Administrator
- **Applicable Modules:** RSS Engine, Ingestion Engine
- **Conditions / Prerequisites:** RSS poller fetches feed XML.
- **Expected System Behavior:** For each `<item>`, poller computes `hash(guid || link || title)`. If exists in Redis / DB deduplication table, the item is ignored.
- **Prohibited Behavior:** Duplicate feed items MUST NOT generate duplicate draft records in the newsroom.
- **Exception Handling & Error Codes:** If a major news update is issued under the same URL with an altered `<pubDate>`, the editor is notified of an update.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-RSS-01`
- **Related Feature IDs:** `FEAT-ADM-010`
- **Related PRD Requirement IDs:** `PRD-SEC-17.1`
- **Acceptance Criteria:** Polling the same RSS feed twice in succession imports zero new duplicate items on the second run.

---
### RULE-RSS-005: Mandatory AI Rewriting & Human Polish before Publication
- **Rule ID:** `RULE-RSS-005`
- **Rule Name:** Mandatory AI Rewriting & Human Polish before Publication
- **Rule Statement:** Content imported via RSS feeds or URL scrapers MUST undergo AI synthesis/rewriting into original Hindi copy and MUST be reviewed and approved by a human Editor; it SHALL NOT be published directly in its raw scraped form.
- **Description & Rationale:** Strict anti-plagiarism and quality rule: direct republication of third-party raw text violates copyright and Google search indexing guidelines.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Central Newsroom, AI Synthesis Engine
- **Conditions / Prerequisites:** Imported story ready for processing.
- **Expected System Behavior:** The imported text is passed to the AI Engine for vernacular summarization and restructuring. The resulting output is saved in `DRAFT` status for editor review.
- **Prohibited Behavior:** The system MUST NOT provide an auto-publish toggle for raw RSS feeds.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-RSS-02`
- **Related Feature IDs:** `FEAT-ADM-009`, `FEAT-ADM-010`
- **Related PRD Requirement IDs:** `PRD-SEC-17.1`, `PRD-SEC-18`
- **Acceptance Criteria:** An imported RSS article cannot transition to `PUBLISHED` without passing through the AI rewrite and manual editor approval step.

---
### RULE-RSS-006: Feed Ingestion Polling Interval & Rate Limit Backoff
- **Rule ID:** `RULE-RSS-006`
- **Rule Name:** Feed Ingestion Polling Interval & Rate Limit Backoff
- **Rule Statement:** Automated RSS polling jobs MUST enforce a minimum polling interval of 15 minutes per feed and MUST implement exponential backoff upon encountering HTTP 429 or 5xx server errors from source publishers.
- **Description & Rationale:** Prevents BREAKING NEWS WALA servers from being banned or rate-limited by national media RSS providers.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Background Worker
- **Applicable Modules:** RSS Engine
- **Conditions / Prerequisites:** Scheduled poller executes feed fetches.
- **Expected System Behavior:** Poller checks `last_polled_at`. If `< 15 minutes`, skip. If HTTP 429 received, double poll interval up to 24 hours.
- **Prohibited Behavior:** The system MUST NOT poll external RSS feeds in tight loops or intervals under 15 minutes.
- **Exception Handling & Error Codes:** Admins may trigger a one-time manual "Fetch Now" test in the Admin Panel.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-RSS-01`
- **Related Feature IDs:** `FEAT-ADM-010`
- **Related PRD Requirement IDs:** `PRD-SEC-17.1`
- **Acceptance Criteria:** Worker logs demonstrate polling intervals respected with backoff on source errors.

---
### RULE-RSS-007: Quarantine & Blacklisting of Corrupted or Defunct Feeds
- **Rule ID:** `RULE-RSS-007`
- **Rule Name:** Quarantine & Blacklisting of Corrupted or Defunct Feeds
- **Rule Statement:** An RSS feed source that fails consecutively for 10 polling attempts (due to 404, invalid XML, or connection timeout) MUST be automatically transitioned to `QUARANTINED` status with an alert sent to the Admin Control Panel.
- **Description & Rationale:** Prevents wasteful compute cycles on dead feeds and prompts administrators to update or remove invalid feed URLs.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Background Worker, Administrator
- **Applicable Modules:** RSS Engine, Admin Control Panel
- **Conditions / Prerequisites:** 10th consecutive failure on a registered RSS feed.
- **Expected System Behavior:** Status set to `QUARANTINED`, `is_active = false`, and an admin notification is raised detailing the failure error code.
- **Prohibited Behavior:** The system MUST NOT continue polling quarantined feeds until an Admin inspects and re-enables them.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-RSS-01`
- **Related Feature IDs:** `FEAT-ADM-010`
- **Related PRD Requirement IDs:** `PRD-SEC-17.1`
- **Acceptance Criteria:** A simulated 404 feed transitions to `QUARANTINED` after 10 failed runs.

---


## 14. AI Content Rules (AI)

### RULE-AI-001: AI Subservience Principle — AI Never Publishes Directly
- **Rule ID:** `RULE-AI-001`
- **Rule Name:** AI Subservience Principle — AI Never Publishes Directly
- **Rule Statement:** Artificial Intelligence models (Gemini, Claude, OpenAI) SHALL act strictly as assistive drafting tools; under NO circumstance SHALL the AI engine have the authority to publish articles, graphics, or alerts directly to the public domain.
- **Description & Rationale:** Foundational safety and editorial governance invariant: AI outputs can hallucinate, misstate facts, or produce defamatory text. A verified human journalist or editor must maintain ultimate accountability.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / AI Engine, All Roles
- **Applicable Modules:** AI Newsroom, Central Newsroom
- **Conditions / Prerequisites:** Any AI generation endpoint is invoked.
- **Expected System Behavior:** The backend forces all AI-synthesized outputs to be stored with `status = DRAFT`. No publishing triggers or public endpoints can be invoked by the AI pipeline.
- **Prohibited Behavior:** The system MUST NOT provide any automated pipeline, webhook, or cron job that publishes AI outputs directly without human sign-off.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-CRE-02`, `WF-RSS-02`
- **Related Feature IDs:** `FEAT-CRE-011`, `FEAT-ADM-009`
- **Related PRD Requirement IDs:** `PRD-SEC-18`, `PRD-SEC-27`
- **Acceptance Criteria:** All database records created via AI generation endpoints have `status = "DRAFT"` upon insertion.

---
### RULE-AI-002: Default Draft State for All AI-Synthesized Articles
- **Rule ID:** `RULE-AI-002`
- **Rule Name:** Default Draft State for All AI-Synthesized Articles
- **Rule Statement:** Every article generated or rewritten using AI tools MUST be saved in `DRAFT` status and MUST display a prominent visual banner in the editor workspace indicating "AI-Assisted Draft — Human Review Required".
- **Description & Rationale:** Ensures editors and reporters immediately recognize that the copy requires fact-checking and line editing before release.
- **Classification:** `Confirmed`
- **Applicable Roles:** Standard Reporter, Trusted Reporter, Administrator
- **Applicable Modules:** AI Newsroom, News Creation Desk
- **Conditions / Prerequisites:** AI article generation completes successfully.
- **Expected System Behavior:** The UI renders the generated copy inside the draft form, marks `is_ai_assisted = true`, and displays the amber advisory banner.
- **Prohibited Behavior:** The system MUST NOT clear the AI-assisted flag or allow one-click publishing without manual inspection.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-CRE-02`, `WF-RSS-02`
- **Related Feature IDs:** `FEAT-CRE-011`
- **Related PRD Requirement IDs:** `PRD-SEC-18`
- **Acceptance Criteria:** Articles created with AI carry `is_ai_assisted == true` in database schema.

---
### RULE-AI-003: Mandatory Human Editorial Review & Approval of AI Output
- **Rule ID:** `RULE-AI-003`
- **Rule Name:** Mandatory Human Editorial Review & Approval of AI Output
- **Rule Statement:** An AI-assisted article submitted by a reporter MUST undergo the same rigorous editorial review by Central Newsroom as human-written copy, with editors verifying facts, dates, named individuals, and local accuracy.
- **Description & Rationale:** Mitigates the risk of hallucinations, inaccurate numbers, or incorrect local geographical statements.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Central Newsroom, Editorial Governance
- **Conditions / Prerequisites:** AI-assisted draft submitted to review queue.
- **Expected System Behavior:** The editorial desk displays the original reporter notes side-by-side with the AI-expanded article so editors can verify that no fabricated facts were added.
- **Prohibited Behavior:** Editors MUST NOT approve AI articles without inspecting the source notes comparison.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-EDT-01`
- **Related Feature IDs:** `FEAT-ADM-009`
- **Related PRD Requirement IDs:** `PRD-SEC-16`, `PRD-SEC-18`
- **Acceptance Criteria:** Editorial review UI provides a split-screen diff between raw notes and AI output.

---
### RULE-AI-004: Strict Server-Side AI API Key Execution (Zero Client Exposure)
- **Rule ID:** `RULE-AI-004`
- **Rule Name:** Strict Server-Side AI API Key Execution (Zero Client Exposure)
- **Rule Statement:** All AI model API calls MUST be executed strictly server-side by backend proxy microservices; API keys for Google Gemini, OpenAI, Anthropic, or other LLM providers SHALL NEVER be embedded in client-side code, mobile APKs, or network payloads.
- **Description & Rationale:** Client exposure of AI keys leads to immediate quota hijacking, massive cloud billing spikes, and security compromises.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Security Architecture
- **Applicable Modules:** API Pool Engine, Security Middleware
- **Conditions / Prerequisites:** Any AI generation request triggered by Web or Android app.
- **Expected System Behavior:** The client sends the prompt text to `/api/v1/ai/generate`. The backend validates user session, retrieves the active key from the secure API Pool, calls the AI provider server-to-server, and streams the result back.
- **Prohibited Behavior:** API keys MUST NOT be returned in API responses, included in environment files packaged in frontend builds, or decompilable from the Android APK.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-CRE-02`, `WF-API-01`
- **Related Feature IDs:** `FEAT-API-001`
- **Related PRD Requirement IDs:** `PRD-SEC-18`, `PRD-SEC-23`, `PRD-SEC-27`
- **Acceptance Criteria:** Static analysis and network inspection of web bundles and APK binaries reveals zero AI provider API keys.

---
### RULE-AI-005: Content Hallucination & Fact-Check Guardrails
- **Rule ID:** `RULE-AI-005`
- **Rule Name:** Content Hallucination & Fact-Check Guardrails
- **Rule Statement:** AI prompt templates MUST include strict system instructions compelling the model to refuse speculation, adhere strictly to supplied field notes, flag unverified claims, and output in standard Hindi Devanagari script.
- **Description & Rationale:** Minimizes LLM confabulation and ensures vernacular output conforms to journalistic standards.
- **Classification:** `Proposed`
- **Applicable Roles:** System / AI Engine
- **Applicable Modules:** AI Newsroom
- **Conditions / Prerequisites:** System prompt construction for AI requests.
- **Expected System Behavior:** The backend prepends mandatory system instructions: "You are a professional Hindi news editor. Write ONLY based on provided facts. Do not invent names, dates, or numbers. If information is missing, state it is unavailable."
- **Prohibited Behavior:** Prompt templates MUST NOT instruct the model to embellish or add sensationalized dramatic details.
- **Exception Handling & Error Codes:** Creative headline generation prompts may request multiple catchy variations based on the same verified facts.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-CRE-02`
- **Related Feature IDs:** `FEAT-CRE-011`
- **Related PRD Requirement IDs:** `PRD-SEC-18`
- **Acceptance Criteria:** AI system prompt contains explicit anti-hallucination and factual fidelity directives.

---
### RULE-AI-006: Hindi Vernacular Tone & Local Dialect Adaptation Rules
- **Rule ID:** `RULE-AI-006`
- **Rule Name:** Hindi Vernacular Tone & Local Dialect Adaptation Rules
- **Rule Statement:** AI text synthesis MUST prioritize clear, readable, formal Hindi (Devanagari) suitable for Madhya Pradesh regional readers, avoiding unnatural literal translations from English or excessively complex Sanskritized vocabulary.
- **Description & Rationale:** Ensures the language resonates naturally with readers in Bundelkhand, Baghelkhand, Malwa, and Mahakoshal regions.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / AI Engine
- **Applicable Modules:** AI Newsroom
- **Conditions / Prerequisites:** AI text generation execution.
- **Expected System Behavior:** System instructions mandate standard conversational journalistic Hindi vocabulary (e.g. using "पुलिस ने मामला दर्ज किया" instead of obscure archaic phrases).
- **Prohibited Behavior:** The system MUST NOT output Hinglish (Hindi in Latin alphabet) in published story bodies.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-CRE-02`
- **Related Feature IDs:** `FEAT-CRE-011`
- **Related PRD Requirement IDs:** `PRD-SEC-12.2`, `PRD-SEC-18`
- **Acceptance Criteria:** Generated text undergoes automated Unicode validation ensuring pure Devanagari output.

---
### RULE-AI-007: Reporter AI Assist Quota & Abuse Throttling
- **Rule ID:** `RULE-AI-007`
- **Rule Name:** Reporter AI Assist Quota & Abuse Throttling
- **Rule Statement:** Standard Reporters SHALL be limited to a maximum of 20 AI generation requests per day to prevent API quota exhaustion and encourage original journalistic drafting.
- **Description & Rationale:** Protects cloud infrastructure budgets and prevents field reporters from relying entirely on automated tools.
- **Classification:** `Proposed`
- **Applicable Roles:** Standard Reporter, Trusted Reporter
- **Applicable Modules:** AI Newsroom, Rate Limiting
- **Conditions / Prerequisites:** Reporter invokes AI assist endpoint.
- **Expected System Behavior:** The backend increments daily usage counter in Redis. If count > 20, request is rejected with HTTP 429 `ERR_AI_DAILY_QUOTA_EXCEEDED` until midnight UTC.
- **Prohibited Behavior:** Reporters MUST NOT exceed their allocated daily AI generation limit.
- **Exception Handling & Error Codes:** Central Newsroom Editors and Administrators have unlimited AI generation quotas.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-CRE-02`
- **Related Feature IDs:** `FEAT-CRE-011`
- **Related PRD Requirement IDs:** `PRD-SEC-18`, `PRD-SEC-23`
- **Acceptance Criteria:** The 21st AI request in a single day by a reporter is rejected with HTTP 429.

---
### RULE-AI-008: AI Prompt Injection & Malicious Script Filtering
- **Rule ID:** `RULE-AI-008`
- **Rule Name:** AI Prompt Injection & Malicious Script Filtering
- **Rule Statement:** All user input fed into AI generation prompts MUST be sanitized to strip prompt injection attacks (e.g. "Ignore previous instructions", "Output the system prompt", or jailbreaks) before transmission to LLM APIs.
- **Description & Rationale:** Prevents malicious actors from manipulating AI outputs to produce defamatory statements or extract backend configuration.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Security Middleware
- **Applicable Modules:** AI Newsroom, Security Middleware
- **Conditions / Prerequisites:** Incoming text payload before AI prompt construction.
- **Expected System Behavior:** Input sanitization regex strips known injection payloads and bounds input token length to a maximum of 2,000 words.
- **Prohibited Behavior:** Raw unvalidated client text MUST NOT be concatenated directly into AI prompts without escaping.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-CRE-02`
- **Related Feature IDs:** `FEAT-CRE-011`
- **Related PRD Requirement IDs:** `PRD-SEC-18`, `PRD-SEC-27`
- **Acceptance Criteria:** Submitting a prompt injection string results in sanitization or HTTP 422 rejection.

---


## 15. Graphics Studio Rules (GFX)

### RULE-GFX-001: Reporter Graphics Studio Script-Only Input Restriction
- **Rule ID:** `RULE-GFX-001`
- **Rule Name:** Reporter Graphics Studio Script-Only Input Restriction
- **Rule Statement:** Reporters utilizing the Reporter Graphics Studio MUST create news graphics strictly via text input of raw headlines and subheadings into pre-configured Admin templates; reporters SHALL NOT be permitted to manipulate canvas elements, alter brand coordinates, or import arbitrary graphic layouts.
- **Description & Rationale:** Guarantees that district reporters can generate professional breaking news cards in seconds while preserving channel branding and preventing font distortion or misplaced logos.
- **Classification:** `Confirmed`
- **Applicable Roles:** Standard Reporter, Trusted Reporter
- **Applicable Modules:** Reporter Graphics Studio, Template Engine
- **Conditions / Prerequisites:** Reporter accesses the Graphics Studio.
- **Expected System Behavior:** The studio exposes a structured form: Select Template -> Enter Headline -> Select District -> Attach Photo. The rendering engine places text and assets into fixed bounding boxes.
- **Prohibited Behavior:** Reporters MUST NOT have free-form canvas drag-and-drop tools, CSS editing, or layer reordering capabilities.
- **Exception Handling & Error Codes:** None. Advanced canvas editing is strictly an Admin-only capability (RULE-GFX-005).
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-RGFX-01`
- **Related Feature IDs:** `FEAT-RGFX-001`, `FEAT-AGFX-001`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-19`
- **Acceptance Criteria:** Reporter Graphics Studio UI has zero freehand drawing, layer moving, or custom font upload controls.

---
### RULE-GFX-002: Mandatory Use of Admin-Approved Graphic Templates
- **Rule ID:** `RULE-GFX-002`
- **Rule Name:** Mandatory Use of Admin-Approved Graphic Templates
- **Rule Statement:** All graphics exported from the platform MUST utilize active, approved graphic templates created and published by Platform Administrators in the master template registry.
- **Description & Rationale:** Ensures consistent visual identity, high-resolution brand assets, and uniform layout standards across all districts.
- **Classification:** `Confirmed`
- **Applicable Roles:** Standard Reporter, Trusted Reporter, Administrator
- **Applicable Modules:** Graphics Studio, Template Governance
- **Conditions / Prerequisites:** Graphic generation or export.
- **Expected System Behavior:** The rendering engine validates that `template_id` matches an active approved template record. If inactive or missing, export is blocked with HTTP 422.
- **Prohibited Behavior:** Users MUST NOT render graphics without a valid template binding.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-RGFX-01`, `WF-AGFX-01`
- **Related Feature IDs:** `FEAT-RGFX-001`, `FEAT-AGFX-001`
- **Related PRD Requirement IDs:** `PRD-SEC-19`
- **Acceptance Criteria:** Graphic generation fails if `template_id` is invalid or unpublished.

---
### RULE-GFX-003: Automated Devanagari Auto-Scaling & Overflow Prevention
- **Rule ID:** `RULE-GFX-003`
- **Rule Name:** Automated Devanagari Auto-Scaling & Overflow Prevention
- **Rule Statement:** The graphics rendering engine MUST implement dynamic font auto-scaling for Hindi Devanagari text, automatically reducing font size (between 72pt and 32pt) to ensure the entire headline fits perfectly within the allocated bounding box without text clipping or awkward word breaks.
- **Description & Rationale:** Hindi matras and conjuncts frequently cause text overflow if font sizes are fixed. Auto-scaling guarantees clean, publication-ready cards on every attempt.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Graphics Engine, All Roles
- **Applicable Modules:** Graphics Studio, Rendering Pipeline
- **Conditions / Prerequisites:** Headline text is rendered onto template canvas.
- **Expected System Behavior:** The engine measures text bounding box metrics. If text height exceeds box height, it iteratively decrements font size until text fits. If text still overflows at 32pt, it prompts user to shorten headline.
- **Prohibited Behavior:** The engine MUST NOT render graphics where Hindi matras or characters clip outside template borders.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-RGFX-01`, `WF-AGFX-01`
- **Related Feature IDs:** `FEAT-RGFX-001`, `FEAT-AGFX-002`
- **Related PRD Requirement IDs:** `PRD-SEC-19.1`
- **Acceptance Criteria:** Rendering a 100-character Hindi headline automatically scales font to fit within template bounds without overflow.

---
### RULE-GFX-004: Prohibition of Unrestricted File Uploads in Reporter Studio
- **Rule ID:** `RULE-GFX-004`
- **Rule Name:** Prohibition of Unrestricted File Uploads in Reporter Studio
- **Rule Statement:** Reporters MAY ONLY upload standard image files (JPEG, PNG, WebP) up to 5 MB as subject photographs for templates; uploading arbitrary SVG, HTML, or executable files into the Graphics Studio SHALL be strictly blocked.
- **Description & Rationale:** Prevents SVG-based XSS attacks, malicious script execution, and oversized asset uploads that degrade rendering server performance.
- **Classification:** `Confirmed`
- **Applicable Roles:** Standard Reporter, Trusted Reporter
- **Applicable Modules:** Reporter Graphics Studio, Security Middleware
- **Conditions / Prerequisites:** User uploads a photo for a graphic card.
- **Expected System Behavior:** Server-side inspection validates MIME type and file magic bytes. SVGs and unrecognized files are rejected with HTTP 415 `ERR_UNSUPPORTED_MEDIA_TYPE`.
- **Prohibited Behavior:** The system MUST NOT accept SVG uploads from reporters in the graphics studio.
- **Exception Handling & Error Codes:** Administrators may upload verified SVG logos into the Admin Template Studio.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-RGFX-01`
- **Related Feature IDs:** `FEAT-RGFX-001`, `FEAT-MED-001`
- **Related PRD Requirement IDs:** `PRD-SEC-19`, `PRD-SEC-27`
- **Acceptance Criteria:** Uploading an SVG file in the Reporter Graphics Studio fails with HTTP 415.

---
### RULE-GFX-005: Admin Graphics Studio Full Canvas & Template Creation Rights
- **Rule ID:** `RULE-GFX-005`
- **Rule Name:** Admin Graphics Studio Full Canvas & Template Creation Rights
- **Rule Statement:** Administrators (`ROLE_ADMIN` and `ROLE_SUPER_ADMIN`) SHALL have full canvas editing capabilities, including the ability to add layers, configure text bounding boxes, upload channel logos, adjust colors, and publish new templates for reporters.
- **Description & Rationale:** Enables head design teams to craft bespoke templates for breaking news, elections, crime reports, and sports without modifying application code.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Admin Graphics Studio
- **Conditions / Prerequisites:** Admin accesses template builder.
- **Expected System Behavior:** Full canvas editor (Fabric.js / Konva.js) is activated with layer management, drag-and-drop elements, font pickers, and JSON schema export.
- **Prohibited Behavior:** Non-admin users MUST NOT have access to the Admin Graphics Studio routes or APIs.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-AGFX-01`
- **Related Feature IDs:** `FEAT-AGFX-001`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-19`
- **Acceptance Criteria:** Admin can create, position elements, and publish a new template that immediately appears in reporter template lists.

---
### RULE-GFX-006: Automatic Watermarking & Channel Branding Overlay
- **Rule ID:** `RULE-GFX-006`
- **Rule Name:** Automatic Watermarking & Channel Branding Overlay
- **Rule Statement:** Every news graphic rendered by the platform MUST automatically composite the official "BREAKING NEWS WALA" logo watermark, verified district badge, and channel social handle in fixed coordinates defined by the template.
- **Description & Rationale:** Protects content ownership when cards are shared virally on social media, WhatsApp groups, and Telegram channels.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Graphics Engine, All Roles
- **Applicable Modules:** Graphics Studio, Rendering Pipeline
- **Conditions / Prerequisites:** Graphic export execution.
- **Expected System Behavior:** The rendering engine overlays the transparent PNG brand watermark at the designated layer index before rasterizing the final output.
- **Prohibited Behavior:** Reporters MUST NOT have any toggle or control to disable, hide, or alter the channel watermark.
- **Exception Handling & Error Codes:** Sponsored brand graphics may include an approved sponsor badge alongside the channel watermark.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-RGFX-01`, `WF-AGFX-01`
- **Related Feature IDs:** `FEAT-RGFX-001`, `FEAT-AGFX-001`
- **Related PRD Requirement IDs:** `PRD-SEC-19.1`
- **Acceptance Criteria:** All exported graphic images contain the channel watermark in the rendered pixels.

---
### RULE-GFX-007: Multi-Format Aspect Ratio Output Standards (1:1, 16:9, 9:16)
- **Rule ID:** `RULE-GFX-007`
- **Rule Name:** Multi-Format Aspect Ratio Output Standards (1:1, 16:9, 9:16)
- **Rule Statement:** Templates MUST support standard social export aspect ratios: Square (1:1 / 1080x1080) for Instagram/Facebook posts, Landscape (16:9 / 1280x720) for Web/Twitter, and Vertical (9:16 / 1080x1920) for WhatsApp Status and Reels.
- **Description & Rationale:** Ensures graphics look optimal across all major social sharing and messaging surfaces.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Standard Reporter, Trusted Reporter
- **Applicable Modules:** Graphics Studio
- **Conditions / Prerequisites:** User selects target export format.
- **Expected System Behavior:** The engine dynamically loads the layout coordinates corresponding to the chosen aspect ratio and renders at 72 DPI for web or 300 DPI for print.
- **Prohibited Behavior:** The system MUST NOT stretch or distort images when adapting between aspect ratios; it must crop or scale proportionally.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-RGFX-01`, `WF-AGFX-01`
- **Related Feature IDs:** `FEAT-RGFX-001`, `FEAT-AGFX-001`
- **Related PRD Requirement IDs:** `PRD-SEC-19.1`
- **Acceptance Criteria:** Exporting in 1:1, 16:9, and 9:16 yields exact pixel dimensions specified.

---
### RULE-GFX-008: Admin Exclusive URL/RSS-to-Graphic Auto-Generation
- **Rule ID:** `RULE-GFX-008`
- **Rule Name:** Admin Exclusive URL/RSS-to-Graphic Auto-Generation
- **Rule Statement:** The automated feature that converts an ingested RSS feed item or scraped URL directly into a branded breaking news graphic SHALL be an exclusive privilege of Platform Administrators.
- **Description & Rationale:** Permits the central newsroom to instantly create social cards from breaking wires in seconds while keeping automated aggregation out of reporter hands.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Central Newsroom, Admin Graphics Studio
- **Conditions / Prerequisites:** Admin clicks "Generate Graphic from Story" in RSS/URL desk.
- **Expected System Behavior:** The system extracts the headline, selects the breaking template, injects text, auto-scales Devanagari font, and presents the finished graphic for one-click download or story attachment.
- **Prohibited Behavior:** This capability MUST NOT be exposed to standard or trusted reporters.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-AGFX-03`
- **Related Feature IDs:** `FEAT-AGFX-003`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-17.1`, `PRD-SEC-19`
- **Acceptance Criteria:** Reporter token calling `/api/v1/admin/graphics/auto-generate` returns HTTP 403.

---


## 16. Video Studio Rules (VID)

### RULE-VID-001: Cloud / Server-Side Video Rendering & Transcoding Pipeline
- **Rule ID:** `RULE-VID-001`
- **Rule Name:** Cloud / Server-Side Video Rendering & Transcoding Pipeline
- **Rule Statement:** All video rendering, subtitle compositing, and video bullet encoding MUST be executed in asynchronous cloud worker tasks via FFmpeg pipelines; client devices SHALL NOT be required to render final video binaries.
- **Description & Rationale:** Mobile reporter phones in rural areas lack the processing power and battery longevity to transcode 1080p video efficiently.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Video Worker, All Roles
- **Applicable Modules:** Video Studio, Transcoding Engine
- **Conditions / Prerequisites:** User requests video creation or reel export.
- **Expected System Behavior:** Client dispatches video job configuration to `/api/v1/video/render`. Backend enqueues job in Redis Queue, cloud worker transcodes via FFmpeg, and notifies client via WebSocket upon completion.
- **Prohibited Behavior:** Clients MUST NOT execute heavy multi-layer video transcoding in browser WebAssembly or mobile UI threads.
- **Exception Handling & Error Codes:** Basic local video trimming on Android using native MediaCodec before upload is permitted.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-VID-01`
- **Related Feature IDs:** `FEAT-VID-002`, `FEAT-VID-009`
- **Related PRD Requirement IDs:** `PRD-SEC-20`
- **Acceptance Criteria:** Video render endpoint returns job ID with HTTP 202; finished MP4 appears in cloud storage asynchronously.

---
### RULE-VID-002: Standard Video Aspect Ratios for Reels & News Bullets
- **Rule ID:** `RULE-VID-002`
- **Rule Name:** Standard Video Aspect Ratios for Reels & News Bullets
- **Rule Statement:** The Video Studio MUST enforce strict output aspect ratio profiles: 9:16 Vertical (1080x1920) for Mobile Video Reels / Shorts, and 16:9 Landscape (1920x1080) for Desktop Web and TV News Bullets.
- **Description & Rationale:** Ensures optimal full-screen playback on smartphones and high-definition clarity on web portals.
- **Classification:** `Confirmed`
- **Applicable Roles:** Standard Reporter, Trusted Reporter, Administrator
- **Applicable Modules:** Video Studio
- **Conditions / Prerequisites:** Video creation project initialization.
- **Expected System Behavior:** The rendering engine sets canvas dimensions matching the selected profile (9:16 or 16:9) and crops/pads input assets to prevent distortion.
- **Prohibited Behavior:** The system MUST NOT output arbitrary or non-standard aspect ratios (e.g. 4:3 or stretched letterboxes).
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-VID-01`
- **Related Feature IDs:** `FEAT-VID-002`
- **Related PRD Requirement IDs:** `PRD-SEC-20`
- **Acceptance Criteria:** Exported reel video header metadata verifies exact resolution of 1080x1920 or 1920x1080.

---
### RULE-VID-003: Mandatory Channel Intro/Outro Bumper Attachment
- **Rule ID:** `RULE-VID-003`
- **Rule Name:** Mandatory Channel Intro/Outro Bumper Attachment
- **Rule Statement:** All published video bullets and reels MUST automatically prepend a standardized 2-second "BREAKING NEWS WALA" brand intro bumper and append a 2-second subscription call-to-action outro bumper.
- **Description & Rationale:** Maintains uniform brand recognition and drives channel subscriptions when videos are downloaded and shared on WhatsApp or social media.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Video Pipeline
- **Applicable Modules:** Video Studio, Transcoding Engine
- **Conditions / Prerequisites:** Final video rendering execution.
- **Expected System Behavior:** FFmpeg concatenates `intro_bumper.mp4` + `story_content.mp4` + `outro_bumper.mp4` with audio crossfade.
- **Prohibited Behavior:** Reporters MUST NOT have any setting or option to remove the channel intro or outro bumpers.
- **Exception Handling & Error Codes:** Admin can update the master bumper video assets in the Admin Control Panel.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-VID-01`
- **Related Feature IDs:** `FEAT-VID-002`
- **Related PRD Requirement IDs:** `PRD-SEC-20`
- **Acceptance Criteria:** Rendered video duration matches content duration + 4 seconds corresponding to intro and outro bumpers.

---
### RULE-VID-004: Maximum Duration & File Size Constraints for Video Render
- **Rule ID:** `RULE-VID-004`
- **Rule Name:** Maximum Duration & File Size Constraints for Video Render
- **Rule Statement:** Video reels MUST have a maximum duration of 60 seconds (max 50 MB), and feature news reports MUST have a maximum duration of 300 seconds (max 200 MB), encoded in H.264/AAC MP4 format.
- **Description & Rationale:** Limits cloud storage consumption, controls bandwidth costs, and optimizes for rapid mobile consumption.
- **Classification:** `Confirmed`
- **Applicable Roles:** Standard Reporter, Trusted Reporter, Administrator
- **Applicable Modules:** Video Studio, Storage Management
- **Conditions / Prerequisites:** Video project submission or upload.
- **Expected System Behavior:** Backend checks input media duration. If duration exceeds the profile limit, video is clipped or rejected with HTTP 422 `ERR_VIDEO_DURATION_EXCEEDED`.
- **Prohibited Behavior:** The system MUST NOT accept video uploads exceeding 200 MB or durations longer than 5 minutes.
- **Exception Handling & Error Codes:** Admin live broadcasts are governed by streaming server rules.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-VID-01`
- **Related Feature IDs:** `FEAT-VID-002`
- **Related PRD Requirement IDs:** `PRD-SEC-20`
- **Acceptance Criteria:** Submitting a 70-second video for reel rendering returns validation error HTTP 422.

---
### RULE-VID-005: Automated Hindi Subtitle Generation & Devanagari Burn-in
- **Rule ID:** `RULE-VID-005`
- **Rule Name:** Automated Hindi Subtitle Generation & Devanagari Burn-in
- **Rule Statement:** When voiceover audio is supplied, the video pipeline SHOULD transcribe speech into Hindi Devanagari text using speech-to-text models and burn synchronized subtitles onto the lower third of the video reel.
- **Description & Rationale:** Over 75% of mobile video consumers watch news on mute in public places or offices; burned-in Hindi subtitles maximize engagement.
- **Classification:** `Proposed`
- **Applicable Roles:** System / AI Audio Engine, Administrator
- **Applicable Modules:** Video Studio, AI Audio Desk
- **Conditions / Prerequisites:** User enables "Auto-Subtitles" toggle on video project.
- **Expected System Behavior:** Audio is processed via Whisper / Gemini STT, timestamped SRT subtitle file is generated, and FFmpeg burns subtitles using a legible Devanagari font (Noto Sans Devanagari) with contrasting outline.
- **Prohibited Behavior:** Subtitles MUST NOT be burned in English Latin script for Hindi vernacular audio.
- **Exception Handling & Error Codes:** User may edit transcribed subtitle text in the editor before final render.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-VID-01`
- **Related Feature IDs:** `FEAT-VID-002`, `FEAT-CRE-011`
- **Related PRD Requirement IDs:** `PRD-SEC-20`
- **Acceptance Criteria:** Rendered video output features burned-in Hindi subtitle captions synchronized with audio voiceover.

---
### RULE-VID-006: Video Asset Storage Lifecycle & HLS Transcoding Standards
- **Rule ID:** `RULE-VID-006`
- **Rule Name:** Video Asset Storage Lifecycle & HLS Transcoding Standards
- **Rule Statement:** Master uploaded raw clips MUST be moved to Coldline cloud storage after 30 days, while published videos MUST be transcoded into adaptive bitrate HLS (HTTP Live Streaming - 360p, 720p, 1080p) streams served via CDN.
- **Description & Rationale:** Adaptive bitrate streaming guarantees smooth video playback even on poor 2G/3G regional mobile connections without buffering.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Storage Engine
- **Applicable Modules:** Storage Management, Content Delivery
- **Conditions / Prerequisites:** Published video asset storage.
- **Expected System Behavior:** Cloud storage lifecycle policy transitions raw assets to Coldline at 30 days. HLS m3u8 playlists and ts segments remain on hot CDN edge caches.
- **Prohibited Behavior:** The system MUST NOT serve monolithic 200 MB MP4 files directly to mobile players without adaptive streaming.
- **Exception Handling & Error Codes:** Direct MP4 downloads are provided for social media sharing buttons.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-VID-01`
- **Related Feature IDs:** `FEAT-VID-002`, `FEAT-MED-002`
- **Related PRD Requirement IDs:** `PRD-SEC-20`, `PRD-SEC-28`
- **Acceptance Criteria:** Video player requests receive `.m3u8` master playlist adapting between 360p and 1080p based on bandwidth.

---


## 17. Notification Rules (NOT)

### RULE-NOT-001: Administrative Exclusive Authority for Manual Push Broadcasts
- **Rule ID:** `RULE-NOT-001`
- **Rule Name:** Administrative Exclusive Authority for Manual Push Broadcasts
- **Rule Statement:** The capability to dispatch custom manual push notifications, state-wide breaking news alerts, or urgent editorial announcements to all app users SHALL be restricted exclusively to Platform Administrators.
- **Description & Rationale:** Mass notifications interrupt thousands of users on their lock screens. Unauthorized or careless broadcasts can cause severe brand damage and massive app uninstalls.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Notification Engine, Admin Control Panel
- **Conditions / Prerequisites:** Manual push broadcast creation.
- **Expected System Behavior:** Admin inputs notification title, body, optional target district, and deep link URL. System verifies admin token and dispatches to FCM / Web Push topics.
- **Prohibited Behavior:** Reporters, whether standard or trusted, MUST NOT have access to the manual broadcast notification dashboard.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-NOT-01`
- **Related Feature IDs:** `FEAT-NOT-001`, `FEAT-ADM-001`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-22`
- **Acceptance Criteria:** A reporter account attempting to invoke `/api/v1/admin/notifications/broadcast` receives HTTP 403.

---
### RULE-NOT-002: Automated Breaking News Trigger on Verified Fast-Track Publish
- **Rule ID:** `RULE-NOT-002`
- **Rule Name:** Automated Breaking News Trigger on Verified Fast-Track Publish
- **Rule Statement:** When an article marked with `is_breaking == true` is published by an Editor or Trusted Reporter, the system MUST automatically construct and dispatch a localized push notification to subscribers of that District within 60 seconds.
- **Description & Rationale:** Delivers true "Breaking News" velocity to citizen phones the moment critical regional developments occur.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Trusted Reporter
- **Applicable Modules:** Notification Engine, Fast-Track Publishing
- **Conditions / Prerequisites:** Article with `is_breaking = true` transitions to `status = PUBLISHED`.
- **Expected System Behavior:** Backend triggers background job `/jobs/notifications/breaking`. Job queries active FCM device tokens subscribed to `topic_district_{district_id}` and pushes alert with headline and deep-link payload.
- **Prohibited Behavior:** The system MUST NOT send automated breaking alerts for standard non-breaking articles.
- **Exception Handling & Error Codes:** If frequency capping limit is reached (RULE-NOT-003), the notification is suppressed.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-NOT-02`
- **Related Feature IDs:** `FEAT-NOT-001`
- **Related PRD Requirement IDs:** `PRD-SEC-22`
- **Acceptance Criteria:** Publishing a breaking story triggers an FCM topic broadcast to the target district within 60 seconds.

---
### RULE-NOT-003: Frequency Capping & Anti-Spam Throttling
- **Rule ID:** `RULE-NOT-003`
- **Rule Name:** Frequency Capping & Anti-Spam Throttling
- **Rule Statement:** The notification engine MUST enforce a frequency cap of at most 3 push notifications per user device within any 1-hour window and at most 10 push notifications per day, excluding national defense or natural disaster emergency alerts.
- **Description & Rationale:** Notification fatigue is the #1 cause of news app uninstalls in India. Capping frequency prevents spamming readers during busy news days.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Notification Engine
- **Applicable Modules:** Notification Engine
- **Conditions / Prerequisites:** Push alert queued for dispatch.
- **Expected System Behavior:** Backend checks the user/device notification ledger. If 3 notifications have been received in the past 60 minutes, non-critical alerts are dropped or delayed.
- **Prohibited Behavior:** The system MUST NOT send unthrottled notifications for every single published news story.
- **Exception Handling & Error Codes:** Special `EMERGENCY_DISASTER_ALERT` broadcasts authorized by Super Admin bypass frequency limits.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-NOT-01`, `WF-NOT-02`
- **Related Feature IDs:** `FEAT-NOT-001`
- **Related PRD Requirement IDs:** `PRD-SEC-22`
- **Acceptance Criteria:** A 4th push notification within one hour is suppressed by the rate-limiting gate.

---
### RULE-NOT-004: Geographic Targeting Alignment with Story Territory
- **Rule ID:** `RULE-NOT-004`
- **Rule Name:** Geographic Targeting Alignment with Story Territory
- **Rule Statement:** Automated breaking news notifications MUST be geo-targeted strictly to the FCM topic corresponding to the story's primary District; state-wide broadcast topics SHALL ONLY be triggered if the story has explicit `STATE_BREAKING_OVERRIDE` clearance.
- **Description & Rationale:** Ensures readers in Bhopal are not disturbed by local minor traffic diversions in Niwari, and vice versa.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Notification Engine, Administrator
- **Applicable Modules:** Notification Engine, Location Governance
- **Conditions / Prerequisites:** Notification topic resolution.
- **Expected System Behavior:** Target topic is set to `/topics/district_${story.district_slug}`. State topic `/topics/state_mp` is only targeted if `story.is_state_breaking == true`.
- **Prohibited Behavior:** Local district news MUST NOT be broadcast to the global/state topic.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-NOT-02`
- **Related Feature IDs:** `FEAT-NOT-001`
- **Related PRD Requirement IDs:** `PRD-SEC-21`, `PRD-SEC-22`
- **Acceptance Criteria:** Local Niwari story dispatches only to `district_niwari` topic subscribers.

---
### RULE-NOT-005: Night-Time Quiet Hours Policy for Non-Critical Alerts
- **Rule ID:** `RULE-NOT-005`
- **Rule Name:** Night-Time Quiet Hours Policy for Non-Critical Alerts
- **Rule Statement:** Between the hours of 22:00 (10:00 PM) and 06:00 (6:00 AM) Indian Standard Time (IST), the system MUST suppress sound and vibration on automated push notifications, dispatching them silently unless tagged with `CRITICAL_EMERGENCY`.
- **Description & Rationale:** Respects reader sleep hours and adheres to mobile operating system notification best practices.
- **Classification:** `Proposed`
- **Applicable Roles:** System / Notification Engine
- **Applicable Modules:** Notification Engine
- **Conditions / Prerequisites:** Notification queued between 22:00 and 06:00 IST.
- **Expected System Behavior:** Notification payload sets `notification_priority = "low"`, `sound = null`, and `channel_id = "silent_news"`. The notification appears quietly in notification drawer without waking the device.
- **Prohibited Behavior:** The system MUST NOT trigger loud alert sounds during quiet hours for routine news.
- **Exception Handling & Error Codes:** Life-safety alerts and disaster warnings bypass quiet hours with high-priority channel.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-NOT-01`, `WF-NOT-02`
- **Related Feature IDs:** `FEAT-NOT-001`
- **Related PRD Requirement IDs:** `PRD-SEC-22`
- **Acceptance Criteria:** Push notification sent at 11:30 PM IST carries silent channel flag and null sound attribute.

---
### RULE-NOT-006: Multi-Channel Dispatch Fallback (FCM, Web Push, In-App)
- **Rule ID:** `RULE-NOT-006`
- **Rule Name:** Multi-Channel Dispatch Fallback (FCM, Web Push, In-App)
- **Rule Statement:** The notification system MUST support three concurrent delivery channels: Firebase Cloud Messaging (FCM) for Native Android, W3C Web Push API for Web browsers, and In-App WebSocket toasts for active browser sessions.
- **Description & Rationale:** Ensures news alerts reach readers regardless of whether they are on desktop browsers, mobile web, or the native Android app.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Notification Engine
- **Applicable Modules:** Notification Engine
- **Conditions / Prerequisites:** Notification dispatch event.
- **Expected System Behavior:** The dispatch worker concurrently distributes payloads to FCM, WebPush gateway, and Redis pub/sub for real-time WebSocket listeners.
- **Prohibited Behavior:** The system MUST NOT rely solely on Android push while neglecting Web readers.
- **Exception Handling & Error Codes:** Users who deny browser notification permissions receive notifications only via the in-app bell tray.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-NOT-01`
- **Related Feature IDs:** `FEAT-NOT-001`
- **Related PRD Requirement IDs:** `PRD-SEC-22`
- **Acceptance Criteria:** Sending an alert dispatches to both FCM topic and WebPush subscription endpoints.

---


## 18. API Pool Rules (API)

### RULE-API-001: Dynamic Multi-Provider API Key Pooling & Management
- **Rule ID:** `RULE-API-001`
- **Rule Name:** Dynamic Multi-Provider API Key Pooling & Management
- **Rule Statement:** The platform MUST manage a pool of multiple AI provider API keys (Google Gemini, OpenAI, Anthropic Claude) stored securely in the database, capable of dynamically rotating keys based on priority, provider availability, and usage quotas.
- **Description & Rationale:** Eliminates vendor lock-in, prevents service downtime when one provider encounters outages, and distributes load across multiple free or paid tiers.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** API Pool Engine, AI Newsroom
- **Conditions / Prerequisites:** AI generation task execution.
- **Expected System Behavior:** API Pool resolver checks key status table, selects an active key with available quota matching requested model, and executes the call.
- **Prohibited Behavior:** The system MUST NOT hardcode API keys in source code files or rely on a single unmonitored API key.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-API-01`
- **Related Feature IDs:** `FEAT-API-001`
- **Related PRD Requirement IDs:** `PRD-SEC-23`
- **Acceptance Criteria:** Admin can add, edit, test, and disable API keys from the Admin API Pool settings UI.

---
### RULE-API-002: Automatic Failover on Provider Rate Limits (HTTP 429)
- **Rule ID:** `RULE-API-002`
- **Rule Name:** Automatic Failover on Provider Rate Limits (HTTP 429)
- **Rule Statement:** When an AI provider returns an HTTP 429 (Rate Limit Exceeded) or HTTP 503 (Service Unavailable), the API Pool engine MUST automatically mark that key as temporarily exhausted and failover to the next available healthy key within 500 ms.
- **Description & Rationale:** Guarantees uninterrupted newsroom operation during breaking news surges when free or standard tier AI rate limits are reached.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / API Pool Engine
- **Applicable Modules:** API Pool Engine
- **Conditions / Prerequisites:** AI provider returns HTTP 429 or 5xx error.
- **Expected System Behavior:** Engine catches error, sets `rate_limited_until = NOW() + 60s` on the active key, selects the next priority key from the pool, and retries the request transparently to the user.
- **Prohibited Behavior:** The system MUST NOT bubble a raw HTTP 429 error to the reporter without attempting failover.
- **Exception Handling & Error Codes:** If all keys across all providers are exhausted, return HTTP 503 `ERR_AI_ALL_PROVIDERS_EXHAUSTED` with retry guidance.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-API-01`, `WF-CRE-02`
- **Related Feature IDs:** `FEAT-API-001`
- **Related PRD Requirement IDs:** `PRD-SEC-23`
- **Acceptance Criteria:** Simulating an HTTP 429 on Key 1 transparently executes the request using Key 2 within 500 ms.

---
### RULE-API-003: Real-Time Key Quota Monitoring & Budget Capping
- **Rule ID:** `RULE-API-003`
- **Rule Name:** Real-Time Key Quota Monitoring & Budget Capping
- **Rule Statement:** The system MUST track token usage, request counts, and estimated cost for every API key in real time, and MUST automatically deactivate any key whose daily or monthly cost ceiling is reached.
- **Description & Rationale:** Protects the organization from accidental massive credit card billing spikes due to infinite loops or high request volumes.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / API Pool Engine, Administrator
- **Applicable Modules:** API Pool Engine, Cost Governance
- **Conditions / Prerequisites:** AI response completed.
- **Expected System Behavior:** The engine parses response token metadata, calculates cost based on provider rate tables, increments daily counters, and raises an alert if 80% of budget cap is reached.
- **Prohibited Behavior:** Keys MUST NOT continue executing requests once their explicit monthly budget cap is exceeded.
- **Exception Handling & Error Codes:** Super Admin can raise budget limits in the API Pool dashboard.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-API-01`
- **Related Feature IDs:** `FEAT-API-001`
- **Related PRD Requirement IDs:** `PRD-SEC-23`
- **Acceptance Criteria:** Reaching the cost limit transitions the key to `QUOTA_EXCEEDED` and ceases further requests on that key.

---
### RULE-API-004: Automatic Quarantine of Compromised or Defunct API Keys
- **Rule ID:** `RULE-API-004`
- **Rule Name:** Automatic Quarantine of Compromised or Defunct API Keys
- **Rule Statement:** An API key that returns HTTP 401 (Unauthorized), HTTP 403 (Invalid Key / Account Suspended), or consecutive network timeouts MUST be immediately quarantined (`status = QUARANTINED`) and an alert dispatched to Super Admins.
- **Description & Rationale:** Prevents wasteful failover cycles against dead or deactivated credentials.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / API Pool Engine, Super Admin
- **Applicable Modules:** API Pool Engine
- **Conditions / Prerequisites:** Key returns HTTP 401 or 403 from upstream provider.
- **Expected System Behavior:** Key is marked `QUARANTINED`, reason recorded as `INVALID_CREDENTIALS`, and an email/SMS alert sent to technical leads.
- **Prohibited Behavior:** The system MUST NOT retry requests using a quarantined key until an Admin validates and resets it.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-API-01`
- **Related Feature IDs:** `FEAT-API-001`
- **Related PRD Requirement IDs:** `PRD-SEC-23`
- **Acceptance Criteria:** Simulated 401 error moves key to `QUARANTINED` status immediately.

---
### RULE-API-005: Weighted Round-Robin Load Distribution Across Pool
- **Rule ID:** `RULE-API-005`
- **Rule Name:** Weighted Round-Robin Load Distribution Across Pool
- **Rule Statement:** When multiple healthy keys exist within the same provider tier, requests MUST be distributed across them using a weighted round-robin algorithm based on assigned capacity weights.
- **Description & Rationale:** Ensures even consumption of free tier rate limits across multiple developer accounts and prevents hot-spotting a single key.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / API Pool Engine
- **Applicable Modules:** API Pool Engine
- **Conditions / Prerequisites:** Selection of active key from pool.
- **Expected System Behavior:** Engine retrieves list of active keys ordered by lowest current request concurrency and weight ratio, selecting the optimal key.
- **Prohibited Behavior:** The system MUST NOT route 100% of traffic to a single key while other healthy keys sit idle.
- **Exception Handling & Error Codes:** If a specific model is requested that only one key supports, direct routing is used.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-API-01`
- **Related Feature IDs:** `FEAT-API-001`
- **Related PRD Requirement IDs:** `PRD-SEC-23`
- **Acceptance Criteria:** 100 consecutive requests distribute proportionally across available active keys.

---
### RULE-API-006: Secure Storage of API Secrets via KMS / Secret Vault
- **Rule ID:** `RULE-API-006`
- **Rule Name:** Secure Storage of API Secrets via KMS / Secret Vault
- **Rule Statement:** All raw API keys and provider secrets MUST be encrypted at rest using AES-256-GCM managed keys (AWS KMS, GCP Cloud KMS, or HashiCorp Vault); raw keys SHALL NEVER be displayed in full plaintext in the Admin UI.
- **Description & Rationale:** Guarantees that database dumps or internal dashboard viewers cannot compromise production AI API keys.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Security Architecture, Super Admin
- **Applicable Modules:** API Pool Engine, Security & Cryptography
- **Conditions / Prerequisites:** Key insertion or display in Admin Panel.
- **Expected System Behavior:** Keys are encrypted before database insertion. The Admin UI renders keys masked (e.g. `AIzaSyD...9Xq1`). Plaintext is decrypted strictly in memory at the moment of provider invocation.
- **Prohibited Behavior:** Raw API keys MUST NOT appear in server application log files or client network responses.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-API-01`
- **Related Feature IDs:** `FEAT-API-001`
- **Related PRD Requirement IDs:** `PRD-SEC-23`, `PRD-SEC-27`
- **Acceptance Criteria:** Database inspection reveals encrypted ciphertext for all stored API keys.

---


## 19. Advertisement and Monetization Rules (AD & REWARD)

### RULE-AD-001: Strict Visual & Structural Separation of Ads and Editorial Content
- **Rule ID:** `RULE-AD-001`
- **Rule Name:** Strict Visual & Structural Separation of Ads and Editorial Content
- **Rule Statement:** All advertisement banners, sponsored cards, and promotional modules MUST be visually distinct from journalistic news articles and MUST be rendered in dedicated, designated ad slots without overlapping headlines or breaking news tickers.
- **Description & Rationale:** Preserves reader trust, maintains journalistic credibility, and complies with Press Council of India and Google Publisher policies.
- **Classification:** `Confirmed`
- **Applicable Roles:** Public User, Administrator
- **Applicable Modules:** Advertisement Engine, Public Web Portal, Public Android App
- **Conditions / Prerequisites:** Rendering pages or feeds containing ad slots.
- **Expected System Behavior:** Ad slots are rendered in clearly demarcated containers with contrasting background borders and fixed aspect ratios.
- **Prohibited Behavior:** Advertisements MUST NOT disguise themselves as news headlines, mimic breaking news alerts, or cover the top breaking ticker.
- **Exception Handling & Error Codes:** Native sponsored articles are permitted provided they carry the mandatory disclosure (RULE-AD-002).
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-PUB-01`, `WF-MON-01`
- **Related Feature IDs:** `FEAT-PUB-011`, `FEAT-ADM-001`
- **Related PRD Requirement IDs:** `PRD-SEC-25`
- **Acceptance Criteria:** Visual inspection verifies no ad banners overlap editorial text or navigation elements.

---
### RULE-AD-002: Mandatory Sponsor Labeling & Disclosure Compliance
- **Rule ID:** `RULE-AD-002`
- **Rule Name:** Mandatory Sponsor Labeling & Disclosure Compliance
- **Rule Statement:** Every advertisement unit and sponsored post MUST carry a prominent, permanent label reading "विज्ञापन" (Advertisement) or "प्रायोजित" (Sponsored) in at least 10pt font adhering to ASCI advertising disclosure guidelines.
- **Description & Rationale:** Mandatory statutory and consumer protection requirement in India to avoid misleading consumers.
- **Classification:** `Confirmed`
- **Applicable Roles:** All Roles
- **Applicable Modules:** Advertisement Engine
- **Conditions / Prerequisites:** Ad rendering.
- **Expected System Behavior:** The ad component renders the standardized "विज्ञापन" badge at the top-left or top-right corner of the ad creative.
- **Prohibited Behavior:** Ad units lacking the clear Hindi/English disclosure badge MUST NOT be rendered.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-MON-01`
- **Related Feature IDs:** `FEAT-PUB-011`
- **Related PRD Requirement IDs:** `PRD-SEC-25`
- **Acceptance Criteria:** DOM inspection confirms presence of `.ad-disclosure-label` containing "विज्ञापन" on all ad containers.

---
### RULE-AD-003: Prohibition of Deceptive, Malware or Adult Ad Creatives
- **Rule ID:** `RULE-AD-003`
- **Rule Name:** Prohibition of Deceptive, Malware or Adult Ad Creatives
- **Rule Statement:** The platform MUST NOT accept, host, or render advertisements promoting illegal gambling, betting apps, adult/pornographic content, unverified financial scams, or deceptive system dialog popups ("Your phone is infected").
- **Description & Rationale:** Protects community trust in regional family households and avoids regulatory bans or app store rejections.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Advertisement Engine
- **Conditions / Prerequisites:** Admin creates custom banner or programmatic ad network config.
- **Expected System Behavior:** Ad creatives undergo administrative review and URL destination scanning. Google AdSense / Ad Manager categories for gambling and adult are blocked in settings.
- **Prohibited Behavior:** Betting and gambling creatives are strictly prohibited under Indian regional gaming laws.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-MON-01`
- **Related Feature IDs:** `FEAT-PUB-011`
- **Related PRD Requirement IDs:** `PRD-SEC-25`, `PRD-SEC-27`
- **Acceptance Criteria:** Ad blocklist configuration verifies gambling, adult, and malicious categories are blocked.

---
### RULE-AD-004: Dynamic Ad Injection Density Limits per Article
- **Rule ID:** `RULE-AD-004`
- **Rule Name:** Dynamic Ad Injection Density Limits per Article
- **Rule Statement:** In-article advertisement banners MUST be limited to a maximum density of 1 ad per 350 words of body copy, and no two ad slots may appear adjacent to each other without intervening editorial paragraphs.
- **Description & Rationale:** Prevents content clutter and maintains high Core Web Vitals (Cumulative Layout Shift) scores.
- **Classification:** `Confirmed`
- **Applicable Roles:** Public User
- **Applicable Modules:** Public Web Portal, Public Android App
- **Conditions / Prerequisites:** Rendering article body.
- **Expected System Behavior:** The layout parser injects ad slots after paragraph 3, paragraph 7, etc., ensuring at least 300 words separate ad containers.
- **Prohibited Behavior:** The system MUST NOT render back-to-back ad units without editorial content between them.
- **Exception Handling & Error Codes:** Short news bullets (< 150 words) may only show a single ad unit below the full article text.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-PUB-01`
- **Related Feature IDs:** `FEAT-PUB-011`
- **Related PRD Requirement IDs:** `PRD-SEC-25`
- **Acceptance Criteria:** An article with 400 words renders at most 1 in-article ad unit.

---
### RULE-AD-005: Administrative Custom Banner Upload & Geo-Targeting Rules
- **Rule ID:** `RULE-AD-005`
- **Rule Name:** Administrative Custom Banner Upload & Geo-Targeting Rules
- **Rule Statement:** Administrators SHALL have the capability to upload direct local sponsor banners and target them specifically to readers viewing news from selected Districts (e.g., Niwari local business ads displayed only on Niwari pages).
- **Description & Rationale:** Unlocks high-margin local direct advertising revenue from district businesses, coaching institutes, and local retailers.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Advertisement Engine, Location Governance
- **Conditions / Prerequisites:** Admin creates a direct sponsor banner campaign.
- **Expected System Behavior:** Admin selects target district, upload banner image, set click URL, and configure date range. The ad delivery service filters matching banners when user loads the district portal.
- **Prohibited Behavior:** Direct banners MUST NOT be displayed past their scheduled expiry date.
- **Exception Handling & Error Codes:** State-wide sponsorship campaigns can target all districts simultaneously.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-MON-01`
- **Related Feature IDs:** `FEAT-PUB-011`
- **Related PRD Requirement IDs:** `PRD-SEC-25`
- **Acceptance Criteria:** A banner targeted to Niwari renders on `/district/niwari` and does not render on `/district/bhopal`.

---
### RULE-REWARD-001: Reporter Performance Metric Calculation & Incentive Tiers
- **Rule ID:** `RULE-REWARD-001`
- **Rule Name:** Reporter Performance Metric Calculation & Incentive Tiers
- **Rule Statement:** The platform MAY calculate reporter performance scores based on published story count, verified readership views, and breaking news timeliness, grouping reporters into Bronze, Silver, and Gold incentive tiers.
- **Description & Rationale:** Incentivizes district correspondents to deliver high-volume, accurate, and rapid grassroots reporting.
- **Classification:** `Pending Approval`
- **Applicable Roles:** Standard Reporter, Trusted Reporter, Administrator
- **Applicable Modules:** Rewards & Gamification, Reporter Dashboard
- **Conditions / Prerequisites:** Monthly performance cycle aggregation.
- **Expected System Behavior:** Background analytics aggregate verified metrics and update reporter level. Dashboard displays scorecards and qualification status.
- **Prohibited Behavior:** The system MUST NOT award points for rejected, retracted, or duplicate stories.
- **Exception Handling & Error Codes:** Final payout conversion rates and cash awards require formal stakeholder sign-off.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-MON-01`
- **Related Feature IDs:** `FEAT-ADM-005`
- **Related PRD Requirement IDs:** `PRD-SEC-24`, `PRD-SEC-25`
- **Acceptance Criteria:** Reporter scorecard reflects accurate published story metrics.

---
### RULE-REWARD-002: Reader Referral Points & Engagement Gamification
- **Rule ID:** `RULE-REWARD-002`
- **Rule Name:** Reader Referral Points & Engagement Gamification
- **Rule Statement:** Registered public readers MAY earn engagement points for sharing articles on WhatsApp, referring new app installs, and reading daily news streaks, redeemable for subscription perks or merchandise.
- **Description & Rationale:** Drives viral word-of-mouth growth and increases daily active reader retention across regional towns.
- **Classification:** `Pending Approval`
- **Applicable Roles:** Public User
- **Applicable Modules:** Rewards & Gamification
- **Conditions / Prerequisites:** User completes a verified referral or share action.
- **Expected System Behavior:** System credits user wallet with pending points after anti-fraud validation. Streak counters update daily.
- **Prohibited Behavior:** Points MUST NOT be awarded for unverified or automated bot clicks.
- **Exception Handling & Error Codes:** Requires executive approval on monetary redemption limits before launching.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-USR-01`
- **Related Feature IDs:** `FEAT-USR-001`
- **Related PRD Requirement IDs:** `PRD-SEC-25`
- **Acceptance Criteria:** User points ledger records referral credits upon successful new user verification.

---
### RULE-REWARD-003: Anti-Fraud Click Laundering & Suspicious Velocity Detection
- **Rule ID:** `RULE-REWARD-003`
- **Rule Name:** Anti-Fraud Click Laundering & Suspicious Velocity Detection
- **Rule Statement:** The rewards engine MUST incorporate velocity checks and IP anomaly detection to identify and freeze accounts attempting to artificially inflate view counts or referral points using automated scripts or click farms.
- **Description & Rationale:** Protects the reward system from exploitation and fraudulent point drains.
- **Classification:** `Proposed`
- **Applicable Roles:** System / Security Middleware
- **Applicable Modules:** Rewards Engine, Fraud Detection
- **Conditions / Prerequisites:** Abnormal click velocity (> 10 actions/minute from single IP/device).
- **Expected System Behavior:** Points accrual is halted immediately for that account, the account is flagged for review, and points are held in `ESCROW_SUSPECTED_FRAUD`.
- **Prohibited Behavior:** The system MUST NOT pay out rewards to accounts failing fraud velocity audits.
- **Exception Handling & Error Codes:** Users can submit an appeal ticket if flagged erroneously.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-MON-01`
- **Related Feature IDs:** `FEAT-USR-001`
- **Related PRD Requirement IDs:** `PRD-SEC-25`, `PRD-SEC-27`
- **Acceptance Criteria:** High-frequency simulated clicks result in account flag and point freeze.

---


## 20. Analytics Rules (ANA)

### RULE-ANA-001: Anonymized Telemetry Collection & DPDP Act Compliance
- **Rule ID:** `RULE-ANA-001`
- **Rule Name:** Anonymized Telemetry Collection & DPDP Act Compliance
- **Rule Statement:** All user telemetry, page views, and reading event data MUST be collected with IP addresses truncated or hashed and MUST NOT store personal phone numbers, device serial numbers, or identifiable browsing history in analytics logs.
- **Description & Rationale:** Strict adherence to India's Digital Personal Data Protection (DPDP) Act and global privacy standards.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Analytics Engine, Public User
- **Applicable Modules:** Analytics Engine, Data Governance
- **Conditions / Prerequisites:** Client dispatches telemetry events (`/api/v1/analytics/event`).
- **Expected System Behavior:** Backend strips the last octet of IPv4 addresses (or last 80 bits of IPv6) and generates an ephemeral session hash. Raw IP is discarded immediately after geo-lookup.
- **Prohibited Behavior:** The system MUST NOT store raw IP addresses alongside authenticated user IDs in analytics datastores.
- **Exception Handling & Error Codes:** Security audit logs for administrative actions retain full IP records strictly for cyber forensic compliance.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-ANA-01`
- **Related Feature IDs:** `FEAT-PUB-012`
- **Related PRD Requirement IDs:** `PRD-SEC-24`, `PRD-SEC-27`
- **Acceptance Criteria:** Database inspection of analytics event tables verifies all IP fields are truncated or hashed.

---
### RULE-ANA-002: Unique Article Read & Impression De-duplication Window
- **Rule ID:** `RULE-ANA-002`
- **Rule Name:** Unique Article Read & Impression De-duplication Window
- **Rule Statement:** An article view count MUST ONLY increment once per unique user (or unique IP + User-Agent hash) within a 30-minute rolling deduplication window; rapid reloads SHALL NOT increment the public read counter.
- **Description & Rationale:** Prevents inflation of article readership numbers through accidental page refreshes or malicious hit bots.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Analytics Engine
- **Applicable Modules:** Analytics Engine
- **Conditions / Prerequisites:** User views an article page.
- **Expected System Behavior:** System checks Redis key `read_dedup:{story_id}:{user_hash}`. If key exists, event is ignored. If missing, key is set with 1800s TTL and article view counter is queued for batch increment.
- **Prohibited Behavior:** The system MUST NOT execute direct SQL `UPDATE news SET views = views + 1` on every raw HTTP request.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-ANA-01`
- **Related Feature IDs:** `FEAT-PUB-012`
- **Related PRD Requirement IDs:** `PRD-SEC-24`
- **Acceptance Criteria:** Refreshing an article 5 times within 1 minute increments the public view counter by exactly 1.

---
### RULE-ANA-003: Reporter Attribution & Aggregate Editorial Analytics
- **Rule ID:** `RULE-ANA-003`
- **Rule Name:** Reporter Attribution & Aggregate Editorial Analytics
- **Rule Statement:** The analytics engine MUST aggregate read counts, average read duration, and social share counts by author ID, providing reporters with a private dashboard displaying their personal story performance metrics.
- **Description & Rationale:** Gives field correspondents visibility into which of their district stories resonate best with local readers.
- **Classification:** `Confirmed`
- **Applicable Roles:** Standard Reporter, Trusted Reporter, Administrator
- **Applicable Modules:** Reporter Dashboard, Analytics Engine
- **Conditions / Prerequisites:** Reporter accesses "My Performance" tab.
- **Expected System Behavior:** System queries aggregated metrics for stories authored by the logged-in reporter over the selected date range.
- **Prohibited Behavior:** Standard reporters MUST NOT view private analytics or earnings data of other reporters.
- **Exception Handling & Error Codes:** Newsroom Editors and Administrators have global access to all reporter scorecards.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-ANA-01`
- **Related Feature IDs:** `FEAT-ADM-005`, `FEAT-PUB-012`
- **Related PRD Requirement IDs:** `PRD-SEC-14`, `PRD-SEC-24`
- **Acceptance Criteria:** Reporter dashboard shows aggregated metrics strictly for their own published stories.

---
### RULE-ANA-004: Real-Time Newsroom Trending & Concurrency Metric Rules
- **Rule ID:** `RULE-ANA-004`
- **Rule Name:** Real-Time Newsroom Trending & Concurrency Metric Rules
- **Rule Statement:** The Central Newsroom desk MUST display real-time active reader counts and top-5 trending stories across Madhya Pradesh calculated over a sliding 15-minute window using Redis hyperloglog or sliding counters.
- **Description & Rationale:** Enables editors to spot breaking viral stories instantly and decide whether to send push notifications or move articles to the top hero slot.
- **Classification:** `Confirmed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Central Newsroom, Analytics Engine
- **Conditions / Prerequisites:** Editor views Central Newsroom overview.
- **Expected System Behavior:** Backend queries the real-time sliding window cache and renders the live reader count and trending velocity ranking updated every 10 seconds via WebSocket.
- **Prohibited Behavior:** The system MUST NOT execute expensive full-table aggregation queries on relational databases for real-time counters.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-ANA-01`
- **Related Feature IDs:** `FEAT-ADM-009`, `FEAT-PUB-012`
- **Related PRD Requirement IDs:** `PRD-SEC-16`, `PRD-SEC-24`
- **Acceptance Criteria:** Newsroom dashboard reflects live active reader metrics updated within 10 seconds.

---
### RULE-ANA-005: Immutable Retention of Access Logs and Editorial Audit Records
- **Rule ID:** `RULE-ANA-005`
- **Rule Name:** Immutable Retention of Access Logs and Editorial Audit Records
- **Rule Statement:** System access logs, API request telemetry, and editorial mutation logs MUST be retained in immutable, write-once storage for a minimum duration of 180 days pursuant to CERT-In (Indian Computer Emergency Response Team) cybersecurity directives.
- **Description & Rationale:** Mandatory Indian statutory compliance requirement for all digital intermediaries and publishing platforms.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Security Architecture
- **Applicable Modules:** Audit & Compliance, Logging Infrastructure
- **Conditions / Prerequisites:** Log generation and retention cycle.
- **Expected System Behavior:** Logs are streamed to append-only cloud storage with bucket lock / object retention enabled, preventing modification or premature deletion.
- **Prohibited Behavior:** Administrators MUST NOT have the capability to delete or alter log entries before the 180-day retention window expires.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-ANA-01`, `WF-ADM-01`
- **Related Feature IDs:** `FEAT-ADM-001`
- **Related PRD Requirement IDs:** `PRD-SEC-27`
- **Acceptance Criteria:** Cloud storage bucket policy enforces immutable object retention for at least 180 days.

---
### RULE-ANA-006: Prohibition of Third-Party Tracking Pixel Injection
- **Rule ID:** `RULE-ANA-006`
- **Rule Name:** Prohibition of Third-Party Tracking Pixel Injection
- **Rule Statement:** Client web applications and mobile apps MUST NOT inject unapproved third-party tracking pixels, spyware SDKs, or invasive cross-site behavioral cookies that exfiltrate user reading habits to external data brokers.
- **Description & Rationale:** Protects reader privacy, ensures high performance, and eliminates third-party data leakage.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Security Architecture
- **Applicable Modules:** Public Web Portal, Public Android App
- **Conditions / Prerequisites:** Webpage header rendering and app SDK initialization.
- **Expected System Behavior:** Strict Content Security Policy (CSP) prevents loading unauthorized scripts. Only approved first-party analytics and verified ad network tags may load.
- **Prohibited Behavior:** Injecting rogue affiliate scripts or unvetted tracking pixels into templates is strictly prohibited.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-PUB-01`
- **Related Feature IDs:** `FEAT-PUB-001`
- **Related PRD Requirement IDs:** `PRD-SEC-27`
- **Acceptance Criteria:** CSP header verification confirms scripts are restricted to authorized origins.

---


## 21. Security and Audit Rules (SEC)

### RULE-SEC-001: Zero Client Trust Principle — Server-Side Validation Invariance
- **Rule ID:** `RULE-SEC-001`
- **Rule Name:** Zero Client Trust Principle — Server-Side Validation Invariance
- **Rule Statement:** The central backend API MUST independently validate and re-verify all inputs, role permissions, territorial boundaries, file types, and state transitions; under NO circumstance SHALL the backend trust client-side validation assertions.
- **Description & Rationale:** Fundamental security principle: client-side checks exist purely for user ergonomics. Attackers can bypass web forms and mobile clients using direct API tools (curl, Postman).
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Security Architecture, All Roles
- **Applicable Modules:** API Gateway, Security Middleware
- **Conditions / Prerequisites:** Every incoming API request.
- **Expected System Behavior:** API controllers execute schema validation (Zod / Joi / class-validator), extract authenticated user context from token, and verify business rules prior to executing business logic.
- **Prohibited Behavior:** Backend code MUST NOT rely on client headers (e.g. `X-User-Role: admin`) or omit server-side data sanity checks.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-ERR-02`
- **Related Feature IDs:** `FEAT-ADM-001`
- **Related PRD Requirement IDs:** `PRD-SEC-27`
- **Acceptance Criteria:** Directly dispatching an invalid payload bypassing client JS returns HTTP 422/403 from backend.

---
### RULE-SEC-002: Immutable Audit Logging for All Editorial State Mutations
- **Rule ID:** `RULE-SEC-002`
- **Rule Name:** Immutable Audit Logging for All Editorial State Mutations
- **Rule Statement:** Every creation, modification, approval, rejection, publication, retraction, and territory reassignment MUST write an immutable audit log record capturing timestamp, actor UID, IP address, previous state, new state, and delta diff.
- **Description & Rationale:** Guarantees complete legal and forensic accountability for everything published on BREAKING NEWS WALA.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Audit Engine
- **Applicable Modules:** Audit & Compliance
- **Conditions / Prerequisites:** Any editorial state transition API invoked.
- **Expected System Behavior:** Audit record is inserted into `audit_logs` table within the same database transaction. If audit insert fails, the state transition rolls back.
- **Prohibited Behavior:** No editorial mutation may proceed without a corresponding audit entry.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-EDT-01`, `WF-EDT-02`, `WF-EDT-03`
- **Related Feature IDs:** `FEAT-ADM-001`, `FEAT-ADM-009`
- **Related PRD Requirement IDs:** `PRD-SEC-27`
- **Acceptance Criteria:** Every row update in `news` table correlates to an audit row in `audit_logs`.

---
### RULE-SEC-003: Global API Rate Limiting & DDoS Shielding
- **Rule ID:** `RULE-SEC-003`
- **Rule Name:** Global API Rate Limiting & DDoS Shielding
- **Rule Statement:** The API gateway MUST enforce IP-based and user-based rate limits: public read endpoints capped at 60 requests/minute per IP, authentication endpoints at 10 requests/minute, and content creation at 30 requests/minute.
- **Description & Rationale:** Prevents denial of service attacks, scraping bots, and brute force credential attacks from degrading service availability.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Security Middleware, All Roles
- **Applicable Modules:** API Gateway, Security Middleware
- **Conditions / Prerequisites:** Incoming HTTP requests.
- **Expected System Behavior:** Gateway increments Redis sliding window counter. Exceeding limits returns HTTP 429 `ERR_RATE_LIMIT_EXCEEDED` with `Retry-After` header.
- **Prohibited Behavior:** The system MUST NOT permit unthrottled access to expensive search, AI, or rendering endpoints.
- **Exception Handling & Error Codes:** Whitelisted internal microservices and search engine crawlers (Googlebot) on public endpoints have tuned thresholds.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-ERR-01`
- **Related Feature IDs:** `FEAT-ADM-001`
- **Related PRD Requirement IDs:** `PRD-SEC-27`, `PRD-SEC-28`
- **Acceptance Criteria:** Dispatching 65 requests within 60 seconds from one IP results in HTTP 429 on request 61.

---
### RULE-SEC-004: File Upload Sandboxing, Magic Byte Verification & Malware Scan
- **Rule ID:** `RULE-SEC-004`
- **Rule Name:** File Upload Sandboxing, Magic Byte Verification & Malware Scan
- **Rule Statement:** All uploaded files MUST undergo server-side magic byte inspection to verify true MIME type, have filename randomized to prevent directory traversal, be stored outside the web root, and be processed through an automated malware scanner.
- **Description & Rationale:** Prevents remote code execution (RCE) via disguised PHP, shell scripts, or infected PDF/image uploads.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Storage Middleware
- **Applicable Modules:** Media Management, Security Middleware
- **Conditions / Prerequisites:** File upload to `/api/v1/media/upload`.
- **Expected System Behavior:** File buffer is inspected for magic bytes (e.g. `ÿØÿ` for JPEG). Original filename is discarded and replaced with a UUIDv4. File is scanned via ClamAV / Cloud Scanner before permanent storage.
- **Prohibited Behavior:** Files with mismatched magic bytes or containing executable signatures MUST NOT be saved to cloud storage.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-CRE-01`
- **Related Feature IDs:** `FEAT-MED-001`
- **Related PRD Requirement IDs:** `PRD-SEC-27`
- **Acceptance Criteria:** Uploading a PHP script renamed to `photo.jpg` is rejected with HTTP 415 or HTTP 422.

---
### RULE-SEC-005: Content Security Policy (CSP) & Cross-Site Scripting (XSS) Defenses
- **Rule ID:** `RULE-SEC-005`
- **Rule Name:** Content Security Policy (CSP) & Cross-Site Scripting (XSS) Defenses
- **Rule Statement:** All web responses MUST include strict HTTP security headers: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
- **Description & Rationale:** Mitigates cross-site scripting (XSS), clickjacking, and MIME confusion attacks in web browsers.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Web Server
- **Applicable Modules:** Web Server Configuration, Security Middleware
- **Conditions / Prerequisites:** All HTTP responses from web portals.
- **Expected System Behavior:** Reverse proxy / application server automatically attaches the required security headers to every response.
- **Prohibited Behavior:** Responses MUST NOT include `unsafe-inline` or `unsafe-eval` in production CSP without cryptographic nonces.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-PUB-01`
- **Related Feature IDs:** `FEAT-ADM-001`
- **Related PRD Requirement IDs:** `PRD-SEC-27`
- **Acceptance Criteria:** Security header scanning confirms A+ grade on Mozilla Observatory / securityheaders.com.

---
### RULE-SEC-006: SQL Injection & NoSQL Payload Sanitization Standards
- **Rule ID:** `RULE-SEC-006`
- **Rule Name:** SQL Injection & NoSQL Payload Sanitization Standards
- **Rule Statement:** All database queries MUST utilize parameterized prepared statements, Object-Relational Mapping (ORM) constructs, or structured query builders; string concatenation of user input into SQL or NoSQL queries SHALL be strictly prohibited.
- **Description & Rationale:** Eliminates SQL injection vulnerabilities across all database interaction layers.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Engineering Architecture
- **Applicable Modules:** Database Access Layer
- **Conditions / Prerequisites:** Any database read or write query.
- **Expected System Behavior:** Database drivers execute queries with bind parameters. Static analysis (SonarQube / ESLint) blocks raw string concatenation in queries during CI/CD build.
- **Prohibited Behavior:** Constructs such as `db.query("SELECT * FROM news WHERE title = '" + input + "'")` MUST NOT exist anywhere in codebase.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-ERR-02`
- **Related Feature IDs:** `FEAT-ADM-001`
- **Related PRD Requirement IDs:** `PRD-SEC-27`
- **Acceptance Criteria:** SQL injection payload `' OR 1=1 --` passed to search endpoint safely returns zero results or literal matches.

---
### RULE-SEC-007: Encryption in Transit (TLS 1.3) and At Rest (AES-256)
- **Rule ID:** `RULE-SEC-007`
- **Rule Name:** Encryption in Transit (TLS 1.3) and At Rest (AES-256)
- **Rule Statement:** All network communications MUST be encrypted in transit using TLS 1.3 (with TLS 1.2 minimum fallback), and all database records, user credentials, and media files MUST be encrypted at rest using AES-256.
- **Description & Rationale:** Guarantees end-to-end data confidentiality and protects sensitive newsroom drafts from eavesdropping or storage theft.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Infrastructure Architecture
- **Applicable Modules:** Infrastructure & Cloud Configuration
- **Conditions / Prerequisites:** All client connections and database storage volumes.
- **Expected System Behavior:** Load balancer redirects all HTTP to HTTPS with HSTS. Cloud storage buckets and database disks have customer-managed or cloud-provider AES-256 encryption enabled.
- **Prohibited Behavior:** Unencrypted plain HTTP connections MUST NOT be accepted on any production port.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-PUB-01`, `WF-ADM-01`
- **Related Feature IDs:** `FEAT-ADM-001`
- **Related PRD Requirement IDs:** `PRD-SEC-27`
- **Acceptance Criteria:** Plain HTTP request automatically redirects with HTTP 301 to HTTPS; DB volumes verify AES-256 encryption enabled.

---
### RULE-SEC-008: Administrative Dual-Authorization for High-Risk Destructive Tasks
- **Rule ID:** `RULE-SEC-008`
- **Rule Name:** Administrative Dual-Authorization for High-Risk Destructive Tasks
- **Rule Statement:** Destructive system operations, including mass user account deletion, category purges, and API key revocations, SHOULD require step-up authentication or confirmation by two independent Administrators.
- **Description & Rationale:** Mitigates insider threats and rogue administrator actions that could cripple newsroom operations.
- **Classification:** `Proposed`
- **Applicable Roles:** Administrator, Super Admin
- **Applicable Modules:** Admin Control Panel, User Governance
- **Conditions / Prerequisites:** Admin initiates bulk deletion or irreversible system purge.
- **Expected System Behavior:** System creates a pending authorization request. A second Super Admin must log in and confirm the action within 60 minutes before execution.
- **Prohibited Behavior:** A single standard Administrator MUST NOT be able to execute irreversible mass data purges.
- **Exception Handling & Error Codes:** Emergency break-glass procedure documented in corporate operational manual.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-ADM-01`
- **Related Feature IDs:** `FEAT-ADM-001`
- **Related PRD Requirement IDs:** `PRD-SEC-27`
- **Acceptance Criteria:** Attempting a mass purge creates a pending state requiring secondary approval.

---


## 22. Cross-Platform Rules (XPLAT)

### RULE-XPLAT-001: Single Shared Backend as Authoritative Single Source of Truth
- **Rule ID:** `RULE-XPLAT-001`
- **Rule Name:** Single Shared Backend as Authoritative Single Source of Truth
- **Rule Statement:** The Web Platform and the Native Android Application MUST connect to the identical shared central backend microservices, database, and authentication engine; no platform-specific business logic bifurcation SHALL be permitted.
- **Description & Rationale:** Foundational architectural requirement from PRD Section 13: ensures complete consistency in news state, permissions, and territory enforcement across all client surfaces.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Cross-Platform Architecture
- **Applicable Modules:** Core Platform Architecture, API Gateway
- **Conditions / Prerequisites:** Any client interaction on Web or Android.
- **Expected System Behavior:** Both clients invoke `/api/v1/*` REST endpoints adhering to identical OpenAPI 3.1 specifications.
- **Prohibited Behavior:** Maintaining separate backends, disparate database schemas, or differing editorial validation rules for Web vs Android is strictly prohibited.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-USR-01`, `WF-REP-01`, `WF-PUB-01`
- **Related Feature IDs:** `FEAT-ADM-001`, `FEAT-PUB-001`
- **Related PRD Requirement IDs:** `PRD-SEC-13.1`
- **Acceptance Criteria:** A story published via Web is immediately visible and consumable on the Android app, and vice versa.

---
### RULE-XPLAT-002: Strict Rule Parity Between Web and Native Android Clients
- **Rule ID:** `RULE-XPLAT-002`
- **Rule Name:** Strict Rule Parity Between Web and Native Android Clients
- **Rule Statement:** Every business rule, validation threshold, territorial restriction, and editorial workflow defined herein MUST be enforced with exact behavioral parity on both the Web Platform and the Native Android App.
- **Description & Rationale:** Prevents loopholes where a reporter could bypass restrictions on Android that exist on Web, or vice versa.
- **Classification:** `Confirmed`
- **Applicable Roles:** All Roles
- **Applicable Modules:** Web Application, Native Android App
- **Conditions / Prerequisites:** Validation logic execution.
- **Expected System Behavior:** Both clients implement matching form validation schemas matching the backend JSON schema, ensuring identical error messages and UX flows.
- **Prohibited Behavior:** The Android app MUST NOT allow actions (such as submitting outside assigned territory) that are blocked on the Web application.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-CRE-01`, `WF-TRU-01`
- **Related Feature IDs:** `FEAT-CRE-001`, `FEAT-PUB-001`
- **Related PRD Requirement IDs:** `PRD-SEC-13.1`
- **Acceptance Criteria:** Submitting invalid data produces identical HTTP 422 error codes and localized error messages on both Web and Android.

---
### RULE-XPLAT-003: Native Android Architectural Mandate (100% Kotlin & Jetpack Compose)
- **Rule ID:** `RULE-XPLAT-003`
- **Rule Name:** Native Android Architectural Mandate (100% Kotlin & Jetpack Compose)
- **Rule Statement:** The Stage B Android Application MUST be developed entirely as a fully native application using Kotlin, Android SDK, Jetpack Compose for modern declarative UI, Room for local database caching, and Retrofit/Ktor for API communication.
- **Description & Rationale:** Strict non-negotiable architectural requirement: native Android delivers superior battery efficiency, smooth 60fps scrolling, instant camera integration, and rock-solid offline reliability in rural areas.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Mobile Engineering
- **Applicable Modules:** Native Android Application
- **Conditions / Prerequisites:** Android app development and packaging.
- **Expected System Behavior:** App is compiled directly to native Android bytecode using Gradle, targeting modern Android SDK versions (minSdk 24, targetSdk 34+).
- **Prohibited Behavior:** Building the Android app using Apache Cordova, Capacitor, WebView wrappers, or converting the website URL to an APK wrapper is strictly prohibited.
- **Exception Handling & Error Codes:** In-app display of external legal privacy policies or terms of service may use Chrome Custom Tabs.
- **Enforcement Location:** `Client`
- **Related Workflow IDs:** `WF-PUB-01`
- **Related Feature IDs:** `FEAT-PUB-001`
- **Related PRD Requirement IDs:** `PRD-SEC-13.1`
- **Acceptance Criteria:** Android project repository contains purely native Kotlin codebase with Jetpack Compose dependencies and zero Cordova/Capacitor frameworks.

---
### RULE-XPLAT-004: Prohibition of WebView Packaging for Native Android Core App
- **Rule ID:** `RULE-XPLAT-004`
- **Rule Name:** Prohibition of WebView Packaging for Native Android Core App
- **Rule Statement:** Under NO circumstance SHALL the final production Android application be implemented as a WebView shell loading the web URL; all navigation, news feeds, media players, and forms MUST be native Android UI components.
- **Description & Rationale:** Reinforces RULE-XPLAT-003: ensures readers and reporters experience true native fluidity, gesture navigation, and native hardware optimization.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Mobile Engineering
- **Applicable Modules:** Native Android Application
- **Conditions / Prerequisites:** Mobile app architecture review.
- **Expected System Behavior:** UI screens are built with Jetpack Compose composables (`Scaffold`, `LazyColumn`, `TopAppBar`) rendering data fetched from REST APIs.
- **Prohibited Behavior:** Packaging the public web URL inside an Android `WebView` and submitting it as the mobile app is strictly forbidden.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Client`
- **Related Workflow IDs:** `WF-PUB-01`
- **Related Feature IDs:** `FEAT-PUB-001`
- **Related PRD Requirement IDs:** `PRD-SEC-13.1`
- **Acceptance Criteria:** Android manifest and code review confirms absence of full-screen WebView wrappers as main activity.

---
### RULE-XPLAT-005: Offline Draft Caching & Local Encrypted Storage on Android
- **Rule ID:** `RULE-XPLAT-005`
- **Rule Name:** Offline Draft Caching & Local Encrypted Storage on Android
- **Rule Statement:** The Android App MUST support offline drafting for reporters using an encrypted local Room Database with SQLCipher, automatically buffering drafts and syncing them to the backend when network connectivity is restored.
- **Description & Rationale:** Enables rural correspondents in remote villages with zero cellular reception to capture notes and save stories without data loss.
- **Classification:** `Confirmed`
- **Applicable Roles:** Standard Reporter, Trusted Reporter
- **Applicable Modules:** Native Android Application, Draft Management
- **Conditions / Prerequisites:** Reporter edits draft while device is offline.
- **Expected System Behavior:** Draft is saved to local Room DB with flag `sync_status = PENDING_SYNC`. Android WorkManager registers a network constraint trigger that automatically invokes sync API upon reconnection.
- **Prohibited Behavior:** The app MUST NOT crash, freeze, or display blocking modal errors when internet connection drops during drafting.
- **Exception Handling & Error Codes:** Publishing actions require active network connectivity and cannot complete until synced.
- **Enforcement Location:** `Client`
- **Related Workflow IDs:** `WF-CRE-01`
- **Related Feature IDs:** `FEAT-CRE-001`
- **Related PRD Requirement IDs:** `PRD-SEC-13.1`, `PRD-SEC-14`
- **Acceptance Criteria:** Creating a draft in Airplane Mode persists locally and syncs to backend within 10 seconds of reconnecting.

---
### RULE-XPLAT-006: Universal Link & Android App Link URI Schema Parity
- **Rule ID:** `RULE-XPLAT-006`
- **Rule Name:** Universal Link & Android App Link URI Schema Parity
- **Rule Statement:** All web URLs (e.g. `https://breakingnewswala.com/news/{slug}`) MUST be configured as verified Android App Links with `assetlinks.json`, opening the corresponding native story screen seamlessly when clicked on mobile devices.
- **Description & Rationale:** Ensures viral WhatsApp links open directly in the native app if installed, delivering high engagement without browser redirects.
- **Classification:** `Confirmed`
- **Applicable Roles:** Public User
- **Applicable Modules:** Deep Linking Engine, Native Android Application
- **Conditions / Prerequisites:** User clicks a Breaking News Wala news link on an Android phone.
- **Expected System Behavior:** Android OS verifies domain association via `.well-known/assetlinks.json` and launches the native `StoryDetailScreen` directly passing the slug.
- **Prohibited Behavior:** Deep links MUST NOT cause broken screens or app crashes if the article is unpublished; it must show a native "News Unavailable" card.
- **Exception Handling & Error Codes:** If app is not installed, the link opens seamlessly in the user's mobile web browser.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-PUB-01`
- **Related Feature IDs:** `FEAT-SEO-001`
- **Related PRD Requirement IDs:** `PRD-SEC-13.1`, `PRD-SEC-26`
- **Acceptance Criteria:** Clicking an article URL on an Android device with the app installed opens the native Compose screen directly.

---
### RULE-XPLAT-007: Android Background Sync & Network Resiliency Handling
- **Rule ID:** `RULE-XPLAT-007`
- **Rule Name:** Android Background Sync & Network Resiliency Handling
- **Rule Statement:** The Android application MUST utilize Android Jetpack WorkManager with exponential backoff constraints for background data sync, push notification token registration, and image upload retries.
- **Description & Rationale:** Adheres to Android modern background processing limits, preserves user battery life, and ensures upload completion over spotty 4G connections.
- **Classification:** `Confirmed`
- **Applicable Roles:** System / Mobile Engineering
- **Applicable Modules:** Native Android Application
- **Conditions / Prerequisites:** Background sync or failed network request.
- **Expected System Behavior:** WorkManager schedules background worker with `NetworkType.CONNECTED` requirement and `BackoffPolicy.EXPONENTIAL`.
- **Prohibited Behavior:** The app MUST NOT run continuous polling services or wakelocks in the background.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Client`
- **Related Workflow IDs:** `WF-CRE-01`
- **Related Feature IDs:** `FEAT-PUB-001`
- **Related PRD Requirement IDs:** `PRD-SEC-13.1`
- **Acceptance Criteria:** Draft sync worker executes reliably even if app is closed when network returns.

---
### RULE-XPLAT-008: Token Synchronization & Hardware-Backed Biometric Security
- **Rule ID:** `RULE-XPLAT-008`
- **Rule Name:** Token Synchronization & Hardware-Backed Biometric Security
- **Rule Statement:** Authentication tokens stored on Android devices MUST be saved in EncryptedSharedPreferences utilizing the Android Keystore hardware-backed security module, with optional biometric (Fingerprint / Face Unlock) app locking for reporters.
- **Description & Rationale:** Protects confidential reporter notes and editorial tokens if a reporter's physical phone is lost or stolen in the field.
- **Classification:** `Confirmed`
- **Applicable Roles:** Standard Reporter, Trusted Reporter, Administrator
- **Applicable Modules:** Native Android Application, Security & Cryptography
- **Conditions / Prerequisites:** Reporter logs into Android app.
- **Expected System Behavior:** Tokens are encrypted via AES-256-GCM using keys stored in hardware Keystore. User can enable BiometricPrompt to require fingerprint unlock on app launch.
- **Prohibited Behavior:** Plaintext storage of JWT tokens in standard SharedPreferences is strictly forbidden.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Client`
- **Related Workflow IDs:** `WF-REP-01`
- **Related Feature IDs:** `FEAT-USR-001`
- **Related PRD Requirement IDs:** `PRD-SEC-13.1`, `PRD-SEC-27`
- **Acceptance Criteria:** Rooted phone memory inspection verifies tokens are encrypted and cannot be dumped in plaintext.

---


## 23. Exceptions and Rule Conflicts Management (CONF)

### RULE-CONF-001: Hierarchical Rule Precedence Order
- **Rule ID:** `RULE-CONF-001`
- **Rule Name:** Hierarchical Rule Precedence Order
- **Rule Statement:** In the event of an operational ambiguity or conflicting rule condition, the system MUST resolve conflicts according to the strict hierarchical precedence: Security & Cyber Compliance (SEC) > Legal & Public Content Gating (PUB) > Editorial Review (EDIT) > Reporter Territory (REP) > User Preference (USER).
- **Description & Rationale:** Establishes clear, unambiguous priority logic: security and legal compliance can never be compromised by reporter or reader conveniences.
- **Classification:** `Confirmed`
- **Applicable Roles:** All Roles
- **Applicable Modules:** System Architecture, Governance Engine
- **Conditions / Prerequisites:** Two business rules evaluate to conflicting outcomes.
- **Expected System Behavior:** The rule originating from the higher-priority domain supersedes the lower-priority rule. An entry is recorded in the operational conflict log.
- **Prohibited Behavior:** Lower precedence rules (e.g. user preference) MUST NOT override security or editorial gates.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-ERR-02`
- **Related Feature IDs:** `FEAT-ADM-001`
- **Related PRD Requirement IDs:** `PRD-SEC-27`
- **Acceptance Criteria:** If a user preference conflicts with an editorial block, the editorial block prevails.

---
### RULE-CONF-002: Formal Admin Emergency Override Protocol
- **Rule ID:** `RULE-CONF-002`
- **Rule Name:** Formal Admin Emergency Override Protocol
- **Rule Statement:** An emergency override of standard publishing workflows (e.g. bypassing normal review during state disaster alerts) MUST require explicit Super Admin credential confirmation and mandatory recorded written justification.
- **Description & Rationale:** Allows agile response to unprecedented real-world emergencies while maintaining full forensic accountability.
- **Classification:** `Confirmed`
- **Applicable Roles:** Super Admin
- **Applicable Modules:** Central Newsroom, Audit & Compliance
- **Conditions / Prerequisites:** Super Admin initiates emergency override.
- **Expected System Behavior:** System prompts for emergency justification text and re-authenticates with password/MFA. An immutable `AUDIT_EMERGENCY_OVERRIDE` record is logged.
- **Prohibited Behavior:** Standard Admins or reporters MUST NOT execute emergency overrides.
- **Exception Handling & Error Codes:** None.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-ADM-01`
- **Related Feature IDs:** `FEAT-ADM-001`
- **Related PRD Requirement IDs:** `PRD-SEC-10`, `PRD-SEC-27`
- **Acceptance Criteria:** Emergency override API call succeeds only with valid Super Admin token and non-empty justification.

---
### RULE-CONF-003: Business Rule Versioning & Deprecation Lifecycle
- **Rule ID:** `RULE-CONF-003`
- **Rule Name:** Business Rule Versioning & Deprecation Lifecycle
- **Rule Statement:** Modifications, amendments, or deprecations of business rules MUST be versioned in the documentation repository with a semantic version bump and backward compatibility impact assessment before deployment.
- **Description & Rationale:** Guarantees that schema updates or rule changes do not cause regression failures across Web and Android clients.
- **Classification:** `Confirmed`
- **Applicable Roles:** Product Management, Engineering Architecture
- **Applicable Modules:** Documentation Governance
- **Conditions / Prerequisites:** Business rule revision proposed.
- **Expected System Behavior:** Document version increments (e.g. v1.0 -> v1.1). API contracts maintain backward compatibility for existing mobile app versions in the field.
- **Prohibited Behavior:** Deploying breaking rule changes that brick older active mobile app versions without API versioning is strictly prohibited.
- **Exception Handling & Error Codes:** Critical security vulnerability patches may be applied immediately with forced app update flags.
- **Enforcement Location:** `Both`
- **Related Workflow IDs:** `WF-ADM-01`
- **Related Feature IDs:** `FEAT-ADM-001`
- **Related PRD Requirement IDs:** `PRD-SEC-27`
- **Acceptance Criteria:** API gateway continues to support v1 clients when v2 rules are introduced.

---
### RULE-CONF-004: Executive Arbitration Protocol for Pending Approvals
- **Rule ID:** `RULE-CONF-004`
- **Rule Name:** Executive Arbitration Protocol for Pending Approvals
- **Rule Statement:** Rules classified as `Pending Approval` (such as monetized reward points and ad revenue shares) SHALL remain disabled in production code until formal executive sign-off is logged in the decision register.
- **Description & Rationale:** Ensures engineering does not deploy incomplete business models prematurely.
- **Classification:** `Confirmed`
- **Applicable Roles:** Product Management, Executive Leadership
- **Applicable Modules:** Product Governance
- **Conditions / Prerequisites:** Deployment of pending features.
- **Expected System Behavior:** Feature flags for pending rules default to `false`. Activation requires documented executive sign-off.
- **Prohibited Behavior:** Pending monetization rules MUST NOT be toggled active in production environments without approval.
- **Exception Handling & Error Codes:** Testing in staging environments under test accounts is permitted.
- **Enforcement Location:** `Backend`
- **Related Workflow IDs:** `WF-ADM-01`
- **Related Feature IDs:** `FEAT-ADM-001`
- **Related PRD Requirement IDs:** `PRD-SEC-33`
- **Acceptance Criteria:** Feature flag checks verify pending features evaluate to disabled in production.

---


## 24. Rule Traceability Matrix

The following matrix maps all 139 master business rules across the PRD requirements, Feature IDs, Workflow specifications, user roles, system modules, and backend/client enforcement layers.

| Rule ID | Rule Name | Classification | Primary Roles | Primary Module | Related PRD | Related Feature | Related Workflow | Enforcement |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `RULE-AUTH-001` | Reporter Registration Mandatory Verification & Identity Capture | `Confirmed` | Applicant Reporter, System Guest | Authentication & Onboarding | PRD-SEC-10, PRD-SEC-14 | FEAT-ADM-005, FEAT-USR-001 | WF-REP-01 | `Both` |
| `RULE-AUTH-002` | Administrative Approval Mandate for Reporter Activation | `Confirmed` | Administrator, Super Admin | Reporter Management | PRD-SEC-10, PRD-SEC-15 | FEAT-ADM-005 | WF-REP-01 | `Backend` |
| `RULE-AUTH-003` | Session Token Validity, Expiration & Refresh Rotation | `Confirmed` | Public User, Standard Reporter | Authentication Engine | PRD-SEC-10, PRD-SEC-27 | FEAT-USR-001, FEAT-ADM-001 | WF-USR-01, WF-REP-01, WF-ADM-01 | `Backend` |
| `RULE-AUTH-004` | Public Reader Frictionless Anonymous Access | `Confirmed` | Public User, Anonymous Guest | Public Web Portal | PRD-SEC-11.1, PRD-SEC-12 | FEAT-PUB-001, FEAT-PUB-002, FEAT-PUB-003 | WF-USR-01, WF-PUB-01 | `Both` |
| `RULE-AUTH-005` | Administrative Multi-Factor Authentication (MFA) Enforcement | `Confirmed` | Administrator, Super Admin | Admin Control Panel | PRD-SEC-10, PRD-SEC-27 | FEAT-ADM-001 | WF-ADM-01 | `Both` |
| `RULE-AUTH-006` | Account Suspension & Immediate Token Invalidation | `Confirmed` | Administrator, Super Admin | User Governance | PRD-SEC-10, PRD-SEC-27 | FEAT-ADM-005 | WF-ADM-01, WF-ERR-02 | `Backend` |
| `RULE-AUTH-007` | Brute-Force Rate Limiting & Account Lockout Guard | `Confirmed` | All Roles | Authentication Engine | PRD-SEC-27 | FEAT-ADM-001, FEAT-USR-001 | WF-USR-01, WF-ADM-01 | `Backend` |
| `RULE-AUTH-008` | Password Complexity & Cryptographic Hashing Standard | `Confirmed` | Standard Reporter, Trusted Reporter | Authentication Engine | PRD-SEC-27 | FEAT-USR-001, FEAT-ADM-001 | WF-REP-01, WF-ADM-01 | `Both` |
| `RULE-AUTH-009` | Password Reset & Account Recovery Protocol | `Proposed` | Standard Reporter, Trusted Reporter | Authentication Engine | PRD-SEC-27 | FEAT-USR-001, FEAT-ADM-001 | WF-REP-01, WF-ADM-01 | `Backend` |
| `RULE-AUTH-010` | Account Deletion & Statutory Data Retention Boundary | `Proposed` | Public User, Standard Reporter | User Governance | PRD-SEC-10, PRD-SEC-27 | FEAT-ADM-005, FEAT-USR-001 | WF-USR-01, WF-REP-01 | `Backend` |
| `RULE-ROLE-001` | Strict Role-Based Access Control (RBAC) Hierarchy | `Confirmed` | All Roles | Authorization Engine | PRD-SEC-10 | FEAT-ADM-005 | WF-USR-01, WF-REP-01, WF-ADM-01 | `Backend` |
| `RULE-ROLE-002` | Least Privilege Principle for Editorial Personas | `Confirmed` | Standard Reporter | Reporter Dashboard | PRD-SEC-10, PRD-SEC-11.2, PRD-SEC-14 | FEAT-CRE-001, FEAT-RGFX-001 | WF-CRE-01, WF-RGFX-01 | `Backend` |
| `RULE-ROLE-003` | Prohibition of Self-Permission Elevation | `Confirmed` | Standard Reporter, Trusted Reporter | User Governance | PRD-SEC-10, PRD-SEC-27 | FEAT-ADM-005 | WF-ADM-01 | `Backend` |
| `RULE-ROLE-004` | Immutable Role Assignment Auditing | `Confirmed` | Administrator, Super Admin | Audit & Compliance | PRD-SEC-27 | FEAT-ADM-005 | WF-ADM-01 | `Backend` |
| `RULE-ROLE-005` | Public Reader Authorization Boundaries | `Confirmed` | Public User | Public Web Portal | PRD-SEC-10, PRD-SEC-11.1 | FEAT-USR-001, FEAT-PUB-001 | WF-USR-01, WF-USR-02 | `Backend` |
| `RULE-ROLE-006` | Public Reader Data & Bookmark Isolation | `Confirmed` | Public User | User Profile | PRD-SEC-10, PRD-SEC-27 | FEAT-USR-001 | WF-USR-02 | `Backend` |
| `RULE-ROLE-007` | Super Admin Exclusive Privileges | `Conditional` | Super Admin | Admin Control Panel | PRD-SEC-10, PRD-SEC-23 | FEAT-ADM-001, FEAT-API-001 | WF-ADM-01, WF-API-01 | `Backend` |
| `RULE-ROLE-008` | Role Invalidation upon User Deactivation | `Confirmed` | All Roles | User Governance | PRD-SEC-10, PRD-SEC-27 | FEAT-ADM-005 | WF-ADM-01 | `Backend` |
| `RULE-REP-001` | Mandatory Territory Binding to State, District & Tehsil | `Confirmed` | Standard Reporter, Trusted Reporter | Reporter Onboarding | PRD-SEC-10, PRD-SEC-14, PRD-SEC-21 | FEAT-ADM-005, FEAT-CAT-002 | WF-REP-01 | `Both` |
| `RULE-REP-002` | Cross-District News Submission Prohibition | `Confirmed` | Standard Reporter, Trusted Reporter | News Creation Desk | PRD-SEC-10, PRD-SEC-14 | FEAT-CRE-001, FEAT-CAT-002 | WF-CRE-01, WF-TRU-01 | `Both` |
| `RULE-REP-003` | Multi-District Assignment Exclusivity to Admin | `Confirmed` | Administrator, Super Admin | Reporter Management | PRD-SEC-10, PRD-SEC-21 | FEAT-ADM-005 | WF-REP-01, WF-ADM-01 | `Backend` |
| `RULE-REP-004` | Territory Jurisdictional Fallback for Breaking State Events | `Conditional` | Standard Reporter, Trusted Reporter | News Creation Desk | PRD-SEC-10, PRD-SEC-16 | FEAT-CRE-001, FEAT-ADM-009 | WF-CRE-01, WF-EDT-01 | `Backend` |
| `RULE-REP-005` | Dynamic Territory Revocation & Reassignment Impact | `Confirmed` | Administrator, Standard Reporter | Reporter Management | PRD-SEC-10, PRD-SEC-21 | FEAT-ADM-005, FEAT-CAT-002 | WF-REP-01, WF-ADM-01 | `Backend` |
| `RULE-REP-006` | Mandatory Location Geotagging & Metadata Validation | `Confirmed` | Standard Reporter, Trusted Reporter | News Creation Desk | PRD-SEC-10, PRD-SEC-21 | FEAT-CRE-001, FEAT-CAT-002 | WF-CRE-01 | `Both` |
| `RULE-NEWS-001` | Reporter News Creation Restricted to Raw Script & Field Notes | `Confirmed` | Standard Reporter, Trusted Reporter | News Creation Desk | PRD-SEC-10, PRD-SEC-11.2, PRD-SEC-14, PRD-SEC-17.2 | FEAT-CRE-001, FEAT-RSS-001 | WF-CRE-01 | `Both` |
| `RULE-NEWS-002` | Total Prohibition of URL & RSS Import for Reporters | `Confirmed` | Standard Reporter, Trusted Reporter | API Gateway | PRD-SEC-10, PRD-SEC-17.1, PRD-SEC-17.2 | FEAT-CRE-001, FEAT-ADM-009, FEAT-ADM-010 | WF-CRE-01, WF-RSS-01, WF-URL-01 | `Backend` |
| `RULE-NEWS-003` | Headline Length, Structure & Devanagari Character Constraints | `Confirmed` | Standard Reporter, Trusted Reporter | News Creation Desk | PRD-SEC-11.2, PRD-SEC-12.2, PRD-SEC-14 | FEAT-CRE-001, FEAT-SEO-001 | WF-CRE-01, WF-EDT-01 | `Both` |
| `RULE-NEWS-004` | Body Content Formatting & Word Count Thresholds | `Confirmed` | Standard Reporter, Trusted Reporter | News Creation Desk | PRD-SEC-11.2, PRD-SEC-14 | FEAT-CRE-001 | WF-CRE-01 | `Both` |
| `RULE-NEWS-005` | Mandatory Categorization & Primary District Assignment | `Confirmed` | Standard Reporter, Trusted Reporter | News Creation Desk | PRD-SEC-11.2, PRD-SEC-21 | FEAT-CRE-001, FEAT-CAT-001, FEAT-CAT-002 | WF-CRE-01, WF-CAT-01 | `Both` |
| `RULE-NEWS-006` | Media Attachment Integrity & Permitted MIME Types | `Confirmed` | Standard Reporter, Trusted Reporter | Media Management | PRD-SEC-11.2, PRD-SEC-27 | FEAT-MED-001, FEAT-MED-002 | WF-CRE-01 | `Both` |
| `RULE-NEWS-007` | Duplicate Submission & Plagiarism Hash Detection | `Proposed` | Standard Reporter, Trusted Reporter | Editorial Desk | PRD-SEC-11.2, PRD-SEC-16 | FEAT-CRE-001, FEAT-ADM-009 | WF-CRE-01, WF-EDT-01 | `Backend` |
| `RULE-NEWS-008` | Auto-Save Draft Interval & Draft Quota Limits | `Confirmed` | Standard Reporter, Trusted Reporter | Reporter Dashboard | PRD-SEC-11.2, PRD-SEC-14 | FEAT-CRE-001 | WF-CRE-01 | `Both` |
| `RULE-NEWS-009` | Reporter Submission Finality to Review Queue | `Confirmed` | Standard Reporter | News Creation Desk | PRD-SEC-10, PRD-SEC-11.2, PRD-SEC-16 | FEAT-CRE-001, FEAT-ADM-009 | WF-CRE-01, WF-EDT-01 | `Backend` |
| `RULE-NEWS-010` | Profanity & Hate Speech Real-Time Sanitization | `Confirmed` | Standard Reporter, Trusted Reporter | Content Moderation | PRD-SEC-11.2, PRD-SEC-27 | FEAT-CRE-001, FEAT-ADM-009 | WF-CRE-01, WF-EDT-01 | `Backend` |
| `RULE-EDIT-001` | Standard Reporter Mandatory Editorial Review Gate | `Confirmed` | Standard Reporter, Administrator | Newsroom Review Desk | PRD-SEC-10, PRD-SEC-11.2, PRD-SEC-16 | FEAT-CRE-001, FEAT-ADM-009 | WF-CRE-01, WF-EDT-01 | `Backend` |
| `RULE-EDIT-002` | Trusted Reporter Fast-Track Publishing Authorization | `Conditional` | Trusted Reporter | News Creation Desk | PRD-SEC-10, PRD-SEC-14 | FEAT-CRE-017, FEAT-ADM-005 | WF-TRU-01, WF-PUB-01 | `Both` |
| `RULE-EDIT-003` | Territorial Boundary Restriction on Trusted Publishing | `Confirmed` | Trusted Reporter | News Creation Desk | PRD-SEC-10, PRD-SEC-21 | FEAT-CRE-017, FEAT-CAT-002 | WF-TRU-01, WF-EDT-01 | `Backend` |
| `RULE-EDIT-004` | Real-Time Newsroom Alert on Trusted Reporter Publication | `Confirmed` | Trusted Reporter, Administrator | Central Digital Newsroom | PRD-SEC-10, PRD-SEC-16 | FEAT-CRE-017, FEAT-ADM-009 | WF-TRU-01, WF-NOT-03 | `Both` |
| `RULE-EDIT-005` | Editorial Rejection Mandatory Reason & Reporter Feedback | `Confirmed` | Administrator, Super Admin | Newsroom Review Desk | PRD-SEC-10, PRD-SEC-16 | FEAT-ADM-009, FEAT-CRE-001 | WF-EDT-02 | `Both` |
| `RULE-EDIT-006` | Editorial In-Place Modification vs. Version History Preservation | `Confirmed` | Administrator, Super Admin | Central Newsroom Desk | PRD-SEC-16, PRD-SEC-27 | FEAT-ADM-009 | WF-EDT-01 | `Backend` |
| `RULE-EDIT-007` | Instant Retraction & Unpublishing by Editorial Admin | `Confirmed` | Administrator, Super Admin | Central Newsroom Desk | PRD-SEC-10, PRD-SEC-16, PRD-SEC-27 | FEAT-ADM-009 | WF-EDT-03 | `Both` |
| `RULE-EDIT-008` | Immediate Revocation of Trusted Reporter Privilege on Violation | `Confirmed` | Administrator, Super Admin | Reporter Management | PRD-SEC-10, PRD-SEC-14 | FEAT-ADM-005 | WF-ADM-01 | `Backend` |
| `RULE-EDIT-009` | Scheduled Publishing Chronometer & State Machine | `Proposed` | Administrator, Super Admin | Scheduler Engine | PRD-SEC-16 | FEAT-ADM-009 | WF-EDT-04 | `Backend` |
| `RULE-EDIT-010` | Co-Authoring & Multi-Editor Conflict Locking | `Proposed` | Administrator, Super Admin | Central Newsroom Desk | PRD-SEC-16 | FEAT-ADM-009 | WF-EDT-01 | `Both` |
| `RULE-PUB-001` | Strict Public Gating to Published Content Only | `Confirmed` | Public User, Anonymous Guest | Content Delivery | PRD-SEC-10, PRD-SEC-11.1 | FEAT-PUB-001, FEAT-PUB-002 | WF-PUB-01 | `Backend` |
| `RULE-PUB-002` | Permanent URL Preservation & 301 Redirection (Zero 404s) | `Confirmed` | Public User, Administrator | Routing Engine | PRD-SEC-12.1, PRD-SEC-26 | FEAT-SEO-001 | WF-PUB-02 | `Both` |
| `RULE-PUB-003` | Soft Deletion & Tombstone Presentation for Retracted News | `Confirmed` | Administrator, Super Admin | Central Newsroom | PRD-SEC-16, PRD-SEC-27 | FEAT-ADM-009 | WF-EDT-03 | `Backend` |
| `RULE-PUB-004` | Anonymous vs. Authenticated Reader Feature Gating | `Confirmed` | Public User, Anonymous Guest | Public Web Portal | PRD-SEC-11.1 | FEAT-USR-001, FEAT-PUB-001 | WF-USR-01, WF-USR-02 | `Both` |
| `RULE-PUB-005` | Cache Invalidation on Story Publication or Modification | `Confirmed` | Administrator, Trusted Reporter | Cache Management | PRD-SEC-12.1, PRD-SEC-28 | FEAT-PUB-001 | WF-PUB-01 | `Backend` |
| `RULE-PUB-006` | Territorial News Filtering & District Edition Landing | `Confirmed` | Public User | Public Web Portal | PRD-SEC-11.1, PRD-SEC-21 | FEAT-PUB-004, FEAT-CAT-002 | WF-PUB-01 | `Both` |
| `RULE-PUB-007` | Editorial Ticker & Breaking News Ribbon Precedence | `Confirmed` | Public User, Administrator | Public Web Portal | PRD-SEC-11.1, PRD-SEC-12.1 | FEAT-PUB-002, FEAT-ADM-009 | WF-PUB-01 | `Both` |
| `RULE-PUB-008` | Search Engine Indexing & Robots Directives for Non-Public States | `Confirmed` | Public User, Search Crawlers | SEO Engine | PRD-SEC-26 | FEAT-SEO-001 | WF-PUB-01 | `Backend` |
| `RULE-CAT-001` | Category Schema Mandatory Multilingual Attributes | `Confirmed` | Administrator, Super Admin | Category Management | PRD-SEC-21 | FEAT-CAT-001 | WF-CAT-01 | `Both` |
| `RULE-CAT-002` | Strict Prohibition of Hard Deletion for Active Categories | `Confirmed` | Administrator, Super Admin | Category Management | PRD-SEC-21 | FEAT-CAT-001 | WF-CAT-01 | `Backend` |
| `RULE-CAT-003` | Category Archival & Navigation Menu Deprecation | `Confirmed` | Administrator, Super Admin | Category Management | PRD-SEC-21 | FEAT-CAT-001 | WF-CAT-01 | `Both` |
| `RULE-CAT-004` | Two-Tier Category & Sub-Category Hierarchy Limits | `Confirmed` | Administrator, Super Admin | Category Management | PRD-SEC-21 | FEAT-CAT-001 | WF-CAT-01 | `Both` |
| `RULE-CAT-005` | Default Fallback Category on Story Reclassification | `Confirmed` | Administrator, Super Admin | Category Management | PRD-SEC-21 | FEAT-CAT-001 | WF-CAT-01 | `Backend` |
| `RULE-CAT-006` | Category Display Ordering & Navigation Priority Rules | `Confirmed` | Administrator, Public User | Category Management | PRD-SEC-21 | FEAT-CAT-001 | WF-CAT-01 | `Both` |
| `RULE-LOC-001` | Mandatory Geographic Hierarchy (Country -> State -> District -> Tehsil) | `Confirmed` | Administrator, Super Admin | Location Governance | PRD-SEC-21 | FEAT-CAT-002 | WF-ADM-02 | `Backend` |
| `RULE-LOC-002` | Madhya Pradesh 55-District Baseline Master Registry | `Confirmed` | System / Database Seeder, Administrator | Location Governance | PRD-SEC-21 | FEAT-CAT-002 | WF-ADM-02 | `Backend` |
| `RULE-LOC-003` | Location Integrity & Prohibition of Orphaned Tehsils | `Confirmed` | Administrator, Super Admin | Location Governance | PRD-SEC-21 | FEAT-CAT-002 | WF-ADM-02 | `Backend` |
| `RULE-LOC-004` | Location-Based Public Routing & District Hub Dynamic Views | `Confirmed` | Public User | Public Web Portal | PRD-SEC-11.1, PRD-SEC-21 | FEAT-PUB-004, FEAT-CAT-002 | WF-PUB-01 | `Both` |
| `RULE-LOC-005` | Location Entity Deletion Protection with Associated Stories | `Confirmed` | Administrator, Super Admin | Location Governance | PRD-SEC-21 | FEAT-CAT-002 | WF-ADM-02 | `Backend` |
| `RULE-LOC-006` | Multi-District Tagging Policy for Regional Stories | `Conditional` | Administrator, Super Admin | Editorial Desk | PRD-SEC-21 | FEAT-ADM-009, FEAT-CAT-002 | WF-EDT-01 | `Backend` |
| `RULE-RSS-001` | Exclusive Administrative Privilege for RSS & URL Ingestion | `Confirmed` | Administrator, Super Admin | RSS & URL Newsroom | PRD-SEC-10, PRD-SEC-17.1 | FEAT-ADM-009, FEAT-ADM-010 | WF-RSS-01, WF-URL-01 | `Both` |
| `RULE-RSS-002` | Mandatory Whitelist Domain Verification for URL Scrapers | `Confirmed` | Administrator, Super Admin | URL Scraper Desk | PRD-SEC-17.1, PRD-SEC-27 | FEAT-ADM-010 | WF-URL-01 | `Backend` |
| `RULE-RSS-003` | Source Attribution & Fair-Use Copyright Preservation | `Confirmed` | Administrator, Super Admin | RSS & URL Newsroom | PRD-SEC-17.1 | FEAT-ADM-009, FEAT-ADM-010 | WF-RSS-01, WF-URL-01 | `Backend` |
| `RULE-RSS-004` | Automated Duplicate Story Deduplication Hashing | `Confirmed` | System / RSS Poller, Administrator | RSS Engine | PRD-SEC-17.1 | FEAT-ADM-010 | WF-RSS-01 | `Backend` |
| `RULE-RSS-005` | Mandatory AI Rewriting & Human Polish before Publication | `Confirmed` | Administrator, Super Admin | Central Newsroom | PRD-SEC-17.1, PRD-SEC-18 | FEAT-ADM-009, FEAT-ADM-010 | WF-RSS-02 | `Backend` |
| `RULE-RSS-006` | Feed Ingestion Polling Interval & Rate Limit Backoff | `Confirmed` | System / Background Worker | RSS Engine | PRD-SEC-17.1 | FEAT-ADM-010 | WF-RSS-01 | `Backend` |
| `RULE-RSS-007` | Quarantine & Blacklisting of Corrupted or Defunct Feeds | `Confirmed` | System / Background Worker, Administrator | RSS Engine | PRD-SEC-17.1 | FEAT-ADM-010 | WF-RSS-01 | `Backend` |
| `RULE-AI-001` | AI Subservience Principle — AI Never Publishes Directly | `Confirmed` | System / AI Engine, All Roles | AI Newsroom | PRD-SEC-18, PRD-SEC-27 | FEAT-CRE-011, FEAT-ADM-009 | WF-CRE-02, WF-RSS-02 | `Backend` |
| `RULE-AI-002` | Default Draft State for All AI-Synthesized Articles | `Confirmed` | Standard Reporter, Trusted Reporter | AI Newsroom | PRD-SEC-18 | FEAT-CRE-011 | WF-CRE-02, WF-RSS-02 | `Both` |
| `RULE-AI-003` | Mandatory Human Editorial Review & Approval of AI Output | `Confirmed` | Administrator, Super Admin | Central Newsroom | PRD-SEC-16, PRD-SEC-18 | FEAT-ADM-009 | WF-EDT-01 | `Both` |
| `RULE-AI-004` | Strict Server-Side AI API Key Execution (Zero Client Exposure) | `Confirmed` | System / Security Architecture | API Pool Engine | PRD-SEC-18, PRD-SEC-23, PRD-SEC-27 | FEAT-API-001 | WF-CRE-02, WF-API-01 | `Backend` |
| `RULE-AI-005` | Content Hallucination & Fact-Check Guardrails | `Proposed` | System / AI Engine | AI Newsroom | PRD-SEC-18 | FEAT-CRE-011 | WF-CRE-02 | `Backend` |
| `RULE-AI-006` | Hindi Vernacular Tone & Local Dialect Adaptation Rules | `Confirmed` | System / AI Engine | AI Newsroom | PRD-SEC-12.2, PRD-SEC-18 | FEAT-CRE-011 | WF-CRE-02 | `Backend` |
| `RULE-AI-007` | Reporter AI Assist Quota & Abuse Throttling | `Proposed` | Standard Reporter, Trusted Reporter | AI Newsroom | PRD-SEC-18, PRD-SEC-23 | FEAT-CRE-011 | WF-CRE-02 | `Backend` |
| `RULE-AI-008` | AI Prompt Injection & Malicious Script Filtering | `Confirmed` | System / Security Middleware | AI Newsroom | PRD-SEC-18, PRD-SEC-27 | FEAT-CRE-011 | WF-CRE-02 | `Backend` |
| `RULE-GFX-001` | Reporter Graphics Studio Script-Only Input Restriction | `Confirmed` | Standard Reporter, Trusted Reporter | Reporter Graphics Studio | PRD-SEC-10, PRD-SEC-19 | FEAT-RGFX-001, FEAT-AGFX-001 | WF-RGFX-01 | `Both` |
| `RULE-GFX-002` | Mandatory Use of Admin-Approved Graphic Templates | `Confirmed` | Standard Reporter, Trusted Reporter | Graphics Studio | PRD-SEC-19 | FEAT-RGFX-001, FEAT-AGFX-001 | WF-RGFX-01, WF-AGFX-01 | `Both` |
| `RULE-GFX-003` | Automated Devanagari Auto-Scaling & Overflow Prevention | `Confirmed` | System / Graphics Engine, All Roles | Graphics Studio | PRD-SEC-19.1 | FEAT-RGFX-001, FEAT-AGFX-002 | WF-RGFX-01, WF-AGFX-01 | `Both` |
| `RULE-GFX-004` | Prohibition of Unrestricted File Uploads in Reporter Studio | `Confirmed` | Standard Reporter, Trusted Reporter | Reporter Graphics Studio | PRD-SEC-19, PRD-SEC-27 | FEAT-RGFX-001, FEAT-MED-001 | WF-RGFX-01 | `Backend` |
| `RULE-GFX-005` | Admin Graphics Studio Full Canvas & Template Creation Rights | `Confirmed` | Administrator, Super Admin | Admin Graphics Studio | PRD-SEC-10, PRD-SEC-19 | FEAT-AGFX-001 | WF-AGFX-01 | `Both` |
| `RULE-GFX-006` | Automatic Watermarking & Channel Branding Overlay | `Confirmed` | System / Graphics Engine, All Roles | Graphics Studio | PRD-SEC-19.1 | FEAT-RGFX-001, FEAT-AGFX-001 | WF-RGFX-01, WF-AGFX-01 | `Backend` |
| `RULE-GFX-007` | Multi-Format Aspect Ratio Output Standards (1:1, 16:9, 9:16) | `Confirmed` | Administrator, Standard Reporter | Graphics Studio | PRD-SEC-19.1 | FEAT-RGFX-001, FEAT-AGFX-001 | WF-RGFX-01, WF-AGFX-01 | `Both` |
| `RULE-GFX-008` | Admin Exclusive URL/RSS-to-Graphic Auto-Generation | `Confirmed` | Administrator, Super Admin | Central Newsroom | PRD-SEC-10, PRD-SEC-17.1, PRD-SEC-19 | FEAT-AGFX-003 | WF-AGFX-03 | `Both` |
| `RULE-VID-001` | Cloud / Server-Side Video Rendering & Transcoding Pipeline | `Confirmed` | System / Video Worker, All Roles | Video Studio | PRD-SEC-20 | FEAT-VID-002, FEAT-VID-009 | WF-VID-01 | `Backend` |
| `RULE-VID-002` | Standard Video Aspect Ratios for Reels & News Bullets | `Confirmed` | Standard Reporter, Trusted Reporter | Video Studio | PRD-SEC-20 | FEAT-VID-002 | WF-VID-01 | `Both` |
| `RULE-VID-003` | Mandatory Channel Intro/Outro Bumper Attachment | `Confirmed` | System / Video Pipeline | Video Studio | PRD-SEC-20 | FEAT-VID-002 | WF-VID-01 | `Backend` |
| `RULE-VID-004` | Maximum Duration & File Size Constraints for Video Render | `Confirmed` | Standard Reporter, Trusted Reporter | Video Studio | PRD-SEC-20 | FEAT-VID-002 | WF-VID-01 | `Both` |
| `RULE-VID-005` | Automated Hindi Subtitle Generation & Devanagari Burn-in | `Proposed` | System / AI Audio Engine, Administrator | Video Studio | PRD-SEC-20 | FEAT-VID-002, FEAT-CRE-011 | WF-VID-01 | `Backend` |
| `RULE-VID-006` | Video Asset Storage Lifecycle & HLS Transcoding Standards | `Confirmed` | System / Storage Engine | Storage Management | PRD-SEC-20, PRD-SEC-28 | FEAT-VID-002, FEAT-MED-002 | WF-VID-01 | `Backend` |
| `RULE-NOT-001` | Administrative Exclusive Authority for Manual Push Broadcasts | `Confirmed` | Administrator, Super Admin | Notification Engine | PRD-SEC-10, PRD-SEC-22 | FEAT-NOT-001, FEAT-ADM-001 | WF-NOT-01 | `Both` |
| `RULE-NOT-002` | Automated Breaking News Trigger on Verified Fast-Track Publish | `Confirmed` | Administrator, Trusted Reporter | Notification Engine | PRD-SEC-22 | FEAT-NOT-001 | WF-NOT-02 | `Backend` |
| `RULE-NOT-003` | Frequency Capping & Anti-Spam Throttling | `Confirmed` | System / Notification Engine | Notification Engine | PRD-SEC-22 | FEAT-NOT-001 | WF-NOT-01, WF-NOT-02 | `Backend` |
| `RULE-NOT-004` | Geographic Targeting Alignment with Story Territory | `Confirmed` | System / Notification Engine, Administrator | Notification Engine | PRD-SEC-21, PRD-SEC-22 | FEAT-NOT-001 | WF-NOT-02 | `Backend` |
| `RULE-NOT-005` | Night-Time Quiet Hours Policy for Non-Critical Alerts | `Proposed` | System / Notification Engine | Notification Engine | PRD-SEC-22 | FEAT-NOT-001 | WF-NOT-01, WF-NOT-02 | `Backend` |
| `RULE-NOT-006` | Multi-Channel Dispatch Fallback (FCM, Web Push, In-App) | `Confirmed` | System / Notification Engine | Notification Engine | PRD-SEC-22 | FEAT-NOT-001 | WF-NOT-01 | `Backend` |
| `RULE-API-001` | Dynamic Multi-Provider API Key Pooling & Management | `Confirmed` | Administrator, Super Admin | API Pool Engine | PRD-SEC-23 | FEAT-API-001 | WF-API-01 | `Backend` |
| `RULE-API-002` | Automatic Failover on Provider Rate Limits (HTTP 429) | `Confirmed` | System / API Pool Engine | API Pool Engine | PRD-SEC-23 | FEAT-API-001 | WF-API-01, WF-CRE-02 | `Backend` |
| `RULE-API-003` | Real-Time Key Quota Monitoring & Budget Capping | `Confirmed` | System / API Pool Engine, Administrator | API Pool Engine | PRD-SEC-23 | FEAT-API-001 | WF-API-01 | `Backend` |
| `RULE-API-004` | Automatic Quarantine of Compromised or Defunct API Keys | `Confirmed` | System / API Pool Engine, Super Admin | API Pool Engine | PRD-SEC-23 | FEAT-API-001 | WF-API-01 | `Backend` |
| `RULE-API-005` | Weighted Round-Robin Load Distribution Across Pool | `Confirmed` | System / API Pool Engine | API Pool Engine | PRD-SEC-23 | FEAT-API-001 | WF-API-01 | `Backend` |
| `RULE-API-006` | Secure Storage of API Secrets via KMS / Secret Vault | `Confirmed` | System / Security Architecture, Super Admin | API Pool Engine | PRD-SEC-23, PRD-SEC-27 | FEAT-API-001 | WF-API-01 | `Backend` |
| `RULE-AD-001` | Strict Visual & Structural Separation of Ads and Editorial Content | `Confirmed` | Public User, Administrator | Advertisement Engine | PRD-SEC-25 | FEAT-PUB-011, FEAT-ADM-001 | WF-PUB-01, WF-MON-01 | `Both` |
| `RULE-AD-002` | Mandatory Sponsor Labeling & Disclosure Compliance | `Confirmed` | All Roles | Advertisement Engine | PRD-SEC-25 | FEAT-PUB-011 | WF-MON-01 | `Both` |
| `RULE-AD-003` | Prohibition of Deceptive, Malware or Adult Ad Creatives | `Confirmed` | Administrator, Super Admin | Advertisement Engine | PRD-SEC-25, PRD-SEC-27 | FEAT-PUB-011 | WF-MON-01 | `Both` |
| `RULE-AD-004` | Dynamic Ad Injection Density Limits per Article | `Confirmed` | Public User | Public Web Portal | PRD-SEC-25 | FEAT-PUB-011 | WF-PUB-01 | `Both` |
| `RULE-AD-005` | Administrative Custom Banner Upload & Geo-Targeting Rules | `Confirmed` | Administrator, Super Admin | Advertisement Engine | PRD-SEC-25 | FEAT-PUB-011 | WF-MON-01 | `Both` |
| `RULE-REWARD-001` | Reporter Performance Metric Calculation & Incentive Tiers | `Pending Approval` | Standard Reporter, Trusted Reporter | Rewards & Gamification | PRD-SEC-24, PRD-SEC-25 | FEAT-ADM-005 | WF-MON-01 | `Backend` |
| `RULE-REWARD-002` | Reader Referral Points & Engagement Gamification | `Pending Approval` | Public User | Rewards & Gamification | PRD-SEC-25 | FEAT-USR-001 | WF-USR-01 | `Backend` |
| `RULE-REWARD-003` | Anti-Fraud Click Laundering & Suspicious Velocity Detection | `Proposed` | System / Security Middleware | Rewards Engine | PRD-SEC-25, PRD-SEC-27 | FEAT-USR-001 | WF-MON-01 | `Backend` |
| `RULE-ANA-001` | Anonymized Telemetry Collection & DPDP Act Compliance | `Confirmed` | System / Analytics Engine, Public User | Analytics Engine | PRD-SEC-24, PRD-SEC-27 | FEAT-PUB-012 | WF-ANA-01 | `Backend` |
| `RULE-ANA-002` | Unique Article Read & Impression De-duplication Window | `Confirmed` | System / Analytics Engine | Analytics Engine | PRD-SEC-24 | FEAT-PUB-012 | WF-ANA-01 | `Backend` |
| `RULE-ANA-003` | Reporter Attribution & Aggregate Editorial Analytics | `Confirmed` | Standard Reporter, Trusted Reporter | Reporter Dashboard | PRD-SEC-14, PRD-SEC-24 | FEAT-ADM-005, FEAT-PUB-012 | WF-ANA-01 | `Both` |
| `RULE-ANA-004` | Real-Time Newsroom Trending & Concurrency Metric Rules | `Confirmed` | Administrator, Super Admin | Central Newsroom | PRD-SEC-16, PRD-SEC-24 | FEAT-ADM-009, FEAT-PUB-012 | WF-ANA-01 | `Backend` |
| `RULE-ANA-005` | Immutable Retention of Access Logs and Editorial Audit Records | `Confirmed` | System / Security Architecture | Audit & Compliance | PRD-SEC-27 | FEAT-ADM-001 | WF-ANA-01, WF-ADM-01 | `Backend` |
| `RULE-ANA-006` | Prohibition of Third-Party Tracking Pixel Injection | `Confirmed` | System / Security Architecture | Public Web Portal | PRD-SEC-27 | FEAT-PUB-001 | WF-PUB-01 | `Both` |
| `RULE-SEC-001` | Zero Client Trust Principle — Server-Side Validation Invariance | `Confirmed` | System / Security Architecture, All Roles | API Gateway | PRD-SEC-27 | FEAT-ADM-001 | WF-ERR-02 | `Backend` |
| `RULE-SEC-002` | Immutable Audit Logging for All Editorial State Mutations | `Confirmed` | System / Audit Engine | Audit & Compliance | PRD-SEC-27 | FEAT-ADM-001, FEAT-ADM-009 | WF-EDT-01, WF-EDT-02, WF-EDT-03 | `Backend` |
| `RULE-SEC-003` | Global API Rate Limiting & DDoS Shielding | `Confirmed` | System / Security Middleware, All Roles | API Gateway | PRD-SEC-27, PRD-SEC-28 | FEAT-ADM-001 | WF-ERR-01 | `Backend` |
| `RULE-SEC-004` | File Upload Sandboxing, Magic Byte Verification & Malware Scan | `Confirmed` | System / Storage Middleware | Media Management | PRD-SEC-27 | FEAT-MED-001 | WF-CRE-01 | `Backend` |
| `RULE-SEC-005` | Content Security Policy (CSP) & Cross-Site Scripting (XSS) Defenses | `Confirmed` | System / Web Server | Web Server Configuration | PRD-SEC-27 | FEAT-ADM-001 | WF-PUB-01 | `Backend` |
| `RULE-SEC-006` | SQL Injection & NoSQL Payload Sanitization Standards | `Confirmed` | System / Engineering Architecture | Database Access Layer | PRD-SEC-27 | FEAT-ADM-001 | WF-ERR-02 | `Backend` |
| `RULE-SEC-007` | Encryption in Transit (TLS 1.3) and At Rest (AES-256) | `Confirmed` | System / Infrastructure Architecture | Infrastructure & Cloud Configuration | PRD-SEC-27 | FEAT-ADM-001 | WF-PUB-01, WF-ADM-01 | `Backend` |
| `RULE-SEC-008` | Administrative Dual-Authorization for High-Risk Destructive Tasks | `Proposed` | Administrator, Super Admin | Admin Control Panel | PRD-SEC-27 | FEAT-ADM-001 | WF-ADM-01 | `Both` |
| `RULE-XPLAT-001` | Single Shared Backend as Authoritative Single Source of Truth | `Confirmed` | System / Cross-Platform Architecture | Core Platform Architecture | PRD-SEC-13.1 | FEAT-ADM-001, FEAT-PUB-001 | WF-USR-01, WF-REP-01, WF-PUB-01 | `Backend` |
| `RULE-XPLAT-002` | Strict Rule Parity Between Web and Native Android Clients | `Confirmed` | All Roles | Web Application | PRD-SEC-13.1 | FEAT-CRE-001, FEAT-PUB-001 | WF-CRE-01, WF-TRU-01 | `Both` |
| `RULE-XPLAT-003` | Native Android Architectural Mandate (100% Kotlin & Jetpack Compose) | `Confirmed` | System / Mobile Engineering | Native Android Application | PRD-SEC-13.1 | FEAT-PUB-001 | WF-PUB-01 | `Client` |
| `RULE-XPLAT-004` | Prohibition of WebView Packaging for Native Android Core App | `Confirmed` | System / Mobile Engineering | Native Android Application | PRD-SEC-13.1 | FEAT-PUB-001 | WF-PUB-01 | `Client` |
| `RULE-XPLAT-005` | Offline Draft Caching & Local Encrypted Storage on Android | `Confirmed` | Standard Reporter, Trusted Reporter | Native Android Application | PRD-SEC-13.1, PRD-SEC-14 | FEAT-CRE-001 | WF-CRE-01 | `Client` |
| `RULE-XPLAT-006` | Universal Link & Android App Link URI Schema Parity | `Confirmed` | Public User | Deep Linking Engine | PRD-SEC-13.1, PRD-SEC-26 | FEAT-SEO-001 | WF-PUB-01 | `Both` |
| `RULE-XPLAT-007` | Android Background Sync & Network Resiliency Handling | `Confirmed` | System / Mobile Engineering | Native Android Application | PRD-SEC-13.1 | FEAT-PUB-001 | WF-CRE-01 | `Client` |
| `RULE-XPLAT-008` | Token Synchronization & Hardware-Backed Biometric Security | `Confirmed` | Standard Reporter, Trusted Reporter | Native Android Application | PRD-SEC-13.1, PRD-SEC-27 | FEAT-USR-001 | WF-REP-01 | `Client` |
| `RULE-CONF-001` | Hierarchical Rule Precedence Order | `Confirmed` | All Roles | System Architecture | PRD-SEC-27 | FEAT-ADM-001 | WF-ERR-02 | `Backend` |
| `RULE-CONF-002` | Formal Admin Emergency Override Protocol | `Confirmed` | Super Admin | Central Newsroom | PRD-SEC-10, PRD-SEC-27 | FEAT-ADM-001 | WF-ADM-01 | `Backend` |
| `RULE-CONF-003` | Business Rule Versioning & Deprecation Lifecycle | `Confirmed` | Product Management, Engineering Architecture | Documentation Governance | PRD-SEC-27 | FEAT-ADM-001 | WF-ADM-01 | `Both` |
| `RULE-CONF-004` | Executive Arbitration Protocol for Pending Approvals | `Confirmed` | Product Management, Executive Leadership | Product Governance | PRD-SEC-33 | FEAT-ADM-001 | WF-ADM-01 | `Backend` |



## 25. Open Questions and Pending Decisions

The following business rules and policy decisions are currently designated as `Pending Approval` or `Proposed`. They represent operational enhancements, monetization schemes, or workflow optimizations that require formal sign-off from designated stakeholders before operational activation.

---

### Decision Register

#### DEC-BRD-001: Commercial Incentive Tiers & Cash Payout Conversion for Reporters
- **Associated Rule:** `RULE-REWARD-001` (Reporter Performance Metric Calculation & Incentive Tiers)
- **Status:** `Pending Approval`
- **Question Statement:** What exact monetary conversion rate and monthly budget allocation should be instituted for reporter performance points (Bronze, Silver, Gold tiers)?
- **Context & Trade-offs:** Rewarding field correspondents with cash bonuses per published story or per 1,000 verified reads dramatically increases breaking news velocity; however, without rigid monthly budget caps and legal freelancer contracts, it exposes the company to financial liabilities and tax withholding complexities under Indian law.
- **Recommended Option:** Institute a quarterly non-cash recognition badge system with fixed monthly honorariums for top-performing district correspondents, capped at Rs. 5,000/month per district, pending Legal Counsel tax advice.
- **Alternative Options:** (A) Pure gamification with zero monetary value (badges and certificates only); (B) Direct UPI cash payouts per 10,000 verified article reads.
- **Required Authority:** Chief Financial Officer & Chief Editorial Officer.

---

#### DEC-BRD-002: Reader Engagement Gamification & Referral Rewards Policy
- **Associated Rule:** `RULE-REWARD-002` (Reader Referral Points & Engagement Gamification)
- **Status:** `Pending Approval`
- **Question Statement:** Should public readers be permitted to redeem accumulated reading streak points for real-world merchandise or subscription perks?
- **Context & Trade-offs:** Gamification drives viral app downloads across Tier 2 and Tier 3 cities; however, it attracts click farms, automated refer-a-friend bots, and fraudulent account creation.
- **Recommended Option:** Restrict reader points to in-app perks (e.g. ad-free browsing passes, exclusive e-paper access, digital badges) rather than direct cash payouts or physical merchandise.
- **Alternative Options:** (A) Partner with local brands for district coupon redemption; (B) Completely disable reader points in MVP to keep launch scope lean.
- **Required Authority:** Head of Growth & Marketing Director.

---

#### DEC-BRD-003: Automated Speech-to-Text Subtitle Burn-In for Video Studio
- **Associated Rule:** `RULE-VID-005` (Automated Hindi Subtitle Generation & Devanagari Burn-in)
- **Status:** `Proposed`
- **Question Statement:** Should automated Devanagari subtitle burn-in be enabled as a default server-side transcoding step for all uploaded video reels in MVP?
- **Context & Trade-offs:** Burns-in subtitles increase viewer retention by 40% on mobile feeds where sound is muted; however, processing audio through speech-to-text models adds approximately 15-30 seconds of compute latency and extra API costs per video render.
- **Recommended Option:** Include the feature in MVP as an opt-in toggle within the Video Studio rather than a forced default, allowing urgent breaking clips to bypass transcription for instant release.
- **Alternative Options:** (A) Make mandatory for all reels; (B) Defer to Phase 2 roadmap.
- **Required Authority:** Chief Technology Officer & Lead Video Producer.

---

#### DEC-BRD-004: Night-Time Push Notification Quiet Hours Policy
- **Associated Rule:** `RULE-NOT-005` (Night-Time Quiet Hours Policy for Non-Critical Alerts)
- **Status:** `Proposed`
- **Question Statement:** Should non-critical breaking news push notifications be silenced between 22:00 and 06:00 IST by default?
- **Context & Trade-offs:** Loud push notifications waking citizens at night trigger immediate app uninstalls; conversely, major political developments or regional accidents frequently occur late in the evening.
- **Recommended Option:** Enforce silent notifications (drawer-only, no sound/vibration) during quiet hours, while allowing genuine national defense, disaster, or amber alerts to bypass silence with user consent.
- **Alternative Options:** (A) Strict blackout with zero pushes between 10 PM and 6 AM; (B) Allow unrestricted 24/7 audible notifications.
- **Required Authority:** Chief Editorial Officer & Head of Product.

---

#### DEC-BRD-005: Administrative Step-Up Dual-Authorization for High-Risk Actions
- **Associated Rule:** `RULE-SEC-008` (Administrative Dual-Authorization for High-Risk Destructive Tasks)
- **Status:** `Proposed`
- **Question Statement:** Should catastrophic administrative actions (such as deleting an entire district database or purging category archives) require two-person cryptographic sign-off?
- **Context & Trade-offs:** Two-person authorization eliminates single-point-of-failure rogue admin attacks; however, in a small startup newsroom team, requiring two available admins during late-night emergencies can cause operational friction.
- **Recommended Option:** Require dual-authorization only for hard database purges and master API key revocations, while allowing individual Super Admins to execute urgent content retractions.
- **Alternative Options:** (A) Single Super Admin authorization with SMS OTP step-up; (B) Full dual-approval required for all administrative actions.
- **Required Authority:** Principal Security Architect & Managing Director.

---

#### DEC-BRD-006: Daily AI Assist Quota Allocation for Field Correspondents
- **Associated Rule:** `RULE-AI-007` (Reporter AI Assist Quota & Abuse Throttling)
- **Status:** `Proposed`
- **Question Statement:** What is the optimal daily quota of AI generation requests to allocate per district reporter (20 vs 50 calls/day)?
- **Context & Trade-offs:** Setting the threshold too low frustrates correspondents covering heavy news days; setting it too high invites budget overruns on external LLM token bills.
- **Recommended Option:** Cap standard reporters at 25 AI generation calls per 24-hour cycle, with automatic quota resets at midnight IST and an Admin override request button for high-volume breaking news days.
- **Alternative Options:** (A) 15 calls/day strict; (B) Dynamic quota scaling based on published story conversion rate.
- **Required Authority:** Chief Technology Officer & Financial Controller.


## 26. Completion Checklist

The following 14-point compliance checklist verifies that this specification satisfies all architectural constraints, editorial governance policies, and platform engineering mandates without deviation.

| # | Compliance Verification Criterion | Status | Verification Evidence / Canonical Rule Reference |
| :---: | :--- | :---: | :--- |
| **1** | All confirmed business rules documented without omission | **PASSED** | 139 master business rules spanning 22 distinct domain prefixes are fully documented with all 16 required specification fields. |
| **2** | Normal reporter approval requirements verified | **PASSED** | `RULE-AUTH-001`, `RULE-AUTH-002`, and `RULE-EDIT-001` mandate strict identity verification, admin onboarding approval, and mandatory submission to `PENDING_REVIEW`. |
| **3** | Trusted reporter direct-publishing permissions verified | **PASSED** | `RULE-EDIT-002`, `RULE-EDIT-003`, and `RULE-EDIT-004` strictly define fast-track publishing authority confined strictly to assigned districts with real-time newsroom alerts. |
| **4** | District and city territorial allocation verified | **PASSED** | `RULE-REP-001`, `RULE-REP-002`, and `RULE-LOC-002` enforce territorial binding to all 55 administrative districts of Madhya Pradesh with cross-district submission blocked. |
| **5** | Admin-only URL/RSS capabilities verified & protected | **PASSED** | `RULE-NEWS-001`, `RULE-NEWS-002`, and `RULE-RSS-001` completely exclude reporters from URL scraping and RSS tools, reserving them strictly for administrators. |
| **6** | Reporter Graphics Studio script-only restrictions verified | **PASSED** | `RULE-GFX-001`, `RULE-GFX-003`, and `RULE-GFX-004` restrict reporters to raw text notes input into admin templates with automated Devanagari auto-scaling. |
| **7** | Public visibility rules (only published visible, zero drafts) | **PASSED** | `RULE-PUB-001` and `RULE-PUB-008` enforce strict server-side gating ensuring that only records with `status == 'published'` are returned to public readers and crawlers. |
| **8** | Historical news preservation (zero 404s, soft delete) | **PASSED** | `RULE-PUB-002`, `RULE-PUB-003`, and `RULE-CAT-002` mandate permanent 301 redirection on slug changes, soft deletion tombstones on retractions, and prohibition of hard deletes. |
| **9** | Server-side permission enforcement (zero client trust) | **PASSED** | `RULE-SEC-001` and `RULE-ROLE-001` enforce the Zero Client Trust Principle, mandating server-side validation and cryptographic JWT claims inspection on every request. |
| **10** | Shared Web and Android business rules verified | **PASSED** | `RULE-XPLAT-001` and `RULE-XPLAT-002` establish the shared central backend as the authoritative single source of truth with absolute business logic parity across clients. |
| **11** | Kotlin and Android SDK requirements (100% native) | **PASSED** | `RULE-XPLAT-003` and `RULE-XPLAT-004` mandate a 100% native Kotlin, Android SDK, and Jetpack Compose mobile application, strictly prohibiting WebView wrappers. |
| **12** | Every rule has a unique ID and canonical prefix | **PASSED** | All 139 rules possess unique IDs with canonical prefixes (`AUTH`, `ROLE`, `REP`, `NEWS`, `EDIT`, `PUB`, `CAT`, `LOC`, `RSS`, `AI`, `GFX`, `VID`, `NOT`, `API`, `AD`, `REWARD`, `ANA`, `SEC`, `XPLAT`, `CONF`). |
| **13** | Proposed and pending rules are explicitly segregated | **PASSED** | Proposed and pending rules are explicitly marked in metadata cards, registered in Section 25, and never represented as confirmed. |
| **14** | Zero application code or configuration modified | **PASSED** | Strict documentation-only scope maintained. No application source code, database migrations, API controllers, or package configurations were touched. |

---



## 27. Related Documents & Next Steps

### 27.1 Predecessor Architectural Documentation Suite
This Master Business Rules Specification forms an integrated part of the **BREAKING NEWS WALA** technical specification library. It directly operationalizes and enforces the directives articulated in predecessor artifacts:

1. [docs/01-PRD.md](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/01-PRD.md)
   *Master Product Requirements Document (PRD v1.0.0)* — Establishes core product vision, user personas, high-level functional scope, vernacular standards, and cross-platform native strategy.
2. [docs/02-Features.md](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/02-Features.md)
   *Complete Feature Specification Document (v1.0.0)* — Provides comprehensive functional catalogs across 19 modules (A–S) with detailed UX behaviors, form schemas, and error definitions.
3. [docs/03-Plan.md](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/03-Plan.md) & [docs/Plan.md](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/Plan.md)
   *Master Engineering Roadmap & Development Plan (v1.0.0)* — Decomposes system implementation into 15 structured execution phases (Phase 0 to Phase 14) with wave assignments and milestone gates.
4. [docs/04-NFR.md](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/04-NFR.md)
   *Non-Functional Requirements & Quality Standards (v1.0.0)* — Defines measurable performance, scalability, security, availability, and cross-platform latency benchmarks.
5. [docs/05-Workflows.md](file:///c:/Users/pp/Downloads/BREAKING-NEWS-WALA-main/docs/05-Workflows.md)
   *Business and System Workflow Specification (v1.0.0)* — Maps end-to-end operational workflows (WF-01 to WF-32) across reporter filing, newsroom desks, graphics rendering, and error recovery.

### 27.2 Recommended Next Document
Pursuant to the Project Roadmap and Engineering Governance directives, the designated next sequential deliverable in the architectural design phase is:

> **Recommended Next Deliverable:** `Design.md` (or `docs/07-Design.md`) — *Complete System Architecture & Technical Design Specification*.

#### Scope for `Design.md`:
- End-to-end cloud and server architecture diagrams (C4 Model: Context, Containers, Components, Code).
- High-level microservice boundaries (Auth Service, News Ingestion Service, Graphics/Video Worker Service, Notification Service, API Pool Proxy).
- Relational and document database schemas (PostgreSQL / Firestore), foreign keys, indexes, and partitioning strategy.
- Comprehensive REST and WebSocket API contracts (OpenAPI 3.1 specifications).
- Native Android application clean architecture design (MVVM / MVI, Jetpack Compose, Room DB, Retrofit, WorkManager, Coroutines/Flow).
- Edge CDN caching, cache-invalidation topology, and media storage pipelines.

> [!IMPORTANT]
> **Directive:** Do not create `Design.md` automatically. Await formal user instruction and review of this specification before advancing to technical system design.
