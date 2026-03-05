import { Module } from '@nestjs/common';
import { DatabaseModule } from '_root/database/database.module';
import { RentalService } from './rental.service';
import { RentalController } from './rental.controller';
import { NotificationsModule } from '_root/modules/notifications/notifications.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  providers: [RentalService],
  controllers: [RentalController],
})
export class RentalModule {}
