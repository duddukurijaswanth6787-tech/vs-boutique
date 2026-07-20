# Over-Engineering Audit — Ranked Findings

> Format: `<tag> <what to cut>. <replacement>. [path]`
> Tags: delete (dead/speculative), stdlib (reinvented), native (platform does it), yagni (single-use abstraction), shrink (same logic, fewer lines)

---

## Top 30 Findings (biggest cuts first)

1. `delete` Entire commented-out modules (AiChat, AiRecommendation, AiAnalytics, AiAdmin, AiSearch, RagAgent, RagKnowledge, Prescription, DrugInteraction, Social). Remove the 9 excluded dirs from tsconfig, delete 15+ import lines in app.module, and delete the 10 full domain trees. Net: ~2,400 LOC. [backend/src/core/app.module.ts:65-75, backend/src/domains/ai-*/ rag-*/ prescription/ drug-interaction/ social/]

2. `delete` Committed build artifacts: `backend/dist/` (~15,000 LOC generated JS/maps/d.ts), `backend/coverage/` (~2,000 LOC HTML/JSON), `frontend/coverage/` (~2,000 LOC), `frontend/.next/` (~500 LOC). Add to .gitignore. Net: ~19,500 LOC. [backend/dist/, backend/coverage/, frontend/coverage/, frontend/.next/]

3. `delete` Duplicate Prisma schema at `database/schema/schema.prisma` (1,867 lines) and seed at `database/prisma/seed.ts`. Use canonical at `backend/prisma/`. Net: ~2,000 LOC. [database/]

4. `stdlib` `backend/src/common/validation/decorators.validation.ts` — 664 lines reimplementing class-validator decorators. Use `@IsEmail()` from class-validator (already a dependency). Net: ~650 LOC. [backend/src/common/validation/decorators.validation.ts]

5. `delete` 7 AI/ML commented-out config blocks in `backend/src/config/app.config.ts` (~50 LOC) and `env.validation.ts` (~65 LOC of RAG/OpenAI/Gemini validators). Remove dead config. Net: ~115 LOC. [backend/src/config/app.config.ts, env.validation.ts]

6. `shrink` `backend/src/common/logger/logger.service.ts` — 411 lines with duplicated pattern per log level (info/error/warn/debug/verbose/fatal) + HTTP request/response/error/slow-request logging. Collapse to single log method with level param. Net: ~300 LOC saved. [backend/src/common/logger/logger.service.ts]

7. `yagni` Two monitoring implementations: `backend/src/core/monitoring/` (MonitoringService, in-memory counters, 160 LOC) and `backend/src/infrastructure/monitoring/` (MetricsService, Prometheus). Keep Prometheus. Net: ~160 LOC. [backend/src/core/monitoring/]

8. `shrink` `backend/src/common/logging/http-log-serializer.ts` — 249 lines of redactObject, safeSerialize, formatAndTruncate. Duplicates logic in `logger.utils.ts` maskSensitiveData (45 LOC). Merge. Net: ~200 LOC saved. [backend/src/common/logging/]

9. `delete` 6 shell scripts in `backend/scripts/` — backup.sh, restore.sh, verify-backup.sh, backup-postgres.sh, restore-postgres.sh, health-check.sh. If not in CI/CD, dead. Net: ~200 LOC. [backend/scripts/]

10. `delete` 4 benchmark scripts in `backend/scripts/` — setup-benchmark-db.ts, seed-benchmark.ts, run-benchmarks.ts, db-size.ts. One-off scripts committed. Net: ~300 LOC. [backend/scripts/]

11. `delete` `backend/scripts/s3-emulator.js` — 104-line Node.js HTTP S3 emulator. Dead if using real S3. [backend/scripts/s3-emulator.js]

12. `shrink` `backend/src/common/exceptions/index.ts` — 12 exception classes (Business, Validation, Database, Infrastructure, ExternalApi, Authentication, Authorization, FileUpload, Payment, Shipping, Storage, AiUnavailable) + GlobalExceptionMapper, 299 LOC. Most are identical wrappers. Reduce to 2-3 with a discriminator. Net: ~200 LOC saved. [backend/src/common/exceptions/index.ts]

13. `shrink` Triple response wrapping: `ResponseBuilder` (54 LOC) + `response.dto.ts` (62 LOC) + `global-response.interceptor.ts` (121 LOC) = 237 LOC for envelope formatting. One factory function suffices. Net: ~180 LOC saved. [backend/src/common/responses/, interceptors/]

