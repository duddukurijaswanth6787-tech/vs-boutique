import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { WishlistRepository } from './wishlist.repository';
import {
  AddToWishlistDto,
  WishlistQueryDto,
  WishlistItemResponse,
  WishlistResponse,
} from './wishlist.types';

@Injectable()
export class WishlistService {
  constructor(
    private readonly wishlistRepository: WishlistRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private async getCustomerProfile(userId: string) {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (!profile)
      throw new BusinessException('Customer profile not found', 'CUSTOMER_001');
    return profile;
  }

  private async getOrCreateWishlist(customerId: string) {
    const existing = await this.wishlistRepository.findByCustomerId(customerId);
    if (existing) return existing;
    return this.wishlistRepository.createDefault(customerId);
  }

  private toWishlistResponse(w: any): WishlistResponse {
    return {
      id: w.id,
      customerId: w.customerId,
      name: w.name,
      itemCount: w._count?.items ?? 0,
      createdAt: w.createdAt,
    };
  }

  private toItemResponse(item: any): WishlistItemResponse {
    return {
      id: item.id,
      wishlistId: item.wishlistId,
      productId: item.productId,
      productName: item.product?.name,
      variantId: item.variantId ?? undefined,
      notes: item.notes ?? undefined,
      createdAt: item.createdAt,
    };
  }

  async getWishlist(userId: string): Promise<WishlistResponse> {
    const profile = await this.getCustomerProfile(userId);
    const wishlist = await this.getOrCreateWishlist(profile.id);
    return this.toWishlistResponse(wishlist);
  }

  async getItems(userId: string, query: WishlistQueryDto) {
    const profile = await this.getCustomerProfile(userId);
    const wishlist = await this.getOrCreateWishlist(profile.id);
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.wishlistRepository.findItems(wishlist.id, {
      search: query.search,
      page,
      limit,
    });
    return {
      data: result.data.map((item: any) => this.toItemResponse(item)),
      meta: result.meta,
    };
  }

  async addItem(
    userId: string,
    dto: AddToWishlistDto,
  ): Promise<WishlistItemResponse> {
    const profile = await this.getCustomerProfile(userId);
    const wishlist = await this.getOrCreateWishlist(profile.id);

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product || product.deletedAt)
      throw new BusinessException('Product not found', 'PRODUCT_001');

    const existing = await this.wishlistRepository.findItem(
      wishlist.id,
      dto.productId,
    );
    if (existing)
      throw new BusinessException(
        'Product already in wishlist',
        'WISHLIST_001',
      );

    const item = await this.wishlistRepository.addItem({
      wishlistId: wishlist.id,
      productId: dto.productId,
      variantId: dto.variantId,
      notes: dto.notes,
    });

    await this.auditService.log({
      action: 'PRODUCT_ADDED_TO_WISHLIST',
      module: 'wishlist',
      resource: 'wishlist_item',
      resourceId: item.id,
      userId,
      newValue: { productId: dto.productId },
    });

    return this.toItemResponse(item);
  }

  async removeItem(userId: string, productId: string): Promise<void> {
    const profile = await this.getCustomerProfile(userId);
    const wishlist = await this.getOrCreateWishlist(profile.id);

    const existing = await this.wishlistRepository.findItem(
      wishlist.id,
      productId,
    );
    if (!existing)
      throw new BusinessException('Item not in wishlist', 'WISHLIST_002');

    await this.wishlistRepository.removeItem(wishlist.id, productId);

    await this.auditService.log({
      action: 'PRODUCT_REMOVED_FROM_WISHLIST',
      module: 'wishlist',
      resource: 'wishlist_item',
      resourceId: existing.id,
      userId,
      oldValue: { productId },
    });
  }

  async moveToCart(userId: string, productId: string): Promise<void> {
    const profile = await this.getCustomerProfile(userId);
    const wishlist = await this.getOrCreateWishlist(profile.id);

    const wishlistItem = await this.prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
      include: {
        product: true,
      },
    });

    if (!wishlistItem) {
      throw new BusinessException('Item not in wishlist', 'WISHLIST_002');
    }

    let cart = await this.prisma.shoppingCart.findFirst({
      where: { customerId: profile.id, status: 'ACTIVE' },
    });
    if (!cart) {
      cart = await this.prisma.shoppingCart.create({
        data: { customerId: profile.id, status: 'ACTIVE' },
      });
    }

    const unitPrice =
      wishlistItem.product.salePrice ?? wishlistItem.product.basePrice;
    const totalPrice = Number(unitPrice);

    await this.prisma.$transaction(async (tx) => {
      const existingCartItem = await tx.shoppingCartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
          variantId: wishlistItem.variantId,
        },
      });

      if (existingCartItem) {
        const newQty = existingCartItem.quantity + 1;
        await tx.shoppingCartItem.update({
          where: { id: existingCartItem.id },
          data: {
            quantity: newQty,
            totalPrice: Number(existingCartItem.unitPrice) * newQty,
          },
        });
      } else {
        await tx.shoppingCartItem.create({
          data: {
            cartId: cart.id,
            productId,
            variantId: wishlistItem.variantId,
            quantity: 1,
            unitPrice,
            totalPrice,
          },
        });
      }

      await tx.wishlistItem.delete({
        where: { id: wishlistItem.id },
      });
    });

    await this.auditService.log({
      action: 'WISHLIST_ITEM_MOVED_TO_CART',
      module: 'wishlist',
      resource: 'wishlist_item',
      resourceId: wishlistItem.id,
      userId,
      newValue: { productId, cartId: cart.id },
    });
  }

  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const profile = await this.getCustomerProfile(userId);
    const wishlist = await this.getOrCreateWishlist(profile.id);
    const item = await this.wishlistRepository.findItem(wishlist.id, productId);
    return !!item;
  }

  async getCount(userId: string): Promise<number> {
    const profile = await this.getCustomerProfile(userId);
    const wishlist = await this.getOrCreateWishlist(profile.id);
    return this.wishlistRepository.getItemCount(wishlist.id);
  }

  async getItemsByCustomerIdAdmin(customerId: string) {
    const wishlist = await this.getOrCreateWishlist(customerId);
    const result = await this.wishlistRepository.findItems(wishlist.id, {
      page: 1,
      limit: 100,
    });
    return {
      data: result.data.map((item: any) => this.toItemResponse(item)),
      meta: result.meta,
    };
  }
}
