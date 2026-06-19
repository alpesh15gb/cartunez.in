"""API router modules."""

from app.api.analytics import router as analytics_router
from app.api.blogs import router as blogs_router
from app.api.bulk_enquiry import router as bulk_enquiry_router
from app.api.dealers import router as dealers_router
from app.api.installation import router as installation_router
from app.api.leads import router as leads_router
from app.api.reviews import router as reviews_router
from app.api.support import router as support_router
from app.api.vehicles import router as vehicles_router
from app.api.gallery import router as gallery_router
from app.api.social import router as social_router
from app.api.chatbot import router as chatbot_router


__all__ = [
    "vehicles_router",
    "dealers_router",
    "bulk_enquiry_router",
    "installation_router",
    "leads_router",
    "support_router",
    "blogs_router",
    "reviews_router",
    "analytics_router",
    "gallery_router",
    "social_router",
    "chatbot_router",
]
