# VS Boutique ERP — Import Migration Mapping

> **Purpose:** Definitive reference for how EVERY import pattern in the current codebase transforms under the new feature-first folder structure.
>
> **Target Architecture:** `web/src/` → `app/`, `core/`, `features/`, `assets/`, `config/`, `types/`, `locales/`, `tests/`

---

## Section 1: Vite Path Aliases

Add to `web/vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, 'src/app'),
      '@core': path.resolve(__dirname, 'src/core'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@config': path.resolve(__dirname, 'src/config'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@locales': path.resolve(__dirname, 'src/locales'),
      '@tests': path.resolve(__dirname, 'src/tests'),
    }
  }
})
```

These aliases are used in every AFTER import below. All relative imports (`../`, `./`) are replaced with absolute alias-based imports.

---

## Section 2: Core Barrel Exports

Every `core/` subdirectory exposes an `index.js` barrel that re-exports all public members. Consumers import from the barrel, never from individual files.

### `core/components/index.js`

```js
// ── UI Primitives ──
export { default as Button } from './ui/Button'
export { default as Input } from './ui/Input'
export { default as Modal } from './ui/Modal'
export { default as Select } from './ui/Select'
export { default as Textarea } from './ui/Textarea'
export { default as Checkbox } from './ui/Checkbox'
export { default as Radio } from './ui/Radio'
export { default as Switch } from './ui/Switch'
export { default as Badge } from './ui/Badge'
export { default as Avatar } from './ui/Avatar'
export { default as Card } from './ui/Card'
export { default as Drawer } from './ui/Drawer'
export { default as Tooltip } from './ui/Tooltip'
export { default as Tabs } from './ui/Tabs'
export { default as Accordion } from './ui/Accordion'
export { default as Chip } from './ui/Chip'
export { default as IconButton } from './ui/IconButton'
export { default as FAB } from './ui/FAB'
export { default as PremiumImage } from './ui/PremiumImage'
export { default as SearchInput } from './ui/SearchInput'
export { default as Stepper } from './ui/Stepper'
export { default as Timeline } from './ui/Timeline'
export { default as BottomSheet } from './ui/BottomSheet'
export { default as LoadingOverlay } from './ui/LoadingOverlay'

// ── Layout ──
export { default as Container } from './layout/Container'
export { default as Grid } from './layout/Grid'
export { default as Stack } from './layout/Stack'
export { default as Section } from './layout/Section'
export { default as PageHeader } from './layout/PageHeader'
export { default as PageFooter } from './layout/PageFooter'
export { CustomerLayout } from './layout/CustomerLayout'
export { OwnerLayout } from './layout/OwnerLayout'

// ── Navigation ──
export { default as Sidebar } from './navigation/Sidebar'
export { default as Navbar } from './navigation/Navbar'
export { default as MegaMenu } from './navigation/MegaMenu'
export { default as MobileNavSheet } from './navigation/MobileNavSheet'
export { default as NavLinkItem } from './navigation/NavLinkItem'

// ── Feedback ──
export { default as Toast } from './feedback/Toast'
export { default as ErrorState } from './feedback/ErrorState'
export { default as EmptyState } from './feedback/EmptyState'
export { default as Skeleton } from './feedback/Skeleton'
export { default as LoadingOverlay as FeedbackLoadingOverlay } from './feedback/LoadingOverlay'

// ── Animations ──
export { default as FadeIn } from './animations/FadeIn'
export { default as SlideUp } from './animations/SlideUp'
export { default as SlideInLeft } from './animations/SlideInLeft'
export { default as SlideInRight } from './animations/SlideInRight'
export { default as ScaleIn } from './animations/ScaleIn'
export { default as RouteTransition } from './animations/RouteTransition'
export { default as StaggerChildren } from './animations/StaggerChildren'
export { default as AnimatedCounter } from './animations/AnimatedCounter'

// ── Commerce ──
export { default as ProductCard } from './commerce/ProductCard'
export { default as BoutiqueCard } from './commerce/BoutiqueCard'
export { default as CollectionCard } from './commerce/CollectionCard'
export { default as ServiceCard } from './commerce/ServiceCard'
export { default as ReviewCard } from './commerce/ReviewCard'
export { default as PriceComponent } from './commerce/PriceComponent'
export { default as RatingComponent } from './commerce/RatingComponent'
export { default as DiscountBadge } from './commerce/DiscountBadge'
export { default as DeliveryBadge } from './commerce/DeliveryBadge'
export { default as AvailabilityBadge } from './commerce/AvailabilityBadge'
export { default as StatusBadge } from './commerce/StatusBadge'
export { default as TimelineCard } from './commerce/TimelineCard'

// ── Modals ──
export { default as AddressFormModal } from './modals/AddressFormModal'
export { default as BoutiqueEditModal } from './modals/BoutiqueEditModal'
export { default as DeleteConfirm } from './modals/DeleteConfirm'
export { default as EditModal } from './modals/EditModal'
export { default as ExchangeRequestModal } from './modals/ExchangeRequestModal'
export { default as ReturnRequestModal } from './modals/ReturnRequestModal'
export { default as ReviewModal } from './modals/ReviewModal'
export { default as OtpModal } from './modals/OtpModal'

// ── Shared ──
export { default as LegalPage } from './shared/LegalPage'
export { default as AppPreviewMockup } from './shared/AppPreviewMockup'
```

### `core/hooks/index.js`

