import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  BannerListResponse,
  BannerResponse,
  CreateBannerDto,
  UpdateBannerDto,
  BannerQueryDto,
} from './banner.types';

export const bannerService = {
  findBanners: async (query: BannerQueryDto = {}): Promise<BannerListResponse> => {
    const params: Record<string, string | number | boolean> = {};
    if (query.placement) params.placement = query.placement;
    if (query.isActive !== undefined) params.isActive = query.isActive;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;

    const response = await apiClient.get<StandardResponse<BannerListResponse>>('/cms/banners', { params });
    return response.data.data!;
  },

  findById: async (id: string): Promise<BannerResponse> => {
    const response = await apiClient.get<StandardResponse<BannerResponse>>(`/cms/banners/${id}`);
    return response.data.data!;
  },

  create: async (dto: CreateBannerDto): Promise<BannerResponse> => {
    const response = await apiClient.post<StandardResponse<BannerResponse>>('/cms/banners', dto);
    return response.data.data!;
  },

  update: async (id: string, dto: UpdateBannerDto): Promise<BannerResponse> => {
    const response = await apiClient.patch<StandardResponse<BannerResponse>>(`/cms/banners/${id}`, dto);
    return response.data.data!;
  },

  clone: async (id: string): Promise<unknown> => {
    const response = await apiClient.post(`/cms/banners/${id}/clone`);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/cms/banners/${id}`);
  },
};
