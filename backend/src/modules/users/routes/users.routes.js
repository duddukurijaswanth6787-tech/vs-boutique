const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { protect, checkReadOnlyMode, checkBoutiqueStatus } = require('../../../middleware/authMiddleware');

router.get('/', protect, checkReadOnlyMode, checkBoutiqueStatus, usersController.getShippingAddresses);
router.post('/', protect, checkReadOnlyMode, checkBoutiqueStatus, usersController.createShippingAddress);
router.put('/:id', protect, checkReadOnlyMode, checkBoutiqueStatus, usersController.updateShippingAddress);
router.delete('/:id', protect, checkReadOnlyMode, checkBoutiqueStatus, usersController.deleteShippingAddress);
router.put('/:id/default', protect, checkReadOnlyMode, checkBoutiqueStatus, usersController.setDefaultAddress);

module.exports = router;
