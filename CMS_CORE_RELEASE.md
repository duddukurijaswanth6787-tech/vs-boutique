# CMS Core — Release v1.0.0

> **Status**: FROZEN — No new CMS modules shall be introduced unless they are bug fixes or production improvements.
> **Date**: 2026-06-30
> **Version**: 1.0.0

---

## Final Architecture Overview

The Antaire CMS Core is a modular, full-stack CMS platform built on **Node.js/Express** (backend) and **React/Vite** (frontend) with **PostgreSQL/Prisma** as the data layer. It supports multi-tenant website generation, deployment, certification, marketplace extensions, and e-commerce operations.

### System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Vite)                     │
│  Admin Panel │ Owner Portal │ Customer Portal │ Studio App  │
├─────────────────────────────────────────────────────────────┤
│              API Gateway (Express.js, 250+ routes)           │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│  Auth &  │ Commerce │   CMS    │   AI     │   Platform      │
│  Users   │ Orders   │ Platform │ Core     │   Services      │
│  Owners  │ Products │ Websites │ Gen/Cert │   Subs/Pay      │
│          │ Cart     │ Deploy   │ Marketplace│  Notifications │
├──────────┴──────────┴──────────┴──────────┴─────────────────┤
│             Database (PostgreSQL via Prisma ORM)             │
│                   131 models, 9 migrations                   │
├─────────────────────────────────────────────────────────────┤
│         External Services (S3/R2/MinIO, Redis, ClamAV)       │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

- **Multi-tenant** via `Business`/`Tenant` model separation
- **Modular by domain** — 27 backend modules, each with routes + services
- **AI-powered** — Website generation, certification, requirements, and standards via pluggable provider adapters
- **Deployment pipeline** — Environments, rollbacks, domains, SSL (ACME), antivirus, metrics (Prometheus)

---

## Module Dependency Graph

```
auth ──────► users ───► customers
              │
boutiques ◄──┤
  │           │
  ├──► orders ◄──► payments
  │      │           │
  │      ├──► delivery──► notifications.service (shared)
  │      └──► bookings (tailoring)
  │
designs ───┤
reviews ───┤
owners ────┤
tickets ───┤
settings ──┤

commerce ──► cart ──► checkout ──► coupons
  │                        │
  └──► products ──────────┤
       │                   │
       └──► categories     └──► payments.service (shared)

subscriptions ───► payments.service (shared)

cms-uploads ───► cms-verification ───► cms-blueprints
                                        │
cms-standards ──────────────────────────┤
                                        │
cms-requirements ───────────────────────┤
                                        │
                          cms-deployment (environments, domains,
                            rollback, SSL, antivirus, audit,
                            metrics, queue)

ai-core ───► provider.service
  │            │
  ├──► openai.adapter
  ├──► gemini.adapter
  ├──► claude.adapter
  └──► ollama.adapter

website-generator ───► provider.service
website-certification ───► eventBus
marketplace ───► eventBus

analytics
notifications.service (shared utility, imported by 8 modules)
auditService (shared utility, imported by 11 modules)
subscriptionService (shared utility, imported by 7 modules)
```

### Dependency Summary

| Metric | Count |
|--------|-------|
| Total backend modules | 27 |
| Total service files | 44 |
| Cross-module service imports | 31 |
| Shared utility services | 3 (audit, notifications, subscriptions) |
| Circular dependencies | **0** (verified) |

---

## Database Summary

### Models: 131 total across 10 domains

