#!/bin/bash
# ─── Cartunez VPS Deployment Script ─────────────────────────────────────────────
# Usage: chmod +x deploy.sh && ./deploy.sh
# Run from repo root on your VPS after cloning

set -e

DOMAIN="cartunez.in"
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$REPO_DIR/backend"
FRONTEND_DIR="$REPO_DIR/frontend"

echo "=== Cartunez Deployment ==="
echo "Domain:     $DOMAIN"
echo "Repo:       $REPO_DIR"
echo "Backend:    $BACKEND_DIR"
echo "Frontend:   $FRONTEND_DIR"

# 0. Preflight checks
if [ ! -f "$REPO_DIR/.env" ]; then
    echo "ERROR: .env file not found. Copy .env.example to .env and fill in your values."
    exit 1
fi

# 1. System dependencies
echo "[1/8] Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq nginx certbot python3-certbot-nginx curl git

# 2. Docker
echo "[2/8] Ensuring Docker is installed..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
fi
if ! docker compose version &> /dev/null; then
    apt-get install -y -qq docker-compose-plugin
fi

# 3. Build frontend
echo "[3/8] Building frontend..."
cd "$FRONTEND_DIR"
npm ci --silent
if [ ! -f .env.production ]; then
    cat > .env.production <<EOF
VITE_MEDUSA_URL=
VITE_API_URL=
VITE_MEILISEARCH_URL=
VITE_MEILISEARCH_KEY=
VITE_MEDUSA_PUBLISHABLE_KEY=pk_01KVBSWHFD53JWKRBEHS43FDBJ
EOF
fi
npx vite build --mode production

# 4. Deploy frontend build to nginx serving directory
echo "[4/8] Deploying frontend to /var/www/cartunez..."
mkdir -p /var/www/cartunez/dist
cp -r "$FRONTEND_DIR/dist/"* /var/www/cartunez/dist/
chown -R www-data:www-data /var/www/cartunez

# 5. Nginx configs
echo "[5/8] Configuring nginx..."
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

for conf in cartunez api commerce shop search; do
    if [ -f "$BACKEND_DIR/nginx/${conf}.conf" ]; then
        cp "$BACKEND_DIR/nginx/${conf}.conf" "/etc/nginx/sites-available/${conf}"
        ln -sf "/etc/nginx/sites-available/${conf}" "/etc/nginx/sites-enabled/${conf}"
    fi
done

cp "$BACKEND_DIR/nginx/nginx.conf" /etc/nginx/nginx.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 6. Start backend services
echo "[6/8] Starting Docker services..."
cd "$BACKEND_DIR"
docker compose up -d --build

# 7. Run migrations
echo "[7/8] Running database migrations..."
sleep 10
docker compose exec medusa node migrate.js || echo "Medusa migration skipped or already applied"
docker compose exec fastapi alembic upgrade head || echo "FastAPI migration skipped or already applied"

# 8. SSL (Let's Encrypt)
echo "[8/8] Setting up SSL..."
read -p "Do you want to set up SSL now? (y/n): " setup_ssl
if [ "$setup_ssl" = "y" ]; then
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" -d "api.$DOMAIN" -d "shop.$DOMAIN" -d "commerce.$DOMAIN" --non-interactive --agree-tos --email "adnan@$DOMAIN"
    echo "SSL configured!"
else
    echo "Skipping SSL. Run later: certbot --nginx -d $DOMAIN -d www.$DOMAIN -d api.$DOMAIN -d shop.$DOMAIN -d commerce.$DOMAIN"
fi

echo ""
echo "=== Deployment Complete ==="
echo "Frontend:  https://$DOMAIN"
echo "Store:     https://shop.$DOMAIN"
echo "Admin:     https://$DOMAIN/admin/"
echo "API:       https://api.$DOMAIN/api/v1/health"
echo "Commerce:  https://commerce.$DOMAIN/health"
echo ""
echo "Docker services:"
cd "$BACKEND_DIR"
docker compose ps --format "table {{.Name}}\t{{.Status}}"
