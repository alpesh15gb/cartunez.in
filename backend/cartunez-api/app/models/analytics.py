"""Analytics models for page views and conversion tracking."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class PageView(Base):
    """Page view tracking for analytics."""

    __tablename__ = "page_views"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    path: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    referrer: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    session_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    visitor_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<PageView {self.path}>"


class ConversionEvent(Base):
    """Conversion event tracking (purchase, signup, etc.)."""

    __tablename__ = "conversion_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    session_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    visitor_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    revenue: Mapped[str | None] = mapped_column(String(20), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    event_metadata: Mapped[str | None] = mapped_column("metadata", Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<ConversionEvent {self.event_type}>"
