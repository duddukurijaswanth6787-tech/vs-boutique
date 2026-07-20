import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { CacheInvalidationListener } from './listeners/cache-invalidation.listener';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository, CacheInvalidationListener],
  exports: [ProductsService, ProductsRepository],
})
export class ProductsModule {}
