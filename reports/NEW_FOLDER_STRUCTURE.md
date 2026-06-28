# VS Boutique ERP — New Frontend Folder Structure

> **Architecture:** Feature-First · **Scope:** Complete Enterprise Frontend · **Status:** Migration Blueprint

---

## Folder Tree Overview

```
web/src/
├── app/                          # Application shell — routing, providers, layouts, entry
├── core/                         # Shared foundation — components, hooks, services, utils
├── features/                     # Feature modules — admin, owner, customer portals
├── assets/                       # Static resources — images, icons, fonts
├── config/                       # App-level configuration
├── types/                        # JSDoc / TypeScript type definitions
├── locales/                      # i18n translation files
└── tests/                        # Test suites
```

---

## 1. `app/` — Application Shell

The entry point of the application. Owns routing, global providers, layouts, and base styling.

### `app/App.jsx`
| Field | Detail |
|---|---|
| **Path** | `web/src/app/App.jsx` |
| **Purpose** | Root React component. Composes all providers and renders the top-level router. |
| **Contains** | Provider wrappers `<QueryProvider><ThemeProvider><RouterProvider>`, layout switching logic. |
| **Imported by** | `main.jsx` |
| **Example** | `<App />` inside `createRoot(document.getElementById('root'))` |

### `app/main.jsx`
| Field | Detail |
|---|---|
| **Path** | `web/src/app/main.jsx` |
| **Purpose** | Vite/Webpack entry point. Creates the React root, imports global CSS, renders `<App />`. |
| **Contains** | `createRoot`, `StrictMode`, root import of `index.css`. |
| **Imported by** | Vite config / HTML entry |
| **Example** | `createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)` |

### `app/index.css`
| Field | Detail |
|---|---|
| **Path** | `web/src/app/index.css` |
| **Purpose** | Global stylesheet. Imports Tailwind directives (`@tailwind base/components/utilities`), CSS variables, and global resets. |
| **Contains** | `@tailwind` directives, `:root` variables, `@layer base` resets, print styles, scrollbar customization. |
| **Imported by** | `main.jsx` |
| **Example** | `@tailwind base; @tailwind components; @tailwind utilities;` |

### `app/router/`
| File | Purpose | Contents | Imported By |
|---|---|---|---|
| `router/index.jsx` | Combined router — merges all route groups into a single `createBrowserRouter` (or the chosen router library). | `createBrowserRouter`, route imports from `AdminRoutes`, `OwnerRoutes`, `CustomerRoutes`, error boundaries. | `App.jsx` |
| `router/AdminRoutes.jsx` | Route definitions for the Super Admin portal. | Lazy-loaded page imports (`CommandCenter`, `Revenue`, `Fraud`, `Boutiques`, etc.), nested layout route under `AdminLayout`. | `router/index.jsx` |
| `router/OwnerRoutes.jsx` | Route definitions for the Boutique Owner portal. | Lazy-loaded page imports (`Dashboard`, `Products`, `Orders`, etc.), nested layout route under `OwnerLayout`. | `router/index.jsx` |
| `router/CustomerRoutes.jsx` | Route definitions for the Customer-facing website. | Lazy-loaded page imports (`Home`, `Shop`, `Cart`, `Checkout`, etc.), nested layout route under `CustomerLayout`. | `router/index.jsx` |
| `router/ProtectedRoute.jsx` | Auth guard component — redirects unauthenticated users to login. | Reads `AuthContext`/`CustomerAuthContext`, renders `<Outlet />` or `<Navigate to="/login" />`. | All route definition files |

