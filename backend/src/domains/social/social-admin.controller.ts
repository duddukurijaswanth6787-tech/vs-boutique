import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';
import { SocialService } from './social.service';
import {
  AdminSocialQueryDto,
  AdminReportsQueryDto,
  CreateSocialPostDto,
  UpdateSocialPostDto,
  UpdatePostStatusDto,
  PostMediaDto,
  ProductTagDto,
  ResolveReportDto,
} from './social.types';

@ApiTags('Social Commerce (Admin)')
@Controller('admin/social')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin')
@ApiBearerAuth()
export class SocialAdminController {
  constructor(private readonly socialService: SocialService) {}

  @Get('posts')
  @ApiOperation({ summary: 'List all posts/reels with filters' })
  async getPosts(@Query() query: AdminSocialQueryDto) {
    const result = await this.socialService.getAdminPosts(query);
    return ResponseBuilder.success(result);
  }

  @Get('analytics/summary')
  @ApiOperation({ summary: 'Get social commerce analytics summary' })
  async getAnalyticsSummary() {
    return ResponseBuilder.success(
      await this.socialService.getAnalyticsSummary(),
    );
  }

  @Post('posts')
  @ApiOperation({ summary: 'Create a new draft post or reel' })
  async createPost(
    @Body() dto: CreateSocialPostDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const post = await this.socialService.createDraftPost(user.sub, dto);
    return ResponseBuilder.created(post, 'Draft social post created');
  }

  @Get('posts/:id')
  @ApiOperation({ summary: 'Get details of a post' })
  async getPostById(@Param('id') id: string) {
    const post = await this.socialService.getPostById(id);
    return ResponseBuilder.success(post);
  }

  @Put('posts/:id')
  @ApiOperation({ summary: 'Update post caption, hashtags, and settings' })
  async updatePost(
    @Param('id') id: string,
    @Body() dto: UpdateSocialPostDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const post = await this.socialService.updatePost(id, user.sub, dto);
    return ResponseBuilder.success(post, 'Post updated');
  }

  @Put('posts/:id/status')
  @ApiOperation({
    summary:
      'Transition post status: PUBLISH, UNPUBLISH, FEATURE, ARCHIVE, etc.',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePostStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const post = await this.socialService.updatePostStatus(
      id,
      user.sub,
      dto.action,
    );
    return ResponseBuilder.success(post, `Post action ${dto.action} applied`);
  }

  @Put('posts/:id/media')
  @ApiOperation({
    summary: 'Attach media items uploaded to S3 (Capped at 10 items)',
  })
  async attachMedia(
    @Param('id') id: string,
    @Body() dto: PostMediaDto[],
    @CurrentUser() user: JwtPayload,
  ) {
    const media = await this.socialService.attachMedia(id, user.sub, dto);
    return ResponseBuilder.success(media, 'Media attached');
  }

  @Put('posts/:id/products')
  @ApiOperation({
    summary: 'Tag catalog products with coordinate tag coordinates',
  })
  async tagProducts(
    @Param('id') id: string,
    @Body() dto: ProductTagDto[],
    @CurrentUser() user: JwtPayload,
  ) {
    const tags = await this.socialService.tagProducts(id, user.sub, dto);
    return ResponseBuilder.success(tags, 'Products tagged');
  }

  @Post('posts/:id/upload-url')
  @ApiOperation({
    summary: 'Get a signed S3 upload URL for post media attachments',
  })
  async getUploadUrl(
    @Param('id') id: string,
    @Body() body: { mediaType: 'IMAGE' | 'VIDEO'; extension: string },
  ) {
    const urlData = await this.socialService.getUploadUrl(
      id,
      body.mediaType,
      body.extension,
    );
    return ResponseBuilder.success(urlData);
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: 'Soft delete social post' })
  async deletePost(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.socialService.deletePost(id, user.sub);
    return ResponseBuilder.success(null, 'Post soft-deleted');
  }

  @Post('posts/:id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted social post' })
  async restorePost(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.socialService.restorePost(id, user.sub);
    return ResponseBuilder.success(null, 'Post restored');
  }

  @Get('reports')
  @ApiOperation({ summary: 'List customer safety moderation reports' })
  async getReports(@Query() query: AdminReportsQueryDto) {
    const result = await this.socialService.getAdminReports(query);
    return ResponseBuilder.success(result);
  }

  @Put('reports/:id')
  @ApiOperation({
    summary: 'Resolve safety report: DISMISS, MARK_REVIEWED, TAKE_ACTION',
  })
  async resolveReport(
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const result = await this.socialService.resolveReport(
      id,
      user.sub,
      dto.action,
      dto.resolution,
    );
    return ResponseBuilder.success(
      result,
      `Report action ${dto.action} applied`,
    );
  }

  // ─── Blocked Keywords Management ─────────────────────
  @Post('blocked-keywords')
  @ApiOperation({ summary: 'Add a blocked keyword (admin)' })
  async addBlockedKeyword(@Body() dto: { keyword: string; category?: string }, @CurrentUser() user: JwtPayload) {
    const data = await this.socialService.addBlockedKeyword(dto.keyword, dto.category || 'PROFANITY', user.sub);
    return ResponseBuilder.created(data, 'Keyword blocked');
  }

  @Get('blocked-keywords')
  @ApiOperation({ summary: 'List blocked keywords (admin)' })
  async getBlockedKeywords() {
    const data = await this.socialService.getBlockedKeywords();
    return ResponseBuilder.success(data);
  }

  @Delete('blocked-keywords/:id')
  @ApiOperation({ summary: 'Remove a blocked keyword (admin)' })
  async removeBlockedKeyword(@Param('id') id: string) {
    await this.socialService.removeBlockedKeyword(id);
    return ResponseBuilder.success(null, 'Keyword unblocked');
  }
}
