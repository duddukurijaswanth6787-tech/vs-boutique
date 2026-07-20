import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { LoyaltyService } from './loyalty.service';

@ApiTags('Loyalty')
@Controller('loyalty')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Post('earn')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Award loyalty points to a customer (admin)' })
  async earn(@Body() dto: { customerId: string; points: number; referenceType: string; referenceId: string; description?: string }) {
    const data = await this.loyaltyService.earnPoints(dto.customerId, dto.points, dto.referenceType, dto.referenceId, dto.description);
    return { success: true, data, message: `${dto.points} points awarded` };
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem loyalty points' })
  async redeem(@Body() dto: { customerId: string; points: number; description?: string }) {
    const data = await this.loyaltyService.redeemPoints(dto.customerId, dto.points, dto.description);
    return { success: true, data, message: `${dto.points} points redeemed` };
  }

  @Get('summary/:customerId')
  @ApiOperation({ summary: 'Get loyalty summary for a customer' })
  async summary(@Param('customerId') customerId: string) {
    const data = await this.loyaltyService.getSummary(customerId);
    return { success: true, data };
  }

  @Get('history/:customerId')
  @ApiOperation({ summary: 'Get loyalty points history' })
  async history(@Param('customerId') customerId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const data = await this.loyaltyService.getHistory(customerId, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20);
    return { success: true, data };
  }

  @Get('analytics')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Loyalty analytics (admin)' })
  async analytics() {
    const data = await this.loyaltyService.getAnalytics();
    return { success: true, data };
  }
}
