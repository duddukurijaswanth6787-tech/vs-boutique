export interface InvoiceItemResponse {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxAmount: number;
  discountAmount: number;
}

export interface InvoiceResponse {
  id: string;
  orderId: string;
  invoiceNumber: string;
  status: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  currency: string;
  billingAddress?: Record<string, unknown>;
  shippingAddress?: Record<string, unknown>;
  items?: InvoiceItemResponse[];
  notes?: string;
  createdAt: string;
}

export interface CreateInvoiceDto {
  orderId: string;
  billingAddress?: Record<string, unknown>;
  shippingAddress?: Record<string, unknown>;
  notes?: string;
}

export interface InvoiceQueryDto {
  orderId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface InvoiceListResponse {
  data: InvoiceResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
