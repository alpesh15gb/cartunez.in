# ApexBooks v1 Runtime Compliance Report

Date: 2026-07-17

Scope: `backend/cartunez-medusa`

## Result

Runtime compliance: pass for implemented Medusa ApexBooks integration paths.

The Medusa runtime now sends ApexBooks outbound events through a centralized v1 event builder and rejects inbound ApexBooks webhooks that do not include `X-ApexBooks-Contract-Version: v1`.

## Outbound Compliance

All implemented outbound ApexBooks events use `ApexBooksEventBuilder` through `ApexbooksIntegrationService.sendOutboundEvent`.

Implemented outbound event coverage:

- `order.placed` -> `order.created`
- `order.updated` -> `order.updated`
- `order.canceled` -> `order.cancelled`
- `payment.captured` -> `payment.captured`
- `refund.created` -> `payment.refunded`
- `return.requested` -> `return.created`
- `customer.created` -> `customer.created`

No ApexBooks fulfillment/shipment or outbound inventory subscribers are currently implemented in this codebase.

Outbound headers now include:

- `Content-Type: application/json`
- `Authorization: Bearer <APEXBOOKS_API_KEY>`
- `Idempotency-Key: <eventType>:<resourceType>:<resourceId>`
- `X-ApexBooks-Contract-Version: v1`

Outbound payloads now include:

- `contract_version: "v1"`
- `event_id`
- `event_type`
- `occurred_at`
- `idempotency_key`
- The event-specific schema object: `order`, `payment`, `refund`, `return`, or `customer`

The old generic outbound `event` and `data` envelope is no longer used.

## Inbound Compliance

Inbound webhook verification now requires:

- `X-ApexBooks-Contract-Version: v1`
- `X-ApexBooks-Timestamp`
- `X-ApexBooks-Signature`

Requests missing the contract version, or using a value other than `v1`, return HTTP `400` with the existing JSON error envelope:

```json
{
  "status": "failed",
  "message": "ApexBooks contract validation failed: X-ApexBooks-Contract-Version must be v1"
}
```

Endpoint-specific handlers now read v1 event-specific payload objects:

- `product`
- `price`
- `inventory`
- `customer`

Legacy `data` payload extraction remains as a backward-compatible fallback outside the immutable v1 artifacts.

## Unchanged Areas

- `docs/apexbooks/v1/` remained unchanged.
- No storefront files were modified.
- No checkout flow files were modified.
- No Medusa core behavior was changed.
- No product, order, or payment business logic was refactored.
- No existing contract payload examples or schemas were modified.
