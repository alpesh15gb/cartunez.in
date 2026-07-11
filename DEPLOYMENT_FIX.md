# Cartunez Deployment Fix Guide

## Issue 1: SSL Certificate Missing
```bash
# On server (root@srv1236095)
# The cert exists in cartunez.in-0001, need to symlink it
cd /etc/letsencrypt/live

# Create symlink for cartunez.in pointing to cartunez.in-0001
ln -sfn cartunez.in-0001 cartunez.in

# Verify
ls -la | grep cartunez
ls -la cartunez.in/fullchain.pem

# Test nginx config
nginx -t

# Reload nginx
systemctl reload nginx
```

## Issue 2: npm Lock File Out of Sync
```bash
# On local machine
cd frontend
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "fix: regenerate package-lock.json"
git push origin main
```

## Issue 3: Docker Build Failure
```bash
# On server
cd /var/www/cartunez/backend
git pull origin main
docker compose down
docker compose build --no-cache frontend medusa
docker compose up -d
docker compose logs -f frontend
```

## Verification Checklist
- [ ] SSL certs are accessible
- [ ] nginx config validates
- [ ] Frontend builds successfully
- [ ] Products load from Medusa API
- [ ] Homepage displays correctly
