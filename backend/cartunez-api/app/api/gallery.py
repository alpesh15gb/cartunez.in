from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.gallery import GalleryItem
from app.schemas.gallery import GalleryItemResponse

router = APIRouter(prefix="/gallery", tags=["gallery"])

@router.get("", response_model=List[GalleryItemResponse])
async def list_gallery_items(db: AsyncSession = Depends(get_db)) -> List[GalleryItemResponse]:
    """List all portfolio/gallery items."""
    result = await db.execute(select(GalleryItem).order_by(GalleryItem.title))
    items = result.scalars().all()
    # Map image -> image_url for frontend compatibility
    mapped = []
    for item in items:
        d = {
            "id": str(item.id),
            "title": item.title,
            "image_url": item.image,
            "category": item.category,
            "vehicle": item.vehicle,
            "created_at": datetime.now(),
        }
        mapped.append(GalleryItemResponse(**d))
    return mapped
