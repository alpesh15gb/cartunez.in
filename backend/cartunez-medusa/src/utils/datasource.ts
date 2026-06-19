import { DataSource, DataSourceOptions } from "typeorm";
import {
  VehicleMake,
  VehicleModel,
  VehicleYear,
  VehicleVariant,
  ProductVehicleCompatibility,
} from "../models/vehicle";

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
  ],
  migrations: ["src/migrations/**/*.ts"],
  synchronize: false,
};

const AppDataSource = new DataSource(dataSourceOptions);

export default AppDataSource;
