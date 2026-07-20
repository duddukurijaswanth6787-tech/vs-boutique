import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class AnalyticsQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() feature?: string;
}

export class AiAnalyticsResponse {
  @ApiProperty() totalConversations!: number;
  @ApiProperty() totalSearches!: number;
  @ApiProperty() totalPrescriptions!: number;
  @ApiProperty() totalRecommendations!: number;
  @ApiProperty({ type: [Object] }) popularSearches!: any[];
  @ApiProperty({ type: [Object] }) popularProducts!: any[];
  @ApiProperty({ type: [Object] }) usageByFeature!: any[];
}
