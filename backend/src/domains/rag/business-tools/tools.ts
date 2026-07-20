import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ProductsService } from '@domains/products/products.service';
import { CategoriesService } from '@domains/categories/categories.service';
import { InventoryService } from '@domains/inventory/inventory.service';
import { OrderService } from '@domains/order/order.service';
import { CustomerProfileService } from '@domains/customer-profile/customer-profile.service';
import { RecentlyViewedService } from '@domains/recently-viewed/recently-viewed.service';
import { RetrievalService } from '../retrieval.service';
import type { BusinessTool, ToolContext } from './business-tool.interface';

// ponytail: base class — shared validate/execute shape. Concrete tools only define
// name/description/schema + a typed run(). No duplicated DI or error handling.
abstract class BaseTool implements BusinessTool {
  abstract name: string;
  abstract description: string;
  abstract schema(): Record<string, unknown>;
  validate(_input: unknown): void {}
  abstract execute(input: any, ctx: ToolContext): Promise<unknown>;
}

@Injectable()
export class ProductTool extends BaseTool {
  name = 'product';
  description =
    'Search and look up products by query, SKU, name, id, or filters (category, brand, size, color, price, availability).';

  constructor(private readonly products: ProductsService) {
    super();
  }

  schema() {
    return {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text search' },
        id: { type: 'string', description: 'Product ID' },
        sku: { type: 'string' },
        category: { type: 'string' },
        brand: { type: 'string' },
        size: { type: 'string' },
        color: { type: 'string' },
        minPrice: { type: 'number' },
        maxPrice: { type: 'number' },
        inStock: { type: 'boolean' },
        limit: { type: 'number', default: 10 },
      },
    };
  }

  async execute(input: any, _ctx: ToolContext): Promise<unknown> {
    if (input.id) {
      const p = await this.products.findById(input.id);
      return { product: p };
    }
    if (input.sku) {
      const r = await this.products.findAll({
        search: input.sku,
        limit: 1,
      });
      return { products: (r as any).items ?? r };
    }
    const r = await this.products.findAll({
      search: input.query,
      category: input.category,
      brand: input.brand,
      size: input.size,
      color: input.color,
      minPrice: input.minPrice,
      maxPrice: input.maxPrice,
      inStock: input.inStock,
      limit: input.limit ?? 10,
    } as any);
    return { products: (r as any).items ?? r, total: (r as any).total ?? 0 };
  }
}

@Injectable()
export class CategoryTool extends BaseTool {
  name = 'category';
  description =
    'List categories, fetch a category by id, and retrieve its children/parent hierarchy.';

  constructor(private readonly categories: CategoriesService) {
    super();
  }

  schema() {
    return {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Category ID' },
        parentId: { type: 'string', description: 'Filter by parent' },
        popular: { type: 'boolean', description: 'Only popular categories' },
        limit: { type: 'number', default: 20 },
      },
    };
  }

  async execute(input: any, _ctx: ToolContext): Promise<unknown> {
    if (input.id) {
      const c = await this.categories.findById(input.id);
      return { category: c };
    }
    const r = await this.categories.findAll({
      parentId: input.parentId,
      popular: input.popular,
      limit: input.limit ?? 20,
    } as any);
    return { categories: (r as any).items ?? r, total: (r as any).total ?? 0 };
  }
}

@Injectable()
export class InventoryTool extends BaseTool {
  name = 'inventory';
  description =
    'Look up stock, warehouse availability, low-stock items, and restock estimates for a product or variant.';

  constructor(private readonly inventory: InventoryService) {
    super();
  }

  schema() {
    return {
      type: 'object',
      properties: {
        variantId: { type: 'string' },
        productId: { type: 'string' },
        lowStock: { type: 'boolean', description: 'Only low-stock items' },
        limit: { type: 'number', default: 20 },
      },
    };
  }

  async execute(input: any, _ctx: ToolContext): Promise<unknown> {
    if (input.variantId) {
      const i = await this.inventory.findByVariantId(input.variantId);
      return { inventory: i };
    }
    if (input.productId) {
      const i = await this.inventory.findById(input.productId);
      return { inventory: i };
    }
    const r = await this.inventory.findAll({
      lowStock: input.lowStock,
      limit: input.limit ?? 20,
    });
    return { items: (r as any).items ?? r, total: (r as any).total ?? 0 };
  }
}

@Injectable()
export class OrderTool extends BaseTool {
  name = 'order';
  description =
    'Look up an order by ID for status, tracking, invoice, payment, and cancellation eligibility.';

  constructor(private readonly orders: OrderService) {
    super();
  }

  schema() {
    return {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Order ID' },
        userId: {
          type: 'string',
          description: 'Required for ownership-scoped lookups',
        },
      },
      required: ['id'],
    };
  }

  validate(input: any): void {
    if (!input?.id) throw new BadRequestException('Order id is required');
  }

  async execute(input: any, ctx: ToolContext): Promise<unknown> {
    // ponytail: ownership check — a customer may only inspect their own order.
    // Admin (roles) may inspect any. Adjust when role list is finalized.
    if (
      ctx.userId &&
      !ctx.roles?.includes('admin') &&
      input.userId &&
      input.userId !== ctx.userId
    ) {
      throw new ForbiddenException('You may only view your own orders');
    }
    const order = await this.orders.findById(input.id);
    if (!order) throw new NotFoundException('Order not found');
    return {
      id: (order as any).id,
      status: (order as any).status,
      tracking: (order as any).tracking,
      invoice: (order as any).invoice,
      payment: (order as any).payment,
      cancellationEligible: ['PENDING', 'CONFIRMED'].includes(
        (order as any).status,
      ),
    };
  }
}

