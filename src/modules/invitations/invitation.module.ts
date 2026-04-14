import { Module } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';
import { ResendService } from '_root/modules/mail/resend.service';

@Module({
  providers: [InvitationService, ResendService],
  controllers: [InvitationController],
  exports: [InvitationService],
})
export class InvitationModule {}
