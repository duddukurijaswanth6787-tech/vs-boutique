import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  InventoryQueryDto,
  InventoryListResponse,
  StockSummaryResponse,
  MovementQueryDto,
  MovementListResponse,
  InventoryResponse,
  CreateInventoryDto,
  UpdateInventoryDto,
  StockMovementDto,
  AdjustStockDto,
} from './inventory.types';

export const inventoryService = {
  findAll: async (query: InventoryQueryDto = {}): Promise<InventoryListResponse> => {
    const params: Record<string, string | number | boolean> = { ...query };
    const response = await apiClient.get<StandardResponse<InventoryListResponse>>('/inventory', { params });
    return response.data.data!;
  },

  getStockSummary: async (): Promise<StockSummaryResponse> => {
    const response = await apiClient.get<StandardResponse<StockSummaryResponse>>('/inventory/summary');
    return response.data.data!;
  },

  findMovements: async (query: MovementQueryDto = {}): Promise<MovementListResponse> => {
    const params: Record<string, string | number | boolean> = { ...query };
    const response = await apiClient.get<StandardResponse<MovementListResponse>>('/inventory/movements', { params });
    return response.data.data!;
  },

  findById: async (id: string): Promise<InventoryResponse> => {
    const response = await apiClient.get<StandardResponse<InventoryResponse>>(`/inventory/${id}`);
    return response.data.data!;
  },

  findByVariantId: async (variantId: string): Promise<InventoryResponse> => {
    const response = await apiClient.get<StandardResponse<InventoryResponse>>(`/inventory/variant/${variantId}`);
    return response.data.data!;
  },

  create: async (dto: CreateInventoryDto): Promise<InventoryResponse> => {
    const response = await apiClient.post<StandardResponse<InventoryResponse>>('/inventory', dto);
    return response.data.data!;
  },

  update: async (id: string, dto: UpdateInventoryDto): Promise<InventoryResponse> => {
    const response = await apiClient.patch<StandardResponse<InventoryResponse>>(`/inventory/${id}`, dto);
    return response.data.data!;
  },

  increaseStock: async (id: string, dto: StockMovementDto): Promise<InventoryResponse> => {
    const response = await apiClient.post<StandardResponse<InventoryResponse>>(`/inventory/${id}/increase`, dto);
    return response.data.data!;
  },

  decreaseStock: async (id: string, dto: StockMovementDto): Promise<InventoryResponse> => {
    const response = await apiClient.post<StandardResponse<InventoryResponse>>(`/inventory/${id}/decrease`, dto);
    return response.data.data!;
  },

  adjustStock: async (id: string, dto: AdjustStockDto): Promise<InventoryResponse> => {
    const response = await apiClient.post<StandardResponse<InventoryResponse>>(`/inventory/${id}/adjust`, dto);
    return response.data.data!;
  },

  reserveStock: async (id: string, dto: StockMovementDto): Promise<InventoryResponse> => {
    const response = await apiClient.post<StandardResponse<InventoryResponse>>(`/inventory/${id}/reserve`, dto);
    return response.data.data!;
  },

  releaseStock: async (id: string, dto: StockMovementDto): Promise<InventoryResponse> => {
    const response = await apiClient.post<StandardResponse<InventoryResponse>>(`/inventory/${id}/release`, dto);
    return response.data.data!;
  },

  returnStock: async (id: string, dto: StockMovementDto): Promise<InventoryResponse> => {
    const response = await apiClient.post<StandardResponse<InventoryResponse>>(`/inventory/${id}/return`, dto);
    return response.data.data!;
  },

  damageStock: async (id: string, dto: StockMovementDto): Promise<InventoryResponse> => {
    const response = await apiClient.post<StandardResponse<InventoryResponse>>(`/inventory/${id}/damage`, dto);
    return response.data.data!;
  },
};
