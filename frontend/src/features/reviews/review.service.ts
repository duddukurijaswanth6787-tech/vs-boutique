import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  ReviewListResponse,
  ReviewResponse,
  ReviewQueryDto,
  ProductRatingSummary,
} from './review.types';

export const reviewService = {
  findAll: async (query: ReviewQueryDto = {}): Promise<ReviewListResponse> => {
    const params: Record<string, string | number | boolean> = {};
    if (query.productId) params.productId = query.productId;
    if (query.customerId) params.customerId = query.customerId;
    if (query.rating) params.rating = query.rating;
    if (query.status) params.status = query.status;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;

    const response = await apiClient.get<StandardResponse<ReviewListResponse>>('/reviews', { params });
    return response.data.data!;
  },

  getProductRatingSummary: async (productId: string): Promise<ProductRatingSummary> => {
    const response = await apiClient.get<StandardResponse<ProductRatingSummary>>(`/reviews/product/${productId}/summary`);
    return response.data.data!;
  },

  findById: async (id: string): Promise<ReviewResponse> => {
    const response = await apiClient.get<StandardResponse<ReviewResponse>>(`/reviews/${id}`);
    return response.data.data!;
  },

  approve: async (id: string): Promise<ReviewResponse> => {
    const response = await apiClient.post<StandardResponse<ReviewResponse>>(`/reviews/${id}/approve`);
    return response.data.data!;
  },

  reject: async (id: string): Promise<ReviewResponse> => {
    const response = await apiClient.post<StandardResponse<ReviewResponse>>(`/reviews/${id}/reject`);
    return response.data.data!;
  },
};
