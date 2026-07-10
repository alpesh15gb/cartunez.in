"""Vehicle API routes for make, model, year, and variant management."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import require_api_key
from app.models.vehicle import VehicleMake, VehicleModel, VehicleVariant, VehicleYear
from app.schemas.vehicle import (
    VehicleMakeCreate,
    VehicleMakeResponse,
    VehicleModelCreate,
    VehicleModelResponse,
    VehicleVariantCreate,
    VehicleVariantResponse,
    VehicleYearCreate,
    VehicleYearResponse,
)

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


def _escape_like(value: str) -> str:
    """Escape LIKE wildcards in user input."""
    return value.replace("\\", "\\\\").replace("%", "\\\\%").replace("_", "\\\\_")


# â”€â”€â”€ Makes (public read, admin write) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.get("/makes", response_model=List[VehicleMakeResponse])
async def list_makes(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> List[VehicleMake]:
    """List all vehicle makes."""
    result = await db.execute(
        select(VehicleMake).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get("/makes/{make_id}", response_model=VehicleMakeResponse)
async def get_make(
    make_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> VehicleMake:
    """Get a vehicle make by ID."""
    result = await db.execute(
        select(VehicleMake).where(VehicleMake.id == make_id)
    )
    make = result.scalar_one_or_none()
    if not make:
        raise HTTPException(status_code=404, detail="Make not found")
    return make


@router.post("/makes", response_model=VehicleMakeResponse, status_code=201)
async def create_make(
    data: VehicleMakeCreate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_api_key),
) -> VehicleMake:
    """Create a new vehicle make. Requires API key."""
    make = VehicleMake(**data.model_dump())
    db.add(make)
    await db.flush()
    await db.refresh(make)
    return make


@router.delete("/makes/{make_id}", status_code=204)
async def delete_make(
    make_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_api_key),
) -> None:
    """Delete a vehicle make. Requires API key."""
    result = await db.execute(
        select(VehicleMake).where(VehicleMake.id == make_id)
    )
    make = result.scalar_one_or_none()
    if not make:
        raise HTTPException(status_code=404, detail="Make not found")
    await db.delete(make)


# â”€â”€â”€ Models (public read, admin write) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.get("/models", response_model=List[VehicleModelResponse])
async def list_models(
    make_id: Optional[UUID] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> List[VehicleModel]:
    """List vehicle models, optionally filtered by make."""
    query = select(VehicleModel)
    if make_id:
        query = query.where(VehicleModel.make_id == make_id)
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/models/{model_id}", response_model=VehicleModelResponse)
async def get_model(
    model_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> VehicleModel:
    """Get a vehicle model by ID."""
    result = await db.execute(
        select(VehicleModel).where(VehicleModel.id == model_id)
    )
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model


@router.post("/models", response_model=VehicleModelResponse, status_code=201)
async def create_model(
    data: VehicleModelCreate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_api_key),
) -> VehicleModel:
    """Create a new vehicle model. Requires API key."""
    model = VehicleModel(**data.model_dump())
    db.add(model)
    await db.flush()
    await db.refresh(model)
    return model


# â”€â”€â”€ Years (public read, admin write) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.get("/years", response_model=List[VehicleYearResponse])
async def list_years(
    model_id: Optional[UUID] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> List[VehicleYear]:
    """List vehicle years, optionally filtered by model."""
    query = select(VehicleYear)
    if model_id:
        query = query.where(VehicleYear.model_id == model_id)
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/years/{year_id}", response_model=VehicleYearResponse)
async def get_year(
    year_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> VehicleYear:
    """Get a vehicle year by ID."""
    result = await db.execute(
        select(VehicleYear).where(VehicleYear.id == year_id)
    )
    year = result.scalar_one_or_none()
    if not year:
        raise HTTPException(status_code=404, detail="Year not found")
    return year


@router.post("/years", response_model=VehicleYearResponse, status_code=201)
async def create_year(
    data: VehicleYearCreate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_api_key),
) -> VehicleYear:
    """Create a new vehicle year entry. Requires API key."""
    year = VehicleYear(**data.model_dump())
    db.add(year)
    await db.flush()
    await db.refresh(year)
    return year


# â”€â”€â”€ Variants (public read, admin write) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.get("/variants", response_model=List[VehicleVariantResponse])
async def list_variants(
    vehicle_year_id: Optional[UUID] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> List[VehicleVariant]:
    """List vehicle variants, optionally filtered by year."""
    query = select(VehicleVariant)
    if vehicle_year_id:
        query = query.where(VehicleVariant.vehicle_year_id == vehicle_year_id)
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/variants/{variant_id}", response_model=VehicleVariantResponse)
async def get_variant(
    variant_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> VehicleVariant:
    """Get a vehicle variant by ID."""
    result = await db.execute(
        select(VehicleVariant).where(VehicleVariant.id == variant_id)
    )
    variant = result.scalar_one_or_none()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    return variant


@router.post("/variants", response_model=VehicleVariantResponse, status_code=201)
async def create_variant(
    data: VehicleVariantCreate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_api_key),
) -> VehicleVariant:
    """Create a new vehicle variant. Requires API key."""
    variant = VehicleVariant(**data.model_dump())
    db.add(variant)
    await db.flush()
    await db.refresh(variant)
    return variant


# â”€â”€â”€ Search (public) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.get("/search")
async def search_vehicles(
    make: Optional[str] = None,
    model: Optional[str] = None,
    year: Optional[int] = None,
    body_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> List[dict]:
    """Search vehicles by make, model, year, and body type."""
    query = (
        select(VehicleMake, VehicleModel, VehicleYear)
        .join(VehicleModel, VehicleMake.id == VehicleModel.make_id)
        .join(VehicleYear, VehicleModel.id == VehicleYear.model_id)
    )

    if make:
        query = query.where(VehicleMake.name.ilike(f"%{_escape_like(make)}%"))
    if model:
        query = query.where(VehicleModel.name.ilike(f"%{_escape_like(model)}%"))
    if year:
        query = query.where(VehicleYear.year == year)
    if body_type:
        query = query.where(VehicleModel.body_type.ilike(f"%{_escape_like(body_type)}%"))

    result = await db.execute(query.limit(50))
    rows = result.all()

    return [
        {
            "make": {"id": str(mk.id), "name": mk.name, "slug": mk.slug},
            "model": {"id": str(m.id), "name": m.name, "slug": m.slug, "body_type": m.body_type},
            "year": {"id": str(y.id), "year": y.year},
        }
        for mk, m, y in rows
    ]
