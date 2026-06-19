// // chat.gateway.ts — handleConnection appelle le guard manuellement
//
// import {
//   WebSocketGateway,
//   WebSocketServer,
//   SubscribeMessage,
//   MessageBody,
//   ConnectedSocket,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
// } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
// import { Logger } from '@nestjs/common';
// import { getAuthInstance } from '_root/lib/auth';
// import { ChatService } from './chat.service';
// import { SendMessageDto, TypingPayload } from './chat.dto';
// import { PushNotificationService } from '_root/modules/notifications/push-notification.service';
// import { NotificationType } from '../../../prisma/generated/enums';
//
// const connectedUsers = new Map<string, Set<string>>();
//
// @WebSocketGateway({
//   cors: { origin: process.env.FRONTEND_URL, credentials: true },
//   namespace: '/chat',
// })
// export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
//   private readonly logger = new Logger(ChatGateway.name);
//
//   @WebSocketServer()
//   server: Server;
//
//   constructor(
//     private readonly chatService: ChatService,
//     private readonly pushService: PushNotificationService,
//   ) {}
//
//   // ─── Connexion ──────────────────────────────────────────────────────────────
//   // IMPORTANT: handleConnection n'est PAS un message handler — @UseGuards() au
//   // niveau classe ne s'y applique jamais. On résout la session manuellement ici.
//
//   async handleConnection(client: Socket) {
//     this.logger.log(`Connexion tentée — socketId: ${client.id}`);
//
//     try {
//       const rawHeaders = client.handshake.headers;
//       const headers = new Headers();
//       Object.entries(rawHeaders).forEach(([key, value]) => {
//         if (typeof value === 'string') headers.append(key, value);
//         else if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
//       });
//
//       this.logger.debug(`Cookie reçu: ${rawHeaders.cookie ? 'présent' : 'ABSENT'}`);
//
//       const auth = getAuthInstance();
//       const session = await auth.api.getSession({ headers });
//
//       if (!session?.user?.id) {
//         this.logger.warn(`Session introuvable — socketId: ${client.id} — disconnect`);
//         client.disconnect();
//         return;
//       }
//
//       const userId = session.user.id;
//       client.data.userId = userId;
//       client.data.user = session.user;
//
//       this.logger.log(`User connecté: ${userId} — socketId: ${client.id}`);
//
//       client.join(`user:${userId}`);
//
//       if (!connectedUsers.has(userId)) connectedUsers.set(userId, new Set());
//       connectedUsers.get(userId)!.add(client.id);
//
//       this.server.emit('presence:update', { userId, online: true });
//     } catch (error) {
//       this.logger.error(`Erreur résolution session WS: ${error}`);
//       client.disconnect();
//     }
//   }
//
//   async handleDisconnect(client: Socket) {
//     const userId = client.data.userId;
//     if (!userId) return;
//
//     const sockets = connectedUsers.get(userId);
//     sockets?.delete(client.id);
//
//     if (!sockets?.size) {
//       connectedUsers.delete(userId);
//       this.server.emit('presence:update', { userId, online: false });
//     }
//   }
//
//   // ─── Message handlers ──────────────────────────────────────────────────────
//   // Ici, client.data.userId est déjà garanti (résolu dans handleConnection).
//   // Pas besoin de re-vérifier l'auth à chaque event — Socket.IO maintient
//   // l'état de la connexion pendant toute la session.
//
//   @SubscribeMessage('message:send')
//   async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() dto: SendMessageDto) {
//     const senderId = client.data.userId;
//     if (!senderId) {
//       client.disconnect();
//       return;
//     }
//
//     this.logger.log(`message:send — sender=${senderId} conv=${dto.conversationId}`);
//
//     const message = await this.chatService.sendMessage(senderId, dto);
//     client.emit('message:sent', message);
//
//     const recipientId = await this.chatService.getConversationRecipientId(
//       dto.conversationId,
//       senderId,
//     );
//     if (!recipientId) return;
//
//     const isOnline = connectedUsers.has(recipientId);
//
//     if (isOnline) {
//       this.server.to(`user:${recipientId}`).emit('message:receive', message);
//     } else {
//       await this.pushService.sendToUser(recipientId, {
//         title: 'Nouveau message',
//         body: message.content.length > 60 ? `${message.content.slice(0, 60)}…` : message.content,
//         notificationId: message.id,
//         type: NotificationType.LEAD,
//       });
//     }
//
//     return message;
//   }
//
//   @SubscribeMessage('typing:start')
//   handleTypingStart(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() data: { conversationId: string },
//   ) {
//     const payload: TypingPayload = {
//       conversationId: data.conversationId,
//       userId: client.data.userId,
//       isTyping: true,
//     };
//     client.to(`conversation:${data.conversationId}`).emit('typing:update', payload);
//   }
//
//   @SubscribeMessage('typing:stop')
//   handleTypingStop(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() data: { conversationId: string },
//   ) {
//     const payload: TypingPayload = {
//       conversationId: data.conversationId,
//       userId: client.data.userId,
//       isTyping: false,
//     };
//     client.to(`conversation:${data.conversationId}`).emit('typing:update', payload);
//   }
//
//   @SubscribeMessage('conversation:join')
//   handleJoinConversation(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() data: { conversationId: string },
//   ) {
//     client.join(`conversation:${data.conversationId}`);
//   }
//
//   @SubscribeMessage('conversation:leave')
//   handleLeaveConversation(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() data: { conversationId: string },
//   ) {
//     client.leave(`conversation:${data.conversationId}`);
//   }
//
//   isUserOnline(userId: string): boolean {
//     return connectedUsers.has(userId);
//   }
// }

