# VS Boutique — File Migration Plan

> Maps every existing file in `web/src/` to its new location in the enterprise architecture under `core/` and `features/`.

---

## Legend

| Column | Description |
|---|---|
| **Action** | MOVE, SPLIT, MERGE, DELETE, RENAME, STAY, EXTRACT |
| **Risk** | LOW / MEDIUM / HIGH — based on import ripple effect, shared surface, or logic entanglement |
| **Dependencies** | Known files that import or are imported by this file |
| **Est. Time** | Developer-hours for the migration step alone (not QA) |

---

## 1. Root Files

| # | Current Path | New Path | Action | Risk | Dependencies | Est. Time |
|---|---|---|---|---|---|---|
| 1 | `src/App.jsx` | `core/App.jsx` | MOVE | MEDIUM | main.jsx, 40+ lazy imports, all context providers | 30 min |
| 2 | `src/index.css` | `core/styles/global.css` (primary) + `core/styles/tokens.css` (`@theme` block) + `core/styles/reset.css` (`@layer base`) | SPLIT | MEDIUM | main.jsx imports global.css | 30 min |
| 3 | `src/main.jsx` | `core/main.jsx` | MOVE | MEDIUM | App.jsx, index.css → global.css, QueryClient setup | 15 min |

---

## 2. `components/` (Root Level — 22 files)

| # | Current Path | New Path | Action | Risk | Dependencies | Est. Time |
|---|---|---|---|---|---|---|
| 4 | `src/components/AddressFormModal.jsx` | `core/components/modals/AddressFormModal.jsx` | MOVE | LOW | CustomerAddresses.jsx | 10 min |
| 5 | `src/components/AppPreviewMockup.jsx` | `core/components/display/AppPreviewMockup.jsx` | MOVE | LOW | DesignSystemShowcase.jsx | 10 min |
| 6 | `src/components/BoutiqueEditModal.jsx` | `core/components/modals/BoutiqueEditModal.jsx` | MOVE | LOW | BoutiqueDetails.jsx | 10 min |
| 7 | `src/components/BoutiqueForm.jsx` | `core/components/forms/BoutiqueForm.jsx` | MOVE | LOW | BoutiqueDetails.jsx | 10 min |
| 8 | `src/components/BoutiqueTable.jsx` | `core/components/tables/BoutiqueTable.jsx` | MOVE | LOW | Boutiques.jsx | 10 min |
| 9 | `src/components/Card.jsx` | **DELETE** (superseded by `ui/Card.jsx` — richer, animated) | DELETE | LOW | Check imports — confirmed no imports from src/components/Card | 5 min |
| 10 | `src/components/CategoryList.jsx` | `core/components/commerce/CategoryList.jsx` | MOVE | LOW | CustomerShop.jsx, Navbar.jsx | 10 min |
| 11 | `src/components/CustomerLayout.jsx` | `core/components/layout/CustomerLayout.jsx` | MOVE | LOW | App.jsx | 10 min |
| 12 | `src/components/DeleteConfirm.jsx` | `core/components/modals/DeleteConfirm.jsx` | MOVE | LOW | BoutiqueDetails.jsx, Categories.jsx | 10 min |
| 13 | `src/components/EditModal.jsx` | `core/components/modals/EditModal.jsx` | MOVE | LOW | BoutiqueDetails.jsx | 10 min |
| 14 | `src/components/ExchangeRequestModal.jsx` | `core/components/modals/ExchangeRequestModal.jsx` | MOVE | LOW | CustomerOrderDetail.jsx | 10 min |
| 15 | `src/components/LegalPage.jsx` | `features/shared/pages/LegalPage/LegalPage.jsx` | MOVE | LOW | CustomerPrivacy.jsx, CustomerTerms.jsx | 10 min |
| 16 | `src/components/MegaMenu.jsx` | `core/components/navigation/MegaMenu.jsx` | MOVE | LOW | Navbar.jsx | 10 min |
| 17 | `src/components/MobileNavSheet.jsx` | `core/components/navigation/MobileNavSheet.jsx` | MOVE | LOW | Navbar.jsx | 10 min |
| 18 | `src/components/Navbar.jsx` | `core/components/navigation/Navbar.jsx` | MOVE | MEDIUM | App.jsx (AdminLayout), MegaMenu, MobileNavSheet | 10 min |
| 19 | `src/components/OtpModal.jsx` | `core/components/modals/OtpModal.jsx` | MOVE | LOW | AuthContext.jsx | 10 min |
| 20 | `src/components/OwnerLayout.jsx` | `core/components/layout/OwnerLayout.jsx` | MOVE | LOW | App.jsx, OwnerSettings.jsx | 10 min |
| 21 | `src/components/ProductCard.jsx` | **DELETE** (2-line stub re-exporting `commerce/ProductCard`) | DELETE | LOW | No direct consumers (consumers should import commerce/ProductCard directly) | 2 min |
| 22 | `src/components/ReturnRequestModal.jsx` | `core/components/modals/ReturnRequestModal.jsx` | MOVE | LOW | CustomerOrderDetail.jsx | 10 min |
| 23 | `src/components/ReviewModal.jsx` | `core/components/modals/ReviewModal.jsx` | MOVE | LOW | CustomerProductDetail.jsx | 10 min |
| 24 | `src/components/Sidebar.jsx` | `core/components/navigation/Sidebar.jsx` | MOVE | MEDIUM | App.jsx (AdminLayout) | 10 min |
| 25 | `src/components/Skeleton.jsx` | **DELETE** (superseded by `ui/Skeleton.jsx` — richer, with animation variants) | DELETE | LOW | Check imports before deleting | 5 min |

