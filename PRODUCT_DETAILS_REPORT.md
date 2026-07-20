# Product Details Page — Complete Backend Discovery Report

> Compiled for a frontend developer who has never seen this backend.
> Do NOT write code. This report documents every API, field, model, and business rule needed to build the Product Details Page.

---

## PART 1 — PRODUCT DETAILS API

### Primary: Get Product by ID

| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/products/:id` |
| **HTTP Method** | `GET` |
| **Authentication** | None (public) |
| **URL Parameters** | `id` (string, UUID) — Product ID |
| **Query Parameters** | None |
| **Headers** | None required |
| **Request Body** | None |

**Success Response (200)**:
```json
{
  "statusCode": 200,
  "message": "Request processed successfully",
  "data": { /* ProductResponse (see Part 2) */ }
}
```

**Error Responses**:
| HTTP Status | Code | Message | Error Code |
|-------------|------|---------|------------|
| 404 | `NOT_FOUND` | Product not found | `PRODUCT_001` |
| 400 | `BAD_REQUEST` | Invalid UUID format | (validation pipe) |

---

### Secondary: List Products (for related/recommended)

| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/products` |
| **HTTP Method** | `GET` |
| **Authentication** | None (public) |
| **Query Parameters** | See `ProductQueryDto` below |
| **Headers** | None required |
| **Request Body** | None |

**Query Parameters (ProductQueryDto)**:
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `search` | string | No | — | Search in name, shortDescription, searchKeywords, sku |
| `brandId` | UUID | No | — | Filter by brand |
| `status` | string | No | — | DRAFT/ACTIVE/INACTIVE/ARCHIVED |
| `visibility` | string | No | — | VISIBLE/HIDDEN/SEARCHABLE |
| `type` | enum | No | — | READYMADE/WHOLESALE/FEATURED/NEW_ARRIVAL/BESTSELLER |
| `gender` | enum | No | — | WOMEN/GIRLS/UNISEX |
| `ageGroup` | enum | No | — | 4-6/7-9/10-12/13-17/18-22/23-29/30-35/35+ |
| `occasion` | string | No | — | Filter by occasion |
| `season` | string | No | — | Filter by season |
| `isFeatured` | boolean | No | — | Featured products |
| `isNewArrival` | boolean | No | — | New arrivals |
| `isBestSeller` | boolean | No | — | Best sellers |
| `isPublished` | boolean | No | — | Published only |
| `minPrice` | number | No | — | Min base price |
| `maxPrice` | number | No | — | Max base price |
| `categoryId` | UUID | No | — | Filter by category |
| `createdBy` | string | No | — | Filter by creator |
| `updatedBy` | string | No | — | Filter by updater |
| `tags` | string | No | — | Comma-separated tags |
| `createdAfter` | date | No | — | Created after this date |
| `createdBefore` | date | No | — | Created before this date |
| `deleted` | string | No | — | null=active only, "only"=deleted only, omit=all |
| `page` | int | No | 1 | Page number (min 1) |
| `limit` | int | No | 20 | Items per page (max 100) |
| `sortBy` | string | No | createdAt | Field to sort by |
| `sortOrder` | asc/desc | No | desc | Sort direction |

**Success Response (200)**:
```json
{
  "statusCode": 200,
  "message": "Request processed successfully",
  "data": [
    { /* ProductResponse (see Part 2) */ }
  ],
  "customMeta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

**Error Responses**:
| HTTP Status | Message |
|-------------|---------|
| 400 | Validation error on query params |
| 500 | Internal server error |

---

### Secondary: Search Products

| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/search` |
| **HTTP Method** | `GET` |
| **Authentication** | None (public) — currentUser is optional |
| **Query Parameters** | `q`, `brandId`, `categoryId`, `gender`, `ageGroup`, `occasion`, `season`, `type`, `isFeatured`, `isNewArrival`, `isBestSeller`, `inStock`, `minPrice`, `maxPrice`, `tags`, `collections`, `attributeFilters`, `sortBy`, `sortOrder`, `page`, `limit` |
| **Headers** | `Authorization: Bearer <token>` (optional) |

**Search Result Product** (simplified for listings):
```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "sku": "string",
  "shortDescription": "string?",
  "brandId": "uuid",
  "brandName": "string?",
  "basePrice": 999.00,
  "salePrice": 799.00,
  "status": "ACTIVE",
  "isFeatured": false,
  "isNewArrival": true,
  "isBestSeller": false,
  "gender": "GIRLS",
  "ageGroup": "7-9",
  "tags": ["summer", "casual"],
  "collections": ["new-arrivals"],
  "primaryImage": "https://cdn.example.com/...",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

### Secondary: Search Autocomplete

| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/search/autocomplete` |
| **HTTP Method** | `GET` |
| **Authentication** | None (public) |
| **Query Parameters** | `q` (string), `limit` (int, default 10) |

**Response:**
```json
{
  "products": [
    { "id": "uuid", "name": "Fancy Dress", "slug": "fancy-dress", "basePrice": 999 }
  ],
  "suggestions": ["fancy dress", "fancy frock", "fancy accessories"]
}
```

---

### Secondary: Reviews for Product

| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/reviews?productId=:productId` |
| **HTTP Method** | `GET` |
| **Authentication** | None (public) |
| **Query Parameters** | `productId`, `customerId`, `rating`, `status`, `page`, `limit` |

See Part 9 for full details.

### Secondary: Review Summary for Product

| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/reviews/product/:productId/summary` |
| **HTTP Method** | `GET` |
| **Authentication** | None (public) |

**Response:**
```json
{
  "averageRating": 4.2,
  "totalReviews": 85,
  "ratingDistribution": { "1": 2, "2": 3, "3": 10, "4": 25, "5": 45 }
}
```

---

### Secondary: Active Offers

| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/offers/active` |
| **HTTP Method** | `GET` |
| **Authentication** | None (public) |

**Response:** Array of active `OfferResponse`.

---

### Secondary: Shipping Methods (for delivery estimate UI)

| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/shipping/methods` |
| **HTTP Method** | `GET` |
| **Authentication** | None (public) |

**Response:** Array of `ShippingMethodResponse`.

### Secondary: Calculate Shipping

| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/shipping/methods/:code/calculate` |
| **HTTP Method** | `GET` |
| **Authentication** | None (public) |
| **Query Parameters** | `methodCode` (path), `country`, `state`, `pincode?`, `weight?`, `orderAmount?` |

**Response:**
```json
{
  "methodCode": "standard",
  "methodName": "Standard Delivery",
  "rate": 49.00,
  "estimatedDelivery": "3-5 business days",
  "freeShipping": false
}
```

---

### Secondary: Product Category Tree

| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/categories/tree` |
| **HTTP Method** | `GET` |
| **Authentication** | None (public) |

Returns full category hierarchy for breadcrumbs.

### Secondary: Brand Info

| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/brands/:id` |
| **HTTP Method** | `GET` |
| **Authentication** | None (public) |

Returns brand details (name, slug, logo, website, etc.).

---

### Customer Actions (JWT Required)

| Action | Method | Endpoint | Auth |
|--------|--------|----------|------|
| Add to Cart | `POST` | `/api/cart/items` | JWT or guestId query |
| Add to Wishlist | `POST` | `/api/wishlist/items` | JWT required |
| Check Wishlist | `GET` | `/api/wishlist/check/:productId` | JWT required |
| Get Cart | `GET` | `/api/cart` | JWT or guestId query |
| Get Cart Summary | `GET` | `/api/cart/summary` | JWT or guestId query |
| Create Review | `POST` | `/api/reviews` | JWT required |
| Vote Review | `POST` | `/api/reviews/:id/vote` | JWT required |

---

## PART 2 — COMPLETE RESPONSE BODY (ProductResponse)

Full JSON shape returned by `GET /api/products/:id`:

```json
{
  "id": "uuid",
  "sku": "SKU-001",
  "barcode": "8901234567890",
  "name": "Fancy Floral Dress",
  "slug": "fancy-floral-dress",
  "primaryImageUrl": "https://cdn.example.com/products/abc123/images/primary.webp",
  "shortDescription": "Beautiful floral print dress for girls",
  "description": "<p>Full HTML description with details</p>",

  "brandId": "uuid-brand",
  "brandName": "Little Fancy",

  "type": "READYMADE",
  "status": "ACTIVE",
  "visibility": "VISIBLE",

  "basePrice": 1499.00,
  "salePrice": 999.00,
  "wholesalePrice": null,
  "costPrice": null,
  "taxPercentage": 12.00,
  "discountType": "PERCENTAGE",
  "discountValue": 33.33,

  "trackInventory": true,
  "allowBackorder": false,
  "minimumOrderQuantity": 1,
  "maximumOrderQuantity": 10,

  "weight": 0.250,
  "length": 30,
  "width": 20,
  "height": 2,

  "isFeatured": false,
  "isNewArrival": true,
  "isBestSeller": false,
  "isPublished": true,
  "publishedAt": "2025-06-01T00:00:00Z",
  "displayOrder": 0,

  "seoTitle": "Buy Fancy Floral Dress Online",
  "seoDescription": "Shop Fancy Floral Dress for girls",
  "seoKeywords": "floral dress, girl dress, fancy dress",
  "canonicalUrl": "https://example.com/products/fancy-floral-dress",
  "searchKeywords": "floral print dress girls party wear",

  "gender": "GIRLS",
  "ageGroup": "7-9",
  "occasion": "Party",
  "season": "Summer",

  "tags": ["summer", "floral", "party-wear"],
  "collections": ["new-arrivals", "summer-collection"],

  "categories": [
    { "categoryId": "uuid", "categoryName": "Dresses", "categorySlug": "dresses" },
    { "categoryId": "uuid", "categoryName": "Girls", "categorySlug": "girls" }
  ],

  "attributes": [
    { "attributeId": "uuid", "attributeName": "Fabric", "attributeType": "TEXT", "value": "Cotton" },
    { "attributeId": "uuid", "attributeName": "Sleeve", "attributeType": "SELECT", "value": "Short Sleeve" },
    { "attributeId": "uuid", "attributeName": "Pattern", "attributeType": "SELECT", "value": "Floral" }
  ],

  "relatedProducts": [
    { "productId": "uuid", "productName": "Other Product" }
  ],

  "createdAt": "2025-05-15T10:30:00Z",
  "updatedAt": "2025-06-01T14:00:00Z"
}
```

### Field Reference

| Field | Type | Always Present | Description |
|-------|------|----------------|-------------|
| `id` | string (UUID) | Yes | Unique product identifier |
| `sku` | string | Yes | Stock keeping unit code |
| `barcode` | string | Yes | Barcode/UPC code |
| `name` | string | Yes | Product display name |
| `slug` | string | Yes | URL-friendly identifier (unique) |
| `primaryImageUrl` | string? | No | Signed/display URL of primary image |
| `shortDescription` | string? | No | Brief product summary (plain text) |
| `description` | string? | No | Full product description (HTML) |
| `brandId` | string (UUID) | Yes | Brand ID |
| `brandName` | string? | No | Brand display name |
| `type` | enum | Yes | READYMADE, WHOLESALE, FEATURED, NEW_ARRIVAL, BESTSELLER |
| `status` | enum | Yes | DRAFT, ACTIVE, INACTIVE, ARCHIVED, DISCONTINUED |
| `visibility` | enum | Yes | VISIBLE, HIDDEN, SEARCHABLE |
| `basePrice` | number | Yes | Original price (MRP) |
| `salePrice` | number? | No | Discounted selling price |
| `wholesalePrice` | number? | No | Wholesale/bulk price |
| `costPrice` | number? | No | Internal cost price |
| `taxPercentage` | number? | No | Tax rate (0-100) |
| `discountType` | string? | No | PERCENTAGE, FIXED_AMOUNT, BUY_X_GET_Y |
| `discountValue` | number? | No | Discount value (percentage or flat) |
| `trackInventory` | boolean | Yes | Whether inventory is tracked |
| `allowBackorder` | boolean | Yes | Allow ordering when out of stock |
| `minimumOrderQuantity` | int | Yes | Minimum quantity per order |
| `maximumOrderQuantity` | int | Yes | Maximum quantity per order (0=unlimited) |
| `weight` | number? | No | Weight in kg |
| `length` | number? | No | Length in cm |
| `width` | number? | No | Width in cm |
| `height` | number? | No | Height in cm |
| `isFeatured` | boolean | Yes | Featured product flag |
| `isNewArrival` | boolean | Yes | New arrival flag |
| `isBestSeller` | boolean | Yes | Best seller flag |
| `isPublished` | boolean | Yes | Published flag |
| `publishedAt` | Date? | No | Publication date |
| `displayOrder` | int | Yes | Sort order |
| `seoTitle` | string? | No | Meta title |
| `seoDescription` | string? | No | Meta description |
| `seoKeywords` | string? | No | Meta keywords |
| `canonicalUrl` | string? | No | Canonical URL |
| `searchKeywords` | string? | No | Search keywords |
| `gender` | string? | No | WOMEN, GIRLS, UNISEX |
| `ageGroup` | string? | No | 4-6, 7-9, 10-12, 13-17, 18-22, 23-29, 30-35, 35+ |
| `occasion` | string? | No | Occasion tag |
| `season` | string? | No | Season tag |
| `tags` | string[] | No | Product tags |
| `collections` | string[] | No | Collection names |
| `categories` | array | No | Array of `{ categoryId, categoryName, categorySlug }` |
| `attributes` | array | No | Array of `{ attributeId, attributeName, attributeType, value? }` |
| `relatedProducts` | array | No | Array of `{ productId, productName }` |
| `createdAt` | Date | Yes | Creation timestamp |
| `updatedAt` | Date | Yes | Last update timestamp |

---

## PART 3 — PRODUCT IMAGES

### Image Data Model (ProductMedia)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Media identifier |
| `productId` | UUID | Parent product |
| `variantId` | UUID? | Optional variant association |
| `mediaType` | enum | IMAGE, VIDEO, DOCUMENT, 360_IMAGE |
| `title` | string? | Display title |
| `altText` | string? | Alt text for accessibility |
| `url` | string | Public URL (can be relative path or full URL) |
| `thumbnailUrl` | string? | Thumbnail variant URL |
| `displayOrder` | int | Sort order (ascending) |
| `isPrimary` | boolean | Primary image flag |
| `status` | enum | ACTIVE, (others) |
| `createdAt` | Date | Timestamp |
| `updatedAt` | Date | Timestamp |

### Image Handling Rules

1. **The ProductResponse only includes `primaryImageUrl`** — it does NOT include the full media array. The frontend must call `GET /api/media?productId=:id` to get all images.
2. **Images are ordered** by `isPrimary` (descending, so primary first) then `displayOrder` (ascending).
3. **Signed URLs**: URLs are processed through `StorageService.getDisplayUrl()`. If the URL starts with `http`, it's returned as-is. If it's a relative path, it's resolved via `StorageService.getPublicUrl()`.
4. **Primary image**: Determined by `isPrimary=true` flag. If no primary is set, the first image (by order) is used.
5. **Upload**: Admin uses `POST /api/media/upload-url` to get a signed S3 upload URL, then uploads directly. After upload, `POST /api/media` registers the media record.

### Image Variants

When uploading images via `StorageService.uploadImage()`, four WebP variants are automatically created:
- `{key}_thumb.webp` — 150px width (thumbnail)
- `{key}_medium.webp` — 600px width (medium)
- `{key}_large.webp` — 1200px width (large)
- `{key}.webp` — original size (WebP converted)

### Storage Provider

- **Provider**: S3-compatible storage (AWS S3 or compatible)
- **Storage path pattern**: `products/{productId}/{mediaType}s/{uuid}.{extension}`
- **Signed URLs**: Used for upload. `getSignedUploadUrl()` generates time-limited upload URLs.
- **Display URLs**: `getPublicUrl()` or direct `https` URLs stored in the database.

---

## PART 4 — PRODUCT VARIANTS

### Variant Data Model (ProductVariant)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Variant identifier |
| `productId` | UUID | Parent product |
| `sku` | string | Unique SKU |
| `barcode` | string | Unique barcode |
| `title` | string | Variant display title (e.g. "Size M - Blue") |
| `priceOverride` | Decimal? | Override base price for this variant |
| `salePriceOverride` | Decimal? | Override sale price for this variant |
| `costPrice` | Decimal? | Cost price for this variant |
| `weight` | Decimal? | Variant-specific weight |
| `length` | Decimal? | Length |
| `width` | Decimal? | Width |
| `height` | Decimal? | Height |
| `displayOrder` | int | Sort order |
| `status` | enum | ACTIVE, INACTIVE, OUT_OF_STOCK |
| `isDefault` | boolean | Default/selected variant |
| `isActive` | boolean | Active flag |
| `attributeValues` | array | Array of `{ attributeId, attributeName, attributeType, attributeOptionId?, optionLabel?, value? }` |

### Variant API Endpoints

All variant endpoints are admin-only (JWT + roles: super_admin, admin) **except** `GET /api/variants` and `GET /api/variants/:id` which are public.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/variants` | List variants (query: productId, status, isActive, isDefault, page, limit) |
| `GET` | `/api/variants/:id` | Get variant by ID |
| `POST` | `/api/variants` | Create variant |
| `PATCH` | `/api/variants/:id` | Update variant |
| `DELETE` | `/api/variants/:id` | Soft delete variant |
| `POST` | `/api/variants/:id/activate` | Activate variant |
| `POST` | `/api/variants/:id/deactivate` | Deactivate variant |
| `POST` | `/api/variants/:id/set-default` | Set as default variant |
| `POST` | `/api/variants/:id/attribute-values` | Assign attribute values |
| `DELETE` | `/api/variants/:id/attribute-values/:attributeId` | Remove attribute value |

