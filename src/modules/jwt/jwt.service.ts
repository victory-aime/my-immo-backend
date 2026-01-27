import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as process from 'process';
import { JwtDto } from './jwt.dto';
import { JWT_TIME } from '../../config/enum';

@Injectable()
export class JwtTokenService {
  constructor(private readonly jwtService: JwtService) {}

  generateAccessToken(data: JwtDto): string {
    return this.jwtService.sign(
      { sub: data.id, role: data.role, permissions: data.permissions },
      {
        secret: process.env.JWT_SECRET_KEY,
        expiresIn: JWT_TIME._15_MINUTES,
      },
    );
  }

  generateRefreshToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId },
      {
        secret: process.env.REFRESH_SECRET,
        expiresIn: JWT_TIME._1_DAY,
      },
    );
  }

  verifyAccessToken(token: string) {
    return this.jwtService.verify(token, {
      secret: process.env.JWT_SECRET_KEY,
    });
  }

  verifyRefreshToken(token: string) {
    return this.jwtService.verify(token, {
      secret: process.env.REFRESH_SECRET,
    });
  }
}
