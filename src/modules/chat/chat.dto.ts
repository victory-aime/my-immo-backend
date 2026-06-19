// modules/chat/dto/chat.dto.ts
import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}

export class CreateConversationDto {
  @IsString()
  @IsNotEmpty()
  recipientId: string; // userId du destinataire
}

export class GetMessagesDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsOptional()
  @IsString()
  cursor?: string; // messageId — pagination par curseur

  @IsOptional()
  limit?: number;
}

export class ToggleReactionDto {
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(8) // un emoji
  emoji: string;
}

// ─── Payloads Socket émis vers le front ──────────────────────────────────────

export interface MessagePayload {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  metadata: Record<string, string[]> | null;
  createdAt: Date;
}

export interface TypingPayload {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}
