import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { AuditService } from '@domains/audit/audit.service';
import { LoggerService } from '@common/logger/logger.service';
import { StorageService } from '@infrastructure/storage/storage.service';
import { BusinessException } from '@common/exceptions';
import { sanitizePlainText } from '@common/utils/sanitize';
import { SocialRepository } from './social.repository';
import {
  SocialPostStatus,
  SocialPostVisibility,
  SocialPostContentType,
  SocialReportStatus,
  SocialInteractionAction,
} from './social.types';

@Injectable()
export class SocialService {
  constructor(
    private readonly socialRepository: SocialRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly logger: LoggerService,
    private readonly storageService: StorageService,
  ) {}

  // ─── Post Management (Admin/Staff) ────────────────────────
  async createDraftPost(userId: string, data: any) {
    const post = await this.socialRepository.createPost({
      authorId: userId,
      contentType: data.contentType,
      caption: data.caption ? sanitizePlainText(data.caption) : undefined,
      hashtags: data.hashtags,
      visibility: data.visibility,
      allowComments: data.allowComments,
      createdBy: userId,
    });

    await this.auditService.log({
      action: 'SOCIAL_POST_CREATED',
      module: 'social',
      resource: 'social_post',
      resourceId: post.id,
      userId,
      newValue: { contentType: post.contentType, caption: post.caption },
    });

    return post;
  }

  async getPostById(id: string, userId?: string) {
    const post = await this.socialRepository.findPostById(id);
    if (!post) {
      throw new BusinessException('Social post not found', 'SOCIAL_POST_001');
    }

    let liked = false;
    let saved = false;
    if (userId) {
      [liked, saved] = await Promise.all([
        this.socialRepository.hasUserLiked(id, userId),
        this.socialRepository.hasUserSaved(id, userId),
      ]);
    }

    return {
      ...post,
      viewerState: { liked, saved },
    };
  }

  async updatePost(id: string, userId: string, data: any) {
    const post = await this.socialRepository.findPostById(id);
    if (!post) {
      throw new BusinessException('Social post not found', 'SOCIAL_POST_001');
    }

    const sanitized: any = { ...data, updatedBy: userId };
    if (sanitized.caption) sanitized.caption = sanitizePlainText(sanitized.caption);

    const updated = await this.socialRepository.updatePost(id, sanitized);

    await this.auditService.log({
      action: 'SOCIAL_POST_UPDATED',
      module: 'social',
      resource: 'social_post',
      resourceId: id,
      userId,
      newValue: data,
    });

    return updated;
  }

  async updatePostStatus(id: string, userId: string, action: string) {
    const post = await this.socialRepository.findPostById(id);
    if (!post) {
      throw new BusinessException('Social post not found', 'SOCIAL_POST_001');
    }

    const updates: any = { updatedBy: userId };
    let auditAction = '';

    if (action === 'PUBLISH') {
      // Validate: cannot publish empty post/reel
      if (post.media.length === 0) {
        throw new BusinessException(
          'Cannot publish a social post with no media files attached',
          'SOCIAL_POST_002',
        );
      }
      // REEL must contain at least one video
      if (post.contentType === SocialPostContentType.REEL) {
        const hasVideo = post.media.some((m) => m.mediaType === 'VIDEO');
        if (!hasVideo) {
          throw new BusinessException(
            'Reels must contain at least one video media item',
            'SOCIAL_REEL_001',
          );
        }
      }

      updates.status = SocialPostStatus.PUBLISHED;
      updates.publishedAt = new Date();
      auditAction = 'SOCIAL_POST_PUBLISHED';
    } else if (action === 'UNPUBLISH') {
      updates.status = SocialPostStatus.DRAFT;
      auditAction = 'SOCIAL_POST_UNPUBLISHED';
    } else if (action === 'HIDE') {
      updates.visibility = SocialPostVisibility.HIDDEN;
      auditAction = 'SOCIAL_POST_HIDDEN';
    } else if (action === 'UNHIDE') {
      updates.visibility = SocialPostVisibility.PUBLIC;
      auditAction = 'SOCIAL_POST_RESTORED';
    } else if (action === 'ARCHIVE') {
      updates.status = SocialPostStatus.ARCHIVED;
      auditAction = 'SOCIAL_POST_ARCHIVED';
    } else if (action === 'RESTORE') {
      updates.status = SocialPostStatus.DRAFT;
      auditAction = 'SOCIAL_POST_RESTORED';
    } else if (action === 'FEATURE') {
      updates.isFeatured = true;
      auditAction = 'SOCIAL_POST_FEATURED';
    } else if (action === 'UNFEATURE') {
      updates.isFeatured = false;
      auditAction = 'SOCIAL_POST_UNFEATURED';
    } else {
      throw new BusinessException(
        'Invalid status action value',
        'SOCIAL_POST_003',
      );
    }

    const updated = await this.socialRepository.updatePost(id, updates);

    await this.auditService.log({
      action: auditAction,
      module: 'social',
      resource: 'social_post',
      resourceId: id,
      userId,
      newValue: updates,
    });

    return updated;
  }

