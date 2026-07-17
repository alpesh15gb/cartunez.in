# ApexBooks Phase 2 Compatibility Report

Date: 2026-07-18

Scope: `backend/cartunez-medusa`

Reference requested:

- Tag: `integration-contract-v1`
- Commit: `e31e965`

Verification basis: checked-in frozen artifacts under `docs/apexbooks/v1/`. Those files were not modified.

## Result

Phase 2 Contract Compliance: FAIL

The Phase 2 master-data runtime is partially compatible. Valid frozen example payloads validate against the JSON Schema and are accepted by the current inbound service path with fake Medusa services. However, runtime schema validation, timestamp freshness/format validation, replay prevention, tenant resolution, and several master-data field applications are incomplete or not represented in the frozen v1 contract.

## Product Synchronization

Status: partial.

Verified:

- `apexbooks_product_id` is accepted and used for lookup.
- Product `title` / name maps to Medusa `title`.
- `description` maps to Medusa `description`.
- `thumbnail` maps from inbound `thumbnail` / `image_url`.
- Existing Medusa `metadata.apexbooks` is updated with event tracking and payload hash.
- Duplicate event IDs are skipped.

Deviations / gaps:

- `sku` is accepted by schema but not applied to product or variant on product update.
- `images` are accepted by schema but not applied except `thumbnail`.
- `categories` are not present in the frozen v1 product schema and are not synchronized.
- Existing product variants are not updated by product synchronization.
- Product update does not persist `hsn_sac` / `gst_rate` as first-class product metadata; they are only represented indirectly through the payload hash.

## Price Synchronization

Status: fail for applied price mutation; pass only for metadata recording.

Verified:

- Valid `price.updated` example is accepted.
- Product is found using `apexbooks_product_id`.
- Event metadata and payload hash are recorded.

Deviations / gaps:

- Runtime logs that variant price mutation is delegated and does not update Medusa prices.
- Frozen schema uses `unit_price.amount`, not requested `amount_minor`.
- Frozen schema does not define validity dates or price list fields.
- `tax_inclusive`, `currency_code`, `unit_price`, `mrp`, and `gst_rate` are not applied to Medusa price data.

## Inventory Synchronization

Status: partial.

Verified:

- Valid `inventory.updated` example is accepted.
- `available_quantity` maps to Medusa variant `inventory_quantity`.
- Event metadata and payload hash are recorded on product and variant metadata.

Deviations / gaps:

- `reserved_quantity` is not applied.
- Frozen schema uses `location_id`, not requested `warehouse_id`.
- `location_id` is not applied beyond payload hash.
- `updated_at` is not present in the frozen inventory object; only top-level `occurred_at` exists.

## Customer Synchronization

Status: partial.

Verified:

- Valid `customer.updated` payload is accepted by the runtime path.
- Runtime updates `email`, `first_name`, `last_name`, `phone`, and `metadata`.
- Authentication fields such as `password` and `password_hash` were not included in the update payload during verification.

Deviations / gaps:

- The implementation updates `email`, which may be an authentication-sensitive field depending on Medusa auth policy. The contract does not explicitly classify ERP-owned vs authentication-owned customer fields.
- GST and address fields from the frozen customer schema are not applied except through metadata payload hash.

## Endpoint Compatibility

Status: pass.

Registered v1 endpoints:

- `POST /apexbooks/v1/webhooks`
- `POST /apexbooks/v1/webhooks/products`
- `POST /apexbooks/v1/webhooks/prices`
- `POST /apexbooks/v1/webhooks/inventory`
- `POST /apexbooks/v1/webhooks/customers`

Legacy aliases also exist and were not treated as deviations.

## Production Readiness

Phase 2 master-data synchronization is not production-ready against the full requested verification matrix.

The implementation can accept valid v1 product, price, inventory, and customer examples, but it does not enforce runtime JSON Schema validation, timestamp/replay controls, tenant resolution, or complete field application for price, product images/categories/variants, inventory reservation/location, and customer GST/address data.
