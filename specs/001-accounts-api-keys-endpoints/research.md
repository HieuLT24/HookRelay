# Research: Accounts, API Keys, and Webhook Endpoints

## Decision: Use the constitution’s fixed modular-monolith stack

**Rationale:** The repository already establishes NestJS modules, Prisma, PostgreSQL, BullMQ/Redis, separate API/worker entry points, and Docker Compose. The feature adds providers/controllers within that structure rather than introducing a new service boundary.

**Alternatives considered:** A separate auth service or a dashboard frontend were rejected as outside the fixed stack and feature scope.

## Decision: Prisma migrations and PostgreSQL constraints own the account/key/endpoint schema

**Rationale:** PostgreSQL is the durable source of truth. Prisma provides the schema/client/migration workflow, while database uniqueness and indexes enforce case-insensitive email uniqueness, tenant lookup, active-key counting support, and endpoint management queries. `deleted_at` is nullable and indexed for endpoint soft deletion.

**Alternatives considered:** A `refresh_tokens` table is explicitly excluded because the clarified requirement is JWT-only access tokens. Hard deletion is rejected because delivery history must remain queryable.

## Decision: Passport + JWT for dashboard auth; Argon2 for passwords

**Rationale:** Passport’s JWT strategy provides a NestJS guard boundary, and a one-hour signed access token matches the clarified contract. Registration/login use Argon2id through the Argon2 package. Login failures use the same generic response for unknown email and wrong password, with independent IP and normalized-email throttling.

**Alternatives considered:** Sessions and refresh tokens increase state and are not required. Plain password hashing or reversible encryption violates the constitution.

## Decision: API keys use `hr_live_<random>` and SHA-256 hashes with a stored prefix

**Rationale:** Keys are high-entropy random bearer credentials, so SHA-256 is appropriate for lookup verification when only the digest is persisted. The prefix supports recognizable listings without exposing the secret. The full value exists only in the creation response, and revocation is checked on every authentication attempt.

**Alternatives considered:** Argon2 for API keys would add unnecessary password-style cost to high-entropy credentials; storing plaintext would violate the constitution.

## Decision: class-validator DTOs and Swagger decorators define the REST boundary

**Rationale:** DTOs centralize input constraints, whitelist unknown fields, and ensure partial endpoint updates distinguish omitted fields from explicit values. Swagger documents the JWT and API-key schemes, masked/full secret response differences, and soft-delete semantics.

**Alternatives considered:** Ad hoc controller validation would duplicate rules and make the generated API contract incomplete.

## Decision: One reusable SSRF validator runs at registration and immediately before delivery

**Rationale:** The service parses URL structure, enforces allowed schemes, resolves DNS, rejects any loopback/private/link-local/metadata/reserved IPv4 or IPv6 result, and rejects mixed public/blocked resolution. Reusing it at send time addresses DNS rebinding and stale DNS changes. The delivery engine must treat validation failure as a non-sendable delivery outcome and record observable error state without logging the URL or secret.

**Alternatives considered:** Registration-only validation is insufficient against DNS rebinding. A second independent validator risks policy drift and is rejected.

## Decision: Endpoint lifecycle uses status plus soft deletion

**Rationale:** `ACTIVE`, `PAUSED`, and `DISABLED` remain operational statuses. `deleted_at` is a separate terminal management state: deleted endpoints are hidden from list/detail/update/delete operations and excluded from future selection, while records and delivery history remain queryable by internal delivery/reporting code.

**Alternatives considered:** Treating deletion as `DISABLED` loses the required semantic distinction and makes accidental future selection harder to prevent.
