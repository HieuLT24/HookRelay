# Feature Specification: Accounts, API Keys, and Webhook Endpoints

**Feature Branch**: `001-accounts-api-keys-endpoints`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "Feature 1: Accounts, API keys, and webhook endpoint management for HookRelay."

## Clarifications

### Session 2026-11-13

- Q: What endpoint secret and URL uniqueness rules apply? → A: Return the full signing secret on creation and in JWT-authenticated endpoint detail, mask it in lists, and allow duplicate URLs within the same tenant.
- Q: What credential, email, and login policies apply to accounts? → A: Passwords are 8-128 characters; access tokens are JWTs valid for 1 hour with no refresh tokens; email uniqueness is case-insensitive; failed logins are throttled per IP and email.
- Q: What does endpoint deletion do, and how does it differ from `DISABLED`? → A: Deletion is a soft delete that hides the endpoint and prevents new events while retaining its record and delivery history; `DISABLED` remains a separate status.
- Q: How are event subscriptions represented? → A: Event types are free-form strings, including `*` for all events, with no registry.
- Q: What API key format, expiry, and tenant limit apply? → A: Keys use `hr_live_<random>`, never expire, and each tenant may have at most 10 active keys.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and access an account (Priority: P1)

A developer creates an account with an email address and password, signs in later,
and views the account belonging to them.

**Why this priority**: An account is the boundary for all developer-owned data and
is required before keys or endpoints can be managed.

**Independent Test**: Register a new developer, sign in with valid credentials,
view the account, and verify that invalid registration and login attempts are
rejected without exposing account data.

**Acceptance Scenarios**:

1. **Given** an unused, valid email address and an acceptable password, **When** the
   developer registers, **Then** an account is created and the developer can sign in.
2. **Given** an email address already associated with an account, **When** the
   developer registers again, **Then** registration fails and no second account is
   created.
3. **Given** a registered account, **When** the developer signs in with the correct
   credentials, **Then** a JWT access token valid for 1 hour is issued and no refresh
   token is issued.
4. **Given** a registered account, **When** the developer signs in with an unknown
   email or incorrect password, **Then** sign-in fails without revealing which
   credential was incorrect.
5. **Given** an authenticated developer, **When** they view their account, **Then**
   only their own account details are returned.

---

### User Story 2 - Manage producer API keys (Priority: P1)

A developer creates credentials for producer applications, records the full value
when it is first shown, later reviews only recognizable prefixes, and revokes keys
that should no longer work.

**Why this priority**: Producer credentials are necessary for trusted applications
to submit work on behalf of the developer.

**Independent Test**: Create a key, verify its one-time display and masked listing,
use it while active, revoke it, and verify that it is rejected immediately.

**Acceptance Scenarios**:

1. **Given** an authenticated developer, **When** they create an API key, **Then**
   the full `hr_live_<random>` key is displayed exactly once, the key is active, and
   it has no expiration.
2. **Given** a created API key after its creation response has ended, **When** the
   developer lists keys, **Then** only a short identifying prefix and non-sensitive
   metadata are shown; the full key is never returned.
3. **Given** an active API key, **When** a producer presents it, **Then** the
   producer is authenticated as the owning developer.
4. **Given** an active API key, **When** the owning developer revokes it, **Then**
   subsequent uses of that key are rejected immediately.
5. **Given** a revoked API key, **When** the developer lists keys, **Then** it is
   visibly marked revoked and cannot be restored or used.
6. **Given** a tenant already has 10 active API keys, **When** the developer creates
   another key, **Then** creation fails until an active key is revoked.
7. **Given** a developer attempts to access a key belonging to another developer,
   **When** they list, inspect, or revoke keys, **Then** the other developer's key is
   not disclosed or changed.

---

### User Story 3 - Manage webhook endpoints (Priority: P1)

A developer registers destinations for webhook events, controls which event types
they receive, pauses or disables destinations, and removes destinations they no
longer need.

**Why this priority**: Endpoint configuration defines where a developer's future
webhook events may be delivered.

**Independent Test**: Create an endpoint with valid details, list and view it,
update its details and status, then delete it; repeat with invalid and
cross-tenant requests.

**Acceptance Scenarios**:

