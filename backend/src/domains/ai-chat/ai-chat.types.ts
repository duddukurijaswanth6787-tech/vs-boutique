import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateConversationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() context?: string;
}

export class SendMessageDto {
  @ApiProperty() @IsString() content!: string;
}

export class ConversationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
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

export class AiMessageResponse {
  @ApiProperty() id!: string;
  @ApiProperty() role!: string;
  @ApiProperty() content!: string;
  @ApiProperty() tokenCount!: number;
  @ApiProperty() createdAt!: Date;
}

export class AiConversationResponse {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiPropertyOptional() title?: string;
  @ApiProperty() status!: string;
  @ApiProperty() tokenCount!: number;
  @ApiProperty({ type: [AiMessageResponse] }) messages?: AiMessageResponse[];
  @ApiProperty() createdAt!: Date;
}

export class AddFeedbackDto {
  @ApiProperty() @IsString() type!: string;
  @ApiProperty() @IsString() referenceId!: string;
  @ApiProperty() @IsInt() @Type(() => Number) rating!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
}
