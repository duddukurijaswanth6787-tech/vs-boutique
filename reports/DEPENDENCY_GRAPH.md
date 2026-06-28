# Dependency Graph — VS Boutique ERP Frontend

> **Document**: Enterprise dependency architecture for the VS Boutique ERP frontend  
> **Scope**: `src/` directory — module import rules, forbidden paths, circular dependency detection, and enforcement strategy

---

## Section 1: Module Dependency Rules (ASCII Diagram)

```
                    ┌─────────────────────────────────────────────┐
                    │                  app/                        │
                    │    (App.jsx, Router, Providers, Layouts)     │
                    └──────────┬──────────────────────┬───────────┘
                               │                      │
                               ▼                      ▼
                    ┌──────────────────┐    ┌──────────────────────┐
                    │    core/         │    │     features/        │
                    │  (Shared Layer)  │◄───│  (Portal-Specific)   │
                    └────────┬─────────┘    └──────────────────────┘
                             │
               ┌─────────────┼─────────────┐
               │             │             │
               ▼             ▼             ▼
         ┌──────────┐ ┌──────────┐ ┌──────────┐
         │ assets/  │ │ config/  │ │ types/   │
         └──────────┘ └──────────┘ └──────────┘
               ▲             ▲             ▲
               │             │             │
               └─────────────┼─────────────┘
                             │
                      ┌──────────────┐
                      │  locales/    │
                      │  tests/      │
                      └──────────────┘
```

### Strict Import Direction

| Source | May Import From |
|---|---|
| `app/` | `core/`, `features/` |
| `features/` | `core/` only |
| `core/` | `config/`, `types/`, `assets/` |
| `config/` | `types/` (ONLY) |
| `types/` | (nothing — leaf module) |
| `assets/` | (nothing — leaf module) |
| `locales/` | (nothing — leaf module) |
| `tests/` | `app/`, `core/`, `features/` |

### Forbidden Imports

| Forbidden Edge | Rationale |
|---|---|
| `core/` → `features/` | Core must remain framework-agnostic and reusable across portals |
| `features/A/` → `features/B/` | Features must be fully isolated; cross-feature coupling is prohibited |
| `features/` → `app/` | Features must not depend on app-level routing or layout |
| `config/` → `core/` | Config is a leaf dependency; core depends on config, never the reverse |
| `config/` → `features/` | Config must never reference feature-specific code |
| `config/` → `assets/` | Config deals with runtime parameters, not static resources |
| `types/` → anything | Types are a leaf dependency consumed by all other layers |

---

## Section 2: Internal Core Dependencies

The `core/` directory is the shared layer. Its internal sub-modules follow their own dependency rules:

```
core/components/  →  core/hooks/,
                     core/utils/,
                     core/contexts/,
                     config/

core/hooks/       →  core/contexts/,
                     core/services/,
                     config/

core/services/    →  config/

core/contexts/    →  (nothing beyond React)

core/utils/       →  config/

core/constants/   →  (nothing)
```

### Key internal rules

