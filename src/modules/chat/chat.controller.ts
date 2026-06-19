import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateConversationDto, ToggleReactionDto } from './chat.dto';

@Controller('v1/secure/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /** Crée ou récupère une conversation avec un user */
  @Post('conversations')
  createConversation(@Query('userId') userId: string, @Body() dto: CreateConversationDto) {
    return this.chatService.findOrCreateConversation(userId, dto);
  }

  /** Liste toutes les conversations du user connecté */
  @Get('conversations')
  getConversations(@Query('userId') userId: string) {
    return this.chatService.getUserConversations(userId);
  }

  /** Historique paginé des messages d'une conversation */
  @Get('conversations/messages')
  getMessages(
    @Query('userId') userId: string,
    @Query('conversationId') conversationId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.getMessages(userId, { conversationId, cursor, limit });
  }

  /** Toggle réaction sur un message */
  @Post('messages/reaction')
  toggleReaction(@Query('userId') userId: string, @Body() dto: ToggleReactionDto) {
    return this.chatService.toggleReaction(userId, dto);
  }
}
