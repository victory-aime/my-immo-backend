import { Module } from '@nestjs/common';
import { CloudinaryModule } from '_root/modules/cloudinary/cloudinary.module';
import { AgencyModule } from '_root/modules/agency/agency.module';
import { LandController } from '_root/modules/land/land.controller';
import { LandService } from '_root/modules/land/land.service';

@Module({
  imports: [CloudinaryModule, AgencyModule],
  controllers: [LandController],
  providers: [LandService],
})
export class LandModule {}
