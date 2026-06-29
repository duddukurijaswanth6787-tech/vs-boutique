const marketplaceService = require('../services/marketplace.service');

class MarketplaceController {
  async registerPublisher(req, res) {
    try {
      // Reuses user authentication owner context
      const ownerId = req.user.id;
      const publisher = await marketplaceService.registerPublisher(ownerId, req.body);
      res.status(201).json({ success: true, data: publisher });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async publishPackage(req, res) {
    try {
      const { publisherId } = req.body;
      if (!publisherId) {
        return res.status(400).json({ success: false, message: 'publisherId is required' });
      }
      const result = await marketplaceService.publishPackage(publisherId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async searchPackages(req, res) {
    try {
      const filters = {
        q: req.query.q,
        capability: req.query.capability,
        publisherId: req.query.publisherId,
        installedInBusinessId: req.query.installedInBusinessId
      };
      const options = {
        page: req.query.page,
        limit: req.query.limit
      };

      const result = await marketplaceService.searchPackages(filters, options);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getPackage(req, res) {
    try {
      const pkg = await marketplaceService.getPackageBySlug(req.params.slug);
      res.json({ success: true, data: pkg });
    } catch (err) {
      res.status(404).json({ success: false, message: err.message });
    }
  }

  async installPackage(req, res) {
    try {
      const { businessId, packageSlug, version } = req.body;
      if (!businessId || !packageSlug) {
        return res.status(400).json({ success: false, message: 'businessId and packageSlug are required' });
      }

      const result = await marketplaceService.installPackage(businessId, packageSlug, version);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async uninstallPackage(req, res) {
    try {
      const { businessId } = req.body;
      const { packageId } = req.params;
      if (!businessId) {
        return res.status(400).json({ success: false, message: 'businessId is required' });
      }

      const result = await marketplaceService.uninstallPackage(businessId, packageId);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async toggleEnabled(req, res) {
    try {
      const { businessId, isEnabled } = req.body;
      const { packageId } = req.params;
      if (!businessId || isEnabled === undefined) {
        return res.status(400).json({ success: false, message: 'businessId and isEnabled are required' });
      }

      const result = await marketplaceService.setEnabledState(businessId, packageId, isEnabled);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = new MarketplaceController();
