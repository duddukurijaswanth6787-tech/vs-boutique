# VS Boutique ERP — Feature Ownership Map

**Date:** 2026-06-26
**Scope:** `web/src/` (166 source files, ~1,592 KB)
**Purpose:** Exhaustive, enterprise-grade ownership registry mapping every piece of frontend code to its owning feature. This document governs migration planning, team allocation, and domain boundary enforcement.

---

## Section 1: Feature Ownership Map

Every feature block follows this schema:

```
Feature: Feature Name
Owns:
  - pages (exclusive page files)
  - components (feature-specific components)
  - contexts (feature-specific contexts)
  - API functions (exclusive API functions)
  - assets (feature-specific assets)
Shared:
  - core components used by this feature
  - core hooks used by this feature
  - core services used by this feature
  - core contexts used by this feature
```

---

## Section 2: Complete Feature Inventory

---

### Super Admin Features (21 features)

---

#### 1. Command Center
**Portal:** Admin
**Owns:**
- Pages: `pages/AdminCommandCenter.jsx`
- Components: *(none exclusive — uses dashboard widgets)*
- API functions: `getAdminCommandCenter`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`, `context/AdminNotificationContext.jsx`
- Services: `services/api.js` (api instance)
**Risk:** Low | **Priority:** 9

---

#### 2. Revenue Analytics
**Portal:** Admin
**Owns:**
- Pages: `pages/AdminRevenue.jsx`
- Components: *(revenue chart widgets embedded in page)*
- API functions: `getAdminRevenue`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`, `context/AdminNotificationContext.jsx`
- Services: `services/api.js`
**Risk:** Low | **Priority:** 8

---

#### 3. Fraud & Spam
**Portal:** Admin
**Owns:**
- Pages: `pages/AdminFraud.jsx`
- Components: *(fraud detection widgets embedded in page)*
- API functions: `getAdminFraud`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`, `context/AdminNotificationContext.jsx`
- Services: `services/api.js`
**Risk:** Low | **Priority:** 8

---

#### 4. Boutique Management
**Portal:** Admin
**Owns:**
- Pages: `pages/Boutiques.jsx`, `pages/BoutiqueDetails.jsx`
- Components: `components/BoutiqueEditModal.jsx`, `components/BoutiqueForm.jsx`, `components/BoutiqueTable.jsx`, `components/boutique/AccessControlTab.jsx`, `components/boutique/BoutiqueProfileTab.jsx`, `components/boutique/DangerZoneTab.jsx`, `components/boutique/OwnerDetailsTab.jsx`
- API functions (7): `getBoutiques`, `getBoutiqueDetails`, `addBoutique`, `updateBoutique`, `updateBoutiqueStatus`, `deleteBoutique`, `uploadImage`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`, `context/AuthContext.jsx`, `context/AdminNotificationContext.jsx`
- Services: `services/api.js`, `services/imageConfig.js`
**Risk:** Medium | **Priority:** 6
**Notes:** BoutiqueEditModal, BoutiqueForm, and BoutiqueTable may be refactored into feature-specific subfolder.

---

#### 5. Category Management
**Portal:** Admin
**Owns:**
- Pages: `pages/Categories.jsx`
- Components: `components/CategoryList.jsx`
- API functions (10): `getAdminCategories`, `getActiveCategories`, `getCategory`, `createCategory`, `updateCategory`, `deleteCategory`, `toggleCategory`, `createSubCategory`, `updateSubCategory`, `deleteSubCategory`, `toggleSubCategory`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`, `context/AdminNotificationContext.jsx`
- Services: `services/api.js`
**Risk:** Low | **Priority:** 7

---

#### 6. Customer Management
**Portal:** Admin
**Owns:**
- Pages: `pages/Customers.jsx`
- API functions (7): `getCustomers`, `getCustomerProfile`, `toggleCustomerBlock`, `exportCustomerData`, `getCustomerAddresses`, `addCustomerAddress`, `updateCustomerAddress`, `deleteCustomerAddress`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`, `context/AdminNotificationContext.jsx`
- Services: `services/api.js`
**Risk:** Low | **Priority:** 7

---

#### 7. Order Management
**Portal:** Admin
**Owns:**
- Pages: `pages/AdminOrders.jsx`, `pages/OrderDetails.jsx` (shared with owner)
- API functions (6): `getOrders`, `getOrderById`, `createOrder`, `updateOrderStatus`, `updateOrderPayment`, `updateOrderMeasurements`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`, `context/AdminNotificationContext.jsx`
- Services: `services/api.js`
**Risk:** Medium | **Priority:** 5
**Notes:** OrderDetails page is shared between admin and owner routes. Ownership is joint.

---

#### 8. Commerce Orders
**Portal:** Admin
**Owns:**
- Pages: `pages/AdminCommerceOrders.jsx`
- API functions (8): `getAdminCommerceOrders`, `getAdminCommerceOrder`, `confirmCommerceOrder`, `packCommerceOrder`, `shipCommerceOrder`, `outForDeliveryCommerceOrder`, `deliverCommerceOrder`, `cancelCommerceOrder`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`, `context/AdminNotificationContext.jsx`
- Services: `services/api.js`
**Risk:** Medium | **Priority:** 6
**Notes:** `getAdminCommerceOrders` calls `/owner/orders` endpoint — known naming bug; should be `getOwnerCommerceOrders`.

