# @bnw/backend — Shared Central Backend API Engine

## Role & Responsibilities
The unified, modular monolith REST API service and background worker engine serving all client surfaces (Web, Reporter, Newsroom, Admin, and future Android).

- **Runtime**: Node.js LTS (v20+) with Express and TypeScript — Confirmed (`DEC-011`, `DEC-012`).
- **Database**: PostgreSQL 16 with Prisma ORM — Confirmed (`DEC-017`, `DEC-018`).
- **Caching & Queues**: Redis 7 and BullMQ — Confirmed (`DEC-014`, `DEC-015`).
- **API Versioning**: Standardized REST contracts under `/api/v1/*` — Confirmed (`DEC-025`).

## Domain Modules Structure (`src/modules/`)
- `auth`: Dual-token JWT authentication, Argon2id hashing, TOTP MFA.
- `editorial`: Article lifecycle state machine, diff tracking, fact-check scoring.
- `territory`: 55 MP districts, 10 divisions, tehsil routing.
- `ai`: Multi-provider AI API Pool router (Gemini, Claude, Groq).
- `rss`: Feed ingestion, XML parsing, deduplication.
- `media`: Presigned R2 uploads, WebP transcoding, asset catalog.
- `notifications`: FCM push dispatch, in-app alerts, Web Push.
- `monetization`: Ad placement inventory, gamification coin ledger.
