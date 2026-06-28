const repository = require('../repositories/tailoring.repository');
const prisma = require('../../../utils/prisma');
const notificationsService = require('../../notifications/services/notifications.service');
const { validateSubscriptionLimit, withSubscriptionGuard } = require('../../../services/subscriptionService');

class TailoringService {
  async logBookingHistory(bookingId, status, note) {
    return repository.createBookingHistory({
      bookingId,
      status,
      note
    });
  }

  async createBooking(body) {
    const { boutiqueId, customerName, customerEmail, customerMobile, bookingDate, bookingTime, notes, bookingType } = body;

    if (!boutiqueId || !customerName || !customerMobile || !bookingDate || !bookingTime) {
      throw new Error('Boutique ID, Name, Mobile, Date, and Time are required');
    }

    const booking = await withSubscriptionGuard(boutiqueId, 'bookings', async (tx) => {
      return repository.createBooking(tx, {
        boutiqueId,
        customerName,
        customerEmail,
        customerMobile,
        bookingDate: new Date(bookingDate),
        bookingTime,
        notes,
        bookingType: bookingType || 'STORE_VISIT',
        status: 'Pending'
      });
    });

    await this.logBookingHistory(booking.id, 'Pending', 'Booking appointment request submitted');

    const bookBoutique = await repository.findBoutiqueById(boutiqueId);
    if (bookBoutique && bookBoutique.ownerId) {
      await notificationsService.createAdminNotification({
        recipientType: 'OWNER',
        recipientId: bookBoutique.ownerId,
        boutiqueId,
        type: 'NEW_BOOKING',
        priority: 'NORMAL',
        title: 'New Booking Request',
        message: `${customerName} has requested a ${(bookingType || 'STORE_VISIT').replace(/_/g, ' ').toLowerCase()} appointment on ${new Date(bookingDate).toLocaleDateString()}.`,
        entityType: 'booking',
        entityId: booking.id,
      });
    }

    return booking;
  }

