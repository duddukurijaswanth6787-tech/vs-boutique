const customersService = require('../services/customers.service');

class CustomersController {
  listCustomers = async (req, res) => {
    try {
      const result = await customersService.listCustomers(req.query);
      return res.json(result);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  getCustomerProfile = async (req, res) => {
    try {
      const result = await customersService.getCustomerProfile(req.params.id);
      return res.json(result);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  toggleCustomerBlock = async (req, res) => {
    try {
      const { status, reason } = req.body;
      const result = await customersService.toggleCustomerBlock(req.params.id, status, req.user.id, reason);
      return res.json(result);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  exportCustomerData = async (req, res) => {
    try {
      const exportData = await customersService.exportCustomerData(req.params.id);
      const phone = exportData.profile.phone;

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=customer_${phone}_export.json`);
      return res.json(exportData);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  getCustomerAddresses = async (req, res) => {
    try {
      const result = await customersService.getCustomerAddresses(req.params.id);
      return res.json(result);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  addCustomerAddress = async (req, res) => {
    try {
      const result = await customersService.addCustomerAddress(req.params.id, req.body);
      return res.status(201).json(result);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  updateCustomerAddress = async (req, res) => {
    try {
      const result = await customersService.updateCustomerAddress(req.params.id, req.params.addressId, req.body);
      return res.json(result);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };

  deleteCustomerAddress = async (req, res) => {
    try {
      const result = await customersService.deleteCustomerAddress(req.params.id, req.params.addressId);
      return res.json(result);
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      return res.status(status).json({ message });
    }
  };
}

module.exports = new CustomersController();
