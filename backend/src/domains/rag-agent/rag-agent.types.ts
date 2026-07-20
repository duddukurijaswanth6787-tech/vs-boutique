import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsUUID,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAgentDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() agentKey!: string;
  @ApiProperty() @IsString() description!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() avatarUrl?: string;
  @ApiPropertyOptional({ default: 'gemini' })
  @IsOptional()
  @IsString()
  modelProvider?: string;
  @ApiPropertyOptional({ default: 'gemini-1.5-flash' })
  @IsOptional()
  @IsString()
  model?: string;
  @ApiPropertyOptional({ default: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  @Type(() => Number)
  temperature?: number;
  @ApiPropertyOptional({ default: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxTokens?: number;
  @ApiProperty() @IsString() systemPrompt!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() instructions?: string;
  @ApiPropertyOptional() @IsOptional() behaviorConfig?: any;
  @ApiPropertyOptional() @IsOptional() toolConfig?: any;
  @ApiPropertyOptional() @IsOptional() guardrailConfig?: any;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAgentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
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
  @ApiPropertyOptional() @IsOptional() @IsString() systemPrompt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() instructions?: string;
  @ApiPropertyOptional() @IsOptional() behaviorConfig?: any;
  @ApiPropertyOptional() @IsOptional() toolConfig?: any;
  @ApiPropertyOptional() @IsOptional() guardrailConfig?: any;
}

export class AgentStatusDto {
  @ApiProperty() @IsIn(['ACTIVATE', 'DEACTIVATE']) action!:
    'ACTIVATE' | 'DEACTIVATE';
}

export class AssignKnowledgeDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  knowledgeSourceIds!: string[];
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  replace?: boolean;
}

export class ConfigureToolsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  tools!: string[];
}

export class TestAgentDto {
  @ApiProperty() @IsString() message!: string;
  @ApiPropertyOptional() @IsOptional() context?: any;
}

export class ChatRequestDto {
  @ApiProperty() @IsString() agentKey!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() conversationId?: string;
  @ApiProperty() @IsString() message!: string;
}

export class SubmitFeedbackDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isHelpful?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
}

export interface LlmChatOptions {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

export interface LlmMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LlmResponse {
  content: string;
  promptTokens: number;
  completionTokens: number;
}

export interface LlmProvider {
  chat(messages: LlmMessage[], options: LlmChatOptions): Promise<LlmResponse>;
  healthCheck(): Promise<boolean>;
  getProviderName(): string;
}

export interface EmbeddingProvider {
  embed(text: string, model: string): Promise<number[]>;
  embedBatch(texts: string[], model: string): Promise<number[][]>;
  dimensions: number;
  healthCheck(): Promise<boolean>;
  getProviderName(): string;
}

export interface RetrievalResult {
  chunkId: string;
  documentId: string;
  knowledgeSourceId: string;
  content: string;
  vectorScore: number;
  keywordScore: number;
  finalScore: number;
  metadata: any;
}
