# VS Boutique ERP — Enterprise Component Architecture Guidelines

> **Version:** 1.0.0  
> **Scope:** Frontend application (React + Tailwind CSS)  
> **Audience:** All frontend engineers contributing to the VS Boutique ERP ecosystem

---

## Section 1: Component Hierarchy

The component architecture is organized into 5 distinct levels, each with increasing specificity and decreasing reusability. Every component lives in exactly one level. No component spans multiple levels.

### Level 1: Core UI Primitives

**Location:** `core/components/ui/`

These are the atomic building blocks of the design system. They have zero business logic, zero API calls, and zero application knowledge.

**Components:**

| Category | Components |
|----------|-----------|
| Inputs | `Button`, `Input`, `Select`, `Checkbox`, `Radio`, `Switch`, `Textarea` |
| Surfaces | `Modal`, `Drawer`, `BottomSheet`, `Accordion`, `Tabs`, `Stepper` |
| Data Display | `Badge`, `Chip`, `Avatar`, `Tooltip`, `Toast`, `Card`, `Timeline`, `PremiumImage` |
| Actions | `IconButton`, `FAB`, `SearchInput` |
| Feedback | `Skeleton`, `LoadingOverlay`, `EmptyState`, `ErrorState` |

**Characteristics:**

- No business logic whatsoever
- No API calls — never
- Fully themeable via Tailwind classes and CSS custom properties
- Accessible — all components meet WCAG 2.1 AA standards
- Keyboard-navigable, screen-reader-friendly
- Accept `className` for extension via `cn()` utility
- All styling decisions are localized to the component

### Level 2: Layout Components

**Location:** `core/components/layout/`

These components define structure and spatial relationships. They never apply visual styling like colors, typography, or spacing beyond what is structurally necessary.

**Components:**

| Component | Purpose |
|-----------|---------|
| `Container` | Max-width wrapper, centers content horizontally |
| `Grid` | Responsive CSS grid abstraction |
| `Stack` | Flex-based vertical/horizontal stack with consistent gap |
| `Section` | Themed section wrapper with optional heading |
| `PageHeader` | Title + breadcrumbs + actions bar |
| `PageFooter` | Page-level footer with metadata |

**Characteristics:**

- Structure only — no colors, no decorative styling
- Fully responsive out of the box
- Composable — layouts nest inside layouts freely
- Never import from feature modules

### Level 3: Navigation Components

**Location:** `core/components/navigation/`

These handle application-wide navigation and routing concerns. They are portal-aware (multi-tenant: customer vs. owner vs. admin) and authentication-aware.

**Components:**

| Component | Purpose |
|-----------|---------|
| `Sidebar` | Persistent side navigation, collapsible |
| `Navbar` | Top navigation bar, responsive |
| `MegaMenu` | Dropdown mega-menu for desktop navigation |
| `MobileNavSheet` | Slide-in navigation for mobile viewports |

**Characteristics:**

- Portal-aware — render different nav items depending on the portal context
- Auth-aware — show/hide items based on user roles and permissions
- Responsive — adapt layout between mobile and desktop
- Use React Router's `<NavLink />` for active-state management

### Level 4: Feedback & Animation Components

**Location:** `core/components/feedback/` and `core/components/animations/`

These provide visual feedback to user actions and smooth transitions between states/views.

**Feedback Components:**

- `Toast` — stacked notification toasts (success, error, info, warning)
- `ErrorState` — full-page or inline error display with retry action
- `EmptyState` — empty data state with illustration and CTA
- `LoadingOverlay` — full-area loading spinner with optional message

**Animation Components:**

- `FadeIn` — fade-in on mount
- `SlideUp` — slide-up entrance
- `SlideInLeft` / `SlideInRight` — slide-in from edges
- `RouteTransition` — page-level route transition wrapper
- `ScaleIn` — scale entrance animation
- `StaggerChildren` — stagger animation for list children
- `Collapse` — expand/collapse with smooth height transition

**Characteristics:**

- Reusable across all portals and features
- Configurable duration, easing, and delay via props
- Composable — animations wrap other components
- Respect `prefers-reduced-motion` at the system level

### Level 5: Feature Components