---

## 3. `components/boutique/` (4 files)

| # | Current Path | New Path | Action | Risk | Dependencies | Est. Time |
|---|---|---|---|---|---|---|
| 26 | `src/components/boutique/AccessControlTab.jsx` | `core/components/boutique/AccessControlTab.jsx` | MOVE | LOW | BoutiqueDetails.jsx | 10 min |
| 27 | `src/components/boutique/BoutiqueProfileTab.jsx` | `core/components/boutique/BoutiqueProfileTab.jsx` | MOVE | LOW | BoutiqueDetails.jsx | 10 min |
| 28 | `src/components/boutique/DangerZoneTab.jsx` | `core/components/boutique/DangerZoneTab.jsx` | MOVE | LOW | BoutiqueDetails.jsx | 10 min |
| 29 | `src/components/boutique/OwnerDetailsTab.jsx` | `core/components/boutique/OwnerDetailsTab.jsx` | MOVE | LOW | BoutiqueDetails.jsx | 10 min |

---

## 4. `components/commerce/` (12 files)

| # | Current Path | New Path | Action | Risk | Dependencies | Est. Time |
|---|---|---|---|---|---|---|
| 30 | `src/components/commerce/AvailabilityBadge.jsx` | `core/components/commerce/AvailabilityBadge.jsx` | MOVE | LOW | ProductCard.jsx, BoutiqueCard.jsx | 5 min |
| 31 | `src/components/commerce/BoutiqueCard.jsx` | `core/components/commerce/BoutiqueCard.jsx` | MOVE | LOW | CustomerShop.jsx, CustomerHome.jsx | 10 min |
| 32 | `src/components/commerce/CollectionCard.jsx` | `core/components/commerce/CollectionCard.jsx` | MOVE | LOW | CustomerShop.jsx, CustomerHome.jsx | 10 min |
| 33 | `src/components/commerce/DeliveryBadge.jsx` | `core/components/commerce/DeliveryBadge.jsx` | MOVE | LOW | ProductCard.jsx | 5 min |
| 34 | `src/components/commerce/DiscountBadge.jsx` | `core/components/commerce/DiscountBadge.jsx` | MOVE | LOW | ProductCard.jsx | 5 min |
| 35 | `src/components/commerce/PriceComponent.jsx` | `core/components/commerce/PriceComponent.jsx` | MOVE | LOW | ProductCard.jsx, BoutiqueCard.jsx | 5 min |
| 36 | `src/components/commerce/ProductCard.jsx` | `core/components/commerce/ProductCard.jsx` | MOVE | LOW | CustomerShop.jsx, CustomerHome.jsx, WishlistPage.jsx | 10 min |
| 37 | `src/components/commerce/RatingComponent.jsx` | `core/components/commerce/RatingComponent.jsx` | MOVE | LOW | ProductCard.jsx, ReviewCard.jsx | 5 min |
| 38 | `src/components/commerce/ReviewCard.jsx` | `core/components/commerce/ReviewCard.jsx` | MOVE | LOW | CustomerProductDetail.jsx | 10 min |
| 39 | `src/components/commerce/ServiceCard.jsx` | `core/components/commerce/ServiceCard.jsx` | MOVE | LOW | OwnerServices.jsx, CustomerBoutiqueDetails.jsx | 10 min |
| 40 | `src/components/commerce/StatusBadge.jsx` | `core/components/commerce/StatusBadge.jsx` | MOVE | LOW | AdminCommerceOrders.jsx, OwnerOrders.jsx | 5 min |
| 41 | `src/components/commerce/TimelineCard.jsx` | `core/components/commerce/TimelineCard.jsx` | MOVE | LOW | CustomerOrderDetail.jsx, OwnerOrders.jsx | 10 min |

---

## 5. `components/layout/` (6 files)

