import { Module } from '@nestjs/common';
import { HomepageController } from './homepage.controller';
import { HomepageService } from './homepage.service';
import { CategoriesModule } from '@domains/categories/categories.module';
import { ProductsModule } from '@domains/products/products.module';
import { BrandsModule } from '@domains/brands/brands.module';
import { OfferModule } from '@domains/offer/offer.module';
import { ReviewModule } from '@domains/review/review.module';
import { CmsModule } from '@domains/cms/cms.module';
import { InstagramReelsModule } from '@domains/instagram-reels/instagram-reels.module';
import { AppSettingModule } from '@domains/app-setting/app-setting.module';
import { RecentlyViewedModule } from '@domains/recently-viewed/recently-viewed.module';
import { RecommendationModule } from '@domains/recommendation/recommendation.module';

@Module({
  imports: [
    CategoriesModule,
    ProductsModule,
    BrandsModule,
    OfferModule,
    ReviewModule,
    CmsModule,
    InstagramReelsModule,
    AppSettingModule,
    RecentlyViewedModule,
    RecommendationModule,
  ],
  controllers: [HomepageController],
  providers: [HomepageService],
  exports: [HomepageService],
})
export class HomepageModule {}
