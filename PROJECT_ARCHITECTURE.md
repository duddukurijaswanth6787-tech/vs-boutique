# VS Boutique ERP — Enterprise Project Architecture

This document defines the final architectural design, directory layouts, and folder trees for the VS Boutique ERP across the Web, Mobile, and Backend applications. 

No production files will be moved or modified until this final architecture specification is formally approved.

---

## 1. WEB ARCHITECTURE (React + Vite)

### 1.1 Complete Target Folder Tree

Below is the complete target folder structure for the Web client. Every directory listed here will exist after the migration is complete.

```
web/src/
├── app/                                # Application shell - routing and layout containers
│   ├── layouts/                        # Routing layout shells
│   │   ├── AdminLayout.jsx
│   │   ├── OwnerLayout.jsx
│   │   └── CustomerLayout.jsx
│   ├── router/                         # Combined browser router and guards
│   │   ├── index.jsx                   # Merges all routes into createBrowserRouter
│   │   ├── ProtectedRoute.jsx          # Auth guard routing boundary
│   │   ├── AdminRoutes.jsx
│   │   ├── OwnerRoutes.jsx
│   │   ├── CustomerRoutes.jsx
│   │   ├── AuthRoutes.jsx
│   │   └── SharedRoutes.jsx
│   ├── App.jsx                         # Main container compiling global providers and routes
│   └── index.css                       # Global CSS & Tailwind imports
│
├── providers/                          # Global application context providers
│   ├── AuthProvider.jsx                # Admin/Owner auth provider
│   ├── QueryProvider.jsx               # TanStack query client context
│   ├── ThemeProvider.jsx               # Light/Dark mode state
│   ├── NotificationProvider.jsx        # Customer in-app alert contexts
│   ├── ModalProvider.jsx               # Centralized modal popup triggers
│   ├── PermissionProvider.jsx          # User action RBAC rules
│   └── index.jsx                       # Entry composer nesting all providers
│
├── core/                               # Domain-agnostic foundation
│   ├── components/                     # Pure reusable UI components
│   │   ├── ui/                         # Buttons, inputs, switches, labels
│   │   ├── layout/                     # Container, Grid, Stack, Section
│   │   ├── navigation/                 # Sidebar, Navbar, MegaMenu, MobileNav
│   │   ├── forms/                      # Input wrappers, form layout cards
│   │   ├── feedback/                   # Spinners, empty status indicators
│   │   ├── data-display/               # Pagination, badges
│   │   ├── overlays/                   # Modal backdrops, bottom sheets
│   │   ├── charts/                     # Reusable graph wrapper components
│   │   ├── tables/                     # Styled data tables
│   │   ├── cards/                      # Elevated surface containers
│   │   └── animations/                 # Reusable Framer Motion transitions (see 1.2)
│   ├── hooks/                          # Shared utilities (useDebounce, useMediaQuery)
│   ├── services/                       # API layer and clients
│   │   └── api/                        # Centralized HTTP request system
│   │       ├── client/                 # Shared Axios client instance
│   │       │   └── axiosClient.js
│   │       ├── interceptors/           # JWT & error handling interceptors
│   │       │   ├── requestInterceptor.js
│   │       │   └── responseInterceptor.js
│   │       ├── middlewares/            # Local storage sync, offline queueing
│   │       └── index.js                # Combined API split barrel
│   ├── utils/                          # Common date, string, currency helpers
│   ├── constants/                      # Magic strings, common regex patterns
│   ├── validators/                     # Common form schema checkers
│   ├── schemas/                        # UI-wide schemas
│   ├── types/                          # Shared JSDoc types
│   └── theme/                          # Design system styling tokens
│
├── features/                           # Domain-specific modules
│   ├── admin/                          # Super Admin portal features
│   │   ├── dashboard/                  # Nested business feature subdirectories
│   │   ├── boutiques/
│   │   ├── owners/
│   │   ├── customers/
│   │   ├── commerce/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── subscriptions/
│   │   ├── reviews/
│   │   ├── analytics/
│   │   ├── fraud/
│   │   ├── notifications/
│   │   ├── payouts/
│   │   ├── tickets/
│   │   └── settings/
│   │       # Inside EACH business feature subdirectory:
│   │       ├── pages/                  # Feature page components
│   │       ├── components/             # Feature-specific subcomponents
│   │       ├── hooks/                  # Feature state/mutation hooks
│   │       ├── services/               # Feature domain API calls
│   │       ├── contexts/               # Feature local state context
│   │       ├── utils/                  # Feature helpers
│   │       ├── constants/              # Feature magic strings
│   │       ├── validators/             # Feature input checkers
│   │       └── types/                  # JSDoc type definitions
│   │
│   ├── owner/                          # Boutique Owner portal features
│   │   ├── dashboard/
│   │   ├── orders/
│   │   ├── products/
│   │   ├── services/
│   │   ├── bookings/
│   │   ├── gallery/
│   │   ├── inventory/
│   │   ├── analytics/
│   │   ├── subscriptions/
│   │   ├── payouts/
│   │   ├── delivery/
│   │   ├── reviews/
│   │   ├── profile/
│   │   └── settings/
│   │       # Inside EACH business feature:
│   │       ├── pages/ | components/ | hooks/ | services/ | contexts/ | utils/ | constants/ | validators/ | types/
│   │
│   ├── customer/                       # Customer storefront portal features
│   │   ├── home/
│   │   ├── shop/
│   │   ├── product/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── wishlist/
│   │   ├── orders/
│   │   ├── returns/
│   │   ├── addresses/
│   │   ├── measurements/
│   │   ├── profile/
│   │   ├── boutiques/
│   │   ├── tailoring/
│   │   └── notifications/
│   │       # Inside EACH business feature:
│   │       ├── pages/ | components/ | hooks/ | services/ | contexts/ | utils/ | constants/ | validators/ | types/
│   │
│   ├── auth/                           # Authentication portals (OTP login, password reset)
│   │   ├── login/
│   │   ├── verify/
│   │   └── password-reset/
│   │       # Inside EACH business feature:
│   │       ├── pages/ | components/ | hooks/ | services/ | contexts/ | utils/ | constants/ | validators/ | types/
│   │
│   └── shared/                         # Shared storefront views (About, contact, support)
│       ├── info/
│       ├── help/
│       └── tickets/
│           # Inside EACH business feature:
│           ├── pages/ | components/ | hooks/ | services/ | contexts/ | utils/ | constants/ | validators/ | types/
│
├── assets/                             # Image assets, SVG paths
├── config/                             # Build configuration variables
└── locales/                            # Internationalization i18n catalogs
```

