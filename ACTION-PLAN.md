# 🚀 CARTUNEZ LAUNCH ACTION PLAN
**Status:** Ready to deploy in 2-3 hours  
**Confidence:** 92%

---

## CRITICAL FIXES (15 minutes)

### 1. Update Razorpay Production Keys
**File:** `E:\cartunez\backend\.env`

Replace test keys with production from https://dashboard.razorpay.com/settings/api-keys (LIVE MODE)

```
RAZORPAY_KEY_ID=rzp_live_XXXXX
RAZORPAY_KEY_SECRET=[actual_secret]
RAZORPAY_WEBHOOK_SECRET=whsec_[actual]
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_XXXXX
```

**Time:** 5 minutes

### 2. Complete Onboarding Links
**File:** `src/lib/data/onboarding.ts`

Ensure no "CHANGE_ME" or placeholder values. All links point to actual pages.

**Time:** 10 minutes

---

## HIGH PRIORITY FIXES (75 minutes)

| # | File | Fix | Time |
|---|------|-----|------|
| 1 | checkout/shipping/index.tsx:89 | Add `cart.id` to useEffect deps | 5 min |
| 2 | products/templates/index.tsx | Add null check for product | 15 min |
| 3 | product-reviews/index.tsx | Wrap fetch in try-catch | 10 min |
| 4 | customer-reviews/index.tsx | Add skeleton loader | 15 min |
| 5 | Multiple | Test mobile (iPhone/iPad/Android) | 30 min |

---

## BUILD & DEPLOY (40 minutes)

```bash
cd E:\cartunez\frontend
npm run build          # 10 min
npm run lint          # 5 min
# Test on localhost  # 5 min
git add src/
git commit -m "fix: production hardening"
git push origin main  # 5 min

# Deploy to server
# Copy .next to /var/www/cartunez/frontend/
# Update .env on server with Razorpay keys
# Restart: docker compose down && docker compose up -d
# Verify: curl https://cartunez.in/
```

---

## POST-LAUNCH (24 hours)

✅ Monitor error logs  
✅ Test checkout → payment  
✅ Verify all pages load  
✅ Check mobile responsive  

---

## DOCUMENTS CREATED

1. **PRODUCTION-READINESS-FINAL.md** - Comprehensive audit with all issues
2. **SEO-LLM-STRATEGY.md** - 750+ line SEO implementation guide
3. **DEPLOYMENT-GUIDE.md** - Step-by-step deployment instructions
4. **ACTION-PLAN.md** - This file

---

**Total time: 2-3 hours from now to LIVE ✅**
