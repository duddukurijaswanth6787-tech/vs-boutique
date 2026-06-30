const { parseDecimal } = require('../../../utils/parseDecimal');
const couponsRepository = require('../repositories/coupons.repository');

class CouponError extends Error {
  constructor(message, status = 400, code = 'COUPON_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

class CouponsService {
  CouponError = CouponError;

  async validateCoupon({ couponCode, cartItems, customerId, boutiqueId }) {
    if (!couponCode || !cartItems?.length || !customerId) {
      throw new CouponError('Missing required fields: couponCode, cartItems, customerId', 400, 'MISSING_FIELDS');
    }

    const coupon = await couponsRepository.findCouponByCodeAndBoutique(couponCode, boutiqueId);

    if (!coupon) throw new CouponError('Coupon not found', 404, 'NOT_FOUND');
    if (!coupon.isActive) throw new CouponError('Coupon is inactive', 400, 'INACTIVE');

    const now = new Date();
    if (coupon.startsAt && new Date(coupon.startsAt) > now) {
      throw new CouponError('Coupon is not yet valid', 400, 'NOT_STARTED');
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
      throw new CouponError('Coupon has expired', 400, 'EXPIRED');
    }

    if (coupon.maxUses > 0 && coupon.currentUses >= coupon.maxUses) {
      throw new CouponError('Coupon usage limit reached', 400, 'MAX_USES_REACHED');
    }

    if (coupon.maxUsesPerUser > 0) {
      const usageCount = await couponsRepository.countCouponUsageByUser(coupon.id, customerId);
      if (usageCount >= coupon.maxUsesPerUser) {
        throw new CouponError('You have already used this coupon the maximum number of times', 400, 'PER_USER_LIMIT');
      }
    }

    if (coupon.firstOrderOnly) {
      const paidOrders = await couponsRepository.countPaidOrdersByUser(customerId);
      if (paidOrders > 0) {
        throw new CouponError('This coupon is valid for first order only', 400, 'FIRST_ORDER_ONLY');
      }
    }

    const subtotal = cartItems.reduce((sum, item) => {
      return sum + (Number(item.unitPrice) * Number(item.quantity));
    }, 0);

    if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
      throw new CouponError(
        `Minimum order amount of ${Number(coupon.minOrderAmount).toFixed(2)} required`,
        400,
        'MIN_ORDER_AMOUNT'
      );
    }

    let applicableSubtotal = subtotal;

    if (coupon.applicableType === 'PRODUCTS' && coupon.applicableIds.length > 0) {
      applicableSubtotal = cartItems
        .filter(item => coupon.applicableIds.includes(item.productId))
        .reduce((sum, item) => sum + (Number(item.unitPrice) * Number(item.quantity)), 0);

      if (applicableSubtotal <= 0) {
        throw new CouponError('Coupon does not apply to any items in cart', 400, 'NO_APPLICABLE_ITEMS');
      }
    }

    if (coupon.applicableType === 'CATEGORIES' && coupon.applicableIds.length > 0) {
      const products = await couponsRepository.findProductsByIds(cartItems.map(i => i.productId));
      const productCategoryMap = {};
      for (const p of products) {
        productCategoryMap[p.id] = p.categoryId;
      }

      applicableSubtotal = cartItems
        .filter(item => productCategoryMap[item.productId] && coupon.applicableIds.includes(productCategoryMap[item.productId]))
        .reduce((sum, item) => sum + (Number(item.unitPrice) * Number(item.quantity)), 0);

      if (applicableSubtotal <= 0) {
        throw new CouponError('Coupon does not apply to any items in cart', 400, 'NO_APPLICABLE_ITEMS');
      }
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (applicableSubtotal * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
        discountAmount = Number(coupon.maxDiscount);
      }
    } else {
      discountAmount = Number(coupon.discountValue);
    }

    discountAmount = Math.round(discountAmount * 100) / 100;
    const finalAmount = Math.max(0, subtotal - discountAmount);

    return {
      valid: true,
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: parseDecimal(coupon.discountValue),
      discountAmount,
      subtotal,
      finalAmount,
      description: coupon.description
    };
  }

  async recordCouponUsage(couponId, userId, orderId) {
    try {
      await couponsRepository.recordCouponUsageTransaction(couponId, userId, orderId);
    } catch (err) {
      if (err.message === 'COUPON_NOT_FOUND') {
        throw new CouponError('Coupon not found', 404, 'NOT_FOUND');
      }
      if (err.message === 'MAX_USES_REACHED') {
        throw new CouponError('Coupon usage limit reached', 400, 'MAX_USES_REACHED');
      }
      if (err.message === 'PER_USER_LIMIT') {
        throw new CouponError('You have already used this coupon the maximum number of times', 400, 'PER_USER_LIMIT');
      }
      throw err;
    }
  }

  async listCoupons(boutiqueId = null) {
    return couponsRepository.findManyCoupons(boutiqueId);
  }

  async getCoupon(id) {
    const coupon = await couponsRepository.findCouponById(id);
    if (!coupon) throw new CouponError('Coupon not found', 404, 'NOT_FOUND');
    return coupon;
  }

  async createCoupon(data) {
    const existing = await couponsRepository.findCouponByCodeAndBoutique(data.code, data.boutiqueId);
    if (existing) {
      throw new CouponError(`Coupon code "${data.code}" already exists`, 409, 'DUPLICATE_CODE');
    }
    return couponsRepository.createCoupon(data);
  }

  async updateCoupon(id, data) {
    const coupon = await couponsRepository.findCouponById(id);
    if (!coupon) throw new CouponError('Coupon not found', 404, 'NOT_FOUND');

    if (data.code && data.code.toUpperCase() !== coupon.code) {
      const existing = await couponsRepository.findCouponByCodeAndBoutique(data.code, coupon.boutiqueId);
      if (existing && existing.id !== id) {
        throw new CouponError(`Coupon code "${data.code}" already exists`, 409, 'DUPLICATE_CODE');
      }
    }

    const updateData = {
      ...(data.code && { code: data.code.toUpperCase() }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.discountType && { discountType: data.discountType }),
      ...(data.discountValue !== undefined && { discountValue: data.discountValue }),
      ...(data.minOrderAmount !== undefined && { minOrderAmount: data.minOrderAmount }),
      ...(data.maxDiscount !== undefined && { maxDiscount: data.maxDiscount }),
      ...(data.maxUses !== undefined && { maxUses: data.maxUses }),
      ...(data.maxUsesPerUser !== undefined && { maxUsesPerUser: data.maxUsesPerUser }),
      ...(data.applicableType && { applicableType: data.applicableType }),
      ...(data.applicableIds !== undefined && { applicableIds: data.applicableIds }),
      ...(data.firstOrderOnly !== undefined && { firstOrderOnly: data.firstOrderOnly }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.startsAt !== undefined && { startsAt: data.startsAt }),
      ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt })
    };

    return couponsRepository.updateCoupon(id, updateData);
  }

  async toggleCouponActive(id) {
    const coupon = await couponsRepository.findCouponById(id);
    if (!coupon) throw new CouponError('Coupon not found', 404, 'NOT_FOUND');

    return couponsRepository.updateCoupon(id, { isActive: !coupon.isActive });
  }

  async deleteCoupon(id) {
    const coupon = await couponsRepository.findCouponById(id);
    if (!coupon) throw new CouponError('Coupon not found', 404, 'NOT_FOUND');

    await couponsRepository.deleteCoupon(id);
  }
}

module.exports = new CouponsService();