### 1.2 Reusable Animations Library (`core/components/animations/`)

The animation system consists of Framer Motion and React-native-animated components shared across platforms:
* `Fade` / `Slide` / `Scale` / `Zoom` / `Rotate` - Standard transitions.
* `MotionWrapper` / `RouteTransition` / `PageTransition` - Nav transition frames.
* `RevealOnScroll` - Triggers animations when elements scroll into view.
* `StaggerContainer` - Sequentially animates a group of child elements.
* `AnimatedList` / `AnimatedGrid` - Smooth entry/exit transitions for lists and grids.
* `AnimatedModal` / `AnimatedDrawer` - Elastic opening transitions for popups and panels.
* `AnimatedTabs` / `AnimatedAccordion` - Sliders and collapses for selectors.
* `AnimatedTooltip` / `AnimatedToast` - UI micro-feedback loops.
* `AnimatedProgress` / `AnimatedStepper` / `AnimatedCounter` - Visual progress indicators.
* `FloatingAction` / `Ripple` / `Skeleton` - User-triggered animations.
* `SuccessAnimation` / `ErrorAnimation` / `LoadingAnimation` - Status feedback animations.
* `EmptyStateAnimation` - Clean line drawing transitions.
* `AnimatedTable` - Row-level insertion and search filter animations.
* `AnimatedChart` - Animated lines, bars, and pie slices during load.
* `AnimatedSidebar` - Retracting navigation panel transitions.
* `AnimatedNavbar` - Hides on scroll down, slide-in on scroll up.
* `AnimatedButton` - Click compression and hover scaling effects.
* `AnimatedInput` - Expanding border highlights and floating label animations.
* `AnimatedDropdown` / `AnimatedSelect` - Expanding options panel animation.
* `AnimatedBadge` - Alert counts that expand upon update.
* `AnimatedAvatar` - Hover enlargement and profile outline glows.
* `AnimatedImage` - Smooth fade-in overlay upon download completion.
* `AnimatedGallery` - Image transitions in image carousels.
* `AnimatedTimeline` - Step connectors and indicators that animate on progress updates.
* `AnimatedStatistics` - Counting digit transitions for numeric analytics.