```js
export { useDebounce } from './useDebounce'
export { useApi } from './useApi'
export { usePagination } from './usePagination'
export { useModal } from './useModal'
export { useToast } from './useToast'
export { usePermissions } from './usePermissions'
export { useCurrentUser } from './useCurrentUser'
export { useSearch } from './useSearch'
export { useFilter } from './useFilter'
export { useNotifications } from './useNotifications'
export { useInfiniteScroll } from './useInfiniteScroll'
export { useUpload } from './useUpload'
```

### `core/services/index.js`

```js
export { default as api } from './api.client'
export { default as customerApi } from './api.client'  // same instance factory, different interceptor
export { default as imageConfig } from './imageConfig'
export { IMAGES, resolveProductImage, resolveServiceImage, getUnsplashSrcSet } from './imageConfig'

// Domain API modules
export * from './api/auth.api'
export * from './api/boutique.api'
export * from './api/order.api'
export * from './api/product.api'
export * from './api/cart.api'
export * from './api/checkout.api'
export * from './api/payment.api'
export * from './api/review.api'
export * from './api/coupon.api'
export * from './api/notification.api'
export * from './api/analytics.api'
export * from './api/ticket.api'
export * from './api/subscription.api'
export * from './api/upload.api'
export * from './api/inventory.api'
export * from './api/delivery.api'
export * from './api/admin.api'
export * from './api/owner.api'
export * from './api/customer.api'
```

### `core/contexts/index.js`

```js
export { AuthProvider, AuthContext } from './AuthContext'
export { CustomerAuthProvider, useCustomerAuth } from './CustomerAuthContext'
export { CartProvider, useCart } from './CartContext'
export { WishlistProvider, useWishlist } from './WishlistContext'
export { AddressProvider, useAddress } from './AddressContext'
export { ReviewProvider, useReview } from './ReviewContext'
export { ReturnsProvider, useReturns } from './ReturnsContext'
export { NotificationProvider, useNotifications } from './NotificationContext'
export { AdminNotificationProvider, useAdminNotifications } from './AdminNotificationContext'
```

### `core/utils/index.js`

```js
export * from './formatters/currency'
export * from './formatters/date'
export * from './formatters/phone'
export * from './validators/email'
export * from './validators/phone'
export * from './validators/otp'
export * from './validators/password'
export * from './validators/pincode'
export * from './calculators/price'
export * from './calculators/discount'
export * from './calculators/subscription'
export * from './storage/local'
export * from './storage/secure'
export * from './security/token'
export * from './security/sanitize'
export * from './helpers/cn'
export * from './helpers/sleep'
export * from './helpers/formatError'
export * from './helpers/truncate'
```

### `core/constants/index.js`

```js
export { ROLES } from './roles'
export { STATUS } from './status'
export { ROUTES } from './routes'
export { ENUMS } from './enums'
```

### `core/config/index.js`

```js
export { APP_CONFIG } from './app.config'
export { API_CONFIG } from './api.config'
export { THEME_CONFIG } from './theme.config'
```

### `core/permissions/index.js`

```js
export { hasPermission, PERMISSION_MATRIX } from './permissions'
```

---

## Section 3: Import Migration Examples

All BEFORE/AFTER pairs below represent real patterns found in the codebase.

### 3.1 Barrel Component Imports

| Pattern | BEFORE | AFTER |
|---------|--------|-------|
| Default import (UI) | `import Button from '../components/ui/Button'` | `import { Button } from '@core/components'` |
| Named import (UI) | `import { Button, Input } from '../components/ui/Button'` — *(invalid, but pattern seen as multiple lines)* | `import { Button, Input } from '@core/components'` |
| IconButton | `import IconButton from '../components/ui/IconButton'` | `import { IconButton } from '@core/components'` |
| PremiumImage | `import PremiumImage from '../components/ui/PremiumImage'` | `import { PremiumImage } from '@core/components'` |
| Card (ui/Card) | `import Card from '../components/ui/Card'` | `import { Card } from '@core/components'` |
| Chip | `import Chip from '../components/ui/Chip'` | `import { Chip } from '@core/components'` |
| SearchInput | `import SearchInput from '../components/ui/SearchInput'` | `import { SearchInput } from '@core/components'` |
| BottomSheet | `import BottomSheet from '../components/ui/BottomSheet'` | `import { BottomSheet } from '@core/components'` |
| EmptyState | `import EmptyState from '../components/ui/EmptyState'` | `import { EmptyState } from '@core/components'` |
| ErrorState | `import ErrorState from '../components/ui/ErrorState'` | `import { ErrorState } from '@core/components'` |
| Skeleton (ui/Skeleton) | `import Skeleton from '../components/ui/Skeleton'` | `import { Skeleton } from '@core/components'` |
| FAB | `import FAB from '../components/ui/FAB'` | `import { FAB } from '@core/components'` |
| LoadingOverlay | `import LoadingOverlay from '../components/ui/LoadingOverlay'` | `import { LoadingOverlay } from '@core/components'` |

### 3.2 Commerce Component Imports

