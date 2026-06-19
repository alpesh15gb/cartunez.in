#!/bin/bash
set -e

echo "=== Cartunez Deployment ==="
echo "Starting deployment at $(date)"

# Check if docker compose is available
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    exit 1
fi

# Pull latest changes (if in a git repo)
if [ -d .git ]; then
    echo "Pulling latest changes..."
    git pull origin main || echo "Warning: git pull failed, continuing with current code"
fi

# Build containers
echo "Building containers..."
docker compose build --no-cache

# Stop existing services
echo "Stopping services..."
docker compose down

# Start database services first
echo "Starting database services..."
docker compose up -d postgres redis meilisearch

echo "Waiting for databases to be ready..."
sleep 10

# Start all services
echo "Starting all services..."
docker compose up -d

echo "Waiting for services to be ready..."
sleep 15

# Run migrations
echo "Running migrations..."
docker compose exec -T medusa npm run migration:run 2>/dev/null || echo "Medusa migrations: already up to date or not configured"
docker compose exec -T fastapi alembic upgrade head 2>/dev/null || echo "FastAPI migrations: already up to date or not configured"

# Health check
echo "Running health checks..."
sleep 5

for service in postgres redis meilisearch medusa fastapi website storefront; do
    STATUS=$(docker compose ps --format json | grep -o "\"$service\"[^}]*" | grep -o '"status":"[^"]*"' | head -1)
    echo "  $service: $STATUS"
done

echo ""
echo "=== Deployment Complete ==="
echo "Website:    https://cartunez.in"
echo "Store:      https://shop.cartunez.in"
echo "API:        https://api.cartunez.in"
echo "Commerce:   https://commerce.cartunez.in"
echo ""
echo "Completed at $(date)"
