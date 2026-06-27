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
echo "[1/9] Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq nginx certbot python3-certbot-nginx curl git

# 2. Docker
echo "[2/9] Ensuring Docker is installed..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
fi
if ! docker compose version &> /dev/null; then
    apt-get install -y -qq docker-compose-plugin
fi

# 3. Build frontend
echo "[3/9] Building frontend..."
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
echo "[4/9] Deploying frontend to /var/www/cartunez..."
mkdir -p /var/www/cartunez/dist
cp -r "$FRONTEND_DIR/dist/"* /var/www/cartunez/dist/
chown -R www-data:www-data /var/www/cartunez

# 5. Install HTTP-only nginx config first (no SSL yet)
echo "[5/9] Configuring nginx (HTTP-only for certbot)..."
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled /var/www/certbot

# Remove old cartunez configs if they reference missing SSL certs
rm -f /etc/nginx/sites-enabled/cartunez.conf /etc/nginx/sites-enabled/cartunez
rm -f /etc/nginx/sites-enabled/api /etc/nginx/sites-enabled/search
rm -f /etc/nginx/sites-enabled/commerce /etc/nginx/sites-enabled/shop

# Write HTTP-only config for initial setup
cat > /etc/nginx/sites-available/cartunez <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name cartunez.in www.cartunez.in;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }

    root /var/www/cartunez/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 256;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location ~* \.(jpg|jpeg|png|gif|webp|svg|ico|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public";
    }

    location /store/ {
        proxy_pass http://127.0.0.1:9000/store/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:9000/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /auth/ {
        proxy_pass http://127.0.0.1:9000/auth/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:9000/health;
        proxy_set_header Host $host;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8005/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 30s;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:9000/uploads/;
        expires 30d;
        add_header Cache-Control "public";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ /\. {
        deny all;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/cartunez /etc/nginx/sites-enabled/cartunez
nginx -t && systemctl reload nginx

# 6. Start backend services
echo "[6/9] Starting Docker services..."
cd "$BACKEND_DIR"
docker compose up -d --build

# 7. Run migrations
echo "[7/9] Running database migrations..."
sleep 15
docker compose exec medusa node migrate.js || echo "Medusa migration skipped or already applied"
docker compose exec fastapi alembic upgrade head || echo "FastAPI migration skipped or already applied"

# 8. SSL (Let's Encrypt)
echo "[8/9] Setting up SSL..."
read -p "Do you want to set up SSL now? (y/n): " setup_ssl
if [ "$setup_ssl" = "y" ]; then
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "adnan@$DOMAIN" --redirect
    echo "SSL configured for $DOMAIN!"
    echo "For api.$DOMAIN, shop.$DOMAIN, commerce.$DOMAIN — run certbot again after DNS is set up:"
    echo "  certbot --nginx -d api.$DOMAIN -d shop.$DOMAIN -d commerce.$DOMAIN --non-interactive --agree-tos --email adnan@$DOMAIN"
else
    echo "Skipping SSL. Run later: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
fi

# 9. Install full nginx configs (with SSL references) if certs exist
echo "[9/9] Installing full nginx configs..."
if [ -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]; then
    for conf in cartunez api commerce shop search; do
        if [ -f "$BACKEND_DIR/nginx/${conf}.conf" ]; then
            cp "$BACKEND_DIR/nginx/${conf}.conf" "/etc/nginx/sites-available/${conf}"
            ln -sf "/etc/nginx/sites-available/${conf}" "/etc/nginx/sites-enabled/${conf}"
        fi
    done
    nginx -t && systemctl reload nginx
    echo "Full SSL configs installed."
else
    echo "SSL certs not found yet. HTTP-only config remains. Run deploy.sh again after getting certs."
fi

echo ""
echo "=== Deployment Complete ==="
echo "Frontend:  http://$DOMAIN (https after SSL)"
echo "Admin:     http://$DOMAIN/admin/"
echo "API:       http://$DOMAIN/api/v1/health"
echo ""
echo "Docker services:"
cd "$BACKEND_DIR"
docker compose ps --format "table {{.Name}}\t{{.Status}}"