| # | Current Path | New Path | Action | Risk | Dependencies | Est. Time |
|---|---|---|---|---|---|---|
| 42 | `src/components/layout/Container.jsx` | `core/components/layout/Container.jsx` | MOVE | LOW | Multiple page components | 5 min |
| 43 | `src/components/layout/Grid.jsx` | `core/components/layout/Grid.jsx` | MOVE | LOW | CustomerShop.jsx, CustomerHome.jsx | 5 min |
| 44 | `src/components/layout/PageFooter.jsx` | `core/components/layout/PageFooter.jsx` | MOVE | LOW | CustomerHome.jsx | 5 min |
| 45 | `src/components/layout/PageHeader.jsx` | `core/components/layout/PageHeader.jsx` | MOVE | LOW | Multiple admin pages | 5 min |
| 46 | `src/components/layout/Section.jsx` | `core/components/layout/Section.jsx` | MOVE | LOW | CustomerHome.jsx, CustomerBoutiqueDetails.jsx | 5 min |
| 47 | `src/components/layout/Stack.jsx` | `core/components/layout/Stack.jsx` | MOVE | LOW | Multiple page components | 5 min |

---

## 6. `components/ui/` (28 files)

| # | Current Path | New Path | Action | Risk | Dependencies | Est. Time |
|---|---|---|---|---|---|---|
| 48 | `src/components/ui/Accordion.jsx` | `core/components/ui/Accordion.jsx` | MOVE | LOW | CustomerHelp.jsx | 5 min |
| 49 | `src/components/ui/Avatar.jsx` | `core/components/ui/Avatar.jsx` | MOVE | LOW | Navbar.jsx, ReviewCard.jsx | 5 min |
| 50 | `src/components/ui/Badge.jsx` | `core/components/ui/Badge.jsx` | MOVE | LOW | Multiple components | 5 min |
| 51 | `src/components/ui/BottomSheet.jsx` | `core/components/ui/BottomSheet.jsx` | MOVE | LOW | MobileNavSheet.jsx | 5 min |
| 52 | `src/components/ui/Button.jsx` | `core/components/ui/Button.jsx` | MOVE | LOW | Every page & component | 5 min |
| 53 | `src/components/ui/Card.jsx` | `core/components/ui/Card.jsx` | STAY (path unchanged under core) | LOW | Multiple components | 0 min |
| 54 | `src/components/ui/Checkbox.jsx` | `core/components/ui/Checkbox.jsx` | MOVE | LOW | BoutiqueForm.jsx | 5 min |
| 55 | `src/components/ui/Chip.jsx` | `core/components/ui/Chip.jsx` | MOVE | LOW | CategoryList.jsx | 5 min |
| 56 | `src/components/ui/Drawer.jsx` | `core/components/ui/Drawer.jsx` | MOVE | LOW | Sidebar.jsx, MobileNavSheet.jsx | 5 min |
| 57 | `src/components/ui/EmptyState.jsx` | `core/components/ui/EmptyState.jsx` | MOVE | LOW | Multiple pages | 5 min |
| 58 | `src/components/ui/ErrorState.jsx` | `core/components/ui/ErrorState.jsx` | MOVE | LOW | Multiple pages | 5 min |
| 59 | `src/components/ui/FAB.jsx` | `core/components/ui/FAB.jsx` | MOVE | LOW | CustomerShop.jsx | 5 min |
| 60 | `src/components/ui/IconButton.jsx` | `core/components/ui/IconButton.jsx` | MOVE | LOW | Navbar.jsx, Sidebar.jsx | 5 min |
| 61 | `src/components/ui/Input.jsx` | `core/components/ui/Input.jsx` | MOVE | LOW | BoutiqueForm.jsx, AddressFormModal.jsx | 5 min |
| 62 | `src/components/ui/LoadingOverlay.jsx` | `core/components/ui/LoadingOverlay.jsx` | MOVE | LOW | Multiple pages | 5 min |
| 63 | `src/components/ui/Modal.jsx` | `core/components/ui/Modal.jsx` | MOVE | LOW | All modals | 5 min |
| 64 | `src/components/ui/PremiumImage.jsx` | `core/components/ui/PremiumImage.jsx` | MOVE | LOW | ProductCard.jsx, BoutiqueCard.jsx | 5 min |
| 65 | `src/components/ui/Radio.jsx` | `core/components/ui/Radio.jsx` | MOVE | LOW | CustomerCheckout.jsx | 5 min |
| 66 | `src/components/ui/SearchInput.jsx` | `core/components/ui/SearchInput.jsx` | MOVE | LOW | CustomerShop.jsx | 5 min |
| 67 | `src/components/ui/Select.jsx` | `core/components/ui/Select.jsx` | MOVE | LOW | BoutiqueForm.jsx | 5 min |
| 68 | `src/components/ui/Skeleton.jsx` | `core/components/ui/Skeleton.jsx` | STAY (path unchanged under core) | LOW | Multiple pages | 0 min |
| 69 | `src/components/ui/Stepper.jsx` | `core/components/ui/Stepper.jsx` | MOVE | LOW | CustomerCheckout.jsx | 5 min |
| 70 | `src/components/ui/Switch.jsx` | `core/components/ui/Switch.jsx` | MOVE | LOW | AdminSettings.jsx | 5 min |
| 71 | `src/components/ui/Tabs.jsx` | `core/components/ui/Tabs.jsx` | MOVE | LOW | Multiple pages | 5 min |
| 72 | `src/components/ui/Textarea.jsx` | `core/components/ui/Textarea.jsx` | MOVE | LOW | BoutiqueForm.jsx, ReviewModal.jsx | 5 min |
| 73 | `src/components/ui/Timeline.jsx` | `core/components/ui/Timeline.jsx` | MOVE | LOW | CustomerOrderDetail.jsx | 5 min |
| 74 | `src/components/ui/Toast.jsx` | `core/components/ui/Toast.jsx` | MOVE | LOW | NotificationContext.jsx | 5 min |
| 75 | `src/components/ui/Tooltip.jsx` | `core/components/ui/Tooltip.jsx` | MOVE | LOW | Multiple components | 5 min |

