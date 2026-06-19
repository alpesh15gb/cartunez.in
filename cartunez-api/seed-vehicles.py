"""Seed Indian car makes, models, years, and variants into the FastAPI database."""

import asyncio
import uuid
from sqlalchemy import select
from app.database import async_session_factory
from app.models.vehicle import VehicleMake, VehicleModel, VehicleYear, VehicleVariant

# Indian car market data — top selling brands with popular models
VEHICLES = {
    "Maruti Suzuki": {
        "models": {
            "Swift": {"body_type": "hatchback", "years": [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]},
            "Baleno": {"body_type": "hatchback", "years": [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]},
            "Wagon R": {"body_type": "hatchback", "years": [2019, 2020, 2021, 2022, 2023, 2024, 2025]},
            "Brezza": {"body_type": "suv", "years": [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]},
            "Ertiga": {"body_type": "mpv", "years": [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]},
            "Grand Vitara": {"body_type": "suv", "years": [2022, 2023, 2024, 2025, 2026]},
            "Fronx": {"body_type": "suv", "years": [2023, 2024, 2025, 2026]},
        }
    },
    "Hyundai": {
        "models": {
            "Creta": {"body_type": "suv", "years": [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]},
            "i20": {"body_type": "hatchback", "years": [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]},
            "Venue": {"body_type": "suv", "years": [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]},
            "Verna": {"body_type": "sedan", "years": [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]},
            "Tucson": {"body_type": "suv", "years": [2020, 2021, 2022, 2023, 2024, 2025]},
            "Alcazar": {"body_type": "suv", "years": [2021, 2022, 2023, 2024, 2025, 2026]},
            "Exter": {"body_type": "suv", "years": [2023, 2024, 2025, 2026]},
        }
    },
    "Tata": {
        "models": {
            "Nexon": {"body_type": "suv", "years": [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]},
            "Punch": {"body_type": "suv", "years": [2021, 2022, 2023, 2024, 2025, 2026]},
            "Harrier": {"body_type": "suv", "years": [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]},
            "Safari": {"body_type": "suv", "years": [2021, 2022, 2023, 2024, 2025, 2026]},
            "Altroz": {"body_type": "hatchback", "years": [2020, 2021, 2022, 2023, 2024, 2025]},
            "Tiago": {"body_type": "hatchback", "years": [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]},
            "Tigor": {"body_type": "sedan", "years": [2018, 2019, 2020, 2021, 2022, 2023, 2024]},
        }
    },
    "Mahindra": {
        "models": {
            "Thar": {"body_type": "suv", "years": [2020, 2021, 2022, 2023, 2024, 2025, 2026]},
            "XUV700": {"body_type": "suv", "years": [2021, 2022, 2023, 2024, 2025, 2026]},
            "Scorpio-N": {"body_type": "suv", "years": [2022, 2023, 2024, 2025, 2026]},
            "XUV400": {"body_type": "suv", "years": [2023, 2024, 2025, 2026]},
            "Bolero": {"body_type": "suv", "years": [2018, 2019, 2020, 2021, 2022, 2023, 2024]},
            "XUV300": {"body_type": "suv", "years": [2019, 2020, 2021, 2022, 2023]},
        }
    },
    "Kia": {
        "models": {
            "Seltos": {"body_type": "suv", "years": [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]},
            "Sonet": {"body_type": "suv", "years": [2020, 2021, 2022, 2023, 2024, 2025, 2026]},
            "Carens": {"body_type": "mpv", "years": [2022, 2023, 2024, 2025, 2026]},
            "EV6": {"body_type": "suv", "years": [2022, 2023, 2024, 2025]},
        }
    },
    "Toyota": {
        "models": {
            "Innova Crysta": {"body_type": "mpv", "years": [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]},
            "Fortuner": {"body_type": "suv", "years": [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]},
            "Glanza": {"body_type": "hatchback", "years": [2019, 2020, 2021, 2022, 2023, 2024, 2025]},
            "Urban Cruiser Hyryder": {"body_type": "suv", "years": [2022, 2023, 2024, 2025, 2026]},
            "Camry": {"body_type": "sedan", "years": [2019, 2020, 2021, 2022, 2023, 2024, 2025]},
        }
    },
    "Honda": {
        "models": {
            "City": {"body_type": "sedan", "years": [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]},
            "Amaze": {"body_type": "sedan", "years": [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]},
            "Elevate": {"body_type": "suv", "years": [2023, 2024, 2025, 2026]},
            "WR-V": {"body_type": "suv", "years": [2018, 2019, 2020, 2021, 2022, 2023]},
        }
    },
    "MG": {
        "models": {
            "Hector": {"body_type": "suv", "years": [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]},
            "Astor": {"body_type": "suv", "years": [2021, 2022, 2023, 2024, 2025]},
            "Gloster": {"body_type": "suv", "years": [2020, 2021, 2022, 2023, 2024, 2025]},
            "ZS EV": {"body_type": "suv", "years": [2022, 2023, 2024, 2025]},
        }
    },
    "Volkswagen": {
        "models": {
            "Taigun": {"body_type": "suv", "years": [2021, 2022, 2023, 2024, 2025, 2026]},
            "Virtus": {"body_type": "sedan", "years": [2022, 2023, 2024, 2025, 2026]},
            "Tiguan": {"body_type": "suv", "years": [2020, 2021, 2022, 2023, 2024]},
        }
    },
    "Skoda": {
        "models": {
            "Kushaq": {"body_type": "suv", "years": [2021, 2022, 2023, 2024, 2025, 2026]},
            "Slavia": {"body_type": "sedan", "years": [2022, 2023, 2024, 2025, 2026]},
            "Kodiaq": {"body_type": "suv", "years": [2020, 2021, 2022, 2023, 2024]},
        }
    },
    "Renault": {
        "models": {
            "Kiger": {"body_type": "suv", "years": [2021, 2022, 2023, 2024, 2025]},
            "Triber": {"body_type": "mpv", "years": [2019, 2020, 2021, 2022, 2023, 2024, 2025]},
        }
    },
    "Nissan": {
        "models": {
            "Magnite": {"body_type": "suv", "years": [2021, 2022, 2023, 2024, 2025, 2026]},
            "Kicks": {"body_type": "suv", "years": [2019, 2020, 2021, 2022, 2023]},
        }
    },
    "Citroen": {
        "models": {
            "C3 Aircross": {"body_type": "suv", "years": [2023, 2024, 2025, 2026]},
            "C3": {"body_type": "hatchback", "years": [2022, 2023, 2024]},
        }
    },
}

