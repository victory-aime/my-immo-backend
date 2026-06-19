import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';
import {
  SendMessageDto,
  CreateConversationDto,
  GetMessagesDto,
  ToggleReactionDto,
  MessagePayload,
} from './chat.dto';
import {} from '../../config/enum';

const DEFAULT_PAGE_SIZE = 30;

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Conversation ───────────────────────────────────────────────────────────

  /**
   * Crée ou retourne la conversation existante entre deux users.
   * 1-to-1 : on cherche une conversation où les deux participants sont présents.
   */
  async findOrCreateConversation(currentUserId: string, dto: CreateConversationDto) {
    const { recipientId } = dto;

    if (currentUserId === recipientId) {
      throw new ForbiddenException('Impossible de créer une conversation avec soi-même');
    }

    // Cherche une conversation existante entre les deux users
    const existing = await this.prisma.conversation.findFirst({
      where: {
        participants: {
          every: {
            userId: { in: [currentUserId, recipientId] },
          },
        },
        AND: {
          participants: {
            // S'assure qu'il y a exactement 2 participants (pas un groupe)
            every: { userId: { in: [currentUserId, recipientId] } },
          },
        },
      },
      include: {
        participants: { include: { user: { select: { id: true, name: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        participants: {
          createMany: {
            data: [{ userId: currentUserId }, { userId: recipientId }],
          },
        },
      },
      include: {
        participants: { include: { user: { select: { id: true, name: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  async getUserConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        participants: {
          where: { userId: { not: userId } }, // l'interlocuteur uniquement
          include: { user: { select: { id: true, name: true } } },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // dernier message pour la preview
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // ─── Messages ───────────────────────────────────────────────────────────────

  async sendMessage(senderId: string, dto: SendMessageDto): Promise<MessagePayload> {
    // Vérifie que le sender est bien participant
    await this.assertParticipant(senderId, dto.conversationId);

    const message = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId: dto.conversationId,
          senderId,
          content: dto.content,
        },
      });

      // Met à jour updatedAt de la conversation (tri liste des convs)
      await tx.conversation.update({
        where: { id: dto.conversationId },
        data: { updatedAt: new Date() },
      });

      return msg;
    });

    return this.toMessagePayload({
      ...message,
      metadata: message.metadata as Record<string, string[]> | null,
    });
  }

  async getMessages(userId: string, dto: GetMessagesDto) {
    const { conversationId, cursor, limit = DEFAULT_PAGE_SIZE } = dto;

    await this.assertParticipant(userId, conversationId);

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
        ...(cursor && {
          createdAt: {
            lt: (await this.prisma.message.findUnique({ where: { id: cursor } }))?.createdAt,
          },
        }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;

    return {
      items: items.map((value) => ({
        ...value,
        metadata: value.metadata as Record<string, string[]> | null,
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  async toggleReaction(userId: string, dto: ToggleReactionDto) {
    const message = await this.prisma.message.findUnique({
      where: { id: dto.messageId },
    });

    if (!message) throw new NotFoundException('Message introuvable');
    await this.assertParticipant(userId, message.conversationId);

    const reactions = (message.metadata as Record<string, string[]>) ?? {};
    const users = reactions[dto.emoji] ?? [];
    const alreadyReacted = users.includes(userId);

    const updated = alreadyReacted ? users.filter((id) => id !== userId) : [...users, userId];

    const newReactions = {
      ...reactions,
      [dto.emoji]: updated,
    };

    if (newReactions[dto.emoji].length === 0) {
      delete newReactions[dto.emoji];
    }

    return this.prisma.message.update({
      where: { id: dto.messageId },
      data: { metadata: newReactions },
    });
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  async getConversationRecipientId(
    conversationId: string,
    currentUserId: string,
  ): Promise<string | null> {
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: { not: currentUserId },
      },
    });
    return participant?.userId ?? null;
  }

  private async assertParticipant(userId: string, conversationId: string): Promise<void> {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) throw new ForbiddenException('Accès à cette conversation refusé');
  }

  private toMessagePayload(message: MessagePayload): MessagePayload {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      type: message.type,
      metadata: message.metadata ?? null,
      createdAt: message.createdAt,
    };
  }
}
