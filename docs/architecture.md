# HookRelay architecture

HookRelay is a modular monolith with separate API and worker entry points. PostgreSQL is the source of truth; Redis/BullMQ only schedules work. Event and delivery records are committed atomically before ingestion returns success.

The domain modules live under `src/modules`, while queue, delivery, and recovery concerns live under `src/infrastructure`.
