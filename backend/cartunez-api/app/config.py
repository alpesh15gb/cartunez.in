"""Application configuration using Pydantic settings."""

from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    APP_NAME: str = "Cartunez API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/cartunez"
    DATABASE_ECHO: bool = False

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Meilisearch
    MEILISEARCH_HOST: str = "http://localhost:7700"
    MEILISEARCH_API_KEY: str = ""
    # Medusa
    MEDUSA_URL: str = "http://medusa:9000"

    # JWT
    JWT_SECRET_KEY: str = "your-super-secret-jwt-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "http://localhost:3001", "https://cartunez.in", "http://cartunez.in", "https://www.cartunez.in"]

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60


settings = Settings()