| Pattern | BEFORE | AFTER |
|---------|--------|-------|
| ProductCard | `import ProductCard from '../components/commerce/ProductCard'` | `import { ProductCard } from '@core/components'` |
| BoutiqueCard | `import BoutiqueCard from '../components/commerce/BoutiqueCard'` | `import { BoutiqueCard } from '@core/components'` |
| CollectionCard | `import CollectionCard from '../components/commerce/CollectionCard'` | `import { CollectionCard } from '@core/components'` |
| ServiceCard | `import ServiceCard from '../components/commerce/ServiceCard'` | `import { ServiceCard } from '@core/components'` |
| ReviewCard | `import ReviewCard from '../components/commerce/ReviewCard'` | `import { ReviewCard } from '@core/components'` |
| PriceComponent | `import PriceComponent from '../components/commerce/PriceComponent'` | `import { PriceComponent } from '@core/components'` |
| RatingComponent | `import RatingComponent from '../components/commerce/RatingComponent'` | `import { RatingComponent } from '@core/components'` |
| DiscountBadge | `import DiscountBadge from '../components/commerce/DiscountBadge'` | `import { DiscountBadge } from '@core/components'` |
| DeliveryBadge | `import DeliveryBadge from '../components/commerce/DeliveryBadge'` | `import { DeliveryBadge } from '@core/components'` |
| AvailabilityBadge | `import AvailabilityBadge from '../components/commerce/AvailabilityBadge'` | `import { AvailabilityBadge } from '@core/components'` |
| StatusBadge | `import StatusBadge from '../components/commerce/StatusBadge'` | `import { StatusBadge } from '@core/components'` |
| TimelineCard | `import TimelineCard from '../components/commerce/TimelineCard'` | `import { TimelineCard } from '@core/components'` |

### 3.3 Navigation / Layout Component Imports

| Pattern | BEFORE | AFTER |
|---------|--------|-------|
| Sidebar | `import Sidebar from '../components/Sidebar'` | `import { Sidebar } from '@core/components'` |
| Navbar | `import Navbar from '../components/Navbar'` | `import { Navbar } from '@core/components'` |
| MegaMenu | `import MegaMenu from '../components/MegaMenu'` | `import { MegaMenu } from '@core/components'` |
| MobileNavSheet | `import MobileNavSheet from '../components/MobileNavSheet'` | `import { MobileNavSheet } from '@core/components'` |
| CustomerLayout | `import CustomerLayout from '../components/CustomerLayout'` | `import { CustomerLayout } from '@core/components'` |
| OwnerLayout | `import OwnerLayout from '../components/OwnerLayout'` | `import { OwnerLayout } from '@core/components'` |

### 3.4 Context Imports

| Pattern | BEFORE | AFTER |
|---------|--------|-------|
| Named context import | `import { AuthContext } from '../context/AuthContext'` | `import { AuthContext } from '@core/contexts'` |
| Named provider + context | `import { AuthProvider, AuthContext } from '../context/AuthContext'` | `import { AuthProvider, AuthContext } from '@core/contexts'` |
| Hook-based context | `import { useCart } from '../context/CartContext'` | `import { useCart } from '@core/contexts'` |
| Mixed (useContext inline) | `import React, { useContext } from 'react'` + `import { AuthContext } from '../context/AuthContext'` | `import { AuthContext } from '@core/contexts'` + `const { user } = useContext(AuthContext)` |
| Provider stack | `import { AuthProvider } from '../context/AuthContext'` + `import { CartProvider } from '../context/CartContext'` | `import { AuthProvider, CartProvider } from '@core/contexts'` |
| Customer auth hook | `import { useCustomerAuth } from '../context/CustomerAuthContext'` | `import { useCustomerAuth } from '@core/contexts'` |
| Wishlist hook | `import { useWishlist } from '../context/WishlistContext'` | `import { useWishlist } from '@core/contexts'` |

### 3.5 Hook Imports

| Pattern | BEFORE | AFTER |
|---------|--------|-------|
| Default export hook | `import useDebounce from '../hooks/useDebounce'` | `import { useDebounce } from '@core/hooks'` |
| Named export hook | `import { useApi } from '../hooks/useApi'` | `import { useApi } from '@core/hooks'` |

### 3.6 API / Service Imports

| Pattern | BEFORE | AFTER |
|---------|--------|-------|
| Default API client | `import api from '../services/api'` | `import { api } from '@core/services'` |
| Named function export | `import { getBoutiques } from '../services/api'` | `import { getBoutiques } from '@core/services/api/boutique.api'` |
| Multiple named exports | `import { getBoutiques, getOrders } from '../services/api'` | `import { getBoutiques } from '@core/services/api/boutique.api'` + `import { getOrders } from '@core/services/api/order.api'` |
| api + named exports mixed | `import api, { getAdminCommandCenter } from '../services/api'` | `import { api } from '@core/services'` + `import { getAdminCommandCenter } from '@core/services/api/admin.api'` |
| Image config (named) | `import { IMAGES, resolveProductImage } from '../services/imageConfig'` | `import { IMAGES, resolveProductImage } from '@core/services'` |
| Image config (default) | `import { IMAGES } from '../services/imageConfig'` | `import { IMAGES } from '@core/services'` |

### 3.7 Third-Party Library Imports

These remain unchanged since they are external dependencies. Listed here for completeness.

| Library | Import | Status |
|---------|--------|--------|
| React | `import React from 'react'` | No change |
| React hooks | `import { useState, useEffect } from 'react'` | No change |
| React Router | `import { useNavigate } from 'react-router-dom'` | No change |
| React Router DOM | `import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'` | No change |
| TanStack React Query | `import { useQuery } from '@tanstack/react-query'` | No change |
| Framer Motion | `import { motion } from 'framer-motion'` | No change |
| Lucide React | `import { Loader2 } from 'lucide-react'` | No change |
| Multiple Lucide icons | `import { ShoppingBag, Users, Store } from 'lucide-react'` | No change |

### 3.8 Page Imports (in App.jsx / Route Files)

