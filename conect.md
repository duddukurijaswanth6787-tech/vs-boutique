# CONECT - Mobile to Admin Backend Integration Specification (VS Boutique)

## 1. System Overview

### 1.1 Components
- **Mobile App (Customer App):** Customer-facing app to browse boutiques, view details/designs, place bookings, and track future orders.
- **Admin Panel (Super Admin):** Internal panel to create boutiques, manage owners, monitor platform data, and control verification/feature visibility.
- **Owner Panel (Boutique Owner):** Boutique-facing panel to maintain profile, services, gallery, and designs for customer display.
- **Backend (Node.js + Express + MongoDB):** Central API and data layer for auth, boutique data, designs, bookings, and role-based access control.

### 1.2 End-to-End Flow
1. Super Admin creates boutique record.
2. Super Admin assigns owner to boutique.
3. Owner updates boutique profile, services, gallery, and designs.
4. Backend stores and validates all updates in MongoDB.
5. Mobile app fetches boutique list and boutique details from backend.
6. Customer browses, views designs, and submits booking/order actions.

---

## 2. Mobile App Screens and Required Fields

## 2.1 Home Screen (Boutique Listing)

### API Contract Fields (per boutique item)
- `id`
- `name`
- `location` (object):
  - `city`
  - `area`
- `rating`
- `yearsExperience`
- `tags` (array of services)
- `coverImage`
- `isVerified`
- `isFeatured`

### UI Notes
- Used for listing cards, search/filter, and featured/verified badges.

## 2.2 Boutique Details Screen

### Basic Info
- `name`
- `rating`
- `totalReviews`
- `yearsExperience`
- `location` (full address)
- `description`

### Stats
- `happyClientsCount`
- `designsCount`
- `isVerified`

### Services
- `servicesOffered` (array)
- `workTypeSpecialty` (array)

### Designs
- `designList` (array of objects):
  - `image`
  - `title`
  - `price`
  - `rating`

### Media
- `galleryImages` (array)

### Actions
- `phoneNumber`
- `whatsappNumber`
- `bookingEnabled`

## 2.3 Booking Screen

### Form Fields
- `customerName`
- `mobileNumber`
- `selectedService`
- `preferredDate`
- `preferredTime`
- `notes`

## 2.4 Orders Screen (Future)

### Fields
- `orderId`
- `designName`
- `price`
- `status`
- `deliveryDate`

---

## 3. Admin to Mobile Data Mapping

### 3.1 Field Mapping Table
- `name` -> Mobile boutique name/title
- `servicesOffered` -> Specialties/Services section
- `workTypeSpecialty` -> Skills/Work-type chips
- `galleryImages` -> Photos/Gallery tab
- `logo` -> Boutique header/profile image
- `coverImage` -> Home card banner + detail hero image
- `startingPrice` -> Price range display
- `rating` -> Rating badge/stars
- `yearsExperience` -> Experience label
- `isVerified` -> Verified badge
- `isFeatured` -> Featured section placement
- `phoneNumber` -> Call action
- `whatsappNumber` -> WhatsApp action
- `description` -> About section
- `city + area` -> Home card location text
- `fullAddress` -> Detail page address

### 3.2 Normalization Rules
- If admin stores location split (`city`, `state`, `fullAddress`), backend must expose:
  - list payload: `location.city`, `location.area`
  - detail payload: `location` as full address string/object
- If image fields are missing, backend returns default placeholder URLs.

---

## 4. Required Backend APIs

## 4.1 Boutique APIs
- `GET /boutiques`
  - Purpose: list boutiques for mobile home screen.
  - Query support: `search`, `city`, `service`, `featured`, `verified`, `page`, `limit`.
- `GET /boutiques/:id`
  - Purpose: fetch full boutique detail payload for details screen.

## 4.2 Owner APIs
- `GET /owner/profile`
  - Purpose: owner fetches current boutique-linked profile data.
- `PUT /owner/profile`
  - Purpose: owner updates editable profile details.

## 4.3 Design APIs
- `GET /designs/:boutiqueId`
  - Purpose: fetch designs for boutique detail screen.
- `POST /designs`
  - Purpose: owner adds design with image/title/price/category.

## 4.4 Booking APIs
- `POST /bookings`
  - Purpose: customer creates booking request.
- `GET /bookings/:boutiqueId`
  - Purpose: owner/admin views bookings by boutique.

### 4.5 Standard API Response Shape
- Success:
  - `success: true`
  - `message: string`
  - `data: object | array`
- Error:
  - `success: false`
  - `message: string`
  - `errors: array` (optional)

---

## 5. Data Flow

1. **Super Admin Onboarding**
   - Create boutique with base identity and visibility fields.
2. **Owner Assignment**
   - Link owner account to boutique and grant scoped permissions.
3. **Owner Content Management**
   - Update services, images, pricing, and design catalog.
4. **Persistence Layer**
   - Backend validates payloads and writes updates to MongoDB.
5. **Mobile Consumption**
   - Home screen calls `GET /boutiques`.
   - Details screen calls `GET /boutiques/:id` and `GET /designs/:boutiqueId`.
6. **Customer Actions**
   - Booking submission via `POST /bookings`.
   - Future order tracking via orders module APIs.

---

## 6. Permissions Logic

### Super Admin
- Full platform access (create/update/delete boutiques, assign owners, verify/feature boutiques, audit visibility).

### Owner
- Access limited to assigned boutique.
- Can update:
  - profile data
  - services/work specialties
  - gallery
  - designs
- Cannot access other boutiques' private data.

### Mobile User (Customer)
- Read-only access to public boutique/design data.
- Can submit booking/order requests only.
- No admin or owner write operations.

---

## 7. Validation Rules

### Required Field Validation
- `name`: required, non-empty string.
- `mobileNumber`: required, 10 digits (`^[0-9]{10}$`).
- `email`: valid email format.
- `images` (`coverImage`, `logo`, `galleryImages[]`, design `image`): valid URL format.
- `servicesOffered`: must be an array; each value non-empty string.
- `price`: numeric, non-negative.

### Additional Validation
- `rating`: numeric range `0-5`.
- `yearsExperience`: integer >= `0`.
- `preferredDate`: must be today or future date.
- `preferredTime`: valid time slot format.

---

## 8. UI Requirements

- Mobile-first layouts for all screens.
- Clean card-based listing on home screen.
- Image-heavy presentation for boutique identity and trust.
- Fast initial render with loading placeholders.
- Skeleton loading for list/detail while API is in-flight.
- Fallback images for missing/invalid image URLs.
- Consistent badges for verified and featured boutiques.

---

## 9. Error Handling

- **API failure:** show inline error + retry action.
- **Empty data:** show friendly placeholder state with refresh option.
- **Network error:** show connectivity message and keep last cached data if available.
- **Invalid form data:** block submission and highlight field-level errors.
- **Server validation error:** map backend error keys to input fields.

---

## 10. Performance Rules

- Use response caching for boutique list/detail payloads.
- Lazy load large images and design galleries.
- Batch and debounce search/filter API calls.
- Paginate long lists (`page`, `limit`) to reduce payload size.
- Avoid unnecessary re-renders with memoized components/selectors.
- Use stale-while-revalidate strategy for smooth UX.

---

## 11. Final Goal

- Admin-managed data is the single source of truth for mobile UI.
- Owner updates become visible to mobile users immediately after backend write success.
- Mobile app renders live, validated, and complete boutique data.
- Integration architecture remains scalable, secure, and production-ready.

