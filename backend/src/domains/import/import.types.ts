import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsIn } from 'class-validator';

export class ImportPreviewDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file!: any;
}

export class ImportConfirmDto {
  @ApiProperty({ description: 'Array of row data from preview' })
  @IsArray()
  rows!: Record<string, any>[];

  @ApiProperty({ enum: ['products', 'customers'] })
  @IsString()
  @IsIn(['products', 'customers'])
  entity!: string;
}

export class ImportPreviewResponse {
  @ApiProperty() totalRows!: number;
  @ApiProperty() validRows!: number;
  @ApiProperty() errorRows!: number;
  @ApiProperty({ type: [Object] })
  preview!: Record<string, any>[];
  @ApiProperty({ type: [Object] })
  errors!: { row: number; message: string }[];
  @ApiProperty({ type: [String] })
  columns!: string[];
}

export class ImportResultResponse {
  @ApiProperty() imported!: number;
  @ApiProperty() skipped!: number;
  @ApiProperty() failed!: number;
  @ApiProperty({ type: [Object] })
  errors!: { row?: number; message: string }[];
  @ApiProperty() entity!: string;
  @ApiProperty() createdAt!: Date;
}
