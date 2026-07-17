import { DataSource, DataSourceOptions } from "typeorm";
import {
  VehicleMake,
  VehicleModel,
  VehicleYear,
  VehicleVariant,
  ProductVehicleCompatibility,
} from "../models/vehicle";
import { ApexBooksOutboundEvent } from "../models/apexbooks-outbound-event";
import { ApexBooksEntityMapping } from "../models/apexbooks-entity-mapping";
import { IntegrationApp } from "../models/integration-app";
import { IntegrationConnection } from "../models/integration-connection";
import { IntegrationEventLog } from "../models/integration-event-log";

const databaseUrl =
  process.env.DATABASE_URL || "postgresql://localhost:5432/cartunez_medusa";

export const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  url: databaseUrl,
  entities: [
    VehicleMake,
    VehicleModel,
    VehicleYear,
    VehicleVariant,
    ProductVehicleCompatibility,
    ApexBooksOutboundEvent,
    ApexBooksEntityMapping,
    IntegrationApp,
    IntegrationConnection,
    IntegrationEventLog,
  ],
  migrations: ["src/migrations/**/*.ts"],
  synchronize: false,
};

const AppDataSource = new DataSource(dataSourceOptions);

export default AppDataSource;