### `app/providers/`
| File | Purpose | Contents | Imported By |
|---|---|---|---|
| `providers/index.jsx` | Composed provider wrapper — nests all context providers in the correct order. | `<QueryProvider><ThemeProvider><AuthProvider><CartProvider>...{children}</CartProvider></AuthProvider></ThemeProvider></QueryProvider>` | `App.jsx` |
| `providers/QueryProvider.jsx` | React Query / TanStack Query configuration. | `QueryClientProvider` with `QueryClient` configured with `staleTime`, `retry`, `refetchOnWindowFocus` defaults. | `providers/index.jsx` |
| `providers/ThemeProvider.jsx` | Theme / dark mode provider. | Context for `theme` and `setTheme`, toggles `dark` class on `<html>`, persists to localStorage. | `providers/index.jsx` |

### `app/layouts/`
| File | Purpose | Contents | Imported By |
|---|---|---|---|
| `layouts/AdminLayout.jsx` | Super Admin portal layout — sidebar navigation + top navbar + main content area. | `Sidebar`, `Navbar`, `<Outlet />`, responsive collapse logic, breadcrumbs. | `AdminRoutes.jsx` |
| `layouts/OwnerLayout.jsx` | Boutique Owner portal layout — sidebar + navbar tailored for boutique management. | `Sidebar`, `Navbar`, `<Outlet />`, boutique switcher, notification bell. | `OwnerRoutes.jsx` |
| `layouts/CustomerLayout.jsx` | Customer website layout — header nav, main content slot, footer. | `Navbar`, `<Outlet />`, `PageFooter`, mobile nav sheet. | `CustomerRoutes.jsx` |

---

## 2. `core/` — Shared Foundation

Reusable code used by every feature module. No feature-specific logic lives here.

### `core/components/`

#### `core/components/ui/`
| Field | Detail |
|---|---|
| **Path** | `web/src/core/components/ui/` |
| **Purpose** | Atomic UI primitives — the design system's building blocks. Every visual element used across portals lives here. |
| **Contains** | ~28 component files: `Button.jsx`, `Input.jsx`, `Select.jsx`, `Textarea.jsx`, `Checkbox.jsx`, `Radio.jsx`, `Switch.jsx`, `Label.jsx`, `Badge.jsx`, `Avatar.jsx`, `Card.jsx`, `Modal.jsx`, `Drawer.jsx`, `Tooltip.jsx`, `Popover.jsx`, `Dropdown.jsx`, `Tabs.jsx`, `Accordion.jsx`, `Table.jsx`, `Pagination.jsx`, `Progress.jsx`, `Spinner.jsx`, `Alert.jsx`, `Breadcrumb.jsx`, `FileUploader.jsx`, `DatePicker.jsx`, `SearchInput.jsx`, `CommandPalette.jsx`. |
| **Imported by** | All features, all core components, pages |
| **Example** | `import { Button } from 'core/components/ui'` |

#### `core/components/layout/`
| Field | Detail |
|---|---|
| **Path** | `web/src/core/components/layout/` |
| **Purpose** | Layout primitives for constructing page structure — consistent spacing, grids, and sections. |
| **Contains** | (6 files) `Container.jsx`, `Grid.jsx`, `Stack.jsx`, `Section.jsx`, `PageHeader.jsx`, `PageFooter.jsx`. |
| **Imported by** | All pages and layouts |
| **Example** | `<Container><Grid cols={3}>...` |

#### `core/components/navigation/`
| Field | Detail |
|---|---|
| **Path** | `web/src/core/components/navigation/` |
| **Purpose** | Navigational components for all three portals — sidebar menus, top navbars, mega menus, and mobile navigation. |
| **Contains** | (6 files) `Sidebar.jsx`, `Navbar.jsx`, `MegaMenu.jsx`, `MobileNavSheet.jsx`, `BottomSheet.jsx`, `NavLinkItem.jsx`. |
| **Imported by** | Layouts (`AdminLayout`, `OwnerLayout`, `CustomerLayout`) |
| **Example** | `import { Sidebar } from 'core/components/navigation'` in `AdminLayout.jsx` |

