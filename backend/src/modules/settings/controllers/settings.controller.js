const service = require('../services/settings.service');

class SettingsController {
  async getRevenueReport(req, res) {
    try {
      const data = await service.getRevenueReport();
      return res.json({
        success: true,
        ...data
      });
    } catch (err) {
      console.error('[SettingsController.getRevenueReport]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getFraudReport(req, res) {
    try {
      const data = await service.getFraudReport();
      return res.json({
        success: true,
        ...data
      });
    } catch (err) {
      console.error('[SettingsController.getFraudReport]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getWishlistReport(req, res) {
    try {
      const data = await service.getWishlistReport();
      return res.json({
        success: true,
        ...data
      });
    } catch (err) {
      console.error('[SettingsController.getWishlistReport]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getCommandCenterStats(req, res) {
    try {
      const data = await service.getCommandCenterStats();
      return res.json({
        success: true,
        ...data
      });
    } catch (err) {
      console.error('[SettingsController.getCommandCenterStats]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getSubscriptionAnalytics(req, res) {
    try {
      const data = await service.getSubscriptionAnalytics();
      return res.json({
        success: true,
        data
      });
    } catch (err) {
      console.error('[SettingsController.getSubscriptionAnalytics]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateSubscription(req, res) {
    try {
      const result = await service.updateSubscription(req.body, req.user.id);
      return res.json(result);
    } catch (err) {
      console.error('[SettingsController.updateSubscription]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new SettingsController();
