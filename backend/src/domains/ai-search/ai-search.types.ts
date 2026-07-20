import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class AiSearchDto {
  @ApiProperty() @IsString() query!: string;
  @ApiPropertyOptional() @IsOptional() filters?: Record<string, any>;
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class SearchSuggestionResponse {
  @ApiProperty({ type: [Object] }) products!: any[];
  @ApiProperty({ type: [Object] }) categories!: any[];
  @ApiProperty({ type: [Object] }) brands!: any[];
}

export class SearchHistoryResponse {
  @ApiProperty() id!: string;
  @ApiProperty() query!: string;
  @ApiProperty() resultCount!: number;
  @ApiProperty({ type: [String] }) clickedProductIds!: string[];
  @ApiProperty() createdAt!: Date;
}

export class TrendingSearchResponse {
  @ApiProperty() query!: string;
  @ApiProperty() count!: number;
}

export class SearchHistoryQueryDto {
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
