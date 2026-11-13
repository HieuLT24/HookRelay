# Data Model

The feature uses the existing Prisma domain model and adds the account/key/endpoint constraints required by the spec. Database names remain snake_case through Prisma mappings.

## User (`users`)

- `id` UUID primary key.
- `email` normalized to a canonical lowercase representation before persistence; unique constraint enforces case-insensitive uniqueness.
- `password_hash` contains only the Argon2id hash.
- `created_at`, `updated_at` timestamps.
- Owns API keys, endpoints, and events; the user is the tenant boundary.

## API key (`api_keys`)

- `id` UUID primary key and `user_id` foreign key.
- Optional operator-facing `name`.
- `prefix` contains only a short recognizable non-secret prefix.
- `key_hash` contains SHA-256 of the complete presented key.
- `revoked_at` is null while active and set once on revocation; no restore transition.
- `created_at` timestamp; keys never expire.
- Index `(user_id, revoked_at)` supports active-key count and tenant-scoped listing.

The service must count active keys inside a transaction before creating a key, and the database/transaction strategy must prevent exceeding 10 active keys under concurrent creation.

## Endpoint (`endpoints`)

- `id` UUID primary key and `user_id` foreign key.
- `url`, optional `description`, and non-empty `event_types` string array. `*` is the explicit all-events value; arbitrary event strings are accepted.
- `signing_secret` is generated server-side and never accepted from DTO input. It is returned in full only on creation and JWT-authenticated detail; list output is masked.
- `status` enum: `ACTIVE`, `PAUSED`, `DISABLED`.
- Existing delivery fields: `consecutive_failures`, `paused_at`, timestamps.
- Add nullable `deleted_at`; index `(user_id, deleted_at)` and retain existing status lookup support.
- Existing delivery relation remains intact; endpoint deletion must not cascade-delete delivery history.

Management queries always include `user_id = authenticatedUserId` and `deleted_at IS NULL`. Internal delivery-history queries may include deleted rows for reporting. Future event fan-out must exclude deleted endpoints.

## Existing related entities

`events`, `deliveries`, and `delivery_attempts` remain PostgreSQL-backed and are not redesigned by this feature. Their endpoint relations must continue to work after endpoint soft deletion. No `refresh_tokens` model or migration is created.

## State transitions

```text
API key: active -> revoked
Endpoint status: ACTIVE <-> PAUSED/DISABLED (explicit update)
Endpoint record: deleted_at null -> timestamp (soft delete; terminal for management)
```

Endpoint updates must build one validated patch and commit it atomically. A failed URL or event subscription validation must leave every stored field unchanged.
