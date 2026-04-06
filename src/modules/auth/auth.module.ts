import { Module } from '@nestjs/common';
import { UsersModule } from '_root/modules/users/users.module';
import { AuthService } from '_root/modules/auth/auth.service';
import { AuthController } from '_root/modules/auth/auth.controller';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
