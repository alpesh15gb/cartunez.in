"""Pydantic schemas for support ticket and message models."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class SupportMessageCreate(BaseModel):
    """Schema for creating a support message."""

    sender_name: str = Field(..., max_length=200)
    sender_email: str = Field(..., max_length=255)
    is_staff: bool = False
    content: str


class SupportMessageResponse(BaseModel):
    """Schema for support message response."""

    id: UUID
    ticket_id: UUID
    sender_name: str
    sender_email: str
    is_staff: bool
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SupportTicketCreate(BaseModel):
    """Schema for creating a support ticket."""

    customer_name: str = Field(..., max_length=200)
    customer_email: str = Field(..., max_length=255)
    subject: str = Field(..., max_length=300)
    category: str = Field(default="general", max_length=50)
    priority: str = Field(default="medium", max_length=20)
    initial_message: Optional[str] = None


class SupportTicketResponse(BaseModel):
    """Schema for support ticket response."""

    id: UUID
    customer_name: str
    customer_email: str
    subject: str
    category: str
    priority: str
    status: str
    assigned_to: Optional[str] = None
    messages: List[SupportMessageResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
