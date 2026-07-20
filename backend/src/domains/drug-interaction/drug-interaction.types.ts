import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  Min,
  Max,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInteractionDto {
  @ApiProperty() @IsString() medicineA!: string;
  @ApiProperty() @IsString() medicineB!: string;
  @ApiProperty() @IsString() severity!: string;
  @ApiProperty() @IsString() description!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() recommendation?: string;
}

export class UpdateInteractionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() medicineA?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() medicineB?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() severity?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() recommendation?: string;
}

export class CheckInteractionDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  medicines!: string[];
}

export class InteractionResponse {
  @ApiProperty() id!: string;
  @ApiProperty() medicineA!: string;
  @ApiProperty() medicineB!: string;
  @ApiProperty() severity!: string;
  @ApiProperty() description!: string;
  @ApiPropertyOptional() recommendation?: string;
  @ApiProperty() createdAt!: Date;
}

export class InteractionCheckResponse {
  @ApiProperty() hasInteractions!: boolean;
  @ApiProperty({ type: [InteractionResponse] })
  interactions!: InteractionResponse[];
}

export class InteractionQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() severity?: string;
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

export class InteractionListResponse {
  @ApiProperty({ type: [InteractionResponse] }) data!: InteractionResponse[];
  @ApiProperty() meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