  async listBookings({ status, bookingType, startDate, endDate, page = 1, limit = 10, search }) {
    const skip = (page - 1) * limit;
    let where = {};

    if (status) where.status = status;
    if (bookingType) where.bookingType = bookingType;
    
    if (startDate || endDate) {
      where.bookingDate = {};
      if (startDate) where.bookingDate.gte = new Date(startDate);
      if (endDate) where.bookingDate.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerMobile: { contains: search, mode: 'insensitive' } }
      ];
    }

    const bookings = await repository.findBookings(
      where,
      {
        boutique: { select: { name: true } },
        assignedOwner: { select: { ownerName: true, email: true } },
        order: { select: { orderId: true, price: true } }
      },
      parseInt(skip),
      parseInt(limit),
      { bookingDate: 'asc' }
    );

    const total = await repository.countBookings(where);

    return {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: bookings
    };
  }

  async listOwnerBookings(boutiqueId, { status, bookingType, page = 1, limit = 10 }) {
    if (!boutiqueId) {
      throw new Error('Owner has no boutique assigned');
    }

    const skip = (page - 1) * limit;
    let where = { boutiqueId };

    if (status) where.status = status;
    if (bookingType) where.bookingType = bookingType;

    const bookings = await repository.findBookings(
      where,
      {
        assignedOwner: { select: { ownerName: true } },
        bookingHistories: { orderBy: { timestamp: 'desc' } },
        order: { select: { orderId: true, price: true } }
      },
      parseInt(skip),
      parseInt(limit),
      { bookingDate: 'asc' }
    );

    const total = await repository.countBookings(where);

    return {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: bookings
    };
  }

  async listCustomerBookings(phone) {
    if (!phone) {
      throw new Error('User profile phone is missing');
    }

    return repository.findBookings(
      { customerMobile: phone },
      {
        boutique: { select: { name: true, logoUrl: true, rating: true } },
        bookingHistories: { orderBy: { timestamp: 'desc' } }
      },
      0,
      1000,
      { bookingDate: 'desc' }
    );
  }

  async updateBookingStatus(id, { status, note, orderId }) {
    if (!['Pending', 'Accepted', 'Rejected', 'Rescheduled', 'Completed'].includes(status)) {
      throw new Error('Invalid status parameter');
    }

    const booking = await repository.findBookingById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }

    await validateSubscriptionLimit(booking.boutiqueId, 'bookings');

    let updateData = { status };
    if (status === 'Completed' && orderId) {
      updateData.orderId = orderId;
    }

    const updated = await repository.updateBooking(id, updateData);

    await this.logBookingHistory(id, status, note || `Status transitioned to ${status}`);

    // Create system notification
    await prisma.notification.create({
      data: {
        recipientRole: 'owner',
        boutiqueId: booking.boutiqueId,
        title: `Appointment Status Update: ${status}`,
        message: `Your booking request for ${new Date(booking.bookingDate).toLocaleDateString()} is ${status}. Note: ${note || 'None'}`,
        type: 'SYSTEM',
        createdAt: new Date()
      }
    });

    if (status === 'Accepted') {
      const customer = await repository.findUserByPhone(booking.customerMobile);
      if (customer) {
        await notificationsService.createCustomerNotification({
          customerId: customer.id,
          type: 'BOOKING_CONFIRMED',
          title: 'Booking Confirmed',
          message: `Your ${booking.bookingType.replace(/_/g, ' ').toLowerCase()} appointment on ${new Date(booking.bookingDate).toLocaleDateString()} has been confirmed.`,
          entityType: 'booking',
          entityId: booking.id,
        });
      }
    }

    if (status === 'Rejected') {
      const bkBoutique = await repository.findBoutiqueById(booking.boutiqueId);
      if (bkBoutique && bkBoutique.ownerId) {
        await notificationsService.createAdminNotification({
          recipientType: 'OWNER',
          recipientId: bkBoutique.ownerId,
          boutiqueId: booking.boutiqueId,
          type: 'BOOKING_CANCELLED',
          priority: 'NORMAL',
          title: 'Booking Rejected',
          message: `Booking for ${booking.customerName} on ${new Date(booking.bookingDate).toLocaleDateString()} has been rejected.`,
          entityType: 'booking',
          entityId: booking.id,
        });
      }
    }

    return updated;
  }

  async rescheduleBooking(id, { bookingDate, bookingTime, note }) {
    if (!bookingDate || !bookingTime) {
      throw new Error('New date and time are required for rescheduling');
    }

    const booking = await repository.findBookingById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }

    await validateSubscriptionLimit(booking.boutiqueId, 'bookings');

    const updated = await repository.updateBooking(id, {
      bookingDate: new Date(bookingDate),
      bookingTime,
      status: 'Rescheduled'
    });

    await this.logBookingHistory(
      id, 
      'Rescheduled', 
      note || `Rescheduled from ${new Date(booking.bookingDate).toLocaleDateString()} at ${booking.bookingTime} to ${new Date(bookingDate).toLocaleDateString()} at ${bookingTime}`
    );

    return updated;
  }

  async assignBookingOwner(id, { assignedOwnerId }) {
    const booking = await repository.findBookingById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }

    await validateSubscriptionLimit(booking.boutiqueId, 'bookings');

    const updated = await repository.updateBooking(id, { assignedOwnerId });

    await this.logBookingHistory(id, booking.status, `Assigned to staff owner ID: ${assignedOwnerId}`);

    return updated;
  }

  async updateBookingNotes(id, { notes }) {
    const booking = await repository.findBookingById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }

    await validateSubscriptionLimit(booking.boutiqueId, 'bookings');

    return repository.updateBooking(id, { notes });
  }

  async triggerBookingReminder(id) {
    const booking = await repository.findBookingById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }

    await validateSubscriptionLimit(booking.boutiqueId, 'bookings');

    await repository.updateBooking(id, { reminderSent: true });

    await prisma.notification.create({
      data: {
        recipientRole: 'owner',
        boutiqueId: booking.boutiqueId,
        title: 'Appointment Reminder Notification',
        message: `Friendly reminder: You have a scheduled ${booking.bookingType.replace('_', ' ')} appointment on ${new Date(booking.bookingDate).toLocaleDateString()} at ${booking.bookingTime}.`,
        type: 'SYSTEM',
        createdAt: new Date()
      }
    });

    return { success: true, message: 'Reminder successfully sent to client' };
  }

  async getBookingStats() {
    const [totalBookings, convertedBookings, convertedOrders] = await repository.getBookingStats();

    const conversionRate = totalBookings > 0 ? parseFloat(((convertedBookings / totalBookings) * 100).toFixed(2)) : 0.00;
    const revenueGenerated = convertedOrders.reduce((sum, b) => sum + (b.order ? Number(b.order.price) : 0), 0);
    const averageBookingValue = convertedBookings > 0 ? parseFloat((revenueGenerated / convertedBookings).toFixed(2)) : 0.00;

    return {
      totalBookings,
      convertedOrders: convertedBookings,
      conversionRate,
      revenueGenerated,
      averageBookingValue
    };
  }
}

module.exports = new TailoringService();