  async deletePost(id: string, userId: string) {
    const post = await this.socialRepository.findPostById(id);
    if (!post) {
      throw new BusinessException('Social post not found', 'SOCIAL_POST_001');
    }

    await this.socialRepository.deletePost(id, userId);

    await this.auditService.log({
      action: 'SOCIAL_POST_DELETED',
      module: 'social',
      resource: 'social_post',
      resourceId: id,
      userId,
    });
  }

  async restorePost(id: string, userId: string) {
    await this.socialRepository.restorePost(id, userId);
    await this.auditService.log({
      action: 'SOCIAL_POST_RESTORED',
      module: 'social',
      resource: 'social_post',
      resourceId: id,
      userId,
    });
  }

  // ─── S3 Media Attachment ─────────────────────────────────
  async attachMedia(postId: string, userId: string, mediaItems: any[]) {
    const post = await this.socialRepository.findPostById(postId);
    if (!post) {
      throw new BusinessException('Social post not found', 'SOCIAL_POST_001');
    }

    // Maximum 10 media items validation
    if (mediaItems.length > 10) {
      throw new BusinessException(
        'Maximum of 10 media files are allowed per post',
        'SOCIAL_MEDIA_001',
      );
    }

    // Verify S3 Key structure and object existence on S3
    for (const item of mediaItems) {
      const allowedPrefix =
        post.contentType === SocialPostContentType.REEL
          ? `social/reels/${postId}/`
          : `social/posts/${postId}/`;

      if (!item.s3Key.startsWith(allowedPrefix)) {
        throw new BusinessException(
          `Invalid S3 media path prefix: key must start with ${allowedPrefix}`,
          'SOCIAL_S3_002',
        );
      }

      // Check S3 existence (handle credentials failure gracefully for offline testing)
      try {
        const objectExists = await this.storageService.exists(item.s3Key);
        if (!objectExists) {
          throw new BusinessException(
            `Referenced S3 object does not exist: ${item.s3Key}`,
            'SOCIAL_S3_003',
          );
        }
      } catch (err: any) {
        if (err instanceof BusinessException) throw err;
        this.logger.warn(
          `S3 credentials unavailable or check failed: ${err.message}`,
          'SocialService',
        );
      }
    }

    await this.socialRepository.clearPostMedia(postId);
    const media = await this.socialRepository.attachPostMedia(
      postId,
      mediaItems,
    );

    await this.auditService.log({
      action: 'SOCIAL_MEDIA_ATTACHED',
      module: 'social',
      resource: 'social_post',
      resourceId: postId,
      userId,
      newValue: { mediaCount: mediaItems.length },
    });

    return media;
  }

