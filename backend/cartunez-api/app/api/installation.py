"""Installation booking API routes."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.installation import InstallationBooking
from app.schemas.installation import (
    InstallationBookingCreate,
    InstallationBookingResponse,
)

router = APIRouter(prefix="/installation", tags=["installation"])


@router.get("/bookings", response_model=List[InstallationBookingResponse])
async def list_bookings(
    status: str = Query("pending", max_length=50),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> List[InstallationBooking]:
    """List installation bookings filtered by status."""
    result = await db.execute(
        select(InstallationBooking)
        .where(InstallationBooking.status == status)
        .order_by(InstallationBooking.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/bookings/{booking_id}", response_model=InstallationBookingResponse)
async def get_booking(
    booking_id: str,
    db: AsyncSession = Depends(get_db),
) -> InstallationBooking:
    """Get an installation booking by ID."""
    result = await db.execute(
        select(InstallationBooking).where(InstallationBooking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.post("/bookings", response_model=InstallationBookingResponse, status_code=201)
async def create_booking(
    data: InstallationBookingCreate,
    db: AsyncSession = Depends(get_db),
) -> InstallationBooking:
    """Create a new installation booking."""
    booking = InstallationBooking(**data.model_dump())
    db.add(booking)
    await db.flush()
    await db.refresh(booking)
    return booking


@router.patch("/bookings/{booking_id}/status", response_model=InstallationBookingResponse)
async def update_booking_status(
    booking_id: str,
    status: str = Query(..., max_length=50),
    db: AsyncSession = Depends(get_db),
) -> InstallationBooking:
    """Update the status of an installation booking."""
    result = await db.execute(
        select(InstallationBooking).where(InstallationBooking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = status
    await db.flush()
    await db.refresh(booking)
    return booking