| Pattern | BEFORE | AFTER |
|---------|--------|-------|
| Eager page import | `import CustomerAddresses from './pages/CustomerAddresses'` | `import CustomerAddresses from '@features/customer/pages/Addresses'` |
| Lazy page import | `const AdminRevenue = lazy(() => import('./pages/AdminRevenue'))` | `const AdminRevenue = lazy(() => import('@features/admin/pages/Revenue'))` |
| Admin lazy page | `const Boutiques = lazy(() => import('./pages/Boutiques'))` | `const Boutiques = lazy(() => import('@features/admin/pages/Boutiques'))` |
| Owner lazy page | `const OwnerOrders = lazy(() => import('./pages/OwnerOrders'))` | `const OwnerOrders = lazy(() => import('@features/owner/pages/Orders'))` |
| Customer lazy page | `const CustomerShop = lazy(() => import('./pages/CustomerShop'))` | `const CustomerShop = lazy(() => import('@features/customer/pages/Shop'))` |
| Static page (legal) | `const CustomerPrivacy = lazy(() => import('./pages/CustomerPrivacy'))` | `const CustomerPrivacy = lazy(() => import('@features/customer/pages/Static/Privacy'))` |

Complete page mapping:

| Current Path | New Path (Alias) |
|-------------|-----------------|
| `./pages/Dashboard` | `@features/admin/pages/Dashboard` |
| `./pages/Boutiques` | `@features/admin/pages/Boutiques` |
| `./pages/BoutiqueDetails` | `@features/admin/pages/Boutiques/BoutiqueDetail` |
| `./pages/AdminOrders` | `@features/admin/pages/Orders` |
| `./pages/OrderDetails` | `@features/admin/pages/Orders/OrderDetail` |
| `./pages/AdminCommerceOrders` | `@features/admin/pages/CommerceOrders` |
| `./pages/AdminDeliveryTracking` | `@features/admin/pages/DeliveryTracking` |
| `./pages/Payments` | `@features/admin/pages/Payments` |
| `./pages/Customers` | `@features/admin/pages/Customers` |
| `./pages/Bookings` | `@features/admin/pages/Bookings` |
| `./pages/Reviews` | `@features/admin/pages/Reviews` |
| `./pages/MarketplaceInsights` | `@features/admin/pages/MarketplaceInsights` |
| `./pages/ActivityLogs` | `@features/admin/pages/ActivityLogs` |
| `./pages/Categories` | `@features/admin/pages/Categories` |
| `./pages/AdminPayouts` | `@features/admin/pages/Payouts` |
| `./pages/AdminSettings` | `@features/admin/pages/Settings` |
| `./pages/AdminTickets` | `@features/admin/pages/Tickets` |
| `./pages/AdminCoupons` | `@features/admin/pages/Coupons` |
| `./pages/AdminProductReviews` | `@features/admin/pages/ProductReviews` |
| `./pages/AdminNotifications` | `@features/admin/pages/Notifications` |
| `./pages/AdminSubscriptions` | `@features/admin/pages/Subscriptions` |
| `./pages/AdminRevenue` | `@features/admin/pages/Revenue` |
| `./pages/AdminFraud` | `@features/admin/pages/Fraud` |
| `./pages/AdminWishlists` | `@features/admin/pages/Wishlists` |
| `./pages/AdminCommandCenter` | `@features/admin/pages/CommandCenter` |
| `./pages/OwnerDashboard` | `@features/owner/pages/Dashboard` |
| `./pages/OwnerAnalytics` | `@features/owner/pages/Analytics` |
| `./pages/OwnerProfile` | `@features/owner/pages/Profile` |
| `./pages/OwnerDesigns` | `@features/owner/pages/Designs` |
| `./pages/OwnerProducts` | `@features/owner/pages/Products` |
| `./pages/OwnerServices` | `@features/owner/pages/Services` |
| `./pages/OwnerGallery` | `@features/owner/pages/Gallery` |
| `./pages/OwnerOrders` | `@features/owner/pages/Orders` |
| `./pages/OwnerBookings` | `@features/owner/pages/Bookings` |
| `./pages/OwnerReviews` | `@features/owner/pages/Reviews` |
| `./pages/OwnerPayouts` | `@features/owner/pages/Payouts` |
| `./pages/OwnerSubscription` | `@features/owner/pages/Subscriptions` |
| `./pages/OwnerTickets` | `@features/owner/pages/Tickets` |
| `./pages/OwnerDeliveryTracking` | `@features/owner/pages/DeliveryTracking` |
| `./pages/OwnerCoupons` | `@features/owner/pages/Coupons` |
| `./pages/OwnerProductReviews` | `@features/owner/pages/ProductReviews` |
| `./pages/OwnerSettings` | `@features/owner/pages/Settings` |
| `./pages/CustomerHome` | `@features/customer/pages/Home` |
| `./pages/CustomerShop` | `@features/customer/pages/Shop` |
| `./pages/CustomerProductDetail` | `@features/customer/pages/Shop/ProductDetail` |
| `./pages/CustomerCart` | `@features/customer/pages/Cart` |
| `./pages/CustomerCheckout` | `@features/customer/pages/Checkout` |
| `./pages/CustomerOrders` | `@features/customer/pages/Orders` |
| `./pages/CustomerOrderDetail` | `@features/customer/pages/Orders/OrderDetail` |
| `./pages/CustomerWishlist` | `@features/customer/pages/Wishlist` |
| `./pages/CustomerProfile` | `@features/customer/pages/Profile` |
| `./pages/CustomerReturns` | `@features/customer/pages/Returns` |
| `./pages/CustomerNotifications` | `@features/customer/pages/Notifications` |
| `./pages/CustomerBookings` | `@features/customer/pages/Bookings` |
| `./pages/CustomTailoring` | `@features/customer/pages/Tailoring` |
| `./pages/CustomerMeasurements` | `@features/customer/pages/Measurements` |
| `./pages/CustomerAddresses` | `@features/customer/pages/Addresses` |
| `./pages/CustomerBoutiqueDetails` | `@features/customer/pages/Boutique` |
| `./pages/OrderSuccess` | `@features/customer/pages/Orders/OrderSuccess` |
| `./pages/CustomerPrivacy` | `@features/customer/pages/Static/Privacy` |
| `./pages/CustomerTerms` | `@features/customer/pages/Static/Terms` |
| `./pages/CustomerRefund` | `@features/customer/pages/Static/Refund` |
| `./pages/CustomerShipping` | `@features/customer/pages/Static/Shipping` |
| `./pages/CustomerAbout` | `@features/customer/pages/Static/About` |
| `./pages/CustomerContact` | `@features/customer/pages/Static/Contact` |
| `./pages/CustomerHelp` | `@features/customer/pages/Static/Help` |
| `./pages/DesignSystemShowcase` | `@features/shared/pages/DesignSystemShowcase` |
| `./pages/Login` | `@features/auth/pages/Login` |
| `./pages/ResetPassword` | `@features/auth/pages/ResetPassword` |
| `./pages/SetPassword` | `@features/auth/pages/SetPassword` |
| `./pages/ProductCatalog` | `@features/admin/pages/Products/ProductCatalog` |
| `./pages/ProductDetail` | `@features/admin/pages/Products/ProductDetail` |
| `./pages/WishlistPage` | `@features/customer/pages/Wishlist` |

