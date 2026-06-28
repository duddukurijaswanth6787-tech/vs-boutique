const service = require('../services/analytics.service');

class AnalyticsController {
  async getMarketplaceInsights(req, res) {
    try {
      const data = await service.getMarketplaceInsights();
      return res.json({
        success: true,
        ...data
      });
    } catch (err) {
      console.error('[AnalyticsController.getMarketplaceInsights]', err);
      return res.status(500).json({ message: err.message });
    }
  }

  async getDashboardStats(req, res) {
    try {
      const data = await service.getDashboardStats();
      return res.json(data);
    } catch (err) {
      console.error('[AnalyticsController.getDashboardStats]', err);
      return res.status(500).json({ message: err.message });
    }
  }

  async getAuditLogs(req, res) {
    try {
      const data = await service.getAuditLogsList();
      return res.json(data);
    } catch (err) {
      console.error('[AnalyticsController.getAuditLogs]', err);
      return res.status(500).json({ message: err.message });
    }
  }
}

module.exports = new AnalyticsController();
