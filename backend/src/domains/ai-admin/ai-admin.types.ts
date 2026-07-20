import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePromptTemplateDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() template!: string;
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  variables!: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class UpdatePromptTemplateDto {
  @ApiPropertyOptional() @IsOptional() @IsString() template?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class PromptTemplateResponse {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() template!: string;
  @ApiProperty({ type: [String] }) variables!: string[];
  @ApiPropertyOptional() description?: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() version!: number;
  @ApiProperty() createdAt!: Date;
}

export class PromptTemplateQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
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

export class AiUsageLogResponse {
  @ApiProperty() id!: string;
  @ApiPropertyOptional() userId?: string;
  @ApiProperty() feature!: string;
  @ApiProperty() tokensUsed!: number;
  @ApiProperty() cost!: number;
  @ApiProperty() createdAt!: Date;
}
