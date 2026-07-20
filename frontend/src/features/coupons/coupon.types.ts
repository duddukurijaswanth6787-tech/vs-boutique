export enum CouponType {
  FLAT = 'FLAT',
  PERCENTAGE = 'PERCENTAGE',
  FREE_SHIPPING = 'FREE_SHIPPING',
}

export interface CreateCouponDto {
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  perCustomerLimit?: number;
  applicableTo?: string;
  applicableIds?: string[];
  startDate: string;
  endDate: string;
}

export interface UpdateCouponDto {
  code?: string;
  name?: string;
  description?: string;
  type?: CouponType;
  value?: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  perCustomerLimit?: number;
  applicableTo?: string;
  applicableIds?: string[];
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface ApplyCouponDto {
  code: string;
  orderId: string;
  orderAmount: number;
}

export interface CouponQueryDto {
  search?: string;
  isActive?: boolean;
  type?: CouponType;
  page?: number;
  limit?: number;
}

export interface CouponResponse {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  perCustomerLimit: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface CouponApplyResponse {
  couponId: string;
  code: string;
  discountAmount: number;
  message: string;
}

export interface CouponListResponse {
  data: CouponResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