**Location:** `features/{feature-name}/pages/{page-name}/components/`

These are the most specific components. They implement business logic, call APIs, and compose lower-level components into meaningful user interfaces.

**Examples:**

| Component | Location |
|-----------|----------|
| `BoutiqueTable` | `features/boutiques/pages/list/components/BoutiqueTable.jsx` |
| `BoutiqueForm` | `features/boutiques/pages/create/components/BoutiqueForm.jsx` |
| `ProductCard` | `features/commerce/pages/products/components/ProductCard.jsx` |
| `ReviewCard` | `features/commerce/pages/reviews/components/ReviewCard.jsx` |
| `CustomerLayout` | `features/customer/components/CustomerLayout.jsx` |
| `OwnerLayout` | `features/owner/components/OwnerLayout.jsx` |

**Characteristics:**

- Business-logic-specific — fully aware of domain models and API contracts
- Import only from `core/` — never import from another feature module
- Compose Level 1–4 components into feature-specific UIs
- Handle all data-fetching, loading, empty, and error states internally

---

## Section 2: Component Design Rules

These rules apply to **all** components at every level.

### Rule 1: One Component Per File

Every component gets its own file. The only exception is tiny utility components under 15 lines that are closely related (e.g., `Label.jsx` being co-located with `Input.jsx` is acceptable, but discouraged).

```
✅ Good:  ui/Button.jsx, ui/Input.jsx
❌ Bad:   ui/FormElements.jsx (contains Button, Input, Select)
```

### Rule 2: Named Exports for Components, Default Export for Pages

- **Components** (all levels 1–4): use named exports
- **Pages** (level 5, files directly under `pages/`): use default exports (for React Router lazy-loading compatibility)

```jsx
// Component — named export
export function Button({ ... }) { ... }

// Page — default export
export default function BoutiqueListPage() { ... }
```

### Rule 3: Props Interface Documented via JSDoc

Every component must have a JSDoc block above the function declaration that documents all props.

```jsx
/**
 * @param {object} props
 * @param {'sm'|'md'|'lg'} props.size - The size variant
 * @param {boolean} [props.disabled=false] - Whether the element is disabled
 * @param {React.ReactNode} props.children - Content to render
 */
export function Badge({ size = 'md', disabled, children }) { ... }
```

### Rule 4: No Inline Styles

All styling must use Tailwind utility classes. Inline `style={{}}` is forbidden unless dynamically computing a value that cannot be expressed in Tailwind (e.g., a progress bar width based on a percentage prop).

```jsx
// ✅ Correct
<div className="flex items-center gap-2 p-4 bg-white rounded-lg">

// ❌ Wrong
<div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px' }}>
```

### Rule 5: No Business Logic in UI Primitives

Level 1 components must never contain:
- API calls
- Data transformations
- Authentication checks
- Routing logic
- Feature-specific conditionals

If a UI primitive needs to vary behavior based on application state, it should accept callbacks and configurations via props.

### Rule 6: All State Lifting via Props or Context

Level 1–4 components must never directly call APIs or access global stores. Data flows down via props. Cross-cutting concerns (auth, theme, portal) flow down via React Context.

```
✅ Correct:  <Button onClick={handleSave}>Save</Button>
❌ Wrong:   <Button onClick={() => api.save(data)}>Save</Button>
```

### Rule 7: React.memo on Expensive Renders

Wrap components that render frequently or have complex subtree renders with `React.memo`. This is especially important for list item components, table rows, and animation-wrapped components.

```jsx
export const ProductCard = React.memo(function ProductCard({ product }) {
  return (/* ... */);
});
```

### Rule 8: useMemo and useCallback for Performance

- Use `useMemo` for computed values derived from props or state
- Use `useCallback` for event handlers passed as props to child components
- Do not over-optimize — apply these only when profiling shows a bottleneck or when passing callbacks to `React.memo`-wrapped children

```jsx
const sortedProducts = useMemo(
  () => [...products].sort((a, b) => a.name.localeCompare(b.name)),
  [products]
);

const handleDelete = useCallback(
  (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
  []
);
```

---

## Section 3: Naming Conventions

### Components

