# ApexBooks Phase 3 Order Compatibility Report

Date: 2026-07-18

Scope: `backend/cartunez-medusa`

Reference requested:

- Tag: `integration-contract-v1`
- Commit: `e31e965`

Verification basis: checked-in frozen artifacts under `docs/apexbooks/v1/`. No contract, checkout, storefront, or Medusa business-logic files were modified.

## Result

Phase 3 Contract Compliance: FAIL

The implemented order outbound payload builder is compatible with the frozen `OrderPayload` JSON Schema for:

- `order.created`
- `order.updated`
- `order.cancelled`

However, full order lifecycle compliance cannot be declared because tenant resolution, replay controls, outbound HMAC, and accounting response schemas/policies are not defined or not implemented in the current v1 runtime.

## Implemented Order Events

| Medusa event | ApexBooks event | Runtime file | Result |
|---|---|---|---|
| `order.placed` | `order.created` | `src/subscribers/apexbooks-order-created.ts` | Present |
| `order.updated` | `order.updated` | `src/subscribers/apexbooks-order-updated.ts` | Present |
| `order.canceled` | `order.cancelled` | `src/subscribers/apexbooks-order-cancelled.ts` | Present |

## Payload Compatibility

Validated using compiled `ApexBooksEventBuilder` and the frozen JSON Schema:

- `order.created`: pass
- `order.updated`: pass
- `order.cancelled`: pass
- frozen `examples/order-created.json`: pass

Verified fields:

- `contract_version = v1`
- `event_id` exists and is unique per generated event
- `event_type` matches the frozen contract
- `idempotency_key = {eventType}:order:{orderId}`
- `order` event-specific object is present
- customer mapping includes Medusa and ApexBooks customer IDs
- product mapping includes product ID, variant ID, SKU, and ApexBooks item ID when present in metadata
- invoice metadata maps to `apexbooks_invoice_id`
- order metadata is preserved in the outbound payload

## Transport Compatibility

Outbound ApexBooks transport sends:

- `POST`
- `X-ApexBooks-Contract-Version: v1`
- `Authorization: Bearer <api key>`
- `Idempotency-Key`
- JSON request body

The runtime request path is `/webhooks/medusa/events`. The frozen contract artifacts do not publish an ApexBooks receiving OpenAPI path for Medusa -> ApexBooks order events, so URL compliance can only be verified against the implementation convention, not against a frozen outbound OpenAPI operation.

## Deviations and Gaps

- Outbound order requests use Bearer API authentication, not HMAC.
- No outbound timestamp header is sent; timestamp exists as payload `occurred_at`.
- No tenant field or tenant header exists in the frozen contract/runtime.
- No replay protection exists for outbound order events beyond stable idempotency keys.
- Duplicate order events produce unique `event_id` values but stable duplicate `idempotency_key`.
- Accounting response schema is not defined in the frozen contract; runtime records only `response.id` or `response.event_id` in order metadata.
- Immutable field protection is not enforced by a dedicated order policy layer; the builder preserves source metadata but does not classify immutable fields.

## Production Readiness

Order payload generation is schema-compatible for implemented order events.

Full Phase 3 order lifecycle is not production-certified because transport-level tenant/replay/accounting-response requirements are not fully contract-defined or runtime-enforced.
