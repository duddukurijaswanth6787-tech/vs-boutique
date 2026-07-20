import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  ReturnQueryDto,
  ReturnListResponse,
  ReturnRequestResponse,
  CreateReturnDto,
  UpdateReturnStatusDto,
} from './return.types';

export const returnService = {
  findAll: async (query: ReturnQueryDto = {}): Promise<ReturnListResponse> => {
    const params: Record<string, string | number | boolean> = { ...query };
    const response = await apiClient.get<StandardResponse<ReturnListResponse>>('/returns', { params });
    return response.data.data!;
  },

  findById: async (id: string): Promise<ReturnRequestResponse> => {
    const response = await apiClient.get<StandardResponse<ReturnRequestResponse>>(`/returns/${id}`);
    return response.data.data!;
  },

  create: async (dto: CreateReturnDto): Promise<ReturnRequestResponse> => {
    const response = await apiClient.post<StandardResponse<ReturnRequestResponse>>('/returns', dto);
    return response.data.data!;
  },

  updateStatus: async (id: string, dto: UpdateReturnStatusDto): Promise<ReturnRequestResponse> => {
    const response = await apiClient.patch<StandardResponse<ReturnRequestResponse>>(`/returns/${id}/status`, dto);
    return response.data.data!;
  },
};
