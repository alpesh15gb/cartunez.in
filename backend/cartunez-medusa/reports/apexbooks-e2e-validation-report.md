# ApexBooks E2E Validation Report

Date: 2026-07-18

Scope: `backend/cartunez-medusa`

## Result

Production readiness for full Medusa -> ApexBooks lifecycle: not certified.

Reason: the actual Medusa lifecycle could not be executed end to end because the required runtime services were unavailable in this environment.

## Runtime Availability

Medusa runtime prerequisites from `medusa-config.js`:

- PostgreSQL via `DATABASE_URL`
- Redis via `REDIS_URL`
- `JWT_SECRET`
- `COOKIE_SECRET`
- Meilisearch plugin configuration

Observed environment:

- `.env`: not present
- PostgreSQL on `localhost:5432`: not reachable
- Redis on `localhost:6379`: not reachable
- Meilisearch on `localhost:7700`: not reachable during service check
- Docker CLI present
- Docker daemon unavailable

Docker attempt:

```text
docker compose up -d postgres redis meilisearch
```

Result:

```text
unable to get image 'redis:7-alpine': failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine
```

## Build and Contract Validation Performed

Commands:

```text
npm run build
npm run typecheck
node tests\apexbooks-integration.test.js
node tests\apexbooks-runtime-compatibility.test.js
```

Results:

- TypeScript build: pass
- TypeScript no-emit check: pass
- ApexBooks static integration checks: pass
- ApexBooks runtime compatibility checks: pass

## Compiled Outbound Event Builder Validation

The compiled `dist/services/apexbooks-event-builder.js` was executed directly and each generated outbound event was validated against `docs/apexbooks/v1/schemas/apexbooks-events.schema.json`.

Validated outbound event types:

- `customer.created`
- `order.created`
- `order.updated`
- `order.cancelled`
- `payment.captured`
- `payment.refunded`
- `return.created`

Observed output:

```text
customer.created schema=pass
order.created schema=pass
order.updated schema=pass
order.cancelled schema=pass
payment.captured schema=pass
payment.refunded schema=pass
return.created schema=pass
```

Verified for generated outbound payloads:

- `contract_version = v1`
- `event_id` exists
- `event_id` is unique across generated events
- `event_type` matches the expected ApexBooks event
- Event-specific schema object is present
- Payload validates against the frozen JSON Schema

Header verification remains covered by `tests/apexbooks-runtime-compatibility.test.js`:

- `X-ApexBooks-Contract-Version: v1`
- `Authorization`
- `Idempotency-Key`

## Inbound Contract Header Validation

The compiled `dist/services/apexbooks-integration.js` inbound verifier was executed directly with signed v1 payloads.

Observed output:

```text
missing_contract_version=rejected
invalid_contract_version=rejected
valid_v1=accepted
```

Verified:

- Missing `X-ApexBooks-Contract-Version` is rejected.
- Invalid contract version is rejected.
- Valid `X-ApexBooks-Contract-Version: v1` with valid signature is accepted.

## Scenario Coverage

Customer lifecycle:

- Customer creation outbound builder validation: pass.
- Customer update lifecycle: not certified. There is no implemented Medusa outbound `customer.updated` ApexBooks subscriber in the current codebase. Inbound `customer.updated` is implemented for ApexBooks -> Medusa, but full API execution was blocked by missing runtime services.

Product/catalog lifecycle:

- Product creation/update/inventory update are ApexBooks -> Medusa inbound contract events in the current v1 artifacts.
- Inbound header validation: pass at compiled service level.
- Full product API mutation lifecycle: not certified because Medusa could not be started without PostgreSQL/Redis.

Order lifecycle:

- `order.created`, `order.updated`, `order.cancelled`, `payment.captured`, `payment.refunded`, and `return.created` outbound builder validation: pass.
- Cart creation, checkout completion, fulfillment/shipment, and full order placement through Medusa HTTP APIs: not certified because Medusa could not be started without PostgreSQL/Redis.
- Fulfillment/shipment ApexBooks outbound event: not implemented in the current codebase.

## Tenant Context

Tenant context preservation: not certified.

No `tenant`, `tenant_id`, organization, or tenant header field was found in the ApexBooks v1 contract artifacts or Medusa ApexBooks runtime code. There is no tenant context to verify or preserve in the current implementation.

## Payload Examples

Representative generated outbound payload shape:

```json
{
  "contract_version": "v1",
  "event_id": "evt_medusa_order_created_order_e2e_01_<uuid>",
  "event_type": "order.created",
  "occurred_at": "<iso-date-time>",
  "idempotency_key": "order.created:order:order_e2e_01",
  "order": {
    "medusa_order_id": "order_e2e_01",
    "currency_code": "inr",
    "items": [
      {
        "medusa_line_item_id": "item_e2e_01",
        "medusa_variant_id": "variant_e2e_01",
        "quantity": 1,
        "gst": {
          "hsn_sac": "87089900",
          "gst_rate": 1800
        }
      }
    ]
  }
}
```

Representative inbound validation request:

```text
X-ApexBooks-Contract-Version: v1
X-ApexBooks-Timestamp: 2026-07-18T00:00:00.000Z
X-ApexBooks-Signature: sha256=<hmac>
```

## Failures and Blockers

1. Docker daemon is not running, so backend dependencies could not be started from `backend/docker-compose.yml`.
2. PostgreSQL and Redis were not reachable locally.
3. No `.env` exists for a local Medusa runtime.
4. Full Medusa lifecycle execution requires database schema, seed data, payment/fulfillment setup, and running Medusa HTTP APIs.
5. Fulfillment/shipment ApexBooks outbound integration is not currently implemented.
6. Tenant context is not represented in the current contract/runtime, so tenant preservation cannot be verified.

## Production Readiness

Medusa -> ApexBooks flow is not certified as production ready from this run.

The runtime compatibility layer is build-clean and schema-valid for implemented outbound events, and inbound contract-version handling works. Full production readiness still requires a successful database-backed Medusa lifecycle run against real or controlled staging services.
