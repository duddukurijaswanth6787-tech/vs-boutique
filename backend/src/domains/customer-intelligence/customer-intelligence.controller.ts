import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { CustomerIntelligenceService } from './customer-intelligence.service';

@ApiTags('Customer Intelligence')
@Controller('customer-intelligence')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin')
@ApiBearerAuth()
export class CustomerIntelligenceController {
  constructor(private readonly ciService: CustomerIntelligenceService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Customer intelligence overview (admin)' })
  async overview() {
    const data = await this.ciService.getOverview();
    return { success: true, data };
  }

  @Get('customers/:id')
  @ApiOperation({ summary: 'Single customer intelligence profile (admin)' })
  async customerProfile(@Param('id') id: string) {
    const data = await this.ciService.getCustomerProfile(id);
    return { success: true, data };
  }

  @Get('top-customers')
  @ApiOperation({ summary: 'Top customers by spend (admin)' })
  async topCustomers(@Query('limit') limit?: string) {
    const data = await this.ciService.getTopCustomers(limit ? parseInt(limit, 10) : 20);
    return { success: true, data };
  }

  @Get('segments')
  @ApiOperation({ summary: 'Customer segments (admin)' })
  async segments() {
    const data = await this.ciService.getSegments();
    return { success: true, data };
  }

  @Get('customers/:id/categories')
  @ApiOperation({ summary: 'Customer category preferences (admin)' })
  async categoryPreferences(@Param('id') id: string) {
    const data = await this.ciService.getCategoryPreferences(id);
    return { success: true, data };
  }

  @Get('trends')
  @ApiOperation({ summary: 'Monthly order/revenue trends (admin)' })
  async trends(@Query('months') months?: string) {
    const data = await this.ciService.getMonthlyTrends(months ? parseInt(months, 10) : 12);
    return { success: true, data };
  }

  @Get('funnel')
  @ApiOperation({ summary: 'Conversion funnel: view → wishlist → cart → order (admin)' })
  async funnel() {
    const data = await this.ciService.getConversionFunnel();
    return { success: true, data };
  }
}
