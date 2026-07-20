import { Module } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { ProductsModule } from '@domains/products/products.module';
import { RecentlyViewedModule } from '@domains/recently-viewed/recently-viewed.module';
import { OrderModule } from '@domains/order/order.module';
import { WishlistModule } from '@domains/wishlist/wishlist.module';

@Module({
  imports: [ProductsModule, RecentlyViewedModule, OrderModule, WishlistModule],
  providers: [RecommendationService],
  exports: [RecommendationService],
})
export class RecommendationModule {}
