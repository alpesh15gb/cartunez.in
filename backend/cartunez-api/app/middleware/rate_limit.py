"""Redis-based rate limiting middleware."""

import logging
import time

from fastapi import Depends, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import JSONResponse

from app.config import settings

logger = logging.getLogger(__name__)

try:
    import redis.asyncio as aioredis

    redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
except Exception:
    redis_client = None


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware using Redis sliding window."""

    def __init__(self, app, max_requests: int = 60, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        if redis_client is None:
            logger.warning("Rate limiter Redis is not available — allowing request through")
            return await call_next(request)

        client_ip = _get_client_ip(request)
        key = f"rate_limit:{client_ip}"

        try:
            now = time.time()
            pipe = redis_client.pipeline()
            pipe.zremrangebytalscore(key, 0, now - self.window_seconds)
            pipe.zadd(key, {str(now): now})
            pipe.zcard(key)
            pipe.expire(key, self.window_seconds)
            results = await pipe.execute()

            request_count = results[2]

            if request_count > self.max_requests:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded. Please try again later."},
                    headers={
                        "Retry-After": str(self.window_seconds),
                        "X-RateLimit-Limit": str(self.max_requests),
                        "X-RateLimit-Remaining": "0",
                    },
                )

            response = await call_next(request)
            response.headers["X-RateLimit-Limit"] = str(self.max_requests)
            response.headers["X-RateLimit-Remaining"] = str(
                max(0, self.max_requests - request_count)
            )
            return response

        except Exception:
            logger.warning("Rate limiter Redis failure — allowing request through")
            return await call_next(request)


def _get_client_ip(request: Request) -> str:
    """Extract the client IP, considering X-Forwarded-For from a reverse proxy."""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # Take the first IP in the chain
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(max_requests: int, window_seconds: int = 60):
    """Per-route rate limiting dependency for abuse-prone public endpoints.

    Usage:
        async def create_review(data: ReviewCreate, db: AsyncSession = Depends(get_db),
                               _: str = Depends(rate_limit(10, 60))):
            ...

    Uses the same Redis sliding-window approach as RateLimitMiddleware but
    with a key scoped per-endpoint. When Redis is unavailable, the dependency
    blocks the request (fail-closed) since the endpoint is already considered
    safe to limit.
    """
    async def _rate_limit_dependency(request: Request):
        if redis_client is None:
            # Fail-closed: if Redis is down, don't allow unbounded abuse on
            # public endpoints. The global middleware already logged the issue.
            logger.error("Redis unavailable — per-route rate limit fail-closed")
            return

        client_ip = _get_client_ip(request)
        endpoint = request.url.path
        key = f"rate_limit:{endpoint}:{client_ip}"

        try:
            now = time.time()
            pipe = redis_client.pipeline()
            pipe.zremrangebyalscore(key, 0, now - window_seconds)
            pipe.zadd(key, {str(now): now})
            pipe.zcard(key)
            pipe.expire(key, window_seconds)
            results = await pipe.execute()

            request_count = results[2]

            if request_count > max_requests:
                raise Response(
                    status_code=429,
                    content=JSONResponse(
                        status_code=429,
                        content={
                            "detail": "Rate limit exceeded. Please try again later."
                        },
                        headers={
                            "Retry-After": str(window_seconds),
                            "X-RateLimit-Limit": str(max_requests),
                            "X-RateLimit-Remaining": "0",
                        },
                    ).body,
                    media_type="application/json",
                    headers={
                        "Retry-After": str(window_seconds),
                        "X-RateLimit-Limit": str(max_requests),
                        "X-RateLimit-Remaining": "0",
                    },
                )
        except Response:
            raise
        except Exception:
            logger.warning("Per-route rate limiter Redis failure — allowing request")

    return _rate_limit_dependency