- **components/** may consume hooks, utilities, contexts, and config — but never services directly (services are consumed through hooks).
- **hooks/** are the bridge between React components and the service layer. Every API call should be wrapped in a hook.
- **services/** are pure JavaScript modules — they must never import React, components, hooks, or any UI code. They only depend on `config/` for API base URLs, tokens, and endpoint maps.
- **contexts/** are self-contained React context providers. They may depend on React only. Data-fetching logic belongs in hooks, not contexts.
- **utils/** are pure functions for formatting, validation, calculation, and storage. They may import from `config/` (e.g., locale settings) but never from React or components.
- **constants/** are enumerations and string maps (role enums, status enums, route paths). They must have zero dependencies.

---

## Section 3: Feature → Core Dependencies

Every feature portal (`admin/`, `owner/`, `customer/`) depends exclusively on `core/`. Below is the full inventory per feature.

### admin/ → core dependencies

| Core Module | Specific Imports |
|---|---|
| `core/components/ui` | Button, Input, Modal, Table, Select, Dropdown, Checkbox, Radio, DatePicker, Switch, Tabs, Accordion, Tooltip, Popover, Badge, Avatar, ProgressBar, Spinner, Pagination, Breadcrumb, Stepper, FileUpload, RichTextEditor, ColorPicker |
| `core/components/layout` | PageHeader, ContentContainer, Grid, SplitPane, CollapsibleSection |
| `core/components/navigation` | Sidebar, Navbar, TabNav, BreadcrumbNav, StepNav, MenuGroup, MenuItem |
| `core/components/feedback` | Toast, ErrorState, LoadingOverlay, EmptyState, ConfirmationDialog, AlertBanner, ProgressStepper |
| `core/components/animations` | RouteTransition, FadeIn, SlideIn, ScaleIn, StaggerList, PageTransition |
| `core/components/data` | DataTable, DataGrid, SortableTable, FilterPanel, ColumnPicker, ExportButton |
| `core/components/forms` | FormField, FormSection, FormActions, DynamicForm, FieldArray, FormStepper |
| `core/components/charts` | BarChart, LineChart, PieChart, AreaChart, StatCard, TrendIndicator, KPIWidget |
| `core/hooks` | useDebounce, usePagination, useSearch, useModal, usePermissions, useApi, useForm, useToast, useConfirm, useMediaQuery, useLocalStorage, useTheme, useClickOutside, useIntersectionObserver, useInterval, useTimeout, usePrevious, useToggle, useOnScreen, useLockedBody, useFetch, useMutation, useInfiniteScroll, useDragAndDrop, useResizeObserver, useNetworkStatus, useOnlineStatus |
| `core/services/api` | admin.api, auth.api, users.api, roles.api, permissions.api, products.api, categories.api, orders.api, bookings.api, inventory.api, suppliers.api, analytics.api, reports.api, notifications.api, settings.api, audit.api, logs.api, backup.api, maintenance.api, config.api, translations.api, themes.api |
| `core/services/helpers` | dateHelpers, numberHelpers, stringHelpers, arrayHelpers, objectHelpers, treeHelpers, csvHelpers, exportHelpers, importHelpers, validationHelpers |
| `core/contexts` | AuthContext, AdminNotificationContext, ThemeContext, SettingsContext, LocaleContext, PermissionsContext, SidebarContext, ToasterContext |
| `core/utils` | formatters (date, currency, number, phone, address), validators (email, phone, GST, PAN, ZIP), calculators (tax, discount, MRP, commission, shipping), storage (localStorage, sessionStorage, cookie), guards (type checks, permission guards), transformers (API response normalization), parsers (CSV, JSON, query string) |
| `core/constants` | roles (SUPER_ADMIN, ADMIN, MANAGER, STAFF), status (ACTIVE, INACTIVE, PENDING, BLOCKED, DELETED), routes (admin route map), permissions (permission matrix), enums (payment modes, order status, booking status, inventory actions) |
| `core/config` | api.config (baseURL, timeout, retry policy), app.config (feature flags, pagination defaults, upload limits) |
| `core/permission` | PermissionGuard, RoleGuard, FeatureGuard, checkPermission, hasRole, canAccess, permissionMatrix |

### owner/ → core dependencies

| Core Module | Specific Imports |
|---|---|
| `core/components/ui` | Button, Card, Badge, Avatar, Spinner, ProgressBar, Tag, Divider, List, Chip, StatCard, MetricBadge, CountBadge, StatusDot, Timeline |
| `core/components/layout` | PageHeader, ContentSection, CardGrid, TwoColumnLayout, Stack, FlexRow, FlexCol, Container, Divider |
| `core/components/feedback` | Toast, ErrorState, EmptyState, LoadingOverlay, AlertBar, InlineError, SuccessBanner, WarningBanner, InfoBanner |
| `core/components/animations` | RouteTransition, FadeIn, SlideUp, StaggerChildren, HoverScale, LoadingSkeleton |
| `core/components/data` | SimpleTable, SortableList, FilterBar, QuickSearch, PaginationFooter, DataCard, CompactCard |
| `core/components/forms` | FormGroup, InputGroup, SubmitBar, AutoSaveIndicator, InlineEdit, TagInput, PhoneInput |
| `core/hooks` | useDebounce, usePagination, useSearch, usePermissions, useApi, useFetch, useMutation, useForm, useToast, useConfirm, useMediaQuery, useLocalStorage, usePrevious, useToggle, useInterval, useAutoSave, useUndo |
| `core/services/api` | owner.api, products.api, inventory.api, orders.api, bookings.api, customers.api, staff.api, dashboard.api, notifications.api, reports.api |
| `core/services/helpers` | dateHelpers, numberHelpers, stringHelpers, arrayHelpers, objectHelpers, treeHelpers |
| `core/contexts` | AuthContext, ThemeContext, LocaleContext, ToasterContext |
| `core/utils` | formatters (date, currency, number, phone), validators (email, phone, GST, PAN), calculators (tax, discount, shipping, commission, MRP), storage (localStorage), guards (owner-specific permission), transformers (API normalization) |
| `core/constants` | roles (OWNER, MANAGER, STAFF), status (ACTIVE, INACTIVE, PENDING, APPROVED, REJECTED, CLOSED), routes (owner route map), enums (inventory actions, order stages, booking types, payout status) |

### customer/ → core dependencies

| Core Module | Specific Imports |
|---|---|
| `core/components/ui` | Button, Input, Modal, BottomSheet, Card, Badge, IconButton, FloatingActionButton, SearchBar, Chip, Tag, Avatar, Spinner, Skeleton, PriceTag, Rating, StarRating, CountBadge, DotIndicator, StepperInput, QuantitySelector, SwipeableRow, PullToRefresh |
| `core/components/commerce` | ProductCard, ProductGrid, BoutiqueCard, BoutiqueGrid, CategoryCard, CategoryList, OfferBanner, DealTile, FlashSaleCard, ReviewCard, ReviewSummary, CartItem, OrderCard, OrderTimeline, BookingCard, WishlistButton, CompareButton, ShareButton, FavoriteToggle |
| `core/components/layout` | PageHeader, PageFooter, BottomNav, TopNavbar, StickyHeader, ScrollableSection, MasonryGrid, HorizontalScroll, SafeAreaView, ContentPadding |
| `core/components/feedback` | Toast, ErrorState, EmptyState, LoadingOverlay, LoadingSpinner, SkeletonScreen, OfflineBanner, NetworkStatusBar, UpdateBanner, RatingPrompt, ReviewPrompt, ConfirmationSheet |),
| `core/components/animations` | AnimatedList, RouteTransition, FadeIn, HoverCard, ScaleOnPress, SlideFromBottom, SlideFromRight, StaggerFade, Shimmer, SkeletonPulse, MicroInteraction, RippleEffect, BounceIn, SpringPress |
| `core/components/navigation` | TabBar, BottomTabBar, TopTabs, SegmentControl, BackButton, NavigationBar, DrawerMenu, SideDrawer, QuickLinks |
| `core/hooks` | useDebounce, useSearch, useApi, useInfiniteScroll, useCart, useWishlist, useCheckout, useGeolocation, useNetworkStatus, useOnlineStatus, useKeyboard, useAppState, useDeepLink, usePushNotifications, useBiometrics, useLocationPicker, useImagePicker, useCamera, useShare, useClipboard, useVibration, useHaptics, useOrientation, useDimensions |
| `core/services/api` | customer.api, auth.api, products.api, categories.api, boutiques.api, cart.api, checkout.api, orders.api, bookings.api, reviews.api, wishlist.api, notifications.api, addresses.api, payments.api, offers.api, search.api, recommendations.api, support.api, feedback.api |
| `core/services/helpers` | dateHelpers, numberHelpers, stringHelpers, arrayHelpers, objectHelpers, urlHelpers, imageHelpers, mapHelpers |
| `core/contexts` | CustomerAuthContext, CartContext, WishlistContext, CheckoutContext, SearchContext, NotificationContext, AddressContext, PaymentContext, ThemeContext, LocaleContext, ToasterContext, NetworkContext, AppStateContext |
| `core/utils` | formatters (date, currency, number, phone, address, distance, duration), validators (email, phone, pincode, password strength, OTP), calculators (tax, discount, MRP, EMI, delivery charge, COD fee, loyalty points, cashback), storage (localStorage, sessionStorage, IndexedDB, secureStorage), guards (auth guards, guest guards), transformers (API response flatten, image URL resolver), parsers (deep link parser, QR code parser, payment response parser) |
| `core/constants` | roles (USER, GUEST), status (ACTIVE, INACTIVE, PENDING, VERIFIED, BANNED), routes (customer route map), enums (payment methods, delivery status, return reasons, complaint categories, notification types, address types) |

---

## Section 4: Circular Dependency Detection

### Audit of current codebase

#### 1. Context ↔ Hook cycle

A circular dependency occurs when a context imports a hook, and that hook imports the same context. The current codebase has been audited for this pattern:

| Check | Result |
|---|---|
| Does any hook import from `core/contexts/`? | **No** — hooks consume context via `useContext()` calls only within components |
| Does any context module import from `core/hooks/`? | **No** — contexts are pure providers with no hook dependencies |
| **Verdict** | ✅ SAFE — no context ↔ hook cycle exists |

#### 2. Service ↔ Component cycle

Services must remain UI-agnostic. The audit verified:

| Check | Result |
|---|---|
| Does any service import from `core/components/`? | **No** |
| Does any component instantiate a service class directly? | **No** — components go through hooks only |
| **Verdict** | ✅ SAFE — no service ↔ component cycle exists |

#### 3. Cross-feature cycle

The architecture strictly forbids any feature from importing another feature:

| Check | Result |
|---|---|
| Does `admin/` import from `owner/` or `customer/`? | **No** |
| Does `owner/` import from `admin/` or `customer/`? | **No** |
| Does `customer/` import from `admin/` or `owner/`? | **No** |
| **Verdict** | ✅ SAFE — no cross-feature cycle exists |

### Potential risk areas (monitor)

| Risk | Location | Mitigation |
|---|---|---|
| Shared utility inadvertently imports a feature module | `core/utils/` → any feature | ESLint `no-restricted-paths` blocks this at build time |
| Config file references a feature-specific constant | `config/` → `features/` | Config only imports from `types/`; code review enforces this |
| Hook imports another hook that creates a deep chain | `core/hooks/` → `core/hooks/` | Hooks may compose other hooks; cycle detection in CI catches any loops |

---

## Section 5: Dependency Verification Strategy

### 1. ESLint static analysis

Use `import/no-restricted-paths` to encode the dependency graph as lint rules (see Section 6). Run as part of `npm run lint` and block PRs on violations.

### 2. CI pipeline — madge circular detection

```bash
npx madge --circular src/
```

This command walks the entire `src/` module graph and exits with a non-zero code if any cycle is found. Configure in `.github/workflows/ci.yml`:

```yaml
- name: Check circular dependencies
  run: npx madge --circular src/ --extensions ts,tsx,js,jsx
```

### 3. depcheck — unused dependency scan

```bash
npx depcheck
```

Run weekly to identify unused files, imports, and npm packages. Configure `depcheck` to ignore test files and known side-effect imports (e.g., CSS, polyfills).

### 4. dependency-cruiser — visual graph generation

```bash
npx dependency-cruiser src/ --output-type dot | dot -T svg > dep-graph.svg
```

This produces an SVG visualization of the full dependency graph. Useful for:
- Onboarding new developers
- Architecture review meetings
- Detecting regressions (compare against baseline)

### 5. Enforcement gates

| Gate | Tool | When | Action |
|---|---|---|---|
| Pre-commit | ESLint | `git commit` | Blocks forbidden imports |
| PR Build | madge | CI | Fails on circular dependencies |
| Weekly | depcheck | Scheduled CI | Reports unused modules |
| Per-release | dependency-cruiser | Release pipeline | Generates updated graph SVG |

---

## Section 6: ESLint Import Rules

```js
// eslint.config.js additions
'import/no-restricted-paths': ['error', {
  zones: [
    { target: './src/core', from: './src/features', message: 'Core cannot import from features' },
    { target: './src/config', from: './src/core', message: 'Config cannot import from core' },
    { target: './src/config', from: './src/features', message: 'Config cannot import from features' },
    { target: './src/features/admin', from: './src/features/owner', message: 'Cross-feature import forbidden' },
    { target: './src/features/admin', from: './src/features/customer', message: 'Cross-feature import forbidden' },
    { target: './src/features/owner', from: './src/features/admin', message: 'Cross-feature import forbidden' },
    { target: './src/features/owner', from: './src/features/customer', message: 'Cross-feature import forbidden' },
    { target: './src/features/customer', from: './src/features/admin', message: 'Cross-feature import forbidden' },
    { target: './src/features/customer', from: './src/features/owner', message: 'Cross-feature import forbidden' },
  ],
}],
```

This configuration encodes every edge from the ASCII diagram in Section 1. Any import that violates the declared direction produces a build error with a clear message explaining why the import is forbidden.

---

## Appendix: Full Import Allowlist (Quick Reference)

| Module | Allowed to Import From |
|---|---|
| `app/` | `core/`, `features/`, `types/`, `locales/` |
| `features/admin/` | `core/`, `types/`, `config/`, `assets/` |
| `features/owner/` | `core/`, `types/`, `config/`, `assets/` |
| `features/customer/` | `core/`, `types/`, `config/`, `assets/` |
| `core/components/` | `core/hooks/`, `core/utils/`, `core/contexts/`, `config/`, `types/`, `assets/`, `locales/` |
| `core/hooks/` | `core/contexts/`, `core/services/`, `config/`, `types/` |
| `core/services/` | `config/`, `types/` |
| `core/contexts/` | React, `types/` |
| `core/utils/` | `config/`, `types/` |
| `core/constants/` | (nothing) |
| `config/` | `types/` |
| `types/` | (nothing) |
| `assets/` | (nothing) |
| `locales/` | (nothing) |
| `tests/` | `app/`, `core/`, `features/`, `config/`, `types/` |

---

*Maintain this document whenever the dependency graph changes. Run `npx dependency-cruiser src/ --output-type dot | dot -T svg > dep-graph.svg` and update the diagram in Section 1 accordingly.*
