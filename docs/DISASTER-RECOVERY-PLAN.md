# Comprehensive Disaster Recovery Plan (DRP)
## Project: BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
### Document ID: DOC-DRP-2026-V1.0
### Scope: Platform Resilience, Business Continuity, Outage Scenarios & Emergency Failover
### Authority: Master Prompt 09 (`BNW-MASTER-009`) — Section 9 Disaster Recovery Planning

---

## 1. Executive Summary & Disaster Recovery Objectives

As the foremost regional digital news network serving 55 districts of Madhya Pradesh, **BREAKING NEWS WALA** is essential public civic infrastructure during regional emergencies, elections, natural disasters, and breaking news crises.

This Disaster Recovery Plan (DRP) defines the organizational protocols, technical architectures, communication trees, and step-by-step restoration procedures necessary to recover from catastrophic infrastructure, cloud provider, or cyber incident failures.

### Key Resilience Metrics
- **Recovery Point Objective (RPO)**: $\le 1\text{ hour}$ (Maximum acceptable data loss window via hourly WAL backups and continuous Redis replication).
- **Recovery Time Objective (RTO)**: $\le 4\text{ hours}$ (Maximum acceptable downtime from disaster declaration to full public newsroom restoration).
- **Data Durability Target**: $99.9999999\%$ (Eleven 9s across geographically replicated cloud object storage).

---

## 2. Disaster Recovery Organizational Hierarchy & Incident Command

During an officially declared disaster, normal operational hierarchies are suspended and superseded by the **Disaster Response Team (DRT)**:

```
                            ┌───────────────────────────────┐
                            │      INCIDENT COMMANDER       │
                            │   (CTO / Principal Architect) │
                            └───────────────┬───────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    │                                               │
     ┌──────────────▼────────────┐                   ┌──────────────▼────────────┐
     │    INFRASTRUCTURE LEAD    │                   │   COMMUNICATIONS & LEGAL  │
     │     (DevOps / SRE Lead)   │                   │ (Chief Editor / Legal Counsel)│
     └──────────────┬────────────┘                   └──────────────┬────────────┘
                    │                                               │
     ┌──────────────┴────────────┐                   ┌──────────────┴────────────┐
     │ - Database Recovery       │                   │ - Public Status Page      │
     │ - DNS & Edge Failover     │                   │ - Editorial Staff Alerts  │
     │ - Secret Revocation       │                   │ - Regulatory CERT-In      │
     └───────────────────────────┘                   └───────────────────────────┘
```

### Roles and Responsibilities
- **Incident Commander (IC)**: Holds ultimate authority over disaster declaration, failover execution, and post-restoration verification.
- **Infrastructure Lead (IL)**: Executes technical runbooks, reprovisions Kubernetes/Docker clusters, restores database snapshots, and updates DNS routing.
- **Communications Lead (CL)**: Manages public status pages, internal staff messaging, advertiser notifications, and regulatory disclosures (CERT-In / DPDPA).

---

## 3. Threat Scenarios & Technical Playbooks

### Scenario 1: Primary Cloud Infrastructure / Host Outage
- **Threat Vector**: Complete datacenter failure, hypervisor crash, or network severance at the primary cloud provider.
- **Recovery Procedure**:
  1. **Triage (0-15 min)**: Confirm upstream outage via independent monitoring probes. IC declares Infrastructure Disaster.
  2. **Secondary Provisioning (15-60 min)**: Trigger Terraform / Docker Compose infrastructure deployment on secondary cloud host (e.g. Hetzner / AWS backup region).
  3. **Database Restore (60-120 min)**: Pull latest verified snapshot and continuous WAL archive from Cloudflare R2 bucket. Ingest into fresh PostgreSQL 16 cluster.
  4. **DNS Failover (120-150 min)**: Update Cloudflare edge DNS records to point `api.breakingnewswala.com` and `breakingnewswala.com` to secondary ingress IP.
  5. **Warm Cache & Verify (150-180 min)**: Execute health probes (`/api/v1/admin/monitoring/health`) and verify zero regression before restoring public traffic.

### Scenario 2: Catastrophic Database Corruption or Ransomware
- **Threat Vector**: Rogue actor, SQL injection, disk corruption, or malicious deletion affecting PostgreSQL.
- **Recovery Procedure**:
  1. **Immediate Quarantine**: Instantly sever external ingress traffic and isolate the database network to prevent further data tampering.
  2. **Snapshot Forensic Selection**: Inspect `/api/v1/admin/backup/snapshots` or storage metadata to locate the latest uncorrupted snapshot prior to the incident timestamp.
  3. **Cryptographic Validation**: Verify the SHA-256 checksum of the selected backup archive.
  4. **Sandbox Staging Ingestion**: Deploy snapshot into an isolated sandbox schema to verify table row counts and schema integrity.
  5. **Production Re-hydration**: Wipe corrupted instance, execute `pg_restore`, and reapply verified WAL files up to the point of compromise.

### Scenario 3: Mass Credential / Secret Vault Compromise
- **Threat Vector**: Leak of production `.env` file, database passwords, or administrative JWT secret keys.
- **Recovery Procedure**:
  1. **Token Invalidation**: Immediately increment `JWT_SECRET_VERSION` or roll `JWT_SECRET` in environment, invalidating 100% of active sessions.
  2. **Database Credential Rotation**: Generate new PostgreSQL and Redis passwords; update backend container configuration.
  3. **External API Key Regeneration**: Re-issue Gemini AI, Razorpay, FCM, and Cloudflare API keys from respective vendor consoles.
  4. **Session Purge**: Flush Redis session and refresh token store (`FLUSHDB` on session database).
  5. **Mandatory Password Reset**: Flag all privileged users (`SUPER_ADMIN`, `ADMIN`, `BUREAU_CHIEF`) for mandatory TOTP and password rotation upon next login.

### Scenario 4: Upstream AI Provider Outage (Gemini / Claude / Groq)
- **Threat Vector**: Total API outage or rate exhaustion from external LLM providers.
- **Recovery Procedure**:
  - The shared backend Multi-Provider AI Pool (`DOM-N`) automatically triggers circuit breakers.
  - Non-critical AI enhancements (headline generation, auto-tagging, proofreading) gracefully degrade without crashing the editorial workflow.
  - Editors retain manual entry capabilities; publishing state machines operate without interruption.

---

## 4. Disaster Recovery Testing & Validation Schedule

| Exercise Type | Frequency | Target Objective | Success Criteria |
| :--- | :--- | :--- | :--- |
| **Sandbox Restore Verification** | Weekly (Automated) | Validates snapshot archive integrity | Zero schema errors, row counts match metadata |
| **Tabletop Simulation** | Quarterly | Tests Incident Command communication | Response team mobilizes within 15 minutes |
| **Full Regional Failover Drill** | Annually | Validates complete multi-region switch | RTO $\le 4\text{ hours}$, RPO $\le 1\text{ hour}$, zero data loss |

---

## 5. Statutory Incident Reporting Compliance

In accordance with Indian cybersecurity regulations:
- **CERT-In Mandate**: Under the Indian Computer Emergency Response Team directives, cybersecurity incidents (such as unauthorized access, ransomware, or database compromise) must be formally reported within **6 hours** of notice.
- **DPDPA 2023 Compliance**: In the event of personal data breach, affected Data Principals and the Data Protection Board of India must be notified in the prescribed manner and timeframe.

