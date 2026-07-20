import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  ShippingMethodResponse,
  ShippingZoneResponse,
  ShippingCalculationResponse,
  CreateShippingMethodDto,
  CreateShippingZoneDto,
  CalculateShippingDto,
} from './shipping.types';

export const shippingService = {
  getMethods: async (): Promise<ShippingMethodResponse[]> => {
    const response = await apiClient.get<StandardResponse<ShippingMethodResponse[]>>('/shipping/methods');
    return response.data.data!;
  },

  calculateShipping: async (code: string, dto: CalculateShippingDto): Promise<ShippingCalculationResponse> => {
    const params: Record<string, string | number | boolean> = { ...dto };
    const response = await apiClient.get<StandardResponse<ShippingCalculationResponse>>(`/shipping/methods/${code}/calculate`, { params });
    return response.data.data!;
  },

  createMethod: async (dto: CreateShippingMethodDto): Promise<ShippingMethodResponse> => {
    const response = await apiClient.post<StandardResponse<ShippingMethodResponse>>('/shipping/methods', dto);
    return response.data.data!;
  },

  getZones: async (methodId?: string): Promise<ShippingZoneResponse[]> => {
    const params: Record<string, string | number | boolean> = {};
    if (methodId) params.methodId = methodId;
    const response = await apiClient.get<StandardResponse<ShippingZoneResponse[]>>('/shipping/zones', { params });
    return response.data.data!;
  },

  createZone: async (dto: CreateShippingZoneDto): Promise<ShippingZoneResponse> => {
    const response = await apiClient.post<StandardResponse<ShippingZoneResponse>>('/shipping/zones', dto);
    return response.data.data!;
  },
};
