# VS Boutique — Web Folder Structure Audit

**Date:** 2026-06-26
**Scope:** `web/` only
**Total source files:** 160
**Total source folders:** 9 (under `src/`)
**Total source size:** 1,592 KB

---

## 1. Complete Folder Tree

```
web/
│
├── .env
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── README.md
├── tailwind.config.js
├── vite.config.js
│
├── public/
│   ├── favicon.svg
│   └── icons.svg
│
├── src/
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│   │
│   ├── components/
│   │   ├── AddressFormModal.jsx
│   │   ├── AppPreviewMockup.jsx
│   │   ├── BoutiqueEditModal.jsx
│   │   ├── BoutiqueForm.jsx
│   │   ├── BoutiqueTable.jsx
│   │   ├── Card.jsx
│   │   ├── CategoryList.jsx
│   │   ├── CustomerLayout.jsx
│   │   ├── DeleteConfirm.jsx
│   │   ├── EditModal.jsx
│   │   ├── ExchangeRequestModal.jsx
│   │   ├── LegalPage.jsx
│   │   ├── MegaMenu.jsx
│   │   ├── MobileNavSheet.jsx
│   │   ├── Navbar.jsx
│   │   ├── OtpModal.jsx
│   │   ├── OwnerLayout.jsx
│   │   ├── ProductCard.jsx (STUB — 2 lines)
│   │   ├── ReturnRequestModal.jsx
│   │   ├── ReviewModal.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Skeleton.jsx
│   │   │
│   │   ├── boutique/
│   │   │   ├── AccessControlTab.jsx
│   │   │   ├── BoutiqueProfileTab.jsx
│   │   │   ├── DangerZoneTab.jsx
│   │   │   └── OwnerDetailsTab.jsx
│   │   │
│   │   ├── commerce/
│   │   │   ├── AvailabilityBadge.jsx
│   │   │   ├── BoutiqueCard.jsx
│   │   │   ├── CollectionCard.jsx
│   │   │   ├── DeliveryBadge.jsx
│   │   │   ├── DiscountBadge.jsx
│   │   │   ├── PriceComponent.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   ├── RatingComponent.jsx
│   │   │   ├── ReviewCard.jsx
│   │   │   ├── ServiceCard.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── TimelineCard.jsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Container.jsx
│   │   │   ├── Grid.jsx
│   │   │   ├── PageFooter.jsx
│   │   │   ├── PageHeader.jsx
│   │   │   ├── Section.jsx
│   │   │   └── Stack.jsx
│   │   │
│   │   └── ui/
│   │       ├── Accordion.jsx
│   │       ├── Avatar.jsx
│   │       ├── Badge.jsx
│   │       ├── BottomSheet.jsx
│   │       ├── Button.jsx
│   │       ├── Card.jsx
│   │       ├── Checkbox.jsx
│   │       ├── Chip.jsx
│   │       ├── Drawer.jsx
│   │       ├── EmptyState.jsx
│   │       ├── ErrorState.jsx
│   │       ├── FAB.jsx
│   │       ├── IconButton.jsx
│   │       ├── Input.jsx
│   │       ├── LoadingOverlay.jsx
│   │       ├── Modal.jsx
│   │       ├── PremiumImage.jsx
│   │       ├── Radio.jsx
│   │       ├── SearchInput.jsx
│   │       ├── Select.jsx
│   │       ├── Skeleton.jsx
│   │       ├── Stepper.jsx
│   │       ├── Switch.jsx
│   │       ├── Tabs.jsx
│   │       ├── Textarea.jsx
│   │       ├── Timeline.jsx
│   │       ├── Toast.jsx
│   │       └── Tooltip.jsx
│   │
│   ├── context/
│   │   ├── AddressContext.jsx
│   │   ├── AdminNotificationContext.jsx
│   │   ├── AuthContext.jsx
│   │   ├── CartContext.jsx
│   │   ├── CustomerAuthContext.jsx
│   │   ├── NotificationContext.jsx
│   │   ├── ReturnsContext.jsx
│   │   ├── ReviewContext.jsx
│   │   └── WishlistContext.jsx
│   │
│   ├── hooks/
│   │   └── useDebounce.js
│   │
│   ├── pages/
│   │   ├── ActivityLogs.jsx
│   │   ├── AdminCommandCenter.jsx
│   │   ├── AdminCommerceOrders.jsx
│   │   ├── AdminCoupons.jsx
│   │   ├── AdminDeliveryTracking.jsx
│   │   ├── AdminFraud.jsx
│   │   ├── AdminNotifications.jsx
│   │   ├── AdminOrders.jsx
│   │   ├── AdminPayouts.jsx
│   │   ├── AdminProductReviews.jsx
│   │   ├── AdminRevenue.jsx
│   │   ├── AdminSettings.jsx
│   │   ├── AdminSubscriptions.jsx
│   │   ├── AdminTickets.jsx
│   │   ├── AdminWishlists.jsx
│   │   ├── Bookings.jsx
│   │   ├── BoutiqueDetails.jsx
│   │   ├── Boutiques.jsx
│   │   ├── Categories.jsx
│   │   ├── CustomerAbout.jsx
│   │   ├── CustomerAddresses.jsx
│   │   ├── CustomerBookings.jsx
│   │   ├── CustomerBoutiqueDetails.jsx
│   │   ├── CustomerCart.jsx
│   │   ├── CustomerCheckout.jsx
│   │   ├── CustomerContact.jsx
│   │   ├── CustomerHelp.jsx
│   │   ├── CustomerHome.jsx
│   │   ├── CustomerMeasurements.jsx
│   │   ├── CustomerNotifications.jsx
│   │   ├── CustomerOrderDetail.jsx
│   │   ├── CustomerOrders.jsx
│   │   ├── CustomerPrivacy.jsx
│   │   ├── CustomerProductDetail.jsx
│   │   ├── CustomerProfile.jsx
│   │   ├── CustomerRefund.jsx
│   │   ├── CustomerReturns.jsx
│   │   ├── CustomerShipping.jsx
│   │   ├── CustomerShop.jsx
│   │   ├── CustomerTerms.jsx
│   │   ├── Customers.jsx
│   │   ├── CustomerWishlist.jsx
│   │   ├── CustomTailoring.jsx
│   │   ├── Dashboard.jsx
│   │   ├── DesignSystemShowcase.jsx
│   │   ├── Login.jsx
│   │   ├── MarketplaceInsights.jsx
│   │   ├── OrderDetails.jsx
│   │   ├── OrderSuccess.jsx
│   │   ├── OwnerAnalytics.jsx
│   │   ├── OwnerBookings.jsx
│   │   ├── OwnerCoupons.jsx
│   │   ├── OwnerDashboard.jsx
│   │   ├── OwnerDeliveryTracking.jsx
│   │   ├── OwnerDesigns.jsx
│   │   ├── OwnerGallery.jsx
│   │   ├── OwnerOrders.jsx
│   │   ├── OwnerPayouts.jsx
│   │   ├── OwnerProductReviews.jsx
│   │   ├── OwnerProducts.jsx
│   │   ├── OwnerProfile.jsx
│   │   ├── OwnerReviews.jsx
│   │   ├── OwnerServices.jsx
│   │   ├── OwnerSettings.jsx
│   │   ├── OwnerSubscription.jsx
│   │   ├── OwnerTickets.jsx
│   │   ├── Payments.jsx
│   │   ├── ProductCatalog.jsx
│   │   ├── ProductDetail.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── Reviews.jsx
│   │   ├── SetPassword.jsx
│   │   └── WishlistPage.jsx
│   │
│   └── services/
│       ├── api.js
│       └── imageConfig.js
│
└── dist/ (build output — excluded)
```

