import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class OrchestrateDto {
  @ApiProperty({ description: 'User message' })
  @IsString()
  message!: string;

  @ApiPropertyOptional({
    description: 'Conversation ID (null = new conversation)',
  })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiPropertyOptional({ description: 'Session ID for guest users' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Override system prompt' })
  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @ApiPropertyOptional({ default: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  @Type(() => Number)
  temperature?: number;
}

export class OrchestrateResponseDto {
  @ApiProperty() message!: string;
  @ApiProperty() conversationId!: string;
  @ApiProperty() response!: string;
  @ApiProperty() model!: string;
  @ApiProperty() provider!: string;
  @ApiProperty() totalTokens!: number;
  @ApiProperty() responseTimeMs!: number;
  @ApiProperty() retrievalCount!: number;
  @ApiProperty({
    type: [Object],
    description: 'Retrieval citations (no embeddings)',
  })
  citations!: Array<{
    chunkId: string;
    documentId: string;
    knowledgeSourceId: string;
    documentTitle: string;
    score: number;
  }>;
}

export class ProviderInfoDto {
  @ApiProperty() name!: string;
  @ApiProperty() model!: string;
  @ApiProperty() ok!: boolean;
  @ApiProperty() message!: string;
}

export class ToolInfoDto {
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
}

export class OrchestratorHealthDto {
  @ApiProperty() llmProvider!: string;
  @ApiProperty() llmOk!: boolean;
  @ApiProperty() retrievalOk!: boolean;
  @ApiProperty() memoryOk!: boolean;
  @ApiProperty() toolsAvailable!: number;
  @ApiProperty({ enum: ['healthy', 'degraded', 'unhealthy'] })
  status!: string;
}
