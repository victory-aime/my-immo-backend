import { Module } from '@nestjs/common';
import { JwtTokenModule } from '../jwt/jwt.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../../config/services';

@Module({
  imports: [UsersModule, JwtTokenModule],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
  exports: [AuthService],
})
export class AuthModule {}