---

## 2. Folder Purpose

### `public/`
- **Purpose:** Static assets served directly by Vite without processing.
- **Contains:** `favicon.svg`, `icons.svg`
- **Imported by:** Referenced in `index.html` (implicit via Vite asset handling).
- **Status:** Good. Minimal, clean.

### `src/components/`
- **Purpose:** All reusable UI components, sub-organized by domain.
- **Contains:**
  - **Root level (22 files):** Generic shared components (modals, layouts, nav, misc).
  - **`boutique/` (4):** Boutique admin tab panels.
  - **`commerce/` (12):** Customer-facing commerce display components.
  - **`layout/` (6):** Low-level layout primitives (Container, Grid, Stack, Section, PageHeader, PageFooter).
  - **`ui/` (28):** Atomic design-system primitives (Button, Input, Modal, Badge, etc.).
- **Imported by:** `App.jsx`, pages, other components.
- **Status:** Overloaded. Root `components/` mixes domain components (BoutiqueTable) with layout components (Navbar) with modals (OtpModal). Should be split into feature subdirectories.

### `src/context/`
- **Purpose:** React Context providers for cross-component state.
- **Contains:** 9 context providers (Auth, CustomerAuth, Cart, Wishlist, Address, Review, Returns, Notification, AdminNotification).
- **Imported by:** `App.jsx` wraps providers; individual pages import individual contexts.
- **Status:** Good. Well-organized, single responsibility per context file.

