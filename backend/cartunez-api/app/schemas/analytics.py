"""Pydantic schemas for analytics models."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class PageViewCreate(BaseModel):
    """Schema for creating a page view."""

    path: str
    referrer: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    session_id: Optional[str] = None
    visitor_id: Optional[str] = None


class PageViewResponse(BaseModel):
    """Schema for page view response."""

    id: UUID
    path: str
    referrer: Optional[str] = None
    session_id: Optional[str] = None
    visitor_id: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversionEventCreate(BaseModel):
    """Schema for creating a conversion event."""

    event_type: str
    session_id: Optional[str] = None
    visitor_id: Optional[str] = None
    revenue: Optional[str] = None
    currency: str = "USD"
    metadata: Optional[str] = None


class ConversionEventResponse(BaseModel):
    """Schema for conversion event response."""

    id: UUID
    event_type: str
    session_id: Optional[str] = None
    visitor_id: Optional[str] = None
    revenue: Optional[str] = None
    currency: str
    created_at: datetime

    model_config = {"from_attributes": True}
