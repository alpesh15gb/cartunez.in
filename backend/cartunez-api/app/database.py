"""Async SQLAlchemy database engine and session management."""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings

# SQLite in-memory/testing mode doesn't support pool_size/max_overflow
# and uses StaticPool; only apply pool settings for PostgreSQL
_is_sqlite = settings.DATABASE_URL.startswith("sqlite")
_engine_kwargs: dict[str, object] = {"echo": settings.DATABASE_ECHO}
if not _is_sqlite:
    _engine_kwargs.update(pool_size=20, max_overflow=10, pool_pre_ping=True)

engine = create_async_engine(settings.DATABASE_URL, **_engine_kwargs)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides an async database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
