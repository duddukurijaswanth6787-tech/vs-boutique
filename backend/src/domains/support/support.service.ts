import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { sanitizePlainText } from '@common/utils/sanitize';
import { SupportRepository } from './support.repository';
import {
  CreateContactMessageDto,
  CreateSupportTicketDto,
  CreateSupportReplyDto,
  UpdateTicketStatusDto,
  ContactQueryDto,
  TicketQueryDto,
  ContactMessageResponse,
  SupportTicketResponse,
  SupportReplyResponse,
} from './support.types';

@Injectable()
export class SupportService {
  constructor(
    private readonly supportRepository: SupportRepository,
    private readonly auditService: AuditService,
  ) {}

  private toContactResponse(c: any): ContactMessageResponse {
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone ?? undefined,
      subject: c.subject,
      message: c.message,
      status: c.status,
      assignedTo: c.assignedTo ?? undefined,
      createdAt: c.createdAt,
    };
  }

  private toReplyResponse(r: any): SupportReplyResponse {
    return {
      id: r.id,
      message: r.message,
      isStaff: r.isStaff,
      attachments: r.attachments ?? [],
      createdAt: r.createdAt,
    };
  }

  private toTicketResponse(t: any): SupportTicketResponse {
    return {
      id: t.id,
      ticketNumber: t.ticketNumber,
      customerId: t.customerId ?? undefined,
      subject: t.subject,
      description: t.description,
      category: t.category ?? undefined,
      priority: t.priority,
      status: t.status,
      assignedTo: t.assignedTo ?? undefined,
      replies: t.replies?.map((r: any) => this.toReplyResponse(r)),
      createdAt: t.createdAt,
    };
  }

  async findContacts(query: ContactQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.supportRepository.findContacts({
      status: query.status,
      page,
      limit,
    });
    return {
      data: result.data.map((c: any) => this.toContactResponse(c)),
      meta: result.meta,
    };
  }

  async createContact(dto: CreateContactMessageDto) {
    dto.subject = sanitizePlainText(dto.subject);
    dto.message = sanitizePlainText(dto.message);
    const contact = await this.supportRepository.createContact({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      subject: dto.subject,
      message: dto.message,
      status: 'NEW',
    });
    return this.toContactResponse(contact);
  }

  async updateContactStatus(id: string, status: string, assignedTo?: string) {
    const contact = await this.supportRepository.findContactById(id);
    if (!contact)
      throw new BusinessException('Contact not found', 'SUPPORT_002');
    const updateData: any = { status };
    if (assignedTo) updateData.assignedTo = assignedTo;
    await this.supportRepository.updateContact(id, updateData);
    const updated = await this.supportRepository.findContactById(id);
    return this.toContactResponse(updated);
  }

  async findTickets(query: TicketQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.supportRepository.findTickets({
      status: query.status,
      priority: query.priority,
      customerId: query.customerId,
      page,
      limit,
    });
    return {
      data: result.data.map((t: any) => this.toTicketResponse(t)),
      meta: result.meta,
    };
  }

  async findTicketById(id: string) {
    const ticket = await this.supportRepository.findTicketById(id);
    if (!ticket) throw new BusinessException('Ticket not found', 'SUPPORT_001');
    return this.toTicketResponse(ticket);
  }

  async createTicket(userId: string, dto: CreateSupportTicketDto) {
    dto.subject = sanitizePlainText(dto.subject);
    dto.description = sanitizePlainText(dto.description);
    const ticketNumber = await this.supportRepository.generateTicketNumber();
    const ticket = await this.supportRepository.createTicket({
      ticketNumber,
      customer: { connect: { id: userId } },
      subject: dto.subject,
      description: dto.description,
      category: dto.category ?? 'GENERAL',
      priority: dto.priority ?? 'MEDIUM',
      status: 'OPEN',
    });
    await this.auditService.log({
      action: 'SUPPORT_CREATED',
      module: 'support',
      resource: 'support_ticket',
      resourceId: ticket.id,
      userId,
      newValue: { ticketNumber, subject: dto.subject },
    });
    return this.findTicketById(ticket.id);
  }

  async updateTicketStatus(id: string, dto: UpdateTicketStatusDto) {
    const ticket = await this.supportRepository.findTicketById(id);
    if (!ticket) throw new BusinessException('Ticket not found', 'SUPPORT_001');
    const updateData: any = {};
    if (dto.status) updateData.status = dto.status;
    if (dto.assignedTo) updateData.assignedTo = dto.assignedTo;
    if (dto.priority) updateData.priority = dto.priority;
    await this.supportRepository.updateTicket(id, updateData);
    return this.findTicketById(id);
  }

  async addReply(ticketId: string, dto: CreateSupportReplyDto) {
    const ticket = await this.supportRepository.findTicketById(ticketId);
    if (!ticket) throw new BusinessException('Ticket not found', 'SUPPORT_001');
    const reply = await this.supportRepository.createReply({
      ticket: { connect: { id: ticketId } },
      message: dto.message,
      isStaff: false,
      attachments: dto.attachments ?? [],
    });
    return this.toReplyResponse(reply);
  }
}