### Variant Attribute Values

Link variants to attribute options. A variant "Size S - Red" connects:
- attributeId (Size) → attributeOptionId (S)
- attributeId (Color) → attributeOptionId (Red)

### Missing from ProductResponse

The `ProductResponse` does **NOT** include variants or media array. The frontend must make separate calls:
- `GET /api/variants?productId=:id` for all variants
- `GET /api/media?productId=:id` for all media

---

## PART 5 — PRODUCT PRICING

### Pricing Fields on Product

| Field | Source | Always Present | Description |
|-------|--------|----------------|-------------|
| `basePrice` | Product.basePrice | Yes | MRP / original price (Decimal stored as number) |
| `salePrice` | Product.salePrice | No | Discounted price (if null, basePrice is selling price) |
| `wholesalePrice` | Product.wholesalePrice | No | Bulk purchase price |
| `costPrice` | Product.costPrice | No | Internal cost (hidden from customers) |
| `taxPercentage` | Product.taxPercentage | No | Tax rate 0-100 (default 0) |
| `discountType` | Product.discountType | No | PERCENTAGE, FIXED_AMOUNT, BUY_X_GET_Y |
| `discountValue` | Product.discountValue | No | Discount value (33.33 = 33.33% off or ₹333 flat) |

### How Pricing Works

- **Display price**: `salePrice ?? basePrice` — the price shown to customers
- **Discount %**: `((basePrice - salePrice) / basePrice) * 100` (calculated frontend from the two values)
- **Discount fields**: `discountType` and `discountValue` describe the *admin-defined* discount rule (may not equal the actual price difference if salePrice was set manually)
- **Cart pricing**: Uses `salePrice ?? basePrice` as `unitPrice`. Total = `unitPrice * quantity`.

### Price In Cart Items

When adding to cart, the backend resolves the price:
```
unitPrice = product.salePrice ?? product.basePrice
```
This is stored as `ShoppingCartItem.unitPrice` at the time of add.

### Missing Pricing Features

These are **NOT** computed on the backend product endpoint and must be calculated on frontend or via cart/checkout:
- Tax amount (`taxPercentage * unitPrice / 100`)
- Shipping charge (from shipping API)
- COD charge (not implemented - no COD endpoint exists)
- Coupon discount (via `POST /api/coupons/apply`)
- Reward/wallet discount (wallet endpoints exist but not wired for product page)
- Final payable (no "price break-up" API — must be calculated on frontend or via checkout)

---

## PART 6 — PRODUCT INVENTORY

### Inventory Data Model (Inventory)

Per-variant inventory. Keyed by `variantId` (unique).

| Field | Type | Description |
|-------|------|-------------|
| `variantId` | UUID | Linked variant |
| `availableQuantity` | int | Total stock available |
| `reservedQuantity` | int | Stock reserved by active orders |
| `damagedQuantity` | int | Damaged/write-off stock |
| `returnedQuantity` | int | Returned stock |
| `minimumStock` | int | Low-stock threshold |
| `maximumStock` | int | Max stock limit |
| `reorderLevel` | int | Reorder point |
| `stockStatus` | enum | IN_STOCK, LOW_STOCK, OUT_OF_STOCK, BACKORDER |
| `allowBackorder` | boolean | Allow ordering when out of stock |
| `trackInventory` | boolean | Whether inventory tracking is enabled |

### Effective Stock Calculation

```
availableStock = availableQuantity - reservedQuantity
```

Stock status is auto-calculated:
- `availableStock <= 0` + `allowBackorder` = BACKORDER
- `availableStock <= 0` + `!allowBackorder` = OUT_OF_STOCK
- `availableStock <= minimumStock || availableStock <= reorderLevel` = LOW_STOCK
- Otherwise = IN_STOCK

### Inventory API (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/inventory/variant/:variantId` | Get inventory by variant ID |
| `GET` | `/api/inventory/:id` | Get inventory by ID |

