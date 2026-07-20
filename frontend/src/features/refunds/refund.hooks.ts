import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { refundService } from './refund.service';
import { RefundQueryDto, CreateRefundDto, UpdateRefundDto } from './refund.types';
import { orderKeys } from '../orders/order.hooks';

export const refundKeys = {
  all: ['refunds'] as const,
  lists: () => [...refundKeys.all, 'list'] as const,
  list: (query: RefundQueryDto) => [...refundKeys.lists(), query] as const,
  details: () => [...refundKeys.all, 'detail'] as const,
  detail: (id: string) => [...refundKeys.details(), id] as const,
  order: (orderId: string) => [...refundKeys.all, 'order', orderId] as const,
};

export function useRefundList(query: RefundQueryDto = {}) {
  return useQuery({
    queryKey: refundKeys.list(query),
    queryFn: () => refundService.findAll(query),
  });
}

export function useRefundDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: refundKeys.detail(id),
    queryFn: () => refundService.findById(id),
    enabled: !!id && enabled,
  });
}

export function useOrderRefunds(orderId: string, enabled = true) {
  return useQuery({
    queryKey: refundKeys.order(orderId),
    queryFn: () => refundService.findByOrderId(orderId),
    enabled: !!orderId && enabled,
  });
}

export function useCreateRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateRefundDto) => refundService.create(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: refundKeys.lists() });
      if (data.orderId) {
        queryClient.invalidateQueries({ queryKey: refundKeys.order(data.orderId) });
        queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.orderId) });
      }
    },
  });
}

export function useUpdateRefundStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateRefundDto }) =>
      refundService.updateStatus(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: refundKeys.lists() });
      queryClient.invalidateQueries({ queryKey: refundKeys.detail(data.id) });
      if (data.orderId) {
        queryClient.invalidateQueries({ queryKey: refundKeys.order(data.orderId) });
        queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.orderId) });
      }
    },
  });
}
