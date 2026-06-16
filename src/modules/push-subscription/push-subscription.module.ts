import { Module } from '@nestjs/common';
import { PushSubscriptionService } from './push-subscription.service';
import { PushSubscriptionController } from './push-subscription.controller';
import { FirebaseService } from '_root/modules/common/services/firebase.service';

@Module({
  controllers: [PushSubscriptionController],
  providers: [PushSubscriptionService, FirebaseService],
  exports: [PushSubscriptionService],
})
export class PushSubscriptionModule {}
