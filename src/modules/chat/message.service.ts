import { Injectable } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { PrismaService } from '_root/database/prisma.service';

@Injectable()
export class MessageService {
  constructor(
    private prisma: PrismaService,
    private conversationService: ConversationService,
  ) {}

  // Crée un message si l'utilisateur peut accéder à la chat
  async sendMessage(conversationId: string, senderId: string, content: string) {
    await this.conversationService.canAccess(senderId, conversationId);

    return this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
      },
    });
  }

  // Récupère les messages d'une chat
  async getMessages(conversationId: string, userId: string) {
    await this.conversationService.canAccess(userId, conversationId);

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Marquer un message comme lu
  async markAsRead(messageId: string, userId: string) {
    const msg = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            rentalAgreement: true,
            property: { include: { propertyAgency: true } },
          },
        },
      },
    });

    if (!msg) throw new Error('Message non trouvé');

    const isTenant = msg.conversation.rentalAgreement?.tenantId === userId;
    const isOwner =
      msg.conversation.property.propertyAgency?.ownerId === userId;

    if (!isTenant && !isOwner) throw new Error('Accès refusé');

    return this.prisma.message.update({
      where: { id: messageId },
      data: { readAt: new Date() },
    });
  }
}
