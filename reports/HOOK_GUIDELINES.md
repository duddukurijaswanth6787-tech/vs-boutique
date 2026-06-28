# VS Boutique ERP — Custom Hooks Architecture & Guidelines

> **Status:** Living document  
> **Current state:** 1 custom hook exists (`useDebounce`). Most data fetching is done inline in pages via direct API imports.  
> **Goal:** Centralise all reusable stateful logic into `@core/hooks` with consistent patterns.

---

## Section 1: Hook Categories

### 1.1 Data Fetching Hooks

These hooks wrap React Query to eliminate repetitive query configuration across pages.

```js
// useApi.js
import { useQuery } from '@tanstack/react-query';

export function useApi(queryKey, queryFn, options = {}) {
  return useQuery({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    ...options,
  });
}
```

| Option | Default | Rationale |
|--------|---------|-----------|
| `staleTime` | 5 min | ERP data changes infrequently; avoids refetching on remount. |
| `retry` | 1 | One retry covers transient network blips without infinite loops. |
| `refetchOnWindowFocus` | `false` | Prevents unwanted refetches when switching tabs. |

```js
// usePagination.js
import { useState, useCallback } from 'react';

export function usePagination(queryKey, queryFn, pageSize = 20) {
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: [queryKey, page],
    queryFn,
    keepPreviousData: true,
  });

  const nextPage = useCallback(() => {
    setPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage(prev => Math.max(prev - 1, 1));
  }, []);

  return { data, page, totalPages, setTotalPages, nextPage, prevPage, isLoading };
}
```

### 1.2 UI State Hooks

Lightweight hooks that encapsulate common UI interaction patterns.

```js
// useModal.js
import { useState, useCallback } from 'react';

export function useModal(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(v => !v), []);
  return { isOpen, open, close, toggle };
}
```

```js
// useToast.js
import { useCallback } from 'react';
import { toast } from 'react-toastify';

export function useToast() {
  const showToast = useCallback((message, type = 'info') => {
    toast[type](message);
  }, []);
  const hideToast = useCallback(() => {
    toast.dismiss();
  }, []);
  return { showToast, hideToast };
}
```

```js
// useDebounce.js (EXISTING — keep as-is)
export function useDebounce(value, delay = 300) {
  // Existing implementation — do not modify.
  // Returns debounced value after `delay` ms of inactivity.
}
```

```js
// useInfiniteScroll.js
import { useEffect, useRef } from 'react';

export function useInfiniteScroll(callback, options = {}) {
  const sentinelRef = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true);
        callback();
      }
    }, { threshold: 0.1, ...options });

    observer.observe(el);
    return () => observer.disconnect();
  }, [callback, options]);

  return { sentinelRef, isIntersecting };
}
```

### 1.3 Auth & Permissions Hooks

Centralise role checks so that permission logic lives in one place.

```js
// useCurrentUser.js
import { useContext } from 'react';
import { AuthContext } from '@core/contexts/AuthContext';

export function useCurrentUser() {
  const { user } = useContext(AuthContext);
  return user;
}
```

```js
// usePermissions.js
import { useCallback } from 'react';
import { useCurrentUser } from './useCurrentUser';

export function usePermissions() {
  const user = useCurrentUser();

  const isAdmin = user?.role === 'admin';
  const isOwner = user?.role === 'owner';
  const isCustomer = user?.role === 'customer';

  const hasRole = useCallback((role) => user?.role === role, [user]);

  const can = useCallback((action, resource) => {
    // Extend with a per-rule ACL table if needed.
    if (isAdmin) return true;
    // Resource-specific logic goes here.
    return true;
  }, [isAdmin]);

  return { isAdmin, isOwner, isCustomer, hasRole, can };
}
```

> **Note:** `useCustomerAuth` already exists inside `CustomerAuthContext` and should be used directly for customer-specific flows.

### 1.4 Search & Filter Hooks

