import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  MinLength,
  MaxLength,
} from 'class-validator';

export class GenerateEmbeddingDto {
  @ApiProperty({ description: 'Text to embed', minLength: 1, maxLength: 10000 })
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  text!: string;

  @ApiPropertyOptional({ description: 'Override embedding model' })
  @IsOptional()
  @IsString()
  model?: string;
}

export class BatchEmbeddingDto {
  @ApiProperty({
    description: 'Texts to embed (max 100)',
    minItems: 1,
    maxItems: 100,
  })
  @IsArray()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(10000, { each: true })
  texts!: string[];

  @ApiPropertyOptional({ description: 'Override embedding model' })
  @IsOptional()
  @IsString()
  model?: string;
}

export class EmbeddingResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() chunkId!: string;
  @ApiProperty() dimension!: number;
  @ApiProperty() model!: string;
  @ApiProperty() provider!: string;
  @ApiProperty() processingTimeMs!: number;
  @ApiProperty() status!: string;
  @ApiPropertyOptional() errorMessage?: string;
  @ApiProperty() createdAt!: Date;
}

export class ProviderHealthDto {
  @ApiProperty() name!: string;
  @ApiProperty() ok!: boolean;
  @ApiProperty() model!: string;
  @ApiProperty() dimension!: number;
  @ApiProperty() message!: string;
}
