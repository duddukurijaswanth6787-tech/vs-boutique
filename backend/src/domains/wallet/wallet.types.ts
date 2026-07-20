import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreditWalletDto {
  @ApiProperty() @IsNumber() @Type(() => Number) amount!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referenceType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referenceId?: string;
}

export class DebitWalletDto {
  @ApiProperty() @IsNumber() @Type(() => Number) amount!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referenceType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referenceId?: string;
}

export class WalletTransactionQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
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

export class WalletTransactionResponse {
  @ApiProperty() id!: string;
  @ApiProperty() type!: string;
  @ApiProperty() amount!: number;
  @ApiProperty() balanceAfter!: number;
  @ApiPropertyOptional() referenceType?: string;
  @ApiPropertyOptional() referenceId?: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() createdAt!: Date;
}

export class WalletResponse {
  @ApiProperty() id!: string;
  @ApiProperty() customerId!: string;
  @ApiProperty() balance!: number;
  @ApiProperty() currency!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() createdAt!: Date;
}
