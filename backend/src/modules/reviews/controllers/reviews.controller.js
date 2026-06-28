const { reviewsService, ProductReviewError } = require('../services/reviews.service');
const prisma = require('../../../utils/prisma');

class ReviewsController {
  // ── Boutique Reviews Controllers ──
  async createBoutiqueReview(req, res) {
    try {
      const review = await reviewsService.createBoutiqueReview(req.body, req.user, req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress);
      res.status(201).json({ success: true, data: review });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async listBoutiqueReviews(req, res) {
    try {
      const data = await reviewsService.listBoutiqueReviews(req.params.boutiqueId);
      res.json(data);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async listReviewsAdmin(req, res) {
    try {
      const data = await reviewsService.listReviewsAdmin(req.query);
      res.json(data);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async listOwnerReviews(req, res) {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      const data = await reviewsService.listOwnerReviews(boutiqueId, req.query);
      res.json(data);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async moderateReviewAdmin(req, res) {
    try {
      const { id } = req.params;
      const { moderationStatus } = req.body;
      const review = await reviewsService.moderateReviewAdmin(id, moderationStatus, req.user.id);
      res.json({ success: true, data: review });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async replyToReviewOwner(req, res) {
    try {
      const { id } = req.params;
      const { reply } = req.body;
      const review = await reviewsService.replyToReviewOwner(id, reply, req.user);
      res.json({ success: true, data: review });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async reportReviewCustomer(req, res) {
    try {
      const { id } = req.params;
      await reviewsService.reportReviewCustomer(id);
      res.json({ success: true, message: 'Review successfully reported' });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getReviewStats(req, res) {
    try {
      const stats = await reviewsService.getReviewStats();
      res.json(stats);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  // ── Product Reviews Controllers ──
  async getProductReviews(req, res) {
    try {
      const reviews = await reviewsService.getProductReviews(req.params.productId, req.query.status || 'APPROVED');
      res.json({ success: true, data: reviews });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getProductReviewSummary(req, res) {
    try {
      const summary = await reviewsService.getProductReviewSummary(req.params.productId);
      res.json({ success: true, data: summary });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async createProductReview(req, res) {
    try {
      const { productId } = req.params;
      const { rating, title, comment, images } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
      }

      await reviewsService.canReviewProduct(req.user.id, productId);

      const deliveredOrder = await reviewsService.validateDeliveredOrder(req.user.id, productId);
      const review = await reviewsService.createProductReview({
        userId: req.user.id,
        productId,
        orderId: deliveredOrder?.id || null,
        rating,
        title,
        comment,
        images: images || [],
        isVerifiedPurchase: !!deliveredOrder
      });

      res.status(201).json({ success: true, data: review });
    } catch (err) {
      if (err instanceof ProductReviewError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateProductReview(req, res) {
    try {
      const review = await reviewsService.updateProductReview(req.params.reviewId, req.user.id, req.body);
      res.json({ success: true, data: review });
    } catch (err) {
      if (err instanceof ProductReviewError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async deleteProductReview(req, res) {
    try {
      await reviewsService.deleteProductReview(req.params.reviewId, req.user.id);
      res.json({ success: true, message: 'Review deleted' });
    } catch (err) {
      if (err instanceof ProductReviewError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getOwnerProductReviews(req, res) {
    try {
      const { status } = req.query;
      const where = { productId: req.params.productId };
      if (status) where.status = status;
      const reviews = await prisma.productReview.findMany({
        where,
        include: {
          user: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json({ success: true, data: reviews });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async setProductReviewReply(req, res) {
    try {
      const { reply } = req.body;
      if (!reply) {
        return res.status(400).json({ success: false, message: 'Reply text is required' });
      }
      const review = await reviewsService.setProductReviewReply(req.params.reviewId, reply);
      res.json({ success: true, data: review });
    } catch (err) {
      if (err instanceof ProductReviewError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async deleteProductReviewReply(req, res) {
    try {
      const review = await reviewsService.deleteProductReviewReply(req.params.reviewId);
      res.json({ success: true, data: review });
    } catch (err) {
      if (err instanceof ProductReviewError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async globalAdminGetProductReviews(req, res) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const where = {};
      if (status) where.status = status;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [reviews, total] = await Promise.all([
        prisma.productReview.findMany({
          where,
          include: {
            user: { select: { id: true, name: true } },
            product: { select: { id: true, name: true, images: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.productReview.count({ where })
      ]);
      res.json({ success: true, data: { reviews, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async approveProductReview(req, res) {
    try {
      const review = await reviewsService.setProductReviewStatus(req.params.reviewId, 'APPROVED');
      res.json({ success: true, data: review });
    } catch (err) {
      if (err instanceof ProductReviewError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async rejectProductReview(req, res) {
    try {
      const review = await reviewsService.setProductReviewStatus(req.params.reviewId, 'REJECTED');
      res.json({ success: true, data: review });
    } catch (err) {
      if (err instanceof ProductReviewError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async hideProductReview(req, res) {
    try {
      const review = await reviewsService.setProductReviewStatus(req.params.reviewId, 'HIDDEN');
      res.json({ success: true, data: review });
    } catch (err) {
      if (err instanceof ProductReviewError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async adminDeleteProductReview(req, res) {
    try {
      await reviewsService.adminDeleteProductReview(req.params.reviewId);
      res.json({ success: true, message: 'Review deleted by admin' });
    } catch (err) {
      if (err instanceof ProductReviewError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new ReviewsController();
