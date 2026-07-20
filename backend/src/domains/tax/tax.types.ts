import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsInt,
  IsArray,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TaxType {
  GST = 'GST',
  CGST = 'CGST',
  SGST = 'SGST',
  IGST = 'IGST',
}

export class CreateTaxRuleDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ enum: TaxType }) @IsEnum(TaxType) type!: TaxType;
  @ApiProperty() @IsNumber() @Type(() => Number) @Min(0) rate!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() applicableTo?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableIds?: string[];
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  priority?: number;
}

export class UpdateTaxRuleDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional({ enum: TaxType })
  @IsOptional()
  @IsEnum(TaxType)
  type?: TaxType;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  rate?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() applicableTo?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableIds?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  priority?: number;
}

export class CalculateTaxDto {
  @ApiProperty() @IsNumber() @Type(() => Number) @Min(0) orderAmount!: number;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];
}

export class TaxBreakdownItem {
  @ApiProperty() type!: string;
  @ApiProperty() rate!: number;
  @ApiProperty() amount!: number;
}

export class TaxRuleResponse {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() type!: string;
  @ApiProperty() rate!: number;
  @ApiPropertyOptional() applicableTo?: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() priority!: number;
  @ApiProperty() createdAt!: Date;
}

export class TaxCalculationResponse {
  @ApiProperty() orderAmount!: number;
  @ApiProperty() taxAmount!: number;
  @ApiProperty({ type: [TaxBreakdownItem] }) taxBreakdown!: TaxBreakdownItem[];
}

export class TaxRuleListResponse {
  @ApiProperty({ type: [TaxRuleResponse] }) data!: TaxRuleResponse[];
  @ApiProperty() meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
