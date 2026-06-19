"""Analytics service for aggregation and reporting."""

from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analytics import ConversionEvent, PageView


async def get_page_view_count(
    path: Optional[str] = None,
    since: Optional[datetime] = None,
    db: AsyncSession = None,
) -> int:
    """Get total page view count, optionally filtered by path and date."""
    query = select(func.count(PageView.id))
    if path:
        query = query.where(PageView.path == path)
    if since:
        query = query.where(PageView.created_at >= since)
    result = await db.execute(query)
    return result.scalar() or 0


async def get_conversion_count(
    event_type: Optional[str] = None,
    since: Optional[datetime] = None,
    db: AsyncSession = None,
) -> int:
    """Get total conversion count, optionally filtered by type and date."""
    query = select(func.count(ConversionEvent.id))
    if event_type:
        query = query.where(ConversionEvent.event_type == event_type)
    if since:
        query = query.where(ConversionEvent.created_at >= since)
    result = await db.execute(query)
    return result.scalar() or 0


async def get_top_pages(
    limit: int = 10,
    since: Optional[datetime] = None,
    db: AsyncSession = None,
) -> list:
    """Get top visited pages."""
    query = (
        select(PageView.path, func.count(PageView.id).label("count"))
        .group_by(PageView.path)
        .order_by(func.count(PageView.id).desc())
        .limit(limit)
    )
    if since:
        query = query.where(PageView.created_at >= since)
    result = await db.execute(query)
    return [{"path": row[0], "count": row[1]} for row in result.all()]


async def get_daily_stats(
    days: int = 30,
    db: AsyncSession = None,
) -> list:
    """Get daily page view and conversion stats for the last N days."""
    since = datetime.utcnow() - timedelta(days=days)

    pv_query = (
        select(
            func.date(PageView.created_at).label("date"),
            func.count(PageView.id).label("page_views"),
        )
        .where(PageView.created_at >= since)
        .group_by(func.date(PageView.created_at))
        .order_by(func.date(PageView.created_at))
    )
    pv_result = await db.execute(pv_query)
    pv_data = {str(row.date): row.page_views for row in pv_result.all()}

    conv_query = (
        select(
            func.date(ConversionEvent.created_at).label("date"),
            func.count(ConversionEvent.id).label("conversions"),
        )
        .where(ConversionEvent.created_at >= since)
        .group_by(func.date(ConversionEvent.created_at))
        .order_by(func.date(ConversionEvent.created_at))
    )
    conv_result = await db.execute(conv_query)
    conv_data = {str(row.date): row.conversions for row in conv_result.all()}

    stats = []
    for i in range(days):
        date = (datetime.utcnow() - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
        stats.append({
            "date": date,
            "page_views": pv_data.get(date, 0),
            "conversions": conv_data.get(date, 0),
        })

    return stats
