# ApexBooks Phase 2 Contract Compliance Report

Date: 2026-07-18

Scope: `backend/cartunez-medusa`

## Frozen Contract Artifacts

Checked artifacts:

- `docs/apexbooks/v1/openapi.yaml`
- `docs/apexbooks/v1/schemas/apexbooks-events.schema.json`
- `docs/apexbooks/v1/examples/*.json`

No files under `docs/apexbooks/v1/` were modified.

## Contract-Defined Phase 2 Master Data Events

Inbound ApexBooks -> Medusa:

- `product.created`
- `product.updated`
- `price.updated`
- `inventory.updated`
- `customer.updated`

The runtime supports these event types through generic and endpoint-specific webhook handlers.

## Contract Compliance Matrix

| Area | Contract requirement | Runtime result |
|---|---|---|
| Endpoint URLs | Versioned `/apexbooks/v1/webhooks*` | Pass |
| HTTP methods | `POST` | Pass |
| Contract version header | Required `X-ApexBooks-Contract-Version: v1` | Pass |
| Event ID header | Required | Partial; generic reads it, specific handlers can fall back |
| Event type header | Required | Partial; generic reads it, specific handlers do not enforce event type |
| Timestamp header | Required | Partial; required but not validated |
| Signature header | Required `sha256=<hmac>` | Pass |
| HMAC input | `{timestamp}.{raw_body}` | Partial; uses parsed body reserialized with `JSON.stringify` |
| Idempotency key | Required in payload | Partial; not enforced by runtime |
| JSON Schema | Published schema bundle | Fail; runtime does not validate schema |
| Success envelope | JSON `status` envelope | Pass |
| Error envelope | JSON failure envelope | Pass |
| Duplicate event | Skip already processed event IDs | Pass for metadata-backed entities |
| Replay attack | Should reject replay | Fail |
| Tenant resolution | Requested by task | Fail; absent from frozen contract/runtime |

## Requested Fields vs Frozen Contract

Some requested verification fields are not present in the frozen v1 contract:

- `amount_minor`: schema uses `unit_price.amount` with Money objects.
- Price validity dates: not present.
- Price list: not present.
- `warehouse_id`: schema uses `location_id`.
- Inventory object `updated_at`: not present; top-level `occurred_at` exists.
- Tenant fields/header: not present.
- Product categories: not present in `ProductInboundPayload`.

These cannot be enforced without a contract change.

## Compliance Declaration

Phase 2 Contract Compliance: FAIL

Reason: runtime accepts valid examples but does not exactly enforce runtime JSON Schema, timestamp validity, replay protection, idempotency-key de-duplication, or tenant resolution. Several requested Phase 2 fields are outside the frozen v1 contract.