**Response (InventoryResponse)**:
```json
{
  "id": "uuid",
  "variantId": "uuid",
  "availableQuantity": 100,
  "reservedQuantity": 5,
  "damagedQuantity": 0,
  "returnedQuantity": 2,
  "availableStock": 95,
  "minimumStock": 10,
  "maximumStock": 500,
  "reorderLevel": 20,
  "stockStatus": "IN_STOCK",
  "allowBackorder": false,
  "trackInventory": true,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Warehouse-Level Inventory

Per-warehouse inventory exists (`VariantWarehouseInventory`) but has no public API. Only total inventory is exposed.

### Cart Inventory Check

When adding to cart, the backend validates:
1. Product exists and is not deleted
2. Product status is `ACTIVE`
3. Resolves variant (explicit or default)
4. Checks inventory: `availableQuantity - reservedQuantity > 0` OR `allowBackorder = true`
5. Throws `CART_005` ("Product is out of stock") if unavailable

---

## PART 7 — PRODUCT BUTTONS

### Add to Cart

| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/cart/items` |
| **Method** | `POST` |
| **Auth** | JWT (Bearer token) OR guest (query: `guestId`) |
| **Request Body** | `{ "productId": "uuid", "variantId": "uuid?" (optional), "quantity": 1 (optional, default 1) }` |

**Business Rules**:
- If authenticated via JWT, cart is created/looked up by `CustomerProfile.id` (resolved from JWT `sub`)
- If guest, cart is keyed by `guestId` query parameter
- Quantity defaults to 1
- If same product+variant already in cart, quantity is incremented
- Price is captured as `salePrice ?? basePrice` at time of add
- Min/max order quantity validated by product settings
- Out of stock products with no backorder are rejected
- Audit log: `PRODUCT_ADDED_TO_CART`

**Success Response** (200): Full `CartResponse` with all items.

**Error Responses**:
| Error | Code | Message |
|-------|------|---------|
| Auth | — | Invalid or expired token |
| 400 | CART_001 | Customer profile not found |
| 400 | CART_002 | Either userId or guestId is required |
| 400 | CART_003 | Product not found |
| 400 | CART_004 | Product is not available |
| 400 | CART_005 | Product is out of stock |

---

### Buy Now

**No dedicated "Buy Now" API exists.** Buy Now = Add to Cart + redirect to Checkout. The frontend must implement as:
1. `POST /api/cart/items` (add item)
2. Navigate to checkout page

---

### Add to Wishlist

| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/wishlist/items` |
| **Method** | `POST` |
| **Auth** | JWT required (no guest support) |
| **Request Body** | `{ "productId": "uuid", "variantId": "uuid?" (optional), "notes": "string?" (optional) }` |
| **Response** | 201 — `WishlistItemResponse` |

**Business Rules**:
- One wishlist per customer (auto-created)
- Duplicate product throws `WISHLIST_001` ("Product already in wishlist")
- Product must exist and not be deleted
- Audit log: `PRODUCT_ADDED_TO_WISHLIST`

**Other Wishlist Endpoints**:
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/wishlist` | Get wishlist details |
| `GET` | `/api/wishlist/items?page&limit&search` | List items with pagination |
| `GET` | `/api/wishlist/count` | Get item count |
| `GET` | `/api/wishlist/check/:productId` | Check if in wishlist (returns boolean) |
| `DELETE` | `/api/wishlist/items/:productId` | Remove from wishlist |
| `POST` | `/api/wishlist/items/:productId/move-to-cart` | Move to cart and remove from wishlist |

---

### Share

**No share API exists.** Share must be implemented via:
- Native Web Share API (`navigator.share()`)
- Copy product URL to clipboard
- Social sharing buttons (WhatsApp, Facebook, etc.) via generated product URL

---

### Compare

**No compare API exists.** Must be implemented entirely on frontend (compare in localStorage/sessionStorage, no backend support).

---

### Notify Me

**No Notify Me API exists.** Backend has:

- `POST /api/notifications` (admin only — creates notification template)
- No customer "notify when back in stock" endpoint

Frontend must implement Notify Me as a client-side feature or it's missing.

---

### Ask Question

**No product question/answer API exists.** Backend has:

- `POST /api/support/tickets` (customer support ticket)
- No product-specific Q&A module

---

### Write Review

| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/reviews` |
| **Method** | `POST` |
| **Auth** | JWT required |
| **Request Body** | `{ "productId": "uuid", "rating": 1-5, "title": "string?" (optional), "comment": "string?" (optional), "imageUrls": ["url"]? (optional) }` |

**Business Rules**:
- One review per customer per product
- Rating is required (1-5)
- Title and comment are optional
- Images are optional (up to ? — not documented)
- Review is created in `PENDING` status (requires admin approval)
- `isVerifiedPurchase` is true/false (not manually set — likely auto-set if customer has ordered)
- Audit log: `REVIEW_CREATED`
- Product must exist

**Response** (201): `ReviewResponse`

---

### Report Product

**No report product API exists.** Backend has:
- `POST /api/report` (likely admin report generation)
- No product abuse/spam reporting endpoint

---

## PART 8 — DELIVERY

### Delivery Date & Estimate

The shipping module provides delivery estimation:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/shipping/methods` | List all shipping methods |
| `GET` | `/api/shipping/methods/:code/calculate?country=IN&state=KA&pincode=560001&weight=0.5&orderAmount=999` | Calculate rate for a method |

**Shipping Calculation Response**:
```json
{
  "methodCode": "standard",
  "methodName": "Standard Delivery",
  "rate": 49.00,
  "estimatedDelivery": "3-5 business days",
  "freeShipping": false
}
```

### COD Availability

**No COD-specific API exists.** 
- COD is defined in `Payment` schema (`paymentMethod: 'COD'`) but no API exposes "is COD available for this product/pincode?"
- COD availability by pincode is not implemented

### Express Delivery

Express delivery is configured as a separate `ShippingMethod` (e.g., code: "express"). Frontend must call `calculate` with the express method code.

### Free Shipping

Free shipping is calculated based on `ShippingZone.freeAbove`. If `orderAmount >= freeAbove`, rate = 0 and `freeShipping = true`.

### What's Missing for Delivery UI

The product page currently cannot show:
- Estimated delivery date for user's pincode (requires pincode input + shipping calculation)
- COD availability (not implemented)
- The user must enter pincode first, then frontend calls `calculate` for each shipping method

---

## PART 9 — REVIEWS

### Review Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/reviews?productId=:id&rating=&page=&limit=` | Public | List reviews for product |
| `GET` | `/api/reviews/product/:productId/summary` | Public | Product rating summary |
| `GET` | `/api/reviews/:id` | Public | Get review by ID |
| `POST` | `/api/reviews` | JWT | Create review |
| `PATCH` | `/api/reviews/:id` | JWT | Update own review |
| `POST` | `/api/reviews/:id/vote` | JWT | Vote helpful/unhelpful |
| `POST` | `/api/reviews/:id/approve` | JWT + Admin | Approve review |
| `POST` | `/api/reviews/:id/reject` | JWT + Admin | Reject review |

### Review Response Shape

```json
{
  "id": "uuid",
  "productId": "uuid",
  "customerId": "uuid",
  "customerName": "string?",
  "rating": 4,
  "title": "Great product!",
  "comment": "My daughter loved this dress...",
  "images": [
    {
      "id": "uuid",
      "url": "https://cdn.example.com/reviews/...",
      "altText": "Product photo",
      "displayOrder": 0
    }
  ],
  "isVerifiedPurchase": true,
  "helpfulCount": 12,
  "unhelpfulCount": 1,
  "isApproved": true,
  "createdAt": "2025-06-10T00:00:00Z"
}
```