  // ─── Product Tagging ─────────────────────────────────────
  async tagProducts(postId: string, userId: string, productTags: any[]) {
    const post = await this.socialRepository.findPostById(postId);
    if (!post) {
      throw new BusinessException('Social post not found', 'SOCIAL_POST_001');
    }

    // Validate tagged products
    for (const tag of productTags) {
      // Coordinate checks
      if (tag.tagX !== undefined && (tag.tagX < 0 || tag.tagX > 100)) {
        throw new BusinessException(
          'tagX must be between 0 and 100',
          'SOCIAL_TAG_001',
        );
      }
      if (tag.tagY !== undefined && (tag.tagY < 0 || tag.tagY > 100)) {
        throw new BusinessException(
          'tagY must be between 0 and 100',
          'SOCIAL_TAG_002',
        );
      }

      // Product existence verify
      const product = await this.prisma.product.findUnique({
        where: { id: tag.productId, deletedAt: null },
      });
      if (!product) {
        throw new BusinessException(
          `Product tagged with ID ${tag.productId} does not exist`,
          'SOCIAL_TAG_003',
        );
      }

      // Optional Variant existence check
      if (tag.variantId) {
        const variant = await this.prisma.productVariant.findUnique({
          where: {
            id: tag.variantId,
            productId: tag.productId,
            deletedAt: null,
          },
        });
        if (!variant) {
          throw new BusinessException(
            `Product variant tagged with ID ${tag.variantId} does not match product`,
            'SOCIAL_TAG_004',
          );
        }
      }
    }

    await this.socialRepository.clearPostProducts(postId);
    const tags = await this.socialRepository.attachPostProducts(
      postId,
      productTags,
    );

    await this.auditService.log({
      action: 'SOCIAL_PRODUCTS_UPDATED',
      module: 'social',
      resource: 'social_post',
      resourceId: postId,
      userId,
      newValue: { taggedCount: productTags.length },
    });

    return tags;
  }

  // ─── Interaction Router ──────────────────────────────────
  async interact(postId: string, userId: string, action: string, extra: any) {
    const post = await this.socialRepository.findPostById(postId);
    if (!post) {
      throw new BusinessException('Social post not found', 'SOCIAL_POST_001');
    }

    switch (action) {
      case SocialInteractionAction.LIKE:
        return this.socialRepository.toggleLike(postId, userId, true);
      case SocialInteractionAction.UNLIKE:
        return this.socialRepository.toggleLike(postId, userId, false);
      case SocialInteractionAction.SAVE:
        return this.socialRepository.toggleBookmark(postId, userId, true);
      case SocialInteractionAction.UNSAVE:
        return this.socialRepository.toggleBookmark(postId, userId, false);
      case SocialInteractionAction.SHARE:
        return this.socialRepository.trackShare(postId, userId, extra.channel);
      case SocialInteractionAction.VIEW:
        return this.socialRepository.trackView({
          postId,
          userId,
          guestId: extra.guestId,
          sessionId: extra.sessionId,
          viewType: 'VIEW',
        });
      case SocialInteractionAction.PLAY:
        return this.socialRepository.trackView({
          postId,
          userId,
          guestId: extra.guestId,
          sessionId: extra.sessionId,
          viewType: 'PLAY',
          watchDuration: extra.watchDuration,
          completionPercentage: extra.completionPercentage,
        });
      case SocialInteractionAction.COMPLETE:
        return this.socialRepository.trackView({
          postId,
          userId,
          guestId: extra.guestId,
          sessionId: extra.sessionId,
          viewType: 'COMPLETE',
        });
      default:
        throw new BusinessException(
          'Unsupported interaction action name',
          'SOCIAL_INT_001',
        );
    }
  }

