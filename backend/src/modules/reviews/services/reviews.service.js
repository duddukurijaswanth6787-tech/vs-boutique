const prisma = require('../../../utils/prisma');
const reviewsRepository = require('../repositories/reviews.repository');
const { logAction } = require('../../../services/auditService');
const { validateSubscriptionLimit } = require('../../../services/subscriptionService');
const { eventBus, Events } = require('../../../services/eventBus');

class ProductReviewError extends Error {
  constructor(message, status = 400, code = 'REVIEW_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// In-Memory Cache for Public Boutique Reviews (60s TTL)
const reviewsCache = new Map();

class ReviewsService {
  // ── Boutique Reviews Recalculation ──
  async recalculateBoutiqueRating(boutiqueId) {
    try {
      const result = await reviewsRepository.aggregateBoutiqueReviews({
        boutiqueId,
        moderationStatus: 'APPROVED'
      });

      const averageRating = result._avg.rating ? parseFloat(Number(result._avg.rating).toFixed(2)) : 0.00;
      const reviewsCount = result._count.id;

      await reviewsRepository.updateBoutiqueRating(boutiqueId, averageRating, reviewsCount);
    } catch (err) {
      console.error('Error recalculating boutique rating:', err);
    }
  }

  // ── Boutique Reviews Core Methods ──
  async createBoutiqueReview(body, user, ipAddress) {
    const {
      boutiqueId,
      rating,
      ratingStitching,
      ratingMeasurement,
      ratingDelivery,
      ratingCommunication,
      ratingValue,
      comment,
      orderId,
      reviewImages
    } = body;

    let userId = body.userId;
    if (!userId && user) {
      if (user.role !== 'super-admin' && user.role !== 'owner') {
        userId = user.id;
      }
    }

    if (!userId && orderId) {
      const order = await reviewsRepository.findOrderUnique(orderId);
      if (order) {
        const u = await reviewsRepository.findUserFirst({ phone: order.customerPhone });
        if (u) {
          userId = u.id;
        }
      }
    }

    if (!boutiqueId || !rating) {
      throw { status: 400, message: 'Boutique ID and Rating are required' };
    }

    await validateSubscriptionLimit(boutiqueId, 'canManageReviews');

    if (!userId) {
      throw { status: 400, message: 'Customer User ID is required. Please sign in or register to submit a review.' };
    }

    if (orderId) {
      const existingReview = await reviewsRepository.findBoutiqueReviewFirst({ orderId });
      if (existingReview) {
        throw { status: 400, message: 'Duplicate review detected. You have already reviewed this order.' };
      }
    }

    let verifiedPurchase = false;
    if (orderId) {
      const order = await reviewsRepository.findOrderUnique(orderId);
      if (order && order.orderStatus === 'delivered') {
        verifiedPurchase = true;
      }
    }

    let isSuspicious = false;
    let suspiciousReason = null;

    if (userId) {
      const u = await prisma.user.findUnique({ where: { id: userId } });
      if (u && u.status === 'BLOCKED') {
        isSuspicious = true;
        suspiciousReason = 'User account is flagged or blocked';
      }
    }

    if (comment && comment.trim().length > 0) {
      const duplicateCommentText = await reviewsRepository.findBoutiqueReviewFirst({
        boutiqueId,
        comment: { equals: comment.trim() }
      });
      if (duplicateCommentText) {
        isSuspicious = true;
        suspiciousReason = 'Duplicate review comment text template detected (possible bot spam)';
      }
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentSubmissionsCount = await reviewsRepository.countBoutiqueReviews({
      ipAddress,
      createdAt: { gte: fiveMinutesAgo }
    });
    if (recentSubmissionsCount >= 3) {
      isSuspicious = true;
      suspiciousReason = 'High frequency submissions from the same IP address';
    }

    const moderationStatus = isSuspicious ? 'FLAGGED' : 'APPROVED';

    const review = await reviewsRepository.createBoutiqueReview({
      boutiqueId,
      userId,
      orderId,
      rating: parseInt(rating),
      ratingStitching: ratingStitching ? parseInt(ratingStitching) : null,
      ratingMeasurement: ratingMeasurement ? parseInt(ratingMeasurement) : null,
      ratingDelivery: ratingDelivery ? parseInt(ratingDelivery) : null,
      ratingCommunication: ratingCommunication ? parseInt(ratingCommunication) : null,
      ratingValue: ratingValue ? parseInt(ratingValue) : null,
      comment,
      verifiedPurchase,
      reviewImages: reviewImages || [],
      moderationStatus,
      isSuspicious,
      suspiciousReason,
      ipAddress,
      createdAt: new Date()
    });

    if (moderationStatus === 'APPROVED') {
      await this.recalculateBoutiqueRating(boutiqueId);
    }

    reviewsCache.delete(boutiqueId);

    return review;
  }

  async listBoutiqueReviews(boutiqueId) {
    const tStart = Date.now();
    const cacheTTL = 60 * 1000;
    const now = Date.now();

    if (reviewsCache.has(boutiqueId)) {
      const cached = reviewsCache.get(boutiqueId);
      if (now - cached.timestamp < cacheTTL) {
        const totalTime = Date.now() - tStart;
        console.log(`[AUDIT] GET /reviews/boutique/${boutiqueId} - [CACHE HIT] Cache Age: ${now - cached.timestamp}ms, DB Query: 0ms, Serialization: 0ms, Controller: 0ms, Total Execution: ${totalTime}ms`);
        return JSON.parse(cached.data);
      }
    }

    const dbStart = Date.now();
    const [boutique, reviews] = await Promise.all([
      reviewsRepository.findBoutiqueFirst({ id: boutiqueId, isDeleted: false }),
      reviewsRepository.findBoutiqueReviews({
        boutiqueId,
        moderationStatus: 'APPROVED'
      }, {
        user: { select: { name: true } }
      }, { createdAt: 'desc' })
    ]);
    const dbTime = Date.now() - dbStart;

    if (!boutique) {
      throw { status: 404, message: 'Boutique not found' };
    }

    if (boutique.isSuspended) {
      throw { status: 403, message: 'Access Denied: This boutique is suspended.' };
    }

    const serializeStart = Date.now();
    const responseData = { success: true, data: reviews || [] };
    const jsonStr = JSON.stringify(responseData);
    const serializeTime = Date.now() - serializeStart;

    reviewsCache.set(boutiqueId, {
      data: jsonStr,
      timestamp: Date.now()
    });

    const totalTime = Date.now() - tStart;
    const controllerTime = totalTime - dbTime - serializeTime;
    console.log(`[AUDIT] GET /reviews/boutique/${boutiqueId} - [CACHE MISS] DB Query: ${dbTime}ms, Serialization: ${serializeTime}ms, Controller: ${controllerTime}ms, Total Execution: ${totalTime}ms`);

    return responseData;
  }

  async listReviewsAdmin(query) {
    const { status, isSuspicious, page = 1, limit = 10 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where = {};
    if (status) where.moderationStatus = status;
    if (isSuspicious === 'true') where.isSuspicious = true;

    const reviews = await prisma.review.findMany({
      where,
      include: {
        boutique: { select: { name: true } },
        user: { select: { name: true, phone: true } }
      },
      skip,
      take: parseInt(limit),
      orderBy: [
        { isSuspicious: 'desc' },
        { reportCount: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    const total = await reviewsRepository.countBoutiqueReviews(where);

    return {
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: reviews
    };
  }

  async listOwnerReviews(boutiqueId, query) {
    if (!boutiqueId) {
      throw { status: 400, message: 'Owner has no boutique assigned' };
    }

    const { page = 1, limit = 10 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await reviewsRepository.findBoutiqueReviews({ boutiqueId }, {
      user: { select: { name: true } }
    }, { createdAt: 'desc' }, skip, parseInt(limit));

    const total = await reviewsRepository.countBoutiqueReviews({ boutiqueId });

    return {
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: reviews
    };
  }

  async moderateReviewAdmin(id, moderationStatus, userId) {
    if (!['PENDING', 'APPROVED', 'REJECTED', 'FLAGGED'].includes(moderationStatus)) {
      throw { status: 400, message: 'Invalid moderation status. Use PENDING, APPROVED, REJECTED, or FLAGGED' };
    }

    const review = await reviewsRepository.findBoutiqueReviewUnique(id);
    if (!review) {
      throw { status: 404, message: 'Review not found' };
    }

    const updatedReview = await reviewsRepository.updateBoutiqueReview(id, { moderationStatus });

    await logAction(
      'MODERATE_REVIEW',
      'Review',
      id,
      userId,
      { before: review.moderationStatus, after: moderationStatus }
    );

    await this.recalculateBoutiqueRating(review.boutiqueId);

    reviewsCache.delete(review.boutiqueId);

    return updatedReview;
  }

  async replyToReviewOwner(id, reply, user) {
    if (!reply || reply.trim().length === 0) {
      throw { status: 400, message: 'Reply text cannot be blank' };
    }

    const review = await reviewsRepository.findBoutiqueReviewUnique(id);
    if (!review) {
      throw { status: 404, message: 'Review not found' };
    }

    if (user.role === 'owner' && user.assignedBoutiqueId !== review.boutiqueId) {
      throw { status: 403, message: 'You are not authorized to reply to reviews for other boutiques' };
    }

    const updatedReview = await reviewsRepository.updateBoutiqueReview(id, { reply: reply.trim() });

    reviewsCache.delete(review.boutiqueId);

    return updatedReview;
  }

  async reportReviewCustomer(id) {
    const review = await reviewsRepository.findBoutiqueReviewUnique(id);
    if (!review) {
      throw { status: 404, message: 'Review not found' };
    }

    const newReportCount = review.reportCount + 1;
    const updatedReview = await reviewsRepository.updateBoutiqueReview(id, {
      reportCount: newReportCount,
      moderationStatus: newReportCount >= 5 ? 'FLAGGED' : review.moderationStatus
    });

    reviewsCache.delete(review.boutiqueId);
  }

  async getReviewStats() {
    const aggregates = await reviewsRepository.aggregateBoutiqueReviews({ moderationStatus: 'APPROVED' });

    const ratingsGroup = await prisma.review.groupBy({
      by: ['rating'],
      where: { moderationStatus: 'APPROVED' },
      _count: { id: true }
    });

    const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingsGroup.forEach(g => {
      if (starCounts[g.rating] !== undefined) {
        starCounts[g.rating] = g._count.id;
      }
    });

    return {
      success: true,
      stats: {
        totalApproved: aggregates._count.id,
        averageOverall: aggregates._avg.rating ? parseFloat(aggregates._avg.rating.toFixed(2)) : 0,
        averageStitching: aggregates._avg.ratingStitching ? parseFloat(aggregates._avg.ratingStitching.toFixed(2)) : 0,
        averageMeasurement: aggregates._avg.ratingMeasurement ? parseFloat(aggregates._avg.ratingMeasurement.toFixed(2)) : 0,
        averageDelivery: aggregates._avg.ratingDelivery ? parseFloat(aggregates._avg.ratingDelivery.toFixed(2)) : 0,
        averageCommunication: aggregates._avg.ratingCommunication ? parseFloat(aggregates._avg.ratingCommunication.toFixed(2)) : 0,
        averageValue: aggregates._avg.ratingValue ? parseFloat(aggregates._avg.ratingValue.toFixed(2)) : 0,
        starCounts
      }
    };
  }

  // ── Product Reviews Core Methods (sync rating, validations, and operations) ──
  async syncProductRating(productId) {
    const agg = await reviewsRepository.aggregateProductReviews({ productId, status: 'APPROVED' });
    const averageRating = agg._avg.rating ? Math.round(agg._avg.rating * 100) / 100 : 0;
    const reviewCount = agg._count.id;
    // Let's correct this. Rating is updated on Product Model!
    await prisma.product.update({
      where: { id: productId },
      data: { averageRating, reviewCount }
    });
    return { averageRating, reviewCount };
  }

  async validateDeliveredOrder(userId, productId) {
    const deliveredOrder = await reviewsRepository.findCommerceOrderFirst({
      userId,
      status: 'DELIVERED',
      items: { some: { productId } }
    });
    return deliveredOrder;
  }

  async canReviewProduct(userId, productId) {
    const existing = await reviewsRepository.findProductReviewFirst({
      productId,
      userId
    });
    if (existing) {
      throw new ProductReviewError('You have already reviewed this product', 409, 'DUPLICATE_REVIEW');
    }
  }

  async createProductReview({ userId, productId, orderId, rating, title, comment, images, isVerifiedPurchase }) {
    const review = await reviewsRepository.createProductReview({
      productId,
      userId,
      orderId,
      rating,
      title,
      comment,
      images: images || [],
      isVerifiedPurchase: isVerifiedPurchase || false,
      status: 'APPROVED'
    });

    const populatedReview = await prisma.productReview.findUnique({
      where: { id: review.id },
      include: { user: { select: { id: true, name: true } } }
    });

    const product = await reviewsRepository.findProductFirst({ id: productId });
    await this.syncProductRating(productId);

    if (product && product.boutiqueId) {
      const rBoutique = await reviewsRepository.findBoutiqueUnique(product.boutiqueId);
      if (rBoutique && rBoutique.ownerId) {
        eventBus.emit(Events.REVIEW_SUBMITTED, { review: populatedReview, boutique: rBoutique });
      }
    }

    return populatedReview;
  }

  async updateProductReview(reviewId, userId, data) {
    const review = await reviewsRepository.findProductReviewUnique(reviewId);
    if (!review) throw new ProductReviewError('Review not found', 404, 'NOT_FOUND');
    if (review.userId !== userId) throw new ProductReviewError('Access denied', 403, 'ACCESS_DENIED');
    if (review.status === 'REJECTED' || review.status === 'HIDDEN') {
      throw new ProductReviewError('Cannot update a rejected or hidden review', 400, 'INVALID_STATUS');
    }

    const updated = await reviewsRepository.updateProductReview(reviewId, {
      rating: data.rating ?? review.rating,
      title: data.title ?? review.title,
      comment: data.comment ?? review.comment,
      images: data.images ?? review.images
    });
    await this.syncProductRating(review.productId);
    return updated;
  }

  async deleteProductReview(reviewId, userId) {
    const review = await reviewsRepository.findProductReviewUnique(reviewId);
    if (!review) throw new ProductReviewError('Review not found', 404, 'NOT_FOUND');
    if (review.userId !== userId) throw new ProductReviewError('Access denied', 403, 'ACCESS_DENIED');

    await reviewsRepository.deleteProductReview(reviewId);
    await this.syncProductRating(review.productId);
  }

  async setProductReviewReply(reviewId, reply) {
    const review = await prisma.productReview.findUnique({
      where: { id: reviewId },
      include: { product: { select: { boutiqueId: true } } }
    });
    if (!review) throw new ProductReviewError('Review not found', 404, 'NOT_FOUND');

    const updated = await reviewsRepository.updateProductReview(reviewId, { reply });

    eventBus.emit(Events.REVIEW_REPLIED, { review, reply });

    return updated;
  }

  async deleteProductReviewReply(reviewId) {
    const review = await reviewsRepository.findProductReviewUnique(reviewId);
    if (!review) throw new ProductReviewError('Review not found', 404, 'NOT_FOUND');

    const updated = await reviewsRepository.updateProductReview(reviewId, { reply: null });
    return updated;
  }

  async setProductReviewStatus(reviewId, status) {
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN'];
    if (!validStatuses.includes(status)) {
      throw new ProductReviewError('Invalid status. Must be PENDING, APPROVED, REJECTED, or HIDDEN', 400, 'INVALID_STATUS');
    }

    const review = await reviewsRepository.findProductReviewUnique(reviewId);
    if (!review) throw new ProductReviewError('Review not found', 404, 'NOT_FOUND');

    const updated = await reviewsRepository.updateProductReview(reviewId, { status });
    await this.syncProductRating(review.productId);
    return updated;
  }

  async adminDeleteProductReview(reviewId) {
    const review = await reviewsRepository.findProductReviewUnique(reviewId);
    if (!review) throw new ProductReviewError('Review not found', 404, 'NOT_FOUND');

    await reviewsRepository.deleteProductReview(reviewId);
    await this.syncProductRating(review.productId);
  }

  async getProductReviews(productId, status = 'APPROVED') {
    return reviewsRepository.findProductReviews({ productId, status }, {
      user: { select: { id: true, name: true } }
    }, { createdAt: 'desc' });
  }

  async getProductReviewSummary(productId) {
    const agg = await reviewsRepository.aggregateProductReviews({ productId, status: 'APPROVED' });

    const totalReviews = agg._count.id;
    if (totalReviews === 0) {
      return { averageRating: 0, totalReviews: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    }

    const averageRating = Math.round((agg._avg.rating || 0) * 100) / 100;

    const groupByRating = await prisma.productReview.groupBy({
      by: ['rating'],
      where: { productId, status: 'APPROVED' },
      _count: { id: true }
    });

    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const g of groupByRating) {
      if (breakdown.hasOwnProperty(g.rating)) {
        breakdown[g.rating] = g._count.id;
      }
    }

    return { averageRating, totalReviews, breakdown };
  }
}

const reviewsService = new ReviewsService();

module.exports = {
  reviewsService,
  ProductReviewError,
  syncProductRating: reviewsService.syncProductRating.bind(reviewsService),
  validateDeliveredOrder: reviewsService.validateDeliveredOrder.bind(reviewsService),
  canReviewProduct: reviewsService.canReviewProduct.bind(reviewsService),
  createReview: reviewsService.createProductReview.bind(reviewsService), // mapped for product tests
  updateReview: reviewsService.updateProductReview.bind(reviewsService),
  deleteReview: reviewsService.deleteProductReview.bind(reviewsService),
  setReviewReply: reviewsService.setProductReviewReply.bind(reviewsService),
  deleteReviewReply: reviewsService.deleteProductReviewReply.bind(reviewsService),
  setReviewStatus: reviewsService.setProductReviewStatus.bind(reviewsService),
  adminDeleteReview: reviewsService.adminDeleteProductReview.bind(reviewsService),
  getReviews: reviewsService.getProductReviews.bind(reviewsService),
  getReviewSummary: reviewsService.getProductReviewSummary.bind(reviewsService)
};
