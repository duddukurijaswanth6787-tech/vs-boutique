import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum RateType {
  FLAT = 'FLAT',
  WEIGHT = 'WEIGHT',
  PRICE = 'PRICE',
}

export class CreateShippingMethodDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() code!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() @IsString() estimatedDays!: string;
}

export class CreateShippingZoneDto {
  @ApiProperty() @IsString() methodId!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  countries!: string[];
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  states!: string[];
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  pincodes!: string[];
  @ApiProperty({ enum: RateType }) @IsEnum(RateType) rateType!: RateType;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0) rate!: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  freeAbove?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxWeight?: number;
}

export class CalculateShippingDto {
  @ApiProperty() @IsString() methodCode!: string;
  @ApiProperty() @IsString() country!: string;
  @ApiProperty() @IsString() state!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pincode?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weight?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  orderAmount?: number;
}

export class ShippingMethodResponse {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() code!: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() estimatedDays!: string;
  @ApiProperty() isActive!: boolean;
}

export class ShippingZoneResponse {
  @ApiProperty() id!: string;
  @ApiProperty() methodId!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ type: [String] }) countries!: string[];
  @ApiProperty({ type: [String] }) states!: string[];
  @ApiProperty() rateType!: string;
  @ApiProperty() rate!: number;
  @ApiPropertyOptional() freeAbove?: number;
}

export class ShippingCalculationResponse {
  @ApiProperty() methodCode!: string;
  @ApiProperty() methodName!: string;
  @ApiProperty() rate!: number;
  @ApiProperty() estimatedDelivery!: string;
  @ApiProperty() freeShipping!: boolean;
}
