import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  OfferListResponse,
  OfferResponse,
  CreateOfferDto,
  UpdateOfferDto,
  OfferQueryDto,
} from './offer.types';

export const offerService = {
  findAll: async (query: OfferQueryDto = {}): Promise<OfferListResponse> => {
    const params: Record<string, string | number | boolean> = {};
    if (query.search) params.search = query.search;
    if (query.isActive !== undefined) params.isActive = query.isActive;
    if (query.type) params.type = query.type;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;

    const response = await apiClient.get<StandardResponse<OfferListResponse>>('/offers', { params });
    return response.data.data!;
  },

  getActiveOffers: async (): Promise<OfferResponse[]> => {
    const response = await apiClient.get<StandardResponse<OfferResponse[]>>('/offers/active');
    return response.data.data!;
  },

  findById: async (id: string): Promise<OfferResponse> => {
    const response = await apiClient.get<StandardResponse<OfferResponse>>(`/offers/${id}`);
    return response.data.data!;
  },

  create: async (dto: CreateOfferDto): Promise<OfferResponse> => {
    const response = await apiClient.post<StandardResponse<OfferResponse>>('/offers', dto);
    return response.data.data!;
  },

  update: async (id: string, dto: UpdateOfferDto): Promise<OfferResponse> => {
    const response = await apiClient.patch<StandardResponse<OfferResponse>>(`/offers/${id}`, dto);
    return response.data.data!;
  },
};
