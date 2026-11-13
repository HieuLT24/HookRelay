# Quickstart Validation Guide

## Prerequisites

1. Copy the environment example, set a PostgreSQL `DATABASE_URL`, Redis connection settings, JWT signing configuration, and the explicit local-development HTTP flag (off by default).
2. Start PostgreSQL and Redis with Docker Compose.
3. Install dependencies and generate Prisma Client.

```powershell
npm install
npm run prisma:generate
npm run prisma:migrate -- --name accounts_api_keys_endpoints
```

## API validation

Run the API, open the Swagger document, and execute the flows in [contracts/rest-api.md](./contracts/rest-api.md): register, login, inspect `/auth/me`, create/list/revoke an API key, and create/list/detail/update/delete an endpoint.

Expected outcomes:

- Login returns only a one-hour JWT access token; no refresh-token table or response field exists.
- API-key creation returns the full key once; subsequent list and logs contain only the prefix.
- Revoked keys fail immediately; the eleventh active key is rejected.
- Endpoint list/detail/update/delete are tenant-isolated; deletion sets `deleted_at` and preserves delivery rows.
- Endpoint detail returns the full signing secret, while list masks it.

## SSRF validation

Test HTTPS public destinations, HTTP with the local flag off/on, localhost, loopback, RFC1918 private ranges, `169.254.169.254`, blocked IPv6 ranges, malformed hosts, and a hostname resolving to both public and blocked addresses. Registration must reject every blocked case. A delivery-engine test must use the same validator after DNS changes and prove no outbound request is made when send-time validation fails.

## Automated checks

```powershell
npm run build
npm run lint
npm test
npm run test:e2e
```

The reliability/security suite must run against real PostgreSQL and Redis and cover concurrent active-key creation, tenant isolation, generic login failures/throttling, soft-delete selection, and SSRF/DNS revalidation. Do not treat mock-only tests as evidence for those guarantees.
