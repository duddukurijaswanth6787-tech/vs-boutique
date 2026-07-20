import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

// ─── Create ──────────────────────────────────────────────

export class CreateInventoryDto {
  @ApiProperty() @IsUUID() variantId!: string;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  availableQuantity?: number;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minimumStock?: number;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maximumStock?: number;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  reorderLevel?: number;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowBackorder?: boolean;
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;
}

// ─── Update ──────────────────────────────────────────────

export class UpdateInventoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minimumStock?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maximumStock?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  reorderLevel?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() allowBackorder?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() trackInventory?: boolean;
}

// ─── Stock Adjustment ────────────────────────────────────

export class AdjustStockDto {
  @ApiProperty() @Type(() => Number) @IsInt() quantity!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() remarks?: string;
}

export class StockMovementDto {
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) quantity!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() remarks?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referenceType?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() referenceId?: string;
}

// ─── Query ───────────────────────────────────────────────

export class InventoryQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() variantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() stockStatus?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  lowStock?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  outOfStock?: boolean;
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
  @ApiPropertyOptional({ default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;
  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

export class MovementQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() inventoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() variantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() movementType?: string;
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
  @ApiPropertyOptional({ default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;
  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

// ─── Response ────────────────────────────────────────────

export class InventoryResponse {
  @ApiProperty() id!: string;
  @ApiProperty() variantId!: string;
  @ApiProperty() availableQuantity!: number;
  @ApiProperty() reservedQuantity!: number;
  @ApiProperty() damagedQuantity!: number;
  @ApiProperty() returnedQuantity!: number;
  @ApiProperty() availableStock!: number;
  @ApiProperty() minimumStock!: number;
  @ApiProperty() maximumStock!: number;
  @ApiProperty() reorderLevel!: number;
  @ApiProperty() stockStatus!: string;
  @ApiProperty() allowBackorder!: boolean;
  @ApiProperty() trackInventory!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class InventoryMovementResponse {
  @ApiProperty() id!: string;
  @ApiProperty() inventoryId!: string;
  @ApiProperty() variantId!: string;
  @ApiProperty() movementType!: string;
  @ApiProperty() quantity!: number;
  @ApiProperty() previousQuantity!: number;
  @ApiProperty() newQuantity!: number;
  @ApiPropertyOptional() referenceType?: string;
  @ApiPropertyOptional() referenceId?: string;
  @ApiPropertyOptional() reason?: string;
  @ApiPropertyOptional() remarks?: string;
  @ApiPropertyOptional() performedBy?: string;
  @ApiProperty() createdAt!: Date;
}

export class InventoryListResponse {
  @ApiProperty({ type: [InventoryResponse] }) data!: InventoryResponse[];
  @ApiProperty() meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export class MovementListResponse {
  @ApiProperty({ type: [InventoryMovementResponse] })
  data!: InventoryMovementResponse[];
  @ApiProperty() meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export class StockSummaryResponse {
  @ApiProperty() totalItems!: number;
  @ApiProperty() inStock!: number;
  @ApiProperty() lowStock!: number;
  @ApiProperty() outOfStock!: number;
  @ApiProperty() totalAvailable!: number;
  @ApiProperty() totalReserved!: number;
}
