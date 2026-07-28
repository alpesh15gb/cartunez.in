# Medusa v1 operations and deployment guide

## Supported environment

- Node.js 20.x and npm 10.8.2
- Public registry `https://registry.npmjs.org/`
- PostgreSQL 16, Redis 7, optional-but-configured Meilisearch 1.7
- Medusa 1.20.4, TypeORM 0.3.20

The storefront has a reviewed lockfile and uses `npm ci`. The Medusa backend lockfile is still a
release gate: generate it only after a complete Node 20/npm 10 install on the public registry,
review it, commit it, then replace all backend clean-install instructions with `npm ci`.

## Local disposable setup

Use a database named `cartunez_dev`, `cartunez_test`, or `cartunez_ci`. Never point development
seed or integration tests at a shared database.

```bash
export DATABASE_URL=postgresql://postgres:local-password@localhost:5432/cartunez_dev
export REDIS_URL=redis://localhost:6379
export JWT_SECRET='replace-with-at-least-32-random-characters'
export COOKIE_SECRET='replace-with-at-least-32-random-characters'
export STORE_CORS=http://localhost:8000
export ADMIN_CORS=http://localhost:9000
export MEDUSA_PUBLIC_URL=http://localhost:9000
export APEXBOOKS_ENABLED=false

cd backend/cartunez-medusa
npm install                 # temporary only until the reviewed lockfile is committed
npm run typecheck
npm run build
npm run migrations:show    # read-only first
npx medusa migrations run  # disposable local database only
npm run migrations:run     # repository custom migrations
CONFIRM_DISPOSABLE_DATABASE=yes npm run seed
npm run start:dev
```

These backend runtime commands are encoded in CI but remain locally unverified in the current
proxy-blocked environment. Do not treat this documentation as a runtime pass report.

### Latest verification attempt (2026-07-27)

The available runner was Ubuntu 24.04.4 with Node 20.20.2, but it did not provide the required npm
10.8.2, PostgreSQL, Redis, Meilisearch, Docker, or GitHub CLI. Its outbound Envoy proxy rejected a
direct HTTPS tunnel to `registry.npmjs.org` with HTTP 403. Consequently, installing npm 10.8.2 and
resolving `@medusajs/admin@7.1.18` both failed before a backend lockfile could be generated.

This is an external environment blocker, not a successful runtime verification. No dependency,
migration, seed, startup, Store API, fixture-capture, or database operation was performed. The CI
runtime gate remains incomplete and must be executed on a standard GitHub-hosted runner (or an
equivalent runner with direct public-registry access) before the Medusa phase can be declared green.

## Health, readiness, and smoke tests

- `GET /health` is process liveness and has no dependency details.
- `GET /ready` checks PostgreSQL and Redis and returns 503 when either required dependency fails.
- `npm run test:integration` performs disposable database-backed Store API/customer/cart/order
  checks and requires `CONFIRM_DISPOSABLE_DATABASE=yes`.
- `npm run smoke:store` runs the non-completing storefront harness.
- Order completion additionally requires `ALLOW_TEST_ORDER_COMPLETION=true` and must be confined
  to the disposable environment.

## Seed behavior

The deterministic development seed creates/reuses an INR India region, manual payment and
fulfillment providers, shipping options, a development collection, six categories, five products,
priced variants with inventory, and a locally served placeholder image. An optional fake customer
is created only when `SEED_TEST_CUSTOMER_EMAIL` and `SEED_TEST_CUSTOMER_PASSWORD` are supplied.
The guard rejects `NODE_ENV=production`, non-local/non-disposable database names, and missing
`CONFIRM_DISPOSABLE_DATABASE=yes`.

## Production checklist

1. Verify reviewed lockfiles with `npm ci`; run type-check, build, tests, and dependency audit.
2. Take and verify a PostgreSQL backup; inspect migration status before approval.
3. Supply strong JWT/cookie/integration/search secrets through the deployment platform.
4. Use HTTPS; configure exact Store/Admin CORS and secure cookies.
5. Confirm Redis persistence/availability and writable shared/object file storage. Local uploads
   are not suitable for multiple instances unless the volume is genuinely shared.
6. Validate Meilisearch host/key and reindex behavior. Never expose the master key to Next.js.
7. Leave ApexBooks disabled unless its credentials, tenant, webhook signing, replay authorization,
   and failure alerts are verified.
8. Remember that manual payment/fulfillment are development limitations, not captured payment or
   real fulfillment.
9. Verify `/health`, `/ready`, admin authentication, Store API, and non-destructive smoke checks.

## Rollback

Retain the previous Medusa and storefront images and deploy them as a pair. Forward custom
migrations are additive, but their `down` methods drop tables; do not invoke them automatically.
Prefer application rollback and restore from the verified backup only under the incident runbook.
Never use the repository reset scripts against production.
