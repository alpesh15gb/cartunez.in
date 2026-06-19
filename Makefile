.PHONY: up down build logs migrate seed setup backup restore restart status clean

# Default target
all: setup

# Start all services
up:
	docker compose up -d

# Stop all services
down:
	docker compose down

# Build all containers
build:
	docker compose build --no-cache

# Rebuild a specific service
build-%:
	docker compose build --no-cache $*

# View logs
logs:
	docker compose logs -f

# View logs for a specific service
logs-%:
	docker compose logs -f $*

# Restart all services
restart:
	docker compose restart

# Restart a specific service
restart-%:
	docker compose restart $*

# Run database migrations (Medusa)
migrate-medusa:
	docker compose exec medusa npm run migration:run

# Run database migrations (FastAPI/Alembic)
migrate-api:
	docker compose exec fastapi alembic upgrade head

# Run all migrations
migrate: migrate-medusa migrate-api

# Seed database
seed:
	docker compose exec medusa npm run seed

# Full setup (first time)
setup:
	@if [ ! -f .env ]; then cp .env.example .env 2>/dev/null || echo ".env already exists"; fi
	docker compose build --no-cache
	docker compose up -d postgres redis meilisearch
	@echo "Waiting for databases to be ready..."
	@sleep 10
	docker compose up -d
	@echo "Waiting for all services to be ready..."
	@sleep 15
	$(MAKE) migrate
	@echo "Setup complete! Access the site at http://localhost:3000"
	@echo "Store at http://localhost:3001"
	@echo "Medusa admin at http://localhost:9000/app"

# Backup database
backup:
	@bash scripts/backup.sh

# Restore database
restore:
	@bash scripts/restore.sh

# Check service status
status:
	docker compose ps

# Clean up (remove containers, volumes, images)
clean:
	docker compose down -v --rmi all

# Clean build cache
clean-build:
	docker builder prune -f

# Pull latest images
pull:
	docker compose pull

# Update and restart
update: pull build migrate restart
	@echo "Update complete!"

# Development mode (with hot reload)
dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production mode
prod:
	docker compose -f docker-compose.yml up -d --build
	$(MAKE) migrate
	@echo "Production deployment complete!"
