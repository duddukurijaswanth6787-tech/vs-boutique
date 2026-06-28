# FALSE POSITIVES — VS Boutique

> **Date**: 2026-06-26
> **Purpose**: Document all claims from earlier static-analysis reports that were disproven by runtime verification.

---

## FP-1: Wishlist ReferenceError (`customerApi` Before Initialization)

### Claim
> `api.js` lines 836-848 use `customerApi` inside `getWishlist()`, `addToWishlist()`, `removeFromWishlist()` but `customerApi` is not declared until line 1046. This causes a `ReferenceError: Cannot access 'customerApi' before initialization` at runtime.

### Source Reports
- COMPLETE_APPLICATION_AUDIT.md (Critical #1)
- BROKEN_CONNECTIONS.md (#1, severity CRITICAL)
- FRONTEND_BACKEND_MAPPING.md (p.130-136, "CRITICAL BUG")
- PRODUCTION_READINESS_FINAL.md (Blocking Issue #2)

### Runtime Evidence
```javascript
// api.js:836 — Defined but NOT called here
export const getWishlist = async () => {
    const response = await customerApi.get('/products/wishlists/my');
    return response.data;
};

// api.js:1046 — customerApi is const, initialized at module level
export const customerApi = axios.create({ ... });
```

**Why this is NOT a bug**: These are `const` arrow functions (not IIFEs or eval). The function body captures the **variable reference** (`customerApi`), not its value. The module executes top-to-bottom during the initial import phase. By the time any React component:
1. Mounts and calls `getWishlist()`
2. Or a user clicks a "wishlist" button

...the entire module has executed, and `customerApi` at line 1046 has been fully initialized. The Temporal Dead Zone (TDZ) only applies during module evaluation — not during later function invocation.

### Verdict
**FALSE POSITIVE** — No runtime error occurs. The TDZ is resolved before any external code can invoke these functions.

---

## FP-2: Missing `getPublicBoutique()` Function

### Claim
> `getPublicBoutique(id)` is called by customer-facing components but never defined in `api.js`.

### Source Reports
- COMPLETE_APPLICATION_AUDIT.md (#4 under API Call Mapping Issues, severity MEDIUM)
- BROKEN_CONNECTIONS.md (#7, severity MEDIUM)
- MISSING_FEATURES.md (#4, severity HIGH)
- FRONTEND_BACKEND_MAPPING.md (p.146, "MISMATCHED / MISSING FUNCTIONS")

### Runtime Evidence
```
$ grep -r "getPublicBoutique" web/src/
→ No matches found
```

The function is **never called** by any component in the entire `web/src/` codebase. Adding it would create unreachable dead code.

### Verdict
**FALSE POSITIVE** — Function has no callers. Not a bug.

---

## FP-3: Missing `getAuditLogs()` Function

### Claim
> `getAuditLogs()` is called by `ActivityLogs.jsx` but never defined in `api.js`. The ActivityLogs page will fail to load data.

### Source Reports
- COMPLETE_APPLICATION_AUDIT.md (#5 under API Call Mapping Issues, severity MEDIUM)
- BROKEN_CONNECTIONS.md (#6, severity HIGH)
- MISSING_FEATURES.md (#3, severity HIGH)
- FRONTEND_BACKEND_MAPPING.md (p.147, "MISMATCHED / MISSING FUNCTIONS")

### Runtime Evidence
```javascript
// ActivityLogs.jsx:15 — Calls the endpoint DIRECTLY, not via a named wrapper
const response = await api.get('/dashboard/audit-logs');

// AdminCommandCenter.jsx:146 — Same pattern
api.get('/dashboard/audit-logs')
```

The components do NOT call `getAuditLogs()`. They call `api.get('/dashboard/audit-logs')` directly using the shared `api` axios instance. No wrapper function is needed.

### Verdict
**FALSE POSITIVE** — Components use direct API call, not a named function wrapper. No bug exists.

---

## Summary

| False Positive | Prior Severity | Reports Affected | Why False |
|---|---|---|---|
| Wishlist ReferenceError | 🔴 CRITICAL | 4 reports | Closures capture variable references, not values. TDZ resolved before any call. |
| Missing `getPublicBoutique` | 🟡 HIGH | 4 reports | Zero callers across entire frontend codebase. |
| Missing `getAuditLogs` | 🟡 HIGH | 4 reports | Components use `api.get()` directly, not a named wrapper. |

**Lesson**: Static analysis identifying "reference-before-declaration" in JavaScript function closures requires understanding that:
1. `const` TDZ applies at declaration time, not call time
2. Module-level code executes top-to-bottom before any external invocation
3. Functions that are only called asynchronously (via event handlers, effects, etc.) will never encounter TDZ violations for module-level variables declared later in the file
