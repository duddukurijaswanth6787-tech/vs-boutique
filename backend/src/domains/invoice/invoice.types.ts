import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsUUID,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvoiceDto {
  @ApiProperty() @IsUUID() orderId!: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() billingAddress?: Record<
    string,
    any
  >;
  @ApiPropertyOptional() @IsOptional() @IsObject() shippingAddress?: Record<
    string,
    any
  >;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class InvoiceQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() orderId?: string;
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
}

export class InvoiceItemResponse {
  @ApiProperty() id!: string;
  @ApiProperty() productName!: string;
  @ApiProperty() sku!: string;
  @ApiProperty() quantity!: number;
  @ApiProperty() unitPrice!: number;
  @ApiProperty() totalPrice!: number;
  @ApiProperty() taxAmount!: number;
  @ApiProperty() discountAmount!: number;
}

export class InvoiceResponse {
  @ApiProperty() id!: string;
  @ApiProperty() orderId!: string;
  @ApiProperty() invoiceNumber!: string;
  @ApiProperty() status!: string;
  @ApiProperty() subtotal!: number;
  @ApiProperty() taxTotal!: number;
  @ApiProperty() discountTotal!: number;
  @ApiProperty() grandTotal!: number;
  @ApiProperty() currency!: string;
  @ApiPropertyOptional() billingAddress?: Record<string, any>;
  @ApiPropertyOptional() shippingAddress?: Record<string, any>;
  @ApiPropertyOptional({ type: [InvoiceItemResponse] })
  items?: InvoiceItemResponse[];
  @ApiPropertyOptional() notes?: string;
  @ApiProperty() createdAt!: Date;
}

export class InvoiceListResponse {
  @ApiProperty({ type: [InvoiceResponse] }) data!: InvoiceResponse[];
  @ApiProperty() meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
