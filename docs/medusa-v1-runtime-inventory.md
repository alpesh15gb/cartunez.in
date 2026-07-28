# Medusa v1 runtime inventory

## Runtime components

| Location | Responsibility and registration | Dependencies / tables / events | Owner and risk | Test status |
| --- | --- | --- | --- | --- |
| `src/index.ts` | Constructs the Medusa v1 application and listens on configured host/port | Medusa loaders and all configured plugins | Medusa; **high** until live startup passes | CI runtime job |
| `src/api/routes/health/index.ts` | Public liveness and dependency readiness routes discovered by the Medusa route loader | `manager` (`SELECT 1`), `redisClient` (`PING`) | Medusa operations; low data risk | Static safety test; live CI readiness |
| `src/api/routes/apexbooks/index.ts` | ApexBooks health, signed inbound webhooks, queue listing/replay/process | ApexBooks service, outbound-event and mapping tables | ApexBooks boundary; **high** because mutations and replay must be admin/webhook protected | Existing static suite; live external calls disabled in CI |
| `src/api/routes/integrations/{index,ui}.ts` | Authenticated integration-center UI and connection management | Medusa admin auth, integration tables, encryption key | ApexBooks/integration administration; high | Static integration-center tests |
| `src/services/apexbooks-integration.ts` | Inbound synchronization, outbound queue, signing, retry/idempotency | Core product/customer/order/payment/return services; ApexBooks tables; HTTPS API | ApexBooks boundary; **high**. Disabled mode makes no outbound request; enabled mode now requires explicit config | Static suite and CI disabled-startup check |
| `src/services/apexbooks-event-builder.ts` | Maps Medusa v1 commerce events to the versioned ApexBooks contract | No database; event payloads | ApexBooks boundary; medium | Static contract tests |
| `src/services/integration-service.ts` | Stores encrypted integration credentials/config and event logs | `integration_apps`, `integration_connections`, `integration_event_logs`; AES-GCM | ApexBooks/integration administration; **high** secret-handling risk | Static suite |
| `src/subscribers/apexbooks-*.ts` | Native subscriber discovery for customer/order/payment/refund/return events | Events: `customer.created`, `order.placed`, `order.updated`, `order.canceled`, `payment.captured`, `refund.created`, `return.requested` | ApexBooks boundary; medium when disabled, high when enabled | Static event catalog tests |
| `src/models/apexbooks-*.ts` | TypeORM queue and entity mapping metadata | `apexbooks_outbound_event`, `apexbooks_entity_mapping` | ApexBooks boundary; medium | Migration/static tests |
| `src/models/integration-*.ts` | Integration catalog, encrypted connection, and event-log metadata | Integration tables | ApexBooks boundary; medium | Migration/static tests |
| `src/api/routes/vehicle/index.ts` | Legacy compatibility read/write routes | Vehicle compatibility service and legacy vehicle tables | **FastAPI target owner**; high architectural duplication. Retained read-compatible only pending approved migration | No live coverage yet |
| `src/services/vehicle-compatibility.ts` | Reads/replaces product-to-vehicle mappings and lookup by year/variant | `product_vehicle_compatibility`, legacy vehicle tables | **FastAPI target owner**; high because replace operation deletes then inserts | No live coverage yet |
| `src/models/vehicle.ts`, `product-extension.ts` | Legacy automotive and product-extension metadata | Five legacy vehicle/compatibility tables plus product metadata | **FastAPI target owner**; migration deferred | Migration/static inspection only |
| `src/subscribers/order-subscriber.ts` | Placeholder class for confirmation, automotive analytics and warranty logging | Core order service; no exported subscriber config | Not currently a valid native subscriber registration; medium dead-code risk. Do not rely on it for email/inventory | None; deferred cleanup |
| `medusa-config.js` local file plugin | Serves local uploads using `MEDUSA_PUBLIC_URL` | Writable `uploads/` | Medusa files; unsuitable for multi-instance production without shared storage | Seed/CI image URL smoke |
| `medusa-config.js` Meilisearch plugin | Indexes product title/description/handle/thumbnail/category | Meilisearch 1.7 and API key | Medusa search; medium. CI supplies isolated service | Startup verification in CI |
| Manual payment and fulfillment plugins | Test/development cart prerequisites | Core provider tables | Medusa; not evidence of captured funds or production fulfillment | Live CI cart/order test |
| `@medusajs/admin` plugin | Builds and serves Medusa Admin | Admin bundle and Medusa admin auth | Medusa administration; high until public-registry build passes | CI build/start |

No custom scheduled-job directory or custom repository directory exists. No notification provider
is configured. Search, local files, manual payment, and manual fulfillment are configuration-based
plugins rather than locally implemented providers.

## ApexBooks isolation

CI always sets `APEXBOOKS_ENABLED=false`; subscribers may resolve the service, but outbound event
delivery returns before making a request. If enabled, startup now rejects a missing base URL, API
key, or tenant ID. Public configuration responses redact the API key and webhook secret. CI does
not supply production ApexBooks credentials and must not contact ApexBooks.

## Responsibility decisions

- Commerce entities and workflows stay in Medusa.
- ApexBooks mapping, queue, and delivery stay behind the ApexBooks boundary.
- Vehicle entities/routes/services are explicitly legacy and must move to FastAPI only through the
  separately approved additive reconciliation plan. No table is removed in this phase.
- `order-subscriber.ts` must be either converted to a valid native subscriber with real providers
  and tests or removed in a later focused cleanup; placeholder logging is not production behavior.

