# Deployment Runbook

**Target:** Production deployment of Cartunez platform on a Linux host with Docker.

---

## Prerequisites

- Docker Engine 24.x or later
- Docker Compose v2 plugin
- Root or sudo access to the host
- nginx installed on the host (for TLS termination and reverse proxy)
- SSL certificates for `cartunez.in` and `www.cartunez.in` (Let's Encrypt recommended)
- Environment file (`.env.production`) with all required secrets

## Server Setup

### 1. Install Docker

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER
# Log out and back in for group changes to take effect
```

### 2. Configure SSL

```bash
# Using Let's Encrypt + certbot
sudo apt-get install -y certbot
sudo certbot certonly --standalone -d cartunez.in -d www.cartunez.in

# Certificates will be at:
# /etc/letsencrypt/live/cartunez.in/fullchain.pem
# /etc/letsencrypt/live/cartunez.in/privkey.pem
```

Set up auto-renewal:
```bash
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### 3. Copy nginx config

```bash
sudo cp cartunez.nginx.conf /etc/nginx/sites-available/cartunez
sudo ln -s /etc/nginx/sites-available/cartunez /etc/nginx/sites-enabled/cartunez

# Create the ACME challenge directory
sudo mkdir -p /var/www/certbot

# Mount SSL certificates into the expected nginx path
# Either symlink or update the nginx config paths
sudo mkdir -p /etc/nginx/ssl
sudo ln -sf /etc/letsencrypt/live/cartunez.in/fullchain.pem /etc/nginx/ssl/fullchain.pem
sudo ln -sf /etc/letsencrypt/live/cartunez.in/privkey.pem /etc/nginx/ssl/privkey.pem
sudo ln -sf /etc/letsencrypt/live/cartunez.in/chain.pem /etc/nginx/ssl/chain.pem

# Test and reload nginx
sudo nginx -t && sudo nginx -s reload
```

## Application Deployment

### 1. Prepare environment files

```bash
# Copy the root .env.example to .env.production
cp .env.example .env.production
# Edit .env.production and fill in all secrets

# Copy FastAPI .env.example
cp backend/cartunez-api/.env.example backend/cartunez-api/.env.production
# Edit and fill in secrets
```

**Critical secrets to set:**
- `POSTGRES_PASSWORD` — strong PostgreSQL password
- `REDIS_PASSWORD` — strong Redis password
- `JWT_SECRET` — 32+ random characters for Medusa
- `COOKIE_SECRET` — 32+ random characters for Medusa
- `JWT_SECRET_KEY` — 32+ random characters for FastAPI
- `API_ADMIN_KEY` — random string for FastAPI admin access
- `MEILI_MASTER_KEY` — Meilisearch master key
- All payment provider keys (when switching from manual)

### 2. Deploy

```bash
cd backend

# Build images
docker compose build

# Start services
docker compose up -d

# Verify
docker compose ps
docker compose logs --tail 100 medusa
docker compose logs --tail 100 fastapi
docker compose logs --tail 100 frontend
```

### 3. Run database migrations

```bash
# FastAPI migrations
docker compose run --rm fastapi alembic upgrade head

# Medusa migrations
docker compose exec medusa npx medusa migrations run
```

### 4. Verify deployment

```bash
# Check health endpoints
curl -k https://cartunez.in/health        # Medusa via nginx
curl http://localhost:8000/health          # FastAPI direct
curl http://localhost:9000/health          # Medusa direct

# Check readiness (Medusa)
curl http://localhost:9000/ready
```

### 5. Seed initial data (if needed)

```bash
# Medusa seed data
docker compose exec medusa npm run seed

# FastAPI seed data
docker compose exec fastapi python seed-vehicles.py
```

## Updates & Rollbacks

### Rolling update

```bash
cd backend
docker compose pull  # if using remote images
docker compose build --pull
docker compose up -d
```

### Rollback

```bash
# Stop services
docker compose down

# Checkout previous release
git checkout <previous-tag>

# Rebuild and restart
docker compose build
docker compose up -d
```

## Monitoring

### Log access

```bash
# Tail all logs
docker compose logs -f

# Tail a specific service
docker compose logs -f fastapi
docker compose logs -f medusa
docker compose logs -f frontend

# View logs with timestamps
docker compose logs -f --timestamps fastapi
```

### Container health

```bash
# Check container status
docker compose ps

# Check health check status
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

### Database backups

```bash
# Backup
docker compose exec postgres pg_dump -U postgres cartunez > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker compose exec -T postgres psql -U postgres cartunez < backup.sql
```

### Redis backup

```bash
# Backup (with AOF persistence enabled in compose)
docker compose exec redis redis-cli BGSAVE
docker compose cp redis:/data/dump.rdb ./redis-backup_$(date +%Y%m%d_%H%M%S).rdb
```

## Troubleshooting

### Frontend can't reach Medusa

1. Verify Medusa is running: `docker compose ps`
2. Check Medusa health: `curl http://localhost:9000/health`
3. Verify CORS origins in `medusa-config.js` include your domain
4. Check nginx proxy configuration

### FastAPI can't connect to database

1. Verify PostgreSQL is running: `docker compose ps`
2. Check `DATABASE_URL` environment variable
3. Verify database migrations have run

### Slow frontend builds

- Ensure `npm ci` is used in the Dockerfile (not `npm install`)
- Check that `node_modules` is cached properly in Docker layer

### Rate limiting too aggressive

- Adjust `RATE_LIMIT_PER_MINUTE` in the FastAPI environment
- For public endpoints (reviews, leads), the per-route limit is 10/min