| Domain | Models | Key Tables |
|--------|--------|------------|
| Core/Tailoring | 19 | users, boutiques, orders, designs, payments, bookings, reviews |
| Commerce | 23 | products, carts, commerce_orders, coupons, delivery_tracking |
| Returns/Exchanges | 3 | return_requests, exchange_requests, order_sequences |
| Notifications | 7 | notifications, templates, campaigns |
| Subscriptions | 5 | subscription_plans, boutique_subscriptions |
| Categories | 3 | categories, sub_categories, platform_settings |
| AI Orchestrator | 14 | aiagent, prompttemplate, aiexecution, aiconversation |
| Tenant/Business | 19 | businesses, websites, workflows, immutable_releases |
| Certification | 8 | certification_workflows, qa_agent_registries |
| Marketplace | 8 | marketplace_packages, installations, licenses |
| CMS Standards/Req | 16 | cms_standards, cms_requirements, cms_blueprint_templates |
| Deployment | 7 | deployments, deployment_environments, domains, artifacts |
| Legacy | 1 | marketplace_installs (superseded) |

### Schema Health

| Check | Result |
|-------|--------|
| Pending migrations | **None** — database up to date |
| Schema/db sync | **In sync** — `prisma db push` confirms alignment |
| Migration history | **Healthy** — 9 migrations, clean linear progression |
| Invalid FK references | **0** — all `@relation` targets valid |
| Duplicate models | **1** — `MarketplaceInstall` superseded by `MarketplaceInstallation` |
| Potentially dead models | **~24** (defined but never directly queried — see Technical Debt) |

---

## API Summary

### Total Backend Routes: 250+ endpoints across 51 route groups

| Module | Prefix | Routes | Has Frontend API Client |
|--------|--------|--------|------------------------|
| Auth | /auth | 6 | Partial (legacy files) |
| Boutiques | /boutiques | 9 | Yes |
| Dashboard | /dashboard | 2 | Partial |
| Owners | /owners | 12 | Yes |
| Owner Portal | /owner | 9 | Yes |
| Products | /products, /owner/products | 34 | Yes |
| Designs | /designs | 4 | Yes |
| Orders | /orders, /owner/orders | 12 | Partial |
| Notifications | /notifications, /admin, /customer | 13 | Yes |
| Measurements | /measurements | 5 | Partial |
| Payments | /payments, /payouts | 14 | Partial |
| Customers | /admin/customers | 8 | Yes |
| Bookings | /bookings | 10 | Yes |
| Reviews | /reviews, /products/:id/reviews | 12 | Yes |
| Subscriptions | /subscriptions | 15 | Yes |
| Tickets | /tickets | 12 | Yes |
| Categories | /categories, /subcategories | 14 | Yes |
| Cart | /cart | 5 | Yes |
| Checkout | /checkout | 5 | Yes |
| Coupons | /coupons, /admin, /owner | 11 | Yes |
| Delivery | /tracking, /returns, /exchanges | 10 | Partial |
| CMS Deployment | /api/v1/cms/deployment | 40 | Yes (32/40) |
| CMS AI Orchestrator | /api/v1/cms/orchestrator | 7 | No |
| CMS Generator | /api/v1/cms/generator | 6 | No |
| CMS Certification | /api/v1/cms/certification | 9 | No |
| CMS Marketplace | /api/v1/marketplace | 7 | No |
| CMS Standards | /api/v1/cms/standards | 16 | No |
| CMS Requirements | /api/v1/cms/requirements | 8 | No |
| CMS Blueprints | /api/v1/cms/blueprints | 5 | No |
| CMS Uploads | /api/v1/cms/projects | 3 | No |
| CMS Verification | /api/v1/cms/projects | 1 | No |

### Route Health

| Check | Result |
|-------|--------|
| Duplicate route definitions | **3 found** — `/orders/my`, `/orders/my/:id`, `/orders/:id/cancel` defined twice (orders.routes.js + commerce.routes.js) |
| Same base path conflict | **1 found** — `/api/v1/cms/projects` mounted by both uploads.routes.js and verification.routes.js (low risk, distinct sub-paths) |
| Frontend API calls w/o backend route | **16 found** — mostly legacy `services/api.ts` paths (`/api/auth/login`, `/api/measurements`, `/api/site-settings`, etc.) |
| Backend routes w/o frontend client | **~100** — mostly CMS module APIs (orchestrator, generator, certification, marketplace, standards, requirements) and infrastructure endpoints (webhooks, audit logs, metrics) |