### 3.9 Root Entry Imports

| Pattern | BEFORE | AFTER |
|---------|--------|-------|
| App import | `import App from './App.jsx'` (in main.jsx) | `import App from '@app/App'` |
| CSS import | `import './index.css'` (in main.jsx) | `import '@app/index.css'` |
| QueryClient import | `import { QueryClient, QueryClientProvider } from '@tanstack/react-query'` (in main.jsx) | No change — stays as third-party import, but moves to `@app/providers/QueryProvider` |
| main.jsx entry | `web/src/main.jsx` | `@app/main` |

### 3.10 Boutique Tab Component Imports

| Pattern | BEFORE | AFTER |
|---------|--------|-------|
| AccessControlTab | `import AccessControlTab from '../components/boutique/AccessControlTab'` | `import { AccessControlTab } from '@core/components'` |
| BoutiqueProfileTab | `import BoutiqueProfileTab from '../components/boutique/BoutiqueProfileTab'` | `import { BoutiqueProfileTab } from '@core/components'` |
| DangerZoneTab | `import DangerZoneTab from '../components/boutique/DangerZoneTab'` | `import { DangerZoneTab } from '@core/components'` |
| OwnerDetailsTab | `import OwnerDetailsTab from '../components/boutique/OwnerDetailsTab'` | `import { OwnerDetailsTab } from '@core/components'` |
| BoutiqueTable | `import BoutiqueTable from '../components/BoutiqueTable'` | `import { BoutiqueTable } from '@core/components'` |
| BoutiqueForm | `import BoutiqueForm from '../components/BoutiqueForm'` | `import { BoutiqueForm } from '@core/components'` |
| CategoryList | `import CategoryList from '../components/CategoryList'` | `import { CategoryList } from '@core/components'` |

### 3.11 Modal Component Imports

| Pattern | BEFORE | AFTER |
|---------|--------|-------|
| EditModal | `import EditModal from '../components/EditModal'` | `import { EditModal } from '@core/components'` |
| DeleteConfirm | `import DeleteConfirm from '../components/DeleteConfirm'` | `import { DeleteConfirm } from '@core/components'` |
| BoutiqueEditModal | `import BoutiqueEditModal from '../components/BoutiqueEditModal'` | `import { BoutiqueEditModal } from '@core/components'` |
| AddressFormModal | `import AddressFormModal from '../components/AddressFormModal'` | `import { AddressFormModal } from '@core/components'` |
| ReviewModal | `import ReviewModal from '../components/ReviewModal'` | `import { ReviewModal } from '@core/components'` |
| ReturnRequestModal | `import ReturnRequestModal from '../components/ReturnRequestModal'` | `import { ReturnRequestModal } from '@core/components'` |
| ExchangeRequestModal | `import ExchangeRequestModal from '../components/ExchangeRequestModal'` | `import { ExchangeRequestModal } from '@core/components'` |
| OtpModal | `import OtpModal from '../components/OtpModal'` | `import { OtpModal } from '@core/components'` |

### 3.12 App.jsx Provider Imports

