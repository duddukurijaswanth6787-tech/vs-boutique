import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  CmsPageListResponse,
  CmsPageResponse,
  CreateCmsPageDto,
  UpdateCmsPageDto,
  CmsPageQueryDto,
  CmsSectionResponse,
  CreateCmsSectionDto,
} from './cms.types';

export const cmsService = {
  findPages: async (query: CmsPageQueryDto = {}): Promise<CmsPageListResponse> => {
    const params: Record<string, string | number | boolean> = {};
    if (query.search) params.search = query.search;
    if (query.status) params.status = query.status;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;

    const response = await apiClient.get<StandardResponse<CmsPageListResponse>>('/cms/pages', { params });
    return response.data.data!;
  },

  findPageBySlug: async (slug: string): Promise<CmsPageResponse> => {
    const response = await apiClient.get<StandardResponse<CmsPageResponse>>(`/cms/pages/${slug}`);
    return response.data.data!;
  },

  createPage: async (dto: CreateCmsPageDto): Promise<CmsPageResponse> => {
    const response = await apiClient.post<StandardResponse<CmsPageResponse>>('/cms/pages', dto);
    return response.data.data!;
  },

  updatePage: async (id: string, dto: UpdateCmsPageDto): Promise<CmsPageResponse> => {
    const response = await apiClient.patch<StandardResponse<CmsPageResponse>>(`/cms/pages/${id}`, dto);
    return response.data.data!;
  },

  findSections: async (): Promise<CmsSectionResponse[]> => {
    const response = await apiClient.get<StandardResponse<CmsSectionResponse[]>>('/cms/sections');
    return response.data.data!;
  },

  createSection: async (dto: CreateCmsSectionDto): Promise<CmsSectionResponse> => {
    const response = await apiClient.post<StandardResponse<CmsSectionResponse>>('/cms/sections', dto);
    return response.data.data!;
  },

  clonePage: async (id: string): Promise<unknown> => {
    const response = await apiClient.post(`/cms/pages/${id}/clone`);
    return response.data.data!;
  },
};
