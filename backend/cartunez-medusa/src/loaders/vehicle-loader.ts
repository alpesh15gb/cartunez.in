import { MedusaContainer } from "@medusajs/medusa";
import { Logger } from "@medusajs/types";
import {
  VehicleMake,
  VehicleModel,
  VehicleYear,
  VehicleVariant,
} from "../models/vehicle";

const INDIAN_MAKES: Array<{
  name: string;
  country: string;
  models: Array<{
    name: string;
    body_type: string;
    years: Array<{
      year: number;
      variants: Array<{
        name: string;
        engine_type?: string;
        fuel_type?: string;
        transmission?: string;
      }>;
    }>;
  }>;
}> = [
  {
    name: "Maruti Suzuki",
    country: "India",
    models: [
      {
        name: "Swift",
        body_type: "hatchback",
        years: [
          { year: 2024, variants: [{ name: "VXi", engine_type: "1.2L", fuel_type: "petrol", transmission: "manual" }, { name: "ZXi", engine_type: "1.2L", fuel_type: "petrol", transmission: "automatic" }, { name: "ZXi+", engine_type: "1.2L", fuel_type: "petrol", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "LXi", engine_type: "1.2L", fuel_type: "petrol", transmission: "manual" }, { name: "VXi", engine_type: "1.2L", fuel_type: "petrol", transmission: "manual" }, { name: "ZXi", engine_type: "1.2L", fuel_type: "petrol", transmission: "automatic" }] },
          { year: 2022, variants: [{ name: "LXi", engine_type: "1.2L", fuel_type: "petrol", transmission: "manual" }, { name: "VXi", engine_type: "1.2L", fuel_type: "petrol", transmission: "manual" }, { name: "ZXi", engine_type: "1.2L", fuel_type: "petrol", transmission: "automatic" }] },
        ],
      },
      {
        name: "Baleno",
        body_type: "hatchback",
        years: [
          { year: 2024, variants: [{ name: "Sigma", engine_type: "1.2L", fuel_type: "petrol", transmission: "manual" }, { name: "Delta", engine_type: "1.2L", fuel_type: "petrol", transmission: "manual" }, { name: "Zeta", engine_type: "1.2L", fuel_type: "petrol", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "Sigma", engine_type: "1.2L", fuel_type: "petrol", transmission: "manual" }, { name: "Delta", engine_type: "1.2L", fuel_type: "petrol", transmission: "manual" }] },
        ],
      },
      {
        name: "WagonR",
        body_type: "hatchback",
        years: [
          { year: 2024, variants: [{ name: "LXi", engine_type: "1.0L", fuel_type: "petrol", transmission: "manual" }, { name: "VXi", engine_type: "1.0L", fuel_type: "petrol", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "LXi", engine_type: "1.0L", fuel_type: "petrol", transmission: "manual" }, { name: "VXi", engine_type: "1.2L", fuel_type: "petrol", transmission: "manual" }] },
        ],
      },
      {
        name: "Brezza",
        body_type: "suv",
        years: [
          { year: 2024, variants: [{ name: "LXi", engine_type: "1.5L", fuel_type: "petrol", transmission: "manual" }, { name: "ZXi", engine_type: "1.5L", fuel_type: "petrol", transmission: "automatic" }, { name: "ZXi+", engine_type: "1.5L", fuel_type: "petrol", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "LXi", engine_type: "1.5L", fuel_type: "petrol", transmission: "manual" }, { name: "ZXi", engine_type: "1.5L", fuel_type: "petrol", transmission: "automatic" }] },
        ],
      },
      {
        name: "Grand Vitara",
        body_type: "suv",
        years: [
          { year: 2024, variants: [{ name: "Sigma", engine_type: "1.5L", fuel_type: "petrol", transmission: "manual" }, { name: "Delta", engine_type: "1.5L Hybrid", fuel_type: "hybrid", transmission: "automatic" }, { name: "Alpha", engine_type: "1.5L Hybrid", fuel_type: "hybrid", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "Sigma", engine_type: "1.5L", fuel_type: "petrol", transmission: "manual" }, { name: "Alpha+", engine_type: "1.5L Hybrid", fuel_type: "hybrid", transmission: "automatic" }] },
        ],
      },
    ],
  },
  {
    name: "Hyundai",
    country: "South Korea",
    models: [
      {
        name: "i20",
        body_type: "hatchback",
        years: [
          { year: 2024, variants: [{ name: "Magna", engine_type: "1.0L Turbo", fuel_type: "petrol", transmission: "manual" }, { name: "Sportz", engine_type: "1.0L Turbo", fuel_type: "petrol", transmission: "automatic" }, { name: "Asta", engine_type: "1.0L Turbo", fuel_type: "petrol", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "Era", engine_type: "1.0L", fuel_type: "petrol", transmission: "manual" }, { name: "Magna", engine_type: "1.0L Turbo", fuel_type: "petrol", transmission: "manual" }] },
        ],
      },
      {
        name: "Creta",
        body_type: "suv",
        years: [
          { year: 2024, variants: [{ name: "E", engine_type: "1.5L", fuel_type: "petrol", transmission: "manual" }, { name: "EX", engine_type: "1.5L Turbo", fuel_type: "diesel", transmission: "manual" }, { name: "S", engine_type: "1.5L Turbo", fuel_type: "diesel", transmission: "automatic" }, { name: "SX", engine_type: "1.5L Turbo", fuel_type: "diesel", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "E", engine_type: "1.5L", fuel_type: "petrol", transmission: "manual" }, { name: "S", engine_type: "1.5L", fuel_type: "petrol", transmission: "automatic" }, { name: "SX", engine_type: "1.5L", fuel_type: "petrol", transmission: "automatic" }] },
        ],
      },
      {
        name: "Venue",
        body_type: "suv",
        years: [
          { year: 2024, variants: [{ name: "E", engine_type: "1.0L Turbo", fuel_type: "petrol", transmission: "manual" }, { name: "S", engine_type: "1.0L Turbo", fuel_type: "petrol", transmission: "automatic" }, { name: "SX", engine_type: "1.0L Turbo", fuel_type: "petrol", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "E", engine_type: "1.0L", fuel_type: "petrol", transmission: "manual" }, { name: "S", engine_type: "1.0L Turbo", fuel_type: "petrol", transmission: "automatic" }] },
        ],
      },
      {
        name: "Verna",
        body_type: "sedan",
        years: [
          { year: 2024, variants: [{ name: "S", engine_type: "1.5L", fuel_type: "petrol", transmission: "manual" }, { name: "SX", engine_type: "1.5L Turbo", fuel_type: "petrol", transmission: "automatic" }, { name: "SX(O)", engine_type: "1.5L Turbo", fuel_type: "petrol", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "E", engine_type: "1.5L", fuel_type: "petrol", transmission: "manual" }, { name: "S", engine_type: "1.5L", fuel_type: "petrol", transmission: "manual" }] },
        ],
      },
    ],
  },
  {
    name: "Tata Motors",
    country: "India",
    models: [
      {
        name: "Nexon",
        body_type: "suv",
        years: [
          { year: 2024, variants: [{ name: "Smart", engine_type: "1.2L Turbo", fuel_type: "petrol", transmission: "manual" }, { name: "Pure", engine_type: "1.2L Turbo", fuel_type: "petrol", transmission: "automatic" }, { name: "Fearless", engine_type: "1.5L Diesel", fuel_type: "diesel", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "XE", engine_type: "1.2L Turbo", fuel_type: "petrol", transmission: "manual" }, { name: "XM", engine_type: "1.2L Turbo", fuel_type: "petrol", transmission: "manual" }, { name: "XZ+", engine_type: "1.5L Diesel", fuel_type: "diesel", transmission: "automatic" }] },
        ],
      },
      {
        name: "Punch",
        body_type: "micro-suv",
        years: [
          { year: 2024, variants: [{ name: "Pure", engine_type: "1.2L", fuel_type: "petrol", transmission: "manual" }, { name: "Adventure", engine_type: "1.2L", fuel_type: "petrol", transmission: "manual" }, { name: "Accomplished", engine_type: "1.2L", fuel_type: "petrol", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "Pure", engine_type: "1.2L", fuel_type: "petrol", transmission: "manual" }, { name: "Adventure", engine_type: "1.2L", fuel_type: "petrol", transmission: "automatic" }] },
        ],
      },
      {
        name: "Harrier",
        body_type: "suv",
        years: [
          { year: 2024, variants: [{ name: "Pure", engine_type: "2.0L Diesel", fuel_type: "diesel", transmission: "manual" }, { name: "Smart", engine_type: "2.0L Diesel", fuel_type: "diesel", transmission: "automatic" }, { name: "Fearless+", engine_type: "2.0L Diesel", fuel_type: "diesel", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "XE", engine_type: "2.0L Diesel", fuel_type: "diesel", transmission: "manual" }, { name: "XZ+", engine_type: "2.0L Diesel", fuel_type: "diesel", transmission: "automatic" }] },
        ],
      },
      {
        name: "Safari",
        body_type: "suv",
        years: [
          { year: 2024, variants: [{ name: "Pure", engine_type: "2.0L Diesel", fuel_type: "diesel", transmission: "manual" }, { name: "Adventure", engine_type: "2.0L Diesel", fuel_type: "diesel", transmission: "automatic" }, { name: "Accomplished+", engine_type: "2.0L Diesel", fuel_type: "diesel", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "XE", engine_type: "2.0L Diesel", fuel_type: "diesel", transmission: "manual" }, { name: "XZ+", engine_type: "2.0L Diesel", fuel_type: "diesel", transmission: "automatic" }] },
        ],
      },
      {
        name: "Nexon EV",
        body_type: "suv",
        years: [
          { year: 2024, variants: [{ name: "Smart", engine_type: "Electric", fuel_type: "electric", transmission: "automatic" }, { name: "Pure", engine_type: "Electric", fuel_type: "electric", transmission: "automatic" }, { name: "Empowered+", engine_type: "Electric", fuel_type: "electric", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "XM", engine_type: "Electric", fuel_type: "electric", transmission: "automatic" }, { name: "XZ+", engine_type: "Electric", fuel_type: "electric", transmission: "automatic" }] },
        ],
      },
    ],
  },
  {
    name: "Mahindra",
    country: "India",
    models: [
      {
        name: "Thar",
        body_type: "suv",
        years: [
          { year: 2024, variants: [{ name: "AX", engine_type: "2.0L Turbo", fuel_type: "petrol", transmission: "manual" }, { name: "LX", engine_type: "2.0L Turbo", fuel_type: "petrol", transmission: "automatic" }, { name: "LX 4WD", engine_type: "2.2L Diesel", fuel_type: "diesel", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "AX", engine_type: "2.0L Turbo", fuel_type: "petrol", transmission: "manual" }, { name: "LX", engine_type: "2.2L Diesel", fuel_type: "diesel", transmission: "automatic" }] },
        ],
      },
      {
        name: "Scorpio-N",
        body_type: "suv",
        years: [
          { year: 2024, variants: [{ name: "Z2", engine_type: "2.0L Turbo", fuel_type: "petrol", transmission: "manual" }, { name: "Z4", engine_type: "2.2L Diesel", fuel_type: "diesel", transmission: "manual" }, { name: "Z8", engine_type: "2.2L Diesel", fuel_type: "diesel", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "Z2", engine_type: "2.0L Turbo", fuel_type: "petrol", transmission: "manual" }, { name: "Z6", engine_type: "2.2L Diesel", fuel_type: "diesel", transmission: "manual" }, { name: "Z8", engine_type: "2.2L Diesel", fuel_type: "diesel", transmission: "automatic" }] },
        ],
      },
      {
        name: "XUV700",
        body_type: "suv",
        years: [
          { year: 2024, variants: [{ name: "MX", engine_type: "2.0L Turbo", fuel_type: "petrol", transmission: "manual" }, { name: "AX3", engine_type: "2.2L Diesel", fuel_type: "diesel", transmission: "manual" }, { name: "AX7", engine_type: "2.2L Diesel", fuel_type: "diesel", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "MX", engine_type: "2.0L Turbo", fuel_type: "petrol", transmission: "manual" }, { name: "AX5", engine_type: "2.2L Diesel", fuel_type: "diesel", transmission: "manual" }, { name: "AX7", engine_type: "2.2L Diesel", fuel_type: "diesel", transmission: "automatic" }] },
        ],
      },
      {
        name: "Thar Roxx",
        body_type: "suv",
        years: [
          { year: 2024, variants: [{ name: "MX1", engine_type: "2.0L Turbo", fuel_type: "petrol", transmission: "manual" }, { name: "AX3", engine_type: "2.2L Diesel", fuel_type: "diesel", transmission: "manual" }, { name: "AX7L", engine_type: "2.2L Diesel", fuel_type: "diesel", transmission: "automatic" }] },
        ],
      },
    ],
  },
  {
    name: "Toyota",
    country: "Japan",
    models: [
      {
        name: "Innova Crysta",
        body_type: "mpv",
        years: [
          { year: 2024, variants: [{ name: "GX", engine_type: "2.4L Diesel", fuel_type: "diesel", transmission: "manual" }, { name: "VX", engine_type: "2.4L Diesel", fuel_type: "diesel", transmission: "automatic" }, { name: "ZX", engine_type: "2.4L Diesel", fuel_type: "diesel", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "GX", engine_type: "2.4L Diesel", fuel_type: "diesel", transmission: "manual" }, { name: "VX", engine_type: "2.4L Diesel", fuel_type: "diesel", transmission: "automatic" }] },
        ],
      },
      {
        name: "Fortuner",
        body_type: "suv",
        years: [
          { year: 2024, variants: [{ name: "Base", engine_type: "2.8L Diesel", fuel_type: "diesel", transmission: "manual" }, { name: "Legender", engine_type: "2.8L Diesel", fuel_type: "diesel", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "Base", engine_type: "2.8L Diesel", fuel_type: "diesel", transmission: "manual" }, { name: "Legender", engine_type: "2.8L Diesel", fuel_type: "diesel", transmission: "automatic" }] },
        ],
      },
    ],
  },
  {
    name: "Kia",
    country: "South Korea",
    models: [
      {
        name: "Seltos",
        body_type: "suv",
        years: [
          { year: 2024, variants: [{ name: "HTE", engine_type: "1.5L", fuel_type: "petrol", transmission: "manual" }, { name: "HTK+", engine_type: "1.5L Turbo", fuel_type: "diesel", transmission: "manual" }, { name: "GTX+", engine_type: "1.5L Turbo", fuel_type: "diesel", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "HTE", engine_type: "1.5L", fuel_type: "petrol", transmission: "manual" }, { name: "HTK+", engine_type: "1.5L", fuel_type: "petrol", transmission: "manual" }, { name: "GTX+", engine_type: "1.5L Turbo", fuel_type: "diesel", transmission: "automatic" }] },
        ],
      },
      {
        name: "Sonet",
        body_type: "compact-suv",
        years: [
          { year: 2024, variants: [{ name: "HTE", engine_type: "1.0L Turbo", fuel_type: "petrol", transmission: "manual" }, { name: "HTK+", engine_type: "1.5L Diesel", fuel_type: "diesel", transmission: "manual" }, { name: "GTX+", engine_type: "1.0L Turbo", fuel_type: "petrol", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "HTE", engine_type: "1.0L Turbo", fuel_type: "petrol", transmission: "manual" }, { name: "HTX+", engine_type: "1.5L Diesel", fuel_type: "diesel", transmission: "automatic" }] },
        ],
      },
      {
        name: "Carens",
        body_type: "mpv",
        years: [
          { year: 2024, variants: [{ name: "Premium", engine_type: "1.5L", fuel_type: "petrol", transmission: "manual" }, { name: "Prestige", engine_type: "1.5L Diesel", fuel_type: "diesel", transmission: "manual" }, { name: "Gravity", engine_type: "1.5L Diesel", fuel_type: "diesel", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "Premium", engine_type: "1.5L", fuel_type: "petrol", transmission: "manual" }, { name: "Prestige+", engine_type: "1.5L Diesel", fuel_type: "diesel", transmission: "automatic" }] },
        ],
      },
    ],
  },
  {
    name: "Honda",
    country: "Japan",
    models: [
      {
        name: "City",
        body_type: "sedan",
        years: [
          { year: 2024, variants: [{ name: "V", engine_type: "1.5L", fuel_type: "petrol", transmission: "manual" }, { name: "VX", engine_type: "1.5L", fuel_type: "petrol", transmission: "automatic" }, { name: "ZX", engine_type: "1.5L Turbo", fuel_type: "petrol", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "V", engine_type: "1.5L", fuel_type: "petrol", transmission: "manual" }, { name: "VX", engine_type: "1.5L", fuel_type: "petrol", transmission: "automatic" }] },
        ],
      },
      {
        name: "Amaze",
        body_type: "sedan",
        years: [
          { year: 2024, variants: [{ name: "E", engine_type: "1.2L", fuel_type: "petrol", transmission: "manual" }, { name: "V", engine_type: "1.2L", fuel_type: "petrol", transmission: "manual" }, { name: "VX", engine_type: "1.2L", fuel_type: "petrol", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "E", engine_type: "1.2L", fuel_type: "petrol", transmission: "manual" }, { name: "V", engine_type: "1.2L", fuel_type: "petrol", transmission: "automatic" }] },
        ],
      },
    ],
  },
  {
    name: "MG Motor",
    country: "UK (SAIC)",
    models: [
      {
        name: "Hector",
        body_type: "suv",
        years: [
          { year: 2024, variants: [{ name: "Style", engine_type: "1.5L Turbo", fuel_type: "petrol", transmission: "manual" }, { name: "Smart", engine_type: "2.0L Diesel", fuel_type: "diesel", transmission: "manual" }, { name: "Sharp Pro", engine_type: "1.5L Turbo", fuel_type: "petrol", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "Style", engine_type: "1.5L Turbo", fuel_type: "petrol", transmission: "manual" }, { name: "Sharp", engine_type: "2.0L Diesel", fuel_type: "diesel", transmission: "automatic" }] },
        ],
      },
      {
        name: "Astor",
        body_type: "suv",
        years: [
          { year: 2024, variants: [{ name: "Style", engine_type: "1.5L", fuel_type: "petrol", transmission: "manual" }, { name: "Smart", engine_type: "1.3L Turbo", fuel_type: "petrol", transmission: "automatic" }, { name: "Sharp", engine_type: "1.3L Turbo", fuel_type: "petrol", transmission: "automatic" }] },
          { year: 2023, variants: [{ name: "Style", engine_type: "1.5L", fuel_type: "petrol", transmission: "manual" }, { name: "Sharp", engine_type: "1.3L Turbo", fuel_type: "petrol", transmission: "automatic" }] },
        ],
      },
    ],
  },
];

