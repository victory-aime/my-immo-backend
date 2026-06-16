import { Injectable, Logger } from '@nestjs/common';
import { RegisterSubscriptionDto } from './register-subscription.dto';
import { PrismaService } from '_root/database/prisma.service';

@Injectable()
export class PushSubscriptionService {
  private readonly logger = new Logger(PushSubscriptionService.name);
  constructor(private readonly prisma: PrismaService) {}

  /** Upsert — même appareil = mise à jour du token, pas de doublon */
  register(userId: string, dto: RegisterSubscriptionDto) {
    const { deviceId, ...rest } = dto;
    return this.prisma.pushSubscription.upsert({
      where: { userId_deviceId: { userId, deviceId } },
      create: { userId, deviceId, ...rest, isActive: true },
      update: { ...rest, isActive: true, updatedAt: new Date() },
    });
  }

  deactivate(userId: string, deviceId: string) {
    return this.prisma.pushSubscription.updateMany({
      where: { userId, deviceId },
      data: { isActive: false },
    });
  }

  /**
   * Upsert du token FCM pour un utilisateur.
   * Utilise `token` comme clé unique pour éviter les doublons
   * si l'utilisateur se connecte depuis plusieurs appareils.
   */
  async registerDeviceToken(userId: string, fcmToken: string): Promise<void> {
    await this.prisma.deviceToken.upsert({
      where: { token: fcmToken },
      update: {
        userId, // réattribue si le token change de propriétaire (rare mais possible)
        updatedAt: new Date(),
      },
      create: {
        token: fcmToken,
        userId,
      },
    });

    this.logger.log(`Token enregistré pour user=${userId}`);
  }

  /**
   * Récupère tous les tokens actifs d'un utilisateur.
   * Utile pour envoyer une notification à toutes ses sessions.
   */
  async getTokensByUserId(userId: string): Promise<string[]> {
    const rows = await this.prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true },
    });
    return rows.map((r) => r.token);
  }

  /**
   * Supprime un token (ex: logout, token expiré côté FCM).
   */
  async removeDeviceToken(fcmToken: string): Promise<void> {
    await this.prisma.deviceToken.deleteMany({
      where: { token: fcmToken },
    });
  }
}
