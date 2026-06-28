const repository = require('../repositories/tickets.repository');
const { logAction } = require('../../../services/auditService');

class TicketsService {
  mapTicketResponse(t) {
    if (!t) return null;
    return {
      ...t,
      id: t.id,
      _id: t.id
    };
  }

  async createTicket({
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
  }) {
    if (!subject || !description || !ticketType) {
      throw new Error('Subject, description, and ticketType are required');
    }

    // --- Fraud & Risk Intelligence Heuristics ---
    let fraudScore = 0;
    let excessiveTicketFlag = false;

    // 1. Refund request without order ID flag
    if (ticketType === 'REFUND_REQUEST' && !orderId) {
      fraudScore += 40;
    }

    // 2. Scan past 30 days ticket load for excessive tickets flag
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const pastTicketsCount = await repository.countTickets({
      userId,
      createdAt: { gte: thirtyDaysAgo }
    });

    if (pastTicketsCount >= 3) {
      fraudScore += 30;
      excessiveTicketFlag = true;
    }

    // 3. Determine risk level
    let riskLevel = 'LOW';
    if (fraudScore >= 60) {
      riskLevel = 'HIGH';
    } else if (fraudScore >= 30) {
      riskLevel = 'MEDIUM';
    }

    const ticket = await repository.createTicket({
      userId,
      boutiqueId: boutiqueId || null,
      orderId: orderId || null,
      ticketType,
      priority: priority || 'MEDIUM',
      source: source || 'WEB',
      subject,
      description,
      status: 'OPEN',
      fraudScore,
      riskLevel,
      excessiveTicketFlag,
      attachmentUrl: attachmentUrl || null,
      attachmentType: attachmentType || null
    });

    await logAction('CREATE_SUPPORT_TICKET', 'SupportTicket', ticket.id, userId, { ticketType, riskLevel });

    return this.mapTicketResponse(ticket);
  }

  async getTicketsForCustomer(userId) {
    const tickets = await repository.getTickets(
      { userId },
      {
        boutique: { select: { id: true, name: true } },
        order: { select: { id: true, orderId: true } }
      }
    );
    return tickets.map(t => this.mapTicketResponse(t));
  }

  async getTicketsForOwner(boutiqueId) {
    if (!boutiqueId) {
      throw new Error('No boutique assigned to this owner');
    }
    const tickets = await repository.getTickets(
      { boutiqueId },
      {
        user: { select: { id: true, name: true, phone: true } },
        order: { select: { id: true, orderId: true } }
      }
    );
    return tickets.map(t => this.mapTicketResponse(t));
  }

  async getTicketsForAdmin({ status, priority, ticketType, riskLevel, slaBreached }) {
    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (ticketType) where.ticketType = ticketType;
    if (riskLevel) where.riskLevel = riskLevel;
    if (slaBreached !== undefined) where.slaBreached = (slaBreached === 'true');

    const tickets = await repository.getTickets(
      where,
      {
        user: { select: { id: true, name: true, phone: true } },
        boutique: { select: { id: true, name: true } },
        order: { select: { id: true, orderId: true } },
        assignedAdmin: { select: { id: true, ownerName: true } }
      }
    );
    return tickets.map(t => this.mapTicketResponse(t));
  }

