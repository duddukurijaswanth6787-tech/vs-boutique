# Phase 11 — Enterprise Template Library: Implementation Plan

## Goal
Build a full-featured **Enterprise Template Library** that reuses and extends the Phase 10 Prompt Library foundation. Enterprise templates are certified, production-ready prompt templates gated by subscription tier with approval workflows, publishing pipeline, and cross-module integration.

## Architecture Decision

**Extend, don't duplicate.** Use `CmsPrompt` as the base entity with a new `templateTier` field and `CmsEnterpriseTemplate` metadata model rather than creating a parallel entity. This avoids schema bloat and lets Enterprise Templates leverage all existing Phase 10 features (versioning, favorites, collections, ratings, analytics, audit).

## Implementation Steps

### Step 1: Schema Extension
- Add `templateTier` field to `CmsPrompt` (enum: FREE, STARTER, PROFESSIONAL, ENTERPRISE, default FREE)
- Add `templateStatus` field (DRAFT, PENDING_REVIEW, APPROVED, REJECTED, PUBLISHED, ARCHIVED)
- Add `isCertified` boolean, `certifiedAt` datetime
- Add `CmsEnterpriseTemplate` metadata model: `promptId`, `industry`, `useCase`, `estimatedEffort`, `prerequisites`, `dependencies`, `compatibleBuilders[]`, `screenshots[]`, `demoUrl`, `changelog`
- Add `CmsTemplateApproval` model: `templateId`, `reviewedBy`, `status`, `comments`, `version`

### Step 2: Service Layer — enterprise.service.js
Reuse `promptsService` for base CRUD. Add:
- `listEnterpriseTemplates(filters)` — filter by tier, status, industry, certified
- `submitForReview(id, notes)` — change status to PENDING_REVIEW
- `approveTemplate(id, reviewerId, comments)` — approve + set certified
- `rejectTemplate(id, reviewerId, comments)` — reject
- `publishTemplate(id)` — publish
- `archiveTemplate(id)` — archive
- `getTemplatesByTier(tier)` — for subscription gating
- `getCompatibleTemplates(builderKey)` — filter by compatible builders
- `checkTierAccess(userId, templateId)` — subscription gating
- `compileTemplateBundle(templateIds)` — batch compile for multi-prompt workflows

### Step 3: Routes — enterprise.routes.js
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/cms/enterprise/templates` | protect | List templates (with tier/status filtering) |
| GET | `/api/v1/cms/enterprise/templates/:id` | protect | Get template details |
| POST | `/api/v1/cms/enterprise/templates` | super-admin | Create enterprise template |
| PUT | `/api/v1/cms/enterprise/templates/:id` | super-admin | Update template |
| DELETE | `/api/v1/cms/enterprise/templates/:id` | super-admin | Soft delete |
| POST | `/api/v1/cms/enterprise/templates/:id/submit` | protect | Submit for review |
| POST | `/api/v1/cms/enterprise/templates/:id/approve` | super-admin | Approve |
| POST | `/api/v1/cms/enterprise/templates/:id/reject` | super-admin | Reject |
| POST | `/api/v1/cms/enterprise/templates/:id/publish` | super-admin | Publish |
| POST | `/api/v1/cms/enterprise/templates/:id/archive` | super-admin | Archive |
| GET | `/api/v1/cms/enterprise/templates/compatible/:builder` | protect | By builder compatibility |
| GET | `/api/v1/cms/enterprise/templates/tier/:tier` | protect | By subscription tier |
| GET | `/api/v1/cms/enterprise/approvals` | super-admin | Pending approvals queue |

### Step 4: Frontend — TemplateLibrary.jsx (full replacement)
Replace the placeholder with:
- Template browser with tier/status/industry filters
- Template detail view with metadata, screenshots, changelog
- Approval workflow UI (submit, approve, reject with comments)
- Tier gating: lock icon + upgrade prompt for inaccessible tiers
- Compatible builder badges
- "Use Template" button → clones into user's Prompt Library
- Integration with existing PromptEditor for further customization

### Step 5: Subscription Gating
- Add `checkTierAccess` middleware using existing `checkPlanFeature` pattern
- Map subscription plans to template tiers:
  - Free plan → FREE templates
  - Starter plan → FREE + STARTER
  - Professional plan → FREE + STARTER + PROFESSIONAL
  - Enterprise plan → all tiers
- Show upgrade prompts for tier-locked templates

### Step 6: Seed Data
- Create `seed-enterprise-templates.js`
- Seed 5-10 certified enterprise templates across industries (ecommerce, salon, restaurant, etc.)
- Map each to appropriate tier and builder

## Files to Create/Modify

### Create
- `backend/prisma/migrations/..._add_enterprise_template_fields`
- `backend/src/modules/cms-enterprise/services/enterprise.service.js`
- `backend/src/modules/cms-enterprise/routes/enterprise.routes.js`
- `backend/src/modules/cms-enterprise/index.js` (route registration)
- `backend/prisma/seed-enterprise-templates.js`
- `backend/tests/cms-enterprise.test.js`
- `web/src/features/admin/cms/enterprise/services/enterprise.api.js`
- `web/src/features/admin/cms/enterprise/pages/TemplateLibrary.jsx` (replace placeholder)
- `web/src/features/admin/cms/enterprise/pages/TemplateDetail.jsx`
- `web/src/features/admin/cms/enterprise/pages/ApprovalQueue.jsx`

### Modify
- `backend/prisma/schema.prisma` — add fields to CmsPrompt + new models
- `backend/src/middleware/subscriptionMiddleware.js` — add `checkTierAccess`
- `web/src/App.jsx` — update TemplateLibrary lazy import path
- `web/src/router.jsx` or App.jsx routes — update template route

## Verification Plan
1. Prisma validate (0 errors)
2. Prisma generate + migrate
3. Run `node tests/cms-enterprise.test.js` (target: 30+ tests)
4. Run full backend test suite (no regressions)
5. Frontend build (`npm run build`)
6. API endpoint verification
7. Integration: create template → submit → approve → publish → verify tier gating

## Estimated Scope
- Schema: 2 new models, 4 new fields on CmsPrompt
- Backend service: ~400 lines
- Backend routes: ~250 lines
- Frontend pages: ~800 lines total
- Tests: ~600 lines
- Seed data: ~150 lines
