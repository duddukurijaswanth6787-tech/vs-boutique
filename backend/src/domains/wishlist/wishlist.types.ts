import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class AddToWishlistDto {
  @ApiProperty() @IsUUID() productId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() variantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class WishlistQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
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

export class WishlistItemResponse {
  @ApiProperty() id!: string;
  @ApiProperty() wishlistId!: string;
  @ApiProperty() productId!: string;
  @ApiPropertyOptional() productName?: string;
  @ApiPropertyOptional() variantId?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiProperty() createdAt!: Date;
}

export class WishlistResponse {
  @ApiProperty() id!: string;
  @ApiProperty() customerId!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ type: [WishlistItemResponse] })
  items?: WishlistItemResponse[];
  @ApiProperty() itemCount!: number;
  @ApiProperty() createdAt!: Date;
}
