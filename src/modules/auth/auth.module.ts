import { Module } from '@nestjs/common';
import { UsersModule } from '_root/modules/users/users.module';
import { AuthService } from '_root/modules/auth/auth.service';
import { AuthController } from '_root/modules/auth/auth.controller';
import { EmailModule } from '_root/modules/mail/mail.module';

@Module({
  imports: [UsersModule, EmailModule],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
