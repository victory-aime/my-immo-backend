import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtTokenService } from './jwt.service';
import { TokenExtractorService } from '../../config/services';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET_KEY,
      }),
    }),
  ],
  providers: [JwtTokenService, TokenExtractorService],
  exports: [JwtTokenService, JwtModule, TokenExtractorService],
})
export class JwtTokenModule {}
