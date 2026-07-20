import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiExtraModels,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { InstagramReelsService } from './instagram-reels.service';
import {
  CreateReelDto,
  UpdateReelDto,
  ReelQueryDto,
  UpdateReelStatusDto,
  ReorderReelsDto,
  AttachProductsDto,
  UploadUrlDto,
  UploadUrlResponse,
  ReelResponse,
  ReelListResponse,
  ReelAnalyticsResponse,
  ReelHistoryQueryDto,
  SystemHealthResponse,
  NotificationDto,
  ExportReelDto,
  ReelBulkActionDto,
} from './instagram-reels.types';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Admin Instagram Reels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/instagram-reels')
@ApiExtraModels(
  CreateReelDto,
  UpdateReelDto,
  ReelQueryDto,
  UpdateReelStatusDto,
  ReorderReelsDto,
  AttachProductsDto,
  UploadUrlDto,
  UploadUrlResponse,
  ReelResponse,
  ReelListResponse,
  ReelAnalyticsResponse,
  ReelHistoryQueryDto,
  SystemHealthResponse,
  NotificationDto,
  ExportReelDto,
  ReelBulkActionDto,
)
export class InstagramReelsAdminController {
  constructor(private readonly service: InstagramReelsService) {}

  @Post()
  @Roles('super_admin', 'admin', 'marketing_manager', 'content_manager')
  @ApiOperation({ summary: 'Create a new Instagram Reel' })
  @ApiCreatedResponse({ type: ReelResponse })
  async create(@Body() dto: CreateReelDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.created(
      await this.service.create(dto, user.sub),
      'Reel created',
    );
  }

  @Get()
  @Roles(
    'super_admin',
    'admin',
    'marketing_manager',
    'content_manager',
    'staff',
  )
  @ApiOperation({ summary: 'List Instagram Reels' })
  @ApiOkResponse({ type: ReelListResponse })
  async findAll(@Query() query: ReelQueryDto) {
    return ResponseBuilder.success(await this.service.findAll(query));
  }

  // ── Static GET routes (must be ABOVE @Get(':id') to avoid shadowing) ──
  @Get('cache')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Get cache metrics and keys' })
  async getCacheMetrics() {
    return ResponseBuilder.success(await this.service.getCacheMetrics());
  }

  @Get('system-health')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Get Instagram Reels system health status' })
  @ApiOkResponse({ type: SystemHealthResponse })
  async getSystemHealth() {
    return ResponseBuilder.success(await this.service.getSystemHealth());
  }

  @Get('notifications')
  @Roles('super_admin', 'admin', 'marketing_manager')
  @ApiOperation({ summary: 'Get system notifications for reels' })
  @ApiOkResponse({ type: [NotificationDto] })
  async getNotifications() {
    return ResponseBuilder.success(await this.service.getNotifications());
  }

  @Get('top')
  @Roles('super_admin', 'admin', 'marketing_manager', 'staff')
  @ApiOperation({ summary: 'Get top performing reels' })
  async getTopReels() {
    return ResponseBuilder.success(await this.service.getTopReels());
  }

  @Post('upload-url')
  @Roles('super_admin', 'admin', 'marketing_manager', 'content_manager')
  @ApiOperation({ summary: 'Get signed S3 upload URL for video or thumbnail' })
  @ApiOkResponse({ type: UploadUrlResponse })
  async getUploadUrl(@Body() dto: UploadUrlDto) {
    return ResponseBuilder.success(await this.service.getUploadUrl(dto));
  }

