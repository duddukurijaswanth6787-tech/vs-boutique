const prisma = require('../../../utils/prisma');

class TailoringRepository {
  async findBoutiqueById(id) {
    return prisma.boutique.findUnique({ where: { id } });
  }

  async findUserByPhone(phone) {
    return prisma.user.findUnique({ where: { phone } });
  }

  async findBookingById(id) {
    return prisma.booking.findUnique({ where: { id } });
  }

  async findBookings(where, include = {}, skip = 0, take = 10, orderBy = { bookingDate: 'asc' }) {
    return prisma.booking.findMany({
      where,
      include,
      skip,
      take,
      orderBy
    });
  }

  async countBookings(where) {
    return prisma.booking.count({ where });
  }

  async createBooking(tx, data) {
    return tx.booking.create({
      data
    });
  }

  async updateBooking(id, data) {
    return prisma.booking.update({
      where: { id },
      data
    });
  }

  async createBookingHistory(data) {
    return prisma.bookingHistory.create({
      data
    });
  }

  async getBookingStats() {
    return Promise.all([
      prisma.booking.count({}),
      prisma.booking.count({ where: { orderId: { not: null } } }),
      prisma.booking.findMany({
        where: { orderId: { not: null } },
        select: { order: { select: { price: true } } }
      })
    ]);
  }
}

module.exports = new TailoringRepository();
