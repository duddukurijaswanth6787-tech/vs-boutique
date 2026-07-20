import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { sanitizePlainText } from '@common/utils/sanitize';
import { NotificationRepository } from './notification.repository';
import {
  CreateNotificationDto,
  NotificationQueryDto,
  NotificationResponse,
} from './notification.types';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly auditService: AuditService,
  ) {}

  private toResponse(n: any): NotificationResponse {
    return {
      id: n.id,
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data ?? undefined,
      isRead: n.isRead,
      isArchived: n.isArchived,
      readAt: n.readAt ?? undefined,
      createdAt: n.createdAt,
    };
  }

  async findAll(userId: string, query: NotificationQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.notificationRepository.findAll({
      userId,
      type: query.type,
      isRead: query.isRead,
      page,
      limit,
    });
    return {
      data: result.data.map((n) => this.toResponse(n)),
      meta: result.meta,
    };
  }

  async findById(id: string, userId: string) {
    const notification = await this.notificationRepository.findById(id);
    if (!notification || notification.userId !== userId)
      throw new BusinessException('Notification not found', 'NOTIFICATION_001');
    return this.toResponse(notification);
  }

  async create(dto: CreateNotificationDto) {
    dto.title = sanitizePlainText(dto.title);
    dto.message = sanitizePlainText(dto.message);
    const notification = await this.notificationRepository.create({
      user: { connect: { id: dto.userId } },
      type: dto.type,
      title: dto.title,
      message: dto.message,
      data: dto.data,
    });
    await this.auditService.log({
      action: 'NOTIFICATION_CREATED',
      module: 'notification',
      resource: 'notification',
      resourceId: notification.id,
      userId: dto.userId,
    });
    return this.toResponse(notification);
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationRepository.findById(id);
    if (!notification || notification.userId !== userId)
      throw new BusinessException('Notification not found', 'NOTIFICATION_001');
    await this.notificationRepository.markAsRead(id);
    const updated = await this.notificationRepository.findById(id);
    return this.toResponse(updated);
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.markAllAsRead(userId);
  }

  async archive(id: string, userId: string) {
    const notification = await this.notificationRepository.findById(id);
    if (!notification || notification.userId !== userId)
      throw new BusinessException('Notification not found', 'NOTIFICATION_001');
    await this.notificationRepository.update(id, { isArchived: true });
    const updated = await this.notificationRepository.findById(id);
    return this.toResponse(updated);
  }

  async delete(id: string, userId: string) {
    const notification = await this.notificationRepository.findById(id);
    if (!notification || notification.userId !== userId)
      throw new BusinessException('Notification not found', 'NOTIFICATION_001');
    await this.notificationRepository.update(id, { isArchived: true });
  }

  async getUnreadCount(userId: string) {
    return this.notificationRepository.getUnreadCount(userId);
  }
}