  async getTicketDetails(id, user) {
    const ticket = await repository.getTicketById(id, {
      user: { select: { id: true, name: true, phone: true } },
      boutique: { select: { id: true, name: true } },
      order: { select: { id: true, orderId: true } },
      assignedAdmin: { select: { id: true, ownerName: true } }
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Scoping checks
    if (user.role === 'owner' && ticket.boutiqueId !== user.assignedBoutiqueId) {
      throw new Error('Access denied');
    }
    if (user.role === 'customer' && ticket.userId !== user.id) {
      throw new Error('Access denied');
    }

    return this.mapTicketResponse(ticket);
  }

  async getTicketMessages(id, user) {
    const ticket = await repository.getTicketById(id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Checks
    if (user.role === 'owner' && ticket.boutiqueId !== user.assignedBoutiqueId) {
      throw new Error('Access denied');
    }

    return repository.getTicketMessages(id);
  }

  async postMessage(ticketId, { senderType, senderId, senderName, message, attachmentUrl, attachmentType }) {
    if (!message) {
      throw new Error('Message is required');
    }

    const ticket = await repository.getTicketById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const now = new Date();
    const updateData = { updatedAt: now };

    // SLA firstResponseAt trigger: if first response from support staff/admin or boutique owner
    if ((senderType === 'ADMIN' || senderType === 'BOUTIQUE') && !ticket.firstResponseAt) {
      updateData.firstResponseAt = now;
    }

    const msg = {
      ticketId,
      senderType,
      senderId,
      senderName,
      message,
      attachmentUrl: attachmentUrl || null,
      attachmentType: attachmentType || null
    };

    return repository.createMessage(msg, updateData);
  }

  async getTicketNotes(ticketId) {
    return repository.getTicketNotes(ticketId);
  }

  async addTicketNote(ticketId, adminId, note) {
    if (!note) {
      throw new Error('Note is required');
    }
    return repository.createNote({
      ticketId,
      adminId,
      note
    });
  }

  async assignTicket(id, assignedAdminId, performerId) {
    const ticket = await repository.updateTicket(
      id,
      { assignedAdminId },
      { assignedAdmin: { select: { id: true, ownerName: true } } }
    );
    await logAction('ASSIGN_SUPPORT_TICKET', 'SupportTicket', ticket.id, performerId, { assignedAdminId });
    return this.mapTicketResponse(ticket);
  }

  async updateTicketStatus(id, status, performerId) {
    if (!status) {
      throw new Error('Status is required');
    }

    const ticket = await repository.getTicketById(id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const now = new Date();
    const updateData = { status, updatedAt: now };

    if (status === 'RESOLVED' || status === 'CLOSED') {
      updateData.resolvedAt = now;

      // SLA breach rule: resolved time > 24 hours
      const diffMs = now.getTime() - new Date(ticket.createdAt).getTime();
      if (diffMs > 24 * 60 * 60 * 1000) {
        updateData.slaBreached = true;
      }
    }

    const updatedTicket = await repository.updateTicket(id, updateData);

    await logAction('UPDATE_SUPPORT_TICKET_STATUS', 'SupportTicket', updatedTicket.id, performerId, {
      before: ticket.status,
      after: status,
      slaBreached: updatedTicket.slaBreached
    });

    return this.mapTicketResponse(updatedTicket);
  }

  async getTicketAnalytics() {
    const [
      totalCount,
      openCount,
      resolvedCount,
      closedCount,
      inProgressCount,
      breachCount,
      resolvedTickets,
      categories,
      priorities,
      risks
    ] = await Promise.all([
      repository.countTickets(),
      repository.countTickets({ status: 'OPEN' }),
      repository.countTickets({ status: 'RESOLVED' }),
      repository.countTickets({ status: 'CLOSED' }),
      repository.countTickets({ status: 'IN_PROGRESS' }),
      repository.countTickets({ slaBreached: true }),
      repository.getResolvedTicketsWithTimes(),
      repository.getTicketsGroupByField('ticketType'),
      repository.getTicketsGroupByField('priority'),
      repository.getTicketsGroupByField('riskLevel')
    ]);

    const resolutionRate = totalCount > 0 ? Number(((resolvedCount + closedCount) / totalCount * 100).toFixed(1)) : 0;

    let avgResolutionHours = 0;
    if (resolvedTickets.length > 0) {
      const sumMs = resolvedTickets.reduce((sum, t) => sum + (new Date(t.resolvedAt) - new Date(t.createdAt)), 0);
      avgResolutionHours = Number((sumMs / (1000 * 60 * 60) / resolvedTickets.length).toFixed(1));
    }

    const categoryBreakdown = {};
    categories.forEach(c => {
      categoryBreakdown[c.ticketType] = c._count._all;
    });

    const priorityDistribution = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    priorities.forEach(p => {
      priorityDistribution[p.priority] = p._count._all;
    });

    const riskLevels = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    risks.forEach(r => {
      riskLevels[r.riskLevel] = r._count._all;
    });

    return {
      totalTickets: totalCount,
      openTickets: openCount,
      inProgressTickets: inProgressCount,
      resolvedTickets: resolvedCount,
      closedTickets: closedCount,
      slaBreaches: breachCount,
      resolutionRate,
      avgResolutionHours,
      categoryBreakdown,
      priorityDistribution,
      riskLevels
    };
  }
}

module.exports = new TicketsService();
