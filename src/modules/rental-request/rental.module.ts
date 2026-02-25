import { Module } from '@nestjs/common';
import { DatabaseModule } from '_root/database/database.module';
import { RentalService } from './rental.service';
import { RentalController } from './rental.controller';

@Module({
  imports: [DatabaseModule],
  providers: [RentalService],
  controllers: [RentalController],
})
export class RentalModule {}
