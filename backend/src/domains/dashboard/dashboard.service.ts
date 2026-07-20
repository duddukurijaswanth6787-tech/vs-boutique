import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CacheService } from '@infrastructure/redis/cache.service';
import {
  DashboardSummaryResponse,
  SalesChartResponse,
} from './dashboard.types';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  // ponytail: dashboard summary is read-heavy admin stats; 60s TTL avoids 21 parallel queries per refresh
  async getSummary(): Promise<DashboardSummaryResponse> {
    return this.cache.getOrSet(
      'dashboard:summary',
      () => this.computeSummary(),
      60,
    );
  }

  private async computeSummary(): Promise<DashboardSummaryResponse> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfWeek = new Date(
      now.getTime() - now.getDay() * 24 * 60 * 60 * 1000,
    );
    startOfWeek.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const yesterdayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1,
    );

    const whereActive = { deletedAt: null };

    const [
      totalOrders,
      totalCustomers,
      totalProducts,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      revenueAgg,
      revenueTodayAgg,
      revenueWeekAgg,
      revenueYesterdayAgg,
      revenueThisYearAgg,
      revenuePrevMonthAgg,
      lowStockCount,
      outOfStockCount,
      recentOrders,
      topProducts,
      statusDistribution,
      refundCount,
      newCustomers,
      orderItemCount,
      topCustomers,
    ] = await Promise.all([
      this.prisma.order.count({ where: whereActive }),
      this.prisma.customerProfile.count(),
      this.prisma.product.count({ where: whereActive }),
      this.prisma.order.count({ where: { status: 'PENDING', ...whereActive } }),
      this.prisma.order.count({
        where: { status: 'DELIVERED', ...whereActive },
      }),
      this.prisma.order.count({
        where: { status: 'CANCELLED', ...whereActive },
      }),
      this.prisma.order.aggregate({
        _sum: { grandTotal: true },
        where: { ...whereActive, createdAt: { gte: startOfMonth } },
      }),
      this.prisma.order.aggregate({
        _sum: { grandTotal: true },
        where: { ...whereActive, createdAt: { gte: startOfToday } },
      }),
      this.prisma.order.aggregate({
        _sum: { grandTotal: true },
        where: { ...whereActive, createdAt: { gte: startOfWeek } },
      }),
      this.prisma.order.aggregate({
        _sum: { grandTotal: true },
        where: {
          ...whereActive,
          createdAt: { gte: yesterdayStart, lt: startOfToday },
        },
      }),
      this.prisma.order.aggregate({
        _sum: { grandTotal: true },
        where: { ...whereActive, createdAt: { gte: startOfYear } },
      }),
      this.prisma.order.aggregate({
        _sum: { grandTotal: true },
        where: {
          ...whereActive,
          createdAt: { gte: startOfPrevMonth, lt: startOfMonth },
        },
      }),
      this.prisma.inventory.count({ where: { stockStatus: 'LOW_STOCK' } }),
      this.prisma.inventory.count({ where: { stockStatus: 'OUT_OF_STOCK' } }),
      this.prisma.order.findMany({
        where: whereActive,
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          grandTotal: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 10,
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        _count: true,
        where: whereActive,
      }),
      this.prisma.refund.count(),
      this.prisma.customerProfile.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.orderItem.aggregate({
        _count: true,
        where: { order: whereActive },
      }),
      this.prisma.order.groupBy({
        by: ['customerId'],
        _sum: { grandTotal: true },
        _count: true,
        orderBy: { _sum: { grandTotal: 'desc' } },
        take: 10,
      }),
    ]);

    // Resolve product names for top products
    const productIds = topProducts.map((p) => p.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        categories: { select: { category: { select: { name: true } } } },
        brand: { select: { name: true } },
      },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Resolve customer names for top customers
    const customerIds = topCustomers.map((c) => c.customerId);
    const customerProfiles = await this.prisma.customerProfile.findMany({
      where: { id: { in: customerIds } },
      select: {
        id: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    const customerNameMap = new Map(
      customerProfiles.map((c) => [c.id, c.user]),
    );

    const monthlyRevenue = Number(revenueAgg._sum.grandTotal ?? 0);
    const prevMonthRevenue = Number(revenuePrevMonthAgg._sum.grandTotal ?? 0);
    const revenueGrowth =
      prevMonthRevenue > 0
        ? ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
        : 0;

    return {
      totalOrders,
      totalRevenue: monthlyRevenue,
      revenueToday: Number(revenueTodayAgg._sum.grandTotal ?? 0),
      revenueYesterday: Number(revenueYesterdayAgg._sum.grandTotal ?? 0),
      revenueThisWeek: Number(revenueWeekAgg._sum.grandTotal ?? 0),
      revenueThisYear: Number(revenueThisYearAgg._sum.grandTotal ?? 0),
      averageOrderValue: totalOrders > 0 ? monthlyRevenue / totalOrders : 0,
      avgItemsPerOrder:
        totalOrders > 0 ? Math.round(orderItemCount._count / totalOrders) : 0,
      previousPeriodRevenue: prevMonthRevenue,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      totalCustomers,
      newCustomersThisMonth: newCustomers,
      returningCustomersThisMonth: totalCustomers - newCustomers,
      totalProducts,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      refundCount,
      lowStockCount,
      outOfStockCount,
      orderStatusDistribution: Object.fromEntries(
        statusDistribution.map((s) => [s.status, s._count]),
      ),
      recentOrders,
      topProducts: topProducts.map((tp) => ({
        ...tp,
        product: productMap.get(tp.productId) ?? null,
      })),
      topCategories: this.aggregateTopCategories(topProducts, productMap),
      topBrands: this.aggregateTopBrands(topProducts, productMap),
      topCustomers: topCustomers.map((c) => ({
        customerId: c.customerId,
        totalSpent: Number(c._sum.grandTotal ?? 0),
        orderCount: c._count,
        customer: customerNameMap.get(c.customerId) ?? null,
      })),
    };
  }

  private aggregateTopCategories(
    topProducts: any[],
    productMap: Map<string, any>,
  ) {
    const catMap = new Map<string, number>();
    for (const tp of topProducts) {
      const prod = productMap.get(tp.productId);
      const catName = prod?.categories?.[0]?.category?.name ?? 'Uncategorized';
      catMap.set(
        catName,
        (catMap.get(catName) ?? 0) + Number(tp._sum.totalPrice ?? 0),
      );
    }
    return Array.from(catMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, revenue]) => ({ name, revenue }));
  }

  private aggregateTopBrands(topProducts: any[], productMap: Map<string, any>) {
    const brandMap = new Map<string, number>();
    for (const tp of topProducts) {
      const prod = productMap.get(tp.productId);
      const brandName = prod?.brand?.name ?? 'Unknown';
      brandMap.set(
        brandName,
        (brandMap.get(brandName) ?? 0) + Number(tp._sum.totalPrice ?? 0),
      );
    }
    return Array.from(brandMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, revenue]) => ({ name, revenue }));
  }

  async getSalesChart(period: string = 'monthly'): Promise<SalesChartResponse> {
    return this.cache.getOrSet(
      `dashboard:sales-chart:${period}`,
      () => this.computeSalesChart(period),
      120,
    );
  }

  private async computeSalesChart(
    period: string = 'monthly',
  ): Promise<SalesChartResponse> {
    const now = new Date();
    let startDate: Date;
    let groupBy: 'day' | 'month';

    if (period === 'weekly') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      groupBy = 'day';
    } else if (period === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
      groupBy = 'month';
    } else if (period === 'quarterly') {
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      groupBy = 'month';
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      groupBy = 'day';
    }

    const orders = await this.prisma.order.findMany({
      where: { deletedAt: null, createdAt: { gte: startDate } },
      select: { grandTotal: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const bucket = new Map<string, number>();
    for (const order of orders) {
      const key =
        groupBy === 'day'
          ? order.createdAt.toISOString().slice(0, 10)
          : `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`;
      bucket.set(key, (bucket.get(key) ?? 0) + Number(order.grandTotal));
    }

    return {
      labels: Array.from(bucket.keys()),
      data: Array.from(bucket.values()),
    };
  }

  async getCancellationRefundTrends() {
    return this.cache.getOrSet(
      'dashboard:cancellation-refund-trends',
      () => this.computeCancellationRefundTrends(),
      300,
    );
  }

  private async computeCancellationRefundTrends() {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const [cancellations, refunds] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          status: 'CANCELLED',
          deletedAt: null,
          createdAt: { gte: twelveMonthsAgo },
        },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.refund.findMany({
        where: { createdAt: { gte: twelveMonthsAgo } },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const bucketCancellations = new Map<string, number>();
    const bucketRefunds = new Map<string, number>();
    const bucketRefundAmount = new Map<string, number>();

    for (const c of cancellations) {
      const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, '0')}`;
      bucketCancellations.set(key, (bucketCancellations.get(key) ?? 0) + 1);
    }
    for (const r of refunds) {
      const key = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, '0')}`;
      bucketRefunds.set(key, (bucketRefunds.get(key) ?? 0) + 1);
      bucketRefundAmount.set(
        key,
        (bucketRefundAmount.get(key) ?? 0) + Number(r.amount),
      );
    }

    const labels = Array.from(
      new Set([...bucketCancellations.keys(), ...bucketRefunds.keys()]),
    ).sort();
    return {
      labels,
      cancellations: labels.map((l) => bucketCancellations.get(l) ?? 0),
      refunds: labels.map((l) => bucketRefunds.get(l) ?? 0),
      refundAmounts: labels.map(
        (l) => Math.round((bucketRefundAmount.get(l) ?? 0) * 100) / 100,
      ),
    };
  }

  async getInventoryValuation() {
    return this.cache.getOrSet(
      'dashboard:inventory-valuation',
      () => this.computeInventoryValuation(),
      300,
    );
  }

  private async computeInventoryValuation() {
    const inventory = await this.prisma.inventory.findMany({
      where: { trackInventory: true },
      select: {
        availableQuantity: true,
        variant: {
          select: {
            product: {
              select: { basePrice: true, costPrice: true, name: true },
            },
          },
        },
      },
    });

    let totalValuation = 0;
    const byProduct = new Map<
      string,
      { name: string; quantity: number; value: number }
    >();

    for (const inv of inventory) {
      const price = Number(
        inv.variant?.product?.costPrice ?? inv.variant?.product?.basePrice ?? 0,
      );
      const value = inv.availableQuantity * price;
      totalValuation += value;

      const productName = inv.variant?.product?.name ?? 'Unknown';
      const existing = byProduct.get(productName);
      if (existing) {
        existing.quantity += inv.availableQuantity;
        existing.value += value;
      } else {
        byProduct.set(productName, {
          name: productName,
          quantity: inv.availableQuantity,
          value,
        });
      }
    }

    return {
      totalValuation: Math.round(totalValuation * 100) / 100,
      byProduct: Array.from(byProduct.values())
        .sort((a, b) => b.value - a.value)
        .slice(0, 20),
    };
  }

  async getWarehouseStockDistribution() {
    return this.cache.getOrSet(
      'dashboard:warehouseStock',
      () => this.computeWarehouseStockDistribution(),
      120,
    );
  }

  private async computeWarehouseStockDistribution() {
    const warehouseStock = await this.prisma.variantWarehouseInventory.groupBy({
      by: ['warehouseId'],
      _sum: { availableQuantity: true },
    });

    const warehouseIds = warehouseStock.map((w) => w.warehouseId);
    const warehouses = await this.prisma.warehouse.findMany({
      where: { id: { in: warehouseIds } },
      select: { id: true, name: true },
    });
    const warehouseMap = new Map(warehouses.map((w) => [w.id, w.name]));

    return warehouseStock.map((ws) => ({
      warehouseId: ws.warehouseId,
      warehouseName: warehouseMap.get(ws.warehouseId) ?? 'Unknown',
      totalStock: ws._sum.availableQuantity ?? 0,
    }));
  }

  async getPaymentStatusDistribution(startDate?: string, endDate?: string) {
    const cacheKey = `dashboard:paymentStatus:${startDate || ''}:${endDate || ''}`;
    return this.cache.getOrSet(
      cacheKey,
      () => this.computePaymentStatusDistribution(startDate, endDate),
      120,
    );
  }

  private async computePaymentStatusDistribution(
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const distribution = await this.prisma.payment.groupBy({
      by: ['status'],
      _count: true,
      _sum: { amount: true },
      where,
    });

    return distribution.map((d) => ({
      status: d.status,
      count: d._count,
      totalAmount: Number(d._sum.amount ?? 0),
    }));
  }

  async getCouponUsageSummary(startDate?: string, endDate?: string) {
    const cacheKey = `dashboard:couponUsage:${startDate || ''}:${endDate || ''}`;
    return this.cache.getOrSet(
      cacheKey,
      () => this.computeCouponUsageSummary(startDate, endDate),
      120,
    );
  }

  private async computeCouponUsageSummary(
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [totalUsage, usageByCoupon] = await Promise.all([
      this.prisma.couponUsage.aggregate({
        _count: true,
        _sum: { discountAmount: true },
        where,
      }),
      this.prisma.couponUsage.groupBy({
        by: ['couponId'],
        _count: true,
        _sum: { discountAmount: true },
        where,
        orderBy: { _count: { couponId: 'desc' } },
        take: 10,
      }),
    ]);

    const couponIds = usageByCoupon.map((u) => u.couponId);
    const coupons = await this.prisma.coupon.findMany({
      where: { id: { in: couponIds } },
      select: { id: true, code: true, name: true },
    });
    const couponMap = new Map(coupons.map((c) => [c.id, c]));

    return {
      totalUsage: totalUsage._count,
      totalDiscount: Number(totalUsage._sum.discountAmount ?? 0),
      topCoupons: usageByCoupon.map((u) => ({
        couponId: u.couponId,
        code: couponMap.get(u.couponId)?.code ?? 'Unknown',
        name: couponMap.get(u.couponId)?.name ?? 'Unknown',
        usageCount: u._count,
        totalDiscount: Number(u._sum.discountAmount ?? 0),
      })),
    };
  }
}
