# ApexBooks Event Matrix

Date: 2026-07-18

Scope: `backend/cartunez-medusa`

| Lifecycle area | Medusa/ApexBooks event | Direction | Runtime path | Validation result | Notes |
|---|---|---:|---|---|---|
| Customer | `customer.created` | Medusa -> ApexBooks | `src/subscribers/apexbooks-customer-created.ts` -> `sendOutboundEvent` | Pass, builder schema validation | Full DB-backed customer lifecycle blocked by runtime services. |
| Customer | `customer.updated` | ApexBooks -> Medusa | `src/api/routes/apexbooks/index.ts` -> `syncCustomer` | Header validation pass; full lifecycle blocked | No Medusa -> ApexBooks `customer.updated` subscriber exists. |
| Product/catalog | `product.created` | ApexBooks -> Medusa | generic/products inbound routes -> `syncProduct` | Header validation pass; full lifecycle blocked | Inbound event per v1 contract. |
| Product/catalog | `product.updated` | ApexBooks -> Medusa | generic/products inbound routes -> `syncProduct` | Header validation pass; full lifecycle blocked | Frozen example used for inbound signature validation. |
| Product/catalog | `inventory.updated` | ApexBooks -> Medusa | generic/inventory inbound routes -> `syncInventory` | Header validation pass; full lifecycle blocked | Inbound event per v1 contract. |
| Product/catalog | `price.updated` | ApexBooks -> Medusa | generic/prices inbound routes -> `syncPrice` | Header validation pass; full lifecycle blocked | Included because it is part of v1 catalog contract. |
| Order | `cart.created` | Internal Medusa | Not an ApexBooks v1 event | Not applicable | No ApexBooks contract event exists for cart creation. |
| Order | checkout completion | Internal Medusa | Emits `order.placed` in Medusa | Blocked | Requires running Medusa, DB, region, product, cart, shipping, payment setup. |
| Order | `order.created` | Medusa -> ApexBooks | `src/subscribers/apexbooks-order-created.ts` -> `sendOutboundEvent` | Pass, builder schema validation | Full checkout-triggered lifecycle blocked. |
| Order | `order.updated` | Medusa -> ApexBooks | `src/subscribers/apexbooks-order-updated.ts` -> `sendOutboundEvent` | Pass, builder schema validation | Full DB-backed mutation lifecycle blocked. |
| Order | `order.cancelled` | Medusa -> ApexBooks | `src/subscribers/apexbooks-order-cancelled.ts` -> `sendOutboundEvent` | Pass, builder schema validation | Full cancellation lifecycle blocked. |
| Payment | `payment.captured` | Medusa -> ApexBooks | `src/subscribers/apexbooks-payment-captured.ts` -> `sendOutboundEvent` | Pass, builder schema validation | Full payment provider lifecycle blocked. |
| Fulfillment | shipment/fulfillment | Medusa -> ApexBooks | Not implemented | Not certified | No ApexBooks fulfillment/shipment subscriber found. |
| Refund | `payment.refunded` | Medusa -> ApexBooks | `src/subscribers/apexbooks-payment-refunded.ts` -> `sendOutboundEvent` | Pass, builder schema validation | Full refund lifecycle blocked. |
| Return | `return.created` | Medusa -> ApexBooks | `src/subscribers/apexbooks-return-created.ts` -> `sendOutboundEvent` | Pass, builder schema validation | Full return lifecycle blocked. |

## Cross-Cutting Checks

Outbound implemented events:

- `X-ApexBooks-Contract-Version: v1`: covered by runtime compatibility test.
- `contract_version = v1`: pass in builder validation.
- `event_id` exists and is unique: pass in builder validation.
- `event_type` matches contract: pass in builder validation.
- Event-specific payload object validates against schema: pass in builder validation.
- Tenant context preserved: not certified; tenant context is not present in v1 artifacts or runtime code.

Inbound:

- Missing contract header rejected: pass.
- Invalid contract version rejected: pass.
- Valid v1 request accepted: pass.

## Certification Summary

Implemented ApexBooks runtime event formatting is valid for the covered outbound events.

Full end-to-end Medusa lifecycle certification remains blocked until PostgreSQL, Redis, Meilisearch, and a runnable Medusa test/staging environment are available.
