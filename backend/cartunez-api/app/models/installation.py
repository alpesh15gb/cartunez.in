"""Installation booking model for automotive part installation services."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class InstallationBooking(Base):
    """Customer booking for part installation services."""

    __tablename__ = "installation_bookings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    dealer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )

    # Customer info
    customer_name: Mapped[str] = mapped_column(String(200), nullable=False)
    customer_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    customer_phone: Mapped[str] = mapped_column(String(20), nullable=False)

    # Vehicle info
    vehicle_make: Mapped[str] = mapped_column(String(100), nullable=False)
    vehicle_model: Mapped[str] = mapped_column(String(100), nullable=False)
    vehicle_year: Mapped[str] = mapped_column(String(10), nullable=False)
    vehicle_vin: Mapped[str | None] = mapped_column(String(17), nullable=True)

    # Booking details
    preferred_date: Mapped[str | None] = mapped_column(String(20), nullable=True)
    preferred_time: Mapped[str | None] = mapped_column(String(20), nullable=True)
    service_type: Mapped[str] = mapped_column(String(100), nullable=False)
    product_ids: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Status
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    confirmed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"<InstallationBooking {self.customer_name}>"