// chat.gateway.ts
// FIX BUG #1+#4 : utilise le pattern ACK de Socket.IO (callback) pour que
// le front sache précisément quel message optimiste remplacer.
// FIX BUG #3 : logs détaillés autour de pushService.sendToUser pour diagnostiquer.

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { getAuthInstance } from '_root/lib/auth';
import { ChatService } from './chat.service';
import { SendMessageDto, TypingPayload } from './chat.dto';
import { PushNotificationService } from '_root/modules/notifications/push-notification.service';
import { NotificationType } from '../../../prisma/generated/enums';

const connectedUsers = new Map<string, Set<string>>();

interface SendMessageWithTempId extends SendMessageDto {
  tempId?: string;
}

type SendMessageAck = (response: { success: boolean; message?: any; error?: string }) => void;

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly pushService: PushNotificationService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Connexion tentée — socketId: ${client.id}`);

    try {
      const rawHeaders = client.handshake.headers;
      const headers = new Headers();
      Object.entries(rawHeaders).forEach(([key, value]) => {
        if (typeof value === 'string') headers.append(key, value);
        else if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
      });

      const auth = getAuthInstance();
      const session = await auth.api.getSession({ headers });

      if (!session?.user?.id) {
        this.logger.warn(`Session introuvable — socketId: ${client.id}`);
        client.disconnect();
        return;
      }

      const userId = session.user.id;
      client.data.userId = userId;
      client.data.user = session.user;

      client.join(`user:${userId}`);

      if (!connectedUsers.has(userId)) connectedUsers.set(userId, new Set());
      connectedUsers.get(userId)!.add(client.id);

      this.logger.log(
        `User connecté: ${userId} — socketId: ${client.id} — total sockets actifs: ${connectedUsers.get(userId)!.size}`,
      );

      this.server.emit('presence:update', { userId, online: true });
    } catch (error) {
      this.logger.error(`Erreur résolution session WS: ${error}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (!userId) return;

    const sockets = connectedUsers.get(userId);
    sockets?.delete(client.id);

    this.logger.log(`Déconnexion — userId: ${userId} — sockets restants: ${sockets?.size ?? 0}`);

    if (!sockets?.size) {
      connectedUsers.delete(userId);
      this.server.emit('presence:update', { userId, online: false });
    }
  }

  // ─── Envoi de message avec ACK ─────────────────────────────────────────────

  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageWithTempId,
    // Le 3e argument est le callback d'ACK injecté par Socket.IO si le front
    // l'a fourni dans son emit(). NestJS le passe automatiquement.
    ack?: SendMessageAck,
  ) {
    const senderId = client.data.userId;
    if (!senderId) {
      client.disconnect();
      return;
    }

    this.logger.log(`message:send — sender=${senderId} conv=${dto.conversationId}`);

    try {
      const message = await this.chatService.sendMessage(senderId, dto);
      this.logger.log(`Message sauvegardé — id=${message.id}`);

      // Répond AU SENDER précisément via l'ACK — remplace le bon message optimiste
      ack?.({ success: true, message });

      const recipientId = await this.chatService.getConversationRecipientId(
        dto.conversationId,
        senderId,
      );

      if (!recipientId) {
        this.logger.warn(`Aucun destinataire trouvé pour conv=${dto.conversationId}`);
        return;
      }

      const isOnline = connectedUsers.has(recipientId);
      this.logger.log(
        `Destinataire=${recipientId} — online=${isOnline} — sockets connectés: [${[...connectedUsers.keys()].join(', ')}]`,
      );

      if (isOnline) {
        this.server.to(`user:${recipientId}`).emit('message:receive', message);
        this.logger.log(`Message émis en temps réel à user:${recipientId}`);
      } else {
        this.logger.log(`Destinataire offline — envoi push FCM à ${recipientId}`);

        try {
          await this.pushService.sendToUser(recipientId, {
            title: 'Nouveau message',
            body:
              message.content.length > 60 ? `${message.content.slice(0, 60)}…` : message.content,
            notificationId: message.id,
            type: NotificationType.LEAD,
          });
          this.logger.log(`Push FCM envoyé avec succès à ${recipientId}`);
        } catch (pushError) {
          // FIX BUG #3 : on catch explicitement ici — si sendToUser throw
          // silencieusement avant, l'erreur disparaissait sans log
          this.logger.error(`Échec envoi push FCM à ${recipientId}: ${pushError}`);
        }
      }
    } catch (error) {
      this.logger.error(`Échec traitement message:send: ${error}`);
      ack?.({ success: false, error: String(error) });
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const payload: TypingPayload = {
      conversationId: data.conversationId,
      userId: client.data.userId,
      isTyping: true,
    };
    client.to(`conversation:${data.conversationId}`).emit('typing:update', payload);
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const payload: TypingPayload = {
      conversationId: data.conversationId,
      userId: client.data.userId,
      isTyping: false,
    };
    client.to(`conversation:${data.conversationId}`).emit('typing:update', payload);
  }

  @SubscribeMessage('conversation:join')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conversation:${data.conversationId}`);
    this.logger.debug(`socket ${client.id} a rejoint conversation:${data.conversationId}`);
  }

  @SubscribeMessage('conversation:leave')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
  }

  isUserOnline(userId: string): boolean {
    return connectedUsers.has(userId);
  }
}
