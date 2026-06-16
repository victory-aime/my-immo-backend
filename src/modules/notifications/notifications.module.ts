import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { CommonModule } from '_root/modules/common/common.module';
import { PushSubscriptionModule } from '_root/modules/push-subscription/push-subscription.module';

@Module({
  imports: [CommonModule, PushSubscriptionModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