- **PascalCase** — file name matches component name exactly
- Examples: `Button.jsx`, `ProductCard.jsx`, `BoutiqueTable.jsx`

### Hooks

- **camelCase** — prefixed with `use`
- Examples: `useDebounce.js`, `useAuth.js`, `usePagination.js`, `useMediaQuery.js`

### Utilities

- **camelCase** — plain functions, not React-specific
- Examples: `formatters.js`, `validators.js`, `cn.js`, `constants.js`

### Folders

- **kebab-case** — all lowercase, hyphen-separated
- Examples: `bottom-sheet/`, `empty-states/`, `loading-overlay/`

### Full Reference Table

| Artifact | Convention | Example |
|----------|-----------|---------|
| Component file | `PascalCase.jsx` | `Button.jsx` |
| Hook file | `camelCase.js` | `useDebounce.js` |
| Utility file | `camelCase.js` | `formatters.js` |
| Folder | `kebab-case/` | `bottom-sheet/` |
| Style file | `camelCase.css` | `button.css` |
| Test file | `<name>.test.jsx` | `Button.test.jsx` |

---

## Section 4: Component Templates

### UI Primitive Template (Level 1)

```jsx
import { cn } from '@core/utils';

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

const variantStyles = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

/**
 * @param {object} props
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {'primary'|'secondary'|'danger'} [props.variant='primary']
 * @param {boolean} [props.disabled=false]
 * @param {React.ReactNode} props.children
 * @param {string} [props.className]
 */
export function Button({
  size = 'md',
  variant = 'primary',
  disabled = false,
  children,
  className,
  ...props
}) {
  return (
    <button
      className={cn(
        'rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500',
        sizeStyles[size],
        variantStyles[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
```

### Layout Component Template (Level 2)

```jsx
import { cn } from '@core/utils';

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {'sm'|'md'|'lg'|'xl'} [props.maxWidth='lg']
 * @param {string} [props.className]
 */
export function Container({ children, maxWidth = 'lg', className }) {
  const maxWidthStyles = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    xl: 'max-w-screen-2xl',
  };

  return (
    <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', maxWidthStyles[maxWidth], className)}>
      {children}
    </div>
  );
}
```

### Navigation Component Template (Level 3)

```jsx
import { NavLink } from 'react-router-dom';
import { cn } from '@core/utils';
import { useAuth } from '@core/hooks/useAuth';
import { usePortal } from '@core/hooks/usePortal';

/**
 * @param {object} props
 * @param {Array<{label: string, to: string, roles?: string[]}>} props.items
 * @param {string} [props.className]
 */
export function Sidebar({ items, className }) {
  const { user } = useAuth();
  const { portal } = usePortal();

  const visibleItems = items.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  return (
    <aside className={cn('w-64 bg-gray-900 text-white h-full flex flex-col', className)}>
      <div className="p-4 text-lg font-bold border-b border-gray-700">
        {portal === 'owner' ? 'Owner Portal' : 'VS Boutique'}
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'block px-4 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
```

### Feedback Component Template (Level 4)

```jsx
import { cn } from '@core/utils';

/**
 * @param {object} props
 * @param {'info'|'success'|'warning'|'error'} [props.type='info']
 * @param {string} props.message
 * @param {string} [props.className]
 */
export function Toast({ type = 'info', message, className }) {
  const typeStyles = {
    info: 'bg-blue-50 border-blue-500 text-blue-800',
    success: 'bg-green-50 border-green-500 text-green-800',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
    error: 'bg-red-50 border-red-500 text-red-800',
  };

  return (
    <div
      className={cn(
        'border-l-4 p-4 rounded-r-lg shadow-lg',
        typeStyles[type],
        className
      )}
      role="alert"
    >
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
```

### Feature Component Template (Level 5)

