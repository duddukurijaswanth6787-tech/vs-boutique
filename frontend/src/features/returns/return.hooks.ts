import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { returnService } from './return.service';
import { ReturnQueryDto, CreateReturnDto, UpdateReturnStatusDto } from './return.types';
import { orderKeys } from '../orders/order.hooks';
import { inventoryKeys } from '../inventory/inventory.hooks';

export const returnKeys = {
  all: ['returns'] as const,
  lists: () => [...returnKeys.all, 'list'] as const,
  list: (query: ReturnQueryDto) => [...returnKeys.lists(), query] as const,
  details: () => [...returnKeys.all, 'detail'] as const,
  detail: (id: string) => [...returnKeys.details(), id] as const,
};

export function useReturnList(query: ReturnQueryDto = {}) {
  return useQuery({
    queryKey: returnKeys.list(query),
    queryFn: () => returnService.findAll(query),
  });
}

export function useReturnDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: returnKeys.detail(id),
    queryFn: () => returnService.findById(id),
    enabled: !!id && enabled,
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateReturnDto) => returnService.create(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: returnKeys.lists() });
      if (data.orderId) {
        queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.orderId) });
      }
    },
  });
}

export function useUpdateReturnStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateReturnStatusDto }) =>
      returnService.updateStatus(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: returnKeys.lists() });
      queryClient.invalidateQueries({ queryKey: returnKeys.detail(data.id) });
      
      // Invalidate related order
      if (data.orderId) {
        queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.orderId) });
        queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      }
      
      // Invalidate inventory since return approval/completion updates inventory states
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}
