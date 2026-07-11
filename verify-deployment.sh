#!/bin/bash

echo "==================================="
echo "CARTUNEZ DEPLOYMENT VERIFICATION"
echo "==================================="
echo ""

# Check Docker services
echo "📋 CHECKING DOCKER SERVICES..."
docker compose -f /var/www/cartunez/backend/docker-compose.yml ps
echo ""

# Check if frontend is responding
echo "🌐 CHECKING FRONTEND..."
curl -s -o /dev/null -w "Frontend Status: %{http_code}\n" http://localhost:3001
echo ""

# Check if Medusa API is responding
echo "🏪 CHECKING MEDUSA API..."
curl -s -o /dev/null -w "Medusa Status: %{http_code}\n" http://localhost:9000/health
echo ""

# Check if FastAPI is responding
echo "⚡ CHECKING FASTAPI..."
curl -s -o /dev/null -w "FastAPI Status: %{http_code}\n" http://localhost:8005/health
echo ""

# Check if Meilisearch is responding
echo "🔍 CHECKING MEILISEARCH..."
curl -s -o /dev/null -w "Meilisearch Status: %{http_code}\n" http://localhost:7700/health
echo ""

# Check HTTPS
echo "🔒 CHECKING HTTPS (cartunez.in)..."
curl -s -o /dev/null -w "HTTPS Status: %{http_code}\n" https://cartunez.in
echo ""

# Check if website is live
echo "✅ FINAL CHECK: Visit https://cartunez.in in browser"
echo ""
echo "Expected:"
echo "✅ Homepage displays with design"
echo "✅ Header, hero, categories visible"
echo "✅ No blank page"
echo "✅ No SSL warnings"
echo ""
