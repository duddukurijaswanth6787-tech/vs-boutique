import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCancellationDto {
  @ApiProperty() @IsUUID() orderId!: string;
  @ApiProperty() @IsString() reason!: string;
}

export class UpdateCancellationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() refundStatus?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() adminNotes?: string;
}

export class CancellationResponse {
  @ApiProperty() id!: string;
  @ApiProperty() orderId!: string;
  @ApiProperty() reason!: string;
  @ApiProperty() status!: string;
  @ApiProperty() refundStatus!: string;
  @ApiPropertyOptional() adminNotes?: string;
  @ApiProperty() createdAt!: Date;
}
