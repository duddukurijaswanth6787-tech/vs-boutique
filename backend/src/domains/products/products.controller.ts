import crypto from 'crypto';
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  Res,
  Header,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiExtraModels,
  ApiUnauthorizedResponse,
  ApiTooManyRequestsResponse,
  ApiInternalServerErrorResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ThrottlerBehindProxyGuard } from '@common/security/throttler-behind-proxy.guard';
import {
  ProductDetailsResponseDto,
  BrandDto,
  CategoryWithParentDto,
  BreadcrumbDto,
  MediaGroupDto,
  MediaImageDto,
  MediaVideoDto,
  ThreeSixtyImageDto,
  VariantDetailsDto,
  VariantAttributeValueDto,
  VariantImageDto,
  PricingDto,
  AttributeInfoDto,
  InventorySummaryDto,
  ReviewSummaryDto,
  ReviewItemDto,
  ReviewImageDto,
  ReviewsContainerDto,
  OfferDetailsDto,
  ProductCardDto,
  SeoDetailsDto,
  WishlistStatusDto,
  CartStatusDto,
  DeliveryInfoDto,
} from './dtos/product-details-response.dto';
import { ProductsService } from './products.service';
import { SanitizeFieldsPipe } from '@common/validation/pipes.validation';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  AssignCategoriesDto,
  AssignAttributesDto,
  AssignTagsDto,
  AssignCollectionsDto,
  AssignRelatedProductsDto,
} from './products.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import {
  JwtService,
  type JwtPayload,
} from '@domains/auth/services/jwt.service';
import { BulkActionDto } from '@common/dto/bulk.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly jwtService: JwtService,
  ) {}

  // ─── Public ────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Aggregated product counts for admin stat cards' })
  async getStats() {
    return ResponseBuilder.success(await this.productsService.getStats());
  }

  @Get()
  @ApiOperation({
    summary: 'List products with search, pagination, filtering, sorting',
  })
  async findAll(@Query() query: ProductQueryDto) {
    return ResponseBuilder.success(await this.productsService.findAll(query));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  async findById(@Param('id') id: string) {
    return ResponseBuilder.success(await this.productsService.findById(id));
  }

  // ponytail: cached product details — Redis for product data, wishlist/cart/delivery always fresh
  @Get(':id/details')
  @UseGuards(ThrottlerBehindProxyGuard)
  @Header('Cache-Control', 'private, max-age=60')
  @ApiExtraModels(
    ProductDetailsResponseDto,
    BrandDto,
    CategoryWithParentDto,
    BreadcrumbDto,
    MediaGroupDto,
    MediaImageDto,
    MediaVideoDto,
    ThreeSixtyImageDto,
    VariantDetailsDto,
    VariantAttributeValueDto,
    VariantImageDto,
    PricingDto,
    AttributeInfoDto,
    InventorySummaryDto,
    ReviewSummaryDto,
    ReviewItemDto,
    ReviewImageDto,
    ReviewsContainerDto,
    OfferDetailsDto,
    ProductCardDto,
    SeoDetailsDto,
    WishlistStatusDto,
    CartStatusDto,
    DeliveryInfoDto,
  )
  @ApiOperation({
    summary:
      'Enterprise product details — brand, media, variants, inventory, reviews, offers, related, similar, wishlist, cart, SEO, delivery, summary mode',
    description:
      'Returns the full product details aggregate for a product ID. Supports authentication (Bearer JWT) for personalized wishlist/cart status, guest mode via ?guestId, summary mode via ?summary=true for lightweight mobile responses, and pincode-based delivery availability via ?pincode=xxxxxx. Responses are cached in Redis for 60 seconds (ETag-based 304 caching also supported).',
  })
  @ApiOkResponse({
    description:
      'Full product details. Wrapped in ResponseBuilder envelope with success/statusCode/message/data/meta. The data field contains the ProductDetailsResponseDto schema shown below. When ?summary=true, only product, pricing, inventory, reviews, wishlist, cart, and shareUrl fields are returned.',
    schema: {
      allOf: [{ $ref: getSchemaPath(ProductDetailsResponseDto) }],
    },
    examples: {
      'Full Response': {
        summary: 'Complete product details with all nested data',
        value: {
          success: true,
          statusCode: 200,
          message: 'Product details retrieved successfully',
          data: {
            product: {
              id: 'prod-1',
              name: 'Silk Saree',
              slug: 'silk-saree',
              basePrice: 2999,
              salePrice: 2499,
              brandId: 'brand-1',
              brandName: 'Vasanthi Silks',
              type: 'PHYSICAL',
              status: 'ACTIVE',
              visibility: 'PUBLIC',
              trackInventory: true,
              allowBackorder: false,
              minimumOrderQuantity: 1,
              maximumOrderQuantity: 10,
              isFeatured: true,
              isNewArrival: false,
              isBestSeller: true,
              isPublished: true,
              displayOrder: 1,
              createdAt: '2026-01-15T00:00:00.000Z',
              updatedAt: '2026-06-20T00:00:00.000Z',
            },
            brand: {
              id: 'brand-1',
              name: 'Vasanthi Silks',
              slug: 'vasanthi-silks',
              description: 'Premium silk products',
              logo: 'https://cdn.example.com/brands/logo.png',
            },
            categories: [
              {
                categoryId: 'cat-1',
                categoryName: 'Sarees',
                categorySlug: 'sarees',
              },
            ],
            breadcrumbs: [
              { label: 'Home', slug: '/', categoryId: 'root' },
              { label: 'Sarees', slug: 'sarees', categoryId: 'cat-1' },
            ],
            media: {
              images: [
                {
                  id: 'img-1',
                  url: 'https://cdn.example.com/products/saree.jpg',
                  thumbnailUrl:
                    'https://cdn.example.com/products/saree-thumb.jpg',
                  altText: 'Silk Saree',
                  displayOrder: 1,
                  isPrimary: true,
                },
              ],
              videos: [],
              threeSixtyImages: [],
            },
            variants: [
              {
                id: 'var-1',
                sku: 'SS-RED-M',
                barcode: '8901234567890',
                title: 'Red Silk Saree - Medium',
                price: 2499,
                isDefault: true,
                isActive: true,
                stockStatus: 'IN_STOCK',
                availableQuantity: 50,
                reservedQuantity: 5,
                allowBackorder: false,
                attributeValues: [
                  {
                    attributeId: 'attr-1',
                    attributeName: 'Color',
                    attributeType: 'SELECT',
                    value: 'Red',
                  },
                ],
                images: [
                  {
                    url: 'https://cdn.example.com/variants/red.jpg',
                    isPrimary: true,
                  },
                ],
              },
            ],
            pricing: {
              mrp: 2999,
              salePrice: 2499,
              discountPercent: 17,
              discountAmount: 500,
              taxPercentage: 5,
              taxAmount: 125,
              youSave: 500,
              finalPrice: 2624,
            },
            attributes: [
              {
                attributeId: 'attr-1',
                attributeName: 'Color',
                attributeType: 'SELECT',
                value: 'Red',
              },
            ],
            inventory: {
              totalAvailable: 50,
              totalReserved: 5,
              inStock: true,
              lowStock: false,
              outOfStock: false,
              allowBackorder: false,
              trackInventory: true,
              minOrderQty: 1,
              maxOrderQty: 10,
            },
            reviews: {
              summary: {
                averageRating: 4.5,
                totalReviews: 128,
                ratingDistribution: {
                  '1': 5,
                  '2': 3,
                  '3': 10,
                  '4': 30,
                  '5': 80,
                },
              },
              items: [
                {
                  id: 'rev-1',
                  rating: 5,
                  title: 'Beautiful saree',
                  comment: 'Loved the quality and color',
                  customerName: 'Priya S.',
                  isVerifiedPurchase: true,
                  helpfulCount: 12,
                  images: [],
                  createdAt: '2026-06-15T00:00:00.000Z',
                },
              ],
              totalCount: 128,
            },
            offers: [
              {
                id: 'offer-1',
                name: 'Bank Offer',
                description: '10% off on HDFC cards',
                type: 'BANK_DISCOUNT',
                value: 10,
              },
            ],
            relatedProducts: [
              {
                id: 'prod-2',
                name: 'Cotton Saree',
                slug: 'cotton-saree',
                basePrice: 1499,
                salePrice: 1299,
                brandId: 'brand-1',
                brandName: 'Vasanthi Silks',
                primaryImageUrl: 'https://cdn.example.com/products/cotton.jpg',
                rating: 4.2,
                reviewCount: 56,
              },
            ],
            similarProducts: [],
            seo: {
              title: 'Buy Silk Saree Online',
              description: 'Premium quality silk saree',
              keywords: 'silk, saree, traditional',
            },
            wishlist: { inWishlist: false, wishlistItemId: null },
            cart: { inCart: false, cartItemId: null, quantity: null },
            shareUrl: 'https://vasanthi.com/products/silk-saree',
          },
        },
      },
      'Summary Response': {
        summary: 'Lightweight summary for mobile when ?summary=true',
        value: {
          success: true,
          statusCode: 200,
          message: 'Product details retrieved successfully',
          data: {
            product: {
              id: 'prod-1',
              name: 'Silk Saree',
              slug: 'silk-saree',
              basePrice: 2999,
              salePrice: 2499,
              brandId: 'brand-1',
              brandName: 'Vasanthi Silks',
              type: 'PHYSICAL',
              status: 'ACTIVE',
              visibility: 'PUBLIC',
              trackInventory: true,
              allowBackorder: false,
              minimumOrderQuantity: 1,
              maximumOrderQuantity: 10,
              isFeatured: true,
              isNewArrival: false,
              isBestSeller: true,
              isPublished: true,
              displayOrder: 1,
              createdAt: '2026-01-15T00:00:00.000Z',
              updatedAt: '2026-06-20T00:00:00.000Z',
            },
            pricing: {
              mrp: 2999,
              salePrice: 2499,
              discountPercent: 17,
              discountAmount: 500,
              taxPercentage: 5,
              taxAmount: 125,
              youSave: 500,
              finalPrice: 2624,
            },
            inventory: {
              totalAvailable: 50,
              totalReserved: 5,
              inStock: true,
              lowStock: false,
              outOfStock: false,
              allowBackorder: false,
              trackInventory: true,
              minOrderQty: 1,
              maxOrderQty: 10,
            },
            reviews: {
              summary: {
                averageRating: 4.5,
                totalReviews: 128,
                ratingDistribution: {
                  '1': 5,
                  '2': 3,
                  '3': 10,
                  '4': 30,
                  '5': 80,
                },
              },
              items: [],
              totalCount: 128,
            },
            wishlist: { inWishlist: false, wishlistItemId: null },
            cart: { inCart: false, cartItemId: null, quantity: null },
            shareUrl: 'https://vasanthi.com/products/silk-saree',
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded. Try again later.',
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiQuery({
    name: 'pincode',
    required: false,
    description:
      'Check delivery availability for pincode (6-digit Indian pincode)',
    example: '560001',
  })
  @ApiQuery({
    name: 'summary',
    required: false,
    description:
      'Return lightweight response for mobile (only product, pricing, inventory, reviews, wishlist, cart, shareUrl)',
    example: 'true',
  })
  @ApiQuery({
    name: 'guestId',
    required: false,
    description:
      'Guest session ID for cart status (used when user is not authenticated)',
    example: 'guest-session-abc-123',
  })
  async getProductDetails(
    @Param('id') id: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Query('pincode') pincode?: string,
    @Query('summary') summary?: string,
  ) {
    const authHeader = req.headers['authorization'];
    let userId: string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const payload = this.jwtService.verify(authHeader.slice(7));
        userId = payload.sub;
      } catch {
        // ponytail: ignore invalid token
      }
    }
    const guestId = !userId
      ? ((req.query['guestId'] as string) ?? undefined)
      : undefined;

    const data = await this.productsService.getDetails(
      id,
      userId,
      guestId,
      pincode,
      summary === 'true',
    );

    const body = ResponseBuilder.success(data);
    const json = JSON.stringify(body);
    const etag = crypto.createHash('md5').update(json).digest('hex');
    res.setHeader('ETag', `"${etag}"`);

    if (req.headers['if-none-match'] === `"${etag}"`) {
      res.status(304);
      return;
    }

    return body;
  }

  // ─── Admin: CRUD ───────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  async create(
    @Body(new SanitizeFieldsPipe(['description'])) dto: CreateProductDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.productsService.create(dto, user.sub),
      'Product created',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  async update(
    @Param('id') id: string,
    @Body(new SanitizeFieldsPipe(['description'])) dto: UpdateProductDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.productsService.update(id, dto, user.sub),
      'Product updated',
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a product' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.productsService.delete(id, user.sub);
    return ResponseBuilder.deleted('Product deleted');
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a soft-deleted product' })
  async restore(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.productsService.restore(id, user.sub),
      'Product restored',
    );
  }

  // ─── Admin: Publish ────────────────────────────────────

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a product' })
  async publish(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.productsService.publish(id, user.sub),
      'Product published',
    );
  }

  @Post(':id/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unpublish a product' })
  async unpublish(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.productsService.unpublish(id, user.sub),
      'Product unpublished',
    );
  }

  // ─── Admin: Feature ────────────────────────────────────

  @Post(':id/feature')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Feature a product' })
  async feature(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.productsService.feature(id, user.sub),
      'Product featured',
    );
  }

  @Post(':id/unfeature')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfeature a product' })
  async unfeature(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.productsService.unfeature(id, user.sub),
      'Product unfeatured',
    );
  }

  // ─── Admin: Categories ─────────────────────────────────

  @Post(':id/categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign categories to product' })
  async assignCategories(
    @Param('id') id: string,
    @Body() dto: AssignCategoriesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.productsService.assignCategories(id, dto, user.sub),
      'Categories assigned',
    );
  }

  @Delete(':id/categories/:categoryId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove category from product' })
  async removeCategory(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
  ) {
    return ResponseBuilder.success(
      await this.productsService.removeCategory(id, categoryId),
      'Category removed',
    );
  }

  // ─── Admin: Attributes ─────────────────────────────────

  @Post(':id/attributes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign attributes to product' })
  async assignAttributes(
    @Param('id') id: string,
    @Body() dto: AssignAttributesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.productsService.assignAttributes(id, dto, user.sub),
      'Attributes assigned',
    );
  }

  @Delete(':id/attributes/:attributeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove attribute from product' })
  async removeAttribute(
    @Param('id') id: string,
    @Param('attributeId') attributeId: string,
  ) {
    return ResponseBuilder.success(
      await this.productsService.removeAttribute(id, attributeId),
      'Attribute removed',
    );
  }

  // ─── Admin: Tags ───────────────────────────────────────

  @Post(':id/tags')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign tags to product' })
  async assignTags(
    @Param('id') id: string,
    @Body() dto: AssignTagsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.productsService.assignTags(id, dto, user.sub),
      'Tags assigned',
    );
  }

  @Delete(':id/tags/:tag')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove tag from product' })
  async removeTag(
    @Param('id') id: string,
    @Param('tag') tag: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.productsService.removeTag(id, tag, user.sub),
      'Tag removed',
    );
  }

  // ─── Admin: Collections ────────────────────────────────

  @Post(':id/collections')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign collections to product' })
  async assignCollections(
    @Param('id') id: string,
    @Body() dto: AssignCollectionsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.productsService.assignCollections(id, dto, user.sub),
      'Collections assigned',
    );
  }

  @Delete(':id/collections/:collection')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove collection from product' })
  async removeCollection(
    @Param('id') id: string,
    @Param('collection') collection: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.productsService.removeCollection(id, collection, user.sub),
      'Collection removed',
    );
  }

  // ─── Admin: Related Products ───────────────────────────

  @Post(':id/related')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign related products' })
  async assignRelatedProducts(
    @Param('id') id: string,
    @Body() dto: AssignRelatedProductsDto,
  ) {
    return ResponseBuilder.success(
      await this.productsService.assignRelatedProducts(id, dto),
      'Related products assigned',
    );
  }

  @Delete(':id/related/:relatedProductId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove related product' })
  async removeRelatedProduct(
    @Param('id') id: string,
    @Param('relatedProductId') relatedProductId: string,
  ) {
    return ResponseBuilder.success(
      await this.productsService.removeRelatedProduct(id, relatedProductId),
      'Related product removed',
    );
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Bulk action on products (delete/restore/publish/unpublish/feature/unfeature)',
  })
  async bulk(@Body() dto: BulkActionDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.productsService.bulk(dto, user.sub),
    );
  }

  @Post(':id/clone')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clone/duplicate a product' })
  async clone(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.created(
      await this.productsService.clone(id, user.sub),
      'Product cloned',
    );
  }
}
