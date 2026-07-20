<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:phase6-report -->

# Phase 6 — Enterprise Feature Completion (Final)

**Environment:** Next.js 16.2.10, React 19.2.4, Tailwind v4, Zustand, TanStack Query, sonner, ponytail-mode

## What Was Built

### 1. Bulk Operations — Backend Endpoints + Frontend Wiring
- **Backend** (`nest build` clean): dedicated bulk endpoints with a shared `runBulkOperation` helper:
  - `POST /products/bulk` (delete/restore/publish/unpublish/feature/unfeature)
  - `POST /brands/bulk` (delete/restore)
  - `POST /categories/bulk` (delete/restore)
  - `POST /staff/bulk` (delete/restore/activate/deactivate/suspend/lock/unlock)
  - `POST /customer-profile/bulk` (activate/deactivate/suspend via `User.accountStatus`)
- **Frontend hooks:** `useBulkProducts`, `useBulkBrands`, `useBulkCategories`, `useBulkStaff` + `useExport`/`BulkActionBar`.
- **Wired pages:** Products (all 6 actions + clone + import), Categories (delete/restore + clone), Brands (delete/restore), Staff (activate/deactivate/suspend/delete/restore), Customers (prior).
- `BulkActionBar` switches to Restore-only when `deleted` filter active.

### 2. Clone Endpoints
- **Backend:** `POST /products/:id/clone`, `/categories/:id/clone`, `/cms/banners/:id/clone`, `/cms/pages/:id/clone`.
- **Frontend:** clone buttons on Products rows, Categories rows, Banners rows, CMS Pages rows (`useCloneProduct/useCloneCategory/useCloneBanner/useCloneCmsPage`).

### 3. Import Module (Backend + Frontend)
- **Backend:** `ImportModule` (native CSV parser, no external deps) — `POST /import/preview/:entity`, `POST /import/confirm/:entity`, `GET /import/history`; registered in `app.module.ts` with `MulterModule`.
- **Frontend:** `src/features/import/` (`import.service.ts`, `import.hooks.ts`); Import dialog with CSV preview → confirm, wired on Products page.

### 4. Show-Deleted / Soft-Delete Restore
- **Backend:** `deleted` query param (`'only'` | omit) on products/brands/categories/staff/orders repositories + Query DTOs. Restore endpoints already existed; now reachable from UI.
- **Frontend:** "Show Deleted" toggle on Products, Categories, Brands, Staff, Orders pages; per-row restore (Orders) + bulk restore in `BulkActionBar`.

### 5. Advanced Filters
- **Products:** `createdBy`, `updatedBy`, `tags`, `createdAfter`, `createdBefore` (added to `ProductQueryDto` + `productService.findAll`); wired as inputs on Products page.
- **Orders:** `createdBy`, `updatedBy`, `createdAfter`, `createdBefore`, `minPrice`, `maxPrice` (added to `OrderQueryDto`); wired as date/price inputs + createdBy on Orders page.

### 6. Export
- **`src/lib/bulk/useExport.ts`** — Reuses Reports API (`POST /reports/export`). Wired Export buttons on Products, Brands, Staff, Orders, Customers.

### 7. Notifications Search/Filter
- `search` + `type` added to `NotificationQueryDto` (passed through existing service).
- Notifications page: search box, type dropdown, "Unread Only" toggle.

### 8. Settings Improvements
- Input validation in `handleSaveSetting` (non-empty, write-protected secret keys).
- Unsaved-changes guard (`window.confirm`) on dialog close.
- "Reset" button restores field to original value; `role="alert"` on validation error; ESC/overlay close.

### 9. Shared Dialog + Accessibility (prior)
- `src/components/ui/Dialog.tsx` — accessible modal (focus trap, ESC, scroll lock, overlay dismiss).
- `aria-label` on icon-only buttons; `role="alert"` on error components; sticky headers; error/empty states.

## Files Modified
| File | Change |
|------|--------|
| `src/app/admin/catalog/products/page.tsx` | Bulk (backend endpoint), clone, import dialog, show-deleted, advanced filters, export, sticky header |
| `src/app/admin/catalog/categories/page.tsx` | Bulk (delete/restore), clone, show-deleted, export, select-all |
| `src/app/admin/catalog/brands/page.tsx` | Bulk (delete/restore) wired, show-deleted, export, select-all (fixed TDZ bug) |
| `src/app/admin/staff/page.tsx` | Bulk (all actions), show-deleted, export, select-all |
| `src/app/admin/orders/page.tsx` | Export, show-deleted, advanced filters (date/price/createdBy), select-all, per-row restore |
| `src/app/admin/banners/page.tsx` | Clone button (useCloneBanner) |
| `src/app/admin/cms/pages/page.tsx` | Clone button (useCloneCmsPage) |
| `src/app/admin/notifications/page.tsx` | Search + type filter + unread-only toggle |
| `src/app/admin/settings/page.tsx` | Validation, unsaved warning, reset, ARIA |
| `src/features/catalog/products/product.service.ts` | `bulk` method; pass deleted/createdBy/updatedBy/tags/date params |
| `src/features/catalog/products/product.types.ts` | Advanced filter fields on `ProductQueryDto` |
| `src/features/catalog/products/product.hooks.ts` | `useBulkProducts` |
| `src/features/orders/order.types.ts` | Advanced filter fields on `OrderQueryDto` |
| `src/features/notifications/notifications.types.ts` | `search`, `type` on `NotificationQueryDto` |
| `src/features/import/import.hooks.ts` | `useImportPreview`/`useImportConfirm` (existing) |

## What Remains Skipped (ponytail:)
| Skipped | Reason | Add when |
|---------|--------|----------|
| Saved filters (presets) | No backend infrastructure for storing presets | Users request named filter presets |
| Bulk for Customers page (already wired via prior session) | Completed separately | — |
| Settings global "reset to defaults" backend endpoint | No backend reset endpoint; implemented field-level reset instead | Backend provides reset endpoint |

## Verification
- `npx next build` — all routes compile, zero errors
- `cd backend && npx nest build` — zero errors
- TypeScript — app code clean (6 pre-existing errors confined to `src/tests/catalog-features.spec.ts` test mock typing, unrelated to this work)

<!-- END:phase6-report -->