export default async function vehicleLoader(container: MedusaContainer): Promise<void> {
  const logger = container.resolve<Logger>("logger");
  const dataSource = container.resolve("manager");

  logger.info("Starting vehicle compatibility data initialization");

  try {
    const makeRepo = dataSource.getRepository(VehicleMake);
    const modelRepo = dataSource.getRepository(VehicleModel);
    const yearRepo = dataSource.getRepository(VehicleYear);
    const variantRepo = dataSource.getRepository(VehicleVariant);

    for (const makeData of INDIAN_MAKES) {
      const existingMake = await makeRepo.findOne({ where: { name: makeData.name } });
      let make: VehicleMake;

      if (existingMake) {
        make = existingMake;
      } else {
        make = makeRepo.create({ name: makeData.name, country: makeData.country });
        make = await makeRepo.save(make);
        logger.info(`Created vehicle make: ${make.name}`);
      }

      for (const modelData of makeData.models) {
        const existingModel = await modelRepo.findOne({
          where: { name: modelData.name, make_id: make.id },
        });
        let model: VehicleModel;

        if (existingModel) {
          model = existingModel;
        } else {
          model = modelRepo.create({
            name: modelData.name,
            make_id: make.id,
            body_type: modelData.body_type,
          });
          model = await modelRepo.save(model);
          logger.info(`Created vehicle model: ${make.name} ${model.name}`);
        }

        for (const yearData of modelData.years) {
          const existingYear = await yearRepo.findOne({
            where: { year: yearData.year, model_id: model.id },
          });
          let year: VehicleYear;

          if (existingYear) {
            year = existingYear;
          } else {
            year = yearRepo.create({ year: yearData.year, model_id: model.id });
            year = await yearRepo.save(year);
            logger.info(`Created vehicle year: ${make.name} ${model.name} ${year.year}`);
          }

          for (const variantData of yearData.variants) {
            const existingVariant = await variantRepo.findOne({
              where: { name: variantData.name, year_id: year.id },
            });

            if (!existingVariant) {
              const variant = variantRepo.create({
                name: variantData.name,
                year_id: year.id,
                engine_type: variantData.engine_type,
                fuel_type: variantData.fuel_type,
                transmission: variantData.transmission,
              });
              await variantRepo.save(variant);
            }
          }
        }
      }
    }

    logger.info("Vehicle compatibility data initialization completed successfully");
  } catch (error) {
    logger.error("Failed to initialize vehicle compatibility data:", error);
    throw error;
  }
}
