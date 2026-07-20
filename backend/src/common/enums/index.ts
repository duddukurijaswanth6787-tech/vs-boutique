/**
 * Supported runtime environment profiles.
 */
export enum EnvironmentType {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

/**
 * Status lifecycle of platform user accounts.
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
  PENDING = 'PENDING',
}

/**
 * Placeholder status lifecycle for customer orders.
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  PLACED = 'PLACED',
  CONFIRMED = 'CONFIRMED',
  PACKED = 'PACKED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

/**
 * Placeholder status lifecycle for transactions and payments.
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

/**
 * Enterprise user role tier access types.
 */
export enum RoleType {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER',
}

/**
 * Enterprise staff specialization profiles.
 */
export enum StaffType {
  PRODUCT_MANAGER = 'PRODUCT_MANAGER',
  WAREHOUSE_STAFF = 'WAREHOUSE_STAFF',
  PACKING_STAFF = 'PACKING_STAFF',
  CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT',
  MARKETING = 'MARKETING',
  ACCOUNTANT = 'ACCOUNTANT',
}
