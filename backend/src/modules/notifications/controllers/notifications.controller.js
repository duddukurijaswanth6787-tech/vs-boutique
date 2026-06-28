const { notificationsService, NotificationError } = require('../services/notifications.service');

class NotificationsController {
  // ── Admin Notifications Controllers ──
  async getAdminNotifications(req, res) {
    try {
      const { limit, offset, unreadOnly, type, priority } = req.query;
      const result = await notificationsService.getAdminNotifications(
        req.user.id,
        req.user.role,
        req.user.assignedBoutiqueId,
        {
          limit: parseInt(limit) || 50,
          offset: parseInt(offset) || 0,
          unreadOnly: unreadOnly === 'true',
          type,
          priority,
        }
      );
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getAdminUnreadCount(req, res) {
    try {
      const count = await notificationsService.getAdminUnreadCount(req.user.id, req.user.role, req.user.assignedBoutiqueId);
      res.json({ success: true, count });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async markAdminNotificationRead(req, res) {
    try {
      await notificationsService.markAdminNotificationRead(req.params.id, req.user.id);
      res.json({ success: true, message: 'Notification marked as read' });
    } catch (err) {
      if (err instanceof NotificationError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async markAllAdminNotificationsRead(req, res) {
    try {
      await notificationsService.markAllAdminNotificationsRead(req.user.id, req.user.role, req.user.assignedBoutiqueId);
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async deleteAdminNotification(req, res) {
    try {
      await notificationsService.deleteAdminNotification(req.params.id, req.user.id);
      res.json({ success: true, message: 'Notification deleted' });
    } catch (err) {
      if (err instanceof NotificationError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── Customer Notifications Controllers ──
  async getCustomerNotifications(req, res) {
    try {
      const { limit, offset, unreadOnly } = req.query;
      const result = await notificationsService.getCustomerNotifications(req.user.id, {
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0,
        unreadOnly: unreadOnly === 'true',
      });
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getCustomerUnreadCount(req, res) {
    try {
      const count = await notificationsService.getCustomerUnreadCount(req.user.id);
      res.json({ success: true, count });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async markCustomerAsRead(req, res) {
    try {
      await notificationsService.markCustomerAsRead(req.params.id, req.user.id);
      res.json({ success: true, message: 'Notification marked as read' });
    } catch (err) {
      if (err instanceof NotificationError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async markAllCustomerRead(req, res) {
    try {
      await notificationsService.markAllCustomerRead(req.user.id);
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async deleteCustomerNotification(req, res) {
    try {
      await notificationsService.deleteCustomerNotification(req.params.id, req.user.id);
      res.json({ success: true, message: 'Notification deleted' });
    } catch (err) {
      if (err instanceof NotificationError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── General / Campaign / Broadcast Controllers ──
  async getGeneralNotifications(req, res) {
    try {
      const notifications = await notificationsService.getGeneralNotifications(req.user.id, req.user.role);
      res.json(notifications);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async markGeneralNotificationRead(req, res) {
    try {
      await notificationsService.markGeneralNotificationRead(req.params.id, req.user.id);
      res.json({ message: 'Notification marked as read' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async getSuperAdminAnalytics(req, res) {
    try {
      const result = await notificationsService.getSuperAdminAnalytics();
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async broadcastNotification(req, res) {
    try {
      const result = await notificationsService.broadcastNotification(req.user.id, req.body);
      res.status(201).json({
        success: true,
        data: result.notification,
        recipientsCount: result.recipientsCount
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async getTemplates(req, res) {
    try {
      const templates = await notificationsService.getTemplates();
      res.json(templates);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async createTemplate(req, res) {
    try {
      const template = await notificationsService.createTemplate(req.body);
      res.status(201).json(template);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async getCampaigns(req, res) {
    try {
      const campaigns = await notificationsService.getCampaigns();
      res.json(campaigns);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async createCampaign(req, res) {
    try {
      const campaign = await notificationsService.createCampaign(req.body);
      res.status(201).json(campaign);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}

module.exports = new NotificationsController();
