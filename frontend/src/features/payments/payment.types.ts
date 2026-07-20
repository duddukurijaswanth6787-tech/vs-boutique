export interface PaymentTransactionResponse {
  id: string;
  type: string;
  status: string;
  amount: number;
  providerRefId?: string;
  createdAt: string;
}

export interface PaymentResponse {
  id: string;
  orderId: string;
  paymentNumber: string;
  method: string;
  provider: string;
  status: string;
  amount: number;
  currency: string;
  transactionId?: string;
  transactions?: PaymentTransactionResponse[];
  createdAt: string;
}

export interface CreatePaymentDto {
  orderId: string;
  method: string;
  provider: string;
  amount: number;
  currency?: string;
}

export interface PaymentQueryDto {
  orderId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface VerifyPaymentDto {
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface PaymentListResponse {
  data: PaymentResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