#### `core/components/feedback/`
| Field | Detail |
|---|---|
| **Path** | `web/src/core/components/feedback/` |
| **Purpose** | User feedback and status indicators — loading, empty, error, toast, skeleton states. |
| **Contains** | (5 files) `Toast.jsx`, `ErrorState.jsx`, `EmptyState.jsx`, `LoadingOverlay.jsx`, `Skeleton.jsx`. |
| **Imported by** | Any component or page that needs to communicate state to the user |
| **Example** | `<ErrorState message="Failed to load" onRetry={refetch} />` |

#### `core/components/animations/`
| Field | Detail |
|---|---|
| **Path** | `web/src/core/components/animations/` |
| **Purpose** | All motion and animation components — entrance animations, route transitions, micro-interactions. |
| **Contains** | `FadeIn.jsx`, `SlideUp.jsx`, `SlideInLeft.jsx`, `SlideInRight.jsx`, `ScaleIn.jsx`, `RouteTransition.jsx`, `StaggerChildren.jsx`, `AnimatedCounter.jsx`. |
| **Imported by** | Features, pages, layout transitions |
| **Example** | `<FadeIn><YourComponent /></FadeIn>` |

#### `core/components/shared/`
| Field | Detail |
|---|---|
| **Path** | `web/src/core/components/shared/` |
| **Purpose** | Cross-portal shared components that do not belong to any single feature — legal pages, mockups, empty shells. |
| **Contains** | `LegalPage.jsx` (renders markdown/HTML content for terms/privacy), `AppPreviewMockup.jsx`, `ComingSoon.jsx`. |
| **Imported by** | Any portal that needs to render legal or placeholder content |
| **Example** | `<LegalPage title="Privacy Policy" content={privacyMarkdown} />` |

### `core/hooks/`

| Field | Detail |
|---|---|
| **Path** | `web/src/core/hooks/` |
| **Purpose** | Custom React hooks shared across all features. Each hook encapsulates a single reusable behavior. |
| **Contains** | (13+ files) `index.js` (barrel export), `useDebounce.js`, `useApi.js`, `usePagination.js`, `useModal.js`, `useToast.js`, `usePermissions.js`, `useCurrentUser.js`, `useSearch.js`, `useFilter.js`, `useNotifications.js`, `useInfiniteScroll.js`, `useUpload.js`. |
| **Imported by** | All feature pages and components |
| **Example** | `const { data, isLoading } = useApi('/products')` |

### `core/services/`

| Path | Purpose | Contents | Imported By |
|---|---|---|---|
| `services/index.js` | Barrel export for all services | Re-exports from sub-modules | All features |
| `services/api.client.js` | Axios instance factory | Creates configured Axios instances with base URL, interceptors for auth tokens, error handling, request/response transforms. | All `.api.js` files |
| `services/api/` | API client modules — one file per domain | `auth.api.js`, `admin.api.js`, `owner.api.js`, `customer.api.js`, `boutique.api.js`, `product.api.js`, `order.api.js`, `cart.api.js`, `checkout.api.js`, `payment.api.js`, `review.api.js`, `coupon.api.js`, `notification.api.js`, `analytics.api.js`, `ticket.api.js`, `subscription.api.js`, `upload.api.js`, `inventory.api.js`, `delivery.api.js` (19 files). | Feature pages via `useApi` hook or direct import |
| `services/imageConfig.js` | Image URL transformation utilities | Cloudinary/image optimization URL builder, fallback image logic. | Product, boutique, customer pages |

### `core/contexts/`

| Field | Detail |
|---|---|
| **Path** | `web/src/core/contexts/` |
| **Purpose** | React contexts for shared state that must be accessible across component trees. Contexts are consumed by hooks or directly by components. |
| **Contains** | (9 files) `index.js`, `AuthContext.jsx`, `CustomerAuthContext.jsx`, `CartContext.jsx`, `WishlistContext.jsx`, `AddressContext.jsx`, `ReviewContext.jsx`, `ReturnsContext.jsx`, `NotificationContext.jsx`, `AdminNotificationContext.jsx`. |
| **Imported by** | `providers/index.jsx` (wraps app), features that consume the context |
| **Example** | `const { user, logout } = useAuth()` via `AuthContext` |

