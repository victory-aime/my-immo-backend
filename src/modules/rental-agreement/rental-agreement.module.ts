import { Module } from '@nestjs/common';
import { RentalAgreementController } from './rental-agreement.controller';
import { RentalAgreementService } from './rental-agreement.service';

@Module({
  providers: [RentalAgreementService],
  controllers: [RentalAgreementController],
})
export class RentalAgreementModule {}
