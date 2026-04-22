import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';

@Injectable()
export class ConversationService {
  constructor(private prisma: PrismaService) {}

  // // Crée une chat
  // async createDiscussion(rentalAgreementId: string) {
  //   const rental = await this.prisma.rentalAgreement.findUnique({
  //     where: { id: rentalAgreementId },
  //     include: { property: true, tenant: true },
  //   });
  //
  //   if (!rental) throw new NotFoundException('Location non trouvée');
  //
  //   // Vérifie si une chat existe déjà
  //   const existing = await this.prisma.conversation.findFirst({
  //     where: { rentalAgreementId },
  //   });
  //   if (existing) return existing;
  //
  //   return this.prisma.conversation.create({
  //     data: {
  //       propertyId: rental.propertyId,
  //       rentalAgreementId: rental.id,
  //     },
  //   });
  // }
  //
  // // Récupère les conversations accessibles par l'utilisateur
  // async getForUser(userId: string) {
  //   return this.prisma.conversation.findMany({
  //     where: {
  //       OR: [
  //         { rentalAgreement: { tenantId: userId } },
  //         { property: { propertyAgency: { ownerId: userId } } },
  //       ],
  //     },
  //     include: { messages: true },
  //   });
  // }
  //
  // // Vérifie si un utilisateur peut accéder à une chat
  // async canAccess(userId: string, conversationId: string) {
  //   const conv = await this.prisma.conversation.findUnique({
  //     where: { id: conversationId },
  //     include: {
  //       rentalAgreement: true,
  //       property: { include: { propertyAgency: true } },
  //     },
  //   });
  //   if (!conv) throw new NotFoundException('Conversation non trouvée');
  //
  //   const isTenant = conv.rentalAgreement?.tenantId === userId;
  //   const isOwner = conv.property.propertyAgency?.ownerId === userId;
  //
  //   if (!isTenant && !isOwner) throw new ForbiddenException('Accès refusé');
  //   return conv;
  // }
}
