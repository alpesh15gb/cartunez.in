# ApexBooks Phase 2 Test Report

Date: 2026-07-18

Scope: `backend/cartunez-medusa`

## Commands Executed

```text
npm run build
npm run typecheck
node tests\apexbooks-integration.test.js
node tests\apexbooks-runtime-compatibility.test.js
```

## Results

Build: pass.

Typecheck: pass.

Static compatibility test: pass.

```text
ApexBooks integration static checks passed
```

Runtime compatibility test: pass.

```text
ApexBooks runtime compatibility checks passed
```

## Frozen Example Payload Validation

All examples under `docs/apexbooks/v1/examples` validated against `docs/apexbooks/v1/schemas/apexbooks-events.schema.json`:

- `customer-created.json`: pass
- `inventory-updated.json`: pass
- `order-created.json`: pass
- `payment-captured.json`: pass
- `price-updated.json`: pass
- `product-updated.json`: pass
- `refund-created.json`: pass
- `return-created.json`: pass

## Runtime Probe Results

Valid requests:

- `product.updated`: pass
- `price.updated`: pass
- `inventory.updated`: pass
- `customer.updated`: pass

Invalid/security requests:

- Missing contract header: pass, rejected.
- Invalid contract version: pass, rejected.
- Invalid signature: pass, rejected.
- Invalid timestamp: fail, accepted when signature matched the invalid timestamp.
- Replay attack: fail, same signed request accepted twice by verifier.
- Duplicate event: pass, skipped based on `processed_event_ids`.
- Schema validation: fail, runtime accepted product payload missing schema-required `hsn_sac` and `gst_rate`.
- Invalid tenant: not executable; tenant resolution is absent.
- Duplicate idempotency: not enforced locally.

Customer auth-field check:

- Pass. Runtime customer update payload did not include `password` or `password_hash`.

## Notes

The tests used frozen example payloads and fake Medusa services for runtime service invocation. A full database-backed Medusa lifecycle was not executed in this verification pass.
