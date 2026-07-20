import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard enterprise API response envelope.
 */
export class StandardApiResponse<T> {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Request processed successfully' })
  message!: string;

  @ApiProperty()
  data!: T | null;

  @ApiProperty({ example: '2026-07-09T10:20:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: 'correlation-id-uuid' })
  correlationId!: string;

  @ApiProperty({ example: '/api/v1/resource' })
  path!: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  metadata!: Record<string, unknown>;

  constructor(partial: Partial<StandardApiResponse<T>>) {
    Object.assign(this, partial);
  }
}

/**
 * Pagination metadata detail properties.
 */
export class PaginationMeta {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 100 })
  total!: number;

  @ApiProperty({ example: 10 })
  totalPages!: number;

  @ApiProperty({ example: true })
  hasNext!: boolean;

  @ApiProperty({ example: false })
  hasPrevious!: boolean;
}

/**
 * Standard paginated API response envelope.
 */
export class PaginatedApiResponse<T> extends StandardApiResponse<T[]> {
  @ApiProperty({ type: () => PaginationMeta })
  declare metadata: Record<string, unknown> & { pagination: PaginationMeta };
}
