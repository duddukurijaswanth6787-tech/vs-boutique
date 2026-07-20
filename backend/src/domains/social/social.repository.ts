import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  SocialPostStatus,
  SocialPostVisibility,
  SocialPostContentType,
  SocialReportStatus,
} from './social.types';

@Injectable()
export class SocialRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Posts CRUD ──────────────────────────────────────────
  async createPost(data: {
    authorId: string;
    contentType: string;
    caption?: string;
    hashtags?: string[];
    visibility?: string;
    allowComments?: boolean;
    createdBy?: string;
  }) {
    return this.prisma.socialPost.create({
      data: {
        authorId: data.authorId,
        contentType: data.contentType as any,
        caption: data.caption,
        hashtags: data.hashtags || [],
        visibility: (data.visibility || 'PUBLIC') as any,
        allowComments: data.allowComments ?? true,
        createdBy: data.createdBy,
      },
    });
  }

  async findPostById(id: string) {
    return this.prisma.socialPost.findFirst({
      where: { id, deletedAt: null },
      include: {
        media: {
          orderBy: { displayOrder: 'asc' },
        },
        products: {
          orderBy: { displayOrder: 'asc' },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                basePrice: true,
                salePrice: true,
                media: {
                  where: { isPrimary: true },
                  select: { url: true },
                  take: 1,
                },
              },
            },
            variant: {
              select: {
                id: true,
                title: true,
                sku: true,
                priceOverride: true,
                salePriceOverride: true,
              },
            },
          },
        },
      },
    });
  }

  async updatePost(id: string, data: any) {
    return this.prisma.socialPost.update({
      where: { id },
      data,
    });
  }

  async deletePost(id: string, userId: string) {
    return this.prisma.socialPost.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  async restorePost(id: string, userId: string) {
    return this.prisma.socialPost.update({
      where: { id },
      data: {
        deletedAt: null,
        updatedBy: userId,
      },
    });
  }

  // ─── Media Attachment ────────────────────────────────────
  async clearPostMedia(postId: string) {
    return this.prisma.socialPostMedia.deleteMany({
      where: { postId },
    });
  }

  async attachPostMedia(postId: string, mediaItems: any[]) {
    return this.prisma.$transaction(
      mediaItems.map((item) =>
        this.prisma.socialPostMedia.create({
          data: {
            postId,
            mediaType: item.mediaType,
            s3Key: item.s3Key,
            url: item.url,
            thumbnailUrl: item.thumbnailUrl,
            mediumUrl: item.mediumUrl,
            largeUrl: item.largeUrl,
            mimeType: item.mimeType,
            size: item.size,
            width: item.width,
            height: item.height,
            duration: item.duration,
            displayOrder: item.displayOrder ?? 0,
            altText: item.altText,
          },
        }),
      ),
    );
  }

  // ─── Product Tagging ─────────────────────────────────────
  async clearPostProducts(postId: string) {
    return this.prisma.socialPostProduct.deleteMany({
      where: { postId },
    });
  }

  async attachPostProducts(postId: string, productTags: any[]) {
    return this.prisma.$transaction(
      productTags.map((tag) =>
        this.prisma.socialPostProduct.create({
          data: {
            postId,
            productId: tag.productId,
            variantId: tag.variantId || null,
            displayOrder: tag.displayOrder ?? 0,
            tagX: tag.tagX,
            tagY: tag.tagY,
            label: tag.label,
          },
        }),
      ),
    );
  }

  // ─── Likes Transaction ───────────────────────────────────
  async toggleLike(postId: string, userId: string, isLike: boolean) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.socialLike.findUnique({
        where: { postId_userId: { postId, userId } },
      });

      if (isLike) {
        if (!existing) {
          await tx.socialLike.create({
            data: { postId, userId },
          });
          return tx.socialPost.update({
            where: { id: postId },
            data: {
              likeCount: { increment: 1 },
            },
          });
        }
      } else {
        if (existing) {
          await tx.socialLike.delete({
            where: { postId_userId: { postId, userId } },
          });
          return tx.socialPost.update({
            where: { id: postId },
            data: {
              likeCount: { decrement: 1 },
            },
          });
        }
      }
      return tx.socialPost.findUnique({ where: { id: postId } });
    });
  }

  async hasUserLiked(postId: string, userId: string): Promise<boolean> {
    const like = await this.prisma.socialLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    return !!like;
  }

  // ─── Bookmarks Transaction ────────────────────────────────
  async toggleBookmark(postId: string, userId: string, isSave: boolean) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.socialBookmark.findUnique({
        where: { postId_userId: { postId, userId } },
      });

      if (isSave) {
        if (!existing) {
          await tx.socialBookmark.create({
            data: { postId, userId },
          });
          return tx.socialPost.update({
            where: { id: postId },
            data: {
              saveCount: { increment: 1 },
            },
          });
        }
      } else {
        if (existing) {
          await tx.socialBookmark.delete({
            where: { postId_userId: { postId, userId } },
          });
          return tx.socialPost.update({
            where: { id: postId },
            data: {
              saveCount: { decrement: 1 },
            },
          });
        }
      }
      return tx.socialPost.findUnique({ where: { id: postId } });
    });
  }

  async hasUserSaved(postId: string, userId: string): Promise<boolean> {
    const bookmark = await this.prisma.socialBookmark.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    return !!bookmark;
  }

  // ─── Comments & Replies ──────────────────────────────────
  async createComment(
    postId: string,
    userId: string,
    content: string,
    parentId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const comment = await tx.socialComment.create({
        data: {
          postId,
          userId,
          parentId: parentId || null,
          content,
        },
      });

      await tx.socialPost.update({
        where: { id: postId },
        data: {
          commentCount: { increment: 1 },
        },
      });

      return comment;
    });
  }

  async findCommentById(id: string) {
    return this.prisma.socialComment.findUnique({
      where: { id },
    });
  }

  async updateComment(id: string, content: string) {
    return this.prisma.socialComment.update({
      where: { id },
      data: { content },
    });
  }

  async deleteComment(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const comment = await tx.socialComment.findUnique({ where: { id } });
      if (!comment || comment.deletedAt) return null;

      const updated = await tx.socialComment.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await tx.socialPost.update({
        where: { id: comment.postId },
        data: {
          commentCount: { decrement: 1 },
        },
      });

      return updated;
    });
  }

  async getCommentsForPost(postId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    // Load top-level comments and fetch direct nested replies (one level only)
    const [comments, total] = await Promise.all([
      this.prisma.socialComment.findMany({
        where: { postId, parentId: null, deletedAt: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          replies: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'asc' },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.socialComment.count({
        where: { postId, parentId: null, deletedAt: null },
      }),
    ]);

    return {
      data: comments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  // ─── Share Tracking ──────────────────────────────────────
  async trackShare(postId: string, userId?: string, channel?: string) {
    return this.prisma.$transaction(async (tx) => {
      const share = await tx.socialShare.create({
        data: {
          postId,
          userId: userId || null,
          channel: channel || null,
        },
      });

      await tx.socialPost.update({
        where: { id: postId },
        data: {
          shareCount: { increment: 1 },
        },
      });

      return share;
    });
  }

  // ─── View Tracking ───────────────────────────────────────
  async trackView(params: {
    postId: string;
    userId?: string;
    guestId?: string;
    sessionId?: string;
    viewType: string;
    watchDuration?: number;
    completionPercentage?: number;
  }) {
    const {
      postId,
      userId,
      guestId,
      sessionId,
      viewType,
      watchDuration,
      completionPercentage,
    } = params;

    // View deduplication check within 15 minutes window
    const timeWindow = new Date(Date.now() - 15 * 60 * 1000);
    const existing = await this.prisma.socialView.findFirst({
      where: {
        postId,
        viewType,
        createdAt: { gte: timeWindow },
        ...(userId && { userId }),
        ...(!userId && guestId && { guestId }),
        ...(!userId && !guestId && sessionId && { sessionId }),
      },
    });

    if (existing) {
      return null;
    }

    return this.prisma.$transaction(async (tx) => {
      const view = await tx.socialView.create({
        data: {
          postId,
          userId: userId || null,
          guestId: guestId || null,
          sessionId: sessionId || null,
          viewType,
          watchDuration,
          completionPercentage,
        },
      });

      const updateField =
        viewType === 'PLAY' || viewType === 'COMPLETE'
          ? 'playCount'
          : 'viewCount';
      await tx.socialPost.update({
        where: { id: postId },
        data: {
          [updateField]: { increment: 1 },
        },
      });

      return view;
    });
  }

  // ─── Reports ─────────────────────────────────────────────
  async findPendingReportByUser(postId: string, reporterId: string) {
    return this.prisma.socialReport.findFirst({
      where: {
        postId,
        reporterId,
        status: SocialReportStatus.PENDING,
      },
    });
  }

  async createReport(
    postId: string,
    reporterId: string,
    reason: string,
    description?: string,
  ) {
    return this.prisma.socialReport.create({
      data: {
        postId,
        reporterId,
        reason: reason as any,
        description,
      },
    });
  }

  // ─── Feed Queries ────────────────────────────────────────
  async getCustomerFeed(params: {
    page: number;
    limit: number;
    search?: string;
  }) {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      status: SocialPostStatus.PUBLISHED,
      visibility: SocialPostVisibility.PUBLIC,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { caption: { contains: search, mode: 'insensitive' } },
        { hashtags: { has: search.toLowerCase() } },
      ];
    }

    const [posts, total] = await Promise.all([
      this.prisma.socialPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isPinned: 'desc' },
          { isFeatured: 'desc' },
          { publishedAt: 'desc' },
        ],
        include: {
          media: { orderBy: { displayOrder: 'asc' } },
          products: {
            orderBy: { displayOrder: 'asc' },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  basePrice: true,
                  salePrice: true,
                  media: {
                    where: { isPrimary: true },
                    select: { url: true },
                    take: 1,
                  },
                },
              },
              variant: {
                select: {
                  id: true,
                  title: true,
                  sku: true,
                  priceOverride: true,
                  salePriceOverride: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.socialPost.count({ where }),
    ]);

    return {
      data: posts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  async getCustomerReels(params: { page: number; limit: number }) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const where = {
      contentType: SocialPostContentType.REEL,
      status: SocialPostStatus.PUBLISHED,
      visibility: SocialPostVisibility.PUBLIC,
      deletedAt: null,
    };

    const [posts, total] = await Promise.all([
      this.prisma.socialPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: {
          media: { orderBy: { displayOrder: 'asc' } },
          products: {
            orderBy: { displayOrder: 'asc' },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  basePrice: true,
                  salePrice: true,
                  media: {
                    where: { isPrimary: true },
                    select: { url: true },
                    take: 1,
                  },
                },
              },
              variant: {
                select: {
                  id: true,
                  title: true,
                  sku: true,
                  priceOverride: true,
                  salePriceOverride: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.socialPost.count({ where }),
    ]);

    return {
      data: posts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  async getCustomerTrending(params: { page: number; limit: number }) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const where = {
      status: SocialPostStatus.PUBLISHED,
      visibility: SocialPostVisibility.PUBLIC,
      deletedAt: null,
    };

    // Calculate a simple engagement score using query order:
    // (likeCount * 5 + commentCount * 10 + shareCount * 8 + saveCount * 12 + viewCount * 0.1)
    // In database order, we sort by likeCount + commentCount + shareCount + saveCount descending
    const [posts, total] = await Promise.all([
      this.prisma.socialPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { likeCount: 'desc' },
          { commentCount: 'desc' },
          { shareCount: 'desc' },
          { saveCount: 'desc' },
        ],
        include: {
          media: { orderBy: { displayOrder: 'asc' } },
          products: {
            orderBy: { displayOrder: 'asc' },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  basePrice: true,
                  salePrice: true,
                  media: {
                    where: { isPrimary: true },
                    select: { url: true },
                    take: 1,
                  },
                },
              },
              variant: {
                select: {
                  id: true,
                  title: true,
                  sku: true,
                  priceOverride: true,
                  salePriceOverride: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.socialPost.count({ where }),
    ]);

    return {
      data: posts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  async getSavedPosts(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      this.prisma.socialBookmark.findMany({
        where: {
          userId,
          post: {
            deletedAt: null,
            visibility: SocialPostVisibility.PUBLIC,
            status: SocialPostStatus.PUBLISHED,
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          post: {
            include: {
              media: { orderBy: { displayOrder: 'asc' } },
              products: {
                orderBy: { displayOrder: 'asc' },
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      basePrice: true,
                      salePrice: true,
                      media: {
                        where: { isPrimary: true },
                        select: { url: true },
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.socialBookmark.count({
        where: {
          userId,
          post: {
            deletedAt: null,
            visibility: SocialPostVisibility.PUBLIC,
            status: SocialPostStatus.PUBLISHED,
          },
        },
      }),
    ]);

    return {
      data: bookmarks.map((b) => b.post),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  // ─── Admin Listing ───────────────────────────────────────
  async findAdminPosts(params: {
    contentType?: string;
    status?: string;
    page: number;
    limit: number;
  }) {
    const { contentType, status, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };

    if (contentType) where.contentType = contentType;
    if (status) where.status = status;

    const [posts, total] = await Promise.all([
      this.prisma.socialPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          media: { orderBy: { displayOrder: 'asc' } },
        },
      }),
      this.prisma.socialPost.count({ where }),
    ]);

    return {
      data: posts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  // ─── Moderation Reports ──────────────────────────────────
  async findAdminReports(params: {
    status?: string;
    reason?: string;
    postId?: string;
    page: number;
    limit: number;
  }) {
    const { status, reason, postId, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) where.status = status;
    if (reason) where.reason = reason;
    if (postId) where.postId = postId;

    const [reports, total] = await Promise.all([
      this.prisma.socialReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          post: {
            select: { id: true, contentType: true, caption: true },
          },
          reporter: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.socialReport.count({ where }),
    ]);

    return {
      data: reports,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  async findReportById(id: string) {
    return this.prisma.socialReport.findUnique({
      where: { id },
    });
  }

  async updateReport(id: string, data: any) {
    return this.prisma.socialReport.update({
      where: { id },
      data,
    });
  }

  // ─── Blocked Keywords ─────────────────────────────────
  async addBlockedKeyword(keyword: string, category: string, createdBy: string) {
    return this.prisma.blockedKeyword.upsert({
      where: { keyword },
      update: { category, isActive: true },
      create: { keyword, category, createdBy },
    });
  }

  async getBlockedKeywords() {
    return this.prisma.blockedKeyword.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async removeBlockedKeyword(id: string) {
    return this.prisma.blockedKeyword.delete({ where: { id } });
  }
}
