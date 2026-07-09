const service = require('../services/policies.service');

class PoliciesController {
  async getSettings(req, res) {
    try {
      const result = await service.getSettings();
      return res.json({ success: true, data: result });
    } catch (err) {
      console.error('[PoliciesController.getSettings]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateSettings(req, res) {
    try {
      const result = await service.updateSettings(req.body);
      return res.json({ success: true, data: result });
    } catch (err) {
      console.error('[PoliciesController.updateSettings]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getPolicy(req, res) {
    try {
      const result = await service.getPolicy(req.params.key);
      return res.json({ success: true, data: result });
    } catch (err) {
      console.error('[PoliciesController.getPolicy]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async updatePolicy(req, res) {
    try {
      const { title, content, draftContent, status } = req.body;
      const result = await service.updatePolicy(req.params.key, { title, content, draftContent, status });
      return res.json({ success: true, data: result });
    } catch (err) {
      console.error('[PoliciesController.updatePolicy]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getHistory(req, res) {
    try {
      const result = await service.getHistory(req.params.key);
      return res.json({ success: true, data: result });
    } catch (err) {
      console.error('[PoliciesController.getHistory]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new PoliciesController();
