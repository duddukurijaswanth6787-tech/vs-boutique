import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TransactionManager } from './transaction.manager';

/**
 * Global database module containing the database client, transaction manager,
 * and related utilities for data access infrastructure.
 */
@Global()
@Module({
  providers: [PrismaService, TransactionManager],
  exports: [PrismaService, TransactionManager],
})
export class DatabaseModule {}
