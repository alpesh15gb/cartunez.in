# ApexBooks Phase 3 Order Performance Notes

Date: 2026-07-18

Scope: `backend/cartunez-medusa`

## Observations

Order retrieval:

- Each order subscriber retrieves the order with related items, customer, payments, shipping address, and billing address before sending.

Payload generation:

- Order payload generation is linear in the number of order line items.
- GST summary aggregation is also linear in line item count.

Outbound transport:

- Uses a single HTTP `POST` per order event.
- Retries network errors, timeouts, `429`, and `5xx`.
- Exponential backoff begins at `250ms`.
- Request/response logging truncates bodies at 2,000 characters.

Metadata recording:

- For `resourceType === "order"`, runtime retrieves and updates the order metadata after a successful ApexBooks response.

## Risks

- Large orders may produce larger payloads, but no benchmark was run.
- Repeated order updates will generate new event IDs and rely on ApexBooks idempotency key handling to avoid duplicate accounting effects.
- No local outbound replay cache exists.

## Benchmarks

No throughput benchmark was run because this task was verification-only and did not start a database-backed Medusa runtime.
