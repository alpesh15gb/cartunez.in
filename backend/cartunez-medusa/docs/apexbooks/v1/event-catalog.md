# ApexBooks Integration Contract v1 - Event Catalog

Status: finalized for Medusa-side implementation.

## Ownership Boundary

ApexBooks is source of truth for products, inventory, customers, accounting, GST, invoices, and payments.

Medusa owns storefront, cart, checkout, orders, shipping, and customer authentication.

Medusa must never connect to the ApexBooks database. All communication is REST API or authenticated webhooks.

## API Versioning

Contract version: `v1`

Every HTTP request must include:

```text
X-ApexBooks-Contract-Version: v1
```

Webhook URLs are versioned:

```text
/apexbooks/v1/webhooks
```

Payloads include:

```json
{
  "contract_version": "v1"
}
```

Breaking changes require `v2`. Additive optional fields may remain in `v1`.

## Monetary Standard

All money values are integer minor units.

For INR:

```text
100 paise = INR 1.00
```

Fields ending in `_amount`, `_value`, `_price`, `_total`, `_subtotal`, `_discount`, or `_tax` are minor units unless explicitly documented otherwise.

Currency must be ISO 4217 lowercase, e.g. `inr`.

## Medusa Event Names

Current Medusa package: `@medusajs/medusa@1.20.4`.

| Medusa event | ApexBooks event | Direction | Notes |
|---|---|---|---|
| `order.placed` | `order.created` | Medusa -> ApexBooks | Order created after checkout completion. |
| `order.updated` | `order.updated` | Medusa -> ApexBooks | Non-creation order mutation. |
| `order.canceled` | `order.cancelled` | Medusa -> ApexBooks | ApexBooks uses British spelling in canonical event. |
| `payment.captured` | `payment.captured` | Medusa -> ApexBooks | Payment captured in Medusa. |
| `refund.created` | `payment.refunded` | Medusa -> ApexBooks | Medusa v1 refund event, mapped to ERP payment refund. |
| `return.requested` | `return.created` | Medusa -> ApexBooks | Return initiated in Medusa. |
| `customer.created` | `customer.created` | Medusa -> ApexBooks | Medusa auth/customer creation. |

## Inbound ApexBooks Events

| ApexBooks event | Medusa action |
|---|---|
| `product.created` | Upsert product by `apexbooks.product_id` metadata. |
| `product.updated` | Update product fields and metadata. |
| `price.updated` | Update/record product price update. |
| `inventory.updated` | Update variant inventory. |
| `customer.updated` | Update customer profile and GST metadata. |

## Contract Artifacts

- OpenAPI: `openapi.yaml`
- JSON Schema bundle: `schemas/apexbooks-events.schema.json`
- Examples:
  - `examples/order-created.json`
  - `examples/payment-captured.json`
  - `examples/refund-created.json`
  - `examples/return-created.json`
  - `examples/customer-created.json`
  - `examples/product-updated.json`
  - `examples/inventory-updated.json`
  - `examples/price-updated.json`
- Sequence diagrams: `sequence-diagrams.md`

## Idempotency

Every webhook includes:

```json
{
  "event_id": "evt_...",
  "idempotency_key": "..."
}
```

Medusa stores processed inbound event IDs in metadata:

```json
{
  "metadata": {
    "apexbooks": {
      "processed_event_ids": ["evt_..."]
    }
  }
}
```

Outbound requests from Medusa send:

```text
Idempotency-Key: {eventName}:{resourceType}:{resourceId}
```

## Required Security Headers

Inbound ApexBooks -> Medusa webhooks:

```text
X-ApexBooks-Contract-Version: v1
X-ApexBooks-Event-Id: evt_...
X-ApexBooks-Event-Type: product.updated
X-ApexBooks-Timestamp: 2026-07-17T00:00:00.000Z
X-ApexBooks-Signature: sha256={hmac}
```

Signature input:

```text
{timestamp}.{raw_body}
```

HMAC: SHA-256 using `APEXBOOKS_WEBHOOK_SECRET`.

## GST Contract

GST data is mandatory for order, refund, and invoice-related payloads.

Each taxable line must include:

- `hsn_sac`
- `gst_rate`
- `taxable_value`
- `tax_amount`
- `cgst`
- `sgst`
- `igst`
- `cess`
- `discount_allocation`

Rules:

- Intra-state sale: `cgst + sgst = tax_amount`, `igst = 0`.
- Inter-state sale: `igst = tax_amount`, `cgst = 0`, `sgst = 0`.
- `taxable_value = line_subtotal - discount_allocation`.
- `tax_amount = cgst + sgst + igst + cess`.
- GST rate is basis points. `1800` means `18.00%`.

## Mandatory ApexBooks IDs in Medusa Metadata

Use existing Medusa `metadata` JSON. No schema migration is required.

Products:

```json
{ "metadata": { "apexbooks": { "product_id": "ab_prod_..." } } }
```

Customers:

```json
{ "metadata": { "apexbooks": { "customer_id": "ab_cus_..." } } }
```

Orders:

```json
{ "metadata": { "apexbooks": { "order_id": "ab_ord_...", "invoice_id": "ab_inv_..." } } }
```

Payments:

```json
{ "metadata": { "apexbooks": { "payment_id": "ab_pay_..." } } }
```

Invoices:

```json
{ "metadata": { "apexbooks": { "invoice_id": "ab_inv_..." } } }
```
