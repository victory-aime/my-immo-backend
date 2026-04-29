import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NotificationType } from '../../../prisma/generated/enums';

// DTO : ENVOYER UNE NOTIFICATION (usage interne entre services)

export class SendNotificationDto {
  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.VISIT,
    description: 'Type de la notification',
  })
  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    example: 'c3RfrJv8MBu4PYbuUJer',
    description: "ID de l'utilisateur qui recoit la notification",
  })
  @IsNotEmpty()
  @IsString()
  recipientId: string;

  @ApiPropertyOptional({
    example: 'Visite planifiee',
    description: 'Titre de la notification',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    example: 'Votre visite pour le bien Appartement F3 a ete planifiee.',
    description: 'Contenu de la notification',
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({
    example: 'bcc425a5-e6e4-48ac-8ac4-1671d814cbc2',
    description: "ID de l'agence concernee (optionnel)",
  })
  @IsOptional()
  @IsString()
  agencyId?: string;

  @ApiPropertyOptional({
    example: 'FnYwizdvfYyxGtdQcP8eW7y...',
    description: "ID de l'utilisateur qui envoie la notification (optionnel)",
  })
  @IsOptional()
  @IsString()
  senderId?: string;
}
