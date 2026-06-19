"""Pydantic schemas for bulk enquiry models."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class BulkEnquiryCreate(BaseModel):
    """Schema for creating a bulk enquiry."""

    company_name: str = Field(..., max_length=200)
    contact_name: str = Field(..., max_length=200)
    email: str = Field(..., max_length=255)
    phone: Optional[str] = None
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_year: Optional[int] = None
    quantity: int = Field(default=1, ge=1)
    product_ids: Optional[str] = None
    message: Optional[str] = None


class BulkEnquiryResponse(BaseModel):
    """Schema for bulk enquiry response."""

    id: UUID
    company_name: str
    contact_name: str
    email: str
    phone: Optional[str] = None
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_year: Optional[int] = None
    quantity: int
    product_ids: Optional[str] = None
    message: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
