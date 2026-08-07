FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies for asyncpg compilation
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Clean up build deps — they are no longer needed in the final image
RUN apt-get purge -y --auto-remove gcc || true

FROM python:3.12-slim

RUN groupadd -r cartunez && useradd --no-log-init -r -g cartunez cartunez

WORKDIR /app

COPY --from=builder --chown=cartunez:cartunez /install /usr/local

COPY --chown=cartunez:cartunez . .

USER cartunez

# Run as non-root with bind to the configured port
ENV PORT=8000

EXPOSE 8000

# Use 4 workers for production throughput; log level controlled by ENVIRONMENT
CMD ["sh", "-c", "WORKERS=${WORKERS:-4} uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --workers $WORKERS --log-level ${LOG_LEVEL:-info}"]
