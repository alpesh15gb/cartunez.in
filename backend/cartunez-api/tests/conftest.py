"""Pytest fixtures for FastAPI tests."""

import asyncio
import os
from typing import AsyncGenerator

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Set test environment variables BEFORE importing the app, so that settings
# and database engine are configured for testing.
os.environ.setdefault("TESTING", "true")
# Always use SQLite for tests — overrides any DATABASE_URL from CI env
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-ci-only-32chars!")
os.environ.setdefault("API_ADMIN_KEY", "test-api-key-12345")
os.environ.setdefault("CORS_ORIGINS", '["http://localhost:3000"]')
os.environ.setdefault("DEBUG", "true")

from app.config import settings  # noqa: E402
from app.models import Base  # noqa: E402

# Create a test engine — SQLite in-memory for fast, isolated tests
_test_engine = create_async_engine(
    "sqlite+aiosqlite:///:memory:",
    echo=False,
)

TestSessionLocal = async_sessionmaker(
    _test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create all tables, provide a session, then drop tables for each test."""
    async with _test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session

    async with _test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """FastAPI test client with database dependency overridden."""
    from app.main import app
    from app.database import get_db

    async def _get_test_db():
        yield db_session

    app.dependency_overrides[get_db] = _get_test_db

    async with AsyncClient(app=app, base_url="http://testserver") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def admin_headers() -> dict:
    """Headers with a valid admin API key for protected endpoints."""
    return {"X-API-Key": settings.API_ADMIN_KEY}
