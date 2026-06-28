const boutiquesService = require('../services/boutiques.service');

class BoutiquesController {
  // Public list
  getPublicBoutiques = async (req, res) => {
    const tStart = Date.now();
    try {
      const dbStart = Date.now();
      const result = await boutiquesService.getPublicBoutiques();
      const dbTime = result.fromCache ? 0 : Date.now() - dbStart;

      const totalTime = Date.now() - tStart;
      if (result.fromCache) {
        console.log(`[AUDIT] GET /boutiques/public - [CACHE HIT] Cache Age: unknown, DB Query: 0ms, Serialization: 0ms, Controller: 0ms, Total Execution: ${totalTime}ms`);
      } else {
        console.log(`[AUDIT] GET /boutiques/public - [CACHE MISS] DB Query: ${dbTime}ms, Serialization: unknown, Controller: unknown, Total Execution: ${totalTime}ms`);
      }

      res.setHeader('Content-Type', 'application/json');
      return res.send(result.data);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  // Public detail
  getPublicBoutiqueById = async (req, res) => {
    const tStart = Date.now();
    const id = req.params.id;
    try {
      const dbStart = Date.now();
      const result = await boutiquesService.getPublicBoutiqueById(id);
      const dbTime = result.fromCache ? 0 : Date.now() - dbStart;

      const totalTime = Date.now() - tStart;
      if (result.fromCache) {
        console.log(`[AUDIT] GET /boutiques/public/${id} - [CACHE HIT] Cache Age: unknown, DB Query: 0ms, Serialization: 0ms, Controller: 0ms, Total Execution: ${totalTime}ms`);
      } else {
        console.log(`[AUDIT] GET /boutiques/public/${id} - [CACHE MISS] DB Query: ${dbTime}ms, Serialization: unknown, Controller: unknown, Total Execution: ${totalTime}ms`);
      }

      res.setHeader('Content-Type', 'application/json');
      return res.send(result.data);
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  // Get all boutiques (superadmin)
  getAllBoutiques = async (req, res) => {
    try {
      const boutiques = await boutiquesService.getAllBoutiques();
      return res.json(boutiques);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  // Get boutique details (superadmin)
  getBoutiqueDetails = async (req, res) => {
    try {
      const { id } = req.params;
      const details = await boutiquesService.getBoutiqueDetails(id);
      return res.json(details);
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  // Add boutique (superadmin)
  createBoutique = async (req, res) => {
    try {
      const result = await boutiquesService.createBoutique(req.body, req.user.id);
      return res.status(201).json(result);
    } catch (err) {
      console.error('Boutique Addition Error:', err.message);
      return res.status(err.status || 400).json({ success: false, message: err.message });
    }
  };

  // Edit boutique (superadmin / owner)
  updateBoutique = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await boutiquesService.updateBoutique(id, req.body, req.user);
      return res.json(result);
    } catch (err) {
      return res.status(err.status || 400).json({ success: false, message: err.message });
    }
  };

  // Update status (superadmin)
  updateBoutiqueStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await boutiquesService.updateBoutiqueStatus(id, req.body, req.user.id);
      return res.json(result);
    } catch (err) {
      return res.status(err.status || 400).json({ success: false, message: err.message });
    }
  };

  // Soft delete boutique (superadmin)
  deleteBoutique = async (req, res) => {
    try {
      const { id } = req.params;
      const { adminPassword } = req.body || {};
      await boutiquesService.deleteBoutique(id, adminPassword, req.user.id);
      return res.json({ success: true, message: 'Boutique deleted successfully (Soft Delete)' });
    } catch (err) {
      return res.status(err.status || 400).json({ success: false, message: err.message });
    }
  };

  // Verify (superadmin)
  verifyBoutique = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await boutiquesService.verifyBoutique(id);
      return res.json(result);
    } catch (err) {
      return res.status(err.status || 400).json({ success: false, message: err.message });
    }
  };

  // Feature (superadmin)
  featureBoutique = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await boutiquesService.featureBoutique(id);
      return res.json(result);
    } catch (err) {
      return res.status(err.status || 400).json({ success: false, message: err.message });
    }
  };

  // Activate (superadmin)
  activateBoutique = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await boutiquesService.activateBoutique(id);
      return res.json(result);
    } catch (err) {
      return res.status(err.status || 400).json({ success: false, message: err.message });
    }
  };
}

module.exports = new BoutiquesController();
