import { apiClient } from '@/lib/api/client';
import { SettingResponse, CreateSettingDto, UpdateSettingDto, SettingQueryDto } from './settings.types';
import { StandardResponse, PaginatedResponse } from '@/types/api.types';

type ApiResponse<T> = StandardResponse<T>;

export const settingsService = {
  async getSettings(query: SettingQueryDto): Promise<PaginatedResponse<SettingResponse>> {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<SettingResponse>>>('/settings', {
      params: query,
    });
    return res.data.data!;
  },

  async getSettingByKey(key: string): Promise<SettingResponse> {
    const res = await apiClient.get<ApiResponse<SettingResponse>>(`/settings/${key}`);
    return res.data.data!;
  },

  async createSetting(dto: CreateSettingDto): Promise<SettingResponse> {
    const res = await apiClient.post<ApiResponse<SettingResponse>>('/settings', dto);
    return res.data.data!;
  },

  async updateSetting(id: string, dto: UpdateSettingDto): Promise<SettingResponse> {
    const res = await apiClient.patch<ApiResponse<SettingResponse>>(`/settings/${id}`, dto);
    return res.data.data!;
  },
};
