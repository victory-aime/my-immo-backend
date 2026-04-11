import { EmailService } from './mail.service';
import { Module } from '@nestjs/common';
import { AuthMailInitializer } from '_root/modules/mail/mail.initializer';
import { ResendService } from '_root/modules/mail/resend.service';

@Module({
  providers: [EmailService, AuthMailInitializer, ResendService],
  exports: [EmailService],
})
export class EmailModule {}
