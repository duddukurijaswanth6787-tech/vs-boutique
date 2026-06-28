# VS Boutique ERP — Frontend Coding Standards

> **Version:** 1.0  
> **Last Updated:** 2026-06-26  
> **Scope:** All JavaScript/JSX files within the `src/` directory of the VS Boutique ERP frontend.

---

## Table of Contents

1. [ESLint Configuration](#1-eslint-configuration)
2. [Import Order Convention](#2-import-order-convention)
3. [Naming Conventions](#3-naming-conventions)
4. [File Structure Convention](#4-file-structure-convention)
5. [Component Size Limits](#5-component-size-limits)
6. [Comment Convention](#6-comment-convention)
7. [State Management Convention](#7-state-management-convention)
8. [Performance Conventions](#8-performance-conventions)

---

## 1. ESLint Configuration

### Current State

ESLint has 5 critical rules disabled: `no-unused-vars`, `no-undef`, `exhaustive-deps`, `set-state-in-effect`, `only-export-components`. No consistent import ordering or architectural boundary enforcement exists. This has led to dead code accumulation, implicit globals, missing hook dependencies, and cross-feature coupling.

### Target Configuration

The following `eslint.config.js` enables all previously disabled rules and introduces import/architectural guards. This **must** be adopted project-wide:

```js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import importPlugin from 'eslint-plugin-import';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: { import: importPlugin },
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2021 },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // ENABLE all previously disabled rules
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',

      // Import rules
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/no-duplicates': 'error',
      'import/order': ['warn', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc' },
      }],
      'import/no-restricted-paths': ['error', {
        zones: [
          { target: './src/core', from: './src/features' },
          { target: './src/features/admin', from: './src/features/owner' },
          { target: './src/features/admin', from: './src/features/customer' },
          { target: './src/features/owner', from: './src/features/admin' },
          { target: './src/features/owner', from: './src/features/customer' },
          { target: './src/features/customer', from: './src/features/admin' },
          { target: './src/features/customer', from: './src/features/owner' },
        ],
      }],

      // React Refresh
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Best practices
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
    },
  },
]);
```

### Rule Enforcement Summary

| Rule | Level | Purpose |
|---|---|---|
| `no-unused-vars` | warn | Catch dead code; allow `_` prefix for intentionally unused params |
| `no-undef` | error | Prevent implicit globals |
| `react-hooks/exhaustive-deps` | warn | Ensure all hook deps are declared |
| `react-hooks/rules-of-hooks` | error | Enforce Rules of Hooks (no conditional calls) |
| `import/order` | warn | Enforce consistent import structure |
| `import/no-restricted-paths` | error | Enforce feature boundary isolation |
| `react-refresh/only-export-components` | warn | Prevent HMR breakage |
| `no-console` | warn | Allow only `console.warn` and `console.error` |
| `no-debugger` | error | No debugger statements in production code |
| `prefer-const` | error | Use `const` over `let` when variable is never reassigned |
| `eqeqeq` | error | Require strict equality (`===` / `!==`) |

---

## 2. Import Order Convention

All imports **must** follow this strict ordering, with blank lines between each group. Within each group, imports are alphabetized.

```jsx
// 1. React & framework
import { useState, useEffect, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Third-party libraries
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShoppingCart } from 'lucide-react';

// 3. Core module imports (via aliases)
import { Button, Card, Input, Modal } from '@core/components';
import { useDebounce, useModal } from '@core/hooks';
import { getBoutiques } from '@core/services/api/boutique.api';
import { AuthContext } from '@core/contexts';
import { formatCurrency } from '@core/utils/formatters';

// 4. Feature imports (relative)
import { BoutiqueTable } from './components/BoutiqueTable';

// 5. Asset imports
import heroImage from '@assets/images/hero.jpg';

// 6. Style imports (last)
import './styles.css';
```

### Group Definitions

| # | Group | Contents | Separator |
|---|---|---|---|
| 1 | React & framework | `react`, `react-dom`, `@tanstack/react-query`, `react-router-dom` | Blank line after |
| 2 | Third-party libraries | `framer-motion`, `lucide-react`, `axios`, `date-fns`, etc. | Blank line after |
| 3 | Core module (aliases) | `@core/*`, `@assets/*`, `@shared/*` | Blank line after |
| 4 | Feature imports | Relative imports (`./`, `../`) for same-feature modules | Blank line after |
| 5 | Asset imports | Images, fonts, media files | Blank line after |
| 6 | Style imports | `.css` files (last) | End of imports |

> **Note:** These groups map directly to the `import/order` rule groups: `builtin`, `external`, `internal`, `parent`, `sibling`, `index`. The ESLint rule will auto-enforce this order.

---

## 3. Naming Conventions

| Category | Convention | Example |
|---|---|---|
| Components (files) | `PascalCase.jsx` | `Button.jsx`, `ProductCard.jsx` |
| Components (export) | Named export | `export function Button()` |
| Pages (files) | `PascalCase.jsx` | `Boutiques.jsx`, `Customers.jsx` |
| Pages (export) | Default export | `export default function Boutiques()` |
| Hooks (files) | `camelCase.js` | `useDebounce.js`, `useModal.js` |
| Hooks (export) | Named export | `export function useDebounce()` |
| Utilities (files) | `camelCase.js` | `formatters.js`, `validators.js` |
| Utilities (export) | Named export | `export function formatCurrency()` |
| Contexts (files) | `PascalCase.jsx` | `AuthContext.jsx` |
| Contexts (export) | Named export | `export { AuthProvider, AuthContext }` |
| Constants | `UPPER_SNAKE_CASE` | `API_BASE_URL`, `MAX_RETRY_COUNT` |
| CSS classes | `kebab-case` | `bg-primary`, `text-secondary` |
| Folders | `kebab-case` | `ui/`, `empty-states/`, `bottom-sheet/` |
| API endpoints | `kebab-case` | `/boutiques`, `/admin/customers` |
| Custom events | `camelCase` | `onBoutiqueSelect`, `onSubscriptionCancel` |
| Boolean props | `is*` or `has*` prefix | `isLoading`, `isDisabled`, `hasError` |
| Callback props | `on*` prefix | `onClick`, `onChange`, `onSubmit` |
| Data-testid values | `kebab-case` prefixed with component | `boutique-table`, `product-card-title` |

### File Extensions

| File Type | Extension |
|---|---|
| React components | `.jsx` |
| React pages | `.jsx` |
| Hooks | `.js` |
| Utilities / helpers | `.js` |
| Constants / config | `.js` |
| Context definitions | `.jsx` |
| Styles | `.css` |
| Tests | `.test.js` or `.test.jsx` |

---

## 4. File Structure Convention

### Functional Component Pattern

Every functional component file must follow this structure:

```jsx
// 1. Imports (organized by section, see §2)
import { useState } from 'react';
import { Button } from '@core/components';

// 2. JSDoc comment block
/**
 * BoutiqueTable - Displays a paginated table of boutiques.
 * @param {object} props
 * @param {Array} props.boutiques - List of boutiques
 * @param {function} props.onEdit - Edit handler
 * @param {function} props.onDelete - Delete handler
 */
export function BoutiqueTable({ boutiques, onEdit, onDelete }) {
  return (
    <table>
      {/* ... */}
    </table>
  );
}

// 3. Display name (optional, for debugging)
BoutiqueTable.displayName = 'BoutiqueTable';
```

### Page Component Pattern

Every page component must follow this structure:

```jsx
import { useQuery } from '@tanstack/react-query';
import { PageHeader, Button, Card, LoadingOverlay, ErrorState } from '@core/components';
import { RouteTransition } from '@core/components/animations';
import { getBoutiques } from '@core/services/api/boutique.api';

/**
 * Boutiques - Main boutique management page.
 * Fetches and displays all registered boutiques with CRUD actions.
 */
export default function Boutiques() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['boutiques'],
    queryFn: getBoutiques,
  });

  if (isLoading) return <LoadingOverlay />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <RouteTransition>
      <PageHeader title="Boutique Management" />
      {/* page content */}
    </RouteTransition>
  );
}
```

### Page Data-Fetching Pattern

All pages must follow the **fetch → guard → render** pattern:

1. **Fetch** — Use React Query hooks
2. **Guard** — Handle `isLoading` (→ `LoadingOverlay`), `error` (→ `ErrorState`), empty data (→ `EmptyState`)
3. **Render** — Wrap content in `RouteTransition`, render `PageHeader`, then page-specific content

### Directory Structure (per feature)

```
src/features/boutiques/
├── components/
│   ├── BoutiqueTable.jsx
│   ├── BoutiqueForm.jsx
│   └── BoutiqueCard.jsx
├── pages/
│   └── Boutiques.jsx
├── services/
│   └── boutique.service.js
└── utils/
    └── boutique.helpers.js
```

---

## 5. Component Size Limits

### Hard Limits

| Component Type | Max Lines | Max Props | Max JSX Nesting Depth |
|---|---|---|---|
| UI Primitive | 100 | 10 | 3 |
| Layout Component | 80 | 6 | 4 |
| Feature Component | 300 | 8 | 5 |
| Page Component | 500 | N/A | 6 |
| Context Provider | 200 | N/A | N/A |

- **Lines** are measured excluding comments and blank lines.
- **JSX Nesting Depth** is measured as the maximum depth of JSX element children from the root.
- **Props** count all destructured props (excluding `children`).

### Current Violations (Requiring Immediate Refactoring)

| File | Lines | Limit | Over by |
|---|---|---|---|
| `AdminSubscriptions.jsx` | 1,899 | 500 | 3.8× |
| `api.js` | 1,325 | N/A (utility) | Will be split |
| `OwnerProducts.jsx` | 884 | 500 | 1.8× |
| `Customers.jsx` | 882 | 500 | 1.8× |

Files exceeding these limits **must** be refactored into smaller, focused components before new feature work begins on them.

### Refactoring Strategy

1. Extract reusable UI sections into feature components
2. Move complex table/card rendering into dedicated `components/` sub-directory
3. Split utility files over 300 lines into domain-specific modules

---

## 6. Comment Convention

### JSDoc Requirements

Every **exported** function, component, and hook **must** have a JSDoc comment block:

```js
/**
 * Calculates the subscription end date based on start date and billing period.
 * @param {Date} startDate - The subscription start date
 * @param {'monthly'|'yearly'} billingPeriod - The billing cycle
 * @returns {Date} The calculated end date
 */
export function calculateEndDate(startDate, billingPeriod) {
  // ...
}
```

### JSDoc for Components

```js
/**
 * BoutiqueCard - Displays a boutique summary card with actions.
 * @param {object} props
 * @param {object} props.boutique - Boutique data object
 * @param {function} props.onEdit - Called with boutique ID when edit is clicked
 * @param {function} props.onDelete - Called with boutique ID when delete is confirmed
 */
export function BoutiqueCard({ boutique, onEdit, onDelete }) { ... }
```

### Rules

| Rule | Applies to |
|---|---|
| **Do** write JSDoc for all exported functions, components, and hooks | Every `.js` / `.jsx` file |
| **Do not** write inline comments explaining *what* the code does | The code should be self-documenting |
| **Do** write inline comments explaining *why* something non-obvious is done | Business logic quirks, performance workarounds |
| **Do not** commit commented-out code | Delete it. Use version control to recover if needed |
| **Do** use `TODO:` comments for technical debt with a ticket reference | `// TODO: #234 - Extract pagination logic` |
| **Do not** leave `FIXME` or `HACK` comments without an owner/ticket | Use `TODO:` with a reference instead |

### Comment Examples

```js
// GOOD: Explains why a non-obvious approach was taken
// The API returns -1 for unlimited subscriptions; we coerce to Infinity
// to simplify downstream comparison logic.
const maxSubscriptions = apiLimit === -1 ? Infinity : apiLimit;

// BAD: Explains what the code does (redundant)
// Increment the counter by 1
count += 1;
```

---

## 7. State Management Convention

### Data Tier Mapping

| State Type | Solution | Location |
|---|---|---|
| Server state | React Query (`useQuery`, `useMutation`) | Service layer / hooks |
| Cross-cutting client state | React Context | `src/core/contexts/` |
| Local component state | `useState` / `useReducer` | Within the component |
| Form state | `useState` | Within the component or form hook |

### Rules

| Rule | Rationale |
|---|---|
| **Server state must use React Query only** | Avoid duplicating server state in Context; React Query provides caching, deduplication, and background refetching |
| **Context is for cross-cutting concerns only** | Auth, theme, notifications — NOT for server data |
| **No prop drilling beyond 3 levels** | If a prop passes through ≥3 intermediate components, use Context or component composition (children/slots) |
| **No form libraries currently** | Keep `useState` for form state until a library is formally adopted |
| **No Redux, MobX, Zustand, or other state managers** | The project has committed to React Query + Context as the state management architecture |

### Anti-Patterns to Avoid

```js
// ❌ BAD: Server data in Context
const BoutiqueContext = createContext();
// ❌ BAD: Prop drilling through 5 levels
<A boutique={boutique}>
  <B boutique={boutique}>
    <C boutique={boutique}>...</C>
  </B>
</A>
// ❌ BAD: Custom hook calling setState in a non-React context
```

---

## 8. Performance Conventions

### Memoization

```js
// React.memo on pure display components
export const BoutiqueCard = React.memo(function BoutiqueCard({ boutique, onEdit }) {
  return (
    <div className="boutique-card">
      <h3>{boutique.name}</h3>
      <button onClick={() => onEdit(boutique.id)}>Edit</button>
    </div>
  );
});

// useMemo for expensive computations
const sortedBoutiques = useMemo(() => {
  return [...boutiques].sort((a, b) => a.name.localeCompare(b.name));
}, [boutiques]);

// useCallback for callback props passed to memoized children
const handleEdit = useCallback((id) => {
  navigate(`/boutiques/${id}/edit`);
}, [navigate]);
```

### Lazy Loading

```js
// All feature pages must be lazy-loaded
const Boutiques = lazy(() => import('@features/boutiques/pages/Boutiques'));
const Customers = lazy(() => import('@features/customers/pages/Customers'));

// Heavy third-party components must be lazy-loaded
const MonacoEditor = lazy(() => import('@monaco-editor/react'));
```

### Inline Functions

```js
// ❌ BAD: Inline function in render creates a new reference every render
<Button onClick={() => handleDelete(id)} />

// ✅ GOOD: Stable callback reference
<Button onClick={handleDelete} />
```

### Performance Checklist

| Practice | Applies To |
|---|---|
| `React.memo` | Pure display components with stable props |
| `useMemo` | Expensive derivations, object/array props passed to memoized children |
| `useCallback` | Callback props passed to `React.memo` children |
| Lazy loading (`React.lazy` + `Suspense`) | All feature pages, all heavy third-party components |
| Stable references (no inline functions/objects in render) | All event handlers and complex props |
| Image lazy loading (`loading="lazy"`) | All `<img>` tags below the fold |
| Virtual list for long lists | Any list exceeding 100 items |
| Debounced search inputs | Any input triggering API calls |

---

## Enforcement

1. **CI Pipeline** — ESLint rules are enforced in CI. A PR with ESLint errors will be blocked from merging.
2. **Code Reviews** — All PRs must be reviewed against these standards. Violations must be addressed before approval.
3. **Gradual Adoption** — When touching a legacy file, refactor it to meet these standards. Do not leave it partially compliant.
4. **Exceptions** — Any exception to these standards must be documented in the PR description with a clear rationale. Exceptions are temporary and require a follow-up ticket.

---

## Appendix A: Quick Reference

```bash
# Run ESLint
npm run lint

# Auto-fix what ESLint can fix
npm run lint -- --fix

# Check file line count
npm run lines:check
```
