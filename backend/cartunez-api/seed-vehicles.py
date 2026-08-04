"""Seed a comprehensive Indian passenger-vehicle catalog.

Seeds make -> model -> year -> variant into BOTH catalogs that share the
single Postgres database:

  * FastAPI tables  : vehicle_makes / vehicle_models / vehicle_years / vehicle_variants
  * Medusa tables   : vehicle_make  / vehicle_model  / vehicle_year  / vehicle_variant

Every row gets a deterministic UUID (uuid5 of its slug path), so the two
catalogs reference identical IDs. That is what lets the Medusa
product_vehicle_compatibility table (which links products to *variant* IDs)
line up with FastAPI's make/model/year resolution on the storefront.

Idempotent: existing rows are matched by slug/name and left untouched; new
rows are inserted. Safe to re-run after the catalog grows.

Usage:
    cd backend/cartunez-api
    python seed-vehicles.py
"""

import asyncio
import uuid

from sqlalchemy import text

from app.database import engine

NS = uuid.NAMESPACE_DNS


def u(slug_path: str) -> uuid.UUID:
    return uuid.uuid5(NS, f"cartunez:{slug_path}")


def slugify(name: str) -> str:
    return name.lower().replace(" ", "-").replace("'", "").replace("/", "-").replace("(", "").replace(")", "")


# ────────────────────────────────────────────────────────────────────────────
# Catalog: make -> [(model, body_type, start_year, end_year)]
# end_year is inclusive; expanded to one vehicle_years row per year.
# ────────────────────────────────────────────────────────────────────────────

