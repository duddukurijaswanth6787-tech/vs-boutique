export interface RecentOrder {
  id: string;
  orderNumber: string;
  grandTotal: number;
  status: string;
  createdAt: string;
}

export interface TopProductSum {
  quantity: number | null;
  totalPrice: number | null;
}

export interface TopProductInfo {
  id: string;
  name: string;
  slug: string;
}

export interface TopProduct {
  productId: string;
  _sum: TopProductSum;
  product: TopProductInfo | null;
}

export interface DashboardSummary {
  totalOrders: number;
  totalRevenue: number;
  revenueToday: number;
  revenueYesterday: number;
  revenueThisWeek: number;
  revenueThisYear: number;
  averageOrderValue: number;
  avgItemsPerOrder: number;
  previousPeriodRevenue: number;
  revenueGrowth: number;
  totalCustomers: number;
  newCustomersThisMonth: number;
  returningCustomersThisMonth: number;
  totalProducts: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  refundCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  orderStatusDistribution: Record<string, number>;
  recentOrders: RecentOrder[];
  topProducts: TopProduct[];
  topCategories: { name: string; revenue: number }[];
  topBrands: { name: string; revenue: number }[];
  topCustomers: {
    customerId: string;
    totalSpent: number;
    orderCount: number;
    customer: { firstName: string; lastName: string; email: string } | null;
  }[];
}

export interface SalesChartData {
  labels: string[];
  data: number[];
}

export interface CancellationRefundTrends {
  labels: string[];
  cancellations: number[];
  refunds: number[];
  refundAmounts: number[];
}

export interface InventoryValuationItem {
  name: string;
  quantity: number;
  value: number;
}

export interface InventoryValuation {
  totalValuation: number;
  byProduct: InventoryValuationItem[];
}

export interface WarehouseStock {
  warehouseId: string;
  warehouseName: string;
  totalStock: number;
}

export interface PaymentStatusDistribution {
  status: string;
  count: number;
  totalAmount: number;
}

export interface CouponUsageSummary {
  totalUsage: number;
  totalDiscount: number;
  topCoupons: {
    couponId: string;
    code: string;
    name: string;
    usageCount: number;
    totalDiscount: number;
  }[];
}
