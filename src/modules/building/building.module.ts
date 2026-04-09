import { Module } from '@nestjs/common';
import { CloudinaryModule } from '_root/modules/cloudinary/cloudinary.module';
import { AgencyModule } from '_root/modules/agency/agency.module';
import { BuildingService } from '_root/modules/building/building.service';
import { BuildingController } from '_root/modules/building/building.controller';

@Module({
  imports: [CloudinaryModule, AgencyModule],
  providers: [BuildingService],
  controllers: [BuildingController],
})
export class BuildingModule {}