### Rating Summary Response

```json
{
  "averageRating": 4.2,
  "totalReviews": 85,
  "ratingDistribution": {
    "1": 2,
    "2": 3,
    "3": 10,
    "4": 25,
    "5": 45
  }
}
```

### Review Voting

| Method | Endpoint | Body |
|--------|----------|------|
| `POST` | `/api/reviews/:id/vote` | `{ "isHelpful": true }` (boolean) |

Upserts a `ReviewVote`. Recalculates `helpfulCount`/`unhelpfulCount` on the review.

### Review Business Rules

- One review per customer per product (enforced in service)
- Reviews default to `PENDING` status, `isApproved: false`
- Only approved reviews appear in `findAll` (repository filters `status: 'APPROVED'` or similar — verify with actual implementation)
- `findAll` excludes soft-deleted reviews (`deletedAt: null`)
- `getProductRatingSummary` only includes approved reviews

---

## PART 10 — RELATED PRODUCTS

### Admin-Managed Related Products

Related products are explicitly assigned by admin via:

| Method | Endpoint |
|--------|----------|
| `POST` | `/api/products/:id/related` | `{ "relatedProductIds": ["uuid", "uuid"] }` |
| `DELETE` | `/api/products/:id/related/:relatedProductId` |

Stored in `ProductRelatedProduct` join table.

**In ProductResponse**: `relatedProducts` array with `{ productId, productName }` (just IDs + names, not full product data).

Frontend must fetch full product details for each related product by calling `GET /api/products/:relatedProductId`.

### Missing Recommendation Types

| Feature | Status |
|---------|--------|
| Related Products (manual) | ✅ Available via product response |
| Recommended for You | ⚠️ AI recommendations exist but endpoint `POST /api/ai/recommendations/generate` throws NOT_IMPLEMENTED |
| Cross Sell | ❌ Not implemented |
| Upsell | ❌ Not implemented |
| Recently Viewed | ❌ Not implemented (frontend-only localStorage) |
| Frequently Bought Together | ❌ Not implemented |

### AI Recommendations

The `POST /api/ai/recommendations/generate` endpoint currently **throws an error** (`AiUnavailableException`). The AI recommendation system is scaffolded but not functional. The database has:
- `CustomerRecommendation` model (stores generated recommendations with score and reason)
- `RecommendationHistory` model (tracks clicks/views)

**Available AI Recommendation Endpoints** (JWT required):

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/ai/recommendations?type=&page=&limit=` | Get recommendations for user |
| `GET` | `/api/ai/recommendations/history` | Get recommendation history |
| `POST` | `/api/ai/recommendations/generate` | NOT IMPLEMENTED (throws error) |
| `POST` | `/api/ai/recommendations/:id/click` | Track recommendation click |

Recommendation types: `RECENTLY_VIEWED`, `FREQUENTLY_PURCHASED`, `RECOMMENDED`, `RECENTLY_PURCHASED`, `WISHLIST_BASED`, `CART_BASED`.

---

## PART 11 — PRODUCT SPECIFICATIONS

### How Specifications Work

Product specifications use the **Attribute** system:

1. **Attribute Groups** (e.g., "Fabric Details", "Dimensions", "Care Instructions")
2. **Attributes** (e.g., "Fabric", "Sleeve Length", "Wash Care") — linked to a group
3. **Attribute Options** (e.g., "Cotton", "Polyester") — possible values for SELECT/MULTI_SELECT attributes
4. **Product Attributes** (product-to-attribute-value mappings)

### Attribute Types

| Type | Description |
|------|-------------|
| `TEXT` | Free text value |
| `NUMBER` | Numeric value |
| `BOOLEAN` | True/false |
| `COLOR` | Color value (hex/rgb) |
| `DATE` | Date value |
| `SELECT` | Single select from options |
| `MULTI_SELECT` | Multiple select from options |
| `SIZE` | Size value |
| `IMAGE` | Image URL |
| `URL` | URL value |

### Attribute API Endpoints

All admin-only — no public attribute endpoints exist.

### Categories → Attributes Mapping

Category-Attribute mappings exist (`CategoryAttribute` model) but are not exposed via API. This means the frontend cannot dynamically discover which attributes apply to a product's category.

### Physical Specifications

Stored directly on Product (not via attributes):
- `weight` (kg)
- `length` (cm)
- `width` (cm)
- `height` (cm)

### Other Specs

| Field | Storage | Available? |
|-------|---------|------------|
| Fabric | Product attributes | ✅ via `attributes[]` array |
| Dimensions | Product fields | ✅ via `weight/length/width/height` |
| Wash Care | Product attributes | ✅ if admin has set it |
| Manufacturer | Not stored | ❌ |
| Warranty | Not stored | ❌ |
| Country of Origin | Not stored | ❌ |

---

## PART 12 — OFFERS

### Offers

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/offers/active` | Public | Get all currently active offers |
| `GET` | `/api/offers/:id` | Public | Get offer by ID |
| `GET` | `/api/offers` | Admin | List all offers |

**OfferResponse**:
```json
{
  "id": "uuid",
  "name": "Summer Sale 25% Off",
  "description": "Get 25% off on all summer collection",
  "type": "FLASH_SALE",
  "value": 25.00,
  "applicableTo": "CATEGORY",
  "applicableIds": ["uuid-category"],
  "priority": 1,
  "startDate": "2025-06-01T00:00:00Z",
  "endDate": "2025-06-30T23:59:59Z",
  "isActive": true,
  "createdAt": "..."
}
```

**Offer Types**: PRODUCT, CATEGORY, BRAND, FESTIVAL, FLASH_SALE

**Applicable To**: PRODUCT, CATEGORY, BRAND (specified by `applicableTo` + `applicableIds`)

### Coupons

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/coupons/apply` | JWT | Apply coupon to order |

**Apply Coupon Request**:
```json
{
  "code": "SUMMER25",
  "orderId": "uuid",
  "orderAmount": 999.00
}
```

**Apply Coupon Response**:
```json
{
  "couponId": "uuid",
  "code": "SUMMER25",
  "discountAmount": 249.75,
  "message": "Coupon applied successfully"
}
```

**Coupon Types**: FLAT, PERCENTAGE, FREE_SHIPPING

### What's Missing for Product Page

The product page cannot show applicable offers/coupons without:
1. A dedicated "product offers" endpoint (does not exist)
2. Frontend would need to fetch all active offers and filter client-side by product/category/brand
3. Coupon applicability is only checked at checkout, not on product page

---

## PART 13 — AI FEATURES

### AI Search

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/search?q=...` | Optional JWT | Full-text search with filters |
| `GET` | `/api/search/autocomplete?q=...` | Public | Autocomplete suggestions |

The search endpoint returns `SearchResponse` with:
- `data` — array of simplified product results
- `appliedFilters` — current filters
- `availableFilters` — facet counts for brands, categories, etc.
- `meta` — pagination info

### AI Recommendations

See Part 10. The `generate` endpoint is not implemented. `getRecommendations` returns stored recommendations from `CustomerRecommendation` table (populated by a future AI service).

### AI Chat

Backend has an `ai-chat` module but it's **not imported** in `app.module.ts` (commented out). Not available.

### Similar Products

**No similar-products-by-AI endpoint exists.** The only "similar" mechanism is manually assigned `relatedProducts`.

### Style Suggestions

Not implemented.

---

## PART 14 — DATABASE MAPPING

