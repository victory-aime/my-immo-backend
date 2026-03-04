import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { ChatController } from './chat.controller';
import { ConversationService } from './conversation.service';

@Module({
  providers: [ConversationService, MessageService],
  controllers: [ChatController],
})
export class ChatModule {}
