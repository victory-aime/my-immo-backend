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

  @Post(API_URL.NOTIFICATION.REGISTER_PUSH_TOKEN)
  register(@Query('userId') userId: string, @Body() dto: RegisterTokenDto) {
    return this.svc.registerDeviceToken(userId, dto.token);
  }

  @Delete()
  deactivate() {
    return this.svc.removeDeviceToken('e');
  }

  @Post()
  sendNotification() {
    return this.firebaseService.getMessaging().send({
      token:
        'c8IjHzEGEGT7NJMu-36A7G:APA91bE4W7XokxvtSJeBnmh4O7LD_KuwftZRdT3IIYSH4vfHiiEehjVHkquvGN7SWl-pLbZBXB23rjBFddBc53g7tMaFq5IDImaGZAZVugEHZkPVHrnuUuQ',
      data: {
        title: 'Test notification',
        body: 'FCM fonctionne correctement',
      },
    });
  }
}
