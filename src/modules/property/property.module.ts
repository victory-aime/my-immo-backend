import { Module } from '@nestjs/common';
import { DatabaseModule } from '_root/database/database.module';
import { CloudinaryModule } from '_root/modules/cloudinary/cloudinary.module';
import { PropertyController } from '_root/modules/property/property.controller';
import { PropertyService } from '_root/modules/property/property.service';
import { AgencyModule } from '_root/modules/agency/agency.module';

@Module({
  imports: [DatabaseModule, CloudinaryModule, AgencyModule],
  controllers: [PropertyController],
  providers: [PropertyService],
})
export class PropertyModule {}
