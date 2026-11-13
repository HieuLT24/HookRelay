# Receiver guide

Receivers should verify the HMAC signature with the raw request body, reject stale timestamps, and deduplicate by `X-Webhook-Id`. Delivery is at-least-once and event ordering is not guaranteed.