---

## 7. `context/` (9 files)

| # | Current Path | New Path | Action | Risk | Dependencies | Est. Time |
|---|---|---|---|---|---|---|
| 76 | `src/context/AddressContext.jsx` | `core/context/AddressContext.jsx` | MOVE | MEDIUM | App.jsx, CustomerAddresses.jsx | 10 min |
| 77 | `src/context/AdminNotificationContext.jsx` | `core/context/AdminNotificationContext.jsx` | MOVE | MEDIUM | App.jsx (AdminLayout), AdminNotifications.jsx | 10 min |
| 78 | `src/context/AuthContext.jsx` | `core/context/AuthContext.jsx` | MOVE | HIGH | App.jsx, Login.jsx, multiple pages | 15 min |
| 79 | `src/context/CartContext.jsx` | `core/context/CartContext.jsx` | MOVE | MEDIUM | App.jsx, CustomerCart.jsx | 10 min |
| 80 | `src/context/CustomerAuthContext.jsx` | `core/context/CustomerAuthContext.jsx` | MOVE | MEDIUM | App.jsx, CustomerHome.jsx (implicit) | 10 min |
| 81 | `src/context/NotificationContext.jsx` | `core/context/NotificationContext.jsx` | MOVE | MEDIUM | App.jsx (Customer routes), CustomerNotifications.jsx | 10 min |
| 82 | `src/context/ReturnsContext.jsx` | `core/context/ReturnsContext.jsx` | MOVE | LOW | App.jsx, CustomerReturns.jsx, CustomerOrderDetail.jsx | 10 min |
| 83 | `src/context/ReviewContext.jsx` | `core/context/ReviewContext.jsx` | MOVE | LOW | App.jsx, CustomerProductDetail.jsx | 10 min |
| 84 | `src/context/WishlistContext.jsx` | `core/context/WishlistContext.jsx` | MOVE | MEDIUM | App.jsx, CustomerWishlist.jsx | 10 min |

---

## 8. `hooks/` (1 file)

| # | Current Path | New Path | Action | Risk | Dependencies | Est. Time |
|---|---|---|---|---|---|---|
| 85 | `src/hooks/useDebounce.js` | `core/hooks/useDebounce.js` | MOVE | LOW | SearchInput.jsx | 5 min |

---

## 9. `pages/` — Admin Pages (26 files)

All map to `features/admin/pages/[FeatureName]/index.jsx`.

