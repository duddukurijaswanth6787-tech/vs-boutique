import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AgentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum KnowledgeSourceType {
  TEXT = 'TEXT',
  DOCUMENT = 'DOCUMENT',
  URL = 'URL',
  FAQ = 'FAQ',
  CMS = 'CMS',
  PRODUCT = 'PRODUCT',
  CATEGORY = 'CATEGORY',
  BRAND = 'BRAND',
  POLICY = 'POLICY',
  COLLECTION = 'COLLECTION',
  BLOG = 'BLOG',
  API = 'API',
}

export enum KnowledgeSourceSyncMode {
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
  WEBHOOK = 'webhook',
  EVENT = 'event',
}

export enum KnowledgeSourceStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  INDEXED = 'INDEXED',
  FAILED = 'FAILED',
}

export enum EmbeddingJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export enum ConversationStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export class CreateAgentDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() agentKey!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() systemPrompt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() modelProvider?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() model?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  @Type(() => Number)
  temperature?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxTokens?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tools?: string[];
}

export class UpdateAgentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() systemPrompt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() modelProvider?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() model?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  @Type(() => Number)
  temperature?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxTokens?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tools?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(AgentStatus)
  status?: AgentStatus;
}

export class CreateKnowledgeSourceDto {
  @ApiProperty() @IsString() @MinLength(1) name!: string;
  @ApiProperty({ enum: KnowledgeSourceType })
  @IsEnum(KnowledgeSourceType)
  sourceType!: KnowledgeSourceType;
  @ApiPropertyOptional() @IsOptional() @IsString() sourceUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() rawText?: string;
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  priority?: number;
  @ApiPropertyOptional({
    enum: KnowledgeSourceSyncMode,
    default: KnowledgeSourceSyncMode.MANUAL,
  })
  @IsOptional()
  @IsEnum(KnowledgeSourceSyncMode)
  syncMode?: KnowledgeSourceSyncMode;
}

export class UpdateKnowledgeSourceDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(1) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sourceUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() rawText?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() enabled?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  priority?: number;
  @ApiPropertyOptional({ enum: KnowledgeSourceSyncMode })
  @IsOptional()
  @IsEnum(KnowledgeSourceSyncMode)
  syncMode?: KnowledgeSourceSyncMode;
}

export class SubmitFeedbackDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isHelpful?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
}

export enum VectorDistance {
  COSINE = 'cosine',
  L2 = 'l2',
  INNER = 'inner',
}

export class VectorSearchDto {
  @ApiProperty({ description: 'Query embedding vector as array of floats' })
  @IsArray()
  @IsNumber({}, { each: true })
  vector!: number[];

  @ApiPropertyOptional({ enum: VectorDistance, default: VectorDistance.COSINE })
  @IsOptional()
  @IsEnum(VectorDistance)
  distance?: VectorDistance;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  topK?: number = 10;

  @ApiPropertyOptional({ default: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  threshold?: number = 0.7;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  knowledgeSourceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  documentId?: string;
}

export class VectorSearchResult {
  chunkId!: string;
  documentId!: string;
  knowledgeSourceId!: string;
  content!: string;
  chunkIndex!: number;
  score!: number;
  metadata?: Record<string, unknown>;
}

export class VectorHealthDto {
  pgvectorInstalled = false;
  pgvectorVersion = '';
  indexesExist = false;
  indexNames: string[] = [];
  dimension = 1536;
  queryable = false;
  latencyMs = 0;
  totalChunks = 0;
  indexedChunks = 0;
  status: 'healthy' | 'degraded' | 'unhealthy' = 'unhealthy';
}

export class SyncResultDto {
  @ApiProperty() success!: boolean;
  @ApiProperty() documentsCreated!: number;
  @ApiProperty() documentsUpdated!: number;
  @ApiProperty() documentsDeleted!: number;
  @ApiProperty() errors!: string[];
  @ApiProperty() durationMs!: number;
}

export class KnowledgeSourceStatsDto {
  @ApiProperty() total!: number;
  @ApiProperty() enabled!: number;
  @ApiProperty() syncing!: number;
  @ApiProperty() failed!: number;
  @ApiProperty() totalDocuments!: number;
}

export class KnowledgeSourceHealthDto {
  @ApiProperty() registeredAdapters!: number;
  @ApiProperty() enabledAdapters!: number;
  @ApiProperty() failedSyncs!: number;
  @ApiProperty() pendingSources!: number;
  @ApiProperty() status!: string;
  @ApiProperty() message!: string;
}

export class PaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;
  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;
}
