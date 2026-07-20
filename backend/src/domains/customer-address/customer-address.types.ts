import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsDecimal,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAddressDto {
  @ApiPropertyOptional({ default: 'Home' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty() @IsString() fullName!: string;
  @ApiProperty() @IsString() phone!: string;
  @ApiProperty() @IsString() addressLine1!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() addressLine2?: string;
  @ApiProperty() @IsString() city!: string;
  @ApiProperty() @IsString() state!: string;
  @ApiPropertyOptional({ default: 'IN' })
  @IsOptional()
  @IsString()
  country?: string;
  @ApiProperty() @IsString() postalCode!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() landmark?: string;
  @ApiPropertyOptional() @IsOptional() @IsDecimal() latitude?: string;
  @ApiPropertyOptional() @IsOptional() @IsDecimal() longitude?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefaultBilling?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefaultShipping?: boolean;
}

export class UpdateAddressDto {
  @ApiPropertyOptional() @IsOptional() @IsString() label?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fullName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() addressLine1?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() addressLine2?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() postalCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() landmark?: string;
  @ApiPropertyOptional() @IsOptional() @IsDecimal() latitude?: string;
  @ApiPropertyOptional() @IsOptional() @IsDecimal() longitude?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefaultBilling?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefaultShipping?: boolean;
}

export class AddressQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
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
  @ApiPropertyOptional({ default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;
  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

export class AddressResponse {
  @ApiProperty() id!: string;
  @ApiProperty() customerId!: string;
  @ApiProperty() label!: string;
  @ApiProperty() fullName!: string;
  @ApiProperty() phone!: string;
  @ApiProperty() addressLine1!: string;
  @ApiPropertyOptional() addressLine2?: string;
  @ApiProperty() city!: string;
  @ApiProperty() state!: string;
  @ApiProperty() country!: string;
  @ApiProperty() postalCode!: string;
  @ApiPropertyOptional() landmark?: string;
  @ApiPropertyOptional() latitude?: string;
  @ApiPropertyOptional() longitude?: string;
  @ApiProperty() isDefaultBilling!: boolean;
  @ApiProperty() isDefaultShipping!: boolean;
  @ApiProperty() status!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class AddressListResponse {
  @ApiProperty({ type: [AddressResponse] }) data!: AddressResponse[];
  @ApiProperty() meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
