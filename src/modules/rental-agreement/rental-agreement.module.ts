import { Module } from '@nestjs/common';
import { RentalAgreementController } from './rental-agreement.controller';
import { RentalAgreementService } from './rental-agreement.service';
import { AgencyModule } from '_root/modules/agency/agency.module';

@Module({
  imports: [AgencyModule],
  providers: [RentalAgreementService],
  controllers: [RentalAgreementController],
})
export class RentalAgreementModule {}
