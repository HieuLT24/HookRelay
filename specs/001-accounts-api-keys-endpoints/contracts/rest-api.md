# REST API Contract

Base path: `/api/v1`. Dashboard routes use `Authorization: Bearer <JWT>`; producer ingestion remains API-key authenticated by the existing ingestion boundary.

## Auth

### `POST /auth/register`

Request: `{ "email": string, "password": string }`.

Rules: email is normalized and validated; password length is 8–128 characters. Response returns the created account’s non-sensitive identity fields, never `password_hash`.

### `POST /auth/login`

Request: `{ "email": string, "password": string }`.

Success response: `{ "accessToken": string, "tokenType": "Bearer", "expiresIn": 3600 }`. No refresh token is returned or persisted. Unknown email and wrong password have the same failure shape.

### `GET /auth/me`

Returns only the authenticated user’s id, normalized email, and timestamps.

## API keys

### `POST /api-keys`

Creates an active, non-expiring key. Success returns the complete `hr_live_<random>` value exactly once plus metadata. A tenant with 10 active keys receives a conflict/limit error.

### `GET /api-keys`

Returns tenant-scoped metadata, including id, name, short prefix, created timestamp, and revoked timestamp. The complete key is never returned.

### `DELETE /api-keys/:id`

Tenant-scoped revoke operation. Repeated or cross-tenant access must not restore/disclose another tenant’s key; implementation may use not-found semantics for inaccessible identifiers.

## Endpoints

### `POST /endpoints`

Request: `{ "url": string, "description"?: string, "eventTypes": string[], "status"?: "ACTIVE"|"PAUSED"|"DISABLED" }`. Signing secret is not client-supplied. URL validation runs before persistence and rejects malformed, unsupported, insecure, or blocked destinations. Empty `eventTypes` is invalid; `*` is valid.

Response returns endpoint configuration and the full generated signing secret.

### `GET /endpoints`

Returns only the authenticated tenant’s non-deleted endpoints. Signing secret is masked.

### `GET /endpoints/:id`

Returns the tenant-scoped non-deleted endpoint and full signing secret. Inaccessible identifiers behave as not found.

### `PATCH /endpoints/:id`

Accepts any subset of URL, description, eventTypes, and status. Omitted fields remain unchanged. Validation and persistence are atomic; URL changes invoke the SSRF validator before commit.

### `DELETE /endpoints/:id`

Sets `deleted_at` and excludes the endpoint from management and future delivery selection. It does not delete the endpoint row or delivery history.

## Cross-cutting contract

- DTOs use class-validator and reject unknown fields.
- All endpoint/key queries derive tenant scope from the authenticated principal, never a client tenant id.
- Secrets, API keys, passwords, payloads, and destination URLs are not written to logs.
- Swagger documents 400 validation, 401 authentication, 404 tenant-scoped not-found, and conflict/limit responses.