```js
// useSearch.js
import { useState } from 'react';
import { useDebounce } from './useDebounce';

export function useSearch(initialValue = '', delay = 300) {
  const [search, setSearch] = useState(initialValue);
  const debouncedSearch = useDebounce(search, delay);
  return { search, setSearch, debouncedSearch };
}
```

```js
// useFilter.js
import { useState, useCallback } from 'react';

export function useFilter(initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters);

  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  return { filters, setFilter, setFilters, resetFilters };
}
```

### 1.5 Data Mutation Hooks

```js
// useUpload.js
import { useState, useCallback } from 'react';
import { uploadFile } from '@core/services/api/upload.api';

export function useUpload() {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const upload = useCallback(async (file, config = {}) => {
    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      const result = await uploadFile(file, {
        onProgress: (pct) => setProgress(pct),
        ...config,
      });
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { upload, progress, isUploading, error };
}
```

### 1.6 Notification Hooks

```js
// useNotifications.js
import { useContext } from 'react';
import { AdminNotificationContext } from '@core/contexts/AdminNotificationContext';
import { CustomerNotificationContext } from '@core/contexts/CustomerNotificationContext';

export function useNotifications() {
  const admin = useContext(AdminNotificationContext);
  const customer = useContext(CustomerNotificationContext);
  // Combines both contexts; calling code decides which to use.
  return { admin, customer };
}
```

---

## Section 2: Hook Composition Rules

1. **Hooks can call other hooks** from `@core/hooks` or React (e.g. `useState`, `useEffect`, `useContext`). This is the primary mechanism for reuse.

2. **Hooks must not call API functions directly** — raw API calls should only appear inside React Query `queryFn` or `mutationFn` callbacks so that caching, retries, and error boundaries are applied consistently.

3. **Hooks must not import from `features/`** — hooks belong to the core layer; they cannot depend on feature modules. Feature-specific hooks live inside their feature folder and import from core.

4. **Single responsibility** — if a hook does more than one conceptual thing, split it. `useUserProfile` should not also handle modals.

5. **Stable references** — every function or object returned from a hook should be wrapped in `useCallback` or `useMemo` where appropriate so that consumers can safely include them in dependency arrays without causing infinite loops.

6. **Custom hooks over HOCs** — never use higher-order components for cross-cutting concerns; hooks compose more naturally.

---

## Section 3: Hook Templates

Use the following template when creating a new data-fetching hook:

```jsx
// use{Resource}.js
import { useQuery } from '@tanstack/react-query';
import { get{Resource} } from '@core/services/api/{resource}.api';

export function use{Resource}(params = {}, options = {}) {
  return useQuery({
    queryKey: ['{resource}', params],
    queryFn: () => get{Resource}(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}
```

Use the following template when creating a new mutation hook:

```jsx
// use{Mutation}Mutation.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { create{Resource} } from '@core/services/api/{resource}.api';

export function useCreate{Resource}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: create{Resource},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['{resource}'] });
    },
  });
}
```

---

## Section 4: Page-Level Hook Usage Patterns

### Before (current pattern — legacy)

```jsx
import { useState, useEffect } from 'react';
import { getBoutiques } from '../services/api';

export function Boutiques() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBoutiques()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  return <Table data={data} />;
}
```

**Problems:**
- No caching — every mount triggers a network request.
- No retry logic — failures silently produce empty UI.
- No race-condition handling — stale responses can overwrite newer ones.
- Boilerplate (state + effect) repeated across every page.

### After (enterprise pattern)

```jsx
import { useQuery } from '@tanstack/react-query';
import { getBoutiques } from '@core/services/api/boutique.api';
import { useSearch, usePagination } from '@core/hooks';

export default function Boutiques() {
  const { search, setSearch, debouncedSearch } = useSearch();
  const { page, nextPage, prevPage, data, isLoading } = usePagination(
    ['boutiques', debouncedSearch],
    () => getBoutiques({ search: debouncedSearch, page }),
  );

  if (isLoading) return <Spinner />;
  return (
    <>
      <SearchBar value={search} onChange={setSearch} />
      <Table data={data} />
      <Pagination onNext={nextPage} onPrev={prevPage} page={page} />
    </>
  );
}
```

