# Database Performance Profiling — Vasanthi Designers

Reference for finding and fixing slow queries in the NestJS + Prisma + PostgreSQL
backend.

## 1. Slow-query logging (already enabled)

`PrismaService` listens to Prisma's `query` event and logs any query slower than
the configured threshold as a `warn` with logger context `PrismaSlowQuery`.

- **Default threshold:** `1000ms`
- **Override:** set env `SLOW_QUERY_THRESHOLD` (ms) — validated as a non-negative
  integer in `src/config/env.validation.ts`.
- **Log shape:**
  ```json
  { "query": "...", "params": "...", "duration": 1234, "threshold": 1000 }
  ```
- **Where:** `src/database/prisma.service.ts` (`$on('query', ...)`).

In non-production, every query is also logged at `debug` level
(`PrismaQuery`) for tracing.

> Action: ship logs to your aggregator (pino → stdout → collector) and alert on
> `PrismaSlowQuery` warn entries. Tune the threshold down (e.g. 250ms) in staging
> once baseline latency is known.

## 2. EXPLAIN ANALYZE runbook

For any query flagged by the slow-query log (or any endpoint you want to verify):

```sql
-- 1. Plan + actual timings
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT JSON)
SELECT ... ;   -- paste the flagged query, substitute params

-- 2. Read the plan:
--    * Seq Scan on a large table  -> missing index
--    * high "actual rows" vs "estimated rows" -> stale statistics -> ANALYZE
--    * big "Heap Fetches"         -> missing index / need Index-Only Scan
--    * nested loop with many rows -> consider composite index on join+filter cols
```

Common Prisma hot paths and what to verify:

| Path | Table(s) | Watch for |
|------|----------|-----------|
| `dashboard/summary` | `Order`, `OrderItem`, `Inventory`, `CustomerProfile` | `createdAt` range scans need a B-tree index on `(createdAt)`; `status` filters need `(status, createdAt)` composite |
| `reports/*` | `Order`, `Payment`, `Refund` | date-range scans over `createdAt`; ensure index |
| `categories/tree` | `Category` | `parentId` / `path` lookups; index on `parentId` and `path` |
| `PermissionsGuard` | `UserRole` → `Role` → `RolePermission` | `userId` index on `UserRole`; cache already covers this (TTL 300s) |
| list endpoints | most tables | pagination uses `createdAt`/`displayOrder` cursor; index those sort columns |

### Add an index (only when EXPLAIN proves benefit)
```prisma
model Order {
  @@index([status, createdAt])   // composite for status+range dashboard queries
  @@index([createdAt])           // range scans
}
```
Migrate with `npx prisma migrate dev` (dev) or `prisma migrate deploy` (prod).
**Do not add indexes speculatively** — every index slows writes.

## 3. Connection pool

`PrismaPg` adapter, pool `max` raised to **20** in `prisma.service.ts`
(default driver pool is 10). Under load, watch DB connections: if you see
pool exhaustion, raise `max` or verify caches are hitting (a cache miss storm
fans out many queries).

## 4. Caching layer (Phase 8)

Read-heavy, rarely-changing data is cached in Redis via `CacheService.getOrSet`:

| Key prefix | TTL | Invalidation |
|------------|-----|--------------|
| `dashboard:summary` | 60s | TTL only |
| `dashboard:sales-chart:<period>` | 120s | TTL only |
| `dashboard:cancellation-refund-trends` | 300s | TTL only |
| `dashboard:inventory-valuation` | 300s | TTL only |
| `report:<type>:<start>:<end>` | 120s | TTL only |
| `category:*` | 60–300s | `delPattern('category:*')` on mutation |
| `brand:*` | 60–300s | `delPattern('brand:*')` on mutation |
| `setting:*` | 300s | `delPattern('setting:*')` on write |
| `perms:<userId>` | 300s | `delPattern('perms:*')` on role/perm change |

`CacheService.getOrSet` swallows Redis errors and falls back to the live query,
so a Redis outage degrades to uncached behavior rather than failing.
