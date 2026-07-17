# ApexBooks Phase 3 Order CCRs

Date: 2026-07-18

Scope: `backend/cartunez-medusa`

The v1 contract is frozen. These CCRs document items that cannot be verified or enforced exactly without additional contract/runtime policy.

## CCR-ORDER-001: Outbound ApexBooks Receiving URL

Request:

- Publish the ApexBooks receiving endpoint URL/method for Medusa -> ApexBooks order events in the contract.

Reason:

- Runtime posts to `/webhooks/medusa/events`, but the frozen OpenAPI only defines inbound Medusa webhook endpoints.

## CCR-ORDER-002: Accounting Response Schema

Request:

- Define the successful and failed ApexBooks accounting response schemas for order events.

Reason:

- Runtime records `response.id || response.event_id || null`, but there is no frozen response schema to validate.

## CCR-ORDER-003: Tenant Context

Request:

- Define tenant header or payload field and invalid-tenant error behavior.

Reason:

- Tenant verification is required, but no tenant concept exists in the current v1 order contract/runtime.

## CCR-ORDER-004: Replay Protection

Request:

- Define outbound replay semantics, including whether stable `Idempotency-Key` is sufficient or whether timestamp/HMAC/replay cache is required.

Reason:

- Current outbound order events use Bearer auth and idempotency, not HMAC or timestamp headers.

## CCR-ORDER-005: Invoice Policy

Request:

- Define invoice ID requirements for `order.created`, `order.updated`, and `order.cancelled`.

Reason:

- Runtime maps invoice ID if present in order metadata, but the contract does not state when it must be present or immutable.

## CCR-ORDER-006: Immutable Field Protection

Request:

- Define immutable order fields and allowed mutations for `order.updated` and `order.cancelled`.

Reason:

- The current schema accepts a full order object for all order event types and does not define immutable update constraints.
