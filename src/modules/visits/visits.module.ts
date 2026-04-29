import { Module } from '@nestjs/common';
import { VisitsController } from './visits.controller';
import { VisitsService } from './visits.service';
import { DatabaseModule } from '_root/database/database.module';
import { Notifications2Module } from '_root/modules/notifications2/notifications2.module';

@Module({
  imports: [DatabaseModule, Notifications2Module], //  ajouté
  controllers: [VisitsController],
  providers: [VisitsService],
  exports: [VisitsService],
})
export class VisitsModule {}