### `core/utils/`

| Path | Purpose | Contents |
|---|---|---|
| `utils/index.js` | Barrel export | Re-exports from all sub-folders |
| `utils/formatters/` | Data formatting utilities | `currency.js` (INR/USD formatting), `date.js` (relative time, format strings), `phone.js` (phone number formatting) |
| `utils/validators/` | Input validation helpers | `email.js`, `phone.js`, `otp.js`, `password.js`, `pincode.js` |
| `utils/calculators/` | Business logic calculations | `price.js` (tax calc, discount calc), `discount.js`, `subscription.js` |
| `utils/storage/` | Client-side storage wrappers | `local.js` (type-safe localStorage), `secure.js` (encrypted session store) |
| `utils/security/` | Security utilities | `token.js` (JWT decode/verify), `sanitize.js` (XSS prevention) |
| `utils/helpers/` | General-purpose helpers | `cn.js` (classnames merge), `sleep.js`, `formatError.js`, `truncate.js` |

### `core/constants/`

| Field | Detail |
|---|---|
| **Path** | `web/src/core/constants/` |
| **Purpose** | Application-wide constant definitions — roles, statuses, route paths, enums. Single source of truth for magic strings. |
| **Contains** | `index.js`, `roles.js` (`SUPER_ADMIN`, `BOUTIQUE_OWNER`, `CUSTOMER`), `status.js` (`ACTIVE`, `INACTIVE`, `PENDING`, `SUSPENDED`, etc.), `routes.js` (all route path strings), `enums.js` (order status, payment status, delivery status, etc.). |
| **Imported by** | Every module that needs to reference roles, statuses, or paths |
| **Example** | `import { ROLES } from 'core/constants'` |

### `core/config/`

| Field | Detail |
|---|---|
| **Path** | `web/src/core/config/` |
| **Purpose** | Configuration objects that are consumed by core modules. (Note: `config/` at root level also exists for app-level config that differs by environment.) |
| **Contains** | `index.js`, `app.config.js` (app name, version, pagination defaults), `api.config.js` (API base URL, timeout, retry settings), `theme.config.js` (Tailwind theme extension tokens). |
| **Imported by** | Core services, core hooks, app providers |
| **Example** | `import { API_CONFIG } from 'core/config'` in `api.client.js` |

### `core/permissions/`

| Field | Detail |
|---|---|
| **Path** | `web/src/core/permissions/` |
| **Purpose** | Permission-checking logic — determines what a user (based on role + boutique) can access. |
| **Contains** | `index.js` — `hasPermission(user, action, resource)` function, permission matrix constant. |
| **Imported by** | `ProtectedRoute.jsx`, `usePermissions.js`, feature components that conditionally render UI |
| **Example** | `hasPermission(user, 'edit', 'boutique')` → `true/false` |

### `core/types/`

| Field | Detail |
|---|---|
| **Path** | `web/src/core/types/` |
| **Purpose** | JSDoc typedefs and type definitions shared across the application. Provides intellisense and documentation for data shapes. |
| **Contains** | `index.js` — all shared `@typedef` blocks for `User`, `Boutique`, `Product`, `Order`, `CartItem`, `Payment`, etc. |
| **Imported by** | Any file via JSDoc `@import` or `@type` tags |
| **Example** | `/** @type {import('core/types').User} */` |

### `core/theme/`

| Field | Detail |
|---|---|
| **Path** | `web/src/core/theme/` |
| **Purpose** | Design token definitions — colors, typography, spacing, shadows. Used to build the Tailwind config and CSS custom properties. |
| **Contains** | `index.js`, `colors.js`, `typography.js`, `spacing.js`, `shadows.js`. |
| **Imported by** | `tailwind.config.js`, `theme.config.js`, `index.css` |
| **Example** | `export const colors = { primary: { 50: '#...', 500: '#...' } }` |

### `core/styles/`

