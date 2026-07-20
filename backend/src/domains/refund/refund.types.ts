import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsUUID,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum RefundStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

export class CreateRefundDto {
  @ApiProperty() @IsUUID() paymentId!: string;
  @ApiProperty() @IsUUID() orderId!: string;
  @ApiProperty() @IsNumber() @Type(() => Number) amount!: number;
  @ApiProperty() @IsString() reason!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() method?: string;
}

export class UpdateRefundDto {
  @ApiPropertyOptional({ enum: RefundStatus })
  @IsOptional()
  @IsEnum(RefundStatus)
  status?: RefundStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() adminNotes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() transactionId?: string;
}

export class RefundQueryDto {
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

export class RefundResponse {
  @ApiProperty() id!: string;
  @ApiProperty() paymentId!: string;
  @ApiProperty() orderId!: string;
  @ApiProperty() refundNumber!: string;
  @ApiProperty() amount!: number;
  @ApiProperty() reason!: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional() method?: string;
  @ApiPropertyOptional() transactionId?: string;
  @ApiPropertyOptional() adminNotes?: string;
  @ApiProperty() createdAt!: Date;
}

export class RefundListResponse {
  @ApiProperty({ type: [RefundResponse] }) data!: RefundResponse[];
  @ApiProperty() meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
