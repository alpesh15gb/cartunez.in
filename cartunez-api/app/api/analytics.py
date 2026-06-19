"""Analytics API routes for page views and conversion tracking."""

from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.analytics import ConversionEvent, PageView
from app.schemas.analytics import (
    ConversionEventCreate,
    ConversionEventResponse,
    PageViewCreate,
    PageViewResponse,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.post("/page-views", response_model=PageViewResponse, status_code=201)
async def track_page_view(
    data: PageViewCreate,
    db: AsyncSession = Depends(get_db),
) -> PageView:
    """Track a page view event."""
    pv = PageView(**data.model_dump())
    db.add(pv)
    await db.flush()
    await db.refresh(pv)
    return pv


@router.get("/page-views", response_model=List[PageViewResponse])
async def list_page_views(
    path: str = Query(None, max_length=500),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
) -> List[PageView]:
    """List recent page views, optionally filtered by path."""
    query = select(PageView)
    if path:
        query = query.where(PageView.path == path)
    result = await db.execute(
        query.order_by(PageView.created_at.desc()).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.post("/conversions", response_model=ConversionEventResponse, status_code=201)
async def track_conversion(
    data: ConversionEventCreate,
    db: AsyncSession = Depends(get_db),
) -> ConversionEvent:
    """Track a conversion event."""
    event = ConversionEvent(**data.model_dump())
    db.add(event)
    await db.flush()
    await db.refresh(event)
    return event


@router.get("/conversions", response_model=List[ConversionEventResponse])
async def list_conversions(
    event_type: str = Query(None, max_length=50),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
) -> List[ConversionEvent]:
    """List recent conversion events, optionally filtered by type."""
    query = select(ConversionEvent)
    if event_type:
        query = query.where(ConversionEvent.event_type == event_type)
    result = await db.execute(
        query.order_by(ConversionEvent.created_at.desc()).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get("/summary")
async def analytics_summary(
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get a summary of analytics data."""
    from sqlalchemy import func

    pv_count = await db.execute(select(func.count(PageView.id)))
    conv_count = await db.execute(select(func.count(ConversionEvent.id)))

    return {
        "total_page_views": pv_count.scalar() or 0,
        "total_conversions": conv_count.scalar() or 0,
    }
