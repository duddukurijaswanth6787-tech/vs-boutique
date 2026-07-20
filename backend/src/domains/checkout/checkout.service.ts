import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { CartService } from '@domains/cart/cart.service';
import { CouponService } from '@domains/coupon/coupon.service';
import { OrderWorkflowService } from '@domains/order/order-workflow.service';
import { PrismaService } from '@database/prisma.service';
import {
  CheckoutPreviewDto,
  CheckoutItemResponse,
  CheckoutSummaryResponse,
  PlaceOrderDto,
} from './checkout.types';

const SHIPPING_RATES: Record<string, number> = {
  STANDARD: 50,
  EXPRESS: 100,
  SAME_DAY: 200,
};
const SHIPPING_ESTIMATES: Record<string, string> = {
  STANDARD: '5-7 business days',
  EXPRESS: '2-3 business days',
  SAME_DAY: 'Same day delivery',
};

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly cartService: CartService,
    private readonly couponService: CouponService,
    private readonly workflow: OrderWorkflowService,
  ) {}

  private async validateAddress(addressId: string, userId: string) {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (!profile)
      throw new BusinessException('Customer profile not found', 'CHECKOUT_001');
    const address = await this.prisma.customerAddress.findUnique({
      where: { id: addressId },
    });
    if (!address || address.customerId !== profile.id)
      throw new BusinessException('Address not found', 'CHECKOUT_002');
    return { profile, address };
  }

  private calculateShipping(method: string, subtotal: number): number {
    if (method === 'STANDARD' && subtotal >= 500) return 0;
    return SHIPPING_RATES[method] ?? SHIPPING_RATES.STANDARD;
  }

  private async buildItems(cartItems: any[]): Promise<CheckoutItemResponse[]> {
    const productIds = cartItems.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
      select: { id: true, name: true, status: true, taxPercentage: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const items: CheckoutItemResponse[] = [];
    for (const item of cartItems) {
      const product = productMap.get(item.productId);
      if (!product)
        throw new BusinessException('Product not found', 'CHECKOUT_003');
      if (product.status !== 'ACTIVE')
        throw new BusinessException('Product is not available', 'CHECKOUT_004');

      if (item.variantId) {
        const inventory = await this.prisma.inventory.findUnique({
          where: { variantId: item.variantId },
        });
        if (inventory) {
          const available =
            inventory.availableQuantity - inventory.reservedQuantity;
          if (available < item.quantity && !inventory.allowBackorder)
            throw new BusinessException('Insufficient stock', 'CHECKOUT_005');
        }
      }

      const unitPrice = Number(item.unitPrice);
      const totalPrice = unitPrice * item.quantity;
      const taxAmount = totalPrice * (Number(product.taxPercentage ?? 0) / 100);

      items.push({
        productId: item.productId,
        productName: product.name,
        variantId: item.variantId ?? undefined,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        taxAmount: Math.round(taxAmount * 100) / 100,
      });
    }
    return items;
  }

  async preview(
    userId: string,
    dto: CheckoutPreviewDto,
  ): Promise<CheckoutSummaryResponse> {
    await this.validateAddress(dto.addressId, userId);
    const cart = await this.cartService.getCartByUser(userId);
    if (!cart.items || cart.items.length === 0)
      throw new BusinessException('Cart is empty', 'CHECKOUT_006');

    const activeItems = cart.items.filter((i) => !i.savedForLater);
    const items = await this.buildItems(activeItems);
    const method = dto.shippingMethod ?? 'STANDARD';

    const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
    const discountTotal = dto.couponCode
      ? await this.couponService.getDiscount(dto.couponCode, userId, subtotal)
      : 0;
    const taxTotal = items.reduce((sum, i) => sum + i.taxAmount, 0);
    const shippingCharge = this.calculateShipping(method, subtotal);
    const grandTotal = subtotal - discountTotal + taxTotal + shippingCharge;

    return {
      items,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal,
      taxTotal: Math.round(taxTotal * 100) / 100,
      shippingCharge,
      grandTotal: Math.round(grandTotal * 100) / 100,
      estimatedDelivery:
        SHIPPING_ESTIMATES[method] ?? SHIPPING_ESTIMATES.STANDARD,
    };
  }

  async placeOrder(userId: string, dto: PlaceOrderDto) {
    const { profile, address } = await this.validateAddress(
      dto.addressId,
      userId,
    );
    const cart = await this.cartService.getCartByUser(userId);
    if (!cart.items || cart.items.length === 0)
      throw new BusinessException('Cart is empty', 'CHECKOUT_006');

    const activeItems = cart.items.filter((i) => !i.savedForLater);
    const items = await this.buildItems(activeItems);
    const method = dto.shippingMethod ?? 'STANDARD';

    const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
    const discountTotal = dto.couponCode
      ? await this.couponService.getDiscount(dto.couponCode, userId, subtotal)
      : 0;
    const taxTotal = items.reduce((sum, i) => sum + i.taxAmount, 0);
    const shippingCharge = this.calculateShipping(method, subtotal);
    const grandTotal = subtotal - discountTotal + taxTotal + shippingCharge;

    const orderNumber = await this.workflow.generateOrderNumber();

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId: profile.id,
        status: 'PENDING',
        subtotal,
        discountTotal,
        taxTotal,
        shippingCharge,
        grandTotal: Math.round(grandTotal * 100) / 100,
        notes: dto.notes,
        addresses: {
          create: [
            {
              addressType: 'SHIPPING',
              fullName: address.fullName,
              phone: address.phone,
              addressLine1: address.addressLine1,
              addressLine2: address.addressLine2,
              city: address.city,
              state: address.state,
              country: address.country,
              postalCode: address.postalCode,
            },
          ],
        },
        items: {
          create: items.map((i) => ({
            product: { connect: { id: i.productId } },
            ...(i.variantId
              ? { variant: { connect: { id: i.variantId } } }
              : {}),
            productName: i.productName,
            sku: 'SKU',
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
            taxAmount: i.taxAmount,
          })),
        },
      },
      include: { items: true },
    });

    await this.prisma.orderTimeline.create({
      data: {
        orderId: order.id,
        status: 'PENDING',
        message: 'Order placed',
        createdBy: userId,
      },
    });

    await this.workflow.reserveInventory(order.id);
    if (dto.couponCode) {
      await this.couponService.applyCoupon(userId, {
        code: dto.couponCode,
        orderId: order.id,
        orderAmount: subtotal,
      });
    }
    await this.cartService.clearCart(userId, undefined);

    await this.auditService.log({
      action: 'ORDER_CREATED',
      module: 'checkout',
      resource: 'order',
      resourceId: order.id,
      userId,
      newValue: { orderNumber, grandTotal: order.grandTotal },
    });

    return order;
  }
}
