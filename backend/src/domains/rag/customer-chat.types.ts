import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TypingState {
  TYPING = 'typing',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error',
}

export class CreateChatSessionDto {
  @ApiPropertyOptional({ description: 'Resume an existing session by ID' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Guest identifier for unauthenticated sessions',
  })
  @IsOptional()
  @IsString()
  guestId?: string;

  @ApiPropertyOptional({ description: 'Initial session title' })
  @IsOptional()
  @IsString()
  title?: string;
}

export class ChatMessageDto {
  @ApiProperty({ description: 'User message text' })
  @IsString()
  message!: string;

  @ApiPropertyOptional({ description: 'Existing session ID' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Guest identifier for unauthenticated sessions',
  })
  @IsOptional()
  @IsString()
  guestId?: string;

  @ApiPropertyOptional({ description: 'Override system prompt' })
  @IsOptional()
  @IsString()
  systemPrompt?: string;
}

export class ChatHistoryQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(200)
  limit?: number = 50;
}

export class RenameSessionDto {
  @ApiProperty({ description: 'New session title' })
  @IsString()
  title!: string;
}

export class SubmitChatFeedbackDto {
  @ApiProperty({ description: 'Assistant message ID to rate' })
  @IsString()
  messageId!: string;

  @ApiProperty({ description: 'Whether the response was helpful' })
  @IsBoolean()
  isHelpful!: boolean;

  @ApiPropertyOptional({ description: 'Optional rating 1-5' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Optional reason / comment' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class CitationDto {
  @ApiProperty() chunkId!: string;
  @ApiProperty() documentId!: string;
  @ApiProperty() knowledgeSourceId!: string;
  @ApiProperty() documentTitle!: string;
  @ApiProperty() score!: number;
}

export class ChatResponseDto {
  @ApiProperty() conversationId!: string;
  @ApiProperty() response!: string;
  @ApiProperty() model!: string;
  @ApiProperty() provider!: string;
  @ApiProperty() totalTokens!: number;
  @ApiProperty() responseTimeMs!: number;
  @ApiProperty({ enum: TypingState }) typing!: TypingState;
  @ApiProperty({ type: [CitationDto] }) citations!: CitationDto[];
}

export class ChatSessionDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() status!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() messageCount!: number;
}

export class SuggestedQuestionsDto {
  @ApiProperty({ type: [String] }) questions!: string[];
}