**Benefits:**
- React Query manages caching, deduplication, retries, and background refetching.
- Hook composition means `useSearch` and `usePagination` are reusable across any list page.
- No `useState`/`useEffect` boilerplate on the page.

### Mutation example

```jsx
// Before
function CreateBoutique() {
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      await createBoutique(data);
      alert('Created!');
    } finally {
      setLoading(false);
    }
  };
}

// After
function CreateBoutique() {
  const mutation = useCreateBoutique();
  const handleSubmit = (data) => mutation.mutate(data);
  return <Form onSubmit={handleSubmit} isLoading={mutation.isPending} />;
}
```

---

## Section 5: Migration Plan

### Phase 1 — Hook creation

1. Audit every page in the application and identify data-fetching, modal, filter, and pagination patterns.
2. Create the following files under `src/core/hooks/`:
   - `useApi.js`
   - `usePagination.js`
   - `useModal.js`
   - `useToast.js`
   - `useInfiniteScroll.js`
   - `useCurrentUser.js`
   - `usePermissions.js`
   - `useSearch.js`
   - `useFilter.js`
   - `useUpload.js`
   - `useNotifications.js`

### Phase 2 — Barrel export

Create `src/core/hooks/index.js`:

```js
export { useApi } from './useApi';
export { usePagination } from './usePagination';
export { useModal } from './useModal';
export { useToast } from './useToast';
export { useDebounce } from './useDebounce';
export { useInfiniteScroll } from './useInfiniteScroll';
export { useCurrentUser } from './useCurrentUser';
export { usePermissions } from './usePermissions';
export { useSearch } from './useSearch';
export { useFilter } from './useFilter';
export { useUpload } from './useUpload';
export { useNotifications } from './useNotifications';
```

### Phase 3 — Page migration

For each page:
1. Replace inline `useState` + `useEffect` data fetching with `useQuery` + the appropriate data-fetching hook.
2. Replace inline modal state with `useModal`.
3. Replace inline search/filter state with `useSearch` / `useFilter`.
4. Replace inline pagination state with `usePagination`.
5. Remove any now-unused local state variables.
6. Verify behaviour matches before/after (loading states, empty states, error states).

### Phase 4 — Cleanup

1. Remove `useEffect`-based data fetching from all pages.
2. Remove unused direct API imports from page files.
3. Remove any `services/api` imports that are now routed through `@core/services/api/`.
4. Run the full test suite and fix any regressions.
5. Update this document with any new hooks discovered during migration.

---

## Appendix: Naming Conventions

| Category | Pattern | Example |
|----------|---------|---------|
| Data fetching | `use{Resource}` | `useBoutiques`, `useProduct` |
| Mutations | `use{Action}{Resource}` | `useCreateBoutique`, `useDeleteProduct` |
| UI state | `use{Feature}` | `useModal`, `useToast` |
| Auth | `use{Feature}` | `useCurrentUser`, `usePermissions` |
| Search/Filter | `use{Feature}` | `useSearch`, `useFilter` |
| File operations | `use{Action}` | `useUpload`, `useDownload` |

---

## Appendix: Path Aliases

All imports from core must use the `@core` path alias configured in `jsconfig.json` / `vite.config.js`:

```json
{
  "compilerOptions": {
    "paths": {
      "@core/*": ["src/core/*"]
    }
  }
}
```

Example: `import { useApi } from '@core/hooks'`  
Example: `import { getBoutiques } from '@core/services/api/boutique.api'`

---

*This document should be reviewed after every feature sprint and updated when new hook categories emerge.*
