const service = require('../services/tailoring.service');

class TailoringController {
  async createBooking(req, res) {
    try {
      const booking = await service.createBooking(req.body);
      return res.status(201).json({ success: true, data: booking });
    } catch (err) {
      console.error('[TailoringController.createBooking]', err);
      return res.status(400).json({ message: err.message });
    }
  }

  async listBookings(req, res) {
    try {
      const { status, bookingType, startDate, endDate, page = 1, limit = 10, search } = req.query;
      const result = await service.listBookings({ status, bookingType, startDate, endDate, page, limit, search });
      return res.json(result);
    } catch (err) {
      console.error('[TailoringController.listBookings]', err);
      return res.status(500).json({ message: err.message });
    }
  }

  async listOwnerBookings(req, res) {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      const { status, bookingType, page = 1, limit = 10 } = req.query;
      const result = await service.listOwnerBookings(boutiqueId, { status, bookingType, page, limit });
      return res.json(result);
    } catch (err) {
      console.error('[TailoringController.listOwnerBookings]', err);
      return res.status(400).json({ message: err.message });
    }
  }

  async listCustomerBookings(req, res) {
    try {
      const phone = req.user?.phone;
      const bookings = await service.listCustomerBookings(phone);
      return res.json({ success: true, data: bookings });
    } catch (err) {
      console.error('[TailoringController.listCustomerBookings]', err);
      return res.status(400).json({ message: err.message });
    }
  }

  async updateBookingStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, note, orderId } = req.body;
      const updated = await service.updateBookingStatus(id, { status, note, orderId });
      return res.json({ success: true, data: updated });
    } catch (err) {
      console.error('[TailoringController.updateBookingStatus]', err);
      return res.status(500).json({ message: err.message });
    }
  }

  async rescheduleBooking(req, res) {
    try {
      const { id } = req.params;
      const { bookingDate, bookingTime, note } = req.body;
      const updated = await service.rescheduleBooking(id, { bookingDate, bookingTime, note });
      return res.json({ success: true, data: updated });
    } catch (err) {
      console.error('[TailoringController.rescheduleBooking]', err);
      return res.status(500).json({ message: err.message });
    }
  }

  async assignBookingOwner(req, res) {
    try {
      const { id } = req.params;
      const { assignedOwnerId } = req.body;
      const updated = await service.assignBookingOwner(id, { assignedOwnerId });
      return res.json({ success: true, data: updated });
    } catch (err) {
      console.error('[TailoringController.assignBookingOwner]', err);
      return res.status(500).json({ message: err.message });
    }
  }

  async updateBookingNotes(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const updated = await service.updateBookingNotes(id, { notes });
      return res.json({ success: true, data: updated });
    } catch (err) {
      console.error('[TailoringController.updateBookingNotes]', err);
      return res.status(500).json({ message: err.message });
    }
  }

  async triggerBookingReminder(req, res) {
    try {
      const { id } = req.params;
      const result = await service.triggerBookingReminder(id);
      return res.json(result);
    } catch (err) {
      console.error('[TailoringController.triggerBookingReminder]', err);
      return res.status(500).json({ message: err.message });
    }
  }

  async getBookingStats(req, res) {
    try {
      const stats = await service.getBookingStats();
      return res.json({
        success: true,
        stats
      });
    } catch (err) {
      console.error('[TailoringController.getBookingStats]', err);
      return res.status(500).json({ message: err.message });
    }
  }
}

module.exports = new TailoringController();
