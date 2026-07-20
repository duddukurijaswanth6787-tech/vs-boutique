import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum DocumentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum ChunkingStrategy {
  FIXED = 'fixed',
  PARAGRAPH = 'paragraph',
  SENTENCE = 'sentence',
  RECURSIVE = 'recursive',
}

export class UploadDocumentDto {
  @ApiPropertyOptional({ description: 'Override knowledge source ID' })
  @IsOptional()
  @IsString()
  knowledgeSourceId?: string;

  @ApiPropertyOptional({ description: 'Document title (defaults to filename)' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    enum: ChunkingStrategy,
    default: ChunkingStrategy.FIXED,
  })
  @IsOptional()
  @IsEnum(ChunkingStrategy)
  chunkingStrategy?: ChunkingStrategy;

  @ApiPropertyOptional({ description: 'Override chunk size (chars)' })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(10000)
  @Type(() => Number)
  chunkSize?: number;

  @ApiPropertyOptional({ description: 'Override chunk overlap (chars)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2000)
  @Type(() => Number)
  chunkOverlap?: number;
}

export class UploadDocumentResponse {
  @ApiProperty() id!: string;
  @ApiProperty() filename!: string;
  @ApiProperty() size!: number;
  @ApiProperty() mimeType!: string;
  @ApiProperty({ enum: DocumentStatus }) status!: DocumentStatus;
  @ApiProperty() contentHash!: string;
  @ApiProperty() chunkCount!: number;
  @ApiProperty() createdAt!: Date;
}

export class BatchUploadResponse {
  @ApiProperty({ type: [UploadDocumentResponse] })
  documents!: UploadDocumentResponse[];
  @ApiProperty() totalSize!: number;
  @ApiProperty() failed!: number;
}

export class DocumentListDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}

export class ReprocessDocumentDto {
  @ApiPropertyOptional({ enum: ChunkingStrategy })
  @IsOptional()
  @IsEnum(ChunkingStrategy)
  chunkingStrategy?: ChunkingStrategy;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(10000)
  @Type(() => Number)
  chunkSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2000)
  @Type(() => Number)
  chunkOverlap?: number;
}

export class DocumentHealthDto {
  storageProvider!: string;
  storageOk!: boolean;
  queueOk!: boolean;
  parsers!: string[];
  chunkerAvailable!: boolean;
  dbConnected!: boolean;
  status!: 'healthy' | 'degraded' | 'unhealthy';
  message!: string;
}

export class ChunkDto {
  @ApiProperty() id!: string;
  @ApiProperty() index!: number;
  @ApiProperty() content!: string;
  @ApiProperty() characterCount!: number;
  @ApiPropertyOptional() startOffset?: number;
  @ApiPropertyOptional() endOffset?: number;
  @ApiProperty() createdAt!: Date;
}
