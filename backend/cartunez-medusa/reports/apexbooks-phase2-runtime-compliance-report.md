# ApexBooks Phase 2 Runtime Compliance Report

Date: 2026-07-18

Scope: `backend/cartunez-medusa`

## Build and Static Runtime Status

- `npm run build`: pass
- `npm run typecheck`: pass
- `node tests\apexbooks-integration.test.js`: pass
- `node tests\apexbooks-runtime-compatibility.test.js`: pass

## Headers and Authentication

Inbound:

- `X-ApexBooks-Contract-Version: v1`: enforced.
- `X-ApexBooks-Timestamp`: required, but value format/freshness is not validated.
- `X-ApexBooks-Signature`: HMAC SHA-256 required and verified.
- `X-ApexBooks-Event-Id`: read by generic handler; endpoint-specific handlers fall back to body event ID or `Date.now()`.
- `X-ApexBooks-Event-Type`: read by generic handler.

Outbound:

- `X-ApexBooks-Contract-Version: v1`: sent.
- `Authorization: Bearer <api key>`: sent.
- `Idempotency-Key`: sent.

## HMAC

Status: partial.

Runtime computes HMAC over:

```text
{timestamp}.{JSON.stringify(payload)}
```

The frozen OpenAPI describes HMAC over `{timestamp}.{raw_body}`. These are equivalent only when body serialization exactly matches runtime `JSON.stringify` output.

## Timestamp

Status: fail.

The verifier requires the timestamp header but does not validate timestamp format, freshness, skew, or replay window. A request signed with `X-ApexBooks-Timestamp: not-a-date` was accepted.

## Event ID and Duplicate Events

Status: partial.

- Event ID is read from headers/body.
- Processed inbound event IDs are stored in `metadata.apexbooks.processed_event_ids`.
- Duplicate event ID verification passed for product sync.

Gap:

- Endpoint-specific handlers can synthesize `Date.now()` as event ID when the header/body field is absent, despite the contract requiring the header.

## Idempotency Key

Status: partial.

- Frozen examples contain `idempotency_key`.
- Outbound requests send `Idempotency-Key`.
- Inbound runtime does not verify or de-duplicate by `idempotency_key`.

## Tenant Resolution

Status: fail / not implemented.

No tenant field or tenant header was found in:

- frozen v1 schema
- OpenAPI
- runtime code
- tests

Invalid tenant behavior cannot be verified because tenant resolution does not exist.

## JSON Schema Validation

Status: fail at runtime.

All frozen example payloads validate against the schema during compatibility tests. Runtime handlers do not validate inbound payloads against the JSON Schema. A product payload missing schema-required `hsn_sac` and `gst_rate` was accepted by runtime.

## Success and Error Envelopes

Status: pass.

- Success/skipped responses return JSON with `status` and optional `id` / `message`.
- Runtime errors return HTTP `400` JSON envelopes with `status: "failed"` and `message`.

## Retry Behaviour

Status: pass for outbound transport.

Outbound retry loop is governed by `APEXBOOKS_MAX_RETRIES`, retries network errors/timeouts/`429`/`5xx`, and does not retry other `4xx` responses.

## Replay Behaviour

Status: fail.

The same signed request can be verified multiple times at the HMAC layer. Duplicate event handling may skip a payload after sync if metadata already contains the event ID, but there is no timestamp/signature replay cache or skew check.
