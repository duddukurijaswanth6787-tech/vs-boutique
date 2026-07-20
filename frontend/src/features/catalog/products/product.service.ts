import { apiClient } from '@/lib/api/client';
import { BulkOperationResult, BulkOperationDto } from '@/features/bulk/bulk.types';
import { StandardResponse } from '@/types/api.types';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  ProductResponse,
  ProductListResponse,
  AssignCategoriesDto,
  AssignAttributesDto,
  ProductStatsResponse,
} from './product.types';

export const productService = {
  getStats: async (): Promise<ProductStatsResponse> => {
    const response = await apiClient.get<StandardResponse<ProductStatsResponse>>('/products/stats');
    return response.data.data!;
  },

  findAll: async (query: ProductQueryDto = {}): Promise<ProductListResponse> => {
    // Build query params
    const params: Record<string, string | number | boolean> = {};
    if (query.search) params.search = query.search;
    if (query.brandId) params.brandId = query.brandId;
    if (query.status) params.status = query.status;
    if (query.visibility) params.visibility = query.visibility;
    if (query.type) params.type = query.type;
    if (query.gender) params.gender = query.gender;
    if (query.ageGroup) params.ageGroup = query.ageGroup;
    if (query.occasion) params.occasion = query.occasion;
    if (query.season) params.season = query.season;
    if (query.isFeatured !== undefined) params.isFeatured = query.isFeatured;
    if (query.isNewArrival !== undefined) params.isNewArrival = query.isNewArrival;
    if (query.isBestSeller !== undefined) params.isBestSeller = query.isBestSeller;
    if (query.isPublished !== undefined) params.isPublished = query.isPublished;
    if (query.minPrice !== undefined) params.minPrice = query.minPrice;
    if (query.maxPrice !== undefined) params.maxPrice = query.maxPrice;
    if (query.categoryId) params.categoryId = query.categoryId;
    if (query.deleted) params.deleted = query.deleted;
    if (query.createdBy) params.createdBy = query.createdBy;
    if (query.updatedBy) params.updatedBy = query.updatedBy;
    if (query.tags?.length) params.tags = query.tags.join(',');
    if (query.createdAfter) params.createdAfter = query.createdAfter;
    if (query.createdBefore) params.createdBefore = query.createdBefore;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;
    if (query.sortBy) params.sortBy = query.sortBy;
    if (query.sortOrder) params.sortOrder = query.sortOrder;

    const response = await apiClient.get<StandardResponse<ProductListResponse>>('/products', { params });
    return response.data.data!;
  },

  findById: async (id: string): Promise<ProductResponse> => {
    const response = await apiClient.get<StandardResponse<ProductResponse>>(`/products/${id}`);
    return response.data.data!;
  },

  create: async (dto: CreateProductDto): Promise<ProductResponse> => {
    const response = await apiClient.post<StandardResponse<ProductResponse>>('/products', dto);
    return response.data.data!;
  },

  update: async (id: string, dto: UpdateProductDto): Promise<ProductResponse> => {
    const response = await apiClient.patch<StandardResponse<ProductResponse>>(`/products/${id}`, dto);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  restore: async (id: string): Promise<ProductResponse> => {
    const response = await apiClient.post<StandardResponse<ProductResponse>>(`/products/${id}/restore`);
    return response.data.data!;
  },

  publish: async (id: string): Promise<ProductResponse> => {
    const response = await apiClient.post<StandardResponse<ProductResponse>>(`/products/${id}/publish`);
    return response.data.data!;
  },

  unpublish: async (id: string): Promise<ProductResponse> => {
    const response = await apiClient.post<StandardResponse<ProductResponse>>(`/products/${id}/unpublish`);
    return response.data.data!;
  },

  feature: async (id: string): Promise<ProductResponse> => {
    const response = await apiClient.post<StandardResponse<ProductResponse>>(`/products/${id}/feature`);
    return response.data.data!;
  },

  unfeature: async (id: string): Promise<ProductResponse> => {
    const response = await apiClient.post<StandardResponse<ProductResponse>>(`/products/${id}/unfeature`);
    return response.data.data!;
  },

  assignCategories: async (id: string, dto: AssignCategoriesDto): Promise<ProductResponse> => {
    const response = await apiClient.post<StandardResponse<ProductResponse>>(`/products/${id}/categories`, dto);
    return response.data.data!;
  },

  removeCategory: async (id: string, categoryId: string): Promise<ProductResponse> => {
    const response = await apiClient.delete<StandardResponse<ProductResponse>>(`/products/${id}/categories/${categoryId}`);
    return response.data.data!;
  },

  assignAttributes: async (id: string, dto: AssignAttributesDto): Promise<ProductResponse> => {
    const response = await apiClient.post<StandardResponse<ProductResponse>>(`/products/${id}/attributes`, dto);
    return response.data.data!;
  },

  removeAttribute: async (id: string, attributeId: string): Promise<ProductResponse> => {
    const response = await apiClient.delete<StandardResponse<ProductResponse>>(`/products/${id}/attributes/${attributeId}`);
    return response.data.data!;
  },

  clone: async (id: string): Promise<unknown> => {
    const response = await apiClient.post(`/products/${id}/clone`);
    return response.data.data!;
  },

  bulk: async (dto: BulkOperationDto): Promise<BulkOperationResult> => {
    const response = await apiClient.post<StandardResponse<BulkOperationResult>>('/products/bulk', dto);
    return response.data.data!;
  },
};
