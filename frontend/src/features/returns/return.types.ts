export enum ReturnStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

export interface ReturnItemDto {
  orderItemId: string;
  quantity: number;
  reason?: string;
}

export interface CreateReturnDto {
  orderId: string;
  reason: string;
  items: ReturnItemDto[];
}

export interface UpdateReturnStatusDto {
  status: ReturnStatus;
  adminNotes?: string;
}

export interface ReturnItemResponse {
  id: string;
  orderItemId: string;
  quantity: number;
  reason?: string;
}

export interface ReturnRequestResponse {
  id: string;
  orderId: string;
  returnNumber: string;
  reason: string;
  status: ReturnStatus;
  adminNotes?: string;
  items?: ReturnItemResponse[];
  createdAt: string;
}

export interface ReturnQueryDto {
  status?: string;
  orderId?: string;
  page?: number;
  limit?: number;
}

export interface ReturnListResponse {
  data: ReturnRequestResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
