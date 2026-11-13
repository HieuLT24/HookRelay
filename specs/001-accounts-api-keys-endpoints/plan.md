# Implementation Plan: Accounts, API Keys, and Webhook Endpoints

**Branch**: `001-accounts-api-keys-endpoints` | **Date**: 2026-11-13 | **Spec**: [spec.md](./spec.md)

## Summary

Implement the first dashboard/API boundary for HookRelay as a NestJS modular monolith. Add Prisma migrations and tenant-scoped persistence for users, API keys, and webhook endpoints; Passport + JWT dashboard authentication; Argon2 password hashing; SHA-256 API-key hashing with a stored prefix; class-validator DTOs; Swagger contracts; and a reusable SSRF URL validation service. The same SSRF service must be callable during endpoint configuration and again by the delivery engine immediately before sending. Endpoint deletion is a soft delete through `deleted_at`; no `refresh_tokens` table or refresh-token flow is included.

## Technical Context

**Language/Version**: Node.js LTS (repository requires Node >=22.18.0), TypeScript 6

**Primary Dependencies**: NestJS, Prisma, PostgreSQL, Passport/JWT, Argon2, class-validator/class-transformer, Swagger, BullMQ/Redis, undici

**Storage**: PostgreSQL is the source of truth; Prisma schema and migrations own persistence. Redis/BullMQ remain scheduling infrastructure only.

**Testing**: Jest, Nest testing utilities, Supertest; integration and failure/security tests use real PostgreSQL and Redis where applicable.

**Target Platform**: Linux containers through Docker Compose; separate API and worker entry points.

**Project Type**: Modular monolith web service with REST API and worker process.

**Performance Goals**: Keep CRUD and auth operations bounded and suitable for the existing service scale; avoid unbounded DNS/request work in SSRF checks and preserve bounded outbound delivery behavior.

**Constraints**: Every query is tenant-scoped from authenticated context; no credential or secret logging; JWT access tokens expire after one hour; API keys never expire but are revocable; maximum 10 active keys per tenant; endpoint updates are atomic; endpoint deletion preserves history; HTTPS is required unless explicitly enabled for local development; blocked DNS/IP destinations are rejected at registration and send time.

**Scale/Scope**: One developer account is one tenant; this feature covers account, API-key, and endpoint management plus the reusable URL-safety boundary. Event ingestion and delivery persistence already exist in the domain model, but this feature does not add delivery behavior beyond the send-time validation seam.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Fixed stack and modular monolith**: PASS. Uses Node/TypeScript/NestJS/PostgreSQL/Prisma/BullMQ/Redis/Docker Compose and the existing API/worker entry points.
- **II. PostgreSQL source of truth**: PASS. Prisma migrations persist users, keys, endpoints, and `deleted_at`; queues do not own durable state.
- **III. At-least-once delivery**: PASS. The plan does not claim exactly-once behavior and keeps endpoint deletion compatible with retained delivery history.
- **IV. Tenant isolation and security**: PASS. Argon2, JWT/Passport, SHA-256 key hashes plus prefixes, DTO validation, secret masking, tenant-scoped queries, login throttling, and reusable SSRF checks are required.
- **V. Evidence, scope, and operability**: PASS with implementation gate. Tests must cover tenant isolation, key revocation, auth enumeration resistance, soft deletion, SSRF/DNS resolution, and send-time revalidation; structured logs must not contain secrets.

No constitution violations require complexity tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-accounts-api-keys-endpoints/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── rest-api.md
```

### Source Code (repository root)

```text
prisma/
├── schema.prisma
└── migrations/<timestamp>_accounts_api_keys_endpoints/migration.sql

src/
├── main.ts
├── worker.ts
├── app.module.ts
├── common/
│   ├── auth/
│   ├── decorators/
│   ├── filters/
│   └── throttling/
├── config/
├── prisma/
└── modules/
    ├── auth/
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── dto/
    │   ├── guards/
    │   └── strategies/
    ├── api-keys/
    │   ├── api-keys.controller.ts
    │   ├── api-keys.service.ts
    │   └── dto/
    └── endpoints/
        ├── endpoints.controller.ts
        ├── endpoints.service.ts
        ├── dto/
        └── security/
            └── endpoint-url-validation.service.ts

test/
├── integration/
├── security/
└── contract/
```

The SSRF validator belongs to the endpoints security boundary but is exported through a small reusable module/provider so the delivery engine can inject and call the same service at send time.

## Phase 0: Research Decisions

Research findings are recorded in [research.md](./research.md). The decisions resolve all implementation choices needed by this plan: Prisma/PostgreSQL constraints, JWT-only dashboard auth, Argon2, SHA-256 key lookup, class-validator/Swagger DTOs, DNS/IP SSRF checks, and the reusable send-time validation seam.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) defines the Prisma entities, relationships, indexes, constraints, and soft-delete behavior.
- [contracts/rest-api.md](./contracts/rest-api.md) defines the REST request/response and authentication contract for `/api/v1`.
- [quickstart.md](./quickstart.md) defines migration, local infrastructure, API, and security validation scenarios.

## Complexity Tracking

No violations or additional architectural projects are introduced.
