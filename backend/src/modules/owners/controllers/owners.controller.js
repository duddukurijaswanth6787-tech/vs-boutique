const ownersService = require('../services/owners.service');

class OwnersController {
  getUnassignedOwners = async (req, res) => {
    try {
      const result = await ownersService.getUnassignedOwners();
      return res.json(result);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  inviteOwner = async (req, res) => {
    try {
      const result = await ownersService.inviteOwner(req.body, req.user.id);
      return res.status(201).json(result);
    } catch (err) {
      const status = err.status || 500;
      if (err.ownerId) {
        return res.status(status).json({ message: err.message, ownerId: err.ownerId });
      }
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  linkOwner = async (req, res) => {
    try {
      const result = await ownersService.linkOwner(req.body, req.user.id);
      return res.json(result);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  unlinkOwner = async (req, res) => {
    try {
      const result = await ownersService.unlinkOwner(req.body, req.user.id);
      return res.json(result);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  resendInvite = async (req, res) => {
    try {
      const result = await ownersService.resendInvite(req.params.id);
      return res.json(result);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  updateOwnerStatus = async (req, res) => {
    try {
      const result = await ownersService.updateOwnerStatus(req.params.id, req.body.status, req.user.id);
      return res.json(result);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  sendResetLink = async (req, res) => {
    try {
      const result = await ownersService.sendResetLink(req.params.id, req.user.id);
      return res.json(result);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  updateOwnerPermissions = async (req, res) => {
    try {
      const result = await ownersService.updateOwnerPermissions(req.params.id, req.body.permissions, req.user.id);
      return res.json(result);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  blockOwner = async (req, res) => {
    try {
      const result = await ownersService.blockOwner(req.params.id);
      return res.json(result);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  unblockOwner = async (req, res) => {
    try {
      const result = await ownersService.unblockOwner(req.params.id);
      return res.json(result);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  getMe = async (req, res) => {
    try {
      const result = await ownersService.getMe(req.user.id);
      return res.json(result);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  getDashboard = async (req, res) => {
    try {
      const result = await ownersService.getDashboard(req.user.assignedBoutiqueId);
      return res.json(result);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  getBoutique = async (req, res) => {
    try {
      const result = await ownersService.getBoutique(req.user.assignedBoutiqueId);
      return res.json(result);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  updateBoutiqueInfo = async (req, res) => {
    try {
      const result = await ownersService.updateBoutiqueInfo(req.user.assignedBoutiqueId, req.body, req.user.id);
      return res.json(result);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  updateServices = async (req, res) => {
    try {
      const result = await ownersService.updateServices(req.user.assignedBoutiqueId, req.body, req.user.id);
      return res.json(result);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  updateGallery = async (req, res) => {
    try {
      const result = await ownersService.updateGallery(req.user.assignedBoutiqueId, req.body, req.user.id);
      return res.json(result);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  updateMedia = async (req, res) => {
    try {
      const result = await ownersService.updateMedia(req.user.assignedBoutiqueId, req.body, req.user.id);
      return res.json(result);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  getStaff = async (req, res) => {
    try {
      const result = await ownersService.getStaff(req.user.assignedBoutiqueId);
      return res.json(result);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  changePassword = async (req, res) => {
    try {
      const result = await ownersService.changePassword(req.user.id, req.body, req.user.id);
      return res.json(result);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };
}

module.exports = new OwnersController();
