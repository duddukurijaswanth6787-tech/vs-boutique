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
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtService } from '@domains/auth/services/jwt.service';
import { resolveOptionalAuth } from '@domains/auth/utils/optional-auth.util';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';
import { SocialService } from './social.service';
import {
  SocialFeedQueryDto,
  SocialReelsQueryDto,
  SocialInteractionDto,
  CreateCommentDto,
  CreateReportDto,
} from './social.types';

@ApiTags('Social Commerce')
@Controller()
export class SocialController {
  constructor(
    private readonly socialService: SocialService,
    private readonly jwtService: JwtService,
  ) {}

  // Helper to extract user payload from optional auth header
  private getOptionalUser(req: Request): JwtPayload | null {
    const { payload } = resolveOptionalAuth(this.jwtService, req.headers.authorization);
    return payload ?? null;
  }

  @Get('social/feed')
  @ApiOperation({
    summary: 'Get main customer social feed (weighted catalog posts)',
  })
  async getFeed(@Query() query: SocialFeedQueryDto, @Req() req: Request) {
    const user = this.getOptionalUser(req);
    const feed = await this.socialService.getFeed(query);
    // Enrich with liked/saved viewer states
    if (user) {
      feed.data = await Promise.all(
        feed.data.map(async (post) => {
          const enriched = await this.socialService.getPostById(
            post.id,
            user.sub,
          );
          return enriched;
        }),
      );
    }
    return ResponseBuilder.success(feed);
  }

  @Get('social/reels')
  @ApiOperation({ summary: 'Get reels feed (video-only catalog posts)' })
  async getReels(@Query() query: SocialReelsQueryDto, @Req() req: Request) {
    const user = this.getOptionalUser(req);
    const reels = await this.socialService.getReels(query);
    if (user) {
      reels.data = await Promise.all(
        reels.data.map(async (post) => {
          const enriched = await this.socialService.getPostById(
            post.id,
            user.sub,
          );
          return enriched;
        }),
      );
    }
    return ResponseBuilder.success(reels);
  }

  @Get('social/trending')
  @ApiOperation({
    summary: 'Get trending posts based on engagement weighted score',
  })
  async getTrending(@Query() query: SocialReelsQueryDto, @Req() req: Request) {
    const user = this.getOptionalUser(req);
    const trending = await this.socialService.getTrending(query);
    if (user) {
      trending.data = await Promise.all(
        trending.data.map(async (post) => {
          const enriched = await this.socialService.getPostById(
            post.id,
            user.sub,
          );
          return enriched;
        }),
      );
    }
    return ResponseBuilder.success(trending);
  }

  @Get('social/posts/:id')
  @ApiOperation({
    summary: 'Get social post or reel by ID with tagged product details',
  })
  async getPostById(@Param('id') id: string, @Req() req: Request) {
    const user = this.getOptionalUser(req);
    const post = await this.socialService.getPostById(id, user?.sub);
    return ResponseBuilder.success(post);
  }

  @Put('social/posts/:id/interaction')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Interact with post: LIKE, UNLIKE, SAVE, UNSAVE, SHARE, VIEW, PLAY',
  })
  async interact(
    @Param('id') id: string,
    @Body() dto: SocialInteractionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const result = await this.socialService.interact(
      id,
      user.sub,
      dto.action,
      dto,
    );
    return ResponseBuilder.success(result, 'Interaction tracked');
  }

  @Post('social/posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Add a comment or direct reply (nested replies capped to 2 levels)',
  })
  async addComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const comment = await this.socialService.addComment(
      id,
      user.sub,
      dto.content,
      dto.parentId,
    );
    return ResponseBuilder.created(comment, 'Comment added');
  }

  @Get('social/posts/:id/comments')
  @ApiOperation({ summary: 'List comments and replies for a social post' })
  async getComments(
    @Param('id') id: string,
    @Query() query: SocialFeedQueryDto,
  ) {
    const comments = await this.socialService.getComments(id, query);
    return ResponseBuilder.success(comments);
  }

  @Put('social/comments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit own comment' })
  async updateComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const comment = await this.socialService.updateComment(
      id,
      user.sub,
      dto.content,
    );
    return ResponseBuilder.success(comment, 'Comment updated');
  }

  @Delete('social/comments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own comment (or any comment for admins)' })
  async deleteComment(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.socialService.deleteComment(
      id,
      user.sub,
      user.roles[0] || 'CUSTOMER',
    );
    return ResponseBuilder.success(null, 'Comment deleted');
  }

  @Post('social/posts/:id/report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Submit safety report for inappropriate/spam social posts',
  })
  async reportPost(
    @Param('id') id: string,
    @Body() dto: CreateReportDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const report = await this.socialService.reportPost(
      id,
      user.sub,
      dto.reason,
      dto.description,
    );
    return ResponseBuilder.created(report, 'Report submitted');
  }

  @Get('me/saved-posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List customer saved bookmarks posts' })
  async getSaved(
    @Query() query: SocialReelsQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const saved = await this.socialService.getSaved(user.sub, query);
    return ResponseBuilder.success(saved);
  }

  // ─── Follow System ─────────────────────────────────────
  @Post('social/users/:id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow a user' })
  async follow(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const data = await this.socialService.follow(user.sub, id);
    return ResponseBuilder.success(data, 'Followed');
  }

  @Delete('social/users/:id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow a user' })
  async unfollow(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.socialService.unfollow(user.sub, id);
    return ResponseBuilder.success(null, 'Unfollowed');
  }

  @Get('social/users/:id/followers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get followers of a user' })
  async getFollowers(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.socialService.getFollowers(
      id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return ResponseBuilder.success(data);
  }

  @Get('social/users/:id/following')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get users that a user is following' })
  async getFollowing(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.socialService.getFollowing(
      id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return ResponseBuilder.success(data);
  }

  @Get('social/users/:id/follow-counts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get follower/following counts for a user' })
  async getFollowCounts(@Param('id') id: string) {
    const data = await this.socialService.getFollowCounts(id);
    return ResponseBuilder.success(data);
  }

  // ─── Block / Mute ─────────────────────────────────────
  @Post('social/users/:id/block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Block a user' })
  async blockUser(@Param('id') id: string, @Body() dto: { reason?: string }, @CurrentUser() user: JwtPayload) {
    const data = await this.socialService.blockUser(user.sub, id, dto.reason);
    return ResponseBuilder.success(data, 'User blocked');
  }

  @Delete('social/users/:id/block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unblock a user' })
  async unblockUser(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.socialService.unblockUser(user.sub, id);
    return ResponseBuilder.success(null, 'User unblocked');
  }

  @Get('social/me/blocked')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get blocked users' })
  async getBlockedUsers(@CurrentUser() user: JwtPayload) {
    const data = await this.socialService.getBlockedUsers(user.sub);
    return ResponseBuilder.success(data);
  }

  @Post('social/users/:id/mute')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mute a user' })
  async muteUser(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const data = await this.socialService.muteUser(user.sub, id);
    return ResponseBuilder.success(data, 'User muted');
  }

  @Delete('social/users/:id/mute')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unmute a user' })
  async unmuteUser(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.socialService.unmuteUser(user.sub, id);
    return ResponseBuilder.success(null, 'User unmuted');
  }

  @Get('social/me/muted')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get muted users' })
  async getMutedUsers(@CurrentUser() user: JwtPayload) {
    const data = await this.socialService.getMutedUsers(user.sub);
    return ResponseBuilder.success(data);
  }
}
