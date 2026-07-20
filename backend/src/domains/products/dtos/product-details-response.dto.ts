import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductResponse } from '../products.types';

export class BrandDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() logo?: string;
  @ApiPropertyOptional() banner?: string;
  @ApiPropertyOptional() website?: string;
  @ApiPropertyOptional() brandStory?: string;
}

export class CategoryWithParentDto {
  @ApiProperty() categoryId!: string;
  @ApiProperty() categoryName!: string;
  @ApiProperty() categorySlug!: string;
  @ApiPropertyOptional() parentId?: string;
  @ApiPropertyOptional() parentName?: string;
}

export class BreadcrumbDto {
  @ApiProperty() label!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() categoryId!: string;
}

export class MediaImageDto {
  @ApiProperty() id!: string;
  @ApiProperty() url!: string;
  @ApiPropertyOptional() thumbnailUrl?: string;
  @ApiPropertyOptional() altText?: string;
  @ApiProperty() displayOrder!: number;
  @ApiProperty() isPrimary!: boolean;
}

export class MediaVideoDto {
  @ApiProperty() id!: string;
  @ApiProperty() url!: string;
  @ApiPropertyOptional() thumbnailUrl?: string;
  @ApiPropertyOptional() title?: string;
}

export class ThreeSixtyImageDto {
  @ApiProperty() id!: string;
  @ApiProperty() url!: string;
}

export class MediaGroupDto {
  @ApiProperty({ type: [MediaImageDto] }) images!: MediaImageDto[];
  @ApiProperty({ type: [MediaVideoDto] }) videos!: MediaVideoDto[];
  @ApiProperty({ type: [ThreeSixtyImageDto] })
  threeSixtyImages!: ThreeSixtyImageDto[];
}

export class VariantAttributeValueDto {
  @ApiProperty() attributeId!: string;
  @ApiProperty() attributeName!: string;
  @ApiProperty() attributeType!: string;
  @ApiPropertyOptional() value?: string;
  @ApiPropertyOptional() optionLabel?: string;
}

export class VariantImageDto {
  @ApiProperty() url!: string;
  @ApiPropertyOptional() thumbnailUrl?: string;
  @ApiPropertyOptional() altText?: string;
  @ApiProperty() isPrimary!: boolean;
}

export class VariantDetailsDto {
  @ApiProperty() id!: string;
  @ApiProperty() sku!: string;
  @ApiProperty() barcode!: string;
  @ApiProperty() title!: string;
  @ApiProperty() price!: number;
  @ApiPropertyOptional() salePrice?: number;
  @ApiPropertyOptional() weight?: number;
  @ApiProperty() isDefault!: boolean;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() stockStatus!: string;
  @ApiProperty() availableQuantity!: number;
  @ApiProperty() reservedQuantity!: number;
  @ApiProperty() allowBackorder!: boolean;
  @ApiProperty({ type: [VariantAttributeValueDto] })
  attributeValues!: VariantAttributeValueDto[];
  @ApiProperty({ type: [VariantImageDto] }) images!: VariantImageDto[];
}

export class PricingDto {
  @ApiProperty() mrp!: number;
  @ApiPropertyOptional() salePrice?: number;
  @ApiPropertyOptional() discountPercent?: number;
  @ApiPropertyOptional() discountAmount?: number;
  @ApiPropertyOptional() taxPercentage?: number;
  @ApiProperty() taxAmount!: number;
  @ApiProperty() youSave!: number;
  @ApiProperty() finalPrice!: number;
}

export class AttributeInfoDto {
  @ApiProperty() attributeId!: string;
  @ApiProperty() attributeName!: string;
  @ApiProperty() attributeType!: string;
  @ApiPropertyOptional() value?: string;
}

export class InventorySummaryDto {
  @ApiProperty() totalAvailable!: number;
  @ApiProperty() totalReserved!: number;
  @ApiProperty() inStock!: boolean;
  @ApiProperty() lowStock!: boolean;
  @ApiProperty() outOfStock!: boolean;
  @ApiProperty() allowBackorder!: boolean;
  @ApiProperty() trackInventory!: boolean;
  @ApiProperty() minOrderQty!: number;
  @ApiProperty() maxOrderQty!: number;
}

export class ReviewSummaryDto {
  @ApiProperty() averageRating!: number;
  @ApiProperty() totalReviews!: number;
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Rating distribution mapped by star count (1-5)',
  })
  ratingDistribution!: Record<string, number>;
}

export class ReviewImageDto {
  @ApiProperty() url!: string;
  @ApiPropertyOptional() altText?: string;
}

