import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { AnalyticsService } from './analytics.service';
import {
  DashboardQueryDto,
  DashboardDto,
  ToolAnalyticsDto,
  RetrievalAnalyticsDto,
  ProviderAnalyticsDto,
  ChatAnalyticsDto,
  AnalyticsHealthDto,
  TraceContextDto,
} from './analytics.types';

@ApiTags('RAG Analytics')
@ApiBearerAuth()
@Controller('rag/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('dashboard')
  @ApiOkResponse({ type: DashboardDto })
  async dashboard(
    @Query() q: DashboardQueryDto,
    @Req() req: any,
  ): Promise<DashboardDto> {
    await this.analytics.logAccess(req.user?.id);
    return this.analytics.getDashboard(Number(q.window) || 1);
  }

  @Get('metrics')
  @ApiOkResponse({ description: 'Prometheus metrics from the shared registry' })
  async metrics(@Req() req: any): Promise<unknown> {
    await this.analytics.logAccess(req.user?.id);
    return this.analytics.getMetrics();
  }

  @Get('tools')
  @ApiOkResponse({ type: ToolAnalyticsDto })
  async tools(@Req() req: any): Promise<ToolAnalyticsDto> {
    await this.analytics.logAccess(req.user?.id);
    return this.analytics.getToolAnalytics();
  }

  @Get('retrieval')
  @ApiOkResponse({ type: RetrievalAnalyticsDto })
  async retrieval(@Req() req: any): Promise<RetrievalAnalyticsDto> {
    await this.analytics.logAccess(req.user?.id);
    return this.analytics.getRetrievalAnalytics();
  }

  @Get('providers')
  @ApiOkResponse({ type: ProviderAnalyticsDto })
  async providers(@Req() req: any): Promise<ProviderAnalyticsDto> {
    await this.analytics.logAccess(req.user?.id);
    return this.analytics.getProviderAnalytics();
  }

  @Get('chat')
  @ApiOkResponse({ type: ChatAnalyticsDto })
  async chat(@Req() req: any): Promise<ChatAnalyticsDto> {
    await this.analytics.logAccess(req.user?.id);
    return this.analytics.getChatAnalytics();
  }

  @Get('health')
  @ApiOkResponse({ type: AnalyticsHealthDto })
  async health(@Req() req: any): Promise<AnalyticsHealthDto> {
    await this.analytics.logAccess(req.user?.id);
    return this.analytics.getHealth();
  }

  @Get('trace')
  @ApiOkResponse({ type: TraceContextDto })
  trace(@Query('conversationId') conversationId?: string): TraceContextDto {
    return this.analytics.getTraceContext(conversationId);
  }
}