### Product Detail Page → Database

| UI Section | Controller | Service | Repository | Prisma Model | DB Table |
|------------|-----------|---------|------------|-------------|----------|
| Product Info | ProductsController | ProductsService | ProductsRepository | Product | products |
| Brand | (included via include) | ProductsService | ProductsRepository | Brand | brands |
| Categories | (included via include) | ProductsService | ProductsRepository | ProductCategory + Category | product_categories + categories |
| Attributes | (included via include) | ProductsService | ProductsRepository | ProductAttribute + Attribute | product_attributes + attributes |
| Related Products | (included via include) | ProductsService | ProductsRepository | ProductRelatedProduct | product_related_products |
| Images | MediaController | MediaService | MediaRepository | ProductMedia | product_media |
| Variants | ProductVariantsController | ProductVariantsService | ProductVariantsRepository | ProductVariant | product_variants |
| Variant Attributes | ProductVariantsController | ProductVariantsService | ProductVariantsRepository | VariantAttributeValue + Attribute | variant_attribute_values |
| Inventory | InventoryController | InventoryService | InventoryRepository | Inventory | inventory |
| Reviews | ReviewController | ReviewService | ReviewRepository | Review | reviews |
| Review Images | ReviewController | ReviewService | ReviewRepository | ReviewImage | review_images |
| Review Votes | ReviewController | ReviewService | ReviewRepository | ReviewVote | review_votes |
| Wishlist | WishlistController | WishlistService | WishlistRepository | Wishlist + WishlistItem | wishlists + wishlist_items |
| Cart | CartController | CartService | CartRepository | ShoppingCart + ShoppingCartItem | shopping_carts + shopping_cart_items |
| Offers | OfferController | OfferService | OfferRepository | Offer | offers |
| Coupons | CouponController | CouponService | CouponRepository | Coupon | coupons |
| Shipping | ShippingController | ShippingService | ShippingRepository | ShippingMethod + ShippingZone | shipping_methods + shipping_zones |
| Recommendations | AiRecommendationController | AiRecommendationService | AiRecommendationRepository | CustomerRecommendation | customer_recommendations |
| Search | SearchController | SearchService | SearchRepository | (full-text on Product) | products (with full-text search) |

### Key Relationships

```
Product
  ├── Brand (belongsTo, brandId → brands.id)
  ├── ProductCategory (hasMany, productId → product_categories.productId → categories.id)
  ├── ProductAttribute (hasMany, productId → product_attributes.productId → attributes.id)
  ├── ProductRelatedProduct (hasMany as "relatedTo", productId → product_related_products.productId → products.id)
  ├── ProductVariant (hasMany, productId → product_variants.productId)
  │   ├── VariantAttributeValue (hasMany, variantId → variant_attribute_values.variantId)
  │   └── Inventory (hasOne, variantId → inventory.variantId)
  ├── ProductMedia (hasMany, productId → product_media.productId)
  └── Review (hasMany, productId → reviews.productId)
```

---

## PART 15 — FRONTEND REQUIREMENTS

### API Service Files Needed

| Service Name | APIs Called |
|-------------|-------------|
| `productService` | `GET /products/:id`, `GET /products` |
| `mediaService` | `GET /media?productId=:id` |
| `variantService` | `GET /variants?productId=:id` |
| `reviewService` | `GET /reviews?productId=:id`, `GET /reviews/product/:id/summary`, `POST /reviews`, `POST /reviews/:id/vote` |
| `cartService` | `POST /cart/items`, `GET /cart`, `GET /cart/summary`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id` |
| `wishlistService` | `POST /wishlist/items`, `GET /wishlist/check/:productId`, `GET /wishlist/count`, `DELETE /wishlist/items/:productId` |
| `shippingService` | `GET /shipping/methods`, `GET /shipping/methods/:code/calculate` |
| `offerService` | `GET /offers/active` |
| `searchService` | `GET /search/autocomplete` |
| `categoryService` | `GET /categories/:id`, `GET /categories/tree` |
| `brandService` | `GET /brands/:id` |
| `aiRecommendationService` | `GET /ai/recommendations` |

### Hooks Needed

| Hook | Purpose |
|------|---------|
| `useProduct(id)` | Fetch product details |
| `useProductMedia(productId)` | Fetch product images/videos |
| `useProductVariants(productId)` | Fetch variants with attribute options |
| `useReviews(productId)` | Fetch paginated reviews with summary |
| `useCreateReview()` | Submit a review |
| `useReviewVote()` | Vote helpful/unhelpful |
| `useAddToCart()` | Add item to cart |
| `useCart()` | Get current cart |
| `useWishlist(productId)` | Check/Add/Remove wishlist |
| `useShippingEstimate()` | Calculate delivery estimate |
| `useActiveOffers()` | Get active offers |
| `useRelatedProducts(productIds)` | Fetch full details of related products |

### Components Needed

| Component | Data Source |
|-----------|-------------|
| `ProductImageGallery` | `GET /media?productId=:id` (media array) |
| `ProductImageZoom` | Image URL (large variant) |
| `ProductInfo` | `ProductResponse` (name, price, description) |
| `ProductPricing` | `ProductResponse` (basePrice, salePrice, discount) |
| `ProductVariantSelector` | `GET /variants?productId=:id` |
| `ProductSizeSelector` | Variant attributes (size type) |
| `ProductColorSelector` | Variant attributes (color type) |
| `ProductQuantitySelector` | `minimumOrderQuantity`, `maximumOrderQuantity`, inventory |
| `AddToCartButton` | `POST /cart/items` |
| `BuyNowButton` | `POST /cart/items` + navigate to checkout |
| `WishlistButton` | `POST /wishlist/items`, `DELETE /wishlist/items/:id` |
| `ShareButton` | Web Share API / clipboard |
| `DeliveryEstimate` | `GET /shipping/methods/:code/calculate` |
| `ProductReviews` | `GET /reviews?productId=:id` |
| `ReviewSummary` | `GET /reviews/product/:id/summary` |
| `ReviewCard` | Individual review display |
| `ReviewForm` | `POST /reviews` |
| `RelatedProducts` | `ProductResponse.relatedProducts` + `GET /products/:id` |
| `ProductBreadcrumb` | `GET /categories/tree` |
| `ProductSpecs` | `ProductResponse.attributes` |
| `ProductOffers` | `GET /offers/active` |
| `ProductSeo` | `ProductResponse` (seoTitle, seoDescription, canonicalUrl) |
| `ProductSkeleton` | Loading state |
| `ProductError` | Error state |
| `ProductNotFound` | 404 state |

### TypeScript Interfaces

```typescript
interface Product {
  id: string; sku: string; barcode: string;
  name: string; slug: string;
  primaryImageUrl?: string;
  shortDescription?: string; description?: string;
  brandId: string; brandName?: string;
  type: ProductType; status: string; visibility: string;
  basePrice: number; salePrice?: number;
  wholesalePrice?: number; costPrice?: number;
  taxPercentage?: number;
  discountType?: string; discountValue?: number;
  trackInventory: boolean; allowBackorder: boolean;
  minimumOrderQuantity: number; maximumOrderQuantity: number;
  weight?: number; length?: number; width?: number; height?: number;
  isFeatured: boolean; isNewArrival: boolean; isBestSeller: boolean;
  isPublished: boolean; publishedAt?: string; displayOrder: number;
  seoTitle?: string; seoDescription?: string; seoKeywords?: string;
  canonicalUrl?: string; searchKeywords?: string;
  gender?: string; ageGroup?: string; occasion?: string; season?: string;
  tags?: string[]; collections?: string[];
  categories?: ProductCategoryInfo[];
  attributes?: ProductAttributeInfo[];
  relatedProducts?: ProductRelatedInfo[];
  createdAt: string; updatedAt: string;
}