| Pattern | BEFORE | AFTER |
|---------|--------|-------|
| Auth provider | `import { AuthProvider, AuthContext } from './context/AuthContext'` | `import { AuthProvider, AuthContext } from '@core/contexts'` |
| Customer auth provider | `import { CustomerAuthProvider } from './context/CustomerAuthContext'` | `import { CustomerAuthProvider } from '@core/contexts'` |
| Cart provider | `import { CartProvider } from './context/CartContext'` | `import { CartProvider } from '@core/contexts'` |
| Wishlist provider | `import { WishlistProvider } from './context/WishlistContext'` | `import { WishlistProvider } from '@core/contexts'` |
| Address provider | `import { AddressProvider } from './context/AddressContext'` | `import { AddressProvider } from '@core/contexts'` |
| Review provider | `import { ReviewProvider } from './context/ReviewContext'` | `import { ReviewProvider } from '@core/contexts'` |
| Returns provider | `import { ReturnsProvider } from './context/ReturnsContext'` | `import { ReturnsProvider } from '@core/contexts'` |
| Notification provider | `import { NotificationProvider } from './context/NotificationContext'` | `import { NotificationProvider } from '@core/contexts'` |
| Admin notification provider | `import { AdminNotificationProvider } from './context/AdminNotificationContext'` | `import { AdminNotificationProvider } from '@core/contexts'` |

### 3.13 Legal/Shared Component Imports

| Pattern | BEFORE | AFTER |
|---------|--------|-------|
| LegalPage | `import LegalPage from '../components/LegalPage'` | `import { LegalPage } from '@core/components'` |
| AppPreviewMockup | `import AppPreviewMockup from '../components/AppPreviewMockup'` | `import { AppPreviewMockup } from '@core/components'` |

---

## Section 4: Duplicate Import Analysis

The following duplicates exist in the current codebase and must be resolved during migration:

### 4.1 Component Duplicates

| Component | Duplicate Paths | Resolution |
|-----------|----------------|------------|
| **ProductCard** | `src/components/ProductCard.jsx` (2-line stub) + `src/components/commerce/ProductCard.jsx` (real implementation) | DELETE `src/components/ProductCard.jsx`. Import from `@core/components` barrel. |
| **Card** | `src/components/Card.jsx` (root, simple) + `src/components/ui/Card.jsx` (richer, animated) | DELETE `src/components/Card.jsx`. Use `ui/Card` via barrel. |
| **Skeleton** | `src/components/Skeleton.jsx` (root) + `src/components/ui/Skeleton.jsx` (with animation variants) | DELETE `src/components/Skeleton.jsx`. Use `ui/Skeleton` via barrel. |

### 4.2 Route Duplicates

| Route | Duplicate Path | Resolution |
|-------|---------------|------------|
| **DesignSystemShowcase** | `/design-system` and `/customer/design-system` in App.jsx (lines 587-588) | Keep single canonical route. Move to `@features/shared/pages/DesignSystemShowcase`. |

### 4.3 Context Re-export Patterns

No duplicate context files exist — all 9 contexts are unique files. However, the same context is sometimes imported as a named export and sometimes via `useContext` import. After migration, always import from `@core/contexts` barrel.

### 4.4 API Function Duplicates

The current `src/services/api.js` contains all API functions in one monolithic file (1325 lines). After migration, these are split into domain-specific files under `core/services/api/`. Each function lives in exactly one file:

| Domain | Split File | Functions |
|--------|-----------|-----------|
| Auth | `auth.api.js` | `login`, `sendOtp`, `verifyOtp`, `getDevOtpMetadata`, `setPassword`, `resetPassword`, `sendPasswordResetLink` |
| Boutique | `boutique.api.js` | `getBoutiques`, `getBoutiqueDetails`, `addBoutique`, `updateBoutique`, `updateBoutiqueStatus`, `deleteBoutique`, `getOwnerBoutique`, `updateOwnerBoutique` |
| Order | `order.api.js` | `getOrders`, `getOrderById`, `createOrder`, `updateOrderStatus`, `updateOrderPayment`, `updateOrderMeasurements` |
| Product | `product.api.js` | `getPublicProducts`, `getPublicProduct`, `getOwnerProducts`, `getOwnerProduct`, `createOwnerProduct`, `updateOwnerProduct`, `deleteOwnerProduct` (and all product sub-resources) |
| Cart | `cart.api.js` | `getCart`, `addToCart`, `updateCartItem`, `removeCartItem`, `clearCart` |
| Checkout | `checkout.api.js` | `validateCheckout`, `createCommerceOrder`, `createPayment`, `verifyPayment` |
| Payment | `payment.api.js` | `getAllPayments`, `getPaymentReports`, `refundPayment`, `processPayout` |
| Review | `review.api.js` | `getAllReviews`, `getOwnerReviews`, `getReviewStats`, `moderateReview`, `replyToReview` |
| Coupon | `coupon.api.js` | `getAdminCoupons`, `getAdminCoupon`, `createAdminCoupon`, `updateAdminCoupon`, `toggleAdminCoupon`, `deleteAdminCoupon` |
| Notification | `notification.api.js` | `getNotifications`, `markNotificationRead`, `broadcastNotification`, `getNotificationAnalytics`, `getNotificationTemplates` |
| Analytics | `analytics.api.js` | `getDashboardStats`, `getAdminRevenue`, `getAdminFraud`, `getAdminWishlists`, `getAdminCommandCenter` |
| Ticket | `ticket.api.js` | `getAdminTickets`, `getOwnerTickets`, `getCustomerTickets`, `getTicketById`, `getTicketMessages` |
| Subscription | `subscription.api.js` | `getOwnerSubscription`, `upgradeSubscription`, `getSubscriptionPlans`, `createSubscriptionPlan` |
| Upload | `upload.api.js` | `uploadImage` |
| Inventory | `inventory.api.js` | `updateProductInventory`, `getProductInventoryLogs` |
| Delivery | `delivery.api.js` | `getOrderTracking`, `createOrderTracking`, `updateTrackingStatus` |
| Admin | `admin.api.js` | `getCustomers`, `getCustomerProfile`, `toggleCustomerBlock`, `getAdminSubscriptions`, `updateAdminSubscription` |
| Owner | `owner.api.js` | `getOwnerDashboard`, `getOwnerProfile`, `updateOwnerPermissions`, `updateOwnerStatus`, `getUnassignedOwners`, `inviteOwner`, `linkOwner`, `unlinkOwner`, `resendInvite` |
| Customer | `customer.api.js` | `getMyCommerceOrders`, `getMyCommerceOrder`, `customerCancelOrder`, `getCustomerNotifications`, `getCustomerUnreadNotificationCount`, `markCustomerNotificationRead`, `markAllCustomerNotificationsRead`, `deleteCustomerNotification` |

