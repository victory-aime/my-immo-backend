import { ConversationService } from '_root/modules/chat/conversation.service';
import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { MessageService } from '_root/modules/chat/message.service';
import { API_URL } from '_root/config/api';

@Controller()
export class ChatController {
  // constructor(
  //   private readonly conversationService: ConversationService,
  //   private readonly messageService: MessageService,
  // ) {}
  //
  // @Post(API_URL.CHAT.CREATE_CONV)
  // async createNewConversation(
  //   @Query('rentalAgreementId') rentalAgreementId: string,
  // ) {
  //   return this.conversationService.createDiscussion(rentalAgreementId);
  // }
  // @Get(API_URL.CHAT.GET_CONV)
  // async getMyConversation(@Query('userId') userId: string) {
  //   return this.conversationService.getForUser(userId);
  // }
  //
  // @Get(API_URL.CHAT.GET_MESSAGE)
  // async getMessages(
  //   @Query('userId') userId: string,
  //   @Query('conversationId') conversationId: string,
  // ) {
  //   return this.messageService.getMessages(conversationId, userId);
  // }
  //
  // @Post(API_URL.CHAT.SEND_MESSAGE)
  // async sendMessage(
  //   @Query('conversationId') conversationId: string,
  //   @Body() data: { message: string },
  //   @Query('userId') userId: string,
  // ) {
  //   return this.messageService.sendMessage(
  //     conversationId,
  //     userId,
  //     data?.message,
  //   );
  // }
  //
  // @Patch(API_URL.CHAT.READ_MESSAGE)
  // async markAsRead(
  //   @Query('messageId') messageId: string,
  //   @Query('userId') userId: string,
  // ) {
  //   return this.messageService.markAsRead(messageId, userId);
  // }
}
