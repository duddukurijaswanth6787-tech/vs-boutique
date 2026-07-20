import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiAnalyticsService } from './ai-analytics.service';
import { AnalyticsQueryDto } from './ai-analytics.types';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';

@ApiTags('AI Analytics')
@Controller('ai/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin')
@ApiBearerAuth()
export class AiAnalyticsController {
  constructor(private readonly aiAnalyticsService: AiAnalyticsService) {}

  @Get()
  @ApiOperation({ summary: 'Get AI analytics' })
  async getAnalytics(@Query() query: AnalyticsQueryDto) {
    return ResponseBuilder.success(
      await this.aiAnalyticsService.getAnalytics(query),
    );
  }

  @Get('popular-searches')
  @ApiOperation({ summary: 'Get popular searches' })
  async getPopularSearches() {
    return ResponseBuilder.success(
      await this.aiAnalyticsService.getPopularSearches(),
    );
  }

  @Get('popular-products')
  @ApiOperation({ summary: 'Get popular products' })
  async getPopularProducts() {
    return ResponseBuilder.success(
      await this.aiAnalyticsService.getPopularProducts(),
    );
  }
}
