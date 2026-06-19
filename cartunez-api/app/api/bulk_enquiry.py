"""Bulk enquiry API routes."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.bulk_enquiry import BulkEnquiry
from app.schemas.bulk_enquiry import BulkEnquiryCreate, BulkEnquiryResponse

router = APIRouter(prefix="/bulk-enquiries", tags=["bulk-enquiries"])


@router.get("", response_model=List[BulkEnquiryResponse])
async def list_bulk_enquiries(
    status: str = Query("pending", max_length=50),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> List[BulkEnquiry]:
    """List bulk enquiries filtered by status."""
    result = await db.execute(
        select(BulkEnquiry)
        .where(BulkEnquiry.status == status)
        .order_by(BulkEnquiry.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/{enquiry_id}", response_model=BulkEnquiryResponse)
async def get_bulk_enquiry(
    enquiry_id: str,
    db: AsyncSession = Depends(get_db),
) -> BulkEnquiry:
    """Get a bulk enquiry by ID."""
    result = await db.execute(
        select(BulkEnquiry).where(BulkEnquiry.id == enquiry_id)
    )
    enquiry = result.scalar_one_or_none()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    return enquiry


@router.post("", response_model=BulkEnquiryResponse, status_code=201)
async def create_bulk_enquiry(
    data: BulkEnquiryCreate,
    db: AsyncSession = Depends(get_db),
) -> BulkEnquiry:
    """Submit a new bulk enquiry."""
    enquiry = BulkEnquiry(**data.model_dump())
    db.add(enquiry)
    await db.flush()
    await db.refresh(enquiry)
    return enquiry


@router.patch("/{enquiry_id}/status", response_model=BulkEnquiryResponse)
async def update_enquiry_status(
    enquiry_id: str,
    status: str = Query(..., max_length=50),
    db: AsyncSession = Depends(get_db),
) -> BulkEnquiry:
    """Update the status of a bulk enquiry."""
    result = await db.execute(
        select(BulkEnquiry).where(BulkEnquiry.id == enquiry_id)
    )
    enquiry = result.scalar_one_or_none()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    enquiry.status = status
    await db.flush()
    await db.refresh(enquiry)
    return enquiry
