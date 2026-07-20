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
  IsArray,
  IsDateString,
  ValidateNested,
  IsEnum,
} from 'class-validator';

export enum ReelStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  SCHEDULED = 'SCHEDULED',
  ARCHIVED = 'ARCHIVED',
}

export enum ReelVisibility {
  PUBLIC = 'PUBLIC',
  HIDDEN = 'HIDDEN',
}

export class CreateReelDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() videoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() thumbnailUrl?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  position?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  displayOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() featured?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() autoPlay?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() muted?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() loop?: boolean;
  @ApiPropertyOptional({ enum: ReelStatus })
  @IsOptional()
  @IsEnum(ReelStatus)
  status?: ReelStatus;
  @ApiPropertyOptional({ enum: ReelVisibility })
  @IsOptional()
  @IsEnum(ReelVisibility)
  visibility?: ReelVisibility;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
}

export class UpdateReelDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() videoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() thumbnailUrl?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  position?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  displayOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() featured?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() autoPlay?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() muted?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() loop?: boolean;
  @ApiPropertyOptional({ enum: ReelStatus })
  @IsOptional()
  @IsEnum(ReelStatus)
  status?: ReelStatus;
  @ApiPropertyOptional({ enum: ReelVisibility })
  @IsOptional()
  @IsEnum(ReelVisibility)
  visibility?: ReelVisibility;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
}

export class ReelQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: ReelStatus })
  @IsOptional()
  @IsEnum(ReelStatus)
  status?: ReelStatus;
  @ApiPropertyOptional({ enum: ReelVisibility })
  @IsOptional()
  @IsEnum(ReelVisibility)
  visibility?: ReelVisibility;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() featured?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() sortBy?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sortOrder?: 'asc' | 'desc';
}

export class UpdateReelStatusDto {
  @ApiProperty({ enum: ReelStatus }) @IsEnum(ReelStatus) status!: ReelStatus;
}

export class ReorderItem {
  @ApiProperty() @IsUUID() id!: string;
  @ApiProperty() @Type(() => Number) @IsInt() displayOrder!: number;
}

export class ReorderReelsDto {
  @ApiProperty({ type: [ReorderItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItem)
  items!: ReorderItem[];
}

export class AttachProductsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('all', { each: true })
  productIds!: string[];
}

export class UploadUrlDto {
  @ApiProperty() @IsString() extension!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() type?: 'video' | 'thumbnail';
}

export class UploadUrlResponse {
  @ApiProperty() url!: string;
  @ApiProperty() filePath!: string;
}

class ReelProductDto {
  @ApiProperty() id!: string;
  @ApiProperty() productId!: string;
  @ApiProperty() displayOrder!: number;
  @ApiPropertyOptional() productName?: string;
  @ApiPropertyOptional() productSlug?: string;
  @ApiPropertyOptional() primaryImageUrl?: string;
}

class ReelAnalyticsSummaryDto {
  @ApiProperty() totalViews!: number;
  @ApiProperty() totalUniqueViews!: number;
  @ApiProperty() totalPlays!: number;
  @ApiProperty() averageWatchTime!: number;
  @ApiProperty() averageCompletionRate!: number;
  @ApiProperty() totalProductClicks!: number;
  @ApiProperty() totalWishlistClicks!: number;
  @ApiProperty() totalCartClicks!: number;
  @ApiProperty() totalOrdersGenerated!: number;
  @ApiProperty() totalRevenue!: number;
  @ApiProperty() averageConversionRate!: number;
}

export class ReelResponse {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() videoUrl?: string;
  @ApiPropertyOptional() thumbnailUrl?: string;
  @ApiProperty() duration!: number;
  @ApiProperty() position!: number;
  @ApiProperty() displayOrder!: number;
  @ApiProperty() featured!: boolean;
  @ApiProperty() autoPlay!: boolean;
  @ApiProperty() muted!: boolean;
  @ApiProperty() loop!: boolean;
  @ApiProperty({ enum: ReelStatus }) status!: string;
  @ApiProperty({ enum: ReelVisibility }) visibility!: string;
  @ApiPropertyOptional() startDate?: Date;
  @ApiPropertyOptional() endDate?: Date;
  @ApiProperty() viewCount!: number;
  @ApiProperty() playCount!: number;
  @ApiProperty() clickCount!: number;
  @ApiPropertyOptional() createdBy?: string;
  @ApiPropertyOptional() updatedBy?: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiPropertyOptional({ type: [ReelProductDto] }) products?: ReelProductDto[];
  @ApiPropertyOptional({ type: ReelAnalyticsSummaryDto })
  analytics?: ReelAnalyticsSummaryDto;
}

export class ReelListResponse {
  @ApiProperty({ type: [ReelResponse] }) data!: ReelResponse[];
  @ApiProperty() meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

class DailyAnalyticsDto {
  @ApiProperty() id!: string;
  @ApiProperty() date!: Date;
  @ApiProperty() views!: number;
  @ApiProperty() uniqueViews!: number;
  @ApiProperty() plays!: number;
  @ApiProperty() averageWatchTime!: number;
  @ApiProperty() completionRate!: number;
  @ApiProperty() productClicks!: number;
  @ApiProperty() wishlistClicks!: number;
  @ApiProperty() cartClicks!: number;
  @ApiProperty() ordersGenerated!: number;
  @ApiProperty() revenue!: number;
  @ApiProperty() conversionRate!: number;
}

export class ReelAnalyticsResponse {
  @ApiProperty({ type: ReelAnalyticsSummaryDto })
  summary!: ReelAnalyticsSummaryDto;
  @ApiProperty({ type: [DailyAnalyticsDto] }) daily!: DailyAnalyticsDto[];
}

export class ReelHistoryQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() action?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() userId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class CacheInfoResponse {
  @ApiProperty() key!: string;
  @ApiProperty() ttlSeconds!: number;
}
export class CacheMetricsResponse {
  @ApiProperty() hits!: number;
  @ApiProperty() misses!: number;
  @ApiProperty() sets!: number;
  @ApiProperty() dels!: number;
}

export class SystemHealthResponse {
  @ApiProperty() cache!: { status: string; metrics: CacheMetricsResponse };
  @ApiProperty() storage!: { status: string; details?: any };
  @ApiProperty() queue!: { status: string };
  @ApiProperty() scheduler!: { status: string; lastRun?: string };
}

export class NotificationDto {
  @ApiProperty() id!: string;
  @ApiProperty() type!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional() message?: string;
  @ApiProperty() level!: string;
  @ApiProperty() createdAt!: string;
  @ApiProperty() read!: boolean;
}

export class ExportReelDto {
  @ApiPropertyOptional({ enum: ReelStatus })
  @IsOptional()
  @IsEnum(ReelStatus)
  status?: ReelStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
}

export class ReelBulkActionDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('all', { each: true })
  ids!: string[];
  @ApiProperty({ enum: ['publish', 'archive', 'duplicate', 'delete'] })
  @IsString()
  action!: string;
}