  @Post('bulk')
  @Roles('super_admin', 'admin')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Bulk publish, archive, duplicate, or delete reels',
  })
  async bulkOperation(
    @Body() dto: ReelBulkActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.service.bulkOperation(dto, user.sub),
    );
  }

  @Post('cache/refresh')
  @Roles('super_admin', 'admin')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Refresh all Instagram Reels cache' })
  async refreshCache(@CurrentUser() user: JwtPayload) {
    await this.service.refreshCache(user.sub);
    return ResponseBuilder.success(null, 'Cache refreshed');
  }

  @Post('cache/invalidate')
  @Roles('super_admin', 'admin')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Invalidate all Instagram Reels cache' })
  async invalidateCache(@CurrentUser() user: JwtPayload) {
    await this.service.invalidateCache(user.sub);
    return ResponseBuilder.success(null, 'Cache invalidated');
  }

  @Post('export/:format')
  @Roles('super_admin', 'admin', 'marketing_manager')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Export reels as CSV or Excel' })
  async exportReels(
    @Param('format') format: string,
    @Body() query: ExportReelDto,
  ) {
    return ResponseBuilder.success(
      await this.service.exportReels(query, format as 'csv' | 'excel'),
    );
  }

  @Patch('reorder')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Batch reorder Instagram Reels' })
  async reorder(@Body() dto: ReorderReelsDto, @CurrentUser() user: JwtPayload) {
    await this.service.reorder(dto, user.sub);
    return ResponseBuilder.success(null, 'Reels reordered');
  }

  @Delete('notifications/:id')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Dismiss a notification' })
  async dismissNotification(@Param('id') id: string) {
    await this.service.dismissNotification(id);
    return ResponseBuilder.success(null, 'Notification dismissed');
  }

  @Delete('notifications')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Clear all notifications' })
  async clearNotifications() {
    await this.service.clearNotifications();
    return ResponseBuilder.success(null, 'Notifications cleared');
  }

  // ── Parameterized routes (:id) ─────────────────────────────────────
  @Get(':id')
  @Roles(
    'super_admin',
    'admin',
    'marketing_manager',
    'content_manager',
    'staff',
  )
  @ApiOperation({ summary: 'Get Instagram Reel by ID' })
  @ApiOkResponse({ type: ReelResponse })
  @ApiNotFoundResponse({ description: 'Reel not found' })
  async findById(@Param('id') id: string) {
    return ResponseBuilder.success(await this.service.findById(id));
  }

  @Get(':id/analytics')
  @Roles('super_admin', 'admin', 'marketing_manager')
  @ApiOperation({ summary: 'Get reel analytics' })
  @ApiOkResponse({ type: ReelAnalyticsResponse })
  async getAnalytics(@Param('id') id: string) {
    return ResponseBuilder.success(await this.service.getAnalytics(id));
  }

  @Get(':id/history')
  @Roles('super_admin', 'admin', 'marketing_manager')
  @ApiOperation({ summary: 'Get reel audit history timeline' })
  async getHistory(
    @Param('id') id: string,
    @Query() query: ReelHistoryQueryDto,
  ) {
    return ResponseBuilder.success(await this.service.getHistory(id, query));
  }

  @Patch(':id')
  @Roles('super_admin', 'admin', 'marketing_manager', 'content_manager')
  @ApiOperation({ summary: 'Update an Instagram Reel' })
  @ApiOkResponse({ type: ReelResponse })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateReelDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.service.update(id, dto, user.sub),
      'Reel updated',
    );
  }

  @Patch(':id/status')
  @Roles('super_admin', 'admin', 'marketing_manager', 'content_manager')
  @ApiOperation({
    summary: 'Update Instagram Reel status (PUBLISHED/DRAFT/ARCHIVED)',
  })
  @ApiOkResponse({ type: ReelResponse })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReelStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.service.updateStatus(id, dto, user.sub),
      'Status updated',
    );
  }

  @Delete(':id')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Soft delete an Instagram Reel' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.service.delete(id, user.sub);
    return ResponseBuilder.deleted('Reel deleted');
  }

  @Post(':id/duplicate')
  @Roles('super_admin', 'admin', 'marketing_manager')
  @ApiOperation({ summary: 'Duplicate an Instagram Reel' })
  @ApiCreatedResponse({ type: ReelResponse })
  async duplicate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.created(
      await this.service.duplicate(id, user.sub),
      'Reel duplicated',
    );
  }

  @Post(':id/products')
  @Roles('super_admin', 'admin', 'marketing_manager', 'content_manager')
  @ApiOperation({
    summary: 'Attach products to a reel (replaces all existing)',
  })
  @ApiOkResponse({ type: ReelResponse })
  async attachProducts(
    @Param('id') id: string,
    @Body() dto: AttachProductsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.service.attachProducts(id, dto, user.sub),
      'Products attached',
    );
  }

  @Delete(':id/products/:productId')
  @Roles('super_admin', 'admin', 'marketing_manager')
  @ApiOperation({ summary: 'Remove a product from a reel' })
  @ApiOkResponse({ type: ReelResponse })
  async removeProduct(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.service.removeProduct(id, productId, user.sub),
      'Product removed',
    );
  }

  @Post(':id/process-metadata')
  @Roles('super_admin', 'admin')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Extract video metadata via ffprobe' })
  async processVideoMetadata(@Param('id') id: string) {
    return ResponseBuilder.success(await this.service.processVideoMetadata(id));
  }
}
