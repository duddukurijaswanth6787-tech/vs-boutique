import { AttributeType } from '../products/product.types';

// Groups
export interface CreateAttributeGroupDto {
  name: string;
  slug?: string;
  description?: string;
  displayOrder?: number;
}

export interface UpdateAttributeGroupDto extends Partial<CreateAttributeGroupDto> {
  status?: string;
}

export interface AttributeGroupQueryDto {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface AttributeGroupResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Attributes
export interface CreateAttributeDto {
  groupId?: string;
  name: string;
  slug?: string;
  type: AttributeType;
  description?: string;
  displayOrder?: number;
  isRequired?: boolean;
  isFilterable?: boolean;
  isSearchable?: boolean;
  isComparable?: boolean;
  isVariant?: boolean;
}

export interface UpdateAttributeDto extends Partial<CreateAttributeDto> {
  status?: string;
}

export interface AttributeQueryDto {
  groupId?: string;
  search?: string;
  type?: AttributeType;
  isFilterable?: boolean;
  isVariant?: boolean;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AttributeResponse {
  id: string;
  groupId: string;
  groupName?: string;
  name: string;
  slug: string;
  type: AttributeType;
  description?: string;
  displayOrder: number;
  isRequired: boolean;
  isFilterable: boolean;
  isSearchable: boolean;
  isComparable: boolean;
  isVariant: boolean;
  status: string;
  options?: AttributeOptionResponse[];
  createdAt: string;
  updatedAt: string;
}

// Options
export interface CreateAttributeOptionDto {
  attributeId: string;
  value: string;
  label: string;
  metadata?: Record<string, unknown>;
  displayOrder?: number;
}

export interface UpdateAttributeOptionDto extends Partial<CreateAttributeOptionDto> {
  status?: string;
}

export interface AttributeOptionQueryDto {
  attributeId?: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface AttributeOptionResponse {
  id: string;
  attributeId: string;
  value: string;
  label: string;
  metadata?: Record<string, unknown>;
  displayOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Category Attributes
export interface CreateCategoryAttributeDto {
  categoryId: string;
  attributeId: string;
  displayOrder?: number;
  isFilterable?: boolean;
  isRequired?: boolean;
}

export interface UpdateCategoryAttributeDto {
  displayOrder?: number;
  isFilterable?: boolean;
  isRequired?: boolean;
}

export interface CategoryAttributeResponse {
  categoryId: string;
  attributeId: string;
  displayOrder: number;
  isFilterable: boolean;
  isRequired: boolean;
  attribute?: AttributeResponse;
}
