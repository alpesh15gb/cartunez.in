from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.gallery import GalleryItem
from app.schemas.gallery import GalleryItemResponse

router = APIRouter(prefix="/gallery", tags=["gallery"])

@router.get("", response_model=List[GalleryItemResponse])
async def list_gallery_items(db: AsyncSession = Depends(get_db)) -> List[GalleryItem]:
    """List all portfolio/gallery items."""
    result = await db.execute(select(GalleryItem).order_by(GalleryItem.title))
    return list(result.scalars().all())
