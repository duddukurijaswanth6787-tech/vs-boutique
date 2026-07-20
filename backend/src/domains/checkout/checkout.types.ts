import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CheckoutPreviewDto {
  @ApiProperty() @IsUUID() addressId!: string;
  @ApiPropertyOptional({ default: 'STANDARD' })
  @IsOptional()
  @IsString()
  shippingMethod?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() couponCode?: string;
}

export class CheckoutItemResponse {
  @ApiProperty() productId!: string;
  @ApiProperty() productName!: string;
  @ApiPropertyOptional() variantId?: string;
  @ApiProperty() quantity!: number;
  @ApiProperty() unitPrice!: number;
  @ApiProperty() totalPrice!: number;
  @ApiProperty() taxAmount!: number;
}

export class CheckoutSummaryResponse {
  @ApiProperty({ type: [CheckoutItemResponse] }) items!: CheckoutItemResponse[];
  @ApiProperty() itemCount!: number;
  @ApiProperty() subtotal!: number;
  @ApiProperty() discountTotal!: number;
  @ApiProperty() taxTotal!: number;
  @ApiProperty() shippingCharge!: number;
  @ApiProperty() grandTotal!: number;
  @ApiProperty() estimatedDelivery!: string;
}

export class PlaceOrderDto {
  @ApiProperty() @IsUUID() addressId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shippingMethod?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() couponCode?: string;
}
