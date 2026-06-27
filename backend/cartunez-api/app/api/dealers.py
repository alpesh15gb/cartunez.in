"""Dealer API routes for CRUD and nearby dealer lookup."""

import math
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import require_api_key
from app.models.dealer import Dealer
from app.schemas.dealer import DealerCreate, DealerResponse, DealerUpdate

router = APIRouter(prefix="/dealers", tags=["dealers"])


def _escape_like(value: str) -> str:
    """Escape LIKE wildcards in user input."""
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _haversine_distance(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """Calculate distance in miles between two lat/lon points."""
    R = 3959
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@router.get("", response_model=List[DealerResponse])
async def list_dealers(
    city: Optional[str] = None,
    state: Optional[str] = None,
    is_verified: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> List[Dealer]:
    """List dealers with optional filters."""
    query = select(Dealer).where(Dealer.is_active == True)
    if city:
        query = query.where(Dealer.city.ilike(f"%{_escape_like(city)}%"))
    if state:
        query = query.where(Dealer.state.ilike(f"%{_escape_like(state)}%"))
    if is_verified is not None:
        query = query.where(Dealer.is_verified == is_verified)
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/nearby")
async def get_nearby_dealers(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_miles: float = Query(25.0, ge=1, le=500),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> List[dict]:
    """Find dealers near a given location within a radius."""
    result = await db.execute(
        select(Dealer).where(
            Dealer.is_active == True,
            Dealer.latitude.isnot(None),
            Dealer.longitude.isnot(None),
        )
    )
    dealers = result.scalars().all()

    nearby = []
    for dealer in dealers:
        dist = _haversine_distance(
            latitude, longitude, dealer.latitude, dealer.longitude
        )
        if dist <= radius_miles:
            nearby.append({
                "id": str(dealer.id),
                "name": dealer.name,
                "slug": dealer.slug,
                "city": dealer.city,
                "state": dealer.state,
                "distance_miles": round(dist, 2),
                "phone": dealer.phone,
            })

    nearby.sort(key=lambda d: d["distance_miles"])
    return nearby[:limit]


@router.get("/{dealer_id}", response_model=DealerResponse)
async def get_dealer(
    dealer_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> Dealer:
    """Get a dealer by ID."""
    result = await db.execute(select(Dealer).where(Dealer.id == dealer_id))
    dealer = result.scalar_one_or_none()
    if not dealer:
        raise HTTPException(status_code=404, detail="Dealer not found")
    return dealer


@router.post("", response_model=DealerResponse, status_code=201)
async def create_dealer(
    data: DealerCreate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_api_key),
) -> Dealer:
    """Create a new dealer. Requires API key."""
    dealer = Dealer(**data.model_dump())
    db.add(dealer)
    await db.flush()
    await db.refresh(dealer)
    return dealer


@router.patch("/{dealer_id}", response_model=DealerResponse)
async def update_dealer(
    dealer_id: UUID,
    data: DealerUpdate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_api_key),
) -> Dealer:
    """Update an existing dealer. Requires API key."""
    result = await db.execute(select(Dealer).where(Dealer.id == dealer_id))
    dealer = result.scalar_one_or_none()
    if not dealer:
        raise HTTPException(status_code=404, detail="Dealer not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(dealer, field, value)
    await db.flush()
    await db.refresh(dealer)
    return dealer


@router.delete("/{dealer_id}", status_code=204)
async def delete_dealer(
    dealer_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_api_key),
) -> None:
    """Delete a dealer. Requires API key."""
    result = await db.execute(select(Dealer).where(Dealer.id == dealer_id))
    dealer = result.scalar_one_or_none()
    if not dealer:
        raise HTTPException(status_code=404, detail="Dealer not found")
    await db.delete(dealer)
