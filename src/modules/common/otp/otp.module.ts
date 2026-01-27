import { Module } from '@nestjs/common';

import { PrismaService } from '_root/config/services';
import { OtpService } from './otp.service';

import { OtpController } from './otp.controller';
import { UsersModule } from '../../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [PrismaService, OtpService],
  controllers: [OtpController],
  exports: [OtpService],
})
export class OtpModule {}
