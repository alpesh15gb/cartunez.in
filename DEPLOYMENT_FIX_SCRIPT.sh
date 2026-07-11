#!/bin/bash
# Cartunez Production Deployment Fix
# Run on: root@srv1236095:/var/www/cartunez

set -e

echo "=== STEP 1: Fix SSL Certificate Symlink ==="
cd /etc/letsencrypt/live

# Remove broken symlink if exists
if [ -L cartunez.in ]; then
  echo "Removing old cartunez.in symlink..."
  rm cartunez.in
fi

# Create proper symlink to cartunez.in-0001
if [ ! -d cartunez.in ]; then
  echo "Creating symlink: cartunez.in -> cartunez.in-0001"
  ln -s cartunez.in-0001 cartunez.in
else
  echo "cartunez.in already exists as directory, good!"
fi

# Verify
echo "Verifying SSL certificates..."
ls -la /etc/letsencrypt/live/cartunez.in/fullchain.pem
ls -la /etc/letsencrypt/live/cartunez.in/privkey.pem

echo ""
echo "=== STEP 2: Update Nginx Configuration ==="
# Update nginx config to use correct cert path
sed -i 's|/etc/letsencrypt/live/cartunez.in-0001/|/etc/letsencrypt/live/cartunez.in/|g' /etc/nginx/sites-available/*.conf

# Test nginx config
echo "Testing nginx configuration..."
nginx -t

echo ""
echo "=== STEP 3: Pull Latest Code & Dependencies ==="
cd /var/www/cartunez
git pull origin main

echo ""
echo "=== STEP 4: Docker Build & Deploy ==="
cd /var/www/cartunez/backend

# Stop containers
echo "Stopping containers..."
docker compose down

# Remove old images to force rebuild
echo "Rebuilding with latest code..."
docker compose build --no-cache frontend medusa fastapi

# Start everything
echo "Starting services..."
docker compose up -d

# Wait for services
echo "Waiting for services to be healthy..."
sleep 30

# Check status
docker compose ps

echo ""
echo "=== STEP 5: Verify All Services ==="
docker compose logs -n 50 frontend
docker compose logs -n 50 medusa

echo ""
echo "=== STEP 6: Reload Nginx ==="
systemctl reload nginx

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "Check: https://cartunez.in"
