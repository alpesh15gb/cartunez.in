"""Vehicle-related models for make, model, year, and variant."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class VehicleMake(Base):
    """Vehicle manufacturer (e.g., Toyota, Honda)."""

    __tablename__ = "vehicle_makes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    models: Mapped[list["VehicleModel"]] = relationship(
        "VehicleModel", back_populates="make", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<VehicleMake {self.name}>"


class VehicleModel(Base):
    """Vehicle model under a make (e.g., Camry, Civic)."""

    __tablename__ = "vehicle_models"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    make_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vehicle_makes.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    body_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    make: Mapped["VehicleMake"] = relationship("VehicleMake", back_populates="models")
    years: Mapped[list["VehicleYear"]] = relationship(
        "VehicleYear", back_populates="model", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<VehicleModel {self.name}>"


class VehicleYear(Base):
    """Vehicle model year."""

    __tablename__ = "vehicle_years"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    model_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vehicle_models.id", ondelete="CASCADE"), nullable=False
    )
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    model: Mapped["VehicleModel"] = relationship("VehicleModel", back_populates="years")
    variants: Mapped[list["VehicleVariant"]] = relationship(
        "VehicleVariant", back_populates="vehicle_year", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<VehicleYear {self.year}>"


class VehicleVariant(Base):
    """Specific vehicle variant with engine/trim details."""

    __tablename__ = "vehicle_variants"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    vehicle_year_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vehicle_years.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    engine: Mapped[str | None] = mapped_column(String(100), nullable=True)
    transmission: Mapped[str | None] = mapped_column(String(50), nullable=True)
    fuel_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    vehicle_year: Mapped["VehicleYear"] = relationship("VehicleYear", back_populates="variants")

    def __repr__(self) -> str:
        return f"<VehicleVariant {self.name}>"
