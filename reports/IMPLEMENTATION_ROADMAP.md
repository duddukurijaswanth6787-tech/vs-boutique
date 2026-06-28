# VS Boutique ERP — Frontend Architecture Migration Roadmap

## Overview

This document provides the complete phased implementation roadmap for migrating the VS Boutique ERP frontend to the new enterprise architecture.

**Goal:** Migrate ALL files without breaking the application. The old and new structure must coexist during migration.

---

## Strategy Overview

The migration follows a **"zero-downtime refactoring"** approach:

1. Create new folder structure alongside existing structure
2. Create barrel files that re-export from NEW locations
3. Update imports incrementally
4. Use Vite path aliases so old imports continue to work
5. Delete old files only after verifying zero broken imports

---

## Phase 0: Preparation (Day 1)

**Tasks:**

- [ ] Install npm packages: `eslint-plugin-import`, `dependency-cruiser`
- [ ] Configure Vite path aliases in vite.config.js
- [ ] Create ALL new folders (empty) under src/
- [ ] Configure ESLint with new rules (warn-only mode initially)
- [ ] Run initial build to verify baseline: `npm run build`
- [ ] Run initial Playwright tests: `npx playwright test`
- [ ] Run `madge --circular src/` to detect current circular dependencies
- [ ] Create git branch: `git checkout -b architecture-migration`

**Estimated time:** 4 hours  
**Risk:** LOW — No code changes, only config + empty folders

---

## Phase 1: Core Barrel Files (Days 2–3)

**Tasks:**

- [ ] Create `core/components/index.js` — barrel re-exporting ALL UI/layout/navigation/feedback/animation components from current locations
- [ ] Create `core/contexts/index.js` — barrel re-exporting all 9 context providers
- [ ] Create `core/hooks/index.js` — re-exporting useDebounce from current location
- [ ] Create `core/utils/index.js` — re-exporting utilities from current locations
- [ ] Create `core/services/index.js` — re-exporting api.js, imageConfig.js
- [ ] Create `core/constants/index.js` — extract all magic strings
- [ ] Verify build still passes
- [ ] Verify no broken tests

**IMPORTANT:** These barrel files ONLY re-export. They don't move any files yet. This allows incremental import updates without breaking existing code.

**Estimated time:** 8 hours  
**Risk:** LOW — Barrel files only, no file moves, no logic changes

---

## Phase 2: Core Folder Restructure (Days 4–7)

**Tasks:**

- [ ] Move `components/ui/*` → `core/components/ui/` (28 files)
- [ ] Move `components/layout/*` → `core/components/layout/` (6 files)
- [ ] Move root-level shared components → `core/components/shared/`:
  - LegalPage.jsx, AppPreviewMockup.jsx, DeleteConfirm.jsx, EditModal.jsx
- [ ] Move navigation components → `core/components/navigation/`:
  - Sidebar.jsx, Navbar.jsx, MegaMenu.jsx, MobileNavSheet.jsx
- [ ] Move feedback components → `core/components/feedback/`:
  - Toast? (already in ui/), ErrorState, EmptyState, LoadingOverlay (already in ui/)
  - Skeleton.jsx (root) → delete (use ui/Skeleton.jsx)
- [ ] DELETE duplicate files:
  - components/Card.jsx (superseded by ui/Card.jsx)
  - components/ProductCard.jsx (stub, real one in commerce/)
  - components/Skeleton.jsx (superseded by ui/Skeleton.jsx)
- [ ] Create animation components: `core/components/animations/*`
- [ ] Update ALL barrel files to point to new locations
- [ ] Run build after each sub-step
- [ ] Run tests after each sub-step

**Key verification:** Every component that was previously imported must still compile. Use `git grep` to find all import references before moving.

**Estimated time:** 24 hours  
**Risk:** MEDIUM — File moves require import updates

---

## Phase 3: API Restructure (Days 8–10)

**Tasks:**

- [ ] Create `core/services/api.client.js` — extract axios instances from api.js lines 1–55
- [ ] Create `core/services/api/` folder with all 19 API modules
- [ ] Copy each function from api.js into its new module
- [ ] Create `core/services/api/index.js` barrel
- [ ] Update core/services/ barrel to point to new structure
- [ ] KEEP old api.js in place (with deprecation warning comment)
- [ ] For each page, update ONE import at a time from:
  - `import { getBoutiques } from '../services/api'` →
  - `import { getBoutiques } from '@core/services/api/boutique.api'`
