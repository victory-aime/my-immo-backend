import { NotificationType } from '../../../prisma/generated/enums';

export class NotificationsDto {
  recipientId: string;
  senderId?: string;
  agencyId?: string;
  type: NotificationType;
  content: string;
}
