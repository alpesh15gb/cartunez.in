#!/bin/bash
# ─── Cartunez VPS Deployment Script ─────────────────────────────────────────────
# Usage: chmod +x deploy.sh && ./deploy.sh
# Run on your VPS after cloning the repo

set -e

DOMAIN="cartunez.in"
APP_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Cartunez Deployment ==="
DOMAIN="cartunez.in"
# Go up two levels from backend/ to repo root
APP_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
echo "App root: $APP_DIR"

# 1. Install system dependencies
echo "[1/7] Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq nginx certbot python3-certbot-nginx curl git

# 2. Docker
echo "[2/7] Ensuring Docker is installed..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
fi
if ! docker compose version &> /dev/null; then
    apt-get install -y -qq docker-compose-plugin
fi

# 3. Build frontend with production env vars
echo "[3/7] Building frontend..."
cd "$APP_DIR/frontend"
npm ci --silent
export VITE_MEDUSA_URL="https://$DOMAIN"
export VITE_API_URL="https://$DOMAIN"
export VITE_MEILISEARCH_URL="https://$DOMAIN"
export VITE_MEDUSA_PUBLISHABLE_KEY="pk_01KVBSWHFD53JWKRBEHS43FDBJ"
npx vite build

# 4. Deploy frontend build to nginx serving directory
echo "[4/7] Deploying frontend to /var/www/cartunez..."
mkdir -p /var/www/cartunez
cp -r "$APP_DIR/frontend/dist/"* /var/www/cartunez/
chown -R www-data:www-data /var/www/cartunez

# 5. Nginx config
echo "[5/7] Configuring nginx..."
cp "$APP_DIR/backend/nginx/cartunez.conf" /etc/nginx/sites-available/cartunez
ln -sf /etc/nginx/sites-available/cartunez /etc/nginx/sites-enabled/cartunez
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 6. Start backend services (Docker)
echo "[6/7] Starting Docker services..."
cd "$APP_DIR"
docker compose up -d --build

# 7. SSL via Let's Encrypt
echo "[7/7] Setting up SSL..."
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "adnan@$DOMAIN" 2>&1 || {
    echo "SSL setup skipped or failed. Run manually: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
}
systemctl reload nginx

echo ""
echo "=== Deployment Complete ==="
echo "Frontend:   https://$DOMAIN"
echo "Admin:      https://$DOMAIN/admin/"
echo "API Docs:   https://$DOMAIN/api/v1/health"
echo ""
echo "Docker services:"
docker compose ps --format "table {{.Name}}\t{{.Status}}"