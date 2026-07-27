# Medusa v1 custom migration safety report

This report classifies repository-owned migrations. Medusa core migrations are supplied by
Medusa 1.20.4 and must be inspected through `npx medusa migrations run/show` in the disposable CI
database. No shared or production migration was executed while preparing this report.

| Migration | Forward tables and changes | Classification / data risk | Down support |
| --- | --- | --- | --- |
| `1718000000000-CreateVehicleTables` | Creates `vehicle_make`, `vehicle_model`, `vehicle_year`, `vehicle_variant`, `product_vehicle_compatibility`; adds FK constraints and lookup indexes | Additive forward migration; medium collision risk if legacy tables already exist. Automotive ownership is deferred to FastAPI | Down drops all five tables and is destructive; never run on shared data without backup and explicit approval |
| `1720000000000-CreateApexBooksTables` | Creates `apexbooks_outbound_event`, `apexbooks_entity_mapping` and queue/resource/mapping indexes | Additive; low initial data risk, later tables contain integration state | Down drops both tables and queued/mapped state; destructive |
| `1722000000000-CreateIntegrationTables` | Creates `integration_apps`, `integration_connections`, `integration_event_logs`, indexes, and inserts ApexBooks app definition | Additive plus deterministic catalog seed; encrypted credentials may exist after use | Down drops all three tables and credentials/logs; destructive |

## Safe execution policy

1. `npm run migrations:show` is the read-only first action.
2. CI runs only against database `cartunez_ci` with `CONFIRM_DISPOSABLE_DATABASE=yes`.
3. Custom forward migrations are followed by a second status inspection to demonstrate no pending
   repository migration. Core and custom migration mechanisms remain explicit.
4. No `migration:revert`, drop, reset, truncate, or TypeORM synchronization command is exposed by
   package scripts. `synchronize` is `false` in `src/utils/datasource.ts`.
5. Shared/staging application requires a verified backup, reviewed status output, and an explicit
   deployment approval before forward migration. Production rollback favors application rollback;
   destructive `down` methods are not an automatic rollback mechanism.

## Verification status

The workflow in `.github/workflows/commerce-verification.yml` is prepared to record applied and
pending status before and after migrations. It intentionally requires a reviewed backend
`package-lock.json`; until standard-registry CI generates and the team commits that lockfile, the
runtime job must remain red rather than install an unreviewed dependency graph.

