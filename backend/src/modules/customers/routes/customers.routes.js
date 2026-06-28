const express = require('express');
const router = express.Router();
const customersController = require('../controllers/customers.controller');
const { protect, authorize } = require('../../../middleware/authMiddleware');

router.use(protect);
router.use(authorize('super-admin'));

router.route('/')
    .get(customersController.listCustomers);

router.route('/:id')
    .get(customersController.getCustomerProfile);

router.route('/:id/status')
    .put(customersController.toggleCustomerBlock);

router.route('/:id/export')
    .get(customersController.exportCustomerData);

router.route('/:id/addresses')
    .get(customersController.getCustomerAddresses)
    .post(customersController.addCustomerAddress);

router.route('/:id/addresses/:addressId')
    .put(customersController.updateCustomerAddress)
    .delete(customersController.deleteCustomerAddress);

module.exports = router;
