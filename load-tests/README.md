# Load Testing — Vasanthi Designers Admin

Load tests use [k6](https://k6.io/). The script exercises the cache-hot admin
read paths implemented in Phase 8 (dashboard summary, sales chart, reports,
category tree, brands, settings).

## Prerequisites
- k6 installed: `brew install k6` (macOS) or `winget install k6` (Windows)
- A running backend + frontend with a valid admin JWT

## Run

```bash
# smoke test (10 VUs, 1 min)
k6 run load-tests/admin-load-test.js

# soak test (ramp to 50 VUs, ~9 min)
k6 run -e BASE_URL=http://localhost:4000 -e AUTH_TOKEN=<admin-jwt> load-tests/admin-load-test.js

# with the bundle analyzer equivalent for backend, use the dashboard cache TTL
# to observe the cache-hit plateau after warm-up.
```

## Environment variables
| Var | Default | Description |
|-----|---------|-------------|
| `BASE_URL` | `http://localhost:4000` | Frontend/base URL |
| `AUTH_TOKEN` | _(empty)_ | Admin `Bearer` JWT |

> Adjust `API` in the script if your API is mounted under a different prefix
> (e.g. `/api` vs `/admin`). The endpoint list already matches the cached
> routes from Phase 8.

## Thresholds
- `p(95) < 800ms`, `p(99) < 1500ms` — verifies cached reads stay fast
- `request_failures < 1%`

## What to look for
- After the first warm-up request, dashboard/report endpoints should flatline
  near single-digit ms (Redis cache hit, 0 DB queries).
- The `perms:*` cache removes a DB round-trip from every `@Permissions`-guarded
  request — watch the DB connection count stay flat under load.
- If `p99` climbs, check Redis availability (cache falls back to live query)
  and DB pool size (`PrismaPg max`, currently 20).
