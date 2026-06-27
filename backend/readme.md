# Cartunez Backend

Docker services for the Cartunez e-commerce platform.

## Services

| Service | Port | Description |
|---------|------|-------------|
| postgres | 5432 | PostgreSQL 16 (internal only) |
| redis | 6379 | Redis 7 cache (internal only) |
| meilisearch | 7700 | Search engine (internal only) |
| medusa | 9000 | Commerce API + Admin panel |
| fastapi | 8000 | Custom business APIs |

## Quick Start

```bash
# From repo root
cp .env.example .env
# Edit .env with your values

cd backend
docker compose build --no-cache
docker compose up -d

# Run migrations
docker compose exec medusa node migrate.js
docker compose exec fastapi alembic upgrade head
```

## Nginx

Configs in `nginx/` are for system-level nginx. Install them to `/etc/nginx/sites-available/`.

## API Key

Admin endpoints require `X-API-Key` header. Set `API_ADMIN_KEY` in `.env`.
