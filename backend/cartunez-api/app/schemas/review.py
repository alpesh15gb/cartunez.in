"""Pydantic schemas for review models."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    """Schema for creating a review."""

    product_id: str = Field(..., max_length=100)
    customer_name: str = Field(..., max_length=200)
    customer_email: str = Field(..., max_length=255)
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = Field(None, max_length=300)
    content: Optional[str] = None
    is_verified_purchase: bool = False


class ReviewResponse(BaseModel):
    """Schema for review response."""

    id: UUID
    product_id: str
    customer_name: str
    customer_email: str
    rating: int
    title: Optional[str] = None
    content: Optional[str] = None
    is_verified_purchase: bool
    is_approved: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
