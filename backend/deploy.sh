#!/bin/bash
# ─── Cartunez VPS Deployment Script ─────────────────────────────────────────────
# Run on your VPS (Ubuntu/Debian) after cloning the repo
# Usage: chmod +x deploy.sh && ./deploy.sh

set -e

DOMAIN="cartunez.in"
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$APP_DIR/car"

echo "=== Cartunez Deployment ==="
echo "Domain: $DOMAIN"
echo "App Dir: $APP_DIR"

# 1. System dependencies
echo "[1/7] Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq nginx certbot python3-certbot-nginx curl

# 2. Docker
echo "[2/7] Ensuring Docker is installed..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
fi
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    apt-get install -y -qq docker-compose-plugin
fi

# 3. Build frontend
echo "[3/7] Building frontend..."
cd "$FRONTEND_DIR"
if [ -f package.json ]; then
    npm ci --silent
    # Set production env vars
    export VITE_MEDUSA_URL="https://$DOMAIN"
    export VITE_API_URL="https://$DOMAIN"
    export VITE_MEILISEARCH_URL="https://$DOMAIN"
    export VITE_MEDUSA_PUBLISHABLE_KEY="pk_01KVBSWHFD53JWKRBEHS43FDBJ"
    npx vite build
fi

# 4. Deploy frontend build to nginx serving directory
echo "[4/7] Deploying frontend to /var/www/cartunez..."
mkdir -p /var/www/cartunez
cp -r "$FRONTEND_DIR/dist/"* /var/www/cartunez/dist/
chown -R www-data:www-data /var/www/cartunez

# 5. Nginx config
echo "[5/7] Configuring nginx..."
cp "$APP_DIR/nginx/cartunez.conf" /etc/nginx/sites-available/cartunez
ln -sf /etc/nginx/sites-available/cartunez /etc/nginx/sites-enabled/cartunez
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 6. Start backend services
echo "[6/7] Starting Docker services..."
cd "$APP_DIR"
docker compose up -d --build

# 7. SSL (Let's Encrypt)
echo "[7/7] Setting up SSL..."
read -p "Do you want to set up SSL now? (y/n): " setup_ssl
if [ "$setup_ssl" = "y" ]; then
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "adnan@$DOMAIN"
    echo "SSL configured! Site is live at https://$DOMAIN"
else
    echo "Skipping SSL. Run later: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    echo "Site is live at http://$DOMAIN"
fi

echo ""
echo "=== Deployment Complete ==="
echo "Frontend: https://$DOMAIN (or http://$DOMAIN)"
echo "Admin:    https://$DOMAIN/admin/"
echo "API Docs: https://$DOMAIN/api/v1/health"
echo ""
echo "Services running:"
docker compose ps --format "table {{.Name}}\t{{.Status}}"
