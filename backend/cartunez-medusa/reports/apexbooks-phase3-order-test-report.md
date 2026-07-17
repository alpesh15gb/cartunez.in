# ApexBooks Phase 3 Order Test Report

Date: 2026-07-18

Scope: `backend/cartunez-medusa`

## Commands Run

```text
npm run build
npm run typecheck
node tests\apexbooks-integration.test.js
node tests\apexbooks-runtime-compatibility.test.js
```

Results:

- Build: pass
- Typecheck: pass
- Static compatibility: pass
- Runtime compatibility: pass

## Order-Specific Probe Results

Frozen example:

- `examples/order-created.json` schema validation: pass

Generated payloads:

- `order.created` schema validation: pass
- `order.updated` schema validation: pass
- `order.cancelled` schema validation: pass

Field checks:

- `event_type` matches contract: pass
- `event_id` exists and is unique: pass
- `idempotency_key` matches `{eventType}:order:{orderId}`: pass
- customer mapping: pass
- product mapping: pass
- invoice ID mapping: pass when `metadata.apexbooks.invoice_id` is present
- metadata preservation / immutable marker: pass

Negative checks:

- duplicate event ID: pass, new generated event IDs are unique
- duplicate idempotency: pass, same order/event yields same idempotency key
- invalid schema with empty order items: pass, schema rejects
- invalid event type `order.deleted`: pass, builder rejects

## Requested Tests Not Fully Executable

- replay: partial only; outbound replay relies on ApexBooks idempotency behavior and no local replay cache exists
- invalid tenant: not executable because tenant is absent from contract/runtime
- invalid signature: not applicable to outbound order events; runtime outbound uses Bearer API key
- immutable updates: only metadata preservation was verified; no explicit immutable order policy exists
- error responses: outbound accounting response schema is not contract-defined

## Summary

Order payload generation passes schema and mapping tests. Full Phase 3 certification remains blocked by contract/runtime gaps listed in the compliance reports.
