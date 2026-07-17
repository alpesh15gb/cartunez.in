# ApexBooks Phase 2 Coverage Report

Date: 2026-07-18

Scope: `backend/cartunez-medusa`

## Covered

Contract artifacts:

- OpenAPI route/header inspection.
- JSON Schema validation for all frozen example payloads.

Runtime paths:

- Generic ApexBooks webhook handler.
- Product webhook handler.
- Price webhook handler.
- Inventory webhook handler.
- Customer webhook handler.
- HMAC verification.
- Contract version enforcement.
- Duplicate event handling by `processed_event_ids`.
- Success and error JSON envelopes.
- Outbound retry source behavior.

Phase 2 master data:

- Product update/create service path.
- Price update service path.
- Inventory update service path.
- Customer update/create service path.

## Not Covered / Blocked

- Real database-backed Medusa runtime lifecycle.
- Real HTTP webhook execution through a running server.
- Tenant resolution, because no tenant contract/runtime exists.
- Timestamp freshness/replay-window enforcement, because runtime does not implement it.
- Duplicate idempotency enforcement, because runtime does not implement it.
- Product categories, because not present in frozen schema/runtime.
- Price validity dates and price list, because not present in frozen schema/runtime.
- Warehouse ID, because frozen schema uses `location_id`.

## Coverage Assessment

Verification coverage is sufficient to identify contract deviations in the Phase 2 runtime paths, but not sufficient to certify production readiness.