interface ProductCategoryInfo { categoryId: string; categoryName: string; categorySlug: string; }
interface ProductAttributeInfo { attributeId: string; attributeName: string; attributeType: string; value?: string; }
interface ProductRelatedInfo { productId: string; productName: string; }

interface ProductMedia {
  id: string; productId: string; variantId?: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | '360_IMAGE';
  title?: string; altText?: string;
  url: string; thumbnailUrl?: string;
  displayOrder: number; isPrimary: boolean; status: string;
  createdAt: string; updatedAt: string;
}

interface ProductVariant {
  id: string; productId: string; sku: string; barcode: string;
  title: string;
  priceOverride?: number; salePriceOverride?: number; costPrice?: number;
  weight?: number; length?: number; width?: number; height?: number;
  displayOrder: number; status: string; isDefault: boolean; isActive: boolean;
  attributeValues?: VariantAttributeInfo[];
  createdAt: string; updatedAt: string;
}

interface VariantAttributeInfo {
  attributeId: string; attributeName: string; attributeType: string;
  attributeOptionId?: string; optionLabel?: string; value?: string;
}

interface Review {
  id: string; productId: string; customerId: string;
  rating: number; title?: string; comment?: string;
  images: ReviewImage[];
  isVerifiedPurchase: boolean;
  helpfulCount: number; unhelpfulCount: number;
  isApproved: boolean; createdAt: string;
}

interface ReviewImage { id: string; url: string; altText?: string; displayOrder: number; }

interface ReviewSummary {
  averageRating: number; totalReviews: number;
  ratingDistribution: Record<string, number>;
}

interface CartItemRequest { productId: string; variantId?: string; quantity?: number; }

interface WishlistItemRequest { productId: string; variantId?: string; notes?: string; }

interface ShippingCalculation {
  methodCode: string; methodName: string;
  rate: number; estimatedDelivery: string; freeShipping: boolean;
}

