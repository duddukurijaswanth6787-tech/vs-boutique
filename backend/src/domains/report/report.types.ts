import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum ReportType {
  SALES = 'SALES',
  INVENTORY = 'INVENTORY',
  CUSTOMER = 'CUSTOMER',
  PAYMENT = 'PAYMENT',
  ORDER = 'ORDER',
}

export enum ExportFormat {
  CSV = 'CSV',
  EXCEL = 'EXCEL',
}

export class GenerateReportDto {
  @ApiProperty({ enum: ReportType })
  @IsEnum(ReportType)
  type!: ReportType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: ExportFormat })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;
}

export class ReportResponse {
  @ApiProperty() type!: string;
  @ApiProperty() data!: any;
  @ApiProperty() generatedAt!: Date;
}

export class ExportJobResponse {
  @ApiProperty() id!: string;
  @ApiProperty() type!: string;
  @ApiProperty() format!: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional() fileUrl?: string;
  @ApiProperty() createdAt!: Date;
}
