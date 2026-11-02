# Centralized Security Risk Register & Governance Matrix
## Project: BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
### Document ID: DOC-SEC-RISK-REG-2026-V1.0
### Scope: Platform-Wide Security Governance, Vulnerability Catalog & Risk Posture
### Authority: Master Prompt 09 (`BNW-MASTER-009`) — Enterprise Security & Production

---

## 1. Executive Summary & Governance Overview

This centralized Security Risk Register establishes the authoritative accounting of audited security risks, potential threat vectors, mitigations, and verification states across the **BREAKING NEWS WALA** platform.

Every security risk is tracked under strict governance rules:
- **No speculative mitigations**: A finding cannot be marked `MITIGATED` or `VERIFIED` without concrete code implementations, empirical test results, or verified operational procedures.
- **Invariant preservation**: All governance invariants (`DEC-048`, `DEC-060`, `DEC-069`, `DEC-070`, `RULE-REWARD-002`) remain strictly enforced.
- **Server-Side Enforcement**: All authorization, territorial jurisdiction, and validation logic is executed strictly on the central backend API server.

---

## 2. Risk Classification Framework

### 2.1 Severity Levels
- **CRITICAL**: Immediate threat to platform integrity, sensitive data compromise, unauthorized code execution, or full administrative takeover. Requires zero unmitigated instances before production launch.
- **HIGH**: Substantial risk of unauthorized data access, privilege escalation, severe denial of service, or financial/journalistic reputational compromise.
- **MEDIUM**: Circumvention of secondary defenses, potential rate-limit exhaustion, minor SSRF leak in controlled environments, or non-sensitive information leakage.
- **LOW**: Minor security hygiene deficiencies, suboptimal configuration defaults, or missing non-critical security headers.
- **INFORMATIONAL**: Architectural observations, roadmap security enhancements, or informational audit notes.

### 2.2 Status Taxonomy
- **OPEN**: Identified vulnerability awaiting remediation planning.
- **IN_PROGRESS**: Remediation implementation currently underway.
- **MITIGATED**: Code or architectural fix deployed in application code.
- **ACCEPTED**: Documented risk explicitly accepted by platform leadership with compensating controls.
- **DEFERRED**: Remediations intentionally deferred to a future roadmap phase (e.g. Phase 3 Android).
- **VERIFIED**: Empirically proven resolved through automated unit/integration tests or runtime execution proof.

---

## 3. Comprehensive Security Risk Register Matrix

