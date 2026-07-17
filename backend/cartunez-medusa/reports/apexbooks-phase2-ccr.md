# ApexBooks Phase 2 Contract Change Requests

Date: 2026-07-18

Scope: `backend/cartunez-medusa`

The ApexBooks v1 contract is frozen. These CCRs are raised because the requested Phase 2 verification matrix includes fields or behaviors not represented by the frozen v1 contract, or because runtime behavior deviates from enforceable contract expectations.

## CCR-APEX-P2-001: Tenant Resolution

Request:

- Define tenant context in the contract.

Reason:

- Verification requires tenant resolution, invalid tenant handling, and tenant context preservation.
- No tenant field/header exists in the frozen schema, OpenAPI, or runtime.

## CCR-APEX-P2-002: Price Field Names and Price Lists

Request:

- Clarify whether price payloads should use `amount_minor` or the current `Money.amount`.
- Add validity dates and price list fields if Phase 2 requires them.

Reason:

- Frozen v1 schema defines `unit_price` as a Money object and does not include `amount_minor`, validity dates, or price list.

## CCR-APEX-P2-003: Inventory Warehouse and Timestamp Fields

Request:

- Clarify whether inventory payloads should use `warehouse_id` or current `location_id`.
- Add inventory object `updated_at` if required.

Reason:

- Frozen v1 schema defines `location_id` and top-level `occurred_at`, not `warehouse_id` or inventory-level `updated_at`.

## CCR-APEX-P2-004: Product Categories and Variant/Image Semantics

Request:

- Add product category mapping and explicit variant/image update semantics to the product inbound payload if required for Phase 2.

Reason:

- Frozen product schema includes `images` but not categories.
- Runtime does not update existing variants from product sync.

## CCR-APEX-P2-005: Replay and Timestamp Window

Request:

- Define allowed timestamp skew, replay cache requirements, and failure envelope for replayed signatures.

Reason:

- Current contract requires timestamp and signature but does not define freshness/replay policy.
- Runtime currently accepts invalid timestamp strings if signed.

## CCR-APEX-P2-006: ERP-Owned Customer Fields

Request:

- Define exactly which customer fields are ERP-owned and which are authentication-owned.

Reason:

- Runtime updates `email`, `first_name`, `last_name`, `phone`, and metadata.
- The verification task requires auth fields untouched, but the frozen contract does not classify email/auth ownership.