| Field | Detail |
|---|---|
| **Path** | `web/src/core/styles/` |
| **Purpose** | Global CSS files beyond Tailwind utilities — base resets, utility classes, and keyframe animations. |
| **Contains** | `base.css` (element resets, typography base), `utilities.css` (custom utility classes), `animations.css` (`@keyframes` definitions). |
| **Imported by** | `app/index.css` |
| **Example** | `@import 'core/styles/animations.css';` |

---

## 3. `features/` — Feature Modules

Each portal is a self-contained feature module. Pages live in sub-folders, co-located with their own components.

### `features/admin/` — Super Admin Portal

| Path | Purpose | Contents |
|---|---|---|
| `features/admin/index.jsx` | Admin portal entry — root component rendered by `AdminLayout`. | Lazy-loads page components based on route, breadcrumb provider. |
| `features/admin/pages/CommandCenter/` | Super Admin dashboard — system-wide metrics, health checks, quick actions. | `index.jsx`, `components/` (metric cards, charts, alerts widget). |
| `features/admin/pages/Revenue/` | Revenue analytics — platform-wide earnings, payout summaries, charts. | `index.jsx` |
| `features/admin/pages/Fraud/` | Fraud detection dashboard — flagged orders, disputes, risk analysis. | `index.jsx` |
| `features/admin/pages/Boutiques/` | Boutique management — CRUD, approval, access control. | `index.jsx`, `BoutiqueDetail.jsx`, `components/` (`BoutiqueEditModal.jsx`, `BoutiqueForm.jsx`, `BoutiqueTable.jsx`, `AccessControlTab.jsx`, `BoutiqueProfileTab.jsx`, `DangerZoneTab.jsx`, `OwnerDetailsTab.jsx`). |
| `features/admin/pages/Categories/` | Global category management. | `index.jsx`, `components/` (`CategoryList.jsx`, `CategoryForm.jsx`, `CategoryTree.jsx`). |
| `features/admin/pages/Customers/` | Customer management — list, details, activity. | `index.jsx` |
| `features/admin/pages/Orders/` | All platform orders (aggregated). | `index.jsx` (AdminOrders), `OrderDetail.jsx`, `components/` |
| `features/admin/pages/CommerceOrders/` | Commerce-specific order tracking. | `index.jsx`, `components/` |
| `features/admin/pages/Products/` | Global product catalog — view all products across boutiques. | `ProductCatalog.jsx`, `ProductDetail.jsx` |
| `features/admin/pages/Payments/` | Payment transactions log. | `index.jsx` |
| `features/admin/pages/Payouts/` | Boutique owner payout management. | `index.jsx` |
| `features/admin/pages/Subscriptions/` | Subscription plans and customer subscriptions. | `index.jsx`, `components/` |
| `features/admin/pages/Coupons/` | Coupon management — create, edit, deactivate. | `index.jsx`, `components/` |
| `features/admin/pages/Tickets/` | Support tickets management. | `index.jsx`, `components/` |
| `features/admin/pages/Reviews/` | Review moderation — approve, reject, flag. | `index.jsx`, `components/` |
| `features/admin/pages/Notifications/` | Admin notification center — system-wide announcements. | `index.jsx`, `components/` |
| `features/admin/pages/DeliveryTracking/` | Platform-wide delivery tracking overview. | `index.jsx`, `components/` |
| `features/admin/pages/ActivityLogs/` | Audit trail — admin actions, system events. | `index.jsx` |
| `features/admin/pages/Settings/` | Platform settings — global config, feature flags. | `index.jsx` |
| `features/admin/components/` | Shared components used only by admin pages. | `AdminTable.jsx`, `StatusBadge.jsx`, `ActionMenu.jsx`, `FilterPanel.jsx`, `DateRangePicker.jsx`. |

### `features/owner/` — Boutique Owner Portal

