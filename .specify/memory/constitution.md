<!--
Sync Impact Report
- Version change: unversioned scaffold -> 1.0.0
- Modified principles: scaffold placeholders replaced with five HookRelay principles
- Added sections: Technology and Architecture Constraints; Engineering Quality Gates
- Removed sections: none
- Follow-up TODOs: none
-->

# HookRelay Constitution

## Core Principles

### I. Fixed Stack and Modular Monolith

HookRelay MUST use Node.js LTS, TypeScript, NestJS, PostgreSQL, Prisma, BullMQ,
Redis, and Docker Compose. Raw SQL is permitted where PostgreSQL behavior is
required, including `FOR UPDATE SKIP LOCKED`. The system MUST remain a modular
monolith with two entry points: an API process and a worker process. Microservices,
Kafka, and Kubernetes are out of scope. This constraint keeps deployment and
operational complexity proportional to the product scope.

### II. PostgreSQL Source of Truth

PostgreSQL MUST be the single source of truth for tenants, events, deliveries,
attempts, endpoints, and their durable state. Event and delivery records MUST be
committed in one database transaction before ingestion returns success. Redis and
BullMQ MAY schedule and dispatch work, but MUST NOT be the only store for data that
cannot be rebuilt from PostgreSQL. A missing or failed queue job MUST be recoverable
by database-driven scheduling or sweeping.

### III. Explicit At-Least-Once Delivery

Delivery MUST be at-least-once and MUST never be described or implemented as
exactly-once. A webhook ID MUST remain stable across every retry so receivers can
deduplicate idempotently. Event ordering is explicitly not guaranteed; API and
receiver documentation MUST state this and expose timestamps and identifiers for
receivers that need their own ordering policy. Claims about retries, crash recovery,
idempotency, or concurrent claiming MUST be backed by observable state transitions.

### IV. Tenant Isolation and Security by Default

Every database query and mutation MUST be scoped by the tenant ID from the
authenticated context; tenant identifiers supplied by clients MUST never determine
authorization scope. Passwords MUST use Argon2. API keys MUST be stored only as
hashes and shown in full only once. Outbound requests MUST be HMAC-signed and
SSRF-protected, including destination checks at send time. Secrets, API keys, and
payloads MUST never be logged. Environment variables MUST be validated at startup,
and `.env` MUST never be committed. Security controls are mandatory even when a
feature is otherwise marked optional.

### V. Evidence, Scope, and Operability

Every reliability guarantee—including no lost events, no concurrent double delivery,
idempotency, retry scheduling, and crash recovery—MUST have an automated
failure-injection or concurrency test against real PostgreSQL and Redis; mocks alone
are insufficient. MUST items in the brief take precedence over SHOULD and NICE TO
HAVE items, and items listed under “Không làm” MUST NOT be built. Changes MUST be
the smallest change that satisfies the requirement. Structured logs MUST carry
`deliveryId`, `eventId`, `endpointId`, and `attemptNumber` where applicable, without
including sensitive values.

## Technology and Architecture Constraints

The API and worker processes share the modular-monolith codebase and durable domain
model. Prisma owns schema and migrations; raw SQL is allowed for transaction,
locking, and query-plan-sensitive operations. BullMQ and Redis are acceleration and
dispatch infrastructure only. Docker Compose MUST provide the local integration
environment, including PostgreSQL and Redis. Implementations MUST preserve graceful
worker shutdown, retryable in-flight work, bounded outbound requests, and the
database-backed delivery outbox model.

## Engineering Quality Gates

Before a feature is considered complete, its implementation MUST include the tests
needed to prove its applicable reliability, tenant-isolation, and security claims.
Integration and failure-injection tests MUST run against real PostgreSQL and Redis.
Documentation changes MUST accompany behavior changes that affect operators or
receivers. The project MUST record key trade-offs in `docs/`, including architecture,
delivery guarantees, security, and the receiver guide. API and receiver
documentation MUST explicitly explain at-least-once semantics, stable webhook IDs,
and the absence of event-ordering guarantees.

## Governance

This constitution supersedes conflicting project practices and feature plans.
Amendments MUST identify the affected principles, rationale, compatibility impact,
and required documentation or test updates. Any amendment MUST update the version
and last-amended date, and MUST pass the same placeholder, date, and consistency
validation used when this document is generated.

Versioning follows semantic versioning: MAJOR for backward-incompatible governance
changes or removals, MINOR for new or materially expanded principles or sections,
and PATCH for clarifications and non-semantic wording changes. Every implementation
review MUST check stack compliance, PostgreSQL authority, tenant scoping, security
defaults, evidence-based reliability claims, scope priority, observability, and
documentation. Exceptions require an explicit amendment; they MUST NOT be hidden
in implementation details.

**Version**: 1.0.0 | **Ratified**: 2026-11-12 | **Last Amended**: 2026-11-12
