# Phase 11 — Enterprise Template Library: Completion Audit

## Architecture

Template Library is a **separate bounded context** from Prompt Library. Templates are certified website artifacts produced by the CMS pipeline, not prompts. No `businessId` on templates — they remain reusable across businesses.

### Template Lifecycle
```
DRAFT → VERIFYING → CERTIFYING → FIXING → CERTIFIED → PUBLISHED → ARCHIVED
```

### Antaire Workflow (Pipeline Stages)
```
Prompt Library
→ Website Generation
→ Upload
→ Verification
→ Certification
→ AI Fix
→ Enterprise Template Library
→ Business Assignment (via BusinessTemplateAssignment)
→ Subscription Assignment
→ Domain Assignment
→ Deployment
→ Live Website
```

## Schema Changes

### 12 New Models (3205 → 3501 lines in schema.prisma)

| Model | Purpose | Key Fields |
|---|---|---|
| `CmsTemplate` | Core template entity | name, industry, status (lifecycle), tier, version, manifest (Json), promptId, blueprintId, certificationId, thumbnail, previewImage, previewVideo, liveDemoUrl, zipArtifact, manifestUrl, isFeatured, isActive |
| `CmsTemplateCategory` | Industry categories | key, name, displayOrder |
| `CmsTemplateTag` | Feature tags | key, name |
| `CmsTemplateTagTemplate` | M:N join | templateId, tagId |
| `CmsTemplateVersion` | Immutable snapshots | version, name, manifest, all preview assets, changeNotes |
| `CmsTemplateFavorite` | User favorites | templateId+userId unique |
| `CmsTemplateRating` | User ratings | templateId+userId unique, rating, comment |
| `CmsTemplateAnalytics` | Usage tracking | action, userId, metadata |
| `CmsTemplatePipelineStage` | Pipeline stage tracking | stage, startedAt, finishedAt, duration, status, inputArtifact, outputArtifact, retryCount, agent, error |
| `CmsTemplateBuilderCompatibility` | AI builder compat | builderKey (e.g. claude-code, opencode) |
| `BusinessTemplateAssignment` | Business ↔ Template link | businessId, templateId, subscriptionId, deploymentId, environmentId, assignedBy, status |

### Design Decisions
- **No `businessId` on CmsTemplate** — templates are reusable across businesses
- **Deployment history excluded** — handled by the deployment module (per requirement)
- **Template Manifest stored as Json** — contains pages, components, APIs, database models, env vars, SEO rules, security rules, dependencies, SDK version, generated artifacts
- **AI Builder compatibility** as a separate join table (CmsTemplateBuilderCompatibility)

## Backend

### Service Layer (`templates.service.js`) — ~640 lines
- 30+ methods: CRUD, lifecycle (publish/archive/deprecate), versioning (create/get/rollback), favorites, ratings, analytics, featured/latest/popular/tier, pipeline stages, business assignments, export/import, stats
- Event bus integration (`eventBus.emit`) for lifecycle events
- Tier access helper (`checkTierAccess`) with hierarchy: FREE(0) < STARTER(1) < PROFESSIONAL(2) < ENTERPRISE(3)

### Routes (`templates.routes.js`) — ~400 lines
- 30 endpoints under `/api/v1/cms/templates`
- All protected by `protect` (JWT) middleware
- Write operations require `superAdminOnly`
- Categories, Tags, Favorites, Analytics, Stats, Pipeline, Versions, Assignments, Export/Import, Publish/Archive/Deprecate

### Seed Data (`seed-cms-templates.js`)
- 8 categories (ecommerce, salon, restaurant, hotel, pharmacy, education, real-estate, portfolio)
- 10 tags (responsive-design, seo-optimized, multi-language, dark-mode, analytics-ready, payment-integrated, booking-system, blog-enabled, social-integration, pwa-ready)
- 3 certified templates: Modern E-Commerce Store (PROFESSIONAL), Salon & Beauty Booking (STARTER), Restaurant & Cafe Menu (FREE)

### Frontend (`web/src/features/admin/cms/templates/`)

| Page | File | Description |
|---|---|---|
| TemplateLibrary | `pages/TemplateLibrary.jsx` | Browse, search, tabs (All/Featured/Latest/Popular), tier filters, category filter, featured carousel, template cards |
| TemplateDetail | `pages/TemplateDetail.jsx` | Full detail view, image gallery, tags, builder badges, pipeline status visualization, version history, favorites, ratings, export, admin actions, business assignment |
| TemplatePublish | `pages/TemplatePublish.jsx` | Create/edit form, manifest editor, builder compatibility checkboxes, tier/category selects |
| TemplateVersions | `pages/TemplateVersions.jsx` | Version table, rollback with confirmation |
| TemplateDeployments | `pages/TemplateDeployments.jsx` | Business assignments table, status filter, unassign action |
| TemplateAnalytics | `pages/TemplateAnalytics.jsx` | Usage breakdown, deployment count, date filter, popular sidebar |
| API Client | `services/templates.api.js` | 23 API methods |

