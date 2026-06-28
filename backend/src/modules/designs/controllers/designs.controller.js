const service = require('../services/designs.service');

class DesignsController {
  async listDesigns(req, res) {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      const designs = await service.listDesigns(boutiqueId);
      return res.json(designs);
    } catch (err) {
      console.error('[DesignsController.listDesigns]', err);
      return res.status(500).json({ message: err.message });
    }
  }

  async createDesign(req, res) {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      const design = await service.createDesign(boutiqueId, req.body, req.user.id);
      return res.status(201).json(design);
    } catch (err) {
      console.error('[DesignsController.createDesign]', err);
      return res.status(400).json({ message: err.message });
    }
  }

  async updateDesign(req, res) {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      const updated = await service.updateDesign(req.params.id, boutiqueId, req.body, req.user.id);
      return res.json(updated);
    } catch (err) {
      console.error('[DesignsController.updateDesign]', err);
      const status = err.message === 'Design not found' ? 404 : 400;
      return res.status(status).json({ message: err.message });
    }
  }

  async deleteDesign(req, res) {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      const result = await service.deleteDesign(req.params.id, boutiqueId, req.user.id);
      return res.json(result);
    } catch (err) {
      console.error('[DesignsController.deleteDesign]', err);
      const status = err.message === 'Design not found' ? 404 : 400;
      return res.status(status).json({ message: err.message });
    }
  }
}

module.exports = new DesignsController();
