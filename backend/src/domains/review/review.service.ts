import { Injectable } from '@nestjs/common';
import { LoggerService } from '@common/logger/logger.service';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { AppEventEmitter } from '@common/events/event-emitter.service';
import { sanitizePlainText } from '@common/utils/sanitize';
import { ReviewRepository } from './review.repository';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewQueryDto,
  ReviewResponse,
  ReviewImageResponse,
} from './review.types';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class ReviewService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly auditService: AuditService,
    private readonly loggerService: LoggerService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: AppEventEmitter,
  ) {}

  private toImageResponse(img: any): ReviewImageResponse {
    return {
      id: img.id,
      url: img.url,
      altText: img.altText ?? undefined,
      displayOrder: img.displayOrder,
    };
  }

  private toResponse(r: any): ReviewResponse {
    return {
      id: r.id,
      productId: r.productId,
      customerId: r.customerId,
      rating: r.rating,
      title: r.title ?? undefined,
      comment: r.comment ?? undefined,
      isVerifiedPurchase: r.isVerifiedPurchase,
      isApproved: r.isApproved,
      helpfulCount: r.helpfulCount,
      unhelpfulCount: r.unhelpfulCount,
      status: r.status,
      images: r.images?.map((img: any) => this.toImageResponse(img)),
      createdAt: r.createdAt,
    };
  }

  async findAll(query: ReviewQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.reviewRepository.findAll({
      productId: query.productId,
      customerId: query.customerId,
      rating: query.rating,
      status: query.status,
      page,
      limit,
    });
    return {
      data: result.data.map((r: any) => this.toResponse(r)),
      meta: result.meta,
    };
  }

  async findById(id: string) {
    const review = await this.reviewRepository.findById(id);
    if (!review || review.deletedAt)
      throw new BusinessException('Review not found', 'REVIEW_001');
    return this.toResponse(review);
  }

  async create(userId: string, dto: CreateReviewDto) {
    if (dto.title) dto.title = sanitizePlainText(dto.title);
    if (dto.comment) dto.comment = sanitizePlainText(dto.comment);
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product)
      throw new BusinessException('Product not found', 'PRODUCT_001');

    const existing = await this.prisma.review.findUnique({
      where: {
        productId_customerId: { productId: dto.productId, customerId: userId },
      },
    });
    if (existing && !existing.deletedAt)
      throw new BusinessException('Review already exists', 'REVIEW_002');

    const review = await this.reviewRepository.create({
      product: { connect: { id: dto.productId } },
      customer: { connect: { id: userId } },
      rating: dto.rating,
      title: dto.title,
      comment: dto.comment,
      createdBy: userId,
    });

    if (dto.images?.length) {
      for (let i = 0; i < dto.images.length; i++) {
        await this.reviewRepository.createImage({
          review: { connect: { id: review.id } },
          url: dto.images[i],
          displayOrder: i,
        });
      }
    }

    await this.auditService.log({
      action: 'REVIEW_CREATED',
      module: 'reviews',
      resource: 'review',
      resourceId: review.id,
      userId,
      newValue: { productId: dto.productId, rating: dto.rating },
    });
    this.loggerService.log(
      { action: 'review_created', reviewId: review.id },
      'ReviewService',
    );
    this.eventEmitter.emit('cache.invalidate.product.details', {
      productId: dto.productId,
    });
    return this.findById(review.id);
  }

  async update(id: string, dto: UpdateReviewDto, userId: string) {
    if (dto.title) dto.title = sanitizePlainText(dto.title);
    if (dto.comment) dto.comment = sanitizePlainText(dto.comment);
    const review = await this.reviewRepository.findById(id);
    if (!review || review.deletedAt)
      throw new BusinessException('Review not found', 'REVIEW_001');
    if (review.customerId !== userId)
      throw new BusinessException('Not authorized', 'REVIEW_003');

    await this.reviewRepository.update(id, {
      rating: dto.rating,
      title: dto.title,
      comment: dto.comment,
      updatedBy: userId,
    });
    await this.auditService.log({
      action: 'REVIEW_UPDATED',
      module: 'reviews',
      resource: 'review',
      resourceId: id,
      userId,
      oldValue: { rating: review.rating },
      newValue: { ...dto },
    });
    this.loggerService.log(
      { action: 'review_updated', reviewId: id },
      'ReviewService',
    );
    this.eventEmitter.emit('cache.invalidate.product.details', {
      productId: review.productId,
    });
    return this.findById(id);
  }

  async approve(id: string, userId: string) {
    const review = await this.reviewRepository.findById(id);
    if (!review || review.deletedAt)
      throw new BusinessException('Review not found', 'REVIEW_001');

    await this.reviewRepository.update(id, {
      isApproved: true,
      status: 'APPROVED',
      updatedBy: userId,
    });
    await this.auditService.log({
      action: 'REVIEW_APPROVED',
      module: 'reviews',
      resource: 'review',
      resourceId: id,
      userId,
    });
    this.loggerService.log(
      { action: 'review_approved', reviewId: id },
      'ReviewService',
    );
    this.eventEmitter.emit('cache.invalidate.product.details', {
      productId: review.productId,
    });
    return this.findById(id);
  }

  async reject(id: string, userId: string) {
    const review = await this.reviewRepository.findById(id);
    if (!review || review.deletedAt)
      throw new BusinessException('Review not found', 'REVIEW_001');

    await this.reviewRepository.update(id, {
      isApproved: false,
      status: 'REJECTED',
      updatedBy: userId,
    });
    await this.auditService.log({
      action: 'REVIEW_REJECTED',
      module: 'reviews',
      resource: 'review',
      resourceId: id,
      userId,
    });
    this.loggerService.log(
      { action: 'review_rejected', reviewId: id },
      'ReviewService',
    );
    this.eventEmitter.emit('cache.invalidate.product.details', {
      productId: review.productId,
    });
    return this.findById(id);
  }

  async vote(reviewId: string, userId: string, isHelpful: boolean) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review || review.deletedAt)
      throw new BusinessException('Review not found', 'REVIEW_001');

    await this.reviewRepository.vote(reviewId, userId, isHelpful);

    const votes = await this.prisma.reviewVote.findMany({
      where: { reviewId },
    });
    const helpfulCount = votes.filter((v) => v.isHelpful).length;
    const unhelpfulCount = votes.filter((v) => !v.isHelpful).length;

    await this.reviewRepository.update(reviewId, {
      helpfulCount,
      unhelpfulCount,
    });
    this.eventEmitter.emit('cache.invalidate.product.details', {
      productId: review.productId,
    });
    return this.findById(reviewId);
  }

  async getProductRatingSummary(productId: string) {
    return this.reviewRepository.getProductRatingSummary(productId);
  }
}
