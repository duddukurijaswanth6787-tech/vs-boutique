import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum RecommendationType {
  RECENTLY_VIEWED = 'RECENTLY_VIEWED',
  FREQUENTLY_PURCHASED = 'FREQUENTLY_PURCHASED',
  RECOMMENDED = 'RECOMMENDED',
  RECENTLY_PURCHASED = 'RECENTLY_PURCHASED',
  WISHLIST_BASED = 'WISHLIST_BASED',
  CART_BASED = 'CART_BASED',
}

export class RecommendationQueryDto {
  @ApiPropertyOptional({ enum: RecommendationType })
  @IsOptional()
  @IsEnum(RecommendationType)
  type?: RecommendationType;
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

export class RecommendationResponse {
  @ApiProperty() id!: string;
  @ApiProperty() productId!: string;
  @ApiProperty() score!: number;
  @ApiPropertyOptional() reason?: string;
  @ApiProperty({ enum: RecommendationType }) type!: RecommendationType;
  @ApiProperty() createdAt!: Date;
}

export class RecommendationHistoryQueryDto {
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
