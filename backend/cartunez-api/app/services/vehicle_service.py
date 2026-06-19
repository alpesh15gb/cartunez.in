"""Vehicle service for complex vehicle lookups and compatibility checks."""

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.vehicle import VehicleMake, VehicleModel, VehicleVariant, VehicleYear


async def get_compatible_variants(
    make_name: str,
    model_name: str,
    year: int,
    db: AsyncSession,
) -> List[dict]:
    """Find compatible variants for a specific vehicle."""
    result = await db.execute(
        select(VehicleMake)
        .where(VehicleMake.name.ilike(f"%{make_name}%"))
    )
    make = result.scalar_one_or_none()
    if not make:
        return []

    result = await db.execute(
        select(VehicleModel)
        .where(
            VehicleModel.make_id == make.id,
            VehicleModel.name.ilike(f"%{model_name}%"),
        )
    )
    model = result.scalar_one_or_none()
    if not model:
        return []

    result = await db.execute(
        select(VehicleYear)
        .where(
            VehicleYear.model_id == model.id,
            VehicleYear.year == year,
        )
    )
    vehicle_year = result.scalar_one_or_none()
    if not vehicle_year:
        return []

    result = await db.execute(
        select(VehicleVariant).where(VehicleVariant.vehicle_year_id == vehicle_year.id)
    )
    variants = result.scalars().all()

    return [
        {
            "id": str(v.id),
            "name": v.name,
            "engine": v.engine,
            "transmission": v.transmission,
            "fuel_type": v.fuel_type,
        }
        for v in variants
    ]


async def get_vehicle_hierarchy(
    make_id: UUID,
    db: AsyncSession,
) -> Optional[dict]:
    """Get full hierarchy of models, years, and variants for a make."""
    result = await db.execute(
        select(VehicleMake)
        .options(
            selectinload(VehicleMake.models)
            .selectinload(VehicleModel.years)
            .selectinload(VehicleYear.variants)
        )
        .where(VehicleMake.id == make_id)
    )
    make = result.unique().scalar_one_or_none()
    if not make:
        return None

    return {
        "id": str(make.id),
        "name": make.name,
        "slug": make.slug,
        "models": [
            {
                "id": str(m.id),
                "name": m.name,
                "slug": m.slug,
                "body_type": m.body_type,
                "years": [
                    {
                        "id": str(y.id),
                        "year": y.year,
                        "variants": [
                            {
                                "id": str(v.id),
                                "name": v.name,
                                "engine": v.engine,
                                "transmission": v.transmission,
                                "fuel_type": v.fuel_type,
                            }
                            for v in y.variants
                        ],
                    }
                    for y in m.years
                ],
            }
            for m in make.models
        ],
    }
