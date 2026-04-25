import { Module } from '@nestjs/common';
import { PermissionsService } from './services/permissions.service';
import { CommonController } from './common.controller';
import { CommonService } from '_root/modules/common/common.service';

@Module({
  imports: [],
  controllers: [CommonController],
  providers: [PermissionsService, CommonService],
  exports: [PermissionsService],
})
export class CommonModule {}
