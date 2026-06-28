const express = require('express');
const router = express.Router();
const controller = require('../controllers/cart.controller');
const { protect, checkReadOnlyMode, checkBoutiqueStatus } = require('../../../middleware/authMiddleware');

router.use(protect);
router.use(checkReadOnlyMode);
router.use(checkBoutiqueStatus);

router.get('/', controller.getCart.bind(controller));
router.post('/add', controller.addItemToCart.bind(controller));
router.put('/:itemId', controller.updateItemQuantity.bind(controller));
router.delete('/:itemId', controller.removeItemFromCart.bind(controller));
router.delete('/', controller.clearCart.bind(controller));

module.exports = router;
