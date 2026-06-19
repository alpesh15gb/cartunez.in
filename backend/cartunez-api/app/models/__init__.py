"""SQLAlchemy models for the Cartunez platform."""

from app.models.analytics import ConversionEvent, PageView
from app.models.blog import Blog, BlogAuthor, BlogCategory, BlogTag
from app.models.bulk_enquiry import BulkEnquiry
from app.models.dealer import Dealer
from app.models.installation import InstallationBooking
from app.models.lead import Lead
from app.models.review import Review
from app.models.support import SupportMessage, SupportTicket
from app.models.vehicle import (
    VehicleMake,
    VehicleModel,
    VehicleVariant,
    VehicleYear,
)

__all__ = [
    "VehicleMake",
    "VehicleModel",
    "VehicleYear",
    "VehicleVariant",
    "Dealer",
    "BulkEnquiry",
    "InstallationBooking",
    "Lead",
    "SupportTicket",
    "SupportMessage",
    "Blog",
    "BlogCategory",
    "BlogTag",
    "BlogAuthor",
    "Review",
    "PageView",
    "ConversionEvent",
]
