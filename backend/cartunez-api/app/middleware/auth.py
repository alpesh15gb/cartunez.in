"""API key authentication for admin endpoints."""

import os

from fastapi import Depends, HTTPException, Security
from fastapi.security import APIKeyHeader

API_KEY = os.getenv("API_ADMIN_KEY", "")
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)


async def require_api_key(
    api_key: str | None = Security(API_KEY_HEADER),
) -> str:
    """Require a valid API key for admin endpoints."""
    if not API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Admin API is not configured",
        )
    if not api_key or api_key != API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing API key",
        )
    return api_key