---

## Folder Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # 131 models
│   └── migrations/            # 9 migrations
├── src/
│   ├── server.js              # Express app + all route mounts
│   ├── services/              # Shared utilities (auditService, subscriptionService)
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── owners/
│   │   ├── boutiques/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── designs/
│   │   ├── payments/
│   │   ├── checkout/
│   │   ├── commerce/          # cart, commerce
│   │   ├── coupons/
│   │   ├── categories/
│   │   ├── delivery/
│   │   ├── reviews/
│   │   ├── bookings/          # (tailoring module)
│   │   ├── tickets/
│   │   ├── measurements/
│   │   ├── customers/
│   │   ├── notifications/
│   │   ├── settings/
│   │   ├── analytics/
│   │   ├── subscriptions/
│   │   ├── marketplace/
│   │   ├── ai-core/           # adapters/ (openai, gemini, claude, ollama)
│   │   ├── website-generator/
│   │   ├── website-certification/
│   │   ├── cms-uploads/
│   │   ├── cms-blueprints/
│   │   ├── cms-standards/
│   │   ├── cms-requirements/
│   │   ├── cms-verification/
│   │   └── cms-deployment/    # services, adapters, routes
│   └── scripts/               # Test/seed scripts (non-production)
├── tests/
│   └── deployment.test.js     # 42 tests (encryption, storage, antivirus, metrics, logic)
└── package.json

