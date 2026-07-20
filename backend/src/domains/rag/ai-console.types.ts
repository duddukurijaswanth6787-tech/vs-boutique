import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AdminPaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(200)
  limit?: number = 20;
}

export class AdminKnowledgeListDto extends AdminPaginationDto {
  @ApiPropertyOptional({ description: 'Filter by enabled state' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Filter by sync status' })
  @IsOptional()
  @IsString()
  syncStatus?: string;
}

export class AdminDocumentListDto extends AdminPaginationDto {
  @ApiPropertyOptional({ description: 'Search by filename (case-insensitive)' })
  @IsOptional()
  @IsString()
  filename?: string;

  @ApiPropertyOptional({ description: 'Filter by knowledge source ID' })
  @IsOptional()
  @IsString()
  knowledgeSourceId?: string;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class AdminConversationListDto extends AdminPaginationDto {
  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by session ID' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Search messages (case-insensitive)' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class AdminRetrievalTestDto {
  @ApiProperty({ description: 'Test query' })
  @IsString()
  query!: string;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  topK?: number = 5;

  @ApiPropertyOptional({ default: 0.7 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  threshold?: number = 0.7;

  @ApiPropertyOptional({ description: 'Vector distance metric' })
  @IsOptional()
  @IsIn(['cosine', 'l2', 'inner'])
  distance?: 'cosine' | 'l2' | 'inner' = 'cosine';

  @ApiPropertyOptional({ description: 'Filter by knowledge source ID' })
  @IsOptional()
  @IsString()
  knowledgeSourceId?: string;

  @ApiPropertyOptional({ description: 'Filter by document ID' })
  @IsOptional()
  @IsString()
  documentId?: string;
}

export class AdminPromptPreviewDto {
  @ApiProperty({ description: 'Message to preview prompt for' })
  @IsString()
  message!: string;

  @ApiPropertyOptional({ description: 'Existing conversation ID for history' })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiPropertyOptional({ description: 'Override system prompt' })
  @IsOptional()
  @IsString()
  systemPrompt?: string;
}

export class AdminToggleSourceDto {
  @ApiProperty({ description: 'Enable or disable the source' })
  @IsBoolean()
  enabled!: boolean;
}

export class AdminVersionSourceDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  priority?: number = 1;
}

export class AdminDashboardDto {
  @ApiProperty() totalDocuments!: number;
  @ApiProperty() totalKnowledgeSources!: number;
  @ApiProperty() totalChunks!: number;
  @ApiProperty() totalEmbeddings!: number;
  @ApiProperty() totalConversations!: number;
  @ApiProperty() retrievalRequests!: number;
  @ApiProperty() providerStatus!: { embedding: string; llm: string };
  @ApiProperty() queueStatus!: string;
  @ApiProperty() averageLatencyMs!: number;
  @ApiProperty() recentFailures!: number;
}

export class AdminHealthDto {
  @ApiProperty() overall!: 'healthy' | 'degraded' | 'unhealthy';
  @ApiProperty() score!: number;
  @ApiProperty() database!: string;
  @ApiProperty() redis!: string;
  @ApiProperty() bullmq!: string;
  @ApiProperty() embedding!: string;
  @ApiProperty() retrieval!: string;
  @ApiProperty() orchestrator!: string;
  @ApiProperty() storage!: string;
}

export class AdminProviderDto {
  @ApiProperty() name!: string;
  @ApiProperty() model!: string;
  @ApiProperty() enabled!: boolean;
  @ApiProperty() current!: boolean;
}
