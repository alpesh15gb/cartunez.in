# Cartunez Medusa <-> ApexBooks Integration

## Architecture

ApexBooks is the ERP and source of truth for products, inventory, customers, accounting, GST, invoices, and payments. Medusa owns storefront, cart, checkout, orders, shipping, and customer authentication.

The integration is implemented only inside `backend/cartunez-medusa`:

- Outbound Medusa subscribers publish order/payment/return/customer events to ApexBooks REST APIs.
- Inbound authenticated webhooks from ApexBooks update Medusa products, prices, inventory, and customers.
- No direct ApexBooks database connection is used.
- ApexBooks identifiers and sync state are stored in existing Medusa `metadata` JSON fields.
- No Medusa schema migration is required for the integration.

## Folder Structure

```text
src/services/apexbooks-integration.ts
  API client, retries, request/response logging, webhook verification, inbound sync handlers.

src/api/routes/apexbooks/index.ts
  Authenticated inbound webhook endpoints and health/config endpoint.

src/subscribers/apexbooks-*.ts
  Outbound event handlers for order, payment, return, and customer events.

docs/apexbooks-integration.md
  Integration architecture and operations notes.
```

## Environment

```env
APEXBOOKS_ENABLED=false
APEXBOOKS_BASE_URL=https://api.apexbooks.example
APEXBOOKS_API_KEY=
APEXBOOKS_WEBHOOK_SECRET=
APEXBOOKS_TIMEOUT_MS=10000
APEXBOOKS_MAX_RETRIES=3
```

`APEXBOOKS_ENABLED=false` prevents outbound calls while still allowing code to compile and deploy safely.

## Database Metadata Changes

No schema changes. Existing `metadata` fields are used.

Products/customers:

```json
{
  "apexbooks": {
    "id": "apexbooks-id",
    "last_event_id": "evt_123",
    "last_synced_at": "2026-07-17T00:00:00.000Z",
    "processed_event_ids": ["evt_123"],
    "last_payload_hash": "sha256"
  }
}
```

Orders:

```json
{
  "apexbooks": {
    "outbound": {
      "order.created": {
        "status": "sent",
        "sent_at": "2026-07-17T00:00:00.000Z",
        "response_id": "apexbooks-response-id"
      }
    }
  }
}
```

Invoices and payments should store ApexBooks IDs in the same metadata namespace when ApexBooks returns them in event/API responses.

## Outbound Events

Medusa event -> ApexBooks event:

- `order.placed` -> `order.created`
- `order.updated` -> `order.updated`
- `order.canceled` -> `order.cancelled`
- `payment.captured` -> `payment.captured`
- `refund.created` -> `payment.refunded`
- `return.requested` -> `return.created`
- `customer.created` -> `customer.created`

Outbound idempotency key:

```text
{eventName}:{resourceType}:{resourceId}
```

The key is sent as `Idempotency-Key`.

## Inbound Webhooks

Versioned v1 endpoints:

- `POST /apexbooks/v1/webhooks`
- `POST /apexbooks/v1/webhooks/products`
- `POST /apexbooks/v1/webhooks/prices`
- `POST /apexbooks/v1/webhooks/inventory`
- `POST /apexbooks/v1/webhooks/customers`

Legacy aliases retained for backward compatibility:

- `POST /apexbooks/webhooks`
- `POST /apexbooks/webhooks/products`
- `POST /apexbooks/webhooks/prices`
- `POST /apexbooks/webhooks/inventory`
- `POST /apexbooks/webhooks/customers`

Required headers:

```text
x-apexbooks-event-id: unique-event-id
x-apexbooks-event-type: product.updated
x-apexbooks-timestamp: unix-or-iso-timestamp
x-apexbooks-signature: sha256={hmac}
```

Signature payload:

```text
{timestamp}.{JSON.stringify(body)}
```

HMAC algorithm: `sha256` using `APEXBOOKS_WEBHOOK_SECRET`.

## Retry Strategy

Outbound REST calls retry:

- network errors
- timeouts
- HTTP `429`
- HTTP `5xx`

They do not retry non-retryable `4xx` errors.

Backoff is exponential:

```text
250ms, 500ms, 1000ms...
```

Retry count is controlled by `APEXBOOKS_MAX_RETRIES`.

## Error Handling

- Inbound auth/signature errors return HTTP `400`.
- Unsupported inbound event types return `200` with `status: skipped`.
- Already processed event IDs return `200` with `status: skipped`.
- Outbound disabled mode logs and skips without failing checkout/order flows.
- Request and response bodies are logged with truncation to avoid oversized logs.

## Tests

Static tests live under `tests/apexbooks-integration.test.js` and validate that the module files and required event subscriptions exist. Runtime contract tests should be added once ApexBooks staging API credentials and payload examples are available.
