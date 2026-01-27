import { UsersService } from './users.service';
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { PrismaService } from '../../config/services';
import { JwtTokenModule } from '../jwt/jwt.module';

@Module({
  imports: [JwtTokenModule],
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
