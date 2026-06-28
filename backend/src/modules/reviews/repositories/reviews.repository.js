const prisma = require('../../../utils/prisma');

class ReviewsRepository {
  // ── Boutique Reviews (Review Model) ──
  async createBoutiqueReview(data, tx = prisma) {
    return tx.review.create({ data });
  }

  async findBoutiqueReviewFirst(where, tx = prisma) {
    return tx.review.findFirst({ where });
  }

  async findBoutiqueReviewUnique(id, tx = prisma) {
    return tx.review.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, phone: true } },
        boutique: { select: { name: true } }
      }
    });
  }

  async updateBoutiqueReview(id, data, tx = prisma) {
    return tx.review.update({
      where: { id },
      data
    });
  }

  async findBoutiqueReviews(where = {}, include = {}, orderBy = { createdAt: 'desc' }, skip, take, tx = prisma) {
    const options = { where, include, orderBy };
    if (skip !== undefined) options.skip = skip;
    if (take !== undefined) options.take = take;
    return tx.review.findMany(options);
  }

  async countBoutiqueReviews(where, tx = prisma) {
    return tx.review.count({ where });
  }

  async aggregateBoutiqueReviews(where, tx = prisma) {
    return tx.review.aggregate({
      where,
      _avg: { rating: true },
      _count: { id: true }
    });
  }

  async updateBoutiqueRating(id, rating, count, tx = prisma) {
    return tx.boutique.update({
      where: { id },
      data: {
        rating,
        reviewsCount: count
      }
    });
  }

  // ── Product Reviews (ProductReview Model) ──
  async createProductReview(data, tx = prisma) {
    return tx.productReview.create({ data });
  }

  async findProductReviewFirst(where, tx = prisma) {
    return tx.productReview.findFirst({ where });
  }

  async findProductReviewUnique(id, tx = prisma) {
    return tx.productReview.findUnique({ where: { id } });
  }

  async updateProductReview(id, data, tx = prisma) {
    return tx.productReview.update({
      where: { id },
      data
    });
  }

  async deleteProductReview(id, tx = prisma) {
    return tx.productReview.delete({ where: { id } });
  }

  async findProductReviews(where = {}, include = {}, orderBy = { createdAt: 'desc' }, skip, take, tx = prisma) {
    const options = { where, include, orderBy };
    if (skip !== undefined) options.skip = skip;
    if (take !== undefined) options.take = take;
    return tx.productReview.findMany(options);
  }

  async countProductReviews(where, tx = prisma) {
    return tx.productReview.count({ where });
  }

  async aggregateProductReviews(where, tx = prisma) {
    return tx.productReview.aggregate({
      where,
      _avg: { rating: true },
      _count: { id: true }
    });
  }

  // ── Common Helpers ──
  async findBoutiqueUnique(id, tx = prisma) {
    return tx.boutique.findUnique({ where: { id } });
  }

  async findBoutiqueFirst(where, tx = prisma) {
    return tx.boutique.findFirst({ where });
  }

  async findOrderUnique(id, tx = prisma) {
    return tx.order.findUnique({ where: { id } });
  }

  async findCommerceOrderFirst(where, tx = prisma) {
    return tx.commerceOrder.findFirst({ where });
  }

  async findUserFirst(where, tx = prisma) {
    return tx.user.findFirst({ where });
  }

  async findProductFirst(where, tx = prisma) {
    return tx.product.findFirst({ where });
  }

  async findProductImageFirst(where, tx = prisma) {
    return tx.productImage.findFirst({ where });
  }
}

module.exports = new ReviewsRepository();
