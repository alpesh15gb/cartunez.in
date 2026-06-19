"""Pydantic schemas for request/response validation."""

from app.schemas.analytics import ConversionEventCreate, ConversionEventResponse, PageViewCreate, PageViewResponse
from app.schemas.blog import (
    BlogAuthorCreate,
    BlogAuthorResponse,
    BlogCategoryCreate,
    BlogCategoryResponse,
    BlogCreate,
    BlogResponse,
    BlogTagCreate,
    BlogTagResponse,
)
from app.schemas.bulk_enquiry import BulkEnquiryCreate, BulkEnquiryResponse
from app.schemas.dealer import DealerCreate, DealerResponse, DealerUpdate
from app.schemas.installation import InstallationBookingCreate, InstallationBookingResponse
from app.schemas.lead import LeadCreate, LeadResponse
from app.schemas.review import ReviewCreate, ReviewResponse
from app.schemas.support import (
    SupportMessageCreate,
    SupportMessageResponse,
    SupportTicketCreate,
    SupportTicketResponse,
)
from app.schemas.vehicle import (
    VehicleMakeCreate,
    VehicleMakeResponse,
    VehicleModelCreate,
    VehicleModelResponse,
    VehicleVariantCreate,
    VehicleVariantResponse,
    VehicleYearCreate,
    VehicleYearResponse,
)

__all__ = [
    "VehicleMakeCreate",
    "VehicleMakeResponse",
    "VehicleModelCreate",
    "VehicleModelResponse",
    "VehicleYearCreate",
    "VehicleYearResponse",
    "VehicleVariantCreate",
    "VehicleVariantResponse",
    "DealerCreate",
    "DealerResponse",
    "DealerUpdate",
    "BulkEnquiryCreate",
    "BulkEnquiryResponse",
    "InstallationBookingCreate",
    "InstallationBookingResponse",
    "LeadCreate",
    "LeadResponse",
    "SupportTicketCreate",
    "SupportTicketResponse",
    "SupportMessageCreate",
    "SupportMessageResponse",
    "BlogCreate",
    "BlogResponse",
    "BlogCategoryCreate",
    "BlogCategoryResponse",
    "BlogTagCreate",
    "BlogTagResponse",
    "BlogAuthorCreate",
    "BlogAuthorResponse",
    "ReviewCreate",
    "ReviewResponse",
    "PageViewCreate",
    "PageViewResponse",
    "ConversionEventCreate",
    "ConversionEventResponse",
]
