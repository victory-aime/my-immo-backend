import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { API_URL } from '_root/config/api';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get(API_URL.NOTIFICATION.GET_ALL)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer toutes les notifications' })
  @ApiOkResponse({
    description: 'Liste recue avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async getAllNotifications(@Query('recipientId') recipientId: string) {
    return this.notificationsService.getAllNotifications(recipientId);
  }

  @Post(API_URL.NOTIFICATION.READ_ALL)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lire toutes les notifications' })
  @ApiOkResponse({
    description: 'Toutes les notifications ont ete lues avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async markAllAsRead(@Query('recipientId') recipientId: string) {
    return this.notificationsService.markAllAsRead(recipientId);
  }

  @Post(API_URL.NOTIFICATION.READ_ONE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lire une notification' })
  @ApiOkResponse({
    description: 'Notification lue avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async readOneNotification(
    @Query('notificationId') notificationId: string,
    @Query('recipientId') recipientId: string,
  ) {
    return this.notificationsService.markAsRead(notificationId, recipientId);
  }

  @Get(API_URL.NOTIFICATION.GET_UNREAD_NOTIF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lire une notification' })
  @ApiOkResponse({
    description: 'Notification lue avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async getAllUnreadNotification(@Query('recipientId') recipientId: string) {
    return this.notificationsService.getUnreadNotifications(recipientId);
  }
}
