import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  RefundQueryDto,
  RefundListResponse,
  RefundResponse,
  CreateRefundDto,
  UpdateRefundDto,
} from './refund.types';

export const refundService = {
  findAll: async (query: RefundQueryDto = {}): Promise<RefundListResponse> => {
    const params: Record<string, string | number | boolean> = { ...query };
    const response = await apiClient.get<StandardResponse<RefundListResponse>>('/refunds', { params });
    return response.data.data!;
  },

  findByOrderId: async (orderId: string): Promise<RefundResponse[]> => {
    const response = await apiClient.get<StandardResponse<RefundResponse[]>>(`/refunds/order/${orderId}`);
    return response.data.data!;
  },

  findById: async (id: string): Promise<RefundResponse> => {
    const response = await apiClient.get<StandardResponse<RefundResponse>>(`/refunds/${id}`);
    return response.data.data!;
  },

  create: async (dto: CreateRefundDto): Promise<RefundResponse> => {
    const response = await apiClient.post<StandardResponse<RefundResponse>>('/refunds', dto);
    return response.data.data!;
  },

  updateStatus: async (id: string, dto: UpdateRefundDto): Promise<RefundResponse> => {
    const response = await apiClient.patch<StandardResponse<RefundResponse>>(`/refunds/${id}/status`, dto);
    return response.data.data!;
  },
};
