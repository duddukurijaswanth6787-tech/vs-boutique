import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VectorDistance } from './rag.types';

export enum RetrievalMode {
  VECTOR = 'vector',
  KEYWORD = 'keyword',
  HYBRID = 'hybrid',
}

export class RetrieveDto {
  @ApiProperty({ description: 'Search query text' })
  @IsString()
  query!: string;

  @ApiPropertyOptional({ description: 'Max results to return', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  topK?: number = 10;

  @ApiPropertyOptional({
    description: 'Minimum similarity score (0–1)',
    default: 0.7,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  threshold?: number = 0.7;

  @ApiPropertyOptional({ enum: VectorDistance, default: VectorDistance.COSINE })
  @IsOptional()
  @IsEnum(VectorDistance)
  distance?: VectorDistance;

  @ApiPropertyOptional({
    enum: RetrievalMode,
    default: RetrievalMode.VECTOR,
    description: 'Search mode: vector, keyword (full-text), or hybrid (both combined)',
  })
  @IsOptional()
  @IsEnum(RetrievalMode)
  mode?: RetrievalMode;

  @ApiPropertyOptional({ description: 'Filter by knowledge source ID' })
  @IsOptional()
  @IsString()
  knowledgeSourceId?: string;

  @ApiPropertyOptional({ description: 'Filter by document ID' })
  @IsOptional()
  @IsString()
  documentId?: string;

  @ApiPropertyOptional({
    description: 'Max context characters to return',
    default: 10000,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(100000)
  @Type(() => Number)
  maxContextChars?: number = 10000;

  @ApiPropertyOptional({ description: 'Enable deduplication', default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  dedupEnabled?: boolean = true;
}

export class BatchRetrieveDto {
  @ApiProperty({
    description: 'Multiple search queries',
    minItems: 1,
    maxItems: 25,
  })
  @IsArray()
  queries!: string[];

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  topK?: number = 5;

  @ApiPropertyOptional({ default: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  threshold?: number = 0.7;
}

export class RetrievedChunkDto {
  @ApiProperty() chunkId!: string;
  @ApiProperty() documentId!: string;
  @ApiProperty() knowledgeSourceId!: string;
  @ApiProperty() content!: string;
  @ApiProperty() score!: number;
  @ApiProperty() characterCount!: number;
  @ApiPropertyOptional() documentTitle?: string;
  @ApiPropertyOptional() knowledgeSourceName?: string;
  @ApiProperty() chunkIndex!: number;
}

export class RetrieveResponseDto {
  @ApiProperty({ type: [RetrievedChunkDto] })
  chunks!: RetrievedChunkDto[];
  @ApiProperty() totalResults!: number;
  @ApiProperty() queryTimeMs!: number;
  @ApiProperty() queryEmbeddingTimeMs!: number;
  @ApiProperty() query!: string;
}

export class BatchRetrieveResponseDto {
  @ApiProperty({ type: [RetrieveResponseDto] })
  results!: RetrieveResponseDto[];
  @ApiProperty() totalTimeMs!: number;
}

export class RetrieveHealthDto {
  @ApiProperty() embeddingProvider!: string;
  @ApiProperty() embeddingOk!: boolean;
  @ApiProperty() pgvectorOk!: boolean;
  @ApiProperty() indexAvailable!: boolean;
  @ApiProperty() topK!: number;
  @ApiProperty() threshold!: number;
  @ApiProperty() latencyMs!: number;
  @ApiProperty() status!: 'healthy' | 'degraded' | 'unhealthy';
}
