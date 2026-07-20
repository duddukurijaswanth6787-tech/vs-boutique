import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HomepageMetaDto {
  @ApiProperty({ example: '2026-07-19T12:00:00.000Z' })
  generatedAt!: string;

  @ApiProperty({ example: 'v1' })
  version = 'v1';
}

export class HeroBannerCardDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() imageUrl!: string;
  @ApiPropertyOptional() linkUrl?: string;
  @ApiPropertyOptional() placement?: string;
}

export class CategoryCardDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() slug?: string;
  @ApiPropertyOptional() icon?: string;
  @ApiPropertyOptional() image?: string;
}

export class ProductBrandDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() slug?: string;
}

export class ProductCategoryDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() slug?: string;
}

export class ProductCardDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional() slug?: string;
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() thumbnail?: string;
  @ApiPropertyOptional() price?: number;
  @ApiPropertyOptional() salePrice?: number;
  @ApiPropertyOptional() discount?: number;
  @ApiPropertyOptional() rating?: number;
  @ApiPropertyOptional() reviewCount?: number;
  @ApiPropertyOptional() stockStatus?: string;
  @ApiPropertyOptional() brand?: ProductBrandDto;
  @ApiPropertyOptional() category?: ProductCategoryDto;
  @ApiPropertyOptional() badges?: string[];
  @ApiPropertyOptional() isNewArrival?: boolean;
  @ApiPropertyOptional() isBestSeller?: boolean;
}

export class InstagramReelProductDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() slug?: string;
}

export class InstagramReelCardDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional() slug?: string;
  @ApiPropertyOptional() title?: string;
  @ApiPropertyOptional() thumbnail?: string;
  @ApiPropertyOptional() videoUrl?: string;
  @ApiPropertyOptional() viewCount?: number;
  @ApiPropertyOptional() likeCount?: number;
  @ApiPropertyOptional({ type: [InstagramReelProductDto] })
  products?: InstagramReelProductDto[];
}

export class OfferCardDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() type?: string;
  @ApiPropertyOptional() value?: number;
  @ApiPropertyOptional() minOrderAmount?: number;
  @ApiPropertyOptional() maxDiscountAmount?: number;
  @ApiPropertyOptional() startDate?: string;
  @ApiPropertyOptional() endDate?: string;
}

export class ReviewCardDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional() productId?: string;
  @ApiProperty() rating!: number;
  @ApiPropertyOptional() title?: string;
  @ApiPropertyOptional() comment?: string;
}

export class BrandCardDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() logo?: string;
  @ApiPropertyOptional() slug?: string;
}

export class FooterLinkDto {
  @ApiProperty() title!: string;
  @ApiProperty() href!: string;
}

export class FooterPolicyDto {
  @ApiProperty() slug!: string;
  @ApiProperty() title!: string;
  @ApiProperty() href!: string;
}

export class FooterContactDto {
  @ApiPropertyOptional() email?: string | null;
  @ApiPropertyOptional() phone?: string | null;
  @ApiPropertyOptional() address?: string | null;
}

export class FooterSocialDto {
  @ApiPropertyOptional() facebook?: string | null;
  @ApiPropertyOptional() instagram?: string | null;
  @ApiPropertyOptional() youtube?: string | null;
  @ApiPropertyOptional() twitter?: string | null;
}

export class FooterNewsletterDto {
  @ApiProperty() enabled!: boolean;
  @ApiPropertyOptional() title?: string | null;
  @ApiPropertyOptional() text?: string | null;
}

// ponytail: additive expansion of footer contract — rich CMS-driven footer.
// All fields optional so empty settings degrade gracefully.
export class FooterDto {
  @ApiPropertyOptional() about?: string | null;
  @ApiPropertyOptional() contact?: FooterContactDto;
  @ApiPropertyOptional() social?: FooterSocialDto;
  @ApiPropertyOptional() company?: FooterLinkDto[];
  @ApiPropertyOptional() support?: FooterLinkDto[];
  @ApiPropertyOptional() policies?: FooterPolicyDto[];
  @ApiPropertyOptional() quickLinks?: {
    categories: FooterLinkDto[];
    support: FooterLinkDto[];
  };
  @ApiPropertyOptional() newsletter?: FooterNewsletterDto;
  @ApiPropertyOptional() copyright?: string | null;
}

export class HomepageResponseDto {
  @ApiProperty({ type: [HeroBannerCardDto] })
  heroBanners!: HeroBannerCardDto[];

  @ApiProperty({ type: [CategoryCardDto] })
  categories!: CategoryCardDto[];

  @ApiProperty({ type: [ProductCardDto] })
  featuredCollections!: ProductCardDto[];

  @ApiProperty({ type: [ProductCardDto] })
  newArrivals!: ProductCardDto[];

  @ApiProperty({ type: [ProductCardDto] })
  bestSellers!: ProductCardDto[];

  @ApiProperty({ type: [ProductCardDto] })
  trendingProducts!: ProductCardDto[];

  @ApiProperty({ type: [InstagramReelCardDto] })
  instagramReels!: InstagramReelCardDto[];

  @ApiProperty({ type: [OfferCardDto] })
  flashSale!: OfferCardDto[];

  @ApiProperty({ type: [ProductCardDto] })
  recommendedProducts!: ProductCardDto[];

  @ApiProperty({ type: [ProductCardDto] })
  recentlyViewed!: ProductCardDto[];

  @ApiProperty({ type: [ReviewCardDto] })
  testimonials!: ReviewCardDto[];

  @ApiProperty({ type: [BrandCardDto] })
  brands!: BrandCardDto[];

  @ApiProperty({ type: FooterDto })
  footer!: FooterDto;

  @ApiProperty({ type: HomepageMetaDto })
  meta!: HomepageMetaDto;
}
