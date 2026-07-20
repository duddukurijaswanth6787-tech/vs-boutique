import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  WarehouseQueryDto,
  WarehouseListResponse,
  WarehouseDetailResponse,
  WarehouseLocationResponse,
  WarehouseInventoryResponse,
  CreateWarehouseDto,
  UpdateWarehouseDto,
  CreateLocationDto,
  AssignWarehouseInventoryDto,
  TransferStockDto,
} from './warehouse.types';

export const warehouseService = {
  findAll: async (query: WarehouseQueryDto = {}): Promise<WarehouseListResponse> => {
    const params: Record<string, string | number | boolean | undefined> = { ...query };
    const response = await apiClient.get<StandardResponse<WarehouseListResponse>>('/warehouses', { params });
    return response.data.data!;
  },

  findById: async (id: string): Promise<WarehouseDetailResponse> => {
    const response = await apiClient.get<StandardResponse<WarehouseDetailResponse>>(`/warehouses/${id}`);
    return response.data.data!;
  },

  getLocations: async (id: string): Promise<WarehouseLocationResponse[]> => {
    const response = await apiClient.get<StandardResponse<WarehouseLocationResponse[]>>(`/warehouses/${id}/locations`);
    return response.data.data!;
  },

  getWarehouseInventory: async (id: string): Promise<WarehouseInventoryResponse[]> => {
    const response = await apiClient.get<StandardResponse<WarehouseInventoryResponse[]>>(`/warehouses/${id}/inventory`);
    return response.data.data!;
  },

  create: async (dto: CreateWarehouseDto): Promise<WarehouseDetailResponse> => {
    const response = await apiClient.post<StandardResponse<WarehouseDetailResponse>>('/warehouses', dto);
    return response.data.data!;
  },

  update: async (id: string, dto: UpdateWarehouseDto): Promise<WarehouseDetailResponse> => {
    const response = await apiClient.patch<StandardResponse<WarehouseDetailResponse>>(`/warehouses/${id}`, dto);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/warehouses/${id}`);
  },

  restore: async (id: string): Promise<WarehouseDetailResponse> => {
    const response = await apiClient.post<StandardResponse<WarehouseDetailResponse>>(`/warehouses/${id}/restore`);
    return response.data.data!;
  },

  createLocation: async (id: string, dto: CreateLocationDto): Promise<WarehouseLocationResponse> => {
    const response = await apiClient.post<StandardResponse<WarehouseLocationResponse>>(`/warehouses/${id}/locations`, dto);
    return response.data.data!;
  },

  assignInventory: async (id: string, dto: AssignWarehouseInventoryDto): Promise<WarehouseInventoryResponse> => {
    const response = await apiClient.post<StandardResponse<WarehouseInventoryResponse>>(`/warehouses/${id}/inventory`, dto);
    return response.data.data!;
  },

  transferStock: async (dto: TransferStockDto): Promise<{ transferred: number; from: string; to: string }> => {
    const response = await apiClient.post<StandardResponse<{ transferred: number; from: string; to: string }>>('/warehouses/transfer', dto);
    return response.data.data!;
  },
};