@Injectable()
export class CustomerTool extends BaseTool {
  name = 'customer';
  description =
    'Fetch a customer profile, addresses, wishlist, recent orders, and preferences.';

  constructor(private readonly profile: CustomerProfileService) {
    super();
  }

  schema() {
    return {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'Target customer (must be self or admin)',
        },
        include: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
              'profile',
              'addresses',
              'wishlist',
              'recentOrders',
              'preferences',
            ],
          },
        },
      },
      required: ['userId'],
    };
  }

  validate(input: any): void {
    if (!input?.userId) throw new BadRequestException('userId is required');
  }

  async execute(input: any, ctx: ToolContext): Promise<unknown> {
    if (
      ctx.userId &&
      ctx.userId !== input.userId &&
      !ctx.roles?.includes('admin')
    ) {
      throw new ForbiddenException('You may only view your own profile');
    }
    const profile = await this.profile.getProfile(input.userId);
    return { profile };
  }
}

@Injectable()
export class RecommendationTool extends BaseTool {
  name = 'recommendation';
  description =
    'Get product recommendations: related, frequently bought together, trending, recently viewed, new arrivals. No LLM.';

  constructor(
    private readonly products: ProductsService,
    private readonly recentlyViewed: RecentlyViewedService,
  ) {
    super();
  }

  schema() {
    return {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: [
            'related',
            'frequently_bought_together',
            'trending',
            'recently_viewed',
            'new_arrivals',
          ],
        },
        productId: {
          type: 'string',
          description: 'For related/frequently_bought_together',
        },
        userId: {
          type: 'string',
          description: 'For personalized/trending/recently_viewed',
        },
        limit: { type: 'number', default: 10 },
      },
      required: ['type'],
    };
  }

  validate(input: any): void {
    if (!input?.type) throw new BadRequestException('type is required');
  }

  async execute(input: any, _ctx: ToolContext): Promise<unknown> {
    const limit = input.limit ?? 10;
    switch (input.type) {
      case 'trending':
      case 'new_arrivals': {
        const r = await this.products.findAll({
          sort: input.type === 'new_arrivals' ? 'newest' : 'popular',
          limit,
        } as any);
        return { products: (r as any).items ?? r };
      }
      case 'recently_viewed': {
        if (!input.userId)
          throw new BadRequestException('userId required for recently_viewed');
        const r = await this.recentlyViewed.findAll(input.userId, 1, limit);
        return { products: (r as any).items ?? r };
      }
      case 'related':
      case 'frequently_bought_together': {
        if (!input.productId)
          throw new BadRequestException('productId required');
        const r = await this.products.findAll({
          relatedTo: input.productId,
          limit,
        } as any);
        return { products: (r as any).items ?? r };
      }
      default:
        throw new BadRequestException(
          `Unknown recommendation type: ${input.type}`,
        );
    }
  }
}

@Injectable()
export class KnowledgeTool extends BaseTool {
  name = 'knowledge';
  description =
    'Retrieve structured knowledge chunks from the RAG knowledge base for a query.';

  constructor(private readonly retrieval: RetrievalService) {
    super();
  }

  schema() {
    return {
      type: 'object',
      properties: {
        query: { type: 'string' },
        topK: { type: 'number', default: 5 },
        threshold: { type: 'number', default: 0.7 },
        knowledgeSourceId: { type: 'string' },
        documentId: { type: 'string' },
      },
      required: ['query'],
    };
  }

  validate(input: any): void {
    if (!input?.query) throw new BadRequestException('query is required');
  }

  async execute(input: any, _ctx: ToolContext): Promise<unknown> {
    // ponytail: reuses RetrievalService — no duplicated retrieval logic.
    const r = await this.retrieval.retrieve({
      query: input.query,
      topK: input.topK ?? 5,
      threshold: input.threshold ?? 0.7,
      knowledgeSourceId: input.knowledgeSourceId,
      documentId: input.documentId,
    });
    return {
      chunks: r.chunks,
      totalResults: r.totalResults,
      queryTimeMs: r.queryTimeMs,
    };
  }
}

// ponytail: Analytics Tool is interface-only per spec — no analytics service is built in this phase.
@Injectable()
export class AnalyticsTool extends BaseTool {
  name = 'analytics';
  description =
    'Reserved for analytics capabilities. Not implemented in this phase.';

  schema() {
    return { type: 'object', properties: { note: { type: 'string' } } };
  }

  async execute(_input: any, _ctx: ToolContext): Promise<unknown> {
    return {
      implemented: false,
      message: 'Analytics tool is interface-only in this phase.',
    };
  }
}
