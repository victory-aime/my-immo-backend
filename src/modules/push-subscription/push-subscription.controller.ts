import { Body, Controller, Delete, Post, Query } from '@nestjs/common';
import { PushSubscriptionService } from './push-subscription.service';
import { RegisterTokenDto } from './register-subscription.dto';
import { API_URL } from '_root/config/api';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { FirebaseService } from '_root/modules/common/services/firebase.service';

@Controller()
@AllowAnonymous()
export class PushSubscriptionController {
  constructor(
    private readonly svc: PushSubscriptionService,
    private readonly firebaseService: FirebaseService,
  ) {}

  @Post()
  sendNotification(@Query('token') token: string) {
    return this.firebaseService.getMessaging().send({
      token,
      data: {
        title: 'Test notification',
        body: 'salem test notification',
        notificationId: '1234',
      },
    });
  }
}
