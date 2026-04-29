import { Module } from '@nestjs/common';
import { Notifications2Controller } from './notifications2.controller';
import { Notifications2Service } from './notifications2.service';
import { DatabaseModule } from '_root/database/database.module';
@Module({
  imports: [DatabaseModule],
  controllers: [Notifications2Controller],
  providers: [Notifications2Service],
  exports: [Notifications2Service], // c exporté pour être utilisé par d'autres modules (visits, leads, etc.)
})
export class Notifications2Module {}
