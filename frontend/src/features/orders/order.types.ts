export interface OrderItemResponse {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantTitle?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxAmount: number;
  discountAmount: number;
  primaryImageUrl?: string;
}

export interface OrderAddressResponse {
  id: string;
  addressType: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  landmark?: string;
}

export interface OrderTimelineResponse {
  id: string;
  status: string;
  message?: string;
  createdBy?: string;
  createdAt: string;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  status: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingCharge: number;
  grandTotal: number;
  currency: string;
  notes?: string;
  items?: OrderItemResponse[];
  addresses?: OrderAddressResponse[];
  timeline?: OrderTimelineResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderQueryDto {
  search?: string;
  status?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  deleted?: 'only' | 'all';
  createdBy?: string;
  updatedBy?: string;
  createdAfter?: string;
  createdBefore?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrderListResponse {
  data: OrderResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface OrderStatistics {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}