---

## 2. MOBILE ARCHITECTURE (Expo React Native)

### 2.1 Complete Target Folder Tree

Organized by the exact same feature modules and business domains as the Web client.

```
mobile/
├── app/                                # Route screen definitions (Defines navigation structure)
│   ├── (auth)/                         # Auth screen route entries
│   │   ├── _layout.tsx
│   │   └── otp.tsx
│   ├── (customer)/                     # Customer storefront screens
│   │   ├── _layout.tsx
│   │   ├── home.tsx
│   │   ├── shop.tsx
│   │   ├── product.tsx
│   │   ├── cart.tsx
│   │   ├── checkout.tsx
│   │   ├── wishlist.tsx
│   │   ├── orders.tsx
│   │   ├── returns.tsx
│   │   ├── addresses.tsx
│   │   ├── measurements.tsx
│   │   ├── profile.tsx
│   │   ├── boutiques.tsx
│   │   ├── tailoring.tsx
│   │   └── notifications.tsx
│   ├── (shared)/                       # Shared pages
│   │   ├── _layout.tsx
│   │   ├── about.tsx
│   │   ├── contact.tsx
│   │   ├── privacy-policy.tsx
│   │   ├── terms-conditions.tsx
│   │   ├── refund-policy.tsx
│   │   └── shipping-policy.tsx
│   ├── _layout.tsx                     # Main root layout navigator
│   └── index.tsx                       # Default route handler
│
├── src/
│   ├── navigation/                     # Navigation infrastructure
│   │   ├── AuthNavigator.tsx           # Handles login stack transitions
│   │   ├── CustomerNavigator.tsx       # Storefront navigation transitions
│   │   └── SharedNavigator.tsx         # Legal and support transitions
│   │
│   ├── providers/                      # Composition root for mobile contexts
│   │   ├── AuthProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── index.tsx                   # Nested provider composer
│   │
│   ├── core/                           # Shared foundation
│   │   ├── components/                 # UI primitives (Button, Input, Card)
│   │   ├── hooks/                      # Shared device hooks (useKeyboard, useLocation)
│   │   ├── animations/                 # Shared animations (Fade, counter, counter)
│   │   └── utils/                      # Layout scaling, screen sizing constants
│   │
│   ├── features/                       # Self-contained business domains
│   │   ├── auth/                       # Auth business features
│   │   │   ├── login/
│   │   │   └── password-reset/
│   │   │       # Inside EACH business feature:
│   │   │       ├── components/ | hooks/ | services/ | utils/
│   │   │
│   │   ├── customer/                   # Customer business features
│   │   │   ├── home/ | shop/ | product/ | cart/ | checkout/ | wishlist/ | orders/ | returns/ | addresses/ | measurements/ | profile/ | boutiques/ | tailoring/ | notifications/
│   │   │       # Inside EACH business feature:
│   │   │       ├── components/ | hooks/ | services/ | utils/
│   │   │
│   │   └── shared/                     # Support business features
│   │       ├── info/ | help/ | tickets/
│   │           # Inside EACH business feature:
│   │           ├── components/ | hooks/ | services/ | utils/
│   │
│   ├── components/                     # Shared cross-feature UI components
│   ├── animations/                     # Custom mobile-specific transition systems
│   ├── services/                       # API clients consuming shared instance
│   │
│   ├── store/                          # Zustand Stores separated into domain modules
│   │   ├── authStore.ts
│   │   ├── cartStore.ts
│   │   ├── themeStore.ts
│   │   ├── boutiqueStore.ts
│   │   └── index.ts                    # Combined Zustand store barrel
│   │
│   ├── permissions/                    # Mobile device camera/location authorization triggers
│   ├── offline/                        # SQLite caching layers
│   ├── notifications/                  # Push notification listener bindings
│   ├── theme/                          # Sizing guides, color styles
│   └── utils/                          # Shared string formatters
```

---

## 3. BACKEND ARCHITECTURE (Node.js + Express + Prisma)

### 3.1 Complete Target Folder Tree

Every folder listed here will exist after the backend refactor, dividing the code into self-contained domain modules and dedicated infrastructure services.

