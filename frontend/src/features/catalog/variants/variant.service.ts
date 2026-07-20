import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  CreateVariantDto,
  UpdateVariantDto,
  VariantQueryDto,
  VariantResponse,
  VariantListResponse,
  AssignAttributeValuesDto,
} from './variant.types';

export const variantService = {
  findAll: async (query: VariantQueryDto = {}): Promise<VariantListResponse> => {
    const params: Record<string, string | number | boolean> = {};
    if (query.productId) params.productId = query.productId;
    if (query.status) params.status = query.status;
    if (query.isActive !== undefined) params.isActive = query.isActive;
    if (query.isDefault !== undefined) params.isDefault = query.isDefault;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;
    if (query.sortBy) params.sortBy = query.sortBy;
    if (query.sortOrder) params.sortOrder = query.sortOrder;

    const response = await apiClient.get<StandardResponse<VariantListResponse>>('/variants', { params });
    return response.data.data!;
  },

  findById: async (id: string): Promise<VariantResponse> => {
    const response = await apiClient.get<StandardResponse<VariantResponse>>(`/variants/${id}`);
    return response.data.data!;
  },

  create: async (dto: CreateVariantDto): Promise<VariantResponse> => {
    const response = await apiClient.post<StandardResponse<VariantResponse>>('/variants', dto);
    return response.data.data!;
  },

  update: async (id: string, dto: UpdateVariantDto): Promise<VariantResponse> => {
    const response = await apiClient.patch<StandardResponse<VariantResponse>>(`/variants/${id}`, dto);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/variants/${id}`);
  },

  restore: async (id: string): Promise<VariantResponse> => {
    const response = await apiClient.post<StandardResponse<VariantResponse>>(`/variants/${id}/restore`);
    return response.data.data!;
  },

  activate: async (id: string): Promise<VariantResponse> => {
    const response = await apiClient.post<StandardResponse<VariantResponse>>(`/variants/${id}/activate`);
    return response.data.data!;
  },

  deactivate: async (id: string): Promise<VariantResponse> => {
    const response = await apiClient.post<StandardResponse<VariantResponse>>(`/variants/${id}/deactivate`);
    return response.data.data!;
  },

  setDefault: async (id: string): Promise<VariantResponse> => {
    const response = await apiClient.post<StandardResponse<VariantResponse>>(`/variants/${id}/set-default`);
    return response.data.data!;
  },

  assignAttributeValues: async (id: string, dto: AssignAttributeValuesDto): Promise<VariantResponse> => {
    const response = await apiClient.post<StandardResponse<VariantResponse>>(`/variants/${id}/attribute-values`, dto);
    return response.data.data!;
  },

  removeAttributeValue: async (id: string, attributeId: string): Promise<VariantResponse> => {
    const response = await apiClient.delete<StandardResponse<VariantResponse>>(`/variants/${id}/attribute-values/${attributeId}`);
    return response.data.data!;
  },
};