  // ─── Presigned Upload URLs S3 ────────────────────────────
  async getUploadUrl(
    postId: string,
    type: 'IMAGE' | 'VIDEO',
    extension: string,
  ) {
    const post = await this.socialRepository.findPostById(postId);
    if (!post) {
      throw new BusinessException('Social post not found', 'SOCIAL_POST_001');
    }

    const uuid = crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(7);
    let filePath = '';

    if (post.contentType === SocialPostContentType.REEL) {
      filePath =
        type === 'VIDEO'
          ? `social/reels/${postId}/videos/${uuid}.${extension}`
          : `social/reels/${postId}/thumbnails/${uuid}.webp`;
    } else {
      filePath = `social/posts/${postId}/images/${uuid}.webp`;
    }

    const contentType = type === 'VIDEO' ? 'video/mp4' : 'image/webp';
    const signedUrl = await this.storageService.getSignedUploadUrl(
      filePath,
      contentType,
    );

    // Secure URL log filter
    const secureUrl = signedUrl.split('?')[0];
    this.logger.log(
      `Presigned upload URL generated for key: ${filePath} (Secure preview: ${secureUrl})`,
      'SocialService',
    );

    return {
      uploadUrl: signedUrl,
      s3Key: filePath,
      url: this.storageService.getPublicUrl(filePath),
    };
  }

  // ─── Comments ────────────────────────────────────────────
  async addComment(
    postId: string,
    userId: string,
    content: string,
    parentId?: string,
  ) {
    const post = await this.socialRepository.findPostById(postId);
    if (!post) {
      throw new BusinessException('Social post not found', 'SOCIAL_POST_001');
    }

    if (!post.allowComments) {
      throw new BusinessException(
        'Comments are disabled for this social post',
        'SOCIAL_COMMENT_001',
      );
    }

    // Limit nesting depth to 2 levels only
    if (parentId) {
      const parent = await this.socialRepository.findCommentById(parentId);
      if (!parent) {
        throw new BusinessException(
          'Parent comment does not exist',
          'SOCIAL_COMMENT_002',
        );
      }
      if (parent.parentId) {
        throw new BusinessException(
          'Replies are limited to exactly 2 levels deep',
          'SOCIAL_COMMENT_003',
        );
      }
    }

    return this.socialRepository.createComment(
      postId,
      userId,
      sanitizePlainText(content),
      parentId,
    );
  }

  async updateComment(commentId: string, userId: string, content: string) {
    const comment = await this.socialRepository.findCommentById(commentId);
    if (!comment) {
      throw new BusinessException('Comment not found', 'SOCIAL_COMMENT_004');
    }

    // Enforce owner verification
    if (comment.userId !== userId) {
      throw new BusinessException(
        'You are not authorized to edit this comment',
        'SOCIAL_COMMENT_005',
      );
    }

    return this.socialRepository.updateComment(commentId, sanitizePlainText(content));
  }

  async deleteComment(commentId: string, userId: string, userType: string) {
    const comment = await this.socialRepository.findCommentById(commentId);
    if (!comment) {
      throw new BusinessException('Comment not found', 'SOCIAL_COMMENT_004');
    }

    // Admins can delete any comment, customers can only delete their own
    if (
      userType !== 'ADMIN' &&
      userType !== 'SUPER_ADMIN' &&
      comment.userId !== userId
    ) {
      throw new BusinessException(
        'You are not authorized to delete this comment',
        'SOCIAL_COMMENT_005',
      );
    }

    return this.socialRepository.deleteComment(commentId);
  }

  async getComments(postId: string, query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    return this.socialRepository.getCommentsForPost(postId, page, limit);
  }

  // ─── Reporting ───────────────────────────────────────────
  async reportPost(
    postId: string,
    reporterId: string,
    reason: string,
    description?: string,
  ) {
    const post = await this.socialRepository.findPostById(postId);
    if (!post || post.status !== SocialPostStatus.PUBLISHED) {
      throw new BusinessException(
        'Active published social post not found',
        'SOCIAL_POST_001',
      );
    }

    // Prevent duplicate pending reports
    const existing = await this.socialRepository.findPendingReportByUser(
      postId,
      reporterId,
    );
    if (existing) {
      throw new BusinessException(
        'You have already submitted a pending report for this post',
        'SOCIAL_REPORT_001',
      );
    }

    return this.socialRepository.createReport(
      postId,
      reporterId,
      reason,
      description,
    );
  }

