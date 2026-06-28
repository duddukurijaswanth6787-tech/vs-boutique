const couponsService = require('../services/coupons.service');
const { CouponError } = couponsService;

class CouponsController {
  // Customer Validate Coupon
  validateCoupon = async (req, res) => {
    try {
      const { couponCode, cartItems, boutiqueId } = req.body;
      const result = await couponsService.validateCoupon({
        couponCode,
        cartItems,
        customerId: req.user.id,
        boutiqueId: boutiqueId || null
      });
      return res.json({ success: true, data: result });
    } catch (err) {
      if (err instanceof CouponError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  // Admin list
  adminListCoupons = async (req, res) => {
    try {
      const coupons = await couponsService.listCoupons(null);
      return res.json({ success: true, data: coupons });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  // Admin create
  adminCreateCoupon = async (req, res) => {
    try {
      const coupon = await couponsService.createCoupon({ ...req.body, boutiqueId: null });
      return res.status(201).json({ success: true, data: coupon });
    } catch (err) {
      if (err instanceof CouponError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  // Admin get
  adminGetCoupon = async (req, res) => {
    try {
      const coupon = await couponsService.getCoupon(req.params.id);
      return res.json({ success: true, data: coupon });
    } catch (err) {
      if (err instanceof CouponError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  // Admin update
  adminUpdateCoupon = async (req, res) => {
    try {
      const coupon = await couponsService.updateCoupon(req.params.id, req.body);
      return res.json({ success: true, data: coupon });
    } catch (err) {
      if (err instanceof CouponError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  // Admin toggle
  adminToggleCoupon = async (req, res) => {
    try {
      const coupon = await couponsService.toggleCouponActive(req.params.id);
      return res.json({ success: true, data: coupon });
    } catch (err) {
      if (err instanceof CouponError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  // Admin delete
  adminDeleteCoupon = async (req, res) => {
    try {
      await couponsService.deleteCoupon(req.params.id);
      return res.json({ success: true, message: 'Coupon deleted' });
    } catch (err) {
      if (err instanceof CouponError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  // Owner list
  ownerListCoupons = async (req, res) => {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      if (!boutiqueId) return res.status(400).json({ success: false, message: 'No boutique assigned' });
      const coupons = await couponsService.listCoupons(boutiqueId);
      return res.json({ success: true, data: coupons });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  // Owner create
  ownerCreateCoupon = async (req, res) => {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      if (!boutiqueId) return res.status(400).json({ success: false, message: 'No boutique assigned' });
      const coupon = await couponsService.createCoupon({ ...req.body, boutiqueId });
      return res.status(201).json({ success: true, data: coupon });
    } catch (err) {
      if (err instanceof CouponError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  // Owner get
  ownerGetCoupon = async (req, res) => {
    try {
      const coupon = await couponsService.getCoupon(req.params.id);
      const boutiqueId = req.user.assignedBoutiqueId;
      if (coupon.boutiqueId && coupon.boutiqueId !== boutiqueId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      return res.json({ success: true, data: coupon });
    } catch (err) {
      if (err instanceof CouponError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  // Owner update
  ownerUpdateCoupon = async (req, res) => {
    try {
      const coupon = await couponsService.getCoupon(req.params.id);
      const boutiqueId = req.user.assignedBoutiqueId;
      if (coupon.boutiqueId && coupon.boutiqueId !== boutiqueId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      const updated = await couponsService.updateCoupon(req.params.id, req.body);
      return res.json({ success: true, data: updated });
    } catch (err) {
      if (err instanceof CouponError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  // Owner delete
  ownerDeleteCoupon = async (req, res) => {
    try {
      const coupon = await couponsService.getCoupon(req.params.id);
      const boutiqueId = req.user.assignedBoutiqueId;
      if (coupon.boutiqueId && coupon.boutiqueId !== boutiqueId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      await couponsService.deleteCoupon(req.params.id);
      return res.json({ success: true, message: 'Coupon deleted' });
    } catch (err) {
      if (err instanceof CouponError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      return res.status(500).json({ success: false, message: err.message });
    }
  };
}

module.exports = new CouponsController();
