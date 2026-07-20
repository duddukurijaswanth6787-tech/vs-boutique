import { DATABASE_CONSTANTS } from './database.constants';
import { PaginationMeta } from './database.types';

export class DatabaseUtils {
  static buildPaginationMeta(
    total: number,
    page: number,
    limit: number,
  ): PaginationMeta {
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  static normalizePagination(
    page?: number,
    limit?: number,
  ): { page: number; limit: number; skip: number } {
    const p = Math.max(1, page || DATABASE_CONSTANTS.DEFAULT_PAGE_SIZE);
    const l = Math.min(
      Math.max(1, limit || DATABASE_CONSTANTS.DEFAULT_PAGE_SIZE),
      DATABASE_CONSTANTS.MAX_PAGE_SIZE,
    );
    return { page: p, limit: l, skip: (p - 1) * l };
  }
}
