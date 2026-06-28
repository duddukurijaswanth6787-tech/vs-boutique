const express = require('express');
const router = express.Router();
const controller = require('../controllers/tickets.controller');
const { protect, authorize, checkReadOnlyMode, checkBoutiqueStatus } = require('../../../middleware/authMiddleware');

router.post('/', protect, checkReadOnlyMode, checkBoutiqueStatus, controller.createTicket.bind(controller));
router.get('/admin/analytics', protect, authorize('super-admin'), controller.getTicketAnalytics.bind(controller));
router.get('/customer', protect, checkReadOnlyMode, checkBoutiqueStatus, controller.getTicketsForCustomer.bind(controller));
router.get('/owner', protect, authorize('owner'), checkReadOnlyMode, checkBoutiqueStatus, controller.getTicketsForOwner.bind(controller));
router.get('/admin', protect, authorize('super-admin'), controller.getTicketsForAdmin.bind(controller));

router.get('/:id', protect, checkReadOnlyMode, checkBoutiqueStatus, controller.getTicketDetails.bind(controller));
router.get('/:id/messages', protect, checkReadOnlyMode, checkBoutiqueStatus, controller.getTicketMessages.bind(controller));
router.post('/:id/messages', protect, checkReadOnlyMode, checkBoutiqueStatus, controller.postMessage.bind(controller));

router.get('/:id/notes', protect, authorize('super-admin'), controller.getTicketNotes.bind(controller));
router.post('/:id/notes', protect, authorize('super-admin'), controller.addTicketNote.bind(controller));
router.put('/:id/assign', protect, authorize('super-admin'), controller.assignTicket.bind(controller));
router.put('/:id/status', protect, checkReadOnlyMode, checkBoutiqueStatus, controller.updateTicketStatus.bind(controller));

module.exports = router;
