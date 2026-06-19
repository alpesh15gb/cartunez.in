"""Review moderation API routes."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewResponse

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("", response_model=List[ReviewResponse])
async def list_reviews(
    product_id: str = Query(..., max_length=100),
    approved_only: bool = True,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> List[Review]:
    """List reviews for a product."""
    query = select(Review).where(Review.product_id == product_id)
    if approved_only:
        query = query.where(Review.is_approved == True)
    result = await db.execute(
        query.order_by(Review.created_at.desc()).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get("/{review_id}", response_model=ReviewResponse)
async def get_review(
    review_id: str,
    db: AsyncSession = Depends(get_db),
) -> Review:
    """Get a review by ID."""
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review


@router.post("", response_model=ReviewResponse, status_code=201)
async def create_review(
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
) -> Review:
    """Submit a new product review."""
    review = Review(**data.model_dump())
    db.add(review)
    await db.flush()
    await db.refresh(review)
    return review


@router.patch("/{review_id}/approve", response_model=ReviewResponse)
async def approve_review(
    review_id: str,
    db: AsyncSession = Depends(get_db),
) -> Review:
    """Approve a review for public display."""
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.is_approved = True
    await db.flush()
    await db.refresh(review)
    return review


@router.delete("/{review_id}", status_code=204)
async def delete_review(
    review_id: str,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a review."""
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    await db.delete(review)