---

#### 9. Payment Management
**Portal:** Admin
**Owns:**
- Pages: `pages/Payments.jsx`
- API functions (4): `getAllPayments`, `getPaymentReports`, `refundPayment`, `processPayout`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`, `context/AdminNotificationContext.jsx`
- Services: `services/api.js`
**Risk:** Low | **Priority:** 7

---

#### 10. Payout Settlements
**Portal:** Admin
**Owns:**
- Pages: `pages/AdminPayouts.jsx`
- API functions (4): `getAdminPayouts`, `generatePayout`, `updatePayoutStatus`, `getPlatformCommissionSettings`, `updatePlatformCommissionSettings`, `setBoutiqueCommissionOverride`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`, `context/AdminNotificationContext.jsx`
- Services: `services/api.js`
**Risk:** Low | **Priority:** 7

---

#### 11. Subscription Management
**Portal:** Admin
**Owns:**
- Pages: `pages/AdminSubscriptions.jsx`
- API functions (10): `getAdminSubscriptions`, `updateAdminSubscription`, `getSubscriptionPlans`, `createSubscriptionPlan`, `updateSubscriptionPlan`, `cloneSubscriptionPlan`, `deleteSubscriptionPlan`, `getCustomPlanRequests`, `updateCustomPlanRequest`, `getAdminSubscriptionAnalytics`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`, `context/AdminNotificationContext.jsx`
- Services: `services/api.js`
**Risk:** High | **Priority:** 3
**Notes:** 1,899-line file — largest in codebase. Must be decomposed into sub-components before migration.

---

#### 12. Coupon Management
**Portal:** Admin
**Owns:**
- Pages: `pages/AdminCoupons.jsx`
- API functions (6): `getAdminCoupons`, `getAdminCoupon`, `createAdminCoupon`, `updateAdminCoupon`, `toggleAdminCoupon`, `deleteAdminCoupon`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`, `context/AdminNotificationContext.jsx`
- Services: `services/api.js`
**Risk:** Low | **Priority:** 8

---

#### 13. Support Tickets
**Portal:** Admin
**Owns:**
- Pages: `pages/AdminTickets.jsx`
- API functions (9): `getAdminTickets`, `getTicketById`, `getTicketMessages`, `createTicketMessage`, `getTicketNotes`, `createTicketNote`, `assignTicket`, `updateTicketStatusText`, `getTicketAnalytics`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`, `context/AdminNotificationContext.jsx`
- Services: `services/api.js`
**Risk:** Low | **Priority:** 7

---

#### 14. Product Reviews Moderation
**Portal:** Admin
**Owns:**
- Pages: `pages/AdminProductReviews.jsx`
- API functions (5): `getAdminProductReviews`, `approveProductReview`, `rejectProductReview`, `hideProductReview`, `adminDeleteProductReview`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`, `context/AdminNotificationContext.jsx`
- Services: `services/api.js`
**Risk:** Low | **Priority:** 8

---

#### 15. Notification Broadcast
**Portal:** Admin
**Owns:**
- Pages: `pages/AdminNotifications.jsx`
- API functions (6): `broadcastNotification`, `getNotificationAnalytics`, `getNotificationTemplates`, `createNotificationTemplate`, `getNotificationCampaigns`, `createNotificationCampaign`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`, `context/AdminNotificationContext.jsx`
- Services: `services/api.js`
**Risk:** Low | **Priority:** 8

---

#### 16. Delivery Tracking
**Portal:** Admin
**Owns:**
- Pages: `pages/AdminDeliveryTracking.jsx`
- API functions (3): `getOrderTracking`, `createOrderTracking`, `updateTrackingStatus`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`, `context/AdminNotificationContext.jsx`
- Services: `services/api.js`
**Risk:** Low | **Priority:** 9

---

#### 17. Activity Logs
**Portal:** Admin
**Owns:**
- Pages: `pages/ActivityLogs.jsx`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`, `context/AdminNotificationContext.jsx`
- Services: `services/api.js`
**Risk:** Low | **Priority:** 10

---

#### 18. Wishlists & Demand
**Portal:** Admin
**Owns:**
- Pages: `pages/AdminWishlists.jsx`
- API functions (1): `getAdminWishlists`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`, `context/AdminNotificationContext.jsx`
- Services: `services/api.js`
**Risk:** Low | **Priority:** 9

---

#### 19. Marketplace Insights
**Portal:** Admin
**Owns:**
- Pages: `pages/MarketplaceInsights.jsx`
- API functions (1): `getMarketplaceInsights`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`, `context/AdminNotificationContext.jsx`
- Services: `services/api.js`
**Risk:** Low | **Priority:** 9

---

#### 20. Settings
**Portal:** Admin
**Owns:**
- Pages: `pages/AdminSettings.jsx`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`, `context/AdminNotificationContext.jsx`
- Services: `services/api.js`
**Risk:** Low | **Priority:** 9

---

