const service = require('../services/tickets.service');

class TicketsController {
  async createTicket(req, res) {
    try {
      const { boutiqueId, orderId, ticketType, priority, source, subject, description, attachmentUrl, attachmentType } = req.body;
      let userId = req.body.userId;
      if (!userId && req.user) {
        userId = req.user.id;
      }
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const ticket = await service.createTicket({
        userId,
        boutiqueId,
        orderId,
        ticketType,
        priority,
        source,
        subject,
        description,
        attachmentUrl,
        attachmentType
      });

      return res.status(201).json(ticket);
    } catch (err) {
      console.error('[TicketsController.createTicket]', err);
      return res.status(400).json({ message: err.message });
    }
  }

  async getTicketsForCustomer(req, res) {
    try {
      const userId = req.user.id || req.query.userId;
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      const tickets = await service.getTicketsForCustomer(userId);
      return res.json(tickets);
    } catch (err) {
      console.error('[TicketsController.getTicketsForCustomer]', err);
      return res.status(500).json({ message: err.message });
    }
  }

  async getTicketsForOwner(req, res) {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      const tickets = await service.getTicketsForOwner(boutiqueId);
      return res.json(tickets);
    } catch (err) {
      console.error('[TicketsController.getTicketsForOwner]', err);
      return res.status(400).json({ message: err.message });
    }
  }

  async getTicketsForAdmin(req, res) {
    try {
      const { status, priority, ticketType, riskLevel, slaBreached } = req.query;
      const tickets = await service.getTicketsForAdmin({ status, priority, ticketType, riskLevel, slaBreached });
      return res.json(tickets);
    } catch (err) {
      console.error('[TicketsController.getTicketsForAdmin]', err);
      return res.status(500).json({ message: err.message });
    }
  }

  async getTicketDetails(req, res) {
    try {
      const ticket = await service.getTicketDetails(req.params.id, req.user);
      return res.json(ticket);
    } catch (err) {
      console.error('[TicketsController.getTicketDetails]', err);
      const status = err.message === 'Ticket not found' ? 404 : (err.message === 'Access denied' ? 403 : 500);
      return res.status(status).json({ message: err.message });
    }
  }

  async getTicketMessages(req, res) {
    try {
      const messages = await service.getTicketMessages(req.params.id, req.user);
      return res.json(messages);
    } catch (err) {
      console.error('[TicketsController.getTicketMessages]', err);
      const status = err.message === 'Ticket not found' ? 404 : (err.message === 'Access denied' ? 403 : 500);
      return res.status(status).json({ message: err.message });
    }
  }

  async postMessage(req, res) {
    try {
      const { senderType, senderId, senderName, message, attachmentUrl, attachmentType } = req.body;
      const result = await service.postMessage(req.params.id, {
        senderType,
        senderId,
        senderName,
        message,
        attachmentUrl,
        attachmentType
      });
      return res.status(201).json(result);
    } catch (err) {
      console.error('[TicketsController.postMessage]', err);
      const status = err.message === 'Ticket not found' ? 404 : 400;
      return res.status(status).json({ message: err.message });
    }
  }

  async getTicketNotes(req, res) {
    try {
      const notes = await service.getTicketNotes(req.params.id);
      return res.json(notes);
    } catch (err) {
      console.error('[TicketsController.getTicketNotes]', err);
      return res.status(500).json({ message: err.message });
    }
  }

  async addTicketNote(req, res) {
    try {
      const { note } = req.body;
      const adminId = req.user.id;
      const newNote = await service.addTicketNote(req.params.id, adminId, note);
      return res.status(201).json(newNote);
    } catch (err) {
      console.error('[TicketsController.addTicketNote]', err);
      return res.status(400).json({ message: err.message });
    }
  }

  async assignTicket(req, res) {
    try {
      const { assignedAdminId } = req.body;
      const ticket = await service.assignTicket(req.params.id, assignedAdminId, req.user.id);
      return res.json(ticket);
    } catch (err) {
      console.error('[TicketsController.assignTicket]', err);
      return res.status(500).json({ message: err.message });
    }
  }

  async updateTicketStatus(req, res) {
    try {
      const { status } = req.body;
      const ticket = await service.updateTicketStatus(req.params.id, status, req.user.id);
      return res.json(ticket);
    } catch (err) {
      console.error('[TicketsController.updateTicketStatus]', err);
      const status = err.message === 'Ticket not found' ? 404 : 400;
      return res.status(status).json({ message: err.message });
    }
  }

  async getTicketAnalytics(req, res) {
    try {
      const analytics = await service.getTicketAnalytics();
      return res.json({
        success: true,
        data: analytics
      });
    } catch (err) {
      console.error('[TicketsController.getTicketAnalytics]', err);
      return res.status(500).json({ message: err.message });
    }
  }
}

module.exports = new TicketsController();
