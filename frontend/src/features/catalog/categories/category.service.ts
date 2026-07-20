import { apiClient } from '@/lib/api/client';
import { BulkOperationResult, BulkOperationDto } from '@/features/bulk/bulk.types';
import { StandardResponse } from '@/types/api.types';
import { UploadUrlResponse } from '../media/media.types';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryDto,
  CategoryResponse,
  CategoryListResponse,
  MoveCategoryDto,
  ReorderCategoriesDto,
  CategorySummaryResponse,
} from './category.types';

export const categoryService = {
  findAll: async (query: CategoryQueryDto = {}): Promise<CategoryListResponse> => {
    const params: Record<string, string | number | boolean> = {};
    if (query.search) params.search = query.search;
    if (query.parentId) params.parentId = query.parentId;
    if (query.isFeatured !== undefined) params.isFeatured = query.isFeatured;
    if (query.isVisible !== undefined) params.isVisible = query.isVisible;
    if (query.status) params.status = query.status;
    if (query.deleted) params.deleted = query.deleted;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;

    const response = await apiClient.get<StandardResponse<CategoryListResponse>>('/categories', { params });
    return response.data.data!;
  },

  getTree: async (): Promise<CategoryResponse[]> => {
    const response = await apiClient.get<StandardResponse<CategoryResponse[]>>('/categories/tree');
    return response.data.data!;
  },

  getSummary: async (): Promise<CategorySummaryResponse> => {
    const response = await apiClient.get<StandardResponse<CategorySummaryResponse>>('/categories/summary');
    return response.data.data!;
  },

  getUploadUrl: async (type: 'image' | 'banner', extension: string): Promise<UploadUrlResponse> => {
    const response = await apiClient.post<StandardResponse<UploadUrlResponse>>('/categories/upload-url', {
      type,
      extension,
    });
    return response.data.data!;
  },

  findById: async (id: string): Promise<CategoryResponse> => {
    const response = await apiClient.get<StandardResponse<CategoryResponse>>(`/categories/${id}`);
    return response.data.data!;
  },

  create: async (dto: CreateCategoryDto): Promise<CategoryResponse> => {
    const response = await apiClient.post<StandardResponse<CategoryResponse>>('/categories', dto);
    return response.data.data!;
  },

  update: async (id: string, dto: UpdateCategoryDto): Promise<CategoryResponse> => {
    const response = await apiClient.patch<StandardResponse<CategoryResponse>>(`/categories/${id}`, dto);
    return response.data.data!;
  },

  move: async (id: string, dto: MoveCategoryDto): Promise<CategoryResponse> => {
    const response = await apiClient.patch<StandardResponse<CategoryResponse>>(`/categories/${id}/move`, dto);
    return response.data.data!;
  },

  reorder: async (dto: ReorderCategoriesDto): Promise<void> => {
    await apiClient.patch('/categories/reorder', dto);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },

  bulk: async (dto: BulkOperationDto): Promise<BulkOperationResult> => {
    const response = await apiClient.post<StandardResponse<BulkOperationResult>>('/categories/bulk', dto);
    return response.data.data!;
  },
  clone: async (id: string): Promise<unknown> => {
    const response = await apiClient.post(`/categories/${id}/clone`);
    return response.data.data!;
  },
  restore: async (id: string): Promise<CategoryResponse> => {
    const response = await apiClient.post<StandardResponse<CategoryResponse>>(`/categories/${id}/restore`);
    return response.data.data!;
  },
};
