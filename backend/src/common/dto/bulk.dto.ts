import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class BulkActionDto {
  @ApiProperty({ description: 'Array of entity IDs' })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids!: string[];

  @ApiProperty({
    enum: [
      'delete',
      'restore',
      'activate',
      'deactivate',
      'suspend',
      'publish',
      'unpublish',
      'feature',
      'unfeature',
    ],
  })
  @IsString()
  action!: string;
}

export class BulkOperationResult {
  @ApiProperty({
    type: [Object],
    example: [{ id: 'uuid-1' }, { id: 'uuid-2' }],
  })
  success!: { id: string }[];

  @ApiProperty({
    type: [Object],
    example: [{ id: 'uuid-3', error: 'Not found' }],
  })
  failed!: { id: string; error: string }[];

  @ApiProperty() totalProcessed!: number;
  @ApiProperty() successCount!: number;
  @ApiProperty() failureCount!: number;
}
