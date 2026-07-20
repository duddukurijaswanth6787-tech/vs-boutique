import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveByCustomerId(customerId: string) {
    return this.prisma.shoppingCart.findFirst({
      where: { customerId, status: 'ACTIVE' },
      include: {
        items: {
          where: { savedForLater: false },
          include: {
            product: {
              select: { name: true, basePrice: true, salePrice: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async findActiveByGuestId(guestId: string) {
    return this.prisma.shoppingCart.findFirst({
      where: { guestId, status: 'ACTIVE' },
      include: {
        items: {
          where: { savedForLater: false },
          include: {
            product: {
              select: { name: true, basePrice: true, salePrice: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async create(data: Prisma.ShoppingCartCreateInput) {
    return this.prisma.shoppingCart.create({ data });
  }

  async findItem(cartId: string, productId: string, variantId?: string) {
    const where: any = { cartId, productId };
    if (variantId) where.variantId = variantId;
    else where.variantId = null;
    return this.prisma.shoppingCartItem.findFirst({ where });
  }

  async findItemById(itemId: string) {
    return this.prisma.shoppingCartItem.findUnique({ where: { id: itemId } });
  }

  async addItem(data: Prisma.ShoppingCartItemCreateInput) {
    return this.prisma.shoppingCartItem.create({
      data,
      include: {
        product: { select: { name: true, basePrice: true, salePrice: true } },
      },
    });
  }

  async updateItemQuantity(
    itemId: string,
    quantity: number,
    unitPrice: number,
    totalPrice: number,
  ) {
    return this.prisma.shoppingCartItem.update({
      where: { id: itemId },
      data: { quantity, unitPrice, totalPrice },
      include: {
        product: { select: { name: true, basePrice: true, salePrice: true } },
      },
    });
  }

  async removeItem(itemId: string) {
    return this.prisma.shoppingCartItem.delete({ where: { id: itemId } });
  }

  async getItems(cartId: string) {
    return this.prisma.shoppingCartItem.findMany({
      where: { cartId },
      include: {
        product: { select: { name: true, basePrice: true, salePrice: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async clearCart(cartId: string) {
    return this.prisma.shoppingCartItem.deleteMany({
      where: { cartId, savedForLater: false },
    });
  }

  async clearSavedForLater(cartId: string) {
    return this.prisma.shoppingCartItem.deleteMany({
      where: { cartId, savedForLater: true },
    });
  }

  async updateCartStatus(cartId: string, status: string) {
    return this.prisma.shoppingCart.update({
      where: { id: cartId },
      data: { status },
    });
  }

  async updateItemSavedForLater(itemId: string, savedForLater: boolean) {
    return this.prisma.shoppingCartItem.update({
      where: { id: itemId },
      data: { savedForLater },
      include: {
        product: { select: { name: true, basePrice: true, salePrice: true } },
      },
    });
  }
}
