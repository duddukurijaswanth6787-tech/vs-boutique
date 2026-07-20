import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '@database/prisma.service';
import { CacheService } from '@infrastructure/redis/cache.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let mockPrisma: Partial<Record<keyof PrismaService, any>>;

  beforeEach(async () => {
    const emptyAgg = jest
      .fn()
      .mockResolvedValue({ _sum: { grandTotal: null } });
    mockPrisma = {
      order: {
        count: jest.fn().mockResolvedValue(0),
        aggregate: emptyAgg,
        findMany: jest.fn().mockResolvedValue([]),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      customerProfile: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      product: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      inventory: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      refund: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      orderItem: {
        groupBy: jest.fn().mockResolvedValue([]),
        aggregate: jest.fn().mockResolvedValue({ _count: 0 }),
      },
      variantWarehouseInventory: { groupBy: jest.fn().mockResolvedValue([]) },
      warehouse: { findMany: jest.fn().mockResolvedValue([]) },
      payment: { groupBy: jest.fn().mockResolvedValue([]) },
      couponUsage: {
        aggregate: jest
          .fn()
          .mockResolvedValue({ _count: 0, _sum: { discountAmount: null } }),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      coupon: { findMany: jest.fn().mockResolvedValue([]) },
    };

    // ponytail: stub CacheService so tests run factory logic without Redis
    const mockCache = {
      getOrSet: jest.fn((_key: string, factory: () => any) => factory()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return summary with zeros for empty database', async () => {
    const result = await service.getSummary();
    expect(result).toEqual({
      totalOrders: 0,
      totalRevenue: 0,
      revenueToday: 0,
      revenueYesterday: 0,
      revenueThisWeek: 0,
      revenueThisYear: 0,
      averageOrderValue: 0,
      avgItemsPerOrder: 0,
      previousPeriodRevenue: 0,
      revenueGrowth: 0,
      totalCustomers: 0,
      newCustomersThisMonth: 0,
      returningCustomersThisMonth: 0,
      totalProducts: 0,
      pendingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      refundCount: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      orderStatusDistribution: {},
      recentOrders: [],
      topProducts: [],
      topCategories: [],
      topBrands: [],
      topCustomers: [],
    });
  });

  it('should return empty sales chart for empty database', async () => {
    const result = await service.getSalesChart('monthly');
    expect(result).toEqual({ labels: [], data: [] });
  });

  it('should default to monthly period for sales chart', async () => {
    const result = await service.getSalesChart();
    expect(result).toEqual({ labels: [], data: [] });
  });

  it('should return empty cancellation refund trends for empty database', async () => {
    // order.findMany with cancelled status returns [], refund.findMany returns []
    mockPrisma.order.findMany = jest.fn().mockResolvedValue([]);
    const result = await service.getCancellationRefundTrends();
    expect(result).toHaveProperty('labels');
    expect(result).toHaveProperty('cancellations');
    expect(result).toHaveProperty('refunds');
    expect(result).toHaveProperty('refundAmounts');
  });

  it('should return zero inventory valuation for empty database', async () => {
    const result = await service.getInventoryValuation();
    expect(result).toEqual({ totalValuation: 0, byProduct: [] });
  });

  it('should return empty warehouse stock for empty database', async () => {
    const result = await service.getWarehouseStockDistribution();
    expect(result).toEqual([]);
  });

  it('should return empty payment status distribution for empty database', async () => {
    const result = await service.getPaymentStatusDistribution();
    expect(result).toEqual([]);
  });

  it('should return empty coupon usage summary for empty database', async () => {
    const result = await service.getCouponUsageSummary();
    expect(result).toMatchObject({
      totalUsage: 0,
      totalDiscount: 0,
      topCoupons: [],
    });
  });
});
