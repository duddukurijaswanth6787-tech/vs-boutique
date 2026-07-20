export interface CreateCancellationDto {
  orderId: string;
  reason: string;
}

export interface UpdateCancellationDto {
  status?: string;
  refundStatus?: string;
  adminNotes?: string;
}

export interface CancellationResponse {
  id: string;
  orderId: string;
  reason: string;
  status: string;
  refundStatus: string;
  adminNotes?: string;
  createdAt: string;
}
