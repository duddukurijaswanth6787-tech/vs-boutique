# VS Boutique ERP — Frontend Enterprise Architecture

> **Document Version:** 1.0  
> **Status:** Approved  
> **Last Updated:** June 2026  
> **Audience:** Engineering, Architecture Review Board, Tech Leads

---

## Table of Contents

1. [Architecture Philosophy](#1-architecture-philosophy)
2. [High-Level Architecture Diagram (ASCII)](#2-high-level-architecture-diagram-ascii)
3. [Design Principles](#3-design-principles)
4. [Module Boundaries and Dependency Rules](#4-module-boundaries-and-dependency-rules)
5. [Portal Architecture](#5-portal-architecture)
6. [State Management Strategy](#6-state-management-strategy)
7. [Performance Strategy](#7-performance-strategy)
8. [Scalability Design](#8-scalability-design)
9. [Migration Strategy Overview](#9-migration-strategy-overview)
10. [Technology Stack Summary](#10-technology-stack-summary)

---

## 1. Architecture Philosophy

### Feature-First Architecture

VS Boutique ERP adopts a **Feature-First** architecture as its core organizing principle. In a codebase projected to exceed 5,000 source files, the way code is structured determines whether the engineering organization can move fast without breaking things.

### Why Feature-First Beats Layer-First for a 5,000+ File ERP

A traditional **Layer-First** architecture groups files by technical concern — all components in `/components`, all hooks in `/hooks`, all services in `/services`. This works for small-to-medium applications, but at scale it creates fundamental problems:

| Concern | Layer-First | Feature-First |
|---|---|---|
| **Discoverability** | Finding all code for "Order Management" requires searching 12+ directories | Everything lives under `features/admin/orders/` |
| **Cohesion** | Related logic is scattered; unrelated logic is co-located | Related logic is co-located; unrelated logic stays separate |
| **Ownership** | No clear ownership boundary; any team touches any folder | Each feature has a clear owner and boundary |
| **Refactoring** | Changing a feature impacts folders across the tree | Changes are contained within the feature folder |
| **Code Review** | Reviewers must trace logic across many folders | All relevant context is in one place |
| **Onboarding** | New engineers must understand the entire layer structure first | New engineers can focus on one feature at a time |

For an ERP system with 50+ feature domains (inventory, orders, customers, pricing, promotions, reports, users, roles, permissions, notifications, accounting, procurement, analytics, shipping, returns, refunds, taxation, audit logs, dashboards, settings, etc.), feature-first is the only scale-viable approach.

### Separation of Concerns Between 4 Portals

The VS Boutique ERP serves four distinct portals, each with different user personas, permission models, and UI requirements:

1. **Super Admin Portal** — Internal administration, system-wide configuration, user management, audit logs, global settings
2. **Owner Admin Portal** — Store/business management, inventory, orders, customers, reports, pricing
3. **Customer Portal** — Shopping, order tracking, returns, account management (public-facing)
4. **Mobile Portal** — React Native (Expo) version of the customer experience with shared API layer

Each portal has its own routing tree, layout, authentication flow, and feature set. They share the same **Core** layer for UI primitives, business logic hooks, API services, types, and utilities.

### Shared Core vs Portal-Specific Code

```
Project Boundary
├── Core (shared by all portals)
│   ├── UI primitives (Button, Card, Input, Table, Select, Modal, etc.)
│   ├── Business hooks (useAuth, usePagination, useDebounce, useMediaQuery)
│   ├── API services (apiClient, authService, userService)
│   ├── Utility functions (formatCurrency, formatDate, cn, validators)
│   └── Base types (User, Order, Product, ApiResponse, PaginatedResponse)
│
├── Portal: Super Admin
│   ├── Layout (AdminLayout, Sidebar, Navbar)
│   ├── Features (user-management, audit-logs, global-config, system-health, roles, permissions)
│   └── Auth (AuthProvider, ProtectedRoute, login flow)
│
├── Portal: Owner Admin
│   ├── Layout (OwnerLayout, Dashboard)
│   ├── Features (inventory, orders, customers, pricing, promotions, reports, shipping)
│   └── Auth (AuthProvider, OwnerGuard, onboarding flow)
│
├── Portal: Customer
│   ├── Layout (CustomerLayout, PublicHeader, Footer)
│   ├── Features (catalog, cart, checkout, orders, returns, account, wishlist)
│   └── Auth (CustomerAuthProvider, GuestCartProvider)
│
└── Portal: Mobile
    ├── Shared API layer with web portals
    ├── React Native specific UI (Expo components, native navigation)
    └── Mobile-only features (push notifications, biometric auth, barcode scanner)
```

---

## 2. High-Level Architecture Diagram (ASCII)

```
src/
├── app/                           # Application entry, providers, router
│   ├── main.tsx                   # Entry point (ReactDOM.createRoot)
│   ├── App.tsx                    # Root component with providers
│   ├── providers.tsx              # Composed provider tree
│   ├── router.tsx                 # Portal-aware router configuration
│   └── vite-env.d.ts
│
├── core/                          # Shared core — zero feature imports
│   ├── components/                # UI primitives (atomic design)
│   │   ├── ui/                    # Button, Card, Input, Select, Modal, Table, Badge, etc.
│   │   └── layouts/               # Shared layout primitives (Container, Grid, Stack)
│   ├── hooks/                     # Shared hooks
│   │   ├── useAuth.ts
│   │   ├── useDebounce.ts
│   │   ├── usePagination.ts
│   │   ├── useMediaQuery.ts
│   │   ├── useLocalStorage.ts
│   │   └── useIntersectionObserver.ts
│   ├── services/                  # API layer
│   │   ├── apiClient.ts           # Axios instance, interceptors, error handling
│   │   ├── authService.ts
│   │   ├── userService.ts
│   │   ├── orderService.ts
│   │   ├── productService.ts
│   │   └── inventoryService.ts
│   ├── contexts/                  # Cross-cutting React contexts
│   │   ├── AuthContext.tsx
│   │   ├── NotificationContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── ToastContext.tsx
│   ├── utils/                     # Pure utility functions
│   │   ├── formatCurrency.ts
│   │   ├── formatDate.ts
│   │   ├── cn.ts                  # classnames merge utility
│   │   ├── validators.ts
│   │   └── constants.ts
│   └── guards/                    # Shared route guards
│       ├── ProtectedRoute.tsx
│       └── RoleGuard.tsx
│
├── features/                      # Portal-specific feature modules
│   ├── admin/                     # Super Admin Portal
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Navbar.tsx
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── UserManagementPage.tsx
│   │   │   ├── AuditLogPage.tsx
│   │   │   ├── GlobalConfigPage.tsx
│   │   │   └── SystemHealthPage.tsx
│   │   ├── features/
│   │   │   ├── user-management/
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── services/
│   │   │   │   ├── types/
│   │   │   │   ├── UserManagementPage.tsx
│   │   │   │   └── index.ts
│   │   │   └── audit-logs/
│   │   │       ├── components/
│   │   │       ├── hooks/
│   │   │       ├── services/
│   │   │       ├── types/
│   │   │       └── AuditLogPage.tsx
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── routes.tsx
│   │
│   ├── owner/                     # Owner Admin Portal
│   │   ├── layout/
│   │   │   ├── OwnerLayout.tsx
│   │   │   ├── OwnerSidebar.tsx
│   │   │   └── OwnerNavbar.tsx
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── InventoryPage.tsx
│   │   │   ├── OrdersPage.tsx
│   │   │   ├── CustomersPage.tsx
│   │   │   ├── PricingPage.tsx
│   │   │   └── ReportsPage.tsx
│   │   ├── features/
│   │   │   ├── inventory/
│   │   │   │   ├── components/
│   │   │   │   │   ├── InventoryTable.tsx
│   │   │   │   │   ├── InventoryFilters.tsx
│   │   │   │   │   ├── ProductVariantEditor.tsx
│   │   │   │   │   └── StockAdjustmentForm.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useInventory.ts
│   │   │   │   │   ├── useProductVariants.ts
│   │   │   │   │   └── useStockAdjustments.ts
│   │   │   │   ├── services/
│   │   │   │   │   ├── inventoryApi.ts
│   │   │   │   │   └── productApi.ts
│   │   │   │   ├── types/
│   │   │   │   │   └── inventory.types.ts
│   │   │   │   ├── tests/
│   │   │   │   │   ├── InventoryTable.test.tsx
│   │   │   │   │   └── useInventory.test.ts
│   │   │   │   └── index.ts
│   │   │   └── orders/
│   │   │       ├── components/
│   │   │       │   ├── OrderTable.tsx
│   │   │       │   ├── OrderDetail.tsx
│   │   │       │   ├── OrderStatusBadge.tsx
│   │   │       │   └── OrderTimeline.tsx
│   │   │       ├── hooks/
│   │   │       │   ├── useOrders.ts
│   │   │       │   └── useOrderDetail.ts
│   │   │       ├── services/
│   │   │       │   └── orderApi.ts
│   │   │       ├── types/
│   │   │       │   └── order.types.ts
│   │   │       ├── tests/
│   │   │       └── index.ts
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── routes.tsx
│   │
│   └── customer/                  # Customer Portal
│       ├── layout/
│       │   ├── CustomerLayout.tsx
│       │   ├── PublicHeader.tsx
│       │   └── Footer.tsx
│       ├── pages/
│       │   ├── HomePage.tsx
│       │   ├── CatalogPage.tsx
│       │   ├── ProductPage.tsx
│       │   ├── CartPage.tsx
│       │   ├── CheckoutPage.tsx
│       │   ├── OrderHistoryPage.tsx
│       │   └── AccountPage.tsx
│       ├── features/
│       │   ├── catalog/
│       │   ├── cart/
│       │   ├── checkout/
│       │   ├── orders/
│       │   └── account/
│       ├── hooks/
│       ├── services/
│       ├── types/
│       └── routes.tsx
│
├── assets/                        # Static assets
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── config/                        # Application configuration
│   ├── app.config.ts              # Env-based app configuration
│   ├── api.config.ts              # API base URLs, timeouts, retry logic
│   ├── theme.config.ts            # Tailwind theme extension config
│   └── feature-flags.ts           # Feature flag definitions
│
├── types/                         # Global TypeScript type definitions
│   ├── global.d.ts
│   ├── api.types.ts               # ApiResponse<T>, PaginatedResponse<T>, ErrorResponse
│   ├── user.types.ts              # User, Role, Permission
│   ├── order.types.ts             # Order, OrderItem, OrderStatus
│   └── product.types.ts           # Product, Variant, Category
│
├── locales/                       # i18n translation files
│   ├── en/
│   │   ├── common.json
│   │   ├── admin.json
│   │   ├── owner.json
│   │   └── customer.json
│   └── es/
│       ├── common.json
│       ├── admin.json
│       ├── owner.json
│       └── customer.json
│
└── tests/                         # Integration and E2E tests
    ├── setup.ts
    ├── integration/
    └── e2e/
```

---

## 3. Design Principles

### Single Responsibility

Every file in the codebase has exactly one job. A file either:
- Exports a single component
- Exports a single hook
- Exports a single service function or class
- Defines a type or interface
- Contains utility functions for a single domain
- Serves as a barrel (index.ts) re-exporting from the module

A component file never contains API call logic. A hook file never renders JSX. A service file never imports UI components. This constraint keeps files small, testable, and easy to reason about.

```typescript
// ✅ Good: Single responsibility
// useInventory.ts — only manages inventory state and data fetching
export function useInventory(filters: InventoryFilters) {
  return useQuery({
    queryKey: ['inventory', filters],
    queryFn: () => inventoryApi.getInventory(filters),
  });
}

// ❌ Bad: Mixed concerns
export function InventoryTable() {
  const [data, setData] = useState([]);
  useEffect(() => { fetch('/api/inventory').then(...) }, []);  // API call in component
  return <table>...</table>;  // Rendering logic
}
```

### Feature Encapsulation

All code for a single feature domain lives in one folder. A feature folder contains:
- `components/` — feature-specific presentational and container components
- `hooks/` — feature-specific hooks (data fetching, state logic)
- `services/` — feature-specific API calls (or delegates to core services)
- `types/` — feature-specific type definitions
- `tests/` — feature-specific unit and integration tests
- `index.ts` — barrel file for public exports

No file outside the feature folder imports directly from subdirectories; all external access goes through the barrel file. This creates a clean public API for each feature and allows internal restructuring without affecting consumers.

```typescript
// features/owner/inventory/index.ts
export { InventoryTable } from './components/InventoryTable';
export { InventoryFilters } from './components/InventoryFilters';
export { useInventory } from './hooks/useInventory';
export type { InventoryFilters, InventoryItem } from './types/inventory.types';
```

### Shared Core

UI primitives, shared hooks, API services, utility functions, and base types live in `core/` and are shared by all portals. The golden rule: **duplication is forbidden across portals**. If two portals need the same button style, it lives in `core/components/ui/`. If two features need the same date formatting logic, it lives in `core/utils/`.

Exceptions must be approved by architecture review and documented in the relevant barrel file.

### Strict Layering

The dependency graph enforces strict layering:

```
app/ → core/, features/
features/{portal}/ → core/
core/ → assets/, config/, types/, locales/
```

This means:
- `core/` is completely agnostic of which portal is consuming it
- No feature can import from another feature
- `app/` is the only layer that knows about both core and features
- `assets/`, `config/`, `types/`, `locales/` are leaf nodes with zero internal imports

### Tree-Shakeable

Production builds must not include dead code. Every module uses explicit named exports. Barrel files (`index.ts`) use named re-exports only — no `export *` wildcards that prevent tree-shaking. Circular dependencies are treated as build errors and caught by ESLint plugin `import/no-cycle`.

### Lazy by Default

Every feature page is lazy-loaded via `React.lazy()`. The router configuration never statically imports page components. This ensures that the initial bundle only contains code for the currently active portal.

```typescript
// router.tsx — Lazy by default
const AdminDashboard = lazy(() => import('@features/admin/pages/DashboardPage'));
const InventoryPage = lazy(() => import('@features/owner/pages/InventoryPage'));
const CatalogPage = lazy(() => import('@features/customer/pages/CatalogPage'));
```

### Type Safety

Every module boundary has explicit TypeScript types. All API responses are typed. All component props are typed. All context values are typed. Shared types go in `core/types/` or `types/`. Feature-specific types stay in the feature folder. No `any` types are permitted at module boundaries (enforced by `@typescript-eslint/no-explicit-any` with error severity).

### Testable

Every module has a corresponding test file. Test files live alongside the modules they test:

```
inventory/
├── components/
│   ├── InventoryTable.tsx
│   └── InventoryTable.test.tsx
├── hooks/
│   ├── useInventory.ts
│   └── useInventory.test.ts
└── services/
    ├── inventoryApi.ts
    └── inventoryApi.test.ts
```

Unit tests cover pure logic (utils, hooks, services). Component tests cover rendering and interaction. Integration tests cover feature workflows. E2E tests cover critical user journeys across portals.

---

## 4. Module Boundaries and Dependency Rules

### Strict Import Rules

The following rules are enforced at build time and during CI:

| Source Module | May Import From | May NOT Import From |
|---|---|---|
| `app/` | `core/`, `features/`, `assets/`, `config/`, `types/`, `locales/` | External modules outside the project boundary |
| `features/admin/` | `core/`, `config/`, `types/`, `locales/` | `features/owner/`, `features/customer/`, `app/` |
| `features/owner/` | `core/`, `config/`, `types/`, `locales/` | `features/admin/`, `features/customer/`, `app/` |
| `features/customer/` | `core/`, `config/`, `types/`, `locales/` | `features/admin/`, `features/owner/`, `app/` |
| `core/` | `assets/`, `config/`, `types/`, `locales/` | `features/`, `app/` |
| `assets/` | Nothing (leaf node) | Everything |
| `config/` | Types from `types/` | Everything else |
| `types/` | Nothing (leaf node) | Everything |
| `locales/` | Nothing (leaf node) | Everything |

### Enforcement

Dependency rules are enforced through:

1. **ESLint**: `import/no-restricted-paths` configured to match the rules above
2. **TypeScript Path Aliases**: `@core/*`, `@features/admin/*`, `@features/owner/*`, `@features/customer/*` — imports outside these paths trigger a review
3. **CI Pipeline**: A custom script (`scripts/validate-deps.mjs`) runs on every PR and fails if dependency violations are detected
4. **Architecture Tests**: A test suite verifies that no circular dependencies exist using `madge` or `dependency-cruiser`

### Circular Dependency Prevention

```typescript
// eslint.config.js (flat config)
{
  plugins: { import: importPlugin },
  rules: {
    'import/no-cycle': ['error', { maxDepth: Infinity }],
    'import/no-restricted-paths': ['error', {
      zones: [
        { target: './src/core', from: './src/features', message: 'Core cannot import from features' },
        { target: './src/features/admin', from: './src/features/owner', message: 'No feature-to-feature imports' },
        { target: './src/features/admin', from: './src/features/customer', message: 'No feature-to-feature imports' },
        { target: './src/features/owner', from: './src/features/admin', message: 'No feature-to-feature imports' },
        { target: './src/features/owner', from: './src/features/customer', message: 'No feature-to-feature imports' },
        { target: './src/features/customer', from: './src/features/admin', message: 'No feature-to-feature imports' },
        { target: './src/features/customer', from: './src/features/owner', message: 'No feature-to-feature imports' },
      ]
    }]
  }
}
```

---

## 5. Portal Architecture

### Super Admin Portal

**Entry:** `/admin/*` route prefix.

The Super Admin Portal provides system-wide configuration and administration capabilities. It is wrapped in an `AdminLayout` that provides a persistent sidebar and top navbar for navigation.

```
AdminLayout
├── Sidebar (collapsible, persistent across routes)
│   ├── Dashboard
│   ├── User Management
│   ├── Roles & Permissions
│   ├── Audit Logs
│   ├── System Health
│   ├── Global Configuration
│   └── Feature Flags
├── Navbar (breadcrumbs, search, notifications, user menu)
└── <Outlet /> (lazy-loaded page content)
```

**Architecture details:**
- Protected by `AuthContext` + `RoleGuard` requiring `SUPER_ADMIN` role
- All pages are lazy-loaded via `React.lazy()`
- Sidebar state persisted in `localStorage` via `useLocalStorage`
- Notifications via `NotificationContext` (WebSocket-backed for real-time alerts)
- Separate theme with dense layout optimized for data-heavy screens
- Audit logging built into every mutation via service interceptors

**Route configuration:**
```typescript
{
  path: '/admin',
  element: <ProtectedRoute requiredRole="SUPER_ADMIN"><AdminLayout /></ProtectedRoute>,
  children: [
    { index: true, element: <LazyAdminDashboard /> },
    { path: 'users', element: <LazyUserManagement /> },
    { path: 'audit-logs', element: <LazyAuditLogs /> },
    { path: 'config', element: <LazyGlobalConfig /> },
    { path: 'system-health', element: <LazySystemHealth /> },
  ]
}
```

### Owner Admin Portal

**Entry:** `/owner/*` route prefix.

The Owner Admin Portal provides day-to-day business management capabilities for store owners and their staff. It is wrapped in an `OwnerLayout` with a different navigation structure optimized for operational workflows.

```
OwnerLayout
├── OwnerSidebar
│   ├── Dashboard
│   ├── Inventory
│   ├── Orders
│   ├── Customers
│   ├── Pricing
│   ├── Promotions
│   ├── Reports
│   └── Settings
├── OwnerNavbar (quick actions, notifications, search, profile)
└── <Outlet /> (lazy-loaded page content)
```

**Architecture details:**
- Protected by `AuthContext` + `RoleGuard` requiring `OWNER` or `STAFF` role
- Role-based menu visibility (staff see a subset of menu items)
- Quick-action toolbar in navbar for common operations (add product, create order)
- Reports section uses lazy-loaded chart libraries to keep initial bundle lean
- Inventory and Orders are the most complex features, each with their own sub-routing
- Offline-aware: pending mutations queued when network is unavailable

**Role-based menu filtering:**
```typescript
const menuItems = [
  { label: 'Dashboard', path: '/owner', icon: DashboardIcon, roles: ['OWNER', 'STAFF'] },
  { label: 'Inventory', path: '/owner/inventory', icon: InventoryIcon, roles: ['OWNER', 'STAFF'] },
  { label: 'Orders', path: '/owner/orders', icon: OrdersIcon, roles: ['OWNER', 'STAFF'] },
  { label: 'Customers', path: '/owner/customers', icon: CustomersIcon, roles: ['OWNER', 'STAFF'] },
  { label: 'Reports', path: '/owner/reports', icon: ReportsIcon, roles: ['OWNER'] },
  { label: 'Settings', path: '/owner/settings', icon: SettingsIcon, roles: ['OWNER'] },
].filter(item => item.roles.includes(userRole));
```

### Customer Portal

**Entry:** `/*` (public routes), `/account/*` (authenticated routes).

The Customer Portal is the public-facing storefront. It has a distinct visual theme from the admin portals and must handle a wider range of device sizes and performance conditions.

```
CustomerLayout
├── PublicHeader (logo, search, cart count, account menu)
├── AnnouncementBar (optional promotions banner)
└── <Outlet />
    ├── Public Routes: Home, Catalog, Product Details, Cart
    └── Authenticated Routes: Checkout, Orders, Account, Wishlist

Footer
├── Links, Contact, Social
└── Legal
```

**Architecture details:**
- Public routes wrapped in `CustomerAuthProvider` (handles guest vs authenticated state)
- Separate theme (`customer.theme.config.ts`) with brand colors, typography, and spacing
- Cart managed via `CartContext` (guest: localStorage, authenticated: synced to server)
- Checkout flow is a multi-step wizard with its own sub-routes
- Search uses debounced API calls with loading skeletons
- Product images lazy-loaded with blur-up placeholders
- SEO metadata managed per-page via `react-helmet-async`
- PWA support with service worker for offline product catalog

### Mobile Portal

**Entry:** Expo React Native application.

The Mobile Portal shares the same API layer (`core/services/`) as the web portals. The business logic hooks (`core/hooks/`) are designed to be platform-agnostic where possible, with platform-specific implementations isolated.

**Architecture details:**
- Built with Expo SDK (managed workflow)
- Shared API client (`core/services/apiClient.ts`) adapted for React Native
- Shared business logic hooks with React Native compatible dependencies
- Platform-specific UI components in `features/mobile/`
- Native navigation (Expo Router or React Navigation)
- Push notifications via Expo Notifications API
- Offline-first: local SQLite database with background sync
- Biometric authentication for sensitive operations

```
features/mobile/
├── components/        # Mobile-specific UI components (native buttons, cards, lists)
├── screens/           # Screen-level components (home, catalog, cart, checkout, orders)
├── navigation/        # Stack, tab, and modal navigators
├── hooks/             # Mobile-specific hooks (useCamera, useBiometrics, usePushNotifications)
├── services/          # Mobile-specific services (local db, file storage, deep links)
└── types/             # Mobile-specific types
```

---

## 6. State Management Strategy

### State Categories

The architecture recognizes three distinct categories of state, each with its own management strategy:

| State Category | Examples | Tool | Rationale |
|---|---|---|---|
| **Server State** | Product list, orders, inventory, customers, users | React Query (TanStack Query v5) | Caching, deduplication, background refetching, optimistic updates, stale management |
| **Client State** | Auth status, notifications, theme, sidebar open/close | React Context | Cross-cutting concerns that affect the entire app or large subtrees |
| **Local State** | Form inputs, modal open/close, dropdown selections, filter values | useState / useReducer | Page-level or component-level; no need for global access |

### Server State — React Query

React Query is the primary data fetching and caching layer. It handles all API communication, caching, background refetching, pagination, optimistic updates, and mutation management.

```typescript
// Query configuration defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 minutes before data is considered stale
      gcTime: 30 * 60 * 1000,           // 30 minutes before unused data is garbage collected
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});
```

**Key patterns:**
- Every API call is wrapped in a custom hook that returns a `useQuery` or `useMutation`
- Query keys follow a hierarchical convention: `['domain', 'entity', { filters }]`
- Mutations use optimistic updates for instant UI feedback
- Infinite queries for paginated lists
- Prefetching for anticipated navigation (e.g., prefetch product detail on hover)

```typescript
// Example: Inventory query hook
export function useInventory(filters: InventoryFilters) {
  return useQuery({
    queryKey: ['inventory', 'items', filters],
    queryFn: () => inventoryApi.getInventory(filters),
    select: (data) => ({
      items: data.data,
      totalCount: data.meta.total,
      page: data.meta.page,
      pageSize: data.meta.pageSize,
    }),
    placeholderData: keepPreviousData,  // Keep previous data while loading next page
  });
}

// Example: Mutation with optimistic update
export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InventoryItem> }) =>
      inventoryApi.updateItem(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['inventory'] });
      const previous = queryClient.getQueryData(['inventory']);
      queryClient.setQueryData(['inventory'], (old) => updateItemInCache(old, id, data));
      return { previous };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(['inventory'], context.previous);
      toast.error('Failed to update inventory item');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
```

### Client State — React Context

Server state and local state handle the vast majority of application state. For the small set of truly global client state, React Context is sufficient. The architecture explicitly rejects Redux, Zustand, or other external state management libraries — the complexity and boilerplate they introduce is not justified for this application's state profile.

**Context inventory:**

| Context | Purpose | Persistence |
|---|---|---|
| `AuthContext` | Current user, tokens, login/logout, role | LocalStorage (token), Memory (user) |
| `NotificationContext` | Toast notifications, alert badges | Memory only |
| `ThemeContext` | Active theme, dark/light mode | LocalStorage (preference) |
| `CartContext` | Cart items, add/remove/update | LocalStorage (guest), API (authenticated) |

```typescript
// AuthContext — Core authentication state
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: Role) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      authService.getCurrentUser()
        .then(setUser)
        .catch(() => localStorage.removeItem('auth_token'))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const { user, token } = await authService.login(credentials);
    localStorage.setItem('auth_token', token);
    setUser(user);
  };

  const logout = async () => {
    await authService.logout();
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  const hasRole = (role: Role) => user?.roles.includes(role) ?? false;

  const value = useMemo(() => ({ user, isAuthenticated: !!user, isLoading, login, logout, hasRole }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

### Why No Redux?

The decision to exclude Redux is deliberate and based on the following analysis:

1. **Server state dominance**: Over 80% of application state is server state, which React Query handles more efficiently than Redux
2. **Context scope**: The truly global client state (auth, notifications, theme, cart) fits in 4 contexts — well within React's performance budget
3. **Boilerplate reduction**: No action types, reducers, dispatchers, or connect/mapStateToProps for the majority of state access
4. **Bundle size**: Removing Redux saves ~30KB from the initial bundle
5. **Learning curve**: New team members need to learn fewer concepts

If future requirements demand more complex client state (e.g., real-time collaborative editing), the architecture can adopt Zustand for those specific modules as a scoped dependency.

---

## 7. Performance Strategy

### Lazy Loading

Every feature page is lazy-loaded via `React.lazy()`. This is non-negotiable. The initial bundle contains only the app shell (`app/`) and the core layer (`core/`). Feature code for all four portals is split into separate chunks.

```typescript
// app/router.tsx — code splitting setup
const AdminLayout = lazy(() => import('@features/admin/layout/AdminLayout'));
const OwnerLayout = lazy(() => import('@features/owner/layout/OwnerLayout'));
const CustomerLayout = lazy(() => import('@features/customer/layout/CustomerLayout'));

const AdminDashboard = lazy(() => import('@features/admin/pages/DashboardPage'));
const InventoryPage = lazy(() => import('@features/owner/pages/InventoryPage'));
// ... all pages lazy-loaded

<Routes>
  <Route path="/admin" element={<Suspense fallback={<AdminSkeleton />}><AdminLayout /></Suspense>}>
    <Route index element={<Suspense fallback={<PageSkeleton />}><AdminDashboard /></Suspense>} />
    {/* ... */}
  </Route>
  <Route path="/owner" element={<Suspense fallback={<OwnerSkeleton />}><OwnerLayout /></Suspense>}>
    <Route index element={<Suspense fallback={<PageSkeleton />}><OwnerDashboard /></Suspense>} />
    {/* ... */}
  </Route>
</Routes>
```

Additional code splitting strategies:

| Strategy | Location | Benefit |
|---|---|---|
| **Route-based** | Every page component via `React.lazy()` | Reduces initial bundle by ~60-70% |
| **Component-level** | Heavy components (charts, rich text editors, data grids) via `React.lazy()` | Defers loading heavy third-party libraries |
| **Library-level** | Moment.js, lodash, chart libraries via dynamic import | Prevents library code from blocking initial render |
| **Portal-level** | Each portal loads independently | Users only download the portal they are using |

### React Query Caching

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 min — data is fresh, no refetch on mount
      gcTime: 30 * 60 * 1000,         // 30 min — data kept in cache after unmount
      retry: 2,
      refetchOnWindowFocus: false,    // Only enable for data that changes frequently
    },
  },
});
```

Smart caching is the single biggest performance lever in this application. React Query handles cache invalidation, garbage collection, background refetching, and deduplication. Each feature defines its own caching strategy via query configuration:

- **Dashboard data**: `staleTime: 0` (always fresh), `refetchInterval: 30_000` (poll every 30s)
- **Product catalog**: `staleTime: 10 * 60 * 1000` (10 min), `gcTime: 60 * 60 * 1000` (1 hour)
- **User list**: `staleTime: 2 * 60 * 1000` (2 min)
- **Static data (countries, currencies)**: `staleTime: Infinity`, `gcTime: Infinity`

### Memoization

Memoization is applied at render boundaries to prevent unnecessary re-renders:

```typescript
// React.memo — component-level memoization for expensive renders
export const InventoryTable = React.memo(function InventoryTable({ items }: InventoryTableProps) {
  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.Head>SKU</Table.Head>
          <Table.Head>Name</Table.Head>
          <Table.Head>Quantity</Table.Head>
          <Table.Head>Price</Table.Head>
          <Table.Head>Actions</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {items.map((item) => (
          <InventoryRow key={item.id} item={item} />
        ))}
      </Table.Body>
    </Table>
  );
});

// useMemo — expensive computations
const sortedItems = useMemo(() => {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}, [items]);

// useCallback — stable callback references
const handleFilterChange = useCallback((filters: InventoryFilters) => {
  setFilters(filters);
}, []);
```

**Memoization guidelines:**
- `React.memo` on list items, table rows, and components that receive complex props
- `useMemo` for expensive computations (sorting, filtering, formatting lists > 100 items)
- `useCallback` for callbacks passed to child components that use `React.memo`
- Do NOT memoize prematurely — profile first, memoize second

### Bundle Optimization

| Technique | Implementation |
|---|---|
| **Tree-shaking** | Barrel files with named exports, no `export *` |
| **Code splitting** | Route-based + component-level `React.lazy()` |
| **Dependency optimization** | Vite automatically externalizes large deps for separate chunking |
| **CSS optimization** | Tailwind CSS v4 purges unused styles at build time |
| **Image optimization** | Avif/WebP format, lazy loading, blur-up placeholders |
| **Font subsetting** | Subset fonts to only include used characters |
| **Compression** | Brotli compression at CDN level |

---

## 8. Scalability Design

### How the Architecture Scales to 5,000+ Files

The feature-first architecture is designed to scale linearly with the number of features. Each new feature is an isolated module with minimal coupling to the rest of the codebase. The structural overhead per feature is zero — the architecture imposes no per-feature configuration, registration, or wiring ceremony beyond adding a new folder.

**Scaling characteristics:**

| Metric | Small (50 features) | Medium (200 features) | Large (500+ features) |
|---|---|---|---|
| **Import depth** | 3-4 levels | 3-4 levels | 3-4 levels (constant) |
| **Build time** | ~2s | ~8s | ~20s |
| **Dev server startup** | <1s | ~2s | ~5s |
| **Feature isolation** | Complete | Complete | Complete |
| **Testing isolation** | Complete | Complete | Complete |

The key insight: the architecture's complexity is O(n) in the number of features, not O(n²). Since features never import from each other, adding a 500th feature has no structural impact on the existing 499 features.

### Adding New Features

Creating a new feature is a deterministic process:

```
1. mkdir -p src/features/{portal}/{feature-name}/{components,hooks,services,types,tests}
2. Create the feature's main component(s) in components/
3. Create data-fetching hooks in hooks/
4. Create API service functions in services/
5. Define feature-specific types in types/
6. Create barrel file (index.ts) with public exports
7. Add route in the portal's routes.tsx
8. Add lazy import in the router configuration
9. Write unit and component tests in tests/
10. Add translation keys in locales/
```

This process works identically whether adding "Product Variants" to the owner portal or "User Roles" to the admin portal.

### Adding New Portals

Adding a new portal (e.g., "Vendor Portal") follows the same pattern:

```
1. mkdir -p src/features/vendor/{layout,pages,features,hooks,services,types}
2. Create VendorLayout with portal-specific navigation
3. Create vendor-specific AuthProvider
4. Define vendor-specific routes in routes.tsx
5. Add portal route in the root router (e.g., /vendor/*)
6. Add vendor-specific theme configuration if needed
7. Add vendor-specific translation files in locales/
8. Write integration tests for the new portal
```

The new portal automatically benefits from all shared core (UI components, hooks, services, types, utils) without requiring any changes to the core layer.

### Adding New UI Components

All shared UI components live in `core/components/ui/`. Adding a new component:

```
1. Create the component file: core/components/ui/{ComponentName}.tsx
2. Export from core/components/ui/index.ts
3. Use @core/components/ui/{ComponentName} anywhere in the application
```

Component naming follows a consistent pattern:
- Atomic: `Button`, `Input`, `Select`, `Checkbox`, `Radio`, `Toggle`, `Badge`, `Avatar`
- Composite: `Table`, `Card`, `Modal`, `Dialog`, `Drawer`, `Accordion`, `Tabs`, `Tooltip`
- Layout: `Container`, `Grid`, `Stack`, `Flex`, `Divider`, `Spacer`
- Feedback: `Toast`, `Alert`, `Progress`, `Skeleton`, `Spinner`, `EmptyState`

Each component is built on Tailwind CSS 4 utility classes with consistent design tokens. No component-specific CSS files are created — all styling is inline with Tailwind classes.

### Adding New API Endpoints

API service functions are organized by domain in `core/services/`:

```
core/services/
├── apiClient.ts          # Base Axios instance with interceptors, auth headers, error handling
├── authService.ts        # login, logout, refreshToken, getCurrentUser
├── userService.ts        # getUsers, getUser, createUser, updateUser, deleteUser
├── productService.ts     # getProducts, getProduct, createProduct, updateProduct, deleteProduct
├── orderService.ts       # getOrders, getOrder, createOrder, updateOrderStatus
├── inventoryService.ts   # getInventory, updateStock, adjustStock, getStockHistory
├── customerService.ts    # getCustomers, getCustomer, createCustomer
├── reportService.ts      # getSalesReport, getInventoryReport, getCustomerReport
└── analyticsService.ts   # getDashboardMetrics, getTrends
```

Adding a new endpoint:
```
1. If domain exists, add the function to the existing service file
2. If new domain, create a new service file: core/services/{domain}Service.ts
3. Export from core/services/index.ts
4. Create a hook in the feature that consumes the service
```

### File Organization Conventions

| Pattern | Convention |
|---|---|
| **File names** | PascalCase for components (`InventoryTable.tsx`), camelCase for hooks/services/utils (`useInventory.ts`, `inventoryApi.ts`) |
| **Folder names** | kebab-case for feature folders (`user-management/`), no abbreviation |
| **One export per file** | Each file exports exactly one thing (component, hook, function, or type) |
| **Barrel files** | `index.ts` per folder, named re-exports only |
| **Test files** | `{ModuleName}.test.tsx` alongside the module |
| **Type files** | `{domain}.types.ts` per feature, `{entity}.types.ts` in types/ |

---

## 9. Migration Strategy Overview

### 10-Phase Migration Plan

The migration from the legacy codebase to the new architecture is executed in 10 phases over approximately 12-16 weeks. Each phase is designed to be deployed independently with zero breaking changes.

| Phase | Name | Duration | Description |
|---|---|---|---|
| **1** | Foundation | Week 1-2 | Create project structure, configure Vite, TypeScript, ESLint, Tailwind, React Router, React Query. Set up path aliases. Create `app/` entry point. |
| **2** | Core Layer | Week 2-3 | Build `core/components/ui/` primitives. Implement `apiClient`, shared hooks, utility functions. Establish `config/`, `types/`, `locales/`. |
| **3** | Auth & Layout | Week 3-4 | Implement `AuthContext`, `AuthProvider`, `ProtectedRoute`, `RoleGuard`. Build layout components for all portals. Set up router structure. |
| **4** | Admin Portal | Week 4-6 | Migrate Super Admin features: dashboard, user management, audit logs, global config. |
| **5** | Owner Portal | Week 6-8 | Migrate Owner Admin features: dashboard, inventory, orders, customers, pricing, reports. |
| **6** | Customer Portal | Week 8-10 | Migrate Customer features: catalog, cart, checkout, orders, account. |
| **7** | Mobile Portal | Week 10-11 | Set up Expo project, share API layer, migrate mobile screens. |
| **8** | Testing & QA | Week 11-12 | Write comprehensive tests. QA passes on all portals. |
| **9** | Performance | Week 12-13 | Performance audit, bundle analysis, Lighthouse scores, load testing. |
| **10** | Cutover | Week 13-14 | DNS switch, legacy sunset, monitoring, rollback plan. |

### Coexistence Strategy

During migration, the old and new codebases coexist. The strategy ensures zero downtime and zero breaking changes:

1. **Original exports preserved**: Every migrated file keeps its original export names so existing consumers are unaffected
2. **Barrel files are re-exports only**: `index.ts` files never modify data — they only re-export. This means they can be safely redirected from old paths to new paths without behavior changes
3. **Vite aliases**: Clean import paths are configured in Vite:
   ```typescript
   // vite.config.ts
   resolve: {
     alias: {
       '@core': path.resolve(__dirname, 'src/core'),
       '@features/admin': path.resolve(__dirname, 'src/features/admin'),
       '@features/owner': path.resolve(__dirname, 'src/features/owner'),
       '@features/customer': path.resolve(__dirname, 'src/features/customer'),
       '@assets': path.resolve(__dirname, 'src/assets'),
       '@config': path.resolve(__dirname, 'src/config'),
       '@types': path.resolve(__dirname, 'src/types'),
       '@locales': path.resolve(__dirname, 'src/locales'),
     }
   }
   ```
4. **Gradual adoption**: Teams migrate features incrementally. Unmigrated features continue to work from legacy paths
5. **Parallel deployment**: Both architectures serve the same application. The router directs migrated routes to new components and unmigrated routes to legacy components

### Migration Pattern per Feature

Each feature migration follows the same pattern:

```typescript
// 1. Legacy file (pre-migration)
// src/old/InventoryPage.jsx
export default function InventoryPage() { /* ... */ }

// 2. New feature structure created, original export preserved
// src/features/owner/inventory/index.ts
export { InventoryPage } from './components/InventoryPage';

// 3. Legacy file becomes a re-export barrel
// src/old/InventoryPage.jsx
export { InventoryPage } from '@features/owner/inventory';

// 4. Eventually, all consumers updated to use new path
// All code now imports from @features/owner/inventory
// Legacy file and directory can be deleted
```

### Rollback Strategy

Each phase includes a rollback plan:

- **Revert deployment**: Previous deployment is always available for immediate rollback
- **Feature flags**: Each migrated feature is behind a feature flag, allowing instant toggling
- **Canary releases**: New architecture is deployed to a subset of users first
- **Monitoring**: Error tracking (Sentry) and performance monitoring (DataDog/NewRelic) compare metrics between old and new architecture
- **Duration**: Rollback window is 72 hours post-deployment per phase

---

## 10. Technology Stack Summary

### Core Framework

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19 | UI component library with Concurrent Features support |
| **Vite** | 8 | Build tool and dev server with instant HMR |
| **React Router** | 7 | Declarative routing with loaders, actions, and lazy loading |
| **TypeScript** | 5.x | Type safety (opt-in JSDoc migration path for existing code) |

### Data & State

| Technology | Version | Purpose |
|---|---|---|
| **TanStack React Query** | 5 | Server state management (caching, fetching, mutations) |
| **React Context** | — | Cross-cutting client state (auth, notifications, theme, cart) |
| **Axios** | 1.x | HTTP client with interceptors, cancellation, and request/response transforms |

### Styling & Animation

| Technology | Version | Purpose |
|---|---|---|
| **Tailwind CSS** | 4 | Utility-first CSS framework with JIT compilation |
| **Framer Motion** | 12 | Declarative animations and gesture handling |
| **clsx / tailwind-merge** | — | Conditional class name merging utilities |

### Quality & Tooling

| Technology | Version | Purpose |
|---|---|---|
| **ESLint** | 10 | Static analysis with flat config (`eslint.config.js`) |
| **Prettier** | 3.x | Opinionated code formatting |
| **Vitest** | 2.x | Unit and component testing (Vite-native) |
| **React Testing Library** | 16 | Component testing with user-centric queries |
| **Playwright** | 1.x | E2E and integration testing |
| **Husky** | 9.x | Git hooks for pre-commit linting and testing |
| **lint-staged** | 15.x | Run linters only on staged files |

### Documentation

| Technology | Purpose |
|---|---|
| **JSDoc** | In-code documentation with TypeScript type annotations |
| **TypeScript** | Strict mode for type safety (opt-in migration path) |
| **Storybook** | UI component catalog (planned for Phase 2) |

### Infrastructure

| Technology | Purpose |
|---|---|
| **Docker** | Containerized development and deployment |
| **GitHub Actions** | CI/CD pipeline with parallel testing and deployment |
| **AWS CloudFront + S3** | Static asset hosting and CDN |
| **Cloudflare** | DNS, DDoS protection, CDN caching |

### Dependency Philosophy

The stack is intentionally lean. Every dependency must justify its inclusion:

- **No Redux / Zustand / Jotai**: React Query + Context is sufficient for the state profile
- **No Moment.js / Day.js**: Native `Intl.DateTimeFormat` and `Intl.NumberFormat` for date and currency formatting
- **No Lodash**: Modern JavaScript APIs (Array methods, optional chaining, nullish coalescing) cover 95% of use cases
- **No Material UI / Ant Design / Chakra**: Tailwind CSS provides the design system foundation without framework lock-in
- **No i18next**: Custom lightweight i18n solution using JSON files and React Context (migratable to i18next if needed)
- **No Axios alternatives (ky, fetch wrappers)**: Axios already present and widely understood

Each new dependency requires architecture review approval and a documented justification in the project's dependency decision log.

---

*This document is maintained by the Architecture Review Board. Proposals for architectural changes must be submitted as RFCs and approved by at least two architecture reviewers.*