---

## Section 5: Complete File-Level Migration (src/)

### Root Files

| Current | New (Alias) | Action |
|---------|-------------|--------|
| `src/main.jsx` | `@app/main` | MOVE |
| `src/App.jsx` | `@app/App` | MOVE + SPLIT (extract routes, layouts) |
| `src/index.css` | `@app/index.css` | MOVE (imports `core/styles/*`) |

### Context Files

| Current | New | Action |
|---------|-----|--------|
| `src/context/AuthContext.jsx` | `@core/contexts/AuthContext.jsx` | MOVE |
| `src/context/CustomerAuthContext.jsx` | `@core/contexts/CustomerAuthContext.jsx` | MOVE |
| `src/context/CartContext.jsx` | `@core/contexts/CartContext.jsx` | MOVE |
| `src/context/WishlistContext.jsx` | `@core/contexts/WishlistContext.jsx` | MOVE |
| `src/context/AddressContext.jsx` | `@core/contexts/AddressContext.jsx` | MOVE |
| `src/context/ReviewContext.jsx` | `@core/contexts/ReviewContext.jsx` | MOVE |
| `src/context/ReturnsContext.jsx` | `@core/contexts/ReturnsContext.jsx` | MOVE |
| `src/context/NotificationContext.jsx` | `@core/contexts/NotificationContext.jsx` | MOVE |
| `src/context/AdminNotificationContext.jsx` | `@core/contexts/AdminNotificationContext.jsx` | MOVE |

### Hook Files

| Current | New | Action |
|---------|-----|--------|
| `src/hooks/useDebounce.js` | `@core/hooks/useDebounce.js` | MOVE + convert to named export |

### Service Files

| Current | New | Action |
|---------|-----|--------|
| `src/services/api.js` | `@core/services/api.client.js` + `@core/services/api/*.api.js` | SPLIT (19 files) |
| `src/services/imageConfig.js` | `@core/services/imageConfig.js` | MOVE |

### Component Files (Root)

| Current | New | Action |
|---------|-----|--------|
| `src/components/Sidebar.jsx` | `@core/components/navigation/Sidebar.jsx` | MOVE |
| `src/components/Navbar.jsx` | `@core/components/navigation/Navbar.jsx` | MOVE |
| `src/components/MegaMenu.jsx` | `@core/components/navigation/MegaMenu.jsx` | MOVE |
| `src/components/MobileNavSheet.jsx` | `@core/components/navigation/MobileNavSheet.jsx` | MOVE |
| `src/components/Card.jsx` | DELETE (superseded by ui/Card) | DELETE |
| `src/components/Skeleton.jsx` | DELETE (superseded by ui/Skeleton) | DELETE |
| `src/components/ProductCard.jsx` | DELETE (stub) | DELETE |
| `src/components/CustomerLayout.jsx` | `@core/components/layout/CustomerLayout.jsx` | MOVE |
| `src/components/OwnerLayout.jsx` | `@core/components/layout/OwnerLayout.jsx` | MOVE |
| `src/components/LegalPage.jsx` | `@core/components/shared/LegalPage.jsx` | MOVE |
| `src/components/AppPreviewMockup.jsx` | `@core/components/shared/AppPreviewMockup.jsx` | MOVE |
| `src/components/CategoryList.jsx` | `@core/components/commerce/CategoryList.jsx` | MOVE |
| `src/components/BoutiqueTable.jsx` | `@core/components/commerce/BoutiqueTable.jsx` | MOVE |
| `src/components/BoutiqueForm.jsx` | `@core/components/forms/BoutiqueForm.jsx` | MOVE |
| `src/components/EditModal.jsx` | `@core/components/modals/EditModal.jsx` | MOVE |
| `src/components/DeleteConfirm.jsx` | `@core/components/modals/DeleteConfirm.jsx` | MOVE |
| `src/components/BoutiqueEditModal.jsx` | `@core/components/modals/BoutiqueEditModal.jsx` | MOVE |
| `src/components/AddressFormModal.jsx` | `@core/components/modals/AddressFormModal.jsx` | MOVE |
| `src/components/ReviewModal.jsx` | `@core/components/modals/ReviewModal.jsx` | MOVE |
| `src/components/ReturnRequestModal.jsx` | `@core/components/modals/ReturnRequestModal.jsx` | MOVE |
| `src/components/ExchangeRequestModal.jsx` | `@core/components/modals/ExchangeRequestModal.jsx` | MOVE |
| `src/components/OtpModal.jsx` | `@core/components/modals/OtpModal.jsx` | MOVE |
| `src/components/boutique/AccessControlTab.jsx` | `@core/components/modals/AccessControlTab.jsx` | MOVE |
| `src/components/boutique/BoutiqueProfileTab.jsx` | `@core/components/modals/BoutiqueProfileTab.jsx` | MOVE |
| `src/components/boutique/DangerZoneTab.jsx` | `@core/components/modals/DangerZoneTab.jsx` | MOVE |
| `src/components/boutique/OwnerDetailsTab.jsx` | `@core/components/modals/OwnerDetailsTab.jsx` | MOVE |

