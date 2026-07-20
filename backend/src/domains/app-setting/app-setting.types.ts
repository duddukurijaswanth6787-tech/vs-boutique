import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSettingDto {
  @ApiProperty() @IsString() key!: string;
  @ApiProperty() @IsString() value!: string;
  @ApiPropertyOptional({ default: 'STRING' })
  @IsOptional()
  @IsString()
  type?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() group?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class UpdateSettingDto {
  @ApiProperty() @IsString() value!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class SettingResponse {
  @ApiProperty() id!: string;
  @ApiProperty() key!: string;
  @ApiProperty() value!: string;
  @ApiProperty() type!: string;
  @ApiPropertyOptional() group?: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() createdAt!: Date;
}

export class SettingQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() group?: string;
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
