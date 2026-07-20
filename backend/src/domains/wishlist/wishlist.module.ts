import { Module } from '@nestjs/common';
import { AuditModule } from '@domains/audit/audit.module';
import { WishlistService } from './wishlist.service';
import { WishlistRepository } from './wishlist.repository';

@Module({
  imports: [AuditModule],
  providers: [WishlistService, WishlistRepository],
  exports: [WishlistService],
})
export class WishlistModule {}
