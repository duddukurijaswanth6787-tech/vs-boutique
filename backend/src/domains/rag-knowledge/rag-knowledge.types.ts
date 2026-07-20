import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsUrl,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum KnowledgeSourceType {
  TEXT = 'TEXT',
  DOCUMENT = 'DOCUMENT',
  URL = 'URL',
  FAQ = 'FAQ',
  CMS = 'CMS',
}

export enum KnowledgeSourceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  INDEXED = 'INDEXED',
  FAILED = 'FAILED',
  ARCHIVED = 'ARCHIVED',
}

export class CreateKnowledgeSourceDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ enum: KnowledgeSourceType })
  @IsEnum(KnowledgeSourceType)
  sourceType!: KnowledgeSourceType;
  @ApiPropertyOptional() @IsOptional() @IsUrl() sourceUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() rawText?: string;
}

export class UpdateKnowledgeSourceDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() sourceUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() rawText?: string;
}

export class UploadUrlRequestDto {
  @ApiProperty() @IsString() fileName!: string;
  @ApiProperty() @IsString() mimeType!: string;
  @ApiProperty() @IsNumber() @Min(1) @Type(() => Number) size!: number;
}