| # | Current Path | New Path | Action | Risk | Dependencies | Est. Time |
|---|---|---|---|---|---|---|
| 86 | `src/pages/ActivityLogs.jsx` | `features/admin/pages/ActivityLogs/index.jsx` | MOVE + RENAME | LOW | api.js (getActivityLogs) | 15 min |
| 87 | `src/pages/AdminCommandCenter.jsx` | `features/admin/pages/CommandCenter/index.jsx` | MOVE + RENAME | LOW | api.js (getAdminCommandCenter) | 15 min |
| 88 | `src/pages/AdminCommerceOrders.jsx` | `features/admin/pages/CommerceOrders/index.jsx` | MOVE + RENAME | LOW | api.js (getAdminCommerceOrders) | 15 min |
| 89 | `src/pages/AdminCoupons.jsx` | `features/admin/pages/Coupons/index.jsx` | MOVE + RENAME | LOW | api.js (getAdminCoupons) | 15 min |
| 90 | `src/pages/AdminDeliveryTracking.jsx` | `features/admin/pages/DeliveryTracking/index.jsx` | MOVE + RENAME | LOW | api.js (getOrderTracking) | 15 min |
| 91 | `src/pages/AdminFraud.jsx` | `features/admin/pages/Fraud/index.jsx` | MOVE + RENAME | LOW | api.js (getAdminFraud) | 15 min |
| 92 | `src/pages/AdminNotifications.jsx` | `features/admin/pages/Notifications/index.jsx` | MOVE + RENAME | LOW | api.js (getAdminNotifications, broadcast) | 15 min |
| 93 | `src/pages/AdminOrders.jsx` | `features/admin/pages/Orders/index.jsx` | MOVE + RENAME | LOW | api.js (getOrders) | 15 min |
| 94 | `src/pages/AdminPayouts.jsx` | `features/admin/pages/Payouts/index.jsx` | MOVE + RENAME | LOW | api.js (getAdminPayouts) | 15 min |
| 95 | `src/pages/AdminProductReviews.jsx` | `features/admin/pages/ProductReviews/index.jsx` | MOVE + RENAME | LOW | api.js (getAdminProductReviews) | 15 min |
| 96 | `src/pages/AdminRevenue.jsx` | `features/admin/pages/Revenue/index.jsx` | MOVE + RENAME | LOW | api.js (getAdminRevenue) | 15 min |
| 97 | `src/pages/AdminSettings.jsx` | `features/admin/pages/Settings/index.jsx` | MOVE + RENAME | LOW | api.js | 15 min |
| 98 | `src/pages/AdminSubscriptions.jsx` | `features/admin/pages/Subscriptions/index.jsx` | MOVE + RENAME | LOW | api.js (getAdminSubscriptionAnalytics) | 15 min |
| 99 | `src/pages/AdminTickets.jsx` | `features/admin/pages/Tickets/index.jsx` | MOVE + RENAME | LOW | api.js (getAdminTickets) | 15 min |
| 100 | `src/pages/AdminWishlists.jsx` | `features/admin/pages/Wishlists/index.jsx` | MOVE + RENAME | LOW | api.js (getAdminWishlists) | 15 min |
| 101 | `src/pages/Boutiques.jsx` | `features/admin/pages/Boutiques/index.jsx` | MOVE + RENAME | LOW | api.js (getBoutiques), BoutiqueTable.jsx | 15 min |
| 102 | `src/pages/BoutiqueDetails.jsx` | `features/admin/pages/BoutiqueDetails/index.jsx` | MOVE + RENAME | MEDIUM | api.js (getBoutiqueDetails), boutique/ tab components, modals | 25 min |
| 103 | `src/pages/Categories.jsx` | `features/admin/pages/Categories/index.jsx` | MOVE + RENAME | LOW | api.js (getAdminCategories) | 15 min |
| 104 | `src/pages/Customers.jsx` | `features/admin/pages/Customers/index.jsx` | MOVE + RENAME | LOW | api.js (getCustomers) | 15 min |
| 105 | `src/pages/Dashboard.jsx` | `features/admin/pages/Dashboard/index.jsx` | MOVE + RENAME | LOW | api.js (getDashboardStats) | 15 min |
| 106 | `src/pages/MarketplaceInsights.jsx` | `features/admin/pages/MarketplaceInsights/index.jsx` | MOVE + RENAME | LOW | api.js (getMarketplaceInsights) | 15 min |
| 107 | `src/pages/OrderDetails.jsx` | `features/shared/pages/OrderDetails/index.jsx` (shared between admin & owner) | MOVE + RENAME | MEDIUM | api.js (getOrderById), TimelineCard.jsx | 20 min |
| 108 | `src/pages/Payments.jsx` | `features/admin/pages/Payments/index.jsx` | MOVE + RENAME | LOW | api.js (getAllPayments) | 15 min |
| 109 | `src/pages/ProductCatalog.jsx` | `features/admin/pages/ProductCatalog/index.jsx` | MOVE + RENAME | LOW | api.js (getOwnerProducts, getAdminCategories) | 15 min |
| 110 | `src/pages/ProductDetail.jsx` | `features/shared/pages/ProductDetail/index.jsx` (shared between admin & customer) | MOVE + RENAME | MEDIUM | api.js | 20 min |
| 111 | `src/pages/Reviews.jsx` | `features/admin/pages/Reviews/index.jsx` | MOVE + RENAME | LOW | api.js (getAllReviews) | 15 min |

---

## 10. `pages/` — Owner Pages (17 files)

All map to `features/owner/pages/[FeatureName]/index.jsx`.

