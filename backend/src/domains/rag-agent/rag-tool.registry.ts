import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { SearchService } from '@domains/search/search.service';
import { ProductsService } from '@domains/products/products.service';

export interface RagToolContext {
  userId?: string;
  guestId?: string;
  isAdmin?: boolean;
}

export interface RagTool {
  name: string;
  description: string;
  execute(context: RagToolContext, input: any): Promise<any>;
}

@Injectable()
export class RagToolRegistry {
  private readonly tools = new Map<string, RagTool>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
    private readonly productsService: ProductsService,
  ) {
    this.registerTools();
  }

  getTool(name: string): RagTool | undefined {
    return this.tools.get(name);
  }

  getAllTools(): RagTool[] {
    return Array.from(this.tools.values());
  }

  private register(tool: RagTool) {
    this.tools.set(tool.name, tool);
  }

  private registerTools() {
    // 1. PRODUCT_SEARCH
    this.register({
      name: 'PRODUCT_SEARCH',
      description:
        'Search catalog products by keywords, categories, and price ranges.',
      execute: async (_ctx, input) => {
        const queryDto: any = {
          q: input.query || '',
          page: 1,
          limit: input.limit || 5,
        };
        if (input.minPrice !== undefined) queryDto.minPrice = input.minPrice;
        if (input.maxPrice !== undefined) queryDto.maxPrice = input.maxPrice;

        const results = await this.searchService.search(queryDto);
        return {
          products: results.data.map((p: any) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            slug: p.slug,
            price: Number(p.basePrice),
            salePrice: p.salePrice ? Number(p.salePrice) : null,
            imageUrl: p.images?.[0]?.url || null,
            isFeatured: p.isFeatured,
          })),
          meta: results.meta,
        };
      },
    });

    // 2. PRODUCT_DETAILS
    this.register({
      name: 'PRODUCT_DETAILS',
      description:
        'Fetch detailed specifications of a specific product by slug or SKU.',
      execute: async (_ctx, input) => {
        let product: any = null;
        if (input.slug) {
          product = await this.prisma.product.findUnique({
            where: { slug: input.slug, deletedAt: null },
            include: {
              media: true,
              brand: true,
              categories: { include: { category: true } },
            },
          });
        } else if (input.sku) {
          product = await this.prisma.product.findUnique({
            where: { sku: input.sku, deletedAt: null },
            include: {
              media: true,
              brand: true,
              categories: { include: { category: true } },
            },
          });
        } else if (input.id) {
          product = await this.productsService.findById(input.id);
        }

        if (!product) {
          return { error: 'Product not found' };
        }

        return {
          id: product.id,
          sku: product.sku,
          barcode: product.barcode,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: Number(product.basePrice),
          salePrice: product.salePrice ? Number(product.salePrice) : null,
          brandName: product.brand?.name || null,
          categoryName: product.categories?.[0]?.category?.name || null,
          images: product.media?.map((img: any) => img.url) || [],
        };
      },
    });

    // 3. PRODUCT_AVAILABILITY
    this.register({
      name: 'PRODUCT_AVAILABILITY',
      description:
        'Check real-time stock levels and variant availability for a product.',
      execute: async (_ctx, input) => {
        const { productId } = input;
        if (!productId) return { error: 'productId is required' };

        const inventory = await this.prisma.inventory.findMany({
          where: {
            variant: {
              productId,
            },
          },
          include: {
            variant: {
              include: {
                attributeValues: {
                  include: {
                    attribute: true,
                    option: true,
                  },
                },
              },
            },
          },
        });

        return inventory.map((inv: any) => ({
          variantId: inv.variantId,
          sku: inv.variant.sku,
          attributes: inv.variant.attributeValues.map((av: any) => ({
            name: av.attribute.name,
            value: av.value || av.option?.value || '',
          })),
          availableQuantity: inv.availableQuantity - inv.reservedQuantity,
          status:
            inv.availableQuantity > inv.reservedQuantity
              ? 'IN_STOCK'
              : 'OUT_OF_STOCK',
        }));
      },
    });

    // 4. ORDER_STATUS
    this.register({
      name: 'ORDER_STATUS',
      description: 'Check active order details and order lifecycle status.',
      execute: async (ctx, input) => {
        const { orderNumber } = input;
        if (!orderNumber) return { error: 'orderNumber is required' };

        // Authorization check: Guest cannot access orders
        if (!ctx.userId && !ctx.isAdmin) {
          throw new UnauthorizedException(
            'Please log in to view order details.',
          );
        }

        const order = await this.prisma.order.findUnique({
          where: { orderNumber },
          include: {
            customer: true,
            items: true,
          },
        });

        if (!order) {
          return { error: 'Order not found' };
        }

        // Ownership check
        if (order.customer?.userId !== ctx.userId && !ctx.isAdmin) {
          throw new UnauthorizedException(
            'You are not authorized to view this order.',
          );
        }

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: Number(order.grandTotal),
          currency: order.currency,
          createdAt: order.createdAt,
          items: order.items.map((item: any) => ({
            productName: item.productName,
            sku: item.sku,
            quantity: item.quantity,
            price: Number(item.price),
          })),
        };
      },
    });

    // 5. ORDER_TRACKING
    this.register({
      name: 'ORDER_TRACKING',
      description:
        'Fetch shipment tracking updates and order status timelines.',
      execute: async (ctx, input) => {
        const { orderNumber } = input;
        if (!orderNumber) return { error: 'orderNumber is required' };

        if (!ctx.userId && !ctx.isAdmin) {
          throw new UnauthorizedException('Please log in to track shipments.');
        }

        const order = await this.prisma.order.findUnique({
          where: { orderNumber },
          include: {
            customer: true,
            timeline: { orderBy: { createdAt: 'desc' } },
          },
        });

        if (!order) {
          return { error: 'Order not found' };
        }

        if (order.customer?.userId !== ctx.userId && !ctx.isAdmin) {
          throw new UnauthorizedException(
            'You are not authorized to track this shipment.',
          );
        }

        return {
          orderNumber: order.orderNumber,
          currentStatus: order.status,
          timeline: order.timeline.map((tl: any) => ({
            status: tl.status,
            message: tl.message,
            timestamp: tl.createdAt,
          })),
        };
      },
    });

    // 6. RETURN_STATUS
    this.register({
      name: 'RETURN_STATUS',
      description: 'Get processing update status of a return request.',
      execute: async (ctx, input) => {
        const { returnNumber, orderNumber } = input;

        if (!ctx.userId && !ctx.isAdmin) {
          throw new UnauthorizedException(
            'Please log in to check return statuses.',
          );
        }

        const where: any = {};
        if (returnNumber) where.returnNumber = returnNumber;
        if (orderNumber) where.order = { orderNumber };

        const returns = await this.prisma.returnRequest.findMany({
          where,
          include: {
            order: {
              include: { customer: true },
            },
            items: true,
          },
        });

        if (returns.length === 0) {
          return { error: 'No return request found' };
        }

        const request = returns[0];

        if (request.order.customer?.userId !== ctx.userId && !ctx.isAdmin) {
          throw new UnauthorizedException(
            'Access denied for this return record.',
          );
        }

        return {
          id: request.id,
          returnNumber: request.returnNumber,
          status: request.status,
          reason: request.reason,
          createdAt: request.createdAt,
          items: request.items.map((item: any) => ({
            productName: item.productName,
            quantity: item.quantity,
          })),
        };
      },
    });

    // 7. REFUND_STATUS
    this.register({
      name: 'REFUND_STATUS',
      description: 'Retrieve Razorpay transaction refund progress details.',
      execute: async (ctx, input) => {
        const { refundNumber, orderNumber } = input;

        if (!ctx.userId && !ctx.isAdmin) {
          throw new UnauthorizedException(
            'Please log in to inspect refund status.',
          );
        }

        const where: any = {};
        if (refundNumber) where.refundNumber = refundNumber;
        if (orderNumber) where.order = { orderNumber };

        const refunds = await this.prisma.refund.findMany({
          where,
          include: {
            order: {
              include: { customer: true },
            },
          },
        });

        if (refunds.length === 0) {
          return { error: 'No refund records found' };
        }

        const refund = refunds[0];

        if (refund.order.customer?.userId !== ctx.userId && !ctx.isAdmin) {
          throw new UnauthorizedException(
            'Access denied for this refund record.',
          );
        }

        return {
          id: refund.id,
          refundNumber: refund.refundNumber,
          status: refund.status,
          amount: Number(refund.amount),
          gatewayReference: refund.transactionId || null,
          processedAt: refund.updatedAt || null,
          createdAt: refund.createdAt,
        };
      },
    });
  }
}