| Path | Purpose | Contents |
|---|---|---|
| `features/owner/index.jsx` | Owner portal entry. | Layout provider, breadcrumb context, boutique context. |
| `features/owner/pages/Dashboard/` | Owner dashboard — boutique metrics, recent orders, revenue snapshot. | `index.jsx`, `components/` |
| `features/owner/pages/Products/` | Product CRUD — list, create, edit, manage inventory. | `index.jsx`, `ProductForm.jsx`, `ProductList.jsx`, `components/` |
| `features/owner/pages/Services/` | Service offerings management (tailoring, etc.). | `index.jsx`, `components/` |
| `features/owner/pages/Gallery/` | Boutique image gallery management. | `index.jsx`, `components/` |
| `features/owner/pages/Orders/` | Incoming orders management — accept, process, ship. | `index.jsx`, `OrderDetail.jsx`, `components/` |
| `features/owner/pages/Bookings/` | Service bookings management. | `index.jsx`, `components/` |
| `features/owner/pages/DeliveryTracking/` | Delivery status for boutique's orders. | `index.jsx`, `components/` |
| `features/owner/pages/Subscriptions/` | Boutique subscription plan management. | `index.jsx`, `components/` |
| `features/owner/pages/Analytics/` | Boutique analytics — sales, traffic, customer insights. | `index.jsx`, `components/` |
| `features/owner/pages/Reviews/` | Respond to customer reviews. | `index.jsx`, `components/` |
| `features/owner/pages/Payouts/` | Payout history and withdrawal requests. | `index.jsx`, `components/` |
| `features/owner/pages/Profile/` | Boutique profile editing — info, images, contact. | `index.jsx`, `components/` |
| `features/owner/pages/Settings/` | Boutique settings — notification prefs, business hours. | `index.jsx`, `components/` |
| `features/owner/components/` | Shared components used only by owner pages. | `OwnerTable.jsx`, `BoutiqueStatsCard.jsx`, `ProductGalleryEditor.jsx`, `InventoryTable.jsx`. |

### `features/customer/` — Customer Website

| Path | Purpose | Contents |
|---|---|---|
| `features/customer/index.jsx` | Customer portal entry. | SEO meta tags provider, scroll-to-top on route change. |
| `features/customer/pages/Home/` | Landing page — featured products, categories, hero banner. | `index.jsx`, `components/` |
| `features/customer/pages/Shop/` | Product listing — grid/list view, filters, search, pagination. | `index.jsx`, `components/` |
| `features/customer/pages/Cart/` | Shopping cart — line items, quantity adjust, coupon apply. | `index.jsx`, `components/` |
| `features/customer/pages/Checkout/` | Checkout flow — address, payment, order summary. | `index.jsx`, `components/` |
| `features/customer/pages/Wishlist/` | Customer wishlist management. | `index.jsx`, `components/` |
| `features/customer/pages/Orders/` | Order history and order detail view. | `index.jsx`, `orderDetail.jsx`, `components/` |
| `features/customer/pages/Returns/` | Return/refund request management. | `index.jsx`, `components/` |
| `features/customer/pages/Addresses/` | Saved addresses management. | `index.jsx`, `components/` |
| `features/customer/pages/Profile/` | Customer profile — personal info, preferences. | `index.jsx`, `components/` |
| `features/customer/pages/Notifications/` | Customer notification preferences and history. | `index.jsx`, `components/` |
| `features/customer/pages/Tailoring/` | Tailoring service booking — measurements, styles. | `index.jsx`, `components/` |
| `features/customer/pages/Boutique/` | Boutique storefront — boutique public profile, products. | `index.jsx`, `components/` |
| `features/customer/pages/Measurements/` | Saved body measurements for tailoring. | `index.jsx`, `components/` |
| `features/customer/pages/Static/` | Static informational pages. | `About.jsx`, `Contact.jsx`, `Help.jsx`, `Terms.jsx`, `Privacy.jsx`, `Refund.jsx`, `Shipping.jsx`. |
| `features/customer/components/` | Shared components used only by customer pages. | `ProductCard.jsx`, `ReviewCard.jsx`, `AddressCard.jsx`, `OrderTimeline.jsx`, `MeasurementForm.jsx`, `SearchBar.jsx`, `FilterSidebar.jsx`, `PriceRange.jsx`, `RatingStars.jsx`, `QuickViewModal.jsx`. |

