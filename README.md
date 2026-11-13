# HookRelay

Reliable webhook delivery platform built as a NestJS modular monolith.

## Local setup

1. Copy `.env.example` to `.env` and adjust secrets.
2. Start local infrastructure: `docker compose up -d postgres redis`.
3. Generate Prisma Client: `npm run prisma:generate`.
4. Apply the first development migration: `npm run prisma:migrate -- --name init`.
5. Build the API and worker: `npm run build`.
6. Run the API with `npm run start:dev`; run the worker with `npm run start:worker:dev`.

The API is served under `/api/v1`, with Swagger available at `/docs`.

PostgreSQL is the durable source of truth. Redis/BullMQ is used for scheduling and dispatch only. Delivery semantics are at-least-once; receivers must deduplicate by webhook ID.