```
backend/src/
├── app/                                # Server configuration
│   ├── app.js                          # Express setup, middleware registries
│   └── server.js                       # Socket, server listeners startup
│
├── config/                             # App-wide settings
│   ├── env.js                          # Environment validations
│   └── swagger.js                      # API documentation configurations
│
├── core/                               # Framework base classes
│   ├── middlewares/                    # Global security & logging middlewares
│   ├── controllers/                    # Base controller class
│   ├── errors/                         # Custom HTTP exceptions handlers
│   └── permissions/                    # Role-Permission mapping files
│
├── infrastructure/                     # Outbound services (Global implementations)
│   ├── storage/                        # AWS S3 file upload configurations
│   ├── email/                          # Nodemailer transport services
│   ├── payments/                       # Razorpay verification and client bindings
│   ├── cache/                          # Redis or memory caching clients
│   ├── queue/                          # Job scheduling client helpers
│   ├── logger/                         # Winston/Bunyan output logs formats
│   ├── search/                         # Text index queries helper
│   └── uploads/                        # Local file write paths
│
├── modules/                            # Modular domain packages
│   ├── auth/                           # Login, validation, verification
│   ├── users/                          # User accounts, logins
│   ├── customers/                      # Customer profile profiles
│   ├── owners/                         # Boutique owners profiles
│   ├── boutiques/                      # Boutique directory management
│   ├── products/                       # Products catalog
│   ├── categories/                     # Category hierarchy
│   ├── inventory/                      # Stock logs, thresholds
│   ├── orders/                         # Tailoring / Booking orders
│   ├── commerce/                       # Ready-made customer checkout orders
│   ├── checkout/                       # Payments validations
│   ├── payments/                       # Payouts, settlements
│   ├── subscriptions/                  # Owner billing plans
│   ├── coupons/                        # Discounts checks
│   ├── reviews/                        # Product review moderation
│   ├── notifications/                  # In-app alert logs
│   ├── analytics/                      # System metrics
│   ├── reports/                        # Admin statistics summaries
│   ├── tickets/                        # Support tickets
│   ├── delivery/                       # Delivery tracking pipelines
│   ├── returns/                        # Return transactions
│   ├── tailoring/                      # Booking schedules
│   ├── embroidery/                     # Work tracking
│   ├── designs/                        # Custom sketch uploads
│   ├── employees/                      # Staff management
│   ├── measurements/                   # Customer body configurations
│   └── settings/                       # App parameters configs
│
├── shared/                             # Common utils, string parsers
├── database/                           # Schema files, migration setups
│   └── prisma/                         # Prisma Client exports, seed scripts
│
└── tests/                              # Global integration and E2E test suites
```

### 3.2 Internal Domain Module Layout
Each module folder inside `modules/` must follow this structure:
```
modules/<module_name>/
├── controllers/                        # Handles request mappings, sends response
├── services/                           # Validates checks, processes business rules
├── repositories/                       # Focuses purely on Prisma DB operations
├── validators/                         # Body check schemas (Joi/Zod)
├── routes/                             # Endpoints mapping
├── dto/                                # Response serializers
├── entities/                           # Domain objects mappings
├── mappers/                            # Maps database objects to domain entities
├── interfaces/                         # Method definitions / type contracts
├── events/                             # Event triggers and listeners
├── jobs/                               # Scheduled/async task runners
├── permissions/                        # Module route permission definitions
├── constants/                          # Feature strings
├── exceptions/                         # Module custom error objects
└── tests/                              # Unit tests
```

---

## 4. SHARED STANDARDS

All Web, Mobile, and Backend modules must adhere to the following standards:

1. **Path Aliases:**
   - Web & Mobile: `@app/*`, `@core/*`, `@features/*`, `@providers/*`
   - Backend: `@core/*`, `@modules/*`, `@infra/*`, `@shared/*`
2. **Barrel Exports:** Every subdirectory (e.g. `core/components/ui/`, `features/admin/dashboard/pages/`) must expose an `index.js` or `index.ts` file containing clean exports. Avoid direct deep path imports.
3. **Module Boundaries:** Feature modules must not import internals from other feature modules directly. Shared dependencies must go through `@core/` or `features/shared/` interfaces.
4. **File Sizing Limits:**
   - Component files: Max **250 lines**.
   - Helper/Service files: Max **350 lines**.
   - Redundant or oversized code must be refactored into hooks or utilities.
5. **Route Cleanliness:** Express routes must only register endpoints and mount middleware. Under no circumstances should sql/prisma calls or business validations be inline in route files.
