import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from './inventory.service';
import {
  InventoryQueryDto,
  CreateInventoryDto,
  UpdateInventoryDto,
  StockMovementDto,
  AdjustStockDto,
  MovementQueryDto,
} from './inventory.types';

export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (query: InventoryQueryDto) => [...inventoryKeys.lists(), query] as const,
  details: () => [...inventoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...inventoryKeys.details(), id] as const,
  detailByVariant: (variantId: string) => [...inventoryKeys.details(), 'variant', variantId] as const,
  summary: () => [...inventoryKeys.all, 'summary'] as const,
  movements: (query: MovementQueryDto = {}) => [...inventoryKeys.all, 'movements', query] as const,
};

export function useInventoryList(query: InventoryQueryDto = {}) {
  return useQuery({
    queryKey: inventoryKeys.list(query),
    queryFn: () => inventoryService.findAll(query),
  });
}

export function useInventorySummary() {
  return useQuery({
    queryKey: inventoryKeys.summary(),
    queryFn: () => inventoryService.getStockSummary(),
  });
}

export function useInventoryMovements(query: MovementQueryDto = {}) {
  return useQuery({
    queryKey: inventoryKeys.movements(query),
    queryFn: () => inventoryService.findMovements(query),
  });
}

export function useInventoryDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: inventoryKeys.detail(id),
    queryFn: () => inventoryService.findById(id),
    enabled: !!id && enabled,
  });
}

export function useCreateInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateInventoryDto) => inventoryService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.summary() });
    },
  });
}

export function useUpdateInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateInventoryDto }) =>
      inventoryService.update(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(data.id) });
      if (data.variantId) {
        queryClient.invalidateQueries({ queryKey: inventoryKeys.detailByVariant(data.variantId) });
      }
    },
  });
}

export function useIncreaseStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: StockMovementDto }) =>
      inventoryService.increaseStock(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'movements'] });
    },
  });
}

export function useDecreaseStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: StockMovementDto }) =>
      inventoryService.decreaseStock(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'movements'] });
    },
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: AdjustStockDto }) =>
      inventoryService.adjustStock(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'movements'] });
    },
  });
}

export function useReserveStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: StockMovementDto }) =>
      inventoryService.reserveStock(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'movements'] });
    },
  });
}

export function useReleaseStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: StockMovementDto }) =>
      inventoryService.releaseStock(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'movements'] });
    },
  });
}

export function useReturnStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: StockMovementDto }) =>
      inventoryService.returnStock(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'movements'] });
    },
  });
}

export function useDamageStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: StockMovementDto }) =>
      inventoryService.damageStock(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'movements'] });
    },
  });
}
