"""Pydantic schemas for vehicle models."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class VehicleMakeCreate(BaseModel):
    """Schema for creating a vehicle make."""

    name: str = Field(..., max_length=100)
    slug: str = Field(..., max_length=100)
    logo_url: Optional[str] = None


class VehicleMakeResponse(BaseModel):
    """Schema for vehicle make response."""

    id: UUID
    name: str
    slug: str
    logo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VehicleModelCreate(BaseModel):
    """Schema for creating a vehicle model."""

    make_id: UUID
    name: str = Field(..., max_length=100)
    slug: str = Field(..., max_length=100)
    body_type: Optional[str] = None


class VehicleModelResponse(BaseModel):
    """Schema for vehicle model response."""

    id: UUID
    make_id: UUID
    name: str
    slug: str
    body_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VehicleYearCreate(BaseModel):
    """Schema for creating a vehicle year."""

    model_id: UUID
    year: int = Field(..., ge=1900, le=2100)


class VehicleYearResponse(BaseModel):
    """Schema for vehicle year response."""

    id: UUID
    model_id: UUID
    year: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VehicleVariantCreate(BaseModel):
    """Schema for creating a vehicle variant."""

    vehicle_year_id: UUID
    name: str = Field(..., max_length=200)
    engine: Optional[str] = None
    transmission: Optional[str] = None
    fuel_type: Optional[str] = None


class VehicleVariantResponse(BaseModel):
    """Schema for vehicle variant response."""

    id: UUID
    vehicle_year_id: UUID
    name: str
    engine: Optional[str] = None
    transmission: Optional[str] = None
    fuel_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