web/
├── src/
│   ├── App.jsx                # Router with all page imports
│   ├── core/services/api/     # Modular API client files (22 files)
│   ├── services/api.js        # Legacy API client (duplicate)
│   ├── services/api.ts        # Legacy API client (non-functional paths)
│   ├── studio/services/api.ts # Legacy Studio API client (non-functional paths)
│   ├── features/
│   │   ├── admin/
│   │   │   ├── cms/
│   │   │   │   └── platform/pages/
│   │   │   │       ├── DeploymentCenter.jsx
│   │   │   │       ├── DomainsManager.jsx
│   │   │   │       └── WebsiteHealth.jsx
│   │   │   ├── pages/         # Admin commerce pages
│   │   │   └── .../
│   │   ├── customer/          # Customer portal pages
│   │   ├── owner/             # Owner portal pages
│   │   └── boutique/          # Public boutique pages
│   └── studio/                # StudioApp
├── dist/                      # Production build output
└── package.json
```

---

## Production Deployment Checklist

### Prerequisites

- [ ] **Node.js** >= 18.x
- [ ] **PostgreSQL** >= 14.x
- [ ] **Redis** (optional — deployment queue falls back to in-memory)
- [ ] **ClamAV daemon** (optional — antivirus falls back gracefully)
- [ ] **S3-compatible storage** (AWS S3, Cloudflare R2, or MinIO)
- [ ] **SMTP server** for email notifications
- [ ] **Razorpay account** for payment processing
- [ ] **Let's Encrypt** (ACME) for automated SSL (requires port 80 reachability)

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/antaire

# Auth (example — adjust for your auth provider)
JWT_SECRET=<random-64-char>
OTP_EXPIRY_MINUTES=5

# Storage (choose one provider)
DEPLOYMENT_STORAGE_PROVIDER=s3|r2|minio
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET_NAME=
# For R2/MinIO, also set:
S3_ENDPOINT=
S3_FORCE_PATH_STYLE=true

# AI Providers (at least one)
OPENAI_API_KEY=
# or
ANTHROPIC_API_KEY=
# or
GOOGLE_API_KEY=
# or
OLLAMA_BASE_URL=http://localhost:11434

# Payment
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Deployment Queue
REDIS_URL=redis://localhost:6379

# Antivirus
CLAMAV_HOST=localhost
CLAMAV_PORT=3310

# ACME SSL
ACME_EMAIL=admin@example.com
ACME_DIRECTORY_URL=https://acme-v02.api.letsencrypt.org/directory

# Notifications
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

### Deployment Steps

1. **Database**: Run `npx prisma migrate deploy` (or `npx prisma db push`)
2. **Backend**: `cd backend && npm install --production && node src/server.js`
3. **Frontend**: `cd web && npm install && npx vite build` → serve `dist/` via Nginx/CDN
4. **Reverse Proxy**: Configure Nginx to proxy `/api` to backend, serve static files from `dist/`
5. **SSL**: Set up Let's Encrypt or ACME for the management domain
6. **Workers**: For production, run the deployment queue worker as a separate process
7. **Monitoring**: Expose Prometheus metrics at `GET /api/v1/cms/deployment/metrics`

### Health Checks

- `GET /health` — basic server health
- `GET /api/v1/cms/deployment/health/status` — deployment system health
- `GET /api/v1/cms/deployment/metrics` — Prometheus metrics endpoint

---

## Audit Results

| Check | Result | Details |
|-------|--------|---------|
| No duplicate services | ✅ PASS | No exact copies; 8 functional overlaps identified (payment processing, audit logging, decimal parsing) |
| No dead code | ⚠️ PARTIAL | ~24 dead Prisma models, 20 unused React page imports, 3 legacy API files, 1 phantom page (WebsiteStandards.jsx), 3 duplicate routes |
| No duplicate database models | ⚠️ 1 FOUND | `MarketplaceInstall` superseded by `MarketplaceInstallation` |
| No duplicate routes | ⚠️ 3 FOUND | `/orders/my`, `/orders/my/:id`, `/orders/:id/cancel` |
| No unused React pages | ⚠️ 20 FOUND | 16 customer pages imported but routes render StudioApp; 4 pages imported but never rendered |
| No unused APIs | ⚠️ 16 FOUND | Legacy `services/api.ts` paths with no backend match; ~100 backend routes without frontend clients |
| No circular dependencies | ✅ PASS | 0 cycles detected across 44 service files |
| No mock implementations | ❌ FAIL | **6 modules** with mock/placeholder code in production paths |
| All Prisma models synchronized | ✅ PASS | Schema in sync with database |
| All migrations valid | ✅ PASS | 9/9 applied, clean linear history |
| All tests passing | ✅ PASS | 42/42 deployment module tests pass |
| Production build passing | ✅ PASS | Vite build completes successfully |

### Mock Implementations Requiring Production Hardening

| Module | Issue | Priority |
|--------|-------|----------|
| AI adapters (4 files) | Silent mock fallback when API keys missing or API fails | **Critical** |
| Subscriptions | Mock payment flow (`MOCK_PAYMENT` method, mock order IDs) | **High** |
| CMS Uploads | JSON file database instead of Prisma; fake virus scan (setTimeout + filename check) | **High** |
| Payments/Checkout | Placeholder Razorpay credentials (`rzp_test_placeholder`, `secret_placeholder`) | **High** |
| Marketplace | Mock cryptographic signature verification | **Medium** |
| Measurements | Dummy user creation for certain input patterns | **Low** |

---

## Known Technical Debt

### Critical

1. **AI Provider Mock Fallbacks** — All 4 AI adapters silently return hardcoded mock responses when API keys are missing or API calls fail. Users receive fabricated results instead of errors. **Fix**: Remove mock responses, throw explicit errors.

2. **CMS Uploads JSON Database** — `upload.service.js` uses `node_modules/.metadata-uploads/uploads-db.json` for persistence instead of Prisma/PostgreSQL. Data lost on `node_modules` reinstall. **Fix**: Migrate to Prisma `AssetLibrary` or dedicated upload table.

3. **Subscriptions Mock Payment Path** — `upgradeSubscription()` can create subscriptions with `MOCK_PAYMENT` method, bypassing real payment processing. **Fix**: Remove mock path or gate behind explicit `NODE_ENV=development`.

### High

4. **Razorpay Credentials Hardcoded Fallback** — Both `payments.service.js` and `checkout.service.js` use `'rzp_test_placeholder'` / `'secret_placeholder'` as fallback credentials. **Fix**: Fail hard when env vars are missing.

5. **Legacy Frontend API Files** — `web/src/services/api.ts` and `web/src/studio/services/api.ts` contain 16+ API call paths (`/api/auth/login`, `/api/measurements`, etc.) that do not match any backend route. These will fail silently 404 in production. **Fix**: Remove or migrate to the modular API client system.

6. **Dead Prisma Models (~24)** — Models like `AIContext`, `AITool`, `AICacheRecord`, `ApprovalHistory`, `MobileApp`, `WorkflowDefinition/Stage/Task/Execution`, `BoutiquePlugin`, `UserRoleMapping`, `MarketplaceInstall`, `MarketplaceReview`, `DeliveryTrackingHistory`, `CommerceOrderItem`, `OrderHistory`, `PlatformSetting`, `OrderSequence`, `CustomerNotification`, `AdminNotification`, `ProductAnalytics`, `ContentTranslation`, `ProductToProductTag` are defined but never directly queried. **Fix**: Audit each; remove unused models, add queries for needed ones.

7. **Duplicate Routes in `/orders`** — Three routes are defined twice, with the commerce.routes.js implementations unreachable. **Fix**: Remove duplicates, keeping the implementations that actually work.

### Medium

8. **Unused React Pages (20)** — 16 customer pages imported but rendered as StudioApp; 4 pages (CustomerHome, CustomerBoutiqueDetails, ProductCatalog, WishlistPage) imported but never rendered anywhere. **Fix**: Remove imports or implement proper routing.

9. **Duplicate Decimal Parsing (8 services)** — Identical `parseDecimalVal` / `parseDecimal` helpers defined inline in products, orders, payments, checkout, commerce, boutiques, designs, measurements. **Fix**: Extract to shared `backend/src/utils/decimal.js`.

10. **Cross-Module Notification Coupling** — 8 services directly import `notificationsService` instead of routing through an event bus or pub/sub system. **Fix**: Introduce an event emitter pattern.

11. **Two Audit Logging Systems** — Shared `backend/src/services/auditService.js` (used by 11 modules) and `cms-deployment/services/audit.service.js` (deployment-specific). **Fix**: Consolidate into one.

12. **CustomerAddress / ShippingAddress Overlap** — Both models cover address storage with minor field differences. **Fix**: Consolidate into a single `UserAddress` model.

### Low

13. **Phantom Page** — `web/src/features/admin/cms/website-platform/pages/WebsiteStandards.jsx` (617 lines) exists on disk but is never imported. The actual standards page is `StandardsDashboard.jsx`.

14. **`Notification.campaignId` lacks `onDelete: Cascade`** — If a NotificationCampaign is deleted, its notifications will have orphaned FK references.

15. **Scripts Importing Services Directly** — Test scripts circumvent the route/controller layer by importing services directly. Low risk for test scripts but can mask production issues.

---

## Audit Methodology

All checks were performed on 2026-06-30 by:

1. **Glob scanning** — All service files, route files, API client files, page components, and migration files enumerated
2. **Content analysis** — Each file read and cross-referenced against imports, route definitions, and frontend API calls
3. **Prisma validation** — `prisma migrate status`, `prisma db push --dry-run`, and manual relation graph analysis
4. **Build verification** — `npx vite build` for frontend, `node tests/deployment.test.js` for backend
5. **Dependency analysis** — Cross-module `require()` graph traced for circular paths
6. **Mock detection** — Grep for "mock", "placeholder", "simulat", "TODO", "FIXME" in all production source files
