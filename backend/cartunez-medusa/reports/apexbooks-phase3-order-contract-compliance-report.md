# ApexBooks Phase 3 Order Contract Compliance Report

Date: 2026-07-18

Scope: `backend/cartunez-medusa`

## Frozen Order Contract

Order events in the frozen schema:

- `order.created`
- `order.updated`
- `order.cancelled`

Required top-level fields:

- `contract_version`
- `event_id`
- `event_type`
- `occurred_at`
- `idempotency_key`
- `order`

Required `order` fields include customer, billing/shipping addresses, line items, totals, and GST summary.

## Contract Compliance Matrix

| Requirement | Result | Notes |
|---|---|---|
| `order.created` | Pass | Subscriber and schema-valid payload generation present. |
| `order.updated` | Pass | Subscriber and schema-valid payload generation present. |
| `order.cancelled` | Pass | Medusa `order.canceled` maps to British-spelled contract event. |
| URLs | Partial | Runtime URL exists; outbound receiving URL is not specified in frozen OpenAPI. |
| HTTP methods | Pass | Runtime uses `POST`. |
| Request schemas | Pass | Builder-generated order payloads validate. |
| Response schemas | Not verifiable | Accounting response schema absent from frozen contract. |
| Authentication | Pass | Bearer API key sent. |
| HMAC | Not applicable / gap | HMAC defined for inbound webhooks, not outbound orders. |
| Timestamp | Partial | Payload `occurred_at`; no outbound timestamp header. |
| Tenant | Fail | No tenant contract/runtime exists. |
| Replay | Partial | Depends on ApexBooks idempotency handling; no local replay cache. |
| Idempotency | Pass | Stable idempotency key generated and sent. |
| Customer mapping | Pass | Verified in builder probe. |
| Product mapping | Pass | Verified in builder probe. |
| Invoice policy | Partial | Invoice ID mapped if present; policy timing undefined. |
| Immutable field protection | Partial | Metadata preserved; no explicit immutable policy. |
| Cancellation behavior | Partial | Event mapping correct; reason/policy undefined. |

## Declaration

Phase 3 Contract Compliance: FAIL

The implemented order payloads conform to the frozen JSON Schema, but full lifecycle compliance cannot be declared because tenant, replay, accounting response, invoice policy, outbound HMAC/timestamp-header, and immutable-field rules are incomplete or not contract-defined.