export class ReviewItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() rating!: number;
  @ApiPropertyOptional() title?: string;
  @ApiPropertyOptional() comment?: string;
  @ApiPropertyOptional() customerName?: string;
  @ApiPropertyOptional() customerAvatarUrl?: string;
  @ApiProperty({ type: [ReviewImageDto] }) images!: ReviewImageDto[];
  @ApiProperty() isVerifiedPurchase!: boolean;
  @ApiProperty() helpfulCount!: number;
  @ApiProperty() createdAt!: string;
}

export class ReviewsContainerDto {
  @ApiProperty({ type: ReviewSummaryDto }) summary!: ReviewSummaryDto;
  @ApiProperty({ type: [ReviewItemDto] }) items!: ReviewItemDto[];
  @ApiProperty() totalCount!: number;
}

export class OfferDetailsDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() type!: string;
  @ApiProperty() value!: number;
  @ApiPropertyOptional() applicableTo?: string;
}

export class ProductCardDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() basePrice!: number;
  @ApiPropertyOptional() salePrice?: number;
  @ApiPropertyOptional() brandName?: string;
  @ApiProperty() brandId!: string;
  @ApiPropertyOptional() primaryImageUrl?: string;
  @ApiPropertyOptional() stockStatus?: string;
  @ApiPropertyOptional() rating?: number;
  @ApiPropertyOptional() reviewCount?: number;
}

export class SeoDetailsDto {
  @ApiPropertyOptional() title?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() keywords?: string;
  @ApiPropertyOptional() canonicalUrl?: string;
  @ApiPropertyOptional() ogImage?: string;
}

export class WishlistStatusDto {
  @ApiProperty() inWishlist!: boolean;
  @ApiProperty() wishlistItemId!: string | null;
}

export class CartStatusDto {
  @ApiProperty() inCart!: boolean;
  @ApiProperty() cartItemId!: string | null;
  @ApiProperty() quantity!: number | null;
}

export class DeliveryInfoDto {
  @ApiProperty() serviceable!: boolean;
  @ApiProperty() estimatedDays!: string | null;
  @ApiProperty() shippingCharge!: number;
  @ApiProperty() freeShipping!: boolean;
  @ApiProperty() codAvailable!: boolean;
  @ApiProperty() shippingMethod!: string | null;
}

export class ProductDetailsResponseDto {
  @ApiProperty({ type: () => ProductResponse })
  product!: ProductResponse;

  @ApiProperty({ type: BrandDto })
  brand!: BrandDto;

  @ApiProperty({ type: [CategoryWithParentDto] })
  categories!: CategoryWithParentDto[];

  @ApiProperty({ type: [BreadcrumbDto] })
  breadcrumbs!: BreadcrumbDto[];

  @ApiProperty({ type: MediaGroupDto })
  media!: MediaGroupDto;

  @ApiProperty({ type: [VariantDetailsDto] })
  variants!: VariantDetailsDto[];

  @ApiProperty({ type: PricingDto })
  pricing!: PricingDto;

  @ApiProperty({ type: [AttributeInfoDto] })
  attributes!: AttributeInfoDto[];

  @ApiProperty({ type: InventorySummaryDto })
  inventory!: InventorySummaryDto;

  @ApiProperty({ type: ReviewsContainerDto })
  reviews!: ReviewsContainerDto;

  @ApiProperty({ type: [OfferDetailsDto] })
  offers!: OfferDetailsDto[];

  @ApiProperty({ type: [ProductCardDto] })
  relatedProducts!: ProductCardDto[];

  @ApiProperty({ type: [ProductCardDto] })
  similarProducts!: ProductCardDto[];

  @ApiProperty({ type: SeoDetailsDto })
  seo!: SeoDetailsDto;

  @ApiProperty({ type: WishlistStatusDto })
  wishlist!: WishlistStatusDto;

  @ApiProperty({ type: CartStatusDto })
  cart!: CartStatusDto;

  @ApiPropertyOptional({ type: DeliveryInfoDto })
  delivery?: DeliveryInfoDto;

  @ApiProperty() shareUrl!: string;
}

export class ErrorResponseDto {
  @ApiProperty({ example: false }) success!: boolean;
  @ApiProperty({ example: 404 }) statusCode!: number;
  @ApiProperty({ example: 'Product not found' }) message!: string;
  @ApiProperty({ example: null, nullable: true }) data!: unknown;
  @ApiProperty({
    type: 'object',
    properties: {
      timestamp: { type: 'string', example: '2026-07-19T12:00:00.000Z' },
      correlationId: { type: 'string', example: 'abc-123' },
      path: { type: 'string', example: '/api/products/some-id/details' },
      apiVersion: { type: 'string', example: 'v1' },
    },
  })
  meta!: Record<string, unknown>;
}
