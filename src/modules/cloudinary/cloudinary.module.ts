import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { ConfigModule } from '@nestjs/config';
import { UploadsService } from '_root/modules/cloudinary/uploads.service';

@Module({
  imports: [ConfigModule],
  providers: [CloudinaryService, UploadsService],
  exports: [CloudinaryService, UploadsService],
})
export class CloudinaryModule {}