1. **Given** an authenticated developer and a valid secure URL, **When** they create
   an endpoint with a description and subscribed event types, **Then** the endpoint
   is created with status `ACTIVE` and an automatically generated signing secret.
2. **Given** an authenticated developer, **When** they create an endpoint subscribed
   to all event types, **Then** the endpoint records the all-events subscription.
3. **Given** an authenticated developer, **When** they list endpoints, **Then** all
   and only their endpoints are returned with their URL, description, subscriptions,
   status, and a masked signing secret.
4. **Given** an endpoint owned by the developer, **When** they view it, **Then** its
   current configuration, status, and full signing secret are returned without
   exposing another tenant's endpoint.
5. **Given** an endpoint owned by the developer, **When** they update its URL,
   description, subscriptions, or status, **Then** the requested valid changes are
   saved and invalid changes are rejected without partial updates.
6. **Given** an endpoint owned by the developer, **When** they delete it, **Then** it
   is no longer available for endpoint management or future delivery selection.
7. **Given** an endpoint belonging to another developer, **When** a developer tries
   to view, update, or delete it, **Then** the request returns not found and does not
   reveal whether the endpoint exists.

---

### User Story 4 - Reject unsafe endpoint destinations (Priority: P1)

A developer can register only destinations that meet the platform's URL safety
rules, while local development can explicitly opt into plain HTTP.

**Why this priority**: Unsafe destinations could expose internal systems or cloud
metadata through server-side requests.

**Independent Test**: Attempt endpoint registration with secure public destinations,
plain HTTP with and without the local-development setting, private-address targets,
loopback targets, link-local targets, and hostnames resolving to private addresses.

**Acceptance Scenarios**:

1. **Given** the default environment, **When** the developer registers a valid HTTPS
   URL to a public destination, **Then** registration succeeds.
2. **Given** the default environment, **When** the developer registers an HTTP URL,
   **Then** registration is rejected.
3. **Given** an explicitly enabled local-development setting, **When** the developer
   registers an otherwise valid HTTP URL, **Then** registration succeeds.
4. **Given** any environment, **When** the developer registers
   `http://169.254.169.254/` or `https://localhost/`, **Then** registration is
   rejected.
5. **Given** a hostname that resolves at registration time to a private, loopback,
   link-local, cloud-metadata, or equivalent IPv6 address, **When** the developer
   registers it, **Then** registration is rejected.
6. **Given** a URL with an unsupported scheme, malformed host, or invalid structure,
   **When** the developer registers it, **Then** registration is rejected with a
   clear validation error.

### Edge Cases

- A registration with missing, blank, malformed, or duplicate account details is
  rejected without creating an account.
- Email uniqueness is case-insensitive, and passwords must contain 8 to 128
  characters inclusive.
- A password failure does not disclose whether the email address exists.
- Failed login attempts are throttled independently per IP address and email
  address.
- A key creation response is interrupted after creation; the developer cannot
  retrieve the full key later and must create a replacement.
- A revoked key is rejected even if it was previously accepted.
- API keys never expire, use the `hr_live_<random>` format, and a tenant cannot have
  more than 10 active keys.
- An endpoint with an empty event-type set is rejected; the explicit all-events value
  is the supported alternative.
- Event types are free-form strings; `*` represents all events and no event registry
  is maintained.
- An endpoint status must be one of `ACTIVE`, `PAUSED`, or `DISABLED`.
- Duplicate endpoint URLs are allowed within the same tenant.
- A deleted endpoint is soft-deleted, hidden from endpoint lists and detail access,
  and excluded from new event selection while its record and delivery history remain
  queryable.
- A URL that resolves to both public and blocked addresses is rejected.
- Changes to an endpoint must not overwrite fields omitted from an update request.
- Requests using an identifier from another tenant behave as not found for read,
  update, and delete operations.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a developer to register with an email address
  and a password of 8 to 128 characters inclusive, and MUST reject invalid or
  already-used registration details. Email uniqueness MUST be case-insensitive.
- **FR-002**: The system MUST allow a registered developer to sign in and MUST
  reject unknown accounts and incorrect passwords without credential enumeration.
  Failed login attempts MUST be throttled independently per IP address and email
  address. Successful sign-in MUST issue only a JWT access token with a 1-hour
  lifetime; refresh tokens are out of scope.
