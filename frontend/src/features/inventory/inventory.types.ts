export interface InventoryVariant {
  id: string;
  sku: string;
  title: string;
  productId: string;
}

export interface InventoryResponse {
  id: string;
  variantId: string;
  availableQuantity: number;
  reservedQuantity: number;
  damagedQuantity: number;
  returnedQuantity: number;
  minimumStock: number;
  maximumStock: number;
  reorderLevel: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'BACKORDER' | string;
  allowBackorder: boolean;
  trackInventory: boolean;
  createdAt: string;
  updatedAt: string;
  variant?: InventoryVariant;
}

export interface InventoryQueryDto {
  variantId?: string;
  stockStatus?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateInventoryDto {
  variantId: string;
  availableQuantity?: number;
  minimumStock?: number;
  maximumStock?: number;
  reorderLevel?: number;
  allowBackorder?: boolean;
  trackInventory?: boolean;
}

export interface UpdateInventoryDto {
  minimumStock?: number;
  maximumStock?: number;
  reorderLevel?: number;
  allowBackorder?: boolean;
  trackInventory?: boolean;
}

export interface AdjustStockDto {
  quantity: number;
  reason?: string;
  remarks?: string;
}

export interface StockMovementDto {
  quantity: number;
  reason?: string;
  remarks?: string;
  referenceType?: string;
  referenceId?: string;
}

export interface InventoryMovementResponse {
  id: string;
  inventoryId: string;
  variantId: string;
  movementType: string;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  remarks?: string;
  performedBy?: string;
  createdAt: string;
}

export interface MovementQueryDto {
  inventoryId?: string;
  variantId?: string;
  movementType?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StockSummaryResponse {
  totalItems: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  totalAvailable: number;
  totalReserved: number;
}

export interface InventoryListResponse {
  data: InventoryResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface MovementListResponse {
  data: InventoryMovementResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
