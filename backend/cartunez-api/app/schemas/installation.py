"""Pydantic schemas for installation booking models."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class InstallationBookingCreate(BaseModel):
    """Schema for creating an installation booking."""

    dealer_id: UUID
    customer_name: str = Field(..., max_length=200)
    customer_email: str = Field(..., max_length=255)
    customer_phone: str = Field(..., max_length=20)
    vehicle_make: str = Field(..., max_length=100)
    vehicle_model: str = Field(..., max_length=100)
    vehicle_year: str = Field(..., max_length=10)
    vehicle_vin: Optional[str] = Field(None, max_length=17)
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    service_type: str = Field(..., max_length=100)
    product_ids: Optional[str] = None
    notes: Optional[str] = None


class InstallationBookingResponse(BaseModel):
    """Schema for installation booking response."""

    id: UUID
    dealer_id: UUID
    customer_name: str
    customer_email: str
    customer_phone: str
    vehicle_make: str
    vehicle_model: str
    vehicle_year: str
    vehicle_vin: Optional[str] = None
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    service_type: str
    product_ids: Optional[str] = None
    notes: Optional[str] = None
    status: str
    confirmed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
