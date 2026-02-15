import { Module } from '@nestjs/common';
import { UsersModule } from '_root/modules/users/users.module';
import { DatabaseModule } from '_root/database/database.module';
import { AgencyController } from './agency.controller';
import { AgencyService } from './agency.service';
import { CloudinaryModule } from '_root/modules/cloudinary/cloudinary.module';

@Module({
  imports: [UsersModule, DatabaseModule, CloudinaryModule],
  controllers: [AgencyController],
  providers: [AgencyService],
  exports: [AgencyService],
})
export class AgencyModule {}