```jsx
import { useQuery } from '@tanstack/react-query';
import { Button, Card, EmptyState, ErrorState, LoadingOverlay } from '@core/components';
import { getBoutiques } from '@core/services/api/boutique.api';

/**
 * Displays a paginated table of boutiques with actions.
 * Used in the Boutique List page.
 */
export function BoutiqueTable() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['boutiques'],
    queryFn: getBoutiques,
  });

  if (isLoading) return <LoadingOverlay />;
  if (error) return <ErrorState message={error.message} />;
  if (!data?.length) return <EmptyState title="No boutiques found" />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-3">Name</th>
            <th className="text-left p-3">Status</th>
            <th className="text-left p-3">Owner</th>
            <th className="text-right p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((boutique) => (
            <tr key={boutique.id} className="border-t hover:bg-gray-50">
              <td className="p-3 font-medium">{boutique.name}</td>
              <td className="p-3">
                <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  {boutique.status}
                </span>
              </td>
              <td className="p-3">{boutique.ownerName}</td>
              <td className="p-3 text-right">
                <Button size="sm" variant="secondary">Edit</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Page Template

```jsx
import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, PageHeader, LoadingOverlay } from '@core/components';
import { FadeIn } from '@core/components/animations';
import { getDashboardMetrics } from '@core/services/api/dashboard.api';

export default function CommandCenter() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: getDashboardMetrics,
  });

  if (isLoading) return <LoadingOverlay />;

  return (
    <FadeIn>
      <PageHeader title="Command Center" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <Card title="Total Boutiques">
          <p className="text-3xl font-bold">{data?.totalBoutiques}</p>
        </Card>
        <Card title="Active Orders">
          <p className="text-3xl font-bold">{data?.activeOrders}</p>
        </Card>
        <Card title="Revenue (MTD)">
          <p className="text-3xl font-bold">${data?.revenueMTD?.toLocaleString()}</p>
        </Card>
      </div>
    </FadeIn>
  );
}
```

---

## Section 5: Barrel Export Structure

Every component folder **must** have an `index.js` file that re-exports all components in that folder. This enables clean imports:

```jsx
// Clean — imports from barrel
import { Button, Card, Modal } from '@core/components/ui';

// Messy — imports from individual files
import { Button } from '@core/components/ui/Button';
import { Card } from '@core/components/ui/Card';
```

### Barrel File Structure

```
core/
  components/
    ui/
      index.js           → exports all 28 UI primitives (Button, Input, Select, ...)
    layout/
      index.js           → exports Container, Grid, Stack, Section, PageHeader, PageFooter
    navigation/
      index.js           → exports Sidebar, Navbar, MegaMenu, MobileNavSheet
    feedback/
      index.js           → exports Toast, ErrorState, EmptyState, LoadingOverlay
    animations/
      index.js           → exports FadeIn, SlideUp, RouteTransition, etc.
    shared/
      index.js           → exports cross-portal shared components
    index.js             → re-exports everything from ui/, layout/, navigation/, feedback/, animations/, shared/