- [ ] Run build after every 5–10 page updates
- [ ] Delete old api.js only after ALL pages are migrated
- [ ] Fix the `getAdminCommerceOrders` → `getOwnerCommerceOrders` naming bug during migration

**Key verification:** Zero imports from old api.js remain. Build passes.

**Estimated time:** 24 hours  
**Risk:** HIGH — Most pages import from api.js. Must be methodical.

---

## Phase 4: Feature Page Restructure (Days 11–18)

**Tasks:**

- [ ] Create `features/admin/pages/` subfolder structure (19 feature folders)
- [ ] Create `features/owner/pages/` subfolder structure (14 feature folders)
- [ ] Create `features/customer/pages/` subfolder structure (17 feature folders)
- [ ] Create `features/shared/pages/` subfolder structure
- [ ] Move each page file to its new feature folder as `index.jsx`
- [ ] Update only the lazy import in App.jsx after each batch:
  - BEFORE: `const AdminRevenue = lazy(() => import('./pages/AdminRevenue'))`
  - AFTER: `const AdminRevenue = lazy(() => import('@features/admin/pages/Revenue'))`
- [ ] KEEP old page files in place during migration (App.jsx still points to them)
- [ ] For each batch of 3–5 pages:
  1. Move file
  2. Update barrel/import
  3. Run build
  4. Run tests

**Important:** Owner-specific components follow their pages:
- OwnerLayout.jsx → features/owner/components/
- CustomerLayout.jsx → features/customer/components/
- AdminLayout (inline in App.jsx) → app/layouts/AdminLayout.jsx (extract from App.jsx)

**Estimated time:** 40 hours  
**Risk:** HIGH — Most pages have multiple import dependencies

---

## Phase 5: Feature Component Restructure (Days 19–21)

**Tasks:**

- [ ] Move `components/boutique/*` → `features/admin/pages/Boutiques/components/`
- [ ] Move `components/commerce/*` → `core/components/commerce/` (shared across customer + admin)
- [ ] Move feature-specific modals to their feature folder:
  - BoutiqueEditModal.jsx → features/admin/pages/Boutiques/components/
  - BoutiqueForm.jsx → features/admin/pages/Boutiques/components/
  - AddressFormModal.jsx → features/customer/pages/Addresses/components/
  - ExchangeRequestModal.jsx → features/customer/pages/Orders/components/
  - ReturnRequestModal.jsx → features/customer/pages/Returns/components/
  - ReviewModal.jsx → features/customer/pages/Orders/components/
  - OtpModal.jsx → features/customer/pages/Auth/components/
  - CategoryList.jsx → features/admin/pages/Categories/components/
  - BoutiqueTable.jsx → features/admin/pages/Boutiques/components/
- [ ] Extract AdminLayout from App.jsx to `app/layouts/AdminLayout.jsx`

**Estimated time:** 24 hours  
**Risk:** MEDIUM — Feature components have fewer external imports

---

## Phase 6: Hooks Creation (Days 22–24)

**Tasks:**

- [ ] Create all new hooks in `core/hooks/`:
  - useApi.js, usePagination.js, useModal.js, useToast.js, usePermissions.js
  - useCurrentUser.js, useSearch.js, useFilter.js, useNotifications.js
  - useInfiniteScroll.js, useUpload.js
- [ ] Update barrel: `core/hooks/index.js`
- [ ] For the first 5 pages, refactor from useState+useEffect to useQuery+hooks
- [ ] Build and test each page
- [ ] Continue refactoring ~20 high-traffic pages (Admin pages first)

**Note:** This phase is OPTIMIZATION, not MIGRATION. The app works without these hooks. Prioritize pages that are most complex or have the most duplicated data-fetching logic.

**Estimated time:** 24 hours  
**Risk:** LOW — New hooks are additive; old patterns still work

---

## Phase 7: App.jsx Restructure (Day 25)

**Tasks:**

