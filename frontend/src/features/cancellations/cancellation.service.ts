import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  CancellationResponse,
  CreateCancellationDto,
  UpdateCancellationDto,
} from './cancellation.types';

export const cancellationService = {
  findByOrderId: async (orderId: string): Promise<CancellationResponse> => {
    const response = await apiClient.get<StandardResponse<CancellationResponse>>(`/cancellations/${orderId}`);
    return response.data.data!;
  },

  create: async (dto: CreateCancellationDto): Promise<CancellationResponse> => {
    const response = await apiClient.post<StandardResponse<CancellationResponse>>('/cancellations', dto);
    return response.data.data!;
  },

  update: async (id: string, dto: UpdateCancellationDto): Promise<CancellationResponse> => {
    const response = await apiClient.patch<StandardResponse<CancellationResponse>>(`/cancellations/${id}`, dto);
    return response.data.data!;
  },
};