CATALOG: dict[str, list[tuple[str, str, int, int]]] = {
    "Maruti Suzuki": [
        ("Alto 800", "hatchback", 2012, 2025),
        ("Alto K10", "hatchback", 2010, 2025),
        ("Alto", "hatchback", 2000, 2014),
        ("Wagon R", "hatchback", 2000, 2026),
        ("Swift", "hatchback", 2005, 2026),
        ("Dzire", "sedan", 2008, 2026),
        ("Baleno", "hatchback", 2015, 2026),
        ("Celerio", "hatchback", 2014, 2025),
        ("Ignis", "hatchback", 2017, 2026),
        ("S-Presso", "hatchback", 2019, 2026),
        ("Ciaz", "sedan", 2014, 2026),
        ("Ertiga", "mpv", 2012, 2026),
        ("XL6", "mpv", 2019, 2026),
        ("Eeco", "mpv", 2010, 2026),
        ("Brezza", "suv", 2016, 2026),
        ("Grand Vitara", "suv", 2022, 2026),
        ("Fronx", "suv", 2023, 2026),
        ("Jimny", "suv", 2023, 2026),
        ("Gypsy", "suv", 1985, 2019),
        ("Omni", "mpv", 1984, 2019),
        ("800", "hatchback", 1983, 2014),
        ("Estilo", "hatchback", 2003, 2013),
        ("Ritz", "hatchback", 2009, 2016),
        ("SX4", "sedan", 2007, 2014),
        ("Kizashi", "sedan", 2011, 2013),
    ],
    "Hyundai": [
        ("Santro", "hatchback", 1998, 2014),
        ("Santro Xing", "hatchback", 2018, 2022),
        ("i10", "hatchback", 2007, 2020),
        ("Grand i10", "hatchback", 2013, 2024),
        ("Grand i10 Nios", "hatchback", 2019, 2026),
        ("i20", "hatchback", 2008, 2026),
        ("Aura", "sedan", 2020, 2026),
        ("Accent", "sedan", 1999, 2010),
        ("Verna", "sedan", 2006, 2026),
        ("Elantra", "sedan", 2009, 2025),
        ("Sonata", "sedan", 2005, 2015),
        ("Creta", "suv", 2015, 2026),
        ("Venue", "suv", 2019, 2026),
        ("Tucson", "suv", 2008, 2026),
        ("Alcazar", "suv", 2021, 2026),
        ("Exter", "suv", 2023, 2026),
        ("Kona Electric", "suv", 2019, 2023),
        ("Ioniq 5", "suv", 2022, 2026),
        ("Getz", "hatchback", 2004, 2011),
        ("Xcent", "sedan", 2014, 2020),
        ("Santa Fe", "suv", 2005, 2010),
        ("Terracan", "suv", 2005, 2009),
    ],
    "Tata": [
        ("Indica", "hatchback", 1998, 2018),
        ("Indigo", "sedan", 2002, 2016),
        ("Vista", "hatchback", 2008, 2015),
        ("Manza", "sedan", 2009, 2016),
        ("Nano", "hatchback", 2009, 2018),
        ("Tiago", "hatchback", 2016, 2026),
        ("Tigor", "sedan", 2017, 2024),
        ("Altroz", "hatchback", 2020, 2026),
        ("Nexon", "suv", 2017, 2026),
        ("Nexon EV", "suv", 2020, 2026),
        ("Punch", "suv", 2021, 2026),
        ("Punch EV", "suv", 2024, 2026),
        ("Harrier", "suv", 2019, 2026),
        ("Safari", "suv", 2021, 2026),
        ("Safari Storme", "suv", 2012, 2020),
        ("Hexa", "suv", 2016, 2020),
        ("Curvv", "suv", 2024, 2026),
        ("Sumo", "suv", 1994, 2019),
        ("Sierra", "suv", 1991, 2003),
        ("Tiago EV", "hatchback", 2023, 2026),
    ],
    "Mahindra": [
        ("Bolero", "suv", 2000, 2026),
        ("Scorpio", "suv", 2002, 2022),
        ("Scorpio-N", "suv", 2022, 2026),
        ("Thar", "suv", 2010, 2026),
        ("XUV500", "suv", 2011, 2023),
        ("XUV300", "suv", 2019, 2023),
        ("XUV3XO", "suv", 2024, 2026),
        ("XUV700", "suv", 2021, 2026),
        ("XUV400", "suv", 2023, 2026),
        ("KUV100", "suv", 2016, 2022),
        ("TUV300", "suv", 2015, 2020),
        ("Marazzo", "mpv", 2018, 2022),
        ("Xylo", "mpv", 2009, 2019),
        ("Verito", "sedan", 2011, 2017),
        ("Alturas G4", "suv", 2018, 2021),
        ("BE 6e", "suv", 2025, 2026),
        ("XEV 9e", "suv", 2025, 2026),
        ("e2o", "hatchback", 2013, 2018),
    ],
    "Kia": [
        ("Seltos", "suv", 2019, 2026),
        ("Sonet", "suv", 2020, 2026),
        ("Carens", "mpv", 2022, 2026),
        ("Carnival", "mpv", 2020, 2026),
        ("EV6", "suv", 2022, 2026),
        ("EV9", "suv", 2024, 2026),
        ("Syros", "suv", 2025, 2026),
    ],
    "Toyota": [
        ("Qualis", "mpv", 1998, 2006),
        ("Innova", "mpv", 2005, 2016),
        ("Innova Crysta", "mpv", 2016, 2026),
        ("Innova Hycross", "mpv", 2022, 2026),
        ("Fortuner", "suv", 2009, 2026),
        ("Camry", "sedan", 2003, 2026),
        ("Corolla Altis", "sedan", 2003, 2019),
        ("Etios", "sedan", 2010, 2018),
        ("Etios Liva", "hatchback", 2011, 2018),
        ("Yaris", "sedan", 2018, 2020),
        ("Glanza", "hatchback", 2019, 2026),
        ("Urban Cruiser", "suv", 2020, 2022),
        ("Urban Cruiser Hyryder", "suv", 2022, 2026),
        ("Rumion", "mpv", 2021, 2026),
        ("Hilux", "pickup", 2021, 2026),
        ("Vellfire", "mpv", 2019, 2026),
        ("Land Cruiser", "suv", 2005, 2019),
        ("Prius", "sedan", 2010, 2015),
    ],
    "Honda": [
        ("City", "sedan", 1998, 2026),
        ("Amaze", "sedan", 2013, 2026),
        ("Civic", "sedan", 2006, 2020),
        ("Accord", "sedan", 2003, 2017),
        ("Jazz", "hatchback", 2009, 2022),
        ("Brio", "hatchback", 2011, 2018),
        ("WR-V", "suv", 2017, 2023),
        ("BR-V", "suv", 2016, 2019),
        ("CR-V", "suv", 2005, 2024),
        ("Elevate", "suv", 2023, 2026),
        ("Mobilio", "mpv", 2014, 2017),
        ("City e:HEV", "sedan", 2020, 2026),
    ],
    "MG": [
        ("Hector", "suv", 2019, 2026),
        ("Hector Plus", "suv", 2020, 2026),
        ("Astor", "suv", 2021, 2026),
        ("Gloster", "suv", 2020, 2026),
        ("ZS EV", "suv", 2022, 2026),
        ("Comet EV", "hatchback", 2023, 2026),
        ("Windsor EV", "suv", 2024, 2026),
    ],
    "Volkswagen": [
        ("Polo", "hatchback", 2010, 2021),
        ("Vento", "sedan", 2010, 2022),
        ("Ameo", "sedan", 2016, 2021),
        ("Taigun", "suv", 2021, 2026),
        ("Virtus", "sedan", 2022, 2026),
        ("Tiguan", "suv", 2017, 2024),
        ("Passat", "sedan", 2009, 2022),
        ("Jetta", "sedan", 2009, 2018),
        ("Beetle", "hatchback", 2008, 2016),
        ("Touareg", "suv", 2005, 2011),
    ],
    "Skoda": [
        ("Octavia", "sedan", 2002, 2026),
        ("Laura", "sedan", 2005, 2014),
        ("Superb", "sedan", 2005, 2026),
        ("Rapid", "sedan", 2011, 2021),
        ("Fabia", "hatchback", 2011, 2014),
        ("Yeti", "suv", 2012, 2020),
        ("Kushaq", "suv", 2021, 2026),
        ("Slavia", "sedan", 2022, 2026),
        ("Kodiaq", "suv", 2017, 2026),
        ("Karoq", "suv", 2020, 2026),
    ],
    "Renault": [
        ("Duster", "suv", 2012, 2022),
        ("Kwid", "hatchback", 2015, 2026),
        ("Kiger", "suv", 2021, 2026),
        ("Triber", "mpv", 2019, 2026),
        ("Lodgy", "mpv", 2015, 2018),
        ("Captur", "suv", 2017, 2020),
        ("Scala", "sedan", 2018, 2020),
        ("Pulse", "hatchback", 2012, 2015),
        ("Fluence", "sedan", 2012, 2015),
        ("Koleos", "suv", 2012, 2018),
    ],
    "Nissan": [
        ("Micra", "hatchback", 2010, 2020),
        ("Sunny", "sedan", 2011, 2020),
        ("Terrano", "suv", 2013, 2018),
        ("Kicks", "suv", 2019, 2023),
        ("Magnite", "suv", 2020, 2026),
        ("Go", "hatchback", 2014, 2017),
        ("Go+", "mpv", 2015, 2017),
        ("X-Trail", "suv", 2005, 2010),
        ("Teana", "sedan", 2005, 2010),
    ],
    "Ford": [
        ("Figo", "hatchback", 2010, 2019),
        ("Aspire", "sedan", 2015, 2019),
        ("Fiesta", "sedan", 2005, 2015),
        ("Focus", "sedan", 2007, 2015),
        ("EcoSport", "suv", 2013, 2022),
        ("Endeavour", "suv", 2005, 2022),
        ("Mustang", "coupe", 2016, 2022),
        ("Freestyle", "hatchback", 2018, 2020),
        ("Ikon", "sedan", 1999, 2010),
        ("Fusion", "sedan", 2005, 2010),
        ("Classic", "sedan", 2008, 2013),
        ("Mondeo", "sedan", 2002, 2013),
        ("Escort", "sedan", 1994, 2005),
    ],
    "Fiat": [
        ("Punto", "hatchback", 2009, 2018),
        ("Grande Punto", "hatchback", 2009, 2016),
        ("Linea", "sedan", 2009, 2018),
        ("500", "hatchback", 2009, 2014),
        ("Abarth Punto", "hatchback", 2013, 2018),
        ("Abarth 595", "hatchback", 2015, 2017),
        ("Avventura", "hatchback", 2015, 2018),
        ("Palio", "hatchback", 2001, 2010),
        ("Uno", "hatchback", 1998, 2006),
    ],
    "Chevrolet": [
        ("Spark", "hatchback", 2007, 2014),
        ("Beat", "hatchback", 2010, 2019),
        ("Sail", "sedan", 2013, 2017),
        ("Sail U-VA", "hatchback", 2013, 2017),
        ("Cruze", "sedan", 2009, 2017),
        ("Aveo", "sedan", 2006, 2010),
        ("Aveo U-VA", "hatchback", 2007, 2010),
        ("Captiva", "suv", 2007, 2016),
        ("Tavera", "mpv", 2004, 2016),
        ("Enjoy", "mpv", 2013, 2015),
        ("Optra", "sedan", 2003, 2010),
    ],
    "Datsun": [
        ("Go", "hatchback", 2014, 2020),
        ("Go+", "mpv", 2014, 2020),
        ("Redi-Go", "hatchback", 2016, 2020),
    ],
    "Citroen": [
        ("C3", "hatchback", 2022, 2026),
        ("C3 Aircross", "suv", 2023, 2026),
        ("C5 Aircross", "suv", 2020, 2026),
        ("e-C3", "hatchback", 2024, 2026),
    ],
    "Jeep": [
        ("Compass", "suv", 2017, 2026),
        ("Wrangler", "suv", 2019, 2026),
        ("Grand Cherokee", "suv", 2005, 2026),
        ("Meridian", "suv", 2022, 2026),
    ],
    "BMW": [
        ("2 Series", "coupe", 2015, 2026),
        ("3 Series", "sedan", 2005, 2026),
        ("5 Series", "sedan", 2005, 2026),
        ("7 Series", "sedan", 2005, 2026),
        ("X1", "suv", 2016, 2026),
        ("X3", "suv", 2005, 2026),
        ("X4", "suv", 2018, 2026),
        ("X5", "suv", 2005, 2026),
        ("X6", "suv", 2015, 2026),
        ("X7", "suv", 2019, 2026),
        ("Z4", "coupe", 2015, 2026),
        ("i4", "sedan", 2022, 2026),
        ("iX", "suv", 2022, 2026),
        ("i7", "sedan", 2023, 2026),
        ("6 Series GT", "sedan", 2018, 2026),
        ("M4", "coupe", 2021, 2026),
    ],
    "Mercedes-Benz": [
        ("A-Class", "hatchback", 2014, 2022),
        ("C-Class", "sedan", 2004, 2026),
        ("E-Class", "sedan", 2004, 2026),
        ("S-Class", "sedan", 2004, 2026),
        ("GLA", "suv", 2014, 2026),
        ("GLB", "suv", 2021, 2026),
        ("GLC", "suv", 2015, 2026),
        ("GLE", "suv", 2015, 2026),
        ("GLS", "suv", 2016, 2026),
        ("G-Class", "suv", 2005, 2026),
        ("CLA", "sedan", 2015, 2026),
        ("EQB", "suv", 2022, 2026),
        ("EQE", "sedan", 2023, 2026),
        ("EQS", "sedan", 2022, 2026),
        ("V-Class", "mpv", 2017, 2026),
        ("ML-Class", "suv", 2005, 2015),
        ("GL-Class", "suv", 2007, 2015),
    ],
    "Audi": [
        ("A3", "sedan", 2010, 2026),
        ("A4", "sedan", 2005, 2026),
        ("A6", "sedan", 2005, 2026),
        ("A8", "sedan", 2005, 2026),
        ("Q2", "suv", 2018, 2026),
        ("Q3", "suv", 2012, 2026),
        ("Q5", "suv", 2009, 2026),
        ("Q7", "suv", 2007, 2026),
        ("Q8", "suv", 2021, 2026),
        ("TT", "coupe", 2005, 2016),
        ("e-tron", "suv", 2020, 2026),
        ("RS5", "coupe", 2018, 2026),
    ],
    "Volvo": [
        ("S60", "sedan", 2010, 2020),
        ("S90", "sedan", 2017, 2026),
        ("V40", "hatchback", 2015, 2017),
        ("XC40", "suv", 2019, 2026),
        ("XC60", "suv", 2008, 2026),
        ("XC90", "suv", 2005, 2026),
        ("EX90", "suv", 2025, 2026),
    ],
    "Land Rover": [
        ("Range Rover", "suv", 2004, 2026),
        ("Range Rover Sport", "suv", 2006, 2026),
        ("Discovery", "suv", 2005, 2026),
        ("Discovery Sport", "suv", 2015, 2026),
        ("Freelander", "suv", 2006, 2015),
        ("Evoque", "suv", 2012, 2026),
        ("Defender", "suv", 2020, 2026),
        ("Velar", "suv", 2018, 2026),
    ],
    "Jaguar": [
        ("XF", "sedan", 2009, 2026),
        ("XJ", "sedan", 2009, 2019),
        ("XE", "sedan", 2015, 2026),
        ("F-PACE", "suv", 2016, 2026),
        ("E-PACE", "suv", 2018, 2026),
        ("I-PACE", "suv", 2018, 2026),
        ("F-TYPE", "coupe", 2013, 2026),
    ],
    "Porsche": [
        ("911", "coupe", 2015, 2026),
        ("Cayenne", "suv", 2005, 2026),
        ("Macan", "suv", 2016, 2026),
        ("Panamera", "sedan", 2015, 2026),
        ("Taycan", "sedan", 2021, 2026),
        ("Boxster", "coupe", 2015, 2026),
        ("Cayman", "coupe", 2015, 2026),
    ],
    "Lexus": [
        ("ES", "sedan", 2018, 2026),
        ("NX", "suv", 2022, 2026),
        ("RX", "suv", 2022, 2026),
        ("LM", "mpv", 2023, 2026),
        ("LX", "suv", 2017, 2026),
    ],
    "BYD": [
        ("Atto 3", "suv", 2022, 2026),
        ("Seal", "sedan", 2024, 2026),
        ("Seal U", "suv", 2024, 2026),
        ("Sealion 6", "suv", 2024, 2026),
        ("e6", "mpv", 2023, 2026),
        ("Dolphin", "hatchback", 2025, 2026),
    ],
    "Force Motors": [
        ("Gurkha", "suv", 2013, 2026),
        ("Trax", "suv", 2004, 2018),
    ],
    "Isuzu": [
        ("D-Max", "pickup", 2016, 2022),
        ("V-Cross", "pickup", 2016, 2022),
        ("MU-7", "suv", 2012, 2016),
    ],
    "Premier": [
        ("Padmini", "sedan", 1988, 2001),
        ("RiO", "hatchback", 2011, 2014),
    ],
    "Hindustan Motors": [
        ("Ambassador", "sedan", 1958, 2014),
        ("Contessa", "sedan", 1984, 2002),
    ],
}

