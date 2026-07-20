import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ReturnStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

export class ReturnItemDto {
  @ApiProperty() @IsUUID() orderItemId!: string;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) quantity!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

export class CreateReturnDto {
  @ApiProperty() @IsUUID() orderId!: string;
  @ApiProperty() @IsString() reason!: string;
  @ApiProperty({ type: [ReturnItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items!: ReturnItemDto[];
}

export class UpdateReturnStatusDto {
  @ApiProperty({ enum: ReturnStatus })
  @IsEnum(ReturnStatus)
  status!: ReturnStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() adminNotes?: string;
}

export class ReturnItemResponse {
  @ApiProperty() id!: string;
  @ApiProperty() orderItemId!: string;
  @ApiProperty() quantity!: number;
  @ApiPropertyOptional() reason?: string;
}

export class ReturnRequestResponse {
  @ApiProperty() id!: string;
  @ApiProperty() orderId!: string;
  @ApiProperty() returnNumber!: string;
  @ApiProperty() reason!: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional() adminNotes?: string;
  @ApiPropertyOptional({ type: [ReturnItemResponse] })
  items?: ReturnItemResponse[];
  @ApiProperty() createdAt!: Date;
}

export class ReturnQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() orderId?: string;
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
