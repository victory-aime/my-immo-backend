import { Module } from '@nestjs/common';
import { ContactService } from './contact.service';
import { DatabaseModule } from '_root/database/database.module';
import { ContactController } from './contact.controller';

@Module({
  imports: [DatabaseModule],
  providers: [ContactService],
  controllers: [ContactController],
})
export class ContactModule {}
