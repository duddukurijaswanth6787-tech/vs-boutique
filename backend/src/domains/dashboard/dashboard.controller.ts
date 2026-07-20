import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard summary' })
  async getSummary() {
    return ResponseBuilder.success(await this.dashboardService.getSummary());
  }

  @Get('sales-chart')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get sales chart data (weekly/monthly/quarterly/yearly)',
  })
  async getSalesChart(@Query('period') period?: string) {
    return ResponseBuilder.success(
      await this.dashboardService.getSalesChart(period),
    );
  }

  @Get('cancellation-refund-trends')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get cancellation and refund trends (12 months)' })
  async getCancellationRefundTrends() {
    return ResponseBuilder.success(
      await this.dashboardService.getCancellationRefundTrends(),
    );
  }

  @Get('inventory-valuation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get inventory valuation' })
  async getInventoryValuation() {
    return ResponseBuilder.success(
      await this.dashboardService.getInventoryValuation(),
    );
  }

  @Get('warehouse-stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get warehouse stock distribution' })
  async getWarehouseStockDistribution() {
    return ResponseBuilder.success(
      await this.dashboardService.getWarehouseStockDistribution(),
    );
  }

  @Get('payment-status-distribution')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment status distribution' })
  async getPaymentStatusDistribution(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return ResponseBuilder.success(
      await this.dashboardService.getPaymentStatusDistribution(
        startDate,
        endDate,
      ),
    );
  }

  @Get('coupon-usage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get coupon usage summary' })
  async getCouponUsageSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return ResponseBuilder.success(
      await this.dashboardService.getCouponUsageSummary(startDate, endDate),
    );
  }
}
