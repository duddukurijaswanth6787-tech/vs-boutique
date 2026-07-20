import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  CouponListResponse,
  CouponResponse,
  CreateCouponDto,
  UpdateCouponDto,
  CouponQueryDto,
  ApplyCouponDto,
  CouponApplyResponse,
} from './coupon.types';

export const couponService = {
  findAll: async (query: CouponQueryDto = {}): Promise<CouponListResponse> => {
    const params: Record<string, string | number | boolean> = {};
    if (query.search) params.search = query.search;
    if (query.isActive !== undefined) params.isActive = query.isActive;
    if (query.type) params.type = query.type;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;

    const response = await apiClient.get<StandardResponse<CouponListResponse>>('/coupons', { params });
    return response.data.data!;
  },

  findById: async (id: string): Promise<CouponResponse> => {
    const response = await apiClient.get<StandardResponse<CouponResponse>>(`/coupons/${id}`);
    return response.data.data!;
  },

  create: async (dto: CreateCouponDto): Promise<CouponResponse> => {
    const response = await apiClient.post<StandardResponse<CouponResponse>>('/coupons', dto);
    return response.data.data!;
  },

  update: async (id: string, dto: UpdateCouponDto): Promise<CouponResponse> => {
    const response = await apiClient.patch<StandardResponse<CouponResponse>>(`/coupons/${id}`, dto);
    return response.data.data!;
  },

  apply: async (dto: ApplyCouponDto): Promise<CouponApplyResponse> => {
    const response = await apiClient.post<StandardResponse<CouponApplyResponse>>('/coupons/apply', dto);
    return response.data.data!;
  },
};