### Component Files (ui/)

All 28 files under `src/components/ui/` move to `@core/components/ui/` with no name changes. They are re-exported through `@core/components` barrel.

### Component Files (commerce/)

All 12 files under `src/components/commerce/` move to `@core/components/commerce/` with no name changes. Re-exported through `@core/components` barrel.

### Page Files

All 84 page files under `src/pages/` move to their respective `@features/*/pages/` directories as mapped in Section 3.8 above.

---

## Section 6: Circular Dependency Prevention

The following rules MUST be enforced to prevent circular dependencies in the new architecture:

### 6.1 Import Direction Rules

```
                     ┌──────────────────┐
                     │     @config      │
                     │     @types       │
                     └────────┬─────────┘
                              │ (may NOT import from @core or @features)
                              │
                  ┌───────────▼───────────┐
                  │       @core           │
                  │ (may NOT import from  │
                  │  @features or @app)   │
                  └───────────┬───────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
    ┌───────▼──────┐  ┌──────▼──────┐  ┌───────▼──────┐
    │ @features/   │  │ @features/  │  │ @features/   │
    │ admin        │  │ owner       │  │ customer     │
    └───────┬──────┘  └──────┬──────┘  └───────┬──────┘
            │                 │                 │
            └─────────────────┼─────────────────┘
                              │
                     ┌────────▼────────┐
                     │      @app       │
                     │ (imports from   │
                     │  @core &        │
                     │  @features)     │
                     └─────────────────┘
```

### 6.2 Strict Rules

1. **`@config` / `@types`** — Cannot import from `@core`, `@features`, or `@app`. These are leaf modules with zero project dependencies.

2. **`@core`** — Cannot import from `@features` or `@app`. Core is the shared foundation; it must be independent of any feature.

3. **`@features/*`** — Can import from `@core` only. No feature may import another feature. No feature may import from `@app`.

4. **`@app`** — Can import from `@core` and any `@features/*` module. This is the composition layer that wires everything together.

5. **`@assets` / `@locales` / `@tests`** — Cannot import from any other `@` alias. These are static assets and test infrastructure.

### 6.3 Enforcement

- Add an ESLint rule `import/no-restricted-paths` to `eslint.config.js`:
  ```js
  'import/no-restricted-paths': ['error', {
    zones: [
      { target: './src/config',   from: './src/(core|features|app)' },
      { target: './src/types',    from: './src/(core|features|app)' },
      { target: './src/core',     from: './src/(features|app)' },
      { target: './src/features', from: './src/app' },
      { target: './src/features/admin',    from: './src/features/(owner|customer)' },
      { target: './src/features/owner',    from: './src/features/(admin|customer)' },
      { target: './src/features/customer', from: './src/features/(admin|owner)' },
      { target: './src/assets',   from: './src/(core|features|app|config|types)' },
      { target: './src/locales',  from: './src/(core|features|app|config|types)' },
      { target: './src/tests',    from: './src/(core|features|app|config|types)' },
    ]
  }]
  ```

### 6.4 Barrel Import Convention

All imports from `@core` MUST use the barrel (`@core/components`, `@core/hooks`, `@core/contexts`, `@core/services`, `@core/utils`). The ONLY exception is API domain modules, which import from `@core/services/api/*.api` to avoid barrel bloat.

```
✅ Correct:
  import { Button } from '@core/components'
  import { useDebounce } from '@core/hooks'
  import { api } from '@core/services'
  import { getBoutiques } from '@core/services/api/boutique.api'

❌ Incorrect:
  import Button from '@core/components/ui/Button'
  import useDebounce from '@core/hooks/useDebounce'
  import api from '@core/services/api.client'
```

### 6.5 Third-Party Imports

Third-party libraries (`react`, `react-router-dom`, `@tanstack/react-query`, `framer-motion`, `lucide-react`, `axios`) remain as direct npm package imports and are unaffected by this migration.

---

## Section 7: Migration Execution Order

To minimize breakage, migrate imports in this order:

| Phase | What | Why First |
|-------|------|-----------|
| 1 | Create all target directories with barrel `index.js` files | Enables aliases to resolve immediately |
| 2 | Move `@config` and `@types` files | No internal deps, zero breakage |
| 3 | Move `@core/utils` files | Utility functions have no project dependencies |
| 4 | Move `@core/services` (split api.js, move imageConfig.js) | Services depend only on utils and config |
| 5 | Move `@core/hooks` | Hooks depend on services and utils |
| 6 | Move `@core/contexts` | Contexts depend on hooks and services |
| 7 | Move `@core/components` (ui, layout, navigation, feedback, animations, commerce, modals, shared) | Components depend on hooks, contexts, utils |
| 8 | Move `@features/*/pages` | Pages depend on everything in core |
| 9 | Refactor `@app/App.jsx` and `@app/router/*` | Top-level shell depends on features |
| 10 | Update `main.jsx` entry point | Final step — everything must exist |
| 11 | Delete old `src/components/`, `src/context/`, `src/hooks/`, `src/services/`, `src/pages/` | Only after verifying no stale imports remain |
| 12 | Run full build, lint, and test suite | Validate no broken imports |
