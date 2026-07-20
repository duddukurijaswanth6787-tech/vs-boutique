import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsEnum,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttributeType } from '@shared/commerce/commerce.enums';

// ─── Attribute Group DTOs ────────────────────────────────

export class CreateAttributeGroupDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class UpdateAttributeGroupDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}

export class AttributeGroupQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
  @ApiPropertyOptional({ default: 'displayOrder' })
  @IsOptional()
  @IsString()
  sortBy?: string;
  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

export class AttributeGroupResponse {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() displayOrder!: number;
  @ApiProperty() status!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

// ─── Attribute DTOs ──────────────────────────────────────

export class CreateAttributeDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() groupId?: string;
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ enum: AttributeType })
  @IsEnum(AttributeType)
  type!: AttributeType;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFilterable?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isSearchable?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isComparable?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isVariant?: boolean;
}

export class UpdateAttributeDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional({ enum: AttributeType })
  @IsOptional()
  @IsEnum(AttributeType)
  type?: AttributeType;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isRequired?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFilterable?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isSearchable?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isComparable?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isVariant?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}

export class AttributeQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() groupId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional({ enum: AttributeType })
  @IsOptional()
  @IsEnum(AttributeType)
  type?: AttributeType;
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
  @ApiPropertyOptional({ default: 'displayOrder' })
  @IsOptional()
  @IsString()
  sortBy?: string;
  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

export class AttributeResponse {
  @ApiProperty() id!: string;
  @ApiProperty() groupId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ enum: AttributeType }) type!: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() displayOrder!: number;
  @ApiProperty() isRequired!: boolean;
  @ApiProperty() isFilterable!: boolean;
  @ApiProperty() isSearchable!: boolean;
  @ApiProperty() isComparable!: boolean;
  @ApiProperty() isVariant!: boolean;
  @ApiProperty() status!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

// ─── Attribute Option DTOs ───────────────────────────────

export class CreateAttributeOptionDto {
  @ApiProperty() @IsUUID() attributeId!: string;
  @ApiProperty() @IsString() value!: string;
  @ApiProperty() @IsString() label!: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() metadata?: Record<
    string,
    unknown
  >;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class UpdateAttributeOptionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() value?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() label?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() metadata?: Record<
    string,
    unknown
  >;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}

export class AttributeOptionQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() attributeId?: string;
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}

export class AttributeOptionResponse {
  @ApiProperty() id!: string;
  @ApiProperty() attributeId!: string;
  @ApiProperty() value!: string;
  @ApiProperty() label!: string;
  @ApiPropertyOptional() metadata?: Record<string, unknown>;
  @ApiProperty() displayOrder!: number;
  @ApiProperty() status!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

// ─── Category Attribute Mapping DTOs ─────────────────────

export class CreateCategoryAttributeDto {
  @ApiProperty() @IsUUID() categoryId!: string;
  @ApiProperty() @IsUUID() attributeId!: string;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFilterable?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isSearchable?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isComparable?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isVariant?: boolean;
}

export class UpdateCategoryAttributeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isRequired?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFilterable?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isSearchable?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isComparable?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isVariant?: boolean;
}

export class CategoryAttributeResponse {
  @ApiProperty() categoryId!: string;
  @ApiProperty() attributeId!: string;
  @ApiProperty() displayOrder!: number;
  @ApiProperty() isRequired!: boolean;
  @ApiProperty() isFilterable!: boolean;
  @ApiProperty() isSearchable!: boolean;
  @ApiProperty() isComparable!: boolean;
  @ApiProperty() isVariant!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class CategoryAttributesQueryDto {
  @ApiProperty() @IsUUID() categoryId!: string;
}

// ─── List Response Wrappers ──────────────────────────────

export class AttributeGroupListResponse {
  @ApiProperty({ type: [AttributeGroupResponse] })
  data!: AttributeGroupResponse[];
  @ApiProperty() meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export class AttributeListResponse {
  @ApiProperty({ type: [AttributeResponse] }) data!: AttributeResponse[];
  @ApiProperty() meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export class AttributeOptionListResponse {
  @ApiProperty({ type: [AttributeOptionResponse] })
  data!: AttributeOptionResponse[];
  @ApiProperty() meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export class CategoryAttributeListResponse {
  @ApiProperty({ type: [CategoryAttributeResponse] })
  data!: CategoryAttributeResponse[];
}
