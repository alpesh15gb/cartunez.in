# CARTUNEZ PRODUCTION DEPLOYMENT - HOSTINGER DOCKER + NGINX

## QUICK DEPLOYMENT CHECKLIST

### Step 1: SSH & Navigate
```bash
ssh root@srv1236095
cd /var/www/cartunez
```

### Step 2: Pull Latest Code
```bash
cd frontend
git pull origin main
git log --oneline -1
```

### Step 3: Fix SSL Certificate (cartunez.in)
```bash
# Check if certificate exists
ls -la /etc/letsencrypt/live/cartunez.in/

# If missing, create it
certbot certonly --standalone -d cartunez.in -d www.cartunez.in

# Verify
ls -la /etc/letsencrypt/live/cartunez.in/
```

### Step 4: Fix Nginx Configuration
```bash
# Test current config
nginx -t

# If error, regenerate cartunez.conf
cat > /etc/nginx/sites-available/cartunez.conf << 'NGINX_EOF'
upstream frontend { server 127.0.0.1:3001; }
upstream medusa { server 127.0.0.1:9000; }
upstream fastapi { server 127.0.0.1:8005; }
upstream meilisearch { server 127.0.0.1:7700; }

server {
    listen 80;
    server_name cartunez.in www.cartunez.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cartunez.in www.cartunez.in;
    ssl_certificate /etc/letsencrypt/live/cartunez.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cartunez.in/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name shop.cartunez.in;
    ssl_certificate /etc/letsencrypt/live/cartunez.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cartunez.in/privkey.pem;
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://medusa;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name api.cartunez.in;
    ssl_certificate /etc/letsencrypt/live/cartunez.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cartunez.in/privkey.pem;
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://fastapi;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name search.cartunez.in;
    ssl_certificate /etc/letsencrypt/live/cartunez.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cartunez.in/privkey.pem;
    
    location / {
        proxy_pass http://meilisearch;
        proxy_set_header Host $host;
    }
}
NGINX_EOF

# Test and reload
nginx -t
systemctl reload nginx
```

### Step 5: Restart Backend Services
```bash
cd /var/www/cartunez/backend
docker compose down
docker compose up -d
sleep 30
docker compose ps
# All should show "Up"
```

### Step 6: Rebuild & Restart Frontend
```bash
cd /var/www/cartunez/frontend
npm install
npm run build
cd /var/www/cartunez/backend
docker compose build frontend
docker compose restart frontend
```

### Step 7: Verify Deployment
```bash
# Test URLs
curl -I https://cartunez.in
curl -s https://shop.cartunez.in/health
curl -s https://api.cartunez.in/health
```

### Step 8: Check in Browser
```
https://cartunez.in
# Should show: Full homepage with design (NOT blank page)
```

---

## TROUBLESHOOTING

| Issue | Fix |
|-------|-----|
| SSL cert missing | `certbot certonly --standalone -d cartunez.in` |
| Nginx won't start | `nginx -t` to see error, then fix config |
| Frontend blank | `docker compose logs frontend` to debug |
| Services not up | `docker compose ps` and `docker compose logs` |
| Port conflict | `lsof -i :3001` to find what's using it |

---

## SUCCESS INDICATORS

✅ `https://cartunez.in` shows full homepage with design  
✅ No SSL warnings  
✅ All Docker services UP (6/6)  
✅ No errors in browser console (F12)  
✅ Can navigate to products  

---

## COMMIT & PUSH VERIFICATION

✅ Frontend code pushed: `6c9d5db fix: homepage always renders design`  
✅ Homepage never returns null anymore  
✅ Ready for production deployment  

