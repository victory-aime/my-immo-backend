import { HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SendNotificationDto } from './notifications2.dto';
import { PrismaService } from '_root/database/prisma.service';
import { HttpError } from '_root/config/http.error';

@Injectable()
export class Notifications2Service {
  constructor(private readonly prisma: PrismaService) {}

  // ENVOYER UNE NOTIFICATION (methode generique utilisee par les autres services)
  // Exemple : appelee par VisitsService quand une visite est planifiee
  //           appelee par LeadsService quand un agent est assigne

  async sendNotification(dto: SendNotificationDto) {
    try {
      // On crée la notification en base avec toutes les infos du dto
      return this.prisma.notification.create({
        data: {
          type: dto.type,
          title: dto.title,
          content: dto.content,
          recipientId: dto.recipientId,
          senderId: dto.senderId ?? null,
          agencyId: dto.agencyId ?? null,
          isRead: false,
        },
      });
    } catch (error) {
      console.error('Erreur sendNotification:', error);
      // On ne bloque pas l'action principale si la notification échoue
      return null;
    }
  }
  //RECUPERER TOUTES LES NOTIFICATIONS D'UN UTILISATEUR
  async getAllNotifications(userId: string) {
    try {
      // On récupère toutes les notifications de l'utilisateur
      // triées de la plus récente à la plus ancienne
      const notifications = await this.prisma.notification.findMany({
        where: { recipientId: userId },
        orderBy: { createdAt: 'desc' },
      });

      // On retourne un message simple + les données
      return {
        message: 'Notifications récupérées avec succès',
        data: notifications,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez réessayer plus tard.',
      );
    }
  }
  // RECUPERER LES NOTIFICATIONS NON LUES D'UN UTILISATEUR
  async getUnreadNotifications(userId: string) {
    try {
      // On récupère uniquement les notifications non lues (isRead: false)
      // triées de la plus récente à la plus ancienne
      const notifications = await this.prisma.notification.findMany({
        where: { recipientId: userId, isRead: false },
        orderBy: { createdAt: 'desc' },
      });

      // On retourne un message simple + les données non lues
      return {
        message: 'Notifications non lues récupérées avec succès',
        data: notifications,
      };
    } catch (error) {
      console.error('Erreur getUnreadNotifications:', error);
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez réessayer plus tard.',
      );
    }
  }
  // MARQUER UNE NOTIFICATION COMME LUE

  async readOneNotification(notificationId: string) {
    try {
      // On vérifie que la notification existe en base
      const notification = await this.prisma.notification.findUnique({
        where: { id: notificationId },
      });

      // Si elle n'existe pas → erreur 404
      if (!notification) {
        throw new HttpError(
          'Notification introuvable',
          HttpStatus.NOT_FOUND,
          'NOTIFICATION_NOT_FOUND',
        );
      }

      // On met isRead à true → notification marquée comme lue
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      return { message: 'Notification lue avec succès' };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error('Erreur readOneNotification:', error);
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez réessayer plus tard.',
      );
    }
  }
  // MARQUER TOUTES LES NOTIFICATIONS COMME LUES
  async readAllNotifications(userId: string) {
    try {
      // On met isRead à true pour TOUTES les notifications non lues de cet utilisateur
      // updateMany → met à jour plusieurs enregistrements en une seule requête
      await this.prisma.notification.updateMany({
        where: { recipientId: userId, isRead: false },
        data: { isRead: true },
      });

      return { message: 'Toutes les notifications ont été  lues avec succès' };
    } catch (error) {
      console.error('Erreur readAllNotifications:', error);
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez réessayer plus tard.',
      );
    }
  }
}
