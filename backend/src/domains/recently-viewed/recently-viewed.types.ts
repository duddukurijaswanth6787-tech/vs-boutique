import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecordViewDto {
  @ApiProperty() @IsUUID() productId!: string;
}

export class RecentlyViewedQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class MergeGuestItemDto {
  @ApiProperty() @IsUUID() productId!: string;
  @ApiProperty() @IsString() viewedAt!: string;
}

export class MergeGuestDto {
  @ApiProperty({ type: [MergeGuestItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MergeGuestItemDto)
  items!: MergeGuestItemDto[];
}

export class RecentlyViewedProductDto {
  @ApiProperty() productId!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() slug?: string;
  @ApiPropertyOptional({ type: Number }) basePrice?: number;
  @ApiPropertyOptional({ type: Number }) salePrice?: number;
  @ApiProperty() viewedAt!: Date;
}
