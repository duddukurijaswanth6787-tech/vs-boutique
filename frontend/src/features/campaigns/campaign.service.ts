import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  CampaignListResponse,
  CampaignResponse,
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignQueryDto,
} from './campaign.types';

export const campaignService = {
  findAll: async (query: CampaignQueryDto = {}): Promise<CampaignListResponse> => {
    const params: Record<string, string | number | boolean> = {};
    if (query.type) params.type = query.type;
    if (query.channel) params.channel = query.channel;
    if (query.status) params.status = query.status;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;

    const response = await apiClient.get<StandardResponse<CampaignListResponse>>('/campaigns', { params });
    return response.data.data!;
  },

  findById: async (id: string): Promise<CampaignResponse> => {
    const response = await apiClient.get<StandardResponse<CampaignResponse>>(`/campaigns/${id}`);
    return response.data.data!;
  },

  create: async (dto: CreateCampaignDto): Promise<CampaignResponse> => {
    const response = await apiClient.post<StandardResponse<CampaignResponse>>('/campaigns', dto);
    return response.data.data!;
  },

  update: async (id: string, dto: UpdateCampaignDto): Promise<CampaignResponse> => {
    const response = await apiClient.patch<StandardResponse<CampaignResponse>>(`/campaigns/${id}`, dto);
    return response.data.data!;
  },

  send: async (id: string): Promise<CampaignResponse> => {
    const response = await apiClient.post<StandardResponse<CampaignResponse>>(`/campaigns/${id}/send`);
    return response.data.data!;
  },
};