VARIANT_TRIMS = [
    ("MT", "Manual", "Petrol"),
    ("AT", "Automatic", "Petrol"),
    ("Diesel MT", "Manual", "Diesel"),
    ("Diesel AT", "Automatic", "Diesel"),
]


def slugify(name: str) -> str:
    return name.lower().replace(" ", "-").replace("'", "")


async def seed_vehicles():
    print("Seeding vehicle data...")
    async with async_session_factory() as session:
        total_makes = total_models = total_years = total_variants = 0

        for make_name, make_data in VEHICLES.items():
            # Upsert make
            stmt = select(VehicleMake).where(VehicleMake.slug == slugify(make_name))
            result = await session.execute(stmt)
            make = result.scalar_one_or_none()
            if not make:
                make = VehicleMake(name=make_name, slug=slugify(make_name))
                session.add(make)
                await session.flush()
                total_makes += 1
                print(f"  Make: {make_name}")
            else:
                print(f"  Make exists: {make_name}")

            for model_name, model_data in make_data["models"].items():
                # Upsert model
                stmt = select(VehicleModel).where(
                    VehicleModel.make_id == make.id,
                    VehicleModel.slug == slugify(model_name),
                )
                result = await session.execute(stmt)
                model = result.scalar_one_or_none()
                if not model:
                    model = VehicleModel(
                        make_id=make.id,
                        name=model_name,
                        slug=slugify(model_name),
                        body_type=model_data["body_type"],
                    )
                    session.add(model)
                    await session.flush()
                    total_models += 1
                else:
                    continue  # skip year/variant seeding if model already exists

                for year_val in model_data["years"]:
                    year = VehicleYear(model_id=model.id, year=year_val)
                    session.add(year)
                    await session.flush()
                    total_years += 1

                    for trim_name, trans, fuel in VARIANT_TRIMS:
                        variant = VehicleVariant(
                            vehicle_year_id=year.id,
                            name=f"{model_name} {trim_name}",
                            transmission=trans,
                            fuel_type=fuel,
                        )
                        session.add(variant)
                        total_variants += 1

        await session.commit()
        print(f"\nSeeding complete: {total_makes} makes, {total_models} models, {total_years} years, {total_variants} variants")


if __name__ == "__main__":
    asyncio.run(seed_vehicles())