- **FR-003**: The system MUST allow an authenticated developer to view only their own
  account information.
- **FR-004**: The system MUST allow an authenticated developer to create API keys
  for producer applications, using the `hr_live_<random>` format, with no expiration
  and a maximum of 10 active keys per tenant.
- **FR-005**: The system MUST display the full value of a newly created API key
  exactly once and MUST never display the full value after that creation response.
- **FR-006**: The system MUST list a developer's keys using only a short prefix and
  non-sensitive metadata, and MUST allow the developer to revoke a key.
- **FR-007**: The system MUST reject a revoked API key immediately for subsequent
  authentication attempts.
- **FR-008**: The system MUST ensure that account, key, and endpoint operations are
  scoped to the authenticated developer's tenant and MUST return not found for
  cross-tenant endpoint access.
- **FR-009**: The system MUST allow a developer to create, list, view, update, and
  soft-delete webhook endpoints. Deleted endpoint records and delivery history MUST
  remain queryable while deleted endpoints are omitted from management lists and
  future event selection.
- **FR-010**: Each endpoint MUST contain a URL, description, subscribed event types
  or an explicit all-events subscription, and a status of `ACTIVE`, `PAUSED`, or
  `DISABLED`.
- **FR-011**: The system MUST generate a unique signing secret for each endpoint
  at creation time and MUST not accept a client-supplied signing secret. The full
  secret MUST be returned on creation and JWT-authenticated endpoint detail; list
  responses MUST mask it.
- **FR-016**: The system MUST accept free-form event type strings, including `*` as
  the all-events subscription, without requiring an event-type registry.
- **FR-012**: The system MUST require HTTPS for endpoint URLs unless the explicit
  local-development setting is enabled.
- **FR-013**: The system MUST reject endpoint URLs targeting loopback, private,
  link-local, cloud-metadata, or equivalent IPv6 addresses, including hostnames that
  resolve to those addresses at registration time.
- **FR-014**: The system MUST reject malformed URLs, unsupported schemes, invalid
  hosts, and URLs that resolve to any blocked destination.
- **FR-015**: The system MUST apply endpoint updates atomically so rejected changes
  do not partially alter an existing endpoint.

### Key Entities

- **Developer account**: The tenant identity represented by an email address and
  password, and the owner of keys and endpoints.
- **API key**: A credential for a producer application, with a one-time full value,
  a visible prefix, lifecycle status, and owning tenant.
- **Webhook endpoint**: A tenant-owned destination with a URL, description,
  subscriptions, status, an automatically generated signing secret, and a soft-delete
  state that preserves the record and delivery history.
- **Event subscription**: A set of event types associated with an endpoint, or the
  explicit all-events selection.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance testing, 100% of valid account registrations and logins
  succeed, and 100% of invalid credential attempts are rejected without account
  enumeration.
- **SC-002**: In acceptance testing, 100% of created API keys show their full value
  only in the creation result, show only a prefix afterward, and stop authenticating
  immediately after revocation.
- **SC-003**: In acceptance testing, 100% of endpoint CRUD operations preserve the
  owning tenant boundary and return not found for cross-tenant access.
- **SC-004**: In acceptance testing, 100% of blocked URL categories are rejected,
  including the specified metadata and localhost examples and hostnames resolving
  to private addresses.
- **SC-005**: In acceptance testing, 100% of valid HTTPS endpoint registrations are
  accepted, while HTTP registration is accepted only when the explicit
  local-development setting is enabled.

## Assumptions

- One account type is sufficient; role-based access control is out of scope.
- A developer is the sole owner and administrator of one tenant's data.
- Endpoint signing secrets are generated by the service and are not rotated in this
  feature.
- A deleted endpoint is soft-deleted, unavailable in endpoint management and future
  delivery selection, but its record and delivery history remain queryable.
- The local-development setting is an explicit operator-controlled setting and is
  disabled by default.
- Outbound request signing, event ingestion, delivery, retries, secret rotation,
  ping/test operations, dashboard UI, and send-time destination rechecks are outside
  this feature.
