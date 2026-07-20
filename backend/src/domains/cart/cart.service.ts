import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { CartRepository } from './cart.repository';
import { PrismaService } from '@database/prisma.service';
import {
  AddToCartDto,
  UpdateQuantityDto,
  CartItemResponse,
  CartResponse,
  CartSummaryResponse,
} from './cart.types';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  private toCartItemResponse(item: any): CartItemResponse {
    return {
      id: item.id,
      cartId: item.cartId,
      productId: item.productId,
      productName: item.product?.name,
      variantId: item.variantId ?? undefined,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      savedForLater: item.savedForLater,
      createdAt: item.createdAt,
    };
  }

  private toCartResponse(cart: any, items?: any[]): CartResponse {
    const cartItems = items ?? cart.items ?? [];
    const activeItems = cartItems.filter((i: any) => !i.savedForLater);
    const subtotal = activeItems.reduce(
      (sum: number, i: any) => sum + Number(i.totalPrice),
      0,
    );
    const mrpTotal = activeItems.reduce(
      (sum: number, i: any) =>
        sum + Number(i.product?.basePrice ?? i.unitPrice) * i.quantity,
      0,
    );
    return {
      id: cart.id,
      customerId: cart.customerId ?? undefined,
      guestId: cart.guestId ?? undefined,
      status: cart.status,
      items: cartItems.map((i: any) => this.toCartItemResponse(i)),
      itemCount: activeItems.reduce(
        (sum: number, i: any) => sum + i.quantity,
        0,
      ),
      subtotal,
      totalSavings: mrpTotal - subtotal,
      createdAt: cart.createdAt,
    };
  }

  private async getOrCreateCart(userId?: string, guestId?: string) {
    if (userId) {
      const profile = await this.prisma.customerProfile.findUnique({
        where: { userId },
      });
      if (!profile)
        throw new BusinessException('Customer profile not found', 'CART_001');
      const existing = await this.cartRepository.findActiveByCustomerId(
        profile.id,
      );
      if (existing) return existing;
      return this.cartRepository.create({
        customer: { connect: { id: profile.id } },
      });
    }
    if (guestId) {
      const existing = await this.cartRepository.findActiveByGuestId(guestId);
      if (existing) return existing;
      return this.cartRepository.create({ guestId });
    }
    throw new BusinessException(
      'Either userId or guestId is required',
      'CART_002',
    );
  }

  private async validateProduct(productId: string, variantId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: { where: { isDefault: true, deletedAt: null }, take: 1 },
      },
    });
    if (!product || product.deletedAt)
      throw new BusinessException('Product not found', 'CART_003');
    if (product.status !== 'ACTIVE')
      throw new BusinessException('Product is not available', 'CART_004');

    const resolvedVariantId = variantId ?? product.variants[0]?.id;
    if (resolvedVariantId) {
      const inventory = await this.prisma.inventory.findUnique({
        where: { variantId: resolvedVariantId },
      });
      if (inventory) {
        const available =
          inventory.availableQuantity - inventory.reservedQuantity;
        if (available <= 0 && !inventory.allowBackorder)
          throw new BusinessException('Product is out of stock', 'CART_005');
      }
    }

    const unitPrice = product.salePrice ?? product.basePrice;
    return { product, unitPrice: Number(unitPrice), resolvedVariantId };
  }

  async getCart(userId?: string, guestId?: string): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId, guestId);
    const items = await this.cartRepository.getItems(cart.id);
    return this.toCartResponse(cart, items);
  }

  async getCartByUser(userId: string): Promise<CartResponse> {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (!profile)
      throw new BusinessException('Customer profile not found', 'CART_001');
    const cart = await this.cartRepository.findActiveByCustomerId(profile.id);
    if (!cart)
      return {
        id: '',
        status: 'ACTIVE',
        items: [],
        itemCount: 0,
        subtotal: 0,
        totalSavings: 0,
        createdAt: new Date(),
      };
    const items = await this.cartRepository.getItems(cart.id);
    return this.toCartResponse(cart, items);
  }

  async getCartByGuest(guestId: string): Promise<CartResponse> {
    const cart = await this.cartRepository.findActiveByGuestId(guestId);
    if (!cart)
      return {
        id: '',
        status: 'ACTIVE',
        items: [],
        itemCount: 0,
        subtotal: 0,
        totalSavings: 0,
        createdAt: new Date(),
      };
    const items = await this.cartRepository.getItems(cart.id);
    return this.toCartResponse(cart, items);
  }

  async addItem(
    userId: string | undefined,
    guestId: string | undefined,
    dto: AddToCartDto,
  ): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId, guestId);
    const { unitPrice, resolvedVariantId } = await this.validateProduct(
      dto.productId,
      dto.variantId,
    );

    const quantity = dto.quantity ?? 1;
    const existing = await this.cartRepository.findItem(
      cart.id,
      dto.productId,
      resolvedVariantId ?? undefined,
    );

    if (existing) {
      const newQty = existing.quantity + quantity;
      await this.cartRepository.updateItemQuantity(
        existing.id,
        newQty,
        unitPrice,
        unitPrice * newQty,
      );
    } else {
      await this.cartRepository.addItem({
        cart: { connect: { id: cart.id } },
        product: { connect: { id: dto.productId } },
        ...(resolvedVariantId
          ? { variant: { connect: { id: resolvedVariantId } } }
          : {}),
        quantity,
        unitPrice,
        totalPrice: unitPrice * quantity,
      });
    }

    await this.auditService.log({
      action: 'PRODUCT_ADDED_TO_CART',
      module: 'cart',
      resource: 'cart',
      resourceId: cart.id,
      userId,
      newValue: { productId: dto.productId, quantity },
    });

    return this.getCart(userId, guestId);
  }

  async updateQuantity(
    userId: string | undefined,
    guestId: string | undefined,
    itemId: string,
    dto: UpdateQuantityDto,
  ): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId, guestId);
    const item = await this.cartRepository.findItemById(itemId);
    if (!item || item.cartId !== cart.id)
      throw new BusinessException('Cart item not found', 'CART_006');

    await this.cartRepository.updateItemQuantity(
      itemId,
      dto.quantity,
      Number(item.unitPrice),
      Number(item.unitPrice) * dto.quantity,
    );

    await this.auditService.log({
      action: 'CART_UPDATED',
      module: 'cart',
      resource: 'cart',
      resourceId: cart.id,
      userId,
      newValue: { itemId, quantity: dto.quantity },
    });

    return this.getCart(userId, guestId);
  }

  async removeItem(
    userId: string | undefined,
    guestId: string | undefined,
    itemId: string,
  ): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId, guestId);
    const item = await this.cartRepository.findItemById(itemId);
    if (!item || item.cartId !== cart.id)
      throw new BusinessException('Cart item not found', 'CART_006');

    await this.cartRepository.removeItem(itemId);

    await this.auditService.log({
      action: 'PRODUCT_REMOVED_FROM_CART',
      module: 'cart',
      resource: 'cart',
      resourceId: cart.id,
      userId,
      oldValue: { productId: item.productId, quantity: item.quantity },
    });

    return this.getCart(userId, guestId);
  }

  async clearCart(
    userId: string | undefined,
    guestId: string | undefined,
  ): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId, guestId);
    await this.cartRepository.clearCart(cart.id);

    await this.auditService.log({
      action: 'CART_CLEARED',
      module: 'cart',
      resource: 'cart',
      resourceId: cart.id,
      userId,
    });

    return this.getCart(userId, guestId);
  }

  async saveForLater(
    userId: string | undefined,
    guestId: string | undefined,
    itemId: string,
  ): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId, guestId);
    const item = await this.cartRepository.findItemById(itemId);
    if (!item || item.cartId !== cart.id)
      throw new BusinessException('Cart item not found', 'CART_006');

    await this.cartRepository.updateItemSavedForLater(itemId, true);
    return this.getCart(userId, guestId);
  }

  async moveToCart(
    userId: string | undefined,
    guestId: string | undefined,
    itemId: string,
  ): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId, guestId);
    const item = await this.cartRepository.findItemById(itemId);
    if (!item || item.cartId !== cart.id)
      throw new BusinessException('Cart item not found', 'CART_006');

    await this.cartRepository.updateItemSavedForLater(itemId, false);
    return this.getCart(userId, guestId);
  }

  async mergeGuestCart(userId: string, guestId: string): Promise<CartResponse> {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (!profile)
      throw new BusinessException('Customer profile not found', 'CART_001');

    const guestCart = await this.cartRepository.findActiveByGuestId(guestId);
    if (!guestCart)
      throw new BusinessException('Guest cart not found', 'CART_007');

    const customerCart = await this.getOrCreateCart(userId);

    const guestItems = await this.cartRepository.getItems(guestCart.id);
    for (const item of guestItems) {
      const existing = await this.cartRepository.findItem(
        customerCart.id,
        item.productId,
        item.variantId ?? undefined,
      );
      if (existing) {
        const newQty = existing.quantity + item.quantity;
        await this.cartRepository.updateItemQuantity(
          existing.id,
          newQty,
          Number(item.unitPrice),
          Number(item.unitPrice) * newQty,
        );
      } else {
        await this.cartRepository.addItem({
          cart: { connect: { id: customerCart.id } },
          product: { connect: { id: item.productId } },
          ...(item.variantId
            ? { variant: { connect: { id: item.variantId } } }
            : {}),
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        });
      }
    }

    await this.cartRepository.updateCartStatus(guestCart.id, 'MERGED');

    await this.auditService.log({
      action: 'CART_MERGED',
      module: 'cart',
      resource: 'cart',
      resourceId: customerCart.id,
      userId,
      oldValue: { guestCartId: guestCart.id },
    });

    return this.getCart(userId);
  }

  async getCartSummary(
    userId?: string,
    guestId?: string,
  ): Promise<CartSummaryResponse> {
    const cart = await this.getOrCreateCart(userId, guestId);
    const items = await this.cartRepository.getItems(cart.id);
    const activeItems = items.filter((i: any) => !i.savedForLater);

    let mrpTotal = 0;
    let saleTotal = 0;

    for (const item of activeItems) {
      const base = Number(item.product?.basePrice ?? item.unitPrice);
      const sale = Number(item.product?.salePrice ?? item.unitPrice);
      mrpTotal += base * item.quantity;
      saleTotal += sale * item.quantity;
    }

    const subtotal = activeItems.reduce(
      (sum: number, i: any) => sum + Number(i.totalPrice),
      0,
    );

    return {
      itemCount: activeItems.reduce(
        (sum: number, i: any) => sum + i.quantity,
        0,
      ),
      subtotal,
      totalSavings: mrpTotal - subtotal,
      mrpTotal,
      saleTotal,
      discountTotal: mrpTotal - saleTotal,
    };
  }

  async getCartByCustomerIdAdmin(customerId: string) {
    const existing =
      await this.cartRepository.findActiveByCustomerId(customerId);
    const cart =
      existing ||
      (await this.cartRepository.create({
        customer: { connect: { id: customerId } },
      }));
    return this.toCartResponse(cart);
  }
}
