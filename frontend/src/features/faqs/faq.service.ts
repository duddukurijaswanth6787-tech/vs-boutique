import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  FaqListResponse,
  FaqResponse,
  CreateFaqDto,
  UpdateFaqDto,
  FaqQueryDto,
} from './faq.types';

export const faqService = {
  findAll: async (query: FaqQueryDto = {}): Promise<FaqListResponse> => {
    const params: Record<string, string | number | boolean> = {};
    if (query.search) params.search = query.search;
    if (query.category) params.category = query.category;
    if (query.isActive !== undefined) params.isActive = query.isActive;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;

    const response = await apiClient.get<StandardResponse<FaqListResponse>>('/faqs', { params });
    return response.data.data!;
  },

  findById: async (id: string): Promise<FaqResponse> => {
    const response = await apiClient.get<StandardResponse<FaqResponse>>(`/faqs/${id}`);
    return response.data.data!;
  },

  create: async (dto: CreateFaqDto): Promise<FaqResponse> => {
    const response = await apiClient.post<StandardResponse<FaqResponse>>('/faqs', dto);
    return response.data.data!;
  },

  update: async (id: string, dto: UpdateFaqDto): Promise<FaqResponse> => {
    const response = await apiClient.patch<StandardResponse<FaqResponse>>(`/faqs/${id}`, dto);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/faqs/${id}`);
  },

  markHelpful: async (id: string): Promise<FaqResponse> => {
    const response = await apiClient.post<StandardResponse<FaqResponse>>(`/faqs/${id}/helpful`);
    return response.data.data!;
  },
};
