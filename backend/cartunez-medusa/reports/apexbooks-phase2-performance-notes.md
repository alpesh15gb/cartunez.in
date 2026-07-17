# ApexBooks Phase 2 Performance Notes

Date: 2026-07-18

Scope: `backend/cartunez-medusa`

## Observations

Product lookup:

- `findProductByApexBooksId` loads up to 10,000 products and scans metadata in memory.
- This is O(n) per inbound product, price, or inventory event.

Customer lookup:

- `findCustomerByApexBooksId` loads up to 10,000 customers and scans metadata in memory.
- This is O(n) per inbound customer event.

Inventory update:

- `syncInventory` updates every variant on the matched product to the same `available_quantity`.
- It does not target only the matching `apexbooks_variant_id`.

Price update:

- `syncPrice` records metadata only and does not mutate variant prices.

Logging:

- Outbound request/response bodies are logged with truncation at 2,000 characters.

Retry:

- Outbound retry uses exponential backoff of `250ms`, `500ms`, `1000ms`, etc.
- Retry count is controlled by `APEXBOOKS_MAX_RETRIES`.

## Benchmarks

No throughput or latency benchmark was run because this verification pass did not start a database-backed Medusa runtime.

## Risk

The in-memory metadata scans are acceptable for small catalogs but may become a bottleneck for larger Phase 2 master-data sync volumes.
