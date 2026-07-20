import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @ApiProperty() @IsUUID() productId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() variantId?: string;
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class UpdateQuantityDto {
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) quantity!: number;
}

export class CartItemResponse {
  @ApiProperty() id!: string;
  @ApiProperty() cartId!: string;
  @ApiProperty() productId!: string;
  @ApiPropertyOptional() productName?: string;
  @ApiPropertyOptional() variantId?: string;
  @ApiProperty() quantity!: number;
  @ApiProperty() unitPrice!: number;
  @ApiProperty() totalPrice!: number;
  @ApiProperty() savedForLater!: boolean;
  @ApiProperty() createdAt!: Date;
}

export class CartResponse {
  @ApiProperty() id!: string;
  @ApiPropertyOptional() customerId?: string;
  @ApiPropertyOptional() guestId?: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional({ type: [CartItemResponse] }) items?: CartItemResponse[];
  @ApiProperty() itemCount!: number;
  @ApiProperty() subtotal!: number;
  @ApiProperty() totalSavings!: number;
  @ApiProperty() createdAt!: Date;
}

export class CartSummaryResponse {
  @ApiProperty() itemCount!: number;
  @ApiProperty() subtotal!: number;
  @ApiProperty() totalSavings!: number;
  @ApiProperty() mrpTotal!: number;
  @ApiProperty() saleTotal!: number;
  @ApiProperty() discountTotal!: number;
}

export class MergeCartDto {
  @ApiProperty() @IsString() guestId!: string;
}