---

## 4. `assets/` — Static Resources

| Path | Purpose | Contents |
|---|---|---|
| `assets/images/` | Locally stored images (fallback images, logos, placeholder assets). | `logo.svg`, `placeholder.png`, `empty-cart.svg`, `not-found.svg`. |
| `assets/icons/` | Custom SVG icons not covered by the icon library. | Custom SVG components or `.svg` files for unique icons. |
| `assets/fonts/` | Self-hosted web fonts (if Google Fonts is not used). | `.woff2` font files, `fonts.css` with `@font-face` declarations. |

---

## 5. `config/` — App-Level Configuration

| Path | Purpose | Contents |
|---|---|---|
| `config/app.config.js` | Application metadata and feature flags. | `APP_NAME`, `APP_VERSION`, `FEATURE_FLAGS`, `PAGINATION_DEFAULTS`. |
| `config/api.config.js` | API endpoint configuration. | `BASE_URL`, `API_VERSION`, `TIMEOUT`, `RETRY_COUNT`, `ENDPOINTS` map. |
| `config/theme.config.js` | Tailwind CSS configuration extension. | Custom theme tokens pulled from `core/theme/`, plugin configuration. |

---

## 6. `types/` — Type Definitions

| Path | Purpose | Contents |
|---|---|---|
| `types/api.types.js` | API request/response type definitions. | `PaginatedResponse<T>`, `ApiError`, `ApiSuccess<T>`, request parameter shapes. |
| `types/models.types.js` | Domain model type definitions. | `User`, `Boutique`, `Product`, `Order`, `CartItem`, `Payment`, `Review`, `Coupon`, `Subscription`, `Ticket`, `Notification`, `Address`, `Measurement`. |
| `types/common.types.js` | Common utility types. | `Nullable<T>`, `Optional<T>`, `SortDirection`, `FilterOption`, `SelectOption`, `TabItem`, `BreadcrumbItem`. |
| `types/index.js` | Barrel export for all types. | Re-exports all typedefs from sibling files. |

---

## 7. `locales/` — Internationalization

| Path | Purpose | Contents |
|---|---|---|
| `locales/en/common.json` | English translations for shared UI strings. | Button labels, form field labels, error messages, validation messages, general UI copy. |
| `locales/en/admin.json` | English translations for the Admin portal. | Admin page headings, admin-specific labels, admin table columns. |
| `locales/en/owner.json` | English translations for the Owner portal. | Owner page headings, boutique management copy, analytics labels. |
| `locales/en/customer.json` | English translations for the Customer portal. | Customer-facing copy — product labels, cart/checkout strings, help content. |
| `locales/index.js` | i18n initialization and export. | Configures i18next or similar library, loads locale JSON files, exposes `t()` function and `useTranslation` hook. |

---

## 8. `tests/` — Test Suites

| Path | Purpose | Contents |
|---|---|---|
| `tests/unit/` | Unit tests for individual components, hooks, and utilities. | `__tests__/` files mirroring `core/` and `features/` structure. Tests for `Button.test.jsx`, `useDebounce.test.js`, `formatters.test.js`, etc. |
| `tests/integration/` | Integration tests for feature workflows and page interactions. | Full page render tests, form submission flows, API interaction tests with mocks. |
| `tests/e2e/` | End-to-end tests simulating real user journeys. | Playwright/Cypress test specs organized by portal: `admin/**`, `owner/**`, `customer/**`. |

---

## Import Dependency Map

