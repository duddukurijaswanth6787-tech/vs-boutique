const express = require('express');
const router = express.Router();
const boutiquesController = require('../controllers/boutiques.controller');
const { protect, authorize } = require('../../../middleware/authMiddleware');

router.get('/public', boutiquesController.getPublicBoutiques);
router.get('/public/:id', boutiquesController.getPublicBoutiqueById);

router.get('/', protect, authorize('super-admin'), boutiquesController.getAllBoutiques);
router.get('/:id/details', protect, authorize('super-admin'), boutiquesController.getBoutiqueDetails);
router.post('/add', protect, authorize('super-admin'), boutiquesController.createBoutique);
router.put('/:id', protect, authorize('super-admin'), boutiquesController.updateBoutique);
router.put('/:id/status', protect, authorize('super-admin'), boutiquesController.updateBoutiqueStatus);
router.delete('/:id', protect, authorize('super-admin'), boutiquesController.deleteBoutique);
router.put('/:id/verify', protect, authorize('super-admin'), boutiquesController.verifyBoutique);
router.put('/:id/feature', protect, authorize('super-admin'), boutiquesController.featureBoutique);
router.put('/:id/activate', protect, authorize('super-admin'), boutiquesController.activateBoutique);

module.exports = router;
