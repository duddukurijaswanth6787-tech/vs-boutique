# Frontend Performance Notes

Notes from the Phase 8 frontend performance pass. "No change" items are
conclusions backed by inspection, not speculation.

## Bundle analysis (Task 1)

The Next.js bundle analyzer is integrated behind an env flag so it never slows
normal builds.

```bash
ANALYZE=true npm run build      # opens an interactive report of JS chunks
```

- Wired in `next.config.ts` via `@next/bundle-analyzer` (`enabled` only when
  `ANALYZE` is set).
- Largest dependency: `recharts` (used by `admin/dashboard` and `admin/analytics`).
  Next already code-splits it into a route-scoped chunk, so non-chart routes
  (orders, products, customers, …) do not download it.

## React rendering (Task 2)

- No React Profiler / DevTools capture was available in this environment, so no
  measured re-render bottlenecks exist to fix.
- `React.memo` / `useMemo` / `useCallback` sweeps were **not** applied — doing so
  without a profiler trace is speculative and risks hiding real changes behind
  memo boundaries.

## Dynamic imports (Task 3)

- `recharts` is already isolated to the `dashboard` / `analytics` route chunks
  by Next's automatic per-route code splitting. Adding `next/dynamic` inside
  those pages would only defer the chart one render and introduce a skeleton
  flash on the admin landing page — not a measured benefit.
- No other single component dominates a route's initial JS enough to justify a
  dynamic import. Revisit only if the analyzer shows a route with a heavy
  above-the-fold chunk.

## React Query (Task 4)

`src/lib/query/client.ts` already configured sensibly:

- `staleTime: 5 * 60 * 1000` — admin data stays fresh 5 min, no refetch storm
  on remount/navigation.
- `refetchOnWindowFocus: false` — no background refetch on tab focus.
- `retry` skips `400/401/403/404/422` (no pointless retries on client errors)
  and retries transient failures at most twice.

No `keepPreviousData` / `gcTime` change was applied — it would alter UX
(pagination/transition behavior) without a proven benefit.

## Image optimization (Task 6)

- `ProductThumbnail` now uses `next/image` (`fill` + `sizes="56px"` +
  `loading="lazy"`) so Next resizes/optimizes and serves cached variants.
- `next.config.ts` declares `images.remotePatterns` for `https` hosts so remote
  (S3) product images are optimized. **Pin the real bucket host(s) in production**
  instead of the `**` wildcard.
- Other images across the app already use `<img loading="lazy">`.

## Dependency cleanup (Task 5)

Removed unused dependencies (verified absent from `src/` imports):

- `@hookform/resolvers`
- `tailwind-merge`
- `clsx`

`react-hook-form`, `zod`, `recharts`, `@tanstack/react-query`, `lucide-react`,
`sonner`, `zustand`, `axios` are all used and retained.