  // ─── Admin Moderation Reports ────────────────────────────
  async resolveReport(
    reportId: string,
    userId: string,
    action: 'DISMISS' | 'MARK_REVIEWED' | 'TAKE_ACTION',
    resolution?: string,
  ) {
    const report = await this.socialRepository.findReportById(reportId);
    if (!report) {
      throw new BusinessException(
        'Report entry not found',
        'SOCIAL_REPORT_002',
      );
    }

    const updates: any = {
      reviewedBy: userId,
      reviewedAt: new Date(),
      resolution,
    };

    if (action === 'DISMISS') {
      updates.status = SocialReportStatus.DISMISSED;
    } else if (action === 'MARK_REVIEWED') {
      updates.status = SocialReportStatus.REVIEWED;
    } else if (action === 'TAKE_ACTION') {
      updates.status = SocialReportStatus.ACTION_TAKEN;
      // Auto-hide the reported post
      await this.socialRepository.updatePost(report.postId, {
        visibility: SocialPostVisibility.HIDDEN,
        updatedBy: userId,
      });
    }

    const updatedReport = await this.socialRepository.updateReport(
      reportId,
      updates,
    );

    await this.auditService.log({
      action:
        action === 'TAKE_ACTION'
          ? 'SOCIAL_REPORT_ACTION_TAKEN'
          : 'SOCIAL_REPORT_REVIEWED',
      module: 'social',
      resource: 'social_report',
      resourceId: reportId,
      userId,
      newValue: updates,
    });

    return updatedReport;
  }

  // ─── Feed Builders ───────────────────────────────────────
  async getFeed(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    return this.socialRepository.getCustomerFeed({
      page,
      limit,
      search: query.search,
    });
  }

  async getReels(query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    return this.socialRepository.getCustomerReels({ page, limit });
  }

  async getTrending(query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    return this.socialRepository.getCustomerTrending({ page, limit });
  }

  async getSaved(userId: string, query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    return this.socialRepository.getSavedPosts(userId, page, limit);
  }

  async getAdminPosts(query: {
    contentType?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    return this.socialRepository.findAdminPosts({
      contentType: query.contentType,
      status: query.status,
      page,
      limit,
    });
  }

  async getAdminReports(query: {
    status?: string;
    reason?: string;
    postId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    return this.socialRepository.findAdminReports({
      status: query.status,
      reason: query.reason,
      postId: query.postId,
      page,
      limit,
    });
  }

  async getAnalyticsSummary() {
    const [aggregates, topPosts, totalPosts] = await Promise.all([
      this.prisma.socialPost.aggregate({
        where: { deletedAt: null },
        _sum: {
          likeCount: true,
          commentCount: true,
          saveCount: true,
          shareCount: true,
          viewCount: true,
          playCount: true,
        },
      }),
      this.prisma.socialPost.findMany({
        where: { deletedAt: null },
        take: 100,
        orderBy: [{ likeCount: 'desc' }, { commentCount: 'desc' }],
        select: {
          id: true,
          contentType: true,
          caption: true,
          likeCount: true,
          commentCount: true,
          saveCount: true,
          viewCount: true,
          playCount: true,
          createdAt: true,
        },
      }),
      this.prisma.socialPost.count({
        where: { deletedAt: null },
      }),
    ]);

    const sortedTopPosts = [...topPosts]
      .sort(
        (a, b) => b.likeCount + b.commentCount - (a.likeCount + a.commentCount),
      )
      .slice(0, 5);

    return {
      totalPosts,
      totalLikes: aggregates._sum.likeCount ?? 0,
      totalComments: aggregates._sum.commentCount ?? 0,
      totalSaves: aggregates._sum.saveCount ?? 0,
      totalShares: aggregates._sum.shareCount ?? 0,
      totalViews: aggregates._sum.viewCount ?? 0,
      totalPlays: aggregates._sum.playCount ?? 0,
      topPosts: sortedTopPosts,
    };
  }

  // ─── Follow System ─────────────────────────────────────
  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BusinessException('Cannot follow yourself', 'SOCIAL_FOLLOW_001');
    }

    const existing = await this.prisma.socialFollow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (existing) return existing;

    return this.prisma.socialFollow.create({
      data: { followerId, followingId },
    });
  }

