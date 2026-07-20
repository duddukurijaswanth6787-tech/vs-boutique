export interface WarehouseResponse {
  id: string;
  code: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  status: 'ACTIVE' | 'ARCHIVED' | string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseLocationResponse {
  id: string;
  warehouseId: string;
  zone?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseInventoryVariant {
  id: string;
  sku: string;
  title: string;
}

export interface WarehouseInventoryResponse {
  id: string;
  warehouseId: string;
  variantId: string;
  availableQuantity: number;
  reservedQuantity: number;
  damagedQuantity: number;
  minimumStock: number;
  maximumStock: number;
  reorderLevel: number;
  createdAt: string;
  updatedAt: string;
  variant?: WarehouseInventoryVariant;
}

export interface WarehouseDetailResponse extends WarehouseResponse {
  locations?: WarehouseLocationResponse[];
  inventories?: WarehouseInventoryResponse[];
}

export interface WarehouseQueryDto {
  search?: string;
  status?: string;
  isDefault?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateWarehouseDto {
  code: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  isDefault?: boolean;
}

export interface UpdateWarehouseDto {
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  isDefault?: boolean;
}

export interface CreateLocationDto {
  zone?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
  description?: string;
}

export interface AssignWarehouseInventoryDto {
  variantId: string;
  availableQuantity?: number;
  minimumStock?: number;
  maximumStock?: number;
  reorderLevel?: number;
}

export interface TransferStockDto {
  variantId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  reason?: string;
}

export interface WarehouseListResponse {
  data: WarehouseResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