- [ ] Extract AdminLayout from App.jsx → app/layouts/AdminLayout.jsx
- [ ] Extract ProtectedRoute → app/router/ProtectedRoute.jsx
- [ ] Create app/router/AdminRoutes.jsx with all admin routes
- [ ] Create app/router/OwnerRoutes.jsx with all owner routes
- [ ] Create app/router/CustomerRoutes.jsx with all customer routes
- [ ] Create app/router/index.jsx that combines all route modules
- [ ] Create app/providers/index.jsx that combines all context providers
- [ ] Reduce App.jsx from 611 lines to ~30 lines

**Before App.jsx:** 611 lines, mixed routes, inline layout, eager + lazy imports  
**After App.jsx:** ~30 lines, clean with just providers + router

**Estimated time:** 8 hours  
**Risk:** MEDIUM — Routes must be carefully verified

---

## Phase 8: Utilities & Constants (Days 26–27)

**Tasks:**

- [ ] Create `core/utils/` sub-modules:
  - formatters.js — currency, date, phone number formatters
  - validators.js — email, phone, OTP validators
  - calculators.js — price calculations, discount math
  - storage.js — localStorage wrappers with error handling
  - security.js — token handling, input sanitization
  - helpers.js — general-purpose helpers
- [ ] Create `core/constants/`:
  - roles.js — user role constants
  - status.js — order, payment, booking status enums
  - routes.js — route path constants
  - enums.js — all application enums
- [ ] Create `core/config/`:
  - app.config.js — app-wide configuration
  - api.config.js — API configuration (base URL, timeout)
  - theme.config.js — theme constants
- [ ] Create `core/permissions/index.js` — permission check utilities
- [ ] Extract magic strings from pages and components

**Estimated time:** 16 hours  
**Risk:** LOW — Additive, backwards-compatible

---

## Phase 9: Import Cleanup & Testing (Days 28–30)

**Tasks:**

- [ ] Run `npx madge --circular src/` — fix any remaining circular dependencies
- [ ] Run `npx depcheck` — find and remove unused dependencies
- [ ] Update all imports to use @core/, @features/, @config/ aliases
- [ ] Remove all imports from old file paths
- [ ] Delete old files that have been fully migrated:
  - Old pages/ directory (all files moved)
  - Old components/ root files (all moved or deleted)
  - Old services/api.js (API split completed)
  - Old context/ files (barrel re-exports from new location)
  - Old hooks/ file (already in core/hooks/)
- [ ] Final build: `npm run build`
- [ ] Full test suite: `npx playwright test`
- [ ] Verify all 65 Playwright PAT points pass
- [ ] Manual smoke test of all portals

**Estimated time:** 24 hours  
**Risk:** MEDIUM — Final cleanup can break imports if anything was missed

---

## Phase 10: Production Verification (Day 31)

**Tasks:**

- [ ] Run `npm run build` — verify 0 errors, check bundle size
- [ ] Run Playwright Production Acceptance Test (65 points)
- [ ] Run backend test suite
- [ ] Visual regression check of all admin, owner, customer pages
- [ ] Verify lazy loading works for all routes
- [ ] Verify route transitions work
- [ ] Verify all API endpoints functional
- [ ] Verify no console errors in production build
- [ ] Tag release: `git tag v2.0.0-arch-migration`

**Estimated time:** 8 hours  
**Risk:** LOW — Verification only

---

## Summary

| Phase | Duration | Risk | Files Changed |
|---|---|---|---|
| 0: Preparation | 4h | LOW | 3 |
| 1: Core Barrel Files | 8h | LOW | 10 |
| 2: Core Folder Restructure | 24h | MEDIUM | 60+ |
| 3: API Restructure | 24h | HIGH | 90+ |
| 4: Feature Page Restructure | 40h | HIGH | 80+ |
| 5: Feature Component Restructure | 24h | MEDIUM | 30+ |
| 6: Hooks Creation | 24h | LOW | 20+ |
| 7: App.jsx Restructure | 8h | MEDIUM | 10 |
| 8: Utilities & Constants | 16h | LOW | 30+ |
| 9: Import Cleanup & Testing | 24h | MEDIUM | 160+ |
| 10: Production Verification | 8h | LOW | 0 |
| **Total** | **~204 hours (25 days)** | | **~160 source files** |

---

## Success Criteria

1. `npm run build` — 0 errors
2. `npx playwright test` — 65/65 points pass
3. `npx madge --circular src/` — 0 circular dependencies
4. No visual regressions on any portal
5. No console errors in production
6. Bundle size not increased (should decrease due to better tree-shaking)
7. All existing tests pass
