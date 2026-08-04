"""Application configuration using Pydantic settings."""

import json
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
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@postgres:5432/cartunez"
    DATABASE_ECHO: bool = False

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # Meilisearch
    MEILISEARCH_HOST: str = "http://meilisearch:7700"
    MEILISEARCH_API_KEY: str = ""

    # Medusa
    MEDUSA_URL: str = "http://medusa:9000"

    # LLM providers (for chatbot)
    GROQ_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    OPENAI_CHAT_MODEL: str = "gpt-4o-mini"
    OPENAI_IMAGE_MODEL: str = "gpt-image-1"

    # Omniroute — multi-AI-provider gateway (OpenAI-compatible, preferred when set)
    OMNIROUTE_URL: str = ""          # e.g. http://host:20128/v1
    OMNIROUTE_API_KEY: str = ""
    # auto/fast is the low-latency Omniroute combo pool (auto/chat can pick
    # slow providers — measured 66s vs 8s for auto/fast). Can also be a
    # provider/model, e.g. anthropic/claude-3-5-sonnet.
    OMNIROUTE_CHAT_MODEL: str = "auto/fast"
    OMNIROUTE_IMAGE_MODEL: str = "antigravity/gemini-3.1-flash-image"   # verified working on the user's gateway

    # JWT
    JWT_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    CORS_ORIGINS: List[str] = []

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    def model_post_init(self, __context) -> None:
        # Parse CORS_ORIGINS if it comes as a JSON string from env
        if isinstance(self.CORS_ORIGINS, str):
            try:
                self.CORS_ORIGINS = json.loads(self.CORS_ORIGINS)
            except json.JSONDecodeError:
                self.CORS_ORIGINS = [s.strip() for s in self.CORS_ORIGINS.split(",")]
        # Set defaults if empty
        if not self.CORS_ORIGINS:
            self.CORS_ORIGINS = [
                "https://cartunez.in",
                "https://www.cartunez.in",
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:5173",
            ]


settings = Settings()
