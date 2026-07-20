export enum RefundStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

export interface CreateRefundDto {
  paymentId: string;
  orderId: string;
  amount: number;
  reason: string;
  method?: string;
}

export interface UpdateRefundDto {
  status?: RefundStatus;
  adminNotes?: string;
  transactionId?: string;
}

export interface RefundResponse {
  id: string;
  paymentId: string;
  orderId: string;
  refundNumber: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  method?: string;
  transactionId?: string;
  adminNotes?: string;
  createdAt: string;
}

export interface RefundQueryDto {
  orderId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface RefundListResponse {
  data: RefundResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
