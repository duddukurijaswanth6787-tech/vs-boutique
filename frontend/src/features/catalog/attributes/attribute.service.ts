import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  CreateAttributeGroupDto,
  UpdateAttributeGroupDto,
  AttributeGroupQueryDto,
  AttributeGroupResponse,
  CreateAttributeDto,
  UpdateAttributeDto,
  AttributeQueryDto,
  AttributeResponse,
  CreateAttributeOptionDto,
  UpdateAttributeOptionDto,
  AttributeOptionQueryDto,
  AttributeOptionResponse,
  CreateCategoryAttributeDto,
  UpdateCategoryAttributeDto,
  CategoryAttributeResponse,
} from './attribute.types';

export const attributeService = {
  // ─── Groups ─────────────────────────────────────────────
  findAllGroups: async (query: AttributeGroupQueryDto = {}): Promise<{ data: AttributeGroupResponse[] }> => {
    const params: Record<string, string | number | boolean> = {};
    if (query.search) params.search = query.search;
    if (query.status) params.status = query.status;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;

    const response = await apiClient.get<StandardResponse<{ data: AttributeGroupResponse[] }>>('/attribute-groups', { params });
    return response.data.data!;
  },

  findGroupById: async (id: string): Promise<AttributeGroupResponse> => {
    const response = await apiClient.get<StandardResponse<AttributeGroupResponse>>(`/attribute-groups/${id}`);
    return response.data.data!;
  },

  createGroup: async (dto: CreateAttributeGroupDto): Promise<AttributeGroupResponse> => {
    const response = await apiClient.post<StandardResponse<AttributeGroupResponse>>('/attribute-groups', dto);
    return response.data.data!;
  },

  updateGroup: async (id: string, dto: UpdateAttributeGroupDto): Promise<AttributeGroupResponse> => {
    const response = await apiClient.patch<StandardResponse<AttributeGroupResponse>>(`/attribute-groups/${id}`, dto);
    return response.data.data!;
  },

  deleteGroup: async (id: string): Promise<void> => {
    await apiClient.delete(`/attribute-groups/${id}`);
  },

  restoreGroup: async (id: string): Promise<AttributeGroupResponse> => {
    const response = await apiClient.post<StandardResponse<AttributeGroupResponse>>(`/attribute-groups/${id}/restore`);
    return response.data.data!;
  },

  // ─── Attributes ─────────────────────────────────────────
  findAllAttributes: async (query: AttributeQueryDto = {}): Promise<{ data: AttributeResponse[] }> => {
    const params: Record<string, string | number | boolean> = {};
    if (query.search) params.search = query.search;
    if (query.groupId) params.groupId = query.groupId;
    if (query.type) params.type = query.type;
    if (query.isFilterable !== undefined) params.isFilterable = query.isFilterable;
    if (query.isVariant !== undefined) params.isVariant = query.isVariant;
    if (query.status) params.status = query.status;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;
    if (query.sortBy) params.sortBy = query.sortBy;
    if (query.sortOrder) params.sortOrder = query.sortOrder;

    const response = await apiClient.get<StandardResponse<{ data: AttributeResponse[] }>>('/attributes', { params });
    return response.data.data!;
  },

  findAttributeById: async (id: string): Promise<AttributeResponse> => {
    const response = await apiClient.get<StandardResponse<AttributeResponse>>(`/attributes/${id}`);
    return response.data.data!;
  },

  createAttribute: async (dto: CreateAttributeDto): Promise<AttributeResponse> => {
    const response = await apiClient.post<StandardResponse<AttributeResponse>>('/attributes', dto);
    return response.data.data!;
  },

  updateAttribute: async (id: string, dto: UpdateAttributeDto): Promise<AttributeResponse> => {
    const response = await apiClient.patch<StandardResponse<AttributeResponse>>(`/attributes/${id}`, dto);
    return response.data.data!;
  },

  deleteAttribute: async (id: string): Promise<void> => {
    await apiClient.delete(`/attributes/${id}`);
  },

  restoreAttribute: async (id: string): Promise<AttributeResponse> => {
    const response = await apiClient.post<StandardResponse<AttributeResponse>>(`/attributes/${id}/restore`);
    return response.data.data!;
  },

  // ─── Options ────────────────────────────────────────────
  findAllOptions: async (query: AttributeOptionQueryDto = {}): Promise<{ data: AttributeOptionResponse[] }> => {
    const params: Record<string, string | number | boolean> = {};
    if (query.attributeId) params.attributeId = query.attributeId;
    if (query.search) params.search = query.search;
    if (query.status) params.status = query.status;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;

    const response = await apiClient.get<StandardResponse<{ data: AttributeOptionResponse[] }>>('/attribute-options', { params });
    return response.data.data!;
  },

  findOptionById: async (id: string): Promise<AttributeOptionResponse> => {
    const response = await apiClient.get<StandardResponse<AttributeOptionResponse>>(`/attribute-options/${id}`);
    return response.data.data!;
  },

  createOption: async (dto: CreateAttributeOptionDto): Promise<AttributeOptionResponse> => {
    const response = await apiClient.post<StandardResponse<AttributeOptionResponse>>('/attribute-options', dto);
    return response.data.data!;
  },

  updateOption: async (id: string, dto: UpdateAttributeOptionDto): Promise<AttributeOptionResponse> => {
    const response = await apiClient.patch<StandardResponse<AttributeOptionResponse>>(`/attribute-options/${id}`, dto);
    return response.data.data!;
  },

  deleteOption: async (id: string): Promise<void> => {
    await apiClient.delete(`/attribute-options/${id}`);
  },

  restoreOption: async (id: string): Promise<AttributeOptionResponse> => {
    const response = await apiClient.post<StandardResponse<AttributeOptionResponse>>(`/attribute-options/${id}/restore`);
    return response.data.data!;
  },

  // ─── Category Mappings ──────────────────────────────────
  findAllCategoryMappings: async (categoryId: string): Promise<CategoryAttributeResponse[]> => {
    const response = await apiClient.get<StandardResponse<CategoryAttributeResponse[]>>('/category-attributes', {
      params: { categoryId },
    });
    return response.data.data!;
  },

  createCategoryMapping: async (dto: CreateCategoryAttributeDto): Promise<CategoryAttributeResponse> => {
    const response = await apiClient.post<StandardResponse<CategoryAttributeResponse>>('/category-attributes', dto);
    return response.data.data!;
  },

  updateCategoryMapping: async (
    categoryId: string,
    attributeId: string,
    dto: UpdateCategoryAttributeDto,
  ): Promise<CategoryAttributeResponse> => {
    const response = await apiClient.patch<StandardResponse<CategoryAttributeResponse>>(
      `/category-attributes/${categoryId}/${attributeId}`,
      dto,
    );
    return response.data.data!;
  },

  deleteCategoryMapping: async (categoryId: string, attributeId: string): Promise<void> => {
    await apiClient.delete(`/category-attributes/${categoryId}/${attributeId}`);
  },
};
