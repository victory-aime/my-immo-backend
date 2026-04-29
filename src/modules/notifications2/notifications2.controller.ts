import { Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { Notifications2Service } from './notifications2.service';
import { AllowAnonymous, AuthGuard } from '@thallesp/nestjs-better-auth';
import { MiddlewareGuard } from '_root/guard/middleware.guard';
import { API_URL } from '_root/config/api';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller()
@UseGuards(AuthGuard, MiddlewareGuard)
@AllowAnonymous() // TEMPORAIRE — a retirer quand l'auth sera reglee
export class Notifications2Controller {
  constructor(private readonly notificationsService: Notifications2Service) {}

  // GET v1/secure/notifications/all?userId=
  // Recuperer toutes les notifications d'un utilisateur

  @Get(API_URL.NOTIFICATION.GET_ALL)
  @ApiOperation({ summary: "Recuperer toutes les notifications d'un utilisateur" })
  @ApiOkResponse({ description: 'Notifications recuperees avec succes' })
  @ApiBadRequestResponse({ description: 'Une erreur est survenue' })
  async getAllNotifications(@Query('userId') userId: string) {
    return this.notificationsService.getAllNotifications(userId);
  }

  // GET v1/secure/notifications/get-all-unread?userId=
  // Recuperer les notifications non lues

  @Get(API_URL.NOTIFICATION.GET_UNREAD_NOTIF)
  @ApiOperation({ summary: "Recuperer les notifications non lues d'un utilisateur" })
  @ApiOkResponse({ description: 'Notifications non lues recuperees avec succes' })
  @ApiBadRequestResponse({ description: 'Une erreur est survenue' })
  async getUnreadNotifications(@Query('userId') userId: string) {
    return this.notificationsService.getUnreadNotifications(userId);
  }

  // PATCH v1/secure/notifications/read?notificationId=
  // Marquer une notification comme lue

  @Patch(API_URL.NOTIFICATION.READ_ONE)
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  @ApiOkResponse({ description: 'Notification marquee comme lue' })
  @ApiBadRequestResponse({ description: 'Une erreur est survenue' })
  async readOneNotification(@Query('notificationId') notificationId: string) {
    return this.notificationsService.readOneNotification(notificationId);
  }

  // PATCH v1/secure/notifications/read-all?userId=
  // Marquer toutes les notifications comme lues

  @Patch(API_URL.NOTIFICATION.READ_ALL)
  @ApiOperation({ summary: 'Marquer toutes les notifications comme lues' })
  @ApiOkResponse({ description: 'Toutes les notifications marquees comme lues' })
  @ApiBadRequestResponse({ description: 'Une erreur est survenue' })
  async readAllNotifications(@Query('userId') userId: string) {
    return this.notificationsService.readAllNotifications(userId);
  }
}
