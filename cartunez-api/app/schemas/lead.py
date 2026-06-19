"""Pydantic schemas for lead models."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class LeadCreate(BaseModel):
    """Schema for creating a lead."""

    name: str = Field(..., max_length=200)
    email: str = Field(..., max_length=255)
    phone: Optional[str] = None
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_year: Optional[str] = None
    product_interest: Optional[str] = None
    source: str = Field(default="website", max_length=50)
    medium: Optional[str] = None
    campaign: Optional[str] = None
    notes: Optional[str] = None


class LeadResponse(BaseModel):
    """Schema for lead response."""

    id: UUID
    name: str
    email: str
    phone: Optional[str] = None
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_year: Optional[str] = None
    product_interest: Optional[str] = None
    source: str
    medium: Optional[str] = None
    campaign: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
