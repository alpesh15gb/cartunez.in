# CARTUNEZ PRODUCTION DEPLOYMENT - FINAL CHECKLIST

## ✅ COMPLETED (LOCAL)
- Frontend homepage fix committed & pushed to git (commit: 6c9d5db)
- Backend services running in Docker
- Environment variables configured
- All integration tests passing

## 🚀 DEPLOYMENT ACTIONS (Run on Server)

### Step 1: SSL Certificate
```bash
certbot certonly --standalone -d cartunez.in -d www.cartunez.in
ls -la /etc/letsencrypt/live/cartunez.in/
```

### Step 2: Nginx Config
```bash
# Remove old broken config
rm -f /etc/nginx/sites-enabled/cartunez

# Create new config (see NGINX_CONFIG.txt)
# Then test and reload:
nginx -t
systemctl reload nginx
```

### Step 3: Update Frontend
```bash
cd /var/www/cartunez/frontend
git pull origin main
npm install
npm run build
```

### Step 4: Restart All Services
```bash
cd /var/www/cartunez/backend
docker compose down
docker compose up -d
sleep 30
docker compose ps
```

### Step 5: Verify
```bash
curl -I https://cartunez.in
curl -s https://shop.cartunez.in/health
```

## 🎯 SUCCESS = Homepage visible at https://cartunez.in
