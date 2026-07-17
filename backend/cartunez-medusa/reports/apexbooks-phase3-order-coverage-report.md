# ApexBooks Phase 3 Order Coverage Report

Date: 2026-07-18

Scope: `backend/cartunez-medusa`

## Covered

Source inspection:

- Order created subscriber
- Order updated subscriber
- Order cancelled subscriber
- Shared outbound event builder
- Shared outbound request path
- Order sync metadata recording
- Frozen order schema
- Frozen order example

Automated validation:

- Build
- Typecheck
- Existing ApexBooks compatibility tests
- Generated `order.created` payload schema validation
- Generated `order.updated` payload schema validation
- Generated `order.cancelled` payload schema validation
- Duplicate idempotency behavior
- Invalid order schema rejection through JSON Schema
- Invalid unsupported order event rejection by builder

## Not Covered

- Real checkout completion and Medusa database-backed lifecycle execution.
- Real ApexBooks receiving endpoint behavior.
- Accounting response contract validation.
- Tenant resolution.
- Outbound HMAC signing.
- Replay cache behavior.
- Dedicated immutable field policy.
- Dedicated cancellation reason/accounting policy.

## Coverage Assessment

Coverage is sufficient to verify order payload generation against the frozen schema, but not sufficient to certify production order lifecycle behavior end to end.
