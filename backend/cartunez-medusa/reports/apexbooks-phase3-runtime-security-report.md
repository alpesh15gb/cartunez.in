# ApexBooks Phase 3 Runtime & Security Report

Date: 2026-07-18

Scope: `backend/cartunez-medusa`

## Changes Summary

### 1. Tenant Context Enforcement

**Status: Implemented**

- Tenant ID is resolved from `APEXBOOKS_TENANT_ID` environment variable per-deployment
- Every outbound event must pass tenant resolution before delivery; unresolved tenant rejects the event
- Outbound requests include `X-ApexBooks-Tenant-Id` header for downstream tenant routing
- Inbound webhooks validate `X-ApexBooks-Tenant-Id` header against local tenant to prevent cross-tenant event delivery
- No frozen contract schemas were modified; tenant is internal/header-only

**Files changed:**
- `src/services/apexbooks-integration.ts` — added tenantId to config, resolveTenant() method, tenant header injection, cross-tenant validation

### 2. HMAC Request Signing (Replaces Bearer API Key)

**Status: Implemented**

Outbound Medusa → ApexBooks requests now use HMAC-SHA256 request signing:

- Signature input: `{timestamp}.{json_body}`
- Algorithm: HMAC-SHA256 using `APEXBOOKS_API_KEY` as the secret
- Headers:
  - `X-ApexBooks-Timestamp` — ISO 8601 timestamp of request generation
  - `X-ApexBooks-Signature` — `sha256={hex_digest}`
- Timestamp expiry: timestamps older than 5 minutes (`HMAC_MAX_AGE_MS = 300000`) are rejected
- Clock skew protection: timestamps more than 1 minute in the future are rejected
- Secrets kept out of logs: response body logging removed from success path; error paths use truncated body only
- Bearer `Authorization` header removed

**Files changed:**
- `src/services/apexbooks-integration.ts` — replaced `Authorization: Bearer` with HMAC headers in `request()`, added `verifyTimestamp()`

### 3. Local Replay Protection

**Status: Implemented**

Before outbound delivery, the runtime maintains a local in-memory `Set<string>` of processed outbound idempotency keys:

- Replay check: if `idempotency_key` is already in the set, the event is rejected with `status: "skipped"` and message `"duplicate event rejected by local replay protection"`
- The set is checked **before** making the HTTP request to ApexBooks
- After successful delivery, the key is added to the set
- Persistent dedup is handled by existing order metadata tracking (`recordOutboundSync` → `metadata.apexbooks.outbound`)

**Files changed:**
- `src/services/apexbooks-integration.ts` — added `processedOutboundKeys_` field, replay check in `sendOutboundEvent()`

### 4. Order Event Validation

**Status: Implemented**

Before outbound delivery, order events (`order.created`, `order.updated`, `order.cancelled`) are validated:

- `event_id` format: must start with `evt_`
- `event_type` enumeration: must be one of the three valid order event types
- `contract_version`: must be `v1`
- Tenant context: already enforced before build (see #1)
- Schema validation is performed by `ApexBooksEventBuilder.validate()` during `build()`

**Files changed:**
- `src/services/apexbooks-integration.ts` — added `validateOrderEvent()` method, called in `sendOutboundEvent()` for order event types

### 5. V2 Contract Gaps (Not Implemented, Documented Separately)

See `reports/apexbooks-phase3-contract-gaps.md` for detailed documentation.

## Files Changed

| File | Change |
|------|--------|
| `src/services/apexbooks-integration.ts` | Tenant context, HMAC signing, replay protection, order event validation |
| `tests/apexbooks-runtime-compatibility.test.js` | Updated assertions to verify HMAC, tenant, replay, and validation behaviors |

## Frozen Contract Artifacts

All `docs/apexbooks/v1/*` files are unchanged:

- `schemas/apexbooks-events.schema.json` — unchanged
- `openapi.yaml` — unchanged
- `event-catalog.md` — unchanged
- `sequence-diagrams.md` — unchanged
- `examples/*.json` — all 8 example files unchanged

## Build & Test Results

| Check | Status |
|-------|--------|
| `npm run build` (tsc) | pass |
| `npm run typecheck` (tsc --noEmit) | pass |
| `node tests/apexbooks-integration.test.js` | pass |
| `node tests/apexbooks-runtime-compatibility.test.js` | pass |
