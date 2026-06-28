const prisma = require('../../../utils/prisma');

class TicketsRepository {
  async createTicket(data) {
    return prisma.supportTicket.create({
      data,
      include: {
        user: { select: { id: true, name: true, phone: true } },
        boutique: { select: { id: true, name: true } }
      }
    });
  }

  async countTickets(where = {}) {
    return prisma.supportTicket.count({ where });
  }

  async getTickets(where = {}, include = {}) {
    return prisma.supportTicket.findMany({
      where,
      include,
      orderBy: { createdAt: 'desc' }
    });
  }

  async getTicketById(id, include = {}) {
    return prisma.supportTicket.findUnique({
      where: { id },
      include
    });
  }

  async getResolvedTicketsWithTimes() {
    return prisma.supportTicket.findMany({
      where: {
        status: { in: ['RESOLVED', 'CLOSED'] },
        resolvedAt: { not: null }
      },
      select: { createdAt: true, resolvedAt: true }
    });
  }

  async getTicketsGroupByField(field) {
    return prisma.supportTicket.groupBy({
      by: [field],
      _count: { _all: true }
    });
  }

  async getTicketMessages(ticketId) {
    return prisma.supportTicketMessage.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' }
    });
  }

  async createMessage(messageData, ticketUpdateData) {
    return prisma.$transaction(async (tx) => {
      const msg = await tx.supportTicketMessage.create({
        data: messageData
      });
      await tx.supportTicket.update({
        where: { id: messageData.ticketId },
        data: ticketUpdateData
      });
      return msg;
    });
  }

  async getTicketNotes(ticketId) {
    return prisma.supportTicketAdminNote.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createNote(data) {
    return prisma.supportTicketAdminNote.create({
      data
    });
  }

  async updateTicket(id, data, include = {}) {
    return prisma.supportTicket.update({
      where: { id },
      data,
      include
    });
  }
}

module.exports = new TicketsRepository();
