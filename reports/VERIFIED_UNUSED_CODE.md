# VERIFIED UNUSED CODE — VS Boutique Application

> **Status**: Each item verified by cross-referencing imports across the entire `web/src/` codebase.
> **Date**: 2026-06-26

---

## UC-001 (Medium) — `CartPage.jsx` — Dead File

| Field | Value |
|---|---|
| **File** | `web/src/pages/CartPage.jsx` |
| **Content** | 3-line re-export: `export { default } from './CustomerCart'; export default CustomerCart;` |
| **Import Check** | Grep for `CartPage` across `web/src/` returns **zero matches** outside the file itself |
| **Route Check** | No `<Route>` element in `App.jsx` references `CartPage` |
| **Evidence** | No component imports it, no route uses it. The actual cart page is `CustomerCart` directly. |
| **Verdict** | **CONFIRMED DEAD — Safe to delete** |

---

## UC-002 (Medium) — `CustomerCommerceLayout.jsx` — Dead Component

| Field | Value |
|---|---|
| **File** | `web/src/components/CustomerCommerceLayout.jsx` |
| **Content** | Full layout component with export `export default CustomerCommerceLayout` |
| **Import Check** | Grep for `CustomerCommerceLayout` across `web/src/` returns only 2 matches — both within the file itself (definition + export) |
| **Evidence** | No other file imports or references this component |
| **Verdict** | **CONFIRMED DEAD — Safe to delete** |

---

## UC-003 (Low) — `ProductDetail.jsx` — Dead Import in `App.jsx`

| Field | Value |
|---|---|
| **File** | `web/src/App.jsx:27` |
| **Code** | `import ProductDetail from './pages/ProductDetail'` |
| **Route Check** | Routes at lines 561, 567 use `CustomerProductDetail` (lazy-loaded from `./pages/CustomerProductDetail`) |
| **Evidence** | `ProductDetail` symbol never used in any JSX or route definition. Build succeeds with 0 errors. |
| **Verdict** | **CONFIRMED DEAD IMPORT — Remove import line. The file ProductDetail.jsx may be retained if it's a shared utility, but it's not referenced in any route.** |

---

## UC-004 (Low) — Unused API Wrappers in `api.js`

| Item | Status |
|---|---|
| `getPublicBoutique` | Not defined, not called anywhere. No impact. |
| `getAuditLogs` | Not defined, not called by name. Components use direct `api.get()` calls. No impact. |
| `getWishlist` / `addToWishlist` / `removeFromWishlist` | Defined with `customerApi` at lines 836-848. Not referenced by grep in any component. **NOTE**: May be called dynamically or conditionally. Verify runtime usage before deleting. |

---

## Summary

| File | Type | Verdict |
|---|---|---|
| `web/src/pages/CartPage.jsx` | Dead file | **Safe to delete** |
| `web/src/components/CustomerCommerceLayout.jsx` | Dead component | **Safe to delete** |
| `web/src/App.jsx:27` (ProductDetail import) | Dead import | **Safe to remove** |
| `web/src/services/api.js` (wishlist functions) | Possibly unused | **Verify runtime usage** |
