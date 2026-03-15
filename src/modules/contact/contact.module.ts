import { Module } from '@nestjs/common';
import { ContactService } from './contact.service';
import { DatabaseModule } from '_root/database/database.module';
import { ContactController } from './contact.controller';
import { AgencyModule } from '_root/modules/agency/agency.module';

@Module({
  imports: [DatabaseModule, AgencyModule],
  providers: [ContactService],
  controllers: [ContactController],
})
export class ContactModule {}
