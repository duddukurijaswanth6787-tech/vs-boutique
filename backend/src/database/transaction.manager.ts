import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { DATABASE_CONSTANTS } from './database.constants';

type PrismaTxClient = Parameters<PrismaClient['$transaction']>[0] extends (
  client: infer T,
) => any
  ? T
  : never;

/**
 * Centralized transaction manager wrapping Prisma's interactive transaction API.
 * Provides retry-on-deadlock semantics for serialization conflicts.
 */
@Injectable()
export class TransactionManager {
  constructor(private readonly prisma: PrismaService) {}

  async execute<T>(
    fn: (tx: PrismaTxClient) => Promise<T>,
    options?: {
      timeout?: number;
      maxRetries?: number;
    },
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? DATABASE_CONSTANTS.RETRY_COUNT;
    const timeout = options?.timeout ?? DATABASE_CONSTANTS.TRANSACTION_TIMEOUT;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.prisma.$transaction((tx) => fn(tx), { timeout });
      } catch (error) {
        // ponytail: retry on serialization/deadlock only, others fail fast
        if (
          attempt < maxRetries &&
          error instanceof Error &&
          this.isRetryable(error)
        ) {
          lastError = error;
          continue;
        }
        throw error;
      }
    }
    throw lastError ?? new Error('Transaction failed');
  }

  private isRetryable(error: Error): boolean {
    const message = error.message || '';
    return message.includes('deadlock') || message.includes('serialization');
  }
}
