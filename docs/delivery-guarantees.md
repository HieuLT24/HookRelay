# Delivery guarantees

HookRelay targets at-least-once delivery. It does not guarantee exactly-once delivery or event ordering. Receivers must deduplicate using the stable webhook ID and process events idempotently.