#### 21. Auth (Admin)
**Portal:** Admin
**Owns:**
- Pages: `pages/Login.jsx`, `pages/ResetPassword.jsx`, `pages/SetPassword.jsx`
- API functions (3): `login` (inline in `AuthContext.jsx`), `setPassword`, `resetPassword`
- Contexts: `context/AuthContext.jsx` (shared with owner)
- Components: `components/ProtectedRoute` (defined inline in `App.jsx`)
**Shared:**
- Core: `components/ui/*`
- Services: `services/api.js`
**Risk:** High | **Priority:** 2
**Notes:** Auth underpins every portal. ProtectedRoute and AdminLayout are inline in App.jsx — must be extracted.

---

### Owner Admin Features (14 features)

---

#### 1. Dashboard
**Portal:** Owner
**Owns:**
- Pages: `pages/OwnerDashboard.jsx`
- API functions (1): `getOwnerDashboard`
**Shared:**
- Core: `components/ui/*`, `components/commerce/*`
- Context: `context/AuthContext.jsx`
- Services: `services/api.js`, `services/imageConfig.js`
**Risk:** Low | **Priority:** 9

---

#### 2. Products
**Portal:** Owner
**Owns:**
- Pages: `pages/OwnerProducts.jsx`
- API functions (19): `getOwnerProducts`, `getOwnerProduct`, `createOwnerProduct`, `updateOwnerProduct`, `deleteOwnerProduct`, `getOwnerProductImages`, `addOwnerProductImage`, `deleteOwnerProductImage`, `getOwnerBrands`, `createOwnerBrand`, `updateOwnerBrand`, `deleteOwnerBrand`, `getOwnerTags`, `createOwnerTag`, `updateOwnerTag`, `deleteOwnerTag`, `getProductVariants`, `createProductVariant`, `updateProductVariant`, `deleteProductVariant`, `updateProductInventory`, `getProductInventoryLogs`
**Shared:**
- Core: `components/ui/*`
- Context: `context/AuthContext.jsx`
- Services: `services/api.js`, `services/imageConfig.js`
**Risk:** Medium | **Priority:** 4

---

#### 3. Services
**Portal:** Owner
**Owns:**
- Pages: `pages/OwnerServices.jsx`
- API functions (1): `updateOwnerServices`
**Shared:**
- Core: `components/ui/*`
- Context: `context/AuthContext.jsx`
- Services: `services/api.js`, `services/imageConfig.js`
**Risk:** Low | **Priority:** 9

---

#### 4. Gallery
**Portal:** Owner
**Owns:**
- Pages: `pages/OwnerGallery.jsx`
- API functions (2): `updateOwnerGallery`, `updateOwnerMedia`
**Shared:**
- Core: `components/ui/*`
- Context: `context/AuthContext.jsx`
- Services: `services/api.js`, `services/imageConfig.js`
**Risk:** Low | **Priority:** 9

---

#### 5. Orders
**Portal:** Owner
**Owns:**
- Pages: `pages/OwnerOrders.jsx`, `pages/OrderDetails.jsx` (shared with admin)
- API functions (8): `getAdminCommerceOrders` (misnamed), `getAdminCommerceOrder`, `confirmCommerceOrder`, `packCommerceOrder`, `shipCommerceOrder`, `outForDeliveryCommerceOrder`, `deliverCommerceOrder`, `cancelCommerceOrder`
**Shared:**
- Core: `components/ui/*`, `components/commerce/*`
- Context: `context/AuthContext.jsx`
- Services: `services/api.js`
**Risk:** Medium | **Priority:** 5
**Notes:** `getAdminCommerceOrders` function naming bug — calls `/owner/orders`.

---

#### 6. Bookings
**Portal:** Owner
**Owns:**
- Pages: `pages/OwnerBookings.jsx`
- API functions (1): `getOwnerBookings`
**Shared:**
- Core: `components/ui/*`
- Context: `context/AuthContext.jsx`
- Services: `services/api.js`
**Risk:** Low | **Priority:** 9

---

#### 7. Delivery Tracking
**Portal:** Owner
**Owns:**
- Pages: `pages/OwnerDeliveryTracking.jsx`
- API functions: *(same as Admin Delivery Tracking — shares `getOrderTracking`, `createOrderTracking`, `updateTrackingStatus`)*
**Shared:**
- Core: `components/ui/*`
- Context: `context/AuthContext.jsx`
- Services: `services/api.js`
**Risk:** Low | **Priority:** 9

---

#### 8. Subscriptions
**Portal:** Owner
**Owns:**
- Pages: `pages/OwnerSubscription.jsx`
- API functions (7): `getOwnerSubscription`, `upgradeSubscription`, `createSubscriptionPaymentOrder`, `verifySubscriptionPayment`, `cancelSubscription`, `requestCustomPlan`, `getOwnerCustomPlanRequests`
**Shared:**
- Core: `components/ui/*`
- Context: `context/AuthContext.jsx`
- Services: `services/api.js`
**Risk:** Medium | **Priority:** 6

---

#### 9. Analytics
**Portal:** Owner
**Owns:**
- Pages: `pages/OwnerAnalytics.jsx`
**Shared:**
- Core: `components/ui/*`
- Context: `context/AuthContext.jsx`
- Services: `services/api.js`, `services/imageConfig.js`
**Risk:** Low | **Priority:** 10

---