14. `yagni` `backend/src/infrastructure/redis/redis.service.ts` — 124-line in-memory Map mock when Redis disabled. Use null-object or fail-fast. [backend/src/infrastructure/redis/redis.service.ts]

15. `delete` `backend/src/common/decorators/logger.decorator.ts` — 150 lines of method decorators (LogService, LogController, LogPerformance) that add noisy console logging. Replaced by existing pino interceptor. [backend/src/common/decorators/logger.decorator.ts]

16. `delete` `backend/src/common/logging/startup-dashboard.service.ts` — 58 lines of ASCII art console.log. Replace with single console.log in main.ts. [backend/src/common/logging/startup-dashboard.service.ts]

17. `yagni` `backend/src/infrastructure/queues/queues.module.ts` — 82 lines of mock providers when BullMQ disabled. Boot should fail if queue is required. [backend/src/infrastructure/queues/queues.module.ts]

18. `shrink` `backend/src/core/health/health.controller.ts` — 266 lines checking every subsystem including RAG (disabled). Remove RAG block, simplify. Net: ~100 LOC saved. [backend/src/core/health/health.controller.ts]

19. `shrink` `backend/src/infrastructure/storage/storage.service.ts` — 238 lines that mostly delegate to provider. Methods like get/exists/copy/move/getPublicUrl are one-liner delegations. Net: ~100 LOC saved. [backend/src/infrastructure/storage/storage.service.ts]

20. `shrink` `backend/src/infrastructure/storage/local-storage.provider.ts` — 119 lines implementing getSignedUploadUrl that returns public URL saying "local doesn't support signed URLs". [backend/src/infrastructure/storage/local-storage.provider.ts]

21. `native` `backend/src/common/validation/pipes.validation.ts` — UUIDPipe (254 LOC) reimplements NestJS ParseUUIDPipe + PaginationPipe duplicates ValidationPipe. Use NestJS native pipes. [backend/src/common/validation/pipes.validation.ts]

22. `delete` 8 placeholder barrel files: `backend/src/common/index.ts`, `interfaces/index.ts`, `pipes/index.ts`, `guards/index.ts` (~2 LOC each, `export {}`). [backend/src/common/]

23. `delete` Empty feature files: `backend/src/shared/commerce/commerce.module.ts` (5 LOC, no providers), `identity.module.ts` (14 LOC, no providers), `commerce.types.ts` (2 LOC, empty). [backend/src/shared/]

24. `delete` `backend/src/common/constants/index.ts` — ERROR_CODES (70 LOC) duplicates error codes in exceptions. [backend/src/common/constants/index.ts]

25. `delete` `backend/src/common/enums/index.ts` — UserStatus, OrderStatus etc. (64 LOC) duplicated by identity.enums.ts and commerce.enums.ts. [backend/src/common/enums/index.ts]

26. `yagni` 3 duplicate PaginationMeta definitions: `database.types.ts` (25 LOC), `commerce.interfaces.ts` (25 LOC), `common/types/index.ts` (25 LOC). Keep one. Net: ~50 LOC saved. [backend/src/]

27. `delete` `backend/src/common/dto/bulk.dto.ts` — BulkActionDto + BulkOperationResult (44 LOC). Only used by bulk.helper.ts but no controller actually wires BulkActionDto. [backend/src/common/dto/bulk.dto.ts]

28. `shrink` `backend/src/common/utils/bulk.helper.ts` — 44-line runBulkOperation helper. Inline into calling controllers. [backend/src/common/utils/bulk.helper.ts]

29. `delete` `backend/src/database/transaction.manager.ts` — 54-line Prisma $transaction wrapper with retry-on-deadlock. No domain repository uses it. [backend/src/database/transaction.manager.ts]

30. `delete` `backend/src/database/database.constants.ts` — 9-line constants file with single consumer. Inline. [backend/src/database/database.constants.ts]

## Honorable Mentions (smaller but worth noting)

