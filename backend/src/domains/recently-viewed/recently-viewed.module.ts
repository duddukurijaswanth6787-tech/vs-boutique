import { Module } from '@nestjs/common';
import { RecentlyViewedController } from './recently-viewed.controller';
import { RecentlyViewedService } from './recently-viewed.service';
import { RecentlyViewedRepository } from './recently-viewed.repository';

@Module({
  controllers: [RecentlyViewedController],
  providers: [RecentlyViewedService, RecentlyViewedRepository],
  exports: [RecentlyViewedService],
})
export class RecentlyViewedModule {}
