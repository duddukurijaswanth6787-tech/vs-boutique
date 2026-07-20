import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CacheService } from '@infrastructure/redis/cache.service';

// ponytail: all analytics computed from existing tables via SQL aggregations.
// No new models needed for read-only intelligence. Cached 5min.
const CACHE_TTL = 300;

@Injectable()
export class CustomerIntelligenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async getOverview() {
    return this.cache.getOrSet('ci:overview', () => this.computeOverview(), CACHE_TTL);
  }

  async getCustomerProfile(customerId: string) {
    return this.cache.getOrSet(
      `ci:customer:${customerId}`,
      () => this.computeCustomerProfile(customerId),
      CACHE_TTL,
    );
  }

  async getTopCustomers(limit = 20) {
    return this.cache.getOrSet(
      `ci:top:${limit}`,
      () => this.computeTopCustomers(limit),
      CACHE_TTL,
    );
  }

  async getSegments() {
    return this.cache.getOrSet('ci:segments', () => this.computeSegments(), CACHE_TTL);
  }

  async getCategoryPreferences(customerId: string) {
    return this.cache.getOrSet(
      `ci:categories:${customerId}`,
      () => this.computeCategoryPreferences(customerId),
      CACHE_TTL,
    );
  }

  async getMonthlyTrends(months = 12) {
    return this.cache.getOrSet(
      `ci:trends:${months}`,
      () => this.computeMonthlyTrends(months),
      CACHE_TTL,
    );
  }

  async getConversionFunnel() {
    return this.cache.getOrSet('ci:funnel', () => this.computeFunnel(), CACHE_TTL);
  }

  // ─── Private computation ────────────────────────

  private async computeOverview() {
    const rows = await this.prisma.$queryRawUnsafe<{
      total_customers: number;
      total_orders: number;
      total_revenue: string;
      avg_order_value: string;
      repeat_rate: string;
    }[]>(`
      SELECT
        (SELECT COUNT(*)::int FROM customer_profiles) AS total_customers,
        (SELECT COUNT(*)::int FROM orders WHERE "deletedAt" IS NULL) AS total_orders,
        COALESCE((SELECT SUM("grandTotal") FROM orders WHERE "deletedAt" IS NULL AND status != 'CANCELLED'), 0)::text AS total_revenue,
        COALESCE((SELECT AVG("grandTotal") FROM orders WHERE "deletedAt" IS NULL AND status != 'CANCELLED'), 0)::text AS avg_order_value,
        COALESCE(
          (SELECT ROUND(
            COUNT(*) FILTER (WHERE order_count > 1)::decimal / NULLIF(COUNT(*), 0) * 100, 1
          ) FROM (
            SELECT "customerId", COUNT(*) AS order_count
            FROM orders WHERE "deletedAt" IS NULL
            GROUP BY "customerId"
          ) sub),
          0
        )::text AS repeat_rate
    `);
    const r = rows[0];
    return {
      totalCustomers: Number(r.total_customers),
      totalOrders: Number(r.total_orders),
      totalRevenue: Number(r.total_revenue),
      avgOrderValue: Number(r.avg_order_value),
      repeatPurchaseRate: Number(r.repeat_rate),
    };
  }

  private async computeCustomerProfile(customerId: string) {
    const rows = await this.prisma.$queryRawUnsafe<{
      total_orders: number;
      total_spent: string;
      avg_order_value: string;
      first_order: Date | null;
      last_order: Date | null;
      total_reviews: number;
      wishlist_count: number;
    }[]>(`
      SELECT
        (SELECT COUNT(*)::int FROM orders WHERE "customerId" = $1 AND "deletedAt" IS NULL) AS total_orders,
        COALESCE((SELECT SUM("grandTotal") FROM orders WHERE "customerId" = $1 AND "deletedAt" IS NULL AND status != 'CANCELLED'), 0)::text AS total_spent,
        COALESCE((SELECT AVG("grandTotal") FROM orders WHERE "customerId" = $1 AND "deletedAt" IS NULL AND status != 'CANCELLED'), 0)::text AS avg_order_value,
        (SELECT MIN("createdAt") FROM orders WHERE "customerId" = $1 AND "deletedAt" IS NULL) AS first_order,
        (SELECT MAX("createdAt") FROM orders WHERE "customerId" = $1 AND "deletedAt" IS NULL) AS last_order,
        (SELECT COUNT(*)::int FROM reviews WHERE "createdBy" = $1) AS total_reviews,
        (SELECT COUNT(*)::int FROM wishlist_items wi JOIN wishlists w ON w.id = wi."wishlistId" WHERE w."customerId" = $1) AS wishlist_count
    `, customerId);
    const r = rows[0];
    return {
      customerId,
      totalOrders: Number(r.total_orders),
      totalSpent: Number(r.total_spent),
      avgOrderValue: Number(r.avg_order_value),
      firstOrderDate: r.first_order,
      lastOrderDate: r.last_order,
      totalReviews: Number(r.total_reviews),
      wishlistCount: Number(r.wishlist_count),
    };
  }

  private async computeTopCustomers(limit: number) {
    return this.prisma.$queryRawUnsafe<{
      customerId: string;
      totalSpent: string;
      orderCount: number;
      avgOrderValue: string;
    }[]>(`
      SELECT
        "customerId",
        SUM("grandTotal")::text AS "totalSpent",
        COUNT(*)::int AS "orderCount",
        AVG("grandTotal")::text AS "avgOrderValue"
      FROM orders
      WHERE "deletedAt" IS NULL AND status != 'CANCELLED'
      GROUP BY "customerId"
      ORDER BY SUM("grandTotal") DESC
      LIMIT $1
    `, limit);
  }

  private async computeSegments() {
    const rows = await this.prisma.$queryRawUnsafe<{
      segment: string;
      count: number;
    }[]>(`
      SELECT segment, COUNT(*)::int AS count FROM (
        SELECT CASE
          WHEN order_count >= 10 AND total_spent >= 50000 THEN 'VIP'
          WHEN order_count >= 5 THEN 'Loyal'
          WHEN order_count >= 2 THEN 'Active'
          WHEN order_count = 1 AND last_order > NOW() - INTERVAL '90 days' THEN 'New'
          WHEN order_count >= 1 AND last_order <= NOW() - INTERVAL '90 days' THEN 'At Risk'
          ELSE 'Prospect'
        END AS segment
        FROM (
          SELECT
            "customerId",
            COUNT(*) AS order_count,
            SUM("grandTotal") AS total_spent,
            MAX("createdAt") AS last_order
          FROM orders
          WHERE "deletedAt" IS NULL
          GROUP BY "customerId"
        ) sub
      ) grouped
      GROUP BY segment
      ORDER BY count DESC
    `);
    return rows.map((r) => ({ segment: r.segment, count: Number(r.count) }));
  }

  private async computeCategoryPreferences(customerId: string) {
    return this.prisma.$queryRawUnsafe<{
      categoryId: string;
      categoryName: string;
      orderCount: number;
      totalSpent: string;
    }[]>(`
      SELECT
        pc."categoryId",
        c.name AS "categoryName",
        COUNT(DISTINCT o.id)::int AS "orderCount",
        SUM(oi."totalPrice")::text AS "totalSpent"
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      JOIN product_categories pc ON pc."productId" = oi."productId"
      JOIN categories c ON c.id = pc."categoryId"
      WHERE o."customerId" = $1 AND o."deletedAt" IS NULL AND o.status != 'CANCELLED'
      GROUP BY pc."categoryId", c.name
      ORDER BY SUM(oi."totalPrice") DESC
      LIMIT 10
    `, customerId);
  }

  private async computeMonthlyTrends(months: number) {
    return this.prisma.$queryRawUnsafe<{
      month: string;
      orderCount: number;
      revenue: string;
      customerCount: number;
    }[]>(`
      SELECT
        TO_CHAR("createdAt", 'YYYY-MM') AS month,
        COUNT(*)::int AS "orderCount",
        SUM("grandTotal")::text AS revenue,
        COUNT(DISTINCT "customerId")::int AS "customerCount"
      FROM orders
      WHERE "deletedAt" IS NULL AND status != 'CANCELLED'
        AND "createdAt" > NOW() - INTERVAL '1 month' * $1
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY month
    `, months);
  }

  private async computeFunnel() {
    const rows = await this.prisma.$queryRawUnsafe<{
      viewed: number;
      wishlisted: number;
      carted: number;
      ordered: number;
    }[]>(`
      SELECT
        (SELECT COUNT(DISTINCT "productId")::int FROM recently_viewed) AS viewed,
        (SELECT COUNT(DISTINCT "productId")::int FROM wishlist_items) AS wishlisted,
        (SELECT COUNT(DISTINCT "productId")::int FROM shopping_cart_items) AS carted,
        (SELECT COUNT(DISTINCT oi."productId")::int FROM order_items oi JOIN orders o ON o.id = oi."orderId" WHERE o."deletedAt" IS NULL) AS ordered
    `);
    const r = rows[0];
    return {
      viewed: Number(r.viewed),
      wishlisted: Number(r.wishlisted),
      carted: Number(r.carted),
      ordered: Number(r.ordered),
      viewToWishRate: r.viewed > 0 ? Number(r.wishlisted) / Number(r.viewed) * 100 : 0,
      wishToCartRate: r.wishlisted > 0 ? Number(r.carted) / Number(r.wishlisted) * 100 : 0,
      cartToOrderRate: r.carted > 0 ? Number(r.ordered) / Number(r.carted) * 100 : 0,
    };
  }
}