# One variant per year per transmission type (accessory fitment rarely depends
# on trim granularity; this keeps the variant table lean for link generation).
VARIANT_TRIMS = [
    ("MT", "Manual", "Petrol"),
    ("AT", "Automatic", "Petrol"),
]


# ────────────────────────────────────────────────────────────────────────────
# Seeding
# ────────────────────────────────────────────────────────────────────────────

async def _insert(conn, table: str, cols: list[str], row: list) -> None:
    placeholders = ", ".join(f":{c}" for c in cols)
    sql = (
        f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({placeholders}) "
        "ON CONFLICT DO NOTHING"
    )
    await conn.execute(text(sql), dict(zip(cols, row)))


async def seed_vehicles() -> None:
    total_makes = total_models = total_years = total_variants = 0

    # created_at/updated_at are intentionally omitted: both the FastAPI and
    # Medusa table families define DB server defaults (func.now() /
    # @CreateDateColumn), and passing "NOW()" as a bound parameter would
    # fail (it must be a SQL expression, not a string literal).

    async with engine.connect() as conn:
        for make_name, models in CATALOG.items():
            make_slug = slugify(make_name)
            make_id = u(f"make:{make_slug}")

            # FastAPI schema
            await _insert(conn, "vehicle_makes",
                          ["id", "name", "slug"],
                          [str(make_id), make_name, make_slug])
            # Medusa schema
            await _insert(conn, "vehicle_make",
                          ["id", "name", "country", "is_active"],
                          [str(make_id), make_name, "India", True])
            total_makes += 1

            for model_name, body_type, start_year, end_year in models:
                model_slug = slugify(model_name)
                model_id = u(f"model:{make_slug}:{model_slug}")

                await _insert(conn, "vehicle_models",
                              ["id", "make_id", "name", "slug", "body_type"],
                              [str(model_id), str(make_id), model_name, model_slug, body_type])
                await _insert(conn, "vehicle_model",
                              ["id", "make_id", "name", "body_type", "is_active"],
                              [str(model_id), str(make_id), model_name, body_type, True])
                total_models += 1

                for year_val in range(start_year, min(end_year, 2026) + 1):
                    year_id = u(f"year:{make_slug}:{model_slug}:{year_val}")

                    await _insert(conn, "vehicle_years",
                                  ["id", "model_id", "year"],
                                  [str(year_id), str(model_id), year_val])
                    await _insert(conn, "vehicle_year",
                                  ["id", "model_id", "year", "is_active"],
                                  [str(year_id), str(model_id), year_val, True])
                    total_years += 1

                    for trim_name, trans, fuel in VARIANT_TRIMS:
                        variant_slug = slugify(trim_name)
                        variant_id = u(f"variant:{make_slug}:{model_slug}:{year_val}:{variant_slug}")
                        variant_name = f"{model_name} {trim_name}"

                        await _insert(conn, "vehicle_variants",
                                      ["id", "vehicle_year_id", "name", "engine", "transmission", "fuel_type"],
                                      [str(variant_id), str(year_id), variant_name, None, trans, fuel])
                        await _insert(conn, "vehicle_variant",
                                      ["id", "year_id", "name", "engine_type", "transmission", "fuel_type", "is_active"],
                                      [str(variant_id), str(year_id), variant_name, None, trans, fuel, True])
                        total_variants += 1

        await conn.commit()

    print(f"Seeding complete: {total_makes} makes, {total_models} models, "
          f"{total_years} years, {total_variants} variants "
          f"(both FastAPI + Medusa schemas, deterministic UUIDs)")


if __name__ == "__main__":
    asyncio.run(seed_vehicles())
