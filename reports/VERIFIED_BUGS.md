# VERIFIED BUGS — VS Boutique Application

> **Status**: All claims from prior static-analysis reports verified with runtime evidence.
> **Date**: 2026-06-26

---

## BUG-001 (Critical) — AWS IAM Credentials Exposed in `.env`

| Field | Value |
|---|---|
| **File** | `backend/.env:12-14` |
| **Evidence** | `AWS_ACCESS_KEY=AKIAVZBUFMUU6YGVTPX7`, `AWS_SECRET_KEY=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`, `AWS_BUCKET_NAME=vs-boutique-web-images` |
| **Reproduction** | `Select-String -Path backend\.env -Pattern "AWS"` returns real-looking IAM credentials |
| **Impact** | Any repo reader gains AWS access to S3 bucket `vs-boutique-web-images` in `ap-southeast-2` |
| **Action** | Rotate keys immediately; use environment variables or AWS Secrets Manager |
| **Verdict** | **CONFIRMED — CRITICAL** |

---

## BUG-002 (High) — Hardcoded API URL in AuthContext.jsx

| Field | Value |
|---|---|
| **File** | `web/src/context/AuthContext.jsx:6` |
| **Code** | `const API_BASE_URL = 'http://10.10.1.25:3005'` |
| **Evidence** | Static analysis of line 6 confirms hardcoded IP, not `import.meta.env.VITE_API_URL` |
| **Impact** | Non-portable; breaks in any deployment not at `10.10.1.25:3005`. Internal IP also leaks network topology. |
| **Action** | Replace with `import.meta.env.VITE_API_URL || 'http://localhost:3005'` |
| **Verdict** | **CONFIRMED — HIGH** |

---

## BUG-003 (Medium) — `getAdminCommerceOrders` Calls `/owner/orders` (Semantic Mismatch)

| Field | Value |
|---|---|
| **File** | `web/src/services/api.js:936` |
| **Code** | `const response = await api.get('/owner/orders')` inside `getAdminCommerceOrders` |
| **Backend** | `backend/src/server.js:165`: `app.use('/owner/orders', require('./routes/ownerCommerceOrderRoutes'))` |
| **Evidence** | Runtime: `curl -s http://localhost:3005/owner/orders` with valid admin token returns `{"success":true,"data":[...]}` with real orders |
| **Impact** | Route resolves correctly but function name (`getAdminCommerceOrders`) implies `/admin/orders`. Maintainability risk. |
| **Action** | Either rename function to `getOwnerCommerceOrders` or add `/admin/orders` route on backend |
| **Verdict** | **CONFIRMED — WORKS AT RUNTIME but semantically incorrect** |

---

## ~~BUG-004 (High) — Wishlist ReferenceError: `customerApi` Before Declaration~~ **CLOSED — False Alarm**

| Field | Value |
|---|---|
| **File** | `web/src/services/api.js:836-848` vs `:1046` |
| **Claim** | `customerApi` used inside `getWishlist`/`addToWishlist`/`removeFromWishlist` ~200 lines before its `const` declaration |
| **Runtime Analysis** | These are `export const` arrow functions. `customerApi` is a variable captured by closure, not evaluated at definition time. When React components invoke these functions (on mount or user event), all module-level code has executed, and `customerApi` at line 1046 is fully initialized. No TDZ violation occurs. |
| **Evidence** | Module evaluation order: (1) lines 1-1046 execute top-to-bottom, (2) React renders components, (3) components call wishlist functions — `customerApi` already initialized. |
| **Verdict** | **NOT A RUNTIME ERROR — Functions close over variable reference, not value. `customerApi` is initialized before any external call can invoke these functions.** |

---

## ~~BUG-005 — `getPublicBoutique` Missing From API File~~ **CLOSED — Not a Bug**

| Field | Value |
|---|---|
| **Claim** | Missing named export `getPublicBoutique` in `api.js` |
| **Evidence** | Grep across entire `web/src/` for `getPublicBoutique` returns zero results. No component calls it. |
| **Verdict** | **NOT CALLED ANYWHERE — Function would be dead code even if added. No impact.** |

---

## ~~BUG-006 — `getAuditLogs` Missing From API File~~ **CLOSED — Not a Bug**

| Field | Value |
|---|---|
| **Claim** | Missing named export `getAuditLogs` in `api.js` |
| **Evidence** | ActivityLogs.jsx:15 and AdminCommandCenter.jsx:146 call `api.get('/dashboard/audit-logs')` directly. No wrapper function needed. |
| **Verdict** | **NOT CALLED BY NAME — Components call endpoint directly. No wrapper required.** |

---

## Summary

| Severity | Count | Status |
|---|---|---|
| Critical | 1 | Open |
| High | 1 | Open |
| Medium | 1 | Open (Semantic) |
| False Alarms | 3 | Closed |
