# ApexBooks v1 Runtime Changes

Date: 2026-07-17

## Files Modified

- `src/services/apexbooks-event-builder.ts`
- `src/services/apexbooks-integration.ts`
- `src/api/routes/apexbooks/index.ts`
- `tests/apexbooks-runtime-compatibility.test.js`
- `reports/apexbooks-runtime-compliance-report.md`
- `reports/apexbooks-test-report.md`
- `reports/apexbooks-runtime-changes.md`

## Runtime Changes Made

Added a centralized ApexBooks v1 event builder:

- Generates unique `event_id` values.
- Adds `contract_version: "v1"`.
- Adds the schema-required `event_type`.
- Preserves the required idempotency key format.
- Maps implemented Medusa outbound events to event-specific schema objects.
- Validates required envelope fields before sending.

Updated outbound transport:

- Adds `X-ApexBooks-Contract-Version: v1` to ApexBooks requests.
- Sends event-specific payload objects instead of generic `event` and `data`.
- Keeps the existing retry policy and idempotency header behavior.

Updated inbound handling:

- Rejects missing or non-v1 `X-ApexBooks-Contract-Version`.
- Keeps the existing JSON error envelope.
- Reads v1 event-specific inbound objects for product, price, inventory, and customer webhook endpoints.
- Accepts v1 `event_type` in the generic inbound handler.

Updated inbound mapping:

- Product sync accepts `apexbooks_product_id`.
- Customer sync accepts `apexbooks_customer_id`.
- Inventory sync accepts `available_quantity`.
- ApexBooks metadata lookup now recognizes both legacy `id` and v1-specific `product_id` / `customer_id`.

## Confirmations

- `docs/apexbooks/v1/` remained unchanged.
- ApexBooks contract files were not modified.
- Storefront files were not modified.
- Checkout flow files were not modified.
- Medusa core behavior was not modified.
- Internal Medusa models were not changed.
- Existing contract payload examples and schemas were not modified.