```

### Example Barrel File

```jsx
// core/components/ui/index.js
export { Button } from './Button';
export { Input } from './Input';
export { Select } from './Select';
export { Checkbox } from './Checkbox';
export { Radio } from './Radio';
export { Switch } from './Switch';
export { Textarea } from './Textarea';
export { Modal } from './Modal';
export { Drawer } from './Drawer';
export { BottomSheet } from './BottomSheet';
export { Badge } from './Badge';
export { Chip } from './Chip';
export { Avatar } from './Avatar';
export { Tooltip } from './Tooltip';
export { Toast } from './Toast';
export { Card } from './Card';
export { Timeline } from './Timeline';
export { PremiumImage } from './PremiumImage';
export { IconButton } from './IconButton';
export { FAB } from './FAB';
export { SearchInput } from './SearchInput';
export { Skeleton } from './Skeleton';
export { LoadingOverlay } from './LoadingOverlay';
export { EmptyState } from './EmptyState';
export { ErrorState } from './ErrorState';
export { Tabs } from './Tabs';
export { Stepper } from './Stepper';
export { Accordion } from './Accordion';
```

```jsx
// core/components/index.js
export * from './ui';
export * from './layout';
export * from './navigation';
export * from './feedback';
export * from './animations';
export * from './shared';
```

---

## Section 6: Migration Patterns

The following files have been identified as duplicates or misplaced components. Use this table to resolve each conflict.

### File Resolution Table

| Current Location | Resolution | Reason |
|-----------------|-----------|--------|
| `src/components/Card.jsx` | **DELETE** → use `core/components/ui/Card.jsx` | Duplicate; UI primitive already exists |
| `src/components/Skeleton.jsx` | **DELETE** → use `core/components/ui/Skeleton.jsx` | Duplicate; UI primitive already exists |
| `src/components/ProductCard.jsx` | **DELETE** → use `features/commerce/components/ProductCard.jsx` | Belongs in commerce feature, not root |
| `src/components/CustomerLayout.jsx` | **MOVE** → `features/customer/components/CustomerLayout.jsx` | Customer-portal-specific layout |
| `src/components/OwnerLayout.jsx` | **MOVE** → `features/owner/components/OwnerLayout.jsx` | Owner-portal-specific layout |
| `src/App.jsx` inline AdminLayout | **EXTRACT** → `app/layouts/AdminLayout.jsx` | Inline component too large; deserves own file |

### Migration Steps for Each File

1. **Card.jsx (root)**
   - Remove `src/components/Card.jsx`
   - Update all imports from `'@/components/Card'` to `'@core/components/ui/Card'` (or use the barrel import)
   - Verify `core/components/ui/Card.jsx` supports all props used by consuming components

2. **Skeleton.jsx (root)**
   - Remove `src/components/Skeleton.jsx`
   - Update imports to `'@core/components/ui/Skeleton'`
   - Verify the core Skeleton accepts `width`, `height`, `rounded` props for all existing use cases

3. **ProductCard.jsx (root)**
   - Remove `src/components/ProductCard.jsx`
   - Create `features/commerce/components/ProductCard.jsx` with same implementation
   - Update all imports across the codebase

4. **CustomerLayout.jsx**
   - Move file to `features/customer/components/CustomerLayout.jsx`
   - Update relative import paths within the file
   - Update all external import paths

5. **OwnerLayout.jsx**
   - Move file to `features/owner/components/OwnerLayout.jsx`
   - Update relative import paths within the file
   - Update all external import paths

6. **AdminLayout (App.jsx)**
   - Extract the AdminLayout component definition into `app/layouts/AdminLayout.jsx`
   - Export it as a named export
   - Import it back into `App.jsx`
   - Remove the inline definition

### Import Path Convention After Migration

| Scope | Import Path |
|-------|------------|
| Core UI primitives | `@core/components/ui/Button` or `@core/components` |
| Core layouts | `@core/components/layout/Container` |
| Core navigation | `@core/components/navigation/Sidebar` |
| Hooks | `@core/hooks/useAuth` |
| API services | `@core/services/api/boutique.api` |
| Feature components | `@features/boutiques/components/BoutiqueTable` |
| Feature pages | `@features/boutiques/pages/BoutiqueListPage` |

---

## Appendix: Quick Reference

### Directory Tree (Expected Final State)

```
src/
  app/
    layouts/
      AdminLayout.jsx
      App.jsx
  core/
    components/
      ui/
        Button.jsx, Input.jsx, ..., index.js
      layout/
        Container.jsx, Grid.jsx, ..., index.js
      navigation/
        Sidebar.jsx, Navbar.jsx, ..., index.js
      feedback/
        Toast.jsx, ErrorState.jsx, ..., index.js
      animations/
        FadeIn.jsx, SlideUp.jsx, ..., index.js
      shared/
        index.js
      index.js
    hooks/
      useAuth.js, useDebounce.js, ...
    services/
      api/
        boutique.api.js, product.api.js, ...
  features/
    customer/
      components/
        CustomerLayout.jsx
      pages/
        ...
    owner/
      components/
        OwnerLayout.jsx
      pages/
        ...
    boutiques/
      components/
        BoutiqueTable.jsx
        BoutiqueForm.jsx
      pages/
        list/
          components/
            ...
          index.jsx
        create/
          ...
    commerce/
      components/
        ProductCard.jsx
        ReviewCard.jsx
      pages/
        ...
```

### Enforcement

- All PRs must conform to these guidelines
- Components at the wrong level will be rejected in code review
- New UI primitives must be proposed and approved before implementation
- Barrel files must be kept in sync with component files (automated check recommended)
