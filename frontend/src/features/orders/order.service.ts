import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  OrderQueryDto,
  OrderListResponse,
  OrderResponse,
  OrderStatistics,
} from './order.types';

export const orderService = {
  findAll: async (query: OrderQueryDto = {}): Promise<OrderListResponse> => {
    const params: Record<string, string | number | boolean> = { ...query };
    const response = await apiClient.get<StandardResponse<OrderListResponse>>('/orders', { params });
    return response.data.data!;
  },

  findById: async (id: string): Promise<OrderResponse> => {
    const response = await apiClient.get<StandardResponse<OrderResponse>>(`/orders/${id}`);
    return response.data.data!;
  },

  getStatistics: async (): Promise<OrderStatistics> => {
    const response = await apiClient.get<StandardResponse<OrderStatistics>>('/orders/statistics');
    return response.data.data!;
  },

  findByOrderNumber: async (orderNumber: string): Promise<OrderResponse> => {
    const response = await apiClient.get<StandardResponse<OrderResponse>>(`/orders/number/${orderNumber}`);
    return response.data.data!;
  },

  updateStatus: async (id: string, status: string, message?: string): Promise<OrderResponse> => {
    const response = await apiClient.patch<StandardResponse<OrderResponse>>(`/orders/${id}/status`, { status, message });
    return response.data.data!;
  },

  restore: async (id: string): Promise<unknown> => {
    const response = await apiClient.post(`/orders/${id}/restore`);
    return response.data.data!;
  },

  exportOrders: async (query: OrderQueryDto): Promise<unknown> => {
    const response = await apiClient.post('/reports/export', { entity: 'order', ...query });
    return response.data.data!;
  },
};