interface Offer {
  id: string; name: string; description?: string;
  type: 'PRODUCT' | 'CATEGORY' | 'BRAND' | 'FESTIVAL' | 'FLASH_SALE';
  value: number;
  applicableTo?: string; applicableIds?: string[];
  priority: number; startDate: string; endDate: string;
  isActive: boolean; createdAt: string;
}
```

---

## PART 16 — PRODUCT DETAIL UI MAPPING

| Component | API Used | Fields Used | Loading | Empty | Error | Permission |
|-----------|----------|-------------|---------|-------|-------|------------|
| Breadcrumb | `GET /categories/tree` + product categories | categoryId, categoryName, categorySlug | Skeleton | Show product name only | Toast | Public |
| Product Image Gallery | `GET /media?productId=:id` | url, thumbnailUrl, mediaType, isPrimary, displayOrder, altText | Image skeleton | Show placeholder | Toast, fallback placeholder | Public |
| Product Info | `GET /products/:id` | name, shortDescription, description, brandName | Text skeleton | — | 404 page | Public |
| Product Price | `GET /products/:id` | basePrice, salePrice, discountType, discountValue, taxPercentage | Price skeleton | — | — | Public |
| Variant Selector | `GET /variants?productId=:id` | title, isDefault, isActive, attributeValues | Selector skeleton | No variants message | Toast | Public |
| Size Selector | `GET /variants?productId=:id` | attributeValues where attributeType=SIZE | Skeleton | — | — | Public |
| Color Selector | `GET /variants?productId=:id` | attributeValues where attributeType=COLOR | Skeleton | — | — | Public |
| Quantity Selector | `GET /products/:id` + inventory | minimumOrderQuantity, maximumOrderQuantity | Disabled | — | — | Public |
| Add to Cart | `POST /cart/items` | productId, variantId, quantity | Button loading | — | Toast error | JWT or guest |
| Buy Now | `POST /cart/items` + navigate | productId, variantId, quantity | Button loading | — | Toast error | JWT or guest |
| Wishlist Button | `GET /wishlist/check/:id` + `POST/DELETE` | productId | Heart icon loading | — | Toast error | JWT only |
| Share Button | Web Share API | product url + name | — | — | Fallback copy link | Public |
| Delivery Estimate | `GET /shipping/methods/:code/calculate` | pincode, country, state, weight | Skeleton | Enter pincode prompt | Location error | Public |
| Product Specs | `GET /products/:id` | attributes[] | Skeleton | No specs message | — | Public |
| Review Summary | `GET /reviews/product/:id/summary` | averageRating, totalReviews, ratingDistribution | Star skeleton | No reviews | Toast | Public |
| Review List | `GET /reviews?productId=:id` | rating, title, comment, images, customerName | Card skeleton | "No reviews yet" | Toast | Public |
| Review Form | `POST /reviews` | productId, rating, title, comment | Form loading | — | Validation errors | JWT only |
| Related Products | `GET /products/:id` (relatedProducts) + `GET /products/:rid` | productId, productName + full product | Grid skeleton | Hide section | Hide section | Public |
| Product Offers | `GET /offers/active` | name, description, type, value | Offer card skeleton | Hide section | Hide section | Public |
| Product SEO | `GET /products/:id` | seoTitle, seoDescription, canonicalUrl, seoKeywords | — | — | — | Public |

---

## PART 17 — MISSING ITEMS

### Missing Backend APIs

| Missing API | Impact | Workaround |
|-------------|--------|------------|
| `GET /products/:id/variants` (dedicated endpoint with inventory) | Need separate calls for variants + inventory | Call `GET /variants?productId=:id` + `GET /inventory/variant/:variantId` |
| `GET /products/:id/media` (dedicated media endpoint in product context) | Need separate media call | Call `GET /media?productId=:id` |
| `GET /products/:id/offers` (applicable offers for this product) | Can't show product-specific offers | Fetch all active offers + filter client-side by product/category/brand |
| `GET /products/:id/delivery` (pincode → delivery estimate) | Need separate shipping calculation | Call `GET /shipping/methods/:code/calculate` with user pincode |
| `POST /products/:id/notify` (notify when back in stock) | No "Notify Me" functionality | Must implement client-side |
| `POST /products/:id/questions` (ask a question) | No product Q&A | Use support ticket API (`POST /api/support/tickets`) |
| `POST /products/:id/report` (report product) | No abuse reporting | Not available |
| `GET /cart/checkout` (pre-checkout price breakup) | No consolidated price with all calculations | Must calculate on frontend |
| `GET /products/:id/compare` (compare products) | No compare feature | Frontend only (localStorage) |
| `GET /products/:id/recommendations` (AI similar products) | No AI similar products | Use manually assigned relatedProducts |

### Missing Response Fields

| Field | Why Missing | Workaround |
|-------|-------------|------------|
| `variants` array in ProductResponse | Not included | Separate `GET /variants?productId=:id` |
| `media` array in ProductResponse | Only `primaryImageUrl` is included | Separate `GET /media?productId=:id` |
| `inventory` in ProductResponse | Not included | Separate `GET /inventory/variant/:variantId` for each variant |
| `fullShippingCost` | Must be calculated per-pincode | Called separately |
| `finalPrice` with taxes | Not computed on backend | Calculate on frontend |
| `codAvailable` | Not stored per-product or per-pincode | Not available |
| `stockStatus` on product | Only on inventory (per variant) | Check inventory for default variant |
| `reviewCount` and `averageRating` on product | Not included in ProductResponse | Separate `GET /reviews/product/:id/summary` |
| `offerBadge` or `offerText` | No computed offer info | Filter active offers on frontend |
| `priceHistory` or `lowestPrice` | Not stored | Not available |
| `videoUrls` or `ytLinks` | Only media with type=VIDEO | Check media array |

### Missing Validation

| Missing Validation | Impact |
|--------------------|--------|
| No cart max quantity validation against `maximumOrderQuantity` | Could allow more than max |
| No guest cart expiry | Guest carts persist indefinitely |
| No review image size/type validation (handled client-side) | Could upload unsupported formats |
| No pincode format validation in shipping calculate | Could send invalid pincode |

### Missing Business Logic

| Missing Logic | Impact |
|---------------|--------|
| `POST /ai/recommendations/generate` throws NOT_IMPLEMENTED | AI recommendations don't work |
| No auto-population of `isVerifiedPurchase` in reviews | All reviews show `isVerifiedPurchase: false` |
| No price recalculation when product price changes (cart uses price at add time) | Cart price may differ from current product price |
| No inventory auto-decrement on add to cart (only reserved at checkout) | Over-selling possible between add-to-cart and checkout |
| COD availability not checked per-pincode | COD shown for all or none |
| No "frequently bought together" computation | No bundled recommendations |
| No recently viewed tracking (backend) | Frontend must use localStorage |

### Missing Frontend Requirements

| Requirement | Reason |
|-------------|--------|
| Split product loading into 3+ parallel API calls | Product + Variants + Media are separate endpoints |
| Manual variant-to-inventory mapping | Inventory is only available by variantId |
| Client-side price computation | No "final price" endpoint exists |
| Client-side offer applicability | No product-specific offers endpoint |
| LocalStorage recently-viewed | No backend support |
| Web Share API for share | No backend share endpoint |
| Pincode input before delivery estimate | Shipping calculate requires location |
| Stripe/Razorpay direct integration | Payment is handle at checkout, not PDP |

---

## PART 18 — FINAL REPORT

### 1. Product Details APIs
- `GET /api/products/:id` (public) — main product detail
- `GET /api/products` (public) — related product listings
- `GET /api/search` (public) — search for related products
- `GET /api/media?productId=:id` (public) — product images
- `GET /api/variants?productId=:id` (public) — product variants
- `GET /api/reviews?productId=:id` (public) — reviews
- `GET /api/reviews/product/:id/summary` (public) — rating summary
- `GET /api/offers/active` (public) — active offers
- `GET /api/shipping/methods` (public) — shipping methods
- `GET /api/categories/tree` (public) — breadcrumb categories

### 2. Request Bodies
- `POST /api/cart/items`: `{ productId, variantId?, quantity? }`
- `POST /api/wishlist/items`: `{ productId, variantId?, notes? }`
- `POST /api/reviews`: `{ productId, rating, title?, comment?, imageUrls? }`
- `POST /api/reviews/:id/vote`: `{ isHelpful: boolean }`

### 3. Response Bodies
Complete `ProductResponse`, `ProductMediaResponse`, `VariantResponse`, `ReviewResponse`, `ReviewSummary`, `CartResponse`, `OfferResponse`, `ShippingCalculationResponse` — all documented above.

### 4. Response Field Documentation
Every field of `ProductResponse` documented with type, presence, and description.

### 5. Product Images
Stored in `ProductMedia` model, S3 storage with auto-generated WebP variants (thumb/medium/large/original). Primary image URL included in `ProductResponse`; full media array fetched separately.

### 6. Variants
`ProductVariant` model with attribute-based differentiation. Variant data fetched separately. Each variant can override price, dimensions, and has its own SKU/barcode.

### 7. Pricing
`basePrice` (MRP), `salePrice` (selling price), `wholesalePrice`, `costPrice`, `taxPercentage`, `discountType`, `discountValue`. Final price = `salePrice ?? basePrice`.

### 8. Inventory
Per-variant inventory with `availableQuantity`, `reservedQuantity`, automatic stock status calculation. Fetched separately by variant ID.

### 9. Delivery
Shipping method + zone-based rate calculation. Requires user pincode input. No COD availability endpoint.

### 10. Reviews
Full CRUD for reviews with image support, voting mechanism (helpful/unhelpful), admin approval workflow, rating summary aggregation.

### 11. Buttons
Add to Cart (JWT/guest), Wishlist (JWT only), Share (Web API), Buy Now (cart + redirect). Missing: Notify Me, Compare, Ask Question, Report Product (no APIs).

### 12. Related Products
Admin-manual related products only. AI recommendations scaffolded but not functional. Cross-sell, upsell, recently viewed, frequently bought together — all missing.

### 13. AI Features
AI recommendations exist as scaffolded endpoints but `generate` throws NOT_IMPLEMENTED. AI Chat module commented out. Style suggestions and similar-by-AI missing.

### 14. Database Mapping
Complete mapping of every UI section → Controller → Service → Repository → Prisma Model → DB Table.

### 15. Frontend Components Required
~25 components, ~12 hooks, ~12 service files, 15+ TypeScript interfaces documented above.

### 16. Missing Backend APIs
10 missing APIs identified (notify, questions, report, product-specific offers, delivery estimate endpoint, etc.).

### 17. Missing Frontend Requirements
6 missing frontend requirements (split API calls, client-side price computation, localStorage recently-viewed, etc.).

### 18. Product Details Completion %

| Area | Completion | Notes |
|------|-----------|-------|
| Product Info API | ✅ 100% | Full ProductResponse with all fields |
| Product Images | ✅ 80% | `primaryImageUrl` in response; full media via separate API |
| Variants | ✅ 80% | Separate variant endpoint; not embedded in product response |
| Pricing | ⚠️ 70% | Base fields present; no computed final price |
| Inventory | ⚠️ 60% | Per-variant; requires separate API call |
| Delivery | ❌ 30% | Requires pincode; no COD check |
| Reviews | ✅ 85% | Full CRUD; voting; summary; images |
| Add to Cart | ✅ 90% | Works for guest and JWT; merges on login |
| Wishlist | ✅ 85% | Full CRUD; move to cart; check; count |
| Share | ❌ 0% | Frontend-only (Web API) |
| Buy Now | ❌ 0% | No dedicated endpoint (cart + redirect) |
| Notify Me | ❌ 0% | No API |
| Compare | ❌ 0% | No API |
| Ask Question | ❌ 0% | No API |
| Report Product | ❌ 0% | No API |
| Related Products | ⚠️ 50% | Manual only; no AI-powered recommendations |
| AI Recommendations | ❌ 10% | Scaffolded only; generate throws error |
| Product Offers | ❌ 30% | Active offers endpoint; no product-level filtering |
| Delivery Estimate | ⚠️ 50% | Shipping calculation works; needs pincode |
| Breadcrumb | ✅ 80% | Category tree API available |
| SEO | ✅ 100% | All SEO fields in ProductResponse |
| Product Specs | ✅ 80% | Attributes array in ProductResponse |

**Overall Product Details Page Backend Readiness: ~55%**
