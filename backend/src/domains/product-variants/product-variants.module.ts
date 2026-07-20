import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { ProductsModule } from '@domains/products/products.module';
import { ProductVariantsController } from './product-variants.controller';
import { ProductVariantsService } from './product-variants.service';
import { ProductVariantsRepository } from './product-variants.repository';

@Module({
  imports: [AuthModule, AuditModule, ProductsModule],
  controllers: [ProductVariantsController],
  providers: [ProductVariantsService, ProductVariantsRepository],
  exports: [ProductVariantsService],
})
export class ProductVariantsModule {}