| Finding ID | Domain / Module | Description | Severity | Likelihood | Impact | Status | Verification Method |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **SEC-FIND-001** | `auth` / Password Hashing | Inadequate password hashing parameters could allow GPU-accelerated credential cracking. | HIGH | LOW | HIGH | **VERIFIED** | Unit test verifying Argon2id parameters: memory $\ge 64\,\text{MB}$, iterations $\ge 3$, parallelism $\ge 1$. |
| **SEC-FIND-002** | `auth` / Token Lifecycle | Refresh token replay or theft could allow unauthorized persistent user impersonation. | HIGH | MEDIUM | HIGH | **VERIFIED** | Single-flight refresh mutex test, replay theft detection triggering family revocation, 15m access token limit. |
| **SEC-FIND-003** | `auth` / Enumeration | Verbose authentication errors leaking user account existence during login/reset. | MEDIUM | HIGH | LOW | **VERIFIED** | Standardized error message tests for invalid user/password across login and registration flows. |
| **SEC-FIND-004** | `rbac` / Governance | Unauthorized assumption of Chief Editor privileges bypassing executive review. | CRITICAL | MEDIUM | CRITICAL | **VERIFIED** | `DEC-048` enforcement test: `ROLE_CHIEF_EDITOR` rejected with `403 Forbidden` (`ERR_ROLE_PENDING_APPROVAL`). |
| **SEC-FIND-005** | `rbac` / IDOR Defense | Broken object-level authorization allowing reporters/stringers to tamper with peer articles. | HIGH | MEDIUM | HIGH | **VERIFIED** | `verifyResourceOwnership` middleware test: stringers editing non-owned articles blocked with `403 Forbidden`. |
| **SEC-FIND-006** | `rbac` / Territory Beat | Stringers publishing news outside their assigned MP district boundary violating journalistic beat. | HIGH | LOW | HIGH | **VERIFIED** | `verifyTerritoryJurisdiction` test enforcing `RULE-GEO-001`: stringer outside assigned beat blocked with `403`. |
| **SEC-FIND-007** | `network` / SSRF Defense | Unrestricted URL fetching in RSS/scraper engines allowing access to private VPC/cloud metadata. | CRITICAL | MEDIUM | CRITICAL | **VERIFIED** | Anti-SSRF URL validator test blocking RFC-1918 IPs (`10.x`, `172.16.x`, `192.168.x`), loopback `127.0.0.1`, `[::1]`, and AWS/GCP metadata `169.254.169.254`. |
| **SEC-FIND-008** | `storage` / Path Traversal | Directory traversal characters in filename payloads leading to arbitrary file system writes. | HIGH | LOW | CRITICAL | **VERIFIED** | `sanitizeFilePath` test stripping `../`, `..\`, shell punctuation, and path delimiters while preserving valid extensions. |
| **SEC-FIND-009** | `storage` / MIME Spoofing | Uploading malicious executable scripts disguised with misleading `.pdf` or `.jpg` extensions. | HIGH | MEDIUM | HIGH | **VERIFIED** | `validateMimeMagicBytes` test validating binary signatures for PDF (`%PDF-`), JPEG, PNG, WebP, MP4. |
| **SEC-FIND-010** | `ingress` / Rate Limiting | Distributed abusive requests exhausting backend computational and database resources. | HIGH | HIGH | HIGH | **VERIFIED** | Sliding-window rate limiter test enforcing 7 distinct tiers (`auth: 10`, `public: 1000`, `search: 60`, `telemetry: 300`, `media: 20`, `ai: 30`, `admin: 120` per min) with `429` & `Retry-After`. |
| **SEC-FIND-011** | `audit` / Forensics | Missing or delayed persistence of administrative actions preventing forensic auditability. | MEDIUM | LOW | HIGH | **VERIFIED** | Non-blocking `security-audit.service.ts` test verifying sensitive field redaction (passwords, tokens) and audit emission. |
| **SEC-FIND-012** | `backup` / Disaster Recovery | Database corruption or hardware failure causing unrecoverable regional news loss. | CRITICAL | LOW | CRITICAL | **VERIFIED** | Automated backup snapshot generation test, SHA-256 archive checksum verification, and isolated sandbox restore test procedure. |

---

## 4. Detailed Finding Profiles & Remediation Architecture

### SEC-FIND-001: Argon2id Password Hashing Validation
- **Module**: `packages/backend/src/modules/auth/`
- **Threat Vector**: Weak salt generation or insufficient computational cost parameters allow offline rainbow table or GPU hash inversion attacks.
- **Remediation**: Codified standard parameters in `security.util.ts` and auth service:
  - Memory Cost: $65,536\,\text{KB}$ ($64\,\text{MB}$)
  - Iterations (Time Cost): $3$
  - Parallelism: $1$
  - Hash Length: $32$ bytes
- **Empirical Evidence**: Test `Argon2id hashing standard compliance` in `security.test.ts` passes.

### SEC-FIND-002: Dual-Token JWT & Single-Flight Refresh Mutex
- **Module**: `packages/backend/src/modules/auth/`
- **Threat Vector**: Concurrent refresh token requests causing race conditions, or stolen refresh tokens used concurrently by an attacker.
- **Remediation**:
  - Access Token TTL: Exactly $15\text{ minutes}$ (900 seconds).
  - Refresh Token TTL: $7\text{ days}$ stored in `HttpOnly, Secure, SameSite=Lax` cookies.
  - Refresh Mutex: An in-flight lock serializes concurrent refresh attempts from the same client session.
  - Replay Detection: If an invalidated refresh token is reused, the entire token family is immediately revoked, forcing re-authentication.
- **Empirical Evidence**: Tests `Dual-token JWT structure` and `Refresh token family revocation on reuse` in `security.test.ts` pass.

### SEC-FIND-004: Invariant DEC-048 (Chief Editor Role Rejection)
- **Module**: `packages/backend/src/middleware/rbac.ts`
- **Threat Vector**: Unauthorized users assigning or assuming `ROLE_CHIEF_EDITOR` to bypass editorial approvals before formal board approval.
- **Remediation**: `assertNoChiefEditor` middleware explicitly intercepts any token or request containing `ROLE_CHIEF_EDITOR` or `CHIEF_EDITOR` and returns an immediate `403 Forbidden` (`ERR_ROLE_PENDING_APPROVAL`).
- **Empirical Evidence**: Test `RBAC rejects ROLE_CHIEF_EDITOR per DEC-048` passes.

### SEC-FIND-007: Anti-SSRF Perimeter Protection
- **Module**: `packages/backend/src/utils/security.util.ts`
- **Threat Vector**: Attacker supplying internal IP URLs (e.g. `http://169.254.169.254/latest/meta-data/` or `http://10.0.0.5:5432`) to RSS ingestion or social embed fetchers.
- **Remediation**: `validateAntiSsrfUrl` parses URLs, resolves IPv4/IPv6 hostnames, and blocks:
  - Private IPv4 ranges: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
  - Loopbacks: `127.0.0.0/8`, `localhost`, `[::1]`
  - Link-Local & Cloud Metadata: `169.254.0.0/16`
  - Non-HTTP(S) protocols: `file:`, `gopher:`, `ftp:`, `ldap:`
- **Empirical Evidence**: Test `Anti-SSRF blocks private IP ranges and loopbacks` in `security.test.ts` passes.

### SEC-FIND-010: Sliding-Window Multi-Tier Rate Limiting
- **Module**: `packages/backend/src/middleware/rate-limiter.ts`
- **Threat Vector**: Denial-of-Service attacks, credential stuffing, search endpoint scraping, or AI credit depletion.
- **Remediation**: Implemented in-memory sliding-window rate limiter with Redis-ready clustering semantics across 7 tiers:
  - `auth`: $10\text{ req/min}$
  - `public`: $1000\text{ req/min}$
  - `search`: $60\text{ req/min}$
  - `telemetry`: $300\text{ req/min}$
  - `media`: $20\text{ req/min}$
  - `ai`: $30\text{ req/min}$
  - `admin`: $120\text{ req/min}$
  - Emits `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `Retry-After`.
- **Empirical Evidence**: Test `Rate limiter enforces tier limits and emits retry headers` passes.

---

## 5. Summary Risk Posture & Production Recommendation

| Total Findings | Critical | High | Medium | Low | Informational | Status Posture |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **12** | **3** | **6** | **2** | **1** | **0** | **100% Mitigated / Verified in Code** |

All Critical and High application security vulnerabilities have been remediated and verified with automated test suites. Production readiness is **`CONDITIONALLY READY`**, pending containerization, KMS secret injection, and live database cluster configuration.