| # | Current Path | New Path | Action | Risk | Dependencies | Est. Time |
|---|---|---|---|---|---|---|
| 112 | `src/pages/OwnerAnalytics.jsx` | `features/owner/pages/Analytics/index.jsx` | MOVE + RENAME | LOW | api.js (getOwnerDashboard) | 15 min |
| 113 | `src/pages/OwnerBookings.jsx` | `features/owner/pages/Bookings/index.jsx` | MOVE + RENAME | LOW | api.js (getOwnerBookings) | 15 min |
| 114 | `src/pages/OwnerCoupons.jsx` | `features/owner/pages/Coupons/index.jsx` | MOVE + RENAME | LOW | api.js (getOwnerCoupons) | 15 min |
| 115 | `src/pages/OwnerDashboard.jsx` | `features/owner/pages/Dashboard/index.jsx` | MOVE + RENAME | LOW | api.js (getOwnerDashboard) | 15 min |
| 116 | `src/pages/OwnerDeliveryTracking.jsx` | `features/owner/pages/DeliveryTracking/index.jsx` | MOVE + RENAME | LOW | api.js (getOrderTracking) | 15 min |
| 117 | `src/pages/OwnerDesigns.jsx` | `features/owner/pages/Designs/index.jsx` | MOVE + RENAME | LOW | api.js (getDesigns) | 15 min |
| 118 | `src/pages/OwnerGallery.jsx` | `features/owner/pages/Gallery/index.jsx` | MOVE + RENAME | LOW | api.js (updateOwnerGallery, uploadImage) | 15 min |
| 119 | `src/pages/OwnerOrders.jsx` | `features/owner/pages/Orders/index.jsx` | MOVE + RENAME | LOW | api.js (getOrders), TimelineCard.jsx | 15 min |
| 120 | `src/pages/OwnerPayouts.jsx` | `features/owner/pages/Payouts/index.jsx` | MOVE + RENAME | LOW | api.js (getOwnerPayouts) | 15 min |
| 121 | `src/pages/OwnerProductReviews.jsx` | `features/owner/pages/ProductReviews/index.jsx` | MOVE + RENAME | LOW | api.js (getOwnerProductReviews) | 15 min |
| 122 | `src/pages/OwnerProducts.jsx` | `features/owner/pages/Products/index.jsx` | MOVE + RENAME | LOW | api.js (getOwnerProducts) | 15 min |
| 123 | `src/pages/OwnerProfile.jsx` | `features/owner/pages/Profile/index.jsx` | MOVE + RENAME | LOW | api.js (getOwnerProfile, updateOwnerBoutique) | 15 min |
| 124 | `src/pages/OwnerReviews.jsx` | `features/owner/pages/Reviews/index.jsx` | MOVE + RENAME | LOW | api.js (getOwnerReviews) | 15 min |
| 125 | `src/pages/OwnerServices.jsx` | `features/owner/pages/Services/index.jsx` | MOVE + RENAME | LOW | api.js (updateOwnerServices), ServiceCard.jsx | 15 min |
| 126 | `src/pages/OwnerSettings.jsx` | `features/owner/pages/Settings/index.jsx` | MOVE + RENAME | LOW | api.js (changeOwnerPassword, getOwnerStaff) | 15 min |
| 127 | `src/pages/OwnerSubscription.jsx` | `features/owner/pages/Subscription/index.jsx` | MOVE + RENAME | LOW | api.js (getOwnerSubscription) | 15 min |
| 128 | `src/pages/OwnerTickets.jsx` | `features/owner/pages/Tickets/index.jsx` | MOVE + RENAME | LOW | api.js (getOwnerTickets) | 15 min |

---

## 11. `pages/` — Customer Pages (25 files)

All map to `features/customer/pages/[FeatureName]/index.jsx`.

