# ADR 002: Stabilize on Medusa v1 before any major-version migration

- **Status:** Accepted
- **Date:** 2026-07-27
- **Decision owners:** Cartunez engineering
- **Related:** `docs/REPOSITORY_AUDIT.md`

## Context

Cartunez has an existing Medusa 1.20.4 commerce database and backend with custom TypeORM
entities and migrations, API routes, event subscribers, local file storage, Redis event/cache
services, Meilisearch, manual payment and fulfillment, and a substantial ApexBooks integration.
The active Next.js storefront was derived from the Medusa v2 starter and depends on the
Medusa 2.17 SDK and v2 types.

Production-data safety is the controlling constraint. Products, variants, customers, carts,
orders, regions, prices, inventory, and integration mappings must remain usable. This phase
does not authorize destructive database operations.

## Current incompatibility

`frontend/src/lib/config.ts` globally replaces the v2 SDK fetch implementation. It rewrites
v2 cart item and shipping paths to v1 paths, removes `fields` and `expand`, translates
promotion bodies, synthesizes v2 calculated-price/payment-collection shapes from v1 data,
and mutates product, cart, and order responses. The conversion is lossy and conflates
transport, business rules, and presentation. Authentication and errors still depend on v2
SDK assumptions while the server implements v1 sessions and response envelopes.

The backend is also not reproducibly installable. `medusa-extender` is used only for the
`@Service` decorator on one service, but it requires TypeORM 0.2 while this backend uses
TypeORM 0.3. The package is not required for any module bootstrap. The Docker build currently
works around dependency and runtime issues by using legacy peer resolution and patching
installed Medusa framework files.

## Options considered

### Option A — Keep Medusa v1 and adapt the storefront

Preserve Medusa 1.20.4 and its schema. Replace the v2 SDK boundary with a small typed native-v1
HTTP client, remove the fetch monkey patch, replace `medusa-extender` with Medusa's native
service discovery, pin dependencies, and validate the v1 region/product/customer/cart/order
contracts.

### Option B — Upgrade the backend to Medusa v2 now

Replace the v1 backend with v2 modules/workflows and migrate every commerce data domain,
custom entity, route, subscriber, provider, admin feature, seed/import script, and ApexBooks
event/mapping path. This also requires a rehearsed data migration and dual-environment
rollback strategy.

## Decision matrix

| Criterion | Option A: v1 stabilization | Option B: v2 migration |
| --- | --- | --- |
| Existing data safety | High; no commerce-schema conversion | Low until full migration rehearsal and reconciliation |
| Code scope | Storefront boundary and backend build registration | Whole backend, data model, providers, admin, integrations |
| Dependency health | Remove one abandoned/conflicting package and pin v1 graph | Modern graph, but all custom code must be ported |
| Customizations | Preserved with targeted native registration | Must be rewritten as v2 modules/workflows |
| Storefront work | Replace SDK use with typed v1 client | Less client translation, but backend migration dominates |
| Provider/admin compatibility | Existing v1 providers/admin remain usable | Provider and admin compatibility must be requalified |
| Deployment/rollback | Application rollback; schema unchanged | Coordinated data migration and reverse migration |
| Testability | Contract fixtures plus existing v1 instance | Requires parallel v1/v2 data and behavior harnesses |
| Time to stable cart | Shorter | Substantially longer |
| Long-term maintenance | v1 is legacy and requires a later migration | Better after a successful migration |

## Decision

**Select Option A: stabilize Cartunez on Medusa 1.20.4 and make the storefront use the native
Medusa v1 Store API.**

This is an interim production-safety decision, not a claim that Medusa v1 should remain
indefinitely. Repository evidence does not support a safe in-place v2 migration in this
slice: there is no migration rehearsal, complete commerce integration suite, production-data
inventory, or rollback proof. A v2 SDK import in the storefront is not sufficient evidence.

## Reasons

1. It preserves the existing commerce database without destructive or cross-major migration.
2. The custom backend and ApexBooks code are written for v1 services/events and can remain in
   place while the integration boundary is tested.
3. `medusa-extender` is incidental, not architectural, and can be removed without downgrading
   TypeORM.
4. A typed HTTP boundary makes the exact wire contract visible and testable instead of
   pretending v1 responses satisfy v2 SDK types.
5. It is the shortest path to verifiable product, regional pricing, authentication, cart, and
   order prerequisite behavior.

## Consequences

### Positive

- No commerce records or schema are converted in this phase.
- Install/build failures can be solved independently of business-data migration.
- The storefront gains explicit v1 types, normalized errors, and domain-specific client code.
- A future v2 migration can use these contract tests as behavior baselines.

### Negative

- Medusa v1 is a legacy major version and creates deferred maintenance/security work.
- The storefront must replace broad v2 SDK usage rather than reusing starter code unchanged.
- v1 and v2 terminology may coexist temporarily while components are migrated behind the
  commerce boundary.
- Payment remains manual in this phase; selecting a production provider is deferred.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| A component still relies on an unmapped v2 field | Type-check against local v1 contracts and add representative v1 response fixtures |
| Session behavior differs between server and browser requests | Use v1 cookie sessions, forward cookies only server-side, and test register/login/me/logout |
| Removing `medusa-extender` changes service registration | Use native `src/services/*.ts` discovery and add startup/service-resolution smoke checks |
| Dependency pins miss a security update | Run dependency audit and evaluate patches compatible with v1; do not silently major-upgrade |
| Rollout changes cart cookies/IDs | Preserve existing cart ID cookie names and tolerate missing/expired carts explicitly |

## Migration steps

1. Standardize Node 20 and npm lockfiles for the active Node applications.
2. Remove `medusa-extender`; export the vehicle compatibility service using native Medusa v1
   service discovery. Pin TypeORM and generate a reproducible lockfile.
3. Repair TypeScript output/module/decorator configuration and remove Docker framework patches.
4. Introduce `frontend/src/lib/medusa/` with v1 contracts, native transport, domain clients,
   error normalization, and response contract tests using captured/documented v1 shapes.
5. Migrate region, product, category, collection, customer/auth, cart, fulfillment/payment, and
   order data functions to the boundary. Preserve server actions and cart cookies.
6. Remove the global v2 request/response monkey patch and the v2 SDK/types once no imports
   remain.
7. Build and smoke-test against an isolated Medusa v1 instance. Do not run destructive scripts
   or schema generation.

## Rollback strategy

This phase makes application-code and dependency changes only. Before deployment, retain the
previous application images and current lockfiles. Roll back by redeploying the prior Medusa
and storefront images together; do not mix the old shim storefront with a partially changed
backend image. Cart IDs and the Medusa v1 schema remain unchanged, so no data reverse migration
is required. If a later additive migration becomes unavoidable, take a verified PostgreSQL
backup first and document its independent downgrade; no such migration is approved here.

## Deferred work

- A separately planned Medusa v2 migration with production-data inventory, mapping rules,
  rehearsal, reconciliation, provider qualification, ApexBooks parity, and rollback proof.
- Production payment and fulfillment provider selection.
- Automotive schema consolidation and legacy-data deletion.
- Removal or archival of `frontend-old/`; repository references show it is not in the current
  Compose production path, but deletion requires separate approval.
- Broad storefront redesign and non-commerce page completion.
