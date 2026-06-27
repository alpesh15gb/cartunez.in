#!/bin/bash
set -e

echo "=== Cartunez Initial Setup ==="
echo "Setting up the Cartunez e-commerce platform..."

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "Error: Docker Compose is not available."
    exit 1
fi

echo "Docker: $(docker --version)"
echo "Docker Compose: $(docker compose version)"

# Copy environment file
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo ""
    echo "IMPORTANT: Edit .env with your actual configuration before continuing."
    echo "At minimum, set POSTGRES_PASSWORD, REDIS_PASSWORD, JWT_SECRET, and COOKIE_SECRET."
    echo ""
    echo "Press Enter to continue after editing .env..."
    read
fi

# Build all containers
echo "Building containers (this may take a while)..."
docker compose build --no-cache

# Start infrastructure services
echo "Starting infrastructure services..."
docker compose up -d postgres redis meilisearch

echo "Waiting for databases to initialize (30 seconds)..."
sleep 30

# Start application services
echo "Starting application services..."
docker compose up -d

echo "Waiting for all services to be ready (30 seconds)..."
sleep 30

# Run migrations
echo "Running database migrations..."
docker compose exec -T medusa node migrate.js 2>/dev/null || echo "Medusa migrations: check manually"
docker compose exec -T fastapi alembic upgrade head 2>/dev/null || echo "FastAPI migrations: check manually"

# Verify services
echo ""
echo "=== Service Status ==="
docker compose ps

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Access your platform:"
echo "  Medusa Admin:  http://localhost:9000/app"
echo "  API:           http://localhost:8000/health"
echo "  Meilisearch:   http://localhost:7700"
echo ""
echo "Next steps:"
echo "  1. Access Medusa admin at http://localhost:9000/app"
echo "  2. Create your first admin user"
echo "  3. Add products, categories, and brands"
echo "  4. Configure payment (Razorpay) in Medusa settings"
echo "  5. Build frontend: cd car && npm ci && npm run build"
echo "  6. Deploy to nginx: sudo bash deploy.sh"
echo ""
echo "For production deployment:"
echo "  1. Edit .env with production values"
echo "  2. Run: sudo bash deploy.sh"
