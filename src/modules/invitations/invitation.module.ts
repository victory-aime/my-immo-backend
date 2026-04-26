import { Module } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';
import { ResendService } from '_root/modules/mail/resend.service';
import { AgencyModule } from '../agency/agency.module';

@Module({
  imports: [AgencyModule],
  providers: [InvitationService, ResendService],
  controllers: [InvitationController],
  exports: [InvitationService],
})
export class InvitationModule {}