### `src/hooks/`
- **Purpose:** Custom React hooks for shared logic.
- **Contains:** `useDebounce.js` only (4 lines).
- **Imported by:** Unknown (likely unused or near-empty).
- **Status:** Underutilized. Only 1 hook. Many pages repeat logic (data fetching, form handling) that should be extracted into hooks.

### `src/pages/`
- **Purpose:** Top-level route page components.
- **Contains:** 73 page files covering admin, owner, customer, and shared views.
- **Imported by:** `App.jsx` (lazy loaded via `React.lazy`).
- **Status:** Largest folder. Flat structure with no subdirectories despite 3 distinct roles (admin, owner, customer). Missing role-based subfolders.

### `src/services/`
- **Purpose:** API client and image configuration.
- **Contains:**
  - `api.js` (1,325 lines) — single monolithic file with all API calls + 2 axios instances.
  - `imageConfig.js` (243 lines) — centralized Unsplash image URLs + resolvers.
- **Imported by:** All pages and components that make API calls.
- **Status:** `api.js` is too large (1,325 lines). Should be split by domain (boutiques, orders, customers, products, etc.).

### Root config files
- **Purpose:** Build tooling, linting, dependency management.
- **Contains:** `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `eslint.config.js`, `package.json`, `index.html`.
- **Status:** Good. Modern tooling (Vite 8, React 19, Tailwind 4, ESLint 10).

---

## 3. File Count

| Folder | Files | Subfolders | Total Size |
|---|---|---|---|
| `public/` | 2 | 0 | ~5 KB |
| `src/components/` | 72 | 4 (boutique, commerce, layout, ui) | 261 KB |
| `src/context/` | 9 | 0 | 21 KB |
| `src/hooks/` | 1 | 0 | ~0.5 KB |
| `src/pages/` | 73 | 0 | 1,224 KB |
| `src/services/` | 2 | 0 | 58 KB |
| Root config files | 7 | 0 | ~22 KB |
| **Total** | **166** | **9 subdirs** | **~1,592 KB** |

---

## 4. Duplicate Detection

| Duplicate | Location 1 | Location 2 | Issue |
|---|---|---|---|
| `ProductCard.jsx` | `components/ProductCard.jsx` (2-line stub) | `components/commerce/ProductCard.jsx` (5.7 KB) | Stub should be removed |
| `Skeleton.jsx` | `components/Skeleton.jsx` (0.7 KB) | `components/ui/Skeleton.jsx` (0.6 KB) | Two implementations; likely missed during migration to `ui/` |
| `Card.jsx` | `components/Card.jsx` (1 KB) | `components/ui/Card.jsx` (0.7 KB) | Two implementations; likely missed during migration to `ui/` |

No duplicate folders (`api`/`services`, `utils`/`helpers`, `hooks`/`customHooks`). The project is flat — many standard folders simply don't exist yet.

---

## 5. Large Folder Analysis

### `src/pages/` — 73 files, 1,224 KB (CRITICAL)
- **Largest file:** `AdminSubscriptions.jsx` (1,899 lines, 92 KB)
- **Other large files:** `OwnerProducts.jsx` (884 lines), `Customers.jsx` (882 lines), `OwnerSubscription.jsx` (804 lines), `AdminCommandCenter.jsx` (700 lines)
- **Problem:** Single flat folder for 3 distinct roles (admin, owner, customer). No subfolder organization.
- **Should be split into:**
  - `pages/admin/`
  - `pages/owner/`
  - `pages/customer/`
  - `pages/shared/`

### `src/components/` — 72 files, 261 KB (HIGH)
- **Mixed responsibilities:** Root level has generic components (Card, Skeleton), domain components (BoutiqueTable), modals (OtpModal), feature-specific components (CustomerLayout).
- **Should be reorganized:** Root level already has subdomains (boutique, commerce, layout, ui) but 22 files remain unclassified at root.

### `src/services/api.js` — 1,325 lines, 15 KB (HIGH)
- Monolithic file with 100+ API functions plus 2 axios instances (`api` and `customerApi`).
- Sections are commented but not separated into files.
- Should be split into: `services/admin/`, `services/customer/`, `services/owner/`.

---

## 6. Routing Structure

### Router: `react-router-dom` v7 with `BrowserRouter`
- Defined in `src/App.jsx` (611 lines).
- Lazy loading via `React.lazy` + `Suspense` for most pages.
- **28 pages eagerly imported** (Login, CustomerHome, CustomerBoutiqueDetails, ProductCatalog, WishlistPage + all customer pages).
- **36 pages lazy loaded** (admin + owner pages).

### Route Categories

| Category | Base Path | Count |
|---|---|---|
| **Auth** | `/admin`, `/login`, `/reset-password/:token`, `/set-password` | 4 |
| **Admin (Super Admin)** | `/admin/*`, `/boutiques`, `/orders`, `/customers`, etc. | 22 |
| **Owner** | `/owner/*` | 17 |
| **Customer** | `/`, `/customer/*`, `/products/*`, `/boutique/*` | 27 |
| **Design System** | `/design-system`, `/customer/design-system` | 2 |
| **Redirects** | `/admin-dashboard`, `/owner-dashboard`, `/products`, `/wishlist`, `/login` | 5 |

### Protected Routes
- `ProtectedRoute` component checks `AuthContext.user` and `allowedRoles`.
- Super-admin routes require `['super-admin']`.
- Owner routes require `['owner']`.
- Customer routes are publicly accessible but wrapped in `CustomerAuthProvider`.

### Layouts
- **AdminLayout** — defined inline in `App.jsx:116-189` (not a separate file). Wraps admin pages with Sidebar + Navbar.
- **CustomerLayout** — `src/components/CustomerLayout.jsx` (custom hook or component at file level).
- **OwnerLayout** — `src/components/OwnerLayout.jsx` (used on OwnerSettings page).
- **No dedicated `layouts/` folder** — layouts live in `components/` or inline.

### Duplicate Routes (same component, different paths)
| Path 1 | Path 2 | Component |
|---|---|---|
| `/design-system` | `/customer/design-system` | `DesignSystemShowcase` |

---

## 7. Component Architecture

### Shared Components (Root `components/`)
`AddressFormModal`, `AppPreviewMockup`, `BoutiqueEditModal`, `BoutiqueForm`, `BoutiqueTable`, `Card`, `CategoryList`, `CustomerLayout`, `DeleteConfirm`, `EditModal`, `ExchangeRequestModal`, `LegalPage`, `MegaMenu`, `MobileNavSheet`, `Navbar`, `OtpModal`, `OwnerLayout`, `ProductCard` (stub), `ReturnRequestModal`, `ReviewModal`, `Sidebar`, `Skeleton`

### Feature Components (`boutique/`)
`AccessControlTab`, `BoutiqueProfileTab`, `DangerZoneTab`, `OwnerDetailsTab`

### Feature Components (`commerce/`)
`AvailabilityBadge`, `BoutiqueCard`, `CollectionCard`, `DeliveryBadge`, `DiscountBadge`, `PriceComponent`, `ProductCard`, `RatingComponent`, `ReviewCard`, `ServiceCard`, `StatusBadge`, `TimelineCard`

### Layout Primitives (`layout/`)
`Container`, `Grid`, `PageFooter`, `PageHeader`, `Section`, `Stack`

### UI Primitives (`ui/`)
`Accordion`, `Avatar`, `Badge`, `BottomSheet`, `Button`, `Card`, `Checkbox`, `Chip`, `Drawer`, `EmptyState`, `ErrorState`, `FAB`, `IconButton`, `Input`, `LoadingOverlay`, `Modal`, `PremiumImage`, `Radio`, `SearchInput`, `Select`, `Skeleton`, `Stepper`, `Switch`, `Tabs`, `Textarea`, `Timeline`, `Toast`, `Tooltip`

### Missing Categories
| Category | Status |
|---|---|
| **Form Components** | No dedicated forms folder — forms embedded in pages |
| **Table Components** | Only `BoutiqueTable.jsx` exists |
| **Chart Components** | None — charts built inline in pages |
| **Button Components** | Single `Button.jsx` in `ui/` covers all variants |
| **Modal Components** | `Modal.jsx` in `ui/`, plus feature-specific modals at root |

---

## 8. API Layer

### Axios Instances (both in `src/services/api.js`)
| Instance | Token Source | Base URL |
|---|---|---|
| `api` (default export) | `localStorage.getItem('token')` | `VITE_API_URL` or `http://10.10.1.25:3005` |
| `customerApi` | `localStorage.getItem('customerToken')` | Same as above |

### Service Organization
- **Monolithic file:** All 100+ API functions in `api.js` with comment-section headers.
- **No separate service files** for different domains.

### API Endpoint Coverage
| Domain | Functions | Endpoints |
|---|---|---|
| Boutiques | 6 | `/boutiques` CRUD + status |
| Owners | 9 | `/owners/*` CRUD, permissions, invites |
| Owner Portal | 8 | `/owner/*` dashboard, boutique, services, gallery |
| Designs | 4 | `/designs` CRUD |
| Orders | 6 | `/orders` CRUD + status |
| Payments | 4 | `/payments` list, reports, refund |
| Customers | 6 | `/admin/customers` CRUD |
| Bookings | 8 | `/bookings/*` status, reschedule, assign |
| Reviews | 4 | `/reviews/*` |
| Payouts | 6 | `/payouts/*` |
| Subscriptions | 12 | `/subscriptions/*` |
| Tickets | 10 | `/tickets/*` |
| Categories | 10 | `/categories/*` |
| Owner Products | 14 | `/owner/products/*` + images, brands, tags, variants |
| Wishlist | 3 | `/products/wishlists/*` (via customerApi) |
| Customer Auth | 3 | `/auth/*` OTP |
| Coupons | 10 | `/admin/coupons/*` + `/owner/coupons/*` |
| Product Reviews | 4 | `/admin/product-reviews/*` |
| Commerce Orders | 8 | `/owner/orders/*` lifecycle |
| Delivery Tracking | 3 | `/owner/orders/:id/tracking` |
| Customer Cart | 5 | `/cart/*` (via customerApi) |
| Customer Checkout | 4 | `/checkout/*` (via customerApi) |
| Customer Orders | 5 | `/commerce-orders/*` (via customerApi) |
| Customer Misc | 10 | addresses, measurements, bookings, notifications, returns, exchanges, tickets |

### Issues
- **Naming mismatch:** `getAdminCommerceOrders` calls `/owner/orders` (previously identified bug).
- **Hardcoded URL fallback** at line 3: `http://10.10.1.25:3005` (should not be hardcoded).
- **`console.log` statements** in interceptors (lines 4, 18-19, 26, 35-36, 40, 42, 108) — should be guarded with `import.meta.env.DEV`.
- **No API folder** — all API functions live in `services/api.js`.

---

## 9. State Management

### React Query (`@tanstack/react-query`)
- **Location:** `src/main.jsx` — wraps the entire app with `QueryClientProvider`.
- **Configuration:** `staleTime: 5 min`, `cacheTime: 30 min`, `retry: 1`, `refetchOnWindowFocus: false`.
- **Usage:** Available throughout the app via `useQuery`/`useMutation` hooks. Usage varies by page.

### React Context Providers
| Context | File | Purpose | Wrapped In |
|---|---|---|---|
| `AuthProvider` | `context/AuthContext.jsx` | Admin/Owner auth | Top-level `<App>` |
| `CustomerAuthProvider` | `context/CustomerAuthContext.jsx` | Customer auth | Customer route wrapper |
| `CartProvider` | `context/CartContext.jsx` | Shopping cart state | Customer route wrapper |
| `WishlistProvider` | `context/WishlistContext.jsx` | Wishlist state | Customer route wrapper |
| `AddressProvider` | `context/AddressContext.jsx` | Shipping addresses | Customer route wrapper |
| `ReviewProvider` | `context/ReviewContext.jsx` | Product reviews | Per-product-detail route |
| `ReturnsProvider` | `context/ReturnsContext.jsx` | Return requests | Per-order-detail route |
| `NotificationProvider` | `context/NotificationContext.jsx` | Customer notifications | Customer route wrapper |
| `AdminNotificationProvider` | `context/AdminNotificationContext.jsx` | Admin notifications | Admin layout wrapper |

### Custom Hooks
| Hook | Location | Lines |
|---|---|---|
| `useDebounce` | `hooks/useDebounce.js` | 4 lines |

### Missing State Patterns
- **No Redux or Zustand** — only React Context + React Query.
- **No `useFetch` or `useApi` custom hook** — each page makes raw API calls.
- **No form state management** (React Hook Form, Formik) — forms built inline with `useState`.

---

## 10. Assets

### `public/`
- `favicon.svg` — favicon
- `icons.svg` — SVG sprite sheet for icons

### Inline Assets (via `src/services/imageConfig.js`)
- **147 Unsplash URLs** organized into: hero, categories, products, services, blouses, boutiques, collections, reviews, empty states, placeholder.
- **Utility functions:** `resolveProductImage()`, `resolveServiceImage()`, `getUnsplashSrcSet()`.

### Image Duplication
- Multiple Unsplash URLs are reused across categories (e.g., the same bridal saree image is also used for bridal blouse, high neck, princess cut).
- This is intentional fallback behavior, not accidental duplication.

### Missing
- **No local asset folder** (`src/assets/` or `src/images/`). All images are external (Unsplash).
- **No fonts folder** — fonts loaded from CDN via CSS (`Inter`, `Playfair Display`).
- **No logos** — all brand imagery is external URLs.

---

## 11. Utility Layer

### Missing Utility Folders
| Folder | Status | Impact |
|---|---|---|
| `src/utils/` | **MISSING** | Shared functions scattered across pages |
| `src/helpers/` | **MISSING** | No centralized helpers |
| `src/constants/` | **MISSING** | Magic strings inlined everywhere |
| `src/config/` | **MISSING** | App config is in `.env` only |
| `src/validators/` | **MISSING** | Form validation inline |
| `src/permissions/` | **MISSING** | Role checks inline in `ProtectedRoute` |
| `src/types/` | **MISSING** | No PropTypes or TypeScript |

### What Exists
| Item | Location | Purpose |
|---|---|---|
| `useDebounce` | `hooks/useDebounce.js` | Debouncing utility |
| `resolveProductImage` | `services/imageConfig.js` | Image lookup |
| `resolveServiceImage` | `services/imageConfig.js` | Service image lookup |
| `getUnsplashSrcSet` | `services/imageConfig.js` | Responsive image srcSet |
| API functions | `services/api.js` | All API calls |
| CSS custom properties | `index.css` | Theme tokens |

---

## 12. Technical Debt

### Dead/Stub Files
| File | Issue |
|---|---|
| `components/ProductCard.jsx` | 2-line stub — real implementation is in `components/commerce/ProductCard.jsx` |
| `components/Card.jsx` | May be superseded by `components/ui/Card.jsx` |
| `components/Skeleton.jsx` | May be superseded by `components/ui/Skeleton.jsx` |

### Duplicate Files
| File 1 | File 2 | Recommendation |
|---|---|---|
| `components/Card.jsx` | `components/ui/Card.jsx` | Consolidate to `ui/Card.jsx` |
| `components/Skeleton.jsx` | `components/ui/Skeleton.jsx` | Consolidate to `ui/Skeleton.jsx` |
| `components/ProductCard.jsx` | `components/commerce/ProductCard.jsx` | Delete stub |

### Monolithic Files
| File | Lines | Risk |
|---|---|---|
| `services/api.js` | 1,325 | Needs domain-based splitting |
| `pages/AdminSubscriptions.jsx` | 1,899 | Needs component extraction |

### Missing Standard Folders
| Standard Folder | Reason It Matters |
|---|---|
| `src/assets/` | External-only image dependency |
| `src/utils/` | Repeated utility logic across pages |
| `src/constants/` | Magic strings and hardcoded values |
| `src/config/` | App configuration spread across files |
| `src/pages/admin/` | 22 admin files mixed with 27 customer + 17 owner files |

### ESLint Issues
- `eslint.config.js` has 5 rules explicitly disabled: `no-unused-vars`, `no-undef`, `exhaustive-deps`, `set-state-in-effect`, `only-export-components`.
- Disabling these rules hides bugs and unused imports.

### Console Statements in Production
- `services/api.js` has 9 `console.log/warn/error` calls in interceptors that will execute in production.
- Should be wrapped in `if (import.meta.env.DEV)` or removed.

---

## 13. Current Architecture Score

| Aspect | Score (/10) | Reason |
|---|---|---|
| **Scalability** | 5 | Flat pages folder scales poorly past 100 files; monolithic api.js won't support new domains cleanly |
| **Maintainability** | 6 | Components sub-organized well but root level is messy; 1,899-line file is hard to maintain |
| **Readability** | 7 | Naming is consistent; folder structure is intuitive at high level |
| **Discoverability** | 4 | No per-role page folders; no utils/constants/config directories; hard to find shared logic |
| **Feature Isolation** | 6 | Commerce and boutique components are well-isolated; everything else lives in a flat pile |
| **Folder Naming** | 8 | Consistent kebab-case/lowercase; clear purpose for most folders |
| **Import Structure** | 5 | Eager imports for 28 pages in App.jsx mixed with lazy imports; no barrel exports |

### Overall Score: **5.9 / 10**

---

## 14. Problems

1. **Flat pages folder (CRITICAL)** — 73 files in one directory with 3 distinct roles (admin, owner, customer). Violates separation of concerns. Causes naming prefixes (`Admin*`, `Owner*`, `Customer*`) that would be unnecessary with subfolders.

2. **Monolithic api.js (HIGH)** — 1,325 lines, 100+ functions, 2 axios instances. Single file changes cause cascading rebuilds. No domain-boundary separation.

3. **AdminSubscriptions.jsx at 1,899 lines (HIGH)** — Severely violates single-responsibility principle. Likely contains embedded sub-components, inline styles, and mixed logic.

4. **Stub/dead component files (MEDIUM)** — `components/ProductCard.jsx` is a 2-line stub. `components/Card.jsx` and `components/Skeleton.jsx` have duplicates in `ui/`.

5. **Duplicate components (MEDIUM)** — `Card`, `Skeleton`, and `ProductCard` each exist in two locations with different implementations.

6. **Missing utility directories (MEDIUM)** — No `utils/`, `constants/`, `config/`, `validators/`, `helpers/`. Forces inline duplication of logic.

7. **Missing assets directory (MEDIUM)** — All images are external Unsplash URLs. No local fallback images. If Unsplash goes down, the app loses all imagery.

8. **Eager + lazy import mixing (MEDIUM)** — 28 pages are eagerly imported, 36 lazy. Inconsistent approach. Customer pages (27 files) are all eagerly imported, defeating lazy loading benefits.

9. **Disabled ESLint rules (MEDIUM)** — `no-unused-vars` and `no-undef` disabled means unused imports and undefined references pass CI silently.

10. **Console logs in production code (LOW)** — 9 `console.*` calls in api.js interceptors execute in production.

11. **Missing ErrorBoundary (LOW)** — No React Error Boundary component. Any uncaught JS error crashes the full page.

12. **Hardcoded API URL fallback (LOW)** — `http://10.10.1.25:3005` in `api.js:3` leaks internal network topology.

13. **No barrel exports (LOW)** — Each file imported individually. No `index.js` files for clean re-exports from folders.

14. **Inline AdminLayout (LOW)** — 73-line layout component defined inside `App.jsx` rather than in a dedicated file.

15. **Hooks folder underutilized (LOW)** — Only 1 hook (`useDebounce`). Many pages reinvent data-fetching patterns that should be extracted.

16. **Duplicate route path (LOW)** — `/design-system` and `/customer/design-system` both render `DesignSystemShowcase`.

---

## 15. Summary

| Metric | Value |
|---|---|
| **Total folders** (under `web/`) | 13 (9 src, 1 public, 3 root) |
| **Total source files** | 160 |
| **Total source size** | 1,592 KB |
| **Biggest folder** | `src/pages/` — 73 files, 1,224 KB (77% of source size) |
| **Largest file** | `src/pages/AdminSubscriptions.jsx` — 1,899 lines, 92 KB |
| **Most duplicated area** | Root `components/` vs `components/ui/` (Card, Skeleton, ProductCard) |
| **Most complex area** | `src/services/api.js` — 1,325 lines, 2 axios instances, 100+ functions |
| **Most nested folder** | `src/components/ui/` — 28 files at depth 3 |
| **Most disconnected area** | `src/hooks/` — 1 file, nearly empty |

### Architecture Quality: **Below Average (5.9/10)**

**Strengths:**
- Modern tech stack (Vite 8, React 19, Tailwind 4, React Query 5)
- Good component naming conventions
- Clean separation of UI primitives in `components/ui/`
- Context providers follow clear patterns
- Lazy loading implemented for admin/owner routes

**Weaknesses:**
- Flat pages folder with 3 roles mixed together
- Monolithic API service file
- One file exceeds 1,800 lines
- Missing standard directories (utils, constants, config, assets)
- Duplicate component implementations
- ESLint safety rules disabled
- No role-based page subdirectories

**Recommended priority for reorganization:** pages folder → api.js splitting → utility/constants extraction → duplicate component cleanup.