#### 10. Reviews
**Portal:** Owner
**Owns:**
- Pages: `pages/OwnerReviews.jsx`, `pages/OwnerProductReviews.jsx`
- API functions (5): `getOwnerReviews`, `getOwnerProductReviews`, `replyToOwnerProductReview`, `deleteOwnerProductReviewReply`, `getProductReviewSummary`
**Shared:**
- Core: `components/ui/*`, `components/commerce/ReviewCard.jsx`
- Context: `context/AuthContext.jsx`
- Services: `services/api.js`
**Risk:** Low | **Priority:** 8

---

#### 11. Coupons
**Portal:** Owner
**Owns:**
- Pages: `pages/OwnerCoupons.jsx`
- API functions (5): `getOwnerCoupons`, `createOwnerCoupon`, `updateOwnerCoupon`, `toggleOwnerCoupon`, `deleteOwnerCoupon`
**Shared:**
- Core: `components/ui/*`
- Context: `context/AuthContext.jsx`
- Services: `services/api.js`
**Risk:** Low | **Priority:** 8

---

#### 12. Tickets
**Portal:** Owner
**Owns:**
- Pages: `pages/OwnerTickets.jsx`
- API functions (1): `getOwnerTickets`
**Shared:**
- Core: `components/ui/*`
- Context: `context/AuthContext.jsx`
- Services: `services/api.js`
**Risk:** Low | **Priority:** 9

---

#### 13. Payouts
**Portal:** Owner
**Owns:**
- Pages: `pages/OwnerPayouts.jsx`
- API functions (1): `getOwnerPayouts`
**Shared:**
- Core: `components/ui/*`
- Context: `context/AuthContext.jsx`
- Services: `services/api.js`
**Risk:** Low | **Priority:** 9

---

#### 14. Settings
**Portal:** Owner
**Owns:**
- Pages: `pages/OwnerSettings.jsx`, `pages/OwnerProfile.jsx`, `pages/OwnerDesigns.jsx`
- API functions (3): `getOwnerProfile`, `changeOwnerPassword`, `getOwnerStaff`
- Components: `components/OwnerLayout.jsx`
**Shared:**
- Core: `components/ui/*`
- Context: `context/AuthContext.jsx`
- Services: `services/api.js`, `services/imageConfig.js`
**Risk:** Low | **Priority:** 8

---

### Customer Features (17 features)

---

#### 1. Home
**Portal:** Customer
**Owns:**
- Pages: `pages/CustomerHome.jsx`
- Components: `components/MegaMenu.jsx`, `components/MobileNavSheet.jsx`, `components/Navbar.jsx`, `components/commerce/BoutiqueCard.jsx`, `components/commerce/CollectionCard.jsx`, `components/commerce/ProductCard.jsx`, `components/commerce/ServiceCard.jsx`, `components/commerce/DiscountBadge.jsx`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`
- Context: `context/CartContext.jsx`, `context/WishlistContext.jsx`, `context/CustomerAuthContext.jsx`, `context/NotificationContext.jsx`
- Services: `services/api.js`, `services/imageConfig.js`
**Risk:** Medium | **Priority:** 4

---

#### 2. Shop
**Portal:** Customer
**Owns:**
- Pages: `pages/CustomerShop.jsx`, `pages/ProductCatalog.jsx`
- API functions (2): `getPublicProducts`, `getPublicProduct`
- Components: `components/commerce/ProductCard.jsx`, `components/commerce/DiscountBadge.jsx`, `components/commerce/AvailabilityBadge.jsx`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`
- Context: `context/CartContext.jsx`, `context/WishlistContext.jsx`, `context/CustomerAuthContext.jsx`
- Services: `services/api.js`, `services/imageConfig.js`
**Risk:** Low | **Priority:** 6

---

#### 3. Product Detail
**Portal:** Customer
**Owns:**
- Pages: `pages/CustomerProductDetail.jsx`, `pages/ProductDetail.jsx`
- Components: `components/commerce/RatingComponent.jsx`, `components/commerce/ReviewCard.jsx`, `components/commerce/PriceComponent.jsx`, `components/commerce/AvailabilityBadge.jsx`, `components/commerce/DeliveryBadge.jsx`
- Contexts: `context/ReviewContext.jsx`
- API functions (5): `getProductReviews`, `getProductReviewSummary`, `createProductReview`, `updateProductReview`, `deleteProductReview`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`
- Context: `context/CartContext.jsx`, `context/WishlistContext.jsx`, `context/CustomerAuthContext.jsx`
- Services: `services/api.js`, `services/imageConfig.js`
**Risk:** Medium | **Priority:** 5

---

#### 4. Cart
**Portal:** Customer
**Owns:**
- Pages: `pages/CustomerCart.jsx`
- Contexts: `context/CartContext.jsx`
- API functions (5): `getCart`, `addToCart`, `updateCartItem`, `removeCartItem`, `clearCart`
- Components: `components/commerce/PriceComponent.jsx`, `components/commerce/DeliveryBadge.jsx`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`
- Context: `context/CustomerAuthContext.jsx`
- Services: `services/api.js` (customerApi)
**Risk:** Medium | **Priority:** 5
**Notes:** CartContext is a stateful provider — must be migrated with its consumer pages.

---

