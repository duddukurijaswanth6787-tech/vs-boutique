import { ApiProperty } from '@nestjs/swagger';

export class DashboardSummaryResponse {
  @ApiProperty() totalOrders!: number;
  @ApiProperty() totalRevenue!: number;
  @ApiProperty() revenueToday!: number;
  @ApiProperty() revenueYesterday!: number;
  @ApiProperty() revenueThisWeek!: number;
  @ApiProperty() revenueThisYear!: number;
  @ApiProperty() averageOrderValue!: number;
  @ApiProperty() avgItemsPerOrder!: number;
  @ApiProperty() previousPeriodRevenue!: number;
  @ApiProperty() revenueGrowth!: number;
  @ApiProperty() totalCustomers!: number;
  @ApiProperty() newCustomersThisMonth!: number;
  @ApiProperty() returningCustomersThisMonth!: number;
  @ApiProperty() totalProducts!: number;
  @ApiProperty() pendingOrders!: number;
  @ApiProperty() completedOrders!: number;
  @ApiProperty() cancelledOrders!: number;
  @ApiProperty() refundCount!: number;
  @ApiProperty() lowStockCount!: number;
  @ApiProperty() outOfStockCount!: number;
  @ApiProperty({ type: Object }) orderStatusDistribution!: Record<
    string,
    number
  >;
  @ApiProperty({ type: [Object] }) recentOrders!: any[];
  @ApiProperty({ type: [Object] }) topProducts!: any[];
  @ApiProperty({ type: [Object] }) topCategories!: {
    name: string;
    revenue: number;
  }[];
  @ApiProperty({ type: [Object] }) topBrands!: {
    name: string;
    revenue: number;
  }[];
  @ApiProperty({ type: [Object] }) topCustomers!: {
    customerId: string;
    totalSpent: number;
    orderCount: number;
    customer: any;
  }[];
}

export class SalesChartResponse {
  @ApiProperty({ type: [String] }) labels!: string[];
  @ApiProperty({ type: [Number] }) data!: number[];
}

export class CancellationRefundTrendsResponse {
  @ApiProperty({ type: [String] }) labels!: string[];
  @ApiProperty({ type: [Number] }) cancellations!: number[];
  @ApiProperty({ type: [Number] }) refunds!: number[];
  @ApiProperty({ type: [Number] }) refundAmounts!: number[];
}

export class InventoryValuationResponse {
  @ApiProperty() totalValuation!: number;
  @ApiProperty({ type: [Object] }) byProduct!: {
    name: string;
    quantity: number;
    value: number;
  }[];
}

export class WarehouseStockResponse {
  @ApiProperty() warehouseId!: string;
  @ApiProperty() warehouseName!: string;
  @ApiProperty() totalStock!: number;
}

export class PaymentStatusDistributionResponse {
  @ApiProperty() status!: string;
  @ApiProperty() count!: number;
  @ApiProperty() totalAmount!: number;
}

export class CouponUsageSummaryResponse {
  @ApiProperty() totalUsage!: number;
  @ApiProperty() totalDiscount!: number;
  @ApiProperty({ type: [Object] }) topCoupons!: any[];
}
