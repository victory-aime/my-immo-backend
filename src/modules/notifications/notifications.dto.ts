import { NotificationType } from '_prisma/enums';

export class NotificationsDto {
  recipientId: string;
  senderId?: string;
  agencyId?: string;
  type: NotificationType;
  content: string;
}
