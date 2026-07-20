import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SessionQueryDto {
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
  limit?: number;
  @ApiPropertyOptional({
    enum: ['createdAt', 'lastActivityAt', 'expiresAt'],
    default: 'lastActivityAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;
  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
}

export class SessionResponse {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiPropertyOptional() ipAddress?: string;
  @ApiPropertyOptional() userAgent?: string;
  @ApiProperty() isRevoked!: boolean;
  @ApiPropertyOptional() revokedAt?: Date;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() lastActivityAt!: Date;
  @ApiProperty() expiresAt!: Date;
  @ApiProperty() isExpired!: boolean;
  // ponytail: rememberMe inferred from 30d expiry vs 7d default
  @ApiProperty() get rememberMe(): boolean {
    return (
      this.expiresAt.getTime() - this.createdAt.getTime() >=
      29 * 24 * 60 * 60 * 1000
    );
  }
}
