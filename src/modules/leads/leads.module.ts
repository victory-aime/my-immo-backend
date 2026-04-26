import { Module } from '@nestjs/common';
import { DatabaseModule } from '_root/database/database.module';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { AgencyModule } from '../agency/agency.module';

@Module({
  imports: [DatabaseModule, AgencyModule],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
