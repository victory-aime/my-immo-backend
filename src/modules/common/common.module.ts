import { Module } from '@nestjs/common';
import { PermissionsService } from './services/permissions.service';
import { CommonController } from './common.controller';

@Module({
  imports: [],
  controllers: [CommonController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class CommonModule {}