```
main.jsx
  └─ App.jsx
       └─ providers/index.jsx
            ├─ QueryProvider.jsx
            └─ ThemeProvider.jsx
       └─ router/index.jsx
            ├─ AdminRoutes.jsx → AdminLayout.jsx → features/admin/...
            ├─ OwnerRoutes.jsx → OwnerLayout.jsx → features/owner/...
            └─ CustomerRoutes.jsx → CustomerLayout.jsx → features/customer/...
            └─ ProtectedRoute.jsx → core/permissions/, core/contexts/AuthContext.jsx

core/                        # Imported by everything
  ├─ components/ui/          # All components/pages
  ├─ components/layout/      # Pages, layouts
  ├─ components/navigation/  # Layouts
  ├─ components/feedback/    # Any component/page
  ├─ components/animations/  # Any component/page
  ├─ components/shared/      # Pages
  ├─ hooks/                  # All features
  ├─ services/               # Hooks, pages, api modules
  ├─ contexts/               # providers/index.jsx → consumed by features
  ├─ utils/                  # Any file
  ├─ constants/              # Any file
  ├─ config/                 # services/, hooks/, providers/
  ├─ permissions/            # ProtectedRoute.jsx, hooks/usePermissions.js
  ├─ types/                  # Any file (JSDoc imports)
  ├─ theme/                  # tailwind.config.js, index.css
  └─ styles/                 # app/index.css

features/                    # Imported by router routes, import from core/
config/                      # Imported by core/services/, app/
types/                       # Imported by any file via JSDoc
locales/                     # Imported by App.jsx or i18n init
tests/                       # Standalone — imported by test runner
```

---

## Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Component files | `PascalCase.jsx` | `Button.jsx`, `ProductCard.jsx` |
| Hook files | `camelCase.js` | `useDebounce.js`, `useApi.js` |
| Service files | `kebab-case.api.js` | `product.api.js`, `auth.api.js` |
| Context files | `PascalCaseContext.jsx` | `AuthContext.jsx` |
| Utility files | `camelCase.js` | `currency.js`, `validators.js` |
| Constants | `SCREAMING_SNAKE_CASE` | `ROLES.SUPER_ADMIN` |
| Config files | `kebab-case.config.js` | `app.config.js` |
| Test files | `*.test.jsx` / `*.spec.js` | `Button.test.jsx` |
| Pages | PascalCase folder with `index.jsx` | `CommandCenter/index.jsx` |
| Static pages | PascalCase files | `About.jsx`, `Terms.jsx` |

---

## Migration Checklist

- [ ] Create all folder directories (maintain `.gitkeep` in empty dirs)
- [ ] Extract UI primitives → `core/components/ui/`
- [ ] Extract layout components → `core/components/layout/`
- [ ] Extract navigation components → `core/components/navigation/`
- [ ] Extract feedback components → `core/components/feedback/`
- [ ] Extract animation components → `core/components/animations/`
- [ ] Extract shared cross-portal components → `core/components/shared/`
- [ ] Move hooks → `core/hooks/`
- [ ] Split and move services → `core/services/` and `core/services/api/`
- [ ] Extract contexts → `core/contexts/`
- [ ] Extract utilities → `core/utils/` (formatters/, validators/, calculators/, storage/, security/, helpers/)
- [ ] Extract constants → `core/constants/`
- [ ] Extract config → `core/config/`
- [ ] Extract permissions → `core/permissions/`
- [ ] Extract types → `core/types/`
- [ ] Extract theme tokens → `core/theme/`
- [ ] Extract styles → `core/styles/`
- [ ] Organize admin features → `features/admin/`
- [ ] Organize owner features → `features/owner/`
- [ ] Organize customer features → `features/customer/`
- [ ] Set up `app/` shell (providers, router, layouts)
- [ ] Set up `assets/` directories
- [ ] Set up `config/` at app level
- [ ] Set up `types/` at app level
- [ ] Set up `locales/` directory
- [ ] Set up `tests/` directory structure
- [ ] Update all import paths across the codebase
- [ ] Remove old folder structure
- [ ] Verify build, lint, typecheck pass
- [ ] Run test suite
