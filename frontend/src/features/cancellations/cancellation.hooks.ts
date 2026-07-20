import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cancellationService } from './cancellation.service';
import { CreateCancellationDto, UpdateCancellationDto } from './cancellation.types';
import { orderKeys } from '../orders/order.hooks';
import { inventoryKeys } from '../inventory/inventory.hooks';

export const cancellationKeys = {
  all: ['cancellations'] as const,
  details: () => [...cancellationKeys.all, 'detail'] as const,
  detail: (orderId: string) => [...cancellationKeys.details(), orderId] as const,
};

export function useCancellationDetail(orderId: string, enabled = true) {
  return useQuery({
    queryKey: cancellationKeys.detail(orderId),
    queryFn: () => cancellationService.findByOrderId(orderId),
    enabled: !!orderId && enabled,
    retry: false, // Don't retry if order has no cancellation request
  });
}

export function useCreateCancellation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCancellationDto) => cancellationService.create(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: cancellationKeys.detail(data.orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.orderId) });
      // Invalidate inventory since cancellations release stock reservations
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useUpdateCancellation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, orderId, dto }: { id: string; orderId: string; dto: UpdateCancellationDto }) =>
      cancellationService.update(id, dto),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cancellationKeys.detail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
    },
  });
}
