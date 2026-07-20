import { apiClient } from '@/lib/api/client';
import { BulkOperationResult, BulkOperationDto } from '@/features/bulk/bulk.types';
import { StandardResponse } from '@/types/api.types';
import {
  CreateBrandDto,
  UpdateBrandDto,
  BrandQueryDto,
  BrandResponse,
  BrandListResponse,
} from './brand.types';

export const brandService = {
  findAll: async (query: BrandQueryDto = {}): Promise<BrandListResponse> => {
    const params: Record<string, string | number | boolean> = {};
    if (query.search) params.search = query.search;
    if (query.isFeatured !== undefined) params.isFeatured = query.isFeatured;
    if (query.isVisible !== undefined) params.isVisible = query.isVisible;
    if (query.status) params.status = query.status;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;
    if (query.sortBy) params.sortBy = query.sortBy;
    if (query.sortOrder) params.sortOrder = query.sortOrder;

    const response = await apiClient.get<StandardResponse<BrandListResponse>>('/brands', { params });
    return response.data.data!;
  },

  findById: async (id: string): Promise<BrandResponse> => {
    const response = await apiClient.get<StandardResponse<BrandResponse>>(`/brands/${id}`);
    return response.data.data!;
  },

  create: async (dto: CreateBrandDto): Promise<BrandResponse> => {
    const response = await apiClient.post<StandardResponse<BrandResponse>>('/brands', dto);
    return response.data.data!;
  },

  update: async (id: string, dto: UpdateBrandDto): Promise<BrandResponse> => {
    const response = await apiClient.patch<StandardResponse<BrandResponse>>(`/brands/${id}`, dto);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/brands/${id}`);
  },

  bulk: async (dto: BulkOperationDto): Promise<BulkOperationResult> => {
    const response = await apiClient.post<StandardResponse<BulkOperationResult>>('/brands/bulk', dto);
    return response.data.data!;
  },
  restore: async (id: string): Promise<BrandResponse> => {
    const response = await apiClient.post<StandardResponse<BrandResponse>>(`/brands/${id}/restore`);
    return response.data.data!;
  },
};