  async unfollow(followerId: string, followingId: string) {
    return this.prisma.socialFollow.deleteMany({
      where: { followerId, followingId },
    });
  }

  async getFollowers(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.socialFollow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.socialFollow.count({ where: { followingId: userId } }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  }

  async getFollowing(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.socialFollow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.socialFollow.count({ where: { followerId: userId } }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  }

  async isFollowing(followerId: string, followingId: string) {
    const follow = await this.prisma.socialFollow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return !!follow;
  }

  async getFollowCounts(userId: string) {
    const [followers, following] = await Promise.all([
      this.prisma.socialFollow.count({ where: { followingId: userId } }),
      this.prisma.socialFollow.count({ where: { followerId: userId } }),
    ]);
    return { followers, following };
  }

  // ─── Block / Mute ─────────────────────────────────────
  async blockUser(blockerId: string, blockedId: string, reason?: string) {
    if (blockerId === blockedId) throw new BusinessException('Cannot block yourself', 'SOCIAL_BLOCK_001');
    await this.unfollow(blockerId, blockedId);
    await this.unfollow(blockedId, blockerId);
    return this.prisma.socialBlockedUser.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      update: { reason },
      create: { blockerId, blockedId, reason },
    });
  }

  async unblockUser(blockerId: string, blockedId: string) {
    return this.prisma.socialBlockedUser.deleteMany({ where: { blockerId, blockedId } });
  }

  async getBlockedUsers(blockerId: string) {
    return this.prisma.socialBlockedUser.findMany({
      where: { blockerId },
      include: { blocked: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async isBlocked(blockerId: string, blockedId: string) {
    const block = await this.prisma.socialBlockedUser.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    return !!block;
  }

  async muteUser(muterId: string, mutedId: string) {
    if (muterId === mutedId) throw new BusinessException('Cannot mute yourself', 'SOCIAL_MUTE_001');
    return this.prisma.socialMutedUser.upsert({
      where: { muterId_mutedId: { muterId, mutedId } },
      update: {},
      create: { muterId, mutedId },
    });
  }

  async unmuteUser(muterId: string, mutedId: string) {
    return this.prisma.socialMutedUser.deleteMany({ where: { muterId, mutedId } });
  }

  async getMutedUsers(muterId: string) {
    return this.prisma.socialMutedUser.findMany({
      where: { muterId },
      include: { muted: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Moderation: Blocked Keywords ─────────────────────
  async checkBlockedKeywords(text: string): Promise<string[]> {
    const keywords = await this.prisma.blockedKeyword.findMany({
      where: { isActive: true },
    });
    const lower = text.toLowerCase();
    return keywords
      .filter((k) => lower.includes(k.keyword.toLowerCase()))
      .map((k) => k.keyword);
  }

  async addBlockedKeyword(keyword: string, category: string, createdBy: string) {
    return this.socialRepository.addBlockedKeyword(keyword, category, createdBy);
  }

  async getBlockedKeywords() {
    return this.socialRepository.getBlockedKeywords();
  }

  async removeBlockedKeyword(id: string) {
    return this.socialRepository.removeBlockedKeyword(id);
  }
}
