import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DashboardQueryDto {
  @ApiPropertyOptional({ description: 'Time window in days for rate metrics' })
  @IsOptional()
  @IsString()
  window?: string = '1';
}

export class DashboardDto {
  @ApiProperty() totalConversations!: number;
  @ApiProperty() activeConversations!: number;
  @ApiProperty() messagesToday!: number;
  @ApiProperty() retrievalRequests!: number;
  @ApiProperty() avgRetrievalLatencyMs!: number;
  @ApiProperty() embeddingRequests!: number;
  @ApiProperty() embeddingFailures!: number;
  @ApiProperty() llmRequests!: number;
  @ApiProperty() avgLlmLatencyMs!: number;
  @ApiProperty() toolExecutions!: number;
  @ApiProperty() toolFailures!: number;
  @ApiProperty() queueDepth!: number;
  @ApiProperty() documents!: number;
  @ApiProperty() chunks!: number;
  @ApiProperty() embeddings!: number;
  @ApiProperty() knowledgeSources!: number;
  @ApiProperty() providerUptime!: number;
}

export class ToolAnalyticsDto {
  @ApiProperty() total!: number;
  @ApiProperty() success!: number;
  @ApiProperty() failures!: number;
  @ApiProperty() byTool!: Record<
    string,
    { total: number; success: number; failures: number }
  >;
}

export class RetrievalAnalyticsDto {
  @ApiProperty() documents!: number;
  @ApiProperty() chunks!: number;
  @ApiProperty() embeddings!: number;
  @ApiProperty() pending!: number;
  @ApiProperty() indexed!: number;
}

export class ProviderAnalyticsDto {
  @ApiProperty() embedding!: { ok: boolean; model: string };
  @ApiProperty() llm!: { ok: boolean; model: string };
}

export class ChatAnalyticsDto {
  @ApiProperty() conversations!: number;
  @ApiProperty() messages!: number;
  @ApiProperty() feedbackReceived!: number;
  @ApiProperty() avgConversationLength!: number;
}

export class AnalyticsHealthDto {
  @ApiProperty() overall!: string;
  @ApiProperty() score!: number;
  @ApiProperty() database!: string;
  @ApiProperty() redis!: string;
  @ApiProperty() bullmq!: string;
  @ApiProperty() embedding!: string;
  @ApiProperty() retrieval!: string;
  @ApiProperty() orchestrator!: string;
  @ApiProperty() businessTools!: string;
  @ApiProperty() customerChat!: string;
  @ApiProperty() adminConsole!: string;
  @ApiProperty() storage!: string;
}

export class TraceContextDto {
  @ApiPropertyOptional() requestId?: string;
  @ApiPropertyOptional() correlationId?: string;
  @ApiPropertyOptional() conversationId?: string;
}
