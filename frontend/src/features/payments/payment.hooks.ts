import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from './payment.service';
import { PaymentQueryDto, CreatePaymentDto, VerifyPaymentDto } from './payment.types';
import { orderKeys } from '../orders/order.hooks';

export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (query: PaymentQueryDto) => [...paymentKeys.lists(), query] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
  order: (orderId: string) => [...paymentKeys.all, 'order', orderId] as const,
};

export function usePaymentList(query: PaymentQueryDto = {}) {
  return useQuery({
    queryKey: paymentKeys.list(query),
    queryFn: () => paymentService.findAll(query),
  });
}

export function usePaymentDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: () => paymentService.findById(id),
    enabled: !!id && enabled,
  });
}

export function useOrderPayments(orderId: string, enabled = true) {
  return useQuery({
    queryKey: paymentKeys.order(orderId),
    queryFn: () => paymentService.findByOrderId(orderId),
    enabled: !!orderId && enabled,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePaymentDto) => paymentService.create(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      if (data.orderId) {
        queryClient.invalidateQueries({ queryKey: paymentKeys.order(data.orderId) });
        queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.orderId) });
      }
    },
  });
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      paymentService.updateStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentKeys.detail(data.id) });
      if (data.orderId) {
        queryClient.invalidateQueries({ queryKey: paymentKeys.order(data.orderId) });
        queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.orderId) });
      }
    },
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: VerifyPaymentDto }) =>
      paymentService.verify(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentKeys.detail(variables.id) });
    },
  });
}