### App.jsx Updates
- Lazy imports for all 6 page components
- Routes: `/admin/cms/templates`, `/admin/cms/templates/new`, `/admin/cms/templates/analytics`, `/admin/cms/templates/:id`, `/admin/cms/templates/:id/versions`, `/admin/cms/templates/:id/deployments`

## Verification Results

| Check | Result |
|---|---|
| Prisma validate | 0 errors |
| Prisma generate | Client generated |
| Prisma db push | Database in sync |
| Seed data | 3 templates created |
| CMS templates tests | **33/33 PASS** |
| Full backend test suite | **All 9 suites PASS** (2+50+33+10+32+21+42+7+24) |
| Frontend build | **Build succeeded** (1.73s) |
| Route registration | All template endpoints visible |
| Auth middleware | Working (401 without token) |

### Test Coverage (33 tests, 11 groups)
- CRUD (5): create, list, get, update, delete
- Lifecycle (3): publish, archive, deprecate
- Versions (3): create version, get versions, rollback
- Favorites (2): toggle, list
- Ratings (1): rate template
- Tags & Categories (4): list tags, create tag, list categories, create category
- Pipeline (2): advance stage, get status
- Featured/Latest/Popular/Tier (4): all list methods
- Business Assignments (3): assign, unassign, list
- Export (1): json format
- Error Cases (5): get/update/delete/publish/archive nonexistent

## Files Created/Modified

### Create (18 files)
- `backend/prisma/schema.prisma` — 12 new models (lines 3207-3570)
- `backend/src/modules/cms-templates/services/templates.service.js` — 640 lines
- `backend/src/modules/cms-templates/routes/templates.routes.js` — 400 lines
- `backend/prisma/seed-cms-templates.js` — 185 lines
- `backend/tests/cms-templates.test.js` — ~600 lines
- `web/src/features/admin/cms/templates/services/templates.api.js` — 150 lines
- `web/src/features/admin/cms/templates/pages/TemplateLibrary.jsx` — 14.6KB
- `web/src/features/admin/cms/templates/pages/TemplateDetail.jsx` — 24KB
- `web/src/features/admin/cms/templates/pages/TemplatePublish.jsx` — 11KB
- `web/src/features/admin/cms/templates/pages/TemplateVersions.jsx` — 7.8KB
- `web/src/features/admin/cms/templates/pages/TemplateDeployments.jsx` — 7.7KB
- `web/src/features/admin/cms/templates/pages/TemplateAnalytics.jsx` — 7.6KB
- `phase-11-completion-audit.md` — this report

### Modify (3 files)
- `backend/src/server.js` — added route registration (line 190)
- `web/src/App.jsx` — updated lazy import path + 5 new lazy imports + 5 new routes
- `backend/src/modules/cms-templates/services/templates.service.js` — fixed `changeNotes` extraction and `createVersion` return value

## Remaining Technical Debt

1. **Prisma migration drift**: Base migration `20260630000000_add_requirements_and_blueprints` has pre-existing drift. Phase 11 schema was applied via `prisma db push` rather than a formal migration. Needs resolution in a dedicated schema remediation phase.

2. **Template manifest schema validation**: The manifest is stored as unstructured JSON. For production, consider a JSON Schema validator or type-safe manifest parser.

3. **Pipeline automation**: Pipeline stages are currently manual (API-driven). Future phases should automate stage transitions (e.g., verification webhook → auto-advance to certification).

4. **Template certification integration**: `certificationId` field exists but is not yet linked to the certification module's workflow. Needs integration with `CmsCertificationProfile` / `BoutiqueCertification` for end-to-end pipeline.

5. **Deployment integration**: `BusinessTemplateAssignment.deploymentId` is stored but the forward-linking to the deployment module is not wired. The deployment module needs to be updated to accept template references.

6. **Subscription gating middleware**: `checkTierAccess` helper exists in the service but is not yet wired into the route layer as Express middleware. Routes currently use `protect` + `superAdminOnly`. Tier gating middleware needs to be added for business-level access.

7. **Caching**: Template listings (featured, latest, popular) are uncached. Consider Redis caching for high-traffic endpoints.

8. **Frontend image assets**: Thumbnails and preview images reference placeholder URLs (`/assets/templates/...`). Need actual asset hosting or upload flow.
