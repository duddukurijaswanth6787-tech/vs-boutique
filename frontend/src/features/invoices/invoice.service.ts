import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  InvoiceQueryDto,
  InvoiceListResponse,
  InvoiceResponse,
  CreateInvoiceDto,
} from './invoice.types';

export const invoiceService = {
  findAll: async (query: InvoiceQueryDto = {}): Promise<InvoiceListResponse> => {
    const params: Record<string, string | number | boolean> = { ...query };
    const response = await apiClient.get<StandardResponse<InvoiceListResponse>>('/invoices', { params });
    return response.data.data!;
  },

  findByOrderId: async (orderId: string): Promise<InvoiceResponse[]> => {
    const response = await apiClient.get<StandardResponse<InvoiceResponse[]>>(`/invoices/order/${orderId}`);
    return response.data.data!;
  },

  findById: async (id: string): Promise<InvoiceResponse> => {
    const response = await apiClient.get<StandardResponse<InvoiceResponse>>(`/invoices/${id}`);
    return response.data.data!;
  },

  create: async (dto: CreateInvoiceDto): Promise<InvoiceResponse> => {
    const response = await apiClient.post<StandardResponse<InvoiceResponse>>('/invoices', dto);
    return response.data.data!;
  },
};
