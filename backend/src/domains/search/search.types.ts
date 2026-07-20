import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  IsNumber,
  IsArray,
  Min,
  Max,
} from 'class-validator';

// ─── Search Query ────────────────────────────────────────

export class SearchProductsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() q?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() brandId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() gender?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ageGroup?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() occasion?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() season?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isFeatured?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isNewArrival?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isBestSeller?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  inStock?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  collections?: string[];
  @ApiPropertyOptional() @IsOptional() attributeFilters?: Record<
    string,
    string[]
  >;
  @ApiPropertyOptional({ default: 'relevance' })
  @IsOptional()
  @IsString()
  sortBy?: string;
  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
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
}

// ─── Autocomplete ────────────────────────────────────────

export class AutocompleteDto {
  @ApiProperty() @IsString() q!: string;
  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}

// ─── Response ────────────────────────────────────────────

class FilterOption {
  @ApiProperty() value!: string;
  @ApiProperty() label!: string;
  @ApiProperty() count!: number;
}

class AvailableFilters {
  @ApiProperty({ type: [FilterOption] }) brands?: FilterOption[];
  @ApiProperty({ type: [FilterOption] }) categories?: FilterOption[];
  @ApiProperty({ type: [FilterOption] }) genders?: FilterOption[];
  @ApiProperty({ type: [FilterOption] }) ageGroups?: FilterOption[];
  @ApiProperty({ type: [FilterOption] }) occasions?: FilterOption[];
  @ApiProperty({ type: [FilterOption] }) seasons?: FilterOption[];
  @ApiProperty({ type: [FilterOption] }) types?: FilterOption[];
  @ApiProperty({ type: [FilterOption] }) tags?: FilterOption[];
  @ApiProperty({ type: [FilterOption] }) collections?: FilterOption[];
  @ApiPropertyOptional() priceRange?: { min: number; max: number };
  @ApiProperty({ type: [Object] }) attributes?: {
    slug: string;
    name: string;
    options: FilterOption[];
  }[];
}

class SearchResultProduct {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() sku!: string;
  @ApiPropertyOptional() shortDescription?: string;
  @ApiProperty() brandId!: string;
  @ApiPropertyOptional() brandName?: string;
  @ApiProperty() basePrice!: number;
  @ApiPropertyOptional() salePrice?: number;
  @ApiProperty() status!: string;
  @ApiProperty() isFeatured!: boolean;
  @ApiProperty() isNewArrival!: boolean;
  @ApiProperty() isBestSeller!: boolean;
  @ApiPropertyOptional() gender?: string;
  @ApiPropertyOptional() ageGroup?: string;
  @ApiPropertyOptional({ type: [String] }) tags?: string[];
  @ApiPropertyOptional({ type: [String] }) collections?: string[];
  @ApiPropertyOptional() primaryImage?: string;
  @ApiProperty() createdAt!: Date;
}

export class SearchResponse {
  @ApiProperty({ type: [SearchResultProduct] }) data!: SearchResultProduct[];
  @ApiProperty() appliedFilters!: Record<string, any>;
  @ApiProperty() availableFilters!: AvailableFilters;
  @ApiProperty() meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export class AutocompleteResponse {
  @ApiProperty({ type: [Object] }) products!: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
  }[];
  @ApiProperty({ type: [String] }) suggestions!: string[];
}

export class SearchListResponse {
  @ApiProperty({ type: [SearchResultProduct] }) data!: SearchResultProduct[];
  @ApiProperty() meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
