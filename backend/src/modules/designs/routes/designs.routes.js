const express = require('express');
const router = express.Router();
const controller = require('../controllers/designs.controller');
const { protect, authorize, checkPermission, checkReadOnlyMode, checkBoutiqueStatus, checkFeatureAccess } = require('../../../middleware/authMiddleware');

router.use(protect);
router.use(checkFeatureAccess('designs'));
router.use(checkReadOnlyMode);
router.use(checkBoutiqueStatus);

router.get('/', authorize('owner'), controller.listDesigns.bind(controller));
router.post('/', authorize('owner'), checkPermission('canManageDesigns'), controller.createDesign.bind(controller));
router.put('/:id', authorize('owner'), checkPermission('canManageDesigns'), controller.updateDesign.bind(controller));
router.delete('/:id', authorize('owner'), checkPermission('canManageDesigns'), controller.deleteDesign.bind(controller));

module.exports = router;
