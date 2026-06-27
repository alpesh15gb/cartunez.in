"""FastAPI application for Cartunez automotive e-commerce platform."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.security import SecurityHeadersMiddleware
from app.services.search_service import close_client

from app.api import (
    analytics_router,
    blogs_router,
    bulk_enquiry_router,
    chatbot_router,
    dealers_router,
    gallery_router,
    installation_router,
    leads_router,
    reviews_router,
    social_router,
    support_router,
    vehicles_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown events."""
    yield
    await close_client()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Automotive e-commerce platform API for vehicle parts, dealer management, and customer services.",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# ─── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key", "X-Request-ID"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    RateLimitMiddleware,
    max_requests=settings.RATE_LIMIT_PER_MINUTE,
    window_seconds=60,
)

# ─── Routers ──────────────────────────────────────────────────────────────────

app.include_router(vehicles_router, prefix="/api/v1")
app.include_router(dealers_router, prefix="/api/v1")
app.include_router(bulk_enquiry_router, prefix="/api/v1")
app.include_router(installation_router, prefix="/api/v1")
app.include_router(leads_router, prefix="/api/v1")
app.include_router(support_router, prefix="/api/v1")
app.include_router(blogs_router, prefix="/api/v1")
app.include_router(reviews_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(social_router, prefix="/api/v1")
app.include_router(gallery_router, prefix="/api/v1")
app.include_router(chatbot_router, prefix="/api/v1")


# ─── Exception Handlers ──────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all exception handler."""
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


@app.exception_handler(404)
async def not_found_handler(request: Request, exc) -> JSONResponse:
    """404 not found handler."""
    return JSONResponse(
        status_code=404,
        content={"detail": "Resource not found"},
    )


@app.exception_handler(422)
async def validation_error_handler(request: Request, exc) -> JSONResponse:
    """422 validation error handler."""
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation error"},
    )


# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/health", tags=["health"])
async def health_check() -> dict:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "service": settings.APP_NAME,
    }


@app.get("/", tags=["root"])
async def root() -> dict:
    """Root endpoint with API information."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs" if settings.DEBUG else "API documentation available in production",
        "health": "/health",
    }
