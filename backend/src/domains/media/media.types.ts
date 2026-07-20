import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  IsUrl,
  IsEnum,
  Min,
  Max,
} from 'class-validator';

// ─── Create ──────────────────────────────────────────────

export class CreateMediaDto {
  @ApiProperty() @IsUUID() productId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() variantId?: string;
  @ApiProperty({ enum: ['IMAGE', 'VIDEO', 'DOCUMENT', '360_IMAGE'] })
  @IsEnum(['IMAGE', 'VIDEO', 'DOCUMENT', '360_IMAGE'])
  mediaType!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() altText?: string;
  @ApiProperty() @IsUrl() url!: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() thumbnailUrl?: string;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

// ─── Update ──────────────────────────────────────────────

export class UpdateMediaDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() altText?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() url?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() thumbnailUrl?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPrimary?: boolean;
}

// ─── Query ───────────────────────────────────────────────

export class MediaQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() productId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() variantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() mediaType?: string;
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

// ─── Reorder ─────────────────────────────────────────────

export class ReorderMediaDto {
  @ApiProperty({ type: [Object] }) items!: {
    id: string;
    displayOrder: number;
  }[];
}

// ─── Response ────────────────────────────────────────────

export class MediaResponse {
  @ApiProperty() id!: string;
  @ApiProperty() productId!: string;
  @ApiPropertyOptional() variantId?: string;
  @ApiProperty() mediaType!: string;
  @ApiPropertyOptional() title?: string;
  @ApiPropertyOptional() altText?: string;
  @ApiProperty() url!: string;
  @ApiPropertyOptional() thumbnailUrl?: string;
  @ApiProperty() displayOrder!: number;
  @ApiProperty() isPrimary!: boolean;
  @ApiProperty() status!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class MediaListResponse {
  @ApiProperty({ type: [MediaResponse] }) data!: MediaResponse[];
  @ApiProperty() meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
