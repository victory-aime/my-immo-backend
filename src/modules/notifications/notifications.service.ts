import { Injectable } from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';
import { NotificationsDto } from './notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createNotification(payload: NotificationsDto) {
    return this.prisma.notification.create({
      data: {
        ...payload,
      },
    });
  }

  async getUnreadNotifications(recipientId: string) {
    return this.prisma.notification.findMany({
      where: {
        recipientId,
        isRead: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAllNotifications(recipientId: string) {
    return this.prisma.notification.findMany({
      where: {
        recipientId,
      },
      include: {},
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async markAsRead(notificationId: string, recipientId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        recipientId, // sécurité : on ne peut marquer que les siennes
      },
      data: {
        isRead: true,
      },
    });
  }

  async markAllAsRead(recipientId: string) {
    return this.prisma.notification.updateMany({
      where: {
        recipientId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }
}
