import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  IsNumber,
  Min,
  Max,
  IsArray,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import {
  ProductType,
  GenderType,
  AgeGroup,
} from '@shared/commerce/commerce.enums';

// ─── Create ──────────────────────────────────────────────

export class CreateProductDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sku?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() visibility?: string;
  @ApiProperty() @IsUUID() brandId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shortDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;

  @ApiProperty({ enum: ProductType })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0) basePrice!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salePrice?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  wholesalePrice?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costPrice?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  taxPercentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() discountType?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowBackorder?: boolean;
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minimumOrderQuantity?: number;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maximumOrderQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weight?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  length?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  width?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  height?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isNewArrival?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isBestSeller?: boolean;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() seoTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() seoDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() seoKeywords?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() canonicalUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() searchKeywords?: string;

  @ApiPropertyOptional({ enum: GenderType })
  @IsOptional()
  @IsEnum(GenderType)
  gender?: GenderType;
  @ApiPropertyOptional({ enum: AgeGroup })
  @IsOptional()
  @IsEnum(AgeGroup)
  ageGroup?: AgeGroup;
  @ApiPropertyOptional() @IsOptional() @IsString() occasion?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() season?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  collections?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  categoryIds?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeEntry)
  attributes?: ProductAttributeEntry[];
}

export class ProductAttributeEntry {
  @ApiProperty() @IsUUID() attributeId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() value?: string;
}

// ─── Update ──────────────────────────────────────────────

export class UpdateProductDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sku?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() brandId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shortDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: ProductType })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() visibility?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  basePrice?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salePrice?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  wholesalePrice?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costPrice?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  taxPercentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() discountType?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() trackInventory?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() allowBackorder?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minimumOrderQuantity?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maximumOrderQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weight?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  length?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  width?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  height?: number;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isNewArrival?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isBestSeller?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() seoTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() seoDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() seoKeywords?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() canonicalUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() searchKeywords?: string;

  @ApiPropertyOptional({ enum: GenderType })
  @IsOptional()
  @IsEnum(GenderType)
  gender?: GenderType;
  @ApiPropertyOptional({ enum: AgeGroup })
  @IsOptional()
  @IsEnum(AgeGroup)
  ageGroup?: AgeGroup;
  @ApiPropertyOptional() @IsOptional() @IsString() occasion?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() season?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  collections?: string[];
}

// ─── Query ───────────────────────────────────────────────

export class ProductQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() brandId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() visibility?: string;
  @ApiPropertyOptional({ enum: ProductType })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;
  @ApiPropertyOptional({ enum: GenderType })
  @IsOptional()
  @IsEnum(GenderType)
  gender?: GenderType;
  @ApiPropertyOptional({ enum: AgeGroup })
  @IsOptional()
  @IsEnum(AgeGroup)
  ageGroup?: AgeGroup;
  @ApiPropertyOptional() @IsOptional() @IsString() occasion?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() season?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isFeatured?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isNewArrival?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isBestSeller?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPublished?: boolean;
  @ApiPropertyOptional({
    description: 'Filter: null=active only, "only"=deleted only, omit=all',
  })
  @IsOptional()
  @IsString()
  deleted?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  updatedBy?: string;

  @ApiPropertyOptional({ description: 'Filter by tags (comma-separated)' })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  createdAfter?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  createdBefore?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() categoryId?: string;
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
  @ApiPropertyOptional({ default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;
  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

// ─── Assign DTOs ─────────────────────────────────────────

export class AssignCategoriesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('all', { each: true })
  categoryIds!: string[];
}

export class AssignAttributesDto {
  @ApiProperty({ type: [ProductAttributeEntry] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeEntry)
  attributes!: ProductAttributeEntry[];
}

export class AssignTagsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags!: string[];
}

export class AssignCollectionsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  collections!: string[];
}

export class AssignRelatedProductsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('all', { each: true })
  relatedProductIds!: string[];
}

// ─── Response ────────────────────────────────────────────

class ProductCategoryInfo {
  @ApiProperty() categoryId!: string;
  @ApiProperty() categoryName!: string;
  @ApiProperty() categorySlug!: string;
}

class ProductAttributeInfo {
  @ApiProperty() attributeId!: string;
  @ApiProperty() attributeName!: string;
  @ApiProperty() attributeType!: string;
  @ApiPropertyOptional() value?: string;
}

class ProductRelatedInfo {
  @ApiProperty() productId!: string;
  @ApiProperty() productName!: string;
}

export class ProductResponse {
  @ApiProperty() id!: string;
  @ApiProperty() sku!: string;
  @ApiProperty() barcode!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional() primaryImageUrl?: string;
  @ApiPropertyOptional() shortDescription?: string;
  @ApiPropertyOptional() description?: string;

  @ApiProperty() brandId!: string;
  @ApiPropertyOptional() brandName?: string;

  @ApiProperty() type!: string;
  @ApiProperty() status!: string;
  @ApiProperty() visibility!: string;

  @ApiProperty() basePrice!: number;
  @ApiPropertyOptional() salePrice?: number;
  @ApiPropertyOptional() wholesalePrice?: number;
  @ApiPropertyOptional() costPrice?: number;
  @ApiPropertyOptional() taxPercentage?: number;
  @ApiPropertyOptional() discountType?: string;
  @ApiPropertyOptional() discountValue?: number;

  @ApiProperty() trackInventory!: boolean;
  @ApiProperty() allowBackorder!: boolean;
  @ApiProperty() minimumOrderQuantity!: number;
  @ApiProperty() maximumOrderQuantity!: number;

