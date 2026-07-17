# ApexBooks v1 Test Report

Date: 2026-07-17

## Commands Run

```text
node tests\apexbooks-integration.test.js
node tests\apexbooks-runtime-compatibility.test.js
```

## Results

Static integration checks: pass.

```text
ApexBooks integration static checks passed
```

Runtime compatibility checks: pass.

```text
ApexBooks runtime compatibility checks passed
```

TypeScript build: pass.

```text
> cartunez-medusa@1.0.0 build
> tsc
```

TypeScript no-emit check: pass.

```text
> cartunez-medusa@1.0.0 typecheck
> tsc --noEmit
```

## Test Coverage

`tests/apexbooks-integration.test.js` verifies existing integration files, required subscribers, route registrations, v1 artifacts, and example payload basics.

`tests/apexbooks-runtime-compatibility.test.js` verifies:

- Published example payloads validate against the v1 JSON Schema bundle.
- Required v1 inbound endpoints are registered as `POST`.
- Outbound authentication and idempotency headers are present.
- Outbound `X-ApexBooks-Contract-Version: v1` is sent.
- Outbound envelopes include `contract_version`, `event_id`, `event_type`, `occurred_at`, and `idempotency_key`.
- Outbound runtime no longer uses generic `event` or `data` envelope fields.
- Inbound runtime requires the v1 contract-version header.
- Signature, timestamp, event ID, event type, retry, duplicate-event, and response-envelope behavior remains covered.
