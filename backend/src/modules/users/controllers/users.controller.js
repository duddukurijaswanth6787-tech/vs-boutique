const usersService = require('../services/users.service');

class UsersController {
  getShippingAddresses = async (req, res) => {
    try {
      const addresses = await usersService.getShippingAddresses(req.user.id);
      return res.json({ success: true, data: addresses });
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ success: false, message });
    }
  };

  createShippingAddress = async (req, res) => {
    try {
      const address = await usersService.createShippingAddress(req.user.id, req.body);
      return res.status(201).json({ success: true, data: address });
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ success: false, message });
    }
  };

  updateShippingAddress = async (req, res) => {
    try {
      const address = await usersService.updateShippingAddress(req.params.id, req.user.id, req.body);
      return res.json({ success: true, data: address });
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ success: false, message });
    }
  };

  deleteShippingAddress = async (req, res) => {
    try {
      const result = await usersService.deleteShippingAddress(req.params.id, req.user.id);
      return res.json({ success: true, message: result.message });
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ success: false, message });
    }
  };

  setDefaultAddress = async (req, res) => {
    try {
      const address = await usersService.setDefaultAddress(req.params.id, req.user.id);
      return res.json({ success: true, data: address });
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ success: false, message });
    }
  };
}

module.exports = new UsersController();
