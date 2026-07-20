import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentDto {
  @ApiProperty() @IsUUID() orderId!: string;
  @ApiProperty() @IsString() method!: string;
  @ApiProperty() @IsString() provider!: string;
  @ApiProperty() @IsNumber() @Type(() => Number) amount!: number;
  @ApiPropertyOptional({ default: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class PaymentQueryDto {
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

export class PaymentTransactionResponse {
  @ApiProperty() id!: string;
  @ApiProperty() type!: string;
  @ApiProperty() status!: string;
  @ApiProperty() amount!: number;
  @ApiPropertyOptional() providerRefId?: string;
  @ApiProperty() createdAt!: Date;
}

export class PaymentResponse {
  @ApiProperty() id!: string;
  @ApiProperty() orderId!: string;
  @ApiProperty() paymentNumber!: string;
  @ApiProperty() method!: string;
  @ApiProperty() provider!: string;
  @ApiProperty() status!: string;
  @ApiProperty() amount!: number;
  @ApiProperty() currency!: string;
  @ApiPropertyOptional() transactionId?: string;
  @ApiPropertyOptional({ type: [PaymentTransactionResponse] })
  transactions?: PaymentTransactionResponse[];
  @ApiProperty() createdAt!: Date;
}

export class PaymentListResponse {
  @ApiProperty({ type: [PaymentResponse] }) data!: PaymentResponse[];
  @ApiProperty() meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export class VerifyPaymentDto {
  @ApiProperty() @IsString() razorpayPaymentId!: string;
  @ApiProperty() @IsString() razorpaySignature!: string;
}
