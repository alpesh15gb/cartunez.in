# ApexBooks Phase 3 Order Runtime Compliance Report

Date: 2026-07-18

Scope: `backend/cartunez-medusa`

## Build Status

- `npm run build`: pass
- `npm run typecheck`: pass

## Runtime Order Flow

Order subscribers retrieve the Medusa order with:

- `items`
- `customer`
- `payments`
- `shipping_address`
- `billing_address`

Then they call:

```text
apexbooksIntegrationService.sendOutboundEvent(...)
```

The shared send path builds the v1 envelope, posts to ApexBooks, and records order sync metadata.

## URL and HTTP Method

Runtime outbound path:

```text
POST {APEXBOOKS_BASE_URL}/webhooks/medusa/events
```

Status: partial.

The method is correct for outbound delivery. The frozen v1 OpenAPI in this repo defines inbound Medusa webhook endpoints, not the ApexBooks receiving URL, so exact outbound URL compliance is not contract-verifiable.

## Request Schema

Status: pass for order event bodies.

Compiled builder-generated `order.created`, `order.updated`, and `order.cancelled` payloads validate against frozen `OrderPayload`.

## Response Schema

Status: not contract-verifiable.

The frozen artifacts do not define an accounting response schema for Medusa -> ApexBooks order calls. Runtime accepts any successful JSON body and records:

```text
response.id || response.event_id || null
```

## Authentication

Status: pass for implemented runtime convention.

Outbound sends:

```text
Authorization: Bearer <APEXBOOKS_API_KEY>
```

## HMAC

Status: not implemented for outbound order events.

The frozen v1 HMAC section covers inbound ApexBooks -> Medusa webhook signatures. Outbound Medusa -> ApexBooks order calls use Bearer API key authentication and idempotency headers, not HMAC.

## Timestamp

Status: partial.

Order payloads include `occurred_at` as an ISO timestamp. No outbound timestamp header is sent.

## Tenant

Status: fail / not implemented.

No tenant identifier or tenant header exists in the frozen order schema, OpenAPI, event catalog, or runtime order code.

## Replay

Status: partial.

Outbound replay protection depends on ApexBooks honoring `Idempotency-Key`. The Medusa runtime does not keep an outbound replay cache.

## Idempotency

Status: pass for header and payload shape.

Generated idempotency keys use:

```text
{eventType}:order:{orderId}
```

Duplicate generation for the same order/event keeps the same idempotency key while generating a new `event_id`.

## Customer and Product Mapping

Status: pass in builder probe.

Customer mapping includes Medusa customer ID, ApexBooks customer ID from metadata, email, names, phone, GST data, and billing/shipping addresses.

Product line mapping includes Medusa line item ID, product ID, variant ID, SKU, quantity, price totals, ApexBooks item ID from metadata, and GST breakdown.

## Invoice Policy

Status: partial.

The builder maps `order.metadata.apexbooks.invoice_id` to `order.apexbooks_invoice_id`. The contract does not define when an invoice must or must not exist for created/updated/cancelled order events.

## Cancellation Behavior

Status: partial.

Medusa `order.canceled` maps to ApexBooks `order.cancelled`, matching the frozen event catalog. There is no dedicated cancellation payload subtype or cancellation reason policy in the frozen order schema.
