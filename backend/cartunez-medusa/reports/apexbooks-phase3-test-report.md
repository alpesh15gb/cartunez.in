# ApexBooks Phase 3 Test Report

Date: 2026-07-18

Scope: `backend/cartunez-medusa`

## Test Execution

### Static Integration Tests

Command: `node tests/apexbooks-integration.test.js`

Result: **pass**

The integration test validates:
- Environment variable configuration (`APEXBOOKS_BASE_URL`, `APEXBOOKS_WEBHOOK_SECRET`)
- Outbound idempotency key header
- Inbound duplicate-event handling via `processed_event_ids`
- API route registration at `/apexbooks/webhooks` and `/apexbooks/v1/webhooks`
- Contract schema file existence and parseability
- All 8 example payloads have valid `contract_version`, `event_id`, `event_type`
- All 7 subscribers correctly reference `config`, their event name, and `sendOutboundEvent`

### Runtime Compatibility Tests

Command: `node tests/apexbooks-runtime-compatibility.test.js`

Result: **pass**

The runtime test validates:

| Check | Status |
|-------|--------|
| All 8 example payloads validate against schema | pass |
| V1 API routes registered | pass |
| Outbound HMAC signature header | pass |
| Outbound HMAC timestamp header | pass |
| No Bearer token in outbound auth | pass |
| Outbound idempotency header | pass |
| Outbound contract-version header | pass |
| Envelope fields (contract_version, event_id, event_type, occurred_at, idempotency_key) | pass |
| No generic `event` field in envelope | pass |
| No generic `data` field in envelope | pass |
| Inbound contract-version header requirement | pass |
| Inbound timestamp header requirement | pass |
| Inbound signature header requirement | pass |
| Inbound event-id header read | pass |
| Inbound event-type header read | pass |
| HMAC signature format (`sha256=[a-f0-9]{64}`) | pass |
| Outbound retry loop | pass |
| Retry policy (429/5xx retry, non-retryable 4xx stop) | pass |
| Inbound duplicate-event handling | pass |
| Tenant configuration (`APEXBOOKS_TENANT_ID`) | pass |
| Outbound tenant header (`X-ApexBooks-Tenant-Id`) | pass |
| Tenant resolution rejection | pass |
| Local replay protection set | pass |
| Local replay rejection | pass |
| Order event validation | pass |
| Event_id format validation for order events | pass |
| Timestamp expiry rejection | pass |
| Timestamp clock skew rejection | pass |
| Secrets out of logs | pass |
| Success/skipped envelope format | pass |
| Error envelope format | pass |

## Build Verification

| Check | Status |
|-------|--------|
| `npm run build` (tsc) | pass (0 errors) |
| `npm run typecheck` (tsc --noEmit) | pass (0 errors) |

## Frozen Contract Verification

All `docs/apexbooks/v1/` files confirmed unchanged:

| File | Status |
|------|--------|
| `docs/apexbooks/v1/openapi.yaml` | unchanged |
| `docs/apexbooks/v1/schemas/apexbooks-events.schema.json` | unchanged |
| `docs/apexbooks/v1/event-catalog.md` | unchanged |
| `docs/apexbooks/v1/sequence-diagrams.md` | unchanged |
| `docs/apexbooks/v1/examples/order-created.json` | unchanged |
| `docs/apexbooks/v1/examples/order-updated.json (N/A)` | — |
| `docs/apexbooks/v1/examples/order-cancelled.json (N/A)` | — |
| `docs/apexbooks/v1/examples/payment-captured.json` | unchanged |
| `docs/apexbooks/v1/examples/refund-created.json` | unchanged |
| `docs/apexbooks/v1/examples/return-created.json` | unchanged |
| `docs/apexbooks/v1/examples/customer-created.json` | unchanged |
| `docs/apexbooks/v1/examples/product-updated.json` | unchanged |
| `docs/apexbooks/v1/examples/inventory-updated.json` | unchanged |
| `docs/apexbooks/v1/examples/price-updated.json` | unchanged |
