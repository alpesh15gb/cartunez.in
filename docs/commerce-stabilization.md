# Commerce stabilization notes

## Supported baseline

- Medusa backend: **1.20.4** (ADR 002)
- Node: **20.x**
- Package manager: **npm 10**
- Database operations in this slice: **none**
- TypeORM synchronization: disabled in `src/utils/datasource.ts`

Use Node 20 (`nvm use` reads the root `.nvmrc`). The active storefront has an npm lockfile:

```bash
cd frontend
npm ci
```

The Medusa backend previously had no lockfile. After removing `medusa-extender`, generate and
review its lockfile on a network that can access the npm registry, then use `npm ci`. Do not use
`--legacy-peer-deps` or `--force`. This environment's registry policy returned HTTP 403 for
Medusa packages, so a lockfile could not be honestly generated here.

## Compatibility shim inventory (resolved)

The former shim in `frontend/src/lib/config.ts` was removed. The active storefront now uses
the native boundary documented in `docs/medusa-v1-storefront-migration.md`.

| Original v2 operation | Current rewrite / synthesized result | Native v1 contract | Loss or risk |
| --- | --- | --- | --- |
| `POST /store/carts/:id/items` | `/line-items` | `POST /store/carts/:id/line-items` | Path-only rewrite; v2 SDK error/return assumptions remain |
| `PATCH/DELETE /store/carts/:id/items/:lineId` | `/line-items/:lineId` | Same rewritten path | Same risk |
| `GET /store/shipping-options?cart_id=…` | `/store/shipping-options/:cartId` | `GET /store/shipping-options/:cartId` | Query encoding and error semantics are lost |
| `promo_codes: string[]` | `discounts: {code}[]` | v1 cart update discount body | Invalid JSON is silently retained; promotion semantics differ |
| v1 variant `prices[0]` | Synthetic v2 `calculated_price` | v1 prices must be selected for region/currency | First price can be wrong; missing price becomes zero; currency defaults to INR |
| v1 `payment_sessions/payment_session` | Synthetic v2 `payment_collection` | v1 cart payment sessions | Status is invented and may not represent provider state |
| v1 order `payments` | Synthetic v2 `payment_collections` | v1 order payments | Invented collection hierarchy |
| Any query | Deletes `fields` and `expand` | v1 supports `expand` on relevant endpoints | Requested relations may be missing; response type lies |
| Any response | Mutates products/carts/orders in place | Native v1 envelope | Unexpected shapes and unsafe shared-cache mutation |

These rows are retained as historical migration evidence; none of these broad transformations
remain in active code.

## Replacement boundary

`frontend/src/lib/commerce/medusa-v1/` is split into
transport, contracts, regions, products, taxonomy, customers/auth, carts, shipping, payments,
and orders. It must parse native v1 envelopes and preserve monetary values as integer minor
units. A locale is chosen by the selected region; `en-US` is the fallback and currency symbols
come from `Intl.NumberFormat`.

## Environment separation

| Variable | Exposure | Purpose |
| --- | --- | --- |
| `MEDUSA_BACKEND_URL` | Server-only | Internal SSR/server-action Medusa origin |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Browser-safe | Public Medusa origin for required browser calls |
| `MEDUSA_PUBLIC_URL` | Medusa server | Public base URL used for local file URLs |
| `DATABASE_URL`, `REDIS_URL` | Server-only | Medusa persistence/cache/event services |
| `JWT_SECRET`, `COOKIE_SECRET` | Server-only | At least 32 random characters in production |
| `STORE_CORS`, `ADMIN_CORS` | Medusa server | Explicit comma-separated trusted origins |
| `APEXBOOKS_*`, `INTEGRATIONS_ENCRYPTION_KEY` | Server-only | Optional ERP integration credentials |

Production secrets must be injected by deployment tooling. The tracked storefront production
environment file was removed; `.env.template` contains placeholders only.

## Data safety and rollback

No migration, synchronization, reset, seed, or destructive script was run. The backend data
source explicitly uses `synchronize: false`. Migration status inspection is read-only, but it
still requires a database connection and must target a replica or an approved production
connection. Before any future additive migration, take and verify a PostgreSQL backup.

Application rollback is paired: deploy the previous storefront and Medusa images together.
This slice changes no database shape, so there is no database downgrade. Do not deploy a
partially migrated native-v1 storefront with the old compatibility assumptions.

## Legacy Vite application disposition

`frontend-old/` is not referenced by Compose, nginx, or active deployment scripts. Repository
history indicates it was renamed when the Next.js storefront became active. It has no verified
admin or automotive responsibility. **Retain temporarily but exclude from the production
path**; archive or deletion requires a later approved cleanup after deployment owners confirm
there is no out-of-repository job serving it.
