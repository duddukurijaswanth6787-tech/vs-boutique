import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class ToolExecuteDto {
  @ApiProperty({ description: 'Tool input payload (tool-specific)' })
  @IsObject()
  input!: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Acting user id (ownership scope)' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Acting user roles' })
  @IsOptional()
  roles?: string[];
}

export class BusinessToolInfoDto {
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiProperty() schema!: Record<string, unknown>;
}

export class ToolListDto {
  @ApiProperty({ type: [BusinessToolInfoDto] }) tools!: BusinessToolInfoDto[];
}

export class ToolExecutionResultDto {
  @ApiProperty() tool!: string;
  @ApiProperty() success!: boolean;
  @ApiProperty() result!: unknown;
}

export class ToolHealthDto {
  @ApiProperty() total!: number;
  @ApiProperty({ type: [String] }) tools!: string[];
  @ApiProperty() status!: string;
}
