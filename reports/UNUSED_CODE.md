# UNUSED CODE REPORT

**Date:** 2026-06-26  
**Project:** VS Boutique  
**Status:** DEAD CODE ANALYSIS

---

## FRONTEND DEAD CODE

### Unused Pages (Imported But No Route)

| File | Line in App.jsx | Severity | Notes |
|------|-----------------|----------|-------|
| `web/src/pages/CartPage.jsx` | Line 15 | **CRITICAL** | Imported as `CartPage` but no route element uses it. Route `/customer/cart` uses `CustomerCart.jsx`. This is likely an older version of the cart page. |
| `web/src/pages/ProductDetail.jsx` | Line 28 | **CRITICAL** | Imported as `ProductDetail` but no route uses it. Route `/products/:id` uses `CustomerProductDetail.jsx`. |

### Unused Components

| File | Severity | Notes |
|------|----------|-------|
| `web/src/components/CustomerCommerceLayout.jsx` | **HIGH** | Component file exists but is never imported anywhere in the codebase. Appears to be a legacy mobile commerce layout. |
| `web/src/components/Card.jsx` (root level) | **LOW** | Root-level Card.jsx exists but all imports in the project reference `./ui/Card` or `../ui/Card`. The root Card.jsx is not imported anywhere. |
| `web/src/components/Skeleton.jsx` (root level) | **LOW** | Root-level Skeleton.jsx exists but most imports use `./ui/Skeleton`. May still be used in some files. |

### Potential Dead Code in Components

| File | Notes |
|------|-------|
| `web/src/components/EditModal.jsx` | Appears to be a legacy component - may be superseded by `BoutiqueEditModal.jsx` |
| `web/src/components/BoutiqueForm.jsx` | 478 lines with inline sub-components - could be broken into smaller files |
| `web/src/pages/DesignSystemShowcase.jsx` | Design system showcase page - dev-only but routed in production |

---

## BACKEND DEAD CODE

### Legacy MongoDB Models (Completely Unused)

| File | Location | Severity | Notes |
|------|----------|----------|-------|
| `src/models/Activity.js` | backend/src/models/ | **MEDIUM** | Mongoose model - not imported by any active route or controller |
| `src/models/AuditLog.js` | backend/src/models/ | **MEDIUM** | Mongoose model - not imported by any active route or controller |
| `src/models/Booking.js` | backend/src/models/ | **MEDIUM** | Mongoose model - not imported by any active route or controller |
| `src/models/Boutique.js` | backend/src/models/ | **MEDIUM** | Only referenced by dead `boutiqueController.js` |
| `src/models/Design.js` | backend/src/models/ | **MEDIUM** | Mongoose model - not imported by any active route or controller |
| `src/models/Measurement.js` | backend/src/models/ | **MEDIUM** | Mongoose model - not imported by any active route or controller |
| `src/models/Notification.js` | backend/src/models/ | **MEDIUM** | Mongoose model - not imported by any active route or controller |
| `src/models/Order.js` | backend/src/models/ | **MEDIUM** | Mongoose model - not imported by any active route or controller |
| `src/models/Owner.js` | backend/src/models/ | **MEDIUM** | Mongoose model - not imported by any active route or controller |
| `src/models/Payment.js` | backend/src/models/ | **MEDIUM** | Mongoose model - not imported by any active route or controller |
| `src/models/User.js` | backend/src/models/ | **MEDIUM** | Mongoose model - not imported by any active route or controller |

### Dead Controller (Uses Legacy MongoDB)

| File | Severity | Notes |
|------|----------|-------|
| `src/controllers/boutiqueController.js` | **HIGH** | Uses `Boutique` from legacy Mongoose models. No active route uses this controller - all boutique routes use inline controller functions in route files. |

### Unused Route Endpoints (No Frontend Consumer)

| Endpoint | File | Notes |
|----------|------|-------|
| POST `/api/auth/register` | auth.js routes | Frontend uses OTP flow only |
| POST `/api/auth/forgot-password` | auth.js routes | Reset password flow exists but not wired in frontend |
| POST `/api/auth/change-password` | auth.js routes | Owner has separate change-password endpoint |
| GET/POST/PUT/DELETE `/api/customers` | customerRoutes.js | Frontend uses `/admin/customers` instead |
| POST `/api/payments/create-order` | paymentRoutes.js | Uses `/checkout/create-payment` instead |
| POST `/api/payments/verify` | paymentRoutes.js | Uses `/checkout/verify-payment` instead |
| GET `/api/payments/settlements` | paymentRoutes.js | Not exposed in any UI |
| GET `/api/payments/reports` | paymentRoutes.js | Not exposed in any UI |
| POST `/api/payments/refund` | paymentRoutes.js | Partially used through refund endpoint |
| POST `/api/payments/payout` | paymentRoutes.js | Uses `/payouts/admin/generate` instead |
| GET `/api/measurements/:userId` | measurementRoutes.js | Admin view not exposed |

### Duplicate/Redundant Prisma Items

| Item | Type | Notes |
|------|------|-------|
| `SubscriptionPlanType` | Prisma Enum | Declared in schema but NOT referenced by any model field |
| `PayoutStatusType` | Prisma Enum | Declared but may have overlap with `PayoutState` - two enums for similar purpose |
| `ActivityType` | Prisma Enum | `Activity` model exists but is not actively used in commerce flow |
| `DesignCategory` | Prisma Enum | Enum values limited to `Blouse`, `Lehenga`, `Saree`, `Other` - may need expansion |

### Empty Migration

| File | Severity | Notes |
|------|----------|-------|
| `backend/prisma/migrations/20260618164302_add_category_management/` | **LOW** | Migration exists but contains no SQL statements. It's an empty shell and should be removed. |

---

## MOBILE APP DEAD CODE

The mobile app (`mobile/`) has its own structure with `app/` (Expo Router) and `src/` directories:

| File | Notes |
|------|-------|
| `mobile/src/screens/` (16 screen components) | These may be legacy - Expo Router uses `app/` directory instead |
| `mobile/src/store/useStore.js` | Zustand store - verify it's still used by active screens |
| `mobile/src/services/cartPersistence.js` | AsyncStorage cart persistence - verify active usage |

---

## SUMMARY STATISTICS

| Category | Count | Details |
|----------|-------|---------|
| **Unused Frontend Pages** | 2 | CartPage.jsx, ProductDetail.jsx |
| **Unused Frontend Components** | 3 | CustomerCommerceLayout, Card (root), Skeleton (root) |
| **Legacy Backend Models (Mongoose)** | 11 | All files in src/models/ |
| **Dead Backend Controllers** | 1 | boutiqueController.js |
| **Unused Backend Endpoints** | 11 | Various payment/auth/customer endpoints |
| **Redundant Prisma Enums** | 1 | SubscriptionPlanType |
| **Empty Migrations** | 1 | 20260618164302_add_category_management |
| **Mobile Legacy Screens** | 16 | src/screens/ may be unused |
| **Total Dead Code Items** | **46** | |

### Cleanup Effort Estimate
- **Auto-fixable:** Remove dead imports (2 files), remove empty migration (1 file), remove dead controller (1 file)
- **Manual review needed:** Legacy Mongoose models (11 files), unused endpoints (11), mobile screens (16)
- **Total savings:** ~15 files can be safely deleted immediately; ~27 more need review