| # | Current Path | New Path | Action | Risk | Dependencies | Est. Time |
|---|---|---|---|---|---|---|
| 129 | `src/pages/CustomerAbout.jsx` | `features/customer/pages/About/index.jsx` | MOVE + RENAME | LOW | LegalPage.jsx (via shared) | 15 min |
| 130 | `src/pages/CustomerAddresses.jsx` | `features/customer/pages/Addresses/index.jsx` | MOVE + RENAME | LOW | AddressContext.jsx, AddressFormModal.jsx | 15 min |
| 131 | `src/pages/CustomerBookings.jsx` | `features/customer/pages/Bookings/index.jsx` | MOVE + RENAME | LOW | api.js (getMyBookings, createBooking) | 15 min |
| 132 | `src/pages/CustomerBoutiqueDetails.jsx` | `features/customer/pages/BoutiqueDetails/index.jsx` | MOVE + RENAME | LOW | api.js (getBoutiqueDetails), ServiceCard.jsx | 15 min |
| 133 | `src/pages/CustomerCart.jsx` | `features/customer/pages/Cart/index.jsx` | MOVE + RENAME | LOW | CartContext.jsx | 15 min |
| 134 | `src/pages/CustomerCheckout.jsx` | `features/customer/pages/Checkout/index.jsx` | MOVE + RENAME | LOW | api.js (validateCheckout, createCommerceOrder) | 15 min |
| 135 | `src/pages/CustomerContact.jsx` | `features/customer/pages/Contact/index.jsx` | MOVE + RENAME | LOW | — (static) | 15 min |
| 136 | `src/pages/CustomerHelp.jsx` | `features/customer/pages/Help/index.jsx` | MOVE + RENAME | LOW | Accordion.jsx | 15 min |
| 137 | `src/pages/CustomerHome.jsx` | `features/customer/pages/Home/index.jsx` | MOVE + RENAME | LOW | api.js (getPublicProducts), ProductCard.jsx, BoutiqueCard.jsx | 15 min |
| 138 | `src/pages/CustomerMeasurements.jsx` | `features/customer/pages/Measurements/index.jsx` | MOVE + RENAME | LOW | api.js (getMyMeasurements, saveMyMeasurements) | 15 min |
| 139 | `src/pages/CustomerNotifications.jsx` | `features/customer/pages/Notifications/index.jsx` | MOVE + RENAME | LOW | api.js (getCustomerNotifications) | 15 min |
| 140 | `src/pages/CustomerOrderDetail.jsx` | `features/customer/pages/OrderDetail/index.jsx` | MOVE + RENAME | MEDIUM | api.js (getMyCommerceOrder), TimelineCard.jsx, ReturnRequestModal.jsx, ExchangeRequestModal.jsx | 20 min |
| 141 | `src/pages/CustomerOrders.jsx` | `features/customer/pages/Orders/index.jsx` | MOVE + RENAME | LOW | api.js (getMyCommerceOrders) | 15 min |
| 142 | `src/pages/CustomerPrivacy.jsx` | `features/customer/pages/Privacy/index.jsx` | MOVE + RENAME | LOW | LegalPage.jsx (shared) | 15 min |
| 143 | `src/pages/CustomerProductDetail.jsx` | `features/customer/pages/ProductDetail/index.jsx` | MOVE + RENAME | LOW | api.js (getPublicProduct), ReviewCard.jsx, ReviewModal.jsx | 15 min |
| 144 | `src/pages/CustomerProfile.jsx` | `features/customer/pages/Profile/index.jsx` | MOVE + RENAME | LOW | api.js | 15 min |
| 145 | `src/pages/CustomerRefund.jsx` | `features/customer/pages/Refund/index.jsx` | MOVE + RENAME | LOW | — (static policy page) | 15 min |
| 146 | `src/pages/CustomerReturns.jsx` | `features/customer/pages/Returns/index.jsx` | MOVE + RENAME | LOW | ReturnsContext.jsx, api.js (getMyReturns) | 15 min |
| 147 | `src/pages/CustomerShipping.jsx` | `features/customer/pages/Shipping/index.jsx` | MOVE + RENAME | LOW | — (static policy page) | 15 min |
| 148 | `src/pages/CustomerShop.jsx` | `features/customer/pages/Shop/index.jsx` | MOVE + RENAME | LOW | api.js (getPublicProducts), ProductCard.jsx, CategoryList.jsx | 15 min |
| 149 | `src/pages/CustomerTerms.jsx` | `features/customer/pages/Terms/index.jsx` | MOVE + RENAME | LOW | LegalPage.jsx (shared) | 15 min |
| 150 | `src/pages/CustomerWishlist.jsx` | `features/customer/pages/Wishlist/index.jsx` | MOVE + RENAME | LOW | WishlistContext.jsx | 15 min |
| 151 | `src/pages/CustomTailoring.jsx` | `features/customer/pages/CustomTailoring/index.jsx` | MOVE + RENAME | LOW | api.js (createBooking) | 15 min |
| 152 | `src/pages/OrderSuccess.jsx` | `features/customer/pages/OrderSuccess/index.jsx` | MOVE + RENAME | LOW | — (receipt display page) | 15 min |
| 153 | `src/pages/WishlistPage.jsx` | **DELETE** (duplicate of CustomerWishlist.jsx — evaluate for content preservation first) | DELETE | LOW | App.jsx imports it; verify content, redirect route to CustomerWishlist | 10 min |

---

## 12. `pages/` — Auth Pages (3 files)

| # | Current Path | New Path | Action | Risk | Dependencies | Est. Time |
|---|---|---|---|---|---|---|
| 154 | `src/pages/Login.jsx` | `features/shared/pages/Auth/Login.jsx` (shared between admin & owner roles) | MOVE | MEDIUM | AuthContext.jsx | 15 min |
| 155 | `src/pages/ResetPassword.jsx` | `features/shared/pages/Auth/ResetPassword.jsx` | MOVE | LOW | api.js (resetPassword) | 10 min |
| 156 | `src/pages/SetPassword.jsx` | `features/shared/pages/Auth/SetPassword.jsx` | MOVE | LOW | api.js (setPassword) | 10 min |

---

## 13. `pages/` — Shared Pages (2 files)

| # | Current Path | New Path | Action | Risk | Dependencies | Est. Time |
|---|---|---|---|---|---|---|
| 157 | `src/pages/Bookings.jsx` | `features/shared/pages/Bookings/index.jsx` (admin booking dashboard) | MOVE + RENAME | LOW | api.js (getBookings) | 15 min |
| 158 | `src/pages/DesignSystemShowcase.jsx` | `features/shared/pages/DesignSystem/index.jsx` | MOVE + RENAME | LOW | AppPreviewMockup.jsx, all ui/ components | 10 min |

---

## 14. `services/` (2 files)