#### 5. Checkout
**Portal:** Customer
**Owns:**
- Pages: `pages/CustomerCheckout.jsx`, `pages/OrderSuccess.jsx`
- API functions (4): `validateCheckout`, `createCommerceOrder`, `createPayment`, `verifyPayment`
- Components: `components/AddressFormModal.jsx`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`
- Context: `context/CustomerAuthContext.jsx`, `context/CartContext.jsx`, `context/AddressContext.jsx`
- Services: `services/api.js` (customerApi)
**Risk:** High | **Priority:** 3
**Notes:** Payment flow involves third-party integration (Razorpay/PayU). Must preserve callback URLs and webhook handling.

---

#### 6. Wishlist
**Portal:** Customer
**Owns:**
- Pages: `pages/CustomerWishlist.jsx`, `pages/WishlistPage.jsx`
- Contexts: `context/WishlistContext.jsx`
- API functions (3): `getWishlist`, `addToWishlist`, `removeFromWishlist`
- Components: `components/commerce/ProductCard.jsx`
**Shared:**
- Core: `components/ui/*`
- Context: `context/CustomerAuthContext.jsx`
- Services: `services/api.js` (customerApi)
**Risk:** Low | **Priority:** 7
**Notes:** Two pages for wishlist (CustomerWishlist + WishlistPage) — evaluate if WishlistPage is redundant.

---

#### 7. Orders
**Portal:** Customer
**Owns:**
- Pages: `pages/CustomerOrders.jsx`, `pages/CustomerOrderDetail.jsx`
- API functions (5): `getMyCommerceOrders`, `getMyCommerceOrder`, `customerCancelOrder`, `getOrderTimeline`, `getCustomerOrderTracking`
- Components: `components/commerce/TimelineCard.jsx`, `components/commerce/StatusBadge.jsx`
**Shared:**
- Core: `components/ui/*`
- Context: `context/CustomerAuthContext.jsx`
- Services: `services/api.js` (customerApi)
**Risk:** Low | **Priority:** 6

---

#### 8. Returns
**Portal:** Customer
**Owns:**
- Pages: `pages/CustomerReturns.jsx`
- Contexts: `context/ReturnsContext.jsx`
- API functions (3): `createReturnRequest`, `getMyReturns`, `getReturnDetails`
- Components: `components/ReturnRequestModal.jsx`
**Shared:**
- Core: `components/ui/*`
- Context: `context/CustomerAuthContext.jsx`
- Services: `services/api.js` (customerApi)
**Risk:** Low | **Priority:** 8

---

#### 9. Exchanges
**Portal:** Customer
**Owns:**
- API functions (3): `createExchangeRequest`, `getMyExchanges`, `getExchangeDetails`
- Components: `components/ExchangeRequestModal.jsx`
**Shared:**
- Core: `components/ui/*`
- Context: `context/CustomerAuthContext.jsx`
- Services: `services/api.js` (customerApi)
**Risk:** Low | **Priority:** 9
**Notes:** Currently embedded in Returns page or accessible as separate flow. No dedicated page — functionality may live within Returns or Orders page.

---

#### 10. Addresses
**Portal:** Customer
**Owns:**
- Pages: `pages/CustomerAddresses.jsx`
- Contexts: `context/AddressContext.jsx`
- API functions (5): `getAddresses`, `createAddress`, `updateAddress`, `deleteAddress`, `setDefaultAddress`
- Components: `components/AddressFormModal.jsx` (shared with checkout)
**Shared:**
- Core: `components/ui/*`
- Context: `context/CustomerAuthContext.jsx`
- Services: `services/api.js` (customerApi)
**Risk:** Low | **Priority:** 8

---

#### 11. Profile
**Portal:** Customer
**Owns:**
- Pages: `pages/CustomerProfile.jsx`
- Components: `components/CustomerLayout.jsx`
**Shared:**
- Core: `components/ui/*`
- Context: `context/CustomerAuthContext.jsx`
- Services: `services/api.js` (customerApi)
**Risk:** Low | **Priority:** 9

---

#### 12. Notifications
**Portal:** Customer
**Owns:**
- Pages: `pages/CustomerNotifications.jsx`
- Contexts: `context/NotificationContext.jsx`
- API functions (5): `getCustomerNotifications`, `getCustomerUnreadNotificationCount`, `markCustomerNotificationRead`, `markAllCustomerNotificationsRead`, `deleteCustomerNotification`
**Shared:**
- Core: `components/ui/*`
- Context: `context/CustomerAuthContext.jsx`
- Services: `services/api.js` (customerApi)
**Risk:** Low | **Priority:** 8

---

#### 13. Tailoring
**Portal:** Customer
**Owns:**
- Pages: `pages/CustomTailoring.jsx`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`
- Context: `context/CustomerAuthContext.jsx`
- Services: `services/api.js`, `services/imageConfig.js`
**Risk:** Low | **Priority:** 9

---

#### 14. Measurements
**Portal:** Customer
**Owns:**
- Pages: `pages/CustomerMeasurements.jsx`
- API functions (3): `getMyMeasurements`, `saveMyMeasurements`, `deleteMyMeasurements`
**Shared:**
- Core: `components/ui/*`
- Context: `context/CustomerAuthContext.jsx`
- Services: `services/api.js` (customerApi)
**Risk:** Low | **Priority:** 9

---

#### 15. Bookings
**Portal:** Customer
**Owns:**
- Pages: `pages/CustomerBookings.jsx`
- API functions (2): `getMyBookings`, `createBooking`
**Shared:**
- Core: `components/ui/*`
- Context: `context/CustomerAuthContext.jsx`
- Services: `services/api.js` (customerApi)
**Risk:** Low | **Priority:** 9

---

#### 16. Boutique Detail
**Portal:** Customer
**Owns:**
- Pages: `pages/CustomerBoutiqueDetails.jsx`
- Components: `components/commerce/BoutiqueCard.jsx`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`
- Context: `context/CustomerAuthContext.jsx`
- Services: `services/api.js`, `services/imageConfig.js`
**Risk:** Low | **Priority:** 9

---

#### 17. Static Pages
**Portal:** Customer
**Owns:**
- Pages: `pages/CustomerAbout.jsx`, `pages/CustomerContact.jsx`, `pages/CustomerHelp.jsx`, `pages/CustomerPrivacy.jsx`, `pages/CustomerTerms.jsx`, `pages/CustomerRefund.jsx`, `pages/CustomerShipping.jsx`
- Components: `components/LegalPage.jsx`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`
- Context: `context/CustomerAuthContext.jsx`
**Risk:** Low | **Priority:** 10

---

### Shared Features (7 features)

---

#### 1. Auth
**Portal:** Shared (Admin + Owner)
**Owns:**
- Contexts: `context/AuthContext.jsx`, `context/CustomerAuthContext.jsx`
- Components: `components/ProtectedRoute` (inline in `App.jsx` — must be extracted)
- API functions (1): `login` (inline in `AuthContext.jsx`)
**Shared with:**
- Services: `services/api.js` (api + customerApi instances)
**Risk:** High | **Priority:** 1
**Notes:** Auth is the most critical shared dependency. ProtectedRoute is currently defined inline in App.jsx:94-114. Must be extracted to its own file. Login logic lives inside AuthContext rather than a dedicated API module.

---

#### 2. Design System
**Portal:** Shared (all portals)
**Owns:**
- Pages: `pages/DesignSystemShowcase.jsx`
**Risk:** Low | **Priority:** 10
**Notes:** Standalone showcase — no production dependencies.

---

#### 3. Bookings (Admin View)
**Portal:** Admin
**Owns:**
- Pages: `pages/Bookings.jsx`
- API functions (6): `getBookings`, `getBookingStats`, `updateBookingStatus`, `rescheduleBooking`, `assignBooking`, `updateBookingNotes`, `triggerReminder`
**Shared:**
- Core: `components/ui/*`, `components/layout/*`
- Context: `context/AdminNotificationContext.jsx`
- Services: `services/api.js`
**Risk:** Low | **Priority:** 7

---

#### 4. Reviews (Admin Moderation)
**Portal:** Admin
**Owns:**
- Pages: `pages/Reviews.jsx`
- Components: `components/ReviewModal.jsx`
- API functions (4): `getAllReviews`, `getOwnerReviews`, `getReviewStats`, `moderateReview`, `replyToReview`
**Shared:**
- Core: `components/ui/*`
- Context: `context/AdminNotificationContext.jsx`
- Services: `services/api.js`
**Risk:** Low | **Priority:** 8

---

#### 5. UI Library
**Portal:** Shared (all portals)
**Owns:**
- Components (28): `components/ui/Accordion.jsx`, `Avatar.jsx`, `Badge.jsx`, `BottomSheet.jsx`, `Button.jsx`, `Card.jsx`, `Checkbox.jsx`, `Chip.jsx`, `Drawer.jsx`, `EmptyState.jsx`, `ErrorState.jsx`, `FAB.jsx`, `IconButton.jsx`, `Input.jsx`, `LoadingOverlay.jsx`, `Modal.jsx`, `PremiumImage.jsx`, `Radio.jsx`, `SearchInput.jsx`, `Select.jsx`, `Skeleton.jsx`, `Stepper.jsx`, `Switch.jsx`, `Tabs.jsx`, `Textarea.jsx`, `Timeline.jsx`, `Toast.jsx`, `Tooltip.jsx`
- Components (6): `components/layout/Container.jsx`, `Grid.jsx`, `PageFooter.jsx`, `PageHeader.jsx`, `Section.jsx`, `Stack.jsx`
**Risk:** Low | **Priority:** 7
**Notes:** No API dependencies. Pure presentational components. Migration is low-risk but must maintain Tailwind styling contracts.

---

#### 6. Commerce Components
**Portal:** Shared (Customer + Admin + Owner)
**Owns:**
- Components (12): `components/commerce/AvailabilityBadge.jsx`, `BoutiqueCard.jsx`, `CollectionCard.jsx`, `DeliveryBadge.jsx`, `DiscountBadge.jsx`, `PriceComponent.jsx`, `ProductCard.jsx`, `RatingComponent.jsx`, `ReviewCard.jsx`, `ServiceCard.jsx`, `StatusBadge.jsx`, `TimelineCard.jsx`
**Shared with:**
- Services: `services/imageConfig.js` (product image resolution)
**Risk:** Low | **Priority:** 8

---

#### 7. Theme
**Portal:** Shared (all portals)
**Owns:**
- Files: `src/index.css`, `tailwind.config.js`
- Config: `postcss.config.js`, `vite.config.js`
- Assets: `public/favicon.svg`, `public/icons.svg`
- Services: `services/imageConfig.js` (147 Unsplash URLs, image resolver utilities)
**Risk:** Medium | **Priority:** 6
**Notes:** Theme changes cascade across all portals. imageConfig contains all product/service image lookups used by customer, owner, and admin features.

---

## Section 3: Ownership Metadata

### Complete Ownership Registry

| # | Feature | Portal | Pages Owned | Components Owned | API Functions | Contexts | Risk | Priority |
|---|---------|--------|-------------|------------------|---------------|----------|------|----------|
| | **Super Admin** | | | | | | | |
| 1 | Command Center | Admin | 1 | 0 | 1 | 0 | Low | 9 |
| 2 | Revenue Analytics | Admin | 1 | 0 | 1 | 0 | Low | 8 |
| 3 | Fraud & Spam | Admin | 1 | 0 | 1 | 0 | Low | 8 |
| 4 | Boutique Management | Admin | 2 | 7 | 7 | 0 | Med | 6 |
| 5 | Category Management | Admin | 1 | 1 | 11 | 0 | Low | 7 |
| 6 | Customer Management | Admin | 1 | 0 | 8 | 0 | Low | 7 |
| 7 | Order Management | Admin | 2 | 0 | 6 | 0 | Med | 5 |
| 8 | Commerce Orders | Admin | 1 | 0 | 8 | 0 | Med | 6 |
| 9 | Payment Management | Admin | 1 | 0 | 4 | 0 | Low | 7 |
| 10 | Payout Settlements | Admin | 1 | 0 | 6 | 0 | Low | 7 |
| 11 | Subscription Management | Admin | 1 | 0 | 10 | 0 | **High** | 3 |
| 12 | Coupon Management | Admin | 1 | 0 | 6 | 0 | Low | 8 |
| 13 | Support Tickets | Admin | 1 | 0 | 9 | 0 | Low | 7 |
| 14 | Product Reviews Moderation | Admin | 1 | 0 | 5 | 0 | Low | 8 |
| 15 | Notification Broadcast | Admin | 1 | 0 | 6 | 0 | Low | 8 |
| 16 | Delivery Tracking | Admin | 1 | 0 | 3 | 0 | Low | 9 |
| 17 | Activity Logs | Admin | 1 | 0 | 0 | 0 | Low | 10 |
| 18 | Wishlists & Demand | Admin | 1 | 0 | 1 | 0 | Low | 9 |
| 19 | Marketplace Insights | Admin | 1 | 0 | 1 | 0 | Low | 9 |
| 20 | Settings | Admin | 1 | 0 | 0 | 0 | Low | 9 |
| 21 | Auth (Admin) | Admin | 3 | 1 | 3 | 1 | **High** | 2 |
| | **Owner Admin** | | | | | | | |
| 22 | Dashboard | Owner | 1 | 0 | 1 | 0 | Low | 9 |
| 23 | Products | Owner | 1 | 0 | 22 | 0 | Med | 4 |
| 24 | Services | Owner | 1 | 0 | 1 | 0 | Low | 9 |
| 25 | Gallery | Owner | 1 | 0 | 2 | 0 | Low | 9 |
| 26 | Orders | Owner | 2 | 0 | 8 | 0 | Med | 5 |
| 27 | Bookings | Owner | 1 | 0 | 1 | 0 | Low | 9 |
| 28 | Delivery Tracking | Owner | 1 | 0 | 3 | 0 | Low | 9 |
| 29 | Subscriptions | Owner | 1 | 0 | 7 | 0 | Med | 6 |
| 30 | Analytics | Owner | 1 | 0 | 0 | 0 | Low | 10 |
| 31 | Reviews | Owner | 2 | 0 | 5 | 0 | Low | 8 |
| 32 | Coupons | Owner | 1 | 0 | 5 | 0 | Low | 8 |
| 33 | Tickets | Owner | 1 | 0 | 1 | 0 | Low | 9 |
| 34 | Payouts | Owner | 1 | 0 | 1 | 0 | Low | 9 |
| 35 | Settings | Owner | 3 | 1 | 3 | 0 | Low | 8 |
| | **Customer** | | | | | | | |
| 36 | Home | Customer | 1 | 7 | 0 | 0 | Med | 4 |
| 37 | Shop | Customer | 2 | 3 | 2 | 0 | Low | 6 |
| 38 | Product Detail | Customer | 2 | 5 | 5 | 1 | Med | 5 |
| 39 | Cart | Customer | 1 | 2 | 5 | 1 | Med | 5 |
| 40 | Checkout | Customer | 2 | 1 | 4 | 0 | **High** | 3 |
| 41 | Wishlist | Customer | 2 | 1 | 3 | 1 | Low | 7 |
| 42 | Orders | Customer | 2 | 2 | 5 | 0 | Low | 6 |
| 43 | Returns | Customer | 1 | 1 | 3 | 1 | Low | 8 |
| 44 | Exchanges | Customer | 0 | 1 | 3 | 0 | Low | 9 |
| 45 | Addresses | Customer | 1 | 1 | 5 | 1 | Low | 8 |
| 46 | Profile | Customer | 1 | 1 | 0 | 0 | Low | 9 |
| 47 | Notifications | Customer | 1 | 0 | 5 | 1 | Low | 8 |
| 48 | Tailoring | Customer | 1 | 0 | 0 | 0 | Low | 9 |
| 49 | Measurements | Customer | 1 | 0 | 3 | 0 | Low | 9 |
| 50 | Bookings | Customer | 1 | 0 | 2 | 0 | Low | 9 |
| 51 | Boutique Detail | Customer | 1 | 1 | 0 | 0 | Low | 9 |
| 52 | Static Pages | Customer | 7 | 1 | 0 | 0 | Low | 10 |
| | **Shared** | | | | | | | |
| 53 | Auth (Shared) | Shared | 0 | 1 | 0 | 2 | **High** | 1 |
| 54 | Design System | Shared | 1 | 0 | 0 | 0 | Low | 10 |
| 55 | Bookings (Admin) | Admin | 1 | 0 | 7 | 0 | Low | 7 |
| 56 | Reviews (Admin) | Admin | 1 | 1 | 5 | 0 | Low | 8 |
| 57 | UI Library | Shared | 0 | 34 | 0 | 0 | Low | 7 |
| 58 | Commerce Components | Shared | 0 | 12 | 0 | 0 | Low | 8 |
| 59 | Theme | Shared | 0 | 0 | 0 | 0 | Med | 6 |

### Migration Priority Ranking

| Priority | Feature(s) | Rationale |
|----------|------------|-----------|
| **1** | Auth (Shared) | Highest blast radius. All portals depend on it. Inline ProtectedRoute must be extracted first. |
| **2** | Auth (Admin) | Login/ResetPassword/SetPassword are entry points. Tied to AuthContext refactor. |
| **3** | Subscription Management + Checkout | Largest file (1,899 lines) and payment-critical flow respectively. |
| **4** | Products (Owner) | 22 API functions, complex CRUD with images/variants/brands/tags/inventory. |
| **5** | Orders (Admin + Owner) + Product Detail | Shared OrderDetails page spans two portals. Product Detail has review context coupling. |
| **6** | Boutique Management + Commerce Orders + Shop | Medium-complexity features with moderate API surface. |
| **7** | Category/Customer/Payment/Payout/Tickets (Admin) + Cart + Wishlist + UI Library | Standard CRUD features + core UI library with many files but low risk. |
| **8** | Revenue/Fraud/Coupons/Reviews/Notifications (Admin) + Reviews/Coupons (Owner) + Returns/Addresses/Notifications (Customer) + Commerce Components | Lower complexity, independent pages. |
| **9** | Command Center/Delivery Tracking/Wishlists/Marketplace Insights/Settings/Activity Logs (Admin) + Dashboard/Bookings/Delivery Tracking/Tickets/Payouts (Owner) + Tailoring/Measurements/Bookings/Boutique Detail/Exchanges (Customer) | Minimal or zero API surface. Simple pages. |
| **10** | Static Pages (Customer) + Analytics (Owner) + Design System + Activity Logs | No API calls, pure content/display. |

### Cross-Cutting Concerns

1. **Monolithic `services/api.js` (1,325 lines):** Every feature shares this file. Before any feature migration, API functions must be extracted into `services/admin/`, `services/owner/`, and `services/customer/` subdirectories.

2. **Duplicate components:** `components/Card.jsx` vs `components/ui/Card.jsx`, `components/Skeleton.jsx` vs `components/ui/Skeleton.jsx`, `components/ProductCard.jsx` (stub) vs `components/commerce/ProductCard.jsx`. These must be consolidated before feature extraction.

3. **Inline layout definitions:** `AdminLayout` (defined in `App.jsx:116-189`) and `ProtectedRoute` (defined in `App.jsx:94-114`) must be extracted to their own files in a `components/layout/` or `components/auth/` directory.

4. **Context dependency graph:** `AuthContext` → `AdminNotificationContext`, `CustomerAuthContext` → `CartContext` → `WishlistContext` → `AddressContext` → `NotificationContext`. Migration must preserve provider nesting order.

5. **Image configuration:** `services/imageConfig.js` is consumed by customer shop, product detail, home, boutique detail, owner gallery, owner products, and admin boutique management. Any change to image resolution affects all portals.

### Page File Size Heat Map (Top 10 Largest)

| File | Lines | Size | Feature | Risk |
|------|-------|------|---------|------|
| `AdminSubscriptions.jsx` | 1,899 | 92 KB | Subscription Management | **High** |
| `OwnerProducts.jsx` | 884 | ~45 KB | Products (Owner) | **High** |
| `Customers.jsx` | 882 | ~43 KB | Customer Management | Med |
| `OwnerSubscription.jsx` | 804 | ~40 KB | Subscriptions (Owner) | Med |
| `AdminCommandCenter.jsx` | 700 | ~35 KB | Command Center | Med |
| `AdminTickets.jsx` | ~650 | ~32 KB | Support Tickets | Med |
| `Boutiques.jsx` | ~600 | ~30 KB | Boutique Management | Med |
| `CustomerCheckout.jsx` | ~550 | ~28 KB | Checkout | **High** |
| `CustomerShop.jsx` | ~520 | ~26 KB | Shop | Med |
| `AdminRevenue.jsx` | ~500 | ~25 KB | Revenue Analytics | Low |

---

*End of Feature Ownership Map. This document defines the authoritative ownership contract for all 166 source files across 59 features in the VS Boutique ERP frontend.*
