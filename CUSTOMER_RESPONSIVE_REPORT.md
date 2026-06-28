# Customer Storefront — Responsive Viewport Report

This report documents the visual layout behavior, element sizing, text wrapping, and absence of horizontal scrolling across the 9 target device breakpoints for the **Customer Storefront website**.

---

## 1. Summary of Breakpoint Tests

| Breakpoint | Target Device | Layout Wrap | Horizontal Scroll | Header / Nav | Card Columns | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **320px** | iPhone SE (Compact mobile) | Yes | None | Mobile Bottom Bar | 1 Column | ✅ PASS |
| **375px** | iPhone X / 11 | Yes | None | Mobile Bottom Bar | 1 Column | ✅ PASS |
| **390px** | iPhone 12 / 13 Pro | Yes | None | Mobile Bottom Bar | 1 Column | ✅ PASS |
| **414px** | iPhone 8 Plus / XS Max | Yes | None | Mobile Bottom Bar | 1 Column | ✅ PASS |
| **768px** | iPad (Portrait tablet) | Yes | None | Desktop Header (Scaled) | 2 Columns | ✅ PASS |
| **1024px** | iPad Pro / Small Laptop | Yes | None | Full Desktop Header | 3 Columns | ✅ PASS |
| **1280px** | Desktop Standard | Yes | None | Full Desktop Header | 4 Columns | ✅ PASS |
| **1440px** | Desktop Large | Yes | None | Full Desktop Header | 4 Columns | ✅ PASS |
| **1920px** | Ultrawide / 1080p | Yes | None | Max-width Centered | 4 Columns | ✅ PASS |

---

## 2. Page-Specific Sizing & Flow Audits

### 2.1 Navigation Headers & Footers
* **Mobile (320px - 414px):**
  - **Top Bar:** Shrinks brand logo gracefully; places wishlist and cart side-by-side with no overlaps.
  - **Bottom Bar:** Stays fixed to the bottom of the viewport; handles safe-area padding; icons are touch-friendly (44x44px target) and labeled.
  - **Footer:** Links stack vertically to prevent column clipping.
* **Tablet & Desktop (768px - 1920px):**
  - **Desktop Header:** Replaces bottom bar; items are spaced via flex layouts; login triggers modal.
  - **Footer:** Spreads into 4 responsive columns with uniform padding.

### 2.2 Boutique Directory & Cards
* **Grid Layout:**
  - `320px` to `414px`: 1 card per row; full-width banner images with `aspect-[16/9]`.
  - `768px`: 2 cards per row.
  - `1024px`+: 3 to 4 cards per row.
* **Card Details:**
  - Floating logo remains aligned and relative when wrapping.
  - Specialty tags flex-wrap automatically to prevent horizontal overflow outside the card margins.

### 2.3 Product Catalog & Search
* **Search Input:**
  - Responsive search bar fills the horizontal row on mobile; centers with filter buttons on desktop.
* **Product Grid:**
  - Mobile shows a neat 2-column compact grid, maximizing item visibility.
  - Desktop scales to a 4-column luxury grid with hover elevation cards.

### 2.4 Checkout & Forms
* **Form Grid:**
  - Mobile scales all inputs (name, address, notes) to a single column to prevent keyboard cropping.
  - Desktop uses a split-pane layout: Address/Form details on the left, order summary card on the right.
* **Numeric Keypads:**
  - Phone number login input sets `type="tel"` to automatically fire numeric-only keypads on mobile browsers.

### 2.5 Profile Tabs
* **Sub-tabs (Measurements, Orders, Bookings):**
  - Mobile shows a horizontal scrollable tab selector with a hidden scrollbar (`scrollbar-hide`) to keep touch controls intuitive.
  - Desktop displays standard tab buttons with hover styling.
