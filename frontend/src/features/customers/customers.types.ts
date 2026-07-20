export interface UserProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  userType: 'CUSTOMER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';
  accountStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED' | 'PENDING_VERIFICATION' | 'DELETED';
  isEmailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  phone?: string;
  gender?: string;
  roles?: string[];
  permissions?: string[];
}

export interface CustomerProfileDetails {
  id: string;
  userId: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  preferredLanguage?: string;
  preferredCurrency?: string;
  preferredCategories?: string[];
  preferredBrands?: string[];
  preferredSizes?: string[];
  preferredColors?: string[];
  preferredPriceMin?: number;
  preferredPriceMax?: number;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerAddressResponse {
  id: string;
  customerId: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  landmark?: string;
  isDefaultBilling: boolean;
  isDefaultShipping: boolean;
  status: string;
  createdAt: string;
}

export interface CustomerWishlistItem {
  id: string;
  wishlistId: string;
  productId: string;
  productName?: string;
  variantId?: string;
  notes?: string;
  createdAt: string;
}

export interface CustomerCartResponse {
  id: string;
  customerId?: string;
  items: Array<{
    id: string;
    productId: string;
    productName?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  itemCount: number;
  subtotal: number;
}

export interface CustomerWalletResponse {
  id: string;
  customerId: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
}

export interface WalletTransactionResponse {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  balanceAfter: number;
  description?: string;
  referenceType?: string;
  referenceId?: string;
  createdAt: string;
}

export interface WalletTransactionDto {
  amount: number;
  description?: string;
}

export interface UserQueryDto {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