31. `delete` `backend/src/common/security/security.utils.ts` — 58 lines (getClientIp, getUserAgent, maskIp). getUserAgent is `req.headers['user-agent'] || 'Unknown'`. Inline. [backend/src/common/security/security.utils.ts]
32. `delete` `frontend/src/features/rag-agent/` — ~100 LOC for a commented-out backend. [frontend/src/features/rag-agent/]
33. `delete` `frontend/src/tests/rag-agent.spec.ts` — ~200 LOC for non-existent backend. [frontend/src/tests/rag-agent.spec.ts]
34. `delete` `backend/k6-load-test.js` + `backend/load-test.mjs` — duplicate of `load-tests/` dir. Net: ~185 LOC. [backend/]
35. `delete` `frontend/src/lucide-react.d.ts` — type declarations for lucide-react which ships its own. [frontend/src/lucide-react.d.ts]
36. `delete` `backend/src/core/app.service.ts` + `app.controller.ts` + `app.controller.spec.ts` — Hello World scaffold. ~54 LOC. [backend/src/core/]
37. `delete` `backend/.prettierrc` — prettier config but project uses eslint-plugin-prettier. [backend/]
38. `delete` `backend/src/core/swagger/swagger.constants.ts` — API_TAGS constants (11 LOC) unused in any controller. [backend/src/core/swagger/]
39. `delete` `backend/src/core/swagger/swagger.examples.ts` — 78 lines of example objects; inline into decorators. [backend/src/core/swagger/]
40. `delete` `backend/test/storage-s3.e2e-spec.ts`, `app.e2e-spec.ts`, `jest-e2e.json` — e2e tests that never run in CI. [backend/test/]
41. `delete` 6 operational docs committed: BACKUP.md, PRODUCTION.md, RUNBOOK.md, DISASTER_RECOVERY.md, RAG_AGENT_BACKEND.md. ~250 LOC. [backend/]
42. `delete` `backend/src/infrastructure/queues/system-health.worker.ts` — 29-line stub worker returning `{ status: 'ok' }`. [backend/src/infrastructure/queues/]
43. `delete` 8 README-only dirs in `frontend/src/`: utils, types, styles, stores, services, lib, layouts, hooks. [frontend/src/]
44. `delete` `backend/prisma.config.ts` — 15 LOC generated config, superseded. [backend/prisma.config.ts]
45. `delete` `frontend/CLAUDE.md`, `frontend/AGENTS.md` — agent instruction files committed. [frontend/]
46. `delete` Root plan/notes files: `todat.md`, `data.md`, `implementation_plan.md`, `run.md`. [root/]
47. `delete` `backend/.env` — committed secrets. [backend/.env]
48. `delete` `backend/.github/workflows/ci.yml` — may not be in use. [backend/.github/workflows/]

---

## Summary

| Metric | Count |
|--------|-------|
| Total findings | 48 |
| Tag: `delete` | 35 |
| Tag: `shrink` | 8 |
| Tag: `yagni` | 3 |
| Tag: `stdlib` | 1 |
| Tag: `native` | 1 |

| Category | LOC Removable |
|----------|--------------|
| Build artifacts (dist/coverage/.next) | ~19,500 |
| Commented-out AI/ML domain modules | ~2,400 |
| Duplicate Prisma schema + seed | ~2,000 |
| Source code reductions | ~3,500 |
| **Total** | **~27,400 LOC** |

| Dependencies Removable | Reason |
|----------------------|--------|
| 0 | All dependencies are used somewhere in active code |

> **Actual source code (non-generated) removable: ~5,900 LOC**

---

## Key Patterns Identified

1. **Commented-out scaffolding** — 7+ AI/ML modules and 1 social module fully built but never imported. They have controllers, services, DTOs, tests — all dead.
2. **Build artifact commits** — dist/, coverage/, .next/ all tracked in git. Add to .gitignore.
3. **Duplicate prisma schema** — two copies of the entire schema (2143 + 1867 lines) in backend/prisma/ and database/schema/.
4. **Custom stdlib reimplementations** — 664-line decorators.validation.ts that rewrites class-validator. Just use the library.
5. **Triple response wrapping** — ResponseBuilder + response.dto.ts + global interceptor all format the same envelope.
6. **Singleton abstractions** — TransactionManager used by zero repos, BulkActionDto wired by zero controllers.
7. **Logger explosion** — 411-line logger + 249-line serializer + 58-line startup dashboard + 150-line method decorators. Pino handles most of this.
8. **12 exception classes, 3 pagination metas** — all could be 2-3 generic variants.
9. **README-only directories** — frontend has 8 directories that are just README files.
10. **Committed secrets** — .env file in git history.
