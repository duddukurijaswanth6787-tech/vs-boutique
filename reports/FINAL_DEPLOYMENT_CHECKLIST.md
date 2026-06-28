# Final Deployment Checklist — VS Boutique

> **Application**: VS Boutique — Multi-vendor fashion marketplace
> **Date**: 2026-06-26
> **Status**: ✅ Passes PAT. Items below must be addressed before production deployment.

---

## 🔴 Critical (Must Fix Before Deployment)

| # | Item | File/Area | Evidence | Action |
|---|---|---|---|---|
| C-01 | **Rotate AWS IAM credentials** | `backend/.env:12-13` | `AKIAVZBUFMUU6YGVTPX7` + secret key committed | Rotate keys in AWS IAM; remove from `.env`; use AWS Secrets Manager or env vars at deploy |
| C-02 | **Replace hardcoded API URL** | `web/src/context/AuthContext.jsx:6` | `http://10.10.1.25:3005` hardcoded | Replace with `import.meta.env.VITE_API_URL \|\| 'http://localhost:3005'` |
| C-03 | **Remove `.env` from version control** | `backend/.env` | Contains AWS keys, JWT secret, DB credentials, Razorpay placeholders | Add `.env` to `.gitignore`; use `.env.example` for template |

## 🟡 High (Should Fix Before Deployment)

| # | Item | File/Area | Evidence | Action |
|---|---|---|---|---|
| H-01 | **Replace weak JWT secret** | `backend/.env:3` | `JWT_SECRET=supersecretjwtkey` | Use `openssl rand -hex 64` or equivalent |
| H-02 | **Configure real SMTP for email** | `backend/src/services/emailService.js` | Falls back to Ethereal test accounts (no real SMTP configured) | Add `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` env vars |
| H-03 | **Remove placeholder Razorpay keys** | `backend/.env:9-11` | `RAZORPAY_KEY_ID=rzp_test_your_key_id` | Replace with production Razorpay keys from dashboard |
| H-04 | **Increase rate limit or add per-endpoint limits** | `backend/src/server.js` | 429 triggered by normal page navigation (100/15min) | Raise to 500/15min for admin APIs; keep strict limits on auth endpoints |
| H-05 | **Fix `/admin/tickets` backend route** | `backend/src/routes/` | PAT confirmed 404 on this endpoint | Add ticket admin route in `server.js` |

## 🟢 Medium (Should Address Before Production Launch)

| # | Item | File/Area | Evidence | Action |
|---|---|---|---|---|
| M-01 | **Remove dead code: CartPage.jsx** | `web/src/pages/CartPage.jsx` | 3-line re-export wrapper, no imports, no route | Delete file |
| M-02 | **Remove dead code: CustomerCommerceLayout.jsx** | `web/src/components/CustomerCommerceLayout.jsx` | Full component, zero imports | Delete file |
| M-03 | **Fix dead import: ProductDetail** | `web/src/App.jsx:27` | Imported but never used in any route | Remove import line |
| M-04 | **Add `VITE_API_URL` to `.env.example`** | `web/` | No environment template file | Create `.env.example` with all required vars |
| M-05 | **Fix `getAdminCommerceOrders` naming** | `web/src/services/api.js:935` | Function named "Admin" but calls `/owner/orders` | Rename to `getOwnerCommerceOrders` |
| M-06 | **Add production `.env.example`** | Project root | No documentation of required env vars | Create `.env.example` with all variables documented |
| M-07 | **Configure CORS origin in production** | `backend/src/server.js` | Currently `origin: '*'` | Restrict to actual frontend domain(s) |
| M-08 | **Remove SUPER_ADMIN credentials from `.env`** | `backend/.env:4-5` | `SUPER_ADMIN_USERNAME=superadmin`, `SUPER_ADMIN_PASSWORD=admin@123` | Seed from deployment-time env vars only |

## 🔵 Low (Nice to Have)

| # | Item | Area | Action |
|---|---|---|---|
| L-01 | Add production logging (not just console.log) | Backend | Use Winston or Pino logger |
| L-02 | Add request ID middleware for tracing | Backend | Add `uuid` middleware |
| L-03 | Add health check endpoint to frontend build | Frontend | Serve `/health` or use `SENTRY_DSN` |
| L-04 | Add error tracking (Sentry) | Both | Integrate Sentry for production monitoring |
| L-05 | Add API documentation generation | Backend | Use JSDoc/Swagger for auto-generated docs |
| L-06 | Add database migration tooling | Backend | Consider Prisma Migrate or Knex |

---

## Pre-Deployment Script

```bash
# 1. Rotate AWS keys
aws iam update-access-key --access-key-id AKIAVZBUFMUU6YGVTPX7 --status Inactive
aws iam create-access-key --user-name vs-boutique-s3-user
# Update backend .env with new keys (DO NOT COMMIT)

# 2. Generate new JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. Build frontend
cd web && npm run build

# 4. Run all backend tests
cd backend && npm test

# 5. Set production env vars
# SMTP_HOST, SMTP_USER, SMTP_PASS (real SMTP)
# RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET (production keys)
# VITE_API_URL (production backend URL)
# NODE_ENV=production

# 6. Start backend with PM2
npm install -g pm2
pm2 start src/server.js --name vs-boutique

# 7. Serve frontend build
# Use nginx or serve
npx serve -s web/dist -l 5173
```

## Verification After Deployment

- [ ] All 5 backend test suites pass
- [ ] Frontend production build healthy (no console errors)
- [ ] Login/logout flow works for all roles
- [ ] Customer OTP login flow works
- [ ] Razorpay test payment succeeds
- [ ] Email sending works (check Ethereal preview URL)
- [ ] Rate limiter not triggering on normal usage
- [ ] All 22 admin pages load
- [ ] All 17 owner pages load
- [ ] Mobile viewport renders correctly
- [ ] 404 routes handled gracefully