  @ApiPropertyOptional() weight?: number;
  @ApiPropertyOptional() length?: number;
  @ApiPropertyOptional() width?: number;
  @ApiPropertyOptional() height?: number;

  @ApiProperty() isFeatured!: boolean;
  @ApiProperty() isNewArrival!: boolean;
  @ApiProperty() isBestSeller!: boolean;
  @ApiProperty() isPublished!: boolean;
  @ApiPropertyOptional() publishedAt?: Date;
  @ApiProperty() displayOrder!: number;

  @ApiPropertyOptional() seoTitle?: string;
  @ApiPropertyOptional() seoDescription?: string;
  @ApiPropertyOptional() seoKeywords?: string;
  @ApiPropertyOptional() canonicalUrl?: string;
  @ApiPropertyOptional() searchKeywords?: string;

  @ApiPropertyOptional() gender?: string;
  @ApiPropertyOptional() ageGroup?: string;
  @ApiPropertyOptional() occasion?: string;
  @ApiPropertyOptional() season?: string;
  @ApiPropertyOptional({ type: [String] }) tags?: string[];
  @ApiPropertyOptional({ type: [String] }) collections?: string[];

  @ApiPropertyOptional({ type: [ProductCategoryInfo] })
  categories?: ProductCategoryInfo[];
  @ApiPropertyOptional({ type: [ProductAttributeInfo] })
  attributes?: ProductAttributeInfo[];
  @ApiPropertyOptional({ type: [ProductRelatedInfo] })
  relatedProducts?: ProductRelatedInfo[];

  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

// ─── List Response ───────────────────────────────────────

export class ProductListResponse {
  @ApiProperty({ type: [ProductResponse] }) data!: ProductResponse[];
  @ApiProperty() meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// ponytail: tags and collections are native PG String[] on Product; skip ProductTag/ProductCollection tables, add when join-table metadata needed.

// ─── Product Details (aggregate endpoint) ────────────────

export interface BreadcrumbItem {
  label: string;
  slug: string;
  categoryId: string;
}

export interface MediaGroup {
  images: {
    id: string;
    url: string;
    thumbnailUrl?: string;
    altText?: string;
    displayOrder: number;
    isPrimary: boolean;
  }[];
  videos: {
    id: string;
    url: string;
    thumbnailUrl?: string;
    title?: string;
  }[];
  threeSixtyImages: {
    id: string;
    url: string;
  }[];
}

export interface VariantDetails {
  id: string;
  sku: string;
  barcode: string;
  title: string;
  price: number;
  salePrice?: number;
  weight?: number;
  isDefault: boolean;
  isActive: boolean;
  stockStatus: string;
  availableQuantity: number;
  reservedQuantity: number;
  allowBackorder: boolean;
  attributeValues: {
    attributeId: string;
    attributeName: string;
    attributeType: string;
    value?: string;
    optionLabel?: string;
  }[];
  images: {
    url: string;
    thumbnailUrl?: string;
    altText?: string;
    isPrimary: boolean;
  }[];
}

export interface PricingDetails {
  mrp: number;
  salePrice?: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercentage?: number;
  taxAmount: number;
  youSave: number;
  finalPrice: number;
}

export interface InventorySummary {
  totalAvailable: number;
  totalReserved: number;
  inStock: boolean;
  lowStock: boolean;
  outOfStock: boolean;
  allowBackorder: boolean;
  trackInventory: boolean;
  minOrderQty: number;
  maxOrderQty: number;
}

export interface ProductCard {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  salePrice?: number;
  brandName?: string;
  brandId: string;
  primaryImageUrl?: string;
  stockStatus?: string;
  rating?: number;
  reviewCount?: number;
}

export interface ReviewItem {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  customerName?: string;
  customerAvatarUrl?: string;
  images: { url: string; altText?: string }[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<string, number>;
}

export interface OfferDetails {
  id: string;
  name: string;
  description?: string;
  type: string;
  value: number;
  applicableTo?: string;
}

export interface WishlistStatus {
  inWishlist: boolean;
  wishlistItemId: string | null;
}

export interface CartStatus {
  inCart: boolean;
  cartItemId: string | null;
  quantity: number | null;
}

export interface SeoDetails {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
}

export interface ProductDetailsResponse {
  product: ProductResponse;
  brand: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logo?: string;
    banner?: string;
    website?: string;
    brandStory?: string;
  };
  categories: {
    categoryId: string;
    categoryName: string;
    categorySlug: string;
    parentId?: string;
    parentName?: string;
  }[];
  breadcrumbs: BreadcrumbItem[];
  media: MediaGroup;
  variants: VariantDetails[];
  pricing: PricingDetails;
  attributes: {
    attributeId: string;
    attributeName: string;
    attributeType: string;
    value?: string;
  }[];
  inventory: InventorySummary;
  reviews: {
    summary: ReviewSummary;
    items: ReviewItem[];
    totalCount: number;
  };
  offers: OfferDetails[];
  relatedProducts: ProductCard[];
  similarProducts: ProductCard[];
  seo: SeoDetails;
  wishlist: WishlistStatus;
  cart: CartStatus;
  shareUrl: string;
}

export interface DeliveryInfo {
  serviceable: boolean;
  estimatedDays: string | null;
  shippingCharge: number;
  freeShipping: boolean;
  codAvailable: boolean;
  shippingMethod: string | null;
}

export type ProductSummaryResponse = Pick<
  ProductDetailsResponse,
  | 'product'
  | 'pricing'
  | 'inventory'
  | 'reviews'
  | 'wishlist'
  | 'cart'
  | 'shareUrl'
>;
