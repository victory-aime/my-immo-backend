import { Module } from '@nestjs/common';
import { DatabaseModule } from '_root/database/database.module';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { AgencyModule } from '_root/modules/agency/agency.module';

@Module({
  imports: [DatabaseModule, AgencyModule],
  providers: [ApplicationService],
  controllers: [ApplicationController],
})
export class ApplicationModule {}
