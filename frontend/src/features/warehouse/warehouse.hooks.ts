import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehouseService } from './warehouse.service';
import {
  WarehouseQueryDto,
  CreateWarehouseDto,
  UpdateWarehouseDto,
  CreateLocationDto,
  AssignWarehouseInventoryDto,
  TransferStockDto,
} from './warehouse.types';
import { inventoryKeys } from '../inventory/inventory.hooks';

export const warehouseKeys = {
  all: ['warehouses'] as const,
  lists: () => [...warehouseKeys.all, 'list'] as const,
  list: (query: WarehouseQueryDto) => [...warehouseKeys.lists(), query] as const,
  details: () => [...warehouseKeys.all, 'detail'] as const,
  detail: (id: string) => [...warehouseKeys.details(), id] as const,
  locations: (id: string) => [...warehouseKeys.detail(id), 'locations'] as const,
  inventories: (id: string) => [...warehouseKeys.detail(id), 'inventory'] as const,
};

export function useWarehouseList(query: WarehouseQueryDto = {}) {
  return useQuery({
    queryKey: warehouseKeys.list(query),
    queryFn: () => warehouseService.findAll(query),
  });
}

export function useWarehouseDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: warehouseKeys.detail(id),
    queryFn: () => warehouseService.findById(id),
    enabled: !!id && enabled,
  });
}

export function useWarehouseLocations(id: string, enabled = true) {
  return useQuery({
    queryKey: warehouseKeys.locations(id),
    queryFn: () => warehouseService.getLocations(id),
    enabled: !!id && enabled,
  });
}

export function useWarehouseInventory(id: string, enabled = true) {
  return useQuery({
    queryKey: warehouseKeys.inventories(id),
    queryFn: () => warehouseService.getWarehouseInventory(id),
    enabled: !!id && enabled,
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateWarehouseDto) => warehouseService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.lists() });
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateWarehouseDto }) =>
      warehouseService.update(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.detail(data.id) });
    },
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => warehouseService.delete(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.detail(id) });
    },
  });
}

export function useRestoreWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => warehouseService.restore(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.detail(data.id) });
    },
  });
}

export function useCreateWarehouseLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ warehouseId, dto }: { warehouseId: string; dto: CreateLocationDto }) =>
      warehouseService.createLocation(warehouseId, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.locations(data.warehouseId) });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.detail(data.warehouseId) });
    },
  });
}

export function useAssignWarehouseInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ warehouseId, dto }: { warehouseId: string; dto: AssignWarehouseInventoryDto }) =>
      warehouseService.assignInventory(warehouseId, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.inventories(data.warehouseId) });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.detail(data.warehouseId) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useTransferWarehouseStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: TransferStockDto) => warehouseService.transferStock(dto),
    onSuccess: (data) => {
      // Invalidate source and destination warehouse data
      queryClient.invalidateQueries({ queryKey: warehouseKeys.inventories(data.from) });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.detail(data.from) });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.inventories(data.to) });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.detail(data.to) });
      
      // Invalidate general inventory queries
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}