| # | Current Path | New Path | Action | Risk | Dependencies | Est. Time |
|---|---|---|---|---|---|---|
| 159 | `src/services/api.js` | SPLIT into: `core/services/api/client.js` (axios instance, interceptors), `core/services/api/boutique.api.js`, `core/services/api/owner.api.js`, `core/services/api/customer.api.js`, `core/services/api/order.api.js`, `core/services/api/product.api.js`, `core/services/api/auth.api.js`, `core/services/api/notifications.api.js`, `core/services/api/payments.api.js`, `core/services/api/tickets.api.js`, `core/services/api/subscriptions.api.js`, `core/services/api/coupon.api.js`, `core/services/api/review.api.js`, `core/services/api/booking.api.js`, `core/services/api/category.api.js` | SPLIT | HIGH | Every page file imports from this; contains both `api` and `customerApi` instances | 4 hr |
| 160 | `src/services/imageConfig.js` | `core/services/imageConfig.js` | MOVE | LOW | Commerce components (ProductCard, BoutiqueCard, PremiumImage) | 10 min |

---

## 15. Barrel / Index Files (New)

These are **new files** that should be created as part of the migration to simplify imports.

| # | New Path | Action | Purpose |
|---|---|---|---|
| 161 | `core/components/index.js` | CREATE | Re-export all core component groups |
| 162 | `core/components/ui/index.js` | CREATE | Re-export all UI primitives |
| 163 | `core/components/layout/index.js` | CREATE | Re-export layout components |
| 164 | `core/components/commerce/index.js` | CREATE | Re-export commerce components |
| 165 | `core/components/modals/index.js` | CREATE | Re-export modal components |
| 166 | `core/components/navigation/index.js` | CREATE | Re-export navigation components |
| 167 | `core/components/forms/index.js` | CREATE | Re-export form components |
| 168 | `core/components/tables/index.js` | CREATE | Re-export table components |
| 169 | `core/components/boutique/index.js` | CREATE | Re-export boutique tab components |
| 170 | `core/components/display/index.js` | CREATE | Re-export display components |
| 171 | `core/context/index.js` | CREATE | Re-export all context providers |
| 172 | `core/hooks/index.js` | CREATE | Re-export all custom hooks |
| 173 | `core/services/index.js` | CREATE | Re-export all services |
| 174 | `core/services/api/index.js` | CREATE | Re-export all API modules |
| 175 | `core/styles/index.js` | CREATE | CSS entry (imports global.css) |
| 176 | `features/admin/index.js` | CREATE | Lazy-load routing for admin feature |
| 177 | `features/owner/index.js` | CREATE | Lazy-load routing for owner feature |
| 178 | `features/customer/index.js` | CREATE | Lazy-load routing for customer feature |
| 179 | `features/shared/index.js` | CREATE | Lazy-load routing for shared pages |

---

## Summary Statistics

| Category | Files Moved | Files Deleted | Files Split | Files Created (New) | Total Rows |
|---|---|---|---|---|---|
| Root (3) | 2 | 0 | 1 | 0 | 3 |
| components/ root (22) | 16 | 3 (Card, ProductCard, Skeleton) | 0 | 0 | 19 |
| components/boutique (4) | 4 | 0 | 0 | 0 | 4 |
| components/commerce (12) | 12 | 0 | 0 | 0 | 12 |
| components/layout (6) | 6 | 0 | 0 | 0 | 6 |
| components/ui (28) | 26 | 0 | 0 | 0 | 26 |
| context (9) | 9 | 0 | 0 | 0 | 9 |
| hooks (1) | 1 | 0 | 0 | 0 | 1 |
| pages — Admin (26) | 25 | 0 | 0 | 0 | 25 |
| pages — Owner (17) | 17 | 0 | 0 | 0 | 17 |
| pages — Customer (25) | 24 | 1 (WishlistPage) | 0 | 0 | 25 |
| pages — Auth (3) | 3 | 0 | 0 | 0 | 3 |
| pages — Shared (2) | 2 | 0 | 0 | 0 | 2 |
| services (2) | 1 | 0 | 1 | 0 | 2 |
| Barrel files (new) | — | — | — | 19 | 19 |
| **Totals** | **148** | **4** | **2** | **19** | **173** |

### Execution Order (Recommended)

1. **Phase 1** — `core/services/imageConfig.js` and `core/services/api/*` (split). Update all imports across codebase. Highest risk; do first so everything else can use new paths.
2. **Phase 2** — `core/context/` and `core/hooks/`. These have broad import surfaces.
3. **Phase 3** — `core/components/ui/`, `core/components/layout/`, `core/components/commerce/`. No business logic, pure presentational.
4. **Phase 4** — `core/components/` (modals, navigation, forms, tables, boutique, display).
5. **Phase 5** — `features/*/pages/` — feature pages. Each feature can be migrated independently.
6. **Phase 6** — `core/main.jsx`, `core/App.jsx`, `core/styles/`. Last, after all import paths are updated.
7. **Phase 7** — Barrel files (`index.js`) and DELETE marked files.
