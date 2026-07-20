import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from './invoice.service';
import { InvoiceQueryDto, CreateInvoiceDto } from './invoice.types';
import { orderKeys } from '../orders/order.hooks';

export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (query: InvoiceQueryDto) => [...invoiceKeys.lists(), query] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
  order: (orderId: string) => [...invoiceKeys.all, 'order', orderId] as const,
};

export function useInvoiceList(query: InvoiceQueryDto = {}) {
  return useQuery({
    queryKey: invoiceKeys.list(query),
    queryFn: () => invoiceService.findAll(query),
  });
}

export function useInvoiceDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => invoiceService.findById(id),
    enabled: !!id && enabled,
  });
}

export function useOrderInvoices(orderId: string, enabled = true) {
  return useQuery({
    queryKey: invoiceKeys.order(orderId),
    queryFn: () => invoiceService.findByOrderId(orderId),
    enabled: !!orderId && enabled,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateInvoiceDto) => invoiceService.create(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      if (data.orderId) {
        queryClient.invalidateQueries({ queryKey: invoiceKeys.order(data.orderId) });
        queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.orderId) });
      }
    },
  });
}
